import { dailyKey, gmt3DateKey, seededShuffle } from "../lib/daily";
import type { HomeEntry } from "../lib/home";

export const isCharacter = (e: HomeEntry) => e.type === "Personagem" || e.type === "Lupino";
export const isFaction = (e: HomeEntry) => e.type === "Facção";

/**
 * Os rostos de "O mundo": personagens com capa, embaralhados pelo dia (todo visitante vê os
 * mesmos até o reset das 00h de Brasília), sem repetir o Personagem do dia. Sem personagens com
 * capa suficientes, completa com os sem capa (bloco estrelado com a inicial).
 */
export function homeFaces(entries: HomeEntry[], skipId: string | null, now = Date.now(), n = 6): HomeEntry[] {
  const pool = entries.filter((e) => isCharacter(e) && e.id !== skipId);
  const sorted = pool.slice().sort((a, b) => (dailyKey(a) < dailyKey(b) ? -1 : dailyKey(a) > dailyKey(b) ? 1 : 0));
  const shuffled = seededShuffle(sorted, "home-rostos:" + gmt3DateKey(now));
  const withCover = shuffled.filter((e) => e.cover);
  const without = shuffled.filter((e) => !e.cover);
  return withCover.concat(without).slice(0, n);
}

/**
 * As facções publicadas na wiki, por nome. Só o que o mestre já publicou como Facção — a
 * lista cresce sozinha conforme ele publica mais (nada inventado aqui).
 */
export function homeFactions(entries: HomeEntry[]): HomeEntry[] {
  return entries.filter(isFaction).sort((a, b) => (a.title || "").localeCompare(b.title || ""));
}
