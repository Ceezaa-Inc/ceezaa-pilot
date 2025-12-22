# Unified Venue Pipeline

## Overview

A single `venues` table powers both **Discover** (new recommendations) and **Vault** (visited places). Google Places API is the source of truth for all venue data.

```
┌─────────────────────────────────────────────────────────────────┐
│                        VENUES TABLE                              │
│                   (google_place_id = unique)                     │
└─────────────────────────────────────────────────────────────────┘
         ▲                                        ▲
         │                                        │
    ┌────┴────┐                              ┌────┴────┐
    │ DISCOVER │                              │  VAULT  │
    │ PIPELINE │                              │ PIPELINE│
    └────┬────┘                              └────┬────┘
         │                                        │
    User Location                           Plaid Transaction
    + Text Search                           + Find Place API
```

## Two Pipelines, One Table

### 1. Discover Pipeline (New User Experience)

**Trigger:** User signs up or opens Discover tab

**Flow:**
```
1. Get user's location (city from profile or device GPS)
2. Text Search: "best restaurants in {city}"
3. Text Search: "top coffee shops in {city}"
4. Text Search: "popular bars in {city}"
5. For each result:
   - Check if google_place_id exists in venues
   - If not: create venue with full details
   - Run AI tagging (energy, best_for, standout)
6. Return personalized feed using matching_engine
```

**Google API Calls:**
- `textSearch` - Find venues by category + location
- `placeDetails` - Enrich with photos, reviews, hours

**Cost Estimate:** ~$20-30 per new city seeded (100 venues × $0.02/call × 2 calls)

### 2. Vault Pipeline (Transaction Matching)

**Trigger:** Plaid sync imports new transactions

**Flow:**
```
1. Filter transactions: category in (dining, coffee, nightlife, fast_food)
2. For each food/drink transaction:
   a. Extract: merchant_name, lat, lng (from Plaid location)
   b. Call findPlaceFromText:
      - input: merchant_name
      - locationBias: point:{lat},{lng}
   c. If match found (place_id returned):
      - Check if google_place_id exists in venues
      - If not: call placeDetails, create venue, run AI tagging
      - Link place_visit.venue_id to venue
   d. If no match:
      - Create place_visit with venue_id = NULL
      - Store merchant_name for display
3. Vault shows all place_visits with venue enrichment where available
```

**Google API Calls:**
- `findPlaceFromText` - Match merchant to Google Place (~$0.017/call)
- `placeDetails` - Get full venue data (~$0.02/call, only for new venues)

**Cost Estimate:** ~$0.02-0.04 per new merchant matched

## Venue Schema (Enhanced)

```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT UNIQUE NOT NULL,

  -- Core Identity
  name TEXT NOT NULL,
  primary_type TEXT,                         -- restaurant, cafe, bar, etc.

  -- Location
  formatted_address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  city TEXT NOT NULL,

  -- Google Data
  google_rating DECIMAL(2, 1),
  google_review_count INT,
  google_price_level INT,                    -- 0-4
  google_maps_uri TEXT,                      -- Direct link
  opening_hours JSONB,

  -- Photos (store first 3 photo references)
  photo_references JSONB DEFAULT '[]',

  -- AI-Enriched Tags (from venue_tagger.py)
  taste_cluster TEXT NOT NULL,               -- coffee, dining, nightlife, bakery
  cuisine_type TEXT,                         -- japanese, mexican, etc.
  price_tier TEXT,                           -- $, $$, $$$, $$$$
  energy TEXT,                               -- chill, moderate, lively
  tagline TEXT,                              -- 1-line description
  best_for JSONB DEFAULT '[]',               -- [date_night, group_dinner, solo]
  standout JSONB DEFAULT '[]',               -- [craft_cocktails, outdoor_patio]

  -- Google Atmosphere (from API)
  good_for_groups BOOLEAN,
  outdoor_seating BOOLEAN,
  reservable BOOLEAN,
  delivery BOOLEAN,
  takeout BOOLEAN,
  dine_in BOOLEAN,

  -- AI Summaries (optional, from Google)
  editorial_summary TEXT,
  review_summary TEXT,

  -- Source tracking
  source TEXT DEFAULT 'discover',            -- 'discover' or 'transaction'

  -- Meta
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation Steps

### Phase 1: Google Places Service
Create `backend/app/services/google_places_service.py`:
- `find_place(merchant_name, lat, lng)` → Returns place_id or None
- `get_place_details(place_id)` → Returns full venue data
- `search_venues(query, location, radius)` → Returns list of places
- `create_or_update_venue(place_data)` → Upserts to venues table

### Phase 2: Vault Pipeline Enhancement
Update `backend/app/services/plaid_service.py`:
- Store lat/lng from Plaid transactions
- After creating place_visit, call `find_place()` to match
- If matched, create venue and link `place_visit.venue_id`

### Phase 3: Discover Pipeline
Create `backend/app/services/discover_service.py`:
- `seed_city(city_name)` → Populate venues for a new city
- `get_discover_feed(user_id)` → Personalized venue recommendations
- Run AI tagging on new venues (existing venue_tagger.py)

### Phase 4: Mobile Integration
- Discover tab: Fetch from `/api/discover` endpoint
- Vault tab: place_visits now have venue enrichment
- Session creation: Pick from Discover venues OR Vault places

## API Endpoints

```
GET  /api/discover?user_id={id}           # Personalized feed
POST /api/discover/seed                    # Seed venues for user's city
GET  /api/venues/{venue_id}                # Full venue details
POST /api/venues/match                     # Match merchant to venue
```

## Cost Analysis

| Action | API Calls | Cost/Call | Monthly (1000 users) |
|--------|-----------|-----------|---------------------|
| Seed new city | 100 Text + 100 Details | $0.04 | $40/city |
| Match transaction | 1 Find + 0.3 Details | $0.023 | $230 (10 txns/user) |
| Total estimated | - | - | ~$300/month |

## Benefits

1. **Rich Venue Profiles** - Same data quality for discovered and visited places
2. **Seamless Experience** - Vault places can be recommended in Discover
3. **Deduplication** - google_place_id ensures no duplicate venues
4. **AI Enhancement** - One tagging pipeline for all venues
5. **Session Integration** - All venues (discover or vault) work in sessions

## Sources

- [Google Places API Data Fields](https://developers.google.com/maps/documentation/places/web-service/data-fields)
- [Place Details API](https://developers.google.com/maps/documentation/places/web-service/place-details)
