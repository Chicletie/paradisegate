// @ts-nocheck -- cópia do teste do editor do autor, em JS puro (os tipos da conta estão em familyLayout.d.ts)
import { describe, expect, it } from "vitest";
import { familyHasAny, familyInputFromLinks, familyTreeLayout, ftBirthKey, ftMinWidth, ftShort } from "./familyLayout.js";

// Mesmo teste no editor e no site (a conta é o mesmo arquivo nos dois).
function P(label, extra) { return Object.assign({ key: label, label: label }, extra || {}); }
function empty(title, bk) { return { self: { label: title || "Pessoa", bk: bk == null ? null : bk }, parents: [], gps: [], sibs: [], spouses: [], kids: [], gks: [] }; }
function boxOf(L, label) { return L.boxes.filter(function (b) { return b.label === label; })[0]; }
function rows(L) {
  var by = {};
  L.boxes.forEach(function (b) { (by[b.y] = by[b.y] || []).push(b); });
  return Object.keys(by).map(function (k) { return by[k]; });
}
function overlaps(L) {
  var n = 0;
  rows(L).forEach(function (row) {
    var s = row.slice().sort(function (a, b) { return a.x - b.x; });
    for (var i = 1; i < s.length; i++) if (s[i].x - s[i].w / 2 < s[i - 1].x + s[i - 1].w / 2) n++;
  });
  return n;
}
function inside(L) { return L.boxes.every(function (b) { return b.x - b.w / 2 >= 0 && b.x + b.w / 2 <= L.W; }); }
function hasLine(L, fn) { return L.lines.some(fn); }

describe("árvore genealógica: notação", function () {
  it("casal de pais com linha entre os dois, e os filhos descendo do meio numa linha comum", function () {
    var inp = empty("Pessoa", 20010101);
    inp.parents = [P("Pai"), P("Mãe")];
    inp.sibs = [P("Caçula", { bk: 20050101 }), P("Mais velho", { bk: 19990101 })];
    var L = familyTreeLayout(inp);
    var pai = boxOf(L, "Pai"), mae = boxOf(L, "Mãe"), mid = (pai.x + mae.x) / 2;
    // linha de casal na altura das caixas, de uma borda à outra
    expect(hasLine(L, function (l) { return l.y1 === pai.y && l.y2 === pai.y && Math.abs(l.x1 - (pai.x + pai.w / 2)) < 0.01 && Math.abs(l.x2 - (mae.x - mae.w / 2)) < 0.01; })).toBe(true);
    // descida do meio do casal
    expect(hasLine(L, function (l) { return Math.abs(l.x1 - mid) < 0.01 && Math.abs(l.x2 - mid) < 0.01 && l.y1 === pai.y && l.y2 > pai.y; })).toBe(true);
    // irmãos em ordem de nascimento, da esquerda pra direita
    var velho = boxOf(L, "Mais velho"), eu = boxOf(L, "Pessoa"), cacula = boxOf(L, "Caçula");
    expect(velho.x < eu.x && eu.x < cacula.x).toBe(true);
    expect(overlaps(L)).toBe(0);
    expect(inside(L)).toBe(true);
  });

  it("cada par de avós fica em cima do filho deles", function () {
    var inp = empty();
    inp.parents = [P("Pai"), P("Mãe")];
    inp.gps = [P("Avó materna", { via: "Mãe" }), P("Avô paterno", { via: "Pai" }), P("Avó paterna", { via: "Pai" }), P("Avô materno", { via: "Mãe" })];
    var L = familyTreeLayout(inp);
    var pai = boxOf(L, "Pai"), mae = boxOf(L, "Mãe");
    var paternos = (boxOf(L, "Avô paterno").x + boxOf(L, "Avó paterna").x) / 2;
    var maternos = (boxOf(L, "Avó materna").x + boxOf(L, "Avô materno").x) / 2;
    expect(Math.abs(paternos - pai.x)).toBeLessThan(1);
    expect(Math.abs(maternos - mae.x)).toBeLessThan(1);
    expect(overlaps(L)).toBe(0);
    expect(L.lines.every(function (l) { return !l.dash; })).toBe(true);
  });

  it("meio-irmão fica do lado do pai/mãe que divide e desce dele", function () {
    var inp = empty();
    inp.parents = [P("Pai"), P("Mãe")];
    inp.sibs = [P("Meio-irmão", { half: true, via: ["Mãe"] })];
    var L = familyTreeLayout(inp);
    var mae = boxOf(L, "Mãe"), meio = boxOf(L, "Meio-irmão"), eu = boxOf(L, "Pessoa");
    expect(meio.x).toBeGreaterThan(eu.x);
    expect(hasLine(L, function (l) { return Math.abs(l.x1 - mae.x) < 0.01 && l.y1 === mae.y + 13; })).toBe(true);
  });

  it("dois casamentos: cada um com a sua linha e os seus filhos embaixo", function () {
    var inp = empty();
    inp.spouses = [P("Primeira união"), P("Segunda união")];
    inp.kids = [P("Filho da segunda", { with: "Segunda união" }), P("Filho da primeira", { with: "Primeira união" })];
    var L = familyTreeLayout(inp);
    var f1 = boxOf(L, "Filho da primeira"), f2 = boxOf(L, "Filho da segunda");
    expect(f1.x).toBeLessThan(f2.x);
    var uLines = L.lines.filter(function (l) { return l.y1 === l.y2 && l.y1 > boxOf(L, "Pessoa").y + 13 && l.y1 < f1.y - 13; });
    expect(new Set(uLines.map(function (l) { return l.y1; })).size).toBeGreaterThanOrEqual(2);
    expect(overlaps(L)).toBe(0);
  });

  it("adoção tracejada; o que não dá pra situar, pontilhado", function () {
    var inp = empty();
    inp.parents = [P("Pai"), P("Mãe adotiva", { adopt: true })];
    inp.gps = [P("Avó sem ponte", { via: null })];
    var L = familyTreeLayout(inp);
    expect(L.lines.some(function (l) { return l.dash === "adocao"; })).toBe(true);
    expect(L.lines.some(function (l) { return l.dash === "incerto"; })).toBe(true);
  });

  it("família enorme: nada sobreposto, tudo dentro da área, rola em vez de encolher", function () {
    function many(n, base, extra) { return Array.from({ length: n }, function (_, i) { return P(base + " " + (i + 1) + " com sobrenome", extra ? extra(i) : null); }); }
    var inp = empty("Pessoa com um nome muito comprido mesmo");
    inp.parents = [P("Pai com sobrenome longo"), P("Mãe com sobrenome longo"), P("Mãe adotiva", { adopt: true })];
    inp.gps = many(4, "Avô", function (i) { return { via: i < 2 ? "Pai com sobrenome longo" : "Mãe com sobrenome longo" }; });
    inp.sibs = many(8, "Irmão", function (i) { return { bk: 19900000 + i }; }).concat(many(2, "Meio-irmão", function () { return { half: true, via: ["Pai com sobrenome longo"] }; }));
    inp.spouses = many(2, "Cônjuge");
    inp.kids = many(10, "Filho", function (i) { return { with: i < 6 ? "Cônjuge 1 com sobrenome" : "Cônjuge 2 com sobrenome" }; });
    inp.gks = many(12, "Neto", function (i) { return { via: "Filho " + (1 + (i % 4)) + " com sobrenome" }; });
    var L = familyTreeLayout(inp);
    expect(overlaps(L)).toBe(0);
    expect(inside(L)).toBe(true);
    expect(ftMinWidth(L.W)).toBeGreaterThan(460);
  });

  it("caixa medida pelo nome que aparece; árvore pequena do tamanho de sempre", function () {
    expect(ftShort("Pessoa com um nome muito comprido mesmo")).toBe("Pessoa com um n…");
    var inp = empty("Pessoa");
    inp.parents = [P("Pai"), P("Mãe")];
    var L = familyTreeLayout(inp);
    expect(L.W).toBe(460);
    expect(ftMinWidth(L.W)).toBeNull();
  });
});

