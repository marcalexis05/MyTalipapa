// Generate one QR code per market stall, plus a printable contact sheet.
//
// The QR payload is the canonical "MTP:STALL:<category>-<rawId>@<zone>" form that
// ArFinder.jsx's parseQrPayload()/resolveStallFromRef() understand. The stall id
// lists and zone logic below are kept in sync with buildAllStalls()/getStallZone()
// in client/src/pages/Renter/ArFinder.jsx — update both together.
//
// Usage:  node scripts/generateStallQrCodes.mjs
// Output: client/public/qrcodes/{meat,fish,veggies}/*.svg + *.png, and index.html

import QRCode from "qrcode";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "qrcodes");

// ── Stall id lists (mirror of ArFinder.buildAllStalls) ──────────────────────
const meatIds = [
  "1", "1(u)", "1(u2)", "2", "2(u)", "2(u2)", "3", "3(u)", "3(u2)", "4", "4(u)", "4(u2)",
  "5", "empty", "empty2", "empty3",
  "5(u)", "6", "7", "8", "9", "10", "8(u2)", "9(u2)", "10(u2)", "11", "12", "12(u)", "13", "13(u)", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24",
  "51", "52", "53", "54", "55", "56",
];
const fishIds = [
  "11", "14", "15", "16", "17", "18", "19", "20",
  "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
  "31", "32", "33", "34", "35", "36", "37", "38", "39", "40",
  "41", "42", "43", "44", "45", "46", "47", "48", "49", "50",
  "57", "58", "59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "71", "72", "73", "74", "75",
  "nostallnum1", "nostallnum2", "nostallnum3", "nostallnum4", "nostallnum5",
];
const veggieIds = [
  "5", "6", "7", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24",
  "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40",
  "41", "42", "43", "44", "45", "46", "47", "48", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60",
  "61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "71", "72",
];

// ── Zone logic (mirror of ArFinder.getStallZone) ────────────────────────────
const getStallZone = (num, category) => {
  const stallId = String(num);
  if (category === "meat") {
    if (["1(u)", "2(u)", "3(u)", "4(u)", "5(u)", "12(u)", "13(u)", "empty", "empty2", "empty3"].includes(stallId)) return "Zone A";
    if (["51", "52", "53", "54", "55", "56"].includes(stallId)) return "Zone C";
    if (["1(u2)", "2(u2)", "3(u2)", "4(u2)", "8(u2)", "9(u2)", "10(u2)"].includes(stallId)) return "Zone F";
    return "Zone E";
  } else if (category === "fish") {
    const n = parseInt(stallId.replace(/[^0-9]/g, ""), 10) || 0;
    if (n >= 11 && n <= 20) return "Zone A";
    if (n >= 21 && n <= 40) return "Zone B";
    if ((n >= 41 && n <= 50) || (n >= 57 && n <= 60)) return "Zone C";
    return "Zone D";
  } else if (category === "veggies") {
    const n = parseInt(stallId.replace(/[^0-9]/g, ""), 10) || 0;
    if (n >= 5 && n <= 24) return "Zone F";
    if (n >= 25 && n <= 48) return "Zone G";
    return "Zone H";
  }
  return "Zone A";
};

const displayNameFor = (id) => {
  if (id.startsWith("nostallnum")) return `Unnumbered Stall #${id.replace("nostallnum", "")}`;
  if (id.startsWith("empty")) return `Empty Stall #${id.replace("empty", "") || "1"}`;
  return `Stall #${id}`;
};

const catTitle = (c) => ({ meat: "Meat", fish: "Fish", veggies: "Vegetables" }[c] || c);

// Filesystem-safe id: meat-1(u2) → meat-1u2
const safeName = (category, id) => `${category}-${id}`.replace(/[()]/g, "");

