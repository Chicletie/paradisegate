import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";
import { PgSectionHead } from "../components/PgIcons";
import { SignInButton } from "../components/AccountMenu";
import { useAccount } from "../lib/account";
import { usePgBody } from "../lib/usePgBody";
import { jogoApi } from "./api";
import type { ApiClient, Invite, Me, SheetSummary } from "./apiClient";
import {
  drawerKeys,
  errorText,
  fichasView,
  inviteErrorText,
  LEGACY_DONE,
  LEGACY_DRAWER,
  legacySheet,
  NO_NAME,
  normalizeInviteEmail,
  readImport,
  seedDrawer,
  sheetHref,
  updatedText,
  type ImportedSheet,
} from "./fichasState";

/*
 * Minhas Fichas (/jogo/fichas): as fichas do jogador na conta, criar, importar o .json e apagar.
 * Pra quem é admin, o painel Jogadores da mesa (convites). Mesma casca da página "Seu perfil".
 * A ficha abre em /fichas.html (outra página, fora do React): sempre <a>, nunca <Link>.
 */

const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* sem espaço: a ficha baixa da conta ao abrir */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* nada a fazer */
    }
  },
};

export function FichasPage() {
  usePgBody();
  const { user, ready } = useAccount();
  useEffect(() => {
    document.title = "Minhas fichas · Paradise Gate";
  }, []);
  return (
    <>
      <PgHeader />
      <main className="pg-profile pg-jogo">
        <h1 className="pg-profile-title">Minhas fichas</h1>
        {!ready && <p className="pg-empty">Carregando…</p>}
        {ready && !user && (
          <section className="pg-panel pg-profile-empty">
            <p>Entre com a conta que você recebeu por convite pra ver e guardar as fichas dos seus personagens.</p>
            <SignInButton className="pg-signin pg-signin-light" />
          </section>
        )}
        {ready && user && <FichasLoaded key={user.uid} />}
      </main>
      <PgFooter />
    </>
  );
}

function Panel({ id, title, count, children }: { id: string; title: string; count?: string; children: ReactNode }) {
  return (
    <section className="pg-panel pg-profile-sec" id={id} aria-labelledby={"pg-jogo-" + id}>
      <PgSectionHead text={title} count={count} id={"pg-jogo-" + id} />
      {children}
    </section>
  );
}

