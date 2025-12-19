# Ceezaa MVP - Technical Architecture

> **Timeline:** 10 weeks
> **Stack:** React Native (Expo) + Supabase + Python FastAPI + Apify + Anthropic Claude
> **Goal:** Transaction + Quiz data → Taste Intelligence → Personalized Discovery + Group Planning
> **Core Magic:** Declared preferences (quiz) + Observed behavior (transactions) = True taste profile
> **Intelligence Philosophy:** Rules First, AI Last - minimize LLM usage, maximize deterministic logic

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     REACT NATIVE (Expo)                          │
│                    iOS + Android Mobile App                      │
│              Push Notifications (expo-notifications)             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          SUPABASE                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Auth     │  │  PostgreSQL  │  │   Storage    │          │
│  │  (Phone OTP  │  │   Database   │  │   (Images)   │          │
│  │   + Social)  │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                     + Realtime (WebSockets for group sync)       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PYTHON FASTAPI                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              TASTE INTELLIGENCE LAYER (TIL)                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │    Quiz      │  │ Transaction  │  │    Taste     │     │ │
│  │  │  Processor   │→ │  Processor   │→ │   Fusion     │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  │                            │                               │ │
│  │                            ▼                               │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │ Aggregation  │→ │  Analysis    │→ │    Taste     │     │ │
│  │  │   Engine     │  │    Store     │  │  Interface   │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    CORE SERVICES                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │   Session    │  │    Venue     │  │  Matching    │     │ │
│  │  │   Manager    │  │   Catalog    │  │   Engine     │     │ │
│  │  │  (Groups)    │  │(Google+GPT)  │  │ (Rankings)   │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Plaid      │  │  Notification │  │    Vault     │          │
│  │   Service    │  │   Service     │  │   Service    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         EXTERNAL APIs                            │
│    Plaid API  •  Apify  •  Anthropic Claude  •  Expo Push       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Taste Intelligence Layer (TIL)

The TIL is the core backend. It combines DECLARED preferences (quiz) with OBSERVED behavior (transactions) to build a unified taste profile.

### Design Philosophy: Rules First, AI Last

| Component | AI? | Rationale |
|-----------|-----|-----------|
| Quiz → Declared Taste | **NO** | Deterministic mapping table |
| Transaction → Observed Taste | **NO** | Aggregation math |
| Taste Fusion | **NO** | Weighted algorithm |
| Profile Title | **NO** | Lookup table (~20 combinations) |
| **Taste DNA Generation** | **YES** | Personalized trait descriptions from data |
| **Insights Generation** | **YES** | Natural language is LLM strength |
| **Venue Tagging** | **YES** | One-time at import, cached forever |
| Venue Matching | **NO** | Score calculation algorithm |
| Feed Ranking | **NO** | Sort by score |

**AI is used in exactly 3 places:**
1. **Taste DNA** - 4 personalized DNA traits/user/day (cached daily)
2. **Daily Insights** - 2-3 insights/user/day (cached daily)
3. **Venue Tagging** - 1 LLM call/venue at import time (never again)

### Data Flow

```
┌─────────────────────────┐     ┌─────────────────────────┐
│   ONBOARDING QUIZ       │     │   PLAID TRANSACTIONS    │
│   (Initial Preferences) │     │   (Ongoing Behavior)    │
│                         │     │                         │
│  - Food preferences     │     │  - Where they spend     │
│  - Dietary restrictions │     │  - When (time patterns) │
│  - Activity interests   │     │  - How often (loyalty)  │
│  - Vibe preferences     │     │  - Variety (exploration)│
└───────────┬─────────────┘     └───────────┬─────────────┘
            │                               │
            ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│   Quiz Processor    │         │ Transaction Processor│
│                     │         │                     │
│  Parse answers →    │         │  Normalize data →   │
│  Extract categories │         │  Map to categories  │
│  Store declared     │         │  Extract signals    │
└─────────┬───────────┘         └─────────┬───────────┘
          │                               │
          └───────────────┬───────────────┘
                          │
                          ▼
            ┌─────────────────────────┐
            │    Aggregation Engine   │
            │                         │
            │  O(1) incremental ops:  │
            │  - Category breakdown   │
            │  - Time patterns        │
            │  - Merchant loyalty     │
            │  - Streaks              │
            │  - Exploration ratio    │
            └─────────────┬───────────┘
                          │
                          ▼
            ┌─────────────────────────┐
            │      Taste Fusion       │
            │                         │
            │  Combine:               │
            │  - Declared (quiz)      │
            │  - Observed (txns)      │
            │                         │
            │  Weight by data volume: │
            │  - New user: 80% quiz   │
            │  - 100+ txns: 80% txns  │
            │                         │
            │  Detect mismatches:     │
            │  - Says vegan, buys stk │
            │  - Says coffee, no txns │
            └─────────────┬───────────┘
                          │
                          ▼
            ┌─────────────────────────┐
            │     Analysis Store      │
            │                         │
            │  Single source of truth │
            │  Persisted to Supabase  │
            │  Never recomputes full  │
            └─────────────┬───────────┘
                          │
                          ▼
            ┌─────────────────────────┐
            │     Taste Interface     │
            │                         │
            │  get_full_profile()     │
            │    → Pulse Taste Ring   │
            │                         │
            │  get_discover_context() │
            │    → Venue matching     │
            │                         │
            │  get_vault_context()    │
            │    → Place insights     │
            │                         │
            │  get_daily_context()    │
            │    → Notifications      │
            └─────────────────────────┘
```

### Quiz Processor (Rule-Based)

```python
class QuizProcessor:
    """Process quiz answers into declared taste preferences using rule-based mapping."""

    # Question → Answer → Taste attributes (deterministic mapping)
    QUIZ_MAPPINGS = {
        "ideal_friday": {
            "cozy_dinner": {"vibes": ["chill", "intimate"], "social": "small_group"},
            "lively_bar": {"vibes": ["social", "energetic"], "social": "big_group"},
            "new_trendy": {"vibes": ["trendy", "adventurous"], "exploration": "adventurous"},
            "cooking_home": {"vibes": ["chill"], "social": "solo"},
        },
        # ... more mappings
    }

    def process(self, answers: List[QuizAnswer]) -> DeclaredTaste:
        return DeclaredTaste(
            vibe_preferences=self._extract_vibes(answers),      # chill, social, adventurous
            cuisine_preferences=self._extract_cuisines(answers), # japanese, mexican, etc.
            dietary_restrictions=self._extract_dietary(answers), # vegan, gluten-free
            exploration_style=self._extract_exploration(answers), # adventurous vs routine
            social_preference=self._extract_social(answers),     # solo, small_group, big_group
            coffee_preference=self._extract_coffee(answers),     # third-wave, any, none
            price_tier=self._extract_price_tier(answers),        # budget, moderate, premium, luxury
        )
```

