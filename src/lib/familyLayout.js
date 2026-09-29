// Árvore genealógica na notação de genealogia, centrada numa pessoa (5 gerações: avós, pais,
// a pessoa com irmãos e cônjuges, filhos, netos). Parte pura, sem DOM: devolve caixas e
// linhas, e quem desenha só pinta. Este arquivo é copiado IGUAL pro editor e pra wiki:
// mudou num lugar, copie pro outro.
//
// Notação:
// - casal = linha horizontal entre os dois; os filhos descem do meio dessa linha;
// - irmãos penduram numa mesma linha que desce dos pais, do mais velho (esquerda) pro mais
//   novo; quem não tem data fica depois, na ordem em que veio;
// - meio-irmão desce só do pai/mãe que divide com a pessoa;
// - cada par de avós fica em cima do filho deles;
// - cônjuge ao lado, ligado por uma linha em U embaixo das caixas; cada casamento tem a sua
//   linha, e os filhos de cada casamento descem dela; casamento desfeito (ex-cônjuge) leva duas
//   barrinhas cortando a linha (//); viuvez é casamento normal (o cônjuge morreu, não se separou);
// - pai/mãe de um filho que não é casado(a) com a pessoa ("coparente") fica ao lado como um
//   cônjuge, mas a linha entre os dois é traço-ponto (união sem casamento);
// - dois pais adotivos (sem pai/mãe de sangue) formam o casal de cima, tudo em tracejado;
// - outros parentes (primos, tios, bisavós, cunhados…) e quem é marcado como parente distante
//   ficam numa faixa embaixo, cada um com o seu termo ("prima distante", "ancestral distante"),
//   presos por pontilhado: parentesco sem caminho na árvore;
// - adoção e criação em tracejado; ligação que não dá pra situar (dado antigo ou parente não
//   publicado) em pontilhado até o lugar mais provável.
//
// Entrada: { self: {label, bk}, parents: [{key, label, adopt, ref}], gps: [{label, via, ref}],
//   sibs: [{label, half, via: [keys], bk, ref}], spouses: [{key, label, status: ""|"ex"|"viuvo"|"par", ref}],
//   kids: [{key, label, with, bk, adopt, ref}], gks: [{label, via, ref}], others: [{key, label, term, ref}] }
// (key = identificador de uma pessoa nesta árvore; via/with apontam pra ele; bk = número
// pra ordenar por nascimento, ou null).
// Saída: { W, y0, y1, cx, boxes: [{x, y, w, short, label, self, term, ref}], lines: [{x1, y1, x2, y2, dash}],
//   notes: [{x, y, text}], legend: [chave] } (term = texto pequeno embaixo da caixa; notes =
//   legendas soltas; legend = o que esta árvore usa, na ordem da legenda: ver FT_LEGEND)
// (dash: "" linha cheia, "adocao" tracejado, "incerto" pontilhado, "uniao" traço-ponto).

// Itens da legenda, na ordem em que aparecem: chave → texto.
export var FT_LEGEND = [
  ["sangue", "pais e filhos"],
  ["casal", "casal"],
  ["ex", "casamento desfeito"],
  ["uniao", "pais do mesmo filho, sem casamento"],
  ["adocao", "adoção ou criação"],
  ["meio", "meio-irmão (de um dos pais)"],
  ["incerto", "ligação sem lugar certo"],
  ["outros", "outros parentes"]
];
export var FT_MIN_W = 460, FT_PAD = 12, FT_GAP = 14, FT_GROUP_GAP = 30;
var GP_Y = 20, P_Y = 100, SELF_Y = 190, C_Y = 290, GC_Y = 380, HALF_H = 13, OTHER_GAP = 110;

export function ftShort(label) { label = label || ""; return label.length > 16 ? label.slice(0, 15) + "…" : label; }
export function ftNodeW(label) { return Math.max(60, ftShort(label).length * 6.4 + 14); }
// Ordem de nascimento a partir de {year, month, day, display}: só quando o ano aparece.
export function ftBirthKey(b) {
  if (!b || typeof b.year !== "number" || ["ymd", "ym", "y"].indexOf(b.display) === -1) return null;
  return b.year * 10000 + (b.month || 0) * 100 + (b.day || 0);
}

