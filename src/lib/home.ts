import type { WikiCitation, WikiIndex, WikiIndexEntry, WikiIndexEvent } from "../types";
import { dailyPick, gmt3DateKey, inBirthdayWindow, todayMD } from "./daily";
import { eventSortKey } from "./events";
import { quoteNorm } from "./quotes";
import { writingHref, writingsFromEntries } from "./escritos";

// Lógica da home, porta de renderHome na wiki original, sem DOM — a tela fica em
// src/pages/WikiHomePage.tsx.

export type HomeEntry = WikiIndexEntry & { id: string };
/** Um escrito na home ("<Tipo> do dia", "Escritos recentes"). */
export interface HomeNote {
  id: string;
  title?: string;
  date?: string;
  excerpt?: string;
  tipo?: string;
  noDaily?: boolean;
  /** Página própria do escrito, ou a nota dentro da página (publicada antes dos Escritos). */
  href: string;
  entryId: string;
  /** As páginas em que o escrito aparece. */
  entryTitle: string;
}
export type YearEvent = WikiIndexEvent & { entryId: string; entryTitle: string };

/** Mesma ordem das chaves do índice (é o que o original usa pra desempates). */
export function entriesFromIndex(index: WikiIndex): HomeEntry[] {
  return Object.keys(index).map((id) => ({ id, ...index[id] }));
}

// Escritos públicos (o spoiler não aparece fora da página dele), cada um uma vez.
function notesOf(entries: HomeEntry[]): HomeNote[] {
  return writingsFromEntries(entries)
    .filter((w) => w.vis !== "spoiler")
    .map((w) => ({
      id: w.id, title: w.title, date: w.date, excerpt: w.excerpt, tipo: w.tipo, noDaily: w.noDaily,
      href: writingHref(w), entryId: w.entries[0]?.id || "", entryTitle: w.entries.map((e) => e.title).join(", "),
    }));
}

const isCharacter = (e: HomeEntry) => e.type === "Personagem" || e.type === "Lupino";

export interface DailyHighlights {
  quote: WikiCitation | null;
  char: HomeEntry | null;
  isBirthday: boolean;
  /** Por que não há Personagem do dia (nenhum publicado, ou todos no próprio mês). */
  charEmptyMsg: string;
  note: HomeNote | null;
  entrada: HomeEntry | null;
  year: number | null;
  /** Eventos principais do ano sorteado, um por família, em ordem de data. */
  yearEvents: YearEvent[];
}

/**
 * Os 5 sorteios do dia. Só entra quem já estava publicado ANTES de hoje (GMT-3) — uma página
 * lançada hoje só concorre a partir do próximo reset, pra não reembaralhar o dia de ninguém.
 */
export function dailyHighlights(entries: HomeEntry[], now = Date.now()): DailyHighlights {
  const today = gmt3DateKey(now);
  const md = todayMD(now);
  const eligible = entries.filter((e) => !e.firstPublishedAt || e.firstPublishedAt < today);

  // Citação do dia: a mesma citação vem no índice de cada página envolvida — conta uma vez.
  const quotePool: WikiCitation[] = [];
  const seen: Record<string, 1> = {};
  eligible.forEach((e) =>
    (e.citacoes || []).forEach((raw) => {
      const q = quoteNorm({ speakerId: e.id, speakerTitle: e.title, ...raw }, "");
      if (!q || seen[String(q.id)] || q.daily === false) return;
      seen[String(q.id)] = 1;
      quotePool.push(q);
    }),
  );

  // Personagem do dia: aniversariante de hoje tem prioridade; senão sorteia, fora quem está
  // na própria janela de aniversário (pareceria coincidência estranha perto da data).
  const personagens = eligible.filter(isCharacter);
  const birthdayFolks = personagens.filter((e) => e.birthdayMD === md);
  const isBirthday = birthdayFolks.length > 0;
  const charPool = isBirthday ? birthdayFolks : personagens.filter((e) => !e.birthdayMD || !inBirthdayWindow(md, e.birthdayMD));

  const yearEventsAll: Record<number, YearEvent[]> = {};
  eligible.forEach((e) =>
    (e.events || []).forEach((ev) => {
      if (ev.major) (yearEventsAll[ev.y] = yearEventsAll[ev.y] || []).push({ entryId: e.id, entryTitle: e.title, ...ev });
    }),
  );
  const year = dailyPick(Object.keys(yearEventsAll).map(Number), "ano", now);

  // Um evento propagado (ex: nasceu num personagem, replicado num local) conta uma vez só: as
  // cópias de uma família viram um slot, e o slot sorteia (do mesmo jeito) qual cópia mostrar.
  let yearEvents: YearEvent[] = [];
  if (year != null) {
    const groups: Record<string, YearEvent[]> = {};
    const order: string[] = [];
    yearEventsAll[year].forEach((ev) => {
      const fam = String(ev.familyId || ev.id);
      if (!groups[fam]) {
        groups[fam] = [];
        order.push(fam);
      }
      groups[fam].push(ev);
    });
    yearEvents = order
      .map((fam) => (groups[fam].length > 1 ? dailyPick(groups[fam], "evtfam:" + fam, now)! : groups[fam][0]))
      .sort((a, b) => eventSortKey(a) - eventSortKey(b));
  }

  return {
    quote: dailyPick(quotePool, "citacao", now),
    char: dailyPick(charPool, "personagem", now),
    isBirthday,
    charEmptyMsg: personagens.length
      ? "Todo mundo publicado está no próprio mês de aniversário — ninguém elegível pro sorteio de hoje."
      : "Ainda sem personagens publicados.",
    note: dailyPick(notesOf(eligible).filter((n) => !n.noDaily), "nota", now),
    entrada: dailyPick(
      eligible.filter((e) => !isCharacter(e)),
      "entrada",
      now,
    ),
    year,
    yearEvents,
  };
}

