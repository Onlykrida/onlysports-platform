# OnlyKrida Website Redesign — Design Spec

**Inspired by:** 21TSI.com (Awwwards-winning sports industry site)
**Date:** 2026-04-14
**Goal:** Transform onlykrida.com from a text-heavy street-culture landing page into a cinematic, premium, scroll-driven experience with background music.

---

## Design Philosophy

**21TSI DNA adapted for OnlyKrida:**

- 21TSI sells sports products to consumers. OnlyKrida connects grassroots athletes to scouts.
- 21TSI is corporate-premium. OnlyKrida should be premium but emotionally raw — dusty grounds, real athletes, Indian sporting culture.
- Keep OnlyKrida's green (#30D158) as the accent, but shift the overall feel from "street poster" to "cinematic documentary."

## Tech Stack

- **HTML/CSS/JS** (keep it static, no framework — matches current setup)
- **GSAP + ScrollTrigger** for scroll-linked animations (pinned sections, parallax, text reveals)
- **Howler.js** for background music with SOUND toggle
- **No build step** — deploy direct to Vercel as static files

---

## Section-by-Section Flow

### S1: Preloader / Logo Reveal (0-2s)

- Full black screen
- "OnlyKrida" text animates in letter-by-letter (like 21TSI's "Tech21 Sport st Industries c.")
- Superscript styling: "Only**Krida**" with Krida in green (#30D158)
- Fades to hero after 2s
- Background music starts (muted by default, SOUND button in nav)

**21TSI reference:** Their opening logo text on black

### S2: Hero — Pinned Scroll Section

- **Background:** Full-bleed video or high-res photo of an Indian athlete (footballer on dusty ground, cricketer in nets, boxer in a cramped gym)
- **Scroll behavior:** Pinned section. As user scrolls:
  1. Image starts **blurred** (gaussian blur 20px)
  2. Text appears: "99% of Athletes Never Get Scouted"
  3. More scroll: blur reduces, text morphs to "**Because Nobody's Watching**"
  4. Final scroll: image fully sharp, text becomes "**Until Now.**" in bold
  5. Subtext fades in: "OnlyKrida — AI-powered talent discovery for every athlete in India"
  6. "DISCOVER" CTA with animated line appears at bottom
- **Nav appears** when hero text starts: ONLYKRIDA | FEATURES | FOR ATHLETES | FOR SCOUTS | CONTACT | SOUND

**21TSI reference:** Their hero with blur-to-sharp athlete + text morphing ("Everyone Hates Change But... They Line Up For A Revolution")

### S3: The Problem — Counter Animation

- Dark background
- Three large animated counters side by side:
  - **99%** — "of Indian athletes never get professionally scouted"
  - **50L+** — "athletes train daily with zero visibility"
  - **0** — "platforms built specifically for Indian grassroots sports"
- Numbers count up on scroll-into-view
- Thin divider lines between counters (like 21TSI's numbered tabs)
- Below: "We're changing that." in handwritten-style font

**21TSI reference:** Their Recognition section with 01 GLOBAL REVENUE / 02 CUSTOMER BASE / 03 BRAND RECOGNITION tabs

### S4: What We Do — Horizontal Scroll Feature Cards

- Keep the current drag-to-explore card layout but upgrade visually:
  - Cards have subtle glass-morphism effect
  - Each card has a cinematic background image (not just emoji)
  - Numbered: 01 AI SCOUTING, 02 FITNESS TESTING, 03 HIGHLIGHT REELS, 04 OPPORTUNITY BOARD, 05 DIRECT MESSAGING, 06 TEAM CONNECT
- Cards slide in from right on scroll
- Active card scales up slightly

**21TSI reference:** Their focus areas section (Sportware, Wearable Technology, AI Training, Virtual Coaching)

### S5: App Preview — Phone Mockup with Live Data

- Keep the current phone mockup concept but upgrade:
  - 3D perspective tilt on the phone frame
  - Screen shows actual app screenshots (not placeholder data)
  - Animated notifications sliding in: "Coach Ravi wants to connect", "92% AI Match — ISL Scout", "Dubai FC U-23 Trials"
  - Left side: feature bullets with icons
- Circular wireframe element behind the phone (21TSI sphere motif, adapted as a cricket/football ball wireframe)

**21TSI reference:** Their product sphere with measurement markers

### S6: For Athletes / For Scouts / For Coaches — Role Cards

- Three full-height sections, each pinned briefly on scroll
- Each section has:
  - Full-bleed athlete/scout photo on one side
  - Role description + CTA on the other
  - Color accent matches role (green for athletes, orange for scouts, cyan for coaches)
- Transition between sections: crossfade with parallax

**21TSI reference:** Their "Join The Team" section with full-bleed athlete imagery

### S7: Social Proof / Testimonials

- Horizontal scrolling ticker of early access signups or partner logos
- "500+ athletes on the waitlist" with animated counter
- If available: quote cards from beta users

### S8: CTA — Join the Movement

- Full-screen dark section
- Large text: "STOP DREAMING. START PLAYING."
- Email input + "GET EARLY ACCESS" button
- Below: "No spam, ever. Early access perks. Be the first to know."
- App store badges (placeholder) for upcoming launch

### S9: Footer

- Minimal footer matching 21TSI style
- ONLYKRIDA logo
- "Where Athletes Get Discovered" tagline
- Contact: hello@onlykrida.com
- Social links: Instagram, Twitter, Discord
- Legal: Privacy Policy | Terms of Service
- Copyright 2026

---

## Global Elements

### Navigation

- Fixed top nav, transparent on hero, solid dark on scroll
- Left: ONLYKRIDA logo
- Center: FEATURES | FOR ATHLETES | FOR SCOUTS
- Right: CONTACT (with red dot indicator) | SOUND toggle button
- Active section highlighted in nav on scroll

### Background Music

- Ambient motivational track (cinematic, no lyrics — think documentary score)
- **Muted by default** (autoplay restrictions)
- SOUND button in nav toggles on/off
- Volume fades in/out smoothly
- Music file: keep it small (<1MB, loop a 30s clip)
- Implementation: Howler.js

### Scroll Progress

- Thin green (#30D158) progress bar at very top of viewport
- Shows scroll position through entire page

### Cursor (optional, desktop only)

- Custom cursor dot + ring (keep from current site, it works well)
- Magnetic effect on buttons

### Typography

- **Headlines:** Bebas Neue (keep) — but use it more sparingly, larger sizes
- **Body:** Inter 300/400 — lighter weight for premium feel
- **Accent:** Caveat for handwritten annotations (keep, use sparingly)

### Colors

- **Background:** #0a0a0a (keep dark theme)
- **Primary text:** #ffffff
- **Secondary text:** #888888
- **Accent green:** #30D158 (OnlyKrida brand)
- **Accent orange:** #FF9F0A (scout role)
- **Accent cyan:** #64D2FF (coach role)
- **Hero overlay:** warm coral/amber tint on athlete photos (inspired by 21TSI's red-toned hero)

---

## Key Differences from Current Site

| Current                                         | Redesign                                 |
| ----------------------------------------------- | ---------------------------------------- |
| Emoji-heavy (sport icons everywhere)            | Cinematic photography                    |
| Dense marquee text scrolling                    | Clean whitespace, pinned scroll sections |
| Paint splatters, noise overlay                  | Subtle wireframe geometric elements      |
| Sticker-style badges (EST. 2026, MADE IN INDIA) | Elegant small-caps labels                |
| Floating sport names background                 | Removed — let photography speak          |
| 6+ scroll marquee rows                          | 1 subtle ticker at most                  |
| Street-culture energy                           | Premium documentary energy               |

## What to Keep

- Dark theme (#0a0a0a)
- Green accent (#30D158)
- Custom cursor + magnetic buttons
- Scroll progress bar
- Email waitlist CTA
- Bebas Neue + Inter fonts
- Mobile responsive design

## Assets Needed

1. **Hero photo/video** — Indian athlete(s) in action. Options:
   - Footballer on dusty maidaan
   - Cricketer in street nets
   - Boxer in a small gym
   - Multiple athletes montage
2. **Role section photos** — One for each role (athlete, scout, coach)
3. **App screenshots** — Real screenshots from the OnlyKrida app
4. **Background music** — 30s ambient/cinematic loop (royalty-free)
5. **Wireframe element** — SVG circle/sphere with measurement markers (inspired by 21TSI)

## Dependencies

- GSAP (gsap.min.js + ScrollTrigger.min.js) — ~45KB gzipped
- Howler.js — ~10KB gzipped
- No other dependencies

---

## Implementation Order

1. **Phase 1:** Structure + scroll animations (GSAP/ScrollTrigger setup, pinned hero, counter animations)
2. **Phase 2:** Photography + visuals (source/create athlete imagery, app screenshots)
3. **Phase 3:** Music integration (Howler.js, SOUND toggle)
4. **Phase 4:** Polish (cursor effects, mobile responsive, performance optimization)
5. **Phase 5:** Deploy + test

---

## Reference

- 21TSI.com — primary inspiration (Awwwards winner, built by Department Maison de Creation)
- Screenshots captured 2026-04-14 from live site
