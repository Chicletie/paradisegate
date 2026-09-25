import type { StatusKind, SyncStatus } from "./sync";

/*
 * O que o sync mostra dentro da fichas.html, com a cara da própria ficha (as variáveis e as classes
 * dela: .save-status, .toolbar-btn, --panel, --gold): o estado da conta ao lado do "Salvo neste
 * dispositivo", o atalho pra Minhas Fichas e o aviso de conflito. Conferido por captura, não por teste.
 */

const TEXT: Record<StatusKind, string> = {
  connecting: "Conectando à conta…",
  saving: "Salvando na conta…",
  saved: "Salvo na conta",
  pending: "Sem conexão: salvo só neste aparelho",
  signed_out: "Entre na wiki pra salvar na conta",
  expired: "Sessão expirou: entre de novo na wiki",
  not_invited: "Sua conta ainda não foi liberada pra mesa",
  not_found: "Ficha não encontrada nesta conta",
  too_large: "Ficha grande demais pra conta: salva só neste aparelho",
  local_error: "A ficha deste aparelho está com erro: não enviada",
  conflict: "Esta ficha mudou em outro aparelho",
  open_failed: "Não consegui abrir a ficha da conta",
  other_tab: "Aberta em outra aba: ela salva na conta",
  unavailable: "A conta do jogo não está disponível neste endereço",
  error: "Não consegui salvar na conta: salva neste aparelho",
  read_only: "só leitura, o que mudar aqui não vai pra conta",
  read_only_stale: "mudou desde que você abriu",
};

const TONE: Record<StatusKind, "ok" | "busy" | "warn"> = {
  connecting: "busy",
  saving: "busy",
  saved: "ok",
  pending: "warn",
  signed_out: "warn",
  expired: "warn",
  not_invited: "warn",
  not_found: "warn",
  too_large: "warn",
  local_error: "warn",
  conflict: "warn",
  open_failed: "warn",
  other_tab: "ok",
  unavailable: "warn",
  error: "warn",
  read_only: "warn",
  read_only_stale: "warn",
};

const NEEDS_LOGIN = new Set<StatusKind>(["signed_out", "expired"]);

const CSS = `
.meta-toolbar{ flex-wrap:wrap; row-gap:6px; }
.meta-toolbar .pg-cloud{ margin-right:0; }
.meta-toolbar .pg-cloud + .save-status{ margin-left:10px; }
.pg-cloud.is-ok::before{ background:var(--sky); }
.pg-cloud.is-busy::before{ background:var(--gold); }
.pg-cloud.is-warn{ color:var(--gold); opacity:1; }
.pg-cloud.is-warn::before{ background:var(--gold); }
.pg-cloud a{ color:inherit; text-underline-offset:2px; }
.pg-cloud button{
  background:none; border:0; padding:0 0 0 6px; color:inherit; font:inherit; letter-spacing:inherit;
  text-transform:inherit; text-decoration:underline; text-underline-offset:2px; cursor:pointer;
}
a.pg-back{ text-decoration:none; display:inline-flex; align-items:center; }
.pg-conflict{
  position:fixed; z-index:100000; left:50%; top:12px; transform:translateX(-50%);
  width:min(560px, calc(100% - 24px)); box-sizing:border-box;
  background:var(--panel); color:var(--ink); border:1px solid var(--gold-dim); border-radius:var(--radius, 14px);
  box-shadow:0 12px 32px rgba(0,0,0,.45); padding:16px 18px;
}
.pg-conflict h2{
  margin:0 0 6px; font-family:'Cinzel',serif; font-size:1rem; letter-spacing:.04em; color:var(--gold);
}
.pg-conflict p{ margin:0 0 14px; font-family:'EB Garamond',serif; font-size:1.02rem; line-height:1.4; color:var(--ink-dim); }
.pg-conflict-actions{ display:flex; flex-wrap:wrap; gap:8px; }
.pg-conflict .toolbar-btn{ opacity:1; padding:8px 14px; font-size:.7rem; }
.pg-conflict .toolbar-btn.is-main{ color:var(--gold); border-color:var(--gold-dim); }
`;

