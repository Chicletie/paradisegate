import { describe, expect, it } from "vitest";
import { cardFields, cardOutdated, favoritePages, memberHandle, pagesOfMember, sinceLabel } from "./member";
import type { WikiIndex } from "../types";

describe("perfil público /@nome", () => {
  it("lê o endereço", () => {
    expect(memberHandle("@ania_sombra")).toBe("ania_sombra");
    expect(memberHandle("/@Ania_Sombra")).toBe("ania_sombra");
    expect(memberHandle("%40ania")).toBe("ania");
    expect(memberHandle("wiki")).toBeNull();
    expect(memberHandle("@a")).toBeNull();
    expect(memberHandle("@ania sombra")).toBeNull();
  });

  it("monta o cartão sem e-mail e só com favoritos quando a pessoa quer", () => {
    const profile = { email: "a@b.com", nickname: "Ânia", favorites: ["x", "y"], photo: "data:image/jpeg;base64,AA" };
    const off = cardFields(profile, { bio: "Oi" }, "2026-03-01T00:00:00Z");
    expect(off).toEqual({ nickname: "Ânia", photo: "data:image/jpeg;base64,AA", bio: "Oi", since: "2026-03-01T00:00:00Z", showFavorites: false });
    expect("email" in off).toBe(false);
    expect(cardFields(profile, { showFavorites: true }, undefined).favorites).toEqual(["x", "y"]);
    expect(cardFields({}, { bio: "x".repeat(400) }, undefined).bio).toHaveLength(300);
  });

  it("só regrava o cartão quando algo mudou", () => {
    const want = cardFields({ nickname: "Ânia" }, {}, "2026-03-01");
    expect(cardOutdated({ uid: "u", ...want }, want)).toBe(false);
    expect(cardOutdated({ uid: "u" }, want)).toBe(true);
    expect(cardOutdated({ uid: "u", ...want, favorites: ["x"] }, want)).toBe(true);
  });

  it("acha os personagens e os favoritos no índice", () => {
    const index: WikiIndex = {
      b: { title: "Bruno", type: "Personagem", membros: ["ania"] },
      a: { title: "Alucard", type: "Personagem", membros: ["ania", "outro"] },
      c: { title: "Cidade", type: "Local" },
    };
    expect(pagesOfMember(index, "ania").map((p) => p.id)).toEqual(["a", "b"]);
    expect(pagesOfMember(index, "ninguem")).toEqual([]);
    expect(favoritePages(index, { uid: "u", showFavorites: true, favorites: ["c", "sumiu"] }).map((p) => p.id)).toEqual(["c"]);
    expect(favoritePages(index, { uid: "u", showFavorites: false, favorites: ["c"] })).toEqual([]);
  });

  it("escreve a data de entrada", () => {
    expect(sinceLabel("2026-03-15T12:00:00Z")).toMatch(/março de 2026/);
    expect(sinceLabel(undefined)).toBe("");
  });
});
