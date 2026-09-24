import type { WikiIndexEvent } from "../types";

// Porta literal de wbFmtEventDate/wbEventSortKey na wiki original.
export function fmtEventDate(ev: WikiIndexEvent): string {
  if (ev.d != null && ev.m != null) return `${ev.d}/${ev.m}/${ev.y}`;
  if (ev.m != null) return `${ev.m}/${ev.y}`;
  return `ano ${ev.y}`;
}

export function eventSortKey(ev: WikiIndexEvent): number {
  return ev.y * 100000 + (ev.m || 0) * 100 + (ev.d || 0);
}
