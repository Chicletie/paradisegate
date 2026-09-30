// Obras (campanha, livro, série…) e Aparições: textos e agrupamentos puros, sem DOM.
import type { WikiAparicao } from "../types";

/** Como se chama o capítulo na obra: "sessão" numa campanha, "capítulo" no resto. */
export function chapterWord(palavra: string | undefined, plural = false): string {
  const w = palavra === "capítulo" ? "capítulo" : "sessão";
  if (!plural) return w;
  return w === "sessão" ? "sessões" : "capítulos";
}

/** Primeira letra maiúscula ("Sessão 3", "Capítulos"). */
export function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** "estreia: capítulo 2 (Chegada)" — sem título, só o número. */
export function estreiaText(a: WikiAparicao): string {
  if (!a.estreia) return "";
  const w = chapterWord(a.palavra);
  return `estreia: ${w} ${a.estreia.n}` + (a.estreia.titulo ? ` (${a.estreia.titulo})` : "");
}

/** "3 capítulos", "1 sessão". */
export function totalText(a: WikiAparicao): string {
  if (!a.total) return "";
  return `${a.total} ${chapterWord(a.palavra, a.total !== 1)}`;
}

/** Aparições agrupadas por obra, na ordem em que vieram. */
export function groupAparicoes(list: WikiAparicao[] | undefined): { obra: string; obraId: string | null; tipo: string; items: WikiAparicao[] }[] {
  const out: { obra: string; obraId: string | null; tipo: string; items: WikiAparicao[] }[] = [];
  (list || []).forEach((a) => {
    const key = a.obraId || a.obra;
    let g = out.find((x) => (x.obraId || x.obra) === key);
    if (!g) {
      g = { obra: a.obra, obraId: a.obraId || null, tipo: a.tipo || "", items: [] };
      out.push(g);
    }
    g.items.push(a);
  });
  return out;
}
