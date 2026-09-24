import { describe, expect, it } from "vitest";
import { FICHA_INCOMPLETA, cleanText, clip, describeEntry, fromFirestore, headTags, injectHead, mergeEntries, safeSlug, sitemap } from "./seo.mjs";

describe("cleanText", () => {
  it("tira o spoiler inteiro, inclusive com link dentro", () => {
    expect(cleanText("A Força (||O Diabo||) e ||Pai: [[Hades|o deus]]|| fim")).toBe("A Força ( ) e fim");
  });
  it("links viram só o texto", () => {
    expect(cleanText("mãe: [[Daphne Dolphin]], [a](wiki:x) e [[Hades|o deus]]")).toBe("mãe: Daphne Dolphin, a e o deus");
  });
  it("tira ênfase, código, imagem e [TBA]", () => {
    expect(cleanText("**forte** *leve* ~~não~~ `x` ![](u) [TBA]")).toBe("forte leve não x");
  });
});

describe("clip e describeEntry", () => {
  it("corta sem partir palavra", () => {
    const s = clip("palavra ".repeat(40).trim(), 50);
    expect(s.length).toBeLessThanOrEqual(50);
    expect(s.endsWith("palavra…")).toBe(true);
  });
  it("sem trecho (ou só spoiler), usa a ficha incompleta", () => {
    expect(describeEntry({ type: "Personagem" })).toBe(FICHA_INCOMPLETA);
    expect(describeEntry({ excerpt: "||tudo spoiler||" })).toBe(FICHA_INCOMPLETA);
    expect(describeEntry({ excerpt: "Filha caçula dos Hagan." })).toBe("Filha caçula dos Hagan.");
  });
});

describe("dados do Firestore", () => {
  it("converte o JSON da API REST", () => {
    expect(fromFirestore({ mapValue: { fields: { a: { stringValue: "x" }, n: { integerValue: "3" }, l: { arrayValue: { values: [{ booleanValue: true }] } }, z: { nullValue: null } } } }))
      .toEqual({ a: "x", n: 3, l: [true], z: null });
  });
  it("junta as partes do índice pelo updatedAt mais novo", () => {
    const m = mergeEntries([{ a: { t: 1, updatedAt: "2026-01-01" } }, { a: { t: 2, updatedAt: "2026-02-01" }, b: { t: 3 } }]);
    expect(m.a.t).toBe(2);
    expect(m.b.t).toBe(3);
  });
});

describe("html", () => {
  it("escapa e monta a prévia com imagem", () => {
    const t = headTags({ title: 'A "B" <c>', description: "d & e", path: "/wiki/x", image: "https://i/y.jpg" });
    expect(t).toContain('content="A &quot;B&quot; &lt;c&gt;"');
    expect(t).toContain('content="d &amp; e"');
    expect(t).toContain("summary_large_image");
    expect(t).toContain('href="https://paradisegate.com.br/wiki/x"');
  });
  it("troca o título e insere antes do </head>", () => {
    const h = injectHead("<html><head><title>Paradise Gate</title></head><body></body></html>", "X & Y", "<meta a>");
    expect(h).toBe("<html><head><title>X &amp; Y</title><meta a>\n</head><body></body></html>");
  });
  it("só aceita slug seguro como nome de arquivo", () => {
    expect(safeSlug("alucard-whitefang")).toBe("alucard-whitefang");
    expect(safeSlug("../x")).toBeNull();
    expect(safeSlug("a b")).toBeNull();
  });
  it("sitemap com lastmod", () => {
    expect(sitemap([{ path: "/wiki/a", lastmod: "2026-09-20" }])).toContain("<loc>https://paradisegate.com.br/wiki/a</loc><lastmod>2026-09-20</lastmod>");
  });
});
