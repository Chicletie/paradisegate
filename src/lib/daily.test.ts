import { describe, expect, it } from "vitest";
import { dailyPick, dayIndex, gmt3DateKey, inBirthdayWindow, seededShuffle, todayMD } from "./daily";
// Respostas do wiki-core.js de hoje (arvore a6bb034) pras mesmas entradas, geradas rodando as
// funções originais — o port tem que dar exatamente o mesmo sorteio, senão a home muda de dia.
import golden from "./daily.golden.json";

const POOLS: Record<string, unknown[]> = {
  letras: ["a", "b", "c", "d", "e", "f", "g"],
  anos: [2016, 2020, 1999, 2026],
  objs: [{ id: "x", title: "X" }, { id: "y", title: "Y" }, { id: "z", title: "Z" }, { entryId: "e1", id: "p1", title: "Nota" }],
  um: ["so"],
};

describe("sorteio do dia igual ao do wiki-core.js", () => {
  it.each(golden.picks as [string, string, string, unknown][])("%s %s %s", (day, pool, seed, expected) => {
    expect(dailyPick(POOLS[pool], seed, Date.parse(day))).toEqual(expected);
  });

  it("embaralhamento com semente", () => {
    expect(seededShuffle(["a", "b", "c", "d", "e"], "teste:1")).toEqual(golden.shuffle);
  });

  it.each(golden.md as [string, string, string][])("dia em GMT-3 em %s", (day, md, key) => {
    expect(todayMD(Date.parse(day))).toBe(md);
    expect(gmt3DateKey(Date.parse(day))).toBe(key);
  });

  it.each(golden.bday as [string, string, boolean][])("hoje %s, aniversário %s", (today, bday, expected) => {
    expect(inBirthdayWindow(today, bday)).toBe(expected);
  });
});

describe("regras do sorteio", () => {
  it("cada item sai uma vez por ciclo, antes de qualquer repetição", () => {
    const pool = ["a", "b", "c", "d", "e"];
    let start = Date.parse("2026-09-25T15:00:00Z");
    while (dayIndex(start) % pool.length !== 0) start += 86400000; // começo de um ciclo
    const seen = pool.map((_, i) => dailyPick(pool, "x", start + i * 86400000));
    expect([...seen].sort()).toEqual(pool);
  });

  it("troca às 00h de Brasília, não à meia-noite UTC", () => {
    const pool = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const at = (iso: string) => dailyPick(pool, "x", Date.parse(iso));
    expect(at("2026-09-24T02:59:59Z")).not.toBe(at("2026-09-24T03:00:00Z"));
    expect(at("2026-09-24T03:00:00Z")).toBe(at("2026-09-25T02:59:59Z"));
  });

  it("pool vazio não sorteia nada", () => {
    expect(dailyPick([], "x")).toBeNull();
  });
});
