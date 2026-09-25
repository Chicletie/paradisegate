import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { usePgBody } from "../lib/usePgBody";
import { useAccount } from "../lib/account";
import { fetchMyAccesses, fetchMySuggestions } from "../lib/api";
import { useWikiIndex, useWikiObras } from "../lib/wikiIndex";
import { ProgressPicker } from "../components/SpoilerProgress";
import { UsernameDialog } from "../components/UsernameDialog";
import { fmtDay, isBlockedNickname, nextChangeAt } from "../lib/username";
import { objPos } from "../lib/format";
import { resizePhoto } from "../lib/photo";
import { BIO_MAX, memberHref } from "../lib/member";
import { accessLabel, groupAccesses, isNewSuggestion, newestFirst, suggestionStatus } from "../lib/profile";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";
import { PgSectionHead } from "../components/PgIcons";
import { Avatar, SignInButton } from "../components/AccountMenu";
import { FichasSection } from "../jogo/Fichas";
import { useJogoAccess } from "../jogo/access";
import { showsFichas } from "../jogo/flags";
import type { AuthUser, WikiRestritoItem, WikiSuggestion } from "../types";

const SECTIONS: [string, string][] = [
  ["identidade", "Identidade"],
  ["publico", "Perfil público"],
  ["fichas", "Suas fichas"],
  ["sugestoes", "Suas sugestões"],
  ["favoritos", "Favoritos"],
  ["acessos", "Seus acessos"],
  ["spoilers", "Spoilers"],
];

/**
 * Perfil do leitor (`/wiki/_perfil`, âncoras `#sugestoes`/`#favoritos`) — porta de
 * renderProfile na wiki original: Identidade (foto e apelido em wikiProfiles/{uid}),
 * Suas sugestões (com a resposta do autor e o aviso de novidade), Favoritos e Seus acessos
 * (trechos de wikiRestrito liberados pro e-mail, só de páginas do Paradise Gate).
 */
export function ProfilePage() {
  usePgBody();
  const { user, ready } = useAccount();
  useEffect(() => {
    document.title = "Seu perfil · Paradise Gate";
  }, []);
  return (
    <>
      <PgHeader />
      <main className="pg-profile">
        {ready && <h1 className="pg-profile-title">Seu perfil</h1>}
        {ready && !user && (
          <section className="pg-panel pg-profile-empty">
            <p>Entre com a conta que você recebeu por convite pra ver seu perfil, suas sugestões e seus favoritos.</p>
            <SignInButton className="pg-signin pg-signin-light" />
          </section>
        )}
        {/* Uma por conta: entrar ou sair aqui mesmo refaz a página (hoje ela ficava parada no
            primeiro estado até recarregar). */}
        {ready && user && <ProfileSections key={user.uid} user={user} />}
      </main>
      <PgFooter />
    </>
  );
}

function Panel({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="pg-panel pg-profile-sec" id={id} aria-labelledby={"pg-prof-" + id}>
      <PgSectionHead text={title} id={"pg-prof-" + id} />
      {children}
    </section>
  );
}

function ProfileSections({ user }: { user: AuthUser }) {
  // "Suas fichas" (API do jogo) só pra quem joga: o mestre sempre, o jogador com a chave ligada.
  const access = useJogoAccess();
  const fichas = showsFichas(access.kind);
  return (
    <>
      <nav className="pg-profile-nav" aria-label="Seções do perfil">
        {SECTIONS.filter(([id]) => fichas || id !== "fichas").map(([id, label]) => (
          <a key={id} className="pg-profile-chip" href={"#" + id}>
            {label}
          </a>
        ))}
      </nav>
      <Identity user={user} />
      <PublicProfile />
      {fichas && <FichasSection access={access} />}
      <Suggestions user={user} />
      <Favorites />
      <Accesses user={user} />
      <SpoilerSettings />
    </>
  );
}

