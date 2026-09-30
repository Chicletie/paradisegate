import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { objPos } from "../lib/format";
import { relatedPages } from "../lib/related";
import { useWikiIndex } from "../lib/wikiIndex";
import type { WikiLink } from "../types";
import { openFor, type TocItem } from "./ArticleBundle";

/**
 * Coluna ao lado do texto, embaixo da ficha (só em tela larga; ver `.entry-main` no wiki.css):
 * páginas relacionadas e o índice que acompanha a leitura, marcando a seção em que o leitor
 * está (2026-09-30: depois da ficha sobrava uma faixa vazia).
 */
export function PageRail({ wikiId, toc, links, backlinks, tags }: { wikiId: string; toc: TocItem[]; links?: WikiLink[]; backlinks?: WikiLink[]; tags: string[] }) {
  const index = useWikiIndex();
  const related = index ? relatedPages(wikiId, links, backlinks, tags, index) : [];
  return (
    <div className="page-rail">
      {related.length > 0 && (
        <nav className="rail-box rail-related" aria-label="Páginas relacionadas">
          <div className="rail-head">Relacionadas</div>
          <ul>
            {related.map((r) => (
              <li key={r.id}>
                <Link to={`/wiki/${encodeURIComponent(r.id)}`}>
                  {r.cover ? <img src={r.cover} alt="" loading="lazy" style={{ objectPosition: objPos(r.coverFocus) }} /> : <span className="rail-noimg" aria-hidden="true">{r.title.charAt(0)}</span>}
                  <span className="rail-rel-text">
                    <span className="rail-rel-title">{r.title}</span>
                    <span className="rail-rel-why">{r.why || r.type}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {toc.length > 1 && <RailToc toc={toc} />}
    </div>
  );
}

/** Índice que fica parado na coluna enquanto se rola; abre os subtítulos da seção atual. */
function RailToc({ toc }: { toc: TocItem[] }) {
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => {
    const ids = toc.flatMap((t) => [t.id, ...(t.subs || []).map((s) => s.id)]);
    let frame = 0;
    const update = () => {
      frame = 0;
      let cur: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        // fora da aba aberta ou dentro de seção fechada: não conta
        if (!el || !el.offsetParent) continue;
        if (el.getBoundingClientRect().top <= 120) cur = id;
      }
      setCurrent(cur);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [toc]);
  const activeTop = toc.find((t) => t.id === current || (t.subs || []).some((s) => s.id === current))?.id;
  return (
    <nav className="rail-box rail-toc" aria-label="Nesta página">
      <div className="rail-head">Nesta página</div>
      <ol>
        {toc.map((t) => (
          <li key={t.id} className={t.id === activeTop ? "on" : undefined}>
            <a href={`#${t.id}`} onClick={() => openFor(t.id)} aria-current={t.id === current ? "location" : undefined}>
              {t.label}
            </a>
            {t.id === activeTop && t.subs && (
              <ol>
                {t.subs.map((s) => (
                  <li key={s.id} className={(s.deep ? "deep" : "") + (s.id === current ? " on" : "") || undefined}>
                    <a href={`#${s.id}`} onClick={() => openFor(s.id)} aria-current={s.id === current ? "location" : undefined}>
                      {s.label}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
