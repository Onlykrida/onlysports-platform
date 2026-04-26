---
type: concept
title: OnlyKrida — cross-cutting synthesis from the 2026-04-26 research pass
tags: [synthesis, founder, strategy, hyderabad, dpdp, kabaddi, gtm]
---

One-page synthesis of five deep-research dossiers (competitor / people / kabaddi / regulatory / GTM). The individual files are the receipts; this is the so-what.

## Five non-obvious findings

### 1. Anirudh's home-city ISL anchor disappeared in late 2025

Hyderabad FC was relocated to Delhi as **Sporting Club Delhi (BC Jindal Group)** in October 2025. The "Hyderabad FC Academy is geographically aligned" line in the original seed is no longer load-bearing. Replacement anchors for Hyderabad-first GTM:

- **Sreenidi Deccan FC** (I-League, Hyderabad-based) — now the highest-tier pro football institution Anirudh can walk into.
- **Telugu Titans** (PKL, owner Mahesh Kolli / Greenko) — the only top-tier Hyderabad pro franchise, and the kabaddi-moat strategy's natural partner.

Cross-references: _people/scouts-and-academies.md_ §1, _concepts/kabaddi-moat.md_ §strategic-pick, _concepts/india-gtm-playbook.md_ Hyderabad section.

### 2. The strongest threat to OnlyKrida is already inside India — and it's foreign

**AiSCOUT (UK-based vision-AI scouting platform) is running 2025/26 trials with Reliance Foundation Young Champs (RFYC).** Reliance's distribution + AiSCOUT's tech is the textbook way an entrant can leapfrog OnlyKrida before it scales. Two India-funded competitors raised in 2025 — KhiladiPro ($1M, MGA Ventures + Shastra) and StepOut ($1.5M Pre-Series A, Rainmatter/Zerodha) — are narrower but better-capitalised. Window to differentiate is open but not for long.

Cross-reference: _companies/competitor-deep-dive-2026.md_ threat register.

### 3. DPDP gives 13 months of runway, but the verifiable-consent build is the long pole

**DPDP Rules notified 13 Nov 2025; substantive obligations live 13 May 2027.** Today is inside the grace window. The single longest engineering project is **verifiable parental consent for under-18 athletes** (Rule 10): a checkbox does not count — Aadhaar offline-XML, DigiLocker e-KYC, or a registered Consent Manager (the framework goes live 13 Nov 2026) is required. Penalty ceiling: ₹200 crore.

This is also why pose data (`ml_extractions` table) needs an architectural decision _now_: tag it `data_class='biometric'`, FK to a specific consent record, never re-purpose without re-consent, edge-side face-blur on under-18 uploads.

Cross-reference: _concepts/regulatory-compliance.md_ §3 + implementation tables.

### 4. The cheapest moat is a kabaddi dataset, not a kabaddi feature

Zero datasets exist on Hugging Face. AKFI was digitally absent until the Feb 2025 Supreme Court restoration; the federation is rebuilding rather than competing. Pro Kabaddi auctions hit a ₹1-crore record in Season 12 but the discovery layer is still WhatsApp clips + travel to Sonipat. **₹3–5 lakh capex** to capture and publish `onlykrida/kabaddi-raid-actions-v1` (~2,500 raid-action clips) makes OnlyKrida the default citation for any future kabaddi vision-AI work — a structural advantage no competitor will catch up to once published.

Caveat: **Yuva Kabaddi Series** (26 teams, 3 divisions, FanCode-streamed) is a legitimate adjacent. Partner, don't compete.

Cross-reference: _concepts/kabaddi-moat.md_ §wedge-product + 12-month plan.

### 5. The GTM has explicit kill criteria — keep them

The GTM playbook's most under-rated section is the month-3/6/12 kill-criteria sheet. Founders almost always overshoot timelines by ignoring early signal; a written floor (e.g. month 3 — verified-weekly-connections must hit a numeric threshold or pivot away from the current sport / city) is what makes a 6-month plan honest. Read this section before any "let's give it another month" debate.

Cross-reference: _concepts/india-gtm-playbook.md_ kill-criteria.

## Anirudh's first 30 days (composite from all 5 docs)

Ranked by leverage × calendar urgency.

1. **Email Sreenidi Deccan FC + Telugu Titans (PKL) for warm intros.** First two pro-tier Hyderabad partners. _(week 1)_
2. **Book a 1-hour DPDP lawyer consult (₹15K–₹40K range).** Take the 10 questions in `regulatory-compliance.md` §9. _(week 1)_
3. **Stand up the verifiable-consent UI track.** Aadhaar offline-XML or DigiLocker integration + an under-18 parent-double-opt-in flow. This is the longest engineering pole. _(weeks 2–6)_
4. **Capture phase 1 of the kabaddi dataset.** Partner with one Hyderabad/Sonipat akhada; budget ₹2L for first 500 clips. Validate the labelling pipeline before scaling to 2,500. _(weeks 2–6)_
5. **Run the Hyderabad-20.** 20 named-ground visits during May; closed-beta seed of 50 athletes. The GTM playbook has the named list. _(weeks 1–4)_
6. **Subroto Cup activation prep.** Aug 2026 is the national hook; partnership / sponsorship slot needs Q2 lead time. _(weeks 3–4)_
7. **Acknowledge AiSCOUT × RFYC publicly in roadmap framing.** Position OnlyKrida as the _open_ counterpart — Indian-owned data, multi-academy, not single-sponsor — before AiSCOUT's narrative locks. _(week 2)_

## What this research did NOT settle

- Whether `EliteFootball India` truly has any product activity (the deep-dive could not surface any).
- The actual scouting workflow inside Telugu Titans (needs a warm intro — desk research can't close it).
- Dubai/UAE academy + scout layer beyond the diaspora-school side (GTM has the consumer side; partnership side is a research gap).
- FIFA-licensed agents resident in India (only the 2026 exam-pass list is partially public).
- Women's football pipeline (IWL clubs, women's national setup) — under-covered.

These are flagged in `INDEX.md` "What still needs research".

---

- 2026-04-26: Initial synthesis from 5-agent deep-research pass.
