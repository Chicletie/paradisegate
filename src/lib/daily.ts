// Sorteio diário determinístico — porta literal de wbHashSeed/wbSeededShuffle/wbDailyKey/
// wbDayIndex/wbDailyPick/wbTodayMD/wbGmt3DateKey/wbInBirthdayWindow em wiki-core.js (arvore).
// Sem servidor nem escrita: o mesmo dia (00h GMT-3) dá a mesma escolha pra qualquer visitante.
// Embaralha o pool inteiro uma vez por ciclo (ciclo = tamanho do pool) e anda um item por dia,
// então cada item aparece uma vez antes de qualquer repetição. `now` é injetável pra testes.

const GMT3_OFFSET_MS = 3 * 60 * 60 * 1000;

function hashSeed(s: string): () => number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const rnd = hashSeed(seed);
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = out[i];
    out[i] = out[j];
    out[j] = t;
  }
  return out;
}

const KEY_FIELDS = ["id", "speakerId", "entryId", "familyId", "title", "text", "date", "y", "m", "d", "label"];

/** Chave estável pra ordenar o pool antes de embaralhar: o mapa do Firestore não tem ordem. */
export function dailyKey(item: unknown): string {
  if (typeof item === "number") return "n:" + item;
  if (typeof item === "string") return "s:" + item;
  if (!item || typeof item !== "object") return String(item);
  const o = item as Record<string, unknown>;
  return KEY_FIELDS.map((k) => (o[k] == null ? "" : String(o[k]))).join("\t");
}

export function dayIndex(now = Date.now()): number {
  return Math.floor((now - GMT3_OFFSET_MS) / 86400000);
}

export function dailyPick<T>(pool: T[] | null | undefined, seedName: string, now = Date.now()): T | null {
  if (!pool || !pool.length) return null;
  const sorted = pool.slice().sort((a, b) => {
    const ka = dailyKey(a);
    const kb = dailyKey(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  const day = dayIndex(now);
  const n = sorted.length;
  const cycle = Math.floor(day / n);
  const pos = day % n;
  return seededShuffle(sorted, seedName + ":" + cycle)[pos];
}

const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function mdToDoy(md: string): number {
  const p = md.split("-");
  const m = +p[0];
  let doy = +p[1];
  for (let i = 0; i < m - 1; i++) doy += MONTH_DAYS[i];
  return doy;
}

const pad = (n: number) => (n < 10 ? "0" + n : "" + n);

/** "MM-DD" de hoje em GMT-3. */
export function todayMD(now = Date.now()): string {
  const d = new Date(now - GMT3_OFFSET_MS);
  return pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
}

/** "AAAA-MM-DD" de hoje em GMT-3. */
export function gmt3DateKey(now = Date.now()): string {
  const d = new Date(now - GMT3_OFFSET_MS);
  return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
}

/** Janela de aniversário: o mês inteiro, com folga de 15 dias pro mês vizinho. */
export function inBirthdayWindow(today: string, birthdayMD: string): boolean {
  const YLEN = 366;
  const norm = (x: number) => (((x - 1) % YLEN) + YLEN) % YLEN + 1;
  const bDoy = mdToDoy(birthdayMD);
  const bm = +birthdayMD.split("-")[0];
  let monthStart = 1;
  for (let i = 0; i < bm - 1; i++) monthStart += MONTH_DAYS[i];
  const monthEnd = monthStart + MONTH_DAYS[bm - 1] - 1;
  const start = norm(Math.min(monthStart, bDoy - 15));
  const end = norm(Math.max(monthEnd, bDoy + 15));
  const t = mdToDoy(today);
  return start <= end ? t >= start && t <= end : t >= start || t <= end;
}
