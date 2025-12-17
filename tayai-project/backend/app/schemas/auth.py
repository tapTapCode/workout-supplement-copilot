"""
Authentication schemas
"""
from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema"""
    sub: Optional[str] = None
    user_id: Optional[int] = None
    tier: Optional[str] = None


class UserLogin(BaseModel):
    """User login request schema"""
    username: str
    password: str


class UserVerify(BaseModel):
    """User verification response schema"""
    valid: bool
    user_id: Optional[int] = None
    tier: Optional[str] = None