function byBirth(list) {
  return list.map(function (it, i) { return { it: it, i: i }; }).sort(function (a, b) {
    var ka = a.it.bk, kb = b.it.bk;
    if (ka != null && kb != null && ka !== kb) return ka - kb;
    if (ka != null && kb == null) return -1;
    if (ka == null && kb != null) return 1;
    return a.i - b.i;
  }).map(function (o) { return o.it; });
}
function groupW(items) { return items.reduce(function (s, it) { return s + it.w; }, 0) + FT_GAP * Math.max(0, items.length - 1); }
// Grupos em ordem, cada um centrado no seu ponto de apoio, empurrando pra direita o que encostar.
function place(groups) {
  var prevEnd = -Infinity;
  groups.forEach(function (g) {
    if (!g.items.length) return;
    var start = g.anchor - groupW(g.items) / 2;
    if (start < prevEnd + FT_GROUP_GAP) start = prevEnd + FT_GROUP_GAP;
    var x = start;
    g.items.forEach(function (it) { it.x = x + it.w / 2; x += it.w + FT_GAP; });
    prevEnd = x - FT_GAP;
  });
}
function span(items) {
  var a = Infinity, b = -Infinity;
  items.forEach(function (it) { a = Math.min(a, it.x); b = Math.max(b, it.x); });
  return [a, b];
}

