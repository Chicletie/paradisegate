// Contas do scroll da home, sem DOM (testadas em scroll.test.ts).

export const clamp01 = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v);

/** 0 → 1 entre `a` e `b`, com entrada e saída suaves (smoothstep). */
export function smooth(a: number, b: number, v: number): number {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Progresso de uma seção presa (sticky): 0 quando o topo dela chega no topo da tela, 1 quando
 * o palco vai soltar. `top` é o getBoundingClientRect().top da seção. */
export function pinProgress(top: number, height: number, vh: number): number {
  const run = height - vh;
  if (run <= 0) return top <= 0 ? 1 : 0;
  return clamp01(-top / run);
}

export interface PortalFrame {
  /** Escala do selo: cresce até a câmera passar pelo vão do arco. */
  seal: number;
  sealOpacity: number;
  /** Título, frase e convites saindo de cena. */
  text: number;
  /** Estrelas em dobra (0 parado, 1 máximo). */
  warp: number;
  /** Clarão no instante da travessia. */
  flash: number;
  /** O outro lado: a carta do dia. */
  reveal: number;
}

/** Cada quadro da travessia a partir do progresso `p` do palco do portal. */
export function portalFrame(p: number): PortalFrame {
  const zoom = smooth(0.04, 0.64, p);
  return {
    seal: 1 + 34 * Math.pow(zoom, 2.6),
    sealOpacity: 1 - smooth(0.52, 0.66, p),
    text: 1 - smooth(0.02, 0.22, p),
    warp: smooth(0.08, 0.5, p) * (1 - smooth(0.6, 0.82, p)),
    flash: smooth(0.42, 0.6, p) * (1 - smooth(0.6, 0.74, p)),
    reveal: smooth(0.6, 0.84, p),
  };
}

/** Quanto a trilha da galeria anda pra esquerda, em px, no progresso `p`. */
export function trackShift(p: number, trackWidth: number, viewWidth: number): number {
  return 0 - Math.max(0, trackWidth - viewWidth) * clamp01(p) || 0;
}
