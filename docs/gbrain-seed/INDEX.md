---
type: index
title: OnlyKrida gbrain-seed — index
tags: [index, gbrain, deep-research]
---

Knowledge-graph seed for OnlyKrida. Two cohorts:

- **Original seed** (shipped in `onlykrida-ai-setup.zip`, April 2026) — high-level primers.
- **Deep-research expansion** (generated 2026-04-26) — sourced, implementation-grade dossiers.

To import into gbrain after install: `for f in **/*.md; do gbrain put "${f%.md}" < "$f"; done`.

## Product

- [`product/soul.md`](product/soul.md) — mission, name origin, business model, the Warangal test. _Original seed._
- [`product/decisions.md`](product/decisions.md) — locked stack decisions, rejected alternatives, phase scoping log. _Original seed — superseded in part by current codebase; verify before quoting._

## Companies

- [`companies/competitor-landscape.md`](companies/competitor-landscape.md) — 1-page primer covering SportVot, Khelo India, EliteFootball, Hudl/Wyscout, WhatsApp informal layer. _Original seed._
- [`companies/competitor-deep-dive-2026.md`](companies/competitor-deep-dive-2026.md) — **2026-current deep-dive.** Adds AiSCOUT × RFYC, KhiladiPro ($1M, 2025), StepOut ($1.5M Rainmatter Pre-Series A, 2025), CricHeroes, KheloMore, Game Theory, ScoutMe (AIFF), Tonsser as the closest international analog. 2x2 positioning map + per-competitor posture (partner / compete / ignore / acquire) + top-5 threat register. Flags `EliteFootball India` as effectively a phantom — no demonstrable Indian product activity.

## People

- [`people/scouts-and-academies.md`](people/scouts-and-academies.md) — **partnership map.** 13 ISL clubs (incl. Hyderabad FC → Sporting Club Delhi relocation Oct 2025, CFG divestment from Mumbai City Dec 2025), I-League / state-league academies (Sreenidi Deccan as the new Hyderabad ISL-tier anchor), cross-sport (JSW IIS, RFYC, Padukone-Dravid CSE, GoSports), 12 PKL franchise owners, federation leadership (AIFF/BCCI/AFI/Hockey India/BAI/BFI/AKFI), named scouts, district-funnel events, Hyderabad activation map. Top-10 outreach list ranked by leverage × Anirudh-accessibility.

## Concepts

- [`concepts/indian-football-ecosystem.md`](concepts/indian-football-ecosystem.md) — 1-page primer on the AIFF/SAI/state pyramid. _Original seed._
- [`concepts/kabaddi-moat.md`](concepts/kabaddi-moat.md) — **moat thesis: confirmed.** Zero HF datasets, AKFI digitally absent, PKL has no structured pipeline. Telugu Titans recommended as first PKL franchise (Hyderabad geo + Mahesh Kolli ownership). Wedge: 2,500-clip raid-action dataset published as `onlykrida/kabaddi-raid-actions-v1`. Caveat: Yuva Kabaddi Series is a real adjacent — partner, don't compete.
- [`concepts/regulatory-compliance.md`](concepts/regulatory-compliance.md) — **DPDP / POCSO / IT Rules 2021 / UAE PDPL / DIFC** implementation brief. DPDP Rules notified 13 Nov 2025 → substantive obligations live 13 May 2027 (13 months runway). Verifiable parental consent for under-18s is the single biggest engineering call (Rule 10 — Aadhaar offline-XML / DigiLocker / Consent Manager). Five implementation tables + launch checklist. Penalty ceiling ₹200 cr.
- [`concepts/india-gtm-playbook.md`](concepts/india-gtm-playbook.md) — **6-month launch playbook.** Hyderabad-20 named-ground list, 5 schools + 3 colleges, BDFA Super Division for Bengaluru, UAE diaspora ₹999/yr tier, 5 viral loops with kill thresholds, dated activation calendar (TG20 → Subroto Cup → Khelo India), 50-KPI dashboard, month 3/6/12 kill-criteria gates.

## Cross-cutting

- [`SYNTHESIS.md`](SYNTHESIS.md) — one-page founder synthesis: the five non-obvious cross-cutting findings + Anirudh's first-30-days action list.

## What still needs research

Gaps the people-doc agent flagged for the next pass:

- FIFA-licensed agents resident in India (only 2026 exam-pass list is partially public).
- Women's football pipeline (IWL clubs, Indian Women's Football League — under-covered in this dossier).
- Dubai/UAE academy + scout layer (only the diaspora-school side is in the GTM doc).
- Full AIFF "five-star" academy list with named directors (current dossier covers four-star + select five-star).
- Telugu Titans' actual scouting workflow (needs warm intro, not desk research).

---

- 2026-04-26: Initial expansion. Original 4 seed files + 5 new deep-research dossiers + INDEX + SYNTHESIS.
