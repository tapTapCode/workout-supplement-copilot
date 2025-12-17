"""
Unit Tests for Context Detection

Tests the conversation context detection system that determines
what type of help a user needs based on their message.
"""
import pytest
from app.core.prompts import (
    ConversationContext,
    CONTEXT_KEYWORDS,
    detect_conversation_context,
)


class TestConversationContext:
    """Tests for ConversationContext enum."""
    
    def test_all_context_types_exist(self):
        """All expected context types should exist."""
        expected = [
            "hair_education",
            "business_mentorship", 
            "product_recommendation",
            "troubleshooting",
            "general",
        ]
        actual = [c.value for c in ConversationContext]
        for ctx in expected:
            assert ctx in actual
    
    def test_context_values_are_strings(self):
        """Context values should be strings for JSON serialization."""
        for ctx in ConversationContext:
            assert isinstance(ctx.value, str)


class TestContextKeywords:
    """Tests for context keyword configuration."""
    
    def test_keywords_defined_for_main_contexts(self):
        """Keywords should be defined for non-general contexts."""
        main_contexts = [
            ConversationContext.HAIR_EDUCATION,
            ConversationContext.BUSINESS_MENTORSHIP,
            ConversationContext.PRODUCT_RECOMMENDATION,
            ConversationContext.TROUBLESHOOTING,
        ]
        for ctx in main_contexts:
            assert ctx in CONTEXT_KEYWORDS
            assert len(CONTEXT_KEYWORDS[ctx]) > 0
    
    def test_hair_education_keywords(self):
        """Hair education should have relevant keywords."""
        keywords = CONTEXT_KEYWORDS[ConversationContext.HAIR_EDUCATION]
        expected = ["hair", "curl", "moisture", "texture"]
        for kw in expected:
            assert kw in keywords
    
    def test_business_keywords(self):
        """Business mentorship should have relevant keywords."""
        keywords = CONTEXT_KEYWORDS[ConversationContext.BUSINESS_MENTORSHIP]
        expected = ["business", "client", "price", "marketing"]
        for kw in expected:
            assert kw in keywords
    
    def test_product_keywords(self):
        """Product recommendation should have relevant keywords."""
        keywords = CONTEXT_KEYWORDS[ConversationContext.PRODUCT_RECOMMENDATION]
        expected = ["product", "shampoo", "conditioner", "recommend"]
        for kw in expected:
            assert kw in keywords
    
    def test_troubleshooting_keywords(self):
        """Troubleshooting should have relevant keywords."""
        keywords = CONTEXT_KEYWORDS[ConversationContext.TROUBLESHOOTING]
        expected = ["problem", "help", "damage", "fix"]
        for kw in expected:
            assert kw in keywords


class TestDetectConversationContext:
    """Tests for the detect_conversation_context function."""
    
    # Hair Education Detection
    def test_detects_hair_porosity_question(self):
        """Should detect hair education for porosity questions."""
        result = detect_conversation_context("How do I determine my hair porosity?")
        assert result == ConversationContext.HAIR_EDUCATION
    
    def test_detects_hair_moisture_question(self):
        """Should detect hair education for moisture questions."""
        result = detect_conversation_context("My hair needs more moisture")
        assert result == ConversationContext.HAIR_EDUCATION
    
    def test_detects_curl_pattern_question(self):
        """Should detect hair education for curl questions."""
        result = detect_conversation_context("What's my curl type?")
        assert result == ConversationContext.HAIR_EDUCATION
    
    # Business Mentorship Detection
    def test_detects_pricing_question(self):
        """Should detect business mentorship for pricing questions."""
        result = detect_conversation_context("How should I price my services?")
        assert result == ConversationContext.BUSINESS_MENTORSHIP
    
    def test_detects_client_question(self):
        """Should detect business mentorship for client questions."""
        result = detect_conversation_context("How do I get more clients?")
        assert result == ConversationContext.BUSINESS_MENTORSHIP
    
    def test_detects_marketing_question(self):
        """Should detect business mentorship for marketing questions."""
        result = detect_conversation_context("What's the best marketing strategy?")
        assert result == ConversationContext.BUSINESS_MENTORSHIP
    
    # Product Recommendation Detection
    def test_detects_product_question(self):
        """Should detect product recommendation for product questions."""
        result = detect_conversation_context("What product should I use?")
        assert result == ConversationContext.PRODUCT_RECOMMENDATION
    
    def test_detects_shampoo_question(self):
        """Should detect product recommendation for shampoo questions."""
        result = detect_conversation_context("Can you recommend a good shampoo?")
        assert result == ConversationContext.PRODUCT_RECOMMENDATION
    
    # Troubleshooting Detection
    def test_detects_problem_statement(self):
        """Should detect troubleshooting for problem statements."""
        result = detect_conversation_context("I have a problem with my hair")
        assert result == ConversationContext.TROUBLESHOOTING
    
    def test_detects_damage_concern(self):
        """Should detect troubleshooting for damage concerns."""
        result = detect_conversation_context("My hair is damaged and breaking")
        assert result == ConversationContext.TROUBLESHOOTING
    
    def test_detects_help_request(self):
        """Should detect troubleshooting for help requests."""
        result = detect_conversation_context("Help! Something is wrong with my hair")
        assert result == ConversationContext.TROUBLESHOOTING
    
    # General Context Detection
    def test_detects_general_greeting(self):
        """Should detect general context for greetings."""
        result = detect_conversation_context("Hello!")
        assert result == ConversationContext.GENERAL
    
    def test_detects_general_thanks(self):
        """Should detect general context for thanks."""
        result = detect_conversation_context("Thank you so much!")
        assert result == ConversationContext.GENERAL
    
    def test_detects_general_unrelated(self):
        """Should detect general context for unrelated messages."""
        result = detect_conversation_context("What's the weather like?")
        assert result == ConversationContext.GENERAL
    
    # Edge Cases
    def test_case_insensitive_detection(self):
        """Detection should be case insensitive."""
        result1 = detect_conversation_context("HAIR POROSITY")
        result2 = detect_conversation_context("hair porosity")
        assert result1 == result2
    
    def test_handles_empty_string(self):
        """Should handle empty string gracefully."""
        result = detect_conversation_context("")
        assert result == ConversationContext.GENERAL
    
    def test_handles_whitespace_only(self):
        """Should handle whitespace-only string gracefully."""
        result = detect_conversation_context("   ")
        assert result == ConversationContext.GENERAL
    
    def test_troubleshooting_priority_over_hair(self):
        """Troubleshooting should take priority when hair problem detected."""
        # "hair" matches hair_education, "problem" matches troubleshooting
        # Troubleshooting has higher priority
        result = detect_conversation_context("I have a hair problem")
        assert result == ConversationContext.TROUBLESHOOTING
    
    def test_multiple_keyword_match(self):
        """Should handle messages with multiple context keywords."""
        # Mix of business and hair keywords
        result = detect_conversation_context(
            "How do I price my hair braiding services for clients?"
        )
        # Should pick one based on score/priority
        assert result in [
            ConversationContext.BUSINESS_MENTORSHIP,
            ConversationContext.HAIR_EDUCATION,
        ]
