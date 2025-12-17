"""
Unit Tests for Pydantic Schemas

Tests the request/response schemas used by the API.
"""
import pytest
from pydantic import ValidationError
from datetime import datetime

from app.schemas import (
    # Chat schemas
    ChatRequest,
    ChatResponse,
    ConversationMessage,
    SourceInfo,
    PersonaTestRequest,
    # Knowledge schemas
    KnowledgeBaseCreate,
    KnowledgeBaseUpdate,
    BulkUploadItem,
    SearchRequest,
    # Auth schemas
    Token,
    TokenData,
    UserLogin,
)


class TestChatSchemas:
    """Tests for chat-related schemas."""
    
    def test_chat_request_valid(self):
        """Valid ChatRequest should be created successfully."""
        request = ChatRequest(message="Hello, I need help with my hair")
        assert request.message == "Hello, I need help with my hair"
        assert request.include_sources is False
    
    def test_chat_request_with_history(self):
        """ChatRequest with conversation history should work."""
        history = [
            ConversationMessage(role="user", content="Hi"),
            ConversationMessage(role="assistant", content="Hello!"),
        ]
        request = ChatRequest(message="Follow up", conversation_history=history)
        assert len(request.conversation_history) == 2
    
    def test_chat_request_empty_message_fails(self):
        """ChatRequest with empty message should fail validation."""
        with pytest.raises(ValidationError):
            ChatRequest(message="")
    
    def test_chat_request_too_long_message_fails(self):
        """ChatRequest with message over 4000 chars should fail."""
        with pytest.raises(ValidationError):
            ChatRequest(message="x" * 4001)
    
    def test_conversation_message_valid_roles(self):
        """ConversationMessage should accept valid roles."""
        for role in ["user", "assistant", "system"]:
            msg = ConversationMessage(role=role, content="test")
            assert msg.role == role
    
    def test_conversation_message_invalid_role_fails(self):
        """ConversationMessage with invalid role should fail."""
        with pytest.raises(ValidationError):
            ConversationMessage(role="invalid", content="test")
    
    def test_chat_response_valid(self):
        """Valid ChatResponse should be created successfully."""
        response = ChatResponse(
            response="Here's my advice...",
            tokens_used=150,
            message_id=1
        )
        assert response.response == "Here's my advice..."
        assert response.tokens_used == 150
    
    def test_chat_response_with_sources(self):
        """ChatResponse with sources should work."""
        sources = [
            SourceInfo(
                title="Hair Care Guide",
                category="hair_education",
                score=0.85,
                chunk_id="chunk_1"
            )
        ]
        response = ChatResponse(
            response="Based on our knowledge...",
            tokens_used=100,
            sources=sources
        )
        assert len(response.sources) == 1
    
    def test_persona_test_request_valid(self):
        """Valid PersonaTestRequest should be created."""
        request = PersonaTestRequest(
            message="Test message",
            context_type="hair_education"
        )
        assert request.message == "Test message"
        assert request.context_type == "hair_education"


class TestKnowledgeSchemas:
    """Tests for knowledge base schemas."""
    
    def test_knowledge_create_valid(self):
        """Valid KnowledgeBaseCreate should be created."""
        item = KnowledgeBaseCreate(
            title="Hair Porosity Guide",
            content="This is a detailed guide about hair porosity...",
            category="hair_education"
        )
        assert item.title == "Hair Porosity Guide"
        assert item.category == "hair_education"
    
    def test_knowledge_create_empty_title_fails(self):
        """KnowledgeBaseCreate with empty title should fail."""
        with pytest.raises(ValidationError):
            KnowledgeBaseCreate(
                title="",
                content="Valid content here"
            )
    
    def test_knowledge_create_short_content_fails(self):
        """KnowledgeBaseCreate with content under 10 chars should fail."""
        with pytest.raises(ValidationError):
            KnowledgeBaseCreate(
                title="Valid Title",
                content="Short"
            )
    
    def test_knowledge_update_partial(self):
        """KnowledgeBaseUpdate should allow partial updates."""
        update = KnowledgeBaseUpdate(title="New Title")
        assert update.title == "New Title"
        assert update.content is None
        assert update.category is None
    
    def test_knowledge_update_all_fields(self):
        """KnowledgeBaseUpdate should allow all fields."""
        update = KnowledgeBaseUpdate(
            title="New Title",
            content="New content that is long enough",
            category="business",
            is_active=False
        )
        assert update.title == "New Title"
        assert update.is_active is False
    
    def test_bulk_upload_item_valid(self):
        """Valid BulkUploadItem should be created."""
        item = BulkUploadItem(
            title="Bulk Item",
            content="Content for bulk upload item",
            category="tips"
        )
        assert item.title == "Bulk Item"
    
    def test_search_request_valid(self):
        """Valid SearchRequest should be created."""
        request = SearchRequest(
            query="hair porosity",
            category="hair_education",
            top_k=10
        )
        assert request.query == "hair porosity"
        assert request.top_k == 10
    
    def test_search_request_top_k_bounds(self):
        """SearchRequest top_k should be within bounds."""
        # Valid bounds
        request = SearchRequest(query="test", top_k=1)
        assert request.top_k == 1
        
        request = SearchRequest(query="test", top_k=20)
        assert request.top_k == 20
        
        # Invalid bounds
        with pytest.raises(ValidationError):
            SearchRequest(query="test", top_k=0)
        
        with pytest.raises(ValidationError):
            SearchRequest(query="test", top_k=21)


class TestAuthSchemas:
    """Tests for authentication schemas."""
    
    def test_token_valid(self):
        """Valid Token should be created."""
        token = Token(access_token="abc123")
        assert token.access_token == "abc123"
        assert token.token_type == "bearer"
    
    def test_token_custom_type(self):
        """Token should allow custom token_type."""
        token = Token(access_token="abc123", token_type="custom")
        assert token.token_type == "custom"
    
    def test_token_data_valid(self):
        """Valid TokenData should be created."""
        data = TokenData(sub="user@example.com", user_id=1, tier="premium")
        assert data.sub == "user@example.com"
        assert data.user_id == 1
        assert data.tier == "premium"
    
    def test_token_data_optional_fields(self):
        """TokenData should have optional fields."""
        data = TokenData()
        assert data.sub is None
        assert data.user_id is None
    
    def test_user_login_valid(self):
        """Valid UserLogin should be created."""
        login = UserLogin(username="testuser", password="secret123")
        assert login.username == "testuser"
        assert login.password == "secret123"
