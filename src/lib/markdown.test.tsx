import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { fieldValue, mdInline, RenderMarkdown, SpoilerBlock } from "./markdown";
import { AliasLine } from "../components/Infobox";
import { EntryView } from "../pages/EntryView";

const html = (node: ReactNode) => renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>);

describe("markdown da casa (docs/formato-wiki.md)", () => {
  it("[texto](wiki:<id>) é link interno, mesma aba, classe wl-live", () => {
    expect(html(<>{mdInline("ver [Luke](wiki:luke-whitefang)")}</>)).toBe(
      'ver <a class="wl-live" href="/wiki/luke-whitefang" data-discover="true">Luke</a>',
    );
  });

  it("link externo continua abrindo em outra aba", () => {
    expect(html(<>{mdInline("[arquivo](https://example.com)")}</>)).toContain('target="_blank"');
  });

  it("||trecho|| é lido como markdown por dentro (link dentro da tarja)", () => {
    const out = html(<>{mdInline("||selado por [Cassian](wiki:cassian)||")}</>);
    expect(out).toMatch(/^<span class="md-spoiler"[^>]*>selado por <a class="wl-live" href="\/wiki\/cassian"/);
  });

  it("||...|| aceita [[Nome]] dentro", () => {
    expect(html(<>{mdInline("||por [[Mia|a loba]]||")}</>)).toContain('<span class="wl-plain">a loba</span>');
  });

  it("[[Nome|texto]] vira nome sem link", () => {
    expect(html(<>{mdInline("[[Mia Bloodyfur|Mia]]")}</>)).toBe('<span class="wl-plain">Mia</span>');
  });

  it("nada de 🙈 no botão de spoiler", () => {
    const out = html(<SpoilerBlock>x</SpoilerBlock>);
    expect(out).toContain("spoiler, toque para revelar");
    expect(out).not.toContain("🙈");
  });

  it("título de markdown e listas continuam elementos de verdade", () => {
    const out = html(<RenderMarkdown text={"## Infância\n1. Um\n2. Dois"} />);
    expect(out).toBe('<div class="prose"><h4>Infância</h4><ol><li>Um</li><li>Dois</li></ol></div>');
  });
});

describe("fieldValue (campo curto da infobox)", () => {
  it("uma linha: texto corrido", () => {
    expect(html(<>{fieldValue("27 anos")}</>)).toBe("27 anos");
  });

  it("várias linhas: uma por linha com •, sem itálico, ignorando vazias", () => {
    expect(html(<>{fieldValue("Paradise Gate\n\n  Ordem de Vel  ")}</>)).toBe(
      '<div class="infobox-alias-line infobox-line">• Paradise Gate</div>' +
        '<div class="infobox-alias-line infobox-line">• Ordem de Vel</div>',
    );
  });
});

describe("Alcunhas", () => {
  it("anotação só com o 'antes': sem espaço antes do ')'", () => {
    const out = html(<AliasLine alias={{ text: "O Lobo Cinzento", note: { before: "como agente da PG" } }} />);
    expect(out).toContain("(como agente da PG)");
  });

  it("antes + link + depois: um espaço entre os pedaços", () => {
    const out = html(
      <AliasLine alias={{ text: "Alu", note: { before: "por", link: "Mia", linkWikiId: "mia", after: "na infância" } }} />,
    );
    expect(out.replace(/<[^>]+>/g, "")).toBe("• Alu (por Mia na infância)");
  });
});

describe("índice da entrada", () => {
  it("lista numerada com Posts, Relações e Afinidades, na ordem do original", () => {
    const out = html(
      <EntryView
        data={{
          title: "X",
          fields: [
            { key: "História", type: "nota", value: "a" },
            { key: "Origem", type: "nota", value: "b" },
          ],
          posts: [{ body: "p" }],
          links: [{ label: "pratica", targetId: "y", targetTitle: "Y" }],
        }}
      />,
    );
    const toc = out.match(/<div class="toc">.*?<\/ol>/)?.[0] ?? "";
    expect(toc).toContain("<ol>");
    expect(toc.replace(/<[^>]+>/g, "|").split("|").filter(Boolean)).toEqual([
      "Índice",
      "História",
      "Origem",
      "Posts",
      "Relações",
      "Afinidades",
    ]);
  });
});
