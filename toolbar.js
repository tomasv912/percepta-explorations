// Shared top bar. Each exploration lives in its own folder with an index.html;
// add it to the list below and it shows up on every page (and on Home, as D1); general tools (GENERAL) are on
// Home only. The Percepta mark links to Home.
(() => {
  // Pixel is one tool with two ways of working, chosen by what goes in: an image (or Olas, Refracción, Flor) at the
  // pixel-image/, a 3D model at pixel-model/, both held by the page at the root. All the same tab.
  const EXPLORATIONS = [
    { name: 'Pixel', path: '', also: ['pixel-model/', 'pixel-image/'] },
    { name: 'Prism', path: 'prism/' },
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
  // A group (an entry with children) is the current tab on its own page and on each of its children's pages,
  // where the child's name follows as a breadcrumb.
  let crumb = '';
  const links = EXPLORATIONS.map(e => {
    const child = (e.children || []).find(c => isHere(c.path));
    if (child) crumb = `<span class="tb-crumb">/ ${child.name}</span>`;
    const current = isHere(e.path) || child || (e.also || []).some(isHere) ? ' aria-current="page"' : '';
    return `<a href="${link(e.path)}"${current}>${e.name}</a>`;
  }).join('');
  nav.innerHTML = `<a class="tb-brand" href="${link('home/')}"${isHere('home/') ? ' aria-current="page"' : ''}>Percepta</a><div class="tb-tabs">${links}${crumb}</div>`;
  // Inside Pixel (one half of it, in its frame) the page holding both has the bar
  window.PERCEPTA_EMBED = window !== window.top && !!window.parent.PixelShell;
  // the bar on top of a page of its own (not inside Pixel or Prism's frames, nor a hidden helper frame)
  if (window === window.top) script.replaceWith(nav); else script.remove();
  window.PERCEPTA_EXPLORATIONS = EXPLORATIONS; window.PERCEPTA_GENERAL = GENERAL;

  // The palette every tool with colour uses (more can be listed to offer a choice). White and black stay as they are (#FAFAFA, #111111): they are the two
  // backgrounds, and the ink; a palette only swaps the colours. palettePicker(host, get, set) fills host with one
  // button per palette, pressed when get() matches, set(colors) on click; returns a function that re-marks it.
  const PALETTES = [
    // violeta, lila, celeste, amarillo (only on the dark background: the tools leave it out on a light one), verde, lavanda
    { name: 'Percepta', colors: ['#7B52D4', '#B386FF', '#84BFFF', '#F5B921', '#6BCDAE', '#E3DCFD'] },
  ];
  // Figma brand palettes, dark → light (Section 3, 5869:1289).
  window.PERCEPTA_MONO_PALETTES = [
    { name: 'Violeta', colors: ['#3C1E7B', '#6333CC', '#7B52D4'] },
    { name: 'Azul', colors: ['#0075F5', '#4CA2FF', '#84BFFF'] },
    { name: 'Amarillo', colors: ['#976E07', '#E0A40A', '#F5B921'] },
    { name: 'Verde', colors: ['#26735B', '#40BF97', '#6BCDAE'] },
  ];
  window.PerceptaMono = {
    // Palettes are ordered shadow → midtone → highlight. Keep the exact brand shades.
    shade(palette, lightness) {
      const light = Number.isFinite(lightness) ? Math.max(0, Math.min(1, lightness)) : .5;
      return palette[Math.min(palette.length - 1, Math.floor(light * palette.length))];
    },
    sync(st) {
      const before = st.palette.join(), palettes = window.PERCEPTA_MONO_PALETTES;
      if (st.colorSrc === 'mono') st.palette = (palettes[st.monoPalette] || palettes[0]).colors.slice();
      else if (palettes.some(p => p.colors.join() === st.palette.join())) st.palette = PALETTES[0].colors.slice();
      return before !== st.palette.join();
    },
  };
  window.PERCEPTA_PALETTES = PALETTES;
  window.PERCEPTA_BACKGROUNDS = [['#FAFAFA', 'Blanco'], ['#111111', 'Negro']];
  style.textContent += `
.pal-sets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.pal-sets button { display: flex; height: 22px; padding: 0; border: 0; border-radius: 5px; overflow: hidden; cursor: pointer; box-shadow: 0 0 0 1px var(--line); background: none; }
.pal-sets button i { flex: 1; }
.pal-sets button[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--surface), 0 0 0 3.5px var(--text); }
.pal-sets[hidden] { display: none; }
.pal-sets button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
`;
  // Backgrounds: white, black or any colour of the palette in use. A colour that is the background's is never used
  // in the picture: on white it turns black, on black white, and on a palette colour whichever of the two stands
  // out more from it (contrast ratio), unless flipped with the button beside the Fondo menu.
  const WHITE = '#FAFAFA', INK = '#111111';
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
  // Claro / Oscuro: a toggle at the bottom right of the picture. Oscuro puts the picture on the black, and what was
  // black turns white (the pixels of the background's colour take its opposite); Claro back on the white.
  window.PerceptaTheme = (stage, isDark, setDark) => {
    const sun = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/></svg>';
    const moon = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="M13.2 10.1A5.6 5.6 0 0 1 5.9 2.8a5.6 5.6 0 1 0 7.3 7.3z"/></svg>';
    const box = document.createElement('div'); box.className = 'pth';
    box.innerHTML = `<div class="pth-tg" role="group" aria-label="Modo"><button data-dark="0" title="Modo claro: píxeles oscuros sobre blanco" aria-label="Modo claro">${sun}</button><button data-dark="1" title="Modo oscuro: píxeles claros sobre negro" aria-label="Modo oscuro">${moon}</button></div>`;
    stage.appendChild(box);
    const tab = stage.querySelector('.kf-tab'); if (tab) box.appendChild(tab); // the timeline's tab beside it
    box.querySelector('.pth-tg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setDark(b.dataset.dark === '1'); });
    for (const t of ['pointerdown', 'pointerup', 'click', 'dblclick', 'wheel']) box.addEventListener(t, e => e.stopPropagation());
    return () => { const d = isDark(); box.querySelectorAll('.pth-tg button').forEach(b => b.setAttribute('aria-pressed', (b.dataset.dark === '1') === d)); };
  };
  style.textContent += `
.pth { position: absolute; right: 14px; bottom: 14px; z-index: 4; display: flex; align-items: center; gap: 8px; }
.pth .kf-tab { position: static; }
.pth-tg { display: flex; padding: 3px; gap: 2px; border-radius: 10px; background: var(--surface); box-shadow: 0 0 0 1px var(--line), 0 4px 14px rgb(0 0 0 / .06); }
.pth-tg button { width: 30px; height: 26px; display: grid; place-items: center; border: 0; border-radius: 7px; background: none; color: var(--text-2); cursor: pointer; padding: 0; }
.pth-tg button:hover { color: var(--text); }
.pth-tg button[aria-pressed="true"] { background: #111111; color: #FAFAFA; }
.pth-tg button[data-dark="0"][aria-pressed="true"] { background: var(--fill); color: var(--text); box-shadow: 0 0 0 1px var(--line); }
`;
  style.textContent += `
.bg-flip { gap: 4px; }
.bg-flip i { width: 14px; height: 14px; border-radius: 3px; box-shadow: inset 0 0 0 1px rgb(0 0 0 / .25); display: block; }
`;
  window.palettePicker = (host, get, set, palettes = PALETTES) => {
    host.classList.add('pal-sets'); host.setAttribute('aria-label', host.getAttribute('aria-label') || 'Paletas');
    host.innerHTML = palettes.map((p, i) => `<button data-set="${i}" title="${p.name}" aria-label="Paleta ${p.name}">${p.colors.map(c => `<i style="background:${c}"></i>`).join('')}</button>`).join('');
    host.addEventListener('click', e => { const b = e.target.closest('[data-set]'); if (b) set(palettes[+b.dataset.set].colors.slice()); });
    const mark = () => { const cur = get().join().toLowerCase(); host.querySelectorAll('[data-set]').forEach(b => b.setAttribute('aria-pressed', palettes[+b.dataset.set].colors.join().toLowerCase() === cur)); };
    if (palettes.length < 2) host.hidden = true; // one palette: nothing to choose
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
    const el = document.createElement('div'); el.innerHTML = html;
    // in the right panel, at the top of Píxeles (the panel's dials show them); floating over the picture only without it
    const sec = [...document.querySelectorAll('aside section')].find(x => x.querySelector('h2')?.textContent.trim() === 'Píxeles');
    if (sec) { el.className = 'pmode-in'; sec.querySelector('h2').after(el); } else { el.className = 'pmode'; stage.appendChild(el); }
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
    // other uses name their ends (and say what they do)
    if (o.labels) { el.querySelector('.la').textContent = o.labels[0]; el.querySelector('.lb').textContent = o.labels[1]; }
    if (o.titles) { const hs = el.querySelectorAll('.h'); hs[0].title = o.titles[0]; hs[1].title = o.titles[1]; hs[2].title = o.titles[2]; }
    if (o.cls) el.classList.add(o.cls);
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
    const handlers = {};
    const H = {
      // send: keep the value and go to path (inside Pixel: the other half, shown at once, no page load)
      async send(path, key, value) {
        await tx('readwrite', s => s.put(value, key));
        if (window.PERCEPTA_EMBED) return window.parent.PixelShell.deliver(path, key, window.PerceptaShared?.mine());
        location.href = new URL(path + '?from=' + encodeURIComponent(key), root).href;
      },
      async take(key) { const v = await tx('readonly', s => s.get(key)); await tx('readwrite', s => s.delete(key)); return v; },
      pending: () => new URLSearchParams(location.search).get('from'),
      // on: what a page does with a value sent to it, now (if it came with the page) or whenever one arrives
      on(key, fn) { handlers[key] = fn; if (H.pending() === key) H.take(key).then(v => { if (v) fn(v); history.replaceState(null, '', location.pathname); }); },
      deliver(key) { return H.take(key).then(v => { if (v && handlers[key]) handlers[key](v); }); },
    };
    return H;
  })();
  // Pixel's two halves (image, model) share what they have in common when you go from one to the other: the colour
  // (palette, source, behaviour, only the palette), the background, Caos and Pasaje, the outline. go(path, query)
  // keeps them and goes; take(S) puts them back (called before the first draw).
  window.PerceptaShared = (() => {
    const KEY = 'percepta-shared', keys = ['palette', 'monoPalette', 'onlyPal', 'bg', 'bgFlip', 'colorHow', 'chaos', 'blend', 'blendA', 'blendB', 'stroke', 'strokeW', 'aspect', 'orient'];
    // the two halves name the colour sources differently
    const toCommon = { single: 'one', ink: 'one', pal: 'pal', mono: 'mono', image: 'orig', orig: 'orig' };
    let page = null; // { S, names, apply(query), after() }: this half
    const pack = S => { const o = {}; for (const k of keys) if (k in S) o[k] = structuredClone(S[k]); if (S.colorSrc) o.colorSrc = toCommon[S.colorSrc] || 'one'; if (S.ink) o.ink = S.ink; return o; };
    const put = (o, q) => {
      if (!page) return; const { S, names } = page;
      if (o) { for (const k of keys) if (k in o && k in S) S[k] = structuredClone(o[k]); if (o.colorSrc && names[o.colorSrc]) S.colorSrc = names[o.colorSrc]; if (o.ink && 'ink' in S) S.ink = o.ink; }
      page.apply?.(new URLSearchParams(q || ''));
    };
    return {
      // a half says what it is; anything carried over to it (a page load from the other half) is put in
      init(p) {
        page = p; let o = null; try { o = JSON.parse(sessionStorage.getItem(KEY)); sessionStorage.removeItem(KEY); } catch {}
        put(o, location.search.slice(1));
      },
      // go to the other half (path), with this one's shared settings and a query (the source, the preset)
      go(S, path, query = '') {
        if (window.PERCEPTA_EMBED) return window.parent.PixelShell.go(pack(S), path, query);
        try { sessionStorage.setItem(KEY, JSON.stringify(pack(S))); } catch {}
        location.href = new URL(path + (query ? '?' + query : ''), root).href;
      },
      // inside Pixel: the other half hands its settings and query over, this one takes them and redraws
      receive(o, q) { put(o, q); page?.after?.(); },
      mine: () => page ? pack(page.S) : null,
    };
  })();

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


  // DialKit (vendor/dialkit, dialkit.dev) is the right panel: inline at the top of the sidebar, a folder per section,
  // every control of the sidebar as a dial (sliders, toggles, choices, lists, colours, the buttons as actions). The
  // sidebar's own controls it mirrors are hidden (they still work underneath: a dial moves them, as a hand would);
  // what it can't show (the palette's swatches) stays below. When the tool shows or hides controls (another source,
  // another preset) the panel is rebuilt to match, and moving a control elsewhere (a key, a preset) moves its dial.
  function dialkit() {
    if (!document.querySelector('aside') || document.querySelector('script[data-dialkit]')) return;
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('vendor/dialkit/styles.css', root).href; document.head.appendChild(css);
    const st = document.createElement('style');
    st.textContent = `.pdk-m { display: none !important; } .pdk { margin: -4px -6px 0; } .pdk .dialkit-root, .pdk .dialkit-panel { width: 100% !important; max-width: none !important; box-shadow: none !important; } .pdk .dialkit-panel-toolbar, .pdk .dialkit-panel-section-toolbar, .pdk .dialkit-panel-section-toolbar-clip, .pdk .dialkit-folder-copy, .pdk [class*=dialkit-version] { display: none !important; }`;
    document.head.appendChild(st);
    const js = document.createElement('script'); js.src = new URL('vendor/dialkit/browser.global.js', root).href; js.dataset.dialkit = '';
    js.onload = () => { try { dialPanel(); } catch (e) { console.warn('DialKit:', e); } };
    document.head.appendChild(js);
  }
  function dialPanel() {
    const DK = window.DialKit, aside = document.querySelector('aside'); if (!DK || !aside) return;
    const host = aside.querySelector('.controls') || aside, mount = document.createElement('div'); mount.className = 'pdk'; host.prepend(mount);
    DK.createDialRoot({ mode: 'inline', target: mount, theme: 'system' });
    const shown = el => !el.closest('[hidden], .gone');
    const clean = t => (t || '').replace(/\s+/g, ' ').replace(/[.]/g, '\u2024').trim(); // a dot would split the dial's path: a look-alike
    // short names, so name and value fit in a dial's pill; anything else loses a trailing (…)
    const SHORT = { 'Invertir luces y sombras': 'Invertir', 'Espacio entre líneas': 'Entre líneas', 'Espacio entre píxeles': 'Entre píxeles',
      'Separación de las líneas': 'Entre líneas', 'Tamaño mínimo': 'Tamaño mín', 'Tamaño máximo': 'Tamaño máx', 'Subir imagen o modelo 3D': 'Subir',
      'Subir modelo 3D o imagen': 'Subir', 'Color de los cubos': 'Color', 'Sombras proyectadas': 'Sombras', 'Luz ambiente': 'Ambiente',
      'Orden de los píxeles': 'Orden', 'Seguir la forma': 'Seguir forma', 'Resolución al exportar': 'Resolución', 'Comportamiento': 'Modo',
      'Comportamiento del color': 'Modo', 'Llevar a la paleta (luz y saturación)': 'A la paleta', 'Solo la paleta (sin blanco ni negro)': 'Solo paleta', 'Bloom solo en amarillo, blanco y lavanda': 'Bloom selectivo', 'Solo los 3 colores (sin blanco ni negro)': 'Solo 3 colores',
      'Cantidad de manzanas': 'Manzanas', 'Tipo de edificio': 'Tipo', 'Retiros (escalonado)': 'Retiros', 'Torsión (torcido)': 'Torsión',
      'Coronamiento y aguja': 'Aguja', 'Afinado arriba': 'Afinado', 'Losas salientes': 'Losas', 'Altura de las manzanas': 'Altura' };
    const short = t => { t = (t || '').replace(/\s+/g, ' ').trim(); return SHORT[t] || t.replace(/\s*\([^)]*\)$/, ''); };
    const labelOf = el => clean(el.closest('.slider, label, .row')?.querySelector('label, span')?.textContent || el.getAttribute('aria-label') || el.title || el.id);
    let links = [], kit = null, sig = '';
    function collect() {
      const out = [], scopes = [...host.querySelectorAll(':scope > section')], foot = aside.querySelector('footer');
      if (foot) scopes.push(foot);
      for (const sc of scopes) {
        const g = clean(sc.querySelector('h2')?.textContent) || (sc === foot ? 'Exportar' : 'General');
        const add = (el, row, k, def, link) => { if (!shown(el)) return; k = clean(short(k)) || 'Control'; if (def?.type === 'action') def.label = k; out.push({ g, k, def, row, el, ...link }); };
        for (const el of sc.querySelectorAll('input[type=range], input[type=checkbox], input[type=color], input.text, select, .seg, .presets, .inks, .levels, #monosets, button')) {
          if (el.closest('.pdk')) continue;
          if (el.matches('input[type=range]')) {
            // a slider over uneven stops (the page's SLIDERS[key].values) moves an index: its dial shows the value itself
            const def = (window.PERCEPTA_SLIDERS || {})[el.id.replace(/^in-/, '')], vals = def && def.values;
            const fire = () => { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
            if (vals) {
              const near = v => vals.reduce((b, x, i) => Math.abs(x - v) < Math.abs(vals[b] - v) ? i : b, 0), r3 = v => Math.round(v * 1000) / 1000, small = r3(vals.slice(1).reduce((m, x, i) => Math.min(m, x - vals[i]), Infinity));
              add(el, el.closest('.slider') || el, labelOf(el), [r3(vals[+el.value]), r3(vals[0]), r3(vals[vals.length - 1]), small], { get: () => r3(vals[+el.value]), set: v => { el.value = near(v); fire(); } });
              continue;
            }
            const min = +el.min || 0, max = el.max === '' ? 100 : +el.max, step = el.step === 'any' || !el.step ? Math.round((max - min) / 100 * 1000) / 1000 : +el.step;
            add(el, el.closest('.slider') || el, labelOf(el), [+el.value, min, max, step], { get: () => +el.value, set: v => { el.value = v; fire(); } });
          } else if (el.matches('input[type=checkbox]')) {
            add(el, el.closest('label') || el, clean(el.closest('label')?.textContent || el.getAttribute('aria-label')), el.checked, { get: () => el.checked, set: v => { el.checked = v; el.dispatchEvent(new Event('change', { bubbles: true })); } });
          } else if (el.matches('input[type=color]')) {
            add(el, el.closest('label, .swatch') || el, labelOf(el), { type: 'color', default: el.value }, { get: () => el.value, set: v => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); } });
          } else if (el.matches('input.text')) {
            add(el, el.closest('.row') || el, labelOf(el), { type: 'text', default: el.value }, { get: () => el.value, set: v => { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } });
          } else if (el.matches('select')) {
            const opts = [...el.options].map(o => ({ value: o.value, label: clean(o.textContent) }));
            add(el, el.closest('.row') || el, labelOf(el), { type: 'select', options: opts, default: el.value }, { get: () => el.value, set: v => { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); } });
          } else if (el.matches('.seg, .presets, .inks, .levels, #monosets')) {
            const btns = [...el.querySelectorAll(':scope > button')].filter(b => !b.hidden && (b.dataset.v ?? b.dataset.p ?? b.dataset.ink ?? b.dataset.ord ?? b.dataset.set) !== undefined);
            if (btns.length < 2) continue;
            const val = b => b.dataset.v ?? b.dataset.p ?? b.dataset.ink ?? b.dataset.ord ?? b.dataset.set;
            const cur = () => btns.find(b => b.getAttribute('aria-pressed') === 'true') || btns[0];
            const opts = btns.map(b => ({ value: val(b), label: clean(b.textContent) || clean(b.title) || val(b) }));
            add(el, el.closest('.row') && !el.closest('.row').querySelector('input, select:not(.seg *)') ? el.closest('.row') : el, el.matches('.inks, .levels') ? 'Tinta' : clean(el.getAttribute('aria-label') || el.dataset.key) || g, { type: 'select', options: opts, default: val(cur()) }, { get: () => val(cur()), set: v => btns.find(b => val(b) === v)?.click() });
          } else if (el.matches('button') && !el.closest('.seg, .presets, .inks, .levels, .palette, #palsets, .pal-sets, .swatch') && !el.matches('.kf-dia, .icon') && clean(el.textContent)) {
            add(el, el, clean(el.textContent) || clean(el.title), { type: 'action', label: clean(el.textContent) || clean(el.title) }, { action: true, get: () => null, set: () => el.click() });
          }
        }
      }
      // unique keys inside each folder
      const seen = new Set();
      for (const l of out) { let k = l.k, n = 2; while (seen.has(l.g + '/' + k)) k = `${l.k} ${n++}`; seen.add(l.g + '/' + k); l.k = k; }
      return out;
    }
    function build() {
      const next = collect(), s = next.map(l => l.g + '/' + l.k + '/' + (l.def?.options ? l.def.options.map(o => o.value).join(',') : '')).join('|');
      for (const el of host.querySelectorAll('.pdk-m')) el.classList.remove('pdk-m');
      for (const l of next) l.row.classList.add('pdk-m');
      // a section with nothing of its own left (only its title and hints) goes too: its folder is in the panel
      for (const sc of host.querySelectorAll(':scope > section')) sc.classList.toggle('pdk-m', ![...sc.querySelectorAll('input, select, button, canvas, .palette, .pal-sets')].some(e => !e.closest('.pdk-m') && shown(e)));
      const foot = aside.querySelector('footer'); if (foot) foot.classList.toggle('pdk-m', ![...foot.querySelectorAll('button, input')].some(e => !e.closest('.pdk-m')));
      // the dials start from the tool as it is now (never the other way round: a rebuild must not move the tool)
      for (const l of next) if (!l.action) l.last = l.get();
      links = next;
      if (s === sig && kit) return;
      sig = s;
      const config = {};
      for (const l of links) { config[l.g] = config[l.g] || {}; config[l.g][l.k] = l.def; }
      quiet = true;
      if (!kit) {
        kit = window.PerceptaDial = DK.createDialKit(document.title || 'Percepta', config, { onAction: path => { const l = links.find(x => x.action && (x.g + '.' + x.k === path || path.endsWith('.' + x.k))); l?.set(); } });
        // only the dial that was moved reaches the tool: each dial against its own previous value (a dial that still
        // shows an old value, the tool having moved meanwhile, e.g. Escala after zooming with the wheel, never pushes it)
        kit.subscribe(values => {
          const moved = [];
          for (const l of links) { if (l.action) continue; const id = l.g + '.' + l.k, v = values[l.g]?.[l.k], p = dialPrev[id]; dialPrev[id] = v; if (!quiet && v !== undefined && v !== p) moved.push([l, v]); }
          for (const [l, v] of moved) { l.last = v; if (v !== l.get()) l.set(v); }
        });
      } else kit.updateConfig(config);
      quiet = false;
      // and show it: every dial set to its control
      const all = {}; for (const l of links) if (!l.action) (all[l.g] = all[l.g] || {})[l.k] = l.last;
      quiet = true; try { kit.setValues(all); } finally { quiet = false; }
      for (const g in all) for (const k in all[g]) dialPrev[g + '.' + k] = all[g][k];
    }
    let quiet = false, pending = 0; const dialPrev = {};
    function pull() {
      pending = 0; const upd = {};
      for (const l of links) { if (l.action) continue; const v = l.get(); if (v !== l.last) { l.last = v; (upd[l.g] = upd[l.g] || {})[l.k] = v; } }
      if (Object.keys(upd).length && kit) { quiet = true; try { kit.setValues(upd); } finally { quiet = false; } for (const g in upd) for (const k in upd[g]) dialPrev[g + '.' + k] = upd[g][k]; }
    }
    build();
    // the tool showed or hid something, or redrew a list: rebuild; a control moved: the dial follows
    let again = 0;
    new MutationObserver(() => { if (!again) again = requestAnimationFrame(() => { again = 0; build(); }); }).observe(host, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] });
    const soon = e => { if (e.target.closest?.('.pdk')) return; if (!pending) pending = requestAnimationFrame(pull); };
    for (const t of ['input', 'change', 'click', 'keyup', 'pointerup', 'wheel']) addEventListener(t, soon, true);
    window.PerceptaDialPull = () => { if (!pending) pending = requestAnimationFrame(pull); }; // the tool changed itself (a keyframe, a drag): the dials follow
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

