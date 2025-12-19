# Ceezaa MVP - Development Plan

> **Approach:** Full-stack atomic checkpoints - each testable in Expo
> **Testing:** TDD throughout - tests before implementation
> **AI Philosophy:** Rules First, AI Last (minimize LLM usage)

---

## CURRENT PROGRESS

| Phase | Status | Progress |
|-------|--------|----------|
| **Phase 1: Foundation** | ✅ Complete | 100% |
| **Phase 2: Onboarding UI** | ✅ Complete | 100% |
| **Phase 3: Core Tabs UI** | ✅ Complete | 100% |
| **B0: Backend Setup** | ✅ Complete | 100% |
| **B1: Plaid Exploration** | ✅ Complete | 100% |
| **B2: Plaid Integration** | ✅ Complete | 100% |
| **BA: Authentication** | 🔄 Partial | 70% |
| **FS1: Quiz → Taste Profile** | ✅ Complete | 100% |
| **FS2: Transaction Sync** | ✅ Complete | 100% |
| **FS3: Taste Fusion** | ✅ Complete | 100% |
| **FS4: Taste Ring Data** | ✅ Complete | 100% |
| **FS5: AI Insights** | ✅ Complete | 100% |
| **FS5.5: AI Taste DNA** | ✅ Complete | 100% |
| **FS6: Venue Catalog** | ✅ Complete | 100% |
| **FS7: Taste Matching** | ⬜ Not Started | 0% |
| **FS8: Mood Discovery** | ⬜ Not Started | 0% |
| **FS9: Sessions** | ⬜ Not Started | 0% |
| **FS10: Vault** | ⬜ Not Started | 0% |
| **Phase 8: Polish** | ⬜ Not Started | 0% |
| **Phase 9: Launch** | ⬜ Not Started | 0% |

**Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## INTELLIGENCE LAYER DESIGN

### Core Principle: Rules First, AI Last

