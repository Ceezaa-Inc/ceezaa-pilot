# Ceezaa MVP - Technical Architecture

> **Timeline:** 4 weeks
> **Stack:** React Native + Supabase + Python FastAPI + OpenAI
> **Goal:** Link card → AI reveals taste identity → Share Truth Card
> **Core Magic:** AI transforms spending data into personalized identity narrative

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        REACT NATIVE (Expo)                       │
│                     iOS + Android Mobile App                     │
│              Push Notifications (expo-notifications)             │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                           SUPABASE                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Auth     │  │  PostgreSQL  │  │   Storage    │          │
│  │  (Phone OTP  │  │   Database   │  │ (Truth Card  │          │
│  │   + Social)  │  │              │  │   Images)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PYTHON FASTAPI                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              TASTE INTELLIGENCE LAYER (TIL)                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │ Transaction  │→ │ Aggregation  │→ │  Analysis    │     │ │
│  │  │  Processor   │  │   Engine     │  │   Store      │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  │                            │                               │ │
│  │                            ▼                               │ │
│  │                   ┌──────────────────┐                     │ │
│  │                   │  AI Interface    │                     │ │
│  │                   │ (TasteIntelligence)                    │ │
│  │                   └──────────────────┘                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│       ┌────────────────────┼────────────────────┐               │
│       ▼                    ▼                    ▼               │
│  ┌──────────┐       ┌──────────┐        ┌──────────┐           │
│  │   AI     │       │  Truth   │        │  Notif   │           │
│  │ Service  │       │  Card    │        │ Service  │           │
│  │ (OpenAI) │       │   Gen    │        │  (Expo)  │           │
│  └──────────┘       └──────────┘        └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         EXTERNAL APIs                            │
│       Plaid API  •  OpenAI API  •  Expo Push Service            │
└─────────────────────────────────────────────────────────────────┘
```

---

## The AI-Powered "Aha Moment"

### Why AI is Essential

The magic of Ceezaa isn't categorization (Plaid already does that). The magic is **transforming boring transaction data into a personalized identity narrative** that makes users feel "this app just gets me."

**Rule-based approach gives you:**
> "43% Food, 28% Coffee, 18% Entertainment"

**AI-powered approach gives you:**
> "You're an **Urban Explorer** - a Coffee Connoisseur who basically runs on espresso. You've tried 23 different restaurants this year. Your palate is basically a passport."

### What AI Generates

```json
{
  "archetype": "Urban Explorer",
  "archetype_emoji": "🏙️",
  "trait_badges": [
    {
      "name": "Coffee Connoisseur",
      "emoji": "☕",
      "description": "10% of your spend is cafes. You basically run on espresso."
    },
    {
      "name": "Late Night Foodie",
      "emoji": "🌙",
      "description": "15 orders after 10pm. The city never sleeps, and neither do you."
    },
    {
      "name": "Experience Seeker",
      "emoji": "🎭",
      "description": "More concerts than clothes. You collect moments, not things."
    }
  ],
  "headline_insight": "You've explored 23 unique restaurants this year. Your palate is basically a passport.",
  "rarity_percentile": 12,
  "share_caption": "Apparently I'm an Urban Explorer. What's your taste identity?"
}
```

---

## Taste Intelligence Layer (TIL)

The TIL is the backbone of personalization. It processes transactions incrementally and powers all surfaces.

### Layer 1: Transaction Processor

Normalizes messy Plaid data into clean, categorized transactions.

```python
class TransactionProcessor:
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
            day_type=self._get_day_type(plaid_txn.date),  # weekday/weekend
        )
```

### Layer 2: Aggregation Engine

Maintains running aggregates. **All operations are O(1)** - never recomputes from scratch.

```python
class AggregationEngine:
    def ingest(self, txn: ProcessedTransaction, analysis: UserAnalysis) -> UserAnalysis:
        # 1. Category breakdown
        analysis.categories[txn.taste_category].count += 1
        analysis.categories[txn.taste_category].merchants.add(txn.merchant.id)

        # 2. Time distribution
        analysis.time_buckets[txn.time_bucket] += 1

        # 3. Merchant loyalty
        analysis.merchant_visits[txn.merchant.id] += 1

        # 4. Streak tracking (per category)
        self._update_streaks(analysis, txn)

        # 5. Exploration ratio
        self._update_exploration(analysis, txn)

        return analysis
