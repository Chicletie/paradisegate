import { describe, expect, it } from "vitest";
import { countIn, placeRestrito } from "./restritoPlace";
import type { WikiRestritoItem } from "../types";

describe("placeRestrito", () => {
  const campo: WikiRestritoItem = { kind: "campo", key: "Segredo", value: "x", slot: "ra" };
  const secao: WikiRestritoItem = { kind: "secao", title: "A verdade", body: "y", slot: "rb" };
  const semMarca: WikiRestritoItem = { kind: "galeria", url: "u" };

  it("põe cada item liberado na área e posição da marca", () => {
    const p = placeRestrito([campo, secao, semMarca], [
      { slot: "ra", area: "ficha", before: 1 },
      { slot: "rb", area: "secoes", before: 0 },
    ]);
    expect(p.at.ficha?.[1]).toEqual([campo]);
    expect(p.at.secoes?.[0]).toEqual([secao]);
    expect(countIn(p, "ficha")).toBe(1);
    expect(p.placed.has(campo) && p.placed.has(secao)).toBe(true);
    // sem marca continua pro fim da página
    expect(p.placed.has(semMarca)).toBe(false);
  });

  it("escrito restrito vai pra área escritos; o de página antiga, pra posts", () => {
    const novo: WikiRestritoItem = { kind: "escrito", title: "Conto de teste", body: "z", slot: "re" };
    const velho: WikiRestritoItem = { kind: "post", title: "Nota velha", body: "w", slot: "rp" };
    const p = placeRestrito([novo, velho], [
      { slot: "re", area: "escritos", before: 1 },
      { slot: "rp", area: "posts", before: 0 },
    ]);
    expect(p.at.escritos?.[1]).toEqual([novo]);
    expect(p.at.posts?.[0]).toEqual([velho]);
    expect(countIn(p, "escritos") + countIn(p, "posts")).toBe(2);
  });

  it("marca sem item liberado não desenha nada (leitor sem acesso)", () => {
    const p = placeRestrito([], [{ slot: "ra", area: "ficha", before: 0 }]);
    expect(countIn(p, "ficha")).toBe(0);
  });

  it("página antiga sem marcas: nada vai pro lugar, tudo fica no fim", () => {
    const p = placeRestrito([campo], undefined);
    expect(p.placed.size).toBe(0);
  });

  it("dois itens na mesma posição mantêm a ordem das marcas", () => {
    const outro: WikiRestritoItem = { kind: "campo", key: "Outro", value: "z", slot: "rc" };
    const p = placeRestrito([campo, outro], [
      { slot: "rc", area: "ficha", before: 2 },
      { slot: "ra", area: "ficha", before: 2 },
    ]);
    expect(p.at.ficha?.[2]).toEqual([outro, campo]);
  });
});
