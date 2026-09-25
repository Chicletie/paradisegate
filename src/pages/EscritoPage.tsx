import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchPublicDoc } from "../lib/api";
import { usePgBody } from "../lib/usePgBody";
import { pgShortDate } from "../lib/format";
import { RenderMarkdown, SpoilerBlock } from "../lib/markdown";
import { canonLabel, kindLabel, originLabel } from "../lib/escritos";
import { memberHref } from "../lib/member";
import { PgHeader } from "../components/PgHeader";
import { PgFooter } from "../components/PgFooter";
import { PageObrasProvider, SpoilerProgressBar } from "../components/SpoilerProgress";
import { ErrorPage } from "./ErrorPage";
import type { WikiWritingDoc } from "../types";

type LoadState = { status: "loading" } | { status: "not-found" } | { status: "error" } | { status: "ready"; data: WikiWritingDoc };

/**
 * Página própria de um escrito (`/wiki/_escritos/<id>`, documento `wikiPublic/escrito-<id>`):
 * conto, crônica, narração, causo… com tipo, marcas, quem escreveu e as páginas em que aparece.
 */
export function EscritoPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  usePgBody();

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    fetchPublicDoc("escrito-" + id)
      .then((data) => {
        if (cancelled) return;
        setState(data && data.kind === "escrito" ? { status: "ready", data } : { status: "not-found" });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const title = state.status === "ready" ? state.data.title : null;
  useEffect(() => {
    if (title !== null) document.title = (title || "Escrito") + " · Paradise Gate";
  }, [title]);

  if (state.status === "not-found") return <ErrorPage message="Esse escrito não existe mais (o link pode ter sido despublicado)." />;
  if (state.status === "error") return <ErrorPage message="Não consegui abrir esse escrito agora. Tente de novo daqui a pouco, ou volte pro início." />;

  return (
    <>
      <PgHeader />
      <main className="pg-page-main">
        {state.status === "loading" ? (
          <div className="card">
            <div className="empty">Carregando…</div>
          </div>
        ) : (
          <EscritoView data={state.data} />
        )}
      </main>
      <PgFooter />
    </>
  );
}

export function EscritoView({ data }: { data: WikiWritingDoc }) {
  const marks = [canonLabel(data.canone), originLabel(data.origem)].filter(Boolean);
  const pages = data.pages || [];
  const text = <RenderMarkdown text={data.body} />;
  return (
    <PageObrasProvider obras={data.spoilerObras}>
      <article className="card pg-escrito">
        <div className="crumb">
          <Link to="/wiki/_escritos">Escritos</Link>
          {data.tipo ? (
            <>
              {" › "}
              <Link to={"/wiki/_escritos?tipo=" + encodeURIComponent(data.tipo)}>{kindLabel(data.tipo)}</Link>
            </>
          ) : null}
        </div>
        <h1>{data.title || "(sem título)"}</h1>
        <p className="pg-escrito-meta">
          {[kindLabel(data.tipo), data.date ? pgShortDate(data.date) : ""].filter(Boolean).join(" · ")}
          {data.autor ? (
            <>
              {" · por "}
              <Link to={memberHref(data.autor)}>{"@" + data.autor}</Link>
            </>
          ) : null}
        </p>
        {(marks.length > 0 || (data.tags || []).length > 0) && (
          <p className="pg-escrito-marks">
            {data.canone && (
              <Link className="pg-escrito-mark" to={"/wiki/_escritos?canone=" + encodeURIComponent(data.canone)}>
                {canonLabel(data.canone)}
              </Link>
            )}
            {data.origem && (
              <Link className="pg-escrito-mark" to={"/wiki/_escritos?origem=" + encodeURIComponent(data.origem)}>
                {originLabel(data.origem)}
              </Link>
            )}
            {(data.tags || []).map((t) => (
              <Link key={t} className="tag" to={"/wiki/_escritos?tag=" + encodeURIComponent(t)}>
                {"#" + t}
              </Link>
            ))}
          </p>
        )}

        <SpoilerProgressBar />

        <div className="pg-escrito-body">{data.vis === "spoiler" ? <SpoilerBlock at={data.at}>{text}</SpoilerBlock> : text}</div>

        {pages.length > 0 && (
          <p className="pg-escrito-pages">
            {"Aparece em "}
            {pages.map((p, i) => (
              <span key={i}>
                {i > 0 && (i === pages.length - 1 ? " e " : ", ")}
                {p.id ? <Link to={`/wiki/${encodeURIComponent(p.id)}`}>{p.name}</Link> : p.name}
              </span>
            ))}
          </p>
        )}
      </article>
    </PageObrasProvider>
  );
}
