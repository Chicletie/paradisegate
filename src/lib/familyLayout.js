// Árvore genealógica na notação de genealogia, centrada numa pessoa (5 gerações: avós, pais,
// a pessoa com irmãos e cônjuges, filhos, netos). Parte pura, sem DOM: devolve caixas e
// linhas, e quem desenha só pinta. O editor do autor usa este mesmo arquivo (pelo vendor).
//
// Notação:
// - casal = linha horizontal entre os dois; os filhos descem do meio dessa linha; três ou mais
//   pais do mesmo filho (trisal) descem juntos numa barra embaixo deles;
// - irmãos penduram numa mesma linha que desce dos pais, do mais velho (esquerda) pro mais
//   novo; quem não tem data fica depois, na ordem em que veio;
// - meio-irmão desce só do pai/mãe que divide com a pessoa;
// - cada par de avós fica em cima do filho deles (também os pais dos pais adotivos);
// - cônjuges ficam de um lado da pessoa e os irmãos do outro (a pessoa na ponta da fila dos
//   irmãos, com um vão separando os dois grupos), ligados por uma linha em U embaixo das caixas;
//   cada casamento tem a sua faixa e a sua saída na caixa, e os filhos de cada casamento descem
//   da faixa dele; casamento desfeito (ex-cônjuge) leva duas barrinhas (//) na linha; viuvez leva
//   uma cruz (†);
// - pai/mãe de um filho que não é casado(a) com a pessoa ("coparente") fica ao lado como um
//   cônjuge, mas a linha entre os dois é traço-ponto (união sem casamento);
// - pais adotivos (ou de criação) formam o seu próprio casal, em tracejado até a pessoa; quando
//   há também pais biológicos, os dois casais aparecem lado a lado, cada um com os seus avós;
// - padrasto/madrasta fica casado com o pai/mãe dele(a), sem linha até a pessoa; enteado desce
//   do cônjuge que é pai/mãe dele;
// - responsável legal (guarda) em tracejado; gestação por substituição e doação em linha dupla
//   (origem sem criar), com o termo na caixa;
// - outros parentes (primos, tios, bisavós, cunhados…) e quem é marcado como parente distante
//   ficam numa faixa embaixo, cada um com o seu termo ("prima distante", "ancestral distante"),
//   presos por pontilhado: parentesco sem caminho na árvore;
// - duas linhas que só se cruzam (sem ligação entre elas) ganham uma ponte (um pulinho);
// - ligação que não dá pra situar (dado antigo ou parente não publicado) em pontilhado até o
//   lugar mais provável.
//
// Entrada: { self: {label, bk},
//   parents: [{key, label, kind, adopt, term, with, ref}]  (kind: "bio" | "adocao" | "criacao" |
//     "padrasto" | "responsavel" | "gestante" | "doador"; sem kind, adopt=true vale "adocao";
//     with = com quem o padrasto/madrasta é casado(a), entre os pais),
//   gps: [{label, via, ref}], sibs: [{label, half, via: [keys], bk, ref}],
//   spouses: [{key, label, status: ""|"ex"|"viuvo"|"par", term, ref}],
//   kids: [{key, label, with, bk, adopt, kind, term, ref}]  (kind: "bio" | "adocao" | "criacao" |
//     "enteado" | "responsavel" | "gestacao" | "doacao"),
//   gks: [{label, via, ref}], others: [{key, label, term, ref}] }
// (key = identificador de uma pessoa nesta árvore; via/with apontam pra ele; bk = número
// pra ordenar por nascimento, ou null).
// Saída: { W, y0, y1, cx, boxes: [{x, y, w, h, short, label, self, term, ref}],
//   lines: [{x1, y1, x2, y2, dash, rel, mark, hops}], notes: [{x, y, text}], legend: [chave] }
// (h = meia altura da caixa; term = segunda linha pequena dentro da caixa; rel = de qual ligação
// é a linha; mark = barrinha/cruz desenhada em cima de outra linha; hops = pontes [{x, r}] numa
// linha horizontal — desenhe com ftLinePath). dash: "" linha cheia, "adocao" tracejado,
// "incerto" pontilhado, "uniao" traço-ponto, "origem" linha dupla (já vem em duas linhas).

// Itens da legenda, na ordem em que aparecem: chave → texto.
export var FT_LEGEND = [
  ["sangue", "pais e filhos"],
  ["casal", "casal"],
  ["ex", "casamento desfeito"],
  ["viuvo", "viuvez (um dos dois morreu)"],
  ["uniao", "pais do mesmo filho, sem casamento"],
  ["adocao", "adoção, criação ou guarda"],
  ["origem", "gestação ou doação, sem criar"],
  ["meio", "meio-irmão (de um dos pais)"],
  ["incerto", "ligação sem lugar certo"],
  ["ponte", "linhas que só se cruzam"],
  ["outros", "outros parentes"]
];
export var FT_MIN_W = 460, FT_PAD = 12, FT_GAP = 14, FT_GROUP_GAP = 30;
var GP_Y = 20, P_Y = 110, SELF_Y0 = 220, C_Y0 = 330, GC_Y0 = 420, OTHER_GAP = 110;
var HH = 13, HH_TERM = 19; // meia altura da caixa (com termo, duas linhas)
var SPOUSE_GAP = 44; // vão entre a fila dos irmãos e os cônjuges
var HOP_R = 3.5;

