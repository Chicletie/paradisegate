import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
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
  return onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: u.email || "" } : null));
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

/**
 * Passe (ID token) pra mandar à API do jogo. O Firebase renova sozinho quando está perto de
 * vencer; `forceRefresh` pede um novo mesmo assim (depois de um 401). `null` se ninguém entrou.
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  await auth.authStateReady();
  const user = auth.currentUser;
  return user ? user.getIdToken(forceRefresh) : null;
}
