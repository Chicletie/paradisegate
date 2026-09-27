// Posições da árvore (porta de familyLayout na wiki original). Antes, a caixa era medida pelo
// nome inteiro mesmo quando ele aparecia cortado e os irmãos (todos à esquerda) saíam pela
// borda a partir de 3: uma família comum já se atropelava.
export const FT_MIN_W = 460,
  FT_PAD = 12,
  FT_GAP = 14;

export function ftShort(label: string): string {
  return label.length > 16 ? label.slice(0, 15) + "…" : label;
}
function ftNodeW(label: string): number {
  return Math.max(60, ftShort(label).length * 6.4 + 14);
}

export interface FtItem {
  x: number;
  w: number;
  short: string;
}
export interface FamilyLayout {
  W: number;
  cx: number;
  rows: { gp: FtItem[]; p: FtItem[]; sibs: FtItem[]; self: FtItem; sp: FtItem[]; c: FtItem[]; gc: FtItem[] };
}

/** Onde cada caixa fica: linhas centradas, irmãos à esquerda da pessoa e cônjuges à direita. */
export function familyLayout(
  title: string,
  rows: { gp: string[]; p: string[]; sibs: string[]; sp: string[]; c: string[]; gc: string[] },
): FamilyLayout {
  function centered(labels: string[]): FtItem[] {
    const ws = labels.map(ftNodeW);
    const total = ws.reduce((a, b) => a + b, 0) + FT_GAP * Math.max(0, ws.length - 1);
    let x = -total / 2;
    return labels.map((l, i) => {
      const it = { x: x + ws[i] / 2, w: ws[i], short: ftShort(l) };
      x += ws[i] + FT_GAP;
      return it;
    });
  }
  const self: FtItem = { x: 0, w: ftNodeW(title), short: ftShort(title) };
  const sibs: FtItem[] = [];
  let edge = -self.w / 2;
  for (let i = rows.sibs.length - 1; i >= 0; i--) {
    const w = ftNodeW(rows.sibs[i]);
    sibs.unshift({ x: edge - FT_GAP - w / 2, w, short: ftShort(rows.sibs[i]) });
    edge -= FT_GAP + w;
  }
  const sp: FtItem[] = [];
  let redge = self.w / 2;
  rows.sp.forEach((l) => {
    const w = ftNodeW(l);
    sp.push({ x: redge + FT_GAP + w / 2, w, short: ftShort(l) });
    redge += FT_GAP + w;
  });
  const out = { gp: centered(rows.gp), p: centered(rows.p), sibs, self, sp, c: centered(rows.c), gc: centered(rows.gc) };
  const lists = [out.gp, out.p, out.sibs, out.sp, out.c, out.gc];
  let min = -self.w / 2,
    max = self.w / 2;
  lists.forEach((l) =>
    l.forEach((n) => {
      min = Math.min(min, n.x - n.w / 2);
      max = Math.max(max, n.x + n.w / 2);
    }),
  );
  const W = Math.max(FT_MIN_W, Math.ceil(max - min + 2 * FT_PAD));
  const shift = (W - (max - min)) / 2 - min;
  lists.forEach((l) =>
    l.forEach((n) => {
      n.x += shift;
    }),
  );
  self.x += shift;
  return { W, cx: self.x, rows: out };
}
