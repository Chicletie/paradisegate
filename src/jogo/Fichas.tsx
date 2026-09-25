import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";
import { PgSectionHead } from "../components/PgIcons";
import { SignInButton } from "../components/AccountMenu";
import { useAccount } from "../lib/account";
import { usePgBody } from "../lib/usePgBody";
import { featuresOf, useJogoAccess } from "./access";
import { jogoApi } from "./api";
import { OfflineError, type ApiClient, type Me, type MySheetNote, type SheetSummary, type TableSheet } from "./apiClient";
import {
  drawerKeys,
  errorText,
  fichasView,
  LEGACY_DONE,
  LEGACY_DRAWER,
  legacySheet,
  noteDate,
  parseImportFile,
  seedDrawer,
  sheetHref,
  updatedText,
} from "./fichasState";

/*
 * As fichas no site:
 * - "Suas fichas" é um painel do perfil (/wiki/_perfil#fichas): criar, importar o .json, abrir e
 *   apagar. `/jogo/fichas` leva pra lá.
 * - A página da mesa (/jogo/mesa, link na barra de navegação só pro mestre): todas as fichas da
 *   mesa (as dos outros em só leitura). Convidar e tirar da mesa é no editor do mestre (arvore),
 *   que pergunta à API do jogo: aqui não tem convite.
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

function Panel({ id, title, count, children }: { id: string; title: string; count?: string; children: ReactNode }) {
  return (
    <section className="pg-panel pg-profile-sec" id={id} aria-labelledby={"pg-jogo-" + id}>
      <PgSectionHead text={title} count={count} id={"pg-jogo-" + id} />
      {children}
    </section>
  );
}

const SHEETS_TITLE = "Suas fichas";

/** Painel "Suas fichas" do perfil (âncora #fichas). Aparece quando a API diz (features.fichas). */
export function FichasSection({ me }: { me: Me }) {
  const [waking, setWaking] = useState(false);
  const api = useMemo(() => jogoApi(() => setWaking(true)), []);
  const [sheets, setSheets] = useState<SheetSummary[] | null>(null);
  const [error, setError] = useState<unknown>(null);

  const fetchSheets = useCallback(() => {
    api.listSheets().then(setSheets, setError);
  }, [api]);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  function retry() {
    setError(null);
    setWaking(false);
    fetchSheets();
  }

  const view = fichasView({ ready: true, signedIn: true, waking, error, me, sheets });

  if (view.kind === "empty" || view.kind === "list") {
    return <SheetsPanel api={api} sheets={view.kind === "list" ? view.sheets : []} onChange={setSheets} />;
  }
  if (view.kind === "connecting") {
    return (
      <Panel id="fichas" title={SHEETS_TITLE}>
        <p className="pg-empty" aria-live="polite">
          {view.waking ? "Conectando à conta… o servidor pode levar até um minuto pra acordar." : "Carregando suas fichas…"}
        </p>
      </Panel>
    );
  }
  if (view.kind === "error") {
    return (
      <Panel id="fichas" title={SHEETS_TITLE}>
        <div role="alert">
          <p className="pg-empty">{view.message}</p>
          {view.retry && (
            <button type="button" className="pg-btn-line pg-jogo-retry" onClick={retry}>
              Tentar de novo
            </button>
          )}
          {view.signIn && <SignInButton className="pg-signin pg-signin-light" />}
        </div>
      </Panel>
    );
  }
  return null;
}

/**
 * "Sugestões do mestre" no perfil (âncora #mestre): o que o mestre comentou nas fichas da pessoa.
 * Abrir o perfil conta como visto; as que eram novas ficam marcadas até recarregar.
 */
