# Product Requirement Document (PRD)

# OnlyKrida — India's First AI-Powered Sports Talent Discovery Platform

> **Version**: 1.0 | **Date**: April 2026 | **Status**: MVP Complete | **Classification**: Confidential

---

## Table of Contents

1. [Product Architecture Overview](#1-product-architecture-overview)
2. [Feature-by-Feature Breakdown](#2-feature-by-feature-breakdown)
3. [User Flows](#3-user-flows)
4. [UX/UI Guidelines](#4-uxui-guidelines)
5. [Feature Prioritization](#5-feature-prioritization)

---

# 1. Product Architecture Overview

## 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           React Native (Expo SDK 54)                      │   │
│  │  ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐    │   │
│  │  │ Screens │ │Components│ │ Hooks  │ │   Services   │    │   │
│  │  │  (20+) │ │   (47)   │ │  (12)  │ │  (AI, etc.)  │    │   │
│  │  └────┬───┘ └─────┬────┘ └───┬────┘ └──────┬───────┘    │   │
│  │       └──────┬─────┴─────────┴──────────────┘            │   │
│  │              │ Expo Router (file-based routing)            │   │
│  └──────────────┼───────────────────────────────────────────┘   │
│                 │                                                 │
│  ┌──────────────▼───────────────────────────────────────────┐   │
│  │              State Management Layer                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐   │   │
│  │  │  Auth   │ │  Posts  │ │ Messages │ │  Scouting   │   │   │
│  │  │ Context │ │ Context │ │  Context │ │   Context   │   │   │
│  │  └────┬────┘ └────┬────┘ └────┬─────┘ └─────┬──────┘   │   │
│  │       │           │           │              │           │   │
│  │  ┌────┴────┐ ┌────┴────┐ ┌────┴─────┐ ┌─────┴──────┐   │   │
│  │  │ Follow  │ │ Search  │ │  Groups  │ │  Fitness   │   │   │
│  │  │ Context │ │ Context │ │  Context │ │  Context   │   │   │
│  │  └─────────┘ └─────────┘ └──────────┘ └────────────┘   │   │
│  │  + Notifications Context, Users Context, AI Context      │   │
│  │  + Opportunities Context                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS / WebSocket
┌─────────────────────────▼───────────────────────────────────────┐
│                      SUPABASE LAYER                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │   Auth   │ │ Database │ │ Storage  │ │     Realtime     │   │
│  │          │ │ (Postgres│ │(3 buckets│ │  (WebSocket)     │   │
│  │ JWT/     │ │  13 tbls │ │ avatars, │ │  Posts, Messages │   │
│  │ Session) │ │  w/ RLS) │ │ posts,   │ │  Notifications,  │   │
│  │          │ │          │ │ videos)  │ │  Follows, Opps   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Edge Functions (Planned)                      │   │
│  │  AI Proxy | Payment Webhooks | Push Notifications         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │Claude API│ │ Razorpay │ │Expo Push │ │    CDN/Media     │   │
│  │(Opus +   │ │(Planned) │ │  Service │ │   (Planned)      │   │
│  │ Sonnet)  │ │          │ │          │ │                   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 1.2 Tech Stack Summary

| Layer     | Technology                  | Version               | Purpose                        |
| --------- | --------------------------- | --------------------- | ------------------------------ |
| Framework | React Native (Expo)         | SDK 54                | Cross-platform mobile + web    |
| Language  | TypeScript                  | 5.9                   | Type safety                    |
| Routing   | Expo Router                 | 6.0                   | File-based navigation          |
| Backend   | Supabase                    | —                     | Auth + DB + Storage + Realtime |
| Database  | PostgreSQL                  | 15+                   | Relational data with RLS       |
| AI        | Claude API                  | Opus 4.6 / Sonnet 4.6 | Scouting, coaching, chat       |
| State     | React Context + React Query | —                     | Client + server state          |
| Media     | expo-image + expo-video     | —                     | Cached media handling          |
| Icons     | Lucide React Native         | —                     | 700+ SVG icons                 |
| Build     | EAS Build                   | —                     | Cloud builds for iOS/Android   |

## 1.3 Data Flow Architecture

```
User Action → Screen → Context Provider → Supabase Client → PostgreSQL
                                                  ↕
                                          Realtime Subscription
                                                  ↕
                                    All Connected Clients Updated

AI Request → Screen → AI Context → services/ai.ts → Claude API → Response
                                                                     ↓
                                                              Cache in DB
```

---

# 2. Feature-by-Feature Breakdown

---

## 2.1 Authentication System

### Purpose

Provide secure, role-aware authentication that collects role-specific information during signup to personalize the experience from the first interaction.

### User Stories

- As a new user, I want to sign up with my email and password so I can create an account
- As a new user, I want to select my role (athlete, scout, coach, team, etc.) so the platform is customized for me
- As an athlete, I want to provide my sport, position, and physical stats during signup so scouts can find me
- As a scout, I want to specify my organization and preferred regions during signup so I get relevant recommendations
- As a returning user, I want to stay logged in across app restarts so I don't have to log in every time

### Detailed Functionality

**Welcome Screen** (`app/(auth)/welcome.tsx`)

- Animated logo with "Powered by AI" badge
- Hero text: "YOUR TALENT DESERVES A STAGE"
- 3 feature cards: Discover, Connect, Grow
- CTA buttons: "Get Started" and "Already have an account?"

**Login Screen** (`app/(auth)/login.tsx`)

- Email and password fields with validation
- Error handling for invalid credentials
- "Forgot Password" link (planned)
- Redirect to home on success

**Signup Flow**:

1. Generic signup form → email, password, name
2. Role selection screen → choose from 9 roles
3. Role-specific form:

| Role    | Fields Collected                                                                               |
| ------- | ---------------------------------------------------------------------------------------------- |
| Athlete | Sport, Position, Date of Birth, Height, Weight, Career Goals                                   |
| Scout   | Organization, Regions of Interest, Athlete Levels (youth/college/pro), What You're Looking For |
| Coach   | Years of Experience, Coaching Philosophy, Team History, Specialties                            |
| Team    | League/Division, Founded Date, Home Venue, Team Size                                           |
| Trainer | Certifications, Specialties, Experience Years                                                  |
| Fan     | Favorite Sports (selected from list)                                                           |
| Gym     | Facility Name, Location, Sports Offered                                                        |
| Brand   | Company Name, Industry, Sponsorship Interests                                                  |
| Academy | Academy Name, Sports Offered, Student Count                                                    |

**Session Management**:

- Supabase Auth with JWT tokens
- `onAuthStateChange` listener for session updates
- AsyncStorage (mobile) / localStorage (web) for persistence
- 8-second timeout on profile fetch with fallback to auth metadata
- Auto token refresh

### Edge Cases

- Network failure during signup → show retry, don't lose form data
- Duplicate email → clear error message "Account already exists"
- Session expires mid-use → redirect to login, preserve navigation state
- User changes role → not supported (create new account)
- Profile fetch fails → fallback user from auth metadata (name, email, role from signup)

### Data Involved

- **Supabase Auth**: `auth.users` table (managed by Supabase)
- **profiles table**: Created on signup completion with role-specific data

### UI Behavior

- Green step indicator (dots) shows progress through signup flow
- Animated transitions between steps
- Form validation with inline error messages
- Loading state during API calls
- Success animation on completion

### Test Accounts

| Role    | Email                      | Password |
| ------- | -------------------------- | -------- |
| Athlete | test.athlete@onlykrida.com | test123  |
| Scout   | test.scout@onlykrida.com   | test123  |
| Coach   | test.coach@onlykrida.com   | test123  |
| Team    | test.team@onlykrida.com    | test123  |
| Fan     | test.fan@onlykrida.com     | test123  |

### Future Enhancements

- OAuth (Google, Apple Sign-In)
- Phone OTP authentication
- Multi-factor authentication for scouts/teams
- Single sign-on for sports federations

---

## 2.2 Profile System

### Purpose

Create a comprehensive digital sports identity that serves as the athlete's resume, the scout's evaluation tool, and the coach's progress tracker.

### User Stories

- As an athlete, I want to showcase my sport, position, achievements, and stats so scouts can evaluate me
- As a scout, I want to see verified fitness data on athlete profiles so I can trust the information
- As a user, I want to see how complete my profile is so I know what to add
- As an athlete, I want to know who viewed my profile so I can gauge scout interest
- As a user, I want a verification badge so others trust my profile

### Detailed Functionality

**Profile Page** (`app/(tabs)/profile.tsx` — 1,124 lines)

- Avatar (circular, with camera icon overlay for editing)
- Cover photo (banner)
- Name, role badge (color-coded), verification badge (if verified)
- Bio (expandable text)
- Stats bar: Posts count | Followers | Following
- Profile completion progress bar (percentage)
- Tab sections:
  - **Posts**: Grid of user's posts (3-column grid)
  - **Achievements**: List of achievement cards (title, description, date, icon)
  - **Stats**: Key-value pairs of performance metrics
  - **About**: Extended bio, location, sport, position, role-specific details

**Profile Completion System** (`components/ProfileCompletion.tsx`)

- Calculates percentage based on:
  - Avatar uploaded (15%)
  - Bio written (15%)
  - Sport selected (10%)
  - Position selected (10%)
  - At least 1 achievement added (15%)
  - At least 1 post created (15%)
  - Fitness test completed (10%)
  - Cover photo uploaded (10%)
- Green progress bar with percentage label
- Actionable tips: "Add a highlight video to reach 80%"

**Profile Viewers** (`components/ProfileViewers.tsx`)

- Shows avatars of recent viewers
- Text: "5 scouts viewed your profile this week"
- Drives engagement and FOMO
- Visible only on own profile

**Verification Badge** (`components/VerificationBadge.tsx`)

- Blue checkmark icon next to name
- 4 verification tiers (future):
  1. Self-reported (no badge)
  2. App-measured (gray badge)
  3. Coach-verified (blue badge)
  4. Center-tested (gold badge)

**Edit Profile** (`app/edit-profile.tsx`)

- Avatar upload (image picker → Supabase Storage → URL saved to profile)
- Cover photo upload
- Name, bio, location fields
- Sport and position dropdowns
- Role-specific fields (from signup)
- Achievements CRUD (add/edit/delete)
- Stats editing (key-value pairs)

**Public Profile** (`app/user/[id].tsx`)

- Same layout as own profile but with:
  - Follow/Unfollow button
  - Message button
  - "Who viewed you" is hidden
  - Profile edit is hidden
  - View tracking (records that current user viewed this profile)

### Edge Cases

- Avatar upload fails → keep existing avatar, show error toast
- Very long bio → truncate with "Read more" expansion
- No posts yet → show empty state with CTA "Share your first highlight"
- User with 0 followers → show encouraging message, not empty state
- Profile viewed by own user → don't record in profile viewers

### Data Involved

- **profiles table**: All columns (id, email, name, role, avatar, cover_photo, bio, location, verified, sport, position, achievements JSONB, stats JSONB, role_specific_data JSONB, followers_count, following_count, posts_count)
- **Storage**: `avatars` bucket (2MB limit), `posts` bucket for cover photos
- **follows table**: For follower/following counts and relationships

### UI Behavior

- Skeleton loading while profile data fetches
- Pull-to-refresh for updated data
- Haptic feedback on follow/unfollow (native)
- Smooth avatar transition when uploading new photo
- Tab switching with horizontal scroll indicator

### Future Enhancements

- Video profile header (autoplay highlight reel)
- QR code for profile sharing at events
- Profile analytics (views over time, engagement trends)
- Achievement verification by third parties
- Endorsements from coaches (like LinkedIn endorsements)
- Comparison mode (compare two athletes side by side)

---

## 2.3 Feed System

### Purpose

Enable athletes to share their sports journey through content — training clips, match highlights, achievements — while building engagement and visibility among scouts, coaches, and fans.

### User Stories

- As an athlete, I want to post training videos so scouts can see my skills
- As a user, I want to scroll through a feed of sports content
- As a user, I want to like, comment, and share posts
- As a scout, I want to see relevant content in my feed based on my preferences
- As an athlete, I want to see how many views my posts get

### Detailed Functionality

**Home Feed** (`app/(tabs)/(home)/index.tsx`)

- 6 role-specific home screens:
  - **AthleteHome**: Quick actions (upload, share, browse), post feed, "Who is watching" section, AI suggestions
  - **ScoutHome**: Dashboard header with stats, AI recommendation cards, shortlist section, search
  - **CoachHome**: Quick actions, recent posts, athlete roster
  - **TeamHome**: Create opportunity CTA, postings, roster, applications
  - **BrandHome**: Sponsorship opportunities, talent search, messaging
  - **FanHome**: Feed of followed athletes, trending, sports news

**Create Post** (`app/(tabs)/create.tsx` — 657 lines)

- Media selection: Image or Video from gallery/camera
- Caption input (multiline, 500 char limit)
- Post type selection: Highlight, Training, Match, Achievement
- Sport tag selection
- Preview before posting
- Upload progress indicator
- Publish → uploads media to Supabase Storage → creates post record

**Post Card** (`components/home/shared/PostCard.tsx`)

- User avatar + name + role badge + time ago
- Post content/caption
- Media display (image or video player)
- Action bar: Like (heart) | Comment (bubble) | Share (arrow) | Views count
- Like animation (scale bounce)
- Double-tap to like (mobile)

**Post Detail** (`app/post/[id].tsx`)

- Full post view
- Comments list (infinite scroll)
- Comment input
- Like/unlike on comments
- Share functionality

**Comments** (`components/CommentsModal.tsx`)

- Bottom sheet modal
- Comment list with user avatars
- Reply to comment (flat, not threaded)
- Like individual comments
- Delete own comments
- Timestamp on each comment

**Feed Ranking**:

- Currently: Reverse chronological (newest first)
- Real-time updates: New posts appear at top via Supabase subscription
- Pagination: 20 posts per page, infinite scroll loads more

### Edge Cases

- Video too large (>50MB) → show error, suggest compression
- Post upload fails mid-way → retry mechanism, don't lose caption
- Offensive content → planned: content moderation system (see Critical Improvements)
- No posts in feed → show empty state with suggested users to follow
- User blocks another user → hide their posts (future)
- Deleted post → remove from all feeds in real-time

### Data Involved

- **posts table**: id, user_id, title, description, video_url, image_url, type, likes_count, comments_count, views_count, shares_count
- **likes table**: user_id, post_id (unique constraint)
- **comments table**: user_id, post_id, content, likes_count
- **comment_likes table**: user_id, comment_id
- **Storage**: `posts` bucket (50MB max, MP4/MOV/images)

### UI Behavior

- Pull-to-refresh loads latest posts
- Infinite scroll with loading spinner at bottom
- Skeleton screens while loading
- Like animation: heart icon scales up briefly
- Video autoplay (muted) when visible in viewport
- Tap video to toggle play/pause
- Image pinch-to-zoom

### Future Enhancements

- Stories (24-hour ephemeral content)
- Reels (short-form vertical video)
- Live streaming
- Polls and Q&A in posts
- AI-powered feed ranking (personalized based on interests)
- Content tagging (tag other users, tag sport events)
- Hashtags with trending topics

---

## 2.4 Explore / Discovery Engine

### Purpose

Enable scouts, coaches, teams, and fans to discover athletes and other users through advanced search and filtering — the core "matchmaking" surface of the platform.

### User Stories

- As a scout, I want to search for athletes by sport, position, and location so I can find talent matching my needs
- As a user, I want to discover trending athletes on the platform
- As a scout, I want to filter by verified-only profiles so I can trust the data
- As an athlete, I want to appear in search results so scouts can find me
- As a fan, I want to explore athletes by sport to find new people to follow

### Detailed Functionality

**Discover Screen** (`app/(tabs)/discover.tsx` — 1,750 lines)

- Search bar with real-time text search (pg_trgm trigram matching)
- Filter categories:
  1. **Sport**: Football, Cricket, Basketball, Badminton, Tennis, Swimming, Athletics, Kabaddi, Hockey, Wrestling, Boxing, Table Tennis, Volleyball, Others
  2. **Role**: Filter by user role (athlete, coach, scout, team, etc.)
  3. **Location**: Text input with suggestions
  4. **Verified**: Toggle to show only verified users
  5. **Sort**: Newest, Most Followers, Most Posts
- 5 FlatLists for different discovery sections:
  1. Trending Athletes (top athletes by recent engagement)
  2. New Users (recently joined)
  3. Verified Users (trusted profiles)
  4. By Sport (categorized sections)
  5. Search Results (when query is active)

**User Card** (`components/home/shared/UserCard.tsx`)

- Avatar + name + role badge
- Sport + position (if athlete)
- Location
- Verification badge
- Follower count
- Follow/Message action buttons
- Tap → navigate to public profile

**Trending Algorithm** (current):

- Score = (followers_count × 2) + (posts_count × 3) + (recent_likes × 5)
- Recalculated on page load
- Shows top 20 athletes

### Edge Cases

- Search returns 0 results → show helpful empty state ("No athletes found matching your filters. Try broadening your search.")
- Very common name search → paginated results, relevance-ranked
- Location typo → trigram search handles fuzzy matching
- All filters active → AND logic (may return 0 results, show guidance)
- User not in search index → all users are searchable by default

### Data Involved

- **profiles table**: Full-text search on name, location using pg_trgm
- Filters query: `SELECT * FROM profiles WHERE role = ? AND sport = ? AND location ILIKE ? AND verified = ? ORDER BY ? LIMIT 20 OFFSET ?`
- **Indexes**: name (trigram), role, sport, location, verified

### Future Enhancements

- Map-based discovery (show athletes on a map)
- Recommendation engine ("Athletes similar to ones you shortlisted")
- Advanced stat filters (speed > 80, stamina > 70)
- Save search filters for later
- Share search results

---

## 2.5 Scout Dashboard & Matching Engine

### Purpose

The core value proposition for paying users — an AI-powered system that matches scouts with athletes based on weighted preferences, producing fit scores that save scouts hundreds of hours of manual evaluation.

### User Stories

- As a scout, I want to set my preferences (sport, positions, weight factors) so the AI knows what I'm looking for
- As a scout, I want AI-ranked athlete recommendations with fit scores so I can quickly find the best matches
- As a scout, I want to shortlist athletes for further evaluation
- As a scout, I want to compare shortlisted athletes side by side
- As a scout, I want to see why the AI recommended a specific athlete (score breakdown)

### Detailed Functionality

**Scout Preferences** (`app/scout-preferences.tsx`)

- Sport selection (single select)
- Preferred positions (multi-select chips)
- Region preferences (multi-select)
- Weight sliders (0-100 each, must sum to 100):
  - Skill weight (default: 30)
  - Speed weight (default: 25)
  - Stamina weight (default: 25)
  - Position match weight (default: 20)
- Save preferences → stored in `scout_preferences` table

**AI Recommendation Engine**:

1. Scout triggers "Get Recommendations" (or auto-triggers on dashboard load)
2. System fetches scout preferences from `scout_preferences`
3. System fetches all athletes matching sport/position criteria from `player_stats` + `profiles`
4. Sends to Claude Opus (with adaptive thinking enabled):

   ```
   System: You are a sports scouting AI. Analyze athletes against scout preferences.
   For each athlete, calculate:
   - skill_score (0-100) based on their stats
   - speed_score (0-100) based on their sprint/agility data
   - stamina_score (0-100) based on their endurance data
   - position_match (0-100) based on position alignment

   Final fit_score = (skill × weight_skill) + (speed × weight_speed) +
                     (stamina × weight_stamina) + (position × weight_position) / 100

   Return JSON array sorted by fit_score DESC.
   ```

5. Results cached in `ai_recommendations` table
6. Displayed as cards with fit scores

**Scout Home Dashboard** (`components/home/ScoutHome.tsx`)

- Dashboard header: Total athletes matched, shortlist count, searches performed
- AI recommendation cards (scrollable):
  - Athlete avatar, name, sport, position
  - Fit score (large, color-coded: green 80+, orange 60-79, red <60)
  - Score breakdown (skill, speed, stamina, position match as mini bar chart)
  - "Shortlist" and "Message" action buttons
- Shortlist section: Previously saved athletes

**AI Scout Card** (`components/AIScoutCard.tsx`)

- Expandable card showing:
  - Athlete basic info
  - Fit score with colored badge
  - Breakdown bars (4 categories)
  - AI notes (1-2 sentence reasoning)
  - Quick actions: Shortlist, View Profile, Message

### Matching Algorithm (Pseudo-code)

```
for each athlete matching scout.sport:
  skill_score = normalize(athlete.player_stats.skill, 0, 100)
  speed_score = normalize(athlete.sprint_data OR player_stats.speed, 0, 100)
  stamina_score = normalize(athlete.beep_test_vo2max OR player_stats.stamina, 0, 100)
  position_match = 100 if athlete.position in scout.preferred_positions else 50

  fit_score = (
    skill_score * scout.weight_skill +
    speed_score * scout.weight_speed +
    stamina_score * scout.weight_stamina +
    position_match * scout.weight_position_match
  ) / 100

  recommendations.append({ athlete, fit_score, breakdown })

sort(recommendations, by=fit_score, descending)
return top 20
```

### Edge Cases

- No athletes match criteria → show empty state with suggestion to broaden preferences
- Scout hasn't set preferences → prompt to set preferences before showing recommendations
- AI API failure → show cached recommendations with "Last updated X hours ago" note
- Athlete data is sparse (no fitness tests) → AI notes this in breakdown, lower confidence score
- Duplicate shortlisting → prevent via UI (toggle button state)
- Scout views same recommendations repeatedly → cache with 6-hour TTL

### Data Involved

- **scout_preferences**: scout_id, sport, preferred_positions[], weight_skill, weight_speed, weight_stamina, weight_position_match
- **player_stats**: player_id, sport, position, skill, speed, stamina (0-100)
- **ai_recommendations**: scout_id, player_id, fit_score, breakdown (JSONB), notes
- **profiles**: For athlete basic info display

### Future Enhancements

- ML model trained on scout preferences + historical matches (which recommendations led to actual signings)
- Video analysis integration (AI evaluates technique from uploaded clips)
- Multi-sport comparison (compare athlete to benchmarks across sports)
- Automated scouting reports (PDF generation)
- Collaborative scouting (share recommendations with team)
- Real-time notifications when new athletes match preferences

---

## 2.6 Messaging System

### Purpose

Enable direct communication between all platform users, with a focus on scout-athlete and coach-athlete conversations. The messaging system is the bridge between discovery and recruitment.

### User Stories

- As a scout, I want to message an athlete directly after viewing their profile
- As an athlete, I want to receive and respond to messages from scouts
- As a coach, I want to create group chats for my team
- As a user, I want to share posts with others via message
- As a user, I want to see read receipts so I know my message was seen

### Detailed Functionality

**Message List** (`app/(tabs)/messages.tsx` — 582 lines)

- List of conversations sorted by most recent message
- Each conversation row: Avatar, Name, Last message preview, Timestamp, Unread badge
- Search conversations by name
- Tab layout: All | Unread
- New message button → user search → start conversation

**Chat Detail** (`app/chat/[id].tsx`)

- Message bubbles: Sent (right, green-tinted) | Received (left, dark)
- Message types: Text, Image, Video, Shared Post
- Input bar: Text input + attachment button + send button
- Read receipts: Single check (sent), Double check (delivered), Blue checks (read)
- Typing indicator (future)
- Load older messages on scroll up (pagination)

**Group Chat** (`app/chat/group/[id].tsx`)

- Group name and avatar
- Member list (expandable)
- Add/remove members
- Same message types as 1-on-1
- Group admin actions (rename, delete group)

**Post Sharing** (`components/ShareModal.tsx`)

- Share button on posts opens contact picker
- Select recipient → send post as special message type
- Post preview card in message bubble

### Edge Cases

- Both users offline → messages queued, delivered on reconnect
- Message to blocked user → prevent send, show error (future: blocking)
- Very long message → no limit currently, truncate in preview with "..."
- Media upload in message fails → show retry button on message bubble
- Group with 1 member (everyone else left) → show empty state
- Message from deleted account → show "Deleted User" with gray avatar

### Data Involved

- **messages**: id, sender_id, receiver_id, content, media_url, post_id, status (sent/delivered/read), read, created_at
- **Real-time**: Supabase subscription on messages table (INSERT, UPDATE)
- **Storage**: posts bucket for shared media

### UI Behavior

- Real-time message delivery (appears instantly for both parties)
- Unread count badge on Messages tab
- Haptic feedback on message send (native)
- Swipe to delete message (own messages only)
- Long-press for message actions (copy, delete, reply)

### Future Enhancements

- Voice messages
- Video calling
- Message reactions (emoji)
- Message search
- Message forwarding
- Disappearing messages
- Pin important messages
- Chat translation (multi-language)

---

## 2.7 Opportunities System

### Purpose

A marketplace connecting teams/organizations (who have opportunities) with athletes (who are looking for them). Covers tryouts, tournaments, scholarships, sponsorships, and contracts.

### User Stories

- As a team, I want to post a tryout opportunity so athletes can apply
- As an athlete, I want to browse and filter opportunities by sport and category
- As an athlete, I want to apply to an opportunity with a cover letter
- As a team, I want to review and manage applications (accept/reject)
- As an athlete, I want to track my application status

### Detailed Functionality

**Opportunities Tab** (`app/(tabs)/opportunities.tsx` — 1,609 lines)

- Category filters: Tryouts | Tournaments | Scholarships | Sponsorships | Contracts
- Each opportunity card:
  - Team logo + name
  - Opportunity title
  - Sport + location
  - Deadline (with urgency coloring: red if <3 days)
  - Tags: paid/unpaid, local/national, short-term/long-term
  - Applications count
  - "Apply" or "Applied" button
- Sort: Newest, Deadline (soonest), Most Applications

**Create Opportunity** (`components/CreateOpportunityModal.tsx`) — Teams only

- Title, description (rich text)
- Category selection
- Sport, location
- Deadline date picker
- Requirements (text)
- Compensation (text)
- Duration, age range, skill level
- Contact information
- Paid/unpaid toggle
- Preview → Publish

**Application Flow**:

1. Athlete taps "Apply" on opportunity
2. Cover letter input modal
3. Submit → creates application record
4. Status: Pending
5. Team reviews → Accept or Reject
6. Athlete receives notification of status change

**Application Management** (Teams):

- List of applications per opportunity
- Athlete profile preview (avatar, sport, position, fit score if available)
- Accept/Reject buttons
- Bulk actions (future)

### Edge Cases

- Apply after deadline → button disabled, show "Deadline passed"
- Apply to same opportunity twice → prevented by unique constraint, show "Already applied"
- Team deletes opportunity with pending applications → notify applicants
- Athlete applies without complete profile → warn but allow
- Opportunity with 0 applications → show to more users (boost algorithm, future)

### Data Involved

- **opportunities**: id, team_id, title, description, category, type (JSONB array), sport, location, deadline, requirements, compensation, duration, age_range, skill_level, contact_info, paid, applications_count
- **applications**: id, opportunity_id, athlete_id, status, cover_letter
- **Real-time**: subscription on opportunities (INSERT, UPDATE)

### Future Enhancements

- AI-powered opportunity matching (recommend opportunities to athletes)
- Application templates (save cover letters)
- Video applications (record introduction)
- Calendar integration for tryout dates
- Automated reminders for upcoming deadlines
- Analytics for teams (conversion funnel, demographics of applicants)

---

## 2.8 Fitness Test Module

### Purpose

The differentiation engine — standardized, verifiable fitness testing that creates credible athletic data. This is the "verified credential" layer that makes OnlyKrida profiles trustworthy.

### User Stories

- As an athlete, I want to take a beep test on my phone so I can track my endurance
- As an athlete, I want to see which fitness zone I'm in (Starter to Unstoppable)
- As a coach, I want to verify my athletes' test results to add credibility
- As a scout, I want to see verified fitness data on athlete profiles
- As an athlete, I want to track my fitness progress over time

### Detailed Functionality

**Beep Test** (`app/beep-test.tsx` + `app/beep-test-live.tsx` + `app/beep-test-results.tsx` + `app/beep-test-history.tsx`)

_Live Mode_:

- Audio cues for each shuttle
- Level and shuttle counter on screen
- "Stop" button when athlete can't continue
- Automatic VO2max calculation
- Real-time distance tracking
- Peak speed estimation

_Manual Mode_:

- Enter level and shuttle reached
- System calculates VO2max, distance, and zone

**5 Test Types** (via `constants/fitness-test-data.ts`)

| Test           | What It Measures         | Input           | Output                             | Zone Calculation           |
| -------------- | ------------------------ | --------------- | ---------------------------------- | -------------------------- |
| Yo-Yo IR1      | Cardiovascular endurance | Level + Shuttle | VO2max, total distance, peak speed | Based on VO2max ranges     |
| 20m Sprint     | Acceleration             | Time (seconds)  | Speed (m/s)                        | Based on time thresholds   |
| 40m Sprint     | Top-end speed            | Time (seconds)  | Speed (m/s), acceleration          | Based on time thresholds   |
| Agility T-Test | Change of direction      | Time (seconds)  | Agility score                      | Based on time thresholds   |
| Vertical Jump  | Lower body power         | Height (cm)     | Power output estimate              | Based on height thresholds |

**6 Fitness Zones** (Growth-oriented, NEVER demotivating):

| Zone | Label       | Color        | Description                |
| ---- | ----------- | ------------ | -------------------------- |
| 1    | Starter     | Blue         | Just beginning the journey |
| 2    | Building    | Teal         | Actively improving         |
| 3    | Rising      | Green        | Showing real potential     |
| 4    | Strong      | Yellow-Green | Competitive level          |
| 5    | Elite       | Orange       | Top-tier performer         |
| 6    | Unstoppable | Red/Gold     | World-class                |

**Verification Tiers**:

| Tier           | Method                                  | Badge                 | Trust Level |
| -------------- | --------------------------------------- | --------------------- | ----------- |
| Self-reported  | Athlete enters manually                 | None                  | Low         |
| App-measured   | Live test with phone sensors/timing     | App badge             | Medium      |
| Coach-verified | Coach attests to results                | Coach badge           | High        |
| Center-tested  | Official testing center submits results | Verified (gold) badge | Highest     |

**Verify Result** (`app/verify-result.tsx`)

- Coach receives verification request
- Views athlete's test details
- Can attest or reject
- Attestation adds to `attestation_count`

**Beep Test Card** (`components/BeepTestCard.tsx` — 27.6 KB)

- Visual result card showing:
  - Zone name with color coding
  - Level and shuttle reached
  - VO2max value
  - Total distance
  - Peak speed
  - Test date
  - Verification status badge
  - Share button

### Edge Cases

- Audio doesn't play (silent mode) → visual-only cues as fallback
- Test interrupted (call, notification) → save partial result, allow resume or restart
- Unrealistic manual entry (e.g., VO2max of 100) → cap at reasonable limits, flag
- Coach verification for different sport → verify only if coach is qualified
- Network loss during test → save locally, upload when connected
- Historical data migration → import from paper records via manual entry

### Data Involved

- **fitness_tests table** (via fitness-test-context):
  - id, athlete_id, conducted_by, test_mode, test_type
  - Result fields vary by type (level, shuttle, time, height)
  - vo2max, zone, total_distance, peak_speed
  - verification_tier, video_url, sensor_data, attestation_count
  - test_date, notes

### UI Behavior

- Animated zone reveal on test completion
- Progress chart showing improvement over time
- Color-coded zone badges throughout the app
- Share test result as image card (social media ready)
- Confetti animation on reaching new zone

### Future Enhancements

- GPS-tracked sprint tests (accurate timing via phone GPS)
- Video recording during test (for verification)
- Sensor integration (heart rate monitors, wearables)
- Team fitness assessments (batch testing)
- Normative data comparison (percentile ranking by age/sport)
- Training plans based on test results
- Testing center network (find nearest official center)

---

## 2.9 Notifications System

### Purpose

Keep users informed about relevant activity — new followers, messages, opportunity updates, scout interest — to drive re-engagement and ensure time-sensitive information is seen.

### User Stories

- As a user, I want to be notified when someone likes or comments on my post
- As an athlete, I want to know when a scout views my profile
- As an athlete, I want to be notified when my application status changes
- As a user, I want to manage which notifications I receive

### Detailed Functionality

**Notification Center** (`app/notifications.tsx` — 390 lines)

- List of notifications sorted by recency
- Each notification: Icon + Title + Message + Timestamp + Read/Unread indicator
- Tap notification → navigate to relevant screen (deep linking)
- "Mark all as read" button
- Filter: All | Unread

**11 Notification Types**:

| Type                | Trigger                                       | Title Example                          | Deep Link          |
| ------------------- | --------------------------------------------- | -------------------------------------- | ------------------ |
| like                | Someone likes your post                       | "Vikram liked your post"               | Post detail        |
| follow              | New follower                                  | "Priya started following you"          | User profile       |
| comment             | Comment on your post                          | "Rajesh commented on your highlight"   | Post detail        |
| message             | New DM received                               | "New message from Mumbai FC"           | Chat               |
| opportunity         | New opportunity matching your sport           | "New tryout: ISL U-21 Trials"          | Opportunity detail |
| application         | Application status change                     | "Your application was accepted!"       | Application detail |
| connection_request  | Follow request (future, for private profiles) | "Ananya wants to connect"              | User profile       |
| connection_accepted | Follow request accepted                       | "Rajesh accepted your request"         | User profile       |
| profile_view        | Scout/recruiter viewed profile                | "A scout from ISL viewed your profile" | Profile viewers    |
| mention             | Tagged in a post (future)                     | "Vikram mentioned you"                 | Post detail        |
| system              | Platform announcements                        | "New feature: Video analysis!"         | Announcement       |

### Data Involved

- **notifications**: id, user_id, type, title, message, read, data (JSONB for context), created_at
- **Real-time**: Supabase subscription on INSERT

### Future Enhancements

- Push notifications (device-level, via Expo Push Service)
- Email digest (weekly summary of activity)
- Notification preferences (granular control per type)
- Smart notifications (AI-prioritized, batch low-priority)
- Scheduled notifications ("Your fitness test data is 30 days old — take a new test?")

---

## 2.10 AI Features

### Purpose

Leverage Claude AI to provide intelligent features that differentiate OnlyKrida from traditional sports platforms — from scouting recommendations to profile coaching to a conversational assistant.

### User Stories

- As a scout, I want AI-ranked athlete recommendations so I can find the best matches efficiently
- As an athlete, I want AI coaching tips to improve my profile
- As a user, I want to chat with an AI assistant about sports, training, and career advice
- As an athlete, I want AI to match me with relevant opportunities
- As a scout, I want deep analysis of an athlete's potential

### Detailed Functionality

**7 AI Functions** (`services/ai.ts`):

| Function                        | Model           | Input                                     | Output                      | Use Case                 |
| ------------------------------- | --------------- | ----------------------------------------- | --------------------------- | ------------------------ |
| `getSmartScoutRecommendations`  | Opus + Thinking | Scout preferences + athlete pool          | Ranked list with fit scores | Scout dashboard          |
| `athletePotentialAnalysis`      | Opus + Thinking | Athlete profile + stats + history         | Detailed potential report   | Deep scouting            |
| `opportunityMatcher`            | Opus            | Athlete profile + available opportunities | Ranked opportunity list     | Athlete opportunity feed |
| `generateAthleteProfileSummary` | Sonnet          | Athlete profile data                      | 3-4 sentence summary        | Scout-readable bio       |
| `profileCoachingSuggestions`    | Sonnet          | Profile data + completion %               | 3-5 actionable tips         | Profile improvement      |
| `generateChatResponse`          | Sonnet          | Chat history + user question              | Conversational response     | AI assistant             |
| `knowledgeSearch`               | Sonnet          | Search query + context                    | Relevant information        | Knowledge base           |

**AI Assistant** (`app/ai-assistant.tsx`)

- Full-screen chat interface
- Welcome message: "Hi! I'm Krida, your AI sports assistant"
- Quick action buttons: "Improve my profile", "Find opportunities", "Training tips"
- Message bubbles with typing indicator
- Conversation history preserved in session
- Context-aware (knows user's sport, role, profile data)

**AI Profile Coach** (`components/AIProfileCoach.tsx`)

- Collapsible card on profile screen
- Shows 3-5 personalized tips:
  - "Add a highlight video — profiles with videos get 5x more scout views"
  - "Complete your fitness tests — verified data increases trust scores"
  - "Your bio is too short — add your career goals and training philosophy"
- Refreshes daily (cached in AI context)

**AI Scout Card** (`components/AIScoutCard.tsx`)

- Used in scout dashboard
- Shows athlete with AI-generated fit score
- Expandable breakdown (skill, speed, stamina, position match as percentage bars)
- AI notes explaining the recommendation

### Edge Cases

- Claude API rate limit hit → show cached results with "AI temporarily unavailable" message
- Very slow AI response (>10s) → show progressive loading, allow cancel
- AI hallucinates athlete data → always display actual data alongside AI summary
- User abuses AI chat (inappropriate questions) → system prompt includes safety guardrails
- AI recommendation for 0 athletes → show "No matches found, try adjusting preferences"

### Data Involved

- **ai_recommendations**: Cached recommendation results
- **profiles + player_stats**: Input data for AI analysis
- **AI context** (hooks/ai-context.tsx): Chat history, loading state, cache

### Future Enhancements

- Fine-tuned sports-specific model
- Video analysis (pose detection, technique evaluation)
- Predictive analytics (injury risk, career trajectory)
- Real-time match commentary analysis
- Training plan generation based on fitness test results
- Natural language search ("Show me fast strikers in Maharashtra under 20")

---

## 2.11 Admin Panel (Planned)

### Purpose

Operational control center for OnlyKrida team to manage users, moderate content, monitor platform health, and make data-driven decisions.

### Planned Features

- **Dashboard**: User counts, daily signups, posts/day, active users, revenue
- **User Management**: List, search, filter, verify, ban, delete users
- **Content Moderation**: Reports queue, auto-flagged content, approve/remove actions
- **Analytics**: Growth charts, retention cohorts, feature adoption, funnel analysis
- **AI Monitor**: Usage logs, cost per function, error rates, response times
- **Opportunities**: Review and moderate team postings
- **Configuration**: Feature flags, notification templates, zone thresholds
- **Verification Queue**: Athlete/coach verification requests with document review

### Recommended Stack

- **Separate web app** (Next.js or React + Vite)
- Connected to same Supabase instance with service role key
- Authentication: Admin-only Supabase auth
- Deployment: Vercel or similar

---

# 3. User Flows

## 3.1 Athlete Onboarding Flow

```
1. Open App
   └→ Welcome Screen (animated logo, feature cards)
      └→ Tap "Get Started"
         └→ Signup Screen (email, password, name)
            └→ Role Selection (tap "Athlete")
               └→ Athlete Signup Form
                  ├─ Select Sport (dropdown)
                  ├─ Select Position (dropdown, filtered by sport)
                  ├─ Enter Date of Birth
                  ├─ Enter Height (cm)
                  ├─ Enter Weight (kg)
                  └─ Tap "Create Account"
                     └→ Home Screen (AthleteHome)
                        ├─ Welcome message + quick actions
                        ├─ Profile completion: 35%
                        ├─ AI coaching tip: "Upload a highlight video"
                        └→ Athlete taps "Upload Highlight"
                           └→ Create Post screen
                              ├─ Select video from gallery
                              ├─ Add caption: "Match highlights from district tournament"
                              ├─ Select type: "Highlight"
                              └─ Tap "Publish"
                                 └→ Post appears in feed
                                    └→ Profile completion: 50%
                                       └→ Athlete takes Beep Test
                                          └→ Profile completion: 60%
                                             └→ Ready for discovery by scouts
```

## 3.2 Scout Discovery Flow

```
1. Scout opens app → ScoutHome Dashboard
   └→ "Set Your Preferences" prompt (first time)
      └→ Scout Preferences Screen
         ├─ Sport: Football
         ├─ Positions: Striker, Winger
         ├─ Weights: Speed 40%, Skill 30%, Stamina 20%, Position 10%
         └─ Save
            └→ ScoutHome Dashboard (refreshed)
               └→ AI Recommendation Cards appear
                  ├─ Athlete 1: Vikram (Fit Score: 87)
                  │  ├─ Speed: 92 | Skill: 85 | Stamina: 78 | Position: 100
                  │  └─ AI Note: "Strong sprinter with verified beep test data"
                  ├─ Athlete 2: Rahul (Fit Score: 79)
                  └─ Athlete 3: Amir (Fit Score: 74)
                     └→ Scout taps Vikram's card
                        └→ Public Profile
                           ├─ Review profile, achievements, stats
                           ├─ Watch highlight videos
                           ├─ Check verified beep test (Zone: Rising)
                           └→ Tap "Shortlist" → Tap "Message"
                              └→ Chat: "Hi Vikram, I'm a scout for Bengaluru FC..."
                                 └→ Conversation continues
                                    └→ Trial invitation sent
```

## 3.3 Post Content Flow

```
1. User taps "+" tab (Create)
   └→ Create Post Screen
      ├─ Tap "Select Media"
      │  └→ Image picker (gallery or camera)
      │     └→ Media preview shown
      ├─ Enter caption (up to 500 chars)
      ├─ Select post type: Highlight / Training / Match / Achievement
      ├─ Add sport tag (optional)
      └─ Tap "Publish"
         ├─ Upload progress bar shown
         ├─ Media uploaded to Supabase Storage
         ├─ Post record created in database
         ├─ Real-time: Post appears in followers' feeds
         └→ Success → Navigate to feed
            └→ Post visible with 0 likes, 0 comments
               └→ Users interact: like, comment, share
                  └→ Author receives notifications for each
```

## 3.4 Opportunity Application Flow

```
1. Athlete opens Opportunities tab
   └→ Browse opportunities (filter by sport, category)
      └→ Spots interesting tryout: "ISL U-21 Open Trials"
         └→ Tap to view details
            ├─ Title, description, requirements
            ├─ Sport: Football | Location: Goa
            ├─ Deadline: April 20, 2026
            ├─ Compensation: Travel + accommodation
            ├─ Applications: 47
            └→ Tap "Apply"
               └→ Cover Letter Modal
                  ├─ Write: "I'm a striker from Bellary with verified..."
                  └─ Tap "Submit Application"
                     └→ Application created (status: pending)
                        └→ Athlete sees "Applied ✓" on opportunity
                           └→ Team reviews applications
                              ├─ Views athlete profile
                              ├─ Checks fitness data
                              └─ Taps "Accept"
                                 └→ Athlete receives notification:
                                    "Your application was accepted!"
```

## 3.5 Fitness Testing Flow

```
1. Athlete navigates to Beep Test (from profile or home)
   └→ Beep Test Landing
      ├─ "Start Live Test" → Live beep test with audio
      │  ├─ Audio beeps play
      │  ├─ Level counter increments
      │  ├─ Shuttle counter tracks progress
      │  └─ Athlete taps "Stop" when exhausted
      │     └→ Results calculated
      │
      └─ "Enter Manual Result" → Manual entry
         ├─ Enter Level reached
         └─ Enter Shuttle reached
            └→ Results calculated
               └→ Results Screen
                  ├─ Zone: "Rising" (animated reveal)
                  ├─ VO2max: 42.3 ml/kg/min
                  ├─ Total Distance: 1,520m
                  ├─ Peak Speed: 14.5 km/h
                  ├─ Share button → Share as image card
                  └─ "Get Coach Verification" button
                     └→ Select coach from connections
                        └→ Coach receives verification request
                           └→ Coach reviews and attests
                              └→ Badge upgraded: "Coach Verified"
                                 └→ Result visible on athlete profile
```

---

# 4. UX/UI Guidelines

## 4.1 Design Philosophy

OnlyKrida uses a **"Street Badass"** design language — dark, bold, energetic. The aesthetic draws from:

- Street sports culture (urban, gritty, authentic)
- Neon signage (bright accents on dark backgrounds)
- Sports broadcast overlays (stats, scores, badges)
- Premium sports apps (Nike Training Club, Strava)

**Core Principles**:

1. **Dark-first**: Dark backgrounds reduce eye strain during evening use and feel premium
2. **Data-forward**: Athlete stats, scores, and metrics are always prominently displayed
3. **Action-oriented**: Every screen has a clear primary action
4. **Role-aware**: UI adapts to the user's role (different colors, layouts, CTAs)
5. **Mobile-first**: Designed for one-handed phone use; tablet/web are responsive adaptations
6. **Never demotivating**: Language and design always encourage growth, never shame

## 4.2 Color System

### Primary Palette

| Token                 | Hex       | Usage                                     |
| --------------------- | --------- | ----------------------------------------- |
| `background`          | `#0a0a0a` | App background                            |
| `backgroundSecondary` | `#1a1a1a` | Cards, modals                             |
| `primary`             | `#30D158` | CTAs, active states, athlete accent       |
| `accent`              | `#FF9F0A` | Secondary actions, warnings, scout accent |
| `cyan`                | `#64D2FF` | Info states, coach accent                 |
| `red`                 | `#FF453A` | Errors, destructive actions, team accent  |
| `purple`              | `#BF5AF2` | Fan accent, special features              |
| `text`                | `#f0f0f0` | Primary text                              |
| `textMuted`           | `#888888` | Secondary text, timestamps                |
| `border`              | `#2a2a2a` | Dividers, card borders                    |

### Role Accent Colors

| Role    | Color  | Hex       | Usage                                   |
| ------- | ------ | --------- | --------------------------------------- |
| Athlete | Green  | `#30D158` | Profile badges, home screen accents     |
| Scout   | Orange | `#FF9F0A` | Dashboard highlights, fit score accents |
| Coach   | Cyan   | `#64D2FF` | Team management, verification badges    |
| Team    | Red    | `#FF453A` | Opportunity cards, team branding        |
| Fan     | Purple | `#BF5AF2` | Engagement features, trending           |
| Trainer | Green  | `#30D158` | Training content accents                |
| Gym     | Orange | `#FF9F0A` | Facility features                       |
| Brand   | Cyan   | `#64D2FF` | Sponsorship features                    |
| Academy | Red    | `#FF453A` | Academy dashboard                       |

### Fitness Zone Colors

| Zone        | Color        | Hex       |
| ----------- | ------------ | --------- |
| Starter     | Blue         | `#007AFF` |
| Building    | Teal         | `#5AC8FA` |
| Rising      | Green        | `#30D158` |
| Strong      | Yellow-Green | `#A8D158` |
| Elite       | Orange       | `#FF9F0A` |
| Unstoppable | Gold/Red     | `#FF453A` |

## 4.3 Typography

| Level       | Size    | Weight          | Line Height | Usage                |
| ----------- | ------- | --------------- | ----------- | -------------------- |
| H1          | 28px    | Bold (700)      | 1.3         | Screen titles        |
| H2          | 24px    | Bold (700)      | 1.3         | Section headers      |
| H3          | 20px    | Semi-bold (600) | 1.3         | Card titles          |
| Body        | 16px    | Regular (400)   | 1.5         | Content text         |
| Body Small  | 14px    | Regular (400)   | 1.5         | Secondary text       |
| Caption     | 12px    | Regular (400)   | 1.4         | Timestamps, metadata |
| Label       | 11px    | Medium (500)    | 1.2         | Badges, tags         |
| Stat Number | 28-36px | Bold (700)      | 1.1         | Fit scores, counts   |

**Font**: System fonts (SF Pro on iOS, Roboto on Android) — no custom fonts to reduce app size.

## 4.4 Spacing System

| Token | Value | Usage                        |
| ----- | ----- | ---------------------------- |
| `xs`  | 4px   | Inline spacing, icon padding |
| `sm`  | 8px   | Between related elements     |
| `md`  | 16px  | Standard component padding   |
| `lg`  | 24px  | Section spacing              |
| `xl`  | 32px  | Screen-level padding         |
| `xxl` | 48px  | Major section gaps           |

## 4.5 Component Patterns

### Cards

- Background: `#1a1a1a`
- Border radius: 12px
- Border: 1px solid `#2a2a2a` (subtle)
- Padding: 16px
- Shadow: none (flat design on dark backgrounds)
- Hover state (web): border color → role accent

### Buttons

- **Primary**: Green (#30D158) background, dark text, rounded (8px)
- **Secondary**: Transparent, green border, green text
- **Destructive**: Red (#FF453A) background, white text
- **Ghost**: No background, white text, no border
- Height: 48px (touch target)
- Full-width on mobile, auto-width on web

### Input Fields

- Background: `#1a1a1a`
- Border: 1px solid `#2a2a2a`
- Focus border: role accent color
- Text color: `#f0f0f0`
- Placeholder: `#888888`
- Height: 48px
- Border radius: 8px

### Badges

- Small rounded pills
- Role badge: Role accent color background, dark text
- Verification badge: Blue circle with white checkmark
- Zone badge: Zone color background, white/dark text
- Font size: 11px, padding: 4px 8px

### Empty States

- Centered illustration area (icon from Lucide)
- Title (H3, white)
- Description (Body, muted)
- CTA button (primary, centered)
- 8 presets: feed, messages, notifications, search, opportunities, followers, posts, achievements

## 4.6 Animation Guidelines

| Animation      | Duration                  | Easing      | Usage                               |
| -------------- | ------------------------- | ----------- | ----------------------------------- |
| Fade in        | 300ms                     | ease-out    | Screen transitions, cards appearing |
| Slide up       | 250ms                     | ease-out    | Modals, bottom sheets               |
| Scale bounce   | 200ms                     | spring      | Like animation, button press        |
| Stagger        | 100ms delay between items | ease-out    | List items loading                  |
| Skeleton pulse | 1.5s loop                 | ease-in-out | Loading skeletons                   |

### Haptic Feedback (Native)

- **Light**: Tab switch, toggle
- **Medium**: Like, follow, send message
- **Heavy**: Delete, error
- Disabled on web

## 4.7 Accessibility

- **Color contrast**: All text meets WCAG 2.1 AA (4.5:1 for body, 3:1 for large text)
- **Touch targets**: Minimum 44×44px for all interactive elements
- **Screen reader**: All images have alt text, all buttons have accessible labels
- **Motion**: Respect `prefers-reduced-motion` setting
- **Font scaling**: Support system font size preferences

## 4.8 Responsive Design

| Breakpoint    | Width      | Layout                                   |
| ------------- | ---------- | ---------------------------------------- |
| Mobile        | 0-767px    | Single column, bottom tab navigation     |
| Tablet        | 768-1023px | Two-column where applicable, bottom tabs |
| Desktop (Web) | 1024px+    | Sidebar navigation, multi-column layouts |

---

# 5. Feature Prioritization

## 5.1 MVP — Phase 1 (COMPLETED)

Everything listed below is built and functional:

| Feature                                      | Status | Key Components                                                  |
| -------------------------------------------- | ------ | --------------------------------------------------------------- |
| Authentication (email/password, 9 roles)     | Done   | 5 role-specific signup forms                                    |
| 6 Role-specific home screens                 | Done   | AthleteHome, ScoutHome, CoachHome, TeamHome, BrandHome, FanHome |
| Social feed (posts, likes, comments, shares) | Done   | Create, feed, detail, modals                                    |
| Discover engine (search, filters, trending)  | Done   | Sport, role, location, verified filters                         |
| Real-time messaging (1-on-1 + group)         | Done   | Chat, group chat, media sharing                                 |
| Notifications (11 types, real-time)          | Done   | In-app notification center                                      |
| Opportunities (5 categories, applications)   | Done   | Create, browse, apply, manage                                   |
| AI Scouting (Claude Opus recommendations)    | Done   | Fit scores, breakdowns, coaching                                |
| Fitness Testing (5 types, 6 zones)           | Done   | Live + manual, verification                                     |
| Profile system (completion, viewers, badges) | Done   | Edit, public view, achievements                                 |
| Settings (account, privacy, notifications)   | Done   | Delete account included                                         |
| Supabase backend (13 tables, RLS)            | Done   | Full security on all tables                                     |

## 5.2 Immediate Fixes — Phase 1.5 (In Progress)

| Item                         | Priority | Effort | Description                                           |
| ---------------------------- | -------- | ------ | ----------------------------------------------------- |
| CachedImage migration        | P1       | 1 day  | 13 files still using raw Image instead of CachedImage |
| Discover useReducer refactor | P1       | 1 day  | Consolidate 17 useState hooks into useReducer         |
| FlatList optimization        | P1       | 2 days | Add performance props to 25+ screens                  |
| AthleteHome split            | P1       | 1 day  | Break 666-line monolith into 5 sub-components         |
| AI key migration             | P0       | 3 days | Move API key to Supabase Edge Function                |

## 5.3 Phase 2 — Growth (Q2-Q3 2026)

| Feature                        | Priority | Effort  | Business Impact                   |
| ------------------------------ | -------- | ------- | --------------------------------- |
| Payment integration (Razorpay) | P1       | 3 weeks | Enables revenue — existential     |
| Admin dashboard                | P0       | 4 weeks | Operational control, compliance   |
| Push notifications             | P1       | 1 week  | 3-10x re-engagement improvement   |
| Analytics & event tracking     | P1       | 2 weeks | Data-driven product decisions     |
| Content moderation             | P1       | 2 weeks | Legal compliance, user safety     |
| CI/CD pipeline                 | P1       | 1 week  | Development velocity              |
| Performance optimization       | P1       | 2 weeks | User retention on low-end devices |
| Password reset flow            | P1       | 2 days  | Basic auth completion             |
| Report system (user reports)   | P1       | 1 week  | User safety                       |
| Profile analytics              | P2       | 1 week  | Premium feature for athletes      |

## 5.4 Phase 3 — Scale (Q4 2026+)

| Feature                              | Priority | Effort  | Business Impact               |
| ------------------------------------ | -------- | ------- | ----------------------------- |
| ML recommendation engine             | P2       | 8 weeks | Improved matching accuracy    |
| Video streaming (HLS/Mux)            | P2       | 2 weeks | Better video experience       |
| Advanced analytics dashboard         | P2       | 3 weeks | Premium feature for all roles |
| Event calendar                       | P2       | 2 weeks | Community engagement          |
| Offline-first architecture           | P2       | 3 weeks | Rural India accessibility     |
| i18n (Hindi, Tamil, Arabic)          | P2       | 2 weeks | Market expansion              |
| OAuth (Google, Apple)                | P2       | 1 week  | Reduced signup friction       |
| Stories / Reels                      | P2       | 4 weeks | Engagement, content virality  |
| Map-based discovery                  | P2       | 2 weeks | Geographic scouting           |
| Live match streaming                 | P3       | 6 weeks | Platform stickiness           |
| Video analysis (AI technique review) | P3       | 8 weeks | Unique differentiator         |
| Wearable integration                 | P3       | 4 weeks | Data accuracy                 |
| Training plans (AI-generated)        | P3       | 3 weeks | Athlete retention             |
| Dubai market launch                  | P2       | 4 weeks | Geographic expansion          |

---

_This PRD should be updated as features are built, user feedback is received, and market conditions evolve._

---

**Document End — PRD v1.0**
