// Páginas relacionadas (coluna ao lado do texto): as ligadas por relação, depois as que dividem
// tags. Relação em spoiler nunca entra (nem a revelada por temporada: a lista não sabe até onde
// o leitor assistiu), e só entra página que está no índice do mesmo universo.
import type { WikiIndex, WikiLink } from "../types";

export interface RelatedPage {
  id: string;
  title: string;
  type: string;
  cover: string | null;
  coverFocus: { x: number; y: number } | null;
  /** Por que está aqui: o parentesco ("mãe") ou a tag em comum ("#vampiro"). */
  why: string;
}

export function relatedPages(
  selfId: string,
  links: WikiLink[] | undefined,
  backlinks: WikiLink[] | undefined,
  tags: string[],
  index: WikiIndex,
  max = 5,
): RelatedPage[] {
  const self = index[selfId];
  const uni = self?.universeId;
  const out: RelatedPage[] = [];
  const seen = new Set([selfId]);
  const add = (id: string | undefined, why: string) => {
    if (!id || seen.has(id) || out.length >= max) return;
    const e = index[id];
    if (!e || (uni && e.universeId && e.universeId !== uni)) return;
    seen.add(id);
    out.push({ id, title: e.title, type: e.type, cover: e.cover || null, coverFocus: e.coverFocus || null, why });
  };
  [...(links || []), ...(backlinks || [])].forEach((l) => {
    if (l.spoiler || l.at) return;
    add(l.targetId, l.term || l.label || "");
  });
  if (out.length < max && tags.length) {
    const mine = new Set(tags.map((t) => t.toLowerCase()));
    Object.keys(index)
      .map((id) => {
        const common = (index[id].tags || []).filter((t) => mine.has(t.toLowerCase()));
        return { id, common };
      })
      .filter((x) => x.common.length > 0)
      .sort((a, b) => b.common.length - a.common.length || index[a.id].title.localeCompare(index[b.id].title))
      .forEach((x) => add(x.id, "#" + x.common[0]));
  }
  return out;
}
