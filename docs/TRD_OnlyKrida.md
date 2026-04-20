# Technical Requirement Document (TRD)

# OnlyKrida — India's First AI-Powered Sports Talent Discovery Platform

> **Version**: 1.0 | **Date**: April 2026 | **Status**: MVP Complete | **Classification**: Confidential

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Database Design](#2-database-design)
3. [API Design](#3-api-design)
4. [Realtime Architecture](#4-realtime-architecture)
5. [Storage Architecture](#5-storage-architecture)
6. [Security](#6-security)
7. [Scalability Plan](#7-scalability-plan)
8. [Performance Optimization](#8-performance-optimization)
9. [DevOps](#9-devops)
10. [AI Architecture](#10-ai-architecture)
11. [Testing Strategy](#11-testing-strategy)
12. [Monitoring & Observability](#12-monitoring--observability)

---

# 1. System Architecture

## 1.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER                                  │
│                                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐                │
│  │   iOS App   │  │ Android App  │  │   Web App   │                │
│  │  (Expo Go/  │  │  (Expo Go/   │  │ (react-     │                │
│  │   EAS Build)│  │   EAS Build) │  │  native-web)│                │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘                │
│         └────────────────┼─────────────────┘                         │
│                          │                                            │
│  ┌───────────────────────▼──────────────────────────────────────┐   │
│  │               Shared React Native Codebase                    │   │
│  │                                                               │   │
│  │  Expo SDK 54 │ TypeScript 5.9 │ Expo Router 6               │   │
│  │                                                               │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │              Context Provider Tree                    │    │   │
│  │  │                                                       │    │   │
│  │  │  AuthProvider                                         │    │   │
│  │  │   └─ NotificationProvider + FollowProvider            │    │   │
│  │  │       └─ MessagesProvider + GroupsProvider             │    │   │
│  │  │           └─ UsersProvider + PostsProvider             │    │   │
│  │  │               └─ ScoutingProvider + FitnessProvider    │    │   │
│  │  │                   └─ OpportunitiesProvider             │    │   │
│  │  │                       └─ SearchProvider + AIProvider   │    │   │
│  │  │                           └─ <App Screens>            │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                          │                                            │
└──────────────────────────┼────────────────────────────────────────────┘
                           │ HTTPS (REST) + WSS (Realtime)
┌──────────────────────────▼────────────────────────────────────────────┐
│                         SUPABASE TIER                                  │
│                                                                        │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────────────┐  │
│  │   GoTrue     │  │   PostgREST    │  │      Realtime            │  │
│  │   (Auth)     │  │   (REST API)   │  │   (WebSocket)            │  │
│  │              │  │                │  │                           │  │
│  │  JWT tokens  │  │  Auto-gen CRUD │  │  Postgres Changes        │  │
│  │  Session mgmt│  │  from schema   │  │  Broadcast               │  │
│  │  OAuth (plan)│  │  RLS enforced  │  │  Presence (planned)      │  │
│  └──────┬───────┘  └───────┬────────┘  └────────────┬─────────────┘  │
│         │                  │                         │                 │
│  ┌──────▼──────────────────▼─────────────────────────▼──────────────┐ │
│  │                    PostgreSQL 15+                                  │ │
│  │                                                                    │ │
│  │  13 Tables │ RLS on all │ pg_trgm │ uuid-ossp │ Indexes          │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────────────────────────────┐  │
│  │   Storage (S3)   │  │         Edge Functions (Deno)             │  │
│  │                  │  │                                           │  │
│  │  avatars/        │  │  ai-proxy (planned)                      │  │
│  │  posts/          │  │  payment-webhook (planned)                │  │
│  │  videos/         │  │  push-notification (planned)              │  │
│  └──────────────────┘  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────────────────┐
│                       EXTERNAL SERVICES                                │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  Claude API  │  │ Expo Push    │  │    Razorpay / Stripe     │   │
│  │  (Anthropic) │  │ Service      │  │    (planned)             │   │
│  │              │  │              │  │                           │   │
│  │  Opus 4.6   │  │ APNS + FCM   │  │  Subscriptions           │   │
│  │  Sonnet 4.6 │  │  routing     │  │  Payments                │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Frontend Architecture

### Technology Choices

| Choice    | Technology                  | Rationale                                                                            |
| --------- | --------------------------- | ------------------------------------------------------------------------------------ |
| Framework | React Native + Expo         | Single codebase for iOS, Android, Web; large ecosystem; Expo simplifies build/deploy |
| Language  | TypeScript 5.9              | Type safety across 6,300+ LOC; catch bugs at compile time                            |
| Routing   | Expo Router 6               | File-based routing (Next.js pattern); deep linking built-in; typed routes            |
| State     | React Context + React Query | Context for client state; React Query for server state caching                       |
| Media     | expo-image + expo-video     | expo-image: disk/memory cache, blurhash, WebP; expo-video: background playback, PiP  |
| Icons     | Lucide React Native         | 700+ consistent SVG icons; tree-shakeable                                            |

### File Structure

```
app/                          # Expo Router screens
├── (auth)/                   # Auth group (unauthenticated)
│   ├── welcome.tsx
│   ├── login.tsx
│   ├── signup.tsx
│   ├── role-selection.tsx
│   ├── signup-athlete.tsx
│   ├── signup-coach.tsx
│   ├── signup-scout.tsx
│   ├── signup-team.tsx
│   └── signup-trainer.tsx
├── (tabs)/                   # Main app (authenticated)
│   ├── (home)/index.tsx      # Feed/Dashboard
│   ├── discover.tsx          # Search & Discovery
│   ├── create.tsx            # Create Post
│   ├── opportunities.tsx     # Opportunity Marketplace
│   ├── messages.tsx          # DM List
│   └── _layout.tsx           # Tab navigator config
├── chat/[id].tsx             # 1-on-1 Chat
├── chat/group/[id].tsx       # Group Chat
├── post/[id].tsx             # Post Detail
├── user/[id].tsx             # Public Profile
├── ai-assistant.tsx          # AI Chat
├── beep-test.tsx             # Fitness Test Landing
├── beep-test-live.tsx        # Live Beep Test
├── beep-test-results.tsx     # Test Results
├── beep-test-history.tsx     # Test History
├── edit-profile.tsx
├── settings.tsx
├── team-dashboard.tsx
├── player-stats.tsx
├── scout-preferences.tsx
├── verify-result.tsx
└── _layout.tsx               # Root layout (providers)

components/                   # 47 reusable components
hooks/                        # 12 context providers
services/                     # External service clients (AI)
constants/                    # Theme, Supabase client, config
types/                        # TypeScript interfaces
assets/                       # Images, fonts
scripts/                      # Seed data, utilities
```

### Context Provider Architecture

All providers use `@nkzw/create-context-hook` which returns `[Provider, useHook]` tuples:

```typescript
// Pattern used across all 12 contexts
const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase auth listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) await fetchProfile(session.user.id);
      else setUser(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, session, isLoading, login, signup, logout, updateProfile };
});
```

**Provider grouping for performance** (in `_layout.tsx`):

```
AuthProvider
 └─ SocialProviders (Notifications + Follows)
     └─ CommunicationProviders (Messages + Groups)
         └─ ContentProviders (Users + Posts + Scouting + Fitness)
             └─ OpportunitiesProvider
                 └─ SearchProvider
                     └─ AIProvider
                         └─ <Screens>
```

All groups are wrapped in `React.memo` to prevent unnecessary re-renders when unrelated state changes.

---

# 2. Database Design

## 2.1 Entity Relationship Overview

```
profiles ──────── posts (1:many)
    │                │
    ├── follows       ├── likes (many:many)
    │   (many:many)  ├── comments (1:many)
    │                │       └── comment_likes
    ├── messages     │
    │   (many:many)  ├── shares (via messages.post_id)
    │
    ├── notifications
    │
    ├── player_stats (1:1)
    │
    ├── scout_preferences (1:1)
    │
    ├── ai_recommendations (scout ↔ athlete, many:many)
    │
    ├── opportunities (team:many)
    │       └── applications (many:many with athletes)
    │
    └── fitness_tests (1:many)
```

## 2.2 Table Definitions

### Table 1: profiles

| Column             | Type        | Constraints      | Default            | Description                                                            |
| ------------------ | ----------- | ---------------- | ------------------ | ---------------------------------------------------------------------- |
| id                 | UUID        | PRIMARY KEY      | uuid_generate_v4() | Matches auth.uid()                                                     |
| email              | TEXT        | NOT NULL, UNIQUE | —                  | User email                                                             |
| name               | TEXT        | NOT NULL         | —                  | Display name                                                           |
| role               | TEXT        | NOT NULL         | —                  | One of: athlete, coach, scout, team, fan, trainer, gym, brand, academy |
| avatar             | TEXT        | —                | NULL               | Storage URL for profile pic                                            |
| cover_photo        | TEXT        | —                | NULL               | Storage URL for cover image                                            |
| bio                | TEXT        | —                | NULL               | User biography                                                         |
| location           | TEXT        | —                | NULL               | City, State                                                            |
| verified           | BOOLEAN     | —                | false              | Verification status                                                    |
| sport              | TEXT        | —                | NULL               | Primary sport                                                          |
| position           | TEXT        | —                | NULL               | Playing position (athletes)                                            |
| achievements       | JSONB       | —                | '[]'               | Array of {title, description, date, icon}                              |
| stats              | JSONB       | —                | '{}'               | Key-value performance metrics                                          |
| role_specific_data | JSONB       | —                | '{}'               | Role-dependent fields                                                  |
| followers_count    | INTEGER     | —                | 0                  | Denormalized count                                                     |
| following_count    | INTEGER     | —                | 0                  | Denormalized count                                                     |
| posts_count        | INTEGER     | —                | 0                  | Denormalized count                                                     |
| created_at         | TIMESTAMPTZ | NOT NULL         | NOW()              | Account creation                                                       |
| updated_at         | TIMESTAMPTZ | NOT NULL         | NOW()              | Last profile update                                                    |

**Indexes**:

```sql
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_sport ON profiles(sport);
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_profiles_verified ON profiles(verified);
CREATE INDEX idx_profiles_name_trgm ON profiles USING GIN(name gin_trgm_ops);
CREATE INDEX idx_profiles_created ON profiles(created_at DESC);
```

**RLS Policies**:

```sql
-- Anyone can read profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Users can only insert their own profile
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

**JSONB Schema — achievements**:

```json
[
  {
    "title": "District Football Champion",
    "description": "Won the U-19 Bellary District Football Championship",
    "date": "2025-11-15",
    "icon": "trophy"
  }
]
```

**JSONB Schema — role_specific_data (athlete)**:

```json
{
  "height": 178,
  "weight": 72,
  "date_of_birth": "2009-03-15",
  "career_goals": "Professional footballer in ISL",
  "dominant_foot": "right",
  "jersey_number": 9
}
```

**JSONB Schema — role_specific_data (scout)**:

```json
{
  "organization": "Bengaluru FC Scouting Network",
  "regions": ["Karnataka", "Goa", "Maharashtra"],
  "athlete_levels": ["youth", "college", "semi-pro"],
  "looking_for": "Fast strikers with good first touch"
}
```

---

### Table 2: posts

| Column         | Type        | Constraints                                 | Default            | Description                             |
| -------------- | ----------- | ------------------------------------------- | ------------------ | --------------------------------------- |
| id             | UUID        | PRIMARY KEY                                 | uuid_generate_v4() | —                                       |
| user_id        | UUID        | NOT NULL, FK profiles(id) ON DELETE CASCADE | —                  | Post author                             |
| title          | TEXT        | —                                           | NULL               | Optional title                          |
| description    | TEXT        | —                                           | NULL               | Post caption                            |
| video_url      | TEXT        | —                                           | NULL               | Storage URL for video                   |
| image_url      | TEXT        | —                                           | NULL               | Storage URL for image                   |
| type           | TEXT        | —                                           | 'highlight'        | highlight, training, match, achievement |
| likes_count    | INTEGER     | —                                           | 0                  | Denormalized                            |
| comments_count | INTEGER     | —                                           | 0                  | Denormalized                            |
| views_count    | INTEGER     | —                                           | 0                  | Denormalized                            |
| shares_count   | INTEGER     | —                                           | 0                  | Denormalized                            |
| opportunity_id | UUID        | FK opportunities(id)                        | NULL               | If post is opportunity                  |
| created_at     | TIMESTAMPTZ | NOT NULL                                    | NOW()              | —                                       |
| updated_at     | TIMESTAMPTZ | NOT NULL                                    | NOW()              | —                                       |

**Indexes**:

```sql
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_feed ON posts(created_at DESC) WHERE opportunity_id IS NULL;
```

**RLS**:

```sql
CREATE POLICY "posts_select" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (auth.uid() = user_id);
```

---

### Table 3: opportunities

| Column             | Type        | Constraints               | Default            | Description                                                 |
| ------------------ | ----------- | ------------------------- | ------------------ | ----------------------------------------------------------- |
| id                 | UUID        | PRIMARY KEY               | uuid_generate_v4() | —                                                           |
| team_id            | UUID        | NOT NULL, FK profiles(id) | —                  | Posting team                                                |
| title              | TEXT        | NOT NULL                  | —                  | Opportunity title                                           |
| description        | TEXT        | —                         | NULL               | Full description                                            |
| category           | TEXT        | NOT NULL                  | —                  | tryouts, tournaments, sponsorships, scholarships, contracts |
| type               | JSONB       | —                         | '[]'               | Tags: paid, unpaid, local, national, etc.                   |
| sport              | TEXT        | —                         | NULL               | Required sport                                              |
| location           | TEXT        | —                         | NULL               | Event location                                              |
| deadline           | TIMESTAMPTZ | —                         | NULL               | Application deadline                                        |
| requirements       | TEXT        | —                         | NULL               | Eligibility requirements                                    |
| compensation       | TEXT        | —                         | NULL               | Pay, accommodation, etc.                                    |
| duration           | TEXT        | —                         | NULL               | Program/contract length                                     |
| age_range          | TEXT        | —                         | NULL               | e.g., "16-21"                                               |
| skill_level        | TEXT        | —                         | NULL               | beginner, intermediate, advanced, pro                       |
| contact_info       | TEXT        | —                         | NULL               | Contact details                                             |
| paid               | BOOLEAN     | —                         | false              | Is this a paid opportunity?                                 |
| applications_count | INTEGER     | —                         | 0                  | Denormalized                                                |
| created_at         | TIMESTAMPTZ | NOT NULL                  | NOW()              | —                                                           |

**Indexes**: team_id, sport, category, deadline DESC

**RLS**: Public read; teams CRUD own only

---

### Table 4: applications

| Column         | Type        | Constraints                                      | Default            | Description                 |
| -------------- | ----------- | ------------------------------------------------ | ------------------ | --------------------------- |
| id             | UUID        | PRIMARY KEY                                      | uuid_generate_v4() | —                           |
| opportunity_id | UUID        | NOT NULL, FK opportunities(id) ON DELETE CASCADE | —                  | —                           |
| athlete_id     | UUID        | NOT NULL, FK profiles(id)                        | —                  | Applicant                   |
| status         | TEXT        | NOT NULL                                         | 'pending'          | pending, accepted, rejected |
| cover_letter   | TEXT        | —                                                | NULL               | Application text            |
| created_at     | TIMESTAMPTZ | NOT NULL                                         | NOW()              | —                           |

**Constraints**: UNIQUE(opportunity_id, athlete_id)

**RLS**: Visible to applicant + opportunity owner; athletes CRUD own; teams update status

---

### Table 5: follows

| Column       | Type        | Constraints                                 | Default            | Description     |
| ------------ | ----------- | ------------------------------------------- | ------------------ | --------------- |
| id           | UUID        | PRIMARY KEY                                 | uuid_generate_v4() | —               |
| follower_id  | UUID        | NOT NULL, FK profiles(id) ON DELETE CASCADE | —                  | Who follows     |
| following_id | UUID        | NOT NULL, FK profiles(id) ON DELETE CASCADE | —                  | Who is followed |
| created_at   | TIMESTAMPTZ | NOT NULL                                    | NOW()              | —               |

**Constraints**: UNIQUE(follower_id, following_id), CHECK(follower_id != following_id)

---

### Table 6: likes

| Column     | Type        | Constraints                                 | Default            |
| ---------- | ----------- | ------------------------------------------- | ------------------ |
| id         | UUID        | PRIMARY KEY                                 | uuid_generate_v4() |
| user_id    | UUID        | NOT NULL, FK profiles(id) ON DELETE CASCADE | —                  |
| post_id    | UUID        | NOT NULL, FK posts(id) ON DELETE CASCADE    | —                  |
| created_at | TIMESTAMPTZ | NOT NULL                                    | NOW()              |

**Constraints**: UNIQUE(user_id, post_id)

---

### Table 7: comments

| Column      | Type        | Constraints                                 | Default            |
| ----------- | ----------- | ------------------------------------------- | ------------------ |
| id          | UUID        | PRIMARY KEY                                 | uuid_generate_v4() |
| user_id     | UUID        | NOT NULL, FK profiles(id) ON DELETE CASCADE | —                  |
| post_id     | UUID        | NOT NULL, FK posts(id) ON DELETE CASCADE    | —                  |
| content     | TEXT        | NOT NULL                                    | —                  |
| likes_count | INTEGER     | —                                           | 0                  |
| created_at  | TIMESTAMPTZ | NOT NULL                                    | NOW()              |

**Indexes**: post_id, user_id

---

### Table 8: comment_likes

| Column     | Type        | Constraints                                 | Default            |
| ---------- | ----------- | ------------------------------------------- | ------------------ |
| id         | UUID        | PRIMARY KEY                                 | uuid_generate_v4() |
| user_id    | UUID        | NOT NULL, FK profiles(id) ON DELETE CASCADE | —                  |
| comment_id | UUID        | NOT NULL, FK comments(id) ON DELETE CASCADE | —                  |
| created_at | TIMESTAMPTZ | NOT NULL                                    | NOW()              |

**Constraints**: UNIQUE(user_id, comment_id)

---

### Table 9: messages

| Column      | Type        | Constraints               | Default            | Description           |
| ----------- | ----------- | ------------------------- | ------------------ | --------------------- |
| id          | UUID        | PRIMARY KEY               | uuid_generate_v4() | —                     |
| sender_id   | UUID        | NOT NULL, FK profiles(id) | —                  | Message sender        |
| receiver_id | UUID        | NOT NULL, FK profiles(id) | —                  | Message receiver      |
| content     | TEXT        | —                         | NULL               | Message text          |
| media_url   | TEXT        | —                         | NULL               | Attached media        |
| post_id     | UUID        | FK posts(id)              | NULL               | Shared post           |
| status      | TEXT        | NOT NULL                  | 'sent'             | sent, delivered, read |
| read        | BOOLEAN     | —                         | false              | Has receiver read it? |
| created_at  | TIMESTAMPTZ | NOT NULL                  | NOW()              | —                     |

**Indexes**:

```sql
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_conversation ON messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);
CREATE INDEX idx_messages_unread ON messages(receiver_id, read) WHERE read = false;
```

**RLS**: Visible to sender or receiver only

---

### Table 10: notifications

| Column     | Type        | Constraints                                 | Default            |
| ---------- | ----------- | ------------------------------------------- | ------------------ |
| id         | UUID        | PRIMARY KEY                                 | uuid_generate_v4() |
| user_id    | UUID        | NOT NULL, FK profiles(id) ON DELETE CASCADE |
| type       | TEXT        | NOT NULL                                    | —                  |
| title      | TEXT        | NOT NULL                                    | —                  |
| message    | TEXT        | —                                           | NULL               |
| read       | BOOLEAN     | —                                           | false              |
| data       | JSONB       | —                                           | '{}'               |
| created_at | TIMESTAMPTZ | NOT NULL                                    | NOW()              |

**Type values**: like, follow, comment, opportunity, message, application, connection_request, connection_accepted, profile_view, mention, system

**Indexes**: user_id, read, type, created_at DESC

**RLS**: Users can only see their own notifications

---

### Table 11: player_stats

| Column     | Type        | Constraints                                 | Default            |
| ---------- | ----------- | ------------------------------------------- | ------------------ |
| id         | UUID        | PRIMARY KEY                                 | uuid_generate_v4() |
| player_id  | UUID        | NOT NULL, FK profiles(id) ON DELETE CASCADE |
| sport      | TEXT        | —                                           | NULL               |
| position   | TEXT        | —                                           | NULL               |
| skill      | NUMERIC     | CHECK(0-100)                                | 50                 |
| speed      | NUMERIC     | CHECK(0-100)                                | 50                 |
| stamina    | NUMERIC     | CHECK(0-100)                                | 50                 |
| created_at | TIMESTAMPTZ | NOT NULL                                    | NOW()              |
| updated_at | TIMESTAMPTZ | NOT NULL                                    | NOW()              |

---

### Table 12: scout_preferences

| Column                | Type        | Constraints                                 | Default            |
| --------------------- | ----------- | ------------------------------------------- | ------------------ |
| id                    | UUID        | PRIMARY KEY                                 | uuid_generate_v4() |
| scout_id              | UUID        | NOT NULL, FK profiles(id) ON DELETE CASCADE |
| sport                 | TEXT        | —                                           | NULL               |
| preferred_positions   | TEXT[]      | —                                           | '{}'               |
| weight_skill          | NUMERIC     | CHECK(0-100)                                | 30                 |
| weight_speed          | NUMERIC     | CHECK(0-100)                                | 25                 |
| weight_stamina        | NUMERIC     | CHECK(0-100)                                | 25                 |
| weight_position_match | NUMERIC     | CHECK(0-100)                                | 20                 |
| created_at            | TIMESTAMPTZ | NOT NULL                                    | NOW()              |
| updated_at            | TIMESTAMPTZ | NOT NULL                                    | NOW()              |

---

### Table 13: ai_recommendations

| Column     | Type        | Constraints               | Default            |
| ---------- | ----------- | ------------------------- | ------------------ |
| id         | UUID        | PRIMARY KEY               | uuid_generate_v4() |
| scout_id   | UUID        | NOT NULL, FK profiles(id) |
| player_id  | UUID        | NOT NULL, FK profiles(id) |
| fit_score  | NUMERIC     | CHECK(0-100)              | —                  |
| breakdown  | JSONB       | —                         | '{}'               |
| notes      | TEXT        | —                         | NULL               |
| created_at | TIMESTAMPTZ | NOT NULL                  | NOW()              |

**Constraints**: UNIQUE(scout_id, player_id)

**Breakdown JSONB**:

```json
{
  "skill_score": 85,
  "speed_score": 92,
  "stamina_score": 78,
  "position_match": 100,
  "weights_applied": {
    "skill": 30,
    "speed": 40,
    "stamina": 20,
    "position": 10
  }
}
```

## 2.3 Database Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- Trigram text search
```

## 2.4 Common Query Patterns

**Feed query** (most frequent):

```sql
SELECT p.*, pr.name, pr.avatar, pr.role, pr.verified
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
WHERE p.opportunity_id IS NULL
ORDER BY p.created_at DESC
LIMIT 20 OFFSET ?;
```

**Discover search** (with trigram):

```sql
SELECT * FROM profiles
WHERE (name % ? OR name ILIKE '%' || ? || '%')
  AND (? IS NULL OR role = ?)
  AND (? IS NULL OR sport = ?)
  AND (? IS NULL OR location ILIKE '%' || ? || '%')
  AND (? IS NULL OR verified = ?)
ORDER BY similarity(name, ?) DESC, followers_count DESC
LIMIT 20;
```

**Conversation list** (DMs):

```sql
SELECT DISTINCT ON (conversation_partner)
  m.*,
  CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as conversation_partner
FROM messages m
WHERE m.sender_id = ? OR m.receiver_id = ?
ORDER BY conversation_partner, m.created_at DESC;
```

**Unread message count**:

```sql
SELECT COUNT(*) FROM messages
WHERE receiver_id = ? AND read = false;
```

---

# 3. API Design

OnlyKrida uses Supabase client SDK, which auto-generates REST API from the database schema. All queries go through PostgREST with RLS enforcement.

## 3.1 Authentication

```typescript
// Signup
const { data, error } = await supabase.auth.signUp({
  email: 'athlete@example.com',
  password: 'securepassword',
  options: {
    data: { name: 'Vikram Kumar', role: 'athlete' },
  },
});

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'athlete@example.com',
  password: 'securepassword',
});

// Logout
await supabase.auth.signOut();

// Session listener
supabase.auth.onAuthStateChange((event, session) => {
  // 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED'
});
```

## 3.2 Profiles

```typescript
// Get profile
const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();

// Update profile
const { error } = await supabase
  .from('profiles')
  .update({ bio: 'New bio', sport: 'Football' })
  .eq('id', userId);

// Search profiles (discover)
const { data } = await supabase
  .from('profiles')
  .select('*')
  .ilike('name', `%${query}%`)
  .eq('role', 'athlete')
  .eq('sport', 'Football')
  .order('followers_count', { ascending: false })
  .range(0, 19);
```

## 3.3 Posts

```typescript
// Create post
const { data } = await supabase
  .from('posts')
  .insert({
    user_id: userId,
    description: 'Training highlights',
    image_url: uploadedUrl,
    type: 'highlight',
  })
  .select()
  .single();

// Feed query
const { data } = await supabase
  .from('posts')
  .select(`*, profiles!user_id(name, avatar, role, verified)`)
  .is('opportunity_id', null)
  .order('created_at', { ascending: false })
  .range(offset, offset + 19);

// Like post (with count update)
await supabase.from('likes').insert({ user_id: userId, post_id: postId });
await supabase.rpc('increment_count', { table: 'posts', column: 'likes_count', row_id: postId });
```

## 3.4 Messaging

```typescript
// Send message
const { data } = await supabase
  .from('messages')
  .insert({
    sender_id: currentUserId,
    receiver_id: recipientId,
    content: 'Hello, I saw your profile...',
    status: 'sent',
  })
  .select()
  .single();

// Get conversation
const { data } = await supabase
  .from('messages')
  .select('*')
  .or(
    `and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`,
  )
  .order('created_at', { ascending: true })
  .range(0, 49);

// Mark as read
await supabase
  .from('messages')
  .update({ read: true, status: 'read' })
  .eq('receiver_id', currentUserId)
  .eq('sender_id', senderId)
  .eq('read', false);
```

## 3.5 Error Handling Pattern

```typescript
try {
  const { data, error } = await supabase.from('posts').select('*');
  if (error) throw error;
  return data;
} catch (error) {
  if (error.code === 'PGRST301') {
    // RLS violation
    console.error('Unauthorized access');
  } else if (error.code === '23505') {
    // Unique constraint violation (e.g., duplicate like)
    console.warn('Already exists');
  } else {
    console.error('Database error:', error.message);
  }
}
```

---

# 4. Realtime Architecture

## 4.1 Supabase Realtime Channels

| Channel            | Table         | Events                 | Purpose                    |
| ------------------ | ------------- | ---------------------- | -------------------------- |
| posts_feed         | posts         | INSERT, UPDATE, DELETE | Live feed updates          |
| user_messages      | messages      | INSERT, UPDATE         | Real-time chat delivery    |
| user_notifications | notifications | INSERT                 | Live notification delivery |
| user_follows       | follows       | INSERT, DELETE         | Follow/unfollow updates    |
| opportunities_feed | opportunities | INSERT, UPDATE         | New opportunities          |

## 4.2 Subscription Setup

```typescript
// Message subscription (in messages-context.tsx)
const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `receiver_id=eq.${userId}`,
    },
    (payload) => {
      const newMessage = payload.new as Message;
      addMessageToConversation(newMessage);
      incrementUnreadCount();
    },
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
      filter: `sender_id=eq.${userId}`,
    },
    (payload) => {
      // Read receipt update
      updateMessageStatus(payload.new);
    },
  )
  .subscribe();

// Cleanup on unmount
return () => {
  supabase.removeChannel(channel);
};
```

## 4.3 Connection Management

- Supabase client handles WebSocket reconnection automatically
- Exponential backoff on connection failure
- Channels re-subscribe on reconnect
- Client-side: check `channel.state` before operations

## 4.4 Future: Presence

```typescript
// Planned: Show online status
const channel = supabase
  .channel('online_users')
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    setOnlineUsers(Object.keys(state));
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user_id: currentUserId, online_at: new Date() });
    }
  });
```

---

# 5. Storage Architecture

## 5.1 Bucket Configuration

| Bucket    | Max Size | Allowed Types                                   | Access                           | Purpose                |
| --------- | -------- | ----------------------------------------------- | -------------------------------- | ---------------------- |
| `avatars` | 2 MB     | image/jpeg, image/png, image/webp               | Public read, authenticated write | Profile pictures       |
| `posts`   | 50 MB    | image/\*, video/mp4, video/mov, video/quicktime | Public read, authenticated write | Post media             |
| `videos`  | 100 MB   | video/\*                                        | Public read, authenticated write | Large highlight videos |

## 5.2 Upload Flow

```typescript
// Avatar upload
const fileName = `${userId}/${Date.now()}.jpg`;
const { data, error } = await supabase.storage.from('avatars').upload(fileName, file, {
  cacheControl: '3600',
  upsert: true,
  contentType: 'image/jpeg',
});

const {
  data: { publicUrl },
} = supabase.storage.from('avatars').getPublicUrl(fileName);

// Update profile with URL
await supabase.from('profiles').update({ avatar: publicUrl }).eq('id', userId);
```

## 5.3 Image Optimization

- **expo-image**: Automatic disk + memory caching
- **blurhash**: Placeholder hash generated on upload (future), displayed while loading
- **CDN**: Supabase Storage CDN with transform support
- **WebP**: Preferred format for smaller file sizes
- **Thumbnails**: Generate on upload (future: Supabase Edge Function)

## 5.4 Storage RLS Policies

```sql
-- Avatars: Anyone can view, authenticated users can upload to their own folder
CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Posts: Anyone can view, authenticated users can upload
CREATE POLICY "posts_select" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "posts_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');
```

---

# 6. Security

## 6.1 Authentication Security

| Layer            | Implementation                                 | Status |
| ---------------- | ---------------------------------------------- | ------ |
| Password hashing | bcrypt (Supabase Auth default)                 | Done   |
| JWT tokens       | Supabase GoTrue, RS256 signed                  | Done   |
| Token refresh    | Automatic via Supabase client                  | Done   |
| Session storage  | AsyncStorage (encrypted on iOS) / localStorage | Done   |
| HTTPS            | All Supabase endpoints use TLS 1.3             | Done   |
| Rate limiting    | Supabase Auth: 30 attempts/hour per IP         | Done   |

## 6.2 Row Level Security Matrix

| Table              | SELECT                | INSERT                   | UPDATE                 | DELETE       |
| ------------------ | --------------------- | ------------------------ | ---------------------- | ------------ |
| profiles           | Public                | Own (auth.uid = id)      | Own                    | —            |
| posts              | Public                | Own (auth.uid = user_id) | Own                    | Own          |
| opportunities      | Public                | Teams own                | Teams own              | Teams own    |
| applications       | Applicant + opp owner | Athletes own             | Teams (status)         | Athletes own |
| follows            | Public                | Own (follower_id)        | —                      | Own          |
| likes              | Public                | Own                      | —                      | Own          |
| comments           | Public                | Own                      | Own                    | Own          |
| comment_likes      | Public                | Own                      | —                      | Own          |
| messages           | Sender or receiver    | Authenticated            | Receiver (read status) | —            |
| notifications      | Own user only         | System                   | Own (read status)      | Own          |
| player_stats       | Public                | Own                      | Own                    | Own          |
| scout_preferences  | Own                   | Own                      | Own                    | Own          |
| ai_recommendations | Public                | Own                      | Own                    | Own          |

## 6.3 Critical Security Issue: AI API Key

**CURRENT STATE (VULNERABLE)**:

```
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
```

The `EXPO_PUBLIC_` prefix makes this key available in the client JavaScript bundle. Any user can extract it.

**REQUIRED FIX** (P0 priority):

```
// Supabase Edge Function: supabase/functions/ai-proxy/index.ts
// - Validates JWT from request header
// - Calls Claude API with server-side secret
// - Implements per-user rate limiting
// - Logs usage for billing
```

## 6.4 Data Privacy (DPDP Act India)

| Requirement         | Status  | Implementation                                          |
| ------------------- | ------- | ------------------------------------------------------- |
| Consent collection  | Partial | Signup = implicit consent; need explicit consent screen |
| Data portability    | Planned | API to export user data as JSON                         |
| Right to deletion   | Done    | Account deletion in settings (cascading deletes via FK) |
| Data minimization   | Done    | Only collect role-relevant data                         |
| Breach notification | Planned | 72-hour notification procedure                          |
| Grievance mechanism | Planned | Admin panel + designated officer                        |

## 6.5 OWASP Top 10 Assessment

| Risk                              | Status    | Mitigation                                             |
| --------------------------------- | --------- | ------------------------------------------------------ |
| Injection (SQL)                   | Mitigated | Supabase parameterized queries; no raw SQL from client |
| Broken Auth                       | Mitigated | Supabase Auth with JWT; session management             |
| Sensitive Data Exposure           | Partial   | HTTPS everywhere; API key issue (P0 fix)               |
| XML External Entities             | N/A       | No XML processing                                      |
| Broken Access Control             | Mitigated | RLS on every table                                     |
| Security Misconfiguration         | Partial   | Default Supabase security; need audit                  |
| XSS                               | Mitigated | React auto-escapes; no dangerouslySetInnerHTML         |
| Insecure Deserialization          | Mitigated | JSON only; Supabase handles parsing                    |
| Using Components with Known Vulns | Monitored | Dependabot alerts (need to enable)                     |
| Insufficient Logging              | Partial   | Supabase logs; need application-level logging          |

---

# 7. Scalability Plan

## 7.1 Current Capacity

| Resource             | Current Limit                              | Sufficient For        |
| -------------------- | ------------------------------------------ | --------------------- |
| Supabase database    | 500 MB (Free) / 8 GB (Pro)                 | ~500K profiles        |
| Database connections | 60 direct (Free) / 200+ (Pro with pooling) | ~1K concurrent users  |
| Storage              | 1 GB (Free) / 100 GB (Pro)                 | ~20K media uploads    |
| Realtime connections | 200 (Free) / 500+ (Pro)                    | ~500 concurrent users |
| Bandwidth            | 2 GB/day (Free) / 250 GB/mo (Pro)          | ~50K DAU (text-heavy) |

## 7.2 Scaling Strategy by User Count

### 10K Users (Month 6)

- Upgrade to Supabase Pro ($25/mo)
- Enable PgBouncer connection pooling (transaction mode)
- Add composite indexes for common queries
- Implement React Query caching (5-minute stale time)
- Image optimization: WebP conversion, thumbnails

### 100K Users (Month 12)

- Supabase Pro with compute add-on
- Database: Add GIN indexes on JSONB columns
- Materialized view for feed (refresh every 5 minutes)
- Message archival: Move >90 days to archive table
- CDN for media (Cloudflare or Bunny CDN)
- AI response caching (reduce API costs by 60-80%)

### 1M Users (Month 24)

- Supabase Enterprise (dedicated resources)
- Read replicas for Discover queries
- Feed denormalization: Pre-compute feed per user (fan-out on write)
- Horizontal scaling: Split messages into separate Supabase project
- Video transcoding pipeline (Mux or Cloudflare Stream)
- ML model for feed ranking (replace chronological)
- Regional CDN nodes in India (Mumbai, Delhi, Bangalore, Chennai)

### 10M Users (Month 36+)

- Multi-region Supabase deployment
- Dedicated PostgreSQL cluster (RDS or self-managed)
- Event-driven architecture (message queues for async processing)
- Microservices: Split monolithic backend into services
- Data warehouse for analytics (BigQuery / ClickHouse)
- Custom ML infrastructure (athlete ranking, video analysis)

## 7.3 Feed Optimization

**Current** (chronological, simple):

```sql
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET ?;
```

**At 100K users** (materialized view):

```sql
CREATE MATERIALIZED VIEW feed_view AS
  SELECT p.*, pr.name, pr.avatar, pr.role, pr.verified
  FROM posts p
  JOIN profiles pr ON p.user_id = pr.id
  WHERE p.created_at > NOW() - INTERVAL '7 days'
  ORDER BY p.created_at DESC;

-- Refresh every 5 minutes
REFRESH MATERIALIZED VIEW CONCURRENTLY feed_view;
```

**At 1M users** (fan-out on write):

```
User creates post → Edge Function triggers →
  For each follower of user:
    INSERT INTO user_feeds(user_id, post_id, created_at) VALUES (follower_id, post_id, NOW());

User opens feed → SELECT * FROM user_feeds WHERE user_id = ? ORDER BY created_at DESC LIMIT 20;
```

## 7.4 Caching Strategy

| Cache Layer  | Technology                      | TTL                             | What's Cached                                  |
| ------------ | ------------------------------- | ------------------------------- | ---------------------------------------------- |
| Browser/App  | React Query                     | 5 min                           | API responses (profiles, posts, opportunities) |
| Image        | expo-image                      | Disk: 7 days, Memory: 100 items | All images (avatars, post media)               |
| AI Responses | PostgreSQL (ai_recommendations) | 6 hours                         | Scout recommendations                          |
| AI Coaching  | Context state                   | 24 hours                        | Profile coaching suggestions                   |
| Session      | AsyncStorage                    | Until logout                    | Auth tokens, user profile                      |

---

# 8. Performance Optimization

## 8.1 Current Performance Targets

| Metric                                 | Target           | Current           | Status     |
| -------------------------------------- | ---------------- | ----------------- | ---------- |
| Cold start (app launch to interactive) | < 3s             | ~4s               | Needs work |
| Feed scroll FPS                        | > 55 FPS         | ~45 FPS (Android) | Needs work |
| Image load time                        | < 500ms (cached) | ~200ms (cached)   | Good       |
| API response (p95)                     | < 500ms          | ~300ms            | Good       |
| AI response (Sonnet)                   | < 2s             | ~1.5s             | Good       |
| AI response (Opus)                     | < 5s             | ~4s               | Good       |
| App bundle size                        | < 50 MB          | ~35 MB            | Good       |

## 8.2 FlatList Optimization

```typescript
// Performance props for all FlatLists
const FLATLIST_PERF_PROPS = {
  maxToRenderPerBatch: 8,
  windowSize: 5,
  initialNumToRender: 10,
  removeClippedSubviews: true,
  updateCellsBatchingPeriod: 50,
};

// Use getItemLayout for fixed-height items
const getItemLayout = (data, index) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
});

// Memoize list items
const MemoizedPostCard = React.memo(
  PostCard,
  (prev, next) => prev.id === next.id && prev.likes === next.likes,
);
```

## 8.3 Image Optimization

```typescript
// CachedImage component (expo-image wrapper)
<CachedImage
  source={url}
  style={styles.avatar}
  contentFit="cover"
  placeholder={blurhash}           // Blur placeholder while loading
  cachePolicy="memory-disk"        // Cache in both layers
  transition={200}                 // Fade-in animation
  recyclingKey={imageId}           // Efficient recycling in lists
/>
```

## 8.4 Context Memoization

```typescript
// Prevent unnecessary re-renders
const contextValue = useMemo(
  () => ({
    posts,
    isLoading,
    createPost,
    likePost,
    deletePost,
  }),
  [posts, isLoading],
);

// Memoize callbacks
const likePost = useCallback(
  async (postId: string) => {
    // ... implementation
  },
  [userId],
);
```

## 8.5 Query Optimization

- **Pagination**: All lists use cursor-based or offset pagination (20 items/page)
- **Select specific columns**: `select('id, name, avatar, sport')` instead of `select('*')` where possible
- **Avoid N+1**: Use Supabase joins: `select('*, profiles!user_id(name, avatar)')`
- **Denormalized counts**: likes_count, comments_count, followers_count stored on parent record (avoids COUNT queries)

---

# 9. DevOps

## 9.1 Build & Deployment

### EAS Build Configuration

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://dcixlerneuuyhsftnifm.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "..."
      }
    },
    "preview": {
      "distribution": "internal",
      "env": { "...": "..." }
    },
    "production": {
      "env": { "...": "..." }
    }
  }
}
```

### Build Commands

```bash
# Development
npx expo start                    # Metro bundler
npx expo start --web              # Web version

# Type checking
npx tsc --noEmit

# Linting
npx expo lint

# Build for devices
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Production builds
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## 9.2 CI/CD Pipeline (Planned)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx expo lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx jest --coverage --ci

  build-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx expo export --platform web

  eas-build:
    if: github.ref == 'refs/heads/main'
    needs: [lint-and-typecheck, test]
    runs-on: ubuntu-latest
    steps:
      - uses: expo/expo-github-action@v8
        with: { eas-version: latest, token: ${{ secrets.EXPO_TOKEN }} }
      - run: eas build --platform all --profile preview --non-interactive
```

## 9.3 Environment Management

| Environment | Purpose        | Supabase                                          | AI                   |
| ----------- | -------------- | ------------------------------------------------- | -------------------- |
| Development | Local dev      | Dev project (or same)                             | Real API (low usage) |
| Preview     | Testing builds | Same project                                      | Real API             |
| Production  | Live users     | Same project (upgrade to separate for production) | Real API             |

**Recommendation**: Create separate Supabase projects for staging and production before launch.

## 9.4 Monitoring (Planned)

| Tool                | Purpose                                    | Priority        |
| ------------------- | ------------------------------------------ | --------------- |
| Sentry              | Error tracking (React Native + JS)         | P1              |
| Supabase Dashboard  | Database metrics, Auth logs, Storage usage | Done (built-in) |
| Mixpanel / PostHog  | User analytics, event tracking             | P1              |
| Anthropic Dashboard | Claude API usage, costs, rate limits       | Done (built-in) |
| Grafana (future)    | Custom dashboards, alerting                | P2              |

---

# 10. AI Architecture

## 10.1 Model Selection Strategy

| Task                         | Model               | Reasoning                                   | Cost (per 1K tokens)    |
| ---------------------------- | ------------------- | ------------------------------------------- | ----------------------- |
| Deep scouting analysis       | Opus 4.6 + Thinking | Requires complex multi-factor reasoning     | ~$15 input / $75 output |
| Athlete potential prediction | Opus 4.6 + Thinking | Long-term trajectory requires deep thinking | ~$15 / $75              |
| Opportunity matching         | Opus 4.6            | Complex ranking, less deep reasoning needed | ~$15 / $75              |
| Profile summary              | Sonnet 4.6          | Straightforward text generation             | ~$3 / $15               |
| Profile coaching             | Sonnet 4.6          | Pattern-based suggestions                   | ~$3 / $15               |
| Chat responses               | Sonnet 4.6          | Conversational, low latency needed          | ~$3 / $15               |
| Knowledge search             | Sonnet 4.6          | Information retrieval                       | ~$3 / $15               |

## 10.2 AI Service Architecture

```typescript
// services/ai.ts

const MODEL_SMART = 'claude-opus-4-6';
const MODEL_FAST = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;

async function callClaude(
  messages: Message[],
  systemPrompt: string,
  maxTokens: number = MAX_TOKENS,
  options: { useSmartModel?: boolean; useThinking?: boolean } = {},
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

  const body: any = {
    model: options.useSmartModel ? MODEL_SMART : MODEL_FAST,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  };

  if (options.useThinking) {
    body.thinking = { type: 'enabled', budget_tokens: 2048 };
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY, // MUST move to edge function
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  });

  clearTimeout(timeout);
  const data = await response.json();

  // Extract text blocks (skip thinking blocks)
  return data.content
    .filter((block: any) => block.type === 'text')
    .map((block: any) => block.text)
    .join('');
}
```

## 10.3 Prompt Engineering

**Scout Recommendation System Prompt**:

```
You are an elite sports scouting AI for OnlyKrida. Analyze athletes against
a scout's specific preferences and rank them by fit score.

For each athlete, evaluate:
1. Skill (technical ability based on stats and achievements)
2. Speed (sprint data, agility tests)
3. Stamina (VO2max, beep test level, endurance indicators)
4. Position Match (how well they fit the scout's preferred positions)

Calculate: fit_score = (skill × w_skill + speed × w_speed + stamina × w_stamina
+ position × w_position) / total_weight

Return JSON: [{ player_id, fit_score, breakdown: { skill, speed, stamina,
position_match }, notes: "1-2 sentence reasoning" }]

Be critical but fair. Only recommend athletes with genuine potential.
```

## 10.4 Cost Optimization

| Strategy                                | Savings                 | Status                              |
| --------------------------------------- | ----------------------- | ----------------------------------- |
| Cache AI responses in DB                | 60-80%                  | Partial (ai_recommendations cached) |
| Use Sonnet for simple tasks             | 5x cheaper than Opus    | Done                                |
| Limit MAX_TOKENS to 1024                | Prevents runaway costs  | Done                                |
| 60s timeout with AbortController        | Prevents hung requests  | Done                                |
| Per-user rate limiting                  | Prevents abuse          | Planned (edge function)             |
| Batch recommendations (nightly refresh) | Reduces real-time calls | Planned                             |

## 10.5 Future AI Features

| Feature                    | Model         | Description                               | Timeline |
| -------------------------- | ------------- | ----------------------------------------- | -------- |
| Video analysis             | Vision model  | Analyze technique from uploaded clips     | Phase 3  |
| Injury risk prediction     | Custom ML     | Based on fitness data + training patterns | Phase 3  |
| Training plan generation   | Opus          | Personalized plans based on goals + tests | Phase 3  |
| Natural language search    | Sonnet        | "Fast strikers in Maharashtra under 20"   | Phase 2  |
| Automated scouting reports | Opus          | PDF report generation for teams           | Phase 2  |
| Match performance analysis | Vision + Opus | Post-match performance breakdown          | Phase 4  |

---

# 11. Testing Strategy

## 11.1 Testing Pyramid

```
         ┌──────────┐
         │   E2E    │  5-10 critical journeys
         │ (Maestro)│  (signup → discovery → match)
         ├──────────┤
         │Integration│  API + DB integration tests
         │  (Jest)   │  (all context providers)
         ├──────────┤
         │   Unit    │  Component + utility tests
         │  (Jest +  │  (47 components, services)
         │   RTL)    │
         └──────────┘
```

## 11.2 Unit Tests (Planned)

```typescript
// Example: AI service test
describe('callClaude', () => {
  it('should return text response from Sonnet', async () => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ type: 'text', text: 'Great profile!' }],
          }),
      }),
    );

    const result = await callClaude(
      [{ role: 'user', content: 'Analyze this profile' }],
      'You are a sports AI',
    );

    expect(result).toBe('Great profile!');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('anthropic'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('should timeout after 60 seconds', async () => {
    global.fetch = jest.fn(() => new Promise(() => {})); // Never resolves
    await expect(callClaude([], '')).rejects.toThrow('aborted');
  });
});
```

## 11.3 E2E Tests (Planned)

**Critical journeys to test with Maestro**:

1. Athlete signup → profile completion → post creation
2. Scout signup → preferences → AI recommendations → shortlist → message
3. Team creates opportunity → athlete applies → team reviews
4. Athlete takes beep test → results → coach verification
5. Real-time messaging flow

---

# 12. Monitoring & Observability

## 12.1 Key Metrics to Monitor

| Category         | Metric                      | Alert Threshold          |
| ---------------- | --------------------------- | ------------------------ |
| **Availability** | API response rate (non-5xx) | < 99%                    |
| **Performance**  | API p95 latency             | > 1 second               |
| **Performance**  | AI response p95 latency     | > 10 seconds             |
| **Database**     | Active connections          | > 80% of pool            |
| **Database**     | Slow queries (> 1s)         | > 5/minute               |
| **Storage**      | Bucket usage                | > 80% of limit           |
| **AI**           | Claude API error rate       | > 5%                     |
| **AI**           | Daily Claude API cost       | > $50 (initial)          |
| **Auth**         | Failed login attempts/IP    | > 30/hour (auto-blocked) |
| **Realtime**     | WebSocket connection errors | > 10%                    |

## 12.2 Logging Strategy

| Layer              | Tool                          | What's Logged                                     |
| ------------------ | ----------------------------- | ------------------------------------------------- |
| Client (errors)    | Sentry (planned)              | JS exceptions, component errors, network failures |
| Client (analytics) | Mixpanel (planned)            | User events, screen views, feature usage          |
| Backend            | Supabase Dashboard (built-in) | All API requests, auth events, DB queries         |
| AI                 | Custom logging (planned)      | Function calls, tokens used, latency, errors      |
| Storage            | Supabase Dashboard            | Upload/download counts, bandwidth                 |

## 12.3 Alerting (Planned)

| Channel    | Severity | Events                                               |
| ---------- | -------- | ---------------------------------------------------- |
| Slack #ops | Critical | API down, DB connection exhausted, security breach   |
| Slack #ops | Warning  | High latency, AI budget exceeded, storage near limit |
| Email      | Info     | Weekly metrics summary, anomaly detection            |
| Dashboard  | All      | Real-time health dashboard (Grafana)                 |

---

_This TRD should be updated as the architecture evolves, new services are added, and scaling thresholds are reached._

---

**Document End — TRD v1.0**