function FichasLoaded() {
  const [waking, setWaking] = useState(false);
  const api = useMemo(() => jogoApi(() => setWaking(true)), []);
  const [me, setMe] = useState<Me | null>(null);
  const [sheets, setSheets] = useState<SheetSummary[] | null>(null);
  const [error, setError] = useState<unknown>(null);

  const fetchAll = useCallback(() => {
    Promise.all([api.me(), api.listSheets()]).then(
      ([m, list]) => {
        setMe(m);
        setSheets(list);
      },
      (e) => setError(e),
    );
  }, [api]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function load() {
    setError(null);
    setWaking(false);
    fetchAll();
  }

  const view = fichasView({ ready: true, signedIn: true, waking, error, me, sheets });

  if (view.kind === "connecting") {
    return (
      <section className="pg-panel pg-profile-empty" aria-live="polite">
        <p>{view.waking ? "Conectando à conta… o servidor pode levar até um minuto pra acordar." : "Carregando suas fichas…"}</p>
      </section>
    );
  }
  if (view.kind === "not_invited") {
    return (
      <section className="pg-panel pg-profile-empty">
        <p>Sua conta ainda não foi liberada pra mesa. Peça pro mestre te convidar com este e-mail; depois é só voltar aqui.</p>
      </section>
    );
  }
  if (view.kind === "error") {
    return (
      <section className="pg-panel pg-profile-empty" role="alert">
        <p>{view.message}</p>
        {view.retry && (
          <button type="button" className="pg-btn-line pg-jogo-retry" onClick={load}>
            Tentar de novo
          </button>
        )}
        {view.signIn && <SignInButton className="pg-signin pg-signin-light" />}
      </section>
    );
  }
  if (view.kind === "signed_out") return null;

  return (
    <>
      <SheetsPanel api={api} sheets={view.kind === "list" ? view.sheets : []} onChange={setSheets} />
      {view.me.role === "admin" && <InvitesPanel api={api} />}
    </>
  );
}

type Status = { msg: string; bad?: boolean };

function SheetsPanel({ api, sheets, onChange }: { api: ApiClient; sheets: SheetSummary[]; onChange: (s: SheetSummary[]) => void }) {
  const [busy, setBusy] = useState<"" | "new" | "import" | "legacy">("");
  const [status, setStatus] = useState<Status>({ msg: "" });
  const [legacy, setLegacy] = useState(() => legacySheet(store.get(LEGACY_DRAWER), store.get(LEGACY_DONE)));

  async function create(sheet: ImportedSheet, kind: "import" | "legacy"): Promise<boolean> {
    setBusy(kind);
    setStatus({ msg: "" });
    try {
      const made = await api.createSheet(sheet.nome, sheet.data);
      Object.entries(seedDrawer(made.id, made.version, made.data)).forEach(([k, v]) => store.set(k, v));
      onChange([made, ...sheets]);
      setStatus({ msg: `“${made.nome}” está na sua conta. Toque nela pra abrir.` });
      return true;
    } catch (e) {
      setStatus({ msg: errorText(e), bad: true });
      return false;
    } finally {
      setBusy("");
    }
  }

  async function newSheet() {
    setBusy("new");
    setStatus({ msg: "" });
    try {
      const made = await api.createSheet(NO_NAME, {});
      location.assign(sheetHref(made.id));
    } catch (e) {
      setStatus({ msg: errorText(e), bad: true });
      setBusy("");
    }
  }

  function importFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const read = readImport(String(reader.result ?? ""), file.size);
      if (!read.ok) return setStatus({ msg: read.message, bad: true });
      void create(read.sheet, "import");
    };
    reader.onerror = () => setStatus({ msg: "Não consegui ler esse arquivo.", bad: true });
    reader.readAsText(file);
  }

  function legacyDone() {
    if (legacy) store.set(LEGACY_DONE, legacy.print);
    setLegacy(null);
  }

  return (
    <Panel id="fichas" title="Suas fichas" count={sheets.length ? String(sheets.length) : undefined}>
      <div className="pg-jogo-actions">
        <button type="button" className="pg-btn" onClick={() => void newSheet()} disabled={!!busy}>
          {busy === "new" ? "Criando…" : "Nova ficha"}
        </button>
        <input
          id="pg-jogo-import"
          className="pg-sr"
          type="file"
          accept="application/json,.json"
          disabled={!!busy}
          onChange={(ev) => {
            const file = ev.target.files?.[0];
            ev.target.value = "";
            if (file) importFile(file);
          }}
        />
        <label htmlFor="pg-jogo-import" className="pg-btn-line" aria-disabled={busy ? "true" : undefined}>
          {busy === "import" ? "Importando…" : "Importar ficha (.json)"}
        </label>
      </div>
      <p className={"pg-profile-status" + (status.bad ? " is-bad" : "")} role="status">
        {status.msg}
      </p>

      {legacy && (
        <div className="pg-jogo-found">
          <p>
            Achei uma ficha salva só neste navegador: <strong>{legacy.nome}</strong>. Ela ainda não está na sua conta.
          </p>
          <div className="pg-jogo-found-actions">
            <button
              type="button"
              className="pg-btn-line"
              disabled={!!busy}
              onClick={() => void create(legacy, "legacy").then((ok) => ok && legacyDone())}
            >
              {busy === "legacy" ? "Trazendo…" : "Trazer pra conta"}
            </button>
            <button type="button" className="pg-btn-text" onClick={legacyDone} disabled={!!busy}>
              Agora não
            </button>
          </div>
        </div>
      )}

      {sheets.length === 0 ? (
        <p className="pg-empty">
          Nenhuma ficha na conta ainda. Comece uma nova, ou importe o .json que a ficha antiga exporta no botão “Exportar ficha”.
        </p>
      ) : (
        <div className="pg-fav-list">
          {sheets.map((s) => (
            <SheetRow
              key={s.id}
              sheet={s}
              api={api}
              onDeleted={() => {
                drawerKeys(s.id).forEach((k) => store.remove(k));
                onChange(sheets.filter((x) => x.id !== s.id));
                setStatus({ msg: `“${s.nome}” foi apagada.` });
              }}
              onError={(msg) => setStatus({ msg, bad: true })}
            />
          ))}
        </div>
      )}
    </Panel>
  );
}

