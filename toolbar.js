// Shared top bar. Each exploration lives in its own folder with an index.html;
// add it to the list below and it shows up on every page (and on Home, as D1). Retired tools go under
// Descartes (not listed on Home); general tools (GENERAL) are on Home only. The Percepta mark links to Home.
(() => {
  const EXPLORATIONS = [
    { name: 'Pixel Waves', path: '' },
    { name: 'Pixel Trail', path: 'pixel-trail/' },
    { name: 'Pixel Model', path: 'pixel-model/' },
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

  // Palettes every tool with colour offers. White and black stay as they are (#F6F6F6, #272727): they are the two
  // backgrounds, and the ink; a palette only swaps the colours. palettePicker(host, get, set) fills host with one
  // button per palette, pressed when get() matches, set(colors) on click; returns a function that re-marks it.
  const PALETTES = [
    { name: 'Percepta', colors: ['#E4DEFC', '#A8A5EC', '#A0C2FF', '#98DEDF', '#3DDB89'] },
    { name: 'Lavanda', colors: ['#C9BEF9', '#A4E1EF', '#71A3FE'] },
    { name: 'Lila', colors: ['#E4DEFC', '#A8A5EC', '#A0C2FF'] },
    { name: 'Durazno', colors: ['#FCEEDE', '#ECABA5', '#BCA0FF'] },
    { name: 'Atardecer', colors: ['#FFE89D', '#FFC778', '#FF885D'] },
    { name: 'Coral', colors: ['#FCE2DE', '#ECB3A5', '#FF706B'] },
    { name: 'Caramelo', colors: ['#FFE799', '#FCABD8', '#5EAFF2'] },
    { name: 'Rosado', colors: ['#FCDEF6', '#D1A5EC', '#FFA0DB'] },
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
  window.palettePicker = (host, get, set) => {
    host.classList.add('pal-sets'); host.setAttribute('aria-label', 'Paletas');
    host.innerHTML = PALETTES.map((p, i) => `<button data-set="${i}" title="${p.name}" aria-label="Paleta ${p.name}">${p.colors.map(c => `<i style="background:${c}"></i>`).join('')}</button>`).join('');
    host.addEventListener('click', e => { const b = e.target.closest('[data-set]'); if (b) set(PALETTES[+b.dataset.set].colors.slice()); });
    const mark = () => { const cur = get().join().toLowerCase(); host.querySelectorAll('[data-set]').forEach(b => b.setAttribute('aria-pressed', PALETTES[+b.dataset.set].colors.join().toLowerCase() === cur)); };
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
