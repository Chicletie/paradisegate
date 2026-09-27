// Tipos de familyLayout.js (a conta fica em JS pra ser o mesmo arquivo do editor do autor).

export interface FtPerson {
  key?: string | null;
  label: string;
  ref?: unknown;
}
export interface FtInput {
  self: { label: string; bk: number | null };
  parents: (FtPerson & { adopt?: boolean })[];
  gps: (FtPerson & { via?: string | null })[];
  sibs: (FtPerson & { half?: boolean; via?: string[]; bk?: number | null })[];
  spouses: FtPerson[];
  kids: (FtPerson & { with?: string | null; bk?: number | null; adopt?: boolean })[];
  gks: (FtPerson & { via?: string | null })[];
}
export interface FtBox {
  x: number;
  y: number;
  w: number;
  short: string;
  label: string;
  self: boolean;
  ref: unknown;
}
export interface FtLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** "" linha cheia, "adocao" tracejado, "incerto" pontilhado. */
  dash: "" | "adocao" | "incerto";
}
export interface FtLayout {
  W: number;
  y0: number;
  y1: number;
  cx: number;
  boxes: FtBox[];
  lines: FtLine[];
}

export const FT_MIN_W: number;
export const FT_PAD: number;
export const FT_GAP: number;
export const FT_GROUP_GAP: number;
export function ftShort(label: string): string;
export function ftNodeW(label: string): number;
export function ftBirthKey(b: unknown): number | null;
export function familyTreeLayout(inp: FtInput): FtLayout;
export function ftMinWidth(W: number): number | null;
export function familyInputFromLinks(title: string, birthKey: number | null | undefined, links: unknown[]): FtInput;
export function familyHasAny(inp: FtInput): boolean;
