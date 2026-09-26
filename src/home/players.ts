// Quem joga a campanha de Paradise Gate, pra seção "Os jogadores" da home. Nome real de cada
// jogador (nunca inventado) + o id do personagem dele já publicado na wiki (o mesmo id de
// wikiHref/wikiIndex). Ainda vazio: a usuária vai passar a lista real; até lá a seção não
// aparece (ver `Players` em HomePage.tsx).
export interface Player {
  name: string;
  characterId: string;
}

export const PLAYERS: Player[] = [];
