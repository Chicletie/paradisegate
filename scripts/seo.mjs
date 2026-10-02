// Peças puras das páginas prontas (scripts/prerender.mjs): converter o JSON da API REST do
// Firestore, limpar texto pra resumo (sem spoiler) e montar as tags de <head> e o sitemap.
// Sem dependências, testado em scripts/seo.test.mjs.

export const SITE = "https://paradisegate.com.br";
export const SITE_NAME = "Paradise Gate";
// Nome das páginas da wiki no título (aba do navegador e resultado do Google).
export const WIKI_NAME = "Paradise Gate Wiki";

/** Valor tipado da API REST do Firestore ({stringValue: "x"}, {mapValue: …}…) → JS comum. */
export function fromFirestore(v) {
  if (v == null || typeof v !== "object") return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromFirestore);
  if ("mapValue" in v) return fieldsToObject(v.mapValue.fields);
  return null;
}
export function fieldsToObject(fields) {
  const out = {};
  for (const k of Object.keys(fields || {})) out[k] = fromFirestore(fields[k]);
  return out;
}

/** Junta o índice base com as continuações (docs/dados-da-wiki.md): vale o updatedAt mais novo. */
export function mergeEntries(parts) {
  const out = {};
  for (const entries of parts) {
    for (const id of Object.keys(entries || {})) {
      const e = entries[id];
      if (!out[id] || String((e && e.updatedAt) || "") > String(out[id].updatedAt || "")) out[id] = e;
    }
  }
  return out;
}

