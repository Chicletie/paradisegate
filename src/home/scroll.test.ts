import { describe, expect, it } from "vitest";
import { pinProgress, portalFrame, smooth, trackShift } from "./scroll";

describe("scroll da home", () => {
  it("smooth vai de 0 a 1 só entre os limites", () => {
    expect(smooth(0.2, 0.4, 0.1)).toBe(0);
    expect(smooth(0.2, 0.4, 0.3)).toBeCloseTo(0.5);
    expect(smooth(0.2, 0.4, 0.9)).toBe(1);
  });

  it("progresso da seção presa", () => {
    expect(pinProgress(100, 3000, 900)).toBe(0);
    expect(pinProgress(0, 3000, 900)).toBe(0);
    expect(pinProgress(-1050, 3000, 900)).toBeCloseTo(0.5);
    expect(pinProgress(-5000, 3000, 900)).toBe(1);
    expect(pinProgress(-10, 800, 900)).toBe(1);
  });

  it("parado no topo, o portal está inteiro e nada do outro lado", () => {
    const f = portalFrame(0);
    expect(f.seal).toBe(1);
    expect(f.sealOpacity).toBe(1);
    expect(f.text).toBe(1);
    expect(f.warp).toBe(0);
    expect(f.reveal).toBe(0);
  });

  it("no fim da travessia, o selo passou, as estrelas pararam e a carta está à vista", () => {
    const f = portalFrame(1);
    expect(f.seal).toBeGreaterThan(30);
    expect(f.sealOpacity).toBe(0);
    expect(f.text).toBe(0);
    expect(f.warp).toBe(0);
    expect(f.flash).toBe(0);
    expect(f.reveal).toBe(1);
  });

  it("no meio, as estrelas estão em dobra e o selo já cresceu", () => {
    const f = portalFrame(0.5);
    expect(f.warp).toBeGreaterThan(0.9);
    expect(f.seal).toBeGreaterThan(5);
  });

  it("o selo só cresce", () => {
    let last = 0;
    for (let p = 0; p <= 1; p += 0.05) {
      const s = portalFrame(p).seal;
      expect(s).toBeGreaterThanOrEqual(last);
      last = s;
    }
  });

  it("a trilha da galeria anda do começo ao fim", () => {
    expect(trackShift(0, 3000, 1400)).toBe(0);
    expect(trackShift(1, 3000, 1400)).toBe(-1600);
    expect(trackShift(0.5, 1000, 1400)).toBe(0);
  });
});
