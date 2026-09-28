import { describe, expect, it } from "vitest";
import { cardFields, cardOutdated, favoritePages, memberCards, memberHandle, orderRoles, pagesOfMember, shownRoles, sinceLabel } from "./member";
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

  it("personagens: vale o campo Intérprete; página antiga (sem ele) vale pela menção", () => {
    const g = { titulo: "Paradise Gate: Genesis", id: "pg-genesis" };
    const index: WikiIndex = {
      a: { title: "Alucard", type: "Personagem", membros: ["ania"], interpretes: [{ membro: "outra", em: [] }] },
      d: { title: "Daphne", type: "Personagem", membros: [], interpretes: [{ membro: "ania", em: [{ ...g, sessao: { titulo: "A Testemunha", id: "x1" } }] }] },
      v: { title: "Velho", type: "Personagem", membros: ["ania"] },
    };
    const roles = pagesOfMember(index, "ania");
    expect(roles.map((p) => p.id)).toEqual(["d", "v"]);
    expect(roles[0].em[0].sessao?.id).toBe("x1");
    expect(roles[1].em).toEqual([]);
    expect(roles[0].textos).toEqual([]);
  });

  it("personagens: o texto do autor (onde interpretou) vem junto", () => {
    const index: WikiIndex = {
      d: { title: "Daphne", type: "Personagem", interpretes: [{ membro: "ania", em: [], texto: " em [Genesis](wiki:pg-genesis) " }, { membro: "ania", em: [], texto: "" }] },
    };
    expect(pagesOfMember(index, "ania")[0].textos).toEqual(["em [Genesis](wiki:pg-genesis)"]);
  });

  it("ordem escolhida primeiro, o resto por título; escondidos saem", () => {
    const list = ["a", "b", "c", "d"].map((id) => ({ id, e: { title: id, type: "" } }));
    expect(orderRoles(list, ["c", "a", "sumiu"]).map((p) => p.id)).toEqual(["c", "a", "b", "d"]);
    expect(shownRoles(list, { ordem: ["d"], ocultos: ["b"] }).map((p) => p.id)).toEqual(["d", "a", "c"]);
  });

  it("o cartão guarda a ordem e os escondidos, e percebe quando mudam", () => {
    const want = cardFields({}, { ordem: ["b", "a"], ocultos: ["c"] }, undefined);
    expect(want.ordem).toEqual(["b", "a"]);
    expect(want.ocultos).toEqual(["c"]);
    expect(cardOutdated({ uid: "u", ...want }, want)).toBe(false);
    expect(cardOutdated({ uid: "u", ...want, ordem: ["a", "b"] }, want)).toBe(true);
    expect("ordem" in cardFields({}, { ordem: [] }, undefined)).toBe(false);
  });

  it("cartas do membro: até duas, só as válidas", () => {
    const got = memberCards({ cartas: [{ kind: "major", n: 17 }, { kind: "major", n: 99 }, { kind: "minor", suit: "copas", rank: 13 }, { kind: "major", n: 12 }] });
    expect(got.map((c) => c.label)).toEqual(["XVII · A Estrela", "Rainha de Copas"]);
    expect(memberCards({})).toEqual([]);
  });

  it("escreve a data de entrada", () => {
    expect(sinceLabel("2026-03-15T12:00:00Z")).toMatch(/março de 2026/);
    expect(sinceLabel(undefined)).toBe("");
  });
});
