import type { Grid } from './field';
import type { Network } from './network';
import type { Params } from './params';

// The density field drawn as a regular grid of dots. Three modes: fixed dots with variable opacity,
// halftone dots whose area follows density, and binary pixels (on/off through an ordered 4×4 threshold,
// which keeps the rhythm of the grid instead of random noise).

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const LEVELS = 32;

export interface Dot { x: number; y: number; size: number; alpha: number }

// Calls `fn` for every visible dot; `act` (activation) brightens and enlarges where signals pass.
export function eachDot(values: Float32Array, act: Float32Array | null, p: Params, g: Grid, fn: (d: Dot) => void) {
  const { cols, rows, sp } = g;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const k = j * cols + i;
    let v = values[k];
    if (act && act[k] > 0) v = Math.min(1, v + p.actIntensity * (1 - Math.exp(-act[k] * 1.5)));
    const x = (i + 0.5) * sp, y = (j + 0.5) * sp;
    if (p.mode === 'opacity') {
      const alpha = Math.round(v * LEVELS) / LEVELS;
      if (alpha > 0) fn({ x, y, size: p.dotSize, alpha });
    } else if (p.mode === 'halftone') {
      const size = p.dotSize * Math.sqrt(v);
      if (size >= 0.3) fn({ x, y, size, alpha: 1 });
    } else if (v > BAYER[(i & 3) + (j & 3) * 4]) fn({ x, y, size: p.dotSize, alpha: 1 });
  }
}

export function drawDots(ctx: CanvasRenderingContext2D, values: Float32Array, act: Float32Array | null, p: Params, g: Grid) {
  const groups = new Map<number, Dot[]>();
  eachDot(values, act, p, g, d => { let l = groups.get(d.alpha); if (!l) groups.set(d.alpha, l = []); l.push(d); });
  const round = p.shape === 'circle' && p.mode !== 'binary';
  ctx.fillStyle = p.fg;
  for (const [alpha, dots] of groups) {
    ctx.globalAlpha = alpha; ctx.beginPath();
    for (const d of dots) {
      const r = d.size / 2;
      if (round) { ctx.moveTo(d.x + r, d.y); ctx.arc(d.x, d.y, r, 0, Math.PI * 2); } else ctx.rect(d.x - r, d.y - r, d.size, d.size);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
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

export function toSvg(values: Float32Array, act: Float32Array | null, p: Params, g: Grid, transparent: boolean): string {
  const r = (v: number) => Math.round(v * 100) / 100, round = p.shape === 'circle' && p.mode !== 'binary';
  const groups = new Map<number, string[]>();
  eachDot(values, act, p, g, d => {
    let l = groups.get(d.alpha); if (!l) groups.set(d.alpha, l = []);
    const h = d.size / 2;
    l.push(round ? `<circle cx="${r(d.x)}" cy="${r(d.y)}" r="${r(h)}"/>` : `<rect x="${r(d.x - h)}" y="${r(d.y - h)}" width="${r(d.size)}" height="${r(d.size)}"/>`);
  });
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="${p.width}" height="${p.height}" viewBox="0 0 ${p.width} ${p.height}">`];
  if (!transparent) out.push(`<rect width="100%" height="100%" fill="${p.bg}"/>`);
  for (const [alpha, els] of groups) out.push(`<g fill="${p.fg}"${alpha < 1 ? ` fill-opacity="${alpha}"` : ''}>${els.join('')}</g>`);
  out.push('</svg>');
  return out.join('');
}
