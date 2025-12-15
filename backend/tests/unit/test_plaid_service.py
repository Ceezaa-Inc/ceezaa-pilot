"""Unit tests for PlaidService.

These tests mock the Supabase client to test business logic in isolation.
"""

from __future__ import annotations

from datetime import datetime
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from app.services.plaid_service import PlaidService


class TestPlaidServiceLinkAccount:
    """Tests for PlaidService.link_account()."""

    @pytest.mark.unit
    def test_link_account_creates_record(self) -> None:
        """link_account should create a linked_accounts record."""
        # Arrange
        mock_supabase = MagicMock()
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
            {
                "id": str(uuid4()),
                "user_id": "user-123",
                "plaid_item_id": "item-abc",
                "institution_name": "First Platypus Bank",
                "created_at": datetime.now().isoformat(),
            }
        ]

        service = PlaidService(mock_supabase)

        # Act
        result = service.link_account(
            user_id="user-123",
            access_token="access-sandbox-xxx",
            item_id="item-abc",
            institution_id="ins_109508",
            institution_name="First Platypus Bank",
        )

        # Assert
        assert result["institution_name"] == "First Platypus Bank"
        assert "id" in result
        mock_supabase.table.assert_called_with("linked_accounts")

    @pytest.mark.unit
    def test_link_account_stores_access_token(self) -> None:
        """link_account should store the encrypted access token."""
        mock_supabase = MagicMock()
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
            {"id": str(uuid4()), "user_id": "user-123", "plaid_item_id": "item-abc"}
        ]

        service = PlaidService(mock_supabase)

        service.link_account(
            user_id="user-123",
            access_token="access-sandbox-xxx",
            item_id="item-abc",
            institution_id="ins_109508",
            institution_name="First Platypus Bank",
        )

        # Verify insert was called with access_token
        insert_call = mock_supabase.table.return_value.insert.call_args
        insert_data = insert_call[0][0]
        assert insert_data["plaid_access_token"] == "access-sandbox-xxx"


class TestPlaidServiceGetAccount:
    """Tests for PlaidService.get_account()."""

    @pytest.mark.unit
    def test_get_account_returns_account(self) -> None:
        """get_account should return the account if it exists."""
        mock_supabase = MagicMock()
        account_id = str(uuid4())
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "id": account_id,
            "user_id": "user-123",
            "plaid_item_id": "item-abc",
            "plaid_access_token": "access-xxx",
            "institution_name": "First Platypus Bank",
            "sync_cursor": None,
        }

        service = PlaidService(mock_supabase)

        result = service.get_account(account_id)

        assert result is not None
        assert result["id"] == account_id

    @pytest.mark.unit
    def test_get_account_returns_none_if_not_found(self) -> None:
        """get_account should return None if account doesn't exist."""
        mock_supabase = MagicMock()
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = (
            None
        )

        service = PlaidService(mock_supabase)

        result = service.get_account("non-existent-id")

        assert result is None


class TestPlaidServiceSyncTransactions:
    """Tests for PlaidService.sync_transactions()."""

    @pytest.mark.unit
    @patch("app.services.plaid_service.sync_transactions")
    def test_sync_uses_stored_cursor(self, mock_sync: MagicMock) -> None:
        """sync_transactions should use the stored cursor for incremental sync."""
        mock_supabase = MagicMock()
        account_id = str(uuid4())
        stored_cursor = "cursor-abc-123"

        # Mock get_account to return account with cursor
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "id": account_id,
            "plaid_access_token": "access-xxx",
            "sync_cursor": stored_cursor,
        }

        # Mock plaid sync response
        mock_sync.return_value = {
            "added": [],
            "modified": [],
            "removed": [],
            "next_cursor": "cursor-def-456",
            "has_more": False,
        }

        service = PlaidService(mock_supabase)
        service.sync_transactions(account_id)

        # Verify sync was called with stored cursor
        mock_sync.assert_called_once_with("access-xxx", cursor=stored_cursor)

    @pytest.mark.unit
    @patch("app.services.plaid_service.sync_transactions")
    def test_sync_updates_cursor_after_sync(self, mock_sync: MagicMock) -> None:
        """sync_transactions should update the stored cursor after sync."""
        mock_supabase = MagicMock()
        account_id = str(uuid4())
        new_cursor = "cursor-new-789"

        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "id": account_id,
            "plaid_access_token": "access-xxx",
            "sync_cursor": None,
        }

        mock_sync.return_value = {
            "added": [],
            "modified": [],
            "removed": [],
            "next_cursor": new_cursor,
            "has_more": False,
        }

        service = PlaidService(mock_supabase)
        service.sync_transactions(account_id)

        # Verify cursor was updated in DB
        update_call = mock_supabase.table.return_value.update.call_args
        update_data = update_call[0][0]
        assert update_data["sync_cursor"] == new_cursor


class TestPlaidServiceDeleteAccount:
    """Tests for PlaidService.delete_account()."""

    @pytest.mark.unit
    def test_delete_account_removes_record(self) -> None:
        """delete_account should remove the linked_accounts record."""
        mock_supabase = MagicMock()
        account_id = str(uuid4())

        # Mock get_account to return existing account
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "id": account_id,
            "plaid_access_token": "access-xxx",
        }

        service = PlaidService(mock_supabase)

        result = service.delete_account(account_id)

        assert result is True
        mock_supabase.table.return_value.delete.assert_called_once()

    @pytest.mark.unit
    def test_delete_account_returns_false_if_not_found(self) -> None:
        """delete_account should return False if account doesn't exist."""
        mock_supabase = MagicMock()
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = (
            None
        )

        service = PlaidService(mock_supabase)

        result = service.delete_account("non-existent-id")

        assert result is False
