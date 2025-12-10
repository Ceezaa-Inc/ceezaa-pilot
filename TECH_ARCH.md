# Ceezaa MVP - Technical Architecture

> **Timeline:** 10 weeks
> **Stack:** React Native (Expo) + Supabase + Python FastAPI + Google Places + OpenAI
> **Goal:** Transaction + Quiz data → Taste Intelligence → Personalized Discovery + Group Planning
> **Core Magic:** Declared preferences (quiz) + Observed behavior (transactions) = True taste profile

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
│    Plaid API  •  Google Places API  •  OpenAI  •  Expo Push     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Taste Intelligence Layer (TIL)

The TIL is the core backend. It combines DECLARED preferences (quiz) with OBSERVED behavior (transactions) to build a unified taste profile.

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

### Quiz Processor

```python
class QuizProcessor:
    """Process quiz answers into declared taste preferences."""

    def process(self, answers: List[QuizAnswer]) -> DeclaredTaste:
        return DeclaredTaste(
            vibe_preferences=self._extract_vibes(answers),      # chill, social, adventurous
            cuisine_preferences=self._extract_cuisines(answers), # japanese, mexican, etc.
            dietary_restrictions=self._extract_dietary(answers), # vegan, gluten-free
            exploration_style=self._extract_exploration(answers), # adventurous vs routine
            social_preference=self._extract_social(answers),     # solo, small group, big group
            coffee_preference=self._extract_coffee(answers),     # third-wave, any, none
        )
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
            time_bucket=self._get_time_bucket(plaid_txn.datetime),  # morning/afternoon/evening/night
            day_type=self._get_day_type(plaid_txn.date),            # weekday/weekend
        )

    def _map_category(self, plaid_category) -> str:
        """Map Plaid categories to taste categories."""
        CATEGORY_MAP = {
            "COFFEE_SHOPS": "coffee",
            "RESTAURANTS": "dining",
            "FAST_FOOD": "dining",
            "BARS": "nightlife",
            "ENTERTAINMENT": "entertainment",
            "GYMS_AND_FITNESS_CENTERS": "fitness",
            # ... more mappings
        }
        return CATEGORY_MAP.get(plaid_category.primary, "other")
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

        # 7. Update metadata
        analysis.total_transactions += 1
        analysis.last_transaction_at = txn.timestamp

        return analysis
```

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

The venue catalog is **curated** for MVP - Manually selected 150-200 venues in SF, tagged with taste clusters.

```
┌─────────────────────────────────────────────────────────────────┐
│                    VENUE CATALOG (MVP)                           │
│                                                                  │
│  Data Source: Google Places API + CEO Curation                   │
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
1. Manually provide Google Places IDs for curated venues
           │
           ▼
2. Backend fetches full details from Google Places API
           │
           ▼
3. Manually assign primary cluster + cuisine + price
           │
           ▼
4. GPT analyzes description + reviews → secondary tags
           │
           ▼
5. Store in venues table with all tags
           │
           ▼
6. Location-based filtering (SF users see SF venues only)
```

### GPT Tagging Service

```python
class VenueTaggingService:
    """Use GPT to generate secondary tags from venue data."""

    TAGGING_PROMPT = """
    Given this venue information, generate tags:

    Name: {name}
    Description: {description}
    Reviews Summary: {reviews}
    Price Level: {price_level}
    Category: {category}

    Return JSON with:
    - energy: "chill" | "buzzy" | "lively"
    - date_friendly: boolean
    - group_friendly: boolean
    - cozy: boolean
    - vibe_tags: list of 2-4 tags from [romantic, trendy, hidden_gem, classic,
                 instagrammable, low_key, upscale, casual, family_friendly]
    """

    async def generate_tags(self, venue: VenueData) -> SecondaryTags:
        response = await openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": self.TAGGING_PROMPT.format(...)}],
            response_format={"type": "json_object"},
        )
        return SecondaryTags.model_validate_json(response.choices[0].message.content)
```

---

## Matching Engine

Matches user taste profile to venues for personalized recommendations.

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

        # Category match (40% weight)
        category_pref = taste.categories.get(venue.taste_cluster, 0)
        score += category_pref * 0.4

        # Vibe match (30% weight)
        vibe_matches = len(set(taste.vibes) & set(venue.vibe_tags))
        score += (vibe_matches / max(len(taste.vibes), 1)) * 0.3

        # Merchant familiarity bonus (15% weight)
        if venue.name in taste.top_merchants:
            score += 0.15

        # Exploration bonus for adventurous users (15% weight)
        if taste.exploration_ratio > 0.5 and "hidden_gem" in venue.vibe_tags:
            score += 0.15

        return min(score, 1.0)  # Cap at 100%
