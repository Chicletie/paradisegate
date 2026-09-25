/*
 * Cliente da API do jogo (fichas, convites), usado pela ficha e pelas páginas do jogo.
 * Sem Firebase nem `fetch` global aqui dentro: quem cria o cliente passa o fetch, o passe
 * de login e o relógio, então dá pra testar tudo no node (apiClient.test.ts).
 *
 *   pedido ─▶ passe ─▶ fetch ─┬─ 2xx ─────────────▶ resposta
 *                             ├─ 401 ─▶ passe novo, tenta 1x ─▶ SessionExpiredError
 *                             ├─ rede / 502-504 ─▶ espera crescente (servidor acordando)
 *                             │                    até waitLimitMs ─▶ OfflineError
 *                             └─ 403 / 404 / 409 / 413 / 422 ─▶ erro com nome + request_id
 */

export type ErrorDetail = { code?: string; message?: string; [key: string]: unknown };

export class ApiError extends Error {
  status: number;
  code: string;
  requestId: string | null;
  detail: ErrorDetail;

  constructor(status: number, detail: ErrorDetail, requestId: string | null) {
    super(detail.message || "Não deu certo, tente de novo.");
    this.status = status;
    this.code = detail.code || "error";
    this.requestId = requestId;
    this.detail = detail;
  }
}

/** A conta entrou no Firebase, mas o mestre ainda não liberou pra mesa (sem convite). */
export class NotInvitedError extends ApiError {}
/** Sem passe, ou o passe não vale mais mesmo depois de renovar: precisa entrar de novo. */
export class SessionExpiredError extends ApiError {}
/** A ficha mudou em outro aparelho desde que esta foi aberta. */
export class ConflictError extends ApiError {
  get currentVersion(): number {
    return Number(this.detail.current_version);
  }
}
export class TooLargeError extends ApiError {}
export class NotFoundError extends ApiError {}
/** Não deu pra falar com o servidor (sem rede, ou ele não acordou a tempo). */
export class OfflineError extends ApiError {}

export type SheetSummary = { id: number; nome: string; prestigio_atual: number; version: number; updated_at: string };
export type SheetOwner = { id: number; username: string | null; email: string };
/** `mine: false` quando o mestre (admin) abre a ficha de um jogador: só leitura. */
export type Sheet = SheetSummary & { data: Record<string, unknown>; mine?: boolean; owner?: SheetOwner | null };
/** Uma linha de "Fichas da mesa" (só admin). `mine`: a ficha do próprio mestre (abre pra editar). */
export type TableSheet = SheetSummary & { owner: SheetOwner; mine: boolean };
/** Sugestão do mestre numa ficha. `seen_at` nulo = a dona ainda não viu. */
export type SheetNote = { id: number; sheet_id: number; text: string; created_at: string; seen_at: string | null; author: string | null };
/** No perfil da dona: de qual ficha é. */
export type MySheetNote = SheetNote & { sheet_nome: string };
export type Me = { id: number; username: string | null; email: string; role: "player" | "admin" };
export type Invite = { id: number; email: string; created_at: string; invited_by: string | null; joined: boolean };

export type ApiClientDeps = {
  baseUrl: string;
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  /** Passe do Firebase; `true` pede um novo mesmo se o atual ainda parece valer. */
  getToken: (forceRefresh: boolean) => Promise<string | null>;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  /** Quanto esperar o servidor acordar (o Render grátis dorme e leva ~1 min pra voltar). */
  waitLimitMs?: number;
  /** Avisado na primeira nova tentativa, pra tela mostrar "Conectando à conta…". */
  onWaking?: () => void;
};

type RequestOptions = { method?: string; body?: unknown; auth?: boolean; keepalive?: boolean };

const RETRY_STATUSES = new Set([502, 503, 504]);
const BACKOFF_MS = [1000, 2000, 4000, 8000, 15000];

function errorFor(status: number, detail: ErrorDetail, requestId: string | null): ApiError {
  if (status === 401) return new SessionExpiredError(status, detail, requestId);
  if (status === 403 && detail.code === "not_invited") return new NotInvitedError(status, detail, requestId);
  if (status === 404) return new NotFoundError(status, detail, requestId);
  if (status === 409) return new ConflictError(status, detail, requestId);
  if (status === 413) return new TooLargeError(status, detail, requestId);
  return new ApiError(status, detail, requestId);
}

