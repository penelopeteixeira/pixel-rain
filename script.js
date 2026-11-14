function initPixelRainBackground(){
  const canvas = document.getElementById("bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const BLUE = { r: 13, g: 34, b: 99 };

  const CONFIG = {
    speedMin: 45,
    speedMax: 180,
    pixelMin: 1,
    pixelMax: 4,
    columnGapMin: 6,
    columnGapMax: 22,
    trailAlpha: 0.12,
    dprCap: 2,
    hazeStrength: 0.08,
    burstMin: 2,
    burstMax: 7
  };

  let W = 0, H = 0, dpr = 1;
  let columns = [];
  let lastT = performance.now();

  const rand = (min, max) => Math.random() * (max - min) + min;
  const irand = (min, max) => Math.floor(rand(min, max + 1));

  function isLightTheme(){
    return document.documentElement.getAttribute("data-theme") === "light";
  }

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, CONFIG.dprCap);
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);

    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    buildColumns();
    clearInstant();
  }

  function buildColumns(){
    columns = [];
    let x = 0;

    while (x < W){
      const gap = rand(CONFIG.columnGapMin, CONFIG.columnGapMax);

      columns.push({
        x,
        y: rand(-H, H),
        speed: rand(CONFIG.speedMin, CONFIG.speedMax),
        size: rand(CONFIG.pixelMin, CONFIG.pixelMax),
        burst: {
          count: irand(CONFIG.burstMin, CONFIG.burstMax),
          spread: rand(12, 80),
          jitter: rand(0.2, 1.2),
        }
      });

      x += gap;
    }
  }

  function clearInstant(){
    const g = ctx.createLinearGradient(0, 0, 0, H);

    if (isLightTheme()){
      g.addColorStop(0, "rgb(245, 247, 255)");
      g.addColorStop(0.6, "rgb(236, 240, 252)");
      g.addColorStop(1, "rgb(225, 232, 248)");
    } else {
      g.addColorStop(0, "rgb(3, 5, 16)");
      g.addColorStop(0.6, "rgb(2, 4, 14)");
      g.addColorStop(1, "rgb(1, 2, 10)");
    }

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function fadeFrame(){
    const a = CONFIG.trailAlpha;
    ctx.fillStyle = isLightTheme() ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    ctx.fillRect(0, 0, W, H);
  }

  function pixelColor(alpha, boost = 1){
    const r = Math.min(255, Math.floor(BLUE.r * boost));
    const g = Math.min(255, Math.floor(BLUE.g * boost));
    const b = Math.min(255, Math.floor(BLUE.b * boost));
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function drawPixel(x, y, size, a){
    ctx.fillStyle = isLightTheme() ? pixelColor(a * 0.68, 1.10) : pixelColor(a, 1.75);
    ctx.fillRect((x | 0), (y | 0), size, size);
  }

  function step(t){
    const dt = Math.min(0.033, (t - lastT) / 1000);
    lastT = t;

    fadeFrame();

    if (CONFIG.hazeStrength > 0){
      const haze = ctx.createRadialGradient(
        W * 0.5, H * 0.35, 80,
        W * 0.5, H * 0.35, Math.max(W, H) * 0.9
      );

      if (isLightTheme()){
        haze.addColorStop(0, `rgba(13,34,99,${CONFIG.hazeStrength * 0.35})`);
        haze.addColorStop(1, "rgba(255,255,255,0)");
      } else {
        haze.addColorStop(0, `rgba(13,34,99,${CONFIG.hazeStrength})`);
        haze.addColorStop(1, "rgba(0,0,0,0)");
      }

      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, W, H);
    }

    for (const c of columns){
      c.y += c.speed * dt;

      const { count, spread, jitter } = c.burst;

      for (let i = 0; i < count; i++){
        const yy = c.y - i * rand(8, spread) + rand(-jitter, jitter);
        if (yy < -30 || yy > H + 30) continue;

        const a = isLightTheme() ? rand(0.05, 0.14) : rand(0.10, 0.35);
        const sz = c.size;
        const xoff = rand(-0.6, 0.6);

        drawPixel(c.x + xoff, yy, sz, a);
      }

      if (c.y - 140 > H){
        c.y = rand(-H * 0.45, -60);
        c.speed = rand(CONFIG.speedMin, CONFIG.speedMax);
        c.size = rand(CONFIG.pixelMin, CONFIG.pixelMax);
        c.burst.count = irand(CONFIG.burstMin, CONFIG.burstMax);
        c.burst.spread = rand(12, 90);
        c.burst.jitter = rand(0.2, 1.4);
      }
    }

    if (!document.hidden) requestAnimationFrame(step);
  }

  const themeObserver = new MutationObserver(() => clearInstant());
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"]
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden){
      lastT = performance.now();
      requestAnimationFrame(step);
    }
  });

  window.addEventListener("resize", resize, { passive: true });

  resize();
  requestAnimationFrame(step);
}

initPixelRainBackground();
