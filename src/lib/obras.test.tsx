import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { chapterWord, estreiaText, groupAparicoes, totalText } from "./obras";
import { AparicoesSection } from "../components/Aparicoes";
import { SeasonView } from "../pages/SeasonView";
import { ObraView } from "../pages/ObraView";
import type { WikiAparicao, WikiObraDoc, WikiSeasonDoc } from "../types";

const html = (node: ReactNode) => renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>).replace(/ data-discover="true"/g, "");

const livro: WikiAparicao[] = [
  { obra: "Crônicas", obraId: "cronicas", tipo: "Romance", palavra: "capítulo", temporada: "Livro 1", temporadaId: "cronicas-livro-1", estreia: { titulo: "Chegada", n: 2, ancora: "sessao-c2" }, total: 3 },
  { obra: "Crônicas", obraId: "cronicas", tipo: "Romance", palavra: "capítulo", temporada: "Livro 2", temporadaId: null, estreia: { titulo: "", n: 1 }, total: 1, at: "l2" },
  { obra: "Um conto", tipo: "Conto", palavra: "capítulo", nota: "citado de passagem" },
];

describe("obras: textos", () => {
  it("sessão numa campanha, capítulo no resto (sem palavra = sessão, como as páginas antigas)", () => {
    expect(chapterWord(undefined)).toBe("sessão");
    expect(chapterWord("sessão", true)).toBe("sessões");
    expect(chapterWord("capítulo", true)).toBe("capítulos");
  });
  it("estreia e contagem", () => {
    expect(estreiaText(livro[0])).toBe("estreia: capítulo 2 (Chegada)");
    expect(estreiaText(livro[1])).toBe("estreia: capítulo 1");
    expect(totalText(livro[0])).toBe("3 capítulos");
    expect(totalText(livro[1])).toBe("1 capítulo");
    expect(totalText(livro[2])).toBe("");
  });
  it("agrupa por obra na ordem que veio", () => {
    expect(groupAparicoes(livro).map((g) => [g.obra, g.items.length])).toEqual([["Crônicas", 2], ["Um conto", 1]]);
  });
});

describe("Aparições na página", () => {
  it("links pra obra, temporada e estreia só quando estão no ar; temporada depois da primeira atrás da tarja", () => {
    const out = html(<AparicoesSection aparicoes={livro} />);
    expect(out).toContain('<h2 class="cathead" id="aparicoes">Aparições</h2>');
    expect(out).toContain('<a href="/wiki/cronicas">Crônicas</a>');
    expect(out).toContain('<a href="/wiki/cronicas-livro-1">Livro 1</a> — <a href="/wiki/cronicas-livro-1#sessao-c2">estreia: capítulo 2 (Chegada)</a>');
    expect(out).toContain('<span class="aparicoes-meta"> · 3 capítulos</span>');
    // Livro 2 é spoiler: não aparece o nome, só a tarja
    expect(out).not.toContain("Livro 2");
    expect(out).toContain('class="md-spoiler"');
    // obra sem página: só o nome; aparição à mão com nota
    expect(out).toContain('<span class="aparicoes-obra">Um conto</span>');
    expect(out).toContain("A obra toda<span class=\"aparicoes-meta\"> · citado de passagem</span>");
  });
  it("sem aparições, nada", () => {
    expect(html(<AparicoesSection aparicoes={[]} />)).toBe("");
  });
});

describe("temporada de obra de texto", () => {
  const season: WikiSeasonDoc = {
    kind: "temporada",
    title: "Crônicas · Livro 1",
    obra: { name: "Crônicas", id: "cronicas" },
    tipo: "Romance",
    palavra: "capítulo",
    sessions: [
      { id: "c1", title: "", recap: "Resumo um." },
      { id: "c2", title: "Chegada", recap: "Resumo dois.", escrito: { titulo: "A chegada", id: "w9" } },
    ],
  };
  it("chama de capítulo, leva de volta pra obra e liga o escrito", () => {
    const out = html(<SeasonView data={season} wikiId="cronicas-livro-1" />);
    expect(out).toContain('<div class="crumb"><a href="/wiki/cronicas">Crônicas</a></div>');
    expect(out).toContain("<th>Capítulos</th><td>2</td>");
    expect(out).toContain(">Capítulo 1</h2>");
    expect(out).toContain('<a href="/wiki/_escritos/w9">Ler o capítulo inteiro: A chegada</a>');
  });
  it("página antiga de campanha continua igual (Sessões, Sessão n, sem link da obra)", () => {
    const out = html(<SeasonView data={{ kind: "temporada", title: "Genesis · T1", sessions: [{ recap: "x" }] }} wikiId="g" />);
    expect(out).toContain("<th>Sessões</th><td>1</td>");
    expect(out).toContain(">Sessão 1</h2>");
    expect(out).not.toContain('class="crumb"');
  });
});

describe("página da obra", () => {
  it("sinopse, temporadas com link só pras que estão no ar, elenco com spoiler", () => {
    const obra: WikiObraDoc = {
      kind: "obra",
      title: "Crônicas",
      tipo: "Romance",
      status: "Ativa",
      synopsis: "Do que trata.",
      palavra: "capítulo",
      temporadas: [
        { name: "Livro 1", id: "cronicas-livro-1", status: "Encerrada", total: 12 },
        { name: "Livro 2", id: null, status: "Ativa", total: 1 },
      ],
      elenco: [{ name: "Pandora", id: "pandora" }, { name: "Dementor", id: "dem", at: "l2" }],
    };
    const out = html(<ObraView data={obra} wikiId="cronicas" />);
    expect(out).toContain("<th>Tipo</th><td>Romance</td>");
    expect(out).toContain('<a href="/wiki/cronicas-livro-1">Livro 1</a><span class="obra-temporada-meta">Encerrada · 12 capítulos</span>');
    expect(out).toContain('<span>Livro 2</span><span class="obra-temporada-meta">Ativa · 1 capítulo</span>');
    expect(out).toContain('<a href="/wiki/pandora">Pandora</a>');
    expect(out).not.toContain("Dementor");
  });
});
