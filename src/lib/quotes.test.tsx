import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { CitationsPanel } from "../components/CitationsPanel";
import { QuoteEpigraph } from "./quotes";
import { dailyHighlights, entriesFromIndex } from "./home";
import type { WikiCitation } from "../types";

const html = (node: ReactNode) => renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>);
const narr: WikiCitation = {
  id: "n1", kind: "narracao", role: "narracao", narr: "livro", vis: "publico",
  text: "A névoa subia quando [Anytsa](wiki:anytsa-hagan) chegou.\n\nO cais ficou em silêncio.",
};

describe("narração do mestre", () => {
  it("sai no grupo Narrações, sem aspas, com parágrafos, link e o selo", () => {
    const out = html(<CitationsPanel citacoes={[narr]} title="Daphne" />);
    expect(out).toContain("Narrações");
    expect(out).toContain("narração de livro");
    expect(out).toContain('href="/wiki/anytsa-hagan"');
    expect(out.match(/<p>/g)?.length).toBe(2);
    expect(out).not.toContain("“");
  });
  it("pode ser a epígrafe, com o selo na autoria", () => {
    const out = html(<QuoteEpigraph q={{ ...narr, narr: "mesa", group: "Livro I" }} />);
    expect(out).toContain("is-narr");
    expect(out).toContain("narração de mesa · Livro I");
  });
  it("nunca vai pra Citação do dia", () => {
    const d = dailyHighlights(entriesFromIndex({ a: { title: "A", type: "Local", citacoes: [narr] } }));
    expect(d.quote).toBeNull();
  });
});
