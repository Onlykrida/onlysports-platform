# OnlyKrida

**India's first sports talent discovery platform.** We make grassroots athletes visible to every scout in the country, powered by AI.

99% of Indian athletes never get scouted — not because they lack talent, but because they're invisible. OnlyKrida fixes this by giving every athlete a searchable digital portfolio and connecting them directly to scouts, coaches, teams, and opportunities.

## The Product

- **Athletes** (free, always) build a sports portfolio: highlights, stats, fitness tests, achievements. Get discovered 24/7 instead of only at physical events.
- **Scouts** search a structured talent database — filter by sport, position, age, location, fitness zone. AI recommends athletes matching their criteria.
- **Coaches** manage teams, track performance, post opportunities, discover new talent.
- **Teams/Academies** post trials, scholarships, tournaments. Athletes apply directly. Recruitment pipeline built in.
- **Fans** follow athletes, engage with content, build social proof that attracts scouts.
- **AI (Claude)** powers smart scouting recommendations, profile coaching, opportunity matching, and an in-app assistant (Krida AI).

**Business model**: Athletes are permanently free. Revenue from scouts, teams, and academies (premium search, AI recommendations, recruitment tools).

**Markets**: India (Bengaluru first, then Mumbai, Delhi, Hyderabad) + Dubai/UAE.

**Sports**: Cricket, Football, Kabaddi, Badminton, Athletics, Hockey, Basketball.

## Core UX Principle

**Never demotivate.** Every score, label, and message uses growth-oriented language. Fitness zones are Starter > Building > Rising > Strong > Elite > Unstoppable. No "poor", "fail", or "beginner". Frame everything as progress and opportunity.

## Tech Stack

**React Native (Expo SDK 54) + TypeScript + Supabase + Claude AI**

## Commands

```bash
npx expo start              # Dev server (mobile)
npx expo start --web        # Dev server (web)
npx tsc --noEmit            # TypeScript check (must pass with 0 errors)
npx expo lint               # Lint
npx tsx scripts/seed-test-data.ts  # Seed test data
```

## Environment

`.env` requires:

- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — For admin operations / seed scripts
- `EXPO_PUBLIC_ANTHROPIC_API_KEY` — Claude API key for AI features

Without Supabase keys, the app runs with a mock client (see `constants/supabase.ts`).

## Architecture

### Routing (Expo Router — file-based)

- `app/_layout.tsx` — Root layout with grouped context providers (SocialProviders, CommunicationProviders, ContentProviders)
- `app/(auth)/` — Welcome, login, role selection, role-specific signup (step indicators, encouraging copy, simplified forms)
- `app/(tabs)/` — Main tabs: Feed/Dashboard, Discover/Search, Create, Opportunities, Messages, Alerts, Profile
- `app/ai-assistant.tsx` — Krida AI chat screen
- `app/user/[id].tsx` — Public profile with profile view tracking
- `app/chat/` — DM and group messaging
- `app/beep-test*.tsx` — Fitness testing (Yo-Yo IR1, Sprint, Agility, Vertical Jump)

### State Management

Context providers under `hooks/` using `@nkzw/create-context-hook`:

- `auth-context.tsx` — Auth, profile loading
- `posts-context.tsx` — Feed, CRUD, pagination
- `messages-context.tsx` — DMs, conversations
- `group-messages-context.tsx` — Group chats
- `follow-context.tsx` — Social graph
- `notifications-context.tsx` — In-app notifications
- `opportunities-context.tsx` — Opportunities, applications
- `scouting-context.tsx` — Scout matching, shortlists, AI recommendations
- `fitness-test-context.tsx` — Fitness test results, zone calculation
- `ai-context.tsx` — Claude AI features (chat, profile coach, scout recommendations)
- `users-context.tsx` — User cache, search
- `search-context.tsx` — Discover search

### Supabase (19 tables)

Core: profiles, posts, opportunities, applications, follows, likes, comments, comment_likes, messages, notifications
Scouting: player_stats, scout_preferences, ai_recommendations
Social: groups, group_members, group_messages
Analytics: profile_views, fitness_test_results, analytics_events
Storage: avatars, posts, videos (3 public buckets)
RLS enabled on all tables. Real-time subscriptions for messages, notifications, feed.

### AI Integration (Claude API)

