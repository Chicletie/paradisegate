import { describe, expect, it } from "vitest";
import { showsFichas } from "./flags";

describe("quem vê o painel Suas fichas no perfil", () => {
  it("o mestre sempre, com ou sem a chave", () => {
    expect(showsFichas("admin", false)).toBe(true);
    expect(showsFichas("admin", true)).toBe(true);
  });
  it("o jogador só com a chave ligada (e o erro, pra dar o tentar de novo)", () => {
    expect(showsFichas("player", false)).toBe(false);
    expect(showsFichas("player", true)).toBe(true);
    expect(showsFichas("error", true)).toBe(true);
    expect(showsFichas("error", false)).toBe(false);
  });
  it("quem não está na mesa, ou ainda não respondeu, não vê nada", () => {
    for (const kind of ["none", "loading", "not_invited"] as const) {
      expect(showsFichas(kind, true), kind).toBe(false);
    }
  });
});