```

### Layer 3: Analysis Store

Single source of truth. Updated incrementally, persisted to DB.

```python
@dataclass
class UserAnalysis:
    user_id: str
    categories: Dict[str, CategoryMetrics]      # {coffee: {count: 43, merchants: set()}}
    time_buckets: Dict[str, int]                # {morning: 127, afternoon: 296, ...}
    day_types: Dict[str, int]                   # {weekday: 524, weekend: 323}
    merchant_visits: Dict[str, int]             # {merchant_id: visit_count}
    top_merchants: List[MerchantVisit]          # Cached top 10
    streaks: Dict[str, Streak]                  # {coffee: {current: 5, longest: 12}}
    exploration: Dict[str, ExplorationMetric]   # {dining: {unique: 23, total: 67}}
    total_transactions: int
    last_updated_at: datetime
```

### Layer 4: AI Interface (TasteIntelligence)

Clean, purpose-built APIs for different consumers.

```python
class TasteIntelligence:
    def get_full_profile(self, user_id: str) -> FullProfileContext:
        """For Truth Card generation - complete analysis"""

    def get_daily_context(self, user_id: str) -> DailyContext:
        """For daily insight - recent activity focus"""

    def get_home_context(self, user_id: str) -> HomeContext:
        """For home dashboard - lightweight, cached"""

    def get_processing_snapshot(self, user_id: str) -> ProcessingSnapshot:
        """For real-time processing screen updates"""
```

---

## Data Flow

### Initial Onboarding
```
User Links Card
      │
      ▼
Plaid: Fetch up to 12 months
      │
      ▼
┌─────────────────────────────────────────┐
│  FOR EACH transaction (streaming):      │
│    1. TransactionProcessor.process()    │  ← Normalize
│    2. AggregationEngine.ingest()        │  ← Update analysis (O(1))
│    3. SSE: send ProcessingSnapshot      │  ← Real-time UI update
└─────────────────────────────────────────┘
      │
      ▼
TasteIntelligence.get_full_profile()
      │
      ▼
AI Service: Generate identity
      │
      ▼
Store + Reveal
```

### Ongoing (Manual Refresh)
```
Pull-to-Refresh
      │
      ▼
Plaid: Sync new transactions only
      │
      ▼
FOR EACH new transaction:
  TransactionProcessor → AggregationEngine
      │
      ▼
Analysis updated (no AI call, no full recompute)
```

### Weekly Refresh (Cron)
```
Every 7 days:
  1. TasteIntelligence.get_full_profile()  ← Analysis already fresh
  2. AI Service: Regenerate identity       ← Only AI call needed
  3. Compare with previous                 ← Detect changes
  4. If changed → Push notification
```

**Key Insight:** Analysis updates incrementally (fast). AI regenerates weekly (expensive).

---

## Tech Stack

### Frontend - React Native
```
Framework:     Expo SDK 52 (managed workflow)
Navigation:    Expo Router (file-based routing)
State:         Zustand (lightweight)
Styling:       NativeWind (Tailwind for RN)
Plaid:         react-native-plaid-link-sdk
Auth:          @supabase/supabase-js
Image Gen:     react-native-view-shot (for Truth Card)
Push:          expo-notifications (Expo Push Service)

