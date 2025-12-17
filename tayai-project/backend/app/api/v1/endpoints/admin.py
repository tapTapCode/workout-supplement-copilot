"""
Admin Endpoints - Administrative operations for TayAI.

Provides:
- Knowledge base CRUD operations
- Bulk upload functionality
- Persona testing
- System statistics
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.database import get_db
from app.schemas.knowledge import (
    KnowledgeBaseItem,
    KnowledgeBaseCreate,
    KnowledgeBaseUpdate,
    BulkUploadRequest,
    BulkUploadResult,
    KnowledgeStats,
    SearchRequest,
    SearchResponse,
    SearchResult,
    ReindexResponse
)
from app.schemas.chat import PersonaTestRequest, PersonaTestResponse
from app.services.knowledge_service import KnowledgeService
from app.services.chat_service import ChatService
from app.core import ConversationContext
from app.utils import truncate_text
from app.dependencies import get_current_admin

router = APIRouter()


# =============================================================================
# Knowledge Base CRUD
# =============================================================================

@router.post("/knowledge", response_model=KnowledgeBaseItem)
async def create_knowledge_item(
    item: KnowledgeBaseCreate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Create a new knowledge base item."""
    service = KnowledgeService(db)
    return await service.create_knowledge_item(item)


@router.get("/knowledge", response_model=List[KnowledgeBaseItem])
async def list_knowledge_items(
    category: Optional[str] = None,
    active_only: bool = True,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """List knowledge base items with optional filtering."""
    service = KnowledgeService(db)
    return await service.list_knowledge_items(
        category=category,
        active_only=active_only,
        limit=limit,
        offset=offset
    )


@router.get("/knowledge/{item_id}", response_model=KnowledgeBaseItem)
async def get_knowledge_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Get a single knowledge base item."""
    service = KnowledgeService(db)
    item = await service.get_knowledge_item(item_id)
    
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")
    return item


@router.put("/knowledge/{item_id}", response_model=KnowledgeBaseItem)
async def update_knowledge_item(
    item_id: int,
    update: KnowledgeBaseUpdate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Update an existing knowledge base item."""
    service = KnowledgeService(db)
    item = await service.update_knowledge_item(item_id, update)
    
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")
    return item


@router.delete("/knowledge/{item_id}")
async def delete_knowledge_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Delete a knowledge base item."""
    service = KnowledgeService(db)
    deleted = await service.delete_knowledge_item(item_id)
    
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")
    return {"message": "Item deleted successfully"}


# =============================================================================
# Bulk Operations
# =============================================================================

@router.post("/knowledge/bulk", response_model=BulkUploadResult)
async def bulk_upload(
    request: BulkUploadRequest,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Bulk upload multiple knowledge base items."""
    service = KnowledgeService(db)
    
    items = [
        KnowledgeBaseCreate(
            title=item.title,
            content=item.content,
            category=item.category
        )
        for item in request.items
    ]
    
    return await service.bulk_create(items)


@router.post("/knowledge/reindex", response_model=ReindexResponse)
async def reindex_knowledge(
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Reindex all knowledge base items in Pinecone."""
    service = KnowledgeService(db)
    success, errors = await service.reindex_all()
    
    return ReindexResponse(
        success_count=success,
        error_count=errors,
        message=f"Reindex: {success} success, {errors} errors"
    )


# =============================================================================
# Search & Stats
# =============================================================================

@router.post("/knowledge/search", response_model=SearchResponse)
async def search_knowledge(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Search the knowledge base using semantic search."""
    service = KnowledgeService(db)
    results = await service.search_knowledge(
        query=request.query,
        category=request.category,
        top_k=request.top_k
    )
    
    search_results = [
        SearchResult(
            id=r.get("id", ""),
            score=r.get("score", 0),
            title=r.get("metadata", {}).get("title"),
            category=r.get("metadata", {}).get("category"),
            content_preview=truncate_text(r.get("metadata", {}).get("content", ""), 200)
        )
        for r in results
    ]
    
    return SearchResponse(
        query=request.query,
        results=search_results,
        total_results=len(search_results)
    )


@router.get("/knowledge/stats", response_model=KnowledgeStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Get knowledge base statistics."""
    service = KnowledgeService(db)
    return await service.get_stats()


@router.get("/knowledge/categories")
async def get_categories(
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Get all categories with item counts."""
    service = KnowledgeService(db)
    return {"categories": await service.get_categories()}


# =============================================================================
# Persona Testing
# =============================================================================

@router.post("/persona/test", response_model=PersonaTestResponse)
async def test_persona(
    request: PersonaTestRequest,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Test AI persona response without saving to history."""
    # Parse context type if provided
    context_type = None
    if request.context_type:
        try:
            context_type = ConversationContext(request.context_type)
        except ValueError:
            valid = [c.value for c in ConversationContext]
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Invalid context type. Valid: {valid}"
            )
    
    chat_service = ChatService(db)
    result = await chat_service.test_persona_response(
        test_message=request.message,
        context_type=context_type
    )
    
    return PersonaTestResponse(**result)


@router.get("/persona/context-types")
async def get_context_types(
    admin: dict = Depends(get_current_admin)
):
    """Get available conversation context types."""
    descriptions = {
        ConversationContext.HAIR_EDUCATION: "Hair care and styling advice",
        ConversationContext.BUSINESS_MENTORSHIP: "Business strategy guidance",
        ConversationContext.PRODUCT_RECOMMENDATION: "Product recommendations",
        ConversationContext.TROUBLESHOOTING: "Problem solving",
        ConversationContext.GENERAL: "General conversation"
    }
    
    return {
        "context_types": [
            {"value": ctx.value, "description": descriptions.get(ctx, "")}
            for ctx in ConversationContext
        ]
    }


