import type { WikiIndex } from "../types";
import { fold } from "./search";

export interface NavboxItem {
  id: string;
  title: string;
  /** A própria página (em destaque, sem link). */
  self: boolean;
}
export interface Navbox {
  kind: "grupo" | "tag";
  /** Nome do grupo ou da tag, na grafia desta página. */
  title: string;
  /** Uma linha por tipo de página (Personagem, Local…); `type` vazio quando só há um tipo. */
  rows: { type: string; items: NavboxItem[] }[];
}

const key = (s: string) => fold(s).trim().replace(/\s+/g, " ");

/**
 * Caixas de navegação do pé da página (desde 2026-09-29): uma por grupo com nome (`grupos`,
 * ex. uma equipe) e uma por tag pública desta página, com as outras páginas publicadas do mesmo
 * universo que têm o mesmo grupo ou a mesma tag (sem diferença de maiúscula ou acento). Só sai
 * caixa com pelo menos mais uma página além desta. Lê só o índice: tag em spoiler e grupo que não
 * é público nem chegam lá (docs/dados-da-wiki.md).
 */
export function navboxesFor(index: WikiIndex | null, wikiId: string): Navbox[] {
  const me = index?.[wikiId];
  if (!index || !me) return [];
  const uni = me.universeId || "";
  const same = Object.entries(index).filter(([, e]) => (e.universeId || "") === uni);
  const boxes: Navbox[] = [];
  const seen = new Set<string>();
  function box(kind: Navbox["kind"], title: string, has: (e: (typeof same)[number][1]) => boolean) {
    const k = key(title);
    if (!k || seen.has(k)) return;
    seen.add(k);
    const members = same.filter(([id, e]) => id === wikiId || has(e));
    if (members.length < 2) return;
    const byType = new Map<string, NavboxItem[]>();
    members.forEach(([id, e]) => {
      const t = e.type || "";
      if (!byType.has(t)) byType.set(t, []);
      byType.get(t)!.push({ id, title: e.title, self: id === wikiId });
    });
    const types = Array.from(byType.keys()).sort((a, b) => a.localeCompare(b, "pt-BR"));
    boxes.push({
      kind,
      title,
      rows: types.map((t) => ({
        type: types.length > 1 ? t : "",
        items: byType.get(t)!.sort((a, b) => a.title.localeCompare(b.title, "pt-BR")),
      })),
    });
  }
  (me.grupos || []).forEach((g) => box("grupo", g, (e) => (e.grupos || []).some((x) => key(x) === key(g))));
  (me.tags || []).forEach((t) => box("tag", t, (e) => (e.tags || []).some((x) => key(x) === key(t))));
  return boxes;
}
