import { describe, expect, it } from "vitest";
import { pgShortDate, pgPlural, objPos } from "./format";

describe("pgShortDate", () => {
  it("formata AAAA-MM-DD como 'D mês. AAAA'", () => {
    expect(pgShortDate("2026-09-20")).toBe("20 set. 2026");
    expect(pgShortDate("2026-01-05")).toBe("5 jan. 2026");
  });
  it("devolve a string original se não for uma data válida", () => {
    expect(pgShortDate("não é data")).toBe("não é data");
    expect(pgShortDate(undefined)).toBe("");
  });
});

describe("pgPlural", () => {
  it("pluraliza tipos comuns em português", () => {
    expect(pgPlural("Personagem")).toBe("Personagens");
    expect(pgPlural("Facção")).toBe("Facções");
    expect(pgPlural("Local")).toBe("Locais");
    expect(pgPlural("Item")).toBe("Itens");
  });
});

describe("objPos", () => {
  it("usa 50/50 sem foco definido", () => {
    expect(objPos(undefined)).toBe("50% 50%");
    expect(objPos(null)).toBe("50% 50%");
  });
  it("usa o foco quando definido", () => {
    expect(objPos({ x: 20, y: 80 })).toBe("20% 80%");
  });
});
