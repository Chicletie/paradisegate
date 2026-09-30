// Âncoras legíveis das seções e subtítulos de uma página: o link de "História" é
// `#historia`, e o de "Terceiro casamento e os três destinos" é
// `#terceiro-casamento-e-os-tres-destinos` (antes: `#sec-geral-lf2-hist-ria-h7-terceiro-…`).

/** Ids fixos da página de uma entrada: um título com o mesmo nome ganha "-2". */
export const PAGE_ANCHORS = ["posts", "aparicoes", "relacoes", "afinidades", "notas", "galeria", "citacoes", "temporadas", "elenco"];

/** "Terceiro casamento e os três destinos!" → "terceiro-casamento-e-os-tres-destinos"; sem
 * acento, minúsculo, até 60 letras (corta numa palavra inteira). */
export function anchorWords(s: string | undefined): string {
  let out = String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  if (out.length > 60) {
    out = out.slice(0, 61);
    const cut = out.lastIndexOf("-");
    out = cut > 20 ? out.slice(0, cut) : out.slice(0, 60);
  }
  return out;
}

/** Dá nomes únicos na ordem da página: o segundo "Passado" vira "passado-2". */
export function makeAnchorNamer(reserved: string[] = []): (text: string | undefined, fallback?: string) => string {
  const used = new Set(reserved);
  return (text, fallback = "secao") => {
    const base = anchorWords(text) || fallback;
    let id = base;
    for (let n = 2; used.has(id); n++) id = base + "-" + n;
    used.add(id);
    return id;
  };
}
