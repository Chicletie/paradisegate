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
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db, functionUrl } from "./firebase";
import { allOrOwn } from "./restrito";
import { isEmailLogin } from "./username";
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

// --- Login (Firebase Auth, e-mail e senha; as contas vêm por convite) ---

export function watchAuth(cb: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, (u) => {
    if (!u) return cb(null);
    const t = Date.parse(u.metadata.creationTime || "");
    cb({ uid: u.uid, email: u.email || "", since: Number.isNaN(t) ? undefined : new Date(t).toISOString() });
  });
}

/**
 * Entra com e-mail ou com o @username. Com username, quem acha o e-mail é a função
 * `usernameSignIn` (confere a senha no servidor e só então devolve o e-mail; o e-mail de
 * ninguém fica legível no banco), e o login segue pelo e-mail como sempre.
 */
export async function signIn(identifier: string, password: string): Promise<void> {
  const id = identifier.trim();
  const email = isEmailLogin(id) ? id : await emailForUsername(id, password);
  await signInWithEmailAndPassword(auth, email, password);
}

/** Erro do login por username, com o texto pro leitor. */
export class LoginError extends Error {}

async function emailForUsername(username: string, password: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(functionUrl("usernameSignIn"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { username, password } }),
    });
  } catch {
    throw new LoginError("Não consegui conferir agora. Tente de novo ou entre com o e-mail.");
  }
  const body = (await res.json().catch(() => ({}))) as { result?: { email?: string }; error?: { message?: string } };
  if (res.ok && body.result?.email) return body.result.email;
  throw new LoginError(body.error?.message || "Username ou senha incorretos.");
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}

/**
 * O link do e-mail aponta direto pra `reset-senha.html` (handleCodeInApp), pulando a página
 * padrão do Firebase — o domínio precisa estar nos autorizados do Authentication (ver o
 * comentário equivalente em wiki-core.js).
 */
export function sendPasswordReset(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email, { url: "https://paradisegate.com.br/reset-senha.html", handleCodeInApp: true });
}

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

// --- Username: wikiUsernames/{nome} = { uid } (um documento por nome tomado) ---

/** O nome está livre? (a regra deixa conferir um de cada vez, sem login). */
export async function usernameTaken(name: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "wikiUsernames", name));
  return snap.exists();
}

/** Toma o nome novo, solta o antigo e grava no perfil, tudo numa gravação só (a regra do banco
 * confere que o nome está livre e o limite de 30 dias). O cartão público vai junto pro nome
 * novo (`card`, montado por cardFields em member.ts). */
export function claimUsername(user: AuthUser, name: string, old: string | undefined, card: Omit<MemberCard, "uid"> = {}): Promise<void> {
  const b = writeBatch(db);
  b.set(doc(db, "wikiUsernames", name), { ...card, uid: user.uid, at: serverTimestamp() });
  if (old && old !== name) b.delete(doc(db, "wikiUsernames", old));
  b.set(
    doc(db, "wikiProfiles", user.uid),
    { email: user.email, username: name, usernameChangedAt: serverTimestamp(), updatedAt: new Date().toISOString() },
    { merge: true },
  );
  return b.commit();
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