const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const buildStalls = () => {
  const out = [];
  const add = (category, ids) =>
    ids.forEach((id) => {
      const zone = getStallZone(id, category);
      const zoneLetter = zone.replace("Zone ", "");
      out.push({
        category,
        rawId: id,
        zone,
        payload: `MTP:STALL:${category}-${id}@${zoneLetter}`,
        displayName: displayNameFor(id),
        file: safeName(category, id),
      });
    });
  add("meat", meatIds);
  add("fish", fishIds);
  add("veggies", veggieIds);
  return out;
};

const QR_OPTS = { errorCorrectionLevel: "M", margin: 2 };

async function main() {
  const stalls = buildStalls();

  // Fresh output dir
  await rm(OUT_DIR, { recursive: true, force: true });
  for (const c of ["meat", "fish", "veggies"]) await mkdir(join(OUT_DIR, c), { recursive: true });

  const cards = [];
  for (const s of stalls) {
    const svg = await QRCode.toString(s.payload, { ...QR_OPTS, type: "svg" });
    await writeFile(join(OUT_DIR, s.category, `${s.file}.svg`), svg, "utf8");
    await QRCode.toFile(join(OUT_DIR, s.category, `${s.file}.png`), s.payload, { ...QR_OPTS, width: 512 });
    cards.push({ ...s, svg });
  }

  // Printable contact sheet grouped by section → zone
  const byCat = { meat: [], fish: [], veggies: [] };
  cards.forEach((c) => byCat[c.category].push(c));

  let body = "";
  for (const cat of ["meat", "fish", "veggies"]) {
    const items = byCat[cat];
    if (!items.length) continue;
    body += `<h2>${catTitle(cat)} Section <span class="count">(${items.length})</span></h2>\n<div class="grid">\n`;
    for (const c of items) {
      body += `<figure class="card">
  <div class="qr">${c.svg}</div>
  <figcaption>
    <div class="name">${escapeHtml(c.displayName)}</div>
    <div class="meta">${escapeHtml(catTitle(cat))} · ${escapeHtml(c.zone)}</div>
    <div class="payload">${escapeHtml(c.payload)}</div>
  </figcaption>
</figure>\n`;
    }
    body += `</div>\n`;
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>MyTalipapa — Stall QR Codes (${cards.length})</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 24px; color: #0f172a; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #64748b; font-size: 13px; margin-bottom: 24px; }
  h2 { font-size: 16px; margin: 28px 0 12px; border-bottom: 2px solid #e8621a; padding-bottom: 4px; }
  h2 .count { color: #94a3b8; font-weight: 400; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
  .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin: 0; text-align: center; break-inside: avoid; page-break-inside: avoid; }
  .qr svg { width: 100%; height: auto; max-width: 150px; }
  .name { font-weight: 700; font-size: 13px; margin-top: 6px; }
  .meta { color: #64748b; font-size: 11px; }
  .payload { color: #94a3b8; font-size: 9px; margin-top: 4px; word-break: break-all; }
  @media print { body { margin: 8mm; } .card { border-color: #cbd5e1; } }
</style>
</head>
<body>
  <h1>MyTalipapa — Stall QR Codes</h1>
  <div class="sub">${cards.length} stalls · scan in the AR Finder to set "you are here" or navigate. Print this sheet, cut, and post each code at its stall.</div>
  ${body}
</body>
</html>`;

  await writeFile(join(OUT_DIR, "index.html"), html, "utf8");

  // Manifest — single source of truth for downstream tooling (e.g. the print PDF).
  const manifest = stalls.map((s) => ({
    category: s.category,
    rawId: s.rawId,
    zone: s.zone,
    payload: s.payload,
    displayName: s.displayName,
    png: `${s.category}/${s.file}.png`,
    svg: `${s.category}/${s.file}.svg`,
  }));
  await writeFile(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  console.log(`Generated ${cards.length} QR codes (SVG + PNG) under public/qrcodes/`);
  console.log(`  meat: ${byCat.meat.length}, fish: ${byCat.fish.length}, veggies: ${byCat.veggies.length}`);
  console.log(`Printable sheet: public/qrcodes/index.html`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
