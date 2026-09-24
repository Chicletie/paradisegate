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
4. **O CSS PG (`src/styles/wiki.css`) veio do arvore, só com as regras usadas no modo PG** (sem
   a base clara/escura genérica que só o Ursprung usava). Não reescreva em Tailwind — a
   paridade visual depende disso. `src/styles/tokens.css` tem os mesmos tokens `--pg-*` (e o
   bloco `@theme` que os expõe como classes Tailwind) pras páginas novas, fora da wiki.
   `public/reset-senha.html` (fora do bundle) carrega esse mesmo CSS pelo nome fixo que
   `vite.config.ts` dá ao build (`assets/wiki.css`) — uma cópia só, nunca duplique o arquivo.
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
12. **Sem o preflight (reset) do Tailwind.** `src/index.css` importa só o tema e os
    utilitários: a wiki foi desenhada em cima dos padrões do navegador (lista numerada no
    índice, link sublinhado, `##` do markdown em negrito) e o reset apagava isso. Página nova
    que quiser um reset aplica num escopo próprio, nunca global.
13. **Texto que o original monta de uma vez vai num pedaço só.** `{"#" + t.text}`, não
    `#{t.text}`: o React quebra o segundo em dois nós de texto e o navegador desenha a junção
    diferente (aparece na comparação por pixel). Vale pra tags, rubrica "(rindo) ", "— " da
    autoria, aspas da citação.
14. **Markdown da casa** (`docs/formato-wiki.md` no arvore, "Texto dentro da página"):
    `||trecho||` lido como markdown por dentro, 1º toque só revela; `[texto](wiki:<id>)` é
    link interno (`wl-live`); campo curto com várias linhas vira uma por "•"; tarja lisa; e
    nada de 🙈 na wiki (nem no rótulo, nem no botão).
15. **Sorteio do dia (`src/lib/daily.ts`) é o mesmo do `wiki-core.js`, bit a bit.** O teste
    `daily.test.ts` compara com respostas geradas rodando as funções originais
    (`daily.golden.json`); se o arvore mudar o sorteio, gere de novo em vez de ajustar à mão.
    Reset às 00h GMT-3 pra todo mundo; quem foi publicado hoje não concorre até o próximo dia.
16. **Navegar numa SPA não recarrega a página**: `ScrollToTop` volta ao topo (ou à âncora, ex.
    `#posts`) a cada navegação nova, e a home remonta quando `?q=`/`?tipo=`/`?aleatoria=` muda
    — é o que um link faz no site de hoje. `usePgBody` é efeito de layout: as classes do
    `<body>` valem antes de qualquer medida (a home rola até a lista com `?tipo=`).
17. **Nó de SVG clicável (árvore genealógica) nunca dentro de `<Link>`.** Um `<a>` do
    react-router (mesmo com `display:contents`) dentro de `<svg>` não pinta os filhos em todo
    navegador — use `onClick` + `useNavigate()` no próprio elemento SVG (ver `TreeNode` em
    `src/lib/relations.tsx`), igual ao clique direto que `wiki-core.js` já usa ali.
18. **Firebase só por `src/lib/api.ts`.** Nenhuma tela importa `firebase/*` direto: toda leitura
    e gravação (índice, página, login, perfil, sugestões, restrito) é uma função de lá. É a
    lista fechada de coleções da regra 6 num arquivo só, e é o que permite comparar com a wiki
    de hoje sem rede (ver abaixo).
19. **Login só acrescenta; nunca muda o que o visitante vê.** Favoritar, sugerir e o conteúdo
    restrito aparecem só pra quem entrou e não está "vendo como convidado" (`wb_guest_mode` em
    `sessionStorage`, mesma chave de hoje; trocar recarrega a página, como hoje). A versão
    confidencial de um campo troca o conteúdo no próprio lugar (`SwapCell`/`SwapBody` em
    `EntryActions.tsx`) e volta ao público ao sair.

## Estrutura

