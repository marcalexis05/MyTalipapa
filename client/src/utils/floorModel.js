// ─── floorModel.js ──────────────────────────────────────────────────────────
// THE 2D METRIC FOUNDATION — single source of truth for the market floor.
//
// Everything that needs to know "where is X and which way does it face" reads
// from here, in ONE coordinate frame:
//
//   • Frame:   the draw.io floor-plan pixel grid, origin at top-left.
//              +x = east (right), +y = south (down).  North = up = -y.
//   • Scale:   METERS_PER_PIXEL (shared with marketGraph) gives a true metric
//              frame, so the same model feeds distances, ETAs, AR projection,
//              and (next) the marker-anchored localization filter.
//   • Heading: compass degrees — 0 = map-north, 90 = east, 180 = south, 270 = west.
//
// This module DOES NOT change the live 360 behavior. It reproduces exactly the
// capture headings the panorama view uses today (previously buried in
// panoGraph.getStallNorthOffset), but as structured, data-derived records:
//   - a geometric DEFAULT (which aisle the stall opens onto), plus
//   - an explicit OVERRIDE table for panos physically shot facing another way.
//
// Once markers carry surveyed poses, this is where their absolute (x, y, θ)
// fixes live too — see ANCHORS below.
// ────────────────────────────────────────────────────────────────────────────

import { SVG_STALL_COORDS } from './coords_dict.js';
import { METERS_PER_PIXEL } from './marketGraph.js';

export { METERS_PER_PIXEL };

// ═══════════════════════════════════════════════════════════════════════════
// METRIC FRAME
// ═══════════════════════════════════════════════════════════════════════════

/** Convert a floor-plan pixel point to metres (same origin, +y = south). */
export const pxToMeters = ({ x, y }) => ({ x: x * METERS_PER_PIXEL, y: y * METERS_PER_PIXEL });

/** Convert a metric point back to floor-plan pixels. */
export const metersToPx = ({ x, y }) => ({ x: x / METERS_PER_PIXEL, y: y / METERS_PER_PIXEL });

/**
 * Compass heading (0=N, 90=E, 180=S, 270=W) of the vector from point `a` to `b`.
 * Works in either pixels or metres — both frames share orientation. North is -y.
 */
export const headingBetween = (a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
};

// ═══════════════════════════════════════════════════════════════════════════
// CAPTURE HEADING — the direction a panorama faces at its forward (theta = 0)
// ═══════════════════════════════════════════════════════════════════════════
//
// Reproduces panoGraph.getStallNorthOffset() exactly, but split into:
//   1. a geometric base from which aisle the stall column opens onto, and
//   2. an explicit override map for photos shot facing a non-default direction.

// Left columns of each back-to-back zone pair face EAST (toward the aisle on
// their right). A camera shooting them straight-on therefore faces WEST? — no:
// the stored convention is the panorama's forward heading. Left col → 90, right
// col → 270, matching the values the live 360 view consumes today.
export const LEFT_COLUMN_XS = [317, 817, 1317, 1807, 1812];

const isLeftColumn = (x) => LEFT_COLUMN_XS.some((lx) => Math.abs(x - lx) < 25);

// Geometric default capture heading for a stall column.
const baseCaptureHeading = (x) => (isLeftColumn(x) ? 90 : 270);

// Explicit overrides for panoramas physically shot facing another way. These are
// real photographic facts that cannot be derived from the floor plan, so they
// live here as data instead of as conditionals. `match(category, idNum, stallId)`.
export const CAPTURE_HEADING_OVERRIDES = [
  // The "1(u)" upper-floor meat twin was shot facing west.
  { heading: 270, match: (_cat, _id, stallId) => stallId === '1(u)' },
  // Meat 1-11 were shot walking North down the hallway
  { heading: 0, match: (cat, id) => cat === 'meat' && id >= 1 && id <= 11 },
  // Zone-E meat 21–23, Zone-A fish 11–20, and Zone-A meat 12–24 were shot facing south.
  { heading: 180, match: (cat, id) => cat === 'meat' && id >= 21 && id <= 23 },
  { heading: 180, match: (cat, id) => cat === 'fish' && id >= 11 && id <= 20 },
  { heading: 180, match: (cat, id) => cat === 'meat' && id >= 12 && id <= 24 },
];

