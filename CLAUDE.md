# paradisegate — instruções para o Claude

Site público do mundo **Paradise Gate**, incluindo a wiki (`/wiki`). Este é um repositório novo,
em construção a partir do roteiro `docs/fase4-site.md` do repositório `chicletie/arvore` (autor:
fonte de consulta, nunca faça push nele). Uma colaboradora vai construir o resto do site aqui;
o editor e o Ursprung (console do autor) ficam de fora deste repositório.

## Stack

Vite + React 19 + TypeScript + Tailwind v4 + react-router. `npm test` roda os testes puros
(Vitest); `npm run lint` roda o oxlint; `npm run typecheck` roda `tsc -b`; `npm run build` gera
`dist/`.

## Regras que não se quebram

1. **Só Paradise Gate.** Nada do modo Ursprung, dos tokens herbário, nem nomes/cores/ids de
   outros universos — nem a palavra "multiverso" — no código, nos textos ou nos comentários. O
   site lê só `wikiIndex/lotus` (e as coleções listadas no contrato de dados, ver abaixo).
2. **Função acima de estética.** Um redesenho nunca remove nem piora uma função que já existia.
3. **Paridade de visual e de função com a wiki de hoje** (`https://paradisegate.com.br/wiki`),
   provada por capturas antes/depois — não por achismo. `wiki-core.js` (no arvore) é a
   referência de comportamento; `DESIGN.md` (raiz do arvore) é o sistema visual.
4. **O CSS PG (`src/styles/wiki.css`) veio do arvore como está.** Não reescreva em Tailwind — a
   paridade visual depende disso. `src/styles/tokens.css` tem os mesmos tokens `--pg-*` (e o
   bloco `@theme` que os expõe como classes Tailwind) pras páginas novas, fora da wiki.
5. **URLs iguais às de hoje:** `/wiki`, `/wiki/<slug>`, `/wiki/_timeline` (`?ano=`),
   `/wiki/_perfil` (`#sugestoes`, `#favoritos`); na home, `?q=`, `?tipo=`, `?aleatoria=1`. `/`
   por enquanto redireciona pra `/wiki` — a home do site é trabalho da colaboradora.
6. **Firebase:** SDK modular, só a configuração pública (não é segredo; quem protege são as
   regras do Firestore). Nenhuma coleção além de `wikiIndex/lotus` (+ `shards/`), `wikiPublic`,
   `wikiRestrito`, `wikiProfiles`, `wikiSuggestions`.
7. **Nada de `CNAME` e nada de ligar o GitHub Pages.** A troca de domínio é feita com o autor,
   à parte. Nunca publique em `chicletie.github.io`.
8. **Sem analytics, sem scripts de terceiros, dependências mínimas.**
9. Nunca digite senhas, tokens ou credenciais, nem crie contas.
10. **Nada vai pro `main` sem o OK do autor.** Um PR por etapa, com capturas antes/depois e
    resumo em português simples; ele aprova a mesclagem.
11. Commits em português, dizendo o que mudou; mantenha a linha `Co-Authored-By` de atribuição.

## Estrutura

| Caminho | O que é |
|---|---|
| `src/pages/` | Páginas da wiki: home, entrada, temporada, linha do tempo, perfil, erro. |
| `src/components/` | Cabeçalho e rodapé PG, compartilhados. |
| `src/lib/` | Lógica pura (Firebase, sorteio do dia, etc.) — testável sem DOM. |
| `src/styles/tokens.css` | Tokens `--pg-*` + `@theme` do Tailwind, pras páginas novas. |
| `src/styles/wiki.css` | CSS da wiki, herdado do arvore como está. |
| `public/404.html` | Rotas de SPA no GitHub Pages: `/ursprung`\*/`/tree`\* vão pro subdomínio do console; o resto reconstrói a URL bonita via `?p=`. |
| `public/tree/index.html` | Só a guarda do endereço antigo do editor (encaminha pro console; `?limpar` apaga o que sobrou daqui). Não é o editor. |
| `public/sw.js` | Service worker de desligamento — apaga caches antigos e se desregistra. |
| `public/reset-senha.html` | "Esqueci minha senha", fora do bundle (link fixo nos e-mails). |

## Ramos e PRs

Sem `docs/` neste repositório ainda — o roteiro completo mora em `docs/fase4-site.md` do
arvore. Etapas (um PR cada, com capturas antes/depois): 1) esqueleto (este PR); 2) entrada,
temporada e erro; 3) home com destaques do dia, busca e filtros; 4) linha do tempo, perfil,
login, sugestões, restrito. Se uma sessão não terminar uma etapa, para num PR completo e
descreve no fim o que falta.
