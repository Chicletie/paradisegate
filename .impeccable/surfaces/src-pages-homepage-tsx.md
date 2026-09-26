---
version: 1
slug: "src-pages-homepage-tsx"
primary_target: "src/pages/HomePage.tsx"
related_targets: ["src/App.tsx"]
---

# Home da marca (`/`)

Modo: Persuade. Visitante: quem nunca ouviu falar de Paradise Gate, fã que veio da wiki, jogador da mesa.
Ação: entrar na wiki (principal); saber do jogo; jogador entrar/abrir fichas; ver novidades.
Prova: só dado público (índice da wiki, sorteio do dia, listas reais da ficha). Nada de `wikiPublic`,
`wikiRestrito` ou texto de spoiler. Arte: só as capas já publicadas na wiki.
Movimento (decisão da usuária, 2026-09-25): rico, mas reativo. Tudo responde a scroll, ponteiro ou
toque e para quando a pessoa para; nada em loop. Tudo desligado em `prefers-reduced-motion`.
Pendências com o mestre: frase da marca (provisória), link da marca no cabeçalho continuar em `/wiki`.

## Direction contract

THESIS: A home é o verso da caixa do jogo: o mundo, o jogo, a mesa e as novidades, nessa ordem, cada parte provada com conteúdo real. Recusa o topo genérico com imagem, frase e três cartões iguais.

OWN-WORLD: O sistema da wiki inteiro: azul-noite com poeira de estrelas só nas faixas escuras, papel azulado com painéis brancos de fio fino, ouro só em fio, foco e estrela, Castoro Titling / Castoro / Hanken, estrela de quatro pontas como marcador, a carta de tarô como único objeto elevado.

STORY: Em segundos a pessoa entende que Paradise Gate é um mundo de fantasia urbana sombria e um RPG de mesa, vê personagens reais, as escolhas reais da ficha (raça, classe, impulso, arcana), e sabe onde clicar: a wiki, a ficha, entrar na mesa.

FIRST VIEWPORT: Céu azul-noite de ponta a ponta sob o PgHeader. À esquerda, "Paradise Gate" em Castoro Titling grande, a frase da marca em Castoro, dois botões (Conhecer o mundo, primário; Sou da mesa). À direita, a carta do dia a 300px virando ao carregar e inclinando com o ponteiro. Estrelas em três camadas com paralaxe; o ponteiro deixa um rastro que se apaga.

FORM: "O verso da caixa", posição 7 da minha lista ordenada, seed 8e0333fa. Movimento: rastro de estrelas do ponteiro (doação do mar bioluminescente), carta com inclinação, cartas de impulso que viram no scroll, revelações por seção uma vez.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
