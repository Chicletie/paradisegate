/**
 * Desfaz o redirecionamento do public/404.html: o GitHub Pages não serve rotas de SPA
 * (`/wiki/<slug>`) como arquivo, então 404.html manda pra `/?p=<caminho original>`. Aqui a
 * gente lê esse `p` e devolve a URL bonita com `history.replaceState`, antes do react-router
 * ler `location` — mesma técnica que `wiki.html` usa hoje contra o `404.html` atual.
 */
export function restorePrettyUrl(
  search: string,
  replaceState: (url: string) => void,
): void {
  const p = new URLSearchParams(search).get("p");
  if (p) replaceState(p);
}
