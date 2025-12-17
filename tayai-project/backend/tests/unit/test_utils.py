"""
Unit Tests for Utility Functions

Tests the shared utility functions used across the application.
"""
import pytest
from app.utils import truncate_text, sanitize_string


class TestTruncateText:
    """Tests for the truncate_text utility function."""
    
    def test_short_text_unchanged(self):
        """Text shorter than max_length should be returned unchanged."""
        text = "Hello"
        result = truncate_text(text, 10)
        assert result == "Hello"
    
    def test_exact_length_unchanged(self):
        """Text exactly at max_length should be returned unchanged."""
        text = "Hello"
        result = truncate_text(text, 5)
        assert result == "Hello"
    
    def test_long_text_truncated(self):
        """Text longer than max_length should be truncated with suffix."""
        text = "Hello World"
        result = truncate_text(text, 8)
        assert result == "Hello..."
        assert len(result) == 8
    
    def test_custom_suffix(self):
        """Should use custom suffix when provided."""
        text = "Hello World"
        result = truncate_text(text, 9, suffix="[more]")
        assert result.endswith("[more]")
    
    def test_empty_string(self):
        """Empty string should return empty string."""
        result = truncate_text("", 10)
        assert result == ""
    
    def test_none_returns_none(self):
        """None input should return None."""
        result = truncate_text(None, 10)
        assert result is None
    
    def test_very_short_max_length(self):
        """Very short max_length should handle gracefully."""
        text = "Hello"
        result = truncate_text(text, 3)
        assert len(result) == 3
    
    def test_max_length_smaller_than_suffix(self):
        """Max length smaller than suffix should truncate suffix."""
        text = "Hello World"
        result = truncate_text(text, 2)
        assert len(result) == 2


class TestSanitizeString:
    """Tests for the sanitize_string utility function."""
    
    def test_normal_string_unchanged(self):
        """Normal string should remain unchanged."""
        text = "Hello World"
        result = sanitize_string(text)
        assert result == "Hello World"
    
    def test_multiple_spaces_collapsed(self):
        """Multiple spaces should be collapsed to single space."""
        text = "Hello    World"
        result = sanitize_string(text)
        assert result == "Hello World"
    
    def test_newlines_converted_to_space(self):
        """Newlines should be converted to single space."""
        text = "Hello\nWorld"
        result = sanitize_string(text)
        assert result == "Hello World"
    
    def test_tabs_converted_to_space(self):
        """Tabs should be converted to single space."""
        text = "Hello\tWorld"
        result = sanitize_string(text)
        assert result == "Hello World"
    
    def test_leading_trailing_whitespace_removed(self):
        """Leading and trailing whitespace should be removed."""
        text = "  Hello World  "
        result = sanitize_string(text)
        assert result == "Hello World"
    
    def test_empty_string(self):
        """Empty string should return empty string."""
        result = sanitize_string("")
        assert result == ""
    
    def test_none_returns_empty(self):
        """None input should return empty string."""
        result = sanitize_string(None)
        assert result == ""
    
    def test_whitespace_only_returns_empty(self):
        """Whitespace-only string should return empty string."""
        result = sanitize_string("   \n\t   ")
        assert result == ""
    
    def test_mixed_whitespace(self):
        """Mixed whitespace types should all be normalized."""
        text = "  Hello  \n\n  World  \t\t  Test  "
        result = sanitize_string(text)
        assert result == "Hello World Test"
