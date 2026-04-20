#!/usr/bin/env python3
"""Convert all OnlyKrida markdown documents to styled HTML."""

import markdown
from pathlib import Path

DOCS_DIR = Path("/Users/anirudhtumuluru/onlysports-platform/docs")
OUTPUT_DIR = Path("/Users/anirudhtumuluru/onlysports-platform/docs/html")
OUTPUT_DIR.mkdir(exist_ok=True)

CSS = """
:root {
  --bg: #0a0a0a;
  --bg-card: #141420;
  --bg-code: #1a1a2e;
  --green: #30D158;
  --orange: #FF9F0A;
  --cyan: #64D2FF;
  --red: #FF453A;
  --purple: #BF5AF2;
  --text: #f0f0f0;
  --text-muted: #999;
  --border: #2a2a2e;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.7;
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 32px 120px;
}
/* Nav bar */
.topbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(10,10,10,0.92); backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 16px;
  padding: 12px 32px;
}
.topbar .logo { color: var(--green); font-weight: 800; font-size: 18px; letter-spacing: -0.5px; }
.topbar a { color: var(--text-muted); text-decoration: none; font-size: 13px; transition: color .2s; }
.topbar a:hover { color: var(--green); }
.topbar a.active { color: var(--green); }
body { padding-top: 72px; }

h1 {
  font-size: 2.4em; font-weight: 800; color: var(--green);
  margin: 48px 0 8px; letter-spacing: -1px;
  border-bottom: 2px solid var(--green); padding-bottom: 12px;
}
h1:first-of-type { margin-top: 0; }
h2 {
  font-size: 1.6em; font-weight: 700; color: var(--text);
  margin: 40px 0 12px; padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
h3 { font-size: 1.25em; font-weight: 600; color: var(--cyan); margin: 28px 0 10px; }
h4 { font-size: 1.05em; font-weight: 600; color: var(--orange); margin: 20px 0 8px; }
p { margin: 10px 0; }
a { color: var(--cyan); text-decoration: none; }
a:hover { text-decoration: underline; }
strong { color: var(--green); font-weight: 700; }
em { color: var(--text-muted); font-style: italic; }

blockquote {
  background: var(--bg-card); border-left: 4px solid var(--green);
  padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;
}
blockquote p { margin: 4px 0; color: var(--text-muted); }
blockquote strong { color: var(--green); }

ul, ol { padding-left: 24px; margin: 10px 0; }
li { margin: 6px 0; }
li::marker { color: var(--green); }

code {
  background: var(--bg-code); color: var(--cyan);
  padding: 2px 7px; border-radius: 4px; font-size: 0.9em;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
}
pre {
  background: var(--bg-code); border: 1px solid var(--border);
  border-radius: 10px; padding: 20px; margin: 16px 0;
  overflow-x: auto; line-height: 1.5;
}
pre code {
  background: none; padding: 0; color: var(--text);
  font-size: 0.85em;
}

table {
  width: 100%; border-collapse: collapse; margin: 16px 0;
  font-size: 0.92em; border-radius: 10px; overflow: hidden;
}
th {
  background: var(--bg-code); color: var(--green);
  font-weight: 700; text-align: left; padding: 12px 16px;
  border-bottom: 2px solid var(--green);
  position: sticky; top: 56px; z-index: 10;
}
td {
  padding: 10px 16px; border-bottom: 1px solid var(--border);
  vertical-align: top;
}
tr:nth-child(even) td { background: rgba(20,20,32,0.5); }
tr:hover td { background: rgba(48,209,88,0.06); }

hr {
  border: none; height: 1px; background: var(--border); margin: 40px 0;
}

/* Table of Contents */
h2#table-of-contents ~ ol, h2#table-of-contents ~ ul {
  columns: 2; column-gap: 32px;
}

/* Badges for P0/P1/P2 */
td:first-child { white-space: nowrap; }

/* Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #444; }

/* Print */
@media print {
  body { background: white; color: #111; padding: 20px; }
  .topbar { display: none; }
  h1 { color: #111; border-color: #111; }
  h2 { color: #333; }
  h3 { color: #555; }
  table th { background: #eee; color: #111; border-color: #111; }
  td { border-color: #ddd; }
  code { background: #f5f5f5; color: #333; }
  pre { background: #f5f5f5; border-color: #ddd; }
  blockquote { background: #f9f9f9; }
}

/* Responsive */
@media (max-width: 768px) {
  body { padding: 60px 16px 80px; }
  h1 { font-size: 1.8em; }
  table { font-size: 0.82em; }
  th, td { padding: 8px 10px; }
  .topbar { padding: 10px 16px; gap: 10px; flex-wrap: wrap; }
}
"""

