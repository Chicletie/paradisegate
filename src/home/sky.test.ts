import { describe, expect, it } from "vitest";
import { DEPTH, ease, layerOffset, makeStars, OVERSCAN, rng, spawnSparks, starCount, stepSparks } from "./sky";

describe("céu da home", () => {
  it("o mesmo céu a cada visita", () => {
    expect(makeStars(7, 1200, 700)).toEqual(makeStars(7, 1200, 700));
    expect(makeStars(7, 1200, 700)).not.toEqual(makeStars(8, 1200, 700));
  });

  it("quantidade de estrelas acompanha a área, com piso e teto", () => {
    expect(starCount(300, 200)).toBe(80);
    expect(starCount(1200, 700)).toBe(323);
    expect(starCount(4000, 3000)).toBe(520);
    expect(makeStars(1, 1200, 700)).toHaveLength(starCount(1200, 700 * 1.35));
  });

  it("rolando até o fim do topo, a camada da frente ainda cobre a parte de baixo", () => {
    const h = 700;
    const front = makeStars(5, 1200, h).filter((st) => st.layer === 2);
    const shift = -layerOffset(2, h, 0, 0).y;
    expect(shift).toBeCloseTo(h * DEPTH[2] * 0.5);
    expect(h * OVERSCAN).toBeGreaterThan(shift);
    expect(front.some((st) => st.y - shift > h * 0.9)).toBe(true);
  });

  it("toda estrela está numa das três camadas", () => {
    for (const s of makeStars(3, 800, 600)) expect([0, 1, 2]).toContain(s.layer);
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
    const back = layerOffset(0, 400, 1, 1);
    const front = layerOffset(2, 400, 1, 1);
    expect(Math.abs(front.y)).toBeGreaterThan(Math.abs(back.y));
    expect(Math.abs(front.x)).toBeGreaterThan(Math.abs(back.x));
    expect(layerOffset(1, 0, 0, 0)).toEqual({ x: -0, y: -0 });
  });

  it("a inclinação chega no alvo e para (o laço de desenho pode dormir)", () => {
    let v = 0;
    for (let i = 0; i < 400 && v !== 1; i++) v = ease(v, 1, 16);
    expect(v).toBe(1);
  });
});
