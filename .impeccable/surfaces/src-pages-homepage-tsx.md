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
Movimento (decisões da usuária, 2026-09-25): primeira versão "rica, mas reativa" foi rejeitada
("não tá chique o suficiente, cadê as animações, detalhes"). Agora: movimento contínuo sutil
permitido (estrelas cintilando, poeira dourada, brilho na carta), parando fora da tela e em
`prefers-reduced-motion`. Página toda escura, sem os painéis brancos da wiki.
Pendências com o mestre: frase da marca (provisória), exceção de movimento no DESIGN.md, link da marca.

## Direction contract

THESIS: Entrar em Paradise Gate é atravessar o portal: o scroll leva a câmera através do selo, pra dentro do mundo. Recusa o topo estático de imagem, frase e cartões, e a cara de portal de wiki.

OWN-WORLD: Azul-noite de ponta a ponta com céu vivo (estrelas que cintilam, poeira dourada), o selo em ouro como porta, Castoro Titling em escala de cartaz, Castoro para nomes e leitura, cartas de tarô com fio dourado e brilho de folha que segue o ponteiro. Ouro só em fio, luz e estrela.

STORY: A pessoa chega diante do portal, rola, atravessa, e do outro lado encontra a carta do dia; depois o mundo em texto, os personagens em cartas grandes, as escolhas reais da ficha, a mesa e as novidades.

FIRST VIEWPORT: Céu vivo de tela cheia. No centro o selo dourado a ~45vh, com brilho no vão do arco; abaixo "PARADISE GATE" em Titling até 120px escrevendo letra a letra, a frase em Castoro itálico e dois convites. Embaixo, "Role pra atravessar" com um fio que desce.

FORM: "O verso da caixa" refeito como travessia, seed 8e0333fa (overdrive: "Atravessar o portal"). Assinatura: zoom pelo vão do selo com as estrelas em dobra (warp) e revelação da carta do dia do outro lado; galeria horizontal presa no scroll; cursor de estrela; títulos letra a letra.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
