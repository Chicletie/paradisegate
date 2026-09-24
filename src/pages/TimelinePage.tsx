import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { usePgBody } from "../lib/usePgBody";
import { useWikiIndex, useWikiIndexFailed } from "../lib/wikiIndex";
import { fmtEventDate } from "../lib/events";
import { filterTimeline, timelineEvents, timelineTypes, yearFromQuery } from "../lib/timeline";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";
import { ErrorPage } from "./ErrorPage";
import type { WikiIndex } from "../types";

/**
 * Linha do tempo geral (`/wiki/_timeline`, `?ano=` preenche o filtro de ano) — porta de
 * renderTimeline em wiki-core.js (arvore): os eventos de todas as páginas, filtráveis por tipo
 * de página, ano e "só principais"; cada evento leva pra página de onde veio.
 */
export function TimelinePage() {
  const index = useWikiIndex();
  const failed = useWikiIndexFailed();
  // Carregando: só o pg-theme, como a home. Pronta, TimelineLoaded põe as classes da página.
  usePgBody(!index && !failed ? "loading" : null);
  if (failed) return <ErrorPage message="Não consegui carregar a linha do tempo agora. Tente de novo mais tarde." />;
  if (!index)
    return (
      <div className="page">
        <div className="empty">Carregando…</div>
      </div>
    );
  return <TimelineLoaded index={index} />;
}

function TimelineLoaded({ index }: { index: WikiIndex }) {
  usePgBody();
  const location = useLocation();
  const events = useMemo(() => timelineEvents(index), [index]);
  const types = useMemo(() => timelineTypes(index), [index]);
  const [type, setType] = useState("");
  const [year, setYear] = useState(() => yearFromQuery(new URLSearchParams(location.search).get("ano")));
  const [onlyMajor, setOnlyMajor] = useState(false);

  useEffect(() => {
    document.title = "Linha do tempo · Paradise Gate";
  }, []);

  const shown = filterTimeline(events, type, year.trim(), onlyMajor);

  return (
    <>
      <PgHeader />
      <main className="pg-page-main">
        <div className="card">
          <h1>Linha do tempo</h1>
          {/* Sem eventos, a contagem "0 eventos" repetiria o aviso de vazio logo abaixo. */}
          <div className="pg-entry-meta">
            {events.length > 0 && (
              <span className="pg-entry-type">{events.length === 1 ? "1 evento publicado" : events.length + " eventos publicados"}</span>
            )}
          </div>
          {events.length === 0 ? (
            <>
              <div className="empty">Nenhum evento publicado ainda.</div>
              <div className="pg-msg-actions">
                <Link className="back-home-link" to="/wiki">
                  Voltar pro início
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="timeline-filters">
                <select className="field" value={type} onChange={(ev) => setType(ev.target.value)}>
                  <option value="">todos os tipos</option>
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  className="field"
                  type="number"
                  placeholder="ano"
                  style={{ width: 100 }}
                  value={year}
                  onChange={(ev) => setYear(ev.target.value)}
                />
                <label className="timeline-major-lbl">
                  <input type="checkbox" checked={onlyMajor} onChange={(ev) => setOnlyMajor(ev.target.checked)} />
                  {" só principais"}
                </label>
              </div>
              <div className="timeline-list">
                {shown.length === 0 ? (
                  <div className="empty">Nada encontrado com esses filtros.</div>
                ) : (
                  shown.map((ev, i) => (
                    <Fragment key={i}>
                      {(i === 0 || shown[i - 1].y !== ev.y) && <div className="timeline-year">{"Ano " + ev.y}</div>}
                      <Link className={"timeline-event" + (ev.major ? " major" : "")} to={`/wiki/${encodeURIComponent(ev.entryId)}`}>
                        <span className="ev-date">{fmtEventDate(ev)}</span>
                        <span className="ev-text">{ev.label || "(evento)"}</span>
                        <span className="ev-origin">{ev.entryTitle}</span>
                      </Link>
                    </Fragment>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <PgFooter />
    </>
  );
}
