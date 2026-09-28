import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, functionUrl } from "./firebaseApp";
import { isEmailLogin } from "./username";
import type { AuthUser } from "../types";

/*
 * Login do site (wiki e páginas do jogo): o Firebase Auth passa só por aqui e por api.ts,
 * que reexporta tudo (CLAUDE.md, regra 6). Separado do api.ts pra quem só precisa do login
 * (a ficha) não carregar o Firestore junto.
 */

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
    throw new LoginError("Não foi possível verificar agora. Tente novamente ou entre com o seu e-mail.");
  }
  const body = (await res.json().catch(() => ({}))) as { result?: { email?: string }; error?: { message?: string } };
  if (res.ok && body.result?.email) return body.result.email;
  throw new LoginError(body.error?.message || "Username ou senha incorretos.");
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}

/**
 * "Esqueci minha senha": quem manda o e-mail é a função `requestPasswordReset` do autor (a carta
 * da Academia, de conta@paradisegate.com.br, com o link pro `reset-senha.html`), não o envio
 * padrão do Firebase. Ela responde "enviado" exista a conta ou não; erro aqui é só e-mail
 * inválido ou servidor fora do ar.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await callFunction<{ ok: boolean }>("requestPasswordReset", { email });
}

/**
 * Passe (ID token) pra mandar à API do jogo. O Firebase renova sozinho quando está perto de
 * vencer; `forceRefresh` pede um novo mesmo assim (depois de um 401). `null` se ninguém entrou.
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  await auth.authStateReady();
  const user = auth.currentUser;
  return user ? user.getIdToken(forceRefresh) : null;
}

/** A função do servidor disse não (ou não respondeu): `message` é a frase dela, pro leitor. */
export class FunctionError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Chama uma função do Firebase (as do autor, em functions/ do repo dele): quem decide a regra é
 * ela; aqui só se manda o pedido e se devolve a resposta ou a frase do erro. Com login, vai o
 * passe junto (a função sabe quem pediu).
 */
export async function callFunction<T>(name: string, data: unknown): Promise<T> {
  const token = await getIdToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(functionUrl(name), { method: "POST", headers, body: JSON.stringify({ data }) });
  } catch {
    throw new FunctionError("Não foi possível falar com o servidor agora. Tente novamente.", "unavailable");
  }
  const body = (await res.json().catch(() => ({}))) as { result?: T; error?: { message?: string; status?: string } };
  if (res.ok && "result" in body) return body.result as T;
  throw new FunctionError(body.error?.message || "Algo deu errado. Tente novamente.", (body.error?.status || "internal").toLowerCase());
}
