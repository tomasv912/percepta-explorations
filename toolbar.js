// Shared top bar. Each exploration lives in its own folder with an index.html;
// add it to the list below and it shows up on every page (and on Home, as D1). Retired tools go under
// Descartes (not listed on Home); general tools (GENERAL) are on Home only. The Percepta mark links to Home.
(() => {
  const EXPLORATIONS = [
    { name: 'Pixel Waves', path: '' },
    { name: 'Pixel Model', path: 'pixel-model/' },
    { name: 'Pixel Depth', path: 'pixel-depth/' },
    { name: 'Pixel Trail', path: 'pixel-trail/' },
    { name: 'Pixel Motion', path: 'pixel-motion/' },
    { name: 'Pixel Stipple', path: 'pixel-stipple/' },
    { name: 'Pixel Connect', path: 'pixel-connect/' },
    { name: 'Murmuraciones', path: 'murmuration/' },
    {
      name: 'Descartes', path: 'descartes/', children: [
        { name: 'Pixel Rise', path: 'pixel-rise/' },
        { name: 'Cluster', path: 'cluster/' },
        { name: 'Cube Dispersion', path: 'cube-dispersion/' },
        { name: 'Dispersion v2', path: 'dispersion-v2/' },
        { name: 'Text Dissolve', path: 'text-dissolve/' },
        { name: 'Neural Pixel', path: 'neural-pixel/' },
      ],
    },
  ];
  // Tools that belong to no direction: only on Home, not in the bar.
  const GENERAL = [{ name: 'Photo Preset', path: 'photo-preset/' }];

  const script = document.currentScript;
  const root = new URL('./', script.src);
  const isFile = location.protocol === 'file:';
  const norm = p => p.replace(/index\.html$/, '').replace(/\/?$/, '/');
  const here = norm(location.pathname);

  const style = document.createElement('style');
  style.textContent = `
.toolbar { flex: none; display: flex; align-items: center; gap: 16px; height: 44px; padding: 0 16px; background: var(--surface); border-bottom: 1px solid var(--line); min-width: 0; }
.toolbar .tb-brand { font-weight: 600; font-size: 13px; color: var(--text); white-space: nowrap; text-decoration: none; }
.toolbar .tb-brand:hover { opacity: .7; }
.toolbar a.tb-brand { padding: 0; height: auto; background: none; box-shadow: none; font: 600 13px var(--font); color: var(--text); }
.toolbar .tb-tabs { display: flex; gap: 2px; min-width: 0; overflow-x: auto; scrollbar-width: none; }
.toolbar .tb-tabs::-webkit-scrollbar { display: none; }
.toolbar a { flex: none; display: inline-flex; align-items: center; height: 28px; padding: 0 10px; border-radius: 8px; color: var(--text-2); text-decoration: none; font: 500 12px var(--font); white-space: nowrap; }
.toolbar a:hover { background: var(--fill); color: var(--text); }
.toolbar a[aria-current="page"] { background: var(--fill); color: var(--text); box-shadow: inset 0 0 0 1px var(--line); }
.toolbar a:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.toolbar .tb-crumb { flex: none; display: inline-flex; align-items: center; height: 28px; padding: 0 4px; color: var(--text-3); font: 500 12px var(--font); white-space: nowrap; }
`;
  document.head.appendChild(style);

  const nav = document.createElement('nav');
  nav.className = 'toolbar';
  nav.setAttribute('aria-label', 'Exploraciones');
  const link = path => new URL(path, root).href + (isFile ? 'index.html' : '');
  const isHere = path => norm(new URL(path, root).pathname) === here;
  // A group (Descartes) is the current tab on its own page and on each of its children's pages,
  // where the child's name follows as a breadcrumb.
  let crumb = '';
  const links = EXPLORATIONS.map(e => {
    const child = (e.children || []).find(c => isHere(c.path));
    if (child) crumb = `<span class="tb-crumb">/ ${child.name}</span>`;
    const current = isHere(e.path) || child ? ' aria-current="page"' : '';
    return `<a href="${link(e.path)}"${current}>${e.name}</a>`;
  }).join('');
  nav.innerHTML = `<a class="tb-brand" href="${link('home/')}"${isHere('home/') ? ' aria-current="page"' : ''}>Percepta</a><div class="tb-tabs">${links}${crumb}</div>`;
  script.replaceWith(nav);
  window.PERCEPTA_EXPLORATIONS = EXPLORATIONS; window.PERCEPTA_GENERAL = GENERAL;

  // The palette every tool with colour uses (more can be listed to offer a choice). White and black stay as they are (#F6F6F6, #272727): they are the two
  // backgrounds, and the ink; a palette only swaps the colours. palettePicker(host, get, set) fills host with one
  // button per palette, pressed when get() matches, set(colors) on click; returns a function that re-marks it.
  const PALETTES = [
    { name: 'Percepta', colors: ['#E4DEFC', '#A8A5EC', '#A0C2FF'] },
  ];
  window.PERCEPTA_PALETTES = PALETTES;
  window.PERCEPTA_BACKGROUNDS = [['#F6F6F6', 'Blanco'], ['#272727', 'Negro']];
  style.textContent += `
.pal-sets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.pal-sets button { display: flex; height: 22px; padding: 0; border: 0; border-radius: 5px; overflow: hidden; cursor: pointer; box-shadow: 0 0 0 1px var(--line); background: none; }
.pal-sets button i { flex: 1; }
.pal-sets button[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--surface), 0 0 0 3.5px var(--text); }
.pal-sets button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
`;
  // Backgrounds: white, black or any colour of the palette in use. A colour that is the background's is never used
  // in the picture: on white it turns black, on black white, and on a palette colour whichever of the two stands
  // out more from it (contrast ratio), unless flipped with the button beside the Fondo menu.
  const WHITE = '#F6F6F6', INK = '#272727';
  const lin = c => { const v = c / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
  const lum = h => { const n = parseInt(h.slice(1), 16); return .2126 * lin(n >> 16 & 255) + .7152 * lin(n >> 8 & 255) + .0722 * lin(n & 255); };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const same = (a, b) => a.toLowerCase() === b.toLowerCase();
  // Engrillar: cubes on a grid of their own size (cell), one per cell, side by side and never on top of each other.
  // x(i), y(i) give cube i's place (NaN for one that is not drawn); later cubes are drawn over earlier ones, so a cell
  // keeps the last cube that falls in it. Returns which cubes stay (keep) and their places at their cells' middles.
  // With Engrillar the cell size is what sets the picture: as many cubes as cover, at that size, twice the area the
  // free cubes (count of them, size each) covered, so the cells fill; capped at max.
  window.PerceptaCells = (count, size, cell, max) => Math.max(100, Math.min(max, Math.round(count * (size / cell) ** 2 * 2)));
  window.PerceptaSnap = (n, x, y, cell) => {
    const keep = new Uint8Array(n), sx = new Float32Array(n), sy = new Float32Array(n), taken = new Set();
    for (let i = n - 1; i >= 0; i--) {
      const px = x(i), py = y(i);
      if (px !== px || py !== py) continue;
      const cx = Math.floor(px / cell), cy = Math.floor(py / cell), key = (cx + 32768) * 65536 + (cy + 32768);
      if (taken.has(key)) continue;
      taken.add(key); keep[i] = 1; sx[i] = (cx + .5) * cell; sy[i] = (cy + .5) * cell;
    }
    return { keep, x: sx, y: sy };
  };
  window.PerceptaBg = {
    WHITE, INK,
    pick(bg, flip) { const best = contrast(WHITE, bg) >= contrast(INK, bg) ? WHITE : INK; return flip ? (best === WHITE ? INK : WHITE) : best; },
    swap(c, bg, flip) { return !same(c, bg) ? c : same(bg, WHITE) ? INK : same(bg, INK) ? WHITE : this.pick(bg, flip); },
    // Wires a Fondo menu (select + colour chip) and its flip button; update() redraws the options when the palette
    // changes and shows the flip button only on a palette background, its chip the colour in use.
    control(select, chip, flipBtn, palette, get, set, flip) {
      let keyP = '';
      select.addEventListener('change', e => set(e.target.value));
      flipBtn.addEventListener('click', flip);
      const update = flipped => {
        const pal = palette(), k = pal.join();
        if (k !== keyP) {
          keyP = k;
          select.innerHTML = [[WHITE, 'Blanco · ' + WHITE], [INK, 'Negro · ' + INK], ...pal.map(c => [c, c])].map(([h, n]) => `<option value="${h}">${n}</option>`).join('');
          if (![WHITE, INK, ...pal].some(c => same(c, get()))) { set(WHITE); return; }
        }
        const bg = get(); select.value = [...select.options].find(o => same(o.value, bg))?.value ?? WHITE; chip.style.background = bg;
        const onPal = !same(bg, WHITE) && !same(bg, INK);
        flipBtn.hidden = !onPal;
        if (onPal) { const c = this.pick(bg, flipped); flipBtn.querySelector('i').style.background = c; flipBtn.title = `Los píxeles del color del fondo van en ${same(c, WHITE) ? 'blanco' : 'negro'}: clic para cambiar`; }
      };
      return update;
    },
  };
  style.textContent += `
.bg-flip { gap: 4px; }
.bg-flip i { width: 14px; height: 14px; border-radius: 3px; box-shadow: inset 0 0 0 1px rgb(0 0 0 / .25); display: block; }
`;
  window.palettePicker = (host, get, set) => {
    host.classList.add('pal-sets'); host.setAttribute('aria-label', 'Paletas');
    host.innerHTML = PALETTES.map((p, i) => `<button data-set="${i}" title="${p.name}" aria-label="Paleta ${p.name}">${p.colors.map(c => `<i style="background:${c}"></i>`).join('')}</button>`).join('');
    host.addEventListener('click', e => { const b = e.target.closest('[data-set]'); if (b) set(PALETTES[+b.dataset.set].colors.slice()); });
    const mark = () => { const cur = get().join().toLowerCase(); host.querySelectorAll('[data-set]').forEach(b => b.setAttribute('aria-pressed', PALETTES[+b.dataset.set].colors.join().toLowerCase() === cur)); };
    if (PALETTES.length < 2) host.hidden = true; // one palette: nothing to choose
    mark(); return mark;
  };

  // Every section of a tool's side panel folds: its title opens and closes it, and the page remembers
  // which ones were closed. Closing only hides the section's contents, so the tool's own markup and
  // scripts don't change.
  style.textContent += `
.pc-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: pointer; user-select: none; }
.pc-head::after { content: ""; flex: none; width: 6px; height: 6px; margin-right: 3px; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: translateY(-2px) rotate(45deg); opacity: .55; transition: transform .15s ease-out; }
.pc-head:hover::after { opacity: 1; }
.pc-head:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
.pc-closed > .pc-head::after { transform: translateY(1px) rotate(-45deg); }
.pc-closed > :not(.pc-head) { display: none !important; }
`;
  const fold = () => {
    const key = 'percepta-folds:' + here;
    let closed = [];
    try { closed = JSON.parse(localStorage.getItem(key)) || []; } catch {}
    const save = () => {
      const names = [...document.querySelectorAll('.pc-closed > .pc-head')].map(h => h.textContent.trim());
      try { localStorage.setItem(key, JSON.stringify(names)); } catch {}
    };
    for (const head of document.querySelectorAll('aside section > h2:first-child, aside .group > .lbl:first-child')) {
      const box = head.parentElement, name = head.textContent.trim();
      head.classList.add('pc-head');
      head.tabIndex = 0;
      head.setAttribute('role', 'button');
      const set = shut => { box.classList.toggle('pc-closed', shut); head.setAttribute('aria-expanded', String(!shut)); };
      set(closed.includes(name));
      const toggle = () => { set(!box.classList.contains('pc-closed')); save(); };
      head.addEventListener('click', toggle);
      head.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fold); else fold();

  // One palette for every tool: a colour input in a side panel is replaced by the palette's swatches (its colours,
  // black and white); choosing one sets the input and tells the tool as if picked. A value outside the palette
  // (an old default) moves to the nearest palette colour. Inputs that edited the palette itself are switched off.
  style.textContent += `
.pc-inks { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; min-width: 0; }
.pc-inks button { appearance: none; border: 0; height: 24px; border-radius: 5px; box-shadow: inset 0 0 0 1px rgb(0 0 0 / .14); cursor: pointer; }
.pc-inks button[aria-pressed="true"] { box-shadow: inset 0 0 0 1px rgb(0 0 0 / .14), 0 0 0 2px var(--surface), 0 0 0 3.5px var(--text); }
[data-pal] { pointer-events: none; }
`;
  const lockColors = () => {
    const all = [...PALETTES[0].colors, INK, WHITE], hex = h => parseInt(h.slice(1), 16), rgb = h => [hex(h) >> 16 & 255, hex(h) >> 8 & 255, hex(h) & 255];
    const nearest = v => { const [r, g, b] = rgb(v); return all.reduce((best, c) => { const [r2, g2, b2] = rgb(c), d = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2; return d < best[1] ? [c, d] : best; }, [all[0], Infinity])[0]; };
    for (const inp of document.querySelectorAll('aside input[type=color]')) {
      if (inp.dataset.pal != null) { inp.disabled = true; continue; }
      const row = document.createElement('div'); row.className = 'pc-inks'; row.setAttribute('aria-label', inp.getAttribute('aria-label') || 'Color');
      row.innerHTML = all.map(c => `<button type="button" data-c="${c}" style="background:${c}" title="${c}" aria-label="${c}"></button>`).join('');
      const holder = inp.closest('label.swatch') || inp;
      holder.after(row); holder.hidden = true;
      const mark = () => row.querySelectorAll('[data-c]').forEach(b => b.setAttribute('aria-pressed', b.dataset.c.toLowerCase() === inp.value.toLowerCase()));
      const put = c => { inp.value = c.toLowerCase(); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); mark(); };
      row.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) put(b.dataset.c); });
      // The tool may set the value later (defaults, reset): follow it, and pull anything else onto the palette.
      const check = () => { if (!all.some(c => c.toLowerCase() === inp.value.toLowerCase())) put(nearest(inp.value)); else mark(); };
      setInterval(check, 500); check();
    }
  };
  addEventListener('load', lockColors);

  // Dirección: the two ways a tool can work, as two buttons on the left of the page. 1A: square pixels, all one size,
  // overlapping, gathered by the light. 1B: round pixels that never overlap, laid by depth or form. The tool hands it
  // get() and set(v) ('1a' or '1b'); the choice is remembered per tool in this browser.
  // The bar at the top middle of the picture, for the direction's own modes (1A: Caótico, Engrillado, Pasaje; 1B:
  // Caos). The page fills it and wires it; its clicks stay its own.
  window.PerceptaModeBar = (stage, html) => {
    if (!document.getElementById('pmode-style')) {
      const st = document.createElement('style'); st.id = 'pmode-style';
      st.textContent = `.pmode { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); z-index: 6; display: flex; align-items: center; gap: 10px; padding: 4px; border-radius: 10px; background: var(--surface, #fbfaf8); box-shadow: 0 0 0 1px var(--line, #dcd7cf), 0 4px 14px rgb(0 0 0 / .06); white-space: nowrap; font: 500 12px var(--font, Inter, system-ui, sans-serif); color: var(--text-2, #5e5850); }
.pmode .seg { min-width: 300px; }
.pmode .pm-chaos { display: flex; align-items: center; gap: 10px; padding: 0 8px; }
.pmode .pm-chaos input { width: 180px; }
.pmode .pm-sq { display: flex; align-items: center; gap: 6px; padding: 0 10px 0 4px; cursor: pointer; }
.pmode .pm-sq input { accent-color: var(--text, #1a1714); margin: 0; }
.pmode output { font: 12px var(--mono, ui-monospace, monospace); color: var(--text, #1a1714); min-width: 36px; text-align: right; }`;
      document.head.appendChild(st);
    }
    const el = document.createElement('div'); el.className = 'pmode'; el.innerHTML = html; stage.appendChild(el);
    for (const t of ['pointerdown', 'pointermove', 'pointerup', 'click', 'dblclick', 'wheel', 'mousedown']) el.addEventListener(t, e => e.stopPropagation());
    return el;
  };
  // Pasaje: how ordered a pixel at (u, v) (0–1 across the frame) is, 0 chaotic to 1 on the grid: along the line from
  // A (where the order starts) to B (where it is complete), smoothly; before A all chaos, past B all order.
  window.PerceptaOrder = (u, v, A, B) => {
    const dx = B[0] - A[0], dy = B[1] - A[1], L = dx * dx + dy * dy || 1e-9, t = ((u - A[0]) * dx + (v - A[1]) * dy) / L;
    if (t <= 0) return 0; if (t >= 1) return 1; return t * t * (3 - 2 * t);
  };
  // The Pasaje's handles over the picture: A (Caos, hollow) and B (Orden, filled) joined by a line, each draggable, and
  // the line's middle moves both (Shift: 15° steps). o: { frame, visible(), get() → [A, B], set(A, B), view() → { x, y, w, h } (the part
  // of the artboard the frame shows, in fractions; whole by default) }.
  window.PerceptaBlendHandles = o => {
    if (!document.getElementById('pbh-style')) {
      const st = document.createElement('style'); st.id = 'pbh-style';
      st.textContent = `.pbh { position: absolute; inset: 0; pointer-events: none; z-index: 4; }
.pbh svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.pbh .h { position: absolute; width: 18px; height: 18px; margin: -9px 0 0 -9px; border-radius: 50%; pointer-events: auto; cursor: grab; box-shadow: 0 0 0 1.5px #fff, 0 1px 4px rgb(0 0 0 / .35); touch-action: none; }
.pbh .h:active { cursor: grabbing; }
.pbh .a { background: #fff; border: 2px solid #3d7bff; box-sizing: border-box; }
.pbh .b { background: #3d7bff; }
.pbh .m { width: 12px; height: 12px; margin: -6px 0 0 -6px; background: #fff; border: 1.5px solid #3d7bff; box-sizing: border-box; cursor: move; }
.pbh .lab { position: absolute; transform: translate(-50%, -26px); font: 600 10px var(--font, Inter, system-ui, sans-serif); color: #fff; background: #3d7bff; padding: 2px 5px; border-radius: 4px; white-space: nowrap; pointer-events: none; }`;
      document.head.appendChild(st);
    }
    const el = document.createElement('div'); el.className = 'pbh';
    el.innerHTML = '<svg aria-hidden="true"><line stroke="#3d7bff" stroke-width="1.5" stroke-dasharray="5 4"/></svg><div class="h a" title="Desde acá empieza el orden (antes, todo caos). Shift: ángulos de 15°"></div><div class="h m" title="Mover el pasaje (Shift: en un eje)"></div><div class="h b" title="Desde acá todo ordenado. Shift: ángulos de 15°"></div><span class="lab la">Caos</span><span class="lab lb">Orden</span>';
    o.frame.appendChild(el);
    const [ha, hm, hb] = el.querySelectorAll('.h'), line = el.querySelector('line'), la = el.querySelector('.la'), lb = el.querySelector('.lb');
    const view = () => o.view ? o.view() : { x: 0, y: 0, w: 1, h: 1 };
    const toScr = p => { const v = view(); return [(p[0] - v.x) / v.w * 100, (p[1] - v.y) / v.h * 100]; };
    const fromEv = e => { const r = o.frame.getBoundingClientRect(), v = view(); return [v.x + (e.clientX - r.left) / r.width * v.w, v.y + (e.clientY - r.top) / r.height * v.h]; };
    const drag = (h, which) => {
      h.addEventListener('pointerdown', e => {
        e.stopPropagation(); e.preventDefault(); h.setPointerCapture(e.pointerId);
        const [A0, B0] = o.get(), p0 = fromEv(e);
        const mv = ev => {
          ev.stopPropagation(); let p = fromEv(ev);
          // Shift: the line keeps to steps of 15° (measured on screen), its length as dragged; the middle handle moves
          // along one axis
          if (ev.shiftKey) {
            const r = o.frame.getBoundingClientRect(), v = view(), sx = r.width / v.w, sy = r.height / v.h;
            if (which === 'm') { const dx = (p[0] - p0[0]) * sx, dy = (p[1] - p0[1]) * sy; p = Math.abs(dx) >= Math.abs(dy) ? [p[0], p0[1]] : [p0[0], p[1]]; }
            else {
              const q = which === 'a' ? B0 : A0, dx = (p[0] - q[0]) * sx, dy = (p[1] - q[1]) * sy, len = Math.hypot(dx, dy), st = Math.PI / 12, ang = Math.round(Math.atan2(dy, dx) / st) * st;
              p = [q[0] + Math.cos(ang) * len / sx, q[1] + Math.sin(ang) * len / sy];
            }
          }
          const d = [p[0] - p0[0], p[1] - p0[1]];
          if (which === 'a') o.set(p, B0); else if (which === 'b') o.set(A0, p); else o.set([A0[0] + d[0], A0[1] + d[1]], [B0[0] + d[0], B0[1] + d[1]]); paint(); };
        const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); };
        h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
      });
      for (const t of ['click', 'dblclick', 'mousedown']) h.addEventListener(t, e => e.stopPropagation());
    };
    drag(ha, 'a'); drag(hb, 'b'); drag(hm, 'm');
    function paint() {
      el.hidden = !o.visible(); if (el.hidden) return;
      const [A, B] = o.get(), a = toScr(A), b = toScr(B), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      for (const [h, p] of [[ha, a], [hb, b], [hm, m], [la, a], [lb, b]]) { h.style.left = p[0] + '%'; h.style.top = p[1] + '%'; }
      line.setAttribute('x1', a[0] + '%'); line.setAttribute('y1', a[1] + '%'); line.setAttribute('x2', b[0] + '%'); line.setAttribute('y2', b[1] + '%');
    }
    (function tick() { paint(); requestAnimationFrame(tick); })();
    return { paint };
  };
  window.PerceptaChance = i => { let h = Math.imul(i ^ 0x5bd1e995, 0x9e3779b1); h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
  // Handing something from one tool to another: put() stores it in this browser (IndexedDB, so images and meshes of
  // any size fit) and opens the other tool with ?from=…; there, take() reads it once and clears it.
  window.PerceptaHandoff = (() => {
    const db = () => new Promise((res, rej) => { const q = indexedDB.open('percepta-handoff', 1); q.onupgradeneeded = () => q.result.createObjectStore('h'); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
    const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('h', mode), r = fn(t.objectStore('h')); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); };
    return {
      async send(path, key, value) { await tx('readwrite', s => s.put(value, key)); location.href = new URL(path + '?from=' + encodeURIComponent(key), root).href; },
      async take(key) { const v = await tx('readonly', s => s.get(key)); await tx('readwrite', s => s.delete(key)); return v; },
      pending: () => new URLSearchParams(location.search).get('from'),
    };
  })();
  window.PerceptaDirection = o => {
    if (!document.getElementById('pdir-style')) {
      const st = document.createElement('style'); st.id = 'pdir-style';
      st.textContent = `.pdir { position: fixed; left: 14px; top: 50%; transform: translateY(-50%); z-index: 30; display: flex; flex-direction: column; gap: 4px; padding: 4px; border-radius: 12px; background: var(--surface, #fbfaf8); box-shadow: 0 0 0 1px var(--line, #dcd7cf), 0 4px 16px rgb(0 0 0 / .06); font: 500 12px var(--font, Inter, system-ui, sans-serif); }
.pdir button { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 64px; padding: 8px 4px 7px; border: 0; border-radius: 9px; background: transparent; color: var(--text-2, #5e5850); cursor: pointer; font: inherit; }
.pdir button:hover { background: var(--fill, #efece7); }
.pdir button[aria-pressed="true"] { background: var(--accent, #1a1714); color: var(--accent-text, #fbfaf8); }
.pdir button:focus-visible { outline: 2px solid var(--accent, #1a1714); outline-offset: 1px; }
.pdir b { font-size: 13px; font-weight: 600; }
.pdir small { font-size: 10px; line-height: 1.15; opacity: .8; text-align: center; }
.pdir i { display: block; width: 14px; height: 14px; background: currentColor; }
.pdir [data-dir="1b"] i { border-radius: 50%; }
@media (max-width: 767px) { .pdir { top: auto; bottom: 14px; transform: none; flex-direction: row; } }`;
      document.head.appendChild(st);
    }
    const el = document.createElement('div'); el.className = 'pdir'; el.setAttribute('role', 'group'); el.setAttribute('aria-label', 'Dirección');
    el.innerHTML = `<button type="button" data-dir="1a" title="Dirección 1A: píxeles cuadrados del mismo tamaño, que se superponen y se juntan según la luz"><i></i><b>1A</b><small>${o.labelA || 'Cuadrados'}</small></button>` +
      `<button type="button" data-dir="1b" title="Dirección 1B: píxeles redondos que nunca se superponen, ubicados según la profundidad o la forma"><i></i><b>1B</b><small>${o.labelB || 'Círculos'}</small></button>`;
    document.body.appendChild(el);
    const key = 'percepta-dir:' + location.pathname, mark = () => el.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.dir === o.get()));
    el.addEventListener('click', e => { const b = e.target.closest('[data-dir]'); if (!b) return; o.set(b.dataset.dir); try { localStorage.setItem(key, b.dataset.dir); } catch {} mark(); });
    let saved = null; try { saved = localStorage.getItem(key); } catch {}
    if (saved === '1a' || saved === '1b') o.set(saved);
    mark();
    return { mark };
  };

  // Timeline: a bar along the top of the picture (inside #frame, clear of the tools' own bottom bars) for every tool with an animation: play / pause,
  // a scrubber over the loop and the time. A tool hands it how to read and drive its own clock:
  // { frame, active(), duration(), time(), playing(), toggle(), seek(t) } (seek optional: without it, no scrubbing).
  window.PerceptaTimeline = o => {
    if (!document.getElementById('ptl-style')) {
      const st = document.createElement('style'); st.id = 'ptl-style';
      st.textContent = `.ptl { position: absolute; left: 10px; right: 10px; top: 10px; z-index: 3; display: flex; align-items: center; gap: 10px; padding: 6px 10px 6px 6px; border-radius: 10px; background: color-mix(in srgb, var(--surface, #fbfaf8) 92%, transparent); box-shadow: 0 0 0 1px var(--line, #dcd7cf), 0 4px 14px rgb(0 0 0 / .06); font: 500 12px/1 var(--font, Inter, system-ui, sans-serif); color: var(--text-2, #5e5850); opacity: .55; transition: opacity .15s; cursor: default; touch-action: none; }
.frame:hover .ptl, .ptl:focus-within, .ptl.drag { opacity: 1; }
.ptl[hidden] { display: none; }
.ptl button { flex: none; width: 28px; height: 28px; display: grid; place-items: center; border: 0; border-radius: 7px; background: var(--fill, #efece7); color: var(--text, #1a1714); cursor: pointer; padding: 0; }
.ptl button:hover { background: var(--line, #dcd7cf); }
.ptl button:focus-visible { outline: 2px solid var(--accent, #1a1714); outline-offset: 1px; }
.ptl .trk { position: relative; flex: 1; height: 22px; cursor: pointer; }
.ptl .trk::before { content: ''; position: absolute; left: 0; right: 0; top: 9px; height: 4px; border-radius: 2px; background: var(--line, #dcd7cf); }
.ptl .trk.ro { cursor: default; }
.ptl .fill { position: absolute; left: 0; top: 9px; height: 4px; border-radius: 2px; background: var(--text, #1a1714); }
.ptl .knob { position: absolute; top: 4px; width: 14px; height: 14px; margin-left: -7px; border-radius: 50%; background: var(--surface, #fbfaf8); border: 1.5px solid var(--text, #1a1714); box-sizing: border-box; }
.ptl .tm { flex: none; min-width: 84px; text-align: right; font: 12px var(--mono, ui-monospace, monospace); font-variant-numeric: tabular-nums; color: var(--text, #1a1714); }`;
      document.head.appendChild(st);
    }
    const bar = document.createElement('div'); bar.className = 'ptl'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Línea de tiempo');
    bar.innerHTML = '<button type="button" class="pp" aria-label="Reproducir"></button><div class="trk" role="slider" tabindex="0" aria-label="Tiempo"><div class="fill"></div><div class="knob"></div></div><span class="tm"></span>';
    o.frame.appendChild(bar);
    const pp = bar.querySelector('.pp'), trk = bar.querySelector('.trk'), fill = bar.querySelector('.fill'), knob = bar.querySelector('.knob'), tm = bar.querySelector('.tm');
    const PLAY = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" fill="currentColor"/></svg>';
    const PAUSE = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="2.5" y="1.5" width="2.6" height="9" rx=".6" fill="currentColor"/><rect x="6.9" y="1.5" width="2.6" height="9" rx=".6" fill="currentColor"/></svg>';
    // the bar's own pointer events stay its own (the frames below turn models, draw trails, scatter cubes…)
    for (const t of ['pointerdown', 'pointermove', 'pointerup', 'click', 'dblclick', 'wheel', 'mousedown']) bar.addEventListener(t, e => e.stopPropagation());
    pp.addEventListener('click', () => { o.toggle(); paint(); });
    let drag = false;
    const at = e => { const r = trk.getBoundingClientRect(); return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * o.duration(); };
    trk.addEventListener('pointerdown', e => { if (!o.seek) return; drag = true; bar.classList.add('drag'); trk.setPointerCapture(e.pointerId); o.seek(at(e)); paint(); });
    trk.addEventListener('pointermove', e => { if (drag) { o.seek(at(e)); paint(); } });
    const end = () => { drag = false; bar.classList.remove('drag'); };
    trk.addEventListener('pointerup', end); trk.addEventListener('pointercancel', end);
    trk.addEventListener('keydown', e => {
      if (!o.seek) return; const d = o.duration(), stepT = e.shiftKey ? d / 10 : d / 100;
      if (e.key === 'ArrowRight') o.seek(Math.min(d, o.time() + stepT)); else if (e.key === 'ArrowLeft') o.seek(Math.max(0, o.time() - stepT)); else if (e.key === ' ') o.toggle(); else return;
      e.preventDefault(); e.stopPropagation(); paint();
    });
    let shownPlay = null;
    function paint() {
      const on = !!o.active(); bar.hidden = !on; if (!on) return;
      const d = Math.max(1e-6, o.duration()), t = Math.min(d, Math.max(0, o.time())), f = t / d * 100, playing = !!o.playing();
      fill.style.width = f + '%'; knob.style.left = f + '%';
      tm.textContent = `${t.toFixed(1)} / ${d.toFixed(1)} s`;
      trk.classList.toggle('ro', !o.seek); trk.setAttribute('aria-valuenow', t.toFixed(2)); trk.setAttribute('aria-valuemax', d.toFixed(2));
      if (shownPlay !== playing) { shownPlay = playing; pp.innerHTML = playing ? PAUSE : PLAY; pp.setAttribute('aria-label', playing ? 'Pausa' : 'Reproducir'); pp.title = playing ? 'Pausa' : 'Reproducir'; }
    }
    (function tick() { paint(); requestAnimationFrame(tick); })();
    return { paint };
  };

  // DialKit (vendor/dialkit, dialkit.dev): a floating panel, bottom left, with every control of the page as a dial,
  // grouped as the page groups them. Both sides stay in step: a dial sets the page's control (as if it were moved by
  // hand) and moving the page's control moves the dial. Loaded after the page, so the tools' own controls exist.
  function dialkit() {
    if (document.querySelector('script[data-dialkit]')) return;
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('vendor/dialkit/styles.css', root).href; document.head.appendChild(css);
    const js = document.createElement('script'); js.src = new URL('vendor/dialkit/browser.global.js', root).href; js.dataset.dialkit = '';
    js.onload = () => { try { mirror(); } catch (e) { console.warn('DialKit:', e); } };
    document.head.appendChild(js);
  }
  function mirror() {
    const DK = window.DialKit; if (!DK) return;
    const config = {}, links = [], used = new Map();
    const group = el => {
      const sec = el.closest('section'), h = sec && sec.querySelector('h2');
      if (h) return h.textContent.trim();
      if (el.closest('.tt, .anim, [role=toolbar]')) return 'Animación';
      if (el.closest('footer')) return 'Exportar';
      return 'General';
    };
    const add = (el, label, def, link) => {
      const g = group(el); config[g] = config[g] || { _collapsed: true };
      let k = (label || '').replace(/\s+/g, ' ').trim() || 'Control', n = 2;
      while (k in config[g]) k = `${label} ${n++}`;
      config[g][k] = def; links.push({ g, k, ...link });
    };
    // sliders: a range input with its label
    for (const inp of document.querySelectorAll('input[type=range]')) {
      if (inp.closest('.dialkit-root, [data-dialkit-root]')) continue;
      const lab = inp.labels?.[0]?.textContent || inp.getAttribute('aria-label') || inp.id;
      const min = +inp.min || 0, max = inp.max === '' ? 100 : +inp.max, step = inp.step === 'any' || !inp.step ? (max - min) / 100 : +inp.step;
      add(inp, lab, [+inp.value, min, max, step], { kind: 'range', el: inp, get: () => +inp.value, set: v => { inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); } });
    }
    // toggles
    for (const inp of document.querySelectorAll('input[type=checkbox]')) {
      if (inp.disabled) continue;
      const lab = (inp.closest('label')?.textContent || inp.getAttribute('aria-label') || inp.dataset.check || '').trim();
      if (!lab) continue;
      add(inp, lab, inp.checked, { kind: 'check', el: inp, get: () => inp.checked, set: v => { inp.checked = v; inp.dispatchEvent(new Event('change', { bubbles: true })); } });
    }
    // segmented choices: one select per group of buttons
    for (const seg of document.querySelectorAll('.seg')) {
      const btns = [...seg.querySelectorAll(':scope > button')].filter(b => b.dataset.v !== undefined || b.dataset.preset !== undefined);
      if (btns.length < 2) continue;
      const opts = btns.map(b => ({ value: b.dataset.v ?? b.dataset.preset, label: (b.textContent.trim() || b.title || b.dataset.v) + (b.title && b.textContent.trim().length <= 2 ? ` (${b.title})` : '') }));
      const cur = () => (btns.find(b => b.getAttribute('aria-pressed') === 'true') || btns[0]);
      add(seg, seg.getAttribute('aria-label') || seg.dataset.key || 'Opción', { type: 'select', options: opts, default: cur().dataset.v ?? cur().dataset.preset },
        { kind: 'seg', el: seg, get: () => cur().dataset.v ?? cur().dataset.preset, set: v => btns.find(b => (b.dataset.v ?? b.dataset.preset) === v)?.click() });
    }
    if (!links.length) return;
    DK.createDialRoot({ position: 'bottom-left', theme: 'system', defaultOpen: false, versions: 'menu' });
    const kit = window.PerceptaDial = DK.createDialKit(document.title || 'Percepta', config);
    const last = new Map(links.map(l => [l, l.get()]));
    let quiet = false;
    kit.subscribe(values => {
      if (quiet) return;
      for (const l of links) {
        const v = values[l.g]?.[l.k];
        if (v === undefined || v === last.get(l)) continue;
        last.set(l, v);
        if (v !== l.get()) l.set(v);
      }
    });
    // the page's controls moved (by hand, a preset, a new seed…): the dials follow
    let pending = 0;
    const pull = () => {
      pending = 0; const upd = {};
      for (const l of links) { const v = l.get(); if (v !== last.get(l)) { last.set(l, v); (upd[l.g] = upd[l.g] || {})[l.k] = v; } }
      if (Object.keys(upd).length) { quiet = true; try { kit.setValues(upd); } finally { quiet = false; } }
    };
    const soon = e => { if (e.target.closest?.('[class*="dialkit"], [class*="DialKit"]')) return; if (!pending) pending = requestAnimationFrame(pull); };
    for (const t of ['input', 'change', 'click', 'keyup', 'pointerup']) addEventListener(t, soon, true);
  }
  addEventListener('load', dialkit);

  // Every image a tool downloads (PNG, JPG, SVG) is cropped to its pixels: whatever around them holds nothing is
  // cut away. Without a background that is what is transparent; with one, what is the background's colour (the
  // colour of all four corners). Tools hand their file to a link and click it; the click is caught here, the file
  // cropped and handed on. MP4s are cropped where they are made (Pixel Model).
  const clickLink = HTMLAnchorElement.prototype.click;
  // The box of what differs from the background, or null when there is nothing to cut.
  function pixelBox(d, W, H, tol) {
    const at = (x, y) => (y * W + x) * 4, cs = [at(0, 0), at(W - 1, 0), at(0, H - 1), at(W - 1, H - 1)];
    const clear = cs.some(i => d[i + 3] < 255), ref = cs[0];
    if (!clear && cs.some(i => Math.abs(d[i] - d[ref]) > tol || Math.abs(d[i + 1] - d[ref + 1]) > tol || Math.abs(d[i + 2] - d[ref + 2]) > tol)) return null;
    const r = d[ref], g = d[ref + 1], b = d[ref + 2];
    const ink = clear ? i => d[i + 3] > 0 : i => Math.abs(d[i] - r) > tol || Math.abs(d[i + 1] - g) > tol || Math.abs(d[i + 2] - b) > tol;
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0, i = y * W * 4; x < W; x++, i += 4) if (ink(i)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; }
    if (x1 < 0 || (x0 === 0 && y0 === 0 && x1 === W - 1 && y1 === H - 1)) return null;
    return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  async function cropped(blob, name) {
    const svg = /\.svg$/i.test(name), jpg = /\.jpe?g$/i.test(name), text = svg ? await blob.text() : '';
    const url = URL.createObjectURL(svg ? new Blob([text], { type: 'image/svg+xml' }) : blob), img = new Image();
    img.src = url;
    try { await img.decode(); } finally { URL.revokeObjectURL(url); }
    const W = img.naturalWidth, H = img.naturalHeight;
    if (!W || !H) return null;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
    const b = pixelBox(ctx.getImageData(0, 0, W, H).data, W, H, jpg ? 10 : 0);
    if (!b) return null;
    if (svg) {
      // Same drawing, a smaller window on it: width, height and viewBox cut to the box.
      const tag = text.match(/<svg\b[^>]*>/)[0], num = k => parseFloat((tag.match(new RegExp(`\\s${k}="([^"]*)"`)) || [])[1]);
      const vb = ((tag.match(/\sviewBox="([^"]*)"/) || [])[1] || `0 0 ${W} ${H}`).trim().split(/[\s,]+/).map(Number);
      const sx = vb[2] / (num('width') || W), sy = vb[3] / (num('height') || H), r = v => Math.round(v * 100) / 100;
      let t = tag.replace(/\s(width|height|viewBox)="[^"]*"/g, '');
      t = t.replace(/^<svg/, `<svg width="${b.w}" height="${b.h}" viewBox="${r(vb[0] + b.x * sx)} ${r(vb[1] + b.y * sy)} ${r(b.w * sx)} ${r(b.h * sy)}"`);
      return new Blob([text.replace(tag, t)], { type: 'image/svg+xml' });
    }
    const o = document.createElement('canvas'); o.width = b.w; o.height = b.h;
    o.getContext('2d').drawImage(c, -b.x, -b.y);
    return new Promise(res => o.toBlob(res, jpg ? 'image/jpeg' : 'image/png', .92));
  }
  HTMLAnchorElement.prototype.click = function () {
    const name = this.download;
    if (!name || this.dataset.cropped || !/^blob:/.test(this.href) || !/\.(png|jpe?g|svg)$/i.test(name)) return clickLink.call(this);
    const file = fetch(this.href).then(r => r.blob());
    file.then(b => cropped(b, name).catch(() => null).then(c => c || b)).then(out => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(out); a.download = name; a.dataset.cropped = '1';
      document.body.append(a); clickLink.call(a); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, () => clickLink.call(this));
  };
})();
