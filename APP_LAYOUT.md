# Ceezaa MVP - App Layout & UX Skeleton

> **Timeline:** 4 weeks
> **Core Promise:** "Wrapped for your life" - Transform spending into taste identity
> **Viral Hook:** Truth Card (shareable taste identity)
> **Magic:** AI transforms your transactions into personalized identity narrative

---

## Design Principles

1. **Instant Gratification** - Link card → See AI magic within 60 seconds
2. **Minimal Friction** - Every tap should feel worth it
3. **Shareability First** - Truth Card designed to be screenshot-worthy
4. **Delightful Details** - Micro-animations that spark joy
5. **Data as Story** - AI turns numbers into narrative, not spreadsheets
6. **The "Aha Moment"** - Users should feel "this app just gets me"

---

## User Journey (MVP)

```
Welcome → Auth → Link Card → Notifications → Processing Magic → Taste Reveal → Truth Card → Home
   │                                                                              │
   └────────────────────────── Share Loop ←───────────────────────────────────────┘
                                                                                  │
                                                                    Daily Push Notifications
```

---

## Screen-by-Screen Layout

### 1. SPLASH / WELCOME
**Purpose:** Brand moment + hook

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│           [Ceezaa Logo]             │
│                                     │
│     "Your spending tells a story.   │
│        Let's read it together."     │
│                                     │
│                                     │
│         [ Get Started ]             │
│                                     │
│       Already have account?         │
│                                     │
└─────────────────────────────────────┘
```

**Notes:**
- Subtle animated gradient background
- Logo has gentle pulse animation
- Single CTA, no clutter

---

### 2. SIGN UP / LOGIN
**Purpose:** Lowest friction auth

```
┌─────────────────────────────────────┐
│  ←                                  │
│                                     │
│     What's your phone number?       │
│                                     │
│     ┌─────────────────────────┐     │
│     │  +1  │ (555) 123-4567   │     │
│     └─────────────────────────┘     │
│                                     │
│         [ Send Code ]               │
│                                     │
│                                     │
│   ─────── or continue with ───────  │
│                                     │
│      [Apple]    [Google]            │
│                                     │
└─────────────────────────────────────┘
```

**Flow:**
1. Phone number → OTP (6 digits)
2. OR social auth (Apple/Google)
3. First-time: Capture name on next screen

**Notes:**
- Phone-first for Gen Z (they don't use email)
- Social auth as backup
- No password to remember

---

### 3. ONBOARDING VALUE PROP (2-3 swipeable cards)
**Purpose:** Build anticipation before Plaid

```
┌─────────────────────────────────────┐
│                                  ⦿⦾⦾│
│                                     │
│        [Illustration: Cards         │
│         transforming into           │
│         personality icons]          │
│                                     │
│     "Your coffee runs, concert      │
│      tickets, and late-night        │
│      ramen tell your story"         │
│                                     │
│                                     │
│           [ Next ]                  │
│           [ Skip ]                  │
│                                     │
└─────────────────────────────────────┘
```

**Cards:**
1. "Your spending = Your taste DNA"
2. "We analyze patterns, not amounts" (privacy reassurance)
3. "Get your Truth Card in 60 seconds"

---

### 4. CONNECT BANK
**Purpose:** Plaid linking with clear value exchange

```
┌─────────────────────────────────────┐
│  ←                                  │
│                                     │
│     🔒 Bank-grade security          │
│                                     │
│     Connect your spending to        │
│     unlock your Taste Identity      │
│                                     │
│     ┌─────────────────────────┐     │
│     │  🏦  Chase              │     │
│     │  🏦  Bank of America    │     │
│     │  🏦  Wells Fargo        │     │
│     │  💳  Apple Card         │     │
│     │      See all banks →    │     │
│     └─────────────────────────┘     │
│                                     │
│     ✓ Read-only access              │
│     ✓ We never see your password    │
│     ✓ 256-bit encryption            │
│                                     │
└─────────────────────────────────────┘
```

**Notes:**
- Pre-surface popular banks (faster selection)
- Security badges prominent
- Plaid Link opens as modal/sheet
- After Plaid success → Notification permission screen

---

### 4.5 NOTIFICATION PERMISSION
**Purpose:** Enable daily engagement through push notifications

```
┌─────────────────────────────────────┐
│                                     │
│        [Bell Animation]             │
│                                     │
│     Stay in the loop                │
│                                     │
│     Get notified about:             │
│                                     │
│     ☕ Streak milestones            │
│     "5-day coffee streak!"          │
│                                     │
│     ✨ Daily taste insights         │
│     "New discovery: You tried       │
│      3 new restaurants!"            │
│                                     │
│     🎭 Profile updates              │
│     "Your archetype evolved!"       │
│                                     │
│                                     │
│     [ Enable Notifications ]        │
│                                     │
│         Maybe later                 │
│                                     │
└─────────────────────────────────────┘
```

**Notes:**
- Shown only once after Plaid success
- "Maybe later" skips but can enable in Settings
- On enable → iOS/Android native permission dialog
- After this → Processing screen

---

### 5. PROCESSING / ANALYZING (AI-POWERED)
**Purpose:** Delight during wait while AI crafts identity (20-30 sec)

The processing screen uses Server-Sent Events (SSE) to show real-time progress.
Each phase has distinct animation and message.

**PHASE 1: Reading (0-5s)**
```
┌─────────────────────────────────────┐
│                                     │
│     [Particles floating in]         │
│                                     │
│     "Reading your story..."         │
│                                     │
│     Found 847 transactions          │
│     ████░░░░░░░░░░░░ 25%            │
│                                     │
└─────────────────────────────────────┘
```

**PHASE 2: Spotting Patterns (5-15s)**
```
┌─────────────────────────────────────┐
│                                     │
│     [Particles clustering into      │
│      category bubbles]              │
│                                     │
│     "Spotting patterns..."          │
│                                     │
│     ☕ Coffee   🍜 Dining            │
│     🎵 Fun                          │
│                                     │
│     ████████░░░░░░░░ 50%            │
│                                     │
└─────────────────────────────────────┘
```

**PHASE 3: Crafting Identity (15-25s)**
```
┌─────────────────────────────────────┐
│                                     │
│     [Identity silhouette forming]   │
│                                     │
│     "Crafting your identity..."     │
│                                     │
│     "Looks like someone loves       │
│      their morning coffee..."       │
│                                     │
│     ████████████░░░░ 75%            │
│                                     │
└─────────────────────────────────────┘
```

**PHASE 4: Almost There (25-30s)**
```
┌─────────────────────────────────────┐
│                                     │
│     [Identity crystallizing]        │
│                                     │
│     "Almost there..."               │
│                                     │
│     ████████████████ 100%           │
│                                     │
│     [Transition to reveal]          │
│                                     │
└─────────────────────────────────────┘
```

**Technical Notes:**
- Backend sends SSE updates: `{phase, message, progress, data}`
- Phase 1-2: Rule-based processing (fast)
- Phase 3: AI generating personality content (GPT-4o-mini)
- Phase 4: Assembling final profile
- If AI is cached, phases 3-4 are faster
- Lottie animations for each phase transition

---

### 6. TASTE REVEAL (Multi-step reveal)
**Purpose:** THE moment - dramatic reveal of AI-crafted identity

**Step 6a: Category Reveal (swipeable cards)**

```
┌─────────────────────────────────────┐
│                                     │
│           YOUR TOP TASTE            │
│                                     │
│     ┌─────────────────────────┐     │
│     │                         │     │
│     │    ☕ COFFEE CULTURE    │     │
│     │                         │     │
│     │    43 visits to 12      │  ← Rule-based stats
│     │    different cafes      │     │
│     │                         │     │
│     │    Top spot: Blue       │     │
│     │    Bottle Coffee        │     │
│     │                         │     │
│     └─────────────────────────┘     │
│                                     │
│         Swipe to see more →         │
│                                     │
└─────────────────────────────────────┘
```

**Step 6b: Headline Insight (AI-Generated)**

```
┌─────────────────────────────────────┐
│                                     │
│     ┌─────────────────────────┐     │
│     │                         │     │
│     │   "You've explored 23   │  ← AI-GENERATED
│     │   unique restaurants    │     │
│     │   this year. Your       │     │
│     │   palate is basically   │     │
│     │   a passport."          │     │
│     │                         │     │
│     └─────────────────────────┘     │
│                                     │
│         Swipe to see more →         │
│                                     │
└─────────────────────────────────────┘
```

**Step 6c: Archetype Reveal (THE Big Moment)**

```
┌─────────────────────────────────────┐
│                                     │
│         You are a...                │
│                                     │
│    ╔═══════════════════════════╗    │
│    ║                           ║    │
│    ║   🏙️ URBAN EXPLORER       ║  ← AI-GENERATED
│    ║                           ║    │
│    ║   ☕ Coffee Connoisseur   ║  ← AI-GENERATED
│    ║   "You basically run      ║    │
│    ║    on espresso"           ║    │
│    ║                           ║    │
│    ║   🌙 Late Night Foodie    ║  ← AI-GENERATED
│    ║   "The city never sleeps, ║    │
│    ║    and neither do you"    ║    │
│    ║                           ║    │
│    ║   🎭 Experience Seeker    ║  ← AI-GENERATED
│    ║   "You collect moments,   ║    │
│    ║    not things"            ║    │
│    ║                           ║    │
│    ╚═══════════════════════════╝    │
│                                     │
│     Only 12% of users share         │  ← AI-calculated rarity
│     this taste profile              │
│                                     │
│      [ See Your Truth Card ]        │
│                                     │
└─────────────────────────────────────┘
```

**Swipeable cards flow:**
1. Top category + stats (rule-based)
2. Second category + stats
3. Third category + stats
4. Headline insight (AI-generated)
5. Archetype + trait badges reveal (AI-generated)
6. Final: "See Your Truth Card?"

**Notes:**
- Big dramatic reveal with confetti animation
- AI-generated archetype feels personal and witty
- Each badge has a one-liner description from AI
- Rarity percentile from AI adds social proof

---

### 7. TRUTH CARD
**Purpose:** Shareable artifact - THE viral loop

```
┌─────────────────────────────────────┐
│  ←                         [Share]  │
│                                     │
│     ┌─────────────────────────┐     │
│     │ ░░░░░░░░░░░░░░░░░░░░░░ │     │  Holographic gradient
│     │                         │     │
│     │      TRUTH CARD         │     │
│     │      @username          │     │
│     │                         │     │
│     │   🏙️ URBAN EXPLORER     │     │  ← AI-GENERATED archetype
│     │                         │     │
│     │   ☕ 43% Coffee         │     │  ← Rule-based breakdown
│     │   🍜 28% Dining         │     │
│     │   🎵 18% Entertainment  │     │
│     │   🛍️ 11% Shopping       │     │
│     │                         │     │
│     │   ☕ Coffee Connoisseur │     │  ← AI-GENERATED badges
│     │   🌙 Late Night Foodie  │     │
│     │   🎭 Experience Seeker  │     │
│     │                         │     │
│     │   "Your palate is       │     │  ← AI-GENERATED headline
│     │    basically a passport"│     │
│     │                         │     │
│     │   Top Spot: Blue Bottle │     │  ← Rule-based
│     │                         │     │
│     │        [Ceezaa]         │     │
│     └─────────────────────────┘     │
│                                     │
│    [ Share to Stories ]             │
│    [ Save to Camera Roll ]          │
│    [ Continue to Home ]             │
│                                     │
└─────────────────────────────────────┘
```

**Truth Card Elements:**
- Username/handle
- **AI-generated archetype** (e.g., "Urban Explorer")
- **Rule-based taste breakdown** (percentages)
- **AI-generated trait badges** (up to 3)
- **AI-generated headline insight** (one-liner)
- Top merchant (rule-based)
- Ceezaa branding (small, tasteful)

**Share Caption (AI-generated):**
When sharing, pre-fill with AI-generated caption:
> "Apparently I'm an Urban Explorer. What's your taste identity? 🏙️"

**Share Options:**
- Instagram Stories (pre-formatted 9:16)
- TikTok
- Save as image
- Copy link to profile

**Design Notes:**
- Card should look PREMIUM
- Dark mode aesthetic (stands out on feeds)
- Subtle gradient/holographic shimmer effect
- Aspect ratio optimized for Stories (9:16)
- Generated as static image via Pillow on backend

---

### 8. HOME (Dashboard)
**Purpose:** Daily engagement + quick access to Truth Card

```
┌─────────────────────────────────────┐
│  [Profile]              [Settings]  │
│                                     │
│  Good evening, Sam                  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  YOUR TRUTH CARD      [↗]  │    │
│  │  ✨ Urban Explorer          │    │
│  │  Tap to view & share        │    │
│  └─────────────────────────────┘    │
│                                     │
│  ACTIVE STREAKS                     │
│  ┌─────────────────────────────┐    │
│  │  ☕ 5 days   🍜 3 days       │    │  ← From TIL streaks
│  │  coffee      dining          │    │
│  └─────────────────────────────┘    │
│                                     │
│  TODAY'S INSIGHT                    │
│  ┌─────────────────────────────┐    │
│  │  🔥 You're on a 5-day       │    │  ← AI-generated
│  │  coffee streak! Blue Bottle │    │    (via push notification too)
│  │  is your happy place.       │    │
│  └─────────────────────────────┘    │
│                                     │
│  YOUR TASTE DNA                     │
│  ┌─────────────────────────────┐    │
│  │  [Visual pie chart of       │    │
│  │   spending categories]      │    │
│  │                             │    │
│  │  ☕ Coffee     ████████ 43% │    │
│  │  🍜 Dining     █████░░░ 28% │    │
│  │  🎵 Fun        ███░░░░░ 18% │    │
│  │  🛍️ Shopping   ██░░░░░░ 11% │    │
│  └─────────────────────────────┘    │
│                                     │
│  RECENT ACTIVITY                    │
│  ┌─────────────────────────────┐    │
│  │  Yesterday                  │    │
│  │  🍜 Visited Ramen Tatsunoya│    │
│  │  ☕ Morning at Starbucks    │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Home Sections:**
1. **Truth Card Preview** - Quick access to share (shows AI archetype)
2. **Active Streaks** - Live streak counters from TIL (updates on refresh)
3. **Today's Insight** - AI-generated fun fact (also sent as push notification)
4. **Taste DNA** - Visual breakdown (from TIL categories)
5. **Recent Activity** - Last few transactions (taste-ified)

