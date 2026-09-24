import { useEffect } from "react";
import { Link } from "react-router-dom";
import { usePgBody } from "../lib/usePgBody";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";

/** Porta de showMessage em wiki-core.js (arvore) — usada tanto pra uma rota sem
 * correspondência quanto por EntryPage quando a busca no Firestore falha ou a página não
 * existe mais. */
export function ErrorPage({ message = "Esta página não existe ou ainda não foi publicada." }: { message?: string }) {
  usePgBody();
  useEffect(() => {
    document.title = "Paradise Gate";
  }, []);
  return (
    <>
      <PgHeader />
      <main className="pg-page-main">
        <div className="card">
          <h1 className="pg-msg-title">Página indisponível</h1>
          <div className="empty">{message}</div>
          <div className="pg-msg-actions">
            <Link className="back-home-link" to="/wiki">
              Voltar pro início
            </Link>
            <Link className="back-home-link" to="/wiki?aleatoria=1">
              Página aleatória
            </Link>
          </div>
        </div>
      </main>
      <PgFooter />
    </>
  );
}
