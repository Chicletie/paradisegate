import { usePgBody } from "../lib/usePgBody";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";

/**
 * Perfil do leitor (`/wiki/_perfil`, âncoras `#sugestoes`/`#favoritos`). Chega na etapa 4 do
 * roteiro (`docs/fase4-site.md` no arvore) — por enquanto só a casca da página.
 */
export function ProfilePage() {
  usePgBody();
  return (
    <>
      <PgHeader />
      <div className="pg-profile">
        <p className="pg-profile-empty">O perfil chega numa próxima etapa.</p>
      </div>
      <PgFooter />
    </>
  );
}
