import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
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
