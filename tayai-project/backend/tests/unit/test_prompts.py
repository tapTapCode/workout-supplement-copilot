"""
Unit Tests for Prompt Engineering System

Tests the persona configuration and prompt generation functionality.
"""
import pytest
from app.core.prompts import (
    PersonaConfig,
    DEFAULT_PERSONA,
    ConversationContext,
    get_system_prompt,
    get_context_injection_prompt,
    FALLBACK_RESPONSES,
)


class TestPersonaConfig:
    """Tests for PersonaConfig dataclass."""
    
    def test_default_persona_has_name(self):
        """Default persona should have name 'TayAI'."""
        assert DEFAULT_PERSONA.name == "TayAI"
    
    def test_default_persona_has_brand(self):
        """Default persona should have brand 'TaysLuxe'."""
        assert DEFAULT_PERSONA.brand_name == "TaysLuxe"
    
    def test_default_persona_has_identity(self):
        """Default persona should have a non-empty identity."""
        assert DEFAULT_PERSONA.identity
        assert len(DEFAULT_PERSONA.identity) > 50
    
    def test_default_persona_has_expertise_areas(self):
        """Default persona should have expertise areas defined."""
        expected_areas = ["hair_mastery", "business_building", "industry_insight"]
        for area in expected_areas:
            assert area in DEFAULT_PERSONA.expertise_areas
    
    def test_default_persona_has_communication_style(self):
        """Default persona should have communication style defined."""
        expected_keys = ["tone", "approach", "teaching_style", "energy"]
        for key in expected_keys:
            assert key in DEFAULT_PERSONA.communication_style
    
    def test_default_persona_has_response_guidelines(self):
        """Default persona should have response guidelines."""
        assert len(DEFAULT_PERSONA.response_guidelines) >= 5
    
    def test_default_persona_has_accuracy_guidelines(self):
        """Default persona should have accuracy guidelines."""
        assert len(DEFAULT_PERSONA.accuracy_guidelines) >= 5
    
    def test_custom_persona_creation(self):
        """Should be able to create custom persona with different values."""
        custom = PersonaConfig(name="CustomAI", brand_name="CustomBrand")
        assert custom.name == "CustomAI"
        assert custom.brand_name == "CustomBrand"
        # Should still have default values for unspecified fields
        assert len(custom.expertise_areas) > 0


class TestSystemPrompt:
    """Tests for system prompt generation."""
    
    def test_system_prompt_includes_persona_name(self):
        """System prompt should include the persona name."""
        prompt = get_system_prompt()
        assert "TayAI" in prompt
    
    def test_system_prompt_includes_mentor_role(self):
        """System prompt should include mentor role description."""
        prompt = get_system_prompt()
        assert "Mentor" in prompt or "mentor" in prompt
    
    def test_system_prompt_includes_expertise(self):
        """System prompt should include expertise areas."""
        prompt = get_system_prompt()
        assert "Hair Mastery" in prompt or "hair" in prompt.lower()
        assert "Business" in prompt or "business" in prompt.lower()
    
    def test_system_prompt_with_hair_context(self):
        """System prompt with hair education context should include hair instructions."""
        prompt = get_system_prompt(context_type=ConversationContext.HAIR_EDUCATION)
        assert "Hair Education Mode" in prompt
        assert "porosity" in prompt.lower()
    
    def test_system_prompt_with_business_context(self):
        """System prompt with business context should include business instructions."""
        prompt = get_system_prompt(context_type=ConversationContext.BUSINESS_MENTORSHIP)
        assert "Business Mentorship Mode" in prompt
        assert "pricing" in prompt.lower()
    
    def test_system_prompt_with_product_context(self):
        """System prompt with product context should include product instructions."""
        prompt = get_system_prompt(context_type=ConversationContext.PRODUCT_RECOMMENDATION)
        assert "Product Recommendation Mode" in prompt
    
    def test_system_prompt_with_troubleshooting_context(self):
        """System prompt with troubleshooting context should include troubleshooting instructions."""
        prompt = get_system_prompt(context_type=ConversationContext.TROUBLESHOOTING)
        assert "Troubleshooting Mode" in prompt
    
    def test_system_prompt_with_general_context(self):
        """System prompt with general context should not include specific mode."""
        prompt = get_system_prompt(context_type=ConversationContext.GENERAL)
        assert "Hair Education Mode" not in prompt
        assert "Business Mentorship Mode" not in prompt
    
    def test_system_prompt_with_rag_instructions(self):
        """System prompt should include RAG instructions by default."""
        prompt = get_system_prompt(include_rag_instructions=True)
        assert "Knowledge Base" in prompt
    
    def test_system_prompt_without_rag_instructions(self):
        """System prompt without RAG should not include knowledge base instructions."""
        prompt = get_system_prompt(include_rag_instructions=False)
        assert "Knowledge Base Context" not in prompt
    
    def test_system_prompt_with_custom_persona(self):
        """System prompt should use custom persona when provided."""
        custom = PersonaConfig(name="TestAI")
        prompt = get_system_prompt(persona=custom)
        assert "TestAI" in prompt


class TestContextInjectionPrompt:
    """Tests for RAG context injection prompt."""
    
    def test_empty_context_returns_empty_string(self):
        """Empty context should return empty string."""
        result = get_context_injection_prompt("", "test query")
        assert result == ""
    
    def test_none_context_returns_empty_string(self):
        """None context should return empty string."""
        result = get_context_injection_prompt(None, "test query")
        assert result == ""
    
    def test_context_is_included_in_prompt(self):
        """Provided context should be included in the prompt."""
        context = "Hair porosity determines moisture absorption."
        result = get_context_injection_prompt(context, "test query")
        assert context in result
    
    def test_context_prompt_has_instructions(self):
        """Context prompt should include usage instructions."""
        result = get_context_injection_prompt("test context", "test query")
        assert "Relevant Information" in result
        assert "naturally" in result.lower()


class TestFallbackResponses:
    """Tests for fallback response messages."""
    
    def test_fallback_responses_exist(self):
        """All expected fallback responses should exist."""
        expected_keys = ["unknown_topic", "need_more_info", "error_graceful"]
        for key in expected_keys:
            assert key in FALLBACK_RESPONSES
    
    def test_fallback_responses_are_non_empty(self):
        """All fallback responses should be non-empty strings."""
        for key, value in FALLBACK_RESPONSES.items():
            assert isinstance(value, str)
            assert len(value) > 20
    
    def test_fallback_responses_maintain_tone(self):
        """Fallback responses should maintain friendly mentor tone."""
        # Check for friendly/casual language patterns
        for response in FALLBACK_RESPONSES.values():
            # Should not be overly formal
            assert "Dear user" not in response
            assert "We apologize" not in response
