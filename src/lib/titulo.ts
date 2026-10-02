// Título das páginas da wiki (aba do navegador e o que o Google mostra no resultado). Igual ao das
// páginas prontas (WIKI_NAME em scripts/seo.mjs): mudou lá, muda aqui.
export const WIKI_TITULO = "Paradise Gate Wiki";

/** "Dementor Cravensworth · Paradise Gate Wiki"; sem nome, só o da wiki. */
export function tituloWiki(nome?: string | null): string {
  const n = (nome || "").trim();
  return n ? n + " · " + WIKI_TITULO : WIKI_TITULO;
}