# Delight Stack
Animations:    react-native-reanimated 3
Gestures:      react-native-gesture-handler
Simple Anims:  moti (declarative, built on reanimated)
Celebrations:  lottie-react-native (confetti, success, loading)
Haptics:       expo-haptics (tactile feedback)
Gradients:     expo-linear-gradient
```

### Backend - Supabase
```
Auth:          Phone OTP + Apple/Google OAuth
Database:      PostgreSQL (managed)
Storage:       For generated Truth Card images
Edge Funcs:    For lightweight operations (optional)
```

### Backend - Python FastAPI
```
Framework:     FastAPI + Uvicorn
Plaid SDK:     plaid-python
AI SDK:        openai (Python SDK)
Image Gen:     Pillow + CairoSVG
Validation:    Pydantic v2
Hosting:       Render (free tier)
```

### AI Service
```
Model:         GPT-4o-mini
Cost:          ~$0.001 per taste profile
Latency:       200-500ms
JSON Mode:     Native support for structured output
Fallback:      Pre-written templates if API fails
```

---

## Database Schema

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT username_format CHECK (
    username ~ '^[a-zA-Z][a-zA-Z0-9_]{2,19}$'
  )
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw transactions from Plaid
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  linked_account_id UUID REFERENCES linked_accounts(id),
  plaid_transaction_id TEXT UNIQUE,
  amount DECIMAL(12,2),
  date DATE,
  merchant_name TEXT,
  merchant_id TEXT,
  category_primary TEXT,      -- Plaid's category
  category_detailed TEXT,     -- Plaid's detailed category
  location_city TEXT,
  location_state TEXT,
  taste_category TEXT,        -- Our mapped taste category
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User analysis (Layer 3: Analysis Store) - Updated incrementally
CREATE TABLE user_analysis (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- Core aggregates (JSONB for flexibility)
  categories JSONB NOT NULL DEFAULT '{}',       -- {coffee: {count: 43, merchants: [...]}}
  time_buckets JSONB NOT NULL DEFAULT '{}',     -- {morning: 127, afternoon: 296, ...}
  day_types JSONB NOT NULL DEFAULT '{}',        -- {weekday: 524, weekend: 323}
  merchant_visits JSONB NOT NULL DEFAULT '{}',  -- {merchant_id: visit_count}
  streaks JSONB NOT NULL DEFAULT '{}',          -- {coffee: {current: 5, longest: 12, last_date: ...}}
  exploration JSONB NOT NULL DEFAULT '{}',      -- {dining: {unique: 23, total: 67}}

  -- Cached top merchants (for fast reads)
  top_merchants JSONB NOT NULL DEFAULT '[]',

  -- Meta
  total_transactions INT NOT NULL DEFAULT 0,
  first_transaction_at TIMESTAMPTZ,
  last_transaction_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Version for optimistic locking
  version INT NOT NULL DEFAULT 0
);

-- AI-generated taste profile (refreshed weekly)
CREATE TABLE taste_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- AI-generated content
  archetype TEXT,                         -- "Urban Explorer"
  archetype_emoji TEXT,                   -- "🏙️"
  trait_badges JSONB,                     -- [{name, emoji, description}, ...]
  headline_insight TEXT,                  -- Main reveal line
  rarity_percentile INT,                  -- 1-100
  share_caption TEXT,                     -- For social sharing

  -- AI metadata
  model_version TEXT,                     -- "gpt-4o-mini-2024-07-18"
  generated_at TIMESTAMPTZ,

  -- For change detection
  previous_archetype TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push notification tokens
CREATE TABLE push_tokens (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Truth Cards
CREATE TABLE truth_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT,
  version INT DEFAULT 1,
  card_data JSONB,            -- Snapshot of taste profile at generation time
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily insights (AI-generated)
CREATE TABLE daily_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  insight_type TEXT,          -- streak, discovery, milestone, comparison
  emoji TEXT,
  title TEXT,                 -- "You're on fire!"
  body TEXT,                  -- "5-day coffee streak at Blue Bottle"

  source_data JSONB,          -- What triggered this insight
  ai_model_version TEXT,

  shown_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, shown_at)   -- One insight per user per day
);

-- AI response cache (cost optimization)
CREATE TABLE ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE,      -- Hash of input stats
  response JSONB,
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);
```

---

## Taste Categorization System

### Base Categories (7 core)
| Key | Name | Emoji | Plaid Categories |
|-----|------|-------|------------------|
| coffee | Coffee Culture | ☕ | Coffee Shop |
| dining | Dining & Food | 🍜 | Restaurants, Fast Food |
| nightlife | Nightlife | 🌙 | Bar, Nightlife |
| entertainment | Entertainment | 🎵 | Entertainment, Music, Movies |
| fitness | Fitness & Wellness | 💪 | Gyms and Fitness Centers |
| shopping | Shopping | 🛍️ | Shops, Clothing |
| travel | Travel & Adventure | ✈️ | Travel, Airlines, Hotels |

### Financial Data Analysis (computed once, AI interprets)

Instead of rigid rules like "15+ transactions = Night Owl", we aggregate raw data and let AI decide what's interesting about this specific user.

