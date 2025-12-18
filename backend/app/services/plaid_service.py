"""PlaidService - Business logic for Plaid account linking and transaction sync."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from supabase import Client

from app.mappings.plaid_categories import get_taste_category, get_cuisine
from app.services.plaid_client import sync_transactions
from app.intelligence.aggregation_engine import AggregationEngine, UserAnalysis
from app.models.plaid import ProcessedTransaction


def _get_time_bucket(dt: Optional[datetime]) -> str:
    """Get time bucket from datetime.

    Args:
        dt: Transaction datetime (may be None)

    Returns:
        Time bucket: morning (6-12), afternoon (12-17), evening (17-21), night (21-6)
    """
    if dt is None:
        return "unknown"
    hour = dt.hour
    if 6 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"


def _get_day_type(dt: Optional[datetime]) -> str:
    """Get day type from datetime.

    Args:
        dt: Transaction datetime or date

    Returns:
        "weekday" or "weekend"
    """
    if dt is None:
        return "unknown"
    # weekday() returns 0-4 for Mon-Fri, 5-6 for Sat-Sun
    return "weekend" if dt.weekday() >= 5 else "weekday"


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
        Stores transactions to database and returns results.

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
        user_id = account["user_id"]

        # Sync transactions from Plaid
        sync_result = sync_transactions(access_token, cursor=cursor)

        # Store added/modified transactions to database
        added = sync_result["added"]
        modified = sync_result["modified"]
        self._store_transactions(added, user_id, account_id)
        self._store_transactions(modified, user_id, account_id)

        # Handle removed transactions
        removed_ids = sync_result["removed"]
        if removed_ids:
            self._supabase.table("transactions").delete().in_(
                "plaid_transaction_id", removed_ids
            ).execute()

        # Update cursor and last_synced_at in database
        self._supabase.table("linked_accounts").update(
            {
                "sync_cursor": sync_result["next_cursor"],
                "last_synced_at": datetime.utcnow().isoformat(),
            }
        ).eq("id", account_id).execute()

        # Aggregate transactions after sync
        if added or modified or removed_ids:
            print(f"[PlaidService] Running aggregation for user {user_id}")
            self.aggregate_transactions(user_id)

        # Return actual transaction data for mobile app display
        return {
            "added": added,
            "modified": modified,
            "removed": removed_ids,
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

    def _store_transactions(
        self,
        transactions: list[Any],
        user_id: str,
        linked_account_id: str,
    ) -> int:
        """Store transactions to the database.

        Args:
            transactions: List of Plaid transaction objects
            user_id: The user's ID
            linked_account_id: The linked account's UUID

        Returns:
            Number of transactions stored
        """
        if not transactions:
            return 0

        records = []
        for tx in transactions:
            # Extract category info
            pfc = tx.personal_finance_category
            primary_cat = pfc.primary if pfc else None
            detailed_cat = pfc.detailed if pfc else None
            taste_cat = get_taste_category(detailed_cat) if detailed_cat else "other"
            cuisine = get_cuisine(detailed_cat) if detailed_cat else None

            # Extract location
            loc = tx.location
            city = loc.city if loc else None
            state = loc.region if loc else None

            # Get time info from datetime or date
            tx_datetime = tx.datetime
            tx_date = tx.date

            # Use datetime for time bucket, fall back to date for day type
            time_bucket = _get_time_bucket(tx_datetime)
            day_type = _get_day_type(tx_datetime or tx_date)

            records.append({
                "user_id": user_id,
                "linked_account_id": linked_account_id,
                "plaid_transaction_id": tx.transaction_id,
                "amount": tx.amount,
                "date": tx_date.isoformat() if tx_date else None,
                "datetime": tx_datetime.isoformat() if tx_datetime else None,
                "merchant_name": tx.merchant_name or tx.name,
                "merchant_id": tx.merchant_entity_id,
                "plaid_category_primary": primary_cat,
                "plaid_category_detailed": detailed_cat,
                "taste_category": taste_cat,
                "cuisine": cuisine,
                "time_bucket": time_bucket,
                "day_type": day_type,
                "location_city": city,
                "location_state": state,
            })

        # Upsert to handle duplicates (based on plaid_transaction_id unique constraint)
        self._supabase.table("transactions").upsert(
            records,
            on_conflict="plaid_transaction_id",
        ).execute()

        return len(records)

    def aggregate_transactions(self, user_id: str) -> dict[str, Any]:
        """Aggregate all transactions for a user into user_analysis.

        Fetches transactions from DB and runs through AggregationEngine.
        Uses O(1) incremental updates per transaction.

        Args:
            user_id: The user's ID

        Returns:
            The updated user_analysis record
        """
        # Fetch all transactions for user
        result = (
            self._supabase.table("transactions")
            .select("*")
            .eq("user_id", user_id)
            .order("date", desc=False)
            .execute()
        )
        transactions = result.data or []

        if not transactions:
            return {}

        # Initialize aggregation
        engine = AggregationEngine()
        analysis = UserAnalysis(user_id=user_id)

        # Process each transaction incrementally
        for tx in transactions:
            # Convert DB record to ProcessedTransaction
            tx_datetime = None
            if tx.get("datetime"):
                tx_datetime = datetime.fromisoformat(tx["datetime"].replace("Z", "+00:00"))
            elif tx.get("date"):
                from datetime import date as date_type
                d = date_type.fromisoformat(tx["date"])
                tx_datetime = datetime(d.year, d.month, d.day, 12, 0)  # Noon default

            processed = ProcessedTransaction(
                id=tx["plaid_transaction_id"],
                amount=abs(float(tx["amount"])),  # Ensure positive
                timestamp=tx_datetime,
                merchant_name=tx.get("merchant_name") or "Unknown",
                merchant_id=tx.get("merchant_id"),
                taste_category=tx.get("taste_category") or "other",
                cuisine=tx.get("cuisine"),  # From plaid_category_detailed
                time_bucket=tx.get("time_bucket") or "unknown",
                day_type=tx.get("day_type") or "unknown",
                payment_channel="unknown",
                pending=False,
            )

            analysis = engine.ingest(processed, analysis)

        # Convert to dict for DB storage
        analysis_dict = analysis.to_dict()

        # Upsert to user_analysis table
        self._supabase.table("user_analysis").upsert(
            {
                "user_id": user_id,
                "categories": analysis_dict["categories"],
                "time_buckets": analysis_dict["time_buckets"],
                "day_types": analysis_dict["day_types"],
                "merchant_visits": analysis_dict["merchant_visits"],
                "top_merchants": analysis_dict["top_merchants"],
                "cuisines": analysis_dict["cuisines"],
                "top_cuisines": analysis_dict["top_cuisines"],
                "streaks": analysis_dict["streaks"],
                "exploration": analysis_dict["exploration"],
                "total_transactions": analysis_dict["total_transactions"],
                "first_transaction_at": analysis_dict["first_transaction_at"],
                "last_transaction_at": analysis_dict["last_transaction_at"],
                "last_updated_at": datetime.utcnow().isoformat(),
                "version": analysis_dict["version"] + 1,
            },
            on_conflict="user_id",
        ).execute()

        return analysis_dict
