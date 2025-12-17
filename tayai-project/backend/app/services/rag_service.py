"""
RAG Service - Retrieval-Augmented Generation

Handles the core RAG pipeline:
1. Content chunking and embedding generation
2. Vector storage in Pinecone
3. Semantic search and context retrieval
"""
import re
import logging
from typing import List, Dict, Tuple, Optional, Union
from dataclasses import dataclass, field

from app.core.config import settings
from app.core.clients import get_openai_client, get_pinecone_index

logger = logging.getLogger(__name__)


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class ChunkConfig:
    """Configuration for content chunking."""
    chunk_size: int = 500
    chunk_overlap: int = 50
    min_chunk_size: int = 100
    separators: List[str] = field(default_factory=lambda: ["\n\n", "\n", ". "])


@dataclass
class RetrievalResult:
    """Single result from context retrieval."""
    content: str
    score: float
    metadata: Dict
    chunk_id: str


@dataclass
class ContextResult:
    """Complete context retrieval result with sources."""
    context: str
    sources: List[Dict]
    total_matches: int
    average_score: float


# =============================================================================
# RAG Service
# =============================================================================

class RAGService:
    """
    Service for RAG operations.
    
    Handles embedding generation, vector storage, and semantic search
    to provide relevant context for AI responses.
    """
    
    def __init__(self, chunk_config: Optional[ChunkConfig] = None):
        self.chunk_config = chunk_config or ChunkConfig()
        self.embedding_model = settings.OPENAI_EMBEDDING_MODEL
    
    # -------------------------------------------------------------------------
    # Context Retrieval
    # -------------------------------------------------------------------------
    
    async def retrieve_context(
        self,
        query: str,
        top_k: int = 5,
        score_threshold: float = 0.7,
        filter_metadata: Optional[Dict] = None,
        include_sources: bool = False
    ) -> Union[str, ContextResult]:
        """
        Retrieve relevant context from knowledge base.
        
        Args:
            query: The search query
            top_k: Maximum number of results
            score_threshold: Minimum relevance score (0-1)
            filter_metadata: Optional Pinecone metadata filters
            include_sources: Whether to return detailed source info
        
        Returns:
            Context string or ContextResult with sources
        """
        try:
            embedding = await self._generate_embedding(query)
            
            results = get_pinecone_index().query(
                vector=embedding,
                top_k=top_k,
                include_metadata=True,
                filter=filter_metadata
            )
            
            # Filter by score threshold
            matches = [
                RetrievalResult(
                    content=m.metadata.get("content", ""),
                    score=m.score,
                    metadata=m.metadata,
                    chunk_id=m.id
                )
                for m in results.matches
                if m.score >= score_threshold
            ]
            
            if not matches:
                logger.info(f"No results above {score_threshold} for: {query[:50]}...")
                return ContextResult("", [], 0, 0.0) if include_sources else ""
            
            # Format context
            context_parts = [self._format_context(m) for m in matches]
            context = "\n\n---\n\n".join(context_parts)
            avg_score = sum(m.score for m in matches) / len(matches)
            
            sources = [
                {
                    "title": m.metadata.get("title", "Unknown"),
                    "category": m.metadata.get("category", ""),
                    "score": round(m.score, 3),
                    "chunk_id": m.chunk_id
                }
                for m in matches
            ]
            
            if include_sources:
                return ContextResult(context, sources, len(matches), round(avg_score, 3))
            return context
            
        except Exception as e:
            logger.error(f"Error retrieving context: {e}")
            return ContextResult("", [], 0, 0.0) if include_sources else ""
    
    def _format_context(self, result: RetrievalResult) -> str:
        """Format a single context piece."""
        title = result.metadata.get("title", "")
        category = result.metadata.get("category", "")
        
        header = ""
        if title:
            header = f"**{title}**"
            if category:
                header += f" ({category})"
            header += "\n"
        
        return f"{header}{result.content}"
    
    # -------------------------------------------------------------------------
    # Embedding Generation
    # -------------------------------------------------------------------------
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text."""
        response = await get_openai_client().embeddings.create(
            model=self.embedding_model,
            input=text
        )
        return response.data[0].embedding
    
    async def _generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts in batch."""
        response = await get_openai_client().embeddings.create(
            model=self.embedding_model,
            input=texts
        )
        return [item.embedding for item in response.data]
    
    # -------------------------------------------------------------------------
    # Content Indexing
    # -------------------------------------------------------------------------
    
    async def index_content(
        self,
        content: str,
        metadata: Dict,
        content_id: str,
        chunk_content: bool = True
    ) -> Tuple[bool, List[str]]:
        """
        Index content in Pinecone.
        
        Args:
            content: The content to index
            metadata: Metadata to store with vectors
            content_id: Unique identifier for the content
            chunk_content: Whether to chunk the content
        
        Returns:
            Tuple of (success, list of chunk IDs)
        """
        try:
            if chunk_content:
                return await self._index_chunked(content, metadata, content_id)
            return await self._index_single(content, metadata, content_id)
        except Exception as e:
            logger.error(f"Error indexing content: {e}")
            return False, []
    
    async def _index_chunked(
        self,
        content: str,
        metadata: Dict,
        content_id: str
    ) -> Tuple[bool, List[str]]:
        """Index content as multiple chunks."""
        chunks = self._chunk_content(content, metadata.get("title", ""))
        
        if not chunks:
            logger.warning(f"No chunks generated for: {content_id}")
            return False, []
        
        # Generate embeddings in batch
        texts = [c["text"] for c in chunks]
        embeddings = await self._generate_embeddings_batch(texts)
        
        # Prepare vectors
        chunk_ids = []
        vectors = []
        
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_id = f"{content_id}_chunk_{i}"
            chunk_ids.append(chunk_id)
            
            vectors.append({
                "id": chunk_id,
                "values": embedding,
                "metadata": {
                    **metadata,
                    "content": chunk["text"],
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "parent_id": content_id
                }
            })
        
        # Upsert in batches
        index = get_pinecone_index()
        for i in range(0, len(vectors), 100):
            index.upsert(vectors=vectors[i:i + 100])
        
        logger.info(f"Indexed {len(chunk_ids)} chunks for: {content_id}")
        return True, chunk_ids
    
    async def _index_single(
        self,
        content: str,
        metadata: Dict,
        content_id: str
    ) -> Tuple[bool, List[str]]:
        """Index content as a single vector."""
        embedding = await self._generate_embedding(content)
        
        get_pinecone_index().upsert(vectors=[{
            "id": content_id,
            "values": embedding,
            "metadata": {**metadata, "content": content}
        }])
        
        logger.info(f"Indexed single vector: {content_id}")
        return True, [content_id]
    
    # -------------------------------------------------------------------------
    # Content Management
    # -------------------------------------------------------------------------
    
    async def delete_content(self, content_id: str) -> bool:
        """Delete content and all its chunks from Pinecone."""
        try:
            index = get_pinecone_index()
            # Delete chunks by parent_id filter
            index.delete(filter={"parent_id": {"$eq": content_id}})
            # Also delete main ID
            index.delete(ids=[content_id])
            
            logger.info(f"Deleted content: {content_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting content: {e}")
            return False
    
    async def update_content(
        self,
        content: str,
        metadata: Dict,
        content_id: str
    ) -> bool:
        """Update existing content (delete and re-index)."""
        await self.delete_content(content_id)
        success, _ = await self.index_content(content, metadata, content_id)
        return success
    
    async def search_similar(
        self,
        query: str,
        top_k: int = 10,
        filter_metadata: Optional[Dict] = None
    ) -> List[Dict]:
        """Search for similar content without formatting."""
        embedding = await self._generate_embedding(query)
        
        results = get_pinecone_index().query(
            vector=embedding,
            top_k=top_k,
            include_metadata=True,
            filter=filter_metadata
        )
        
        return [
            {"id": m.id, "score": m.score, "metadata": m.metadata}
            for m in results.matches
        ]
    
    async def get_index_stats(self) -> Dict:
        """Get statistics about the Pinecone index."""
        try:
            stats = get_pinecone_index().describe_index_stats()
            return {
                "total_vectors": stats.total_vector_count,
                "dimension": stats.dimension,
                "namespaces": dict(stats.namespaces) if stats.namespaces else {}
            }
        except Exception as e:
            logger.error(f"Error getting index stats: {e}")
            return {}
    
    # -------------------------------------------------------------------------
    # Content Chunking
    # -------------------------------------------------------------------------
    
    def _chunk_content(self, content: str, title: str = "") -> List[Dict]:
        """Split content into chunks for embedding."""
        content = content.strip()
        if not content:
            return []
        
        # Return as single chunk if small enough
        if len(content) <= self.chunk_config.chunk_size:
            return [{"text": content, "index": 0, "total_chunks": 1}]
        
        # Split by paragraphs, then combine to target size
        raw_chunks = self._split_by_paragraphs(content)
        
        # Add title to first chunk
        chunks = []
        for i, text in enumerate(raw_chunks):
            chunk_text = text.strip()
            if i == 0 and title:
                chunk_text = f"{title}\n\n{chunk_text}"
            chunks.append({
                "text": chunk_text,
                "index": i,
                "total_chunks": len(raw_chunks)
            })
        
        return chunks
    
    def _split_by_paragraphs(self, content: str) -> List[str]:
        """Split content by paragraphs, combining small ones."""
        chunks = []
        current = ""
        
        for para in re.split(r'\n\n+', content):
            para = para.strip()
            if not para:
                continue
            
            # If paragraph is too large, split by sentences
            if len(para) > self.chunk_config.chunk_size:
                if current:
                    chunks.append(current)
                    current = ""
                
                for sentence in re.split(r'(?<=[.!?])\s+', para):
                    if len(current) + len(sentence) <= self.chunk_config.chunk_size:
                        current += (" " if current else "") + sentence
                    else:
                        if current:
                            chunks.append(current)
                        current = sentence
            else:
                # Combine paragraphs if they fit
                if len(current) + len(para) + 2 <= self.chunk_config.chunk_size:
                    current += ("\n\n" if current else "") + para
                else:
                    if current:
                        chunks.append(current)
                    current = para
        
        if current:
            chunks.append(current)
        
        return chunks
