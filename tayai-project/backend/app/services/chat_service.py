"""
Chat Service - Business logic for chat operations with RAG

Handles:
1. Processing user messages with RAG-enhanced context
2. Managing conversation history
3. Interacting with OpenAI API
4. Storing chat messages
"""
import logging
from typing import List, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete

from app.core.config import settings
from app.core.clients import get_openai_client
from app.core.prompts import (
    get_system_prompt,
    get_context_injection_prompt,
    detect_conversation_context,
    ConversationContext,
    FALLBACK_RESPONSES
)
from app.db.models import ChatMessage
from app.services.rag_service import RAGService, ContextResult
from app.schemas.chat import ChatResponse

logger = logging.getLogger(__name__)


class ChatService:
    """Service for chat-related operations."""
    
    # Configuration
    MAX_HISTORY = 10
    TEMPERATURE = 0.7
    MAX_TOKENS = 1000
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.rag_service = RAGService()
    
    # -------------------------------------------------------------------------
    # Message Processing
    # -------------------------------------------------------------------------
    
    async def process_message(
        self,
        user_id: int,
        message: str,
        conversation_history: Optional[List[Dict]] = None,
        include_sources: bool = False
    ) -> ChatResponse:
        """
        Process a chat message using RAG and return AI response.
        
        Args:
            user_id: The user's ID
            message: The user's message
            conversation_history: Previous messages in conversation
            include_sources: Whether to include source info
        
        Returns:
            ChatResponse with AI response and metadata
        """
        try:
            # Detect context type
            context_type = detect_conversation_context(message)
            logger.info(f"Context: {context_type.value} for: {message[:50]}...")
            
            # Retrieve RAG context
            context_result = await self.rag_service.retrieve_context(
                query=message,
                top_k=5,
                score_threshold=0.7,
                include_sources=True
            )
            
            # Extract context string
            context = (
                context_result.context 
                if isinstance(context_result, ContextResult) 
                else context_result
            )
            
            # Build messages and call API
            messages = self._build_messages(
                message, context, conversation_history, context_type
            )
            
            response = await get_openai_client().chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                temperature=self.TEMPERATURE,
                max_tokens=self.MAX_TOKENS
            )
            
            ai_response = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            
            # Save to database
            chat_message = ChatMessage(
                user_id=user_id,
                message=message,
                response=ai_response,
                tokens_used=tokens_used
            )
            self.db.add(chat_message)
            await self.db.commit()
            await self.db.refresh(chat_message)
            
            logger.info(f"Processed message for user {user_id}, tokens: {tokens_used}")
            
            # Build response
            result = ChatResponse(
                response=ai_response,
                tokens_used=tokens_used,
                message_id=chat_message.id
            )
            
            if include_sources and isinstance(context_result, ContextResult):
                result.sources = context_result.sources
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return ChatResponse(
                response=FALLBACK_RESPONSES["error_graceful"],
                tokens_used=0,
                message_id=None
            )
    
    def _build_messages(
        self,
        user_message: str,
        context: str,
        history: Optional[List[Dict]],
        context_type: ConversationContext
    ) -> List[Dict]:
        """Build the message array for OpenAI API."""
        messages = [
            {"role": "system", "content": get_system_prompt(context_type=context_type)}
        ]
        
        # Add RAG context
        if context:
            messages.append({
                "role": "system",
                "content": get_context_injection_prompt(context, user_message)
            })
        
        # Add conversation history
        if history:
            for msg in history[-self.MAX_HISTORY:]:
                if self._is_valid_message(msg):
                    messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })
        
        # Add current message
        messages.append({"role": "user", "content": user_message})
        
        return messages
    
    @staticmethod
    def _is_valid_message(msg: Dict) -> bool:
        """Validate a message dictionary."""
        return (
            isinstance(msg, dict)
            and msg.get("role") in ("user", "assistant", "system")
            and "content" in msg
        )
    
    # -------------------------------------------------------------------------
    # Chat History
    # -------------------------------------------------------------------------
    
    async def get_chat_history(
        self,
        user_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> List[ChatMessage]:
        """Get chat history for a user."""
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id)
            .order_by(desc(ChatMessage.created_at))
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())
    
    async def get_conversation_context(
        self,
        user_id: int,
        message_count: int = 5
    ) -> List[Dict]:
        """Get recent conversation as context for new messages."""
        messages = await self.get_chat_history(user_id, limit=message_count)
        
        # Convert to conversation format (chronological order)
        context = []
        for msg in reversed(messages):
            context.append({"role": "user", "content": msg.message})
            if msg.response:
                context.append({"role": "assistant", "content": msg.response})
        
        return context
    
    async def clear_chat_history(self, user_id: int) -> int:
        """Clear all chat history for a user."""
        result = await self.db.execute(
            select(ChatMessage).where(ChatMessage.user_id == user_id)
        )
        messages = list(result.scalars().all())
        count = len(messages)
        
        for msg in messages:
            await self.db.delete(msg)
        
        await self.db.commit()
        logger.info(f"Cleared {count} messages for user {user_id}")
        
        return count
    
    # -------------------------------------------------------------------------
    # Persona Testing
    # -------------------------------------------------------------------------
    
    async def test_persona_response(
        self,
        test_message: str,
        context_type: Optional[ConversationContext] = None
    ) -> Dict:
        """
        Test AI response without saving to database.
        
        Args:
            test_message: The test message
            context_type: Optional forced context type
        
        Returns:
            Dictionary with response and metadata
        """
        # Detect context if not provided
        if context_type is None:
            context_type = detect_conversation_context(test_message)
        
        # Get RAG context
        context_result = await self.rag_service.retrieve_context(
            query=test_message,
            top_k=3,
            include_sources=True
        )
        
        context = (
            context_result.context 
            if isinstance(context_result, ContextResult) 
            else context_result
        )
        
        # Build messages and call API
        messages = self._build_messages(test_message, context, None, context_type)
        
        response = await get_openai_client().chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=self.TEMPERATURE,
            max_tokens=self.MAX_TOKENS
        )
        
        sources = (
            context_result.sources 
            if isinstance(context_result, ContextResult) 
            else []
        )
        
        return {
            "response": response.choices[0].message.content,
            "tokens_used": response.usage.total_tokens,
            "context_type": context_type.value,
            "sources": sources,
            "system_prompt_preview": messages[0]["content"][:500] + "..."
        }
