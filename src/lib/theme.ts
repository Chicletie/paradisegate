// Tema claro/escuro escolhido à mão (2026-09-29). "auto" segue o aparelho, como sempre foi; "light"
// e "dark" ficam guardados neste navegador. O index.html aplica a escolha antes da página
// aparecer (sem piscar); o CSS escuro vale pros dois jeitos por causa de scripts/tema-css.mjs.

export type Theme = "auto" | "light" | "dark";
export const THEME_KEY = "pg.tema";

export function readTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : "auto";
  } catch {
    return "auto";
  }
}

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", t);
  try {
    if (t === "auto") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, t);
  } catch {
    /* sem armazenamento (aba anônima): vale só até fechar */
  }
}

export const NEXT_THEME: Record<Theme, Theme> = { auto: "light", light: "dark", dark: "auto" };
export const THEME_NAME: Record<Theme, string> = { auto: "automático (segue o aparelho)", light: "claro", dark: "escuro" };
