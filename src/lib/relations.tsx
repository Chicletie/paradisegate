import { useContext, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { WikiIndexEvent, WikiLink, LinkStyle } from "../types";
import { fmtEventDate, eventSortKey } from "./events";
import { RenderMarkdown, WikiLinkUpgrade, useRevealedTargetIds } from "./markdown";
import { PageObrasContext, isUnlocked, useSpoilerProgress } from "./spoilerProgress";
import { LinkCard } from "../components/LinkCard";
import { FT_LEGEND, familyHasAny, familyInputFromLinks, familyTreeLayout, ftLinePath, ftMinWidth, type FtBox, type FtLegendKey } from "./familyLayout.js";

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
        y={-b.h}
        width={b.w}
        height={2 * b.h}
        rx={7}
        fill={b.self ? "var(--accent-wash)" : "var(--surface)"}
        stroke={b.self ? "var(--gold)" : "var(--border-strong)"}
      />
      <text className="wb-ft-label" y={b.term ? -2 : 4}>
        {b.short}
      </text>
      {b.term && (
        <text className="wb-ft-label" y={12} style={{ fontSize: 9.5, opacity: 0.75 }}>
          {b.term}
        </text>
      )}
    </g>
  );
}

/** O leitor já pode ver este parentesco em spoiler? Viu a temporada em que ele é revelado (ou
 * "vi tudo"), ou abriu a tarja dele na ficha de família desta página. */
export function useFamilyCanSee(): (lk: WikiLink) => boolean {
  const { progress } = useSpoilerProgress();
  const obras = useContext(PageObrasContext);
  const revealed = useRevealedTargetIds();
  return (lk) => isUnlocked(progress, obras, lk.at) || (!!lk.targetId && revealed.has(lk.targetId));
}

export function hasFamilyData(links: WikiLink[] = [], canSee?: (lk: WikiLink) => boolean): boolean {
  return familyHasAny(familyInputFromLinks("", null, links, canSee));
}

// Tracejado = adoção/criação/guarda; pontilhado = ligação que não dá pra situar (página
// publicada antes da árvore saber quem é quem, ou parente não publicado); traço-ponto = pais do
// mesmo filho sem casamento. Gestação/doação ("origem") já vem em linha dupla, sem tracejado.
const DASH: Record<string, string | undefined> = { adocao: "5 3", incerto: "1 3", uniao: "6 3 1 3" };

/** Amostra de cada item da legenda, com o mesmo traço e as mesmas caixas da árvore. */
function LegendSample({ k }: { k: FtLegendKey }) {
  const line = (x1: number, y1: number, x2: number, y2: number, dash?: string) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--border-strong)" strokeDasharray={dash ? DASH[dash] : undefined} />
  );
  const box = (x: number, y: number, w = 14) => <rect x={x} y={y} width={w} height={9} rx={2.5} fill="var(--surface)" stroke="var(--border-strong)" />;
  let body;
  if (k === "sangue") body = <>{box(15, 1)}{line(22, 10, 22, 17)}{line(8, 17, 36, 17)}{line(8, 17, 8, 22)}{line(36, 17, 36, 22)}</>;
  else if (k === "casal") body = <>{box(1, 7)}{box(29, 7)}{line(15, 11.5, 29, 11.5)}</>;
  else if (k === "ex") body = <>{box(1, 7)}{box(29, 7)}{line(15, 11.5, 29, 11.5)}{line(19, 16, 22, 7)}{line(23, 16, 26, 7)}</>;
  else if (k === "viuvo") body = <>{box(1, 7)}{box(29, 7)}{line(15, 11.5, 29, 11.5)}{line(22, 11.5, 22, 4.5)}{line(19.5, 6.5, 24.5, 6.5)}</>;
  else if (k === "origem") body = <>{box(15, 1)}{line(20.6, 10, 20.6, 22)}{line(23.4, 10, 23.4, 22)}</>;
  else if (k === "ponte")
    body = (
      <>
        <path d="M2 14L18.5 14A3.5 3.5 0 0 1 25.5 14L42 14" fill="none" stroke="var(--border-strong)" />
        {line(22, 2, 22, 24)}
      </>
    );
  else if (k === "uniao") body = <>{box(1, 2)}{box(29, 2)}{line(8, 11, 8, 18, "uniao")}{line(8, 18, 36, 18, "uniao")}{line(36, 18, 36, 11, "uniao")}</>;
  else if (k === "adocao") body = <>{box(15, 1)}{line(22, 10, 22, 22, "adocao")}</>;
  else if (k === "meio") body = <>{box(1, 1)}{line(8, 10, 8, 16)}{line(8, 16, 34, 16)}{line(34, 16, 34, 22)}</>;
  else if (k === "incerto") body = <>{line(2, 6, 34, 6, "incerto")}{line(34, 6, 34, 22, "incerto")}</>;
  else body = <>{line(4, 6, 40, 6, "incerto")}{line(22, 6, 22, 13, "incerto")}{box(13, 13, 18)}</>;
  return (
    <svg className="wb-ft-legend-sample" viewBox="0 0 44 24" width="44" height="24" aria-hidden="true">
      {body}
    </svg>
  );
}

/** Legenda ao lado da árvore: só os traços que ela usa, cada um com o seu desenho. */
function FamilyLegend({ keys }: { keys: FtLegendKey[] }) {
  if (!keys.length) return null;
  return (
    <aside className="wb-ft-legend" aria-label="Legenda da árvore">
      <p className="wb-ft-legend-title">Legenda</p>
      <ul>
        {FT_LEGEND.filter(([k]) => keys.includes(k)).map(([k, text]) => (
          <li key={k}>
            <LegendSample k={k} />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Árvore genealógica na notação de genealogia (conta em familyLayout.js, igual à wiki original). */
export function FamilyTree({ title, links, birthKey }: { title: string; links?: WikiLink[]; birthKey?: number | null }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canSee = useFamilyCanSee();
  const inp = familyInputFromLinks(title, birthKey ?? null, links || [], canSee);
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
    <div className="wb-famtree-box">
    <div className="wb-famtree-wrap" ref={wrapRef} style={minW ? { contain: "inline-size" } : undefined}>
      <svg ref={svgRef} viewBox={`0 ${L.y0} ${W} ${L.y1 - L.y0}`} width="100%" className="wb-famtree" style={style}>
        <g>
          {L.lines.map((l, i) => (
            <path key={i} d={ftLinePath(l)} fill="none" stroke="var(--border-strong)" strokeDasharray={DASH[l.dash]} />
          ))}
        </g>
        <g>
          {L.boxes.map((b, i) => (
            <TreeNode key={i} b={b} />
          ))}
        </g>
        {L.notes.map((n, i) => (
          <text key={i} className="wb-ft-label" x={n.x} y={n.y} style={{ fontSize: 10, opacity: 0.75 }}>
            {n.text}
          </text>
        ))}
      </svg>
    </div>
    <FamilyLegend keys={L.legend} />
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
