import { fingerprint, isEmptySheet, parseDrawer, sheetKeys } from "../ficha-sync/keys";
import { ApiError, NotInvitedError, OfflineError, SessionExpiredError, type Me, type SheetSummary } from "./apiClient";

/*
 * O estado da tela de fichas, sem DOM (testado no node, fichasState.test.ts). Regra de negócio
 * não mora aqui: nome, ordem, quem vê o quê e as mensagens de erro de regra vêm prontos da API
 * (pg-backend). Aqui fica só o que é da tela e do navegador: qual estado desenhar, ler o arquivo,
 * a gaveta da ficha neste aparelho, datas no fuso de quem vê.
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
    const expired = input.error instanceof SessionExpiredError;
    return { kind: "error", message: errorText(input.error), retry: !expired, signIn: expired };
  }
  if (!input.me || !input.sheets) return { kind: "connecting", waking: input.waking };
  if (input.sheets.length === 0) return { kind: "empty", me: input.me };
  // A ordem é a da API (a mais recente em cima).
  return { kind: "list", me: input.me, sheets: input.sheets };
}

/**
 * Frase pro jogador, nunca o detalhe técnico. Erro de regra (4xx) traz a mensagem da própria API;
 * aqui só os casos de conexão e sessão, que a API não tem como explicar.
 */
export function errorText(error: unknown): string {
  if (error instanceof SessionExpiredError) return "Sua sessão expirou. Entre de novo pra ver suas fichas.";
  if (error instanceof OfflineError) {
    if (error.code === "not_configured") return "A conta do jogo ainda não está ligada neste endereço.";
    return "Não consegui falar com a conta agora. O que está em cada ficha continua salvo no aparelho.";
  }
  if (error instanceof ApiError && error.status >= 400 && error.status < 500 && typeof error.detail.message === "string") {
    return error.detail.message;
  }
  return "Não deu certo agora. Tente de novo em instantes.";
}

/** O conteúdo de um arquivo escolhido: um objeto JSON, ou `null` se nem abre como .json. Se é
 * mesmo uma ficha, quem confere é a API (POST /character-sheets/import). */
export function parseImportFile(text: string): Record<string, unknown> | null {
  return parseDrawer(text);
}

/** A gaveta da ficha antiga (sem conta) deste navegador. */
export const LEGACY_DRAWER = "fichaPG_save_v1";
/** Impressão da ficha antiga que já subiu (ou que o jogador dispensou), pra não oferecer de novo. */
export const LEGACY_DONE = "pg_legacy_done";

/** Ficha guardada só neste navegador que ainda não subiu pra conta, ou `null`. */
export function legacySheet(raw: string | null, done: string | null): { data: Record<string, unknown>; print: string } | null {
  if (!raw) return null;
  const data = parseDrawer(raw);
  if (!data || isEmptySheet(data)) return null;
  const print = fingerprint(data);
  if (print === done) return null;
  return { data, print };
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

export function sheetHref(id: number): string {
  return `/fichas.html?sheet=${encodeURIComponent(String(id))}`;
}

/** "25 de set., 14:32" no fuso de quem está vendo ("" se não for data). */
export function noteDate(iso: string, timeZone?: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone }).format(t);
}

/** "atualizada em 25 de set., 14:32" no fuso de quem está vendo. */
export function updatedText(iso: string, timeZone?: string): string {
  const when = noteDate(iso, timeZone);
  return when ? "atualizada em " + when : "";
}

/** Convite recusado: o 422 do formato do e-mail vem da validação da API sem frase; o resto traz a dela. */
export function inviteErrorText(error: unknown): string {
  if (error instanceof ApiError && error.status === 422 && typeof error.detail.message !== "string") {
    return "Confira o e-mail: ele não parece válido.";
  }
  return errorText(error);
}
