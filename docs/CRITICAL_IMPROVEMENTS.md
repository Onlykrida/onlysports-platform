# OnlyKrida — Top 15 Critical Improvements

> Investor-grade risk assessment and engineering roadmap
> Generated: 2026-04-04 | Platform: OnlyKrida v1.0 (MVP)

---

## Summary Matrix

| #   | Improvement                        | Priority | Category         | Impact   | Effort  | Risk Level  |
| --- | ---------------------------------- | -------- | ---------------- | -------- | ------- | ----------- |
| 1   | Move AI API Key Server-Side        | **P0**   | Security         | Critical | 3 days  | 🔴 Critical |
| 2   | Automated Testing Suite            | **P0**   | Tech             | High     | 3 weeks | 🔴 Critical |
| 3   | Admin Dashboard                    | **P0**   | Product          | High     | 4 weeks | 🔴 Critical |
| 4   | CI/CD Pipeline                     | **P1**   | Tech             | High     | 1 week  | 🟡 High     |
| 5   | Payment Integration                | **P1**   | Business         | Critical | 3 weeks | 🟡 High     |
| 6   | Performance Optimization Sprint    | **P1**   | Tech             | High     | 2 weeks | 🟡 High     |
| 7   | Analytics & Event Tracking         | **P1**   | Product          | High     | 2 weeks | 🟡 High     |
| 8   | Content Moderation System          | **P1**   | Product/Security | High     | 2 weeks | 🟡 High     |
| 9   | Database Scaling & Optimization    | **P1**   | Tech             | High     | 2 weeks | 🟡 High     |
| 10  | Push Notification Infrastructure   | **P1**   | Product          | Medium   | 1 week  | 🟡 High     |
| 11  | AI Response Caching & Cost Control | **P2**   | Tech/Business    | Medium   | 1 week  | 🟠 Medium   |
| 12  | Offline-First Architecture         | **P2**   | Tech             | Medium   | 3 weeks | 🟠 Medium   |
| 13  | Video Streaming Optimization       | **P2**   | Tech             | Medium   | 2 weeks | 🟠 Medium   |
| 14  | User Retention & Re-engagement     | **P2**   | Business         | High     | 3 weeks | 🟠 Medium   |
| 15  | Internationalization (i18n)        | **P2**   | Business         | Medium   | 2 weeks | 🟢 Low      |

---

## 1. Move AI API Key Server-Side ✅ RESOLVED 2026-04-27

| Field        | Detail                                                                      |
| ------------ | --------------------------------------------------------------------------- |
| **Status**   | ✅ Shipped — `claude-proxy` edge function deployed, services/ai.ts cut over |
| **Priority** | P0 — was a launch-blocker                                                   |
| **Category** | Security                                                                    |
| **Impact**   | Critical — exposed API key = unlimited spend by attackers                   |
| **Effort**   | ~half day actual (vs 3 days estimated)                                      |

### Resolution

Closed via the `claude-proxy` Supabase Edge Function at
`supabase/functions/claude-proxy/`. The function holds `ANTHROPIC_API_KEY` as a
server-side Supabase secret, validates the caller's Supabase JWT, allow-lists
models + request fields, enforces a per-user rate limit (30/hr in
`claude_usage` table), and forwards to Anthropic.

`services/ai.ts` now calls the proxy URL with the user's JWT in the
`Authorization` header. The old client-bundled `EXPO_PUBLIC_ANTHROPIC_API_KEY`
has been removed from `.env`. The leaked key was rotated and revoked in the
Anthropic dashboard.

See `supabase/functions/claude-proxy/DEPLOY.md` for the deploy + rollback
runbook.

---

### Original description (kept for context)

The Anthropic API key (`EXPO_PUBLIC_ANTHROPIC_API_KEY`) was embedded in the client bundle via `EXPO_PUBLIC_` prefix. Any user could extract this key from the JavaScript bundle and make unlimited API calls at OnlyKrida's expense. This was the single most critical security vulnerability in the platform.

### Risk If Not Addressed

- **Financial**: Attacker extracts key → runs millions of API calls → $10K+ bill overnight
- **Service disruption**: Key gets rate-limited or banned → all AI features break for all users
- **Reputation**: Public exposure of insecure practices undermines investor/user trust