describe("árvore genealógica: ligações publicadas", function () {
  it("lê o quem-é-quem (fam) e deixa de fora parentesco em spoiler", function () {
    var inp = familyInputFromLinks("Pessoa", 20000101, [
      { label: "é filho(a) de", targetTitle: "Pai", fam: { k: "f1" } },
      { label: "neto(a) de", targetTitle: "Avô", fam: { k: "f2", via: "f1" } },
      { label: "meio-irmão/meia-irmã de", targetTitle: "Meio", fam: { k: "f3", via: ["f1"], bk: 19990101 } },
      { label: "é pai/mãe de", targetTitle: "Filha", fam: { k: "f4", with: "f5" } },
      { label: "casado(a) com", targetTitle: "Cônjuge", fam: { k: "f5" } },
      { label: "irmão/irmã de", targetTitle: "Segredo", spoiler: true },
      { label: "amigo(a) de", targetTitle: "Amigo" }
    ]);
    expect(inp.self.bk).toBe(20000101);
    expect(inp.parents.map(function (p) { return p.key; })).toEqual(["f1"]);
    expect(inp.gps[0].via).toBe("f1");
    expect(inp.sibs.map(function (s) { return s.label; })).toEqual(["Meio"]);
    expect(inp.sibs[0].via).toEqual(["f1"]);
    expect(inp.kids[0].with).toBe("f5");
    expect(inp.spouses[0].key).toBe("f5");
  });
  it("página antiga (sem fam) ainda desenha, com o que não dá pra situar em pontilhado", function () {
    var inp = familyInputFromLinks("Pessoa", null, [
      { label: "é filho(a) de", targetTitle: "Pai" }, { label: "é filho(a) de", targetTitle: "Mãe" },
      { label: "neto(a) de", targetTitle: "Avó" }
    ]);
    var L = familyTreeLayout(inp);
    expect(L.lines.some(function (l) { return l.dash === "incerto"; })).toBe(true);
    expect(overlaps(L)).toBe(0);
  });
  it("ordem de nascimento só quando o ano aparece", function () {
    expect(ftBirthKey({ year: 1998, month: 3, day: 14, display: "ymd" })).toBe(19980314);
    expect(ftBirthKey({ year: 1998, month: 3, day: 14, display: "md" })).toBeNull();
    expect(ftBirthKey({ year: null, month: 3, day: 14, display: null })).toBeNull();
  });
});

