import { usePgBody } from "../lib/usePgBody";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";

/**
 * Home da wiki (`/wiki`). Destaques do dia, busca e filtros chegam na etapa 3 do roteiro
 * (`docs/fase4-site.md` no arvore) — por enquanto só a casca da página, pra rota e o layout
 * existirem.
 */
export function WikiHomePage() {
  usePgBody(true);
  return (
    <>
      <PgHeader />
      <div className="pg-body">
        <main className="pg-main">
          <p className="pg-empty">A home chega numa próxima etapa.</p>
        </main>
      </div>
      <PgFooter />
    </>
  );
}
