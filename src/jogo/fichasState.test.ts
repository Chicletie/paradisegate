import { describe, expect, it } from "vitest";
import { fingerprint } from "../ficha-sync/keys";
import { ApiError, NotInvitedError, OfflineError, SessionExpiredError, type Me, type SheetSummary } from "./apiClient";
import {
  errorText,
  fichasView,
  inviteErrorText,
  legacySheet,
  parseImportFile,
  seedDrawer,
  sheetHref,
  updatedText,
  type FichasInput,
} from "./fichasState";

const ME: Me = { id: 1, username: "ania", email: "ania@x.test", role: "player", features: { fichas: true, mesa: false } };
const S1: SheetSummary = { id: 1, nome: "Luke", prestigio_atual: 0, version: 2, updated_at: "2026-09-20T10:00:00Z" };
const S2: SheetSummary = { id: 2, nome: "Ânia", prestigio_atual: 0, version: 5, updated_at: "2026-09-25T10:00:00Z" };

const base: FichasInput = { ready: true, signedIn: true, waking: false, error: null, me: null, sheets: null };

describe("os estados das fichas", () => {
  it("antes do login responder, nem entrar nem lista", () => {
    expect(fichasView({ ...base, ready: false }).kind).toBe("connecting");
  });
  it("sem login", () => {
    expect(fichasView({ ...base, signedIn: false }).kind).toBe("signed_out");
  });
  it("conectando, e avisa quando o servidor está acordando", () => {
    expect(fichasView(base)).toEqual({ kind: "connecting", waking: false });
    expect(fichasView({ ...base, waking: true })).toEqual({ kind: "connecting", waking: true });
  });
  it("vazio", () => {
    expect(fichasView({ ...base, me: ME, sheets: [] }).kind).toBe("empty");
  });
  it("lista na ordem que a API mandou (a tela não reordena)", () => {
    const v = fichasView({ ...base, me: ME, sheets: [S1, S2] });
    expect(v.kind === "list" && v.sheets.map((s) => s.id)).toEqual([1, 2]);
  });
  it("sem convite", () => {
    expect(fichasView({ ...base, error: new NotInvitedError(403, { code: "not_invited" }, null) }).kind).toBe("not_invited");
  });
  it("erro de rede: frase simples e tentar de novo", () => {
    const v = fichasView({ ...base, error: new OfflineError(0, { code: "offline" }, "req-1") });
    expect(v).toMatchObject({ kind: "error", retry: true, signIn: false });
    expect(v.kind === "error" && v.message).not.toMatch(/req-1|offline|503/);
  });
  it("sessão vencida: pede pra entrar, não tentar de novo", () => {
    expect(fichasView({ ...base, error: new SessionExpiredError(401, { code: "token_expired" }, null) })).toMatchObject({ kind: "error", retry: false, signIn: true });
  });
});

describe("mensagens de erro", () => {
  it("erro de regra mostra a frase da própria API", () => {
    expect(errorText(new ApiError(422, { code: "not_a_sheet", message: "Esse arquivo não parece uma ficha." }, null))).toBe("Esse arquivo não parece uma ficha.");
    expect(errorText(new ApiError(403, { code: "fichas_fechadas", message: "As fichas ainda não estão abertas pra mesa" }, null))).toMatch(/não estão abertas/);
  });
  it("erro do servidor (5xx) não mostra detalhe técnico", () => {
    expect(errorText(new ApiError(500, { code: "internal", message: "Erro interno" }, null))).toMatch(/Tente de novo/);
  });
  it("convite: a frase da API; formato de e-mail recusado ganha a da tela", () => {
    expect(inviteErrorText(new ApiError(409, { code: "invite_exists", message: "Esse e-mail já foi convidado" }, null))).toBe("Esse e-mail já foi convidado");
    expect(inviteErrorText(new ApiError(422, {}, null))).toMatch(/Confira o e-mail/);
  });
});

describe("arquivo e ficha antiga do navegador", () => {
  it("o arquivo só precisa abrir como objeto .json; se é ficha, a API diz", () => {
    expect(parseImportFile('{"outra":1}')).toEqual({ outra: 1 });
    for (const bad of ["{quebrado", "[1]", "null"]) expect(parseImportFile(bad), bad).toBeNull();
  });
  const raw = JSON.stringify({ campos: { nome: "Luke" } });
  it("oferece trazer pra conta a ficha guardada só neste navegador", () => {
    expect(legacySheet(raw, null)).toEqual({ data: { campos: { nome: "Luke" } }, print: fingerprint({ campos: { nome: "Luke" } }) });
  });
  it("não oferece de novo depois de trazer, nem gaveta vazia ou quebrada", () => {
    expect(legacySheet(raw, fingerprint({ campos: { nome: "Luke" } }))).toBeNull();
    expect(legacySheet(null, null)).toBeNull();
    expect(legacySheet("{}", null)).toBeNull();
    expect(legacySheet("{quebrado", null)).toBeNull();
  });
});

describe("abrir e criar", () => {
  it("link da ficha é a página da ficha com o id", () => {
    expect(sheetHref(31)).toBe("/fichas.html?sheet=31");
  });
  it("ficha criada já abre com a gaveta cheia, sem baixar de novo", () => {
    const seed = seedDrawer(31, 1, { campos: { nome: "Luke" } });
    expect(seed["fichaPG_save_v1:31"]).toBe('{"campos":{"nome":"Luke"}}');
    expect(seed["pg_version:31"]).toBe("1");
    expect(seed["pg_synced:31"]).toBe(fingerprint({ campos: { nome: "Luke" } }));
  });
  it("data da última mudança no fuso de quem vê", () => {
    expect(updatedText("2026-09-25T17:32:00Z", "America/Sao_Paulo")).toMatch(/^atualizada em 25 de set\.?,? 14:32$/);
    expect(updatedText("não é data")).toBe("");
  });
});