function SheetRow({ sheet, api, onDeleted, onError }: { sheet: SheetSummary; api: ApiClient; onDeleted: () => void; onError: (msg: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const askRef = useRef<HTMLButtonElement>(null);
  const name = sheet.nome || NO_NAME;

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  async function remove() {
    setDeleting(true);
    try {
      await api.deleteSheet(sheet.id);
      onDeleted();
    } catch (e) {
      onError(errorText(e));
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className={"pg-fav-row pg-sheet-row" + (confirming ? " is-confirming" : "")}>
      <a className="pg-fav-link" href={sheetHref(sheet.id)}>
        <span className="pg-fav-thumb is-empty" aria-hidden="true">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="pg-fav-text">
          <span className="pg-fav-title">{name}</span>
          <span className="pg-fav-type">{updatedText(sheet.updated_at)}</span>
        </span>
      </a>
      {confirming ? (
        <div className="pg-sheet-confirm" role="group" aria-label={"Apagar " + name}>
          <span className="pg-sheet-confirm-text">Apagar de vez? Não tem volta.</span>
          <button ref={confirmRef} type="button" className="pg-btn-line pg-btn-danger" onClick={() => void remove()} disabled={deleting}>
            {deleting ? "Apagando…" : "Apagar"}
          </button>
          <button
            type="button"
            className="pg-btn-text"
            disabled={deleting}
            onClick={() => {
              setConfirming(false);
              requestAnimationFrame(() => askRef.current?.focus());
            }}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button ref={askRef} type="button" className="pg-btn-text" aria-label={"Apagar " + name} onClick={() => setConfirming(true)}>
          Apagar
        </button>
      )}
    </div>
  );
}

function InvitesPanel({ api }: { api: ApiClient }) {
  const [invites, setInvites] = useState<Invite[] | null>(null);
  const [loadError, setLoadError] = useState<string>("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>({ msg: "" });

  const fetchInvites = useCallback(() => {
    api.listInvites().then(setInvites, (e) => setLoadError(errorText(e)));
  }, [api]);
  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  function load() {
    setLoadError("");
    fetchInvites();
  }

  async function invite() {
    const clean = normalizeInviteEmail(email);
    if (!clean) return setStatus({ msg: "Confira o e-mail: ele não parece válido.", bad: true });
    setBusy(true);
    setStatus({ msg: "" });
    try {
      const made = await api.createInvite(clean);
      setInvites((list) => [made, ...(list ?? [])]);
      setEmail("");
      setStatus({ msg: `${made.email} pode usar as fichas.` });
    } catch (e) {
      setStatus({ msg: inviteErrorText(e), bad: true });
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: Invite) {
    setRemoving(item.id);
    setStatus({ msg: "" });
    try {
      await api.deleteInvite(item.id);
      setInvites((list) => (list ?? []).filter((x) => x.id !== item.id));
      setStatus({ msg: `${item.email} não usa mais as fichas.` });
    } catch (e) {
      setStatus({ msg: errorText(e), bad: true });
    } finally {
      setRemoving(null);
    }
  }

  return (
    <Panel id="mesa" title="Jogadores da mesa" count={invites?.length ? String(invites.length) : undefined}>
      <p className="pg-profile-note">
        Convidar aqui libera as fichas pra esse e-mail. A conta no site continua sendo criada no painel do Firebase, como hoje.
      </p>
      <form
        className="pg-field pg-jogo-invite"
        onSubmit={(ev) => {
          ev.preventDefault();
          void invite();
        }}
      >
        <label className="pg-field-label" htmlFor="pg-jogo-email">
          E-mail do jogador
        </label>
        <div className="pg-field-row">
          <input
            id="pg-jogo-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            spellCheck={false}
            maxLength={254}
            placeholder="jogador@email.com"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            disabled={busy}
          />
          <button type="submit" className="pg-btn" disabled={busy || !email.trim()}>
            {busy ? "Convidando…" : "Convidar"}
          </button>
        </div>
      </form>
      <p className={"pg-profile-status" + (status.bad ? " is-bad" : "")} role="status">
        {status.msg}
      </p>

      {loadError ? (
        <div role="alert">
          <p className="pg-empty">{loadError}</p>
          <button type="button" className="pg-btn-line pg-jogo-retry" onClick={load}>
            Tentar de novo
          </button>
        </div>
      ) : !invites ? (
        <p className="pg-empty">Carregando os convites…</p>
      ) : invites.length === 0 ? (
        <p className="pg-empty">Ninguém convidado ainda.</p>
      ) : (
        <ul className="pg-invite-list">
          {invites.map((item) => (
            <li key={item.id} className="pg-invite-row">
              <span className="pg-invite-text">
                <span className="pg-invite-email">{item.email}</span>
                <span className="pg-invite-meta">
                  <span className={"pg-invite-state" + (item.joined ? " is-in" : "")}>{item.joined ? "já entrou" : "ainda não entrou"}</span>
                  {item.invited_by && <span>{"convidado por " + item.invited_by}</span>}
                </span>
              </span>
              <button
                type="button"
                className="pg-btn-text"
                aria-label={"Remover o convite de " + item.email}
                disabled={removing === item.id}
                onClick={() => void remove(item)}
              >
                {removing === item.id ? "Removendo…" : "Remover"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
