"""Tests for Supabase client connection."""

from __future__ import annotations

import pytest
from supabase import Client

from app.dependencies import get_supabase_client


class TestSupabaseClient:
    """Test Supabase client setup."""

    def test_get_supabase_client_returns_client(self) -> None:
        """Test that get_supabase_client returns a Supabase Client instance."""
        client = get_supabase_client()
        assert client is not None
        assert isinstance(client, Client)

    def test_supabase_client_is_singleton(self) -> None:
        """Test that get_supabase_client returns the same instance (cached)."""
        client1 = get_supabase_client()
        client2 = get_supabase_client()
        assert client1 is client2
