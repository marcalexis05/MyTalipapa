const fs = require('fs');

// ---------- design tokens ----------
const FONT = "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const COL = {
  proc:   { fill: '#e9f1fd', stroke: '#2f6fd0', text: '#15407f' },
  ent:    { fill: '#f4f6f9', stroke: '#52617a', text: '#293445' },
  store:  { line: '#b06a12', text: '#7a4810', fill: '#fdf7ee' },
  link:   { fill: '#e6f5f1', stroke: '#0f766e', text: '#0c5f59' },
  edge:   '#6a7686',
  label:  '#39455a',
};

// ---------- low-level helpers ----------
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function tlines(cx, cy, lines, { size = 15, weight = 600, color = '#000', lh = 18 } = {}) {
  const total = (lines.length - 1) * lh;
  return lines.map((l, i) =>
    `<text x="${cx}" y="${cy - total/2 + i*lh}" text-anchor="middle" dominant-baseline="central" font-size="${size}" font-weight="${weight}" fill="${color}" font-family="${FONT}">${esc(l)}</text>`
  ).join('');
}

// rectangle external entity
function entity(cx, cy, w, h, lines) {
  const x = cx - w/2, y = cy - h/2;
  return `<g filter="url(#sh)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${COL.ent.fill}" stroke="${COL.ent.stroke}" stroke-width="2.1"/></g>`
       + tlines(cx, cy, lines, { color: COL.ent.text });
}
// circle process (Yourdon)
function proc(cx, cy, r, lines, palette = COL.proc) {
  return `<g filter="url(#sh)"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="2.4"/></g>`
       + tlines(cx, cy, lines, { size: 14, color: palette.text, lh: 16 });
}
// rounded off-page link (circle, teal)
function link(cx, cy, r, lines) {
  return proc(cx, cy, r, lines, { fill: COL.link.fill, stroke: COL.link.stroke, text: COL.link.text });
}
// DeMarco open data store: two parallel lines + left ID compartment
function store(cx, cy, w, id, name) {
  const h = 46, x = cx - w/2, y = cy - h/2, idw = 34;
  return `<g>`
    + `<line x1="${x}" y1="${y}" x2="${x+w}" y2="${y}" stroke="${COL.store.line}" stroke-width="2.4" stroke-linecap="round"/>`
    + `<line x1="${x}" y1="${y+h}" x2="${x+w}" y2="${y+h}" stroke="${COL.store.line}" stroke-width="2.4" stroke-linecap="round"/>`
    + `<line x1="${x+idw}" y1="${y}" x2="${x+idw}" y2="${y+h}" stroke="${COL.store.line}" stroke-width="2.2"/>`
    + `<text x="${x+idw/2}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="700" fill="${COL.store.text}" font-family="${FONT}">${esc(id)}</text>`
    + `<text x="${x+idw+(w-idw)/2}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="13.5" font-weight="600" fill="${COL.store.text}" font-family="${FONT}">${esc(name)}</text>`
    + `</g>`;
}

// orthogonal/straight path with rounded corners
function roundedPath(pts, r = 12) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i-1], c = pts[i], n = pts[i+1];
    const v1 = norm(sub(p, c)), v2 = norm(sub(n, c));
    const r1 = Math.min(r, dist(p, c)/2), r2 = Math.min(r, dist(n, c)/2);
    const a = add(c, mul(v1, Math.min(r1, r2))), b = add(c, mul(v2, Math.min(r1, r2)));
    d += ` L ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`;
  }
  const last = pts[pts.length-1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y}), add=(a,b)=>({x:a.x+b.x,y:a.y+b.y}), mul=(a,s)=>({x:a.x*s,y:a.y*s});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const norm=a=>{const l=Math.hypot(a.x,a.y)||1;return{x:a.x/l,y:a.y/l};};

function edge(pts, { both = false, startArrow = false } = {}) {
  const endM = 'url(#arr)';
  const startM = (both || startArrow) ? 'url(#arrS)' : '';
  return `<path d="${roundedPath(pts)}" fill="none" stroke="${COL.edge}" stroke-width="1.8" `
    + `${both||startArrow?`marker-start="${startM}" `:''}marker-end="${endM}"/>`;
}
function label(x, y, text, { w } = {}) {
  const ww = w || (String(text).length * 6.6 + 14);
  return `<g><rect x="${x-ww/2}" y="${y-11}" width="${ww}" height="22" rx="4" fill="#ffffff" opacity="0.95"/>`
    + `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="12.5" fill="${COL.label}" font-family="${FONT}">${esc(text)}</text></g>`;
}

