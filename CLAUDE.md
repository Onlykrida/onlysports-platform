# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# OnlyKrida

**India's first sports talent discovery platform.** We make grassroots athletes visible to every scout in the country, powered by AI.

99% of Indian athletes never get scouted — not because they lack talent, but because they're invisible. OnlyKrida fixes this by giving every athlete a searchable digital portfolio and connecting them directly to scouts, coaches, teams, and opportunities.

## Founder Context (read before any product decision)

Built by Anirudh — former Indian football player, data engineer, Hyderabad-based. He lived
the problem: a scout in Mumbai will never see a talented kid from Hyderabad unless that kid
has connections. Geography and nepotism are the gatekeepers. OnlyKrida removes them.

**The Hyderabad test**: Before shipping any feature, ask — does this make it harder for a
scout to miss a talented kid from Hyderabad? If yes, ship it. If it's tangential, deprioritize.

Challenge Anirudh's framing productively. He values being pushed, not accommodated.

## The Product

- **Athletes** (free, always) build a sports portfolio: highlights, stats, fitness tests, achievements. Get discovered 24/7 instead of only at physical events.
- **Scouts** search a structured talent database — filter by sport, position, age, location, fitness zone. AI recommends athletes matching their criteria.
- **Coaches** manage teams, track performance, post opportunities, discover new talent.
- **Teams/Academies** post trials, scholarships, tournaments. Athletes apply directly. Recruitment pipeline built in.
- **Fans** follow athletes, engage with content, build social proof that attracts scouts.
- **AI (Claude)** powers smart scouting recommendations, profile coaching, opportunity matching, and an in-app assistant (Krida AI).

**Business model**: Athletes are permanently free. Revenue from scouts, teams, and academies (premium search, AI recommendations, recruitment tools).

**Markets**: India (Hyderabad first, then Bengaluru, Mumbai, Delhi) + Dubai/UAE.

**Sports**: Cricket, Football, Kabaddi, Badminton, Athletics, Hockey, Basketball.

## Core UX Principle

**Never demotivate.** Every score, label, and message uses growth-oriented language. Fitness zones are Starter > Building > Rising > Strong > Elite > Unstoppable. No "poor", "fail", or "beginner". Frame everything as progress and opportunity.

## Tech Stack

**React Native (Expo SDK 54) + TypeScript + Supabase + Claude AI**

## Commands

```bash
npm start                          # Dev server (mobile) — alias: expo start
npm run start-web                  # Dev server (web)
npm run start-web-dev              # Web dev with DEBUG=expo* logging
npm run lint                       # expo lint
npx tsc --noEmit                   # TypeScript check (treat 0 errors as required)
npx tsx scripts/seed-test-data.ts  # Seed test data
npx tsx scripts/nuke-and-seed.ts   # Reset DB + reseed
```

**No test framework is configured** (no Jest/Vitest, no `test` script). Verification = `npx tsc --noEmit` + `npm run lint` + manual browser/device testing. Don't go looking for a test runner.

**Formatting**: Prettier with single quotes, trailing commas, 2-space indent, 100-char width (`.prettierrc`).

## Tooling & CI

- **Pre-commit hooks** (`.husky/pre-commit`): runs `npx lint-staged` (Prettier on staged files) then `npx tsc --noEmit`. Both must pass — TypeScript errors block commits.
- **GitHub Actions** (`.github/workflows/ci.yml`): runs typecheck + lint + `expo export --platform web` on push/PR to `main`. Note: typecheck and lint currently use `continue-on-error: true`, so they report but don't block. The web export job is the real gate — it will fail the build if anything breaks the web bundle.

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
- `sensor-context.tsx` — Phone-sensor capture for in-app fitness tests (used by `app/beep-test-live.tsx`)

`zustand` and `@tanstack/react-query` are installed (legacy / experimental surfaces) but the convention is `@nkzw/create-context-hook`. Don't introduce them in new features without the user's explicit OK.

### Supabase

Tables, by domain:

- **Core**: profiles, posts, opportunities, applications, follows, likes, comments, comment_likes, messages, notifications
- **Scouting**: player_stats, scout_preferences, ai_recommendations
- **Social**: groups, group_members, group_messages
- **Analytics**: profile_views, fitness_test_results, analytics_events
- **Storage**: avatars, posts, videos (3 public buckets)

RLS is enabled. Real-time subscriptions for messages, notifications, feed.

