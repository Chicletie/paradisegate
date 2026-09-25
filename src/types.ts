// Tipos dos documentos lidos do Firestore, derivados de docs/dados-da-wiki.md e do
// comportamento de renderEntry/renderSeason/renderHome na wiki original — a
// referência de verdade é o comportamento, não este arquivo; ajuste aqui primeiro se um
// campo aparecer com formato diferente ao testar contra dados reais.

export type FieldVisibility = "publico" | "spoiler" | "restrito" | "mestre";

export interface WikiIndexEvent {
  id?: string;
  familyId?: string;
  label?: string;
  y: number;
  m?: number;
  d?: number;
  note?: string;
  major?: boolean;
}

// IndexEntry (docs/dados-da-wiki.md) — um item de wikiIndex/lotus (+ shards/).
export interface WikiIndexEntry {
  title: string;
  type: string;
  universe?: string;
  universeId?: string;
  franchiseIds?: string[];
  tags?: string[];
  search?: string;
  updatedAt?: string;
  firstPublishedAt?: string;
  cover?: string | null;
  coverFocus?: { x: number; y: number } | null;
  wordCount?: number;
  linkCount?: number;
  postsCount?: number;
  /** Membros do acervo citados com [[@nome]] no que a página mostra (perfil público /@nome). */
  membros?: string[];
  birthdayMD?: string | null;
  arcana?: WikiArcana | null;
  excerpt?: string;
  posts?: { id: string; title?: string; date?: string; excerpt?: string }[];
  /** Escritos ligados a esta página (o mesmo escrito vem em cada página ligada). */
  escritos?: WikiIndexWriting[];
  events?: WikiIndexEvent[];
  citacoes?: WikiCitation[];
}

export type WikiIndex = Record<string, WikiIndexEntry>;

/** Tipo, marcas e autoria de um escrito (docs/dados-da-wiki.md, "Escritos"). */
export interface WritingMeta {
  /** conto, cronica, narracao, causo, documento, carta, poema, lenda, sonho, entrevista,
   * bastidores, ese — ou "" (sem tipo). */
  tipo?: string;
  canone?: "canonico" | "provavel" | "fora" | "" | string;
  origem?: "mundo" | "mesa" | "bastidores" | "" | string;
  tags?: string[];
  /** Username de quem escreveu (/@autor); vazio = o autor da wiki. */
  autor?: string;
}

/** Um escrito no índice. Público traz `excerpt`; spoiler vem sem trecho e com `at`. */
export interface WikiIndexWriting extends WritingMeta {
  id: string;
  /** Id do documento da página própria (wikiPublic/escrito-<id>); null = sem página própria. */
  page?: string | null;
  title?: string;
  date?: string;
  excerpt?: string;
  vis?: FieldVisibility;
  at?: string;
  noDaily?: boolean;
}

export interface WikiArcana {
  kind: "major" | "minor";
  n?: number;
  suit?: "copas" | "ouros" | "espadas" | "paus";
  rank?: number;
}

export interface WikiField {
  key: string;
  value: string;
  type?: "nota" | "cabecalho" | string;
  vis?: FieldVisibility;
  /** Spoiler por obra: id da temporada em que o trecho é revelado (ver `spoilerObras`). */
  at?: string;
  master?: string;
}

export interface InfoboxImage {
  name?: string;
  url: string;
  vis?: FieldVisibility;
  /** Spoiler por obra: id da temporada em que o trecho é revelado (ver `spoilerObras`). */
  at?: string;
  focus?: { x: number; y: number } | null;
}

export interface WikiAliasNote {
  before?: string;
  link?: string;
  linkWikiId?: string;
  after?: string;
}

export interface WikiAlias {
  text: string;
  note?: WikiAliasNote;
  selfLink?: string;
  vis?: FieldVisibility;
  /** Spoiler por obra: id da temporada em que o trecho é revelado (ver `spoilerObras`). */
  at?: string;
}

export interface WikiCrumb {
  targetId: string;
  targetTitle: string;
}

export interface WikiSection {
  title?: string;
  body: string;
  vis?: FieldVisibility;
  /** Spoiler por obra: id da temporada em que o trecho é revelado (ver `spoilerObras`). */
  at?: string;
}

export type QuoteKind = "fala" | "dialogo" | "trecho" | "narracao";
export type QuoteRole = "fala" | "dialogo" | "trecho" | "narracao" | "para" | "sobre";

