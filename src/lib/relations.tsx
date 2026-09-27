import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { WikiIndexEvent, WikiLink, LinkStyle } from "../types";
import { fmtEventDate, eventSortKey } from "./events";
import { RenderMarkdown, WikiLinkUpgrade } from "./markdown";
import { LinkCard } from "../components/LinkCard";
import { FT_MIN_W, familyLayout, type FtItem } from "./familyLayout";

// Porta de FAMILY_LABEL_BUCKET/familyOf/buildFamilyTree, EDGE_STYLE/affinitiesOf/
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

const FAMILY_LABEL_BUCKET: Record<string, keyof FamilyBuckets> = {
  "é filho(a) de": "parents",
  "é filho(a) adotivo(a) de": "parents",
  "é filho(a) de criação de": "parents",
  "é pai/mãe de": "children",
  "é pai/mãe adotivo(a) de": "children",
  "é pai/mãe de criação de": "children",
  "irmão/irmã de": "siblings",
  "gêmeo(a) de": "siblings",
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
    // Parentesco escondido (spoiler ou disfarce) nunca entra na árvore: ela revelaria o segredo.
    if (lk.spoiler) return;
    const bucket = lk.label && FAMILY_LABEL_BUCKET[lk.label];
    if (bucket) fam[bucket].push(lk);
  });
  return fam;
}

// Nó clicável sem <a> dentro do SVG (o próprio wiki-core.js navega no clique do <g>, não com
// um link envolvendo — um <a> do react-router com display:contents dentro de <svg> não
// pinta os filhos em todo navegador).
function TreeNode({ it, y, label, self, targetId }: { it: FtItem; y: number; label: string; self?: boolean; targetId?: string }) {
  const navigate = useNavigate();
  const clickable = !self && !!targetId;
  return (
    <g
      transform={`translate(${it.x},${y})`}
      style={{ cursor: clickable ? "pointer" : undefined }}
      onClick={clickable ? () => navigate(`/wiki/${encodeURIComponent(targetId!)}`) : undefined}
    >
      {it.short !== label && <title>{label}</title>}
      <rect
        x={-it.w / 2}
        y={-13}
        width={it.w}
        height={26}
        rx={7}
        fill={self ? "var(--accent-wash)" : "var(--surface)"}
        stroke={self ? "var(--gold)" : "var(--border-strong)"}
      />
      <text className="wb-ft-label" y={4}>
        {it.short}
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
  return <FamilyTreeSvg title={title} fam={fam} sibs={sibs} />;
}

function FamilyTreeSvg({ title, fam, sibs }: { title: string; fam: FamilyBuckets; sibs: WikiLink[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const nm = (lk: WikiLink) => lk.targetTitle;
  const L = familyLayout(title, {
    gp: fam.grandparents.map(nm),
    p: fam.parents.map(nm),
    sibs: sibs.map(nm),
    sp: fam.spouses.map(nm),
    c: fam.children.map(nm),
    gc: fam.grandchildren.map(nm),
  });
  const { W, cx } = L;
  const GP_Y = 20,
    P_Y = 82,
    SELF_Y = 144,
    C_Y = 206,
    GC_Y = 264,
    H = 284;
  // Árvore grande rola pro lado (a moldura já tem overflow-x) em vez de encolher até ficar ilegível.
  const wide = W > FT_MIN_W;
  const style = wide ? { minWidth: Math.round(Math.max(FT_MIN_W, W * 0.75)), maxWidth: Math.max(540, W) } : undefined;
  // Árvore larga rola por dentro (sem exigir espaço ao lado da ficha, senão descia pra baixo
  // dela e deixava um buraco) e abre com a pessoa no meio.
  useLayoutEffect(() => {
    const wrap = wrapRef.current,
      svg = svgRef.current;
    if (!wide || !wrap || !svg) return;
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
  }, [wide, cx, W]);

  // Linhas primeiro, caixas por cima (senão a linha de um cônjuge riscava a caixa do outro).
  const lines: ReactNode[] = [];
  const boxes: ReactNode[] = [];
  function tier(list: WikiLink[], items: FtItem[], y: number, fromY: number, toY: number, dashed: boolean, key: string) {
    list.forEach((lk, i) => {
      lines.push(<line key={key + i} x1={items[i].x} y1={fromY} x2={cx} y2={toY} stroke="var(--border-strong)" strokeDasharray={dashed ? "2 3" : undefined} />);
      boxes.push(<TreeNode key={key + i} it={items[i]} y={y} label={lk.targetTitle} targetId={lk.targetId} />);
    });
  }
  tier(fam.grandparents, L.rows.gp, GP_Y, GP_Y + 13, P_Y - 13, true, "gp");
  tier(fam.parents, L.rows.p, P_Y, P_Y + 13, SELF_Y - 13, false, "p");
  sibs.forEach((lk, i) => {
    lines.push(<line key={"s" + i} x1={L.rows.sibs[i].x} y1={SELF_Y} x2={cx} y2={SELF_Y} stroke="var(--border-strong)" />);
    boxes.push(<TreeNode key={"s" + i} it={L.rows.sibs[i]} y={SELF_Y} label={lk.targetTitle} targetId={lk.targetId} />);
  });
  boxes.push(<TreeNode key="self" it={L.rows.self} y={SELF_Y} label={title} self />);
  fam.spouses.forEach((lk, i) => {
    lines.push(<line key={"sp" + i} x1={cx} y1={SELF_Y} x2={L.rows.sp[i].x} y2={SELF_Y} stroke="var(--border-strong)" strokeDasharray="2 3" />);
    boxes.push(<TreeNode key={"sp" + i} it={L.rows.sp[i]} y={SELF_Y} label={lk.targetTitle} targetId={lk.targetId} />);
  });
  tier(fam.children, L.rows.c, C_Y, C_Y - 13, SELF_Y + 13, false, "c");
  tier(fam.grandchildren, L.rows.gc, GC_Y, GC_Y - 13, C_Y + 13, true, "gc");

  return (
    <div className="wb-famtree-wrap" ref={wrapRef} style={wide ? { contain: "inline-size" } : undefined}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" className="wb-famtree" style={style}>
        <g>{lines}</g>
        <g>{boxes}</g>
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
