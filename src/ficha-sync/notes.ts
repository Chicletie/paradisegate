import type { ApiClient, SheetNote } from "../jogo/apiClient";

/*
 * "Sugestões do mestre" dentro da fichas.html, com a cara da ficha (--panel, --gold, .toolbar-btn).
 * - mestre (abriu a ficha de um jogador, só leitura): escreve, vê e apaga as sugestões.
 * - dona: vê as sugestões que o mestre deixou; abrir a caixa conta como visto.
 * Um botão na barra da ficha abre e fecha a caixa, logo abaixo da barra. Texto sempre por
 * textContent: nada do que alguém escreve vira HTML.
 */

export type NotesMode = "mestre" | "dona";
type NotesApi = Pick<ApiClient, "listSheetNotes" | "createNote" | "deleteNote" | "markNotesSeen">;

const MAX = 2000;

const CSS = `
.pg-notes-toggle .pg-notes-count{ color:var(--gold); margin-left:4px; }
.pg-notes{
  margin:0 0 12px; padding:14px 16px 16px; border:1px solid var(--gold-dim); border-radius:var(--radius, 14px);
  background:var(--panel);
}
.pg-notes[hidden]{ display:none; }
.pg-notes h2{ margin:0 0 10px; font-family:'Cinzel',serif; font-size:.95rem; letter-spacing:.04em; color:var(--gold); }
.pg-notes textarea{
  box-sizing:border-box; width:100%; min-height:84px; resize:vertical; padding:10px 12px;
  background:var(--panel-2); color:var(--ink); border:1px solid var(--line); border-radius:8px;
  font-family:'EB Garamond',serif; font-size:1.02rem; line-height:1.4;
}
.pg-notes textarea:focus{ outline:2px solid var(--gold-dim); outline-offset:1px; }
.pg-notes-send{ display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin:8px 0 4px; }
.pg-notes-send .toolbar-btn{ opacity:1; padding:7px 14px; color:var(--gold); border-color:var(--gold-dim); }
.pg-notes-status{ font-family:'Oswald',sans-serif; font-size:.62rem; letter-spacing:.06em; text-transform:uppercase; color:var(--ink-dim); }
.pg-notes-status.is-bad{ color:var(--gold); }
.pg-notes ul{ list-style:none; margin:10px 0 0; padding:0; }
.pg-notes li{ padding:10px 0; border-top:1px solid var(--line); }
.pg-notes li p{ margin:0 0 6px; white-space:pre-wrap; font-family:'EB Garamond',serif; font-size:1.05rem; line-height:1.45; color:var(--ink); }
.pg-notes-meta{ display:flex; flex-wrap:wrap; align-items:center; gap:4px 12px; font-family:'Oswald',sans-serif; font-size:.6rem; letter-spacing:.06em; text-transform:uppercase; color:var(--ink-dim); }
.pg-notes-meta .is-new{ color:var(--gold); }
.pg-notes-meta button{ background:none; border:0; padding:0; color:var(--ink-dim); font:inherit; letter-spacing:inherit; text-transform:inherit; text-decoration:underline; cursor:pointer; }
.pg-notes-meta button:hover{ color:var(--sky); }
.pg-notes-empty{ margin:6px 0 0; font-family:'EB Garamond',serif; font-style:italic; color:var(--ink-dim); }
`;

function when(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(t);
}

