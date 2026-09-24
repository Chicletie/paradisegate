import type { WikiArcana } from "../types";

// Carta de tarô associada a um personagem no editor (e.arcana) — porta de WB_ARCANA_*,
// wbArcanaInfo e wbRoman em wiki-core.js (arvore), tabelas copiadas de lá sem mudança.
// Maiores: numeral romano (0 pro Louco) + símbolo próprio; menores: numeral I–X ou a letra da
// corte (P Pajem/Valete, N Cavaleiro — o N do xadrez, pra não confundir com o K do Rei —,
// Q Rainha, K Rei) + símbolo do naipe. Símbolos: "c:x,y,r" é círculo, "e:x,y,rx,ry" elipse, o
// resto é path (correspondências da Golden Dawn).

const MAJOR: string[] = ["O Louco", "O Mago", "A Sacerdotisa", "A Imperatriz", "O Imperador", "O Hierofante", "Os Enamorados", "O Carro", "A Força", "O Eremita", "A Roda da Fortuna", "A Justiça", "O Enforcado", "A Morte", "A Temperança", "O Diabo", "A Torre", "A Estrela", "A Lua", "O Sol", "O Julgamento", "O Mundo"];

const SUITS: Record<string, string> = { copas: "Copas", ouros: "Ouros", espadas: "Espadas", paus: "Paus" };

const RANKS: string[] = ["Ás", "Dois", "Três", "Quatro", "Cinco", "Seis", "Sete", "Oito", "Nove", "Dez", "Valete", "Cavaleiro", "Rainha", "Rei"];

