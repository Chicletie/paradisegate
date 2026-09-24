import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePgBody } from "../lib/usePgBody";
import { useWikiIndex, useWikiIndexFailed } from "../lib/wikiIndex";
import { entriesFromIndex } from "../lib/home";
import { didYouMean, searchEntries, typeCounts, type SearchResult, type SearchSort } from "../lib/search";
import { objPos, pgPlural, pgShortDate } from "../lib/format";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";
import { PgSearchIcon } from "../components/PgIcons";
import { ErrorPage } from "./ErrorPage";
import type { WikiIndex } from "../types";

const PAGE = 20;
const wikiHref = (id: string) => `/wiki/${encodeURIComponent(id)}`;
const SORTS: [SearchSort, string][] = [
  ["relevancia", "mais relevantes"],
  ["az", "de A a Z"],
  ["recentes", "atualizadas por último"],
];

/**
 * Busca (`/wiki/_busca?q=&tipo=&ordem=`): página de resultados de verdade, com relevância,
 * trecho onde a palavra aparece, filtro por tipo e "você quis dizer". A home continua filtrando
 * enquanto se digita; Enter em qualquer caixa de busca traz pra cá.
 */
export function SearchPage() {
  const index = useWikiIndex();
  const failed = useWikiIndexFailed();
  usePgBody(!index && !failed ? "loading" : null);
  if (failed) return <ErrorPage message="Não consegui carregar a busca agora. Tente de novo mais tarde." />;
  if (!index)
    return (
      <div className="page">
        <div className="empty">Carregando…</div>
      </div>
    );
  return <SearchLoaded index={index} />;
}

