"""
Chat Endpoints - API operations for chat functionality.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.database import get_db
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatHistoryResponse,
    ChatMessage
)
from app.services.chat_service import ChatService
from app.services.usage_service import UsageService
from app.dependencies import get_current_user

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Send a chat message and get AI response.
    
    The message is processed through the RAG pipeline with context
    from the knowledge base.
    """
    # Check usage limits
    usage_service = UsageService(db)
    can_send = await usage_service.check_usage_limit(
        current_user["user_id"], 
        current_user["tier"]
    )
    
    if not can_send:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Usage limit exceeded. Please upgrade your membership."
        )
    
    # Convert conversation history
    history = None
    if request.conversation_history:
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]
    
    # Process message
    chat_service = ChatService(db)
    response = await chat_service.process_message(
        user_id=current_user["user_id"],
        message=request.message,
        conversation_history=history,
        include_sources=request.include_sources
    )
    
    # Track usage
    await usage_service.record_usage(
        user_id=current_user["user_id"],
        tokens_used=response.tokens_used
    )
    
    return response


@router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get chat history for the current user."""
    chat_service = ChatService(db)
    
    # Get one extra to check for more
    messages = await chat_service.get_chat_history(
        user_id=current_user["user_id"],
        limit=limit + 1,
        offset=offset
    )
    
    has_more = len(messages) > limit
    if has_more:
        messages = messages[:limit]
    
    return ChatHistoryResponse(
        messages=messages,
        total_count=len(messages),
        has_more=has_more
    )


@router.get("/context")
async def get_conversation_context(
    message_count: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get recent conversation for continuing a chat."""
    chat_service = ChatService(db)
    context = await chat_service.get_conversation_context(
        user_id=current_user["user_id"],
        message_count=message_count
    )
    return {"conversation_history": context}


@router.delete("/history")
async def clear_chat_history(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Clear all chat history for the current user."""
    chat_service = ChatService(db)
    deleted = await chat_service.clear_chat_history(current_user["user_id"])
    return {"message": f"Deleted {deleted} messages", "deleted_count": deleted}
