import { PgStar } from "./PgHeader";

/** Casca do rodapé PG (`.pg-foot`). A navegação curta (início, linha do tempo, aleatória)
 * entra junto com as páginas que ela leva (fases seguintes). */
export function PgFooter() {
  return (
    <footer className="pg-foot">
      <span className="pg-foot-brand">
        <PgStar className="pg-foot-star" />
        Paradise Gate · Wiki
      </span>
    </footer>
  );
}
