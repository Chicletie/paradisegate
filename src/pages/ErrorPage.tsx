import { Link } from "react-router-dom";
import { usePgBody } from "../lib/usePgBody";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";

/** Página de erro (rota sem página correspondente na wiki). */
export function ErrorPage() {
  usePgBody();
  return (
    <>
      <PgHeader />
      <div className="pg-page-main">
        <div className="card">
          <h1 className="pg-msg-title">Página não encontrada</h1>
          <p className="empty">Esta página não existe ou ainda não foi publicada.</p>
          <p className="pg-msg-actions">
            <Link className="back-home-link" to="/wiki">
              Voltar pro início
            </Link>
          </p>
        </div>
      </div>
      <PgFooter />
    </>
  );
}
