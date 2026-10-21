import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULTS, PRESETS, type Params, type Style, type Shape } from './params';
import { generateNetwork } from './network';
import { gridOf, rawField, shapeField } from './field';
import { Activation } from './activation';
import { scatterPixels, buildShades, drawPixels, drawDebug, toSvg, STRIDE } from './render';
import { rng, range } from './random';

type SetParam = <K extends keyof Params>(key: K, value: Params[K]) => void;
const MAX_EXPORT_SIDE = 16384;

// ---------- Controls ----------
interface SliderProps { label: string; value: number; min: number; max: number; step: number; fmt?: (v: number) => string; emph?: boolean; onChange: (v: number) => void; reset?: number }
function Slider({ label, value, min, max, step, fmt = v => String(v), emph, onChange, reset }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={'slider' + (emph ? ' emph' : '')}>
      <label>{label}</label>
      <output>{fmt(value)}</output>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={label}
        style={{ ['--p' as string]: pct + '%' }} title="Doble clic para restablecer"
        onChange={e => onChange(+e.target.value)} onDoubleClick={() => reset !== undefined && onChange(reset)} />
    </div>
  );
}
function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" aria-label={label}>
      {options.map(([v, text]) => <button key={v} aria-pressed={v === value} onClick={() => onChange(v)}>{text}</button>)}
    </div>
  );
}
function Swatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="row" style={{ gridTemplateColumns: '56px 1fr' }}>
      <span>{label}</span>
      <label className="swatch"><i style={{ background: value }} /><b>{value.toUpperCase()}</b>
        <input type="color" value={value} aria-label={label} onChange={e => onChange(e.target.value)} /></label>
    </div>
  );
}
const Section = ({ title, children }: { title: string; children: ReactNode }) => <section><h2>{title}</h2>{children}</section>;

const pct = (v: number) => Math.round(v * 100) + '%';
const px = (v: number) => v + ' px';

