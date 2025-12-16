"""Taste profile API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_supabase_client
from app.intelligence import DeclaredTaste, ProfileTitleMapper

router = APIRouter(prefix="/api/taste", tags=["taste"])


class TasteTraitResponse(BaseModel):
    """Response model for a single taste trait."""

    name: str
    emoji: str
    description: str
    score: int
    color: str


class TasteProfileResponse(BaseModel):
    """Response model for taste profile."""

    title: str
    tagline: str
    traits: list[TasteTraitResponse]
    exploration_style: str | None
    vibe_preferences: list[str]
    cuisine_preferences: list[str]
    price_tier: str | None


def get_profile_mapper() -> ProfileTitleMapper:
    """Dependency for ProfileTitleMapper."""
    return ProfileTitleMapper()


@router.get("/profile/{user_id}", response_model=TasteProfileResponse)
async def get_taste_profile(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
    profile_mapper: ProfileTitleMapper = Depends(get_profile_mapper),
) -> TasteProfileResponse:
    """Get taste profile for a user.

    Returns profile title, tagline, traits, and preferences.
    """
    print(f"[Taste] Fetching profile for user: {user_id}")

    # Fetch declared_taste from database
    try:
        result = (
            supabase.table("declared_taste")
            .select("*")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        print(f"[Taste] Query result: {result.data}")
    except Exception as e:
        print(f"[Taste] DB error for {user_id}: {e}")
        raise HTTPException(status_code=404, detail="Taste profile not found")

    if not result.data:
        print(f"[Taste] No profile found for {user_id}")
        raise HTTPException(status_code=404, detail="Taste profile not found")

    data = result.data

    try:
        # Convert DB data to DeclaredTaste
        declared_taste = DeclaredTaste(
            vibe_preferences=data.get("vibe_preferences") or [],
            cuisine_preferences=data.get("cuisine_preferences") or [],
            exploration_style=data.get("exploration_style"),
            social_preference=data.get("social_preference"),
            price_tier=data.get("price_tier"),
        )
        print(f"[Taste] DeclaredTaste created: {declared_taste}")

        # Get profile title and traits
        title, tagline = profile_mapper.get_title(declared_taste)
        traits = profile_mapper.calculate_traits(declared_taste)
        print(f"[Taste] Title: {title}, Traits: {len(traits)}")

        return TasteProfileResponse(
            title=title,
            tagline=tagline,
            traits=[
                TasteTraitResponse(
                    name=t.name,
                    emoji=t.emoji,
                    description=t.description,
                    score=t.score,
                    color=t.color,
                )
                for t in traits
            ],
            exploration_style=declared_taste.exploration_style,
            vibe_preferences=declared_taste.vibe_preferences,
            cuisine_preferences=declared_taste.cuisine_preferences,
            price_tier=declared_taste.price_tier,
        )
    except Exception as e:
        print(f"[Taste] Processing error for {user_id}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing profile: {e}")
