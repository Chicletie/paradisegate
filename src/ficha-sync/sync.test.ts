import { describe, expect, it, vi } from "vitest";
import contract from "../jogo/contract/ficha-sync.json";
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
  type Sheet,
} from "../jogo/apiClient";
import { fingerprint, sheetKeys } from "./keys";
import { createSheetSync, type KeyValue, type SheetSyncDeps, type StatusKind } from "./sync";

const ID = 12;
const K = sheetKeys(ID);

function memory(initial: Record<string, string> = {}): KeyValue & { map: Map<string, string> } {
  const map = new Map(Object.entries(initial));
  return {
    map,
    get: (k) => map.get(k) ?? null,
    set: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k),
  };
}

function sheet(version: number, data: Record<string, unknown>): Sheet {
  return { id: ID, nome: "Ânia", prestigio_atual: 0, version, updated_at: "2026-09-25T12:00:00Z", data };
}

const A = { campos: { nome: "Ânia", pv: "10" } };
const B = { campos: { nome: "Ânia", pv: "7" } };
const C = { campos: { nome: "Ânia", pv: "3" } };

/** Aparelho que já conhece a ficha na versão `v` com o conteúdo `data`. */
function known(v: number, data: Record<string, unknown>, drawer: Record<string, unknown> | null = data) {
  const out: Record<string, string> = { [K.version]: String(v), [K.synced]: fingerprint(data) };
  if (drawer) out[K.drawer] = JSON.stringify(drawer);
  return out;
}

function setup(opts: { local?: Record<string, string>; session?: Record<string, string>; api?: Partial<SheetSyncDeps["api"]> } = {}) {
  const local = memory(opts.local);
  const session = memory(opts.session);
  const statuses: StatusKind[] = [];
  const reload = vi.fn();
  const onConflict = vi.fn();
  const getSheet = vi.fn<SheetSyncDeps["api"]["getSheet"]>(async () => sheet(1, A));
  const saveSheet = vi.fn<SheetSyncDeps["api"]["saveSheet"]>(async (_id, save) => sheet(save.version + 1, save.data));
  const api = { getSheet, saveSheet, ...opts.api };
  const sync = createSheetSync({ sheetId: ID, local, session, api, reload, onConflict, onStatus: (s) => void statuses.push(s.kind) });
  return { sync, local, session, statuses, reload, onConflict, api };
}

const offline = () => new OfflineError(0, { code: "offline" }, null);

