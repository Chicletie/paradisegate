/*
 * Username (@algumacoisa): o nome único de cada conta, diferente do apelido (que pode repetir).
 * Mesmas regras que o Firestore confere (as regras do banco são a palavra final): 3 a 20
 * caracteres, só letras minúsculas sem acento, números e "_", começando por letra ou número,
 * e fora da lista de nomes reservados. Troca: no máximo uma vez a cada 30 dias.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const USERNAME_DAYS = 30;
const RESERVED = ["admin", "adm", "autor", "mestre", "paradisegate", "paradise_gate", "suporte", "moderador", "moderacao", "wiki", "perfil", "busca", "null", "undefined"];

/** O que a pessoa digitou → como o nome fica guardado (sem @, minúsculo, sem acento). */
export function normalizeUsername(raw: string): string {
  return String(raw || "")
    .trim()
    .replace(/^@+/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/*
 * Nomes proibidos (ódio, palavrão, sexual). Mesma lista na regra do Firestore e em
 * public/cadastro.html. Duas listas por causa do problema do "computador" (tem "puta" dentro):
 * - BLOCK_ANY: palavras longas e sem outro sentido, proibidas em qualquer parte do nome, mesmo
 *   disfarçadas (h1tl3r, h_i_t_l_e_r: números viram letras e o _ some antes de conferir);
 * - BLOCK_PART: palavras curtas ou ambíguas, proibidas só como uma parte inteira do nome
 *   (separada por _ ou número): "super_puta" não, "computador" sim.
 */
export const BLOCK_ANY = [
  "hitler", "nazi", "nazis", "nazismo", "neonazi", "fascis", "siegheil", "heilhitler", "whitepower", "holocaust", "kukluxklan", "reichsfuhrer", "gestapo",
  "nigger", "nigga", "pedofil", "pedophil", "estupr",
  "buceta", "boceta", "bucetinha", "xoxota", "xereca", "piroca", "caralho", "porra", "punheta", "siririca", "boquete", "arrombad", "cuzao", "cusao", "foder", "fuder", "fodase", "fodido",
  "merda", "bosta", "vagabunda", "putaria", "putinha", "filhodaputa", "viadinho",
  "pussy", "fuck", "shit", "bitch", "cunt", "whore", "slut", "blowjob", "handjob", "dildo", "porn", "hentai", "penis", "vagina", "boobs", "motherfuck", "asshole",
];
export const BLOCK_PART = [
  "puta", "puto", "xana", "tits", "cu", "cus", "pau", "rola", "pinto", "pica", "foda", "fode", "viado", "bicha", "traveco", "crioulo", "anal", "sexo", "sex", "xxx", "rape", "cum", "dick", "cock", "ass", "fag", "retard",
  "vsf", "pqp", "fdp", "tnc", "krl", "crl", "vtnc", "kct",
];
const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "9": "g" };
/** O nome cai na lista de proibidos? */
export function isBlockedUsername(name: string): boolean {
  const collapsed = name.replace(/[0-9]/g, (d) => LEET[d] || "").replace(/_/g, "");
  if (BLOCK_ANY.some((w) => collapsed.includes(w))) return true;
  const parts = name.split(/[_0-9]+/).filter(Boolean);
  const leetParts = name.replace(/[0-9]/g, (d) => LEET[d] || "_").split("_").filter(Boolean);
  return [...parts, ...leetParts].some((p) => BLOCK_PART.includes(p));
}

/** Por que o nome não serve (texto pro leitor), ou "" se serve. */
export function usernameProblem(name: string): string {
  if (!name) return "Escolha um nome.";
  if (name.length < USERNAME_MIN) return `Pelo menos ${USERNAME_MIN} caracteres.`;
  if (name.length > USERNAME_MAX) return `No máximo ${USERNAME_MAX} caracteres.`;
  if (!/^[a-z0-9_]+$/.test(name)) return "Só letras sem acento, números e _ (sem espaço).";
  if (name[0] === "_") return "Comece com uma letra ou um número.";
  if (RESERVED.includes(name)) return "Esse nome é reservado.";
  if (isBlockedUsername(name)) return "Esse nome não é permitido.";
  return "";
}

/** A data guardada no perfil (Timestamp do Firestore, Date ou texto) em milissegundos. */
export function toMillis(v: unknown): number | null {
  if (!v) return null;
  if (typeof v === "object" && v !== null && "toMillis" in v && typeof (v as { toMillis: unknown }).toMillis === "function") {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (v instanceof Date) return v.getTime();
  const t = Date.parse(String(v));
  return Number.isNaN(t) ? null : t;
}

/** Quando pode trocar de novo (ms), ou null se já pode (ou nunca escolheu). */
export function nextChangeAt(changedAt: unknown, now = Date.now()): number | null {
  const t = toMillis(changedAt);
  if (t == null) return null;
  const next = t + USERNAME_DAYS * 864e5;
  return next > now ? next : null;
}

export function fmtDay(ms: number): string {
  return new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