// Perfil público (/@nome): a bio e se os favoritos aparecem lá. Apelido e foto vêm da
// Identidade; o cartão acompanha sozinho. Sem username, não tem perfil público ainda.
function PublicProfile() {
  const { profile, loadCard, saveCard } = useAccount();
  const name = profile?.username || "";
  const [prefs, setPrefs] = useState<{ bio: string; showFavorites: boolean } | null>(null);
  const [status, setStatus] = useState<{ msg: string; bad?: boolean }>({ msg: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!name) return;
    let alive = true;
    loadCard().then(
      (c) => alive && setPrefs({ bio: c?.bio || "", showFavorites: !!c?.showFavorites }),
      () => alive && setStatus({ msg: "Não consegui ler seu perfil público agora.", bad: true }),
    );
    return () => {
      alive = false;
    };
  }, [name, loadCard]);

  function doSave() {
    if (!prefs) return;
    setBusy(true);
    setStatus({ msg: "Salvando…" });
    saveCard({ bio: prefs.bio.trim(), showFavorites: prefs.showFavorites })
      .then(
        () => setStatus({ msg: "Perfil público salvo." }),
        () => setStatus({ msg: "Não consegui salvar agora. Tenta de novo daqui a pouco.", bad: true }),
      )
      .then(() => setBusy(false));
  }

  return (
    <Panel id="publico" title="Perfil público">
      {!profile ? (
        <p className="pg-empty">Carregando…</p>
      ) : !name ? (
        <p className="pg-profile-note">
          Quem tem username ganha uma página pública, com endereço próprio, que o autor pode citar na wiki.{" "}
          <a href="#username">Escolha seu username</a> pra ter a sua.
        </p>
      ) : (
        <div className="pg-profile-fields">
          <p className="pg-profile-note">
            Seu endereço é <Link to={memberHref(name)}>paradisegate.com.br/@{name}</Link>. Lá aparecem sua foto, seu apelido, a bio abaixo e os
            personagens que você interpreta na wiki. Seu e-mail nunca aparece.
          </p>
          <div className="pg-field">
            <label className="pg-field-label" htmlFor="pg-bio">
              Bio
            </label>
            <textarea
              id="pg-bio"
              className="pg-bio-input"
              maxLength={BIO_MAX}
              rows={3}
              placeholder="Umas linhas sobre você, se quiser."
              disabled={!prefs}
              value={prefs?.bio ?? ""}
              onChange={(ev) => prefs && setPrefs({ ...prefs, bio: ev.target.value })}
            />
            <span className="pg-un-hint">{(prefs?.bio.length ?? 0) + " de " + BIO_MAX}</span>
          </div>
          <label className="pg-check">
            <input
              type="checkbox"
              disabled={!prefs}
              checked={!!prefs?.showFavorites}
              onChange={(ev) => prefs && setPrefs({ ...prefs, showFavorites: ev.target.checked })}
            />
            <span>Mostrar meus favoritos no perfil público</span>
          </label>
          <div className="pg-field-row">
            <button className="pg-btn" type="button" disabled={busy || !prefs} onClick={doSave}>
              Salvar
            </button>
            <Link className="pg-btn-line" to={memberHref(name)}>
              Ver meu perfil público
            </Link>
          </div>
          <p className={"pg-profile-status" + (status.bad ? " is-bad" : "")} role="status">
            {status.msg}
          </p>
        </div>
      )}
    </Panel>
  );
}

// Spoiler por obra: até onde o leitor já viu cada obra. O que ele já viu aparece aberto em
// toda a wiki; o resto continua na tarja, dizendo de que temporada é.
function SpoilerSettings() {
  const obras = useWikiObras();
  return (
    <Panel id="spoilers" title="Até onde você já viu">
      {obras.length ? (
        <>
          <p className="pg-profile-note">Os spoilers das temporadas que você já viu aparecem abertos em toda a wiki. Os outros continuam tampados.</p>
          <div className="pg-prog-list">
            {obras.map((o) => (
              <ProgressPicker key={o.id} obra={o} />
            ))}
          </div>
        </>
      ) : (
        <p className="pg-profile-note">Nenhuma página tem spoiler marcado por temporada ainda.</p>
      )}
    </Panel>
  );
}

