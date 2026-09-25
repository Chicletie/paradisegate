import { jogoApi } from "../jogo/api";
import { parseSheetId } from "./keys";
import { mountNotes } from "./notes";
import { createSheetSync, type KeyValue } from "./sync";
import { mountSyncUi } from "./ui";

/*
 * Entrada da fichas.html (script type="module", roda depois do script da ficha). Sem `?sheet=`,
 * a ficha é só deste aparelho, como sempre foi: nada aqui liga.
 */

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

/** localStorage/sessionStorage podem recusar (aba anônima, cota cheia): nunca derruba a ficha. */
function safe(storage: () => Storage): KeyValue {
  return {
    get(key) {
      try {
        return storage().getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        storage().setItem(key, value);
      } catch {
        /* sem espaço: o sync tenta de novo na próxima mudança */
      }
    },
    remove(key) {
      try {
        storage().removeItem(key);
      } catch {
        /* nada a fazer */
      }
    },
  };
}

const TICK_MS = 5000;

function start(sheetId: number): void {
  const ui = mountSyncUi(document, { onRefresh: () => location.reload() });
  const api = jogoApi(() => ui.status({ kind: "connecting" }));
  let owner = "";
  const sync = createSheetSync({
    sheetId,
    local: safe(() => localStorage),
    session: safe(() => sessionStorage),
    api,
    reload: () => location.reload(),
    onStatus: (s) => {
      if (s.owner) owner = s.owner;
      ui.status(s);
    },
    onConflict: () => ui.showConflict((choice) => void sync.resolveConflict(choice)),
  });

  async function run(): Promise<never> {
    await sync.boot();
    // Sugestões do mestre: ele escreve na ficha de um jogador (só leitura); a dona lê na dela.
    if (sync.phase === "read_only") mountNotes(document, { api, sheetId, mode: "mestre", owner });
    else if (sync.phase === "ready" || sync.phase === "conflict") mountNotes(document, { api, sheetId, mode: "dona" });
    setInterval(() => void sync.tick(), TICK_MS);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") sync.flush();
      else void sync.tick();
    });
    window.addEventListener("pagehide", () => sync.flush());
    // Segura a trava enquanto a aba estiver aberta.
    return new Promise<never>(() => {});
  }

  // A mesma ficha em duas abas: só a que tem a trava fala com a conta; a outra espera ela fechar.
  // (A gaveta é a mesma pras duas, então o que se muda em qualquer uma sobe.)
  if (!navigator.locks) {
    void run();
    return;
  }
  const name = `pg-sheet-${sheetId}`;
  void navigator.locks.request(name, { ifAvailable: true }, (lock) => {
    if (lock) return run();
    ui.status({ kind: "other_tab" });
    void navigator.locks.request(name, () => run());
    return undefined;
  });
}

const sheetId = parseSheetId(location.search);
if (sheetId !== null) start(sheetId);
