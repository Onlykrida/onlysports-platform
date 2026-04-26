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
