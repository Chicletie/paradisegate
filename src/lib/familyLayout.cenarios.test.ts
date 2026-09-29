// @ts-nocheck -- os cenários e a conta são JS puro (tipos em familyLayout.d.ts)
import { describe, expect, it } from "vitest";
import { familyInputFromLinks, familyTreeLayout, ftLinePath } from "./familyLayout.js";
import { FAMILY_CENARIOS, familyCenario } from "./familyCenarios.js";

// Bateria de famílias (comuns e diversas): toda árvore tem que ser legível — nada sobreposto,
// nenhuma linha correndo em cima de outra, nenhuma linha atravessando uma caixa, e o que o
// leitor não pode ver continua fora.

function layoutOf(c) {
  var canSee = c.canSee === "tudo" ? function () { return true; } : undefined;
  var inp = familyInputFromLinks(c.title, c.bk == null ? null : c.bk, c.links, canSee);
  return { inp: inp, L: familyTreeLayout(inp) };
}
function boxOf(L, label) { return L.boxes.filter(function (b) { return b.label === label; })[0]; }
function isH(l) { return Math.abs(l.y1 - l.y2) < 0.01; }
function isV(l) { return Math.abs(l.x1 - l.x2) < 0.01; }

// caixas da mesma fila encostando
function boxOverlaps(L) {
  var by = {}, bad = [];
  L.boxes.forEach(function (b) { (by[b.y] = by[b.y] || []).push(b); });
  Object.keys(by).forEach(function (k) {
    var s = by[k].slice().sort(function (a, b) { return a.x - b.x; });
    for (var i = 1; i < s.length; i++) if (s[i].x - s[i].w / 2 < s[i - 1].x + s[i - 1].w / 2 + 4) bad.push(s[i - 1].label + " / " + s[i].label);
  });
  return bad;
}
// duas linhas de ligações diferentes correndo uma em cima da outra
function collinear(L) {
  var ls = L.lines.filter(function (l) { return !l.mark; }), bad = [];
  for (var i = 0; i < ls.length; i++) for (var j = i + 1; j < ls.length; j++) {
    var a = ls[i], b = ls[j];
    if (a.rel === b.rel) continue;
    if (isH(a) && isH(b) && Math.abs(a.y1 - b.y1) < 1.5) {
      var o = Math.min(Math.max(a.x1, a.x2), Math.max(b.x1, b.x2)) - Math.max(Math.min(a.x1, a.x2), Math.min(b.x1, b.x2));
      // também duas linhas na mesma altura quase se encostando: pareceriam uma só
      if (o > -8) bad.push("horizontal " + a.rel + " × " + b.rel + " em y=" + a.y1);
    }
    if (isV(a) && isV(b) && Math.abs(a.x1 - b.x1) < 1.5) {
      var p = Math.min(Math.max(a.y1, a.y2), Math.max(b.y1, b.y2)) - Math.max(Math.min(a.y1, a.y2), Math.min(b.y1, b.y2));
      if (p > 1) bad.push("vertical " + a.rel + " × " + b.rel + " em x=" + a.x1);
    }
  }
  return bad;
}
// linha entrando no meio de uma caixa (as linhas só encostam na borda)
function throughBoxes(L) {
  var bad = [];
  L.lines.forEach(function (l) {
    L.boxes.forEach(function (b) {
      var x0 = b.x - b.w / 2 + 1, x1 = b.x + b.w / 2 - 1, y0 = b.y - b.h + 1, y1 = b.y + b.h - 1;
      var lx0 = Math.min(l.x1, l.x2), lx1 = Math.max(l.x1, l.x2), ly0 = Math.min(l.y1, l.y2), ly1 = Math.max(l.y1, l.y2);
      if (lx1 > x0 && lx0 < x1 && ly1 > y0 && ly0 < y1) bad.push(l.rel + " atravessa " + b.label);
    });
  });
  return bad;
}
function inside(L) { return L.boxes.every(function (b) { return b.x - b.w / 2 >= 0 && b.x + b.w / 2 <= L.W; }); }