### Profile Title Mapper (Rule-Based)

Instead of AI, use a deterministic lookup table:

```python
PROFILE_TITLES = {
    # (exploration_style, dominant_vibe) → (title, tagline)
    ("adventurous", "trendy"): ("Trend Hunter", "First to find the next big thing"),
    ("adventurous", "social"): ("Social Explorer", "Where the party's at"),
    ("adventurous", "upscale"): ("Refined Adventurer", "Luxury with a twist"),
    ("routine", "chill"): ("Comfort Connoisseur", "Knows what they love"),
    ("routine", "casual"): ("Neighborhood Regular", "Loyal to the locals"),
    # ~20 combinations cover 95% of users
}

def get_profile_title(declared_taste, observed_taste):
    exploration = declared_taste.exploration_style
    dominant_vibe = get_dominant_vibe(declared_taste.vibe_preferences)
    return PROFILE_TITLES.get((exploration, dominant_vibe), DEFAULT_TITLE)
```

### Transaction Processor

```python
class TransactionProcessor:
    """Normalize Plaid transactions into taste signals."""

    def process(self, plaid_txn) -> ProcessedTransaction:
        return ProcessedTransaction(
            id=plaid_txn.transaction_id,
            amount=abs(plaid_txn.amount),
            timestamp=plaid_txn.datetime or plaid_txn.date,
            merchant=MerchantInfo(
                name=plaid_txn.merchant_name or plaid_txn.name,
                id=plaid_txn.merchant_entity_id,
            ),
            taste_category=self._map_category(plaid_txn.personal_finance_category),
            cuisine=self._extract_cuisine(plaid_txn.personal_finance_category.detailed),
            time_bucket=self._get_time_bucket(plaid_txn.datetime),  # morning/afternoon/evening/night
            day_type=self._get_day_type(plaid_txn.date),            # weekday/weekend
        )

    def _map_category(self, plaid_category) -> str:
        """Map Plaid categories to taste categories."""
        CATEGORY_MAP = {
            "COFFEE_SHOPS": "coffee",
            "RESTAURANTS": "dining",
            "FAST_FOOD": "fast_food",
            "BARS": "nightlife",
            "ENTERTAINMENT": "entertainment",
            "GYMS_AND_FITNESS_CENTERS": "fitness",
            # ... more mappings
        }
        return CATEGORY_MAP.get(plaid_category.primary, "other")

    def _extract_cuisine(self, detailed_category: str) -> str | None:
        """Extract cuisine type from Plaid detailed category.

        Plaid's personal_finance_category.detailed provides structured cuisine info:
        - FOOD_AND_DRINK_RESTAURANT_ASIAN → "asian"
        - FOOD_AND_DRINK_RESTAURANT_SUSHI → "sushi"
        - FOOD_AND_DRINK_RESTAURANT_THAI → "thai"

        This enables cuisine-based venue matching without manual merchant mapping.
        """
        CUISINE_MAP = {
            "FOOD_AND_DRINK_RESTAURANT_ASIAN": "asian",
            "FOOD_AND_DRINK_RESTAURANT_SUSHI": "sushi",
            "FOOD_AND_DRINK_RESTAURANT_THAI": "thai",
            "FOOD_AND_DRINK_RESTAURANT_INDIAN": "indian",
            "FOOD_AND_DRINK_RESTAURANT_LATIN_AMERICAN": "latin",
            "FOOD_AND_DRINK_RESTAURANT_EUROPEAN": "european",
            "FOOD_AND_DRINK_RESTAURANT_AMERICAN": "american",
            "FOOD_AND_DRINK_RESTAURANT_MIDDLE_EASTERN": "middle_eastern",
            "FOOD_AND_DRINK_RESTAURANT_AFRICAN": "african",
            "FOOD_AND_DRINK_RESTAURANT_SEAFOOD": "seafood",
            "FOOD_AND_DRINK_RESTAURANT_STEAKHOUSE": "steakhouse",
            "FOOD_AND_DRINK_RESTAURANT_PIZZA": "pizza",
            "FOOD_AND_DRINK_RESTAURANT_VEGETARIAN_VEGAN": "vegetarian",
            "FOOD_AND_DRINK_RESTAURANT_BREAKFAST_BRUNCH": "brunch",
        }
        return CUISINE_MAP.get(detailed_category)
```

### Aggregation Engine

All operations are **O(1)** - never recomputes from scratch.

```python
class AggregationEngine:
    """Maintain running aggregates for taste analysis."""

    def ingest(self, txn: ProcessedTransaction, analysis: UserAnalysis) -> UserAnalysis:
        # 1. Category breakdown
        analysis.categories[txn.taste_category].count += 1
        analysis.categories[txn.taste_category].total_spend += txn.amount
        analysis.categories[txn.taste_category].merchants.add(txn.merchant.id)

        # 2. Time distribution
        analysis.time_buckets[txn.time_bucket] += 1

        # 3. Day patterns
        analysis.day_types[txn.day_type] += 1

        # 4. Merchant loyalty
        analysis.merchant_visits[txn.merchant.id] += 1
        self._update_top_merchants(analysis)

        # 5. Streak tracking
        self._update_streaks(analysis, txn)

        # 6. Exploration ratio
        self._update_exploration(analysis, txn)

        # 7. Cuisine distribution (from Plaid detailed categories)
        if txn.cuisine:
            analysis.cuisines[txn.cuisine] = analysis.cuisines.get(txn.cuisine, 0) + 1
            self._update_top_cuisines(analysis)

        # 8. Update metadata
        analysis.total_transactions += 1
        analysis.last_transaction_at = txn.timestamp

        return analysis

    def _update_top_cuisines(self, analysis: UserAnalysis) -> None:
        """Rebuild top cuisines list - cached top 5 for quick access."""
        sorted_cuisines = sorted(
            analysis.cuisines.items(),
            key=lambda x: x[1],
            reverse=True
        )
        analysis.top_cuisines = [c[0] for c in sorted_cuisines[:5]]
```

