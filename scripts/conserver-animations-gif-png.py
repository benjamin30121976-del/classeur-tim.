#!/usr/bin/env python3
"""Conserve les visuels validés mais fournit GIF (défi du jour) et PNG (jauge XP).
Les originaux WebP et JPG restent dans le dépôt, sans écrasement.
"""
from pathlib import Path
from PIL import Image
import json

root=Path("assets")
daily_source=root/"loup-defi-original.webp"
daily_target=root/"animations"/"Tim_Defi_Du_Jour_Valide.gif"
bar_source=root/"barre-xp-original.jpg"
bar_target=root/"barre-xp-original.png"
daily_target.parent.mkdir(parents=True,exist_ok=True)

image=Image.open(daily_source)
frames=[]
durations=[]
for idx in range(getattr(image,"n_frames",1)):
    image.seek(idx)
    frames.append(image.convert("RGB"))
    durations.append(max(50, int(image.info.get("duration") or 500)))
assert len(frames)>=12,"Animation du défi du jour incomplète"
frames[0].save(daily_target,save_all=True,append_images=frames[1:],
    format="GIF",duration=durations,loop=0,optimize=True,disposal=2)
with Image.open(daily_target) as result:
    assert result.size==image.size and result.n_frames==len(frames)

with Image.open(bar_source) as bar:
    assert bar.width*1==bar.height*3,"La jauge doit conserver son ratio 3:1"
    bar.save(bar_target,format="PNG",optimize=True)
with Image.open(bar_target) as result:
    assert result.size==(1536,512)
print(json.dumps({
    "daily":{"path":str(daily_target),"frames":len(frames),"durations":durations,"bytes":daily_target.stat().st_size},
    "xp_bar":{"path":str(bar_target),"size":[1536,512],"bytes":bar_target.stat().st_size}
},ensure_ascii=False))
