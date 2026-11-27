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
  // The bubbles of a prism, at time t: [x, y, r, which] in units of the sphere's radius (centre 0), which: 0 the main
  // colour, 1 the accent; the big ones first (behind).
  function layout(main, variant, t = 0, move = 0, turb = 1) {
    const r = rng(variant * 7919 + parseInt(main.slice(1), 16) % 9973), balls = [];
    const cx0 = (r() - .5) * .25, cy0 = (r() - .3) * .2;
    balls.push([cx0, cy0, .26 + r() * .08, 0]);
    for (let i = 0, n = 5 + Math.floor(r() * 4); i < n; i++) { const a = r() * Math.PI * 2, d = .25 + r() * .45; balls.push([cx0 + Math.cos(a) * d, cy0 + Math.sin(a) * d, .09 + r() * .17, 0]); }
    for (let i = 0, n = 2 + Math.floor(r() * 2); i < n; i++) { const a = r() * Math.PI * 2; balls.push([Math.cos(a) * .95, Math.sin(a) * .95, .18 + r() * .14, 0]); } // running out past the rim
    for (let i = 0, n = 6 + Math.floor(r() * 5); i < n; i++) { const a = r() * Math.PI * 2, d = .3 + r() * .55; balls.push([Math.cos(a) * d, Math.sin(a) * d, .04 + r() * .06, 1]); }
    balls.forEach((b, i) => { const [dx, dy] = drift(variant * 131 + i * 17 + 5, t, move, turb); b[0] += dx * .3; b[1] += dy * .3; });
    return balls.sort((a, b) => b[2] - a[2]).slice(0, 28);
  }
  // ---- The glass, on the graphics card (WebGL), with the settings of the Figma "Glass" effect of the Prism
  // (refraction 1, depth 75 of the 120 px radius, dispersion 1, light intensity 1, splay 1) and its progressive
  // background blur (none at the top, 47.6 px at the bottom). The bubbles are worked out in the shader too (each a
  // lit sphere: light shade, colour, dark shade, with a soft dark rim), so a moving prism is just drawn again.
  const GLASS = { refraction: 1, depth: 75 / 120, dispersion: 1, light: 1, splay: 1, blur: 47.6 / 120, lightAngle: -2.36 };
  const VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  const FS = `precision highp float;
uniform vec2 uRes; uniform float uScale; uniform int uN; uniform vec4 uB[28]; uniform vec3 uC[8];
uniform float uRefr, uDepth, uDisp, uLight, uSplay, uBlur, uAng, uLine;
vec3 ramp(float ci, float g) {
  vec3 l = ci < .5 ? uC[0] : uC[4], b = ci < .5 ? uC[1] : uC[5], d = ci < .5 ? uC[2] : uC[6], e = ci < .5 ? uC[3] : uC[7];
  if (g < .5) return mix(l, b, g / .5);
  if (g < .92) return mix(b, d, (g - .5) / .42);
  return mix(d, e, (g - .92) / .08);
}
vec4 field(vec2 p, float bw) {
  vec3 col = vec3(0.); float a = 0.;
  for (int i = 0; i < 28; i++) {
    if (i >= uN) break;
    vec4 b = uB[i]; vec2 q = (p - b.xy) / b.z; float d = length(q);
    float w = max(bw / b.z, 1.5 / (uRes.x * .5 * b.z));
    float m = 1. - smoothstep(1. - w, 1. + w, d);
    if (m <= 0.) continue;
    float g = clamp(length(q - vec2(-.32, -.38)) / 1.42, 0., 1.);
    vec3 c = ramp(b.w, g) * mix(1., .8, smoothstep(.72, 1., d));
    col = col * (1. - m) + c * m; a = a * (1. - m) + m;
  }
  return vec4(col, a);
}
void main() {
  vec2 uv = (gl_FragCoord.xy / uRes) * 2. - 1.; uv.y = -uv.y; uv *= uScale;
  float r = length(uv), aa = 2. * uScale / uRes.x;
  float inside = 1. - smoothstep(1. - aa, 1. + aa, r);
  if (inside <= 0.) { gl_FragColor = vec4(0.); return; }
  // the glass bends what is behind it within depth of its rim: drawn in from further out, more near the edge,
  // each colour a little differently (dispersion)
  float band = smoothstep(1. - uDepth, 1., r), k = uRefr * .34 * band * band;
  float bw = uBlur * smoothstep(-.15, .95, uv.y) * .55 + k * .06;
  vec4 R = field(uv * (1. - k * (1. + .1 * uDisp)), bw), G = field(uv * (1. - k), bw), B = field(uv * (1. - k * (1. - .1 * uDisp)), bw);
  vec3 col = vec3(R.r, G.g, B.b); float a = max(max(R.a, G.a), B.a);
  col += vec3(.01) * (1. - a); a += .01 * (1. - a); // the glass body (1 % white)
  // the light: a sheen along the rim, towards the light and its opposite side (splay widens it), and a soft glow
  vec2 L = vec2(cos(uAng), sin(uAng));
  float face = abs(dot(normalize(uv + 1e-5), L)), rim = smoothstep(1. - .16 * uSplay, 1., r);
  float spec = uLight * rim * face * face * .5 + uLight * .07 * (1. - smoothstep(0., .75, length(uv - L * .5)));
  col += vec3(spec); a = max(a, min(1., spec));
  // the thin light line round it
  float line = smoothstep(1. - uLine - aa, 1. - uLine, r);
  col = mix(col, vec3(.853), line * .9); a = max(a, line * .9);
  gl_FragColor = vec4(col, a) * inside;
}`;
  let gl = null, glCv = null, prog = null, loc = null, glFailed = false;
  function glInit() {
    if (gl || glFailed) return !!gl;
    try {
      glCv = document.createElement('canvas'); glCv.width = glCv.height = 64;
      gl = glCv.getContext('webgl', { premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: true, antialias: false });
      if (!gl) throw new Error('no webgl');
      const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const pl = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(pl); gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0);
      loc = {}; for (const n of ['uRes', 'uScale', 'uN', 'uB', 'uC', 'uRefr', 'uDepth', 'uDisp', 'uLight', 'uSplay', 'uBlur', 'uAng', 'uLine']) loc[n] = gl.getUniformLocation(prog, n);
      return true;
    } catch (e) { console.warn('Prism: sin WebGL, vidrio aproximado', e); gl = null; glFailed = true; return false; }
  }
  const rgb01 = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  function buildGL(main, accent, balls, S) {
    if (!glInit()) return null;
    if (glCv.width !== S || glCv.height !== S) { glCv.width = glCv.height = S; }
    gl.viewport(0, 0, S, S); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    const R = S / 2 - 3 * S / SIZE;
    gl.uniform2f(loc.uRes, S, S); gl.uniform1f(loc.uScale, (S / 2) / R); gl.uniform1i(loc.uN, balls.length);
    const B = new Float32Array(28 * 4); balls.forEach((b, i) => B.set(b, i * 4)); gl.uniform4fv(loc.uB, B);
    const C = []; for (const col of [main, accent]) for (const st of [1, 0, -1, -2]) C.push(...rgb01(shade(col, st))); gl.uniform3fv(loc.uC, new Float32Array(C));
    gl.uniform1f(loc.uRefr, GLASS.refraction); gl.uniform1f(loc.uDepth, GLASS.depth); gl.uniform1f(loc.uDisp, GLASS.dispersion);
    gl.uniform1f(loc.uLight, GLASS.light); gl.uniform1f(loc.uSplay, GLASS.splay); gl.uniform1f(loc.uBlur, GLASS.blur); gl.uniform1f(loc.uAng, GLASS.lightAngle);
    gl.uniform1f(loc.uLine, Math.max(.004, 1.1 / R));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const out = canvas(S); out.getContext('2d').drawImage(glCv, 0, 0); return out;
  }
  // ---- without WebGL: the glass approximated on a 2D canvas
  function build2D(main, accent, balls, S) {
    const c = S / 2, R = S / 2 - 3 * S / SIZE;
    const bub = canvas(S), bx = bub.getContext('2d');
    for (const [x0, y0, rr, w] of balls) {
      const x = c + x0 * R, y = c + y0 * R, rad = rr * R, col = w ? accent : main;
      const g = bx.createRadialGradient(x - rad * .32, y - rad * .38, rad * .05, x, y, rad);
      g.addColorStop(0, shade(col, 1)); g.addColorStop(.5, col); g.addColorStop(.92, shade(col, -1)); g.addColorStop(1, shade(col, -2));
      bx.fillStyle = g; bx.beginPath(); bx.arc(x, y, rad, 0, Math.PI * 2); bx.fill();
    }
    const out = canvas(S), o = out.getContext('2d');
    o.save(); o.beginPath(); o.arc(c, c, R, 0, Math.PI * 2); o.clip();
    o.fillStyle = 'rgba(255,255,255,.03)'; o.fillRect(0, 0, S, S);
    o.drawImage(blurred(bub, 9), 0, 0);
    const sharp = canvas(S), sx = sharp.getContext('2d'); sx.drawImage(bub, 0, 0);
    const fade = sx.createLinearGradient(0, c - R, 0, c + R); fade.addColorStop(0, '#000'); fade.addColorStop(.5, '#000'); fade.addColorStop(.86, 'rgba(0,0,0,0)');
    sx.globalCompositeOperation = 'destination-in'; sx.fillStyle = fade; sx.fillRect(0, 0, S, S);
    o.drawImage(sharp, 0, 0);
    const rim = canvas(S), rx = rim.getContext('2d'), mag = 1.22;
    rx.drawImage(blurred(bub, 4), c - c * mag, c - c * mag, S * mag, S * mag);
    rx.globalCompositeOperation = 'destination-in';
    const ring = rx.createRadialGradient(c, c, R * .72, c, c, R); ring.addColorStop(0, 'rgba(0,0,0,0)'); ring.addColorStop(.55, 'rgba(0,0,0,.85)'); ring.addColorStop(1, '#000');
    rx.fillStyle = ring; rx.fillRect(0, 0, S, S);
    o.drawImage(rim, 0, 0);
    o.globalCompositeOperation = 'lighter';
    const u = S / SIZE;
    for (const [col, dx, dy] of [['rgba(255,70,40,.32)', -1.6, -1.2], ['rgba(40,140,255,.32)', 1.6, 1.2]]) { o.strokeStyle = col; o.lineWidth = 3 * u; o.beginPath(); o.arc(c + dx * u, c + dy * u, R - 2.5 * u, 0, Math.PI * 2); o.stroke(); }
    o.globalCompositeOperation = 'source-over';
    const hl = o.createRadialGradient(c - R * .45, c - R * .5, 0, c - R * .45, c - R * .5, R * .6); hl.addColorStop(0, 'rgba(255,255,255,.16)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    o.fillStyle = hl; o.fillRect(0, 0, S, S);
    o.restore();
    o.strokeStyle = 'rgba(218,218,218,.85)'; o.lineWidth = 1.2 * u; o.beginPath(); o.arc(c, c, R, 0, Math.PI * 2); o.stroke();
    return out;
  }
  function build(main, accent, variant, t = 0, move = 0, turb = 1, S = SIZE) {
    const balls = layout(main, variant, t, move, turb);
    return buildGL(main, accent, balls, S) || build2D(main, accent, balls, S);
  }
  window.PrismSprite = {
    VARIANTS: 6,
    shade,
    // the prism of a colour (accent: another colour of the palette for the small bubbles), one of VARIANTS layouts
    // anim (optional): { t: seconds, move: 0–1, speed, turb } — the bubbles drifting; without it, the still prism
    // px: how big it is drawn (device pixels), so a big prism is drawn finely enough (256, 512 or 1024 across)
    get(main, palette, variant = 0, anim = null, px = 0) {
      const m = main.toLowerCase(), others = (palette || []).map(x => x.toLowerCase()).filter(x => x !== m);
      const accent = others.length ? others[(variant * 3 + 1) % others.length] : shade(m, 2);
      if (anim && anim.move > 0) return this.frames(main, palette, variant, anim, px)[0][0];
      const res = px > 600 ? 1024 : px > 300 ? 512 : SIZE, k = m + '|' + accent + '|' + variant + '|' + res;
      let s = cache.get(k); if (!s) { s = build(m, accent, variant, 0, 0, 1, res); cache.set(k, s); }
      return s;
    },
    // What to draw for a prism now: [[sprite, 1]]. Moving: the prism drawn again for this moment (60 steps a second,
    // the prisms in use only), never a blend of two drawings (a blend of two semi-transparent glasses is dimmer than
    // either: the prisms pulsed with it).
    frames(main, palette, variant = 0, anim = null, px = 0) {
      if (!anim || !(anim.move > 0)) return [[this.get(main, palette, variant, null, px), 1]];
      const res = px > 600 ? 768 : px > 300 ? 512 : px > 150 ? 320 : 192;
      const m = main.toLowerCase(), others = (palette || []).map(x => x.toLowerCase()).filter(x => x !== m);
      const accent = others.length ? others[(variant * 3 + 1) % others.length] : shade(m, 2);
      const tq = Math.round(anim.t * anim.speed * 60) / 60, set = [tq, anim.move, anim.turb].join();
      if (set !== liveKey) { liveKey = set; live = new Map(); }
      const k = m + '|' + accent + '|' + variant + '|' + res;
      let s = live.get(k); if (!s) { s = build(m, accent, variant, tq, anim.move, anim.turb, res); live.set(k, s); }
      return [[s, 1]];
    },
  };
})();
