"""PlaidService - Business logic for Plaid account linking and transaction sync."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from supabase import Client

from app.mappings.plaid_categories import get_taste_category, get_cuisine
from app.services.plaid_client import sync_transactions
from app.services.google_places_service import GooglePlacesService
from app.intelligence.aggregation_engine import AggregationEngine, UserAnalysis
from app.intelligence.venue_tagger import VenueTagger
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
        self._places_service = GooglePlacesService(supabase)
        self._venue_tagger: VenueTagger | None = None

    def _get_venue_tagger(self) -> VenueTagger:
        """Lazy-load VenueTagger (expensive due to Anthropic client)."""
        if self._venue_tagger is None:
            self._venue_tagger = VenueTagger()
        return self._venue_tagger

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
            # Also remove associated place_visits
            self._supabase.table("place_visits").delete().in_(
                "transaction_id",
                self._supabase.table("transactions")
                .select("id")
                .in_("plaid_transaction_id", removed_ids)
                .execute()
                .data or []
            ).execute()

        # Update cursor and last_synced_at in database
        self._supabase.table("linked_accounts").update(
            {
                "sync_cursor": sync_result["next_cursor"],
                "last_synced_at": datetime.utcnow().isoformat(),
            }
        ).eq("id", account_id).execute()

        # Create place_visits from food/drink transactions
        if added or modified:
            print(f"[PlaidService] Creating place visits for user {user_id}")
            self._create_place_visits(user_id)

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
            location_lat = loc.lat if loc else None
            location_lng = loc.lon if loc else None

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
                "location_lat": location_lat,
                "location_lng": location_lng,
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

    def _create_place_visits(self, user_id: str) -> int:
        """Create place_visits entries from food/drink transactions.

        Only creates visits for transactions in relevant taste categories
        (coffee, dining, fast_food, nightlife, other_food).
        Uses upsert to avoid duplicates.

        Args:
            user_id: The user's ID

        Returns:
            Number of place visits created/updated
        """
        # Categories that should create place visits
        visit_categories = {"coffee", "dining", "fast_food", "nightlife", "other_food"}

        # Fetch food/drink transactions that don't have place_visits yet
        result = (
            self._supabase.table("transactions")
            .select("id, user_id, merchant_name, amount, date, datetime, taste_category")
            .eq("user_id", user_id)
            .in_("taste_category", list(visit_categories))
            .execute()
        )
        transactions = result.data or []
        print(f"[PlaidService] Found {len(transactions)} food/drink transactions for user {user_id}")

        if not transactions:
            return 0

        # Get existing place_visits for this user to check for duplicates
        existing_result = (
            self._supabase.table("place_visits")
            .select("transaction_id")
            .eq("user_id", user_id)
            .execute()
        )
        existing_tx_ids = {pv["transaction_id"] for pv in (existing_result.data or [])}

        # Create place_visit records for new transactions
        records = []
        for tx in transactions:
            tx_id = tx["id"]

            # Skip if already has a place_visit
            if tx_id in existing_tx_ids:
                continue

            # Determine visited_at timestamp
            visited_at = tx.get("datetime") or tx.get("date")
            if not visited_at:
                continue

            records.append({
                "user_id": user_id,
                "transaction_id": tx_id,
                "merchant_name": tx.get("merchant_name") or "Unknown",
                "amount": abs(float(tx.get("amount") or 0)),
                "visited_at": visited_at,
                "source": "transaction",
            })

        if not records:
            return 0

        # Insert new place_visits
        self._supabase.table("place_visits").insert(records).execute()

        print(f"[PlaidService] Created {len(records)} place visits for user {user_id}")

        # Match venues for new place visits (in background-friendly way)
        self._match_venues_for_user(user_id)

        return len(records)

    def _match_venues_for_user(self, user_id: str) -> int:
        """Match venues for place_visits that don't have venue_id set.

        Uses Google Places API to find matching venues from merchant names.
        Creates venues if they don't exist and links them to place_visits.

        Args:
            user_id: The user's ID

        Returns:
            Number of venues matched
        """
        # Get place_visits without venue_id, joined with transaction location data
        result = (
            self._supabase.table("place_visits")
            .select("id, merchant_name, transaction_id")
            .eq("user_id", user_id)
            .is_("venue_id", "null")
            .execute()
        )
        visits = result.data or []

        if not visits:
            return 0

        # Get transaction location data for these visits
        tx_ids = [v["transaction_id"] for v in visits if v.get("transaction_id")]
        if tx_ids:
            tx_result = (
                self._supabase.table("transactions")
                .select("id, location_lat, location_lng, location_city")
                .in_("id", tx_ids)
                .execute()
            )
            tx_locations = {tx["id"]: tx for tx in (tx_result.data or [])}
        else:
            tx_locations = {}

        matched_count = 0

        for visit in visits:
            merchant_name = visit.get("merchant_name")
            if not merchant_name:
                continue

            # Get location from transaction
            tx_id = visit.get("transaction_id")
            tx_loc = tx_locations.get(tx_id, {}) if tx_id else {}
            lat = float(tx_loc["location_lat"]) if tx_loc.get("location_lat") else None
            lng = float(tx_loc["location_lng"]) if tx_loc.get("location_lng") else None
            city = tx_loc.get("location_city") or "Unknown"

            # Try to match venue
            venue_id = self._match_or_create_venue(merchant_name, lat, lng, city)

            if venue_id:
                # Update place_visit with venue_id
                self._supabase.table("place_visits").update(
                    {"venue_id": venue_id}
                ).eq("id", visit["id"]).execute()
                matched_count += 1

        if matched_count > 0:
            print(f"[PlaidService] Matched {matched_count} venues for user {user_id}")

        return matched_count

    def _match_or_create_venue(
        self,
        merchant_name: str,
        lat: float | None,
        lng: float | None,
        city: str,
    ) -> str | None:
        """Match merchant to Google Place and create venue if needed.

        Args:
            merchant_name: Merchant name from Plaid
            lat: Transaction latitude
            lng: Transaction longitude
            city: City name for venue record

        Returns:
            Venue UUID if matched/created, None otherwise
        """
        # Find place using Google Places API (uses cache)
        match = self._places_service.find_place(merchant_name, lat, lng)
        if not match:
            return None

        # Check if venue already exists
        existing = self._places_service.get_venue_by_place_id(match.place_id)
        if existing:
            return existing["id"]

        # Get full place details
        details = self._places_service.get_place_details(match.place_id)
        if not details:
            return None

        # Run AI tagging
        venue_data = self._build_venue_tagger_input(details)
        try:
            profile = self._get_venue_tagger().tag(venue_data)
        except Exception as e:
            print(f"[PlaidService] VenueTagger failed for {merchant_name}: {e}")
            profile = None

        # Create venue with combined data
        venue = self._places_service.create_or_update_venue(
            details,
            city=city,
            source="transaction",
        )

        # Update with AI tags if available
        if profile and venue.get("id"):
            self._supabase.table("venues").update({
                "taste_cluster": profile.taste_cluster,
                "cuisine_type": profile.cuisine_type,
                "energy": profile.energy,
                "tagline": profile.tagline,
                "best_for": profile.best_for,
                "standout": profile.standout,
            }).eq("id", venue["id"]).execute()

        return venue.get("id")

    def _build_venue_tagger_input(self, details) -> dict:
        """Build input dict for VenueTagger from PlaceDetails.

        Args:
            details: PlaceDetails from Google Places API

        Returns:
            Dict formatted for VenueTagger.tag()
        """
        # Map price_level to price string
        price_map = {0: "Free", 1: "$", 2: "$$", 3: "$$$", 4: "$$$$"}
        price = price_map.get(details.price_level) if details.price_level else None

        return {
            "name": details.name,
            "category": details.primary_type or "restaurant",
            "categories": details.types[:5] if details.types else [],
            "rating": details.rating,
            "price": price,
            "reviews": details.reviews,
        }
