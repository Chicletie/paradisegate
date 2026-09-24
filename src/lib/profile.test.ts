import { describe, expect, it } from "vitest";
import { accessLabel, groupAccesses, isNewSuggestion, mergeProfile, newestFirst, suggestionStatus, unreadCount } from "./profile";
import type { WikiIndex } from "../types";

describe("seus acessos", () => {
  it("rótulo de cada tipo de trecho, sem o prefixo tax:", () => {
    expect(accessLabel({ kind: "campo-confidencial", key: "tax:Habitat" })).toBe("Versão confidencial de “Habitat”");
    expect(accessLabel({ kind: "secao", title: "Diário", variant: "Antes do pacto" })).toBe("Seção “Diário” · Antes do pacto");
    expect(accessLabel({ kind: "galeria" })).toBe("Imagem da galeria");
    expect(accessLabel({ kind: "galeria", caption: "Retrato" })).toBe("Imagem da galeria “Retrato”");
    expect(accessLabel({ kind: "outro" })).toBe("Trecho restrito");
  });

  it("agrupa por página, só as do índice, em ordem de título", () => {
    const index: WikiIndex = { b: { title: "Beta", type: "Local" }, a: { title: "Alfa", type: "Local" } };
    const rows = [
      { pageId: "b", item: { kind: "tag", text: "x" } },
      { pageId: "fora", item: { kind: "tag", text: "y" } },
      { pageId: "a", item: { kind: "tag", text: "z" } },
      { pageId: "b", item: { kind: "alias", text: "w" } },
    ];
    expect(groupAccesses(rows, index).map((g) => [g.pageId, g.items.length])).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });
});

describe("suas sugestões", () => {
  const seen = "2026-09-20T00:00:00Z";
  it("novidade = resposta ou decisão depois da última visita", () => {
    expect(isNewSuggestion({ repliedAt: "2026-09-21T00:00:00Z" }, seen)).toBe(true);
    expect(isNewSuggestion({ statusAt: "2026-09-19T00:00:00Z" }, seen)).toBe(false);
    expect(isNewSuggestion({}, "")).toBe(false);
    expect(unreadCount([{ repliedAt: "2026-09-21" }, { statusAt: "2026-09-22" }, {}], seen)).toBe(2);
  });
  it("situação e ordem (mais nova primeiro)", () => {
    expect(suggestionStatus({ status: "rejeitada" })).toEqual(["Não aceita", "is-no"]);
    expect(suggestionStatus({})).toEqual(["Pendente", "is-wait"]);
    expect(newestFirst([{ createdAt: "2026-01-01" }, { createdAt: "2026-02-01" }, {}]).map((s) => s.createdAt)).toEqual([
      "2026-02-01",
      "2026-01-01",
      undefined,
    ]);
  });
});

describe("perfil guardado depois de gravar", () => {
  const user = { uid: "u", email: "a@b.c" };
  it("favoritar e tirar mexem só na lista, sem repetir", () => {
    const d = { favorites: ["x", "y"] };
    expect(mergeProfile(d, user, { favorite: { id: "x", on: true } }, "t").favorites).toEqual(["y", "x"]);
    expect(mergeProfile(d, user, { favorite: { id: "y", on: false } }, "t").favorites).toEqual(["x"]);
  });
  it("tirar a foto guarda null; e-mail e data sempre juntos", () => {
    expect(mergeProfile({ photo: "data:" }, user, { photo: null }, "t")).toEqual({ photo: null, email: "a@b.c", updatedAt: "t" });
  });
});
