import { ARCANA_GLYPHS } from "../lib/arcana";

// Peças visuais do Paradise Gate — porta de pgStar/pgSearchIcon/pgConstellation/pgPartyHat/
// wbArcanaGlyph/pgNoCover/pgSectionHead em wiki-core.js (arvore).

/** Estrela de quatro pontas: marcador de seção, selo provisório, rodapé, verso da carta. */
export function PgStar({ className }: { className?: string }) {
  return (
    <svg className={className || "pg-star"} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 1.5c.9 6.1 3.4 8.6 10.5 10.5-7.1 1.9-9.6 4.4-10.5 10.5-.9-6.1-3.4-8.6-10.5-10.5C8.6 10.1 11.1 7.6 12 1.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PgSearchIcon() {
  return (
    <svg className="pg-search-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth={2} />
      <path d="M15.5 15.5 21 21" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

const CONSTELLATION_PTS = [
  [30, 150],
  [92, 118],
  [140, 132],
  [196, 74],
  [252, 96],
  [292, 38],
  [214, 160],
];
const CONSTELLATION_LINES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [2, 6],
];

/** Constelação decorativa — pontos e linhas finas, fixa (sem animar). */
export function PgConstellation() {
  return (
    <svg className="pg-constellation" viewBox="0 0 320 200" aria-hidden="true" focusable="false">
      {CONSTELLATION_LINES.map(([a, b], i) => (
        <line
          key={"l" + i}
          x1={CONSTELLATION_PTS[a][0]}
          y1={CONSTELLATION_PTS[a][1]}
          x2={CONSTELLATION_PTS[b][0]}
          y2={CONSTELLATION_PTS[b][1]}
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.5"
        />
      ))}
      {CONSTELLATION_PTS.map((p, i) => (
        <circle key={"c" + i} cx={p[0]} cy={p[1]} r={i === 3 ? 3 : 2} fill="currentColor" />
      ))}
    </svg>
  );
}

const PARTY_HAT_PATHS = [
  "M6 19.6L12 5.2l6 14.4",
  "M6 19.6c1.9 1.2 10.1 1.2 12 0",
  "M8.3 14.2c1.9.8 5.5.8 7.4 0",
  "M10.2 9.6c1 .4 2.6.4 3.6 0",
  "M3.2 9.4l1.3.5",
  "M20.6 8.6l-1.1.8",
  "M20 13.6h1.4",
];

/** Chapeuzinho de festa do aniversariante, torto no canto da carta. */
export function PgPartyHat() {
  return (
    <svg
      className="pg-party-hat"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PARTY_HAT_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
      <circle cx="12" cy="3.6" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** Símbolo da carta (planeta/signo do arcano maior, triângulo do elemento do naipe). */
export function ArcanaGlyph({ glyph, className }: { glyph: string; className?: string }) {
  return (
    <svg
      className={className || "pg-glyph"}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {(ARCANA_GLYPHS[glyph] || []).map((d, i) => {
        const [kind, rest] = d.split(":");
        if (kind === "c") {
          const [cx, cy, r] = rest.split(",");
          return <circle key={i} cx={cx} cy={cy} r={r} />;
        }
        if (kind === "e") {
          const [cx, cy, rx, ry] = rest.split(",");
          return <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} />;
        }
        return <path key={i} d={d} />;
      })}
    </svg>
  );
}

/** Página sem capa: bloco azul estrelado com a inicial, pra grade não ficar desalinhada. */
export function PgNoCover({ title }: { title?: string }) {
  return (
    <span className="pg-nocover" aria-hidden="true">
      <span>{(title || "?").charAt(0)}</span>
    </span>
  );
}

/** Título de seção: estrela + texto em Castoro Titling + contagem opcional + fio. */
export function PgSectionHead({ text, count, id }: { text: string; count?: string; id?: string }) {
  return (
    <h2 className="pg-sec" id={id}>
      <PgStar className="pg-sec-star" />
      <span>{text}</span>
      {count != null && (
        <span className="pg-sec-count" aria-live="polite">
          {count}
        </span>
      )}
    </h2>
  );
}

/** Silhueta do botão "Entrar" (pgUserIcon). */
export function PgUserIcon() {
  return (
    <svg
      className="pg-user-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c1.2-3.6 4-5.3 7.5-5.3s6.3 1.7 7.5 5.3" />
    </svg>
  );
}
