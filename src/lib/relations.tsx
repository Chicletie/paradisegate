import { useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { WikiIndexEvent, WikiLink, LinkStyle } from "../types";
import { fmtEventDate, eventSortKey } from "./events";
import { RenderMarkdown, WikiLinkUpgrade } from "./markdown";
import { LinkCard } from "../components/LinkCard";
import { familyHasAny, familyInputFromLinks, familyTreeLayout, ftMinWidth, type FtBox } from "./familyLayout.js";

// Porta de buildFamilyTree, EDGE_STYLE/affinitiesOf/
// relNeighbors/buildRelGroups e buildTimelineViz na wiki original.

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
  neutral: "var(--pg-line-strong)",
};

// Nó clicável sem <a> dentro do SVG (o próprio wiki-core.js navega no clique do <g>, não com
// um link envolvendo — um <a> do react-router com display:contents dentro de <svg> não
// pinta os filhos em todo navegador).
function TreeNode({ b }: { b: FtBox }) {
  const navigate = useNavigate();
  const targetId = b.self ? undefined : (b.ref as WikiLink | null)?.targetId;
  return (
    <g
      transform={`translate(${b.x},${b.y})`}
      style={{ cursor: targetId ? "pointer" : undefined }}
      onClick={targetId ? () => navigate(`/wiki/${encodeURIComponent(targetId)}`) : undefined}
    >
      {b.short !== b.label && <title>{b.label}</title>}
      <rect
        x={-b.w / 2}
        y={-13}
        width={b.w}
        height={26}
        rx={7}
        fill={b.self ? "var(--accent-wash)" : "var(--surface)"}
        stroke={b.self ? "var(--gold)" : "var(--border-strong)"}
      />
      <text className="wb-ft-label" y={4}>
        {b.short}
      </text>
    </g>
  );
}

export function hasFamilyData(links: WikiLink[] = []): boolean {
  return familyHasAny(familyInputFromLinks("", null, links));
}

// Tracejado = adoção/criação; pontilhado = ligação que não dá pra situar (página publicada
// antes da árvore saber quem é quem, ou parente não publicado).
const DASH: Record<string, string | undefined> = { adocao: "5 3", incerto: "1 3" };

/** Árvore genealógica na notação de genealogia (conta em familyLayout.js, igual à wiki original). */
export function FamilyTree({ title, links, birthKey }: { title: string; links?: WikiLink[]; birthKey?: number | null }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const inp = familyInputFromLinks(title, birthKey ?? null, links || []);
  const has = familyHasAny(inp);
  const L = has ? familyTreeLayout(inp) : null;
  const W = L ? L.W : 0,
    cx = L ? L.cx : 0;
  const minW = L ? ftMinWidth(W) : null;
  // Árvore larga rola por dentro (sem exigir espaço ao lado da ficha, senão descia pra baixo
  // dela e deixava um buraco) e abre com a pessoa no meio.
  useLayoutEffect(() => {
    const wrap = wrapRef.current,
      svg = svgRef.current;
    if (!minW || !wrap || !svg) return;
    // Centra na primeira vez que aparece com largura (ela pode nascer na aba Genealogia escondida).
    const go = () => {
      if (!wrap.clientWidth) return false;
      wrap.scrollLeft = Math.max(0, cx * (svg.getBoundingClientRect().width / W) - wrap.clientWidth / 2);
      return true;
    };
    if (typeof ResizeObserver === "undefined") {
      go();
      return;
    }
    const ro = new ResizeObserver(() => {
      if (go()) ro.disconnect();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [minW, cx, W]);
  if (!L) return null;
  const style = minW ? { minWidth: minW, maxWidth: Math.max(540, W) } : undefined;

  return (
    <div className="wb-famtree-wrap" ref={wrapRef} style={minW ? { contain: "inline-size" } : undefined}>
      <svg ref={svgRef} viewBox={`0 ${L.y0} ${W} ${L.y1 - L.y0}`} width="100%" className="wb-famtree" style={style}>
        <g>
          {L.lines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="var(--border-strong)" strokeDasharray={DASH[l.dash]} />
          ))}
        </g>
        <g>
          {L.boxes.map((b, i) => (
            <TreeNode key={i} b={b} />
          ))}
        </g>
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
  // Disfarce entra no grupo da relação de fachada (um irmão disfarçado de amigo fica em
  // Amizades); a mesma pessoa com várias relações no mesmo grupo vira um cartão só.
  const byStyle: Record<string, { links: WikiLink[]; back: boolean }[]> = {};
  items.forEach((it) => {
    const s0 = it.lk.spoiler === "disfarce" && it.lk.coverStyle ? it.lk.coverStyle : it.lk.style;
    const st = s0 && known.has(s0) ? s0 : "other";
    const list = (byStyle[st] = byStyle[st] || []);
    const same = it.lk.targetId ? list.find((x) => x.back === it.back && x.links[0].targetId === it.lk.targetId) : undefined;
    if (same) same.links.push(it.lk);
    else list.push({ links: [it.lk], back: it.back });
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
                <LinkCard key={i} link={it.links[0]} more={it.links.slice(1)} back={it.back} pageTitle={title} />
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
    if (lk.spoiler) return;
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
