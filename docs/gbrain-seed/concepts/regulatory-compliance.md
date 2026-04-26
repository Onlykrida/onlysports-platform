---
type: concept
title: OnlyKrida — DPDP/POCSO/IT Rules compliance deep-dive
tags: [compliance, legal, dpdp, pocso, india, uae, deep-research]
---

> **Status as of 2026-04-26.** Not legal advice. Verify every load-bearing claim with Indian privacy counsel before shipping. The DPDP Rules were notified 13 Nov 2025 and most substantive obligations come into force on 13 May 2027 — OnlyKrida sits inside the grace period today, so the right strategy is **build the control plane now and flip it on at launch**, not panic-retrofit in 2027.

## 1. Why this document exists

OnlyKrida is, in regulatory shorthand, the worst possible combination of risk surfaces: **a social platform, with biometric/ML pipelines, dominated by minors (12–17), bridging adults (scouts/coaches) to those minors, with cross-border ambitions (India → UAE), and revenue-bearing transactions (premium scout features, possibly agent-adjacent activity).**

Every single one of those tags maps to a separate Indian regulator: MeitY (DPDP), MWCD/NCPCR (POCSO), MeitY again (IT Rules 2021 intermediary), MYAS (Sports Governance Act 2025, NADA Bill 2025), state governments (gambling/betting), and increasingly the Online Gaming Authority of India ([PROG Act 2025](https://en.wikipedia.org/wiki/Promotion_and_Regulation_of_Online_Gaming_Act,_2025)).

This brief is for engineering. Generic "appoint a DPO" advice is dropped — every clause below either ships as code, ships as schema, or ships as a designated person.

---

## 2. DPDP Act 2023 + DPDP Rules 2025 — operational mapping

### 2.1 Status check (April 2026)

- Act enacted 11 Aug 2023; Rules notified by MeitY on **13 Nov 2025** ([PIB notification](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2190655)).
- Phased commencement: Data Protection Board of India + foundational provisions live **13 Nov 2025**; Consent Manager registration framework live **13 Nov 2026**; substantive Data Fiduciary obligations + Data Principal rights + breach reporting live **13 May 2027** ([Shardul Amarchand Mangaldas summary](https://www.amsshardul.com/insight/enforcement-of-the-dpdp-act-and-notification-of-the-dpdp-rules/), [Hogan Lovells](https://www.hoganlovells.com/en/publications/indias-digital-personal-data-protection-act-2023-brought-into-force-)).
- **Implication for OnlyKrida**: 13 months of runway from today (April 2026) to the substantive go-live. Build right; don't ship a non-compliant product and "fix later."

### 2.2 Personal data vs sensitive personal data — the surprise

DPDP **does not have a sensitive-personal-data tier**. Section 2(t) defines "personal data" as any data about an identifiable individual, full stop. The old SPDI Rules 2011 distinction (passwords / financial / health / biometrics / sexual-orientation as "sensitive") technically still exists for pre-DPDP IT Act purposes but DPDP collapses everything into one bucket ([Latham & Watkins comparison](https://www.lw.com/admin/upload/SiteAttachments/Indias-Digital-Personal-Data-Protection-Act-2023-vs-the-GDPR-A-Comparison.pdf), [SNR Law analysis](https://www.snrlaw.in/sense-and-sensitivity-sensitive-information-under-indias-new-data-regime/)).

For OnlyKrida this means: **biometric pose data, fitness scores, video, height/weight, location, age, contact details — all governed identically.** No "we treat fitness data more loosely because it's not sensitive." Everything that can identify the athlete needs the same consent framework.

### 2.3 Consent + Notice — what Rule 3 actually demands

[Rule 3 of DPDP Rules 2025](https://www.dpdpa.com/dpdparules/rule3.html) requires the consent notice be:

1. **Standalone** — understandable independently of any other document. So a privacy policy hyperlinked from your existing T&Cs is not enough; the consent screen at signup needs to carry the substantive content.
2. **Itemised** — list the specific personal data fields collected. Not "your data," but "Name, DOB, Email, Phone, Profile photo, Highlight videos, Height, Weight, Position, City, Fitness test scores, Pose extraction data."
3. **Purpose-specific** — explain _which_ product feature consumes _which_ data. "Pose extraction is used to compute fitness zones shown to you and to scouts who shortlist you" passes; "to improve our services" fails.
4. Carry **(a)** the link to withdraw consent, **(b)** the means to file grievance with the Data Fiduciary, **(c)** the route to file a complaint with the [Data Protection Board of India](https://prsindia.org/billtrack/the-information-technology-intermediary-guidelines-and-digital-media-ethics-code-rules-2021).

**Do not** bundle scout-discovery consent with basic-account consent — purpose-bound granularity matters when an athlete later wants to pause scout visibility.

### 2.4 Children's data — Section 9 + Rule 10 (most load-bearing for OnlyKrida)

[Section 9](https://www.dpdpa.com/dpdpa2023/chapter-2/section9.html) sets three hard rules for users under 18:

- **9(1)** — Data Fiduciary "shall, before processing any personal data of a child … obtain verifiable consent of the parent of such child or the lawful guardian."
- **9(2)** — No processing "likely to cause any detrimental effect on the well-being of a child."
- **9(3)** — **No tracking, no behavioural monitoring, no targeted advertising directed at children.** This is absolute.

India defines a child as anyone **under 18** ([Children's Data analysis, K&S](https://ksandk.com/data-protection-and-data-privacy/childrens-data-protection-under-indias-dpdp-rules/)), broader than COPPA's <13. The vast majority of OnlyKrida's grassroots target market sits in this bracket.

[Rule 10](https://www.dpdpa.com/dpdparules/rule10.html) defines "verifiable consent" via three accepted paths:

1. **Reliable details already held** by the Data Fiduciary about the parent (e.g., they're already a registered adult on the platform).
2. **Direct voluntary disclosure** of identity + age, _backed by_ a reliable identity check.
3. **Virtual token mapped to identity issued by an authorised entity** — practically meaning DigiLocker-issued credentials or an entity authorised by the Central Government as a Consent Manager.

**Practical engineering implication**: a parent self-declaring "I am the parent and I'm 35" via a checkbox is **not** verifiable consent. You need at minimum DigiLocker integration, an Aadhaar-backed e-KYC flow, or partnership with a registered Consent Manager once that framework goes live (13 Nov 2026).

There are narrow Rule 12 exemptions for healthcare/educational/childcare fiduciaries — **OnlyKrida does not qualify** ([medianama](https://www.medianama.com/2025/01/223-data-protection-rules-2025-children-data-india/)). One useful carve-out: real-time location tracking of a child _for child safety_ is permitted without re-consent ([medianama 2025-11](https://www.medianama.com/2025/11/223-dpdp-rules-real-time-child-tracking-without-consent/)) — relevant if you ever add a "share live location with parent during trial" feature.

**Penalty for getting this wrong: up to ₹200 crore** ([CyberPeace blog](https://cyberpeace.org/resources/blogs/prohibition-of-behavioral-tracking-and-targeted-advertising-for-children-under-the-dpdp-act-2023)).

### 2.5 Cross-border transfer

DPDP S.16 takes the **negative-list** approach: cross-border transfer is permitted by default to _anywhere_ unless the Central Government notifies a specific country/territory as restricted. **No such list has been notified as of April 2026** ([Mondaq, Dec 2025](https://www.mondaq.com/india/data-protection/1764976/from-localisation-debates-to-a-negative-list-making-cross-border-data-transfers-work-under-indias-dpdp-act), [ELP Dec 2025](https://elplaw.in/wp-content/uploads/2025/12/Cross-border-data-transfers-under-the-DPDP-Act-what-businesses-need-to-know.pdf)).

**For OnlyKrida**: Supabase EU/US hosting, Anthropic API (US), Sentry, etc. are all currently fine. But:

- Section 16 still applies the _core_ DPDP obligations (consent, purpose limit, breach reporting) wherever data sits.
- **Sectoral laws can still demand localisation** — RBI mandates payment data localisation; if OnlyKrida ever processes scout subscription payments via UPI/cards, those payment records must stay in India ([Baker McKenzie](https://resourcehub.bakermckenzie.com/en/resources/global-data-and-cyber-handbook/asia-pacific/india/topics/international-data-transfer)).
- For UAE expansion, transfers between India ↔ UAE need contractual safeguards (see §7).

### 2.6 Right to erasure

Athletes (or their parents, for minors) get the right to demand deletion when the original purpose has been fulfilled. Engineering pattern: a `DELETE /me` endpoint that **hard-deletes** the user's profile, posts, comments, fitness results, ML extractions; **soft-keeps** anonymised aggregates needed for fraud prevention or legal record retention; and **breaks the FK chain** on any scout shortlists (replace with a tombstone "Athlete deleted their profile").

Resolution timeline: **90 days** under [Rule 14](https://www.scrut.io/post/dpdp-rules).

### 2.7 Significant Data Fiduciary (SDF) trigger

Section 10 lets the Government designate any Data Fiduciary as significant based on volume, sensitivity, risk to electoral democracy, public order, etc. ([dpdpa.com SDF guide](https://www.dpdpa.com/blogs/significant_data_fiduciary_sdf_dpdpa_guide.html)).

No published numerical threshold yet, but the working consensus from law firms is:

- ~50 lakh+ Indian Data Principals processed
- Or annual revenue > ₹250 crore
- Or "sensitive nature" data + scale

OnlyKrida hits the SDF profile early because it processes **biometric-adjacent data of minors** — the Government can designate at any volume on the grounds of "data of sensitive nature." Plan for SDF-grade obligations from year 2:

- **Annual DPIA** (Data Protection Impact Assessment) — Rule 13.
- **Independent audit** annually.
- **Algorithmic risk audit** — relevant for the AI scouting recommender. Document Claude prompts, fairness checks, and athlete-impact analysis.
- **Designate a DPO based in India**, reporting to the Board ([progressive.in](https://www.progressive.in/blog/dpdp-rules-2025-explained/)).

### 2.8 Breach notification — 72 hours

[Rule 7](https://www.scrut.io/post/dpdp-rules) creates a two-stage process:

- **Stage 1**: notify Data Protection Board "without delay" upon discovery, on best-knowledge basis, plus notify affected Data Principals.
- **Stage 2**: detailed report to DPB within **72 hours** (origin, mitigation, remediation, evidence of user notifications) ([IAPP](https://iapp.org/resources/article/operational-impacts-of-indias-dpdpa-part10)).

Engineering implication: keep a `security_incidents` table with strict columns, and a runbook that prefills the DPB form. Don't try to draft the report under pressure at hour 70.

---

## 3. POCSO Act + JJ Act — content moderation rules for a minor-heavy platform

### 3.1 The hard floor

POCSO 2012 + 2019 amendments + IT Act §67B together define an absolute prohibition on child sexual abuse material (CSAM). Section 67B punishes **creation, collection, transmission, distribution, publication, exchange, or possession** of CSAM in any electronic form — first conviction up to 5 years and ₹10 lakh, subsequent up to 7 years ([z cybersecurity overview](https://zcybersecurity.com/section-67b-of-it-act-explanation/), [Bihar Legal](https://legal.bihar.in/section-67a-67b-it-act-punishment-for-obscene-and-csam-content/)).

POCSO §19 imposes **mandatory reporting**: any person who has knowledge or apprehension of an offence shall report to Special Juvenile Police Unit (SJPU) or local police. Failure to report = imprisonment up to 6 months and/or fine ([Wikipedia](https://en.wikipedia.org/wiki/Protection_of_Children_from_Sexual_Offences_Act), [CRY](https://www.cry.org/blog/understanding-pocso-act/)). **This binds OnlyKrida's moderation team and its officers — not just users.**

### 3.2 Reporting channels OnlyKrida must wire up

- **NCPCR POCSO e-Box** — [direct online portal](https://ncpcr.gov.in) for child abuse complaints.
- **National cybercrime portal** — `cybercrime.gov.in` (incl. "Report CSAM" track).
- **SAHYOG portal** (launched 2024) — MHA's automation layer for takedown orders to intermediaries ([SS Rana on NHRC advisory](https://ssrana.in/articles/nhrcs-advisory-proliferation-of-child-sexual-abuse-material-csam/)). Register here — failure to act on a SAHYOG order strips intermediary safe harbour under IT Act §79.
- **NCMEC CyberTipline** — cross-border channel; many Indian intermediaries also report there. Note: NCMEC reporting is not a substitute for Indian SJPU reporting ([Lexology Indian regulatory env](https://www.lexology.com/library/detail.aspx?g=29763e57-5c79-4129-9b49-ed04bf2be10d)).
- **State SCPCRs** (State Commissions for Protection of Child Rights) — relevant when an incident has a clear state nexus (e.g., Karnataka SCPCR for Bengaluru-based athletes).

### 3.3 OnlyKrida-specific implementation rules

These are **opinionated calls** — confirm with counsel:

| #   | Rule                                                                                                                                                                                                                                                                                       | Why                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Default profile visibility for under-18 = "athletes + verified scouts/coaches" only.** Public-internet search visibility OFF until 18 (or parent opts in).                                                                                                                               | Prevents the platform from broadcasting minor-identifying content to the open web — the riskiest CSAM/grooming surface.                                                                                |
| 2   | **Highlight videos of minors must allow optional face-blur.** App-side, on-device, before upload. Default ON for under-15.                                                                                                                                                                 | Reduces the identifiability surface; aligns with EDPB GDPR video guidance; soft-mitigates §67B exposure if a video is misused downstream.                                                              |
| 3   | **Adult ↔ minor DM = restricted by default.** Scouts/coaches/teams **cannot DM** an under-18 athlete; they can only send a structured, templated "interest" message that the parent/guardian inbox receives. Free-form chat unlocks at 18 OR after explicit guardian opt-in per-recipient. | Mirrors UK Online Safety Act + Australian eSafety patterns and is the single largest grooming-vector mitigation.                                                                                       |
| 4   | **Background-check gate for adult roles touching minors.** Scouts/coaches must complete a `verification_status` workflow (PAN + Aadhaar e-KYC + selfie liveness + AIFF/BCCI/SAI affiliation document where applicable) before shortlisting any minor.                                      | Not strictly mandated by current law but expected under upcoming National Sports Governance Act safeguarding rules; _and_ is the single fact you will most want to point to when something goes wrong. |
| 5   | **Hash-match scan on every video upload** against the IWF/NCMEC PhotoDNA / IFC hash sets. Microsoft and Cloudflare both expose APIs.                                                                                                                                                       | Section 79 safe harbour now requires "due diligence" — proactive scanning is the de facto floor.                                                                                                       |
| 6   | **24h moderator review SLA on any reported minor content + auto-quarantine on first report.**                                                                                                                                                                                              | Aligns with IT Rules 4(1)(d) and the IT Rules 2021 24-hour acknowledgement window.                                                                                                                     |

### 3.4 Crucially: don't ever build certain features

- **No nudity/partial-nudity classifier with "borderline" buckets that get shown to humans.** Build it as: classifier → if positive, hard-quarantine + auto-report to SJPU + notify legal. Never to a moderation queue in Slack.
- **No "tagging" of minors by other users.** Tags must be self-declared.
- **No public-feed "trending athletes under 16" lists** — this is exactly the discoverability surface POCSO §11 (sexual harassment incl. repeated following) was designed to deter.

---

## 4. IT Act 2000 + Intermediary Rules 2021 — what status OnlyKrida holds

### 4.1 OnlyKrida is an "intermediary" — almost certainly

Anyone who "receives, stores, or transmits" third-party content qualifies. User posts, videos, comments, DMs all qualify. So OnlyKrida gets safe-harbour under IT Act §79 _if_ it complies with [IT Rules 2021](https://prsindia.org/billtrack/the-information-technology-intermediary-guidelines-and-digital-media-ethics-code-rules-2021) due-diligence requirements:

| Obligation                                                                 | Spec                                                                 | Source           |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------- |
| Publish T&Cs, privacy policy, user agreement                               | Must list prohibited content categories explicitly                   | Rule 3(1)(a)–(b) |
| Take down on government/court order within **36 hours**                    | Wire up SAHYOG                                                       | Rule 3(1)(d)     |
| Acknowledge user grievance within **24 hours**, resolve within **15 days** | This is your support SLA                                             | Rule 3(2)(a)     |
| Designate a **Resident Grievance Officer (RGO)**                           | Indian resident, contactable, name + email + phone published on site | Rule 3(2)(a)     |
| Preserve takedown logs for **180 days**                                    | Audit table                                                          | Rule 3(1)(g)     |

### 4.2 SSMI threshold — when OnlyKrida becomes "Significant Social Media Intermediary"

Threshold: **50 lakh (5 million) registered users in India** ([Lexology](https://www.lexology.com/library/detail.aspx?g=ce42bc50-72ec-4749-a1d2-5284656ddecc), [PRSIndia](https://prsindia.org/billtrack/the-information-technology-intermediary-guidelines-and-digital-media-ethics-code-rules-2021)).

Once OnlyKrida crosses, additional obligations kick in:

- **Chief Compliance Officer (CCO)** — Indian resident, criminally liable for non-compliance.
- **Nodal Contact Person** — for 24x7 coordination with law enforcement.
- **Resident Grievance Officer** — already required, but at SSMI scale must publish monthly transparency report.
- **Proactive identification of CSAM and rape/non-consensual intimate imagery** using "automated tools" — i.e., the hash-scan rule in §3.3 is no longer optional.
- **Traceability of first originator** (for messaging-service SSMIs only — not relevant unless OnlyKrida ever launches an end-to-end-encrypted DM).

**Plan-of-record**: assume OnlyKrida hits SSMI by end of year-2 if growth targets are met. The CCO/RGO/NCP triad needs to be hired before, not after.

---

## 5. DPDP × biometric / pose / video — the surface OnlyKrida cares about most

### 5.1 Is pose-extraction biometric data?

**Conservative answer: yes, treat it as biometric.** Reasoning chain:

- DPDP doesn't separately classify biometric, but Rule 3 of the SPDI Rules (still alive for IT Act purposes) does include "biometrics" as sensitive ([dlapiperdataprotection IN](https://www.dlapiperdataprotection.com/?t=law&c=IN)).
- The relevant test from EDPB and academic privacy work on pose: if the data permits _unique identification_ of an individual (gait signature, body proportions, joint kinematics → re-identifiable across videos), it falls in the biometric category ([Foley & Lardner on pro-sports biometric privacy](https://www.foley.com/insights/publications/2025/05/gauging-professional-sport-biometric-data-privacy-concerns/), [arXiv DP-pose](https://arxiv.org/html/2504.10190v4)).
- Skeletal pose at sufficient resolution + temporal sampling **is re-identifying** (gait recognition is a known biometric modality). Pose at low resolution / aggregated to scalar metrics (e.g., "vertical jump = 62 cm") is not.

**OnlyKrida's `ml_extractions` table should therefore:**

- Tag every row `data_class = 'biometric'`.
- Capture **purpose-bound consent at upload time** with the _specific_ purposes ("compute fitness zones; show to scouts you accept; train aggregate models with strict de-identification") and a "withdraw" link that triggers a full re-extract delete.
- Never use this data for any _other_ purpose without a fresh consent action.
- Never sell or share with third parties (advertisers, sponsors) — even in aggregate — without re-consent.
- Apply a higher retention bar: delete raw pose vectors after the source video is deleted; keep only the derived scalar zone score if needed for historical progression UI.

### 5.2 Face features captured incidentally

A video upload contains face data even if you only want pose. Three options ranked by compliance robustness:

1. **Edge-side blur**: face-detect on-device (MediaPipe Face Detector ships under 2 MB, runs on RN), blur before upload. The cleanest path because you never receive face data in the first place.
2. **Server-side strip**: face-detect → blur → discard pre-blur artifact. Acceptable if you log the destruction.
3. **Store raw, rely on access control**: legally weakest. Only do this for athletes 18+ who explicitly consent to "show face in highlights to scouts."

Your current schema (per `RESEARCH_ML_PLAYER_STATS.md`) is closer to #3. Recommend moving under-18 uploads to #1 by default, with parental opt-out.

### 5.3 What needs explicit "purpose-bound" consent in the UI

Each of these is a separate consent toggle, not a single bundled opt-in:

- Pose extraction & fitness scoring (functional)
- Sharing fitness scores with scouts (discovery)
- Sharing highlight videos with scouts (discovery)
- Using my data, in aggregated/de-identified form, to improve recommendations (analytics)
- Using my data to train external/third-party AI models (ML training — likely off by default)

---

## 6. Sports-specific regulation

### 6.1 NADA — anti-doping

Most grassroots OnlyKrida users are **not** in NADA's Registered Testing Pool ([NADA India 2025](https://nadaindia.yas.gov.in/)). RTP is reserved for high-performance athletes meeting specific criteria. But if OnlyKrida ever has athletes selected to a national camp / TOPS / Khelo India elite category, those athletes' whereabouts data starts flowing through ADAMS.

**Practical**: add an `athlete_classification_level` field (`grassroots | district | state | national | international`). For `national` and above, surface a banner: "You may be in NADA's Registered Testing Pool. OnlyKrida does not share your data with NADA, but you remain bound by your sport federation's whereabouts obligations."

The [National Anti-Doping (Amendment) Bill 2025](https://prsindia.org/billtrack/the-national-anti-doping-amendment-bill-2025) passed Lok Sabha 11 Aug 2025, broadens NADA's powers but does not impose direct obligations on third-party platforms.

### 6.2 Age fraud — BCCI/AIFF/SAI

This is one of the platform's biggest credibility levers. BCCI 2025 amended its Age Verification Programme to **require Aadhaar + photo + TW3 bone test, with a mandatory second bone test where the first is contested** ([The Week](https://www.theweek.in/news/sports/2025/06/20/cricket-bcci-amends-existing-bone-test-rule-to-tighten-age-authentication-amid-vaibhav-suryavanshi-row.html), [SportsTak](https://thesportstak.com/amp/cricket/india-tour-of-england-2025/story/bcci-takes-big-action-curb-age-fraud-introduces-second-bone-test-for-junior-players-heres-how-revamped-age-verification-rule-works-seas-3182257-2025-06-20)). AIFF and SAI run analogous protocols.

The Khelo India [NSRS](https://nsrs.kheloindia.gov.in/) issues a **Khelo India ID (KID)** keyed to Aadhaar — the de facto national athlete ID. SAI's NSRS publishes [DigiLocker-issued certificates](https://kheloindia.gov.in/uploads/khelo_india_digilocker.pdf) for KIYG/KIUG participation.

**OnlyKrida implementation**:

- Add a `kid_number` field on `profiles` (nullable, validated against NSRS format).
- When the user provides KID, mark `age_verified_via = 'kid'` and `dob_source = 'aadhaar_verified'` — this is the strongest age signal you can carry.
- For users without KID, fall back to **Aadhaar + parent attestation** as the verification chain; flag everyone else as `age_verified_via = 'self'` with a visible "unverified age" pill on profiles seen by scouts.

### 6.3 Public Gambling Acts + PROG Act 2025

The [Promotion and Regulation of Online Gaming Act 2025](https://en.wikipedia.org/wiki/Promotion_and_Regulation_of_Online_Gaming_Act,_2025), notified by MeitY on 22 Apr 2026 with rules effective 1 May 2026 ([Online Gaming Rules 2026](https://www.businessleague.in/online-gaming-rules-2026-india-notification-new-authority-to-curb-money-games/)), creates a federal ban on **online money gaming** and a registration framework for **e-sports**.

OnlyKrida is _not_ a money-game platform, but two adjacent risks need policy guardrails:

- **Scout ↔ athlete payment talk in DMs.** If a scout sends "₹50k for 10 wickets in a match," that's match-fixing/spot-fixing under IPC §415 (cheating) read with state-specific gambling laws and the BCCI Anti-Corruption Code. Platform liability if you know and don't act. **Rule**: a content-moderation classifier that flags messages containing payment + match-outcome adjacency to a 24h human review queue. Document the flag-and-action loop.
- **Advertising restrictions.** PROG Act bans advertising of online money games. Sponsors who push for "Dream11-style" promo on athlete profiles need to be hard-blocked. Add a `sponsor_category_blocklist` server-side.

State-level: Tamil Nadu, Andhra Pradesh, Telangana have banned all online real-money games regardless of skill/chance distinction ([ICLG India 2026](https://iclg.com/practice-areas/gambling-laws-and-regulations/india)). If OnlyKrida ever monetises via fan-tipping with cash, the state-by-state legal map matters.

### 6.4 Athlete representation — agent licensing

[FIFA Football Agent Regulations 2023](https://www.the-aiff.com/article/applications-invited-for-fifa-football-agent-exam-2) require any person representing a football player or club to hold a FIFA agent licence (annual exam, 75% pass mark, USD 200k revenue cap above which 3–6% service-fee cap applies). [AIFF Football Agent Regulations 2023](https://www.the-aiff.com/media/uploads/2023/09/AIFF_Football-Agent-Regulations_2023.pdf) layer on India-specific eligibility checks.

**OnlyKrida implication**: if the platform ever facilitates a football-agent-style transaction (athlete signs with agent through OnlyKrida), the agent must be FIFA-licensed and AIFF-registered. Add a `role = 'agent'` profile type with a required `agent_license_number` + uploaded licence document, validated against the AIFF public register. Cricket has no equivalent licensing regime (BCCI registers agents internally) — leave that as a doc-upload gate without external verification.

### 6.5 Sports broadcasting

[Sports Broadcasting Signals (Mandatory Sharing with Prasar Bharati) Act 2007](https://www.indiacode.nic.in/handle/123456789/2076?locale=en) governs _broadcasters_, not user-uploaded content. But: if an OnlyKrida user uploads a clip from a match broadcast (Star Sports, JioCinema), that's **third-party copyright** and a takedown risk. Pre-existing platform pattern: Content-ID style fingerprint match on upload; auto-strip audio that matches commercial broadcast audio fingerprints; reject upload if visual match is high-confidence.

### 6.6 National Sports Governance Act 2025

[NSG Act 2025](https://en.wikipedia.org/wiki/National_Sports_Governance_Act,_2025) (Lok Sabha 11 Aug, Rajya Sabha 12 Aug 2025) creates the National Sports Board, mandates Athletes Committees, Ethics Committees, grievance redressal at every recognised federation, and a formal recognition pipeline for national/regional federations. Critics specifically called out that it **fails to establish athlete rights over biometric and performance data** ([Law School Policy Review Oct 2025](https://lawschoolpolicyreview.com/2025/10/06/assessing-the-national-sports-governance-act-2025-towards-sustainable-and-safe-sport-from-streets-to-stadiums-in-india/)).

For OnlyKrida this is a tailwind not an obligation: the gap the Act leaves around athlete biometric/IP rights is exactly where the platform can build a stronger contractual frame ("athlete owns their pose data, OnlyKrida holds it as bailee"). Codify in the T&Cs.

---

## 7. UAE + Dubai (secondary market)

### 7.1 Federal PDPL — the baseline

[Federal Decree-Law 45 of 2021](https://uaelegislation.gov.ae/en/legislations/1972/download) ("PDPL") came into force 2 Jan 2022. As of 2025 the executive regulations remain unpublished ([DLA Piper UAE](https://www.dlapiperdataprotection.com/countries/uae-general/law.html)), so enforcement is soft — but the substantive obligations apply.

Cross-border to/from the UAE:

- Outbound: permitted to "adequate" countries (whitelist by the UAE Data Office, which does not yet have a final list); otherwise SCC-style contract, explicit consent, contractual necessity, or public interest gates ([CookieYes UAE PDPL](https://www.cookieyes.com/blog/uae-data-protection-law-pdpl/)).
- Inbound: India → UAE is not blocked. But the Indian DPDP cross-border negative list (when notified) might in future restrict outbound from India; assume unrestricted today, monitor.

### 7.2 DIFC + ADGM — only matter if you incorporate there

[DIFC Data Protection Law No. 5 of 2020](https://www.difc.com/business/laws-and-regulations/legal-database/difc-laws/data-protection-law-difc-law-no-5-2020), amended by Amendment Law No. 1 of 2025 (effective 15 Jul 2025) — GDPR-grade rights, statutory damages cause of action ([Kennedys analysis](https://www.kennedyslaw.com/en/thought-leadership/article/2025/the-dubai-international-financial-centre-amends-the-data-protection-law-emea/)). [ADGM Data Protection Regulations 2021](https://www.dlapiperdataprotection.com/countries/uae-general/law.html) similar.

**Decision rule**: only incorporate in DIFC/ADGM if you need their corporate/financial benefits. The Federal PDPL alone covers UAE Mainland operations.

### 7.3 UAE Child Digital Safety — specific to OnlyKrida

[Federal Decree-Law No. 26 of 2025 on Child Digital Safety](https://uaeahead.com/uae-it-law-updates-2026-guide/) imposes additional age-gate, data minimisation, and content controls for under-18 users on digital platforms. OnlyKrida's POCSO-grade controls (§3) will largely satisfy this, but flag for legal review at UAE launch.

### 7.4 Practical take

A single privacy framework that meets DPDP + POCSO + IT Rules 2021 will satisfy UAE PDPL (which is less strict). Don't fork the codebase per jurisdiction; keep one consent UI, gate region-specific bits via feature flags.

---

## 8. The engineer's checklist

This is the "implement against this" section. Each row maps regulation → user-facing UX → schema → operational/people artifact.

### 8.1 Identity, age, consent

| #   | Regulation                                                   | UX                                                                                                                                                                                                              | Schema                                                                                                                                                                              | Operational                                                                                           |
| --- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| C1  | DPDP §6 + Rule 3 — itemised consent notice                   | Standalone signup screen listing every data category collected (Name, DOB, Phone, Email, Photo, Highlights, Height, Weight, Position, City, Fitness scores, Pose vectors), each with one-line purpose statement | `consent_records (user_id, consent_id, purpose_key, granted_at, withdrawn_at, version, locale, snapshot_text)` keyed per purpose                                                    | Maintain a versioned `consent_text/<lang>/<version>.md` repo; new versions trigger re-prompt          |
| C2  | DPDP §9 + Rule 10 — verifiable parental consent for under-18 | If `dob` indicates under 18: hard-gate signup behind a parent flow. Parent enters their phone → OTP → DigiLocker e-KYC OR Aadhaar offline-XML verification                                                      | `profiles.guardian_user_id`, `profiles.guardian_consent_at`, `profiles.guardian_verification_method ENUM('digilocker','aadhaar_xml','consent_manager','platform_existing_account')` | Integration with DigiLocker API (free, govt) or NSDL e-KYC partner; budget ₹3–5 per verification      |
| C3  | DPDP §9(3) — no behavioural tracking of minors               | When `is_minor=true`, disable: targeted ads, third-party analytics SDKs, recommendation algorithms that profile based on behavior                                                                               | Config flag `analytics.allowed_for_minors=false`; verify in `useAnalytics` hook                                                                                                     | Quarterly review by RGO that no new SDK has been added without minor-gate                             |
| C4  | DPDP Rule 14 — grievance & rights                            | "My Data" screen: Download all data (JSON export); Correct profile; Delete account; Withdraw specific consent; File grievance                                                                                   | `data_subject_requests (user_id, type ENUM('access','correction','erasure','withdraw_consent','grievance'), filed_at, resolved_at, resolution_text, sla_breach_flag)`               | RGO + DPO own this queue; 90-day max resolution; weekly stand-up; auto-escalate at day 75             |
| C5  | DPDP Rule 7 — breach notification                            | Status page + in-app banner if ever breached + email                                                                                                                                                            | `security_incidents (id, discovered_at, classification, affected_user_count, dpb_notified_at, users_notified_at, root_cause, remediation_steps)`                                    | Runbook: detect → assess → notify DPB ASAP → send 72h follow-up. Tabletop quarterly.                  |
| C6  | DPDP §32 — DPO contact                                       | Footer + Privacy page + every consent screen lists DPO email                                                                                                                                                    | static config                                                                                                                                                                       | Designate DPO before May 2027 (SDF threshold may force earlier). Indian resident, reports to founders |

### 8.2 Content moderation, POCSO, IT Rules

| #   | Regulation                                          | UX                                                                                                                                                                      | Schema                                                                                                                                                             | Operational                                                                                                   |
| --- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| M1  | POCSO §19, IT §67B — CSAM hash-match                | Silent on success; on positive match: upload rejected with neutral "couldn't process this video" + auto-incident                                                        | `csam_scans (upload_id, scanned_at, scanner ENUM('photodna','iwf','custom'), result, action_taken)`; never store the suspect file                                  | Microsoft PhotoDNA + IWF API integration; auto-report to NCPCR e-Box + SJPU within 24h via templated workflow |
| M2  | IT Rules 3(2)(a) — 24h ack / 15-day resolve         | "Report this content" modal; user gets email confirmation within minutes; status link                                                                                   | `content_reports (id, reporter_id, target_kind, target_id, reason, ack_at, resolved_at, action ENUM('removed','warned','dismissed','escalated'))`                  | RGO owns the queue; SLA dashboard; monthly transparency stat                                                  |
| M3  | IT Rules 4(1)(j) — 36h takedown on govt/court order | Internal admin tool; user gets a redacted notice "removed pursuant to legal order"                                                                                      | `takedown_orders (id, source ENUM('court','sahyog','meity','npd'), order_id, target_id, received_at, actioned_at)`                                                 | SAHYOG portal registration; legal team monitors inbox; CCO signs off at SSMI scale                            |
| M4  | POCSO + DPDP §9 — adult↔minor DM restriction        | Scouts/coaches/teams cannot DM minors directly. They send a "structured interest" message that lands in the parent inbox + a copy in the minor's inbox marked read-only | `messages.allowed=false WHERE recipient.is_minor AND sender.role IN ('scout','coach','team') AND NOT structured_interest`; `parental_consents_per_recipient` table | Edge case: 16+ minors with parent opt-in get free DMs. Document the override flow.                            |
| M5  | POCSO + IT Rules — adult background check           | Scouts/coaches: signup gate at "before you can search/contact athletes" with required PAN + Aadhaar e-KYC + selfie + (optional) AIFF/BCCI/SAI affiliation upload        | `verification_status (user_id, level ENUM('basic','kyc','federation','disputed'), evidence jsonb, verified_by, verified_at)`                                       | Manual review for federation tier; automated for KYC tier                                                     |
| M6  | POCSO §11 + DPDP §9(3) — no minor "trending" lists  | No "top 10 under-16" feeds anywhere                                                                                                                                     | Feature-flag `feeds.minor_trending=false` (always)                                                                                                                 | UX review checklist before any new public feed ships                                                          |
| M7  | Default minor visibility                            | Under-18 profiles indexed only inside the platform, not on Google/web. Public scout-only view by default                                                                | `profiles.discoverability ENUM('private','platform_only','public')`; default `'platform_only'` for under-18                                                        | robots.txt + meta `noindex` for under-18 profile URLs                                                         |

### 8.3 Biometric & ML pipeline

| #   | Regulation                       | UX                                                                                               | Schema                                                                                                                             | Operational                                                                                      |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| B1  | DPDP §6 + biometric treatment    | Toggle at upload: "Extract pose & fitness data from this video" with full purpose-bound text     | `ml_extractions.consent_id` FK to `consent_records`; `ml_extractions.data_class='biometric'`; `ml_extractions.purpose_keys text[]` | DPIA before launching pose extraction; documented Claude/MediaPipe model versions and data flows |
| B2  | DPDP retention limits            | "When do we delete this?" wording in consent text                                                | `ml_extractions.delete_after timestamptz` (computed; default = source-video deletion + 30 days)                                    | Cron job; verified by DPO quarterly                                                              |
| B3  | Edge-side face blur for under-18 | App-level: faces auto-blurred in upload preview; toggle to "show face" requires guardian consent | Client-side; server records `face_blur_applied=true` and the version of the blur model                                             | Periodic accuracy review of face detector; manual fallback path                                  |
| B4  | DPDP §11 — withdraw consent      | "Withdraw pose data consent" button per video                                                    | Cascading delete of `ml_extractions` rows + recompute athlete fitness rollups                                                      | SLA: 7 days end-to-end                                                                           |

### 8.4 Cross-border, sports-specific, agent

| #   | Regulation                           | UX                                                                                  | Schema                                                                                                  | Operational                                                                                                                        |
| --- | ------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| X1  | DPDP §16 cross-border                | Privacy policy lists where data is hosted (Supabase US/EU, Anthropic US, Sentry US) | n/a                                                                                                     | Monitor MeitY negative-list notifications quarterly; have a 30-day plan to migrate Supabase region if a host country is restricted |
| X2  | RBI payment localisation             | Razorpay/Stripe-India for any rupee payments                                        | n/a                                                                                                     | Don't process payments outside India                                                                                               |
| X3  | NADA whereabouts (informational)     | Banner on `national+` athlete profiles                                              | `profiles.athlete_classification_level`                                                                 | n/a — informational only                                                                                                           |
| X4  | BCCI/AIFF/SAI age verification       | "Verified age via Khelo India ID" badge                                             | `profiles.kid_number`, `profiles.age_verified_via ENUM('kid','aadhaar_xml','self','federation_doc')`    | Validate KID format; future: NSRS partnership for live verification                                                                |
| X5  | PROG Act 2025 — money-game adjacency | Content classifier flags messages with payment + match-outcome adjacency            | `flagged_messages (id, classifier_score, reason, reviewed_by, action)`                                  | 24h human review SLA                                                                                                               |
| X6  | AIFF/FIFA agent licensing            | `role=agent` requires licence upload                                                | `profiles.agent_license_number`, `profiles.agent_license_doc_url`, `profiles.agent_license_verified_at` | Manual verification against AIFF public register                                                                                   |
| X7  | UAE PDPL on UAE expansion            | Region-aware consent text (slightly different wording for UAE users)                | `consent_records.locale`                                                                                | Re-export consent text to `ar-AE` and `en-AE`                                                                                      |

### 8.5 People you must designate

| Role                                   | Trigger                                                                     | Responsibilities                                              | When                                            |
| -------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| **Resident Grievance Officer (RGO)**   | IT Rules 2021 from day 1 of being an intermediary                           | 24h ack, 15-day resolve, name+email+phone published           | Before public launch                            |
| **Data Protection Officer (DPO)**      | DPDP §32 (mandatory for SDF; recommended for everyone with children's data) | DPDP compliance, breach response, DPIAs, training             | Before May 2027; if SDF designated, immediately |
| **Chief Compliance Officer (CCO)**     | IT Rules 2021 — SSMI threshold (50 lakh users)                              | Personal criminal liability for non-compliance with takedowns | Before crossing 5M users                        |
| **Nodal Contact Person (NCP)**         | Same as CCO                                                                 | 24x7 LEA coordination                                         | Before crossing 5M users                        |
| **Child Safety Officer / POCSO point** | POCSO best practice (not strictly mandatory)                                | Owns the §3.3 controls; trained on POCSO §19 reporting        | Before public launch                            |

### 8.6 Audit log retention (the boring but load-bearing list)

| Data type                    | Retention               | Reason                      |
| ---------------------------- | ----------------------- | --------------------------- |
| Consent records              | Lifetime + 7 years      | DPDP burden of proof        |
| Auth/login logs              | 180 days minimum        | IT Rules 2021 §3(1)(g)      |
| Takedown actions             | 180 days minimum        | IT Rules 2021 §3(1)(g)      |
| CSAM scan results (positive) | Permanent (legal hold)  | POCSO evidence preservation |
| Breach incident records      | 7 years                 | DPDP + insurance            |
| Grievance/DSR records        | 3 years post-resolution | DPDP audit trail            |
| Payment records              | 8 years                 | Income Tax Act + RBI        |

---

## 9. What still needs an Indian privacy lawyer (1–2 hour consult, ₹15K–₹40K)

Send the lawyer this list, not "review our compliance":

1. **Verifiable parental consent — does DigiLocker e-KYC alone satisfy Rule 10, or do we also need the parent's relationship to the child evidenced (school certificate, ration card)?** Costs scale 5× if relationship proof is needed.
2. **Are we an "intermediary" or a "publisher" under IT Act §2(1)(w)?** Material question — the AI scout-recommendation surface arguably "publishes" curated lists. Publisher status = no §79 safe harbour.
3. **Pose data classification — biometric or not?** Settle this so the DPIA footing is firm.
4. **Sports-data ownership clause for the T&Cs.** Specifically: does the athlete (or, for minors, the parent) own raw video and derived pose data, with OnlyKrida as bailee? This is the cleanest model and survives both DPDP and the gap in NSG Act 2025.
5. **Are we processing data for "clinical or healthcare establishment" purposes when we measure fitness?** If yes (long shot but worth asking), Rule 12 exemptions for children's data widen materially.
6. **PROG Act 2025 — does our scout subscription model risk classification as "online money game" facilitation?** Almost certainly no, but get the no in writing.
7. **POCSO §19 mandatory reporting — does the platform's officer-level liability extend to founders, or only to a designated person?** Determines whether you appoint a single CSO or all founders sit on the hook.
8. **SAHYOG portal registration mechanics + service agreement.** Get the lawyer to do the actual filing.
9. **UAE PDPL applicability** — does India-incorporated OnlyKrida processing UAE data trigger PDPL extraterritorially? (Probably yes once you target UAE users.) If so, what governance vehicle (UAE branch vs. mainland LLC vs. ADGM)?
10. **Cross-border negative list watch** — retainer arrangement to alert within 7 days if MeitY notifies a list affecting Supabase host regions.

Rate guidance, April 2026 Bengaluru market:

- **Boutique privacy practice (e.g., Ikigai Law, AZB privacy team, Spice Route Legal)**: ₹15K–₹25K for a focused 1-hour call covering 4–5 of these.
- **Tier-1 law firm partner (Cyril, Shardul, Khaitan)**: ₹40K–₹75K for the same hour. Worth it if you need a memo you can show investors.
- **Senior associate at the same firms**: ₹15K–₹25K and competent for items 1–6.
- **For a defensible written DPIA**, budget ₹2L–₹5L all-in (boutique).

Skip the in-house Big-Four advisory pitch unless you need an "audit-grade" report for a future SDF audit — they will quote ₹15L+ for what a boutique does in ₹3L.

---

## 10. One-page implementation checklist

Print this. Stick on the wall.

```
PRE-LAUNCH (must ship before public launch)
[ ] RGO designated + name/email/phone in app footer
[ ] T&Cs + Privacy Policy with Rule 3 itemised consent notice
[ ] Signup age gate; under-18 → guardian flow with DigiLocker/Aadhaar XML
[ ] Per-purpose consent toggles (no bundling)
[ ] "My Data" screen (export / correct / delete / withdraw / file grievance)
[ ] CSAM hash-scan on every video upload
[ ] Adult-role background-check gate before contacting minors
[ ] Adult↔minor DM restriction (structured interest only)
[ ] Default minor profile visibility = platform-only, noindex
[ ] Edge-side face blur default-on for under-18 uploads
[ ] Content reporting flow (24h ack, 15-day resolve)
[ ] Audit-log tables for consent, takedowns, DSRs, incidents
[ ] Breach runbook + DPB notification template

YEAR 1 (within 12 months of launch)
[ ] DPO appointed (Indian resident)
[ ] DPIA completed for ML/pose pipeline
[ ] SAHYOG portal registration
[ ] Quarterly compliance review with privacy counsel
[ ] First annual transparency report (best-practice)
[ ] DigiLocker integration audited
[ ] NSRS / Khelo India ID integration

YEAR 2 (or upon hitting 50L Indian users — whichever first)
[ ] CCO designated (criminally liable; Indian resident)
[ ] Nodal Contact Person 24x7 LEA channel
[ ] Monthly transparency reports
[ ] Annual third-party privacy audit
[ ] Algorithmic-risk audit on AI scout recommender
[ ] Re-DPIA on every material model change
[ ] Insurance: cyber-incident + D&O cover negotiated

ONGOING
[ ] Monitor MeitY negative-list notifications (cross-border)
[ ] Monitor Online Gaming Authority of India bulletins
[ ] Monthly RGO grievance dashboard review
[ ] Quarterly tabletop on breach response
[ ] Annual T&Cs / Privacy review against new rules
[ ] Penalty exposure tracker reviewed each quarter
```

---

## 11. Changelog

- **2026-04-26** — initial document. Authored against DPDP Rules 2025 (notified 13 Nov 2025), POCSO Act 2012 + 2019 amendments, IT Rules 2021, PROG Act 2025 + Online Gaming Rules 2026 (notified 22 Apr 2026), National Sports Governance Act 2025, NADA Amendment Bill 2025, BCCI Age Verification Programme 2025-26 revisions, UAE PDPL (Federal Decree-Law 45/2021) + DIFC DP Law amendments effective 15 Jul 2025 + UAE Federal Decree-Law 26/2025 (Child Digital Safety). Next scheduled review: when the DPDP substantive provisions go live (target date 13 May 2027) or upon Online Gaming Authority of India issuing additional rules — whichever first.

---

**Disclaimer**: This document is a research-grade compliance brief for OnlyKrida engineering and product use. It is not legal advice. Specific implementations, particularly around verifiable parental consent, age verification, biometric data classification, and CSAM reporting workflows, must be reviewed and signed off by qualified Indian privacy counsel before deployment. Several questions tagged in §9 require explicit lawyer input.
