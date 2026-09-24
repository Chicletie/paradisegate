import { Fragment, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { mdInline, RevealSpoiler, SpoilerFlag } from "../lib/markdown";
import { objPos } from "../lib/format";
import type { InfoboxImage, WikiAlias, WikiCrumb, WikiEntryDoc, WikiField } from "../types";

function AliasLine({ alias }: { alias: WikiAlias }) {
  const note = alias.note;
  const noteFlat = note ? [note.before, note.link, note.after].filter(Boolean).join(" ") : "";
  const content = (
    <span>
      {alias.selfLink ? <Link to={`/wiki/${encodeURIComponent(alias.selfLink)}`}>{alias.text}</Link> : alias.text}
      {noteFlat && (
        <>
          {" ("}
          {note?.before && <span>{note.before} </span>}
          {note?.link &&
            (note.linkWikiId ? (
              <Link to={`/wiki/${encodeURIComponent(note.linkWikiId)}`}>{note.link}</Link>
            ) : (
              <span>{note.link}</span>
            ))}
          {note?.after && <span> {note.after}</span>}
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

function Portrait({ images, title }: { images: InfoboxImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const opt = images[active];
  const img = (
    <img className="cover" style={{ objectPosition: objPos(opt.focus) }} src={opt.url} alt={title} />
  );
  return (
    <div className="infobox-portrait">
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
      {opt.vis === "spoiler" ? <SpoilerCoverImg img={img} /> : img}
    </div>
  );
}

// Cobre o retrato atrás do botão de spoiler, sem trocar de imagem depois (o `key` no active
// index já cuida disso quando a aba muda).
function SpoilerCoverImg({ img }: { img: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  if (revealed) return <>{img}</>;
  return (
    <button type="button" className="spoiler-reveal" onClick={() => setRevealed(true)}>
      🙈 spoiler, toque para revelar
    </button>
  );
}

/**
 * Porta do bloco de infobox em renderEntry (wiki-core.js, arvore): retrato (abas quando há
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
  const birthRows = (
    <>
      {data.birth && (
        <tr>
          <th>Nascimento</th>
          <td>{data.birth}</td>
        </tr>
      )}
      {data.lunarBirth && (
        <tr>
          <th>Nascimento Lunar</th>
          <td>{data.lunarBirth}</td>
        </tr>
      )}
    </>
  );

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
  if (hasBirth && !hasBasicsHead) rows.push(<Fragment key="birth">{birthRows}</Fragment>);
  shortFields.forEach((f, i) => {
    if (f.type === "cabecalho") {
      rows.push(
        <tr key={"h" + i} className="infobox-header-row">
          <th colSpan={2}>{f.key}</th>
        </tr>,
      );
      if (hasBirth && isBasicsHead(f)) rows.push(<Fragment key={"hb" + i}>{birthRows}</Fragment>);
      return;
    }
    rows.push(
      <tr key={i}>
        <th>
          {f.key}
          {f.vis === "spoiler" && <SpoilerFlag />}
        </th>
        <td>{f.vis === "spoiler" ? <RevealSpoiler preview="spoiler · toque">{mdInline(f.value)}</RevealSpoiler> : mdInline(f.value)}</td>
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