**Schema source of truth**: `supabase-canonical-schema.sql` at the repo root. Other migration `.sql` files exist in the root but are scattered — when adding/altering tables, update the canonical file first. There is no `supabase/migrations/` directory.

### AI Integration (Claude API)

`services/ai.ts` calls the Anthropic Messages API directly via `fetch()` — no SDK on React Native. Single `callClaude()` helper used by all features. Conventions:

- **Model selection** is via `options.useSmartModel`:
  - `claude-sonnet-4-6` (default) for chat, summaries, profile tips. ~300–800 tokens.
  - `claude-opus-4-6` for scout matching and opportunity matching. ~1000–1500 tokens, with `options.useThinking = true` (sets `thinking: { type: 'adaptive' }` in the body).
- **Timeout**: every request uses `AbortController` with a 60-second timeout.
- **Response parsing**: extract the text block — `data.content.find(b => b.type === 'text')?.text`. Skip thinking blocks.
- **JSON-returning prompts** (scout/opportunity matching, profile suggestions) wrap `JSON.parse` in try/catch and return `[]` (or a static fallback) on parse failure.
- **Configuration check**: `isAIConfigured()` guards on missing key AND the `'PASTE_YOUR_ROTATED_KEY_HERE'` placeholder. Call it before invoking AI in user-visible flows.

Surfaces:

- `hooks/ai-context.tsx` — cached state for all AI features
- `app/ai-assistant.tsx` — full-screen Krida AI chat
- `components/AIProfileCoach.tsx` — profile improvement suggestions
- `components/AIScoutCard.tsx` — AI scout recommendation cards

### Role-Specific Interfaces

Each of the 9 roles gets a differentiated experience:

- **Tab bar adapts**: Different labels (Feed/Dashboard/Coach HQ), role accent colors, hidden tabs per role
- **Home screens**: AthleteHome, ScoutHome, CoachHome, TeamHome, BrandHome, FanHome (each in `components/home/`)
- **Role accents** in `constants/theme.ts` (`roleAccents`): athlete=#30D158, scout=#FF9F0A, coach=#64D2FF, team=#FF453A, fan=#BF5AF2
- **Hook**: `hooks/useRoleAccent.ts` — get current user's accent colors

### Key Components

Reach for these instead of rolling your own:

| Component               | Use when                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `CachedImage.tsx`       | **Always** — never use `<Image>` from react-native. expo-image with caching + blurhash.     |
| `EmptyState.tsx`        | Any empty list. Has 8 presets with encouraging copy — pick one before writing your own.     |
| `ProfileViewers.tsx`    | Showing "Who Viewed Your Profile". Documented as the #1 engagement driver — keep prominent. |
| `ProfileCompletion.tsx` | Profile strength progress bar on the athlete profile.                                       |
| `AIProfileCoach.tsx`    | Surfacing AI-generated profile tips.                                                        |
| `AIScoutCard.tsx`       | AI scout recommendation cards.                                                              |
| `SkeletonScreens.tsx`   | Loading states for Chat / UserProfile / Discover / Feed — use the matching preset.          |

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

- Auth-gated routing: `_layout.tsx` checks `isAuthenticated` to render `(auth)` or `(tabs)` stack.
- Context pattern: `createContextHook` from `@nkzw/create-context-hook` returning `[Provider, useHook]` tuple.
- No hooks after early returns — React requires consistent hook call order.
- AI FAB: Sparkles button (bottom-left on home) opens `/ai-assistant`.

### Resilience patterns (don't violate these — they fix real bugs)

- **Safe context hook DEFAULTS** — every context exports a `useFoo = () => _useFoo() ?? FOO_DEFAULTS` wrapper so destructuring the hook before the provider mounts won't crash. See `hooks/auth-context.tsx` (`AUTH_DEFAULTS` at the top of the file). **When you add a new context, add a DEFAULTS object too.** This pattern was added in commit `17fda7c` after a wave of "Cannot destructure undefined" crashes.
- **Mock Supabase client** — `constants/supabase.ts` returns a chained-method mock when `EXPO_PUBLIC_SUPABASE_URL` is missing or set to a placeholder. The app must run without crashing in unconfigured environments. Use `isSupabaseConfigured` (also exported) to gate real DB writes and produce friendly error messages.
- **`isTableMissing` pattern** — Supabase returns `error.code === 'PGRST205'` or messages containing `"does not exist"` / `"Could not find the table"` when a table isn't deployed. See the helper in `hooks/fitness-test-context.tsx:22-29`. Contexts should detect this and degrade gracefully (return `null` / `[]`), not throw. Reuse the existing helper before writing your own.
- **Auth init timeouts** (`hooks/auth-context.tsx`) — outer `initializeAuth` has a 10s safety timeout; inner `loadUserProfile` has an 8s timeout that falls back to `createFallbackUser()` built from `supabaseUser.user_metadata`. The outer timeout must be longer than the inner. If you add another long async init, follow the same pattern (outer timer + fallback object) to prevent UI hangs.

