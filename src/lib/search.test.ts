import { describe, expect, it } from "vitest";
import { didYouMean, searchEntries, snippet, terms, typeCounts } from "./search";
import type { HomeEntry } from "./home";

const E = (id: string, o: Partial<HomeEntry>): HomeEntry => ({ id, title: id, type: "Personagem", ...o }) as HomeEntry;
const entries: HomeEntry[] = [
  E("anytsa", { title: "Anytsa Hagan", tags: ["circo"], search: "Anytsa cresceu entre redes de pesca. Aos doze anos fugiu com o circo de Daphne.", updatedAt: "2026-09-10" }),
  E("daphne", { title: "Daphne Dolphin", tags: ["circo", "mar"], search: "Dona do circo. Conhece Anytsa desde pequena.", updatedAt: "2026-09-20" }),
  E("circo", { title: "Circo das Marés", type: "Local", search: "O circo itinerante onde Daphne se apresenta.", updatedAt: "2026-09-01" }),
  E("vel", { title: "Ruínas de Vel", type: "Local", search: "Cidade em ruínas ao norte.", updatedAt: "2026-09-15" }),
];

describe("busca de verdade", () => {
  it("separa as palavras sem acento nem maiúscula", () => {
    expect(terms("  Circo das MARÉS ")).toEqual(["circo", "das", "mares"]);
    expect(terms("a")).toEqual(["a"]);
  });

  it("título vale mais que texto, e o título exato vai pro topo", () => {
    const r = searchEntries(entries, "circo das marés");
    expect(r[0].e.id).toBe("circo");
    expect(r[0].exact).toBe(true);
    const c = searchEntries(entries, "circo").map((x) => x.e.id);
    expect(c[0]).toBe("circo");
    expect(c).toContain("anytsa");
    expect(c).not.toContain("vel");
  });

  it("toda palavra precisa aparecer em algum lugar", () => {
    expect(searchEntries(entries, "daphne pesca").map((x) => x.e.id)).toEqual(["anytsa"]);
    expect(searchEntries(entries, "daphne dragão")).toEqual([]);
  });

  it("acha sem acento e marca o trecho no texto original", () => {
    const r = searchEntries(entries, "ruinas");
    expect(r[0].e.id).toBe("vel");
    const s = snippet("Cidade em ruínas ao norte.", ["ruinas"])!;
    expect(s.filter((x) => x.hit).map((x) => x.text)).toEqual(["ruínas"]);
    expect(s.map((x) => x.text).join("")).toBe("Cidade em ruínas ao norte.");
  });

  it("tag que bate aparece no resultado", () => {
    const r = searchEntries(entries, "mar").find((x) => x.e.id === "daphne")!;
    expect(r.tagHits).toEqual(["mar"]);
  });

  it("ordena por A a Z e por atualização", () => {
    expect(searchEntries(entries, "circo", "az").map((x) => x.e.id)).toEqual(["anytsa", "circo", "daphne"]);
    expect(searchEntries(entries, "circo", "recentes")[0].e.id).toBe("daphne");
  });

  it("conta por tipo e sugere quando não acha", () => {
    expect(typeCounts(searchEntries(entries, "circo"))).toEqual([["Personagem", 2], ["Local", 1]]);
    expect(didYouMean(entries, "Dafne").map((e) => e.id)).toEqual(["daphne"]);
    expect(didYouMean(entries, "anitsa").map((e) => e.id)).toEqual(["anytsa"]);
    expect(didYouMean(entries, "xyzw")).toEqual([]);
  });

  it("trecho longo corta com reticências em volta da palavra", () => {
    const long = "palavra ".repeat(60) + "tesouro escondido " + "fim ".repeat(60);
    const s = snippet(long, ["tesouro"])!;
    expect(s[0].text).toBe("…");
    expect(s[s.length - 1].text).toBe("…");
    expect(s.some((x) => x.hit && x.text === "tesouro")).toBe(true);
  });
});
