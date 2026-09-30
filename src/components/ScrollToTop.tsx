import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { revealInTabs } from "../lib/markdown";

/**
 * No site de hoje cada link recarrega a página, que abre no topo (ou na âncora, ex.:
 * `#posts`). Numa SPA isso não acontece sozinho: aqui, a cada navegação nova, volta ao topo —
 * ou, com âncora, espera o elemento aparecer (a página carrega os dados depois) e rola até ele.
 * Voltar/avançar (POP) fica com o navegador — menos a primeira carga com âncora (um link
 * de fora pra `/wiki/_perfil#favoritos`), que o navegador não acha sozinho porque a página só
 * monta depois.
 */
export function ScrollToTop() {
  const { pathname, search, hash, key } = useLocation();
  const navType = useNavigationType();
  useLayoutEffect(() => {
    // "default" = a entrada com que a página abriu (o react-router não dá outra chave a ela).
    if (navType === "POP" && !(key === "default" && hash)) return;
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    const timer = window.setInterval(() => {
      // Link antigo de seção (`#sec-geral-lf2-hist-ria…`): acha pelo data-old-id e troca o
      // endereço pela âncora legível de hoje.
      const el = document.getElementById(id) || document.querySelector<HTMLElement>(`[data-old-id="${CSS.escape(id)}"]`);
      if (el || ++tries > 50) {
        window.clearInterval(timer);
        if (!el) return;
        if (el.id !== id) {
          history.replaceState(history.state, "", "#" + el.id);
          const d = el instanceof HTMLDetailsElement ? el : el.closest("details");
          if (d) d.open = true;
          revealInTabs(el.id);
        }
        el.scrollIntoView();
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [pathname, search, hash, key, navType]);
  return null;
}
