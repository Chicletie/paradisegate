import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { Link } from "react-router-dom";
import { usePgBody } from "../lib/usePgBody";
import { useWikiIndex, useWikiIndexFailed } from "../lib/wikiIndex";
import { dailyHighlights, entriesFromIndex, recentEntries, recentNotes, type DailyHighlights, type HomeEntry } from "../lib/home";
import { objPos, pgShortDate } from "../lib/format";
import { quoteAttrKids, QuoteDialogue } from "../lib/quotes";
import { kindLabel } from "../lib/escritos";
import { arcanaInfo } from "../lib/arcana";
import { useAccount } from "../lib/account";
import { featuresOf, useJogoAccess } from "../jogo/access";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";
import { ArcanaGlyph, PgConstellation, PgNoCover, PgSectionHead, PgStar, PgUserIcon } from "../components/PgIcons";
import { TarotCard } from "../components/TarotCard";
import { homeFaces, isCharacter } from "../home/content";
import { ARCANAS, GRUPOS, IMPULSOS, PERGUNTA_ARCANA, PERGUNTA_NOME, RACAS } from "../home/jogo";
import { startSky } from "../home/sky";
import { pinProgress, portalFrame, trackShift } from "../home/scroll";

/*
 * Home da marca (/): entrar em Paradise Gate é atravessar o portal. O scroll leva a câmera
 * pelo vão do selo; do outro lado, a carta do dia. Depois o mundo, os personagens, as escolhas
 * reais da ficha, a mesa e as novidades. Só dado público: o índice da wiki e o sorteio do dia,
 * os mesmos da /wiki. Céu vivo e sutil (para fora da tela); em prefers-reduced-motion nada anda
 * e o portal vira uma página comum, de cima pra baixo.
 */

const wikiHref = (id: string) => `/wiki/${encodeURIComponent(id)}`;

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
const wide = () => typeof window !== "undefined" && window.matchMedia("(min-width: 760px)").matches;

export function HomePage() {
  usePgBody("page");
  const root = useRef<HTMLDivElement>(null);
  const index = useWikiIndex();
  const failed = useWikiIndexFailed();
  const loading = !index && !failed;
  const entries = useMemo(() => (index ? entriesFromIndex(index) : []), [index]);
  const daily = useMemo(() => (index ? dailyHighlights(entries) : null), [index, entries]);
  const faces = useMemo(() => homeFaces(entries, daily?.char?.id ?? null, undefined, 10), [entries, daily]);
  const characters = useMemo(() => entries.filter(isCharacter).length, [entries]);
  // Quem já aparece no portal ou na galeria não se repete nas Novidades.
  const shown = useMemo(() => new Set([daily?.char?.id, ...faces.map((f) => f.id)].filter((id): id is string => !!id)), [daily, faces]);
  useReveal(root);

  return (
    <div className="pg-hm" ref={root}>
      <StarCursor root={root} />
      <PgHeader />
      <main>
        <Portal daily={daily} />
        <World entries={entries} daily={daily} />
        <Gallery faces={faces} characters={characters} loading={loading} failed={failed} />
        <Game />
        <Mesa />
        <Now entries={entries} skip={shown} loading={loading} failed={failed} />
      </main>
      <PgFooter />
    </div>
  );
}

/** Marca `.pg-hm-anim` antes de pintar (o estado escondido das revelações e o palco preso só
 * valem com ela) e põe `is-in` em cada `[data-reveal]` quando ele entra na tela, uma vez. */
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

/** Chama `onFrame` a cada quadro de scroll (e de resize) enquanto `target` está perto da tela, e
 * de novo quando algo em `deps` muda (conteúdo que chegou e mudou o tamanho). */
