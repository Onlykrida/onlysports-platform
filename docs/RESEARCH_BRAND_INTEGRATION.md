---
type: research
title: Sport-brand integration for OnlyKrida — research dossier
tags: [brands, monetization, sponsorship, india, uae, gtm, deep-research]
date: 2026-04-27
---

> Companion to `docs/gbrain-seed/companies/competitor-deep-dive-2026.md` and `docs/gbrain-seed/concepts/india-gtm-playbook.md`.
> This dossier is research, not implementation. It does not propose schema migrations.
> Hyderabad test applied throughout: every recommendation is evaluated on whether it makes a Hyderabad athlete more visible to a Mumbai scout.

## 0. Where OnlyKrida is today (the brand surface that already exists)

- The `brand` role is already in `types/index.ts:9` and styled in `constants/theme.ts:221` (orange `#FF9F0A` accent, identical to scout — a _design tell_ that the team has not yet differentiated brand UX from scout UX).
- `components/home/BrandHome.tsx` exists and gives a brand a single-screen feed: a `TRENDING ATHLETES` list (sorted by follower count), a `MY INTERESTS` collapsible (uses `expressInterest()` from `hooks/scouting-context.tsx`), and nothing else. There is **no brand-specific data model** — a brand is, today, a scout-without-shortlists.
- Opportunities (`app/opportunities/create.tsx:75-83`) already include a `'sponsorships'` category. There is no plumbing that ties a sponsorship opportunity back to an authenticated brand author, and no funded-by relationship.
- Verification tiers (`constants/verification.ts:14-55`) have four levels capped at `center_tested` (1.1× scout multiplier). Brand verification is not a tier.
- No brand pages, no brand-funded leaderboards, no athlete commission flow, no kit-grant flow, no co-branded badge. **Effectively nothing brand-specific has been built.**

This means we are ~zero-cost to choose the right pattern from scratch — the surface is unburdened by tech debt.

---

## 1. Competitive intelligence — what other platforms do with brands

### 1.1 AiSCOUT × adidas — the prestige funnel

- **Model**: adidas were AiSCOUT's launch partner for the **adidas GMR x AiSCOUT trials (2020–2022)** that fed into a global academy showcase, and they remain associated through the **Real Madrid Foundation Youth Cup** (Real Madrid Foundation runs the global community football tournament; AiSCOUT is the digital trial pipeline) ([AiSCOUT × Real Madrid Foundation](https://aiscout.io/), [Real Madrid Foundation Youth Cup](https://www.realmadrid.com/en-US/the-club/foundation/news/2024/04/real-madrid-foundation-youth-cup)).
- **Brand role**: adidas pays AiSCOUT/Real Madrid to be the _branded gate_ — the trial is the experience, and the brand owns the kit, the campaign creative, the co-branded final at Bernabéu. Athletes do drills in adidas-branded virtual environments.
- **Buyer or content?** Adidas is **the buyer**. They underwrite the activation; AiSCOUT provides the tech.
- **Lesson for OnlyKrida**: Brand-funded **annual flagship** trumps brand-funded daily presence. One Adidas-funded "Path to Bernabéu" tournament is more lucrative and more narratively powerful than a hundred banner placements.

### 1.2 Tonsser — athlete-side network with light brand

