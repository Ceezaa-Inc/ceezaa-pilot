# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ceezaa is a fintech taste intelligence app that combines quiz-declared preferences with observed transaction behavior to create personalized dining/lifestyle recommendations.

**Stack:** React Native (Expo) + Python FastAPI + Supabase + Plaid

## Development Commands

### Mobile (React Native/Expo)

```bash
cd mobile
npm install            # Install dependencies
npx expo start         # Start dev server (scan QR with Expo Go)
npx expo start --clear # Start with cache cleared

npm test               # Run tests in watch mode
npm run test:ci        # Run tests once with coverage
npm run lint           # ESLint check
npm run lint:fix       # ESLint autofix
npm run typecheck      # TypeScript check
```

### Backend (Python/FastAPI)

**Hosted backend:** https://ceezaa-pilot.onrender.com

```bash
cd backend
poetry install                              # Install dependencies
poetry run uvicorn app.main:app --reload    # Start dev server (localhost:8000)

poetry run pytest                           # Run all tests (excludes exploration)
poetry run pytest -m exploration            # Run exploration tests only
poetry run pytest --cov=app                 # Run with coverage
poetry run pytest tests/intelligence/test_quiz_processor.py  # Single file
```

API docs at http://localhost:8000/docs when server is running.

## Architecture

### Intelligence Layer Philosophy: Rules First, AI Last

The core intelligence uses deterministic rule-based logic. AI (Claude/OpenAI) is used in only 2 places:
1. **Insight Generation** - Natural language insights cached daily per user
2. **Venue Tagging** - One-time at venue import, cached forever

Everything else (quiz processing, taste fusion, matching, ranking) is pure algorithmic.

### Key Backend Modules

- `app/intelligence/` - Core taste processing (quiz_processor, taste_fusion, matching_engine)
- `app/mappings/` - Deterministic mapping tables (quiz answers, Plaid categories, profile titles)
- `app/routers/` - FastAPI endpoints
- `app/services/` - External API integrations (Plaid, etc.)

### Key Mobile Structure

- `app/` - Expo Router file-based routes: `(auth)/`, `(onboarding)/`, `(tabs)/`
- `src/stores/` - Zustand state stores (authStore, tasteStore, etc.)
- `src/components/` - Reusable UI components
- `src/services/` - API client and external services

### State Management

Mobile uses Zustand for state management. Key stores:
- `authStore` - Authentication state, dev mode skip
- `tasteStore` - User taste profile data
- `onboardingStore` - Onboarding flow state

## Testing

TDD is the standard practice. Backend tests are organized:
- `tests/unit/` - Isolated unit tests
- `tests/integration/` - API endpoint tests
- `tests/intelligence/` - Taste intelligence layer tests
- `tests/exploration/` - External API exploration (Plaid schema discovery)

Exploration tests are excluded by default (`-m 'not exploration'`). Run them explicitly when exploring external APIs.

## Database

Supabase PostgreSQL. Migrations are in `supabase/migrations/`.

Key tables: `profiles`, `declared_taste`, `user_analysis`, `fused_taste`, `venues`, `transactions`, `linked_accounts`

## Development Progress

See `DEV_PLAN.md` for current checkpoint status. The project follows atomic full-stack checkpoints (FS1-FS11) where each is testable end-to-end in Expo.

## Design System

**Philosophy:** Dark-first design (like Spotify/Booking.com) with Navy + Gold brand accents.

### Core Principles
- **Dark-first**: Black background (`#0A0A0A`) as default, never light backgrounds except Trust Mode
- **Trust Mode**: Light theme (`#FFFFFF`) ONLY for card linking screens (bank-level trust)
- **Brand colors**: Navy (`#0A1A2F`) + Gold (`#D3B481`) as accents on dark
- **Typography**: Manrope font family

### Color Tokens (in `tailwind.config.js`)
- Backgrounds: `background`, `surface`, `surface-alt`, `surface-muted`
- Text: `text-primary` (white), `text-secondary` (space gray), `text-muted`
- Accent: `primary` (gold), `navy`
- Semantic: `success`, `warning`, `error`, `info`
- Moods: `mood-chill`, `mood-energetic`, `mood-romantic`, etc.

Use NativeWind (Tailwind for RN) classes. See `DESIGN_SYSTEM.md` for full specification.

## Git Conventions

- Do NOT add "Co-Authored-By: Claude" or "Generated with Claude Code" to commit messages
- Follow conventional commits: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

## Environment Variables

- Mobile: `.env` with `EXPO_PUBLIC_*` prefixed vars
- Backend: `.env` (copy from `.env.example`) with Supabase, Plaid, Anthropic keys
