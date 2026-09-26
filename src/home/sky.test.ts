import { describe, expect, it } from "vitest";
import { ease, layerOffset, makeDust, makeStars, rng, spawnSparks, starCount, stepDust, stepSparks, twinkle, warpPoint } from "./sky";

describe("céu da home", () => {
  it("o mesmo céu a cada visita", () => {
    expect(makeStars(7, 1200, 700)).toEqual(makeStars(7, 1200, 700));
    expect(makeStars(7, 1200, 700)).not.toEqual(makeStars(8, 1200, 700));
  });

  it("quantidade de estrelas acompanha a área, com piso e teto", () => {
    expect(starCount(300, 200)).toBe(80);
    expect(starCount(1200, 700)).toBe(323);
    expect(starCount(4000, 3000)).toBe(520);
    expect(makeStars(1, 1200, 700)).toHaveLength(323);
  });

  it("toda estrela está numa das três camadas", () => {
    for (const s of makeStars(3, 800, 600)) expect([0, 1, 2]).toContain(s.layer);
  });

  it("cintilar fica entre 45% e 100% do brilho da estrela", () => {
    const [s] = makeStars(4, 800, 600);
    for (let t = 0; t < 20000; t += 137) {
      const a = twinkle(s, t);
      expect(a).toBeGreaterThanOrEqual(s.alpha * 0.45 - 1e-9);
      expect(a).toBeLessThanOrEqual(s.alpha + 1e-9);
    }
  });

  it("poeira sobe e volta por baixo, sem sair do céu", () => {
    let dust = makeDust(2, 800, 600);
    for (let i = 0; i < 400; i++) dust = stepDust(dust, 64, 800, 600);
    for (const m of dust) {
      expect(m.y).toBeGreaterThanOrEqual(-6);
      expect(m.y).toBeLessThanOrEqual(606);
      expect(m.x).toBeGreaterThanOrEqual(-6);
      expect(m.x).toBeLessThanOrEqual(806);
    }
  });

  it("ponteiro parado não solta faísca; rápido solta até 6", () => {
    const rand = rng(1);
    expect(spawnSparks({ x: 10, y: 10 }, { x: 12, y: 10 }, rand)).toHaveLength(0);
    expect(spawnSparks({ x: 0, y: 0 }, { x: 36, y: 0 }, rand)).toHaveLength(4);
    expect(spawnSparks({ x: 0, y: 0 }, { x: 400, y: 0 }, rand)).toHaveLength(6);
  });

  it("faíscas se apagam sozinhas", () => {
    let sparks = spawnSparks({ x: 0, y: 0 }, { x: 400, y: 0 }, rng(2));
    sparks = stepSparks(sparks, 500);
    expect(sparks.length).toBeGreaterThan(0);
    sparks = stepSparks(sparks, 700);
    expect(sparks).toHaveLength(0);
  });

  it("a camada do fundo anda menos que a da frente", () => {
    const back = layerOffset(0, 1, 1);
    const front = layerOffset(2, 1, 1);
    expect(Math.abs(front.x)).toBeGreaterThan(Math.abs(back.x));
    expect(Math.abs(front.y)).toBeGreaterThan(Math.abs(back.y));
  });

  it("na dobra as estrelas fogem do centro; sem dobra ficam onde estão", () => {
    expect(warpPoint(100, 100, 400, 300, 1, 0)).toEqual({ x: 100, y: 100 });
    const p = warpPoint(100, 100, 400, 300, 2, 1);
    expect(Math.hypot(p.x - 400, p.y - 300)).toBeGreaterThan(Math.hypot(100 - 400, 100 - 300) * 2);
    const back = warpPoint(100, 100, 400, 300, 0, 1);
    expect(Math.hypot(back.x - 400, back.y - 300)).toBeLessThan(Math.hypot(p.x - 400, p.y - 300));
  });

  it("a inclinação chega no alvo e para", () => {
    let v = 0;
    for (let i = 0; i < 400 && v !== 1; i++) v = ease(v, 1, 16);
    expect(v).toBe(1);
  });
});
