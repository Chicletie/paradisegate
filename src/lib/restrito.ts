/*
 * As regras do Firestore não filtram listas: elas aprovam ou recusam a consulta inteira. Pedir
 * todos os itens de wikiRestrito/{id}/itens só passa quando o leitor pode ler cada um deles; se
 * a página tiver um item de outra pessoa, vem permission-denied e o leitor não veria nem o dele.
 * Por isso: tenta a lista inteira e, se for recusada, pede só os itens com o e-mail dele em
 * `permitidos` (consulta que a regra consegue aprovar).
 */

/** Leitura recusada pelas regras do Firestore (FirestoreError com code "permission-denied"). */
export function isPermissionDenied(err: unknown): boolean {
  return !!err && typeof err === "object" && (err as { code?: unknown }).code === "permission-denied";
}

/** `all()`; se as regras recusarem, `own()`. Qualquer outro erro sobe como veio. */
export async function allOrOwn<T>(all: () => Promise<T>, own: () => Promise<T>): Promise<T> {
  try {
    return await all();
  } catch (err) {
    if (!isPermissionDenied(err)) throw err;
    return own();
  }
}
