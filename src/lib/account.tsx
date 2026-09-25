import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { claimUsername, fetchMemberCard, fetchMySuggestions, fetchProfile, LoginError, saveMemberCard, saveProfile, sendPasswordReset, signIn, watchAuth } from "./api";
import { cardFields, cardOutdated } from "./member";
import { mergeProfile, unreadCount } from "./profile";
import { isEmailLogin } from "./username";
import type { AuthUser, MemberCard, WikiProfile, WikiProfilePatch } from "../types";

/*
 * Conta do leitor — porta de mountLoginBar/pgLoadProfile/pgSaveProfile/pgUnreadCount/
 * openLoginModal na wiki original. Login só importa pro conteúdo restrito, pra
 * favoritar e pra sugerir; o resto da wiki funciona igual sem ele. A sessão fica guardada pelo
 * próprio Firebase (quem entra uma vez continua dentro nas próximas visitas).
 */

// "Ver como convidado": o leitor com acesso restrito navega vendo só o que qualquer visitante
// vê. Em sessionStorage (some quando a aba fecha) e com a mesma chave de hoje; trocar recarrega
// a página, como no original — é o jeito simples de desfazer o conteúdo restrito já na tela.
const GUEST_KEY = "wb_guest_mode";
export function guestMode(): boolean {
  try {
    return sessionStorage.getItem(GUEST_KEY) === "1";
  } catch {
    return false;
  }
}
export function setGuestMode(on: boolean) {
  try {
    if (on) sessionStorage.setItem(GUEST_KEY, "1");
    else sessionStorage.removeItem(GUEST_KEY);
  } catch {
    /* armazenamento bloqueado: segue sem o modo convidado */
  }
}

interface AccountState {
  /** `null` = ninguém logado (ou o Firebase ainda restaurando a sessão). */
  user: AuthUser | null;
  /** O Firebase já disse quem está logado pelo menos uma vez. */
  ready: boolean;
  guest: boolean;
  /** Perfil do usuário logado; `null` enquanto carrega. Falha de leitura vira `{}`. */
  profile: WikiProfile | null;
  unread: number;
  /** O perfil (uma leitura por visita), pra quem precisa esperar por ele. */
  loadProfile: () => Promise<WikiProfile>;
  save: (patch: WikiProfilePatch) => Promise<void>;
  /** Escolhe ou troca o username (a regra do banco confere se está livre e os 30 dias). */
  /** Pede o username ao servidor (que confere tudo); devolve o nome como ficou guardado. */
  setUsername: (raw: string) => Promise<string>;
  /** O cartão público (/@nome) de quem está logado; `null` sem username. Acerta o cartão se
   * ele estiver atrás do perfil (quem escolheu o nome antes do perfil público existir). */
  loadCard: () => Promise<MemberCard | null>;
  /** Grava bio e "mostrar meus favoritos" no cartão público. */
  saveCard: (prefs: { bio?: string; showFavorites?: boolean }) => Promise<void>;
  clearUnread: () => void;
  openLogin: () => void;
}

// Fora do AccountProvider (testes, renderização sem Firebase): ninguém logado, nada a fazer —
// igual a wiki-core.js sem `firebase` na página.
const LOGGED_OUT: AccountState = {
  user: null,
  ready: true,
  guest: false,
  profile: null,
  unread: 0,
  loadProfile: async () => ({}),
  setUsername: async () => "",
  loadCard: async () => null,
  saveCard: async () => {},
  save: async () => {},
  clearUnread: () => {},
  openLogin: () => {},
};
const AccountContext = createContext<AccountState>(LOGGED_OUT);

