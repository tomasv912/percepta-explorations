// Shared top bar. Each exploration lives in its own folder with an index.html;
// add it to the list below and it shows up on every page (and on Home, as D1). Retired tools go under
// Descartes. The Percepta mark links to Home.
(() => {
  const EXPLORATIONS = [
    { name: 'Pixel Waves', path: '' },
    { name: 'Pixel Trail', path: 'pixel-trail/' },
    { name: 'Photo Preset', path: 'photo-preset/' },
    { name: 'Pixel Rise', path: 'pixel-rise/' },
    { name: 'Pixel Blocks', path: 'pixel-blocks/' },
    { name: 'Cluster', path: 'cluster/' },
    { name: 'Pixel Model', path: 'pixel-model/' },
    {
      name: 'Descartes', path: 'descartes/', children: [
        { name: 'Cube Dispersion', path: 'cube-dispersion/' },
        { name: 'Dispersion v2', path: 'dispersion-v2/' },
        { name: 'Text Dissolve', path: 'text-dissolve/' },
        { name: 'Neural Pixel', path: 'neural-pixel/' },
      ],
    },
  ];

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
  window.PERCEPTA_EXPLORATIONS = EXPLORATIONS;

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
})();
