"""Tests for session invitations endpoints.

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


# --- Test Data ---

TEST_USER_ID = "user-123"
TEST_INVITEE_ID = "user-456"
TEST_SESSION_ID = "session-abc"
TEST_INVITATION_ID = "invite-xyz"


class TestGetInvitations:
    """Test suite for GET /api/sessions/{user_id}/invitations endpoint."""

    def test_returns_empty_list_when_no_invitations(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should return empty invitations list when user has no pending invites."""
        # Mock empty invitations query
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[]
        )

        response = client.get(f"/api/sessions/{TEST_USER_ID}/invitations")

        assert response.status_code == 200
        data = response.json()
        assert data["invitations"] == []

    def test_returns_pending_invitations_with_session_details(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should return invitations with session and inviter info."""
        # Mock invitation with joins
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[
                {
                    "id": TEST_INVITATION_ID,
                    "session_id": TEST_SESSION_ID,
                    "inviter_id": "host-user",
                    "invitee_id": TEST_USER_ID,
                    "status": "pending",
                    "created_at": "2025-12-29T10:00:00Z",
                    "sessions": {
                        "id": TEST_SESSION_ID,
                        "title": "Dinner with friends",
                        "planned_date": "2025-12-31",
                        "status": "voting",
                    },
                    "profiles": {
                        "id": "host-user",
                        "display_name": "Sarah",
                        "avatar_url": "https://example.com/sarah.jpg",
                    },
                },
            ]
        )

        # Mock participant count
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            count=3
        )

        # Mock venue count
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            count=5
        )

        response = client.get(f"/api/sessions/{TEST_USER_ID}/invitations")

        assert response.status_code == 200
        data = response.json()
        assert len(data["invitations"]) == 1
        invite = data["invitations"][0]
        assert invite["id"] == TEST_INVITATION_ID
        assert invite["session_title"] == "Dinner with friends"
        assert invite["inviter_name"] == "Sarah"

    def test_excludes_non_pending_invitations(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should only return pending invitations, not accepted/declined."""
        # Query should filter by status='pending'
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[]
        )

        response = client.get(f"/api/sessions/{TEST_USER_ID}/invitations")

        assert response.status_code == 200
        # Verify the query filters by pending status
        calls = mock_supabase.table.return_value.select.return_value.eq.call_args_list
        assert any("pending" in str(call) or "status" in str(call) for call in calls)


class TestSendInvitations:
    """Test suite for POST /api/sessions/{session_id}/invite endpoint."""

    def test_sends_invitations_to_existing_users(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should create invitation records for existing users."""
        # Mock session lookup
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={"id": TEST_SESSION_ID, "status": "voting"}
        )

        # Mock participant check (user is participant)
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={"id": "participant-1"}
        )

        # Mock user lookup
        mock_supabase.table.return_value.select.return_value.in_.return_value.execute.return_value = MagicMock(
            data=[
                {"id": TEST_INVITEE_ID, "display_name": "Alex"},
            ]
        )

        # Mock invitation insert
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(
            data=[{"id": TEST_INVITATION_ID}]
        )

        response = client.post(
            f"/api/sessions/{TEST_SESSION_ID}/invite?user_id={TEST_USER_ID}",
            json={"user_ids": [TEST_INVITEE_ID]},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["sent"] == 1
        assert data["failed"] == 0

    def test_returns_deep_link_for_phone_invites(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should return deep link when inviting via phone number."""
        # Mock session lookup with invite code
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={"id": TEST_SESSION_ID, "status": "voting", "invite_code": "ABC123"}
        )

        # Mock participant check
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={"id": "participant-1"}
        )

        # Mock invitation insert
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(
            data=[{"id": TEST_INVITATION_ID}]
        )

        response = client.post(
            f"/api/sessions/{TEST_SESSION_ID}/invite?user_id={TEST_USER_ID}",
            json={"phone_numbers": ["+14155551234"]},
        )

        assert response.status_code == 200
        data = response.json()
        assert "deep_link" in data
        assert "ABC123" in data["deep_link"]

    def test_rejects_invite_from_non_participant(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should reject invites from users who aren't session participants."""
        # Mock session lookup
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={"id": TEST_SESSION_ID, "status": "voting"}
        )

        # Mock participant check (user is NOT a participant)
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data=None
        )

        response = client.post(
            f"/api/sessions/{TEST_SESSION_ID}/invite?user_id={TEST_USER_ID}",
            json={"user_ids": [TEST_INVITEE_ID]},
        )

        assert response.status_code == 403

    def test_rejects_invite_to_closed_session(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should reject invites to sessions that aren't in voting status."""
        # Mock session lookup (status is confirmed, not voting)
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={"id": TEST_SESSION_ID, "status": "confirmed"}
        )

        response = client.post(
            f"/api/sessions/{TEST_SESSION_ID}/invite?user_id={TEST_USER_ID}",
            json={"user_ids": [TEST_INVITEE_ID]},
        )

        assert response.status_code == 400


