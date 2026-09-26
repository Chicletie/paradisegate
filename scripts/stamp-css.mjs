// Acrescenta ?v=<hash do conteúdo> no link do wiki.css nas páginas que o carregam por caminho
// fixo. O arquivo continua se chamando assets/wiki.css (vite.config.ts): reset-senha.html e
// cadastro.html, fora do bundle, dependem desse nome fixo pra carregar o mesmo CSS do site. O
// problema é o Cache-Control do GitHub Pages (max-age=600): depois de um deploy que muda CSS e
// HTML juntos, um navegador que já tinha o site aberto pode ficar até 10 minutos com o wiki.css
// velho enquanto o JS novo (esse com hash no nome) já carregou — foi assim que o selo saiu vazio
// no PR do selo (Chicletie/paradisegate#20), até um Ctrl+F5. Com a versão no link, o navegador
// pede o CSS de novo assim que o conteúdo muda, sem esperar o cache expirar.
//
// dist/index.html é o molde que scripts/prerender.mjs clona pra cada página da wiki, então
// carimbar só ele já cobre todas elas. dist/fichas.html não entra: por design ela não carrega o
// wiki.css (scripts/check-ficha.mjs trava o build se isso mudar).
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const LINK = /\/assets\/wiki\.css(\?v=[0-9a-f]{8})?"/g;

/**
 * Troca o link do wiki.css pela versão carimbada. `null` se o arquivo não carrega esse CSS
 * (é o caso de erro real: alguém tirou o link sem querer). Reescrever com o mesmo hash de antes
 * (CSS não mudou desde o último build) é um resultado válido, não "não achei".
 */
export function stampWikiCssLink(html, version) {
  if (!html.includes("/assets/wiki.css")) return null;
  return html.replace(LINK, `/assets/wiki.css?v=${version}"`);
}

export function cssVersion(cssContent) {
  return createHash("sha256").update(cssContent).digest("hex").slice(0, 8);
}

function main() {
  const v = cssVersion(readFileSync("dist/assets/wiki.css"));
  for (const file of ["dist/index.html", "dist/reset-senha.html", "dist/cadastro.html"]) {
    const html = readFileSync(file, "utf8");
    const stamped = stampWikiCssLink(html, v);
    if (stamped === null) {
      console.error(`${file}: não achei o link do wiki.css pra carimbar`);
      process.exit(1);
    }
    writeFileSync(file, stamped);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
