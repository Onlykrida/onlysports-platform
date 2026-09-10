"""
OnlyKrida logo mark.

The shipped app icon (assets/images/icon.png) is off-brand: it reads
"OnlySports" in a blue->teal gradient with a trophy glyph. The product is
OnlyKrida and the live site's brand green is #30D158 on #0a0a0a with Bebas Neue
headlines. This renders a mark that matches the site people actually land on.

Design: a rounded-square badge with a bold "K" cut by an upward motion slash —
the slash reads as both a rising performance line and a running track.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

BRAND = "#30D158"
DARK = "#0a0a0a"
WHITE = "#f0f0f0"

ROOT = Path(__file__).resolve().parent
BEBAS = str(ROOT / "fonts" / "BebasNeue.ttf")


def rounded_badge(size: int, radius_ratio: float = 0.22) -> Image.Image:
    """Brand-green rounded square with a K and a motion slash."""
    ss = 4  # supersample for clean edges
    s = size * ss
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(s * radius_ratio)

    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=r, fill=BRAND)

    # "K" sits left; the slash lives in clear space to its right so the two
    # never collide. An earlier version overlapped them and the pair read as a
    # checkmark rather than a letter plus a motion line.
    f = ImageFont.truetype(BEBAS, int(s * 0.60))
    box = d.textbbox((0, 0), "K", font=f)
    kw, kh = box[2] - box[0], box[3] - box[1]
    kx = s * 0.20 - box[0]
    ky = (s - kh) / 2 - box[1]
    d.text((kx, ky), "K", font=f, fill=DARK)

    # Three ascending bars: a rising performance chart, unmistakably deliberate.
    bar_w = int(s * 0.075)
    x0 = kx + kw + s * 0.11
    base = ky + kh
    for i, frac in enumerate((0.34, 0.58, 0.86)):
        h = kh * frac
        x = x0 + i * (bar_w + s * 0.035)
        d.rounded_rectangle(
            [x, base - h, x + bar_w, base],
            radius=bar_w // 2,
            fill=DARK,
        )

    return img.resize((size, size), Image.LANCZOS)


def wordmark(height: int = 120, on_dark: bool = True) -> Image.Image:
    """ONLY + KRIDA lockup, KRIDA in brand green — matches the site header."""
    ss = 4
    h = height * ss
    f = ImageFont.truetype(BEBAS, int(h * 0.78))
    tmp = ImageDraw.Draw(Image.new("RGB", (1, 1)))

    a, b = "ONLY", "KRIDA"
    wa = tmp.textbbox((0, 0), a, font=f)[2]
    wb = tmp.textbbox((0, 0), b, font=f)[2]
    gap = int(h * 0.06)
    pad = int(h * 0.08)

    img = Image.new("RGBA", (wa + gap + wb + pad * 2, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    top = (h - f.getbbox(a)[3]) / 2
    d.text((pad, top), a, font=f, fill=WHITE if on_dark else DARK)
    d.text((pad + wa + gap, top), b, font=f, fill=BRAND)

    return img.resize((img.width // ss, height), Image.LANCZOS)


def horizontal_lock(height: int = 120) -> Image.Image:
    """Badge + wordmark, the form used on carousel slides."""
    badge = rounded_badge(height)
    word = wordmark(int(height * 0.72))
    gap = int(height * 0.22)
    img = Image.new("RGBA", (badge.width + gap + word.width, height), (0, 0, 0, 0))
    img.alpha_composite(badge, (0, 0))
    img.alpha_composite(word, (badge.width + gap, (height - word.height) // 2))
    return img


if __name__ == "__main__":
    out = ROOT / "logo"
    out.mkdir(parents=True, exist_ok=True)

    for px in (64, 128, 256, 512, 1024):
        rounded_badge(px).save(out / f"onlykrida-mark-{px}.png")

    wordmark(160).save(out / "onlykrida-wordmark.png")
    horizontal_lock(160).save(out / "onlykrida-lockup.png")

    # Dark-background preview sheet for eyeballing all three at once.
    sheet = Image.new("RGB", (1200, 420), DARK)
    sheet.paste(rounded_badge(220), (60, 100), rounded_badge(220))
    lock = horizontal_lock(150)
    sheet.paste(lock, (340, 80), lock)
    word = wordmark(110)
    sheet.paste(word, (340, 250), word)
    sheet.save(out / "logo-preview.png")

    print("wrote:", *(p.name for p in sorted(out.iterdir())), sep="\n  ")
