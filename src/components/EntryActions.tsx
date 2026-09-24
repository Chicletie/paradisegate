import { createContext, Fragment, useContext, useEffect, useState, type ReactNode } from "react";
import { Modal, nicknameOf, useAccount } from "../lib/account";
import { addSuggestion, fetchMySuggestionsFor, fetchRestrito } from "../lib/api";
import { fieldValue, RenderMarkdown } from "../lib/markdown";
import type { WikiField, WikiRestritoItem, WikiSuggestion } from "../types";
import { PgStar } from "./PgIcons";
import { usePlacedSet } from "../lib/restritoPlace";

/*
 * O que depende de login numa página da wiki — porta de mountFavoriteBtn, mountSuggestBox,
 * openSuggestModal e mountRestrito na wiki original. Tudo some pra quem não entrou ou
 * está "vendo como convidado".
 */

/** "Favoritar" (só entradas): guarda o wikiId em wikiProfiles/{uid}.favorites. */
export function FavoriteButton({ wikiId }: { wikiId: string }) {
  const { user, guest, profile, save } = useAccount();
  const [busy, setBusy] = useState(false);
  const on = !!profile && (profile.favorites || []).indexOf(wikiId) !== -1;
  return (
    <button
      className="linklike pg-fav"
      type="button"
      aria-pressed={on ? "true" : "false"}
      hidden={!user || guest || !profile}
      disabled={busy}
      onClick={() => {
        if (!user) return;
        setBusy(true);
        save({ favorite: { id: wikiId, on: !on } })
          .catch(() => window.alert("Não consegui salvar o favorito agora. Tenta de novo daqui a pouco."))
          .then(() => setBusy(false));
      }}
    >
      <PgStar className="pg-fav-star" />
      <span>{on ? "Favorito" : "Favoritar"}</span>
    </button>
  );
}

/** "Sugerir alteração" e "Minhas sugestões aqui", na fileira de ações do alto da página. */
export function SuggestButtons({
  wikiId,
  pageTitle,
  tab,
  onToggleMine,
}: {
  wikiId: string;
  pageTitle: string;
  tab: string;
  onToggleMine: () => void;
}) {
  const { user, guest } = useAccount();
  const [modal, setModal] = useState(false);
  const show = !!user && !guest;
  return (
    <>
      <button className="linklike" type="button" hidden={!show} onClick={() => setModal(true)}>
        Sugerir alteração
      </button>
      <button className="linklike" type="button" hidden={!show} onClick={onToggleMine}>
        Minhas sugestões aqui
      </button>
      {modal && <SuggestModal wikiId={wikiId} pageTitle={pageTitle} tab={tab} onClose={() => setModal(false)} />}
    </>
  );
}

function SuggestModal({ wikiId, pageTitle, tab, onClose }: { wikiId: string; pageTitle: string; tab: string; onClose: () => void }) {
  const { user, profile } = useAccount();
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  function doSubmit() {
    const t = text.trim();
    if (!t) {
      setErr("Escreve alguma coisa antes de enviar.");
      return;
    }
    if (!user) return;
    setErr("");
    setBusy(true);
    addSuggestion({
      wikiId,
      pageTitle: pageTitle || "",
      tab: tab || "",
      text: t,
      authorEmail: user.email,
      authorName: nicknameOf(profile) || null,
      status: "pendente",
      createdAt: new Date().toISOString(),
    }).then(
      () => setSent(true),
      () => {
        setBusy(false);
        setErr("Não consegui enviar. Tenta de novo em instantes.");
      },
    );
  }

  if (sent) {
    return (
      <Modal onClose={onClose}>
        <h3>Enviado!</h3>
        <div>Obrigado! Sua sugestão vai aparecer pro autor da wiki.</div>
        <button className="submit" type="button" style={{ marginTop: 10 }} onClick={onClose}>
          Fechar
        </button>
      </Modal>
    );
  }
  return (
    <Modal onClose={onClose}>
      <h3>Sugerir alteração</h3>
      <div style={{ fontSize: "12.5px", color: "var(--faint)", marginBottom: 8 }}>{pageTitle + (tab && tab !== "Geral" ? " · " + tab : "")}</div>
      <textarea
        placeholder="O que você acha que devia mudar ou ser adicionado?"
        autoFocus
        value={text}
        onChange={(ev) => setText(ev.target.value)}
      />
      <div className="err">{err}</div>
      <button className="submit" type="button" disabled={busy} onClick={doSubmit}>
        {busy ? "enviando…" : "Enviar sugestão"}
      </button>
      <button className="cancel" type="button" onClick={onClose}>
        cancelar
      </button>
    </Modal>
  );
}

const STATUS_LABEL: Record<string, string> = { aceita: "✅ aceita", rejeitada: "❌ rejeitada" };

/**
 * Abre/fecha a lista de "Minhas sugestões aqui". Cada abertura ganha um número novo (a lista é
 * lida de novo, como hoje); fechada = 0.
 */
