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
  // florets on a sunflower spiral, and two leaves under it, folded along the midrib and drooping at the tip.
  function hydrangea(R, N, r, opts = {}) {
    const out = [], lump = [r() * 6.3, r() * 6.3], rot0 = r() * Math.PI * 2;
    for (let k = 0; k < N; k++) {
      const z = 1 - (k + .5) / N * (opts.cap ?? .9), rr = Math.sqrt(1 - z * z), a = k * 2.39996 + rot0;
      const n = [Math.cos(a) * rr, Math.sin(a) * rr, z], bump = 1 + .07 * Math.sin(3 * a + lump[0]) * rr + .05 * Math.sin(5 * a + lump[1]) * rr;
      floret(out, mul(n, R * bump * .82), n, R * 1.55 / Math.sqrt(N) * (.85 + r() * .3), r);
    }
    if (opts.leaves !== false) for (const sd of [-1, 1]) {
      const base = [-R * .2, R * .8, -R * .3], ang = Math.PI / 2 + sd * (1.1 + r() * .3), D = unit([Math.cos(ang), Math.sin(ang) * .7, .35]), S = unit(cross(D, [0, 0, 1])), U = cross(S, D);
      const L = R * (1.25 + r() * .2), Wd = L * .36;
      blade(out, base, D, S, U, L,
        u => Wd * Math.pow(Math.sin(Math.PI * Math.pow(u, .75)), .9) * (1 - .15 * u) * (1 + .03 * Math.abs(Math.sin(u * 40))),
        (u, vv) => Wd * .28 * Math.abs(vv) - L * .18 * u * u + .02 * L * Math.sin(5 * vv + 6 * u), 16, 8);
    }
    if (opts.stem) tube(out, t => [-R * .2 - t * R * .15, R * .7 + t * R * 1.8, -R * .25 - t * R * .1], t => R * (.07 - .015 * t), 10, 8);
    return out;
  }
  const flipY = a => { for (let i = 0; i < a.length; i += 3) a[i + 1] = -a[i + 1]; return a; }; // view space ↔ y-up (positions and normals alike)

  // ---------- Models, y-up ----------
  const MODELS = {
    // The whole head on its stem, with its leaves.
    hortensia: r => flipY(hydrangea(1, 44, r, { stem: true })),
    // Close up: one floret in front, a ring of six behind it on a gentle dome, as in a macro photo.
    florecilla: r => {
      const out = [];
      floret(out, [0, 0, .25], [0, 0, 1], 1, r);
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * Math.PI * 2 + r() * .3, n = unit([Math.cos(a) * .55, Math.sin(a) * .55, 1]);
        floret(out, add3(mul([Math.cos(a), Math.sin(a), 0], 1.45), [0, 0, -.25]), n, .9 + r() * .2, r);
      }
      return flipY(out);
    },
    // Six cupped petals in two rings around the stem, two long leaves.
    tulipan: r => {
      const out = [];
      for (let k = 0; k < 6; k++) {
        const inner = k % 2, th0 = k / 6 * Math.PI * 2 + (r() - .5) * .15, span = .62, R0 = inner ? .3 : .36, H = 1.15 + r() * .1;
        patch(out, (u, v) => {
          const w = (v * 2 - 1) * span * (1 - Math.pow(u, 3) * .85), th = th0 + w, rad = R0 * Math.pow(Math.sin(Math.PI * Math.min(1, u * .82 + .05)), .6) + .06 * Math.pow(u, 4) + .02;
          return [Math.cos(th) * rad, u * H, Math.sin(th) * rad];
        }, 14, 10);
      }
      tube(out, t => [Math.sin(t * 2) * .08, -t * 2.4, 0], () => .045, 16, 8);
      for (const sd of [-1, 1]) {
        const base = [0, -1.6, 0], D = unit([sd * .35, .9, .15]), S = unit(cross(D, [0, 0, 1])), U = cross(S, D);
        blade(out, base, D, S, U, 1.6, u => .2 * Math.sin(Math.PI * Math.pow(u, .7)), (u, vv) => .05 * Math.abs(vv) + sd * 0 - .35 * u * u, 18, 8);
      }
      return out;
    },
    // A rolled spathe that opens towards the front and peaks at the back, a spadix in it, a stem.
    cala: r => {
      const out = [];
      // The sheet wraps round from the back (th = -90°); the gap, widening upwards, faces us; the rim flares out
      // and the back rises to a point.
      patch(out, (u, v) => {
        const span = Math.PI * 2 * (1.02 - .62 * Math.pow(u, 1.2)), th = -Math.PI / 2 + (v - .5) * span;
        const rad = .06 + .42 * Math.pow(u, 1.8) + .22 * Math.pow(u, 7), back = (1 - Math.sin(th)) / 2;
        return [Math.cos(th) * rad, u * 1.25 + .55 * Math.pow(u, 3) * back * back - .2 * Math.pow(u, 3) * (1 - back), Math.sin(th) * rad];
      }, 24, 28);
      tube(out, t => [0, .05 + t * .75, -.02], t => .055 * (1 - .3 * t), 10, 8);
      tube(out, t => [Math.sin(t * 2.5) * .06, -t * 2.2, -t * .1], () => .05, 16, 8);
      return out;
    },
    // A daisy facing us: a domed centre and a ring of narrow petals that dip at their tips.
    margarita: r => {
      const out = [], n = 21;
      patch(out, (u, v) => { const th = v * Math.PI * 2, rad = .26 * u; return [Math.cos(th) * rad, Math.sin(th) * rad, .12 * Math.cos(u * Math.PI / 2)]; }, 8, 24);
      for (let k = 0; k < n; k++) {
        const a = k / n * Math.PI * 2 + (r() - .5) * .1, D = [Math.cos(a), Math.sin(a), 0], S = [-Math.sin(a), Math.cos(a), 0], L = .85 + r() * .15, tw = (r() - .5) * .4;
        blade(out, mul(D, .2), D, S, [0, 0, 1], L, u => .075 * Math.pow(Math.sin(Math.PI * Math.min(1, u * .9 + .1)), .5), (u, vv) => -.12 * u * u + tw * vv * .05 * u + .03 * Math.sin(u * 7 + k), 12, 4);
      }
      tube(out, t => [0, -.1 - t * 2.2, -.15 - t * .2], () => .035, 14, 8);
      return out;
    },
    // An echeveria: a rosette of thick, spoon-shaped leaves, the inner ones more upright and smaller.
    suculenta: r => {
      const out = [], n = 34;
      for (let k = n - 1; k >= 0; k--) {
        const t = k / n, a = k * 2.39996, L = .35 + .75 * t, up = 1.2 - 1.05 * t, D = unit([Math.cos(a) * Math.cos(up), Math.sin(up), Math.sin(a) * Math.cos(up)]);
        const S = unit(cross(D, [0, 1, 0])), U = unit(cross(S, D)), base = [0, .15 * (1 - t), 0];
        const half = u => L * .32 * Math.pow(Math.sin(Math.PI * Math.min(1, u * .95 + .05)), .7) * (1 - .25 * u) + .002;
        blade(out, base, D, S, U, L, half, (u, vv) => L * .12 * vv * vv + L * .08 * u * u, 10, 6);
        blade(out, base, D, S, U, L, half, (u, vv) => L * .12 * vv * vv + L * .08 * u * u - L * .08 * Math.sin(Math.PI * u) * (1 - vv * vv), 10, 6);
      }
      return out;
    },
  };
  window.Flora3D = { hydrangea, MODELS, patch, tube, blade, floret };
})();
