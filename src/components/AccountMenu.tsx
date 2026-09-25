import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { setGuestMode, useAccount } from "../lib/account";
import { signOutUser } from "../lib/api";
import type { AuthUser, WikiProfile } from "../types";
import { PgUserIcon } from "./PgIcons";

/**
 * Canto direito do cabeçalho — porta de mountLoginBar no modo Paradise Gate: "Entrar" pra quem
 * não está logado; logado, o avatar que abre o menu da conta (pgAccountMenu).
 */
export function LoginBar() {
  const { user, openLogin } = useAccount();
  return (
    <div className="login-bar">
      <span>
        {user ? (
          <AccountMenu user={user} />
        ) : (
          <button className="pg-signin" type="button" title="Entrar pra ver conteúdo restrito" onClick={openLogin}>
            <PgUserIcon />
            <span>Entrar</span>
          </button>
        )}
      </span>
    </div>
  );
}

/** Botão "Entrar" do perfil de quem ainda não entrou (versão clara, dentro do painel). */
export function SignInButton({ className }: { className: string }) {
  const { openLogin } = useAccount();
  return (
    <button className={className} type="button" onClick={openLogin}>
      <PgUserIcon />
      <span>Entrar</span>
    </button>
  );
}

/** Avatar: foto do perfil quando existe; senão, a inicial (do apelido ou do e-mail). */
export function Avatar({ user, profile, className = "pg-avatar" }: { user: AuthUser; profile: WikiProfile | null; className?: string }) {
  const photo = profile?.photo;
  return (
    <span className={className + (photo ? " has-photo" : "")} aria-hidden="true" data-pg-avatar="1">
      {photo ? <img src={photo} alt="" /> : <span>{(profile?.nickname || user.email || "?").charAt(0).toUpperCase()}</span>}
    </span>
  );
}

const MENU_ID = "pg-account-menu";

function AccountMenu({ user }: { user: AuthUser }) {
  const { profile, unread, guest } = useAccount();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Aberto: clique fora fecha e o foco vai pro primeiro item.
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>(".pg-menu-item")?.focus();
    const onDocClick = (ev: MouseEvent) => {
      if (!wrapRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  const nick = profile?.nickname || "";
  const handle = profile?.username ? "@" + profile.username : "";
  const label = "Menu da conta (" + user.email + ")" + (unread ? " — " + (unread === 1 ? "1 resposta nova" : unread + " respostas novas") : "");
  const close = () => setOpen(false);

  return (
    <div
      className="pg-account"
      ref={wrapRef}
      onKeyDown={(ev) => {
        if (ev.key === "Escape" && open) {
          setOpen(false);
          btnRef.current?.focus();
        }
      }}
      onBlur={(ev) => {
        if (open && ev.relatedTarget && !wrapRef.current?.contains(ev.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={btnRef}
        className="pg-avatar-btn"
        type="button"
        aria-controls={MENU_ID}
        aria-expanded={open ? "true" : "false"}
        title={user.email}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar user={user} profile={profile} />
        {unread > 0 && <span className="pg-avatar-dot" aria-hidden="true" />}
      </button>
      <div className="pg-menu" id={MENU_ID} hidden={!open} ref={menuRef}>
        <div className="pg-menu-head">
          <Avatar user={user} profile={profile} className="pg-avatar pg-avatar-lg" />
          <div className="pg-menu-who">
            <span className="pg-menu-name">{nick || "Sua conta"}</span>
            {handle && <span className="pg-menu-handle">{handle}</span>}
            <span className="pg-menu-email">{user.email + (guest ? " · vendo como convidado" : "")}</span>
          </div>
        </div>
        <div className="pg-menu-list">
          <Link className="pg-menu-item" to="/wiki/_perfil" onClick={close}>
            Meu perfil
          </Link>
          <Link className="pg-menu-item" to="/wiki/_perfil#sugestoes" onClick={close}>
            Minhas sugestões
            {unread > 0 && <span className="pg-menu-badge">{unread === 1 ? "1 nova" : unread + " novas"}</span>}
          </Link>
          <Link className="pg-menu-item" to="/wiki/_perfil#favoritos" onClick={close}>
            Favoritos
          </Link>
          <button
            className="pg-menu-item"
            type="button"
            onClick={() => {
              setGuestMode(!guest);
              location.reload();
            }}
          >
            {guest ? "Voltar a ver com meu acesso" : "Ver como convidado"}
          </button>
          <div className="pg-menu-sep" aria-hidden="true" />
          <button
            className="pg-menu-item"
            type="button"
            onClick={() => {
              setGuestMode(false);
              void signOutUser();
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