### Recommended Approach

1. **Create a Supabase Edge Function** (`supabase/functions/ai-proxy/index.ts`) that:
   - Accepts requests from authenticated users only (validates JWT)
   - Forwards to Claude API with the secret key (stored as Supabase secret)
   - Implements per-user rate limiting (e.g., 50 AI calls/day for free, 200 for premium)
   - Logs usage for billing and analytics
2. **Update `services/ai.ts`** to call the edge function instead of Claude directly
3. **Remove `EXPO_PUBLIC_ANTHROPIC_API_KEY`** from `.env` and client code
4. **Add cost alerting** via Anthropic dashboard

```typescript
// Before (INSECURE)
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: { 'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY },
});

// After (SECURE)
const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
  headers: { Authorization: `Bearer ${session.access_token}` },
  body: JSON.stringify({ function: 'profileCoaching', data: { profileId } }),
});
```

---

## 2. Automated Testing Suite

| Field        | Detail                                                     |
| ------------ | ---------------------------------------------------------- |
| **Priority** | P0 — Required for reliable iteration                       |
| **Category** | Tech                                                       |
| **Impact**   | High — prevents regressions, enables confident refactoring |
| **Effort**   | 3 weeks (initial setup + critical path coverage)           |

### Description

The codebase has **zero automated tests**. With 47 components, 12 context providers, and 13 database tables, any change risks breaking existing functionality. The team currently relies entirely on manual testing, which doesn't scale.

### Risk If Not Addressed

- **Regression bugs**: Every feature addition risks breaking existing features
- **Slow iteration**: Developers fear making changes → technical debt accumulates
- **Investor concern**: No test suite signals immature engineering practices
- **Scaling blocker**: Can't hire engineers who can contribute safely without tests

### Recommended Approach

**Week 1: Foundation**

- Set up Jest + React Native Testing Library
- Configure test runners in `package.json`
- Write tests for all 12 context providers (highest leverage — they contain business logic)
- Add `__tests__/` directories alongside source files

**Week 2: Critical Paths**

- Auth flow tests (signup, login, session management, role-specific forms)
- Post CRUD tests (create, like, comment, delete)
- Messaging tests (send, receive, read receipts)
- AI service tests (mock Claude API, test all 7 functions)

**Week 3: E2E + Integration**

- Set up Maestro or Detox for E2E testing
- Write 5 critical user journey tests:
  1. Athlete signup → profile completion → post creation
  2. Scout signup → set preferences → view recommendations
  3. Team creates opportunity → athlete applies → team reviews
  4. User sends message → recipient receives in real-time
  5. Athlete takes beep test → results saved → coach verifies

**Target**: 70%+ coverage on business logic, 100% on auth and payment flows.

---

## 3. Admin Dashboard

| Field        | Detail                                                             |
| ------------ | ------------------------------------------------------------------ |
| **Priority** | P0 — Cannot operate a platform without admin controls              |
| **Category** | Product                                                            |
| **Impact**   | High — required for content moderation, user management, analytics |
| **Effort**   | 4 weeks                                                            |

### Description

There is no admin panel. The team has no way to:

- View platform metrics (users, posts, messages, opportunities)
- Moderate content (remove inappropriate posts, ban users)
- Manage user reports
- Verify athlete/scout identities
- View AI usage and costs
- Manage opportunities and applications
- Configure platform settings

### Risk If Not Addressed

- **Legal liability**: No way to remove harmful content → regulatory risk
- **User trust**: Reported content stays up indefinitely
- **Operational blindness**: No visibility into platform health
- **Scaling impossible**: Can't manage a growing user base manually

### Recommended Approach

**Phase 1 (Week 1-2): Web Dashboard**

- Build with Next.js or React (separate repo) + Supabase service role key
- Core pages:
  - **Dashboard**: User counts by role, daily signups, posts/day, active users
  - **Users**: List, search, filter by role, verify/ban/delete
  - **Content**: Posts list with moderation actions (remove, flag, approve)
  - **Reports**: User reports queue with action buttons

**Phase 2 (Week 3-4): Advanced Features**

