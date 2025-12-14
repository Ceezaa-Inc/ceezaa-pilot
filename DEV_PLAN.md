# Ceezaa MVP - Development Plan

> **Timeline:** 10 weeks
> **Approach:** Frontend-first with mock data, then backend, then integration
> **Testing:** TDD throughout - tests before implementation
> **Tracking:** Each task maps to a Linear issue

---

## Overview

```
Week 1      Week 2      Week 3-4       Week 5-6       Week 7-8       Week 9       Week 10
┌──────┐   ┌──────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────┐   ┌──────────┐
│Found-│   │Onbrd │   │ Core UI  │   │ Backend  │   │Integration│  │Polish│   │  Launch  │
│ation │──▶│  UI  │──▶│  (Tabs)  │──▶│  Core    │──▶│           │──▶│      │──▶│   Prep   │
└──────┘   └──────┘   └──────────┘   └──────────┘   └──────────┘   └──────┘   └──────────┘
   │           │            │              │              │            │            │
   │           │            │              │              │            │            │
 Expo       6 screens    Pulse         Auth          Connect       E2E         App Store
 Jest       with mocks   Discover      Plaid         frontend      Animations  TestFlight
 Nav                     Vault         TIL           to APIs       Error       Production
 UI Kit                  Profile       Sessions                    states      credentials
```

---

## Task Legend

| Field | Values |
|-------|--------|
| **Priority** | `P0` (blocker), `P1` (must-have), `P2` (should-have) |
| **Size** | `XS` (<2h), `S` (2-4h), `M` (4-8h), `L` (1-2d), `XL` (2-3d) |
| **Label** | `frontend`, `backend`, `test`, `integration`, `infra`, `design` |

---

## Phase 1: Foundation (Week 1)

**Goal:** Project setup, testing infrastructure, UI primitives, navigation shell

### Infra & Setup

| ID | Task | Label | Priority | Size | Depends | Status |
|----|------|-------|----------|------|---------|--------|
| F1-01 | Initialize Expo project with TypeScript strict mode | `infra` | P0 | S | - | ✅ |
| F1-02 | Configure ESLint + Prettier | `infra` | P1 | XS | F1-01 | ✅ |
| F1-03 | Set up Jest + React Native Testing Library | `test` | P0 | S | F1-01 | ✅ |
| F1-04 | Configure NativeWind (Tailwind for RN) | `infra` | P0 | S | F1-01 | ✅ |
| F1-05 | Set up Expo Router file-based navigation | `frontend` | P0 | M | F1-01 | ✅ |
| F1-06 | Configure Zustand store boilerplate | `frontend` | P1 | S | F1-01 | ✅ |
| F1-07 | Set up react-native-reanimated + moti | `frontend` | P1 | S | F1-01 | ✅ |
| F1-08 | Create mock data layer structure | `frontend` | P0 | M | F1-01 | ✅ |
| F1-09 | Set up CI pipeline (lint + test on PR) | `infra` | P1 | M | F1-03 | |

### Design System (see DESIGN_SYSTEM.md)

| ID | Task | Label | Priority | Size | Depends | Status |
|----|------|-------|----------|------|---------|--------|
| F1-09a | Create design tokens (colors, typography, spacing, shadows, animations) | `design` | P0 | S | F1-04 | ✅ |
| F1-09b | Configure NativeWind theme with design tokens | `design` | P0 | S | F1-09a | ✅ |
| F1-09c | Set up Manrope font (all weights) | `design` | P0 | S | F1-01 | ✅ |

### UI Primitives (Dark-First + Brand Accents)