```
┌─────────────────────────────────────────────────────────────────┐
│                    CEEZAA INTELLIGENCE LAYER                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   DECLARED   │    │   OBSERVED   │    │    FUSED     │      │
│  │    TASTE     │    │    TASTE     │    │    TASTE     │      │
│  │  (from quiz) │    │(transactions)│    │  (combined)  │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│    RULE-BASED          RULE-BASED          RULE-BASED          │
│   (quiz mapping)      (aggregation)       (weighted avg)       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   PROFILE    │    │   INSIGHTS   │    │    VENUE     │      │
│  │    TITLE     │    │  GENERATION  │    │   MATCHING   │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│    RULE-BASED           AI (LLM)           RULE-BASED          │
│  (lookup table)      (natural lang)      (score algorithm)     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    VENUE TAGGING                          │  │
│  │            AI (LLM) - ONE TIME AT IMPORT                  │  │
│  │  Input: Google Places data + reviews                      │  │
│  │  Output: vibe_tags, energy_level, best_for (cached)       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Where AI Is Used (Only 2 Places)

| Component | AI? | Rationale |
|-----------|-----|-----------|
| Quiz → Declared Taste | NO | Deterministic mapping |
| Transaction → Observed Taste | NO | Aggregation math |
| Taste Fusion | NO | Weighted algorithm |
| Profile Title | NO | Lookup table (~20 combinations) |
| **Insights Generation** | **YES** | Natural language is LLM strength |
| **Venue Tagging** | **YES** | One-time at import, cached forever |
| Venue Matching | NO | Score calculation |
| Feed Ranking | NO | Sort by score |

### AI Usage Summary

| Checkpoint | AI Calls | When |
|------------|----------|------|
| FS1-FS4 | 0 | Rule-based |
| FS5 | 1 per user | Daily batch OR cached |
| FS6 | 1 per venue | Import time only |
| FS7-FS10 | 0 | Rule-based |

**Production cost**: ~$5-10/month for thousands of users

---

## COMPLETED CHECKPOINTS

### ✅ B0: Project Setup (Complete)
FastAPI app, Supabase, migrations, GitHub Actions CI

### ✅ B1: Plaid Exploration (Complete)

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Create Plaid client helper | `backend/app/services/plaid_client.py` | ✅ |
| 2 | Write link token exploration test | `backend/tests/exploration/test_plaid_link.py` | ✅ |
| 3 | Write transaction sync exploration test | `backend/tests/exploration/test_plaid_transactions.py` | ✅ |
| 4 | Document transaction schema findings | `backend/app/models/plaid.py` | ✅ |
| 5 | Create category mapping config | `backend/app/mappings/plaid_categories.py` | ✅ |
| 6 | Run exploration tests & verify | 8/8 tests passing | ✅ |

### ✅ B2: Plaid Integration (Complete)

| # | Task | Status |
|---|------|--------|
| 1 | Implement `/api/plaid/create-link-token` | ✅ |
| 2 | Implement `/api/plaid/exchange-token` | ✅ |
| 3 | Create `linked_accounts` table | ✅ |
| 4 | Implement transaction fetch + store | ✅ |
| 5 | Implement `/api/plaid/sync` | ✅ |

### 🔄 BA: Authentication (Partial - DEV Mode Active)

| # | Task | Status |
|---|------|--------|
| 1 | Create backend auth router (`/api/auth/*`) | ✅ |
| 2 | Set up Supabase client in mobile | ✅ |
| 3 | Create useAuthStore with all auth methods | ✅ |
| 4 | Connect login/verify screens to Supabase | ✅ |
| 5 | Add DEV mode skip auth for testing | ✅ |
| 6 | Create Supabase trigger for profiles table | ✅ |
| 7 | Configure Twilio for Phone OTP | ⏳ Deferred |
| 8 | Implement Sign in with Apple | ⏳ Deferred |
| 9 | Implement Sign in with Google | ⏳ Deferred |

---

## FULL-STACK CHECKPOINTS (FS1-FS10)

Each checkpoint is:
- **Full-stack** (backend + frontend)
- **Testable in Expo** with real user interaction
- **Atomic** (single feature focus)
- **Progressive** (builds on previous)

---

### ✅ FS1: Quiz → Taste Profile (Complete)

**Goal**: Complete quiz in app → see your taste profile with real data

**Expo Test**: Take quiz → see "Social Explorer" title based on YOUR answers

| # | Type | Task | Status |
|---|------|------|--------|
| 1 | Backend | Create `backend/app/mappings/quiz_mappings.py` | ✅ |
| 2 | Backend | Create `backend/app/mappings/profile_title_mappings.py` | ✅ |
| 3 | Backend | Add `price_tier` column to `declared_taste` | ✅ |
| 4 | Backend | Write QuizProcessor tests | ✅ |
| 5 | Backend | Create `backend/app/intelligence/quiz_processor.py` | ✅ |
| 6 | Backend | Write ProfileTitleMapper tests | ✅ |
| 7 | Backend | Create `backend/app/intelligence/profile_titles.py` | ✅ |
| 8 | Backend | Create `POST /api/onboarding/quiz` endpoint | ✅ |
| 9 | Backend | Create `GET /api/taste/profile` endpoint | ✅ |
| 10 | Frontend | Connect `quiz.tsx` to POST quiz answers | ✅ |
| 11 | Frontend | Update `initial-taste.tsx` to fetch real profile | ✅ |
| 12 | Test | Complete quiz in Expo → see real profile title | ✅ |

**Completed**: Dev user flow with fixed UUID, real API integration, TasteRing with dynamic title/tagline

**Key Files:**
```
backend/app/
├── mappings/
│   ├── quiz_mappings.py         # Question → answer → preference mapping
│   └── profile_title_mappings.py # (exploration, vibe) → title lookup
├── intelligence/
│   ├── quiz_processor.py        # Process quiz, store declared_taste
│   └── profile_titles.py        # Get title from declared taste
└── routers/
    └── onboarding.py            # /api/onboarding/quiz endpoint

mobile/app/(onboarding)/
├── quiz.tsx                     # POST answers to backend
└── initial-taste.tsx            # GET profile from backend
```

---

### ✅ FS2: Transaction Sync → Observed Taste (Complete)

**Goal**: Link bank → see transaction-based taste data

**Expo Test**: Link sandbox bank → see "45 coffee transactions, 23 dining" etc.

| # | Type | Task | Status |
|---|------|------|--------|
| 1 | Backend | Write AggregationEngine tests | ✅ |
| 2 | Backend | Create `backend/app/intelligence/aggregation_engine.py` | ✅ |
| 3 | Backend | Implement incremental O(1) category updates | ✅ |
| 4 | Backend | Implement time pattern tracking | ✅ |
| 5 | Backend | Implement merchant loyalty tracking | ✅ |
| 6 | Backend | Create `user_analysis` upsert logic | ✅ |
| 7 | Backend | Auto-aggregate after transaction sync | ✅ |
| 8 | Frontend | Update `card-link.tsx` to trigger sync after link | ✅ |
| 9 | Frontend | Show "Analyzing X transactions..." progress | ✅ |
| 10 | Test | Link Plaid → see category breakdown | ✅ |

**Completed**: O(1) aggregation engine, automatic aggregation on sync, Plaid detailed categories stored.

**Key Files:**
```
backend/app/
├── intelligence/
│   └── aggregation_engine.py    # O(1) incremental aggregation
├── services/
│   └── plaid_service.py         # Stores plaid_category_detailed
└── models/
    └── plaid.py                 # ProcessedTransaction model
```

**Note**: `plaid_category_detailed` is stored in transactions table. Future enhancement will extract cuisine types from detailed categories (e.g., `FOOD_AND_DRINK_RESTAURANT_ASIAN` → "asian").

---

### ✅ FS3: Taste Fusion → Unified Profile (Complete)

**Goal**: Quiz + Transactions merged into single taste profile

**Expo Test**: Finish onboarding → Pulse tab shows real Taste Ring with YOUR data

| # | Type | Task | Status |
|---|------|------|--------|
| 1 | Backend | Write TasteFusion tests | ✅ |
| 2 | Backend | Create `backend/app/intelligence/taste_fusion.py` | ✅ |
| 3 | Backend | Implement weighted fusion algorithm | ✅ |
| 4 | Backend | Implement confidence scoring | ✅ |
| 5 | Backend | Create `fused_taste` upsert logic | ✅ |
| 6 | Backend | Create `GET /api/taste/fused` endpoint | ✅ |
| 7 | Frontend | Update `enhanced-reveal.tsx` to show fused profile | ✅ |
| 8 | Frontend | Update Pulse tab to use fused profile | ✅ |
| 9 | Frontend | Add category name formatting (Title Case) | ✅ |
| 10 | Test | Complete onboarding → see unified taste ring | ✅ |

**Completed**: Weighted fusion algorithm, confidence scoring, fused API endpoint, frontend integration, cuisine extraction.

**Key Files:**
```
backend/app/
├── intelligence/
│   └── taste_fusion.py          # TasteFusion class with weighted algorithm
├── routers/
│   └── taste.py                 # GET /api/taste/fused/{user_id}
└── tests/intelligence/
    └── test_taste_fusion.py     # TDD tests

mobile/
├── src/stores/
│   └── useTasteStore.ts         # fetchFusedProfile()
└── app/(tabs)/pulse/
    └── taste-detail.tsx         # Category display formatting
```

**Fusion Algorithm**:
```python
# Weight based on transaction volume
tx_weight = min(transaction_count / 50, 0.7)  # Max 70% transaction weight
quiz_weight = 1 - tx_weight

fused_categories = {
    cat: quiz_weight * declared[cat] + tx_weight * observed[cat]
    for cat in categories
}
```

**Cuisine Tracking** (Implemented):
- `CUISINE_MAPPING` in `plaid_categories.py` extracts cuisine from detailed categories
- `ProcessedTransaction.cuisine` field stores extracted cuisine type
- `UserAnalysis.cuisines` dict tracks cuisine counts, `top_cuisines` list (top 5)
- `AggregationEngine._update_cuisines()` maintains O(1) incremental updates
- Fused API returns `top_cuisines` for venue matching
- Note: Plaid sandbox returns generic categories (FAST_FOOD, COFFEE) - cuisine data requires production restaurant transactions

---

### ✅ FS4: Taste Ring Data (Complete)

**Goal**: Real data in Taste Ring visualization

**Expo Test**: Pulse tab → ring shows "40% coffee, 30% dining, 20% nightlife..."

| # | Type | Task | Status |
|---|------|------|--------|
| 1 | Backend | Create `GET /api/taste/ring` endpoint | ✅ |
| 2 | Backend | Create RingBuilder with ring-specific logic | ✅ |
| 3 | Backend | Max 5 segments, min 3% threshold | ✅ |
| 4 | Frontend | Create `useTasteRing` hook to fetch data | ✅ |
| 5 | Frontend | Connect TasteRing component to API | ✅ |
| 6 | Test | Pulse tab shows YOUR spending breakdown | ✅ |

**Completed**: Dedicated ring endpoint with visualization-optimized logic, useTasteRing hook, TasteRing component integration.

**Key Files:**
```
backend/app/
├── intelligence/
│   └── ring_builder.py             # RingBuilder class (max 5 segments, min 3%)
└── routers/
    └── taste.py                    # GET /api/taste/ring/{user_id}

mobile/src/
├── hooks/
│   └── useTasteRing.ts             # Dedicated hook for ring data
└── components/pulse/TasteRing/
    └── TasteRing.tsx               # Connected to ring endpoint
```

**Ring Data Format**:
```json
{
  "segments": [
    { "category": "coffee", "percentage": 40, "color": "#8B4513" },
    { "category": "dining", "percentage": 30, "color": "#D4AF37" },
    { "category": "nightlife", "percentage": 20, "color": "#4B0082" }
  ],
  "profile_title": "Social Explorer",
  "tagline": "Where the party's at"
}
```

---

### ✅ FS5: AI Insights (Complete)

**Goal**: Personalized insights generated from your data

**Expo Test**: Pulse tab shows AI-generated insights about your spending habits

| # | Type | Task | Status |
|---|------|------|--------|
| 1 | Backend | Create `InsightGenerator` with Claude Haiku | ✅ |
| 2 | Backend | Use structured outputs (Pydantic models) | ✅ |
| 3 | Backend | Add prompt caching (90% cost reduction) | ✅ |
| 4 | Backend | Create `GET /api/taste/insights/{user_id}` | ✅ |
| 5 | Backend | On-demand generation with daily caching | ✅ |
| 6 | Backend | Store insights in `daily_insights` table | ✅ |
| 7 | Frontend | Add `fetchInsights` to useTasteStore | ✅ |
| 8 | Frontend | Connect Pulse tab to fetch insights on mount | ✅ |
| 9 | Test | 9 unit tests passing | ✅ |

**Key Files:**
```
backend/app/
├── intelligence/
│   └── insight_generator.py     # InsightGenerator with Claude Haiku
└── routers/
    └── taste.py                 # GET /api/taste/insights/{user_id}

mobile/src/
└── stores/
    └── useTasteStore.ts         # fetchInsights action
```

**Implementation Details:**
- Model: `claude-haiku-4-5` for cost efficiency (~$24/month for 1000 users)
- Structured outputs beta: `structured-outputs-2025-11-13` for guaranteed JSON
- Prompt caching: System prompt cached (5-min TTL, auto-refresh)
- Daily caching: Insights generated once per day, stored in DB
- Insight types: streak, discovery, pattern, milestone

**Requires**: `ANTHROPIC_API_KEY` in Render environment variables

---

### ✅ FS5.5: AI Taste DNA (Complete)

**Goal**: AI-generated personalized taste personality traits

**Expo Test**: Taste Profile shows 4 unique AI-generated DNA cards about YOUR taste

| # | Type | Task | Status |
|---|------|------|--------|
| 1 | Backend | Create `DNAGenerator` with Claude Haiku | ✅ |
| 2 | Backend | Use structured outputs (Pydantic models) | ✅ |
| 3 | Backend | Add few-shot prompting for quality | ✅ |
| 4 | Backend | Create `GET /api/taste/dna/{user_id}` | ✅ |
| 5 | Backend | On-demand generation with daily caching | ✅ |
| 6 | Backend | Store DNA traits in `daily_dna` table | ✅ |
| 7 | Frontend | Add `fetchDNA` to useTasteStore | ✅ |
| 8 | Frontend | Connect taste-detail to fetch DNA on mount | ✅ |

**Key Files:**
```
backend/app/
├── intelligence/
│   └── dna_generator.py          # DNAGenerator with Claude Haiku
└── routers/
    └── taste.py                  # GET /api/taste/dna/{user_id}

mobile/
├── src/stores/
│   └── useTasteStore.ts          # fetchDNA action
└── app/(tabs)/pulse/
    └── taste-detail.tsx          # Fetches DNA on mount
```

**Implementation Details:**
- Model: `claude-haiku-4-5` for cost efficiency
- Structured outputs beta: `structured-outputs-2025-11-13`
- Few-shot prompting: 2 complete examples in system prompt
- Daily caching: DNA generated once per day, stored in `daily_dna` table
- Input: Quiz answers + transaction data for personalization
- Output: 4 unique DNA traits (name, emoji, description, color)

**DNA Trait Example Output:**
```json
{
  "name": "Caffeine Devotee",
  "emoji": "☕",
  "description": "45% of your visits are coffee runs",
  "color": "#F59E0B"
}
```

---

### ⬜ FS6: Venue Catalog Import (Second LLM Usage)

**Goal**: Import venues with AI-generated tags

**Expo Test**: Discover tab shows real SF/NYC venues with vibe tags

| # | Type | Task | TDD |
|---|------|------|-----|
| 1 | Backend | Create Google Places import script | - |
| 2 | Backend | Create `backend/app/intelligence/venue_tagger.py` | - |
| 3 | Backend | Implement venue tagging prompt (JSON structured) | - |
| 4 | Backend | Import CEO's curated venue list (150-200) | Batch |
| 5 | Backend | Store tagged venues in `venues` table | - |
| 6 | Backend | Create `GET /api/venues` endpoint | - |
| 7 | Backend | Create `GET /api/venues/{id}` endpoint | - |
| 8 | Frontend | Connect Discover tab to real venue data | - |
| 9 | Test | Browse real venues with AI-generated vibes | E2E |

**Venue Tagging Prompt**:
```python
VENUE_TAG_PROMPT = """
Analyze this venue and generate tags.

Venue: {name}
Category: {google_category}
Price: {price_level}
Reviews: {top_reviews}

Output (JSON):
{
  "vibe_tags": ["trendy", "intimate"],
  "energy_level": "medium",
  "best_for": ["date_night", "groups"],
  "cuisine_tags": ["italian", "pizza"],
  "crowd": "young_professional"
}
"""
```

**Key**: This runs ONCE per venue at import. Results cached forever.

---

### ⬜ FS7: Taste-Based Matching

**Goal**: Venues ranked by YOUR taste profile

**Expo Test**: Discover shows "92% match" on venues that fit YOUR taste

| # | Type | Task | TDD |
|---|------|------|-----|
| 1 | Backend | Write MatchingEngine tests | RED |
| 2 | Backend | Create `backend/app/intelligence/matching_engine.py` | GREEN |
| 3 | Backend | Implement taste-to-venue scoring algorithm | GREEN |
| 4 | Backend | Create `GET /api/discover/feed` with personalization | - |
| 5 | Frontend | Connect Discover feed to personalized API | - |
| 6 | Frontend | Show match percentage on VenueCard | - |
| 7 | Test | See venues ranked by YOUR preferences | E2E |

**Matching Algorithm** (Rule-based, no AI):
```python
def calculate_match(user_taste, venue):
    score = 0

    # Vibe match (30%)
    vibe_overlap = len(set(user_taste.vibes) & set(venue.vibe_tags))
    score += 0.3 * (vibe_overlap / max(len(user_taste.vibes), 1))

    # Cuisine match (20%) - from observed transaction data
    # Uses top_cuisines extracted from plaid_category_detailed
    # e.g., FOOD_AND_DRINK_RESTAURANT_ASIAN → "asian"
    if venue.cuisine_type in user_taste.top_cuisines:
        score += 0.2

    # Price match (20%)
    if venue.price_tier == user_taste.price_tier:
        score += 0.2

    # Category affinity (15%)
    score += 0.15 * user_taste.category_weights.get(venue.taste_cluster, 0)

    # Exploration bonus (15%) - for adventurous users
    if user_taste.exploration_style == "adventurous" and venue.is_hidden_gem:
        score += 0.15

    return round(score * 100)  # Return as percentage
```

**Data Sources for Matching:**
- `vibes`: From quiz (declared_taste.vibe_preferences)
- `top_cuisines`: From transactions (extracted from plaid_category_detailed)
- `price_tier`: From quiz (declared_taste.price_tier)
- `category_weights`: From fused_taste (weighted quiz + transaction data)
- `exploration_style`: From quiz (declared_taste.exploration_style)

---

### ⬜ FS8: Mood-Based Discovery

**Goal**: Filter venues by mood

**Expo Test**: Tap "Date Night" → see romantic venues

| # | Type | Task | TDD |
|---|------|------|-----|
| 1 | Backend | Add `mood` parameter to `/api/discover/feed` | - |
| 2 | Backend | Define mood → vibe_tags mapping | - |
| 3 | Backend | Filter venues by vibe_tags matching mood | - |
| 4 | Frontend | Connect MoodGrid tiles to filtered API | - |
| 5 | Frontend | Show filtered results on mood selection | - |
| 6 | Test | Tap mood tile → see filtered venues | E2E |

**Mood Mapping**:
```python
MOOD_TO_VIBES = {
    "date_night": ["romantic", "intimate", "upscale"],
    "group_hangout": ["social", "energetic", "fun"],
    "solo_treat": ["chill", "cozy", "quiet"],
    "quick_bite": ["casual", "fast", "convenient"],
    "special_occasion": ["upscale", "elegant", "trendy"],
    "late_night": ["nightlife", "energetic", "late"],
}
```

---

### ⬜ FS9: Sessions (Group Planning)

**Goal**: Real-time group voting

**Expo Test**: Create session on one device, join on another, see real-time votes

| # | Type | Task | TDD |
|---|------|------|-----|
| 1 | Backend | Create `POST /api/sessions` endpoint | - |
| 2 | Backend | Create `GET /api/sessions/{id}` endpoint | - |
| 3 | Backend | Create `POST /api/sessions/{code}/join` endpoint | - |
| 4 | Backend | Create `POST /api/sessions/{id}/vote` endpoint | - |
| 5 | Backend | Create `POST /api/sessions/{id}/close` endpoint | - |
| 6 | Backend | Set up Supabase Realtime for sessions | Config |
| 7 | Frontend | Connect Create Session to API | - |
| 8 | Frontend | Implement Realtime subscription for votes | - |
| 9 | Frontend | Connect Voting screen to live updates | - |
| 10 | Test | Multi-device session with real-time votes | E2E |

---

### ⬜ FS10: Vault (Visit History)

**Goal**: Auto-populated visit history from transactions

**Expo Test**: Vault shows "You visited Blue Bottle 3x this month" from Plaid data

| # | Type | Task | TDD |
|---|------|------|-----|
| 1 | Backend | Create auto-visit detection from transactions | - |
| 2 | Backend | Match transactions to venues by merchant name | - |
| 3 | Backend | Create `GET /api/vault/visits` endpoint | - |
| 4 | Backend | Create `POST /api/vault/visits` (manual add) | - |
| 5 | Backend | Create `PATCH /api/vault/visits/{id}` (add reaction) | - |
| 6 | Frontend | Connect Vault tab to real visit data | - |
| 7 | Frontend | Connect reaction picker to PATCH endpoint | - |
| 8 | Test | See auto-detected visits from transactions | E2E |

**Visit Detection**:
```python
def detect_visits(transactions, venues):
    visits = []
    for tx in transactions:
        if tx.taste_category in ['dining', 'coffee', 'nightlife']:
            # Fuzzy match merchant name to venue
            matched_venue = fuzzy_match(tx.merchant_name, venues)
            if matched_venue:
                visits.append({
                    "venue_id": matched_venue.id,
                    "transaction_id": tx.id,
                    "date": tx.date,
                    "amount": tx.amount
                })
    return visits
```

---

## EXAMPLE USER JOURNEY

### Sarah's Onboarding (FS1-FS3)
1. Takes quiz: loves trendy spots, adventurous eater, Asian cuisine, $$$ budget
2. **Rule-based**: Maps to `exploration_style: adventurous`, `vibes: [trendy, social]`
3. **Rule-based**: Profile title = "Trend Hunter"
4. Links Chase card → syncs 6 months of transactions
5. **Rule-based**: Aggregates 47 coffee, 32 dining, 18 nightlife transactions
6. **Rule-based**: Fuses quiz + transactions (70% tx weight after 50+ transactions)
7. Sees Taste Ring: 45% coffee, 35% dining, 20% nightlife

### Sarah's Daily Use (FS5, FS7)
1. Opens Pulse tab
2. **AI (cached)**: "You've discovered 3 new coffee spots this week! Your explorer side is showing."
3. Opens Discover tab
4. **Rule-based**: Venues scored by taste match
5. Sees "Tartine Bakery - 94% match" (trendy, coffee, her price range)

### Venue Import (FS6 - Admin/Batch)
1. Import "Blue Bottle Coffee" from Google Places
2. **AI (one-time)**: Tags with `["trendy", "third-wave"]`, `energy: medium`, `best_for: ["work", "date"]`
3. Store in venues table
4. Never call AI again for this venue

---

## FILES STRUCTURE

```
backend/app/
├── intelligence/
│   ├── __init__.py
│   ├── quiz_processor.py        # FS1 - Rule-based
│   ├── profile_titles.py        # FS1 - Rule-based lookup
│   ├── aggregation_engine.py    # FS2 - Rule-based O(1)
│   ├── taste_fusion.py          # FS3 - Rule-based
│   ├── insight_generator.py     # FS5 - LLM (cached)
│   ├── venue_tagger.py          # FS6 - LLM (batch import)
│   └── matching_engine.py       # FS7 - Rule-based
├── mappings/
│   ├── plaid_categories.py      # Existing
│   ├── quiz_mappings.py         # FS1
│   └── profile_title_mappings.py # FS1
└── routers/
    ├── auth.py                  # Existing
    ├── plaid.py                 # Existing
    ├── onboarding.py            # FS1
    ├── taste.py                 # FS1-FS5
    ├── discover.py              # FS7-FS8
    ├── venues.py                # FS6
    ├── sessions.py              # FS9
    └── vault.py                 # FS10
```

---

## Phase 8: Polish + Testing

**Goal:** E2E tests pass, animations polished, error states handled

| ID | Task | Priority |
|----|------|----------|
| P8-01 | Write E2E test: New user onboarding flow | P0 |
| P8-02 | Write E2E test: Returning user Pulse view | P0 |
| P8-03 | Write E2E test: Discover and bookmark flow | P0 |
| P8-04 | Write E2E test: Create and complete session | P0 |
| P8-05 | Write E2E test: Vault interaction flow | P0 |
| P8-06 | Implement network error handling | P0 |
| P8-07 | Create error boundary component | P0 |
| P8-08 | Add retry logic for failed requests | P1 |
| P8-09 | Implement offline state detection | P1 |
| P8-10 | Add empty state components | P1 |
| P8-11 | Polish Taste Ring animations | P1 |
| P8-12 | Polish card transitions | P1 |
| P8-13 | Add haptic feedback | P2 |
| P8-14 | Polish loading states | P1 |

---

## Phase 9: Launch Prep

**Goal:** Production ready, app store submission

| ID | Task | Priority |
|----|------|----------|
| L9-01 | Obtain Plaid production credentials | P0 |
| L9-02 | Set up Google Places production API key | P0 |
| L9-03 | Configure production environment variables | P0 |
| L9-04 | Set up production Supabase project | P0 |
| L9-05 | Deploy backend to production | P0 |
| L9-06 | Run production migration scripts | P0 |
| L9-07 | Create App Store Connect account | P0 |
| L9-08 | Create Google Play Console account | P0 |
| L9-09 | Generate iOS certificates and provisioning | P0 |
| L9-10 | Generate Android keystore | P0 |
| L9-11 | Prepare app store screenshots | P0 |
| L9-12 | Write app store description/metadata | P0 |
| L9-13 | Create privacy policy page | P0 |
| L9-14 | Build and deploy to TestFlight | P0 |
| L9-15 | Build and deploy to Internal Testing (Android) | P0 |
| L9-16 | Conduct internal testing round | P0 |
| L9-17 | Fix critical bugs from testing | P0 |
| L9-18 | Submit to App Store review | P0 |
| L9-19 | Submit to Google Play review | P0 |

---

## COMPLETED UI PHASES (Reference)

### Phase 1-3: Frontend Complete ✅

All UI components built with mock data:
- **Pulse Tab**: TasteRing, InsightCard, Playlists
- **Discover Tab**: MoodGrid, VenueCard, FilterBar, VenueDetail
- **Sessions**: Create, Voting, Confirmed screens
- **Vault Tab**: PlaceCard, ReactionPicker, PlaceDetail
- **Profile Tab**: LinkedCards, Notifications, Privacy
- **Onboarding**: Welcome, Login, Verify, Quiz, InitialTaste, CardLink, EnhancedReveal

52 Zustand store tests passing.

---

*Last updated: Dec 2024*
