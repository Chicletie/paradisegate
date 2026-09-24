import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { WikiIndexEvent, WikiLink, LinkStyle } from "../types";
import { fmtEventDate, eventSortKey } from "./events";
import { RenderMarkdown, WikiLinkUpgrade } from "./markdown";
import { LinkCard } from "../components/LinkCard";

// Porta de FAMILY_LABEL_BUCKET/familyOf/buildFamilyTree, EDGE_STYLE/affinitiesOf/
// relNeighbors/buildRelGroups e buildTimelineViz em wiki-core.js (arvore).

export const EDGE_STYLE: Record<LinkStyle, string> = {
  ally: "#3f9d5f",
  rival: "#d05a45",
  family: "#b58a2e",
  romance: "#c9527a",
  friend: "#8a9d3f",
  bond: "#a67c3d",
  faction: "#3f7d94",
  location: "#4a8f7d",
  narrative: "#7d6a9d",
  multiversal: "#8f5cc9",
  neutral: "var(--pg-line-strong)",
};

const FAMILY_LABEL_BUCKET: Record<string, keyof FamilyBuckets> = {
  "é filho(a) de": "parents",
  "é pai/mãe de": "children",
  "irmão/irmã de": "siblings",
  "meio-irmão/meia-irmã de": "halfSiblings",
  "casado(a) com": "spouses",
  "avô/avó de": "grandchildren",
  "neto(a) de": "grandparents",
};

interface FamilyBuckets {
  parents: WikiLink[];
  children: WikiLink[];
  siblings: WikiLink[];
  halfSiblings: WikiLink[];
  spouses: WikiLink[];
  grandparents: WikiLink[];
  grandchildren: WikiLink[];
}

function familyOf(links: WikiLink[] = []): FamilyBuckets {
  const fam: FamilyBuckets = {
    parents: [],
    children: [],
    siblings: [],
    halfSiblings: [],
    spouses: [],
    grandparents: [],
    grandchildren: [],
  };
  links.forEach((lk) => {
    const bucket = lk.label && FAMILY_LABEL_BUCKET[lk.label];
    if (bucket) fam[bucket].push(lk);
  });
  return fam;
}

function rowXs(n: number, cx: number, w: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [cx];
  const span = Math.min(w * 0.86, (n - 1) * 92);
  const x0 = cx - span / 2;
  return Array.from({ length: n }, (_, i) => x0 + i * (span / (n - 1)));
}

// Nó clicável sem <a> dentro do SVG (o próprio wiki-core.js navega no clique do <g>, não com
// um link envolvendo — um <a> do react-router com display:contents dentro de <svg> não
// pinta os filhos em todo navegador).
function TreeNode({ x, y, label, self, targetId }: { x: number; y: number; label: string; self?: boolean; targetId?: string }) {
  const navigate = useNavigate();
  const short = label.length > 16 ? label.slice(0, 15) + "…" : label;
  const w = Math.max(60, label.length * 6.4 + 14);
  const clickable = !self && !!targetId;
  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: clickable ? "pointer" : undefined }}
      onClick={clickable ? () => navigate(`/wiki/${encodeURIComponent(targetId!)}`) : undefined}
    >
      <rect
        x={-w / 2}
        y={-13}
        width={w}
        height={26}
        rx={7}
        fill={self ? "var(--accent-wash)" : "var(--surface)"}
        stroke={self ? "var(--gold)" : "var(--border-strong)"}
      />
      <text className="wb-ft-label" y={4}>
        {short}
      </text>
    </g>
  );
}

export function hasFamilyData(links: WikiLink[] = []): boolean {
  const fam = familyOf(links);
  return !!(
    fam.parents.length ||
    fam.children.length ||
    fam.grandparents.length ||
    fam.grandchildren.length ||
    fam.siblings.length ||
    fam.halfSiblings.length ||
    fam.spouses.length
  );
}