describe("árvore genealógica: casamentos desfeitos e parentes distantes", function () {
  it("ex-cônjuge: casamento com as duas barrinhas, filhos embaixo da união certa, atual colado na pessoa", function () {
    var inp = empty();
    inp.spouses = [P("Ex", { status: "ex" }), P("Atual", { status: "" })];
    inp.kids = [P("Filho do ex", { with: "Ex" }), P("Filho atual", { with: "Atual" })];
    var L = familyTreeLayout(inp);
    var eu = boxOf(L, "Pessoa"), atual = boxOf(L, "Atual"), ex = boxOf(L, "Ex");
    expect(Math.abs(atual.x - eu.x)).toBeLessThan(Math.abs(ex.x - eu.x));
    var slashes = L.lines.filter(function (l) { return l.x1 !== l.x2 && l.y1 !== l.y2; });
    expect(slashes.length).toBe(2);
    expect(boxOf(L, "Filho atual").x).toBeLessThan(boxOf(L, "Filho do ex").x);
    expect(overlaps(L)).toBe(0);
  });
  it("viuvez é casamento normal (sem barrinhas)", function () {
    var inp = empty();
    inp.spouses = [P("Falecido", { status: "viuvo" })];
    var L = familyTreeLayout(inp);
    expect(L.lines.filter(function (l) { return l.x1 !== l.x2 && l.y1 !== l.y2; }).length).toBe(0);
  });
  it("parente distante vai pra faixa de baixo, com o termo e o pontilhado", function () {
    var inp = familyInputFromLinks("Pessoa", null, [
      { label: "é filho(a) de", targetTitle: "Mãe", targetId: "mae", style: "family" },
      { label: "primo(a) de", targetTitle: "Prima", targetId: "prima", style: "family", term: "prima distante" },
      { label: "tio/tia de", targetTitle: "Mãe", targetId: "mae", style: "family", term: "tia" },
      { label: "alma-irmã de", targetTitle: "Alma", targetId: "alma", style: "family" },
      { label: "primo(a) de", targetTitle: "Segredo", targetId: "seg", style: "family", spoiler: true },
      { label: "ex-cônjuge de", targetTitle: "Ex", targetId: "ex", style: "family" }
    ]);
    expect(inp.others.map(function (o) { return o.label; })).toEqual(["Prima"]);
    expect(inp.spouses[0].status).toBe("ex");
    var L = familyTreeLayout(inp);
    var prima = boxOf(L, "Prima");
    expect(prima.term).toBe("prima distante");
    expect(prima.y).toBeGreaterThan(boxOf(L, "Pessoa").y);
    expect(L.notes.length).toBe(1);
    expect(L.lines.some(function (l) { return l.dash === "incerto" && Math.abs(l.x1 - prima.x) < 0.01; })).toBe(true);
    expect(overlaps(L)).toBe(0);
    expect(inside(L)).toBe(true);
  });
  it("ligação marcada como distante vai pra faixa mesmo sendo de avô, e não vira ponte", function () {
    var inp = familyInputFromLinks("Pessoa", null, [
      { label: "é filho(a) de", targetTitle: "Mãe", targetId: "mae", style: "family", fam: { k: "f1" } },
      { label: "neto(a) de", targetTitle: "Fundadora", targetId: "fund", style: "family", term: "ancestral distante", distant: true },
      { label: "primo(a) de", targetTitle: "Prima", targetId: "prima", style: "family", term: "prima distante", distant: true }
    ]);
    expect(inp.gps.length).toBe(0);
    expect(inp.others.map(function (o) { return o.label + ": " + o.term; })).toEqual(["Fundadora: ancestral distante", "Prima: prima distante"]);
    var L = familyTreeLayout(inp);
    expect(boxOf(L, "Fundadora").y).toBe(boxOf(L, "Prima").y);
    expect(overlaps(L)).toBe(0);
  });
  it("só parentes distantes já dá árvore", function () {
    var inp = familyInputFromLinks("Pessoa", null, [{ label: "primo(a) de", targetTitle: "Prima", style: "family", term: "prima distante" }]);
    expect(familyHasAny(inp)).toBe(true);
    var L = familyTreeLayout(inp);
    expect(boxOf(L, "Prima")).toBeTruthy();
    expect(inside(L)).toBe(true);
  });
});
