import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useWikiIndex, hasEvents } from "../lib/wikiIndex";
import { pgPlural } from "../lib/format";
import { searchHref } from "../lib/search";
import { PgSearchIcon } from "./PgIcons";
import { LoginBar } from "./AccountMenu";
import { featuresOf, useJogoAccess } from "../jogo/access";

/** Busca controlada por quem chama (a home: filtra a lista a cada letra; Enter abre a busca). */
export interface HeaderSearch {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Cabeçalho PG (`.pg-mast`, porta de buildPgMast na wiki original): marca, busca e a
 * barra de categorias/linha do tempo/página aleatória (`.pg-nav`), e o "Entrar"/menu da conta
 * no canto (mountLoginBar).
 */
export function PgHeader({ search }: { search?: HeaderSearch }) {
  return (
    // "site-header" junto, como o buildPgMast de hoje: é dele que vem o peso 600 da marca.
    <header className="site-header pg-mast">
      <div className="pg-mast-inner">
        <div className="brand">
          <Link to="/wiki">
            <span className="pg-seal" aria-hidden="true">
              <span className="pg-mark" />
            </span>
            <span className="pg-wordmark">Paradise Gate</span>
          </Link>
        </div>
        {search ? <HomeSearch search={search} /> : <SearchBox />}
        <LoginBar />
      </div>
      <PgNavBar />
    </header>
  );
}

// Na home a lista filtra a cada letra; Enter abre a página de busca com a mesma palavra.
function HomeSearch({ search }: { search: HeaderSearch }) {
  const navigate = useNavigate();
  return (
    <SearchInput
      value={search.value}
      onChange={search.onChange}
      onEnter={() => {
        if (search.value.trim()) navigate(searchHref(search.value));
      }}
    />
  );
}

// Fora da home: Enter abre a página de busca.
function SearchBox() {
  const location = useLocation();
  const onSearchPage = location.pathname === "/wiki/_busca";
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  return (
    <SearchInput
      value={value}
      onChange={setValue}
      onEnter={() => {
        if (value.trim()) {
          navigate(searchHref(value));
          if (onSearchPage) setValue("");
        }
      }}
    />
  );
}

function SearchInput({ value, onChange, onEnter }: { value: string; onChange: (v: string) => void; onEnter?: () => void }) {
  return (
    <div className="pg-search-wrap">
      <PgSearchIcon />
      <input
        className="home-search header-search"
        type="search"
        placeholder="Buscar nome, tipo ou tag…"
        aria-label="Buscar"
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" && onEnter) onEnter();
        }}
      />
    </div>
  );
}

/** Porta de pgNavBar: categorias (tipos com mais páginas, até 5; o resto em "Mais"), Fichas da
 * mesa (só pro mestre), Linha do tempo (só se houver eventos), Escritos e Página aleatória. */
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
  const showWritings = !!index && Object.values(index).some((e) => (e.escritos || e.posts || []).length > 0);
  const [moreOpen, setMoreOpen] = useState(false);
  // Fichas da mesa: o link aparece quando a API diz (features.mesa, hoje só o mestre).
  const mestre = featuresOf(useJogoAccess()).mesa;

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
        {mestre && (
          <Link className="pg-nav-link" to="/jogo/mesa" aria-current={location.pathname === "/jogo/mesa" ? "page" : undefined}>
            Fichas da mesa
          </Link>
        )}
        {showTimeline && (
          <Link className="pg-nav-link" to="/wiki/_timeline" aria-current={location.pathname === "/wiki/_timeline" ? "page" : undefined}>
            Linha do tempo
          </Link>
        )}
        {showWritings && (
          <Link className="pg-nav-link" to="/wiki/_escritos" aria-current={location.pathname.startsWith("/wiki/_escritos") ? "page" : undefined}>
            Escritos
          </Link>
        )}
        <Link className="pg-nav-link" to="/wiki?aleatoria=1">
          Página aleatória
        </Link>
      </div>
    </nav>
  );
}
