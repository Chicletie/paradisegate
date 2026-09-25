/*
 * Perfil público do membro (paradisegate.com.br/@nome): lógica pura, sem Firebase. O cartão
 * mora em wikiUsernames/{nome} (ver MemberCard em types.ts) e acompanha o perfil da pessoa:
 * apelido, foto e favoritos vêm do perfil; bio e "mostrar meus favoritos" só existem no cartão.
 */
import type { MemberCard, WikiIndex, WikiIndexEntry, WikiProfile } from "../types";

export const BIO_MAX = 300;

/** "/@Ania_Sombra" ou "@ania_sombra" → "ania_sombra"; null se não for um endereço de membro. */
export function memberHandle(segment: string): string | null {
  let s = String(segment || "");
  try {
    s = decodeURIComponent(s);
  } catch {
    return null;
  }
  s = s.replace(/^\//, "");
  if (s[0] !== "@") return null;
  const n = s.slice(1).toLowerCase();
  return /^[a-z0-9][a-z0-9_]{2,19}$/.test(n) ? n : null;
}

export function memberHref(name: string): string {
  return "/@" + name;
}

/** O que o cartão público deve ter hoje, a partir do perfil e das escolhas do próprio cartão. */
export function cardFields(
  profile: WikiProfile,
  prefs: { bio?: string; showFavorites?: boolean },
  since: string | undefined,
): Omit<MemberCard, "uid"> {
  const out: Omit<MemberCard, "uid"> = { showFavorites: !!prefs.showFavorites };
  if (profile.nickname) out.nickname = profile.nickname;
  if (profile.photo) out.photo = profile.photo;
  if (prefs.bio) out.bio = prefs.bio.slice(0, BIO_MAX);
  if (since) out.since = since;
  if (prefs.showFavorites) out.favorites = (profile.favorites || []).slice(0, 300);
  return out;
}

/** O cartão guardado está diferente do que deveria estar? (evita gravar à toa) */
export function cardOutdated(card: MemberCard, want: Omit<MemberCard, "uid">): boolean {
  const keys: (keyof Omit<MemberCard, "uid">)[] = ["nickname", "photo", "bio", "since", "showFavorites"];
  if (keys.some((k) => (card[k] ?? "") !== (want[k] ?? ""))) return true;
  return (card.favorites || []).join("|") !== (want.favorites || []).join("|");
}

export interface MemberPage {
  id: string;
  e: WikiIndexEntry;
}

const byTitle = (a: MemberPage, b: MemberPage) => (a.e.title || "").localeCompare(b.e.title || "", "pt-BR");

/** As páginas publicadas que citam o membro com [[@nome]] (personagens que interpreta). */
export function pagesOfMember(index: WikiIndex, name: string): MemberPage[] {
  return Object.entries(index)
    .filter(([, e]) => (e.membros || []).includes(name))
    .map(([id, e]) => ({ id, e }))
    .sort(byTitle);
}

/** Os favoritos que ainda existem na wiki (página despublicada some da lista). */
export function favoritePages(index: WikiIndex, card: MemberCard): MemberPage[] {
  if (!card.showFavorites) return [];
  return (card.favorites || []).filter((id) => index[id]).map((id) => ({ id, e: index[id] }));
}

/** "no acervo desde março de 2026" */
export function sinceLabel(since: string | undefined): string {
  const t = since ? Date.parse(since) : NaN;
  if (Number.isNaN(t)) return "";
  return "no acervo desde " + new Date(t).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
