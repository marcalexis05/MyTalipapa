"""Build a print-optimized PDF of all stall QR codes from the generator manifest.

Reads public/qrcodes/manifest.json (produced by generateStallQrCodes.mjs) and lays
the QR PNGs out in a labeled grid on A4, grouped by section with a cover page.

Usage:  python scripts/build_qr_pdf.py
Output: public/qrcodes/MyTalipapa-Stall-QR-Codes.pdf
"""
import json
import os

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas

HERE = os.path.dirname(os.path.abspath(__file__))
QR_DIR = os.path.join(HERE, "..", "public", "qrcodes")
MANIFEST = os.path.join(QR_DIR, "manifest.json")
OUT = os.path.join(QR_DIR, "MyTalipapa-Stall-QR-Codes.pdf")

ACCENT = colors.HexColor("#e8621a")
INK = colors.HexColor("#0f172a")
MUTED = colors.HexColor("#64748b")
LINE = colors.HexColor("#cbd5e1")

CAT_TITLE = {"meat": "Meat Section", "fish": "Fish Section", "veggies": "Vegetables Section"}

# Grid: 3 columns x 4 rows per page
COLS, ROWS = 3, 4
PAGE_W, PAGE_H = A4
MARGIN = 14 * mm
GUTTER = 6 * mm
HEADER_H = 16 * mm


def load():
    with open(MANIFEST, encoding="utf-8") as f:
        items = json.load(f)
    order = {"meat": 0, "fish": 1, "veggies": 2}
    items.sort(key=lambda s: (order.get(s["category"], 9), s["zone"], s["payload"]))
    return items


def draw_cover(c, total, counts):
    c.setFillColor(ACCENT)
    c.rect(0, PAGE_H - 8 * mm, PAGE_W, 8 * mm, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(MARGIN, PAGE_H - 45 * mm, "MyTalipapa")
    c.setFont("Helvetica-Bold", 18)
    c.drawString(MARGIN, PAGE_H - 56 * mm, "Stall QR Codes")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 11)
    lines = [
        f"{total} stalls  -  Meat {counts['meat']}  /  Fish {counts['fish']}  /  Vegetables {counts['veggies']}",
        "",
        "How to use:",
        "1. Print this document (100% scale, no fit-to-page).",
        "2. Cut along the card borders.",
        "3. Post each QR code at its stall.",
        "",
        "Shoppers scan a code in the app's AR Finder to set",
        "\"you are here\" or to navigate to that stall.",
    ]
    y = PAGE_H - 78 * mm
    for ln in lines:
        c.drawString(MARGIN, y, ln)
        y -= 7 * mm
    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(MUTED)
    c.drawString(MARGIN, 14 * mm, "Generated from public/qrcodes/manifest.json")
    c.showPage()


def draw_card(c, x, y, w, h, item):
    # border
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.roundRect(x, y, w, h, 3 * mm, stroke=1, fill=0)

    label_h = 16 * mm
    qr_area = h - label_h
    pad = 4 * mm
    size = min(w - 2 * pad, qr_area - 2 * pad)
    qx = x + (w - size) / 2
    qy = y + label_h + (qr_area - size) / 2
    png = os.path.join(QR_DIR, item["png"].replace("/", os.sep))
    c.drawImage(png, qx, qy, size, size, preserveAspectRatio=True, mask="auto")

    # labels
    cx = x + w / 2
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(cx, y + 10 * mm, item["displayName"])
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(cx, y + 6 * mm, f"{CAT_TITLE.get(item['category'], item['category'])}  -  {item['zone']}")
    c.setFont("Helvetica", 5.5)
    c.drawCentredString(cx, y + 2.5 * mm, item["payload"])


def draw_section_header(c, title, count):
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(MARGIN, PAGE_H - MARGIN - 4 * mm, title)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 9)
    c.drawString(MARGIN, PAGE_H - MARGIN - 9 * mm, f"{count} stalls")
    c.setStrokeColor(ACCENT)
    c.setLineWidth(1.5)
    c.line(MARGIN, PAGE_H - MARGIN - 11 * mm, PAGE_W - MARGIN, PAGE_H - MARGIN - 11 * mm)


def main():
    items = load()
    counts = {k: sum(1 for s in items if s["category"] == k) for k in ("meat", "fish", "veggies")}

    c = canvas.Canvas(OUT, pagesize=A4)
    c.setTitle("MyTalipapa - Stall QR Codes")
    draw_cover(c, len(items), counts)

    grid_w = PAGE_W - 2 * MARGIN
    grid_h = PAGE_H - 2 * MARGIN - HEADER_H
    cell_w = (grid_w - (COLS - 1) * GUTTER) / COLS
    cell_h = (grid_h - (ROWS - 1) * GUTTER) / ROWS

    for cat in ("meat", "fish", "veggies"):
        group = [s for s in items if s["category"] == cat]
        per_page = COLS * ROWS
        for p in range(0, len(group), per_page):
            page_items = group[p:p + per_page]
            draw_section_header(c, CAT_TITLE[cat], counts[cat])
            top = PAGE_H - MARGIN - HEADER_H
            for idx, item in enumerate(page_items):
                col = idx % COLS
                row = idx // COLS
                x = MARGIN + col * (cell_w + GUTTER)
                y = top - (row + 1) * cell_h - row * GUTTER
                draw_card(c, x, y, cell_w, cell_h, item)
            c.showPage()

    c.save()
    print(f"Wrote {OUT} ({len(items)} stalls)")


if __name__ == "__main__":
    main()
