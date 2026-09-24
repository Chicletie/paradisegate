import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePgBody } from "../lib/usePgBody";
import { useWikiIndex, useWikiIndexFailed } from "../lib/wikiIndex";
import { objPos, pgShortDate } from "../lib/format";
import { fmtEventDate } from "../lib/events";
import { quoteAttrKids, QuoteDialogue } from "../lib/quotes";
import { arcanaInfo } from "../lib/arcana";
import { gmt3DateKey } from "../lib/daily";
import {
  dailyHighlights,
  entriesFromIndex,
  filterEntries,
  recentEntries,
  recentNotes,
  snippetFor,
  tagOptions,
  typeOptions,
  wikiNumbers,
  type HomeEntry,
  type HomeNote,
  type DailyHighlights,
} from "../lib/home";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";
import { ArcanaGlyph, PgConstellation, PgNoCover, PgPartyHat, PgSectionHead, PgStar } from "../components/PgIcons";
import { ErrorPage } from "./ErrorPage";

const PAGE = 8;
const wikiHref = (id: string) => `/wiki/${encodeURIComponent(id)}`;

/**
 * Home da wiki (`/wiki`) — porta de renderHome na wiki original: faixa "Hoje" com os
 * destaques do dia (carta do Personagem do dia, Citação, Entrada e Nota do dia), Novidades e
 * Notas recentes (de 8 em 8), coluna lateral (Ano em foco, Explorar, números) e "Todas as
 * páginas" com busca e filtros por tipo e tag. URL: `?q=`, `?tipo=`, `?aleatoria=1` — a rota
 * remonta esta página quando a URL muda, como um carregamento novo da página de hoje.
 */
export function WikiHomePage() {
  const index = useWikiIndex();
  const failed = useWikiIndexFailed();
  const location = useLocation();
  const navigate = useNavigate();
  // ?aleatoria=1 (barra, rodapé, erro): sorteia uma página e troca, sem deixar a home no
  // histórico. Sem nenhuma página publicada, mostra a home normal.
  const wantsRandom = new URLSearchParams(location.search).get("aleatoria") === "1";
  const redirecting = wantsRandom && !!index && Object.keys(index).length > 0;
  useEffect(() => {
    if (!redirecting || !index) return;
    const ids = Object.keys(index);
    navigate(wikiHref(ids[Math.floor(Math.random() * ids.length)]), { replace: true });
  }, [redirecting, index, navigate]);

  // Carregando: só o pg-theme, como hoje. Pronta, a HomeLoaded põe as da home (antes de rolar);
  // com falha, a ErrorPage põe as dela.
  usePgBody(!index && !failed ? "loading" : null);

  if (failed) return <ErrorPage message="Não consegui carregar a wiki agora. Tente de novo mais tarde." />;
  if (!index || redirecting) {
    return (
      <div className="page">
        <div className="empty">Carregando…</div>
      </div>
    );
  }
  return <HomeLoaded entries={entriesFromIndex(index)} />;
}