export const ARCANA_GLYPHS: Record<string, string[]> = {
    m0: ["M7 4v10", "M17 4v10", "M7 9h10", "M12 4v11.6", "c:12,18.2,2.6"],
    m1: ["M8.4 3.8c.5 2.3 1.9 3.6 3.6 3.6s3.1-1.3 3.6-3.6", "c:12,11.2,3.8", "M12 15v6", "M9.2 18.2h5.6"],
    m2: ["M10 3.5a8.5 8.5 0 1 1 0 17 6.8 6.8 0 1 0 0-17z"],
    m3: ["c:12,9,5", "M12 14v7", "M9 18h6"],
    m4: ["M12 20.5V9.5", "M12 9.5C12 6 10.2 4.2 8.1 4.2S4.6 5.8 4.6 7.9s1.3 3.4 3 3.4", "M12 9.5C12 6 13.8 4.2 15.9 4.2s3.5 1.6 3.5 3.7-1.3 3.4-3 3.4"],
    m5: ["M5.5 4c.8 3.1 3.3 5.2 6.5 5.2S17.7 7.1 18.5 4", "c:12,14.6,5"],
    m6: ["M9 7v10", "M15 7v10", "M5.2 4.6c4.3 2.6 9.3 2.6 13.6 0", "M5.2 19.4c4.3-2.6 9.3-2.6 13.6 0"],
    m7: ["c:7.6,10.2,2.5", "M5.1 10.2C5.6 6.4 12.4 4.6 19 7.2", "c:16.4,13.8,2.5", "M18.9 13.8c-.5 3.8-7.3 5.6-13.9 3"],
    m8: ["c:7.4,15.6,2.8", "M10.2 15.2C8.4 11 8.8 5 13.4 5c4.2 0 5.2 4.3 3.3 8.4-1.5 3.3-1 5.7 2.3 6.1"],
    m9: ["M4.2 7.2c1.2 0 1.9.8 1.9 2V19", "M6.1 9.2c0-1.2.9-2 2-2s2 .8 2 2V19", "M10.1 9.2c0-1.2.9-2 2-2s2 .8 2 2v7.3c0 1.9 1.3 3 3.2 3", "M14.1 13.2c2.3-1.8 5.3-1.4 5.3 1.1s-2.3 4-5.3 5.5"],
    m10: ["M5.5 8.2C5.5 6 7.2 4.4 9.3 4.4c2.5 0 3.7 2.1 2.6 4.6L6.2 16.2h13.3", "M15.8 11v10"],
    m11: ["M4.5 19h15", "M4.5 15.2h4.4c-1.3-1.2-1.9-2.6-1.9-4 0-2.8 2.2-4.7 5-4.7s5 1.9 5 4.7c0 1.4-.6 2.8-1.9 4h4.4"],
    m12: ["M12 5v16", "M8.6 18.3h6.8", "M6 5c0 4.9 2.5 7.5 6 7.5S18 9.9 18 5", "M4.8 6.8L6 5l1.2 1.8", "M16.8 6.8L18 5l1.2 1.8", "M10.8 6.8L12 5l1.2 1.8"],
    m13: ["M4.2 7.2c1.2 0 1.9.8 1.9 2V19", "M6.1 9.2c0-1.2.9-2 2-2s2 .8 2 2V19", "M10.1 9.2c0-1.2.9-2 2-2s2 .8 2 2v8.1c0 1.3.7 2 1.9 2h2.9", "M17.4 17.3l2 2-2 2"],
    m14: ["M5 19L19 5", "M12.5 5H19v6.5", "M7.8 11.8l4.4 4.4"],
    m15: ["M4.3 6.4c1.4 0 2.3 1 2.8 2.6l2.9 8.8 3-9.6c.6-1.9 1.8-3 3.4-3", "M13.1 8.6c.2 4.8 1.4 8.3 3.7 9.7 1.8 1.1 3.7-.3 3.2-2.2-.5-2-3-2.2-4.4-.5-1.2 1.5-1.2 3.3-.3 4.9"],
    m16: ["c:10,14,5.2", "M13.7 10.3l5.8-5.8", "M14.3 4.5h5.2v5.2"],
    m17: ["M4 10l2.7-2.5 2.6 2.5 2.7-2.5 2.6 2.5 2.7-2.5L20 10", "M4 16l2.7-2.5 2.6 2.5 2.7-2.5 2.6 2.5 2.7-2.5L20 16"],
    m18: ["M6.2 4.5c2.6 2 4 4.6 4 7.5s-1.4 5.5-4 7.5", "M17.8 4.5c-2.6 2-4 4.6-4 7.5s1.4 5.5 4 7.5", "M7.6 12h8.8"],
    m19: ["c:12,12,7.8", "c:12,12,1.4"],
    m20: ["c:12,6.8,2.4", "M6.8 4.6c.3 4.2 2.4 7.1 5.2 7.1s4.9-2.9 5.2-7.1", "M12 11.7v9.3", "M8.8 17.9h6.4"],
    m21: ["M8.4 3.6v10", "M5.6 6.2h5.6", "M8.4 13.2c0-2.4 1.8-4.3 4.1-4.3 2.2 0 3.8 1.6 3.8 3.7 0 2.1-1.5 3.3-2.7 4.7-1 1.2-.9 3 .9 3.8"],
    copas: ["M5 6h14L12 19z"],
    ouros: ["M5 6h14L12 19z", "M5.9 11h12.2"],
    espadas: ["M12 5l7 13H5z", "M5.5 12.8h13"],
    paus: ["M12 5l7 13H5z"]
  };

export function roman(n: number): string {
  const map: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  map.forEach(([v, s]) => {
    while (n >= v) {
      out += s;
      n -= v;
    }
  });
  return out;
}

export interface ArcanaInfo {
  numeral: string;
  label: string;
  glyph: string;
  court: boolean;
}

export function arcanaInfo(a: WikiArcana | null | undefined): ArcanaInfo | null {
  if (!a) return null;
  if (a.kind === "major" && a.n != null && MAJOR[a.n] != null) {
    const numeral = a.n ? roman(a.n) : "0";
    return { numeral, label: numeral + " · " + MAJOR[a.n], glyph: "m" + a.n, court: false };
  }
  if (a.kind === "minor" && a.suit && SUITS[a.suit] && a.rank != null && a.rank >= 1 && a.rank <= 14) {
    const court = a.rank > 10;
    return {
      numeral: court ? ["P", "N", "Q", "K"][a.rank - 11] : roman(a.rank),
      label: RANKS[a.rank - 1] + " de " + SUITS[a.suit],
      glyph: a.suit,
      court,
    };
  }
  return null;
}
