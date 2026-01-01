"""Tests for profile router - user profile, notifications, export, and deletion.

TDD: Tests written to verify profile endpoint behavior.
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


class TestGetProfile:
    """Test suite for GET /api/profile/{user_id} endpoint."""

    def test_returns_profile_with_linked_accounts_count(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should return profile data with linked accounts count."""
        # Mock profile query
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={
                "id": "test-user-123",
                "username": "testuser",
                "display_name": "Test User",
                "phone": "+1234567890",
                "avatar_url": "https://example.com/avatar.jpg",
                "created_at": "2024-12-01T00:00:00Z",
            }
        )

        # Mock linked accounts count query
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            count=2
        )

        response = client.get("/api/profile/test-user-123")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "test-user-123"
        assert data["username"] == "testuser"
        assert data["display_name"] == "Test User"
        assert data["phone"] == "+1234567890"
        assert data["avatar_url"] == "https://example.com/avatar.jpg"
        assert data["created_at"] == "2024-12-01T00:00:00Z"
        assert data["linked_accounts_count"] == 2

    def test_returns_404_when_profile_not_found(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should return 404 when profile doesn't exist."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data=None
        )

        response = client.get("/api/profile/nonexistent-user")

        assert response.status_code == 404
        assert response.json()["detail"] == "Profile not found"

    def test_returns_zero_linked_accounts_for_new_user(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should return 0 linked accounts for user with no banks connected."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={
                "id": "new-user",
                "username": None,
                "display_name": None,
                "phone": "+1111111111",
                "avatar_url": None,
                "created_at": "2025-01-01T00:00:00Z",
            }
        )
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            count=0
        )

        response = client.get("/api/profile/new-user")

        assert response.status_code == 200
        data = response.json()
        assert data["linked_accounts_count"] == 0
        assert data["username"] is None
        assert data["display_name"] is None


class TestGetNotificationPreferences:
    """Test suite for GET /api/profile/{user_id}/notifications endpoint."""

    def test_returns_notification_preferences(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should return all notification preferences."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={
                "user_id": "test-user-123",
                "daily_insights": True,
                "streak_milestones": False,
                "session_invites": True,
                "voting_reminders": False,
                "plan_confirmations": True,
                "marketing": False,
            }
        )

        response = client.get("/api/profile/test-user-123/notifications")

        assert response.status_code == 200
        data = response.json()
        assert data["daily_insights"] is True
        assert data["streak_milestones"] is False
        assert data["session_invites"] is True
        assert data["voting_reminders"] is False
        assert data["plan_confirmations"] is True
        assert data["marketing"] is False

    def test_returns_defaults_for_new_user(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should return default preferences when none exist."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data=None
        )

        response = client.get("/api/profile/new-user/notifications")

        assert response.status_code == 200
        data = response.json()
        # Defaults: all true except marketing
        assert data["daily_insights"] is True
        assert data["streak_milestones"] is True
        assert data["session_invites"] is True
        assert data["voting_reminders"] is True
        assert data["plan_confirmations"] is True
        assert data["marketing"] is False


class TestUpdateNotificationPreferences:
    """Test suite for PUT /api/profile/{user_id}/notifications endpoint."""

    def test_updates_single_preference(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should update only the provided preference field."""
        # Mock upsert
        mock_supabase.table.return_value.upsert.return_value.execute.return_value = MagicMock(data={})

        # Mock get for return value
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={
                "daily_insights": False,
                "streak_milestones": True,
                "session_invites": True,
                "voting_reminders": True,
                "plan_confirmations": True,
                "marketing": False,
            }
        )

        response = client.put(
            "/api/profile/test-user-123/notifications",
            json={"daily_insights": False}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["daily_insights"] is False

    def test_updates_multiple_preferences(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should update multiple preference fields at once."""
        mock_supabase.table.return_value.upsert.return_value.execute.return_value = MagicMock(data={})
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={
                "daily_insights": False,
                "streak_milestones": False,
                "session_invites": True,
                "voting_reminders": True,
                "plan_confirmations": True,
                "marketing": True,
            }
        )

        response = client.put(
            "/api/profile/test-user-123/notifications",
            json={
                "daily_insights": False,
                "streak_milestones": False,
                "marketing": True,
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["daily_insights"] is False
        assert data["streak_milestones"] is False
        assert data["marketing"] is True


class TestExportUserData:
    """Test suite for POST /api/profile/{user_id}/export endpoint."""

    def test_exports_all_user_tables(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should export data from all user-related tables."""
        # Mock profile
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={"id": "test-user", "display_name": "Test"}
        )
        # Mock list queries (visits, transactions, sessions)
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{"id": "item-1"}]
        )

        response = client.post("/api/profile/test-user-123/export")

        assert response.status_code == 200
        data = response.json()
        assert "exported_at" in data
        assert "data" in data
        # Check all expected keys are present
        export_data = data["data"]
        assert "profile" in export_data
        assert "declared_taste" in export_data
        assert "fused_taste" in export_data
        assert "user_analysis" in export_data
        assert "place_visits" in export_data
        assert "transactions" in export_data
        assert "session_participations" in export_data
        assert "notification_preferences" in export_data

    def test_returns_empty_data_for_new_user(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should return null/empty values for user with no data."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data=None
        )
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[]
        )

        response = client.post("/api/profile/new-user/export")

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["profile"] is None
        assert data["data"]["place_visits"] == []


class TestDeleteAccount:
    """Test suite for DELETE /api/profile/{user_id} endpoint."""

    def test_requires_confirmation_header(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should reject deletion without X-Confirm-Delete header."""
        response = client.delete("/api/profile/test-user-123")

        assert response.status_code == 400
        assert "X-Confirm-Delete" in response.json()["detail"]

    def test_requires_correct_confirmation_value(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should reject deletion with wrong header value."""
        response = client.delete(
            "/api/profile/test-user-123",
            headers={"X-Confirm-Delete": "false"}
        )

        assert response.status_code == 400

    def test_returns_404_for_nonexistent_user(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should return 404 if user doesn't exist."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data=None
        )

        response = client.delete(
            "/api/profile/nonexistent",
            headers={"X-Confirm-Delete": "true"}
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "User not found"

    def test_deletes_all_user_data(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should delete user data from all tables."""
        # Mock user exists check
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={"id": "test-user-123"}
        )
        # Mock all delete operations
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        # Mock auth.admin.delete_user
        mock_supabase.auth.admin.delete_user.return_value = None

        response = client.delete(
            "/api/profile/test-user-123",
            headers={"X-Confirm-Delete": "true"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "permanently deleted" in data["message"]

    def test_handles_auth_deletion_error_gracefully(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should succeed even if auth.users deletion fails."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={"id": "test-user-123"}
        )
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        # Simulate auth deletion error
        mock_supabase.auth.admin.delete_user.side_effect = Exception("Auth error")

        response = client.delete(
            "/api/profile/test-user-123",
            headers={"X-Confirm-Delete": "true"}
        )

        # Should still succeed - auth user might already be gone
        assert response.status_code == 200
        assert response.json()["success"] is True
