import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { Link } from "react-router-dom";
import { usePgBody } from "../lib/usePgBody";
import { useWikiIndex, useWikiIndexFailed } from "../lib/wikiIndex";
import { dailyHighlights, entriesFromIndex, recentEntries, recentNotes, type HomeEntry } from "../lib/home";
import { objPos, pgShortDate } from "../lib/format";
import { quoteAttrKids, QuoteDialogue } from "../lib/quotes";
import { kindLabel } from "../lib/escritos";
import { useAccount } from "../lib/account";
import { featuresOf, useJogoAccess } from "../jogo/access";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";
import { ArcanaGlyph, PgConstellation, PgNoCover, PgSectionHead, PgStar, PgUserIcon } from "../components/PgIcons";
import { TarotCard } from "../components/TarotCard";
import { homeFaces } from "../home/content";
import { ARCANAS, GRUPOS, IMPULSOS, PERGUNTA_ARCANA, PERGUNTA_NOME, RACAS } from "../home/jogo";
import { startSky } from "../home/sky";

/*
 * Home da marca (/): o verso da caixa do jogo. O mundo (wiki), o jogo (as escolhas reais da
 * ficha), a mesa (jogadores) e as novidades. Só dado público: o índice da wiki e o sorteio do
 * dia, os mesmos da /wiki. Movimento só quando a pessoa age (scroll, ponteiro, toque); parado,
 * nada anda. Em prefers-reduced-motion, nada anda.
 */

const wikiHref = (id: string) => `/wiki/${encodeURIComponent(id)}`;

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

export function HomePage() {
  usePgBody("page");
  const root = useRef<HTMLDivElement>(null);
  const index = useWikiIndex();
  const failed = useWikiIndexFailed();
  const entries = useMemo(() => (index ? entriesFromIndex(index) : []), [index]);
  const daily = useMemo(() => (index ? dailyHighlights(entries) : null), [index, entries]);
  const faces = useMemo(() => homeFaces(entries, daily?.char?.id ?? null), [entries, daily]);
  // Quem já aparece no topo ou em "O mundo" não se repete nas Novidades.
  const shown = useMemo(() => new Set([daily?.char?.id, ...faces.map((f) => f.id)].filter((id): id is string => !!id)), [daily, faces]);
  useReveal(root);

  return (
    <div className="pg-hm" ref={root}>
      <PgHeader />
      <main>
        <Hero daily={daily} />
        <World entries={entries} faces={faces} daily={daily} loading={!index && !failed} failed={failed} />
        <Game />
        <Mesa />
        <Now entries={entries} skip={shown} loading={!index && !failed} failed={failed} />
      </main>
      <PgFooter />
    </div>
  );
}

/** Marca `.pg-hm-anim` antes de pintar (o estado escondido das revelações só vale com ela) e
 * põe `is-in` em cada `[data-reveal]` quando ele entra na tela, uma vez. */
function useReveal(root: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || reducedMotion() || typeof IntersectionObserver === "undefined") return;
    el.classList.add("pg-hm-anim");
    const io = new IntersectionObserver(
      (list) => {
        for (const e of list) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    const watch = () => el.querySelectorAll("[data-reveal]:not(.is-in)").forEach((n) => io.observe(n));
    watch();
    // As listas chegam depois (índice da wiki): observa o que aparecer.
    const mo = new MutationObserver(watch);
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      el.classList.remove("pg-hm-anim");
    };
  }, [root]);
}

/** Ímã leve nos botões grandes: andam até 6px na direção do ponteiro. */
function useMagnet<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !finePointer()) return;
    const move = (ev: PointerEvent) => {
      const b = el.getBoundingClientRect();
      const x = ((ev.clientX - b.left) / b.width - 0.5) * 12;
      const y = ((ev.clientY - b.top) / b.height - 0.5) * 10;
      el.style.setProperty("--mx", x.toFixed(1) + "px");
      el.style.setProperty("--my", y.toFixed(1) + "px");
    };
    const leave = () => {
      el.style.setProperty("--mx", "0px");
      el.style.setProperty("--my", "0px");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);
  return ref;
}

