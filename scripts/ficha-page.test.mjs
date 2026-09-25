import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseSheetId, sheetKeys } from "../src/ficha-sync/keys.ts";

// A gaveta da ficha é escolhida por uma linha da fichas.html (script comum, fora do bundle do
// Vite) e lida pelo src/ficha-sync. As duas regras precisam dar o mesmo nome.
const html = readFileSync(new URL("../fichas.html", import.meta.url), "utf8");
const line = html.split(/\r?\n/).find((l) => l.startsWith("const SAVE_KEY"));

function saveKeyFor(search) {
  const expr = line.replace(/^const SAVE_KEY = /, "").replace(/;\s*$/, "");
  return new Function("location", `return ${expr};`)({ search });
}

describe("fichas.html", () => {
  it("[REGRESSÃO] sem ?sheet= usa a gaveta de sempre", () => {
    expect(saveKeyFor("")).toBe("fichaPG_save_v1");
    expect(saveKeyFor("?outra=1")).toBe("fichaPG_save_v1");
  });

  it("com ?sheet= usa a mesma gaveta que o sync lê", () => {
    for (const search of ["?sheet=12", "?sheet=0", "?sheet=abc", "?sheet=12x", "?sheet=" + "9".repeat(13)]) {
      const id = parseSheetId(search);
      expect(saveKeyFor(search), search).toBe(id === null ? "fichaPG_save_v1" : sheetKeys(id).drawer);
    }
  });

  it("o sync entra como módulo e o bloco antigo (pg_token, localhost) saiu", () => {
    expect(html).toContain('<script type="module" src="/src/ficha-sync/main.ts"></script>');
    expect(html).not.toContain("pg_token");
    expect(html).not.toContain("localhost:8000");
  });

  it("a ficha só usa a gaveta pelo SAVE_KEY", () => {
    const uses = html.match(/localStorage\.(getItem|setItem|removeItem)\(([^)]*)\)/g) || [];
    expect(uses.length).toBeGreaterThan(0);
    for (const use of uses) expect(use).toMatch(/\(SAVE_KEY/);
  });
});
