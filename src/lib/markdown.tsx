import { memberHref } from "./member";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router-dom";
import { useSpoilerAt } from "./spoilerProgress";
import { Lightbox } from "../components/Lightbox";

// Porta literal do markdown da casa de wiki-core.js (mdInline/renderMarkdown/fieldValue,
// wiki original; contrato em docs/dados-da-wiki.md, "Texto dentro da página") — mesmo regex de
// tokens, mesmo comportamento por token, só trocando construção de DOM por elementos React.
// [[link]] continua como texto simples (.wl-plain): a página não está publicada ou o link
// não foi resolvido na publicação — exceto dentro de um WikiLinkUpgrade (abaixo).

/** Título (minúsculo) → wikiId das ligações reais e publicadas da própria entrada. */
const LiveTitlesContext = createContext<Record<string, string> | null>(null);

/**
 * Porta de wbUpgradeWikiLinks: dentro da descrição de um evento já se sabe quais páginas a
 * entrada liga de verdade, então um [[Nome]] cujo texto bate com o título de uma ligação
 * publicada (links ou backlinks) vira link de verdade (.wl-live) em vez de negrito solto.
 */
export function WikiLinkUpgrade({ links, children }: { links: { targetId?: string; targetTitle?: string }[]; children: ReactNode }) {
  const byTitle: Record<string, string> = {};
  links.forEach((lk) => {
    if (lk.targetId) byTitle[(lk.targetTitle || "").toLowerCase()] = lk.targetId;
  });
  return <LiveTitlesContext.Provider value={byTitle}>{children}</LiveTitlesContext.Provider>;
}

/**
 * Páginas cuja tarja o leitor já abriu nesta página (ex.: a linha "||[[Fulano]] (irmão)||" da
 * ficha Família). O cartão de Relações dessa pessoa usa isso pra tirar o disfarce de família:
 * o segredo já foi revelado ali em cima.
 */
const RevealedTargetsContext = createContext<{ ids: ReadonlySet<string>; add: (ids: string[]) => void } | null>(null);

export function RevealedTargetsProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<ReadonlySet<string>>(() => new Set());
  const add = useCallback((more: string[]) => {
    setIds((cur) => (more.every((id) => cur.has(id)) ? cur : new Set([...cur, ...more])));
  }, []);
  return <RevealedTargetsContext.Provider value={{ ids, add }}>{children}</RevealedTargetsContext.Provider>;
}

/** Se a tarja de alguma linha que liga a esta página já foi aberta aqui. */
export function useTargetRevealed(targetId?: string): boolean {
  const ctx = useContext(RevealedTargetsContext);
  return !!(targetId && ctx?.ids.has(targetId));
}

/** Todas as páginas cuja tarja já foi aberta aqui (a árvore genealógica usa pra mostrar o
 * parente revelado na ficha de família). */
export function useRevealedTargetIds(): ReadonlySet<string> {
  return useContext(RevealedTargetsContext)?.ids ?? EMPTY_IDS;
}
const EMPTY_IDS: ReadonlySet<string> = new Set();

