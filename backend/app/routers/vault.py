"""Vault API endpoints.

Manages user visit history - both auto-detected from transactions
and manually added visits.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_supabase_client
from app.services.plaid_service import PlaidService

router = APIRouter(prefix="/api/vault", tags=["vault"])


def _build_photo_url(base_url: str, venue: dict | None) -> str | None:
    """Build photo URL using the photo proxy endpoint.

    Args:
        base_url: API base URL (e.g., https://ceezaa-pilot.onrender.com)
        venue: Venue dict with photo_references and google_place_id

    Returns:
        Photo proxy URL or None if no photos available.
    """
    if not venue:
        return None
    refs = venue.get("photo_references", [])
    place_id = venue.get("google_place_id")
    if refs and place_id:
        return f"{base_url}/api/discover/photo/{place_id}/0"
    return None


# --- Request/Response Models ---


class VisitResponse(BaseModel):
    """A single visit record."""

    id: str
    venue_id: str | None
    venue_name: str | None
    venue_type: str | None
    visited_at: str
    amount: float | None
    reaction: str | None
    notes: str | None
    source: str


class PlaceResponse(BaseModel):
    """Aggregated place with visit history."""

    venue_id: str | None
    venue_name: str
    venue_type: str | None
    visit_count: int
    last_visit: str
    total_spent: float
    reaction: str | None
    photo_url: str | None
    google_place_id: str | None  # For photo proxy
    visits: list[VisitResponse]


class VaultStatsResponse(BaseModel):
    """Vault statistics."""

    total_places: int
    total_visits: int
    this_month_spent: float


class VaultResponse(BaseModel):
    """Full vault response with places and stats."""

    places: list[PlaceResponse]
    stats: VaultStatsResponse


class CreateVisitRequest(BaseModel):
    """Request to create a manual visit."""

    venue_id: str | None = None
    merchant_name: str
    visited_at: str  # ISO date string
    amount: float | None = None
    reaction: str | None = None
    notes: str | None = None


class UpdateVisitRequest(BaseModel):
    """Request to update a visit."""

    reaction: str | None = None
    notes: str | None = None
    mood_tags: list[str] | None = None


# --- Endpoints ---


@router.get("/visits/{user_id}", response_model=VaultResponse)
async def get_visits(
    request: Request,
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> VaultResponse:
    """Get all visits for a user, aggregated by place.

    Auto-syncs transactions to place_visits and matches venues before returning.
    Returns places with visit history, plus overall stats.
    """
    # Auto-sync: Create place_visits from transactions and match venues
    plaid_service = PlaidService(supabase)
    plaid_service._create_place_visits(user_id)
    plaid_service._match_venues_for_user(user_id)

    # Get base URL for photo proxy
    base_url = str(request.base_url).rstrip("/")

    # Fetch visits with venue info via join
    result = (
        supabase.table("place_visits")
        .select("*, venues(id, name, taste_cluster, photo_references, google_place_id)")
        .eq("user_id", user_id)
        .order("visited_at", desc=True)
        .execute()
    )

    visits_data = result.data or []

    # Aggregate by venue/merchant
    places_map: dict[str, dict] = {}
    total_spent = 0.0
    this_month_spent = 0.0
    now = datetime.now()

    for visit in visits_data:
        # Determine the place key (venue_id or merchant_name)
        venue = visit.get("venues")
        venue_id = visit.get("venue_id")
        merchant_name = visit.get("merchant_name", "Unknown")

        place_key = venue_id or merchant_name
        venue_name = venue["name"] if venue else merchant_name
        venue_type = venue["taste_cluster"] if venue else None
        google_place_id = venue.get("google_place_id") if venue else None
        photo_url = _build_photo_url(base_url, venue)

        # Create or update place entry
        if place_key not in places_map:
            places_map[place_key] = {
                "venue_id": venue_id,
                "venue_name": venue_name,
                "venue_type": venue_type,
                "visit_count": 0,
                "last_visit": visit["visited_at"],
                "total_spent": 0.0,
                "reaction": None,
                "photo_url": photo_url,
                "google_place_id": google_place_id,
                "visits": [],
            }

        place = places_map[place_key]
        place["visit_count"] += 1

        amount = float(visit.get("amount") or 0)
        place["total_spent"] += amount
        total_spent += amount

        # Check if this month
        visit_date = datetime.fromisoformat(visit["visited_at"].replace("Z", "+00:00"))
        if visit_date.year == now.year and visit_date.month == now.month:
            this_month_spent += amount

        # Update reaction to most recent non-null
        if visit.get("reaction") and not place["reaction"]:
            place["reaction"] = visit["reaction"]

        # Add visit to list
        place["visits"].append(
            VisitResponse(
                id=visit["id"],
                venue_id=venue_id,
                venue_name=venue_name,
                venue_type=venue_type,
                visited_at=visit["visited_at"],
                amount=amount if amount > 0 else None,
                reaction=visit.get("reaction"),
                notes=visit.get("notes"),
                source=visit.get("source", "transaction"),
            )
        )

    # Convert to response
    places = [
        PlaceResponse(**place_data) for place_data in places_map.values()
    ]

    # Sort by last visit (most recent first)
    places.sort(key=lambda p: p.last_visit, reverse=True)

    return VaultResponse(
        places=places,
        stats=VaultStatsResponse(
            total_places=len(places),
            total_visits=len(visits_data),
            this_month_spent=this_month_spent,
        ),
    )


@router.post("/visits/{user_id}", response_model=VisitResponse)
async def create_visit(
    user_id: str,
    request: CreateVisitRequest,
    supabase: Client = Depends(get_supabase_client),
) -> VisitResponse:
    """Create a manual visit entry."""
    visit_data = {
        "user_id": user_id,
        "venue_id": request.venue_id,
        "merchant_name": request.merchant_name,
        "visited_at": request.visited_at,
        "amount": request.amount,
        "reaction": request.reaction,
        "notes": request.notes,
        "source": "manual",
    }

    result = supabase.table("place_visits").insert(visit_data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create visit")

    visit = result.data[0]

    # Fetch venue info if venue_id provided
    venue_name = request.merchant_name
    venue_type = None
    if request.venue_id:
        venue_result = (
            supabase.table("venues")
            .select("name, taste_cluster")
            .eq("id", request.venue_id)
            .maybe_single()
            .execute()
        )
        if venue_result.data:
            venue_name = venue_result.data["name"]
            venue_type = venue_result.data.get("taste_cluster")

    return VisitResponse(
        id=visit["id"],
        venue_id=request.venue_id,
        venue_name=venue_name,
        venue_type=venue_type,
        visited_at=visit["visited_at"],
        amount=request.amount,
        reaction=request.reaction,
        notes=request.notes,
        source="manual",
    )


@router.patch("/visits/{visit_id}", response_model=VisitResponse)
async def update_visit(
    visit_id: str,
    request: UpdateVisitRequest,
    supabase: Client = Depends(get_supabase_client),
) -> VisitResponse:
    """Update a visit (reaction, notes, mood_tags)."""
    update_data = {}
    if request.reaction is not None:
        update_data["reaction"] = request.reaction
    if request.notes is not None:
        update_data["notes"] = request.notes
    if request.mood_tags is not None:
        update_data["mood_tags"] = request.mood_tags

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_data["updated_at"] = datetime.now().isoformat()

    result = (
        supabase.table("place_visits")
        .update(update_data)
        .eq("id", visit_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Visit not found")

    visit = result.data[0]

    # Get venue info
    venue_name = visit.get("merchant_name", "Unknown")
    venue_type = None
    if visit.get("venue_id"):
        venue_result = (
            supabase.table("venues")
            .select("name, taste_cluster")
            .eq("id", visit["venue_id"])
            .maybe_single()
            .execute()
        )
        if venue_result.data:
            venue_name = venue_result.data["name"]
            venue_type = venue_result.data.get("taste_cluster")

    return VisitResponse(
        id=visit["id"],
        venue_id=visit.get("venue_id"),
        venue_name=venue_name,
        venue_type=venue_type,
        visited_at=visit["visited_at"],
        amount=float(visit["amount"]) if visit.get("amount") else None,
        reaction=visit.get("reaction"),
        notes=visit.get("notes"),
        source=visit.get("source", "transaction"),
    )


class SyncResponse(BaseModel):
    """Response for sync operation."""

    created: int
    message: str


@router.post("/sync/{user_id}", response_model=SyncResponse)
async def sync_visits_from_transactions(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> SyncResponse:
    """Sync place_visits from existing transactions.

    Creates place_visit entries for food/drink transactions that don't
    already have associated visits. This is useful for backfilling data
    or after initial transaction sync.
    """
    # Categories that should create place visits
    visit_categories = ["coffee", "dining", "fast_food", "nightlife", "other_food"]

    # Fetch food/drink transactions for this user
    tx_result = (
        supabase.table("transactions")
        .select("id, user_id, merchant_name, amount, date, datetime, taste_category")
        .eq("user_id", user_id)
        .in_("taste_category", visit_categories)
        .execute()
    )
    transactions = tx_result.data or []

    if not transactions:
        return SyncResponse(created=0, message="No food/drink transactions found")

    # Get existing place_visits to avoid duplicates
    existing_result = (
        supabase.table("place_visits")
        .select("transaction_id")
        .eq("user_id", user_id)
        .execute()
    )
    existing_tx_ids = {pv["transaction_id"] for pv in (existing_result.data or []) if pv["transaction_id"]}

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
        return SyncResponse(created=0, message="All transactions already have visits")

    # Insert new place_visits
    supabase.table("place_visits").insert(records).execute()

    return SyncResponse(
        created=len(records),
        message=f"Created {len(records)} place visits from transactions",
    )
