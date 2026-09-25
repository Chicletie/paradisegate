import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  collectionGroup,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { callFunction } from "./auth";
import { allOrOwn } from "./restrito";
import type {
  SpoilerObra,
  AuthUser,
  MemberCard,
  WikiIndex,
  WikiProfile,
  WikiProfilePatch,
  WikiPublicDoc,
  WikiRestritoItem,
  WikiSuggestion,
} from "../types";

/*
 * Tudo o que o site lê e grava no Firebase passa por aqui — a lista fechada de coleções do
 * CLAUDE.md (regra 6) fica num arquivo só. Mesmas consultas que a wiki original faz hoje,
 * no SDK modular. Nenhuma tela importa o Firebase direto.
 */

/**
 * `wikiIndex/lotus` + continuações em `shards/` (docs/dados-da-wiki.md; porta de
 * fetchIndexEntries): sem `shardCount` é só o documento base; um mesmo `wikiId` em duas partes
 * vale o de `updatedAt` mais recente, e uma parte que falhar conta como vazia.
 */
/** Catálogo de obras do índice (spoiler por obra), lido junto com o índice. */
let indexObras: SpoilerObra[] = [];
export function wikiObras(): SpoilerObra[] {
  return indexObras;
}

export async function fetchWikiIndex(): Promise<WikiIndex> {
  const baseSnap = await getDoc(doc(db, "wikiIndex", "lotus"));
  const base = baseSnap.exists() ? baseSnap.data() : {};
  indexObras = Array.isArray(base.obras) ? (base.obras as SpoilerObra[]) : [];
  const out: WikiIndex = {};
  const add = (entries: WikiIndex | undefined) => {
    Object.entries(entries || {}).forEach(([id, e]) => {
      if (!out[id] || String(e?.updatedAt || "") > String(out[id].updatedAt || "")) out[id] = e;
    });
  };
  add(base.entries);
  const n = Number(base.shardCount) | 0;
  if (n <= 0) return out;
  const parts = await Promise.all(
    Array.from({ length: n }, (_, i) =>
      getDoc(doc(db, "wikiIndex", "lotus", "shards", String(i + 1))).then(
        (s) => (s.exists() ? (s.data().entries as WikiIndex) : {}),
        () => ({}),
      ),
    ),
  );
  parts.forEach(add);
  return out;
}

/** `wikiPublic/{slug}`; `null` quando não existe ou não é do Paradise Gate. */
export async function fetchPublicDoc(slug: string): Promise<WikiPublicDoc | null> {
  const snap = await getDoc(doc(db, "wikiPublic", slug));
  if (!snap.exists() || snap.data().universeId !== "lotus") return null;
  return snap.data() as WikiPublicDoc;
}

// --- Login: vive em auth.ts (a ficha usa só ele, sem o Firestore); reexportado aqui ---

export { getIdToken, LoginError, sendPasswordReset, signIn, signOutUser, watchAuth } from "./auth";

// --- Perfil do leitor: wikiProfiles/{uid} ---

export async function fetchProfile(uid: string): Promise<WikiProfile> {
  const snap = await getDoc(doc(db, "wikiProfiles", uid));
  return snap.exists() ? (snap.data() as WikiProfile) : {};
}

/** Grava com merge (e-mail e `updatedAt` sempre juntos, como pgSaveProfile). */
export function saveProfile(user: AuthUser, patch: WikiProfilePatch, updatedAt: string): Promise<void> {
  const data: Record<string, unknown> = { email: user.email, updatedAt };
  if (patch.nickname !== undefined) data.nickname = patch.nickname;
  if (patch.seenAt !== undefined) data.seenAt = patch.seenAt;
  if (patch.photo !== undefined) data.photo = patch.photo === null ? deleteField() : patch.photo;
  if (patch.progress) data.progress = { [patch.progress.obraId]: patch.progress.seasonId };
  if (patch.favorite) data.favorites = patch.favorite.on ? arrayUnion(patch.favorite.id) : arrayRemove(patch.favorite.id);
  return setDoc(doc(db, "wikiProfiles", user.uid), data, { merge: true });
}

// --- Username: quem decide e grava é o servidor (funções checkUsername/claimUsername do autor,
// regra em functions/username.js do repo dele). O site não sabe a regra: só pergunta e mostra. ---

export { FunctionError } from "./auth";

