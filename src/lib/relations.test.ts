import { describe, expect, it } from "vitest";
import { affinitiesOf, hasFamilyData, hasRelations } from "./relations";
import type { WikiLink } from "../types";

describe("hasFamilyData", () => {
  it("reconhece rótulos de família conhecidos", () => {
    const links: WikiLink[] = [{ label: "é filho(a) de", targetTitle: "Cassian" }];
    expect(hasFamilyData(links)).toBe(true);
  });
  it("ignora rótulos que não são de família", () => {
    const links: WikiLink[] = [{ label: "rival de", targetTitle: "Hades", style: "rival" }];
    expect(hasFamilyData(links)).toBe(false);
  });
  it("sem ligações não tem família", () => {
    expect(hasFamilyData([])).toBe(false);
    expect(hasFamilyData(undefined)).toBe(false);
  });
});

describe("hasRelations", () => {
  it("true com ligações OU menções", () => {
    expect(hasRelations([{ targetTitle: "X" }], [])).toBe(true);
    expect(hasRelations([], [{ targetTitle: "Y" }])).toBe(true);
    expect(hasRelations([], [])).toBe(false);
  });
});

describe("affinitiesOf", () => {
  it("agrupa por rótulo de afinidade, na ordem fixa", () => {
    const links: WikiLink[] = [
      { label: "afeta", targetTitle: "A" },
      { label: "pratica", targetTitle: "B" },
      { label: "rival de", targetTitle: "C" },
    ];
    const groups = affinitiesOf(links);
    expect(groups.map((g) => g.label)).toEqual(["Pratica", "Afeta"]);
  });
});

describe("relações com termo, spoiler e disfarce", () => {
  it("parentesco em spoiler ou disfarce não entra na árvore genealógica", () => {
    expect(hasFamilyData([{ label: "é filho(a) de", targetTitle: "X", spoiler: true }])).toBe(false);
    expect(hasFamilyData([{ label: "irmão/irmã de", targetTitle: "X", spoiler: "disfarce", cover: "amigo(a) de" }])).toBe(false);
  });
  it("adotivos, de criação e gêmeos entram na árvore", () => {
    expect(hasFamilyData([{ label: "é filho(a) adotivo(a) de", targetTitle: "X" }])).toBe(true);
    expect(hasFamilyData([{ label: "é pai/mãe de criação de", targetTitle: "X" }])).toBe(true);
    expect(hasFamilyData([{ label: "gêmeo(a) de", targetTitle: "X" }])).toBe(true);
  });
  it("afinidade em spoiler não aparece", () => {
    expect(affinitiesOf([{ label: "pratica", targetTitle: "Magia", spoiler: true }])).toEqual([]);
  });
});
