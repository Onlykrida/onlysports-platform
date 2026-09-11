"""
OnlyKrida carousel renderer — 4 weekly carousels, 6 slides each, 1080x1350.

Brand is taken from the live site (website-live-archive/styles.css), not from
the app icon: #30D158 on #0a0a0a, Bebas Neue headlines, Archivo body. The
shipped app icon reads "OnlySports" in teal and is off-brand.

Every line of copy traces to shipped behaviour — see 30-day-plan.md for the
fact table and the list of banned claims.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from logo import rounded_badge, wordmark  # noqa: E402

W, H = 1080, 1350
DARK = "#0a0a0a"
SURFACE = "#141414"
BRAND = "#30D158"
WHITE = "#f0f0f0"
MUTED = "#9A9AA0"

BEBAS = str(ROOT / "fonts" / "BebasNeue.ttf")
ARCH = str(ROOT.parent / "node_modules/@expo-google-fonts/archivo/400Regular/Archivo_400Regular.ttf")
ARCH_B = str(ROOT.parent / "node_modules/@expo-google-fonts/archivo/700Bold/Archivo_700Bold.ttf")

f_kicker = ImageFont.truetype(ARCH_B, 30)
f_head = ImageFont.truetype(BEBAS, 108)
f_head_sm = ImageFont.truetype(BEBAS, 82)
f_body = ImageFont.truetype(ARCH, 40)
f_body_b = ImageFont.truetype(ARCH_B, 40)
f_foot = ImageFont.truetype(ARCH, 28)
f_num = ImageFont.truetype(BEBAS, 150)


def wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = f"{cur} {w}".strip()
        if draw.textlength(t, font=font) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def put(d, text, x, y, font, fill, max_w=W - 160, leading=1.16):
    for line in wrap(d, text, font, max_w):
        d.text((x, y), line, font=font, fill=fill)
        y += int(font.size * leading)
    return y


def slide(kicker, headline, body, footer, index=None, total=None, accent_num=None):
    img = Image.new("RGB", (W, H), DARK)
    d = ImageDraw.Draw(img)

    # Measure the whole block first, then centre it vertically. Rendering from a
    # fixed top margin left roughly 40% of every slide empty below the text,
    # which reads as unfinished at thumbnail size.
    hf = f_head if len(headline) <= 34 else f_head_sm
    head_lines = wrap(d, headline.upper(), hf, W - 160)
    body_lines = wrap(d, body, f_body, W - 160)

    block = 0
    if kicker:
        block += 62
    if accent_num:
        block += 168
    block += int(len(head_lines) * hf.size * 0.92) + 46
    block += 7 + 56
    block += int(len(body_lines) * f_body.size * 1.38)

    y = max(150, (H - 210 - block) // 2)
    rule_top = y - 40

    if kicker:
        d.text((80, y), kicker.upper(), font=f_kicker, fill=BRAND)
        y += 62

    if accent_num:
        d.text((80, y - 18), accent_num, font=f_num, fill=BRAND)
        y += 168

    for line in head_lines:
        d.text((80, y), line, font=hf, fill=WHITE)
        y += int(hf.size * 0.92)
    y += 46

    d.rectangle([80, y, 200, y + 7], fill=BRAND)
    y += 56

    for line in body_lines:
        d.text((80, y), line, font=f_body, fill=MUTED)
        y += int(f_body.size * 1.38)

    # Brand rule spans the actual content block.
    d.rectangle([0, rule_top, 12, min(rule_top + 260, y)], fill=BRAND)

    # Footer: logo lockup left, slide counter right
    badge = rounded_badge(64)
    img.paste(badge, (80, H - 150), badge)
    word = wordmark(40)
    img.paste(word, (156, H - 138), word)

    if index and total:
        c = f"{index}/{total}"
        d.text((W - 80 - d.textlength(c, font=f_foot), H - 128), c, font=f_foot, fill=MUTED)

    if footer:
        d.text((80, H - 62), footer, font=f_foot, fill=MUTED)

    return img


# ── Week 1: STANDARDS ───────────────────────────────────────────────────────
W1 = [
    ("Week 1 · Standards", "What counts as fast?",
     "Most Indian athletes have never been measured against a published benchmark. "
     "They train hard with no idea where they stand. Here is what the numbers actually mean.",
     "onlykrida.com", None),
    (None, "The 10m sprint",
     "Pure acceleration — the first ten metres, nothing else. It is the number that separates "
     "a quick player from a fast one, and it is the easiest to test badly.", None, "01"),
    (None, "Yo-Yo IR1",
     "Repeated 20m shuttles at rising speed until you cannot hold the pace. It estimates your "
     "VO2max, and it is the standard endurance test used across professional football.", None, "02"),
    (None, "Age bands matter",
     "A 16-year-old and a 24-year-old are not scored on the same scale. OnlyKrida bands results "
     "u16, u18, u21 and senior, so your zone reflects your stage, not just your stopwatch.", None, "03"),
    (None, "Six zones, not a pass or fail",
     "Starter, Building, Rising, Strong, Elite, Unstoppable. A zone tells you the next target "
     "instead of a verdict. Everyone starts somewhere and the app tells you exactly what is next.", None, "04"),
    ("Get measured", "Know your number.",
     "Free early access at onlykrida.com — standardised tests, scored against your age band.",
     "@its_onlykrida", None),
]

# ── Week 2: THE TESTS ───────────────────────────────────────────────────────
W2 = [
    ("Week 2 · The tests", "Test yourself properly",
     "A badly run test is worse than no test — it puts a wrong number on your profile. "
     "Here is how each one actually works.", "onlykrida.com", None),
    (None, "The guided audio test",
     "The app plays the beeps and times everything. You run, and tap 'I stopped' when you are "
     "done. No stopwatch, no second person needed, no manual arithmetic to get wrong.", None, "01"),
    (None, "Sprints: 10m to 40m",
     "Four distances, each measuring something different. Ten metres is acceleration. "
     "Forty is top speed. Recording all four tells a fuller story than any single number.", None, "02"),
    (None, "Agility and vertical jump",
     "The T-test measures how fast you change direction. Vertical jump measures explosive power. "
     "Together they describe the athlete a scout cannot see in a highlight reel.", None, "03"),
    (None, "Retest, do not guess",
     "Results are stored with the date, so progress is visible over months. An identical "
     "same-day re-entry is rejected — the history stays honest.", None, "04"),
    ("Start today", "One test. One number.",
     "Pick a test, run it properly, and see your zone. onlykrida.com",
     "@its_onlykrida", None),
]

# ── Week 3: GETTING SEEN ────────────────────────────────────────────────────
W3 = [
    ("Week 3 · Getting seen", "Scouting is a search problem",
     "Scouts do not scroll endlessly. They filter. If you are not in the filter, you do not exist — "
     "no matter how good you are.", "onlykrida.com", None),
    (None, "Sport, position, city",
     "These are the three fields a scout filters on. Leaving position blank leaves you out of "
     "every position-specific search. It takes ten seconds to fix.", None, "01"),
    (None, "Your city is a signal",
     "Matching on location carries real weight in ranking. Scouts recruit where they can actually "
     "watch you play. An empty city field costs you the search you were most likely to win.", None, "02"),
    (None, "Opportunities work both ways",
     "Tryouts, tournaments, sponsorships and scholarships get posted. You apply, and the person "
     "who posted it approves or rejects. It is a request, not a shout into the void.", None, "03"),
    (None, "A clip is not a profile",
     "A highlight shows your best moment. A tested number shows your baseline. Scouts need both, "
     "and almost nobody in India has the second one.", None, "04"),
    ("Be findable", "Fill in all three fields.",
     "Sport, position, city. Then get tested. onlykrida.com",
     "@its_onlykrida", None),
]

# ── Week 4: PROOF ───────────────────────────────────────────────────────────
W4 = [
    ("Week 4 · Proof", "Anyone can type a number",
     "Which is exactly why a self-entered result cannot carry the same weight as a witnessed one. "
     "OnlyKrida makes that difference explicit instead of pretending it does not exist.", "onlykrida.com", None),
    (None, "Self-reported: 0.7×",
     "Enter your own result and it counts — at seventy percent of full trust weight. "
     "Honest, useful, and clearly labelled as unwitnessed.", None, "01"),
    (None, "Coach-verified: 1.0×",
     "A coach who runs the test for you can record it directly. That result carries full trust "
     "weight, because someone with a reputation stood behind it.", None, "02"),
    (None, "Why the gap exists",
     "A scout deciding whether to travel needs to know which numbers were witnessed. "
     "Trust tiers make that visible instead of leaving them to guess.", None, "03"),
    (None, "Coaches: this is for you",
     "Run a testing session, record the results, and your athletes carry verified numbers. "
     "One afternoon produces a squad of measured, findable players.", None, "04"),
    ("Coaches and academies", "Test your squad.",
     "Get in touch to run a verified testing session. onlykrida.com",
     "@its_onlykrida", None),
]

if __name__ == "__main__":
    out = ROOT / "carousels"
    out.mkdir(parents=True, exist_ok=True)
    weeks = {"w1-standards": W1, "w2-tests": W2, "w3-getting-seen": W3, "w4-proof": W4}
    n = 0
    for name, slides in weeks.items():
        for i, (k, h, b, f, num) in enumerate(slides, 1):
            slide(k, h, b, f, i, len(slides), num).save(out / f"{name}-{i:02d}.png")
            n += 1
    print(f"rendered {n} slides across {len(weeks)} carousels -> {out}")
