import { useEffect, useRef, useState } from "react";
import { Modal, useAccount } from "../lib/account";
import { usernameTaken } from "../lib/api";
import { fmtDay, nextChangeAt, normalizeUsername, usernameProblem, USERNAME_DAYS, USERNAME_MAX } from "../lib/username";

/**
 * Janela de escolher ou trocar o username. Dois passos: digitar (confere na hora se está livre)
 * e confirmar (a troca prende o nome por 30 dias). Quem nunca escolheu não passa pela
 * confirmação do prazo, mas vê o aviso de que só dá pra trocar de novo depois de 30 dias.
 */
export function UsernameDialog({ onClose }: { onClose: () => void }) {
  const { profile, setUsername } = useAccount();
  const current = profile?.username || "";
  const [raw, setRaw] = useState("");
  const [check, setCheck] = useState<"idle" | "checking" | "free" | "taken" | "error">("idle");
  const [step, setStep] = useState<"edit" | "confirm" | "saving" | "done">("edit");
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const name = normalizeUsername(raw);
  const problem = raw ? usernameProblem(name) : "";
  const same = !!current && name === current;
  // Travado pelos 30 dias quando a janela abriu (depois de salvar, quem manda é o "Pronto").
  const [lockedUntil] = useState(() => (profile?.username ? nextChangeAt(profile?.usernameChangedAt) : null));
  const [until] = useState(() => fmtDay(Date.now() + USERNAME_DAYS * 864e5));

  // Confere se está livre um instante depois de parar de digitar.
  useEffect(() => {
    if (!name || problem || same) return;
    let alive = true;
    const t = setTimeout(() => {
      setCheck("checking");
      usernameTaken(name).then(
        (taken) => alive && setCheck(taken ? "taken" : "free"),
        () => alive && setCheck("error"),
      );
    }, 350);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [name, problem, same]);

  useEffect(() => {
    if (step === "edit") inputRef.current?.focus();
  }, [step]);

  function save() {
    setStep("saving");
    setErr("");
    setUsername(name).then(
      () => setStep("done"),
      () => {
        setStep("edit");
        setCheck("idle");
        setErr("Não deu pra salvar: esse nome pode ter acabado de ser pego. Tente outro.");
      },
    );
  }

  const status =
    problem ||
    (same ? "Esse já é o seu username." : "") ||
    (check === "checking" ? "Conferindo…" : check === "taken" ? `@${name} já está em uso.` : check === "free" ? `@${name} está livre.` : check === "error" ? "Não consegui conferir agora." : "");
  const canGo = !!name && !problem && !same && check === "free";

  return (
    <Modal onClose={step === "saving" ? () => {} : onClose}>
      <div className="pg-un" role="dialog" aria-modal="true" aria-labelledby="pg-un-title">
        {step !== "done" && lockedUntil ? (
          <>
            <h3 id="pg-un-title">Trocar username</h3>
            <p className="pg-un-text">
              Você trocou há pouco tempo. Dá pra trocar de novo a partir de <strong>{fmtDay(lockedUntil)}</strong>.
            </p>
            <button className="submit" type="button" onClick={onClose}>
              Entendi
            </button>
          </>
        ) : step === "done" ? (
          <>
            <h3 id="pg-un-title">Pronto</h3>
            <p className="pg-un-text">
              Agora você é <strong>@{name}</strong>.
            </p>
            <button className="submit" type="button" onClick={onClose}>
              Fechar
            </button>
          </>
        ) : step === "confirm" || step === "saving" ? (
          <>
            <h3 id="pg-un-title">{current ? "Confirmar a troca" : "Confirmar username"}</h3>
            <p className="pg-un-text">
              {current ? (
                <>
                  Trocar <strong>@{current}</strong> por <strong>@{name}</strong>?{" "}
                </>
              ) : (
                <>
                  Seu username vai ser <strong>@{name}</strong>.{" "}
                </>
              )}
              Depois disso, você só vai poder trocar de novo em <strong>{until}</strong>.
              {current && " O nome antigo fica livre pra outra pessoa."}
            </p>
            <button className="submit" type="button" disabled={step === "saving"} onClick={save}>
              {step === "saving" ? "Salvando…" : current ? "Confirmar a troca" : "Confirmar"}
            </button>
            <button className="cancel" type="button" disabled={step === "saving"} onClick={() => setStep("edit")}>
              Voltar
            </button>
          </>
        ) : (
          <>
            <h3 id="pg-un-title">{current ? "Trocar username" : "Escolha seu username"}</h3>
            <p className="pg-un-text">
              É o seu nome único na wiki (o apelido pode repetir, o username não).
              {current && (
                <>
                  {" "}
                  Hoje: <strong>@{current}</strong>.
                </>
              )}
            </p>
            <label className="field-label" htmlFor="pg-un-in">
              Username
            </label>
            <div className="pg-un-field">
              <span aria-hidden="true">@</span>
              <input
                ref={inputRef}
                id="pg-un-in"
                type="text"
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                maxLength={USERNAME_MAX + 1}
                value={raw}
                onChange={(ev) => {
                  setRaw(ev.target.value);
                  setCheck("idle");
                  setErr("");
                }}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" && canGo) setStep("confirm");
                }}
                aria-describedby="pg-un-status"
              />
            </div>
            <p id="pg-un-status" className={"pg-un-status" + (problem || check === "taken" ? " is-bad" : check === "free" ? " is-ok" : "")} aria-live="polite">
              {status || "3 a 20 caracteres: letras sem acento, números e _."}
            </p>
            {err && <div className="err">{err}</div>}
            <button className="submit" type="button" disabled={!canGo} onClick={() => setStep("confirm")}>
              Continuar
            </button>
            <button className="cancel" type="button" onClick={onClose}>
              Cancelar
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
