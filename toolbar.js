// Shared top bar. Each exploration lives in its own folder with an index.html;
// add it to the list below and it shows up on every page.
(() => {
  const EXPLORATIONS = [
    { name: 'Cube Noise', path: '' },
    { name: 'Cube Dispersion', path: 'cube-dispersion/' },
    { name: 'Dispersion v2', path: 'dispersion-v2/' },
    { name: 'Pixel Trail', path: 'pixel-trail/' },
    { name: 'Photo Preset', path: 'photo-preset/' },
    { name: 'Text Dissolve', path: 'text-dissolve/' },
  ];

  const script = document.currentScript;
  const root = new URL('./', script.src);
  const isFile = location.protocol === 'file:';
  const norm = p => p.replace(/index\.html$/, '').replace(/\/?$/, '/');
  const here = norm(location.pathname);

  const style = document.createElement('style');
  style.textContent = `
.toolbar { flex: none; display: flex; align-items: center; gap: 16px; height: 44px; padding: 0 16px; background: var(--surface); border-bottom: 1px solid var(--line); min-width: 0; }
.toolbar .tb-brand { font-weight: 600; font-size: 13px; color: var(--text); white-space: nowrap; }
.toolbar .tb-tabs { display: flex; gap: 2px; min-width: 0; overflow-x: auto; scrollbar-width: none; }
.toolbar .tb-tabs::-webkit-scrollbar { display: none; }
.toolbar a { flex: none; display: inline-flex; align-items: center; height: 28px; padding: 0 10px; border-radius: 8px; color: var(--text-2); text-decoration: none; font: 500 12px var(--font); white-space: nowrap; }
.toolbar a:hover { background: var(--fill); color: var(--text); }
.toolbar a[aria-current="page"] { background: var(--fill); color: var(--text); box-shadow: inset 0 0 0 1px var(--line); }
.toolbar a:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
`;
  document.head.appendChild(style);

  const nav = document.createElement('nav');
  nav.className = 'toolbar';
  nav.setAttribute('aria-label', 'Exploraciones');
  const links = EXPLORATIONS.map(e => {
    const url = new URL(e.path, root);
    const href = url.href + (isFile ? 'index.html' : '');
    const current = norm(url.pathname) === here ? ' aria-current="page"' : '';
    return `<a href="${href}"${current}>${e.name}</a>`;
  }).join('');
  nav.innerHTML = `<span class="tb-brand">Percepta</span><div class="tb-tabs">${links}</div>`;
  script.replaceWith(nav);
})();
