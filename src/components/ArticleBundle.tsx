import { Fragment } from "react";
import { RenderMarkdown, SpoilerBlock, footnotesOf, markdownHeadings, mdInline, revealInTabs } from "../lib/markdown";
import { QuoteEpigraph } from "../lib/quotes";
import type { WikiArticleBundle, WikiCitation } from "../types";
import { SwapBody } from "./EntryActions";
import { RestritoBlocks } from "./RestritoPlace";

function slugifyAnchor(s: string | undefined, i: string): string {
  return (
    "sec-" +
    i +
    "-" +
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 30)
  );
}

interface TocItem {
  id: string;
  label: string;
  /** Subtítulos da seção (### e ####), já numerados; os com {-} não entram. */
  subs?: { id: string; label: string; num: string; deep: boolean }[];
}

/** Subtítulos de um texto pro índice: o nível mais alto da seção vira 1.1, 1.2…; o de baixo, 1.1.1. */
function tocSubs(text: string | undefined, base: string, n: number): TocItem["subs"] {
  const hs = markdownHeadings(text, base).filter((h) => h.toc);
  if (!hs.length) return undefined;
  const top = Math.min(...hs.map((h) => h.level));
  let a = 0,
    b = 0;
  return hs.map((h) => {
    const deep = h.level > top;
    if (deep) b++;
    else {
      a++;
      b = 0;
    }
    return { id: h.id, label: h.text, num: n + "." + a + (deep ? "." + b : ""), deep };
  });
}

/** Abre a seção recolhida onde está o alvo (o próprio <details> ou um título dentro dele). */
function openFor(id: string) {
  const target = document.getElementById(id);
  const d = target instanceof HTMLDetailsElement ? target : target?.closest("details");
  if (d) d.open = true;
  revealInTabs(id);
}

/**
 * Porta de buildArticle na wiki original — usado tanto pra "Geral" quanto pra cada
 * variante de obra (mesma forma de dado, cada uma vira uma aba). A epígrafe (citação em
 * destaque da entrada) abre toda aba de texto, igual ao original.
 */
