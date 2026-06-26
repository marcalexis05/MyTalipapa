const G = require('./gen');
const { entity, proc, edge, label } = G;

const VB = [1260, 820];
const C = { x: 630, y: 430 }, R = 96;

// external entities: [cx, cy, label-lines]
const E = {
  shopper:    { x: 175, y: 430, w: 184, h: 62, t: ['Shopper / Visitor'] },
  renter:     { x: 390, y: 165, w: 184, h: 62, t: ['Renter / Applicant'] },
  contractor: { x: 880, y: 165, w: 184, h: 62, t: ['Contractor'] },
  admin:      { x: 1085, y: 430, w: 168, h: 62, t: ['Admin'] },
  notif:      { x: 630, y: 705, w: 210, h: 62, t: ['Notification Gateway'] },
};

const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y}), add=(a,b)=>({x:a.x+b.x,y:a.y+b.y}), mul=(a,s)=>({x:a.x*s,y:a.y*s});
const norm=a=>{const l=Math.hypot(a.x,a.y)||1;return{x:a.x/l,y:a.y/l};};
const rectHit=(e,dir)=>{ const t=Math.min((e.w/2)/(Math.abs(dir.x)||1e-6),(e.h/2)/(Math.abs(dir.y)||1e-6)); return add(e,mul(dir,t)); };

let body = '';
const conns = [];
// each: entity key, outbound label, inbound label (inbound omitted -> one way)
const SPEC = [
  ['shopper',   'search · navigate · scan QR',     'route · stall info · 360°'],
  ['renter',    'register · apply · pay · appeal',  'status · payment · reason'],
  ['contractor','review · toggle stall · contract', 'applications · records'],
  ['admin',     'approve · QR · query',             'dashboards · records'],
  ['notif',     null,                               'email / SMS messages'],
];
for (const [k, out, inb] of SPEC) {
  const e = E[k];
  const dir = norm(sub(C, e));        // entity -> center
  const perp = { x: -dir.y, y: dir.x };
  const eHit = rectHit(e, dir);
  const cHit = sub(C, mul(dir, R));   // on circle boundary
  const off = (inb && out) ? 8 : 0;
  if (out) conns.push(edge([add(eHit, mul(perp, off)), add(cHit, mul(perp, off))]));
  if (inb) conns.push(edge([sub(cHit, mul(perp, off)), sub(eHit, mul(perp, off))]));
  // label positions: along the line, offset to its own side
  const mid = mul(add(eHit, cHit), 0.5);
  if (out) body += label(add(mid, mul(perp, off + 13)).x, add(mid, mul(perp, off + 13)).y, out);
  if (inb) { const m2 = mul(add(eHit, cHit), 0.5); body += label(sub(m2, mul(perp, off + 13)).x, sub(m2, mul(perp, off + 13)).y, inb); }
}

body += conns.join('\n');
// entities + process on top of lines
for (const k in E) { const e = E[k]; body += entity(e.x, e.y, e.w, e.h, e.t); }
body += proc(C.x, C.y, R, ['0', 'MyTalipapa', 'System']);

G.render('l0', VB, body, 'MyTalipapa — Context Diagram (DFD Level 0)');
