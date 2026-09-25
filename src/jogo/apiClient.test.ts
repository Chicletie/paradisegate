import { describe, expect, it, vi } from "vitest";
import contract from "./contract/ficha-sync.json";
import {
  ApiError,
  ConflictError,
  createApiClient,
  NotFoundError,
  NotInvitedError,
  OfflineError,
  SessionExpiredError,
  TooLargeError,
  type ApiClientDeps,
} from "./apiClient";

type Case = (typeof contract.cases)[number];
const CASES = Object.fromEntries(contract.cases.map((c) => [c.name, c])) as Record<string, Case>;

/** A resposta de exemplo do contrato vira uma Response de verdade. */
function responseFor(c: Case, requestId = "req-contract-1"): Response {
  const r = c.response as Record<string, unknown>;
  const headers = { "content-type": "application/json", "x-request-id": requestId };
  if (r.status === 204) return new Response(null, { status: 204, headers });
  let body: unknown = r.body ?? r.body_subset ?? {};
  if (r.detail_code) body = { detail: { code: r.detail_code, message: "mensagem pro jogador", ...((r.detail_subset as object) ?? {}) } };
  return new Response(JSON.stringify(body), { status: r.status as number, headers });
}

function client(fetchImpl: ApiClientDeps["fetch"], extra: Partial<ApiClientDeps> = {}) {
  let clock = 0;
  const sleep = vi.fn(async (ms: number) => {
    clock += ms;
  });
  const getToken = vi.fn(async (force: boolean) => (force ? "passe-novo" : "passe"));
  const api = createApiClient({ baseUrl: "https://api.test", fetch: fetchImpl, getToken, sleep, now: () => clock, ...extra });
  return { api, sleep, getToken };
}

describe("contrato com a API", () => {
  it("salvar manda PUT com a versão, os dados e o passe", async () => {
    const fetchImpl = vi.fn<ApiClientDeps["fetch"]>(async () => responseFor(CASES.salvar));
    const { api } = client(fetchImpl);
    const saved = await api.saveSheet(7, { version: 1, data: { pv: 7 } });

    const [url, init] = fetchImpl.mock.calls[0] ;
    expect(url).toBe("https://api.test/character-sheets/7");
    expect(init.method).toBe(CASES.salvar.request.method);
    expect(JSON.parse(init.body as string)).toEqual(CASES.salvar.request.body);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer passe");
    expect(saved.version).toBe(2);
  });

  it("manter a deste aparelho manda force", async () => {
    const fetchImpl = vi.fn<ApiClientDeps["fetch"]>(async () => responseFor(CASES.manter_deste_aparelho));
    const { api } = client(fetchImpl);
    await api.saveSheet(7, { version: 1, data: { pv: 3 }, force: true });
    const init = fetchImpl.mock.calls[0][1] ;
    expect(JSON.parse(init.body as string)).toEqual(CASES.manter_deste_aparelho.request.body);
  });

  it("versão velha vira ConflictError com a versão atual e o request_id", async () => {
    const { api } = client(async () => responseFor(CASES.salvar_versao_velha, "req-409"));
    const err = await api.saveSheet(7, { version: 1, data: {} }).catch((e) => e);
    expect(err).toBeInstanceOf(ConflictError);
    expect(err.currentVersion).toBe(2);
    expect(err.requestId).toBe("req-409");
  });

  it.each([
    ["fora_da_mesa", NotInvitedError],
    ["ficha_grande_demais", TooLargeError],
    ["ficha_de_outra_pessoa", NotFoundError],
  ] as const)("%s vira o erro certo", async (name, ErrorClass) => {
    const { api } = client(async () => responseFor(CASES[name]));
    const err = await api.request<never>("/x").catch((e: ApiError) => e);
    expect(err).toBeInstanceOf(ErrorClass);
    expect(err.message).toBe("mensagem pro jogador");
  });

  it("fichas da mesa: o caminho do contrato, e jogador comum leva 403 forbidden", async () => {
    const fetchImpl = vi.fn<ApiClientDeps["fetch"]>(async () => responseFor(CASES.mesa_so_admin));
    const { api } = client(fetchImpl);
    const err = await api.listTableSheets().catch((e) => e);
    expect(fetchImpl.mock.calls[0][0]).toBe("https://api.test" + CASES.fichas_da_mesa.request.path);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).not.toBeInstanceOf(NotInvitedError);
    expect(err.code).toBe("forbidden");
  });

  it("sugestões do mestre: criar manda o texto, jogador leva 403, marcar vistas é 204", async () => {
    const queue = [responseFor(CASES.mestre_sugere), responseFor(CASES.jogador_nao_sugere), responseFor(CASES.sugestoes_vistas)];
    const fetchImpl = vi.fn<ApiClientDeps["fetch"]>(async () => queue.shift()!);
    const { api } = client(fetchImpl);
    const note = await api.createNote(1, CASES.mestre_sugere.request.body!.text as string);
    expect(note.seen_at).toBeNull();
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body as string)).toEqual(CASES.mestre_sugere.request.body);
    const denied = await api.createNote(1, "Oi").catch((e) => e);
    expect(denied.code).toBe("forbidden");
    await expect(api.markNotesSeen()).resolves.toBeUndefined();
    expect(fetchImpl.mock.calls[2][0]).toBe("https://api.test" + CASES.sugestoes_vistas.request.path);
  });

  it("o mestre abrindo a ficha de um jogador vem com mine: false", async () => {
    const { api } = client(async () => responseFor(CASES.mestre_abre_ficha));
    expect((await api.getSheet(1)).mine).toBe(false);
  });
});

