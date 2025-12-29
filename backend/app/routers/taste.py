"""Taste profile API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_supabase_client
from app.intelligence import DeclaredTaste, ProfileTitleMapper
from app.intelligence.taste_fusion import TasteFusion
from app.intelligence.aggregation_engine import UserAnalysis, CategoryStats
from app.intelligence.ring_builder import RingBuilder
from app.intelligence.insight_generator import InsightGenerator, Insight
from app.intelligence.dna_generator import DNAGenerator, DNATrait
from app.mappings.plaid_categories import NON_RECOMMENDATION_CATEGORIES
from decimal import Decimal
from datetime import date, datetime

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

    # Parse categories from JSONB, filtering out non-recommendation categories
    categories = {}
    for cat_name, cat_data in data.get("categories", {}).items():
        # Skip categories that shouldn't be shown (groceries, other_food, other)
        if cat_name in NON_RECOMMENDATION_CATEGORIES:
            continue
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
    top_cuisines: list[str]  # From observed transactions (asian, sushi, thai, etc.)
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

    # Parse cuisine data
    user_analysis.cuisines = observed_data.get("cuisines", {})
    user_analysis.top_cuisines = observed_data.get("top_cuisines", [])

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
        top_cuisines=fused.top_cuisines,
        exploration_ratio=fused.exploration_ratio,
        confidence=fused.confidence,
        quiz_weight=fused.quiz_weight,
        tx_weight=fused.tx_weight,
    )


class RingSegmentResponse(BaseModel):
    """Response model for a ring segment."""

    category: str
    percentage: int
    color: str


class TasteRingResponse(BaseModel):
    """Response model for taste ring visualization."""

    segments: list[RingSegmentResponse]
    profile_title: str
    tagline: str


@router.get("/ring/{user_id}", response_model=TasteRingResponse)
async def get_taste_ring(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> TasteRingResponse:
    """Get taste ring visualization data.

    Returns ring segments with percentages and colors,
    optimized for the TasteRing UI component.

    Ring-specific logic:
    - Max 5 segments (rest combined into 'other')
    - Minimum 3% threshold (smaller segments excluded)
    - Category-specific colors
    """
    print(f"[Taste] Building ring for user: {user_id}")

    builder = RingBuilder(supabase)
    ring_data = builder.build_ring(user_id)

    return TasteRingResponse(
        segments=[
            RingSegmentResponse(
                category=s["category"],
                percentage=s["percentage"],
                color=s["color"],
            )
            for s in ring_data["segments"]
        ],
        profile_title=ring_data["profile_title"],
        tagline=ring_data["tagline"],
    )


class InsightResponse(BaseModel):
    """Response model for a single insight."""

    id: str
    type: str
    title: str
    body: str
    emoji: str
    created_at: datetime


class InsightsListResponse(BaseModel):
    """Response model for list of insights."""

    insights: list[InsightResponse]
    generated_at: datetime | None


@router.get("/insights/{user_id}", response_model=InsightsListResponse)
async def get_insights(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> InsightsListResponse:
    """Get personalized insights for a user.

    On-demand generation:
    1. Check if insights exist for today
    2. If yes → return from DB
    3. If no → generate via LLM, store, return
    """
    print(f"[Insights] Fetching insights for user: {user_id}")

    today = date.today()

    # Check for existing insights today
    existing = (
        supabase.table("daily_insights")
        .select("*")
        .eq("user_id", user_id)
        .eq("shown_at", str(today))
        .execute()
    )

    if existing.data and len(existing.data) > 0:
        print(f"[Insights] Found {len(existing.data)} cached insights")
        return InsightsListResponse(
            insights=[
                InsightResponse(
                    id=row["id"],
                    type=row["insight_type"],
                    title=row["title"],
                    body=row["body"],
                    emoji=row.get("emoji", "💡"),
                    created_at=row["created_at"],
                )
                for row in existing.data
            ],
            generated_at=existing.data[0]["created_at"] if existing.data else None,
        )

    # No insights for today - generate new ones
    print(f"[Insights] Generating new insights for user: {user_id}")

    # Fetch user_analysis for the generator
    analysis_result = (
        supabase.table("user_analysis")
        .select("*")
        .eq("user_id", user_id)
        .single()
        .execute()
    )

    if not analysis_result.data:
        print(f"[Insights] No user analysis found, returning empty")
        return InsightsListResponse(insights=[], generated_at=None)

    analysis = analysis_result.data

    # Build user data dict for generator
    user_data = {
        "total_transactions": analysis.get("total_transactions", 0),
        "categories": analysis.get("categories", {}),
        "streaks": analysis.get("streaks", {}),
        "exploration": analysis.get("exploration", {}),
        "time_buckets": analysis.get("time_buckets", {}),
        "top_merchants": analysis.get("top_merchants", []),
    }

    # Generate insights
    try:
        generator = InsightGenerator()
        insights = generator.generate(user_data)
        print(f"[Insights] Generated {len(insights)} insights")
    except Exception as e:
        print(f"[Insights] LLM generation failed: {e}")
        # Return empty insights on LLM failure (API key missing, rate limit, etc.)
        return InsightsListResponse(insights=[], generated_at=None)

    # Store in database
    now = datetime.now()
    stored_insights = []

    for insight in insights:
        result = (
            supabase.table("daily_insights")
            .insert({
                "user_id": user_id,
                "insight_type": insight.type,
                "title": insight.title,
                "body": insight.body,
                "emoji": insight.emoji,
                "source_data": user_data,
                "shown_at": str(today),
            })
            .execute()
        )

        if result.data:
            row = result.data[0]
            stored_insights.append(
                InsightResponse(
                    id=row["id"],
                    type=row["insight_type"],
                    title=row["title"],
                    body=row["body"],
                    emoji=row.get("emoji", "💡"),
                    created_at=row["created_at"],
                )
            )

    return InsightsListResponse(
        insights=stored_insights,
        generated_at=now,
    )


@router.delete("/insights/{user_id}/cache")
async def clear_insights_cache(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    """DEV ONLY: Clear cached insights for a user to force regeneration."""
    print(f"[Insights] Clearing cache for user: {user_id}")

    result = (
        supabase.table("daily_insights")
        .delete()
        .eq("user_id", user_id)
        .execute()
    )

    deleted_count = len(result.data) if result.data else 0
    print(f"[Insights] Deleted {deleted_count} cached insights")

    return {"deleted": deleted_count}


# ============== DNA Endpoints ==============


class DNATraitResponse(BaseModel):
    """Response model for a single DNA trait."""

    id: str
    name: str
    emoji: str
    description: str
    color: str
    created_at: datetime


class DNAListResponse(BaseModel):
    """Response model for list of DNA traits."""

    traits: list[DNATraitResponse]
    generated_at: datetime | None


@router.get("/dna/{user_id}", response_model=DNAListResponse)
async def get_dna(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> DNAListResponse:
    """Get personalized DNA traits for a user.

    On-demand generation:
    1. Check if DNA exists for today
    2. If yes → return from DB
    3. If no → generate via LLM, store, return
    """
    print(f"[DNA] Fetching DNA for user: {user_id}")

    today = date.today()

    # Check for existing DNA today
    existing = (
        supabase.table("daily_dna")
        .select("*")
        .eq("user_id", user_id)
        .eq("shown_at", str(today))
        .execute()
    )

    if existing.data and len(existing.data) >= 4:
        print(f"[DNA] Found {len(existing.data)} cached traits")
        return DNAListResponse(
            traits=[
                DNATraitResponse(
                    id=row["id"],
                    name=row["trait_name"],
                    emoji=row["emoji"],
                    description=row["description"],
                    color=row["color"],
                    created_at=row["created_at"],
                )
                for row in existing.data
            ],
            generated_at=existing.data[0]["created_at"] if existing.data else None,
        )

    # No DNA for today - generate new traits
    print(f"[DNA] Generating new DNA for user: {user_id}")

    # Fetch user_analysis (transaction data)
    analysis_result = (
        supabase.table("user_analysis")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    # Fetch declared_taste (quiz data)
    declared_result = (
        supabase.table("declared_taste")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not analysis_result.data and not declared_result.data:
        print(f"[DNA] No user data found, returning empty")
        return DNAListResponse(traits=[], generated_at=None)

    # Combine data for generator
    analysis = analysis_result.data or {}
    declared = declared_result.data or {}

    user_data = {
        # Transaction data
        "categories": analysis.get("categories", {}),
        "top_merchants": analysis.get("top_merchants", []),
        "time_buckets": analysis.get("time_buckets", {}),
        # Quiz data
        "exploration_style": declared.get("exploration_style"),
        "vibe_preferences": declared.get("vibe_preferences", []),
        "social_preference": declared.get("social_preference"),
        "price_tier": declared.get("price_tier"),
    }

    # Generate DNA traits
    try:
        generator = DNAGenerator()
        traits = generator.generate(user_data)
        print(f"[DNA] Generated {len(traits)} traits")
    except Exception as e:
        print(f"[DNA] LLM generation failed: {e}")
        return DNAListResponse(traits=[], generated_at=None)

    # Store in database
    now = datetime.now()
    stored_traits = []

    for trait in traits:
        result = (
            supabase.table("daily_dna")
            .insert({
                "user_id": user_id,
                "trait_name": trait.name,
                "emoji": trait.emoji,
                "description": trait.description,
                "color": trait.color,
                "shown_at": str(today),
            })
            .execute()
        )

        if result.data:
            row = result.data[0]
            stored_traits.append(
                DNATraitResponse(
                    id=row["id"],
                    name=row["trait_name"],
                    emoji=row["emoji"],
                    description=row["description"],
                    color=row["color"],
                    created_at=row["created_at"],
                )
            )

    return DNAListResponse(
        traits=stored_traits,
        generated_at=now,
    )


@router.delete("/dna/{user_id}/cache")
async def clear_dna_cache(
    user_id: str,
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    """DEV ONLY: Clear cached DNA for a user to force regeneration."""
    print(f"[DNA] Clearing cache for user: {user_id}")

    result = (
        supabase.table("daily_dna")
        .delete()
        .eq("user_id", user_id)
        .execute()
    )

    deleted_count = len(result.data) if result.data else 0
    print(f"[DNA] Deleted {deleted_count} cached traits")

    return {"deleted": deleted_count}