describe("árvore genealógica: bateria de famílias", function () {
  it("tem pelo menos 20 cenários diferentes", function () {
    expect(FAMILY_CENARIOS.length).toBeGreaterThanOrEqual(20);
  });
  FAMILY_CENARIOS.forEach(function (raw) {
    it(raw.id + ": legível (nada sobreposto, nenhuma linha em cima de outra nem dentro de caixa)", function () {
      var c = familyCenario(raw.id), r = layoutOf(c), L = r.L;
      expect(boxOverlaps(L)).toEqual([]);
      expect(collinear(L)).toEqual([]);
      expect(throughBoxes(L)).toEqual([]);
      expect(inside(L)).toBe(true);
      // cada pessoa aparece uma vez só
      var seen = {};
      L.boxes.forEach(function (b) { expect(seen[b.label]).toBeUndefined(); seen[b.label] = 1; });
      // o caminho de cada linha sai certo (pontes incluídas)
      L.lines.forEach(function (l) { expect(ftLinePath(l)).toMatch(/^M[\d.-]+ [\d.-]+.*L[\d.-]+ [\d.-]+$/); });
      // a legenda explica todo traço desenhado
      L.lines.forEach(function (l) { if (l.dash) expect(L.legend).toContain(l.rel === "outros" ? "outros" : l.dash); });
      // o que está em spoiler só aparece pra quem já pode ver
      c.links.filter(function (lk) { return lk.spoiler; }).forEach(function (lk) {
        expect(!!boxOf(L, lk.targetTitle)).toBe(c.canSee === "tudo");
      });
    });
  });
});

