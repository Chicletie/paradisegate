import { Fragment } from "react";
import { mdInline, RenderMarkdown, SpoilerBlock } from "../lib/markdown";
import { QuoteEpigraph } from "../lib/quotes";
import type { WikiArticleBundle, WikiCitation } from "../types";
import { SwapBody } from "./EntryActions";

function slugifyAnchor(s: string | undefined, i: string): string {
  return (
    "sec-" +
    i +
    "-" +
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 30)
  );
}

/**
 * Porta de buildArticle em wiki-core.js (arvore) — usado tanto pra "Geral" quanto pra cada
 * variante de obra (mesma forma de dado, cada uma vira uma aba). A epígrafe (citação em
 * destaque da entrada) abre toda aba de texto, igual ao original.
 */
export function ArticleBundle({
  bundle,
  anchorPrefix,
  epigraph,
  extraToc = [],
}: {
  bundle: WikiArticleBundle;
  anchorPrefix: string;
  epigraph?: WikiCitation | null;
  extraToc?: { id: string; label: string }[];
}) {
  const longFields = (bundle.fields || []).filter((f) => f.type === "nota");
  const sections = bundle.sections || [];
  const tocEntries = [
    ...longFields.map((f, i) => ({ id: slugifyAnchor(f.key, anchorPrefix + "lf" + i), label: f.key })),
    ...sections.map((s, i) => ({ id: slugifyAnchor(s.title || "Seção", anchorPrefix + "sc" + i), label: s.title || "Seção" })),
    ...extraToc,
  ];

  return (
    <div className="article">
      {epigraph && <QuoteEpigraph q={epigraph} />}
      {bundle.summary && <p className="summary">{mdInline(bundle.summary)}</p>}
      {bundle.body && <RenderMarkdown text={bundle.body} />}
      {tocEntries.length > 1 && (
        <div className="toc">
          <div className="toc-head">Índice</div>
          <ol>
            {tocEntries.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  onClick={() => {
                    // Seção recolhida reabre antes de rolar até ela (senão só aparece o título).
                    const target = document.getElementById(t.id);
                    if (target instanceof HTMLDetailsElement) target.open = true;
                  }}
                >
                  {t.label}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
      {longFields.map((f, i) => {
        const id = slugifyAnchor(f.key, anchorPrefix + "lf" + i);
        return (
          <Fragment key={id}>
            <h2 className="cathead" id={id}>
              {f.key}
            </h2>
            {/* Troca confidencial só na aba Geral: variantes de obra não têm versão confidencial. */}
            <SwapBody slot={anchorPrefix === "geral-" ? "lf:" + i : undefined} fieldKey={f.key}>
              {f.vis === "spoiler" ? (
                <SpoilerBlock>
                  <RenderMarkdown text={f.value} />
                </SpoilerBlock>
              ) : (
                <RenderMarkdown text={f.value} />
              )}
            </SwapBody>
          </Fragment>
        );
      })}
      {sections.map((s, i) => {
        const id = slugifyAnchor(s.title || "Seção", anchorPrefix + "sc" + i);
        return (
          <details key={id} className="wiki-section" id={id} open>
            <summary className="cathead">
              {s.title || "Seção"}
            </summary>
            {s.vis === "spoiler" ? (
              <SpoilerBlock>
                <RenderMarkdown text={s.body} />
              </SpoilerBlock>
            ) : (
              <RenderMarkdown text={s.body} />
            )}
          </details>
        );
      })}
    </div>
  );
}