- **Analytics**: Charts for growth metrics, retention, engagement
- **AI Monitor**: Usage logs, cost per function, error rates
- **Opportunities**: Review and moderate team postings
- **Configuration**: Feature flags, notification templates, zone thresholds
- **Verification**: Queue for athlete/coach verification requests with document review

**Database additions**:

```sql
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id),
  action_type TEXT NOT NULL, -- 'ban', 'verify', 'remove_post', 'resolve_report'
  target_type TEXT NOT NULL, -- 'user', 'post', 'opportunity'
  target_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id),
  reported_user_id UUID REFERENCES profiles(id),
  reported_post_id UUID REFERENCES posts(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. CI/CD Pipeline

| Field        | Detail                                                  |
| ------------ | ------------------------------------------------------- |
| **Priority** | P1                                                      |
| **Category** | Tech                                                    |
| **Impact**   | High — automates quality gates, prevents broken deploys |
| **Effort**   | 1 week                                                  |

### Description

No CI/CD pipeline exists. Builds are triggered manually via `eas build`. There are no automated checks on pull requests — no linting, type checking, or test runs before code merges.

### Risk If Not Addressed

- **Broken builds**: Untested code ships to production
- **Developer friction**: Manual build process is slow and error-prone
- **No quality gates**: Bad code merges without review

### Recommended Approach

1. **GitHub Actions workflow** (`.github/workflows/ci.yml`):
   ```yaml
   on: [push, pull_request]
   jobs:
     lint: npx expo lint
     typecheck: npx tsc --noEmit
     test: npx jest --coverage
     build-check: npx expo export --platform web
   ```
2. **EAS Build triggers**: Auto-build preview on PR merge, production on tag
3. **Branch protection**: Require CI pass + 1 approval before merge to main
4. **Notifications**: Slack/Discord webhook on build success/failure

---

## 5. Payment Integration

| Field        | Detail                                            |
| ------------ | ------------------------------------------------- |
| **Priority** | P1 — Required for revenue generation              |
| **Category** | Business                                          |
| **Impact**   | Critical — no payments = no revenue = no business |
| **Effort**   | 3 weeks                                           |

### Description

The business model depends on scout subscriptions, team dashboard plans, and premium features. None of these can be monetized without payment infrastructure. The platform is currently 100% free with no path to revenue.

### Risk If Not Addressed

- **No revenue**: Platform burns cash with zero income
- **Investor concern**: No monetization path = uninvestable
- **Competitive window**: Competitors may monetize first and lock in paying users

### Recommended Approach

**Payment Stack** (India-focused):

- **Razorpay** (primary) — UPI, cards, netbanking, wallets (dominant in India)
- **Stripe** (international) — for Dubai expansion and international scouts
- **In-app purchases** — Apple/Google for premium features on mobile

**Implementation**:

1. **Supabase Edge Function** for payment webhook handling
2. **Subscription tables**:
   ```sql
   CREATE TABLE subscriptions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES profiles(id),
     plan TEXT NOT NULL, -- 'scout_basic', 'scout_pro', 'team_starter', 'team_pro'
     status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'past_due'
     provider TEXT NOT NULL, -- 'razorpay', 'stripe', 'apple', 'google'
     provider_subscription_id TEXT,
     current_period_start TIMESTAMPTZ,
     current_period_end TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
3. **Gating logic**: Check subscription status before allowing premium features
4. **Pricing page**: In-app upgrade flow with plan comparison

**Pricing Tiers** (India market):
| Plan | Price (INR/mo) | Features |
|------|---------------|----------|
| Scout Basic | ₹999 | 50 searches/mo, 10 shortlists |
| Scout Pro | ₹2,499 | Unlimited searches, AI recommendations, 50 shortlists |
| Scout Enterprise | ₹9,999 | Everything + API access, bulk export, priority support |
| Team Starter | ₹1,999 | 1 opportunity/mo, 5 team members |
| Team Pro | ₹4,999 | Unlimited opportunities, 25 members, analytics |

---

## 6. Performance Optimization Sprint

| Field        | Detail                                                                          |
| ------------ | ------------------------------------------------------------------------------- |
| **Priority** | P1                                                                              |
| **Category** | Tech                                                                            |
| **Impact**   | High — directly affects user retention (53% abandon apps that take >3s to load) |
| **Effort**   | 2 weeks                                                                         |

