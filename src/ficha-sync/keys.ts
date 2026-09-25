/*
 * Nomes das gavetas no navegador e as contas pequenas que o sync usa. Puro, sem DOM.
 *
 * - `fichaPG_save_v1:<id>`: a ficha em si, gravada pelo autosave da fichas.html (a mesma regra
 *   do `?sheet=` está lá, na linha do SAVE_KEY). Sem `?sheet=`, a gaveta antiga, sem sync.
 * - `pg_version:<id>`: a versão da conta que este aparelho conhece.
 * - `pg_synced:<id>`: a impressão da ficha que está na conta nessa versão. Se a gaveta tem outra
 *   impressão, o aparelho tem mudança que ainda não subiu (continua assim depois de fechar a aba).
 * - sessionStorage `pg_adopt:<id>` e `pg_reload:<id>`: a ficha baixada da conta antes de recarregar,
 *   e quantas vezes já recarregou (trava pra nunca entrar num ciclo de recarga).
 */

const SHEET_ID = /^[1-9][0-9]{0,11}$/;

/** O id da ficha da conta no endereço (`?sheet=12`), ou `null` pra ficha só deste aparelho. */
export function parseSheetId(search: string): number | null {
  const raw = new URLSearchParams(search).get("sheet") || "";
  return SHEET_ID.test(raw) ? Number(raw) : null;
}

export function sheetKeys(id: number) {
  return {
    drawer: `fichaPG_save_v1:${id}`,
    version: `pg_version:${id}`,
    synced: `pg_synced:${id}`,
    adopt: `pg_adopt:${id}`,
    reload: `pg_reload:${id}`,
  };
}

/** JSON com as chaves em ordem: o Postgres (JSONB) devolve as chaves em outra ordem que a ficha grava. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonical(obj[k])).join(",") + "}";
  }
  return JSON.stringify(value) ?? "null";
}

/** Impressão curta (FNV-1a, 32 bits) do conteúdo da ficha, independente da ordem das chaves. */
export function fingerprint(data: unknown): string {
  const text = canonical(data);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0") + ":" + text.length.toString(36);
}

/** A ficha da gaveta como objeto, ou `null` se o texto não é uma ficha (JSON quebrado ou não objeto). */
export function parseDrawer(raw: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function isEmptySheet(data: Record<string, unknown> | null | undefined): boolean {
  return !data || Object.keys(data).length === 0;
}

/** O nome do personagem (campo `nome` da ficha) pra lista Minhas Fichas; vazio não troca o nome. */
export function characterName(data: Record<string, unknown>): string | undefined {
  const campos = data.campos;
  if (!campos || typeof campos !== "object") return undefined;
  const nome = (campos as Record<string, unknown>).nome;
  if (typeof nome !== "string") return undefined;
  const trimmed = nome.trim();
  return trimmed ? trimmed.slice(0, 150) : undefined;
}

/** Tamanho do corpo em bytes: `keepalive` só aceita até 64 KB, e acima disso o envio some calado. */
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export const KEEPALIVE_LIMIT = 60_000;