**What We Compute (deterministic):**
```json
{
  "category_breakdown": {
    "coffee": { "percentage": 43, "transaction_count": 43, "unique_merchants": 12 },
    "dining": { "percentage": 28, "transaction_count": 67, "unique_merchants": 23 }
  },
  "time_distribution": {
    "morning": 15,      // % of transactions 6am-12pm
    "afternoon": 35,    // % 12pm-6pm
    "evening": 30,      // % 6pm-10pm
    "night": 20         // % 10pm-6am
  },
  "day_of_week": {
    "weekday": 62,      // % Mon-Fri
    "weekend": 38       // % Sat-Sun
  },
  "merchant_loyalty": [
    { "name": "Blue Bottle Coffee", "visits": 18, "category": "coffee" },
    { "name": "Philz Coffee", "visits": 12, "category": "coffee" }
  ],
  "streaks": {
    "current_coffee_streak": 5,    // consecutive days with coffee transaction
    "longest_dining_streak": 3
  },
  "exploration_ratio": {
    "dining": { "unique": 23, "total": 67, "ratio": 0.34 }  // high = explorer
  },
  "period": {
    "days": 365,
    "total_transactions": 847
  }
}
```

**What AI Deduces:**
Given this data, AI decides:
- Is 20% night transactions notable for this user? (Maybe, maybe not)
- Is 5-day coffee streak impressive? (Context matters)
- Which patterns deserve badges vs just a mention?
- What archetype captures the overall vibe?

This is more powerful because AI weighs context rather than hitting arbitrary thresholds.

### Archetype Generation (AI-powered)
The AI receives category breakdown + patterns and generates a creative 2-word archetype:

| If Top Categories Are... | AI Might Generate... |
|--------------------------|---------------------|
| dining, coffee, nightlife | "Urban Explorer", "City Dweller" |
| fitness, coffee, shopping | "Wellness Warrior", "Active Minimalist" |
| entertainment, dining, travel | "Culture Vulture", "Experience Collector" |
| nightlife, dining, entertainment | "Social Butterfly", "Scene Setter" |

*Note: AI has creative freedom - these are examples, not fixed mappings.*

---

## API Endpoints

```
# Health
GET  /health

# Plaid
POST /api/plaid/create-link-token
POST /api/plaid/exchange-token
POST /api/plaid/sync-transactions

# Taste Analysis
POST /api/taste/analyze                    # Triggers full analysis
GET  /api/taste/analyze-stream/{user_id}   # SSE stream for progress
GET  /api/taste/profile/{user_id}          # Get taste profile

# Truth Card
POST /api/truth-card/generate
GET  /api/truth-card/{user_id}

# Daily Insights
GET  /api/insights/daily/{user_id}
```

### Progressive Analysis Stream (SSE)

The `/api/taste/analyze-stream/{user_id}` endpoint sends Server-Sent Events for the reveal experience:

```
Phase 1 (0-5s):   {"phase": 1, "message": "Reading your story...", "count": 847}
Phase 2 (5-15s):  {"phase": 2, "message": "Spotting patterns...", "categories": ["coffee", "dining"]}
Phase 3 (15-25s): {"phase": 3, "message": "Crafting your identity...", "teaser": "Looks like you love coffee..."}
Phase 4 (25-30s): {"phase": 4, "complete": true, "profile_id": "uuid"}
```

---

## AI Service Implementation

### Prompt Strategy

**Key Principle:** Send structured analysis, let AI interpret what's interesting. No rigid rules - AI decides what matters for THIS user.

```python
TASTE_PROFILE_SYSTEM_PROMPT = """
You are a witty lifestyle analyst creating personalized taste identities.
Your copy should feel like Spotify Wrapped - fun, slightly sassy, shareable.
Never judgmental about spending. Always celebratory and playful.

Your job: Look at the data and find what's INTERESTING about this person.
- Don't just describe the numbers - find the story
- A 5-day coffee streak might be notable... or not, depending on context
- 20% night transactions could mean "night owl" or be unremarkable
- You decide what deserves to be highlighted as a badge

Return ONLY valid JSON matching the exact schema provided.
"""

TASTE_PROFILE_USER_PROMPT = """
FINANCIAL ANALYSIS FOR USER:

Period: {days} days, {total_transactions} transactions

CATEGORY BREAKDOWN:
{category_breakdown}

TIME DISTRIBUTION:
- Morning (6am-12pm): {morning}%
- Afternoon (12pm-6pm): {afternoon}%
- Evening (6pm-10pm): {evening}%
- Night (10pm-6am): {night}%

DAY PATTERN:
- Weekday: {weekday}%
- Weekend: {weekend}%

TOP MERCHANTS (by visit frequency):
{top_merchants}

STREAKS:
{streaks}

EXPLORATION (unique merchants / total visits):
{exploration_ratios}

---

Based on this data, create a taste identity:

1. archetype: A creative 2-word identity that captures their vibe (not just their top category)
2. archetype_emoji: One emoji that fits
3. trait_badges: 2-3 badges for the MOST interesting patterns you found
   - Each badge needs: name, emoji, witty one-liner description
   - Only highlight what's actually notable - don't force badges
4. headline_insight: One punchy "aha moment" - the single most interesting thing
5. rarity_percentile: 1-100, estimate how unique this combination is
6. share_caption: Short, shareable caption for social media

{schema}
"""
```

