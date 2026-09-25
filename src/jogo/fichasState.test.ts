import { describe, expect, it } from "vitest";
import { fingerprint } from "../ficha-sync/keys";
import { ApiError, NotInvitedError, OfflineError, SessionExpiredError, type Me, type SheetSummary } from "./apiClient";
import {
  fichasView,
  inviteErrorText,
  legacySheet,
  normalizeInviteEmail,
  readImport,
  seedDrawer,
  sheetHref,
  updatedText,
  type FichasInput,
} from "./fichasState";

const ME: Me = { id: 1, username: "ania", email: "ania@x.test", role: "player" };
const S1: SheetSummary = { id: 1, nome: "Luke", prestigio_atual: 0, version: 2, updated_at: "2026-09-20T10:00:00Z" };
const S2: SheetSummary = { id: 2, nome: "Ânia", prestigio_atual: 0, version: 5, updated_at: "2026-09-25T10:00:00Z" };

const base: FichasInput = { ready: true, signedIn: true, waking: false, error: null, me: null, sheets: null };

describe("os estados de Minhas Fichas", () => {
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
  it("lista, a mais recente em cima", () => {
    const v = fichasView({ ...base, me: ME, sheets: [S1, S2] });
    expect(v.kind === "list" && v.sheets.map((s) => s.id)).toEqual([2, 1]);
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

describe("importar .json", () => {
  it("ficha exportada vira nome + dados", () => {
    const r = readImport(JSON.stringify({ campos: { nome: " Luke " }, raList: [] }), 100);
    expect(r).toEqual({ ok: true, sheet: { nome: "Luke", data: { campos: { nome: " Luke " }, raList: [] } } });
  });
  it("sem nome vira Personagem sem nome; nome longo é cortado em 150", () => {
    expect(readImport('{"campos":{}}', 10)).toMatchObject({ ok: true, sheet: { nome: "Personagem sem nome" } });
    const long = readImport(JSON.stringify({ campos: { nome: "x".repeat(300) } }), 400);
    expect(long.ok && long.sheet.nome.length).toBe(150);
  });
  it("recusa o que não é ficha e o que passa de 1 MB", () => {
    for (const bad of ["{quebrado", "[1]", '{"outra":1}', '{"campos":"x"}']) expect(readImport(bad, 10).ok, bad).toBe(false);
    expect(readImport('{"campos":{}}', 1_000_001).ok).toBe(false);
  });
});

describe("ficha antiga deste navegador", () => {
  const raw = JSON.stringify({ campos: { nome: "Luke" } });
  it("oferece trazer pra conta", () => {
    expect(legacySheet(raw, null)).toMatchObject({ nome: "Luke" });
  });
  it("não oferece de novo depois de trazer, nem se não for ficha", () => {
    expect(legacySheet(raw, fingerprint({ campos: { nome: "Luke" } }))).toBeNull();
    expect(legacySheet(null, null)).toBeNull();
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

describe("convites", () => {
  it("e-mail sem espaço e minúsculo", () => {
    expect(normalizeInviteEmail("  Fulano@Email.COM ")).toBe("fulano@email.com");
    for (const bad of ["", "fulano", "a@b", "a b@c.com", "a@@b.com"]) expect(normalizeInviteEmail(bad), bad).toBeNull();
  });
  it("repetido e inválido com o texto certo", () => {
    expect(inviteErrorText(new ApiError(409, { code: "invite_exists" }, null))).toMatch(/já está convidado/);
    expect(inviteErrorText(new ApiError(422, {}, null))).toMatch(/Confira o e-mail/);
  });
});
