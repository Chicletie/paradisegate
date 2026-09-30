import { Link } from "react-router-dom";
import { pgShortDate } from "../lib/format";
import { cap, chapterWord } from "../lib/obras";
import { RenderMarkdown, SpoilerBlock } from "../lib/markdown";
import { MySuggestionsHere, RestritoSlot, SuggestButtons, useMineToggle, useRestrito } from "../components/EntryActions";
import type { WikiSeasonDoc } from "../types";
import { Fragment } from "react";
import { RestritoBlocks, RestritoPlaceProvider } from "../components/RestritoPlace";
import { countIn, placeRestrito } from "../lib/restritoPlace";

/** Uma temporada de obra — porta de renderSeason da wiki original. Mesma casca da entrada; o
 * conteúdo é a lista de sessões (campanha) ou capítulos (livro, série…), cada um com o resumo e,
 * quando o texto inteiro está num escrito publicado, o link pra ele. */
export function SeasonView({ data, wikiId }: { data: WikiSeasonDoc; wikiId: string }) {
  const restrito = useRestrito(wikiId);
  const place = placeRestrito(restrito, data.restritoSlots);
  const nSessR = countIn(place, "sessoes");
  const [mine, toggleMine] = useMineToggle();
  const sessions = data.sessions || [];
  const word = chapterWord(data.palavra);
  const factRows: [string, string][] = [];
  if (data.tipo && data.palavra === "capítulo") factRows.push(["Tipo", data.tipo]);
  if (data.system) factRows.push(["Sistema", data.system]);
  if (data.status) factRows.push(["Status", data.status]);
  factRows.push([cap(chapterWord(data.palavra, true)), String(data.sessionCount ?? sessions.length)]);
  if (data.cast?.length) factRows.push(["Elenco", data.cast.join(", ")]);

  return (
    <RestritoPlaceProvider value={place}>
    <article className="card">
      {data.obra?.id && (
        <div className="crumb">
          <Link to={`/wiki/${encodeURIComponent(data.obra.id)}`}>{data.obra.name}</Link>
        </div>
      )}
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
        <div className="empty">{data.palavra === "capítulo" ? "Nenhum resumo público ainda." : "Nenhum recap público ainda."}</div>
      ) : (
        <>
        {sessions.map((sx, i) => (
          <Fragment key={i}>
          <RestritoBlocks area="sessoes" index={i} />
          <div>
            {/* âncora fixa da sessão (#sessao-<id>, usada no perfil /@nome); #s<n> continua valendo */}
            {sx.id && <span id={`s${i}`} aria-hidden="true" />}
            <h2 className="cathead" id={sx.id ? `sessao-${sx.id}` : `s${i}`}>
              {(sx.title || `${cap(word)} ${i + 1}`) + (sx.date ? ` · ${sx.date}` : "")}
            </h2>
            {sx.vis === "spoiler" ? (
              <SpoilerBlock>
                <RenderMarkdown text={sx.recap} />
              </SpoilerBlock>
            ) : (
              <RenderMarkdown text={sx.recap} />
            )}
            {sx.escrito && (
              <p className="season-escrito">
                <Link to={`/wiki/_escritos/${encodeURIComponent(sx.escrito.id)}`}>{"Ler o " + word + " inteiro: " + sx.escrito.titulo}</Link>
              </p>
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