**Notes:**
- Pull-to-refresh syncs new transactions + updates streaks
- Tapping Truth Card → Full card view
- Streak badges animate when milestone reached (3, 5, 7, etc.)
- Today's Insight matches the daily push notification

---

### 9. PROFILE / SETTINGS
**Purpose:** Account management + data control

```
┌─────────────────────────────────────┐
│  ←  Profile                         │
│                                     │
│        [Avatar]                     │
│        @username                    │
│        Sam's Taste Profile          │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Connected Accounts                 │
│  ┌─────────────────────────────┐    │
│  │  🏦 Chase ****4521   [✓]   │    │
│  │  + Add another card         │    │
│  └─────────────────────────────┘    │
│                                     │
│  Privacy                            │
│  ┌─────────────────────────────┐    │
│  │  Profile visibility  [Public]│    │
│  │  Hide specific merchants     │    │
│  │  Download my data            │    │
│  │  Delete account              │    │
│  └─────────────────────────────┘    │
│                                     │
│  App                                │
│  ┌─────────────────────────────┐    │
│  │  Notifications               │    │
│  │  Help & Support              │    │
│  │  About Ceezaa                │    │
│  │  Log out                     │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

## MVP Scope Summary

### IN SCOPE (Must Have)
- [ ] Splash + Welcome
- [ ] Phone auth + OTP
- [ ] Social auth (Apple/Google)
- [ ] Plaid Link integration
- [ ] Notification permission screen
- [ ] Transaction fetching & processing (via TIL)
- [ ] Taste categorization algorithm (TIL Layer 1-2)
- [ ] Taste Reveal experience
- [ ] Truth Card generation
- [ ] Share to Instagram/Save image
- [ ] Home dashboard with streak badges
- [ ] Basic profile/settings
- [ ] Daily insight (AI-generated, push notification)
- [ ] Push notifications (streaks, daily insights, profile updates)
- [ ] Weekly Truth Card refresh

### OUT OF SCOPE (V1.1+)
- Lobbies (community)
- Taste Search
- Black Book (favorites)
- Friend connections
- Plaid webhooks (auto-sync)
- Multiple taste card styles
- Historical comparisons ("last month vs this month")

---

## Visual Design Direction

### Color Palette
```
Primary:    #1A1A2E (Deep Navy)    - Background
Secondary:  #16213E (Dark Blue)    - Cards
Accent 1:   #E94560 (Coral Pink)   - CTAs, highlights
Accent 2:   #0F3460 (Ocean Blue)   - Secondary actions
Text:       #FFFFFF (White)        - Primary text
Subtle:     #A0A0A0 (Gray)         - Secondary text
```

### Typography
- **Headlines:** SF Pro Display Bold / Inter Bold
- **Body:** SF Pro Text / Inter Regular
- **Accent:** Mono font for numbers/stats

### Visual Style
- Dark mode first (premium feel, easy on eyes)
- Subtle gradients (not flat, not gaudy)
- Rounded corners (16px radius)
- Generous whitespace
- Micro-animations on interactions
- Card-based UI throughout

---

## Key Interactions & Animations

1. **Splash → Welcome:** Logo pulse, gradient shift
2. **Plaid Success:** Confetti burst or checkmark animation
3. **Processing:** Particles clustering into categories
4. **Taste Reveal:** Cards flip/slide in with spring physics
5. **Truth Card:** Subtle holographic shimmer effect
6. **Share:** Card "lifts" and flies to share target
7. **Pull to refresh:** Custom loading animation

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Platform | React Native (Expo) - iOS + Android |
| AI/LLM | GPT-4o-mini for personalized content (archetype, badges, insights) |
| Data Processing | Taste Intelligence Layer (TIL) - incremental O(1) updates |
| Truth Card | Static image (Pillow-generated) |
| Truth Card Refresh | Weekly (via cron job) |
| Push Notifications | Expo Push Service (daily insights, streaks, profile updates) |
| Content Generation | AI generates copy; TIL computes stats |
| Backend | Supabase (Auth/DB/Storage) + Python FastAPI (TIL + AI) |

---

*Last updated: Dec 2024*
*Version: v0.3 - MVP Spec with TIL + Push Notifications*