export function familyTreeLayout(inp) {
  function box(label, y, extra) {
    var o = { label: label || "", short: ftShort(label), w: ftNodeW(label), x: 0, y: y, self: false, ref: null };
    for (var k in extra) o[k] = extra[k];
    return o;
  }
  var self = box(inp.self.label, SELF_Y, { self: true, bk: inp.self.bk == null ? null : inp.self.bk });

  // ---- pais: até dois biológicos formam o casal; adoção/criação (e um terceiro) ficam à parte
  var bio = [], extraP = [];
  (inp.parents || []).forEach(function (p) { (!p.adopt && bio.length < 2 ? bio : extraP).push(box(p.label, P_Y, { key: p.key, adopt: !!p.adopt, ref: p.ref })); });
  // sem pai/mãe de sangue, os dois primeiros adotivos viram o casal de cima (em tracejado)
  var adoptCouple = !bio.length && extraP.length >= 2;
  if (adoptCouple) bio = extraP.splice(0, 2);
  var leftKey = bio[0] && bio[0].key, rightKey = bio[1] && bio[1].key;

  // ---- linha da pessoa: meio-irmãos do lado do pai/mãe que dividem, irmãos por idade, cônjuges colados na pessoa
  var full = [], halfL = [], halfR = [];
  (inp.sibs || []).forEach(function (s) {
    var b = box(s.label, SELF_Y, { bk: s.bk == null ? null : s.bk, via: s.via || [], half: !!s.half, ref: s.ref });
    if (!s.half) full.push(b);
    else if (rightKey != null && b.via.indexOf(rightKey) !== -1 && b.via.indexOf(leftKey) === -1) halfR.push(b);
    else halfL.push(b);
  });
  // casamento atual colado na pessoa; os anteriores (desfeito, viuvez) e os coparentes mais pra fora
  var spRank = function (s) { return !s.status ? 0 : s.status === "par" ? 2 : 1; };
  var spouseIn = [0, 1, 2].reduce(function (a, r) { return a.concat((inp.spouses || []).filter(function (s) { return spRank(s) === r; })); }, []);
  var spouses = spouseIn.map(function (s, i) { return box(s.label, SELF_Y, { key: s.key, union: i + 1, status: s.status || "", ref: s.ref }); });
  var sibship = byBirth(full.concat([self]));
  var row = [].concat(halfL);
  sibship.forEach(function (b) { row.push(b); if (b === self) row = row.concat(spouses); });
  row = row.concat(halfR);
  place([{ items: row, anchor: 0 }]);

  // ---- filhos: um grupo por casamento (e um da pessoa sozinha), cada um embaixo do seu casal
  var spouseByKey = {};
  spouses.forEach(function (s) { if (s.key != null) spouseByKey[s.key] = s; });
  var kids = (inp.kids || []).map(function (k) { return box(k.label, C_Y, { key: k.key, bk: k.bk == null ? null : k.bk, adopt: !!k.adopt, ref: k.ref, sp: (k.with != null && spouseByKey[k.with]) || null }); });
  var kidGroups = [{ from: null, items: byBirth(kids.filter(function (k) { return !k.sp; })), anchor: self.x }];
  spouses.forEach(function (s) { kidGroups.push({ from: s, items: byBirth(kids.filter(function (k) { return k.sp === s; })), anchor: (self.x + s.x) / 2 }); });
  kidGroups = kidGroups.filter(function (g) { return g.items.length; }).sort(function (a, b) { return a.anchor - b.anchor; });
  place(kidGroups);

  // ---- netos: embaixo do filho que é pai/mãe deles
  var kidByKey = {};
  kids.forEach(function (k) { if (k.key != null) kidByKey[k.key] = k; });
  var gkGroups = [], gkUnknown = [];
  (inp.gks || []).forEach(function (g) {
    var b = box(g.label, GC_Y, { ref: g.ref });
    var k = g.via != null ? kidByKey[g.via] : null;
    if (!k) { gkUnknown.push(b); return; }
    var grp = gkGroups.filter(function (x) { return x.kid === k; })[0];
    if (!grp) { grp = { kid: k, items: [], anchor: k.x }; gkGroups.push(grp); }
    grp.items.push(b);
  });
  if (gkUnknown.length) gkGroups.push({ kid: null, items: gkUnknown, anchor: kids.length ? (span(kids)[0] + span(kids)[1]) / 2 : self.x });
  gkGroups.sort(function (a, b) { return a.anchor - b.anchor; });
  place(gkGroups);

  // ---- pais em cima do meio da linha dos irmãos, afastados o bastante pros avós de cada lado
  var sib = span(sibship), sibMid = (sib[0] + sib[1]) / 2;
  var gpsOf = function (key) { return (inp.gps || []).filter(function (g) { return key != null && g.via === key; }); };
  if (bio.length === 2) {
    var gw0 = groupW(gpsOf(bio[0].key).map(function (g) { return { w: ftNodeW(g.label) }; }));
    var gw1 = groupW(gpsOf(bio[1].key).map(function (g) { return { w: ftNodeW(g.label) }; }));
    var d = Math.max(bio[0].w / 2 + bio[1].w / 2 + 44, gw0 / 2 + gw1 / 2 + FT_GROUP_GAP);
    bio[0].x = sibMid - d / 2; bio[1].x = sibMid + d / 2;
  } else if (bio.length === 1) bio[0].x = sibMid;
  if (extraP.length) {
    var cursor = bio.length ? bio[bio.length - 1].x + bio[bio.length - 1].w / 2 + FT_GROUP_GAP : null;
    if (cursor == null) place([{ items: extraP, anchor: sibMid }]);
    else extraP.forEach(function (p) { p.x = cursor + p.w / 2; cursor += p.w + FT_GAP; });
  }
  var parentsMid = bio.length === 2 ? (bio[0].x + bio[1].x) / 2 : bio.length ? bio[0].x : sibMid;

  // ---- avós: cada par em cima do seu filho; os que não dá pra situar, no meio
  var gpGroups = [], gpUnknown = [];
  var bioByKey = {};
  bio.forEach(function (p) { if (p.key != null) bioByKey[p.key] = p; });
  (inp.gps || []).forEach(function (g) {
    var b = box(g.label, GP_Y, { ref: g.ref });
    var p = g.via != null ? bioByKey[g.via] : null;
    if (!p) { gpUnknown.push(b); return; }
    var grp = gpGroups.filter(function (x) { return x.parent === p; })[0];
    if (!grp) { grp = { parent: p, items: [], anchor: p.x }; gpGroups.push(grp); }
    grp.items.push(b);
  });
  if (gpUnknown.length) gpGroups.push({ parent: null, items: gpUnknown, anchor: parentsMid });
  gpGroups.sort(function (a, b) { return a.anchor - b.anchor; });
  place(gpGroups);

  // ---- outros parentes: faixa embaixo de tudo, sem caminho na árvore
  var lastY = (inp.gks || []).length ? GC_Y : kids.length ? C_Y : SELF_Y;
  var OTHER_Y = lastY + OTHER_GAP;
  var others = (inp.others || []).map(function (o) { return box(o.label, OTHER_Y, { term: o.term || "", ref: o.ref }); });
  place([{ items: others, anchor: self.x }]);

  // ---- tudo pra dentro da área (e centrado quando sobra espaço)
  var boxes = [].concat(gpGroups.reduce(function (a, g) { return a.concat(g.items); }, []), bio, extraP, row, kids, gkGroups.reduce(function (a, g) { return a.concat(g.items); }, []), others);
  var min = Infinity, max = -Infinity;
  boxes.forEach(function (b) { min = Math.min(min, b.x - b.w / 2); max = Math.max(max, b.x + b.w / 2); });
  var W = Math.max(FT_MIN_W, Math.ceil(max - min + 2 * FT_PAD));
  var shift = (W - (max - min)) / 2 - min;
  boxes.forEach(function (b) { b.x += shift; });
  kidGroups.forEach(function (g) { g.anchor += shift; });
  sibMid += shift; parentsMid += shift;

  // ---- linhas
  var lines = [];
  function ln(x1, y1, x2, y2, dash) { lines.push({ x1: x1, y1: y1, x2: x2, y2: y2, dash: dash || "" }); }
  function hline(xs, y, dash) { var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs); if (b > a) ln(a, y, b, y, dash); }
  function couple(items, y) {
    // linha de casal entre caixas vizinhas; devolve o ponto de onde os filhos descem
    for (var i = 1; i < items.length; i++) ln(items[i - 1].x + items[i - 1].w / 2, y, items[i].x - items[i].w / 2, y);
    return items.length > 1 ? { x: (items[0].x + items[items.length - 1].x) / 2, y: y } : { x: items[0].x, y: y + HALF_H };
  }

  // pais → irmãos
  var sibY = SELF_Y - HALF_H - 16, halfY = sibY - 9;
  if (bio.length) {
    var pc = couple(bio, P_Y), pd = adoptCouple ? "adocao" : "";
    ln(pc.x, pc.y, pc.x, sibY, pd);
    hline(sibship.map(function (b) { return b.x; }).concat([pc.x]), sibY, pd);
    sibship.forEach(function (b) { ln(b.x, sibY, b.x, SELF_Y - HALF_H, pd); });
  } else if (sibship.length > 1) {
    hline(sibship.map(function (b) { return b.x; }), sibY);
    sibship.forEach(function (b) { ln(b.x, sibY, b.x, SELF_Y - HALF_H); });
  }
  halfL.concat(halfR).forEach(function (h) {
    var p = bio.filter(function (q) { return q.key != null && h.via.indexOf(q.key) !== -1; })[0];
    if (p) {
      ln(p.x, P_Y + HALF_H, p.x, halfY); ln(p.x, halfY, h.x, halfY); ln(h.x, halfY, h.x, SELF_Y - HALF_H);
    } else {
      // não dá pra saber qual pai/mãe divide: pontilhado até a linha dos irmãos
      var near = h.x < self.x ? sib[0] + shift : sib[1] + shift;
      ln(h.x, SELF_Y - HALF_H, h.x, sibY, "incerto"); ln(h.x, sibY, near, sibY, "incerto");
    }
  });
  extraP.forEach(function (p, i) {
    var ay = sibY - 20 - 5 * i, tx = self.x + 10;
    ln(p.x, P_Y + HALF_H, p.x, ay, "adocao"); ln(p.x, ay, tx, ay, "adocao"); ln(tx, ay, tx, SELF_Y - HALF_H, "adocao");
  });

  // avós → pais
  var gpY = P_Y - HALF_H - 14;
  gpGroups.forEach(function (g, gi) {
    var c = couple(g.items, GP_Y);
    var yy = gpY - 4 * gi;
    if (g.parent) {
      ln(c.x, c.y, c.x, yy); ln(c.x, yy, g.parent.x, yy); ln(g.parent.x, yy, g.parent.x, P_Y - HALF_H);
    } else {
      var tx = bio.length ? parentsMid : self.x, ty = bio.length ? P_Y : SELF_Y - HALF_H;
      ln(c.x, c.y, c.x, yy, "incerto"); ln(c.x, yy, tx, yy, "incerto"); ln(tx, yy, tx, ty, "incerto");
    }
  });

  // pessoa ↔ cônjuges (U embaixo das caixas) e filhos de cada casamento
  var sx = spouses.length ? self.x + Math.min(self.w / 4, 24) : self.x;
  var unionAt = {};
  spouses.forEach(function (s, i) {
    var uy = SELF_Y + HALF_H + 9 + 7 * i;
    var ud = s.status === "par" ? "uniao" : "";
    ln(sx, SELF_Y + HALF_H, sx, uy, ud); ln(sx, uy, s.x, uy, ud); ln(s.x, uy, s.x, SELF_Y + HALF_H, ud);
    unionAt[s.union] = { x: (sx + s.x) / 2, y: uy };
    if (s.status === "ex") {
      // casamento desfeito: duas barrinhas cortando a linha do casal
      var xm = sx + (s.x - sx) * 0.72;
      ln(xm - 5, uy + 5, xm - 1, uy - 5); ln(xm + 1, uy + 5, xm + 5, uy - 5);
    }
  });
  var kY = C_Y - HALF_H - 14;
  kidGroups.forEach(function (g, gi) {
    var from = g.from ? unionAt[g.from.union] : { x: spouses.length ? self.x - Math.min(self.w / 4, 24) : self.x, y: SELF_Y + HALF_H };
    var yy = kY - 5 * gi;
    // todos os filhos desse casal adotados: a linha inteira do casal até eles é tracejada
    var gd = g.items.every(function (k) { return k.adopt; }) ? "adocao" : "";
    ln(from.x, from.y, from.x, yy, gd);
    hline(g.items.map(function (k) { return k.x; }).concat([from.x]), yy, gd);
    g.items.forEach(function (k) { ln(k.x, yy, k.x, C_Y - HALF_H, k.adopt ? "adocao" : ""); });
  });

  // filhos → netos
  var gkY = GC_Y - HALF_H - 12;
  gkGroups.forEach(function (g, gi) {
    var yy = gkY - 4 * gi;
    if (g.kid) {
      ln(g.kid.x, C_Y + HALF_H, g.kid.x, yy);
      hline(g.items.map(function (b) { return b.x; }).concat([g.kid.x]), yy);
      g.items.forEach(function (b) { ln(b.x, yy, b.x, GC_Y - HALF_H); });
    } else {
      var fx = g.anchor + shift, fy = kids.length ? C_Y + HALF_H : SELF_Y + HALF_H;
      ln(fx, fy, fx, yy, "incerto");
      hline(g.items.map(function (b) { return b.x; }).concat([fx]), yy, "incerto");
      g.items.forEach(function (b) { ln(b.x, yy, b.x, GC_Y - HALF_H, "incerto"); });
    }
  });

  // faixa de outros parentes: pontilhado por cima, uma descida pra cada um, legenda acima
  var notes = [], nKin = lines.length; // daqui pra baixo é a faixa de outros parentes
  if (others.length) {
    var oy = OTHER_Y - HALF_H - 12;
    hline(others.map(function (b) { return b.x; }), oy, "incerto");
    others.forEach(function (b) { ln(b.x, oy, b.x, OTHER_Y - HALF_H, "incerto"); });
    var os = span(others);
    notes.push({ x: (os[0] + os[1]) / 2, y: oy - 9, text: "outros parentes (sem caminho na árvore)" });
  }

  // ---- legenda: só o que esta árvore desenhou
  var used = {};
  lines.slice(0, nKin).forEach(function (l) { used[l.dash || "sangue"] = 1; });
  if (bio.length === 2 || gpGroups.some(function (g) { return g.items.length > 1; }) || spouses.some(function (s) { return s.status !== "par"; })) used.casal = 1;
  if (spouses.some(function (s) { return s.status === "ex"; })) used.ex = 1;
  if (halfL.length || halfR.length) used.meio = 1;
  if (others.length) used.outros = 1;
  if (used.sangue && !(bio.length && !adoptCouple) && !kids.some(function (k) { return !k.adopt; }) && !(inp.gks || []).length && !(inp.gps || []).length && !full.length) delete used.sangue;
  var legend = FT_LEGEND.map(function (x) { return x[0]; }).filter(function (k) { return used[k]; });

  var y0 = ((inp.gps || []).length ? GP_Y : bio.length || extraP.length ? P_Y : SELF_Y) - 22;
  var y1 = others.length ? OTHER_Y + HALF_H + 26 : ((inp.gks || []).length ? GC_Y : kids.length ? C_Y : spouses.length ? SELF_Y + 20 : SELF_Y) + 22;
  return { W: W, y0: y0, y1: y1, cx: self.x, boxes: boxes, lines: lines, notes: notes, legend: legend };
}

