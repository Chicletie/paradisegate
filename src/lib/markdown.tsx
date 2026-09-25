import { createContext, useContext, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useSpoilerAt } from "./spoilerProgress";

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
  "(!\\[[^\\]]*\\]\\([^)\\s]+\\)|`[^`]+`|\\[\\[[^\\]\\[]+\\]\\]|\\[[^\\]]+\\]\\((?:https?:|mailto:|wiki:)[^)\\s]+\\)|\\|\\|(?:\\[\\[[^\\]\\[]+\\]\\]|[^|])+\\|\\||\\*\\*[^*]+\\*\\*|__[^_]+__|~~[^~]+~~|\\*[^*\\n]+\\*|(?:^|\\s)_[^_\\n]+_(?=\\s|$))";

/**
 * `||trecho||`: tarja só naquele trecho, lido como markdown por dentro (pode ter link).
 * Escondido, o primeiro toque só revela — nunca segue um link que esteja embaixo da tarja;
 * revelado, um toque fora de link esconde de novo. Na fase de captura, pra rodar antes do
 * clique do `<Link>` do react-router (que navega no próprio onClick).
 */
function InlineSpoiler({ children, at }: { children: ReactNode; at?: string }) {
  const [on, setOn] = useState(false);
  const sp = useSpoilerAt(at);
  // Temporada que o leitor já viu: o trecho aparece aberto, sem tarja.
  if (sp.open) return <span className="md-unlocked">{children}</span>;
  return (
    <span
      className={"md-spoiler" + (on ? " on" : "")}
      tabIndex={0}
      role="button"
      title={sp.label ? "Spoiler de " + sp.label + " — toque pra revelar" : "Spoiler — toque pra revelar"}
      aria-label={sp.label ? "spoiler de " + sp.label + ", toque para revelar" : "spoiler, toque para revelar"}
      onClickCapture={(ev) => {
        if (!on) {
          ev.preventDefault();
          setOn(true);
          return;
        }
        if ((ev.target as Element).closest?.("a")) return;
        setOn(false);
      }}
      onKeyDown={(ev) => {
        if ((ev.key === "Enter" || ev.key === " ") && ev.target === ev.currentTarget) {
          ev.preventDefault();
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
      title={sp.label ? "Spoiler de " + sp.label + " — toque pra revelar" : "Spoiler — toque pra revelar"}
      onClick={() => setOn((v) => !v)}
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
      title={sp.label ? "Spoiler de " + sp.label + " — toque pra revelar" : "Spoiler — toque pra revelar"}
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
 */
export function fieldValue(value: string | undefined): ReactNode {
  const lines = String(value || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return mdInline(lines[0] || "");
  return lines.map((l, i) => (
    <div key={i} className="infobox-alias-line infobox-line">
      • {mdInline(l)}
    </div>
  ));
}

function wikiLinkTarget(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function mdInline(s: string | undefined): ReactNode[] {
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
    if (tok.charAt(0) === "!") {
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
          <Link key={k} className="wl-live" to={`/wiki/${encodeURIComponent(wikiLinkTarget(lm[2].slice(5)))}`}>
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
          {mdInline(sm ? inner.slice(sm[0].length) : inner)}
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

/** Porta de renderMarkdown: parágrafos, cabeçalhos, listas, citação, código, `<hr>` — cada
 * chamada é o próprio `.prose` (mesma unidade que o corpo de um campo/seção/post). */
export function RenderMarkdown({ text }: { text: string | undefined }) {
  const lines = String(text || "").split("\n");
  const blocks: ReactNode[] = [];
  let listBuf: { ordered: boolean; items: string[] } | null = null;
  let blockKey = 0;

  function flushList() {
    if (!listBuf) return;
    const items = listBuf.items;
    blocks.push(
      listBuf.ordered ? (
        <ol key={blockKey++}>
          {items.map((item, i) => (
            <li key={i}>{mdInline(item)}</li>
          ))}
        </ol>
      ) : (
        <ul key={blockKey++}>
          {items.map((item, i) => (
            <li key={i}>{mdInline(item)}</li>
          ))}
        </ul>
      ),
    );
    listBuf = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (/^\s*```/.test(ln)) {
      flushList();
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
      flushList();
      continue;
    }
    if (/^\s*([-*_])\s*\1\s*\1\s*$/.test(ln)) {
      flushList();
      blocks.push(<hr key={blockKey++} />);
      continue;
    }
    const h = ln.match(/^(#{1,6})\s+(.*)/);
    if (h) {
      flushList();
      const level = Math.min(6, h[1].length + 2);
      const HTag = `h${level}` as keyof React.JSX.IntrinsicElements;
      blocks.push(<HTag key={blockKey++}>{mdInline(h[2])}</HTag>);
      continue;
    }
    if (/^\s*>\s?/.test(ln)) {
      flushList();
      blocks.push(<blockquote key={blockKey++}>{mdInline(ln.replace(/^\s*>\s?/, ""))}</blockquote>);
      continue;
    }
    const task = ln.match(/^\s*[-*+]\s+\[([ xX])\]\s+(.*)/);
    const item = ln.match(/^\s*[-*+]\s+(.*)/);
    const oitem = ln.match(/^\s*\d+[.)]\s+(.*)/);
    if (task || item || oitem) {
      const ordered = !!oitem && !item;
      if (!listBuf || listBuf.ordered !== ordered) {
        flushList();
        listBuf = { ordered, items: [] };
      }
      listBuf.items.push(task ? task[2] : item ? item[1] : oitem![1]);
      continue;
    }
    flushList();
    blocks.push(<p key={blockKey++}>{mdInline(ln)}</p>);
  }
  flushList();

  return <div className="prose">{blocks}</div>;
}
