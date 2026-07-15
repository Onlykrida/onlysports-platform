# OnlyKrida MVP Build Plan

> Last refresh: **2026-04-26**. Prior version dated 2026-03-30 — most of "Wave 2 — In Progress" has since shipped, plus a major verification-system milestone and a regulatory-compliance design doc that weren't in the original plan. This document is the source of truth for "what's done" and "what's next."

## Project Context

OnlyKrida is India's first sports talent discovery platform. React Native (Expo SDK 54) + TypeScript + Supabase + Claude AI. Target: Indian grassroots athletes, scouts, coaches, teams. Hyderabad-first market.

For the founder context, the Hyderabad test, the 9-role product model, and the never-demotivate UX principle, see the canonical `CLAUDE.md` at the repo root.

---

## Wave 1 — Foundation (shipped 2026-03-30)

- Claude AI brain (`services/ai.ts`, `hooks/ai-context.tsx`, full-screen Krida AI chat at `app/ai-assistant.tsx`, AIProfileCoach + AIScoutCard surfaces)
- Reusable UI: `CachedImage`, `AnimatedCard`, `Logo`, `EmptyState` (8 presets), `ProfileCompletion`, `StepIndicator`
- Performance baseline: grouped+memoized context providers, FlatList perf config (`constants/performance.ts`), Create-tab haptics
- Auth flow with role-specific signups; encouraging copy throughout
- Welcome screen with logo + "Powered by AI" badge

---

## Wave 2 — UX, Performance, Refactoring (shipped — 2026-04)

### 2A. CachedImage migration — DONE

- Zero remaining direct `<Image source={{ uri: ... }}>` references in `app/` and `components/` (verified by grep on 2026-04-26)
- Zero remaining `via.placeholder.com` URLs
- All home screens, chat, profile, user pages, comments modal use `CachedImage`

### 2B. Discover useReducer rewrite — DONE

- `app/(tabs)/discover.tsx:210` consolidates state into `useReducer` with `discoverReducer` and a typed action set. The 17 separate `useState` calls from the old plan are gone.

### 2C. FlatList perf props — PARTIAL

- AthleteHome, messages: shipped
- Still missing perf props (verified 2026-04-26): `app/notifications.tsx`, `app/ai-assistant.tsx`, `app/opportunities/my-applications.tsx`, `app/chat/[id].tsx`, `app/chat/create-group.tsx`. ~30 min cleanup pass when next prioritized.

### 2D. Component refactoring — PARTIAL

- Shared sub-components landed: `components/home/shared/PostCard.tsx`, `UserCard.tsx`, `SectionHeader.tsx`
- AthleteHome / ScoutHome / CoachHome are still monolithic (originally planned 5+ sub-components per role). The `shared/` extraction was the highest-value piece; per-role decomposition was deprioritized after the verification system became the bigger surface.

### 2E. Skeleton screens — DONE

- `components/SkeletonScreens.tsx` ships ChatSkeleton, UserProfileSkeleton, DiscoverSkeleton, FeedSkeleton presets

### 2F. Onboarding UX — DONE

- StepIndicator on auth flow; encouraging microcopy; required vs optional fields collapsed behind "Add more details (optional)" with a "Skip for now" link
- **Caveat**: the optional-DOB design will need to change to support DPDP-compliant under-18 flow — see Wave 4 below

---

## Wave 2.5 — Verification System (shipped 2026-04-01, not in original plan)

A 4-tier trust ladder for fitness test results, integrated into scout-side ranking. This is the foundational surface that the parental-consent identity-verification work in Wave 4 will extend.

- `constants/verification.ts` — 4 tiers with `scoutConfidenceMultiplier` (`self_reported` 0.7×, `app_measured` 0.85×, `coach_verified` 1.0×, `center_tested` 1.1×)
- `components/VerificationBadge.tsx` — visual badge component (per-tier color + label)
- `app/(tabs)/profile.tsx`, `app/user/[id].tsx`, scout matches, discover — all show tiers via the badge
- `hooks/scouting-context.tsx` — verification multiplier in scouting algorithm
- Fitness test capture stack: `app/beep-test-live.tsx` (accelerometer-driven Yo-Yo IR1, sprint, agility, vertical jump), `app/beep-test-results.tsx`, `app/beep-test-history.tsx`
- Coach verification screen (`app/verify-result.tsx`) — one-tap verify/reject athlete results
- `hooks/sensor-context.tsx` + `accelerometer service` — phone sensor capture for in-app fitness tests
- DB: `fitness_test_results.verification_tier`, `verified_by`, `sensor_data`; `test_attestations` and `verification_requests` tables (migration in `supabase-fitness-tests.sql`, applied 2026-04-26 to live project)
- Self-reported badge on manual entry; verification tiers explainer

