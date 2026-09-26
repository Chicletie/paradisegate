import { Link } from "react-router-dom";
import { arcanaInfo } from "../lib/arcana";
import { objPos } from "../lib/format";
import type { DailyHighlights } from "../lib/home";
import { ArcanaGlyph, PgConstellation, PgPartyHat, PgStar } from "./PgIcons";

const wikiHref = (id: string) => `/wiki/${encodeURIComponent(id)}`;

/** Personagem do dia como carta de tarô: vira uma vez ao carregar (desligado em reduced-motion
 * pelo CSS). Com carta associada no editor, numeral e símbolo dela; senão, a estrela. */
export function TarotCard({ daily }: { daily: DailyHighlights }) {
  const c = daily.char;
  if (!c) {
    return (
      <figure className="pg-tarot-fig">
        <div className="pg-tarot is-empty">
          <div className="pg-tarot-inner">
            <div className="pg-tarot-back">
              <PgStar className="pg-tarot-back-star" />
            </div>
          </div>
        </div>
        <figcaption className="pg-caption">
          <span>Personagem do dia</span>
          <span className="pg-empty">{daily.charEmptyMsg}</span>
        </figcaption>
      </figure>
    );
  }
  const arc = arcanaInfo(c.arcana);
  const title = [arc ? arc.label : null, daily.isBirthday ? "Aniversário hoje" : null].filter(Boolean).join(" · ");
  return (
    <figure className="pg-tarot-fig">
      <Link className="pg-tarot" to={wikiHref(c.id)} title={title || undefined}>
        <div className="pg-tarot-inner">
          <div className={"pg-tarot-face" + (c.cover ? "" : " no-cover")}>
            {c.cover ? (
              <img className="pg-tarot-img" src={c.cover} alt="" style={{ objectPosition: objPos(c.coverFocus) }} />
            ) : (
              <span className="pg-tarot-initial" aria-hidden="true">
                <PgConstellation />
                <span>{(c.title || "?").charAt(0)}</span>
              </span>
            )}
            <span className="pg-tarot-num" aria-hidden="true">
              {arc ? arc.numeral : <PgStar className="pg-tarot-num-star" />}
            </span>
            <span className="pg-tarot-name">
              {arc ? <ArcanaGlyph glyph={arc.glyph} className="pg-tarot-glyph" /> : null}
              <span>{c.title || "(sem título)"}</span>
              {arc ? <span className="pg-sr">{", carta " + arc.label}</span> : null}
              {daily.isBirthday ? <span className="pg-sr">, aniversário hoje</span> : null}
            </span>
          </div>
          <div className="pg-tarot-back" aria-hidden="true">
            <PgStar className="pg-tarot-back-star" />
          </div>
        </div>
        {daily.isBirthday && <PgPartyHat />}
      </Link>
      <figcaption className="pg-caption">
        <span>{daily.isBirthday ? "Aniversariante do dia" : "Personagem do dia"}</span>
      </figcaption>
    </figure>
  );
}
