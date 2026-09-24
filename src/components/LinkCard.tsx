import { Fragment } from "react";
import { Link } from "react-router-dom";
import { RevealSpoiler, SpoilerSpan } from "../lib/markdown";
import { useWikiIndex } from "../lib/wikiIndex";
import { PgThumb } from "./PgThumb";
import type { WikiLink } from "../types";

/**
 * Porta de linkCard na wiki original — cartão de uma ligação (ida) ou "mencionado
 * em" (backlink, `back`): o rótulo de um backlink é do ponto de vista da OUTRA página
 * ("Fulano / é pai/mãe de Beltrano"), não invertido.
 */
// "é pai/mãe de" → "pai/mãe de": como o rótulo aparece no cartão quando não há termo.
function relShort(label: string) {
  return label.replace(/^é /, "");
}

/** O rótulo de uma relação no cartão: o termo escolhido ("mãe adotiva") ou o rótulo; disfarce
 * mostra a relação de fachada e esconde só o termo verdadeiro na tarja. */
function RelLabel({ lk }: { lk: WikiLink }) {
  if (lk.spoiler === "disfarce" && lk.cover) {
    return (
      <>
        {relShort(lk.cover) + " "}
        <SpoilerSpan text={"(" + (lk.term || relShort(lk.label || "")) + ")"} />
      </>
    );
  }
  return <>{lk.term || relShort(lk.label || "ligação")}</>;
}

export function LinkCard({
  link,
  more = [],
  back,
  pageTitle,
  titleOnly,
}: {
  link: WikiLink;
  /** Outras relações com a mesma pessoa (mãe adotiva E mentora): um cartão só. */
  more?: WikiLink[];
  back?: boolean;
  pageTitle: string;
  /** Cartão de Afinidade: só o nome, sem rótulo (como no original). */
  titleOnly?: boolean;
}) {
  const index = useWikiIndex();
  const hasThumb = !!(link.targetId && index?.[link.targetId]);
  const all = [link, ...more];
  const plain = all.filter((l) => l.spoiler !== true);
  const hidden = all.filter((l) => l.spoiler === true);
  const label = back ? (
    `${link.label || "menciona"} ${pageTitle}`
  ) : (
    <>
      {plain.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && " · "}
          <RelLabel lk={l} />
        </Fragment>
      ))}
      {hidden.length > 0 && (
        <>
          {plain.length > 0 && " · "}
          <SpoilerSpan text={hidden.map((l) => l.term || relShort(l.label || "")).join(" · ")} />
        </>
      )}
    </>
  );
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
  // Só relações em spoiler com esta pessoa: o cartão inteiro fica atrás da tarja.
  if (!plain.length && !titleOnly) {
    return (
      <div className={className + " is-spoiler"}>
        <RevealSpoiler preview="relação em spoiler · toque">
          {link.targetId ? <Link to={`/wiki/${encodeURIComponent(link.targetId)}`}>{kids}</Link> : kids}
        </RevealSpoiler>
      </div>
    );
  }
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
