// Reconcile the live DB stall set against the hardcoded AR stall list that the
// offline QR export (client/public/qrcodes) is built from.
//
// Both sources are reduced to the canonical QR payload the AR scanner reads:
//   MTP:STALL:<category>-<number>@<ZONE>
// so we can tell exactly which stickers would agree, which exist only in one
// place, and where the SAME stall has a different zone (a silent scan failure).
//
// Usage:  node src/scripts/reconcile_stall_qr.js
// Output: console summary + scratchpad/qr_reconcile_report.json

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MANIFEST = path.join(
  __dirname, '..', '..', '..', 'client', 'public', 'qrcodes', 'manifest.json'
);
const REPORT = path.join(
  __dirname, '..', '..', '..',
  'client', 'scripts', 'qr_reconcile_report.json'
);

const SECTION_TO_CATEGORY = { Meat: 'meat', Fishes: 'fish', Vegetables: 'veggies' };
const sectionToCategory = (s) => SECTION_TO_CATEGORY[s] || String(s || '').toLowerCase();

// Mirror of ArFinder.getCleanDbStallNumber — normalize for "same stall" matching.
const cleanNum = (raw) =>
  String(raw)
    .replace(/\(u\d*\)/gi, '')
    .replace(/Stall\s*#/gi, '')
    .replace('#', '')
    .trim()
    .toLowerCase()
    .replace(/^0+(?=\d)/, '');

const zoneLetter = (z) => String(z || '').replace(/zone\s*/i, '').trim().toUpperCase();

// Admin/AdminStalls.buildStallQrPayload — the sticker the app actually prints.
const dbPayload = (cat, num, zl) => `MTP:STALL:${cat}-${num}${zl ? `@${zl}` : ''}`;

async function main() {
  if (!fs.existsSync(MANIFEST)) {
    console.error(`Manifest not found: ${MANIFEST}\nRun "npm run qrcodes" in client/ first.`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

  await mongoose.connect(process.env.MONGODB_URI);
  const Stall = mongoose.model('Stall', new mongoose.Schema({}, { strict: false }), 'stalls');
  const dbStalls = await Stall.find({}).lean();
  console.log(`DB stalls: ${dbStalls.length}   |   Hardcoded export stalls: ${manifest.length}\n`);

  // Index both sides by exact payload and by (category, cleanNumber).
  const dbByPayload = new Map();
  const dbByCatNum = new Map(); // catNum -> [{zone, stallNumber, section}]
  for (const s of dbStalls) {
    const cat = sectionToCategory(s.section);
    const num = String(s.stallNumber || '').trim();
    const zl = zoneLetter(s.zone);
    const payload = dbPayload(cat, num, zl);
    dbByPayload.set(payload, s);
    const key = `${cat}-${cleanNum(num)}`;
    if (!dbByCatNum.has(key)) dbByCatNum.set(key, []);
    dbByCatNum.get(key).push({ zone: zl, stallNumber: num, section: s.section });
  }

  const codeByPayload = new Map();
  const codeByCatNum = new Map();
  for (const m of manifest) {
    codeByPayload.set(m.payload, m);
    const key = `${m.category}-${cleanNum(m.rawId)}`;
    if (!codeByCatNum.has(key)) codeByCatNum.set(key, []);
    codeByCatNum.get(key).push({ zone: zoneLetter(m.zone), rawId: m.rawId });
  }

  // 1) Exact payload matches / one-sided.
  const exactMatch = [...codeByPayload.keys()].filter((p) => dbByPayload.has(p));
  const codeOnly = [...codeByPayload.keys()].filter((p) => !dbByPayload.has(p)).sort();
  const dbOnly = [...dbByPayload.keys()].filter((p) => !codeByPayload.has(p)).sort();

  // 2) Same stall (category + clean number) but DIFFERENT zone — silent mismatch.
  const zoneMismatch = [];
  for (const [key, dbList] of dbByCatNum) {
    const codeList = codeByCatNum.get(key);
    if (!codeList) continue;
    const dbZones = new Set(dbList.map((d) => d.zone));
    const codeZones = new Set(codeList.map((c) => c.zone));
    const same = [...dbZones].some((z) => codeZones.has(z));
    if (!same) {
      zoneMismatch.push({
        stall: key,
        dbZones: [...dbZones].sort(),
        exportZones: [...codeZones].sort(),
      });
    }
  }

  // 3) Same clean stall present on both sides at all (regardless of zone).
  const sharedCatNum = [...codeByCatNum.keys()].filter((k) => dbByCatNum.has(k));

  const report = {
    generatedAt: new Date().toISOString(),
    counts: {
      db: dbStalls.length,
      export: manifest.length,
      exactPayloadMatch: exactMatch.length,
      sharedStallIgnoringZone: sharedCatNum.length,
      codeOnly: codeOnly.length,
      dbOnly: dbOnly.length,
      zoneMismatch: zoneMismatch.length,
    },
    zoneMismatch,
    codeOnly,
    dbOnly,
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));

  const pct = ((exactMatch.length / manifest.length) * 100).toFixed(1);
  console.log('── Reconciliation summary ───────────────────────────────');
  console.log(`Exact payload match : ${exactMatch.length} / ${manifest.length} export stalls (${pct}%)`);
  console.log(`Shared (ignore zone): ${sharedCatNum.length}`);
  console.log(`Zone mismatches     : ${zoneMismatch.length}`);
  console.log(`Export-only (no DB) : ${codeOnly.length}`);
  console.log(`DB-only (no sticker): ${dbOnly.length}`);

  if (zoneMismatch.length) {
    console.log('\n⚠ Zone mismatches (same stall, different zone → scan may misresolve):');
    zoneMismatch.slice(0, 40).forEach((z) =>
      console.log(`   ${z.stall}: DB=${z.dbZones.join('/')} export=${z.exportZones.join('/')}`)
    );
    if (zoneMismatch.length > 40) console.log(`   …and ${zoneMismatch.length - 40} more`);
  }
  if (dbOnly.length) {
    console.log('\nDB stalls with no matching export sticker:');
    console.log('   ' + dbOnly.join(', '));
  }
  if (codeOnly.length) {
    console.log('\nExport stickers with no matching DB stall:');
    console.log('   ' + codeOnly.join(', '));
  }
  console.log(`\nFull report: ${REPORT}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
