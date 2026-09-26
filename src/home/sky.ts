// O céu da home: estrelas em três camadas que cintilam devagar, poeira dourada subindo, um
// rastro de faíscas atrás do ponteiro ou do dedo e a "dobra" (warp) da travessia do portal,
// quando as estrelas fogem do centro em riscos. Roda só com o céu na tela e a aba visível;
// em prefers-reduced-motion desenha uma vez, parado. A parte de cálculo é pura (sky.test.ts);
// `startSky` só liga isso a um <canvas>.

export interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
  layer: number;
  warm: boolean;
  /** cintilar: velocidade (rad/ms) e fase */
  tw: number;
  ph: number;
}

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** ms que ainda restam */
  life: number;
  max: number;
  r: number;
}

export interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
}

/** Quanto cada camada anda com o ponteiro e foge na dobra: a do fundo quase nada. */
export const DEPTH = [0.12, 0.3, 0.6];
const SPARK_LIFE = 1100;
const MAX_SPARKS = 160;

/** Gerador determinístico (mulberry32): o mesmo céu a cada visita. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function starCount(w: number, h: number): number {
  return Math.round(Math.min(520, Math.max(80, (w * h) / 2600)));
}

export function makeStars(seed: number, w: number, h: number): Star[] {
  const rand = rng(seed);
  const n = starCount(w, h);
  const stars: Star[] = [];
  for (let i = 0; i < n; i++) {
    const layer = rand() < 0.55 ? 0 : rand() < 0.7 ? 1 : 2;
    stars.push({
      x: rand() * (w + 80) - 40,
      y: rand() * (h + 80) - 40,
      r: 0.45 + layer * 0.35 + rand() * 0.5,
      alpha: 0.35 + rand() * 0.55,
      layer,
      warm: rand() < 0.12,
      tw: 0.0006 + rand() * 0.0016,
      ph: rand() * Math.PI * 2,
    });
  }
  return stars;
}

/** Brilho de uma estrela no instante `t` (ms): oscila entre 45% e 100% do dela. */
export function twinkle(s: Star, t: number): number {
  return s.alpha * (0.725 + 0.275 * Math.sin(t * s.tw + s.ph));
}

export function makeDust(seed: number, w: number, h: number): Mote[] {
  const rand = rng(seed);
  const n = Math.round(Math.min(70, Math.max(18, (w * h) / 26000)));
  return Array.from({ length: n }, () => ({
    x: rand() * w,
    y: rand() * h,
    vx: (rand() - 0.5) * 0.006,
    vy: -(0.006 + rand() * 0.012),
    r: 0.6 + rand() * 1.3,
    alpha: 0.18 + rand() * 0.4,
  }));
}

/** Poeira sobe devagar e volta por baixo quando sai por cima (e dos lados). */
export function stepDust(dust: Mote[], dt: number, w: number, h: number): Mote[] {
  return dust.map((m) => {
    let x = m.x + m.vx * dt;
    let y = m.y + m.vy * dt;
    if (y < -6) y = h + 6;
    if (x < -6) x = w + 6;
    else if (x > w + 6) x = -6;
    return { ...m, x, y };
  });
}

/** Faíscas ao longo do trecho que o ponteiro andou; mais rápido, mais faíscas (até 6 por passo). */
export function spawnSparks(from: { x: number; y: number }, to: { x: number; y: number }, rand: () => number): Spark[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const n = Math.min(6, Math.floor(dist / 9));
  const out: Spark[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + rand()) / n;
    const life = SPARK_LIFE * (0.6 + rand() * 0.4);
    out.push({
      x: from.x + dx * t,
      y: from.y + dy * t,
      vx: (rand() - 0.5) * 0.02 - dx * 0.0004,
      vy: (rand() - 0.5) * 0.02 - dy * 0.0004 - 0.004,
      life,
      max: life,
      r: 0.6 + rand() * 1.1,
    });
  }
  return out;
}

/** Avança `dt` ms: move, desacelera e descarta as que apagaram. */
export function stepSparks(sparks: Spark[], dt: number): Spark[] {
  const drag = Math.pow(0.996, dt);
  const out: Spark[] = [];
  for (const s of sparks) {
    const life = s.life - dt;
    if (life <= 0) continue;
    out.push({ ...s, x: s.x + s.vx * dt, y: s.y + s.vy * dt, vx: s.vx * drag, vy: s.vy * drag, life });
  }
  return out.length > MAX_SPARKS ? out.slice(out.length - MAX_SPARKS) : out;
}

/** Deslocamento de uma camada com o ponteiro (-1..1): as da frente andam mais. */
export function layerOffset(layer: number, px: number, py: number): { x: number; y: number } {
  const d = DEPTH[layer];
  return { x: -px * 18 * d, y: -py * 12 * d };
}

