import { useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useAccount } from "../lib/account";
import { PageObrasContext, ProgressContext, readGuestProgress, useSpoilerProgress, writeGuestProgress } from "../lib/spoilerProgress";
import type { SpoilerObra, SpoilerProgress } from "../types";

/** Até onde o leitor já viu cada obra: na conta (logado) ou no navegador (convidado). */
export function SpoilerProgressProvider({ children }: { children: ReactNode }) {
  const { user, guest, profile, save } = useAccount();
  const [local, setLocal] = useState<SpoilerProgress>(readGuestProgress);
  const inAccount = !!user && !guest;
  const progress = useMemo(() => (inAccount ? profile?.progress || {} : local), [inAccount, profile, local]);
  const setSeen = useCallback(
    (obraId: string, seasonId: string) => {
      if (inAccount) {
        void save({ progress: { obraId, seasonId } });
        return;
      }
      setLocal((p) => {
        const next = { ...p, [obraId]: seasonId };
        writeGuestProgress(next);
        return next;
      });
    },
    [inAccount, save],
  );
  const value = useMemo(() => ({ progress, inAccount, setSeen }), [progress, inAccount, setSeen]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

/** As obras da página, pra os trechos saberem de onde são. */
export function PageObrasProvider({ obras, children }: { obras: SpoilerObra[] | undefined; children: ReactNode }) {
  return <PageObrasContext.Provider value={obras || []}>{children}</PageObrasContext.Provider>;
}

/** Seletor de uma obra: nada / até a temporada N / tudo. */
export function ProgressPicker({ obra }: { obra: SpoilerObra }) {
  const { progress, setSeen } = useSpoilerProgress();
  const id = "pg-prog-" + obra.id;
  return (
    <label className="pg-prog-pick" htmlFor={id}>
      <span className="pg-prog-name">{obra.name}</span>
      <select id={id} value={progress[obra.id] || ""} onChange={(ev) => setSeen(obra.id, ev.target.value)}>
        <option value="">não vi nada ainda</option>
        {obra.seasons.map((s) => (
          <option key={s.id} value={s.id}>
            vi até {s.name}
          </option>
        ))}
        <option value="*">vi tudo</option>
      </select>
    </label>
  );
}

/** Barrinha no alto da página, só pra quem não tem conta (quem tem escolhe no perfil). */
export function SpoilerProgressBar() {
  const obras = useContext(PageObrasContext);
  const { inAccount } = useSpoilerProgress();
  if (inAccount || !obras.length) return null;
  return (
    <aside className="pg-prog-bar" aria-label="Até onde você já viu">
      <span className="pg-prog-lead">Esta página tem spoilers. Até onde você já viu?</span>
      <div className="pg-prog-list">
        {obras.map((o) => (
          <ProgressPicker key={o.id} obra={o} />
        ))}
      </div>
    </aside>
  );
}