// Largura mínima em tela: árvore grande rola pro lado em vez de encolher até ficar ilegível
// (no máximo a 75% do tamanho). null = a árvore cabe, fica como sempre foi.
export function ftMinWidth(W) { return W > FT_MIN_W ? Math.round(Math.max(FT_MIN_W, W * 0.75)) : null; }

// ---- entrada a partir das ligações publicadas (o que a wiki tem) ----
// Cada ligação de família publicada pode trazer `fam: {k, via, with, bk}` (quem é quem nesta
// árvore); página publicada antes disso não traz, e a árvore cai no desenho "incerto".
var PARENT_LABELS = ["é filho(a) de", "é filho(a) adotivo(a) de", "é filho(a) de criação de"];
var CHILD_LABELS = ["é pai/mãe de", "é pai/mãe adotivo(a) de", "é pai/mãe de criação de"];
var SIB_LABELS = ["irmão/irmã de", "gêmeo(a) de"];
// casamentos: "" = atual, "ex" = desfeito, "viuvo" = um dos dois morreu
var SPOUSE_STATUS = { "casado(a) com": "", "ex-cônjuge de": "ex", "viúvo(a) de": "viuvo", "cônjuge falecido(a) de": "viuvo" };
// marcados como família no editor, mas não são parentesco
var NOT_KIN = ["alma-irmã de"];
export function familyInputFromLinks(title, birthKey, links) {
  var inp = { self: { label: title, bk: birthKey == null ? null : birthKey }, parents: [], gps: [], sibs: [], spouses: [], kids: [], gks: [], others: [] };
  var inTree = {}, coparents = [];
  (links || []).forEach(function (lk, i) {
    if (lk.spoiler) return; // parentesco escondido nunca entra na árvore: ela revelaria o segredo
    var f = lk.fam || {}, key = f.k != null ? f.k : (lk.targetId || "l" + i), label = lk.targetTitle, bk = f.bk == null ? null : f.bk;
    // parente distante ("prima distante", "ancestral distante"): sempre na faixa, nunca na árvore
    if (lk.distant) { inp.others.push({ key: key, label: label, term: lk.term || "", ref: lk }); return; }
    if (PARENT_LABELS.indexOf(lk.label) !== -1) inp.parents.push({ key: key, label: label, adopt: lk.label !== PARENT_LABELS[0], ref: lk });
    else if (lk.label === "neto(a) de") inp.gps.push({ label: label, via: f.via == null ? null : f.via, ref: lk });
    else if (SIB_LABELS.indexOf(lk.label) !== -1) inp.sibs.push({ label: label, half: false, via: [], bk: bk, ref: lk });
    else if (lk.label === "meio-irmão/meia-irmã de") inp.sibs.push({ label: label, half: true, via: [].concat(f.via || []), bk: bk, ref: lk });
    else if (SPOUSE_STATUS[lk.label] != null) inp.spouses.push({ key: key, label: label, status: SPOUSE_STATUS[lk.label], ref: lk });
    else if (CHILD_LABELS.indexOf(lk.label) !== -1) {
      inp.kids.push({ key: key, label: label, with: f.with == null ? null : f.with, bk: bk, adopt: lk.label !== CHILD_LABELS[0], ref: lk });
      // o outro pai/mãe desse filho, quando não é cônjuge da pessoa (wl = nome, wid = página)
      if (f.with != null && f.wl) coparents.push({ key: f.with, label: f.wl, status: "par", ref: f.wid ? { targetId: f.wid, targetTitle: f.wl } : null });
    }
    else if (lk.label === "avô/avó de") inp.gks.push({ label: label, via: f.via == null ? null : f.via, ref: lk });
    else if (lk.style === "family" && NOT_KIN.indexOf(lk.label) === -1) { inp.others.push({ key: key, label: label, term: lk.term || "", ref: lk }); return; }
    else return;
    inTree[key] = true;
  });
  var spKeys = {};
  inp.spouses.forEach(function (s) { spKeys[s.key] = 1; });
  coparents.forEach(function (c) { if (!spKeys[c.key]) { spKeys[c.key] = 1; inp.spouses.push(c); inTree[c.key] = true; } });
  // quem já está na árvore não se repete na faixa de outros parentes
  inp.others = inp.others.filter(function (o) { return !inTree[o.key]; });
  return inp;
}
export function familyHasAny(inp) {
  return !!(inp.parents.length || inp.gps.length || inp.sibs.length || inp.spouses.length || inp.kids.length || inp.gks.length || (inp.others || []).length);
}
