/** Chave do build: o painel de fichas pros jogadores só aparece com ela (depois do teste com a mesa). */
export const FICHAS_ON = import.meta.env.VITE_FEATURE_FICHAS === "1";

export type JogoAccessKind = "none" | "loading" | "player" | "admin" | "not_invited" | "error";

/**
 * O painel "Suas fichas" aparece no perfil: sempre pro mestre; pro jogador, com a chave ligada (e
 * também se a API não respondeu, pra dar o "tentar de novo"). Quem não está na mesa não vê nada.
 */
export function showsFichas(kind: JogoAccessKind, on: boolean = FICHAS_ON): boolean {
  if (kind === "admin") return true;
  return on && (kind === "player" || kind === "error");
}
