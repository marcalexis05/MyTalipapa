// ─── Market navigation graph (single source of truth for routing) ────────────
//
// Both the 360° tour (MarketTour360) and the AR finder (ArFinder) route shoppers
// through the SAME market, so they must agree on where the walkable pathways are.
// This module derives that geometry *mathematically* from the stall coordinate
// dictionary (which is now aligned 1:1 with the draw.io floor-plan), instead of
// hand-typing pathway nodes that drift out of sync with the stalls.
//
// Model of the real market floor:
//   • Stalls sit in vertical COLUMNS that come in back-to-back PAIRS (one zone =
//     two columns sharing a back wall, ~150px apart). Zones are separated by a
//     wider walkable aisle (~350px apart).
//   • Shoppers walk the AISLES in those wide gaps (and along the outer walls).
//     A column only opens onto the aisle it faces — never through its back wall —
//     so a stall never exits across the neighbouring column.
//   • Only THREE horizontal pathways exist: above all stalls (top), the central
//     pathway in the gap between the top zones (A–D) and bottom zones (E–H) (mid),
//     and below all stalls by the entrance (bottom). Horizontal travel only ever
//     happens on these lines, so it never crosses a column.
//   • A route is therefore a clean orthogonal path: exit the stall sideways into
//     its aisle, walk the aisle, cross on a pathway, walk the next aisle, arrive.

import { SVG_STALL_COORDS } from './coords_dict';

const _coords = Object.values(SVG_STALL_COORDS);

// Cluster the raw stall x's into distinct columns (tolerates the few-px spread
// between fish/veggies columns that share a position).
export const COLUMN_XS = (() => {
  const xs = [...new Set(_coords.map((c) => c.x))].sort((a, b) => a - b);
  const cols = [];
  let group = [xs[0]];
  for (let i = 1; i < xs.length; i++) {
    if (xs[i] - group[group.length - 1] <= 30) group.push(xs[i]);
    else { cols.push(group); group = [xs[i]]; }
  }
  cols.push(group);
  return cols.map((g) => Math.round(g.reduce((a, b) => a + b, 0) / g.length));
})();

// Walkable vertical aisles. A gap between two columns is a real aisle only when
// it is wide (a between-zone gap); the narrow within-pair gaps are shared back
// walls and are NOT walkable. We always add a corridor along each outer wall.
export const AISLE_XS = (() => {
  const gaps = [];
  for (let i = 0; i < COLUMN_XS.length - 1; i++) gaps.push(COLUMN_XS[i + 1] - COLUMN_XS[i]);
  const minGap = Math.min(...gaps);
  const maxGap = Math.max(...gaps);
  // If columns are roughly evenly spaced (no clear pairing), treat every gap as
  // an aisle; otherwise only the wide (between-zone) gaps are aisles.
  const threshold = maxGap / minGap < 1.5 ? -Infinity : (minGap + maxGap) / 2;
  const margin = Math.round(maxGap / 2);
  const aisles = [Math.max(20, COLUMN_XS[0] - margin)]; // left wall
  for (let i = 0; i < COLUMN_XS.length - 1; i++) {
    if (gaps[i] > threshold) aisles.push(Math.round((COLUMN_XS[i] + COLUMN_XS[i + 1]) / 2));
  }
  aisles.push(COLUMN_XS[COLUMN_XS.length - 1] + margin); // right wall
  return aisles;
})();

// The three horizontal pathways. top/bot sit just outside the stall band; mid is
// detected as the widest empty horizontal band near the vertical centre (the gap
// between the top zones and bottom zones).
const _ys = _coords.map((c) => c.y);
const _minY = Math.min(..._ys);
const _maxY = Math.max(..._ys);
const _midY = (() => {
  const ys = [...new Set(_ys)].sort((a, b) => a - b);
  const lo = _minY + (_maxY - _minY) * 0.3;
  const hi = _minY + (_maxY - _minY) * 0.7;
  let best = 0;
  let mid = (_minY + _maxY) / 2;
  for (let i = 0; i < ys.length - 1; i++) {
    const g = ys[i + 1] - ys[i];
    if (ys[i] > lo && ys[i + 1] < hi && g > best) { best = g; mid = (ys[i] + ys[i + 1]) / 2; }
  }
  return Math.round(mid);
})();
export const CORRIDOR_YS = {
  top: Math.round(_minY - 40),
  mid: _midY,
  bot: Math.round(_maxY + 70),
};
const CY = [CORRIDOR_YS.top, CORRIDOR_YS.mid, CORRIDOR_YS.bot];

// Main entrance / exit: on the bottom pathway, at the most central aisle.
const _centerX = (COLUMN_XS[0] + COLUMN_XS[COLUMN_XS.length - 1]) / 2;
export const ENTRANCE = {
  x: AISLE_XS.reduce((p, c) => (Math.abs(c - _centerX) < Math.abs(p - _centerX) ? c : p)),
  y: CORRIDOR_YS.bot + 90,
};

// Physical scale. The market is ~50 m across ≈ 2000 px → 0.025 m/px. Shared by
// both views so distances and ETAs match everywhere.
export const METERS_PER_PIXEL = 0.025;

// The aisle(s) a point can reach: an aisle is reachable only if no stall column
// sits between the point and that aisle (so a stall never exits through the
// neighbouring column / its own back wall). Falls back to the single nearest
// aisle if a point is boxed in (e.g. dropped exactly on a back wall).
const aislesFor = (x) => {
  const reachable = AISLE_XS.filter((ax) => {
    const lo = Math.min(x, ax);
    const hi = Math.max(x, ax);
    return !COLUMN_XS.some((cx) => cx > lo + 1 && cx < hi - 1);
  });
  if (reachable.length) return reachable;
  return [AISLE_XS.reduce((p, c) => (Math.abs(c - x) < Math.abs(p - x) ? c : p))];
};

