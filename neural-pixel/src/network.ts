import { rng, range, gaussian, clamp, Rand } from './random';
import { makeWarp } from './noise';
import type { Params } from './params';

// The underlying spatial network. Clusters of nodes are tied together by minimum spanning trees, thickened
// with a few nearest-neighbour loops, linked to each other by occasional long pathways, and grown outwards
// with dendrite-like branches. Every edge becomes a smooth curve, and the whole thing is bent by a
// domain-warped noise field (a continuous map, so the topology survives).

export type EdgeKind = 'core' | 'loop' | 'bridge' | 'branch';

export interface Edge {
  a: number;
  b: number;
  kind: EdgeKind;
  width: number;       // gaussian sigma of the path, in px
  pts: Float32Array;   // deformed curve, x/y pairs
  cum: Float32Array;   // arc length at each point
  len: number;
}

export interface Network {
  W: number;
  H: number;
  nodes: Float32Array;  // deformed node positions, x/y pairs
  degree: Int32Array;
  edges: Edge[];
  adj: { e: number; o: number }[][];
}

interface Cluster { x: number; y: number; sx: number; sy: number; rot: number; weight: number; nodes: number[] }

const SAMPLE_STEP = 3; // px between points on a curve

export function generateNetwork(p: Params): Network {
  const W = p.width, H = p.height, r = rng(p.seed), mx = W * p.margin, my = H * p.margin;
  const xs: number[] = [], ys: number[] = [];
  const addNode = (x: number, y: number) => { xs.push(clamp(x, mx, W - mx)); ys.push(clamp(y, my, H - my)); return xs.length - 1; };
  const raw: { a: number; b: number; kind: EdgeKind; width: number }[] = [];
  const seen = new Set<string>();
  const link = (a: number, b: number, kind: EdgeKind, width: number) => {
    if (a === b) return;
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    if (seen.has(key)) return;
    seen.add(key); raw.push({ a, b, kind, width });
  };
  const dist = (a: number, b: number) => Math.hypot(xs[a] - xs[b], ys[a] - ys[b]);

  // 1. Cluster centres, spread out by dart throwing, each an elongated, rotated gaussian.
  const K = Math.max(1, Math.round(p.clusters)), cell = Math.sqrt((W * H) / K);
  const clusters: Cluster[] = [];
  for (let tries = 0; clusters.length < K && tries < K * 60; tries++) {
    const x = range(r, 0.12, 0.88) * W, y = range(r, 0.14, 0.86) * H;
    if (clusters.some(c => Math.hypot(c.x - x, c.y - y) < cell * 0.55)) continue;
    const s = cell * 0.26 * range(r, 0.6, 1.35), aspect = range(r, 0.4, 1);
    clusters.push({ x, y, sx: s, sy: s * aspect, rot: r() * Math.PI, weight: range(r, 0.4, 1.6), nodes: [] });
  }
  const totalW = clusters.reduce((s, c) => s + c.weight, 0);

  // 2. Nodes: most belong to clusters, a few form loose fragments elsewhere.
  const strayCount = Math.round(p.nodes * 0.05);
  for (const c of clusters) {
    const n = Math.max(3, Math.round(((p.nodes - strayCount) * c.weight) / totalW));
    const cr = Math.cos(c.rot), sr = Math.sin(c.rot);
    for (let i = 0; i < n; i++) {
      const u = gaussian(r) * c.sx, v = gaussian(r) * c.sy;
      c.nodes.push(addNode(c.x + u * cr - v * sr, c.y + u * sr + v * cr));
    }
  }

  // 3. Inside each cluster: an MST for the backbone, then short nearest-neighbour loops.
  for (const c of clusters) {
    const mean = mst(c.nodes, dist, (a, b) => link(a, b, 'core', p.pathWidth * range(r, 0.9, 1.3)));
    for (const a of c.nodes) {
      const near = c.nodes.filter(b => b !== a).sort((x, y) => dist(a, x) - dist(a, y)).slice(0, 3);
      for (const b of near) if (r() < p.connectivity * 0.7 && dist(a, b) < mean * 1.8) link(a, b, 'loop', p.pathWidth * 0.75);
    }
  }

  // 4. Long pathways between clusters along their own spanning tree; some are left out on purpose.
  const centers = clusters.map((c, i) => i);
  const cdist = (i: number, j: number) => Math.hypot(clusters[i].x - clusters[j].x, clusters[i].y - clusters[j].y);
  const bridge = (i: number, j: number) => {
    let best = [-1, -1], bd = Infinity;
    for (const a of clusters[i].nodes) for (const b of clusters[j].nodes) { const d = dist(a, b); if (d < bd) { bd = d; best = [a, b]; } }
    if (best[0] >= 0) link(best[0], best[1], 'bridge', p.pathWidth * 0.7);
  };
  mst(centers, cdist, (i, j) => { if (r() < 0.82) bridge(i, j); });
  const extra = Math.round(p.connectivity * K * 0.6);
  for (let k = 0; k < extra && K > 2; k++) {
    const i = Math.floor(r() * K), others = centers.filter(j => j !== i).sort((a, b) => cdist(i, a) - cdist(i, b));
    bridge(i, others[Math.min(others.length - 1, 1 + Math.floor(r() * 2))]);
  }

  // 5. Loose fragments: small trees that only sometimes touch the rest.
  const fragments = 1 + Math.floor(r() * 3);
  for (let f = 0; f < fragments && strayCount > 2; f++) {
    const fx = range(r, 0.08, 0.92) * W, fy = range(r, 0.08, 0.92) * H, s = cell * 0.08;
    const ids: number[] = [];
    for (let i = 0; i < Math.max(3, Math.round(strayCount / fragments)); i++) ids.push(addNode(fx + gaussian(r) * s * 1.6, fy + gaussian(r) * s));
    mst(ids, dist, (a, b) => link(a, b, 'core', p.pathWidth * 0.7));
    if (r() < 0.4) {
      const near = clusters.slice().sort((a, b) => Math.hypot(a.x - fx, a.y - fy) - Math.hypot(b.x - fx, b.y - fy))[0];
      if (near) link(ids[0], near.nodes[Math.floor(r() * near.nodes.length)], 'bridge', p.pathWidth * 0.55);
    }
  }

  // 6. Dendrites: branches grown outwards from peripheral nodes, splitting and thinning as they go.
  const degree0 = new Map<number, number>();
  for (const e of raw) { degree0.set(e.a, (degree0.get(e.a) ?? 0) + 1); degree0.set(e.b, (degree0.get(e.b) ?? 0) + 1); }
  const maxDepth = 1 + Math.round(p.branching * 3);
  const grow = (from: number, ang: number, len: number, depth: number, width: number) => {
    if (depth > maxDepth || len < 5) return;
    let cur = from, a = ang;
    const steps = 1 + Math.floor(r() * 2);
    for (let s = 0; s < steps; s++) {
      a += gaussian(r) * 0.3;
      const next = addNode(xs[cur] + Math.cos(a) * len, ys[cur] + Math.sin(a) * len);
      link(cur, next, 'branch', width);
      cur = next;
    }
    if (r() < 0.45 + p.branching * 0.35) {
      const spread = range(r, 0.3, 0.75);
      grow(cur, a + spread, len * range(r, 0.6, 0.8), depth + 1, width * 0.82);
      grow(cur, a - spread * range(r, 0.6, 1.1), len * range(r, 0.6, 0.8), depth + 1, width * 0.82);
    } else if (r() < 0.6) grow(cur, a + gaussian(r) * 0.25, len * 0.8, depth + 1, width * 0.85);
  };
  for (const c of clusters) {
    const peripheral = c.nodes.slice().sort((a, b) => (degree0.get(a) ?? 0) - (degree0.get(b) ?? 0));
    const roots = Math.round(p.branching * c.nodes.length * 0.18);
    for (let k = 0; k < roots && k < peripheral.length; k++) {
      const n = peripheral[Math.floor(r() * Math.min(peripheral.length, roots * 2))];
      const out = Math.atan2(ys[n] - c.y, xs[n] - c.x) + gaussian(r) * 0.6;
      grow(n, out, Math.max(c.sx, c.sy) * range(r, 0.18, 0.35), 1, p.pathWidth * 0.8);
    }
  }

  // 7. Composition: centre the structure's bounding box on the canvas.
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < xs.length; i++) { x0 = Math.min(x0, xs[i]); x1 = Math.max(x1, xs[i]); y0 = Math.min(y0, ys[i]); y1 = Math.max(y1, ys[i]); }
  const shiftX = W / 2 - (x0 + x1) / 2, shiftY = H / 2 - (y0 + y1) / 2;
  for (let i = 0; i < xs.length; i++) { xs[i] += shiftX; ys[i] += shiftY; }

  // 8. Curves and deformation.
  const warp = makeWarp(p.seed, W, H, p);
  const nodes = new Float32Array(xs.length * 2);
  for (let i = 0; i < xs.length; i++) { const [x, y] = warp(xs[i], ys[i]); nodes[i * 2] = x; nodes[i * 2 + 1] = y; }
  const edges = raw.map(e => curve(e, xs, ys, p.curvature, r, warp));

  const degree = new Int32Array(xs.length), adj: { e: number; o: number }[][] = xs.map(() => []);
  edges.forEach((e, i) => { degree[e.a]++; degree[e.b]++; adj[e.a].push({ e: i, o: e.b }); adj[e.b].push({ e: i, o: e.a }); });
  return { W, H, nodes, degree, edges, adj };
}

