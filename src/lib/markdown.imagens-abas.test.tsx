import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { footnotesOf, markdownHeadings, RenderMarkdown } from "./markdown";

const html = (node: ReactNode) => renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>);

describe("imagens e abas no texto (2026-09-29)", () => {
  it("imagem sozinha na linha, com legenda, vira figura que amplia", () => {
    const out = html(<RenderMarkdown text={"Texto.\n![O portão *antigo*](https://x/p.png)\nMais."} />);
    expect(out).toContain('<figure class="md-figure"><button type="button" class="md-figure-zoom" aria-label="Ampliar imagem: O portão antigo">');
    expect(out).toContain('<img src="https://x/p.png" alt="O portão antigo" loading="lazy"/>');
    expect(out).toContain("<figcaption>O portão <em>antigo</em></figcaption>");
  });

  it("imagem sem legenda, ou no meio da frase, continua como era", () => {
    expect(html(<RenderMarkdown text={"![](https://x/p.png)"} />)).toContain('<p><img class="wb-img" src="https://x/p.png"');
    expect(html(<RenderMarkdown text={"Veja ![mapa](https://x/m.png) aqui"} />)).not.toContain("md-figure");
  });

  it("::aba começa abas; ::fim-abas fecha e o texto segue fora", () => {
    const out = html(<RenderMarkdown text={"Antes.\n::aba Infância\nPrimeira.\n::aba Vida *adulta*\n- item\n::fim-abas\nDepois."} />);
    expect(out).toMatch(/<p>Antes\.<\/p><div class="md-tabs"><div class="md-tabs-bar" role="tablist">/);
    expect(out).toContain('aria-selected="true" tabindex="0" class="work-tab on">Infância</button>');
    expect(out).toContain('class="work-tab">Vida <em>adulta</em></button>');
    expect(out).toMatch(/class="md-tab-panel"><p>Primeira\.<\/p><\/div>/);
    expect(out).toMatch(/class="md-tab-panel" hidden=""><ul><li>item<\/li><\/ul><\/div><\/div><p>Depois\.<\/p>/);
    expect(out).not.toContain("::");
  });

  it("sem ::fim-abas, a última aba vai até o fim do texto", () => {
    const out = html(<RenderMarkdown text={"::aba A\num\n::aba B\ndois\ntrês"} />);
    expect(out.match(/role="tabpanel"/g)).toHaveLength(2);
    expect(out).toMatch(/<p>dois<\/p><p>três<\/p><\/div><\/div><\/div>$/);
  });

  it("títulos e notas dentro das abas seguem a numeração do texto inteiro", () => {
    const t = "## Antes ((a))\n::aba A\n### Dentro ((b))\n::aba B\n### Outro\ntexto ((c))\n::fim-abas\n## Fim";
    const hs = markdownHeadings(t, "s-");
    const out = html(<RenderMarkdown text={t} anchorBase="s-" fnPrefix="g-" />);
    hs.forEach((h) => expect(out).toContain('id="' + h.id + '"'));
    expect(footnotesOf(t)).toHaveLength(3);
    ["fnref-g-1", "fnref-g-2", "fnref-g-3"].forEach((id) => expect(out).toContain('id="' + id + '"'));
  });

  it("::aba dentro de bloco de código não vira aba", () => {
    const out = html(<RenderMarkdown text={"```\n::aba X\n```"} />);
    expect(out).not.toContain("md-tabs");
    expect(out).toContain("::aba X");
  });
});