export function useMineToggle(): [number, () => void] {
  const [n, setN] = useState(0);
  return [n > 0 ? n : 0, () => setN((m) => (m > 0 ? -m : -m + 1))];
}

/** A lista que "Minhas sugestões aqui" abre no fim da página — lida de novo a cada abertura. */
export function MySuggestionsHere({ wikiId, open }: { wikiId: string; open: number }) {
  const { user } = useAccount();
  const email = user?.email;
  const req = open && email ? open + "|" + email : null;
  const [got, setGot] = useState<{ req: string; value: WikiSuggestion[] | "error" } | null>(null);
  useEffect(() => {
    if (!req || !email) return;
    let cancelled = false;
    fetchMySuggestionsFor(wikiId, email).then(
      (list) => {
        if (!cancelled) setGot({ req, value: list });
      },
      () => {
        if (!cancelled) setGot({ req, value: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [req, email, wikiId]);
  const state = !req ? null : got && got.req === req ? got.value : "loading";

  let content: ReactNode = null;
  if (state === "loading") content = <div className="empty">carregando…</div>;
  else if (state === "error") content = <div className="empty">Não consegui carregar suas sugestões agora.</div>;
  else if (state && !state.length) content = <div className="empty">Você ainda não enviou nenhuma sugestão nesta página.</div>;
  else if (state)
    content = (
      <>
        <div className="cathead">🗒 Suas sugestões nesta página</div>
        {[...state]
          .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
          .map((s, i) => (
            <div key={i} style={{ margin: "8px 0", paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--faint)" }}>
                {(s.tab && s.tab !== "Geral" ? s.tab + " · " : "") + (STATUS_LABEL[s.status || ""] || "⏳ pendente")}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{s.text || ""}</div>
            </div>
          ))}
      </>
    );
  return <div className="restrito-wrap">{content}</div>;
}

/** Itens de wikiRestrito liberados pro leitor nesta página (lidos de novo a cada login/saída). */
export function useRestrito(wikiId: string): WikiRestritoItem[] {
  const { user, guest } = useAccount();
  const email = user && !guest ? user.email : null;
  const req = email ? user!.uid + "|" + wikiId : null;
  const [got, setGot] = useState<{ req: string; items: WikiRestritoItem[] } | null>(null);
  useEffect(() => {
    if (!req || !email) return;
    let cancelled = false;
    fetchRestrito(wikiId, email).then(
      (items) => {
        if (!cancelled) setGot({ req, items });
      },
      () => {
        /* sem acesso a nada daqui: nada pra mostrar */
      },
    );
    return () => {
      cancelled = true;
    };
  }, [req, email, wikiId]);
  return got && got.req === req ? got.items : NONE;
}
const NONE: WikiRestritoItem[] = [];

const SUB_HEAD = { fontSize: 11, marginTop: 14 };

/** "🔐 Desbloqueado pra você": o que não é troca de campo vira uma lista no fim da página. */
export function RestritoSlot({ items }: { items: WikiRestritoItem[] }) {
  const placed = usePlacedSet();
  const extra = items.filter((it) => it.kind !== "campo-confidencial" && !placed.has(it));
  return (
    <div className="restrito-wrap">
      {extra.length > 0 && <div className="cathead">🔐 Desbloqueado pra você</div>}
      {extra.map((it, i) => {
        const heading = (it.key || it.title || "Seção") + (it.variant ? " (" + it.variant + ")" : "");
        switch (it.kind) {
          case "campo":
          case "secao":
            return (
              <Fragment key={i}>
                <div className="cathead" style={SUB_HEAD}>
                  {heading}
                </div>
                <RenderMarkdown text={it.kind === "campo" ? it.value : it.body} />
              </Fragment>
            );
          case "tag":
            return (
              <span key={i} className="tag" style={{ marginRight: 6 }}>
                {"#" + it.text}
              </span>
            );
          case "alias":
            return (
              <div key={i} className="aliases">
                {"também: " + it.text}
              </div>
            );
          case "galeria":
            return (
              <figure key={i} className="gal-item" style={{ display: "inline-block", width: 140, margin: "0 8px 8px 0" }}>
                <img src={it.url} alt={it.caption || ""} />
                {it.caption && <figcaption>{it.caption}</figcaption>}
              </figure>
            );
          case "sessao":
            return (
              <Fragment key={i}>
                <div className="cathead" style={SUB_HEAD}>
                  {(it.title || "Sessão") + (it.date ? " · " + it.date : "")}
                </div>
                <RenderMarkdown text={it.recap} />
              </Fragment>
            );
          case "post":
            return (
              <Fragment key={i}>
                <div className="cathead" style={SUB_HEAD}>
                  {(it.date ? it.date + " · " : "") + (it.title || "Post")}
                </div>
                <RenderMarkdown text={it.body} />
              </Fragment>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

// --- Versão confidencial de um campo, trocada no próprio lugar (data-field-swap) ---

interface SwapState {
  /** Campo → versões confidenciais liberadas pro leitor (pode ter mais de uma). */
  values: Record<string, string[]>;
  /** Campo → lugar que recebe a troca. Com o mesmo nome em dois lugares, vale o último da
   * página (o original percorre os `[data-field-swap]` e fica com o último que bate). */
  winner: Record<string, string>;
}

const SwapContext = createContext<SwapState | null>(null);

/**
 * Onde cada campo pode ser trocado, na ordem em que aparece na página: fatos curtos da
 * infobox, campos longos da aba Geral (variantes nunca), fatos e notas da Taxonomia (prefixo
 * "tax:", pra não colidir com um campo de mesmo nome da Geral).
 */
export function swapWinners(fields: WikiField[] = [], taxonomy: WikiField[] = []): Record<string, string> {
  // Índices dentro de cada lista filtrada — os mesmos que Infobox/ArticleBundle/TaxonomyPanel usam.
  const winner: Record<string, string> = {};
  const put = (list: WikiField[], long: boolean, prefix: string, slot: string) =>
    list
      .filter((f) => (f.type === "nota") === long)
      .forEach((f, i) => {
        if (f.type !== "cabecalho") winner[prefix + f.key] = slot + i;
      });
  put(fields, false, "", "ib:");
  put(fields, true, "", "lf:");
  put(taxonomy, false, "tax:", "ts:");
  put(taxonomy, true, "tax:", "tl:");
  return winner;
}

export function SwapProvider({ items, winner, children }: { items: WikiRestritoItem[]; winner: Record<string, string>; children: ReactNode }) {
  const values: Record<string, string[]> = {};
  items.forEach((it) => {
    if (it.kind === "campo-confidencial" && it.key) (values[it.key] = values[it.key] || []).push(it.value || "");
  });
  return <SwapContext.Provider value={{ values, winner }}>{children}</SwapContext.Provider>;
}

/** As versões confidenciais deste campo neste lugar, se o leitor tiver acesso. */
function useSwap(slot: string, key: string): string[] | undefined {
  const ctx = useContext(SwapContext);
  if (!ctx || ctx.winner[key] !== slot || !(key in ctx.values)) return undefined;
  return ctx.values[key];
}

/** Estado da troca: qual versão está à mostra, ou a pública ("ver como convidado"). */
function useSwapView(n: number) {
  const [idx, setIdx] = useState(0);
  const [guest, setGuest] = useState(false);
  const controls = (
    <span className="pg-swap-ctl">
      {guest ? <span className="pg-swap-note">versão pública</span> : n > 1 ? <span className="pg-swap-note">{"versão " + (idx + 1) + " de " + n}</span> : null}
      {!guest && n > 1 && (
        <button type="button" className="linklike" onClick={() => setIdx((idx + 1) % n)}>
          ver outra versão
        </button>
      )}
      <button type="button" className="linklike" aria-pressed={guest ? "true" : "false"} onClick={() => setGuest(!guest)}>
        {guest ? "mostrar a desbloqueada" : "ver como convidado"}
      </button>
    </span>
  );
  return { idx: Math.min(idx, n - 1), guest, controls };
}

/** `<td>` de um fato curto (infobox ou taxonomia). */
export function SwapCell({ slot, fieldKey, children }: { slot: string; fieldKey: string; children: ReactNode }) {
  const swapped = useSwap(slot, fieldKey);
  if (swapped === undefined || !swapped.length) return <td data-field-swap={fieldKey}>{children}</td>;
  return <SwapCellOn fieldKey={fieldKey} versions={swapped}>{children}</SwapCellOn>;
}
function SwapCellOn({ fieldKey, versions, children }: { fieldKey: string; versions: string[]; children: ReactNode }) {
  const v = useSwapView(versions.length);
  return (
    <td data-field-swap={fieldKey} className={v.guest ? undefined : "wb-conf-swapped"}>
      {v.guest ? children : <span>{fieldValue(versions[v.idx])}</span>}
      {v.controls}
    </td>
  );
}

/** Corpo de um campo longo. `slot` vazio = lugar sem troca (variantes de obra). */
export function SwapBody({ slot, fieldKey, children }: { slot?: string; fieldKey: string; children: ReactNode }) {
  const swapped = useSwap(slot || "", fieldKey);
  if (!slot) return <div>{children}</div>;
  if (swapped === undefined || !swapped.length) return <div data-field-swap={fieldKey}>{children}</div>;
  return <SwapBodyOn fieldKey={fieldKey} versions={swapped}>{children}</SwapBodyOn>;
}
function SwapBodyOn({ fieldKey, versions, children }: { fieldKey: string; versions: string[]; children: ReactNode }) {
  const v = useSwapView(versions.length);
  return (
    <div data-field-swap={fieldKey} className={v.guest ? undefined : "wb-conf-swapped"}>
      {v.guest ? children : <RenderMarkdown text={versions[v.idx]} />}
      {v.controls}
    </div>
  );
}