describe("árvore genealógica: o que cada família diversa precisa mostrar", function () {
  it("Dementor: viuvez com cruz, cônjuges de um lado e irmãos do outro, sem cruzamentos, prima também cônjuge", function () {
    var L = layoutOf(familyCenario("dementor")).L;
    var eu = boxOf(L, "Dementor Cravensworth");
    var sp = ["Devon Cravensworth", "Giulienne Cravensworth", "Cygnus Lebedev"].map(function (t) { return boxOf(L, t); });
    var sib = ["Coríntio Cravensworth", "Velário Cravensworth", "Amânio Cravensworth"].map(function (t) { return boxOf(L, t); });
    var sSide = Math.sign(sp[0].x - eu.x);
    sp.forEach(function (b) { expect(Math.sign(b.x - eu.x)).toBe(sSide); });
    sib.forEach(function (b) { expect(Math.sign(b.x - eu.x)).toBe(-sSide); });
    // os casamentos sem filhos mais perto; o do filho (Devon) mais longe: nenhuma linha se cruza
    expect(Math.abs(sp[0].x - eu.x)).toBeGreaterThan(Math.abs(sp[1].x - eu.x));
    expect(Math.abs(sp[0].x - eu.x)).toBeGreaterThan(Math.abs(sp[2].x - eu.x));
    expect(L.legend).not.toContain("ponte");
    expect(L.legend).toContain("viuvo");
    expect(L.lines.filter(function (l) { return l.mark; }).length).toBe(4);
    expect(boxOf(L, "Giulienne Cravensworth").term).toBe("prima");
    expect(boxOf(L, "Asul")).toBeUndefined();
    // o filho adotivo desce do casal com o Devon
    var ast = boxOf(L, "Asteri Cravensworth");
    expect(Math.min(eu.x, sp[0].x) < ast.x + ast.w / 2 && ast.x - ast.w / 2 < Math.max(eu.x, sp[0].x)).toBe(true);
  });
  it("Dementor com a temporada vista: a prima distante aparece na faixa", function () {
    var L = layoutOf(familyCenario("dementor-revelado")).L;
    expect(boxOf(L, "Asul").term).toBe("prima distante");
  });
  it("adotivos e biológicos: dois casais, cada um com os seus avós; irmã adotiva no casal adotivo", function () {
    var L = layoutOf(familyCenario("adotivos-e-biologicos")).L;
    var dem = boxOf(L, "Dementor Cravensworth"), dev = boxOf(L, "Devon Cravensworth"), pai = boxOf(L, "Pai biológico"), mae = boxOf(L, "Mãe biológica");
    [dem, dev, pai, mae].forEach(function (b) { expect(b.y).toBe(pai.y); });
    // os casais não se misturam
    expect(Math.max(pai.x, mae.x) < Math.min(dem.x, dev.x) || Math.max(dem.x, dev.x) < Math.min(pai.x, mae.x)).toBe(true);
    var gpMid = (boxOf(L, "Lazlo Cravensworth").x + boxOf(L, "Nadia Cravensworth").x) / 2;
    expect(Math.abs(gpMid - dem.x)).toBeLessThan(1);
    expect(Math.abs(boxOf(L, "Avó do Devon").x - dev.x)).toBeLessThan(1);
    var irma = boxOf(L, "Irmã adotiva");
    expect(L.lines.some(function (l) { return l.dash === "adocao" && isV(l) && Math.abs(l.x1 - irma.x) < 0.01 && Math.max(l.y1, l.y2) === irma.y - irma.h; })).toBe(true);
    expect(L.legend).toEqual(expect.arrayContaining(["sangue", "casal", "adocao"]));
  });
  it("barriga de aluguel: a gestante ligada por linha dupla, sem casal; fora da árvore dos pais", function () {
    var L = layoutOf(familyCenario("gestacao-casal-de-homens")).L;
    var g = boxOf(L, "Gestante");
    expect(g.term).toBe("gestante");
    expect(L.lines.filter(function (l) { return l.dash === "origem"; }).length).toBeGreaterThanOrEqual(2);
    expect(L.legend).toContain("origem");
    // nenhuma linha de casal encosta nela
    expect(L.lines.some(function (l) { return isH(l) && l.y1 === g.y && (Math.abs(Math.min(l.x1, l.x2) - (g.x + g.w / 2)) < 0.5 || Math.abs(Math.max(l.x1, l.x2) - (g.x - g.w / 2)) < 0.5); })).toBe(false);
    expect(boxOf(layoutOf(familyCenario("gestacao-pagina-do-pai")).L, "Gestante")).toBeUndefined();
  });
  it("trisal: três pais descem por uma barra só; na página de um deles, dois cônjuges atuais", function () {
    var L = layoutOf(familyCenario("trisal-pagina-do-filho")).L;
    var a = boxOf(L, "Pessoa A"), c = boxOf(L, "Pessoa C"), eu = boxOf(L, "Filho do trisal");
    expect(eu.x).toBeGreaterThan(Math.min(a.x, c.x));
    expect(eu.x).toBeLessThan(Math.max(a.x, c.x) + 60);
    var L2 = layoutOf(familyCenario("trisal-pagina-de-um")).L;
    expect(L2.lines.filter(function (l) { return l.mark; }).length).toBe(0);
  });
  it("padrasto: casado com a mãe, sem linha até a pessoa; enteado desce da esposa na página dele", function () {
    var L = layoutOf(familyCenario("familia-recomposta")).L;
    var pad = boxOf(L, "Padrasto"), mae = boxOf(L, "Mãe");
    expect(pad.y).toBe(mae.y);
    expect(pad.term).toBe("padrasto");
    expect(L.lines.some(function (l) { return isV(l) && Math.abs(l.x1 - pad.x) < 0.01 && Math.min(l.y1, l.y2) === pad.y + pad.h; })).toBe(false);
    var L2 = layoutOf(familyCenario("padrasto-pagina")).L;
    var ent = boxOf(L2, "Pessoa"), esp = boxOf(L2, "Mãe");
    expect(ent.term).toBe("enteado");
    expect(L2.lines.some(function (l) { return isV(l) && Math.abs(l.x1 - (esp.x + Math.sign(esp.x - boxOf(L2, "Padrasto").x) * 10)) < 0.01; })).toBe(true);
  });
  it("guarda da tia: tracejado com o termo, a tia aparece uma vez", function () {
    var L = layoutOf(familyCenario("guarda-da-tia")).L;
    expect(boxOf(L, "Tia").term).toBe("tia e responsável");
    expect(L.legend).toContain("adocao");
  });
  it("spoiler revelado: pai secreto e irmão disfarçado entram quando o leitor já viu", function () {
    var fechado = layoutOf(familyCenario("spoilers-misturados")).L;
    var aberto = layoutOf(familyCenario("spoilers-revelados")).L;
    expect(boxOf(fechado, "Pai secreto")).toBeUndefined();
    expect(boxOf(aberto, "Pai secreto")).toBeTruthy();
    expect(boxOf(aberto, "Irmão escondido")).toBeTruthy();
  });
});
