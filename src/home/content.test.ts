import { describe, expect, it } from "vitest";
import type { HomeEntry } from "../lib/home";
import { homeFaces } from "./content";

const DAY = Date.parse("2026-09-25T15:00:00Z");

function entry(id: string, type: string, cover: string | null): HomeEntry {
  return { id, title: id, type, cover } as HomeEntry;
}

const entries: HomeEntry[] = [
  ...Array.from({ length: 8 }, (_, i) => entry("p" + i, "Personagem", "https://x/" + i + ".jpg")),
  entry("semcapa", "Personagem", null),
  entry("lupino", "Lupino", "https://x/l.jpg"),
  entry("lugar", "Lugar", "https://x/lugar.jpg"),
];

describe("rostos da home", () => {
  it("só personagens, até 6, sem o Personagem do dia", () => {
    const faces = homeFaces(entries, "p0", DAY);
    expect(faces).toHaveLength(6);
    expect(faces.map((f) => f.id)).not.toContain("p0");
    expect(faces.map((f) => f.id)).not.toContain("lugar");
  });

  it("o mesmo dia dá os mesmos rostos, em qualquer ordem do índice", () => {
    const a = homeFaces(entries, null, DAY).map((f) => f.id);
    const b = homeFaces(entries.slice().reverse(), null, DAY).map((f) => f.id);
    expect(a).toEqual(b);
  });

  it("outro dia, outra ordem", () => {
    const days = Array.from({ length: 5 }, (_, i) => homeFaces(entries, null, DAY + i * 86400000).map((f) => f.id).join());
    expect(new Set(days).size).toBeGreaterThan(1);
  });

  it("capa primeiro; sem capa só completa", () => {
    const few = [entry("a", "Personagem", null), entry("b", "Personagem", "https://x/b.jpg")];
    expect(homeFaces(few, null, DAY).map((f) => f.id)).toEqual(["b", "a"]);
  });

  it("sem personagens, lista vazia", () => {
    expect(homeFaces([entry("lugar", "Lugar", null)], null, DAY)).toEqual([]);
  });
});
