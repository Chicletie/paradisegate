import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { temaManualCss } from "./tema-css.mjs";

describe("tema escolhido à mão", () => {
  it("cada bloco escuro vira o automático (sem escolha de claro) e o escolhido à mão", () => {
    const out = temaManualCss("a{color:red}\n@media (prefers-color-scheme: dark) {\n  /* nota */ body.pg-theme, .x .y { --c: #000; }\n  :root { --d: 1; }\n}\nb{}");
    expect(out).toContain('@media (prefers-color-scheme: dark) {\n  :where(:root:not([data-theme="light"])) body.pg-theme, :where(:root:not([data-theme="light"])) .x .y { --c: #000; }');
    expect(out).toContain(':root:where(:not([data-theme="light"])) { --d: 1; }');
    expect(out).toContain(':where(:root[data-theme="dark"]) body.pg-theme, :where(:root[data-theme="dark"]) .x .y { --c: #000; }');
    expect(out).toContain(':root:where([data-theme="dark"]) { --d: 1; }');
    expect(out.startsWith("a{color:red}\n")).toBe(true);
    expect(out.endsWith("\nb{}")).toBe(true);
    expect(out).not.toContain("nota");
  });
  it("CSS sem bloco escuro sai igual", () => {
    expect(temaManualCss("a{}")).toBe("a{}");
  });
  it("todos os CSS do site passam (nenhum bloco escuro com at-rule dentro)", () => {
    for (const f of ["src/styles/wiki.css", "src/styles/tokens.css", "src/styles/jogo.css"]) {
      const out = temaManualCss(readFileSync(f, "utf8"));
      expect(out).toContain('[data-theme="dark"]');
    }
  });
});
