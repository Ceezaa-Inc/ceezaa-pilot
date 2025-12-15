"""PlaidService - Business logic for Plaid account linking and transaction sync."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from supabase import Client

from app.services.plaid_client import sync_transactions


class PlaidService:
    """Service for managing Plaid linked accounts and transaction sync."""

    def __init__(self, supabase: Client) -> None:
        """Initialize PlaidService with a Supabase client.

        Args:
            supabase: Supabase client instance for database operations
        """
        self._supabase = supabase

    def link_account(
        self,
        user_id: str,
        access_token: str,
        item_id: str,
        institution_id: str,
        institution_name: str,
    ) -> dict[str, Any]:
        """Link a new bank account for a user.

        Args:
            user_id: The user's ID
            access_token: Plaid access token (to be stored securely)
            item_id: Plaid item ID
            institution_id: Plaid institution ID
            institution_name: Name of the institution

        Returns:
            The created linked account record
        """
        result = (
            self._supabase.table("linked_accounts")
            .insert(
                {
                    "user_id": user_id,
                    "plaid_item_id": item_id,
                    "plaid_access_token": access_token,
                    "institution_id": institution_id,
                    "institution_name": institution_name,
                }
            )
            .execute()
        )

        return result.data[0]

    def get_account(self, account_id: str) -> Optional[dict[str, Any]]:
        """Get a linked account by ID.

        Args:
            account_id: The linked account's UUID

        Returns:
            The linked account record or None if not found
        """
        result = (
            self._supabase.table("linked_accounts")
            .select("*")
            .eq("id", account_id)
            .single()
            .execute()
        )

        return result.data

    def get_user_accounts(self, user_id: str) -> list[dict[str, Any]]:
        """Get all linked accounts for a user.

        Args:
            user_id: The user's ID

        Returns:
            List of linked account records
        """
        result = (
            self._supabase.table("linked_accounts")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )

        return result.data or []

    def sync_transactions(self, account_id: str) -> dict[str, Any]:
        """Sync transactions for a linked account.

        Uses cursor-based sync for incremental updates.

        Args:
            account_id: The linked account's UUID

        Returns:
            Sync result with actual transaction data
        """
        # Get account with access token and cursor
        account = self.get_account(account_id)
        if not account:
            raise ValueError(f"Account not found: {account_id}")

        access_token = account["plaid_access_token"]
        cursor = account.get("sync_cursor")

        # Sync transactions from Plaid
        sync_result = sync_transactions(access_token, cursor=cursor)

        # Update cursor and last_synced_at in database
        self._supabase.table("linked_accounts").update(
            {
                "sync_cursor": sync_result["next_cursor"],
                "last_synced_at": datetime.utcnow().isoformat(),
            }
        ).eq("id", account_id).execute()

        # Return actual transaction data for mobile app display
        return {
            "added": sync_result["added"],
            "modified": sync_result["modified"],
            "removed": sync_result["removed"],
            "has_more": sync_result["has_more"],
        }

    def delete_account(self, account_id: str) -> bool:
        """Delete a linked account.

        Args:
            account_id: The linked account's UUID

        Returns:
            True if deleted, False if account not found
        """
        # Check if account exists
        account = self.get_account(account_id)
        if not account:
            return False

        # Delete the account
        self._supabase.table("linked_accounts").delete().eq(
            "id", account_id
        ).execute()

        return True