### Web / native compatibility

Recent commits (`2f2a2ad`, `7ed94f1`) were almost entirely about fixing web breakage. Two patterns to follow:

- **Native-only modules must be conditionally `require`d, not statically imported.** Static `import` from `expo-video`, `expo-haptics`, `expo-av`, `expo-sensors`, `expo-file-system`, etc. will break the web bundle. Pattern, from `components/VideoPlayer.tsx`:
  ```ts
  let VideoViewComponent: any = null;
  let useVideoPlayerHook: any = null;
  if (Platform.OS !== 'web') {
    const expoVideo = require('expo-video');
    VideoViewComponent = expoVideo.VideoView;
    useVideoPlayerHook = expoVideo.useVideoPlayer;
  }
  ```
  Then guard usage sites with `if (Platform.OS !== 'web')` or by checking the captured ref is non-null.
- **Storage abstraction** (`constants/supabase.ts`): the Supabase client is created with a custom `storage` adapter — `localStorage` on web, `AsyncStorage` on native — plus `detectSessionInUrl: Platform.OS === 'web'` (for OAuth). When persisting auth/session-like state, follow this pattern instead of importing `AsyncStorage` directly.

### Fitness verification tiers

`constants/verification.ts` defines four tiers with `scoutConfidenceMultiplier`: `self_reported` 0.7×, `app_measured` 0.85×, `coach_verified` 1.0×, `center_tested` 1.1×. Any new scout-ranking, AI-recommendation, or fitness-score aggregation feature must apply this multiplier — see `hooks/scouting-context.tsx` for the canonical usage.

## Build Plan

Read `docs/MVP_BUILD_PLAN.md` for the full implementation plan (Wave 1 done, Wave 2 in progress, Wave 3 future).

Key docs:

