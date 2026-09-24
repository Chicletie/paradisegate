import { Fragment } from "react";
import { SpoilerBlock } from "../lib/markdown";
import { quoteAttrKids, quoteNorm, QuoteBody } from "../lib/quotes";
import type { WikiCitation, QuoteRole } from "../types";

const GROUPS: [QuoteRole, (title: string) => string][] = [
  ["fala", () => "Falas"],
  ["dialogo", () => "Diálogos"],
  ["trecho", () => "Trechos"],
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
                const meta = quoteAttrKids(q, role === "fala" || role === "trecho");
                if (q.note) {
                  if (meta.length) meta.push(" · ");
                  meta.push(q.note);
                }
                const body = <QuoteBody q={q} />;
                return (
                  <div key={i} className={"cit-item" + (q.kind === "dialogo" ? " is-dialogue" : "")}>
                    {q.vis === "spoiler" ? <SpoilerBlock>{body}</SpoilerBlock> : body}
                    {meta.length > 0 && (
                      <div className="cit-meta">
                        {"— "}
                        {meta.map((m, mi) => (
                          <Fragment key={mi}>{m}</Fragment>
                        ))}
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