class TestRespondToInvitation:
    """Test suite for POST /api/sessions/invitations/{id}/respond endpoint."""

    def test_accept_creates_participant_record(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Accepting invitation should add user as session participant."""
        # Mock invitation lookup
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={
                "id": TEST_INVITATION_ID,
                "session_id": TEST_SESSION_ID,
                "invitee_id": TEST_USER_ID,
                "status": "pending",
            }
        )

        # Mock session lookup
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={"id": TEST_SESSION_ID, "status": "voting"}
        )

        # Mock participant insert
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(
            data=[{"id": "new-participant"}]
        )

        # Mock invitation update
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{"id": TEST_INVITATION_ID, "status": "accepted"}]
        )

        response = client.post(
            f"/api/sessions/invitations/{TEST_INVITATION_ID}/respond?user_id={TEST_USER_ID}",
            json={"action": "accept"},
        )

        assert response.status_code == 200
        # Should return session details after accepting
        data = response.json()
        assert "id" in data  # SessionResponse

    def test_decline_updates_invitation_status(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Declining should update invitation status without adding participant."""
        # Mock invitation lookup
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={
                "id": TEST_INVITATION_ID,
                "session_id": TEST_SESSION_ID,
                "invitee_id": TEST_USER_ID,
                "status": "pending",
            }
        )

        # Mock invitation update
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{"id": TEST_INVITATION_ID, "status": "declined"}]
        )

        response = client.post(
            f"/api/sessions/invitations/{TEST_INVITATION_ID}/respond?user_id={TEST_USER_ID}",
            json={"action": "decline"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_rejects_response_from_wrong_user(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should reject response from user who isn't the invitee."""
        # Mock invitation lookup (different invitee)
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={
                "id": TEST_INVITATION_ID,
                "session_id": TEST_SESSION_ID,
                "invitee_id": "different-user",  # Not the requesting user
                "status": "pending",
            }
        )

        response = client.post(
            f"/api/sessions/invitations/{TEST_INVITATION_ID}/respond?user_id={TEST_USER_ID}",
            json={"action": "accept"},
        )

        assert response.status_code == 403

    def test_rejects_response_to_already_responded_invitation(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should reject response to invitation that's not pending."""
        # Mock invitation lookup (already accepted)
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={
                "id": TEST_INVITATION_ID,
                "session_id": TEST_SESSION_ID,
                "invitee_id": TEST_USER_ID,
                "status": "accepted",  # Already responded
            }
        )

        response = client.post(
            f"/api/sessions/invitations/{TEST_INVITATION_ID}/respond?user_id={TEST_USER_ID}",
            json={"action": "accept"},
        )

        assert response.status_code == 400

    def test_rejects_accept_for_closed_session(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should reject acceptance if session is no longer voting."""
        # Mock invitation lookup
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={
                "id": TEST_INVITATION_ID,
                "session_id": TEST_SESSION_ID,
                "invitee_id": TEST_USER_ID,
                "status": "pending",
            }
        )

        # Session is confirmed, not voting
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={"id": TEST_SESSION_ID, "status": "confirmed"}
        )

        response = client.post(
            f"/api/sessions/invitations/{TEST_INVITATION_ID}/respond?user_id={TEST_USER_ID}",
            json={"action": "accept"},
        )

        assert response.status_code == 400


class TestUserSearch:
    """Test suite for GET /api/users/search endpoint."""

    def test_search_by_username(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should return users matching username query."""
        # Mock user search
        mock_supabase.table.return_value.select.return_value.ilike.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[
                {
                    "id": "user-1",
                    "display_name": "Alex Smith",
                    "avatar_url": "https://example.com/alex.jpg",
                },
                {
                    "id": "user-2",
                    "display_name": "Alexandra Jones",
                    "avatar_url": None,
                },
            ]
        )

        response = client.get("/api/users/search?q=alex&type=username")

        assert response.status_code == 200
        data = response.json()
        assert len(data["users"]) == 2
        assert data["users"][0]["display_name"] == "Alex Smith"

    def test_search_by_phone(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should return user matching exact phone number."""
        # Mock phone search
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={
                "id": "user-1",
                "display_name": "Alex",
                "phone": "+14155551234",
                "avatar_url": None,
            }
        )

        response = client.get("/api/users/search?q=%2B14155551234&type=phone")

        assert response.status_code == 200
        data = response.json()
        assert len(data["users"]) == 1
        assert data["users"][0]["id"] == "user-1"

    def test_returns_empty_when_no_matches(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should return empty list when no users match."""
        mock_supabase.table.return_value.select.return_value.ilike.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[]
        )

        response = client.get("/api/users/search?q=nonexistent&type=username")

        assert response.status_code == 200
        data = response.json()
        assert data["users"] == []

    def test_requires_query_parameter(
        self, client: TestClient, mock_supabase: MagicMock
    ) -> None:
        """Should require q parameter."""
        response = client.get("/api/users/search?type=username")

        assert response.status_code == 422  # Validation error