async function readDetail(res: Response): Promise<ErrorDetail> {
  const body = (await res.json().catch(() => ({}))) as { detail?: unknown };
  if (body.detail && typeof body.detail === "object") return body.detail as ErrorDetail;
  if (typeof body.detail === "string") return { message: body.detail };
  return {};
}

export function createApiClient(deps: ApiClientDeps) {
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((ok) => setTimeout(ok, ms)));
  const now = deps.now ?? (() => Date.now());
  const waitLimitMs = deps.waitLimitMs ?? 60_000;

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, auth = true, keepalive = false } = options;
    if (!deps.baseUrl) throw new OfflineError(0, { code: "not_configured", message: "A conta do jogo não está configurada neste site." }, null);

    let token: string | null = null;
    if (auth) {
      token = await deps.getToken(false);
      if (!token) throw new SessionExpiredError(401, { code: "missing_token", message: "Entre na sua conta pra continuar" }, null);
    }

    const started = now();
    let refreshed = false;
    let attempt = 0;
    for (;;) {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (body !== undefined) headers["Content-Type"] = "application/json";

      let res: Response | null = null;
      try {
        res = await deps.fetch(deps.baseUrl + path, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          keepalive,
        });
      } catch {
        res = null;
      }

      if (res === null || RETRY_STATUSES.has(res.status)) {
        const wait = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
        if (now() - started + wait > waitLimitMs) {
          throw new OfflineError(res?.status ?? 0, { code: "offline", message: "Sem conexão com a conta. O que você mudou continua salvo neste aparelho." }, res?.headers.get("x-request-id") ?? null);
        }
        if (attempt === 0) deps.onWaking?.();
        attempt += 1;
        await sleep(wait);
        continue;
      }

      const requestId = res.headers.get("x-request-id");
      if (res.status === 401 && auth && !refreshed) {
        refreshed = true;
        token = await deps.getToken(true);
        if (!token) throw errorFor(401, await readDetail(res), requestId);
        continue;
      }
      if (!res.ok) throw errorFor(res.status, await readDetail(res), requestId);
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    }
  }

  return {
    request,
    health: () => request<{ status: string }>("/health", { auth: false }),
    me: () => request<Me>("/users/me"),
    listSheets: () => request<SheetSummary[]>("/character-sheets"),
    listTableSheets: () => request<TableSheet[]>("/character-sheets/mesa"),
    getSheet: (id: number) => request<Sheet>(`/character-sheets/${id}`),
    createSheet: (nome: string, data: Record<string, unknown>) =>
      request<Sheet>("/character-sheets", { method: "POST", body: { nome, data } }),
    saveSheet: (
      id: number,
      save: { version: number; data: Record<string, unknown>; nome?: string; force?: boolean },
      options: { keepalive?: boolean } = {},
    ) => {
      const body: Record<string, unknown> = { version: save.version, data: save.data };
      if (save.nome) body.nome = save.nome;
      if (save.force) body.force = true;
      return request<Sheet>(`/character-sheets/${id}`, { method: "PUT", body, keepalive: options.keepalive });
    },
    deleteSheet: (id: number) => request<void>(`/character-sheets/${id}`, { method: "DELETE" }),
    listMyNotes: () => request<MySheetNote[]>("/character-sheets/notes"),
    markNotesSeen: () => request<void>("/character-sheets/notes/seen", { method: "POST" }),
    listSheetNotes: (id: number) => request<SheetNote[]>(`/character-sheets/${id}/notes`),
    createNote: (id: number, text: string) => request<SheetNote>(`/character-sheets/${id}/notes`, { method: "POST", body: { text } }),
    deleteNote: (id: number, noteId: number) => request<void>(`/character-sheets/${id}/notes/${noteId}`, { method: "DELETE" }),
    listInvites: () => request<Invite[]>("/invites"),
    createInvite: (email: string) => request<Invite>("/invites", { method: "POST", body: { email } }),
    deleteInvite: (id: number) => request<void>(`/invites/${id}`, { method: "DELETE" }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
