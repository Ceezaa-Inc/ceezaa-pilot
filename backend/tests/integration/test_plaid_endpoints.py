"""Integration tests for Plaid API endpoints.

These tests verify the Plaid endpoint behavior using the Plaid sandbox.
Run with: pytest tests/integration/test_plaid_endpoints.py -v
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


class TestCreateLinkToken:
    """Tests for POST /api/plaid/create-link-token."""

    @pytest.mark.integration
    def test_create_link_token_returns_token(self, client: TestClient) -> None:
        """Create link token endpoint should return a valid link token."""
        response = client.post(
            "/api/plaid/create-link-token",
            json={"user_id": "test-user-123"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "link_token" in data
        assert "expiration" in data
        assert data["link_token"].startswith("link-")

    @pytest.mark.integration
    def test_create_link_token_requires_user_id(self, client: TestClient) -> None:
        """Create link token should fail without user_id."""
        response = client.post(
            "/api/plaid/create-link-token",
            json={},
        )

        assert response.status_code == 422  # Validation error


class TestExchangeToken:
    """Tests for POST /api/plaid/exchange-token."""

    @pytest.mark.integration
    @pytest.mark.skip(reason="Requires real Supabase database - run with live DB only")
    def test_exchange_token_returns_access_token(self, client: TestClient) -> None:
        """Exchange token endpoint should return access token and item_id."""
        # First create a sandbox public token to exchange
        from app.services.plaid_client import create_sandbox_public_token

        public_token = create_sandbox_public_token()

        response = client.post(
            "/api/plaid/exchange-token",
            json={
                "public_token": public_token,
                "institution_id": "ins_109508",
                "institution_name": "First Platypus Bank",
                "user_id": "test-user-123",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "account_id" in data
        assert "institution_name" in data
        assert data["institution_name"] == "First Platypus Bank"

    @pytest.mark.integration
    def test_exchange_token_requires_public_token(self, client: TestClient) -> None:
        """Exchange token should fail without public_token."""
        response = client.post(
            "/api/plaid/exchange-token",
            json={},
        )

        assert response.status_code == 422  # Validation error


class TestSyncTransactions:
    """Tests for POST /api/plaid/sync."""

    @pytest.mark.integration
    @pytest.mark.skip(reason="Requires real Supabase database - run with live DB only")
    def test_sync_returns_transaction_counts(self, client: TestClient) -> None:
        """Sync endpoint should return transaction counts."""
        # This test will need a valid account_id from a linked account
        # For now, we'll test the validation error
        response = client.post(
            "/api/plaid/sync",
            json={"account_id": "non-existent-id"},
        )

        # Should fail with 404 because account doesn't exist
        assert response.status_code == 404


class TestDeleteAccount:
    """Tests for DELETE /api/plaid/accounts/{account_id}."""

    @pytest.mark.integration
    @pytest.mark.skip(reason="Requires real Supabase database - run with live DB only")
    def test_delete_non_existent_account_returns_404(
        self, client: TestClient
    ) -> None:
        """Delete should return 404 for non-existent account."""
        response = client.delete("/api/plaid/accounts/non-existent-id")

        assert response.status_code == 404
