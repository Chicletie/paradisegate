// O céu do topo da home: estrelas em três camadas (paralaxe com o scroll e o ponteiro) e um
// rastro de faíscas atrás do ponteiro ou do dedo, que se apaga sozinho. O laço de desenho só
// roda enquanto algo se mexe; parado, o céu fica estático. A parte de cálculo é pura (testada
// em sky.test.ts); `startSky` só liga isso a um <canvas>.

export interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
  layer: number;
  warm: boolean;
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

/** Quanto cada camada anda com o scroll e com o ponteiro: a do fundo quase nada. */
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

/** Quanto além do fundo o céu continua: a camada da frente sobe até 0.3× o scroll, e o topo
 * fica na tela até o scroll passar da altura dele. */
export const OVERSCAN = 0.35;

export function makeStars(seed: number, w: number, h: number): Star[] {
  const rand = rng(seed);
  const fieldH = h * (1 + OVERSCAN);
  const n = starCount(w, fieldH);
  const stars: Star[] = [];
  for (let i = 0; i < n; i++) {
    const layer = rand() < 0.55 ? 0 : rand() < 0.7 ? 1 : 2;
    stars.push({
      // Margem de sobra em volta: a paralaxe nunca mostra a borda vazia.
      x: rand() * (w + 80) - 40,
      y: rand() * (fieldH + 80) - 40,
      r: 0.45 + layer * 0.35 + rand() * 0.5,
      alpha: 0.35 + rand() * 0.55,
      layer,
      warm: rand() < 0.12,
    });
  }
  return stars;
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

/** Deslocamento de uma camada: o scroll sobe as estrelas; o ponteiro (-1..1) as empurra de leve. */
export function layerOffset(layer: number, scrollY: number, px: number, py: number): { x: number; y: number } {
  const d = DEPTH[layer];
  return { x: -px * 18 * d, y: -scrollY * d * 0.5 - py * 12 * d };
}

/** Aproxima `from` de `to` sem passar; devolve `to` quando já está perto o bastante. */
export function ease(from: number, to: number, dt: number): number {
  const next = from + (to - from) * (1 - Math.pow(0.992, dt));
  return Math.abs(to - next) < 0.001 ? to : next;
}

interface SkyColors {
  cool: string;
  warm: string;
  spark: string;
}

// O canvas não lê var(): as cores vêm dos tokens, lidas uma vez ao ligar o céu.
function colors(el: Element): SkyColors {
  const css = getComputedStyle(el);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return { cool: token("--pg-on-dark"), warm: token("--pg-tarot-cream"), spark: token("--pg-gold") };
}

/** Liga o céu ao canvas. `area` recebe o ponteiro (o topo inteiro). Devolve a função de desligar. */
export function startSky(canvas: HTMLCanvasElement, area: HTMLElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const palette = colors(canvas);
  const rand = rng(20260925);
  let w = 0;
  let h = 0;
  let stars: Star[] = [];
  let sparks: Spark[] = [];
  let pointer = { x: 0, y: 0 };
  let last: { x: number; y: number } | null = null;
  let target = { x: 0, y: 0 };
  let tilt = { x: 0, y: 0 };
  let scrollY = window.scrollY;
  let visible = true;
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
    draw();
  }

  function draw() {
    ctx!.clearRect(0, 0, w, h);
    for (const s of stars) {
      const o = calm ? { x: 0, y: 0 } : layerOffset(s.layer, scrollY, tilt.x, tilt.y);
      ctx!.globalAlpha = s.alpha;
      ctx!.fillStyle = s.warm ? palette.warm : palette.cool;
      ctx!.beginPath();
      ctx!.arc(s.x + o.x, s.y + o.y, s.r, 0, Math.PI * 2);
      ctx!.fill();
    }
    ctx!.fillStyle = palette.spark;
    for (const s of sparks) {
      const k = s.life / s.max;
      ctx!.globalAlpha = k * k;
      ctx!.beginPath();
      ctx!.arc(s.x, s.y, s.r * (0.6 + k * 0.6), 0, Math.PI * 2);
      ctx!.fill();
    }
    ctx!.globalAlpha = 1;
  }

  function tick(now: number) {
    const dt = then ? Math.min(64, now - then) : 16;
    then = now;
    sparks = stepSparks(sparks, dt);
    tilt = { x: ease(tilt.x, target.x, dt), y: ease(tilt.y, target.y, dt) };
    draw();
    const moving = sparks.length > 0 || tilt.x !== target.x || tilt.y !== target.y;
    if (moving && visible) frame = requestAnimationFrame(tick);
    else {
      frame = 0;
      then = 0;
    }
  }

  function wake() {
    if (!frame && visible) frame = requestAnimationFrame(tick);
  }

  function onPointer(ev: PointerEvent) {
    const box = canvas.getBoundingClientRect();
    pointer = { x: ev.clientX - box.left, y: ev.clientY - box.top };
    target = { x: (pointer.x / w) * 2 - 1, y: (pointer.y / h) * 2 - 1 };
    if (last) sparks = sparks.concat(spawnSparks(last, pointer, rand));
    last = pointer;
    wake();
  }

  function onLeave() {
    last = null;
    target = { x: 0, y: 0 };
    wake();
  }

  function onScroll() {
    scrollY = window.scrollY;
    wake();
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) wake();
  });
  io.observe(canvas);
  if (!calm) {
    area.addEventListener("pointermove", onPointer, { passive: true });
    area.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  return () => {
    ro.disconnect();
    io.disconnect();
    area.removeEventListener("pointermove", onPointer);
    area.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("scroll", onScroll);
    if (frame) cancelAnimationFrame(frame);
  };
}
