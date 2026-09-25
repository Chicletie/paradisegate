import { Link } from "react-router-dom";
import { useWikiIndex, hasEvents } from "../lib/wikiIndex";

/** Porta de pgFoot na wiki original: navegação curta + marca. */
export function PgFooter() {
  const index = useWikiIndex();
  const showTimeline = !!index && hasEvents(index);
  return (
    <footer className="pg-foot">
      <nav className="pg-foot-nav" aria-label="Rodapé">
        <Link to="/wiki">Início</Link>
        {showTimeline && <Link to="/wiki/_timeline">Linha do tempo</Link>}
        <Link to="/wiki?aleatoria=1">Página aleatória</Link>
      </nav>
      <div className="pg-foot-brand">
        <span className="pg-mark" aria-hidden="true" />
        <span>Paradise Gate · Wiki</span>
      </div>
    </footer>
  );
}
