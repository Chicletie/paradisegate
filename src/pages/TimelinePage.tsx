import { usePgBody } from "../lib/usePgBody";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";

/**
 * Linha do tempo geral (`/wiki/_timeline`, filtro `?ano=`). Chega na etapa 4 do roteiro
 * (`docs/fase4-site.md` no arvore) — por enquanto só a casca da página.
 */
export function TimelinePage() {
  usePgBody();
  return (
    <>
      <PgHeader />
      <div className="pg-page-main">
        <div className="card">
          <p className="empty">A linha do tempo chega numa próxima etapa.</p>
        </div>
      </div>
      <PgFooter />
    </>
  );
}
