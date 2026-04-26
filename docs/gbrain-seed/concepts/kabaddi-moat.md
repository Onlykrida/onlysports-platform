---
type: concept
title: Kabaddi as OnlyKrida's defensible moat — ecosystem deep-dive
tags: [kabaddi, moat, pkl, akfi, india, strategy, deep-research]
---

## TL;DR — Thesis verdict: CONFIRMED, with caveats

The "kabaddi as OnlyKrida's defensible moat" thesis **holds up** under 2026-current evidence. The Pro Kabaddi League is a genuine professional layer (12 franchises, Dabang Delhi K.C. won Season 12 in October 2025, 3x digital growth on JioStar, 10+ players breached the ₹1 crore mark in the Season 12 auction — [Business Standard](https://www.business-standard.com/sports/pro-kabaddi-league/pkl-2025-auction-may-31-live-updates-pawan-devank-set-to-go-under-hammer-in-mumbai-today-125053100400_1.html)). The grassroots-to-PKL pipeline is real but **structurally illegible to scouts** — talent flows through village akhadas, regional federations, and an annually-disputed AKFI rather than through any digital surface area. There is **zero meaningful Hugging Face dataset coverage** of kabaddi (confirmed via direct search of `huggingface.co/datasets?search=kabaddi`). No incumbent sports-tech platform is targeting kabaddi athletes specifically.

Caveats that could shrink the moat:

1. The **Yuva Kabaddi Series** (YKS) is the closest thing to a digital-first developmental funnel and is moving fast — they're already on FanCode and run year-round across 26 teams ([Yuva Kabaddi About](https://www.yuvakabaddi.com/about-yuvakabaddi)). They are not building athlete-portfolio software, but they own the youth attention.
2. **AKFI's governance was partially restored in February 2025** under the Vibhor Vineet Jain governing body, with the IKF lifting its suspension by March 2025 ([khelnow](https://khelnow.com/kabaddi/indian-kabaddi-federation-ban-to-lifted-202503)). A more functional AKFI could either become a partner or build something competing.
3. **The grassroots-to-PKL pipeline is informal but not invisible** — village akhadas in Sonipat (Pardeep Narwal's Rindhana), Vadgaon Sahani in Pune, and the Haryana Kabaddi Academy are well-known nodes. Scouts already know where to look. OnlyKrida's pitch must be "we make the _long tail_ of academies legible," not "we discover hidden talent" full-stop.

The 12-month playbook below assumes the thesis holds and prescribes a Hyderabad-first, Telugu Titans-anchored, 2,000-clip raid-action dataset as the wedge.

---

## 1. Pro Kabaddi League state-of-play (April 2026)

### Season 12 (Aug–Oct 2025) — most recent completed season

- **Champion**: Dabang Delhi K.C. defeated Puneri Paltan in the final at Thyagaraj Sports Complex, Delhi on 31 October 2025 (Naveen Kumar led the charge — [SportsBoardIndia](https://sportsboardindia.com/kabaddi/pro-kabaddi-league-2025/)). This is Delhi's second PKL title.
- **Format**: Same 12 franchises returned. League stage = 108 matches, each team played 18, hosted across Vizag, Jaipur, Chennai, Delhi ([Wikipedia 2025 PKL](https://en.wikipedia.org/wiki/2025_Pro_Kabaddi_League), [Outlook India](https://www.outlookindia.com/sports/others/pro-kabaddi-league-season-12-preview-format-host-cities-full-squads-live-streaming-all-you-need-to-know-about-pkl-2025)).
- **Auction (May–Jun 2025, Mumbai)**: 529 players went under the hammer, 121 were sold. **Mohammadreza Shadloui** (Iranian all-rounder) was the most expensive at ₹2.23 crore (Gujarat Giants), followed by Devank Dalal at ₹2.205 crore. **Ten players breached ₹1 crore** — an all-time high vs eight in 2024 ([Business Standard auction](https://www.business-standard.com/sports/pro-kabaddi-league/pkl-2025-auction-may-31-live-updates-pawan-devank-set-to-go-under-hammer-in-mumbai-today-125053100400_1.html), [ESPN auction](https://www.espn.com/kabaddi/story/_/id/45395952/pro-kabaddi-league-season-12-pkl-auction-2025-full-list-players-bought-price)).
- **Viewership**: 3x digital reach growth, +22% watch-time across JioStar vs Season 11. Opening-day TVR higher than prior season ([mediabrief](https://mediabrief.com/pro-kabaddi-league-s12-opens-with-strong-viewership/), [medianews4u](https://www.medianews4u.com/pro-kabaddi-league-12-opens-with-record-breaking-viewership-on-jiostar/)). Season 11 totalled 283M+ viewers across TV+digital.

### Season 11 (Oct–Dec 2024) — for context

- **Champion**: Haryana Steelers (maiden title), beat Patna Pirates 32–23 on 29 Dec 2024 at Balewadi, Pune.
- **Prize money**: ₹4.8 crore total finalist pool — winners ₹3 crore, runners-up ₹1.8 crore ([myKhel awards](https://www.mykhel.com/kabaddi/pkl-final-2024-full-list-of-award-winners-prize-money-all-you-need-to-know-330143.html)).
- **Season 11 MVP**: Mohammadreza Shadloui (Haryana) — ₹20 lakh. **Best raider**: Devank Dalal (Patna) — ₹15 lakh. **Best defender**: Nitesh Kumar (Tamil Thalaivas) — ₹15 lakh. **Coach of the season**: Manpreet Singh (Haryana) — ₹5 lakh.

### The 12 franchises — owners and head coaches (Season 12)

| Team                 | Owner                                                                                                    | Head Coach (S12)                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Bengaluru Bulls      | Kosmik Global Media (Uday Sinh Wala)                                                                     | BC Ramesh (2x title-winning coach)                              |
| Bengal Warriorz      | Future Group / Kishore Biyani-linked                                                                     | (see PKL coach page)                                            |
| Dabang Delhi K.C.    | DO IT Sports Mgmt (Radha Kapoor Khanna — only female owner)                                              | (S12 champions)                                                 |
| Gujarat Giants       | Adani Wilmar (Gautam Adani)                                                                              | —                                                               |
| Haryana Steelers     | JSW Sports (Jindal South West)                                                                           | Manpreet Singh                                                  |
| Jaipur Pink Panthers | Abhishek Bachchan                                                                                        | —                                                               |
| Patna Pirates        | Pirates Sports India / Rajesh V Shah linked                                                              | **Anup Kumar** (former India captain — replaced Narender Redhu) |
| Puneri Paltan        | Insurekot Sports LLC                                                                                     | —                                                               |
| Tamil Thalaivas      | Magnum Sports (Sachin Tendulkar consortium-linked)                                                       | —                                                               |
| Telugu Titans        | Veera Sports — Srinivas Sreeramaneni (Vaya Group), Gautham Nedurumalli (NED), **Mahesh Kolli (Greenko)** | **Krishan Kumar Hooda** (retained); Ramesh Kumar                |
| U Mumba              | Unilazer Ventures (Ronnie Screwvala)                                                                     | —                                                               |
| UP Yoddhas           | GMR Group                                                                                                | —                                                               |

Sources: [SportsCafe owners blog](https://sportscafe.in/blogs/pro-kabaddileague/pro-kabaddi-team-owners), [iSportsLeague S12 owners](https://www.isportsleague.com/pro-kabaddi-league-team-owner-list/), [Zee News head coaches](https://zeenews.india.com/photos/sports/meet-head-coaches-of-all-12-teams-ahead-of-pkl-2025-anup-kumar-for-patna-pirates-manpreet-singh-for-haryana-steelers-check-full-list-2951624), [Telugu Titans Wikipedia](https://en.wikipedia.org/wiki/Telugu_Titans).

### Broadcast & commercials

- **Broadcast partner**: JioStar (formed Feb 2025 by merging JioCinema + Disney+ Hotstar). TV: Star Sports 1/HD; OTT: JioHotstar ([streaminglab](https://www.thestreaminglab.com/p/disney-hotstars-kabaddi-revolution)).
- **League ownership**: Star India holds **74% of Mashal Sports** (PKL's parent), acquired in 2015 ([Sportskeeda](https://www.sportskeeda.com/amp/kabaddi/its-kabaddi-time-for-star-buys-74-stake-in-pro-kabaddi)). Mashal was founded by Anand Mahindra and Charu Sharma.
- **Media rights**: Star retained PKL media rights for ₹181 crore in the 2021 auction ([Business Standard](https://www.business-standard.com/article/companies/star-india-retains-pro-kabaddi-league-media-rights-for-rs-181-crore-121041800892_1.html)).

### How does PKL identify talent today? — the honest answer

Through three messy channels, none of which is digital-first:

1. **Auction pool feeders**: Senior National Championships + Khelo India Youth Games + state-level kabaddi tournaments. Players who do well at Senior Nationals (run by AKFI) get noticed by franchise scouts.
2. **Franchise scouting trips**: Each franchise sends scouts to regional tournaments. There is **no public unified scouting platform**; this is largely relationship-based. (Search results returned zero documentation of a PKL-wide junior scouting system — only academy/private tournament references.)
3. **Category D / NYP (New Young Player)**: PKL auction has 4 categories (A/B/C/D); D is base price ₹9 lakh and is where developmental signings live. **35 NYPs were retained for Season 12** ([prokabaddi.com retentions](https://www.prokabaddi.com/news/pro-kabaddi-league-announces-retained-players-list-for-season-12)). NYP is the moat-relevant category — it's where a digitally-discovered athlete plausibly enters the system.

**Punchline for OnlyKrida**: PKL has zero structured grassroots-to-Category-D pipeline software. A scout's tools today are: phone calls, WhatsApp video clips, in-person trips to Sonipat/Karnal/Vizag, and the AKFI Senior Nationals tape. This is exactly the inefficiency OnlyKrida is built to compress.

---

## 2. Below PKL — the talent funnel

### Senior National Kabaddi Championship

- **71st edition (Feb 2025)**: Hosted by Odisha Kabaddi Association under AKFI, Cuttack, Feb 20–23. Men's champion: **Services** (beat Railways 30–30, won 6–4 on tie-breaker, led by Naveen Kumar — [Olympics.com](https://www.olympics.com/en/news/senior-national-men-kabaddi-championship-2025-winner-services)). Women's: 71st edition held Feb 15–18 in Karnal, Haryana.
- **72nd edition (2026)**: [Olympics.com 72nd](https://www.olympics.com/en/news/72-senior-national-kabaddi-championship-2026-men-results-scores-standings) confirms continuity.
- Services and Railways consistently dominate — they're institutional employers with year-round professional setups. Haryana and Maharashtra are the strongest pure-state teams.

### Khelo India Youth Games (KIYG) 2025

- Held May 4–15 2025 in Bihar across Patna, Rajgir, Gaya, Bhagalpur, Begusarai. Kabaddi was contested May 4–8 ([Olympics.com KIYG schedule](https://www.olympics.com/en/news/khelo-india-youth-games-2025-kiyg-schedule)).
- **Boys' kabaddi champion**: Haryana, captained by Jai Hind Lather, beat Maharashtra 39–28 in the final ([Olympics.com Haryana win](https://www.olympics.com/en/news/with-the-target-of-playing-in-pro-kabaddi-dominant-haryana-were-on-a-roll-at-khelo-india-youth-games-2025)).
- Selection path: Top 4 from National School Games + 2 federation nominations + 1 host state + 1 organising committee = participation.

### Khelo India University Games (KIUG) 2025

- Hosted Nov 24 – Dec 5 2025 across 7 Rajasthan cities. 4,000+ athletes from 200+ universities ([Olympics.com KIUG](https://www.olympics.com/en/news/khelo-india-university-games-2025-kiug-medal-tally-table-winners-table)).
- **Overall champion**: Chandigarh University (defended title with 67 medals — also won kabaddi medals).
- Inter-university kabaddi is a real funnel — many PKL players are AIU/Chandigarh University graduates.

### Yuva Kabaddi Series (YKS)

- Year-round professional youth league founded 2022 — **the most legible developmental tier today** ([yuvakabaddi.com about](https://www.yuvakabaddi.com/about-yuvakabaddi)).
- **Edition 11 (2025)**: 26 teams, 3 divisions, hosted in Coimbatore. Division winners: Palani Tuskers (Div 1), UP Falcons (Div 2), Vasco Vipers (Div 3).
- **Yuva All Stars Championship 2025 (inaugural)**: 12 teams, 6 from YKS qualifiers + 6 invitational, held in Haridwar. Won by Jaipur Pink Cubs.
- **Streaming**: FanCode partnership ([fancode YKS](https://www.fancode.com/kabaddi/tour/krantijyot-mahila-pratishtan-yuva-kabaddi-series-15896512/matches)).

This is the single most important non-PKL entity in the kabaddi pipeline. **Strategic note**: YKS is a **content/league** play, not an athlete-portfolio play. They have no scout-search software. They are a _partnership target_, not a competitor — see Section 7.

### School kabaddi & registered player numbers

Public registration counts are not centrally reported. AKFI's [results](https://www.indiankabaddi.org/results.html) and [calendar PDF](https://www.indiankabaddi.org/documents_2024/calendar_2024-2025-2.pdf) document state-level participation, but no totalised "X lakh registered junior players" number is published. This _itself_ is the data gap OnlyKrida can fill — being the de facto registry is moat-shaped.

---

## 3. AKFI — Amateur Kabaddi Federation of India (2025–26 status)

- **President (2026)**: **Vibhor Vineet Jain**. **General Secretary**: Jitendra Thakur. Elected December 2023 ([Lexology](https://www.lexology.com/library/detail.aspx?g=432511df-5047-4a4c-8f53-8d944ed56f40), [foxmandal](https://foxmandal.in/News/sc-hands-reins-of-kabaddi-federation-to-elected-body/)).
- **Governance dispute timeline**:
  - 2018: Delhi HC quashed Janardan Singh Gahlot family "Life President" appointments.
  - 2019–24: Justice (Retd.) S.P. Garg ran AKFI as court-appointed administrator.
  - Dec 2023: New body elected, but Delhi HC initially ruled it non-compliant with National Sports Code 2011.
  - 2024: **IKF (International Kabaddi Federation) suspended AKFI** — Indian teams briefly barred from global competition ([thebridge IKF suspension](https://thebridge.in/kabaddi/akfi-suspended-ikf-49766), [InsideSport](https://www.insidesport.in/chak-de-india/international-kabaddi-federation-suspends-akfi-indian-teams-barred-from-global-competitions/)).
  - **Feb 6 2025**: Supreme Court ordered Justice Garg to hand over control to the elected body. Court emphasized this did NOT imply recognition — issues remain to be resolved ([Lexology](https://www.lexology.com/library/detail.aspx?g=432511df-5047-4a4c-8f53-8d944ed56f40), [drishtiias](https://www.drishtiias.com/daily-updates/daily-news-analysis/sc-slams-politicisation-of-sports-administration)).
  - **March 2025**: IKF president Vinod Kumar Tiwari confirmed the AKFI ban would be lifted ([khelnow IKF](https://khelnow.com/kabaddi/indian-kabaddi-federation-ban-to-lifted-202503)).
  - **April 17 2025**: Next SC hearing scheduled (no major reversal reported through April 2026).
- **Digital footprint**: [indiankabaddi.org](https://www.indiankabaddi.org/) is the official site. It's a Web 1.0 noticeboard — calendars, PDF results, no athlete database, no API, no media beyond static notifications. **This is exactly what OnlyKrida should backfill**.
- **Implication for OnlyKrida**: AKFI is institutionally weak and digitally absent. A _non-political_ athlete platform that doesn't try to displace federation authority but instead provides infrastructure (athlete profiles, fitness data, scout discovery) is welcomed by every constituency. Don't try to be "the AKFI app" — be the fabric AKFI hands their tournament tape to.

---

## 4. Geographic talent pockets

### Haryana — the kabaddi heartland

- **Sonipat** is the production engine. Pardeep Narwal (highest raid-points scorer in PKL history) is from **Rindhana village, Sonipat** — joined Haryana Kabaddi Academy at 12 ([Wikipedia Pardeep Narwal](https://en.wikipedia.org/wiki/Pardeep_Narwal)). He runs **Narwal Sports Academy** in his village; 4–5 PKL-active players have emerged from it.
- **Kabaddi Champions League Haryana (KCL)** launched in Sonipat in August 2025 — explicit grassroots-to-PKL pathway, brand ambassador Rajesh Narwal ([Field Vision blog](https://indianfootballcasuals.wordpress.com/2025/08/19/kabaddi-champions-league-haryana-launched-in-sonipat-set-to-showcase-grassroots-talent-on-a-professional-stage/)).
- Haryana won KIYG 2025 kabaddi (men's) — captain Jai Hind Lather. Haryana Steelers are the reigning Season 11 champions.

### Maharashtra — the second pillar

- **Vadgaon Sahani** village, Junnar taluka, Pune district, is nicknamed **"Kabaddi chi Pandhari"** (the holy land of kabaddi) — produced multiple national-team players ([thechenabtimes](https://thechenabtimes.com/2026/04/26/vadgaon-sahani-pune-village-revered-as-kabaddi-chi-pandhari/)).
- **Mumbai Upnagar Kabaddi Association** (founded 1982) has **~850 affiliated clubs** in greater Mumbai ([mumbaiupnagarkabaddi.com](https://www.mumbaiupnagarkabaddi.com/)) — a staggering long-tail.
- **Midline Academy** (Karjat), founded by Aniket Mhatre (sports MBA), pulls athletes from across Maharashtra and beyond.
- Maharashtra runs the **Krantijyot Mahila Pratishtan Yuva Kabaddi Series** — 16-district intrastate tournament, won by Ahmednagar Periyar Panthers.
- Two PKL franchises (U Mumba, Puneri Paltan) anchor the state.

### Andhra Pradesh / Telangana

- Kabaddi is the **state game** of both AP and TS (called "cheduguda"). Ditto for Tamil Nadu ("sadugudu"). [Wikipedia Kabaddi](https://en.wikipedia.org/wiki/Kabaddi).
- Hyderabad has **AP Kabaddi Association** + **Telangana Kabaddi Association**, plus SAI Secunderabad, JNTU-H, and Osmania University as institutional centres.
- Listed academies: Krishna Kabaddi Academy (Vijayawada), Vizag Sports Academy, Srikakulam Kabaddi Academy, Sri Satya Sai Sports Academy (Puttaparthi), Sri Krishna Club (Kachiguda, Hyderabad).
- **AP beat Telangana 47–45 at Senior Nationals** (Vadodara) — not the dominant talent state historically, but improving.
- **Telugu Titans** (PKL franchise) is based in Hyderabad, plays home games at Rajiv Gandhi Indoor Stadium, Vizag. Co-owner **Mahesh Kolli (Greenko)** is in the Hyderabad business circuit — geographically and socially the closest PKL franchise to Anirudh.

### Tamil Nadu

- **Tamil Thalaivas** (Magnum Sports / Sachin Tendulkar consortium) is the franchise. Coimbatore is now a youth-kabaddi hub thanks to YKS Edition 11 hosting.
- [Tamil Nadu Kabaddi League](https://www.instagram.com/tamilnadukabaddileague/?hl=en) is active on Instagram — visible grassroots scene.

### Punjab, UP

- **UP Yoddhas** (GMR Group) is the franchise. UP runs a Pro League (UPKL) covered by [Kabaddi Adda](https://www.kabaddiadda.com/kabaddi/why-india-needs-more-leagues-like-the-upkl-and-kcl-uncovering-grassroots-talent-and-powering-kabaddis-next-evolution/).
- Punjab's kabaddi is mostly "circle kabaddi" (different ruleset, more popular in the diaspora) rather than mat kabaddi — so it's a **separate funnel** from PKL. Don't conflate.

---

## 5. Women's kabaddi — the double-invisibility problem

- **Women's Kabaddi League (WKL)**: Started 2023. **Season 2 held in 2025 in India** (returned from a Dubai pilot edition). 8 teams: Bengaluru Hawks, Delhi Durgas, Gujarat Angels, Haryana Hustlers, Great Marathas, Rajasthan Raiders, Telugu Warriors, UP Ganga Strikers ([WKL Wikipedia](https://en.wikipedia.org/wiki/Women's_Kabaddi_League), [aninews](https://www.aninews.in/news/business/a-new-era-for-kabaddi-indian-womens-kabaddi-league-wkl-2025-back-to-india-with-exciting-developments20241009175843/)). Trials announced Nov 19 2024 across 4 regional hubs ([Business Standard WKL trials](https://www.business-standard.com/content/press-releases-ani/women-kabaddi-league-wkl-opens-nationwide-trials-your-chance-to-shine-in-wkl-2025-124111901029_1.html)).
- **Women's Kabaddi World Cup 2025 (Dhaka, Nov 17–24)**: India won by beating Chinese Taipei 35–28 in the final, after thrashing Iran 33–21 in the semifinal ([thebridge semis](https://thebridge.in/kabaddi/india-beat-iran-reach-womens-kabaddi-world-cup-final-2025-55274), [ESPN women WC](https://www.espn.com/kabaddi/story/_/id/47291566/with-2025-kabaddi-world-cup-win-women-athletes-done-their-bit-their-sport-now-take-off)). India's second WC crown (first was inaugural 2012).
- **Asian Women's Kabaddi Championship 2025**: Held — India squad covered by [Olympics.com](https://www.olympics.com/en/news/asian-women-kabaddi-championship-2025-india-schedule-squad).
- **The double-invisibility problem**: Women's national-team players are world champions but the WKL has no PKL-equivalent broadcast deal, no celebrity ownership tier, no auction circus. Scouts' attention is structurally smaller. **For OnlyKrida this is the highest-leverage subsegment** — a women's kabaddi athlete who builds an OnlyKrida profile with verified fitness data has _no other digital surface_ for discovery. Onboarding the 2025 WC squad as anchor users is a tractable PR move.

---

## 6. International kabaddi — the export-the-platform play

- **India dominance**: India has won 10 of 11 head-to-head matches against Iran in major events; the lone loss was the 2018 Asian Games semifinal. India then won the controversial 2023 Asian Games final 33–29 (the match was paused for an hour due to differences between PKL and IKF lobby rules — [ESPN moment of year](https://www.espn.in/espn/story/_/id/39118554/moment-year-2023-india-vs-iran-went-kabaddi-epic-embarrassment-asian-games-final), [Outlook protest](https://www.outlookindia.com/sports/asian-games-2023-indian-men-s-kabaddi-team-stages-dramatic-mat-sit-in-protest-halts-gold-medal-match-against-iran-for-one-hour-news-323129)).
- **2026 Asian Games** in Aichi-Nagoya, Japan (September 2026) — kabaddi confirmed on the programme.
- **Iran is the #2 kabaddi nation**. PKL Season 12's most expensive player (Shadloui) and Season 11 MVP are both Iranian — Iranian players are PKL franchise mainstays. The IKF has 30+ member nations including Bangladesh, South Korea, Japan, UK, Kenya, Argentina.
- **Why this matters for OnlyKrida**: India's kabaddi software, if built first for the Indian ecosystem, becomes the _default_ kabaddi software internationally. Iranian athletes already enter the Indian system via PKL auction; building athlete profiles for them in OnlyKrida is the natural multinational extension, with no real competitor in any of these geographies. **Year-3 expansion thesis: OnlyKrida becomes the IKF's de facto athlete registry through a Bangladesh/Iran/Korea licence**. Don't pursue this in year 1 — flagged for the long memo.

---

## 7. Why kabaddi is OnlyKrida's defensible moat

### Why no existing sports-tech platform serves kabaddi

1. **Cricket-first venture economics**: Indian sports-tech (Dream11, MPL, KhelNow, MyKhel, Sportskeeda) chases cricket because cricket commands ~85% of Indian sports advertising. Kabaddi is the second-most-watched league but a fraction of the ad TAM. ([Inc42 sports tech](https://inc42.com/startups/meet-the-startups-scoring-big-on-the-indian-sports-tech-pitch/))
2. **Data infrastructure assumes Western sport models**: Pose-estimation work in sports analytics exists ([Springer pose review](https://link.springer.com/article/10.1007/s10462-025-11344-1), [arxiv sports event detection](https://arxiv.org/html/2505.03991v3)) but covers football, basketball, cricket. **Only one paper exists on kabaddi specifically — a Springer chapter on pose-tracking with Kalman filter** ([Springer kabaddi pose](https://link.springer.com/chapter/10.1007/978-3-031-51468-5_9)). One paper. That's the entire global academic surface.
3. **Hugging Face dataset coverage = zero**. Direct search of `huggingface.co/datasets?search=kabaddi` returns no datasets. Compare to football (multiple), basketball (TrackID3x3 for 3x3 — [arxiv](https://arxiv.org/html/2503.18282v2)), cricket (Roboflow universe). **Whoever publishes the first open kabaddi dataset becomes the default citation for the next decade.**
4. **AKFI is digitally absent and politically distracted**.
5. **Regional language barrier**: A useful kabaddi platform needs Hindi, Marathi, Telugu, Tamil — not just English. This is friction OnlyKrida (already multi-role, already India-first) absorbs natively.

### Unit economics — why this is a fixed-cost moat

The competitive lock-in is **dataset + model**, not user growth. Specifically:

- **One-time training cost**: A 2,000–3,000 clip raid-action recognition dataset, labelled by a PKL-experienced coach intern at ~₹150/clip = **₹3–5 lakh capex**. Train a YOLOv8/ViT-based action classifier on top of pose-estimation backbone. Total dev: **~₹10–15 lakh + 2 months**.
- **Marginal cost per athlete after that**: Near zero. Phone-recorded raid clip → action labels → fitness-test integration → scout-searchable profile.
- **What this buys you**: Every subsequent kabaddi athlete onboarded on OnlyKrida gets _automatic_ AI-generated "raid style" fingerprint — defenders see chain-catch tendency, scouts see do-or-die frequency. **No competitor can replicate this without paying the same ₹15 lakh upfront cost AND finding domain-fluent labelers**, which is a 6–12 month delay. By the time competitor 2 starts, OnlyKrida has the talent.

### Specific data assets to build first (priority-ordered)

1. **Raid action recognition** (M0–M2): 2,500 labeled clips across 6 raid actions — `running_hand_touch`, `toe_touch`, `running_kick`, `dubki`, `lion_jump`, `do_or_die_failed_no_touch`. Pose-backbone + temporal classifier. Public release as `onlykrida/kabaddi-raid-actions-v1` on Hugging Face — first kabaddi dataset on HF.
2. **Defender stance & chain-catch detection** (M2–M4): 1,500 clips, classify defender role (corner / cover / in-defender) from 3-second windows, flag chain-catch formations. This is the scout-killer feature — every PKL coach wants this.
3. **Fitness-zone calibration for kabaddi-specific tests** (M0–M1): Beep test thresholds tuned for raiders (lighter, faster) vs defenders (heavier, stronger). Reuse existing OnlyKrida `fitness-test-context.tsx` infrastructure with kabaddi-specific zone bands. **Start here — it's the cheapest deliverable that makes the platform credible to a PKL franchise.**
4. **Bonus point + lobby-violation event tagger** (M4–M6): Edge case worth building because it fixes the _exact_ officiating problem that exploded at the 2023 Asian Games final. Becomes a partnership wedge with AKFI/IKF.

### Partnership path — which PKL franchise first?

**Telugu Titans. Unambiguous answer.**

- **Geographic match**: Anirudh is based in Hyderabad. Telugu Titans are HQ'd in Hyderabad, home games in Vizag.
- **Owner alignment**: **Mahesh Kolli (Greenko)** is one of three owners — Greenko is Hyderabad-based renewables/infra, sophisticated tech-friendly capital. Srinivas Sreeramaneni (Vaya Group) is similarly Hyderabad/SaaS-adjacent.
- **Performance pressure**: Telugu Titans have _never won_ a PKL title and are perennially mid-table. A scouting/data edge is genuinely useful to them, more than to a Haryana Steelers (already on top) or Patna Pirates (already systematized).
- **Coach access**: Krishan Kumar Hooda is a long-tenured coach — long enough to have institutional pain points around scouting that he'd articulate clearly.
- **Telugu Warriors** in WKL — same ownership umbrella plausibly, gives a women's kabaddi adjunct.

**Backup option**: Bengaluru Bulls (Kosmik Global Media) — Bengaluru is OnlyKrida's primary launch market per CLAUDE.md, BC Ramesh is a respected coach. Use this as the "second franchise" once Telugu Titans pilot works.

**Not first**: Haryana Steelers (JSW already has internal sports-data infra — JSW also owns football, kabaddi, athletics, doesn't need OnlyKrida); Dabang Delhi (champions, no pain point); Adani-owned Gujarat Giants (slow approval cycle, large org).

---

## 8. Risks to the thesis

### Risk 1 — PKL/Mashal Sports launches its own talent platform

**Severity: High. Probability: Medium-low (next 18 months).**

JioStar/Disney has both the data (every PKL match telecast) and the distribution. They don't have the mid/long-tail data — academy fitness tests, school tournament tape, women's kabaddi outside WKL. The bear case: JioStar partners with a generalist sports-tech to do this. The bull case: JioStar's incentive is broadcast-and-fantasy revenue, not athlete-database revenue. They've shown zero historical interest in scouting infra. Mitigation: **Move fast on the dataset** — once `onlykrida/kabaddi-raid-actions-v1` is the citation, late entrants build on top of OnlyKrida.

### Risk 2 — AKFI partners with a competitor or builds in-house

**Severity: Medium. Probability: Low.**

Current AKFI under Vibhor Vineet Jain is fragile post-Supreme Court order, focused on staying recognized by IKF. Tech-partnership decisions are not on their roadmap in 2026. Watch for change of leadership in 2027 election cycle.

### Risk 3 — Grassroots is _too informal_ to digitize

**Severity: Medium. Probability: Medium.**

Real concern: an akhada in rural Haryana doesn't run on smartphones. Counter-evidence: Pardeep Narwal himself runs a sports academy that publishes content, KCL Haryana launched in Sonipat in 2025 with explicit "grassroots digitization" framing, YKS proves there's an audience. Mitigation: **Don't try to onboard the akhada owner — onboard the player's coach or older brother**. Same dynamic as TikTok in tier-3 India: the literate cousin uploads on the athlete's behalf.

### Risk 4 — The Yuva Kabaddi Series builds a portfolio platform

**Severity: Medium. Probability: Low-medium.**

YKS is well-run (year-round, 26 teams, FanCode partnership) and has the brand permission. They could plausibly add an athlete-profile layer. **Mitigation: partner before they compete.** Co-launch a YKS x OnlyKrida talent dashboard. YKS gets data infra they don't want to build; OnlyKrida gets pre-vetted athlete inflow. This is a tractable Q3 2026 conversation.

### Risk 5 — Cricket gravitational pull

**Severity: Low for kabaddi-specific moat, High for total OnlyKrida narrative.**

If OnlyKrida investors fund a cricket-first roadmap, the kabaddi moat starves. Counter-argument for OnlyKrida the company: **cricket is the GTM channel, kabaddi is the moat.** Cricket gets users; kabaddi keeps them and creates the data assets that make the company defensible.

### Risk 6 — Circle vs mat kabaddi confusion

**Severity: Low.**

PKL is mat kabaddi. Punjab/diaspora play circle kabaddi. The labels and rules are different. **Don't build for both with one model.** Scope OnlyKrida v1 kabaddi to mat (which is 95% of the formal pipeline including all PKL/AKFI tournaments).

---

## 12-month milestone plan

### Q2 2026 (May–Jul) — Foundation

- [ ] Onboard **kabaddi sport vertical** in OnlyKrida: position-specific fitness zones (raider/defender/all-rounder), kabaddi-specific stat fields in `player_stats` (raid points, tackle points, super raids, super tackles, do-or-die success rate).
- [ ] Adapt existing fitness-test flows for kabaddi norms: 30m sprint, vertical jump, beep test thresholds calibrated against published kabaddi-specific values.
- [ ] Sign 3 Hyderabad/AP/TS academies as design-partner pilots: Krishna Kabaddi Academy (Vijayawada), Sri Krishna Club (Kachiguda), one academy connected to AP Kabaddi Association.
- [ ] Begin video data collection: 500 raid clips from public PKL/YKS broadcasts + academy contributions. Hire 1 part-time labeler (PKL-experienced ex-player intern, ~₹25k/month for 4 months).

### Q3 2026 (Aug–Oct) — Dataset + initial product

- [ ] Reach 2,500 labeled raid clips. Train v1 raid action classifier (target ~75% top-1 on 6 classes).
- [ ] Publish **`onlykrida/kabaddi-raid-actions-v1`** on Hugging Face — first dataset with kabaddi tag. Companion blog post on the OnlyKrida website. Submit short paper to a workshop (NeurIPS Sports Analytics, CVSports).
- [ ] Onboard 200+ athletes from pilot academies. Track: profile views, scout messages, NYP-eligible age cohort %.
- [ ] **Approach Telugu Titans** with: (a) the open dataset, (b) a pilot dashboard showing their Season 12 squad's raid-style breakdown done from OnlyKrida models on public broadcast tape, (c) a proposal to provide season-long scouting feed during PKL Season 13 (Aug-Oct 2026).

### Q4 2026 (Nov–Jan 2027) — Franchise pilot

- [ ] **Telugu Titans pilot signed**: 6-month scouting agreement, fixed retainer (target ₹15–25 lakh, structured as data services not media buy). Deliverables: weekly NYP-eligible candidate report, fitness-verified shortlist before Season 13 auction.
- [ ] Expand to defender stance + chain-catch detection (1,500 more labeled clips).
- [ ] Onboard 1,000+ athletes total (kabaddi vertical). Hit ~50 women's WKL-tier athletes.
- [ ] Khelo India Youth Games 2026 fitness-test partnership pitch — to AKFI or directly to KIYG operations.

### Q1 2027 (Feb–Apr) — Senior Nationals + multi-franchise

- [ ] **At 72nd–73rd Senior National Kabaddi Championship**, deploy on-ground OnlyKrida booth: free profile creation + fitness assessment. Target 500 player onboarding in 4 days.
- [ ] Sign **second franchise** (Bengaluru Bulls or Patna Pirates).
- [ ] Begin women's WKL franchise outreach (Telugu Warriors via the same ownership umbrella; Haryana Hustlers).
- [ ] **AKFI MoU** for athlete registry — no money, no exclusivity, just official endorsement of OnlyKrida-verified athlete profiles. This locks the moat.

### Stretch (Q2 2027+)

- [ ] PKL Season 14 auction (May 2027): at least 5 NYPs in the auction pool came through OnlyKrida discovery. **This is the moat-validation event.**
- [ ] Iran/Bangladesh expansion talks; IKF athlete-registry pitch.

---

## Changelog

- **2026-04-26**: Initial deep-research pass. Thesis CONFIRMED with caveats. Telugu Titans identified as primary partnership target. Hugging Face confirmed empty for kabaddi. AKFI governance partially restored Feb–Mar 2025 under Vibhor Vineet Jain; IKF lifted suspension. Yuva Kabaddi Series flagged as primary "partner-don't-compete" risk. PKL Season 12 (Aug–Oct 2025) won by Dabang Delhi K.C.; Season 11 by Haryana Steelers. (Anirudh / OnlyKrida research)
