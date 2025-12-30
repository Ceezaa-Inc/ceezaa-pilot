"""Tests for vault router - place visits endpoint.

TDD: Write tests first, then implement.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

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


class TestGetVaultVisits:
    """Test suite for GET /api/vault/visits/{user_id} endpoint."""

    def test_returns_empty_vault_when_no_visits(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should return empty places list and zero stats when no visits."""
        # Mock empty place_visits
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
            data=[]
        )

        response = client.get("/api/vault/visits/test-user-123")

        assert response.status_code == 200
        data = response.json()
        assert data["places"] == []
        assert data["stats"]["total_places"] == 0
        assert data["stats"]["total_visits"] == 0
        assert data["stats"]["this_month_spent"] == 0

    def test_returns_places_with_visit_counts(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should aggregate visits by place and return counts."""
        # Mock place_visits with venue join
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
            data=[
                {
                    "id": "visit-1",
                    "user_id": "test-user-123",
                    "venue_id": "venue-1",
                    "merchant_name": "Starbucks",
                    "amount": 5.50,
                    "visited_at": "2025-12-29T10:00:00Z",
                    "reaction": None,
                    "notes": None,
                    "source": "transaction",
                    "venues": {
                        "id": "venue-1",
                        "name": "Starbucks Reserve",
                        "taste_cluster": "coffee",
                        "photo_references": ["ref1"],
                        "google_place_id": "ChIJ_test123",
                    },
                },
                {
                    "id": "visit-2",
                    "user_id": "test-user-123",
                    "venue_id": "venue-1",
                    "merchant_name": "Starbucks",
                    "amount": 6.00,
                    "visited_at": "2025-12-28T09:00:00Z",
                    "reaction": "loved",
                    "notes": None,
                    "source": "transaction",
                    "venues": {
                        "id": "venue-1",
                        "name": "Starbucks Reserve",
                        "taste_cluster": "coffee",
                        "photo_references": ["ref1"],
                        "google_place_id": "ChIJ_test123",
                    },
                },
            ]
        )

        response = client.get("/api/vault/visits/test-user-123")

        assert response.status_code == 200
        data = response.json()
        assert len(data["places"]) == 1
        place = data["places"][0]
        assert place["venue_name"] == "Starbucks Reserve"
        assert place["visit_count"] == 2
        assert place["total_spent"] == 11.50
        assert data["stats"]["total_visits"] == 2

    def test_photo_url_uses_proxy_pattern(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Photo URL should use /api/discover/photo proxy endpoint."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
            data=[
                {
                    "id": "visit-1",
                    "user_id": "test-user-123",
                    "venue_id": "venue-1",
                    "merchant_name": "Blue Bottle",
                    "amount": 7.00,
                    "visited_at": "2025-12-29T10:00:00Z",
                    "reaction": None,
                    "notes": None,
                    "source": "transaction",
                    "venues": {
                        "id": "venue-1",
                        "name": "Blue Bottle Coffee",
                        "taste_cluster": "coffee",
                        "photo_references": ["photo_ref_abc"],
                        "google_place_id": "ChIJ_bluebottle",
                    },
                },
            ]
        )

        response = client.get("/api/vault/visits/test-user-123")

        assert response.status_code == 200
        data = response.json()
        place = data["places"][0]
        # Photo URL should use proxy pattern, not raw reference
        assert place["photo_url"] is not None
        assert "/api/discover/photo/ChIJ_bluebottle/0" in place["photo_url"]
        assert "photo_ref_abc" not in place["photo_url"]

    def test_returns_google_place_id_for_navigation(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should include google_place_id for venue detail navigation."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
            data=[
                {
                    "id": "visit-1",
                    "user_id": "test-user-123",
                    "venue_id": "venue-1",
                    "merchant_name": "Starbucks",
                    "amount": 5.00,
                    "visited_at": "2025-12-29T10:00:00Z",
                    "reaction": None,
                    "notes": None,
                    "source": "transaction",
                    "venues": {
                        "id": "venue-1",
                        "name": "Starbucks",
                        "taste_cluster": "coffee",
                        "photo_references": [],
                        "google_place_id": "ChIJ_starbucks123",
                    },
                },
            ]
        )

        response = client.get("/api/vault/visits/test-user-123")

        assert response.status_code == 200
        data = response.json()
        place = data["places"][0]
        assert place["google_place_id"] == "ChIJ_starbucks123"

    def test_handles_unmatched_merchants(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should display merchants without venue matches."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
            data=[
                {
                    "id": "visit-1",
                    "user_id": "test-user-123",
                    "venue_id": None,  # No venue matched
                    "merchant_name": "Local Coffee Shop",
                    "amount": 4.50,
                    "visited_at": "2025-12-29T10:00:00Z",
                    "reaction": None,
                    "notes": None,
                    "source": "transaction",
                    "venues": None,  # No venue data
                },
            ]
        )

        response = client.get("/api/vault/visits/test-user-123")

        assert response.status_code == 200
        data = response.json()
        assert len(data["places"]) == 1
        place = data["places"][0]
        assert place["venue_name"] == "Local Coffee Shop"
        assert place["venue_id"] is None
        assert place["photo_url"] is None


class TestVaultAutoSync:
    """Test suite for auto-sync functionality on vault load."""

    def test_calls_create_place_visits_on_load(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should call PlaidService._create_place_visits on vault load."""
        # Mock empty result
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
            data=[]
        )

        with patch("app.routers.vault.PlaidService") as mock_plaid_class:
            mock_plaid_instance = MagicMock()
            mock_plaid_class.return_value = mock_plaid_instance

            response = client.get("/api/vault/visits/test-user-123")

            assert response.status_code == 200
            mock_plaid_instance._create_place_visits.assert_called_once_with(
                "test-user-123"
            )

    def test_calls_match_venues_on_load(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should call PlaidService._match_venues_for_user on vault load."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
            data=[]
        )

        with patch("app.routers.vault.PlaidService") as mock_plaid_class:
            mock_plaid_instance = MagicMock()
            mock_plaid_class.return_value = mock_plaid_instance

            response = client.get("/api/vault/visits/test-user-123")

            assert response.status_code == 200
            mock_plaid_instance._match_venues_for_user.assert_called_once_with(
                "test-user-123"
            )


class TestBuildPhotoUrl:
    """Test suite for _build_photo_url helper function."""

    def test_returns_none_when_no_venue(self) -> None:
        """Should return None when venue is None."""
        from app.routers.vault import _build_photo_url

        result = _build_photo_url("http://test.com", None)
        assert result is None

    def test_returns_none_when_no_photo_references(self) -> None:
        """Should return None when venue has no photo_references."""
        from app.routers.vault import _build_photo_url

        venue = {"google_place_id": "ChIJ_test", "photo_references": []}
        result = _build_photo_url("http://test.com", venue)
        assert result is None

    def test_returns_none_when_no_google_place_id(self) -> None:
        """Should return None when venue has no google_place_id."""
        from app.routers.vault import _build_photo_url

        venue = {"google_place_id": None, "photo_references": ["ref1"]}
        result = _build_photo_url("http://test.com", venue)
        assert result is None

    def test_returns_proxy_url_with_valid_data(self) -> None:
        """Should return proxy URL when venue has photo data."""
        from app.routers.vault import _build_photo_url

        venue = {"google_place_id": "ChIJ_coffee", "photo_references": ["ref1", "ref2"]}
        result = _build_photo_url("http://test.com", venue)
        assert result == "http://test.com/api/discover/photo/ChIJ_coffee/0"
