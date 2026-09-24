import type { HomeEntry } from "./home";

/*
 * Busca de verdade (`/wiki/_busca`): cada palavra da busca tem que aparecer em algum lugar da
 * página (título, tag, tipo, título de nota ou texto), sem ligar pra acento nem maiúscula. A
 * ordem vem de onde ela apareceu: no título vale muito mais do que perdida no meio do texto.
 * O texto indexado já vem do editor sem spoiler nem conteúdo restrito.
 */

const MARKS = /[̀-ͯ]/g;

/** Endereço da página de busca pra um texto. */
export function searchHref(q: string): string {
  return "/wiki/_busca?q=" + encodeURIComponent(q.trim());
}

export function fold(s: string | undefined | null): string {
  return String(s || "")
    .normalize("NFD")
    .replace(MARKS, "")
    .toLowerCase();
}

/** Palavras da busca, sem acento, sem repetir, sem as muito curtas soltas ("a", "e", "o"). */
export function terms(query: string): string[] {
  const all = fold(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  const kept = all.filter((t) => t.length > 1);
  return Array.from(new Set(kept.length ? kept : all));
}

export interface Segment {
  text: string;
  hit: boolean;
}
export interface SearchResult {
  e: HomeEntry;
  score: number;
  /** O título bate exatamente com a busca. */
  exact: boolean;
  /** Trecho do texto em volta da primeira palavra achada, com as achadas marcadas. */
  snippet: Segment[] | null;
  /** Tags que bateram (aparecem no resultado). */
  tagHits: string[];
}

function wordStarts(hay: string, t: string): boolean {
  return hay === t || hay.startsWith(t) || hay.includes(" " + t);
}

function countIn(hay: string, t: string, cap: number): number {
  let n = 0;
  let i = hay.indexOf(t);
  while (i !== -1 && n < cap) {
    n++;
    i = hay.indexOf(t, i + t.length);
  }
  return n;
}

/** Texto sem acento com o mapa de volta pra posição no original (pra marcar o trecho certo). */
function foldMap(text: string): { folded: string; map: number[] } {
  let folded = "";
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const f = fold(text[i]);
    for (let k = 0; k < f.length; k++) map.push(i);
    folded += f;
  }
  map.push(text.length);
  return { folded, map };
}

/** Trecho de ~180 letras em volta da primeira palavra achada, com todas as achadas marcadas. */
export function snippet(text: string | undefined, ts: string[], size = 180): Segment[] | null {
  if (!text || !ts.length) return null;
  const { folded, map } = foldMap(text);
  let first = -1;
  ts.forEach((t) => {
    const i = folded.indexOf(t);
    if (i !== -1 && (first === -1 || i < first)) first = i;
  });
  if (first === -1) return null;
  let start = Math.max(0, map[first] - Math.round(size * 0.35));
  let end = Math.min(text.length, start + size);
  if (start > 0) {
    const sp = text.indexOf(" ", start);
    if (sp !== -1 && sp < map[first]) start = sp + 1;
  }
  if (end < text.length) {
    const sp = text.lastIndexOf(" ", end);
    if (sp > map[first]) end = sp;
  }
  // Marca cada ocorrência de cada palavra dentro da janela.
  const on = new Array(end - start).fill(false);
  ts.forEach((t) => {
    let i = folded.indexOf(t);
    while (i !== -1) {
      const a = map[i];
      const b = map[i + t.length];
      for (let k = Math.max(a, start); k < Math.min(b, end); k++) on[k - start] = true;
      i = folded.indexOf(t, i + t.length);
    }
  });
  const out: Segment[] = [];
  if (start > 0) out.push({ text: "…", hit: false });
  for (let k = 0; k < on.length; k++) {
    const ch = text[start + k];
    const last = out[out.length - 1];
    if (last && last.hit === on[k] && !(k === 0 && start > 0)) last.text += ch;
    else out.push({ text: ch, hit: on[k] });
  }
  if (end < text.length) out.push({ text: "…", hit: false });
  return out;
}

export function scoreEntry(e: HomeEntry, query: string, ts: string[]): SearchResult | null {
  if (!ts.length) return null;
  const title = fold(e.title);
  const type = fold(e.type);
  const tags = (e.tags || []).map(fold);
  const posts = fold((e.posts || []).map((p) => p.title).join(" "));
  const text = fold(e.search);
  const q = fold(query).trim();
  let score = 0;
  const tagHits: string[] = [];
  for (const t of ts) {
    let s = 0;
    if (wordStarts(title, t)) s += 120;
    else if (title.includes(t)) s += 80;
    tags.forEach((tg, i) => {
      if (tg === t) s += 60;
      else if (tg.includes(t)) s += 40;
      else return;
      const orig = (e.tags || [])[i];
      if (tagHits.indexOf(orig) === -1) tagHits.push(orig);
    });
    if (type.includes(t)) s += 30;
    if (posts.includes(t)) s += 25;
    const n = countIn(text, t, 5);
    if (n) s += 10 + n * 6;
    if (!s) return null; // toda palavra tem que aparecer em algum lugar
    score += s;
  }
  const exact = !!q && title === q;
  if (exact) score += 1000;
  else if (q && title.startsWith(q)) score += 300;
  else if (q && title.includes(q)) score += 150;
  return { e, score, exact, snippet: snippet(e.search, ts), tagHits };
}

export type SearchSort = "relevancia" | "az" | "recentes";

export function searchEntries(entries: HomeEntry[], query: string, sort: SearchSort = "relevancia"): SearchResult[] {
  const ts = terms(query);
  const out: SearchResult[] = [];
  entries.forEach((e) => {
    const r = scoreEntry(e, query, ts);
    if (r) out.push(r);
  });
  const byTitle = (a: SearchResult, b: SearchResult) => fold(a.e.title).localeCompare(fold(b.e.title));
  if (sort === "az") out.sort(byTitle);
  else if (sort === "recentes") out.sort((a, b) => String(b.e.updatedAt || "").localeCompare(String(a.e.updatedAt || "")) || byTitle(a, b));
  else out.sort((a, b) => b.score - a.score || byTitle(a, b));
  return out;
}

/** Quantos resultados de cada tipo (pros filtros), do mais comum pro menos. */
export function typeCounts(results: SearchResult[]): [string, number][] {
  const c: Record<string, number> = {};
  results.forEach((r) => {
    const t = r.e.type || "Outros";
    c[t] = (c[t] || 0) + 1;
  });
  return Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** "Você quis dizer": títulos (ou uma palavra deles) a poucas letras da busca. */
export function didYouMean(entries: HomeEntry[], query: string, limit = 3): HomeEntry[] {
  const q = fold(query).trim();
  if (q.length < 3) return [];
  // Erros de digitação toleráveis: 1 letra em palavra curta, 2 em média, 3 em longa.
  const max = q.length <= 4 ? 1 : q.length <= 9 ? 2 : 3;
  const scored: [HomeEntry, number][] = [];
  entries.forEach((e) => {
    const title = fold(e.title);
    const cands = [title, ...title.split(/\s+/)];
    let best = max + 1;
    cands.forEach((c) => {
      best = Math.min(best, distance(q, c, max));
    });
    if (best <= max) scored.push([e, best]);
  });
  return scored
    .sort((a, b) => a[1] - b[1] || fold(a[0].title).localeCompare(fold(b[0].title)))
    .slice(0, limit)
    .map((x) => x[0]);
}
