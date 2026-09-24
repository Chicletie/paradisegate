import { Fragment, useState, type ReactNode } from "react";
import { fieldValue, RenderMarkdown } from "../lib/markdown";
import type { WikiRestritoItem } from "../types";
import { PlaceContext, useRestritoAt, type Placement } from "../lib/restritoPlace";

/*
 * Conteúdo restrito no lugar certo. A página pública traz só marcas de posição
 * (`restritoSlots`: área + quantos itens públicos vêm antes, com um código embaralhado) e cada
 * item restrito liberado pro leitor traz o mesmo código em `slot`. Aqui os dois se encontram:
 * cada área da página pergunta "o que entra antes do meu item i?" e desenha no lugar, marcado
 * "🔐 desbloqueado pra você", com "ver como convidado" pra comparar com o que o público vê.
 * Itens sem marca (páginas publicadas antes disto, variantes de obra, galeria) continuam indo
 * pro fim da página, em RestritoSlot.
 */

export function RestritoPlaceProvider({ value, children }: { value: Placement; children: ReactNode }) {
  return <PlaceContext.Provider value={value}>{children}</PlaceContext.Provider>;
}

function Badge() {
  return (
    <span className="pg-unlocked-badge" title="Só você e quem o autor liberou veem isto">
      🔐 desbloqueado pra você
    </span>
  );
}

/** "ver como convidado": esconde o trecho e diz o que o público vê no lugar dele. */
function GuestSwitch({ guest, onToggle }: { guest: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="linklike pg-unlocked-switch" aria-pressed={guest ? "true" : "false"} onClick={onToggle}>
      {guest ? "mostrar o que foi desbloqueado" : "ver como convidado"}
    </button>
  );
}
const GUEST_NOTE = "Convidados não veem este trecho: pra eles, a página segue como se ele não existisse.";

/** Linhas da ficha (infobox ou taxonomia) que entram antes do fato público `index`. */
export function RestritoRows({ area, index }: { area: "ficha" | "tax-ficha"; index: number }) {
  const items = useRestritoAt(area, index);
  return (
    <>
      {items.map((it, i) => (
        <UnlockedRow key={i} item={it} />
      ))}
    </>
  );
}
function UnlockedRow({ item }: { item: WikiRestritoItem }) {
  const [guest, setGuest] = useState(false);
  return (
    <tr className="pg-unlocked-row">
      <th>
        {item.key}
        <Badge />
      </th>
      <td>
        {guest ? <span className="pg-unlocked-guest">{GUEST_NOTE}</span> : fieldValue(item.value || "")}
        <GuestSwitch guest={guest} onToggle={() => setGuest(!guest)} />
      </td>
    </tr>
  );
}

/** Blocos (notas, seções, posts, sessões) que entram antes do item público `index`. */
export function RestritoBlocks({ area, index }: { area: "notas" | "secoes" | "posts" | "tax-notas" | "sessoes"; index: number }) {
  const items = useRestritoAt(area, index);
  return (
    <>
      {items.map((it, i) => (
        <UnlockedBlock key={i} item={it} area={area} />
      ))}
    </>
  );
}
function UnlockedBlock({ item, area }: { item: WikiRestritoItem; area: string }) {
  const [guest, setGuest] = useState(false);
  const text = item.kind === "campo" ? item.value : item.kind === "sessao" ? item.recap : item.body;
  let heading: ReactNode;
  if (area === "posts") heading = (item.date ? item.date + " · " : "") + (item.title || "(sem título)");
  else if (area === "sessoes") heading = (item.title || "Sessão") + (item.date ? " · " + item.date : "");
  else heading = item.kind === "campo" ? item.key : item.title || "Seção";
  const body = (
    <div className="pg-unlocked-body">
      {guest ? <p className="pg-unlocked-guest">{GUEST_NOTE}</p> : <RenderMarkdown text={text || ""} />}
      <GuestSwitch guest={guest} onToggle={() => setGuest(!guest)} />
    </div>
  );
  if (area === "notas" || area === "tax-notas" || area === "sessoes")
    return (
      <div className="pg-unlocked">
        <h2 className="cathead">
          {heading}
          <Badge />
        </h2>
        {body}
      </div>
    );
  return (
    <details className={"wiki-section pg-unlocked" + (area === "posts" ? " post" : "")} open>
      <summary className={area === "secoes" ? "cathead" : "post-summary"}>
        {heading}
        <Badge />
      </summary>
      {body}
    </details>
  );
}

/** Tags e alcunhas restritas, no meio das públicas. */
export function RestritoInline({ area, index }: { area: "tags" | "aliases"; index: number }) {
  const items = useRestritoAt(area, index);
  return (
    <>
      {items.map((it, i) =>
        area === "tags" ? (
          <span key={i} className="tag pg-unlocked-tag" title="🔐 desbloqueado pra você">
            {"🔐 #" + it.text}
          </span>
        ) : (
          <Fragment key={i}>
            <div className="alias-line pg-unlocked-alias" title="🔐 desbloqueado pra você">
              {"🔐 " + it.text}
            </div>
          </Fragment>
        ),
      )}
    </>
  );
}