describe("abrir a ficha", () => {
  it("aparelho novo: grava a ficha da conta na gaveta e recarrega uma vez", async () => {
    const t = setup({ api: { getSheet: vi.fn(async () => sheet(3, A)) } });
    await t.sync.boot();
    expect(JSON.parse(t.local.get(K.drawer)!)).toEqual(A);
    expect(t.local.get(K.version)).toBe("3");
    expect(t.session.get(K.adopt)).toBe(t.local.get(K.drawer));
    expect(t.reload).toHaveBeenCalledTimes(1);
    expect(t.api.saveSheet).not.toHaveBeenCalled();
  });

  it("depois da recarga, a gaveta igual à conta fica salva e a trava de recarga zera", async () => {
    const raw = JSON.stringify(A);
    const t = setup({
      local: { ...known(3, A), [K.drawer]: raw },
      session: { [K.adopt]: raw, [K.reload]: "1" },
      api: { getSheet: vi.fn(async () => sheet(3, A)) },
    });
    await t.sync.boot();
    expect(t.reload).not.toHaveBeenCalled();
    expect(t.session.get(K.reload)).toBeNull();
    expect(t.statuses.at(-1)).toBe("saved");
  });

  it("se a ficha gravou por cima ao fechar, grava de novo; na terceira vez desiste sem ciclo", async () => {
    const raw = JSON.stringify(A);
    const t = setup({ local: { [K.drawer]: JSON.stringify(B) }, session: { [K.adopt]: raw, [K.reload]: "1" } });
    await t.sync.boot();
    expect(t.local.get(K.drawer)).toBe(raw);
    expect(t.reload).toHaveBeenCalledTimes(1);

    const again = setup({ local: { [K.drawer]: JSON.stringify(B) }, session: { [K.adopt]: raw, [K.reload]: "2" } });
    await again.sync.boot();
    expect(again.reload).not.toHaveBeenCalled();
    expect(again.statuses.at(-1)).toBe("open_failed");
    expect(again.api.getSheet).not.toHaveBeenCalled();
  });

  it('"Zerar ficha": gaveta vazia num aparelho que já teve a ficha não traz a antiga de volta', async () => {
    const t = setup({ local: known(2, A, null), api: { getSheet: vi.fn(async () => sheet(2, A)) } });
    await t.sync.boot();
    expect(t.local.get(K.drawer)).toBeNull();
    expect(t.reload).not.toHaveBeenCalled();
    // A ficha nova sobe quando o jogador começa a preencher.
    t.local.set(K.drawer, JSON.stringify(C));
    await t.sync.tick();
    expect(t.api.saveSheet).toHaveBeenCalledWith(ID, expect.objectContaining({ version: 2, data: C }), expect.anything());
  });

  it("ficha nova e vazia na conta num aparelho novo: não recarrega à toa", async () => {
    const t = setup({ api: { getSheet: vi.fn(async () => sheet(1, {})) } });
    await t.sync.boot();
    expect(t.reload).not.toHaveBeenCalled();
    expect(t.local.get(K.version)).toBe("1");
  });

  it("igual à conta, mesmo com as chaves em outra ordem: não envia nada", async () => {
    const reordered = { campos: { pv: "10", nome: "Ânia" } };
    const t = setup({ local: { [K.drawer]: JSON.stringify(reordered) }, api: { getSheet: vi.fn(async () => sheet(4, A)) } });
    await t.sync.boot();
    await t.sync.tick();
    expect(t.api.saveSheet).not.toHaveBeenCalled();
    expect(t.local.get(K.version)).toBe("4");
  });

  it("mudou só neste aparelho (fechou antes de subir): sobe com a versão que conhece", async () => {
    const t = setup({ local: known(2, A, B), api: { getSheet: vi.fn(async () => sheet(2, A)) } });
    await t.sync.boot();
    expect(t.api.saveSheet).toHaveBeenCalledWith(ID, expect.objectContaining({ version: 2, data: B }), expect.anything());
    expect(t.local.get(K.version)).toBe("3");
    expect(t.local.get(K.synced)).toBe(fingerprint(B));
  });

  it("mudou só na conta (jogou em outro aparelho): abre a da conta", async () => {
    const t = setup({ local: known(2, A), api: { getSheet: vi.fn(async () => sheet(5, B)) } });
    await t.sync.boot();
    expect(JSON.parse(t.local.get(K.drawer)!)).toEqual(B);
    expect(t.reload).toHaveBeenCalledTimes(1);
    expect(t.api.saveSheet).not.toHaveBeenCalled();
  });

  it("personagem importado numa ficha nova da conta: sobe o do aparelho", async () => {
    const t = setup({ local: { [K.drawer]: JSON.stringify(B) }, api: { getSheet: vi.fn(async () => sheet(1, {})) } });
    await t.sync.boot();
    expect(t.api.saveSheet).toHaveBeenCalledWith(ID, expect.objectContaining({ version: 1, data: B }), expect.anything());
  });
});

