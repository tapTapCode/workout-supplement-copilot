"""
Core Module for TayAI

Central configuration, clients, and utilities used throughout the application.

This module provides:
- settings: Application configuration from environment variables
- OpenAI/Pinecone clients: Shared, lazy-initialized API clients
- Prompt engineering: Persona, context detection, prompt generation

Usage:
    from app.core import settings, get_openai_client
    from app.core import ConversationContext, detect_conversation_context
"""
from app.core.config import settings
from app.core.clients import (
    get_openai_client,
    get_pinecone_client,
    get_pinecone_index,
    reset_clients,
)
from app.core.prompts import (
    # Persona
    PersonaConfig,
    DEFAULT_PERSONA,
    # Context
    ConversationContext,
    CONTEXT_KEYWORDS,
    detect_conversation_context,
    # Generation
    get_system_prompt,
    get_context_injection_prompt,
    # Fallbacks
    FALLBACK_RESPONSES,
)

__all__ = [
    # Config
    "settings",
    # Clients
    "get_openai_client",
    "get_pinecone_client",
    "get_pinecone_index",
    "reset_clients",
    # Persona
    "PersonaConfig",
    "DEFAULT_PERSONA",
    # Context
    "ConversationContext",
    "CONTEXT_KEYWORDS",
    "detect_conversation_context",
    # Generation
    "get_system_prompt",
    "get_context_injection_prompt",
    # Fallbacks
    "FALLBACK_RESPONSES",
]
