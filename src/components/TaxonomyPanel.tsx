import { fieldValue, RenderMarkdown, SpoilerBlock } from "../lib/markdown";
import type { WikiField } from "../types";

/**
 * Porta de buildTaxonomyPanel em wiki-core.js (arvore) — só pro tipo Criatura: fatos curtos
 * viram tabela (mesmo clima da infobox), campos longos viram blocos de prosa com cathead.
 */
export function TaxonomyPanel({ taxonomy }: { taxonomy: WikiField[] }) {
  const short = taxonomy.filter((f) => f.type !== "nota");
  const long = taxonomy.filter((f) => f.type === "nota");
  return (
    <div className="article">
      {short.length > 0 && (
        <table className="infobox-facts">
          <tbody>
            {short.map((f, i) =>
              f.type === "cabecalho" ? (
                <tr key={i} className="infobox-header-row">
                  <th colSpan={2}>{f.key}</th>
                </tr>
              ) : (
                <tr key={i}>
                  <th>
                    {f.key}
                  </th>
                  <td>
                    {f.vis === "spoiler" ? (
                      <SpoilerBlock>
                        <span>{fieldValue(f.value)}</span>
                      </SpoilerBlock>
                    ) : (
                      fieldValue(f.value)
                    )}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}
      {long.map((f, i) => (
        <div key={i}>
          <h2 className="cathead">
            {f.key}
          </h2>
          {f.vis === "spoiler" ? (
            <SpoilerBlock>
              <RenderMarkdown text={f.value} />
            </SpoilerBlock>
          ) : (
            <RenderMarkdown text={f.value} />
          )}
        </div>
      ))}
    </div>
  );
}
