import type { WikiArcana } from "../types";

// Carta de tarô associada a um personagem no editor (e.arcana) — porta de WB_ARCANA_*,
// wbArcanaInfo e wbRoman na wiki original. Os símbolos são os desenhos da carta, escolhidos
// pelo autor em 2026-09-25 (não os astrológicos de uma versão anterior).
// Maiores: numeral romano (0 pro Louco) + símbolo próprio; menores: numeral I–X ou a letra da
// corte (P Pajem/Valete, N Cavaleiro — o N do xadrez, pra não confundir com o K do Rei —,
// Q Rainha, K Rei) + símbolo do naipe. Símbolos: "c:x,y,r" é círculo, "e:x,y,rx,ry" elipse, o
// resto é path. Cada símbolo desenha o que aparece na carta (cálice, espada, torre, sol…).

const MAJOR: string[] = ["O Louco", "O Mago", "A Sacerdotisa", "A Imperatriz", "O Imperador", "O Hierofante", "Os Enamorados", "O Carro", "A Força", "O Eremita", "A Roda da Fortuna", "A Justiça", "O Enforcado", "A Morte", "A Temperança", "O Diabo", "A Torre", "A Estrela", "A Lua", "O Sol", "O Julgamento", "O Mundo"];

const SUITS: Record<string, string> = { copas: "Copas", ouros: "Ouros", espadas: "Espadas", paus: "Paus" };

const RANKS: string[] = ["Ás", "Dois", "Três", "Quatro", "Cinco", "Seis", "Sete", "Oito", "Nove", "Dez", "Valete", "Cavaleiro", "Rainha", "Rei"];

export const ARCANA_GLYPHS: Record<string, string[]> = {
    m0: ["c:12,12,7.5", "c:12,4.5,1.2"],
    m1: ["M12 9c-1.6-2.6-5.5-2.6-5.5 0s3.9 2.6 5.5 0 5.5-2.6 5.5 0-3.9 2.6-5.5 0z", "M12 13v8", "M9.5 21h5"],
    m2: ["M6 4v16", "M18 4v16", "M13.5 8a4 4 0 1 0 0 8 3.2 3.2 0 1 1 0-8z"],
    m3: ["c:12,9,5", "M12 14v7", "M9 18h6"],
    m4: ["M5 9.5C5 6.5 7 5 8.8 5S12 7 12 10v11", "M19 9.5C19 6.5 17 5 15.2 5S12 7 12 10"],
    m5: ["M12 3v18", "M9.5 6.5h5", "M8.5 10h7", "M7.5 13.5h9"],
    m6: ["c:9.5,12,5", "c:14.5,12,5"],
    m7: ["M5 6h14v9H5z", "c:8,18.5,2.2", "c:16,18.5,2.2"],
    m8: ["M12 12c-2.5-4-9-4-9 0s6.5 4 9 0 9-4 9 0-6.5 4-9 0z"],
    m9: ["M12 4l6.9 12H5.1z", "M12 20L5.1 8h13.8z"],
    m10: ["c:12,12,8", "c:12,12,2.5", "M12 4v5.5", "M12 14.5V20", "M4 12h5.5", "M14.5 12H20"],
    m11: ["M12 4v16", "M8.5 20h7", "M5 7h14", "M5 7l-2.5 5h5z", "M19 7l-2.5 5h5z"],
    m12: ["M4 4h16", "M7 8h10l-5 9z", "M12 4v4"],
    m13: ["M7 21L17 4", "M17 4c-4-1.3-8.5-.3-11.5 2.5 3.5-.8 7.5-.3 10 1.2"],
    m14: ["M5 4h6l-3 5z", "M13 15h6l-3 5z", "M9 9.5c1 2.5 3 3.5 5.5 5"],
    m15: ["M6 4c0 4 2.5 6.5 6 6.5S18 8 18 4", "M12 10.5V21", "M8.5 16h7"],
    m16: ["M8 21V9h8v12", "M7 9h10", "M8 9V6h2.5v3", "M13.5 9V6H16v3", "M18.5 2.5l-2.5 3.5h2.5l-2.5 3.5"],
    m17: ["M12 3.5c.7 4.6 2.6 6.5 8 7.5-5.4 1-7.3 2.9-8 8.5-.7-5.6-2.6-7.5-8-8.5 5.4-1 7.3-2.9 8-7.5z"],
    m18: ["M15 4a8 8 0 1 0 0 16 6.5 6.5 0 1 1 0-16z"],
    m19: ["c:12,12,3.8", "M12 2.5v3", "M12 18.5v3", "M2.5 12h3", "M18.5 12h3", "M5.3 5.3l2.1 2.1", "M16.6 16.6l2.1 2.1", "M18.7 5.3l-2.1 2.1", "M7.4 16.6l-2.1 2.1"],
    m20: ["M3.5 10v4h4l8 5V5l-8 5z", "M18.5 9.5c1 1.5 1 3.5 0 5"],
    m21: ["e:12,12,5.5,8.5", "M9.5 3l-1.5-1", "M14.5 21l1.5 1", "M14.5 3l1.5-1", "M9.5 21l-1.5 1"],
    copas: ["M6 4h12c0 5.2-2.7 8.2-6 8.2S6 9.2 6 4z", "M12 12.2V18", "M8 20h8"],
    ouros: ["c:12,12,8.5", "M12 5.5l3.8 11.8-10-7.3h12.4l-10 7.3z"],
    espadas: ["M12 2.5l1.6 3v10.5h-3.2V5.5z", "M7.5 16h9", "M12 16v5.5"],
    paus: ["M8 21L16 3", "M14.9 5.5l2.4-.3", "M13.6 8.4l2.3.5", "M9.6 17.3l-2.2.7"]
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
