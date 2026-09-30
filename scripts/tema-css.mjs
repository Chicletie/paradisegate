// Tema escolhido à mão (2026-09-29). O CSS escreve o escuro uma vez só, em
// `@media (prefers-color-scheme: dark) { … }`; este passo do build faz de cada bloco desses dois:
//   - o automático, que só vale se o leitor não escolheu o claro:
//       @media (prefers-color-scheme: dark) { :where(:root:not([data-theme="light"])) body.x { … } }
//   - o escolhido à mão, que vale em qualquer aparelho:
//       :where(:root[data-theme="dark"]) body.x { … }
// O `:where()` não pesa na disputa entre regras, então a ordem e a força de cada regra continuam
// as mesmas de antes. `:root` sozinho vira `:root:where(…)` (mesma força do `:root` original).
// O botão (src/components/ThemeToggle.tsx) põe ou tira `data-theme` no <html>.

const AUTO = ':not([data-theme="light"])';
const MANUAL = '[data-theme="dark"]';

function scope(selector, cond) {
  return selector
    .split(",")
    .map((s) => {
      const t = s.trim();
      if (!t) return t;
      if (t === ":root" || t.startsWith(":root ") || t.startsWith(":root:") || t.startsWith(":root[") || t.startsWith(":root."))
        return ":root:where(" + cond + ")" + t.slice(5);
      return ":where(:root" + cond + ") " + t;
    })
    .join(", ");
}

// Regras de dentro de um bloco (sem at-rule aninhada): [{ sel, body }].
function rules(inner) {
  const out = [];
  let i = 0;
  const s = inner.replace(/\/\*[\s\S]*?\*\//g, "");
  while (i < s.length) {
    const open = s.indexOf("{", i);
    if (open < 0) break;
    const close = s.indexOf("}", open);
    if (close < 0) throw new Error("tema-css: bloco sem fechar");
    const sel = s.slice(i, open).trim();
    if (sel.startsWith("@")) throw new Error("tema-css: at-rule dentro do bloco escuro não é suportada: " + sel);
    out.push({ sel, body: s.slice(open + 1, close).trim() });
    i = close + 1;
  }
  return out;
}

const HEAD = /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{/g;

export function temaManualCss(css) {
  let out = "";
  let last = 0;
  let m;
  HEAD.lastIndex = 0;
  while ((m = HEAD.exec(css))) {
    // acha o } que fecha o @media
    let depth = 1;
    let j = HEAD.lastIndex;
    for (; j < css.length && depth; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
    }
    const inner = css.slice(HEAD.lastIndex, j - 1);
    const rs = rules(inner);
    const auto = rs.map((r) => scope(r.sel, AUTO) + " { " + r.body + " }").join("\n  ");
    const manual = rs.map((r) => scope(r.sel, MANUAL) + " { " + r.body + " }").join("\n");
    out += css.slice(last, m.index) + "@media (prefers-color-scheme: dark) {\n  " + auto + "\n}\n" + manual + "\n";
    last = j;
    HEAD.lastIndex = j;
  }
  if (!last) return css;
  return out + css.slice(last);
}

/** Plugin do Vite: roda depois do Tailwind (que junta os @import do src/index.css num CSS só). */
export function temaManual() {
  return {
    name: "pg-tema-manual",
    transform(code, id) {
      if (!/\.css($|\?)/.test(id) || !code.includes("prefers-color-scheme")) return null;
      return { code: temaManualCss(code), map: null };
    },
  };
}
