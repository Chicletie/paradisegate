import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ARCANAS, GRUPOS, IMPULSOS, PERGUNTA_ARCANA, PERGUNTA_NOME, RACAS } from "./jogo";

const ficha = readFileSync("fichas.html", "utf8");

// Lê o literal `const NOME = {...}` / `[...]` da ficha, respeitando strings e colchetes aninhados.
function literal(name: string): unknown {
  const start = ficha.indexOf(`const ${name} =`);
  if (start < 0) throw new Error(`${name} não está mais na ficha`);
  let i = ficha.indexOf("=", start) + 1;
  while (/\s/.test(ficha[i])) i++;
  const open = ficha[i];
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  let quote: string | null = null;
  let j = i;
  for (; j < ficha.length; j++) {
    const c = ficha[j];
    if (quote) {
      if (c === "\\") j++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === open) depth++;
    else if (c === close && --depth === 0) break;
  }
  return new Function(`return (${ficha.slice(i, j + 1)});`)();
}

describe("escolhas da ficha mostradas na home", () => {
  it("raças batem com a ficha", () => {
    expect(RACAS).toEqual(Object.keys(literal("RACAS") as object));
  });

  it("grupos e classes batem com a ficha", () => {
    const dados = literal("CLASSES_DADOS") as Record<string, { classes: object }>;
    expect(GRUPOS).toEqual(Object.entries(dados).map(([nome, g]) => ({ nome, classes: Object.keys(g.classes) })));
  });

  it("impulsos batem com a ficha", () => {
    const dados = literal("IMPULSOS") as { nome: string; subtitulo: string }[];
    expect(IMPULSOS).toEqual(dados.map(({ nome, subtitulo }) => ({ nome, subtitulo })));
  });

  it("arcanas batem com a ficha", () => {
    expect(ARCANAS).toEqual(literal("ARCANAS_MAIORES"));
  });

  it("as perguntas da criação continuam na ficha", () => {
    expect(ficha).toContain(PERGUNTA_NOME);
    expect(ficha).toContain(PERGUNTA_ARCANA);
  });
});
