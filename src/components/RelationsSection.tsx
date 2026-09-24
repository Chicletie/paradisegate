import type { ReactNode } from "react";
import {
  EntryTimeline,
  FamilyTree,
  RelationGroups,
  affinitiesOf,
  hasFamilyData,
  hasRelations,
  relationsSectionLabel,
} from "../lib/relations";
import { eventSortKey } from "../lib/events";
import { WorkTabs } from "./WorkTabs";
import { LinkCard } from "./LinkCard";
import type { WikiEntryDoc } from "../types";

/**
 * Porta do bloco "Relações + Genealogia + Linha do tempo" de renderEntry (wiki-core.js,
 * arvore): dividem uma seção, em abas quando há mais de uma — Relações primeiro quando
 * existe (no Paradise Gate, sempre agrupada por tipo, nunca o grafo em estrela do Ursprung);
 * Genealogia só existe junto de Relações; Linha do tempo é independente das outras duas.
 */
export function RelationsSection({ data }: { data: WikiEntryDoc }) {
  const links = data.links || [];
  const backlinks = data.backlinks || [];
  const hasRel = hasRelations(links, backlinks);
  const eventsSorted = [...(data.events || [])].sort((a, b) => eventSortKey(a) - eventSortKey(b));
  const label = relationsSectionLabel(links, backlinks, eventsSorted);
  if (!label) return null;

  const panels: { label: string; content: ReactNode }[] = [];
  if (hasRel) panels.push({ label: "Relações", content: <RelationGroups title={data.title} links={links} backlinks={backlinks} /> });
  if (hasFamilyData(links)) panels.push({ label: "Genealogia", content: <FamilyTree title={data.title} links={links} /> });
  if (eventsSorted.length) panels.push({ label: "Linha do tempo", content: <EntryTimeline events={eventsSorted} /> });

  return (
    <>
      <h2 className="cathead" id="relacoes">
        {label}
      </h2>
      <WorkTabs tabs={panels} label={label} />
    </>
  );
}

/** Porta do bloco "Afinidades": vínculos de practice/nature em destaque, separados da lista
 * genérica de Relações. */
export function AffinitiesSection({ data }: { data: WikiEntryDoc }) {
  const groups = affinitiesOf(data.links);
  if (!groups.length) return null;
  return (
    <div className="links-wrap">
      <h2 className="cathead" id="afinidades">
        Afinidades
      </h2>
      {groups.map((g, i) => (
        <div key={g.label}>
          <div className="links-subhead" style={i === 0 ? { marginTop: 0 } : undefined}>
            {g.label}
          </div>
          <div className="links-grid">
            {g.items.map((lk, li) => (
              <LinkCard key={li} link={lk} pageTitle={data.title} titleOnly />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