/** Porta de buildFamilyTree — mesmo layout de 5 níveis. */
export function FamilyTree({ title, links }: { title: string; links?: WikiLink[] }) {
  const fam = familyOf(links);
  const sibs = [...fam.siblings, ...fam.halfSiblings];
  if (!hasFamilyData(links)) return null;

  const selfRowN = 1 + sibs.length + fam.spouses.length;
  const maxRowN = Math.max(fam.grandparents.length, fam.parents.length, selfRowN, fam.children.length, fam.grandchildren.length, 1);
  const W = Math.max(460, maxRowN * 92);
  const cx = W / 2;
  const GP_Y = 20,
    P_Y = 82,
    SELF_Y = 144,
    C_Y = 206,
    GC_Y = 264,
    H = 284;
  const GAP = 78;

  function tier(links: WikiLink[], y: number, lineFromY: number, toY: number, dashed?: boolean) {
    const xs = rowXs(links.length, cx, W);
    return links.map((lk, i) => (
      <g key={i}>
        <line x1={xs[i]} y1={lineFromY} x2={cx} y2={toY} stroke="var(--border-strong)" strokeDasharray={dashed ? "2 3" : undefined} />
        <TreeNode x={xs[i]} y={y} label={lk.targetTitle} targetId={lk.targetId} />
      </g>
    ));
  }

  return (
    <div className="wb-famtree-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="wb-famtree">
        {tier(fam.grandparents, GP_Y, GP_Y + 13, P_Y - 13, true)}
        {tier(fam.parents, P_Y, P_Y + 13, SELF_Y - 13)}
        {sibs.map((lk, i) => {
          const x = cx - GAP * (sibs.length - i);
          return (
            <g key={i}>
              <line x1={x} y1={SELF_Y} x2={cx - 26} y2={SELF_Y} stroke="var(--border-strong)" />
              <TreeNode x={x} y={SELF_Y} label={lk.targetTitle} targetId={lk.targetId} />
            </g>
          );
        })}
        <TreeNode x={cx} y={SELF_Y} label={title} self />
        {fam.spouses.map((lk, i) => {
          const x = cx + GAP * (i + 1);
          return (
            <g key={i}>
              <line x1={cx + 26} y1={SELF_Y} x2={x} y2={SELF_Y} stroke="var(--border-strong)" strokeDasharray="2 3" />
              <TreeNode x={x} y={SELF_Y} label={lk.targetTitle} targetId={lk.targetId} />
            </g>
          );
        })}
        {tier(fam.children, C_Y, C_Y - 13, SELF_Y + 13)}
        {tier(fam.grandchildren, GC_Y, GC_Y - 13, C_Y + 13, true)}
      </svg>
    </div>
  );
}

const REL_GROUPS: [LinkStyle | "other", string][] = [
  ["family", "Família"],
  ["romance", "Romance"],
  ["bond", "Vínculos"],
  ["friend", "Amizades"],
  ["ally", "Aliados"],
  ["rival", "Rivalidades"],
  ["faction", "Facções"],
  ["location", "Lugares"],
  ["narrative", "Na história"],
  ["other", "Outras ligações"],
];

export function hasRelations(links: WikiLink[] = [], backlinks: WikiLink[] = []): boolean {
  return links.length > 0 || backlinks.length > 0;
}

/** Rótulo da seção combinada (e do item dela no índice): "Relações" quando há ligações,
 * senão "Linha do tempo" quando há eventos, senão nenhuma (relSectionLabel no original). */
export function relationsSectionLabel(
  links: WikiLink[] = [],
  backlinks: WikiLink[] = [],
  events: WikiIndexEvent[] = [],
): "Relações" | "Linha do tempo" | null {
  if (hasRelations(links, backlinks)) return "Relações";
  return events.length ? "Linha do tempo" : null;
}