/** Texto do markdown da casa pra resumo: spoiler (||…||) sai inteiro, links viram só o texto. */
export function cleanText(s) {
  return String(s || "")
    .replace(/\|\|(?:\[\[[^\][]+\]\]|[^|])+\|\|/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[\[([^\][|]+)\|([^\][]+)\]\]/g, "$2")
    .replace(/\[\[([^\][]+)\]\]/g, "$1")
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1")
    .replace(/(\*\*|__|~~|`)/g, "")
    .replace(/(^|[\s(])[*_]([^*_\n]+)[*_](?=[\s).,;:!?]|$)/g, "$1$2")
    .replace(/\[TBA\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Corta num limite sem partir palavra. */
export function clip(s, max = 160) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.–—-]+$/, "") + "…";
}

export const FICHA_INCOMPLETA = "Ficha incompleta. Os arquivistas da Academia Whitmore estão trabalhando para reunir essas informações.";

export function describeEntry(e) {
  const text = clip(cleanText(e.excerpt));
  if (text) return text;
  // Página sem resumo: texto coringa na voz da Academia Whitmore, escrito pelo autor.
  return FICHA_INCOMPLETA;
}

// Escritos com página própria (o mesmo escrito vem em cada página ligada: conta uma vez).
export function writingsOf(entries) {
  const seen = new Set();
  const out = [];
  for (const id of Object.keys(entries).sort()) {
    for (const w of (entries[id] && entries[id].escritos) || []) {
      if (!w || !w.id || !w.page || seen.has(w.id)) continue;
      if (w.vis !== "publico" && w.vis !== "spoiler") continue;
      seen.add(w.id);
      out.push(w);
    }
  }
  return out;
}

/** Prévia de um escrito: o trecho (só o público; spoiler nunca aparece na prévia). */
export function describeWriting(w) {
  const text = w.vis === "publico" ? clip(cleanText(w.excerpt)) : "";
  return text || "Um escrito de Paradise Gate.";
}

// Membros do acervo com perfil público (/@nome): os citados nas páginas (`membros`) e os que
// estão no campo Intérprete (`interpretes`). Só nomes no formato do @username.
export const MEMBER_RE = /^[a-z0-9][a-z0-9_]{2,19}$/;
export function membersOf(entries) {
  const out = new Set();
  for (const e of Object.values(entries)) {
    for (const m of (e && e.membros) || []) if (typeof m === "string" && MEMBER_RE.test(m)) out.add(m);
    for (const it of (e && e.interpretes) || []) if (it && typeof it.membro === "string" && MEMBER_RE.test(it.membro)) out.add(it.membro);
  }
  return [...out].sort();
}

/** Prévia de link do perfil público: apelido e @, a bio (ou uma frase padrão) e a foto, se for um endereço de imagem. */
export function describeMember(name, card) {
  const nick = card && typeof card.nickname === "string" ? card.nickname.trim() : "";
  const title = (nick ? nick + " (@" + name + ")" : "@" + name) + " · " + SITE_NAME;
  const bio = card && typeof card.bio === "string" ? clip(cleanText(card.bio)) : "";
  const photo = card && typeof card.photo === "string" && /^https:\/\//.test(card.photo) ? card.photo : null;
  return { title, description: bio || "Perfil de @" + name + " no acervo de " + SITE_NAME + ".", image: photo };
}

/**
 * Foto do perfil guardada embutida no cartão (data:image/…;base64): vira um arquivo pra prévia de
 * link, que só aceita endereço. O nome leva um pedaço do conteúdo, pra foto nova ter endereço novo
 * (WhatsApp e Discord guardam a prévia pelo endereço). Sem foto, formato estranho ou mais de 5 MB: null.
 */
export function memberPhotoFile(name, photo) {
  if (typeof photo !== "string") return null;
  const m = /^data:image\/(jpeg|jpg|png|webp|gif);base64,([A-Za-z0-9+/=\s]+)$/.exec(photo);
  if (!m) return null;
  const bytes = Buffer.from(m[2].replace(/\s/g, ""), "base64");
  if (!bytes.length || bytes.length > 5 * 1024 * 1024) return null;
  let h = 2166136261;
  for (const b of bytes) h = Math.imul(h ^ b, 16777619) >>> 0;
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  return { rel: `perfil/${name}-${h.toString(36)}.${ext}`, bytes };
}

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ESC[c]); }

/** Tags de <head> de uma página: descrição, canônico e a prévia de link (Open Graph/Twitter). */
// squareImage: foto pequena e quadrada (a do perfil) vai como miniatura, sem esticar em faixa larga.
export function headTags({ title, description, path, image, noindex, squareImage, type = "website", jsonLd }) {
  const url = SITE + path;
  const t = [
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta name="twitter:card" content="${image && !squareImage ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
  ];
  if (image) t.push(`<meta property="og:image" content="${esc(image)}" />`, `<meta name="twitter:image" content="${esc(image)}" />`);
  // Página que vai pro Google: deixa ele mostrar a imagem grande no resultado.
  t.push(noindex ? `<meta name="robots" content="noindex" />` : `<meta name="robots" content="max-image-preview:large" />`);
  // Dados estruturados (schema.org): título e retrato do jeito que o Google mais respeita.
  if (jsonLd) t.push(`<script type="application/ld+json">${jsonForScript(jsonLd)}</script>`);
  return t.join("\n");
}

// JSON pra dentro de <script>: troca "<" pelo escape de unicode do JSON, pra nenhum texto da
// wiki fechar o </script> antes da hora (o JSON continua o mesmo pra quem lê).
const LT_ESCAPE = "\\" + "u003c";
export function jsonForScript(data) { return JSON.stringify(data).split("<").join(LT_ESCAPE); }

/** Dados estruturados de uma página da wiki (schema.org Article): título, resumo, retrato e a wiki. */
export function articleJsonLd({ name, description, path, image, dateModified }) {
  const d = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: name,
    description,
    url: SITE + path,
    mainEntityOfPage: SITE + path,
    isPartOf: { "@type": "WebSite", name: WIKI_NAME, url: SITE + "/wiki" },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE },
  };
  if (image) d.image = [image];
  if (dateModified) d.dateModified = dateModified;
  return d;
}

/** O index.html do build com outro <title> e as tags acima antes do </head>. */
export function injectHead(html, title, tags) {
  if (!/<title>[\s\S]*?<\/title>/.test(html) || !html.includes("</head>")) throw new Error("index.html sem <title> ou </head>");
  return html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`).replace("</head>", tags + "\n</head>");
}

/** Só ids que viram nome de arquivo seguro (os slugs da wiki são assim). */
export function safeSlug(id) { return /^[a-z0-9][a-z0-9-]*$/i.test(id) ? id : null; }

export function sitemap(urls) {
  const rows = urls.map((u) => `  <url><loc>${esc(SITE + u.path)}</loc>${u.lastmod ? `<lastmod>${esc(u.lastmod)}</lastmod>` : ""}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
}