// Identidade — foto (reduzida no navegador) e apelido.
function Identity({ user }: { user: AuthUser }) {
  const { profile, save } = useAccount();
  // `null` = ainda não mexeu: mostra o apelido salvo assim que o perfil chega.
  const [nick, setNick] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ msg: string; bad: boolean }>({ msg: "", bad: false });
  const say = (msg: string, bad = false) => setStatus({ msg, bad });
  // Janela do username: abre sozinha pelo link do e-mail de convocação (#username) se a conta
  // ainda não tem um.
  const [unOpen, setUnOpen] = useState(false);
  const [unDismissed, setUnDismissed] = useState(false);
  const [fromLink] = useState(() => typeof location !== "undefined" && location.hash === "#username");
  const showUn = unOpen || (fromLink && !unDismissed && !!profile && !profile.username);
  const lockedUntil = nextChangeAt(profile?.usernameChangedAt);

  function saveNick() {
    const value = (nick ?? profile?.nickname ?? "").trim().slice(0, 32);
    if (value !== (profile?.nickname || "") && isBlockedNickname(value)) {
      say("Esse apelido não é permitido. Escolha outro.", true);
      return;
    }
    setBusy(true);
    say("Salvando…");
    save({ nickname: value })
      .then(
        () => say("Apelido salvo."),
        () => say("Não consegui salvar agora. Tenta de novo daqui a pouco.", true),
      )
      .then(() => setBusy(false));
  }

  return (
    <Panel id="identidade" title="Identidade">
      <div className="pg-profile-row">
        <div className="pg-profile-avatar-wrap">
          <Avatar user={user} profile={profile} className="pg-avatar pg-avatar-xl" />
          <input
            type="file"
            accept="image/*"
            className="pg-sr"
            id="pg-photo-in"
            onChange={(ev) => {
              const f = ev.target.files && ev.target.files[0];
              ev.target.value = "";
              if (!f) return;
              say("Salvando a foto…");
              resizePhoto(f)
                .then((url) => save({ photo: url }))
                .then(
                  () => say("Foto salva."),
                  () => say("Não consegui usar essa imagem. Tenta outra (JPG ou PNG).", true),
                );
            }}
          />
          <label className="pg-btn-line" htmlFor="pg-photo-in">
            Trocar foto
          </label>
          <button
            className="pg-btn-text"
            type="button"
            hidden={!profile?.photo}
            onClick={() => {
              say("Removendo…");
              save({ photo: null }).then(
                () => say("Foto removida."),
                () => say("Não consegui remover agora. Tenta de novo daqui a pouco.", true),
              );
            }}
          >
            Remover foto
          </button>
        </div>
        <div className="pg-profile-fields">
          <div className="pg-field">
            <label className="pg-field-label" htmlFor="pg-nick">
              Apelido
            </label>
            <div className="pg-field-row">
              <input
                type="text"
                id="pg-nick"
                maxLength={32}
                autoComplete="nickname"
                placeholder="Como você vai aparecer na wiki"
                value={nick ?? profile?.nickname ?? ""}
                onChange={(ev) => setNick(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") saveNick();
                }}
              />
              <button className="pg-btn" type="button" disabled={busy} onClick={saveNick}>
                Salvar
              </button>
            </div>
          </div>
          <div className="pg-field" id="username">
            <span className="pg-field-label">Username</span>
            <div className="pg-field-row pg-un-row">
              {profile?.username ? (
                <span className="pg-field-value pg-un-name">@{profile.username}</span>
              ) : (
                <span className="pg-field-value pg-un-none">{profile ? "Você ainda não escolheu." : "…"}</span>
              )}
              <button className="pg-btn" type="button" disabled={!profile} onClick={() => setUnOpen(true)}>
                {profile?.username ? "Trocar" : "Escolher"}
              </button>
            </div>
            <span className="pg-un-hint">
              {profile?.username
                ? lockedUntil
                  ? "Dá pra trocar de novo a partir de " + fmtDay(lockedUntil) + "."
                  : "Nome único da sua conta. Dá pra trocar uma vez a cada 30 dias."
                : "Nome único da sua conta (o apelido pode repetir, o username não)."}
            </span>
          </div>
          {showUn && (
            <UsernameDialog
              onClose={() => {
                setUnOpen(false);
                setUnDismissed(true);
              }}
            />
          )}
          <div className="pg-field">
            <span className="pg-field-label">E-mail</span>
            <span className="pg-field-value">{user.email}</span>
          </div>
          <p className={"pg-profile-status" + (status.bad ? " is-bad" : "")} role="status">
            {status.msg}
          </p>
        </div>
      </div>
    </Panel>
  );
}

