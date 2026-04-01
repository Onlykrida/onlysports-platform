# OnlyKrida -- Product Roadmap & Growth Plan

**Last Updated:** March 2026
**Author:** Product & Strategy Team
**Status:** Active -- Execution Phase

---

## 1. MVP Features (What We Have Today)

OnlyKrida is a functional React Native (Expo SDK 54) app with a Supabase backend. The following features are built and working:

**Authentication & Profiles**

- Email/password auth via Supabase
- Role-based signup: athlete, coach, scout, team, fan, trainer, gym, brand, academy
- Profile editing: avatar upload, bio, location, sport, position, achievements
- Verification badges and role indicators
- Cover photo customization

**Content & Feed**

- Instagram-style feed with image/video posts
- Post types: highlight, training, match, achievement
- Like, comment, share interactions
- Real-time feed updates via Supabase subscriptions
- Video auto-play with custom player

**Discovery & Search**

- Search by name, email, sport, country
- Sport-based chip filters
- User discovery with profile previews
- Recent search history

**Opportunities**

- Browse tryouts, tournaments, sponsorships, scholarships
- Filter by sport, location, type, role
- Teams can create and manage opportunity listings
- Application tracking with deadlines

**Messaging**

- 1:1 real-time chat
- Group messaging
- Conversation list with unread counts
- Read receipts and timestamps
- Direct message from profiles and search

**Social Graph**

- Follow/unfollow system
- Follower and following counts
- Role badges throughout the app

**Notifications**

- Real-time notifications for likes, follows, comments, messages
- Notification center with unread badges
- Mark-as-read functionality

**Scouting (Basic)**

- Basic fit scoring for athlete-scout matching
- Scout preferences screen

**Infrastructure**

- 19 demo users seeded via `scripts/seed-test-data.ts`
- Row Level Security on all Supabase tables
- TypeScript strict mode across the codebase
- 4 static website iterations (landing pages) in `website/`, `website-b/`, `website-c/`, `website-d/`
- Deep link scheme configured (`onlykrida://`)

**What is NOT built yet:** Training logs, PDF export, WhatsApp sharing, AI scouting, video auto-tagging, wearable sync, analytics dashboard, vernacular support, payments.

---

## 2. Phase 1: Launch MVP (Weeks 1-4)

### Strategy: One Sport, One City, One Hundred Athletes

**Recommended launch market: Football + Bengaluru**

Why Football + Bengaluru:

- Bengaluru has 50+ football academies and clubs (BFC, ASC, Ozone FC, etc.)
- ISL presence means scouts are already in the city
- Football culture is strong in Karnataka -- state leagues and BDFA run regular trials
- English-speaking, tech-savvy demographic reduces early friction
- Smaller community than cricket = easier to achieve visible density
- Video highlights are more compelling in football than in, say, athletics

Alternative: Cricket + Mumbai if founder connections are stronger there. Cricket has larger raw numbers but the discovery problem is more entangled with BCCI politics. Football is a cleaner wedge.

### Week 1-2: Ground Game

| Action                                                                                        | Owner   | Target                                                         |
| --------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------- |
| Visit 5-10 football academies in Bengaluru (Ozone, Roots, South United, BFC grassroots, etc.) | Founder | Get academy coaches to WhatsApp a signup link to their players |
| Attend 2-3 BDFA district matches or weekend tournaments                                       | Founder | Hand out flyers with QR code, sign up athletes on the spot     |
| Post on r/IndianFootball, Bengaluru football Facebook groups, Instagram pages                 | Founder | Drive 50+ app downloads                                        |
| Personally help 20 athletes create profiles and upload their first highlight                  | Founder | Seed quality content that makes the app feel alive             |
| Reach out to 10 ISL/I-League scouts via LinkedIn and personal network                         | Founder | Get 3-5 scouts to create profiles and browse athletes          |
| Contact 5 local sports journalists / bloggers for coverage                                    | Founder | One article or Instagram story = 200+ downloads                |

### Week 3-4: First Loop

| Action                                                                 | Owner             | Target                                           |
| ---------------------------------------------------------------------- | ----------------- | ------------------------------------------------ |
| Personally message every signed-up athlete asking for feedback         | Founder           | Identify top 3 bugs and top 3 feature requests   |
| Create 3 opportunity listings (real local trials or tournaments)       | Founder + coaches | Give athletes a reason to check the app daily    |
| Feature top 5 athletes on OnlyKrida Instagram page                     | Founder           | Athletes share their feature = organic downloads |
| Follow up with scouts who signed up -- ask what they need to shortlist | Founder           | Validate core scout workflow                     |
| Fix critical bugs identified in week 1-2 feedback                      | Developer         | Retention depends on the app not crashing        |

### Core Flow to Validate

