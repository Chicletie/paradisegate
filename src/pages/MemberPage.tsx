import { Fragment, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePgBody } from "../lib/usePgBody";
import { useAccount } from "../lib/account";
import { fetchMemberCard } from "../lib/api";
import { useWikiIndex, useWikiObras } from "../lib/wikiIndex";
import { writingsBy, writingsFromIndex } from "../lib/escritos";
import { PageObrasProvider } from "../components/SpoilerProgress";
import { WritingCard } from "./EscritosPage";
import { favoritePages, memberCards, memberHandle, pagesOfMember, ROLES_SHOWN, shownRoles, sinceLabel, type MemberPage as Page, type MemberRole } from "../lib/member";
import { objPos } from "../lib/format";
import { mdInline } from "../lib/markdown";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";
import { ArcanaGlyph, PgSectionHead } from "../components/PgIcons";
import { ErrorPage } from "./ErrorPage";
import type { MemberCard, WikiInterpreteOnde } from "../types";

/**
 * Perfil público de um membro do acervo (`/@nome`): quem tem username ganha uma página que o
 * autor pode linkar na wiki com [[@nome]] (ex.: "Intérprete" de um personagem). Mostra só o que
 * a pessoa escolheu mostrar (cartão em wikiUsernames/{nome}) e o que a wiki publicada diz dela.
 * Pensada pro site todo: cada seção é um bloco que só aparece quando tem conteúdo, pra fichas,
 * biblioteca e o que vier do jogo entrarem depois do mesmo jeito.
 */
export function MemberPage() {
  const { handle = "" } = useParams();
  const name = memberHandle(handle);
  if (!name) return <ErrorPage />;
  return <MemberLoader key={name} name={name} />;
}

function MemberLoader({ name }: { name: string }) {
  const [card, setCard] = useState<MemberCard | null | "loading" | "error">("loading");
  usePgBody(card === "loading" ? "loading" : null);
  useEffect(() => {
    let alive = true;
    fetchMemberCard(name).then(
      (c) => alive && setCard(c),
      () => alive && setCard("error"),
    );
    return () => {
      alive = false;
    };
  }, [name]);
  useEffect(() => {
    const nick = card && typeof card === "object" ? card.nickname : "";
    document.title = (nick ? nick + " (@" + name + ")" : "@" + name) + " · Paradise Gate";
  }, [card, name]);

  if (card === "loading")
    return (
      <div className="page">
        <div className="empty">Carregando…</div>
      </div>
    );
  if (card === "error") return <ErrorPage message="Não consegui abrir este perfil agora. Tente de novo daqui a pouco." />;
  if (!card) return <ErrorPage message={"Ninguém assina com o nome @" + name + " no acervo."} />;
  return <MemberView name={name} card={card} />;
}

function MemberView({ name, card }: { name: string; card: MemberCard }) {
  usePgBody();
  const index = useWikiIndex();
  const { user } = useAccount();
  const mine = !!user && user.uid === card.uid;
  const pages = index ? shownRoles(pagesOfMember(index, name), card) : null;
  const favs = index ? favoritePages(index, card) : null;
  const obras = useWikiObras();
  const writings = index ? writingsBy(writingsFromIndex(index), name) : [];
  const since = sinceLabel(card.since);
  const cartas = memberCards(card);
  const initial = (card.nickname || name).charAt(0).toUpperCase();

  return (
    <>
      <PgHeader />
      <main className="pg-member">
        <section className="pg-member-card" aria-labelledby="pg-member-name">
          <span className={"pg-member-avatar" + (card.photo ? " has-photo" : "")} aria-hidden="true">
            {card.photo ? <img src={card.photo} alt="" /> : <span>{initial}</span>}
          </span>
          <div className="pg-member-id">
            <h1 id="pg-member-name" className="pg-member-name">
              {card.nickname || "@" + name}
            </h1>
            {card.nickname && <p className="pg-member-handle">@{name}</p>}
            {cartas.length > 0 && (
              <ul className="pg-member-cards" aria-label={cartas.length > 1 ? "Cartas do tarô" : "Carta do tarô"}>
                {cartas.map((c) => (
                  <li key={c.label} className="pg-member-arcana">
                    <ArcanaGlyph glyph={c.glyph} className="pg-member-arcana-glyph" />
                    <span>{c.label}</span>
                  </li>
                ))}
              </ul>
            )}
            {since && <p className="pg-member-since">{since}</p>}
          </div>
          {card.bio && <p className="pg-member-bio">{card.bio}</p>}
          {mine && (
            <Link className="pg-member-edit" to="/wiki/_perfil#publico">
              Editar meu perfil público
            </Link>
          )}
        </section>

        <Roles roles={pages} empty={mine ? "Quando o autor puser você como intérprete de um personagem na wiki, ele aparece aqui." : null} />
        {writings.length > 0 && (
          <section className="pg-panel pg-member-sec" id="escritos" aria-labelledby="pg-member-escritos">
            <PgSectionHead text="Escritos" id="pg-member-escritos" />
            <PageObrasProvider obras={obras}>
              <div className="pg-wgrid">
                {writings.map((w) => (
                  <WritingCard key={w.id} w={w} />
                ))}
              </div>
            </PageObrasProvider>
          </section>
        )}
        {card.showFavorites && <Block id="favoritos" title="Favoritos na wiki" pages={favs} empty="Nenhuma página favorita ainda." />}
      </main>
      <PgFooter />
    </>
  );
}

