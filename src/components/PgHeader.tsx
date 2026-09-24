import { Link } from "react-router-dom";

/**
 * Casca do cabeçalho PG (`.pg-mast`, `wiki-style.css`). Busca e menu de conta são função das
 * próximas etapas (home com busca/filtros, login) — aqui só a marca, para o layout já ficar de
 * pé em toda página da wiki.
 */
export function PgHeader() {
  return (
    <header className="pg-mast">
      <div className="pg-mast-inner">
        <div className="brand">
          <Link to="/wiki">
            <span className="pg-seal" aria-hidden="true">
              <PgStar className="pg-seal-star" />
            </span>
            <span className="pg-wordmark">Paradise Gate</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PgStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 1.5c.9 6.1 3.4 8.6 10.5 10.5-7.1 1.9-9.6 4.4-10.5 10.5-.9-6.1-3.4-8.6-10.5-10.5C8.6 10.1 11.1 7.6 12 1.5z" />
    </svg>
  );
}
