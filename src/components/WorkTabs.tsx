import { useState, type ReactNode } from "react";

/**
 * Seletor de abas `.work-tabs`/`.work-tab` (porta de wireTabs em wiki-core.js, arvore):
 * usado pra Geral/variantes/Galeria/Citações/Taxonomia na entrada, e de novo pra
 * Relações/Genealogia/Linha do tempo. Só aparece o seletor quando há mais de uma aba — com
 * uma só, o conteúdo entra direto, sem moldura.
 */
export function WorkTabs({ tabs, label }: { tabs: { label: string; content: ReactNode }[]; label?: string }) {
  const [active, setActive] = useState(0);
  if (tabs.length === 0) return null;
  if (tabs.length === 1) return <>{tabs[0].content}</>;
  return (
    <>
      <div className="work-tabs" role="tablist" aria-label={label}>
        {tabs.map((t, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={"work-tab" + (i === active ? " on" : "")}
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={i} role="tabpanel" hidden={i !== active}>
          {t.content}
        </div>
      ))}
    </>
  );
}
