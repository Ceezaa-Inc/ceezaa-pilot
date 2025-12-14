"""FastAPI dependency injection."""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from supabase import Client, create_client

from app.config import Settings, get_settings

# Type alias for settings dependency
SettingsDep = Annotated[Settings, Depends(get_settings)]


@lru_cache
def get_supabase_client() -> Client:
    """Get a cached Supabase client instance.

    Returns a singleton client instance to avoid creating
    multiple connections.
    """
    settings = get_settings()
    return create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_service_role_key,
    )


# Type alias for Supabase dependency
SupabaseDep = Annotated[Client, Depends(get_supabase_client)]