/** Os ids das páginas da wiki linkadas dentro de um trecho (hrefs ".../wiki/<id>"). */
function wikiIdsIn(el: Element): string[] {
  const out: string[] = [];
  el.querySelectorAll("a[href]").forEach((a) => {
    const m = /\/wiki\/([^/?#]+)/.exec(a.getAttribute("href") || "");
    if (m) out.push(decodeURIComponent(m[1]));
  });
  return out;
}

function PlainWikiLink({ text }: { text: string }) {
  const id = useContext(LiveTitlesContext)?.[text.toLowerCase()];
  if (id)
    return (
      <Link className="wl-live" to={`/wiki/${encodeURIComponent(id)}`}>
        {text}
      </Link>
    );
  return <span className="wl-plain">{text}</span>;
}

const INLINE_TOKEN_SOURCE =
  "(\\(\\((?:\\[[^\\]]*\\]\\([^)\\s]*\\)|[^()])+\\)\\)|!\\[[^\\]]*\\]\\([^)\\s]+\\)|`[^`]+`|\\[\\[[^\\]\\[]+\\]\\]|\\[[^\\]]+\\]\\((?:https?:|mailto:|wiki:|membro:)[^)\\s]+\\)|\\|\\|(?:\\[\\[[^\\]\\[]+\\]\\]|[^|])+\\|\\||\\*\\*[^*]+\\*\\*|__[^_]+__|~~[^~]+~~|\\*[^*\\n]+\\*|(?:^|\\s)_[^_\\n]+_(?=\\s|$))";

/**
 * `||trecho||`: tarja só naquele trecho, lido como markdown por dentro (pode ter link).
 * Escondido, o primeiro toque só revela — nunca segue um link que esteja embaixo da tarja;
 * revelado, um toque fora de link esconde de novo. Na fase de captura, pra rodar antes do
 * clique do `<Link>` do react-router (que navega no próprio onClick).
 */
function InlineSpoiler({ children, at }: { children: ReactNode; at?: string }) {
  const [on, setOn] = useState(false);
  const sp = useSpoilerAt(at);
  const revealed = useContext(RevealedTargetsContext);
  // Temporada que o leitor já viu: o trecho aparece aberto, sem tarja.
  if (sp.open) return <span className="md-unlocked">{children}</span>;
  return (
    <span
      className={"md-spoiler" + (on ? " on" : "")}
      tabIndex={0}
      role="button"
      title={sp.label ? "Spoiler de " + sp.label + ". Toque para revelar" : "Spoiler. Toque para revelar"}
      aria-label={sp.label ? "spoiler de " + sp.label + ", toque para revelar" : "spoiler, toque para revelar"}
      onClickCapture={(ev) => {
        if (!on) {
          ev.preventDefault();
          setOn(true);
          revealed?.add(wikiIdsIn(ev.currentTarget));
          return;
        }
        if ((ev.target as Element).closest?.("a")) return;
        setOn(false);
      }}
      onKeyDown={(ev) => {
        if ((ev.key === "Enter" || ev.key === " ") && ev.target === ev.currentTarget) {
          ev.preventDefault();
          if (!on) revealed?.add(wikiIdsIn(ev.currentTarget));
          setOn((v) => !v);
        }
      }}
    >
      {children}
    </span>
  );
}

/** Porta de spoilerSpan (tag spoiler): texto puro atrás da tarja, cada toque alterna. */
export function SpoilerSpan({ text, at }: { text: string; at?: string }) {
  const [on, setOn] = useState(false);
  const sp = useSpoilerAt(at);
  if (sp.open) return <span className="md-unlocked">{text}</span>;
  return (
    <span
      className={"md-spoiler" + (on ? " on" : "")}
      tabIndex={0}
      role="button"
      title={sp.label ? "Spoiler de " + sp.label + ". Toque para revelar" : "Spoiler. Toque para revelar"}
      // Dentro de um cartão (que é um link), tocar na tarja só revela: nunca abre a página.
      onClick={(ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        setOn((v) => !v);
      }}
    >
      {text}
    </span>
  );
}

/** Porta de spoilerInline (campo curto/alcunha da infobox): revela uma vez, não esconde de
 * novo. */
export function RevealSpoiler({ children, preview, at }: { children: ReactNode; preview?: string; at?: string }) {
  const [revealed, setRevealed] = useState(false);
  const sp = useSpoilerAt(at);
  if (sp.open) return <>{children}</>;
  if (revealed) return <span className="md-spoiler on">{children}</span>;
  function reveal(ev: { preventDefault?: () => void }) {
    ev.preventDefault?.();
    setRevealed(true);
  }
  return (
    <span
      className="md-spoiler"
      tabIndex={0}
      role="button"
      title={sp.label ? "Spoiler de " + sp.label + ". Toque para revelar" : "Spoiler. Toque para revelar"}
      onClick={reveal}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") reveal(ev);
      }}
    >
      {preview || "spoiler, toque para revelar"}
    </span>
  );
}

