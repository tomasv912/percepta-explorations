// Retouch toolbar shared by Pixel Waves and Pixel Rise, the same one as the D3 artifact: Mover (H) moves the
// content, Lupa (Z) zooms the view (click in, Alt+click out, drag pans), Pincel (B) adds points, Goma (E)
// removes them, Dedo (D) carries them along the stroke and scatters them, Gota (G) makes them wander so edges
// soften. Space held or the middle button pans the view with any tool, the wheel zooms, right click opens the
// active brush's settings, ⌘Z undoes the last stroke, 0 fits the view. Zoom is a CSS transform on the frame,
// so it never changes the export. Pages can add tools of their own (extra), and own what a stroke does.
(() => {
  const SVG = p => `<svg viewBox="0 0 22 22" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ICON = {
    move: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 1.5v13M1.5 8h13M8 1.5 6.2 3.3M8 1.5l1.8 1.8M8 14.5l-1.8-1.8M8 14.5l1.8-1.8M1.5 8l1.8-1.8M1.5 8l1.8 1.8M14.5 8l-1.8-1.8M14.5 8l-1.8 1.8"/></svg>',
    zoom: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3.5 3.5M5 7h4M7 5v4"/></svg>',
    paint: SVG('<path d="M18.5 3.5l-8.6 8.6"/><path d="M12.4 9.6l1.9 1.9"/><path d="M9.6 12.3a2.8 2.8 0 0 0-3.9 0c-1.2 1.2-.7 3.3-2.2 4.7 2.6 1 5.6.6 6.9-.8a2.8 2.8 0 0 0-.8-3.9z"/>'),
    erase: SVG('<path d="M8.5 18.5l-4-4a1.5 1.5 0 0 1 0-2.1l8.4-8.4a1.5 1.5 0 0 1 2.1 0l3.5 3.5a1.5 1.5 0 0 1 0 2.1l-7.5 7.5"/><path d="M8.5 18.5h10"/><path d="M8 9l5.5 5.5"/>'),
    smudge: SVG('<path d="M8.5 13V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11.5 10V8.5a1.5 1.5 0 0 1 3 0V11"/><path d="M14.5 10.5a1.5 1.5 0 0 1 3 0V14a5 5 0 0 1-5 5h-1.6a4 4 0 0 1-3.1-1.5l-2.6-3.3a1.5 1.5 0 0 1 2.3-1.9l1 1.2"/>'),
    blur: SVG('<path d="M11 3.5S5.5 9.8 5.5 13.5a5.5 5.5 0 0 0 11 0C16.5 9.8 11 3.5 11 3.5z"/>'),
    undo: SVG('<path d="M8 8H4V4"/><path d="M4.4 8A7 7 0 1 1 5 14.5"/>'),
    clear: SVG('<path d="M5 7h12"/><path d="M9 7V5h4v2"/><path d="M7 7l.8 11h6.4L15 7"/>'),
  };
  const TOOLS = [
    ['move', 'Mover la forma (H)', 'h'], ['zoom', 'Lupa (Z): clic acerca, Alt+clic aleja', 'z'], null,
    ['paint', 'Pincel (B): agregar puntos · clic derecho: ajustes', 'b'], ['erase', 'Goma (E): sacar puntos · clic derecho: ajustes', 'e'],
    ['smudge', 'Dedo (D): arrastrá para dispersar · clic derecho: ajustes', 'd'], ['blur', 'Gota (G): desenfocar · clic derecho: ajustes', 'g'],
  ];
  const css = document.createElement('style');
  css.textContent = `
.rt-bar { position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); display: flex; gap: 2px; align-items: center; padding: 4px; z-index: 6;
  background: var(--surface); border-radius: 10px; box-shadow: 0 0 0 1px var(--line), 0 4px 18px rgb(0 0 0 / .14); }
.rt-bar button { display: grid; place-items: center; width: 34px; height: 34px; border: 0; border-radius: 7px; background: transparent; color: var(--text); cursor: pointer; padding: 0; }
.rt-bar button:hover { background: var(--fill); }
.rt-bar button[aria-pressed="true"] { background: var(--text); color: var(--surface); }
.rt-bar button:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.rt-bar .rt-zoom { width: auto; min-width: 56px; padding: 0 8px; font: 500 12px var(--mono); font-variant-numeric: tabular-nums; color: var(--text-2); }
.rt-bar i { width: 1px; height: 20px; background: var(--line); margin: 0 4px; }
.rt-brush { position: absolute; left: 0; top: 0; border-radius: 50%; border: 1px solid rgb(255 255 255 / .9); box-shadow: 0 0 0 1px rgb(0 0 0 / .45); pointer-events: none; transform: translate(-50%, -50%); z-index: 5; }
.rt-pop { position: fixed; z-index: 30; width: 230px; background: var(--surface); border-radius: 10px; box-shadow: 0 0 0 1px var(--line), 0 10px 30px rgb(0 0 0 / .18); padding: 12px; display: flex; flex-direction: column; gap: 10px; font: 13px/1.4 var(--font); color: var(--text); }
.rt-pop h3 { margin: 0; font-size: 12px; font-weight: 600; }
.rt-pop p { margin: 0; color: var(--text-3); font-size: 12px; line-height: 1.45; }
.rt-pop .rt-sl { display: grid; grid-template-columns: 1fr auto; gap: 4px 8px; align-items: center; }
.rt-pop .rt-sl label { color: var(--text-2); font-size: 12px; }
.rt-pop .rt-sl output { font: 12px var(--mono); }
.rt-pop .rt-sl input { grid-column: 1 / -1; width: 100%; accent-color: var(--text); margin: 0; }
[data-rt-tool="move"] { cursor: grab; }
[data-rt-tool="move"].rt-dragging, .rt-panning { cursor: grabbing !important; }
[data-rt-tool="zoom"] { cursor: zoom-in; }
[data-rt-tool="zoom"].rt-alt { cursor: zoom-out; }
[data-rt-tool="paint"], [data-rt-tool="erase"], [data-rt-tool="smudge"], [data-rt-tool="blur"], [data-rt-brush] { cursor: none; }
`;
  document.head.appendChild(css);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  window.RetouchTools = function (o) {
    const { stage, frame } = o, extra = o.extra || [];
    const BR = {
      paint: { name: 'Pincel', size: .05, str: .5 },
      erase: { name: 'Goma', size: .06, str: .5 },
      smudge: { name: 'Dedo', size: .08, str: .6, scatter: .35 },
      blur: { name: 'Gota', size: .1, str: .5 },
    }; // size: brush radius as a share of the artboard height
    const bar = document.createElement('div'); bar.className = 'rt-bar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Herramientas');
    const list = [...TOOLS];
    if (extra.length) list.push(null, ...extra.map(x => [x.id, x.title, x.key]));
    bar.innerHTML = list.map(t => t ? `<button data-tool="${t[0]}" title="${t[1]}" aria-label="${t[1].split(' (')[0]}">${ICON[t[0]] || extra.find(x => x.id === t[0]).icon}</button>` : '<i></i>').join('') +
      `<i></i><button data-act="undo" title="Deshacer (⌘Z)" aria-label="Deshacer">${ICON.undo}</button><button data-act="clear" title="Borrar retoques" aria-label="Borrar retoques">${ICON.clear}</button>` +
      `<i></i><button class="rt-zoom" data-act="fit" title="Ajustar a la vista (0)">100%</button>`;
    stage.append(bar);
    const ring = document.createElement('div'); ring.className = 'rt-brush'; ring.hidden = true; stage.append(ring);
    const pop = document.createElement('div'); pop.className = 'rt-pop'; pop.hidden = true; document.body.append(pop);

    let tool = null, zoom = 1, tx = 0, ty = 0, space = false, drag = null, stroke = null;
    const ex = id => extra.find(x => x.id === id);
    // toArt: content units (what strokes use); toBoard: artboard units, for Mover's drag.
    const board = e => (o.toBoard || o.toArt)(e);
    function view() {
      frame.style.transformOrigin = '0 0';
      frame.style.transform = zoom === 1 && !tx && !ty ? '' : `translate(${tx}px, ${ty}px) scale(${zoom})`;
      bar.querySelector('.rt-zoom').textContent = Math.round(zoom * 100) + '%';
      o.onView?.(zoom);
    }
    // Zoom by f keeping the point under (cx, cy) (client px) still.
    function zoomAt(f, cx, cy) {
      const r = frame.getBoundingClientRect(), L = r.left - tx, T = r.top - ty, ax = (cx - L - tx) / zoom, ay = (cy - T - ty) / zoom;
      zoom = clamp(zoom * f, 1, 64);
      tx = cx - L - ax * zoom; ty = cy - T - ay * zoom;
      if (zoom === 1) tx = ty = 0;
      view();
    }
    const fit = () => { zoom = 1; tx = ty = 0; view(); };
    function setTool(t) {
      tool = t; stage.dataset.rtTool = t; ring.hidden = true; pop.hidden = true;
      if (ex(t)?.brush) stage.dataset.rtBrush = ''; else delete stage.dataset.rtBrush;
      bar.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tool === t));
      o.onTool?.(t);
    }
    // Brush radius on screen: a share of the frame's height (as drawn, zoom included), or the extra tool's own.
    const radiusPx = () => BR[tool] ? BR[tool].size * frame.getBoundingClientRect().height : ex(tool)?.brush?.() ?? 0;
    function showRing(e) {
      const R = space ? 0 : radiusPx();
      if (!R) { ring.hidden = true; return; }
      const r = stage.getBoundingClientRect();
      Object.assign(ring.style, { left: e.clientX - r.left + 'px', top: e.clientY - r.top + 'px', width: 2 * R + 'px', height: 2 * R + 'px' });
      ring.hidden = false;
    }
    const skip = e => e.target.closest('.rt-bar, .rt-pop') || (o.ignore && e.target.closest(o.ignore));
    stage.addEventListener('pointerdown', e => {
      if (skip(e) || (e.button !== 0 && e.button !== 1)) return;
      stage.setPointerCapture(e.pointerId);
      const panView = space || e.button === 1 || tool === 'zoom';
      if (!panView && BR[tool]) {
        const b = BR[tool];
        stroke = { tool, size: b.size, str: b.str, scatter: b.scatter ?? 0, seed: Math.floor(Math.random() * 1e9), pts: [o.toArt(e)] };
        o.onStroke(stroke, 'start'); return;
      }
      if (!panView && ex(tool)) { drag = { extra: ex(tool) }; drag.extra.down?.(e); return; }
      drag = { panView, x: e.clientX, y: e.clientY, moved: false, a: board(e), tx, ty, alt: e.altKey };
      if (!panView) o.onMove?.(0, 0, 'start');
      stage.classList.add(panView ? 'rt-panning' : 'rt-dragging');
    });
    stage.addEventListener('pointermove', e => {
      stage.classList.toggle('rt-alt', e.altKey);
      showRing(e);
      if (stroke) { stroke.pts.push(o.toArt(e)); o.onStroke(stroke, 'move'); return; }
      if (!drag) { ex(tool)?.hover?.(e); return; }
      if (drag.extra) { drag.extra.move?.(e); return; }
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 3) drag.moved = true;
      if (drag.panView) { if (zoom > 1) { tx = drag.tx + dx; ty = drag.ty + dy; view(); } }
      else { const a = board(e); o.onMove?.(a[0] - drag.a[0], a[1] - drag.a[1], 'move'); }
    });
    const end = e => {
      if (stroke) { o.onStroke(stroke, 'end'); stroke = null; return; }
      if (!drag) return;
      if (drag.extra) { drag.extra.up?.(e); drag = null; return; }
      if (tool === 'zoom' && !space && !drag.moved && e.type === 'pointerup') zoomAt(drag.alt || e.altKey ? .5 : 2, e.clientX, e.clientY);
      if (!drag.panView) o.onMove?.(0, 0, 'end');
      drag = null; stage.classList.remove('rt-dragging'); if (!space) stage.classList.remove('rt-panning');
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('pointerleave', () => { ring.hidden = true; ex(tool)?.leave?.(); });
    stage.addEventListener('wheel', e => {
      if (o.wheel?.(e)) return;
      e.preventDefault();
      zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .002)), e.clientX, e.clientY);
    }, { passive: false });
    bar.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.tool) setTool(b.dataset.tool);
      else if (b.dataset.act === 'undo') o.onUndo();
      else if (b.dataset.act === 'clear') o.onClear();
      else if (b.dataset.act === 'fit') fit();
    });

    // Right click: the active brush's settings.
    function field(label, obj, k, min, max, step) {
      const row = document.createElement('div'), f = v => Math.round(v * 100) + '%';
      row.className = 'rt-sl';
      row.innerHTML = `<label>${label}</label><output>${f(obj[k])}</output><input type="range" min="${min}" max="${max}" step="${step}" value="${obj[k]}">`;
      const inp = row.querySelector('input'), out = row.querySelector('output');
      inp.oninput = () => { obj[k] = +inp.value; out.textContent = f(obj[k]); };
      return row;
    }
    stage.addEventListener('contextmenu', e => {
      if (skip(e)) return;
      e.preventDefault();
      pop.innerHTML = '';
      const b = BR[tool];
      if (!b) pop.innerHTML = '<h3>Herramientas</h3><p>Elegí el pincel, la goma, el dedo o la gota en la barra de abajo; con clic derecho ajustás la que esté activa.</p>';
      else {
        const h = document.createElement('h3'); h.textContent = b.name; pop.append(h);
        pop.append(field('Tamaño', b, 'size', .01, .3, .005), field(tool === 'erase' ? 'Cuánto saca' : 'Fuerza', b, 'str', .05, 1, .01));
        if (tool === 'smudge') pop.append(field('Dispersión', b, 'scatter', 0, 1, .01));
      }
      pop.hidden = false;
      pop.style.left = Math.min(innerWidth - pop.offsetWidth - 8, e.clientX + 4) + 'px';
      pop.style.top = Math.min(innerHeight - pop.offsetHeight - 8, e.clientY + 4) + 'px';
    });
    addEventListener('pointerdown', e => { if (!pop.hidden && !pop.contains(e.target)) pop.hidden = true; }, true);

    addEventListener('keydown', e => {
      if (e.target.closest('input, textarea, select')) return;
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); o.onUndo(); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === 'Space') { if (!space) { space = true; stage.classList.add('rt-panning'); ring.hidden = true; } e.preventDefault(); return; }
      const k = e.key.toLowerCase(), t = list.find(t => t && t[2] === k);
      if (t) setTool(t[0]);
      else if (k === '0') fit();
    });
    addEventListener('keyup', e => { if (e.code === 'Space') { space = false; if (!drag?.panView) stage.classList.remove('rt-panning'); } });

    setTool(o.initial || 'move');
    return { get tool() { return tool; }, get zoom() { return zoom; }, setTool, fit, brushes: BR };
  };

  // ---------- Strokes ----------
  // A page keeps its content as a flat list of point positions, v = [x, y, …] (content units, NaN once
  // removed), with src[i] naming the original point each one copies its look from. Strokes are kept and
  // replayed on a fresh list whenever a setting rebuilds the content, as in Gradient Shapes. env: { H: artboard
  // height, dot: point size (for Pincel's density), x0, x1, y0, y1: frame edges in content units (a point
  // pushed past them is gone) }.
  function rng(seed) {
    let a = seed >>> 0 || 1;
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  function apply(st, op, env) {
    if (!op.rng) { op.rng = rng(op.seed); op.hit = new Set(); op.done = 0; }
    const R = op.size * env.H, step = Math.max(1, R * .18);
    for (let i = Math.max(1, op.done); i < op.pts.length; i++) {
      const a = op.pts[i - 1], b = op.pts[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (let k = 1; k <= n; k++) stamp(st, op, env, lerp(a[0], b[0], (k - 1) / n), lerp(a[1], b[1], (k - 1) / n), (b[0] - a[0]) / n, (b[1] - a[1]) / n, R);
    }
    if (op.pts.length === 1 && !op.done) stamp(st, op, env, op.pts[0][0], op.pts[0][1], 0, 0, R);
    op.done = op.pts.length;
  }
  // Pincel adds points under the brush (thinner towards its edge), Goma removes them, Dedo carries them along
  // the stroke (Dispersión jitters each move) and Gota makes those under it wander a little.
  function stamp(st, op, env, px, py, dx, dy, R) {
    const v = st.v, R2 = R * R, rnd = op.rng, t = op.tool;
    if (t === 'paint') {
      // About Fuerza × 15% of the points that would tile the brush at one diameter apart, per stamp.
      const n = op.str * Math.PI * R2 / (env.dot * 2.2) ** 2 * .15;
      for (let q = Math.floor(n + rnd()); q > 0; q--) {
        const a = rnd() * Math.PI * 2, rr = R * Math.sqrt(rnd());
        if (rnd() < (rr / R) ** 2) continue;
        let s = -1;
        for (let k = 0; k < 8 && s < 0; k++) { const i = Math.floor(rnd() * st.src.length); if (v[i * 2] === v[i * 2]) s = st.src[i]; }
        v.push(px + Math.cos(a) * rr, py + Math.sin(a) * rr); st.src.push(s < 0 ? st.src[0] ?? 0 : s);
      }
      return;
    }
    const j = t === 'smudge' ? op.scatter * (Math.hypot(dx, dy) * 1.5 + R * .04) * 2 : R * .12 * op.str;
    for (let i = 0; i < v.length; i += 2) {
      const ex = v[i] - px, ey = v[i + 1] - py, d2 = ex * ex + ey * ey;
      if (!(d2 < R2)) continue;
      const f = 1 - d2 / R2;
      if (t === 'erase') {
        // Each point gets one chance per stroke, once it is well inside the brush.
        if (f < .36 || op.hit.has(i)) continue;
        op.hit.add(i);
        if (rnd() < op.str) v[i] = v[i + 1] = NaN;
        continue;
      }
      let mx, my;
      if (t === 'smudge') { const w = Math.min(1, op.str * 1.5 * f); mx = dx * w + (rnd() - .5) * j * w; my = dy * w + (rnd() - .5) * j * w; }
      else { mx = (rnd() - .5) * j * f; my = (rnd() - .5) * j * f; }
      const nx = v[i] + mx, ny = v[i + 1] + my;
      if (nx < env.x0 || nx > env.x1 || ny < env.y0 || ny > env.y1) v[i] = v[i + 1] = NaN;
      else { v[i] = nx; v[i + 1] = ny; }
    }
  }
  // All strokes on a fresh copy of the points: { v, src }.
  function replay(base, ops, env) {
    const st = { v: Array.from(base), src: Array.from({ length: base.length / 2 }, (_, i) => i) };
    for (const op of ops) { op.rng = null; apply(st, op, env); }
    return st;
  }
  window.RetouchTools.apply = apply;
  window.RetouchTools.replay = replay;
})();