export function ArticleBundle({
  bundle,
  anchorPrefix,
  epigraph,
  extraToc = [],
}: {
  bundle: WikiArticleBundle;
  anchorPrefix: string;
  epigraph?: WikiCitation | null;
  extraToc?: { id: string; label: string }[];
}) {
  const longFields = (bundle.fields || []).filter((f) => f.type === "nota");
  const sections = bundle.sections || [];
  // Restrito no lugar só na aba Geral (as variantes de obra seguem com o restrito no fim).
  const geral = anchorPrefix === "geral-";
  const lfIds = longFields.map((f, i) => slugifyAnchor(f.key, anchorPrefix + "lf" + i));
  const scIds = sections.map((s, i) => slugifyAnchor(s.title || "Seção", anchorPrefix + "sc" + i));
  const tocEntries: TocItem[] = [
    ...longFields.map((f, i) => ({ id: lfIds[i], label: f.key, subs: tocSubs(f.value, lfIds[i] + "-", i + 1) })),
    ...sections.map((s, i) => ({ id: scIds[i], label: s.title || "Seção", subs: tocSubs(s.body, scIds[i] + "-", longFields.length + i + 1) })),
    ...extraToc,
  ];

  // Notas de rodapé da aba, na ordem do texto: cada bloco começa a contar de onde o anterior
  // parou, e a lista fica no fim.
  const fnPrefix = anchorPrefix;
  const texts = [bundle.body, ...longFields.map((f) => f.value), ...sections.map((s) => s.body)];
  const notesPer = texts.map((t) => footnotesOf(t));
  const starts: number[] = [];
  notesPer.reduce((acc, list, i) => ((starts[i] = acc), acc + list.length), 0);
  // nota de um bloco inteiro em spoiler fica na tarja também na lista
  const blockAt = [undefined, ...longFields.map((f) => (f.vis === "spoiler" ? f.at || true : undefined)), ...sections.map((s) => (s.vis === "spoiler" ? s.at || true : undefined))];
  const notes = notesPer.flatMap((list, i) => list.map((n) => ({ text: n.text, at: n.at || blockAt[i] })));
  const md = (text: string | undefined, i: number, base?: string) => <RenderMarkdown text={text} anchorBase={base} fnPrefix={fnPrefix} fnStart={starts[i]} />;

  return (
    <div className="article">
      {epigraph && <QuoteEpigraph q={epigraph} />}
      {/* O "resumo" antigo não aparece mais (o autor trocou pela epígrafe e pela visão geral);
          página publicada antes ainda pode trazer o campo, que fica de fora. */}
      {bundle.body && md(bundle.body, 0)}
      {tocEntries.length + tocEntries.reduce((n, t) => n + (t.subs?.length || 0), 0) > 1 && (
        <div className="toc">
          <div className="toc-head">Índice</div>
          <ol>
            {tocEntries.map((t) => (
              <li key={t.id}>
                {/* Seção recolhida reabre antes de rolar até ela (senão só aparece o título). */}
                <a href={`#${t.id}`} onClick={() => openFor(t.id)}>
                  {t.label}
                </a>
                {t.subs && (
                  <ol className="toc-sub">
                    {t.subs.map((s) => (
                      <li key={s.id} className={s.deep ? "toc-deep" : undefined}>
                        <a href={`#${s.id}`} onClick={() => openFor(s.id)}>
                          <span className="toc-num">{s.num}</span>
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
      {longFields.map((f, i) => {
        const id = lfIds[i];
        return (
          <Fragment key={id}>
            {geral && <RestritoBlocks area="notas" index={i} />}
            {/* Dobra igual às seções (2026-09-29): pro leitor, bloco "nota" e seção são a mesma coisa. */}
            <details className="wiki-section" id={id} open>
            <summary className="cathead">{f.key}</summary>
            {/* Troca confidencial só na aba Geral: variantes de obra não têm versão confidencial. */}
            <SwapBody slot={anchorPrefix === "geral-" ? "lf:" + i : undefined} fieldKey={f.key}>
              {f.vis === "spoiler" ? <SpoilerBlock at={f.at}>{md(f.value, 1 + i, id + "-")}</SpoilerBlock> : md(f.value, 1 + i, id + "-")}
            </SwapBody>
            </details>
          </Fragment>
        );
      })}
      {geral && <RestritoBlocks area="notas" index={longFields.length} />}
      {sections.map((s, i) => {
        const id = scIds[i];
        return (
          <Fragment key={id}>
          {geral && <RestritoBlocks area="secoes" index={i} />}
          <details className="wiki-section" id={id} open>
            <summary className="cathead">
              {s.title || "Seção"}
            </summary>
            {s.vis === "spoiler" ? (
              <SpoilerBlock at={s.at}>{md(s.body, 1 + longFields.length + i, id + "-")}</SpoilerBlock>
            ) : (
              md(s.body, 1 + longFields.length + i, id + "-")
            )}
          </details>
          </Fragment>
        );
      })}
      {geral && <RestritoBlocks area="secoes" index={sections.length} />}
      {notes.length > 0 && (
        <details className="wiki-section md-notes" id={anchorPrefix + "notas"} open>
          <summary className="cathead">Notas</summary>
          <ol>
            {notes.map((n, i) => (
              <li key={i} id={"fn-" + fnPrefix + (i + 1)}>
                {/* nota que estava num spoiler continua na tarja aqui */}
                {mdInline(n.at ? "||" + (n.at === true ? "" : "@{" + n.at + "} ") + n.text + "||" : n.text)}{" "}
                <a className="md-fn-back" href={"#fnref-" + fnPrefix + (i + 1)} aria-label="voltar ao texto">
                  ↑
                </a>
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
