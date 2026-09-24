import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchWikiIndex, wikiObras } from "./api";
import type { SpoilerObra, WikiIndex } from "../types";

interface IndexState {
  index: WikiIndex | null;
  failed: boolean;
  obras?: SpoilerObra[];
}

const WikiIndexContext = createContext<IndexState>({ index: null, failed: false });

/** Busca o índice uma vez só e compartilha entre cabeçalho, rodapé e as páginas que
 * precisam dele (home, miniaturas de ligações, contagem de tipos, se há eventos). Falha vira
 * índice vazio pra todo mundo (nada quebra); só a home avisa, como hoje. */
export function WikiIndexProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<IndexState>({ index: null, failed: false });
  useEffect(() => {
    let cancelled = false;
    fetchWikiIndex()
      .then((idx) => {
        if (!cancelled) setState({ index: idx, failed: false, obras: wikiObras() });
      })
      .catch(() => {
        if (!cancelled) setState({ index: {}, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return <WikiIndexContext.Provider value={state}>{children}</WikiIndexContext.Provider>;
}

/** `null` enquanto carrega. */
export function useWikiIndex(): WikiIndex | null {
  return useContext(WikiIndexContext).index;
}

/** Catálogo de obras (spoiler por obra); vazio enquanto carrega ou se não houver. */
export function useWikiObras(): SpoilerObra[] {
  return useContext(WikiIndexContext).obras || [];
}

/** A leitura do índice falhou (rede, regra do Firestore). */
export function useWikiIndexFailed(): boolean {
  return useContext(WikiIndexContext).failed;
}

export function hasEvents(index: WikiIndex): boolean {
  return Object.values(index).some((e) => (e.events || []).length > 0);
}
