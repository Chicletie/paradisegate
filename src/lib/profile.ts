import type { AuthUser, WikiIndex, WikiProfile, WikiProfilePatch, WikiRestritoItem, WikiSuggestion } from "../types";

// Partes puras do perfil do leitor — porta de pgAccessLabel e do agrupamento de "Seus acessos"
// em renderProfile (wiki-core.js, arvore).

/** Como um trecho liberado aparece na lista "Seus acessos". */
export function accessLabel(it: WikiRestritoItem): string {
  const q = (s: string | undefined) => "“" + String(s || "").replace(/^tax:/, "") + "”";
  const t =
    it.kind === "campo"
      ? "Campo " + q(it.key)
      : it.kind === "campo-confidencial"
        ? "Versão confidencial de " + q(it.key)
        : it.kind === "secao"
          ? "Seção " + q(it.title)
          : it.kind === "post"
            ? "Nota " + q(it.title)
            : it.kind === "sessao"
              ? "Sessão " + q(it.title)
              : it.kind === "tag"
                ? "Tag " + q(it.text)
                : it.kind === "alias"
                  ? "Alcunha " + q(it.text)
                  : it.kind === "galeria"
                    ? "Imagem da galeria" + (it.caption ? " " + q(it.caption) : "")
                    : "Trecho restrito";
  return t + (it.variant ? " · " + it.variant : "");
}

/** Itens liberados agrupados por página, só páginas do índice (Paradise Gate), por título. */
export function groupAccesses(rows: { pageId: string; item: WikiRestritoItem }[], index: WikiIndex): { pageId: string; items: WikiRestritoItem[] }[] {
  const byPage: Record<string, WikiRestritoItem[]> = {};
  const order: string[] = [];
  rows.forEach(({ pageId, item }) => {
    if (!index[pageId]) return;
    if (!byPage[pageId]) {
      byPage[pageId] = [];
      order.push(pageId);
    }
    byPage[pageId].push(item);
  });
  return order
    .sort((a, b) => (index[a].title || "").localeCompare(index[b].title || ""))
    .map((pageId) => ({ pageId, items: byPage[pageId] }));
}

/** Situação de uma sugestão: rótulo e classe do selo. */
export function suggestionStatus(s: WikiSuggestion): [string, string] {
  return s.status === "aceita" ? ["Aceita", "is-ok"] : s.status === "rejeitada" ? ["Não aceita", "is-no"] : ["Pendente", "is-wait"];
}

/** Resposta ou decisão do autor depois da última visita do leitor às próprias sugestões. */
export function isNewSuggestion(s: WikiSuggestion, seen: string): boolean {
  return !!((s.repliedAt && s.repliedAt > seen) || (s.statusAt && s.statusAt > seen));
}

export function newestFirst(list: WikiSuggestion[]): WikiSuggestion[] {
  return [...list].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

/** Respostas ou decisões do autor mais novas que a última visita do leitor às próprias sugestões. */
export function unreadCount(suggestions: WikiSuggestion[], seenAt: string | undefined): number {
  return suggestions.filter((s) => isNewSuggestion(s, seenAt || "")).length;
}

/** O perfil guardado localmente depois de uma gravação (o que pgSaveProfile junta no cache). */
export function mergeProfile(d: WikiProfile, user: AuthUser, patch: WikiProfilePatch, updatedAt: string): WikiProfile {
  const next: WikiProfile = { ...d, email: user.email, updatedAt };
  if (patch.nickname !== undefined) next.nickname = patch.nickname;
  if (patch.seenAt !== undefined) next.seenAt = patch.seenAt;
  if (patch.photo !== undefined) next.photo = patch.photo;
  if (patch.favorite) {
    const list = (d.favorites || []).filter((x) => x !== patch.favorite!.id);
    if (patch.favorite.on) list.push(patch.favorite.id);
    next.favorites = list;
  }
  return next;
}