DOCS = [
    ("BRD_OnlyKrida.md", "BRD — Business Requirements", "brd"),
    ("PRD_OnlyKrida.md", "PRD — Product Requirements", "prd"),
    ("TRD_OnlyKrida.md", "TRD — Technical Requirements", "trd"),
    ("CRITICAL_IMPROVEMENTS.md", "Top 15 Critical Improvements", "improvements"),
]

NAV_LINKS = "".join(
    f'<a href="{slug}.html">{title.split("—")[0].strip()}</a>'
    for _, title, slug in DOCS
)

def make_topbar(active_slug):
    links = ""
    for _, title, slug in DOCS:
        label = title.split("—")[0].strip()
        cls = ' class="active"' if slug == active_slug else ""
        links += f'<a href="{slug}.html"{cls}>{label}</a>'
    return f'<nav class="topbar"><span class="logo">OnlyKrida</span>{links}</nav>'

def convert(md_filename, title, slug):
    md_path = DOCS_DIR / md_filename
    if not md_path.exists():
        print(f"  SKIP: {md_path} not found")
        return

    md_text = md_path.read_text(encoding="utf-8")

    html_body = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "toc", "nl2br", "sane_lists"],
        extension_configs={"toc": {"permalink": False}},
    )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} | OnlyKrida</title>
  <style>{CSS}</style>
</head>
<body>
  {make_topbar(slug)}
  {html_body}
</body>
</html>"""

    out_path = OUTPUT_DIR / f"{slug}.html"
    out_path.write_text(html, encoding="utf-8")
    print(f"  OK: {out_path} ({len(html):,} bytes)")

# Also create an index page
def create_index():
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OnlyKrida Documentation</title>
  <style>{CSS}
  .hero {{ text-align: center; padding: 80px 20px 40px; }}
  .hero h1 {{ border: none; font-size: 3em; margin-bottom: 16px; }}
  .hero p {{ font-size: 1.2em; color: var(--text-muted); max-width: 600px; margin: 0 auto; }}
  .cards {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-top: 48px; }}
  .card {{
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 12px; padding: 28px; transition: all .3s;
    text-decoration: none; color: var(--text);
  }}
  .card:hover {{ border-color: var(--green); transform: translateY(-4px); box-shadow: 0 8px 32px rgba(48,209,88,0.1); }}
  .card h3 {{ margin: 0 0 8px; }}
  .card p {{ color: var(--text-muted); margin: 0; font-size: 0.95em; }}
  .card .tag {{ display: inline-block; background: var(--bg-code); color: var(--green); padding: 4px 10px; border-radius: 20px; font-size: 0.75em; margin-top: 12px; font-weight: 600; }}
  </style>
</head>
<body>
  {make_topbar("")}
  <div class="hero">
    <h1>OnlyKrida Documentation</h1>
    <p>India's First AI-Powered Sports Talent Discovery Platform — Investor-grade + Engineering-grade documentation suite</p>
  </div>
  <div class="cards">
    <a class="card" href="brd.html">
      <h3 style="color: var(--green);">Business Requirements (BRD)</h3>
      <p>Market analysis, stakeholder mapping, business model, user personas, revenue projections, risk analysis</p>
      <span class="tag">613 lines &middot; 40KB</span>
    </a>
    <a class="card" href="prd.html">
      <h3 style="color: var(--cyan);">Product Requirements (PRD)</h3>
      <p>Architecture overview, 11 feature breakdowns with user stories, user flows, UX/UI guidelines, roadmap</p>
      <span class="tag">1,336 lines &middot; 60KB</span>
    </a>
    <a class="card" href="trd.html">
      <h3 style="color: var(--orange);">Technical Requirements (TRD)</h3>
      <p>System architecture, 13 database tables, API design, realtime, security, scalability, AI architecture</p>
      <span class="tag">1,467 lines &middot; 56KB</span>
    </a>
    <a class="card" href="improvements.html">
      <h3 style="color: var(--red);">Critical Improvements</h3>
      <p>Top 15 prioritized improvements with risk analysis, implementation timeline, and cost estimates</p>
      <span class="tag">660 lines &middot; 28KB</span>
    </a>
  </div>
</body>
</html>"""
    out_path = OUTPUT_DIR / "index.html"
    out_path.write_text(html, encoding="utf-8")
    print(f"  OK: {out_path} (index)")


print("Converting OnlyKrida documentation to HTML...\n")
for md_file, title, slug in DOCS:
    convert(md_file, title, slug)
create_index()
print(f"\nDone! All files in: {OUTPUT_DIR}/")
