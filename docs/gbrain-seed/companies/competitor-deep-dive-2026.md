---
type: concept
title: Indian sports talent discovery — competitor deep-dive 2026
tags: [competitors, market, india, sports, football, cricket, deep-research]
---

## Scope and method

This is a 2026-current competitive deep-dive for OnlyKrida, India's grassroots sports talent discovery platform (primary sport: football; secondary: cricket, kabaddi, badminton, athletics, hockey, basketball; markets: Bengaluru / Hyderabad / Mumbai / Delhi + Dubai/UAE). It expands beyond the original 1-paragraph-per-competitor seed and reflects the 2025–2026 funding environment, government policy shifts (Draft National Sports Policy 2024, KIRTI), and the Hudl–Wyscout–StatsBomb consolidation upstream.

Written 2026-04-26. Hard rule used while writing: every public number is sourced; everything else is flagged "not publicly disclosed".

The Indian sports-tech market is projected to grow from ~₹26,700 Cr in FY24 to ~₹49,500 Cr by FY29 — an 85% rise over four years, driven primarily by fantasy sports, fan engagement, and data/analytics ([FIFS-Deloitte report 2025, via Business Standard](https://www.business-standard.com/industry/news/sports-tech-market-may-grow-by-85-to-rs-49-500-cr-in-4-yrs-fifs-deloitte-125021301487_1.html); [Deloitte India release](https://www2.deloitte.com/in/en/pages/technology-media-and-telecommunications/articles/india-sports-technology-market-driven-by-fantasy-sports.html)). Talent-discovery is a small but rapidly differentiating slice of that pie — roughly the segment OnlyKrida is staking out.

---

## 1. Direct competitors — Indian talent / portfolio / scouting

### 1.1 SportVot

- **What it is**: Live-stream + production layer for grassroots sports events (originally football, now multi-sport). Athletes get visibility because their matches are recorded; clubs and tournaments get distribution. It is a _content-first, broadcast-tech_ play, not a portfolio play.
- **Founded / leadership**: Mumbai, 2019. Founders Yash Bhagwatkar, Sidhhant Agarwal, Shubhangi Gupta ([Tracxn](https://tracxn.com/d/companies/sportvot/__e2QOc2QL6bXboh7IL4usFxPp3eElYEWN294bXMMBL9A); [Indian Startup News funding announcement](https://indianstartupnews.com/news/sportstech-startup-sportvot-raises-funding-from-ankur-capital-others/)).
- **Funding**: $1.63M total across 4 rounds; latest a $1.13M seed round on 30 Jan 2024 with 11 investors including Ankur Capital, Marwah Sports, Ventana Ventures, Ananta Bizcon, ACH Group, Omidyar Network India ([Tracxn](https://tracxn.com/d/companies/sportvot/__e2QOc2QL6bXboh7IL4usFxPp3eElYEWN294bXMMBL9A); [PitchBook](https://pitchbook.com/profiles/company/502806-88)).
- **Self-reported traction (caveat: self-reported)**: 18,000+ matches streamed, 75M views, 90,000+ "upcoming athletes featured", 25M digital audience reach ([Indian Startup News expansion piece](https://indianstartupnews.com/news/indias-sportstech-platform-sportvot-enters-apac-mena-and-european-regions-9450294)). DAU is not publicly disclosed.
- **2025 expansion**: Entered Australia, New Zealand, parts of Southeast Asia, MENA; opened first international office in Australia ([Indian Startup News expansion piece](https://indianstartupnews.com/news/indias-sportstech-platform-sportvot-enters-apac-mena-and-european-regions-9450294)). They are now a hardware + production company chasing global rev, not an India-grassroots-only play.
- **Strengths**: First-mover in match-capture infrastructure; relationships with state federations and tournament organisers; the only company with a real dataset of grassroots match footage in India.
- **Weaknesses**: It is an "upload pipe", not a discovery surface. An athlete on SportVot is a clip, not a queryable profile — scouts can't filter by age/position/zone. No structured player metadata, no scout-side product. Their economics tie them to high-friction, high-cost capture-at-the-venue work; they're spreading thin internationally.
- **OnlyKrida's specific differentiation**: We are the structured layer SportVot lacks. Our profiles are searchable by sport, position, age, location, fitness zone, verification tier — exactly what a scout actually does.
- **Recommended posture**: **Partner.** SportVot footage flowing into OnlyKrida profiles (via a "claim my SportVot clip" flow) makes both sides stickier. They have content; we have the identity layer. They will not build it themselves because their roadmap is international broadcast scaling.

### 1.2 Khelo India app + KIRTI (government layer)

- **What it is**: Two related Government-of-India properties under the Sports Authority of India / Ministry of Youth Affairs and Sports.
  1. **Khelo India app** — an info app: Learn (rules of sports), Play (find facilities), Get Fit (8 fitness tests), plus a parallel school version for fitness assessments ([Khelo India Games on Play Store](https://play.google.com/store/apps/details?id=com.sportsauthorityofindia.kheloindiagames&hl=en_IN); [Khelo India site](https://kheloindia.gov.in/)).
  2. **KIRTI (Khelo India Rising Talent Identification)** — launched March 2024 by Union Minister Anurag Thakur, then re-boosted under Mansukh Mandaviya. Targeted at children 9–18, uses AI-driven analytics to predict sporting acumen ([PIB launch release](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2013801); [SAI launch press release PDF](<https://sportsauthorityofindia.nic.in/sai/assets/news/1710245134_KIRTI_launch_press_release_March_12%20(1).pdf>); [iasgyan brief](https://www.iasgyan.in/daily-current-affairs/khelo-india-rising-talent-identification-kirti-program)).
- **Traction**: KIRTI Phase 1 — 3,62,683 registrations across 70 centres, ~51,000 assessments completed in 28 states/UTs. State leaders: Maharashtra (9,168), Haryana (4,820), Assam (4,703). Most-assessed sports: athletics (13,804) and football (13,483). Stated FY24-25 target: 20 lakh (2 million) assessments ([iasgyan brief](https://www.iasgyan.in/daily-current-affairs/khelo-india-rising-talent-identification-kirti-program); [PIB release](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2034000)). Funding: government — not directly comparable.
- **Khelo India Youth Games 2025** in Bihar: 10,000+ athletes across 28 states, 8 UTs, 27 sports ([Wikipedia: 2025 KIYG](https://en.wikipedia.org/wiki/2025_Khelo_India_Youth_Games)). The Khelo India Winter Games 2026 introduced facial-verification accreditation through the Khelo India app ([Khelo India winter site](https://winter.kheloindia.gov.in/)).
- **Strengths**: Sole government distribution channel. Trust signal with parents in tier-2/tier-3 India. PIB/SAI press machinery. The brand "Khelo India" carries weight no startup can match.
- **Weaknesses**: It is a _funnel into elite government academies_, not a discoverable database for private clubs / academies / scouts. UX is government-grade (slow updates, school-administered, no social layer). KIRTI assessments are run from physical centres — discovery happens _to_ you, not _for_ you. The fitness tests are limited and not athlete-owned.
- **OnlyKrida's differentiation**: We are athlete-owned, scout-facing, social. The Khelo India funnel ends at "you got selected for a SAI camp"; OnlyKrida creates ongoing, year-round discovery across private academies, ISL clubs, USport, university scouts, and brand sponsorships — the 99% of opportunities Khelo India never touches.
- **Recommended posture**: **Coexist / partner downstream.** Never compete on the government-trust axis (we will lose). Instead, position OnlyKrida as "the next step after KIRTI": athletes who got tested via Khelo India come to us to _do something with it_. Long-term: pursue a data-import or "Khelo India verified" badge integration, similar to how Aadhaar e-KYC is reused.

### 1.3 ScoutMe (AIFF mobile scouting app)

- **What it is**: A mobile scouting app endorsed by the All India Football Federation. Builds player profiles with age-appropriate scouting parameters; scouts create/edit/organise data on phone or web ([Khel Now: AIFF launch piece](https://khelnow.com/football/aiff-scout-me-unveiling); [ScoutMe.in](https://www.scoutme.in/)).
- **Origin**: Notably built in 2017 by Kush Pandey, then a 17–19 year old Jaipur student ([Global Sport Matters profile](https://globalsportmatters.com/youth/2019/03/19/apps-creating-global-scouting-service-for-soccer-players/); [Khel Now](https://khelnow.com/football/aiff-scout-me-unveiling)). AIFF positioned it as "the first sports federation in India to launch a mobile-based scouting app."
- **Traction / funding**: Not publicly disclosed. No funding round visible in Tracxn / Crunchbase coverage of Indian sports-tech in 2024–25. The AIFF endorsement is mostly the asset.
- **Strengths**: AIFF brand ride-along; scouting-vocabulary-correct (age-appropriate parameters). Very early-mover in dedicated scouting tooling.
- **Weaknesses**: Looks moribund — public LinkedIn/Facebook activity is sparse, no funding momentum, no obvious 2024–25 product cadence. The AIFF itself has since publicly invested in alternative pathways: Reliance Foundation Young Champs use AiSCOUT (UK-built) for trials, not ScoutMe ([RFYC + AiSCOUT](https://www.rfyoungchamps.org/news/general/rfyc-aiscout-scouting-technology/)). It is single-sport (football), single-side (scout-tool, not athlete-portfolio).
- **OnlyKrida's differentiation**: We are athlete-side AND scout-side, multi-sport, social, and AI-native. ScoutMe is a CRM for AIFF scouts; we are a marketplace.
- **Recommended posture**: **Ignore for now, watch for AIFF re-anointing.** The real risk is not ScoutMe itself but AIFF picking a new "official scouting app" partner. Build the AIFF relationship in parallel so OnlyKrida is in the running when that decision is reopened.

### 1.4 EliteFootball (the original seed entry — clarification)

- The original CLAUDE.md/seed referenced "EliteFootball India". Public search returns two unrelated products: (a) the **EliteFootball app on Google Play** by support@harbiz.io — a Spain/LATAM-oriented coach-managed training app, not India-specific ([Play Store listing](https://play.google.com/store/apps/details?id=io.harbiz.elite&hl=en); [EliteFootball España](https://play.google.com/store/apps/details?id=app.trainin.client.elitefootball&hl=en)), (b) **Elite Football League of India (EFLI)** — a defunct American football league ([Wikipedia](https://en.wikipedia.org/wiki/Elite_Football_League_of_India)).
- **Conclusion**: There is no notable India-specific "EliteFootball" talent platform with public traction or funding in 2024–26. The seed entry was either misnamed or referencing an inactive operation. **Recommended posture: ignore until evidence of activity.**

### 1.5 KhiladiPro (KPro) — the closest direct competitor today

- **What it is**: AI-powered, smartphone-based athletic assessment platform for school children. Uses on-device "Visual AI" to run standardised drills and benchmark against national/international norms — _exactly the "fitness zones with phone-only verification" thesis OnlyKrida is operating in._ ([CXOToday](https://cxotoday.com/press-release/visual-ai-sports-tech-startup-khiladipro-secures-1m-to-power-youth-fitness-athlete-development-across-india/); [YourStory profile](https://yourstory.com/2025/10/khiladipro-bridging-india-youth-sports-gap-fitness-accessible-school-children); [Indian Startup Times](https://www.indianstartuptimes.com/investment/khiladipro-raises-1m-to-scout-indias-next-sports-stars-with-ai/)).
- **Founded**: August 2023, Lucknow. The legal entity per filings is K-Eye SportsTech Pvt Ltd ([ipoplatform record](https://www.ipoplatform.com/startup-business-funding/k-eye-sportstech-private-limited/100279)).
- **Funding**: ~$1M pre-seed (2025), led by Shastra VC and MGA Ventures; angels include M Pallonji, Jeena & Co., Ayaz Billawala, Nimesh Kampani, and Jaimin Bhat (former CFO Kotak Bank) ([CXOToday](https://cxotoday.com/press-release/visual-ai-sports-tech-startup-khiladipro-secures-1m-to-power-youth-fitness-athlete-development-across-india/); [Entrepreneur India](https://india.entrepreneur.com/news-and-trends/shastra-vc-and-mga-ventures-lead-usd-1-mn-investment-in/492506)).
- **Stated 2025 target**: 200,000 assessments through a "6-Pincode Marketing model" focused on tier-3/tier-4 towns ([CXOToday](https://cxotoday.com/press-release/visual-ai-sports-tech-startup-khiladipro-secures-1m-to-power-youth-fitness-athlete-development-across-india/)).
- **Strengths**: This is the most product-overlapping competitor in the market — same age band, same "phone-only AI assessment" thesis, real funding, fresh capital. School distribution gives them scaled top-of-funnel KhiladiPro can lock in via institutional contracts.
- **Weaknesses**: Schools-first means they are B2B2C — they need a school administrator to push the app, which slows individual-athlete UGC. No published scout-side product; they are an _assessment_ engine, not a _discovery marketplace_. North-India bias (Lucknow HQ, tier-3/4 outreach) — Bengaluru / Mumbai / urban football pros are not the primary user. Fitness-only — no highlight reels, achievements, social graph.
- **OnlyKrida's differentiation**: (a) Athlete-owned profile, not a school-administered test record; (b) full portfolio surface (highlights + achievements + fitness + social proof), not just a fitness score; (c) scout-side product with AI matching is our actual moat — KhiladiPro has not built this; (d) urban-tier-1 + UAE positioning vs their tier-3/4 positioning means we are not (yet) hunting the same student.
- **Recommended posture**: **Compete head-on, but on a different segment.** Long-term, the scout-side product is the wedge. Win the academies and ISL clubs and KhiladiPro becomes an "input source" we can ingest from, not a destination. Watch their seed-to-Series-A milestone in 2026 — if they hit 500K+ assessments and add a scout-side product, the competitive picture changes.

### 1.6 StepOut (the analytics-side competitor)

- **What it is**: AI/ML football performance analysis platform — auto-generated highlights, performance dashboards, advanced metrics like xG, xA, PPDA, player impact scores. Computer-vision pipeline that ingests match footage ([stepout.ai](https://www.stepout.ai/en); [YourStory profile](https://yourstory.com/2025/05/sports-tech-startup-stepout-democratising-football-analytics)).
- **Founded**: Bengaluru, 2020. Founders Sayak Ghosh and Jeet Karmakar ([Tracxn](https://tracxn.com/d/companies/stepout/__ivfjX9e7IiBDx7IgbmH_jup3kLoKm4Fli8C5iPbFKqA)).
- **Funding**: $1.5M Pre-Series A in May 2025 led by Rainmatter (Zerodha's Nithin Kamath) — the same fund had led their late-2024 seed round ([Indian Startup Times](https://www.indianstartuptimes.com/investment/rainmatter-doubles-down-on-stepout-with-1-5m-pre-series-a-to-take-ai-football-analytics-global/); [Entrackr](https://entrackr.com/snippets/sports-tech-startup-stepout-raises-15-mn-led-by-rainmatter-11017911); [Zerodha Z-Connect intro post](https://zerodha.com/z-connect/rainmatter/introducing-stepout)).
- **Traction**: 30+ clients across countries, including **Bengaluru FC and the All India Football Federation domestically**, plus pilot projects with FC Barcelona, Tottenham Hotspur, Atlético Madrid; claims 25,000+ matches analysed, 150,000+ players tracked, 3x YoY revenue, 90% renewal rate ([Indian Startup Times](https://www.indianstartuptimes.com/investment/rainmatter-doubles-down-on-stepout-with-1-5m-pre-series-a-to-take-ai-football-analytics-global/); [angelone.in coverage](https://www.angelone.in/news/unlisted-companies/bengaluru-sports-tech-startup-stepout-raises-1-5-million-in-pre-series-a-round-led-by-rainmatter)).
- **Strengths**: They have the AIFF and Bengaluru FC — the two single most important football logos in India. Real revenue, real renewals, real international validation. The competitive moat is computer-vision-on-amateur-footage at scale.
- **Weaknesses**: B2B-only. No athlete-side product. They sell to clubs; they do not own the relationship with the player. The player on a StepOut dashboard does not have a profile, can't be DM'd by a scout, can't share their highlight on social. They also explicitly say they will "eventually expand to amateur sports and other disciplines" — i.e., they have not yet.
- **OnlyKrida's differentiation**: Athlete-owned identity layer, social/discovery surface, multi-sport from day one. We are the _athlete's_ OS. StepOut is the _club's_ analytics tool. These are complements, not substitutes.
- **Recommended posture**: **Partner — high priority.** The dream is "StepOut analyses the match → scoring/event data flows into OnlyKrida player profiles → scouts see verified xG and key passes on each athlete." This is the single most strategically useful integration we could pursue in 2026. Also a useful credibility lift via Rainmatter — overlap their investor network for our own raise.

### 1.7 AiSCOUT (UK-built; running RFYC trials in India)

- **What it is**: UK-based AI scouting platform that uses computer vision to score players doing standardised drills via their own phone camera. Creates a leaderboard scouts then evaluate ([RFYC + AiSCOUT explainer](https://www.rfyoungchamps.org/news/general/rfyc-aiscout-scouting-technology/); [RFYC 2025/26 trial post](https://www.rfyoungchamps.org/news/general/rfyc-scouting-aiscout-ai-football-india/)).
- **India footprint**: Reliance Foundation Young Champs (RFYC) runs its U-14 trials on AiSCOUT — virtual trials that filter into a leaderboard, then on-ground invites for top players. ~2,000 sign-ups, 1,000+ virtual trials completed in early seasons ([Sportskeeda](https://www.sportskeeda.com/indian-football/rfyc-reliance-embraces-tech-solution-scout-football-talent-covid-19-times)).
- **Strengths**: The Reliance/Mukesh Ambani halo is enormous. RFYC is one of the prestige pathways in Indian youth football.
- **Weaknesses**: AiSCOUT is _not_ an Indian company; they are a UK product licensed to RFYC for their trial cycle. The athlete relationship is owned by RFYC, not by AiSCOUT. There is no general-purpose Indian rollout, no scout-marketplace, no multi-sport, no social. The trial-only model means an athlete uses it once a year.
- **OnlyKrida's differentiation**: 365-day-a-year discovery vs. one-time trial gating. Multi-sport, multi-academy, multi-club. Athlete keeps their profile after the RFYC cycle ends.
- **Recommended posture**: **Compete obliquely — own the off-cycle.** Position OnlyKrida as the place athletes prepare for, then re-share their AiSCOUT/RFYC trial result on. If AiSCOUT or Reliance ever build a year-round product, they become a top-3 threat (see threat list, §7).

### 1.8 CricHeroes (cricket — the giant in the next room)

- **What it is**: Grassroots cricket scoring + community app. Started 2016 as a scorebook, evolved into the dominant grassroots cricket identity layer globally ([CricHeroes blog 2025](https://blog.cricheroes.com/grassroots-cricket-2025/)).
- **Traction**: 49M+ cricketers globally / 30M+ registered users / 4.8M+ matches scored / presence in 142 countries ([CricHeroes blog 2025](https://blog.cricheroes.com/grassroots-cricket-2025/); [CricHeroes funding announcement Aug 2024](https://blog.cricheroes.com/cricheroes-raises-1m-for-global-expansion/)). Different counts in different posts; treat the precise number as imprecise but the order of magnitude as correct.
- **Funding**: $1M bridge round in August 2024 from Shuru Up, Venture Catalyst, We Founder Circle, Eagle10 Ventures, IVY Growth, PNR Projects ([CricHeroes blog](https://blog.cricheroes.com/cricheroes-raises-1m-for-global-expansion/)). Earlier they crossed ₹65 Cr in revenue ([Money9](https://www.money9.com/news/exclusive/heres-how-3-friends-turned-a-small-idea-into-a-business-of-rs-65-crore-87037.html)).
- **Strengths**: Network effects nobody else in Indian sports has. Partnerships with 23 BCCI-affiliated state cricket associations and 40+ ICC-affiliated boards. Cricket-grassroots habit is built — a club tournament without a CricHeroes scorebook is the exception now, not the rule.
- **Weaknesses**: **Cricket-only.** Twelve years of accreted product specifically for cricket scoring; very hard to repurpose for football/kabaddi/etc. Discovery surface is weak — they are a _scorekeeping_ app first; profile-discovery is a side-effect, not the core product. Scout-side tooling is rudimentary.
- **OnlyKrida's differentiation**: Multi-sport from day one (which CricHeroes structurally cannot do without cannibalising). Discovery-first not scoring-first. Modern social/AI surface where CricHeroes feels engineered for 2018.
- **Recommended posture**: **Coexist for cricket; do not try to displace.** Our cricket vertical can be lighter — assume the user already has CricHeroes for scoring stats. We import or link, we do not duplicate. Own football, kabaddi, athletics, hockey, basketball, badminton — the seven sports CricHeroes will never seriously do — and let cricket be a federated, _complementary_ layer. **Long-term acquire-eventually candidate** if CricHeroes ever flounders on their global expansion.

### 1.9 KheloMore

- **What it is**: Online platform for booking sports venues, coaching, events, and increasingly cricket academies ([KheloMore on Tracxn](https://tracxn.com/d/companies/khelomore/__CYu4Ahv46Q3mJrD42MNSmp35elseb-gymivdyyG75A4); [Inc42 2022 funding piece](https://inc42.com/buzz/sportstech-platform-khelomore-bags-2-mn-to-launch-cricket-academies-offer-coaching-services/); [Inc42 Damera piece](https://inc42.com/buzz/eruditus-founder-ashwin-damera-backs-sportstech-platform-khelomore/)).
- **Founded**: Mumbai, 2016. Founder Jatin Paranjape (former India ODI cricketer).
- **Traction & financials**: ~500,000 users, ~1,500 coaches on the platform, FY25 revenue ~₹13.3 Cr ([Tracxn](https://tracxn.com/d/companies/khelomore/__CYu4Ahv46Q3mJrD42MNSmp35elseb-gymivdyyG75A4)). Total funding ~$5.09M across 5 rounds; backers include ClearBridge Investments, Eruditus / Ashwin Damera (Damera Ventures), and notably **Dream11** ([Tracxn](https://tracxn.com/d/companies/khelomore/__CYu4Ahv46Q3mJrD42MNSmp35elseb-gymivdyyG75A4); [Inc42](https://inc42.com/buzz/eruditus-founder-ashwin-damera-backs-sportstech-platform-khelomore/)).
- **Strengths**: Founder pedigree (ex-cricketer, BCCI-network), Dream11 strategic backing, real revenue, real coach-side network. Cricket-academy operating muscle.
- **Weaknesses**: This is a **booking marketplace**, not a discovery platform. Coaches list themselves; athletes book sessions. No structured player profile, no scout-side, no AI matching. The 500K user base is largely "I want to play this weekend," not "I want to be discovered." Cricket bias.
- **OnlyKrida's differentiation**: Identity and discovery vs booking and scheduling. Different intent. We could plug their academy directory in as a downstream surface ("get coached by a verified KheloMore academy after you're discovered on OnlyKrida").
- **Recommended posture**: **Partner.** Coach/academy marketplace + athlete discovery is a clean B2B handshake, especially given Dream11's prominent role in their cap table — that connection is strategically useful. If they ever pivot toward player-discovery, re-evaluate.

### 1.10 Game Theory

- **What it is**: Skill-based matchmaking + smart sports facilities (badminton, swimming, squash) in Bengaluru. Real-time scorekeeping, video highlights, on-court matchmaking. Computer-vision-instrumented venues ([YourStory 2024](https://yourstory.com/2024/02/computer-vision-game-theory-sports-tech-startup-nithin-kamath-rainmatter); [Inc42](https://inc42.com/buzz/game-theory-bags-funding-from-nithin-kamath-rohan-bopanna-to-provide-sports-technology/); [Outlook Business](https://www.outlookbusiness.com/news/game-theory-raises-rs-17-cr-from-nithin-kamath-rohan-bopanna)).
- **Founded**: 2018, Bengaluru. Founder Sudeep Kulkarni.
- **Funding**: $2M (~₹17 Cr) pre-Series A from Rainmatter (Nithin Kamath), Rohan Bopanna (tennis), WEH Ventures, Prequate Advisory ([Inc42](https://inc42.com/buzz/game-theory-bags-funding-from-nithin-kamath-rohan-bopanna-to-provide-sports-technology/); [Outlook Business](https://www.outlookbusiness.com/news/game-theory-raises-rs-17-cr-from-nithin-kamath-rohan-bopanna)).
- **Strengths**: Bengaluru, our home market. Rainmatter overlap with StepOut. Five physical facilities means they own playing-context data nobody else does.
- **Weaknesses**: Recreational sports (badminton, squash, swimming), not the football/cricket grassroots-talent funnel. Adult, urban, hobbyist user base.
- **Posture**: **Ignore directly; coordinate via Rainmatter.** Different audience, same investor universe. Useful as a portfolio neighbour if we ever raise from Rainmatter.

### 1.11 Str8bat (cricket sensor — different shape)

- Cricket-specific bat-sensor + analytics startup. Series A $3.5M Oct 2024 led by Exfinity Venture Partners ([Inc42 30 Startups Watch June 2025 mention](https://inc42.com/startups/30-startups-to-watch-startups-that-caught-our-eyes-in-june-2025/); [Inc42 sports tech roundup](https://inc42.com/startups/meet-the-startups-scoring-big-on-the-indian-sports-tech-pitch/)). Founded 2017, Bengaluru, by Gagan Daga, Rahul Nagar, Madhusudan R.
- **Why it matters less to us**: Hardware-first, cricket-specific, individual-improvement focused — not a discovery surface. **Posture: ignore.**

---

## 2. Adjacent / aspirational platforms scouts and academies use today

These aren't direct competitors but they sit in the workflow OnlyKrida wants to enter.

### 2.1 SAI Talent Identification & Development Scheme (TIDS) and Khelo India dashboards

The Sports Authority of India runs structured talent ID through SAI training centres, regional centres, and STCs ([SAI homepage](https://sportsauthorityofindia.nic.in/)). KIRTI is the digital-first overlay on this workflow. The implication for OnlyKrida: government talent ID is real, slow, and increasingly digital — we should not ignore it but should not try to compete head-on.

### 2.2 AIFF accredited academies directory + Blue Cubs grassroots programme

The AIFF maintains a public academy accreditation list (1–5 star) for 2025–26 ([AIFF accredited academies](https://www.the-aiff.com/accredited-academies); [AIFF article](https://www.the-aiff.com/article/academy-accreditation-results-for-2025-26-announced)). Their Blue Cubs grassroots programme is the official talent pathway ([AIFF grassroots reform](https://www.the-aiff.com/article/aiff-takes-strategic-steps-to-reform-grassroots-football-in-india)). Their published 2024 talent identification policy formalises six regions, regional heads, and warns players against unaccredited "scout agencies" ([Khel Now Dec 2024](https://khelnow.com/football/indian-football-aiff-talent-policy-202412); [AIFF revised technical doc PDF](https://www.the-aiff.com/media/uploads/2025/08/Revised.pdf)).

**Implication for OnlyKrida**: Position as AIFF-policy-compliant from day one. Scouts on OnlyKrida should ideally be verifiable against AIFF's framework. Avoid being lumped with the "unauthorized agencies" the AIFF explicitly warns parents about.

### 2.3 Decathlon Play (community / events / coaching)

Decathlon's app-based community platform — virtual challenges, coaching classes, playgrounds ([Decathlon Play on Play Store](https://play.google.com/store/apps/details?id=in.decathlon.allforsport&hl=en_IN); [Decathlon India main site](https://www.decathlon.in/)). In 2025 Decathlon entered a strategic partnership with **Playo** to access 5M+ users ([The Hans India coverage](https://www.thehansindia.com/business/decathlon-strengthens-its-sports-for-all-mission-through-partnership-with-playo-1033228)). Decathlon's reach (29,000+ pin codes) is unrivalled offline.

**Implication for OnlyKrida**: Decathlon is a distribution partner, not a competitor. Co-branded fitness-zone testing in stores, store-as-test-centre, sponsored fitness gear for top-zone athletes — all viable post-MVP plays.

### 2.4 Playo (sports community)

5M+ users in India + UAE/Qatar; sports community, venue booking, tournaments ([Tracxn](https://tracxn.com/d/companies/playo/__hzGLCwyg7RM5U_ln3BoAntuR13bl2DDLdISrcPE_Nao); [Inc42](https://inc42.com/startups/meet-the-startups-scoring-big-on-the-indian-sports-tech-pitch/)). Total funding ~$2.62M, last seed in Aug 2021. 2025 Amazon partnership for prepaid Playo vouchers redeemable across 5,000+ venues.

**Implication for OnlyKrida**: Playo is the social hobbyist layer. We are the talent layer. UAE overlap matters — they are already in our second market. **Partner candidate**, especially for the UAE expansion.

---

## 3. International benchmarks — what to steal, what to avoid

### 3.1 Hudl + Wyscout + StatsBomb (the consolidated giant)

Hudl acquired Wyscout in Aug 2019. On 12 August 2024, Hudl completed the acquisition of StatsBomb ([Hudl press release](https://www.hudl.com/blog/hudl-statsbomb-press-release-en); [World Soccer Talk](https://worldsoccertalk.com/news/statsbomb-acquired-by-hudl-after-11-years-as-a-soccer-blog/); [Sport Industry UK](https://sportindustry.co.uk/news-categories/news/us-tech-firm-completes-statsbomb-acquisition/)). Since 16 July 2024 all Wyscout accounts auto-migrated to Hudl logins. StatsBomb co-founders Ted Knutson and Charlotte Randall left post-acquisition. StatsBomb revenue ~£10M pre-sale.

Wyscout pricing reportedly starts at €250/year for individual scout accounts, club packages custom ([Wyscout pricing page](https://www.hudl.com/products/wyscout/pricing); [G2 reviews](https://www.g2.com/products/hudl-wyscout-api/reviews)). Wyscout tracks 250+ competitions globally.

**What to steal**: The structured player metadata model is mature and battle-tested. The "comparable players" feature pattern (find me a left-back who plays like X) is 100% applicable to OnlyKrida AI. The market accepts paying for scout subscriptions — this validates our scout-pays revenue model.

**What NOT to copy**: Their Western-pro-only positioning. Their pricing is fine for Premier League scouts; it is irrelevant for an academy in Hyderabad. We must be priced for the Indian academy / club / coach budget — not the European pro budget. Also: Wyscout video is a closed walled-garden of pro broadcast feeds; ours has to be open / UGC.

### 3.2 Veo (camera + AI for grassroots)

Dual-4K AI camera that auto-tracks the ball, producing match recordings + analysis ([Veo](https://www.veo.com/); [Veo: AI cameras transform youth academy ops](https://www.veo.co/en-us/article/how-ai-football-cameras-transform-youth-academy-operations)). India presence in Indian academies is anecdotal; no public penetration data — **search returned no specific India deployment numbers, treat India footprint as small in 2026.**

**What to steal**: The "automate the production step so grassroots becomes recordable" thesis. Vertical-mobile-only highlight extraction.

**What NOT to copy**: Hardware-first business model. We are software-only — anyone with a phone can be a creator on OnlyKrida.

### 3.3 Tonsser (the closest spiritual analog — lessons from a survivor)

Copenhagen-based football player app. Hit 1M users in 2019 ([EU-Startups](https://www.eu-startups.com/2019/10/copenhagen-based-football-scouting-app-tonsser-hits-one-million-users/)), now claims **2M+ active users / 1.7M creating "player identities" / live in 10 countries** including Denmark, France, Italy, Spain, Norway, Sweden ([Tonsser](https://tonsser.com/); [Tonsser on Play Store](https://play.google.com/store/apps/details?id=com.tonsser.tonsser&hl=en); [Sky Sports profile](https://www.skysports.com/football/news/11095/12328439/tonsser-united-the-app-helping-amateur-players-beat-the-world-s-best); [App Store listing](https://apps.apple.com/gb/app/tonsser-football-player-app/id963163548)). Funding: €5.5M Series A in Dec 2018 ([TechCrunch](https://techcrunch.com/2018/12/18/tonsser-scores-series-a/)). 2025/26 release added a social Home Feed where players post and follow.

**This is the single most relevant comp.** Tonsser is what OnlyKrida looks like in 5 years if it executes — football-only, Europe-only version of the same idea.

**What to steal directly**:

- Player-identity-as-product (career page, stats, highlights).
- Fans-can-follow-players (Tonsser opened to "fans, family, friends" in 2025/26 — this is a clear engagement multiplier).
- Player-of-the-week / player-of-the-month gamification.
- Coach-rates-player flow as an authority signal.

**What NOT to copy**:

- Single-sport. India has 7+ relevant sports; locking ourselves to football wastes our addressable market.
- Slow social-feed evolution. Tonsser took 7 years to add a real Home Feed; we should ship that within Wave 2.
- Europe-only distribution. We have a built-in cricket / kabaddi vertical they cannot touch.

### 3.4 MyCujoo / FIFA+

MyCujoo was the amateur/semi-pro long-tail football streaming platform; acquired by Eleven Sports in Nov 2020, which in turn was acquired by DAZN in Sept 2022 ([MyCujoo Wikipedia](https://en.wikipedia.org/wiki/MyCujoo); [arunfoot](https://www.arunfoot.com/eleven-sports-completes-acquisition-of-mycujoo/); [Inside World Football 2020](https://www.insideworldfootball.com/2020/05/27/live-streamer-mycujoo-opens-tech-platform-give-users-video-options/)). FIFA+ is FIFA's own consumer streaming product, available in India ([FIFA+](https://www.plus.fifa.com/en/); [Olympics.com on FIFA U-20 2025 streaming in India](https://www.olympics.com/en/news/fifa-u-20-world-cup-2025-schedule-watch-live-streaming-india)).

**Lesson**: Pure amateur-streaming as a standalone product gets consolidated into a bigger media brand. OnlyKrida should not try to become an OTT — we should _embed_ clips, not host a streaming product.

### 3.5 STATSports / Catapult (wearables — for awareness)

Pro-grade GPS/biometric wearables. Way too expensive for grassroots India. Mentioned only because scouts may ask "do you have GPS data?" — answer: no, we use phone-based Yo-Yo / sprint / vertical-jump tests with verification multipliers per `constants/verification.ts`. That is the right call for our user.

---

## 4. The informal layer — WhatsApp, Telegram, YouTube, ground-staff networks

This is the actual current state of grassroots scouting in India. It deserves more weight than the seed gave it.

- **WhatsApp scout groups exist and are how 80%+ of trial information actually moves.** "Football Trials India" group culture is widely acknowledged — as documented by India Khelo Football and Dominators FA, networking with local coaches and clubs through WhatsApp/Telegram is the canonical path to learning about trials before they're publicly announced ([Dominators FA on academy selection](https://dominatorsfa.com/how-to-get-selected-for-a-football-academy-in-india/); [WhatsApp football group link aggregator](https://www.whtsagrouplinks.com/football-whatsapp-group-link/)).
- **India Khelo Football** itself runs final-selection notifications via official WhatsApp number (+91 8850119762) ([IKF trial guidelines](https://www.indiakhelofootball.com/noticeboard/trialguidelinesinstructions)), which is striking — even a structured non-profit defaults to WhatsApp.
- **AIFF's own talent ID policy explicitly warns parents against unauthorised "agencies"** offering access to national camps — implicit acknowledgement that the WhatsApp/agent grey market is real and predatory ([Khel Now](https://khelnow.com/football/indian-football-aiff-talent-policy-202412)).
- **YouTube as portfolio surrogate**: Indian grassroots players uploading "trial reel" videos to YouTube/Instagram is the de facto highlight platform today.
- **No central Discord / Telegram channel of any meaningful aggregate size for Indian football scouting was found in our search** — the activity is fragmented across thousands of small WhatsApp groups, which is itself the opportunity.

**Strategic implication for OnlyKrida**:

- The WhatsApp-group reality means our biggest competitor is not another app — it's the status quo of "my coach knows a guy."
- Our growth loop must be designed to _replace_ the WhatsApp message ("Trial in Bengaluru on Sat, U-16, send video to this number") with a structured opportunity post.
- A _send-to-WhatsApp / share-to-WhatsApp_ feature on every athlete profile and opportunity is non-negotiable. We have to live where users are, not force a migration off WhatsApp.
- The AIFF "warning to parents" framing is a gift: position OnlyKrida explicitly as the _anti-agent_, transparent, AIFF-policy-aligned alternative to grey-market scouts.

---

## 5. 2x2 positioning map

**Axes chosen** (the two most strategic):

- **X: Grassroots / amateur ←→ Pro / elite**
- **Y: Athlete-owned identity ←→ Institution-owned tooling**

```
                               PRO / ELITE
                                    |
            Hudl + Wyscout +        |
            StatsBomb               |       (pro club analytics)
                  •                 |
                StepOut •           |
                       AiSCOUT •    |
                                    |
                                    |
    INSTITUTION ────────────────────┼──────────────────── ATHLETE
                                    |
                                    |
    KIRTI / Khelo India •           |        • Tonsser
    ScoutMe (AIFF) •                |
                                    |        ★ OnlyKrida
    KhiladiPro •                    |
                                    |        • CricHeroes (cricket)
    SportVot • (content, not        |
              identity)             |        • SAI talent funnel
                                    |
    KheloMore • (booking)           |        • Playo (community)
                                    |
                               GRASSROOTS / AMATEUR
```

**Reading the map**:

- The **bottom-right quadrant — grassroots + athlete-owned — is sparsely populated**, and it is where OnlyKrida lives.
- Tonsser proves the quadrant is winnable but is football-only and Europe-only.
- CricHeroes occupies the cricket version of this quadrant; nobody owns the football version in India.
- The bottom-left quadrant (grassroots + institution-owned) is crowded with government and institutional tooling — that's the "official" scouting funnel.
- The top half (pro/elite) is StepOut/Hudl/Wyscout territory — adjacent, not target.

**The strategic gap**: There is no Indian, multi-sport, athlete-owned, grassroots, scout-discoverable identity platform. That is the slot.

---

## 6. Per-competitor "what to do" recommendation summary

| Competitor             | Posture                                       | Rationale                                                                   |
| ---------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| SportVot               | **Partner**                                   | Content layer; we are identity layer. Complement, not substitute.           |
| Khelo India / KIRTI    | **Coexist + downstream partner**              | Government trust signal; we sit "after KIRTI".                              |
| ScoutMe (AIFF)         | **Ignore, watch AIFF**                        | Likely moribund; real risk is AIFF re-anointing a successor.                |
| EliteFootball India    | **Ignore**                                    | No demonstrable Indian product activity.                                    |
| KhiladiPro             | **Compete head-on, different segment**        | Most product-overlap. Win urban + scout-side; let them have schools/tier-3. |
| StepOut                | **Partner — high priority**                   | They own match-data; we own player-identity. Joint integration is unlock.   |
| AiSCOUT (RFYC)         | **Compete obliquely**                         | Trial-only product. Own the off-cycle 11 months of the year.                |
| CricHeroes             | **Coexist, eventual acquire-target**          | Cricket-only and structurally cannot multi-sport.                           |
| KheloMore              | **Partner**                                   | Booking/coach marketplace handshake; Dream11-network access useful.         |
| Game Theory            | **Ignore directly; co-investor coordination** | Different sports; same Rainmatter network.                                  |
| Str8bat                | **Ignore**                                    | Hardware-first, individual-improvement, not discovery.                      |
| Hudl/Wyscout/StatsBomb | **Steal patterns, do not compete on price**   | Different stratum. Use them as design reference.                            |
| Veo                    | **Steal patterns**                            | Software-only equivalent; partner if any India distributor surfaces.        |
| Tonsser                | **Steal patterns aggressively**               | Closest spiritual analog. Read every product update.                        |
| MyCujoo / FIFA+        | **Ignore as competitor**                      | Embed/share into them, don't try to be them.                                |
| Decathlon Play / Playo | **Distribution partners**                     | Their reach + our identity = co-marketing wins.                             |

---

## 7. The 5 most credible threats to OnlyKrida in 2026–2027

### Threat 1 — KhiladiPro raises a Series A and adds a scout-side product

- **Why credible**: They have $1M pre-seed (Oct 2025), credible deep-tech investors (Shastra VC, MGA), and a stated growth target of 200K assessments in 2025. A Series A in 2026 is the natural cadence. The moment they ship a scout-discovery surface on top of their fitness-assessment dataset, they directly overlap our product — and they will already have a quantitative dataset of fitness scores at scale.
- **Mitigation**:
  - Move fast on scout-side product. Our verification multipliers (`constants/verification.ts`) and AI matching are our edge.
  - Lock in 50+ academies and 10+ ISL/I-League scouts on exclusive-pilot terms before they pivot.
  - Differentiate on multi-sport. Their assessment library is built for school PE — football-specific drills, cricket nets, kabaddi-specific tests are our depth.

### Threat 2 — StepOut launches an athlete-side product and inherits Bengaluru FC + AIFF distribution

- **Why credible**: They already have AIFF and Bengaluru FC. Rainmatter has indicated they want to fund the player-side eventually ("expand to amateur sports"). $1.5M Pre-Series A capital + Rainmatter's portfolio reach (Game Theory, Zerodha distribution) makes the consumer push possible. If they ship even a basic player profile with match-stats auto-flowing in, we lose the "structured football data" pitch.
- **Mitigation**:
  - **Approach them for partnership before they build it.** Frame: "you do match-analysis, we do player-identity, here's a clean integration." Make it more attractive to integrate than to build.
  - Cross-sport positioning insurance — be the player's home for football _and_ cricket _and_ kabaddi, so a football-only StepOut consumer product is a partial substitute, not a full one.
  - Build the social/fan layer fast. StepOut culture is engineering/B2B; they do not naturally ship social.

### Threat 3 — AIFF + Reliance Foundation announce a year-round AiSCOUT Pan-India platform

- **Why credible**: RFYC already runs trials on AiSCOUT. The Reliance ecosystem (Jio distribution, Mukesh Ambani's halo) could push AiSCOUT from "annual trial gate" to "daily use" with one product decision. AIFF has explicitly modernised their TID policy in Dec 2024 — the appetite is there.
- **Mitigation**:
  - Get AIFF accreditation / endorsement _for OnlyKrida itself_ in 2026 — even a non-exclusive "approved athlete platform" badge.
  - Build relationships at AIFF technical level (the people who picked AiSCOUT) before any RFP for a Pan-India platform.
  - If we cannot beat Reliance on distribution, beat them on athlete experience and multi-sport. AiSCOUT is football-only and trial-driven — we are 365-day, 7-sport.

### Threat 4 — A foreign player enters India: Hudl-Wyscout localises, or Tonsser launches in India

- **Why credible**: Hudl-Wyscout has scale, capital, and the Asia-Pacific motion is open after the StatsBomb acquisition. Tonsser has the spiritual-twin product; an "expand to India" decision is 1 product cycle away. The FIFS/Deloitte report showing a $5.7B market by FY29 is exactly the kind of TAM signal that triggers entry.
- **Mitigation**:
  - **Speed and India-context**. They will arrive with English-only UX, no Hindi/Tamil/Kannada, no UPI, no understanding of Cricket/Kabaddi. We win on local context.
  - "Never demotivate" growth-language framing is culturally specific — Indian/Asian families need it; European products feel cold.
  - Lock distribution: 100+ academies on long-term partnerships, AIFF endorsement, state-federation MoUs. Make India a place foreign players have to acquire someone (us) to enter.

### Threat 5 — Government goes full-stack: KIRTI → Khelo India app becomes a national athlete portfolio

- **Why credible**: Draft National Sports Policy 2024 explicitly emphasises grassroots-to-national digitisation. KIRTI is already an "AI-driven talent prediction" product. The Khelo India app added facial-verification accreditation for KIWG 2026. The trajectory points at: government-issued, free, mandatory athlete portfolio.
- **Mitigation**:
  - Never compete on the trust-with-parents axis vs. a government product — we will lose.
  - Position OnlyKrida as the **opportunity layer the government does not provide**: ISL clubs, academies, brand sponsorships, coaching, trials — the private-sector half. KIRTI gets you tested; OnlyKrida gets you signed.
  - Pursue formal data-portability ("Import my Khelo India data") rather than competing on the assessment itself.
  - Build the scout-side moat the government will never build well — government products are notoriously bad B2B/marketplace tooling.

---

## TL;DR (founder-facing)

The Indian grassroots talent-discovery slot is real, growing (₹49,500 Cr sports-tech market by FY29), and _almost_ unoccupied. The closest direct competitor to OnlyKrida's specific shape — multi-sport, athlete-owned, scout-discoverable, AI-matched — does not exist in India today. The fragments that surround the slot are: a content layer (SportVot), an analytics layer (StepOut), a fitness-assessment layer (KhiladiPro), a cricket-only network-effect giant (CricHeroes), a booking marketplace (KheloMore), a government talent funnel (KIRTI / Khelo India), and a Reliance-RFYC trial gate (AiSCOUT). The international spiritual analog is Tonsser, which has 2M+ active users in Europe and validates the model. Speed matters: KhiladiPro just raised, StepOut is on Pre-Series A, and AIFF's 2024 TID policy + KIRTI's digital ambitions both point at activity acceleration through 2026–27. The right strategic posture is to **partner aggressively upstream (StepOut, SportVot, KheloMore), coexist with government (Khelo India / KIRTI), compete head-on with KhiladiPro on the urban+scout-side wedge, and own the football+cricket+kabaddi+athletics quadrant of the bottom-right of the map** — grassroots, athlete-owned — before someone else does. Single biggest 2026 watch-item: a KhiladiPro Series A or a StepOut consumer-app launch.

---

## Changelog

- 2026-04-26: Initial deep-dive. Replaces the 1-paragraph-each seed with sourced profiles for SportVot, Khelo India / KIRTI, ScoutMe, KhiladiPro, StepOut, AiSCOUT, CricHeroes, KheloMore, Game Theory, Str8bat; international benchmarks (Hudl-Wyscout-StatsBomb, Veo, Tonsser, MyCujoo / FIFA+); informal-layer (WhatsApp / YouTube) analysis; 2x2 positioning map; per-competitor posture; top-5 threats with mitigations.
