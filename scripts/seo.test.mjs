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

describe("escritos na prévia de link", () => {
  it("cada escrito com página própria uma vez; spoiler sem trecho", async () => {
    const { writingsOf, describeWriting } = await import("./seo.mjs");
    const w1 = { id: "w1", page: "escrito-w1", title: "O farol", vis: "publico", excerpt: "Subiu o **farol**." };
    const w2 = { id: "w2", page: "escrito-w2", title: "Segredo", vis: "spoiler" };
    const list = writingsOf({ a: { escritos: [w1, w2] }, b: { escritos: [w1, { id: "w3", page: null, title: "sem página", vis: "publico" }] } });
    expect(list.map((w) => w.id)).toEqual(["w1", "w2"]);
    expect(describeWriting(w1)).toBe("Subiu o farol.");
    expect(describeWriting(w2)).toBe("Um escrito de Paradise Gate.");
  });
});

describe("perfil público na prévia de link", () => {
  it("junta citados e intérpretes, uma vez cada, só @ válido", async () => {
    const { membersOf } = await import("./seo.mjs");
    const list = membersOf({
      a: { membros: ["bia", "x", "Maiuscula"], interpretes: [{ membro: "caio" }, { membro: "bia" }] },
      b: { membros: ["bia"], interpretes: [null, { membro: "../hack" }] },
    });
    expect(list).toEqual(["bia", "caio"]);
  });
  it("título com apelido, bio limpa e foto só se for endereço https", async () => {
    const { describeMember } = await import("./seo.mjs");
    const m = describeMember("bia", { nickname: "Bia", bio: "Joga **Anytsa** ||segredo||", photo: "https://x/y.png" });
    expect(m.title).toBe("Bia (@bia) · Paradise Gate");
    expect(m.description).not.toContain("segredo");
    expect(m.image).toBe("https://x/y.png");
    const n = describeMember("caio", { photo: "data:image/png;base64,xx" });
    expect(n.title).toBe("@caio · Paradise Gate");
    expect(n.description).toBe("Perfil de @caio no acervo de Paradise Gate.");
    expect(n.image).toBeNull();
  });
  it("foto embutida no cartão vira arquivo com endereço que muda junto com a foto", async () => {
    const { memberPhotoFile } = await import("./seo.mjs");
    const png = "data:image/png;base64," + Buffer.from("foto-um").toString("base64");
    const f = memberPhotoFile("caio", png);
    expect(f.rel).toMatch(/^perfil\/caio-[0-9a-z]+\.png$/);
    expect(f.bytes.toString()).toBe("foto-um");
    const g = memberPhotoFile("caio", "data:image/jpeg;base64," + Buffer.from("foto-dois").toString("base64"));
    expect(g.rel).toMatch(/\.jpg$/);
    expect(g.rel).not.toBe(f.rel.replace(".png", ".jpg"));
    expect(memberPhotoFile("caio", "https://x/y.png")).toBeNull();
    expect(memberPhotoFile("caio", "data:image/svg+xml;base64,PHN2Zz4=")).toBeNull();
    expect(memberPhotoFile("caio", undefined)).toBeNull();
  });
});
