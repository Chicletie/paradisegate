import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { pgShortDate } from "../lib/format";
import { quoteNorm } from "../lib/quotes";
import { affinitiesOf, relationsSectionLabel } from "../lib/relations";
import { Infobox } from "../components/Infobox";
import { ArticleBundle } from "../components/ArticleBundle";
import { GalleryPanel } from "../components/GalleryPanel";
import { CitationsPanel } from "../components/CitationsPanel";
import { TaxonomyPanel } from "../components/TaxonomyPanel";
import { RelationsSection, AffinitiesSection } from "../components/RelationsSection";
import { RenderMarkdown, SpoilerBlock, SpoilerSpan } from "../lib/markdown";
import {
  FavoriteButton,
  MySuggestionsHere,
  RestritoSlot,
  SuggestButtons,
  SwapProvider,
  swapWinners,
  useMineToggle,
  useRestrito,
} from "../components/EntryActions";
import type { WikiEntryDoc } from "../types";

/**
 * Página de entrada (`/wiki/<slug>`) — porta de renderEntry em wiki-core.js (arvore). Pra quem
 * entrou: Favoritar, Sugerir alteração e Minhas sugestões aqui no alto, e o conteúdo restrito
 * (wikiRestrito) no fim da página ou trocado no próprio campo (versão confidencial).
 */
export function EntryView({ data, wikiId }: { data: WikiEntryDoc; wikiId: string }) {
  const [activeTab, setActiveTab] = useState(0);
  const restrito = useRestrito(wikiId);
  const [mine, toggleMine] = useMineToggle();
  const epigraph = quoteNorm(data.featuredQuote, data.title);
  // Itens do índice que valem pra página toda (só entram na aba Geral), na ordem do original.
  const sharedToc: { id: string; label: string }[] = [];
  if (data.posts?.length) sharedToc.push({ id: "posts", label: "Posts" });
  const relLabel = relationsSectionLabel(data.links, data.backlinks, data.events);
  if (relLabel) sharedToc.push({ id: "relacoes", label: relLabel });
  if (affinitiesOf(data.links).length) sharedToc.push({ id: "afinidades", label: "Afinidades" });

  const tabPanels: { label: string; content: ReactNode }[] = [
    { label: "Geral", content: <ArticleBundle bundle={data} anchorPrefix="geral-" epigraph={epigraph} extraToc={sharedToc} /> },
  ];
  (data.variants || []).forEach((variant, vi) => {
    tabPanels.push({ label: variant.label || "Versão", content: <ArticleBundle bundle={variant} anchorPrefix={`v${vi}-`} epigraph={epigraph} /> });
  });
  if (data.gallery?.length) tabPanels.push({ label: "Galeria", content: <GalleryPanel gallery={data.gallery} title={data.title} /> });
  if (data.citacoes?.length) tabPanels.push({ label: "Citações", content: <CitationsPanel citacoes={data.citacoes} title={data.title} /> });
  if (data.taxonomy?.length) tabPanels.push({ label: "Taxonomia", content: <TaxonomyPanel taxonomy={data.taxonomy} /> });

  return (
    <SwapProvider items={restrito} winner={swapWinners(data.fields, data.taxonomy)}>
      <article className="card">
        {data.ancestors && data.ancestors.length > 0 && (
          <div className="crumb">
            {data.ancestors.map((c, i) => (
              <span key={c.targetId}>
                {i > 0 && " › "}
                <Link to={`/wiki/${encodeURIComponent(c.targetId)}`}>{c.targetTitle}</Link>
              </span>
            ))}
          </div>
        )}
        <h1>{data.title || "(sem título)"}</h1>
        <div className="pg-entry-meta">
          {(data.type || data.publishedAt) && (
            <span className="pg-entry-type">
              {data.type && <Link to={`/wiki?tipo=${encodeURIComponent(data.type)}`}>{data.type}</Link>}
              {data.publishedAt && (data.type ? " · " : "") + `atualizado em ${pgShortDate(data.publishedAt)}`}
            </span>
          )}
          <div className="pg-entry-actions">
            <FavoriteButton wikiId={wikiId} />
            <SuggestButtons wikiId={wikiId} pageTitle={data.title} tab={tabPanels[activeTab]?.label || "Geral"} onToggleMine={toggleMine} />
          </div>
        </div>

        {tabPanels.length > 1 && (
          <div className="work-tabs" role="tablist" aria-label="Seções da página">
            {tabPanels.map((p, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === activeTab}
                className={"work-tab" + (i === activeTab ? " on" : "")}
                onClick={() => setActiveTab(i)}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Infobox entra só agora (depois das abas): ela flutua à direita a partir daqui, então
            as abas ficam acima dela em vez de presas atrás/embaixo (mesma ordem de wiki-core.js). */}
        <Infobox data={data} />
        {tabPanels.map((p, i) => (
          <div key={i} hidden={i !== activeTab}>
            {p.content}
          </div>
        ))}

        {data.posts && data.posts.length > 0 && (
          <div className="posts-wrap">
            <h2 className="cathead" id="posts">
              Posts
            </h2>
            {data.posts.map((p, i) => (
              <details key={i} className="wiki-section post" open>
                <summary className="post-summary">{(p.date ? `${p.date} · ` : "") + (p.title || "(sem título)")}</summary>
                {p.vis === "spoiler" ? (
                  <SpoilerBlock>
                    <RenderMarkdown text={p.body} />
                  </SpoilerBlock>
                ) : (
                  <RenderMarkdown text={p.body} />
                )}
              </details>
            ))}
          </div>
        )}

        <RelationsSection data={data} />
        <AffinitiesSection data={data} />

        {data.tags && data.tags.length > 0 && (
          <div className="tags">
            {data.tags.map((t, i) =>
              t.vis === "spoiler" ? (
                // Tag spoiler: tarja no texto, sem link pra busca (chip + spoilerSpan no original).
                <span key={i} className="tag">
                  <SpoilerSpan text={"#" + t.text} />
                </span>
              ) : (
                <Link key={i} className="tag" to={`/wiki?q=${encodeURIComponent(t.text)}`}>
                  {"#" + t.text}
                </Link>
              ),
            )}
          </div>
        )}
        <RestritoSlot items={restrito} />
        <MySuggestionsHere wikiId={wikiId} open={mine} />
      </article>
    </SwapProvider>
  );
}
