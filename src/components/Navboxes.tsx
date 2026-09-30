import { Fragment } from "react";
import { Link } from "react-router-dom";
import { useWikiIndex } from "../lib/wikiIndex";
import { navboxesFor } from "../lib/navbox";

/** Caixas de navegação no pé da página (src/lib/navbox.ts): recolhidas; abrir mostra as outras
 * páginas do mesmo grupo ou da mesma tag. */
export function Navboxes({ wikiId }: { wikiId: string }) {
  const index = useWikiIndex();
  const boxes = navboxesFor(index, wikiId);
  if (!boxes.length) return null;
  return (
    <nav className="navboxes" aria-label="Páginas relacionadas">
      {boxes.map((b) => (
        <details key={b.kind + ":" + b.title} className="navbox">
          <summary>
            <span className="navbox-kind">{b.kind === "grupo" ? "Grupo" : "Tag"}</span>
            <span className="navbox-title">{b.kind === "tag" ? "#" + b.title : b.title}</span>
            <span className="navbox-count">{b.rows.reduce((n, r) => n + r.items.length, 0) + " páginas"}</span>
          </summary>
          <div className="navbox-body">
            {b.rows.map((r) => (
              <div key={r.type} className="navbox-row">
                {r.type && <div className="navbox-type">{r.type}</div>}
                <div className="navbox-links">
                  {r.items.map((it, i) => (
                    <Fragment key={it.id}>
                      {i > 0 && <span className="navbox-sep"> · </span>}
                      {it.self ? (
                        <strong aria-current="page">{it.title}</strong>
                      ) : (
                        <Link to={`/wiki/${encodeURIComponent(it.id)}`}>{it.title}</Link>
                      )}
                    </Fragment>
                  ))}
                </div>
              </div>
            ))}
            {b.kind === "tag" && (
              <Link className="navbox-more" to={`/wiki?q=${encodeURIComponent(b.title)}`}>
                {"buscar #" + b.title}
              </Link>
            )}
          </div>
        </details>
      ))}
    </nav>
  );
}
