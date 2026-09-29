// Tipos de familyLayout.js (a conta fica em JS pra ser o mesmo arquivo do editor do autor).

export interface FtPerson {
  key?: string | null;
  label: string;
  ref?: unknown;
}
/** Tipo de pai/mãe: biológico, adoção, criação, padrasto/madrasta, responsável legal (guarda),
 * quem gestou (gestação por substituição) ou doador(a). */
export type FtParentKind = "bio" | "adocao" | "criacao" | "padrasto" | "responsavel" | "gestante" | "doador";
/** Tipo de filho, do lado de quem é a página: biológico, adoção, criação, enteado, sob a guarda,
 * gestado por esta pessoa pra outra família, ou concebido com doação desta pessoa. */
export type FtKidKind = "bio" | "adocao" | "criacao" | "enteado" | "responsavel" | "gestacao" | "doacao";
export interface FtInput {
  self: { label: string; bk: number | null };
  parents: (FtPerson & { adopt?: boolean; kind?: FtParentKind; term?: string; with?: string | null })[];
  gps: (FtPerson & { via?: string | null })[];
  sibs: (FtPerson & { half?: boolean; via?: string[]; bk?: number | null; twin?: boolean; term?: string })[];
  spouses: (FtPerson & { status?: "" | "ex" | "viuvo" | "par"; term?: string })[];
  kids: (FtPerson & { with?: string | null; bk?: number | null; adopt?: boolean; kind?: FtKidKind; term?: string })[];
  gks: (FtPerson & { via?: string | null })[];
  others?: (FtPerson & { term?: string })[];
}
export interface FtBox {
  x: number;
  y: number;
  w: number;
  /** Meia altura da caixa (maior quando tem termo: duas linhas). */
  h: number;
  short: string;
  label: string;
  self: boolean;
  /** Segunda linha pequena dentro da caixa ("prima distante", "padrasto", "gestante"…). */
  term?: string;
  ref: unknown;
}
export interface FtLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** "" linha cheia, "adocao" tracejado, "incerto" pontilhado, "uniao" traço-ponto, "origem"
   * linha dupla (já vem em duas linhas lado a lado). */
  dash: "" | "adocao" | "incerto" | "uniao" | "origem";
  /** De qual ligação é a linha (as pontes só aparecem entre ligações diferentes). */
  rel: string;
  /** Barrinha do casamento desfeito ou cruz da viuvez, desenhada em cima da linha do casal. */
  mark: boolean;
  /** Pontes onde uma linha de outra ligação cruza esta (só em linha horizontal). */
  hops?: { x: number; r: number }[];
}
export interface FtLayout {
  W: number;
  y0: number;
  y1: number;
  cx: number;
  boxes: FtBox[];
  lines: FtLine[];
  /** Legendas soltas (ex.: a da faixa de outros parentes). */
  notes: { x: number; y: number; text: string }[];
  /** Chaves de FT_LEGEND que esta árvore usa, na ordem da legenda. */
  legend: FtLegendKey[];
}
export type FtLegendKey = "sangue" | "casal" | "ex" | "viuvo" | "uniao" | "adocao" | "origem" | "meio" | "incerto" | "ponte" | "outros";
export const FT_LEGEND: [FtLegendKey, string][];

export const FT_MIN_W: number;
export const FT_PAD: number;
export const FT_GAP: number;
export const FT_GROUP_GAP: number;
export function ftShort(label: string): string;
export function ftNodeW(label: string, term?: string): number;
export function ftBirthKey(b: unknown): number | null;
export function familyTreeLayout(inp: FtInput): FtLayout;
/** Caminho SVG da linha, com as pontes. */
export function ftLinePath(l: FtLine): string;
export function ftMinWidth(W: number): number | null;
/** canSee(ligação): o leitor já pode ver esse parentesco em spoiler. Sem ele, spoiler nunca entra. */
export function familyInputFromLinks(title: string, birthKey: number | null | undefined, links: unknown[], canSee?: (lk: never) => boolean): FtInput;
export function familyHasAny(inp: FtInput): boolean;