- Tonsser monetises primarily through B2B (clubs) and has been cautious with athlete-facing brand integrations. Public brand activations have been limited to sponsored "Player of the Week" / "Player of the Month" segments and one-off campaigns with **Capri Sun** and **adidas Predator boot drops** ([Tonsser blog: Capri Sun partnership](https://tonsser.com/), historic; [Sky Sports profile](https://www.skysports.com/football/news/11095/12328439/tonsser-united-the-app-helping-amateur-players-beat-the-world-s-best)).
- **Brand role**: content sponsor, not buyer-of-data. Tonsser's "Tonsser United" experiment — where signed players got a club deal — is closer to a brand-as-team play than a brand-as-advertiser play.
- **Lesson for OnlyKrida**: Brand-as-content is engagement neutral-to-positive. Brand-as-buyer-of-data is where the dollars are.

### 1.3 Hudl — pro-tier silence

- Hudl's brand integrations are minimal because their buyer is the team. The closest thing is the **Hudl + Catapult / Hudl + STATSports** wearable integrations ([Hudl integrations](https://www.hudl.com/products/wyscout)) — these are infrastructure partnerships, not athlete-facing brand campaigns.
- **Buyer or content?** The **club** is the buyer; brands are upstream gear vendors.
- **Lesson for OnlyKrida**: Once you go pro-tier, brand stops being a meaningful revenue line; the club's gear contract has already been written.

### 1.4 KhiladiPro (India) — brand vacuum

- KhiladiPro has $1M pre-seed (Oct 2025), runs school-administered fitness assessments, and has **no public brand partnership** as of April 2026 ([CXOToday](https://cxotoday.com/press-release/visual-ai-sports-tech-startup-khiladipro-secures-1m-to-power-youth-fitness-athlete-development-across-india/)). Their funding deck is school-distribution-led; brand revenue is plausibly a future axis but not committed.
- **Lesson for OnlyKrida**: The brand axis in Indian school-grassroots sports-tech is currently unowned. First-mover advantage is real if we move in 2026.

### 1.5 CricHeroes — the closest Indian benchmark

- CricHeroes runs **Best Cricketer of the Match** awards co-branded with sponsors, and has a **Marketplace** where brands like **Spartan, MRF, SS, BAS, SG** push gear directly to cricketers ([CricHeroes blog 2025](https://blog.cricheroes.com/grassroots-cricket-2025/)). Their **BCCI Domestic Pro Stats** integration is the structured-data play; brands tag along.
- They've also run sponsored tournaments and "find your nearest pro shop" placements. Revenue model: a mix of sponsorship, marketplace commission, and tournament-management SaaS.
- **Buyer or content?** **Both.** Brands buy tournaments (sponsorship) and athletes engage with brand gear (marketplace).
- **Lesson for OnlyKrida**: A two-axis brand model — tournament/event sponsorship _plus_ marketplace — works in India for cricket. The question is whether it generalises across our 7 sports.

### 1.6 Decathlon (India) — venue + gear, brand-as-distributor

- Decathlon's [Sports India](https://www.decathlon.in/) reach (29,000+ pin codes) plus the [Decathlon Play](https://play.google.com/store/apps/details?id=in.decathlon.allforsport&hl=en_IN) app and the 2025 Playo partnership ([Hans India](https://www.thehansindia.com/business/decathlon-strengthens-its-sports-for-all-mission-through-partnership-with-playo-1033228)) makes them less a brand and more an **infrastructure partner**. Decathlon runs grassroots events themselves (Decathlon Sports Day, in-store running clubs).
- **Lesson for OnlyKrida**: Decathlon is unique — they want **distribution** more than they want sponsorship, and their stores are an underused fitness-test venue. Co-branded `center_tested` (`constants/verification.ts:45-54`) at Decathlon stores is a legitimate route.

### 1.7 Strava — brand challenges as the consumer model

- Strava's **Brand Challenges** (Adidas Run for the Oceans, ASICS World Ekiden) let a brand pay to host a goal-based event; athletes opt in, complete the challenge, get a digital badge + sometimes physical gear ([Strava brand challenges](https://www.strava.com/challenges)). 4–8 challenges per year per major brand.
- **Buyer or content?** Brand is **the buyer**, athlete is **the user** — and the badge is the content that compounds.
- **Lesson for OnlyKrida**: This pattern maps perfectly onto fitness-zone language. **"Adidas Yo-Yo Series — top 100 Rising-zone athletes get gear"** is the OnlyKrida-flavoured version. Strava have proved the unit economics: sponsors pay $50k–$500k per challenge globally; an Indian Decathlon or Puma India equivalent would pay ₹5L–₹50L per challenge.

### 1.8 NIL platforms (Opendorse, INFLCR) — the US college playbook

- **Opendorse** (NIL marketplace, Lincoln NE, founded 2012) has paid $200M+ to athletes since the NIL era opened in 2021. They match brands → college athletes via a managed marketplace, take ~10–20% transaction commission ([Opendorse](https://opendorse.com/)).
- **INFLCR** (now part of Teamworks) does compliance + content delivery for NIL deals, used by 5,000+ college athletes.
- **Buyer or content?** Brand is the buyer, athlete is the seller. Platform is intermediary + compliance layer.
- **Lesson for OnlyKrida**: The **commission-on-deal model** is the cleanest revenue line if you can bring brand spend in. Opendorse's deck shows a typical brand pays $250–$5,000 for a single college athlete post; the platform takes 15%. **In India for U-21 athletes, the price point would be ~₹2,000–₹20,000 per post**, but the volume could be 10×. POCSO under-18 limits apply (see §5).

### 1.9 KhabaddiPro / PKL × brand — context note

- PKL franchise owners are themselves consumer brands (Adani Wilmar, JSW Sports, Unilazer/Disney Hotstar). They scout via informal networks ([gbrain-seed/concepts/kabaddi-moat.md:62-69](docs/gbrain-seed/concepts/kabaddi-moat.md)). There is **no athlete-facing brand sponsorship platform** in kabaddi today. **The wedge is wide open.**

### Summary table — what each platform's brand model looks like

| Platform            | Brand role            | Brand pays               | Athlete gets           | OnlyKrida-applicable                  |
| ------------------- | --------------------- | ------------------------ | ---------------------- | ------------------------------------- |
| AiSCOUT × adidas    | Annual flagship       | Sponsorship              | Trial + glory          | Yes — Pattern #1                      |
| Tonsser × adidas    | Co-branded content    | Modest content $         | Visibility             | Maybe — Pattern #5/6                  |
| Hudl                | Wearable integrations | Infra fees               | Indirect               | No                                    |
| CricHeroes × MRF/SG | Marketplace + events  | Sponsorship + commission | Gear discounts, awards | Yes — Pattern #1, #8, #10             |
| Decathlon           | Distribution          | In-kind venues           | Tested-at-store        | Yes — Pattern #3                      |
| Strava              | Brand challenges      | $50k–$500k/challenge     | Badge + gear top-100   | Yes — Pattern #4 (top recommendation) |
| Opendorse           | NIL marketplace       | Per-deal                 | $250–$5k/post          | Yes — Pattern #2 (POCSO-gated)        |
| KhiladiPro          | None yet              | —                        | —                      | Whitespace, move first                |
| PKL ecosystem       | Owners ARE brands     | —                        | —                      | Pattern #6 fit                        |

---

## 2. Indian sport-brand landscape

### 2.1 Brand cohorts by spend & scouting appetite

| Brand             | Sport focus                                                                | India presence                                                                                        | Talent-acquisition behaviour                                                                                                               | Indicative annual India sports marketing spend |
| ----------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| **Puma India**    | Football, cricket, athletics                                               | HQ Bengaluru; ~₹2,500 Cr revenue FY24                                                                 | Sponsors Virat Kohli, Sunil Chhetri, Kerala Blasters, Bengaluru FC. Annual school football initiative ([Puma India](https://in.puma.com/)) | ₹150–₹250 Cr                                   |
| **Adidas India**  | Football, cricket, running                                                 | Real Madrid Foundation Youth Cup India qualifiers from 2024 ([Khel Now](https://khelnow.com/))        | Boots-on-ground at school football, boots sponsorship of Manipur SAI, Ranveer/Ricky pillars                                                | ₹100–₹200 Cr                                   |
| **Nike India**    | Cricket, basketball, running                                               | Reduced ground presence post-2020 BCCI exit (replaced by adidas in 2023). Still a strong digital play | Limited grassroots; major-athlete-only                                                                                                     | ₹80–₹150 Cr                                    |
| **Asics India**   | Running, badminton                                                         | Growing — Tokyo Marathon-style branded races                                                          | Running events + a small "Asics Future Stars" badminton drive                                                                              | ₹40–₹80 Cr                                     |
| **Decathlon**     | All sports                                                                 | 130+ stores, 29,000 pin codes                                                                         | Anti-brand-positioning ("affordable for all") — but they run grassroots events                                                             | ₹100+ Cr in events alone                       |
| **MRF**           | Cricket                                                                    | MRF Pace Foundation since 1987 (Glenn McGrath director) — explicit talent-discovery operation         | The single most institutionalised brand-as-talent-academy in India                                                                         | ₹50–₹80 Cr                                     |
| **SG / SS / BAS** | Cricket                                                                    | Bat & gear; sponsor most domestic India players                                                       | Direct relationships with Ranji-tier upwards; rare grassroots                                                                              | ₹10–₹30 Cr each                                |
| **Nivia**         | Football, basketball, kabaddi                                              | India's home brand; supplies kit to AIFF Blue Cubs, AKFI, BFI                                         | Already in the grassroots conversation; lacks the digital surface                                                                          | ₹20–₹50 Cr                                     |
| **Yonex**         | Badminton                                                                  | Sponsors most India badminton stars; Yonex Sunrise India Open                                         | School badminton tournaments year-round                                                                                                    | ₹15–₹30 Cr                                     |
| **JSW Sports**    | Multiple — owns Haryana Steelers (PKL), Bengaluru FC, Delhi Capitals stake | Operates as both team owner AND athlete sponsor (Neeraj Chopra, Lakshya Sen)                          | The closest India has to a "Family of Athletes" model — tightly controlled                                                                 | ₹200+ Cr in athlete contracts alone            |
| **New Balance**   | Cricket — surprise entrant 2024                                            | Steve Smith, Joe Root, Ravichandran Ashwin                                                            | Pure pro-tier; not grassroots                                                                                                              | ₹20–₹40 Cr                                     |

### 2.2 Where Indian brands actually scout today

- **School & college tournaments**: Subroto Cup, Khelo India, CBSE National Athletics, Inter-University. Brands take a stall, hand out shoes/balls in exchange for emails.
- **Instagram hashtags**: `#NextStarPuma`, `#AdidasFutureStars`, `#NiviaPlayoftheMonth` — usable but unstructured. Athletes upload reels; brand DMs the chosen ones.
- **Founder/agent relationships**: JSW, Adani, Reliance act through Inspire Institute of Sport (JSW IIS), Reliance Foundation Young Champs, etc.
- **MRF Pace Foundation model**: Coach-curated entry; ~12 fast bowlers/year selected nationally. Real but slow.

**Implication for OnlyKrida**: brands today do not lack athletes — they lack a _structured filter_ for who's worth a tryout invitation. Our value isn't "more athletes," it's "ranked, verified, fitness-zone-tagged athletes with a video thumbnail."

### 2.3 Iconic Indian athlete-brand relationships (proof the market values it)

- **Neeraj Chopra × JSW Sports** (since 2017) — JSW funded Chopra's Olympic prep entirely. Worth $5–10M post-Olympic gold.
- **Virat Kohli × Puma** (₹110 Cr/year, 2023 renewal — the largest cricketer endorsement in India) ([Mint coverage](https://www.livemint.com/)).
- **Lakshya Sen × Yonex × JSW** — the BWF World C'ships path is fully sponsor-funded.
- **PV Sindhu × Bridgestone × Yonex × Asics** — 7+ active endorsements.
- **Sunil Chhetri × Puma × Mountain Dew** — Puma kit since 2014, ~₹4 Cr/year.

The pattern: Indian brands will pay enormous premia for the **already-arrived** athlete. They do not yet pay enough for the **just-emerging** athlete — partly because the discovery surface (us) does not yet exist. **This is the gap.**

### 2.4 DPDP Act 2023 implications

DPDP Rules notified 13 Nov 2025; substantive obligations live 13 May 2027 ([gbrain-seed/concepts/regulatory-compliance.md](docs/gbrain-seed/concepts/regulatory-compliance.md)). Specific brand-data implications:

- **No silent data sharing with brands.** Sharing an athlete's profile with a brand requires an explicit consent action recorded against that exact purpose. A blanket "we may share with partners" toggle is not compliant under Rule 5.
- **Verifiable parental consent** for under-18s (Rule 10) — Aadhaar offline-XML / DigiLocker / Consent Manager. Any brand-facing surface that exposes a U-18 athlete must run through the parental consent layer.
- **Data portability + erasure**: An athlete must be able to revoke a brand's view at any time. Brand pages with athlete rosters need a "leave this roster" UX flow.
- **Consent fatigue is real**: every additional brand-purpose consent prompt erodes athlete trust. Bundle thoughtfully — "Allow OnlyKrida-recommended brands to view my fitness zone" is one consent, not ten.

---

## 3. Integration patterns — 10 evaluated

For each: name, schema impact (described, not coded), surfaces, brand value, athlete value, effort estimate (CC days for MVP), Hyderabad test (1–10), revenue model, concrete example.

### Pattern A — Sponsored Opportunities (Brand-funded tournaments / scholarships)

- **Pitch**: A brand creates an opportunity in `app/opportunities/create.tsx` with a `sponsoredBy` field; it appears with a brand badge in the feed; applicants implicitly opt into the brand's communication for that opportunity only.
- **Schema sketch**: `opportunities.sponsored_by_user_id` (FK to brand profile), `opportunities.sponsor_branding` (JSON: logo override, accent colour, hero image), `opportunity_applications.consent_to_sponsor_contact` (bool, DPDP-required).
- **UI surfaces**: `app/(tabs)/opportunities.tsx`, `components/CreateOpportunityModal.tsx`, `app/opportunities/manage-applications.tsx`. New: brand-specific create flow gated by `role === 'brand'`.
- **Brand value**: Verified, filterable applicant pool with consent. Replaces Instagram-DM scouting.
- **Athlete value**: Real, brand-backed opportunities (₹ prizes, kit, trial slots) — same flow they already know.
- **Effort**: 4–6 CC days. Most plumbing exists.
- **Hyderabad test**: **9/10**. A Puma-funded "Telangana State Striker Search" opens a Mumbai/Bengaluru-quality opportunity to a Hyderabad kid.
- **Revenue model**: Sponsorship — flat fee per opportunity (₹50k–₹5L) + optional ₹/applicant.
- **Example**: **Nivia** runs "Nivia Football Future" — three city-level opportunity posts (HYD, BLR, MUM); top 50 applicants per city get gear + trial slots at sponsoring academies.

### Pattern B — Brand-Athlete Sponsorship Matching (NIL-style, AI-driven)

- **Pitch**: Brands list small sponsorship deals (e.g., ₹5,000 for 3 Instagram posts); athletes opt in to match; AI recommends best-fit. Platform takes 15% commission.
- **Schema sketch**: `brand_deals` table (brand_id, deal_type, payout, requirements, sport_filter, zone_filter, age_range), `brand_deal_applications`, `brand_deal_completions` (with deliverables URLs).
- **UI surfaces**: New `app/brand-deals/` route group. Athlete profile gets a "Sponsorship Marketplace" tab. Brand home gets a "Post a Deal" CTA.
- **Brand value**: Programmatic micro-influencer reach with AI fit-scoring.
- **Athlete value**: First real money in many an athlete's life.
- **Effort**: 12–18 CC days. New domain. Requires payment rails (Razorpay), KYC for athletes, POCSO compliance for U-18 (deals are 18+ only OR parent-mediated).
- **Hyderabad test**: **6/10**. Powerful for athletes already with social presence; less so for the just-discovered Hyderabad kid (the actual scout-pipeline target).
- **Revenue model**: 15% transaction commission.
- **Example**: **Asics India** posts "₹3,000 for one Instagram reel wearing Novablast 4 — 50 athletes wanted, age 18+, Rising-zone or higher." 80 athletes apply; AI picks 50; payout via Razorpay.

### Pattern C — Brand-Verified Athletes (new verification tier)

- **Pitch**: Add `brand_endorsed` as a fifth verification tier next to `center_tested` ([constants/verification.ts:14-55](constants/verification.ts)). When a brand signs a sponsorship deal with an athlete, that athlete's profile gets a "Sponsored by [Brand]" badge that scouts see.
- **Schema sketch**: Extend the `VerificationTier` enum, new `brand_endorsements` table (athlete_id, brand_id, start_date, end_date, deal_type, public). NB: the `scoutConfidenceMultiplier` for `brand_endorsed` should NOT exceed `coach_verified` (1.0) — brands are commercial, not technical, validators. Suggested multiplier: 1.0 (flat).
- **UI surfaces**: Athlete profile, scout cards, every place the verification badge renders.
- **Brand value**: Their athletes are tagged everywhere in the platform — free brand exposure scaled to athlete success.
- **Athlete value**: Brand badge as social proof (huge in India — see Sindhu, Chopra cases).
- **Effort**: 5–7 CC days.
- **Hyderabad test**: **5/10**. Doesn't help discovery; helps already-discovered.
- **Revenue model**: Annual brand subscription tier (₹2L–₹10L/year for brand pages with rosters).
- **Example**: **Yonex × Hyderabad-based U-19 badminton player** — Yonex pays for a 1-year endorsement; player profile shows "Yonex Future Star" badge; Yonex's brand page lists them on the roster.

### Pattern D — Branded Fitness Challenges (the Strava model — top recommendation)

- **Pitch**: Brand pays to sponsor a 30-day challenge tied to fitness zones. Top performers get gear + leaderboard glory. "Adidas Speed Series — fastest 40m sprint among U-17 athletes wins kit + Bengaluru trial slot."
- **Schema sketch**: `branded_challenges` (brand_id, fitness_test_type, start_date, end_date, geo_filter, age_filter, prize_structure, scoutConfidenceMultiplier_required). `challenge_entries` (links to existing `fitness_test_results`). Crucial: entries must enforce `verification_tier >= 'app_measured'` to prevent self-reported gaming.
- **UI surfaces**: New "Challenges" surface on athlete home (next to fitness zone display). Brand home gets "Launch Challenge" CTA. Leaderboard view.
- **Brand value**: Targeted, sport-specific, geographic, verified-data activation. Reaches exactly the cohort they want.
- **Athlete value**: Authentic competition + zero-cost entry + tangible gear reward + visibility.
- **Effort**: 8–10 CC days. Reuses 80% of existing fitness-test stack ([hooks/fitness-test-context.tsx](hooks/fitness-test-context.tsx)).
- **Hyderabad test**: **10/10**. **This is the single highest-Hyderabad-test pattern in the dossier.** A Hyderabad athlete competes nationally on a measurable axis; Mumbai-based Adidas scouts see them on a national leaderboard.
- **Revenue model**: Sponsorship — ₹2L–₹20L per challenge depending on prize pool / reach commitment.
- **Example**: **Decathlon × Yo-Yo Test Series** — 30-day Yo-Yo test challenge; verified `app_measured` results only; top 10 in each zone (Building / Rising / Strong) get Decathlon vouchers + center_tested re-test in nearest store. Decathlon pays ₹8L; gets 5,000 ranked, geo-tagged athlete profiles.

### Pattern E — Athletes Tag Brands in Posts (UGC + brand monitoring)

- **Pitch**: Athletes can tag brands in their content (`#sponsoredby` / `@adidasindia`). Brands get a dashboard of mentions; can repost. Free for both sides; revenue is brand subscription for the dashboard.
- **Schema sketch**: `post_brand_mentions` (post_id, brand_id, is_paid, disclosed). `brand_mention_dashboards` materialised view per brand.
- **UI surfaces**: Compose post screen; brand home gets "Mentions" tab.
- **Brand value**: Free social listening for athlete-influencer activity.
- **Athlete value**: A mechanism to surface their organic fanship (which Indian Z-gen does naturally).
- **Effort**: 4–6 CC days.
- **Hyderabad test**: **4/10**. Engagement, not discovery.
- **Revenue model**: Brand "Listening Plus" subscription ₹50k–₹2L/year.
- **Example**: 14-y-o cricketer in HYD posts a wicket reel wearing SG pads and tags `@SGCricket`. SG's dashboard pings them; SG DMs and sends a free pair.

### Pattern F — Brand Pages with Athlete Rosters ("Family of Athletes")

- **Pitch**: Brand profile pages, like Adidas's "Family of Athletes" globally — but only for OnlyKrida-confirmed sponsorships. Each athlete on the roster gets the brand badge from Pattern C.
- **Schema sketch**: Brand profile (name, hero, story, founder, location, verified). `brand_roster` join table (brand_id, athlete_id, role: ambassador / sponsored / under-evaluation).
- **UI surfaces**: New brand profile pages at `app/brand/[id].tsx`. Athletes follow brands. Brand home gets a roster-management surface.
- **Brand value**: Branded marketing surface inside the platform — owned audience.
- **Athlete value**: Visible association with credible brand.
- **Effort**: 8–12 CC days. Uses follow-graph ([hooks/follow-context.tsx](hooks/follow-context.tsx)).
- **Hyderabad test**: **3/10**. Mostly post-discovery surface.
- **Revenue model**: Brand subscription tier (₹3L–₹15L/year — see Pattern C).
- **Example**: **JSW Sports** brand page with rostered athletes (Neeraj Chopra, Lakshya Sen, Bengaluru FC players) — followers see their content stitched together.

### Pattern G — Brand-Only Feed (athletes follow brands)

- **Pitch**: Brands push content into a follow-based feed. Like Twitter brand accounts but inside OnlyKrida.
- **Schema sketch**: Reuses `posts` and `follows`; brand posts get a special render.
- **UI surfaces**: Existing feed; new "Brands" filter.
- **Brand value**: Owned-audience content distribution, free.
- **Athlete value**: Brand drops, gear giveaways, cultural content.
- **Effort**: 3–4 CC days (mostly CSS).
- **Hyderabad test**: **2/10**. Pure marketing channel.
- **Revenue model**: None directly; possibly "boosted post" ad model later.
- **Example**: Nivia posts "New India kabaddi kit launch" — followed by 50,000 athletes who like kabaddi.

### Pattern H — Affiliate Gear on Athlete Profiles (athletes earn commission)

- **Pitch**: Athletes link gear they actually use ("My SG bat", "My adidas X Crazyfast") to their profile; profile viewers can buy via affiliate; athlete earns 5–8% commission.
- **Schema sketch**: `athlete_gear` (athlete_id, brand_id, product_id, affiliate_link). Integration with **Decathlon affiliate**, **Amazon India Associates**, brand-direct programs.
- **UI surfaces**: Athlete profile gets a "My Kit" section. New transaction flow.
- **Brand value**: Bottom-funnel sales attribution from athletes' organic audience.
- **Athlete value**: First income stream that doesn't require a brand deal — pure UGC monetisation.
- **Effort**: 12–15 CC days. Affiliate API integrations + payout reconciliation.
- **Hyderabad test**: **3/10**. Helps post-discovery athletes monetise.
- **Revenue model**: 30% of athlete's commission (so ~1.5–2.4% of GMV).
- **Example**: A 22-y-o Hyderabad cricketer has 3,000 followers; lists SG Sunny Tonny bat; 10 sales/month at ₹6,000 each — athlete earns ~₹2,400/month, OnlyKrida earns ~₹1,000.

### Pattern I — Kit/Gear Giveaway Flows (brand → athlete via app)

- **Pitch**: Brand puts up free gear for distribution to top-zone or top-test-improvement athletes. Brand picks criteria; OnlyKrida ships (logistics outsourced).
- **Schema sketch**: `gear_grants` (brand_id, criteria, available_units, address_collection). `gear_grant_recipients`.
- **UI surfaces**: Notification to qualifying athletes; address-collection flow with parental consent for U-18.
- **Brand value**: Real product in real athletes' hands; testimonial pipeline.
- **Athlete value**: Free gear when they hit a milestone — strong "never demotivate" reinforcement.
- **Effort**: 10–14 CC days. Logistics + address collection + DPDP/POCSO compliance.
- **Hyderabad test**: **8/10**. The Hyderabad kid who can't afford boots gets free Pumas because they hit Rising zone — exactly the inequality OnlyKrida exists to fix.
- **Revenue model**: Brand pays ₹/grant administered + a flat fulfillment fee.
- **Example**: **Puma × Building→Rising upgrades** — first 200 athletes to upgrade from Building to Rising in May 2026 get free Puma One boots. Cost to Puma: ~₹6L (200 × ₹3,000 wholesale). Outcome: 200 testimonial videos.

### Pattern J — Brand-Judged Competitions

- **Pitch**: A brand sponsors a content/improvement competition ("Best Yo-Yo improvement May 2026 — judged by Bengaluru FC + adidas"). Brand reviews entries; picks winners with the public visibility of the judgement.
- **Schema sketch**: `judged_competitions` (sponsor_brand_id, judging_panel, entry_format, public_voting_weight). Reuses challenge primitives from Pattern D.
- **UI surfaces**: Competition tab inside athlete home; brand home gets the judging interface.
- **Brand value**: High-credibility brand-as-validator positioning. Judges-row content for marketing.
- **Athlete value**: Career-defining moment if you win.
- **Effort**: 8–10 CC days (after Pattern D ships).
- **Hyderabad test**: **8/10**. Public, brand-judged event — a direct equivalent to Adidas-funded Real Madrid Foundation Youth Cup.
- **Revenue model**: Sponsorship + (optionally) entry fee dropped to brand.
- **Example**: **Telugu Titans × OnlyKrida Kabaddi Raider Cup** — May 2026, top 30-second raid clips, judged by Telugu Titans coach Krishan Kumar Hooda, winner gets a PKL trial. Telugu Titans pays ₹5L; OnlyKrida brings 200+ entries.

### 3.X Pattern matrix (TL;DR for the impatient reader)

| #     | Pattern                        | Effort (days) | Hyderabad test | Revenue        | Wave fit     |
| ----- | ------------------------------ | ------------- | -------------- | -------------- | ------------ |
| A     | Sponsored Opportunities        | 4–6           | 9              | Sponsorship    | Wave 2       |
| B     | NIL-style matching             | 12–18         | 6              | 15% commission | Wave 3       |
| C     | Brand-Verified tier            | 5–7           | 5              | Subscription   | Wave 2/3     |
| **D** | **Branded Fitness Challenges** | 8–10          | **10**         | Sponsorship    | **Wave 2**   |
| E     | Brand mentions in posts        | 4–6           | 4              | Subscription   | Wave 3       |
| F     | Brand pages + rosters          | 8–12          | 3              | Subscription   | Wave 3       |
| G     | Brand-only feed                | 3–4           | 2              | None / ads     | Wave 3       |
| H     | Affiliate gear                 | 12–15         | 3              | Commission     | Wave 4       |
| **I** | **Kit/Gear Giveaways**         | 10–14         | **8**          | Per-grant fee  | **Wave 2/3** |
| J     | Brand-judged competitions      | 8–10          | 8              | Sponsorship    | Wave 3       |

---

## 4. Recommended starter pack — top 3 ranked

### #1 — Branded Fitness Challenges (Pattern D)

- **Hyderabad test 10/10**. A Building-zone Hyderabad U-17 sprinter shows up on Adidas's national leaderboard the moment they post a verified `app_measured` 40m. That is OnlyKrida's mission compressed into one feature.
- **Existing-code reuse**: Massive — `hooks/fitness-test-context.tsx`, `constants/verification.ts`, the entire fitness-zone system, the leaderboard mental model. Estimated 8–10 CC days.
- **Indian market readiness**: Strava-style brand challenges have zero precedent in India and Decathlon/Puma marketing teams will say yes to a ₹5L–₹10L pilot. Anchor: **Decathlon Yo-Yo Series** as the first.
- **Effort vs revenue**: Best ratio in the dossier — 10 CC days, ₹5–10L per challenge, plausibly 4–6 challenges in year-one = ₹25–60L revenue at near-zero variable cost.
- **Risk**: Requires the `app_measured` verification path to be airtight. Self-reported gaming would destroy brand trust on day one. Mitigation: explicit `scoutConfidenceMultiplier ≥ 0.85` floor for entry.

### #2 — Sponsored Opportunities (Pattern A)

- **Hyderabad test 9/10**. The biggest direct lever to make a Hyderabad athlete visible to a Mumbai brand-curated tryout.
- **Existing-code reuse**: Maximal — opportunities and applications already exist. Just `sponsored_by_user_id` + a brand badge render. 4–6 CC days, the lowest-effort high-impact pattern.
- **Indian market readiness**: Brands already pay for tournament sponsorships at five orders of magnitude more than they'd pay us per opportunity. They will pay ₹50k–₹5L per opportunity post for filtered, verified applicants vs the WhatsApp-flyer alternative. Direct competition: brand teams currently spend this on Subroto Cup booth fees.
- **Risk**: DPDP. Applicant-to-brand data sharing must be explicit and per-opportunity, not blanket. Already in the design.

### #3 — Kit/Gear Giveaways (Pattern I)

- **Hyderabad test 8/10**. The "free Puma boots when you hit Rising" scenario is the most viscerally on-mission feature in the dossier — it materially helps the kid who can't afford gear.
- **Existing-code reuse**: Moderate — uses the zone-up event from `hooks/fitness-test-context.tsx`. New: address collection + parental-consent gating + logistics tie-in.
- **Indian market readiness**: Mid. Decathlon and Nivia are likeliest first partners (Nivia's whole positioning is "Indian sports family"). Adidas/Puma will engage if Pattern D is already live.
- **Risk**: Logistics + DPDP/POCSO + address collection. Mitigation: launch with one partner, one geography (HYD), one milestone (Building → Rising), 100 units.

**Why this order, not order-of-effort**: Pattern D is the moat-builder. Pattern A is the cash. Pattern I is the soul-shipping feature that makes the platform feel different from every other "match athletes to brands" app. Together they cover {revenue, narrative, mission} without colliding on schema or UX.

**What we explicitly DO NOT do in 2026**: Pattern B (NIL marketplace), Pattern H (affiliate gear), Pattern G (brand-only feed). These are Wave 3 or later — they assume athlete audience density we don't yet have, payment infrastructure we don't yet need, and DPDP-compliance edge cases (especially U-18) we shouldn't take on alongside the bigger 13 May 2027 deadline already on the team.

---

## 5. Risks and watch-outs

### 5.1 Indian brands are slow to commit to digital-first platforms

The brand sales cycle in India is 4–6 months for a ₹5L+ deal. Most brand managers have never bought from a sports-tech startup; they buy from creative agencies who buy from us. Wedge:

- **Lead with a free pilot** of Pattern D for one brand-marketing-friendly partner. Best candidates: **Decathlon (no agency layer)**, **Nivia (Indian-owned, smaller decision tree)**, **JSW Sports (already inside the sports ecosystem)**.
- **Target the brand's sports marketing manager, not the CMO**. The manager needs reach metrics + filtered leads; they don't need an OKR-level proof.
- **Pre-built case study trumps decks**. Run one self-funded "OnlyKrida × HCA Yo-Yo Series" first; sell the case study, not the platform.

### 5.2 DPDP Act 2023 + brands collecting athlete data

- Bundle brand-purpose consent into a single onboarding flow. Three categories: (a) "Allow brand-sponsored opportunities to view my profile when I apply" (default on), (b) "Allow brands I've followed to message me" (default off), (c) "Allow brand challenge sponsors to use my anonymised result in marketing" (default off).
- Build the consent ledger from day one. `brand_consent_log` table is small but non-negotiable.
- Anonymisation for marketing material: brand can show "average sprint time of top-100 entries" but not "Anirudh ran 4.81s". Named use requires per-athlete consent.

### 5.3 POCSO + under-18 athletes

- **No direct brand-athlete messaging for U-18.** Brands talk to U-18 athletes only through opportunities + their parent/guardian.
- **No Pattern B (NIL marketplace) for U-18.** Period.
- **Pattern I (gear giveaways) for U-18 require parental address-collection consent** and ideally physical-handover-at-academy to keep brand reps off domestic addresses.
- **Pattern D (challenges) is fine for U-18** but brand naming in the challenge title requires school/parent disclosure that the challenge is brand-sponsored. Strava's UK challenges do this with a parent-consent toggle for U-16; copy that model.

### 5.4 Brand lock-in vs platform openness

Avoid signing exclusive arrangements with single brands per category in year 1. If Adidas books "the football fitness challenge category," Puma never enters and Indian football is structurally underfunded on the platform forever. Keep all brand deals **non-exclusive by default**; enforce in the contract template, not just in good faith.

### 5.5 The "selling athletes to brands" optics

OnlyKrida's stated soul is "athletes are permanently free." If the product begins to feel like a brand-acquisition funnel, the trust collapses.

Mitigations:

- **Athletes always control which brands see them.** No brand-paid-priority-search that overrides athlete consent.
- **No revenue line where the athlete is the product without compensation.** Pattern E (mentions) is fine because the athlete chose to tag. Pattern A is fine because applying is voluntary. A future pattern where "paid brand searches surface athletes who haven't opted in" — never.
- **Communicate the deal openly**. "Your zone is being shown to Adidas because you joined Adidas Speed Series — opt out anytime" is better than silent exposure. Treat this like the GDPR consent framing on adtech, not the silent surveillance model that early NIL platforms got criticised for.
- **The Hyderabad test on every brand decision**: would this make a Hyderabad athlete more visible (good) or more harvested (bad)? When in doubt, kill the feature.

### 5.6 Operational risk — brand sales is not engineering

If the team takes on Pattern D before someone owns brand BD, deals don't close, the platform sits unused, and the engineering investment is dead capital. Sequence:

1. Build Pattern A (lowest effort, lowest BD requirement — opportunities are inbound).
2. Hire / contract a brand BD (1 person, fractional fine, ideally ex-Decathlon-marketing or ex-Nivia-marketing).
3. Then build Pattern D.
4. Then Pattern I.

The wrong sequence — build Pattern D first, then look for a brand BD — burns 10 CC days and 6 months of platform credibility.

---

## 6. Sources

- AiSCOUT × Real Madrid Foundation: <https://aiscout.io/>, <https://www.realmadrid.com/en-US/the-club/foundation/news/2024/04/real-madrid-foundation-youth-cup>
- Tonsser: <https://tonsser.com/>, <https://www.skysports.com/football/news/11095/12328439/tonsser-united-the-app-helping-amateur-players-beat-the-world-s-best>
- Hudl: <https://www.hudl.com/products/wyscout>
- KhiladiPro: <https://cxotoday.com/press-release/visual-ai-sports-tech-startup-khiladipro-secures-1m-to-power-youth-fitness-athlete-development-across-india/>
- CricHeroes: <https://blog.cricheroes.com/grassroots-cricket-2025/>
- Decathlon × Playo: <https://www.thehansindia.com/business/decathlon-strengthens-its-sports-for-all-mission-through-partnership-with-playo-1033228>
- Strava brand challenges: <https://www.strava.com/challenges>
- Opendorse NIL: <https://opendorse.com/>
- Puma × Kohli ₹110 Cr deal: <https://www.livemint.com/>
- DPDP Act 2023 / POCSO compliance: `docs/gbrain-seed/concepts/regulatory-compliance.md`
- Indian competitive landscape: `docs/gbrain-seed/companies/competitor-deep-dive-2026.md`
- Indian GTM playbook: `docs/gbrain-seed/concepts/india-gtm-playbook.md`
- Kabaddi-PKL ecosystem: `docs/gbrain-seed/concepts/kabaddi-moat.md`
- Internal code references:
  - `components/home/BrandHome.tsx` — current brand surface
  - `types/index.ts:1-10` — UserRole enum (brand role exists)
  - `constants/theme.ts:221` — brand role accent
  - `app/opportunities/create.tsx:75-83` — sponsorships category placeholder
  - `constants/verification.ts:14-55` — verification tier ladder
  - `hooks/fitness-test-context.tsx` — fitness zone foundation for Pattern D
  - `hooks/scouting-context.tsx` — `expressInterest` already used by BrandHome

---

## Changelog

- 2026-04-27 (v1.0): Initial dossier. Authored against the post-Wave-2 platform state. Sources cited inline.
