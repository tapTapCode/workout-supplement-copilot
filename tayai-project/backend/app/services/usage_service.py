"""
Usage service - Business logic for usage tracking and rate limiting
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from app.db.models import UsageTracking, UserTier
from app.core.config import settings
from app.schemas.usage import UsageStatus
import redis

# Initialize Redis client
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


class UsageService:
    """Service for usage tracking and rate limiting"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    def _get_message_limit(self, tier: str) -> int:
        """Get message limit for tier"""
        limits = {
            UserTier.BASIC.value: settings.BASIC_MEMBER_MESSAGES_PER_MONTH,
            UserTier.PREMIUM.value: settings.PREMIUM_MEMBER_MESSAGES_PER_MONTH,
            UserTier.VIP.value: settings.VIP_MEMBER_MESSAGES_PER_MONTH,
        }
        return limits.get(tier, settings.BASIC_MEMBER_MESSAGES_PER_MONTH)
    
    async def check_usage_limit(self, user_id: int, tier: str) -> bool:
        """Check if user can send a message"""
        # Get current period
        now = datetime.utcnow()
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        period_end = (period_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        # Check Redis cache first
        cache_key = f"usage:{user_id}:{period_start.strftime('%Y-%m')}"
        cached_count = redis_client.get(cache_key)
        
        if cached_count:
            messages_used = int(cached_count)
        else:
            # Query database
            result = await self.db.execute(
                select(func.sum(UsageTracking.messages_count))
                .where(
                    UsageTracking.user_id == user_id,
                    UsageTracking.period_start >= period_start,
                    UsageTracking.period_end <= period_end
                )
            )
            messages_used = result.scalar() or 0
            # Cache for 1 hour
            redis_client.setex(cache_key, 3600, messages_used)
        
        limit = self._get_message_limit(tier)
        return messages_used < limit
    
    async def record_usage(self, user_id: int, tokens_used: int = 0):
        """Record usage for a user"""
        now = datetime.utcnow()
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        period_end = (period_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        # Get or create usage tracking record
        result = await self.db.execute(
            select(UsageTracking)
            .where(
                UsageTracking.user_id == user_id,
                UsageTracking.period_start == period_start
            )
        )
        usage = result.scalar_one_or_none()
        
        if usage:
            usage.messages_count += 1
            usage.tokens_used += tokens_used
        else:
            usage = UsageTracking(
                user_id=user_id,
                period_start=period_start,
                period_end=period_end,
                messages_count=1,
                tokens_used=tokens_used
            )
            self.db.add(usage)
        
        await self.db.commit()
        
        # Update Redis cache
        cache_key = f"usage:{user_id}:{period_start.strftime('%Y-%m')}"
        redis_client.incr(cache_key)
        redis_client.expire(cache_key, 3600)
    
    async def get_usage_status(self, user_id: int, tier: str) -> UsageStatus:
        """Get current usage status for user"""
        now = datetime.utcnow()
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        period_end = (period_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        result = await self.db.execute(
            select(UsageTracking)
            .where(
                UsageTracking.user_id == user_id,
                UsageTracking.period_start == period_start
            )
        )
        usage = result.scalar_one_or_none()
        
        messages_used = usage.messages_count if usage else 0
        tokens_used = usage.tokens_used if usage else 0
        limit = self._get_message_limit(tier)
        
        return UsageStatus(
            user_id=user_id,
            tier=tier,
            messages_used=messages_used,
            messages_limit=limit,
            tokens_used=tokens_used,
            period_start=period_start,
            period_end=period_end,
            can_send=messages_used < limit
        )
