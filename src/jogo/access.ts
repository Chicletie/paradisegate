import { useEffect, useState } from "react";
import { useAccount } from "../lib/account";
import { jogoApi } from "./api";
import { NotInvitedError, type Features, type Me } from "./apiClient";

/*
 * Quem é a conta logada nas páginas do jogo e o que o site mostra pra ela. Quem decide é a API
 * (`/users/me` → `features`): o site não sabe regra de papel nem de chave, só lê a resposta. Uma
 * pergunta por conta e por carregamento da página: o perfil, a barra de navegação e o menu leem a
 * mesma. Sem ninguém logado, não pergunta nada.
 */

export type JogoAccess =
  | { kind: "none" }
  | { kind: "loading" }
  | { kind: "ready"; me: Me }
  | { kind: "not_invited" }
  | { kind: "error" };

const NOTHING: Features = { fichas: false, mesa: false };

/** O que mostrar pra esta conta; enquanto não sabe (ou sem conta na mesa), nada. */
export function featuresOf(access: JogoAccess): Features {
  return access.kind === "ready" ? access.me.features : NOTHING;
}

const answers = new Map<string, Promise<Me>>();

function meFor(uid: string): Promise<Me> {
  let answer = answers.get(uid);
  if (!answer) {
    answer = jogoApi().me();
    answers.set(uid, answer);
    // Sem convite é resposta; erro de rede não: a próxima página pergunta de novo.
    answer.catch((e) => {
      if (!(e instanceof NotInvitedError)) answers.delete(uid);
    });
  }
  return answer;
}

export function useJogoAccess(): JogoAccess {
  const { user } = useAccount();
  const uid = user?.uid ?? null;
  const [result, setResult] = useState<{ uid: string; access: JogoAccess } | null>(null);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    meFor(uid).then(
      (me) => alive && setResult({ uid, access: { kind: "ready", me } }),
      (e) => alive && setResult({ uid, access: e instanceof NotInvitedError ? { kind: "not_invited" } : { kind: "error" } }),
    );
    return () => {
      alive = false;
    };
  }, [uid]);

  if (!uid) return { kind: "none" };
  if (!result || result.uid !== uid) return { kind: "loading" };
  return result.access;
}