```

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
Google:        googlemaps (Python client)
AI:            openai (Python SDK)
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
| Google Places | Venue data | $17/1000 requests |
| OpenAI | GPT for tagging/insights | ~$0.001/request (gpt-4o-mini) |
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
  plaid_category_detailed TEXT,
  taste_category TEXT,                       -- Our mapped category
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
│   │   │   ├── quiz_processor.py
│   │   │   ├── transaction_processor.py
│   │   │   ├── aggregation_engine.py
│   │   │   ├── taste_fusion.py
│   │   │   ├── analysis_store.py
│   │   │   ├── taste_interface.py
│   │   │   ├── matching_engine.py
│   │   │   └── models.py
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

## Implementation Timeline (10 Weeks)

### Phase 1: Foundation (Week 1)
**Goal:** Project setup + testing infrastructure

**Frontend:**
- [ ] Expo project with TypeScript strict mode
- [ ] Jest + React Native Testing Library setup
- [ ] UI primitives with tests (Button, Input, Card, Modal)
- [ ] Navigation skeleton (4 tabs)
- [ ] Mock data layer

**Backend:**
- [ ] FastAPI project with pytest setup
- [ ] Supabase project + initial schema
- [ ] Health check endpoint
- [ ] CI pipeline (lint + test)

### Phase 2: Auth + Onboarding (Week 2)
**Goal:** User can sign up, complete quiz, link card

**Frontend:**
- [ ] Welcome/Splash screen
- [ ] Phone/Email/Social auth screens
- [ ] Taste Profile Quiz (5-7 questions)
- [ ] Initial Taste Card (quiz-based profile, shown before card link)
- [ ] Card Link screen (Plaid modal, required - no skip)
- [ ] Enhanced Reveal (quiz + transactions combined)
- [ ] Tests

**Backend:**
- [ ] Supabase Auth configuration
- [ ] `/api/auth/*` endpoints
- [ ] `/api/onboarding/*` endpoints (including `/initial-taste` for quiz-based profile)
- [ ] Quiz response storage
- [ ] Quiz-to-taste-profile algorithm (for Initial Taste Card)
- [ ] Plaid integration (create-link-token, exchange-token)
- [ ] Initial transaction fetch
- [ ] Tests

### Phase 3: Taste Intelligence Layer (Week 3)
**Goal:** Transaction + Quiz → Taste Profile

**Backend (primary focus):**
- [ ] Quiz Processor
- [ ] Transaction Processor
- [ ] Aggregation Engine (O(1) operations)
- [ ] Taste Fusion (declared + observed)
- [ ] Analysis Store (persistence)
- [ ] Taste Interface APIs
- [ ] Tests for each TIL component

**Frontend (parallel):**
- [ ] Pulse home screen (Taste Ring, Insights)
- [ ] Connect to taste profile API
- [ ] Tests

### Phase 4: Discover + Venue Catalog (Week 4-5)
**Goal:** Personalized venue discovery

**Backend:**
- [ ] Google Places integration
- [ ] Venue import scripts
- [ ] GPT tagging service
- [ ] Matching Engine
- [ ] Discover endpoints
- [ ] Tests

**Frontend:**
- [ ] Mood Grid
- [ ] Filtered Feed
- [ ] Venue Detail
- [ ] Filter components
- [ ] Connect to APIs
- [ ] Tests

### Phase 5: Group Sessions (Week 5-6)
**Goal:** Full group planning flow

**Backend:**
- [ ] Session CRUD
- [ ] Invite code generation
- [ ] Voting logic
- [ ] Supabase Realtime setup
- [ ] Winner calculation
- [ ] Tests

**Frontend:**
- [ ] Create Session screen
- [ ] Voting screen (real-time)
- [ ] Participant list
- [ ] Confirmed plan view
- [ ] Deep linking for invites
- [ ] Tests

### Phase 6: Vault + Profile (Week 6-7)
**Goal:** Complete remaining tabs

**Backend:**
- [ ] Place visits CRUD
- [ ] Auto-create visits from transactions
- [ ] Reactions system
- [ ] Profile endpoints
- [ ] Notification preferences
- [ ] Tests

**Frontend:**
- [ ] Vault main screen
- [ ] Place detail with history
- [ ] Reaction picker
- [ ] Profile screens
- [ ] Linked cards management
- [ ] Tests

### Phase 7: Notifications + Polish (Week 7-8)
**Goal:** Push notifications, polish

**Backend:**
- [ ] Push notification service
- [ ] Daily insight generation job
- [ ] Streak notification triggers
- [ ] Tests

**Frontend:**
- [ ] Notification permission flow
- [ ] Settings screens
- [ ] Loading/error states
- [ ] Animation polish
- [ ] Tests

### Phase 8: Integration + Testing (Week 8-9)
**Goal:** E2E testing, bug fixes

- [ ] End-to-end testing (all user journeys)
- [ ] Error handling review
- [ ] Offline state handling
- [ ] Performance profiling
- [ ] Bug fixes

### Phase 9: Production Prep (Week 9-10)
**Goal:** Ready to ship

- [ ] Plaid production credentials
- [ ] Google Places production setup
- [ ] Environment configuration
- [ ] App Store / Play Store submission prep
- [ ] TestFlight / Internal testing
- [ ] Final bug fixes
- [ ] Documentation

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

# Google
GOOGLE_PLACES_API_KEY=

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

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
| Venue Data | Google Places + curation | Clean data, controlled quality |
| Tagging | GPT-4o-mini | Cost-effective, good quality |
| Real-time | Supabase Realtime | Built-in WebSockets |
| Animations | Reanimated + Moti | Native performance |
| Testing | Jest + pytest | TDD requirement |
| Hosting | Render/Railway | Simple deploy, free tier |

---

*Last updated: Dec 2024*
*Version: v1.0 - Full MVP Architecture*
