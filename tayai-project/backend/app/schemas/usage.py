"""
Usage tracking schemas
"""
from pydantic import BaseModel
from datetime import datetime


class UsageStatus(BaseModel):
    """Usage status schema"""
    user_id: int
    tier: str
    messages_used: int
    messages_limit: int
    tokens_used: int
    period_start: datetime
    period_end: datetime
    can_send: bool