**Hard rule** (from CLAUDE.md): any new scout-ranking, AI-recommendation, or fitness-aggregation feature **must** apply `scoutConfidenceMultiplier`. Reference impl in `hooks/scouting-context.tsx`.

---

## Wave 2.7 — Resilience & Web Compat (shipped 2026-04, not in original plan)

A wave of fixes that kept the app running across web + Android. Documented as patterns in `CLAUDE.md`; referenced here so the plan reflects them.

- **Safe context DEFAULTS** (`17fda7c`) — every context exports `useFoo = () => _useFoo() ?? FOO_DEFAULTS` so destructuring before provider mount no longer crashes. Required pattern for all new contexts.
- **Mock Supabase client** (`constants/supabase.ts`) — chained-method mock when env is unset; `isSupabaseConfigured` gate around real DB writes.
- **`isTableMissing` helper** (`hooks/fitness-test-context.tsx:22-29`) — graceful degrade on missing migrations (PGRST205 / "does not exist" / "Could not find the table"). Reuse in any new context that touches a not-yet-deployed table.
- **Auth init timeouts** (`hooks/auth-context.tsx`) — 10s outer + 8s inner with `createFallbackUser()` from `supabaseUser.user_metadata`. Outer must be longer than inner. Pattern for any long async init.
- **Native-only modules conditionally `require`d, not statically imported** — pattern documented in `CLAUDE.md`. Applied to `expo-video`, `expo-haptics`, `expo-av`, `expo-sensors`, `expo-file-system`. Static imports break the web bundle.
- **Storage abstraction** — `localStorage` on web, `AsyncStorage` on native, plus `detectSessionInUrl: Platform.OS === 'web'`. Use this for any session-like state, not `AsyncStorage` direct.

---

## Wave 2.9 — Recently shipped this session (2026-04-26)

- **Web auth lock fix** (`constants/supabase.ts`): no-op auth lock bypasses Supabase's default `navigator.locks` cross-tab coordination on web. Eliminates "lock broken by another user" errors from tab-opens or Metro hot-reloads.
- **Stale-token recovery** (`hooks/auth-context.tsx:86-105`): on `getSession()` errors matching `refresh token` / `JWT` / `not found`, force a clean `signOut()` to clear AsyncStorage instead of looping the same crash on every boot.
- **Expo Go push warning silenced** (`hooks/usePushNotifications.ts`): detects Expo Go on Android via `expo-constants.executionEnvironment === 'storeClient'` and skips all push setup. Push works fine in dev-client / EAS builds.
- **Native post upload via base64** (`hooks/posts-context.tsx`): replaced the unreliable Blob-via-fetch path with `expo-file-system` → base64 → `ArrayBuffer` for native uploads. Web path unchanged. Fixes Android Expo Go uploads that were failing with opaque "Network request failed".
- **Storage RLS for posts bucket** (`supabase-storage-policies.sql`): public SELECT, authenticated INSERT/UPDATE/DELETE scoped to `<bucket>/images/<auth.uid()>/*` and `<bucket>/videos/<auth.uid()>/*`. Without these, supabase-js storage uploads fail with 403, which RN wraps as "Network request failed". Applied to live project 2026-04-26.
- **Blank post card fix** (`components/CachedImage.tsx`, `app/(tabs)/profile.tsx`, `hooks/posts-context.tsx`): `file://` and `content://` URIs route to placeholder instead of broken Image; profile grid prefers `media.thumbnail`; upload failures throw instead of silently persisting local URIs.
- **Comprehensive seed script** (`scripts/seed-test-data.ts`): added verification tier sampling (40/25/25/10 mix), fixed `city`/`state` columns that didn't exist in live schema. End-to-end seed now produces 70 profiles, 100 posts, 35 fitness tests with tier diversity, 5 group chats, etc.
- **Source control migration**: pushed to `github.com/Onlykrida/onlysports-platform` (private). The old `Anirudh-712/rork-onlysports-platform` is retained as `old-origin` remote pointer until manually cleaned. CI secrets transferred.

