// Páginas prontas: roda depois do `vite build` (no deploy). Lê o índice público da wiki pela
// API REST do Firestore e grava em dist/ um HTML por página, com título, resumo e retrato certos
// (prévia de link no WhatsApp/Discord e busca do Google) e resposta 200 em vez do 404.html.
// O app React continua montando a página normalmente por cima. Se a leitura falhar, não quebra
// o deploy: o site sai como antes (tudo pelo 404.html).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import {
  fieldsToObject, mergeEntries, describeEntry, describeWriting, headTags, injectHead, safeSlug, sitemap, writingsOf, SITE, SITE_NAME,
} from "./seo.mjs";

const DIST = path.resolve(process.argv[2] || "dist");
const API = "https://firestore.googleapis.com/v1/projects/rotina-555dd/databases/(default)/documents";
// Imagem da prévia de link pra home e pra página sem retrato (public/og-padrao.png, 1200×630).
const DEFAULT_IMAGE = SITE + "/og-padrao.png";
// Texto da prévia de link da home, escrito pelo autor (voz da Academia Whitmore).
const BRAND_DESC = "Fantasia urbana sombria e RPG de mesa. A magia existe, escondida no mundo de hoje: conheça o mundo na wiki e as escolhas da ficha.";
const HOME_DESC = "É com satisfação que a Academia Whitmore confirma sua admissão para a leitura de seu arquivo mais completo. Bem-vindo à Paradise Gate Wiki!";

async function getDoc(p) {
  const r = await fetch(`${API}/${p}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`);
  return fieldsToObject((await r.json()).fields);
}

async function loadEntries() {
  const base = await getDoc("wikiIndex/lotus");
  if (!base) throw new Error("índice vazio");
  const parts = [base.entries || {}];
  const n = base.shardCount | 0;
  const shards = await Promise.all(Array.from({ length: n }, (_, i) => getDoc(`wikiIndex/lotus/shards/${i + 1}`)));
  shards.forEach((s) => parts.push((s && s.entries) || {}));
  return mergeEntries(parts);
}

function write(rel, html) {
  const file = path.join(DIST, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, html);
}

const template = readFileSync(path.join(DIST, "index.html"), "utf8");
let entries;
try {
  entries = await loadEntries();
} catch (err) {
  console.warn(`Páginas prontas puladas (${err.message}); o site sai só com o 404.html.`);
  process.exit(0);
}

const page = (title, tags) => injectHead(template, title, tags);
const homeTitle = `${SITE_NAME} · Wiki`;
const home = page(homeTitle, headTags({ title: homeTitle, description: HOME_DESC, path: "/wiki", image: DEFAULT_IMAGE }));
// /wiki pode ser servido como wiki.html ou wiki/index.html, conforme o GitHub Pages resolver a
// pasta wiki/ ao lado; os dois existem e são iguais.
write("wiki.html", home);
write("wiki/index.html", home);
write("index.html", page(SITE_NAME, headTags({ title: SITE_NAME, description: BRAND_DESC, path: "/", image: DEFAULT_IMAGE })));
const tl = `Linha do tempo · ${SITE_NAME}`;
write("wiki/_timeline.html", page(tl, headTags({ title: tl, description: "Os acontecimentos de Paradise Gate, ano a ano.", path: "/wiki/_timeline", image: DEFAULT_IMAGE })));
const pf = `Seu perfil · ${SITE_NAME}`;
write("wiki/_perfil.html", page(pf, headTags({ title: pf, description: HOME_DESC, path: "/wiki/_perfil", noindex: true })));

const bs = `Busca · ${SITE_NAME}`;
write("wiki/_busca.html", page(bs, headTags({ title: bs, description: HOME_DESC, path: "/wiki/_busca", noindex: true })));

const urls = [{ path: "/" }, { path: "/wiki" }, { path: "/wiki/_timeline" }];
let count = 0;
for (const id of Object.keys(entries).sort()) {
  const e = entries[id] || {};
  const slug = safeSlug(id);
  if (!slug || !e.title) continue;
  const title = `${e.title} · ${SITE_NAME}`;
  write(`wiki/${slug}.html`, page(title, headTags({
    title, description: describeEntry(e), path: `/wiki/${slug}`, image: e.cover || DEFAULT_IMAGE, type: "article",
  })));
  urls.push({ path: `/wiki/${slug}`, lastmod: /^\d{4}-\d{2}-\d{2}$/.test(e.updatedAt || "") ? e.updatedAt : null });
  count++;
}
// Escritos: a lista geral (pasta, porque cada escrito mora dentro dela) e uma página por escrito
// com página própria. Spoiler entra sem trecho na prévia.
const writings = writingsOf(entries);
if (writings.length) {
  const es = `Escritos · ${SITE_NAME}`;
  write("wiki/_escritos/index.html", page(es, headTags({
    title: es, description: "Contos, crônicas, narrações de sessão, causos de mesa, cartas e bastidores de Paradise Gate.", path: "/wiki/_escritos", image: DEFAULT_IMAGE,
  })));
  urls.push({ path: "/wiki/_escritos" });
}
let wcount = 0;
for (const w of writings) {
  const slug = safeSlug(w.id);
  if (!slug || !w.title) continue;
  const title = `${w.title} · ${SITE_NAME}`;
  write(`wiki/_escritos/${slug}.html`, page(title, headTags({
    title, description: describeWriting(w), path: `/wiki/_escritos/${slug}`, image: DEFAULT_IMAGE, type: "article",
  })));
  urls.push({ path: `/wiki/_escritos/${slug}`, lastmod: /^\d{4}-\d{2}-\d{2}$/.test(w.date || "") ? w.date : null });
  wcount++;
}
write("sitemap.xml", sitemap(urls));
console.log(`Páginas prontas: ${count} páginas da wiki, ${wcount} escritos + home, linha do tempo, perfil e sitemap.xml.`);
