"""Taste profile API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_supabase_client
from app.intelligence import DeclaredTaste, ProfileTitleMapper
from app.intelligence.taste_fusion import TasteFusion
from app.intelligence.aggregation_engine import UserAnalysis, CategoryStats
from decimal import Decimal

router = APIRouter(prefix="/api/taste", tags=["taste"])


class TasteTraitResponse(BaseModel):
    """Response model for a single taste trait."""

    name: str
    emoji: str
    description: str
    score: int
    color: str


class CategoryBreakdown(BaseModel):
    """Response model for a category in observed taste."""

    count: int
    total_spend: float
    merchants: list[str]


class TopMerchant(BaseModel):
    """Response model for a top merchant."""

    merchant_id: str
    merchant_name: str
    count: int


class ObservedTasteResponse(BaseModel):
    """Response model for observed (transaction-based) taste."""

    categories: dict[str, CategoryBreakdown]
    time_buckets: dict[str, int]
    day_types: dict[str, int]
    top_merchants: list[TopMerchant]
    total_transactions: int
    first_transaction_at: str | None
    last_transaction_at: str | None
    confidence: float  # 0-1 based on transaction count


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


def calculate_confidence(total_transactions: int) -> float:
    """Calculate confidence score based on transaction count.

    - 0 transactions: 0.0
    - 10 transactions: 0.3
    - 50 transactions: 0.7
    - 100+ transactions: 1.0
    """
    if total_transactions == 0:
        return 0.0
    if total_transactions >= 100:
        return 1.0
    # Linear interpolation from 0.1 to 1.0 over 0-100 transactions
    return min(1.0, 0.1 + (total_transactions / 100) * 0.9)


@router.get("/observed/{user_id}", response_model=ObservedTasteResponse)
async def get_observed_taste(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> ObservedTasteResponse:
    """Get observed (transaction-based) taste data for a user.

    Returns category breakdown, time patterns, top merchants, etc.
    Based on aggregated transaction data from linked bank accounts.
    """
    print(f"[Taste] Fetching observed taste for user: {user_id}")

    try:
        result = (
            supabase.table("user_analysis")
            .select("*")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        print(f"[Taste] Observed query result: {result.data}")
    except Exception as e:
        print(f"[Taste] DB error for observed {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Error fetching observed taste")

    if not result.data:
        print(f"[Taste] No observed data for {user_id}, returning empty")
        # Return empty data structure for users without transactions
        return ObservedTasteResponse(
            categories={},
            time_buckets={},
            day_types={},
            top_merchants=[],
            total_transactions=0,
            first_transaction_at=None,
            last_transaction_at=None,
            confidence=0.0,
        )

    data = result.data
    total_txns = data.get("total_transactions", 0)

    # Parse categories from JSONB
    categories = {}
    for cat_name, cat_data in data.get("categories", {}).items():
        categories[cat_name] = CategoryBreakdown(
            count=cat_data.get("count", 0),
            total_spend=cat_data.get("total_spend", 0.0),
            merchants=cat_data.get("merchants", []),
        )

    # Parse top merchants
    top_merchants = [
        TopMerchant(
            merchant_id=m.get("merchant_id", ""),
            merchant_name=m.get("merchant_name", ""),
            count=m.get("count", 0),
        )
        for m in data.get("top_merchants", [])
    ]

    return ObservedTasteResponse(
        categories=categories,
        time_buckets=data.get("time_buckets", {}),
        day_types=data.get("day_types", {}),
        top_merchants=top_merchants,
        total_transactions=total_txns,
        first_transaction_at=data.get("first_transaction_at"),
        last_transaction_at=data.get("last_transaction_at"),
        confidence=calculate_confidence(total_txns),
    )


class FusedCategoryResponse(BaseModel):
    """Response model for a fused category score."""

    name: str
    percentage: int
    color: str
    count: int
    total_spend: float


class FusedTasteResponse(BaseModel):
    """Response model for fused taste profile."""

    user_id: str
    profile_title: str
    profile_tagline: str
    categories: list[FusedCategoryResponse]
    vibes: list[str]
    exploration_ratio: float
    confidence: float
    quiz_weight: float
    tx_weight: float


@router.get("/fused/{user_id}", response_model=FusedTasteResponse)
async def get_fused_taste(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
    profile_mapper: ProfileTitleMapper = Depends(get_profile_mapper),
) -> FusedTasteResponse:
    """Get fused taste profile combining quiz + transaction data.

    Merges declared taste (from quiz) with observed taste (from transactions)
    using a weighted algorithm based on transaction volume.
    """
    print(f"[Taste] Fetching fused taste for user: {user_id}")

    # Fetch declared_taste
    declared_result = (
        supabase.table("declared_taste")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    # Fetch user_analysis (observed)
    observed_result = (
        supabase.table("user_analysis")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    # Build DeclaredTaste
    declared_data = declared_result.data or {}
    declared_taste = DeclaredTaste(
        vibe_preferences=declared_data.get("vibe_preferences") or [],
        cuisine_preferences=declared_data.get("cuisine_preferences") or [],
        exploration_style=declared_data.get("exploration_style"),
        social_preference=declared_data.get("social_preference"),
        price_tier=declared_data.get("price_tier"),
    )

    # Build UserAnalysis from DB data
    observed_data = observed_result.data or {}
    user_analysis = UserAnalysis(user_id=user_id)
    user_analysis.total_transactions = observed_data.get("total_transactions", 0)

    # Parse categories from JSONB
    for cat_name, cat_data in observed_data.get("categories", {}).items():
        user_analysis.categories[cat_name] = CategoryStats(
            count=cat_data.get("count", 0),
            total_spend=Decimal(str(cat_data.get("total_spend", 0))),
            merchants=set(cat_data.get("merchants", [])),
        )

    # Parse merchant visits
    user_analysis.merchant_visits = observed_data.get("merchant_visits", {})

    # Run fusion algorithm
    fusion = TasteFusion()
    fused = fusion.fuse(declared_taste, user_analysis)

    # Get profile title based on declared taste
    title, tagline = profile_mapper.get_title(declared_taste)

    # Store fused result in database
    fused_dict = fused.to_dict()
    supabase.table("fused_taste").upsert(
        {
            "user_id": user_id,
            "categories": fused_dict["categories"],
            "vibes": fused_dict["vibes"],
            "exploration_ratio": fused_dict["exploration_ratio"],
            "confidence": fused_dict["confidence"],
            "mismatches": fused_dict["mismatches"],
        },
        on_conflict="user_id",
    ).execute()

    return FusedTasteResponse(
        user_id=user_id,
        profile_title=title,
        profile_tagline=tagline,
        categories=[
            FusedCategoryResponse(
                name=c.name,
                percentage=c.percentage,
                color=c.color,
                count=c.count,
                total_spend=c.total_spend,
            )
            for c in fused.categories
        ],
        vibes=fused.vibes,
        exploration_ratio=fused.exploration_ratio,
        confidence=fused.confidence,
        quiz_weight=fused.quiz_weight,
        tx_weight=fused.tx_weight,
    )
