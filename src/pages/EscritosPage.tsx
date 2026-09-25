import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePgBody } from "../lib/usePgBody";
import { useWikiIndex, useWikiIndexFailed, useWikiObras } from "../lib/wikiIndex";
import { pgShortDate } from "../lib/format";
import { useSpoilerAt } from "../lib/spoilerProgress";
import {
  WRITING_CANON, WRITING_KINDS, WRITING_ORIGIN, canonLabel, filterWritings, kindCounts, kindLabel, originLabel, tagsOf, writingHref,
  writingsFromIndex, type Writing, type WritingFilter,
} from "../lib/escritos";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";
import { PageObrasProvider } from "../components/SpoilerProgress";
import { ErrorPage } from "./ErrorPage";
import type { WikiIndex } from "../types";

const PAGE = 24;
const KEYS: (keyof WritingFilter)[] = ["tipo", "canone", "origem", "tag", "pagina"];

/**
 * Lista geral dos escritos (`/wiki/_escritos?tipo=&canone=&origem=&tag=&pagina=`): contos,
 * crônicas, narrações, causos… de todas as páginas, cada um uma vez, com filtro. Lê só o índice.
 */
export function EscritosPage() {
  const index = useWikiIndex();
  const failed = useWikiIndexFailed();
  usePgBody(!index && !failed ? "loading" : null);
  if (failed) return <ErrorPage message="Não consegui carregar os escritos agora. Tente de novo mais tarde." />;
  if (!index)
    return (
      <div className="page">
        <div className="empty">Carregando…</div>
      </div>
    );
  return <EscritosLoaded index={index} />;
}

