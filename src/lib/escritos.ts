import type { WikiIndex, WikiIndexEntry, WikiIndexWriting } from "../types";

// Escritos: contos, crônicas, narrações, causos, bastidores… Cada um vem no índice dentro de
// cada página em que aparece (docs/dados-da-wiki.md, "Escritos"); aqui eles são juntados pelo
// id pra lista geral (/wiki/_escritos), o destaque do dia da home e o perfil de quem escreveu.

export const WRITING_KINDS: { id: string; label: string; plural: string; daily: string }[] = [
  { id: "conto", label: "Conto", plural: "Contos", daily: "Conto do dia" },
  { id: "cronica", label: "Crônica", plural: "Crônicas", daily: "Crônica do dia" },
  { id: "narracao", label: "Narração de sessão", plural: "Narrações", daily: "Narração do dia" },
  { id: "causo", label: "Causo de mesa", plural: "Causos", daily: "Causo do dia" },
  { id: "documento", label: "Documento", plural: "Documentos", daily: "Documento do dia" },
  { id: "carta", label: "Carta", plural: "Cartas", daily: "Carta do dia" },
  { id: "poema", label: "Poema ou canção", plural: "Poemas e canções", daily: "Poema do dia" },
  { id: "lenda", label: "Lenda ou mito", plural: "Lendas e mitos", daily: "Lenda do dia" },
  { id: "sonho", label: "Sonho ou visão", plural: "Sonhos e visões", daily: "Sonho do dia" },
  { id: "entrevista", label: "Entrevista", plural: "Entrevistas", daily: "Entrevista do dia" },
  { id: "bastidores", label: "Bastidores", plural: "Bastidores", daily: "" },
  { id: "ese", label: "E se…", plural: "E se…", daily: "" },
];
export const WRITING_CANON: { id: string; label: string }[] = [
  { id: "canonico", label: "canônico" },
  { id: "provavel", label: "provável" },
  { id: "fora", label: "fora do cânone" },
];
export const WRITING_ORIGIN: { id: string; label: string }[] = [
  { id: "mundo", label: "dentro do mundo" },
  { id: "mesa", label: "mesa" },
  { id: "bastidores", label: "bastidores" },
];

const kindOf = (id: string | undefined) => WRITING_KINDS.find((k) => k.id === id);
export const kindLabel = (id: string | undefined) => kindOf(id)?.label || "Escrito";
/** Nome do destaque da home: "Conto do dia", "Causo do dia"… ou "Escrito do dia". */
export const dailyLabel = (id: string | undefined) => kindOf(id)?.daily || "Escrito do dia";
export const canonLabel = (id: string | undefined) => WRITING_CANON.find((c) => c.id === id)?.label || "";
export const originLabel = (id: string | undefined) => WRITING_ORIGIN.find((c) => c.id === id)?.label || "";

/** Um escrito com as páginas (entradas do índice) em que ele aparece. */
export interface Writing extends WikiIndexWriting {
  entries: { id: string; title: string }[];
}

/**
 * Todos os escritos do índice, cada um uma vez, do mais novo pro mais antigo. Página publicada
 * antes dos Escritos só tem `posts`: cada nota vira um escrito sem tipo e sem página própria
 * (o link leva pra nota dentro da página), até ser republicada.
 */
export function writingsFromIndex(index: WikiIndex): Writing[] {
  return writingsFromEntries(Object.keys(index).map((id) => ({ id, ...index[id] })));
}
export function writingsFromEntries(entries: (WikiIndexEntry & { id: string })[]): Writing[] {
  const byId: Record<string, Writing> = {};
  const order: string[] = [];
  entries.forEach((e) => {
    const eid = e.id;
    const ref = { id: eid, title: e.title || "" };
    const list: WikiIndexWriting[] = e.escritos
      ? e.escritos
      : (e.posts || []).map((p) => ({ id: p.id, page: null, title: p.title, date: p.date, excerpt: p.excerpt, vis: "publico" as const }));
    list.forEach((w) => {
      if (!w || !w.id) return;
      const key = String(w.id);
      if (!byId[key]) {
        byId[key] = { ...w, entries: [] };
        order.push(key);
      } else if (!byId[key].page && w.page) {
        byId[key] = { ...w, entries: byId[key].entries };
      }
      if (!byId[key].entries.some((x) => x.id === eid)) byId[key].entries.push(ref);
    });
  });
  return order
    .map((k) => byId[k])
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (a.title || "").localeCompare(b.title || ""));
}

/** Endereço do escrito: a página própria, ou a nota dentro da primeira página ligada. */
export function writingHref(w: Pick<Writing, "id" | "page" | "entries">): string {
  if (w.page) return "/wiki/_escritos/" + encodeURIComponent(w.id);
  const e = w.entries[0];
  return e ? `/wiki/${encodeURIComponent(e.id)}#posts` : "/wiki/_escritos";
}

export interface WritingFilter {
  tipo?: string;
  canone?: string;
  origem?: string;
  tag?: string;
  pagina?: string;
}

export function filterWritings(list: Writing[], f: WritingFilter): Writing[] {
  return list.filter((w) => {
    if (f.tipo && (f.tipo === "-" ? !!w.tipo : (w.tipo || "") !== f.tipo)) return false;
    if (f.canone && w.canone !== f.canone) return false;
    if (f.origem && w.origem !== f.origem) return false;
    if (f.tag && !(w.tags || []).includes(f.tag)) return false;
    if (f.pagina && !w.entries.some((e) => e.id === f.pagina)) return false;
    return true;
  });
}

/** Os tipos que existem na lista, na ordem do seletor, com quantos tem de cada. */
export function kindCounts(list: Writing[]): [string, number][] {
  const n: Record<string, number> = {};
  list.forEach((w) => (n[w.tipo || ""] = (n[w.tipo || ""] || 0) + 1));
  const out: [string, number][] = WRITING_KINDS.filter((k) => n[k.id]).map((k) => [k.id, n[k.id]]);
  if (n[""]) out.push(["", n[""]]);
  return out;
}

export function tagsOf(list: Writing[]): string[] {
  return Array.from(new Set(list.flatMap((w) => w.tags || []))).sort((a, b) => a.localeCompare(b));
}

/** Os escritos assinados por um membro (perfil /@nome). */
export function writingsBy(list: Writing[], name: string): Writing[] {
  return list.filter((w) => w.autor === name);
}

/** Tipo · cânone · origem, numa linha. */
export function writingMarks(w: Pick<WikiIndexWriting, "tipo" | "canone" | "origem">): string {
  return [kindLabel(w.tipo), canonLabel(w.canone), originLabel(w.origem)].filter(Boolean).join(" · ");
}