function HomeLoaded({ entries }: { entries: HomeEntry[] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const types = useMemo(() => typeOptions(entries), [entries]);
  const tags = useMemo(() => tagOptions(entries), [entries]);
  const tipoQ = params.get("tipo");
  const [query, setQuery] = useState(() => params.get("q") || "");
  const [activeType, setActiveType] = useState<string | null>(() => (tipoQ && types.indexOf(tipoQ) !== -1 ? tipoQ : null));
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [newsShown, setNewsShown] = useState(PAGE);
  const [notesShown, setNotesShown] = useState(PAGE);
  const [now] = useState(() => Date.now());
  const indexRef = useRef<HTMLElement>(null);
  usePgBody("home");

  useEffect(() => {
    document.title = "🪶 Paradise Gate · Wiki";
  }, []);
  // ?tipo= vindo da barra de navegação: abre já rolado até a lista filtrada. Hoje essa rolagem
  // acontece antes de o rodapé entrar na página (renderHome anexa o rodapé por último), então
  // ela para mais cedo quando a lista é curta — o rodapé só entra depois da rolagem, igual.
  const [footerReady, setFooterReady] = useState(() => !activeType);
  useLayoutEffect(() => {
    if (footerReady) return;
    indexRef.current?.scrollIntoView();
    setFooterReady(true);
  }, [footerReady]);

  const daily = useMemo(() => dailyHighlights(entries, now), [entries, now]);
  const recent = useMemo(() => recentEntries(entries), [entries]);
  const notes = useMemo(() => recentNotes(entries), [entries]);
  const numbers = useMemo(() => wikiNumbers(entries), [entries]);

  const q = query.toLowerCase().trim();
  const filtering = !!q || !!activeType || !!activeTag;
  const header = <PgHeader search={{ value: query, onChange: setQuery }} />;

  if (!entries.length) {
    return (
      <>
        {header}
        <main className="pg-home-main">
          <section className="pg-today" aria-labelledby="pg-today-h" hidden />
          <div className="pg-body">
            <div className="pg-main">
              <div className="empty">Nenhuma página publicada ainda.</div>
            </div>
            <aside className="pg-rail pg-rail-top" aria-label="Ano em foco" />
            <aside className="pg-rail pg-rail-bottom" aria-label="Explorar a wiki" />
            <section className="pg-index" aria-labelledby="pg-index-h" />
          </div>
        </main>
      </>
    );
  }

  const filtered = filterEntries(entries, query, activeType, activeTag);
  const capped = !filtering && !showAll && filtered.length > 12;
  const randomEntry = () => navigate(wikiHref(entries[Math.floor(Math.random() * entries.length)].id));

  function clearAll() {
    setQuery("");
    setActiveType(null);
    setActiveTag(null);
  }

  return (
    <>
      {header}
      <main className="pg-home-main">
        <TodayBand daily={daily} now={now} hidden={!!q} />
        <div className={"pg-body" + (filtering ? " is-filtering" : "")}>
          <div className="pg-main">
            <div hidden={filtering}>
              <PgSectionHead text="Novidades" />
              <div className="links-grid">
                {recent.slice(0, newsShown).map((e) => (
                  <Link key={e.id} className="link-card" to={wikiHref(e.id)}>
                    {e.cover ? (
                      <img className="link-card-cover" src={e.cover} alt={e.title || ""} loading="lazy" style={{ objectPosition: objPos(e.coverFocus) }} />
                    ) : (
                      <PgNoCover title={e.title} />
                    )}
                    <span className="link-card-label">
                      <span>{e.type || ""}</span>
                      <span>{pgShortDate(e.updatedAt)}</span>
                    </span>
                    <span className="link-card-title">{e.title || "(sem título)"}</span>
                  </Link>
                ))}
              </div>
              {recent.length > newsShown && (
                <button className="home-random" type="button" style={{ marginTop: 10 }} onClick={() => setNewsShown((n) => n + PAGE)}>
                  ver mais novidades
                </button>
              )}
            </div>
            <div hidden={filtering}>
              {notes.length > 0 && (
                <>
                  <PgSectionHead text="Notas recentes" />
                  <div className="links-grid pg-notes-grid">
                    {notes.slice(0, notesShown).map((n, i) => (
                      <Link key={i} className="link-card pg-note-card" to={wikiHref(n.entryId) + "#posts"}>
                        {n.excerpt ? <span className="link-card-excerpt">{n.excerpt}</span> : null}
                        <span className="link-card-label">
                          <span>{n.entryTitle}</span>
                          <span>{pgShortDate(n.date)}</span>
                        </span>
                        <span className="link-card-title">{n.title || "(sem título)"}</span>
                      </Link>
                    ))}
                  </div>
                  {notes.length > notesShown && (
                    <button className="home-random" type="button" style={{ marginTop: 10 }} onClick={() => setNotesShown((n) => n + PAGE)}>
                      ver mais notas
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <aside className="pg-rail pg-rail-top" aria-label="Ano em foco">
            <section className="pg-panel pg-year">
              <PgSectionHead text="Ano em foco" />
              {daily.year != null ? (
                <>
                  <Link className="pg-year-num" to={`/wiki/_timeline?ano=${daily.year}`}>
                    {String(daily.year)}
                  </Link>
                  <div className="spotlight-year-list">
                    {daily.yearEvents.map((ev, i) => (
                      <Link key={i} className="timeline-event major" to={wikiHref(ev.entryId)}>
                        <span className="ev-date">{fmtEventDate(ev)}</span>
                        <span className="ev-text">{ev.label}</span>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <p className="pg-empty">Nenhum evento principal marcado ainda.</p>
              )}
            </section>
          </aside>

          <aside className="pg-rail pg-rail-bottom" aria-label="Explorar a wiki">
            <section className="pg-panel pg-explore">
              <PgSectionHead text="Explorar" />
              <div className="pg-actions">
                <button className="home-random" type="button" onClick={randomEntry}>
                  Página aleatória
                </button>
                {numbers.hasEvents && (
                  <Link className="home-random" to="/wiki/_timeline">
                    Linha do tempo completa
                  </Link>
                )}
              </div>
              {numbers.topTags.length > 0 && (
                <>
                  <h3 className="pg-subhead">Tags em destaque</h3>
                  <div className="tag-cloud">
                    {numbers.topTags.map((t) => (
                      <Link key={t} className="tag-chip" to={`/wiki?q=${encodeURIComponent(t)}`}>
                        {"#" + t}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </section>
            <section className="pg-panel pg-numbers">
              <PgSectionHead text="A wiki em números" />
              <dl className={"pg-num-grid" + (numbers.nums.length % 2 ? " is-odd" : "")}>
                {numbers.nums.map(([n, one, many]) => (
                  <div key={one} className="pg-num">
                    <dt>{n === 1 ? one : many}</dt>
                    <dd>{n.toLocaleString("pt-BR")}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </aside>

          <section className="pg-index" aria-labelledby="pg-index-h" ref={indexRef}>
            <PgSectionHead text="Todas as páginas" id="pg-index-h" count={filtering ? filtered.length + " de " + entries.length : String(entries.length)} />
            <ChipRow className="type-chips" options={types} active={activeType} onToggle={(t) => setActiveType((a) => (a === t ? null : t))} />
            <ChipRow className="type-chips tag-chips" options={tags} active={activeTag} onToggle={(t) => setActiveTag((a) => (a === t ? null : t))} />
            <div className="home-groups">
              {!filtered.length ? (
                <div className="empty">
                  <span>Nada encontrado.</span>
                  <button className="home-random pg-clear" type="button" onClick={clearAll}>
                    Limpar busca e filtros
                  </button>
                </div>
              ) : (
                <>
                  <div className={"home-grid" + (capped ? " pg-capped" : "")}>
                    {filtered
                      .slice()
                      .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
                      .map((e) => (
                        <HomeCard key={e.id} e={e} q={q} />
                      ))}
                  </div>
                  {capped && (
                    <button className="home-random pg-show-all" type="button" onClick={() => setShowAll(true)}>
                      {"Ver todas as " + filtered.length + " páginas"}
                    </button>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </main>
      {footerReady && <PgFooter />}
    </>
  );
}

/** Fileira de chips (tipo ou tag): só aparece com 2+ opções; um toque liga, outro desliga. */
function ChipRow({ className, options, active, onToggle }: { className: string; options: string[]; active: string | null; onToggle: (o: string) => void }) {
  if (options.length < 2) return null;
  return (
    <div className={className}>
      {options.map((o) => (
        <button key={o} type="button" className={"work-tab" + (o === active ? " on" : "")} aria-pressed={o === active} onClick={() => onToggle(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

function HomeCard({ e, q }: { e: HomeEntry; q: string }) {
  const snip = q ? snippetFor(e, q) : null;
  return (
    <Link className="home-card" to={wikiHref(e.id)}>
      {e.cover ? (
        <img className="home-card-cover" src={e.cover} alt={e.title || ""} loading="lazy" style={{ objectPosition: objPos(e.coverFocus) }} />
      ) : (
        <PgNoCover title={e.title} />
      )}
      <div className="home-card-title">{e.title || "(sem título)"}</div>
      <div className="home-card-meta">{e.type || ""}</div>
      {snip && <div className="home-card-snippet">{snip}</div>}
    </Link>
  );
}

/** Faixa "Hoje em Paradise Gate": carta do dia, título e data, Citação do dia, Entrada e Nota. */
function TodayBand({ daily, now, hidden }: { daily: DailyHighlights; now: number; hidden: boolean }) {
  const dateLabel = new Date(gmt3DateKey(now) + "T12:00:00Z").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  const qp = daily.quote;
  const attr = qp ? quoteAttrKids(qp, false) : [];
  return (
    <section className="pg-today" aria-labelledby="pg-today-h" hidden={hidden}>
      <PgConstellation />
      <div className="pg-today-inner">
        <TarotCard daily={daily} />
        <div className="pg-today-main">
          <div className="pg-today-head">
            <h1 id="pg-today-h">Paradise Gate Wiki</h1>
            <p className="pg-today-date">{dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}</p>
          </div>
          <figure className={"pg-quote" + (qp && qp.kind === "dialogo" ? " is-dialogue" : "")}>
            {qp ? (
              <>
                <blockquote className="pg-quote-text">{qp.kind === "dialogo" ? <QuoteDialogue q={qp} /> : <p>{"“" + qp.text + "”"}</p>}</blockquote>
                {attr.length > 0 && (
                  <figcaption className="pg-quote-attr">
                    {"— "}
                    {attr.map((a, i) => (
                      <Fragment key={i}>{a}</Fragment>
                    ))}
                  </figcaption>
                )}
              </>
            ) : (
              <p className="pg-quote-text pg-empty">Nenhuma citação publicada ainda.</p>
            )}
          </figure>
          <div className="pg-tiles">
            {daily.entrada ? (
              <DayTile
                caption={"Entrada do dia" + (daily.entrada.type ? " · " + daily.entrada.type : "")}
                title={daily.entrada.title || "(sem título)"}
                to={wikiHref(daily.entrada.id)}
                cover={daily.entrada.cover}
                coverFocus={daily.entrada.coverFocus}
                excerpt={daily.entrada.excerpt}
              />
            ) : (
              <EmptyTile caption="Entrada do dia" text="Nenhuma entrada ainda." />
            )}
            {daily.note ? <NoteTile n={daily.note} /> : <EmptyTile caption="Nota do dia" text="Nenhuma nota ainda." />}
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyTile({ caption, text }: { caption: string; text: string }) {
  return (
    <div className="pg-tile is-empty">
      <span className="pg-empty">{text}</span>
      <span className="pg-caption">{caption}</span>
    </div>
  );
}

function DayTile(props: { caption: string; title: string; to: string; cover?: string | null; coverFocus?: { x: number; y: number } | null; excerpt?: string }) {
  return (
    <Link className="pg-tile" to={props.to}>
      <span className="pg-tile-top">
        {props.cover ? <img className="pg-tile-img" src={props.cover} alt="" loading="lazy" style={{ objectPosition: objPos(props.coverFocus) }} /> : null}
        <span className="pg-tile-title">{props.title}</span>
      </span>
      {props.excerpt ? <span className="pg-tile-excerpt">{props.excerpt}</span> : null}
      <span className="pg-caption">{props.caption}</span>
    </Link>
  );
}

// Nota do dia: só texto — título e um trecho; a imagem da nota fica pra quem abrir a nota.
function NoteTile({ n }: { n: HomeNote }) {
  return (
    <Link className="pg-tile pg-tile-note" to={wikiHref(n.entryId) + "#posts"}>
      <span className="pg-tile-top">
        <span className="pg-tile-title">{n.title || "(sem título)"}</span>
      </span>
      {n.excerpt ? <span className="pg-tile-excerpt">{n.excerpt}</span> : null}
      <span className="pg-caption">{"Nota do dia · " + n.entryTitle}</span>
    </Link>
  );
}

/** Personagem do dia como carta de tarô: vira uma vez ao carregar (desligado em reduced-motion
 * pelo CSS). Com carta associada no editor, numeral e símbolo dela; senão, a estrela. */
function TarotCard({ daily }: { daily: DailyHighlights }) {
  const c = daily.char;
  if (!c) {
    return (
      <figure className="pg-tarot-fig">
        <div className="pg-tarot is-empty">
          <div className="pg-tarot-inner">
            <div className="pg-tarot-back">
              <PgStar className="pg-tarot-back-star" />
            </div>
          </div>
        </div>
        <figcaption className="pg-caption">
          <span>Personagem do dia</span>
          <span className="pg-empty">{daily.charEmptyMsg}</span>
        </figcaption>
      </figure>
    );
  }
  const arc = arcanaInfo(c.arcana);
  const title = [arc ? arc.label : null, daily.isBirthday ? "Aniversário hoje" : null].filter(Boolean).join(" · ");
  return (
    <figure className="pg-tarot-fig">
      <Link className="pg-tarot" to={wikiHref(c.id)} title={title || undefined}>
        <div className="pg-tarot-inner">
          <div className={"pg-tarot-face" + (c.cover ? "" : " no-cover")}>
            {c.cover ? (
              <img className="pg-tarot-img" src={c.cover} alt="" style={{ objectPosition: objPos(c.coverFocus) }} />
            ) : (
              <span className="pg-tarot-initial" aria-hidden="true">
                <PgConstellation />
                <span>{(c.title || "?").charAt(0)}</span>
              </span>
            )}
            <span className="pg-tarot-num" aria-hidden="true">
              {arc ? arc.numeral : <PgStar className="pg-tarot-num-star" />}
            </span>
            <span className="pg-tarot-name">
              {arc ? <ArcanaGlyph glyph={arc.glyph} className="pg-tarot-glyph" /> : null}
              <span>{c.title || "(sem título)"}</span>
              {arc ? <span className="pg-sr">{", carta " + arc.label}</span> : null}
              {daily.isBirthday ? <span className="pg-sr">, aniversário hoje</span> : null}
            </span>
          </div>
          <div className="pg-tarot-back" aria-hidden="true">
            <PgStar className="pg-tarot-back-star" />
          </div>
        </div>
        {daily.isBirthday && <PgPartyHat />}
      </Link>
      <figcaption className="pg-caption">
        <span>{daily.isBirthday ? "Aniversariante do dia" : "Personagem do dia"}</span>
      </figcaption>
    </figure>
  );
}
