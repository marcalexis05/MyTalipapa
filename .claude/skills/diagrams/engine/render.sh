#!/bin/bash
# render.sh <name> [winW] [winH]
# Runs <name>.gen.js (which writes <name>.svg via gen.js), screenshots it with headless
# Chrome at 2x, autocrops to <name>.png, and writes a <name>_view.png thumbnail (<=1500px)
# that you can Read to visually check the diagram. Run from the dir holding gen.js + *.gen.js.
n=$1; w=${2:-1700}; h=${3:-1100}
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
WIN="$(pwd | sed 's#^/c#C:#')"
node "$n.gen.js" || node "$n.js"
printf '<!doctype html><meta charset="utf-8"><style>*{margin:0}body{background:#fff}</style>' > "$n.html"
cat "$n.svg" >> "$n.html"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --virtual-time-budget=4000 --screenshot="$WIN/${n}_raw.png" --window-size=$w,$h \
  "file:///$WIN/$n.html" >/dev/null 2>&1
python3 - "$n" <<'PY'
import sys
from PIL import Image, ImageChops
n=sys.argv[1]
im=Image.open(f'{n}_raw.png').convert('RGB')
bb=ImageChops.difference(im,Image.new('RGB',im.size,(255,255,255))).getbbox()
if bb:
    p=22; bb=(max(0,bb[0]-p),max(0,bb[1]-p),min(im.size[0],bb[2]+p),min(im.size[1],bb[3]+p)); im=im.crop(bb)
im.save(f'{n}.png')
v=im.copy(); v.thumbnail((1500,1500)); v.save(f'{n}_view.png')
print(n, im.size)
PY
