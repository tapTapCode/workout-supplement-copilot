"""
Pydantic Schemas for TayAI API

This module exports all request/response schemas used by the API endpoints.
Organized by domain: auth, chat, knowledge, usage.
"""

# Authentication schemas
from .auth import (
    Token,
    TokenData,
    UserLogin,
    UserVerify,
)

# Chat schemas
from .chat import (
    ChatMessage,
    ConversationMessage,
    ChatRequest,
    ChatResponse,
    ChatHistoryResponse,
    SourceInfo,
    PersonaTestRequest,
    PersonaTestResponse,
)

# Knowledge base schemas
from .knowledge import (
    KnowledgeBaseItem,
    KnowledgeBaseCreate,
    KnowledgeBaseUpdate,
    BulkUploadItem,
    BulkUploadRequest,
    BulkUploadResult,
    SearchRequest,
    SearchResult,
    SearchResponse,
    KnowledgeStats,
    ReindexResponse,
)

# Usage tracking schemas
from .usage import UsageStatus

__all__ = [
    # Auth
    "Token",
    "TokenData",
    "UserLogin",
    "UserVerify",
    # Chat
    "ChatMessage",
    "ConversationMessage",
    "ChatRequest",
    "ChatResponse",
    "ChatHistoryResponse",
    "SourceInfo",
    "PersonaTestRequest",
    "PersonaTestResponse",
    # Knowledge
    "KnowledgeBaseItem",
    "KnowledgeBaseCreate",
    "KnowledgeBaseUpdate",
    "BulkUploadItem",
    "BulkUploadRequest",
    "BulkUploadResult",
    "SearchRequest",
    "SearchResult",
    "SearchResponse",
    "KnowledgeStats",
    "ReindexResponse",
    # Usage
    "UsageStatus",
]
