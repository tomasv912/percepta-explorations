import { rng } from './random';

// 2D simplex noise with a seeded permutation, plus fBm and domain warping built on it.

const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
const GRAD = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];

export type Noise2 = (x: number, y: number) => number;

export function simplex(seed: number): Noise2 {
  const r = rng(seed), p = new Uint8Array(512);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 256; i++) p[i + 256] = p[i];
  const corner = (gi: number, x: number, y: number) => {
    const t = 0.5 - x * x - y * y;
    if (t < 0) return 0;
    const g = GRAD[gi & 7];
    return t * t * t * t * (g[0] * x + g[1] * y);
  };
  return (xin, yin) => {
    const s = (xin + yin) * F2, i = Math.floor(xin + s), j = Math.floor(yin + s);
    const t = (i + j) * G2, x0 = xin - (i - t), y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    return 70 * (corner(p[ii + p[jj]], x0, y0) + corner(p[ii + i1 + p[jj + j1]], x1, y1) + corner(p[ii + 1 + p[jj + 1]], x2, y2));
  };
}

// Fractal Brownian motion, roughly in [-1, 1].
export function fbm(n: Noise2, x: number, y: number, octaves: number): number {
  let s = 0, a = 0.5, f = 1, norm = 0;
  for (let o = 0; o < octaves; o++) {
    s += a * n(x * f + o * 19.7, y * f - o * 7.3);
    norm += a; f *= 2.02; a *= 0.5;
  }
  return s / norm;
}

export interface WarpParams { noiseFreq: number; noiseAmp: number; octaves: number; warp: number }

// Domain-warped displacement: a continuous map of the plane, so it bends paths without changing topology.
export function makeWarp(seed: number, W: number, H: number, wp: WarpParams) {
  const n = simplex(seed * 31 + 5), unit = Math.min(W, H), f = wp.noiseFreq / unit, amp = wp.noiseAmp * unit;
  return (x: number, y: number): [number, number] => {
    if (amp === 0) return [x, y];
    const u = x * f, v = y * f;
    const qx = fbm(n, u + 1.7, v + 9.2, wp.octaves), qy = fbm(n, u + 8.3, v + 2.8, wp.octaves);
    const w = wp.warp * 4;
    const rx = fbm(n, u + w * qx + 4.1, v + w * qy + 1.3, wp.octaves);
    const ry = fbm(n, u + w * qx + 7.7, v + w * qy + 5.9, wp.octaves);
    return [x + rx * amp, y + ry * amp];
  };
}
