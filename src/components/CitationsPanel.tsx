import { SpoilerBlock } from "../lib/markdown";
import { QuoteAttrLines, quoteAttrKids, quoteNorm, QuoteBody } from "../lib/quotes";
import type { WikiCitation, QuoteRole } from "../types";

const GROUPS: [QuoteRole, (title: string) => string][] = [
  ["fala", () => "Falas"],
  ["dialogo", () => "Diálogos"],
  ["trecho", () => "Trechos"],
  ["narracao", () => "Narrações"],
  ["para", (title) => `Ditas a ${title}`],
  ["sobre", (title) => `Sobre ${title}`],
];

/** Porta de buildCitacoesPanel: citações agrupadas pelo papel desta página nelas. */
export function CitationsPanel({ citacoes, title }: { citacoes: WikiCitation[]; title: string }) {
  const normalized = citacoes.map((q) => quoteNorm(q, title)!).filter(Boolean);
  return (
    <div className="article">
      {GROUPS.map(([role, label]) => {
        const items = normalized.filter((q) => (q.role || "fala") === role);
        if (!items.length) return null;
        return (
          <div key={role}>
            <div className="gal-grouphead">{label(title)}</div>
            <div className="cit-list">
              {items.map((q, i) => {
                const omit = role === "fala" || role === "trecho";
                const hasMeta = quoteAttrKids(q, omit).length > 0 || !!q.note;
                const body = <QuoteBody q={q} />;
                return (
                  <div key={i} className={"cit-item" + (q.kind === "dialogo" ? " is-dialogue" : q.kind === "narracao" ? " is-narr" : "")}>
                    {q.vis === "spoiler" ? <SpoilerBlock>{body}</SpoilerBlock> : body}
                    {hasMeta && (
                      <div className="cit-meta">
                        <QuoteAttrLines q={q} omitSpeaker={omit} extra={q.note ? [q.note] : undefined} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
