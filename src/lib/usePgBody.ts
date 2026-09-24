import { useEffect } from "react";

/**
 * Ativa as classes que o CSS Paradise Gate (src/styles/wiki.css, herdado do arvore) espera no
 * <body>: `pg-theme` + `pg-site` em toda página da wiki, e `pg-home` só na home — mesmo
 * mecanismo de wiki-core.js (buildPgMast / renderHome), sem o modo Ursprung.
 */
export function usePgBody(isHome = false) {
  useEffect(() => {
    const classes = isHome ? ["pg-theme", "pg-site", "pg-home"] : ["pg-theme", "pg-site"];
    document.body.classList.add(...classes);
    return () => {
      document.body.classList.remove(...classes);
    };
  }, [isHome]);
}
