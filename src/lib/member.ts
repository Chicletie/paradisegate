/*
 * Perfil público do membro (paradisegate.com.br/@nome): lógica pura, sem Firebase. O cartão
 * mora em wikiUsernames/{nome} (ver MemberCard em types.ts) e acompanha o perfil da pessoa:
 * apelido, foto e favoritos vêm do perfil; bio e "mostrar meus favoritos" só existem no cartão.
 */
import type { MemberCard, WikiIndex, WikiIndexEntry, WikiInterpreteOnde, WikiProfile } from "../types";
import { arcanaInfo, type ArcanaInfo } from "./arcana";

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

/** Escolhas que moram só no cartão (o resto vem do perfil). */
export interface CardPrefs {
  bio?: string;
  showFavorites?: boolean;
  ordem?: string[];
  ocultos?: string[];
}

const ids = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x).slice(0, 300) : []);

/** O que o cartão público deve ter hoje, a partir do perfil e das escolhas do próprio cartão. */
export function cardFields(profile: WikiProfile, prefs: CardPrefs, since: string | undefined): Omit<MemberCard, "uid"> {
  const out: Omit<MemberCard, "uid"> = { showFavorites: !!prefs.showFavorites };
  if (profile.nickname) out.nickname = profile.nickname;
  if (profile.photo) out.photo = profile.photo;
  if (prefs.bio) out.bio = prefs.bio.slice(0, BIO_MAX);
  if (since) out.since = since;
  if (prefs.showFavorites) out.favorites = (profile.favorites || []).slice(0, 300);
  if (ids(prefs.ordem).length) out.ordem = ids(prefs.ordem);
  if (ids(prefs.ocultos).length) out.ocultos = ids(prefs.ocultos);
  return out;
}

/** O cartão guardado está diferente do que deveria estar? (evita gravar à toa) */
export function cardOutdated(card: MemberCard, want: Omit<MemberCard, "uid">): boolean {
  const keys: (keyof Omit<MemberCard, "uid">)[] = ["nickname", "photo", "bio", "since", "showFavorites"];
  if (keys.some((k) => (card[k] ?? "") !== (want[k] ?? ""))) return true;
  const list = (k: "favorites" | "ordem" | "ocultos") => (card[k] || []).join("|") !== (want[k] || []).join("|");
  return list("favorites") || list("ordem") || list("ocultos");
}

export interface MemberPage {
  id: string;
  e: WikiIndexEntry;
}

const byTitle = (a: MemberPage, b: MemberPage) => (a.e.title || "").localeCompare(b.e.title || "", "pt-BR");

/** Personagem no perfil: a página e onde a pessoa o interpretou. */
export interface MemberRole extends MemberPage {
  em: WikiInterpreteOnde[];
}

/**
 * Os personagens que o membro interpreta: as páginas com ele no campo Intérprete
 * (`interpretes`). Página publicada antes desse campo existir (sem `interpretes`) vale pela
 * menção [[@nome]] (`membros`), como antes, até ser republicada. Em ordem de título.
 */
export function pagesOfMember(index: WikiIndex, name: string): MemberRole[] {
  const out: MemberRole[] = [];
  Object.entries(index).forEach(([id, e]) => {
    if (Array.isArray(e.interpretes)) {
      const mine = e.interpretes.filter((it) => it && it.membro === name);
      if (mine.length) out.push({ id, e, em: mine.flatMap((it) => (Array.isArray(it.em) ? it.em : [])) });
    } else if ((e.membros || []).includes(name)) out.push({ id, e, em: [] });
  });
  return out.sort(byTitle);
}

/** Na ordem escolhida pela pessoa (`ordem`); os que não estão lá vêm depois, por título. */
export function orderRoles<T extends MemberPage>(list: T[], ordem: string[] | undefined): T[] {
  const pos = new Map((ordem || []).map((id, i) => [id, i]));
  return list
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (pos.get(a.p.id) ?? 1e6 + a.i) - (pos.get(b.p.id) ?? 1e6 + b.i))
    .map((x) => x.p);
}

/** O que o perfil mostra: na ordem escolhida, sem os escondidos. */
export function shownRoles<T extends MemberPage>(list: T[], card: Pick<MemberCard, "ordem" | "ocultos">): T[] {
  const hidden = new Set(card.ocultos || []);
  return orderRoles(list, card.ordem).filter((p) => !hidden.has(p.id));
}

/** As cartas do membro que dá pra desenhar (até duas; carta inválida fica de fora). */
export function memberCards(card: Pick<MemberCard, "cartas">): ArcanaInfo[] {
  return (Array.isArray(card.cartas) ? card.cartas : [])
    .map((a) => arcanaInfo(a))
    .filter((x): x is ArcanaInfo => !!x)
    .slice(0, 2);
}

/** Quantos personagens o perfil mostra antes do "ver todos". */
export const ROLES_SHOWN = 8;

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