function SearchLoaded({ index }: { index: WikiIndex }) {
  usePgBody();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const q = params.get("q") || "";
  const tipo = params.get("tipo") || "";
  const ordem = (params.get("ordem") as SearchSort) || "relevancia";
  const [draft, setDraft] = useState(q);
  const [shown, setShown] = useState(PAGE);
  // Busca nova vinda do cabeçalho (mesma rota, outra URL): o campo e a paginação acompanham.
  const [lastQ, setLastQ] = useState(q);
  if (lastQ !== q) {
    setLastQ(q);
    setDraft(q);
    setShown(PAGE);
  }

  const entries = useMemo(() => entriesFromIndex(index), [index]);
  const all = useMemo(() => (q.trim() ? searchEntries(entries, q, ordem) : []), [entries, q, ordem]);
  const types = useMemo(() => typeCounts(all), [all]);
  const results = tipo ? all.filter((r) => (r.e.type || "Outros") === tipo) : all;
  const exact = all.find((r) => r.exact) || null;
  const suggestions = useMemo(() => (q.trim() && !all.length ? didYouMean(entries, q) : []), [entries, q, all.length]);

  useEffect(() => {
    document.title = (q.trim() ? `“${q.trim()}” · Busca` : "Busca") + " · Paradise Gate";
  }, [q]);

  function go(next: { q?: string; tipo?: string; ordem?: string }) {
    const p = new URLSearchParams();
    const nq = next.q ?? q;
    const nt = next.tipo ?? tipo;
    const no = next.ordem ?? ordem;
    if (nq.trim()) p.set("q", nq.trim());
    if (nt) p.set("tipo", nt);
    if (no && no !== "relevancia") p.set("ordem", no);
    setShown(PAGE);
    navigate("/wiki/_busca" + (p.toString() ? "?" + p.toString() : ""));
  }

  return (
    <>
      <PgHeader />
      <main className="pg-page-main">
        <div className="card pg-search-page">
          <h1>Busca</h1>
          <form
            className="pg-sp-form"
            role="search"
            onSubmit={(ev) => {
              ev.preventDefault();
              go({ q: draft, tipo: "" });
            }}
          >
            <PgSearchIcon />
            <input
              className="pg-sp-input"
              type="search"
              value={draft}
              onChange={(ev) => setDraft(ev.target.value)}
              placeholder="Nome, lugar, tag, qualquer palavra…"
              aria-label="O que você procura"
              autoFocus={!q}
            />
            <button type="submit" className="pg-sp-go">
              Buscar
            </button>
          </form>

          {!q.trim() ? (
            <p className="pg-sp-hint">Digite um nome, um lugar, uma tag ou qualquer palavra do texto das páginas.</p>
          ) : (
            <>
              <div className="pg-sp-bar">
                <p className="pg-sp-count" aria-live="polite">
                  {all.length === 0
                    ? `Nada encontrado para “${q.trim()}”.`
                    : `${all.length === 1 ? "1 página" : all.length + " páginas"} com “${q.trim()}”`}
                </p>
                {all.length > 1 && (
                  <label className="pg-sp-sort">
                    <span>Ordem</span>
                    <select value={ordem} onChange={(ev) => go({ ordem: ev.target.value })}>
                      {SORTS.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {exact && !tipo && (
                <Link className="pg-sp-exact" to={wikiHref(exact.e.id)}>
                  Ir direto para <strong>{exact.e.title}</strong> →
                </Link>
              )}

              {types.length > 1 && (
                <div className="pg-sp-types" role="group" aria-label="Filtrar por tipo">
                  <button type="button" className={"work-tab" + (!tipo ? " on" : "")} aria-pressed={!tipo} onClick={() => go({ tipo: "" })}>
                    Tudo · {all.length}
                  </button>
                  {types.map(([t, n]) => (
                    <button key={t} type="button" className={"work-tab" + (tipo === t ? " on" : "")} aria-pressed={tipo === t} onClick={() => go({ tipo: tipo === t ? "" : t })}>
                      {pgPlural(t)} · {n}
                    </button>
                  ))}
                </div>
              )}

              {all.length === 0 ? (
                <div className="pg-sp-none">
                  {suggestions.length > 0 && (
                    <p>
                      Você quis dizer{" "}
                      {suggestions.map((s, i) => (
                        <span key={s.id}>
                          {i > 0 && (i === suggestions.length - 1 ? " ou " : ", ")}
                          <Link to={"/wiki/_busca?q=" + encodeURIComponent(s.title)}>{s.title}</Link>
                        </span>
                      ))}
                      ?
                    </p>
                  )}
                  <p>
                    Tente outra palavra, confira a grafia ou <Link to="/wiki">veja todas as páginas</Link>.
                  </p>
                </div>
              ) : (
                <ol className="pg-sp-list">
                  {results.slice(0, shown).map((r) => (
                    <ResultRow key={r.e.id} r={r} />
                  ))}
                </ol>
              )}
              {results.length > shown && (
                <button type="button" className="pg-sp-more" onClick={() => setShown((n) => n + PAGE)}>
                  Mostrar mais ({results.length - shown})
                </button>
              )}
            </>
          )}
        </div>
      </main>
      <PgFooter />
    </>
  );
}

function ResultRow({ r }: { r: SearchResult }) {
  const e = r.e;
  return (
    <li className="pg-sp-item">
      <Link className="pg-sp-link" to={wikiHref(e.id)}>
        {e.cover ? (
          <img className="pg-sp-thumb" src={e.cover} alt="" loading="lazy" style={{ objectPosition: objPos(e.coverFocus) }} />
        ) : (
          <span className="pg-sp-thumb is-empty" aria-hidden="true">
            {(e.title || "?").charAt(0)}
          </span>
        )}
        <span className="pg-sp-body">
          <span className="pg-sp-title">{e.title || "(sem título)"}</span>
          <span className="pg-sp-meta">
            {[e.type, e.updatedAt ? "atualizada em " + pgShortDate(e.updatedAt) : ""].filter(Boolean).join(" · ")}
          </span>
          {r.snippet ? (
            <span className="pg-sp-snip">
              {r.snippet.map((s, i) => (s.hit ? <mark key={i}>{s.text}</mark> : <span key={i}>{s.text}</span>))}
            </span>
          ) : e.excerpt ? (
            <span className="pg-sp-snip">{e.excerpt}</span>
          ) : null}
          {r.tagHits.length > 0 && <span className="pg-sp-tags">{r.tagHits.map((t) => "#" + t).join("  ")}</span>}
        </span>
      </Link>
    </li>
  );
}
