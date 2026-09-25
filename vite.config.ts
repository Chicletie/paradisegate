import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // optimize: false — o Tailwind minificava mirando Safari 16.4 e reescrevia max-width como
  // (width<=…), que iPhone com iOS antigo ignora (ficava o layout de computador). A minificação
  // passa pro Vite, com cssTarget mirando navegadores mais velhos (scripts/check-css.mjs trava no build).
  plugins: [react(), tailwindcss({ optimize: false })],
  build: {
    cssTarget: ["safari14", "ios14", "chrome90", "firefox90", "edge90"],
    rollupOptions: {
      // Duas páginas: o site (index.html) e a ficha (fichas.html, com o sync de src/ficha-sync/).
      input: { main: "index.html", fichas: "fichas.html" },
      output: {
        // Nome fixo (sem hash) só pro CSS: public/reset-senha.html, fora do bundle, carrega
        // este mesmo arquivo por um caminho fixo — uma cópia só do CSS pra tudo (ver CLAUDE.md).
        assetFileNames: (asset) =>
          asset.names?.some((n) => n.endsWith(".css"))
            ? "assets/wiki.css"
            : "assets/[name]-[hash][extname]",
      },
    },
  },
});
