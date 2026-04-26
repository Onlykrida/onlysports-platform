# Athlete Fitness & Skill Testing — Per-Sport Research

> Generated: **2026-04-26**. Synthesized from 7 parallel research streams (one per sport supported by OnlyKrida) plus cross-cutting analysis. Citation-grade. Not a build spec — a research artifact that informs the v1.5 fitness battery design.

## Why this document exists

OnlyKrida's current fitness testing offering is 4 generic tests:

- Yo-Yo IR1 (aerobic capacity)
- Sprint (20m / 40m)
- Agility T-Test
- Vertical Jump

These are sport-agnostic. A 14-year-old cricketer, a kabaddi defender, and a badminton singles player all see the same battery. The metrics that scouts actually shortlist on are sport-specific and often role-specific within a sport (a fast bowler vs a wicketkeeper, a raider vs a defender, a goalkeeper vs a winger). Without sport-specific tests, scout-side filters can't differentiate between athletes who'd make great fast bowlers vs ones who'd make great spinners, even though OnlyKrida's whole pitch is "structured talent database."

This document maps the **canonical test battery for each of OnlyKrida's 7 supported sports** (Cricket, Football, Kabaddi, Badminton, Athletics, Hockey, Basketball) against three constraints:

1. **Federation reality** — what BCCI / AIFF / AKFI / BAI / AFI / Hockey India / BFI actually test for at trials, junior camps, and elite-pathway entry
2. **Sports-science consensus** — what peer-reviewed sport-specific testing literature recommends
3. **OnlyKrida's 4-tier verification system** (`constants/verification.ts` — `self_reported 0.7×` / `app_measured 0.85×` / `coach_verified 1.0×` / `center_tested 1.1×`) — for each test, classify whether a 14-year-old in Manikonda with a low-end Android can self-test it (app_measured), whether it needs a coach with a stopwatch (coach_verified), or whether it requires lab equipment (center_tested)

The output is the v1.5 fitness test menu expansion: ~30+ sport-specific tests across the 7 sports, mapped to phone-sensor capabilities (camera + pose estimation, accelerometer, GPS, microphone for clap-start timing, gyroscope for balance) and to the existing tier multiplier so scout confidence scoring extends naturally.

---

## Cricket

### Federation context

The BCCI runs the most aggressive fitness regime of any Indian federation, instituted by S&C coach Shankar Basu during the Virat Kohli era (2017) and tightened repeatedly since. The current mandatory battery for centrally-contracted players combines the **Yo-Yo IR2 (cutoff 17.1)**, the **2km time trial** (8:15 for fast bowlers, 8:30 for batters/spinners/keepers), and the rugby-derived **Bronco Test** (1200m of shuttles in <6 minutes), tested in three windows per year (Feb, Jun, Aug/Sep). At the **NCA Bengaluru**, the S&C team runs three layered batteries — the **National Fitness Testing Criteria (NFTC)**: 10m sprint, 20m sprint, standing long jump, Yo-Yo, DEXA scan, every 12-16 weeks; a **Performance Battery** every 6 weeks (squat, lunge, walking patterns); and an **Injury Prevention Battery** every 2 weeks. State associations (HCA, MCA) run lighter U16/U19 versions plus the Tanner-Whitehouse 3 bone-age test (cutoff 16.4 male, 14.9 female).

### Test battery (12 tests)

| Test                                       | Measures                                                                         | Protocol                                                                                                                 | Tier                                                       | Federation use                                                |
| ------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------- |
| Yo-Yo IR2                                  | Aerobic capacity / repeated sprint recovery                                      | 40m shuttles (2x20m), starting 13 km/h, ramping; cutoff **17.1** for India seniors                                       | coach (already in OnlyKrida as IR1; IR2 needs ramp tweak)  | BCCI mandatory, all formats                                   |
| 2km time trial                             | Aerobic endurance                                                                | Flat track, continuous run; **8:15 fast bowlers, 8:30 others**                                                           | phone (GPS) or coach (track timer)                         | BCCI mandatory since 2021                                     |
| Bronco Test                                | High-intensity endurance                                                         | 5 sets of 20m+40m+60m shuttles (240m each) = 1200m, target **<6:00**                                                     | coach (cones + stopwatch)                                  | BCCI added 2025 (Asia Cup window)                             |
| 10m / 20m sprint                           | Acceleration                                                                     | Standing start, electronic gates or stopwatch; norm ~3.05s for 20m elite male                                            | coach (or phone slow-mo)                                   | NCA NFTC standard                                             |
| 5-0-5 agility                              | 180° change-of-direction (running between wickets)                               | 15m run-up + 5m turn, time the last 10m; sub-elite male norm **2.37s** (Draper & Lancaster, 1985 — designed for cricket) | coach                                                      | NCA + state academies                                         |
| Run-a-Three / 17.68m sprint with bat       | Cricket-specific running between wickets                                         | Sprint pitch length carrying bat, two 180° turns                                                                         | coach                                                      | Sub-elite cricket research; not centrally mandated            |
| Standing long jump                         | Lower body horizontal power                                                      | Two-foot takeoff, distance jumped                                                                                        | phone (camera + reference object)                          | NCA NFTC                                                      |
| Vertical jump (CMJ)                        | Lower body vertical power, RSI                                                   | Counter-movement jump, jump height                                                                                       | phone (already in OnlyKrida)                               | Sports science consensus                                      |
| Seated medicine ball throw (3-4 kg)        | Upper-body explosive power (bowling/throwing)                                    | Seated against wall, two-hand chest pass; distance                                                                       | coach (+ phone for distance)                               | JSCR protocol; correlates r=0.78-0.85 with cricket ball throw |
| Cricket ball throw for distance            | Throwing arm power, kinetic chain                                                | Standard 156g ball, run-up allowed, max distance; elite **60-70m**                                                       | coach (open ground)                                        | Topend Sports / state trials                                  |
| Hand grip dynamometry (Jamar)              | Forearm/grip strength (correlates with bowling ball velocity, batting bat-speed) | Three trials per hand, best score in kg                                                                                  | coach (Jamar dynamometer ~₹4-6k)                           | Sports science consensus, used at NCA                         |
| Reaction time (Batak / pitch-reaction app) | Visual reaction, hand-eye coordination                                           | 30 or 60 sec strike-as-many task; cricket-specific Pitch Reaction Test (medRxiv 2025)                                    | phone (screen-tap version) or center (Batak/Dynavision D2) | NCA performance lab; growing research base                    |

### Role-specific notes

- **Fast bowler**: Yo-Yo IR2 + Bronco are the gatekeepers (repeated 6-over spells = repeated max efforts). Layer in 2km (8:15 standard), seated med-ball throw, cricket ball throw for distance, and standing long jump. Bowling speed via radar (or phone) is the headline metric.
- **Spin bowler**: 2km (8:30), Yo-Yo, plus **grip strength** (off-spin & wrist-spin both correlate with revs and ball velocity) and shoulder-stability assessments. Bowling accuracy on a 1m target zone matters more than speed.
- **Batter**: 5-0-5 agility and run-a-three (running between wickets), reactive agility (Y-test or app-based reactive sprint), CMJ for shot power, grip strength for bat speed, and reaction time. Yo-Yo 17.1 still mandatory.
- **Wicketkeeper**: Reaction time (Batak / Dynavision D2 / app) is the differentiator — research shows keepers post the fastest reaction times of all cricket roles. Plus repeated squat-up endurance (no formal test yet — proxy with 5-0-5 + CMJ).

### Phone-measurable opportunities (the OnlyKrida wedge)

1. **2km GPS time trial** — `app_measured` (0.85×). Same Expo Location API as a Strava run.
2. **Bowling speed via two-tap video** — record 60fps slow-mo of delivery, tap frame at release + frame at stumps, app uses 20.12m pitch length to compute km/h. Accurate within ±3 km/h.
3. **Standing long jump via pose detection** — MediaPipe heel-strike/takeoff detection with reference object for scale.
4. **Pitch Reaction Test (screen)** — port the medRxiv 2025 protocol: ball-trajectory video on screen, tap shot direction. Measures batting cognition specifically.
5. **5-0-5 agility timer** — phone on ground at turn line, audio start cue, video review for 5m split via motion detection.

### Sources

