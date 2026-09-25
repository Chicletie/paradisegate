import { describe, expect, it } from "vitest";
import { dailyLabel, filterWritings, kindCounts, kindLabel, tagsOf, writingHref, writingMarks, writingsBy, writingsFromIndex } from "./escritos";
import { dailyHighlights, entriesFromIndex, recentNotes, wikiNumbers } from "./home";
import type { WikiIndex } from "../types";

const index: WikiIndex = {
  anytsa: {
    title: "Anytsa", type: "Personagem", postsCount: 2,
    escritos: [
      { id: "w1", page: "escrito-w1", title: "O farol", date: "2026-03-10", tipo: "conto", canone: "canonico", origem: "mundo", tags: ["drama"], autor: "mel_rr", vis: "publico", excerpt: "Subiu o farol." },
      { id: "w2", page: "escrito-w2", title: "Segredo", date: "2026-04-01", tipo: "causo", vis: "spoiler", at: "t1" },
    ],
  },
  daphne: {
    title: "Daphne", type: "Personagem", postsCount: 1,
    escritos: [{ id: "w1", page: "escrito-w1", title: "O farol", date: "2026-03-10", tipo: "conto", canone: "canonico", origem: "mundo", tags: ["drama"], autor: "mel_rr", vis: "publico", excerpt: "Subiu o farol." }],
  },
  // Publicada antes dos Escritos: só posts.
  vel: { title: "Ruínas de Vel", type: "Local", postsCount: 1, posts: [{ id: "p9", title: "Nota velha", date: "2026-01-01", excerpt: "Pedras." }] },
};

describe("writingsFromIndex", () => {
  const all = writingsFromIndex(index);
  it("junta o mesmo escrito das várias páginas, o mais novo primeiro", () => {
    expect(all.map((w) => w.id)).toEqual(["w2", "w1", "p9"]);
    expect(all.find((w) => w.id === "w1")!.entries.map((e) => e.id)).toEqual(["anytsa", "daphne"]);
  });
  it("nota antiga vira escrito sem tipo e sem página própria", () => {
    const p = all.find((w) => w.id === "p9")!;
    expect(p.page).toBeNull();
    expect(writingHref(p)).toBe("/wiki/vel#posts");
    expect(writingHref(all.find((w) => w.id === "w1")!)).toBe("/wiki/_escritos/w1");
  });
  it("filtra por tipo, marcas, tag e página", () => {
    expect(filterWritings(all, { tipo: "conto" }).map((w) => w.id)).toEqual(["w1"]);
    expect(filterWritings(all, { tipo: "-" }).map((w) => w.id)).toEqual(["p9"]);
    expect(filterWritings(all, { canone: "canonico", origem: "mundo", tag: "drama" }).map((w) => w.id)).toEqual(["w1"]);
    expect(filterWritings(all, { pagina: "daphne" }).map((w) => w.id)).toEqual(["w1"]);
  });
  it("contagens, tags e autoria", () => {
    expect(kindCounts(all)).toEqual([["conto", 1], ["causo", 1], ["", 1]]);
    expect(tagsOf(all)).toEqual(["drama"]);
    expect(writingsBy(all, "mel_rr").map((w) => w.id)).toEqual(["w1"]);
  });
});

describe("rótulos", () => {
  it("o destaque do dia leva o nome do tipo", () => {
    expect(dailyLabel("causo")).toBe("Causo do dia");
    expect(dailyLabel("bastidores")).toBe("Escrito do dia");
    expect(dailyLabel(undefined)).toBe("Escrito do dia");
    expect(kindLabel("")).toBe("Escrito");
    expect(writingMarks({ tipo: "conto", canone: "fora", origem: "mesa" })).toBe("Conto · fora do cânone · mesa");
  });
});

describe("home com escritos", () => {
  const entries = entriesFromIndex(index);
  it("escritos recentes: só os públicos, cada um uma vez, com o link certo", () => {
    const n = recentNotes(entries);
    expect(n.map((x) => x.id)).toEqual(["w1", "p9"]);
    expect(n[0].href).toBe("/wiki/_escritos/w1");
    expect(n[0].entryTitle).toBe("Anytsa, Daphne");
  });
  it("o destaque do dia nunca é spoiler", () => {
    const d = dailyHighlights(entries, Date.UTC(2026, 8, 25, 15));
    expect(["w1", "p9"]).toContain(d.note!.id);
  });
  it("conta cada escrito uma vez", () => {
    const num = wikiNumbers(entries).nums.find((x) => x[2] === "Escritos");
    expect(num![0]).toBe(3); // w1, w2 (páginas novas) + 1 nota velha
  });
});
