// Stipple3D: a small CPU renderer that turns triangles into stipple. render() rasterizes view-space
// triangles (x right, y down, z towards the viewer, orthographic) into depth and normal buffers with a
// z-buffer, so nearer surfaces hide farther ones, and lights them from one direction with cast shadows (a
// shadow map seen from the light). sample() then scatters points over what is visible: more where it is
// dark (shade and cast shadow), and along edges, where depth or the surface's direction jumps, which is where
// one surface passes over another and on silhouettes. Shared by Pixel Waves (hydrangeas) and Pixel Model
// (uploaded OBJ / GLB), which also use the loaders below.
(() => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const norm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

  // tris: Float32Array, 18 per triangle (three positions, then three normals). box: the view-space rectangle
  // the buffer covers, { x0, y0, x1, y1 }; res: buffer width in pixels.
  function render(tris, box, res, light, opts = {}) {
    const W = res, H = Math.max(1, Math.round(res * (box.y1 - box.y0) / (box.x1 - box.x0))), k = W / (box.x1 - box.x0);
    const depth = new Float32Array(W * H).fill(-Infinity), nrm = new Float32Array(W * H * 3), n = tris.length / 18;
    const L = norm3(light);
    raster(tris, n, W, H, (x, y) => [(x - box.x0) * k, (y - box.y0) * k], depth, nrm);
    // Shadow map: the scene seen along the light, orthographic, nearest surface to the light kept.
    let shadow = null;
    if (opts.shadows !== false) {
      const up = Math.abs(L[1]) > .9 ? [1, 0, 0] : [0, 1, 0];
      const ax = norm3([up[1] * L[2] - up[2] * L[1], up[2] * L[0] - up[0] * L[2], up[0] * L[1] - up[1] * L[0]]);
      const ay = [L[1] * ax[2] - L[2] * ax[1], L[2] * ax[0] - L[0] * ax[2], L[0] * ax[1] - L[1] * ax[0]];
      const toL = (x, y, z) => [x * ax[0] + y * ax[1] + z * ax[2], x * ay[0] + y * ay[1] + z * ay[2], x * L[0] + y * L[1] + z * L[2]];
      let u0 = Infinity, v0 = Infinity, u1 = -Infinity, v1 = -Infinity;
      const lt = new Float32Array(tris.length);
      for (let t = 0; t < n; t++) for (let j = 0; j < 3; j++) {
        const o = t * 18 + j * 3, p = toL(tris[o], tris[o + 1], tris[o + 2]);
        lt.set(p, o); lt.set([0, 0, 1], o + 9);
        u0 = Math.min(u0, p[0]); u1 = Math.max(u1, p[0]); v0 = Math.min(v0, p[1]); v1 = Math.max(v1, p[1]);
      }
      const SW = Math.round(res * 1.2), sk = SW / Math.max(1e-9, Math.max(u1 - u0, v1 - v0)), SH = SW;
      const sdepth = new Float32Array(SW * SH).fill(-Infinity);
      raster(lt, n, SW, SH, (u, v) => [(u - u0) * sk, (v - v0) * sk], sdepth, null);
      shadow = { toL, sdepth, SW, SH, sk, u0, v0, bias: (opts.bias ?? 6) / sk }; // margin against thin surfaces shadowing themselves
    }
    // Light: ambient plus diffuse, two-sided (a surface seen from behind is lit as its front), shadowed where
    // something nearer the light covers it.
    const amb = opts.ambient ?? .18, lit = new Float32Array(W * H), mask = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) {
      if (depth[i] === -Infinity) continue;
      mask[i] = 1;
      let nx = nrm[i * 3], ny = nrm[i * 3 + 1], nz = nrm[i * 3 + 2];
      if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      let d = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
      if (shadow && d > 0) {
        const x = box.x0 + (i % W + .5) / k, y = box.y0 + (Math.floor(i / W) + .5) / k, p = shadow.toL(x, y, depth[i]);
        const sx = Math.floor((p[0] - shadow.u0) * shadow.sk), sy = Math.floor((p[1] - shadow.v0) * shadow.sk);
        if (sx >= 0 && sy >= 0 && sx < shadow.SW && sy < shadow.SH && shadow.sdepth[sy * shadow.SW + sx] > p[2] + shadow.bias) d *= opts.shadowDim ?? .3;
      }
      lit[i] = amb + (1 - amb) * d;
    }
    return { W, H, k, box, depth, nrm, lit, mask };
  }
  // Barycentric fill of each triangle's bounding box; keeps the largest z (nearest to the viewer, or to the
  // light for the shadow map) and, when nrm is given, its interpolated normal.
  function raster(tris, n, W, H, map, depth, nrm) {
    for (let t = 0; t < n; t++) {
      const o = t * 18, a = map(tris[o], tris[o + 1]), b = map(tris[o + 3], tris[o + 4]), c = map(tris[o + 6], tris[o + 7]);
      const za = tris[o + 2], zb = tris[o + 5], zc = tris[o + 8];
      const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      if (Math.abs(area) < 1e-9) continue;
      const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))), x1 = Math.min(W - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
      const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))), y1 = Math.min(H - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const px = x + .5, py = y + .5;
        const w0 = ((b[0] - px) * (c[1] - py) - (b[1] - py) * (c[0] - px)) / area;
        const w1 = ((c[0] - px) * (a[1] - py) - (c[1] - py) * (a[0] - px)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * za + w1 * zb + w2 * zc, i = y * W + x;
        if (z <= depth[i]) continue;
        depth[i] = z;
        if (nrm) for (let q = 0; q < 3; q++) nrm[i * 3 + q] = w0 * tris[o + 9 + q] + w1 * tris[o + 12 + q] + w2 * tris[o + 15 + q];
      }
    }
  }
  // Edge strength per pixel: a jump in depth to a neighbour (one surface over another, or the silhouette) or a
  // sharp turn of the surface.
  function edges(buf, depthJump) {
    const { W, H, depth, nrm, mask } = buf, e = new Float32Array(W * H);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (!mask[i]) continue;
      let s = 0;
      for (const j of [i - 1, i + 1, i - W, i + W]) {
        if (!mask[j]) { s = Math.max(s, 1); continue; }
        if (depth[j] - depth[i] > depthJump) s = Math.max(s, 1); // this pixel lies just behind the edge of a nearer surface
        const dot = nrm[i * 3] * nrm[j * 3] + nrm[i * 3 + 1] * nrm[j * 3 + 1] + nrm[i * 3 + 2] * nrm[j * 3 + 2];
        const l = Math.hypot(nrm[i * 3], nrm[i * 3 + 1], nrm[i * 3 + 2]) * Math.hypot(nrm[j * 3], nrm[j * 3 + 1], nrm[j * 3 + 2]) || 1;
        s = Math.max(s, clamp((.97 - Math.abs(dot) / l) * 6));
      }
      e[i] = s;
    }
    return e;
  }
  // n points over the visible surface, as [x, y, tone, …] in view space (tone 0 = light, 1 = dark). A
  // candidate pixel is kept with a chance that grows with darkness (gamma, contrast) and with its edge
  // strength (edge); jitter shifts it inside its pixel.
  function sample(buf, e, n, rnd, o = {}) {
    const { W, H, k, box, lit, mask } = buf, out = [], gamma = o.gamma ?? 1.4, edge = o.edge ?? .9, floor = o.floor ?? .02, gain = o.gain ?? 1;
    const idx = []; for (let i = 0; i < W * H; i++) if (mask[i]) idx.push(i);
    if (!idx.length) return out;
    for (let tries = 0; out.length < n * 3 && tries < n * 40; tries++) {
      const i = idx[Math.floor(rnd() * idx.length)], dark = 1 - lit[i];
      // threshold: tones lighter than it get no points (edges still do), the rest are rescaled from it.
      const t = o.threshold || 0, dk = t ? (dark < t ? 0 : (dark - t) / (1 - t)) : dark;
      const p = Math.min(1, (t && dk <= 0 ? 0 : Math.pow(dk, gamma) * gain + floor) + e[i] * edge);
      if (rnd() > p) continue;
      out.push(box.x0 + (i % W + rnd()) / k, box.y0 + (Math.floor(i / W) + rnd()) / k, dark);
    }
    return out;
  }
  // Normals for a triangle soup: at each corner, the average of the faces meeting there that turn less than
  // `crease` degrees from this face, so curved surfaces shade smoothly and hard edges stay hard.
  function withNormals(pos, crease = 50) {
    const n = pos.length / 9, out = new Float32Array(n * 18), at = new Map(), fn = [], key = (x, y, z) => `${x.toFixed(5)},${y.toFixed(5)},${z.toFixed(5)}`, cos = Math.cos(crease * Math.PI / 180);
    for (let t = 0; t < n; t++) {
      const o = t * 9, ux = pos[o + 3] - pos[o], uy = pos[o + 4] - pos[o + 1], uz = pos[o + 5] - pos[o + 2], vx = pos[o + 6] - pos[o], vy = pos[o + 7] - pos[o + 1], vz = pos[o + 8] - pos[o + 2];
      const f = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]; fn.push(f);
      for (let j = 0; j < 3; j++) { const kk = key(pos[o + j * 3], pos[o + j * 3 + 1], pos[o + j * 3 + 2]); (at.get(kk) || at.set(kk, []).get(kk)).push(t); }
    }
    for (let t = 0; t < n; t++) {
      const me = norm3(fn[t]);
      for (let j = 0; j < 3; j++) {
        const o = t * 9 + j * 3, sum = [0, 0, 0];
        for (const u of at.get(key(pos[o], pos[o + 1], pos[o + 2]))) {
          const f = fn[u], l = Math.hypot(f[0], f[1], f[2]) || 1;
          if ((f[0] * me[0] + f[1] * me[1] + f[2] * me[2]) / l < cos) continue;
          sum[0] += f[0]; sum[1] += f[1]; sum[2] += f[2];
        }
        out.set([pos[o], pos[o + 1], pos[o + 2]], t * 18 + j * 3); out.set(norm3(sum), t * 18 + 9 + j * 3);
      }
    }
    return out;
  }

  // ---------- Loaders: positions as a flat triangle list, 9 per triangle ----------
  function parseOBJ(text) {
    const v = [], out = [];
    for (const line of text.split('\n')) {
      const p = line.trim().split(/\s+/);
      if (p[0] === 'v') v.push([+p[1], +p[2], +p[3]]);
      else if (p[0] === 'f') {
        const ids = p.slice(1).map(s => { const i = parseInt(s, 10); return i < 0 ? v.length + i : i - 1; });
        for (let j = 1; j + 1 < ids.length; j++) for (const i of [ids[0], ids[j], ids[j + 1]]) out.push(...(v[i] || [0, 0, 0]));
      }
    }
    return new Float32Array(out);
  }
  // glTF 2.0, binary (.glb) or JSON (.gltf with embedded data: buffers): every mesh primitive in the default
  // scene, with its node transforms applied.
  function parseGLB(buffer) {
    const dv = new DataView(buffer);
    let json, bin = null;
    if (dv.getUint32(0, true) === 0x46546C67) {
      let o = 12;
      while (o < buffer.byteLength) {
        const len = dv.getUint32(o, true), type = dv.getUint32(o + 4, true);
        if (type === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, o + 8, len)));
        else if (type === 0x004E4942) bin = buffer.slice(o + 8, o + 8 + len);
        o += 8 + len;
      }
    } else json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer)));
    const buffers = (json.buffers || []).map((b, i) => {
      if (!b.uri) return bin;
      const m = /^data:.*?;base64,(.*)$/.exec(b.uri);
      if (!m) throw new Error('external buffer');
      const s = atob(m[1]), a = new Uint8Array(s.length); for (let j = 0; j < s.length; j++) a[j] = s.charCodeAt(j); return a.buffer;
    });
    const COMP = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
    const SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
    const read = ai => {
      const a = json.accessors[ai], bv = json.bufferViews[a.bufferView], T = COMP[a.componentType], size = SIZE[a.type];
      const stride = bv.byteStride || T.BYTES_PER_ELEMENT * size, base = (bv.byteOffset || 0) + (a.byteOffset || 0), src = buffers[bv.buffer], out = new Float64Array(a.count * size);
      const view = new DataView(src);
      const get = { 5120: 'getInt8', 5121: 'getUint8', 5122: 'getInt16', 5123: 'getUint16', 5125: 'getUint32', 5126: 'getFloat32' }[a.componentType];
      for (let i = 0; i < a.count; i++) for (let c = 0; c < size; c++) out[i * size + c] = view[get](base + i * stride + c * T.BYTES_PER_ELEMENT, true);
      return out;
    };
    const mul = (a, b) => { const o = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) o[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]; return o; };
    const local = nd => {
      if (nd.matrix) return nd.matrix;
      const [tx, ty, tz] = nd.translation || [0, 0, 0], [qx, qy, qz, qw] = nd.rotation || [0, 0, 0, 1], [sx, sy, sz] = nd.scale || [1, 1, 1];
      return [(1 - 2 * (qy * qy + qz * qz)) * sx, 2 * (qx * qy + qz * qw) * sx, 2 * (qx * qz - qy * qw) * sx, 0,
        2 * (qx * qy - qz * qw) * sy, (1 - 2 * (qx * qx + qz * qz)) * sy, 2 * (qy * qz + qx * qw) * sy, 0,
        2 * (qx * qz + qy * qw) * sz, 2 * (qy * qz - qx * qw) * sz, (1 - 2 * (qx * qx + qy * qy)) * sz, 0, tx, ty, tz, 1];
    };
    const out = [];
    const visit = (ni, parent) => {
      const nd = json.nodes[ni], m = mul(parent, local(nd));
      if (nd.mesh != null) for (const pr of json.meshes[nd.mesh].primitives) {
        if ((pr.mode ?? 4) !== 4 || pr.attributes.POSITION == null) continue;
        const P = read(pr.attributes.POSITION), I = pr.indices != null ? read(pr.indices) : Array.from({ length: P.length / 3 }, (_, i) => i);
        for (const i of I) { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; out.push(m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]); }
      }
      for (const c of nd.children || []) visit(c, m);
    };
    const I4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], scene = json.scenes ? json.scenes[json.scene || 0] : { nodes: json.nodes.map((_, i) => i) };
    for (const ni of scene.nodes) visit(ni, I4);
    return new Float32Array(out);
  }
  // FBX, binary or ASCII: every mesh (Geometry) with the transforms of the models it hangs from (Lcl Translation,
  // Rotation in X then Y then Z, Scaling, parent to child). Polygons are fanned into triangles. Async, since binary
  // arrays are often zlib-compressed.
  async function parseFBX(buffer) {
    const u8 = new Uint8Array(buffer), head = new TextDecoder().decode(u8.subarray(0, 20));
    const root = head.startsWith('Kaydara FBX Binary') ? await fbxBinary(buffer) : fbxAscii(new TextDecoder().decode(u8));
    const child = (n, name) => n.children.find(c => c.name === name);
    const objects = child(root, 'Objects'), conns = child(root, 'Connections');
    if (!objects) throw new Error('no objects');
    const geoms = new Map(), models = new Map(), parent = new Map();
    for (const o of objects.children) {
      if (o.name === 'Geometry') {
        const v = child(o, 'Vertices'), ix = child(o, 'PolygonVertexIndex');
        if (v && ix) geoms.set(o.props[0], { v: v.props[0], ix: ix.props[0] });
      } else if (o.name === 'Model') {
        const t = { T: [0, 0, 0], R: [0, 0, 0], S: [1, 1, 1] }, p70 = child(o, 'Properties70');
        if (p70) for (const P of p70.children) {
          const k = P.props[0], val = P.props.slice(-3).map(Number);
          if (k === 'Lcl Translation') t.T = val; else if (k === 'Lcl Rotation') t.R = val; else if (k === 'Lcl Scaling') t.S = val;
        }
        models.set(o.props[0], t);
      }
    }
    if (conns) for (const c of conns.children) if (c.props[0] === 'OO') parent.set(c.props[1], c.props[2]);
    const apply = (t, p) => {
      let [x, y, z] = [p[0] * t.S[0], p[1] * t.S[1], p[2] * t.S[2]];
      const [a, b, c] = t.R.map(d => d * Math.PI / 180);
      [y, z] = [y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
      [x, z] = [x * Math.cos(b) + z * Math.sin(b), -x * Math.sin(b) + z * Math.cos(b)];
      [x, y] = [x * Math.cos(c) - y * Math.sin(c), x * Math.sin(c) + y * Math.cos(c)];
      return [x + t.T[0], y + t.T[1], z + t.T[2]];
    };
    const out = [];
    for (const [id, g] of geoms) {
      const chain = []; for (let m = parent.get(id), k = 0; m !== undefined && models.has(m) && k < 64; m = parent.get(m), k++) chain.push(models.get(m));
      const P = i => { let q = [g.v[i * 3], g.v[i * 3 + 1], g.v[i * 3 + 2]]; for (const t of chain) q = apply(t, q); return q; };
      let poly = [];
      for (let k = 0; k < g.ix.length; k++) {
        let i = Number(g.ix[k]); const end = i < 0; if (end) i = ~i;
        poly.push(i);
        if (end) { for (let j = 1; j + 1 < poly.length; j++) for (const q of [poly[0], poly[j], poly[j + 1]]) out.push(...P(q)); poly = []; }
      }
    }
    return new Float32Array(out);
  }
  async function fbxBinary(buffer) {
    const dv = new DataView(buffer), version = dv.getUint32(23, true), wide = version >= 7500, td = new TextDecoder();
    const inflate = async bytes => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
    const ARR = { f: [Float32Array, 4], d: [Float64Array, 8], i: [Int32Array, 4], l: [BigInt64Array, 8], b: [Uint8Array, 1] };
    async function node(o) {
      const end = wide ? Number(dv.getBigUint64(o, true)) : dv.getUint32(o, true);
      const nProps = wide ? Number(dv.getBigUint64(o + 8, true)) : dv.getUint32(o + 4, true);
      let p = o + (wide ? 24 : 12); const nameLen = dv.getUint8(p); p++;
      if (end === 0) return null;
      const n = { name: td.decode(new Uint8Array(buffer, p, nameLen)), props: [], children: [] }; p += nameLen;
      for (let k = 0; k < nProps; k++) {
        const t = String.fromCharCode(dv.getUint8(p)); p++;
        if (t === 'Y') { n.props.push(dv.getInt16(p, true)); p += 2; }
        else if (t === 'C') { n.props.push(dv.getUint8(p)); p += 1; }
        else if (t === 'I') { n.props.push(dv.getInt32(p, true)); p += 4; }
        else if (t === 'F') { n.props.push(dv.getFloat32(p, true)); p += 4; }
        else if (t === 'D') { n.props.push(dv.getFloat64(p, true)); p += 8; }
        else if (t === 'L') { n.props.push(dv.getBigInt64(p, true)); p += 8; }
        else if (t === 'S' || t === 'R') { const len = dv.getUint32(p, true); p += 4; n.props.push(t === 'S' ? td.decode(new Uint8Array(buffer, p, len)) : null); p += len; }
        else if (ARR[t]) {
          const len = dv.getUint32(p, true), enc = dv.getUint32(p + 4, true), clen = dv.getUint32(p + 8, true); p += 12;
          let bytes = new Uint8Array(buffer, p, clen); p += clen;
          if (enc === 1) bytes = await inflate(bytes); else bytes = bytes.slice();
          const [T, sz] = ARR[t]; n.props.push(new T(bytes.buffer, bytes.byteOffset, len));
        } else throw new Error('fbx prop ' + t);
      }
      while (p < end) { const c = await node(p); if (!c) break; n.children.push(c.n); p = c.end; }
      return { n, end };
    }
    const root = { name: '', props: [], children: [] };
    for (let o = 27; o < buffer.byteLength - 13;) { const c = await node(o); if (!c) break; root.children.push(c.n); o = c.end; }
    return root;
  }
  // ASCII FBX: Name: prop, prop { children }, with arrays written as *N { a: 1,2,3 }.
  function fbxAscii(text) {
    const root = { name: '', props: [], children: [] }, stack = [root];
    const toks = text.replace(/;[^\n]*/g, '').match(/"[^"]*"|[A-Za-z_][\w|]*:|[{}]|[-+]?[\d.]+(?:[eE][-+]?\d+)?|\*\d+|[A-Za-z_]\w*|,/g) || [];
    let cur = null;
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (t.endsWith(':')) {
        const name = t.slice(0, -1);
        if (name === 'a' && cur) { const arr = []; while (i + 1 < toks.length && toks[i + 1] !== '}') { const v = toks[++i]; if (v !== ',') arr.push(Number(v)); } cur.props = [arr]; continue; }
        cur = { name, props: [], children: [] }; stack[stack.length - 1].children.push(cur);
      } else if (t === '{') { if (cur) stack.push(cur); }
      else if (t === '}') { if (stack.length > 1) cur = stack.pop(); }
      else if (t === ',' || t.startsWith('*')) continue;
      else if (cur) cur.props.push(t[0] === '"' ? t.slice(1, -1) : /^[-+\d.]/.test(t) ? Number(t) : t);
    }
    return root;
  }
  window.Stipple3D = { render, edges, sample, withNormals, parseOBJ, parseGLB, parseFBX };
})();