```
Athlete signs up → creates profile (sport, position, city, academy)
    → uploads 1-2 highlight videos
    → follows other athletes from their academy
    → sees opportunity listing for upcoming trial

Scout signs up → searches "football" + "Bengaluru" + "midfielder"
    → browses athlete profiles and videos
    → shortlists 3-5 athletes
    → messages shortlisted athletes directly

Athlete receives message from scout → tells teammates → teammates sign up
```

If this loop works once, the product has signal. If it does not work after 100 athletes and 10 scouts, diagnose why before scaling.

### Phase 1 KPIs

| Metric                           | Target      | Why It Matters                                 |
| -------------------------------- | ----------- | ---------------------------------------------- |
| Registered athletes              | 100         | Minimum density for search to feel useful      |
| Registered scouts/coaches        | 10          | At least 1 scout per 10 athletes               |
| Video uploads                    | 50          | Content makes the platform sticky              |
| Scout shortlists                 | 5           | Proof that the discovery loop works            |
| Messages sent (scout to athlete) | 10          | Proof that connection happens                  |
| Day 7 retention                  | 20%+        | Baseline for a new app with no marketing spend |
| App crashes / critical bugs      | < 5 reports | Table stakes                                   |

### Technical Work (Phase 1)

- Fix any auth flow bugs on Android (test on 3+ real devices)
- Ensure video upload works reliably on slow 4G connections (compress before upload, show progress bar)
- Add basic analytics: track signups, video uploads, searches, messages sent (use Supabase `analytics` table or a lightweight event logger)
- Test deep links: `onlykrida://user/[id]` should open the app to a profile
- Submit to Google Play (internal testing track) -- Apple App Store can wait until Phase 2 if budget is tight

---

## 3. Phase 2: Product-Market Fit (Months 2-4)

### Goal: Prove that athletes and scouts keep coming back, and that OnlyKrida delivers outcomes WhatsApp cannot.

### New Features

**3.1 Training Log**

- Daily entry: sport, duration (minutes), type (skills / strength / match / recovery), notes
- Calendar view showing training streaks
- Weekly summary visible on profile ("trained 5/7 days this week")
- Purpose: Athletes who log training visit the app daily. Scouts see commitment level.
- Implementation: New `training_logs` Supabase table. Simple form UI. Calendar component (react-native-calendars or custom).

**3.2 Digital Sports Passport**

- One-page PDF export of an athlete's profile
- Contains: photo, name, sport, position, city, age, height/weight, achievements, QR code linking to OnlyKrida profile
- QR code scanned by anyone opens the athlete's profile in-app (or web fallback)
- Athletes can print this and hand it to coaches at trials
- Purpose: Bridges offline and online. Athlete hands a coach a piece of paper, coach scans it, now the coach is on OnlyKrida.
- Implementation: Generate PDF client-side using `react-native-html-to-pdf` or server-side via Supabase Edge Function. QR via `react-native-qrcode-svg`.

**3.3 WhatsApp Sharing**

- Share profile link via WhatsApp with a preview card (Open Graph meta tags on the web link)
- Share individual video posts with a direct link
- "Invite friends" button that opens WhatsApp with a pre-filled message: "I'm on OnlyKrida -- check out my sports profile: [link]"
- Purpose: WhatsApp is how India communicates. If sharing is frictionless, every athlete becomes a distribution channel.
- Implementation: `react-native-share` + Expo Linking. Ensure `onlysports.app` has proper OG tags so WhatsApp shows a rich preview.

**3.4 Improved Video Player**

- Auto-generated thumbnail from first frame (or let athlete pick a frame)
- Sport tag overlay on video (e.g., "Football | Striker | Bengaluru")
- Video duration indicator
- Fullscreen playback with swipe-to-next (TikTok-style browsing in discover)
- Purpose: Video is the core product. If videos look amateur, scouts bounce.
- Implementation: Enhance existing `expo-video` integration. Thumbnail generation server-side or via ffmpeg wasm.

**3.5 Academy/Club Profiles**

- Separate profile type for academies and clubs (already partially supported via `team` and `academy` roles)
- Academy profile shows: name, sport, city, coaches, number of athletes, opportunities posted
- Athletes can tag their academy on their profile ("Trains at: Ozone FC Academy")
- Academy dashboard: see all their athletes' profiles in one place
- Purpose: Onboard one academy, get 50 athletes. Academies also become a trust signal for scouts.
- Implementation: Extend existing `team` role with academy-specific fields. New relationship table `academy_athletes`.

**3.6 Opportunity Application Tracking**

- Status pipeline: Applied --> Under Review --> Shortlisted --> Selected / Rejected
- Athletes see their application status on a dedicated "My Applications" screen (already exists at `app/opportunities/my-applications.tsx`)
- Opportunity posters can update application statuses in bulk
- Email/push notification when status changes
- Purpose: This is the "job board" experience. Without status tracking, athletes apply and hear nothing -- they stop applying.
- Implementation: Enhance existing `manage-applications.tsx` with status update functionality. Add `status` enum to applications table.

