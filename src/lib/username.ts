/*
 * Username (@algumacoisa): a regra toda (forma, nomes proibidos, prazo entre trocas) mora no
 * servidor, nas funções checkUsername/claimUsername do autor (functions/username.js no repo
 * dele). Aqui fica só o que a tela de entrar precisa pra saber por onde fazer o login.
 */

/** Na tela de entrar: "voce@email.com" é e-mail; "@nome" e "nome" são username. */
export function isEmailLogin(id: string): boolean {
  return /^[^@\s]+@[^@\s]+$/.test(id.trim());
}
