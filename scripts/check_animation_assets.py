from PIL import Image, ImageOps, ImageDraw
from pathlib import Path
import json

paths = [
 "assets/loup-daily-anime.webp",
 "assets/loup-defi-original.webp",
 "assets/barre-xp-original.jpg",
 "assets/loup-intro.gif",
 "assets/animations/Tim_Defi_Du_Dimanche_20XP_Original.gif",
 "assets/animations/Tim_Dimanche_Hologramme_20XP_Gagne.gif",
 "assets/animations/Tim_Defi_Du_Samedi_10XP.gif",
 "assets/animations/Tim_Defi_Bonus_5XP.gif"
]
out=Path("inspect-animation-media");out.mkdir(exist_ok=True)
meta=[];tiles=[]
for p in paths:
 image=Image.open(p)
 n=getattr(image,"n_frames",1)
 meta.append({"name":p,"frames":n,"size":image.size,"bytes":Path(p).stat().st_size})
 for frame_i in sorted(set([0,n//2,n-1])):
  image.seek(frame_i)
  thumb=ImageOps.contain(image.convert("RGB"),(286,216))
  card=Image.new("RGB",(316,260),"#f7f8fa")
  card.paste(thumb,((316-thumb.width)//2,6+(218-thumb.height)//2))
  label=Path(p).name
  d=ImageDraw.Draw(card)
  d.text((7,228),label[:41],fill="#111")
  d.text((7,242),f"Frame {frame_i+1}/{n}",fill="#333")
  tiles.append(card)
sheet=Image.new("RGB",(316*3,260*len(paths)),"white")
for i,card in enumerate(tiles):sheet.paste(card,((i%3)*316,(i//3)*260))
sheet.save(out/"preuves-visuelles.jpg",quality=86)
(out/"inventaire.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2))
print(json.dumps(meta,ensure_ascii=False))
