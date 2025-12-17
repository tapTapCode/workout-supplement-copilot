"""
Shared API Clients - Centralized client initialization for external services.

This module provides lazy-initialized clients for:
- OpenAI (GPT-4, Embeddings)
- Pinecone (Vector Database)

Using centralized clients ensures:
- Single source of truth for configuration
- Efficient connection reuse
- Easier testing and mocking
"""
from typing import Optional
from openai import AsyncOpenAI
from pinecone import Pinecone

from app.core.config import settings

# Singleton instances
_openai_client: Optional[AsyncOpenAI] = None
_pinecone_client: Optional[Pinecone] = None
_pinecone_index = None


def get_openai_client() -> AsyncOpenAI:
    """
    Get or create the OpenAI async client.
    
    Returns:
        AsyncOpenAI client instance
    """
    global _openai_client
    if _openai_client is None:
        _openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


def get_pinecone_client() -> Pinecone:
    """
    Get or create the Pinecone client.
    
    Returns:
        Pinecone client instance
    """
    global _pinecone_client
    if _pinecone_client is None:
        _pinecone_client = Pinecone(api_key=settings.PINECONE_API_KEY)
    return _pinecone_client


def get_pinecone_index():
    """
    Get or create the Pinecone index connection.
    
    Returns:
        Pinecone Index instance
    """
    global _pinecone_index
    if _pinecone_index is None:
        pc = get_pinecone_client()
        _pinecone_index = pc.Index(settings.PINECONE_INDEX_NAME)
    return _pinecone_index


def reset_clients():
    """Reset all clients. Useful for testing."""
    global _openai_client, _pinecone_client, _pinecone_index
    _openai_client = None
    _pinecone_client = None
    _pinecone_index = None