export function useAccount(): AccountState {
  return useContext(AccountContext);
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, WikiProfile>>({});
  const [unreadByUid, setUnreadByUid] = useState<Record<string, number>>({});
  const [loginOpen, setLoginOpen] = useState(false);
  const [guest] = useState(guestMode);
  // Uma leitura do perfil (e da contagem de novidades) por usuário e por visita, como hoje.
  const loaded = useRef<Record<string, Promise<unknown>>>({});
  // Última versão de cada perfil (a lida, mais as gravações desta visita).
  const latest = useRef<Record<string, WikiProfile>>({});
  const setProfile = useCallback((uid: string, d: WikiProfile) => {
    latest.current[uid] = d;
    setProfiles((p) => ({ ...p, [uid]: d }));
  }, []);

  useEffect(
    () =>
      watchAuth((u) => {
        setUser(u);
        setReady(true);
      }),
    [],
  );

  const loadProfile = useCallback(
    (u: AuthUser): Promise<WikiProfile> => {
      if (!loaded.current[u.uid]) {
        const first = fetchProfile(u.uid)
          .catch(() => ({}) as WikiProfile)
          .then((d) => setProfile(u.uid, d));
        loaded.current[u.uid] = first;
        Promise.all([first, fetchMySuggestions(u.email)])
          .then(([, sugs]) => unreadCount(sugs, latest.current[u.uid].seenAt))
          .catch(() => 0)
          .then((n) => setUnreadByUid((m) => ({ ...m, [u.uid]: n })));
      }
      return loaded.current[u.uid].then(() => latest.current[u.uid]);
    },
    [setProfile],
  );

  useEffect(() => {
    if (user) void loadProfile(user);
  }, [user, loadProfile]);

  // O cartão público acompanha o perfil: apelido, foto e favoritos vêm dele; bio e "mostrar
  // favoritos" são do próprio cartão. Só grava quando algo mudou.
  const syncCard = useCallback(
    async (u: AuthUser, d: WikiProfile, prefs?: { bio?: string; showFavorites?: boolean }): Promise<MemberCard | null> => {
      if (!d.username) return null;
      const card = await fetchMemberCard(d.username);
      if (!card || card.uid !== u.uid) return card;
      const want = cardFields(d, prefs ?? { bio: card.bio, showFavorites: card.showFavorites }, card.since || u.since);
      if (!cardOutdated(card, want)) return card;
      await saveMemberCard(d.username, want);
      return { uid: u.uid, ...want };
    },
    [],
  );

  const save = useCallback(
    async (patch: WikiProfilePatch) => {
      if (!user) return;
      const updatedAt = new Date().toISOString();
      await saveProfile(user, patch, updatedAt);
      const d = await loadProfile(user);
      const merged = mergeProfile(d, user, patch, updatedAt);
      setProfile(user.uid, merged);
      // O perfil já salvou; se o cartão falhar agora, acerta na próxima visita ao perfil.
      if (patch.nickname !== undefined || patch.photo !== undefined || patch.favorite) void syncCard(user, merged).catch(() => {});
    },
    [user, loadProfile, setProfile, syncCard],
  );

  // O servidor confere, grava o nome e leva o cartão público junto; aqui só se relê o perfil.
  const setUsername = useCallback(
    async (raw: string): Promise<string> => {
      if (!user) return "";
      const { username } = await claimUsername(raw);
      const fresh = await fetchProfile(user.uid).catch(() => null);
      setProfile(user.uid, fresh ?? { ...latest.current[user.uid], username });
      return username;
    },
    [user, setProfile],
  );

  const loadCard = useCallback(async () => {
    if (!user) return null;
    return syncCard(user, await loadProfile(user));
  }, [user, loadProfile, syncCard]);

  const saveCard = useCallback(
    async (prefs: { bio?: string; showFavorites?: boolean }) => {
      if (!user) return;
      await syncCard(user, await loadProfile(user), prefs);
    },
    [user, loadProfile, syncCard],
  );

  const value = useMemo<AccountState>(
    () => ({
      user,
      ready,
      guest,
      profile: user ? (profiles[user.uid] ?? null) : null,
      unread: user ? unreadByUid[user.uid] || 0 : 0,
      loadProfile: () => (user ? loadProfile(user) : Promise.resolve({})),
      save,
      setUsername,
      loadCard,
      saveCard,
      clearUnread: () => {
        if (user) setUnreadByUid((m) => ({ ...m, [user.uid]: 0 }));
      },
      openLogin: () => setLoginOpen(true),
    }),
    [user, ready, guest, profiles, unreadByUid, loadProfile, save, setUsername, loadCard, saveCard],
  );

  return (
    <AccountContext.Provider value={value}>
      {children}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </AccountContext.Provider>
  );
}

/** Nome que o leitor escolheu (apelido), ou vazio. */
export function nicknameOf(profile: WikiProfile | null): string {
  return (profile && profile.nickname) || "";
}

/** Casca `.login-modal` > `.login-box`, no fim do <body> como hoje; clicar fora fecha. */
export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return createPortal(
    <div
      className="login-modal"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div className="login-box">{children}</div>
    </div>,
    document.body,
  );
}

/** Porta de openLoginModal: e-mail ou username, senha, "esqueci minha senha" e cancelar. */
function LoginModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState<"idle" | "sending" | "sent">("idle");

  function doSubmit() {
    setErr("");
    setBusy(true);
    signIn(email.trim(), pass).then(onClose, (e) => {
      setBusy(false);
      setErr(e instanceof LoginError ? e.message : isEmailLogin(email) ? "Não consegui entrar. Confira email e senha." : "Não consegui entrar. Confira username e senha.");
    });
  }

  function doForgot() {
    const addr = email.trim();
    if (!addr) {
      setErr("Digite seu email ali em cima primeiro.");
      return;
    }
    if (!isEmailLogin(addr)) {
      setErr("Pra recuperar a senha, digite o email da conta (não o username).");
      return;
    }
    setErr("");
    setForgot("sending");
    sendPasswordReset(addr).then(
      () => setForgot("sent"),
      () => {
        setForgot("idle");
        setErr("Não consegui enviar. Confira o email digitado.");
      },
    );
  }

  return (
    <Modal onClose={onClose}>
      <h3>Entrar</h3>
      <label className="field-label" htmlFor="wiki-login-email">
        Email ou username
      </label>
      <input
        id="wiki-login-email"
        type="text"
        inputMode="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="voce@email.com ou @seunome"
        autoComplete="username"
        autoFocus
        value={email}
        onChange={(ev) => setEmail(ev.target.value)}
      />
      <label className="field-label" htmlFor="wiki-login-pass">
        Senha
      </label>
      <input
        id="wiki-login-pass"
        type="password"
        autoComplete="current-password"
        value={pass}
        onChange={(ev) => setPass(ev.target.value)}
        onKeyDown={(ev) => {
          if (ev.key === "Enter") doSubmit();
        }}
      />
      <div className="err">{err}</div>
      <button className="submit" type="button" disabled={busy} onClick={doSubmit}>
        {busy ? "entrando…" : "Entrar"}
      </button>
      <button className="cancel" type="button" style={{ marginTop: 6 }} disabled={forgot !== "idle"} onClick={doForgot}>
        {forgot === "sending" ? "enviando…" : forgot === "sent" ? "Email enviado! Confira sua caixa de entrada." : "esqueci minha senha"}
      </button>
      <button className="cancel" type="button" onClick={onClose}>
        cancelar
      </button>
    </Modal>
  );
}