**Cuisine Tracking Benefit**: By extracting cuisine from Plaid's detailed categories, we can:
- Show users their actual cuisine preferences (not just "dining")
- Match users to venues by observed cuisine preference
- Track cuisine exploration over time

### Taste Fusion

```python
class TasteFusion:
    """Combine declared (quiz) and observed (transactions) taste."""

    def fuse(self, declared: DeclaredTaste, observed: UserAnalysis) -> FusedTaste:
        # Weight based on transaction volume
        txn_count = observed.total_transactions
        declared_weight = max(0.2, 1.0 - (txn_count / 500))  # 80% quiz → 20% quiz over time
        observed_weight = 1.0 - declared_weight

        # Combine category preferences
        fused_categories = {}
        for cat in TASTE_CATEGORIES:
            declared_score = declared.get_category_score(cat)
            observed_score = observed.get_category_percentage(cat)
            fused_categories[cat] = (declared_score * declared_weight +
                                     observed_score * observed_weight)

        # Detect mismatches for insights
        mismatches = self._detect_mismatches(declared, observed)

        return FusedTaste(
            categories=fused_categories,
            vibes=self._fuse_vibes(declared, observed),
            top_merchants=observed.top_merchants,
            streaks=observed.streaks,
            exploration_ratio=observed.exploration,
            mismatches=mismatches,
            confidence=self._calculate_confidence(txn_count),
        )
```

---

## Venue Catalog Architecture

The venue catalog is **curated** for MVP - ~200 venues near USC Los Angeles, tagged with taste clusters using AI.

```
┌─────────────────────────────────────────────────────────────────┐
│                    VENUE CATALOG (MVP)                           │
│                                                                  │
│  Data Source: Apify Google Maps Scraper + Claude Haiku Tagging   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  VENUES TABLE (~150-200 for beta)                         │   │
│  │                                                           │   │
│  │  FROM GOOGLE PLACES:                                      │   │
│  │  - place_id (unique identifier)                           │   │
│  │  - name, formatted_address                                │   │
│  │  - photos (references)                                    │   │
│  │  - opening_hours                                          │   │
│  │  - rating, price_level                                    │   │
│  │  - location (lat/lng) → geo-filtering                     │   │
│  │                                                           │   │
│  │  PRIMARY TAGS (Manual - CEO assigned):                    │   │
│  │  - taste_cluster: coffee, dining, nightlife, etc.         │   │
│  │  - cuisine_type: japanese, mexican, american, etc.        │   │
│  │  - price_tier: $, $$, $$$, $$$$                           │   │
│  │                                                           │   │
│  │  SECONDARY TAGS (GPT-generated from description/reviews): │   │
│  │  - energy: chill, buzzy, lively                           │   │
│  │  - date_friendly: boolean                                 │   │
│  │  - group_friendly: boolean                                │   │
│  │  - cozy: boolean                                          │   │
│  │  - vibe_tags: [romantic, trendy, hidden_gem, classic]     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Venue Import Flow

```
1. Run discovery script with search queries (e.g., "restaurants near usc")
           │
           ▼
2. Apify Google Maps Scraper fetches venue data + reviews
           │
           ▼
3. Claude Haiku analyzes reviews → generates VenueProfile
   (taste_cluster, cuisine_type, tagline, energy, best_for, standout)
           │
           ▼
4. Upsert venues to Supabase with all AI-generated tags
           │
           ▼
5. Location-based filtering (LA users see LA venues)
```

**Cost**: ~$0.00193/venue (Claude Haiku) + ~$0.0025/venue (Apify) = **~$0.45 for 100 venues**

### Venue Tagger (AI - One-Time at Import)

**IMPORTANT:** This is one of only 2 places AI is used. Tags are generated ONCE when a venue is imported and cached forever. No runtime AI calls for venue data.

Uses **Claude Haiku** with **structured outputs** for type-safe extraction:

```python
from pydantic import BaseModel, Field
import anthropic

class VenueProfile(BaseModel):
    """Structured venue profile extracted by Claude Haiku."""
    taste_cluster: Literal["coffee", "dining", "nightlife", "bakery"]
    cuisine_type: str | None = Field(description="Lowercase cuisine or null")
    tagline: str = Field(description="8-12 word punchy description")
    energy: Literal["chill", "moderate", "lively"]
    best_for: list[str] = Field(max_length=3)  # date_night, group_celebration, solo_work, etc.
    standout: list[str] = Field(max_length=2)  # hidden_gem, local_favorite, instagram_worthy, etc.

class VenueTagger:
    """Tag venues using Claude Haiku with structured outputs. ONE-TIME at import."""

    def __init__(self):
        self._client = anthropic.Anthropic()

    def tag(self, venue_data: dict) -> VenueProfile:
        """Called ONCE per venue at import. Results stored in venues table."""
        response = self._client.beta.messages.parse(
            model="claude-haiku-4-5",
            max_tokens=300,
            betas=["structured-outputs-2025-11-13"],
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": self._build_prompt(venue_data)}],
            output_format=VenueProfile,
        )
        return response.parsed_output