export function ftShort(label) { label = label || ""; return label.length > 16 ? label.slice(0, 15) + "…" : label; }
export function ftNodeW(label, term) {
  var w = Math.max(60, ftShort(label).length * 6.4 + 14);
  return term ? Math.max(w, ftShort(term).length * 5.4 + 14) : w;
}
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

var PARENT_TERM_KINDS = { padrasto: 1, responsavel: 1, gestante: 1, doador: 1 };
var KID_TERM_KINDS = { enteado: 1, responsavel: 1, gestacao: 1, doacao: 1 };

export function familyTreeLayout(inp) {
  // as filas de baixo descem quando há muitas faixas entre os pais e a pessoa
  var SELF_Y = SELF_Y0, C_Y = C_Y0, GC_Y = GC_Y0;
  function box(label, y, extra) {
    var o = { label: label || "", short: ftShort(label), x: 0, y: y, self: false, ref: null, term: "" };
    for (var k in extra) o[k] = extra[k];
    o.term = o.term || "";
    o.w = ftNodeW(o.label, o.term);
    o.h = o.term ? HH_TERM : HH;
    return o;
  }
  var self = box(inp.self.label, SELF_Y, { self: true, bk: inp.self.bk == null ? null : inp.self.bk });

  // ---- pais, separados por tipo
  var allP = (inp.parents || []).map(function (p) {
    var kind = p.kind || (p.adopt ? "adocao" : "bio");
    return box(p.label, P_Y, { key: p.key, kind: kind, partner: p.with == null ? null : p.with, term: PARENT_TERM_KINDS[kind] ? p.term || "" : "", ref: p.ref });
  });
  var bioP = allP.filter(function (p) { return p.kind === "bio"; });
  var adoP = allP.filter(function (p) { return p.kind === "adocao" || p.kind === "criacao"; });
  var groups = []; // {items, dash, main}
  if (bioP.length) groups.push({ items: bioP, dash: "", main: true });
  if (adoP.length) groups.push({ items: adoP, dash: "adocao", main: !bioP.length });
  // padrasto/madrasta ao lado de quem ele(a) é casado(a); sem saber com quem, fica sozinho
  allP.filter(function (p) { return p.kind === "padrasto"; }).forEach(function (st) {
    var g = st.partner != null && groups.filter(function (x) { return x.items.some(function (q) { return q.key === st.partner && q.kind !== "padrasto"; }); })[0];
    if (!g) { groups.push({ items: [st], dash: "adocao", main: false }); return; }
    var i = g.items.map(function (q) { return q.key; }).indexOf(st.partner);
    if (i === 0 && g.items.length > 1) g.items.unshift(st); else g.items.splice(i + 1, 0, st);
  });
  allP.filter(function (p) { return p.kind === "responsavel"; }).forEach(function (p) { groups.push({ items: [p], dash: "adocao", main: false }); });
  allP.filter(function (p) { return p.kind === "gestante" || p.kind === "doador"; }).forEach(function (p) { groups.push({ items: [p], dash: "origem", main: false }); });
  groups.forEach(function (g) { g.real = g.items.filter(function (q) { return q.kind !== "padrasto"; }); });
  var main = groups.filter(function (g) { return g.main; })[0] || null;
  var side = groups.filter(function (g) { return g !== main; });
  var parentBoxes = [];
  groups.forEach(function (g) { parentBoxes = parentBoxes.concat(g.items); });

  // ---- cônjuges: os casamentos sem filhos mais perto da pessoa, os com filhos mais longe (a
  // descida dos filhos então não corta nenhum outro casamento); em cada grupo, o atual primeiro,
  // depois desfeito/viuvez, depois coparentes
  var unionKind = function (k) { var kd = k.kind || (k.adopt ? "adocao" : "bio"); return kd !== "enteado" && kd !== "gestacao" && kd !== "doacao"; };
  var hasKids = function (s) { return s.status === "par" || (inp.kids || []).some(function (k) { return k.with != null && k.with === s.key && unionKind(k); }); };
  var spRank = function (s) { return (hasKids(s) ? 3 : 0) + (!s.status ? 0 : s.status === "par" ? 2 : 1); };
  var spouseIn = [0, 1, 2, 3, 4, 5].reduce(function (a, r) { return a.concat((inp.spouses || []).filter(function (s) { return spRank(s) === r; })); }, []);
  var spouses = spouseIn.map(function (s, i) { return box(s.label, SELF_Y, { key: s.key, union: i, status: s.status || "", term: s.term || "", ref: s.ref }); });

  // ---- linha da pessoa: meio-irmãos do lado do pai/mãe que dividem, irmãos por idade
  var leftKey = main && main.real[0] && main.real[0].key, rightKey = main && main.real.length > 1 ? main.real[main.real.length - 1].key : null;
  var full = [], halfL = [], halfR = [], sideSibs = [];
  var inMain = function (keys) { return !main || !keys.length || main.real.some(function (q) { return keys.indexOf(q.key) !== -1; }); };
  (inp.sibs || []).forEach(function (s) {
    var b = box(s.label, SELF_Y, { bk: s.bk == null ? null : s.bk, via: s.via || [], half: !!s.half, term: s.twin ? s.term || "" : "", ref: s.ref });
    // irmão que só divide os pais de outro casal (irmão adotivo de quem também tem pais
    // biológicos): pendura no casal dele, do lado de fora
    var g = !s.half && !inMain(b.via) && side.filter(function (x) { return x.real.some(function (q) { return b.via.indexOf(q.key) !== -1; }); })[0];
    if (g) { b.group = g; sideSibs.push(b); }
    else if (!s.half) full.push(b);
    else if (rightKey != null && b.via.indexOf(rightKey) !== -1 && b.via.indexOf(leftKey) === -1) halfR.push(b);
    else halfL.push(b);
  });
  var sibship = byBirth(full.concat([self]));
  // com cônjuge ou outro casal de pais, a pessoa vai pra ponta da fila (do lado mais perto de
  // onde ela estava) e o resto fica do outro lado: cônjuge nunca no meio dos irmãos
  var edge = spouses.length > 0 || side.length > 0;
  var dir = 1;
  if (edge) {
    var pos = sibship.indexOf(self), rest = sibship.filter(function (b) { return b !== self; });
    dir = sibship.length > 1 && pos <= (sibship.length - 1) / 2 ? -1 : 1;
    sibship = dir < 0 ? [self].concat(rest) : rest.concat([self]);
  }
  var row = [], gapBefore = [];
  function push(items, firstGap) { items.forEach(function (it, i) { row.push(it); gapBefore.push(i === 0 && row.length > 1 ? firstGap : FT_GAP); }); }
  sideSibs = byBirth(sideSibs);
  push(halfL, FT_GAP);
  if (dir < 0) { push(sideSibs.slice().reverse(), FT_GAP); push(spouses.slice().reverse(), SPOUSE_GAP); push(sibship, spouses.length || sideSibs.length ? SPOUSE_GAP : FT_GAP); }
  else { push(sibship, FT_GAP); push(spouses, SPOUSE_GAP); push(sideSibs, SPOUSE_GAP); }
  push(halfR, FT_GAP);
  var cur = 0;
  row.forEach(function (it, i) { if (i > 0) cur += gapBefore[i]; it.x = cur + it.w / 2; cur += it.w; });

  // ---- filhos: um grupo por casamento, os enteados embaixo do cônjuge, os da pessoa sozinha
  var spouseByKey = {};
  spouses.forEach(function (s) { if (s.key != null) spouseByKey[s.key] = s; });
  var kids = (inp.kids || []).map(function (k) {
    var kind = k.kind || (k.adopt ? "adocao" : "bio");
    return box(k.label, C_Y, { key: k.key, bk: k.bk == null ? null : k.bk, kind: kind, term: KID_TERM_KINDS[kind] ? k.term || "" : "", ref: k.ref, sp: (k.with != null && spouseByKey[k.with]) || null });
  });
  var unionKid = function (k) { return k.kind !== "enteado" && k.kind !== "gestacao" && k.kind !== "doacao"; };

  // ---- casamentos: linha em U embaixo das caixas, cada um com a sua saída na caixa e a sua
  // faixa. O mais perto passa mais perto das caixas e sai mais pra fora; o de mais longe passa
  // mais embaixo e sai mais pro meio: nenhuma faixa corta a saída nem a descida de outra.
  var need = HH_TERM + 12 + 6 * side.length + 5 * (halfL.length + halfR.length) + 10 + 14 + HH;
  var dy = Math.max(0, need - (SELF_Y - P_Y));
  if (dy) {
    SELF_Y += dy; C_Y += dy; GC_Y += dy;
    row.forEach(function (b) { b.y += dy; }); kids.forEach(function (b) { b.y += dy; });
  }
  var entryStep = side.length > 1 ? Math.min(8, (self.w / 2 - 20) / (side.length - 1)) : 0;
  // as faixas começam abaixo da caixa mais alta da fila (caixa com termo tem duas linhas)
  var rowBottom = SELF_Y + row.reduce(function (m, b) { return Math.max(m, b.h); }, HH);
  var n = spouses.length, stepOut = n ? Math.min(8, (self.w / 2 - 8) / n) : 0;
  spouses.forEach(function (s, i) {
    s.exitX = self.x + dir * (5 + stepOut * (n - 1 - i));
    s.laneY = rowBottom + 9 + 9 * i;
  });
  var soloX = self.x - dir * 6, originX = self.x - dir * 14;
  var kidGroups = [];
  spouses.forEach(function (s, i) {
    var a = i === 0 ? s.exitX : spouses[i - 1].x;
    s.dropX = a + (s.x - a) * 0.4;
    s.markX = a + (s.x - a) * 0.75;
  });
  spouses.forEach(function (s, i) {
    kidGroups.push({ kind: "union", from: s, x: s.dropX, y: s.laneY, rel: "u" + i, items: byBirth(kids.filter(function (k) { return k.sp === s && unionKid(k); })) });
    kidGroups.push({ kind: "step", from: s, x: s.x + dir * 10, y: SELF_Y + s.h, rel: "st" + i, items: byBirth(kids.filter(function (k) { return k.sp === s && k.kind === "enteado"; })) });
  });
  kidGroups.push({ kind: "solo", x: soloX, y: SELF_Y + self.h, rel: "solo", items: byBirth(kids.filter(function (k) { return !k.sp && k.kind !== "gestacao" && k.kind !== "doacao"; })) });
  kidGroups.push({ kind: "origem", x: originX, y: SELF_Y + self.h, rel: "orig", items: byBirth(kids.filter(function (k) { return k.kind === "gestacao" || k.kind === "doacao"; })) });
  kidGroups = kidGroups.filter(function (g) { return g.items.length; });
  // os filhos descem quando há muitos casamentos e grupos de filhos entre as faixas e eles
  var dyk = Math.max(0, (n ? rowBottom + 9 * n : SELF_Y + HH) + 10 + 5 * kidGroups.length - (C_Y - HH_TERM - 12));
  if (dyk) { C_Y += dyk; GC_Y += dyk; kids.forEach(function (b) { b.y += dyk; }); }
  kidGroups.forEach(function (g) { g.anchor = g.x; });
  kidGroups.sort(function (a, b) { return a.anchor - b.anchor; });
  place(kidGroups);

  // ---- netos: embaixo do filho que é pai/mãe deles
  if (!kids.length) GC_Y = C_Y; // sem filhos na árvore, os netos sobem pra fila deles
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

  // ---- casais de pais: o principal em cima dos irmãos; os outros ao lado, do lado da pessoa,
  // cada pai/mãe com espaço pros próprios pais em cima
  var sib = span(sibship), sibMid = (sib[0] + sib[1]) / 2;
  var gpsOf = function (key) { return (inp.gps || []).filter(function (g) { return key != null && g.via === key; }); };
  var gpW = function (key) { var l = gpsOf(key); return l.length ? groupW(l.map(function (g) { return { w: ftNodeW(g.label) }; })) : 0; };
  function layoutGroup(g) {
    g.items.forEach(function (it, i) {
      if (i === 0) { it.x = 0; return; }
      var a = g.items[i - 1];
      it.x = a.x + Math.max(a.w / 2 + it.w / 2 + 44, gpW(a.key) / 2 + gpW(it.key) / 2 + FT_GROUP_GAP);
    });
    var l = Infinity, r = -Infinity;
    g.items.forEach(function (it) { var half = Math.max(it.w, gpW(it.key)) / 2; l = Math.min(l, it.x - half); r = Math.max(r, it.x + half); });
    g.l = l; g.r = r;
  }
  function shiftGroup(g, dx) { g.items.forEach(function (it) { it.x += dx; }); g.l += dx; g.r += dx; }
  function dropOf(g) { var r = g.real.length ? g.real : g.items; return (r[0].x + r[r.length - 1].x) / 2; }
  groups.forEach(layoutGroup);
  var edgeL, edgeR;
  if (main) { shiftGroup(main, sibMid - dropOf(main)); edgeL = main.l; edgeR = main.r; }
  else { edgeL = edgeR = self.x; }
  side.forEach(function (g, i) {
    if (!main && i === 0) { shiftGroup(g, self.x + dir * 20 - dropOf(g)); edgeL = g.l; edgeR = g.r; return; }
    if (dir > 0) { shiftGroup(g, edgeR + FT_GROUP_GAP - g.l); edgeR = g.r; }
    else { shiftGroup(g, edgeL - FT_GROUP_GAP - g.r); edgeL = g.l; }
  });
  var parentsMid = main ? dropOf(main) : sibMid;

  // ---- avós: cada par em cima do seu filho; os que não dá pra situar, no meio
  var gpGroups = [], gpUnknown = [];
  var pByKey = {};
  parentBoxes.forEach(function (p) { if (p.key != null && p.kind !== "padrasto") pByKey[p.key] = p; });
  (inp.gps || []).forEach(function (g) {
    var b = box(g.label, GP_Y, { ref: g.ref });
    var p = g.via != null ? pByKey[g.via] : null;
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
  var boxes = [].concat(gpGroups.reduce(function (a, g) { return a.concat(g.items); }, []), parentBoxes, row, kids, gkGroups.reduce(function (a, g) { return a.concat(g.items); }, []), others);
  var min = Infinity, max = -Infinity;
  boxes.forEach(function (b) { min = Math.min(min, b.x - b.w / 2); max = Math.max(max, b.x + b.w / 2); });
  var W = Math.max(FT_MIN_W, Math.ceil(max - min + 2 * FT_PAD));
  var shift = (W - (max - min)) / 2 - min;
  boxes.forEach(function (b) { b.x += shift; });
  kidGroups.forEach(function (g) { g.x += shift; });
  spouses.forEach(function (s) { s.exitX += shift; s.dropX += shift; s.markX += shift; });
  soloX += shift; originX += shift; sibMid += shift; parentsMid += shift;
  sib = [sib[0] + shift, sib[1] + shift];

  // ---- linhas
  var lines = [], used = {};
  function ln(x1, y1, x2, y2, dash, rel, mark) {
    if (Math.abs(x1 - x2) < 0.01 && Math.abs(y1 - y2) < 0.01) return;
    lines.push({ x1: x1, y1: y1, x2: x2, y2: y2, dash: dash || "", rel: rel || "", mark: !!mark });
  }
  function hline(xs, y, dash, rel) { var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs); if (b > a) ln(a, y, b, y, dash, rel); }
  // caminho em ângulo reto; "origem" sai em linha dupla
  function path(pts, dash, rel) {
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i - 1], q = pts[i];
      if (dash !== "origem") { ln(p[0], p[1], q[0], q[1], dash, rel); continue; }
      var vx = p[0] === q[0], o = 1.4;
      ln(p[0] + (vx ? -o : 0), p[1] + (vx ? 0 : -o), q[0] + (vx ? -o : 0), q[1] + (vx ? 0 : -o), dash, rel);
      ln(p[0] + (vx ? o : 0), p[1] + (vx ? 0 : o), q[0] + (vx ? o : 0), q[1] + (vx ? 0 : o), dash, rel);
    }
  }
  function top(b) { return b.y - b.h; }
  function bottom(b) { return b.y + b.h; }
  function coupleLine(a, b, rel) { var l = a.x < b.x ? a : b, r = l === a ? b : a; ln(l.x + l.w / 2, l.y, r.x - r.w / 2, r.y, "", rel); used.casal = 1; }

  // pais → pessoa e irmãos
  var sibY = SELF_Y - HH - 16;
  // de onde os filhos de um casal de pais descem: meio da linha do casal; um sozinho, embaixo
  // dele; três ou mais, uma barra embaixo de todos
  function groupDrop(g, gi) {
    var rel = "p" + gi;
    g.items.forEach(function (it, i) {
      if (i === 0) return;
      var a = g.items[i - 1];
      if (a.kind === "padrasto" || it.kind === "padrasto" || g.real.length === 2) coupleLine(a, it, rel);
    });
    var r = g.real.length ? g.real : g.items;
    if (r.length === 1) return { x: r[0].x, y: bottom(r[0]) };
    if (r.length === 2) return { x: (r[0].x + r[1].x) / 2, y: P_Y };
    var by = P_Y + HH_TERM + 6;
    r.forEach(function (q) { ln(q.x, bottom(q), q.x, by, g.dash === "origem" ? "" : g.dash, rel); });
    hline(r.map(function (q) { return q.x; }), by, g.dash === "origem" ? "" : g.dash, rel);
    used.casal = 1;
    return { x: (r[0].x + r[r.length - 1].x) / 2, y: by };
  }
  if (main) {
    var pc = groupDrop(main, 0), pd = main.dash;
    ln(pc.x, pc.y, pc.x, sibY, pd, "sib");
    hline(sibship.map(function (b) { return b.x; }).concat([pc.x]), sibY, pd, "sib");
    sibship.forEach(function (b) { ln(b.x, sibY, b.x, top(b), pd, "sib"); });
    if (pd) used.adocao = 1; else used.sangue = 1;
  } else if (sibship.length > 1) {
    hline(sibship.map(function (b) { return b.x; }), sibY, "", "sib");
    sibship.forEach(function (b) { ln(b.x, sibY, b.x, top(b), "", "sib"); });
  }
  // meio-irmãos: cada um na sua faixa, descendo do pai/mãe que divide
  halfL.concat(halfR).forEach(function (h, i) {
    var hy = sibY - 8 - 5 * i, rel = "half" + i;
    var p = main && main.real.filter(function (q) { return q.key != null && h.via.indexOf(q.key) !== -1; })[0];
    if (p) {
      path([[p.x, bottom(p)], [p.x, hy], [h.x, hy], [h.x, top(h)]], "", rel);
      used.meio = 1; used.sangue = 1;
    } else {
      // não dá pra saber qual pai/mãe divide: pontilhado até a linha dos irmãos
      var near = h.x < self.x ? sib[0] : sib[1];
      path([[h.x, top(h)], [h.x, sibY], [near, sibY]], "incerto", rel);
      used.incerto = 1; used.meio = 1;
    }
  });
  // os outros casais de pais: cada um na sua faixa, entrando na pessoa por cima, do lado de fora
  var laneTop = P_Y + HH_TERM + 12;
  side.forEach(function (g, i) {
    var gi = groups.indexOf(g), d = groupDrop(g, gi), ly = laneTop + 6 * i;
    var ex = self.x + dir * (Math.min(18, self.w / 2 - 12) + entryStep * i), mine = sideSibs.filter(function (b) { return b.group === g; });
    if (!mine.length) path([[d.x, d.y], [d.x, ly], [ex, ly], [ex, top(self)]], g.dash, "p" + gi);
    else {
      // irmãos desse casal: todos na mesma faixa, como a linha dos irmãos
      var xs = mine.map(function (b) { return b.x; }).concat([ex, d.x]);
      path([[d.x, d.y], [d.x, ly]], g.dash, "p" + gi);
      path([[Math.min.apply(null, xs), ly], [Math.max.apply(null, xs), ly]], g.dash, "p" + gi);
      path([[ex, ly], [ex, top(self)]], g.dash, "p" + gi);
      mine.forEach(function (b) { path([[b.x, ly], [b.x, top(b)]], g.dash, "p" + gi); });
    }
    used[g.dash] = 1;
  });

  // avós → pais
  var gpY = P_Y - HH_TERM - 12;
  gpGroups.forEach(function (g, gi) {
    var rel = "gp" + gi;
    for (var i = 1; i < g.items.length; i++) coupleLine(g.items[i - 1], g.items[i], rel);
    var c = g.items.length > 1 ? { x: (g.items[0].x + g.items[g.items.length - 1].x) / 2, y: GP_Y } : { x: g.items[0].x, y: bottom(g.items[0]) };
    var yy = gpY - 4 * gi;
    if (g.parent) { path([[c.x, c.y], [c.x, yy], [g.parent.x, yy], [g.parent.x, top(g.parent)]], "", rel); used.sangue = 1; }
    else {
      var tx = parentBoxes.length ? parentsMid : self.x, ty = parentBoxes.length ? P_Y : top(self);
      path([[c.x, c.y], [c.x, yy], [tx, yy], [tx, ty]], "incerto", rel);
      used.incerto = 1;
    }
  });

  // pessoa ↔ cônjuges (U embaixo das caixas), cada casamento com a sua faixa
  spouses.forEach(function (s, i) {
    var ud = s.status === "par" ? "uniao" : "", rel = "u" + i;
    path([[s.exitX, bottom(self)], [s.exitX, s.laneY], [s.x, s.laneY], [s.x, bottom(s)]], ud, rel);
    if (ud) used.uniao = 1; else used.casal = 1;
    var xm = s.markX, uy = s.laneY;
    if (s.status === "ex") {
      // casamento desfeito: duas barrinhas cortando a linha do casal
      ln(xm - 5, uy + 5, xm - 1, uy - 5, "", rel, true); ln(xm + 1, uy + 5, xm + 5, uy - 5, "", rel, true);
      used.ex = 1;
    } else if (s.status === "viuvo") {
      // viuvez: uma cruz de pé na linha do casal
      ln(xm, uy, xm, uy - 7, "", rel, true); ln(xm - 2.5, uy - 5, xm + 2.5, uy - 5, "", rel, true);
      used.viuvo = 1;
    }
  });
  var kY = C_Y - HH_TERM - 12;
  kidGroups.forEach(function (g, gi) {
    var yy = kY - 5 * gi;
    var dash = g.kind === "origem" ? "origem" : g.items.every(function (k) { return k.kind !== "bio" && g.kind !== "step"; }) ? "adocao" : "";
    path([[g.x, g.y], [g.x, yy]], dash, g.rel);
    if (dash === "origem") {
      path([[Math.min.apply(null, g.items.map(function (k) { return k.x; }).concat([g.x])), yy], [Math.max.apply(null, g.items.map(function (k) { return k.x; }).concat([g.x])), yy]], "origem", g.rel);
      g.items.forEach(function (k) { path([[k.x, yy], [k.x, top(k)]], "origem", g.rel); });
      used.origem = 1;
      return;
    }
    hline(g.items.map(function (k) { return k.x; }).concat([g.x]), yy, dash, g.rel);
    g.items.forEach(function (k) {
      var kd = g.kind === "step" || k.kind === "bio" ? "" : "adocao";
      ln(k.x, yy, k.x, top(k), kd, g.rel);
      used[kd || "sangue"] = 1;
    });
  });

  // filhos → netos
  var gkY = GC_Y - HH - 12;
  gkGroups.forEach(function (g, gi) {
    var yy = gkY - 4 * gi, rel = "gk" + gi;
    if (g.kid) {
      ln(g.kid.x, bottom(g.kid), g.kid.x, yy, "", rel);
      hline(g.items.map(function (b) { return b.x; }).concat([g.kid.x]), yy, "", rel);
      g.items.forEach(function (b) { ln(b.x, yy, b.x, top(b), "", rel); });
      used.sangue = 1;
    } else {
      var fx = g.anchor + shift, fy = kids.length ? C_Y + HH : bottom(self);
      ln(fx, fy, fx, yy, "incerto", rel);
      hline(g.items.map(function (b) { return b.x; }).concat([fx]), yy, "incerto", rel);
      g.items.forEach(function (b) { ln(b.x, yy, b.x, top(b), "incerto", rel); });
      used.incerto = 1;
    }
  });

  // faixa de outros parentes: pontilhado por cima, uma descida pra cada um, legenda acima
  var notes = [];
  if (others.length) {
    var oy = OTHER_Y - HH_TERM - 12;
    hline(others.map(function (b) { return b.x; }), oy, "incerto", "outros");
    others.forEach(function (b) { ln(b.x, oy, b.x, top(b), "incerto", "outros"); });
    var os = span(others);
    notes.push({ x: (os[0] + os[1]) / 2, y: oy - 9, text: "outros parentes (sem caminho na árvore)" });
    used.outros = 1;
  }
  if (full.length) used.sangue = 1;

  // ---- pontes: linha vertical que atravessa uma horizontal de outra ligação, sem ser ponta
  var vs = lines.filter(function (l) { return !l.mark && Math.abs(l.x1 - l.x2) < 0.01; });
  lines.forEach(function (h) {
    if (h.mark || Math.abs(h.y1 - h.y2) > 0.01) return;
    var a = Math.min(h.x1, h.x2), b = Math.max(h.x1, h.x2), xs = [];
    vs.forEach(function (v) {
      if (v.rel === h.rel) return;
      var ya = Math.min(v.y1, v.y2), yb = Math.max(v.y1, v.y2);
      if (v.x1 > a + 1 && v.x1 < b - 1 && h.y1 > ya + 1 && h.y1 < yb - 1) xs.push(v.x1);
    });
    if (!xs.length) return;
    xs.sort(function (p, q) { return p - q; });
    var hops = [], c = [xs[0]];
    for (var i = 1; i <= xs.length; i++) {
      if (i < xs.length && xs[i] - c[c.length - 1] < 2 * HOP_R + 1) { c.push(xs[i]); continue; }
      hops.push({ x: (c[0] + c[c.length - 1]) / 2, r: HOP_R + (c[c.length - 1] - c[0]) / 2 });
      if (i < xs.length) c = [xs[i]];
    }
    h.hops = hops;
    used.ponte = 1;
  });

  // ---- legenda: só o que esta árvore desenhou
  var legend = FT_LEGEND.map(function (x) { return x[0]; }).filter(function (k) { return used[k]; });

  var y0 = ((inp.gps || []).length ? GP_Y : parentBoxes.length ? P_Y : SELF_Y) - 22;
  if (!parentBoxes.length && sibship.length > 1) y0 = Math.min(y0, sibY - 8);
  var y1 = others.length ? OTHER_Y + HH_TERM + 26 : ((inp.gks || []).length ? GC_Y : kids.length ? C_Y : spouses.length ? rowBottom + 12 + 9 * n : SELF_Y) + 26;
  return { W: W, y0: y0, y1: y1, cx: self.x, boxes: boxes, lines: lines, notes: notes, legend: legend };
}

