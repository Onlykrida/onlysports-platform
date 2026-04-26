---
type: concept
title: OnlyKrida — product and architecture decisions log
tags: [decisions, architecture, product, phase1]
---

Running log of significant product and architecture decisions. Compiled truth
on top, timeline of decisions below. Check this before making choices that
might conflict with past decisions.

**Stack decisions (locked):**

- React Native Expo + Expo Router v4: chosen for cross-platform mobile with
  web capability. Expo Router v4 gives file-based routing similar to Next.js.
- Supabase: chosen for auth + DB + storage + real-time in one. RLS policies
  enforced at database level — not application level.
- TanStack React Query v5: server state management. Zustand v5 for UI-only state.
- NativeWind v4: Tailwind in React Native. Consistent design tokens across platform.
- TypeScript strict mode: non-negotiable. `any` treated as build error.

**Rejected alternatives:**

- Firebase: rejected — vendor lock-in, pricing unpredictability at scale, weaker RLS
- Redux: rejected — over-engineering for this use case. React Query + Zustand covers it.
- Expo Go: rejected for production — use EAS Build for production builds
- Web-first (Next.js): rejected — mobile is the primary Indian sports consumer device

**Phase scoping decisions:**

- Phase 1: player profiles + basic verification + media upload. No scout tools yet.
  Rationale: build supply (players) before demand (scouts). Classic marketplace sequencing.
- ML scoring: deferred to Phase 5. Need real data before building scoring models.
  Anirudh has Argentine football analytics factor analysis as reference framework.
- Payments: deferred to Phase 4. Free-first to drive adoption.
- Vernacular (Hindi, Telugu): planned, not Phase 1. English-first MVP.

**Data decisions:**

- DPDP Act 2023 compliance: required. India's data protection law. No US-style
  surveillance advertising model.
- Player age verification: required before profile goes public. Under-18 players
  need parent/guardian consent (one of the 9 roles).
- Video hosting: Supabase Storage for now. May migrate to Cloudflare Stream at scale.

**The verification-first principle:**
Profiles are invisible until verified. Prevents fake profiles inflating numbers.
Verification sources: Aadhaar (identity), school/club certificates (affiliation),
coach attestation (performance claims). This is a trust differentiator vs competitors.

---

- 2026-Q1: Stack finalized (React Native Expo + Supabase)
- 2026-Q1: Phase 1 scaffolded with 21 tables, 9 roles
- 2026-Q1: Verification-first principle established
- 2026-Q1: DPDP compliance flagged as non-negotiable constraint