export function mountNotes(doc: Document, opts: { api: NotesApi; sheetId: number; mode: NotesMode; owner?: string }): void {
  const { api, sheetId, mode } = opts;
  const toolbar = doc.querySelector(".meta-toolbar");
  if (!toolbar) return;

  const style = doc.createElement("style");
  style.textContent = CSS;
  doc.head.appendChild(style);

  const toggle = doc.createElement("button");
  toggle.type = "button";
  toggle.className = "toolbar-btn pg-notes-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "pg-notes");
  const label = doc.createElement("span");
  label.textContent = "Sugestões do mestre";
  const count = doc.createElement("span");
  count.className = "pg-notes-count";
  toggle.append(label, count);

  const box = doc.createElement("section");
  box.id = "pg-notes";
  box.className = "pg-notes";
  box.hidden = true;
  box.setAttribute("aria-labelledby", "pg-notes-title");
  const title = doc.createElement("h2");
  title.id = "pg-notes-title";
  title.textContent = mode === "mestre" ? "Sugestões pra " + (opts.owner || "o jogador") : "Sugestões do mestre";
  box.appendChild(title);

  const status = doc.createElement("span");
  status.className = "pg-notes-status";
  status.setAttribute("role", "status");
  function say(msg: string, bad = false) {
    status.textContent = msg;
    status.className = "pg-notes-status" + (bad ? " is-bad" : "");
  }

  let input: HTMLTextAreaElement | null = null;
  let send: HTMLButtonElement | null = null;
  if (mode === "mestre") {
    input = doc.createElement("textarea");
    input.maxLength = MAX;
    input.placeholder = "Um comentário ou uma sugestão sobre a ficha. Aparece no perfil do jogador.";
    input.setAttribute("aria-label", "Sugestão pro jogador");
    const row = doc.createElement("div");
    row.className = "pg-notes-send";
    send = doc.createElement("button");
    send.type = "button";
    send.className = "toolbar-btn";
    send.textContent = "Enviar sugestão";
    row.append(send, status);
    box.append(input, row);
  } else {
    box.appendChild(status);
  }

  const list = doc.createElement("ul");
  box.appendChild(list);

  // Caixa logo abaixo da barra da ficha; o botão entra depois do "‹ Minhas fichas".
  toolbar.insertAdjacentElement("afterend", box);
  const back = toolbar.querySelector(".pg-back");
  if (back) back.insertAdjacentElement("afterend", toggle);
  else toolbar.insertBefore(toggle, toolbar.firstChild);

  let notes: SheetNote[] = [];
  let seenSent = false;

  /** "· 2", ou pra dona com novidade, "· 1 nova". */
  function countText(): string {
    const fresh = notes.filter((n) => !n.seen_at).length;
    if (mode === "dona" && fresh) return `· ${fresh} ${fresh === 1 ? "nova" : "novas"}`;
    if (notes.length) return `· ${notes.length}`;
    return "";
  }

  function render() {
    list.replaceChildren();
    count.textContent = countText();
    if (!notes.length) {
      const empty = doc.createElement("p");
      empty.className = "pg-notes-empty";
      empty.textContent = mode === "mestre" ? "Nenhuma sugestão pra esta ficha ainda." : "O mestre ainda não deixou sugestões nesta ficha.";
      list.appendChild(empty);
      return;
    }
    for (const note of notes) {
      const li = doc.createElement("li");
      const text = doc.createElement("p");
      text.textContent = note.text;
      const meta = doc.createElement("span");
      meta.className = "pg-notes-meta";
      const date = doc.createElement("span");
      date.textContent = when(note.created_at) + (note.author ? " · @" + note.author : "");
      meta.appendChild(date);
      const seen = doc.createElement("span");
      if (mode === "mestre") seen.textContent = note.seen_at ? "vista" : "ainda não vista";
      else if (!note.seen_at) seen.textContent = "nova";
      if (!note.seen_at) seen.className = "is-new";
      if (seen.textContent) meta.appendChild(seen);
      if (mode === "mestre") {
        const del = doc.createElement("button");
        del.type = "button";
        del.textContent = "Apagar";
        del.setAttribute("aria-label", "Apagar esta sugestão");
        del.addEventListener("click", () => void remove(note, del));
        meta.appendChild(del);
      }
      li.append(text, meta);
      list.appendChild(li);
    }
  }

  async function load() {
    try {
      notes = await api.listSheetNotes(sheetId);
      render();
      // A dona só vê o botão se o mestre já deixou alguma coisa.
      if (mode === "dona" && !notes.length) toggle.hidden = true;
    } catch {
      if (mode === "dona") toggle.hidden = true;
      else say("Não consegui ler as sugestões agora.", true);
    }
  }

  async function remove(note: SheetNote, button: HTMLButtonElement) {
    button.disabled = true;
    try {
      await api.deleteNote(sheetId, note.id);
      notes = notes.filter((n) => n.id !== note.id);
      render();
      say("Sugestão apagada.");
    } catch {
      button.disabled = false;
      say("Não consegui apagar agora. Tente de novo.", true);
    }
  }

  send?.addEventListener("click", async () => {
    const text = (input?.value || "").trim();
    if (!text || !send || !input) return say("Escreva a sugestão antes de enviar.", true);
    send.disabled = true;
    say("Enviando…");
    try {
      const note = await api.createNote(sheetId, text);
      notes = [note, ...notes];
      input.value = "";
      render();
      say("Enviada: aparece no perfil do jogador.");
    } catch {
      say("Não consegui enviar agora. O texto continua aqui; tente de novo.", true);
    } finally {
      send.disabled = false;
    }
  });

  toggle.addEventListener("click", () => {
    const open = box.hidden;
    box.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) (input ?? toggle).focus();
    if (open && mode === "dona" && !seenSent && notes.some((n) => !n.seen_at)) {
      seenSent = true;
      void api.markNotesSeen().then(
        () => {
          notes = notes.map((n) => (n.seen_at ? n : { ...n, seen_at: new Date().toISOString() }));
          count.textContent = countText();
        },
        () => {
          seenSent = false;
        },
      );
    }
  });

  void load();
}