- `docs/PRD_OnlyKrida.md`, `docs/BRD_OnlyKrida.md`, `docs/TRD_OnlyKrida.md` — full product / business / technical requirements (large files; treat as reference, not reading list)
- `docs/UX_COMPETITIVE_RESEARCH.md` — Competitive intelligence, engagement mechanics
- `docs/ROLE_SPECIFIC_INTERFACES.md` — Per-role interface design spec
- `docs/CRITICAL_IMPROVEMENTS.md`, `docs/GROWTH_PLAN.md` — outstanding fixes + growth strategy
- `docs/RESEARCH_ML_PLAYER_STATS.md` — ML / player-stats research (untracked WIP)
- `docs/gbrain-seed/` — Knowledge-graph seed (companies, people, concepts, product) plus `INDEX.md` and `SYNTHESIS.md`. Read `SYNTHESIS.md` first; the rest are deep-dives.
- `scripts/seed-test-data.ts`, `scripts/nuke-and-seed.ts` — test data lifecycle
- `scripts/create-waitlist-table.ts`, `scripts/fix-opportunities.ts` — one-off DB scripts (don't re-run blindly)
- `scripts/build-orchestrator.py`, `scripts/generate_html_docs.py`, `scripts/generate_pitch_deck.py` — auxiliary tooling outside the app runtime

## Test Accounts

Password for all: `test123`

| Role    | Email                        |
| ------- | ---------------------------- |
| Athlete | `test.athlete@onlykrida.com` |
| Scout   | `test.scout@onlykrida.com`   |
| Coach   | `test.coach@onlykrida.com`   |
| Team    | `test.team@onlykrida.com`    |
| Fan     | `test.fan@onlykrida.com`     |

---

## AI Agent Layer (gstack + gbrain)

This section covers Claude Code sessions that use gstack skills and gbrain knowledge brain.
Everything above this line takes precedence — stack conventions, resilience patterns,
and UX principles are never overridden by agent tooling.

### gstack — Slash Commands

gstack lives at `~/.claude/skills/gstack`. Skills load automatically per session.

**Before building anything new:**

- `/office-hours` — Six forcing questions. Challenges framing before a line is written.
  Use before any feature not clearly in the current wave.
- `/plan-ceo-review` — Is this in scope? Finds the 10-star product hiding in the request.
  Run before adding new surfaces, roles, or data models.
- `/autoplan` — Full review pipeline: CEO → design → eng → DX. Use for Wave 3 planning.

**Design (any time you touch UI):**

- `/design-consultation` — Extend the OnlyKrida design system. Knows our dark theme
  (#0a0a0a), role accents, never-demotivate principle, fitness zone language.
- `/design-shotgun` — 4-6 visual variants for: athlete profile cards, scout dashboard,
  discovery feed, fitness zone displays, opportunity cards.
- `/design-html` — Production component from approved mockup. Respects NativeWind +
  dark theme. Will not suggest inline StyleSheet.
- `/design-review` — Audit existing screens. Flags AI-generic patterns that violate
  OnlyKrida's visual language.

**Engineering:**

- `/plan-eng-review` — Architecture + data flow + edge cases. Always run before touching
  `scouting-context.tsx`, `ai-context.tsx`, or `auth-context.tsx` — these are high-risk.
- `/review` — Pre-commit audit. Will catch: missing DEFAULTS objects, hardcoded colors,
  missing verification multiplier, static imports of native-only modules, `any` types.
- `/investigate` — Root cause before any fix. Non-negotiable for resilience pattern bugs.
- `/cso` — OWASP + STRIDE. Run before any auth flow change, RLS policy edit, or AI key
  handling change. DPDP Act 2023 compliance is a hard constraint.

**Shipping:**

- `/qa` — Tests in simulator + browser. Catches web/native breakage before CI does.
- `/ship` — Runs tsc + lint, pushes, opens PR. No test runner — tsc + lint is the gate.
- `/document-release` — Updates CLAUDE.md and docs/ after shipping.
- `/retro` — Weekly velocity + blocker review.

**gstack rules for this codebase (never violate):**

- Never suggest replacing `@nkzw/create-context-hook` with Zustand/Redux/Jotai
- Never add a test runner without explicit request
- Always apply `scoutConfidenceMultiplier` in any scout-ranking or fitness-scoring feature
- Always check web/native compatibility before suggesting a new native module import
- `/review` must flag any `any` type added outside the native-module conditional require pattern

### gbrain — Knowledge Brain (project-scoped MCP)

gbrain stores OnlyKrida's accumulated knowledge. Query before building, write after deciding.

**MCP config — project-scoped (not global):**
Create `.claude/server.json` in the repo root (not `~/.claude/`):

```json
{
  "mcpServers": {
    "gbrain": { "command": "gbrain", "args": ["serve"] }
  }
}
```

This keeps gbrain active only for OnlyKrida sessions, not every Claude Code session.

**Query before any sprint:**

```bash
gbrain query "current wave status"
gbrain query "scout discovery feed design decisions"
gbrain query "verification multiplier"
gbrain query "SportVot weaknesses"
gbrain query "beep test implementation"
gbrain query "DPDP compliance decisions"
```

**Write after decisions:**

```bash
gbrain put product/wave-2-decisions < sprint-notes.md
gbrain put concepts/scout-ux-research < research.md
gbrain put companies/competitor-update < intel.md
```

**Already seeded** (see `docs/gbrain-seed/INDEX.md` for the full inventory):

- `product/soul`, `product/decisions` — mission, Hyderabad test, business model; locked stack decisions
- `companies/competitor-landscape`, `companies/competitor-deep-dive-2026` — primer + 2026-current dossier (AiSCOUT × RFYC, KhiladiPro, StepOut, Tonsser, 2x2 positioning)
- `concepts/indian-football-ecosystem` — AIFF, ISL, talent pyramid
- `concepts/kabaddi-moat` — kabaddi-as-moat thesis (confirmed); Telugu Titans as first PKL partner
- `concepts/regulatory-compliance` — DPDP / POCSO / IT Rules 2021 / UAE PDPL implementation brief (13 May 2027 deadline)
- `concepts/india-gtm-playbook` — Hyderabad-20 ground list, kill criteria, viral loops, ₹999 anchor
- `people/scouts-and-academies` — ISL/I-League/PKL leadership map; Hyderabad FC → Sporting Club Delhi (Oct 2025)

### Session startup

```bash
cd ~/onlysports-platform   # actual repo path on this machine
claude
# First message:
# "Load gstack. Check gbrain for recent Wave 2 decisions. Let's work on [specific feature]."
```