/** Novidades: mais recente primeiro, com desempate estável (updatedAt é só a data). */
export function recentEntries(entries: HomeEntry[]): HomeEntry[] {
  return entries
    .slice()
    .sort(
      (a, b) =>
        (b.updatedAt || "").localeCompare(a.updatedAt || "") ||
        (b.firstPublishedAt || "").localeCompare(a.firstPublishedAt || "") ||
        (a.title || "").localeCompare(b.title || ""),
    );
}

/** Escritos recentes: todos os públicos, o mais novo primeiro (sem a trava de hoje). */
export function recentNotes(entries: HomeEntry[]): HomeNote[] {
  return notesOf(entries).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export interface WikiNumbers {
  /** [quantidade, singular, plural], só o que não é zero. */
  nums: [number, string, string][];
  topTags: string[];
  hasEvents: boolean;
}

export function wikiNumbers(entries: HomeEntry[]): WikiNumbers {
  let words = 0;
  let links = 0;
  // Escritos contados uma vez cada (o mesmo escrito vem em cada página ligada); página
  // publicada antes dos Escritos ainda conta pelo número antigo.
  let posts = writingsFromEntries(entries.filter((e) => e.escritos)).length;
  const tagFreq: Record<string, number> = {};
  entries.forEach((e) => {
    words += e.wordCount || 0;
    links += e.linkCount || 0;
    if (!e.escritos) posts += e.postsCount || 0;
    (e.tags || []).forEach((t) => (tagFreq[t] = (tagFreq[t] || 0) + 1));
  });
  const all: [number, string, string][] = [
    [entries.length, "Página", "Páginas"],
    [words, "Palavra", "Palavras"],
    [links, "Conexão", "Conexões"],
    [posts, "Escrito", "Escritos"],
  ];
  return {
    nums: all.filter((n) => n[0] > 0),
    topTags: Object.keys(tagFreq)
      .sort((a, b) => tagFreq[b] - tagFreq[a])
      .slice(0, 10),
    hasEvents: entries.some((e) => (e.events || []).length > 0),
  };
}

export function typeOptions(entries: HomeEntry[]): string[] {
  return Array.from(new Set(entries.map((e) => e.type).filter(Boolean))).sort();
}

export function tagOptions(entries: HomeEntry[]): string[] {
  return Array.from(new Set(entries.reduce<string[]>((acc, e) => acc.concat(e.tags || []), []))).sort();
}

/**
 * Busca (título, tipo, tags, título das notas e o texto indexado) + filtro por tipo e tag.
 * O texto é montado exatamente como o original (inclusive o "undefined" de um campo ausente),
 * pra achar as mesmas páginas.
 */
export function filterEntries(entries: HomeEntry[], query: string, type: string | null, tag: string | null): HomeEntry[] {
  const q = query.toLowerCase().trim();
  return entries.filter((e) => {
    if (type && e.type !== type) return false;
    if (tag && (e.tags || []).indexOf(tag) === -1) return false;
    const postTitles = (e.posts || []).map((p) => p.title).join(" ");
    const hay = e.title + " " + e.type + " " + e.universe + " " + (e.tags || []).join(" ") + " " + postTitles + " " + (e.search || "");
    return !q || hay.toLowerCase().indexOf(q) !== -1;
  });
}

/** Trechinho ao redor da palavra achada no texto da página (senão não dá pra ver POR QUE ela
 * apareceu no resultado). `q` já em minúsculas e sem espaço nas pontas. */
export function snippetFor(e: HomeEntry, q: string): string | null {
  const text = e.search || "";
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return null;
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + q.length + 40);
  return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
}
