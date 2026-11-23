// Pixel, served from this repository on your computer: `npm run dev`, then open http://localhost:5173.
// Besides serving the files, it lets the tools write presets.json (the presets everyone in the repo shares): saving a
// preset in Pixel writes it there, and committing that file shares it.
import http from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRESETS = join(root, 'presets.json');
const port = +process.env.PORT || 5173;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.obj': 'text/plain', '.wasm': 'application/wasm' };

// a preset as the tools send it: a name and its settings (plain values only)
const clean = list => (Array.isArray(list) ? list : []).filter(p => p && typeof p.name === 'string' && p.name.trim() && p.params && typeof p.params === 'object')
  .map(p => ({ name: p.name.trim().slice(0, 80), tool: typeof p.tool === 'string' ? p.tool : 'pixel', params: JSON.parse(JSON.stringify(p.params)) }));

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname === '/api/presets') {
      if (req.method === 'GET') { res.writeHead(200, { 'content-type': TYPES['.json'] }); return res.end(await readFile(PRESETS).catch(() => '{"presets":[]}')); }
      if (req.method === 'PUT') {
        let body = ''; for await (const c of req) { body += c; if (body.length > 5e6) throw new Error('too big'); }
        const presets = clean(JSON.parse(body).presets);
        await writeFile(PRESETS, JSON.stringify({ presets }, null, 2) + '\n');
        res.writeHead(200, { 'content-type': TYPES['.json'] }); return res.end(JSON.stringify({ ok: true, count: presets.length }));
      }
      res.writeHead(405); return res.end();
    }
    let path = normalize(join(root, decodeURIComponent(url.pathname)));
    if (!path.startsWith(root)) { res.writeHead(403); return res.end(); }
    if ((await stat(path).catch(() => null))?.isDirectory()) path = join(path, 'index.html');
    const data = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  } catch (e) { res.writeHead(e.code === 'ENOENT' ? 404 : 500); res.end(String(e.message || e)); }
}).listen(port, () => console.log(`Pixel: http://localhost:${port}  (los presets se guardan en presets.json)`));
