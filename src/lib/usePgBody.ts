import { useLayoutEffect } from "react";

const CLASSES = {
  // Toda página da wiki pronta: identidade PG (wiki-core.js: buildPgMast).
  page: ["pg-theme", "pg-site"],
  // A home, com o layout próprio dela (renderHome).
  home: ["pg-theme", "pg-site", "pg-home"],
  // Enquanto carrega, antes do cabeçalho existir (wikiCoreBoot só pôs o pg-theme ainda).
  loading: ["pg-theme"],
};

/**
 * Ativa as classes que o CSS Paradise Gate (src/styles/wiki.css, herdado do arvore) espera no
 * <body> — mesmo mecanismo de wiki-core.js. Efeito de layout: as classes
 * já valem quando outro efeito mede a página (ex.: a home rolando até a lista). `null` = esta
 * tela não mexe nas classes (outra, dentro dela, cuida).
 */
export function usePgBody(kind: keyof typeof CLASSES | null = "page") {
  useLayoutEffect(() => {
    if (!kind) return;
    const classes = CLASSES[kind];
    document.body.classList.add(...classes);
    return () => {
      document.body.classList.remove(...classes);
    };
  }, [kind]);
}
