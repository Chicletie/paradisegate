# paradisegate

Site público do mundo **Paradise Gate** (`paradisegate.com.br`), com a wiki (`/wiki`) em React.
Em construção — ver `CLAUDE.md` pras regras e `docs/` (a caminho) pro roteiro completo.

## Rodando local

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # produção, em dist/
npm run typecheck  # tsc -b
npm run lint       # oxlint
npm test           # vitest
```

## Estrutura

- `src/pages/` — as páginas da wiki (`/wiki`, `/wiki/<slug>`, `/wiki/_timeline`, `/wiki/_perfil`).
  `EntryPage` busca `wikiPublic/{slug}` e mostra `EntryView` (entrada) ou `SeasonView`
  (temporada), conforme o campo `kind` do documento.
- `src/components/` — cabeçalho e rodapé PG e as peças da página de entrada (infobox, abas,
  galeria, citações, relações, taxonomia), compartilhados entre páginas.
- `src/lib/` — lógica pura e Firebase: `wikiIndex.tsx` lê `wikiIndex/lotus` (+ `shards/`, ver
  docs/formato-wiki.md) e compartilha o índice via contexto; `markdown.tsx`, `quotes.tsx` e
  `relations.tsx` portam o comportamento de `wiki-core.js` (arvore) pro React.
- `src/styles/tokens.css` — tokens de design (`--pg-*`) para as páginas novas do site, e o
  bloco `@theme` que os expõe como classes utilitárias do Tailwind.
- `src/styles/wiki.css` — o CSS da wiki Paradise Gate, herdado do repositório `chicletie/arvore`
  como está (paridade visual).
- `public/` — arquivos estáticos servidos como estão: `404.html` (rotas de SPA no GitHub
  Pages), `tree/index.html` (guarda do endereço antigo do editor), `sw.js` (desliga o service
  worker antigo), `reset-senha.html`, `selo-whitmore.png`, `icon.svg`.

## Deploy

`.github/workflows/deploy.yml` publica `dist/` no GitHub Pages, só por gatilho manual
(`workflow_dispatch`) por enquanto — a virada de domínio é um passo à parte, combinado com o
autor. `.github/workflows/ci.yml` roda build, checagem de tipos, lint e testes em todo PR.
