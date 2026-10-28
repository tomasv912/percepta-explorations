// Flora3D: flowers and plants built as triangles (18 floats each: three positions, three normals), for
// stipple3d.js. Everything is generated from a seeded random function r, so a seed gives a variant.
// hydrangea() is in view space (x right, y down, z towards the viewer), as Pixel Waves draws it; the models
// in MODELS are y-up, for Pixel Model to turn.
(() => {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = v => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const add3 = (...vs) => vs.reduce((a, v) => [a[0] + v[0], a[1] + v[1], a[2] + v[2]], [0, 0, 0]), mul = (v, k) => [v[0] * k, v[1] * k, v[2] * k];
  const basis = n => { const t1 = unit(Math.abs(n[2]) > .95 ? cross(n, [0, 1, 0]) : cross(n, [0, 0, 1])); return [t1, cross(n, t1)]; };

  // A parametric patch f(u, v), u and v in [0, 1], as a grid of quads with normals from its partials.
  function patch(out, f, nu, nv) {
    const P = [], Nn = [], e = 1e-3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = i / nu, v = j / nv, p = f(u, v);
      P.push(p); Nn.push(unit(cross(sub(f(Math.min(1, u + e), v), f(Math.max(0, u - e), v)), sub(f(u, Math.min(1, v + e)), f(u, Math.max(0, v - e))))));
    }
    const at = (i, j) => j * (nu + 1) + i, tri = (a, b, c) => out.push(...P[a], ...P[b], ...P[c], ...Nn[a], ...Nn[b], ...Nn[c]);
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { tri(at(i, j), at(i + 1, j), at(i + 1, j + 1)); tri(at(i, j), at(i + 1, j + 1), at(i, j + 1)); }
  }
  // A tube of radius rad(t) along curve(t), t in [0, 1].
  function tube(out, curve, rad, nu = 24, nv = 10) {
    patch(out, (u, v) => {
      const p = curve(u), q = curve(Math.min(1, u + .01)), o = curve(Math.max(0, u - .01)), T = unit(sub(q, o)), [a, b] = basis(T), th = v * Math.PI * 2;
      return add3(p, mul(a, Math.cos(th) * rad(u)), mul(b, Math.sin(th) * rad(u)));
    }, nu, nv);
  }
  // A blade (leaf or petal) from base along D, sideways S, bending towards U: half-width half(u), lift h(u, v).
  function blade(out, base, D, S, U, L, half, h, nu = 14, nv = 8) {
    patch(out, (u, v) => { const vv = v * 2 - 1; return add3(base, mul(D, u * L), mul(S, vv * half(u)), mul(U, h(u, vv))); }, nu, nv);
  }
  // One hydrangea floret at C facing n, size rf: four broad sepals that rise, curl at the edges and ripple,
  // alternate ones lifted so they overlap, around a small bead.
  function floret(out, C, n, rf, r) {
    const [t1, t2] = basis(n), rot = r() * Math.PI / 2, ph = r() * 6.3;
    for (let s4 = 0; s4 < 4; s4++) {
      const th = rot + s4 * Math.PI / 2 + (r() - .5) * .25, dir = add3(mul(t1, Math.cos(th)), mul(t2, Math.sin(th))), side = add3(mul(t1, -Math.sin(th)), mul(t2, Math.cos(th)));
      const L = rf * (.95 + r() * .15), Wd = L * .66, lift = (s4 % 2) * .07 * L;
      blade(out, C, dir, side, n, L * 1.05,
        u => Wd * Math.pow(Math.sin(Math.PI * Math.min(1, u * .98 + .02)), .55) * (.7 + .4 * u),
        (u, vv) => L * (.2 * u * u - .1 * u * u * u) + .16 * Wd * vv * vv * u + .03 * L * Math.sin(6 * vv + 4 * u + ph) * u + lift * (.3 + u), 7, 6);
    }
    patch(out, (u, v) => { const th = u * Math.PI * 2, p = v * Math.PI / 2, rb = rf * .11; return add3(C, mul(n, rf * .1 + Math.sin(p) * rb), mul(t1, Math.cos(th) * Math.cos(p) * rb), mul(t2, Math.sin(th) * Math.cos(p) * rb)); }, 8, 3);
  }

  // A hydrangea head, centred on the origin, radius R, in view space (y down, z towards us): a lumpy dome of N
  // florets on a sunflower spiral, and leaves under it (two unless opts.leaves says), folded along the midrib and
  // drooping at the tip. opts: cap (how far round the florets go), leaves, leafLen, floretSize, lump.
  function hydrangea(R, N, r, opts = {}) {
    const out = [], lump = [r() * 6.3, r() * 6.3], rot0 = r() * Math.PI * 2, lk = opts.lump ?? 1, fs = opts.floretSize ?? 1;
    for (let k = 0; k < N; k++) {
      const z = 1 - (k + .5) / N * (opts.cap ?? .9), rr = Math.sqrt(1 - z * z), a = k * 2.39996 + rot0;
      const n = [Math.cos(a) * rr, Math.sin(a) * rr, z], bump = 1 + lk * (.07 * Math.sin(3 * a + lump[0]) * rr + .05 * Math.sin(5 * a + lump[1]) * rr);
      floret(out, mul(n, R * bump * .82), n, fs * R * 1.55 / Math.sqrt(N) * (.85 + r() * .3), r);
    }
    // The leaves fan out downwards: one hangs, two spread to the sides, more spread wider.
    const nl = opts.leaves === false ? 0 : opts.leaves ?? 2, spread = (nl <= 2 ? 1.1 : 1.1 + .25 * (nl - 2)) + r() * .3;
    for (let i = 0; i < nl; i++) {
      const base = [-R * .2, R * .8, -R * .3], ang = Math.PI / 2 + (nl === 1 ? (r() - .5) * .8 : (i / (nl - 1) * 2 - 1) * spread);
      const D = unit([Math.cos(ang), Math.sin(ang) * .7, .35]), S = unit(cross(D, [0, 0, 1])), U = cross(S, D);
      const L = R * (1.25 + r() * .2) * (opts.leafLen ?? 1), Wd = L * .36;
      blade(out, base, D, S, U, L,
        u => Wd * Math.pow(Math.sin(Math.PI * Math.pow(u, .75)), .9) * (1 - .15 * u) * (1 + .03 * Math.abs(Math.sin(u * 40))),
        (u, vv) => Wd * .28 * Math.abs(vv) - L * .18 * u * u + .02 * L * Math.sin(5 * vv + 6 * u), 16, 8);
    }
    if (opts.stem) tube(out, t => [-R * .2 - t * R * .15, R * .7 + t * R * 1.8, -R * .25 - t * R * .1], t => R * (.07 - .015 * t), 10, 8);
    return out;
  }
  const flipY = a => { for (let i = 0; i < a.length; i += 3) a[i + 1] = -a[i + 1]; return a; }; // view space ↔ y-up (positions and normals alike)

  // A gentle, seeded warp of a whole model: a bend, a twist about the vertical, uneven proportions and a slow
  // ripple, amt from 0 (none) up. Normals follow, from two tangents carried through the same warp.
  function distort(out, r, amt) {
    let R = 0;
    for (let i = 0; i < out.length; i += 18) for (let j = 0; j < 9; j += 3) R = Math.max(R, Math.hypot(out[i + j], out[i + j + 1], out[i + j + 2]));
    const bx = (r() - .5) * .5 * amt, bz = (r() - .5) * .5 * amt, tw = (r() - .5) * 1.4 * amt, sc = [0, 0, 0].map(() => 1 + (r() - .5) * .4 * amt);
    const wa = .035 * amt * R, f = [0, 0, 0].map(() => (2 + r() * 3) / R), ph = [0, 0, 0].map(() => r() * 6.3);
    const F = (x, y, z) => {
      const u = y / R, a = tw * u, c = Math.cos(a), s2 = Math.sin(a);
      const X = x * c - z * s2 + bx * u * u * R + wa * Math.sin(f[0] * y + ph[0]), Z = x * s2 + z * c + bz * u * u * R + wa * Math.sin(f[2] * y + ph[2]);
      return [X * sc[0], (y + wa * Math.sin(f[1] * x + ph[1])) * sc[1], Z * sc[2]];
    };
    const e = R * 1e-3;
    for (let i = 0; i < out.length; i += 18) for (let j = 0; j < 9; j += 3) {
      const p = [out[i + j], out[i + j + 1], out[i + j + 2]], n = [out[i + 9 + j], out[i + 10 + j], out[i + 11 + j]], [t1, t2] = basis(unit(n));
      const q = F(...p), m = unit(cross(sub(F(...add3(p, mul(t1, e))), q), sub(F(...add3(p, mul(t2, e))), q)));
      out[i + j] = q[0]; out[i + j + 1] = q[1]; out[i + j + 2] = q[2]; out[i + 9 + j] = m[0]; out[i + 10 + j] = m[1]; out[i + 11 + j] = m[2];
    }
    return out;
  }
  const pick = (r, a, b) => a + r() * (b - a), warp = r => r() * r() * 1.3; // mostly a little, now and then a lot

  // A stem from the origin down, gently curved, drawn as far as tEnd of it; returns its curve so leaves can sit on it.
  function stem(out, r, len, rad, tEnd = 1) {
    const cx = (r() - .5) * .3, cz = (r() - .5) * .2, k = pick(r, 1.5, 3), c = t => [Math.sin(t * k) * cx, -t * len, Math.sin(t * k * .7) * cz];
    tube(out, t => c(t * tEnd), () => rad, 16, 8);
    return c;
  }
  // A long leaf rising from p, leaning out towards azimuth az, its tip falling away by droop.
  function longLeaf(out, p, az, L, Wd, droop, lean = .35) {
    const S = [-Math.sin(az), 0, Math.cos(az)], D = unit([Math.cos(az) * lean, .9, Math.sin(az) * lean]), U = cross(S, D);
    blade(out, p, D, S, U, L, u => Wd * Math.sin(Math.PI * Math.pow(u, .7)), (u, vv) => Wd * .25 * Math.abs(vv) - droop * u * u, 18, 8);
  }

  // A cupped petal rising from radius R0 at angle th0 about the vertical axis: its midrib tilts from the vertical by
  // t0 + t1·u (in closed form), its edges curl in by `cup`, ruffle waves its rim; half(u) is its half-width.
  function cupPetal(out, o) {
    const { th0, R0 = .05, L, t0, t1, cup = .5, y0 = 0, ruffle = 0, freq = 12, ph = 0, half } = o;
    const radial = [Math.cos(th0), 0, Math.sin(th0)], side = [-Math.sin(th0), 0, Math.cos(th0)];
    const mid = u => Math.abs(t1) < 1e-3 ? [Math.sin(t0) * u, Math.cos(t0) * u] : [(Math.cos(t0) - Math.cos(t0 + t1 * u)) / t1, (Math.sin(t0 + t1 * u) - Math.sin(t0)) / t1];
    patch(out, (u, v) => {
      const vv = v * 2 - 1, [a, b] = mid(u), t = t0 + t1 * u, hw = half(u), inw = cup * hw * vv * vv + ruffle * Math.sin(vv * freq + ph + u * 5) * u * u;
      return add3(mul(radial, R0 + a * L - Math.cos(t) * inw), [0, y0 + b * L + Math.sin(t) * inw, 0], mul(side, vv * hw));
    }, o.nu || 12, o.nv || 10);
  }
  // Triangles built at the origin, scaled, turned about y (yaw) and tilted (about x), then moved to pos.
  function placed(out, build, pos, k = 1, yaw = 0, tilt = 0) {
    const t = []; build(t);
    const cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    const rot = v => { const y1 = v[1] * ct - v[2] * st, z1 = v[1] * st + v[2] * ct; return [v[0] * cy + z1 * sy, y1, -v[0] * sy + z1 * cy]; };
    for (let i = 0; i < t.length; i += 18) {
      for (let j = 0; j < 9; j += 3) out.push(...add3(mul(rot([t[i + j], t[i + j + 1], t[i + j + 2]]), k), pos));
      for (let j = 9; j < 18; j += 3) out.push(...rot([t[i + j], t[i + j + 1], t[i + j + 2]]));
    }
  }
  // An oval leaf from p, out along azimuth az, rising by lift, bending down at the tip.
  function ovalLeaf(out, p, az, L, Wd, lift = .3, droop = .2) {
    const S = [-Math.sin(az), 0, Math.cos(az)], D = unit([Math.cos(az), lift, Math.sin(az)]), U = cross(S, D);
    blade(out, p, D, S, U, L, u => Wd * Math.pow(Math.sin(Math.PI * Math.min(1, u * .95 + .05)), .8), (u, vv) => Wd * .3 * Math.abs(vv) - droop * L * u * u, 12, 6);
  }
  // Sepals: n narrow points around the base at height y, angled down by `down`.
  function sepals(out, r, n, y, L, Wd, down) {
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2 + r() * .3, D = unit([Math.cos(a), -down, Math.sin(a)]), S = [-Math.sin(a), 0, Math.cos(a)], U = cross(S, D);
      blade(out, [Math.cos(a) * .04, y, Math.sin(a) * .04], D, S, U, L * pick(r, .85, 1.15), u => Wd * Math.sin(Math.PI * Math.pow(u, .6)) * (1 - u * .7), (u, vv) => -.05 * u * u, 8, 4);
    }
  }
  // A stem with a couple of leaves under a flower, unless trimmed (Pixel Waves, where the wave is the stem).
  function stalk(out, r, opts, leaf = 'oval') {
    if (opts.trim) return;
    const c = stem(out, r, pick(r, 1.3, 2.2), pick(r, .03, .045)), nl = 1 + Math.floor(r() * 3), az0 = r() * 6.3;
    for (let i = 0; i < nl; i++) {
      const p = c(pick(r, .3, .75)), az = az0 + i * Math.PI * 2 / nl + (r() - .5) * .8;
      if (leaf === 'grass') longLeaf(out, p, az, pick(r, .6, 1.1), pick(r, .03, .06), pick(r, .2, .5), .8);
      else ovalLeaf(out, p, az, pick(r, .35, .6), pick(r, .1, .18));
    }
  }

  // ---------- Models, y-up ----------
  // Every model is a family: the seed sets how many flowers, petals and leaves, their sizes, how open the flower
  // is (bud, open, past its best) and a warp, so each seed is another plant of the same kind.
  const MODELS = {
    // The whole head, florets all the way round (so it turns a full 360°), ending in its leaves (none to four).
    hortensia: r => distort(flipY(hydrangea(1, Math.round(pick(r, 40, 140)), r, {
      cap: pick(r, 1.6, 1.9), leaves: [0, 1, 2, 2, 2, 3, 4][Math.floor(r() * 7)], leafLen: pick(r, .75, 1.5), floretSize: pick(r, .8, 1.3), lump: pick(r, 0, 2.5),
    })), r, warp(r)),
    // Close up: one floret in front, a ring of others behind it on a dome, sometimes a second ring.
    florecilla: r => {
      const out = [], n = 3 + Math.floor(r() * 7), dome = pick(r, .3, .8), ring = pick(r, 1.2, 1.6);
      floret(out, [0, 0, .25], [0, 0, 1], pick(r, .8, 1.25), r);
      for (let k = 0; k < n; k++) {
        const a = k / n * Math.PI * 2 + r() * .3, nn = unit([Math.cos(a) * dome, Math.sin(a) * dome, 1]);
        floret(out, add3(mul([Math.cos(a), Math.sin(a), 0], ring * pick(r, .9, 1.15)), [0, 0, -.2 - dome * .2]), nn, pick(r, .7, 1.1), r);
      }
      if (r() < .45) {
        const m = n + 3 + Math.floor(r() * 4);
        for (let k = 0; k < m; k++) {
          const a = (k + .5) / m * Math.PI * 2 + r() * .2, nn = unit([Math.cos(a) * dome * 1.6, Math.sin(a) * dome * 1.6, 1]);
          floret(out, add3(mul([Math.cos(a), Math.sin(a), 0], ring * 1.85), [0, 0, -.55 - dome * .4]), nn, pick(r, .65, .95), r);
        }
      }
      return distort(flipY(out), r, warp(r));
    },
    // A rose: petals on a spiral, the inner ones tall and wrapped round the heart, the outer ones wider and opening
    // with their edges rolled back; openness runs from bud to full bloom; sepals and, unless trimmed, a stem.
    rosa: (r, opts = {}) => {
      const out = [], N = 14 + Math.floor(r() * 22), open = pick(r, .15, 1), H = pick(r, .7, 1), roll = pick(r, .3, 1);
      for (let k = 0; k < N; k++) {
        const t = k / (N - 1), L = H * (.45 + .65 * t), W = .1 + .22 * t;
        cupPetal(out, { th0: k * 2.39996 + (r() - .5) * .2, R0: .015 + .12 * t * (.5 + open), L, y0: -.12 * t,
          t0: .06 + (.25 + 1.05 * open) * Math.pow(t, 1.4), t1: -1 * (1 - t) + 1.7 * open * roll * t * t, cup: .95 - .45 * t,
          half: u => W * Math.pow(Math.sin(Math.PI * Math.min(1, u * .8 + .12)), .55) });
      }
      sepals(out, r, 5, -.15, pick(r, .3, .45), .05, pick(r, .3, 1.2));
      stalk(out, r, opts);
      return distort(out, r, warp(r));
    },
    // A carnation: many frilled petals in a ruffled ball from a slim calyx with five teeth.
    clavel: (r, opts = {}) => {
      const out = [], N = 40 + Math.floor(r() * 45), open = pick(r, .45, 1.1), fr = pick(r, .02, .05), Lc = pick(r, .35, .55);
      tube(out, t => [0, -Lc + t * Lc, 0], t => .07 + .045 * t, 14, 10);
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2, D = unit([Math.cos(a) * .25, 1, Math.sin(a) * .25]), S = [-Math.sin(a), 0, Math.cos(a)]; blade(out, [Math.cos(a) * .11, 0, Math.sin(a) * .11], D, S, cross(S, D), .1, u => .04 * (1 - u), () => 0, 4, 2); }
      for (let k = 0; k < N; k++) {
        const t = k / (N - 1), L = .3 + .28 * t + (r() - .5) * .06, W = .1 + .09 * t;
        cupPetal(out, { th0: k * 2.39996 + r() * .3, R0: .04, L, y0: .02 * (1 - t),
          t0: .12 + 1.35 * open * Math.pow(t, 1.2), t1: .4 * t - .3 * (1 - t), cup: .3, ruffle: fr, freq: 16 + r() * 8, ph: r() * 6.3,
          half: u => W * Math.pow(Math.min(1, u * 1.3), .7) });
      }
      stalk(out, r, opts, 'grass');
      return distort(out, r, warp(r));
    },
    // Jasmine facing us: a small cluster of white stars, five (or six) flat petals at the mouth of a thin tube that
    // runs back, on slender stalks from one point below, with a few closed buds.
    jazmin: (r, opts = {}) => {
      const out = [], nF = 2 + Math.floor(r() * 4), nB = 1 + Math.floor(r() * 3), base = [0, -.75, -.35];
      const flower = (o, np, Lp) => {
        tube(o, t => [0, 0, -.32 * t], () => .022, 8, 6);
        for (let k = 0; k < np; k++) {
          const a = k / np * Math.PI * 2 + Math.PI / 2, D = [Math.cos(a), Math.sin(a), 0], S = [-Math.sin(a), Math.cos(a), 0];
          blade(o, mul(D, .02), D, S, [0, 0, 1], Lp, u => Lp * .32 * Math.pow(Math.sin(Math.PI * Math.min(1, u * .9 + .1)), .7), (u, vv) => -.1 * Lp * u * u + .03 * Lp * vv * vv, 10, 6);
        }
      };
      const items = [];
      for (let i = 0; i < nF + nB; i++) {
        const a = i * 2.39996 + r() * .5, rr = i ? pick(r, .35, .6) : 0;
        items.push({ pos: [Math.cos(a) * rr, Math.sin(a) * rr * .8 + .05, (r() - .5) * .15], bud: i >= nF, tilt: Math.sin(a) * rr * .5, yaw: -Math.cos(a) * rr * .6 });
      }
      for (const it of items) {
        if (it.bud) placed(out, o => patch(o, (u, v) => { const th = v * Math.PI * 2, ph = u * Math.PI; return [Math.cos(th) * Math.sin(ph) * .045, Math.sin(th) * Math.sin(ph) * .045, .02 - Math.cos(ph) * .12]; }, 8, 10), it.pos, 1, it.yaw, it.tilt);
        else placed(out, o => flower(o, r() < .25 ? 6 : 5, pick(r, .26, .36)), it.pos, 1, it.yaw, it.tilt);
        tube(out, t => add3(base, mul(sub(add3(it.pos, [0, 0, -.3]), base), t)), () => .014, 6, 4);
      }
      if (!opts.trim) { tube(out, t => [base[0], base[1] - t * 1.2, base[2]], () => .025, 10, 6); for (const sd of [-1, 1]) ovalLeaf(out, [0, base[1] - .3, base[2]], Math.PI / 2 + sd * 1.1, pick(r, .35, .5), pick(r, .1, .15)); }
      return distort(out, r, warp(r));
    },
    // A petunia: a wide funnel flaring into five shallow lobes with a ruffled rim, on its sepals.
    petunia: (r, opts = {}) => {
      const out = [], R = pick(r, .6, .95), depth = pick(r, .55, .85), flare = pick(r, .1, .35), lobe = pick(r, .08, .2), rf = pick(r, .01, .04), ph = r() * 6.3;
      patch(out, (u, v) => {
        const th = v * Math.PI * 2, lob = 1 + lobe * Math.cos(5 * th + ph) - .1 * Math.pow(Math.abs(Math.sin(2.5 * th + ph / 2)), 8);
        const rad = .05 + .04 * u + R * Math.pow(u, 2.6) * lob;
        return [Math.cos(th) * rad, depth * u - flare * Math.pow(u, 5) + rf * Math.sin(12 * th) * Math.pow(u, 4), Math.sin(th) * rad];
      }, 16, 60);
      tube(out, t => [0, -.02 + t * .25, 0], t => .012, 6, 4); // the stamens inside the throat
      sepals(out, r, 5, .02, pick(r, .3, .45), .05, -.2);
      stalk(out, r, opts);
      return distort(out, r, warp(r));
    },
    // An orchid (Phalaenopsis) facing us: a sepal up and two down at the sides, two broad round petals across, the
    // lip below with its side lobes and the column in the middle; untrimmed, a few flowers and buds on an arching spike.
    orquidea: (r, opts = {}) => {
      const out = [], size = pick(r, .85, 1.15), broad = pick(r, .7, 1), cupd = pick(r, .02, .1);
      const one = o => {
        const part = (ang, L, W, round, bend) => { const D = [Math.sin(ang), Math.cos(ang), 0], S = [Math.cos(ang), -Math.sin(ang), 0];
          blade(o, mul(D, .03), D, S, [0, 0, 1], L, u => W * Math.pow(Math.sin(Math.PI * Math.min(1, u * .95 + .05)), round), (u, vv) => cupd * Math.abs(vv) + bend * u * u, 12, 8); };
        part(0, .5, .13, .7, .04);                                   // dorsal sepal
        for (const sd of [-1, 1]) part(sd * pick(r, 2.1, 2.4), .48, .12, .7, .03); // lateral sepals
        for (const sd of [-1, 1]) part(sd * pick(r, 1.25, 1.6), .5, .26 * broad, .5, .06); // petals
        // The lip: a tongue down and forward, with two side lobes near the base.
        blade(o, [0, -.04, .04], unit([0, -1, .35]), [1, 0, 0], unit([0, .35, 1]), .32, u => .07 * Math.sin(Math.PI * u) + .09 * Math.exp(-Math.pow((u - .25) / .12, 2)), (u, vv) => .12 * u * u - .05 * Math.abs(vv), 12, 8);
        tube(o, t => [0, .02 + t * .07, .02 + t * .1], () => .03, 6, 6); // the column
      };
      if (opts.trim) placed(out, one, [0, 0, 0], size);
      else {
        const n = 1 + Math.floor(r() * 3), nb = 1 + Math.floor(r() * 3), arc = t => [t * 1.6, 1.4 * Math.sin(t * 1.4), 0];
        tube(out, t => add3([0, -1.2, 0], arc(t * 1.15)), () => .025, 24, 6);
        for (let i = 0; i < n; i++) placed(out, one, add3([0, -1.2, 0], arc(.35 + i * .3)), size * pick(r, .9, 1.05), (r() - .5) * .5, (r() - .5) * .3);
        for (let i = 0; i < nb; i++) { const p = add3([0, -1.2, 0], arc(.35 + n * .3 + i * .12)); patch(out, (u, v) => { const th = v * Math.PI * 2, ph = u * Math.PI, k = .9 - i * .2; return [p[0] + Math.cos(th) * Math.sin(ph) * .07 * k, p[1] - Math.cos(ph) * .09 * k, p[2] + Math.sin(th) * Math.sin(ph) * .07 * k]; }, 8, 10); }
        for (const sd of [-1, 1]) ovalLeaf(out, [0, -1.2, 0], Math.PI / 2 + sd * pick(r, .7, 1.2), pick(r, .8, 1.2), pick(r, .25, .35), .35, .3);
      }
      return distort(out, r, warp(r));
    },
    // A rolled spathe that opens towards the front and peaks at the back, a spadix in it, a stem and maybe leaves.
    // Openness runs from a furled bud to a wide, flared trumpet.
    cala: r => {
      const out = [], open = r(), H = pick(r, 1.05, 1.5), peak = pick(r, .3, .75), flare = pick(r, .08, .35), wide = pick(r, .3, .5);
      // The sheet wraps round from the back (th = -90°); the gap, widening upwards, faces us; the rim flares out
      // and the back rises to a point.
      patch(out, (u, v) => {
        const span = Math.PI * 2 * (1.02 - (.15 + .7 * open) * Math.pow(u, 1.2)), th = -Math.PI / 2 + (v - .5) * span;
        const rad = .06 + wide * (.3 + .95 * open) * Math.pow(u, 1.8) + flare * (.1 + 1.3 * open) * Math.pow(u, 7), back = (1 - Math.sin(th)) / 2;
        return [Math.cos(th) * rad, u * H + peak * Math.pow(u, 3) * back * back - .2 * Math.pow(u, 3) * (1 - back), Math.sin(th) * rad];
      }, 24, 28);
      tube(out, t => [0, .05 + t * pick(r, .55, .9) * (.6 + .4 * H), -.02], t => .055 * (1 - .3 * t), 10, 8);
      const c = stem(out, r, pick(r, 1.5, 2.6), pick(r, .042, .058));
      // Long, broad leaves rising from the foot of the stem.
      const nl = [0, 0, 1, 1, 2, 3][Math.floor(r() * 6)], foot = c(1);
      for (let i = 0; i < nl; i++) {
        longLeaf(out, foot, r() * 6.3, pick(r, 1.4, 2.3), pick(r, .2, .34), pick(r, .15, .45), pick(r, .25, .55));
      }
      return distort(out, r, warp(r));
    },
    // A daisy facing us: a domed centre and a ring (sometimes two) of narrow petals; cupped up when fresh, flat or
    // falling back when it opens wide, a few missing when it's past its best. No stem.
    margarita: r => {
      const out = [], n = 13 + Math.floor(r() * 22), cr = pick(r, .18, .32), dome = pick(r, .07, .2), Lp = pick(r, .6, 1.1), Wp = pick(r, .05, .1), droop = pick(r, -.35, .3);
      const lose = r() < .3 ? pick(r, .1, .35) : 0, rows = r() < .35 ? 2 : 1;
      // The centre stands proud: a dome on a short drum, so the petals, which start under it, never cross it.
      patch(out, (u, v) => { const th = v * Math.PI * 2, rad = cr * 1.15 * u; return [Math.cos(th) * rad, Math.sin(th) * rad, .05 + dome * Math.cos(u * Math.PI / 2)]; }, 8, 24);
      patch(out, (u, v) => { const th = v * Math.PI * 2; return [Math.cos(th) * cr * 1.15, Math.sin(th) * cr * 1.15, .05 - u * .1]; }, 24, 2);
      for (let row = 0; row < rows; row++) for (let k = 0; k < n; k++) {
        if (r() < lose) continue;
        const a = (k + row * .5) / n * Math.PI * 2 + (r() - .5) * .12, D = [Math.cos(a), Math.sin(a), 0], S = [-Math.sin(a), Math.cos(a), 0];
        const L = Lp * pick(r, .85, 1.1) * (row ? .85 : 1), tw = (r() - .5) * .4, dr = droop + (r() - .5) * .15 - row * .08;
        blade(out, add3(mul(D, cr * .85), [0, 0, -.02 - row * .03]), D, S, [0, 0, 1], L, u => Wp * Math.pow(Math.sin(Math.PI * Math.min(1, u * .9 + .1)), .5), (u, vv) => -dr * u * u + tw * vv * .05 * u + .03 * Math.sin(u * 7 + k) * Math.min(1, u * 4), 12, 4);
      }
      return distort(out, r, warp(r));
    },
    // An echeveria: a rosette of thick, spoon-shaped leaves, the inner ones more upright and smaller.
    suculenta: r => {
      const out = [], n = 14 + Math.floor(r() * 46), lift = pick(r, .7, 1.5), flat = pick(r, .6, 1.25), Wk = pick(r, .2, .45), thick = pick(r, .04, .14), grow = pick(r, .5, 1.1);
      for (let k = n - 1; k >= 0; k--) {
        const t = k / n, a = k * 2.39996, L = .35 + grow * t, up = lift - (lift - .15) * t * flat, D = unit([Math.cos(a) * Math.cos(up), Math.sin(up), Math.sin(a) * Math.cos(up)]);
        const S = unit(cross(D, [0, 1, 0])), U = unit(cross(S, D)), base = [0, .15 * (1 - t), 0];
        const half = u => L * Wk * Math.pow(Math.sin(Math.PI * Math.min(1, u * .95 + .05)), .7) * (1 - .25 * u) + .002;
        blade(out, base, D, S, U, L, half, (u, vv) => L * .12 * vv * vv + L * .08 * u * u, 10, 6);
        blade(out, base, D, S, U, L, half, (u, vv) => L * .12 * vv * vv + L * .08 * u * u - L * thick * Math.sin(Math.PI * u) * (1 - vv * vv), 10, 6);
      }
      return distort(out, r, warp(r));
    },
  };
  // A y-up model turned (yaw about the vertical, then pitch) into view space (y down, z towards us), centred
  // and scaled to the given radius; normals turned alike.
  function view(tris, yawDeg, pitchDeg, radius) {
    let cx = 0, cy = 0, cz = 0, n = 0, r = 0;
    for (let i = 0; i < tris.length; i += 18) for (let j = 0; j < 9; j += 3) { cx += tris[i + j]; cy += tris[i + j + 1]; cz += tris[i + j + 2]; n++; }
    cx /= n; cy /= n; cz /= n;
    for (let i = 0; i < tris.length; i += 18) for (let j = 0; j < 9; j += 3) r = Math.max(r, Math.hypot(tris[i + j] - cx, tris[i + j + 1] - cy, tris[i + j + 2] - cz));
    const y = yawDeg * Math.PI / 180, p = pitchDeg * Math.PI / 180, c1 = Math.cos(y), s1 = Math.sin(y), c2 = Math.cos(p), s2 = Math.sin(p), k = radius / (r || 1), out = new Float32Array(tris.length);
    const turn = (x, yy, z, o) => { const x1 = x * c1 + z * s1, z1 = -x * s1 + z * c1, y1 = yy * c2 - z1 * s2, z2 = yy * s2 + z1 * c2; out[o] = x1; out[o + 1] = -y1; out[o + 2] = z2; };
    for (let i = 0; i < tris.length; i += 18) {
      for (let j = 0; j < 9; j += 3) turn((tris[i + j] - cx) * k, (tris[i + j + 1] - cy) * k, (tris[i + j + 2] - cz) * k, i + j);
      for (let j = 9; j < 18; j += 3) turn(tris[i + j], tris[i + j + 1], tris[i + j + 2], i + j);
    }
    return out;
  }
  const NAMES = [['hortensia', 'Hortensia'], ['florecilla', 'Florecilla'], ['orquidea', 'Orquídea'], ['rosa', 'Rosa'], ['clavel', 'Clavel'], ['jazmin', 'Jazmín'], ['petunia', 'Petunia'], ['cala', 'Cala'], ['margarita', 'Margarita'], ['suculenta', 'Suculenta']];
  window.Flora3D = { hydrangea, MODELS, NAMES, view, distort, patch, tube, blade, floret };
})();