### Phase 2 KPIs

| Metric                         | Target | Signal                                   |
| ------------------------------ | ------ | ---------------------------------------- |
| Registered athletes            | 1,000  | 10x growth from Phase 1                  |
| Registered scouts/coaches      | 50     | Academy onboarding drives this           |
| Video uploads                  | 500    | Average 0.5 videos per athlete           |
| Trial/opportunity applications | 50     | Athletes using the platform for outcomes |
| WhatsApp shares                | 200    | Viral loop is working                    |
| Training log entries           | 2,000  | Daily engagement metric                  |
| Sports Passport downloads      | 100    | Offline-to-online bridge is working      |
| Day 30 retention               | 15%+   | Healthy for a niche app at this stage    |

### Growth Actions (Phase 2)

- Expand to 2-3 more sports in Bengaluru (cricket, athletics, basketball)
- Add Mumbai or Hyderabad as a second city
- Onboard 10 academies -- each academy brings 30-50 athletes
- Run "OnlyKrida Challenge" on Instagram: athletes post a highlight clip with #OnlyKridaChallenge, best clips featured on the app
- Partner with 2-3 local tournaments as the "official athlete registration platform"
- Founder speaks at 1-2 sports conferences or college sports events

---

## 4. Phase 3: AI & Analytics (Months 4-8)

### Goal: Make OnlyKrida the smartest scouting tool in India. Shift from manual browsing to intelligent recommendations.

### New Features

**4.1 AI Scouting Recommendations**

- When a scout searches, show "Recommended Athletes" based on: sport, position, location, age, physical attributes, video engagement metrics
- Collaborative filtering: "Scouts who shortlisted Athlete A also shortlisted Athlete B"
- For athletes: "Opportunities matching your profile" recommendations
- Implementation: Start with rule-based scoring (weighted filters), graduate to ML model as data grows. Supabase Edge Functions or a lightweight Python service.

**4.2 Video Auto-Tagging**

- Automatically detect sport from video content (football vs cricket vs athletics)
- Tag key moments: goal, save, sprint, tackle, batting shot, bowling delivery
- Generate "highlight reel" timestamps
- Implementation: Use a pre-trained sports action recognition model (fine-tuned on Indian sports footage). Run inference server-side. Start with manual tagging by athletes as ground truth, then automate.
- Data annotation: Recruit 10-20 athletes as part-time data annotators (they know sports, they are on the platform, pay INR 500-1000/day).

**4.3 Wearable Data Sync**

- Integrate with Apple Health, Google Fit, Garmin, Fitbit
- Pull: steps, distance, heart rate, workout duration, sleep
- Display on profile as "fitness metrics" (opt-in, athlete controls visibility)
- Purpose: Objective performance data differentiates serious athletes from casual ones. Scouts love data.
- Implementation: `react-native-health` for Apple Health, Google Fit API. Garmin/Fitbit via their APIs. Start with Apple Health + Google Fit (covers 80% of users).

**4.4 Performance Analytics Dashboard**

- For athletes: training trends over time, video view counts, profile visit analytics, scout interest heatmap
- For scouts: search analytics, shortlist pipeline, athlete comparison tool (side-by-side profiles)
- For academies: aggregate stats of their athletes, which athletes are getting scouted
- Implementation: Charts via `react-native-chart-kit` or `victory-native`. Data from existing Supabase tables + new analytics events.

**4.5 Advanced Scout Search**

- Filters: sport, position, age range, height/weight, city, state, academy, dominant hand/foot, years of experience
- Sort by: profile completeness, video count, scout interest score, training consistency
- Save searches and get alerts when new athletes match criteria
- Map view: see athletes geographically (useful for scouts planning city visits)
- Implementation: Supabase full-text search + PostGIS for location queries.

**4.6 Trending Athletes Feed**

- Algorithm: weight recent video uploads, profile views, scout shortlists, training consistency
- "Rising Stars" section on the discover tab
- Weekly "Top 10 Athletes" leaderboard by sport
- Purpose: Gamification drives engagement. Athletes want to trend. Creates aspiration.

### Phase 3 KPIs

| Metric                         | Target      | Signal                                 |
| ------------------------------ | ----------- | -------------------------------------- |
| Registered athletes            | 10,000      | Network effects kicking in             |
| Registered scouts/coaches      | 200         | Word of mouth among scouting community |
| Video uploads                  | 5,000       | Rich content library                   |
| AI recommendations clicked     | 1,000/month | AI is adding value                     |
| Wearable syncs                 | 500         | Serious athletes adopting              |
| Scout shortlists               | 500         | Core loop scaling                      |
| Athlete-scout connections made | 200         | Outcomes happening                     |
| Day 30 retention               | 20%+        | Improving with better features         |

---

## 5. Phase 4: Scale (Months 8-18)

### Goal: Become the default platform for sports talent discovery in India. Begin monetization. Enter Dubai.

### 5.1 Multi-Sport Expansion

