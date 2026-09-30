import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { anchorWords, makeAnchorNamer } from "./anchors";
import { ArticleBundle } from "../components/ArticleBundle";

describe("âncoras legíveis (2026-09-30)", () => {
  it("tira acento e símbolos, sem cortar palavra no meio", () => {
    expect(anchorWords("História")).toBe("historia");
    expect(anchorWords("Terceiro Casamento e os Três Destinos!")).toBe("terceiro-casamento-e-os-tres-destinos");
    const long = anchorWords("Uma frase muito comprida que passa bastante das sessenta letras do limite");
    expect(long.length).toBeLessThanOrEqual(60);
    expect(long.endsWith("-")).toBe(false);
    expect("Uma frase muito comprida que passa bastante das sessenta letras do limite".toLowerCase().replace(/ /g, "-").startsWith(long)).toBe(true);
  });

  it("repetido ganha -2, e nome fixo da página não é tomado", () => {
    const name = makeAnchorNamer(["relacoes"]);
    expect([name("Passado"), name("Passado"), name("Relações"), name("")]).toEqual(["passado", "passado-2", "relacoes-2", "secao"]);
  });

  it("índice e títulos usam o nome legível; o endereço antigo fica em data-old-id", () => {
    const out = renderToStaticMarkup(
      <MemoryRouter>
        <ArticleBundle
          bundle={{ fields: [{ key: "História", value: "## Passado\n### Terceiro casamento\ntexto", type: "nota" }], sections: [{ title: "Passado", body: "x" }] } as never}
          anchorPrefix="geral-"
          extraToc={[{ id: "relacoes", label: "Relações" }]}
        />
      </MemoryRouter>,
    );
    expect(out).toContain('href="#historia"');
    expect(out).toContain('href="#terceiro-casamento"');
    expect(out).toContain('id="terceiro-casamento" data-old-id="sec-geral-lf0-hist-ria-h1-terceiro-casamento"');
    expect(out).toContain('id="historia" data-old-id="sec-geral-lf0-hist-ria"');
    // a seção "Passado" vem depois do subtítulo "Passado": fica com -2
    expect(out).toContain('id="passado-2"');
  });

  it("aba própria leva o nome dela na frente", () => {
    const out = renderToStaticMarkup(
      <MemoryRouter>
        <ArticleBundle bundle={{ sections: [{ title: "Origem", body: "## A\n## B" }] } as never} anchorPrefix="v0-" idPrefix="disfarce-" />
      </MemoryRouter>,
    );
    expect(out).toContain('id="disfarce-origem"');
    expect(out).toContain('id="disfarce-a"');
  });
});
