import { useState } from "react";
import { applyTheme, NEXT_THEME, readTheme, THEME_NAME, type Theme } from "../lib/theme";

/** Botão do cabeçalho que troca o tema: automático → claro → escuro → automático. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const next = NEXT_THEME[theme];
  return (
    <button
      type="button"
      className="pg-theme-btn"
      aria-label={"Tema: " + THEME_NAME[theme] + ". Tocar muda pra " + THEME_NAME[next]}
      title={"Tema " + THEME_NAME[theme]}
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
    >
      <ThemeIcon theme={theme} />
    </button>
  );
}

function ThemeIcon({ theme }: { theme: Theme }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {theme === "light" && (
        <>
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
        </>
      )}
      {theme === "dark" && <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />}
      {theme === "auto" && (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}
