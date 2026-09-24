import { useWikiIndex } from "../lib/wikiIndex";
import { objPos } from "../lib/format";

/** Porta de pgFillThumbs: miniatura de 44px (capa ou inicial dourada sobre o azul estrelado)
 * pra um cartão de ligação/afinidade. `null` enquanto o índice carrega ou se a página alvo não
 * está mais no índice. */
export function PgThumb({ wikiId }: { wikiId: string }) {
  const index = useWikiIndex();
  const entry = index?.[wikiId];
  if (!entry) return null;
  return entry.cover ? (
    <img className="pg-lthumb" src={entry.cover} alt="" style={{ objectPosition: objPos(entry.coverFocus) }} />
  ) : (
    <span className="pg-lthumb is-empty" aria-hidden="true">
      {(entry.title || "?").charAt(0)}
    </span>
  );
}