/** O que o servidor diz de um nome enquanto a pessoa digita (e, com login, da troca presa). */
export type UsernameCheck = {
  /** O nome como fica guardado (sem @, minúsculo, sem acento). */
  name: string;
  current: string;
  /** Por que não serve ("" se serve). */
  problem: string;
  /** Livre? `null` quando nem chegou a conferir (problema, ou é o atual). */
  free: boolean | null;
  same: boolean;
  lockedUntilText: string;
  /** "Se trocar agora, só dá de novo em …" */
  nextIfChangedText: string;
  /** A frase de ajuda do campo, do próprio servidor. */
  hint: string;
};

export function checkUsername(username: string): Promise<UsernameCheck> {
  return callFunction<UsernameCheck>("checkUsername", { username });
}

/** Escolhe ou troca (o servidor confere tudo de novo; o erro vem com a frase dele). */
export function claimUsername(username: string): Promise<{ username: string }> {
  return callFunction<{ username: string }>("claimUsername", { username });
}

// --- Perfil público do membro: o cartão em wikiUsernames/{nome} ---

/** O cartão de um membro (`null` se ninguém tem esse nome). */
export async function fetchMemberCard(name: string): Promise<MemberCard | null> {
  const snap = await getDoc(doc(db, "wikiUsernames", name));
  return snap.exists() ? (snap.data() as MemberCard) : null;
}

/** Regrava o cartão do próprio nome com `want`; o que não está em `want` sai do cartão
 * (uid e data de quando o nome foi tomado ficam). A regra do banco confere dono e limites. */
export function saveMemberCard(name: string, want: Omit<MemberCard, "uid">): Promise<void> {
  const data: Record<string, unknown> = {};
  (["nickname", "photo", "bio", "since", "favorites", "showFavorites"] as const).forEach((k) => {
    data[k] = want[k] === undefined ? deleteField() : want[k];
  });
  return setDoc(doc(db, "wikiUsernames", name), data, { merge: true });
}

// --- Sugestões: wikiSuggestions ---

/** Todas as sugestões do leitor (a regra do Firestore só deixa ler as próprias). */
export async function fetchMySuggestions(email: string): Promise<WikiSuggestion[]> {
  const snap = await getDocs(query(collection(db, "wikiSuggestions"), where("authorEmail", "==", email)));
  return snap.docs.map((d) => d.data() as WikiSuggestion);
}

/** As do leitor numa página só ("Minhas sugestões aqui"). */
export async function fetchMySuggestionsFor(wikiId: string, email: string): Promise<WikiSuggestion[]> {
  const snap = await getDocs(
    query(collection(db, "wikiSuggestions"), where("wikiId", "==", wikiId), where("authorEmail", "==", email)),
  );
  return snap.docs.map((d) => d.data() as WikiSuggestion);
}

export async function addSuggestion(s: WikiSuggestion): Promise<void> {
  await addDoc(collection(db, "wikiSuggestions"), s);
}

// --- Conteúdo restrito: wikiRestrito/{wikiId}/itens ---

/**
 * Os itens desta página liberados pro leitor. As regras não filtram listas (recusam a consulta
 * inteira), então: a lista toda e, se vier permission-denied (algum item é de outra pessoa),
 * só os com o e-mail do leitor em `permitidos` — ver src/lib/restrito.ts.
 */
export async function fetchRestrito(wikiId: string, email: string): Promise<WikiRestritoItem[]> {
  const itens = collection(db, "wikiRestrito", wikiId, "itens");
  const snap = await allOrOwn(
    () => getDocs(itens),
    () => getDocs(query(itens, where("permitidos", "array-contains", email))),
  );
  return snap.docs.map((d) => d.data() as WikiRestritoItem);
}

/** Todos os itens liberados pro e-mail, de qualquer página ("Seus acessos" no perfil). */
export async function fetchMyAccesses(email: string): Promise<{ pageId: string; item: WikiRestritoItem }[]> {
  const snap = await getDocs(query(collectionGroup(db, "itens"), where("permitidos", "array-contains", email)));
  const out: { pageId: string; item: WikiRestritoItem }[] = [];
  snap.docs.forEach((d) => {
    const pageId = d.ref.parent.parent?.id;
    if (pageId) out.push({ pageId, item: d.data() as WikiRestritoItem });
  });
  return out;
}