```

**VenueProfile Fields:**
| Field | Type | Description |
|-------|------|-------------|
| taste_cluster | enum | coffee, dining, nightlife, bakery |
| cuisine_type | string | Lowercase cuisine (e.g., "italian") or null |
| tagline | string | 8-12 word catchy description |
| energy | enum | chill, moderate, lively |
| best_for | array | Max 3: date_night, group_celebration, solo_work, business_lunch, casual_hangout, late_night, family_outing, quick_bite |
| standout | array | Max 2: hidden_gem, local_favorite, instagram_worthy, cult_following, cozy_vibes, upscale_feel |

### Insight Generator (AI - Cached Daily)

**IMPORTANT:** This is the second of only 2 places AI is used. Insights are generated daily via batch job or on-demand with semantic caching.

```python
class InsightGenerator:
    """Generate personalized insights using LLM. Cached by profile similarity."""

    INSIGHT_PROMPT = """
    Generate 2-3 personalized dining insights based on this user data.

    User Data:
    {user_data_json}

    Rules:
    - Each insight should be 1-2 sentences
    - Be specific (mention actual numbers, merchants)
    - Tone: friendly, slightly playful
    - Focus on interesting patterns or streaks

    Output Format:
    {
      "insights": [
        {"type": "streak", "title": "Coffee Streak!", "body": "..."},
        {"type": "discovery", "title": "New Favorite?", "body": "..."}
      ]
    }
    """

    async def generate(self, user_analysis: UserAnalysis) -> List[Insight]:
        # Check semantic cache first (similar profiles get cached response)
        cache_key = self._compute_profile_hash(user_analysis)
        if cached := await self._check_cache(cache_key):
            return cached

        response = await openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": self.INSIGHT_PROMPT.format(...)}],
            response_format={"type": "json_object"},
        )
        insights = self._parse_insights(response)
        await self._cache_response(cache_key, insights)
        return insights
```

---

## Matching Engine (Rule-Based - No AI)

Matches user taste profile to venues using a deterministic scoring algorithm. **No AI is used for matching.**

```python
class MatchingEngine:
    """Rank venues by taste match for a user."""

    def rank_venues(
        self,
        user_taste: FusedTaste,
        venues: List[Venue],
        filters: DiscoverFilters
    ) -> List[RankedVenue]:

        # 1. Apply hard filters first (price, distance, open now)
        filtered = self._apply_filters(venues, filters)

        # 2. Score each venue
        scored = []
        for venue in filtered:
            score = self._calculate_match_score(user_taste, venue)
            scored.append(RankedVenue(venue=venue, match_score=score))

        # 3. Sort by score descending
        scored.sort(key=lambda x: x.match_score, reverse=True)

        return scored

    def _calculate_match_score(self, taste: FusedTaste, venue: Venue) -> float:
        score = 0.0

        # Vibe match (30% weight)
        vibe_matches = len(set(taste.vibes) & set(venue.vibe_tags))
        score += (vibe_matches / max(len(taste.vibes), 1)) * 0.3

        # Cuisine match (20% weight) - from observed transaction data
        # Uses top_cuisines extracted from plaid_category_detailed
        if venue.cuisine_type in taste.top_cuisines:
            score += 0.2

        # Price match (20% weight)
        if venue.price_tier == taste.price_tier:
            score += 0.2

        # Category affinity (15% weight)
        category_pref = taste.categories.get(venue.taste_cluster, 0)
        score += category_pref * 0.15

        # Exploration bonus for adventurous users (15% weight)
        if taste.exploration_style == "adventurous" and "hidden_gem" in venue.vibe_tags:
            score += 0.15

        return min(score, 1.0)  # Cap at 100%
```

**Matching Data Sources:**
| Signal | Source | Weight |
|--------|--------|--------|
| Vibes | Quiz (declared_taste.vibe_preferences) | 30% |
| Cuisine | Transactions (user_analysis.top_cuisines from plaid_category_detailed) | 20% |
| Price | Quiz (declared_taste.price_tier) | 20% |
| Category | Fused (weighted quiz + transaction category breakdown) | 15% |
| Exploration | Quiz + behavior (declared exploration style + hidden_gem preference) | 15% |

---

## Tech Stack

### Frontend - React Native

```
Framework:     Expo SDK 52+ (managed workflow)
Navigation:    Expo Router (file-based routing)
State:         Zustand (lightweight, simple)
Styling:       NativeWind (Tailwind for RN)
Plaid:         react-native-plaid-link-sdk
Auth:          @supabase/supabase-js
Push:          expo-notifications

# Animation Stack
Animations:    react-native-reanimated 3
Gestures:      react-native-gesture-handler
Simple Anims:  moti (declarative, built on reanimated)
Celebrations:  lottie-react-native
Haptics:       expo-haptics
Gradients:     expo-linear-gradient

# Testing
Unit/Int:      Jest + React Native Testing Library
E2E (later):   Detox
```

### Backend - Python FastAPI

```
Framework:     FastAPI + Uvicorn
Database:      Supabase (PostgreSQL)
Plaid:         plaid-python
Venue Data:    apify-client (Google Maps scraper)
AI:            anthropic (Claude Haiku for tagging/insights)
Validation:    Pydantic v2
Background:    APScheduler (cron jobs)
Testing:       pytest + pytest-asyncio
Hosting:       Render / Railway
```

### Supabase

```
Auth:          Phone OTP + Apple/Google OAuth
Database:      PostgreSQL with Row Level Security
Storage:       Venue images (cached from Google)
Realtime:      WebSockets for group session sync
Edge Funcs:    Optional for lightweight operations
```

### External APIs

| API | Purpose | Cost |
|-----|---------|------|
| Plaid | Transaction data | Free (sandbox) → $0.30/item/mo (prod) |
| Apify | Venue discovery + reviews scraping | ~$0.0025/venue |
| Anthropic Claude | Venue tagging (Haiku) + insights | ~$0.002/venue (Haiku) |
| Expo Push | Push notifications | Free |

---

## Database Schema

```sql
-- =============================================
-- USERS & AUTH
-- =============================================

-- Extends Supabase auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z][a-zA-Z0-9_]{2,19}$')
);

-- =============================================
-- TASTE INTELLIGENCE
-- =============================================

-- Quiz answers (declared taste)
CREATE TABLE quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,        -- 'ideal_saturday', 'coffee_routine', etc.
  answer_key TEXT NOT NULL,          -- 'cozy_dinner', 'third_wave', etc.
  answer_value JSONB,                -- Additional structured data
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, question_key)
);

