// ─── panoGraph.js ─────────────────────────────────────────────────────────────
// Single source of truth for 360° panorama navigation.
//
// Builds a graph where every node is a navigable panorama (stall or hallway)
// and edges connect physically adjacent panoramas.  Click-to-navigate picks
// the neighbor closest to the tap direction — no more brute-force scanning.
//
// Stall positions and capture headings come from floorModel.js — the single
// metric source of truth. This module just assembles them into a nav graph.
// Hallway positions are mapped from the annotated floor-plan image.
// Edges are computed algorithmically from the grid structure.
// ──────────────────────────────────────────────────────────────────────────────

import { SVG_STALL_COORDS } from './coords_dict.js';
import { getCaptureHeading } from './floorModel.js';

// ═══════════════════════════════════════════════════════════════════════════════
// HALLWAY DEFINITIONS — manually mapped from annotated floor plan
// ═══════════════════════════════════════════════════════════════════════════════

// Hallways removed as there are no actual hallway photos in export360
// Connecting stalls directly across gaps and aisles


// ═══════════════════════════════════════════════════════════════════════════════
// GRAPH CONSTRUCTION
// ═══════════════════════════════════════════════════════════════════════════════

export function buildGraph() {
  const nodes = {};
  const edges = {};

  // ─── 1. Nodes: ALL STALLS ───────────────────────────────────────────────
  for (const [key, coords] of Object.entries(SVG_STALL_COORDS)) {
    const dashIdx = key.indexOf('-');
    const category = key.substring(0, dashIdx);
    const stallId  = key.substring(dashIdx + 1);

    nodes[key] = {
      x: coords.x,
      y: coords.y,
      northOffset: getCaptureHeading(category, stallId, coords.x),
      type: 'stall',
      category,
      stallId,
    };
    edges[key] = [];
  }

  // ─── 3. Edges: stalls in same column (vertical neighbors) ─────────────
  // Group stalls by X column (within 25px tolerance)
  const columns = {};
  for (const [id, node] of Object.entries(nodes)) {
    if (node.type !== 'stall') continue;
    const colKey = Math.round(node.x / 25) * 25;
    if (!columns[colKey]) columns[colKey] = [];
    columns[colKey].push(id);
  }

  for (const stallIds of Object.values(columns)) {
    // Sort by Y (top to bottom)
    stallIds.sort((a, b) => nodes[a].y - nodes[b].y);
    
    // Split into contiguous segments based on large gaps
    const segments = [];
    let currentSegment = [stallIds[0]];
    
    for (let i = 0; i < stallIds.length - 1; i++) {
      const gap = nodes[stallIds[i + 1]].y - nodes[stallIds[i]].y;
      if (gap < 500) {
        addEdge(edges, stallIds[i], stallIds[i + 1]);
        currentSegment.push(stallIds[i + 1]);
      } else {
        segments.push(currentSegment);
        currentSegment = [stallIds[i + 1]];
      }
    }
    segments.push(currentSegment);
  }

  // ─── 7. Cross-aisle connections (stalls facing each other across aisle) ─
  // For each pair of adjacent column X values that share an aisle,
  // connect stalls at similar Y heights
  const colKeys = Object.keys(columns).map(Number).sort((a, b) => a - b);
  for (let ci = 0; ci < colKeys.length - 1; ci++) {
    const leftX = colKeys[ci];
    const rightX = colKeys[ci + 1];
    const gap = rightX - leftX;
    // Connect across all aisles, even wide ones between zones (~350px)
    if (gap > 500) continue;

    const leftStalls = columns[leftX];
    const rightStalls = columns[rightX];
    for (const leftId of leftStalls) {
      for (const rightId of rightStalls) {
        const yDiff = Math.abs(nodes[leftId].y - nodes[rightId].y);
        // Connect stalls at same Y height across the aisle
        if (yDiff < 40) {
          addEdge(edges, leftId, rightId);
        }
      }
    }
  }

  return { nodes, edges };
}


// ─── Helper: add a bidirectional edge ────────────────────────────────────────
function addEdge(edges, a, b) {
  if (!edges[a]) edges[a] = [];
  if (!edges[b]) edges[b] = [];
  if (!edges[a].includes(b)) edges[a].push(b);
  if (!edges[b].includes(a)) edges[b].push(a);
}


// ═══════════════════════════════════════════════════════════════════════════════
// BUILD & EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

const _graph = buildGraph();

/** Every navigable panorama node (stalls + hallways) */
export const PANO_NODES = _graph.nodes;

/** Adjacency list: nodeId → [neighborId, …] */
export const PANO_EDGES = _graph.edges;


// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Look up the panoGraph node ID for a stall, given its raw ID and category.
 * Handles the coords_dict key format: "meat-1", "fish-20", "veggies-48", etc.
 */
export function getStallNodeId(stallId, category) {
  if (PANO_NODES[stallId]) return stallId;

  const raw = `${category}-${stallId}`;
  if (PANO_NODES[raw]) return raw;

  // Try cleaning (u), (u2), # prefixes
  const clean = String(stallId)
    .replace(/\(u\d*\)/gi, '')
    .replace(/Stall\s*#/gi, '')
    .replace('#', '')
    .trim()
    .toLowerCase()
    .replace(/^0+(?=\d)/, '');
  const cleanKey = `${category}-${clean}`;
  if (PANO_NODES[cleanKey]) return cleanKey;

  return raw; // fallback — may not exist in graph
}

/**
 * Compute the compass angle (0=north, 90=east, 180=south, 270=west) from
 * node `fromId` to node `toId` on the 2D floor plan.
 */
export function getAngleBetween(fromId, toId) {
  const from = PANO_NODES[fromId];
  const to   = PANO_NODES[toId];
  if (!from || !to) return 0;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // atan2(dy, dx) → 0=east. Convert to compass: 0=north(up/-y), 90=east(+x)
  return ((Math.atan2(dy, dx) * 180 / Math.PI) + 450) % 360;
}

/**
 * Given a node and a compass tap angle, find the neighbor closest to that direction.
 * Returns { neighborId, angleDiff } or null if no neighbor within threshold.
 */
export function findBestNeighbor(nodeId, tapCompassAngle, maxAngleDiff = 75) {
  const neighbors = PANO_EDGES[nodeId];
  if (!neighbors || neighbors.length === 0) return null;

  let bestId = null;
  let bestDiff = Infinity;

  for (const nId of neighbors) {
    const angle = getAngleBetween(nodeId, nId);
    let diff = Math.abs(angle - tapCompassAngle);
    if (diff > 180) diff = 360 - diff;

    if (diff < bestDiff) {
      bestDiff = diff;
      bestId = nId;
    }
  }

  if (bestId && bestDiff <= maxAngleDiff) {
    return { neighborId: bestId, angleDiff: bestDiff };
  }
  return null;
}
