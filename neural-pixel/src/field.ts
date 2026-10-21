import { clamp } from './random';
import { simplex, fbm } from './noise';
import type { Network } from './network';
import type { Params } from './params';

// The network becomes a continuous density field sampled on the dot grid. Every path is a chain of
// gaussian splats normalised so a lone path peaks at 1; nodes add a softer, wider bump. Nearby paths
// simply add up. The result is then shaped by low-frequency noise, a threshold and a contrast curve.

export interface Grid { cols: number; rows: number; sp: number }

export function gridOf(p: Params): Grid {
  return { cols: Math.max(1, Math.floor(p.width / p.spacing)), rows: Math.max(1, Math.floor(p.height / p.spacing)), sp: p.spacing };
}

const SQRT_2PI = Math.sqrt(2 * Math.PI);

export function splat(f: Float32Array, g: Grid, x: number, y: number, sigma: number, w: number) {
  const { cols, rows, sp } = g, r = sigma * 3, inv = 1 / (2 * sigma * sigma);
  const i0 = Math.max(0, Math.floor((x - r) / sp - 0.5)), i1 = Math.min(cols - 1, Math.ceil((x + r) / sp - 0.5));
  const j0 = Math.max(0, Math.floor((y - r) / sp - 0.5)), j1 = Math.min(rows - 1, Math.ceil((y + r) / sp - 0.5));
  for (let j = j0; j <= j1; j++) {
    const dy = (j + 0.5) * sp - y, row = j * cols;
    for (let i = i0; i <= i1; i++) {
      const dx = (i + 0.5) * sp - x, d2 = dx * dx + dy * dy;
      if (d2 < r * r) f[row + i] += w * Math.exp(-d2 * inv);
    }
  }
}

// Walks a polyline at a fixed step and splats along it; `weightAt(s)` scales each splat by arc length.
export function splatPath(f: Float32Array, g: Grid, pts: Float32Array, cum: Float32Array, sigma: number, weightAt: (s: number) => number) {
  const h = Math.max(0.5, Math.min(g.sp * 0.5, sigma * 0.5)), norm = h / (sigma * SQRT_2PI);
  const n = cum.length, total = cum[n - 1];
  for (let s = 0, k = 0; s <= total; s += h) {
    while (k < n - 2 && cum[k + 1] < s) k++;
    const seg = cum[k + 1] - cum[k] || 1, t = (s - cum[k]) / seg;
    const w = weightAt(s);
    if (w < 0.002) continue;
    splat(f, g, pts[k * 2] + (pts[k * 2 + 2] - pts[k * 2]) * t, pts[k * 2 + 1] + (pts[k * 2 + 3] - pts[k * 2 + 1]) * t, sigma, w * norm);
  }
}

export function rawField(net: Network, p: Params, g: Grid): Float32Array {
  const f = new Float32Array(g.cols * g.rows), minSigma = g.sp * 0.55;
  for (const e of net.edges) splatPath(f, g, e.pts, e.cum, Math.max(minSigma, e.width), () => 1);
  for (let i = 0; i < net.degree.length; i++) {
    const deg = net.degree[i];
    if (!deg) continue;
    splat(f, g, net.nodes[i * 2], net.nodes[i * 2 + 1], Math.max(minSigma, p.pathWidth * (1 + 0.15 * Math.min(deg, 6))), 0.35);
  }
  return f;
}

// Raw density → [0, 1]: soft saturation, low-frequency noise, a fade towards the canvas edges (margin),
// threshold, then an S-shaped contrast curve.
export function shapeField(raw: Float32Array, p: Params, g: Grid): Float32Array {
  const out = new Float32Array(raw.length), n = simplex(p.seed * 17 + 3), unit = Math.min(p.width, p.height);
  const f = (p.noiseFreq * 0.6) / unit, thr = Math.min(0.99, p.threshold), c = p.contrast, edge = Math.max(1, p.margin * unit);
  for (let j = 0; j < g.rows; j++) for (let i = 0; i < g.cols; i++) {
    const k = j * g.cols + i, x = (i + 0.5) * g.sp, y = (j + 0.5) * g.sp;
    const n01 = 0.5 + 0.5 * fbm(n, x * f, y * f, 3);
    let v = 1 - Math.exp(-raw[k] * 1.6);
    v = v * (1 - p.noiseMix + p.noiseMix * (0.3 + n01)) + p.noiseMix * 0.05 * n01;
    const e = clamp(Math.min(x, y, p.width - x, p.height - y) / edge);
    v *= e * e * (3 - 2 * e);
    v = clamp((v - thr) / (1 - thr));
    out[k] = v < 0.5 ? 0.5 * Math.pow(2 * v, c) : 1 - 0.5 * Math.pow(2 - 2 * v, c);
  }
  return out;
}