describe("conflito", () => {
  it("mudou nos dois: mostra a escolha e não envia sozinho", async () => {
    const t = setup({ local: known(2, A, B), api: { getSheet: vi.fn(async () => sheet(5, C)) } });
    await t.sync.boot();
    expect(t.onConflict).toHaveBeenCalledTimes(1);
    expect(t.statuses.at(-1)).toBe("conflict");
    await t.sync.tick();
    t.sync.flush();
    expect(t.api.saveSheet).not.toHaveBeenCalled();
    expect(t.reload).not.toHaveBeenCalled();
  });

  it('"Carregar a da conta" abre a da conta', async () => {
    const t = setup({ local: known(2, A, B), api: { getSheet: vi.fn(async () => sheet(5, C)) } });
    await t.sync.boot();
    await t.sync.resolveConflict("remote");
    expect(JSON.parse(t.local.get(K.drawer)!)).toEqual(C);
    expect(t.local.get(K.version)).toBe("5");
    expect(t.reload).toHaveBeenCalledTimes(1);
  });

  it('"Manter a deste aparelho" envia forçado e depois segue normal', async () => {
    const t = setup({ local: known(2, A, B), api: { getSheet: vi.fn(async () => sheet(5, C)) } });
    await t.sync.boot();
    await t.sync.resolveConflict("local");
    expect(t.api.saveSheet).toHaveBeenLastCalledWith(ID, expect.objectContaining({ data: B, force: true }), expect.anything());
    expect(t.local.get(K.version)).toBe("6");
    t.local.set(K.drawer, JSON.stringify(A));
    await t.sync.tick();
    expect(t.api.saveSheet).toHaveBeenLastCalledWith(ID, expect.objectContaining({ version: 6, data: A }), expect.anything());
  });

  it("409 no meio do jogo (outro aparelho salvou): vira conflito", async () => {
    const saveSheet = vi.fn(async () => {
      throw new ConflictError(409, { code: "sheet_conflict", current_version: 3 }, null);
    });
    const getSheet = vi.fn().mockResolvedValueOnce(sheet(2, A)).mockResolvedValueOnce(sheet(3, C));
    const t = setup({ local: known(2, A), api: { getSheet, saveSheet } });
    await t.sync.boot();
    t.local.set(K.drawer, JSON.stringify(B));
    await t.sync.tick();
    expect(t.onConflict).toHaveBeenCalledTimes(1);
    expect(t.sync.phase).toBe("conflict");
  });

  it("com a resposta 409 do contrato, pelo cliente de verdade", async () => {
    const conflictCase = contract.cases.find((c) => c.name === "salvar_versao_velha")!;
    const currentVersion = Number(conflictCase.response.detail_subset?.current_version);
    const detail = { code: conflictCase.response.detail_code, current_version: currentVersion };
    let gets = 0;
    const fetchImpl = vi.fn<ApiClientDeps["fetch"]>(async (_url, init) => {
      if (init.method === "PUT") return new Response(JSON.stringify({ detail }), { status: 409 });
      gets += 1;
      const current = gets === 1 ? sheet(1, A) : sheet(currentVersion, C);
      return new Response(JSON.stringify(current), { status: 200 });
    });
    const api = createApiClient({ baseUrl: "https://api.test", fetch: fetchImpl, getToken: async () => "passe" });
    const t = setup({ local: known(1, A), api });
    await t.sync.boot();
    t.local.set(K.drawer, JSON.stringify(B));
    await t.sync.tick();
    expect(t.statuses.at(-1)).toBe("conflict");
    expect(t.sync.phase).toBe("conflict");
  });
});

describe("salvar durante o jogo", () => {
  it("só envia quando a gaveta muda, e uma vez por mudança", async () => {
    const t = setup({ local: known(1, A) });
    await t.sync.boot();
    await t.sync.tick();
    expect(t.api.saveSheet).not.toHaveBeenCalled();
    t.local.set(K.drawer, JSON.stringify(B));
    await t.sync.tick();
    await t.sync.tick();
    expect(t.api.saveSheet).toHaveBeenCalledTimes(1);
    expect(t.statuses.at(-1)).toBe("saved");
  });

  it("manda o nome do personagem pra lista Minhas Fichas", async () => {
    const t = setup({ local: known(1, A) });
    await t.sync.boot();
    t.local.set(K.drawer, JSON.stringify({ campos: { nome: " Luke ", pv: "1" } }));
    await t.sync.tick();
    expect(t.api.saveSheet).toHaveBeenCalledWith(ID, expect.objectContaining({ nome: "Luke" }), expect.anything());
  });

  it("sem rede: fica pendente neste aparelho e tenta de novo", async () => {
    const saveSheet = vi.fn<SheetSyncDeps["api"]["saveSheet"]>().mockRejectedValueOnce(offline()).mockImplementation(async (_i, s) => sheet(s.version + 1, s.data));
    const t = setup({ local: known(1, A), api: { saveSheet } });
    await t.sync.boot();
    t.local.set(K.drawer, JSON.stringify(B));
    await t.sync.tick();
    expect(t.statuses.at(-1)).toBe("pending");
    expect(t.local.get(K.synced)).toBe(fingerprint(A));
    await t.sync.tick();
    expect(saveSheet).toHaveBeenCalledTimes(2);
    expect(t.statuses.at(-1)).toBe("saved");
  });

  it("gaveta com JSON quebrado: avisa e não envia", async () => {
    const t = setup({ local: known(1, A) });
    await t.sync.boot();
    t.local.set(K.drawer, "{quebrado");
    await t.sync.tick();
    expect(t.api.saveSheet).not.toHaveBeenCalled();
    expect(t.statuses.at(-1)).toBe("local_error");
  });

  it("grande demais: não insiste no mesmo conteúdo, tenta de novo depois de mudar", async () => {
    const saveSheet = vi.fn<SheetSyncDeps["api"]["saveSheet"]>().mockRejectedValueOnce(new TooLargeError(413, { code: "too_large" }, null)).mockImplementation(async (_i, s) => sheet(s.version + 1, s.data));
    const t = setup({ local: known(1, A), api: { saveSheet } });
    await t.sync.boot();
    t.local.set(K.drawer, JSON.stringify(B));
    await t.sync.tick();
    await t.sync.tick();
    expect(saveSheet).toHaveBeenCalledTimes(1);
    expect(t.statuses.at(-1)).toBe("too_large");
    t.local.set(K.drawer, JSON.stringify(C));
    await t.sync.tick();
    expect(saveSheet).toHaveBeenCalledTimes(2);
  });

  it("outro erro da API (ex. 422): não insiste no mesmo conteúdo", async () => {
    const saveSheet = vi.fn<SheetSyncDeps["api"]["saveSheet"]>().mockRejectedValue(new ApiError(422, { code: "invalid" }, null));
    const t = setup({ local: known(1, A), api: { saveSheet } });
    await t.sync.boot();
    t.local.set(K.drawer, JSON.stringify(B));
    await t.sync.tick();
    await t.sync.tick();
    expect(saveSheet).toHaveBeenCalledTimes(1);
    expect(t.statuses.at(-1)).toBe("error");
  });
});

