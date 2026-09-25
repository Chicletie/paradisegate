# paradisegate — instruções para o Claude

Site da marca e franquia **Paradise Gate** (`paradisegate.com.br`). A wiki (`/wiki`) está pronta;
o resto do site (home da marca, o jogo, notícias, sobre a obra, galeria, loja…) é construído aqui
pela colaboradora. Antes de mexer, leia `PRODUCT.md` (marca e público), `DESIGN.md` (sistema
visual, com uma parte só pra páginas fora da wiki), `CONTRIBUTING.md` (fluxo) e
`docs/dados-da-wiki.md` (o que o site lê do banco).

## Stack

Vite + React 19 + TypeScript + Tailwind v4 + react-router. `npm test` (Vitest), `npm run lint`
(oxlint), `npm run typecheck` (`tsc -b`), `npm run build` (gera `dist/`), `npm run prerender`
(páginas prontas da wiki em `dist/`, precisa de internet).

## Regras que não se quebram

1. **O repositório é público e fala só de Paradise Gate.** Nada que não seja o próprio Paradise
   Gate no código, nos textos, nos comentários ou nos commits. O único endereço de fora é o do
   redirecionamento de endereços antigos (`public/404.html` e `public/tree/index.html`), só a URL.
2. **Não inventar o mundo.** Lore, personagens, lugares, nomes, citações e números vêm só do que
   está publicado na wiki ou do que o autor passar. Arte da obra e o selo da marca: nunca gerar,
   desenhar ou "completar" (o círculo com estrela no cabeçalho é um lugar reservado).
3. **Função acima de estética.** Um redesenho nunca remove nem piora uma função que já existia.
4. **A wiki não muda sem o autor.** `src/pages/`, os componentes da página de entrada, `src/lib/`,
   `src/styles/wiki.css` e `scripts/` só mudam num PR revisado por ele. Os testes existem pra a
   wiki nunca mudar sem querer; se um teste da wiki quebrar, o problema é a mudança, não o teste.
5. **Páginas novas usam os tokens.** Cores, fontes e raios de `src/styles/tokens.css` (em
   `var(--pg-*)` ou pelas classes Tailwind do `@theme`), nunca hex solto; `PgHeader`/`PgFooter`
   sempre. Não estilize página nova mexendo em `src/styles/wiki.css`: ele existe pra wiki ficar
   como é. Detalhes em `DESIGN.md`, "O site além da wiki".
6. **Firebase só por `src/lib/api.ts`**, só leitura dos dados da wiki, e só estas coleções:
   `wikiIndex/lotus` (+ `shards/`), `wikiPublic`, `wikiRestrito`, `wikiProfiles`, `wikiUsernames`,
   `wikiSuggestions` (`docs/dados-da-wiki.md`). A configuração do Firebase no código é pública
   por natureza; quem protege são as regras do banco, que ficam com o autor. Nada de coleção
   nova. Loja, cadastro de fãs, newsletter e o que mais precisar de servidor vão num serviço
   pronto ou num projeto Firebase separado, da marca, combinado com o autor.
7. **Domínio, GitHub Pages e workflows** (`.github/`) só mudam com o autor. Nunca publique em
   outro endereço.
8. **Sem analytics nem scripts de terceiros** sem combinar; dependências mínimas.
9. Nunca digite senhas, tokens ou credenciais, nem crie contas; nunca commite segredo (`.env`).
10. **Como as mudanças entram no `main`:** as da colaboradora, por PR com capturas
    (computador e celular, claro e escuro) e resumo em português simples, aprovado pelo
    autor. As do próprio autor (feitas com o Claude dele) podem entrar direto no `main` depois
    do OK dele no chat, com os testes rodados antes. O CI roda build, tipos, lint e testes em
    todo PR, e o deploy sai sozinho a cada mudança no `main`.
11. Commits em português, dizendo o que mudou; mantenha a linha `Co-Authored-By` de atribuição.

## Detalhes técnicos que já custaram caro

- **Sem o preflight (reset) do Tailwind.** `src/index.css` importa só o tema e os utilitários:
  a wiki foi desenhada em cima dos padrões do navegador (lista numerada no índice, link
  sublinhado, `##` do markdown em negrito). Página nova que quiser um reset aplica num escopo
  próprio, nunca global.
