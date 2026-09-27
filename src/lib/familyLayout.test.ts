import { describe, expect, it } from "vitest";
import { familyLayout, ftShort, type FamilyLayout, type FtItem } from "./familyLayout";

const names = (n: number, base: string) => Array.from({ length: n }, (_, i) => `${base} ${i + 1} com sobrenome`);
const all = (L: FamilyLayout) => [...L.rows.gp, ...L.rows.p, ...L.rows.sibs, L.rows.self, ...L.rows.sp, ...L.rows.c, ...L.rows.gc];
function overlaps(row: FtItem[]) {
  const s = [...row].sort((a, b) => a.x - b.x);
  let n = 0;
  for (let i = 1; i < s.length; i++) if (s[i].x - s[i].w / 2 < s[i - 1].x + s[i - 1].w / 2) n++;
  return n;
}
const rowsOf = (L: FamilyLayout) => [L.rows.gp, L.rows.p, [...L.rows.sibs, L.rows.self, ...L.rows.sp], L.rows.c, L.rows.gc];

describe("árvore genealógica: posições", () => {
  it("família comum: nada sobreposto, nada fora da área", () => {
    const L = familyLayout("Pessoa com nome bem comprido", {
      gp: ["Avô paterno da família", "Avó paterna da família", "Avô materno", "Avó materna"],
      p: ["Pai com sobrenome longo", "Mãe"],
      sibs: ["Irmão mais velho da casa", "Irmã do meio da casa", "Meio-irmão"],
      sp: ["Cônjuge"],
      c: ["Filha mais velha", "Filho caçula"],
      gc: ["Neta"],
    });
    rowsOf(L).forEach((row) => expect(overlaps(row)).toBe(0));
    all(L).forEach((n) => {
      expect(n.x - n.w / 2).toBeGreaterThanOrEqual(0);
      expect(n.x + n.w / 2).toBeLessThanOrEqual(L.W);
    });
    expect(L.cx).toBe(L.rows.self.x);
  });

  it("família enorme continua sem sobreposição e dentro da área", () => {
    const L = familyLayout("Pessoa com um nome muito comprido mesmo", {
      gp: names(4, "Avô"),
      p: names(3, "Pai"),
      sibs: names(8, "Irmão"),
      sp: names(2, "Esposa"),
      c: names(10, "Filho"),
      gc: names(12, "Neto"),
    });
    rowsOf(L).forEach((row) => expect(overlaps(row)).toBe(0));
    all(L).forEach((n) => {
      expect(n.x - n.w / 2).toBeGreaterThanOrEqual(0);
      expect(n.x + n.w / 2).toBeLessThanOrEqual(L.W);
    });
  });

  it("a caixa é medida pelo nome que aparece (cortado)", () => {
    expect(ftShort("Pessoa com um nome muito comprido mesmo")).toBe("Pessoa com um n…");
    const L = familyLayout("Pessoa com um nome muito comprido mesmo", { gp: [], p: [], sibs: [], sp: [], c: [], gc: [] });
    expect(L.rows.self.w).toBeLessThan(120);
  });

  it("árvore pequena fica com a largura de sempre", () => {
    expect(familyLayout("Pessoa", { gp: [], p: ["Pai", "Mãe"], sibs: [], sp: [], c: [], gc: [] }).W).toBe(460);
  });
});