### Description

Multiple known performance issues:

- **Discover screen**: 17 `useState` hooks causing excessive re-renders
- **FlatList optimization**: 25+ screens missing `maxToRenderPerBatch`, `windowSize`, `getItemLayout`
- **CachedImage migration**: 13 files still using raw `<Image>` instead of `<CachedImage>` (no disk caching)
- **AthleteHome**: 666-line monolith causing slow renders
- **Context providers**: 12 nested providers, some triggering unnecessary re-renders

### Risk If Not Addressed

- **User churn**: Slow app = users leave (especially on low-end Android devices common in India)
- **App store ratings**: Performance complaints → low ratings → reduced discoverability
- **Scaling failure**: Current architecture won't handle 10K+ concurrent users

### Recommended Approach

**Week 1: Quick Wins**

- Migrate all 13 files to `<CachedImage>` (1 day)
- Add FlatList performance props to all 25+ screens (2 days)
- Refactor Discover screen: Replace 17 `useState` with `useReducer` (1 day)
- Split AthleteHome.tsx into 5 sub-components (1 day)

**Week 2: Deep Optimization**

- Implement `React.memo` on all list item components
- Add `useMemo`/`useCallback` to expensive computations in contexts
- Implement virtualized image loading (only load visible images)
- Add Supabase query pagination everywhere (limit 20, cursor-based)
- Profile with React DevTools Profiler → fix top 5 re-render hotspots
- Implement skeleton screens for all data-loading states

**Target**: Time-to-interactive < 2s, scroll FPS > 55 on mid-range Android.

---

## 7. Analytics & Event Tracking

| Field        | Detail                                      |
| ------------ | ------------------------------------------- |
| **Priority** | P1                                          |
| **Category** | Product                                     |
| **Impact**   | High — can't improve what you can't measure |
| **Effort**   | 2 weeks                                     |

### Description

No analytics or event tracking. The team has zero visibility into:

