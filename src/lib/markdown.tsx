import { useState, type ReactNode } from "react";

// Porta literal da lógica de markdown isolado de wiki-core.js (mdInline/renderMarkdown,
// arvore) — mesmo regex de tokens, mesmo comportamento por token, só trocando construção de
// DOM por elementos React. [[link]] continua como texto simples (.wl-plain): resolver contra
// as ligações da própria entrada (wbUpgradeWikiLinks) fica pra depois.

const INLINE_TOKEN_SOURCE =
  "(!\\[[^\\]]*\\]\\([^)\\s]+\\)|`[^`]+`|\\[\\[[^\\]\\[]+\\]\\]|\\[[^\\]]+\\]\\((?:https?:|mailto:)[^)\\s]+\\)|\\|\\|[^|]+\\|\\||\\*\\*[^*]+\\*\\*|__[^_]+__|~~[^~]+~~|\\*[^*\\n]+\\*|(?:^|\\s)_[^_\\n]+_(?=\\s|$))";

/** Porta de mdInline's próprio `||spoiler||`: alterna revelado/escondido a cada toque
 * (diferente do spoiler de campo/seção, que revela uma vez e fica). */
function ToggleSpoiler({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(false);
  return (
    <span
      className={"md-spoiler" + (on ? " on" : "")}
      tabIndex={0}
      role="button"
      title="Spoiler — toque pra revelar"
      onClick={() => setOn((v) => !v)}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          setOn((v) => !v);
        }
      }}
    >
      {children}
    </span>
  );
}

/** Porta de spoilerInline (campo curto/alcunha da infobox): revela uma vez, não esconde de
 * novo. */
export function RevealSpoiler({ children, preview }: { children: ReactNode; preview?: string }) {
  const [revealed, setRevealed] = useState(false);
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
      title="Spoiler — toque pra revelar"
      onClick={reveal}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") reveal(ev);
      }}
    >
      {preview || "spoiler · toque"}
    </span>
  );
}

/** Porta de spoilerCover: cobre um BLOCO inteiro (campo longo, seção, imagem de galeria) atrás
 * de um botão — revela uma vez. */
export function SpoilerBlock({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className={"spoiler-block" + (revealed ? " revealed" : "")}>
      {revealed ? (
        children
      ) : (
        <button type="button" className="spoiler-reveal" onClick={() => setRevealed(true)}>
          🙈 spoiler, toque para revelar
        </button>
      )}
    </div>
  );
}

/** Porta de spoilerFlag: o emoji ao lado de um título de campo/seção marcado como spoiler. */
export function SpoilerFlag() {
  return (
    <span role="img" aria-label="(spoiler)">
      {" "}
      🙈
    </span>
  );
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
      nodes.push(
        <span key={k} className="wl-plain">
          {disp}
        </span>,
      );
    } else if (tok.charAt(0) === "[") {
      const lm = tok.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (lm)
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
      nodes.push(<ToggleSpoiler key={k}>{tok.slice(2, -2)}</ToggleSpoiler>);
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
