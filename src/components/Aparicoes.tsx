import { Link } from "react-router-dom";
import { RevealSpoiler } from "../lib/markdown";
import { estreiaText, groupAparicoes, totalText } from "../lib/obras";
import type { WikiAparicao } from "../types";

/** Seção "Aparições" da página do personagem: por obra › temporada, com estreia e contagem.
 * Aparição numa temporada depois da primeira fica atrás da tarja até o leitor ter visto ela. */
export function AparicoesSection({ aparicoes }: { aparicoes?: WikiAparicao[] }) {
  const groups = groupAparicoes(aparicoes);
  if (!groups.length) return null;
  return (
    <div className="aparicoes-wrap">
      <h2 className="cathead" id="aparicoes">
        Aparições
      </h2>
      <ul className="aparicoes">
        {groups.map((g) => (
          <li key={g.obraId || g.obra}>
            <span className="aparicoes-obra">
              {g.obraId ? <Link to={`/wiki/${encodeURIComponent(g.obraId)}`}>{g.obra}</Link> : g.obra}
            </span>
            {g.tipo && <span className="aparicoes-tipo">{" · " + g.tipo}</span>}
            {g.items.some((a) => a.temporada || a.nota) && (
              <ul>
                {g.items.map((a, i) => (
                  <li key={i}>{a.at ? <RevealSpoiler at={a.at}><AparicaoLine a={a} /></RevealSpoiler> : <AparicaoLine a={a} />}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AparicaoLine({ a }: { a: WikiAparicao }) {
  const est = estreiaText(a), tot = totalText(a);
  const seasonHref = a.temporadaId ? `/wiki/${encodeURIComponent(a.temporadaId)}` : "";
  return (
    <>
      {a.temporada ? seasonHref ? <Link to={seasonHref}>{a.temporada}</Link> : a.temporada : "A obra toda"}
      {est && (
        <>
          {" — "}
          {seasonHref && a.estreia?.ancora ? <Link to={`${seasonHref}#${a.estreia.ancora}`}>{est}</Link> : est}
        </>
      )}
      {tot && <span className="aparicoes-meta">{" · " + tot}</span>}
      {a.nota && <span className="aparicoes-meta">{" · " + a.nota}</span>}
    </>
  );
}
