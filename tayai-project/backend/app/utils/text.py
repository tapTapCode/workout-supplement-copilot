"""
Text Utility Functions

Common text manipulation functions used throughout the application.
"""


def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """
    Truncate text to a maximum length with a suffix.
    
    Args:
        text: The text to truncate
        max_length: Maximum length (including suffix)
        suffix: String to append when truncated (default: "...")
    
    Returns:
        Truncated text with suffix, or original if under max_length
    
    Example:
        >>> truncate_text("Hello world", 8)
        'Hello...'
    """
    if not text or len(text) <= max_length:
        return text
    
    truncate_at = max_length - len(suffix)
    if truncate_at <= 0:
        return suffix[:max_length]
    
    return text[:truncate_at] + suffix


def sanitize_string(text: str) -> str:
    """
    Sanitize a string by removing excess whitespace.
    
    Args:
        text: The text to sanitize
    
    Returns:
        Sanitized text with normalized whitespace
    """
    if not text:
        return ""
    
    # Replace multiple spaces/newlines with single space
    import re
    return re.sub(r'\s+', ' ', text).strip()
