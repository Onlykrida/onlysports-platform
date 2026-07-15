#!/usr/bin/env python3
"""
OnlyKrida — End-to-End Investor Pitch Deck Generator (PDF + HTML)

Outputs at repo root:
  - OnlyKrida_Pitch_Deck.html   (live deck, opens in any browser)
  - OnlyKrida_Pitch_Deck.pdf    (investor-ready, 16:9, vector)

Pipeline: build self-contained HTML -> render to PDF via headless Chrome.
No external Python dependencies. macOS Chrome path is used; Playwright is
attempted as a fallback if Chrome is missing.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML_OUT = ROOT / "OnlyKrida_Pitch_Deck.html"
PDF_OUT = ROOT / "OnlyKrida_Pitch_Deck.pdf"

# ---------------------------------------------------------------------------
# Design tokens — lifted from constants/theme.ts
# ---------------------------------------------------------------------------
TOKENS = {
    "bg": "#0a0a0a",
    "bg_grad_top": "#0a1a0a",
    "card": "#141414",
    "surface": "#1e1e1e",
    "border": "#2a2a2a",
    "text": "#f0f0f0",
    "text_2": "#C7C7CC",
    "muted": "#888888",
    "athlete": "#30D158",
    "scout": "#FF9F0A",
    "coach": "#64D2FF",
    "team": "#FF453A",
    "fan": "#BF5AF2",
    "brand": "#FF9F0A",
    "primary_dark": "#248A3D",
    "primary_glow": "rgba(48,209,88,0.18)",
    "scout_glow": "rgba(255,159,10,0.18)",
}

CSS = r"""
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  background: #0a0a0a;
  color: #f0f0f0;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
               "Segoe UI", Inter, system-ui, sans-serif;
  font-feature-settings: "ss01", "cv11";
  -webkit-font-smoothing: antialiased;
}
@page { size: 1920px 1080px; margin: 0; }
.slide {
  width: 1920px; height: 1080px;
  padding: 96px 120px;
  position: relative;
  overflow: hidden;
  display: flex; flex-direction: column;
  page-break-after: always;
  background: radial-gradient(ellipse at 0% 0%, #0a1a0a 0%, #0a0a0a 60%);
}
.slide:last-child { page-break-after: auto; }

/* corner brand */
.brand-mark {
  position: absolute; top: 60px; right: 120px;
  font-size: 18px; font-weight: 800; letter-spacing: 4px;
  color: #30D158;
}
.slide-num {
  position: absolute; bottom: 60px; right: 120px;
  font-size: 16px; color: #555; letter-spacing: 2px;
}
.slide-tag {
  position: absolute; bottom: 60px; left: 120px;
  font-size: 16px; color: #555; letter-spacing: 4px; text-transform: uppercase;
}

/* typographic scale */
.eyebrow {
  display: inline-block;
  font-size: 18px; letter-spacing: 5px; text-transform: uppercase;
  color: #30D158; font-weight: 700; margin-bottom: 28px;
}
h1.hero {
  font-size: 168px; font-weight: 900; letter-spacing: -4px;
  line-height: 0.95; background: linear-gradient(135deg, #30D158, #64D2FF);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
h1 {
  font-size: 96px; font-weight: 900; letter-spacing: -2.5px; line-height: 1.0;
}
h2 {
  font-size: 72px; font-weight: 800; letter-spacing: -1.5px; line-height: 1.05;
  margin-bottom: 32px;
}
h3 { font-size: 44px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.1; }
.lede { font-size: 36px; line-height: 1.35; color: #C7C7CC; max-width: 1400px; }
.tagline { font-size: 28px; color: #888; letter-spacing: 1px; }

.row { display: flex; gap: 32px; }
.col { display: flex; flex-direction: column; gap: 24px; }
.grow { flex: 1; }
.spacer { flex: 1; }

/* cards */
.card {
  background: linear-gradient(180deg, #141414 0%, #0e0e0e 100%);
  border: 1px solid #2a2a2a;
  border-radius: 24px;
  padding: 40px;
  position: relative;
}
.card.athlete { border-color: rgba(48,209,88,0.45); box-shadow: 0 0 40px rgba(48,209,88,0.10); }
.card.scout   { border-color: rgba(255,159,10,0.45); box-shadow: 0 0 40px rgba(255,159,10,0.10); }
.card.coach   { border-color: rgba(100,210,255,0.45); }
.card.team    { border-color: rgba(255,69,58,0.45); }
.card.fan     { border-color: rgba(191,90,242,0.45); }
.card .stat {
  font-size: 88px; font-weight: 900; letter-spacing: -2px;
  background: linear-gradient(135deg, #30D158, #64D2FF);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  line-height: 1;
}
.card .stat.scout { background: linear-gradient(135deg, #FF9F0A, #FF453A); -webkit-background-clip: text; background-clip: text; color: transparent; }
.card .stat.team  { background: linear-gradient(135deg, #FF453A, #FF9F0A); -webkit-background-clip: text; background-clip: text; color: transparent; }
.card .stat.coach { background: linear-gradient(135deg, #64D2FF, #0A84FF); -webkit-background-clip: text; background-clip: text; color: transparent; }
.card .stat.fan   { background: linear-gradient(135deg, #BF5AF2, #FF9F0A); -webkit-background-clip: text; background-clip: text; color: transparent; }
.card .label { font-size: 22px; color: #C7C7CC; line-height: 1.35; margin-top: 16px; }
.card .label strong { color: #f0f0f0; }
.card .kicker {
  font-size: 14px; letter-spacing: 3px; text-transform: uppercase;
  color: #888; font-weight: 700; margin-bottom: 12px;
}

/* tables */
table.k {
  width: 100%; border-collapse: collapse; font-size: 22px;
}
table.k th, table.k td {
  padding: 22px 24px; text-align: left;
  border-bottom: 1px solid #2a2a2a;
}
table.k th {
  font-size: 16px; letter-spacing: 2px; text-transform: uppercase;
  color: #888; font-weight: 700;
}
table.k td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 700; }
table.k tr:last-child td { border-bottom: none; }
table.k tr.hl td { color: #30D158; font-weight: 700; }

/* lists */
ul.bullets { list-style: none; }
ul.bullets li {
  font-size: 26px; color: #C7C7CC; line-height: 1.5;
  padding-left: 36px; position: relative; margin-bottom: 18px;
}
ul.bullets li::before {
  content: "■"; position: absolute; left: 0; top: 4px;
  color: #30D158; font-size: 20px;
}
ul.bullets li.scout::before { color: #FF9F0A; }
ul.bullets li.coach::before { color: #64D2FF; }
ul.bullets li.team::before  { color: #FF453A; }
ul.bullets li.fan::before   { color: #BF5AF2; }

/* tag pill */
.pill {
  display: inline-block; padding: 8px 16px;
  font-size: 16px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
  border-radius: 999px; border: 1px solid currentColor;
}
.pill.green { color: #30D158; }
.pill.orange { color: #FF9F0A; }
.pill.cyan { color: #64D2FF; }
.pill.red { color: #FF453A; }
.pill.purple { color: #BF5AF2; }
.pill.muted { color: #888; }

/* 2x2 grid for positioning */
.grid-2x2 {
  position: relative; width: 1200px; height: 720px;
  margin: 32px auto 0 auto;
  border-left: 2px solid #2a2a2a; border-bottom: 2px solid #2a2a2a;
}
.grid-2x2::before {
  content: ""; position: absolute; left: 0; top: 50%; right: 0; height: 1px;
  background: #1e1e1e;
}
.grid-2x2::after {
  content: ""; position: absolute; top: 0; bottom: 0; left: 50%; width: 1px;
  background: #1e1e1e;
}
.axis-x { position: absolute; bottom: -56px; left: 0; right: 0; text-align: center; font-size: 18px; color: #888; letter-spacing: 3px; text-transform: uppercase; }
.axis-y { position: absolute; left: -56px; top: 0; bottom: 0; writing-mode: vertical-rl; transform: rotate(180deg); text-align: center; font-size: 18px; color: #888; letter-spacing: 3px; text-transform: uppercase; display: flex; align-items: center; justify-content: center; }
.dot {
  position: absolute; transform: translate(-50%, -50%);
  background: #1e1e1e; border: 2px solid #2a2a2a;
  border-radius: 18px; padding: 14px 20px;
  font-size: 18px; font-weight: 700; letter-spacing: 0.5px;
  white-space: nowrap;
}
.dot.us {
  background: linear-gradient(135deg, #30D158, #64D2FF);
  color: #0a0a0a; border-color: #30D158;
  box-shadow: 0 0 60px rgba(48,209,88,0.5);
  font-size: 22px;
}

/* flywheel */
.flywheel {
  width: 700px; height: 700px; margin: 0 auto;
  position: relative;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(48,209,88,0.10) 0%, transparent 60%);
}
.flywheel .node {
  position: absolute; transform: translate(-50%, -50%);
  width: 180px; height: 180px; border-radius: 50%;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  font-weight: 800; font-size: 22px;
  border: 2px solid;
  background: #141414;
}
.flywheel .node small { font-size: 13px; font-weight: 600; color: #888; letter-spacing: 1px; margin-top: 4px; text-transform: uppercase; }

/* tier strip */
.tier-strip { display: flex; gap: 16px; margin-top: 24px; }
.tier {
  flex: 1; padding: 28px 24px; border-radius: 18px;
  background: #141414; border: 1px solid #2a2a2a;
  text-align: center;
}
.tier .mult { font-size: 56px; font-weight: 900; letter-spacing: -1.5px; }
.tier .name { font-size: 18px; color: #C7C7CC; margin-top: 8px; letter-spacing: 1px; text-transform: uppercase; }
.tier .desc { font-size: 14px; color: #888; margin-top: 6px; line-height: 1.4; }
.tier:nth-child(1) .mult { color: #888; }
.tier:nth-child(2) .mult { color: #64D2FF; }
.tier:nth-child(3) .mult { color: #30D158; }
.tier:nth-child(4) .mult { color: #FF9F0A; }

/* zone bar */
.zones { display: flex; gap: 8px; margin-top: 32px; }
.zone {
  flex: 1; padding: 22px 12px; border-radius: 12px; text-align: center;
  font-weight: 800; font-size: 18px; letter-spacing: 1px;
  background: #141414; border: 1px solid #2a2a2a; color: #C7C7CC;
}
.zone:nth-child(1) { color: #888; }
.zone:nth-child(2) { color: #64D2FF; border-color: rgba(100,210,255,0.3); }
.zone:nth-child(3) { color: #30D158; border-color: rgba(48,209,88,0.3); }
.zone:nth-child(4) { color: #30D158; border-color: rgba(48,209,88,0.6); background: rgba(48,209,88,0.05); }
.zone:nth-child(5) { color: #FF9F0A; border-color: rgba(255,159,10,0.5); background: rgba(255,159,10,0.05); }
.zone:nth-child(6) {
  color: #0a0a0a; background: linear-gradient(135deg, #FF9F0A, #FF453A); border-color: transparent;
}

/* big number block */
.bignum {
  font-size: 192px; font-weight: 900; letter-spacing: -6px; line-height: 0.9;
  background: linear-gradient(135deg, #30D158, #64D2FF);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.bignum.scout { background: linear-gradient(135deg, #FF9F0A, #FF453A); -webkit-background-clip: text; background-clip: text; color: transparent; }

/* ground/coach chips */
.chips { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
.chip {
  padding: 10px 18px; border-radius: 999px;
  background: #141414; border: 1px solid #2a2a2a;
  font-size: 18px; color: #C7C7CC;
}
.chip.green { color: #30D158; border-color: rgba(48,209,88,0.4); }
.chip.orange { color: #FF9F0A; border-color: rgba(255,159,10,0.4); }

/* timeline */
.timeline { display: flex; gap: 24px; margin-top: 32px; }
.phase {
  flex: 1; padding: 32px; border-radius: 20px;
  background: #141414; border-top: 4px solid;
}
.phase h4 {
  font-size: 14px; letter-spacing: 3px; text-transform: uppercase;
  color: #888; margin-bottom: 12px; font-weight: 700;
}
.phase h3 { font-size: 28px; margin-bottom: 16px; }
.phase ul { list-style: none; }
.phase ul li { font-size: 18px; color: #C7C7CC; padding: 6px 0; line-height: 1.4; }
.phase ul li::before { content: "› "; color: #30D158; font-weight: 700; }

/* allocation bar */
.alloc { display: flex; height: 64px; border-radius: 16px; overflow: hidden; margin-top: 24px; }
.alloc div {
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 18px; color: #0a0a0a;
}

/* hyderabad test box */
.htest {
  margin-top: 36px; padding: 32px 40px;
  background: rgba(48,209,88,0.06); border: 2px solid rgba(48,209,88,0.4);
  border-radius: 20px;
}
.htest .kicker { color: #30D158; }
.htest p { font-size: 28px; line-height: 1.4; color: #f0f0f0; font-weight: 600; }
"""


# ---------------------------------------------------------------------------
# Slide builders
# ---------------------------------------------------------------------------

def slide(num: int, total: int, tag: str, body: str, *, brand: bool = True) -> str:
    brand_html = '<div class="brand-mark">ONLYKRIDA</div>' if brand else ""
    return f"""
<section class="slide">
  {brand_html}
  <div class="slide-tag">{tag}</div>
  {body}
  <div class="slide-num">{num:02d} / {total:02d}</div>
</section>
"""


def s_cover(n, t):
    body = """
  <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
    <div class="eyebrow">May 2026 · Investor Deck</div>
    <h1 class="hero" style="font-size:240px;">OnlyKrida</h1>
    <div style="margin-top:24px; font-size:48px; font-weight:600; color:#f0f0f0; line-height:1.15; max-width:1400px;">
      India&rsquo;s first sports talent discovery platform.
    </div>
    <div class="tagline" style="margin-top:32px;">Every scout sees every athlete. Powered by Claude AI.</div>
    <div style="margin-top:120px; display:flex; gap:32px; align-items:center;">
      <div style="width:6px; height:80px; background:linear-gradient(180deg,#30D158,#FF9F0A);"></div>
      <div>
        <div style="font-size:28px; font-weight:800;">Anirudh</div>
        <div style="font-size:20px; color:#888; margin-top:4px;">Founder &middot; Hyderabad &middot; tanirudh127@gmail.com</div>
      </div>
    </div>
  </div>
"""
    return slide(n, t, "cover", body)


def s_hook(n, t):
    body = """
  <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
    <div class="eyebrow" style="color:#FF9F0A;">The Problem in One Line</div>
    <div style="font-size:160px; font-weight:900; line-height:1.0; letter-spacing:-3px;">
      <span style="color:#FF453A;">99%</span> of Indian athletes
    </div>
    <div style="font-size:160px; font-weight:900; line-height:1.0; letter-spacing:-3px; color:#f0f0f0;">
      never get scouted.
    </div>
    <div style="margin-top:56px; font-size:40px; color:#C7C7CC; max-width:1500px; line-height:1.35;">
      Not because they lack talent &mdash; <strong style="color:#f0f0f0;">because they're invisible.</strong>
      Geography and nepotism gate Indian sports. We remove the gate.
    </div>
  </div>
"""
    return slide(n, t, "the hook", body)


def s_problem(n, t):
    body = """
  <h2>Indian sports scouting is broken.</h2>
  <p class="lede">Talent in Tier-2 and Tier-3 cities is invisible to scouts in metros. Recruitment runs on WhatsApp groups, paper records, and personal connections.</p>
  <div class="row" style="margin-top:64px; gap:28px;">
    <div class="card grow team">
      <div class="kicker">Participation</div>
      <div class="stat team">400M+</div>
      <div class="label">Indians play sport regularly. <strong>&lt;1%</strong> are professionally scouted.</div>
    </div>
    <div class="card grow scout">
      <div class="kicker">Geography Gap</div>
      <div class="stat scout">70%</div>
      <div class="label">of talent lives in Tier-2/3 cities &mdash; where scouts <strong>never travel</strong>.</div>
    </div>
    <div class="card grow">
      <div class="kicker">Scholarship Waste</div>
      <div class="stat">30%+</div>
      <div class="label">of annual sports scholarships go <strong>unfilled</strong> because the right athletes can't be found.</div>
    </div>
    <div class="card grow team">
      <div class="kicker">Scout Inefficiency</div>
      <div class="stat team">90%</div>
      <div class="label">of physical scout trips yield <strong>zero signings</strong>. Scouts spend 80% of time on logistics.</div>
    </div>
  </div>
  <div class="htest">
    <div class="kicker">Founder lens &mdash; the Hyderabad Test</div>
    <p>"A talented kid in Hyderabad will never be seen by a scout in Mumbai unless they have connections. OnlyKrida removes the gate."</p>
  </div>
"""
    return slide(n, t, "problem", body)


def s_why_now(n, t):
    body = """
  <h2>Why now &mdash; three tailwinds aligning.</h2>
  <p class="lede">2026 is the inflection point. Regulation, market growth, and league digitization converge on a discovery layer that doesn't exist yet.</p>
  <div class="row" style="margin-top:64px; gap:28px;">
    <div class="card grow coach">
      <div class="kicker" style="color:#64D2FF;">Tailwind 1 &middot; Regulation</div>
      <h3 style="margin-top:12px;">DPDP Act 2027</h3>
      <div class="label">India&rsquo;s data protection law lands <strong style="color:#64D2FF;">13 May 2027</strong>. Under-18 platforms must implement verifiable parental consent (Aadhaar offline-XML, DigiLocker). 13-month build window. <strong>OnlyKrida is building it now</strong> &mdash; first-mover compliance moat.</div>
    </div>
    <div class="card grow athlete">
      <div class="kicker" style="color:#30D158;">Tailwind 2 &middot; Market</div>
      <h3 style="margin-top:12px;">Sports-tech 2&times; in 5 years</h3>
      <div class="label">Indian sports-tech market: <strong style="color:#30D158;">&#8377;26,700 Cr (FY24) &rarr; &#8377;49,500 Cr (FY29)</strong>. 85% growth. IPL ecosystem $16B. Khelo India budget &#8377;1,756 Cr. Sports = commerce, finally.</div>
    </div>
    <div class="card grow scout">
      <div class="kicker" style="color:#FF9F0A;">Tailwind 3 &middot; Leagues</div>
      <h3 style="margin-top:12px;">PKL + AIFF digitizing</h3>
      <div class="label">Pro Kabaddi Season 12: <strong style="color:#FF9F0A;">&#8377;1Cr+ player auctions</strong>. AIFF&rsquo;s Blue Cubs grassroots push. Hyderabad FC&rsquo;s relocation to Delhi (Oct 2025) created a vacuum. <strong>Zero digital discovery layer exists.</strong></div>
    </div>
  </div>
"""
    return slide(n, t, "why now", body)


def s_solution(n, t):
    body = """
  <h2>One marketplace. Six sides. Every gate removed.</h2>
  <p class="lede">Athletes build a digital portfolio for free, forever. Scouts, coaches, teams, and brands subscribe to discover them. AI matches both sides. Verified fitness data settles trust.</p>
  <div class="row" style="margin-top:56px; gap:24px;">
    <div class="card grow athlete">
      <span class="pill green">Free Forever</span>
      <h3 style="margin-top:20px;">Athletes</h3>
      <div class="label">Highlights, stats, fitness scores, achievements &mdash; in one searchable portfolio. Discovered 24/7, not just at trials.</div>
    </div>
    <div class="card grow scout">
      <span class="pill orange">Pays</span>
      <h3 style="margin-top:20px;">Scouts</h3>
      <div class="label">Filter by sport, position, age, geography, fitness zone. Claude-powered fit-score recommendations 0&ndash;100.</div>
    </div>
    <div class="card grow coach">
      <span class="pill cyan">Pays</span>
      <h3 style="margin-top:20px;">Coaches</h3>
      <div class="label">Manage teams, track performance, recruit talent, post opportunities. Coach-verified scores raise athlete trust 1.0&times;.</div>
    </div>
    <div class="card grow team">
      <span class="pill red">Pays</span>
      <h3 style="margin-top:20px;">Teams &amp; Academies</h3>
      <div class="label">Post trials, scholarships, tournaments. Athletes apply directly. Recruitment pipeline built in.</div>
    </div>
    <div class="card grow fan">
      <span class="pill purple">Free</span>
      <h3 style="margin-top:20px;">Fans</h3>
      <div class="label">Follow grassroots athletes. Build the social proof that scouts actually look at. Discovery accelerator.</div>
    </div>
    <div class="card grow scout">
      <span class="pill orange">Pays</span>
      <h3 style="margin-top:20px;">Brands</h3>
      <div class="label">Sponsor athletes. Run kit giveaways, fitness challenges, scholarship campaigns. Reach a fully-segmented audience.</div>
    </div>
  </div>
  <div style="margin-top:40px; font-size:24px; color:#888; text-align:center; letter-spacing:1px;">
    Athletes are <strong style="color:#30D158;">permanently free</strong>. Revenue is taken from the demand side.
  </div>
"""
    return slide(n, t, "solution", body)


def s_product(n, t):
    body = """
  <h2>Six role-tuned interfaces, one platform.</h2>
  <p class="lede">Tab bars, home screens, accent colors, and copy adapt per role. Every score, label, and message uses growth-oriented language. We never demotivate.</p>
  <div class="row" style="margin-top:56px; gap:24px;">
    <div class="card grow athlete">
      <div style="font-size:14px; letter-spacing:3px; color:#30D158; font-weight:800;">ATHLETE &middot; #30D158</div>
      <h3 style="margin-top:18px;">Build the portfolio</h3>
      <div class="label">Profile completion gauge. AI profile coach. Highlights uploader. Fitness test runner. "Who viewed your profile" engagement loop.</div>
    </div>
    <div class="card grow scout">
      <div style="font-size:14px; letter-spacing:3px; color:#FF9F0A; font-weight:800;">SCOUT &middot; #FF9F0A</div>
      <h3 style="margin-top:18px;">Find the diamond</h3>
      <div class="label">Structured search. AI scout cards. Shortlists. Verified-fitness filter. Direct messaging with athletes &amp; coaches.</div>
    </div>
    <div class="card grow coach">
      <div style="font-size:14px; letter-spacing:3px; color:#64D2FF; font-weight:800;">COACH &middot; #64D2FF</div>
      <h3 style="margin-top:18px;">Run the squad</h3>
      <div class="label">Team management. Performance dashboard. Verify athlete fitness scores (1.0&times; multiplier). Post opportunities.</div>
    </div>
  </div>
  <div class="row" style="gap:24px; margin-top:24px;">
    <div class="card grow team">
      <div style="font-size:14px; letter-spacing:3px; color:#FF453A; font-weight:800;">TEAM/ACADEMY &middot; #FF453A</div>
      <h3 style="margin-top:18px;">Recruit at scale</h3>
      <div class="label">Trials, scholarships, tournaments. Application pipeline. Bulk shortlist exports. Internal team collab.</div>
    </div>
    <div class="card grow fan">
      <div style="font-size:14px; letter-spacing:3px; color:#BF5AF2; font-weight:800;">FAN &middot; #BF5AF2</div>
      <h3 style="margin-top:18px;">Champion the rise</h3>
      <div class="label">Follow athletes. Like, comment, share. Build the audience that proves an athlete is worth scouting.</div>
    </div>
    <div class="card grow scout">
      <div style="font-size:14px; letter-spacing:3px; color:#FF9F0A; font-weight:800;">BRAND &middot; #FF9F0A</div>
      <h3 style="margin-top:18px;">Sponsor the journey</h3>
      <div class="label">Branded fitness challenges. Kit giveaways tied to zones. Athlete sponsorship marketplace.</div>
    </div>
  </div>
"""
    return slide(n, t, "product surfaces", body)


def s_magic_fitness(n, t):
    body = """
  <div class="eyebrow" style="color:#30D158;">The magic, part 1</div>
  <h2>Verified fitness data &mdash; the trust layer scouting never had.</h2>
  <p class="lede">Five standardized tests. Four verification tiers. Six growth-oriented zones. Every score is multiplied by a confidence factor that scouts can trust.</p>
  <div style="margin-top:36px; font-size:22px; color:#888; letter-spacing:2px; text-transform:uppercase;">Verification Tiers &mdash; confidence multiplier</div>
  <div class="tier-strip">
    <div class="tier"><div class="mult">0.7&times;</div><div class="name">Self&#8209;reported</div><div class="desc">Athlete&#8209;entered baseline</div></div>
    <div class="tier"><div class="mult">0.85&times;</div><div class="name">App&#8209;measured</div><div class="desc">Phone&#8209;sensor recorded in&#8209;app</div></div>
    <div class="tier"><div class="mult">1.0&times;</div><div class="name">Coach&#8209;verified</div><div class="desc">Coach signs off on result</div></div>
    <div class="tier"><div class="mult">1.1&times;</div><div class="name">Center&#8209;tested</div><div class="desc">Authorized testing center</div></div>
  </div>
  <div style="margin-top:48px; font-size:22px; color:#888; letter-spacing:2px; text-transform:uppercase;">Growth-Oriented Zones &mdash; we never demotivate</div>
  <div class="zones">
    <div class="zone">Starter</div>
    <div class="zone">Building</div>
    <div class="zone">Rising</div>
    <div class="zone">Strong</div>
    <div class="zone">Elite</div>
    <div class="zone">Unstoppable</div>
  </div>
  <div style="margin-top:36px; font-size:20px; color:#C7C7CC;">
    Tests live in&#8209;app: <strong style="color:#f0f0f0;">Yo-Yo IR1 &middot; 20m sprint &middot; 40m sprint &middot; Agility T-test &middot; Vertical jump</strong>. Sensor recording for app&#8209;measured tier.
  </div>
"""
    return slide(n, t, "the magic / fitness", body)


def s_magic_ai(n, t):
    body = """
  <div class="eyebrow" style="color:#64D2FF;">The magic, part 2</div>
  <h2>Krida AI &mdash; Claude-powered scouting at the edge.</h2>
  <p class="lede">Two-tier AI: fast Sonnet for chat &amp; coaching, heavyweight Opus with adaptive thinking for high-stakes matchmaking. Every scout gets a personal recruiter; every athlete gets a free coach.</p>
  <div class="row" style="margin-top:56px; gap:28px;">
    <div class="card grow coach">
      <div class="kicker" style="color:#64D2FF;">claude-sonnet-4-6 &middot; 300&ndash;800 tok</div>
      <h3 style="margin-top:12px;">Chat &amp; profile coach</h3>
      <ul class="bullets" style="margin-top:18px;">
        <li class="coach">Krida AI assistant in the app shell</li>
        <li class="coach">Profile improvement suggestions for athletes</li>
        <li class="coach">Caption help, post drafting, training plans</li>
        <li class="coach">JSON-returning prompts for structured tips</li>
      </ul>
    </div>
    <div class="card grow scout">
      <div class="kicker" style="color:#FF9F0A;">claude-opus-4-6 &middot; adaptive thinking &middot; 1000&ndash;1500 tok</div>
      <h3 style="margin-top:12px;">Scout &amp; opportunity matching</h3>
      <ul class="bullets" style="margin-top:18px;">
        <li class="scout">Fit scores 0&ndash;100 with rationale</li>
        <li class="scout">Confidence multiplier applied to every score</li>
        <li class="scout">Personalized scout-side recommendations</li>
        <li class="scout">Opportunity matching for athletes (trials, scholarships)</li>
      </ul>
    </div>
  </div>
  <div style="margin-top:40px; padding:28px 36px; background:rgba(100,210,255,0.06); border:1px solid rgba(100,210,255,0.3); border-radius:18px;">
    <div style="font-size:18px; letter-spacing:3px; text-transform:uppercase; color:#64D2FF; font-weight:800;">Architecture</div>
    <div style="margin-top:10px; font-size:24px; color:#f0f0f0;">All Claude calls route through a Supabase Edge Function (<code style="color:#30D158;">claude-proxy</code>). Server-side keys, zero client exposure. 60s timeout. JSON safety with fallbacks.</div>
  </div>
"""
    return slide(n, t, "the magic / AI", body)


def s_market(n, t):
    body = """
  <h2>$7B addressable. $800M directly. We need 1.5%.</h2>
  <p class="lede">Indian sports is bigger than people think. Scouting is structurally underserved. Our SOM target is conservative: 1.5% of SAM by Year 3.</p>
  <div class="row" style="margin-top:64px; gap:28px;">
    <div class="card grow athlete">
      <div class="kicker">TAM</div>
      <div class="stat">$7B</div>
      <div class="label"><strong>Indian sports industry</strong> (FY24). Growing 15% YoY. Projected $14B by 2030.</div>
    </div>
    <div class="card grow scout">
      <div class="kicker">SAM</div>
      <div class="stat scout">$800M</div>
      <div class="label"><strong>Talent discovery, scouting &amp; recruitment</strong> &mdash; the slice we serve. Untapped.</div>
    </div>
    <div class="card grow coach">
      <div class="kicker">SOM &middot; Year 3</div>
      <div class="stat coach">$12M</div>
      <div class="label"><strong>1.5% of SAM</strong>. Achievable with current GTM at current unit economics.</div>
    </div>
  </div>
  <table class="k" style="margin-top:48px;">
    <tr><th>Indicator</th><th>Value</th><th>Source</th></tr>
    <tr><td>Indian sports-tech market FY29</td><td class="num">&#8377;49,500 Cr</td><td>FICCI &middot; EY 2025</td></tr>
    <tr><td>Active organized scouts in India</td><td class="num">~5,000</td><td>Industry estimate</td></tr>
    <tr><td>Sports academies (registered)</td><td class="num">15,000+</td><td>Khelo India &middot; SAI</td></tr>
    <tr><td>Khelo India annual budget</td><td class="num">&#8377;1,756 Cr</td><td>Union Budget 2025</td></tr>
    <tr><td>IPL ecosystem value</td><td class="num">$16B</td><td>D&amp;P Advisory 2024</td></tr>
    <tr><td>Pro Kabaddi League franchises</td><td class="num">12 &middot; &#8377;1Cr+ auction tags</td><td>Mashal Sports S12</td></tr>
  </table>
"""
    return slide(n, t, "market", body)


def s_competition(n, t):
    body = """
  <h2>Nobody owns the quadrant we own.</h2>
  <p class="lede">Verified fitness + India grassroots focus + AI scouting + opportunity marketplace &mdash; an empty quadrant. Closest competitor (KhiladiPro) is schools-first B2B2C with no scout side.</p>
  <div class="grid-2x2">
    <div class="axis-y">India grassroots focus &rarr;</div>
    <div class="axis-x">Verified fitness data &rarr;</div>
    <!-- bottom-left: low/low -->
    <div class="dot" style="top:80%; left:18%;">SportVot</div>
    <div class="dot" style="top:90%; left:35%;">CricHeroes</div>
    <!-- top-left: India focus, low fitness data -->
    <div class="dot" style="top:30%; left:22%;">KIRTI (gov't)</div>
    <!-- bottom-right: fitness data, low India focus -->
    <div class="dot" style="top:70%; left:78%;">AiSCOUT &middot; RFYC</div>
    <div class="dot" style="top:55%; left:65%;">StepOut</div>
    <!-- top-right inner: fitness + India -->
    <div class="dot" style="top:38%; left:62%;">KhiladiPro</div>
    <!-- our spot -->
    <div class="dot us" style="top:18%; left:82%;">OnlyKrida</div>
  </div>
"""
    return slide(n, t, "competition", body)


def s_competition_table(n, t):
    body = """
  <h2>Where each player breaks &mdash; and where we don't.</h2>
  <table class="k" style="margin-top:32px;">
    <tr>
      <th>Player</th><th>Funded</th><th>Focus</th><th>Critical Gap</th>
    </tr>
    <tr>
      <td><strong>KhiladiPro</strong></td>
      <td>$1M pre-seed (2025)</td>
      <td>AI fitness assessment, schools B2B2C</td>
      <td>No scout-side product. No marketplace. Schools-first means slow UGC and no athlete agency.</td>
    </tr>
    <tr>
      <td><strong>StepOut</strong></td>
      <td>$1.5M Pre-Series A</td>
      <td>B2B analytics for clubs (AIFF, BFC)</td>
      <td>No athlete-side product. Football only. Sells to clubs, doesn't surface talent.</td>
    </tr>
    <tr>
      <td><strong>AiSCOUT &middot; RFYC</strong></td>
      <td>UK-based, RFYC partner</td>
      <td>Trial events, AI fitness</td>
      <td>Once-a-year event model. Not year-round discovery. India is a side market.</td>
    </tr>
    <tr>
      <td><strong>SportVot</strong></td>
      <td>&#8377;1.63M raised</td>
      <td>Match broadcasting</td>
      <td>Score-keeping, not portfolios. Unstructured player data. No discovery loop.</td>
    </tr>
    <tr>
      <td><strong>KIRTI</strong> (Government)</td>
      <td>SAI-backed</td>
      <td>Talent identification</td>
      <td>Funnels to elite academies only. Discovery is to you, not for you. No social layer, no scout side.</td>
    </tr>
    <tr>
      <td><strong>CricHeroes</strong></td>
      <td>Bootstrapped to scale</td>
      <td>Cricket scoring app</td>
      <td>Cricket only. Score-keeping not discovery. 49M users but no recruitment loop.</td>
    </tr>
    <tr class="hl">
      <td><strong>OnlyKrida</strong></td>
      <td>Pre-seed (this raise)</td>
      <td>Multi-sport, athlete-first marketplace</td>
      <td>&mdash; the empty quadrant: AI scouting + verified fitness + India grassroots + opportunity marketplace.</td>
    </tr>
  </table>
"""
    return slide(n, t, "competition / table", body)


def s_moat_kabaddi(n, t):
    body = """
  <div class="eyebrow" style="color:#FF9F0A;">Moat 1 &middot; Defensible Dataset</div>
  <h2>The kabaddi dataset nobody is building.</h2>
  <p class="lede">Pro Kabaddi is a real, capitalized league with zero digital grassroots layer. We can own it for &#8377;3&ndash;5 lakh.</p>
  <div class="row" style="margin-top:48px; gap:28px;">
    <div class="card grow scout">
      <div class="kicker" style="color:#FF9F0A;">The Vacuum</div>
      <div class="stat scout" style="font-size:64px;">0</div>
      <div class="label" style="margin-top:8px;">kabaddi datasets on <strong>Hugging Face</strong>. Verified by direct search. Zero academic citations on raid-action recognition. The field is empty.</div>
    </div>
    <div class="card grow team">
      <div class="kicker" style="color:#FF453A;">The Money</div>
      <div class="stat team" style="font-size:64px;">&#8377;1Cr+</div>
      <div class="label" style="margin-top:8px;">PKL S12 player auction tags. <strong>12 franchises</strong>, professional capital, fan economics that match cricket on Tier-2 metrics.</div>
    </div>
    <div class="card grow athlete">
      <div class="kicker" style="color:#30D158;">The Capex</div>
      <div class="stat" style="font-size:64px;">&#8377;3&ndash;5L</div>
      <div class="label" style="margin-top:8px;">to capture <strong>2,500 raid-action clips</strong> with bounding boxes. OnlyKrida becomes the default citation for kabaddi AI work.</div>
    </div>
  </div>
  <div style="margin-top:36px; padding:28px 36px; background:rgba(255,159,10,0.06); border:1px solid rgba(255,159,10,0.4); border-radius:18px;">
    <div class="kicker" style="color:#FF9F0A;">Anchor Partner</div>
    <div style="margin-top:8px; font-size:26px; color:#f0f0f0;">
      <strong>Telugu Titans</strong> &mdash; Hyderabad-based PKL franchise (owner: Mahesh Kolli). Natural partner. Replaces the post-Hyderabad-FC vacuum (Oct 2025 relocation to Delhi).
    </div>
  </div>
"""
    return slide(n, t, "moat / kabaddi", body)


def s_moat_network(n, t):
    body = """
  <div class="eyebrow" style="color:#30D158;">Moat 2 &middot; Compounding Network</div>
  <h2>Six sides. One flywheel. Each side makes the others more valuable.</h2>
  <div style="display:flex; gap:64px; margin-top:48px; align-items:center;">
    <div class="flywheel">
      <div class="node" style="top:10%; left:50%; border-color:#30D158; color:#30D158;">Athletes<small>portfolios</small></div>
      <div class="node" style="top:30%; left:90%; border-color:#FF9F0A; color:#FF9F0A;">Scouts<small>discover</small></div>
      <div class="node" style="top:75%; left:80%; border-color:#FF453A; color:#FF453A;">Teams<small>recruit</small></div>
      <div class="node" style="top:90%; left:35%; border-color:#BF5AF2; color:#BF5AF2;">Fans<small>amplify</small></div>
      <div class="node" style="top:65%; left:10%; border-color:#64D2FF; color:#64D2FF;">Coaches<small>verify</small></div>
      <div class="node" style="top:25%; left:12%; border-color:#FF9F0A; color:#FF9F0A;">Brands<small>sponsor</small></div>
    </div>
    <div style="flex:1; max-width:780px;">
      <ul class="bullets">
        <li>More athletes &rarr; richer search inventory &rarr; more scouts</li>
        <li class="scout">More scouts &rarr; more discovery &rarr; more athletes sign up</li>
        <li class="coach">More coaches verifying &rarr; higher data trust &rarr; premium scout pricing</li>
        <li class="team">More teams &rarr; more opportunities &rarr; reason for athletes to stay active</li>
        <li class="fan">More fans &rarr; social proof &rarr; scouts can short-circuit due diligence</li>
      </ul>
      <div style="margin-top:32px; padding:24px 32px; background:rgba(48,209,88,0.06); border:1px solid rgba(48,209,88,0.3); border-radius:16px;">
        <div style="font-size:24px; color:#f0f0f0;">Verified fitness data accumulates. Every test run is proprietary. <strong style="color:#30D158;">First-mover in Indian grassroots = compounding moat.</strong></div>
      </div>
    </div>
  </div>
"""
    return slide(n, t, "moat / network", body)


def s_business_model(n, t):
    body = """
  <h2>Athletes free forever. Demand side pays.</h2>
  <p class="lede">Three subscription tiers for scouts, two for teams, a brand campaign marketplace. The Dubai diaspora tier is the only place we charge an athlete &mdash; and only because parents want it.</p>
  <table class="k" style="margin-top:40px;">
    <tr><th>Tier</th><th>Audience</th><th>Price</th><th>Includes</th></tr>
    <tr><td><span class="pill orange">Scout Basic</span></td><td>Independent scouts</td><td class="num">&#8377;999 / mo</td><td>50 searches, 10 shortlists, basic messaging</td></tr>
    <tr><td><span class="pill orange">Scout Pro</span></td><td>Active scouts</td><td class="num">&#8377;2,499 / mo</td><td>Unlimited searches, AI recommendations, unlimited messaging</td></tr>
    <tr><td><span class="pill orange">Scout Enterprise</span></td><td>Scouting agencies</td><td class="num">&#8377;9,999 / mo</td><td>API access, bulk export, team collab, analytics</td></tr>
    <tr><td><span class="pill red">Team Starter</span></td><td>Small academies</td><td class="num">&#8377;1,999 / mo</td><td>5 opportunities, 5 team members</td></tr>
    <tr><td><span class="pill red">Team Pro</span></td><td>Established academies</td><td class="num">&#8377;4,999 / mo</td><td>Unlimited opportunities, 25 members, analytics</td></tr>
    <tr><td><span class="pill orange">Brand Campaigns</span></td><td>Sportswear, FMCG, fintech</td><td class="num">&#8377;5K &ndash; &#8377;1L</td><td>Branded fitness challenges, kit giveaways, scholarships</td></tr>
    <tr><td><span class="pill cyan">Dubai Diaspora</span></td><td>NRI parents (Dubai/UAE)</td><td class="num">&#8377;999 / yr</td><td>Premium athlete tier &mdash; "get scouted by Indian academies without flying back"</td></tr>
  </table>
  <div style="margin-top:32px; font-size:22px; color:#888; text-align:center; letter-spacing:1px;">
    Athletes in India: <strong style="color:#30D158;">free, forever</strong>. Trust is the funnel.
  </div>
"""
    return slide(n, t, "business model", body)


def s_unit_economics(n, t):
    body = """
  <h2>Unit economics work at small scale.</h2>
  <p class="lede">Software-grade margins, real-world CAC. The Scout Pro cohort pays back in &lt;3 months and compounds for 12.</p>
  <div class="row" style="margin-top:64px; gap:28px;">
    <div class="card grow team">
      <div class="kicker">Customer Acquisition Cost</div>
      <div class="stat team">&#8377;5K</div>
      <div class="label">Per paying scout. Ground events, founder-led sales, HCA TG20 + Subroto Cup sponsorships.</div>
    </div>
    <div class="card grow athlete">
      <div class="kicker">Lifetime Value (Scout Pro)</div>
      <div class="stat">&#8377;29,988</div>
      <div class="label">12-month retention &times; &#8377;2,499/mo. Retention model based on UK/US scouting platform benchmarks.</div>
    </div>
    <div class="card grow scout">
      <div class="kicker">LTV : CAC</div>
      <div class="stat scout">6&times;</div>
      <div class="label">Healthy software-marketplace ratio. Headroom to spend on growth as the funnel matures.</div>
    </div>
    <div class="card grow coach">
      <div class="kicker">Gross Margin</div>
      <div class="stat coach">85%</div>
      <div class="label">Cloud + Claude API + Supabase. No inventory, no field operations after onboarding.</div>
    </div>
  </div>
  <div style="margin-top:48px; display:flex; gap:32px; align-items:center;">
    <div style="font-size:120px; font-weight:900; letter-spacing:-3px; color:#30D158;">M18</div>
    <div style="font-size:32px; color:#C7C7CC; line-height:1.4; flex:1;">
      <strong style="color:#f0f0f0;">Break-even.</strong> Conservative path on current hiring plan and Hyderabad-Bengaluru ground motion. Series A unlock on traction, not capital.
    </div>
  </div>
"""
    return slide(n, t, "unit economics", body)


def s_gtm(n, t):
    body = """
  <h2>GTM &mdash; Hyderabad first, named grounds, named coaches.</h2>
  <p class="lede">No top-of-funnel ads. We win by knowing every Hyderabad coach by name and being on the touchline at every HCA TG20 match.</p>
  <div class="row" style="margin-top:48px; gap:28px;">
    <div class="card grow athlete">
      <div class="kicker">Month 1 &middot; May 2026</div>
      <h3>Closed beta &mdash; Hyderabad</h3>
      <ul class="bullets" style="margin-top:14px;">
        <li>50 athletes &middot; 5 scouts hand-built</li>
        <li>20 named grounds, founder ground visits</li>
        <li>HCA TG20 League sponsorship (32 matches, ~25K spectators)</li>
      </ul>
      <div style="margin-top:12px; font-size:18px; color:#888;">Grounds: LB Stadium, GMC Balayogi, Gachibowli, Lal Bahadur, Saroornagar, Fateh Maidan, NACS, Gymkhana &hellip; (20 total)</div>
    </div>
    <div class="card grow scout">
      <div class="kicker">Month 2 &middot; June 2026</div>
      <h3>Hyderabad open + Bengaluru seeding</h3>
      <ul class="bullets" style="margin-top:14px;">
        <li class="scout">500 athletes &middot; 15 scouts</li>
        <li class="scout">Bengaluru: Padukone-Dravid, BFC Academy, BDFA</li>
        <li class="scout">Pre-Subroto zonal qualifier sponsorship (&#8377;50K)</li>
      </ul>
      <div style="margin-top:12px; font-size:18px; color:#888;">Coaches: Shaji Prabhakaran, Mohammed Saif Hassan, Sai Vamshi, HCA U-19 selectors</div>
    </div>
    <div class="card grow coach">
      <div class="kicker">Months 3&ndash;6 &middot; Q3 2026</div>
      <h3>Scale + first revenue</h3>
      <ul class="bullets" style="margin-top:14px;">
        <li class="coach">10K athletes total</li>
        <li class="coach">3 paying enterprise contracts</li>
        <li class="coach">Subroto Cup national (Aug)</li>
        <li class="coach">Telugu Titans + Sreenidi Deccan FC announce</li>
      </ul>
    </div>
    <div class="card grow team">
      <div class="kicker">Month 6+ &middot; Oct 2026</div>
      <h3>Dubai expansion</h3>
      <ul class="bullets" style="margin-top:14px;">
        <li class="team">Diaspora athlete tier (&#8377;999/yr)</li>
        <li class="team">Emirates Cricket Board, Desert Cubs, Sharjah Cricket Stadium</li>
        <li class="team">"Get scouted by Indian academies &mdash; without flying back"</li>
      </ul>
    </div>
  </div>
"""
    return slide(n, t, "gtm", body)


def s_traction(n, t):
    body = """
  <h2>What's already shipped.</h2>
  <p class="lede">Wave 1 MVP is in production as of April 2026. 13-table Supabase backend with RLS. 9 user roles. Real-time messaging. AI scout cards. Five fitness tests. Closed beta launches now.</p>
  <div class="row" style="margin-top:48px; gap:28px;">
    <div class="card grow athlete">
      <div class="kicker" style="color:#30D158;">Built &middot; Wave 1</div>
      <h3 style="margin-top:12px;">MVP &mdash; Live</h3>
      <ul class="bullets" style="margin-top:18px;">
        <li>Auth + profiles for 9 user roles</li>
        <li>6 role-specific home screens with role accents</li>
        <li>Social feed (posts, likes, comments, video)</li>
        <li>Discover engine (search, filter, trending)</li>
        <li>Real-time DM + group messaging</li>
        <li>11 notification types</li>
        <li>5 opportunity categories with applications</li>
        <li>AI scouting (Claude Opus + adaptive thinking)</li>
        <li>5 fitness tests + sensor recording</li>
        <li>Profile completion + AI profile coach</li>
        <li>13 Supabase tables, RLS policies, real-time subs</li>
      </ul>
    </div>
    <div class="card grow scout">
      <div class="kicker" style="color:#FF9F0A;">Beta &middot; Launching now</div>
      <h3 style="margin-top:12px;">First cohort &mdash; Hyderabad</h3>
      <ul class="bullets" style="margin-top:18px;">
        <li class="scout">Target: 50 athletes, 5 scouts (Month 1)</li>
        <li class="scout">HCA TG20 League sponsorship secured</li>
        <li class="scout">Telugu Titans (PKL) outreach in motion</li>
        <li class="scout">Sreenidi Deccan FC outreach in motion</li>
        <li class="scout">DPDP-compliant parental consent in build</li>
        <li class="scout">Hyderabad-20 ground list locked</li>
      </ul>
      <div style="margin-top:24px; padding:20px 24px; background:rgba(255,159,10,0.06); border:1px solid rgba(255,159,10,0.3); border-radius:14px; font-size:20px; color:#C7C7CC;">
        Honest framing: <strong style="color:#f0f0f0;">pre-revenue today.</strong> This raise funds the closed-to-paid conversion through Q3 2026.
      </div>
    </div>
  </div>
"""
    return slide(n, t, "traction", body)


def s_team(n, t):
    body = """
  <h2>Founder lived the problem. Hiring the rest now.</h2>
  <div class="row" style="margin-top:48px; gap:28px;">
    <div class="card grow athlete" style="flex:1.4;">
      <div class="kicker" style="color:#30D158;">Founder &middot; CEO</div>
      <h3 style="margin-top:12px; font-size:48px;">Anirudh</h3>
      <ul class="bullets" style="margin-top:20px;">
        <li>Former Indian footballer &mdash; lived grassroots scouting failure</li>
        <li>Data engineer &mdash; built the entire MVP solo</li>
        <li>Hyderabad-based &mdash; ground knowledge, named coaches, ground access</li>
        <li>Domain + execution + geography in one person</li>
      </ul>
      <div style="margin-top:24px; font-size:20px; color:#888;">tanirudh127@gmail.com &middot; Hyderabad</div>
    </div>
    <div class="col grow">
      <div class="card scout">
        <div class="kicker" style="color:#FF9F0A;">Hiring &middot; Wave 2</div>
        <h3 style="margin-top:8px;">Senior full-stack engineer</h3>
        <div class="label" style="margin-top:6px;">React Native + Supabase + Claude API. Lead Wave 2 (live fitness recording, scout shortlists, opportunity pipeline).</div>
      </div>
      <div class="card coach">
        <div class="kicker" style="color:#64D2FF;">Hiring &middot; Wave 2</div>
        <h3 style="margin-top:8px;">GTM lead &mdash; Hyderabad</h3>
        <div class="label" style="margin-top:6px;">Run Hyderabad-20 ground motion. HCA + AIFF + PKL relationships. Eventually own Bengaluru &amp; Dubai expansion.</div>
      </div>
      <div class="card fan">
        <div class="kicker" style="color:#BF5AF2;">Open &middot; Advisory</div>
        <h3 style="margin-top:8px;">Ex-AIFF / HCA / PKL leadership</h3>
        <div class="label" style="margin-top:6px;">Strategic advisor seats reserved. Help us read the politics of Indian sports.</div>
      </div>
    </div>
  </div>
"""
    return slide(n, t, "team", body)


def s_financials(n, t):
    body = """
  <h2>Three-year revenue plan &mdash; the path to &#8377;16.8 Cr ARR.</h2>
  <table class="k" style="margin-top:40px;">
    <tr><th>Year</th><th>Stage</th><th>Athletes</th><th>Paying scouts &amp; teams</th><th>ARR (INR)</th><th>ARR (USD)</th></tr>
    <tr><td>Year 1 &middot; FY27</td><td>Closed-to-open beta &middot; first paid</td><td class="num">10,000</td><td class="num">~250</td><td class="num">&#8377;81 Lakh</td><td class="num">$97K</td></tr>
    <tr><td>Year 2 &middot; FY28</td><td>Multi-city &middot; Dubai launch</td><td class="num">85,000</td><td class="num">~1,400</td><td class="num">&#8377;4.2 Cr</td><td class="num">$504K</td></tr>
    <tr class="hl"><td>Year 3 &middot; FY29</td><td>Pan-India &middot; MENA expansion</td><td class="num">300,000</td><td class="num">~5,500</td><td class="num">&#8377;16.8 Cr</td><td class="num">$2.0M</td></tr>
  </table>
  <div style="margin-top:48px; display:flex; gap:32px; align-items:center;">
    <div class="card athlete" style="flex:1;">
      <div class="kicker">Operating discipline</div>
      <ul class="bullets" style="margin-top:12px;">
        <li>Current burn: <strong>&#8377;2L / mo</strong> (1-person team)</li>
        <li>Post-raise burn: <strong>&#8377;5L / mo</strong> (3-person + ground ops)</li>
        <li>Break-even: <strong>Month 18</strong></li>
        <li>Runway from this raise: <strong>~24 months</strong></li>
      </ul>
    </div>
  </div>
"""
    return slide(n, t, "financials", body)


def s_ask(n, t):
    body = """
  <div class="eyebrow" style="color:#30D158;">The Ask</div>
  <div style="display:flex; gap:80px; align-items:center; margin-top:32px;">
    <div>
      <div class="bignum">&#8377;3 Cr</div>
      <div class="tagline" style="margin-top:16px;">Angel round &middot; Pre-seed</div>
      <div style="margin-top:24px; font-size:24px; color:#C7C7CC; max-width:520px;">
        18 months of runway through paying-scout milestone. Series A trigger: &#8377;50L MRR.
      </div>
    </div>
    <div style="flex:1;">
      <table class="k">
        <tr><th>Allocation</th><th>%</th><th>What it buys</th></tr>
        <tr><td>Engineering hires</td><td class="num">50%</td><td>Sr full-stack + DevOps + AI eng</td></tr>
        <tr><td>Hyderabad + Bengaluru ground ops</td><td class="num">25%</td><td>GTM lead + sponsorships + ground events</td></tr>
        <tr><td>Kabaddi dataset capex</td><td class="num">15%</td><td>2,500-clip raid-action dataset, PKL partnerships</td></tr>
        <tr><td>DPDP compliance + ops</td><td class="num">10%</td><td>Consent manager, legal, infra hardening</td></tr>
      </table>
    </div>
  </div>
  <div class="alloc">
    <div style="background:#30D158; flex:50;">50% Engineering</div>
    <div style="background:#FF9F0A; flex:25;">25% Ground</div>
    <div style="background:#64D2FF; flex:15;">15% Kabaddi</div>
    <div style="background:#BF5AF2; flex:10;">10% DPDP</div>
  </div>
  <div style="margin-top:48px; padding:32px 40px; background:rgba(48,209,88,0.06); border:2px solid rgba(48,209,88,0.4); border-radius:20px;">
    <div style="font-size:20px; letter-spacing:3px; text-transform:uppercase; color:#30D158; font-weight:800;">What this round proves</div>
    <div style="margin-top:10px; font-size:30px; color:#f0f0f0; line-height:1.35;">
      Hyderabad &rarr; Bengaluru &rarr; Mumbai &middot; 10K active athletes &middot; first 250 paying scouts &middot; kabaddi dataset shipped &middot; DPDP-compliant by 13 May 2027 deadline.
    </div>
  </div>
"""
    return slide(n, t, "ask", body)


def s_vision(n, t):
    body = """
  <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
    <div class="eyebrow">Vision</div>
    <h1 class="hero" style="font-size:144px;">Every scout sees<br/>every athlete.</h1>
    <div style="margin-top:48px; font-size:34px; color:#C7C7CC; max-width:1500px; line-height:1.4;">
      Hyderabad. Bengaluru. Mumbai. Delhi. Then the diaspora corridor: <strong style="color:#FF9F0A;">Dubai &rarr; MENA &rarr; emerging-market sports economies</strong>. Every grassroots athlete, indexed. Every scout, a Krida AI co-pilot. Talent stops being a function of geography.
    </div>
    <div style="margin-top:80px; display:flex; gap:48px; align-items:center;">
      <div style="width:6px; height:80px; background:linear-gradient(180deg,#30D158,#FF9F0A);"></div>
      <div>
        <div style="font-size:30px; font-weight:800; color:#f0f0f0;">Anirudh &middot; Founder</div>
        <div style="font-size:22px; color:#888; margin-top:6px;">tanirudh127@gmail.com &middot; Hyderabad &middot; May 2026</div>
        <div style="font-size:18px; color:#555; margin-top:14px; letter-spacing:2px;">ONLYKRIDA &middot; INDIA&rsquo;S FIRST SPORTS TALENT DISCOVERY PLATFORM</div>
      </div>
    </div>
  </div>
"""
    return slide(n, t, "vision", body)


# ---------------------------------------------------------------------------
# Assemble
# ---------------------------------------------------------------------------

def build_html() -> str:
    builders = [
        s_cover,
        s_hook,
        s_problem,
        s_why_now,
        s_solution,
        s_product,
        s_magic_fitness,
        s_magic_ai,
        s_market,
        s_competition,
        s_competition_table,
        s_moat_kabaddi,
        s_moat_network,
        s_business_model,
        s_unit_economics,
        s_gtm,
        s_traction,
        s_team,
        s_financials,
        s_ask,
        s_vision,
    ]
    total = len(builders)
    slides_html = "\n".join(b(i + 1, total) for i, b in enumerate(builders))
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>OnlyKrida — Investor Pitch Deck</title>
<style>{CSS}</style>
</head>
<body>
{slides_html}
</body>
</html>
"""


def find_chrome() -> str | None:
    candidates = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        shutil.which("google-chrome") or "",
        shutil.which("chromium") or "",
    ]
    for path in candidates:
        if path and os.path.exists(path):
            return path
    return None


def render_pdf(html_path: Path, pdf_path: Path) -> bool:
    chrome = find_chrome()
    if not chrome:
        print("[pdf] No Chrome/Chromium found. HTML written; open in any browser and Print → Save as PDF.")
        return False

    print(f"[pdf] Using {chrome}")
    cmd = [
        chrome,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--no-margins",
        "--hide-scrollbars",
        f"--print-to-pdf={pdf_path}",
        f"file://{html_path}",
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            print(f"[pdf] headless=new failed (rc={result.returncode}): {result.stderr[:400]}")
            cmd[1] = "--headless"
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            print(f"[pdf] headless legacy also failed: {result.stderr[:400]}")
            return False
        return pdf_path.exists() and pdf_path.stat().st_size > 1000
    except subprocess.TimeoutExpired:
        print("[pdf] Chrome timed out after 120s.")
        return False


def main() -> int:
    print(f"[deck] Building HTML ...")
    html = build_html()
    HTML_OUT.write_text(html, encoding="utf-8")
    print(f"[deck] HTML  → {HTML_OUT.relative_to(ROOT)}  ({HTML_OUT.stat().st_size // 1024} KB)")

    print(f"[deck] Rendering PDF ...")
    ok = render_pdf(HTML_OUT, PDF_OUT)
    if ok:
        print(f"[deck] PDF   → {PDF_OUT.relative_to(ROOT)}  ({PDF_OUT.stat().st_size // 1024} KB)")
    else:
        print(f"[deck] PDF   → not generated. Open the HTML in Chrome and use File → Print → Save as PDF (1920×1080).")
        return 1
    print(f"[deck] Done. 21 slides.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
