import { jogoApi } from "../jogo/api";
import { parseSheetId } from "./keys";
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
  const sync = createSheetSync({
    sheetId,
    local: safe(() => localStorage),
    session: safe(() => sessionStorage),
    api: jogoApi(() => ui.status({ kind: "connecting" })),
    reload: () => location.reload(),
    onStatus: ui.status,
    onConflict: () => ui.showConflict((choice) => void sync.resolveConflict(choice)),
  });

  async function run(): Promise<never> {
    await sync.boot();
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