Target 8-10 sports in order of TAM and scouting demand:

| Priority | Sport      | Rationale                                                |
| -------- | ---------- | -------------------------------------------------------- |
| 1        | Football   | Already launched, ISL/I-League demand                    |
| 2        | Cricket    | Largest athlete pool, IPL/domestic circuit demand        |
| 3        | Kabaddi    | PKL actively scouts via trials, large tier-2/3 base      |
| 4        | Athletics  | Olympic pipeline, SAI actively scouts                    |
| 5        | Badminton  | PBL + Olympic medals driving interest                    |
| 6        | Wrestling  | Olympic success (Phogat effect), strong in Haryana/UP/MP |
| 7        | Basketball | Growing, 3x3 format popular in colleges                  |
| 8        | Boxing     | Strong grassroots in Haryana/NE, Olympic pipeline        |
| 9        | Hockey     | HIL revival, strong in MP/Punjab/Odisha                  |
| 10       | Swimming   | Niche but high-value (scholarship opportunities abroad)  |

Each sport expansion requires: sport-specific profile fields, relevant scouts onboarded, and 100+ athletes seeded before "launch."

### 5.2 Multi-City Expansion

| Tier      | Cities                                                     | Strategy                                             |
| --------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| Metro     | Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Kolkata  | Academies + scout networks                           |
| Tier 2    | Pune, Chandigarh, Kochi, Jaipur, Lucknow, Bhopal, Guwahati | Football + kabaddi + athletics focus                 |
| Tier 3    | Meerut, Imphal, Ranchi, Raipur, Visakhapatnam              | Athletics + wrestling + boxing -- underserved talent |
| Northeast | Shillong, Imphal, Aizawl, Dimapur                          | Football hotbed, systematically underrepresented     |

Hire city leads (part-time, commission-based) who know the local sports scene and can onboard academies and athletes.

### 5.3 Dubai Market Launch

- Target: Indian diaspora athletes first (3.5M Indians in UAE), then broader expat community
- Sports: football (dominant in Dubai amateur scene), cricket, swimming, athletics
- Partnerships: Dubai Sports Council, local football leagues (Dubai Super Cup, community leagues)
- Differentiation in Dubai: verification and transparency matter even more (agents and middlemen are a bigger problem in cross-border scouting)
- Localization: English is sufficient for Dubai. Add Arabic support if traction justifies it.
- Regulatory: UAE data residency -- may need Supabase region in Middle East or a compliant provider

### 5.4 Vernacular Support

| Language  | Region                                        | Priority                             |
| --------- | --------------------------------------------- | ------------------------------------ |
| Hindi     | North India (UP, MP, Rajasthan, Bihar, Delhi) | High -- largest user base            |
| Tamil     | Tamil Nadu, parts of Sri Lanka                | High -- strong sports culture        |
| Telugu    | Andhra Pradesh, Telangana                     | Medium -- Hyderabad is a target city |
| Kannada   | Karnataka                                     | Medium -- home market                |
| Bengali   | West Bengal, NE India                         | Medium                               |
| Marathi   | Maharashtra                                   | Medium                               |
| Malayalam | Kerala                                        | Lower -- English proficiency is high |

Implementation: Use `i18next` + `react-i18next` for string externalization. Start with Hindi (covers 40%+ of India). Do not attempt all languages at once.

### 5.5 Premium Subscriptions

**Scout Pro (INR 2,000-10,000/month)**

- Unlimited athlete search with advanced filters
- AI-powered recommendations
- Bulk shortlist management
- Athlete comparison tools
- Priority messaging (athlete sees "Verified Scout" badge)
- Analytics: which athletes are being scouted by competitors
- Export shortlists as PDF/Excel

**Academy Pro (INR 5,000-15,000/month)**

- Dashboard for all academy athletes
- Bulk opportunity posting
- Performance analytics across athletes
- Branded academy page
- Priority placement in search results

**Athlete Pro (INR 199-499/month)** -- be careful with this tier

- Profile analytics (who viewed, which scouts)
- Priority in search results
- Training analytics and insights
- Verified profile badge
- Caution: Do not paywall core functionality. Athletes should never feel they need to pay to be discovered. This tier is for "nice to have" analytics only.

### 5.6 Institutional Partnerships

| Partner                         | Value to OnlyKrida                                            | Value to Partner                                   |
| ------------------------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| Khelo India                     | Access to 10,000+ registered athletes, government endorsement | Digital platform for athlete management            |
| State sports federations        | Legitimacy, athlete data                                      | Modern trial management, reduce corruption         |
| SAI (Sports Authority of India) | Integration with training centers                             | Digital athlete tracking                           |
| ISL / PKL / PBL teams           | Scout demand, credibility                                     | Talent pipeline, reduce scouting costs             |
| University sports departments   | College athlete pool                                          | Recruitment tool for inter-university competitions |
| FSDL (Football Sports Dev Ltd)  | ISL ecosystem access                                          | Grassroots talent pipeline                         |

