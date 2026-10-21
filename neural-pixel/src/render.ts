import { rng, clamp } from './random';
import { simplex, fbm } from './noise';
import type { Grid } from './field';
import type { Network } from './network';
import type { Params } from './params';

// The density field becomes loose pixels, not a grid: positions are drawn from the field's cumulative
// distribution, so pixels land anywhere inside a cell, overlap, knot into clumps and thin out at the edges,
// with a few strays drifting just outside the structure. Mono keeps every pixel the same size and colour;
// Variación lets size follow density and spreads the ink over a few shades.

export const STRIDE = 5; // x, y, size, shade, field cell
const SHADES = 9, MONO_SHADE = (SHADES - 1) / 2; // the middle shade is the ink itself

export function scatterPixels(values: Float32Array, p: Params, g: Grid): Float32Array {
  const { cols, rows, sp } = g, n = cols * rows, r = rng(p.seed * 7 + 11), mono = p.style === 'mono';
  // High-frequency knots pull pixels into clusters and leave gaps along the paths.
  const nz = simplex(p.seed * 13 + 1), kf = (p.noiseFreq * 6) / Math.min(p.width, p.height);
  const body = new Float32Array(n);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const k = j * cols + i, v = values[k];
    if (v <= 0) continue;
    const knot = Math.max(0, 0.5 + fbm(nz, (i + 0.5) * sp * kf, (j + 0.5) * sp * kf, 3) * 1.6) ** 2.2;
    body[k] = v ** 1.2 * Math.max(0.02, 1 - p.clump + p.clump * knot);
  }
  const strays = Math.round(p.count * p.stragglers);
  const out = new Float32Array(p.count * STRIDE);
  let got = 0;
  const sample = (dens: Float32Array, count: number, stray: boolean) => {
    const cdf = new Float64Array(n); let sum = 0;
    for (let k = 0; k < n; k++) cdf[k] = sum += dens[k];
    if (sum <= 0) return;
    for (let c = 0; c < count; c++) {
      const t = r() * sum; let lo = 0, hi = n - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (cdf[mid] < t) lo = mid + 1; else hi = mid; }
      const i = lo % cols, j = (lo - i) / cols, v = values[lo];
      const size = mono ? p.size
        : p.size * ((1 - p.mod) + p.mod * Math.sqrt(Math.max(v, 0.04))) * Math.max(0.15, 1 + p.variation * (r() * 2 - 1) * 0.7) * (stray ? 0.7 : 1);
      const o = got++ * STRIDE;
      out[o] = (i + r()) * sp; out[o + 1] = (j + r()) * sp; out[o + 2] = size;
      out[o + 3] = mono ? MONO_SHADE : Math.floor(r() * SHADES); out[o + 4] = lo;
    }
  };
  sample(body, p.count - strays, false);
  sample(haloOf(values, cols, rows), strays, true);
  return out.subarray(0, got * STRIDE);
}

// A soft band just outside the structure where loose pixels drift.
function haloOf(values: Float32Array, w: number, h: number): Float32Array {
  const r = Math.max(2, Math.round(Math.max(w, h) / 40)), a = new Float32Array(values.length), b = new Float32Array(values.length);
  for (let k = 0; k < values.length; k++) a[k] = values[k] > 0.02 ? 1 : 0;
  const pass = (src: Float32Array, dst: Float32Array, len: number, step: number, lines: number, lineStep: number) => {
    for (let l = 0; l < lines; l++) {
      const base = l * lineStep; let s = 0;
      for (let t = -r; t <= r; t++) s += src[base + Math.min(len - 1, Math.max(0, t)) * step];
      for (let t = 0; t < len; t++) {
        dst[base + t * step] = s / (2 * r + 1);
        s += src[base + Math.min(len - 1, t + r + 1) * step] - src[base + Math.max(0, t - r) * step];
      }
    }
  };
  for (let it = 0; it < 2; it++) { pass(a, b, w, 1, h, w); pass(b, a, h, w, w, 1); }
  for (let k = 0; k < values.length; k++) a[k] *= 1 - Math.min(1, values[k] * 4);
  return a;
}

