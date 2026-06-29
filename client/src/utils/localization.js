// ─── localization.js ────────────────────────────────────────────────────────
// Indoor positioning for the enclosed market — a particle filter that fuses:
//
//   • STEP events    (pedometer): move the cloud forward along the heading.
//   • COMPASS heading: direction of travel (caller applies any bias first).
//   • ABSOLUTE fixes  (map tap / start point): collapse the cloud onto
//                      a known anchor, resetting accumulated drift to ~zero.
//
// The market is a grid of vertical aisles + three horizontal corridors, so a
// shopper is ALWAYS on a walkable line. The filter exploits that: each particle
// is weighted by how close it is to the walkable network (map-matching), which
// is what keeps dead-reckoning from sliding into stall blocks between fixes.
//
// Everything is in floor-plan PIXELS (the frame the app renders in); use
// METERS_PER_PIXEL to convert. Pure JS, no framework — driven by an event loop
// in ArFinder. Geometry comes from the single metric model (marketGraph).
// ────────────────────────────────────────────────────────────────────────────

import { AISLE_XS, CORRIDOR_YS, METERS_PER_PIXEL } from './marketGraph';

const CORRIDOR_Y_ARR = [CORRIDOR_YS.top, CORRIDOR_YS.mid, CORRIDOR_YS.bot];

// Gaussian sample (Box–Muller).
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const nearest = (val, arr) =>
  arr.reduce((best, a) => (Math.abs(a - val) < Math.abs(best - val) ? a : best), arr[0]);

// Distance (px) from a point to the nearest walkable line: either a vertical
// aisle (walkable at any y) or a horizontal corridor (walkable at any x). Mirrors
// marketGraph.snapToWalkable — small distance ⇒ on the network ⇒ high weight.
export function distToWalkable(x, y) {
  const dxAisle = Math.abs(x - nearest(x, AISLE_XS));
  const dyCorr = Math.abs(y - nearest(y, CORRIDOR_Y_ARR));
  return Math.min(dxAisle, dyCorr);
}

export class Localizer {
  /**
   * @param {{x,y,heading?}} init  starting pose (e.g. the entrance)
   * @param {object} [opts]  { particles, walkSigma, stepNoise, headingNoise }
   */
  constructor(init, opts = {}) {
    this.N = opts.particles ?? 220;
    this.walkSigma = opts.walkSigma ?? 34;   // px tolerance to the walkable network
    this.stepNoise = opts.stepNoise ?? 0.22; // ±fraction of a step length
    this.headingNoise = opts.headingNoise ?? 9; // ± degrees per step
    this.est = { x: init.x, y: init.y, heading: init.heading ?? 0, confidence: 0 };
    this.reset(init, 10);
  }

  /** Absolute fix: collapse the cloud onto an anchor (tap / start point). */
  reset({ x, y, heading }, spread = 12) {
    this.particles = Array.from({ length: this.N }, () => ({
      x: x + randn() * spread,
      y: y + randn() * spread,
      w: 1 / this.N,
    }));
    if (heading != null) this.est.heading = heading;
    this._updateEstimate(this.est.heading);
  }

  /** A detected footstep of `stepPx` pixels travelled toward `headingDeg`. */
  onStep(stepPx, headingDeg) {
    for (const p of this.particles) {
      const s = stepPx * (1 + randn() * this.stepNoise);
      const hRad = ((headingDeg + randn() * this.headingNoise) * Math.PI) / 180;
      p.x += s * Math.sin(hRad);        // compass→screen: +x = east
      p.y += s * -Math.cos(hRad);       // north = -y
      // keep inside the floor plan
      p.x = Math.max(20, Math.min(2285, p.x));
      p.y = Math.max(20, Math.min(1804, p.y));
    }
    this._weightAndResample();
    this._updateEstimate(headingDeg);
    return this.estimate();
  }

  /** Update the reported facing without moving (compass turning in place). */
  setHeading(headingDeg) {
    this.est.heading = headingDeg;
  }

  // Map-matching: weight each particle by proximity to the walkable network,
  // then systematic-resample when the effective sample size collapses.
  _weightAndResample() {
    let sum = 0;
    const s2 = 2 * this.walkSigma * this.walkSigma;
    for (const p of this.particles) {
      const d = distToWalkable(p.x, p.y);
      p.w = Math.exp(-(d * d) / s2) + 1e-6;
      sum += p.w;
    }
    for (const p of this.particles) p.w /= sum;

    let sumSq = 0;
    for (const p of this.particles) sumSq += p.w * p.w;
    const ess = 1 / sumSq;
    if (ess < this.N / 2) this._resample();
  }

  _resample() {
    const out = [];
    const step = 1 / this.N;
    let r = Math.random() * step;
    let c = this.particles[0].w;
    let i = 0;
    for (let m = 0; m < this.N; m++) {
      const u = r + m * step;
      while (u > c && i < this.N - 1) {
        i++;
        c += this.particles[i].w;
      }
      const src = this.particles[i];
      out.push({ x: src.x + randn() * 1.5, y: src.y + randn() * 1.5, w: step });
    }
    this.particles = out;
  }

  _updateEstimate(headingDeg) {
    let x = 0, y = 0, wsum = 0;
    for (const p of this.particles) {
      x += p.x * p.w;
      y += p.y * p.w;
      wsum += p.w;
    }
    x /= wsum;
    y /= wsum;
    let varSum = 0;
    for (const p of this.particles) varSum += p.w * ((p.x - x) ** 2 + (p.y - y) ** 2);
    const spread = Math.sqrt(varSum / wsum); // px std-dev of the cloud
    this.est = {
      x,
      y,
      heading: headingDeg ?? this.est.heading,
      confidence: Math.max(0, Math.min(1, 1 - spread / 130)),
      spreadM: spread * METERS_PER_PIXEL,
    };
  }

  estimate() {
    return { ...this.est };
  }
}