export interface QuoteRef {
  name: string;
  id?: string | null;
}

export interface QuoteDialogueLine {
  who?: string;
  id?: string | null;
  text: string;
  aside?: string;
}

export interface WikiCitation {
  /** Só nas citações do índice (wbQuotesForIndex): conta uma vez só na Citação do dia. */
  id?: string;
  /** `false` = o autor tirou essa citação dos sorteios do dia. */
  daily?: boolean;
  kind?: QuoteKind;
  role?: QuoteRole;
  /** Narração: texto em markdown da casa (parágrafos, links), sem aspas. */
  text?: string;
  /** Só na narração: de mesa (sessão) ou de livro. */
  narr?: "mesa" | "livro";
  speaker?: QuoteRef | null;
  speakerTitle?: string;
  speakerId?: string | null;
  where?: QuoteRef | null;
  to?: QuoteRef[];
  lines?: QuoteDialogueLine[];
  how?: string;
  group?: string;
  contextId?: string;
  contextTitle?: string;
  note?: string;
  vis?: FieldVisibility;
  /** Spoiler por obra: id da temporada em que o trecho é revelado (ver `spoilerObras`). */
  at?: string;
}

export interface WikiPost extends WritingMeta {
  id?: string;
  title?: string;
  date?: string;
  body: string;
  vis?: FieldVisibility;
  /** Spoiler por obra: id da temporada em que o trecho é revelado (ver `spoilerObras`). */
  at?: string;
}

export interface WikiTag {
  text: string;
  vis?: FieldVisibility;
  /** Spoiler por obra: id da temporada em que o trecho é revelado (ver `spoilerObras`). */
  at?: string;
}

export type LinkStyle =
  | "ally"
  | "rival"
  | "family"
  | "romance"
  | "friend"
  | "bond"
  | "faction"
  | "location"
  | "narrative"
  | "neutral";

export interface WikiLink {
  label?: string;
  targetId?: string;
  targetTitle: string;
  style?: LinkStyle;
  /** O que o outro é pra esta página ("mãe adotiva"), escolhido pelo autor. */
  term?: string;
  /** true = a relação inteira atrás da tarja; "disfarce" = mostra `cover` e esconde só o termo. */
  spoiler?: boolean | "disfarce";
  cover?: string;
  coverStyle?: LinkStyle;
  /** Spoiler por obra: id da temporada em que a relação é revelada. */
  at?: string;
}

export interface WikiGalleryItem {
  url: string;
  caption?: string;
  group?: string;
  vis?: FieldVisibility;
  /** Spoiler por obra: id da temporada em que o trecho é revelado (ver `spoilerObras`). */
  at?: string;
}

// Forma comum de "Geral" e de cada variante de obra (data.variants[i]) — mesmos campos,
// cada um vira uma aba (ver buildArticle em wiki-core.js).
export interface WikiArticleBundle {
  summary?: string;
  body?: string;
  fields?: WikiField[];
  sections?: WikiSection[];
}

export interface WikiVariant extends WikiArticleBundle {
  label?: string;
}

export interface WikiEntryDoc extends WikiArticleBundle {
  /** As obras que os spoilers desta página usam (`at`), com as temporadas em ordem. */
  spoilerObras?: SpoilerObra[];
  kind?: undefined;
  title: string;
  type?: string;
  universe?: string;
  universeId?: string;
  publishedAt?: string;
  ancestors?: WikiCrumb[];
  children?: WikiCrumb[];
  infoboxImages?: InfoboxImage[];
  aliases?: WikiAlias[];
  featuredQuote?: WikiCitation;
  birth?: string;
  lunarBirth?: string;
  citacoes?: WikiCitation[];
  posts?: WikiPost[];
  /** Cartões dos escritos ligados (mesma ordem de `posts`). */
  escritos?: WikiIndexWriting[];
  tags?: WikiTag[];
  links?: WikiLink[];
  backlinks?: WikiLink[];
  gallery?: WikiGalleryItem[];
  taxonomy?: WikiField[];
  variants?: WikiVariant[];
  events?: WikiIndexEvent[];
  restritoSlots?: RestritoSlotMark[];
}

export interface WikiSeasonSession {
  title?: string;
  date?: string;
  recap: string;
  vis?: FieldVisibility;
  /** Spoiler por obra: id da temporada em que o trecho é revelado (ver `spoilerObras`). */
  at?: string;
}

