import { rng, Rand } from './random';
import { splatPath, Grid } from './field';
import type { Network } from './network';
import type { Params } from './params';

// Signals spread outward from a node along the edges (shortest-path arrival times), leaving a soft wake
// that decays. Their strength fades with travelled distance, so each pulse lights a neighbourhood rather
// than the whole network. Only a handful run at once, which keeps the motion calm.

interface Pulse { dist: Float64Array; t0: number; reach: number }

const MAX_PULSES = 5;

export class Activation {
  private pulses: Pulse[] = [];
  private r: Rand;
  private net: Network;
  constructor(net: Network, seed: number) { this.net = net; this.r = rng(seed * 101 + 9); }

  // `now` in seconds of animation time; `dt` since the last step.
  step(now: number, dt: number, p: Params) {
    const reach = 0.45 * Math.max(this.net.W, this.net.H);
    this.pulses = this.pulses.filter(q => (now - q.t0) * p.actSpeed < q.reach + p.actDecay * p.actSpeed * 5);
    if (this.pulses.length < MAX_PULSES && this.r() < p.actFreq * dt) {
      const candidates = [];
      for (let i = 0; i < this.net.degree.length; i++) if (this.net.degree[i] >= 2) candidates.push(i);
      if (candidates.length) this.pulses.push({ dist: this.dijkstra(candidates[Math.floor(this.r() * candidates.length)], reach), t0: now, reach });
    }
  }

  field(g: Grid, now: number, p: Params): Float32Array | null {
    if (!this.pulses.length) return null;
    const f = new Float32Array(g.cols * g.rows), minSigma = g.sp * 0.55, tail = p.actDecay * p.actSpeed;
    for (const q of this.pulses) {
      const front = (now - q.t0) * p.actSpeed;
      for (const e of this.net.edges) {
        const da = q.dist[e.a], db = q.dist[e.b];
        if (!isFinite(da) && !isFinite(db)) continue;
        if (Math.min(da, db) > front) continue;
        splatPath(f, g, e.pts, e.cum, Math.max(minSigma, e.width * 1.1), s => {
          const arrival = Math.min(da + s, db + (e.len - s));
          const lag = front - arrival;
          if (lag < 0 || arrival > q.reach) return 0;
          const fade = 1 - arrival / q.reach;
          return Math.exp(-lag / tail) * fade * fade;
        });
      }
    }
    return f;
  }

  private dijkstra(src: number, cutoff: number): Float64Array {
    const n = this.net.degree.length, d = new Float64Array(n).fill(Infinity), heap: [number, number][] = [[0, src]];
    d[src] = 0;
    while (heap.length) {
      let bi = 0;
      for (let i = 1; i < heap.length; i++) if (heap[i][0] < heap[bi][0]) bi = i;
      const [du, u] = heap[bi]; heap[bi] = heap[heap.length - 1]; heap.pop();
      if (du > d[u] || du > cutoff) continue;
      for (const { e, o } of this.net.adj[u]) {
        const nd = du + this.net.edges[e].len;
        if (nd < d[o]) { d[o] = nd; heap.push([nd, o]); }
      }
    }
    return d;
  }
}