- [ESPNcricinfo — New fitness target: Yo-Yo 17:1 + 2km time trial](https://www.espncricinfo.com/story/new-fitness-target-for-indian-players-yo-yo-level-raised-to-17-1-time-trial-2k-run-1251503)
- [Outlook India — Bronco Test for Indian cricketers](https://www.outlookindia.com/sports/cricket/what-is-bronco-test-all-about-bcci-rugby-centric-fitness-trial-for-indian-cricketers-explainer)
- [Outlook India — NCA fitness testing criteria (NFTC, Performance, Prevention)](https://www.outlookindia.com/sports/cricket/india-cricket-team-selection-fitness-tests-no-more-a-criteria)
- [Topend Sports — Cricket fitness testing battery](https://www.topendsports.com/sport/cricket/testing.htm)
- [Sport Science Insider — 5-0-5 agility test (Draper & Lancaster 1985)](https://sportscienceinsider.com/the-505-agility-test/)
- [Lockie et al. — Specific Speed Testing for Cricketers (run-a-three, 17.68m)](https://www.researchgate.net/profile/Robert-Lockie/publication/235729001_Analysis_of_Specific_Speed_Testing_for_Cricketers)
- [Petersen et al., JSCR — Monitoring power/speed/agility/endurance](https://pubmed.ncbi.nlm.nih.gov/28658073/)
- [medRxiv 2025 — Pitch Reaction Test (batting cognition)](https://www.medrxiv.org/content/10.1101/2025.06.05.25329069v1.full)
- [Reaction time among bowlers, batsmen, wicketkeepers](https://www.researchgate.net/publication/328556531_A_COMPARATIVE_STUDY_OF_REACTION_TIME_AMONG_BOWLERS_BATSMAN_AND_WICKET_KEEPERS_IN_CRICKET)
- [BowloMeter / Bowling Speed Meter (smartphone bowling speed apps)](https://play.google.com/store/apps/details?id=bowling.speed.meter.bowlometer)
- [PMC — Modified 505 Test reliability and validity](https://pmc.ncbi.nlm.nih.gov/articles/PMC11857042/)

---

## Football

### Federation context

The **All India Football Federation (AIFF)** uses Yo-Yo IR1 as its mandated aerobic benchmark across Khelo India NCOEs, SAI youth camps, and national age-group selection (U-13, U-15, U-17), with VO2max predicted via Bangsbo's formula `VO2max = IR1 distance(m) × 0.008 + 36.4`. The **Khelo India Football Talent Identification Protocol** layers Yo-Yo IR1 with sprint, agility, and jump assessments at NCOE assessment camps. ISL academies (Reliance Foundation Young Champs, FC Goa, Bengaluru FC) and the Subroto Cup pipeline run UEFA-style batteries — Yo-Yo IR1/IR2, 30-15 IFT, 10/20/30m sprints, 505 COD, CMJ, and the Loughborough Soccer Passing Test for skill. **RFYC partnered with AiSCOUT for virtual trials** — a direct OnlyKrida-adjacent precedent that legitimises phone-measured testing in the Indian football ecosystem.

### Test battery (10 tests)

| Test                                          | Measures                                 | Protocol                                                                                                                                      | Tier                                 | Federation use                                    |
| --------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------- |
| **Yo-Yo IR1**                                 | Aerobic + intermittent recovery          | 40m shuttles + 10s rest, audio-paced. VO2max = dist × 0.008 + 36.4                                                                            | **app (current)**                    | AIFF / Khelo India / FIFA                         |
| **Yo-Yo IR2**                                 | High-intensity recovery (U-17+, elite)   | Same as IR1 starting at 13 km/h with steeper progression                                                                                      | **app** (U-17+ males)                | ISL clubs, AIFF senior                            |
| **30-15 IFT**                                 | Intermittent VO2max + COD economy        | 40m shuttles, 30s run + 15s rest, +0.5 km/h per stage. ICC 0.90-0.96                                                                          | **coach**                            | UEFA academies, ISL                               |
| **10m / 20m / 40m sprint**                    | Acceleration (0-10), max V (20-40)       | Standing start. Phone-timing apps (Photo Finish, SpeedClock) within ~0.012s of timing gates                                                   | **app (current 20/40m)** + 10m split | AIFF, FIFA, all academies                         |
| **Repeated Sprint Ability (Bangsbo 7×34.2m)** | Anaerobic recovery, fatigue index        | 7× 34.2m sprints with slalom, 25s active recovery                                                                                             | **coach**                            | ISL pre-season standard                           |
| **Countermovement Jump (CMJ)**                | Lower-body explosive power               | Hands on hips, dip-and-jump. MyJump2 validated at 240Hz vs force plate (~1.8ms error, <0.7% jump-height error). Elite youth norms 34.8-58.6cm | **app** (front camera, slow-mo)      | All FIFA/UEFA academies                           |
| **Drop Jump / RSI**                           | Reactive strength, stiffness             | Drop from 30/40cm box, minimise contact time, maximise jump                                                                                   | **coach** (needs box)                | Premier League academies                          |
| **505 COD test**                              | 180° change of direction speed           | 10m run-in + 5m turn + 5m exit. Time last 10m. Both legs (asymmetry flag)                                                                     | **coach**                            | UEFA, ISL standard (replaces T-Test for football) |
| **Loughborough Soccer Passing Test (LSPT)**   | Skill under fatigue/time pressure        | 16 passes against numbered targets in marked grid. Elite ~40s, sub-elite ~58s, non-elite ~67s                                                 | **coach**                            | EPL academies, Loughborough TID                   |
| **Juggling count + Dribble slalom**           | First touch, ball control, dribble speed | Max juggles in 60s; 30m slalom through 6 cones                                                                                                | **app** (video upload, AI count)     | Grassroots, AIFF "D" license                      |

### Position-specific notes

- **Goalkeeper**: Drop Yo-Yo IR2 weighting. Add **Reaction & Action Speed (RAS) test** (sprint + dive + COD; ICC 0.68-0.95) and **S-Keeper / LS-Keeper** dive tests (10-12.55m dive, discriminates by level). Reaction time on visual stimuli — keepers measurably faster than fielders. Vertical reach > vertical jump.
- **Centre-back**: Weight 5-10m acceleration, CMJ (heading/aerial duels), Yo-Yo IR1. De-emphasise 40m max velocity.
- **Full-back / Wing-back**: 30-40m sprint + RSA (highest sprint distances per match), 505 both legs.
- **Central midfielder**: Yo-Yo IR1 + 30-15 IFT (highest total distance, ~10.5km/match), LSPT under fatigue.
- **Wide midfielder / Winger**: 20-30m sprint + RSA + 505 + dribble slalom + crossing accuracy (10 crosses to zones).
- **Striker**: 5-10m acceleration, CMJ (vertical reach for headers), shooting accuracy (8 shots, near/far post zones), 505.

### Phone-measurable opportunities (the OnlyKrida wedge)

1. **CMJ via front-camera flight-time** (MyJump2 paradigm) — 1.8ms error. Trivially `app_measured`.
2. **10m / 20m / 30m sprint splits via Photo Finish-style audio-trigger + finish-line video** — published bias 0.012s vs gates.
3. **Juggling counter (CV-based)** — 60s video upload, AI counts touches. Pure phone, scout-meaningful, India-cultural.
4. **Dribble slalom timer** — phone at finish line, athlete starts on whistle.
5. **Goalkeeper reach + dive video** — fixed-camera lateral dive, AI estimates wingspan-corrected reach. No equivalent exists in India.

### Sources

- [Khelo India Football Talent Identification Protocol](https://kheloindia.gov.in/uploads/PROTOCOL-FOOTBALL.pdf)
- [SAI Football Talent Identification Protocol](<https://sportsauthorityofindia.gov.in/sai/public/assets/news/1726030779_Protocol-%20Football%20(1).pdf>)
- [AIFF SMDP Guidelines 2024-25 (Subroto Cup)](https://www.subrotocup.in/assets/docs/SMDP%20GUIDELINES%202024-25.pdf)
- [FIFA Youth Football Training Manual](https://digitalhub.fifa.com/m/1b3da6976c9290aa/original/mxpozhvr2gjshmxrilpf-pdf.pdf)
- [Buchheit — 30-15 Intermittent Fitness Test, two decades of learnings](https://martin-buchheit.net/wp-content/uploads/2021/11/SPSR148_Buchheit.pdf)
- [Yo-Yo IR1 vs lab VO2max in adolescent soccer (Annals of Human Biology, 2025)](https://www.tandfonline.com/doi/full/10.1080/03014460.2025.2566327)
- [Bangsbo 7×34.2m RSA test](https://pubmed.ncbi.nlm.nih.gov/40220211/)
- [Loughborough Soccer Passing Test validation](https://journals.lww.com/nsca-jscr/fulltext/2014/05000/validation_of_the_loughborough_soccer_passing_test.31.aspx)
- [S-Keeper / LS-Keeper goalkeeper tests](https://pmc.ncbi.nlm.nih.gov/articles/PMC4974865/)
- [Reaction & Action Speed (RAS) for goalkeepers](https://journals.lww.com/nsca-jscr/fulltext/2013/08000/evaluation_of_a_specific_reaction_and_action_speed.13.aspx)
- [MyJump app meta-analysis (Sci Reports 2023)](https://www.nature.com/articles/s41598-023-46935-x)
- [Photo Finish smartphone sprint timing validity (Sensors, MDPI)](https://www.mdpi.com/1424-8220/24/20/6719)
- [RFYC AiSCOUT Virtual Trials (Indian phone-measured precedent)](https://www.rfyouthsports.com//football/news/rfyc-aiscout-virtual-football-trials-the-hunt-is-on)

---

## Kabaddi

### Federation context

The **Amateur Kabaddi Federation of India (AKFI)** governs national selection; published cutoffs are sparse and vary by state association. The **SAI ships a kabaddi-specific Induction & Weed-out Protocol** under Khelo India (Annexure A) for KISCE/KIYG centres — the closest thing to a national standardised battery, mimicked by most academies. **PKL franchises** (Telugu Titans, U Mumba, Bengal Warriors) run private 30–45 day pre-season camps with proprietary scoring; published reporting confirms they test VO2max (Yo-Yo / MSFT), 30m sprint, vertical jump, grip strength, and a position-specific skill circuit, but per-team cutoffs are not public. Kabaddi sports-science literature is substantially thinner than football/cricket — the most-cited reference set is Indian (Dey et al. 1993 BJSM; Reddy/Singh/Kumar/Khanna anthropometric studies; the 2019 Turkish J Sports Med junior-position analysis; the 2026 MDPI _Sports_ systematic review).

### Test battery (11 tests)

| Test                                          | Measures                                                      | Protocol                                                                             | Tier                                        | Federation use                                            |
| --------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------- | --------------------------------------------------------- |
| Hand-grip dynamometer (L+R)                   | Forearm/grip strength — core for hold & escape                | 3× max squeeze each hand, best in kgf, elbow at 90°                                  | center (Jamar/Camry)                        | AKFI/SAI standard                                         |
| Yo-Yo IR1                                     | Repeated-effort aerobic-anaerobic                             | Standard 40m shuttles, 5s active recovery                                            | coach                                       | PKL pre-season                                            |
| 30m sprint (with 10m + 20m splits)            | Raid acceleration, bonus-line burst                           | Best of 3, electronic timing preferred                                               | coach (phone-timed acceptable)              | PKL combine, SAI                                          |
| 5-10-5 Pro-Agility shuttle                    | Lateral COD speed — defender chain reactivity                 | 5yd-10yd-5yd, both directions, best of 3                                             | coach                                       | Elite kabaddi camps                                       |
| Countermovement jump (CMJ)                    | Lower-body explosive power for toe-touch & ankle-hold         | 3× max effort, hands on hips or arm-swing                                            | phone (My Jump 2 ICC 0.997)                 | PKL S&C standard                                          |
| RAST (Running Anaerobic Sprint Test)          | Anaerobic power + fatigue index — mirrors raid load           | 6×35m max sprints, 10s passive recovery                                              | coach                                       | Junior-position research                                  |
| Repeated 30s raid loop                        | Raid-specific anaerobic capacity (raids ~20.8s; Dey 1993)     | 30s max-effort shuttle, 30s rest, ×6; HR recovery + distance                         | coach (phone GPS/accelerometer can capture) | Sport-specific extension; not yet federation-standardised |
| Sit-and-reach (back-saver variant)            | Hamstring + low-back flexibility — toe-touch raid mechanics   | Standard box, 3 trials, best in cm                                                   | phone (camera + ruler)                      | Khelo India                                               |
| Stork single-leg balance (eyes open + closed) | Single-leg stability — defender lunge-and-hold, raider escape | Stand on ball of foot, time until break; both eyes-open and eyes-closed              | phone (gyroscope + timer)                   | Strong sport-science case                                 |
| Push-pull max effort                          | Upper-body push (escape) and pull (hold) — symmetric demand   | 5RM bench + 5RM seated row; OR seated medicine-ball chest pass distance              | center (gym)                                | PKL S&C                                                   |
| Toe-touch precision drill                     | Skill-execution under fatigue (raider)                        | 10 attempts at marked target after 30s shuttle; success rate + leading-leg ankle ROM | coach                                       | Khanna et al. technique research                          |

### Role-specific notes

- **Raider**: Prioritise CMJ, 10m acceleration split, sit-and-reach, and toe-touch precision. Junior-elite raiders had **VO2max 41.2 ± 4.5 ml/kg/min** vs covers 33.2 — aerobic capacity is the _raider_ differentiator (Turkish J Sports Med 2019), counter to the intuition that raiders are pure power athletes. They accumulate more total raid volume + recovery cycles per match.
- **Defender** (corners + covers): Prioritise grip dynamometer, 5-10-5 lateral shuttle, single-leg stability, pull strength. Corners need explosive lateral lunge + grip lock-in within ~0.4s of a raider's bonus attempt. Covers carry the lowest VO2max in the position split — they're the wrestlers.
- **All-rounder**: Balanced profile across raider and defender batteries. Flag any athlete whose grip + CMJ + Yo-Yo IR1 are all above the 60th percentile of their squad — that's the all-rounder phenotype PKL franchises pay for.

### Phone-measurable opportunities (the OnlyKrida wedge)

1. **CMJ via My Jump 2-style camera capture** — Validated against force plates at ICC 0.997. Replaces our generic vertical jump with a sport-validated version.
2. **Repeated 30s raid loop using GPS + accelerometer** — Athlete sets phone in armband or on a cone; app counts shuttle reps, distance per 30s, HR recovery (camera-PPG or wearable). Mirrors 20.8s raid duration from Dey 1993 better than Yo-Yo IR1 does. **The kabaddi-specific test no competitor offers.**
3. **Single-leg balance via gyroscope** — Phone strapped to shin or in pocket; body sway frequency/amplitude during eyes-open + eyes-closed stork test. Predictor of defender lunge-recovery quality.
4. **Sit-and-reach via pose-estimation** — Side-on video + MediaPipe to measure trunk-flexion angle.
5. **Toe-touch precision drill (CV-scored)** — Mark target with A4 sheet, raider performs 10 attempts after a 30s shuttle, app counts successful touches and measures leading-leg ankle angle (Khanna 2021 found this is the kinematic that separates levels). **Highest-signal kabaddi-specific raider test that nobody else does.**

### Gaps flagged

- No published PKL franchise testing protocol. **Telugu Titans (gbrain seed flags as our first PKL partner)** would plausibly share testing data in exchange for early platform access.
- No normative tables for senior PKL pros. Best Indian kabaddi norms are junior-elite + inter-university. We will need to build our own pro norms.
- **Repeated 30s raid loop is not yet a published, validated test.** Dey 1993 establishes 20.8s raid duration; nobody has formalised an RSA test that matches it. **OnlyKrida could publish the protocol** — legitimate sports-science contribution and a moat.
- HF paper_search returned zero kabaddi sports-science results. The ML/sports-analytics community has not touched kabaddi; pose-estimation toe-touch scoring is greenfield.

### Sources

- [Dey et al., BJSM — Physiological responses during match play in Indian national kabaddi](https://pmc.ncbi.nlm.nih.gov/articles/PMC1332337/)
- [Turkish J Sports Med 2019 — Junior position analysis (raider VO2max 41.2 ± 4.5)](https://journalofsportsmedicine.org/full-text/497/eng)
- [MDPI Sports 2026 — Effects of training interventions on kabaddi (systematic review)](https://www.mdpi.com/2075-4663/14/1/37)
- [JASPE — CMJ performance in elite senior male kabaddi](https://saudijournals.com/media/articles/JASPE_69_153-158.pdf)
- [Yogic Journal — Strength × playing position in Kabaddi](https://www.theyogicjournal.com/pdf/2016/vol1issue1/PartB/6-2-6-429.pdf)
- [Khanna et al. — Anthropometric/kinematic variables × toe-touch in Kabaddi](https://www.academia.edu/78146425/)
- [AKFI — Amateur Kabaddi Federation of India](https://www.indiankabaddi.org/)
- [Khelo India — Kabaddi Induction/Weed-out Protocol (Annexure A)](https://kheloindia.gov.in/uploads/Annexure%20A-%20Kabaddi%20Induction_weedout%20Protocol.pdf)
- [SAI/Khelo India Fitness Protocols 5–18 yrs](<https://yas.nic.in/sites/default/files/Fitness%20Protocols%20for%20Age%2005-18%20Years%20v1%20(English).pdf>)
- [Balsalobre-Fernández et al. — My Jump validity meta-analysis](https://www.nature.com/articles/s41598-023-46935-x)
- [NSCA — T-Test, 5-10-5 Shuttle, Illinois Test agility assessment](https://www.nsca.com/education/articles/kinetic-select/assessing-agility-using-the-t-test-5-10-5-shuttle-and-illinois-test/)

---

## Badminton

### Federation context

The **Badminton Association of India (BAI)** is the national federation, but elite player development is concentrated at the **Pullela Gopichand Badminton Academy (PGBA, Hyderabad — founded 2004)** and a handful of satellite NCOEs run by SAI. Gopichand has publicly identified strength and endurance as the historic Indian weakness; his program centers on agility training, super-circuit conditioning, and on-court multi-shuttle drills. The **Badminton World Federation (BWF)** does not publish a single mandated test battery, but has financially backed validation of two sport-specific protocols (the **Badcamp 6-corner agility test** and the **AIR-BT endurance test**), which together with the Phomsoupha & Laffaye (2015) review form the de-facto BWF gold standard. SAI uses a "battery of motor-quality tests + sport-specific skill tests" gate for STC/NCOE intake — players who fail are admitted provisionally for 6 months and re-tested.

### Test battery (10 tests)

| Test                                      | Measures                                         | Protocol                                                                                        | Tier                            | Federation use                                             |
| ----------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------- |
| Badcamp 6-corner agility                  | Reactive agility (perceptual + motor)            | 5.6 × 4.2m rectangle, 6 inflatable targets, light-panel cues, sprint-touch-return to centre     | center-only (light panel)       | BWF-funded validation; expert vs non-expert discrimination |
| AIR-BT incremental                        | Badminton-specific VO2max                        | On-court incremental shuttlecock-feed protocol to exhaustion; VO2max = 0.023 × time(s) + 31.334 | coach                           | BWF-supported; r=0.86 vs Yo-Yo IR1                         |
| Yo-Yo IR1                                 | Intermittent aerobic capacity (generic baseline) | 20m shuttles + 10s active recovery                                                              | phone (audio + cones)           | SAI motor battery; generic baseline                        |
| Shuttle run / 6-direction footwork        | Court-coverage speed                             | Pick up shuttles from 6 court positions returning to base each time, total time                 | coach (shuttle setup)           | PGBA daily diagnostic                                      |
| Shadow footwork (4-corner × 8 reps timed) | Movement economy + repeat speed                  | 8 cycles of front-left → rear-right → rear-left → front-right with no shuttle, timed            | phone (camera + on-screen cues) | PGBA / Indonesian system                                   |
| Multi-shuttle 30/30 drill                 | Anaerobic repeat-sprint + reaction               | Coach feeds 30s continuous shuttles, 30s rest × 6–10 sets; HR recovery + shuttles returned      | coach (feeder required)         | PGBA standard, BWF coach education                         |
| Wall volley count (60s)                   | Reaction + control + repeat-strike               | Continuous wall rallies for 60s, count successful returns above marked line                     | phone (camera CV count)         | Junior selection (BAI / club)                              |
| Repeated jump-smash (10 reps)             | Lower-body power endurance                       | 10 maximal vertical jump-smashes off feed; mean jump height + decrement %                       | coach                           | Phomsoupha protocol                                        |
| Vertical jump (CMJ)                       | Lower-body explosive power                       | 3 max counter-movement jumps, best recorded                                                     | phone (slow-mo + body-pose)     | SAI motor battery                                          |
| Sit-and-reach + shoulder ER ROM           | Flexibility (lunges + overhead)                  | Standard sit-and-reach board + goniometer for shoulder external rotation                        | coach                           | SAI motor battery                                          |

### Discipline-specific notes

- **Singles**: Aerobic-anaerobic alternation dominates. Mean HR 88.8% and peak HR 96.8% of HRmax; players take ~594 steps/game, +40% jumps and +250% lunges vs doubles, predicted VO2max 50.6 ml/kg/min. Prioritize AIR-BT, Yo-Yo IR1, 6-direction shuttle run, and repeated jump-smash. **Singles is where the Hyderabad pipeline (Sindhu, Sen, Prannoy) has won medals — testing emphasis here is sharpest.**
- **Doubles**: Explosive net play, faster reaction, lower aerobic ceiling (mean HR ~75.5%, VO2max 45.5 ml/kg/min, 314 steps/game). Prioritize Badcamp reactive agility, wall volley, multi-shuttle 30/30, and a shorter ~6-second sprint-reaction protocol. Upper-body rotational power matters more than steady-state endurance.
- **Mixed doubles**: Hybrid demands plus role-asymmetry — typically the male covers rear-court (test for jump-smash power decrement), female plays net (test for reactive agility and racket-hand reaction time). Score on both batteries and present the role-weighted composite.

### Phone-measurable opportunities (the OnlyKrida wedge)

Badminton is harder to phone-self-test than running or jumping sports because canonical drills require a coach feeding shuttles. But:

1. **Wall volley auto-counter** — front camera + lightweight CV (shuttle detection or audio-onset of strike). Count successful returns above a taped line in 60s. **Single best phone-native badminton test.** `app_measured` 0.85×.
2. **Shadow footwork timer with cued corners** — phone shows randomized corner (1–4 or 1–6), audio cue, on-screen timer. Pose detection (MediaPipe/MoveNet) confirms reach + return.
3. **Vertical jump from CMJ video** — known camera trick (frame counting at takeoff/landing). Reusable across sports, applies cleanly to badminton jump-smash power proxy.
4. **Rally-rhythm test** — phone audio detects shuttle strikes (impulse waveform); player rallies wall or partner for 60s. Surrogate for wall volley when camera angle is bad.
5. **Court-coverage video** — single phone on tripod at sideline; pose tracking estimates total distance covered + average velocity over a 90s shadow drill. Comparable to elite benchmarks from Faude / match-play studies.

### Sources

- [Phomsoupha & Laffaye — _The Science of Badminton_ review](https://www.worldbadminton.com/reference/research/documents/The_Science_of_Badminton_Game.pdf)
- [Loureiro & de Freitas — Badcamp agility test (IJSPP 2016)](https://journals.humankinetics.com/view/journals/ijspp/11/3/article-p305.xml)
- [Specificity of Badcamp Agility Test (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5504591/)
- [AIR-BT badminton-specific incremental test (PLOS ONE 2021)](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0257124)
- [Ando et al. — Badminton-specific endurance vs Yo-Yo IR1 (Physiological Reports 2024)](https://physoc.onlinelibrary.wiley.com/doi/10.14814/phy2.16058)
- [Singles vs doubles HR / time-motion (Cabello & González-Badillo)](https://www.tandfonline.com/doi/abs/10.1080/24748668.2009.11868479)
- [Match-play data by playing categories — systematic review (Frontiers 2025)](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2025.1466778/full)
- [Markerless motion analysis: badminton sex/discipline differences](https://www.tandfonline.com/doi/full/10.1080/02640414.2025.2489863)
- [Topend Sports — Badminton fitness testing](https://www.topendsports.com/sport/badminton/fitness-testing.htm)
- [Olympics.com — _The Academy_ on PGBA training](https://www.olympics.com/en/news/the-academy-series-pullela-gopichand-badminton-academy-watch)
- [SAI Talent Identification & Selection Pathway](https://saijobs.sportsauthorityofindia.gov.in/showfileinner.asp?link_temp_id=9379)
- [SAI NCOE brief (motor-quality battery + provisional admission rule)](https://sportsauthorityofindia.gov.in/sai/public/assets/pdfs/schemes/NCOE_Brief.pdf)

---

## Athletics

### Federation context

The **Athletics Federation of India (AFI)** runs the world's largest grassroots single-sport talent search via the **National Inter-District Junior Athletics Meet (NIDJAM)** — over 100,000 U-18 athletes annually — feeding into U-14/U-16/U-18 talent identification camps. AFI's 2025 circular formally adds a TID battery to the **40th National Junior Athletics Championships**. **Khelo India Youth Games** (U-17 / U-21) and **NSNIS Patiala** use the SAI-mandated **National Sports Repository System (NSRS)** as the data backbone. Globally, **World Athletics' Kids' Athletics** (ages 7–12) deliberately blends sprint, endurance, jump and throw events into a team format so children sample every cluster before specializing.

### Test battery by event cluster

#### Sprints / Hurdles

| Test                              | Measures                 | Norm (elite U-18)          |
| --------------------------------- | ------------------------ | -------------------------- |
| 30m flying sprint (20–30m run-up) | Max velocity             | < 3.05s boys / 3.30s girls |
| 60m from blocks                   | Acceleration + max V     | < 7.30s / 7.90s            |
| Reaction time at blocks           | Neuromuscular reactivity | < 0.180s                   |
| Repeated 150m × 4 (3-min rest)    | Speed endurance          | drop-off < 5%              |
| 30m from standing                 | Pure acceleration        | < 4.20s                    |

#### Middle distance (800–1500m)

| Test                           | Measures                   | Notes          |
| ------------------------------ | -------------------------- | -------------- |
| 800m TT                        | Anaerobic capacity + speed | Primary event  |
| 1500m TT                       | Mixed aerobic-anaerobic    |                |
| 6×400m @ 90% w/ 90s rest       | Lactate tolerance          | NSNIS protocol |
| Blood lactate at 4 mmol/L pace | Lactate threshold          | Centre-only    |

#### Distance (5000m / steeplechase / road)

| Test               | Measures                          | Norm                            |
| ------------------ | --------------------------------- | ------------------------------- |
| Cooper 12-min run  | VO₂max estimate `(d−504.9)/44.73` | Elite junior boys > 3,200m      |
| 5000m TT           | Race-specific aerobic power       |                                 |
| 30-15 IFT or YYIR2 | Intermittent recovery             | (cross-checked vs steeplechase) |
| Treadmill VO₂max   | Direct gas analysis               | NIS/NCSSR centre only           |

#### Jumps (LJ / TJ / HJ / PV)

| Test                           | Predicts                          | Notes                   |
| ------------------------------ | --------------------------------- | ----------------------- |
| Standing long jump (broad)     | Horizontal power, LJ/TJ potential | Elite U-18 boys > 2.80m |
| Counter-movement vertical jump | Reactive strength, HJ potential   | Elite > 60cm            |
| 5-bound test (alternating)     | Triple-jump rhythm + power        | TJ-specific             |
| Drop jump 30cm (RSI)           | Stretch-shortening cycle          | HJ/PV diagnostic        |
| 30m fly                        | Approach-velocity ceiling         | LJ correlate            |

#### Throws (SP / DT / JT / HT)

| Test                              | Predicts                      | Notes                |
| --------------------------------- | ----------------------------- | -------------------- |
| Overhead backward med-ball (3kg)  | Total-body explosive power    | Elite > 14m          |
| Forward chest-pass med-ball (3kg) | Pectoral / triceps drive      | SP-specific          |
| Javelin throw with 600g/turbo-jav | Throwing-arm whip             | JT-specific          |
| Standing shot put                 | Push power, no glide/rotation | SP screen            |
| Hand-grip dynamometry             | Forearm strength              | All throws + javelin |

### Talent-ID battery (cross-event screening — "which event for this 13-year-old?")

| Test                                   | Predicts                                              | Tier                     |
| -------------------------------------- | ----------------------------------------------------- | ------------------------ |
| Standing height + sitting height       | Long limbs → jumps/sprints; tall + long arms → throws | Coach-verified           |
| Arm span                               | Throws (HT, JT), HJ approach lever                    | Phone-AR + coach         |
| Leg length / cormic index              | Sprinters have low cormic (long legs)                 | Coach-verified           |
| Body-fat % (skinfolds, 4-site)         | Distance runners < 8%; throwers > 18%                 | Centre                   |
| 30m flying                             | Sprint potential                                      | Phone proxy → coach gold |
| Standing long jump                     | Power → jumps, sprints, hurdles                       | Phone-AR or coach        |
| Overhead med-ball (2kg U-14, 3kg U-16) | Throws cluster                                        | Coach                    |
| Cooper 12-min run                      | Distance / steeplechase aptitude                      | Phone-GPS or coach       |
| 5-bound / alternate-leg bounds         | Reactive/elastic strength                             | Coach                    |
| Hand-grip strength                     | Throws screen                                         | Coach/centre             |

The output of this battery feeds **IAAF Combined-Events Scoring Tables** (formula `A·(B−P)^C` for runs / `A·(P−B)^C` for jumps & throws; C ≈ 1.8 runs, 1.4 jumps, 1.1 throws) — same math that scores decathlons. **Re-using IAAF tables to compare a kid's 30m-fly to her standing-long-jump on a unified 0-1100 scale is the cleanest way to surface "this athlete is a thrower, not a sprinter."**

### Phone-measurable opportunities (the OnlyKrida wedge)

- **Sprint timing** — published validation (Stanton 2016; Romero-Franco 2020 Photo-Finish; Haugen 2022 FAT-vs-phone) shows iPhone video at 120–240fps achieves ±0.02–0.05s vs fully-automatic timing — good enough for grassroots talent-ID, not for ratified records. Run two phones (start + finish) over WiFi-sync, or one phone @ 240fps with visible flag-drop start. `app_measured` (0.85×).
- **Standing long jump / vertical jump** — ARKit / ARCore depth scans + pose-estimation (MediaPipe, BlazePose) measure SLJ within ~5cm and CMJ within ~3cm.
- **Throws distance** — video-based distance from a known landmark (cone at 10m) using single-camera homography, ±30cm at <30m throws (turbo-jav, med-ball, U-14 shot). Beyond 40m (senior javelin) tape is mandatory.
- **Cooper test** — GPS-based phone tracking (Strava-style) is centre-grade accurate on a 400m track.
- **Anthropometrics** — height + arm-span via AR body-scan (ARKit's PersonSegmentationWithDepth + reference object) within 1.5cm of stadiometer.

The wedge: **a kid in Khammam can record a 30m-fly, a standing long jump, an overhead med-ball, a Cooper run, and an arm-span scan in one weekend on his phone, get an automatic IAAF-points scorecard across all four event clusters, and surface to scouts with a clear "thrower" / "sprinter" / "endurance" signal** — with the verification multiplier reflecting that this is app-measured, not centre-tested.

### Sources

- [AFI Talent Identification Program](https://indianathletics.in/talent-identification-program/)
- [AFI Circular: TID at 40th National Junior Athletics Championships 2025](https://indianathletics.in/afi_circular/talent-identification-during-40th-national-junior-athletics-championships-2025/)
- [World Athletics — IAAF Kids' Athletics Practical Guide](https://worldathletics.org/download/download?filename=22f20cae-d655-4f86-9dc3-140a1f529796.pdf)
- [World Athletics — IAAF Scoring Tables for Combined Events](https://worldathletics.org/download/download?filename=c651eeb3-0f9d-47c0-9314-a3bd001e0960.pdf)
- [Khelo India Operational Guidelines (2021–22 → 2025–26)](https://kheloindia.gov.in/uploads/Khelo-India-Scheme-Operational-Guidelines.pdf)
- [National Sports Repository System (NSRS)](https://nsrs.kheloindia.gov.in/)
- [NSNIS Patiala](https://nsnis.org/)
- [Frontiers — Juvenile sprint phase development (2025)](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2025.1701476/full)
- [Sci Reports — Anthropometric profiles of male runners by distance (2023)](https://www.nature.com/articles/s41598-023-45064-9)
- [MDPI Applied Sci — Anthropometry × throws TID in adolescents](https://www.mdpi.com/2076-3417/13/18/10118)
- [Photo Finish smartphone sprint timing validity (PMC 2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11511534/)
- [Stanton 2016 smartphone sprint validity](https://pmc.ncbi.nlm.nih.gov/articles/PMC4972912/)
- [FAT vs mobile-phone timing (Haugen 2022)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9003053/)
- [HF — Detecting arbitrary keypoints on triple/long/high jump athletes](https://hf.co/papers/2304.02939)

---

## Hockey

### Federation context

**Hockey India (HI) and SAI** run a centrally-coordinated talent ID pipeline through the SAI Hockey Centres (Bhopal, Lucknow, Bengaluru, Majuli, Sundergarh) and the Khelo India scheme. The canonical battery is published as **"Hockey Sports Science and Sports Specific Test with Benchmarks"** (Khelo India, Dec 2024, supervised by HI Level 1 coaches): 6 physical-fitness tests + 10 hockey-skill tests + 4 goalkeeper-only tests + a 5-axis Game Awareness rubric. **Final selection score is weighted 15% physical / 15% skill / 70% game performance** for U-15 (Sub-Junior) and U-17/U-19 (Junior). FIH does not publish a single mandated battery — its Performance Centre uses Yo-Yo IR1/IR2, 6×40 m repeat-shuttle sprint and GPS match-load monitoring as the de-facto international standard, with the IR1 norms table (>2400 m elite men, >1600 m elite women) widely adopted as the global reference.

### Test battery

| Test                               | Measures                                              | Protocol                                                                                                                                                         | Tier                                  | Federation use                                                 |
| ---------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| **10 m sprint**                    | Acceleration                                          | Standing start, 2 trials, best to 0.01 s. SJ Boys excellent <1.80s / Girls <2.00s; Junior Boys <1.75s / Girls <1.90s                                             | Phone (slow-mo) / Coach (gates)       | Khelo India, SAI, HI U-15/U-17/U-19                            |
| **40 m sprint**                    | Max speed                                             | Standing start, 2 trials, best time. Junior Boys excellent <5.30s / Girls <5.70s                                                                                 | Phone / Coach                         | Khelo India, SAI, FIH                                          |
| **6 × 30 m repeated sprint (RSA)** | Anaerobic capacity / fatigue index                    | 6 sprints every 30s; calc % drop-off (slowest – best) / slowest × 100. <2% excellent, >5% fair. **Excludes GKs**                                                 | Coach (timing precision)              | Khelo India 2× / yr; FIH research                              |
| **Yo-Yo IR1**                      | Aerobic-anaerobic intermittent                        | 2×20m shuttles + 10s active rest; final speed level + total distance. **HI induction.** SJ Male excellent >18.6 / Female >16.5; Junior Male >20.1 / Female >17.5 | Coach / Center (audio + space)        | HI induction, FIH, Khelo India                                 |
| **Yo-Yo IR2**                      | Elite intermittent capacity                           | Higher start speed (13 km/h). HI runs **4× per year** for KIA/SAI hockey athletes                                                                                | Center (elite cohort)                 | HI for KIA & SAI Hockey athletes                               |
| **T-Agility Test**                 | Multidirectional agility (forward, lateral, backward) | A→B→C→D→B→A pattern; 5m and 10m legs; best of 3. **GK-specific in HI battery**                                                                                   | Coach                                 | Khelo India (GK), generic agility                              |
| **Push-pass accuracy (short)**     | Receiving + passing skill                             | Receive at 18m (girls) / 23m (boys); 5 forehand + 5 reverse-stick passes through 2.5m gates, also at 45°. %                                                      | Coach                                 | HI, Khelo India                                                |
| **Long pass / aerial pass**        | Long-ball range + accuracy                            | Push/slap/hit through 5m gates at 23-35m; overhead pass into 2.5m square at 23m (girls) / 30m (boys), 10 reps                                                    | Coach                                 | HI, Khelo India                                                |
| **Aerial / Indian-dribble jink**   | Close stick control + lift                            | Lift ball over 10 hockey-stick bags in 10m square (3-3-4 rows, 1m apart); fore- and reverse-stick. % clean lifts                                                 | Phone (overhead camera) / Coach       | HI, Khelo India                                                |
| **Drag flick**                     | Penalty-corner power + accuracy                       | After injection + trap, 5 flicks targeting RT/RD/LT/LD/CT. Negative score for no-speed or out-of-goal                                                            | Coach + radar (Center for ball speed) | HI U-17/U-19; FIH research benchmarks elite ~30 m/s ≈ 110 km/h |
| **1 vs 1**                         | Finishing under pressure                              | From 23m line vs GK, 8s to score; 5 reps with 30s recovery                                                                                                       | Coach                                 | HI, Khelo India                                                |
| **Reverse hit**                    | Reverse-stick power                                   | From top of D at 45°, receive forehand → reverse-stick hit on goal × 10                                                                                          | Coach                                 | HI, Khelo India                                                |
| **Tackling 2 vs 1**                | Defensive proficiency                                 | 10m × 5m channel; tackler defends 10 consecutive 2v1s with no rest                                                                                               | Coach                                 | HI, Khelo India                                                |

### Position-specific notes

- **Goalkeeper** — HI runs a fully separate skill battery: (a) **Semi-circular angle-coverage** (1-min repetitions left↔right; Jr Men excellent 35-40); (b) **Punting accuracy** (10 balls right + left foot into goal); (c) **Jump-and-reach** (1-min lateral dive-style touches between corners; Jr Men 30-35); (d) **Approach-and-block** (cones at 45°/90°/135°, 7 yards out, 1-min reps; Jr Men 16-18). GKs are **excluded from 6×30m RSA** but do the **T-agility** test instead.
- **Fullback / Defender** — Highest aerobic endurance among outfield (peak intensity ~182 m·min⁻¹), lower sprint count. HI assesses **long aerial passes (28–35m), sweep/hit accuracy** as discriminators. Long-pass accuracy and Yo-Yo IR1 distance are the canonical defender filters.
- **Midfielder** — Highest match running load: ~102 sprint efforts / 648m sprinted per match (vs 79/421 for defenders), peak ~189 m·min⁻¹. Yo-Yo IR1/IR2 + 6×30m RSA are the load-bearing tests. HI weights **versatility + decision-making** highest in Game Awareness for this slot.
- **Forward** — Highest max sprint speed and high-intensity-distance share, peak ~194 m·min⁻¹. 10m + 40m sprint, 1v1 finishing, reverse-hit and aerial-jink (close-control under pressure) are the discriminators. Drag-flick is forward/specialist-defender hybrid.

### Phone-measurable opportunities (the OnlyKrida wedge)

1. **Indian-dribble (close-control) speed test** — Phone overhead/side video of the player weaving through 10 stick-bags or cones; ML can count clean touches and total time. **No HI equivalent yet exists in mobile form — greenfield.**
2. **10m / 40m sprint** — same slow-mo + reference-line trick used for football; calibrated cones in frame.
3. **Drag-flick accuracy (not speed)** — phone camera placed behind goal divides the goal into HI's 5 target zones (RT/RD/LT/LD/CT) and CV labels each of 5 attempts. Speed still needs a radar (center tier), but **accuracy alone is HI-graded**.
4. **Push-pass accuracy through cones** — set 2.5m gate at 18/23m, phone records 5 fore + 5 reverse attempts; ML counts clean passes through gate.
5. **GK jump-and-reach + semi-circular movements** — both are 1-minute rep counts of a stereotyped lateral pattern. Pose-estimation rep counters (e.g. MoveNet) handle this trivially; **unique GK wedge no Indian app currently offers.**

### Gaps flagged

- Hockey-specific sport-science literature is materially thinner than football/soccer.
- SAI's hostel-internal benchmark tables (Bhopal/Lucknow/Bengaluru) are **not publicly published** — only the Khelo India national-level cutoffs are.
- No published Indian junior norm for **VO₂max from Yo-Yo IR1** specifically validated on hockey (Khelo India doc reuses Bangsbo's general formula).
- Position-specific GPS match data is almost entirely from European (NL, ENG) and Australian female squads — **no published Indian male senior or junior hockey GPS dataset**, which is a research gap OnlyKrida could help close just by aggregating opt-in fitness data.

### Sources

- [Khelo India: Hockey Sports Science and Sports-Specific Test with Benchmarks (Dec 2024)](https://kheloindia.gov.in/uploads/Hockey%20Sports%20Science%20and%20Sports%20Specific%20Test%20with%20Benchmarks_dec2024.pdf) — primary, canonical HI/SAI battery
- [Khelo India: TID and Development in Hockey — Induction/Weed-out Criteria](https://kheloindia.gov.in/uploads/Hockey%20%20Finalized%20Induction-Weedout%20Criteria.pdf)
- [SAI Hockey NCOE Open Selection Trials protocol](https://sportsauthorityofindia.nic.in/sai/assets/news/1644600397_Hockey-NCOE's%20Selection%20Trials%20Details%20.pdf)
- [FIH: Yo-Yo IR1 norms for adult men and women](https://www.fih.hockey/static-assets/pdf/yo-yo-fitness-test-standards.pdf)
- [Bishop & Brazier — Needs analysis and testing battery for field hockey](https://www.researchgate.net/publication/275027877_A_needs_analysis_and_testing_battery_for_field_hockey)
- [Repeated shuttle sprint test in international field hockey players (PubMed)](https://pubmed.ncbi.nlm.nih.gov/35830427/)
- [Peak Running Intensities in Field Hockey — Positional Analysis (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8336549/)
- [Frontiers — Positional and quarter differences in elite female field hockey](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2023.1296752/full)
- [FIH HockeyTracker — drag-flick ball speeds](http://www.fih.ch/news/hockeytracker-how-fast-can-they-go/)
- [Kinematic analysis of the drag flick (Tandfonline)](https://www.tandfonline.com/doi/full/10.1080/14763141.2016.1182207)
- [Bangsbo, Iaia & Krustrup — Yo-Yo IR Test review (Sports Med 2008)](https://pubmed.ncbi.nlm.nih.gov/18081366/)

---

## Basketball

### Federation context

Basketball has the world's most mature physical-testing culture, anchored by the **NBA Draft Combine** (held annually in Chicago) whose battery — standing reach, no-step + max vertical, three-quarter court sprint, lane agility, modified shuttle, 185 lb bench press, body composition — is the global gold standard, published openly on NBA.com/stats since 2000. **FIBA** does not publish a single mandated junior battery; instead U17/U19 World Cup federations (USA Basketball, Canada Basketball, Basketball Australia, FIBA Europe academies) localise the NBA Combine plus a Yo-Yo IR1 (FIBA's referees use Yo-Yo officially). In India, the **NBA Academy India** (Jaypee Greens, Greater Noida — operational 2017–2022, restructured into the NBA Basketball School network) and the **Reliance Foundation Jr. NBA programme** (since 2013, 11M+ youth, 13.5K schools) run a circuit-based skills challenge — dribbling + passing + shooting — supplemented since 2024 by **AiSCOUT video-AI assessment**. The **ACG-NBA Jump** invitation tryouts use the NBA Combine battery scaled to U16/U17, plus 5-on-5 evaluation. **BFI** has no published national fitness battery.

### Test battery (11 tests)

| Test                                    | Measures                                      | Protocol                                                                                                                                          | Tier                                         | Federation use                                   |
| --------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------ |
| Standing reach                          | Functional height (in shoes)                  | Stand flat-footed, reach max overhead with one hand against a Vertec/wall; cm                                                                     | coach                                        | NBA Combine, ACG-NBA Jump, NBA Academy India     |
| Standing vertical jump (no-step)        | Lower-body power without countermovement help | From stationary stance, jump and touch highest vane; cm above standing reach. Elite > 60cm                                                        | **phone** (slo-mo + pose-estimation)         | NBA Combine, FIBA junior camps                   |
| Max vertical jump (running approach)    | Explosive power with approach                 | One- or two-step run-in, jump and touch highest vane; cm above reach. Elite > 80cm                                                                | **phone** (slo-mo)                           | NBA Combine, NBA Academy India                   |
| 3/4 court sprint                        | Linear acceleration / top speed               | Sprint 22m (94ft - 3/4 of NBA court) from baseline; electronic timing or stopwatch. Guards target < 3.2s                                          | coach (stopwatch) / center (timing gates)    | NBA Combine, ACG-NBA Jump                        |
| Lane agility drill                      | Multi-directional change of direction         | Sprint forward 5.8m, lateral shuffle 4.9m, backpedal 5.8m, shuffle back; reverse loop. Guards 10.2–10.9s, forwards 11.0–11.4s, centres 11.5–12.3s | coach (stopwatch)                            | NBA Combine, NBA Academy India                   |
| Modified shuttle (reactive shuttle)     | Short-burst quickness                         | 5-10-5 pro-agility variant from foul line                                                                                                         | coach                                        | NBA Combine (added 2013)                         |
| Bench press @ 185 lb / 80% BW           | Upper-body strength endurance                 | After warm-up (10 push-ups, 5 reps @ 135 lb), max reps at 185 lb                                                                                  | center (calibrated bench)                    | NBA Combine; junior pathways scale to 80% BW     |
| Yo-Yo IR1                               | Aerobic capacity / repeated-sprint endurance  | 20m shuttles with progressive bleep + 10s active rest                                                                                             | **phone** (audio app + GPS)                  | FIBA, BFI state camps                            |
| Spot-up shooting (5- or 7-spot, 60s)    | Shooting % under fatigue + volume             | Player rotates through 5/7 designated spots (corners, wings, top of key), made shots in 60s                                                       | **phone** (camera + rim/ball detection)      | Jr. NBA Skills Challenge, NBA pre-draft workouts |
| Free-throw streak (10 attempts)         | Repeatable mechanics, no-pressure             | 10 FTs, count makes; advanced version = consecutive-makes streak                                                                                  | **phone** (camera)                           | Jr. NBA, NBA Academy India ongoing               |
| Full-court lay-up speed (timed 4 makes) | Ball-handling speed + finishing               | Sprint baseline-to-baseline, finish lay-up, reverse, 4 makes consecutively timed                                                                  | coach (stopwatch) + **phone** (video review) | Jr. NBA circuit, ACG-NBA Jump                    |

### Position-specific notes

- **Guard (PG/SG)**: Lane agility < 11.0s and 3/4 sprint < 3.2s are the gates. Shooting % from above-the-break 3 (top of key + wings) and free-throw repeatability matter more than vertical. Add a **dribble-through-cones** time test (5 cones over 20m, both hands).
- **Wing (SF/3-and-D)**: Standing vertical 70+ cm, 3-point spot-up % from corners + wings (corner 3 is the league's highest-EV shot), max vertical for closeout/contest. Wingspan : height ratio > 1.04 is an NBA-wing flag.
- **Big (PF/C)**: **Standing reach is dominant** — a 7'0" centre with a 9'2" reach beats a 7'2" centre with a 9'0" reach. Lane agility under 12.0s separates modern bigs. Add a **rebound-tap drill** (consecutive backboard taps in 30s — measures repeated explosive jump). Free-throw % matters more than ever (Hack-a-Shaq era).

### Phone-measurable opportunities (the OnlyKrida wedge)

1. **Vertical jump (standing + max) via slo-mo + MediaPipe/MoveNet** — single highest-signal basketball metric. 240 fps iPhone slo-mo + ankle-keypoint tracking gives ±1.5cm accuracy vs Vertec. Validated in 3x3 basketball pose-estimation literature (TrackID3x3).
2. **Spot-up shooting %** — fixed-tripod camera, ball + rim detection, auto-count makes/misses across 5 spots. **The basketball banger** — no other Indian platform offers verified shooting %, and it's the metric scouts actually want. DeepSportradar-v1 provides the dataset/benchmark for ball detection.
3. **Free-throw streak with form analysis** — pose estimation extracts elbow angle, release height, follow-through; ML scores form consistency across 10 reps. Phone-only, no equipment.
4. **Yo-Yo IR1** — bleep-test app with GPS/accelerometer to verify the player actually crossed the 20m line each shuttle (anti-cheat).
5. **Lay-up speed (full-court) + dribble-cones** — phone in landscape on tripod at half-court, ball + player tracking gives split times per length. Coach-verified upgrade tier for badge.

Center-only tests in the Indian context: **standing reach + 3/4 sprint with timing gates + bench press** stay in `coach_verified` or `center_tested` (SAI Patiala, NBA Academy India). Anthropometric measurements (wingspan, hand size) need a coach with a tape measure — these are the data points scouts pay for, so badge them prominently.

### Sources

- [NBA Draft Combine — Wikipedia](https://en.wikipedia.org/wiki/NBA_draft_combine)
- [NBA Combine Stats portal](https://www.nba.com/stats/draft/combine)
- [LPS Athletic — NBA Draft Combine measurement standards](https://lpsathletic.com/nba-draft-combine-stats-measurements-agility-strength-standards/)
- [Topend Sports — NBA Combine Fitness Testing](https://www.topendsports.com/sport/basketball/testing-nba-draft.htm)
- [Topend Sports — Lane Agility Drill protocol & calculator](https://www.topendsports.com/testing/tests/agility-lane.htm)
- [Frontiers Psychology — Anthropometric Determinants by NBA Position](https://pmc.ncbi.nlm.nih.gov/articles/PMC6820507/)
- [Sports Medicine — Systematic Review of Fitness Testing in Basketball](https://pmc.ncbi.nlm.nih.gov/articles/PMC9213321/)
- [SciELO — Power and agility testing within NBA pre-draft combine](http://www.scielo.br/j/rbcdh/a/Dtb3nwNWDVhVRtJ3Zv4RKtc/?lang=en)
- [FIBA Referees Yo-Yo Fitness Test Manual](https://assets.fiba.basketball/image/upload/v1728662544/TYG0xsQJlDkAoCFR.pdf)
- [NBA Academy India FAQ + tryouts](https://nbaacademy.nba.com/faq/)
- [Reliance Foundation Jr. NBA programme — 10th anniversary](https://www.rfyouthsports.com/rfys/press-release/reliance-foundation-jr-nba-program-in-india-returns-for-10th-consecutive-year)
- [Inside Sport India — RF Jr. NBA 4.5M engagement + AiSCOUT](https://www.insidesport.in/basketball/reliance-foundation-jr-nba-programme-engage-4-5m-815122017/)
- [Breakthrough Basketball — 10-Spot Shooting Drill protocol](https://www.breakthroughbasketball.com/drills/10spotshooting)
- [TrackID3x3 — 3x3 Basketball Pose Estimation dataset](https://hf.co/papers/2503.18282)
- [DeepSportradar-v1 — Basketball CV Benchmark](https://hf.co/papers/2208.08190)
- [Basketball-SORT — Multi-object tracking for basketball](https://hf.co/papers/2406.19655)

---

# Cross-cutting synthesis

## Test taxonomy — what's universal vs sport-specific

Across the 7 sports, every canonical battery hits 8 trait clusters. The mix and weighting changes per sport.

| Cluster                       | Representative tests                                                                             | Cricket      | Football | Kabaddi       | Badminton | Athletics      | Hockey  | Basketball     |
| ----------------------------- | ------------------------------------------------------------------------------------------------ | ------------ | -------- | ------------- | --------- | -------------- | ------- | -------------- |
| Aerobic capacity              | Yo-Yo IR1/IR2, 30-15 IFT, AIR-BT, Cooper, 2km/5000m TT                                           | ★★           | ★★★      | ★             | ★★        | ★★★ (distance) | ★★★     | ★★             |
| Anaerobic / RSA               | Bronco, RAST, 6×30/40m, 30s raid loop, repeated-150m                                             | ★★           | ★★       | ★★★           | ★★        | ★★★ (sprints)  | ★★★     | ★              |
| Acceleration                  | 10m / 20m sprint, 30m from blocks/standing                                                       | ★★           | ★★★      | ★★★           | ★         | ★★★            | ★★★     | ★★★            |
| Max velocity                  | 30m fly, 40m sprint, 3/4 court                                                                   | ★            | ★★★      | ★★            | ★         | ★★★ (sprints)  | ★★★     | ★★★            |
| Change-of-direction / agility | 5-0-5, T-agility, lane agility, 5-10-5, Badcamp                                                  | ★★           | ★★★      | ★★★           | ★★★       | ★              | ★★      | ★★★            |
| Lower-body power              | CMJ, SLJ, drop jump, max-vertical                                                                | ★★           | ★★       | ★★★           | ★★★       | ★★★ (jumps)    | ★       | ★★★            |
| Upper-body / throwing power   | Med-ball throw, ball-throw distance, bench press, drag flick                                     | ★★           | ★        | ★             | ★         | ★★★ (throws)   | ★★★     | ★★             |
| Skill-under-fatigue           | LSPT, push-pass accuracy, drag-flick accuracy, spot-shooting %, toe-touch precision, wall-volley | ★★           | ★★★      | ★★            | ★★★       | ★              | ★★★     | ★★★            |
| Cognition / reaction          | Pitch reaction, RAS, GK reach, screen-tap RT                                                     | ★★ (keepers) | ★★ (GK)  | ★★ (defender) | ★★★       | ★★ (sprints)   | ★★ (GK) | ★              |
| Anthropometrics               | Height, sitting height, arm span, wingspan, body fat %, grip strength                            | ★            | ★        | ★             | ★         | ★★★            | ★       | ★★★ (wingspan) |

★ = nice to have, ★★ = canonical, ★★★ = role-defining

**Implications for OnlyKrida**:

- Eight tests would cover 80% of canonical batteries: CMJ, 10m/20m/40m sprint splits, 5-0-5 / 5-10-5 agility, Yo-Yo IR1, standing long jump, sit-and-reach, hand grip, and one anthropometric scan (height + arm span). All but the last are coach-verifiable; CMJ + sprint + standing-long-jump are phone-measurable.
- The sport-specific layer adds skill-under-fatigue tests (juggling for football, wall-volley for badminton, drag-flick accuracy for hockey, spot-shooting for basketball, bowling speed for cricket, toe-touch precision for kabaddi) — these are where OnlyKrida's wedge is, because nobody else combines them under one app.
- Cognition / reaction tests are dominantly screen-based (Pitch Reaction, RAS, simple-RT) — essentially zero hardware cost, easy to ship.

## Phone-sensor API plan

| Test family                                                        | Phone API needed                                                                                                                 | Existing project module                            | New work                                                                        |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| GPS time trial (2km, Cooper, AIR-BT pacing)                        | `expo-location` foreground tracking                                                                                              | already in package.json                            | none — adopt existing pattern                                                   |
| Sprint timing (10/20/30/40m via two-phone or single-phone slo-mo)  | High-fps camera capture (`expo-camera`) + audio start cue (`expo-av`) + frame extraction (manual or via ffmpeg-kit-react-native) | partial — `expo-av` used elsewhere                 | add high-fps capture mode + frame analysis pipeline                             |
| Vertical jump / SLJ / drop jump (flight-time + landmark detection) | `expo-camera` (slo-mo) + MediaPipe Tasks (BlazePose) via `react-native-mediapipe` or TensorFlow Lite                             | none                                               | new dep: pose-estimation runtime                                                |
| Yo-Yo IR1/IR2 audio pacing                                         | `expo-av` audio player with precise scheduled cues                                                                               | already used in beep-test-live                     | extend beep-test framework to support multiple Yo-Yo levels + 30-15 IFT cadence |
| Single-leg balance                                                 | `expo-sensors` accelerometer + gyroscope (already in `hooks/sensor-context.tsx`)                                                 | already wired into accelerometer for fitness tests | reuse — extract sway frequency + amplitude from gyro stream                     |
| Court-coverage / footwork timer                                    | `expo-camera` + pose tracking + on-screen audio cues                                                                             | none                                               | tie to badminton + hockey wedges                                                |
| Wall-volley / shuttle-strike count                                 | `expo-av` audio (impulse detection) OR `expo-camera` (CV detection)                                                              | partial                                            | impulse detection is lighter; ship audio version first                          |
| Spot-shooting / free-throw / drag-flick accuracy                   | `expo-camera` + ball + rim/target detection (custom-trained MobileNet or DeepSportradar pretrained)                              | none                                               | the heaviest new ML lift                                                        |
| Anthropometric scan (height, arm span)                             | ARKit (iOS) / ARCore (Android) PersonSegmentation + reference-object scaling                                                     | none — Expo wraps both                             | new dep: `expo-ar` or platform-specific bridge                                  |
| Reaction time (screen-tap RT, Pitch Reaction)                      | Pure JS — `setTimeout` + touch handler                                                                                           | n/a                                                | trivially shippable                                                             |

The heaviest new ML lift is the ball + rim/target detection family (basketball spot-shooting, hockey drag-flick accuracy, football crossing accuracy). Everything else is a thin wrapper over Expo APIs the project already uses.

## v1.5 fitness battery proposal

A concrete menu of **30 tests** spanning all 7 sports. Marked with the recommended OnlyKrida tier (phone = `app_measured` 0.85×, coach = `coach_verified` 1.0×, center = `center_tested` 1.1×).

| #   | Test                                            | Sports                              | Tier                                   |
| --- | ----------------------------------------------- | ----------------------------------- | -------------------------------------- |
| 1   | Yo-Yo IR1 (existing)                            | All                                 | coach                                  |
| 2   | Sprint 10m / 20m / 40m splits (extend existing) | All                                 | phone or coach                         |
| 3   | CMJ vertical jump (existing)                    | All                                 | phone                                  |
| 4   | Standing long jump                              | Cricket, Athletics, Football        | phone                                  |
| 5   | 5-0-5 agility                                   | Cricket                             | coach                                  |
| 6   | 5-10-5 pro-agility / lane agility               | Kabaddi, Basketball                 | coach                                  |
| 7   | T-agility (existing, for keepers/GKs)           | Football GK, Hockey GK              | coach                                  |
| 8   | Yo-Yo IR2                                       | Cricket, Football                   | coach                                  |
| 9   | 30-15 IFT                                       | Football, Hockey                    | coach                                  |
| 10  | 2km / Cooper 12-min run                         | Cricket, Athletics, all aerobic     | phone (GPS)                            |
| 11  | Bronco test                                     | Cricket fast bowlers                | coach                                  |
| 12  | Drop jump / RSI                                 | Football, Athletics jumpers         | coach                                  |
| 13  | Hand grip dynamometer                           | Cricket, Kabaddi, Athletics throws  | center                                 |
| 14  | Sit-and-reach (flexibility)                     | Kabaddi, Badminton, all             | phone (camera)                         |
| 15  | Single-leg balance (stork)                      | Kabaddi defender, Badminton         | phone (gyro)                           |
| 16  | Seated medicine-ball throw                      | Cricket, Athletics throws, Football | coach                                  |
| 17  | Cricket ball throw for distance                 | Cricket                             | coach                                  |
| 18  | Bowling speed (radar / phone slo-mo)            | Cricket                             | phone or coach                         |
| 19  | Pitch reaction test (screen)                    | Cricket batters                     | phone                                  |
| 20  | Juggling count (60s)                            | Football                            | phone                                  |
| 21  | Dribble slalom                                  | Football, Hockey                    | phone                                  |
| 22  | Goalkeeper reach + dive                         | Football GK                         | phone                                  |
| 23  | Wall-volley count (60s)                         | Badminton                           | phone                                  |
| 24  | Shadow footwork timer (4-corner cued)           | Badminton                           | phone                                  |
| 25  | Push-pass accuracy through gates                | Hockey                              | coach                                  |
| 26  | Drag-flick accuracy                             | Hockey                              | phone (target zones) or center (speed) |
| 27  | Indian-dribble close-control                    | Hockey                              | phone                                  |
| 28  | Standing reach + max vertical                   | Basketball                          | coach (reach) + phone (jump)           |
| 29  | Spot-shooting % (5-spot, 60s)                   | Basketball                          | phone                                  |
| 30  | Free-throw streak with form analysis            | Basketball                          | phone                                  |

**Of the 30, 14 are phone-measurable** (`app_measured` 0.85×). That's a meaningful expansion vs the current 4 generic phone tests, and every sport gets at least 2–3 sport-specific phone tests in addition to the cross-cutting CMJ + sprint + Yo-Yo battery.

## DPDP §9(3) interaction (loops back to Wave 4)

Many of the recommended tests involve **video upload** of an under-18 athlete. Per the regulatory-compliance brief and the parental-consent design doc:

- Pose-data extracted from those videos is **biometric-class personal data** under DPDP. Storage, processing, and any third-party (scout) access requires purpose-bound consent.
- Under-15 athletes' video uploads must default to **edge-side face blur** before upload (regulatory-compliance brief §3.3 rule 2). Plain video without blur is only available with explicit parental consent.
- The **scout-tier classification** out-of-scope for parental-consent v1 is doubly relevant here: Tier 2/3 scouts (verified-pro / verified-premium) get unblurred video access; Tier 1 (verified-grassroots) gets pose-extracted scalar metrics only.
- Any test that involves a coach signing off (`coach_verified` tier) requires the coach to also have completed the §9(3) compliance training that comes with the scout-tier feature.

**Implication for v1.5**: phone-measurable tests that produce only scalar metrics (sprint times, CMJ height, Yo-Yo level) have a much lighter compliance footprint than tests that require video persistence (juggling count via video upload, spot-shooting %, drag-flick accuracy with goal-zone targeting). Ship the scalar-metric ones first; gate the video-required ones on the parental-consent flow being live.

## Verification tier mapping — integrity attack surface

| Tier             | Multiplier | What it actually catches                                                                  | Attack surface remaining                                                                                                                                                                                                                                                          |
| ---------------- | ---------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `self_reported`  | 0.7×       | User typed a number. No verification.                                                     | Athlete can claim anything. Use only as default-fallback.                                                                                                                                                                                                                         |
| `app_measured`   | 0.85×      | Phone sensor / camera / GPS captured the metric. Includes timestamp + sensor metadata.    | GPS spoofing for time-trial runs; video tampering for sprint-frame timing; pre-recorded video replay; multi-attempt cherry-picking. Mitigations: live-camera-required (no upload-from-gallery), session token in audio-cue start, accelerometer-cross-check vs reported distance. |
| `coach_verified` | 1.0×       | A registered coach on OnlyKrida observed the test. Coach's identity + signature attached. | Coach collusion (paid favourable verification). Mitigations: coach scoring is itself peer-rated; out-of-distribution scores trigger review; multiple-coach co-signing for elite scores.                                                                                           |
| `center_tested`  | 1.1×       | Test conducted at a partnered SAI / NCA / academy center with calibrated equipment.       | Ground truth, modulo center-staff fraud (rare, expensive to attempt).                                                                                                                                                                                                             |

Most v1.5 phone tests should ship at `app_measured` — the 0.85× multiplier signals to scouts that the metric is directional but not gold-standard, and that's appropriate given the attack surface. Coach-verified upgrades happen organically when the athlete attends a coach-supervised session.

## Cost / hardware floor by tier

| Tier             | Hardware floor                                                                                                                                 | Per-test cost to athlete                        | Per-test cost to OnlyKrida                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------- |
| `app_measured`   | ₹6000 Android, no other equipment                                                                                                              | ₹0 (athlete already has phone)                  | ~₹0.01 (Supabase storage)                 |
| `coach_verified` | Cones (₹50/set), stopwatch (₹0 — phone), measuring tape (₹100), maybe a 30cm box for drop jump (₹500)                                          | ₹0 (provided by coach)                          | Coach's time, paid via marketplace later  |
| `center_tested`  | Yo-Yo audio cue speaker, force plate (₹150K+), Jamar dynamometer (₹4-6K), Vertec or similar (₹15K), radar gun (₹40K), Batak/Dynavision (₹80K+) | ₹500–2000 per session at SAI/NCA partner center | Partnership negotiation, no per-test cost |

**Implication**: the `app_measured` tier is the only one with truly grassroots-scalable economics. Center-tested becomes feasible only at scout-paid premium tier (a Manchester City rep paying for the pre-trial verification).

---

## Recommendations summary

1. **Ship the v1.5 fitness battery** as the next major feature wave after Wave 4 (parental-consent compliance) — this is the single highest-leverage extension to OnlyKrida's existing scout-side filtering. The 30-test menu above is ready to pass to engineering as a feature spec.
2. **Prioritize the 14 phone-measurable sport-specific tests first** — they have the lowest compliance / hardware footprint and the highest grassroots reach. Ship in batches by sport, starting with the sports OnlyKrida has the most immediate market for (Hyderabad-first → cricket + football + badminton + kabaddi).
3. **Treat OnlyKrida as the kabaddi sports-science publisher.** The literature is thin, the 30s-raid-loop test isn't formally validated anywhere, and Telugu Titans is already a partner. Publish the protocol as a JSCR or Indian Journal of Physiology paper. That's a defensible moat plus a credibility lever for the platform.
4. **Build the IAAF combined-events scoring engine for Athletics** — it lets OnlyKrida auto-classify a 13-year-old as a "thrower" / "sprinter" / "endurance" based on a single weekend of phone tests. No competitor offers that. NIDJAM's 100K+ U-18 funnel is the addressable market.
5. **The basketball spot-shooting % feature is the marketing banger**: nobody else in India offers verified shooting % via phone, the pose-detection models exist (TrackID3x3, DeepSportradar), and "the kid who hits 18 of 25 corner threes on his phone" is the kind of verifiable scout signal that travels in WhatsApp groups for free.
6. **Use the gbrain seed's Telugu Titans relationship** to negotiate access to PKL combine data — both for normative tables (kabaddi has none for senior pros) and for partnership in publishing the new validated sport-specific tests.
