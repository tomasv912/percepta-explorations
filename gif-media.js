// omggif (MIT, vendored) handles LZW; this layer handles timing and frame disposal.
window.PixelGif = {
  accepts: file => !!file && (file.type === 'image/gif' || /\.gif$/i.test(file.name)),
  async open(file, onFrame, onError) {
    if (file.size > 50 * 1024 * 1024) throw new Error('El GIF debe pesar menos de 50 MB.');
    const reader = new GifReader(new Uint8Array(await file.arrayBuffer()));
    const { width, height } = reader, count = reader.numFrames();
    if (!count || width * height > 4000000 || count > 2000) throw new Error('El GIF es demasiado grande (máximo 4 MP y 2000 cuadros).');
    const infos = Array.from({ length: count }, (_, i) => reader.frameInfo(i));
    if (infos.some(f => f.x + f.width > width || f.y + f.height > height)) throw new Error('GIF inválido.');
    let duration = 0;
    const ends = infos.map(f => duration += Math.max(.02, (f.delay || 10) / 100));
    const element = document.createElement('div'), canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    canvas.style.cssText = 'width:100%;max-height:140px;object-fit:contain';
    canvas.setAttribute('aria-label', 'Vista previa del GIF');
    element.appendChild(canvas);
    const toggle = document.createElement('button'), scrub = document.createElement('input'), label = document.createElement('output');
    toggle.className = 'btn'; toggle.type = 'button';
    scrub.type = 'range'; scrub.min = '0'; scrub.max = String(duration); scrub.step = '.01'; scrub.style.width = '100%'; scrub.setAttribute('aria-label', 'Posición del GIF');
    element.append(toggle, scrub, label);
    const ctx = canvas.getContext('2d'), pixels = new Uint8ClampedArray(width * height * 4);
    const sample = PixelVideo.sampler(width, height, onFrame);
    let index = -1, restore = null, held = 0, anchor = 0, paused = true, disposed = false, raf = 0, lastTick = 0;
    const currentTime = () => paused ? held : ((performance.now() / 1000 - anchor) % duration);
    const updateUI = () => { toggle.textContent = paused ? 'Reproducir GIF' : 'Pausar GIF'; scrub.value = currentTime(); label.textContent = `${currentTime().toFixed(1)} / ${duration.toFixed(1)} s`; };
    function draw(force = false) {
      if (disposed) return;
      const time = currentTime(), next = Math.max(0, ends.findIndex(end => end > Math.min(time, duration - .0001)));
      if (next === index && !force) { updateUI(); return; }
      if (next < index) { pixels.fill(0); index = -1; restore = null; }
      while (index < next) {
        const prev = infos[index];
        if (prev?.disposal === 2) {
          for (let y = prev.y; y < prev.y + prev.height; y++) pixels.fill(0, (y * width + prev.x) * 4, (y * width + prev.x + prev.width) * 4);
        } else if (prev?.disposal === 3 && restore) pixels.set(restore);
        index++;
        restore = infos[index].disposal === 3 ? pixels.slice() : null;
        reader.decodeAndBlitFrameRGBA(index, pixels);
      }
      ctx.putImageData(new ImageData(pixels, width, height), 0, 0);
      sample(canvas); updateUI();
    }
    function tick(now) {
      if (disposed) return;
      try { if (now - lastTick >= 100) { draw(); lastTick = now; } }
      catch (error) { source.pause(); onError(error); return; }
      raf = requestAnimationFrame(tick);
    }
    const source = {
      element, width, height, kind: 'GIF', id: sample.id, duration,
      get currentTime() { return currentTime(); }, get paused() { return paused; },
      sample: () => draw(true),
      async play() { if (disposed) return; anchor = performance.now() / 1000 - held; paused = false; updateUI(); },
      pause() { held = currentTime(); paused = true; updateUI(); },
      async seek(time) { held = Math.max(0, Math.min(duration - .0001, time)); anchor = performance.now() / 1000 - held; draw(true); },
      start() { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); },
      suspend() { cancelAnimationFrame(raf); source.pause(); },
      dispose() { source.suspend(); disposed = true; canvas.width = canvas.height = 0; element.remove(); },
    };
    toggle.onclick = () => paused ? source.play() : source.pause();
    scrub.oninput = () => source.seek(+scrub.value).catch(onError);
    updateUI();
    return source;
  },
  encoder(width, height, colors = []) {
    // Keep the chosen inks exact, then add a color cube and a grayscale ramp.
    const palette = [...new Set(colors.map(c => parseInt(c.replace('#', ''), 16)).filter(Number.isFinite))].slice(0, 8);
    for (let r = 0; r < 6; r++) for (let g = 0; g < 6; g++) for (let b = 0; b < 6; b++) palette.push((r * 51 << 16) | (g * 51 << 8) | b * 51);
    for (let i = 0; i < 32; i++) { const v = Math.round(i * 255 / 31); palette.push(v << 16 | v << 8 | v); }
    while (palette.length < 256) palette.push(0);
    const lookup = new Map(), chunks = [];
    let buffer = new Uint8Array(width * height * 2 + 4096), writer = new GifWriter(buffer, width, height, { palette, loop: 0 });
    const flush = () => { chunks.push(buffer.slice(0, writer.getOutputBufferPosition())); writer.setOutputBufferPosition(0); };
    const indexed = new Uint8Array(width * height);
    return {
      add(data, delay) {
        for (let i = 0; i < indexed.length; i++) {
          const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], key = r << 16 | g << 8 | b;
          let best = lookup.get(key);
          if (best === undefined) {
            best = 0; let distance = Infinity;
            for (let j = 0; j < 256; j++) { const c = palette[j], d = (r - (c >> 16)) ** 2 + (g - (c >> 8 & 255)) ** 2 + (b - (c & 255)) ** 2; if (d < distance) { distance = d; best = j; } }
            if (lookup.size > 65536) lookup.clear();
            lookup.set(key, best);
          }
          indexed[i] = best;
        }
        writer.addFrame(0, 0, width, height, indexed, { delay, disposal: 1 }); flush();
      },
      finish() { writer.end(); flush(); return new Blob(chunks, { type: 'image/gif' }); },
    };
  },
};
