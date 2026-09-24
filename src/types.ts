// Tipos dos documentos lidos do Firestore, derivados de docs/formato-wiki.md e do
// comportamento de renderEntry/renderSeason/renderHome em wiki-core.js (arvore) — a
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

// IndexEntry (docs/formato-wiki.md) — um item de wikiIndex/lotus (+ shards/).
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
  birthdayMD?: string | null;
  arcana?: WikiArcana | null;
  excerpt?: string;
  posts?: { id: string; title?: string; date?: string; excerpt?: string }[];
  events?: WikiIndexEvent[];
  citacoes?: WikiCitation[];
}

export type WikiIndex = Record<string, WikiIndexEntry>;

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
  master?: string;
}

export interface InfoboxImage {
  name?: string;
  url: string;
  vis?: FieldVisibility;
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
}

export interface WikiCrumb {
  targetId: string;
  targetTitle: string;
}

export interface WikiSection {
  title?: string;
  body: string;
  vis?: FieldVisibility;
}

export type QuoteKind = "fala" | "dialogo" | "trecho";
export type QuoteRole = "fala" | "dialogo" | "trecho" | "para" | "sobre";

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
  text?: string;
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
}

export interface WikiPost {
  title?: string;
  date?: string;
  body: string;
  vis?: FieldVisibility;
}

export interface WikiTag {
  text: string;
  vis?: FieldVisibility;
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
  | "multiversal"
  | "neutral";

export interface WikiLink {
  label?: string;
  targetId?: string;
  targetTitle: string;
  style?: LinkStyle;
}

export interface WikiGalleryItem {
  url: string;
  caption?: string;
  group?: string;
  vis?: FieldVisibility;
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
  tags?: WikiTag[];
  links?: WikiLink[];
  backlinks?: WikiLink[];
  gallery?: WikiGalleryItem[];
  taxonomy?: WikiField[];
  variants?: WikiVariant[];
  events?: WikiIndexEvent[];
}

export interface WikiSeasonSession {
  title?: string;
  date?: string;
  recap: string;
  vis?: FieldVisibility;
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
  publishedAt?: string;
}

// wikiPublic/{slug} guarda ou uma entry ou uma temporada — discriminado por `kind`.
export type WikiPublicDoc = WikiEntryDoc | WikiSeasonDoc;

// --- Conta do leitor (etapa 4) — mesmas formas que wiki-core.js lê e grava hoje. ---

export interface AuthUser {
  uid: string;
  email: string;
}

/** wikiProfiles/{uid}. `photo` é um data URL JPEG 256×256 reduzido no navegador. */
export interface WikiProfile {
  email?: string;
  nickname?: string;
  photo?: string | null;
  favorites?: string[];
  /** Última visita do leitor às próprias sugestões (ISO). */
  seenAt?: string;
  updatedAt?: string;
}

/** O que uma gravação do perfil muda; o resto do documento fica como está (merge). */
export interface WikiProfilePatch {
  nickname?: string;
  /** `null` apaga a foto. */
  photo?: string | null;
  seenAt?: string;
  favorite?: { id: string; on: boolean };
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

/** wikiRestrito/{wikiId}/itens/{id} — o Firestore só devolve os itens liberados pro e-mail. */
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
  permitidos?: string[];
}