// Drop an arbitrary point onto the nearest walkable line (aisle or pathway), so a
// user-placed "you are here" never lands inside a stall block.
export function snapToWalkable(x, y) {
  const ax = AISLE_XS.reduce((p, c) => (Math.abs(c - x) < Math.abs(p - x) ? c : p));
  const cy = CY.reduce((p, c) => (Math.abs(c - y) < Math.abs(p - y) ? c : p));
  return Math.abs(x - ax) < Math.abs(y - cy) ? { x: ax, y } : { x, y: cy };
}

// Remove duplicate and collinear points so the path is a minimal set of corners
// (each kept interior point is an actual turn — good for turn-by-turn steps).
const simplify = (pts) => {
  const dedup = [];
  for (const p of pts) {
    const last = dedup[dedup.length - 1];
    if (!last || last.x !== p.x || last.y !== p.y) dedup.push(p);
  }
  if (dedup.length <= 2) return dedup;
  const out = [dedup[0]];
  for (let i = 1; i < dedup.length - 1; i++) {
    const a = dedup[i - 1];
    const b = dedup[i];
    const c = dedup[i + 1];
    const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if (Math.abs(cross) > 0.5) out.push(b); // keep only real corners
  }
  out.push(dedup[dedup.length - 1]);
  return out;
};

// Shortest walkable orthogonal route between two points (stall centres, the
// entrance, or any dropped position). Returns the full polyline including both
// endpoints: [from, ...corners, to].
export function findRoute(from, to) {
  if (!from || !to) return [from, to].filter(Boolean);
  if (Math.hypot(from.x - to.x, from.y - to.y) < 1) return [{ ...from }];

  const fromAisles = aislesFor(from.x);
  const toAisles = aislesFor(to.x);

  // Every aisle carries anchor nodes at the three pathways; the endpoints' own
  // aisles additionally carry an anchor at the endpoint height, so a route can
  // enter/leave the aisle level with the stall (and same-aisle trips stay in one
  // aisle without detouring to a pathway).
  const anchors = {};
  for (const ax of AISLE_XS) anchors[ax] = new Set(CY);
  for (const ax of fromAisles) anchors[ax].add(from.y);
  for (const ax of toAisles) anchors[ax].add(to.y);

  const key = (x, y) => `${x},${y}`;
  const adj = {};
  const node = (x, y) => {
    const k = key(x, y);
    if (!adj[k]) adj[k] = { x, y, edges: [] };
    return k;
  };
  const link = (ax, ay, bx, by) => {
    const ka = node(ax, ay);
    const kb = node(bx, by);
    const w = Math.abs(ax - bx) + Math.abs(ay - by);
    adj[ka].edges.push({ to: kb, w });
    adj[kb].edges.push({ to: ka, w });
  };

  // Vertical edges along each aisle (between consecutive anchors).
  for (const ax of AISLE_XS) {
    const col = [...anchors[ax]].sort((a, b) => a - b);
    for (let i = 0; i < col.length - 1; i++) link(ax, col[i], ax, col[i + 1]);
  }
  // Horizontal edges along each pathway (between consecutive aisles).
  for (const cy of CY) {
    for (let i = 0; i < AISLE_XS.length - 1; i++) link(AISLE_XS[i], cy, AISLE_XS[i + 1], cy);
  }
  // Connect the endpoints sideways into the aisle(s) they face.
  const startK = node(from.x, from.y);
  for (const ax of fromAisles) link(from.x, from.y, ax, from.y);
  const endK = node(to.x, to.y);
  for (const ax of toAisles) link(to.x, to.y, ax, to.y);

  // Dijkstra (graph is tiny — a few dozen nodes — so a simple scan is fine).
  const dist = {};
  const prev = {};
  const visited = new Set();
  for (const k of Object.keys(adj)) dist[k] = Infinity;
  dist[startK] = 0;
  while (true) {
    let u = null;
    let best = Infinity;
    for (const k of Object.keys(adj)) {
      if (!visited.has(k) && dist[k] < best) {
        best = dist[k];
        u = k;
      }
    }
    if (u === null || u === endK) break;
    visited.add(u);
    for (const e of adj[u].edges) {
      if (visited.has(e.to)) continue;
      const alt = dist[u] + e.w;
      if (alt < dist[e.to]) {
        dist[e.to] = alt;
        prev[e.to] = u;
      }
    }
  }

  // Reconstruct.
  const path = [];
  let cur = endK;
  while (cur !== undefined) {
    path.unshift({ x: adj[cur].x, y: adj[cur].y });
    cur = prev[cur];
  }
  // Fallback: if disconnected for any reason, return a direct L-shape via bottom.
  if (path.length === 0 || path[0].x !== from.x || path[0].y !== from.y) {
    return simplify([from, { x: from.x, y: CORRIDOR_YS.bot }, { x: to.x, y: CORRIDOR_YS.bot }, to]);
  }
  return simplify(path);
}

// Total walking distance of a polyline, in metres.
export function routeDistanceMeters(waypoints) {
  let m = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    m += Math.hypot(waypoints[i + 1].x - waypoints[i].x, waypoints[i + 1].y - waypoints[i].y);
  }
  return m * METERS_PER_PIXEL;
}
