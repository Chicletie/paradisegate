import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

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
      const el = document.getElementById(id);
      if (el || ++tries > 50) {
        window.clearInterval(timer);
        el?.scrollIntoView();
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [pathname, search, hash, key, navType]);
  return null;
}
