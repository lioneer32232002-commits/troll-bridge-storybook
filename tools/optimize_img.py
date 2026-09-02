"""把 art/ 裡的原尺寸插圖（2752×1536, ~3MB）縮成投影用的 1920 寬 JPEG 放到 site/img/。

用法（在 D:/繪本 執行）：
    python tools/optimize_img.py

原圖留在 art/（不部署），site/img/ 只放縮圖，翻頁載入才不會卡。
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "art"
DST = ROOT / "site" / "img"
WIDTH = 1920
QUALITY = 84

DST.mkdir(parents=True, exist_ok=True)
for src in sorted(SRC.glob("p*.jpg")):
    im = Image.open(src).convert("RGB")
    if im.width < 2000:
        print(f"⚠ {src.name} 只有 {im.size}，不是原尺寸")
    if im.width > WIDTH:
        im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
    out = DST / src.name
    im.save(out, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    print(f"{src.name}: {Image.open(src).size} -> {im.size}, {out.stat().st_size // 1024} KB")