// ---------- Colour (OKLab), one ink split into shades ----------
const toLin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => Math.round(255 * clamp(c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
export function buildShades(hex: string, grain: number): string[] {
  const n = parseInt(hex.slice(1), 16), R = toLin((n >> 16) & 255), G = toLin((n >> 8) & 255), B = toLin(n & 255);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B), m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B), s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const shades: string[] = [];
  for (let i = 0; i < SHADES; i++) {
    const Li = L + (i / (SHADES - 1) * 2 - 1) * grain;
    const l3 = (Li + 0.3963377774 * A + 0.2158037573 * Bb) ** 3, m3 = (Li - 0.1055613458 * A - 0.0638541728 * Bb) ** 3, s3 = (Li - 0.0894841775 * A - 1.291485548 * Bb) ** 3;
    const rgb = [4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3, -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3, -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3];
    shades.push('#' + rgb.map(c => toSrgb(c).toString(16).padStart(2, '0')).join(''));
  }
  return shades;
}

// ---------- Drawing ----------
// Activation swells the pixels it passes over; their positions never move, so the motion stays calm.
function eachPixel(items: Float32Array, act: Float32Array | null, p: Params, fn: (x: number, y: number, size: number, shade: number) => void) {
  for (let o = 0; o < items.length; o += STRIDE) {
    let size = items[o + 2];
    if (act) { const a = act[items[o + 4]]; if (a > 0) size *= 1 + p.actIntensity * 1.3 * (1 - Math.exp(-a * 1.5)); }
    fn(items[o], items[o + 1], size, items[o + 3]);
  }
}

export function drawPixels(ctx: CanvasRenderingContext2D, items: Float32Array, act: Float32Array | null, p: Params, shades: string[]) {
  const groups: number[][] = shades.map(() => []);
  eachPixel(items, act, p, (x, y, s, k) => groups[k].push(x, y, s));
  const round = p.shape === 'circle';
  groups.forEach((g, k) => {
    if (!g.length) return;
    ctx.fillStyle = shades[k]; ctx.beginPath();
    for (let i = 0; i < g.length; i += 3) {
      const x = g[i], y = g[i + 1], h = g[i + 2] / 2;
      if (round) { ctx.moveTo(x + h, y); ctx.arc(x, y, h, 0, Math.PI * 2); } else ctx.rect(x - h, y - h, h * 2, h * 2);
    }
    ctx.fill();
  });
}

const KIND_COLOR = { core: '#e4572e', loop: '#f2a541', bridge: '#2e86de', branch: '#38b27b' } as const;

export function drawDebug(ctx: CanvasRenderingContext2D, net: Network, scale: number) {
  ctx.save();
  ctx.lineWidth = 1 / scale; ctx.globalAlpha = 0.85;
  for (const e of net.edges) {
    ctx.strokeStyle = KIND_COLOR[e.kind]; ctx.beginPath();
    for (let i = 0; i < e.pts.length; i += 2) i ? ctx.lineTo(e.pts[i], e.pts[i + 1]) : ctx.moveTo(e.pts[i], e.pts[i + 1]);
    ctx.stroke();
  }
  ctx.fillStyle = '#111';
  for (let i = 0; i < net.degree.length; i++) {
    if (!net.degree[i]) continue;
    const r = (1.5 + Math.min(net.degree[i], 6) * 0.5) / scale;
    ctx.beginPath(); ctx.arc(net.nodes[i * 2], net.nodes[i * 2 + 1], r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function toSvg(items: Float32Array, act: Float32Array | null, p: Params, shades: string[], transparent: boolean): string {
  const r = (v: number) => Math.round(v * 100) / 100, round = p.shape === 'circle';
  const groups: string[][] = shades.map(() => []);
  eachPixel(items, act, p, (x, y, s, k) => {
    const h = s / 2;
    groups[k].push(round ? `<circle cx="${r(x)}" cy="${r(y)}" r="${r(h)}"/>` : `<rect x="${r(x - h)}" y="${r(y - h)}" width="${r(s)}" height="${r(s)}"/>`);
  });
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="${p.width}" height="${p.height}" viewBox="0 0 ${p.width} ${p.height}">`];
  if (!transparent) out.push(`<rect width="100%" height="100%" fill="${p.bg}"/>`);
  groups.forEach((els, k) => { if (els.length) out.push(`<g fill="${shades[k]}">${els.join('')}</g>`); });
  out.push('</svg>');
  return out.join('');
}
