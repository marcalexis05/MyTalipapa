"""Downscale every stall panorama to a readable band crop with angle guide lines.

Equirectangular panos are 2:1, so horizontal pixel -> yaw angle:
  angle = (x/width - 0.5) * 360   (0 deg = image center = camera "forward")
We draw guides at -135,-90,-45,0,+45,+90,+135 so the painted stall numbers
can be read off at a consistent angle. Output goes to scripts/_scan/.
"""
import os, glob
from PIL import Image, ImageDraw

SRC = os.path.join(os.path.dirname(__file__), '..', 'public', 'export360')
OUT = os.path.join(os.path.dirname(__file__), '_scan')
os.makedirs(OUT, exist_ok=True)

W = 1280
BAND_TOP, BAND_BOT = 150, 540  # vertical slice that holds the counter signage

def angle_to_x(a):
    return int((a / 360.0 + 0.5) * W)

guides = [(-135, '#ff5555'), (-90, '#ff5555'), (-45, '#888888'),
          (0, '#7CFC00'), (45, '#888888'), (90, '#55ccff'), (135, '#55ccff')]

files = sorted(glob.glob(os.path.join(SRC, 'stall*.jpg')))
print(f'{len(files)} stall panoramas')
for f in files:
    name = os.path.basename(f)
    im = Image.open(f).convert('RGB').resize((W, W // 2))
    band = im.crop((0, BAND_TOP, W, BAND_BOT)).copy()
    d = ImageDraw.Draw(band)
    for a, col in guides:
        x = angle_to_x(a)
        d.line([(x, 0), (x, band.height)], fill=col, width=2)
        d.text((x + 3, 2), f'{a:+d}', fill=col)
    band.save(os.path.join(OUT, name), quality=82)
print('done ->', OUT)
