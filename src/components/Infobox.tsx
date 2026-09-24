import { Fragment, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { fieldValue, RevealSpoiler, SpoilerBlock } from "../lib/markdown";
import { SwapCell } from "./EntryActions";
import { objPos } from "../lib/format";
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
      • {alias.vis === "spoiler" ? <RevealSpoiler preview="spoiler · toque">{content}</RevealSpoiler> : content}
    </div>
  );
}

// As abas de retrato ficam antes do `.infobox-portrait`, como irmãs (mesma ordem de
// wiki-core.js); trocar de aba repinta o retrato, e um retrato-spoiler volta coberto.
function Portrait({ images, title }: { images: InfoboxImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const opt = images[active];
  const img = (
    <img className="cover" style={{ objectPosition: objPos(opt.focus) }} src={opt.url} alt={title} />
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
      <div className="infobox-portrait">{opt.vis === "spoiler" ? <SpoilerBlock key={active}>{img}</SpoilerBlock> : img}</div>
    </>
  );
}

/**
 * Porta do bloco de infobox em renderEntry (wiki original): retrato (abas quando há
 * mais de uma imagem marcada), fatos curtos numa tabela, Alcunhas, Nascimento/Nascimento
 * Lunar (dentro de "Dados básicos" quando esse cabeçalho existe), Contém.
 */
export function Infobox({ data }: { data: WikiEntryDoc }) {
  const [expanded, setExpanded] = useState(false);
  const shortFields = (data.fields || []).filter((f) => f.type !== "nota");
  const aliases = data.aliases || [];
  const children = data.children || [];
  const infoboxImages = data.infoboxImages || [];
  const hasBirth = !!(data.birth || data.lunarBirth);
  if (!shortFields.length && !infoboxImages.length && !aliases.length && !children.length && !hasBirth) return null;

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
  if (aliases.length) {
    rows.push(
      <tr key="aliases">
        <th>Alcunhas</th>
        <td>
          {aliases.map((a, i) => (
            <AliasLine key={i} alias={a} />
          ))}
        </td>
      </tr>,
    );
  }
  if (!birthInBasics) rows.push(...birthRows);
  shortFields.forEach((f, i) => {
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
      <tr key={i}>
        <th>
          {f.key}
        </th>
        <SwapCell slot={"ib:" + i} fieldKey={f.key}>
          {f.vis === "spoiler" ? (
            <RevealSpoiler preview="spoiler · toque">
              <span>{fieldValue(f.value)}</span>
            </RevealSpoiler>
          ) : (
            fieldValue(f.value)
          )}
        </SwapCell>
      </tr>,
    );
  });
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