### 5.7 Competition Results Integration

- Pull results from: Khelo India Games, state championships, university tournaments, ISL/I-League youth leagues
- Automatically populate athlete profiles with verified competition results
- "Verified Results" badge -- results confirmed by organizer
- Purpose: Solves the trust problem. A scout can see "Won gold in Khelo India U-17 100m" and know it is real.
- Implementation: Start with manual entry by athletes + verification by OnlyKrida team. Graduate to API integrations with federation databases if/when they exist.

### Phase 4 KPIs

| Metric                    | Target               | Signal                              |
| ------------------------- | -------------------- | ----------------------------------- |
| Registered athletes       | 100,000              | Category leadership in India        |
| Registered scouts/coaches | 1,000                | Comprehensive scouting network      |
| Monthly active users      | 30,000               | Healthy engagement ratio            |
| Videos on platform        | 50,000               | Rich content moat                   |
| Cities active             | 10+                  | Geographic distribution             |
| Sports covered            | 8-10                 | Multi-sport platform                |
| Monthly recurring revenue | $10,000+ (INR 8.5L+) | Sustainable business model emerging |
| Athlete-scout connections | 2,000+ cumulative    | Real outcomes being delivered       |
| App Store rating          | 4.3+                 | Product quality signal              |

---

## 6. Growth Strategy

### 6.1 Viral Loops

**The WhatsApp Loop (Primary)**
Athlete creates profile --> shares on WhatsApp status + groups --> friend sees it --> downloads app --> creates profile --> shares on WhatsApp

Mechanics:

- Default share message: "[Name] just joined OnlyKrida. Check out my sports profile: [link]"
- Rich link preview with athlete photo, sport, city
- After every video upload, prompt: "Share this highlight on WhatsApp?"
- After every scout shortlist, notify athlete: "You were shortlisted! Share this with your team."

**The Instagram Loop**

- "Athlete of the Week" posts on OnlyKrida Instagram (tag the athlete)
- Athlete reshares to their story --> their followers see OnlyKrida
- Provide athletes with shareable profile cards (image format, designed for Instagram stories)
- Weekly highlights reel on YouTube/Instagram Reels: "Top 5 OnlyKrida highlights this week"

**The Academy Loop**

- Onboard 1 academy coach --> coach tells athletes to create profiles --> 30-50 athletes join
- Academy gets a branded page showing their athletes --> academy shares this page on their marketing
- Each academy onboarded = organic distribution to their parent network (parents follow the academy)

**The Scout-Driven Loop**

- Scout shortlists an athlete --> athlete gets notified
- Notification: "A scout from [Scout Name] shortlisted you. Your teammates might be next -- invite them."
- When a scout searches and finds limited results: "Know athletes in [city]? Invite them to OnlyKrida."

### 6.2 Academy Partnerships

This is the single highest-leverage growth channel. One academy partnership = 50 athletes + 2-3 coaches + credibility.

Playbook:

1. Identify top 20 academies in target city (Google Maps, Instagram, local knowledge)
2. Visit in person. Do not cold email -- Indian sports culture is relationship-driven.
3. Pitch: "Your athletes get free profiles visible to scouts nationwide. Your academy gets a branded page. It costs you nothing."
4. Help the first 10 athletes at each academy create profiles on the spot.
5. Give the academy coach a "Verified Coach" badge and the ability to post opportunities.
6. Follow up weekly for the first month. Share metrics: "15 scouts viewed your athletes this week."

### 6.3 College Sports

- Partner with university sports departments (DU, Mumbai University, Christ University, SRM, VIT, etc.)
- Offer to digitize their athlete database on OnlyKrida
- Inter-university tournament integration: athletes registered on OnlyKrida, results logged
- College sports coordinators become ambassadors
- This is a slower channel but builds a pipeline of 18-22 year old athletes who are digital-native

### 6.4 Government Channel

- Position OnlyKrida as the tech partner for Khelo India digital initiatives
- Offer to build the athlete registration module on top of OnlyKrida's platform
- State sports departments need digital transformation -- offer free pilot in one state
- This is a 6-12 month sales cycle but the upside is massive (government mandate = millions of athletes)
- Risk: Government partnerships move slowly and can be politically complicated. Do not depend on this for survival.

### 6.5 Content Marketing

| Content Type                           | Platform                        | Frequency     | Purpose                               |
| -------------------------------------- | ------------------------------- | ------------- | ------------------------------------- |
| "Athlete of the Week"                  | Instagram, YouTube              | Weekly        | Showcase athletes, drive downloads    |
| "Scout's Perspective" interviews       | YouTube, Blog                   | Bi-weekly     | Build trust with scout community      |
| "From Ground to Glory" athlete stories | Instagram Reels, YouTube Shorts | Weekly        | Emotional hook, shareability          |
| Training tips from coaches             | Instagram, App                  | 3x/week       | Value-add content, daily engagement   |
| Tournament coverage                    | Instagram Stories, App          | During events | Real-time relevance                   |
| Founder's journey / behind-the-scenes  | LinkedIn, Twitter/X             | Weekly        | Fundraising visibility, founder brand |

