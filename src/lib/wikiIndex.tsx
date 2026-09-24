import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { WikiIndex } from "../types";

/**
 * Lê `wikiIndex/lotus` e as continuações em `shards/`, exatamente como
 * docs/formato-wiki.md descreve: sem `shardCount` é só o documento base; com ele, lê
 * `shards/1..shardCount` em paralelo e junta tudo num objeto só (um mesmo `wikiId` em duas
 * partes vale o de `updatedAt` mais recente).
 */
export async function fetchWikiIndex(): Promise<WikiIndex> {
  const baseSnap = await getDoc(doc(db, "wikiIndex", "lotus"));
  const base = baseSnap.exists() ? baseSnap.data() : {};
  const entries: WikiIndex = { ...((base.entries as WikiIndex) || {}) };
  const shardCount: number = base.shardCount || 0;
  if (shardCount > 0) {
    const shardNums = Array.from({ length: shardCount }, (_, i) => i + 1);
    const shardSnaps = await Promise.all(
      shardNums.map((n) => getDoc(doc(db, "wikiIndex", "lotus", "shards", String(n)))),
    );
    shardSnaps.forEach((snap) => {
      if (!snap.exists()) return;
      const shardEntries = (snap.data().entries as WikiIndex) || {};
      for (const [id, entry] of Object.entries(shardEntries)) {
        const current = entries[id];
        if (!current || (entry.updatedAt || "") >= (current.updatedAt || "")) entries[id] = entry;
      }
    });
  }
  return entries;
}

const WikiIndexContext = createContext<WikiIndex | null>(null);

/** Busca o índice uma vez só e compartilha entre cabeçalho, rodapé e as páginas que
 * precisam dele (miniaturas de ligações, contagem de tipos, saber se há eventos). */
export function WikiIndexProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState<WikiIndex | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchWikiIndex()
      .then((idx) => {
        if (!cancelled) setIndex(idx);
      })
      .catch(() => {
        if (!cancelled) setIndex({});
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return <WikiIndexContext.Provider value={index}>{children}</WikiIndexContext.Provider>;
}

/** `null` enquanto carrega. */
export function useWikiIndex(): WikiIndex | null {
  return useContext(WikiIndexContext);
}

export function hasEvents(index: WikiIndex): boolean {
  return Object.values(index).some((e) => (e.events || []).length > 0);
}
