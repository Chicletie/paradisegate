import {
  ApiError,
  ConflictError,
  NotFoundError,
  NotInvitedError,
  OfflineError,
  SessionExpiredError,
  TooLargeError,
  type ApiClient,
  type Sheet,
} from "../jogo/apiClient";
import {
  byteLength,
  characterName,
  fingerprint,
  isEmptySheet,
  KEEPALIVE_LIMIT,
  parseDrawer,
  sheetKeys,
} from "./keys";

/*
 * Salvar a ficha na conta. A fichas.html continua sendo dona da gaveta (autosave a cada mudança);
 * aqui só se lê a gaveta e se conversa com a API. Tudo injetado, testado no node (sync.test.ts).
 *
 *   abrir ─▶ baixa a ficha da conta ─┬─ gaveta vazia, aparelho novo ─▶ grava a da conta, recarrega 1x
 *                                    ├─ gaveta vazia, já teve (zerou) ─▶ espera o jogador editar
 *                                    ├─ igual à conta ─▶ salvo
 *                                    ├─ conta igual à que o aparelho conhece ─▶ sobe a do aparelho
 *                                    ├─ conta mudou, aparelho não ─▶ grava a da conta, recarrega 1x
 *                                    ├─ os dois mudaram ─▶ CONFLITO (o jogador escolhe)
 *                                    └─ ficha de outro (mestre) ─▶ SÓ LEITURA: gaveta = conta, nunca envia
 *   a cada 5s / ao esconder ─▶ mudou? ─▶ PUT com a versão ─┬─ 200 ─▶ salvo
 *                                                          ├─ 409 ─▶ CONFLITO
 *                                                          └─ rede ─▶ fica pendente, tenta de novo
 *   Nunca envia sozinho depois de um conflito: só pela escolha do jogador.
 */

export type StatusKind =
  | "connecting"
  | "saving"
  | "saved"
  | "pending"
  | "signed_out"
  | "expired"
  | "not_invited"
  | "not_found"
  | "too_large"
  | "local_error"
  | "conflict"
  | "open_failed"
  | "other_tab"
  | "unavailable"
  | "error"
  | "read_only"
  | "read_only_stale";

/** `owner`: de quem é a ficha, quando o mestre abre a de um jogador (só leitura). */
export type SyncStatus = { kind: StatusKind; at?: number; owner?: string };

export type KeyValue = {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
};

export type SheetSyncDeps = {
  sheetId: number;
  /** localStorage: a gaveta da ficha e o que este aparelho sabe da conta. */
  local: KeyValue;
  /** sessionStorage: só o que precisa sobreviver a uma recarga desta aba. */
  session: KeyValue;
  api: Pick<ApiClient, "getSheet" | "saveSheet">;
  reload: () => void;
  onStatus: (status: SyncStatus) => void;
  /** Os dois tiveram mudança: a tela mostra a escolha e chama `resolveConflict`. */
  onConflict: () => void;
  now?: () => number;
};

type Phase = "idle" | "needs_boot" | "ready" | "conflict" | "read_only" | "stopped";

const MAX_RELOADS = 2;
/** Só leitura: confere se o jogador mudou a ficha a cada tantos ciclos (6 × 5s = 30s). */
const READ_ONLY_CHECK_EVERY = 6;

function ownerName(sheet: Sheet): string {
  const owner = sheet.owner;
  if (!owner) return "";
  return owner.username ? "@" + owner.username : owner.email;
}