### Response Validation

```python
from pydantic import BaseModel, Field
from typing import List

class TraitBadge(BaseModel):
    name: str
    emoji: str
    description: str = Field(max_length=100)

class AITasteContent(BaseModel):
    archetype: str = Field(max_length=30)
    archetype_emoji: str
    trait_badges: List[TraitBadge] = Field(max_length=3)
    headline_insight: str = Field(max_length=150)
    rarity_percentile: int = Field(ge=1, le=100)
    share_caption: str = Field(max_length=100)
```

### Fallback Strategy

If OpenAI API fails:
1. Use cached response if available (1-hour TTL)
2. Fall back to template-based archetype mapping
3. Generate simpler, rule-based badges
4. Never fail the user experience

---

## Project Structure

```
ceezaa-mvp/
├── mobile/                      # React Native Expo
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── welcome.tsx
│   │   │   ├── login.tsx
│   │   │   └── verify.tsx
│   │   ├── (onboarding)/
│   │   │   ├── intro.tsx
│   │   │   ├── connect-bank.tsx
│   │   │   └── notifications.tsx   # Push notification permission
│   │   ├── (main)/
│   │   │   ├── index.tsx           # Home dashboard
│   │   │   ├── processing.tsx      # AI analysis progress
│   │   │   ├── reveal.tsx          # Taste reveal
│   │   │   ├── truth-card.tsx      # View & share
│   │   │   └── profile.tsx
│   │   └── _layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── TasteRevealCard.tsx
│   │   ├── TruthCard.tsx
│   │   ├── InsightCard.tsx
│   │   ├── StreakBadge.tsx         # Streak display component
│   │   └── ProcessingAnimation.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── api.ts
│   │   ├── plaid.ts
│   │   └── notifications.ts        # Expo push notification setup
│   └── stores/
│       └── useStore.ts
│
├── backend/                     # Python FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── intelligence/           # TASTE INTELLIGENCE LAYER
│   │   │   ├── __init__.py
│   │   │   ├── processor.py        # Layer 1: Transaction Processor
│   │   │   ├── aggregator.py       # Layer 2: Aggregation Engine
│   │   │   ├── store.py            # Layer 3: Analysis Store
│   │   │   ├── interface.py        # Layer 4: TasteIntelligence API
│   │   │   └── models.py           # Pydantic models for TIL
│   │   ├── routers/
│   │   │   ├── plaid.py
│   │   │   ├── taste.py
│   │   │   ├── truth_card.py
│   │   │   └── insights.py
│   │   ├── services/
│   │   │   ├── plaid_service.py
│   │   │   ├── ai_service.py        # OpenAI integration
│   │   │   ├── notification_service.py  # Expo push notifications
│   │   │   └── card_generator.py
│   │   ├── jobs/
│   │   │   ├── weekly_refresh.py    # Weekly AI regeneration
│   │   │   └── daily_insights.py    # Daily insight generation
│   │   ├── prompts/
│   │   │   ├── taste_prompts.py
│   │   │   └── insight_prompts.py
│   │   └── utils/
│   │       └── categories.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── mock-data/                   # Frontend mock data
│   ├── taste-profile.json
│   ├── processing-sse.json
│   └── daily-insights.json
│
├── APP_LAYOUT.md
├── TECH_ARCH.md
└── README.md
```

---

## 4-Week Sprint Plan (Frontend-First)

### Week 1-2: Frontend Prototype
**Goal:** Complete UI with mock AI data

**Screens to Build:**
- [ ] Welcome + Auth flow (phone, username)
- [ ] Onboarding carousel
- [ ] Connect Bank (Plaid modal)
- [ ] Processing animation (progressive phases)
- [ ] Taste Reveal (swipeable cards with AI content)
- [ ] Truth Card view & share
- [ ] Home dashboard
- [ ] Profile/Settings

**Mock Data:**
- [ ] User profile
- [ ] Taste profile with AI-generated fields
- [ ] Daily insights