function Hero({ daily }: { daily: ReturnType<typeof dailyHighlights> | null }) {
  const hero = useRef<HTMLElement>(null);
  const sky = useRef<HTMLCanvasElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const primary = useMagnet<HTMLAnchorElement>();

  useEffect(() => {
    if (!sky.current || !hero.current) return;
    return startSky(sky.current, hero.current);
  }, []);

  // A carta inclina na direção do ponteiro (só mouse; parado, fica onde está).
  useEffect(() => {
    const area = hero.current;
    const c = card.current;
    if (!area || !c || reducedMotion() || !finePointer()) return;
    const move = (ev: PointerEvent) => {
      const b = c.getBoundingClientRect();
      const dx = (ev.clientX - (b.left + b.width / 2)) / (window.innerWidth / 2);
      const dy = (ev.clientY - (b.top + b.height / 2)) / (window.innerHeight / 2);
      c.style.setProperty("--ry", (Math.max(-1, Math.min(1, dx)) * 9).toFixed(2) + "deg");
      c.style.setProperty("--rx", (Math.max(-1, Math.min(1, -dy)) * 7).toFixed(2) + "deg");
    };
    const leave = () => {
      c.style.setProperty("--ry", "0deg");
      c.style.setProperty("--rx", "0deg");
    };
    area.addEventListener("pointermove", move);
    area.addEventListener("pointerleave", leave);
    return () => {
      area.removeEventListener("pointermove", move);
      area.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <section className="pg-hm-hero" ref={hero} aria-labelledby="pg-hm-title">
      <canvas className="pg-hm-sky" ref={sky} aria-hidden="true" />
      <PgConstellation />
      <div className="pg-hm-hero-inner">
        <div className="pg-hm-hero-text">
          <h1 id="pg-hm-title" className="pg-hm-title">
            Paradise Gate
          </h1>
          <p className="pg-hm-lede">A magia nunca saiu do mundo. Só aprendeu a se esconder.</p>
          <p className="pg-hm-sub">
            Fantasia urbana sombria e RPG de mesa. Milícias mágicas com codinomes mitológicos, uma igreja que manda por trás das
            instituições e gente presa no meio de tudo isso.
          </p>
          <div className="pg-hm-cta">
            <Link className="pg-hm-btn is-primary" to="/wiki" ref={primary}>
              Conhecer o mundo
            </Link>
            <MesaButton />
          </div>
        </div>
        <div className="pg-hm-card" ref={card}>
          {daily ? <TarotCard daily={daily} /> : <CardBack />}
        </div>
      </div>
    </section>
  );
}

function CardBack() {
  return (
    <figure className="pg-tarot-fig" aria-busy="true">
      <div className="pg-tarot is-empty">
        <div className="pg-tarot-inner">
          <div className="pg-tarot-back">
            <PgStar className="pg-tarot-back-star" />
          </div>
        </div>
      </div>
      <figcaption className="pg-caption">
        <span>Personagem do dia</span>
      </figcaption>
    </figure>
  );
}

/** Segundo convite do topo: quem não entrou abre o login; quem entrou vai pras fichas (quando a
 * API diz que a conta tem fichas) ou pro perfil. */
function MesaButton() {
  const { user, openLogin } = useAccount();
  const fichas = featuresOf(useJogoAccess()).fichas;
  const ref = useMagnet<HTMLButtonElement>();
  const linkRef = useMagnet<HTMLAnchorElement>();
  if (!user) {
    return (
      <button className="pg-hm-btn" type="button" onClick={openLogin} ref={ref}>
        <PgUserIcon />
        <span>Sou da mesa</span>
      </button>
    );
  }
  return (
    <Link className="pg-hm-btn" to={fichas ? "/wiki/_perfil#fichas" : "/wiki/_perfil"} ref={linkRef}>
      <PgUserIcon />
      <span>{fichas ? "Minhas fichas" : "Meu perfil"}</span>
    </Link>
  );
}

function World(props: { entries: HomeEntry[]; faces: HomeEntry[]; daily: ReturnType<typeof dailyHighlights> | null; loading: boolean; failed: boolean }) {
  const { entries, faces, daily, loading, failed } = props;
  const q = daily?.quote ?? null;
  const attr = q ? quoteAttrKids(q, false) : [];
  return (
    <section className="pg-hm-world" aria-labelledby="pg-hm-world-h">
      <div className="pg-hm-wrap">
        <PgSectionHead text="O mundo" id="pg-hm-world-h" />
        <div className="pg-hm-world-grid">
          <div className="pg-hm-world-text" data-reveal="rise">
            <p className="pg-hm-read">
              Paradise Gate acontece aqui, no mundo de hoje. A magia existe e fica escondida; milícias mágicas usam codinomes
              mitológicos, e uma igreja domina o mundo por trás das instituições. No centro, o drama de personagens presos num
              sistema corrupto.
            </p>
            {entries.length > 0 && (
              <p className="pg-hm-count">
                A wiki tem <strong>{entries.length.toLocaleString("pt-BR")}</strong> {entries.length === 1 ? "página publicada" : "páginas publicadas"}, e ganha
                mais conforme a história anda.
              </p>
            )}
            {q && (
              <figure className="pg-hm-quote">
                <blockquote>{q.kind === "dialogo" ? <QuoteDialogue q={q} /> : <p>{"“" + q.text + "”"}</p>}</blockquote>
                {attr.length > 0 && (
                  <figcaption>
                    {"— "}
                    {attr.map((a, i) => (
                      <Fragment key={i}>{a}</Fragment>
                    ))}
                  </figcaption>
                )}
              </figure>
            )}
            <div className="pg-hm-actions">
              <Link className="pg-btn" to="/wiki">
                Abrir a wiki
              </Link>
              <Link className="pg-hm-textlink" to="/wiki?aleatoria=1">
                Página aleatória
              </Link>
            </div>
          </div>
          {failed ? (
            <p className="pg-hm-state">Não consegui carregar a wiki agora. Atualize a página pra tentar de novo.</p>
          ) : loading ? (
            <ul className="pg-hm-faces" aria-busy="true" aria-label="Carregando personagens">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="pg-hm-face is-loading" />
              ))}
            </ul>
          ) : faces.length > 0 ? (
            <ul className="pg-hm-faces" aria-label="Alguns personagens">
              {faces.map((e, i) => (
                <li key={e.id} className="pg-hm-face" data-reveal="face" style={{ "--i": i } as CSSProperties}>
                  <Portrait e={e} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Portrait({ e, meta }: { e: HomeEntry; meta?: string }) {
  return (
    <Link className="pg-hm-portrait" to={wikiHref(e.id)}>
      <span className="pg-hm-portrait-img">
        {e.cover ? <img src={e.cover} alt="" loading="lazy" style={{ objectPosition: objPos(e.coverFocus) }} /> : <PgNoCover title={e.title} />}
      </span>
      <span className="pg-hm-portrait-name">{e.title || "(sem título)"}</span>
      {meta && <span className="pg-hm-portrait-meta">{meta}</span>}
    </Link>
  );
}

function Game() {
  return (
    <section className="pg-hm-game" aria-labelledby="pg-hm-game-h">
      <div className="pg-hm-wrap">
        <div className="pg-hm-game-head" data-reveal="rise">
          <h2 id="pg-hm-game-h" className="pg-hm-game-title">
            {PERGUNTA_NOME}
          </h2>
          <p className="pg-hm-game-lede">
            Paradise Gate também é um RPG de mesa. A ficha começa com essa pergunta e segue pelas escolhas que fazem o personagem.
          </p>
        </div>

        <div className="pg-hm-choices">
          <div className="pg-hm-choice" data-reveal="rise">
            <h3>Raça</h3>
            <p className="pg-hm-choice-count">{RACAS.length} raças</p>
            <ul className="pg-hm-names">
              {RACAS.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div className="pg-hm-choice" data-reveal="rise">
            <h3>Classe</h3>
            <p className="pg-hm-choice-count">
              {GRUPOS.reduce((n, g) => n + g.classes.length, 0)} classes em {GRUPOS.length} grupos
            </p>
            <dl className="pg-hm-groups">
              {GRUPOS.map((g) => (
                <div key={g.nome}>
                  <dt>{g.nome}</dt>
                  <dd>{g.classes.join(" · ")}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <Drives />
        <ArcanaFan />

        <div className="pg-hm-game-cta" data-reveal="rise">
          <a className="pg-hm-btn is-primary" href="/fichas.html">
            Abrir uma ficha em branco
          </a>
          <p>Funciona sem conta: a ficha fica salva neste navegador.</p>
        </div>
      </div>
    </section>
  );
}

function Drives() {
  const row = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const page = (dir: number) => {
    const el = row.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reducedMotion() ? "auto" : "smooth" });
  };

  return (
    <div className="pg-hm-drives">
      <div className="pg-hm-drives-head">
        <h3>Impulso</h3>
        <p className="pg-hm-choice-count">{IMPULSOS.length} impulsos</p>
        <div className="pg-hm-pager">
          <button type="button" aria-controls="pg-hm-drive-row" aria-label="Impulsos anteriores" disabled={edge.start} onClick={() => page(-1)}>
            <Chevron dir={-1} />
          </button>
          <button type="button" aria-controls="pg-hm-drive-row" aria-label="Próximos impulsos" disabled={edge.end} onClick={() => page(1)}>
            <Chevron dir={1} />
          </button>
        </div>
      </div>
      <ul className="pg-hm-drive-row" id="pg-hm-drive-row" ref={row} data-reveal="deal" tabIndex={0} aria-label="Os 24 impulsos">
        {IMPULSOS.map((d, i) => (
          <li key={d.nome} className="pg-hm-drive" style={{ "--i": i } as CSSProperties}>
            <div className="pg-hm-drive-inner">
              <div className="pg-hm-drive-face">
                <PgStar className="pg-hm-drive-star" />
                <span className="pg-hm-drive-name">{d.nome}</span>
                <span className="pg-hm-drive-sub">{d.subtitulo}</span>
              </div>
              <div className="pg-hm-drive-back" aria-hidden="true">
                <PgStar className="pg-tarot-back-star" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Chevron({ dir }: { dir: number }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d={dir < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** As 21 arcanas maiores, empilhadas como um baralho que abre em leque conforme a seção sobe na
 * tela (o scroll dirige; parado, o leque para onde está). */
function ArcanaFan() {
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (reducedMotion()) {
      el.style.setProperty("--fan", "1");
      return;
    }
    let frame = 0;
    // O leque só abre: voltar a rolar pra cima não fecha o baralho de novo.
    let open = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.75)));
      open = Math.max(open, 1 - Math.pow(1 - p, 3));
      el.style.setProperty("--fan", open.toFixed(3));
      if (open === 1) window.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && open < 1) window.addEventListener("scroll", onScroll, { passive: true });
      else window.removeEventListener("scroll", onScroll);
      update();
    });
    io.observe(el);
    update();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const mid = (ARCANAS.length - 1) / 2;
  const shown = hover != null ? ARCANAS[hover] : null;
  return (
    <div className="pg-hm-arcana" ref={box}>
      <h3>{PERGUNTA_ARCANA}</h3>
      <p className="pg-hm-choice-count">Cada personagem escolhe uma das {ARCANAS.length} arcanas maiores.</p>
      <ol className="pg-hm-fan" aria-label="Arcanas maiores" onPointerLeave={() => setHover(null)}>
        {ARCANAS.map((a, i) => (
          <li key={a.numeral} style={{ "--k": i - mid } as CSSProperties} className={hover === i ? "is-on" : undefined}>
            <button
              type="button"
              className="pg-hm-fan-card"
              aria-label={a.numeral + " · " + a.nome}
              aria-pressed={hover === i}
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onClick={() => setHover(i)}
            >
              <span className="pg-hm-fan-num" aria-hidden="true">
                {a.numeral}
              </span>
              <ArcanaGlyph glyph={"m" + (i + 1)} className="pg-hm-fan-glyph" />
            </button>
          </li>
        ))}
      </ol>
      <p className="pg-hm-fan-caption" aria-live="polite">
        {shown ? shown.numeral + " · " + shown.nome : " "}
      </p>
    </div>
  );
}

function Mesa() {
  return (
    <section className="pg-hm-mesa-band" aria-labelledby="pg-hm-mesa-h">
      <div className="pg-hm-wrap">
        <PgSectionHead text="A mesa" id="pg-hm-mesa-h" />
        <div className="pg-panel pg-hm-mesa">
          <MesaPanel />
        </div>
      </div>
    </section>
  );
}

function Now({ entries, skip, loading, failed }: { entries: HomeEntry[]; skip: Set<string>; loading: boolean; failed: boolean }) {
  const news = useMemo(() => recentEntries(entries.filter((e) => !skip.has(e.id))).slice(0, 6), [entries, skip]);
  const notes = useMemo(() => recentNotes(entries).slice(0, 3), [entries]);
  return (
    <section className="pg-hm-now" aria-labelledby="pg-hm-news-h">
      <div className="pg-hm-wrap">
        <PgSectionHead text="Novidades" id="pg-hm-news-h" />
        {failed ? (
          <p className="pg-hm-state">Não consegui carregar as novidades agora.</p>
        ) : loading ? (
          <ul className="pg-hm-news" aria-busy="true" aria-label="Carregando novidades">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="pg-hm-face is-loading" />
            ))}
          </ul>
        ) : news.length === 0 ? (
          <p className="pg-hm-state">Nenhuma página publicada ainda.</p>
        ) : (
          <ul className="pg-hm-news" aria-labelledby="pg-hm-news-h">
            {news.map((e) => (
              <li key={e.id} data-reveal="fade">
                <Portrait e={e} meta={e.updatedAt ? pgShortDate(e.updatedAt) : e.type || ""} />
              </li>
            ))}
          </ul>
        )}
        {notes.length > 0 && (
          <>
            <h3 className="pg-hm-sub-h">Escritos recentes</h3>
            <ul className="pg-hm-notes">
              {notes.map((n) => (
                <li key={n.id}>
                  <Link to={n.href}>
                    <span className="pg-hm-note-title">{n.title || "(sem título)"}</span>
                    <span className="pg-hm-note-meta">
                      {kindLabel(n.tipo) + (n.entryTitle ? " · " + n.entryTitle : "") + (n.date ? " · " + pgShortDate(n.date) : "")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="pg-hm-actions">
          <Link className="pg-hm-textlink" to="/wiki">
            Ver tudo na wiki
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Painel dos jogadores. Não mostra nada de ninguém: só o que a própria conta pode abrir. */
function MesaPanel() {
  const { user, ready, profile, openLogin } = useAccount();
  const access = useJogoAccess();
  const f = featuresOf(access);
  if (!ready) return <p className="pg-hm-mesa-text">Carregando…</p>;
  if (!user) {
    return (
      <>
        <p className="pg-hm-mesa-text">Quem joga na mesa guarda as fichas na conta e abre em qualquer aparelho. A conta vem por convite do mestre.</p>
        <div className="pg-hm-mesa-links">
          <button className="pg-btn" type="button" onClick={openLogin}>
            Entrar
          </button>
        </div>
      </>
    );
  }
  const name = profile?.username ? "@" + profile.username : profile?.nickname || null;
  return (
    <>
      <div className="pg-hm-mesa-text">
        <p>{name ? "Olá, " + name + "." : "Olá."}</p>
        {access.kind === "loading" && <p className="pg-hm-mesa-note">Conectando à conta… o servidor pode levar até um minuto pra acordar.</p>}
        {access.kind === "not_invited" && <p className="pg-hm-mesa-note">Sua conta ainda não está na mesa. Fale com o mestre.</p>}
        {access.kind === "error" && <p className="pg-hm-mesa-note">Não consegui falar com a mesa agora. Tente de novo daqui a pouco.</p>}
      </div>
      <div className="pg-hm-mesa-links">
        {f.fichas && (
          <Link className="pg-btn" to="/wiki/_perfil#fichas">
            Minhas fichas
          </Link>
        )}
        {f.mesa && (
          <Link className="pg-btn-line" to="/jogo/mesa">
            Fichas da mesa
          </Link>
        )}
        <Link className="pg-btn-line" to="/wiki/_perfil">
          Meu perfil
        </Link>
      </div>
    </>
  );
}
