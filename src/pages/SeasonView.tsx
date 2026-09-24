import { pgShortDate } from "../lib/format";
import { RenderMarkdown, SpoilerBlock } from "../lib/markdown";
import { MySuggestionsHere, RestritoSlot, SuggestButtons, useMineToggle, useRestrito } from "../components/EntryActions";
import type { WikiSeasonDoc } from "../types";
import { Fragment } from "react";
import { RestritoBlocks, RestritoPlaceProvider } from "../components/RestritoPlace";
import { countIn, placeRestrito } from "../lib/restritoPlace";

/** Recaps de sessão de uma temporada de campanha — porta de renderSeason da wiki
 * original. Mesma casca da entrada; o conteúdo é uma lista de sessões em vez de campos. */
export function SeasonView({ data, wikiId }: { data: WikiSeasonDoc; wikiId: string }) {
  const restrito = useRestrito(wikiId);
  const place = placeRestrito(restrito, data.restritoSlots);
  const nSessR = countIn(place, "sessoes");
  const [mine, toggleMine] = useMineToggle();
  const sessions = data.sessions || [];
  const factRows: [string, string][] = [];
  if (data.system) factRows.push(["Sistema", data.system]);
  if (data.status) factRows.push(["Status", data.status]);
  factRows.push(["Sessões", String(data.sessionCount ?? sessions.length)]);
  if (data.cast?.length) factRows.push(["Elenco", data.cast.join(", ")]);

  return (
    <RestritoPlaceProvider value={place}>
    <article className="card">
      <h1>{data.title || "(sem título)"}</h1>
      <div className="pg-entry-meta">
        <span className="pg-entry-type">
          {"Temporada" + (data.publishedAt ? ` · atualizado em ${pgShortDate(data.publishedAt)}` : "")}
        </span>
        {/* Sem Favoritar aqui: o original só põe a estrela nas entradas. */}
        <div className="pg-entry-actions">
          <SuggestButtons wikiId={wikiId} pageTitle={data.title} tab="" onToggleMine={toggleMine} />
        </div>
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

      {sessions.length === 0 && nSessR === 0 ? (
        <div className="empty">Nenhum recap público ainda.</div>
      ) : (
        <>
        {sessions.map((sx, i) => (
          <Fragment key={i}>
          <RestritoBlocks area="sessoes" index={i} />
          <div>
            <h2 className="cathead" id={`s${i}`}>
              {(sx.title || `Sessão ${i + 1}`) + (sx.date ? ` · ${sx.date}` : "")}
            </h2>
            {sx.vis === "spoiler" ? (
              <SpoilerBlock>
                <RenderMarkdown text={sx.recap} />
              </SpoilerBlock>
            ) : (
              <RenderMarkdown text={sx.recap} />
            )}
          </div>
          </Fragment>
        ))}
        <RestritoBlocks area="sessoes" index={sessions.length} />
        </>
      )}
      <RestritoSlot items={restrito} />
      <MySuggestionsHere wikiId={wikiId} open={mine} />
    </article>
    </RestritoPlaceProvider>
  );
}