export function MestreNotesSection() {
  const api = useMemo(() => jogoApi(), []);
  const [notes, setNotes] = useState<MySheetNote[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    api.listMyNotes().then(
      (list) => {
        if (!alive) return;
        setNotes(list);
        if (list.some((n) => !n.seen_at)) api.markNotesSeen().catch(() => {});
      },
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [api]);

  let body: ReactNode;
  if (failed) body = <p className="pg-empty">Não consegui carregar as sugestões do mestre agora. Tente de novo daqui a pouco.</p>;
  else if (!notes) body = <p className="pg-empty">Carregando…</p>;
  else if (notes.length === 0) body = <p className="pg-empty">O mestre ainda não deixou sugestões nas suas fichas.</p>;
  else {
    body = notes.map((n) => (
      <article key={n.id} className={"pg-sug" + (n.seen_at ? "" : " is-new")}>
        <div className="pg-sug-head">
          <a className="pg-sug-page" href={sheetHref(n.sheet_id)}>
            {n.sheet_nome}
          </a>
          {!n.seen_at && (
            <span className="pg-sug-tags">
              <span className="pg-sug-new">Novidade</span>
            </span>
          )}
        </div>
        <div className="pg-sug-meta">{[noteDate(n.created_at), n.author ?? ""].filter(Boolean).join(" · ")}</div>
        <p className="pg-sug-text">{n.text}</p>
      </article>
    ));
  }

  return (
    <Panel id="mestre" title="Sugestões do mestre" count={notes?.length ? String(notes.length) : undefined}>
      <div className="pg-sug-list">{body}</div>
    </Panel>
  );
}

/** A página da mesa (/jogo/mesa): só do mestre. */
export function MesaPage() {
  usePgBody();
  const { user, ready } = useAccount();
  const access = useJogoAccess();
  const api = useMemo(() => jogoApi(), []);
  useEffect(() => {
    document.title = "Fichas da mesa · Paradise Gate";
  }, []);

  let body: ReactNode;
  if (!ready || access.kind === "loading") {
    body = <p className="pg-empty">Carregando…</p>;
  } else if (!user) {
    body = (
      <section className="pg-panel pg-profile-empty">
        <p>Entre com a conta do mestre pra ver as fichas da mesa.</p>
        <SignInButton className="pg-signin pg-signin-light" />
      </section>
    );
  } else if (featuresOf(access).mesa) {
    body = <TablePanel api={api} />;
  } else if (access.kind === "error") {
    body = (
      <section className="pg-panel pg-profile-empty" role="alert">
        <p>{errorText(new OfflineError(0, { code: "offline" }, null))}</p>
        <button type="button" className="pg-btn-line pg-jogo-retry" onClick={() => location.reload()}>
          Tentar de novo
        </button>
      </section>
    );
  } else {
    body = (
      <section className="pg-panel pg-profile-empty">
        <p>Esta página é do mestre da mesa. As suas fichas ficam no seu perfil.</p>
        <Link className="pg-btn-line pg-jogo-retry" to="/wiki/_perfil#fichas">
          Ir pro seu perfil
        </Link>
      </section>
    );
  }

  return (
    <>
      <PgHeader />
      <main className="pg-profile pg-jogo">
        <h1 className="pg-profile-title">Fichas da mesa</h1>
        {body}
      </main>
      <PgFooter />
    </>
  );
}

type Status = { msg: string; bad?: boolean };

function SheetsPanel({ api, sheets, onChange }: { api: ApiClient; sheets: SheetSummary[]; onChange: (s: SheetSummary[]) => void }) {
  const [busy, setBusy] = useState<"" | "new" | "import" | "legacy">("");
  const [status, setStatus] = useState<Status>({ msg: "" });
  const [legacy, setLegacy] = useState(() => legacySheet(store.get(LEGACY_DRAWER), store.get(LEGACY_DONE)));

  /** Sobe uma ficha exportada (arquivo ou a achada no navegador): a API confere e dá o nome. */
  async function create(data: Record<string, unknown>, kind: "import" | "legacy"): Promise<boolean> {
    setBusy(kind);
    setStatus({ msg: "" });
    try {
      const made = await api.importSheet(data);
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
      const made = await api.createSheet();
      location.assign(sheetHref(made.id));
    } catch (e) {
      setStatus({ msg: errorText(e), bad: true });
      setBusy("");
    }
  }

  function importFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const data = parseImportFile(String(reader.result ?? ""));
      if (!data) return setStatus({ msg: "Esse arquivo não abre como .json. Use o do botão “Exportar ficha”.", bad: true });
      void create(data, "import");
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
            Achei uma ficha salva só neste navegador. Ela ainda não está na sua conta.
          </p>
          <div className="pg-jogo-found-actions">
            <button
              type="button"
              className="pg-btn-line"
              disabled={!!busy}
              onClick={() => void create(legacy.data, "legacy").then((ok) => ok && legacyDone())}
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
  const name = sheet.nome;

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

/** Fichas da mesa (só admin): as fichas dos jogadores, abertas em só leitura na própria ficha. */
function TablePanel({ api }: { api: ApiClient }) {
  const [rows, setRows] = useState<TableSheet[] | null>(null);
  const [loadError, setLoadError] = useState("");

  const fetchRows = useCallback(() => {
    api.listTableSheets().then(setRows, (e) => setLoadError(errorText(e)));
  }, [api]);
  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  function load() {
    setLoadError("");
    fetchRows();
  }

  let body: ReactNode;
  if (loadError) {
    body = (
      <div role="alert">
        <p className="pg-empty">{loadError}</p>
        <button type="button" className="pg-btn-line pg-jogo-retry" onClick={load}>
          Tentar de novo
        </button>
      </div>
    );
  } else if (!rows) {
    body = <p className="pg-empty">Carregando as fichas da mesa…</p>;
  } else if (rows.length === 0) {
    body = <p className="pg-empty">Ninguém da mesa tem ficha na conta ainda.</p>;
  } else {
    body = (
      <div className="pg-fav-list">
        {rows.map((s) => {
          const name = s.nome;
          return (
            <div key={s.id} className="pg-fav-row pg-sheet-row">
              <a className="pg-fav-link" href={sheetHref(s.id)}>
                <span className="pg-fav-thumb is-empty" aria-hidden="true">
                  {name.charAt(0).toUpperCase()}
                </span>
                <span className="pg-fav-text">
                  <span className="pg-fav-title">{name}</span>
                  <span className="pg-fav-type">
                    <span className="pg-table-owner">{s.mine ? "sua" : s.owner.name}</span>
                    {" · " + updatedText(s.updated_at)}
                  </span>
                </span>
              </a>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Panel id="mesa-fichas" title="Todas as fichas" count={rows?.length ? String(rows.length) : undefined}>
      <p className="pg-profile-note">
        Todas as fichas da mesa, as suas também, pra consultar durante a sessão. As dos outros abrem só pra leitura: quem muda é o jogador.
      </p>
      {body}
    </Panel>
  );
}
