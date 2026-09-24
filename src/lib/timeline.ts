import type { WikiIndex } from "../types";
import { eventSortKey } from "./events";

// Linha do tempo geral — porta da parte pura de renderTimeline em wiki-core.js (arvore): os
// eventos de todas as entradas publicadas (o índice só traz os públicos), em ordem de data.

export interface TimelineEvent {
  label?: string;
  y: number;
  m?: number;
  d?: number;
  note?: string;
  major: boolean;
  entryId: string;
  entryTitle: string;
  entryType: string;
}

export function timelineEvents(index: WikiIndex): TimelineEvent[] {
  const out: TimelineEvent[] = [];
  Object.keys(index).forEach((id) => {
    const e = index[id];
    (e.events || []).forEach((ev) => {
      out.push({ label: ev.label, y: ev.y, m: ev.m, d: ev.d, note: ev.note, major: !!ev.major, entryId: id, entryTitle: e.title, entryType: e.type });
    });
  });
  return out.sort((a, b) => eventSortKey(a) - eventSortKey(b));
}

/** Tipos de entrada do filtro, na ordem de `Array.prototype.sort()` (a mesma de hoje). */
export function timelineTypes(index: WikiIndex): string[] {
  const types: string[] = [];
  Object.values(index).forEach((e) => {
    if (e.type && types.indexOf(e.type) === -1) types.push(e.type);
  });
  return types.sort();
}

export function filterTimeline(events: TimelineEvent[], type: string, year: string, onlyMajor: boolean): TimelineEvent[] {
  return events.filter((ev) => {
    if (type && ev.entryType !== type) return false;
    if (year && String(ev.y) !== year) return false;
    if (onlyMajor && !ev.major) return false;
    return true;
  });
}

/**
 * O `?ano=` como o campo numérico do navegador o aceita (valid floating-point number do HTML):
 * qualquer outra coisa vira campo vazio, ou seja, sem filtro de ano — igual a hoje.
 */
export function yearFromQuery(raw: string | null): string {
  const v = raw || "";
  return /^-?(\d+|\d*\.\d+)([eE][-+]?\d+)?$/.test(v) ? v : "";
}