// Caminho SVG de uma linha, com as pontes (meio círculo por cima) onde ela cruza outra.
export function ftLinePath(l) {
  var r2 = function (v) { return Math.round(v * 100) / 100; };
  var d = "M" + r2(l.x1) + " " + r2(l.y1);
  if (l.hops && l.hops.length && Math.abs(l.y1 - l.y2) < 0.01) {
    var fwd = l.x2 >= l.x1, hops = l.hops.slice().sort(function (a, b) { return fwd ? a.x - b.x : b.x - a.x; });
    hops.forEach(function (h) {
      var s = fwd ? h.x - h.r : h.x + h.r, e = fwd ? h.x + h.r : h.x - h.r;
      d += "L" + r2(s) + " " + r2(l.y1) + "A" + r2(h.r) + " " + r2(h.r) + " 0 0 " + (fwd ? 1 : 0) + " " + r2(e) + " " + r2(l.y1);
    });
  }
  return d + "L" + r2(l.x2) + " " + r2(l.y2);
}

// Largura mínima em tela: árvore grande rola pro lado em vez de encolher até ficar ilegível
// (no máximo a 75% do tamanho). null = a árvore cabe, fica como sempre foi.
export function ftMinWidth(W) { return W > FT_MIN_W ? Math.round(Math.max(FT_MIN_W, W * 0.75)) : null; }

