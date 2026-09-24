import { createContext, useContext } from "react";
import type { SpoilerObra, SpoilerProgress } from "../types";

/*
 * Spoiler por obra: um trecho em spoiler pode dizer em que temporada de qual obra ele é
 * revelado (`at` = id da temporada). O leitor diz até onde já viu cada obra — o convidado
 * na barrinha do alto da página (fica no navegador), quem tem conta no perfil (fica na
 * conta). O que ele já viu aparece aberto; o resto continua na tarja, dizendo de onde é.
 * Spoiler sem `at` é spoiler comum: sempre tarja.
 */

export const GUEST_PROGRESS_KEY = "pg.progress";

/** A obra e a posição da temporada `at` (ou null se nenhuma obra conhecida tem essa temporada). */
export function findSeason(obras: SpoilerObra[], at: string | undefined): { obra: SpoilerObra; idx: number } | null {
  if (!at) return null;
  for (const obra of obras) {
    const idx = (obra.seasons || []).findIndex((s) => s.id === at);
    if (idx !== -1) return { obra, idx };
  }
  return null;
}

/** O leitor já viu a temporada `at`? */
export function isUnlocked(progress: SpoilerProgress, obras: SpoilerObra[], at: string | undefined): boolean {
  const f = findSeason(obras, at);
  if (!f) return false;
  const seen = progress[f.obra.id];
  if (!seen) return false;
  if (seen === "*") return true;
  const si = f.obra.seasons.findIndex((s) => s.id === seen);
  return si >= f.idx;
}

/** "Paradise Gate · Temporada 2" (ou "" pra spoiler comum). */
export function spoilerLabel(obras: SpoilerObra[], at: string | undefined): string {
  const f = findSeason(obras, at);
  return f ? f.obra.name + " · " + f.obra.seasons[f.idx].name : "";
}

/** Junta listas de obras (índice + página) sem repetir; a primeira que aparece vale. */
export function mergeObras(...lists: (SpoilerObra[] | undefined)[]): SpoilerObra[] {
  const seen = new Set<string>();
  const out: SpoilerObra[] = [];
  lists.forEach((l) =>
    (l || []).forEach((o) => {
      if (o && o.id && !seen.has(o.id)) {
        seen.add(o.id);
        out.push(o);
      }
    }),
  );
  return out;
}

export function readGuestProgress(): SpoilerProgress {
  try {
    const raw = localStorage.getItem(GUEST_PROGRESS_KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === "object" ? (v as SpoilerProgress) : {};
  } catch {
    return {};
  }
}
export function writeGuestProgress(p: SpoilerProgress) {
  try {
    localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* armazenamento bloqueado: vale só nesta visita */
  }
}

export interface ProgressState {
  progress: SpoilerProgress;
  /** Tem conta (e não está vendo como convidado): o progresso mora na conta, sem barrinha. */
  inAccount: boolean;
  setSeen: (obraId: string, seasonId: string) => void;
}
export const ProgressContext = createContext<ProgressState>({ progress: {}, inAccount: false, setSeen: () => {} });
/** As obras que a página atual usa (vêm no documento dela). */
export const PageObrasContext = createContext<SpoilerObra[]>([]);

export function useSpoilerProgress(): ProgressState {
  return useContext(ProgressContext);
}

/** Pra um trecho com `at`: se já está liberado pro leitor e de onde ele é. */
export function useSpoilerAt(at: string | undefined): { open: boolean; label: string } {
  const { progress } = useContext(ProgressContext);
  const obras = useContext(PageObrasContext);
  if (!at) return { open: false, label: "" };
  return { open: isUnlocked(progress, obras, at), label: spoilerLabel(obras, at) };
}
