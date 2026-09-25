// Falha o build se a ficha (dist/fichas.html) passar a carregar o Firestore ou o CSS da wiki: ela
// só precisa do login, e tudo que ela puxa a mais é peso no celular no meio da sessão de jogo.
import { readFileSync } from "node:fs";

const html = readFileSync("dist/fichas.html", "utf8");
const problems = [];

if (/href="\/assets\/wiki\.css"/.test(html)) problems.push("a ficha carrega o wiki.css");
if (!/<script type="module"[^>]*src="\/assets\/fichas-[^"]+\.js"/.test(html)) problems.push("a ficha não carrega o sync (fichas-*.js)");

const seen = new Set();
const queue = [...html.matchAll(/(?:src|href)="\/assets\/([^"]+\.js)"/g)].map((m) => m[1]);
while (queue.length) {
  const file = queue.shift();
  if (seen.has(file)) continue;
  seen.add(file);
  const js = readFileSync(`dist/assets/${file}`, "utf8");
  if (/firestore\.googleapis\.com|FirestoreError|onSnapshot/.test(js)) problems.push(`${file} traz o Firestore`);
  for (const m of js.matchAll(/["'`]\.\/([\w.-]+\.js)["'`]/g)) queue.push(m[1]);
}

if (problems.length) {
  console.error("fichas.html:", problems);
  process.exit(1);
}
