// Prism: a glass sphere with bubbles of a colour inside (the Percepta brand "Prism", Figma 5971:970), drawn once per
// colour and variant on a canvas and then stamped, scaled, wherever a particle is big enough to show it.
// Inside the clip of the sphere: bubbles of the main colour (a big one, a cluster around it, some running out past the
// rim) and a few small ones of another palette colour; each bubble lit from the upper left (its lighter shade, the
// colour, its darker shade) with a soft dark rim. The lower part of the sphere is out of focus (the bubbles blurred,
// fading in from the middle down); near the rim the content is magnified and smeared, as through thick glass, with a
// faint red / blue fringe; then a thin light rim and a soft highlight.
(() => {
  // shades: the same criterion as the brand ramps (OKLCH, hue kept; darker towards L 0.30, lighter towards L 0.95)
  const s2l = c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4, l2s = c => c <= .0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - .055;
  function toOklch(hex) {
    const n = parseInt(hex.slice(1), 16), r = s2l((n >> 16 & 255) / 255), g = s2l((n >> 8 & 255) / 255), b = s2l((n & 255) / 255);
    let l = .4122214708 * r + .5363325363 * g + .0514459929 * b, m = .2119034982 * r + .6806995451 * g + .1073969566 * b, s = .0883024619 * r + .2817188376 * g + .6299787005 * b;
    l = Math.cbrt(l); m = Math.cbrt(m); s = Math.cbrt(s);
    const L = .2104542553 * l + .793617785 * m - .0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, B = .0259040371 * l + .7827717662 * m - .808675766 * s;
    return [L, Math.hypot(A, B), Math.atan2(B, A)];
  }
  function rgbOf(L, C, H) {
    const A = C * Math.cos(H), B = C * Math.sin(H);
    const l = (L + .3963377774 * A + .2158037573 * B) ** 3, m = (L - .1055613458 * A - .0638541728 * B) ** 3, s = (L - .0894841775 * A - 1.291485548 * B) ** 3;
    return [4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.707614701 * s];
  }
  function fromOklch(L, C, H) {
    const ok = c => c.every(v => v >= -1e-4 && v <= 1 + 1e-4);
    if (!ok(rgbOf(L, C, H))) { let lo = 0, hi = C; for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (ok(rgbOf(L, mid, H))) lo = mid; else hi = mid; } C = lo; }
    return '#' + rgbOf(L, C, H).map(v => Math.round(Math.max(0, Math.min(1, l2s(v))) * 255).toString(16).padStart(2, '0')).join('');
  }
  // step −3…+3 of a colour's ramp
  function shade(hex, step) {
    const [L, C, H] = toOklch(hex);
    if (!step) return hex;
    if (step < 0) { const i = -step; return fromOklch(L + (.30 - L) * i / 3, C * [1, .95, .88][i - 1], H); }
    return fromOklch(L + (.95 - L) * step / 3, C * [.7, .42, .18][step - 1], H);
  }
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const canvas = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  // a soft blur that works everywhere: shrunk and stretched back
  function blurred(src, k) {
    const w = Math.max(2, Math.round(src.width / k)), h = Math.max(2, Math.round(src.height / k)), a = canvas(w, h), ax = a.getContext('2d');
    ax.imageSmoothingQuality = 'high'; ax.drawImage(src, 0, 0, w, h);
    const b = canvas(src.width, src.height), bx = b.getContext('2d'); bx.imageSmoothingEnabled = true; bx.imageSmoothingQuality = 'high'; bx.drawImage(a, 0, 0, src.width, src.height);
    return b;
  }
  const SIZE = 256, cache = new Map();
  let liveKey = '', live = new Map(); // moving prisms: their drawings by time step
  // The bubbles drift on a turbulent noise when moving (move: how far, 0–1 of a bubble's room; speed; turb: how
  // tangled, more and faster swirls): each bubble on a sum of slow sines of its own, so the motion never repeats
  // soon and neighbours don't move together. At time t the prism is drawn again (smaller, as it is redrawn often).
  const drift = (seed, t, move, turb) => {
    if (!move) return [0, 0];
    const q = rng(seed), f = [.31, .53 * turb, .97 * turb * turb], ph = [q(), q(), q(), q(), q(), q()].map(v => v * 6.283);
    const x = Math.sin(t * f[0] + ph[0]) * .55 + Math.sin(t * f[1] + ph[1]) * .3 + Math.sin(t * f[2] + ph[2]) * .15;
    const y = Math.cos(t * f[0] * 1.13 + ph[3]) * .55 + Math.cos(t * f[1] * .91 + ph[4]) * .3 + Math.cos(t * f[2] * 1.07 + ph[5]) * .15;
    return [x * move, y * move];
  };
  function build(main, accent, variant, t = 0, move = 0, turb = 1, S = SIZE) {
    const c = S / 2, R = S / 2 - 3 * S / SIZE, r = rng(variant * 7919 + parseInt(main.slice(1), 16) % 9973);
    // the bubbles, on their own layer
    const bub = canvas(S), bx = bub.getContext('2d');
    let bi = 0;
    const ball = (x, y, rad, col) => {
      const [dx, dy] = drift(variant * 131 + bi++ * 17 + 5, t, move, turb); x += dx * R * .3; y += dy * R * .3;
      const g = bx.createRadialGradient(x - rad * .32, y - rad * .38, rad * .05, x, y, rad);
      g.addColorStop(0, shade(col, 1)); g.addColorStop(.5, col); g.addColorStop(.92, shade(col, -1)); g.addColorStop(1, shade(col, -2));
      bx.fillStyle = g; bx.beginPath(); bx.arc(x, y, rad, 0, Math.PI * 2); bx.fill();
    };
    const balls = [];
    const cx0 = c + (r() - .5) * R * .25, cy0 = c + (r() - .3) * R * .2;
    balls.push([cx0, cy0, R * (.26 + r() * .08), main]);
    for (let i = 0, n = 5 + Math.floor(r() * 4); i < n; i++) { const a = r() * Math.PI * 2, d = R * (.25 + r() * .45); balls.push([cx0 + Math.cos(a) * d, cy0 + Math.sin(a) * d, R * (.09 + r() * .17), main]); }
    for (let i = 0, n = 2 + Math.floor(r() * 2); i < n; i++) { const a = r() * Math.PI * 2; balls.push([c + Math.cos(a) * R * .95, c + Math.sin(a) * R * .95, R * (.18 + r() * .14), main]); } // running out past the rim
    for (let i = 0, n = 6 + Math.floor(r() * 5); i < n; i++) { const a = r() * Math.PI * 2, d = R * (.3 + r() * .55); balls.push([c + Math.cos(a) * d, c + Math.sin(a) * d, R * (.04 + r() * .06), accent]); }
    balls.sort((a, b) => a[2] - b[2] < 0 ? 1 : -1); // big ones behind
    for (const b of balls) ball(...b);
    // the sphere: in focus at the top, out of focus towards the bottom
    const out = canvas(S), o = out.getContext('2d');
    o.save(); o.beginPath(); o.arc(c, c, R, 0, Math.PI * 2); o.clip();
    o.fillStyle = 'rgba(255,255,255,.03)'; o.fillRect(0, 0, S, S);
    o.drawImage(blurred(bub, 9), 0, 0);
    const sharp = canvas(S), sx = sharp.getContext('2d'); sx.drawImage(bub, 0, 0);
    const fade = sx.createLinearGradient(0, c - R, 0, c + R); fade.addColorStop(0, '#000'); fade.addColorStop(.5, '#000'); fade.addColorStop(.86, 'rgba(0,0,0,0)');
    sx.globalCompositeOperation = 'destination-in'; sx.fillStyle = fade; sx.fillRect(0, 0, S, S);
    o.drawImage(sharp, 0, 0);
    // the rim: the content magnified and smeared, as through thick glass
    const rim = canvas(S), rx = rim.getContext('2d'), mag = 1.22;
    rx.drawImage(blurred(bub, 4), c - c * mag, c - c * mag, S * mag, S * mag);
    rx.globalCompositeOperation = 'destination-in';
    const ring = rx.createRadialGradient(c, c, R * .72, c, c, R); ring.addColorStop(0, 'rgba(0,0,0,0)'); ring.addColorStop(.55, 'rgba(0,0,0,.85)'); ring.addColorStop(1, '#000');
    rx.fillStyle = ring; rx.fillRect(0, 0, S, S);
    o.drawImage(rim, 0, 0);
    // a faint fringe: warm on one side, cool on the other
    o.globalCompositeOperation = 'lighter';
    const u = S / SIZE; // (lines and offsets in proportion to the size drawn)
    for (const [col, dx, dy] of [['rgba(255,70,40,.32)', -1.6, -1.2], ['rgba(40,140,255,.32)', 1.6, 1.2]]) { o.strokeStyle = col; o.lineWidth = 3 * u; o.beginPath(); o.arc(c + dx * u, c + dy * u, R - 2.5 * u, 0, Math.PI * 2); o.stroke(); }
    o.globalCompositeOperation = 'source-over';
    // a soft highlight, upper left
    const hl = o.createRadialGradient(c - R * .45, c - R * .5, 0, c - R * .45, c - R * .5, R * .6); hl.addColorStop(0, 'rgba(255,255,255,.16)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    o.fillStyle = hl; o.fillRect(0, 0, S, S);
    o.restore();
    // the thin light rim
    o.strokeStyle = 'rgba(218,218,218,.85)'; o.lineWidth = 1.2 * u; o.beginPath(); o.arc(c, c, R, 0, Math.PI * 2); o.stroke();
    return out;
  }
  window.PrismSprite = {
    VARIANTS: 6,
    shade,
    // the prism of a colour (accent: another colour of the palette for the small bubbles), one of VARIANTS layouts
    // anim (optional): { t: seconds, move: 0–1, speed, turb } — the bubbles drifting; without it, the still prism
    get(main, palette, variant = 0, anim = null) {
      const m = main.toLowerCase(), others = (palette || []).map(x => x.toLowerCase()).filter(x => x !== m);
      const accent = others.length ? others[(variant * 3 + 1) % others.length] : shade(m, 2);
      const k = m + '|' + accent + '|' + variant;
      if (anim && anim.move > 0) return this.frames(main, palette, variant, anim)[0][0];
      let s = cache.get(k); if (!s) { s = build(m, accent, variant); cache.set(k, s); }
      return s;
    },
    // What to draw for a prism now: [[sprite, weight], …]. Still: the one prism. Moving: the bubbles are drawn 12
    // times a second (the prisms in use only, each kept while needed) and each moment is a blend of the two drawings
    // around it, so the motion is smooth without drawing every prism every frame.
    frames(main, palette, variant = 0, anim = null) {
      if (!anim || !(anim.move > 0)) return [[this.get(main, palette, variant), 1]];
      const m = main.toLowerCase(), others = (palette || []).map(x => x.toLowerCase()).filter(x => x !== m);
      const accent = others.length ? others[(variant * 3 + 1) % others.length] : shade(m, 2);
      variant %= 3; // (moving: three layouts per colour, so fewer drawings per step)
      const T = anim.t * anim.speed * 12, i0 = Math.floor(T), w = T - i0, set = [anim.move, anim.turb].join();
      if (set !== liveKey) { liveKey = set; live = new Map(); }
      const at = i => { const k = m + '|' + accent + '|' + variant + '|' + i; let s = live.get(k); if (!s) { s = build(m, accent, variant, i / 12, anim.move, anim.turb, 144); live.set(k, s); } return s; };
      // forget drawings more than a step behind
      if (live.size > 400) for (const k of [...live.keys()]) { const i = +k.slice(k.lastIndexOf('|') + 1); if (i < i0 - 1 || i > i0 + 2) live.delete(k); }
      return [[at(i0), 1 - w], [at(i0 + 1), w]];
    },
  };
})();