// Suas sugestões — as novidades (resposta ou decisão depois da última visita) ganham destaque;
// abrir a página conta como visto e apaga o aviso do avatar.
function Suggestions({ user }: { user: AuthUser }) {
  const { loadProfile, save, clearUnread } = useAccount();
  const [state, setState] = useState<{ list: WikiSuggestion[]; seen: string } | "loading" | "error">("loading");
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadProfile(), fetchMySuggestions(user.email)]).then(
      ([d, list]) => {
        if (cancelled) return;
        setState({ list, seen: d.seenAt || "" });
        save({ seenAt: new Date().toISOString() }).then(clearUnread, () => {});
      },
      () => {
        if (!cancelled) setState("error");
      },
    );
    return () => {
      cancelled = true;
    };
    // Uma leitura por abertura da página (as funções do contexto mudam a cada gravação).
  }, [user.email]);

  return (
    <Panel id="sugestoes" title="Suas sugestões">
      <div className="pg-sug-list">
        {state === "loading" && <p className="pg-empty">Carregando…</p>}
        {state === "error" && <p className="pg-empty">Não consegui carregar suas sugestões agora. Tenta de novo daqui a pouco.</p>}
        {typeof state === "object" && state.list.length === 0 && (
          <p className="pg-empty">Você ainda não enviou nenhuma sugestão. Dá pra sugerir alterações em qualquer página da wiki.</p>
        )}
        {typeof state === "object" && newestFirst(state.list).map((s, i) => <SuggestionItem key={i} s={s} isNew={isNewSuggestion(s, state.seen)} />)}
      </div>
    </Panel>
  );
}

function SuggestionItem({ s, isNew }: { s: WikiSuggestion; isNew: boolean }) {
  const [label, cls] = suggestionStatus(s);
  const meta = [
    s.tab && s.tab !== "Geral" ? s.tab : "",
    s.createdAt ? new Date(s.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }) : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <article className={"pg-sug" + (isNew ? " is-new" : "")}>
      <div className="pg-sug-head">
        {s.wikiId ? (
          <Link className="pg-sug-page" to={`/wiki/${encodeURIComponent(s.wikiId)}`}>
            {s.pageTitle || "(página)"}
          </Link>
        ) : (
          <span className="pg-sug-page">{s.pageTitle || "(página)"}</span>
        )}
        <span className="pg-sug-tags">
          {isNew && <span className="pg-sug-new">Novidade</span>}
          <span className={"pg-sug-status " + cls}>{label}</span>
        </span>
      </div>
      {meta && <div className="pg-sug-meta">{meta}</div>}
      <p className="pg-sug-text">{s.text || ""}</p>
      {s.reply ? (
        <div className="pg-sug-reply">
          <span className="pg-sug-reply-label">Resposta do autor</span>
          <p>{s.reply}</p>
        </div>
      ) : (
        <p className="pg-sug-none">Ainda sem resposta.</p>
      )}
    </article>
  );
}