/**
 * The capture (forward / theta=0) heading for a stall's panorama, in compass
 * degrees. Drop-in replacement for panoGraph.getStallNorthOffset — identical
 * numbers, single source of truth.
 */
export function getCaptureHeading(category, stallId, x) {
  // Resolve x from the model when the caller doesn't supply it.
  if (x === undefined) {
    const rec = SVG_STALL_COORDS[`${category}-${stallId}`];
    x = rec ? rec.x : 0;
  }
  const idNum = parseInt(stallId);
  for (const o of CAPTURE_HEADING_OVERRIDES) {
    if (o.match(category, idNum, stallId)) return o.heading;
  }
  return baseCaptureHeading(x);
}

// ═══════════════════════════════════════════════════════════════════════════
// FLOOR STALLS — every stall as a metric record
// ═══════════════════════════════════════════════════════════════════════════

/**
 * id            "meat-1"  (coords_dict key)
 * category      "meat" | "fish" | "veggies"
 * stallId       raw id, e.g. "1", "1(u)", "empty2"
 * px            { x, y }   floor-plan pixels
 * m             { x, y }   metres
 * side          "left" | "right" column
 * captureHeading  pano forward heading (compass deg) — what the 360 view uses
 * facing        compass direction the stall OPENING faces (toward its aisle)
 */
export const FLOOR_STALLS = Object.fromEntries(
  Object.entries(SVG_STALL_COORDS).map(([id, px]) => {
    const dash = id.indexOf('-');
    const category = id.slice(0, dash);
    const stallId = id.slice(dash + 1);
    const side = isLeftColumn(px.x) ? 'left' : 'right';
    return [
      id,
      {
        id,
        category,
        stallId,
        px: { ...px },
        m: pxToMeters(px),
        side,
        captureHeading: getCaptureHeading(category, stallId, px.x),
        facing: side === 'left' ? 90 : 270, // opening faces the aisle it fronts
      },
    ];
  })
);

/** Look up a floor-stall record by category + raw stall id. */
export function getFloorStall(category, stallId) {
  return FLOOR_STALLS[`${category}-${stallId}`] || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANCHORS — absolute fix points for localization (entrances / start points)
// ═══════════════════════════════════════════════════════════════════════════
//
// Tier-1 of the localization plan resets drift whenever the camera sees one of
// these. Positions are authoritative (from the floor plan). `heading` is the
// way a shopper faces when reading the marker; entrances have sensible defaults,
// stall markers are provisional (= the stall's capture heading) until surveyed.

export const LANDMARK_ANCHORS = [
  { id: 'entrance',             label: 'Main Entrance & Exit',    px: { x: 1050, y: 1720 }, heading: 0 },
  { id: 'shortcut_top',         label: 'Top Shortcut',            px: { x: 1050, y: 100  }, heading: 180 },
  { id: 'shortcut_right',       label: 'Right Shortcut',          px: { x: 2120, y: 910  }, heading: 270 },
  { id: 'shortcut_bottom_right',label: 'Bottom Right Exit',       px: { x: 2120, y: 1720 }, heading: 315 },
  { id: 'shortcut_bottom_left', label: 'Bottom Left Exit',        px: { x: 30,   y: 1720 }, heading: 45  },
  { id: 'guardhouse',           label: 'Guard House Side',        px: { x: 30,   y: 100  }, heading: 135 },
].map((a) => ({ ...a, m: pxToMeters(a.px), kind: 'landmark' }));

/**
 * Every stall doubles as a map marker anchor. Position is exact; heading is the
 * shopper's facing when scanning (≈ into the stall) — provisional until the
 * markers are physically deployed and surveyed.
 */
export const STALL_ANCHORS = Object.values(FLOOR_STALLS).map((s) => ({
  id: s.id,
  label: `${s.category} ${s.stallId}`,
  px: s.px,
  m: s.m,
  heading: (s.captureHeading + 180) % 360, // face the stall, opposite the pano forward
  provisional: true,
  kind: 'stall',
}));

/** All localization anchors (landmarks + stalls), keyed by id. */
export const ANCHORS = Object.fromEntries(
  [...LANDMARK_ANCHORS, ...STALL_ANCHORS].map((a) => [a.id, a])
);

export function getAnchor(id) {
  return ANCHORS[id] || null;
}