/** Porta de spoilerCover: cobre um BLOCO inteiro (campo longo, seção, imagem de galeria) atrás
 * de um botão — revela uma vez. */
export function SpoilerBlock({ children, at }: { children: ReactNode; at?: string }) {
  const [revealed, setRevealed] = useState(false);
  const sp = useSpoilerAt(at);
  if (sp.open) return <>{children}</>;
  return (
    <div className={"spoiler-block" + (revealed ? " revealed" : "")}>
      {revealed ? (
        children
      ) : (
        <button type="button" className="spoiler-reveal" onClick={() => setRevealed(true)}>
          {sp.label ? "spoiler de " + sp.label + ", toque para revelar" : "spoiler, toque para revelar"}
        </button>
      )}
    </div>
  );
}

/**
 * Valor de um campo curto (infobox, taxonomia) — porta de fieldValue: numa linha só, texto
 * corrido; com várias linhas (`\n`), uma por linha com "•" na frente, igual às Alcunhas.
 * Linhas vazias são ignoradas. Cada linha aceita o markdown de linha.
 * Parêntese no fim da linha ("Devon (marido)", "Corte Romena (anteriormente)") sai em letra
 * menor, como o <small> das infobox do Fandom: o nome fica em destaque e o detalhe ocupa menos.
 */
