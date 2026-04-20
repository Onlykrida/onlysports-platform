# Business Requirement Document (BRD)

# OnlyKrida — India's First AI-Powered Sports Talent Discovery Platform

> **Version**: 1.0 | **Date**: April 2026 | **Status**: MVP Complete | **Classification**: Confidential
> **Author**: OnlyKrida Product & Engineering Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Market Analysis](#2-market-analysis)
3. [Stakeholder Analysis](#3-stakeholder-analysis)
4. [Business Model](#4-business-model)
5. [User Personas](#5-user-personas)
6. [Business Requirements](#6-business-requirements)
7. [Success Metrics](#7-success-metrics)
8. [Risk Analysis](#8-risk-analysis)

---

# 1. Executive Summary

## 1.1 Vision

**To become the global digital identity layer for sports — starting with India's 400 million untapped athletes.**

OnlyKrida envisions a world where no athlete's talent goes undiscovered due to geography, economics, or lack of connections. By 2030, every serious athlete in India — from a village kabaddi player to a Tier 1 city footballer — will have a verified digital sports identity on OnlyKrida that scouts, coaches, and teams can discover, evaluate, and recruit from.

## 1.2 Mission

Make every athlete discoverable. Provide scouts with AI-powered tools to find talent anywhere. Give coaches data to develop athletes scientifically. Build the trust infrastructure (verified profiles, fitness data, achievement records) that the Indian sports ecosystem desperately lacks.

## 1.3 Problem Statement

India's sports talent ecosystem is fundamentally broken:

| Problem                              | Impact                                                             | Who Suffers                         |
| ------------------------------------ | ------------------------------------------------------------------ | ----------------------------------- |
| **No digital identity for athletes** | Talent dies in WhatsApp groups and local newspapers                | Athletes, Scouts                    |
| **Geographic scouting bias**         | Scouts only visit metro cities; 70% of talent is in Tier 2/3       | Athletes in small towns             |
| **Pay-to-play culture**              | Access to trials costs Rs 5K-50K; excludes low-income families     | Economically disadvantaged athletes |
| **Fragmented, unverified data**      | Fitness data on paper; fake achievements rampant                   | Scouts, Coaches, Teams              |
| **Scout inefficiency**               | Travel thousands of miles, 90% of trips yield zero signings        | Scouts, Teams (budget waste)        |
| **No standardized metrics**          | Every academy measures differently; no comparable data             | Coaches, Federations                |
| **Information asymmetry**            | Athletes don't know about opportunities; teams can't find athletes | Everyone                            |
| **Zero technology**                  | WhatsApp + Excel = "talent management" for most organizations      | The entire ecosystem                |

### The Core Insight

India has **400 million+ sports participants** but **less than 1% are professionally scouted**. The pipeline from grassroots to professional is not a funnel — it's a wall. OnlyKrida turns that wall into a bridge using technology, AI, and verified data.

## 1.4 Opportunity Size

| Metric                                           | Value          | Source                   |
| ------------------------------------------------ | -------------- | ------------------------ |
| India sports participants                        | 400M+          | FICCI Sports Report 2025 |
| Indian sports industry size                      | $7 Billion     | KPMG India               |
| Annual growth rate                               | 15% YoY        | Deloitte                 |
| Projected 2030 market                            | $14 Billion    | McKinsey India Sports    |
| Grassroots athletes without digital presence     | 99%+           | OnlyKrida Research       |
| Active organized scouts in India                 | ~5,000         | Federation data          |
| Sports academies                                 | 15,000+        | FICCI Education          |
| Annual sports scholarships (unfilled)            | 30%+           | UGC Data                 |
| Government Khelo India budget                    | Rs 1,756 Crore | Ministry of Sports       |
| IPL ecosystem value (proof of sports = commerce) | $16 Billion    | Duff & Phelps            |

**TAM**: $7B (Indian sports industry)
**SAM**: $800M (talent discovery, scouting, recruitment segment)
**SOM (Year 3)**: $12M (OnlyKrida's achievable revenue)

---

# 2. Market Analysis

## 2.1 Current Problems in the Sports Ecosystem

### For Athletes

- No centralized platform to showcase talent
- Discovery depends entirely on personal networks and geography
- Fitness data exists on paper, not digitally
- No way to get noticed by scouts outside their city
- Pay-to-play trials exclude talented but poor athletes
- Fake profiles and achievements by competitors hurt credibility

### For Scouts

- Manual, travel-heavy scouting process
- No standardized data to compare athletes across regions
- Rely on word-of-mouth and personal networks
- No tools for systematic athlete evaluation
- Cannot verify claimed achievements or fitness levels
- Spend 80% of time on logistics, 20% on actual evaluation

### For Coaches

- No digital tools for athlete development tracking
- Cannot benchmark athletes against standardized metrics
- Team management is WhatsApp-based
- No way to showcase coaching credentials or philosophy

### For Teams

- Recruitment is expensive and inefficient
- Cannot reach athletes in Tier 2/3 cities
- No centralized system for managing applications
- Opportunity postings reach limited audiences

## 2.2 Competitor Analysis

| Feature                      | OnlyKrida                  | Hudl                        | NCSA (Next College Student Athlete) | TransferMarkt                | SportsRecruits    | Khelomore (India)       |
| ---------------------------- | -------------------------- | --------------------------- | ----------------------------------- | ---------------------------- | ----------------- | ----------------------- |
| **Primary Market**           | India (grassroots → pro)   | USA (high school/college)   | USA (college recruiting)            | Global (pro football/soccer) | USA (college)     | India (equipment sales) |
| **Free for Athletes**        | Yes (forever)              | Freemium                    | No ($)                              | View only                    | No ($)            | N/A                     |
| **AI-Powered Matching**      | Yes (Claude Opus)          | Basic video analytics       | No                                  | No                           | No                | No                      |
| **Fitness Test Integration** | Yes (5 types, verified)    | No                          | No                                  | No                           | No                | No                      |
| **Multi-Sport**              | All sports                 | Primarily American football | US college sports                   | Football (soccer) only       | US college sports | Equipment retail        |
| **Social Feed**              | Yes (Instagram-like)       | Limited highlights          | No                                  | Forum/comments               | No                | No                      |
| **Real-time Messaging**      | Yes (1-on-1 + group)       | No                          | Yes (limited)                       | No                           | Yes (limited)     | No                      |
| **9 User Role Types**        | Yes                        | 2 roles                     | 3 roles                             | Viewer + editor              | 3 roles           | Buyer/seller            |
| **Verified Credentials**     | 4-tier verification system | No                          | No                                  | Editorial only               | No                | No                      |
| **Opportunity Marketplace**  | 5 categories               | No                          | Scholarships only                   | Transfers only               | Scholarships      | No                      |
| **Mobile App**               | iOS + Android + Web        | Yes                         | Yes                                 | Yes                          | Limited           | Yes                     |
| **India-Specific**           | Built for India            | No                          | No                                  | Partial                      | No                | Equipment only          |
| **Pricing (Scout)**          | Rs 999-9,999/mo            | $99-799/yr                  | N/A                                 | Free                         | $149-499/yr       | N/A                     |

### Key Takeaway

**No platform globally combines social networking + AI scouting + verified fitness data + opportunity marketplace — and none focuses on India's grassroots athletes.** OnlyKrida has no direct competitor.

## 2.3 OnlyKrida's Moat (Defensibility)

| Moat                           | Description                                                                     | Defensibility                      |
| ------------------------------ | ------------------------------------------------------------------------------- | ---------------------------------- |
| **Network Effects**            | More athletes → more valuable for scouts → more scouts → attracts more athletes | Strong — winner-take-most          |
| **Data Moat**                  | Verified fitness test data is proprietary and accumulates over time             | Very strong — data compounds       |
| **AI Training Data**           | Scout preferences + matching outcomes train the recommendation engine           | Growing — improves with use        |
| **Multi-sided Platform**       | 9 roles create complex, hard-to-replicate ecosystem                             | Very strong — high switching costs |
| **First Mover (India)**        | No competitor in Indian grassroots sports tech                                  | Moderate — speed matters           |
| **Coach/Academy Partnerships** | Coaches bring 20-50 athletes each; institutional relationships are sticky       | Strong — relationship-based        |
| **Brand & Trust**              | OnlyKrida = verified sports identity (like LinkedIn for professionals)          | Grows with time                    |

---

# 3. Stakeholder Analysis

## 3.1 Athletes

| Dimension          | Detail                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Who**            | School (14-18), college (18-22), amateur (18-35), semi-pro, professional athletes across all sports                                                                                   |
| **Goals**          | Get discovered by scouts; showcase talent to a wider audience; access tryouts, tournaments, scholarships; track fitness progress; build a digital sports resume                       |
| **Pain Points**    | No digital identity; geographic isolation limits visibility; can't afford to attend distant trials; no way to verify their achievements credibly; don't know what opportunities exist |
| **Platform Value** | Free verified profile; AI-optimized for scout discovery; fitness test data builds credibility; content platform for highlights; opportunity marketplace for applications              |
| **Key Metric**     | Profile views by scouts, opportunities applied to, follower growth                                                                                                                    |

## 3.2 Coaches

| Dimension          | Detail                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Who**            | School/college coaches, academy coaches, independent trainers, national-level coaches                                                                                    |
| **Goals**          | Develop athletes systematically; track athlete progress with data; recruit talent for their programs; build professional credibility                                     |
| **Pain Points**    | No digital tools for team management; can't benchmark athletes; team communication is fragmented (WhatsApp groups); no way to showcase coaching results                  |
| **Platform Value** | Team roster management; fitness test verification (adds trust to their assessments); content platform to share coaching philosophy; athlete discovery for their programs |
| **Key Metric**     | Athletes coached on platform, fitness tests verified, team engagement                                                                                                    |

## 3.3 Scouts

| Dimension          | Detail                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Who**            | Independent freelance scouts, sports agency scouts, federation scouts, ISL/IPL team scouts, international scouts looking at Indian talent                                                              |
| **Goals**          | Find the best talent efficiently; reduce travel and cost per signing; access standardized, comparable data; verify athlete claims; stay ahead of competing scouts                                      |
| **Pain Points**    | Travel-heavy, expensive scouting process; rely on personal networks (limited geographic reach); no standardized data across regions; fake achievements are common; 90% of scouting trips yield nothing |
| **Platform Value** | AI-powered athlete recommendations (fit scores 0-100); customizable search preferences; shortlisting and comparison tools; verified fitness data; direct messaging with athletes                       |
| **Key Metric**     | Athletes shortlisted, successful matches, time/cost savings vs. traditional scouting                                                                                                                   |

## 3.4 Teams / Clubs

| Dimension          | Detail                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Who**            | Local clubs, state-level teams, ISL/I-League clubs, IPL franchises, corporate sports teams, university teams                                                                                     |
| **Goals**          | Recruit the best athletes affordably; fill open roster spots; promote tryouts and opportunities to a wide audience; manage recruitment pipeline                                                  |
| **Pain Points**    | Recruitment is expensive and slow; can't reach Tier 2/3 talent; opportunity postings have limited reach; application management is manual (email/WhatsApp); no centralized recruitment dashboard |
| **Platform Value** | Opportunity marketplace (post tryouts, tournaments, contracts, scholarships); application management dashboard; team profile page; AI-assisted athlete screening; direct outreach via messaging  |
| **Key Metric**     | Applications received, positions filled, cost per hire vs. traditional                                                                                                                           |

## 3.5 Fans

| Dimension          | Detail                                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Who**            | Sports enthusiasts, local community supporters, parents of athletes, sports media/bloggers                                                            |
| **Goals**          | Follow favorite athletes' journeys; discover rising talent early; engage with sports content; support local athletes                                  |
| **Pain Points**    | No platform to follow grassroots athletes (only stars are on Instagram); local sports news is fragmented; can't track athletes' development over time |
| **Platform Value** | Social feed with athlete content; trending athletes section; follow athletes and get updates; community engagement (likes, comments, shares)          |
| **Key Metric**     | Feed engagement rate, athletes followed, session duration                                                                                             |

## 3.6 Trainers

| Dimension          | Detail                                                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Who**            | Personal trainers, fitness coaches, sports physiotherapists, strength & conditioning specialists                                        |
| **Goals**          | Showcase expertise; attract athlete clients; share training content; build professional network                                         |
| **Pain Points**    | No sports-specific platform to market services; hard to demonstrate results; limited to local word-of-mouth                             |
| **Platform Value** | Professional profile with certifications; content platform for training videos; athlete connection network; fitness test administration |
| **Key Metric**     | Athlete connections, content engagement, profile views                                                                                  |

## 3.7 Gyms / Academies

| Dimension          | Detail                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Who**            | Sports academies, training centers, gym chains, specialized facilities (swimming, tennis, martial arts)           |
| **Goals**          | Attract student athletes; showcase facilities and programs; track alumni success; build institutional credibility |
| **Pain Points**    | Marketing limited to local reach; no way to showcase athlete outcomes; manual enrollment management               |
| **Platform Value** | Institutional profile; athlete roster tracking; program showcase; fitness test center verification status         |
| **Key Metric**     | Students enrolled via platform, alumni success stories, profile engagement                                        |

## 3.8 Brands

| Dimension          | Detail                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **Who**            | Sports equipment brands, nutrition companies, sports apparel, local businesses, media companies                                 |
| **Goals**          | Sponsor rising athletes; reach sports-engaged audience; identify brand ambassadors; content partnership                         |
| **Pain Points**    | Difficult to find grassroots athletes for sponsorship; no data on athlete reach/engagement; manual ambassador management        |
| **Platform Value** | Athlete search by sport/location/engagement; sponsorship opportunity postings; brand profile page; campaign management (future) |
| **Key Metric**     | Sponsorship deals created, brand impressions, athlete partnerships                                                              |

## 3.9 Platform Admin

| Dimension          | Detail                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| **Who**            | OnlyKrida operations team                                                                              |
| **Goals**          | Platform health, content quality, user growth, revenue, compliance                                     |
| **Pain Points**    | Currently no admin dashboard; no content moderation tools; no user management; no analytics visibility |
| **Platform Value** | Admin dashboard (to be built); user management; content moderation; analytics; AI usage monitoring     |
| **Key Metric**     | DAU/MAU ratio, content quality score, user reports resolved, revenue                                   |

---

# 4. Business Model

## 4.1 Core Principle

**Athletes never pay. Ever.** The platform's value grows with athlete volume. Scouts, teams, and brands pay because athletes are there.

## 4.2 Revenue Streams

### Stream 1: Scout Subscriptions

| Plan                 | Monthly Price (INR) | Monthly Price (USD) | Features                                                                                                                           |
| -------------------- | ------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Scout Free**       | Rs 0                | $0                  | Browse profiles (limited), 5 searches/day, no AI recommendations                                                                   |
| **Scout Basic**      | Rs 999              | $12                 | 50 searches/mo, 10 shortlists, basic filters, messaging (10/day)                                                                   |
| **Scout Pro**        | Rs 2,499            | $30                 | Unlimited searches, AI recommendations (fit scores), 50 shortlists, full filters, unlimited messaging, export profiles             |
| **Scout Enterprise** | Rs 9,999            | $120                | Everything in Pro + API access, bulk export, team collaboration (5 seats), priority support, custom AI models, analytics dashboard |

### Stream 2: Team Dashboard Plans

| Plan                | Monthly Price (INR) | Monthly Price (USD) | Features                                                                            |
| ------------------- | ------------------- | ------------------- | ----------------------------------------------------------------------------------- |
| **Team Free**       | Rs 0                | $0                  | Team profile, 1 opportunity/month, basic applications view                          |
| **Team Starter**    | Rs 1,999            | $24                 | 5 opportunities/mo, 5 team members, application management, messaging               |
| **Team Pro**        | Rs 4,999            | $60                 | Unlimited opportunities, 25 team members, analytics, AI screening, priority listing |
| **Team Enterprise** | Rs 14,999           | $180                | Everything + API access, 100 members, dedicated support, custom branding            |

### Stream 3: Brand & Sponsorship Marketplace

| Product                     | Pricing                   | Description                                                           |
| --------------------------- | ------------------------- | --------------------------------------------------------------------- |
| **Sponsored Athlete Cards** | Rs 5,000-25,000/campaign  | Brand logo on athlete profile cards in discover feed                  |
| **Featured Opportunity**    | Rs 500-2,000/listing      | Boosted visibility for opportunity postings                           |
| **Brand Profile Page**      | Rs 2,999/mo               | Enhanced brand page with custom branding, athlete ambassador showcase |
| **Targeted Notifications**  | Rs 10,000-50,000/campaign | Notify athletes matching specific criteria about brand opportunities  |
| **Data Insights Report**    | Rs 25,000-1,00,000/report | Custom analytics on athlete demographics, engagement, by sport/region |

### Stream 4: Premium Features (Future)

| Feature                        | Price           | Description                                                  |
| ------------------------------ | --------------- | ------------------------------------------------------------ |
| **Verified Badge (Expedited)** | Rs 499 one-time | Fast-track verification process (normally 7 days → 24 hours) |
| **Profile Analytics**          | Rs 199/mo       | Detailed analytics on who viewed profile, engagement trends  |
| **Video Analysis**             | Rs 99/analysis  | AI-powered video analysis of technique (future ML feature)   |
| **Priority Listing**           | Rs 299/mo       | Athlete appears higher in scout searches                     |

## 4.3 Unit Economics

| Metric                     | Value            | Notes                                            |
| -------------------------- | ---------------- | ------------------------------------------------ |
| **CAC (Athletes)**         | Rs 50 ($0.60)    | Organic via coaches, social media, word-of-mouth |
| **CAC (Scouts)**           | Rs 5,000 ($60)   | Direct sales, sports events, LinkedIn outreach   |
| **CAC (Teams)**            | Rs 8,000 ($96)   | Direct sales, federation partnerships            |
| **LTV (Scout Basic)**      | Rs 11,988 ($144) | 12-month average retention                       |
| **LTV (Scout Pro)**        | Rs 29,988 ($360) | 12-month average retention                       |
| **LTV (Team Pro)**         | Rs 59,988 ($720) | 12-month average retention                       |
| **LTV:CAC (Scout Pro)**    | 6x               | Healthy ratio (>3x is good)                      |
| **Gross Margin**           | 85%              | Low infrastructure costs (Supabase, Claude API)  |
| **Monthly Burn (current)** | Rs 2L ($2.4K)    | Pre-revenue, 1-person team                       |
| **Target Monthly Burn**    | Rs 5L ($6K)      | Post-funding, 3-person team                      |

## 4.4 Revenue Projections

| Metric               | Year 1        | Year 2            | Year 3           |
| -------------------- | ------------- | ----------------- | ---------------- |
| **Total Users**      | 50,000        | 250,000           | 1,000,000        |
| **Athletes**         | 40,000 (80%)  | 200,000 (80%)     | 800,000 (80%)    |
| **Scouts (total)**   | 200           | 1,000             | 4,000            |
| **Scouts (paid)**    | 50 (25%)      | 300 (30%)         | 1,200 (30%)      |
| **Teams (total)**    | 100           | 500               | 2,000            |
| **Teams (paid)**     | 50 (50%)      | 200 (40%)         | 800 (40%)        |
| **Brands (active)**  | 5             | 25                | 100              |
| **Scout MRR**        | Rs 1.25L      | Rs 7.5L           | Rs 30L           |
| **Team MRR**         | Rs 2.5L       | Rs 10L            | Rs 40L           |
| **Brand Revenue/mo** | Rs 2.5L       | Rs 12.5L          | Rs 50L           |
| **Other Revenue/mo** | Rs 50K        | Rs 5L             | Rs 20L           |
| **Total MRR**        | Rs 6.75L      | Rs 35L            | Rs 1.4 Cr        |
| **Total ARR**        | Rs 81L ($97K) | Rs 4.2 Cr ($504K) | Rs 16.8 Cr ($2M) |
| **Gross Margin**     | 85%           | 82%               | 80%              |
| **Net Burn/mo**      | Rs -3.25L     | Rs +10L           | Rs +60L          |
| **Break-even**       | —             | Month 14          | —                |

---

# 5. User Personas

## Persona 1: Vikram — The Grassroots Footballer

| Attribute            | Detail                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Age**              | 17                                                                                                                                                                                                                                                                                                                                                                         |
| **Location**         | Bellary, Karnataka (Tier 3 city)                                                                                                                                                                                                                                                                                                                                           |
| **Sport**            | Football                                                                                                                                                                                                                                                                                                                                                                   |
| **Position**         | Striker                                                                                                                                                                                                                                                                                                                                                                    |
| **Role on Platform** | Athlete                                                                                                                                                                                                                                                                                                                                                                    |
| **Goals**            | Get scouted by ISL club; earn sports scholarship for college; prove himself beyond local tournaments                                                                                                                                                                                                                                                                       |
| **Behavior**         | Trains 4 hours daily at local academy; records training videos on phone; shares clips on Instagram Stories (gets 50 views); plays in district-level tournaments                                                                                                                                                                                                            |
| **Pain Points**      | No scouts visit Bellary; can't afford to travel to Mumbai/Bangalore for trials (Rs 15K+); local coach doesn't have connections; his Instagram has 200 followers — scouts will never find him                                                                                                                                                                               |
| **Devices**          | Redmi Note 11 (mid-range Android), 4G connection (intermittent)                                                                                                                                                                                                                                                                                                            |
| **Platform Journey** | Coach tells team about OnlyKrida → Signs up as athlete → Adds football/striker → Uploads 3 training clips → Takes beep test (scores "Rising" zone) → Coach verifies → Gets profile coaching from AI ("Add match highlights to improve visibility") → Uploads match goal compilation → Scout from Bengaluru FC shortlists him → Scout messages him → Gets invited to trials |
| **Key Metric**       | Time from signup to first scout interaction                                                                                                                                                                                                                                                                                                                                |

## Persona 2: Ananya — The College Sprinter

| Attribute            | Detail                                                                                                                                                                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Age**              | 20                                                                                                                                                                                                                                                                                                                                         |
| **Location**         | Pune, Maharashtra                                                                                                                                                                                                                                                                                                                          |
| **Sport**            | Track & Field                                                                                                                                                                                                                                                                                                                              |
| **Position**         | 100m / 200m Sprinter                                                                                                                                                                                                                                                                                                                       |
| **Role on Platform** | Athlete                                                                                                                                                                                                                                                                                                                                    |
| **Goals**            | National-level recognition; sports scholarship for Master's program; build a verified digital sports portfolio                                                                                                                                                                                                                             |
| **Behavior**         | University athletics team captain; competes in inter-university meets; has coach who tracks her times; active on Instagram (2K followers); posts training reels                                                                                                                                                                            |
| **Pain Points**      | University meets don't get media coverage; her 11.8s 100m time is competitive but nobody outside Pune knows; scholarship applications require "proof" she can't easily provide; no way to compare her stats nationally                                                                                                                     |
| **Platform Journey** | Finds OnlyKrida through college sports WhatsApp group → Signs up → Adds sprint times, competition results → Takes 20m and 40m sprint tests (scores "Strong") → Coach verifies → AI generates profile summary → Posts training reel (gets 500 views from scouts) → 2 scholarships match her profile in Opportunities → Applies with one tap |
| **Key Metric**       | Scholarship applications submitted, profile strength score                                                                                                                                                                                                                                                                                 |

## Persona 3: Rajesh — The Independent Scout

| Attribute            | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Age**              | 38                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Location**         | Mumbai, Maharashtra                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Sport**            | Football (ISL focus)                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Role on Platform** | Scout                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Goals**            | Find hidden gems before competing scouts; reduce travel costs; build a reputation as a top-tier scout; provide verified reports to clubs                                                                                                                                                                                                                                                                                                          |
| **Behavior**         | Freelance scout for 2 ISL clubs; travels 15 days/month across India; uses Excel to track athletes; relies on personal network of 50 coaches; attends 30+ tournaments/year                                                                                                                                                                                                                                                                         |
| **Pain Points**      | Travel costs Rs 2L/month but only 2-3 signings/year; misses talent in regions he can't visit; no standardized data — every coach rates differently; spends 3 hours/day on phone calls gathering leads; competitor scouts have the same network                                                                                                                                                                                                    |
| **Platform Journey** | Colleague recommends OnlyKrida → Signs up as scout → Sets preferences: football, striker/midfielder, Maharashtra/Karnataka/Goa, weights: speed 40%, skill 30%, stamina 20%, position 10% → Gets AI recommendations with fit scores → Browses top 20 athletes → Shortlists 5 → Views their verified beep test data and highlight videos → Messages top 3 → Arranges video call → Invites 1 to club trial → Signing happens → Upgrades to Scout Pro |
| **Key Metric**       | Successful signings via platform, cost savings vs. traditional scouting                                                                                                                                                                                                                                                                                                                                                                           |

## Persona 4: Priya — The Academy Coach

| Attribute            | Detail                                                                                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Age**              | 32                                                                                                                                                                                                                                                                                                            |
| **Location**         | Chennai, Tamil Nadu                                                                                                                                                                                                                                                                                           |
| **Sport**            | Badminton                                                                                                                                                                                                                                                                                                     |
| **Role on Platform** | Coach                                                                                                                                                                                                                                                                                                         |
| **Goals**            | Develop athletes systematically using data; attract talented athletes to her academy; get her athletes scouted for national team; build professional credibility                                                                                                                                              |
| **Behavior**         | Runs a badminton academy with 40 students; tracks progress manually in notebooks; has WhatsApp group for each batch; posts student achievements on her Facebook page                                                                                                                                          |
| **Pain Points**      | Manual progress tracking is tedious and unreliable; can't benchmark her students against national standards; her best students leave for bigger academies in Delhi; no way to prove her coaching quality to attract talent                                                                                    |
| **Platform Journey** | Searches for "sports coaching platform India" → Finds OnlyKrida → Signs up as coach → Invites 40 athletes to join → Conducts beep tests through the app → Verifies student fitness results → Posts training content → Her students get discovered by scouts → Academy reputation grows → More students enroll |
| **Key Metric**       | Athletes coached, fitness tests verified, athlete outcomes (scouted, signed)                                                                                                                                                                                                                                  |

## Persona 5: Mumbai FC — The Football Club

| Attribute            | Detail                                                                                                                                                                                                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Age (org)**        | Founded 2015                                                                                                                                                                                                                                                                                                                             |
| **Location**         | Mumbai, Maharashtra                                                                                                                                                                                                                                                                                                                      |
| **Sport**            | Football (I-League 2nd Division)                                                                                                                                                                                                                                                                                                         |
| **Role on Platform** | Team                                                                                                                                                                                                                                                                                                                                     |
| **Goals**            | Cost-effective recruitment for upcoming season; find talent beyond Mumbai; fill 5 open roster positions; promote pre-season trials                                                                                                                                                                                                       |
| **Behavior**         | Currently recruit through 2 scouts + word-of-mouth; post trials on club website (gets 50 applicants); budget-constrained (Tier 2 club); need to compete with ISL academy feeder system                                                                                                                                                   |
| **Pain Points**      | Limited recruitment reach (only Mumbai/Thane); hired 3 players last season who didn't match expectations (no verified data); trial postings get limited visibility; application management via email is chaotic                                                                                                                          |
| **Platform Journey** | Sports federation email mentions OnlyKrida → Team manager signs up → Creates team profile → Posts 3 open positions as opportunities → Gets 200 applications from across India (vs. 50 before) → Uses AI screening to rank applicants → Reviews top 20 verified profiles → Invites 10 for trials → Signs 5 players → Upgrades to Team Pro |
| **Key Metric**       | Applications received, positions filled, recruit quality (verified data), cost per hire                                                                                                                                                                                                                                                  |

## Persona 6: Arjun — The Sports Fan

| Attribute            | Detail                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Age**              | 24                                                                                                                                                                                                                                                                                                                                            |
| **Location**         | Bangalore, Karnataka                                                                                                                                                                                                                                                                                                                          |
| **Sport**            | Multi-sport enthusiast (cricket, football, kabaddi)                                                                                                                                                                                                                                                                                           |
| **Role on Platform** | Fan                                                                                                                                                                                                                                                                                                                                           |
| **Goals**            | Discover rising athletes early; follow sports journeys; engage with sports content; support local athletes                                                                                                                                                                                                                                    |
| **Behavior**         | Watches ISL, IPL, Pro Kabaddi religiously; follows sports pages on Instagram; plays weekend football; always curious about "the next big thing"                                                                                                                                                                                               |
| **Pain Points**      | Only hears about athletes after they make it big; no platform for grassroots sports content; Instagram algorithm buries small athletes' content; wants to feel connected to the sports community                                                                                                                                              |
| **Platform Journey** | Friend shares an athlete's OnlyKrida highlight reel → Downloads app → Signs up as fan → Browses trending athletes → Follows 10 local footballers → Engages with content (likes, comments) → Discovers a 16-year-old kabaddi player from Bihar → Shares profile → Athlete goes viral on the platform → Arjun feels part of the discovery story |
| **Key Metric**       | Athletes followed, content engagement, session duration, shares                                                                                                                                                                                                                                                                               |

---

# 6. Business Requirements

## 6.1 Functional Requirements

| ID     | Requirement                                                                                  | Priority | Status  | Category      |
| ------ | -------------------------------------------------------------------------------------------- | -------- | ------- | ------------- |
| FR-001 | Users can sign up with email/password and select from 9 roles                                | P0       | Done    | Auth          |
| FR-002 | Role-specific signup forms collect relevant data (sport, position, organization, etc.)       | P0       | Done    | Auth          |
| FR-003 | Users can log in with existing credentials                                                   | P0       | Done    | Auth          |
| FR-004 | Session persistence across app restarts                                                      | P0       | Done    | Auth          |
| FR-005 | Password reset via email                                                                     | P1       | Planned | Auth          |
| FR-006 | OAuth login (Google, Apple)                                                                  | P2       | Planned | Auth          |
| FR-007 | OTP-based phone authentication                                                               | P2       | Planned | Auth          |
| FR-008 | Users can create and edit their profile (name, bio, avatar, cover photo)                     | P0       | Done    | Profile       |
| FR-009 | Athletes can add sport, position, height, weight, achievements, stats                        | P0       | Done    | Profile       |
| FR-010 | Profile strength indicator shows completion percentage                                       | P0       | Done    | Profile       |
| FR-011 | Verification badge system (4 tiers)                                                          | P1       | Partial | Profile       |
| FR-012 | Profile viewers tracking ("Who viewed your profile")                                         | P0       | Done    | Profile       |
| FR-013 | Users can create posts with images or videos                                                 | P0       | Done    | Content       |
| FR-014 | Posts support 4 types: highlight, training, match, achievement                               | P0       | Done    | Content       |
| FR-015 | Users can like, comment, and share posts                                                     | P0       | Done    | Content       |
| FR-016 | Feed displays posts in reverse chronological order with real-time updates                    | P0       | Done    | Content       |
| FR-017 | Infinite scroll pagination on feed                                                           | P0       | Done    | Content       |
| FR-018 | Edit and delete own posts                                                                    | P0       | Done    | Content       |
| FR-019 | Discover page with search and filters (sport, role, location, verified)                      | P0       | Done    | Discovery     |
| FR-020 | Trending athletes section                                                                    | P0       | Done    | Discovery     |
| FR-021 | Trigram fuzzy text search on names and locations                                             | P0       | Done    | Discovery     |
| FR-022 | Role-based discovery tabs                                                                    | P0       | Done    | Discovery     |
| FR-023 | 1-on-1 real-time messaging                                                                   | P0       | Done    | Messaging     |
| FR-024 | Group messaging (create, add members)                                                        | P0       | Done    | Messaging     |
| FR-025 | Media sharing in messages                                                                    | P0       | Done    | Messaging     |
| FR-026 | Post sharing via DM                                                                          | P0       | Done    | Messaging     |
| FR-027 | Message read receipts (sent/delivered/read)                                                  | P0       | Done    | Messaging     |
| FR-028 | Unread message count badges                                                                  | P0       | Done    | Messaging     |
| FR-029 | In-app notification center                                                                   | P0       | Done    | Notifications |
| FR-030 | Real-time notification delivery                                                              | P0       | Done    | Notifications |
| FR-031 | 11 notification types (like, follow, comment, message, opportunity, etc.)                    | P0       | Done    | Notifications |
| FR-032 | Mark notifications as read/unread                                                            | P0       | Done    | Notifications |
| FR-033 | Push notifications to device                                                                 | P1       | Partial | Notifications |
| FR-034 | Teams can create opportunities (tryouts, tournaments, scholarships, sponsorships, contracts) | P0       | Done    | Opportunities |
| FR-035 | Athletes can browse and filter opportunities                                                 | P0       | Done    | Opportunities |
| FR-036 | Athletes can apply with cover letter                                                         | P0       | Done    | Opportunities |
| FR-037 | Application status tracking (pending/accepted/rejected)                                      | P0       | Done    | Opportunities |
| FR-038 | Team-side application management                                                             | P0       | Done    | Opportunities |
| FR-039 | Scouts can set preferences (sport, positions, weights)                                       | P0       | Done    | Scouting      |
| FR-040 | AI-powered athlete recommendations with fit scores (0-100)                                   | P0       | Done    | Scouting      |
| FR-041 | Shortlisting athletes                                                                        | P0       | Done    | Scouting      |
| FR-042 | AI profile coaching suggestions                                                              | P0       | Done    | AI            |
| FR-043 | AI-generated athlete profile summaries                                                       | P0       | Done    | AI            |
| FR-044 | Krida AI chat assistant                                                                      | P0       | Done    | AI            |
| FR-045 | AI opportunity matching                                                                      | P0       | Done    | AI            |
| FR-046 | Yo-Yo IR1 beep test (live + manual modes)                                                    | P0       | Done    | Fitness       |
| FR-047 | Sprint tests (20m, 40m)                                                                      | P0       | Done    | Fitness       |
| FR-048 | Agility T-Test                                                                               | P0       | Done    | Fitness       |
| FR-049 | Vertical Jump test                                                                           | P0       | Done    | Fitness       |
| FR-050 | 6 growth-oriented zones (Starter to Unstoppable)                                             | P0       | Done    | Fitness       |
| FR-051 | Coach verification of test results                                                           | P0       | Done    | Fitness       |
| FR-052 | Test history and progress tracking                                                           | P0       | Done    | Fitness       |
| FR-053 | Follow/unfollow users                                                                        | P0       | Done    | Social        |
| FR-054 | Followers/following counts                                                                   | P0       | Done    | Social        |
| FR-055 | Settings (account, privacy, notifications)                                                   | P0       | Done    | Settings      |
| FR-056 | Account deletion                                                                             | P1       | Done    | Settings      |
| FR-057 | Admin dashboard (user management, moderation, analytics)                                     | P0       | Planned | Admin         |
| FR-058 | Content moderation system (reports, auto-detection)                                          | P1       | Planned | Admin         |
| FR-059 | Payment integration (Razorpay + Stripe)                                                      | P1       | Planned | Payments      |
| FR-060 | Subscription management                                                                      | P1       | Planned | Payments      |
| FR-061 | Video streaming optimization (HLS/adaptive bitrate)                                          | P2       | Planned | Media         |
| FR-062 | Video analysis (AI-powered technique review)                                                 | P3       | Planned | AI            |
| FR-063 | Live match streaming                                                                         | P3       | Planned | Media         |
| FR-064 | Event calendar (tryouts, tournaments)                                                        | P2       | Planned | Features      |
| FR-065 | Advanced analytics dashboard (for all roles)                                                 | P2       | Planned | Analytics     |

## 6.2 Non-Functional Requirements

| ID      | Requirement                    | Target                                  | Priority |
| ------- | ------------------------------ | --------------------------------------- | -------- |
| NFR-001 | App load time (cold start)     | < 3 seconds on mid-range Android        | P0       |
| NFR-002 | Feed scroll performance        | > 55 FPS on target devices              | P0       |
| NFR-003 | API response time (p95)        | < 500ms for reads, < 1s for writes      | P0       |
| NFR-004 | AI response time (p95)         | < 5s for Opus, < 2s for Sonnet          | P1       |
| NFR-005 | Concurrent users supported     | 10,000+ without degradation             | P1       |
| NFR-006 | Uptime SLA                     | 99.5% (Supabase Pro tier)               | P0       |
| NFR-007 | Data encryption at rest        | AES-256 (Supabase default)              | P0       |
| NFR-008 | Data encryption in transit     | TLS 1.3                                 | P0       |
| NFR-009 | RLS on all database tables     | 100% coverage                           | P0       |
| NFR-010 | Image upload size limit        | 2MB (avatars), 50MB (posts)             | P0       |
| NFR-011 | Video upload size limit        | 50MB (posts), expandable                | P0       |
| NFR-012 | Offline graceful degradation   | Show cached content, queue uploads      | P2       |
| NFR-013 | Accessibility (WCAG 2.1 AA)    | Color contrast, screen reader           | P2       |
| NFR-014 | DPDP Act (India) compliance    | Consent management, data portability    | P1       |
| NFR-015 | IT Act intermediary guidelines | Content moderation, grievance mechanism | P1       |
| NFR-016 | App size                       | < 50MB download                         | P1       |
| NFR-017 | Battery consumption            | < 5% per hour of active use             | P2       |
| NFR-018 | Cross-platform consistency     | iOS, Android, Web feature parity        | P1       |

---

# 7. Success Metrics

## 7.1 Acquisition Metrics

| Metric                         | Definition                         | Year 1 Target                                           | Year 2 Target  |
| ------------------------------ | ---------------------------------- | ------------------------------------------------------- | -------------- |
| **Total Signups**              | Users who complete registration    | 50,000                                                  | 250,000        |
| **Monthly Active Users (MAU)** | Unique users with 1+ session/month | 25,000                                                  | 150,000        |
| **Daily Active Users (DAU)**   | Unique users with 1+ session/day   | 5,000                                                   | 40,000         |
| **DAU/MAU Ratio**              | Stickiness indicator               | 20%                                                     | 27%            |
| **Signup Conversion**          | Welcome page → completed signup    | 40%                                                     | 50%            |
| **Role Distribution**          | Healthy mix of roles               | 80% athletes, 5% scouts, 5% coaches, 5% teams, 5% other | Maintain ratio |
| **Organic vs Paid Signups**    | Cost efficiency                    | 70% organic                                             | 60% organic    |
| **Referral Rate**              | Users who invite others            | 10%                                                     | 15%            |

## 7.2 Engagement Metrics

| Metric                            | Definition                           | Year 1 Target | Year 2 Target |
| --------------------------------- | ------------------------------------ | ------------- | ------------- |
| **Session Duration**              | Average time per session             | 8 minutes     | 12 minutes    |
| **Sessions/Day**                  | Sessions per DAU                     | 2             | 3             |
| **Posts Created/DAU**             | Content creation rate                | 0.3           | 0.5           |
| **Feed Engagement Rate**          | Likes + comments / impressions       | 5%            | 8%            |
| **Messages Sent/DAU**             | Communication activity               | 3             | 8             |
| **Profile Completion Rate**       | Users with 80%+ complete profiles    | 40%           | 60%           |
| **Fitness Tests Completed/Month** | Active testing engagement            | 2,000         | 15,000        |
| **AI Feature Usage/DAU**          | % of DAU using any AI feature        | 15%           | 25%           |
| **D1 Retention**                  | Users returning day after signup     | 40%           | 50%           |
| **D7 Retention**                  | Users returning 7 days after signup  | 20%           | 30%           |
| **D30 Retention**                 | Users returning 30 days after signup | 10%           | 18%           |

## 7.3 Matching / Discovery Metrics

| Metric                             | Definition                            | Year 1 Target | Year 2 Target |
| ---------------------------------- | ------------------------------------- | ------------- | ------------- |
| **Scout Searches/Day**             | Active scouting activity              | 200           | 2,000         |
| **Athletes Shortlisted/Scout**     | Shortlisting activity                 | 5/month       | 10/month      |
| **Scout→Athlete Messages**         | Discovery-driven conversations        | 500/month     | 5,000/month   |
| **Opportunity Applications**       | Athletes applying to opportunities    | 2,000/month   | 20,000/month  |
| **Application Response Rate**      | Teams responding to applications      | 60%           | 75%           |
| **Successful Matches**             | Athletes recruited via platform       | 50/year       | 500/year      |
| **AI Recommendation CTR**          | Scouts clicking on AI recommendations | 30%           | 40%           |
| **Fitness Test Verification Rate** | Tests verified by coach/center        | 20%           | 40%           |

## 7.4 Revenue Metrics

| Metric                                      | Definition                                  | Year 1 Target | Year 2 Target |
| ------------------------------------------- | ------------------------------------------- | ------------- | ------------- |
| **Monthly Recurring Revenue (MRR)**         | Subscription + recurring revenue            | Rs 6.75L      | Rs 35L        |
| **Annual Run Rate (ARR)**                   | MRR × 12                                    | Rs 81L        | Rs 4.2 Cr     |
| **Paying Customers**                        | Active subscriptions                        | 100           | 500           |
| **Average Revenue Per Paying User (ARPPU)** | MRR / paying customers                      | Rs 6,750      | Rs 7,000      |
| **Churn Rate (Monthly)**                    | Paying customers lost/month                 | 5%            | 3%            |
| **Net Revenue Retention**                   | Revenue from existing customers (expansion) | 100%          | 115%          |
| **LTV:CAC (Scouts)**                        | Lifetime value / acquisition cost           | 6x            | 10x           |
| **Gross Margin**                            | Revenue - direct costs                      | 85%           | 82%           |
| **Months to Break-even**                    | When revenue > burn                         | Month 18      | —             |

---

# 8. Risk Analysis

## 8.1 Market Risks

| Risk                                | Probability | Impact | Mitigation                                                                                                |
| ----------------------------------- | ----------- | ------ | --------------------------------------------------------------------------------------------------------- |
| **Slow adoption by athletes**       | Medium      | High   | Onboard via coaches (each brings 20-50 athletes); college partnerships for bulk signup                    |
| **Scouts don't see value**          | Medium      | High   | Free pilot for top scouts; prove ROI with case studies; AI recommendations are unique differentiator      |
| **Competitor enters Indian market** | Low (2yr)   | High   | First-mover advantage; build data moat with verified fitness tests; network effects compound              |
| **Cricket dominance**               | Low         | Medium | Start multi-sport from day 1; football and kabaddi growing fast; eventually add cricket-specific features |
| **Pay-to-play resistance**          | Low         | Medium | Free for athletes forever policy; transparency about pricing                                              |

## 8.2 Technical Risks

| Risk                               | Probability | Impact   | Mitigation                                                             |
| ---------------------------------- | ----------- | -------- | ---------------------------------------------------------------------- |
| **AI API key exposure**            | High        | Critical | Migrate to Supabase Edge Function proxy (P0 priority)                  |
| **Supabase scaling limits**        | Medium      | High     | Connection pooling, read replicas, query optimization, plan upgrades   |
| **Performance on low-end Android** | Medium      | High     | FlatList optimization, CachedImage migration, useReducer refactor      |
| **Claude API cost explosion**      | Medium      | High     | Response caching, per-user rate limits, cost monitoring                |
| **Data loss / breach**             | Low         | Critical | RLS on all tables, encrypted storage, regular backups, DPDP compliance |
| **App store rejection**            | Low         | Medium   | Content moderation system; comply with Apple/Google guidelines         |

## 8.3 Regulatory Risks

| Risk                                       | Probability | Impact | Mitigation                                                          |
| ------------------------------------------ | ----------- | ------ | ------------------------------------------------------------------- |
| **DPDP Act 2023 compliance**               | High        | High   | Implement consent management, data portability, deletion rights     |
| **IT Act intermediary guidelines**         | High        | High   | Content moderation, grievance officer appointment, 72-hour takedown |
| **Minor athlete data (under 18)**          | Medium      | High   | Parental consent flow, restricted data collection, enhanced privacy |
| **UAE data regulations (Dubai expansion)** | Medium      | Medium | Research PDPL compliance before expansion                           |

## 8.4 Business Risks

| Risk                          | Probability | Impact   | Mitigation                                                          |
| ----------------------------- | ----------- | -------- | ------------------------------------------------------------------- |
| **Cash runway exhaustion**    | Medium      | Critical | Control burn rate; milestone-based spending; revenue ASAP           |
| **Key person dependency**     | High        | High     | Document everything; hire early; build systems not dependencies     |
| **Monetization timing**       | Medium      | High     | Launch payments in Month 2; don't wait for scale to monetize        |
| **Brand reputation incident** | Low         | High     | Content moderation from Day 1; community guidelines; quick response |

---

_This BRD should be reviewed quarterly and updated based on user feedback, market conditions, and platform evolution._

---

**Document End — BRD v1.0**