### 6.6 Referral Program

- Athlete refers 5 friends who sign up --> athlete gets "Featured" badge for 1 week (boosted in search)
- Coach refers an academy --> coach gets "Top Coach" badge
- Scout refers another scout --> both get 1 month free of Scout Pro (when launched)
- Keep it simple. No points systems. Badges and visibility are the currency.

---

## 7. Team Structure

### Immediate (Months 1-4)

| Role           | Person             | Responsibilities                                                                   | Full-Time / Part-Time |
| -------------- | ------------------ | ---------------------------------------------------------------------------------- | --------------------- |
| Founder / CEO  | Anirudh            | Product vision, athlete/academy recruitment, fundraising, content, everything else | Full-time             |
| Lead Developer | Hire or co-founder | App development (React Native/Expo), Supabase backend, bug fixes, feature shipping | Full-time             |

Two people can ship Phase 1 and most of Phase 2. The founder handles growth, the developer handles product.

### Phase 2-3 (Months 4-8)

| Role                               | Responsibilities                                                                            | Hire Trigger                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Community Manager                  | Athlete/scout onboarding, social media content, WhatsApp community management, user support | When founder can no longer handle onboarding + product + fundraising |
| Designer (Contract)                | UI polish, marketing assets, shareable profile cards, pitch deck design                     | When shipping speed is bottlenecked by design                        |
| ML Engineer (Part-time / Contract) | AI scouting recommendations, video auto-tagging model, data pipeline                        | When Phase 3 AI features begin                                       |

### Phase 4 (Months 8-18)

| Role                               | Responsibilities                                                        |
| ---------------------------------- | ----------------------------------------------------------------------- |
| CTO / Lead Developer               | Architecture, infrastructure, team management                           |
| Mobile Developer #2                | Feature development, platform-specific optimization                     |
| Backend / ML Engineer              | AI features, data pipeline, analytics                                   |
| Community Manager                  | Expanded to handle multiple cities                                      |
| City Leads (Part-time, 3-5)        | Local academy partnerships, ground-level recruitment                    |
| Data Annotators (Part-time, 10-20) | Athletes who label sports videos for ML training, paid INR 500-1000/day |
| Designer                           | Full-time, product + marketing                                          |

### Advisory (Unpaid, Equity or Goodwill)

Recruit 2-3 advisors from:

- A former professional athlete (credibility with athletes and media)
- A sports business executive (federation or league connections)
- A startup founder who has scaled a consumer app in India

---

## 8. Revenue Model Timeline

### Months 1-3: Zero Revenue (Pure Growth)

Focus entirely on user acquisition and product-market fit. Do not charge anyone for anything. Every feature is free. Revenue at this stage is a distraction.

Burn rate target: Under INR 2L/month (founder salary + server costs + developer if co-founder with equity).

### Months 4-6: Academy Listings

| Revenue Source                                 | Price                 | Target       | Monthly Revenue   |
| ---------------------------------------------- | --------------------- | ------------ | ----------------- |
| Academy Pro listing (branded page + dashboard) | INR 1,000-5,000/month | 10 academies | INR 20,000-50,000 |

Total target: INR 30,000/month (~$360)

Why academies pay: Branded page visible to scouts, dashboard showing which of their athletes are getting scouted, ability to post unlimited opportunities. Positioning: "You spend INR 50,000/month on Instagram ads. We put your athletes directly in front of scouts for INR 3,000/month."

### Months 6-9: Scout Subscriptions

| Revenue Source                            | Price                   | Target       | Monthly Revenue |
| ----------------------------------------- | ----------------------- | ------------ | --------------- |
| Academy Pro                               | INR 1,000-5,000/month   | 15 academies | INR 40,000      |
| Scout Pro (individual)                    | INR 2,000-5,000/month   | 10 scouts    | INR 30,000      |
| Scout Pro (institutional -- ISL/PKL team) | INR 10,000-25,000/month | 2 teams      | INR 30,000      |

Total target: INR 80,000-100,000/month (~$960-1,200)

### Months 9-12: Opportunity Posting Fees

| Revenue Source                            | Price                   | Target            | Monthly Revenue |
| ----------------------------------------- | ----------------------- | ----------------- | --------------- |
| Academy Pro                               | INR 3,000-5,000/month   | 20 academies      | INR 70,000      |
| Scout Pro                                 | INR 2,000-10,000/month  | 25 scouts         | INR 100,000     |
| Opportunity listing (trial/tournament)    | INR 2,000-5,000/listing | 15 listings/month | INR 50,000      |
| Featured opportunity (homepage placement) | INR 5,000-10,000/week   | 4/month           | INR 30,000      |

