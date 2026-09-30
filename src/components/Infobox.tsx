import { Fragment, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { fieldValue, RevealSpoiler, SpoilerBlock } from "../lib/markdown";
import { SwapCell } from "./EntryActions";
import { RestritoInline, RestritoRows } from "./RestritoPlace";
import { useRestritoCount } from "../lib/restritoPlace";
import { objPos } from "../lib/format";
import { Lightbox } from "./Lightbox";
import type { InfoboxImage, WikiAlias, WikiCrumb, WikiEntryDoc, WikiField } from "../types";

/** Porta de buildAlias/appendAliasNote: a anotação entre parênteses junta só os pedaços que
 * têm texto (antes / trecho-com-link / depois), com um espaço ENTRE eles — nunca sobrando
 * espaço antes do ")". */
export function AliasLine({ alias }: { alias: WikiAlias }) {
  const note = alias.note;
  const segs: ReactNode[] = [];
  if (note?.before) segs.push(note.before);
  if (note?.link)
    segs.push(
      note.linkWikiId ? (
        <Link key="lk" to={`/wiki/${encodeURIComponent(note.linkWikiId)}`}>
          {note.link}
        </Link>
      ) : (
        note.link
      ),
    );
  if (note?.after) segs.push(note.after);
  const content = (
    <span>
      {alias.selfLink ? <Link to={`/wiki/${encodeURIComponent(alias.selfLink)}`}>{alias.text}</Link> : alias.text}
      {segs.length > 0 && (
        <>
          {" ("}
          {segs.map((seg, i) => (
            <Fragment key={i}>
              {i > 0 && " "}
              {seg}
            </Fragment>
          ))}
          {")"}
        </>
      )}
    </span>
  );
  return (
    <div className="infobox-alias-line">
      • {alias.vis === "spoiler" ? <RevealSpoiler preview="spoiler · toque" at={alias.at}>{content}</RevealSpoiler> : content}
    </div>
  );
}

// As abas de retrato ficam antes do `.infobox-portrait`, como irmãs (mesma ordem de
// wiki-core.js); trocar de aba repinta o retrato, e um retrato-spoiler volta coberto.
// Clicar no retrato amplia a imagem inteira; as setas passam pelos outros retratos, e um
// retrato em spoiler só entra na sequência depois que o leitor o revelou.
function Portrait({ images, title }: { images: InfoboxImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [seen, setSeen] = useState<ReadonlySet<number>>(new Set());
  const opt = images[active];
  const open = () => {
    if (opt.vis === "spoiler") setSeen((s) => new Set(s).add(active));
    setZoom(true);
  };
  const shown = images.map((_, i) => i).filter((i) => images[i].vis !== "spoiler" || seen.has(i) || i === active);
  const img = (
    <button type="button" className="infobox-zoom" aria-label={"Ampliar retrato" + (images.length > 1 ? ": " + (opt.name || "Retrato") : "")} onClick={open}>
      <img className="cover" style={{ objectPosition: objPos(opt.focus) }} src={opt.url} alt={title} />
    </button>
  );
  return (
    <>
      {images.length > 1 && (
        <div className="infobox-tabs" role="tablist" aria-label="Retratos">
          {images.map((im, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Retrato: ${im.name || "Retrato"}`}
              className={"infobox-tab" + (i === active ? " on" : "")}
              onClick={() => setActive(i)}
            >
              {im.name || "Retrato"}
            </button>
          ))}
        </div>
      )}
      <div className="infobox-portrait">{opt.vis === "spoiler" ? <SpoilerBlock key={active} at={opt.at}>{img}</SpoilerBlock> : img}</div>
      {zoom && (
        <Lightbox
          items={shown.map((i) => ({ url: images[i].url, caption: images.length > 1 ? images[i].name || "Retrato" : title }))}
          start={shown.indexOf(active)}
          onClose={() => setZoom(false)}
        />
      )}
    </>
  );
}

/**
 * Porta do bloco de infobox em renderEntry (wiki original): retrato (abas quando há
 * mais de uma imagem marcada), fatos curtos numa tabela, Alcunhas, Nascimento/Nascimento
 * Lunar (dentro de "Dados básicos" quando esse cabeçalho existe), Contém.
 */
/** Valor da ficha com mais de 3 linhas (ex.: Família): mostra 3 e um "ver mais" pra abrir. Mede o
 *  conteúdo de dentro, então uma tarja revelada que faça o valor crescer também conta. */
function Clamp({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => {
    const b = box.current, c = inner.current;
    if (!b || !c || open) return;
    const check = () => setOver(c.offsetHeight > b.clientHeight + 2);
    check();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(check);
    ro.observe(c);
    ro.observe(b);
    return () => ro.disconnect();
  }, [open]);
  return (
    <>
      <div ref={box} className={"ib-clamp" + (open ? " open" : over ? " over" : "")}>
        <div ref={inner}>{children}</div>
      </div>
      {(over || open) && (
        <button type="button" className="ib-clamp-btn" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "ver menos" : "ver mais"}
        </button>
      )}
    </>
  );
}

export function Infobox({ data }: { data: WikiEntryDoc }) {
  const [expanded, setExpanded] = useState(false);
  const shortFields = (data.fields || []).filter((f) => f.type !== "nota");
  const aliases = data.aliases || [];
  const children = data.children || [];
  const infoboxImages = data.infoboxImages || [];
  const hasBirth = !!(data.birth || data.lunarBirth);
  const nFichaR = useRestritoCount("ficha"), nAliasR = useRestritoCount("aliases");
  if (!shortFields.length && !infoboxImages.length && !aliases.length && !children.length && !hasBirth && !nFichaR && !nAliasR) return null;

  const isBasicsHead = (f: WikiField) => f.type === "cabecalho" && /^dados b[áa]sicos$/i.test((f.key || "").trim());
  const hasBasicsHead = shortFields.some(isBasicsHead);
  const birthRows: ReactNode[] = [];
  if (data.birth)
    birthRows.push(
      <tr key="birth">
        <th>Nascimento</th>
        <td>{data.birth}</td>
      </tr>,
    );
  if (data.lunarBirth)
    birthRows.push(
      <tr key="lunar">
        <th>Nascimento Lunar</th>
        <td>{data.lunarBirth}</td>
      </tr>,
    );
  let birthInBasics = hasBasicsHead;

  const rows: ReactNode[] = [];
  if (aliases.length || nAliasR) {
    rows.push(
      <tr key="aliases">
        <th>Alcunhas</th>
        <td>
          <Clamp>
            {aliases.map((a, i) => (
              <Fragment key={i}>
                <RestritoInline area="aliases" index={i} />
                <AliasLine alias={a} />
              </Fragment>
            ))}
            <RestritoInline area="aliases" index={aliases.length} />
          </Clamp>
        </td>
      </tr>,
    );
  }
  if (!birthInBasics) rows.push(...birthRows);
  shortFields.forEach((f, i) => {
    rows.push(<RestritoRows key={"r" + i} area="ficha" index={i} />);
    if (f.type === "cabecalho") {
      rows.push(
        <tr key={"h" + i} className="infobox-header-row">
          <th colSpan={2}>{f.key}</th>
        </tr>,
      );
      if (birthInBasics && isBasicsHead(f)) {
        rows.push(...birthRows);
        birthInBasics = false;
      }
      return;
    }
    rows.push(
      // Status (vivo/morto…): tarja de largura fixa, pra não entregar pelo tamanho (wiki.css).
      <tr key={i} className={/^status$/i.test((f.key || "").trim()) ? "infobox-status" : undefined}>
        <th>
          {f.key}
        </th>
        <SwapCell slot={"ib:" + i} fieldKey={f.key}>
          <Clamp>
            {f.vis === "spoiler" ? (
              <RevealSpoiler preview="spoiler · toque" at={f.at}>
                <span>{fieldValue(f.value)}</span>
              </RevealSpoiler>
            ) : (
              fieldValue(f.value)
            )}
          </Clamp>
        </SwapCell>
      </tr>,
    );
  });
  rows.push(<RestritoRows key="r-end" area="ficha" index={shortFields.length} />);
  if (children.length) {
    rows.push(
      <tr key="children">
        <th>Contém</th>
        <td>
          {children.map((c: WikiCrumb, i) => (
            <span key={c.targetId}>
              {i > 0 && ", "}
              <Link to={`/wiki/${encodeURIComponent(c.targetId)}`}>{c.targetTitle}</Link>
            </span>
          ))}
        </td>
      </tr>,
    );
  }

  return (
    <div className={"infobox" + (expanded ? " expanded" : "")}>
      <div className="pg-infobox-title">{data.title || ""}</div>
      {infoboxImages.length > 0 && <Portrait images={infoboxImages} title={data.title || ""} />}
      {rows.length > 0 && (
        <>
          <table className="infobox-facts">
            <tbody>{rows}</tbody>
          </table>
          {rows.length > 6 && !expanded && (
            <button type="button" className="infobox-expand" onClick={() => setExpanded(true)}>
              ▾ ver todos os {rows.length} campos
            </button>
          )}
        </>
      )}
    </div>
  );
}
