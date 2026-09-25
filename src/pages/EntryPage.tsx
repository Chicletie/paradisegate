import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { fetchPublicDoc } from "../lib/api";
import { usePgBody } from "../lib/usePgBody";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";
import { EntryView } from "./EntryView";
import { SeasonView } from "./SeasonView";
import { ErrorPage } from "./ErrorPage";
import type { WikiPublicDoc } from "../types";

type LoadState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error" }
  | { status: "ready"; data: WikiPublicDoc };

/**
 * Busca `wikiPublic/{slug}` e mostra a entrada ou a temporada — porta do trecho final de
 * wikiCoreBoot na wiki original: `data.kind === "temporada" ? renderSeason :
 * renderEntry`, com as mesmas mensagens de erro.
 */
export function EntryPage() {
  usePgBody();
  const { slug } = useParams<{ slug: string }>();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setState({ status: "loading" });
    fetchPublicDoc(slug)
      .then((data) => {
        if (!cancelled) setState(data ? { status: "ready", data } : { status: "not-found" });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const readyTitle = state.status === "ready" ? state.data.title : null;
  useEffect(() => {
    if (readyTitle !== null) document.title = readyTitle || "wiki";
  }, [readyTitle]);

  // Documento de escrito aberto pelo endereço cru: vai pro endereço dele.
  if (state.status === "ready" && state.data.kind === "escrito") {
    return <Navigate to={"/wiki/_escritos/" + encodeURIComponent(state.data.id)} replace />;
  }
  if (state.status === "not-found") {
    return <ErrorPage message="Essa página não existe mais (o link pode ter sido despublicado)." />;
  }
  if (state.status === "error") {
    return (
      <ErrorPage message="Não consegui abrir essa página. Pode ser um link inválido ou removido, ou uma falha temporária — tenta de novo, ou volta pro início." />
    );
  }

  return (
    <>
      <PgHeader />
      <main className="pg-page-main">
        {state.status === "loading" ? (
          <div className="card">
            <div className="empty">Carregando…</div>
          </div>
        ) : state.data.kind === "temporada" ? (
          <SeasonView data={state.data} wikiId={slug!} />
        ) : state.data.kind === "escrito" ? null : (
          <EntryView data={state.data} wikiId={slug!} />
        )}
      </main>
      <PgFooter />
    </>
  );
}