export function createSheetSync(deps: SheetSyncDeps) {
  const keys = sheetKeys(deps.sheetId);
  const now = deps.now ?? (() => Date.now());
  let phase: Phase = "idle";
  let busy = false;
  let conflictWith: Sheet | null = null;
  /** Impressão que a API recusou de vez (grande demais, inválida): só tenta de novo depois de mudar. */
  let refused: string | null = null;
  let lastKind: StatusKind | null = null;
  let owner = "";
  let readOnlyTicks = 0;

  function status(kind: StatusKind) {
    lastKind = kind;
    if (kind === "saved") return deps.onStatus({ kind, at: now() });
    if (kind === "read_only" || kind === "read_only_stale") return deps.onStatus({ kind, owner });
    deps.onStatus({ kind });
  }

  function knownVersion(): number | null {
    const v = Number(deps.local.get(keys.version));
    return Number.isInteger(v) && v > 0 ? v : null;
  }

  function remember(version: number, print: string) {
    deps.local.set(keys.version, String(version));
    deps.local.set(keys.synced, print);
  }

  function reloadOnce(): void {
    const count = Number(deps.session.get(keys.reload)) || 0;
    if (count >= MAX_RELOADS) {
      deps.session.remove(keys.adopt);
      phase = "stopped";
      status("open_failed");
      return;
    }
    deps.session.set(keys.reload, String(count + 1));
    phase = "stopped";
    deps.reload();
  }

  /** Grava a ficha da conta na gaveta e recarrega, pra ficha abrir com ela (como ao importar). */
  function adopt(sheet: Sheet): void {
    const raw = JSON.stringify(sheet.data);
    remember(sheet.version, fingerprint(sheet.data));
    deps.local.set(keys.drawer, raw);
    deps.session.set(keys.adopt, raw);
    reloadOnce();
  }

  function settle(kind: StatusKind): void {
    phase = "ready";
    deps.session.remove(keys.reload);
    status(kind);
  }

  /** Erro de rede ou da API → mensagem e o que fazer depois. */
  function handle(error: unknown, during: "boot" | "save", print?: string): void {
    if (error instanceof SessionExpiredError) {
      // Sem ninguém logado: tenta de novo sozinho (entrar em outra aba vale pra esta também).
      if (error.code !== "missing_token") return stop("expired");
      status("signed_out");
      if (during === "boot") phase = "needs_boot";
      return;
    }
    if (error instanceof NotInvitedError) return stop("not_invited");
    if (error instanceof NotFoundError) return stop("not_found");
    if (error instanceof OfflineError) {
      if (error.code === "not_configured") return stop("unavailable");
      status("pending");
      if (during === "boot") phase = "needs_boot";
      return;
    }
    if (error instanceof TooLargeError) {
      refused = print ?? null;
      status("too_large");
      return;
    }
    if (error instanceof ApiError && during === "save") {
      refused = print ?? null;
      status("error");
      return;
    }
    status("error");
    if (during === "boot") phase = "needs_boot";
  }

  function stop(kind: StatusKind): void {
    phase = "stopped";
    status(kind);
  }

  async function boot(): Promise<void> {
    if (phase !== "needs_boot" || lastKind === null) status("connecting");
    busy = true;
    try {
      await bootInner();
    } finally {
      busy = false;
    }
  }

  async function bootInner(): Promise<void> {
    // Voltou de uma recarga pra abrir a ficha da conta: se a gaveta não ficou com ela (a ficha
    // gravou por cima enquanto a página fechava), grava de novo e recarrega mais uma vez.
    const adopted = deps.session.get(keys.adopt);
    if (adopted !== null) {
      deps.session.remove(keys.adopt);
      if (deps.local.get(keys.drawer) !== adopted) {
        deps.local.set(keys.drawer, adopted);
        deps.session.set(keys.adopt, adopted);
        return reloadOnce();
      }
    }

    let remote: Sheet;
    try {
      remote = await deps.api.getSheet(deps.sheetId);
    } catch (error) {
      return handle(error, "boot");
    }

    if (remote.mine === false) return openReadOnly(remote);

    const remotePrint = fingerprint(remote.data);
    const raw = deps.local.get(keys.drawer);
    const known = knownVersion();

    if (raw === null) {
      // Aparelho que nunca teve esta ficha: abre com a da conta.
      if (known === null && !isEmptySheet(remote.data)) return adopt(remote);
      // Já teve e a gaveta está vazia: foi "Zerar ficha". Não traz a antiga de volta; a ficha nova
      // sobe quando o jogador começar a preencher.
      remember(remote.version, remotePrint);
      return settle("saved");
    }

    const data = parseDrawer(raw);
    if (data === null) {
      phase = "ready";
      return status("local_error");
    }
    const localPrint = fingerprint(data);
    if (localPrint === remotePrint) {
      remember(remote.version, remotePrint);
      return settle("saved");
    }

    const changedHere = deps.local.get(keys.synced) !== localPrint;
    if (known === remote.version) {
      // A conta está como este aparelho deixou: só sobe o que mudou aqui.
      settle("saved");
      return push(data, localPrint, remote.version);
    }
    if (known !== null && !changedHere) return adopt(remote);
    if (isEmptySheet(remote.data)) {
      // Ficha nova na conta e o aparelho já tinha o personagem (importado): sobe a do aparelho.
      settle("saved");
      return push(data, localPrint, remote.version);
    }
    return enterConflict(remote);
  }

  /**
   * O mestre abrindo a ficha de um jogador: a gaveta deste aparelho sempre fica igual à da conta
   * (o que ele mexer aqui some na próxima abertura) e nada é enviado. A API também não deixa
   * salvar (404), isto só evita tentar.
   */
  function openReadOnly(remote: Sheet): void {
    owner = ownerName(remote);
    const raw = deps.local.get(keys.drawer);
    if (isEmptySheet(remote.data)) {
      // Ficha ainda em branco: a ficha abre vazia, sem gravar "{}" na gaveta.
      if (raw !== null) {
        deps.local.remove(keys.drawer);
        return reloadOnce();
      }
    } else {
      const data = raw === null ? null : parseDrawer(raw);
      if (data === null || fingerprint(data) !== fingerprint(remote.data)) return adopt(remote);
    }
    remember(remote.version, fingerprint(remote.data));
    phase = "read_only";
    readOnlyTicks = 0;
    deps.session.remove(keys.reload);
    status("read_only");
  }

  async function checkReadOnly(): Promise<void> {
    readOnlyTicks += 1;
    if (lastKind === "read_only_stale" || readOnlyTicks % READ_ONLY_CHECK_EVERY !== 0) return;
    busy = true;
    try {
      const remote = await deps.api.getSheet(deps.sheetId);
      if (remote.version !== knownVersion()) status("read_only_stale");
    } catch {
      /* sem rede: confere de novo no próximo ciclo */
    } finally {
      busy = false;
    }
  }

  function enterConflict(remote: Sheet): void {
    conflictWith = remote;
    phase = "conflict";
    deps.session.remove(keys.reload);
    status("conflict");
    deps.onConflict();
  }

  async function push(
    data: Record<string, unknown>,
    print: string,
    version: number,
    options: { force?: boolean; keepalive?: boolean } = {},
  ): Promise<void> {
    busy = true;
    status("saving");
    try {
      const saved = await deps.api.saveSheet(
        deps.sheetId,
        { version, data, nome: characterName(data), force: options.force },
        { keepalive: options.keepalive },
      );
      remember(saved.version, print);
      refused = null;
      status("saved");
    } catch (error) {
      if (error instanceof ConflictError) {
        try {
          return enterConflict(await deps.api.getSheet(deps.sheetId));
        } catch (again) {
          return handle(again, "save", print);
        }
      }
      handle(error, "save", print);
    } finally {
      busy = false;
    }
  }

  /** O que a gaveta tem e ainda não está na conta, ou `null` se não há nada pra subir. */
  function pending(): { data: Record<string, unknown>; print: string; version: number } | null {
    const raw = deps.local.get(keys.drawer);
    if (raw === null) return null;
    const data = parseDrawer(raw);
    if (data === null) {
      if (lastKind !== "local_error") status("local_error");
      return null;
    }
    const print = fingerprint(data);
    if (print === deps.local.get(keys.synced)) {
      if (lastKind === "local_error") status("saved");
      return null;
    }
    if (print === refused) return null;
    const version = knownVersion();
    if (version === null) return null;
    return { data, print, version };
  }

  /** A cada poucos segundos: abre (se ainda não abriu) ou sobe o que mudou. */
  async function tick(): Promise<void> {
    if (busy) return;
    if (phase === "needs_boot") return boot();
    if (phase === "read_only") return checkReadOnly();
    if (phase !== "ready") return;
    const next = pending();
    if (next) await push(next.data, next.print, next.version);
  }

  /** A aba está sumindo (trocou de app, fechou): último envio, que sobrevive ao fechamento. */
  function flush(): void {
    if (busy || phase !== "ready") return;
    const next = pending();
    if (!next) return;
    const size = byteLength(JSON.stringify({ version: next.version, data: next.data }));
    // Acima do limite do keepalive vai um envio comum: se a aba fechar antes, a gaveta continua
    // com a impressão diferente da conta e sobe na próxima vez que a ficha abrir.
    void push(next.data, next.print, next.version, { keepalive: size <= KEEPALIVE_LIMIT });
  }

  /** Escolha do jogador no conflito: a ficha da conta ou a deste aparelho. */
  async function resolveConflict(choice: "remote" | "local"): Promise<void> {
    if (phase !== "conflict" || !conflictWith) return;
    const remote = conflictWith;
    conflictWith = null;
    if (choice === "remote") return adopt(remote);
    const raw = deps.local.get(keys.drawer);
    const data = raw === null ? null : parseDrawer(raw);
    if (data === null) return adopt(remote);
    // A partir daqui o aparelho conhece a versão da conta: se este envio falhar (rede), os
    // próximos seguem dela, sem cair no conflito de novo.
    remember(remote.version, fingerprint(remote.data));
    phase = "ready";
    await push(data, fingerprint(data), remote.version, { force: true });
  }

  return {
    boot: () => {
      phase = "needs_boot";
      return boot();
    },
    tick,
    flush,
    resolveConflict,
    /** Pra tela: em que pé está (testes e depuração). */
    get phase() {
      return phase;
    },
  };
}

export type SheetSync = ReturnType<typeof createSheetSync>;
