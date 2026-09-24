// Porta literal de pgShortDate/pgPlural na wiki original.

const MESES = ["jan.", "fev.", "mar.", "abr.", "maio", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];

/** "2026-09-20" → "20 set. 2026" (datas da wiki são chaves de dia, sem hora). */
export function pgShortDate(d: string | undefined): string {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return d || "";
  const mes = MESES[Number(d.slice(5, 7)) - 1];
  return `${Number(d.slice(8, 10))} ${mes} ${d.slice(0, 4)}`;
}

const PG_PLURALS: Record<string, string> = {
  Personagem: "Personagens",
  Lupino: "Lupinos",
  Divindade: "Divindades",
  Facção: "Facções",
  Local: "Locais",
  Criatura: "Criaturas",
  Item: "Itens",
  Evento: "Eventos",
};

/** Plural em português pra rótulos de tipo na navegação (ex: "Personagem" → "Personagens"). */
export function pgPlural(t: string): string {
  if (PG_PLURALS[t]) return PG_PLURALS[t];
  if (/ão$/.test(t)) return t.replace(/ão$/, "ões");
  if (/l$/.test(t)) return t.replace(/l$/, "is");
  if (/m$/.test(t)) return t.replace(/m$/, "ns");
  if (/[rsz]$/.test(t)) return t + "es";
  return t + "s";
}

/** Ponto de foco escolhido no editor, como object-position. */
export function objPos(focus: { x?: number; y?: number } | null | undefined): string {
  const x = focus?.x ?? 50;
  const y = focus?.y ?? 50;
  return `${x}% ${y}%`;
}

