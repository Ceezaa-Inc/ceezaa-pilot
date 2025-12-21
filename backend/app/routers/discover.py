"""Discover feed API endpoints.

Provides personalized venue recommendations based on user taste profile
and optional mood filtering.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_supabase_client
from app.intelligence.matching_engine import MatchingEngine
from app.mappings.mood_mappings import get_available_moods

router = APIRouter(prefix="/api/discover", tags=["discover"])


class VenueResponse(BaseModel):
    """Response model for a venue in the feed."""

    id: str
    name: str
    cuisine_type: str | None
    tagline: str | None
    price_tier: str | None
    energy: str | None
    taste_cluster: str | None
    best_for: list[str]
    standout: list[str]
    match_score: int
    match_reasons: list[str]
    google_rating: float | None
    formatted_address: str | None
    photo_url: str | None
    lat: float | None
    lng: float | None


class DiscoverFeedResponse(BaseModel):
    """Response model for discover feed."""

    venues: list[VenueResponse]
    total: int
    has_more: bool
    mood: str | None


class MoodOption(BaseModel):
    """Response model for a mood option."""

    id: str
    label: str
    emoji: str


class MoodsResponse(BaseModel):
    """Response model for available moods."""

    moods: list[MoodOption]


def get_matching_engine() -> MatchingEngine:
    """Dependency for MatchingEngine."""
    return MatchingEngine()


@router.get("/moods", response_model=MoodsResponse)
async def get_moods() -> MoodsResponse:
    """Get available moods for the MoodGrid.

    Returns list of moods with id, label, and emoji.
    """
    moods = get_available_moods()
    return MoodsResponse(
        moods=[MoodOption(**m) for m in moods]
    )


@router.get("/feed/{user_id}", response_model=DiscoverFeedResponse)
async def get_discover_feed(
    user_id: str,
    mood: str | None = Query(None, description="Mood filter"),
    category: str | None = Query(None, description="Category filter"),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    supabase: Client = Depends(get_supabase_client),
    engine: MatchingEngine = Depends(get_matching_engine),
) -> DiscoverFeedResponse:
    """Get personalized venue feed for a user.

    Scores venues based on user taste profile and optionally filters by mood.

    Args:
        user_id: The user's ID.
        mood: Optional mood filter (chill, energetic, romantic, etc.).
        category: Optional category filter (coffee, dining, nightlife, bakery).
        limit: Number of venues to return (default 20, max 50).
        offset: Pagination offset.

    Returns:
        Paginated list of venues with match scores and reasons.
    """
    print(f"[Discover] Feed request for user: {user_id}, mood: {mood}")

    # 1. Get user taste profile
    user_taste = await _get_user_taste(user_id, supabase)

    if not user_taste:
        print(f"[Discover] No taste profile found for {user_id}")
        # Return empty feed for users without taste profile
        return DiscoverFeedResponse(
            venues=[],
            total=0,
            has_more=False,
            mood=mood,
        )

    # 2. Fetch venues from database
    venues_query = supabase.table("venues").select("*").eq("is_active", True)

    # Apply category filter if provided
    if category:
        venues_query = venues_query.eq("taste_cluster", category)

    venues_result = venues_query.execute()
    venues_data = venues_result.data or []

    print(f"[Discover] Found {len(venues_data)} venues")

    if not venues_data:
        return DiscoverFeedResponse(
            venues=[],
            total=0,
            has_more=False,
            mood=mood,
        )

    # 3. Convert to venue dicts for matching
    venues = [_db_to_venue_dict(v) for v in venues_data]

    # 4. Score and optionally filter by mood
    is_new_user = not user_taste.get("categories")

    if mood:
        # Apply mood filter (includes scoring)
        scored = engine.apply_mood_filter(venues, mood, user_taste)
    else:
        # Just score without mood boost
        scored = []
        for venue in venues:
            if is_new_user:
                result = engine.score_new_user(user_taste, venue)
            else:
                result = engine.score(user_taste, venue)

            reasons = engine.get_match_reasons(result.scores, venue)
            scored.append({
                "venue": venue,
                "match_score": result.match_score,
                "scores": result.scores,
                "reasons": reasons,
            })

        # Sort by score descending
        scored.sort(key=lambda x: x["match_score"], reverse=True)

    # 5. Add match reasons for mood-filtered results
    if mood:
        for item in scored:
            if "reasons" not in item:
                item["reasons"] = engine.get_match_reasons(
                    item["scores"], item["venue"]
                )

    # 6. Paginate
    total = len(scored)
    paginated = scored[offset : offset + limit]
    has_more = offset + limit < total

    # 7. Build response
    response_venues = []
    for item in paginated:
        venue = item["venue"]
        photo_url = None
        if venue.get("photo_references"):
            photo_url = venue["photo_references"][0]

        response_venues.append(
            VenueResponse(
                id=venue["id"],
                name=venue["name"],
                cuisine_type=venue.get("cuisine_type"),
                tagline=venue.get("tagline"),
                price_tier=venue.get("price_tier"),
                energy=venue.get("energy"),
                taste_cluster=venue.get("taste_cluster"),
                best_for=venue.get("best_for", []),
                standout=venue.get("standout", []),
                match_score=item["match_score"],
                match_reasons=item.get("reasons", []),
                google_rating=venue.get("google_rating"),
                formatted_address=venue.get("formatted_address"),
                photo_url=photo_url,
                lat=venue.get("lat"),
                lng=venue.get("lng"),
            )
        )

    print(f"[Discover] Returning {len(response_venues)} venues (page {offset // limit + 1})")

    return DiscoverFeedResponse(
        venues=response_venues,
        total=total,
        has_more=has_more,
        mood=mood,
    )


async def _get_user_taste(user_id: str, supabase: Client) -> dict | None:
    """Get user taste profile for matching.

    Tries fused_taste first, falls back to declared_taste for new users.

    Returns:
        Dict with categories, top_cuisines, vibes, price_tier, exploration_style,
        social_preference, coffee_preference, tx_weight.
        None if no taste data found.
    """
    # Try fused_taste first (has transaction data)
    fused_result = (
        supabase.table("fused_taste")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    declared_result = (
        supabase.table("declared_taste")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    declared = declared_result.data

    if not declared:
        return None

    # Build user taste dict with all fields needed for matching
    user_taste = {
        "vibes": declared.get("vibe_preferences", []),
        "price_tier": declared.get("price_tier"),
        "exploration_style": declared.get("exploration_style"),
        "cuisine_preferences": declared.get("cuisine_preferences", []),
        # Additional fields for improved matching
        "social_preference": declared.get("social_preference"),
        "coffee_preference": declared.get("coffee_preference"),
    }

    fused = fused_result.data
    if fused:
        # Parse categories from fused taste (list of dicts with name, percentage)
        categories_list = fused.get("categories", [])
        categories = {}
        for cat in categories_list:
            if isinstance(cat, dict):
                name = cat.get("name", "").lower().replace(" ", "_")
                categories[name] = cat.get("percentage", 0)
        user_taste["categories"] = categories
        user_taste["top_cuisines"] = fused.get("top_cuisines", [])
        # Pass tx_weight for cuisine blending
        user_taste["tx_weight"] = fused.get("tx_weight", 0.7)
    else:
        # New user - no fused data
        user_taste["categories"] = {}
        user_taste["top_cuisines"] = []
        user_taste["tx_weight"] = 0.0  # Quiz-only

    return user_taste


def _db_to_venue_dict(db_record: dict) -> dict:
    """Convert database record to venue dict for matching.

    Args:
        db_record: Raw database record.

    Returns:
        Venue dict with standardized fields.
    """
    return {
        "id": db_record["id"],
        "name": db_record["name"],
        "taste_cluster": db_record.get("taste_cluster"),
        "cuisine_type": db_record.get("cuisine_type"),
        "energy": db_record.get("energy"),
        "price_tier": db_record.get("price_tier"),
        "best_for": db_record.get("best_for") or [],
        "standout": db_record.get("standout") or [],
        "tagline": db_record.get("tagline"),
        "google_rating": db_record.get("google_rating"),
        "formatted_address": db_record.get("formatted_address"),
        "photo_references": db_record.get("photo_references") or [],
        "lat": db_record.get("lat"),
        "lng": db_record.get("lng"),
    }


@router.get("/venue/{venue_id}")
async def get_venue_detail(
    venue_id: str,
    user_id: str = Query(..., description="User ID for personalized scoring"),
    supabase: Client = Depends(get_supabase_client),
    engine: MatchingEngine = Depends(get_matching_engine),
) -> VenueResponse:
    """Get detailed venue info with personalized match score.

    Args:
        venue_id: The venue's ID.
        user_id: The user's ID for personalized scoring.

    Returns:
        Venue details with match score and reasons.
    """
    print(f"[Discover] Venue detail request: {venue_id} for user: {user_id}")

    # Fetch venue
    venue_result = (
        supabase.table("venues")
        .select("*")
        .eq("id", venue_id)
        .maybe_single()
        .execute()
    )

    if not venue_result.data:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Venue not found")

    venue = _db_to_venue_dict(venue_result.data)

    # Get user taste
    user_taste = await _get_user_taste(user_id, supabase)

    # Score venue
    if user_taste:
        is_new_user = not user_taste.get("categories")
        if is_new_user:
            result = engine.score_new_user(user_taste, venue)
        else:
            result = engine.score(user_taste, venue)
        match_score = result.match_score
        match_reasons = engine.get_match_reasons(result.scores, venue)
    else:
        match_score = 50  # Default score for users without taste profile
        match_reasons = []

    photo_url = None
    if venue.get("photo_references"):
        photo_url = venue["photo_references"][0]

    return VenueResponse(
        id=venue["id"],
        name=venue["name"],
        cuisine_type=venue.get("cuisine_type"),
        tagline=venue.get("tagline"),
        price_tier=venue.get("price_tier"),
        energy=venue.get("energy"),
        taste_cluster=venue.get("taste_cluster"),
        best_for=venue.get("best_for", []),
        standout=venue.get("standout", []),
        match_score=match_score,
        match_reasons=match_reasons,
        google_rating=venue.get("google_rating"),
        formatted_address=venue.get("formatted_address"),
        photo_url=photo_url,
        lat=venue.get("lat"),
        lng=venue.get("lng"),
    )