-- Declared taste (processed quiz)
CREATE TABLE declared_taste (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  vibe_preferences JSONB DEFAULT '[]',       -- ['chill', 'social']
  cuisine_preferences JSONB DEFAULT '[]',    -- ['japanese', 'mexican']
  dietary_restrictions JSONB DEFAULT '[]',   -- ['vegetarian']
  exploration_style TEXT,                    -- 'adventurous', 'routine'
  social_preference TEXT,                    -- 'solo', 'small_group', 'big_group'
  coffee_preference TEXT,                    -- 'third_wave', 'any', 'none'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plaid linked accounts
CREATE TABLE linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plaid_item_id TEXT NOT NULL,
  plaid_access_token TEXT NOT NULL,
  institution_name TEXT,
  institution_id TEXT,
  account_mask TEXT,
  status TEXT DEFAULT 'active',
  last_synced_at TIMESTAMPTZ,
  cursor TEXT,                               -- Plaid sync cursor
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw transactions from Plaid
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  linked_account_id UUID REFERENCES linked_accounts(id) ON DELETE CASCADE,
  plaid_transaction_id TEXT UNIQUE,
  amount DECIMAL(12,2),
  date DATE,
  datetime TIMESTAMPTZ,
  merchant_name TEXT,
  merchant_id TEXT,
  plaid_category_primary TEXT,
  plaid_category_detailed TEXT,              -- e.g., FOOD_AND_DRINK_RESTAURANT_ASIAN
  taste_category TEXT,                       -- Our mapped category (coffee, dining, etc.)
  cuisine TEXT,                              -- Extracted from detailed: asian, sushi, thai, etc.
  time_bucket TEXT,                          -- morning/afternoon/evening/night
  day_type TEXT,                             -- weekday/weekend
  location_city TEXT,
  location_state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_transactions_user_date (user_id, date DESC)
);

-- User analysis (observed taste - TIL aggregates)
CREATE TABLE user_analysis (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- Category aggregates
  categories JSONB NOT NULL DEFAULT '{}',        -- {coffee: {count: 43, spend: 215.50, merchants: [...]}}

  -- Time patterns
  time_buckets JSONB NOT NULL DEFAULT '{}',      -- {morning: 127, afternoon: 296, ...}
  day_types JSONB NOT NULL DEFAULT '{}',         -- {weekday: 524, weekend: 323}

  -- Merchant data
  merchant_visits JSONB NOT NULL DEFAULT '{}',   -- {merchant_id: visit_count}
  top_merchants JSONB NOT NULL DEFAULT '[]',     -- Cached top 10

  -- Cuisine tracking (from plaid_category_detailed)
  cuisines JSONB NOT NULL DEFAULT '{}',          -- {asian: 12, sushi: 8, thai: 5, ...}
  top_cuisines JSONB NOT NULL DEFAULT '[]',      -- Cached top 5 for matching

  -- Behavioral patterns
  streaks JSONB NOT NULL DEFAULT '{}',           -- {coffee: {current: 5, longest: 12, last_date: ...}}
  exploration JSONB NOT NULL DEFAULT '{}',       -- {dining: {unique: 23, total: 67}}

  -- Meta
  total_transactions INT NOT NULL DEFAULT 0,
  first_transaction_at TIMESTAMPTZ,
  last_transaction_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INT NOT NULL DEFAULT 0                 -- Optimistic locking
);

-- Fused taste profile (declared + observed combined)
CREATE TABLE fused_taste (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  categories JSONB NOT NULL DEFAULT '{}',        -- Weighted category scores
  vibes JSONB NOT NULL DEFAULT '[]',             -- Combined vibe preferences
  exploration_ratio FLOAT,
  confidence FLOAT,                              -- Based on data volume
  mismatches JSONB DEFAULT '[]',                 -- Declared vs observed differences
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- VENUE CATALOG
-- =============================================

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT UNIQUE NOT NULL,

  -- Google Places data
  name TEXT NOT NULL,
  formatted_address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  city TEXT NOT NULL,                            -- For geo-filtering
  google_rating DECIMAL(2, 1),
  google_price_level INT,                        -- 0-4
  opening_hours JSONB,
  photo_references JSONB DEFAULT '[]',

  -- Primary tags (CEO assigned)
  taste_cluster TEXT NOT NULL,                   -- coffee, dining, nightlife, etc.
  cuisine_type TEXT,                             -- japanese, mexican, etc. (if dining)
  price_tier TEXT,                               -- $, $$, $$$, $$$$

  -- Secondary tags (GPT generated)
  energy TEXT,                                   -- chill, buzzy, lively
  date_friendly BOOLEAN DEFAULT false,
  group_friendly BOOLEAN DEFAULT false,
  cozy BOOLEAN DEFAULT false,
  vibe_tags JSONB DEFAULT '[]',                  -- [romantic, trendy, hidden_gem]

  -- Meta
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_venues_city (city),
  INDEX idx_venues_cluster (taste_cluster)
);

-- =============================================
-- GROUP SESSIONS
-- =============================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                           -- "Dinner with friends"
  planned_date DATE,
  planned_time TIME,
  status TEXT DEFAULT 'voting',                  -- voting, closed, confirmed
  invite_code TEXT UNIQUE,                       -- For sharing
  winning_venue_id UUID REFERENCES venues(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant',               -- host, participant
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, user_id)
);

CREATE TABLE session_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  added_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, venue_id)
);

CREATE TABLE session_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, venue_id, user_id)
);

-- =============================================
-- VAULT (Place Visits)
-- =============================================

CREATE TABLE place_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id),           -- NULL if from transaction only
  transaction_id UUID REFERENCES transactions(id),

  -- Visit data
  visited_at TIMESTAMPTZ NOT NULL,
  merchant_name TEXT,                            -- From transaction or manual
  amount DECIMAL(12,2),                          -- From transaction

  -- User additions
  reaction TEXT,                                 -- love, meh, will_return, hidden_gem, disappointed
  notes TEXT,
  mood_tags JSONB DEFAULT '[]',                  -- User-selected mood tags

  -- Source tracking
  source TEXT DEFAULT 'transaction',             -- transaction, manual

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_place_visits_user_date (user_id, visited_at DESC)
);

-- =============================================
-- BOOKMARKS & PLAYLISTS
-- =============================================

CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, venue_id)
);

CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE playlist_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  position INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(playlist_id, venue_id)
);

-- =============================================
-- NOTIFICATIONS
-- =============================================

CREATE TABLE push_tokens (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  daily_insights BOOLEAN DEFAULT true,
  streak_milestones BOOLEAN DEFAULT true,
  session_invites BOOLEAN DEFAULT true,
  voting_reminders BOOLEAN DEFAULT true,
  plan_confirmations BOOLEAN DEFAULT true,
  marketing BOOLEAN DEFAULT false
);