describe("ao esconder a aba", () => {
  it("envia com keepalive quando cabe", async () => {
    const t = setup({ local: known(1, A) });
    await t.sync.boot();
    t.local.set(K.drawer, JSON.stringify(B));
    t.sync.flush();
    await vi.waitFor(() => expect(t.api.saveSheet).toHaveBeenCalled());
    expect(t.api.saveSheet).toHaveBeenCalledWith(ID, expect.anything(), { keepalive: true });
  });

  it("acima de 60 KB vai sem keepalive (senão some calado) e continua pendente se não chegar", async () => {
    const saveSheet = vi.fn<SheetSyncDeps["api"]["saveSheet"]>(() => new Promise(() => {}));
    const t = setup({ local: known(1, A), api: { saveSheet } });
    await t.sync.boot();
    t.local.set(K.drawer, JSON.stringify({ campos: { nome: "Ânia", notas: "x".repeat(70_000) } }));
    t.sync.flush();
    expect(saveSheet).toHaveBeenCalledWith(ID, expect.anything(), { keepalive: false });
    expect(t.local.get(K.synced)).toBe(fingerprint(A));
  });
});

describe("conta e conexão", () => {
  it("ninguém logado: avisa e tenta abrir de novo sozinho", async () => {
    const getSheet = vi.fn<SheetSyncDeps["api"]["getSheet"]>().mockRejectedValueOnce(new SessionExpiredError(401, { code: "missing_token" }, null)).mockResolvedValue(sheet(1, A));
    const t = setup({ local: known(1, A), api: { getSheet } });
    await t.sync.boot();
    expect(t.statuses.at(-1)).toBe("signed_out");
    await t.sync.tick();
    expect(getSheet).toHaveBeenCalledTimes(2);
    expect(t.statuses.at(-1)).toBe("saved");
  });

  it("servidor dormindo ao abrir: pendente, e abre na próxima tentativa", async () => {
    const getSheet = vi.fn<SheetSyncDeps["api"]["getSheet"]>().mockRejectedValueOnce(offline()).mockResolvedValue(sheet(1, A));
    const t = setup({ local: known(1, A), api: { getSheet } });
    await t.sync.boot();
    expect(t.statuses).toEqual(["connecting", "pending"]);
    await t.sync.tick();
    expect(t.statuses.at(-1)).toBe("saved");
  });

  it("sessão vencida mesmo depois de renovar: para até entrar de novo", async () => {
    const t = setup({ local: known(1, A), api: { getSheet: vi.fn(async () => { throw new SessionExpiredError(401, { code: "token_expired" }, null); }) } });
    await t.sync.boot();
    await t.sync.tick();
    expect(t.statuses.at(-1)).toBe("expired");
    expect(t.api.getSheet).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["not_invited", new NotInvitedError(403, { code: "not_invited" }, null)],
    ["not_found", new NotFoundError(404, { code: "not_found" }, null)],
    ["unavailable", new OfflineError(0, { code: "not_configured" }, null)],
  ] as const)("%s: para e não tenta de novo", async (kind, error) => {
    const t = setup({ local: known(1, A), api: { getSheet: vi.fn(async () => { throw error; }) } });
    await t.sync.boot();
    t.local.set(K.drawer, JSON.stringify(B));
    await t.sync.tick();
    t.sync.flush();
    expect(t.statuses.at(-1)).toBe(kind);
    expect(t.api.getSheet).toHaveBeenCalledTimes(1);
    expect(t.api.saveSheet).not.toHaveBeenCalled();
  });
});
