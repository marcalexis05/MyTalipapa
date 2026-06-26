// build-pdf.js — package hand-designed SVGs into per-artifact PDFs.
// Each PDF = cover page + each diagram on its own page with an explanation block
// (heading + description + optional sub-process bullets). The SVG's embedded title is
// stripped so the page reads as one clean figure.
//
// Usage: put the *.svg files next to this script, edit the BUNDLES config below, then:
//   node build-pdf.js
//   <chrome> --headless=new --no-pdf-header-footer --virtual-time-budget=4000 \
//            --print-to-pdf=out.pdf file:///.../<name>.html
// (the script writes the .html files; run Chrome per file — see render loop in SKILL.md).
//
// Verify pages with PyMuPDF:  fitz.open('x.pdf')[n].get_pixmap(dpi=85).save('chk.png')

const fs = require('fs');
const read = f => fs.readFileSync(f, 'utf8');
const FONT = "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// strip embedded title + rule and crop the freed top band so explanation is the only heading
function prep(svgFile) {
  let s = read(svgFile);
  s = s.replace(/<text x="40" y="48"[\s\S]*?<\/text>/, '');
  s = s.replace(/<line x1="40" y1="64"[^>]*\/>/, '');
  s = s.replace(/viewBox="0 0 (\d+) (\d+)"/, (m, w, h) => `viewBox="0 74 ${w} ${h - 74}"`);
  return s;
}
function cover(title, sub2, note) {
  return `<section class="page cover"><div class="cov">
    <div class="brand">MyTalipapa</div>
    <div class="subtitle">Public-Market Navigation &amp; Stall-Management System</div>
    <div class="rule"></div>
    <div class="dt">${title}</div>${sub2 ? `<div class="dt2">${sub2}</div>` : ''}
    <div class="note">${note}</div>
    <div class="meta">System Design Documentation &nbsp;·&nbsp; Version 1.0 &nbsp;·&nbsp; June 2026</div>
  </div></section>`;
}
function dpage(svgFile, title, desc, bullets) {
  const lis = bullets ? `<ul class="figlist">${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : '';
  return `<section class="page diagram">
    <div class="explain"><div class="figtitle">${esc(title)}</div><div class="figdesc">${esc(desc)}</div>${lis}</div>
    <div class="figbody">${prep(svgFile)}</div></section>`;
}
function html(orient, pages) {
  const h = orient === 'landscape' ? 192 : 279;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: A4 ${orient}; margin: 9mm; }
  * { margin:0; box-sizing:border-box; } html,body { background:#fff; font-family:${FONT}; }
  .page { width:100%; height:${h}mm; page-break-after:always; display:flex; }
  .page:last-child { page-break-after:auto; }
  .cover { align-items:center; justify-content:center; }
  .diagram { flex-direction:column; }
  .explain { flex:0 0 auto; padding:1mm 3mm 2.5mm; border-bottom:1.5px solid #eef1f5; }
  .figtitle { font-size:17px; font-weight:700; color:#1F4E79; }
  .figdesc { font-size:12.3px; color:#333; margin-top:4px; line-height:1.46; }
  .figlist { font-size:12px; color:#2b3645; margin:5px 0 0 0; padding-left:16px; columns:2; column-gap:24px; }
  .figbody { flex:1 1 auto; display:flex; align-items:center; justify-content:center; min-height:0; padding-top:2mm; }
  .figbody svg { width:100%; height:100%; }
  .cov { text-align:center; }
  .brand { font-size:56px; font-weight:700; color:#1F4E79; letter-spacing:.5px; }
  .subtitle { font-size:20px; color:#555; margin-top:10px; }
  .rule { width:46%; height:3px; background:#1F4E79; margin:30px auto; border-radius:2px; }
  .dt { font-size:32px; font-weight:700; color:#14202e; }
  .dt2 { font-size:25px; font-weight:700; color:#2E5496; margin-top:6px; }
  .note { font-size:18px; font-style:italic; color:#6b7280; margin-top:22px; }
  .meta { font-size:15px; color:#8a93a0; margin-top:54px; }
  </style></head><body>${pages.join('\n')}</body></html>`;
}

// ---- EDIT THIS: one entry per output PDF ----
const BUNDLES = {
  'dfd-mgmt': { orient: 'landscape',
    pages: [
      cover('Data Flow Diagrams', 'System &amp; Management', 'Yourdon–DeMarco notation'),
      dpage('dfd-level-0-context.svg', 'DFD Level 0 — Context Diagram', '… description …'),
      dpage('dfd-level-1-system.svg', 'DFD Level 1 — System Decomposition', '… description …',
        ['1.0 …', '2.0 …', '3.0 …', '4.0 …', '5.0 …', '6.0 …']),
    ] },
  // 'erd': { orient:'landscape', pages:[ cover('Entity-Relationship Diagram','',"Crow's-foot notation"), dpage('erd.svg','Entity-Relationship Diagram','…') ] },
  // 'flow': { orient:'portrait',  pages:[ cover('Process Flowchart','Shopper Wayfinding','Standard flowchart notation'), dpage('flow.svg','Process Flowchart','…') ] },
};
for (const [name, b] of Object.entries(BUNDLES)) {
  fs.writeFileSync(name + '.html', html(b.orient, b.pages));
  console.log('built', name + '.html');
}
