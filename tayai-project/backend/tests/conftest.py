"""
Pytest Configuration and Shared Fixtures

This file is automatically loaded by pytest and provides:
- Common fixtures for database sessions, clients, etc.
- Test configuration
- Mock objects for external services
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from typing import Generator, AsyncGenerator

# Configure pytest-asyncio
pytest_plugins = ["pytest_asyncio"]


# =============================================================================
# Mock Fixtures for External Services
# =============================================================================

@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client for testing without API calls."""
    client = AsyncMock()
    
    # Mock chat completions
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Test AI response"
    mock_response.usage.total_tokens = 100
    client.chat.completions.create = AsyncMock(return_value=mock_response)
    
    # Mock embeddings
    mock_embedding = MagicMock()
    mock_embedding.data = [MagicMock()]
    mock_embedding.data[0].embedding = [0.1] * 1536  # text-embedding-3-small dimension
    client.embeddings.create = AsyncMock(return_value=mock_embedding)
    
    return client


@pytest.fixture
def mock_pinecone_index():
    """Mock Pinecone index for testing without database calls."""
    index = MagicMock()
    
    # Mock query results
    mock_match = MagicMock()
    mock_match.id = "test_chunk_1"
    mock_match.score = 0.85
    mock_match.metadata = {
        "title": "Test Article",
        "category": "hair_education",
        "content": "Test content about hair care."
    }
    
    mock_results = MagicMock()
    mock_results.matches = [mock_match]
    index.query = MagicMock(return_value=mock_results)
    
    # Mock upsert
    index.upsert = MagicMock(return_value=None)
    
    # Mock delete
    index.delete = MagicMock(return_value=None)
    
    # Mock stats
    mock_stats = MagicMock()
    mock_stats.total_vector_count = 100
    mock_stats.dimension = 1536
    mock_stats.namespaces = {}
    index.describe_index_stats = MagicMock(return_value=mock_stats)
    
    return index


@pytest.fixture
def mock_db_session():
    """Mock database session for testing."""
    session = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.execute = AsyncMock()
    session.delete = AsyncMock()
    return session


# =============================================================================
# Sample Data Fixtures
# =============================================================================

@pytest.fixture
def sample_user_messages():
    """Sample user messages for testing context detection."""
    return {
        "hair_education": [
            "How do I determine my hair porosity?",
            "What's the best way to moisturize type 4 hair?",
            "Can you explain the LOC method?",
        ],
        "business_mentorship": [
            "How should I price my braiding services?",
            "I need help getting more clients",
            "What's the best way to market my salon on Instagram?",
        ],
        "product_recommendation": [
            "What shampoo should I use for low porosity hair?",
            "Can you recommend a good leave-in conditioner?",
            "Which oils are best for sealing?",
        ],
        "troubleshooting": [
            "My hair is breaking and I don't know why",
            "Help! My client's hair is damaged",
            "Why is my hair so dry even after moisturizing?",
        ],
        "general": [
            "Hello!",
            "Thank you so much!",
            "What time is it?",
        ],
    }


@pytest.fixture
def sample_knowledge_item():
    """Sample knowledge base item for testing."""
    return {
        "title": "Understanding Hair Porosity",
        "content": """Hair porosity refers to how well your hair absorbs and retains moisture.
        
        Low porosity hair has tightly bound cuticles that resist moisture absorption.
        High porosity hair has gaps in the cuticle that allow moisture to escape.
        
        Testing your porosity:
        1. Float test: Drop clean hair in water
        2. Spray test: Spritz water on dry hair
        3. Slide test: Run fingers up the hair shaft
        """,
        "category": "hair_education",
    }


@pytest.fixture
def sample_conversation_history():
    """Sample conversation history for testing."""
    return [
        {"role": "user", "content": "Hi, I need help with my hair"},
        {"role": "assistant", "content": "Hey! I'd love to help. What's going on with your hair?"},
        {"role": "user", "content": "It's really dry and breaking"},
    ]