- **Texto que a wiki monta de uma vez vai num pedaço só.** `{"#" + t.text}`, não `#{t.text}`:
  o React quebra o segundo em dois nós de texto e o navegador desenha a junção diferente.
- **Markdown da casa** (`docs/dados-da-wiki.md`): `||trecho||` lido como markdown por dentro,
  1º toque só revela; `[texto](wiki:<id>)` é link interno; campo curto com várias linhas vira
  uma por "•"; tarja lisa; nada de emoji marcando spoiler.
- **Sorteio do dia** (`src/lib/daily.ts`): igual pra todo visitante, reset às 00h de Brasília,
  quem foi publicado hoje só concorre amanhã. `daily.golden.json` é a referência; não ajuste à
  mão.
- **Navegar numa SPA não recarrega a página**: `ScrollToTop` volta ao topo (ou à âncora) a cada
  navegação, e a home remonta quando `?q=`/`?tipo=`/`?aleatoria=` muda. `usePgBody` é efeito de
  layout: as classes do `<body>` valem antes de qualquer medida.
- **Nó de SVG clicável (árvore genealógica) nunca dentro de `<Link>`**: use `onClick` +
  `useNavigate()` no próprio elemento SVG (ver `TreeNode` em `src/lib/relations.tsx`).
- **Login só acrescenta; nunca muda o que o visitante vê.** Favoritar, sugerir e o conteúdo
  restrito aparecem só pra quem entrou e não está "vendo como convidado". A versão confidencial
  de um campo troca o conteúdo no próprio lugar e volta ao público ao sair.
- **Restrito:** as regras do banco não filtram listas. `fetchRestrito` tenta a lista inteira e,
  se for recusada, pede só os itens com o e-mail de quem está logado.
- **Páginas prontas** (`scripts/prerender.mjs`, no deploy): um HTML por página da wiki, com
  título, resumo sem spoiler e retrato (ou `public/og-padrao.png`) pra prévia de link e pro
  Google, mais `sitemap.xml`. Página nova do site que precise de prévia própria ganha uma
  entrada ali. Se a leitura do índice falhar, o deploy sai só com o `404.html`.

## Estrutura

| Caminho | O que é |
|---|---|
| `src/pages/` | Páginas da wiki: home, entrada, temporada, linha do tempo, perfil, erro. |
| `src/components/` | Cabeçalho (com "Entrar"/menu da conta) e rodapé PG, peças da página de entrada, e o que depende de login (`EntryActions.tsx`). |
| `src/lib/` | `api.ts` (único acesso ao Firebase), índice (`wikiIndex.tsx`), conta do leitor (`account.tsx`), markdown, citações, relações, home, sorteio do dia, linha do tempo, perfil — lógica pura testável sem DOM onde dá. |
| `src/styles/tokens.css` | Tokens `--pg-*` + `@theme` do Tailwind, pras páginas novas. |
| `src/styles/wiki.css` | CSS da wiki (não mexer pra estilizar página nova). |
| `scripts/` | Páginas prontas e sitemap (`prerender.mjs`, `seo.mjs`). |
| `public/404.html` | Rotas de SPA no GitHub Pages: endereços antigos que mudaram de lugar são encaminhados; o resto reconstrói a URL bonita via `?p=`. |
| `public/sw.js` | Service worker de desligamento (apaga caches antigos e se desregistra). |
| `public/reset-senha.html` | "Esqueci minha senha", fora do bundle (link fixo nos e-mails); usa o mesmo CSS do build (`assets/wiki.css`). |
| `public/og-padrao.png`, `public/robots.txt` | Prévia de link padrão e aviso pros robôs de busca. |

## Como testar

`npm test`, `npm run typecheck`, `npm run lint` e `npm run build` limpos. Pra ver as páginas
prontas: `npm run build && npm run prerender && npm run preview`. Toda mudança visível: capturas
em 1280 e 390 de largura, claro e escuro, sem erros no console. Mudança que toca a wiki: compare
com `https://paradisegate.com.br/wiki` (mesmo texto, mesmas funções).