// ---- entrada a partir das ligações publicadas (o que a wiki tem) ----
// Cada ligação de família publicada pode trazer `fam: {k, via, with, bk}` (quem é quem nesta
// árvore); página publicada antes disso não traz, e a árvore cai no desenho "incerto".
// Tipo de pai/mãe pelo lado de quem guarda a ligação ("A é filho(a) de B": B é pai/mãe).
var PARENT_KIND = {
  "é filho(a) de": "bio", "é filho(a) adotivo(a) de": "adocao", "é filho(a) de criação de": "criacao",
  "enteado(a) de": "padrasto", "sob a guarda de": "responsavel",
  "foi gestado(a) por": "gestante", "concebido(a) com doação de": "doador"
};
var CHILD_KIND = {
  "é pai/mãe de": "bio", "é pai/mãe adotivo(a) de": "adocao", "é pai/mãe de criação de": "criacao",
  "padrasto/madrasta de": "enteado", "responsável legal de": "responsavel",
  "gestou": "gestacao", "doador(a) de": "doacao"
};
var SIB_LABELS = ["irmão/irmã de", "gêmeo(a) de"];
// casamentos: "" = atual, "ex" = desfeito, "viuvo" = um dos dois morreu
var SPOUSE_STATUS = { "casado(a) com": "", "ex-cônjuge de": "ex", "viúvo(a) de": "viuvo", "cônjuge falecido(a) de": "viuvo" };
// marcados como família no editor, mas não são parentesco
var NOT_KIN = ["alma-irmã de"];
// canSee(ligação) = o leitor já pode ver este parentesco em spoiler (viu a temporada, "vi tudo"
// ou abriu a tarja na ficha). Sem canSee, parentesco em spoiler nunca entra: revelaria o segredo.
export function familyInputFromLinks(title, birthKey, links, canSee) {
  var inp = { self: { label: title, bk: birthKey == null ? null : birthKey }, parents: [], gps: [], sibs: [], spouses: [], kids: [], gks: [], others: [] };
  var inTree = {}, treeById = {}, coparents = [];
  (links || []).forEach(function (lk, i) {
    if (lk.spoiler && !(canSee && canSee(lk))) return;
    var f = lk.fam || {}, key = f.k != null ? f.k : (lk.targetId || "l" + i), label = lk.targetTitle, bk = f.bk == null ? null : f.bk;
    var it = null;
    // parente distante ("prima distante", "ancestral distante"): sempre na faixa, nunca na árvore
    if (lk.distant) { inp.others.push({ key: key, label: label, term: lk.term || "", ref: lk, id: lk.targetId }); return; }
    if (PARENT_KIND[lk.label]) inp.parents.push(it = { key: key, label: label, kind: PARENT_KIND[lk.label], adopt: PARENT_KIND[lk.label] !== "bio", term: lk.term || "", with: f.with == null ? null : f.with, ref: lk });
    else if (lk.label === "neto(a) de") inp.gps.push(it = { label: label, via: f.via == null ? null : f.via, ref: lk });
    else if (SIB_LABELS.indexOf(lk.label) !== -1) inp.sibs.push(it = { label: label, half: false, via: [].concat(f.via || []), bk: bk, twin: lk.label === "gêmeo(a) de", term: lk.term || "", ref: lk });
    else if (lk.label === "meio-irmão/meia-irmã de") inp.sibs.push(it = { label: label, half: true, via: [].concat(f.via || []), bk: bk, ref: lk });
    else if (SPOUSE_STATUS[lk.label] != null) inp.spouses.push(it = { key: key, label: label, status: SPOUSE_STATUS[lk.label], ref: lk });
    else if (CHILD_KIND[lk.label]) {
      var kind = CHILD_KIND[lk.label];
      inp.kids.push(it = { key: key, label: label, with: f.with == null ? null : f.with, bk: bk, kind: kind, adopt: kind !== "bio", term: lk.term || "", ref: lk });
      // o outro pai/mãe desse filho, quando não é cônjuge da pessoa (wl = nome, wid = página)
      if (f.with != null && f.wl && (kind === "bio" || kind === "adocao" || kind === "criacao")) coparents.push({ key: f.with, label: f.wl, status: "par", ref: f.wid ? { targetId: f.wid, targetTitle: f.wl } : null });
    }
    else if (lk.label === "avô/avó de") inp.gks.push(it = { label: label, via: f.via == null ? null : f.via, ref: lk });
    else if (lk.style === "family" && NOT_KIN.indexOf(lk.label) === -1) { inp.others.push({ key: key, label: label, term: lk.term || "", ref: lk, id: lk.targetId }); return; }
    else return;
    inTree[key] = true;
    if (lk.targetId && !treeById[lk.targetId]) treeById[lk.targetId] = it;
  });
  var spKeys = {};
  inp.spouses.forEach(function (s) { spKeys[s.key] = 1; });
  coparents.forEach(function (c) { if (!spKeys[c.key]) { spKeys[c.key] = 1; inp.spouses.push(c); inTree[c.key] = true; if (c.ref && c.ref.targetId) treeById[c.ref.targetId] = treeById[c.ref.targetId] || c; } });
  // quem já está na árvore não se repete na faixa de outros parentes; o parentesco a mais vira
  // o termo da caixa dele (Giulienne: cônjuge e também prima)
  inp.others = inp.others.filter(function (o) {
    if (inTree[o.key]) return false;
    var t = o.id && treeById[o.id];
    if (!t) return true;
    if (o.term && !t.term) t.term = o.term;
    return false;
  });
  inp.others.forEach(function (o) { delete o.id; });
  return inp;
}
export function familyHasAny(inp) {
  return !!(inp.parents.length || inp.gps.length || inp.sibs.length || inp.spouses.length || inp.kids.length || inp.gks.length || (inp.others || []).length);
}
