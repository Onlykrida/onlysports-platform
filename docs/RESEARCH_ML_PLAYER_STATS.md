# ML / AI for Automatic Player-Stat Extraction on OnlyKrida — Deep Research

_Research date: 2026-04-25. Audience: founder + engineering. Read top-to-bottom or jump to Section 6 for the rollout._

## Executive Summary

- **The big unlock is "intentional capture", not match-footage analysis.** A grassroots athlete pointing their phone at a sprint, jump, or single bowling delivery is a tractable computer-vision problem in 2026. Twenty-two-player wide-angle match clips are not — leave that to broadcasters and SoccerNet researchers.
- **Pose-based fitness verification is the highest-ROI first build.** Use Google MediaPipe Pose Landmarker (BlazePose, on-device) plus a small server-side ViTPose pass to (a) verify the four existing fitness tests OnlyKrida already collects, and (b) auto-extract sprint speed and vertical jump height with a confidence interval. This converts "self-reported" results into a new `app_measured` tier — a feature the platform already has columns for (`verification_tier`, `sensor_data`, `video_url` already in `fitness_test_results`).
- **For Cricket, start with bowling speed + bowling-action pose.** A "point camera at bowler from side-on, app records release frame to ball-at-stumps" flow is already a proven category (BowloMeter, Pocket Radar Smart Coach) and the math is freshman physics + pose. For batting, [`rokmr/cricket-shot`](https://hf.co/datasets/rokmr/cricket-shot) (10 shot types, ~1K labelled videos, Apache-2.0) is the fastest path to a shot-classification feature.
- **For Football, do not try to compete with SoccerNet.** Build per-athlete drills instead: 20m sprint, agility T-test, juggling-reps, and a "1v1 drill" video tagger. Heavy SoccerNet models ([`julianzu9612/RFDETR-Soccernet`](https://hf.co/julianzu9612/RFDETR-Soccernet), [`anirudhmu/videomae-base-finetuned-soccer-action-recognition`](https://hf.co/anirudhmu/videomae-base-finetuned-soccer-action-recognition)) are useful as future "match-clip enrichment" but are non-trivial and target broadcast angles.
- **Architecture: hybrid.** On-device MediaPipe for capture-time feedback ("hold camera steady, you're not in frame"); upload video + pose JSON; server-side worker re-runs ViTPose / a custom regressor; write derived stats back to `fitness_test_results` and a new `ml_extractions` table. Use Replicate or Modal for the GPU inference path — both are cheap at OnlyKrida scale.
- **Trust fit is straightforward.** Add a 5th tier between `self_reported` and `coach_verified`: `ml_verified` with a multiplier of ~0.85×. Show scouts the number with a `±` band ("Sprint 27.4 km/h, AI-measured, ±1.2 km/h"). This is more credible than self-reported and cheaper than centre-tested.
- **Phase 1 (8 engineer-weeks) is one feature: AI-measured Vertical Jump.** It's the cleanest physics, smallest model surface, biggest "wow" demo for scouts, and validates the entire pipeline end-to-end. Phase 2 is sprint speed; Phase 3 is cricket bowling speed + shot tagging.
- **Privacy is the elephant.** A non-trivial fraction of athletes will be minors. POCSO + DPDP Act (India) + COPPA (Dubai/UAE traffic) require: explicit parental consent, optional face-blur on public posts, no biometric storage without consent, and a hard floor on data retention. Build this in from day one — retrofitting will be brutal.

---

## 1. The Stat-Extraction Opportunity Space

### Two regimes, dramatically different

| Regime                     | Description                                                                                                                                                | Tractability (phone, grassroots)                                                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Intentional capture** | Athlete frames a single, clean action: a sprint, a jump, one bowling delivery, one set of shots. Camera is roughly stationary, single person, known angle. | **Very tractable.** Pose + simple physics gives ±5–10% accuracy. Already a viable consumer-app category.                                                                         |
| **B. Match footage**       | 11-22 players, variable angle, camera shake, occlusion, no calibration.                                                                                    | **Hard.** Requires full SoccerNet-style stack (multi-object tracking + re-id + camera calibration + action spotting). Realistic only with broadcast-quality footage, not phones. |

OnlyKrida wins by **building for regime A first**. The existing 4-tier verification system already implies athletes will be asked to record specific tests; that exact UX is also where ML gets reliable.

### Per-sport "minimum viable stat"

**Cricket (highest value in India)**

- **MVP: Bowling speed + delivery type.** Phone on tripod, side-on, fixed angle, mark stumps with a sticker (or use court-line detection). Pose estimation finds release frame; ball-tracking (TrackNet-style) gives travel time; physics gives speed. Apps like [BowloMeter](https://play.google.com/store/apps/details?id=com.sanaullahamirbm.bowlometer_measurebowlingspeed) already do an inferior version of this with tap-based timing. With pose, accuracy goes from "±10 km/h" to "±2 km/h" — comparable to Pocket Radar's ±2 km/h at 10× lower cost.
- **Tier 2: Bowling action pose** — front-arm angle at release, shoulder rotation, run-up stride frequency. These map directly to coaching cues (no-ball check, action legality flagging à la ICC pose review).
- **Tier 3: Shot type recognition.** Use [`rokmr/cricket-shot`](https://hf.co/datasets/rokmr/cricket-shot) — 10 shot types (cover drive, defense, flick, hook, etc.), Apache-2.0. Fine-tune VideoMAE or use it as a labelled bootstrap.
- **Out of scope for v1:** match-footage strike rate, partnership analysis. These are better solved by API integration with [Cricsheet / CricketData.org](https://cricketdata.org/) (free, ball-by-ball JSON) when the athlete plays in a covered league.

**Football**

- **MVP: 20m / 40m sprint speed + vertical jump.** Same pose pipeline as cricket; reuses every model.
- **Tier 2: Juggling-reps counter** + **1v1 finishing drill action recognition.** Repetition counting is a solved problem ([`Pūioio` paper, 2308.02420](https://hf.co/papers/2308.02420), TransRAC [2204.01018](https://hf.co/papers/2204.01018)).
- **Tier 3: Match-clip enrichment.** When an athlete uploads a goal/skill clip, run a fine-tuned VideoMAE ([`anirudhmu/videomae-base-finetuned-soccer-action-recognition`](https://hf.co/anirudhmu/videomae-base-finetuned-soccer-action-recognition), CC-BY-NC) to auto-tag "goal / pass / dribble / tackle" for the feed and search index. Single-player + single-event clips, not full matches.
- **Out of scope for v1:** distance covered, heatmaps, off-ball runs. SoccerNet GSR ([2404.11335](https://hf.co/papers/2404.11335)) does this but needs broadcast video + pitch calibration.

**Athletics, Kabaddi, Hockey, Basketball, Badminton**

- **Athletics:** sprint speed (same pipeline), stride length and frequency directly from pose, vertical/long-jump height (long jump pose has a published model: [`All Keypoints You Need`, arXiv 2304.02939](https://hf.co/papers/2304.02939)).
- **Kabaddi:** virtually nothing on Hugging Face. This is **OnlyKrida's defensible niche**. Build a small custom dataset (1-2K clips: raid action / defender stance / chain catches), fine-tune a skeleton-based action recognizer (BST-style transformer, [2502.21085](https://hf.co/papers/2502.21085)). Domain advantage compounds.
- **Basketball / Hockey / Badminton:** ride existing pose + ball-tracking. Badminton has [BST](https://hf.co/papers/2502.21085) and [FineBadminton](https://hf.co/papers/2508.07554) for shot type. Basketball has [TrackID3x3](https://hf.co/papers/2503.18282) for 3x3 (more relevant than 5x5 for grassroots Indian basketball).

### What you cannot do on phone footage

- Reliable **ball-spin / swing measurement** — needs high-FPS (240+) plus calibrated optics.
- **Distance covered / heatmaps** in match footage from one phone — needs pitch calibration + multi-person tracking with re-id, fragile at amateur quality.
- **Fine biomechanical assessment** — requires multi-camera or wearables. Pose2Sim / OpenSim ([Sports2D](https://github.com/davidpagnon/Sports2D)) can do markerless 3D from 2+ cameras but is not realistic in the field.
- **Anything below ~1 second resolution** — pose at 30 fps gives you 33 ms timing precision, which is fine for sprints (~1% error on 20m) but borderline for ball-release events at 145 km/h (where 33 ms = 1.3m of ball travel).

---

## 2. Available Models, Datasets, and Tooling

### Pose estimation (pick two: one mobile, one server)

| Model                                     | Repo                                                                                             | License                 | Where it runs                                                  | Best for                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **MediaPipe Pose Landmarker / BlazePose** | Google, [BlazePose paper 2006.10204](https://hf.co/papers/2006.10204)                            | Apache-2.0              | **On-device** (iOS, Android, web). 30 fps on a 2022-era phone. | Capture-time framing feedback, rep counting, coarse pose.                                                 |
| **ViTPose-Plus-Base**                     | [`usyd-community/vitpose-plus-base`](https://hf.co/usyd-community/vitpose-plus-base)             | Apache-2.0              | Server-side (transformers, 125M params, 32M HF downloads)      | Higher-accuracy verification pass after upload.                                                           |
| **YOLOv8-Pose (nano)**                    | [`Xenova/yolov8n-pose`](https://hf.co/Xenova/yolov8n-pose)                                       | AGPL-3.0 (license risk) | ONNX, transformers.js, edge.                                   | Lightweight ball+pose joint detection. **Watch the AGPL** — likely incompatible with a closed mobile app. |
| **RTMPose**                               | [arXiv 2303.07399](https://hf.co/papers/2303.07399)                                              | Apache-2.0              | Snapdragon-class mobile @ 90+ FPS                              | Best speed/accuracy tradeoff if MediaPipe isn't enough.                                                   |
| **SynthPose-ViTPose-Base**                | [`stanfordmimi/synthpose-vitpose-base-hf`](https://hf.co/stanfordmimi/synthpose-vitpose-base-hf) | Apache-2.0              | Server                                                         | Adds clinically-relevant keypoints (ankle, knee landmarks) — good for jump/sprint biomechanics.           |

**Recommended pair: MediaPipe (on-device) + ViTPose-Plus-Base (server).** MediaPipe is the de-facto winner for mobile pose; ViTPose is the best apache-licensed transformer pose model and runs in 200ms on a Replicate L4.

### Action recognition

- **VideoMAE-base** ([`MCG-NJU/videomae-base`](https://hf.co/MCG-NJU/videomae-base)) — clean foundation, Apache-style.
- **Soccer fine-tunes** by `anirudhmu/*` (CC-BY-NC, so commercial use is restricted — fine for v1 demo, must be retrained for prod).
- **Sports VideoMAE-large** ([`Chaitanya798800/videomae-large_Sports_action_recognition`](https://hf.co/Chaitanya798800/videomae-large_Sports_action_recognition)) — broader sport coverage.
- **Cricket-shot dataset** ([`rokmr/cricket-shot`](https://hf.co/datasets/rokmr/cricket-shot)) — Apache-2.0, ten shot classes, the foundation of any cricket batting-classifier.

### Object / ball tracking

- **TrackNet** ([1907.03698](https://hf.co/papers/1907.03698)) and the stronger baseline [SBDT, 2311.05237](https://hf.co/papers/2311.05237) — heatmap-based tiny-object tracking, used widely for tennis/badminton ball.
- **ByteTrack / DeepSORT** are not on HF directly but are 1-line pip installs and pair with YOLO detectors. Use Roboflow's [`Trackers` Space](https://hf.co/spaces/Roboflow/Trackers) for a reference impl.
- **RFDETR-SoccerNet** ([`julianzu9612/RFDETR-Soccernet`](https://hf.co/julianzu9612/RFDETR-Soccernet)) — Apache-2.0, soccer-specific player/ball detector. Useful when the athlete uploads broadcast-quality match clips.

### Speed / distance from video

The technique is well-trodden:

1. Pose estimation gives ankle keypoint per frame.
2. Calibrate scale via known reference (a flag, a cone-pair at 10m, or use **vehicle-speed estimator's vanishing-point trick** [arXiv 2505.01203](https://hf.co/papers/2505.01203) when no markers).
3. Stride length × stride frequency (from pose periodicity) gives speed without needing scene calibration — works even with hand-held cameras.
4. For jumps: hip-keypoint trajectory + frame rate + height calibration via athlete's standing height.

For sprint timing, **audio-based start detection (clap) + pose-based finish detection** is more accurate than pure visual — use the phone's mic in parallel.

### Audio / IMU sensor fusion (free signal)

- The phone already has a mic, accelerometer, gyroscope, magnetometer.
- **Sprint timing**: clap-start detection via audio is sub-10ms accurate; cheap vs. visual.
- **Vertical jump (CMJ)**: phone-on-belt or in-pocket detects flight time via accelerometer with ~3% error. Papers: [Pūioio, 2308.02420](https://hf.co/papers/2308.02420), [Mobile Exergames, 2602.00809](https://hf.co/papers/2602.00809).
- **Agility T-test**: gyroscope + footstep-audio gives lap timing.
- **Match wearable possibility**: cheap GPS+IMU watches (Coros, Amazfit) export TCX/FIT — useful future add-on but out of v1 scope.

OnlyKrida's `fitness_test_results.sensor_data` JSON field is already designed for this (see `hooks/fitness-test-context.tsx:341` — `sensor_data?: Record<string, any>`). Lay the rails now.

### Sport-specific open-source projects worth tracking

- **Sports2D** by David Pagnon ([github.com/davidpagnon/Sports2D](https://github.com/davidpagnon/Sports2D)) — production-grade markerless 2D biomechanics from a phone video, BSD-3 licensed. Could literally be vendored as a Python worker for OnlyKrida's server-side path.
- **Pose2Sim** — full 2D-to-3D markerless OpenSim pipeline. Overkill now; consider for "Pro" tier later.
- **DeepSportradar-v1** ([2208.08190](https://hf.co/papers/2208.08190)) — basketball CV benchmarks.

### Indian-specific datasets

- Hugging Face has very little (cricket commentary, ASR, no Indian-CV-of-sports data).
- Cricsheet provides text ball-by-ball for international + IPL matches but **not grassroots** — useful for richening pro-level athlete profiles, not for the 99% who never appear in pro data.
- **Kabaddi: zero on HF.** This is OnlyKrida's strongest moat opportunity — build a 2-3K-clip raid/defense action dataset with 5 universities or pro Kabaddi League partners and you own the category in India.

---

## 3. Third-Party Sports Data APIs (Non-ML Alternative)

For **stats that already exist in someone's database**, buying or scraping beats building.

| Provider                        | Coverage                                    | Cost ballpark (2026)                   | India / grassroots fit                                |
| ------------------------------- | ------------------------------------------- | -------------------------------------- | ----------------------------------------------------- |
| **Cricsheet / CricketData.org** | Pro + international, ball-by-ball, CSV/JSON | Free                                   | ✓ For top-tier athletes only. Useless for grassroots. |
| **Roanuz Cricket API**          | IPL + international live                    | $99–$999/mo tiered                     | ✓ Live IPL, India-friendly. Same caveat — pro only.   |
| **Sportmonks Cricket API**      | Pro leagues                                 | $29+/mo                                | Pro only                                              |
| **StatsBomb (now Hudl)**        | Elite football, women's, academies          | "Contact sales" — typically $25K+/year | ✗ Wrong audience — they target clubs and broadcasters |
| **Wyscout (Hudl)**              | Football pro/semi-pro globally              | Per-seat licensing                     | ✗ Same                                                |
| **Opta / StatsPerform**         | Big leagues globally                        | Enterprise                             | ✗                                                     |

**Strategic implication:** Buying data does _not_ help OnlyKrida's core problem. The ~99% of grassroots Indian athletes the platform serves are **not in any commercial database**. APIs add a "Pro" layer for the 1% — useful for prestige but not for the differentiator. The ML build _is_ the moat: it generates the only structured data that ever existed for these athletes.

---

## 4. Integration Architecture Options

### A. Client-side ML (TensorFlow Lite / ONNX Runtime)

**Stack**: `react-native-fast-tflite` (mrousavy) + `react-native-vision-camera` + MediaPipe Tasks. ONNX Runtime is also viable via `onnxruntime-react-native`.

- **Pros**: zero per-inference cost, works offline, fastest UX, addresses privacy concern (raw video never leaves phone unless user opts in).
- **Cons**: model size (BlazePose Heavy ~10MB, fine; ViTPose-Base ~500MB, no), battery, slower iteration when model updates ship inside app store binaries.
- **What's actually feasible**: pose + lightweight action models only. Forget VideoMAE on-device.

Slot into `services/ai.ts` pattern: add `services/cv-mobile.ts` with a MediaPipe wrapper. Capture-time only — the upload pipeline still does the authoritative pass server-side.

### B. Server-side / serverless

Three flavors, picked by use case:

| Path                               | Best for                                                | Latency                          | Cost at scale                                |
| ---------------------------------- | ------------------------------------------------------- | -------------------------------- | -------------------------------------------- |
| **Supabase Edge Functions**        | Tiny tasks, calling external APIs, post-processing      | <1s                              | Cheap, included                              |
| **Replicate (per-second billing)** | Calling pre-published pose / action models              | 2–5s warm, 30s cold              | **~$0.001 per pose-pass on a clip**          |
| **Modal**                          | Custom Python workers, your own model, cron ingest jobs | sub-second cold start, 1-3s warm | $30/mo free credit; ~$0.05/min on L4         |
| **HF Inference Endpoints**         | Same as Replicate but stays in HF ecosystem             | similar                          | Slightly more expensive, simpler integration |

**Recommended**: Modal as the primary worker (custom Python + GPU + sub-second cold starts), Replicate as a fallback for any model where someone has already shipped a Replicate cog (saves you from packaging it).

### C. Hybrid (recommended)

**Capture flow**:

1. **On-device, real-time (MediaPipe)**: framing feedback ("step back, you're cropped"), rep counting, instant zone preview. No network.
2. **On-upload (Supabase Storage `videos` bucket)**: video lands; trigger via Supabase webhook or Edge Function calls Modal worker.
3. **Modal worker**: extracts frames, runs ViTPose-Plus on key segments, computes derived stats, writes back to `fitness_test_results` (existing) + new `ml_extractions` table.
4. **Async UX**: athlete sees "AI verifying your test... (usually <30s)" — same pattern as Krida AI's existing async chat with adaptive thinking.
5. **On-demand (scout-side)**: a scout requesting deeper analysis on a clip triggers a heavier action-recognition pass (VideoMAE).

### Schema changes (concrete)

```sql
-- Add to fitness_test_results (already has video_url + sensor_data + verification_tier)
ALTER TABLE fitness_test_results
  ADD COLUMN ml_status text CHECK (ml_status IN ('pending','processing','verified','rejected','skipped')),
  ADD COLUMN ml_confidence numeric(4,3),     -- 0.000–1.000
  ADD COLUMN ml_value_estimate numeric,       -- the model's numeric reading (e.g. estimated jump_height)
  ADD COLUMN ml_value_uncertainty numeric;    -- ± band

-- New table for non-fitness extractions (cricket bowling, action tags, etc.)
CREATE TABLE ml_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES profiles(id),
  source_post_id uuid REFERENCES posts(id),
  source_video_url text,
  extraction_type text,           -- 'bowling_speed','shot_type','sprint_speed', etc.
  value jsonb,                    -- {speed_kmh: 27.4, ...}
  confidence numeric(4,3),
  model_id text,                  -- 'vitpose-plus-base@2025-09'
  inference_ms int,
  cost_usd numeric(8,5),
  created_at timestamptz DEFAULT now()
);

-- Update VerificationTier enum to add ml_verified
-- VerificationTier: 'self_reported' | 'app_measured' | 'ml_verified' | 'coach_verified' | 'center_tested'
```

Update `types/index.ts:326-330` to add `'ml_verified'` to the `VerificationTier` union, and `services/cv-pipeline.ts` for the worker-trigger interface (mirroring `services/ai.ts`'s `callClaude` shape).

### Cost-per-athlete-per-month estimates

Assume the median athlete does 1 fitness test, uploads 2 short videos, and generates 4 extractions per month.

| Scale        | Inferences/mo | Avg cost                                 | Total/mo     |
| ------------ | ------------- | ---------------------------------------- | ------------ |
| **10K MAU**  | 40K           | $0.003 (server pose pass + small action) | **~$120/mo** |
| **100K MAU** | 400K          | $0.002 (volume rates + caching)          | **~$800/mo** |
| **1M MAU**   | 4M            | $0.0015 with reserved GPU                | **~$6K/mo**  |

These numbers do _not_ include video storage egress (Supabase) or the cost of training a custom model (one-off $200–$2K per fine-tune on a small Modal job). At early scale, cost is dwarfed by the ~$200/mo Modal floor for keeping a worker warm — perfectly affordable.

---

## 5. Trust & Verification Fit

The existing 4-tier ladder (`self_reported` 0.7× → `app_measured` 0.85× → `coach_verified` 1.0× → `center_tested` 1.1×) is the right scaffolding. **Add `ml_verified` as a 5th tier**, sitting between `app_measured` and `coach_verified`:

| Tier             | Multiplier | What it means                                                    |
| ---------------- | ---------- | ---------------------------------------------------------------- |
| `self_reported`  | 0.70×      | Athlete typed a number                                           |
| `app_measured`   | 0.80×      | Athlete used the in-app stopwatch / counter (no AI verification) |
| `ml_verified`    | 0.85×      | Pose+physics extracted from uploaded video, confidence ≥ 0.80    |
| `coach_verified` | 1.00×      | Real coach signed off                                            |
| `center_tested`  | 1.10×      | Lab/centre with calibrated equipment                             |

Critically, **store the model's confidence per stat**. The athlete benefits from a higher-tier label only when confidence is high — and the scout sees the band.

### Scout UX recommendation

Format: `"Sprint 27.4 km/h ±1.2 (AI-verified, 91% confidence)"`. This is what works:

- **Numeric range, not a single number.** Scouts already think in ranges; `±1.2` is more credible than `27.4` because it admits uncertainty. Sports betting and broadcast UIs train this expectation.
- **Tap-through for proof.** Tap the stat → 2-second video clip with pose-skeleton overlay + the actual frames the measurement came from. This is the difference between "AI noise" and "AI receipt."
- **Adversarial flagging.** If the same video appears in two athletes' profiles, or if pose confidence drops mid-clip (suggesting splicing), flag and downgrade the tier silently.

### What scouts will _not_ trust

- Single AI numbers without the source clip.
- Stats from videos shorter than the action requires (e.g., a 0.5s "20m sprint" clip).
- Cricket bowling speed from a head-on phone with no scale reference.

Build the system to refuse to compute when it can't compute — never fake a number to show progress.

---

## 6. Recommendation: Phased Rollout

### Phase 1 — AI-Verified Vertical Jump (8 engineer-weeks)

**Why first:** simplest physics (flight time × g / 8 = jump height), single keypoint (hip), 2-second clips, immediate "wow" demo for scouts, validates the entire pipeline.

- **Models**: MediaPipe Pose Landmarker on-device (capture feedback) + ViTPose-Plus-Base on Modal (verification pass).
- **Stat**: jump height in cm with ±1cm band.
- **Integration point**: existing `app/beep-test*.tsx` family already has a Vertical Jump screen; add an "Upload video for AI verification" button that submits to a new Modal worker.
- **Storage**: `videos` bucket (already exists). New columns on `fitness_test_results` per Section 4.
- **UX**: athlete records 5-second clip → instant on-device preview ("looks good, sending for verification") → 20-30 s background processing → push notification ("Jump verified at 52cm — that's the Strong zone!"). Verification tier upgrades from `app_measured` to `ml_verified`.
- **Effort**: 2 weeks model integration, 2 weeks UX + worker, 1 week Supabase plumbing, 1 week QA + adversarial testing, 2 weeks rollout/cohort (Bengaluru pilot).
- **Scout-value impact**: medium. The bigger win is **trust** — every scout asks "how do I know this number is real?", and this answers it for one stat. That answer generalizes.

### Phase 2 — Sprint Speed (20m & 40m) (6 weeks)

- **Models**: same MediaPipe + ViTPose stack. Add audio-clap detection for start (existing `expo-av` mic).
- **Why second**: same code path, second stat upgraded → demonstrates the platform pattern, not a one-off feature.
- **New element**: scale calibration — athlete places two cones (or any two markers) at known distance; user inputs distance once.
- **Integration point**: existing sprint test screens. Same Modal worker; only the "extractor" Python module changes.
- **Effort**: 3 weeks (calibration + audio fusion), 1 week worker, 1 week QA, 1 week rollout.
- **Scout impact**: high. Sprint speed is the single most-asked stat by football and athletics scouts.

### Phase 3 — Cricket Bowling Speed + Shot Type (10 weeks)

- **Models**: pose stack + lightweight ball detector (TrackNet-style, custom-trained on ~500 frames) + VideoMAE fine-tuned on [`rokmr/cricket-shot`](https://hf.co/datasets/rokmr/cricket-shot) for shot type.
- **Integration point**: a new "Cricket Drill" capture in the `Create` tab. Two flows: "Record a delivery" (bowling) and "Record a shot" (batting).
- **Effort**: 4 weeks bowling-speed pipeline (ball detection is the hard part), 3 weeks shot classifier, 1 week schema + UX, 2 weeks pilot with one Bengaluru cricket academy.
- **Scout impact**: very high. Cricket is OnlyKrida's #1 sport and bowling speed is the #1 number scouts care about for fast bowlers. A reliable +/-2 km/h in-app speed gun is a feature people will install the app to use.

### Phase 4+ — Roadmap

- Football match-clip auto-tagging (VideoMAE on uploaded goal clips → adds searchable tags to `posts`).
- Repetition counters (juggling, pushups, sit-ups) using on-device MediaPipe + state machine.
- Kabaddi action recognizer — needs a custom dataset; this is the moat play. Partner with one Pro Kabaddi franchise.
- Athletics: stride length / frequency / acceleration profile from the same sprint clip.
- Pose2Sim "Pro tier" for academies that want lab-grade biomechanics from 2-camera setups.

---

## 7. Risks and Open Questions

### Privacy (urgent — solve before Phase 1 ships)

- **POCSO + DPDP Act (India)**: parental consent required for any biometric data on minors. Pose data plausibly counts.
- **COPPA (US, applies to UAE traffic of US-resident kids)**: April 22, 2026 deadline for full compliance just hit.
- **Mitigations to design in**:
  - Hard age gate at signup; under-18 needs verified parental consent (email + SMS double opt-in).
  - Optional face-blur on public-feed video uploads (keep pose, drop face). Implementation: run a face-detector pre-upload, blur head bbox via FFmpeg before storing in `posts` bucket. Keep raw video in private `videos` bucket only.
  - Retention policy: raw test videos retained ≤90 days then purged; only derived stats persist.
  - "Delete my data" honored across all derived tables (`ml_extractions`, `fitness_test_results.video_url`).

### Compute cost at scale

- At 1M MAU the math is fine ($6K/mo). The risk is **abuse upload** — a single user uploading 200 videos a day. Mitigate with per-day per-user inference quotas and a small charge for excess (or just throttle).
- Reserve GPU on Modal ($200/mo flat) once you cross ~30K verifications/month — break-even vs. on-demand pricing.

### Adversarial uploads

- Athletes will try to fake stats. Mitigations:
  - Detect splicing (pose confidence discontinuities, audio-cut markers).
  - Check video metadata (creation time, geolocation if granted, gyroscope trace consistency with claimed motion).
  - Cross-check against profile baseline: if a 14-year-old's claimed sprint suddenly drops 1.5s, downgrade to `self_reported` and require coach re-verification.
  - Reuse-detection: hash extracted pose sequences; flag if same pose appears across athletes.
  - Only assign the `ml_verified` tier when _all_ signals concord; otherwise leave at `app_measured`.

### Cultural fit & sales narrative

- Indian scouts come from a tradition of "see-it-with-my-own-eyes" trials. AI numbers alone will not move them.
- The pitch is **not** "AI replaces your judgment." It's "**AI gives you a shortlist that's already verified, so your trial day is 10 athletes you actually want to see, not 200**."
- Validate with a real scout in Bengaluru before Phase 1 ships: show them a mocked-up profile with `ml_verified` 27.4 km/h sprint and ask "would you call this athlete in?" If they say no, the format is wrong; iterate the UX.

### Open questions to validate with scouts

- Is the `±` band understood, or do scouts read it as "the AI doesn't know"? (Hypothesis: with the tap-through clip overlay, yes.)
- Does the multiplier scheme (0.85× for ML-verified) feel right or condescending to athletes?
- Which cricket stat — bowling speed or shot variety — gets a scout to call back? (Both are testable in a 30-minute interview.)
- For football: do scouts care more about sprint speed, or about "first-touch under pressure" type qualitative tags?

### Anything you should validate _before_ writing code

1. **One scout, one academy, one Pro Kabaddi team interview** — 90 minutes total — confirms the per-sport priority list.
2. **Legal opinion (1 hour, ₹15-20K)** — POCSO + DPDP scope confirmation for biometric/pose data.
3. **A 3-day BlazePose proof-of-concept on 20 real grassroots clips** — validates that pose works on the actual phone-video quality your athletes upload (not curated stock footage). This is the cheapest, fastest derisking step.

---

## Appendix: Quick model cheat-sheet

| Need                                    | Recommended                                                                                                                                | License            | Where         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------- |
| On-device pose                          | MediaPipe Pose Landmarker (BlazePose)                                                                                                      | Apache-2.0         | mobile        |
| Server pose                             | [`usyd-community/vitpose-plus-base`](https://hf.co/usyd-community/vitpose-plus-base)                                                       | Apache-2.0         | Modal         |
| Cricket shot classification (bootstrap) | [`rokmr/cricket-shot`](https://hf.co/datasets/rokmr/cricket-shot) (data) + VideoMAE-base                                                   | Apache-2.0 + MIT   | Modal         |
| Soccer match action                     | [`anirudhmu/videomae-base-finetuned-soccer-action-recognition`](https://hf.co/anirudhmu/videomae-base-finetuned-soccer-action-recognition) | CC-BY-NC (retrain) | Modal         |
| Soccer player tracking                  | [`julianzu9612/RFDETR-Soccernet`](https://hf.co/julianzu9612/RFDETR-Soccernet)                                                             | Apache-2.0         | Modal         |
| Ball tracking                           | [TrackNet/SBDT, 2311.05237](https://hf.co/papers/2311.05237)                                                                               | Open               | Modal         |
| Repetition counting                     | MediaPipe + Pūioio state machine [2308.02420](https://hf.co/papers/2308.02420)                                                             | Apache-2.0         | mobile        |
| Biomechanics (later)                    | [Sports2D](https://github.com/davidpagnon/Sports2D)                                                                                        | BSD-3              | Modal worker  |
| Cricket data API                        | [Cricsheet](https://cricsheet.org) / [CricketData.org](https://cricketdata.org)                                                            | Free / freemium    | Edge Function |

---

## Addendum: RF-DETR as the default detector

Added after the main report. After reviewing [`roboflow/rf-detr`](https://github.com/roboflow/rf-detr) (ICLR 2026, [arXiv:2511.09554](https://arxiv.org/abs/2511.09554)), it should be promoted to the **default object-detection backbone across the OnlyKrida ML pipeline** — replacing YOLO references in the implementation plan. Three reasons.

### 1. License unlock — this is the headline

The most popular alternative, **YOLO11 / YOLO26, is AGPL-3.0**. AGPL-3.0 obliges source disclosure for any networked use of the model — incompatible with a closed-source mobile + SaaS product. RF-DETR-N through RF-DETR-L are **Apache 2.0** (only the XL / 2XL "Plus" variants are paid PML 1.0, and you don't need them). This is not a marginal preference — it removes a structural commercial-licensing risk. If any vendor pitch leans on YOLO, swap it.

### 2. Accuracy at the same latency

Roboflow's published benchmarks (T4, TensorRT FP16, batch 1):

| Model             | COCO AP<sub>50</sub> | Latency | Params | License    |
| ----------------- | -------------------- | ------- | ------ | ---------- |
| **RF-DETR-N**     | **67.6**             | 2.3 ms  | 30.5 M | Apache 2.0 |
| YOLO11-N          | 52.0                 | 2.5 ms  | 2.6 M  | AGPL-3.0   |
| YOLO26-N          | 55.8                 | 1.7 ms  | 2.6 M  | AGPL-3.0   |
| **RF-DETR-S**     | **72.1**             | 3.5 ms  | 32.1 M | Apache 2.0 |
| YOLO11-S          | 59.7                 | 3.2 ms  | 9.4 M  | AGPL-3.0   |
| **RF-DETR-Seg-N** | 63.0                 | 3.4 ms  | 33.6 M | Apache 2.0 |

15+ AP<sub>50</sub> point gap at comparable latency. The cost is parameter count (RF-DETR-N has 30M vs YOLO11-N's 2.6M) — relevant for _very_ low-end edge devices, but the modal Indian smartphone of 2026 (4–6GB-RAM Android tier) runs 30M-param transformers on-device with INT8 quantization. The **DINOv2 backbone** also transfers strongly to small custom datasets — important because OnlyKrida won't have huge cricket/kabaddi labeled corpora.

### 3. There is already a React Native port

[`software-mansion/react-native-executorch-rfdetr-nano-detector`](https://hf.co/software-mansion/react-native-executorch-rfdetr-nano-detector) — RF-DETR-Nano packaged for PyTorch ExecuTorch with React Native bindings. This is the missing piece for **on-device object detection at capture time**. Pairs naturally with the BlazePose-on-device plan from the main report and means Phase 2 (sprint speed) can give the athlete an instant `±` overlay on their own phone, _without_ a server round-trip.

ONNX exports also exist if the team prefers ONNX Runtime: [`onnx-community/rfdetr_base-ONNX`](https://hf.co/onnx-community/rfdetr_base-ONNX), [`onnx-community/rfdetr_large-ONNX`](https://hf.co/onnx-community/rfdetr_large-ONNX), [`PierreMarieCurie/rf-detr-onnx`](https://hf.co/PierreMarieCurie/rf-detr-onnx).

### Impact on the phased rollout

- **Phase 1 (Vertical Jump)**: no change — pose-only, no detection.
- **Phase 2 (Sprint speed)**: now realistic to run **on-device** via `react-native-executorch-rfdetr-nano-detector` for athlete-bounding-box tracking + BlazePose for joints. Real-time feedback, no server RTT, lower bandwidth bill.
- **Phase 3 (Cricket bowling speed + shot classification)**: fine-tune **RF-DETR-S** (Apache 2.0) on a cricket-ball/bat/stumps dataset (~3–5K labeled frames; Roboflow Universe almost certainly has 30–50% of this already). Pair with the `rokmr/cricket-shot` classifier from the main report.
- **Phase 4 (Football match analytics)**: start from [`julianzu9612/RFDETR-Soccernet`](https://hf.co/julianzu9612/RFDETR-Soccernet) — already in the cheat-sheet. **Verify its provenance and license before adoption** — the model card should explicitly state "fine-tuned from RF-DETR" (not RT-DETR or DETR), and confirm Apache 2.0 inheritance. Same caveat for [`anirudhmu/videomae-base-finetuned-soccer-action-recognition`](https://hf.co/anirudhmu/videomae-base-finetuned-soccer-action-recognition) on line 343, which should also be re-verified before any commitment — neither has been independently checked.
- **Phase 5+ (Kabaddi moat)**: fine-tune RF-DETR-S on the proprietary 2–3K-clip Kabaddi dataset. With Apache 2.0 weights + OnlyKrida's data, the resulting model is wholly yours.

### Cost re-estimate

Main-report cost figures (~\$120/mo at 10K MAU, ~\$800/mo at 100K MAU) used YOLO-class timing. RF-DETR-N at 2.3 ms / RF-DETR-S at 3.5 ms is comparable — expect a **10–20% improvement**, not structural. The bigger savings come from moving Phase 2 detection on-device: every sprint clip processed on the phone is a server inference you don't pay for.

### Action items

1. Update the cheat-sheet below: add `rfdetr-nano` as default on-device detector and `rfdetr-medium` as default server detector, with an explicit "Apache 2.0 (vs YOLO AGPL-3.0)" callout.
2. Before Phase 4, **verify [`julianzu9612/RFDETR-Soccernet`](https://hf.co/julianzu9612/RFDETR-Soccernet)** is actually RF-DETR (not RT-DETR) and inherits Apache 2.0.
3. Add `react-native-executorch-rfdetr-nano-detector` as a third side-track in the 3-day proof-of-concept (alongside BlazePose) — together they cover the full on-device capture pipeline.

---

_End of report. The single most important next step is the 3-day on-device POC: **BlazePose + react-native-executorch-rfdetr-nano-detector** on 20 real OnlyKrida-quality grassroots clips. Until that's done, every other estimate in this document carries a meaningful uncertainty band._