function useScrollFrames(target: RefObject<HTMLElement | null>, onFrame: (el: HTMLElement) => void, deps: unknown[] = []) {
  const cb = useRef(onFrame);
  useLayoutEffect(() => {
    cb.current = onFrame;
  });
  useEffect(() => {
    if (target.current) cb.current(target.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    let frame = 0;
    let near = true;
    const run = () => {
      frame = 0;
      cb.current(el);
    };
    const onScroll = () => {
      if (near && !frame) frame = requestAnimationFrame(run);
    };
    const io = new IntersectionObserver(([e]) => {
      near = e.isIntersecting;
      if (near) onScroll();
    }, { rootMargin: "50% 0px 50% 0px" });
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    run();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [target]);
}

/** Ímã leve nos botões grandes: andam até 6px na direção do ponteiro. */
function useMagnet<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !finePointer()) return;
    const move = (ev: PointerEvent) => {
      const b = el.getBoundingClientRect();
      el.style.setProperty("--mx", (((ev.clientX - b.left) / b.width - 0.5) * 12).toFixed(1) + "px");
      el.style.setProperty("--my", (((ev.clientY - b.top) / b.height - 0.5) * 10).toFixed(1) + "px");
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

/** Inclinação e brilho de folha dourada que seguem o ponteiro sobre uma carta. */
function useFoil<T extends HTMLElement>(maxDeg = 10) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !finePointer()) return;
    const move = (ev: PointerEvent) => {
      const b = el.getBoundingClientRect();
      const x = (ev.clientX - b.left) / b.width;
      const y = (ev.clientY - b.top) / b.height;
      el.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
      el.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
      el.style.setProperty("--ry", ((x - 0.5) * 2 * maxDeg).toFixed(2) + "deg");
      el.style.setProperty("--rx", ((0.5 - y) * 2 * maxDeg * 0.8).toFixed(2) + "deg");
      el.classList.add("is-lit");
    };
    const leave = () => {
      el.style.setProperty("--ry", "0deg");
      el.style.setProperty("--rx", "0deg");
      el.classList.remove("is-lit");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [maxDeg]);
  return ref;
}

/** Cursor de estrela (só mouse, fora de reduced-motion): segue com um pouco de atraso e vira
 * um anel sobre o que se clica. O cursor do sistema some só dentro da home. */
