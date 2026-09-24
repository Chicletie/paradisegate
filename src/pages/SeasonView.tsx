import { pgShortDate } from "../lib/format";
import { RenderMarkdown, SpoilerBlock, SpoilerFlag } from "../lib/markdown";
import type { WikiSeasonDoc } from "../types";

/** Recaps de sessão de uma temporada de campanha — porta de renderSeason em wiki-core.js
 * (arvore). Mesma casca da entrada; o conteúdo é uma lista de sessões em vez de campos. */
export function SeasonView({ data }: { data: WikiSeasonDoc }) {
  const sessions = data.sessions || [];
  const factRows: [string, string][] = [];
  if (data.system) factRows.push(["Sistema", data.system]);
  if (data.status) factRows.push(["Status", data.status]);
  factRows.push(["Sessões", String(data.sessionCount ?? sessions.length)]);
  if (data.cast?.length) factRows.push(["Elenco", data.cast.join(", ")]);

  return (
    <article className="card">
      <h1>{data.title || "(sem título)"}</h1>
      <div className="pg-entry-meta">
        <span className="pg-entry-type">
          {"Temporada" + (data.publishedAt ? ` · atualizado em ${pgShortDate(data.publishedAt)}` : "")}
        </span>
      </div>

      {factRows.length > 0 && (
        <div className="infobox">
          <table className="infobox-facts">
            <tbody>
              {factRows.map(([label, value]) => (
                <tr key={label}>
                  <th>{label}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="empty">Nenhum recap público ainda.</div>
      ) : (
        sessions.map((sx, i) => (
          <div key={i}>
            <h2 className="cathead" id={`s${i}`}>
              {(sx.title || `Sessão ${i + 1}`) + (sx.date ? ` · ${sx.date}` : "")}
              {sx.vis === "spoiler" && <SpoilerFlag />}
            </h2>
            {sx.vis === "spoiler" ? (
              <SpoilerBlock>
                <RenderMarkdown text={sx.recap} />
              </SpoilerBlock>
            ) : (
              <RenderMarkdown text={sx.recap} />
            )}
          </div>
        ))
      )}
    </article>
  );
}
