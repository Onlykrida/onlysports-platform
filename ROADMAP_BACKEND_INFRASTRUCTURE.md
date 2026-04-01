# OnlyKrida -- Backend & Infrastructure Roadmap

**Last updated:** 2026-03-12
**Current state:** Supabase Free tier, 13 tables, direct client calls from React Native/Expo
**Target state:** 500K+ athletes, sub-200ms API responses, video pipeline, ML inference, multi-channel notifications

---

## Table of Contents

1. [Database Architecture Evolution](#1-database-architecture-evolution)
2. [API Architecture](#2-api-architecture)
3. [Video Pipeline](#3-video-pipeline)
4. [Search & Discovery](#4-search--discovery)
5. [Analytics & Event Tracking](#5-analytics--event-tracking)
6. [Notification System](#6-notification-system)
7. [Security & Compliance](#7-security--compliance)
8. [Scaling Strategy](#8-scaling-strategy)
9. [Integration Points](#9-integration-points)
10. [DevOps & CI/CD](#10-devops--cicd)
11. [Cost Estimates](#11-cost-estimates)
12. [Implementation Timeline](#12-implementation-timeline)

---

## 1. Database Architecture Evolution

### 1.1 Current Schema (13 tables)

```
profiles, posts, opportunities, applications, follows, likes,
comments, comment_likes, messages, notifications,
player_stats, scout_preferences, ai_recommendations
```

Key observations from the canonical schema audit:

- `profiles.achievements` and `profiles.stats` are JSONB blobs with no schema enforcement.
- `profiles.location` is a plain text field -- no geocoding, no coordinates.
- `player_stats` has only three numeric columns (skill, speed, stamina) -- too simplistic for real scouting.
- No tables for video analysis, wearable data, training logs, competition results, or verification.
- All counter columns (followers_count, likes_count, etc.) are maintained by triggers -- this works at small scale but creates write contention at 500K+ users.
- The `analytics_events` table exists but is orphaned (no foreign key to profiles, references auth.users directly).

### 1.2 New Tables -- Phase 1 (MVP+, 0-10K users)

#### video_analysis_results

Stores AI/ML analysis output for uploaded highlight videos.

```sql
CREATE TABLE IF NOT EXISTS public.video_analysis_results (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    player_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sport           text NOT NULL,
    analysis_type   text NOT NULL CHECK (analysis_type IN (
                        'pose_estimation', 'action_recognition',
                        'speed_tracking', 'technique_score', 'highlight_detection'
                    )),
    results         jsonb NOT NULL DEFAULT '{}'::jsonb,
    -- Example results for cricket batting:
    -- {"bat_speed_kmh": 142, "footwork_score": 7.8, "shot_types": ["cover_drive", "pull"], "confidence": 0.87}
    model_version   text NOT NULL DEFAULT 'v1',
    processing_ms   integer,  -- how long inference took
    status          text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message   text,
    created_at      timestamptz DEFAULT now(),
    completed_at    timestamptz
);

CREATE INDEX idx_video_analysis_post_id ON public.video_analysis_results(post_id);
CREATE INDEX idx_video_analysis_player_id ON public.video_analysis_results(player_id);
CREATE INDEX idx_video_analysis_status ON public.video_analysis_results(status) WHERE status != 'completed';
CREATE INDEX idx_video_analysis_sport_type ON public.video_analysis_results(sport, analysis_type);
```

#### scout_interactions

Tracks every meaningful interaction a scout (or team/coach) has with an athlete profile. This powers the "who viewed my profile" feature and feeds the trending algorithm.

```sql
CREATE TABLE IF NOT EXISTS public.scout_interactions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scout_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    athlete_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interaction_type text NOT NULL CHECK (interaction_type IN (
                        'profile_view', 'video_view', 'search_appear',
                        'shortlist_add', 'shortlist_remove',
                        'download_resume', 'contact_initiate', 'note_added'
                    )),
    metadata        jsonb DEFAULT '{}'::jsonb,
    -- Example: {"video_id": "uuid", "watch_duration_sec": 45, "search_query": "cricket bowler mumbai"}
    created_at      timestamptz DEFAULT now()
);

-- Composite index for "who viewed me" queries
CREATE INDEX idx_scout_interactions_athlete_time
    ON public.scout_interactions(athlete_id, created_at DESC);

-- Composite index for scout's activity history
CREATE INDEX idx_scout_interactions_scout_time
    ON public.scout_interactions(scout_id, created_at DESC);

-- For trending algorithm: count interactions by type in a time window
CREATE INDEX idx_scout_interactions_type_time
    ON public.scout_interactions(interaction_type, created_at DESC);

-- Shortlist lookup
CREATE INDEX idx_scout_interactions_shortlist
    ON public.scout_interactions(scout_id, athlete_id)
    WHERE interaction_type = 'shortlist_add';
```

#### verification_records

Stores verification evidence for athlete profiles (ID, certificates, federation cards).

```sql
CREATE TABLE IF NOT EXISTS public.verification_records (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    verification_type text NOT NULL CHECK (verification_type IN (
                        'identity', 'age', 'federation_card',
                        'competition_result', 'academy_affiliation',
                        'coach_certification'
                    )),
    document_url    text,          -- encrypted storage path, NOT public
    document_hash   text,          -- SHA-256 for tamper detection
    status          text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'under_review', 'verified', 'rejected', 'expired')),
    verified_by     uuid REFERENCES public.profiles(id),  -- admin/moderator who verified
    rejection_reason text,
    verified_at     timestamptz,
    expires_at      timestamptz,   -- federation cards expire
    metadata        jsonb DEFAULT '{}'::jsonb,
    -- Example: {"federation": "BCCI", "card_number": "MH-2024-1234", "valid_until": "2027-03-31"}
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_verification_profile ON public.verification_records(profile_id);
CREATE INDEX idx_verification_status ON public.verification_records(status) WHERE status = 'pending';
```

#### competition_results

Structured competition data that scouts can filter and verify.

```sql
CREATE TABLE IF NOT EXISTS public.competition_results (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    competition_name text NOT NULL,
    sport           text NOT NULL,
    level           text NOT NULL CHECK (level IN (
                        'school', 'district', 'state', 'national',
                        'international', 'club', 'university'
                    )),
    event_type      text,          -- "100m sprint", "U-19 cricket", etc.
    result          text,          -- "Gold", "Semi-finalist", "142 runs"
    ranking         integer,       -- 1st, 2nd, etc.
    date            date NOT NULL,
    location        text,
    verified        boolean DEFAULT false,
    verification_id uuid REFERENCES public.verification_records(id),
    source_url      text,          -- link to official results page
    metadata        jsonb DEFAULT '{}'::jsonb,
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_competition_athlete ON public.competition_results(athlete_id, date DESC);
CREATE INDEX idx_competition_sport_level ON public.competition_results(sport, level);
CREATE INDEX idx_competition_verified ON public.competition_results(verified, sport) WHERE verified = true;
```

#### academy_profiles

Extends the base profiles table for academies with structured data.

```sql
CREATE TABLE IF NOT EXISTS public.academy_profiles (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id      uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    registration_number text,       -- government registration
    sports          text[] NOT NULL DEFAULT '{}',
    facilities      jsonb DEFAULT '[]'::jsonb,
    -- Example: [{"type": "cricket_ground", "count": 2}, {"type": "gym", "indoor": true}]
    fee_range       jsonb DEFAULT '{}'::jsonb,
    -- Example: {"monthly_min": 2000, "monthly_max": 8000, "currency": "INR"}
    batch_timings   jsonb DEFAULT '[]'::jsonb,
    coaches_count   integer DEFAULT 0,
    athletes_count  integer DEFAULT 0,
    established_year integer,
    accreditations  text[] DEFAULT '{}',
    coordinates     point,          -- PostGIS-lite: Postgres native point type
    address         jsonb DEFAULT '{}'::jsonb,
    -- Example: {"line1": "...", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001"}
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_academy_sports ON public.academy_profiles USING gin(sports);
CREATE INDEX idx_academy_location ON public.academy_profiles USING gist(coordinates);
```

### 1.3 New Tables -- Phase 2 (10K-100K users)

#### wearable_data

Time-series data from fitness trackers, smartwatches. This table will grow fast -- partition by month.

```sql
CREATE TABLE IF NOT EXISTS public.wearable_data (
    id              uuid DEFAULT gen_random_uuid(),
    athlete_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source          text NOT NULL CHECK (source IN (
                        'google_fit', 'apple_health', 'fitbit',
                        'garmin', 'strava', 'manual'
                    )),
    metric_type     text NOT NULL CHECK (metric_type IN (
                        'heart_rate', 'steps', 'distance_km', 'calories',
                        'sleep_hours', 'vo2_max', 'sprint_speed',
                        'training_load', 'recovery_score'
                    )),
    value           numeric NOT NULL,
    unit            text NOT NULL,
    recorded_at     timestamptz NOT NULL,
    metadata        jsonb DEFAULT '{}'::jsonb,
    created_at      timestamptz DEFAULT now(),
    PRIMARY KEY (id, recorded_at)  -- needed for partitioning
) PARTITION BY RANGE (recorded_at);

-- Create monthly partitions (automate this with pg_partman or a cron job)
CREATE TABLE wearable_data_2026_03 PARTITION OF wearable_data
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE wearable_data_2026_04 PARTITION OF wearable_data
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
-- ... generate 12 months ahead via a script

CREATE INDEX idx_wearable_athlete_time ON public.wearable_data(athlete_id, recorded_at DESC);
CREATE INDEX idx_wearable_metric ON public.wearable_data(metric_type, recorded_at DESC);
```

#### training_logs

Structured training session data.

```sql
CREATE TABLE IF NOT EXISTS public.training_logs (
    id              uuid DEFAULT gen_random_uuid(),
    athlete_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sport           text NOT NULL,
    session_type    text NOT NULL CHECK (session_type IN (
                        'practice', 'match', 'gym', 'recovery',
                        'skills', 'tactical', 'conditioning'
                    )),
    duration_min    integer NOT NULL CHECK (duration_min > 0),
    intensity       text CHECK (intensity IN ('low', 'medium', 'high', 'max')),
    notes           text,
    exercises       jsonb DEFAULT '[]'::jsonb,
    -- Example: [{"name": "sprints", "sets": 5, "reps": 10, "weight_kg": null}]
    coach_id        uuid REFERENCES public.profiles(id),
    post_id         uuid REFERENCES public.posts(id),  -- linked highlight video
    metrics         jsonb DEFAULT '{}'::jsonb,
    -- Example: {"calories_burned": 450, "avg_heart_rate": 155, "distance_km": 8.2}
    session_date    date NOT NULL,
    created_at      timestamptz DEFAULT now(),
    PRIMARY KEY (id, session_date)
) PARTITION BY RANGE (session_date);

CREATE TABLE training_logs_2026_q1 PARTITION OF training_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE training_logs_2026_q2 PARTITION OF training_logs
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
-- ... quarterly partitions

CREATE INDEX idx_training_athlete_date ON public.training_logs(athlete_id, session_date DESC);
CREATE INDEX idx_training_sport ON public.training_logs(sport, session_date DESC);
```

### 1.4 Indexing Strategy

Current indexes are reasonable for OLTP but need augmentation:

**Add composite indexes for the hot queries:**

```sql
-- Scout search: "show me verified cricket batsmen in Maharashtra under 19"
CREATE INDEX idx_profiles_scout_search
    ON public.profiles(sport, role, verified, location)
    WHERE role = 'athlete';

-- Feed: "my followed users' posts, newest first"
CREATE INDEX idx_posts_feed
    ON public.posts(user_id, created_at DESC);

-- Opportunities: "open cricket tryouts near me"
CREATE INDEX idx_opportunities_active
    ON public.opportunities(sport, category, deadline)
    WHERE deadline > now();

-- Messages: "my unread count" -- already exists but add:
CREATE INDEX idx_messages_conversation_lookup
    ON public.messages(
        LEAST(sender_id, receiver_id),
        GREATEST(sender_id, receiver_id),
        created_at DESC
    );
```

**GIN indexes for JSONB queries (use sparingly -- they are expensive to maintain):**

```sql
-- Only if you query inside achievements often
CREATE INDEX idx_profiles_achievements ON public.profiles USING gin(achievements jsonb_path_ops);
```

**Partial indexes to keep index size small:**

```sql
-- Only index active opportunities (not expired ones)
CREATE INDEX idx_opportunities_active_deadline
    ON public.opportunities(deadline)
    WHERE deadline > now();

-- Only index unread notifications
-- Already exists: idx_notifications_unread
```

### 1.5 Partitioning Strategy

| Table              | Partition Key | Partition Interval | Retention                              |
| ------------------ | ------------- | ------------------ | -------------------------------------- |
| wearable_data      | recorded_at   | Monthly            | 24 months hot, archive to cold storage |
| training_logs      | session_date  | Quarterly          | Indefinite (small per-athlete)         |
| analytics_events   | created_at    | Monthly            | 6 months hot, aggregate then archive   |
| scout_interactions | created_at    | Monthly            | 12 months hot, aggregate then archive  |
| notifications      | created_at    | Monthly            | 3 months hot, delete old read ones     |

Use `pg_partman` extension (available on Supabase Pro) to auto-create partitions.

### 1.6 RLS Policy Audit

Issues found in the canonical schema:

| Table                | Issue                                                                   | Fix                                                                      |
| -------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| profiles             | INSERT policy uses `WITH CHECK (true)` -- anyone can insert any profile | Change to `WITH CHECK (auth.uid()::text = id::text)`                     |
| player_stats         | No RLS policies defined in canonical schema                             | Add SELECT public, INSERT/UPDATE owner-only                              |
| scout_preferences    | No RLS policies defined                                                 | Add SELECT/INSERT/UPDATE owner-only                                      |
| ai_recommendations   | No RLS policies defined                                                 | Add SELECT where scout_id or player_id = auth.uid()                      |
| scout_interactions   | New table                                                               | SELECT: athlete can see their own views, scout can see their own history |
| verification_records | New table                                                               | SELECT: owner only (contains PII). INSERT: owner. UPDATE: admin only     |
| wearable_data        | New table                                                               | SELECT/INSERT/UPDATE/DELETE: owner only. No public access                |
| training_logs        | New table                                                               | SELECT: owner + their coach. INSERT/UPDATE/DELETE: owner only            |

**Critical fix for profiles INSERT policy:**

```sql
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid()::text = id::text);
```

**Add missing policies for player_stats:**

```sql
CREATE POLICY "Player stats are viewable by everyone"
    ON public.player_stats FOR SELECT USING (true);
CREATE POLICY "Players can insert own stats"
    ON public.player_stats FOR INSERT
    WITH CHECK (auth.uid()::text = player_id::text);
CREATE POLICY "Players can update own stats"
    ON public.player_stats FOR UPDATE
    USING (auth.uid()::text = player_id::text);
```

---

## 2. API Architecture

### 2.1 Current State

All data access happens through the Supabase JS client directly from the React Native app:

```
React Native --> supabase.from('profiles').select('*').eq('id', userId)
```

This works for CRUD but breaks down when you need:

- ML inference (video analysis, recommendations)
- Complex multi-table business logic (application workflows)
- Third-party API orchestration (WhatsApp, Razorpay, Khelo India)
- Rate limiting per user tier
- Request validation beyond what RLS provides

### 2.2 Target Architecture

```
React Native App
       |
       |--- Direct Supabase calls (reads, realtime subscriptions, auth)
       |
       |--- FastAPI Gateway (writes with business logic, ML, integrations)
                |
                |--- Supabase (via service_role key)
                |--- Redis (caching, rate limiting, queues)
                |--- ML Service (Cloud Run)
                |--- External APIs (WhatsApp, Razorpay, etc.)
```

The key principle: keep direct Supabase access for simple reads and realtime (it is fast and free), but route complex operations through the API layer.

### 2.3 FastAPI Service Design

Single deployable FastAPI service (not microservices -- that is premature for a startup). Internal modules organized by domain.

```
api/
  main.py              # FastAPI app, CORS, middleware
  config.py            # Settings from environment
  deps.py              # Dependency injection (supabase client, redis, etc.)
  middleware/
    auth.py            # Verify Supabase JWT, extract user
    rate_limit.py      # Token bucket per user tier
    logging.py         # Structured request logging
  routers/
    video.py           # Upload, transcode trigger, analysis status
    search.py          # Advanced search with facets
    opportunities.py   # Apply, withdraw, status updates
    notifications.py   # Send push/email/whatsapp
    payments.py        # Razorpay integration
    verification.py    # Document upload, status check
    admin.py           # Moderation, verification approval
    analytics.py       # Dashboard data for scouts/athletes
  services/
    video_processor.py # FFmpeg job dispatch to Cloud Run
    ml_inference.py    # Call ML model endpoints
    notification.py    # Multi-channel notification dispatch
    search_engine.py   # Typesense/Postgres FTS abstraction
    payment.py         # Razorpay SDK wrapper
    whatsapp.py        # WhatsApp Business API client
  models/
    schemas.py         # Pydantic request/response models
```

### 2.4 Key API Endpoints

```python
# --- Video Pipeline ---
POST   /api/v1/video/upload          # Returns presigned URL + job_id
GET    /api/v1/video/{job_id}/status  # Polling for transcode/analysis status
POST   /api/v1/video/{post_id}/analyze  # Trigger ML analysis

# --- Search ---
GET    /api/v1/search/athletes       # Faceted search with filters
GET    /api/v1/search/opportunities   # Search opportunities
GET    /api/v1/search/academies       # Search academies by location
GET    /api/v1/search/suggest         # Autocomplete suggestions

# --- Scout Actions ---
POST   /api/v1/scout/shortlist        # Add athlete to shortlist
DELETE /api/v1/scout/shortlist/{id}    # Remove from shortlist
GET    /api/v1/scout/shortlist         # Get scout's shortlist
GET    /api/v1/scout/search-history    # Past searches

# --- Athlete Dashboard ---
GET    /api/v1/athlete/viewers         # Who viewed my profile (last 30 days)
GET    /api/v1/athlete/trending-score  # My visibility score
GET    /api/v1/athlete/stats/summary   # Aggregated training/wearable stats

# --- Opportunities ---
POST   /api/v1/opportunities/{id}/apply    # Apply with validation
PUT    /api/v1/opportunities/{id}/status   # Accept/reject application
GET    /api/v1/opportunities/recommended   # ML-powered recommendations

# --- Verification ---
POST   /api/v1/verification/submit     # Upload verification document
GET    /api/v1/verification/status      # Check verification status

# --- Payments ---
POST   /api/v1/payments/create-order   # Create Razorpay order
POST   /api/v1/payments/verify         # Verify payment callback
GET    /api/v1/payments/subscription    # Current subscription status

# --- Notifications ---
POST   /api/v1/notifications/preferences  # Update notification settings
```

### 2.5 Authentication Flow

```python
# middleware/auth.py
from fastapi import Request, HTTPException
from jose import jwt
import httpx

SUPABASE_JWT_SECRET = settings.SUPABASE_JWT_SECRET

async def verify_supabase_token(request: Request):
    """
    Extract and verify the Supabase JWT from the Authorization header.
    The React Native app sends the same token it uses for Supabase calls.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"],
                             audience="authenticated")
        request.state.user_id = payload["sub"]
        request.state.user_role = payload.get("user_metadata", {}).get("role", "athlete")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### 2.6 Rate Limiting

Use Redis token bucket. Different limits by user tier:

| Tier           | Requests/min | Search/min | Video uploads/day |
| -------------- | ------------ | ---------- | ----------------- |
| Free (athlete) | 60           | 20         | 3                 |
| Free (scout)   | 120          | 60         | 0                 |
| Pro (athlete)  | 300          | 100        | 20                |
| Pro (scout)    | 600          | 300        | 0                 |
| Admin          | Unlimited    | Unlimited  | Unlimited         |

```python
# middleware/rate_limit.py
import redis.asyncio as redis

async def check_rate_limit(user_id: str, tier: str, endpoint: str):
    key = f"ratelimit:{tier}:{user_id}:{endpoint}"
    current = await redis_client.incr(key)
    if current == 1:
        await redis_client.expire(key, 60)  # 1-minute window
    limit = RATE_LIMITS[tier][endpoint]
    if current > limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
```

### 2.7 Caching Strategy (Redis)

| Cache Key Pattern           | TTL    | Invalidation Trigger      |
| --------------------------- | ------ | ------------------------- |
| `profile:{id}`              | 5 min  | Profile update            |
| `feed:{user_id}:page:{n}`   | 30 sec | New post by followed user |
| `search:{query_hash}`       | 2 min  | Background refresh        |
| `trending:athletes`         | 5 min  | Cron recalculation        |
| `opportunity:{id}`          | 10 min | Opportunity update        |
| `viewer_count:{athlete_id}` | 1 min  | New scout interaction     |

**Redis sizing estimate:** At 100K users with 10% DAU, expect ~1M keys, ~500MB RAM. A single Redis instance (Upstash free tier or Railway $5/mo) is sufficient until 500K users.

### 2.8 Webhook System

For async event processing (video transcode complete, payment confirmed, verification approved):

```python
# Internal event bus using Supabase database webhooks + pg_net extension
# or a simple Redis pub/sub for the FastAPI service

# Event schema
{
    "event_id": "uuid",
    "event_type": "video.transcode.completed",
    "timestamp": "2026-03-12T10:00:00Z",
    "payload": {
        "post_id": "uuid",
        "video_urls": {
            "480p": "https://cdn.onlykrida.com/videos/uuid/480p.mp4",
            "720p": "https://cdn.onlykrida.com/videos/uuid/720p.mp4",
            "1080p": "https://cdn.onlykrida.com/videos/uuid/1080p.mp4"
        },
        "thumbnail_url": "https://cdn.onlykrida.com/videos/uuid/thumb.jpg"
    }
}
```

---

## 3. Video Pipeline

### 3.1 Architecture Overview

```
User records video (Expo Camera/ImagePicker)
       |
       v
React Native: compress locally (expo-video-thumbnails, 720p max)
       |
       v
Upload to Supabase Storage (videos bucket, max 100MB)
       |
       v
Supabase Database Webhook fires on posts INSERT where video_url IS NOT NULL
       |
       v
FastAPI /webhooks/new-video endpoint receives event
       |
       v
Dispatch Cloud Run Job (FFmpeg container)
       |
       |--- Transcode to 480p (target: 2-4MB for 30sec)
       |--- Transcode to 720p (target: 5-8MB for 30sec)
       |--- Transcode to 1080p (target: 10-15MB for 30sec)
       |--- Generate thumbnail (JPEG, 640x360)
       |--- Generate 3-second preview GIF
       |
       v
Upload transcoded files to Supabase Storage / R2 bucket
       |
       v
Update posts table with video_urls JSONB and thumbnail_url
       |
       v
Notify user: "Your video is ready"
       |
       v
(Async) Trigger ML analysis if sport is detectable
```

### 3.2 FFmpeg Transcode Configuration

Optimized for Indian mobile networks (Jio 4G averages 15-25 Mbps, but many users are on 5-10 Mbps).

```bash
# 480p -- for slow connections and feed autoplay
ffmpeg -i input.mp4 \
  -vf "scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -preset medium -crf 28 -maxrate 800k -bufsize 1600k \
  -c:a aac -b:a 64k -ar 44100 \
  -movflags +faststart \
  -f mp4 output_480p.mp4

# 720p -- default playback quality
ffmpeg -i input.mp4 \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -preset medium -crf 24 -maxrate 2000k -bufsize 4000k \
  -c:a aac -b:a 96k -ar 44100 \
  -movflags +faststart \
  -f mp4 output_720p.mp4

# 1080p -- for wifi / full-screen viewing
ffmpeg -i input.mp4 \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -preset medium -crf 22 -maxrate 4500k -bufsize 9000k \
  -c:a aac -b:a 128k -ar 44100 \
  -movflags +faststart \
  -f mp4 output_1080p.mp4

# Thumbnail at 2 seconds in
ffmpeg -i input.mp4 -ss 00:00:02 -vframes 1 -vf "scale=640:360" -q:v 2 thumbnail.jpg
```

`-movflags +faststart` is critical -- it moves the moov atom to the beginning of the file so playback can start before the full download completes. This is non-negotiable for Indian mobile networks.

### 3.3 Cloud Run Job Configuration

```yaml
# cloud-run-job.yaml
apiVersion: run.googleapis.com/v1
kind: Job
metadata:
  name: video-transcode
spec:
  template:
    spec:
      containers:
        - image: gcr.io/onlykrida/video-transcoder:latest
          resources:
            limits:
              cpu: '2'
              memory: '2Gi'
          env:
            - name: SUPABASE_SERVICE_ROLE_KEY
              valueFrom:
                secretKeyRef:
                  name: supabase-secrets
                  key: service-role-key
      taskCount: 1
      parallelism: 1
      maxRetries: 2
      timeoutSeconds: 600 # 10 min max per video
```

**Cost estimate:** Cloud Run Jobs charge only for execution time. At $0.00002400/vCPU-second + $0.00000250/GiB-second:

- 30-second video transcode takes ~60 seconds with 2 vCPU / 2 GiB = $0.0038 per video
- 1000 videos/day = $3.80/day = ~$114/month
- At MVP scale (50 videos/day) = $5.70/month

### 3.4 CDN Configuration

Use Cloudflare (free tier) in front of Supabase Storage:

```
Supabase Storage URL: https://xyz.supabase.co/storage/v1/object/public/videos/...
Cloudflare CNAME:     cdn.onlykrida.com -> xyz.supabase.co

Cache rules:
  - /videos/*  -> Cache Everything, TTL 30 days, Tiered Caching on
  - /avatars/* -> Cache Everything, TTL 7 days
  - /thumbs/*  -> Cache Everything, TTL 30 days
```

Cloudflare free plan includes unlimited bandwidth. This alone saves significant cost versus serving directly from Supabase Storage.

### 3.5 Adaptive Bitrate Delivery

Instead of full HLS (complex), use a simpler approach for v1:

```typescript
// React Native: select quality based on connection type
import NetInfo from '@react-native-community/netinfo';

const getVideoUrl = async (post: Post): Promise<string> => {
  const netInfo = await NetInfo.fetch();

  if (netInfo.type === 'wifi') return post.video_urls?.['1080p'] || post.video_url;
  if (netInfo.details?.cellularGeneration === '4g')
    return post.video_urls?.['720p'] || post.video_url;
  return post.video_urls?.['480p'] || post.video_url;
};
```

---

## 4. Search & Discovery

### 4.1 Current State

```typescript
// Current: basic ilike search in discover.tsx
const { data } = await supabase
  .from('profiles')
  .select('*')
  .or(`name.ilike.%${query}%,sport.ilike.%${query}%,location.ilike.%${query}%`)
  .limit(20);
```

This does a sequential scan on every query. At 500K profiles, this will take 2-5 seconds.

### 4.2 Phase 1: Postgres Full-Text Search (0-50K users)

Free, no additional infrastructure, good enough for early scale.

```sql
-- Add tsvector column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate it
UPDATE public.profiles SET search_vector =
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(sport, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(position, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'C');

-- GIN index on the tsvector
CREATE INDEX idx_profiles_search ON public.profiles USING gin(search_vector);

-- Trigger to keep it updated
CREATE OR REPLACE FUNCTION profiles_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.sport, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.position, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.location, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.bio, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_search_vector
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION profiles_search_vector_update();
```

**Search query with filters:**

```sql
-- "verified cricket batsmen in Maharashtra"
SELECT id, name, sport, position, location, verified, avatar,
       ts_rank(search_vector, query) AS rank
FROM profiles,
     plainto_tsquery('english', 'cricket batsman maharashtra') AS query
WHERE search_vector @@ query
  AND role = 'athlete'
  AND verified = true
ORDER BY rank DESC
LIMIT 20 OFFSET 0;
```

### 4.3 Phase 2: Typesense (50K+ users)

When Postgres FTS becomes a bottleneck or you need faceted search, typo tolerance, and sub-10ms results.

**Why Typesense over Algolia/Meilisearch:**

- Open source, self-hostable (saves money at scale)
- Built-in geo search
- Typo tolerance (handles "criket" -> "cricket")
- Faceted search out of the box
- Single binary, low memory footprint (~500MB for 500K documents)

**Typesense collection schema:**

```json
{
  "name": "athletes",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "name", "type": "string" },
    { "name": "sport", "type": "string", "facet": true },
    { "name": "position", "type": "string", "facet": true },
    { "name": "location_city", "type": "string", "facet": true },
    { "name": "location_state", "type": "string", "facet": true },
    { "name": "age", "type": "int32", "facet": true },
    { "name": "verified", "type": "bool", "facet": true },
    { "name": "verification_level", "type": "string", "facet": true },
    { "name": "competition_level", "type": "string", "facet": true },
    { "name": "bio", "type": "string" },
    { "name": "followers_count", "type": "int32" },
    { "name": "trending_score", "type": "float" },
    { "name": "coordinates", "type": "geopoint" },
    { "name": "avatar_url", "type": "string" },
    { "name": "stats", "type": "object" }
  ],
  "default_sorting_field": "trending_score"
}
```

**Sync pipeline:** Supabase database webhook on profiles UPDATE/INSERT fires to FastAPI, which upserts into Typesense. Lag: < 2 seconds.

**Cost:** Typesense Cloud starts at $30/month for 500K records. Self-hosted on a $5/month VPS handles up to 1M records.

### 4.4 Geo-Based Search

Add coordinates to profiles (for athletes who opt in):

```sql
-- Use Postgres native point type (no PostGIS needed for simple distance)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coordinates point;

-- Index for distance queries
CREATE INDEX idx_profiles_coordinates ON public.profiles USING gist(coordinates)
    WHERE coordinates IS NOT NULL;

-- Find athletes within 50km of a point (Mumbai: 19.076, 72.8777)
SELECT id, name, sport,
       coordinates <-> point(19.076, 72.8777) AS distance_deg
FROM profiles
WHERE coordinates IS NOT NULL
  AND role = 'athlete'
  AND coordinates <-> point(19.076, 72.8777) < 0.45  -- ~50km at Indian latitudes
ORDER BY distance_deg
LIMIT 20;
```

For the React Native app, use `expo-location` to get user coordinates and pass them to the search API.

### 4.5 Trending Athletes Algorithm

Computed every 5 minutes via a Supabase Edge Function or cron:

```sql
-- Materialized view for trending score
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_athletes AS
SELECT
    p.id,
    p.name,
    p.sport,
    p.avatar,
    p.verified,
    (
        -- Profile views in last 7 days (weight: 1x)
        COALESCE(pv.view_count, 0) * 1.0 +
        -- Shortlists in last 7 days (weight: 5x -- high intent signal)
        COALESCE(sl.shortlist_count, 0) * 5.0 +
        -- New followers in last 7 days (weight: 3x)
        COALESCE(nf.follow_count, 0) * 3.0 +
        -- Video views in last 7 days (weight: 0.5x)
        COALESCE(vv.video_views, 0) * 0.5 +
        -- Verified bonus
        CASE WHEN p.verified THEN 10 ELSE 0 END
    ) AS trending_score
FROM profiles p
LEFT JOIN (
    SELECT athlete_id, COUNT(*) AS view_count
    FROM scout_interactions
    WHERE interaction_type = 'profile_view'
      AND created_at > now() - interval '7 days'
    GROUP BY athlete_id
) pv ON pv.athlete_id = p.id
LEFT JOIN (
    SELECT athlete_id, COUNT(*) AS shortlist_count
    FROM scout_interactions
    WHERE interaction_type = 'shortlist_add'
      AND created_at > now() - interval '7 days'
    GROUP BY athlete_id
) sl ON sl.athlete_id = p.id
LEFT JOIN (
    SELECT following_id, COUNT(*) AS follow_count
    FROM follows
    WHERE created_at > now() - interval '7 days'
    GROUP BY following_id
) nf ON nf.following_id = p.id
LEFT JOIN (
    SELECT user_id, SUM(views_count) AS video_views
    FROM posts
    WHERE created_at > now() - interval '7 days'
    GROUP BY user_id
) vv ON vv.user_id = p.id
WHERE p.role = 'athlete'
ORDER BY trending_score DESC;

-- Refresh every 5 minutes
-- Use pg_cron (Supabase Pro) or an external cron
SELECT cron.schedule('refresh-trending', '*/5 * * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY trending_athletes');

-- Index for fast reads
CREATE UNIQUE INDEX idx_trending_athletes_id ON trending_athletes(id);
CREATE INDEX idx_trending_athletes_score ON trending_athletes(trending_score DESC);
CREATE INDEX idx_trending_athletes_sport ON trending_athletes(sport, trending_score DESC);
```

---

## 5. Analytics & Event Tracking

### 5.1 Event Schema

Extend the existing `analytics_events` table:

```sql
-- Drop and recreate with better schema
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id              uuid DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL,  -- no FK to avoid write contention
    session_id      text,           -- group events by session
    event_type      text NOT NULL,
    properties      jsonb DEFAULT '{}'::jsonb,
    device_info     jsonb DEFAULT '{}'::jsonb,
    -- Example device_info: {"platform": "ios", "version": "1.2.0", "os": "17.4", "network": "4g"}
    geo             jsonb DEFAULT '{}'::jsonb,
    -- Example geo: {"city": "Mumbai", "state": "Maharashtra", "country": "IN"}
    created_at      timestamptz DEFAULT now(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Monthly partitions
CREATE TABLE analytics_events_2026_03 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
```

### 5.2 Events to Track

| Event Type                | Properties                                          | Purpose                    |
| ------------------------- | --------------------------------------------------- | -------------------------- | ------------ | ----------------------- |
| `profile_view`            | `{viewed_user_id, source: "search"                  | "feed"                     | "direct"}`   | "Who viewed my profile" |
| `video_play`              | `{post_id, duration_sec, completed: bool, quality}` | Content engagement         |
| `video_play_25/50/75/100` | `{post_id}`                                         | Watch-through rate         |
| `shortlist_add`           | `{athlete_id}`                                      | Scout intent signal        |
| `shortlist_remove`        | `{athlete_id}`                                      |                            |
| `search_query`            | `{query, filters, result_count, clicked_result_id}` | Search quality             |
| `opportunity_view`        | `{opportunity_id}`                                  | Opportunity engagement     |
| `opportunity_apply`       | `{opportunity_id}`                                  | Conversion                 |
| `message_sent`            | `{conversation_id, has_media: bool}`                | Messaging usage            |
| `notification_tap`        | `{notification_type, notification_id}`              | Notification effectiveness |
| `app_open`                | `{source: "push"                                    | "organic"                  | "deeplink"}` | Retention               |
| `app_background`          | `{session_duration_sec}`                            | Session length             |
| `feed_scroll`             | `{posts_seen: int, posts_engaged: int}`             | Feed health                |
| `share_profile`           | `{shared_to: "whatsapp"                             | "copy_link"                | "other"}`    | Virality                |

### 5.3 Client-Side Tracking Implementation

```typescript
// hooks/use-analytics.ts
import { useCallback, useRef } from 'react';
import { supabase } from '@/constants/supabase';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Device from 'expo-device';

const EVENT_BUFFER_SIZE = 10;
const FLUSH_INTERVAL_MS = 30_000; // 30 seconds

export function useAnalytics() {
  const buffer = useRef<AnalyticsEvent[]>([]);

  const track = useCallback(async (eventType: string, properties: Record<string, any> = {}) => {
    const netInfo = await NetInfo.fetch();

    buffer.current.push({
      event_type: eventType,
      properties,
      device_info: {
        platform: Platform.OS,
        version: Device.osVersion,
        app_version: '1.0.0',
        network: netInfo.type,
      },
      created_at: new Date().toISOString(),
    });

    if (buffer.current.length >= EVENT_BUFFER_SIZE) {
      await flush();
    }
  }, []);

  const flush = useCallback(async () => {
    if (buffer.current.length === 0) return;
    const events = [...buffer.current];
    buffer.current = [];

    // Batch insert -- single round trip
    await supabase.from('analytics_events').insert(events);
  }, []);

  return { track, flush };
}
```

### 5.4 Real-Time Dashboards

**For Athletes -- "Who Viewed My Profile":**

```sql
-- API endpoint: GET /api/v1/athlete/viewers
SELECT
    si.scout_id,
    p.name AS scout_name,
    p.role AS scout_role,
    p.avatar,
    p.role_specific_data->>'organization' AS organization,
    COUNT(*) AS view_count,
    MAX(si.created_at) AS last_viewed_at
FROM scout_interactions si
JOIN profiles p ON p.id = si.scout_id
WHERE si.athlete_id = $1  -- current user
  AND si.interaction_type IN ('profile_view', 'video_view')
  AND si.created_at > now() - interval '30 days'
GROUP BY si.scout_id, p.name, p.role, p.avatar, p.role_specific_data
ORDER BY last_viewed_at DESC
LIMIT 50;
```

**For Scouts -- "My Shortlist Performance":**

```sql
-- How are my shortlisted athletes performing?
SELECT
    p.id, p.name, p.sport, p.avatar, p.verified,
    ta.trending_score,
    (SELECT COUNT(*) FROM scout_interactions
     WHERE athlete_id = p.id AND interaction_type = 'shortlist_add'
       AND created_at > now() - interval '7 days') AS other_scouts_shortlisted
FROM scout_interactions si
JOIN profiles p ON p.id = si.athlete_id
LEFT JOIN trending_athletes ta ON ta.id = p.id
WHERE si.scout_id = $1
  AND si.interaction_type = 'shortlist_add'
ORDER BY ta.trending_score DESC NULLS LAST;
```

### 5.5 Aggregation Pipeline for ML

Weekly cron job that generates training data for the recommendation engine:

```sql
-- Positive signal: scout shortlisted after viewing
-- Negative signal: scout viewed but did not shortlist

CREATE MATERIALIZED VIEW ml_training_data AS
SELECT
    si_view.scout_id,
    si_view.athlete_id,
    sp.sport AS scout_pref_sport,
    sp.preferred_positions,
    p.sport AS athlete_sport,
    p.position AS athlete_position,
    p.verified AS athlete_verified,
    ps.skill, ps.speed, ps.stamina,
    CASE WHEN si_short.id IS NOT NULL THEN 1 ELSE 0 END AS label,
    p.followers_count,
    (SELECT COUNT(*) FROM competition_results cr
     WHERE cr.athlete_id = p.id AND cr.verified = true) AS verified_competitions
FROM scout_interactions si_view
JOIN profiles p ON p.id = si_view.athlete_id
LEFT JOIN player_stats ps ON ps.player_id = p.id
LEFT JOIN scout_preferences sp ON sp.scout_id = si_view.scout_id
LEFT JOIN scout_interactions si_short
    ON si_short.scout_id = si_view.scout_id
    AND si_short.athlete_id = si_view.athlete_id
    AND si_short.interaction_type = 'shortlist_add'
WHERE si_view.interaction_type = 'profile_view'
  AND si_view.created_at > now() - interval '90 days';
```

---

## 6. Notification System

### 6.1 Architecture

```
Event occurs (new follow, profile view, etc.)
       |
       v
Supabase trigger / FastAPI event handler
       |
       v
Notification Router (decides channel + batching)
       |
       |--- Push (Expo Push API)
       |--- In-App (INSERT into notifications table -> Supabase Realtime)
       |--- Email (Resend API)
       |--- WhatsApp (WhatsApp Business API via Gupshup/Twilio)
```

### 6.2 Notification Preferences Table

```sql
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    push_enabled      boolean DEFAULT true,
    email_enabled     boolean DEFAULT true,
    whatsapp_enabled  boolean DEFAULT false,  -- opt-in only
    whatsapp_number   text,                   -- with country code: +919876543210

    -- Per-event-type preferences
    notify_new_follower     boolean DEFAULT true,
    notify_profile_view     boolean DEFAULT true,
    notify_shortlist        boolean DEFAULT true,
    notify_opportunity      boolean DEFAULT true,
    notify_message          boolean DEFAULT true,
    notify_video_ready      boolean DEFAULT true,
    notify_application_update boolean DEFAULT true,

    -- Batching preferences
    digest_mode     text DEFAULT 'instant' CHECK (digest_mode IN ('instant', 'hourly', 'daily')),
    quiet_hours_start time,  -- e.g., 22:00
    quiet_hours_end   time,  -- e.g., 07:00

    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);
```

### 6.3 Push Notifications (Expo)

```python
# services/notification.py
import httpx

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

async def send_push(tokens: list[str], title: str, body: str, data: dict = {}):
    """Send push notification via Expo Push API. Handles chunking."""
    messages = [
        {
            "to": token,
            "title": title,
            "body": body,
            "data": data,
            "sound": "default",
            "priority": "high",
            "channelId": "default",
        }
        for token in tokens
    ]

    # Expo accepts max 100 per request
    for i in range(0, len(messages), 100):
        chunk = messages[i:i+100]
        async with httpx.AsyncClient() as client:
            response = await client.post(EXPO_PUSH_URL, json=chunk)
            # Handle errors, log failures, retry on 429
```

**Push token storage:**

```sql
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token       text NOT NULL,
    platform    text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    active      boolean DEFAULT true,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now(),
    UNIQUE(user_id, token)
);
```

### 6.4 WhatsApp Business API

Critical for India. Athletes share profiles via WhatsApp more than any other channel.

**Use case 1: Shareable profile card**

```python
# services/whatsapp.py
# Using Gupshup as BSP (Business Solution Provider) -- cheapest for India

GUPSHUP_API = "https://api.gupshup.io/wa/api/v1/msg"

async def send_whatsapp_template(phone: str, template_name: str, params: list[str]):
    """Send a pre-approved WhatsApp template message."""
    payload = {
        "channel": "whatsapp",
        "source": WHATSAPP_BUSINESS_NUMBER,  # e.g., "+919876543210"
        "destination": phone,
        "template": {
            "id": template_name,
            "params": params,
        },
    }
    async with httpx.AsyncClient() as client:
        await client.post(GUPSHUP_API, json=payload,
                          headers={"apikey": GUPSHUP_API_KEY})
```

**Pre-approved templates to register:**

| Template Name        | Use Case                            | Message                                                          |
| -------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| `profile_share`      | Athlete shares their profile        | "Check out {{1}}'s sports profile on OnlyKrida! {{2}}"           |
| `opportunity_alert`  | New opportunity matches preferences | "New {{1}} opportunity in {{2}}: {{3}}. Apply before {{4}}."     |
| `application_update` | Application status changed          | "Update on your application to {{1}}: Your status is now {{2}}." |
| `profile_viewed`     | Scout viewed athlete profile        | "A {{1}} from {{2}} viewed your profile on OnlyKrida."           |

**Cost:** Gupshup charges ~INR 0.50-0.75 per template message. At 1000 messages/day = INR 750/day = ~$270/month. Budget carefully.

### 6.5 Smart Batching

Prevent notification spam:

```python
# Batching logic in the notification router
async def should_send_notification(user_id: str, event_type: str) -> bool:
    prefs = await get_notification_preferences(user_id)

    # Check if this event type is enabled
    if not getattr(prefs, f'notify_{event_type}', True):
        return False

    # Check quiet hours
    if prefs.quiet_hours_start and prefs.quiet_hours_end:
        now = datetime.now(tz=user_timezone(user_id)).time()
        if prefs.quiet_hours_start <= now or now <= prefs.quiet_hours_end:
            # Queue for delivery after quiet hours end
            await queue_for_later(user_id, event_type, prefs.quiet_hours_end)
            return False

    # Check digest mode
    if prefs.digest_mode == 'hourly':
        await add_to_digest(user_id, event_type)
        return False
    if prefs.digest_mode == 'daily':
        await add_to_digest(user_id, event_type)
        return False

    # Rate limit: max 10 push notifications per hour per user
    count = await redis.get(f"push_count:{user_id}")
    if count and int(count) >= 10:
        await add_to_digest(user_id, event_type)
        return False

    await redis.incr(f"push_count:{user_id}")
    await redis.expire(f"push_count:{user_id}", 3600)
    return True
```

### 6.6 Email (Resend)

Use Resend for transactional emails. Cheaper than SendGrid for startups (3000 emails/month free, then $20/month for 50K).

```python
import resend

resend.api_key = RESEND_API_KEY

async def send_email(to: str, subject: str, html: str):
    resend.Emails.send({
        "from": "OnlyKrida <notifications@onlykrida.com>",
        "to": to,
        "subject": subject,
        "html": html,
    })
```

Email triggers:

- Weekly digest: "3 scouts viewed your profile this week"
- Application status: "Your application to XYZ Tryouts was accepted"
- Verification complete: "Your profile is now verified"
- Inactivity re-engagement: "You have 5 new opportunity matches" (after 7 days inactive)

---

## 7. Security & Compliance

### 7.1 India's Digital Personal Data Protection Act 2023 (DPDPA)

The DPDPA applies because OnlyKrida collects personal data from Indian residents. Key requirements:

| Requirement                      | Implementation                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Lawful purpose & consent**     | Show clear consent screen during signup. Store consent timestamp in profiles.                         |
| **Purpose limitation**           | Only collect data needed for the stated purpose. Document each data field's purpose.                  |
| **Data minimization**            | Do not require location, age, or wearable data -- make them opt-in.                                   |
| **Right to correction**          | Already supported via edit-profile.                                                                   |
| **Right to erasure**             | Implement full account deletion (CASCADE deletes + storage cleanup).                                  |
| **Right to grievance redressal** | Add in-app "Data Privacy" section with contact info and grievance form.                               |
| **Data breach notification**     | Implement breach detection + notify DPBI (Data Protection Board of India) within 72 hours.            |
| **Children's data**              | If user is under 18, require verifiable parental consent.                                             |
| **Data localization**            | No strict requirement yet, but keep primary database in India (Supabase Mumbai region or ap-south-1). |

### 7.2 Age Verification for Minors

```sql
-- Add age-related fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_minor boolean GENERATED ALWAYS AS (
    date_of_birth IS NOT NULL AND
    date_of_birth > (CURRENT_DATE - interval '18 years')::date
) STORED;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parental_consent_given boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_email text;

-- RLS: Minors without consent cannot post or message
CREATE POLICY "Minors need consent to post"
    ON public.posts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()::uuid
            AND (is_minor = false OR parental_consent_given = true)
        )
    );
```

**Parental consent flow:**

1. During signup, if date_of_birth indicates minor, show parental consent screen.
2. Send email to parent_email with a unique consent link.
3. Parent clicks link, verifies via OTP.
4. Set `parental_consent_given = true`.
5. Until consent is given, profile is in "limited mode" (can browse but not post/message).

### 7.3 Content Moderation

**Automated (Phase 1):**

```python
# services/content_moderation.py
# Use Google Cloud Vision API for image/video frame analysis

async def moderate_video(video_url: str) -> ModerationResult:
    """Extract key frames and check for inappropriate content."""
    frames = extract_key_frames(video_url, count=5)

    for frame in frames:
        result = await vision_client.safe_search_detection(image=frame)
        if result.adult >= Likelihood.LIKELY or result.violence >= Likelihood.LIKELY:
            return ModerationResult(
                approved=False,
                reason="Content flagged for review",
                confidence=0.9
            )

    return ModerationResult(approved=True)
```

**Cost:** Google Cloud Vision: $1.50 per 1000 images. At 5 frames per video, 100 videos/day = $0.75/day.

**Manual (Phase 2):**

- Flag queue for human moderators (in-app admin panel).
- Community reporting: "Report" button on posts/profiles.
- Abuse reports table:

```sql
CREATE TABLE IF NOT EXISTS public.abuse_reports (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    reason          text NOT NULL CHECK (reason IN (
                        'spam', 'harassment', 'inappropriate_content',
                        'fake_profile', 'underage', 'impersonation', 'other'
                    )),
    description     text,
    status          text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
    reviewed_by     uuid REFERENCES public.profiles(id),
    action_taken    text,
    created_at      timestamptz DEFAULT now(),
    resolved_at     timestamptz
);

CREATE INDEX idx_abuse_reports_status ON public.abuse_reports(status) WHERE status = 'pending';
```

### 7.4 Data Encryption

| Layer                            | Method                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| In transit                       | TLS 1.3 (Supabase default). Force HTTPS on all API endpoints.                                         |
| At rest (database)               | Supabase encrypts at rest by default (AES-256).                                                       |
| At rest (verification documents) | Store in a private Supabase Storage bucket. Serve via signed URLs with 1-hour expiry.                 |
| Sensitive fields                 | Hash PII like Aadhaar numbers. Never store raw government IDs.                                        |
| API keys                         | Store in environment variables, never in client code. Use Supabase service_role key only server-side. |

### 7.5 Security Headers (FastAPI)

```python
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://onlykrida.com", "exp://"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["api.onlykrida.com", "localhost"])

@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

---

## 8. Scaling Strategy

### 8.1 Supabase Tier Progression

| Users     | Tier          | Monthly Cost | Key Limits                                                           |
| --------- | ------------- | ------------ | -------------------------------------------------------------------- |
| 0-5K      | Free          | $0           | 500MB DB, 1GB storage, 2GB bandwidth, 500K edge function invocations |
| 5K-50K    | Pro           | $25          | 8GB DB, 100GB storage, 250GB bandwidth, 2M edge function invocations |
| 50K-200K  | Pro + Add-ons | $25 + ~$100  | 16GB DB ($50), compute add-on ($50), extra storage as needed         |
| 200K-500K | Team          | $599         | Dedicated Postgres, SOC2 compliance, priority support                |

**Critical decision point:** At ~100K users, evaluate whether to stay on Supabase Team or migrate Postgres to a self-managed instance on Railway/Render/AWS RDS. The FastAPI layer makes this migration straightforward since you are not locked into Supabase's client SDK for business logic.

### 8.2 Read Replicas

Needed when scout search queries start competing with athlete writes for database connections.

**Supabase Pro supports read replicas** (add-on, $0.01/hour per replica = ~$7/month).

Route reads vs writes:

```python
# deps.py
from supabase import create_client

# Write client (primary)
supabase_write = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Read client (replica)
supabase_read = create_client(SUPABASE_REPLICA_URL, SUPABASE_SERVICE_ROLE_KEY)

# In routers:
async def search_athletes(query: SearchQuery):
    # Reads go to replica
    result = supabase_read.from_('profiles').select('*').execute()
    ...

async def update_profile(profile: ProfileUpdate):
    # Writes go to primary
    result = supabase_write.from_('profiles').update(profile).execute()
    ...
```

### 8.3 Serverless Functions for Spiky Workloads

| Workload                      | Deployment                                 | Scale-to-Zero? | Why                                      |
| ----------------------------- | ------------------------------------------ | -------------- | ---------------------------------------- |
| Video transcode               | Cloud Run Jobs                             | Yes            | Spiky, CPU-intensive, 0 cost when idle   |
| ML inference                  | Cloud Run                                  | Yes            | Spiky, GPU optional, per-request billing |
| Image moderation              | Cloud Run                                  | Yes            | Spiky, fire-and-forget                   |
| Cron jobs (trending, digests) | Supabase Edge Functions or Cloud Scheduler | Yes            | Scheduled, lightweight                   |
| FastAPI main service          | Cloud Run (min 1 instance)                 | No             | Always-on for API responsiveness         |

### 8.4 Cost Optimization Checklist

- [ ] **Cloudflare CDN** in front of all media -- eliminates Supabase bandwidth charges for cached assets.
- [ ] **Client-side video compression** before upload -- reduces storage and transcode costs by 50-70%.
- [ ] **Pagination everywhere** -- no endpoint returns more than 50 rows.
- [ ] **Lazy loading** -- load video thumbnails first, full video on tap.
- [ ] **Redis cache** -- reduce database queries by 60-80% for hot data (profiles, feed).
- [ ] **Connection pooling** -- use Supabase's built-in PgBouncer. Set pool_mode=transaction.
- [ ] **Partition old data** -- move analytics_events older than 6 months to cold storage.
- [ ] **Image resizing on upload** -- avatars to 256x256, feed images to 1080px max width.
- [ ] **Delete orphaned storage objects** -- weekly cron to clean up uploads that were never linked to a record.

### 8.5 Database Connection Management

Supabase Free tier: 60 direct connections, Pro: 200+. With 500K users and 10% DAU (50K), you need connection pooling.

```
React Native app --> Supabase JS client (uses REST/PostgREST, not direct connections)
FastAPI service  --> PgBouncer (transaction mode) --> Postgres
```

The React Native app uses Supabase's REST API (PostgREST), which does not consume direct connections. Only the FastAPI service needs pooled connections. Configure:

```python
# FastAPI database connection via asyncpg with pooling
import asyncpg

pool = await asyncpg.create_pool(
    dsn=SUPABASE_DIRECT_URL,
    min_size=5,
    max_size=20,
    command_timeout=10,  # fail fast
)
```

---

## 9. Integration Points

### 9.1 Khelo India / SAI Integration

The Khelo India portal (kheloindia.gov.in) does not have a public API as of March 2026. Workarounds:

**Phase 1 (Manual):**

- Athletes manually enter Khelo India registration number.
- Store in verification_records with `verification_type = 'federation_card'`.
- Admin team manually cross-references against published results.

**Phase 2 (Scraping, if legal):**

- Scrape published results from kheloindia.gov.in (public data).
- Match against athlete profiles by name + sport + state.
- Auto-populate competition_results table.

**Phase 3 (Partnership):**

- Apply for data partnership with SAI (Sports Authority of India).
- If approved, get API access or bulk data dumps.
- This is the holy grail for verification credibility.

### 9.2 State Federation Databases

Most state federations publish results as PDFs on their websites. Build a lightweight scraper:

```python
# Scrape published results (public data only)
# Store in competition_results with verified=false until cross-referenced

FEDERATION_SOURCES = {
    "maharashtra_cricket": "https://mca.org.in/results/",
    "karnataka_athletics": "https://kaa.org.in/results/",
    # ... add as available
}
```

This is a low-priority, high-value long-term investment.

### 9.3 WhatsApp Business API

See Section 6.4.

**Key integration points:**

- Profile sharing (deep link: `https://onlykrida.com/athlete/{id}`)
- Opportunity alerts for matched athletes
- Application status updates
- Registration via WhatsApp (future -- WhatsApp flows)

**BSP recommendation:** Gupshup (India-based, cheapest for domestic messages, good docs).

### 9.4 Google Maps API

For location autocomplete during profile creation and geo-search:

```typescript
// React Native: expo-location + Google Places Autocomplete
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

// On selection, store:
// - profiles.location = "Mumbai, Maharashtra" (display string)
// - profiles.coordinates = point(19.076, 72.8777) (for geo-search)
```

**Cost:** Google Maps Platform gives $200/month free credit. Places Autocomplete: $2.83 per 1000 requests. At 500 signups/day with 5 keystrokes each = 2500 requests/day = $7/day = $210/month. The free credit almost covers it.

**Optimization:** Debounce autocomplete to 300ms and require at least 3 characters before firing.

### 9.5 Razorpay (Payments)

For premium subscriptions (Pro athlete, Pro scout, Featured opportunity).

```python
# services/payment.py
import razorpay

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

async def create_subscription(user_id: str, plan: str):
    """Create a Razorpay subscription for a user."""
    plans = {
        "athlete_pro": {
            "plan_id": "plan_XXXXX",  # created in Razorpay dashboard
            "amount": 29900,  # INR 299/month
        },
        "scout_pro": {
            "plan_id": "plan_YYYYY",
            "amount": 99900,  # INR 999/month
        },
        "featured_opportunity": {
            "plan_id": "plan_ZZZZZ",
            "amount": 49900,  # INR 499 one-time
        },
    }

    subscription = client.subscription.create({
        "plan_id": plans[plan]["plan_id"],
        "total_count": 12,  # 12 months
        "quantity": 1,
        "notes": {"user_id": user_id, "plan": plan},
    })

    return subscription
```

**Subscriptions table:**

```sql
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan            text NOT NULL CHECK (plan IN ('athlete_pro', 'scout_pro', 'academy_pro')),
    razorpay_subscription_id text UNIQUE,
    razorpay_payment_id text,
    status          text NOT NULL DEFAULT 'created'
                        CHECK (status IN ('created', 'active', 'paused', 'cancelled', 'expired')),
    amount_inr      integer NOT NULL,
    current_period_start timestamptz,
    current_period_end   timestamptz,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status) WHERE status = 'active';
```

**Pricing strategy (starting point):**

| Plan                 | Price (INR/month) | Features                                                                |
| -------------------- | ----------------- | ----------------------------------------------------------------------- |
| Athlete Free         | 0                 | 3 video uploads/day, basic profile, apply to opportunities              |
| Athlete Pro          | 299               | Unlimited uploads, video analytics, "who viewed me", priority in search |
| Scout Free           | 0                 | Browse profiles, 10 shortlists, basic search                            |
| Scout Pro            | 999               | Unlimited shortlists, advanced filters, export contacts, analytics      |
| Academy              | 1499              | Academy profile, batch management, bulk messaging                       |
| Featured Opportunity | 499 (one-time)    | Pin opportunity to top of feed for 7 days                               |

---

## 10. DevOps & CI/CD

### 10.1 Repository Structure (proposed)

```
onlysports-platform/
  app/                    # React Native (existing)
  components/             # (existing)
  hooks/                  # (existing)
  api/                    # NEW: FastAPI service
    Dockerfile
    requirements.txt
    main.py
    ...
  supabase/               # NEW: Supabase CLI managed
    migrations/
      001_initial_schema.sql
      002_add_video_analysis.sql
      003_add_scout_interactions.sql
      ...
    seed.sql
    config.toml
  .github/
    workflows/
      mobile-ci.yml
      api-ci.yml
      deploy-api.yml
      db-migrate.yml
  infra/                  # NEW: Infrastructure as Code
    cloudrun.yaml
    redis.yaml
```

### 10.2 GitHub Actions -- Mobile CI

```yaml
# .github/workflows/mobile-ci.yml
name: Mobile CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  typecheck-and-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx expo lint

  eas-build-preview:
    needs: typecheck-and-lint
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --profile preview --non-interactive
```

### 10.3 GitHub Actions -- API CI/CD

```yaml
# .github/workflows/api-ci.yml
name: API CI
on:
  push:
    paths: ['api/**']
  pull_request:
    paths: ['api/**']

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: onlykrida_test
        ports: ['5432:5432']
      redis:
        image: redis:7
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r api/requirements.txt
      - run: cd api && pytest --cov=. --cov-report=xml
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/onlykrida_test
          REDIS_URL: redis://localhost:6379

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: onlykrida-api
          source: api/
          region: asia-south1 # Mumbai
```

### 10.4 Database Migrations

Switch from ad-hoc SQL files to Supabase CLI managed migrations:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Initialize (one-time)
supabase init

# Create a new migration
supabase migration new add_video_analysis_tables

# Edit the generated file in supabase/migrations/
# Then apply:
supabase db push

# For CI/CD:
supabase db push --db-url $SUPABASE_DB_URL
```

**Migration naming convention:**

```
supabase/migrations/
  20260312000001_initial_schema.sql
  20260312000002_add_video_analysis_results.sql
  20260312000003_add_scout_interactions.sql
  20260312000004_add_verification_records.sql
  20260312000005_add_competition_results.sql
  20260312000006_add_academy_profiles.sql
  20260312000007_add_notification_preferences.sql
  20260312000008_add_push_tokens.sql
  20260312000009_add_subscriptions.sql
  20260312000010_add_abuse_reports.sql
  20260315000001_add_wearable_data_partitioned.sql
  20260315000002_add_training_logs_partitioned.sql
  20260320000001_add_fts_search_vector.sql
```

### 10.5 Staging Environment

- Supabase: Create a second project (`onlykrida-staging`). Free tier is fine.
- FastAPI: Deploy to Cloud Run with a `staging` service suffix.
- React Native: Use EAS Build profiles (`preview` and `production`).
- Environment variables: separate `.env.staging` and `.env.production`.

```json
// eas.json (add staging profile)
{
  "build": {
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://staging-xyz.supabase.co",
        "EXPO_PUBLIC_API_URL": "https://onlykrida-api-staging-xxxxx.run.app"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://prod-xyz.supabase.co",
        "EXPO_PUBLIC_API_URL": "https://api.onlykrida.com"
      }
    }
  }
}
```

### 10.6 Error Monitoring (Sentry)

```typescript
// In app/_layout.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
  environment: __DEV__ ? 'development' : 'production',
});
```

```python
# In api/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
    environment=settings.ENVIRONMENT,
)
```

**Sentry cost:** Free for 5K errors/month, Developer plan $26/month for 50K errors. Sufficient for MVP through 100K users.

### 10.7 Performance Monitoring

**Application-level:**

- Sentry Performance (included with error monitoring)
- Custom API response time logging:

```python
@app.middleware("http")
async def log_request_duration(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start) * 1000
    logger.info("request", path=request.url.path, method=request.method,
                status=response.status_code, duration_ms=round(duration_ms, 2))
    if duration_ms > 500:
        logger.warning("slow_request", path=request.url.path, duration_ms=duration_ms)
    return response
```

**Database-level:**

- Supabase Dashboard has built-in query performance monitoring.
- Enable `pg_stat_statements` for slow query detection:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slowest queries
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Uptime monitoring:**

- Use Betterstack (free tier: 10 monitors) or UptimeRobot (free: 50 monitors).
- Monitor: API health endpoint, Supabase connection, Redis connection.

---

## 11. Cost Estimates

### Monthly costs by growth stage

#### Stage 1: MVP (0-5K users, 500 DAU)

| Service                         | Cost (USD/month)  |
| ------------------------------- | ----------------- |
| Supabase Free                   | $0                |
| Cloud Run (FastAPI, minimal)    | $5-10             |
| Cloud Run Jobs (video, ~10/day) | $2                |
| Redis (Upstash free)            | $0                |
| Cloudflare (free)               | $0                |
| Sentry (free)                   | $0                |
| Resend (free, 3K emails)        | $0                |
| Google Maps ($200 credit)       | $0                |
| Domain + DNS                    | $12/year = $1     |
| **Total**                       | **~$10-15/month** |

#### Stage 2: Growth (5K-50K users, 5K DAU)

| Service                          | Cost (USD/month)    |
| -------------------------------- | ------------------- |
| Supabase Pro                     | $25                 |
| Cloud Run (FastAPI, always-on)   | $30-50              |
| Cloud Run Jobs (video, ~100/day) | $15                 |
| Redis (Upstash Pay-as-you-go)    | $10                 |
| Cloudflare (free)                | $0                  |
| Sentry Developer                 | $26                 |
| Resend (50K emails)              | $20                 |
| Google Cloud Vision (moderation) | $15                 |
| Google Maps                      | $10                 |
| WhatsApp (Gupshup, 500 msgs/day) | $90                 |
| **Total**                        | **~$240-260/month** |

#### Stage 3: Scale (50K-500K users, 50K DAU)

| Service                           | Cost (USD/month)      |
| --------------------------------- | --------------------- |
| Supabase Team                     | $599                  |
| Supabase read replica             | $50                   |
| Cloud Run (FastAPI, scaled)       | $150-300              |
| Cloud Run Jobs (video, ~1000/day) | $114                  |
| Redis (Upstash Pro)               | $50                   |
| Typesense Cloud                   | $30-60                |
| Cloudflare Pro (WAF, analytics)   | $20                   |
| Sentry Team                       | $80                   |
| Resend (500K emails)              | $100                  |
| Google Cloud Vision               | $50                   |
| Google Maps                       | $50                   |
| WhatsApp (5000 msgs/day)          | $600                  |
| Razorpay (2% + INR 2 per txn)     | Variable              |
| **Total**                         | **~$1900-2100/month** |

These numbers assume aggressive caching and CDN usage. Without Cloudflare CDN, bandwidth costs alone could triple.

---

## 12. Implementation Timeline

### Phase 1: Foundation (Weeks 1-4)

**Goal:** Move from ad-hoc SQL files to proper infrastructure. No user-facing changes.

- [ ] Initialize Supabase CLI, create `supabase/migrations/` directory, port canonical schema as migration 001.
- [ ] Fix RLS policy gaps (profiles INSERT, player_stats, scout_preferences, ai_recommendations).
- [ ] Add `search_vector` tsvector column and trigger to profiles.
- [ ] Add `scout_interactions` table.
- [ ] Add `verification_records` and `competition_results` tables.
- [ ] Set up GitHub Actions for mobile CI (typecheck + lint).
- [ ] Set up Sentry for React Native.
- [ ] Set up Cloudflare CDN in front of Supabase Storage.

### Phase 2: API Layer (Weeks 5-8)

**Goal:** Stand up the FastAPI service with core endpoints.

- [ ] Scaffold FastAPI project in `api/` directory.
- [ ] Implement JWT verification middleware (verify Supabase tokens).
- [ ] Implement search endpoint with Postgres FTS.
- [ ] Implement scout_interactions tracking (profile_view, shortlist_add).
- [ ] Implement "who viewed my profile" endpoint.
- [ ] Deploy to Cloud Run (Mumbai region).
- [ ] Set up Redis on Upstash.
- [ ] Implement rate limiting middleware.
- [ ] Set up staging environment.

### Phase 3: Video Pipeline (Weeks 9-12)

**Goal:** Proper video transcode and delivery.

- [ ] Build FFmpeg Docker image for Cloud Run Jobs.
- [ ] Implement upload -> webhook -> transcode -> update flow.
- [ ] Add thumbnail generation.
- [ ] Implement adaptive quality selection in React Native.
- [ ] Client-side video compression before upload.
- [ ] Add content moderation (Google Cloud Vision) in the transcode pipeline.

### Phase 4: Engagement & Monetization (Weeks 13-16)

**Goal:** Notifications, payments, and analytics.

- [ ] Add `notification_preferences` and `push_tokens` tables.
- [ ] Implement Expo Push Notifications.
- [ ] Implement email notifications (Resend).
- [ ] Implement WhatsApp sharing (Gupshup).
- [ ] Add `subscriptions` table and Razorpay integration.
- [ ] Implement trending athletes materialized view.
- [ ] Set up analytics event tracking on client.

### Phase 5: Intelligence (Weeks 17-20)

**Goal:** ML-powered features, advanced search.

- [ ] Deploy video analysis ML model on Cloud Run (pose estimation, technique scoring).
- [ ] Add `video_analysis_results` table and pipeline.
- [ ] Migrate search from Postgres FTS to Typesense (if needed at this scale).
- [ ] Implement geo-based search.
- [ ] Build ML recommendation pipeline (scout-athlete matching).
- [ ] Add wearable data integration (Google Fit/Apple Health).

### Phase 6: Scale & Compliance (Weeks 21-24)

**Goal:** Prepare for 100K+ users.

- [ ] Add read replica for scout search queries.
- [ ] Implement data partitioning for time-series tables.
- [ ] DPDPA compliance audit and implementation.
- [ ] Age verification flow for minors.
- [ ] Abuse reporting system.
- [ ] Full account deletion flow (right to erasure).
- [ ] Load testing (target: 1000 concurrent users, sub-500ms p95).
- [ ] Database performance audit (pg_stat_statements, index review).

---

## Appendix A: Decision Log

| Decision                               | Choice                              | Rationale                                                                                                                 |
| -------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Keep Supabase vs. self-hosted Postgres | Keep Supabase                       | Auth, Realtime, Storage, RLS -- too much to rebuild. Migrate only if hitting Supabase limits at 500K+.                    |
| Monolith FastAPI vs. microservices     | Monolith                            | Startup with 1-2 backend devs. Microservices add operational cost with zero benefit at this scale. Split later if needed. |
| Cloud Run vs. AWS Lambda vs. Fly.io    | Cloud Run                           | Mumbai region (asia-south1), scale-to-zero, Docker-based (easy local dev), generous free tier.                            |
| Redis provider                         | Upstash                             | Serverless, pay-per-request, free tier, works well with Cloud Run.                                                        |
| Search engine                          | Postgres FTS first, Typesense later | Avoid premature optimization. Postgres FTS is free and handles 50K profiles easily.                                       |
| WhatsApp BSP                           | Gupshup                             | India-based, cheapest per-message, good documentation, used by many Indian startups.                                      |
| Payment gateway                        | Razorpay                            | Dominant in India, good UX, supports subscriptions, INR-native.                                                           |
| CDN                                    | Cloudflare                          | Free tier handles everything we need. Unlimited bandwidth.                                                                |
| Video transcode                        | Cloud Run Jobs + FFmpeg             | Pay-per-use, no idle cost, scales to zero. Avoids AWS MediaConvert complexity.                                            |
| Monitoring                             | Sentry                              | Covers both React Native and FastAPI. Free tier is generous.                                                              |

## Appendix B: Environment Variables Reference

```bash
# Supabase
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_DB_URL=postgresql://postgres:password@db.xyz.supabase.co:5432/postgres

# Redis
REDIS_URL=redis://default:password@us1-xyz.upstash.io:6379

# Google Cloud
GCP_PROJECT_ID=onlykrida-prod
GCP_REGION=asia-south1

# External APIs
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
GUPSHUP_API_KEY=xxx
WHATSAPP_BUSINESS_NUMBER=+919876543210
RESEND_API_KEY=re_xxx
GOOGLE_MAPS_API_KEY=AIza_xxx
GOOGLE_CLOUD_VISION_API_KEY=AIza_xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx

# Typesense (Phase 2)
TYPESENSE_API_KEY=xxx
TYPESENSE_HOST=xxx.typesense.net
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https
```