function StarCursor({ root }: { root: RefObject<HTMLDivElement | null> }) {
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = root.current;
    const el = dot.current;
    if (!host || !el || reducedMotion() || !finePointer()) return;
    host.classList.add("has-cursor");
    let x = -100;
    let y = -100;
    let tx = -100;
    let ty = -100;
    let frame = 0;
    const tick = () => {
      x += (tx - x) * 0.28;
      y += (ty - y) * 0.28;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.2 ? requestAnimationFrame(tick) : 0;
    };
    const move = (ev: PointerEvent) => {
      if (ev.pointerType !== "mouse") return;
      tx = ev.clientX;
      ty = ev.clientY;
      el.classList.add("is-on");
      const t = ev.target as Element | null;
      el.classList.toggle("is-link", !!t?.closest("a, button, summary, label, [role='button']"));
      el.classList.toggle("is-text", !!t?.closest("input, textarea, [contenteditable='true']"));
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const hide = () => el.classList.remove("is-on");
    const press = () => el.classList.add("is-down");
    const release = () => el.classList.remove("is-down");
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerleave", hide);
    host.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    return () => {
      host.classList.remove("has-cursor");
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", hide);
      host.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [root]);
  return (
    <div className="pg-hm-cursor" ref={dot} aria-hidden="true">
      <PgStar className="pg-hm-cursor-star" />
    </div>
  );
}

/** Título que se escreve letra a letra quando entra na tela. O leitor de tela lê a frase
 * inteira; as letras soltas ficam escondidas dele. */
function SplitText({ text, as: Tag = "h2", className, id, now }: { text: string; as?: "h1" | "h2"; className?: string; id?: string; now?: boolean }) {
  let i = 0;
  const words = text.split(" ");
  return (
    <Tag className={"pg-hm-split " + (className || "")} id={id} data-reveal={now ? undefined : "split"} aria-label={text}>
      {words.map((w, wi) => (
        <Fragment key={wi}>
          <span className="pg-hm-word" aria-hidden="true">
            {Array.from(w).map((ch) => (
              <span key={i} className="pg-hm-ch" style={{ "--i": i++ } as CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}

function Portal({ daily }: { daily: DailyHighlights | null }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLCanvasElement>(null);
  const skyCtl = useRef<ReturnType<typeof startSky> | null>(null);
  const primary = useMagnet<HTMLAnchorElement>();
  const [crossed, setCrossed] = useState(() => reducedMotion());

  useEffect(() => {
    if (!sky.current || !stage.current) return;
    const ctl = startSky(sky.current, stage.current);
    skyCtl.current = ctl;
    return () => {
      ctl.stop();
      skyCtl.current = null;
    };
  }, []);

  useScrollFrames(section, (el) => {
    if (reducedMotion()) return;
    const r = el.getBoundingClientRect();
    const f = portalFrame(pinProgress(r.top, r.height, window.innerHeight));
    el.style.setProperty("--seal", f.seal.toFixed(3));
    el.style.setProperty("--seal-o", f.sealOpacity.toFixed(3));
    el.style.setProperty("--text", f.text.toFixed(3));
    el.style.setProperty("--flash", f.flash.toFixed(3));
    el.style.setProperty("--reveal", f.reveal.toFixed(3));
    el.classList.toggle("is-through", f.reveal > 0.5);
    skyCtl.current?.setWarp(f.warp, 0.4);
    if (f.reveal > 0.01) setCrossed(true);
  });

  return (
    <section className="pg-hm-portal" ref={section} aria-labelledby="pg-hm-title">
      <div className="pg-hm-stage" ref={stage}>
        <canvas className="pg-hm-sky" ref={sky} aria-hidden="true" />
        <PgConstellation />
        <div className="pg-hm-gate" aria-hidden="true">
          <span className="pg-hm-gate-glow" />
          <span className="pg-hm-seal" />
        </div>
        <div className="pg-hm-front">
          <SplitText text="Paradise Gate" as="h1" id="pg-hm-title" className="pg-hm-title" now />
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
        <p className="pg-hm-cue" aria-hidden="true">
          <span>Role pra atravessar</span>
          <span className="pg-hm-cue-line" />
        </p>
        <div className="pg-hm-flash" aria-hidden="true" />
        <Beyond daily={daily} crossed={crossed} />
      </div>
    </section>
  );
}

/** O outro lado do portal: a carta do dia, montada só quando a travessia começa (pra virar
 * na frente de quem chegou). */
function Beyond({ daily, crossed }: { daily: DailyHighlights | null; crossed: boolean }) {
  const card = useFoil<HTMLDivElement>(9);
  const c = daily?.char ?? null;
  return (
    <div className="pg-hm-beyond">
      {c?.cover && <div className="pg-hm-beyond-bg" style={{ backgroundImage: `url("${c.cover}")`, backgroundPosition: objPos(c.coverFocus) }} aria-hidden="true" />}
      <div className="pg-hm-beyond-inner">
        <div className="pg-hm-card pg-hm-foil" ref={card}>
          {crossed && daily ? <TarotCard daily={daily} /> : <CardBack />}
        </div>
        <div className="pg-hm-beyond-text">
          <h2 className="pg-hm-beyond-title">Do outro lado</h2>
          <p>
            Todo dia uma carta nova sai do baralho, a mesma pra quem entrar hoje.
            {c ? " A de hoje é " : ""}
            {c ? <Link to={wikiHref(c.id)}>{c.title}</Link> : null}
            {c ? "." : ""}
          </p>
          <Link className="pg-hm-btn is-primary" to="/wiki">
            Entrar na wiki
          </Link>
        </div>
      </div>
    </div>
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

function World({ entries, daily }: { entries: HomeEntry[]; daily: DailyHighlights | null }) {
  const q = daily?.quote ?? null;
  const attr = q ? quoteAttrKids(q, false) : [];
  return (
    <section className="pg-hm-world" aria-labelledby="pg-hm-world-h">
      <div className="pg-hm-wrap">
        <PgSectionHead text="O mundo" id="pg-hm-world-h" />
        <div className="pg-hm-world-grid">
          <p className="pg-hm-big" data-reveal="lines">
            <span>Paradise Gate acontece aqui, no mundo de hoje.</span> <span>A magia existe e fica escondida;</span>{" "}
            <span>milícias mágicas usam codinomes mitológicos,</span> <span>e uma igreja domina o mundo por trás das instituições.</span>{" "}
            <span>No centro, o drama de personagens presos num sistema corrupto.</span>
          </p>
          <div className="pg-hm-world-side" data-reveal="rise">
            {q && (
              <figure className="pg-hm-quote">
                <span className="pg-hm-quote-mark" aria-hidden="true">
                  “
                </span>
                <blockquote>{q.kind === "dialogo" ? <QuoteDialogue q={q} /> : <p>{q.text}</p>}</blockquote>
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
            {entries.length > 0 && (
              <p className="pg-hm-count">
                <strong>{entries.length.toLocaleString("pt-BR")}</strong> {entries.length === 1 ? "página publicada" : "páginas publicadas"} na wiki, e a história
                continua.
              </p>
            )}
            <div className="pg-hm-actions">
              <Link className="pg-hm-btn is-primary" to="/wiki">
                Abrir a wiki
              </Link>
              <Link className="pg-hm-textlink" to="/wiki?aleatoria=1">
                Página aleatória
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Personagens numa trilha horizontal presa no scroll (telas largas); no celular, uma fileira
 * que se arrasta. */
function Gallery({ faces, characters, loading, failed }: { faces: HomeEntry[]; characters: number; loading: boolean; failed: boolean }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const decide = () => setPinned(!reducedMotion() && wide());
    decide();
    window.addEventListener("resize", decide);
    return () => window.removeEventListener("resize", decide);
  }, []);

  useScrollFrames(section, (el) => {
    const t = track.current;
    if (!t) return;
    if (!pinned) {
      el.style.removeProperty("height");
      t.style.transform = "";
      return;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const run = Math.max(0, t.scrollWidth - vw + 48);
    el.style.height = vh + run + "px";
    const r = el.getBoundingClientRect();
    const p = pinProgress(r.top, r.height, vh);
    t.style.transform = `translate3d(${trackShift(p, t.scrollWidth + 48, vw).toFixed(1)}px, 0, 0)`;
    el.style.setProperty("--gp", p.toFixed(3));
  }, [pinned, faces.length]);

  return (
    <section className={"pg-hm-gallery" + (pinned ? " is-pinned" : "")} ref={section} aria-labelledby="pg-hm-gallery-h">
      <div className="pg-hm-gallery-stage">
        <div className="pg-hm-wrap pg-hm-gallery-head">
          <SplitText text="Os personagens" id="pg-hm-gallery-h" className="pg-hm-display" />
          {characters > 0 && (
            <p className="pg-hm-gallery-note">
              {characters.toLocaleString("pt-BR")} já têm página na wiki. A ordem muda todo dia.
            </p>
          )}
        </div>
        {failed ? (
          <p className="pg-hm-wrap pg-hm-state">Não consegui carregar os personagens agora. Atualize a página pra tentar de novo.</p>
        ) : (
          <ul className="pg-hm-track" ref={track} aria-busy={loading || undefined}>
            {loading
              ? Array.from({ length: 6 }, (_, i) => <li key={i} className="pg-hm-gcard is-loading" />)
              : faces.map((e, i) => <GalleryCard key={e.id} e={e} i={i} />)}
          </ul>
        )}
        {pinned && (
          <div className="pg-hm-wrap" aria-hidden="true">
            <span className="pg-hm-progress" />
          </div>
        )}
      </div>
    </section>
  );
}

function GalleryCard({ e, i }: { e: HomeEntry; i: number }) {
  const foil = useFoil<HTMLAnchorElement>(8);
  const arc = arcanaInfo(e.arcana);
  return (
    <li className="pg-hm-gcard" style={{ "--i": i } as CSSProperties}>
      <Link className="pg-hm-gcard-link pg-hm-foil" to={wikiHref(e.id)} ref={foil} title={arc ? arc.label : undefined}>
        <span className="pg-hm-gcard-img">
          {e.cover ? <img src={e.cover} alt="" loading="lazy" style={{ objectPosition: objPos(e.coverFocus) }} /> : <PgNoCover title={e.title} />}
        </span>
        <span className="pg-hm-gcard-num" aria-hidden="true">
          {arc ? arc.numeral : <PgStar className="pg-hm-gcard-star" />}
        </span>
        <span className="pg-hm-gcard-plate">
          {arc ? <ArcanaGlyph glyph={arc.glyph} className="pg-hm-gcard-glyph" /> : null}
          <span className="pg-hm-gcard-name">{e.title || "(sem título)"}</span>
          {arc ? <span className="pg-sr">{", carta " + arc.label}</span> : null}
        </span>
      </Link>
    </li>
  );
}

function Game() {
  return (
    <section className="pg-hm-game" aria-labelledby="pg-hm-game-h">
      <div className="pg-hm-wrap">
        <div className="pg-hm-game-head">
          <SplitText text={PERGUNTA_NOME} id="pg-hm-game-h" className="pg-hm-display" />
          <p className="pg-hm-game-lede" data-reveal="rise">
            Paradise Gate também é um RPG de mesa. A ficha começa com essa pergunta e segue pelas escolhas que fazem o personagem.
          </p>
        </div>

        <div className="pg-hm-choices">
          <div className="pg-hm-choice" data-reveal="rise">
            <h3>Raça</h3>
            <p className="pg-hm-choice-count">{RACAS.length} raças</p>
            <ul className="pg-hm-names">
              {RACAS.map((r, i) => (
                <li key={r} style={{ "--i": i } as CSSProperties}>
                  {r}
                </li>
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
          <DriveCard key={d.nome} nome={d.nome} subtitulo={d.subtitulo} i={i} />
        ))}
      </ul>
    </div>
  );
}

function DriveCard({ nome, subtitulo, i }: { nome: string; subtitulo: string; i: number }) {
  const foil = useFoil<HTMLDivElement>(7);
  return (
    <li className="pg-hm-drive" style={{ "--i": i } as CSSProperties}>
      <div className="pg-hm-drive-inner">
        <div className="pg-hm-drive-face pg-hm-foil" ref={foil}>
          <PgStar className="pg-hm-drive-star" />
          <span className="pg-hm-drive-name">{nome}</span>
          <span className="pg-hm-drive-sub">{subtitulo}</span>
        </div>
        <div className="pg-hm-drive-back" aria-hidden="true">
          <PgStar className="pg-tarot-back-star" />
        </div>
      </div>
    </li>
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
 * tela; depois de aberto, fica aberto. */
function ArcanaFan() {
  const box = useRef<HTMLDivElement>(null);
  const open = useRef(0);
  const [hover, setHover] = useState<number | null>(null);

  useScrollFrames(box, (el) => {
    if (reducedMotion()) {
      el.style.setProperty("--fan", "1");
      return;
    }
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.75)));
    open.current = Math.max(open.current, 1 - Math.pow(1 - p, 3));
    el.style.setProperty("--fan", open.current.toFixed(3));
  });

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
        {shown ? shown.numeral + " · " + shown.nome : " "}
      </p>
    </div>
  );
}

function Mesa() {
  return (
    <section className="pg-hm-mesa-band" aria-labelledby="pg-hm-mesa-h">
      <div className="pg-hm-wrap">
        <PgSectionHead text="A mesa" id="pg-hm-mesa-h" />
        <div className="pg-hm-mesa" data-reveal="rise">
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
          <p className="pg-hm-state">Nenhuma página nova por enquanto.</p>
        ) : (
          <ul className="pg-hm-news" aria-labelledby="pg-hm-news-h">
            {news.map((e, i) => (
              <li key={e.id} data-reveal="face" style={{ "--i": i } as CSSProperties}>
                <Portrait e={e} meta={e.updatedAt ? pgShortDate(e.updatedAt) : e.type || ""} />
              </li>
            ))}
          </ul>
        )}
        {notes.length > 0 && (
          <Notes>
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
          </Notes>
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

function Notes({ children }: { children: ReactNode }) {
  return (
    <>
      <h3 className="pg-hm-sub-h">Escritos recentes</h3>
      <ul className="pg-hm-notes">{children}</ul>
    </>
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
          <button className="pg-hm-btn" type="button" onClick={openLogin}>
            <PgUserIcon />
            <span>Entrar</span>
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
          <Link className="pg-hm-btn is-primary" to="/wiki/_perfil#fichas">
            Minhas fichas
          </Link>
        )}
        {f.mesa && (
          <Link className="pg-hm-btn" to="/jogo/mesa">
            Fichas da mesa
          </Link>
        )}
        <Link className="pg-hm-btn" to="/wiki/_perfil">
          Meu perfil
        </Link>
      </div>
    </>
  );
}