// Contorno: a pixel drawn as its outline instead of filled. The line sits inside the pixel (its outer edge on the
// pixel's edge), so the pixel keeps its size; one too small for its line is simply filled.
// half(h, w): the half-size to draw the line on, or 0 when the pixel should be filled instead.
window.PerceptaStroke = {
  half: (h, w) => { const hh = h - w / 2; return hh > .05 ? hh : 0; },
  // SVG attributes for a group of outlines
  attrs: (c, w) => `fill="none" stroke="${c}" stroke-width="${Math.round(w * 1000) / 1000}"`,
};

// A photo's colours brought to the palette's way (its violets: OKLCH lightness ~.6–.93, soft chroma): the same hue,
// the light squeezed into the palette's range (its order kept) and the saturation softened. rgb int → rgb int.
window.PerceptaPastel = (() => {
  const memo = new Map();
  const s2l = c => { c /= 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
  const l2s = c => { c = Math.min(1, Math.max(0, c)); return Math.round(255 * (c <= .0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - .055)); };
  return c => {
    let v = memo.get(c); if (v !== undefined) return v;
    const r = s2l(c >> 16 & 255), g = s2l(c >> 8 & 255), b = s2l(c & 255);
    const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
    const L = .2104542553 * l + .7936177850 * m - .0040720468 * s, A = 1.9779984951 * l - 2.4285922050 * m + .4505937099 * s, B = .0259040371 * l + .7827717662 * m - .8086757660 * s;
    const C = Math.hypot(A, B), k = C > 1e-6 ? Math.min(.105, C * .75) / C : 0, L2 = .55 + .38 * L, a = A * k, bb = B * k;
    const l2 = (L2 + .3963377774 * a + .2158037573 * bb) ** 3, m2 = (L2 - .1055613458 * a - .0638541728 * bb) ** 3, s3 = (L2 - .0894841775 * a - 1.2914855480 * bb) ** 3;
    v = l2s(4.0767416621 * l2 - 3.3077115913 * m2 + .2309699292 * s3) << 16 | l2s(-1.2684380046 * l2 + 2.6097574011 * m2 - .3413193965 * s3) << 8 | l2s(-.0041960863 * l2 - .7034186147 * m2 + 1.7076147010 * s3);
    if (memo.size > 40000) memo.clear(); memo.set(c, v); return v;
  };
})();
