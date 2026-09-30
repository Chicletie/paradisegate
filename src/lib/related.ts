// Páginas relacionadas (coluna ao lado do texto), sorteadas por dia (decisão do autor em
// 2026-09-30):
// 1. primeiro as relações da página e as páginas com link no texto;
// 2. só se elas não encherem as vagas, entram as páginas com tags em comum.
// O sorteio é igual pra todo mundo no mesmo dia e muda à meia-noite de Brasília (semente = dia +
// página, como os destaques do dia): nada roda no servidor, cada visita só embaralha a lista.
// Relação em spoiler nunca entra (nem a revelada por temporada: a lista não sabe até onde o
// leitor assistiu), nem link escrito dentro de ||spoiler||, e só entra página do índice do mesmo
// universo.
import { seededShuffle } from "./daily";
import type { WikiIndex, WikiLink } from "../types";

export interface RelatedPage {
  id: string;
  title: string;
  type: string;
  cover: string | null;
  coverFocus: { x: number; y: number } | null;
  /** Por que está aqui: o parentesco ("mãe"), "citado no texto" ou a tag em comum ("#vampiro"). */
  why: string;
}

const SPOILER = /\|\|(?:\[\[[^\]\[]+\]\]|[^|])+\|\|/g;
const WIKI_LINK = /\]\(wiki:([^)#\s]+)/g;

/** As páginas com link no texto (`[nome](wiki:<id>)`), fora dos trechos em spoiler. */
export function textLinks(texts: (string | undefined)[]): string[] {
  const out: string[] = [];
  texts.forEach((t) => {
    for (const m of String(t || "").replace(SPOILER, " ").matchAll(WIKI_LINK)) {
      let id = m[1];
      try {
        id = decodeURIComponent(id);
      } catch {
        /* id já decodificado */
      }
      if (!out.includes(id)) out.push(id);
    }
  });
  return out;
}

export function relatedPages(
  selfId: string,
  opts: { links?: WikiLink[]; backlinks?: WikiLink[]; texts?: (string | undefined)[]; tags?: string[] },
  index: WikiIndex,
  day: string,
  max = 5,
): RelatedPage[] {
  const uni = index[selfId]?.universeId;
  const ok = (id: string | undefined): id is string => {
    const e = id ? index[id] : undefined;
    return !!e && id !== selfId && !(uni && e.universeId && e.universeId !== uni);
  };
  const page = (id: string, why: string): RelatedPage => {
    const e = index[id];
    return { id, title: e.title, type: e.type, cover: e.cover || null, coverFocus: e.coverFocus || null, why };
  };

  // 1. relações e links do texto (a relação vence: diz o parentesco)
  const why = new Map<string, string>();
  [...(opts.links || []), ...(opts.backlinks || [])].forEach((l) => {
    if (l.spoiler || l.at || !ok(l.targetId) || why.has(l.targetId)) return;
    why.set(l.targetId, l.term || l.label || index[l.targetId].type);
  });
  textLinks(opts.texts || []).forEach((id) => {
    if (ok(id) && !why.has(id)) why.set(id, "citado no texto");
  });
  const seed = day + ":" + selfId;
  const first = seededShuffle([...why.keys()].sort(), seed).slice(0, max);
  const out = first.map((id) => page(id, why.get(id)!));
  if (out.length >= max || !opts.tags?.length) return out;

  // 2. tags em comum, só pras vagas que sobraram
  const mine = new Set(opts.tags.map((t) => t.toLowerCase()));
  const common = new Map<string, string>();
  Object.keys(index)
    .sort()
    .forEach((id) => {
      if (!ok(id) || why.has(id)) return;
      const tag = (index[id].tags || []).find((t) => mine.has(t.toLowerCase()));
      if (tag) common.set(id, "#" + tag);
    });
  seededShuffle([...common.keys()], seed + ":tags")
    .slice(0, max - out.length)
    .forEach((id) => out.push(page(id, common.get(id)!)));
  return out;
}
