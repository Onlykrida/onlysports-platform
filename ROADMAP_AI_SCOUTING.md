# OnlyKrida -- AI Scouting & Performance Intelligence Technical Roadmap

**Author**: AI/ML Engineering Lead
**Date**: March 2026
**Version**: 1.0
**Status**: Draft for Founder Review

---

## Executive Summary

OnlyKrida has a functional scouting platform with weighted fit-score matching, scout preferences, video uploads, and a verification ladder (school through professional). This document lays out the 18-month technical roadmap to transform the platform from rule-based matching into a full AI-powered talent discovery engine covering four pillars: intelligent scouting recommendations, automated video analysis, wearable-driven biometric analytics, and predictive career intelligence.

The core thesis: nobody has built AiSCOUT-level technology for Indian sports. Cricket, kabaddi, boxing, wrestling, athletics, hockey, badminton -- these sports have millions of grassroots athletes with zero automated scouting infrastructure. OnlyKrida fills that gap.

---

## Table of Contents

1. [AI Scouting Engine (Phase 1)](#1-ai-scouting-engine-phase-1-months-1-6)
2. [Video Analysis System (Phase 2)](#2-video-analysis-system-phase-2-months-3-9)
3. [Wearable Integration & Biometric Analytics (Phase 3)](#3-wearable-integration--biometric-analytics-phase-3-months-6-12)
4. [Performance Prediction & Career Intelligence (Phase 4)](#4-performance-prediction--career-intelligence-phase-4-months-9-18)
5. [Infrastructure & Data Platform](#5-infrastructure--data-platform)
6. [Team Hiring Roadmap](#6-team-hiring-roadmap)
7. [Competitive Advantage Summary](#7-competitive-advantage-summary)
8. [Quick Wins (Start This Week)](#8-quick-wins-can-start-this-week)

---

## 1. AI Scouting Engine (Phase 1: Months 1-6)

### Current State

The existing system computes a `fit_score` using a simple weighted sum:

```
fit_score = skill * weight_skill + speed * weight_speed + stamina * weight_stamina
```

This is stored in the `ai_recommendations` table alongside a breakdown per dimension. Scout preferences (sport, positions, regions, age range, verification level) act as hard filters before scoring. There is no learning from scout behavior, no collaborative signal, and no personalization beyond stated preferences.

**What works today:**

- Scout preferences capture explicit intent (sport, position, region, age, verification level)
- Weighted scoring provides a deterministic ranking
- Shortlisting system records scout decisions
- Verification levels provide a trust hierarchy

**What is missing:**

- No implicit signal capture (views, dwell time, profile clicks, search patterns)
- No learning from scout behavior over time
- No athlete-to-athlete similarity (collaborative filtering)
- No cold-start handling beyond default weights
- No recommendation diversity or freshness controls
- No feedback loop from scout outcomes to model improvement

### What to Build

#### 1.1 Collaborative Filtering

**Concept**: "Scouts who shortlisted Player A also shortlisted Player B."

Build an interaction matrix where rows are scouts and columns are athletes. Cell values encode interaction strength:

| Interaction               | Weight |
| ------------------------- | ------ |
| Profile view              | 1      |
| Profile view > 10 seconds | 2      |
| Video watched             | 3      |
| Shortlisted               | 5      |
| Message sent              | 7      |
| Contact info requested    | 10     |

**Algorithm progression:**

1. **Month 1-2**: Matrix factorization (ALS via `implicit` library). Fast to train, works with sparse data. Decompose the interaction matrix into scout-latent and athlete-latent factor matrices. Predict missing entries as dot products of latent vectors.
2. **Month 3-4**: Neural Collaborative Filtering (NCF). Replace dot product with a small MLP that learns nonlinear scout-athlete affinity. Use PyTorch with embedding layers for scout IDs and athlete IDs.
3. **Month 5-6**: Sequence-aware model. Use a transformer or GRU to model the scout's session as a sequence of athlete views, predicting the next athlete they will shortlist.

**Handling sparsity**: Indian scouting is inherently sparse -- most scouts interact with a small fraction of athletes. Use Bayesian Personalized Ranking (BPR) loss which only requires positive examples and sampled negatives, avoiding the need to fill in explicit zeros.

#### 1.2 Content-Based Filtering

**Concept**: Match athlete profile features to scout preference features using vector similarity.

**Athlete feature vector** (per athlete):

```python
athlete_vector = [
    sport_embedding,          # Learned embedding for sport (dim=16)
    position_embedding,       # Learned embedding for position (dim=8)
    age_normalized,           # (age - 10) / 25, clipped to [0, 1]
    lat_normalized,           # Latitude normalized
    lon_normalized,           # Longitude normalized
    skill_normalized,         # skill / 100
    speed_normalized,         # speed / 100
    stamina_normalized,       # stamina / 100
    verification_ordinal,     # 0=unverified, 0.2=school, 0.4=district, 0.6=state, 0.8=national, 1.0=professional
    profile_completeness,     # Fraction of optional fields filled
    video_count_log,          # log(1 + video_count)
    days_since_last_active,   # Recency signal
]
```

**Scout preference vector** (per scout):

```python
scout_vector = [
    preferred_sport_embedding,
    preferred_position_embedding,
    preferred_age_center,
    preferred_lat,
    preferred_lon,
    min_skill_threshold,
    min_speed_threshold,
    min_stamina_threshold,
    min_verification_ordinal,
    0.5,                      # Neutral on completeness
    0.5,                      # Neutral on video count
    0.0,                      # Prefer recently active
]
```

**Similarity**: Cosine similarity between athlete vector and scout vector. For categorical features (sport, position), learn embeddings during model training so that "football midfielder" is closer to "football winger" than to "cricket batsman."

**Annoy/FAISS index**: Pre-compute athlete vectors nightly. Build an approximate nearest neighbor index (FAISS IVF-PQ or Annoy) for sub-millisecond retrieval of top-K candidates per scout.

#### 1.3 Hybrid Model

Combine collaborative and content-based scores with a learned blending weight:

```
final_score = alpha * collaborative_score + (1 - alpha) * content_score
```

**Alpha learning**: Start with alpha=0.3 (favor content when data is sparse). As interaction data grows, train a logistic regression on `(collaborative_score, content_score, context_features)` to predict shortlist probability. The model learns the optimal blend per context.

**Re-ranking layer**: After scoring, apply diversity controls:

- Maximum 3 athletes from the same city in a top-20 list
- At least 2 verification levels represented
- At least 2 positions represented (if scout has no strict position filter)
- Freshness boost for athletes who updated profiles in the last 7 days

#### 1.4 Cold Start Strategy

| Scenario                     | Approach                                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| New athlete, no interactions | Content-based only. Rank by profile similarity to scout preferences. Boost athletes with video uploads and higher verification.         |
| New scout, no interactions   | Use stated preferences (already captured in scout-preferences). Content-based matching. After 10+ interactions, blend in collaborative. |
| New athlete, new scout       | Pure content matching. This is where the existing fit_score logic lives -- keep it as the baseline.                                     |
| Returning scout, stale data  | Decay old interactions with half-life of 30 days. Recent behavior matters more.                                                         |

#### 1.5 Tech Stack

```
Supabase (PostgreSQL)
    |
    | CDC (Change Data Capture via Supabase Realtime / pg_notify)
    v
Event Collector (FastAPI on Cloud Run)
    |
    | Writes to
    v
Feature Store (Redis for real-time features + Supabase table for batch features)
    |
    | Read by
    v
Training Pipeline (Python, runs nightly on Modal.com)
    - scikit-learn (Month 1-2: ALS, logistic regression)
    - PyTorch (Month 3+: NCF, sequence models)
    - MLflow for experiment tracking and model registry
    |
    | Publishes model artifacts to
    v
Model Registry (MLflow on Cloud Run or S3-compatible storage)
    |
    | Loaded by
    v
Inference Service (FastAPI on Cloud Run, auto-scaled)
    - /recommend?scout_id=xxx → top 50 athletes with scores
    - /similar?athlete_id=xxx → top 20 similar athletes
    - Response cached in Redis (TTL: 1 hour, invalidated on new interaction)
    |
    | Results written to
    v
Supabase: ai_recommendations table (updated periodically + on-demand)
    |
    | Read by
    v
React Native App (existing)
```

**Why FastAPI over Supabase Edge Functions for ML**: Edge Functions (Deno-based) are great for lightweight logic but lack Python ML library support. Use Edge Functions only for the thin caching/routing layer. Heavy inference stays in Python on Cloud Run.

**Redis usage**:

- Cache top-50 recommendations per scout (key: `recs:{scout_id}`, TTL: 1 hour)
- Cache athlete feature vectors (key: `athlete:{id}:features`, TTL: 24 hours)
- Rate limit recommendation refresh requests

#### 1.6 Data Pipeline

```
Supabase PostgreSQL
    |
    | Logical replication / pg_dump (nightly)
    v
Staging Database (Cloud SQL or Supabase secondary)
    |
    | dbt models
    v
Feature Tables:
    - fct_scout_interactions (scout_id, athlete_id, interaction_type, timestamp, duration)
    - dim_athletes (athlete_id, sport, position, age, location, stats, verification, profile_completeness)
    - dim_scouts (scout_id, organization, preferences, signup_date)
    - fct_interaction_matrix (scout_id, athlete_id, interaction_weight) -- aggregated
    |
    | Read by training pipeline
    v
Model Training (Modal.com, nightly cron)
    |
    | Writes predictions
    v
Supabase: ai_recommendations (scout_id, athlete_id, fit_score, breakdown, model_version, generated_at)
```

**dbt models** (key transforms):

- `stg_interactions`: Deduplicate and sessionize raw events
- `int_interaction_weights`: Apply interaction-type weights and time decay
- `fct_interaction_matrix`: Pivot into scout x athlete matrix
- `int_athlete_features`: Normalize stats, compute derived features
- `fct_training_dataset`: Join interactions with features, split train/val/test by time

#### 1.7 API Endpoints

```
POST /api/v1/events/track
  Body: { scout_id, athlete_id, event_type, metadata, timestamp }
  → Writes to interaction log, updates Redis counters

GET /api/v1/recommendations/{scout_id}
  Query: ?limit=20&offset=0&sport=cricket&min_verification=district
  → Returns ranked athlete list with scores and breakdown
  → Cache hit: <5ms, Cache miss: <100ms

GET /api/v1/similar/{athlete_id}
  Query: ?limit=10
  → Returns similar athletes (content-based similarity)

POST /api/v1/recommendations/{scout_id}/feedback
  Body: { athlete_id, action: "dismiss" | "not_relevant" | "already_known" }
  → Negative signal for model improvement

GET /api/v1/recommendations/{scout_id}/explain/{athlete_id}
  → Returns human-readable explanation: "Recommended because: similar position to 3 athletes you shortlisted, high skill rating (92), located in your preferred region (Maharashtra)"
```

### Team Needed

| Role              | Type                      | Key Skills                                                                      | Month   |
| ----------------- | ------------------------- | ------------------------------------------------------------------------------- | ------- |
| ML Engineer       | Full-time                 | Recommendation systems, Python, PyTorch, collaborative filtering, production ML | Month 1 |
| Data Engineer     | Full-time                 | dbt, SQL, pipeline orchestration, Supabase/PostgreSQL, Redis                    | Month 1 |
| Backend Developer | Part-time (existing team) | FastAPI, Cloud Run deployment, API design                                       | Month 1 |

### Success Metrics

| Metric                                          | Target     | How to Measure                                                        |
| ----------------------------------------------- | ---------- | --------------------------------------------------------------------- |
| Scout click-through rate on recommendations     | >15%       | `(profile views from recs) / (recommendations shown)`                 |
| Time-to-first-shortlist for new scouts          | <5 minutes | Time from first login to first shortlist action                       |
| Recommendation diversity (Intra-List Diversity) | >0.4       | Average pairwise distance of recommended athletes                     |
| Precision@10                                    | >0.25      | Fraction of top-10 recs that get shortlisted                          |
| Coverage                                        | >60%       | Fraction of active athletes who appear in at least one scout's top-50 |
| Model latency (p95)                             | <100ms     | End-to-end recommendation request time                                |
| Recommendation freshness                        | <2 hours   | Time from new athlete signup to appearing in relevant recs            |

### Milestones

- **Month 1**: Interaction event tracking live in production. dbt pipeline running nightly.
- **Month 2**: Content-based model v1 deployed. A/B test against current weighted scoring.
- **Month 3**: Collaborative filtering model v1 (ALS) trained on accumulated data. Hybrid blending.
- **Month 4**: NCF model, explanation API, feedback collection.
- **Month 5**: Sequence-aware model. Diversity re-ranking. Cold-start improvements.
- **Month 6**: Full A/B test results. Model monitoring dashboard. Automated retraining pipeline.

---

## 2. Video Analysis System (Phase 2: Months 3-9)

### The Vision

An athlete uploads a 30-second highlight clip from their phone. Within 2-5 minutes, the system automatically:

1. Detects the sport being played
2. Tags key moments (goals, tackles, sprints, serves, punches, wickets, dives)
3. Extracts performance metrics (sprint speed estimate, reaction time, technique score)
4. Generates a "highlight score" that scouts can filter and sort by

This is the feature that turns OnlyKrida from a database into an intelligence platform. Scouts currently watch raw untagged video. Automated tagging saves them hours and surfaces athletes who might otherwise be overlooked.

### Architecture

```
Athlete Phone (Expo)
    |
    | expo-image-picker (video, max 60s, 1080p)
    v
Supabase Storage (video bucket)
    |
    | Database webhook on INSERT to video_highlights table
    v
Cloud Function Trigger (Supabase Edge Function)
    |
    | Enqueues job
    v
Job Queue (Redis / Cloud Tasks)
    |
    | Picked up by
    v
Video Processing Pipeline (Cloud Run Jobs / Modal.com)
    |
    |--> Step 1: Transcode & Normalize
    |      FFmpeg: 720p, 30fps, H.264, max 60s
    |      Extract keyframes at 1fps for classification
    |
    |--> Step 2: Sport Detection
    |      Input: 5 evenly-spaced keyframes
    |      Model: Fine-tuned EfficientNet-B0
    |      Output: sport label + confidence
    |
    |--> Step 3: Action Recognition
    |      Input: Full video (subsampled to 16-32 frames)
    |      Model: SlowFast R50 or TimeSformer-B
    |      Output: Temporal action segments with labels
    |
    |--> Step 4: Pose Estimation
    |      Input: Full video (every frame or every 3rd frame)
    |      Model: MediaPipe Pose (33 landmarks) or MoveNet Thunder
    |      Output: Per-frame 2D/3D keypoints
    |
    |--> Step 5: Sport-Specific Metric Extraction
    |      Input: Pose sequences + action segments
    |      Logic: Sport-specific analysis modules
    |      Output: Derived metrics (speed, technique, etc.)
    |
    |--> Step 6: Highlight Scoring
    |      Input: All extracted features
    |      Model: Trained regressor or rule-based scoring
    |      Output: highlight_score (0-100)
    |
    v
Results written to Supabase:
    - video_analysis table (video_id, sport_detected, confidence, highlight_score, processing_status)
    - video_moments table (video_id, timestamp_start, timestamp_end, action_label, confidence)
    - video_metrics table (video_id, metric_name, metric_value, unit)
    - video_pose_data table (video_id, frame_number, keypoints_json) -- optional, large
    |
    v
App displays: auto-tags, key moments timeline, metrics, highlight score
Scouts can filter athletes by highlight_score, view auto-tagged moments
```

### Models and Approaches

#### 2.1 Sport Detection

**Problem**: Given a short video clip, classify which sport is being played.

**Approach**: Image classification on keyframes. Sports have distinctive visual contexts (cricket pitch, football field, boxing ring, kabaddi mat, athletics track).

**Model**: EfficientNet-B0, fine-tuned on sport classification.

**Training data sources**:

- YouTube sports clips (use `yt-dlp` to download, extract frames)
- Existing OnlyKrida video uploads (manually labeled)
- SportsDB and UCF-Sports datasets (academic)
- Manual collection from Indian sports broadcasts

**Target sport taxonomy (Phase 1)**:
| Sport | Subcategories |
|---|---|
| Cricket | Batting, Bowling, Fielding |
| Football | Match play, Training drill |
| Kabaddi | Match play, Training |
| Boxing | Sparring, Bag work, Shadow boxing |
| Athletics | Sprint, Long distance, Throws, Jumps |
| Wrestling | Match, Training |
| Hockey | Match play, Training |
| Badminton | Match play, Training |
| Swimming | Race, Training |
| Other / Unknown | Fallback |

**Training recipe**:

```python
# Pseudo-code
model = EfficientNet.from_pretrained("efficientnet-b0")
model.classifier = nn.Linear(1280, num_sports)

# Data augmentation critical for phone-recorded videos:
# - Random crop, rotation, color jitter
# - Simulate low-light (Indian sports grounds often have poor lighting)
# - Simulate phone camera artifacts (motion blur, compression)

# Training: ~5000 images per sport, 80/10/10 split
# Expected accuracy: >90% on well-lit clips, ~75% on poor quality
```

**Minimum viable dataset**: 500 labeled images per sport (8 sports = 4,000 images). Can reach this in 2 weeks with 2 annotators.

#### 2.2 Action Recognition

**Problem**: Detect and temporally localize actions within a video (e.g., "bowling delivery at 0:05-0:08", "tackle at 0:15-0:17").

**Approach**: Temporal action detection using a two-stage process:

1. **Clip-level classification**: SlowFast network classifies short segments (2-4 seconds)
2. **Temporal localization**: Sliding window + NMS to find action boundaries

**Model**: SlowFast R50, pre-trained on Kinetics-400.

**Fine-tuning strategy**:

- Kinetics-400 covers generic actions (running, jumping, throwing, kicking)
- Fine-tune on sport-specific actions with Indian context:
  - Cricket: front-foot drive, pull shot, yorker delivery, diving catch, run-out throw
  - Football: dribble, pass, shot, tackle, header, save
  - Kabaddi: raid, ankle hold, thigh hold, bonus point attempt, super raid
  - Boxing: jab, cross, hook, uppercut, slip, block
  - Athletics: start, stride, finish, takeoff, landing

**Action label taxonomy** (start with top 5 actions per sport, expand over time):

```
cricket.batting.drive
cricket.batting.pull
cricket.batting.defense
cricket.bowling.pace_delivery
cricket.bowling.spin_delivery
cricket.fielding.catch
cricket.fielding.run_out

football.attack.shot
football.attack.dribble
football.attack.pass
football.defense.tackle
football.defense.interception
football.goalkeeping.save

kabaddi.raid.touch
kabaddi.raid.bonus
kabaddi.defense.ankle_hold
kabaddi.defense.thigh_hold
kabaddi.defense.chain_tackle

boxing.offense.jab
boxing.offense.cross
boxing.offense.hook
boxing.offense.uppercut
boxing.defense.slip
boxing.defense.block

athletics.sprint.start
athletics.sprint.stride
athletics.sprint.finish
athletics.throw.release
athletics.jump.takeoff
```

**Annotation tool**: Use CVAT (Computer Vision Annotation Tool, open source) for temporal annotation. Athletes who are part-time annotators can label their own sport's footage -- they understand the actions intimately.

#### 2.3 Pose Estimation

**Problem**: Extract body keypoints from video frames for biomechanical analysis.

**Model choice**:

- **MediaPipe Pose**: 33 landmarks, runs on-device, fast, good accuracy. Use for real-time preview (future feature) and as primary pipeline model.
- **MoveNet Thunder**: 17 keypoints, higher accuracy for single-person, slightly slower. Use when MediaPipe fails on complex poses.
- **ViTPose** (fallback): State-of-the-art but heavier. Use for offline high-accuracy analysis.

**Pipeline**:

```
Video frames → Person detection (if multiple people) →
  Single-person crop → Pose model →
  33 keypoints (x, y, z, visibility) per frame →
  Temporal smoothing (1-Euro filter) →
  Stored as JSON array per frame
```

**Sport-specific biomechanical analysis modules**:

**Cricket bowling action analysis**:

```python
def analyze_bowling_action(pose_sequence):
    """
    Analyzes bowling action from pose keypoints.
    Returns: arm_angle_at_release, front_foot_landing_angle,
             back_arch_degree, follow_through_completeness,
             suspected_chuck (elbow extension > 15 degrees = illegal)
    """
    # Key frames: gather, bound, front_foot_landing, release, follow_through
    # Measure elbow angle through delivery stride
    # Compare against ICC 15-degree rule
    # Score technique similarity to reference templates
```

**Cricket batting stance analysis**:

```python
def analyze_batting_stance(pose_sequence):
    """
    Analyzes batting technique from pose keypoints.
    Returns: backlift_height, head_position_stability,
             weight_transfer_score, follow_through_arc
    """
    # Detect stance phase, backlift, downswing, contact, follow-through
    # Head position should remain stable through shot
    # Weight transfer from back foot to front foot
```

**Football sprint form**:

```python
def analyze_sprint_form(pose_sequence):
    """
    Returns: knee_drive_angle, arm_swing_symmetry,
             forward_lean_angle, stride_frequency,
             ground_contact_pattern
    """
    # Optimal knee drive: thigh parallel to ground at peak
    # Forward lean: 45 degrees during acceleration, upright at top speed
    # Arm swing: symmetric, 90-degree elbow angle
```

**Boxing guard and punch mechanics**:

```python
def analyze_boxing_technique(pose_sequence):
    """
    Returns: guard_height_consistency, jab_extension_speed,
             hip_rotation_on_cross, head_movement_score
    """
    # Guard: hands at chin level, elbows tight
    # Jab: full extension, snap back, shoulder rotation
    # Cross: hip rotation drives power, full weight transfer
```

#### 2.4 Speed and Distance Estimation

**Problem**: Estimate real-world speed from video without specialized equipment.

**Approach 1 -- Reference-based homography**:

- If the video contains known reference geometry (cricket pitch = 20.12m, football penalty area = 16.5m x 40.32m, kabaddi court = 13m x 10m, athletics lane width = 1.22m):
  1. Detect reference lines/markings using edge detection + Hough transform
  2. Compute homography matrix mapping image coordinates to real-world coordinates
  3. Track athlete position across frames using pose centroid
  4. Compute displacement in real-world coordinates per frame interval
  5. Derive speed = displacement / time

**Approach 2 -- Relative estimation (no reference)**:

- Use athlete body proportions as reference (average heights by age/gender from Indian population data)
- Estimate stride length from pose keypoints
- Compute stride frequency from temporal analysis
- Speed estimate = stride length x stride frequency
- Less accurate but works for any video

**Expected accuracy**:

- With reference geometry: +/- 5-10% of actual speed
- Without reference: +/- 15-25% of actual speed
- Always show as "estimated" with confidence band in the UI

#### 2.5 Technique Scoring

**Concept**: Compare an athlete's pose sequence during an action to "ideal form" reference templates from professional athletes.

**Method**: Dynamic Time Warping (DTW) on normalized pose sequences.

```python
def technique_score(athlete_poses, reference_poses):
    """
    Compare athlete's action to professional reference.

    1. Normalize both sequences (center on hip, scale by torso length)
    2. Align temporally using DTW
    3. Compute per-joint angular deviation
    4. Weight joints by sport-specific importance
       (e.g., elbow angle matters more for bowling, knee drive for sprinting)
    5. Return score 0-100 (100 = identical to reference)
    """
    normalized_athlete = normalize_pose_sequence(athlete_poses)
    normalized_reference = normalize_pose_sequence(reference_poses)

    alignment = dtw_align(normalized_athlete, normalized_reference)

    joint_deviations = compute_angular_deviations(alignment)
    sport_weights = get_sport_joint_weights(sport, action)

    raw_score = weighted_mean(joint_deviations, sport_weights)
    technique_score = max(0, 100 - raw_score * scaling_factor)

    return technique_score, joint_deviations  # breakdown for feedback
```

**Reference templates**: Collect from professional athlete footage (publicly available match broadcasts, training videos). 5-10 reference examples per action type, use the median as the template.

**Athlete feedback**: Show a visual overlay comparing their pose to the ideal. "Your elbow angle at release is 22 degrees -- optimal is 12-15 degrees." This makes OnlyKrida a training tool, not just a scouting tool.

#### 2.6 Highlight Scoring

**Formula** (initial rule-based, later learned):

```python
highlight_score = (
    0.25 * action_density_score +      # More key actions per minute = better highlight
    0.25 * technique_score_avg +        # Average technique quality across detected actions
    0.20 * video_quality_score +        # Resolution, stability, lighting
    0.15 * action_variety_score +       # Shows range of skills
    0.15 * peak_moment_score            # Best single action quality
)
```

**Video quality score** (computed from raw video metadata + basic CV):

- Resolution factor: 1080p=1.0, 720p=0.8, 480p=0.5
- Stability: Optical flow variance (lower = more stable)
- Lighting: Mean brightness + contrast ratio
- Framing: Is the athlete centered and visible? (Use pose detection -- if keypoints are frequently off-screen, score drops)

### Progressive Rollout

#### Month 3-4: Sport Auto-Detection + Basic Moment Tagging

**Deliverables**:

- Sport classification model deployed (8 sports)
- Video processing pipeline operational (upload -> transcode -> classify -> store results)
- Basic UI: Sport tag shown on video card, confidence indicator
- Manual correction UI: Athlete can fix sport if model is wrong (generates training data)
- Processing status indicator: "Analyzing your video..." -> "Analysis complete"

**Data collection**: Every upload generates training data. Athlete-confirmed sport labels are gold labels.

#### Month 5-6: Pose Estimation + Technique Visualization

**Deliverables**:

- Pose estimation running on all new video uploads
- Technique visualization: Overlay skeleton on key frames (exportable as image/GIF)
- Sport-specific analysis for cricket (bowling, batting) and football (sprint, shot)
- Technique comparison screen: Side-by-side with reference athlete
- Basic metrics: Estimated stride frequency, arm angles, body alignment scores

#### Month 7-9: Automated Metric Extraction + Highlight Scoring

**Deliverables**:

- Full action recognition for all 8 sports
- Automated highlight scoring on all videos
- Scout-facing filter: Sort athletes by highlight score
- Moment timeline: Scrubber with tagged action points
- Speed estimation (where reference geometry is available)
- Technique scoring with per-joint feedback
- Video comparison tool: Scout can compare two athletes' technique side-by-side

### Team Needed

| Role                     | Type                   | Key Skills                                                        | Month   |
| ------------------------ | ---------------------- | ----------------------------------------------------------------- | ------- |
| Computer Vision Engineer | Full-time              | PyTorch, video understanding, pose estimation, action recognition | Month 3 |
| ML Engineer (Video)      | Full-time              | Model training, SlowFast/TimeSformer, deployment, optimization    | Month 3 |
| Data Annotators          | Part-time (2-3 people) | Sports knowledge, CVAT annotation tool, video labeling            | Month 3 |
| Cloud/DevOps             | Part-time (existing)   | Cloud Run Jobs, GPU provisioning, FFmpeg pipelines                | Month 3 |

**Data annotator strategy**: Recruit from the OnlyKrida athlete community. Athletes who know their sport can label actions with far higher accuracy than generic annotators. Pay per annotation task. Side benefit: engaged community members who feel ownership.

### Compute Budget

| Component                | Monthly Cost   | Notes                                                            |
| ------------------------ | -------------- | ---------------------------------------------------------------- |
| Training GPU (A100 80GB) | $300-600       | ~20 hours/month on Modal.com or Lambda Cloud                     |
| Inference GPU (T4/L4)    | $200-400       | Serverless GPU via Modal or Replicate, scales with upload volume |
| Video storage (Supabase) | $100-200       | ~50GB/month growing                                              |
| FFmpeg transcoding (CPU) | $50-100        | Cloud Run Jobs                                                   |
| **Total**                | **$650-1,300** | Scales linearly with video volume                                |

### Key Insight

AiSCOUT (acquired by Burnley FC, now used by multiple Premier League clubs) proved that AI video analysis works for football scouting. HUDL and Wyscout provide video platforms but with manual tagging. Nobody has built automated video analysis for cricket, kabaddi, boxing, wrestling, or athletics. In India, where millions of athletes have smartphones but no access to professional scouting infrastructure, automated video analysis is a category-defining feature. The first-mover advantage is massive because the labeled dataset you build becomes an irreplaceable moat.

---

## 3. Wearable Integration & Biometric Analytics (Phase 3: Months 6-12)

### Data Sources

#### Tier 1: Native Platform APIs (Highest Priority)

| Platform              | API                        | Key Metrics                                                                 | India Relevance                    |
| --------------------- | -------------------------- | --------------------------------------------------------------------------- | ---------------------------------- |
| Apple HealthKit       | iOS HealthKit SDK          | Heart rate, VO2 max, distance, calories, workout detection, HRV, resting HR | ~30% of OnlyKrida users (estimate) |
| Google Health Connect | Android Health Connect API | Heart rate, distance, calories, workout sessions, sleep, exercise routes    | ~65% of OnlyKrida users            |

**Health Connect is the linchpin for India.** Most Indian athletes use Android. Health Connect is the unified API that aggregates data from all Android health apps and wearables. One integration covers dozens of devices.

#### Tier 2: Direct Wearable APIs

| Brand           | API                        | Key Metrics                                                                      | India Market              |
| --------------- | -------------------------- | -------------------------------------------------------------------------------- | ------------------------- |
| Garmin          | Garmin Connect API (OAuth) | Advanced running dynamics, training load, VO2 max, body battery, training status | Growing fitness market    |
| Fitbit (Google) | Fitbit Web API             | Heart rate zones, SpO2, sleep stages, Active Zone Minutes                        | Established but declining |
| Samsung Health  | Health Connect (Android)   | Heart rate, SpO2, body composition, stress                                       | Galaxy Watch users        |

#### Tier 3: India-Specific Budget Wearables

| Brand            | Connectivity             | Estimated User Base | Integration Path                    |
| ---------------- | ------------------------ | ------------------- | ----------------------------------- |
| Noise (NoiseFit) | Health Connect (partial) | 15M+ devices sold   | Via Health Connect on Android       |
| Fire-Boltt       | Health Connect (partial) | 10M+ devices sold   | Via Health Connect on Android       |
| boAt             | Health Connect (limited) | 8M+ devices sold    | Via Health Connect, limited metrics |
| Titan/Fastrack   | Proprietary app          | 5M+                 | No API -- may need partnership      |

**Key insight**: Noise, Fire-Boltt, and boAt collectively dominate the INR 1,500-5,000 wearable market in India. These devices sync heart rate, steps, sleep, and workout data to their companion apps, which increasingly support Android Health Connect. By integrating Health Connect, OnlyKrida automatically supports the wearables most Indian athletes actually own.

**Limitation**: Budget wearables have lower sensor accuracy than Apple Watch or Garmin. Heart rate may be +/- 10 BPM. VO2 max estimates are rough. Account for this in analytics by showing confidence intervals and not over-promising precision.

#### Tier 4: Professional GPS Trackers (Future)

| Device                | Use Case                        | Integration                          |
| --------------------- | ------------------------------- | ------------------------------------ |
| Catapult / STATSports | Academy-level football, cricket | API available, needs B2B partnership |
| PlayerTek             | Youth football                  | Catapult subsidiary, same API        |

These are relevant for OnlyKrida's academy and institutional scout tiers -- not individual athletes.

### Architecture

```
Wearable Device
    |
    | Bluetooth/WiFi sync
    v
Companion App (Noise, Garmin, Apple Health, etc.)
    |
    | Writes to
    v
Health Platform (Apple HealthKit / Android Health Connect)
    |
    | Read by OnlyKrida app (background sync)
    v
OnlyKrida Mobile App (React Native / Expo)
    |
    | Expo HealthKit module (iOS) / Health Connect module (Android)
    | Background sync every 4 hours + manual sync button
    v
Supabase
    - wearable_workouts table (athlete_id, source, workout_type, start_time, end_time, metrics_json)
    - wearable_daily_summary table (athlete_id, date, steps, active_minutes, resting_hr, hrv, sleep_hours)
    - wearable_heart_rate table (athlete_id, timestamp, bpm, source) -- granular, time-series
    |
    | Read by analytics pipeline
    v
Analytics Service (FastAPI on Cloud Run)
    |
    |--> Training Load Calculator
    |--> Recovery Score Calculator
    |--> Readiness Indicator
    |--> Fitness Profile Generator (for scouts)
    |--> Injury Risk Flagging
    |
    v
Results stored in Supabase:
    - athlete_training_load table (athlete_id, date, acute_load, chronic_load, acwr, load_status)
    - athlete_fitness_profile table (athlete_id, vo2_max_est, resting_hr_avg, training_consistency, recovery_score)
```

### What Athletes See

#### Training Load Dashboard

**Acute:Chronic Workload Ratio (ACWR)**:

- Acute load = rolling 7-day training load (sum of session RPE x duration, or HR-based TRIMP)
- Chronic load = rolling 28-day average weekly load
- ACWR = acute / chronic
- **Sweet spot**: 0.8 - 1.3 (safe training zone)
- **Danger zone**: > 1.5 (injury risk spikes)
- **Undertrained**: < 0.6 (fitness declining)

```
Training Load Graph:

Load |     ***
     |   **   **
     |  *       *                    ****
     | *         ***              ***
     |*             ***        ***
     |                 ********
     +---------------------------------> Time
       W1   W2   W3   W4   W5   W6

ACWR: 1.1 (Optimal - Keep Going)
[============================|==========]
  Undertrained    Optimal     Overreaching
```

#### Sport-Specific Performance Metrics

| Sport             | Wearable-Derived KPIs                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| Running/Athletics | Pace zones (easy/tempo/threshold/interval), weekly mileage, VO2 max trend, cadence, estimated race times           |
| Football          | Distance per session, sprint count (>20 km/h), high-intensity minutes (>80% HR max), session load                  |
| Cricket           | Training hours per week, bowling workload (estimated from session count + duration), high-intensity ratio          |
| Boxing            | Rounds per session (estimated from HR pattern: high-low-high = round-rest-round), peak HR, recovery between rounds |
| Kabaddi           | Session intensity (avg HR as % of max), training frequency, high-intensity bout duration                           |
| Swimming          | Estimated distance (if GPS-enabled pool sessions), session duration, avg HR                                        |

#### Recovery Score (0-100)

```python
def compute_recovery_score(athlete_data):
    """
    Based on sports science literature (Buchheit, 2014).
    """
    resting_hr_score = score_vs_baseline(
        current=athlete_data.morning_resting_hr,
        baseline=athlete_data.resting_hr_7day_avg,
        worse_direction="higher"
    )  # Higher resting HR = worse recovery

    hrv_score = score_vs_baseline(
        current=athlete_data.morning_hrv,
        baseline=athlete_data.hrv_7day_avg,
        worse_direction="lower"
    )  # Lower HRV = worse recovery

    sleep_score = min(100, (athlete_data.sleep_hours / 8.0) * 100)

    training_load_score = 100 - max(0, (athlete_data.acwr - 1.3) * 100)

    recovery_score = (
        0.30 * resting_hr_score +
        0.30 * hrv_score +
        0.25 * sleep_score +
        0.15 * training_load_score
    )

    return round(recovery_score)
```

**Display**:

- 80-100: "Fully recovered. Ready for intense training."
- 60-79: "Moderately recovered. Normal training OK."
- 40-59: "Fatigue detected. Consider lighter session."
- 0-39: "High fatigue. Rest day recommended."

#### Readiness Indicator

Simple traffic-light system shown on the athlete's daily home screen:

- **Green**: Recovery score > 70, ACWR 0.8-1.3, slept > 7 hours
- **Yellow**: Recovery score 50-70, or ACWR 1.3-1.5, or slept 5-7 hours
- **Red**: Recovery score < 50, or ACWR > 1.5, or slept < 5 hours

### What Scouts See

#### Fitness Profile Card (on Athlete Profile)

```
Fitness Profile                    [Verified by wearable data]
---------------------------------------------------------
VO2 Max (estimated):     42 ml/kg/min  [Average for age]
Resting Heart Rate:      58 bpm        [Good]
Training Consistency:    87%           [Excellent - trained 26/30 days]
Avg Weekly Load:         4.2 hours     [Above average for age group]
Recovery Discipline:     73/100        [Good sleep, regular rest days]
---------------------------------------------------------
Training Load (8 weeks):
  [Graph showing consistent upward trend with proper periodization]

Recent Activity:
  - Yesterday: Football training, 90 min, high intensity
  - 2 days ago: Gym session, 60 min, moderate
  - 3 days ago: Football match, 95 min, very high intensity
```

**Why scouts care**:

1. **Training consistency** tells scouts if the athlete is serious and disciplined
2. **Workload history** shows preparation level and fitness base
3. **Recovery discipline** indicates maturity and professionalism
4. **Wearable verification** means the data is objective -- athletes cannot fake it

#### Injury Risk Flags

If an athlete's ACWR exceeds 1.5 for more than 3 consecutive days, scouts see a yellow flag: "Training load spike detected -- elevated injury risk." This is a real concern for scouts evaluating recruitment decisions.

If ACWR exceeds 2.0, a red flag: "Significant overtraining indicator. Monitor closely."

These flags are based on published research (Gabbett, 2016: the ACWR and injury relationship in team sports).

### Implementation Timeline

#### Month 6-7: Platform Integration

**Deliverables**:

- React Native module for Apple HealthKit (iOS) reading workout and health data
- React Native module for Android Health Connect reading workout and health data
- Background sync service: Sync new data every 4 hours
- Permission flow: Clear explanation of what data is collected and why, with granular opt-in
- Data storage schema in Supabase (workouts, daily summaries, heart rate time-series)
- Manual sync button + last sync timestamp display
- Basic workout history view in the app

**Technical considerations**:

- HealthKit requires `NSHealthShareUsageDescription` in Info.plist
- Health Connect requires declaring read permissions in Android manifest
- Both require explicit user consent with clear data usage explanation
- Data stays on Supabase (encrypted at rest), never shared with third parties without consent
- GDPR/India DPDP Act compliance: Athletes can delete their wearable data at any time

#### Month 8-9: Training Load Algorithm + Athlete Dashboard

**Deliverables**:

- ACWR calculation running as nightly batch job
- Training load graph in athlete profile (weekly/monthly views)
- Recovery score calculation (morning resting HR + HRV + sleep)
- Readiness indicator (green/yellow/red)
- Sport-specific metric derivation (first for running and football)
- Push notifications: "Your training load is in the danger zone. Consider a rest day."

#### Month 10-12: Scout-Visible Profiles + Advanced Analytics

**Deliverables**:

- Fitness profile card on scout-visible athlete profiles
- Training consistency score (publicly visible)
- Injury risk flags for scouts
- Wearable-verified badge (athlete has connected a wearable and has 30+ days of data)
- Comparative analytics: "This athlete's VO2 max is in the top 15% for their age and sport"
- Historical trends: 3-month and 6-month fitness trajectory graphs

### Team Needed

| Role                              | Type                 | Key Skills                                                                              | Month   |
| --------------------------------- | -------------------- | --------------------------------------------------------------------------------------- | ------- |
| Mobile Developer (Native Modules) | Full-time            | iOS HealthKit, Android Health Connect, React Native native modules, Expo config plugins | Month 6 |
| Data Scientist                    | Full-time            | Sports science, time-series analysis, training load models, Python                      | Month 6 |
| Sports Science Advisor            | Part-time consultant | PhD in sports science or performance analyst at academy/national level                  | Month 6 |

**Sports science advisor role**: Validates training load algorithms, reviews injury risk thresholds, ensures metric interpretations are scientifically sound, helps design athlete-facing content about what the metrics mean.

### India-Specific Considerations

1. **Android first**: ~70% of Indian smartphone users are on Android. Prioritize Health Connect over HealthKit.

2. **Budget wearable accuracy**: Heart rate from Noise/Fire-Boltt can be +/- 10-15 BPM during exercise (vs +/- 3-5 for Apple Watch). Display metrics with appropriate confidence: "Heart rate: ~145 BPM" not "Heart rate: 145 BPM."

3. **Data connectivity**: Many training grounds in India have poor network coverage. Cache wearable data locally and sync when connectivity is available. Use Expo's NetInfo to detect connectivity and queue uploads.

4. **Battery concerns**: Background sync should be battery-efficient. Use Health Connect's change notifications (Android) rather than polling. On iOS, use HealthKit's background delivery.

5. **Privacy and cultural sensitivity**: Some athletes (especially female athletes from conservative families) may be hesitant to share health data. Make wearable integration completely optional with clear privacy controls. Never penalize athletes who do not share wearable data in recommendations.

---

## 4. Performance Prediction & Career Intelligence (Phase 4: Months 9-18)

### Models to Build

#### 4.1 Breakout Prediction

**Question**: "What is the probability that this athlete reaches the next verification level within 12 months?"

**Input features**:

```
Static: age, gender, sport, position, current_verification_level, years_in_sport
Stats trajectory: skill_trend_6mo, speed_trend_6mo, stamina_trend_6mo (slope of linear regression on monthly measurements)
Wearable: avg_weekly_training_hours, training_consistency_90d, vo2_max_trend, acwr_avg
Video: highlight_score_trend, technique_score_trend, action_diversity
Engagement: profile_completeness, video_upload_frequency, scout_interest_count_30d
```

**Target**: Binary classification -- did the athlete reach the next verification level within 12 months?

**Model**: Gradient-boosted trees (XGBoost or LightGBM) initially. These work well with mixed feature types and limited data. Transition to neural network when dataset exceeds 50K examples.

**Training data**: Historical verification level progressions. For athletes who have been on the platform 12+ months, label whether they progressed. For athletes who progressed faster, label as positive at the actual progression time.

**Output**: Probability score (0-100%) shown as "Breakout Potential" on the athlete profile.

**Calibration**: Use Platt scaling to ensure that a "70% breakout probability" actually means ~70% of athletes with that score progress. Plot reliability curves to validate.

**Ethical consideration**: Never show this score to athletes under 16 without parental context. A "low breakout score" could be psychologically harmful. For scouts, show it with appropriate caveats: "Based on current trajectory. Many factors are not captured by data."

#### 4.2 Injury Risk Model

**Question**: "What is this athlete's injury risk in the next 30 days?"

**Based on published ACWR-injury research** (Gabbett, 2016; Hulin et al., 2014):

```python
def injury_risk_score(athlete):
    """
    Combines training load data with demographic risk factors.
    Literature-backed thresholds.
    """
    # ACWR component (strongest predictor)
    acwr = athlete.acute_chronic_workload_ratio
    if acwr < 0.8:
        acwr_risk = 0.15  # Undertrained, moderate risk
    elif 0.8 <= acwr <= 1.3:
        acwr_risk = 0.05  # Sweet spot, low risk
    elif 1.3 < acwr <= 1.5:
        acwr_risk = 0.20  # Elevated
    else:
        acwr_risk = 0.40  # High risk (>1.5)

    # Load spike component
    week_over_week_change = athlete.this_week_load / max(athlete.last_week_load, 1)
    spike_risk = max(0, (week_over_week_change - 1.3) * 0.5)

    # Age-sport risk modifier
    age_risk = get_age_sport_risk(athlete.age, athlete.sport, athlete.position)

    # Training age (experience) modifier -- newer athletes at higher risk
    experience_modifier = max(0, 1.0 - (athlete.years_in_sport * 0.1))

    # Combined
    injury_risk = min(1.0, acwr_risk + spike_risk + age_risk * 0.1 + experience_modifier * 0.1)

    return injury_risk
```

**Display for athletes**: "Your training load has spiked this week. Athletes with similar patterns have a 25% higher injury rate. Consider reducing intensity."

**Display for scouts**: Yellow/red injury risk badge on athlete profile, visible only when risk is elevated.

**Important**: This is an advisory tool, not a medical diagnosis. Always include disclaimer: "This is an estimate based on training patterns. Consult a sports medicine professional for medical advice."

#### 4.3 Career Path Similarity

**Question**: "Which successful athletes had a similar profile at the same age?"

**Approach**: Cluster analysis on athlete development trajectories.

```python
def find_career_path_matches(athlete):
    """
    Find historically successful athletes with similar profiles.
    """
    # Create athlete snapshot vector at current age
    snapshot = create_age_normalized_snapshot(athlete)

    # Find successful athletes (reached higher verification levels)
    # who had similar snapshots at the same age
    historical_db = get_historical_snapshots(
        sport=athlete.sport,
        position=athlete.position,
        age=athlete.age,
        min_future_level=athlete.current_level + 1
    )

    # Cosine similarity matching
    similarities = cosine_similarity(snapshot, historical_db)
    top_matches = similarities.top_k(5)

    return [
        {
            "athlete_name": match.name,
            "similarity": match.score,
            "age_at_snapshot": athlete.age,
            "current_level": match.current_level,
            "journey": f"Was {match.level_at_age} at age {athlete.age}, "
                       f"reached {match.current_level} by age {match.current_age}"
        }
        for match in top_matches
    ]
```

**Display**: "Athletes with your profile at age 17 typically reached state level within 2 years and district level within 8 months."

**Data requirement**: This model becomes meaningful only after 12-18 months of platform operation with enough longitudinal data. Start collecting data now; deploy model when ready.

#### 4.4 Scout Match Scoring v2

**Concept**: Learn scout preferences from behavior rather than stated preferences.

**Why this matters**: Scouts say they want one thing but shortlist another. A scout might set their preference to "fast strikers" but consistently shortlist technical playmakers. The model learns implicit preferences.

**Architecture**: Two-tower model (similar to YouTube recommendations):

```
Scout Tower:                        Athlete Tower:
  scout_id embedding                  athlete_id embedding
  + stated preferences                + profile features
  + interaction history               + stats
  + organization embedding            + video features
        |                                   |
        v                                   v
  Dense layers (128 -> 64)           Dense layers (128 -> 64)
        |                                   |
        v                                   v
  Scout vector (64-dim)              Athlete vector (64-dim)
        \                                 /
         \                               /
          --> Dot product / MLP --> affinity score
```

**Training signal**: Shortlist = strong positive. Message = positive. Profile view > 30 seconds = weak positive. Random non-interacted pairs = negatives.

**Advantage over v1**: Learns nonlinear relationships. A scout who repeatedly shortlists 16-year-old cricketers from Tier 2 cities with high stamina but mediocre skill scores (looking for raw talent to develop) will get very different recommendations than a scout who picks polished 19-year-olds from metropolitan areas.

#### 4.5 Market Value Estimation

**Concept**: Estimate an athlete's "talent market value" based on platform signals.

**This is speculative and sensitive.** Handle with extreme care.

**Input signals**:

- Verification level (strongest signal)
- Scout interest intensity (number of unique scouts viewing, shortlisting, messaging)
- Stats and stat trends
- Video highlight scores
- Training consistency
- Age (younger athletes with high stats = higher potential value)
- Sport and position demand (are scouts actively searching for this profile?)

**Model**: Ordinal regression (low / below average / average / above average / high / exceptional). Not a rupee amount -- a relative tier.

**Display**: Only show to the athlete as "Your profile ranks in the top X% of [sport] [position] athletes on OnlyKrida." Never show a rupee value. Never expose to scouts (creates perverse incentives).

**Ethics**: Market value estimation for minors is ethically fraught. If implemented, restrict to athletes 18+ with explicit consent. For younger athletes, show only "potential tier" based on trajectory, with heavy caveats.

### Data Requirements

| Data Type                 | Minimum Volume                        | Timeline to Reach | Notes                                 |
| ------------------------- | ------------------------------------- | ----------------- | ------------------------------------- |
| Athlete profiles          | 10,000 with 6+ months data            | Month 12          | Current growth trajectory + marketing |
| Scout interactions        | 500 scouts with 50+ interactions each | Month 9           | Requires engagement optimization      |
| Video clips analyzed      | 5,000+                                | Month 9           | Depends on Phase 2 deployment         |
| Wearable data             | 1,000+ athletes with 30+ days         | Month 12          | Depends on Phase 3 adoption           |
| Verification progressions | 500+ athletes who moved up a level    | Month 15          | Slow to accumulate, most important    |

### Team Needed

| Role                       | Type                                           | Key Skills                                                                           | Month   |
| -------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ | ------- |
| Senior Data Scientist      | Full-time                                      | Predictive modeling, XGBoost/LightGBM, deep learning, time-series, experiment design | Month 9 |
| ML Engineer                | Full-time (can be same as Phase 1 ML Engineer) | Production ML, model serving, A/B testing infrastructure                             | Month 9 |
| Sports Performance Analyst | Part-time                                      | Domain expertise, validates model outputs against real-world scouting knowledge      | Month 9 |

---

## 5. Infrastructure & Data Platform

### Full Stack Architecture

```
                           CLIENT
                             |
               React Native / Expo App
               (iOS + Android)
                             |
                    ---------|--------
                   |                  |
            Supabase                  |
     (Auth, DB, Storage,        API Gateway
      Realtime, Edge Fn)       (Cloud Run)
            |                         |
            |              -----------------------
            |             |           |           |
            |        Recommendation  Video     Wearable
            |          Service     Pipeline    Analytics
            |        (FastAPI)   (Modal.com)   (FastAPI)
            |             |           |           |
            |        ------     ------      ------
            |       |      |   |      |    |      |
            |     Redis  FAISS GPU    GPU  Redis  Time-series
            |    (cache) (ANN) (train)(inf)(cache)  (Supabase)
            |             |           |           |
            +------- Feature Store (Supabase + Redis) -------+
                             |
                    dbt (transforms)
                             |
                    MLflow (experiment tracking)
                             |
                    Grafana (monitoring)
```

### Component Details

#### Supabase (Core Platform)

- **Auth**: User authentication, role-based access (athlete, scout, admin)
- **PostgreSQL**: Primary database for all application data
- **Storage**: Video uploads, profile images, analysis outputs
- **Realtime**: Live updates for recommendations, notifications
- **Edge Functions**: Lightweight triggers (new video upload -> enqueue processing)
- **Row-Level Security**: Athlete data visible only to authorized scouts

**Schema additions needed for AI features**:

```sql
-- Interaction tracking (Phase 1)
CREATE TABLE scout_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scout_id UUID REFERENCES profiles(id),
    athlete_id UUID REFERENCES profiles(id),
    interaction_type TEXT NOT NULL, -- 'view', 'shortlist', 'message', 'contact_request'
    duration_seconds INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scout_interactions_scout ON scout_interactions(scout_id, created_at DESC);
CREATE INDEX idx_scout_interactions_athlete ON scout_interactions(athlete_id, created_at DESC);

-- Video analysis results (Phase 2)
CREATE TABLE video_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES video_highlights(id),
    sport_detected TEXT,
    sport_confidence FLOAT,
    highlight_score FLOAT,
    processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'complete', 'failed'
    model_version TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE video_moments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES video_highlights(id),
    timestamp_start FLOAT NOT NULL,
    timestamp_end FLOAT NOT NULL,
    action_label TEXT NOT NULL,
    confidence FLOAT,
    metadata JSONB
);

CREATE TABLE video_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES video_highlights(id),
    metric_name TEXT NOT NULL,
    metric_value FLOAT NOT NULL,
    unit TEXT,
    confidence FLOAT
);

-- Wearable data (Phase 3)
CREATE TABLE wearable_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES profiles(id),
    source TEXT NOT NULL, -- 'healthkit', 'health_connect', 'garmin', 'fitbit'
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE wearable_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES profiles(id),
    source TEXT NOT NULL,
    workout_type TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes FLOAT,
    calories FLOAT,
    avg_heart_rate FLOAT,
    max_heart_rate FLOAT,
    distance_meters FLOAT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wearable_workouts_athlete ON wearable_workouts(athlete_id, start_time DESC);

CREATE TABLE wearable_daily_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES profiles(id),
    date DATE NOT NULL,
    steps INTEGER,
    active_minutes INTEGER,
    resting_heart_rate FLOAT,
    hrv_ms FLOAT,
    sleep_hours FLOAT,
    sleep_quality TEXT,
    vo2_max_estimate FLOAT,
    source TEXT,
    UNIQUE(athlete_id, date)
);

CREATE TABLE athlete_training_load (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES profiles(id),
    date DATE NOT NULL,
    acute_load FLOAT,      -- 7-day rolling
    chronic_load FLOAT,    -- 28-day rolling
    acwr FLOAT,            -- acute / chronic
    load_status TEXT,       -- 'optimal', 'overreaching', 'undertrained', 'danger'
    recovery_score FLOAT,
    readiness TEXT,         -- 'green', 'yellow', 'red'
    UNIQUE(athlete_id, date)
);

-- Prediction outputs (Phase 4)
CREATE TABLE athlete_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES profiles(id),
    prediction_type TEXT NOT NULL, -- 'breakout', 'injury_risk', 'career_path'
    prediction_value FLOAT,
    prediction_label TEXT,
    confidence FLOAT,
    explanation JSONB,
    model_version TEXT,
    valid_until DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### API Layer (FastAPI on Cloud Run)

Three microservices, each independently deployable:

1. **Recommendation Service** (`/api/v1/recommendations/`)
   - Handles recommendation generation, similar athlete lookup, feedback
   - Connects to Redis (cache), FAISS (vector index), Supabase (data)
   - Auto-scales 0-10 instances based on request volume
   - Memory: 1 GB (FAISS index fits in memory for < 100K athletes)

2. **Video Analysis Service** (`/api/v1/video/`)
   - Handles video processing pipeline orchestration
   - Dispatches GPU tasks to Modal.com
   - Manages processing queue and status updates
   - Auto-scales 0-5 instances

3. **Wearable Analytics Service** (`/api/v1/wearable/`)
   - Handles data ingestion from app, training load computation
   - Runs nightly batch for daily summaries and ACWR
   - Auto-scales 0-3 instances

#### ML Pipeline

```
Supabase (source of truth)
    |
    | Nightly extract (pg_dump or logical replication)
    v
Staging tables (Cloud SQL or Supabase secondary project)
    |
    | dbt run (transforms, feature engineering)
    v
Feature tables (ready for model training)
    |
    | Read by
    v
Training jobs (Modal.com)
    - Scheduled nightly via Cloud Scheduler -> Cloud Run trigger -> Modal API
    - Training scripts in Git repo, versioned
    - MLflow tracks: parameters, metrics, artifacts
    - Best model promoted to "production" in MLflow registry
    |
    | Model artifacts stored in
    v
Model Registry (MLflow on Cloud Run + GCS bucket for artifacts)
    |
    | Loaded by inference services on startup
    v
Inference (FastAPI services pull latest "production" model)
```

#### Monitoring

**Grafana dashboards** (hosted on Grafana Cloud free tier or self-hosted on Cloud Run):

1. **Model Performance Dashboard**
   - Recommendation CTR (daily, weekly trends)
   - Precision@K over time
   - Model latency percentiles (p50, p95, p99)
   - Feature drift detection (KL divergence of input distributions)
   - Prediction distribution shifts

2. **Video Pipeline Dashboard**
   - Videos processed per day
   - Processing time distribution
   - Sport detection accuracy (based on manual corrections)
   - GPU utilization and cost
   - Error rate by processing stage

3. **Platform Health Dashboard**
   - API latency and error rates
   - Supabase connection pool usage
   - Redis memory usage and hit rate
   - Cloud Run instance count and CPU utilization
   - Cost tracking (daily/weekly)

### Cost Estimates (Monthly)

| Component                      | Phase 1 (Mo 1-3) | Phase 2 (Mo 3-6) | Phase 3 (Mo 6-9) | Phase 4 (Mo 9-12) | Steady State (Mo 12+) |
| ------------------------------ | ---------------- | ---------------- | ---------------- | ----------------- | --------------------- |
| Supabase Pro                   | $25              | $25              | $25              | $75               | $75                   |
| Cloud Run (API services)       | $50              | $200             | $200             | $500              | $500                  |
| GPU - training (Modal)         | $0               | $500             | $200             | $1,000            | $800                  |
| GPU - inference (Modal)        | $0               | $300             | $100             | $500              | $400                  |
| Redis (Upstash or Memorystore) | $10              | $25              | $25              | $50               | $50                   |
| Storage - video (Supabase/GCS) | $50              | $200             | $200             | $500              | $500+                 |
| MLflow hosting                 | $0               | $25              | $25              | $25               | $25                   |
| Grafana Cloud                  | $0               | $0               | $0               | $50               | $50                   |
| Wearable API costs             | $0               | $0               | $100             | $100              | $100                  |
| dbt Cloud (or self-hosted)     | $0               | $0               | $0               | $100              | $100                  |
| **Total**                      | **$135**         | **$1,275**       | **$875**         | **$2,900**        | **$2,600**            |

**Cost optimization strategies**:

- Use Modal.com serverless GPU (pay per second, no idle costs)
- Cache aggressively in Redis (reduce repeated inference)
- Batch video processing during off-peak hours (cheaper GPU rates)
- Use FAISS instead of managed vector database (saves $100+/month)
- Start with Supabase free tier features where possible, upgrade as needed

---

## 6. Team Hiring Roadmap

### Immediate Hires (Month 1-3)

#### ML Engineer -- Recommendation Systems

- **Seniority**: Mid to Senior (3-5 years experience)
- **Must-have skills**: Python, PyTorch or TensorFlow, collaborative filtering, recommendation systems, production ML deployment, FastAPI, SQL
- **Nice-to-have**: Experience with sports data, worked at scale (1M+ users), familiar with Supabase/PostgreSQL
- **Salary range (India)**: INR 20-40 LPA
- **Where to find**: LinkedIn (filter for ML engineers at e-commerce companies -- they build recommendation systems), IIT/IIIT alumni networks, Kaggle competition winners in recommendation challenges

#### Data Engineer

- **Seniority**: Mid (2-4 years experience)
- **Must-have skills**: Python, SQL (PostgreSQL), dbt, data pipeline orchestration (Airflow or equivalent), Redis, cloud platforms (GCP or AWS)
- **Nice-to-have**: Experience with Supabase, real-time data pipelines, MLOps
- **Salary range (India)**: INR 15-30 LPA
- **Where to find**: Data engineering communities, dbt Slack community, analytics engineering meetups

### Phase 2 Hires (Month 3-6)

#### Computer Vision Engineer

- **Seniority**: Mid to Senior (3-5 years)
- **Must-have skills**: PyTorch, video understanding (action recognition, pose estimation), model training and optimization, experience with SlowFast/TimeSformer/MediaPipe
- **Nice-to-have**: Sports analytics background, mobile deployment experience (ONNX, TFLite), published papers in video understanding
- **Salary range (India)**: INR 25-45 LPA
- **Where to find**: CV research labs (IIIT Hyderabad CVIT, IIT Bombay Vision Lab), sports analytics companies, Roboflow/Ultralytics community

#### Data Annotators (2-3 Part-Time)

- **Profile**: Athletes or sports coaches who understand sport-specific actions
- **Skills needed**: Attention to detail, familiarity with one or more target sports, ability to use CVAT annotation tool (training provided)
- **Pay**: INR 500-1000 per hour, part-time (10-20 hours/week)
- **Where to find**: OnlyKrida's own athlete community (recruit power users)

### Phase 3 Hires (Month 6-9)

#### Mobile Developer (Native Modules)

- **Seniority**: Mid (2-4 years)
- **Must-have skills**: React Native native modules, iOS development (Swift, HealthKit), Android development (Kotlin, Health Connect), Expo config plugins
- **Nice-to-have**: Experience with health/fitness apps, background processing, Bluetooth/wearable integration
- **Salary range (India)**: INR 18-35 LPA

#### Sports Science Advisor

- **Profile**: PhD in sports science, exercise physiology, or performance analysis, OR senior performance analyst at a sports academy/national team
- **Engagement**: Part-time consultant, 8-12 hours/month
- **Role**: Validate training load algorithms, review injury risk thresholds, advise on biometric metric interpretation, review athlete-facing content
- **Hourly rate**: INR 3,000-8,000 per hour (or equivalent retainer)
- **Where to find**: NSNIS Patiala alumni, SAI (Sports Authority of India) network, sports science departments at Guru Nanak Dev University, Lakshmibai National Institute

### Phase 4 Hires (Month 9-12)

#### Senior Data Scientist

- **Seniority**: Senior (5+ years)
- **Must-have skills**: Predictive modeling, XGBoost/LightGBM, deep learning, experiment design, causal inference, A/B testing
- **Nice-to-have**: Sports analytics, time-series forecasting, published research
- **Salary range (India)**: INR 30-50 LPA

### Total Team Composition at Month 12

| Role                                        | Count                       | Type                 |
| ------------------------------------------- | --------------------------- | -------------------- |
| ML Engineer (Recommendations)               | 1                           | Full-time            |
| Data Engineer                               | 1                           | Full-time            |
| Computer Vision Engineer                    | 1                           | Full-time            |
| ML Engineer (Video) / Senior Data Scientist | 1                           | Full-time            |
| Mobile Developer (Native)                   | 1                           | Full-time            |
| Data Annotators                             | 2-3                         | Part-time            |
| Sports Science Advisor                      | 1                           | Part-time consultant |
| **Total**                                   | **5-6 FTE + 3-4 part-time** |                      |

### Estimated Monthly Payroll (India, Month 12)

| Role                           | Monthly Cost (INR)  |
| ------------------------------ | ------------------- |
| ML Engineer                    | 2.5L - 3.5L         |
| Data Engineer                  | 1.5L - 2.5L         |
| CV Engineer                    | 2.5L - 3.8L         |
| Senior Data Scientist          | 2.5L - 4.2L         |
| Mobile Developer               | 1.5L - 3.0L         |
| Data Annotators (3x part-time) | 0.6L - 1.2L         |
| Sports Science Advisor         | 0.3L - 0.8L         |
| **Total Monthly**              | **11.4L - 19.0L**   |
| **Total Annual**               | **1.37Cr - 2.28Cr** |

---

## 7. Competitive Advantage Summary

| Capability                 | AiSCOUT (UK)                   | HUDL (US)                 | Wyscout (Italy)    | TransferRoom                      | OnlyKrida (Target)                                                          |
| -------------------------- | ------------------------------ | ------------------------- | ------------------ | --------------------------------- | --------------------------------------------------------------------------- |
| **AI Scouting**            | Football only, elite level     | No AI matching            | No AI matching     | Club-to-club, no athlete profiles | Multi-sport, grassroots to professional, India-specific                     |
| **Video Analysis**         | Automated football skill tests | Manual tagging by coaches | Manual tagging     | No video                          | Auto-detection for 8+ Indian sports                                         |
| **Wearable Integration**   | No                             | No                        | No                 | No                                | HealthKit + Health Connect + budget wearables                               |
| **Performance Prediction** | No                             | Basic stats trending      | No                 | No                                | ML-driven breakout prediction + injury risk                                 |
| **India Sports Coverage**  | No                             | No                        | No                 | No                                | Cricket, kabaddi, football, boxing, athletics, wrestling, hockey, badminton |
| **Target Users**           | Premier League academies       | US high school/college    | Professional clubs | Professional clubs                | Grassroots athletes + district/state/national scouts                        |
| **Price Point**            | Enterprise (undisclosed)       | $500+/year                | $1,000+/year       | Enterprise                        | Free for athletes, INR 999-9,999/mo for scouts                              |
| **Language Support**       | English                        | English                   | Multi-language     | English                           | English + Hindi + regional languages                                        |
| **Verification System**    | None (pre-screened)            | None                      | None               | None                              | 5-tier verification ladder                                                  |

### Moat Analysis

1. **Data moat**: Every interaction, video upload, and wearable sync builds a proprietary dataset of Indian athlete performance data that does not exist anywhere else. This data is the fuel for every ML model. First mover captures this data.

2. **Sport-specific models**: Cricket bowling action analysis, kabaddi raid pattern recognition, boxing technique scoring -- these models require sport-specific training data and domain expertise. Generic sports AI companies cannot easily replicate this.

3. **India distribution advantage**: Integration with budget wearables (Noise, Fire-Boltt, boAt) that dominate the Indian market. Western platforms have no incentive to support these devices.

4. **Verification network effect**: As more athletes get verified (school -> district -> state -> national), the verification data becomes a trust layer that scouts rely on. This is hard to replicate without on-ground verification partnerships.

5. **Bilingual/regional advantage**: AI models trained on Indian sports terminology, regional sports associations, and local competition structures.

---

## 8. Quick Wins (Can Start This Week)

These require zero ML, zero new hires, and minimal development time. They lay the foundation for everything in this roadmap.

### 8.1 Track Scout Behavior (Priority: Critical)

**What**: Log every scout interaction with athlete profiles.

**Implementation**: Add event tracking calls in the React Native app.

```typescript
// In the scout's athlete profile view
const trackInteraction = async (
  scoutId: string,
  athleteId: string,
  type: 'view' | 'shortlist' | 'message' | 'contact_request' | 'video_watch',
  metadata?: Record<string, any>,
) => {
  await supabase.from('scout_interactions').insert({
    scout_id: scoutId,
    athlete_id: athleteId,
    interaction_type: type,
    metadata,
    created_at: new Date().toISOString(),
  });
};

// Track profile view with duration
useEffect(() => {
  const startTime = Date.now();
  trackInteraction(scoutId, athleteId, 'view');

  return () => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    if (duration > 3) {
      // Only log meaningful views (> 3 seconds)
      supabase.from('scout_interactions').insert({
        scout_id: scoutId,
        athlete_id: athleteId,
        interaction_type: 'view_duration',
        metadata: { duration_seconds: duration },
      });
    }
  };
}, [athleteId]);
```

**Time to implement**: 1-2 days.
**Value**: This data IS the training set for every recommendation model. Start collecting immediately.

### 8.2 Video Metadata Extraction (Priority: High)

**What**: When an athlete uploads a video, extract and store basic metadata.

**Implementation**: Add metadata extraction in the upload flow.

```typescript
// After video selection via expo-image-picker
const extractVideoMetadata = (asset: ImagePickerAsset) => {
  return {
    duration_seconds: asset.duration ? asset.duration / 1000 : null,
    width: asset.width,
    height: asset.height,
    file_size_bytes: asset.fileSize,
    type: asset.type,
    uri: asset.uri,
  };
};

// Store in video_highlights table
await supabase
  .from('video_highlights')
  .update({
    duration_seconds: metadata.duration_seconds,
    resolution_width: metadata.width,
    resolution_height: metadata.height,
    file_size_bytes: metadata.file_size_bytes,
  })
  .eq('id', videoId);
```

**Time to implement**: Half a day.
**Value**: Enables video quality scoring later. Scouts can filter by video duration/quality.

### 8.3 Sport Auto-Tagging from Profile (Priority: Medium)

**What**: Use the athlete's stated sport to pre-tag their uploaded videos.

**Implementation**: When a video is uploaded, copy the athlete's sport to the video record.

```sql
-- Simple: copy sport from profile to video
UPDATE video_highlights
SET sport_tag = (SELECT sport FROM athlete_profiles WHERE id = video_highlights.athlete_id)
WHERE sport_tag IS NULL;
```

**Time to implement**: 30 minutes.
**Value**: Enables sport-based video filtering for scouts immediately. When ML sport detection arrives later, it validates against this human-provided label.

### 8.4 Training Log Feature (Priority: High)

**What**: Simple manual entry for daily training. No wearable needed.

**UI**:

```
Today's Training
---------------------------------
Sport:     [Cricket      v]
Type:      [Net Practice v]
Duration:  [  90  ] minutes
Intensity: [ Low | Medium | HIGH ]
Notes:     [Focused on yorkers...]
---------------------------------
[LOG TRAINING]
```

**Schema**:

```sql
CREATE TABLE training_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES profiles(id),
    date DATE DEFAULT CURRENT_DATE,
    sport TEXT,
    training_type TEXT,
    duration_minutes INTEGER,
    intensity TEXT, -- 'low', 'medium', 'high'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Time to implement**: 1-2 days (UI + backend).
**Value**: Builds longitudinal training data before wearable integration exists. Athletes who log consistently demonstrate discipline (visible to scouts). This data feeds directly into Phase 3 training load calculations.

### 8.5 Digital Sports Passport (Priority: Medium)

**What**: Export athlete profile as a shareable PDF or image card with QR code.

**Content**:

```
+---------------------------------------+
|  [Photo]  ATHLETE NAME                |
|           Sport: Cricket              |
|           Position: Fast Bowler       |
|           Age: 17                     |
|           Location: Pune, MH          |
|                                       |
|  Verification: STATE LEVEL            |
|  Skill: 85  Speed: 92  Stamina: 78   |
|                                       |
|  [QR Code -> OnlyKrida Profile Link]  |
|                                       |
|  OnlyKrida - India's Sports           |
|  Talent Platform                      |
+---------------------------------------+
```

**Implementation**: Use a React Native PDF/image generation library (e.g., `react-native-view-shot` for image, or server-side PDF generation).

**Time to implement**: 2-3 days.
**Value**: Athletes share this at tournaments, trials, and on social media. Organic distribution channel. The QR code drives scout traffic to the platform.

---

## Appendix A: Key Research References

1. **Gabbett, T.J. (2016)**. "The training-injury prevention paradox." British Journal of Sports Medicine. Foundation for ACWR-based injury risk models.

2. **Hulin, B.T. et al. (2014)**. "The acute:chronic workload ratio predicts injury." British Journal of Sports Medicine. Validates the 0.8-1.3 optimal ACWR range.

3. **Covington, P. et al. (2016)**. "Deep Neural Networks for YouTube Recommendations." RecSys. Architecture inspiration for two-tower recommendation model.

4. **Feichtenhofer, C. et al. (2019)**. "SlowFast Networks for Video Recognition." ICCV. Foundation for action recognition in video pipeline.

5. **Lugaresi, C. et al. (2019)**. "MediaPipe: A Framework for Building Perception Pipelines." CVPR Workshop. Pose estimation backbone for technique analysis.

6. **Buchheit, M. (2014)**. "Monitoring training status with HR measures." International Journal of Sports Physiology and Performance. Recovery score methodology.

## Appendix B: Risk Register

| Risk                                                  | Probability  | Impact | Mitigation                                                                                                                 |
| ----------------------------------------------------- | ------------ | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| Insufficient training data for ML models              | High (early) | High   | Start data collection NOW (Quick Wins). Use transfer learning. Augment with public datasets.                               |
| Video analysis accuracy too low for user trust        | Medium       | High   | Progressive rollout with manual override. Show confidence scores. Let athletes correct mistakes (generates training data). |
| Budget wearable data too noisy for reliable analytics | Medium       | Medium | Show confidence intervals. Use median filtering. Validate against Apple Watch subset.                                      |
| Privacy concerns with biometric data                  | Medium       | High   | DPDP Act compliance. Granular consent. Data deletion capability. Never share individual data externally.                   |
| GPU costs spike with video volume                     | Medium       | Medium | Serverless GPU (pay per use). Batch processing. Model optimization (quantization, distillation).                           |
| Key ML hire leaves                                    | Low-Medium   | High   | Document everything. Use standard tools (PyTorch, MLflow). Pair programming. Knowledge sharing sessions.                   |
| Cold start problem persists                           | Medium       | Medium | Strong content-based fallback. Preference-based onboarding. Popular athlete boosting.                                      |

## Appendix C: Month-by-Month Timeline Summary

```
Month 1:  [HIRE] ML Engineer + Data Engineer
          [BUILD] Interaction tracking, dbt pipeline
          [QUICK WIN] Scout behavior logging, video metadata, training log

Month 2:  [BUILD] Content-based recommendation v1
          [TEST] A/B test vs current weighted scoring
          [DATA] Begin accumulating interaction data

Month 3:  [HIRE] CV Engineer + Data Annotators
          [BUILD] Collaborative filtering v1, hybrid model
          [BUILD] Video pipeline infrastructure, sport detection model training

Month 4:  [BUILD] NCF model, explanation API
          [BUILD] Sport detection deployed, basic moment tagging
          [DATA] 1000+ labeled sport classification images

Month 5:  [BUILD] Sequence-aware recommendation model
          [BUILD] Pose estimation pipeline, technique visualization
          [TEST] Video analysis user testing with select athletes

Month 6:  [HIRE] Mobile Developer + Sports Science Advisor
          [BUILD] Full recommendation system live with monitoring
          [BUILD] HealthKit + Health Connect integration
          [MILESTONE] Phase 1 complete - AI Scouting Engine live

Month 7:  [BUILD] Wearable data sync + storage
          [BUILD] Action recognition model training (multi-sport)
          [DATA] 3000+ video clips processed

Month 8:  [BUILD] Training load algorithm + athlete dashboard
          [BUILD] Automated metric extraction from video
          [TEST] Wearable analytics beta with 100 athletes

Month 9:  [HIRE] Senior Data Scientist
          [BUILD] Highlight scoring system deployed
          [BUILD] Recovery score + readiness indicator
          [MILESTONE] Phase 2 complete - Video Analysis live

Month 10: [BUILD] Scout-visible fitness profiles
          [BUILD] Breakout prediction model v1
          [DATA] 5000+ athletes, 500+ scout interactions

Month 11: [BUILD] Injury risk model
          [BUILD] Career path similarity engine
          [TEST] Prediction model validation with sports science advisor

Month 12: [BUILD] Scout match scoring v2 (deep learning)
          [BUILD] Wearable-verified badges
          [MILESTONE] Phase 3 complete - Wearable Analytics live
          [MILESTONE] Full team operational (5-6 FTE + 3-4 PT)

Month 13-18: [BUILD] Market value estimation (careful rollout)
             [BUILD] Advanced prediction models (more data available)
             [OPTIMIZE] Model retraining automation
             [SCALE] Handle 50K+ athletes, 2K+ scouts
             [MILESTONE] Phase 4 complete - Performance Prediction live
```

---

_This roadmap is a living document. Review and update monthly based on actual data volumes, model performance, user feedback, and team capacity. The timelines assume successful hiring -- delays in hiring will push phases proportionally._

_Document prepared for Anirudh Tumuluru, Founder, OnlyKrida._