// Prim's algorithm on the complete graph of `ids`; calls `emit` per tree edge and returns the mean edge length.
function mst(ids: number[], d: (a: number, b: number) => number, emit: (a: number, b: number) => void): number {
  const n = ids.length;
  if (n < 2) return 0;
  const inTree = new Uint8Array(n), best = new Float64Array(n).fill(Infinity), from = new Int32Array(n).fill(-1);
  best[0] = 0; let total = 0;
  for (let k = 0; k < n; k++) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!inTree[i] && (u < 0 || best[i] < best[u])) u = i;
    inTree[u] = 1;
    if (from[u] >= 0) { emit(ids[from[u]], ids[u]); total += best[u]; }
    for (let i = 0; i < n; i++) if (!inTree[i]) { const w = d(ids[u], ids[i]); if (w < best[i]) { best[i] = w; from[i] = u; } }
  }
  return total / (n - 1);
}

// A cubic Bézier with perpendicular offsets (sometimes an S-curve), sampled densely and then warped.
function curve(e: { a: number; b: number; kind: EdgeKind; width: number }, xs: number[], ys: number[], curvature: number, r: Rand,
  warp: (x: number, y: number) => [number, number]): Edge {
  const ax = xs[e.a], ay = ys[e.a], bx = xs[e.b], by = ys[e.b];
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const o1 = curvature * L * 0.35 * (r() * 2 - 1), o2 = o1 * range(r, -0.6, 1.2);
  const c1x = ax + dx / 3 + nx * o1, c1y = ay + dy / 3 + ny * o1, c2x = ax + (2 * dx) / 3 + nx * o2, c2y = ay + (2 * dy) / 3 + ny * o2;
  const n = Math.max(4, Math.ceil((L * (1 + curvature * 0.5)) / SAMPLE_STEP));
  const pts = new Float32Array((n + 1) * 2), cum = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const x = u * u * u * ax + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * bx;
    const y = u * u * u * ay + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * by;
    const [wx, wy] = warp(x, y);
    pts[i * 2] = wx; pts[i * 2 + 1] = wy;
    if (i) cum[i] = cum[i - 1] + Math.hypot(wx - pts[i * 2 - 2], wy - pts[i * 2 - 1]);
  }
  return { a: e.a, b: e.b, kind: e.kind, width: e.width, pts, cum, len: cum[n] };
}