// ---------- App ----------
function App() {
  const [p, setP] = useState<Params>(DEFAULTS);
  const [playing, setPlaying] = useState(true);
  const [scale, setScale] = useState(2);
  const [view, setView] = useState({ w: 0, h: 0 });
  const set: SetParam = (k, v) => setP(prev => ({ ...prev, [k]: v }));

  // Each stage only recomputes when its own inputs change.
  const net = useMemo(() => generateNetwork(p),
    [p.seed, p.width, p.height, p.margin, p.clusters, p.nodes, p.connectivity, p.branching, p.curvature, p.noiseFreq, p.noiseAmp, p.octaves, p.warp, p.pathWidth]);
  const grid = useMemo(() => gridOf(p), [p.width, p.height]);
  const raw = useMemo(() => rawField(net, p, grid), [net, grid]);
  const values = useMemo(() => shapeField(raw, p, grid), [raw, p.noiseMix, p.threshold, p.contrast, p.margin]);
  const pixels = useMemo(() => scatterPixels(values, p, grid),
    [values, p.seed, p.style, p.count, p.size, p.mod, p.variation, p.clump, p.stragglers, p.noiseFreq]);
  const shades = useMemo(() => buildShades(p.fg, p.style === 'mono' ? 0 : p.grain), [p.fg, p.grain, p.style]);
  const activation = useMemo(() => new Activation(net, p.seed), [net]);

  const stageRef = useRef<HTMLElement>(null), canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ p, net, grid, pixels, shades, activation, playing, view, time: 0, last: 0, act: null as Float32Array | null, dirty: true });
  Object.assign(live.current, { p, net, grid, pixels, shades, playing, view });
  if (live.current.activation !== activation) Object.assign(live.current, { activation, act: null });
  useEffect(() => { live.current.dirty = true; }, [p, pixels, shades, view, net]);

  useEffect(() => {
    const el = stageRef.current!;
    const ro = new ResizeObserver(() => { const r = el.getBoundingClientRect(); setView({ w: r.width, h: r.height }); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Animation loop: steps signals while playing, redraws only when something changed.
  useEffect(() => {
    let raf = 0;
    const loop = (ts: number) => {
      const s = live.current, dt = s.last ? Math.min(0.05, (ts - s.last) / 1000) : 0;
      s.last = ts;
      if (s.playing && s.p.actIntensity > 0) {
        s.time += dt; s.activation.step(s.time, dt, s.p);
        s.act = s.activation.field(s.grid, s.time, s.p); s.dirty = true;
      }
      if (s.dirty) { paint(); s.dirty = false; }
      raf = requestAnimationFrame(loop);
    };
    const paint = () => {
      const s = live.current, cv = canvasRef.current;
      if (!cv || !s.view.w) return;
      const k = Math.max(0.01, Math.min((s.view.w - 64) / s.p.width, (s.view.h - 96) / s.p.height));
      const w = Math.round(s.p.width * k), h = Math.round(s.p.height * k), dpr = devicePixelRatio || 1;
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
      cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(h * dpr));
      const ctx = cv.getContext('2d')!;
      ctx.setTransform(cv.width / s.p.width, 0, 0, cv.height / s.p.height, 0, 0);
      ctx.fillStyle = s.p.bg; ctx.fillRect(0, 0, s.p.width, s.p.height);
      drawPixels(ctx, s.pixels, s.act, s.p, s.shades);
      if (s.p.debug) drawDebug(ctx, s.net, cv.width / s.p.width);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ---------- Export (always the frame on screen, signals included) ----------
  const [toast, setToast] = useState('');
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2400); return () => clearTimeout(t); }, [toast]);
  const download = (name: string, blob: Blob) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setToast(name + ' descargado');
  };
  const exportPng = (transparent: boolean) => {
    const s = Math.min(scale, MAX_EXPORT_SIDE / Math.max(p.width, p.height));
    const c = document.createElement('canvas'); c.width = Math.round(p.width * s); c.height = Math.round(p.height * s);
    const ctx = c.getContext('2d')!;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    if (!transparent) { ctx.fillStyle = p.bg; ctx.fillRect(0, 0, p.width, p.height); }
    drawPixels(ctx, pixels, live.current.act, p, shades);
    c.toBlob(b => b ? download(`neural-pixel-${p.seed}${transparent ? '-transparent' : ''}.png`, b) : setToast('No se pudo generar el PNG.'), 'image/png');
  };
  const exportSvg = () => download(`neural-pixel-${p.seed}.svg`, new Blob([toSvg(pixels, live.current.act, p, shades, false)], { type: 'image/svg+xml' }));

  const randomize = () => {
    const r = rng(Date.now() & 0xffffff);
    setP(prev => ({
      ...prev, seed: Math.floor(r() * 1e6),
      clusters: Math.round(range(r, 3, 9)), nodes: Math.round(range(r, 120, 600)), connectivity: +range(r, 0.1, 0.7).toFixed(2),
      branching: +range(r, 0.2, 0.8).toFixed(2), curvature: +range(r, 0.2, 0.7).toFixed(2),
      noiseFreq: +range(r, 1, 3).toFixed(2), noiseAmp: +range(r, 0.02, 0.08).toFixed(3), warp: +range(r, 0.2, 0.9).toFixed(2),
    }));
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest('input, textarea')) return;
      if (e.code === 'Space') { e.preventDefault(); setPlaying(v => !v); }
      else if (e.key.toLowerCase() === 'r') randomize();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const activePreset = Object.entries(PRESETS).find(([, v]) => Object.entries(v).every(([k, x]) => p[k as keyof Params] === x))?.[0];

  return (
    <>
      <main id="stage" ref={stageRef}>
        <canvas ref={canvasRef} className="art" role="img" aria-label="Textura de puntos generada a partir de una red" />
        <div className="hud">
          <span>{net.degree.length} nodos · {net.edges.length} conexiones · {(pixels.length / STRIDE).toLocaleString('es')} píxeles · {p.width} × {p.height}</span>
          <span className="dim"><kbd>Espacio</kbd> pausa · <kbd>R</kbd> aleatorio</span>
        </div>
      </main>

      <aside>
        <div className="controls">
          <Section title="Presets">
            <div className="presets">
              {Object.keys(PRESETS).map(name => (
                <button key={name} className="btn" aria-pressed={activePreset === name} onClick={() => setP(prev => ({ ...prev, ...PRESETS[name] }))}>{name}</button>
              ))}
            </div>
            <div className="btns">
              <button className="btn" onClick={randomize}>Aleatorio</button>
              <button className="btn" onClick={() => setP(DEFAULTS)}>Restablecer</button>
            </div>
          </Section>

          <Section title="Red">
            <div className="row">
              <span>Semilla</span>
              <input className="text" inputMode="numeric" aria-label="Semilla" value={p.seed}
                onChange={e => set('seed', Math.min(999999999, parseInt(e.target.value.replace(/\D/g, '') || '0', 10)))} />
              <button className="btn icon" title="Nueva semilla" aria-label="Nueva semilla" onClick={() => set('seed', Math.floor(Math.random() * 1e6))}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13.5 8A5.5 5.5 0 1 1 11.6 3.8" /><path d="M13.5 2.5v3h-3" /></svg>
              </button>
            </div>
            <Slider label="Clusters" value={p.clusters} min={1} max={14} step={1} onChange={v => set('clusters', v)} reset={DEFAULTS.clusters} />
            <Slider label="Nodos" value={p.nodes} min={30} max={1200} step={10} emph onChange={v => set('nodes', v)} reset={DEFAULTS.nodes} />
            <Slider label="Conectividad" value={p.connectivity} min={0} max={1} step={0.01} fmt={pct} onChange={v => set('connectivity', v)} reset={DEFAULTS.connectivity} />
            <Slider label="Ramificación" value={p.branching} min={0} max={1} step={0.01} fmt={pct} onChange={v => set('branching', v)} reset={DEFAULTS.branching} />
            <Slider label="Curvatura de los caminos" value={p.curvature} min={0} max={1} step={0.01} fmt={pct} onChange={v => set('curvature', v)} reset={DEFAULTS.curvature} />
          </Section>

          <Section title="Deformación">
            <Slider label="Frecuencia del ruido" value={p.noiseFreq} min={0.2} max={6} step={0.05} fmt={v => v.toFixed(2)} onChange={v => set('noiseFreq', v)} reset={DEFAULTS.noiseFreq} />
            <Slider label="Amplitud" value={p.noiseAmp} min={0} max={0.2} step={0.002} fmt={pct} onChange={v => set('noiseAmp', v)} reset={DEFAULTS.noiseAmp} />
            <Slider label="Octavas" value={p.octaves} min={1} max={6} step={1} onChange={v => set('octaves', v)} reset={DEFAULTS.octaves} />
            <Slider label="Domain warp" value={p.warp} min={0} max={1.5} step={0.01} fmt={pct} onChange={v => set('warp', v)} reset={DEFAULTS.warp} />
          </Section>

          <Section title="Densidad">
            <Slider label="Ancho de los caminos" value={p.pathWidth} min={2} max={24} step={0.5} fmt={px} onChange={v => set('pathWidth', v)} reset={DEFAULTS.pathWidth} />
            <Slider label="Ruido de fondo" value={p.noiseMix} min={0} max={1} step={0.01} fmt={pct} onChange={v => set('noiseMix', v)} reset={DEFAULTS.noiseMix} />
            <Slider label="Umbral de densidad" value={p.threshold} min={0} max={0.9} step={0.01} fmt={pct} emph onChange={v => set('threshold', v)} reset={DEFAULTS.threshold} />
            <Slider label="Contraste" value={p.contrast} min={0.3} max={4} step={0.05} fmt={v => v.toFixed(2)} onChange={v => set('contrast', v)} reset={DEFAULTS.contrast} />
          </Section>

          <Section title="Píxeles">
            <Seg<Style> label="Estilo" value={p.style} onChange={v => set('style', v)} options={[['mono', 'Mono'], ['variation', 'Variación']]} />
            <Seg<Shape> label="Forma" value={p.shape} onChange={v => set('shape', v)} options={[['square', 'Píxel'], ['circle', 'Punto']]} />
            <Slider label="Píxeles" value={p.count} min={1000} max={150000} step={500} emph fmt={v => v < 10000 ? v.toLocaleString('es') : Math.round(v / 1000) + 'k'} onChange={v => set('count', v)} reset={DEFAULTS.count} />
            <Slider label="Tamaño" value={p.size} min={0.5} max={20} step={0.1} fmt={px} onChange={v => set('size', v)} reset={DEFAULTS.size} />
            <Slider label="Agrupamiento" value={p.clump} min={0} max={1} step={0.01} fmt={pct} onChange={v => set('clump', v)} reset={DEFAULTS.clump} />
            <Slider label="Sueltos" value={p.stragglers} min={0} max={0.3} step={0.005} fmt={pct} onChange={v => set('stragglers', v)} reset={DEFAULTS.stragglers} />
            {p.style === 'variation' && <>
              <Slider label="Tamaño según densidad" value={p.mod} min={0} max={1} step={0.01} fmt={pct} onChange={v => set('mod', v)} reset={DEFAULTS.mod} />
              <Slider label="Variación" value={p.variation} min={0} max={1} step={0.01} fmt={pct} onChange={v => set('variation', v)} reset={DEFAULTS.variation} />
              <Slider label="Variación de tono" value={p.grain} min={0} max={0.2} step={0.005} fmt={pct} onChange={v => set('grain', v)} reset={DEFAULTS.grain} />
            </>}
          </Section>

          <Section title="Activación">
            <button className="btn" onClick={() => setPlaying(v => !v)}>{playing ? 'Pausar' : 'Reproducir'}</button>
            <Slider label="Intensidad" value={p.actIntensity} min={0} max={1.5} step={0.01} fmt={pct} onChange={v => set('actIntensity', v)} reset={DEFAULTS.actIntensity} />
            <Slider label="Velocidad" value={p.actSpeed} min={20} max={600} step={5} fmt={v => v + ' px/s'} onChange={v => set('actSpeed', v)} reset={DEFAULTS.actSpeed} />
            <Slider label="Decaimiento" value={p.actDecay} min={0.1} max={3} step={0.05} fmt={v => v.toFixed(2) + ' s'} onChange={v => set('actDecay', v)} reset={DEFAULTS.actDecay} />
            <Slider label="Frecuencia" value={p.actFreq} min={0} max={3} step={0.05} fmt={v => v.toFixed(2) + ' /s'} onChange={v => set('actFreq', v)} reset={DEFAULTS.actFreq} />
          </Section>

          <Section title="Color">
            <Swatch label="Frente" value={p.fg} onChange={v => set('fg', v)} />
            <Swatch label="Fondo" value={p.bg} onChange={v => set('bg', v)} />
          </Section>

          <Section title="Lienzo">
            <div className="dims">
              <DimInput label="Ancho" value={p.width} onCommit={v => set('width', v)} />
              <DimInput label="Alto" value={p.height} onCommit={v => set('height', v)} />
            </div>
            <Slider label="Margen" value={p.margin} min={0} max={0.25} step={0.005} fmt={pct} onChange={v => set('margin', v)} reset={DEFAULTS.margin} />
            <label className="check"><input type="checkbox" checked={p.debug} onChange={e => set('debug', e.target.checked)} /> Depuración: ver nodos y caminos</label>
          </Section>
        </div>
        <footer>
          <Seg<string> label="Escala de exportación" value={String(scale)} onChange={v => setScale(+v)} options={[['1', '1×'], ['2', '2×'], ['4', '4×']]} />
          <button className="btn primary big" onClick={() => exportPng(false)}>Exportar PNG</button>
          <div className="btns">
            <button className="btn" onClick={() => exportPng(true)}>PNG transparente</button>
            <button className="btn" onClick={exportSvg}>SVG</button>
          </div>
        </footer>
      </aside>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

// Canvas size, applied on Enter or blur so typing intermediate values doesn't regenerate.
function DimInput({ label, value, onCommit }: { label: string; value: number; onCommit: (v: number) => void }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    const v = parseInt(text, 10);
    if (Number.isFinite(v)) onCommit(Math.min(8000, Math.max(200, v))); else setText(String(value));
  };
  return (
    <label><span>{label}</span>
      <input className="text" inputMode="numeric" value={text} onChange={e => setText(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} /></label>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