- Which features are used (and which aren't)
- Where users drop off in funnels
- Session duration, screens/session, retention curves
- AI feature usage and satisfaction
- Content engagement patterns

### Risk If Not Addressed

- **Blind product decisions**: Building features nobody uses
- **Investor due diligence**: "What are your metrics?" → "We don't know"
- **Growth stagnation**: Can't optimize funnels without data

### Recommended Approach

1. **Mixpanel** or **PostHog** (self-hosted option) for event tracking
2. **Key events to track**:
   - `signup_started`, `signup_completed` (with role)
   - `profile_updated`, `profile_completion_percentage`
   - `post_created`, `post_liked`, `post_commented`, `post_shared`
   - `opportunity_viewed`, `opportunity_applied`
   - `message_sent`, `message_read`
   - `ai_feature_used` (with function name)
   - `fitness_test_completed` (with type and zone)
   - `scout_search_performed`, `athlete_shortlisted`
   - `session_start`, `session_end`, `screen_view`
3. **Dashboards**: Daily active users, retention cohorts, feature adoption, funnel analysis
4. **A/B testing framework**: For iterating on onboarding, feed ranking, AI prompts

---

## 8. Content Moderation System

| Field        | Detail                                                   |
| ------------ | -------------------------------------------------------- |
| **Priority** | P1                                                       |
| **Category** | Product / Security                                       |
| **Impact**   | High — required for platform safety and legal compliance |
| **Effort**   | 2 weeks                                                  |

### Description

No content moderation exists. Users can post anything — inappropriate images, hate speech, spam, fake profiles — with no detection or removal mechanism. India's IT Act 2021 intermediary guidelines require platforms to have grievance mechanisms and content moderation.

### Risk If Not Addressed

- **Legal**: Non-compliance with IT Act intermediary guidelines → platform takedown
- **User safety**: Minors on platform (school athletes) exposed to harmful content
- **Brand damage**: One viral incident of inappropriate content ruins reputation
- **App store removal**: Apple/Google require content moderation for social apps

### Recommended Approach

1. **Automated layer**: Integrate image moderation API (AWS Rekognition or Google Cloud Vision) for uploaded media
2. **Report system**: User-facing "Report" button on posts, profiles, messages
3. **Moderation queue**: Admin dashboard page for reviewing flagged content
4. **Auto-actions**: Auto-hide posts with 3+ reports, auto-ban users with 5+ confirmed violations
5. **Word filters**: Block known slurs and inappropriate terms in posts/messages
6. **Community guidelines**: Publish and require acceptance during signup

---

## 9. Database Scaling & Optimization

| Field        | Detail                                             |
| ------------ | -------------------------------------------------- |
| **Priority** | P1                                                 |
| **Category** | Tech                                               |
| **Impact**   | High — database is the primary bottleneck at scale |
| **Effort**   | 2 weeks                                            |

### Description

Current Supabase free/pro tier has limitations:

- Connection pooling limits (direct connections exhaust quickly)
- No read replicas
- Queries on `profiles` table will slow as it grows (JSONB columns aren't indexed deeply)
- `messages` table will grow fastest and has no archival strategy
- Feed queries join multiple tables without materialized views

### Risk If Not Addressed

- **Outages**: Connection pool exhaustion at ~500 concurrent users
- **Slow queries**: Feed and discover become unusable at 100K+ profiles
- **Cost explosion**: Supabase compute scales linearly without optimization

### Recommended Approach

**Immediate (Week 1)**:

- Enable Supabase connection pooling (PgBouncer) — transaction mode
- Add composite indexes for common query patterns:
  ```sql
  CREATE INDEX idx_posts_feed ON posts(created_at DESC) WHERE deleted_at IS NULL;
  CREATE INDEX idx_messages_conversation ON messages(
    LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at DESC
  );
  CREATE INDEX idx_profiles_discover ON profiles(role, sport, location, verified);
  ```
- Add GIN index on JSONB columns for deep queries:
  ```sql
  CREATE INDEX idx_profiles_achievements ON profiles USING GIN(achievements);
  CREATE INDEX idx_profiles_stats ON profiles USING GIN(stats);
  ```

**Near-term (Week 2)**:

- Create materialized view for feed (denormalized posts + user data)
- Implement message archival (move messages >90 days to archive table)
- Add database monitoring (pg_stat_statements, slow query log)
- Plan read replica setup for Discover queries (Supabase Enterprise)

---

## 10. Push Notification Infrastructure

| Field        | Detail                                                               |
| ------------ | -------------------------------------------------------------------- |
| **Priority** | P1                                                                   |
| **Category** | Product                                                              |
| **Impact**   | Medium — push notifications drive 3-10x re-engagement vs in-app only |
| **Effort**   | 1 week                                                               |

### Description

`expo-notifications` is installed but push notifications are not fully implemented. The current notification system is in-app only — users must open the app to see notifications. This means missed messages, opportunities, and scout interest go unnoticed.

### Risk If Not Addressed

- **Low re-engagement**: Users forget about the app without push reminders
- **Missed opportunities**: Time-sensitive tryouts expire before athletes see them
- **Competitive disadvantage**: Every social app has push notifications

### Recommended Approach

1. **Store push tokens**: Add `push_token` column to `profiles`, save on app launch
2. **Supabase Edge Function** for sending pushes via Expo Push API
3. **Database trigger**: When a notification row is inserted → call edge function → send push
4. **Key push events**: New message, new follower, opportunity match, application status change, scout viewed profile
5. **User preferences**: Notification settings screen (already exists) → respect user choices
6. **Rich notifications**: Include sender avatar, preview text, deep link

---

## 11. AI Response Caching & Cost Control

| Field        | Detail                              |
| ------------ | ----------------------------------- |
| **Priority** | P2                                  |
| **Category** | Tech / Business                     |
| **Impact**   | Medium — reduces AI costs by 60-80% |
| **Effort**   | 1 week                              |

### Description

Every AI call hits Claude API directly with no caching. Profile coaching suggestions regenerate on every profile view. Scout recommendations recalculate on every dashboard load. At scale, this creates massive API costs.

### Risk If Not Addressed

- **Cost explosion**: 10K DAU × 5 AI calls/day × $0.01/call = $1,500/day
- **Slow UX**: AI calls take 2-5 seconds, no cached fallback
- **Rate limiting**: Hit Anthropic rate limits during peak usage

### Recommended Approach

1. **Cache layer** in `ai_recommendations` table (already exists) — extend to all AI functions
2. **Cache keys**: Hash of (function_name + input_data + model_version)
3. **TTL strategy**:
   - Profile coaching: 24 hours (regenerate daily)
   - Scout recommendations: 6 hours (refresh throughout day)
   - Chat responses: Don't cache (conversational)
   - Opportunity matching: 12 hours
4. **Background refresh**: Supabase cron job regenerates stale recommendations overnight
5. **Cost dashboard**: Track tokens used per function per day, set budget alerts

---

## 12. Offline-First Architecture

| Field        | Detail                                                          |
| ------------ | --------------------------------------------------------------- |
| **Priority** | P2                                                              |
| **Category** | Tech                                                            |
| **Impact**   | Medium — critical for Indian market (inconsistent connectivity) |
| **Effort**   | 3 weeks                                                         |

### Description

The app requires constant internet connectivity. In India, many athletes are in rural areas or stadiums with poor connectivity. The app shows errors or blank screens when offline.

### Risk If Not Addressed

- **Market fit failure**: Target users (grassroots Indian athletes) have the worst connectivity
- **Data loss**: Draft posts and test results lost on connection drop
- **User frustration**: App feels broken in common usage scenarios

### Recommended Approach

1. **Local database**: Use WatermelonDB or expo-sqlite for local data persistence
2. **Optimistic updates**: Show changes immediately, sync when online
3. **Queue system**: Queue posts, messages, and test results for upload when connectivity returns
4. **Conflict resolution**: Last-write-wins for profiles, append-only for messages/posts
5. **Cache feed**: Store last 50 feed items locally for offline browsing
6. **Connectivity indicator**: Show subtle "offline" banner, not error screens

---

## 13. Video Streaming Optimization

| Field        | Detail                                                            |
| ------------ | ----------------------------------------------------------------- |
| **Priority** | P2                                                                |
| **Category** | Tech                                                              |
| **Impact**   | Medium — video is the primary content type for athlete highlights |
| **Effort**   | 2 weeks                                                           |

### Description

Videos upload directly to Supabase Storage with no processing. Issues:

- No compression or transcoding (raw uploads can be 200MB+)
- No adaptive bitrate streaming (HLS/DASH)
- No thumbnail generation
- Videos load fully before playing (no progressive loading)
- Supabase Storage bandwidth is expensive at scale

### Risk If Not Addressed

- **Slow loading**: Large videos take 30+ seconds on 4G
- **Data consumption**: Users in India are data-conscious; uncompressed video burns data plans
- **Storage costs**: Supabase Storage charges per GB; uncompressed video is 10x more expensive
- **Poor UX**: No thumbnails in feed, no preview before playing

### Recommended Approach

1. **Upload pipeline**: Client → Supabase Edge Function → Cloudflare Stream or Mux
2. **Transcoding**: Auto-generate 360p, 720p, 1080p variants
3. **HLS streaming**: Adaptive bitrate based on connection speed
4. **Thumbnails**: Auto-generate at 0s, 3s, 6s; use best as preview
5. **Progressive loading**: Start playback immediately with low-quality stream
6. **CDN**: Cloudflare or Bunny CDN for edge caching in India

---

## 14. User Retention & Re-engagement

| Field        | Detail                                                  |
| ------------ | ------------------------------------------------------- |
| **Priority** | P2                                                      |
| **Category** | Business                                                |
| **Impact**   | High — retention is the #1 predictor of startup success |
| **Effort**   | 3 weeks                                                 |

### Description

No retention mechanisms beyond the core product. No onboarding flow to drive profile completion. No re-engagement for churned users. No gamification or streaks. The current profile completion indicator is a start but needs to be part of a broader retention strategy.

### Risk If Not Addressed

- **Low retention**: Social apps typically see 20-30% D7 retention; without active measures, OnlyKrida could be worse
- **Empty platform**: Low retention → fewer profiles → less value for scouts → death spiral
- **High CAC waste**: Acquiring users who churn in week 1 wastes marketing spend

### Recommended Approach

**Onboarding (Week 1)**:

- Guided 5-step onboarding after signup (upload photo → add sport → write bio → post highlight → take fitness test)
- Profile completion rewards (verified badge at 100%)
- "Complete your profile to be discovered by scouts" motivation

**Engagement Loops (Week 2)**:

- Weekly fitness challenge (compare beep test scores)
- "This week's rising athletes" leaderboard
- Scout activity notifications ("3 scouts viewed your profile this week")
- Content prompts ("Share your training highlight from today")

**Re-engagement (Week 3)**:

- Email drip campaign for inactive users (Day 3, 7, 14, 30)
- Push notifications: "A scout in Mumbai is looking for your position"
- Monthly "Athlete Spotlight" feature (motivates content creation)
- Referral program: "Invite teammates, get verified faster"

---

## 15. Internationalization (i18n)

| Field        | Detail                                                                  |
| ------------ | ----------------------------------------------------------------------- |
| **Priority** | P2                                                                      |
| **Category** | Business                                                                |
| **Impact**   | Medium — required for India (22 official languages) and Dubai expansion |
| **Effort**   | 2 weeks                                                                 |

### Description

The app is English-only. India has 22 official languages and hundreds of dialects. Many grassroots athletes, especially in rural areas, are not comfortable with English. The planned Dubai expansion requires Arabic support.

### Risk If Not Addressed

- **Market limitation**: Excludes non-English speaking athletes (majority in India)
- **Competitive vulnerability**: A Hindi/regional language alternative could capture the market
- **Dubai expansion blocker**: Arabic is required for UAE market

### Recommended Approach

1. **i18n framework**: Integrate `i18next` + `react-i18next` with `expo-localization`
2. **Phase 1 languages**: English, Hindi, Tamil, Telugu, Kannada (top 5 by athlete population)
3. **Phase 2 languages**: Arabic (Dubai), Marathi, Bengali, Malayalam
4. **Translation workflow**: Extract all strings → professional translation → community review
5. **RTL support**: Required for Arabic (use `I18nManager.forceRTL`)
6. **Dynamic content**: AI responses should respect user language preference

---

## Implementation Timeline

```
Month 1 (Critical):
├── Week 1: AI key migration (P0) + CI/CD setup (P1)
├── Week 2: Performance sprint starts (P1) + Analytics setup (P1)
├── Week 3: Testing foundation (P0) + Push notifications (P1)
└── Week 4: Testing critical paths + Content moderation (P1)

Month 2 (Revenue):
├── Week 5-6: Payment integration (P1)
├── Week 7-8: Admin dashboard (P0)

Month 3 (Scale):
├── Week 9-10: Database optimization (P1) + AI caching (P2)
├── Week 11-12: Video optimization (P2) + Retention features (P2)

Month 4 (Expand):
├── Week 13-14: Offline-first (P2)
├── Week 15-16: i18n (P2) + E2E testing (P0)
```

---

## Investment Required

| Category                | Effort        | Estimated Cost (India rates) |
| ----------------------- | ------------- | ---------------------------- |
| Security (P0)           | 3 days        | $500                         |
| Testing (P0)            | 3 weeks       | $5,000                       |
| Admin Dashboard (P0)    | 4 weeks       | $8,000                       |
| CI/CD (P1)              | 1 week        | $1,500                       |
| Payments (P1)           | 3 weeks       | $6,000                       |
| Performance (P1)        | 2 weeks       | $3,000                       |
| Analytics (P1)          | 2 weeks       | $3,000                       |
| Moderation (P1)         | 2 weeks       | $3,000                       |
| DB Optimization (P1)    | 2 weeks       | $3,000                       |
| Push Notifications (P1) | 1 week        | $1,500                       |
| AI Caching (P2)         | 1 week        | $1,500                       |
| Offline-First (P2)      | 3 weeks       | $5,000                       |
| Video Optimization (P2) | 2 weeks       | $4,000                       |
| Retention (P2)          | 3 weeks       | $5,000                       |
| i18n (P2)               | 2 weeks       | $3,000                       |
| **Total**               | **~16 weeks** | **~$53,000**                 |

> These estimates assume a 2-person engineering team in India. Costs scale with team size and location.

---

_This document should be reviewed monthly and priorities re-assessed based on user feedback, growth metrics, and competitive landscape changes._
