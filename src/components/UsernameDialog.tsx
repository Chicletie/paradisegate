import { useEffect, useRef, useState } from "react";
import { Modal, useAccount } from "../lib/account";
import { checkUsername, FunctionError, type UsernameCheck } from "../lib/api";

/**
 * Janela de escolher ou trocar o username. Dois passos: digitar (o servidor confere na hora se
 * serve e se está livre) e confirmar (a troca prende o nome por um tempo, que o servidor diz).
 * A regra toda (forma, nomes proibidos, prazo entre trocas) mora no servidor
 * (functions/username.js no repo do autor): aqui só se mostra a resposta dele.
 */
export function UsernameDialog({ onClose }: { onClose: () => void }) {
  const { profile, setUsername } = useAccount();
  const current = profile?.username || "";
  const [raw, setRaw] = useState("");
  const [check, setCheck] = useState<UsernameCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  // Ao abrir: a troca está presa? (e quanto tempo prende se trocar agora)
  const [opening, setOpening] = useState<UsernameCheck | null>(null);
  const [step, setStep] = useState<"edit" | "confirm" | "saving" | "done">("edit");
  const [saved, setSaved] = useState("");
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    checkUsername("").then(
      (r) => alive && setOpening(r),
      () => {},
    );
    return () => {
      alive = false;
    };
  }, []);

  // Confere um instante depois de parar de digitar.
  useEffect(() => {
    if (!raw.trim()) return;
    let alive = true;
    const t = setTimeout(() => {
      setChecking(true);
      checkUsername(raw).then(
        (r) => {
          if (!alive) return;
          setCheck(r);
          setCheckFailed(false);
          setChecking(false);
        },
        () => {
          if (!alive) return;
          setCheckFailed(true);
          setChecking(false);
        },
      );
    }, 350);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [raw]);

  useEffect(() => {
    if (step === "edit") inputRef.current?.focus();
  }, [step]);

  function save() {
    setStep("saving");
    setErr("");
    setUsername(raw).then(
      (name) => {
        setSaved(name);
        setStep("done");
      },
      (e) => {
        setStep("edit");
        setCheck(null);
        setErr(e instanceof FunctionError ? e.message : "Não deu pra salvar agora. Tente de novo.");
      },
    );
  }

  const fresh = check && raw.trim() && !checking ? check : null;
  let status = "";
  let tone = "";
  if (!raw.trim()) status = "";
  else if (checking) status = "Conferindo…";
  else if (checkFailed) {
    status = "Não consegui conferir agora.";
    tone = " is-bad";
  } else if (fresh?.problem) {
    status = fresh.problem;
    tone = " is-bad";
  } else if (fresh?.same) status = "Esse já é o seu username.";
  else if (fresh?.free === false) {
    status = `@${fresh.name} já está em uso.`;
    tone = " is-bad";
  } else if (fresh?.free) {
    status = `@${fresh.name} está livre.`;
    tone = " is-ok";
  }
  const canGo = !!fresh && !fresh.problem && !fresh.same && fresh.free === true;
  const lockedText = current ? opening?.lockedUntilText : "";

  let body;
  if (step !== "done" && lockedText) {
    body = (
      <>
        <h3 id="pg-un-title">Trocar username</h3>
        <p className="pg-un-text">
          Você trocou há pouco tempo. Dá pra trocar de novo a partir de <strong>{lockedText}</strong>.
        </p>
        <button className="submit" type="button" onClick={onClose}>
          Entendi
        </button>
      </>
    );
  } else if (step === "done") {
    body = (
      <>
        <h3 id="pg-un-title">Pronto</h3>
        <p className="pg-un-text">
          Agora você é <strong>@{saved}</strong>.
        </p>
        <button className="submit" type="button" onClick={onClose}>
          Fechar
        </button>
      </>
    );
  } else if ((step === "confirm" || step === "saving") && fresh) {
    body = (
      <>
        <h3 id="pg-un-title">{current ? "Confirmar a troca" : "Confirmar username"}</h3>
        <p className="pg-un-text">
          {current ? (
            <>
              Trocar <strong>@{current}</strong> por <strong>@{fresh.name}</strong>?{" "}
            </>
          ) : (
            <>
              Seu username vai ser <strong>@{fresh.name}</strong>.{" "}
            </>
          )}
          Depois disso, você só vai poder trocar de novo em <strong>{fresh.nextIfChangedText}</strong>.
          {current && " O nome antigo fica livre pra outra pessoa."}
        </p>
        <button className="submit" type="button" disabled={step === "saving"} onClick={save}>
          {step === "saving" ? "Salvando…" : current ? "Confirmar a troca" : "Confirmar"}
        </button>
        <button className="cancel" type="button" disabled={step === "saving"} onClick={() => setStep("edit")}>
          Voltar
        </button>
      </>
    );
  } else {
    body = (
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
            maxLength={40}
            value={raw}
            onChange={(ev) => {
              setRaw(ev.target.value);
              setErr("");
            }}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" && canGo) setStep("confirm");
            }}
            aria-describedby="pg-un-status"
          />
        </div>
        <p id="pg-un-status" className={"pg-un-status" + tone} aria-live="polite">
          {status || opening?.hint || " "}
        </p>
        {err && <div className="err">{err}</div>}
        <button className="submit" type="button" disabled={!canGo} onClick={() => setStep("confirm")}>
          Continuar
        </button>
        <button className="cancel" type="button" onClick={onClose}>
          Cancelar
        </button>
      </>
    );
  }

  return (
    <Modal onClose={step === "saving" ? () => {} : onClose}>
      <div className="pg-un" role="dialog" aria-modal="true" aria-labelledby="pg-un-title">
        {body}
      </div>
    </Modal>
  );
}
