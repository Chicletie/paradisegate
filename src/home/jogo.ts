// As escolhas da criação de personagem, copiadas da ficha (fichas.html) só pra home mostrar.
// jogo.test.ts confere contra a ficha: mudou lá, o teste avisa aqui.

export const PERGUNTA_NOME = "Quem é você nesse mundo?";
export const PERGUNTA_ARCANA = "Quem é o patrono de sua liberdade?";

export const RACAS = ["Agni", "Bruxo", "Dríade", "Duende", "Elfo", "Feral", "Humano", "Licantropo", "Ondina", "Sílfide", "Vampiro"];

export const GRUPOS: { nome: string; classes: string[] }[] = [
  { nome: "Duelistas", classes: ["Marcialista", "Defensor", "Comandante", "Gatuno"] },
  { nome: "Arcanistas", classes: ["Erudito", "Catalisador", "Implacável", "Aberrante"] },
  { nome: "Iluminados", classes: ["Sacerdote", "Oráculo", "Algoz", "Curandeiro"] },
  { nome: "Especialistas", classes: ["Eloquente", "Artilheiro", "Domador", "Engenheiro"] },
];

export const IMPULSOS: { nome: string; subtitulo: string }[] = [
  { nome: "O Abastado", subtitulo: "Aqueles que vivem em função do dinheiro." },
  { nome: "O Artista", subtitulo: "Aqueles que veem o mundo pela arte." },
  { nome: "O Condutor", subtitulo: "Aqueles que nascem para guiar." },
  { nome: "O Desafortunado", subtitulo: "Aqueles que vivem para sobreviver." },
  { nome: "O Desvalido", subtitulo: "Aqueles que vivem como párias." },
  { nome: "O Devoto", subtitulo: "Aqueles que vivem por um propósito maior." },
  { nome: "O Encantador", subtitulo: "Aqueles que dominam o jogo social." },
  { nome: "O Errante", subtitulo: "Aqueles que vivem pela jornada." },
  { nome: "O Erudito", subtitulo: "Aqueles que se guiam pelo conhecimento." },
  { nome: "O Guardião", subtitulo: "Aqueles que vivem para proteger." },
  { nome: "O Inquiridor", subtitulo: "Aqueles que vivem pelo mistério." },
  { nome: "O Insurgente", subtitulo: "Rebeldes, ativistas, aqueles que vivem pela mudança." },
  { nome: "O Laborioso", subtitulo: "Operários, camponeses, aqueles que vivem pelo trabalho." },
  { nome: "O Larápio", subtitulo: "Criminosos, trombadinhas, aqueles que vivem pela subversão." },
  { nome: "O Nobre", subtitulo: "Patricinhas, aristocratas, aqueles que vivem por sua grandeza." },
  { nome: "O Oblívio", subtitulo: "Amnésicos, aqueles que vivem para se reencontrar." },
  { nome: "O Obstinado", subtitulo: "Obcecados, viciados, aqueles que vivem presos a algo." },
  { nome: "O Perverso", subtitulo: "Depravados, cruéis, aqueles que vivem pelo que há de podre em si." },
  { nome: "O Provedor", subtitulo: "Chefs, ferreiros, aqueles que produzem por vocação." },
  { nome: "O Resignado", subtitulo: "Desistentes, apáticos, aqueles que desistiram do mundo." },
  { nome: "O Restaurador", subtitulo: "Curandeiros, mártires, aqueles que vivem para curar." },
  { nome: "O Soldado", subtitulo: "Mercenários, militares, aqueles que vivem pelo conflito." },
  { nome: "O Sonhador", subtitulo: "Idealistas, visionários, aqueles que vivem por um ideal." },
  { nome: "O Sucessor", subtitulo: "Herdeiros, aprendizes, aqueles que vivem por um legado." },
];

export const ARCANAS: { nome: string; numeral: string }[] = [
  { nome: "O Mago", numeral: "I" },
  { nome: "A Sacerdotisa", numeral: "II" },
  { nome: "A Imperatriz", numeral: "III" },
  { nome: "O Imperador", numeral: "IV" },
  { nome: "O Hierofante", numeral: "V" },
  { nome: "Os Enamorados", numeral: "VI" },
  { nome: "O Carro", numeral: "VII" },
  { nome: "A Força", numeral: "VIII" },
  { nome: "O Eremita", numeral: "IX" },
  { nome: "A Roda da Fortuna", numeral: "X" },
  { nome: "A Justiça", numeral: "XI" },
  { nome: "O Enforcado", numeral: "XII" },
  { nome: "A Morte", numeral: "XIII" },
  { nome: "A Temperança", numeral: "XIV" },
  { nome: "O Diabo", numeral: "XV" },
  { nome: "A Torre", numeral: "XVI" },
  { nome: "A Estrela", numeral: "XVII" },
  { nome: "A Lua", numeral: "XVIII" },
  { nome: "O Sol", numeral: "XIX" },
  { nome: "O Julgamento", numeral: "XX" },
  { nome: "O Mundo", numeral: "XXI" },
];