> **Design Language:** Black-first (#0A0A0A bg) with gold (#D3B481) + navy (#0A1A2F) as accents. Like Spotify/Booking.com.
> Light "Trust Mode" ONLY for card linking. See DESIGN_SYSTEM.md for full specs.

| ID | Task | Label | Priority | Size | Depends | Status |
|----|------|-------|----------|------|---------|--------|
| F1-10 | Create Button component (pill-shaped primary, secondary with border, ghost) | `frontend` | P0 | M | F1-09b | ✅ |
| F1-11 | Write Button component tests | `test` | P0 | S | F1-10 | ✅ |
| F1-12 | Create Input component (dark surface bg #1A1A1A, gold focus border) | `frontend` | P0 | M | F1-09b | ✅ |
| F1-13 | Write Input component tests | `test` | P0 | S | F1-12 | ✅ |
| F1-14 | Create Card component (dark surface #141414, info/venue/trust variants) | `frontend` | P0 | S | F1-09b | ✅ |
| F1-15 | Write Card component tests | `test` | P0 | XS | F1-14 | ✅ |
| F1-16 | Create Modal/BottomSheet component (dark bg, rounded-t-2xl) | `frontend` | P1 | M | F1-09b | ✅ |
| F1-17 | Write Modal component tests | `test` | P1 | S | F1-16 | ✅ |
| F1-18 | Create Typography components (Manrope all weights) | `frontend` | P1 | S | F1-09c | ✅ |
| F1-19 | Create Icon component with expo-icons | `frontend` | P1 | S | F1-09b | |
| F1-20 | Create LoadingSpinner component (gold accent) | `frontend` | P1 | XS | F1-09b | ✅ |
| F1-20a | Create MoodTile component (gradient backgrounds for Discover) | `frontend` | P0 | M | F1-09b | ✅ |
| F1-20b | Create OTPInput component (6-digit dark boxes) | `frontend` | P0 | M | F1-12 | ✅ |

### Navigation Shell

| ID | Task | Label | Priority | Size | Depends | Status |
|----|------|-------|----------|------|---------|--------|
| F1-21 | Create tab bar layout (4 tabs: Pulse, Discover, Vault, Profile) | `frontend` | P0 | M | F1-05 | ✅ |
| F1-22 | Create auth stack (welcome, login, verify) | `frontend` | P0 | S | F1-05 | ✅ |
| F1-23 | Create onboarding stack (quiz, initial-taste, card-link, reveal) | `frontend` | P0 | S | F1-05 | ✅ |
| F1-24 | Implement navigation guard (auth state check) | `frontend` | P1 | M | F1-22, F1-06 | |

**Phase 1 Deliverable:** App runs, has navigation shell, passes lint/test CI ✅

---

## Phase 2: Onboarding UI (Week 2)

**Goal:** Complete onboarding flow with mock data - user can tap through entire flow

### Auth Screens

| ID | Task | Label | Priority | Size | Depends | Status |
|----|------|-------|----------|------|---------|--------|
| F2-01 | Build Welcome/Splash screen with branding | `frontend` | P0 | M | F1-22 | ✅ |
| F2-02 | Build Login screen (phone input + social buttons) | `frontend` | P0 | M | F1-12 | ✅ |
| F2-03 | Build OTP Verification screen | `frontend` | P0 | M | F1-12 | ✅ |
| F2-04 | Write auth screen tests | `test` | P0 | M | F2-01, F2-02, F2-03 | |
| F2-05 | Create mock auth service | `frontend` | P0 | S | F1-08 | |

### Quiz Screens

| ID | Task | Label | Priority | Size | Depends | Status |
|----|------|-------|----------|------|---------|--------|
| F2-06 | Design quiz question data structure | `frontend` | P0 | S | - | ✅ |
| F2-07 | Build Quiz screen with swipeable questions | `frontend` | P0 | L | F1-07 | ✅ |
| F2-08 | Add progress bar to quiz | `frontend` | P1 | S | F2-07 | ✅ |
| F2-09 | Create quiz answer animations | `frontend` | P2 | M | F2-07 | 🔄 |
| F2-10 | Write quiz screen tests | `test` | P0 | M | F2-07 | |
| F2-11 | Create mock quiz response storage | `frontend` | P0 | S | F1-06 | |

### Initial Taste Card

| ID | Task | Label | Priority | Size | Depends | Status |
|----|------|-------|----------|------|---------|--------|
| F2-12 | Build Initial Taste Card screen | `frontend` | P0 | M | F1-14 | ✅ |
| F2-13 | Create taste card component (shareable design) | `frontend` | P0 | L | F2-12 | ✅ |
| F2-14 | Add card reveal animation | `frontend` | P1 | M | F2-13 | ✅ |
| F2-15 | Write Initial Taste Card tests | `test` | P0 | S | F2-12 | |

### Card Linking

| ID | Task | Label | Priority | Size | Depends | Status |
|----|------|-------|----------|------|---------|--------|
| F2-16 | Build Card Link screen (value prop + CTA) | `frontend` | P0 | M | F1-14 | ✅ |
| F2-17 | Add Plaid Link placeholder (mock modal) | `frontend` | P0 | S | F2-16 | ✅ |
| F2-18 | Build processing state (analyzing transactions) | `frontend` | P0 | M | F2-17 | ✅ |
| F2-19 | Write Card Link screen tests | `test` | P0 | S | F2-16 | |

### Enhanced Reveal

| ID | Task | Label | Priority | Size | Depends | Status |
|----|------|-------|----------|------|---------|--------|
| F2-20 | Build Enhanced Reveal screen | `frontend` | P0 | M | F1-14 | ✅ |
| F2-21 | Create Taste Ring preview component | `frontend` | P0 | L | F2-20 | ✅ |
| F2-22 | Add confetti/celebration animation | `frontend` | P1 | M | F2-20 | |
| F2-23 | Write Enhanced Reveal tests | `test` | P0 | S | F2-20 | |

### Onboarding Flow

| ID | Task | Label | Priority | Size | Depends | Status |
|----|------|-------|----------|------|---------|--------|
| F2-24 | Wire complete onboarding flow end-to-end | `frontend` | P0 | M | F2-01 to F2-23 | ✅ |
| F2-25 | Create onboarding state store | `frontend` | P0 | S | F1-06 | |
| F2-26 | Write onboarding flow integration test | `test` | P0 | M | F2-24 | |

**Phase 2 Deliverable:** User can complete full onboarding with mock data ✅

> **Additional work completed:** Updated onboarding taste cards (initial-taste.tsx, enhanced-reveal.tsx) to use redesigned TasteRing component with `diningStyle` instead of numeric score.

---

## Phase 3: Core Tabs UI (Week 3-4)

**Goal:** All 4 tabs functional with mock data

### Pulse Tab

| ID | Task | Label | Priority | Size | Depends | Status |
|----|------|-------|----------|------|---------|--------|
| F3-01 | Build Pulse home screen layout | `frontend` | P0 | M | F1-21 | ✅ |
| F3-02 | Create Taste Ring component (animated donut chart) | `frontend` | P0 | XL | F3-01 | ✅ |
| F3-03 | Write Taste Ring tests | `test` | P0 | M | F3-02 | |
| F3-04 | Create Insight Card component | `frontend` | P0 | M | F3-01 | ✅ |
| F3-05 | Write Insight Card tests | `test` | P0 | S | F3-04 | |
| F3-06 | ~~Create Quick Actions component~~ | `frontend` | P1 | M | F3-01 | REMOVED (PRD: replaced with Playlists) |
| F3-07 | Build Taste Detail screen (tappable from ring) | `frontend` | P1 | M | F3-02 | ✅ |
| F3-08 | Create mock taste profile data | `frontend` | P0 | S | F1-08 | ✅ |
| F3-09 | Write Pulse screen tests | `test` | P0 | M | F3-01 | |

### Discover Tab

| ID | Task | Label | Priority | Size | Depends | Status |
|----|------|-------|----------|------|---------|--------|
| F3-10 | Build Discover home screen (Mood Grid) | `frontend` | P0 | M | F1-21 | ✅ |
| F3-11 | Create MoodGrid component (6 mood tiles) | `frontend` | P0 | L | F3-10 | ✅ |
| F3-12 | Write MoodGrid tests | `test` | P0 | S | F3-11 | |
| F3-13 | Create VenueCard component | `frontend` | P0 | M | F3-10 | ✅ |
| F3-14 | Write VenueCard tests | `test` | P0 | S | F3-13 | |
| F3-15 | Build Filtered Feed screen | `frontend` | P0 | L | F3-11 | ✅ |
| F3-16 | Create FilterBar component | `frontend` | P0 | M | F3-15 | ✅ |
| F3-17 | Write FilterBar tests | `test` | P0 | S | F3-16 | |
| F3-18 | Build Venue Detail screen | `frontend` | P0 | L | F3-13 | ✅ |
| F3-19 | Write Venue Detail tests | `test` | P0 | M | F3-18 | |
| F3-20 | Create mock venue data (20+ venues) | `frontend` | P0 | M | F1-08 | ✅ |

### Group Sessions

| ID | Task | Label | Priority | Size | Depends | Status |
|----|------|-------|----------|------|---------|--------|
| F3-21 | Build Create Session screen | `frontend` | P0 | M | F3-10 | ✅ |
| F3-22 | Build Voting screen | `frontend` | P0 | L | F3-21 | ✅ |
| F3-23 | Create VotingCard component | `frontend` | P0 | M | F3-22 | ✅ |
| F3-24 | Write VotingCard tests | `test` | P0 | S | F3-23 | |
| F3-25 | Create ParticipantList component | `frontend` | P1 | S | F3-22 | ✅ |
| F3-26 | Build Confirmed Plan screen | `frontend` | P0 | M | F3-22 | ✅ |
| F3-27 | Write session flow tests | `test` | P0 | M | F3-21 to F3-26 | |
| F3-28 | Create mock session data | `frontend` | P0 | S | F1-08 | ✅ |
| F3-29a | Create VenuePickerModal component | `frontend` | P0 | M | F3-21 | ✅ |
| F3-29b | Create JoinSessionModal component | `frontend` | P0 | M | F3-21 | ✅ |
| F3-29c | Create SessionCard component | `frontend` | P0 | S | F3-21 | ✅ |
| F3-29d | Add "My Sessions" to Discover | `frontend` | P0 | S | F3-29c | ✅ |

### Vault Tab

| ID | Task | Label | Priority | Size | Depends | Status |
|----|------|-------|----------|------|---------|--------|
| F3-29 | Build Vault main screen | `frontend` | P0 | M | F1-21 | ✅ |
| F3-30 | Create PlaceCard component (with visit history) | `frontend` | P0 | M | F3-29 | ✅ |
| F3-31 | Write PlaceCard tests | `test` | P0 | S | F3-30 | |
| F3-32 | Create ReactionPicker component | `frontend` | P0 | M | F3-29 | ✅ |
| F3-33 | Write ReactionPicker tests | `test` | P0 | S | F3-32 | |
| F3-34 | Build Place Detail screen | `frontend` | P0 | L | F3-30 | |
| F3-35 | Write Place Detail tests | `test` | P0 | M | F3-34 | |
| F3-36 | Create mock vault/visit data | `frontend` | P0 | S | F1-08 | ✅ |

### Profile Tab

| ID | Task | Label | Priority | Size | Depends | Status |
|----|------|-------|----------|------|---------|--------|
| F3-37 | Build Profile home screen | `frontend` | P0 | M | F1-21 | ✅ |
| F3-38 | Build Linked Cards screen | `frontend` | P0 | M | F3-37 | |
| F3-39 | Build Notifications Settings screen | `frontend` | P1 | M | F3-37 | |
| F3-40 | Build Privacy screen | `frontend` | P1 | M | F3-37 | |
| F3-41 | Write Profile screen tests | `test` | P0 | M | F3-37 to F3-40 | |

**Phase 3 Deliverable:** Complete app UI with mock data - full clickable prototype 🔄

> **Progress Notes:**
> - Pulse Tab: ✅ Complete (TasteRing with SVG segments + moti animation, horizontal scrolling Insights/Playlists, Saved Plans section)
> - Discover Tab: ✅ Complete (MoodTile + VenueCard components, nested routes, FilterBar with mood chips, Venue Detail with day-by-day hours)
> - Group Sessions: ✅ **CHECKPOINT 4 COMPLETE** (Create Session → Voting → Confirmed screens, VotingCard + ParticipantList + VenuePickerModal + JoinSessionModal + SessionCard components, venue selection during creation, propose/remove during voting, "My Sessions" list on Discover)
> - 52 Zustand store tests written and passing (useTasteStore, useVenueStore, useVaultStore, useSessionStore)
> - TasteRing shows `diningStyle` ("Experience Seeker") instead of numeric score per PRD
> - Added `playlists.ts` and `plans.ts` mock data
> - Added DEV skip button on welcome screen for faster testing
> - Store actions added: `addVenueToSession()`, `removeVenueFromSession()`, `getUserSessions()`

---

## Phase 4: Backend Foundation (Week 4-5)

**Goal:** Auth working, Plaid integrated, basic API structure

### Project Setup

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| B4-01 | Initialize FastAPI project with pytest | `backend` | P0 | S | - |
| B4-02 | Set up Supabase project | `infra` | P0 | S | - |
| B4-03 | Create initial database schema (migrations) | `backend` | P0 | L | B4-02 |
| B4-04 | Configure environment variables | `infra` | P0 | XS | B4-01 |
| B4-05 | Set up backend CI (lint + test) | `infra` | P1 | M | B4-01 |
| B4-06 | Create health check endpoint | `backend` | P0 | XS | B4-01 |

### Auth

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| B4-07 | Configure Supabase Auth (Phone OTP) | `backend` | P0 | M | B4-02 |
| B4-08 | Configure Supabase Auth (Apple/Google OAuth) | `backend` | P0 | M | B4-02 |
| B4-09 | Create `/api/auth/signup` endpoint | `backend` | P0 | S | B4-07 |
| B4-10 | Create `/api/auth/verify-otp` endpoint | `backend` | P0 | S | B4-07 |
| B4-11 | Create `/api/auth/social/{provider}` endpoint | `backend` | P0 | S | B4-08 |
| B4-12 | Write auth endpoint tests | `test` | P0 | M | B4-09 to B4-11 |

### Onboarding

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| B4-13 | Create onboarding_state table | `backend` | P0 | S | B4-03 |
| B4-14 | Create `/api/onboarding/state` GET endpoint | `backend` | P0 | S | B4-13 |
| B4-15 | Create `/api/onboarding/state` PATCH endpoint | `backend` | P0 | S | B4-13 |
| B4-16 | Create `/api/onboarding/quiz` POST endpoint | `backend` | P0 | M | B4-13 |
| B4-17 | Create `/api/onboarding/initial-taste` GET endpoint | `backend` | P0 | M | B4-16 |
| B4-18 | Create quiz-to-taste-profile algorithm | `backend` | P0 | L | B4-16 |
| B4-19 | Write onboarding endpoint tests | `test` | P0 | M | B4-14 to B4-18 |

### Plaid Integration

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| B4-20 | Set up Plaid sandbox account | `infra` | P0 | S | - |
| B4-21 | Create `/api/plaid/create-link-token` endpoint | `backend` | P0 | M | B4-20 |
| B4-22 | Create `/api/plaid/exchange-token` endpoint | `backend` | P0 | M | B4-20 |
| B4-23 | Create linked_accounts table | `backend` | P0 | S | B4-03 |
| B4-24 | Create transactions table | `backend` | P0 | S | B4-03 |
| B4-25 | Implement initial transaction fetch | `backend` | P0 | L | B4-22, B4-24 |
| B4-26 | Create `/api/plaid/sync` endpoint | `backend` | P1 | M | B4-25 |
| B4-27 | Write Plaid integration tests | `test` | P0 | M | B4-21 to B4-26 |

**Phase 4 Deliverable:** Auth flow works end-to-end, Plaid linking works in sandbox

---

## Phase 5: Taste Intelligence Layer (Week 5-6)

**Goal:** Transaction + Quiz data → Unified taste profile

### Quiz Processor

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| B5-01 | Create QuizProcessor class | `backend` | P0 | M | B4-18 |
| B5-02 | Implement vibe preference extraction | `backend` | P0 | S | B5-01 |
| B5-03 | Implement cuisine preference extraction | `backend` | P0 | S | B5-01 |
| B5-04 | Implement exploration style extraction | `backend` | P0 | S | B5-01 |
| B5-05 | Create declared_taste table | `backend` | P0 | S | B4-03 |
| B5-06 | Write QuizProcessor tests | `test` | P0 | M | B5-01 to B5-04 |

### Transaction Processor

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| B5-07 | Create TransactionProcessor class | `backend` | P0 | M | B4-25 |
| B5-08 | Implement Plaid category mapping | `backend` | P0 | M | B5-07 |
| B5-09 | Implement time bucket extraction | `backend` | P0 | S | B5-07 |
| B5-10 | Implement day type extraction | `backend` | P0 | S | B5-07 |
| B5-11 | Write TransactionProcessor tests | `test` | P0 | M | B5-07 to B5-10 |

### Aggregation Engine

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| B5-12 | Create AggregationEngine class | `backend` | P0 | L | B5-07 |
| B5-13 | Implement category breakdown (O(1)) | `backend` | P0 | M | B5-12 |
| B5-14 | Implement time pattern tracking (O(1)) | `backend` | P0 | M | B5-12 |
| B5-15 | Implement merchant loyalty tracking (O(1)) | `backend` | P0 | M | B5-12 |
| B5-16 | Implement streak tracking (O(1)) | `backend` | P0 | M | B5-12 |
| B5-17 | Implement exploration ratio (O(1)) | `backend` | P0 | M | B5-12 |
| B5-18 | Create user_analysis table | `backend` | P0 | S | B4-03 |
| B5-19 | Write AggregationEngine tests | `test` | P0 | L | B5-12 to B5-17 |

### Taste Fusion

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| B5-20 | Create TasteFusion class | `backend` | P0 | L | B5-01, B5-12 |
| B5-21 | Implement weighted fusion (quiz + transactions) | `backend` | P0 | M | B5-20 |
| B5-22 | Implement mismatch detection | `backend` | P1 | M | B5-20 |
| B5-23 | Create fused_taste table | `backend` | P0 | S | B4-03 |
| B5-24 | Write TasteFusion tests | `test` | P0 | M | B5-20 to B5-22 |

### Taste Interface

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| B5-25 | Create TasteInterface class | `backend` | P0 | M | B5-20 |
| B5-26 | Create `/api/taste/profile` endpoint | `backend` | P0 | S | B5-25 |
| B5-27 | Create `/api/taste/ring` endpoint | `backend` | P0 | S | B5-25 |
| B5-28 | Create `/api/taste/insights` endpoint | `backend` | P1 | M | B5-25 |
| B5-29 | Write TasteInterface tests | `test` | P0 | M | B5-25 to B5-28 |

**Phase 5 Deliverable:** TIL processes real data, taste profile API works

---

## Phase 6: Backend Features (Week 6-7)

**Goal:** Sessions, Vault, Venue catalog fully functional

### Venue Catalog

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| B6-01 | Create venues table | `backend` | P0 | S | B4-03 |
| B6-02 | Set up Google Places API integration | `backend` | P0 | M | - |
| B6-03 | Create venue import script | `backend` | P0 | L | B6-01, B6-02 |
| B6-04 | Create GPT tagging service | `backend` | P0 | L | B6-01 |
| B6-05 | Import CEO's curated venue list (150-200) | `backend` | P0 | M | B6-03, B6-04 |
| B6-06 | Create MatchingEngine class | `backend` | P0 | L | B5-25 |
| B6-07 | Implement taste-based venue ranking | `backend` | P0 | M | B6-06 |
| B6-08 | Create `/api/discover/feed` endpoint | `backend` | P0 | M | B6-06 |
| B6-09 | Create `/api/venues/{id}` endpoint | `backend` | P0 | S | B6-01 |
| B6-10 | Write venue/discover tests | `test` | P0 | M | B6-01 to B6-09 |

### Sessions (Group Planning)

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| B6-11 | Create sessions table | `backend` | P0 | S | B4-03 |
| B6-12 | Create session_participants table | `backend` | P0 | S | B4-03 |
| B6-13 | Create session_venues table | `backend` | P0 | S | B4-03 |
| B6-14 | Create session_votes table | `backend` | P0 | S | B4-03 |
| B6-15 | Create `/api/sessions` POST endpoint | `backend` | P0 | M | B6-11 |
| B6-16 | Create `/api/sessions/{id}` GET endpoint | `backend` | P0 | S | B6-11 |
| B6-17 | Create `/api/sessions/{code}/join` endpoint | `backend` | P0 | M | B6-11 |
| B6-18 | Create `/api/sessions/{id}/venues` endpoints | `backend` | P0 | M | B6-13 |
| B6-19 | Create `/api/sessions/{id}/vote` endpoint | `backend` | P0 | M | B6-14 |
| B6-20 | Create `/api/sessions/{id}/close` endpoint | `backend` | P0 | M | B6-11 |
| B6-21 | Set up Supabase Realtime for sessions | `backend` | P0 | L | B6-11 |
| B6-22 | Write session endpoint tests | `test` | P0 | L | B6-15 to B6-21 |

### Vault

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| B6-23 | Create place_visits table | `backend` | P0 | S | B4-03 |
| B6-24 | Implement auto-create visits from transactions | `backend` | P0 | M | B6-23, B4-25 |
| B6-25 | Create `/api/vault/visits` GET endpoint | `backend` | P0 | M | B6-23 |
| B6-26 | Create `/api/vault/visits` POST endpoint (manual add) | `backend` | P0 | S | B6-23 |
| B6-27 | Create `/api/vault/visits/{id}` PATCH endpoint | `backend` | P0 | S | B6-23 |
| B6-28 | Create `/api/vault/places/{venue_id}` endpoint | `backend` | P1 | M | B6-23 |
| B6-29 | Write vault endpoint tests | `test` | P0 | M | B6-23 to B6-28 |

### Bookmarks & Profile

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| B6-30 | Create bookmarks table | `backend` | P0 | S | B4-03 |
| B6-31 | Create `/api/bookmarks` endpoints | `backend` | P0 | S | B6-30 |
| B6-32 | Create `/api/profile` endpoints | `backend` | P0 | S | B4-03 |
| B6-33 | Create notification_preferences table | `backend` | P1 | S | B4-03 |
| B6-34 | Create `/api/notifications/preferences` endpoints | `backend` | P1 | S | B6-33 |
| B6-35 | Write profile/bookmark tests | `test` | P0 | S | B6-30 to B6-34 |

**Phase 6 Deliverable:** All backend APIs functional, Realtime working

---

## Phase 7: Integration (Week 7-8)

**Goal:** Connect frontend to real backend APIs

### Auth Integration

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| I7-01 | Set up Supabase client in mobile app | `integration` | P0 | S | B4-07 |
| I7-02 | Connect auth screens to real Supabase Auth | `integration` | P0 | M | I7-01 |
| I7-03 | Implement auth state persistence | `integration` | P0 | S | I7-02 |
| I7-04 | Write auth integration tests | `test` | P0 | M | I7-02 |

### Onboarding Integration

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| I7-05 | Connect quiz to `/api/onboarding/quiz` | `integration` | P0 | M | B4-16 |
| I7-06 | Connect Initial Taste Card to `/api/onboarding/initial-taste` | `integration` | P0 | M | B4-17 |
| I7-07 | Integrate react-native-plaid-link-sdk | `integration` | P0 | L | B4-21 |
| I7-08 | Connect Card Link flow to Plaid endpoints | `integration` | P0 | M | I7-07 |
| I7-09 | Connect Enhanced Reveal to `/api/taste/profile` | `integration` | P0 | M | B5-26 |
| I7-10 | Write onboarding integration tests | `test` | P0 | M | I7-05 to I7-09 |

### Pulse Integration

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| I7-11 | Connect Taste Ring to `/api/taste/ring` | `integration` | P0 | M | B5-27 |
| I7-12 | Connect Insight Card to `/api/taste/insights` | `integration` | P0 | M | B5-28 |
| I7-13 | Write Pulse integration tests | `test` | P0 | S | I7-11, I7-12 |

### Discover Integration

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| I7-14 | Connect Mood Grid to `/api/discover/feed` | `integration` | P0 | M | B6-08 |
| I7-15 | Connect Venue Detail to `/api/venues/{id}` | `integration` | P0 | M | B6-09 |
| I7-16 | Connect bookmark button to `/api/bookmarks` | `integration` | P0 | S | B6-31 |
| I7-17 | Write Discover integration tests | `test` | P0 | M | I7-14 to I7-16 |

### Sessions Integration

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| I7-18 | Connect Create Session to `/api/sessions` | `integration` | P0 | M | B6-15 |
| I7-19 | Integrate Supabase Realtime for voting | `integration` | P0 | L | B6-21 |
| I7-20 | Connect voting UI to session endpoints | `integration` | P0 | M | I7-19 |
| I7-21 | Implement invite link deep linking | `integration` | P1 | M | B6-17 |
| I7-22 | Write session integration tests | `test` | P0 | M | I7-18 to I7-21 |

### Vault Integration

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| I7-23 | Connect Vault main to `/api/vault/visits` | `integration` | P0 | M | B6-25 |
| I7-24 | Connect reaction picker to PATCH endpoint | `integration` | P0 | S | B6-27 |
| I7-25 | Connect manual add to POST endpoint | `integration` | P0 | S | B6-26 |
| I7-26 | Write Vault integration tests | `test` | P0 | M | I7-23 to I7-25 |

### Profile Integration

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| I7-27 | Connect Profile to `/api/profile` | `integration` | P0 | S | B6-32 |
| I7-28 | Connect Linked Cards to Plaid accounts | `integration` | P0 | M | B4-22 |
| I7-29 | Connect Notification settings | `integration` | P1 | S | B6-34 |
| I7-30 | Write Profile integration tests | `test` | P0 | S | I7-27 to I7-29 |

**Phase 7 Deliverable:** Frontend talks to real backend, all flows work E2E

---

## Phase 8: Polish + Testing (Week 9)

**Goal:** E2E tests pass, animations polished, error states handled

### End-to-End Testing

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| P8-01 | Write E2E test: New user onboarding flow | `test` | P0 | L | I7-10 |
| P8-02 | Write E2E test: Returning user Pulse view | `test` | P0 | M | I7-13 |
| P8-03 | Write E2E test: Discover and bookmark flow | `test` | P0 | M | I7-17 |
| P8-04 | Write E2E test: Create and complete session | `test` | P0 | L | I7-22 |
| P8-05 | Write E2E test: Vault interaction flow | `test` | P0 | M | I7-26 |

### Error States

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| P8-06 | Implement network error handling | `frontend` | P0 | M | - |
| P8-07 | Create error boundary component | `frontend` | P0 | S | - |
| P8-08 | Add retry logic for failed requests | `frontend` | P1 | M | P8-06 |
| P8-09 | Implement offline state detection | `frontend` | P1 | M | - |
| P8-10 | Add empty state components | `frontend` | P1 | M | - |

### Animation Polish

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| P8-11 | Polish Taste Ring animations | `frontend` | P1 | M | F3-02 |
| P8-12 | Polish card transitions | `frontend` | P1 | M | - |
| P8-13 | Add haptic feedback | `frontend` | P2 | S | - |
| P8-14 | Polish loading states | `frontend` | P1 | M | - |

### Performance

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| P8-15 | Profile and optimize list rendering | `frontend` | P1 | M | - |
| P8-16 | Implement image caching | `frontend` | P1 | M | - |
| P8-17 | Optimize API call batching | `frontend` | P2 | M | - |

**Phase 8 Deliverable:** App is polished, all E2E tests pass

---

## Phase 9: Launch Prep (Week 10)

**Goal:** Production ready, app store submission

### Production Setup

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| L9-01 | Obtain Plaid production credentials | `infra` | P0 | S | - |
| L9-02 | Set up Google Places production API key | `infra` | P0 | S | - |
| L9-03 | Configure production environment variables | `infra` | P0 | S | - |
| L9-04 | Set up production Supabase project | `infra` | P0 | M | - |
| L9-05 | Deploy backend to production (Render/Railway) | `infra` | P0 | M | L9-03 |
| L9-06 | Run production migration scripts | `backend` | P0 | S | L9-04 |

### App Store Prep

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| L9-07 | Create App Store Connect account | `infra` | P0 | S | - |
| L9-08 | Create Google Play Console account | `infra` | P0 | S | - |
| L9-09 | Generate iOS certificates and provisioning | `infra` | P0 | M | L9-07 |
| L9-10 | Generate Android keystore | `infra` | P0 | S | L9-08 |
| L9-11 | Prepare app store screenshots | `design` | P0 | M | - |
| L9-12 | Write app store description/metadata | `design` | P0 | S | - |
| L9-13 | Create privacy policy page | `infra` | P0 | S | - |

### Testing & Release

| ID | Task | Label | Priority | Size | Depends |
|----|------|-------|----------|------|---------|
| L9-14 | Build and deploy to TestFlight | `infra` | P0 | M | L9-09 |
| L9-15 | Build and deploy to Internal Testing (Android) | `infra` | P0 | M | L9-10 |
| L9-16 | Conduct internal testing round | `test` | P0 | L | L9-14, L9-15 |
| L9-17 | Fix critical bugs from testing | `frontend` | P0 | L | L9-16 |
| L9-18 | Submit to App Store review | `infra` | P0 | S | L9-17 |
| L9-19 | Submit to Google Play review | `infra` | P0 | S | L9-17 |

**Phase 9 Deliverable:** App submitted to stores, awaiting review

---

## Summary Stats

| Phase | Tasks | Priority Breakdown |
|-------|-------|-------------------|
| Phase 1: Foundation | 26 | P0: 17, P1: 8, P2: 1 |
| Phase 2: Onboarding UI | 26 | P0: 22, P1: 3, P2: 1 |
| Phase 3: Core Tabs UI | 41 | P0: 35, P1: 5, P2: 1 |
| Phase 4: Backend Foundation | 27 | P0: 24, P1: 3, P2: 0 |
| Phase 5: TIL | 29 | P0: 26, P1: 3, P2: 0 |
| Phase 6: Backend Features | 35 | P0: 31, P1: 4, P2: 0 |
| Phase 7: Integration | 30 | P0: 27, P1: 3, P2: 0 |
| Phase 8: Polish | 17 | P0: 8, P1: 7, P2: 2 |
| Phase 9: Launch | 19 | P0: 19, P1: 0, P2: 0 |
| **Total** | **250** | **P0: 209, P1: 36, P2: 5** |

---

## Linear Import Guide

### Setting Up Linear

1. **Create Project**: "Ceezaa MVP"
2. **Create Cycles** (map to phases):
   - Cycle 1: Foundation (Week 1)
   - Cycle 2: Onboarding UI (Week 2)
   - Cycle 3: Core Tabs UI (Week 3-4)
   - Cycle 4: Backend Foundation (Week 4-5)
   - Cycle 5: TIL (Week 5-6)
   - Cycle 6: Backend Features (Week 6-7)
   - Cycle 7: Integration (Week 7-8)
   - Cycle 8: Polish (Week 9)
   - Cycle 9: Launch (Week 10)

3. **Create Labels**:
   - `frontend` (blue)
   - `backend` (green)
   - `test` (yellow)
   - `integration` (purple)
   - `infra` (gray)
   - `design` (pink)

4. **Link GitHub**:
   - Settings → Integrations → GitHub
   - Enable auto-close issues via PR keywords

5. **Import Tasks**:
   - Use Linear API or CSV import
   - Each row in tables above = 1 issue
   - Set dependencies using "Depends on" column

### Claude Code + Linear MCP

To enable me to update Linear automatically:

1. Install Linear MCP server:
   ```bash
   # In your Claude Code settings
   # Add Linear MCP server configuration
   ```

2. Get Linear API key:
   - Linear → Settings → API → Personal API keys
   - Create key with read/write access

3. Configure MCP:
   ```json
   {
     "mcpServers": {
       "linear": {
         "command": "npx",
         "args": ["-y", "@linear/mcp-server"],
         "env": {
           "LINEAR_API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

4. Usage:
   - I can then create/update issues during our sessions
   - PRs will auto-link via GitHub integration

---

*Last updated: Dec 2024*