/** "em Paradise Gate: Genesis & Paradise Gate: Apocalipse", "em …: Genesis (durante A Testemunha)",
 * com link pra página da temporada e pra sessão (#sessao-<id>) quando publicadas. */
function RoleWhere({ em }: { em: WikiInterpreteOnde[] }) {
  const list = em.filter((o) => o && o.titulo);
  if (!list.length) return null;
  const href = (id: string) => "/wiki/" + encodeURIComponent(id);
  return (
    <span className="pg-member-tile-where">
      {"em "}
      {list.map((o, i) => (
        <Fragment key={i}>
          {i > 0 && " & "}
          {o.id ? <Link to={href(o.id)}>{o.titulo}</Link> : o.titulo}
          {o.sessao && (
            <>
              {" (durante "}
              {o.id ? <Link to={href(o.id) + "#sessao-" + encodeURIComponent(o.sessao.id)}>{o.sessao.titulo}</Link> : o.sessao.titulo}
              {")"}
            </>
          )}
        </Fragment>
      ))}
    </span>
  );
}

/** Personagens que interpreta: os primeiros na ordem escolhida e "ver todos" pro resto. */
function Roles({ roles, empty }: { roles: MemberRole[] | null; empty: string | null }) {
  const [all, setAll] = useState(false);
  if (roles && !roles.length && !empty) return null;
  const shown = roles && !all ? roles.slice(0, ROLES_SHOWN) : roles;
  return (
    <section className="pg-panel pg-member-sec" id="personagens" aria-labelledby="pg-member-personagens">
      <PgSectionHead text="Personagens que interpreta" id="pg-member-personagens" />
      {!roles || !shown ? (
        <p className="pg-empty">Carregando…</p>
      ) : !roles.length ? (
        <p className="pg-empty">{empty}</p>
      ) : (
        <>
          <ul className="pg-member-grid">
            {shown.map(({ id: pid, e, em, textos }) => (
              <li key={pid} className="pg-member-role">
                <Link className="pg-member-tile" to={"/wiki/" + encodeURIComponent(pid)}>
                  {e.cover ? (
                    <img className="pg-member-cover" src={e.cover} alt="" loading="lazy" style={{ objectPosition: objPos(e.coverFocus) }} />
                  ) : (
                    <span className="pg-member-cover is-empty" aria-hidden="true">
                      {(e.title || "?").charAt(0)}
                    </span>
                  )}
                  <span className="pg-member-tile-title">{e.title || "(sem título)"}</span>
                </Link>
                {textos.length ? (
                  <span className="pg-member-tile-where">
                    {textos.map((t, i) => (
                      <Fragment key={i}>
                        {i > 0 && " · "}
                        {mdInline(t)}
                      </Fragment>
                    ))}
                  </span>
                ) : (
                  <RoleWhere em={em} />
                )}
              </li>
            ))}
          </ul>
          {roles.length > ROLES_SHOWN && (
            <button className="pg-member-more" type="button" aria-expanded={all} onClick={() => setAll(!all)}>
              {all ? "Mostrar menos" : "Ver todos (" + roles.length + ")"}
            </button>
          )}
        </>
      )}
    </section>
  );
}

/** Um bloco do perfil: some quando não tem nada e ninguém precisa saber que está vazio. */
function Block({ id, title, pages, empty, grid }: { id: string; title: string; pages: Page[] | null; empty: string | null; grid?: boolean }) {
  if (pages && !pages.length && !empty) return null;
  return (
    <section className="pg-panel pg-member-sec" id={id} aria-labelledby={"pg-member-" + id}>
      <PgSectionHead text={title} id={"pg-member-" + id} />
      {!pages ? (
        <p className="pg-empty">Carregando…</p>
      ) : !pages.length ? (
        <p className="pg-empty">{empty}</p>
      ) : grid ? (
        <ul className="pg-member-grid">
          {pages.map(({ id: pid, e }) => (
            <li key={pid}>
              <Link className="pg-member-tile" to={`/wiki/${encodeURIComponent(pid)}`}>
                {e.cover ? (
                  <img className="pg-member-cover" src={e.cover} alt="" loading="lazy" style={{ objectPosition: objPos(e.coverFocus) }} />
                ) : (
                  <span className="pg-member-cover is-empty" aria-hidden="true">
                    {(e.title || "?").charAt(0)}
                  </span>
                )}
                <span className="pg-member-tile-title">{e.title || "(sem título)"}</span>
                {e.type && <span className="pg-member-tile-type">{e.type}</span>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="pg-fav-list">
          {pages.map(({ id: pid, e }) => (
            <div key={pid} className="pg-fav-row">
              <Link className="pg-fav-link" to={`/wiki/${encodeURIComponent(pid)}`}>
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
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