function render(name, vb, body, title) {
  const svg = `<svg viewBox="0 0 ${vb[0]} ${vb[1]}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT}">
  <defs>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-color="#0f172a" flood-opacity="0.18"/></filter>
    <marker id="arr" markerWidth="11" markerHeight="11" refX="8.5" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 L2.6,4.5 Z" fill="${COL.edge}"/></marker>
    <marker id="arrS" markerWidth="11" markerHeight="11" refX="0.5" refY="4.5" orient="auto"><path d="M9,0 L0,4.5 L9,9 L6.4,4.5 Z" fill="${COL.edge}"/></marker>
    <marker id="mOne" markerWidth="18" markerHeight="16" refX="15" refY="8" orient="auto"><path d="M7,2 V14 M11,2 V14" stroke="${COL.edge}" stroke-width="1.7" fill="none"/></marker>
    <marker id="mMany" markerWidth="22" markerHeight="18" refX="19" refY="9" orient="auto"><circle cx="4" cy="9" r="3" fill="#fff" stroke="${COL.edge}" stroke-width="1.5"/><path d="M19,2 L10,9 L19,16" fill="none" stroke="${COL.edge}" stroke-width="1.7"/></marker>
  </defs>
  <rect x="0" y="0" width="${vb[0]}" height="${vb[1]}" fill="#ffffff"/>
  ${title ? `<text x="40" y="48" font-size="22" font-weight="700" fill="#0f172a" font-family="${FONT}">${esc(title)}</text>
  <line x1="40" y1="64" x2="${vb[0]-40}" y2="64" stroke="#e2e8f0" stroke-width="2"/>` : ''}
  ${body}
</svg>`;
  fs.writeFileSync(name + '.svg', svg);
  console.log('wrote', name + '.svg');
}

// ---------- flowchart shapes ----------
function terminator(cx, cy, w, h, text) {
  const x = cx - w/2, y = cy - h/2;
  return `<g filter="url(#sh)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h/2}" fill="#e7f6ee" stroke="#1f9d57" stroke-width="2.2"/></g>`
    + tlines(cx, cy, [text], { size: 15, color: '#0f5132' });
}
function action(cx, cy, w, h, lines) {
  const x = cx - w/2, y = cy - h/2;
  return `<g filter="url(#sh)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#e9f1fd" stroke="#2f6fd0" stroke-width="2.2"/></g>`
    + tlines(cx, cy, lines, { size: 13.5, color: '#15407f', lh: 16.5 });
}
function diamond(cx, cy, w, h, lines) {
  const p = `${cx},${cy-h/2} ${cx+w/2},${cy} ${cx},${cy+h/2} ${cx-w/2},${cy}`;
  return `<g filter="url(#sh)"><polygon points="${p}" fill="#fdf3da" stroke="#d18a16" stroke-width="2.2"/></g>`
    + tlines(cx, cy, lines, { size: 13, color: '#7c4a03', lh: 15.5 });
}
// ---------- ER table ----------
function erEntity(x, y, title, rows) {
  const cT = 74, cN = 156, cK = 46, w = cT + cN + cK, hh = 36, rh = 28, h = hh + rows.length * rh;
  let s = `<g filter="url(#sh)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="#ffffff" stroke="#2f6fd0" stroke-width="2"/></g>`;
  s += `<path d="M ${x} ${y+14} q0,-14 14,-14 h ${w-28} q14,0 14,14 v ${hh-14} h ${-w} z" fill="#e9f1fd"/>`;
  s += `<line x1="${x}" y1="${y+hh}" x2="${x+w}" y2="${y+hh}" stroke="#2f6fd0" stroke-width="1.4"/>`;
  s += `<text x="${x+w/2}" y="${y+hh/2}" text-anchor="middle" dominant-baseline="central" font-size="14.5" font-weight="700" fill="#15407f" font-family="${FONT}">${esc(title)}</text>`;
  rows.forEach((r, i) => {
    const ry = y + hh + i*rh;
    if (i > 0) s += `<line x1="${x}" y1="${ry}" x2="${x+w}" y2="${ry}" stroke="#e7edf3" stroke-width="1"/>`;
    s += `<text x="${x+9}" y="${ry+rh/2}" dominant-baseline="central" font-size="12.5" fill="#6a7a8c" font-family="${FONT}">${esc(r.type)}</text>`;
    s += `<text x="${x+cT+9}" y="${ry+rh/2}" dominant-baseline="central" font-size="12.5" font-weight="${r.key?700:500}" fill="#293445" font-family="${FONT}">${esc(r.name)}</text>`;
    if (r.key) s += `<text x="${x+cT+cN+cK/2}" y="${ry+rh/2}" text-anchor="middle" dominant-baseline="central" font-size="11.5" font-weight="700" fill="#b06a12" font-family="${FONT}">${esc(r.key)}</text>`;
  });
  return { svg: s, box: { x, y, w, h, cx: x+w/2, cy: y+h/2, r: x+w, b: y+h } };
}
// crow's-foot relationship: one (||) at A, many (o<) at B, label at mid of first segment
function rel(pts, lbl) {
  let s = `<path d="${roundedPath(pts, 10)}" fill="none" stroke="${COL.edge}" stroke-width="1.8" marker-start="url(#mOne)" marker-end="url(#mMany)"/>`;
  if (lbl) { const a = pts[Math.floor(pts.length/2)-1], b = pts[Math.floor(pts.length/2)]; s += label((a.x+b.x)/2, (a.y+b.y)/2, lbl); }
  return s;
}

module.exports = { render, entity, proc, link, store, edge, label, terminator, action, diamond, erEntity, rel, COL };
