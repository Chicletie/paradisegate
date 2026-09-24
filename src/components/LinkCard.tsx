import { Link } from "react-router-dom";
import { useWikiIndex } from "../lib/wikiIndex";
import { PgThumb } from "./PgThumb";
import type { WikiLink } from "../types";

/**
 * Porta de linkCard em wiki-core.js (arvore) — cartão de uma ligação (ida) ou "mencionado
 * em" (backlink, `back`): o rótulo de um backlink é do ponto de vista da OUTRA página
 * ("Fulano / é pai/mãe de Beltrano"), não invertido.
 */
export function LinkCard({
  link,
  back,
  pageTitle,
  titleOnly,
}: {
  link: WikiLink;
  back?: boolean;
  pageTitle: string;
  /** Cartão de Afinidade: só o nome, sem rótulo (como no original). */
  titleOnly?: boolean;
}) {
  const index = useWikiIndex();
  const hasThumb = !!(link.targetId && index?.[link.targetId]);
  const label = back ? `${link.label || "menciona"} ${pageTitle}` : link.label || "ligação";
  const kids = titleOnly ? (
    <span className="link-card-title">{link.targetTitle}</span>
  ) : back ? (
    <>
      <span className="link-card-title">{link.targetTitle}</span>
      <span className="link-card-label">{label}</span>
    </>
  ) : (
    <>
      <span className="link-card-label">{label}</span>
      <span className="link-card-title">{link.targetTitle}</span>
    </>
  );
  const className = "link-card" + (back ? " is-back" : "") + (hasThumb ? " has-thumb" : "");
  if (!link.targetId) {
    return (
      <div className={className} style={{ cursor: "default" }} aria-disabled="true">
        {hasThumb && <PgThumb wikiId={link.targetId!} />}
        {kids}
      </div>
    );
  }
  return (
    <Link className={className} to={`/wiki/${encodeURIComponent(link.targetId)}`}>
      {hasThumb && <PgThumb wikiId={link.targetId} />}
      {kids}
    </Link>
  );
}
