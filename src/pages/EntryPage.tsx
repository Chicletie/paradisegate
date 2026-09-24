import { useParams } from "react-router-dom";
import { usePgBody } from "../lib/usePgBody";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";

/**
 * Página de entrada (`/wiki/<slug>`): infobox, abas, epígrafe, diálogos, relações, citações,
 * spoilers, conteúdo restrito, galeria e variantes. Chega na etapa 2 do roteiro
 * (`docs/fase4-site.md` no arvore) — por enquanto só a casca da página.
 */
export function EntryPage() {
  usePgBody();
  const { slug } = useParams();
  return (
    <>
      <PgHeader />
      <div className="pg-page-main">
        <div className="card">
          <p className="empty">A página de “{slug}” chega numa próxima etapa.</p>
        </div>
      </div>
      <PgFooter />
    </>
  );
}