describe("passe de login", () => {
  it("sem ninguém logado não chama a API", async () => {
    const fetchImpl = vi.fn<ApiClientDeps["fetch"]>();
    const api = createApiClient({ baseUrl: "https://api.test", fetch: fetchImpl, getToken: async () => null });
    await expect(api.listSheets()).rejects.toBeInstanceOf(SessionExpiredError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("401 pede passe novo uma vez e tenta de novo", async () => {
    const queue = [responseFor(CASES.sem_token), responseFor(CASES.lista_vazia)];
    const fetchImpl = vi.fn<ApiClientDeps["fetch"]>(async () => queue.shift()!);
    const { api, getToken } = client(fetchImpl);
    await expect(api.listSheets()).resolves.toEqual([]);
    expect(getToken).toHaveBeenLastCalledWith(true);
    const retry = fetchImpl.mock.calls[1][1] ;
    expect((retry.headers as Record<string, string>).Authorization).toBe("Bearer passe-novo");
  });

  it("401 de novo depois de renovar vira SessionExpiredError", async () => {
    const fetchImpl = vi.fn<ApiClientDeps["fetch"]>(async () => responseFor(CASES.sem_token));
    const { api } = client(fetchImpl);
    await expect(api.listSheets()).rejects.toBeInstanceOf(SessionExpiredError);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("a saúde do servidor não precisa de login", async () => {
    const fetchImpl = vi.fn<ApiClientDeps["fetch"]>(async () => responseFor(CASES.servidor_acordado));
    const api = createApiClient({ baseUrl: "https://api.test", fetch: fetchImpl, getToken: async () => null });
    await expect(api.health()).resolves.toEqual({ status: "ok" });
  });
});

describe("servidor dormindo", () => {
  it("tenta de novo com espera crescente e avisa que está acordando", async () => {
    const queue: (Response | Error)[] = [new TypeError("failed to fetch"), new Response("", { status: 503 }), responseFor(CASES.lista_vazia)];
    const onWaking = vi.fn();
    const { api, sleep } = client(
      async () => {
        const next = queue.shift()!;
        if (next instanceof Error) throw next;
        return next;
      },
      { onWaking },
    );
    await expect(api.listSheets()).resolves.toEqual([]);
    expect(onWaking).toHaveBeenCalledTimes(1);
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([1000, 2000]);
  });

  it("desiste depois do limite com OfflineError", async () => {
    const { api } = client(async () => new Response("", { status: 503 }), { waitLimitMs: 10_000 });
    await expect(api.listSheets()).rejects.toBeInstanceOf(OfflineError);
  });

  it("500 é erro de verdade, não tenta de novo", async () => {
    const fetchImpl = vi.fn<ApiClientDeps["fetch"]>(async () => new Response(JSON.stringify({ detail: { code: "internal", message: "Erro interno" } }), { status: 500 }));
    const { api } = client(fetchImpl);
    const err = await api.listSheets().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("internal");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("sem endereço configurado não tenta a rede", async () => {
    const fetchImpl = vi.fn<ApiClientDeps["fetch"]>();
    const api = createApiClient({ baseUrl: "", fetch: fetchImpl, getToken: async () => "passe" });
    await expect(api.listSheets()).rejects.toBeInstanceOf(OfflineError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