CREATE TABLE daily_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type TEXT,                             -- streak, discovery, milestone
  title TEXT,
  body TEXT,
  source_data JSONB,
  shown_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, shown_at)
);

-- =============================================
-- ONBOARDING STATE
-- =============================================

CREATE TABLE onboarding_state (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  step TEXT DEFAULT 'welcome',                   -- welcome, auth, quiz, initial_taste, card_link, enhanced_reveal, complete
  quiz_completed BOOLEAN DEFAULT false,
  initial_taste_shown BOOLEAN DEFAULT false,     -- NEW: tracks if quiz-based profile was shown
  card_linked BOOLEAN DEFAULT false,
  initial_sync_done BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### Auth

```
POST   /api/auth/signup              # Phone/email signup
POST   /api/auth/verify-otp          # Verify OTP code
POST   /api/auth/social/{provider}   # Apple/Google OAuth
POST   /api/auth/logout
```

### Onboarding

```
GET    /api/onboarding/state         # Get user's onboarding progress
PATCH  /api/onboarding/state         # Update step
POST   /api/onboarding/quiz          # Submit quiz answers
GET    /api/onboarding/initial-taste # Get quiz-based taste profile (for Initial Taste Card)
POST   /api/onboarding/complete      # Mark onboarding complete
```

### Plaid (Card Linking)

```
POST   /api/plaid/create-link-token  # Get Plaid Link token
POST   /api/plaid/exchange-token     # Exchange public token for access
POST   /api/plaid/sync               # Sync transactions (manual trigger)
DELETE /api/plaid/accounts/{id}      # Remove linked account
```

### Taste Profile

```
GET    /api/taste/profile            # Get fused taste profile
GET    /api/taste/ring               # Get Taste Ring data for Pulse
GET    /api/taste/insights           # Get daily insight
```

### Discover

```
POST   /api/discover/feed            # Get personalized venue feed
       Body: { mood?: string, filters?: DiscoverFilters }
GET    /api/venues/{id}              # Get venue details
```

### Sessions (Group Planning)

```
POST   /api/sessions                 # Create new session
GET    /api/sessions/{id}            # Get session details
GET    /api/sessions/{code}/join     # Join via invite code
POST   /api/sessions/{id}/venues     # Add venue to session
DELETE /api/sessions/{id}/venues/{venue_id}
POST   /api/sessions/{id}/vote       # Cast votes
       Body: { venue_ids: string[] }
POST   /api/sessions/{id}/close      # Close voting (host only)
GET    /api/sessions/active          # Get user's active sessions
GET    /api/sessions/history         # Get past sessions
```

### Vault

```
GET    /api/vault/visits             # Get place visits (paginated)
       Query: ?category=&reaction=&from=&to=
POST   /api/vault/visits             # Add manual visit
PATCH  /api/vault/visits/{id}        # Update reaction/notes
DELETE /api/vault/visits/{id}        # Delete visit
GET    /api/vault/places/{venue_id}  # Get user's history with a place
```

### Bookmarks & Playlists

```
GET    /api/bookmarks                # Get all bookmarks
POST   /api/bookmarks                # Add bookmark
DELETE /api/bookmarks/{venue_id}     # Remove bookmark

GET    /api/playlists                # Get all playlists
POST   /api/playlists                # Create playlist
PATCH  /api/playlists/{id}           # Update playlist
DELETE /api/playlists/{id}           # Delete playlist
POST   /api/playlists/{id}/venues    # Add venue to playlist
DELETE /api/playlists/{id}/venues/{venue_id}
```

### Profile

```
GET    /api/profile                  # Get profile
PATCH  /api/profile                  # Update profile
GET    /api/profile/linked-cards     # Get linked Plaid accounts
```

### Notifications

```
POST   /api/notifications/token      # Register push token
DELETE /api/notifications/token      # Unregister
GET    /api/notifications/preferences
PATCH  /api/notifications/preferences
```

---

## Project Structure

```
ceezaa-mvp/
├── mobile/                          # React Native Expo
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── welcome.tsx
│   │   │   ├── login.tsx
│   │   │   └── verify.tsx
│   │   ├── (onboarding)/
│   │   │   ├── quiz.tsx
│   │   │   ├── initial-taste.tsx    # Quiz-based taste card (shown before card link)
│   │   │   ├── card-link.tsx
│   │   │   └── enhanced-reveal.tsx  # Final reveal (quiz + transactions)
│   │   ├── (tabs)/
│   │   │   ├── pulse/
│   │   │   │   ├── index.tsx        # Taste Ring, insights
│   │   │   │   └── taste-detail.tsx
│   │   │   ├── discover/
│   │   │   │   ├── index.tsx        # Mood grid
│   │   │   │   ├── feed.tsx         # Filtered feed
│   │   │   │   ├── venue/[id].tsx   # Venue detail
│   │   │   │   └── session/
│   │   │   │       ├── create.tsx
│   │   │   │       ├── [id].tsx     # Voting screen
│   │   │   │       └── confirmed.tsx
│   │   │   ├── vault/
│   │   │   │   ├── index.tsx        # Place visits
│   │   │   │   └── place/[id].tsx   # Place detail
│   │   │   └── profile/
│   │   │       ├── index.tsx
│   │   │       ├── cards.tsx
│   │   │       ├── notifications.tsx
│   │   │       └── privacy.tsx
│   │   └── _layout.tsx
│   │
│   ├── components/
│   │   ├── ui/                      # Reusable primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── __tests__/
│   │   ├── pulse/
│   │   │   ├── TasteRing.tsx
│   │   │   ├── InsightCard.tsx
│   │   │   └── __tests__/
│   │   ├── discover/
│   │   │   ├── MoodGrid.tsx
│   │   │   ├── VenueCard.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   └── __tests__/
│   │   ├── vault/
│   │   │   ├── PlaceCard.tsx
│   │   │   ├── ReactionPicker.tsx
│   │   │   └── __tests__/
│   │   └── session/
│   │       ├── VotingCard.tsx
│   │       ├── ParticipantList.tsx
│   │       └── __tests__/
│   │
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── api.ts
│   │   ├── plaid.ts
│   │   └── __tests__/
│   │
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── tasteStore.ts
│   │   ├── sessionStore.ts
│   │   └── __tests__/
│   │
│   ├── hooks/
│   │   ├── useTasteProfile.ts
│   │   ├── useSession.ts
│   │   └── __tests__/
│   │
│   └── __mocks__/
│
├── backend/                         # Python FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── dependencies.py
│   │   │
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── onboarding.py
│   │   │   ├── plaid.py
│   │   │   ├── taste.py
│   │   │   ├── discover.py
│   │   │   ├── sessions.py
│   │   │   ├── vault.py
│   │   │   ├── bookmarks.py
│   │   │   ├── profile.py
│   │   │   └── notifications.py
│   │   │
│   │   ├── services/
│   │   │   ├── plaid_service.py
│   │   │   ├── google_places_service.py
│   │   │   ├── notification_service.py
│   │   │   └── venue_tagging_service.py
│   │   │
│   │   ├── intelligence/            # TASTE INTELLIGENCE LAYER
│   │   │   ├── __init__.py
│   │   │   ├── quiz_processor.py       # Rule-based (FS1)
│   │   │   ├── transaction_processor.py # Rule-based (FS2)
│   │   │   ├── aggregation_engine.py   # Rule-based O(1) (FS2)
│   │   │   ├── taste_fusion.py         # Rule-based weighted (FS3)
│   │   │   ├── profile_titles.py       # Rule-based lookup (FS1)
│   │   │   ├── insight_generator.py    # AI - cached daily (FS5)
│   │   │   ├── venue_tagger.py         # AI - one-time import (FS6)
│   │   │   ├── matching_engine.py      # Rule-based scoring (FS7)
│   │   │   └── models.py
│   │   │
│   │   ├── mappings/                   # Deterministic mapping tables
│   │   │   ├── plaid_categories.py     # Plaid → taste category
│   │   │   ├── quiz_mappings.py        # Quiz answer → taste attributes
│   │   │   └── profile_title_mappings.py # (exploration, vibe) → title
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── taste.py
│   │   │   ├── venue.py
│   │   │   ├── session.py
│   │   │   └── vault.py
│   │   │
│   │   └── jobs/
│   │       ├── daily_insights.py
│   │       ├── streak_checker.py
│   │       └── transaction_sync.py
│   │
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_onboarding.py
│   │   ├── test_taste.py
│   │   ├── test_discover.py
│   │   ├── test_sessions.py
│   │   ├── test_vault.py
│   │   └── intelligence/
│   │       ├── test_quiz_processor.py
│   │       ├── test_transaction_processor.py
│   │       ├── test_aggregation_engine.py
│   │       ├── test_taste_fusion.py
│   │       └── test_matching_engine.py
│   │
│   ├── requirements.txt
│   └── Dockerfile
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_taste_tables.sql
│       └── 003_sessions.sql
│
├── scripts/
│   ├── import_venues.py             # Import curated venues
│   ├── tag_venues.py                # GPT tagging
│   └── seed_test_data.py
│
├── PRDs/                            # Source of truth
│   ├── Ceezaa MVP v1 – PRD.pdf
│   ├── Ceezaa MVP v1 – Onboarding PRD.pdf
│   ├── Ceezaa MVP v1 – Discover PRD.pdf
│   ├── Ceezaa MVP v1 – Pulse PRD.pdf
│   ├── Ceezaa MVP v1 – Vault PRD.pdf
│   └── Ceezaa MVP v1 – Profile PRD.pdf
│
├── APP_LAYOUT.md                    # UX/UI spec
├── TECH_ARCH.md                     # This file
└── README.md
```

---

## TDD Approach

### Red-Green-Refactor Workflow

```
1. RED    - Write failing test first
2. GREEN  - Write minimum code to pass
3. REFACTOR - Improve while keeping green
4. REPEAT
```

### Frontend Testing

```typescript
// Example: TasteRing component test
describe('TasteRing', () => {
  it('renders category breakdown correctly', () => {
    const mockData = {
      categories: { coffee: 34, dining: 28, nightlife: 22, entertainment: 16 }
    };

    const { getByText } = render(<TasteRing data={mockData} />);

    expect(getByText('34%')).toBeTruthy();
    expect(getByText('Coffee')).toBeTruthy();
  });

  it('animates on mount', () => {
    // Test animation triggers
  });

  it('navigates to detail on tap', () => {
    // Test navigation
  });
});
```

### Backend Testing

```python
# Example: Aggregation Engine test
class TestAggregationEngine:
    def test_ingests_transaction_updates_category(self):
        """Verify category count increments on transaction ingest."""
        engine = AggregationEngine()
        analysis = UserAnalysis(user_id="test")
        txn = ProcessedTransaction(
            id="txn_1",
            taste_category="coffee",
            amount=5.50,
            merchant=MerchantInfo(name="Blue Bottle", id="bb_1")
        )

        result = engine.ingest(txn, analysis)

        assert result.categories["coffee"].count == 1
        assert result.categories["coffee"].total_spend == 5.50
        assert "bb_1" in result.categories["coffee"].merchants

    def test_updates_streak_on_consecutive_days(self):
        """Verify streaks increment for consecutive day visits."""
        # ...

    def test_operations_are_o1(self):
        """Verify no full recomputation on ingest."""
        # ...
```

### Test Coverage Goals

| Area | Target | Priority |
|------|--------|----------|
| TIL Core | 90% | Critical |
| Matching Engine | 85% | Critical |
| API Endpoints | 80% | High |
| UI Components | 75% | High |
| Integration | 70% | Medium |

---

## Implementation: Full-Stack Checkpoints (FS1-FS10)

Each checkpoint is **atomic**, **full-stack** (backend + frontend), and **testable in Expo**.

### FS1: Quiz → Taste Profile
**Expo Test:** Take quiz → see real profile title based on YOUR answers

| Step | Type | Task |
|------|------|------|
| 1 | Backend | Create `quiz_mappings.py` with rule-based mappings |
| 2 | Backend | Create `QuizProcessor` class (TDD) |
| 3 | Backend | Add `price_tier` column to `declared_taste` |
| 4 | Backend | Create `POST /api/onboarding/quiz` endpoint |
| 5 | Backend | Create `GET /api/taste/profile` endpoint |
| 6 | Backend | Create `ProfileTitleMapper` (rule-based titles) |
| 7 | Frontend | Connect quiz.tsx to POST quiz answers |
| 8 | Frontend | Update initial-taste.tsx to fetch real profile |

### FS2: Transaction Sync → Observed Taste
**Expo Test:** Link sandbox bank → see "45 coffee transactions, 23 dining" etc.

| Step | Type | Task |
|------|------|------|
| 1 | Backend | Create `TransactionProcessor` class |
| 2 | Backend | Create `AggregationEngine` - incremental O(1) |
| 3 | Backend | Create `user_analysis` upsert logic |
| 4 | Backend | Create `GET /api/taste/observed` endpoint |
| 5 | Frontend | Update card-link.tsx to trigger sync |
| 6 | Frontend | Show "Analyzing X transactions..." progress |

### FS3: Taste Fusion → Unified Profile
**Expo Test:** Finish onboarding → see unified taste ring with YOUR data

| Step | Type | Task |
|------|------|------|
| 1 | Backend | Create `TasteFusion` class (weighted algorithm) |
| 2 | Backend | Implement confidence scoring |
| 3 | Backend | Create `fused_taste` upsert logic |
| 4 | Backend | Update `GET /api/taste/profile` for fused data |
| 5 | Frontend | Update enhanced-reveal.tsx to show fused profile |
| 6 | Frontend | Update Pulse tab with real Taste Ring |

### FS4: Taste Ring Data
**Expo Test:** Pulse tab → ring shows "40% coffee, 30% dining..."

| Step | Type | Task |
|------|------|------|
| 1 | Backend | Create `GET /api/taste/ring` endpoint |
| 2 | Backend | Calculate ring segments from fused_taste |
| 3 | Frontend | Connect TasteRing component to API |
| 4 | Frontend | Animate ring with real percentages |

### FS5: AI Insights (First LLM Usage)
**Expo Test:** Pulse tab shows "You've had coffee 5 days straight!"

| Step | Type | Task |
|------|------|------|
| 1 | Backend | Create `InsightGenerator` class |
| 2 | Backend | Implement insight prompt template |
| 3 | Backend | Add semantic caching |
| 4 | Backend | Create `POST /api/taste/generate-insights` |
| 5 | Backend | Store insights in `daily_insights` table |
| 6 | Backend | Create `GET /api/taste/insights` |
| 7 | Frontend | Connect InsightCard to API |

### FS6: Venue Catalog Import (Second LLM Usage)
**Expo Test:** Discover tab shows real venues with AI-generated vibes

| Step | Type | Task |
|------|------|------|
| 1 | Backend | Create Google Places import script |
| 2 | Backend | Create `VenueTaggingService` (LLM batch) |
| 3 | Backend | Import CEO's curated venue list |
| 4 | Backend | Store tagged venues in `venues` table |
| 5 | Backend | Create `GET /api/venues` endpoint |
| 6 | Frontend | Connect Discover tab to real venues |

### FS7: Taste-Based Matching
**Expo Test:** Discover shows "92% match" on venues that fit YOUR taste

| Step | Type | Task |
|------|------|------|
| 1 | Backend | Create `MatchingEngine` class (rule-based) |
| 2 | Backend | Implement taste-to-venue scoring |
| 3 | Backend | Create `GET /api/discover/feed` with personalization |
| 4 | Frontend | Connect Discover feed to API |
| 5 | Frontend | Show match percentage on VenueCard |

### FS8: Mood-Based Discovery
**Expo Test:** Tap "Date Night" → see romantic venues

| Step | Type | Task |
|------|------|------|
| 1 | Backend | Add mood parameter to `/api/discover/feed` |
| 2 | Backend | Filter venues by vibe_tags matching mood |
| 3 | Frontend | Connect MoodGrid tiles to filtered API |

### FS9: Sessions (Group Planning)
**Expo Test:** Create session → share code → vote together in real-time

| Step | Type | Task |
|------|------|------|
| 1 | Backend | Create session CRUD endpoints |
| 2 | Backend | Create join by code endpoint |
| 3 | Backend | Create voting endpoints |
| 4 | Backend | Set up Supabase Realtime |
| 5 | Frontend | Connect Create Session to API |
| 6 | Frontend | Connect Voting screen to Realtime |

### FS10: Vault (Visit History)
**Expo Test:** Vault shows "You visited Blue Bottle 3x this month"

| Step | Type | Task |
|------|------|------|
| 1 | Backend | Create auto-visit detection from transactions |
| 2 | Backend | Match transactions to venues by merchant |
| 3 | Backend | Create vault CRUD endpoints |
| 4 | Frontend | Connect Vault tab to real visit data |
| 5 | Frontend | Add reaction to visit |

---

### AI Usage Summary

| Checkpoint | AI Calls | When |
|------------|----------|------|
| FS1-FS4 | 0 | Rule-based only |
| FS5 | 1 per user | Daily batch OR cached |
| FS6 | 1 per venue | Import time only |
| FS7-FS10 | 0 | Rule-based only |

**Total AI in production:** ~1 call/user/day for insights + 0 for matching

---

## Environment Variables

### Mobile (.env)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_PLAID_ENV=sandbox
```

### Backend (.env)
```
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Plaid
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox

# Apify (venue scraping)
APIFY_TOKEN=

# Anthropic (AI tagging/insights)
ANTHROPIC_API_KEY=

# Push
EXPO_ACCESS_TOKEN=
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Mobile | React Native (Expo managed) | Cross-platform, fast iteration, per PRD |
| Auth | Supabase (Phone OTP + Social) | Simple, Gen Z friendly, built-in |
| Database | Supabase PostgreSQL | Managed, Realtime built-in |
| Backend | Python FastAPI | Best for data/AI work, per PRD |
| Venue Discovery | Apify Google Maps Scraper | Comprehensive data + reviews in one call |
| Venue Tagging | Claude Haiku + Structured Outputs | Type-safe, cost-effective (~$0.002/venue) |
| Real-time | Supabase Realtime | Built-in WebSockets |
| Animations | Reanimated + Moti | Native performance |
| Testing | Jest + pytest | TDD requirement |
| Hosting | Render/Railway | Simple deploy, free tier |

---

*Last updated: Dec 2025*
*Version: v3.0 - Apify + Claude Haiku Venue Pipeline*
