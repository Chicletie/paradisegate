import { characterName, fingerprint, parseDrawer, sheetKeys } from "../ficha-sync/keys";
import {
  ApiError,
  NotFoundError,
  NotInvitedError,
  OfflineError,
  SessionExpiredError,
  type Me,
  type SheetOwner,
  type SheetSummary,
} from "./apiClient";

/*
 * O que a página Minhas Fichas mostra, sem DOM (testado no node, fichasState.test.ts). A página
 * (Fichas.tsx) só desenha o estado que sai daqui.
 */

export type FichasView =
  | { kind: "signed_out" }
  | { kind: "connecting"; waking: boolean }
  | { kind: "not_invited" }
  | { kind: "error"; message: string; retry: boolean; signIn: boolean }
  | { kind: "empty"; me: Me }
  | { kind: "list"; me: Me; sheets: SheetSummary[] };

export type FichasInput = {
  /** O login do site já respondeu (antes disso, nem "entrar" nem a lista). */
  ready: boolean;
  signedIn: boolean;
  waking: boolean;
  error: unknown;
  me: Me | null;
  sheets: SheetSummary[] | null;
};

export function fichasView(input: FichasInput): FichasView {
  if (!input.ready) return { kind: "connecting", waking: false };
  if (!input.signedIn) return { kind: "signed_out" };
  if (input.error) {
    if (input.error instanceof NotInvitedError) return { kind: "not_invited" };
    return { kind: "error", message: errorText(input.error), retry: !(input.error instanceof SessionExpiredError), signIn: input.error instanceof SessionExpiredError };
  }
  if (!input.me || !input.sheets) return { kind: "connecting", waking: input.waking };
  if (input.sheets.length === 0) return { kind: "empty", me: input.me };
  return { kind: "list", me: input.me, sheets: sortSheets(input.sheets) };
}

/** A mais recente em cima: é a que o jogador está usando. */
export function sortSheets(sheets: SheetSummary[]): SheetSummary[] {
  return [...sheets].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)) || b.id - a.id);
}

/** Frase pro jogador; o detalhe técnico nunca aparece na tela. */
export function errorText(error: unknown): string {
  if (error instanceof SessionExpiredError) return "Sua sessão expirou. Entre de novo pra ver suas fichas.";
  if (error instanceof NotInvitedError) return "Sua conta ainda não foi liberada pra mesa. Peça pro mestre te convidar.";
  if (error instanceof NotFoundError) return "Essa ficha não está mais na sua conta.";
  if (error instanceof OfflineError) {
    if (error.code === "not_configured") return "A conta do jogo ainda não está ligada neste endereço.";
    return "Não consegui falar com a conta agora. O que está em cada ficha continua salvo no aparelho.";
  }
  if (error instanceof ApiError && error.status === 413) return "Essa ficha é grande demais pra conta (o limite é 1 MB).";
  return "Não deu certo agora. Tente de novo em instantes.";
}

export const NO_NAME = "Personagem sem nome";
export const IMPORT_LIMIT = 1_000_000;

export type ImportedSheet = { nome: string; data: Record<string, unknown> };

/** Uma ficha exportada pela própria ficha (.json): objeto com `campos`. */
export function readImport(text: string, size: number): { ok: true; sheet: ImportedSheet } | { ok: false; message: string } {
  if (size > IMPORT_LIMIT) return { ok: false, message: "Esse arquivo passa de 1 MB, o limite da conta." };
  const data = parseDrawer(text);
  if (!data || !data.campos || typeof data.campos !== "object") {
    return { ok: false, message: "Esse arquivo não parece uma ficha. Use o .json do botão “Exportar ficha”." };
  }
  return { ok: true, sheet: { nome: characterName(data) ?? NO_NAME, data } };
}

/** A gaveta da ficha antiga (sem conta) deste navegador. */
export const LEGACY_DRAWER = "fichaPG_save_v1";
/** Impressão da ficha antiga que já subiu (ou que o jogador dispensou), pra não oferecer de novo. */
export const LEGACY_DONE = "pg_legacy_done";

/** Ficha deste navegador que ainda não está na conta, ou `null`. */
export function legacySheet(raw: string | null, done: string | null): (ImportedSheet & { print: string }) | null {
  if (!raw) return null;
  const read = readImport(raw, 0);
  if (!read.ok) return null;
  const print = fingerprint(read.sheet.data);
  if (print === done) return null;
  return { ...read.sheet, print };
}

/**
 * Chaves pra a ficha recém-criada abrir sem baixar de novo nem recarregar: a gaveta já com o
 * conteúdo, e o aparelho sabendo que é igual à versão da conta.
 */
export function seedDrawer(id: number, version: number, data: Record<string, unknown>): Record<string, string> {
  const k = sheetKeys(id);
  return { [k.drawer]: JSON.stringify(data), [k.version]: String(version), [k.synced]: fingerprint(data) };
}

/** Chaves deste aparelho de uma ficha que foi apagada da conta. */
export function drawerKeys(id: number): string[] {
  const k = sheetKeys(id);
  return [k.drawer, k.version, k.synced];
}

/** De quem é a ficha, pro mestre: "@username", ou o e-mail se a pessoa ainda não tem username. */
export function ownerLabel(owner: SheetOwner): string {
  return owner.username ? "@" + owner.username : owner.email;
}

export function sheetHref(id: number): string {
  return `/fichas.html?sheet=${encodeURIComponent(String(id))}`;
}

/** "atualizada em 25 de set., 14:32" no fuso de quem está vendo. */
export function updatedText(iso: string, timeZone?: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const when = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone }).format(t);
  return "atualizada em " + when;
}

/** E-mail de convite: sem espaço e minúsculo; a API confere de novo. */
export function normalizeInviteEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && email.length <= 254 ? email : null;
}

/** Erro de convite com o texto certo (repetido, e-mail inválido). */
export function inviteErrorText(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) return "Esse e-mail já está convidado.";
  if (error instanceof ApiError && error.status === 422) return "Confira o e-mail: ele não parece válido.";
  return errorText(error);
}