- `services/ai.ts` — Direct fetch() to Claude API (MVP approach for React Native)
  - Opus 4.6 with adaptive thinking for deep analysis (scout matching, opportunity matching)
  - Sonnet 4.6 for fast tasks (summaries, chat, profile tips)
- `hooks/ai-context.tsx` — Cached state for all AI features
- `app/ai-assistant.tsx` — Full-screen chat with Krida AI
- `components/AIProfileCoach.tsx` — Profile improvement suggestions
- `components/AIScoutCard.tsx` — AI-powered athlete recommendation cards

### Role-Specific Interfaces

Each of the 9 roles gets a differentiated experience:

- **Tab bar adapts**: Different labels (Feed/Dashboard/Coach HQ), role accent colors, hidden tabs per role
- **Home screens**: AthleteHome, ScoutHome, CoachHome, TeamHome, BrandHome, FanHome (each in `components/home/`)
- **Role accents** in `constants/theme.ts` (`roleAccents`): athlete=#30D158, scout=#FF9F0A, coach=#64D2FF, team=#FF453A, fan=#BF5AF2
- **Hook**: `hooks/useRoleAccent.ts` — get current user's accent colors

### Key Components

| Component               | Purpose                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `CachedImage.tsx`       | Use instead of `<Image>` — expo-image with memory-disk caching, blurhash placeholder |
| `EmptyState.tsx`        | Empty list states with 8 presets and encouraging copy                                |
| `ProfileCompletion.tsx` | Profile strength progress bar (on athlete profile)                                   |
| `ProfileViewers.tsx`    | "Who Viewed Your Profile" — #1 engagement driver                                     |
| `AIProfileCoach.tsx`    | AI-generated profile improvement tips                                                |
| `AIScoutCard.tsx`       | AI recommendation cards for scouts                                                   |
| `AnimatedCard.tsx`      | Staggered fade-in entrance animation                                                 |
| `Logo.tsx`              | SVG logo with K icon + OnlyKrida text                                                |
| `StepIndicator.tsx`     | Green progress dots for auth flow                                                    |
| `SkeletonScreens.tsx`   | Loading skeletons (Chat, UserProfile, Discover, Feed, etc.)                          |

### Performance Rules

- Context providers grouped into memoized wrappers in `_layout.tsx`
- All FlatLists must have: `maxToRenderPerBatch={8} windowSize={5} initialNumToRender={10}`
- Use `constants/performance.ts` for shared FlatList props
- Use `CachedImage` for all images — never `<Image>` from react-native
- Wrap renderItem callbacks in `useCallback`

### Theming

- `constants/theme.ts` — Dark theme (#0a0a0a background, #30D158 primary green, #FF9F0A orange accent)
- Always use `theme` constants — never hardcode colors
- `roleAccents` for per-role color differentiation

### Types

- `types/index.ts` — All shared interfaces
- `UserRole`: `'athlete' | 'coach' | 'scout' | 'team' | 'fan' | 'trainer' | 'gym' | 'brand' | 'academy'`
- Path aliases: `@/*` maps to project root

## Key Patterns

- Auth-gated routing: `_layout.tsx` checks `isAuthenticated` to render `(auth)` or `(tabs)` stack
- Context pattern: `createContextHook` from `@nkzw/create-context-hook` returning `[Provider, useHook]` tuple
- Safe context access in tab layout: always use `ctx?.field ?? default` since contexts may not be ready
- No hooks after early returns — React requires consistent hook call order
- AI FAB: Sparkles button (bottom-left on home) opens `/ai-assistant`

## Build Plan

Read `docs/MVP_BUILD_PLAN.md` for the full implementation plan (Wave 1 done, Wave 2 in progress, Wave 3 future).

Key docs:

- `docs/UX_COMPETITIVE_RESEARCH.md` — Competitive intelligence, engagement mechanics
- `docs/ROLE_SPECIFIC_INTERFACES.md` — Per-role interface design spec
- `scripts/build-orchestrator.py` — Autonomous agent orchestrator for parallel development
- `scripts/seed-test-data.ts` — Comprehensive test data seeder

## Test Accounts

Password for all: `test123`

| Role    | Email                        |
| ------- | ---------------------------- |
| Athlete | `test.athlete@onlykrida.com` |
| Scout   | `test.scout@onlykrida.com`   |
| Coach   | `test.coach@onlykrida.com`   |
| Team    | `test.team@onlykrida.com`    |
| Fan     | `test.fan@onlykrida.com`     |