function clock(at: number): string {
  return new Date(at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export type SyncUi = {
  status(status: SyncStatus): void;
  showConflict(choose: (choice: "remote" | "local") => void): void;
};

/** `onRefresh`: "Atualizar" do só leitura, quando o jogador mudou a ficha depois que ela abriu. */
export function mountSyncUi(doc: Document, options: { onRefresh?: () => void } = {}): SyncUi {
  const style = doc.createElement("style");
  style.textContent = CSS;
  doc.head.appendChild(style);

  const local = doc.getElementById("save-status");
  const toolbar = local?.parentElement ?? null;

  const cloud = doc.createElement("span");
  cloud.className = "save-status pg-cloud is-busy";
  cloud.setAttribute("role", "status");
  cloud.textContent = TEXT.connecting;

  const back = doc.createElement("a");
  back.className = "toolbar-btn pg-back";
  back.href = "/wiki/_perfil#fichas";
  back.textContent = "‹ Minhas fichas";

  if (toolbar && local) {
    toolbar.insertBefore(back, toolbar.firstChild);
    toolbar.insertBefore(cloud, local);
  } else {
    // A ficha mudou de estrutura: o estado da conta vai num canto fixo, sem quebrar nada.
    cloud.style.cssText = "position:fixed;right:10px;bottom:10px;z-index:100000;background:var(--panel);padding:6px 10px;border-radius:6px;opacity:1";
    doc.body.appendChild(cloud);
  }

  let banner: HTMLElement | null = null;

  function status(s: SyncStatus): void {
    cloud.className = `save-status pg-cloud is-${TONE[s.kind]}`;
    let text = TEXT[s.kind];
    if (s.kind === "saved" && s.at) text += " às " + clock(s.at);
    if (s.kind === "read_only" || s.kind === "read_only_stale") {
      text = "Ficha de " + (s.owner || "outro jogador") + ": " + text;
      // O mestre veio da página da mesa: volta pra lá.
      back.href = "/jogo/mesa";
      back.textContent = "‹ Fichas da mesa";
    }
    cloud.replaceChildren();
    if (s.kind === "read_only_stale" && options.onRefresh) {
      const refresh = doc.createElement("button");
      refresh.type = "button";
      refresh.textContent = "Atualizar";
      refresh.addEventListener("click", options.onRefresh);
      cloud.append(text + ".", refresh);
    } else if (NEEDS_LOGIN.has(s.kind)) {
      const link = doc.createElement("a");
      link.href = "/wiki";
      link.textContent = text;
      cloud.appendChild(link);
    } else {
      cloud.textContent = text;
    }
    if (s.kind !== "conflict" && banner) {
      banner.remove();
      banner = null;
    }
  }

  function showConflict(choose: (choice: "remote" | "local") => void): void {
    banner?.remove();
    const box = doc.createElement("section");
    box.className = "pg-conflict";
    box.setAttribute("role", "alertdialog");
    box.setAttribute("aria-labelledby", "pg-conflict-title");

    const title = doc.createElement("h2");
    title.id = "pg-conflict-title";
    title.textContent = "Esta ficha mudou em outro aparelho";
    const text = doc.createElement("p");
    text.textContent =
      "A conta tem uma versão mais nova que a deste aparelho, e este aparelho também tem mudanças. Escolha qual fica: a outra é substituída.";

    const actions = doc.createElement("div");
    actions.className = "pg-conflict-actions";
    const remote = doc.createElement("button");
    remote.type = "button";
    remote.className = "toolbar-btn is-main";
    remote.textContent = "Carregar a da conta";
    const local = doc.createElement("button");
    local.type = "button";
    local.className = "toolbar-btn";
    local.textContent = "Manter a deste aparelho";

    const pick = (choice: "remote" | "local") => {
      remote.disabled = true;
      local.disabled = true;
      choose(choice);
    };
    remote.addEventListener("click", () => pick("remote"));
    local.addEventListener("click", () => pick("local"));

    actions.append(remote, local);
    box.append(title, text, actions);
    doc.body.appendChild(box);
    banner = box;
    remote.focus();
  }

  return { status, showConflict };
}
