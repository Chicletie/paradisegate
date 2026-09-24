import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useWikiIndex, hasEvents } from "../lib/wikiIndex";
import { pgPlural } from "../lib/format";

/**
 * Cabeçalho PG (`.pg-mast`, porta de buildPgMast em wiki-core.js, arvore): marca, busca e a
 * barra de categorias/linha do tempo/página aleatória (`.pg-nav`). O menu de conta (entrar/
 * avatar) chega numa próxima etapa (docs/fase4-site.md no arvore, etapa 4).
 */
export function PgHeader() {
  return (
    // "site-header" junto, como o buildPgMast de hoje: é dele que vem o peso 600 da marca.
    <header className="site-header pg-mast">
      <div className="pg-mast-inner">
        <div className="brand">
          <Link to="/wiki">
            <span className="pg-seal" aria-hidden="true">
              <PgStar className="pg-seal-star" />
            </span>
            <span className="pg-wordmark">Paradise Gate</span>
          </Link>
        </div>
        <SearchBox />
      </div>
      <PgNavBar />
    </header>
  );
}

function SearchBox() {
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  return (
    <div className="pg-search-wrap">
      <PgSearchIcon />
      <input
        className="home-search header-search"
        type="search"
        placeholder="Buscar nome, tipo ou tag…"
        aria-label="Buscar"
        value={value}
        onChange={(ev) => setValue(ev.target.value)}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" && value.trim()) navigate(`/wiki?q=${encodeURIComponent(value.trim())}`);
        }}
      />
    </div>
  );
}

/** Porta de pgNavBar: categorias (tipos com mais páginas, até 5; o resto em "Mais"), Linha do
 * tempo (só se houver eventos) e Página aleatória. */
function PgNavBar() {
  const index = useWikiIndex();
  const location = useLocation();
  const curType = location.pathname === "/wiki" ? new URLSearchParams(location.search).get("tipo") : null;

  const types = useMemo(() => {
    if (!index) return [];
    const count: Record<string, number> = {};
    Object.values(index).forEach((e) => {
      if (e.type) count[e.type] = (count[e.type] || 0) + 1;
    });
    return Object.keys(count).sort((a, b) => count[b] - count[a] || a.localeCompare(b));
  }, [index]);

  const showTimeline = !!index && hasEvents(index);
  const [moreOpen, setMoreOpen] = useState(false);

  function typeLink(t: string, className: string) {
    return (
      <Link
        key={t}
        className={className}
        to={`/wiki?tipo=${encodeURIComponent(t)}`}
        aria-current={curType === t ? "page" : undefined}
      >
        {pgPlural(t)}
      </Link>
    );
  }

  return (
    <nav className="pg-nav" aria-label="Navegação da wiki">
      <div className="pg-nav-inner">
        <div className="pg-nav-cats">
          {types.slice(0, 5).map((t) => typeLink(t, "pg-nav-link"))}
          {types.length > 5 && (
            <details className="pg-nav-more" open={moreOpen} onToggle={(ev) => setMoreOpen(ev.currentTarget.open)}>
              <summary className="pg-nav-link">Mais</summary>
              <div className="pg-nav-menu">{types.slice(5).map((t) => typeLink(t, "pg-nav-menu-item"))}</div>
            </details>
          )}
        </div>
        {showTimeline && (
          <Link className="pg-nav-link" to="/wiki/_timeline" aria-current={location.pathname === "/wiki/_timeline" ? "page" : undefined}>
            Linha do tempo
          </Link>
        )}
        <Link className="pg-nav-link" to="/wiki?aleatoria=1">
          Página aleatória
        </Link>
      </div>
    </nav>
  );
}

export function PgStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 1.5c.9 6.1 3.4 8.6 10.5 10.5-7.1 1.9-9.6 4.4-10.5 10.5-.9-6.1-3.4-8.6-10.5-10.5C8.6 10.1 11.1 7.6 12 1.5z" />
    </svg>
  );
}

function PgSearchIcon() {
  return (
    <svg className="pg-search-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth={2} />
      <path d="M15.5 15.5 21 21" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
