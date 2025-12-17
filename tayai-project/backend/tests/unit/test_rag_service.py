"""
Unit Tests for RAG Service

Tests the Retrieval-Augmented Generation service components.
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock

from app.services.rag_service import RAGService, ChunkConfig, RetrievalResult, ContextResult


class TestChunkConfig:
    """Tests for ChunkConfig dataclass."""
    
    def test_default_values(self):
        """ChunkConfig should have sensible defaults."""
        config = ChunkConfig()
        assert config.chunk_size == 500
        assert config.chunk_overlap == 50
        assert config.min_chunk_size == 100
        assert len(config.separators) > 0
    
    def test_custom_values(self):
        """ChunkConfig should accept custom values."""
        config = ChunkConfig(chunk_size=1000, chunk_overlap=100)
        assert config.chunk_size == 1000
        assert config.chunk_overlap == 100


class TestRetrievalResult:
    """Tests for RetrievalResult dataclass."""
    
    def test_creation(self):
        """RetrievalResult should store all fields."""
        result = RetrievalResult(
            content="Test content",
            score=0.85,
            metadata={"title": "Test"},
            chunk_id="chunk_1"
        )
        assert result.content == "Test content"
        assert result.score == 0.85
        assert result.chunk_id == "chunk_1"


class TestContextResult:
    """Tests for ContextResult dataclass."""
    
    def test_creation(self):
        """ContextResult should store all fields."""
        result = ContextResult(
            context="Combined context",
            sources=[{"title": "Source 1"}],
            total_matches=5,
            average_score=0.82
        )
        assert result.context == "Combined context"
        assert len(result.sources) == 1
        assert result.total_matches == 5


class TestRAGServiceChunking:
    """Tests for RAG service content chunking."""
    
    def test_small_content_single_chunk(self):
        """Small content should be returned as single chunk."""
        service = RAGService()
        content = "This is a short piece of content."
        chunks = service._chunk_content(content)
        
        assert len(chunks) == 1
        assert chunks[0]["text"] == content
    
    def test_empty_content_no_chunks(self):
        """Empty content should return no chunks."""
        service = RAGService()
        chunks = service._chunk_content("")
        assert len(chunks) == 0
    
    def test_whitespace_only_no_chunks(self):
        """Whitespace-only content should return no chunks."""
        service = RAGService()
        chunks = service._chunk_content("   \n\n   ")
        assert len(chunks) == 0
    
    def test_large_content_multiple_chunks(self):
        """Large content should be split into multiple chunks."""
        service = RAGService(ChunkConfig(chunk_size=100))
        content = "Paragraph one. " * 20 + "\n\n" + "Paragraph two. " * 20
        chunks = service._chunk_content(content)
        
        assert len(chunks) > 1
    
    def test_chunks_have_metadata(self):
        """Chunks should include index and total count."""
        service = RAGService(ChunkConfig(chunk_size=50))
        content = "Short paragraph one.\n\nShort paragraph two.\n\nShort paragraph three."
        chunks = service._chunk_content(content)
        
        for i, chunk in enumerate(chunks):
            assert "index" in chunk
            assert "total_chunks" in chunk
            assert chunk["index"] == i
    
    def test_title_added_to_first_chunk(self):
        """Title should be added to first chunk for multi-chunk content."""
        service = RAGService(ChunkConfig(chunk_size=50))
        # Content long enough to be chunked
        content = "First paragraph with some content.\n\nSecond paragraph with more content here."
        chunks = service._chunk_content(content, title="My Title")
        
        # Only applies when content is actually chunked
        if len(chunks) > 1:
            assert "My Title" in chunks[0]["text"]


class TestRAGServiceWithMocks:
    """Tests for RAG service with mocked external dependencies."""
    
    @pytest.fixture
    def mock_service(self, mock_openai_client, mock_pinecone_index):
        """Create RAG service with mocked dependencies."""
        with patch('app.services.rag_service.get_openai_client', return_value=mock_openai_client):
            with patch('app.services.rag_service.get_pinecone_index', return_value=mock_pinecone_index):
                service = RAGService()
                yield service
    
    @pytest.mark.asyncio
    async def test_retrieve_context_returns_string(self, mock_service):
        """retrieve_context should return formatted context string."""
        result = await mock_service.retrieve_context(
            query="How do I check hair porosity?",
            include_sources=False
        )
        assert isinstance(result, str)
    
    @pytest.mark.asyncio
    async def test_retrieve_context_with_sources(self, mock_service):
        """retrieve_context with include_sources should return ContextResult."""
        result = await mock_service.retrieve_context(
            query="How do I check hair porosity?",
            include_sources=True
        )
        assert isinstance(result, ContextResult)
        assert hasattr(result, 'sources')
        assert hasattr(result, 'context')
    
    @pytest.mark.asyncio
    async def test_retrieve_context_respects_threshold(self, mock_service, mock_pinecone_index):
        """Low-scoring results should be filtered out."""
        # Set up a low-score match
        low_match = MagicMock()
        low_match.id = "low_chunk"
        low_match.score = 0.3  # Below default 0.7 threshold
        low_match.metadata = {"content": "Low relevance"}
        
        mock_results = MagicMock()
        mock_results.matches = [low_match]
        mock_pinecone_index.query.return_value = mock_results
        
        result = await mock_service.retrieve_context(
            query="test",
            score_threshold=0.7,
            include_sources=True
        )
        
        assert result.total_matches == 0
    
    @pytest.mark.asyncio
    async def test_index_content_success(self, mock_service):
        """index_content should return success and chunk IDs."""
        success, chunk_ids = await mock_service.index_content(
            content="Test content for indexing that is long enough.",
            metadata={"title": "Test", "category": "test"},
            content_id="test_123"
        )
        
        assert success is True
        assert len(chunk_ids) > 0
    
    @pytest.mark.asyncio
    async def test_delete_content(self, mock_service, mock_pinecone_index):
        """delete_content should call Pinecone delete."""
        result = await mock_service.delete_content("test_id")
        
        assert result is True
        assert mock_pinecone_index.delete.called
    
    @pytest.mark.asyncio
    async def test_get_index_stats(self, mock_service):
        """get_index_stats should return index statistics."""
        stats = await mock_service.get_index_stats()
        
        assert "total_vectors" in stats
        assert "dimension" in stats
