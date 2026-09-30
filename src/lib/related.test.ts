import { describe, expect, it } from "vitest";
import { relatedPages } from "./related";
import type { WikiIndex, WikiLink } from "../types";

const idx = (over: Partial<Record<string, { title: string; type?: string; tags?: string[]; universeId?: string }>>): WikiIndex =>
  Object.fromEntries(Object.entries(over).map(([id, e]) => [id, { type: "Personagem", universeId: "lotus", ...e }])) as WikiIndex;

describe("páginas relacionadas (2026-09-30)", () => {
  it("relação primeiro, sem spoiler nem página fora do índice, e sem repetir", () => {
    const index = idx({ eu: { title: "Eu" }, mae: { title: "Mãe" }, irmao: { title: "Irmão" }, segredo: { title: "Segredo" } });
    const links: WikiLink[] = [
      { targetId: "mae", targetTitle: "Mãe", term: "mãe" },
      { targetId: "segredo", targetTitle: "Segredo", spoiler: true },
      { targetId: "revelada", targetTitle: "R", at: "t1" },
      { targetId: "sumida", targetTitle: "Sumida" },
    ];
    const back: WikiLink[] = [
      { targetId: "mae", targetTitle: "Mãe", term: "mãe" },
      { targetId: "irmao", targetTitle: "Irmão", label: "irmão" },
    ];
    expect(relatedPages("eu", links, back, [], index).map((r) => r.id + ":" + r.why)).toEqual(["mae:mãe", "irmao:irmão"]);
  });

  it("completa com quem divide mais tags, só do mesmo universo, até o limite", () => {
    const index = idx({
      eu: { title: "Eu", tags: ["vampiro", "nobre"] },
      a: { title: "A", tags: ["vampiro"] },
      b: { title: "B", tags: ["Vampiro", "nobre"] },
      c: { title: "C", tags: ["vampiro"], universeId: "rosa" },
      d: { title: "D", tags: ["lobo"] },
    });
    expect(relatedPages("eu", [], [], ["vampiro", "nobre"], index).map((r) => r.id + ":" + r.why)).toEqual(["b:#Vampiro", "a:#vampiro"]);
    expect(relatedPages("eu", [], [], ["vampiro", "nobre"], index, 1).map((r) => r.id)).toEqual(["b"]);
  });
});