Total target: INR 2,50,000/month (~$3,000)

### Months 12-18: Premium + B2B Data

| Revenue Source                     | Price                   | Target         | Monthly Revenue |
| ---------------------------------- | ----------------------- | -------------- | --------------- |
| All existing streams               | --                      | Growing        | INR 3,00,000    |
| Athlete Pro (analytics)            | INR 199-499/month       | 200 athletes   | INR 60,000      |
| B2B data partnerships (anonymized) | Custom pricing          | 2-3 deals      | INR 1,00,000    |
| Tournament management (SaaS)       | INR 10,000-25,000/event | 5 events/month | INR 75,000      |

Total target: INR 5,00,000+/month (~$6,000+)

**Path to $10K MRR (INR 8.5L)**: Achievable by month 15-18 with the above mix. This is the milestone that makes seed fundraising credible.

### What We Will Never Charge For

- Basic athlete profile creation
- Basic video uploads (reasonable limits)
- Being discoverable in search
- Receiving messages from scouts
- Applying to opportunities

Paywalling core discovery breaks the network. The free tier must always be useful enough that an athlete in a tier-3 city with no money can get discovered.

---

## 9. Risk Register

| #   | Risk                                    | Impact   | Probability | Mitigation                                                                                                                                                                                                                                                                                 |
| --- | --------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Cold start: no athletes sign up**     | Critical | High        | Manual recruitment at grounds. Seed with 100 athletes personally. Academy partnerships. Do not launch publicly until there are 100 real profiles.                                                                                                                                          |
| 2   | **Scouts do not come**                  | Critical | Medium      | Seed the platform with curated athlete profiles and highlight reels. Reach out to scouts personally (LinkedIn, WhatsApp). Show them pre-filtered, high-quality profiles. If scouts see value in 10 minutes, they stay.                                                                     |
| 3   | **WhatsApp is "good enough"**           | High     | Medium      | WhatsApp cannot: search athletes by sport/position/city, host video portfolios, track applications, verify credentials, provide analytics. OnlyKrida's value is structure and discoverability -- not communication. Position accordingly.                                                  |
| 4   | **Video upload fails on slow networks** | High     | High        | Compress video client-side before upload. Show upload progress. Allow resume on failure. Test extensively on 3G/4G in tier-2 cities. This is a make-or-break UX issue in India.                                                                                                            |
| 5   | **Competitor launches (well-funded)**   | Medium   | Low         | First-mover data advantage. Network effects compound. An athlete with 50 connections on OnlyKrida will not switch easily. Focus on community, not features. Features can be copied; community cannot.                                                                                      |
| 6   | **Funding gap before revenue**          | High     | Medium      | Keep burn rate under INR 2-3L/month. Apply to accelerators (Y Combinator, Antler India, Surge, 100X.VC). Bootstrap with academy revenue starting month 4. Have 12-month runway before scaling team.                                                                                        |
| 7   | **Athlete safety / predatory scouts**   | Critical | Medium      | Verification system for scouts (require LinkedIn, organization affiliation). Report/block functionality. Moderate messages for minors (under 18). Privacy controls: athlete chooses what is visible. Clear terms of service. This is a trust platform -- any safety incident can be fatal. |
| 8   | **Federation / government pushback**    | Medium   | Low         | Position as complementary to existing systems, not replacement. Partner with federations rather than disrupting them. Offer free tools to officials. Avoid criticizing the system publicly.                                                                                                |
| 9   | **Content moderation at scale**         | Medium   | Medium      | Automated content scanning for inappropriate uploads. Community reporting. Manual review queue. Clear content guidelines. Start strict, loosen as needed.                                                                                                                                  |
| 10  | **Developer burnout / key person risk** | High     | Medium      | Document codebase thoroughly (CLAUDE.md already exists). Use standard patterns (Expo, Supabase, TypeScript). Make it easy for a new developer to onboard. Do not let the codebase become a single-person dependency.                                                                       |

---

## 10. Milestones for Fundraising

### Pre-Seed Round: $100,000-200,000

**Target timing:** Month 4-6 (after Phase 1 + early Phase 2)

**What you need to show:**

- 1,000+ registered athletes with real profiles (not dummy data)
- 50+ scouts/coaches actively using the platform
- Working AI prototype (even rule-based recommendations)
- 5+ athlete-scout connections that led to real trials or selections
- Evidence of organic growth (athletes inviting athletes)
- Clear retention data (DAU/MAU, Day 7 / Day 30 retention)

**Pitch narrative:** "India has 30M+ competitive athletes and zero digital discovery infrastructure. We have 1,000 athletes and 50 scouts in Bengaluru. Scouts are shortlisting athletes they would never have found. Here is the data. We need $150K to expand to 3 cities and 5 sports."

**Target investors:**

