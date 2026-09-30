import { describe, expect, it } from "vitest";
import type { WikiIndex } from "../types";
import { navboxesFor } from "./navbox";

const e = (title: string, type: string, extra: object = {}) => ({ title, type, universeId: "lotus", ...extra });
const index: WikiIndex = {
  dem: e("Dementor", "Personagem", { tags: ["Vampiro", "Nobreza"], grupos: ["Equipe de Operações 1307"] }),
  pan: e("Pandora", "Personagem", { tags: ["vampiro"] }),
  cas: e("Castelo", "Local", { tags: ["Vampíro"] }),
  lu: e("Lua", "Personagem", { grupos: ["equipe de operacoes 1307"] }),
  so: e("Sozinha", "Personagem", { tags: ["Nobreza"], universeId: "outro" }),
};

describe("caixas de navegação", () => {
  it("uma por grupo e por tag, juntando grafias, só do mesmo universo e com mais de uma página", () => {
    const boxes = navboxesFor(index, "dem");
    expect(boxes.map((b) => b.kind + ":" + b.title)).toEqual(["grupo:Equipe de Operações 1307", "tag:Vampiro"]);
    expect(boxes[0].rows).toEqual([
      {
        type: "",
        items: [
          { id: "dem", title: "Dementor", self: true },
          { id: "lu", title: "Lua", self: false },
        ],
      },
    ]);
  });
  it("com tipos diferentes, uma linha por tipo", () => {
    const tag = navboxesFor(index, "pan").find((b) => b.kind === "tag")!;
    expect(tag.rows.map((r) => r.type + ":" + r.items.map((i) => i.id).join(","))).toEqual(["Local:cas", "Personagem:dem,pan"]);
  });
  it("sem índice ou sem a página, nada", () => {
    expect(navboxesFor(null, "dem")).toEqual([]);
    expect(navboxesFor(index, "x")).toEqual([]);
    expect(navboxesFor(index, "so")).toEqual([]);
  });
});
