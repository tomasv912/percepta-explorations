// Local video decoding, bounded frame sampling, and deterministic export seeking.
window.PixelVideo = {
  accepts: file => !!file && (file.type?.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name)),
  sampler(width, height, onFrame, id = 'gif:' + crypto.randomUUID()) {
    const ar = width / height, canvas = document.createElement('canvas');
    canvas.width = ar >= 1 ? 96 : Math.max(8, Math.round(96 * ar));
    canvas.height = ar >= 1 ? Math.max(8, Math.round(96 / ar)) : 96;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }), n = canvas.width * canvas.height;
    const frame = { id, revision: 0, video: true, ar, gw: canvas.width, gh: canvas.height, lum: new Float32Array(n), rgb: new Uint32Array(n), depth: new Float32Array(n), alpha: new Float32Array(n) };
    const sample = drawable => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(drawable, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < n; i++) {
        const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], light = (.2126 * r + .7152 * g + .0722 * b) / 255;
        frame.lum[i] = light; frame.rgb[i] = r << 16 | g << 8 | b; frame.depth[i] = .15 + (1 - light) * .7; frame.alpha[i] = data[i * 4 + 3] / 255;
      }
      frame.revision++; onFrame(frame);
    };
    sample.id = id; return sample;
  },
  async open(file, onFrame, onError) {
    const video = document.createElement('video');
    video.controls = true; video.loop = true; video.muted = true; video.playsInline = true;
    video.preload = 'auto'; video.style.cssText = 'width:100%;max-height:160px;margin-top:8px';
    video.setAttribute('aria-label', 'Video subido: reproducción y posición');
    const url = URL.createObjectURL(file);
    let disposed = false, raf = 0, last = -1, lastDraw = 0;
    const waitFor = (event, action) => new Promise((resolve, reject) => {
      const done = error => { clearTimeout(timer); video.removeEventListener(event, ok); video.removeEventListener('error', fail); error ? reject(error) : resolve(); };
      const ok = () => done(), fail = () => done(new Error('No se pudo decodificar el video.'));
      const timer = setTimeout(() => done(new Error('El video tardó demasiado en cargar.')), 15000);
      video.addEventListener(event, ok, { once: true }); video.addEventListener('error', fail, { once: true });
      action();
    });
    const dispose = () => { disposed = true; cancelAnimationFrame(raf); video.pause(); video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); video.remove(); };
    try {
      await waitFor('loadeddata', () => { video.src = url; });
      if (!video.videoWidth || !Number.isFinite(video.duration) || video.duration <= 0) throw new Error('Video vacío o no compatible.');
    } catch (error) { dispose(); throw error; }
    const readFrame = PixelVideo.sampler(video.videoWidth, video.videoHeight, onFrame, url);
    const sample = () => {
      if (disposed || video.readyState < 2 || video.seeking) return;
      readFrame(video); last = video.currentTime;
    };
    const tick = now => {
      if (disposed) return;
      try { if (video.currentTime !== last && now - lastDraw >= 100) { sample(); lastDraw = now; } }
      catch (error) { video.pause(); onError(error); return; }
      raf = requestAnimationFrame(tick);
    };
    const source = {
      element: video, dispose, sample, kind: 'Video', id: url,
      width: video.videoWidth, height: video.videoHeight,
      get duration() { return video.duration; }, get currentTime() { return video.currentTime; }, get paused() { return video.paused; },
      play: () => video.play(), pause: () => video.pause(),
      async seek(time) {
        const t = Math.max(0, Math.min(video.duration - .001, time));
        if (Math.abs(video.currentTime - t) > .0001) await waitFor('seeked', () => { video.currentTime = t; });
        sample();
      },
      start() { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); },
      suspend() { cancelAnimationFrame(raf); video.pause(); },
    };
    return source;
  },
};
