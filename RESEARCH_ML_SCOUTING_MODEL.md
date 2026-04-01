# OnlyKrida ML Scouting Model: Deep Research & Implementation Guide

**Date:** 2026-03-12
**Author:** AI Engineering Research
**Status:** Research Complete -- Ready for Implementation Planning

---

## Table of Contents

1. [Scores Vision (Bittensor Subnet 44) Deep Dive](#1-scores-vision-bittensor-subnet-44)
2. [Data Collection Strategy for India](#2-data-collection-strategy)
3. [Video Analysis ML Pipeline](#3-video-analysis-ml-pipeline)
4. [Recommendation Engine Architecture](#4-recommendation-engine)
5. [Performance Prediction Models](#5-performance-prediction-models)
6. [Model Training Infrastructure & Costs](#6-training-infrastructure)
7. [Bittensor / Decentralized AI Integration](#7-bittensor-integration)
8. [Implementation Roadmap (12-Month Plan)](#8-implementation-roadmap)

---

## 1. Scores Vision (Bittensor Subnet 44)

### 1.1 What Is It?

Score Vision is **Bittensor Subnet 44** (SN44), a decentralized computer vision framework built on the Bittensor network. It launched on mainnet in Q1 2025, with a testnet running on netuid 261.

**Core mission:** Drastically reduce the cost and time required for complex sports video analysis through decentralized compute. The system currently focuses on **Game State Recognition (GSR)** in football (soccer).

**GitHub:** `score-protocol/sn44`
**Website:** score.vision (note: was unreachable at time of research)

### 1.2 Technical Architecture

Score Vision uses a three-role system inherited from Bittensor's architecture:

#### Miners (Compute Workers)

- Process video streams for object detection and tracking
- Output standardized results in real-time
- Compete for TAO rewards based on output quality
- Run inference on sports video feeds, detecting:
  - Players (home team, away team)
  - Ball position and trajectory
  - Referees and goalkeepers
  - Pitch/field geometry

#### Validators (Quality Checkers)

- Verify miner outputs through a two-step lightweight validation process:
  1. **Frame Filtering & Keypoint Validation:** Pitch detection filters relevant frames; scoring evaluates keypoint accuracy based on stability, plausibility, and reprojection error
  2. **Semantic BBox Assessment:** CLIP-based object verification for players, ball, referees, and goalkeepers
- Use Vision Language Models (VLMs) for semantic validation

#### Subnet Owner

- Manages incentive parameters and emission schedules
- Sets quality thresholds and competition rules
- Governs roadmap and technical direction

### 1.3 ML Models Used

| Component             | Model / Approach                                                             |
| --------------------- | ---------------------------------------------------------------------------- |
| Object Detection      | YOLO-family models for player/ball/referee detection                         |
| Object Tracking       | Multi-object tracking for game state reconstruction                          |
| Semantic Verification | CLIP (Contrastive Language-Image Pre-training) for object class verification |
| Validation            | Vision Language Models (VLMs) for output quality assessment                  |
| Pitch Detection       | Homography-based pitch geometry estimation                                   |
| Keypoint Scoring      | Custom metrics: stability, plausibility, reprojection error                  |

### 1.4 Sports Coverage

| Status              | Sport                                              |
| ------------------- | -------------------------------------------------- |
| Live (2025)         | Football (soccer) -- Game State Recognition        |
| Planned (2025-2026) | Basketball                                         |
| Planned (2025-2026) | Tennis                                             |
| Future              | Broader computer vision applications beyond sports |

### 1.5 API Availability

**As of March 2026:** The Score Vision API is in Phase 4 of their roadmap (originally targeted Q4 2025). The roadmap includes:

- Integration APIs for external consumers
- Developer tools and SDKs
- Real-time game state data feeds

**Current access method:** Run a miner or validator node directly. There is no public REST API yet for consuming predictions.

### 1.6 Relevance to OnlyKrida

| Score Vision Strength          | OnlyKrida Application                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Decentralized video processing | Could offload expensive video analysis to Bittensor miners instead of paying for GPU cloud compute        |
| Game State Recognition         | Foundation for match analysis, but OnlyKrida needs individual player analysis, not just game state        |
| CLIP-based validation          | Same approach can validate sport detection in user-uploaded videos                                        |
| Football focus                 | Directly applicable to football scouting; other Indian sports (cricket, kabaddi) would need custom models |

**Key Gap:** Score Vision focuses on game-level state (where are all players, where is the ball), while OnlyKrida needs player-level analysis (how good is this specific athlete's technique). These are complementary but different problems.

---

## 2. Data Collection Strategy

### 2.1 What Data Does OnlyKrida Need?

#### Tier 1: Core Data (Must Have for MVP)

| Data Type              | Description                                                   | Volume Target (Year 1)         |
| ---------------------- | ------------------------------------------------------------- | ------------------------------ |
| **Player Profiles**    | Name, age, sport, location, physical attributes, achievements | 50,000+ profiles               |
| **Video Highlights**   | 30-90 second clips of player performance                      | 100,000+ clips                 |
| **Scout Interactions** | Views, saves, shortlists, messages, ratings                   | Behavioral tracking from day 1 |
| **Match Results**      | Tournament outcomes, individual statistics                    | 10,000+ matches                |
| **Coach Assessments**  | Structured ratings (1-10) on specific skills                  | 5,000+ assessments             |

#### Tier 2: Enhanced Data (Months 3-6)

| Data Type                    | Description                                       | Source                                             |
| ---------------------------- | ------------------------------------------------- | -------------------------------------------------- |
| **Detailed Match Stats**     | Per-player statistics from organized competitions | Partnerships with leagues/federations              |
| **Training Videos**          | Longer-form footage of training sessions          | Direct upload from athletes/coaches                |
| **GPS/Wearable Data**        | Speed, distance, heart rate, acceleration         | Integration with Catapult, STATSports, Playermaker |
| **Social Media Performance** | Viral highlights, engagement metrics              | Instagram, YouTube API scraping                    |

#### Tier 3: Advanced Data (Months 6-12)

| Data Type                   | Description                                              | Source                     |
| --------------------------- | -------------------------------------------------------- | -------------------------- |
| **Biomechanical Data**      | Joint angles, velocity profiles from pose estimation     | Computed from video via ML |
| **Opponent-Adjusted Stats** | Performance metrics normalized against competition level | Calculated from match data |
| **Longitudinal Tracking**   | Performance over time, growth curves                     | Continuous data collection |
| **Nutrition/Recovery**      | Sleep, diet, recovery metrics                            | Wearable integrations      |

### 2.2 India-Specific Data Sources

#### Cricket

| Source                         | Data Available                                     | Access Method                           |
| ------------------------------ | -------------------------------------------------- | --------------------------------------- |
| **BCCI domestic records**      | Ranji Trophy, Vijay Hazare, Syed Mushtaq Ali stats | Web scraping + RTI requests             |
| **IPL public stats**           | Ball-by-ball data for IPL matches                  | ESPNcricinfo API, CricSheet (open data) |
| **Khelo India Games**          | Youth competition results across sports            | Government portal scraping              |
| **State cricket associations** | District/state-level tournament results            | Direct partnerships                     |
| **CricSheet.org**              | Open ball-by-ball data for international + IPL     | Free download, CSV format               |
| **ESPNcricinfo**               | Comprehensive cricket statistics                   | Statsapi (unofficial), web scraping     |

#### Football

| Source                     | Data Available                 | Access Method               |
| -------------------------- | ------------------------------ | --------------------------- |
| **ISL / I-League**         | Match stats, player profiles   | AIFF website, Transfermarkt |
| **Santosh Trophy**         | State-level football results   | AIFF records                |
| **Reliance Foundation YC** | Youth development program data | Partnership                 |
| **Baby League**            | Grassroots football data       | AIFF grassroots program     |

#### Kabaddi

| Source                            | Data Available                                  | Access Method                   |
| --------------------------------- | ----------------------------------------------- | ------------------------------- |
| **Pro Kabaddi League**            | Raid points, tackle points, super raids/tackles | PKL website, web scraping       |
| **National Kabaddi Championship** | State-level results                             | SAI (Sports Authority of India) |
| **Khelo India**                   | Youth kabaddi results                           | Government portal               |

#### Other Sports

| Sport         | Source                                     | Data                         |
| ------------- | ------------------------------------------ | ---------------------------- |
| **Athletics** | Athletics Federation of India, Khelo India | Times, distances, heights    |
| **Boxing**    | Boxing Federation of India                 | Tournament results, rankings |
| **Wrestling** | Wrestling Federation of India              | Weight-class results         |
| **Hockey**    | Hockey India                               | Match stats, player profiles |
| **Badminton** | BAI, BWF rankings                          | Tournament results, rankings |

### 2.3 Bootstrapping with Limited Data

The cold start problem is the biggest challenge. Here is how to address it:

#### Strategy 1: Transfer Learning

```
Pre-trained Model (ImageNet/Kinetics-400, billions of images/videos)
        |
        v
Fine-tune on sports-specific data (Sports-1M, UCF-101 sports subset)
        |
        v
Fine-tune on Indian sports data (your collected dataset)
```

**Practical approach:**

- Start with `facebook/timesformer-base-finetuned-k400` (88.7K downloads on HuggingFace)
- Fine-tune on ~500-1000 labeled Indian sports clips
- Achieves 80%+ accuracy on sport classification with minimal data

#### Strategy 2: Synthetic Data Generation

| Technique                       | Use Case                                  | Tool                                       |
| ------------------------------- | ----------------------------------------- | ------------------------------------------ |
| **Video augmentation**          | Flip, rotate, color-jitter existing clips | `albumentations`, `torchvision.transforms` |
| **Pose-conditioned generation** | Generate synthetic training poses         | ControlNet + OpenPose conditioning         |
| **Text-to-video**               | Generate sport-specific training data     | Runway Gen-3, Pika Labs                    |
| **Mixup/CutMix**                | Blend training examples                   | Built into PyTorch                         |

**Caution:** Synthetic data works well for classification but poorly for fine-grained biomechanical analysis. Use it only for bootstrapping sport detection and action recognition.

#### Strategy 3: Few-Shot Learning

| Approach                  | When to Use                            | Implementation                 |
| ------------------------- | -------------------------------------- | ------------------------------ |
| **Prototypical Networks** | Classify new sports with 5-10 examples | `learn2learn` library          |
| **CLIP zero-shot**        | Sport detection with no training data  | `openai/clip-vit-base-patch32` |
| **Siamese Networks**      | Player similarity matching             | Custom PyTorch implementation  |
| **Meta-learning (MAML)**  | Rapid adaptation to new sports         | `learn2learn` library          |

**Recommended for OnlyKrida:** Use CLIP zero-shot for initial sport detection (no training needed), then fine-tune with collected data as it grows.

#### Strategy 4: Active Learning

Instead of labeling everything, let the model choose what to label:

```
1. Train initial model on small labeled set (500 examples)
2. Run inference on large unlabeled pool
3. Select examples where model is most uncertain
4. Send ONLY those to human annotators
5. Retrain model with expanded labeled set
6. Repeat until desired accuracy
```

This reduces annotation costs by 60-80% compared to random labeling.

### 2.4 Annotation Pipeline

#### Video Annotation Tools

| Tool                              | Cost                    | Best For                                       | Collaborative |
| --------------------------------- | ----------------------- | ---------------------------------------------- | ------------- |
| **CVAT** (open source)            | Free (self-hosted)      | Bounding boxes, keypoints, tracking            | Yes           |
| **Label Studio** (open source)    | Free (self-hosted)      | Multi-modal (video, text, audio)               | Yes           |
| **Roboflow**                      | Free tier, then $249/mo | Object detection, easy export                  | Yes           |
| **V7 Labs**                       | $300/mo+                | Medical/sports-grade annotation                | Yes           |
| **Amazon SageMaker Ground Truth** | Pay per label           | Large-scale annotation with built-in workforce | Yes           |

#### Affordable Annotation Strategy for India

**Phase 1: Internal labeling (Months 1-2)**

- Hire 3-5 sports science students (Rs 15,000-20,000/month each)
- Use CVAT (free, self-hosted)
- Target: 5,000 labeled video clips
- Focus: Sport type, action type, quality rating (1-5)
- Cost: ~Rs 75,000-100,000/month total

**Phase 2: Crowdsourced labeling (Months 3-4)**

- Use platforms like Karya (Indian data annotation startup focused on fair wages)
- Semi-automated: Model pre-labels, humans correct
- Target: 20,000 labeled clips
- Cost: Rs 2-5 per label, total ~Rs 50,000-100,000

**Phase 3: Model-assisted labeling (Months 5+)**

- Active learning selects only uncertain examples
- Model pre-annotates 80%+ of labels correctly
- Humans only verify and correct
- Reduces per-label cost to Rs 0.50-1.00

#### Annotation Schema (Standardized Labels)

```json
{
  "video_id": "v_12345",
  "duration_seconds": 45,
  "sport": "cricket",
  "sport_confidence": 0.97,
  "actions": [
    {
      "timestamp_start": 2.3,
      "timestamp_end": 4.1,
      "action": "bowling_delivery",
      "sub_action": "fast_bowling",
      "quality_rating": 4,
      "annotator_id": "ann_001"
    }
  ],
  "players": [
    {
      "player_id": "p_789",
      "bounding_boxes": [...],
      "keypoints": [...],
      "role": "bowler"
    }
  ],
  "metadata": {
    "competition_level": "district",
    "surface": "turf",
    "lighting": "natural",
    "camera_angle": "side_on",
    "video_quality": "720p"
  }
}
```

---

## 3. Video Analysis ML Pipeline

### 3.1 Pipeline Architecture Overview

```
User uploads video
        |
        v
[Stage 1] Pre-processing
  - Resolution normalization (resize to 224x224 or 384x384)
  - Frame extraction (2-8 FPS for efficiency)
  - Scene detection (split into meaningful clips)
        |
        v
[Stage 2] Sport Detection
  - Classify which sport is being played
  - Models: CLIP zero-shot, EfficientNet-B4, or ViT-B/16
        |
        v
[Stage 3] Object Detection & Tracking
  - Detect players, ball, equipment
  - Models: YOLOv8/v9, RT-DETR
  - Track across frames: ByteTrack, BoT-SORT
        |
        v
[Stage 4] Pose Estimation
  - Extract body keypoints (33 landmarks)
  - Models: MediaPipe Pose, ViTPose, RTMPose
  - 3D pose from 2D via lifting networks
        |
        v
[Stage 5] Action Recognition
  - Classify what action is being performed
  - Models: TimeSformer, VideoMAE, SlowFast
        |
        v
[Stage 6] Biomechanical Analysis
  - Joint angles, velocities, accelerations from pose data
  - Technique scoring against reference templates
  - Sport-specific metrics computation
        |
        v
[Stage 7] Quality & Talent Score
  - Aggregate all signals into composite score
  - Generate explainable breakdown
  - Store in feature store for recommendation engine
```

### 3.2 Sport Detection (Stage 2)

#### Model Comparison

| Model               | Accuracy (ImageNet) | Inference Speed | Model Size | Best For                                     |
| ------------------- | ------------------- | --------------- | ---------- | -------------------------------------------- |
| **CLIP ViT-B/32**   | N/A (zero-shot)     | 15ms            | 340MB      | Zero-shot classification, no training needed |
| **EfficientNet-B4** | 82.9%               | 8ms             | 75MB       | Mobile/edge deployment                       |
| **ViT-B/16**        | 84.5%               | 12ms            | 330MB      | High accuracy when fine-tuned                |
| **ResNet-50**       | 79.3%               | 5ms             | 98MB       | Fast baseline, well-understood               |
| **ConvNeXt-Base**   | 85.8%               | 10ms            | 350MB      | Best accuracy/speed tradeoff                 |

**Recommendation for OnlyKrida:**

1. **Start with CLIP zero-shot** -- no training data needed, works immediately
2. **Graduate to fine-tuned EfficientNet-B4** once you have 1000+ labeled clips per sport
3. Use CLIP for edge cases and new sports that lack training data

#### CLIP Zero-Shot Implementation

```python
import torch
from transformers import CLIPProcessor, CLIPModel

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Define sports categories relevant to India
sport_labels = [
    "a person playing cricket",
    "a person playing football soccer",
    "a person playing kabaddi",
    "a person playing badminton",
    "a person playing hockey",
    "a person doing athletics sprinting",
    "a person boxing",
    "a person wrestling",
    "a person playing table tennis",
    "a person swimming",
    "a person playing volleyball",
    "a person doing archery",
    "a person doing weightlifting",
]

def classify_sport(frame):
    inputs = processor(
        text=sport_labels,
        images=frame,
        return_tensors="pt",
        padding=True
    )
    outputs = model(**inputs)
    probs = outputs.logits_per_image.softmax(dim=1)
    top_idx = probs.argmax().item()
    return sport_labels[top_idx], probs[0][top_idx].item()
```

### 3.3 Action Recognition (Stage 5)

#### Model Comparison for Sports Action Recognition

| Model                      | Architecture                                      | Top-1 (Kinetics-400) | Speed (FPS) | Key Strength                                               |
| -------------------------- | ------------------------------------------------- | -------------------- | ----------- | ---------------------------------------------------------- |
| **TimeSformer**            | Vision Transformer + Divided Space-Time Attention | 80.7%                | 12          | Long-range temporal modeling                               |
| **VideoMAE**               | Masked Autoencoder for Video                      | 81.5%                | 10          | Self-supervised pre-training, works with less labeled data |
| **SlowFast**               | Dual-pathway CNN (slow + fast)                    | 79.8%                | 30          | Real-time capable, captures both appearance and motion     |
| **X-CLIP**                 | CLIP-based video understanding                    | 84.7%                | 8           | Zero-shot transfer to new action classes                   |
| **V-JEPA2**                | Joint Embedding Predictive Architecture           | ~85%+                | 6           | State-of-art as of 2025, 1B params                         |
| **Video Swin Transformer** | Shifted window attention for video                | 82.7%                | 15          | Good balance of accuracy and speed                         |
| **MViTv2**                 | Multiscale Vision Transformers                    | 82.9%                | 14          | Efficient multi-scale processing                           |

**Recommendation for OnlyKrida:**

- **MVP (real-time, mobile):** SlowFast R50 -- 30 FPS, good enough accuracy
- **Quality analysis (server-side):** VideoMAE-Large fine-tuned on sports data
- **Zero-shot (new sports):** X-CLIP for classifying actions without labeled data

#### Sport-Specific Action Classes

**Cricket Actions:**

```
bowling_delivery, batting_shot (cover_drive, pull, sweep, cut, flick, loft),
fielding_catch, fielding_throw, wicketkeeping, running_between_wickets,
appeal, celebration, bowling_runup, batting_stance, bowling_action_front_on,
bowling_action_side_on, spin_bowling (off_spin, leg_spin, googly)
```

**Football Actions:**

```
dribbling, passing (short, long, through_ball), shooting, heading,
tackling, crossing, free_kick, corner_kick, penalty, throw_in,
goalkeeping_save, goalkeeping_distribution, first_touch, turn,
sprint, change_of_direction, aerial_duel
```

**Kabaddi Actions:**

```
raid_attempt, successful_raid, raid_touch, raid_bonus, super_raid,
ankle_hold, thigh_hold, waist_hold, chain_tackle, block,
dash, hand_touch, toe_touch, frog_jump, dubki, running_hand_touch
```

**Athletics:**

```
sprint_start, sprint_drive_phase, sprint_maintenance, hurdle_clearance,
long_jump_approach, long_jump_takeoff, long_jump_flight, long_jump_landing,
javelin_approach, javelin_delivery, shot_put_glide, shot_put_release,
discus_wind_up, discus_release, high_jump_approach, high_jump_clearance
```

### 3.4 Pose Estimation (Stage 4)

#### Model Comparison

| Model                  | Keypoints             | Speed (FPS) | 3D Support           | Platform            | AP (COCO) |
| ---------------------- | --------------------- | ----------- | -------------------- | ------------------- | --------- |
| **MediaPipe Pose**     | 33                    | 30+         | Yes (BlazePose GHUM) | Mobile, Web, Python | ~75%      |
| **ViTPose-Large**      | 17 (COCO)             | 25          | No (2D only)         | Server              | 79.1%     |
| **RTMPose-L**          | 17 (COCO)             | 90+         | No                   | Server + Edge       | 76.3%     |
| **MoveNet Thunder**    | 17                    | 30+         | No                   | Mobile (TFLite)     | ~72%      |
| **OpenPose**           | 25 (body) + 21 (hand) | 8           | No                   | Server              | ~70%      |
| **MMPose (HRNet-W48)** | 17                    | 15          | No                   | Server              | 77.3%     |
| **MotionBERT**         | 17                    | 15          | Yes (3D lifting)     | Server              | 78.9%     |

**Recommendation for OnlyKrida:**

- **Mobile/real-time:** MediaPipe Pose (33 landmarks, 3D, runs on-device, free)
- **Server-side accuracy:** ViTPose-Large or RTMPose-L
- **3D biomechanics:** MediaPipe 3D output + MotionBERT for depth refinement

#### MediaPipe Pose: 33 Landmark Model

MediaPipe detects 33 body landmarks including:

- Face: nose, left/right eye (inner, outer), left/right ear
- Upper body: left/right shoulder, elbow, wrist, pinky, ring finger, index finger, thumb
- Torso: left/right hip
- Lower body: left/right knee, ankle, heel, foot index

Three model variants exist:

- **Lite:** Fastest, lowest accuracy (good for real-time mobile)
- **Full:** Balanced (recommended default)
- **Heavy:** Highest accuracy (for server-side analysis)

The 3D output uses GHUM (Generative Hand and body Unified Model) to estimate full 3D body pose from 2D input, giving x, y, z coordinates in world space.

### 3.5 Object Tracking (Stage 3)

#### Player and Ball Tracking

| Model         | Type                 | MOTA (MOT17) | Speed     | Best For                 |
| ------------- | -------------------- | ------------ | --------- | ------------------------ |
| **YOLOv8/v9** | Detector             | N/A          | 60+ FPS   | Real-time detection      |
| **RT-DETR**   | Transformer Detector | N/A          | 50+ FPS   | End-to-end detection     |
| **ByteTrack** | Tracker              | 80.3%        | Real-time | Multi-object tracking    |
| **BoT-SORT**  | Tracker              | 80.5%        | Real-time | Re-identification        |
| **DeepSORT**  | Tracker              | 75.4%        | Real-time | Classic, well-documented |

**Ball tracking is the hardest problem** in sports video analysis because:

- Ball is small (often <10 pixels in wide-angle footage)
- Ball moves fast (blur, motion artifacts)
- Frequent occlusions
- Similar-colored objects in background

**Solution for cricket ball tracking:**

```python
# Two-stage approach
# Stage 1: YOLOv8 detects ball candidates
# Stage 2: TrackNet-v2 (specialized ball tracking CNN) refines trajectory

# TrackNet architecture: modified U-Net that takes 3 consecutive frames
# and outputs a heatmap of ball position
# Paper: "TrackNet: A Deep Learning Network for Tracking High-speed
#         and Tiny Objects in Sports Applications"
```

### 3.6 Biomechanical Analysis from Pose Data

This is where OnlyKrida can provide unique value that no other scouting platform offers.

#### Joint Angle Computation

```python
import numpy as np

def compute_angle(point_a, point_b, point_c):
    """
    Compute angle at point_b formed by segments BA and BC.
    Points are (x, y, z) from pose estimation.
    """
    ba = np.array(point_a) - np.array(point_b)
    bc = np.array(point_c) - np.array(point_b)

    cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
    angle = np.degrees(np.arccos(np.clip(cosine, -1.0, 1.0)))
    return angle

# Example: Bowling arm angle at release
def bowling_arm_angle(landmarks):
    shoulder = landmarks[11]  # Left shoulder (MediaPipe index)
    elbow = landmarks[13]     # Left elbow
    wrist = landmarks[15]     # Left wrist
    return compute_angle(shoulder, elbow, wrist)

# Example: Knee flexion during batting backfoot punch
def batting_knee_angle(landmarks):
    hip = landmarks[23]       # Left hip
    knee = landmarks[25]      # Left knee
    ankle = landmarks[27]     # Left ankle
    return compute_angle(hip, knee, ankle)
```

#### Sport-Specific Biomechanical Metrics

**Cricket Bowling:**

| Metric                    | How to Compute                                                             | Why It Matters                                                                      |
| ------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Arm angle at release      | Angle between shoulder-elbow-wrist at ball release frame                   | Determines bowling type (pace vs spin), ICC legality (>15 degree flexion = illegal) |
| Front foot landing angle  | Hip-knee-ankle angle at front foot contact                                 | Affects pace generation, injury risk                                                |
| Trunk rotation speed      | Angular velocity of shoulder line between back-foot and front-foot contact | Key predictor of bowling speed                                                      |
| Follow-through length     | Distance hand travels after release                                        | Indicates effort and control                                                        |
| Run-up speed              | Hip center velocity during approach                                        | Correlates with bowling speed                                                       |
| Shoulder counter-rotation | Max angle between hip line and shoulder line during delivery stride        | Key biomechanical indicator, differentiates elite from amateur                      |

**Cricket Batting:**

| Metric                  | How to Compute                                       | Why It Matters                |
| ----------------------- | ---------------------------------------------------- | ----------------------------- |
| Bat backlift height     | Wrist height at top of backlift relative to shoulder | Timing window, shot selection |
| Weight transfer         | Hip center displacement from back foot to front foot | Power generation              |
| Head position stability | Variance of nose position during shot execution      | Balance, technique quality    |
| Follow-through arc      | Wrist trajectory after ball contact                  | Shot control                  |

**Kabaddi:**

| Metric                  | How to Compute                                                 | Why It Matters        |
| ----------------------- | -------------------------------------------------------------- | --------------------- |
| Raid reach distance     | Max wrist extension during touch attempt                       | Raiding effectiveness |
| Body angle during dubki | Minimum torso angle during evasion                             | Agility metric        |
| Tackle grip position    | Hand positions relative to raider body during ankle/thigh hold | Tackle technique      |
| Landing stability       | Center of mass oscillation after contact                       | Balance and strength  |

**Athletics (Sprinting):**

| Metric              | How to Compute                             | Why It Matters               |
| ------------------- | ------------------------------------------ | ---------------------------- |
| Stride length       | Distance between successive foot contacts  | Speed determinant            |
| Ground contact time | Duration of foot-ground contact per stride | Sprint efficiency            |
| Knee drive height   | Max knee height during flight phase        | Power application            |
| Forward lean angle  | Torso angle from vertical                  | Acceleration phase technique |
| Arm swing symmetry  | Left vs right elbow angle variance         | Running efficiency           |

### 3.7 How AiSCOUT Works (Reverse-Engineered Approach)

AiSCOUT is a UK-based football scouting platform that uses AI to assess players from smartphone video. Here is what we know about their approach and how OnlyKrida can build something similar:

#### AiSCOUT's Likely Technical Stack

Based on their public materials, patent filings, and product behavior:

1. **Structured Skill Tests:** Players perform standardized drills (dribbling courses, shooting tests, passing accuracy) filmed from specific angles. This is the key insight -- they control the test environment to make ML analysis reliable.

2. **Pose Estimation:** They extract body keypoints from video to analyze movement quality, likely using a model similar to MediaPipe or a custom pose estimator.

3. **Object Tracking:** Ball tracking during skill tests to measure accuracy, speed, and control.

4. **Biomechanical Scoring:** Compare extracted poses and movements against templates from professional players. Score deviation from ideal technique.

5. **Physical Attributes:** Estimate height, speed, agility from video without physical measurement devices.

6. **Cognitive/Decision Tests:** Some tests assess decision-making speed and game intelligence (likely separate from the video analysis pipeline).

7. **Normative Database:** All scores are compared against age-appropriate benchmarks to identify standout performers.

#### What OnlyKrida Should Replicate

| AiSCOUT Element           | OnlyKrida Adaptation                                                           |
| ------------------------- | ------------------------------------------------------------------------------ |
| Standardized skill tests  | Design sport-specific test protocols for cricket, kabaddi, athletics, football |
| Controlled filming angle  | In-app camera guide showing correct phone position                             |
| Benchmark database        | Build India-specific benchmarks per age group, state, competition level        |
| Scout network integration | Connect scored profiles to scout discovery feed                                |

#### What OnlyKrida Should Do Differently

| Difference                                                  | Rationale                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Support unstructured video (match footage, not just drills) | Indian athletes may not have access to standardized testing setups |
| Multi-sport from day 1                                      | India has diverse sporting culture beyond football                 |
| Vernacular language support                                 | Athlete profiles and feedback in Hindi, Tamil, Telugu, etc.        |
| Offline-first analysis                                      | Many Indian athletes have inconsistent internet access             |
| Lower camera quality tolerance                              | Most users will film on budget Android phones                      |

---

## 4. Recommendation Engine

### 4.1 Architecture Overview

OnlyKrida's recommendation engine matches athletes with scouts, coaches, and opportunities. This is a two-sided marketplace problem similar to job matching or dating apps.

```
                    +---------------------------+
                    |   Recommendation Engine    |
                    +---------------------------+
                    |                           |
         +----------+----------+    +-----------+-----------+
         |  Athlete Tower      |    |  Scout Tower          |
         |  (Content-Based)    |    |  (Collaborative)      |
         +----------+----------+    +-----------+-----------+
                    |                           |
         +----------+----------+    +-----------+-----------+
         | Sport, Age, Stats,  |    | Past views, saves,    |
         | Video features,     |    | messages, shortlists, |
         | Pose embeddings,    |    | sport preferences,    |
         | Location, Achievmts |    | org type, budget      |
         +---------------------+    +-----------------------+
                    |                           |
                    +--------- MATCH -----------+
                    |  Cosine similarity of     |
                    |  athlete & scout vectors  |
                    +---------------------------+
```

### 4.2 Collaborative Filtering

**Concept:** "Scouts who viewed/saved/shortlisted Athlete A also viewed/saved/shortlisted Athlete B."

#### Implementation with Implicit Feedback

```python
# Using implicit library (efficient for large-scale collaborative filtering)
import implicit
import scipy.sparse as sparse

# Build interaction matrix
# Rows = scouts, Columns = athletes
# Values = interaction strength
interaction_weights = {
    'profile_view': 1.0,
    'video_watch_50pct': 2.0,
    'video_watch_100pct': 3.0,
    'profile_save': 5.0,
    'shortlist_add': 8.0,
    'message_sent': 10.0,
    'trial_invite': 15.0,
}

# Build sparse matrix from interaction logs
scout_athlete_matrix = sparse.csr_matrix(
    (interaction_values, (scout_ids, athlete_ids)),
    shape=(n_scouts, n_athletes)
)

# Train ALS model
model = implicit.als.AlternatingLeastSquares(
    factors=128,        # Embedding dimension
    regularization=0.1,
    iterations=50,
    use_gpu=False       # Set True if GPU available
)
model.fit(scout_athlete_matrix)

# Get recommendations for a scout
scout_id = 42
recommendations = model.recommend(
    scout_id,
    scout_athlete_matrix[scout_id],
    N=20,
    filter_already_liked_items=True
)
```

### 4.3 Content-Based Filtering (Athlete Similarity)

#### Feature Engineering for Athlete Embeddings

```python
# Athlete feature vector construction
athlete_features = {
    # Categorical (one-hot or learned embeddings)
    'sport': 'cricket',           # 15-dim embedding
    'position': 'fast_bowler',    # 30-dim embedding
    'state': 'karnataka',         # 36-dim embedding
    'age_group': 'u19',           # 8-dim embedding

    # Numerical (normalized 0-1)
    'height_cm': 0.72,            # 1-dim
    'bowling_speed_kph': 0.65,    # 1-dim
    'batting_avg': 0.45,          # 1-dim
    'bowling_avg': 0.38,          # 1-dim

    # Video-derived (from ML pipeline)
    'pose_embedding': [0.12, ...],        # 64-dim from pose analysis
    'action_embedding': [0.34, ...],      # 128-dim from action recognition
    'technique_scores': [0.8, 0.7, ...],  # N-dim sport-specific scores

    # Engagement signals
    'profile_completeness': 0.85,  # 1-dim
    'video_count': 0.3,            # 1-dim (normalized)
    'avg_video_quality': 0.7,      # 1-dim
}

# Total embedding: ~300-500 dimensions
# Store in vector database for fast similarity search
```

#### Vector Database for Similarity Search

```python
# Using Qdrant (open-source, can self-host)
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance

client = QdrantClient(host="localhost", port=6333)

# Create collection
client.create_collection(
    collection_name="athletes",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
)

# Upsert athlete embeddings
client.upsert(
    collection_name="athletes",
    points=[{
        "id": athlete_id,
        "vector": athlete_embedding.tolist(),
        "payload": {
            "sport": "cricket",
            "age": 17,
            "state": "karnataka",
            "talent_score": 8.2,
        }
    }]
)

# Find similar athletes
results = client.search(
    collection_name="athletes",
    query_vector=target_embedding.tolist(),
    query_filter={"must": [{"key": "sport", "match": {"value": "cricket"}}]},
    limit=20
)
```

### 4.4 Two-Tower Model Architecture

The most production-ready approach for large-scale recommendation.

```
Scout Query Tower                    Athlete Candidate Tower
+------------------+                +------------------+
| Scout Features   |                | Athlete Features |
| - sport_pref     |                | - sport          |
| - org_type       |                | - age            |
| - past_signings  |                | - stats          |
| - location       |                | - video_embed    |
| - budget         |                | - pose_embed     |
+--------+---------+                +--------+---------+
         |                                   |
    [Dense 256]                         [Dense 256]
    [BatchNorm]                         [BatchNorm]
    [ReLU]                              [ReLU]
    [Dense 128]                         [Dense 128]
    [L2 Normalize]                      [L2 Normalize]
         |                                   |
    scout_embedding                   athlete_embedding
    (128-dim)                          (128-dim)
         |                                   |
         +---------- dot product ------------+
         |
    relevance_score
```

```python
import torch
import torch.nn as nn

class TwoTowerModel(nn.Module):
    def __init__(self, scout_feature_dim, athlete_feature_dim, embed_dim=128):
        super().__init__()

        self.scout_tower = nn.Sequential(
            nn.Linear(scout_feature_dim, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, embed_dim),
        )

        self.athlete_tower = nn.Sequential(
            nn.Linear(athlete_feature_dim, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, embed_dim),
        )

    def forward(self, scout_features, athlete_features):
        scout_embed = nn.functional.normalize(
            self.scout_tower(scout_features), dim=1
        )
        athlete_embed = nn.functional.normalize(
            self.athlete_tower(athlete_features), dim=1
        )
        score = (scout_embed * athlete_embed).sum(dim=1)
        return score, scout_embed, athlete_embed

# Training with in-batch negatives (efficient)
# Positive pairs: (scout, athlete) where scout interacted
# Negative pairs: all other athletes in the batch
# Loss: InfoNCE / NT-Xent contrastive loss
```

**Why two-tower for OnlyKrida:**

- Scout embeddings are pre-computed and cached (fast serving)
- Athlete embeddings update when new data arrives
- Scales to millions of athletes with approximate nearest neighbor search
- Industry standard at LinkedIn, YouTube, Pinterest for similar problems

### 4.5 Graph Neural Networks for Talent Network Analysis

Sports talent networks have natural graph structure:

```
Nodes: Athletes, Coaches, Teams, Academies, Scouts, Competitions
Edges: trained_with, coached_by, competed_against, scouted_by, same_academy

Insight: "Athletes from Coach X's academy who were scouted by Scout Y
          tend to succeed at Level Z. This new athlete from the same
          academy has similar stats -- recommend to Scout Y."
```

```python
# Using PyTorch Geometric
import torch
from torch_geometric.nn import SAGEConv

class TalentGraphNet(torch.nn.Module):
    def __init__(self, in_channels, hidden_channels, out_channels):
        super().__init__()
        self.conv1 = SAGEConv(in_channels, hidden_channels)
        self.conv2 = SAGEConv(hidden_channels, out_channels)

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index).relu()
        x = torch.nn.functional.dropout(x, p=0.3, training=self.training)
        x = self.conv2(x, edge_index)
        return x

# Use case: Link prediction
# "Will Scout S shortlist Athlete A?"
# Train on historical shortlist edges, predict new ones
```

**When to implement:** Month 6+ when you have enough network data (10K+ nodes, 50K+ edges).

### 4.6 Cold Start Problem Solutions

| Scenario                        | Solution                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| **New athlete, no video**       | Content-based: recommend based on profile similarity (sport, age, location, stats)                  |
| **New athlete, has video**      | Video embeddings immediately place them in the right neighborhood                                   |
| **New scout, no history**       | Onboarding questionnaire (preferred sport, age range, position, location) to initialize preferences |
| **New scout, few interactions** | Popularity-based fallback: show trending/highest-rated athletes in their sport                      |
| **New sport on platform**       | CLIP zero-shot embeddings for cross-sport similarity; transfer learning from related sports         |

### 4.7 Explainable Recommendations

Scouts need to understand WHY an athlete was recommended. Black-box "you might like" is insufficient for professional scouting decisions.

```python
# Explanation generation
explanation = {
    "athlete_id": "a_12345",
    "athlete_name": "Rahul Sharma",
    "recommendation_score": 0.92,
    "reasons": [
        {
            "type": "similar_to_shortlisted",
            "detail": "Similar bowling action to 3 players you shortlisted last month",
            "weight": 0.35
        },
        {
            "type": "standout_metric",
            "detail": "Bowling speed (138 kph) is in the top 5% for U-19 fast bowlers",
            "weight": 0.25
        },
        {
            "type": "trending",
            "detail": "Profile views increased 400% this week after state tournament",
            "weight": 0.20
        },
        {
            "type": "location_match",
            "detail": "Based in Karnataka, matching your regional preference",
            "weight": 0.10
        },
        {
            "type": "video_quality",
            "detail": "Technique score: 8.2/10 based on biomechanical analysis",
            "weight": 0.10
        }
    ]
}
```

**Implementation:** Use SHAP (SHapley Additive exPlanations) or attention weights from the two-tower model to generate post-hoc explanations.

---

## 5. Performance Prediction Models

### 5.1 Breakout Prediction

**Question:** "Will this 16-year-old district-level cricketer play at the national level by age 21?"

#### Feature Engineering

```python
breakout_features = {
    # Performance trajectory (time series)
    'stats_improvement_rate': 0.15,      # Year-over-year improvement
    'competition_level_progression': [1, 2, 3],  # District -> State -> National
    'age_at_current_level': 16,
    'years_at_current_level': 1.5,

    # Physical development
    'height_percentile_for_age': 0.75,
    'physical_maturity_estimate': 0.6,   # Early/average/late bloomer

    # Biomechanical indicators
    'technique_score': 7.8,
    'technique_consistency': 0.82,       # Std dev of technique scores over time
    'biomechanical_efficiency': 0.71,    # How close to optimal movement patterns

    # Contextual
    'coaching_quality_index': 0.65,      # Based on coach's track record
    'academy_success_rate': 0.12,        # % of academy graduates reaching next level
    'competition_strength': 0.55,        # Normalized difficulty of opponents faced

    # Behavioral
    'training_consistency': 0.88,        # Upload/activity frequency
    'engagement_score': 0.72,            # Platform activity
}
```

#### Model Architecture

```python
# Gradient Boosted Trees work best for tabular prediction with limited data
# Use XGBoost or LightGBM

import lightgbm as lgb

# Binary classification: will reach next level within 3 years?
params = {
    'objective': 'binary',
    'metric': 'auc',
    'num_leaves': 31,
    'learning_rate': 0.05,
    'feature_fraction': 0.8,
    'bagging_fraction': 0.8,
    'bagging_freq': 5,
    'verbose': -1,
}

# With time series features, use temporal validation
# Train on athletes who were 16 in 2018-2020
# Validate on athletes who were 16 in 2021
# Test on athletes who were 16 in 2022
# This prevents data leakage from future information
```

**Critical note:** You need at least 2-3 years of historical data before breakout prediction is reliable. Start collecting data immediately, build the model later.

### 5.2 Injury Risk Modeling

| Feature Category   | Examples                                                                       |
| ------------------ | ------------------------------------------------------------------------------ |
| **Training load**  | Weekly training hours, intensity, acute:chronic workload ratio                 |
| **Biomechanics**   | Asymmetry in joint angles, deviations from safe movement patterns              |
| **Growth**         | Rapid height growth (PHV - Peak Height Velocity) increases injury risk         |
| **History**        | Previous injuries, recovery patterns                                           |
| **Sport-specific** | Fast bowlers: >30 deliveries/week at high intensity; sprinters: hamstring load |

```python
# Acute:Chronic Workload Ratio (ACWR)
# Key injury risk indicator from sports science
def compute_acwr(daily_loads, acute_window=7, chronic_window=28):
    """
    ACWR > 1.5 = high injury risk
    ACWR 0.8-1.3 = sweet spot
    ACWR < 0.8 = detraining risk
    """
    acute = np.mean(daily_loads[-acute_window:])
    chronic = np.mean(daily_loads[-chronic_window:])
    return acute / (chronic + 1e-8)
```

### 5.3 Career Trajectory Clustering

**Concept:** Find historical athletes with similar profiles at age X, then see where they ended up.

```python
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# Feature matrix: athletes at age 16
# Each row = one athlete's profile at age 16
# Features: stats, physical attributes, competition level, etc.

scaler = StandardScaler()
X_scaled = scaler.fit_transform(athlete_features_at_16)

# Find natural clusters
kmeans = KMeans(n_clusters=8, random_state=42)
clusters = kmeans.fit_predict(X_scaled)

# Label clusters by where athletes ended up
cluster_outcomes = {
    0: "International level (top 2%)",
    1: "National level, first-class cricket (top 10%)",
    2: "State level, consistent performer (top 25%)",
    3: "University/college level (top 40%)",
    # ... etc
}

# For a new athlete, find their cluster and show:
# "Athletes with your profile at age 16 went on to:
#  - 15% played international cricket
#  - 35% played first-class cricket
#  - 30% played state-level
#  - 20% did not progress beyond district"
```

### 5.4 Market Value Estimation

More relevant for football and cricket where transfer markets exist.

| Input Features                   | Source                        |
| -------------------------------- | ----------------------------- |
| Age, position, nationality       | Profile                       |
| Current competition level        | Match data                    |
| Performance statistics           | Match data                    |
| Social media following           | APIs                          |
| Comparable player transactions   | Transfermarkt, public records |
| Potential score (breakout model) | Internal model                |
| Injury history                   | Medical records               |
| Contract status                  | Public records                |

**Model:** Regression (LightGBM or neural network) trained on historical transfer values. For Indian sports, this is less relevant initially but becomes important as leagues grow.

---

## 6. Model Training Infrastructure & Costs

### 6.1 Compute Options Comparison

| Platform                     | GPU Options    | Cost/hr (A100)  | Free Tier           | Best For                       |
| ---------------------------- | -------------- | --------------- | ------------------- | ------------------------------ |
| **Modal.com**                | T4 to H200     | $2.50/hr (80GB) | $30/month credits   | Serverless GPU, fast iteration |
| **Google Colab Pro**         | T4, A100       | $12/month       | Limited free        | Prototyping, notebooks         |
| **Lambda Cloud**             | A100, H100     | $1.25/hr (A100) | None                | Long training runs             |
| **AWS SageMaker**            | All            | $4.10/hr (A100) | Free tier (limited) | Enterprise MLOps               |
| **Vast.ai**                  | Community GPUs | $0.50-1.50/hr   | None                | Cheapest option                |
| **RunPod**                   | A100, H100     | $1.64/hr (A100) | None                | Simple GPU rental              |
| **Google Cloud (Vertex AI)** | T4, A100, TPU  | $3.67/hr (A100) | $300 credits        | GCP ecosystem                  |

**Recommendation for OnlyKrida (startup budget):**

| Phase       | Platform                           | Monthly Budget              | What to Train                         |
| ----------- | ---------------------------------- | --------------------------- | ------------------------------------- |
| Month 1-3   | Google Colab Pro + Modal free tier | Rs 1,000-2,000 ($12-25)     | Sport detection, fine-tuning CLIP     |
| Month 4-6   | Modal.com paid                     | Rs 8,000-15,000 ($100-180)  | Action recognition, pose models       |
| Month 7-9   | Lambda Cloud or Vast.ai            | Rs 15,000-30,000 ($180-360) | Video analysis pipeline, large models |
| Month 10-12 | Same + dedicated inference         | Rs 25,000-50,000 ($300-600) | Full pipeline, production serving     |

### 6.2 Modal.com GPU Pricing (As of March 2026)

| GPU       | Cost/second | Cost/hour | Cost for 10-hour training job |
| --------- | ----------- | --------- | ----------------------------- |
| T4        | $0.000164   | $0.59     | $5.90                         |
| L4        | $0.000222   | $0.80     | $8.00                         |
| A10       | $0.000306   | $1.10     | $11.00                        |
| L40S      | $0.000542   | $1.95     | $19.50                        |
| A100 40GB | $0.000583   | $2.10     | $21.00                        |
| A100 80GB | $0.000694   | $2.50     | $25.00                        |
| H100      | $0.001097   | $3.95     | $39.50                        |
| H200      | $0.001261   | $4.54     | $45.40                        |

Modal charges per-second and includes $30/month free credits, making it ideal for burst training jobs.

### 6.3 MLOps Pipeline

```
Code Changes (Git)
       |
       v
[DVC] Data Version Control
  - Track dataset versions
  - Store large files in S3/GCS
  - Reproduce experiments
       |
       v
[W&B / MLflow] Experiment Tracking
  - Log hyperparameters
  - Track metrics (loss, accuracy, F1)
  - Compare experiments
  - Store model artifacts
       |
       v
[Modal / SageMaker] Training
  - Distributed training on GPUs
  - Hyperparameter sweeps
  - Automated retraining on new data
       |
       v
[MLflow Model Registry]
  - Version models
  - Stage: staging -> production
  - A/B test assignments
       |
       v
[FastAPI + Cloud Run] Serving
  - REST API for predictions
  - Auto-scaling (0 to N instances)
  - <100ms inference latency
       |
       v
[Prometheus + Grafana] Monitoring
  - Inference latency
  - Model accuracy drift
  - Data distribution shift
  - Error rates
```

#### Recommended Tools for OnlyKrida

| Tool                       | Purpose                        | Cost                                |
| -------------------------- | ------------------------------ | ----------------------------------- |
| **Weights & Biases (W&B)** | Experiment tracking            | Free for personal, $50/mo for teams |
| **DVC**                    | Data/model versioning          | Free (open source)                  |
| **MLflow**                 | Model registry, serving        | Free (open source)                  |
| **FastAPI**                | Model serving API              | Free (open source)                  |
| **Google Cloud Run**       | Serverless serving             | Pay per request (~$0.00002/request) |
| **Supabase**               | Feature store (reuse existing) | Already using                       |
| **GitHub Actions**         | CI/CD for ML pipelines         | Free for public repos               |

### 6.4 Feature Store Design

Use Supabase (already in OnlyKrida's stack) as a simple feature store.

```sql
-- Athlete features table (updated by ML pipeline)
CREATE TABLE athlete_features (
    athlete_id UUID REFERENCES profiles(id),
    feature_version INT DEFAULT 1,

    -- Sport detection features
    primary_sport TEXT,
    sport_confidence FLOAT,

    -- Video-derived features
    technique_score FLOAT,
    action_embedding VECTOR(128),    -- pgvector extension
    pose_embedding VECTOR(64),

    -- Statistical features
    performance_percentile FLOAT,
    improvement_rate FLOAT,
    consistency_score FLOAT,

    -- Prediction outputs
    breakout_probability FLOAT,
    injury_risk_score FLOAT,
    talent_composite_score FLOAT,

    -- Metadata
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    model_version TEXT,

    PRIMARY KEY (athlete_id, feature_version)
);

-- Enable pgvector for similarity search
CREATE EXTENSION IF NOT EXISTS vector;
CREATE INDEX ON athlete_features
    USING ivfflat (action_embedding vector_cosine_ops) WITH (lists = 100);
```

### 6.5 Model Serving Architecture

```
                    +------------------+
                    |  React Native    |
                    |  Mobile App      |
                    +--------+---------+
                             |
                    +--------v---------+
                    |  Supabase Edge   |
                    |  Functions       |
                    |  (API Gateway)   |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
    +---------v----------+       +----------v---------+
    |  Cloud Run         |       |  Edge / On-Device  |
    |  (Heavy Models)    |       |  (Light Models)    |
    |                    |       |                    |
    |  - VideoMAE        |       |  - MediaPipe Pose  |
    |  - TimeSformer     |       |  - MoveNet         |
    |  - Two-Tower Rec   |       |  - Sport Detection |
    |  - Breakout Pred   |       |  - TFLite models   |
    +--------------------+       +--------------------+
```

**Edge inference for mobile (ONNX/TFLite):**

| Model                             | Original Size | Quantized Size | Mobile Inference                  |
| --------------------------------- | ------------- | -------------- | --------------------------------- |
| EfficientNet-B4 (sport detection) | 75MB          | 19MB (INT8)    | 15ms on Pixel 6                   |
| MediaPipe Pose (Lite)             | 3MB           | 3MB            | 8ms on Pixel 6                    |
| MoveNet Thunder                   | 13MB          | 6MB (FP16)     | 12ms on Pixel 6                   |
| CLIP ViT-B/32                     | 340MB         | 85MB (INT8)    | Too large for mobile, server only |

---

## 7. Bittensor / Decentralized AI Integration

### 7.1 How Bittensor Subnets Work

Bittensor is a decentralized network where AI models compete to provide the best outputs. Key concepts:

| Concept            | Description                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| **TAO**            | Native token, used for staking and rewards                                                     |
| **Subnet**         | A specialized network focused on one task (e.g., text generation, image gen, sports analytics) |
| **Miner**          | Runs ML models to produce outputs; earns TAO based on quality                                  |
| **Validator**      | Evaluates miner outputs; earns TAO for honest validation                                       |
| **Emissions**      | TAO tokens distributed to subnets, then to miners/validators based on performance              |
| **Netuid**         | Unique identifier for each subnet (e.g., SN44 for Score Vision)                                |
| **Registration**   | Requires TAO stake to register as miner or validator                                           |
| **Yuma Consensus** | Mechanism that determines reward distribution based on validator agreement                     |

#### Subnet Economics

- Creating a new subnet costs ~200+ TAO (varies with network demand)
- As of early 2026, 1 TAO is approximately $200-400 (highly volatile)
- Subnet creation cost: approximately $40,000-80,000 at current prices
- Miners and validators must also stake TAO to participate
- Subnet must attract sufficient stake or faces deregistration

### 7.2 Could OnlyKrida Run Its Own Subnet?

#### Potential Subnet Design: "Sports Talent Analytics"

```
Subnet: Sports Talent Analytics (hypothetical)

Miners would:
  - Process uploaded sports videos
  - Extract pose data, action labels, technique scores
  - Generate athlete embeddings
  - Run breakout prediction models

Validators would:
  - Compare miner outputs against ground truth labels
  - Use reference models to verify quality
  - Score miners on accuracy, speed, and consistency

Incentive:
  - Better models earn more TAO
  - Competition drives model improvement
  - OnlyKrida gets access to decentralized GPU compute
```

#### Pros of Running a Bittensor Subnet

| Pro                            | Detail                                                         |
| ------------------------------ | -------------------------------------------------------------- |
| **Decentralized compute**      | Access GPU power from miners worldwide without owning hardware |
| **Competition-driven quality** | Miners compete to build the best sports analysis models        |
| **Token economics**            | OnlyKrida could potentially earn from subnet ownership         |
| **Open innovation**            | External researchers can contribute models                     |
| **Censorship resistance**      | No single point of failure                                     |

#### Cons of Running a Bittensor Subnet

| Con                    | Detail                                                                           |
| ---------------------- | -------------------------------------------------------------------------------- |
| **High entry cost**    | 200+ TAO ($40K-80K) just to create the subnet                                    |
| **Complexity**         | Building and maintaining subnet infrastructure is a full-time engineering effort |
| **Validator overhead** | You need reliable, accurate validation -- hard for subjective sports analysis    |
| **Latency**            | Decentralized inference is slower than centralized (not suitable for real-time)  |
| **Data privacy**       | Athlete video data would be sent to unknown miners -- privacy and consent issues |
| **Crypto volatility**  | TAO price fluctuations affect economics                                          |
| **Small community**    | Finding miners interested in sports analytics is harder than general AI tasks    |
| **Regulatory risk**    | Crypto-related products face regulatory uncertainty in India (RBI guidelines)    |

### 7.3 Recommendation: Centralized ML for Now, Bittensor Later

**For a startup at OnlyKrida's stage, decentralized AI adds complexity without proportional benefit.**

| Decision Factor | Centralized                | Decentralized (Bittensor)                        |
| --------------- | -------------------------- | ------------------------------------------------ |
| Time to market  | 2-3 months                 | 6-12 months                                      |
| Cost (Year 1)   | Rs 2-5 lakh ($2,500-6,000) | Rs 30-65 lakh ($40,000-80,000) TAO + engineering |
| Data privacy    | Full control               | Videos sent to unknown miners                    |
| Latency         | <100ms                     | 1-10 seconds                                     |
| Scalability     | Auto-scale with cloud      | Depends on miner availability                    |
| Innovation      | Internal team only         | Open competition                                 |

**Recommended approach:**

1. **Now (2026):** Build centralized ML pipeline on Modal.com + Cloud Run
2. **Later (2027+):** Once product-market fit is proven and user base grows, consider:
   - Using Score Vision's API (when available) for football analysis
   - Leveraging other Bittensor subnets for general video processing
   - Only build own subnet if there is a clear economic case and 50K+ daily video uploads

### 7.4 Leveraging Existing Bittensor Subnets

Instead of building a subnet, OnlyKrida can consume outputs from existing ones:

| Subnet                        | Use Case for OnlyKrida                               |
| ----------------------------- | ---------------------------------------------------- |
| **SN44 (Score Vision)**       | Football game state data for match analysis features |
| **SN19 (Vision)**             | General image/video processing tasks                 |
| **SN5 (OpenKaito)**           | Search and data mining for player news/social data   |
| **SN8 (Proprietary Trading)** | Not directly relevant but model for incentive design |

**Access pattern:** Once APIs are available, consume them as microservices within OnlyKrida's backend. No need to run miners or validators.

---

## 8. Implementation Roadmap (12-Month Plan)

### Month 1-2: Foundation & Behavioral Data

**Goal:** Launch behavioral tracking, build the data flywheel.

#### Engineering Tasks

| Task                                                                 | Priority | Effort  |
| -------------------------------------------------------------------- | -------- | ------- |
| Implement event tracking (views, saves, shares, watch time) in app   | P0       | 1 week  |
| Design and create `athlete_features` table in Supabase               | P0       | 2 days  |
| Build basic popularity-based "trending athletes" feed                | P0       | 1 week  |
| Set up Weights & Biases account for experiment tracking              | P1       | 1 day   |
| Implement video upload quality validation (min resolution, duration) | P1       | 3 days  |
| Design annotation schema for video labeling                          | P1       | 2 days  |
| Begin manual data collection: Khelo India results, state records     | P1       | Ongoing |

#### ML Tasks

| Task                                                            | Priority | Effort  |
| --------------------------------------------------------------- | -------- | ------- |
| Deploy CLIP zero-shot sport detection as Supabase Edge Function | P0       | 3 days  |
| Build simple content-based recommendation (profile similarity)  | P0       | 1 week  |
| Set up DVC for data versioning                                  | P1       | 1 day   |
| Begin collecting and labeling 500 video clips per sport         | P1       | Ongoing |

#### Expected Outcomes

- Basic "you might like" recommendations based on sport + location + age
- Automatic sport tagging on uploaded videos
- Behavioral data flowing into analytics

### Month 3-4: Video Analysis MVP

**Goal:** Extract meaningful signals from athlete videos.

#### Engineering Tasks

| Task                                                                | Priority | Effort  |
| ------------------------------------------------------------------- | -------- | ------- |
| Integrate MediaPipe Pose into video processing pipeline             | P0       | 1 week  |
| Build server-side video analysis worker (Modal.com)                 | P0       | 2 weeks |
| Implement basic technique scoring for 2 sports (cricket + football) | P0       | 2 weeks |
| Design in-app camera guide for standard video recording angles      | P1       | 1 week  |
| Build video annotation tool for internal labeling team              | P1       | 1 week  |

#### ML Tasks

| Task                                                                | Priority | Effort  |
| ------------------------------------------------------------------- | -------- | ------- |
| Fine-tune EfficientNet-B4 on collected sports dataset               | P0       | 1 week  |
| Implement bowling action analysis (arm angle, speed estimation)     | P0       | 2 weeks |
| Build pose similarity search (find athletes with similar technique) | P1       | 1 week  |
| Train initial action recognition model (SlowFast R50)               | P1       | 2 weeks |
| Compute biomechanical features from pose data                       | P1       | 1 week  |

#### Expected Outcomes

- Technique scores visible on athlete profiles
- "Athletes with similar technique" feature
- Automated bowling/batting analysis for cricket
- 80%+ sport detection accuracy

### Month 5-6: Advanced Recommendations

**Goal:** Build the hybrid recommendation engine.

#### Engineering Tasks

| Task                                                          | Priority | Effort  |
| ------------------------------------------------------------- | -------- | ------- |
| Implement collaborative filtering (implicit library)          | P0       | 2 weeks |
| Build two-tower recommendation model                          | P0       | 3 weeks |
| Set up Qdrant vector database for athlete embeddings          | P0       | 1 week  |
| Implement A/B testing framework for recommendation algorithms | P1       | 1 week  |
| Build explainable recommendation cards ("Why this athlete")   | P1       | 1 week  |

#### ML Tasks

| Task                                                     | Priority | Effort  |
| -------------------------------------------------------- | -------- | ------- |
| Train two-tower model on behavioral data                 | P0       | 2 weeks |
| Generate athlete embeddings from video + stats + profile | P0       | 1 week  |
| Implement cold-start solutions                           | P0       | 1 week  |
| Build scout preference learning from interaction history | P1       | 2 weeks |

#### Expected Outcomes

- Personalized athlete recommendations per scout
- "Scouts who viewed X also viewed Y" feature
- Explainable recommendation reasons
- 20%+ improvement in scout engagement metrics

### Month 7-9: Full Video Analysis Pipeline

**Goal:** Production-grade video analysis across all major Indian sports.

#### Engineering Tasks

| Task                                                         | Priority | Effort  |
| ------------------------------------------------------------ | -------- | ------- |
| Deploy VideoMAE for detailed action recognition              | P0       | 2 weeks |
| Implement ball tracking (TrackNet) for cricket               | P0       | 3 weeks |
| Build kabaddi raid/tackle analysis pipeline                  | P0       | 3 weeks |
| Implement player tracking (ByteTrack) for team sports        | P1       | 2 weeks |
| Build athletics analysis (sprint form, throwing mechanics)   | P1       | 3 weeks |
| Optimize inference pipeline (<5 second processing per video) | P1       | 2 weeks |

#### ML Tasks

| Task                                               | Priority | Effort  |
| -------------------------------------------------- | -------- | ------- |
| Fine-tune VideoMAE on Indian sports action dataset | P0       | 2 weeks |
| Train sport-specific technique scoring models      | P0       | 4 weeks |
| Build graph neural network for talent network      | P1       | 3 weeks |
| Implement automated video highlight extraction     | P1       | 2 weeks |

#### Expected Outcomes

- Detailed technique analysis for cricket, football, kabaddi, athletics
- Ball tracking and trajectory analysis
- Sport-specific action recognition (bowling types, raid types, etc.)
- Automated highlight clips from full match videos

### Month 10-12: Prediction Models & Scale

**Goal:** Predictive analytics, wearable integration, production hardening.

#### Engineering Tasks

| Task                                              | Priority | Effort  |
| ------------------------------------------------- | -------- | ------- |
| Build breakout prediction model                   | P0       | 3 weeks |
| Implement career trajectory clustering            | P0       | 2 weeks |
| Integrate wearable data (Catapult/STATSports API) | P1       | 2 weeks |
| Build injury risk dashboard for coaches           | P1       | 2 weeks |
| Implement model monitoring and drift detection    | P1       | 2 weeks |
| Production hardening: caching, CDN, auto-scaling  | P0       | 2 weeks |
| Build public API for third-party integrations     | P2       | 3 weeks |

#### ML Tasks

| Task                                                       | Priority | Effort  |
| ---------------------------------------------------------- | -------- | ------- |
| Train breakout prediction on historical data               | P0       | 3 weeks |
| Build injury risk model with biomechanical inputs          | P1       | 3 weeks |
| Implement continuous model retraining pipeline             | P1       | 2 weeks |
| Train market value estimation model (for cricket/football) | P2       | 2 weeks |
| Explore Bittensor integration (Score Vision API)           | P2       | 1 week  |

#### Expected Outcomes

- "Breakout potential" score on every athlete profile
- Career trajectory predictions ("athletes like you went on to...")
- Injury risk alerts for coaches
- Wearable data integration for physical metrics
- Production system handling 10K+ daily video uploads

---

## Appendix A: Key Open-Source Models & Libraries

| Category            | Model/Library | License                 | Link                                                              |
| ------------------- | ------------- | ----------------------- | ----------------------------------------------------------------- |
| Sport Detection     | CLIP (OpenAI) | MIT                     | huggingface.co/openai/clip-vit-base-patch32                       |
| Sport Detection     | EfficientNet  | Apache 2.0              | github.com/google/automl                                          |
| Action Recognition  | TimeSformer   | CC-BY-NC                | huggingface.co/facebook/timesformer-base-finetuned-k400           |
| Action Recognition  | VideoMAE      | CC-BY-NC                | huggingface.co/MCG-NJU/videomae-base                              |
| Action Recognition  | SlowFast      | Apache 2.0              | github.com/facebookresearch/SlowFast                              |
| Action Recognition  | X-CLIP        | MIT                     | huggingface.co/microsoft/xclip-base-patch32                       |
| Pose Estimation     | MediaPipe     | Apache 2.0              | ai.google.dev/edge/mediapipe                                      |
| Pose Estimation     | ViTPose       | Apache 2.0              | github.com/ViTAE-Transformer/ViTPose                              |
| Pose Estimation     | RTMPose       | Apache 2.0              | github.com/open-mmlab/mmpose                                      |
| Object Detection    | YOLOv8        | AGPL-3.0                | github.com/ultralytics/ultralytics                                |
| Object Tracking     | ByteTrack     | MIT                     | github.com/ifzhang/ByteTrack                                      |
| Ball Tracking       | TrackNet      | MIT                     | github.com/Chang-Chia-Chi/TrackNet-Badminton-Tracking-tensorflow2 |
| Recommendations     | implicit      | MIT                     | github.com/benfred/implicit                                       |
| Vector Search       | Qdrant        | Apache 2.0              | github.com/qdrant/qdrant                                          |
| Graph Neural Nets   | PyG           | MIT                     | github.com/pyg-team/pytorch_geometric                             |
| Experiment Tracking | W&B           | Proprietary (free tier) | wandb.ai                                                          |
| Data Versioning     | DVC           | Apache 2.0              | dvc.org                                                           |
| Model Registry      | MLflow        | Apache 2.0              | mlflow.org                                                        |
| Annotation          | CVAT          | MIT                     | github.com/cvat-ai/cvat                                           |
| Annotation          | Label Studio  | Apache 2.0              | github.com/HumanSignal/label-studio                               |

## Appendix B: India-Specific Considerations

### Infrastructure Challenges

| Challenge                                 | Mitigation                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Low bandwidth in rural areas              | Offline-first video analysis with on-device ML; sync when connected                              |
| Budget Android phones                     | Use TFLite quantized models (INT8); target Snapdragon 600-series+                                |
| Varied video quality                      | Train models on augmented low-quality video (compression artifacts, shaky cam)                   |
| Hindi/regional language needs             | Use multilingual CLIP for zero-shot in multiple languages                                        |
| Data privacy (IT Act 2000, DPDP Act 2023) | Store data in Indian data centers (Mumbai/Hyderabad region); explicit consent for video analysis |

### Regulatory Considerations

| Regulation                                           | Impact                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **DPDP Act 2023** (Digital Personal Data Protection) | Athlete consent required for video processing and biometric analysis                  |
| **IT Act 2000**                                      | Data stored in India for Indian citizens; security practices required                 |
| **BCCI/AIFF regulations**                            | May restrict commercial use of match footage; need licensing                          |
| **Minor athletes**                                   | Parental consent required for athletes under 18; extra data protections               |
| **RBI guidelines**                                   | If integrating crypto/Bittensor, follow latest RBI guidance on virtual digital assets |

## Appendix C: Cost Summary (12-Month Projection)

| Category                     | Monthly Cost (INR)   | Monthly Cost (USD) | Annual Total (USD)    |
| ---------------------------- | -------------------- | ------------------ | --------------------- |
| GPU Compute (Modal/Lambda)   | 8,000 - 50,000       | $100 - $600        | $1,200 - $7,200       |
| Annotation Team (3-5 people) | 60,000 - 100,000     | $720 - $1,200      | $8,640 - $14,400      |
| W&B Team Plan                | 4,000                | $50                | $600                  |
| Cloud Run (Inference)        | 2,000 - 15,000       | $25 - $180         | $300 - $2,160         |
| Vector DB (Qdrant Cloud)     | 0 - 8,000            | $0 - $100          | $0 - $1,200           |
| Data Storage (S3/GCS)        | 2,000 - 8,000        | $25 - $100         | $300 - $1,200         |
| **Total Year 1**             | **76,000 - 181,000** | **$920 - $2,230**  | **$11,040 - $26,760** |

**Key insight:** The biggest cost is not compute but human annotation labor. Invest in active learning early to reduce this cost by 60-80%.

---

_This document should be treated as a living guide. Update it as new models are released, data is collected, and the product evolves. The ML landscape moves fast -- what is state-of-art today may be superseded in 6 months._
