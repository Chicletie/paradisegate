// Famílias de teste da árvore genealógica (familyLayout.js): comuns e diversas, no formato em
// que a wiki recebe as ligações publicadas (com o `fam` que o editor calcula). Usadas pelos
// testes (familyLayout.cenarios.test.ts) e pela folha de desenhos que o autor confere.
// Nomes genéricos, menos os da página do Dementor (dados publicados da wiki).
// canSee: "" = visitante (spoiler fechado), "tudo" = o leitor já pode ver todo spoiler.

var F = "family";
function L(label, title, fam, extra) {
  var o = { label: label, targetTitle: title, targetId: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"), style: F };
  if (fam) o.fam = fam;
  for (var k in extra || {}) o[k] = extra[k];
  return o;
}

export var FAMILY_CENARIOS = [
  {
    id: "dementor",
    nome: "Dementor: casado, duas viuvezes (uma também prima), três irmãos, filho adotivo, prima distante em spoiler",
    title: "Dementor Cravensworth", bk: 18610821, canSee: "",
    links: [
      L("casado(a) com", "Devon Cravensworth", { k: "f6", bk: 19741129 }, { term: "marido" }),
      L("primo(a) de", "Asul", null, { term: "prima distante", distant: true, spoiler: "disfarce", at: "t1", cover: "amigo(a) de" }),
      L("é pai/mãe adotivo(a) de", "Asteri Cravensworth", { k: "f9", with: "f6" }, { term: "filho adotivo" }),
      L("é filho(a) de", "Lazlo Cravensworth", { k: "f1" }, { term: "pai" }),
      L("é filho(a) de", "Nadia Cravensworth", { k: "f2" }, { term: "mãe" }),
      L("irmão/irmã de", "Coríntio Cravensworth", { k: "f3" }, { term: "irmão" }),
      L("irmão/irmã de", "Velário Cravensworth", { k: "f4" }, { term: "irmão" }),
      L("irmão/irmã de", "Amânio Cravensworth", { k: "f5" }, { term: "irmão" }),
      L("viúvo(a) de", "Giulienne Cravensworth", { k: "f7" }, { term: "esposa falecida" }),
      L("primo(a) de", "Giulienne Cravensworth", null, { term: "prima" }),
      L("viúvo(a) de", "Cygnus Lebedev", { k: "f8" }, { term: "marido falecido" })
    ]
  },
  { id: "dementor-revelado", nome: "Dementor com a temporada da Asul já vista", same: "dementor", canSee: "tudo" },
  {
    id: "adotivos-e-biologicos",
    nome: "Filho com pais adotivos e pais biológicos, avós dos quatro lados, irmão biológico e irmã adotiva",
    title: "Asteri Cravensworth", canSee: "",
    links: [
      L("é filho(a) adotivo(a) de", "Dementor Cravensworth", { k: "f1" }, { term: "pai adotivo" }),
      L("é filho(a) adotivo(a) de", "Devon Cravensworth", { k: "f2" }, { term: "pai adotivo" }),
      L("é filho(a) de", "Pai biológico", { k: "f3" }, { term: "pai" }),
      L("é filho(a) de", "Mãe biológica", { k: "f4" }, { term: "mãe" }),
      L("neto(a) de", "Lazlo Cravensworth", { k: "f5", via: "f1" }),
      L("neto(a) de", "Nadia Cravensworth", { k: "f6", via: "f1" }),
      L("neto(a) de", "Avó do Devon", { k: "f7", via: "f2" }),
      L("neto(a) de", "Avô paterno", { k: "f8", via: "f3" }),
      L("neto(a) de", "Avó materna", { k: "f9", via: "f4" }),
      L("irmão/irmã de", "Irmão biológico", { k: "f10", via: ["f3", "f4"] }),
      L("irmão/irmã de", "Irmã adotiva", { k: "f11", via: ["f1", "f2"] })
    ]
  },
  {
    id: "gestacao-casal-de-homens",
    nome: "Casal de dois homens, filho gerado por barriga de aluguel (página do filho)",
    title: "Criança", canSee: "",
    links: [
      L("é filho(a) de", "Pai 1", { k: "f1" }, { term: "pai" }),
      L("é filho(a) de", "Pai 2", { k: "f2" }, { term: "pai" }),
      L("foi gestado(a) por", "Gestante", { k: "f3" }, { term: "gestante" })
    ]
  },
  {
    id: "gestacao-pagina-do-pai",
    nome: "O mesmo casal, na página de um dos pais (a gestante não entra: não é parente dele)",
    title: "Pai 1", canSee: "",
    links: [
      L("casado(a) com", "Pai 2", { k: "f1" }, { term: "marido" }),
      L("é pai/mãe de", "Criança", { k: "f2", with: "f1" }, { term: "filho" })
    ]
  },
  {
    id: "doador-casal-de-mulheres",
    nome: "Casal de duas mulheres, filha concebida com doação (página da filha)",
    title: "Filha", canSee: "",
    links: [
      L("é filho(a) de", "Mãe 1", { k: "f1" }, { term: "mãe" }),
      L("é filho(a) de", "Mãe 2", { k: "f2" }, { term: "mãe" }),
      L("concebido(a) com doação de", "Doador", { k: "f3" }, { term: "doador" }),
      L("neto(a) de", "Avó", { k: "f4", via: "f1" })
    ]
  },
  {
    id: "doador-pagina-do-doador",
    nome: "Página do doador: a filha aparece ligada por doação, sem casal",
    title: "Doador", canSee: "",
    links: [
      L("casado(a) com", "Esposa do doador", { k: "f1" }, { term: "esposa" }),
      L("é pai/mãe de", "Filho do doador", { k: "f2", with: "f1" }, { term: "filho" }),
      L("doador(a) de", "Filha", { k: "f3" }, { term: "doação" })
    ]
  },
  {
    id: "trisal-pagina-de-um",
    nome: "Trisal: dois cônjuges atuais, filhos de pares diferentes",
    title: "Pessoa A", canSee: "",
    links: [
      L("casado(a) com", "Pessoa B", { k: "f1" }),
      L("casado(a) com", "Pessoa C", { k: "f2" }),
      L("é pai/mãe de", "Filho de A e B", { k: "f3", with: "f1", bk: 20100101 }),
      L("é pai/mãe de", "Filha de A e C", { k: "f4", with: "f2", bk: 20120101 }),
      L("é pai/mãe de", "Caçula de A e B", { k: "f5", with: "f1", bk: 20150101 })
    ]
  },
  {
    id: "trisal-pagina-do-filho",
    nome: "Filho de um trisal: três pais descendo juntos",
    title: "Filho do trisal", canSee: "",
    links: [
      L("é filho(a) de", "Pessoa A", { k: "f1" }),
      L("é filho(a) de", "Pessoa B", { k: "f2" }),
      L("é filho(a) de", "Pessoa C", { k: "f3" }),
      L("irmão/irmã de", "Irmã", { k: "f4" }),
      L("neto(a) de", "Avó de B", { k: "f5", via: "f2" })
    ]
  },
  {
    id: "poligamia-com-ex",
    nome: "Dois cônjuges atuais que não são casados entre si, mais um casamento desfeito, filhos de cada um",
    title: "Pessoa", canSee: "",
    links: [
      L("casado(a) com", "Cônjuge 1", { k: "f1" }),
      L("casado(a) com", "Cônjuge 2", { k: "f2" }),
      L("ex-cônjuge de", "Ex", { k: "f3" }),
      L("é pai/mãe de", "Filho do ex", { k: "f4", with: "f3" }),
      L("é pai/mãe de", "Filho com 1", { k: "f5", with: "f1" }),
      L("é pai/mãe de", "Filha com 2", { k: "f6", with: "f2" })
    ]
  },
  {
    id: "coparentalidade",
    nome: "Coparentalidade sem casal: amigos que criam um filho juntos",
    title: "Pessoa", canSee: "",
    links: [
      L("é pai/mãe de", "Filho", { k: "f1", with: "f2", wl: "Amiga", wid: "amiga" }),
      L("é filho(a) de", "Mãe", { k: "f3" })
    ]
  },
  {
    id: "adocao-solo",
    nome: "Pai/mãe solo por adoção (página do filho)",
    title: "Filho adotado", canSee: "",
    links: [
      L("é filho(a) adotivo(a) de", "Mãe solo", { k: "f1" }, { term: "mãe adotiva" }),
      L("neto(a) de", "Avó", { k: "f2", via: "f1" })
    ]
  },
  {
    id: "familia-recomposta",
    nome: "Família recomposta: padrasto casado com a mãe, meio-irmãos dos dois lados",
    title: "Pessoa", bk: 20000101, canSee: "",
    links: [
      L("é filho(a) de", "Pai", { k: "f1" }),
      L("é filho(a) de", "Mãe", { k: "f2" }),
      L("enteado(a) de", "Padrasto", { k: "f3", with: "f2" }, { term: "padrasto" }),
      L("meio-irmão/meia-irmã de", "Meia-irmã (mãe)", { k: "f4", via: ["f2"], bk: 20080101 }),
      L("meio-irmão/meia-irmã de", "Meio-irmão (pai)", { k: "f5", via: ["f1"], bk: 20050101 }),
      L("irmão/irmã de", "Irmão", { k: "f6", bk: 19980101 })
    ]
  },
  {
    id: "padrasto-pagina",
    nome: "Página do padrasto: casado, enteado embaixo da esposa, filho do casal",
    title: "Padrasto", canSee: "",
    links: [
      L("casado(a) com", "Mãe", { k: "f1" }, { term: "esposa" }),
      L("padrasto/madrasta de", "Pessoa", { k: "f2", with: "f1" }, { term: "enteado" }),
      L("é pai/mãe de", "Meia-irmã (mãe)", { k: "f3", with: "f1" })
    ]
  },
  {
    id: "divorcio-recasado",
    nome: "Divórcio com filhos dos dois casamentos (o novo cônjuge do ex não entra)",
    title: "Pessoa", canSee: "",
    links: [
      L("ex-cônjuge de", "Ex", { k: "f1" }),
      L("casado(a) com", "Atual", { k: "f2" }),
      L("é pai/mãe de", "Filho do 1º casamento", { k: "f3", with: "f1", bk: 20050101 }),
      L("é pai/mãe de", "Filha do 1º casamento", { k: "f4", with: "f1", bk: 20070101 }),
      L("é pai/mãe de", "Filho do 2º casamento", { k: "f5", with: "f2", bk: 20150101 })
    ]
  },
  {
    id: "viuvo-recasado",
    nome: "Viúvo que casou de novo, filhos dos dois casamentos",
    title: "Pessoa", canSee: "",
    links: [
      L("viúvo(a) de", "Primeira esposa", { k: "f1" }),
      L("casado(a) com", "Segunda esposa", { k: "f2" }),
      L("é pai/mãe de", "Filha da primeira", { k: "f3", with: "f1" }),
      L("é pai/mãe de", "Filho da segunda", { k: "f4", with: "f2" })
    ]
  },
  {
    id: "guarda-da-tia",
    nome: "Órfão criado pela tia, sem adoção (responsável legal)",
    title: "Órfão", canSee: "",
    links: [
      L("é filho(a) de", "Pai", { k: "f1" }),
      L("é filho(a) de", "Mãe", { k: "f2" }),
      L("sob a guarda de", "Tia", { k: "f3" }, { term: "tia e responsável" }),
      L("sobrinho(a) de", "Tia", null, { term: "tia" })
    ]
  },
  {
    id: "guarda-pagina-da-tia",
    nome: "Página da tia: o sobrinho sob a guarda dela",
    title: "Tia", canSee: "",
    links: [
      L("responsável legal de", "Órfão", { k: "f1" }, { term: "sobrinho sob guarda" }),
      L("tio/tia de", "Órfão", null, { term: "sobrinho" }),
      L("irmão/irmã de", "Mãe", { k: "f2" })
    ]
  },
  {
    id: "reencontro-biologico",
    nome: "Adotado adulto que reencontra a família biológica: irmãos dos dois lados, cônjuge e filho",
    title: "Pessoa", canSee: "",
    links: [
      L("é filho(a) adotivo(a) de", "Pai adotivo", { k: "f1" }),
      L("é filho(a) adotivo(a) de", "Mãe adotiva", { k: "f2" }),
      L("é filho(a) de", "Mãe biológica", { k: "f3" }),
      L("irmão/irmã de", "Irmão biológico", { k: "f4", via: ["f3"] }),
      L("irmão/irmã de", "Irmã adotiva", { k: "f5", via: ["f1", "f2"] }),
      L("casado(a) com", "Cônjuge", { k: "f6" }),
      L("é pai/mãe de", "Filho", { k: "f7", with: "f6" })
    ]
  },
  {
    id: "gemeos-e-sem-data",
    nome: "Gêmeos com a mesma data, irmãos com e sem data",
    title: "Pessoa", bk: 20000505, canSee: "",
    links: [
      L("é filho(a) de", "Pai", { k: "f1" }),
      L("é filho(a) de", "Mãe", { k: "f2" }),
      L("gêmeo(a) de", "Gêmea", { k: "f3", bk: 20000505 }, { term: "gêmea" }),
      L("irmão/irmã de", "Mais velho", { k: "f4", bk: 19950101 }),
      L("irmão/irmã de", "Sem data 1", { k: "f5" }),
      L("irmão/irmã de", "Sem data 2", { k: "f6" })
    ]
  },
  {
    id: "parentes-distantes",
    nome: "Parentes distantes na faixa de baixo (bisavó, tio-avô, primo de 2º grau)",
    title: "Pessoa", canSee: "",
    links: [
      L("é filho(a) de", "Mãe", { k: "f1" }),
      L("bisneto(a) de", "Bisavó", null, { term: "bisavó" }),
      L("sobrinho(a) de", "Tio-avô", null, { term: "tio-avô", distant: true }),
      L("primo(a) de", "Primo de 2º grau", null, { term: "primo de 2º grau", distant: true })
    ]
  },
  {
    id: "sem-pais",
    nome: "Pessoa sem pais conhecidos, só cônjuge e filhos",
    title: "Pessoa", canSee: "",
    links: [
      L("casado(a) com", "Cônjuge", { k: "f1" }),
      L("é pai/mãe de", "Filha", { k: "f2", with: "f1" }),
      L("é pai/mãe de", "Filho", { k: "f3", with: "f1" })
    ]
  },
  {
    id: "familia-enorme",
    nome: "Família muito grande: 8 irmãos, 4 casamentos, 10 filhos, netos",
    title: "Pessoa com nome comprido", bk: 19700101, canSee: "",
    links: (function () {
      var l = [L("é filho(a) de", "Pai da família", { k: "p1" }), L("é filho(a) de", "Mãe da família", { k: "p2" })];
      for (var i = 1; i <= 8; i++) l.push(L("irmão/irmã de", "Irmão número " + i, { k: "s" + i, bk: 19600101 + i * 20000 }));
      l.push(L("casado(a) com", "Cônjuge atual", { k: "c1" }));
      l.push(L("ex-cônjuge de", "Primeiro casamento", { k: "c2" }));
      l.push(L("ex-cônjuge de", "Segundo casamento", { k: "c3" }));
      l.push(L("viúvo(a) de", "Terceiro casamento", { k: "c4" }));
      for (var j = 1; j <= 10; j++) l.push(L("é pai/mãe de", "Filho número " + j, { k: "k" + j, with: "c" + (1 + (j % 4)), bk: 19900101 + j * 10000 }));
      for (var m = 1; m <= 6; m++) l.push(L("avô/avó de", "Neto número " + m, { k: "g" + m, via: "k" + (1 + (m % 3)) }));
      return l;
    })()
  },
  {
    id: "spoilers-misturados",
    nome: "Spoiler e disfarce misturados com parentes públicos (visitante)",
    title: "Pessoa", canSee: "",
    links: [
      L("é filho(a) de", "Mãe", { k: "f1" }),
      L("é filho(a) de", "Pai secreto", { k: "f2" }, { spoiler: true, at: "t2" }),
      L("irmão/irmã de", "Irmã", { k: "f3" }),
      L("irmão/irmã de", "Irmão escondido", { k: "f4" }, { spoiler: "disfarce", at: "t2", cover: "amigo(a) de" }),
      L("casado(a) com", "Cônjuge", { k: "f5" })
    ]
  },
  { id: "spoilers-revelados", nome: "Os mesmos spoilers, com o leitor que já viu tudo", same: "spoilers-misturados", canSee: "tudo" },
  {
    id: "termos-neutros",
    nome: "Termos neutros e escolhidos pela pessoa (o desenho não depende de gênero)",
    title: "Pessoa", canSee: "",
    links: [
      L("é filho(a) de", "Progenitore 1", { k: "f1" }, { term: "progenitore" }),
      L("é filho(a) de", "Pai que gestou", { k: "f2" }, { term: "pai" }),
      L("casado(a) com", "Parceire", { k: "f3" }, { term: "cônjuge" }),
      L("é pai/mãe de", "Criança", { k: "f4", with: "f3" }, { term: "filhe" })
    ]
  },
  {
    id: "pagina-antiga",
    nome: "Página antiga, sem o quem-é-quem (tudo o que não dá pra situar em pontilhado)",
    title: "Pessoa", canSee: "",
    links: [
      { label: "é filho(a) de", targetTitle: "Pai", style: F },
      { label: "é filho(a) de", targetTitle: "Mãe", style: F },
      { label: "neto(a) de", targetTitle: "Avó", style: F },
      { label: "meio-irmão/meia-irmã de", targetTitle: "Meio-irmão", style: F },
      { label: "avô/avó de", targetTitle: "Neto", style: F }
    ]
  },
  {
    id: "gestacao-e-adocao",
    nome: "Mesmo casal com um filho por barriga de aluguel e um adotado",
    title: "Pai 1", canSee: "",
    links: [
      L("casado(a) com", "Pai 2", { k: "f1" }),
      L("é pai/mãe de", "Filho por gestação", { k: "f2", with: "f1", bk: 20100101 }),
      L("é pai/mãe adotivo(a) de", "Filha adotada", { k: "f3", with: "f1", bk: 20120101 })
    ]
  },
  {
    id: "gestante-pagina",
    nome: "Página da gestante: gestou o filho de outro casal, tem a própria família",
    title: "Gestante", canSee: "",
    links: [
      L("casado(a) com", "Marido da gestante", { k: "f1" }),
      L("é pai/mãe de", "Filho da gestante", { k: "f2", with: "f1" }),
      L("gestou", "Criança", { k: "f3" }, { term: "gestou" })
    ]
  }
];

// Cenário pronto pra desenhar: resolve os que repetem outro com o leitor diferente.
export function familyCenario(id) {
  var c = FAMILY_CENARIOS.filter(function (x) { return x.id === id; })[0];
  if (!c) return null;
  if (!c.same) return c;
  var base = familyCenario(c.same);
  return { id: c.id, nome: c.nome, title: base.title, bk: base.bk, links: base.links, canSee: c.canSee };
}