/** Posição de uma estrela na dobra: foge do centro (cx, cy), mais rápido nas camadas da frente. */
export function warpPoint(x: number, y: number, cx: number, cy: number, layer: number, warp: number): { x: number; y: number } {
  const k = 1 + warp * 2.4 * (0.4 + DEPTH[layer]);
  return { x: cx + (x - cx) * k, y: cy + (y - cy) * k };
}

/** Aproxima `from` de `to` sem passar; devolve `to` quando já está perto o bastante. */
export function ease(from: number, to: number, dt: number): number {
  const next = from + (to - from) * (1 - Math.pow(0.992, dt));
  return Math.abs(to - next) < 0.001 ? to : next;
}

export interface Sky {
  stop: () => void;
  /** Dobra da travessia, 0..1; `cy` (fração da altura) é o centro de fuga. */
  setWarp: (warp: number, cy?: number) => void;
}

interface SkyColors {
  cool: string;
  warm: string;
  gold: string;
}

// O canvas não lê var(): as cores vêm dos tokens, lidas uma vez ao ligar o céu.
function colors(el: Element): SkyColors {
  const css = getComputedStyle(el);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return { cool: token("--pg-on-dark"), warm: token("--pg-tarot-cream"), gold: token("--pg-gold") };
}

/** Liga o céu ao canvas. `area` recebe o ponteiro. */
export function startSky(canvas: HTMLCanvasElement, area: HTMLElement): Sky {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { stop: () => {}, setWarp: () => {} };
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const palette = colors(canvas);
  const rand = rng(20260925);
  let w = 0;
  let h = 0;
  let stars: Star[] = [];
  let dust: Mote[] = [];
  let sparks: Spark[] = [];
  let last: { x: number; y: number } | null = null;
  let target = { x: 0, y: 0 };
  let tilt = { x: 0, y: 0 };
  let warp = 0;
  let warpCy = 0.5;
  let onScreen = true;
  let frame = 0;
  let then = 0;

  function resize() {
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = box.width;
    h = box.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = makeStars(7, w, h);
    dust = makeDust(11, w, h);
    draw(0);
  }

  function draw(t: number) {
    const c = ctx!;
    c.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h * warpCy;
    c.lineCap = "round";
    for (const s of stars) {
      const o = calm ? { x: 0, y: 0 } : layerOffset(s.layer, tilt.x, tilt.y);
      const x = s.x + o.x;
      const y = s.y + o.y;
      c.globalAlpha = calm ? s.alpha : twinkle(s, t);
      const color = s.warm ? palette.warm : palette.cool;
      if (warp > 0.01) {
        const head = warpPoint(x, y, cx, cy, s.layer, warp);
        const tail = warpPoint(x, y, cx, cy, s.layer, warp * 0.72);
        c.strokeStyle = color;
        c.lineWidth = s.r * (1 + warp);
        c.beginPath();
        c.moveTo(tail.x, tail.y);
        c.lineTo(head.x, head.y);
        c.stroke();
      } else {
        c.fillStyle = color;
        c.beginPath();
        c.arc(x, y, s.r, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.fillStyle = palette.gold;
    for (const m of dust) {
      c.globalAlpha = m.alpha * (1 - warp);
      c.beginPath();
      c.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      c.fill();
    }
    for (const s of sparks) {
      const k = s.life / s.max;
      c.globalAlpha = k * k;
      c.beginPath();
      c.arc(s.x, s.y, s.r * (0.6 + k * 0.6), 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  }

  function tick(now: number) {
    const dt = then ? Math.min(64, now - then) : 16;
    then = now;
    sparks = stepSparks(sparks, dt);
    dust = stepDust(dust, dt, w, h);
    tilt = { x: ease(tilt.x, target.x, dt), y: ease(tilt.y, target.y, dt) };
    draw(now);
    frame = requestAnimationFrame(tick);
  }

  function run() {
    if (calm || frame || !onScreen || document.hidden) return;
    then = 0;
    frame = requestAnimationFrame(tick);
  }

  function pause() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function onPointer(ev: PointerEvent) {
    const box = canvas.getBoundingClientRect();
    const p = { x: ev.clientX - box.left, y: ev.clientY - box.top };
    target = { x: (p.x / w) * 2 - 1, y: (p.y / h) * 2 - 1 };
    if (last) sparks = sparks.concat(spawnSparks(last, p, rand));
    last = p;
  }

  function onLeave() {
    last = null;
    target = { x: 0, y: 0 };
  }

  function onVisibility() {
    if (document.hidden) pause();
    else run();
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (onScreen) run();
    else pause();
  });
  io.observe(canvas);
  document.addEventListener("visibilitychange", onVisibility);
  if (!calm) {
    area.addEventListener("pointermove", onPointer, { passive: true });
    area.addEventListener("pointerleave", onLeave);
  }
  run();

  return {
    stop() {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      area.removeEventListener("pointermove", onPointer);
      area.removeEventListener("pointerleave", onLeave);
      pause();
    },
    setWarp(v: number, cy?: number) {
      if (calm) return;
      warp = v;
      if (cy != null) warpCy = cy;
    },
  };
}