| Caminho | O que é |
|---|---|
| `src/pages/` | Páginas da wiki: home, entrada, temporada, linha do tempo, perfil, erro. |
| `src/components/` | Cabeçalho (com "Entrar"/menu da conta, `AccountMenu.tsx`) e rodapé PG, peças da entrada, e o que depende de login numa página (`EntryActions.tsx`: favoritar, sugerir, restrito). |
| `src/lib/` | Acesso ao Firebase (`api.ts`, o único que importa `firebase.ts`), índice da wiki com suporte a `shards/` (`wikiIndex.tsx`), conta do leitor e modal "Entrar" (`account.tsx`), markdown/spoilers (`markdown.tsx`), citações (`quotes.tsx`), relações/família/linha do tempo da entrada (`relations.tsx`), home (`home.ts`, `daily.ts`), linha do tempo geral (`timeline.ts`), perfil (`profile.ts`) — lógica pura testável sem DOM onde dá. |
| `src/styles/tokens.css` | Tokens `--pg-*` + `@theme` do Tailwind, pras páginas novas. |
| `src/styles/wiki.css` | CSS da wiki, herdado do arvore como está. |
| `public/404.html` | Rotas de SPA no GitHub Pages: `/ursprung`\*/`/tree`\* vão pro subdomínio do console; o resto reconstrói a URL bonita via `?p=`. |
| `public/tree/index.html` | Só a guarda do endereço antigo do editor (encaminha pro console; `?limpar` apaga o que sobrou daqui). Não é o editor. |
| `public/sw.js` | Service worker de desligamento — apaga caches antigos e se desregistra. |
| `public/reset-senha.html` | "Esqueci minha senha", fora do bundle (link fixo nos e-mails). |

## Como provar paridade sem rede

O Firestore e `paradisegate.com.br` podem estar bloqueados na sessão; o autor compara com os
dados reais a cada PR. Pra capturas antes/depois com os **mesmos dados**: o `wiki-core.js` do
arvore expõe `window.wikiCoreRenderStatic(data)` e, sem `firebase` na página, as partes de
login/restrito saem cedo sozinhas. Monte uma página com `wiki-style.css` + `wiki-core.js` do
arvore + um JSON de exemplo (servida num caminho `/wiki.html`, pra cair no modo Paradise Gate;
ponha `pg-theme` no `<body>`), e uma rota temporária no app lendo o mesmo JSON. Compare o
`innerText` do `.card` e a diferença de pixels (canvas no próprio Chromium) em 1280/390,
claro/escuro, e depois de cada clique (abas, spoilers). Remova a rota temporária antes do
commit. Pra home (e o que mais usar o índice): `window.wikiCoreBoot()` com um `window.firebase`
de mentira cuja `firestore().collection("wikiIndex").doc("lotus").get()` devolve o índice de
exemplo (sem `firebase.auth`, login sai cedo), e no app o `fetchWikiIndex` devolvendo o mesmo
JSON só em `import.meta.env.DEV`, temporariamente. Compare também `document.title` e `scrollY`.
Com login (etapa 4 em diante), sem tocar no repositório: um armazém de mentira com índice,
páginas, perfil, sugestões e restrito, servido às duas versões — pro `wiki-core.js`, um
`window.firebase` compat de mentira em cima dele (auth + firestore + `FieldValue`); pro app, um
`vite --config` fora do repositório com um plugin que troca `src/lib/api.ts` por uma versão de
mentira com as mesmas funções. "Logado" = uma chave no `localStorage` lida pelo armazém.

## Ramos e PRs

Sem `docs/` neste repositório ainda — o roteiro completo mora em `docs/fase4-site.md` do
arvore. Etapas (um PR cada, com capturas antes/depois): 1) esqueleto ✔; 2) entrada, temporada e
erro ✔ (login, favoritar, sugerir e conteúdo restrito de `wikiRestrito` ficaram pra etapa 4 de
propósito — a entrada já busca e mostra tudo que não depende de login); 3) home com destaques
do dia, busca e filtros ✔; 4) linha do tempo, perfil, login, sugestões, restrito ✔. Com isso a
wiki de hoje está toda portada; o resto do site é da colaboradora. Se uma sessão
não terminar uma etapa, para num PR completo e descreve no fim o que falta.