function EscritosLoaded({ index }: { index: WikiIndex }) {
  usePgBody();
  const obras = useWikiObras();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const f: WritingFilter = {};
  KEYS.forEach((k) => {
    const v = params.get(k);
    if (v != null && v !== "") f[k] = v;
  });
  const [shown, setShown] = useState(PAGE);
  const [lastSearch, setLastSearch] = useState(location.search);
  if (lastSearch !== location.search) {
    setLastSearch(location.search);
    setShown(PAGE);
  }

  const all = useMemo(() => writingsFromIndex(index), [index]);
  const kinds = useMemo(() => kindCounts(all), [all]);
  const tags = useMemo(() => tagsOf(all), [all]);
  const list = filterWritings(all, f);
  const pageTitle = f.pagina ? all.find((w) => w.entries.some((e) => e.id === f.pagina))?.entries.find((e) => e.id === f.pagina)?.title : "";

  useEffect(() => {
    document.title = (f.tipo && f.tipo !== "-" ? (WRITING_KINDS.find((k) => k.id === f.tipo)?.plural || "Escritos") : "Escritos") + " · Paradise Gate";
  }, [f.tipo]);

  function go(next: WritingFilter) {
    const p = new URLSearchParams();
    const merged = { ...f, ...next };
    KEYS.forEach((k) => {
      if (merged[k]) p.set(k, merged[k]!);
    });
    navigate("/wiki/_escritos" + (p.toString() ? "?" + p.toString() : ""));
  }
  const anyFilter = KEYS.some((k) => f[k]);

  return (
    <>
      <PgHeader />
      <main className="pg-page-main">
        <div className="card pg-escritos">
          <h1>Escritos</h1>
          <p className="pg-sp-hint">Contos, crônicas, narrações de sessão, causos de mesa, cartas e bastidores de Paradise Gate.</p>

          {kinds.length > 1 && (
            <div className="pg-sp-types" role="group" aria-label="Filtrar por tipo">
              <button type="button" className={"work-tab" + (!f.tipo ? " on" : "")} aria-pressed={!f.tipo} onClick={() => go({ tipo: "" })}>
                {"Todos · " + all.length}
              </button>
              {kinds.map(([k, n]) => {
                const v = k || "-";
                const label = k ? WRITING_KINDS.find((x) => x.id === k)?.plural || kindLabel(k) : "Sem tipo";
                return (
                  <button key={v} type="button" className={"work-tab" + (f.tipo === v ? " on" : "")} aria-pressed={f.tipo === v} onClick={() => go({ tipo: f.tipo === v ? "" : v })}>
                    {label + " · " + n}
                  </button>
                );
              })}
            </div>
          )}

          <div className="pg-escritos-filters">
            <label className="pg-sp-sort">
              <span>Cânone</span>
              <select value={f.canone || ""} onChange={(ev) => go({ canone: ev.target.value })}>
                <option value="">qualquer</option>
                {WRITING_CANON.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="pg-sp-sort">
              <span>De onde vem</span>
              <select value={f.origem || ""} onChange={(ev) => go({ origem: ev.target.value })}>
                <option value="">qualquer</option>
                {WRITING_ORIGIN.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            {tags.length > 0 && (
              <label className="pg-sp-sort">
                <span>Tom</span>
                <select value={f.tag || ""} onChange={(ev) => go({ tag: ev.target.value })}>
                  <option value="">qualquer</option>
                  {tags.map((t) => (
                    <option key={t} value={t}>
                      {"#" + t}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {f.pagina && (
              <button type="button" className="pg-escritos-chip" onClick={() => go({ pagina: "" })} aria-label="Tirar o filtro de página">
                {"em " + (pageTitle || f.pagina) + " ✕"}
              </button>
            )}
          </div>

          <p className="pg-sp-count" aria-live="polite">
            {!all.length ? "Nenhum escrito publicado ainda." : list.length === 0 ? "Nenhum escrito com esse filtro." : list.length === 1 ? "1 escrito" : list.length + " escritos"}
          </p>
          {anyFilter && list.length === 0 && (
            <p>
              <Link to="/wiki/_escritos">Ver todos os escritos</Link>
            </p>
          )}

          <PageObrasProvider obras={obras}>
            <div className="pg-wgrid">
              {list.slice(0, shown).map((w) => (
                <WritingCard key={w.id} w={w} />
              ))}
            </div>
          </PageObrasProvider>
          {list.length > shown && (
            <button type="button" className="pg-sp-more" onClick={() => setShown((n) => n + PAGE)}>
              {"Mostrar mais (" + (list.length - shown) + ")"}
            </button>
          )}
        </div>
      </main>
      <PgFooter />
    </>
  );
}

/** Cartão de um escrito. Spoiler que o leitor ainda não liberou fica fechado: sem título nem
 * trecho, só de que obra é. */
export function WritingCard({ w, hidePages }: { w: Writing; hidePages?: boolean }) {
  const sp = useSpoilerAt(w.at);
  const closed = w.vis === "spoiler" && !sp.open;
  const where = hidePages ? "" : w.entries.map((e) => e.title).filter(Boolean).join(", ");
  return (
    <Link className={"pg-wcard" + (closed ? " is-spoiler" : "")} to={writingHref(w)}>
      <span className="pg-wcard-kind">
        <span>{kindLabel(w.tipo)}</span>
        {w.date ? <span>{pgShortDate(w.date)}</span> : null}
      </span>
      <span className="pg-wcard-title">{closed ? "Escrito com spoiler" : w.title || "(sem título)"}</span>
      {(w.canone || w.origem) && <span className="pg-wcard-marks">{[canonLabel(w.canone), originLabel(w.origem)].filter(Boolean).join(" · ")}</span>}
      {closed ? (
        <span className="pg-wcard-excerpt">{sp.label ? "Revelado em " + sp.label + ". Toque para abrir." : "Toque para abrir."}</span>
      ) : w.excerpt ? (
        <span className="pg-wcard-excerpt">{w.excerpt}</span>
      ) : null}
      {(where || w.autor) && <span className="pg-wcard-where">{[where, w.autor ? "por @" + w.autor : ""].filter(Boolean).join(" · ")}</span>}
    </Link>
  );
}
