import { describe, expect, it } from "vitest";
import { relatedPages, textLinks } from "./related";
import type { WikiIndex, WikiLink } from "../types";

const idx = (over: Record<string, { title: string; type?: string; tags?: string[]; universeId?: string }>): WikiIndex =>
  Object.fromEntries(Object.entries(over).map(([id, e]) => [id, { type: "Personagem", universeId: "lotus", ...e }])) as WikiIndex;
const ids = (list: { id: string }[]) => list.map((r) => r.id).sort();

describe("páginas relacionadas: sorteio do dia (2026-09-30)", () => {
  it("links do texto: fora dos spoilers, sem repetir, com âncora e id codificado", () => {
    expect(textLinks(["veja [A](wiki:a) e [B](wiki:b#passado)", "||segredo [C](wiki:c)||", "[A de novo](wiki:a) [D](wiki:d%C3%A9)"])).toEqual(["a", "b", "dé"]);
  });

  it("relações e links do texto vêm antes; spoiler e página fora do índice nunca entram", () => {
    const index = idx({ eu: { title: "Eu", tags: ["x"] }, mae: { title: "Mãe" }, citado: { title: "Citado" }, segredo: { title: "Segredo" }, tag: { title: "Tag", tags: ["x"] } });
    const links: WikiLink[] = [
      { targetId: "mae", targetTitle: "Mãe", term: "mãe" },
      { targetId: "segredo", targetTitle: "Segredo", spoiler: true },
      { targetId: "sumida", targetTitle: "Sumida" },
    ];
    const out = relatedPages("eu", { links, texts: ["[c](wiki:citado) ||[s](wiki:segredo)||"], tags: ["x"] }, index, "2026-09-30", 2);
    expect(ids(out)).toEqual(["citado", "mae"]);
    expect(out.find((r) => r.id === "mae")!.why).toBe("mãe");
    expect(out.find((r) => r.id === "citado")!.why).toBe("citado no texto");
  });

  it("com mais relações que vagas, sorteia entre elas: igual no mesmo dia, muda em outro dia", () => {
    const pages: Record<string, { title: string }> = { eu: { title: "Eu" } };
    const links: WikiLink[] = [];
    for (let i = 0; i < 12; i++) {
      pages["p" + i] = { title: "P" + i };
      links.push({ targetId: "p" + i, targetTitle: "P" + i, term: "amigo" });
    }
    const index = idx(pages);
    const hoje = relatedPages("eu", { links }, index, "2026-09-30");
    expect(hoje).toHaveLength(5);
    expect(relatedPages("eu", { links: links.slice().reverse() }, index, "2026-09-30")).toEqual(hoje);
    const dias = ["2026-10-01", "2026-10-02", "2026-10-03"].map((d) => ids(relatedPages("eu", { links }, index, d)).join());
    expect(dias.some((d) => d !== ids(hoje).join())).toBe(true);
  });

  it("tags em comum só completam as vagas que sobram, e só do mesmo universo", () => {
    const index = idx({
      eu: { title: "Eu" },
      mae: { title: "Mãe" },
      a: { title: "A", tags: ["Vampiro"] },
      b: { title: "B", tags: ["vampiro"] },
      c: { title: "C", tags: ["vampiro"], universeId: "rosa" },
      d: { title: "D", tags: ["lobo"] },
    });
    const out = relatedPages("eu", { links: [{ targetId: "mae", targetTitle: "Mãe", term: "mãe" }], tags: ["vampiro"] }, index, "2026-09-30");
    expect(out[0].id).toBe("mae");
    expect(ids(out.slice(1))).toEqual(["a", "b"]);
    expect(out.find((r) => r.id === "a")!.why).toBe("#Vampiro");
  });
});