export function fieldValue(value: string | undefined): ReactNode {
  const lines = String(value || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return qualLine(lines[0] || "");
  return lines.map((l, i) => (
    <div key={i} className="infobox-alias-line infobox-line">
      • {qualLine(l)}
    </div>
  ));
}

/** Separa um parêntese final (sem parêntese dentro) do resto da linha. */
export function splitQualifier(line: string): [string, string] | null {
  const m = /^(.*\S)\s+(\([^()]+\))$/.exec(line);
  return m ? [m[1], m[2]] : null;
}

function qualLine(line: string): ReactNode {
  const q = splitQualifier(line);
  if (!q) return mdInline(line);
  return (
    <>
      {mdInline(q[0])} <span className="ib-qual">{mdInline(q[1])}</span>
    </>
  );
}

function wikiLinkTarget(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** wiki:<id> ou wiki:<id>#<âncora> (ex.: uma sessão da temporada, #sessao-<id>) → endereço da página. */
function wikiHref(raw: string): string {
  const i = raw.indexOf("#");
  const id = encodeURIComponent(wikiLinkTarget(i === -1 ? raw : raw.slice(0, i)));
  return "/wiki/" + id + (i === -1 ? "" : "#" + encodeURIComponent(wikiLinkTarget(raw.slice(i + 1))));
}

/** Contador das notas de rodapé de um trecho (numeradas por aba; `prefix` separa as abas). */
export interface FootnoteCounter {
  n: number;
  prefix: string;
}

export function mdInline(s: string | undefined, fn?: FootnoteCounter): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = new RegExp(INLINE_TOKEN_SOURCE, "g");
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  const text = String(s || "");
  while ((m = re.exec(text))) {
    let tok = m[0];
    let at = m.index;
    if (/^\s_/.test(tok)) {
      nodes.push(text.slice(last, at) + tok.charAt(0));
      tok = tok.slice(1);
      last = at + 1;
      at = last;
    } else if (last < at) {
      nodes.push(text.slice(last, at));
    }
    const k = key++;
    if (tok.slice(0, 2) === "((") {
      // Nota de rodapé: número que leva pra lista "Notas" no fim da aba. Fora de um texto com
      // lista (ficha, cartão), a nota fica ali mesmo, entre parênteses.
      const inner = tok.slice(2, -2);
      if (fn) {
        const num = ++fn.n;
        nodes.push(
          <sup key={k} className="md-fn" id={"fnref-" + fn.prefix + num}>
            <a href={"#fn-" + fn.prefix + num} aria-label={"nota " + num}>
              {"[" + num + "]"}
            </a>
          </sup>,
        );
      } else nodes.push(<span key={k} className="md-fn-inline">{[" (", ...mdInline(inner), ")"]}</span>);
    } else if (tok.charAt(0) === "!") {
      const im = tok.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
      if (im) nodes.push(<img key={k} className="wb-img" src={im[2]} alt={im[1] || ""} loading="lazy" />);
    } else if (tok.charAt(0) === "`") {
      nodes.push(
        <code key={k} className="wb-code">
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.slice(0, 2) === "[[") {
      const raw = tok.slice(2, -2);
      const disp = raw.indexOf("|") !== -1 ? raw.split("|")[1].trim() : raw.trim();
      nodes.push(<PlainWikiLink key={k} text={disp} />);
    } else if (tok.charAt(0) === "[") {
      const lm = tok.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      // wiki:<id> = página da própria wiki (o editor só gera pra página publicada): mesma aba.
      if (lm && lm[2].slice(0, 5) === "wiki:")
        nodes.push(
          <Link key={k} className="wl-live" to={wikiHref(lm[2].slice(5))}>
            {lm[1]}
          </Link>,
        );
      // membro:<nome> = perfil público de um membro do acervo (/@nome, escrito [[@nome]] no editor).
      else if (lm && lm[2].slice(0, 7) === "membro:")
        nodes.push(
          <Link key={k} className="wl-live" to={memberHref(lm[2].slice(7).toLowerCase())}>
            {lm[1]}
          </Link>,
        );
      else if (lm)
        nodes.push(
          <a key={k} href={lm[2]} target="_blank" rel="noopener noreferrer">
            {lm[1]}
          </a>,
        );
    } else if (tok.slice(0, 2) === "**" || tok.slice(0, 2) === "__") {
      nodes.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    } else if (tok.slice(0, 2) === "~~") {
      nodes.push(<del key={k}>{tok.slice(2, -2)}</del>);
    } else if (tok.slice(0, 2) === "||") {
      // `||@{<temporada>} trecho||`: spoiler por temporada (a marca nunca aparece).
      const inner = tok.slice(2, -2);
      const sm = /^@\{([^}]*)\}\s*/.exec(inner);
      nodes.push(
        <InlineSpoiler key={k} at={sm ? sm[1] : undefined}>
          {mdInline(sm ? inner.slice(sm[0].length) : inner, fn)}
        </InlineSpoiler>,
      );
    } else {
      nodes.push(<em key={k}>{tok.slice(1, -1)}</em>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Título do markdown: "### Nome {-}" fica fora do índice (a marca não aparece). */
function headingParts(raw: string): { text: string; toc: boolean } {
  const m = /\s*\{-\}\s*$/.exec(raw);
  return m ? { text: raw.slice(0, m.index), toc: false } : { text: raw, toc: true };
}
/** Texto simples de um trecho de markdown da casa (pro índice). */
export function mdPlain(s: string): string {
  return String(s || "")
    .replace(/\(\((?:\[[^\]]*\]\([^)\s]*\)|[^()])+\)\)/g, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2")
    .replace(/\|\|(@\{[^}]*\}\s*)?/g, "")
    .replace(/[*_~`]/g, "")
    .trim();
}
function anchorSlug(s: string): string {
  return mdPlain(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30);
}
/** Os títulos de um texto, na ordem, com a âncora que RenderMarkdown dá a cada um (`base`
 * igual). `level` = número de # (1–6); `toc` = entra no índice. */
export function markdownHeadings(text: string | undefined, base: string): { level: number; text: string; id: string; toc: boolean }[] {
  const out: { level: number; text: string; id: string; toc: boolean }[] = [];
  let fence = false;
  String(text || "")
    .split("\n")
    .forEach((ln) => {
      if (/^\s*```/.test(ln)) {
        fence = !fence;
        return;
      }
      if (fence) return;
      const h = ln.match(/^(#{1,6})\s+(.*)/);
      if (!h) return;
      const p = headingParts(h[2]);
      out.push({ level: h[1].length, text: mdPlain(p.text), id: base + "h" + out.length + "-" + anchorSlug(p.text), toc: p.toc });
    });
  return out;
}

/** As notas de rodapé de um texto, na ordem em que o texto numera. `at`: a nota estava dentro
 * de um spoiler (true = spoiler comum; texto = id da temporada) e fica na tarja na lista. */
export function footnotesOf(text: string | undefined): { text: string; at?: string | true }[] {
  const out: { text: string; at?: string | true }[] = [];
  function walk(s: string, at?: string | true) {
    const re = new RegExp(INLINE_TOKEN_SOURCE, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) {
      const tok = m[0].replace(/^\s_/, "_");
      if (tok.slice(0, 2) === "((") out.push({ text: tok.slice(2, -2), at });
      else if (tok.slice(0, 2) === "||") {
        const inner = tok.slice(2, -2);
        const sm = /^@\{([^}]*)\}\s*/.exec(inner);
        walk(sm ? inner.slice(sm[0].length) : inner, at || (sm ? sm[1] : true));
      }
    }
  }
  let fence = false;
  String(text || "")
    .split("\n")
    .forEach((ln) => {
      if (/^\s*```/.test(ln)) {
        fence = !fence;
        return;
      }
      if (!fence) walk(ln);
    });
  return out;
}

const QUOTE_BY = /^\s*(?:[—―–]|--)\s*/;
/** `![legenda](url)` sozinha na linha, com legenda: figura ao lado do texto. */
const FIGURE_LINE = /^\s*!\[([^\]]*\S[^\]]*)\]\(([^)\s]+)\)\s*$/;
const TAB_START = /^\s*::aba\s+(.*\S)\s*$/;
const TAB_END = /^\s*::fim-abas\s*$/;

/** Evento que pede pra mostrar um ponto da página que pode estar dentro de uma aba fechada
 * (índice, nota de rodapé). `detail` = id do elemento. */
const WIKI_REVEAL = "wiki-reveal";
/** Abre a aba (de dentro de uma seção) onde mora o elemento `id`, antes de rolar até ele. */
export function revealInTabs(id: string) {
  window.dispatchEvent(new CustomEvent(WIKI_REVEAL, { detail: id }));
}

/** Figura do texto: pequena à direita (largura cheia no celular), legenda embaixo; clicar
 * amplia. */
function Figure({ url, caption }: { url: string; caption: string }) {
  const [zoom, setZoom] = useState(false);
  const plain = mdPlain(caption);
  return (
    <figure className="md-figure">
      <button type="button" className="md-figure-zoom" aria-label={"Ampliar imagem: " + plain} onClick={() => setZoom(true)}>
        <img src={url} alt={plain} loading="lazy" />
      </button>
      <figcaption>{mdInline(caption)}</figcaption>
      {zoom && <Lightbox items={[{ url, caption: plain }]} onClose={() => setZoom(false)} />}
    </figure>
  );
}

/** Abas dentro de uma seção (`::aba Nome` … `::fim-abas`). Todas as abas ficam na página (a
 * busca do navegador acha o texto); a fechada só fica escondida. Um título ou nota de dentro
 * de uma aba fechada abre a aba certa antes de rolar. */
function SectionTabs({ tabs }: { tabs: { name: string; body: ReactNode[] }[] }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    function show(id: string) {
      if (!id) return;
      const k = panels.current.findIndex((p) => !!p && !!p.querySelector("#" + CSS.escape(id)));
      if (k < 0 || !panels.current[k]!.hidden) return;
      // abre já (antes do navegador pular pra âncora) e rola até o ponto
      flushSync(() => setActive(k));
      document.getElementById(id)?.scrollIntoView();
    }
    const onReveal = (ev: Event) => show(String((ev as CustomEvent).detail || ""));
    const onHash = () => show(decodeURIComponent(location.hash.slice(1)));
    window.addEventListener(WIKI_REVEAL, onReveal);
    window.addEventListener("hashchange", onHash);
    const first = setTimeout(onHash, 0); // página aberta já com #âncora
    return () => {
      clearTimeout(first);
      window.removeEventListener(WIKI_REVEAL, onReveal);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);
  function onKey(ev: React.KeyboardEvent<HTMLButtonElement>, k: number) {
    const d = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    const n = (k + d + tabs.length) % tabs.length;
    setActive(n);
    (ev.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus();
  }
  return (
    <div className="md-tabs">
      <div className="md-tabs-bar" role="tablist">
        {tabs.map((t, k) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={base + "t" + k}
            aria-controls={base + "p" + k}
            aria-selected={k === active}
            tabIndex={k === active ? 0 : -1}
            className={"work-tab" + (k === active ? " on" : "")}
            onClick={() => setActive(k)}
            onKeyDown={(ev) => onKey(ev, k)}
          >
            {mdInline(t.name)}
          </button>
        ))}
      </div>
      {tabs.map((t, k) => (
        <div
          key={k}
          ref={(el) => {
            panels.current[k] = el;
          }}
          role="tabpanel"
          id={base + "p" + k}
          aria-labelledby={base + "t" + k}
          className="md-tab-panel"
          hidden={k !== active}
        >
          {t.body}
        </div>
      ))}
    </div>
  );
}

/** Porta de renderMarkdown: parágrafos, cabeçalhos, listas, citação, código, `<hr>` — cada
 * chamada é o próprio `.prose` (mesma unidade que o corpo de um campo/seção/post).
 * `anchorBase` dá âncora aos títulos (pro índice); `fnPrefix`/`fnStart` numeram as notas de
 * rodapé (a lista fica no fim da aba, ver ArticleBundle). */
export function RenderMarkdown({ text, anchorBase, fnPrefix, fnStart = 0 }: { text: string | undefined; anchorBase?: string; fnPrefix?: string; fnStart?: number }) {
  const lines = String(text || "").split("\n");
  const blocks: ReactNode[] = [];
  let listBuf: { ordered: boolean; items: string[] } | null = null;
  let blockKey = 0;
  const fn: FootnoteCounter | undefined = fnPrefix != null ? { n: fnStart, prefix: fnPrefix } : undefined;
  const md = (s: string) => mdInline(s, fn);
  let headingN = 0;

  function flushList(blocks: ReactNode[]) {
    if (!listBuf) return;
    const items = listBuf.items;
    blocks.push(
      listBuf.ordered ? (
        <ol key={blockKey++}>
          {items.map((item, i) => (
            <li key={i}>{md(item)}</li>
          ))}
        </ol>
      ) : (
        <ul key={blockKey++}>
          {items.map((item, i) => (
            <li key={i}>{md(item)}</li>
          ))}
        </ul>
      ),
    );
    listBuf = null;
  }

  // Um texto (ou uma aba dele): os contadores de título e de nota seguem a ordem do texto
  // inteiro, igual a markdownHeadings e footnotesOf.
  function parse(lines: string[], blocks: ReactNode[], inTab: boolean) {
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      if (!inTab && TAB_START.test(ln)) {
        // "::aba Nome" … "::fim-abas" (ou o fim do texto): cada "::aba" começa uma aba
        flushList(blocks);
        const tabs: { name: string; lines: string[] }[] = [];
        let fence = false;
        for (; i < lines.length; i++) {
          const l = lines[i];
          if (/^\s*```/.test(l)) fence = !fence;
          if (!fence && TAB_END.test(l)) break;
          const t = fence ? null : TAB_START.exec(l);
          if (t) tabs.push({ name: t[1], lines: [] });
          else tabs[tabs.length - 1].lines.push(l);
        }
        blocks.push(
          <SectionTabs
            key={blockKey++}
            tabs={tabs.map((t) => {
              const body: ReactNode[] = [];
              parse(t.lines, body, true);
              flushList(body);
              return { name: t.name, body };
            })}
          />,
        );
        continue;
      }
      if (TAB_END.test(ln)) continue;
      if (/^\s*```/.test(ln)) {
        flushList(blocks);
        const buf: string[] = [];
        i++;
        while (i < lines.length && !/^\s*```/.test(lines[i])) {
          buf.push(lines[i]);
          i++;
        }
        blocks.push(
          <pre key={blockKey++}>
            <code>{buf.join("\n")}</code>
          </pre>,
        );
        continue;
      }
      if (/^\s*$/.test(ln)) {
        flushList(blocks);
        continue;
      }
      if (/^\s*([-*_])\s*\1\s*\1\s*$/.test(ln)) {
        flushList(blocks);
        blocks.push(<hr key={blockKey++} />);
        continue;
      }
      const h = ln.match(/^(#{1,6})\s+(.*)/);
      if (h) {
        flushList(blocks);
        const level = Math.min(6, h[1].length + 2);
        const HTag = `h${level}` as keyof React.JSX.IntrinsicElements;
        const hp = headingParts(h[2]);
        const hid = anchorBase != null ? anchorBase + "h" + headingN + "-" + anchorSlug(hp.text) : undefined;
        headingN++;
        blocks.push(
          <HTag key={blockKey++} id={hid}>
            {md(hp.text)}
          </HTag>,
        );
        continue;
      }
      // "::principal [[Página]]" / "::ver [[A]], [[B]]": linha discreta mandando pra outra página
      const hat = ln.match(/^\s*::(principal|ver)\s+(.*)$/);
      if (hat) {
        flushList(blocks);
        blocks.push(
          <p key={blockKey++} className="md-hatnote">
            {hat[1] === "principal" ? "Artigo principal: " : "Ver também: "}
            {md(hat[2])}
          </p>,
        );
        continue;
      }
      if (/^\s*>\s?/.test(ln)) {
        flushList(blocks);
        // linhas ">" seguidas são uma citação só; a última começando com "—" é quem disse
        const q: string[] = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) q.push(lines[i++].replace(/^\s*>\s?/, ""));
        i--;
        while (q.length && !q[q.length - 1].trim()) q.pop();
        const by = q.length > 1 && QUOTE_BY.test(q[q.length - 1]) ? q.pop()!.replace(QUOTE_BY, "") : null;
        if (!by && q.length === 1) {
          blocks.push(<blockquote key={blockKey++}>{md(q[0])}</blockquote>);
          continue;
        }
        const paras: string[][] = [[]];
        q.forEach((l) => (l.trim() ? paras[paras.length - 1].push(l) : paras[paras.length - 1].length && paras.push([])));
        blocks.push(
          <blockquote key={blockKey++} className="md-quote">
            {paras
              .filter((p) => p.length)
              .map((p, pi) => (
                <p key={pi}>{md(p.join(" "))}</p>
              ))}
            {by && <footer className="md-quote-by">{["— ", ...md(by)]}</footer>}
          </blockquote>,
        );
        continue;
      }
      const task = ln.match(/^\s*[-*+]\s+\[([ xX])\]\s+(.*)/);
      const item = ln.match(/^\s*[-*+]\s+(.*)/);
      const oitem = ln.match(/^\s*\d+[.)]\s+(.*)/);
      if (task || item || oitem) {
        const ordered = !!oitem && !item;
        if (!listBuf || listBuf.ordered !== ordered) {
          flushList(blocks);
          listBuf = { ordered, items: [] };
        }
        listBuf.items.push(task ? task[2] : item ? item[1] : oitem![1]);
        continue;
      }
      flushList(blocks);
      const fig = FIGURE_LINE.exec(ln);
      if (fig) {
        blocks.push(<Figure key={blockKey++} url={fig[2]} caption={fig[1]} />);
        continue;
      }
      blocks.push(<p key={blockKey++}>{md(ln)}</p>);
    }
  }
  parse(lines, blocks, false);
  flushList(blocks);

  return <div className="prose">{blocks}</div>;
}