### Week 3: Backend + AI Integration
**Goal:** Real data pipeline

**Days 1-2:**
- [ ] Supabase setup (schema, RLS)
- [ ] Plaid integration (sandbox)
- [ ] Token exchange flow

**Days 3-4:**
- [ ] AI service implementation
- [ ] Prompt engineering & testing
- [ ] Response validation

**Days 5-7:**
- [ ] Content generator (rules + AI merge)
- [ ] SSE streaming endpoint
- [ ] API endpoints complete

### Week 4: Integration + Polish
**Goal:** Connected, polished app

**Days 1-2:**
- [ ] Connect frontend to backend
- [ ] Real Plaid flow testing

**Days 3-4:**
- [ ] End-to-end with AI
- [ ] Error handling
- [ ] Template fallbacks

**Days 5-7:**
- [ ] Loading/error states
- [ ] Share functionality
- [ ] TestFlight build

---

## Mock Data (For Prototype)

```typescript
// lib/mockData.ts

export const MOCK_USER = {
  id: "user_123",
  username: "samcodes",
  displayName: "Sam",
  avatarUrl: null,
};

export const MOCK_TASTE_PROFILE = {
  // Computed financial analysis (what AI receives)
  financialAnalysis: {
    categoryBreakdown: {
      coffee: { percentage: 43, transactionCount: 43, uniqueMerchants: 12 },
      dining: { percentage: 28, transactionCount: 67, uniqueMerchants: 23 },
      entertainment: { percentage: 18, transactionCount: 22, uniqueMerchants: 8 },
      shopping: { percentage: 11, transactionCount: 15, uniqueMerchants: 10 },
    },
    timeDistribution: { morning: 15, afternoon: 35, evening: 30, night: 20 },
    dayOfWeek: { weekday: 62, weekend: 38 },
    merchantLoyalty: [
      { name: "Blue Bottle Coffee", visits: 18, category: "coffee" },
      { name: "Philz Coffee", visits: 12, category: "coffee" },
      { name: "Ramen Tatsunoya", visits: 8, category: "dining" },
    ],
    streaks: { currentCoffeeStreak: 5, longestDiningStreak: 3 },
    explorationRatio: { dining: { unique: 23, total: 67, ratio: 0.34 } },
    period: { days: 365, totalTransactions: 847 },
  },

  // AI-generated content (what AI outputs)
  archetype: { name: "Urban Explorer", emoji: "🏙️" },
  traitBadges: [
    {
      name: "Coffee Connoisseur",
      emoji: "☕",
      description: "Blue Bottle knows your order by heart. 18 visits says it all.",
    },
    {
      name: "Culinary Cartographer",
      emoji: "🗺️",
      description: "23 different restaurants in a year. Your palate is a passport.",
    },
    {
      name: "Night Crawler",
      emoji: "🌙",
      description: "20% of your meals happen after dark. The city never sleeps.",
    },
  ],
  headlineInsight: "You've mapped 23 restaurants this year while running on Blue Bottle. Explorer with excellent taste.",
  rarityPercentile: 12,
  shareCaption: "Apparently I'm an Urban Explorer. What's your taste identity?",
};

export const MOCK_DAILY_INSIGHT = {
  type: "streak",
  emoji: "🔥",
  title: "You're on fire!",
  body: "5-day coffee streak! Blue Bottle is clearly your happy place.",
};

export const MOCK_PROCESSING_PHASES = [
  { phase: 1, message: "Reading your story...", delay: 3000 },
  { phase: 2, message: "Spotting patterns...", delay: 5000 },
  { phase: 3, message: "Crafting your identity...", delay: 5000 },
  { phase: 4, message: "Almost there...", delay: 2000 },
];
```

---

## Environment Variables