---

## Wave 2.10 — Speed & Power guided wrapper (shipped 2026-05-20)

Closed the UX asymmetry between Yo-Yo IR1 (two cards: guided audio + manual entry) and the six Speed/Power tests (manual entry only). Sprint 10/20/30/40m, Agility T-Test, and Vertical Jump now each show **Start Guided** + **Enter Manually** CTAs on the hub. The guided path walks athletes through what to bring, how to set up cones/wall, how to perform, and what to watch out for — then drops into the existing manual-entry form. Save tier stays `self_reported` (0.7×). Anyone can enter anything; the wrapper is instructional polish, not measurement.

- `constants/guided-test-instructions.ts` — protocol-correct copy for all 6 tests (needs / setup / how-to / common mistakes / attempts), seeded from `docs/RESEARCH_ATHLETE_TESTS_BY_SPORT.md` and standard sports-science test protocols
- `app/guided-test.tsx` — parameterized instructions screen, reads `testType` query param, redirects to `/beep-test` on unknown type
- `app/beep-test.tsx` — SPEED_POWER section refactored to single dual-CTA card per test (preferred over 12-card mirror of Yo-Yo's pattern, to avoid hub scroll bloat)
- `app/_layout.tsx` — `guided-test` route registered alongside other `beep-test*` routes

**Why light, not full sensor capture**: the v1.5 wedge (below) is the canonical sensor-based path that lifts these tests to `app_measured` (0.85×). Light wrapper buys a discoverable, scout-visible self-reported path during the multi-week v1.5 build window. Sprint and Vertical Jump entries should rise materially even at 0.7× confidence — more data, even discounted, beats no data. Direct measurement upgrade comes with v1.5's CMJ flight-time + sprint photo-finish work.

**Note on `app/beep-test-live.tsx`**: per Wave 2.5 above, this screen is described as "accelerometer-driven Yo-Yo IR1, sprint, agility, vertical jump" but the hub currently only routes Yo-Yo to it. Hooking sprint/agility/vertical jump into the live screen is part of v1.5 (sport-specific battery wedge), not this wave.

---

## Wave 3 — Supabase + AI polish (mostly DONE, was originally "Future")

### 3A. Supabase Sync — DONE

- Canonical schema applied to live project (`supabase-canonical-schema.sql`)
- Verification migration applied (`supabase-fitness-tests.sql`)
- Storage RLS policies applied (`supabase-storage-policies.sql`)
- Comprehensive seed runs cleanly: 50 athletes, 10 scouts, 5 coaches, 5 teams/academies, 100 posts, 20 opportunities, 437 follows, 35 fitness tests with tier mix

### 3B. Advanced AI — PARTIAL

- AIScoutCard wired into ScoutHome recommendations: DONE
- AI opportunity matching on opportunities tab: NOT YET
- AI Summary button on public profiles: NOT YET

### 3C. Polish — ONGOING

- Skeleton transitions: DONE (Wave 2.E)
- Error boundary per route: NOT YET
- Pull-to-refresh custom indicator: NOT YET
- Screen transition animations: NOT YET

---

## Wave 4 — Compliance & Trust (next, blocking on lawyer call)

This is the parental-consent + DPDP compliance work designed in this session's `/office-hours` run.

**Design doc**: `~/.gstack/projects/onlysports-platform/anirudhtumuluru-main-design-20260426-151849.md` (status DONE_WITH_CONCERNS, 7/10 after 2 adversarial review iterations)

**Approach**: "Tiered Trust" (Approach B from the design doc) — v1 ships Tier 1 (phone OTP) only. Tier 2 (Aadhaar offline-XML via IDfy/Karza) and Tier 3 (DigiLocker e-KYC) deferred to v1.5. ENUM column accepts all three values at v1 so no migration is needed when v1.5 lands.

**12-item scope** (per design doc § Recommended Approach):

1. Signup form changes — DOB required, parent's phone (if under 18), web/native date picker, T&C checkbox, remove "Skip for now" path for athletes
2. Profile state machine — `profiles.account_state` ENUM + visibility/RLS hangs off this
3. Schema migration — DOB → top-level `date NOT NULL`; `is_minor` via Postgres function (NOT a STORED generated column — `CURRENT_DATE` is STABLE not IMMUTABLE); new tables `consent_records`, `parental_acks`, `structured_interests`, `parent_tokens`
4. Privacy policy rewrite — COPPA-13 → DPDP-18, itemised purpose-bound data list, RGO, breach + retention + withdrawal language; counsel review cycle (~2 wks elapsed)
5. Identity-verification tier ENUM — parallel to `VerificationTier`, v1 ships only `phone_otp_verified` value
6. DM gate (Supabase RLS) — reject scout/coach/team/academy/brand → minor `messages` insert unless approved `structured_interests` row exists
7. Parent flow (3 screens + parent-token landing handler) — SMS-link → OTP → consent decisions, lives outside the `(auth)` route group
8. Consent-revocation cascade — internal SLA 7 days, statutory ceiling 90 days
9. Audit-log + retention infrastructure — versioned consent text per Rule 3
10. Feature-flag plumbing — new `features-context.tsx` (with DEFAULTS object), single flag `parental_consent_v1` for staged rollout
11. DLT registration + SMS template approval (TRAI requirement, 1–4 wks elapsed per language)
12. §9(3) behavioral-tracking gate for minors — analytics writes gated on `NOT is_minor`, AI recommender input vector restricted to declared profile fields, public/web noindex on minor profiles, never any "trending under-16" feeds

**12–14 wks elapsed timeline** for the full v1 (Tier 1 only). The longest critical-path external is DLT/SMS template registration; lawyer hour is ~2 wks of cycle time.

**Branch B contingency**: if Lawyer #3 returns "account creation IS processing under §9(1)", four scope items mutate (1, 2, 3, 11). Total impact: +1.5–2 wks. See § Branch B Scope Deltas in the design doc.

**Out of scope for Wave 4 v1** (split off as separate features):

- Scout-side tier classification (`verified_grassroots` / `verified_pro` / `verified_premium`) — peer-sized feature, own design doc
- POCSO §19 mandatory reporting handoff — operational doc + manual runbook for v1, automated SAHYOG integration v1.5
- CSAM hash-scanning on uploads (PhotoDNA / IWF)
- Under-15 face-blur default (edge-side MediaPipe)
- Parent-with-no-phone fallback (academy attestation channel, gated on scout-tier feature)
- Brand and Academy roles missing from `app/(auth)/role-selection.tsx` UI (5-min separate ticket)

**Real-world blockers Anirudh has to action** (Phase-6 assignment from the design doc):

1. Book the Ikigai Law / AZB privacy team / Spice Route Legal hour-long consult. Send the design doc + `docs/gbrain-seed/concepts/regulatory-compliance.md` + the 10 numbered lawyer questions. Specifically: Lawyer Q1 (DigiLocker sufficiency), Q2 (academy as Rule 10(a) reliable-details-held), Q3 (account creation = processing). Budget ₹15K–25K. Locks P3.
2. Ground research at LB Nagar / Madhapur / Manikonda before next Saturday — find a Vihaan-archetype 14-year-old and his mother. Spend 20 min watching her use her phone unassisted. Note phone make/model + OS, default UI language, whether she has email + DigiLocker, what an Aadhaar interaction looks like for her.

---

## v1.5 — Sport-specific fitness battery wedge (decided 2026-04-26)

CEO review (`/plan-ceo-review`) on `docs/RESEARCH_ATHLETE_TESTS_BY_SPORT.md` selected **Option C: Wedge** (5 cross-sport phone-measurable tests, all 7 sports, ~2 wks original estimate / ~4–6 wks honest estimate after outside-voice review).

**Locked test menu**:

1. CMJ vertical jump (MyJump-style flight-time, front camera + MediaPipe BlazePose)
2. Sprint splits 10m / 20m / 30m / 40m (Photo Finish pattern, finish-line camera + audio start cue)
3. GPS time trial (2km cricket / Cooper athletics / AIR-BT badminton pace target, `expo-location`)
4. Counter (60s CV count) — applies as football juggling, badminton wall-volley, basketball dribble. Each variant is a separate ML model + UX, the "single test" framing is shorthand
5. Spot accuracy % — applies as basketball spot-shooting, hockey drag-flick zones, football crossing, cricket bowling line+length. Same caveat: each variant is its own training data + tripod setup

All ship at `verification_tier='app_measured'` (0.85×) in the existing 4-tier system. Schema extension is additive (new `test_type` ENUM values on `fitness_test_results`). Reuses `constants/verification.ts`, `components/VerificationBadge.tsx`, `hooks/fitness-test-context.tsx`, `hooks/sensor-context.tsx`, `app/beep-test*.tsx` pattern.

### Trade-off accepted: §9(3) video-persistence exposure for under-18 athletes

The CEO review's outside voice flagged that tests 4 and 5 require video persistence for under-18 athletes, which DPDP §9(3) makes illegal without the Wave 4 parental-consent flow (substantive provisions live 13 May 2027). The recommendation was to split into v1.5a (scalar-only: CMJ + sprint splits + GPS, ships pre-Wave-4) + v1.5b (video tests, gated on Wave 4).

**Decision: ship the original 5-test wedge as-is, accept the §9(3) exposure window** (today through 13 May 2027 enforcement). Rationale: enforcement-timeline gamble + Wave 4 is itself blocked on lawyer + ground research, splitting v1.5 means waiting for the founder's own action. Future-Anirudh: if DPDP enforcement starts earlier than 13 May 2027 OR if your lawyer returns Lawyer #3 with the strict reading, v1.5b's video tests will need to be retroactively gated.

### v1.5 prerequisites (foundation work — ~2 days before any v1.5 screen code lands)

Code review on 2026-04-26 (`/code-reviewer`) flagged three P0s that block v1.5 saves on day one. These must land FIRST:

1. **`test_type` schema migration** (P0-1, ~1 day). Current `fitness_test_results.test_type CHECK (test_type IN (...))` only allows 5 values. Every v1.5 save (`cmj_jump`, `sprint_10m`, `gps_2km`, `juggling_count`, etc.) will reject with PG `23514 check_violation`. Fix: convert column to a real Postgres ENUM (`CREATE TYPE fitness_test_type AS ENUM (...)`) with the full v1.5 superset, OR drop+recreate the CHECK with the superset. Also reconcile `types/index.ts:318` `FitnessTestType` and `constants/fitness-test-data.ts:6` `TestType` (currently declared independently, will drift).

2. **Canonical schema reconciliation** (P0-2, ~half day). `fitness_test_results`, `verification_requests`, `test_attestations`, `scout_shortlist`, `profile_views`, `analytics_events`, `groups`, `group_members`, `group_messages` are referenced by code but missing from `supabase-canonical-schema.sql`. `scout_shortlist` doesn't exist in any SQL file at all. Fix: merge `supabase-*.sql` files into the canonical schema in dependency order, write the missing `scout_shortlist` migration, archive scattered files to `supabase/applied/`.

3. **Move Claude API server-side** (P0-3, ~1-2 days, also resolves a security finding). `EXPO_PUBLIC_ANTHROPIC_API_KEY` is bundled into the client (web devtools + IPA/APK extraction). Deploy a Supabase Edge Function as a Claude API proxy, rotate the current key. v1.5's CV pipeline will multiply Claude calls — fixing this BEFORE v1.5 ships matters.

**During v1.5 work** (concurrent, not blocking):

- **Refactor `saveTest` to single dispatch + extract `deriveVerificationTier`** (P1-1 + P1-3, ~half day). Single source of truth for verification tier. Required for the `coach_verified` sprint flow.
- **Promote `sensor-context.tsx` to a real context** (P1-2, ~half day). Currently `useRef`-based; won't survive cross-screen flows (camera-positioning → live capture → results).
- **GPS anti-cheat** (P1-5, ~3–5 days, already in v1.5 scope per D3). Implement `validateGpsAccelerometerCorrelation()`.
- **ESLint cleanup** (P1-4, ~30 min). 24 errors accumulated; `npm run lint -- --fix` for auto-fixable, manual for `react/no-unescaped-entities` + 2 `react/display-name`.
- **`console.log` without `__DEV__` audit** (P1-6, ~30 min). Several unguarded logs inflate production bundle.

**Revised v1.5 timeline**: 13–15 wks elapsed (from 12–14 wks). Two days of foundation work before any screen code lands.

### Open items for the engineering plan (`/plan-eng-review`)

1. **The "5 tests" is honestly 12** — 4 ML/CV variants for test 4, 4 ML/CV variants for test 5, plus the 3 scalar tests. Engineering scope should reflect that. ~4–6 wks elapsed including validation.
2. **MediaPipe RN runtime integration** — first-time addition. iOS Tasks API + Android Camera2 high-fps differ; both need code paths. ~1 week alone.
3. **Anti-cheat for GPS time trial** — accelerometer cross-check vs Strava-style spoofing on rooted Androids. Without this, `app_measured` on spoofed data is worse than no data. Required for the verification multiplier to mean anything.
4. **Junior norm tables** — research doc cites elite adult cutoffs; first 1000 users are 13–16. Plan 4–6 wks post-launch seeded norm-building with a "preliminary norms" UI label.
5. **MediaPipe runtime choice (path-dependent)** — `react-native-mediapipe` community wrapper vs raw Tasks API + native bridge. Once chosen, becomes load-bearing for every future on-device CV test (drag-flick zones, dribble counters, spot-shooting %). Pick deliberately.
6. **Per-sport test menu UX** — athlete sees their sport's tests by default, can browse all. Feature-flag `features.fitness_tests_v15`.
7. **Camera-tripod-positioning instruction screen** — the highest-friction UX step; the visual instruction IS the test. Recommend `/plan-design-review` before engineering.

### Design decisions (from /plan-design-review, 2026-04-27)

**Locked design calls** (full 7-pass review, score 3/10 → 8/10 after fixes):

1. **Test menu information architecture** — sport-aware sections with 'Show all tests' fold (D2). Cricketer sees Cricket section first, then Other Tests below. Per-sport mapping in `constants/fitness-test-data.ts`. Reuses existing beep-test card pattern (`app/beep-test.tsx:30-59`).

2. **Camera-positioning instruction screen** — net-new screen with: (a) all-caps page title "POSITION YOUR PHONE", (b) ASCII-style illustrated diagram showing phone-on-tripod + 2m distance + athlete in frame, (c) numbered ① ② ③ instructions, (d) primary CTA "I'M READY" (full-width green pill), (e) secondary "Need help? Watch 30s tutorial" link. The visual diagram IS the test instruction — the highest-leverage UX in the wedge.

3. **Live capture screen** — extends `app/beep-test-live.tsx` pattern. Adds: live camera preview with pose-detection skeleton overlay, green confidence ring with percentage when stable, "Pose stable for Xs" progress bar before countdown. 3-2-1-go countdown overlays the camera. Visual + haptic + audio countdown for accessibility.

4. **Result screen hierarchy** — extends `app/beep-test-results.tsx` pattern. Order:
   - Personal-best banner (only on PB) — Lucide `Trophy` icon, NO emoji
   - **ZONE LABEL** (Starter/Building/Rising/Strong/Elite/Unstoppable) — biggest type, green pill
   - Raw number (jump height in cm, sprint time, etc.) — secondary, large
   - VerificationBadge inline with tier multiplier shown
   - "vs your last result" delta (D3) — auto-flips to per-cohort percentile when (age, city, sport) cohort hits N=50
   - Growth-oriented copy hook: "Want to level up? See what Strong-zone jumpers do differently →" (links AI suggestions)
   - Two-button choice: [Test again] [Share with scout]

5. **Sprint two-screen flow** — athlete-side cue screen (audio "3-2-1 go!") + coach-side scrub screen (frame-stepping timeline with MARK START / MARK FINISH). Reuses pattern of `app/verify-result.tsx`. Coach role distinguishes via `verification_tier='coach_verified'`.

6. **Interaction state coverage** — full table built (loading/empty/error/success/partial × 5 screens). Empty states use never-demotivate copy ("Set your sport in profile to see tailored tests" not "No tests found"). Error states reuse existing toast/full-screen patterns from auth-context.

7. **New components** (4 net-new, integrated PR sequencing per D4):
   - `<TestResultZoneCard>` — zone label > tier badge > number > delta/percentile composition
   - `<CameraPositioningGuide>` — diagram + numbered list + CTA
   - `<PoseDetectionOverlay>` — confidence ring + percentage + stability bar
   - `<FrameScrubber>` — coach-side timeline + MARK frame buttons
     Each ships inline with its first consuming screen (D4 — integrated, not foundation PR).

8. **Accessibility commitments**:
   - Touch targets 44px min for all primary CTAs
   - `accessibilityLabel` on every test card (matches existing beep-test pattern)
   - Visual countdown overlays the audio "3-2-1 go" (hearing-impaired)
   - Haptic pulse on countdown ticks via `expo-haptics` (Vihaan-without-headphones)
   - Color contrast: athlete green `#30D158` on `#0a0a0a` is 9.5:1, exceeds WCAG AA

9. **Deferred to v1.6**:
   - Tablet form factor (mobile-fits-acceptably for v1.5)
   - Real per-cohort percentiles (auto-activate at N=50 per cohort)
   - Typography upgrade (no `fontFamily` defined anywhere → RN system default. Pre-existing AI-slop risk; project-wide TODO not v1.5-blocking)

10. **AI-slop blacklist**: 9/10 patterns clean. Two findings: (a) NO emoji in result screens — use Lucide icons (Trophy, Sparkles). (b) System-default typography is the "I gave up on typography" tell — TODO for project-wide, not v1.5-blocking.

### Telugu Titans research partnership (parallel non-engineering track)

The kabaddi-specific tests (30s raid loop, toe-touch precision, single-leg balance) are deferred from v1.5 engineering, BUT the research partnership should start in week 1 regardless. Research clock (IRB → data collection → peer review = 6–9 months) is independent of engineering clock. Outreach email to Telugu Titans S&C in week 1; the kabaddi paper is the durable moat in the entire research artifact.

---

## Wave 5 — Future (placeholder)

After Wave 4 ships:

- Scout-side tier classification (peer to Wave 4)
- AI opportunity matching (deferred from Wave 3B)
- AI Summary on public profiles (deferred from Wave 3B)
- Pull-to-refresh + screen transitions polish (deferred from Wave 3C)
- Error boundary per route
- POCSO §19 automated reporting (SAHYOG portal integration) — required by SSMI threshold (50L users), nice-to-have before
- CSAM hash-match scanning (PhotoDNA / IWF) — required by SSMI threshold; due-diligence floor for §79 safe harbour
- Under-15 face-blur default
- Parent-with-no-phone fallback (gated on scout-tier classification)

---

## Commands

```bash
npm start                          # Dev server (mobile) — alias: expo start
npm run start-web                  # Dev server (web)
npm run start-web-dev              # Web dev with DEBUG=expo* logging
npm run lint                       # expo lint
npx tsc --noEmit                   # TypeScript check (treat 0 errors as required)
npx tsx scripts/seed-test-data.ts  # Seed test data (additive, --cleanup to clear)
npx tsx scripts/nuke-and-seed.ts   # Reset DB + reseed (destructive)
```

No test runner is configured by design (CLAUDE.md). Verification = `npx tsc --noEmit` + `npm run lint` + manual browser/device testing.

## Key Files

- Theme: `constants/theme.ts`
- Types: `types/index.ts`
- Supabase: `constants/supabase.ts`
- Verification tiers (foundational pattern): `constants/verification.ts`
- AI service: `services/ai.ts`
- All contexts: `hooks/*-context.tsx`
- Tab layout: `app/(tabs)/_layout.tsx`
- Root layout: `app/_layout.tsx`
- Canonical schema: `supabase-canonical-schema.sql`
- Verification migration: `supabase-fitness-tests.sql`
- Storage RLS: `supabase-storage-policies.sql`

## Design Artifacts

- `docs/gbrain-seed/INDEX.md` + `SYNTHESIS.md` — knowledge graph entry point
- `docs/gbrain-seed/concepts/regulatory-compliance.md` — DPDP / POCSO / IT Rules / UAE PDPL deep-dive (45KB, citation-grade)
- `docs/gbrain-seed/concepts/india-gtm-playbook.md`, `kabaddi-moat.md`, `indian-football-ecosystem.md`
- `docs/gbrain-seed/companies/competitor-landscape.md`, `competitor-deep-dive-2026.md`
- `docs/gbrain-seed/people/scouts-and-academies.md`
- `~/.gstack/projects/onlysports-platform/anirudhtumuluru-main-design-20260426-151849.md` — parental-consent design doc (Wave 4)
- `docs/PRD_OnlyKrida.md`, `BRD_OnlyKrida.md`, `TRD_OnlyKrida.md` — full product / business / technical requirements
- `docs/UX_COMPETITIVE_RESEARCH.md`, `ROLE_SPECIFIC_INTERFACES.md`, `GROWTH_PLAN.md`, `CRITICAL_IMPROVEMENTS.md`, `RESEARCH_ML_PLAYER_STATS.md`