/** Porta de buildRelGroups: Relações agrupadas por tipo. Cada grupo com a cor do tipo e os cartões de retrato; menções de mão
 * única (backlinks que não estão nas ligações de ida) entram no grupo delas, com a relação
 * escrita do ponto de vista da outra página. */
export function RelationGroups({ title, links = [], backlinks = [] }: { title: string; links?: WikiLink[]; backlinks?: WikiLink[] }) {
  const known = new Set(REL_GROUPS.map((g) => g[0]));
  const outIds = new Set(links.filter((lk) => lk.targetId).map((lk) => lk.targetId));
  const items: { lk: WikiLink; back: boolean }[] = [
    ...links.map((lk) => ({ lk, back: false })),
    ...backlinks.filter((lk) => !(lk.targetId && outIds.has(lk.targetId))).map((lk) => ({ lk, back: true })),
  ];
  const byStyle: Record<string, { lk: WikiLink; back: boolean }[]> = {};
  items.forEach((it) => {
    const st = it.lk.style && known.has(it.lk.style) ? it.lk.style : "other";
    (byStyle[st] = byStyle[st] || []).push(it);
  });
  return (
    <div className="pg-rel-groups">
      {REL_GROUPS.map(([key, label]) => {
        const list = byStyle[key];
        if (!list) return null;
        const color = EDGE_STYLE[key as LinkStyle] || "var(--pg-line-strong)";
        return (
          <div key={key}>
            <h3 className="pg-rel-grouphead">
              <span className="pg-rel-dot" style={{ background: color }} aria-hidden="true" />
              {label}
            </h3>
            <div className="links-grid">
              {list.map((it, i) => (
                <LinkCard key={i} link={it.lk} back={it.back} pageTitle={title} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const AFFINITY_LABELS = [
  "pratica",
  "é praticado(a) por",
  "acredita em",
  "é uma crença de",
  "afeta",
  "é afetado(a) por",
  "fala",
  "é falado(a) por",
  "caça",
  "é caçado(a) por",
];

function cap1(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function affinitiesOf(links: WikiLink[] = []): { label: string; items: WikiLink[] }[] {
  const byLabel: Record<string, WikiLink[]> = {};
  links.forEach((lk) => {
    if (lk.label && AFFINITY_LABELS.indexOf(lk.label) !== -1) {
      (byLabel[lk.label] = byLabel[lk.label] || []).push(lk);
    }
  });
  return AFFINITY_LABELS.filter((lbl) => byLabel[lbl]?.length).map((lbl) => ({ label: cap1(lbl), items: byLabel[lbl] }));
}

/**
 * Porta de buildTimelineViz: eventos da própria entrada, ordenados, cada um expansível. Na
 * descrição, um [[Nome]] que é uma ligação publicada da entrada vira link (wbUpgradeWikiLinks).
 */
export function EntryTimeline({ events, links = [] }: { events: WikiIndexEvent[]; links?: WikiLink[] }) {
  const sorted = [...events].sort((a, b) => eventSortKey(a) - eventSortKey(b));
  return (
    <WikiLinkUpgrade links={links}>
      <div className="wb-tl">
        {sorted.map((ev, i) => {
          return <TimelineItem key={i} ev={ev} />;
        })}
      </div>
    </WikiLinkUpgrade>
  );
}

function TimelineItem({ ev }: { ev: WikiIndexEvent }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={"wb-tl-item" + (ev.major ? " major" : "")}>
      <button type="button" className={"wb-tl-head" + (open ? " open" : "")} onClick={() => setOpen((v) => !v)}>
        <span className="wb-tl-dot" />
        <span className="wb-tl-date">{fmtEventDate(ev)}</span>
        <span className="wb-tl-label">{ev.label || "(evento)"}</span>
      </button>
      <div className="wb-tl-body" hidden={!open}>
        {ev.note ? <RenderMarkdown text={ev.note} /> : <div className="wb-tl-empty">Sem descrição adicional.</div>}
      </div>
    </div>
  );
}
