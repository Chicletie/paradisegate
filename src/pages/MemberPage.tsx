import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePgBody } from "../lib/usePgBody";
import { useAccount } from "../lib/account";
import { fetchMemberCard } from "../lib/api";
import { useWikiIndex } from "../lib/wikiIndex";
import { favoritePages, memberHandle, pagesOfMember, sinceLabel, type MemberPage as Page } from "../lib/member";
import { objPos } from "../lib/format";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";
import { PgSectionHead } from "../components/PgIcons";
import { ErrorPage } from "./ErrorPage";
import type { MemberCard } from "../types";

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
  const pages = index ? pagesOfMember(index, name) : null;
  const favs = index ? favoritePages(index, card) : null;
  const since = sinceLabel(card.since);
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
            {since && <p className="pg-member-since">{since}</p>}
          </div>
          {card.bio && <p className="pg-member-bio">{card.bio}</p>}
          {mine && (
            <Link className="pg-member-edit" to="/wiki/_perfil#publico">
              Editar meu perfil público
            </Link>
          )}
        </section>

        <Block id="personagens" title="Personagens que interpreta" pages={pages} empty={mine ? "Quando o autor citar você numa página da wiki como [[@" + name + "]], ela aparece aqui." : null} grid />
        {card.showFavorites && <Block id="favoritos" title="Favoritos na wiki" pages={favs} empty="Nenhuma página favorita ainda." />}
      </main>
      <PgFooter />
    </>
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
