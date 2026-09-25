import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { QuoteDialogueLine, QuoteRef, WikiCitation } from "../types";
import { RenderMarkdown, SpoilerBlock } from "./markdown";

// Porta de quoteNorm/quoteRefNode/quoteDialogue/quoteAttrKids/quoteBody/quoteEpigraph em
// a wiki original — citações: falas, diálogos em roteiro, trechos e narrações do mestre.

/** Snapshots publicados antes das citações com papel trazem só {text,group,note,
 * contextTitle,contextId} — normaliza pro formato novo, como fala da própria página. */
export function quoteNorm(q: WikiCitation | null | undefined, pageTitle: string): WikiCitation | null {
  if (!q) return null;
  if (q.kind) return q;
  return {
    ...q,
    kind: "fala",
    role: "fala",
    speaker: pageTitle
      ? { name: pageTitle, id: null }
      : q.speakerTitle
        ? { name: q.speakerTitle, id: q.speakerId || null }
        : null,
    where: q.contextTitle ? { name: q.contextTitle, id: q.contextId || null } : null,
    to: [],
    lines: [],
  };
}

function QuoteRefNode({ r }: { r: QuoteRef }) {
  return r.id ? <Link to={`/wiki/${encodeURIComponent(r.id)}`}>{r.name}</Link> : <span>{r.name}</span>;
}

/** Diálogo em forma de roteiro: nome à esquerda, fala à direita, rubrica "(rindo)" apagada,
 * linhas sem falante (direção de cena) atravessando as duas colunas. */
export function QuoteDialogue({ q, className }: { q: WikiCitation; className?: string }) {
  return (
    <div className={"wb-dialogue" + (className ? " " + className : "")}>
      {(q.lines || []).map((l: QuoteDialogueLine, i) =>
        !l.who ? (
          <p key={i} className="wb-dl-dir">
            {l.text}
          </p>
        ) : (
          <p key={i} className="wb-dl-line">
            <span className="wb-dl-who">
              <QuoteRefNode r={{ name: l.who, id: l.id }} />
            </span>
            <span className="wb-dl-say">
              {l.aside && <span className="wb-dl-aside">{"(" + l.aside + ") "}</span>}
              {l.text}
            </span>
          </p>
        ),
      )}
    </div>
  );
}

/** "Alucard, sussurrando, para Luke · Ruínas de Vel · Livro I" — quem, como e pra quem
 * primeiro; onde e a obra depois do ponto. `omitSpeaker` evita repetir o nome na lista da
 * própria página de quem falou. */
export function quoteAttrKids(q: WikiCitation, omitSpeaker: boolean): ReactNode[] {
  const first: ReactNode[][] = [];
  if (q.kind !== "dialogo" && q.speaker?.name && !omitSpeaker) first.push([<QuoteRefNode key="sp" r={q.speaker} />]);
  if (q.how) first.push([q.how]);
  if (q.to && q.to.length) {
    const t: ReactNode[] = ["para "];
    q.to.forEach((r, i) => {
      if (i) t.push(i === q.to!.length - 1 ? " e " : ", ");
      t.push(<QuoteRefNode key={i} r={r} />);
    });
    first.push(t);
  }
  let kids: ReactNode[] = [];
  first.forEach((bits, i) => {
    if (i) kids.push(", ");
    kids = kids.concat(bits);
  });
  const second: ReactNode[] = [];
  if (q.where?.name) second.push(<QuoteRefNode key="wh" r={q.where} />);
  if (q.group) second.push(q.group);
  second.forEach((b) => {
    if (kids.length) kids.push(" · ");
    kids.push(b);
  });
  return kids;
}

export const narrSeal = (q: WikiCitation) => "narração de " + (q.narr === "livro" ? "livro" : "mesa");

/** Narração do mestre: prosa normal com parágrafos e links, sem aspas, com o selo em cima. */
export function QuoteNarration({ q }: { q: WikiCitation }) {
  return (
    <div className="cit-narr">
      <span className="cit-seal">{narrSeal(q)}</span>
      <RenderMarkdown text={q.text} />
    </div>
  );
}

export function QuoteBody({ q }: { q: WikiCitation }) {
  if (q.kind === "narracao") return <QuoteNarration q={q} />;
  if (q.kind === "dialogo") return <QuoteDialogue q={q} />;
  return <div className="cit-text">{"“" + (q.text || "") + "”"}</div>;
}

/** Epígrafe: a citação em destaque da entrada, antes da visão geral — aspas grandes, texto em
 * itálico, autoria alinhada à direita. */
export function QuoteEpigraph({ q }: { q: WikiCitation }) {
  const attr: ReactNode[] = quoteAttrKids(q, false);
  if (q.kind === "narracao") attr.unshift(narrSeal(q), ...(attr.length ? [" · "] : []));
  const inner =
    q.kind === "narracao" ? (
      <blockquote className="wb-epi-text is-narr">
        <RenderMarkdown text={q.text} />
      </blockquote>
    ) : q.kind === "dialogo" ? (
      <QuoteDialogue q={q} />
    ) : (
      <blockquote className="wb-epi-text">
        <p>{q.text || ""}</p>
      </blockquote>
    );
  return (
    <figure className={"wb-epigraph" + (q.kind === "dialogo" ? " is-dialogue" : "")}>
      {q.vis === "spoiler" ? <SpoilerBlock>{inner}</SpoilerBlock> : inner}
      {attr.length > 0 && (
        <figcaption className="wb-epi-attr">
          {"— "}
          {attr.map((a, i) => (
            <Fragment key={i}>{a}</Fragment>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
