import { Link } from "react-router-dom";
import { pgShortDate } from "../lib/format";
import { RenderMarkdown, RevealSpoiler } from "../lib/markdown";
import { chapterWord } from "../lib/obras";
import { SuggestButtons, MySuggestionsHere, useMineToggle } from "../components/EntryActions";
import { PageObrasProvider, SpoilerProgressBar } from "../components/SpoilerProgress";
import type { WikiObraDoc } from "../types";

/** Página de uma obra (campanha, livro, série…): sinopse, temporadas e elenco. Mesma casca da
 * temporada; cada temporada no ar vira link pra página dela. */
export function ObraView({ data, wikiId }: { data: WikiObraDoc; wikiId: string }) {
  const [mine, toggleMine] = useMineToggle();
  const temporadas = data.temporadas || [];
  const elenco = data.elenco || [];
  const factRows: [string, string][] = [];
  if (data.tipo) factRows.push(["Tipo", data.tipo]);
  if (data.system) factRows.push(["Sistema", data.system]);
  if (data.status) factRows.push(["Status", data.status]);
  if (temporadas.length) factRows.push(["Temporadas", String(temporadas.length)]);

  return (
    <PageObrasProvider obras={data.spoilerObras}>
      <article className="card">
        <h1>{data.title || "(sem título)"}</h1>
        <div className="pg-entry-meta">
          <span className="pg-entry-type">
            {"Obra" + (data.publishedAt ? ` · atualizado em ${pgShortDate(data.publishedAt)}` : "")}
          </span>
          <div className="pg-entry-actions">
            <SuggestButtons wikiId={wikiId} pageTitle={data.title} tab="" onToggleMine={toggleMine} />
          </div>
        </div>

        <SpoilerProgressBar />

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

        {data.synopsis && <RenderMarkdown text={data.synopsis} />}

        {temporadas.length > 0 && (
          <>
            <h2 className="cathead" id="temporadas">
              Temporadas
            </h2>
            <ol className="obra-temporadas">
              {temporadas.map((t, i) => (
                <li key={i}>
                  <div className="obra-temporada-head">
                    {t.id ? <Link to={`/wiki/${encodeURIComponent(t.id)}`}>{t.name}</Link> : <span>{t.name}</span>}
                    <span className="obra-temporada-meta">
                      {[t.status, t.total ? `${t.total} ${chapterWord(data.palavra, t.total !== 1)}` : ""].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  {t.synopsis && <RenderMarkdown text={t.synopsis} />}
                </li>
              ))}
            </ol>
          </>
        )}

        {elenco.length > 0 && (
          <>
            <h2 className="cathead" id="elenco">
              Elenco
            </h2>
            <ul className="obra-elenco">
              {elenco.map((p, i) => {
                const name = p.id ? <Link to={`/wiki/${encodeURIComponent(p.id)}`}>{p.name}</Link> : <span>{p.name}</span>;
                return <li key={i}>{p.at ? <RevealSpoiler at={p.at}>{name}</RevealSpoiler> : name}</li>;
              })}
            </ul>
          </>
        )}
        <MySuggestionsHere wikiId={wikiId} open={mine} />
      </article>
    </PageObrasProvider>
  );
}
