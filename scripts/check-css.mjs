// Falha o build se o CSS publicado usar media query em sintaxe de intervalo (width<=…),
// que Safari antes do 16.4 ignora — o celular antigo recebia o layout de computador.
import { readFileSync } from "node:fs";

const css = readFileSync("dist/assets/wiki.css", "utf8");
const bad = css.match(/@media[^{]*\(\s*(width|height)\s*[<>]/g);
if (bad) {
  console.error("CSS com media query de intervalo (quebra iOS antigo):", bad.slice(0, 5));
  process.exit(1);
}
