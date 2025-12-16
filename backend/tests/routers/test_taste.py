"""Tests for taste router - profile fetching endpoint.

TDD: Write tests first, then implement.
"""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_supabase_client
from app.main import app


@pytest.fixture
def mock_supabase() -> MagicMock:
    """Create a mock Supabase client."""
    mock = MagicMock()
    return mock


@pytest.fixture
def client(mock_supabase: MagicMock) -> TestClient:
    """Create a test client with mocked Supabase."""
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    yield TestClient(app)
    app.dependency_overrides.clear()


class TestGetTasteProfile:
    """Test suite for GET /api/taste/profile/{user_id} endpoint."""

    def test_get_profile_returns_title_and_traits(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should return profile with title, tagline, and traits."""
        # Mock declared_taste data from DB
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={
                "user_id": "test-user-123",
                "vibe_preferences": ["trendy", "social"],
                "cuisine_preferences": ["asian"],
                "exploration_style": "adventurous",
                "social_preference": "big_group",
                "price_tier": "premium",
            }
        )

        response = client.get("/api/taste/profile/test-user-123")

        assert response.status_code == 200
        data = response.json()
        assert "title" in data
        assert "tagline" in data
        assert "traits" in data
        assert len(data["traits"]) == 4

    def test_get_profile_returns_correct_title_for_adventurous_trendy(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Adventurous + trendy should return Trend Hunter."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={
                "user_id": "test-user-123",
                "vibe_preferences": ["trendy", "upscale"],
                "cuisine_preferences": [],
                "exploration_style": "adventurous",
                "social_preference": None,
                "price_tier": None,
            }
        )

        response = client.get("/api/taste/profile/test-user-123")

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Trend Hunter"

    def test_get_profile_returns_all_trait_fields(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Each trait should have name, emoji, description, score, color."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={
                "user_id": "test-user-123",
                "vibe_preferences": ["chill"],
                "cuisine_preferences": [],
                "exploration_style": "moderate",
                "social_preference": None,
                "price_tier": None,
            }
        )

        response = client.get("/api/taste/profile/test-user-123")

        assert response.status_code == 200
        data = response.json()
        for trait in data["traits"]:
            assert "name" in trait
            assert "emoji" in trait
            assert "description" in trait
            assert "score" in trait
            assert "color" in trait
            assert 0 <= trait["score"] <= 100
            assert trait["color"].startswith("#")

    def test_get_profile_returns_taste_preferences(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should include exploration_style, vibe_preferences, cuisine, price_tier."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={
                "user_id": "test-user-123",
                "vibe_preferences": ["social", "energetic"],
                "cuisine_preferences": ["italian", "asian"],
                "exploration_style": "very_adventurous",
                "social_preference": "big_group",
                "price_tier": "luxury",
            }
        )

        response = client.get("/api/taste/profile/test-user-123")

        assert response.status_code == 200
        data = response.json()
        assert data["exploration_style"] == "very_adventurous"
        assert "social" in data["vibe_preferences"]
        assert "italian" in data["cuisine_preferences"]
        assert data["price_tier"] == "luxury"

    def test_get_profile_returns_404_when_not_found(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should return 404 when user has no taste profile."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data=None
        )

        response = client.get("/api/taste/profile/nonexistent-user")

        assert response.status_code == 404

    def test_get_profile_handles_empty_preferences(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should handle empty preferences gracefully."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={
                "user_id": "test-user-123",
                "vibe_preferences": [],
                "cuisine_preferences": [],
                "exploration_style": None,
                "social_preference": None,
                "price_tier": None,
            }
        )

        response = client.get("/api/taste/profile/test-user-123")

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Taste Explorer"  # Default title
