#!/usr/bin/env python3
"""Correct the existing Sunday GIF: keep the animated tablet, hologram and wolf.
Only the obsolete 150-XP inscription is replaced by the approved +20 XP gagné.
The source GIF remains intact, so the change is reversible.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/animations/Tim_Defi_Du_Dimanche_20XP_Original.gif"
TARGET = ROOT / "assets/animations/Tim_Dimanche_Hologramme_20XP_Gagne.gif"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

source = Image.open(SOURCE)
frames, durations = [], []
if source.n_frames < 8:
    raise RuntimeError("Sunday GIF has too few animation frames")

for i in range(source.n_frames):
    source.seek(i)
    image = source.convert("RGB")
    w, h = image.size
    # The obsolete inscription becomes visible near the end of the hologram
    # opening. The overlay is confined to that existing inscription area.
    if i >= max(6, round(source.n_frames * .64)):
        draw = ImageDraw.Draw(image)
        rect = (round(.380*w), round(.765*h),
                round(.838*w), round(.863*h))
        draw.rounded_rectangle(
            rect, radius=max(4, round(w*.015)),
            fill="#123b5a", outline="#ebc66b",
            width=max(2, round(w*.006)))
        label = "+20 XP gagné"
        font = ImageFont.truetype(FONT, max(12, round(w*.043)))
        left, top, right, bottom = draw.textbbox((0, 0), label, font=font)
        x = (rect[0] + rect[2] - (right-left)) / 2
        y = (rect[1] + rect[3] - (bottom-top)) / 2 - top
        draw.text((round(x), round(y)), label, font=font, fill="#ffe9a5")
    frames.append(image)
    durations.append(source.info.get("duration", 260))

TARGET.parent.mkdir(parents=True, exist_ok=True)
frames[0].save(TARGET, save_all=True, append_images=frames[1:],
    duration=durations, loop=0, optimize=False, disposal=2)

check = Image.open(TARGET)
assert check.n_frames == source.n_frames
assert TARGET.stat().st_size > 100000
print(f"Corrected Sunday GIF: {check.n_frames} frames, {TARGET.stat().st_size} bytes")