export interface WikiSeasonDoc {
  kind: "temporada";
  title: string;
  universe?: string;
  universeId?: string;
  system?: string;
  status?: string;
  sessionCount?: number;
  cast?: string[];
  sessions?: WikiSeasonSession[];
  restritoSlots?: RestritoSlotMark[];
  publishedAt?: string;
}

/** Página própria de um escrito: wikiPublic/escrito-<id>. */
export interface WikiWritingDoc extends WritingMeta {
  kind: "escrito";
  id: string;
  title: string;
  date?: string;
  universe?: string;
  universeId?: string;
  body: string;
  excerpt?: string;
  vis?: FieldVisibility;
  at?: string;
  spoilerObras?: SpoilerObra[];
  /** Páginas em que aparece; id null = página não publicada (só o nome). */
  pages?: { name: string; id: string | null }[];
  publishedAt?: string;
}

// wikiPublic/{slug} guarda uma entry, uma temporada ou um escrito — discriminado por `kind`.
export type WikiPublicDoc = WikiEntryDoc | WikiSeasonDoc | WikiWritingDoc;

// --- Conta do leitor (etapa 4) — mesmas formas que wiki-core.js lê e grava hoje. ---

export interface AuthUser {
  uid: string;
  email: string;
  /** Quando a conta foi criada (ISO), pro "no acervo desde" do perfil público. */
  since?: string;
}

/**
 * wikiUsernames/{nome}: o dono do nome (uid) e o cartão público do membro
 * (paradisegate.com.br/@nome). Só o que a pessoa escolhe mostrar, nunca o e-mail.
 */
export interface MemberCard {
  uid: string;
  nickname?: string;
  photo?: string;
  bio?: string;
  since?: string;
  /** Só quando `showFavorites`. */
  favorites?: string[];
  showFavorites?: boolean;
}

/** wikiProfiles/{uid}. `photo` é um data URL JPEG 256×256 reduzido no navegador. */
/** Uma obra (livro/série ou campanha) com as temporadas em ordem — spoiler por obra. */
export interface SpoilerObra {
  id: string;
  name: string;
  seasons: { id: string; name: string }[];
}

/** Até onde o leitor já viu: obraId → id da última temporada vista ("*" = tudo, "" = nada). */
export type SpoilerProgress = Record<string, string>;

export interface WikiProfile {
  email?: string;
  nickname?: string;
  photo?: string | null;
  favorites?: string[];
  /** Última visita do leitor às próprias sugestões (ISO). */
  seenAt?: string;
  /** Spoiler por obra: até onde o leitor já viu cada obra. */
  progress?: SpoilerProgress;
  /** Nome único da conta (@algumacoisa), sem o @; o apelido pode repetir, este não. */
  username?: string;
  /** Quando o username foi escolhido/trocado (Timestamp do Firestore): troca a cada 30 dias. */
  usernameChangedAt?: unknown;
  updatedAt?: string;
}

/** O que uma gravação do perfil muda; o resto do documento fica como está (merge). */
export interface WikiProfilePatch {
  nickname?: string;
  /** `null` apaga a foto. */
  photo?: string | null;
  seenAt?: string;
  favorite?: { id: string; on: boolean };
  /** Troca o valor de uma obra só (as outras ficam). */
  progress?: { obraId: string; seasonId: string };
}

/** wikiSuggestions/{id}. */
export interface WikiSuggestion {
  wikiId?: string;
  pageTitle?: string;
  tab?: string;
  text?: string;
  authorEmail?: string;
  authorName?: string | null;
  status?: "pendente" | "aceita" | "rejeitada" | string;
  createdAt?: string;
  reply?: string;
  repliedAt?: string;
  statusAt?: string;
}

/** wikiRestrito/{wikiId}/itens/{id} — cada item diz em `permitidos` quais e-mails podem lê-lo. */
export interface WikiRestritoItem {
  kind: "campo" | "campo-confidencial" | "secao" | "tag" | "alias" | "galeria" | "sessao" | "post" | string;
  key?: string;
  value?: string;
  title?: string;
  body?: string;
  text?: string;
  variant?: string;
  url?: string;
  caption?: string;
  date?: string;
  recap?: string;
  /** Código de posição: casa com uma marca em `restritoSlots` da página. */
  slot?: string;
  permitidos?: string[];
}

/** Onde um trecho restrito entra na página: área + quantos itens públicos vêm antes dele. */
export interface RestritoSlotMark {
  slot: string;
  area: string;
  before: number;
}