### Mobile (.env)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=
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

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Feature Flags
ENABLE_AI_GENERATION=true
AI_FALLBACK_TO_TEMPLATES=true
AI_CACHE_TTL_SECONDS=3600
```

---

## Plaid Setup

1. **Create Account:** https://dashboard.plaid.com/signup
2. **Get Sandbox Keys:** Developers → Keys → Copy client_id + sandbox secret
3. **Test Credentials:** Username: `user_good` / Password: `pass_good`
4. **Apply for Production:** Do this early (1-5 business days approval)
5. **Enable Products:** Transactions (required)

---

## OpenAI Setup

1. **Create Account:** https://platform.openai.com
2. **Get API Key:** Settings → API Keys → Create new secret key
3. **Set Usage Limits:** Set a spending cap to avoid surprises
4. **Model:** Use `gpt-4o-mini` for cost efficiency

### Cost Estimation
| Operation | Tokens | Cost |
|-----------|--------|------|
| Taste Profile | ~800 | ~$0.001 |
| Daily Insight | ~300 | ~$0.0004 |
| Per user/month | ~30 insights + 1 profile | ~$0.02 |

---

## Lottie Animations

| Moment | Animation |
|--------|-----------|
| Processing Phase 1 | Particles floating |
| Processing Phase 2 | Particles clustering |
| Processing Phase 3 | Identity forming |
| Taste Reveal | Confetti celebration |
| Truth Card Share | Card flying out |

Source: https://lottiefiles.com/free-animations

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Mobile | React Native (Expo) | Cross-platform, fast iteration |
| Auth | Supabase (Phone OTP + Social) | Simple, Gen Z friendly |
| Database | Supabase PostgreSQL | Managed, great DX |
| Processing | Python FastAPI | Best for AI/data work |
| AI Model | GPT-4o-mini | Cost + speed + quality balance |
| AI Scope | Content generation only | Plaid handles categorization |
| Hosting | Render | Free tier, easy deploy |
| Animations | Reanimated + Moti + Lottie | Duolingo-class feel |

---

## Push Notifications

### Notification Types

| Type | Trigger | Example |
|------|---------|---------|
| Daily Insight | Daily at user's preferred time | "☕ You're on a 5-day coffee streak! Keep it going." |
| Streak Milestone | Streak hits 3, 5, 7, 10, etc. | "🔥 7-day dining streak! You're unstoppable." |
| Streak at Risk | No activity in category for 24h | "☕ Don't break your coffee streak! Visit a cafe today." |
| Weekly Refresh | Truth Card updated | "✨ Your taste profile updated. See what changed!" |
| Archetype Change | Archetype changed | "🎭 Plot twist: You're now a Wellness Warrior!" |

### Implementation

```python
# services/notification_service.py

class NotificationService:
    def __init__(self):
        self.expo_push_url = "https://exp.host/--/api/v2/push/send"

    async def send_notification(self, user_id: str, title: str, body: str, data: dict = None):
        token = await self._get_push_token(user_id)
        if not token:
            return

        message = {
            "to": token,
            "title": title,
            "body": body,
            "data": data or {},
            "sound": "default"
        }

        async with httpx.AsyncClient() as client:
            await client.post(self.expo_push_url, json=message)

    async def send_daily_insight(self, user_id: str, insight: DailyInsight):
        await self.send_notification(
            user_id,
            insight.title,
            insight.body,
            {"type": "daily_insight", "insight_id": insight.id}
        )

    async def send_streak_milestone(self, user_id: str, category: str, days: int):
        emoji = CATEGORY_EMOJIS.get(category, "🔥")
        await self.send_notification(
            user_id,
            f"{emoji} {days}-day {category} streak!",
            f"You're on fire! Keep the momentum going.",
            {"type": "streak", "category": category, "days": days}
        )
```

### Daily Job (Cron)

```python
# jobs/daily_insights.py

async def generate_daily_insights():
    """Run daily to generate and send insights for all users."""

    users = await get_active_users()

    for user_id in users:
        # Get analysis from TIL
        context = taste_intelligence.get_daily_context(user_id)

        # Check for notable patterns
        if context.active_streaks:
            best_streak = max(context.active_streaks, key=lambda s: s.current)
            if best_streak.current in [3, 5, 7, 10, 14, 21, 30]:
                await notification_service.send_streak_milestone(
                    user_id, best_streak.category, best_streak.current
                )

        # Generate AI insight
        insight = await ai_service.generate_daily_insight(context)
        await save_daily_insight(user_id, insight)
        await notification_service.send_daily_insight(user_id, insight)
```

### API Endpoints

```
POST /api/notifications/register    # Register push token
DELETE /api/notifications/unregister
GET /api/notifications/preferences
PUT /api/notifications/preferences  # Enable/disable types
```

---

## Out of Scope (V1.1+)

- Lobbies / community
- Taste Search
- Black Book (favorites)
- Friend connections
- Plaid webhooks (auto-sync)
- Multiple card designs
- Web dashboard
- Taste Graph visualization

---

*Last updated: Dec 2024*
