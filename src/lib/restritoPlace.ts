import { createContext, useContext } from "react";
import type { RestritoSlotMark, WikiRestritoItem } from "../types";

/*
 * Onde cada trecho restrito entra na página. A página pública traz só marcas de posição
 * (`restritoSlots`: área + quantos itens públicos vêm antes, com um código embaralhado) e cada
 * item restrito liberado pro leitor traz o mesmo código em `slot`. Os componentes estão em
 * components/RestritoPlace.tsx.
 */

export type RestritoArea = "ficha" | "notas" | "secoes" | "posts" | "tags" | "aliases" | "tax-ficha" | "tax-notas" | "sessoes";

export interface Placement {
  at: Partial<Record<string, WikiRestritoItem[][]>>;
  placed: Set<WikiRestritoItem>;
}
const EMPTY: Placement = { at: {}, placed: new Set() };
export const PlaceContext = createContext<Placement>(EMPTY);

export function placeRestrito(items: WikiRestritoItem[], slots: RestritoSlotMark[] | undefined): Placement {
  if (!items.length || !slots || !slots.length) return EMPTY;
  const at: Placement["at"] = {};
  const placed = new Set<WikiRestritoItem>();
  slots.forEach((s) => {
    const it = items.find((x) => x.slot && x.slot === s.slot);
    if (!it || placed.has(it)) return;
    const list = (at[s.area] = at[s.area] || []);
    (list[s.before] = list[s.before] || []).push(it);
    placed.add(it);
  });
  return { at, placed };
}

/** Quantos itens a colocação põe numa área (pra decidir se a área aparece). */
export function countIn(place: Placement, area: RestritoArea): number {
  return (place.at[area] || []).reduce((n, l) => n + (l ? l.length : 0), 0);
}

/** Itens restritos que entram antes do item público `index` desta área. */
export function useRestritoAt(area: RestritoArea, index: number): WikiRestritoItem[] {
  const ctx = useContext(PlaceContext);
  return (ctx.at[area] && ctx.at[area]![index]) || NONE;
}
const NONE: WikiRestritoItem[] = [];

/** Quantos itens restritos esta área recebe (pra desenhar a área mesmo sem nada público nela). */
export function useRestritoCount(area: RestritoArea): number {
  const ctx = useContext(PlaceContext);
  return (ctx.at[area] || []).reduce((n, l) => n + (l ? l.length : 0), 0);
}

/** O item já foi desenhado no lugar dele (então não repete no fim da página). */
export function usePlacedSet(): Set<WikiRestritoItem> {
  return useContext(PlaceContext).placed;
}