- Indian angel networks: Mumbai Angels, Indian Angel Network, Bengaluru Angels
- Sports-focused angels: former athletes, league executives, sports media founders
- Micro VCs: 100X.VC (INR 25L for 5%), Titan Capital, Better Capital
- Accelerators: Antler India, Surge (Sequoia), Y Combinator (apply to W27 or S27 batch)

### Seed Round: $500,000-1,000,000

**Target timing:** Month 10-14

**What you need to show:**

- 50,000+ athletes across 5+ cities
- At least 1 institutional partnership (state federation, Khelo India, or a pro league)
- Revenue: INR 1-2L/month minimum (proves willingness to pay)
- AI scouting recommendations with measurable engagement
- Strong retention: 25%+ Day 30
- Unit economics trending positive (CAC declining, engagement per user increasing)
- Clear path to INR 10L/month revenue

**Pitch narrative:** "We are the largest sports talent database in India. 50,000 athletes, 5 cities, partnerships with [names]. Scouts from ISL and PKL teams use us weekly. We are generating INR 2L/month from academy subscriptions and growing 30% month-over-month. We need $750K to launch AI scouting, expand to 10 cities, and reach 200K athletes."

**Target investors:**

- Indian seed funds: Blume Ventures, Kalaari Capital, Lightspeed India, India Quotient
- Sports tech funds: global sports VC firms entering India
- Strategic: League/franchise investors who see data value

### Series A: $3,000,000-5,000,000

**Target timing:** Month 18-24

**What you need to show:**

- 500,000+ athletes
- Multi-sport, multi-city platform (8+ sports, 10+ cities)
- Proven unit economics: LTV > 3x CAC
- Revenue: INR 5-10L/month and growing
- Dubai market traction
- Institutional partnerships with at least 2 major organizations
- AI scouting with demonstrable outcomes (athletes discovered and placed via AI recommendations)
- Team of 10-15 people
- Clear path to INR 50L/month revenue

**Pitch narrative:** "We are the LinkedIn for sports in South Asia. 500K athletes, 10 cities, 8 sports. Scouts from every major Indian league use OnlyKrida. We helped place 200+ athletes in trials last quarter. Revenue is INR 8L/month growing 25% MoM. We are launching in Dubai and adding AI video analysis. We need $4M to become the category-defining platform."

---

## Appendix A: Week-by-Week Execution Plan (Phase 1)

| Week | Focus             | Key Actions                                                                                                      | Success Metric                                  |
| ---- | ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1    | Setup             | Fix critical bugs, test on 3 Android devices, set up analytics events, prepare flyers/QR codes                   | App stable, analytics working                   |
| 2    | First 30 athletes | Visit 3 academies, attend 1 local match, onboard 30 athletes personally, get 10 video uploads                    | 30 athletes, 10 videos                          |
| 3    | First scouts      | LinkedIn outreach to 20 scouts, onboard 5, create 2 real opportunity listings                                    | 5 scouts, 2 opportunities posted                |
| 4    | Close the loop    | Follow up with all users for feedback, fix top 3 bugs, get 1 scout to shortlist, feature 5 athletes on Instagram | 100 athletes, 10 scouts, 1 shortlist, 50 videos |

## Appendix B: Tech Debt to Address Before Scaling

1. **Video compression pipeline** -- uploads must work reliably on 4G. Compress to 720p max before upload.
2. **Push notifications** -- expo-notifications is configured but needs backend triggers for real-time scout messages and application status updates.
3. **Search performance** -- current search queries the profiles table directly. Add full-text search indexes before 1,000+ users.
4. **Image CDN** -- Supabase storage is fine for now, but consider Cloudflare Images or imgproxy for responsive image serving at scale.
5. **Analytics infrastructure** -- move from ad-hoc Supabase table to Mixpanel or Amplitude free tier for proper funnel analysis.
6. **Offline support** -- basic caching exists via React Query, but athletes in areas with intermittent connectivity need offline profile viewing and queued uploads.
7. **App Store submission** -- Google Play internal testing immediately. Apple TestFlight by Phase 2. Full App Store submission requires privacy policy, content guidelines, and age rating (already have `privacy-policy.tsx` and `terms-of-service.tsx`).

## Appendix C: Metrics Dashboard (Build This First)

Track these from day one. Use Supabase queries initially, migrate to a proper analytics tool by Phase 2.

**Daily:**

- New signups (by role)
- Video uploads
- Messages sent
- Search queries
- App opens (DAU)

**Weekly:**

- Retention (Day 1, Day 7)
- Scout shortlists
- Opportunity applications
- WhatsApp shares (tracked via UTM parameters on shared links)
- Top searched sports and cities

**Monthly:**

- MAU and DAU/MAU ratio
- Day 30 retention
- Athlete-scout connections made
- Revenue (when applicable)
- NPS score (survey 10% of active users monthly)

---

_This roadmap is a living document. Update monthly based on actual metrics and user feedback. The plan will change -- the discipline of tracking progress against a plan is what matters._
