import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { footnotesOf, markdownHeadings, mdInline, RenderMarkdown } from "./markdown";
import { ArticleBundle } from "../components/ArticleBundle";

const html = (node: ReactNode) => renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>);

describe("ferramentas de texto (2026-09-29)", () => {
  it("título com {-} fica fora do índice e a marca não aparece", () => {
    const hs = markdownHeadings("## Infância\ntexto\n### Detalhe {-}\n### Fuga", "s-");
    expect(hs.map((h) => h.text + ":" + h.toc)).toEqual(["Infância:true", "Detalhe:false", "Fuga:true"]);
    const out = html(<RenderMarkdown text={"### Detalhe {-}"} anchorBase="s-" />);
    expect(out).not.toContain("{-}");
    expect(out).toContain('id="' + markdownHeadings("### Detalhe {-}", "s-")[0].id + '"');
  });

  it("citação com quem disse: linhas > juntas, a última com — vira o rodapé", () => {
    const out = html(<RenderMarkdown text={"> Seja corajoso.\n> Não olhe pra trás.\n> — [Shmi](wiki:shmi)"} />);
    expect(out).toContain('<blockquote class="md-quote"><p>Seja corajoso. Não olhe pra trás.</p><footer class="md-quote-by">— <a class="wl-live" href="/wiki/shmi"');
    // citação de uma linha, sem autor, continua igual
    expect(html(<RenderMarkdown text={"> só isso"} />)).toContain("<blockquote>só isso</blockquote>");
  });

  it("::principal e ::ver viram a linha que manda pra outra página", () => {
    const out = html(<RenderMarkdown text={"::principal [Revolta](wiki:revolta)\n::ver [A](wiki:a), [B](wiki:b)"} />);
    expect(out).toContain('<p class="md-hatnote">Artigo principal: <a class="wl-live" href="/wiki/revolta"');
    expect(out).toContain('<p class="md-hatnote">Ver também: ');
  });

  it("notas de rodapé: numeradas na ordem, com link dentro, e as de dentro do spoiler ficam marcadas", () => {
    const t = "Nasceu ((fonte: [Sessão 3](wiki:pg#sessao-x))) e ||morreu ((na sessão final))||.";
    expect(footnotesOf(t)).toEqual([{ text: "fonte: [Sessão 3](wiki:pg#sessao-x)", at: undefined }, { text: "na sessão final", at: true }]);
    const out = html(<RenderMarkdown text={t} fnPrefix="g-" fnStart={2} />);
    expect(out).toContain('<sup class="md-fn" id="fnref-g-3"><a href="#fn-g-3" aria-label="nota 3">[3]</a></sup>');
    expect(out).toContain('id="fnref-g-4"');
    // fora de um texto com lista (ficha), a nota fica ali mesmo entre parênteses
    expect(html(<>{mdInline("x ((y))")}</>)).toContain('<span class="md-fn-inline"> (y)</span>');
  });

  it("aba com notas: lista no fim, contando pelos blocos, e subtítulos no índice", () => {
    const out = html(
      <ArticleBundle
        anchorPrefix="geral-"
        bundle={{
          body: "Intro ((a)).",
          fields: [],
          sections: [
            { title: "Vida", body: "## Infância\nx ((b))\n### Detalhe\ny\n## Oculto {-}", vis: "publico" },
            { title: "Morte", body: "fim ||((c))||", vis: "publico" },
          ],
        } as never}
      />,
    );
    expect(out).toContain('<span class="toc-num">1.1</span>Infância');
    expect(out).toContain('<span class="toc-num">1.1.1</span>Detalhe');
    expect(out).not.toContain('toc-num">1.2<');
    expect(out).toContain('id="fn-geral-1"');
    expect(out).toContain('id="fn-geral-3"');
    expect(out).toMatch(/<li id="fn-geral-3"><span class="md-spoiler"/);
  });
});
