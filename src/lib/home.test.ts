import { describe, expect, it } from "vitest";
import { dailyHighlights, filterEntries, recentEntries, snippetFor, wikiNumbers, type HomeEntry } from "./home";

const NOW = Date.parse("2026-09-24T15:00:00Z"); // 24/09 em Brasília
const e = (id: string, extra: Partial<HomeEntry> = {}): HomeEntry => ({ id, title: id.toUpperCase(), type: "Personagem", ...extra });

describe("destaques do dia", () => {
  it("página publicada hoje não entra nos sorteios (mas entra nas Novidades)", () => {
    const entries = [e("nova", { firstPublishedAt: "2026-09-24", updatedAt: "2026-09-24" })];
    const d = dailyHighlights(entries, NOW);
    expect(d.char).toBeNull();
    expect(d.charEmptyMsg).toBe("Ainda sem personagens publicados.");
    expect(recentEntries(entries)[0].id).toBe("nova");
  });

  it("aniversariante de hoje tem prioridade no Personagem do dia", () => {
    const d = dailyHighlights([e("a"), e("b"), e("festa", { birthdayMD: "09-24", type: "Lupino" })], NOW);
    expect(d.char?.id).toBe("festa");
    expect(d.isBirthday).toBe(true);
  });

  it("quem está na própria janela de aniversário fica fora do sorteio normal", () => {
    const d = dailyHighlights([e("setembro", { birthdayMD: "09-02" })], NOW);
    expect(d.char).toBeNull();
    expect(d.charEmptyMsg).toMatch(/próprio mês de aniversário/);
  });

  it("Entrada do dia nunca é Personagem nem Lupino", () => {
    const d = dailyHighlights([e("p"), e("l", { type: "Lupino" }), e("lugar", { type: "Local" })], NOW);
    expect(d.entrada?.id).toBe("lugar");
  });

  it("citação repetida em várias páginas conta uma vez; daily:false fica fora", () => {
    const q = { id: "q1", kind: "fala" as const, text: "oi" };
    const d = dailyHighlights(
      [e("a", { citacoes: [q, { id: "q2", kind: "fala", text: "não", daily: false }] }), e("b", { citacoes: [q] })],
      NOW,
    );
    expect(d.quote?.id).toBe("q1");
  });

  it("Ano em foco: um evento por família, em ordem de data", () => {
    const d = dailyHighlights(
      [
        e("a", { events: [{ familyId: "f1", label: "Pacto", y: 2016, m: 3, major: true }] }),
        e("b", { events: [{ familyId: "f1", label: "Pacto (cópia)", y: 2016, m: 3, major: true }, { familyId: "f2", label: "Antes", y: 2016, m: 1, major: true }] }),
        e("c", { events: [{ familyId: "f3", label: "Menor", y: 2016, major: false }] }),
      ],
      NOW,
    );
    expect(d.year).toBe(2016);
    expect(d.yearEvents.map((ev) => ev.familyId)).toEqual(["f2", "f1"]);
  });
});

describe("busca e filtros", () => {
  const list = [
    e("alucard", { tags: ["renegado"], search: "Herdeiro caído marcado pelo pacto de sangue." }),
    e("ordem", { type: "Facção", posts: [{ id: "p", title: "Édito da Ordem" }] }),
  ];
  it("busca no título, tipo, tags, título das notas e no texto", () => {
    expect(filterEntries(list, "RENEGADO", null, null).map((x) => x.id)).toEqual(["alucard"]);
    expect(filterEntries(list, "édito", null, null).map((x) => x.id)).toEqual(["ordem"]);
    expect(filterEntries(list, "facção", null, null).map((x) => x.id)).toEqual(["ordem"]);
    expect(filterEntries(list, "pacto", null, null).map((x) => x.id)).toEqual(["alucard"]);
  });
  it("filtro por tipo e por tag", () => {
    expect(filterEntries(list, "", "Facção", null).map((x) => x.id)).toEqual(["ordem"]);
    expect(filterEntries(list, "", null, "renegado").map((x) => x.id)).toEqual(["alucard"]);
  });
  it("trecho ao redor da palavra achada no texto", () => {
    expect(snippetFor(list[0], "pacto")).toBe("Herdeiro caído marcado pelo pacto de sangue.");
    const long = e("x", { search: "a".repeat(60) + " pacto " + "b".repeat(60) });
    expect(snippetFor(long, "pacto")).toBe("…" + "a".repeat(39) + " pacto " + "b".repeat(39) + "…");
  });
});

describe("a wiki em números", () => {
  it("soma, esconde o que é zero e acha as tags mais usadas", () => {
    const n = wikiNumbers([e("a", { wordCount: 1000, tags: ["x", "y"] }), e("b", { wordCount: 43, tags: ["y"] })]);
    expect(n.nums).toEqual([
      [2, "Página", "Páginas"],
      [1043, "Palavra", "Palavras"],
    ]);
    expect(n.topTags).toEqual(["y", "x"]);
  });
});