// Favoritos — marcados com o botão "Favoritar" no alto de cada página.
function Favorites() {
  const { profile, save } = useAccount();
  const index = useWikiIndex();
  const [removing, setRemoving] = useState<string | null>(null);
  const favs = profile && index ? (profile.favorites || []).filter((id) => index[id]) : null;
  return (
    <Panel id="favoritos" title="Favoritos">
      <div className="pg-fav-list">
        {!favs || !index ? (
          <p className="pg-empty">Carregando…</p>
        ) : favs.length === 0 ? (
          <p className="pg-empty">Nenhuma página favorita ainda. Use o botão “Favoritar”, com a estrela, no alto de qualquer página.</p>
        ) : (
          favs.map((id) => {
            const e = index[id];
            return (
              <div key={id} className="pg-fav-row">
                <Link className="pg-fav-link" to={`/wiki/${encodeURIComponent(id)}`}>
                  {e.cover ? (
                    <img className="pg-fav-thumb" src={e.cover} alt="" loading="lazy" style={{ objectPosition: objPos(e.coverFocus) }} />
                  ) : (
                    <span className="pg-fav-thumb is-empty" aria-hidden="true">
                      {(e.title || "?").charAt(0)}
                    </span>
                  )}
                  <span className="pg-fav-text">
                    <span className="pg-fav-title">{e.title || "(sem título)"}</span>
                    {e.type && <span className="pg-fav-type">{e.type}</span>}
                  </span>
                </Link>
                <button
                  className="pg-btn-text"
                  type="button"
                  aria-label={"Tirar " + (e.title || "página") + " dos favoritos"}
                  disabled={removing === id}
                  onClick={() => {
                    setRemoving(id);
                    save({ favorite: { id, on: false } }).then(
                      () => setRemoving(null),
                      () => setRemoving(null),
                    );
                  }}
                >
                  Tirar
                </button>
              </div>
            );
          })
        )}
      </div>
    </Panel>
  );
}

// Seus acessos — trechos restritos liberados pro e-mail do leitor. A consulta já pede só os
// itens com o e-mail dele em "permitidos": as regras não filtram, só aprovam ou recusam.
function Accesses({ user }: { user: AuthUser }) {
  const index = useWikiIndex();
  const [rows, setRows] = useState<{ pageId: string; item: WikiRestritoItem }[] | "error" | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchMyAccesses(user.email).then(
      (r) => {
        if (!cancelled) setRows(r);
      },
      (err) => {
        if (cancelled) return;
        setRows("error");
        // Na primeira vez, o Firestore pede um índice de grupo de coleção — a mensagem traz o link.
        console.warn("Seus acessos:", err && err.message);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [user.email]);

  const groups = Array.isArray(rows) && index ? groupAccesses(rows, index) : null;
  return (
    <Panel id="acessos" title="Seus acessos">
      <p className="pg-profile-note">Trechos restritos que o autor liberou pra sua conta. Eles aparecem dentro das próprias páginas.</p>
      <div className="pg-acc-list">
        {rows === "error" ? (
          <p className="pg-empty">Não consegui carregar seus acessos agora. Tenta de novo daqui a pouco.</p>
        ) : !groups || !index ? (
          <p className="pg-empty">Carregando…</p>
        ) : groups.length === 0 ? (
          <p className="pg-empty">Nenhum conteúdo restrito liberado pra sua conta ainda.</p>
        ) : (
          groups.map((g) => (
            <div key={g.pageId} className="pg-acc-row">
              <Link className="pg-sug-page" to={`/wiki/${encodeURIComponent(g.pageId)}`}>
                {index[g.pageId].title || "(página)"}
              </Link>
              <ul className="pg-acc-items">
                {g.items.map((it, i) => (
                  <li key={i}>{accessLabel(it)}</li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
