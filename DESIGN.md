---
name: Paradise Gate
description: Site e wiki do mundo Paradise Gate — portal limpo, azul-noite, com estrelas e tarô como detalhe.
colors:
  night: "#0b1a3f"
  band: "#132c6e"
  card-back: "#0d1f4f"
  page: "#f2f4f9"
  panel: "#ffffff"
  line: "#dce2ee"
  line-strong: "#b7c2d9"
  ink: "#121a2c"
  muted: "#4d5870"
  link: "#1f4fc4"
  link-hover: "#163b96"
  link-wash: "rgba(31,79,196,0.08)"
  gold: "#c9a45c"
  gold-soft: "rgba(201,164,92,0.55)"
  on-dark: "#eef2fb"
  on-dark-muted: "#b9c8ec"
  tarot-cream: "#f3e6c4"
  constellation: "#a9bff0"
  night-dark: "#070f26"
  band-dark: "#0f2358"
  card-back-dark: "#0b1a44"
  page-dark: "#0a1226"
  panel-dark: "#0f1a33"
  line-dark: "#1f2d52"
  line-strong-dark: "#33487c"
  ink-dark: "#e4e9f4"
  muted-dark: "#a3aec6"
  link-dark: "#93b2f5"
  link-hover-dark: "#bccefa"
typography:
  display:
    fontFamily: "Castoro Titling, Castoro, Georgia, serif"
    fontSize: "clamp(28px, 3.2vw, 40px)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "0.04em"
  quote:
    fontFamily: "Castoro, Georgia, serif"
    fontSize: "clamp(24px, 2.9vw, 38px)"
    fontWeight: 400
    lineHeight: 1.3
  numeral:
    fontFamily: "Castoro Titling, Castoro, Georgia, serif"
    fontSize: "42px"
    fontWeight: 400
    lineHeight: 1
  wordmark:
    fontFamily: "Castoro Titling, Castoro, Georgia, serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.07em"
  headline:
    fontFamily: "Castoro Titling, Castoro, Georgia, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.07em"
  title:
    fontFamily: "Castoro, Georgia, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.25
  body:
    fontFamily: "Hanken Grotesk, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14.5px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Hanken Grotesk, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "0"
  hero-title:
    fontFamily: "Castoro Titling, Castoro, Georgia, serif"
    fontSize: "clamp(42px, 5.6vw, 80px)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "0.05em"
  hero-lede:
    fontFamily: "Castoro, Georgia, serif"
    fontSize: "clamp(22px, 2.6vw, 32px)"
    fontWeight: 400
    lineHeight: 1.28
  game-title:
    fontFamily: "Castoro Titling, Castoro, Georgia, serif"
    fontSize: "clamp(30px, 4.2vw, 52px)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.04em"
  reading:
    fontFamily: "Castoro, Georgia, serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  thumb: "8px"
  button: "10px"
  card: "12px"
  panel: "14px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  section: "44px"
components:
  search-field:
    backgroundColor: "rgba(255,255,255,0.08)"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "12px 18px 12px 44px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.link}"
    rounded: "{rounded.button}"
    padding: "12px 16px"
  button-outline-hover:
    backgroundColor: "{colors.link-wash}"
    textColor: "{colors.link}"
  button-on-dark:
    backgroundColor: "transparent"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "11px 16px"
  filter-chip:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "9px 15px"
  filter-chip-active:
    backgroundColor: "{colors.link}"
    textColor: "{colors.panel}"
    rounded: "{rounded.pill}"
  tag-chip:
    backgroundColor: "{colors.link-wash}"
    textColor: "{colors.link}"
    rounded: "{rounded.pill}"
    padding: "7px 12px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "18px 20px 20px"
  cover-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.card}"
  day-tile:
    backgroundColor: "rgba(255,255,255,0.07)"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.card}"
    padding: "16px 18px"
  tarot-card:
    backgroundColor: "{colors.card-back}"
    textColor: "{colors.tarot-cream}"
    rounded: "{rounded.panel}"
    width: "260px"
  tarot-card-home:
    backgroundColor: "{colors.card-back}"
    textColor: "{colors.tarot-cream}"
    rounded: "{rounded.panel}"
    width: "300px"
  button-hero-primary:
    backgroundColor: "#ffffff"
    textColor: "{colors.night}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
    height: "48px"
  button-hero-primary-hover:
    backgroundColor: "{colors.on-dark}"
    textColor: "{colors.night}"
  button-hero-secondary:
    backgroundColor: "rgba(201,164,92,0.10)"
    textColor: "{colors.tarot-cream}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
    height: "48px"
  button-hero-secondary-hover:
    backgroundColor: "rgba(201,164,92,0.20)"
    textColor: "#ffffff"
  drive-card:
    backgroundColor: "{colors.card-back}"
    textColor: "#ffffff"
    rounded: "{rounded.card}"
    padding: "18px 18px 16px"
    width: "200px"
    height: "158px"
  arcana-card:
    backgroundColor: "{colors.card-back}"
    textColor: "{colors.gold}"
    rounded: "{rounded.thumb}"
    width: "78px"
    height: "128px"
---

# Design System: Paradise Gate

<!-- Sistema visual do site inteiro. Nasceu na wiki (a primeira parte do site) e vale pra toda página nova. Os valores vivem como tokens --pg-* em src/styles/tokens.css (com classes Tailwind geradas pelo bloco @theme) e, pra wiki, também em body.pg-site dentro de src/styles/wiki.css. A home da marca (/) tem folha própria, src/styles/home.css, só com tokens. Tema escuro por prefers-color-scheme. -->

## Overview

**Creative North Star: "O Portal sob o Céu Noturno"**

Paradise Gate é uma wiki de fandom de verdade — cabeçalho com busca, destaques do dia, coluna lateral, listas densas — e a identidade do mundo entra só pelos detalhes: céu azul-noite com poeira de estrelas (estática na wiki; na home da marca, um céu que responde a quem visita), a estrela de quatro pontas como marcador, a carta de tarô do dia com numeral romano e douração fina. A estrutura é de portal clássico; a assinatura é pequena, recorrente e sempre a mesma.

O azul domina. Duas faixas escuras no topo (noite e azul-profundo) carregam o céu; o corpo é claro e azulado, com painéis brancos de borda fina e sombra difusa. O ouro velho é luz, não superfície: aparece em fios, no foco e em estrelas pequenas. A densidade é de wiki: muito conteúdo visível, lista compacta com miniatura, sem blocos decorativos vazios.

O sistema recusa o cartão creme genérico empilhado e o "site de fantasia" performático (carro alegórico): nada de texturas pesadas, ornamentos ou animação contínua. Na wiki, o único movimento de assinatura é a carta do dia virar uma vez ao carregar. A home da marca (`/`) pode se mexer mais — rica, mas reativa (decisão da usuária, 2026-09-25): tudo responde a scroll, ponteiro ou toque e para quando a pessoa para, nada fica em loop, e tudo se desliga em `prefers-reduced-motion`.

**Key Characteristics:**
- Estrutura de portal de wiki (cabeçalho, faixa do dia, corpo em duas colunas com coluna lateral).
- Azul-noite e azul-profundo com poeira de estrelas só nas superfícies escuras: estática na wiki, céu em canvas com paralaxe no topo da home da marca.
- Movimento só reativo, e só na home da marca; nada em loop em lugar nenhum.
- Estrela de quatro pontas em SVG como marcador único de seção; o selo da marca (o portal, `public/selo.svg`) no cabeçalho e no rodapé.
- Ouro velho só em fios, foco e estrelas pequenas.
- Três vozes tipográficas: Castoro Titling (marca, títulos), Castoro (nomes, citação), Hanken Grotesk (interface).
- Tema escuro por `prefers-color-scheme`, trocando só os valores dos tokens.

## Colors

Uma paleta de azuis noturnos sobre um corpo claro azulado, com um único metal (ouro velho) usado como fio de luz.

### Primary
- **Azul-Noite** (`night`): fundo do cabeçalho e face da carta; a cor da marca. Sempre com poeira de estrelas.
- **Azul-Profundo da Faixa** (`band`): faixa "Hoje em Paradise Gate" e fundo de capa ausente (`pg-nocover`). É o azul mais saturado do sistema e ocupa só a faixa do dia.
- **Verso da Carta** (`card-back`): verso estrelado e fundo da inicial na carta de tarô.
- **Azul-Tinta de Link** (`link`, `link-hover`, `link-wash`): links, estrela de título de seção, numeral do ano, chips, botões contornados. O `link-wash` é o fundo de hover de linhas e chips.

### Secondary
- **Ouro Velho** (`gold`, `gold-soft`): borda interna da carta, anel de foco, caret da busca, selo da marca, hover de borda sobre fundos escuros, sublinhado da atribuição da citação.
- **Creme de Tarô** (`tarot-cream`): numeral romano e inicial da carta; também o ponto de estrela mais quente da poeira. Na home da marca, a frase da marca, o texto do convite secundário, os nomes das raças, o numeral e o nome das arcanas.
- **Azul-Constelação** (`constellation`): traço das constelações em SVG, sempre com opacidade entre 0.22 e 0.45. No topo da home da marca, a constelação fica embaixo à direita a 0.28 (380px) e some abaixo de 760px.

### Neutral
- **Papel Azulado** (`page`): fundo do corpo. O contrato de direção previa `#f3f5fa`; o build usa `#f2f4f9` e o build vale.
- **Painel** (`panel`): painéis, cartões e lista; branco puro no claro.
- **Fio** (`line`) e **Fio Forte** (`line-strong`): bordas de painel, divisória de lista, régua do título de seção; o forte em botões contornados e chips de filtro.
- **Tinta** (`ink`) e **Tinta Apagada** (`muted`): texto principal e metadados.
- **Sobre o Escuro** (`on-dark`, `on-dark-muted`): texto nas faixas escuras; títulos e nomes nelas usam branco puro.
- **Tema escuro**: os tokens `*-dark` substituem os homônimos em `prefers-color-scheme: dark`; ouro, creme e constelação não mudam (`--pg-tarot-cream` e `--pg-constellation` vivem em `tokens.css` com o mesmo valor nos dois temas e saem no `@theme` como `pg-tarot-cream` e `pg-constellation`).

### Named Rules
**The Gold Is Light Rule.** O ouro é fio de 1px, anel de foco ou estrela pequena. Nunca vira fundo de painel, botão ou faixa. A única área dourada existente é o selo "Aniversário hoje" na carta, um evento raro; não generalize. Na home da marca vale igual: nenhum botão ganha fundo dourado ou creme; o véu de ouro a 10–20% do convite secundário (a língua do "Entrar") é o limite, e o ouro entra só como fio de 1px, foco, estrela, faísca do rastro e traço de símbolo.

**The Stars Stay Dark Rule.** A poeira de estrelas (`--pg-stars`, estática; ou o céu em canvas do topo da home da marca) só aparece sobre azul-noite, azul-profundo ou verso da carta. O corpo claro nunca recebe estrelas.

## Typography

**Display Font:** Castoro Titling (com Castoro, Georgia, serif)
**Body Font:** Hanken Grotesk (com system-ui, -apple-system, Segoe UI, sans-serif)
**Serif de Nomes:** Castoro (com Georgia, serif), romano e itálico

**Character:** Castoro Titling é a voz de inscrição — só maiúsculas, espaçadas, como o cabeçalho de uma carta de tarô. Castoro dá aos nomes e à citação um tom literário; Hanken Grotesk mantém a interface discreta e legível.

### Hierarchy
- **Display** (Castoro Titling 400, `clamp(28px, 3.2vw, 40px)`, 1.12, 0.04em): o título da faixa do dia, com `text-wrap: balance`.
- **Quote** (Castoro itálico 400, `clamp(24px, 2.9vw, 38px)`, 1.3, até 60ch): a citação do dia, em branco sobre a faixa.
- **Numeral** (Castoro Titling, 42px, 1, `tabular-nums`): o ano em foco. O numeral romano da carta usa a mesma família a 15px com 0.16em.
- **Wordmark** (Castoro Titling, 22px, 0.07em; 19px abaixo de 560px): "Paradise Gate" no cabeçalho.
- **Headline** (Castoro Titling 400, 17px, 0.07em): títulos de seção, precedidos pela estrela e seguidos de régua de 1px.
- **Title** (Castoro 400, 16–19px, 1.25): nomes de página em cartões, lista, peças do dia e eventos.
- **Body** (Hanken Grotesk 400, 14.5px, 1.55): números da wiki e texto corrido de interface; 15–15.5px na data e na busca.
- **Label** (Hanken Grotesk 400–600, 12.5–13.5px, sem caixa alta, espaçamento 0): metadados, contagem, legendas, chips, botões.
- **Hero Title** (Castoro Titling 400, `clamp(42px, 5.6vw, 80px)`, 0.98, 0.05em, branco, `text-wrap: balance`): só "Paradise Gate" no topo da home da marca.
- **Hero Lede** (Castoro itálico 400, `clamp(22px, 2.6vw, 32px)`, 1.28, até 30ch, `tarot-cream`): a frase da marca, logo abaixo do título.
- **Game Title** (Castoro Titling 400, `clamp(30px, 4.2vw, 52px)`, 1.1, 0.04em, branco): o título da faixa "O jogo"; os subtítulos dela (Raças, Classes, Impulsos, Arcanas) em Castoro Titling 19px, 0.07em.
- **Reading** (Castoro 400, 19px, 1.65, até 62ch): o parágrafo de "O mundo" na home da marca. A citação ao lado é Castoro itálico 21px/1.45; o texto de apoio do topo e da faixa do jogo é Hanken 16px/1.6 `on-dark-muted` (15px abaixo de 760px no topo); os convites, Hanken 15px/600.

### Named Rules
**The Titling Voice Rule.** Castoro Titling é reservada à marca, títulos de seção, placa da carta, numerais e rodapé. Nomes de página são sempre Castoro, nunca Titling.

**The Quiet Label Rule.** Metadados em Hanken Grotesk ficam em caixa normal, sem espaçamento extra (o build zera `text-transform` e `letter-spacing` herdados). As maiúsculas do sistema vêm só da Castoro Titling.

**The Home Scale Rule.** Os tamanhos de display da home da marca (título até 80px, frase até 32px, título do jogo até 52px, leitura 19px, citação 21px) são dela. A wiki, as páginas internas e as páginas de leitura ficam na escala de cima.

## Layout

Contêiner central de 1160px com respiro lateral de 24px (16px no celular). Três faixas empilhadas: cabeçalho (uma linha, ~66px, marca à esquerda, busca de até 560px centralizada, entrar à direita), faixa do dia (grade `260px | 1fr`, gap 52px: carta à esquerda; título, data, citação e duas peças à direita) e corpo (grade `1fr | 320px`, gap 44px: feeds à esquerda, coluna lateral com Ano em foco, Explorar e A wiki em números à direita; "Todas as páginas" numa faixa de largura total embaixo das duas colunas). Com busca ou filtro ativo, a faixa do dia (só na busca por texto), os feeds e a coluna lateral saem do caminho e o índice sobe pro topo.

Ritmo: 44px entre seções, 16px entre título de seção e conteúdo, 12–14px entre cartões, 6–8px entre chips. Novidades em grade de capas retrato (`minmax(152px, 1fr)`, capa 4:5); Todas as páginas num único painel com divisórias finas (`minmax(205px, 1fr)`, cinco colunas no desktop) e miniatura 44px; a contagem ao lado do título vira "N de 42" com filtro ativo.

Responsivo: abaixo de 860px o corpo vira uma coluna na ordem feeds → coluna lateral → índice. Abaixo de 760px o índice mostra 12 páginas e um botão "Ver todas as N páginas". Abaixo de 760px a busca desce para a própria linha no cabeçalho e a faixa do dia empilha título, carta (230px), citação e peças. Abaixo de 560px as peças viram uma coluna, a carta cai para 200px, as capas ficam em duas colunas e a lista em uma.

Home da marca (`/`), "o verso da caixa": mesmo contêiner de 1160px, e a ordem é sempre topo, O mundo, O jogo, A mesa, Novidades. O topo é céu de ponta a ponta sob o cabeçalho, grade `1fr | 300px` com gap 56px, padding 72px 24px 84px e altura mínima `min(78vh, 720px)`: texto e convites à esquerda, carta do dia à direita. O mundo em `5fr | 7fr` (gap 44px): leitura, contagem, citação e ações à esquerda, três retratos à direita. O jogo é uma faixa escura de largura total (padding 76px 0 84px) com as escolhas em `5fr | 7fr` (gap 56px) e, embaixo, as cartas de impulso numa fileira horizontal com snap que sangra até a borda do contêiner, as arcanas em leque (190px de altura) e o convite final, cada bloco separado por 52–64px e fio branco a 12%. A mesa é um painel de largura total, texto à esquerda e pílulas à direita. Novidades é uma grade de seis retratos (gap 14px) com os escritos recentes embaixo. Abaixo de 960px, O mundo e as escolhas viram uma coluna e as Novidades três colunas. Abaixo de 760px o respiro vai a 16px, o topo empilha (carta a 220px, constelação escondida, convites dividindo a linha), os retratos de O mundo e as Novidades ficam em duas colunas, os grupos de classe empilham nome e lista, a mesa vira uma coluna e o leque das arcanas vira grade de 7×3.

## Elevation & Depth

Híbrido: tonalidade faz a maior parte (faixas escuras sobre corpo claro, painel branco sobre papel azulado), e uma sombra ambiente muito baixa separa painéis e cartões. A carta de tarô é o único objeto realmente elevado.

### Shadow Vocabulary
- **Painel** (`box-shadow: 0 1px 2px rgba(18,26,44,0.05), 0 14px 32px -22px rgba(18,26,44,0.28)`; escuro `0 1px 2px rgba(0,0,0,0.3), 0 16px 34px -22px rgba(0,0,0,0.7)`): painéis, lista e cartões de capa.
- **Carta** (`box-shadow: 0 2px 6px rgba(3,8,24,0.35), 0 30px 60px -26px rgba(3,8,24,0.85)`): só a carta do dia.
- **Selo de estado** (`box-shadow: 0 3px 10px rgba(3,8,24,0.35)`): o selo de aniversário sobre a carta.

### Named Rules
**The One Lifted Object Rule.** Só a carta do dia tem sombra profunda. Todo o resto usa a sombra de painel ou nenhuma. Na home da marca também: a carta do dia usa a sombra de carta; os retratos, a de painel; as cartas de impulso e as arcanas são planas, desenhadas só com um fio dourado inset de 1px (`box-shadow: inset 0 0 0 1px`, ouro a 40%; ouro pleno no hover ou na carta ativa).

## Shapes

Cantos suaves e consistentes por escala: 8px em miniaturas e linhas de evento, 10px em botões de ação, 12px em cartões e peças, 14px em painéis e na carta, pílula (999px) em busca, chips, entrar e numeral romano; 10px nos itens do menu da conta. No cabeçalho, o selo fica num círculo de 42px (36px no celular) com fio dourado.

Bordas são sempre de 1px. A carta tem proporção 7:11.4 e uma moldura interna dourada inset 7px com raio 9px. A estrela de quatro pontas (SVG, `viewBox 0 0 24 24`, `currentColor`) é a única forma decorativa do sistema, em 12–18px como marcador e 46px no verso da carta.

Na home da marca: retratos com raio 12px e capa 4:5; cartas de impulso com raio 12px (200×158px; 172px de largura abaixo de 760px); arcanas com raio 8px (78×128px no leque; proporção 7:11 na grade do celular); convites em pílula de 48px de altura; paginação da fileira em círculos de 44px.

## Components

### Buttons
- **Shape:** cantos de 10px nas ações da coluna lateral; pílula no "entrar" do cabeçalho.
- **Contornado (claro):** fundo transparente, borda `line-strong`, texto `link` Hanken 14.5px/600, 12px 16px. Largura total na coluna lateral, inline no "ver mais" dos feeds.
- **Hover / Focus:** hover pinta `link-wash` e a borda vira `link`; transição 0.2s ease-out. Anel de foco de 2px, offset 3px: `link` sobre superfícies claras, `gold` no cabeçalho e na faixa do dia.
- **Entrar:** pílula com ícone de pessoa (SVG 18px) e "Entrar" em Hanken 14px/600, mínimo 44px de altura. Sobre o escuro: borda `gold-soft`, fundo ouro a 10%, texto creme `#f3e6c4`; hover preenche de ouro com texto escuro. Sobre o claro (perfil): mesma pílula em contorno `link`.
- **Convites da home (sobre o escuro):** pílulas de 48px, Hanken 15px/600, 12px 22px, ícone SVG 18px, gap 9px. Primário ("Conhecer o mundo", "Abrir a ficha"): fundo branco, texto `night`; hover fundo `on-dark` com fio `gold`. Secundário ("Sou da mesa"): a língua do "Entrar" — fio `gold-soft`, véu de ouro a 10%, texto `tarot-cream`; hover fio `gold`, véu a 20%, texto branco. Foco `gold` 2px, offset 3px. Com ponteiro fino, um ímã leve puxa o convite até 6px na direção do ponteiro e solta com 0.45s.

### Chips
- **Filtro por tipo:** pílula, fundo `panel`, borda `line-strong`, texto `muted` 13.5px/500, 9px 15px. Hover: texto `ink`, borda `link`. Ativo: fundo `link`, texto `panel`, 600.
- **Tag:** pílula sem borda, fundo `link-wash`, texto `link`, 7px 12px; hover inverte para fundo `link`.

### Cards / Containers
- **Painel:** raio 14px, fundo `panel`, borda `line`, sombra de painel, padding 18px 20px 20px. Abre com título de seção.
- **Cartão de capa:** raio 12px, capa retrato 4:5, nome em Castoro 17px e metadados em label; hover sobe 3px (0.25s, `cubic-bezier(0.16, 1, 0.3, 1)`) e a borda vai para `line-strong`.
- **Sem capa:** bloco `band` com poeira de estrelas e a inicial em Castoro Titling dourada, para a grade não quebrar.
- **Linha de lista:** miniatura 44px raio 8px, nome em Castoro 16.5px (duas linhas no máximo), divisória `line`; hover `link-wash` e nome em `link`.
- **Peça do dia (par simétrico):** Entrada e Nota do dia lado a lado, mesma altura e mesmo esqueleto — título em Castoro 19px no topo (até duas linhas), trecho de duas linhas (o começo da visão geral da entrada; o texto da nota), legenda sempre embaixo, então os títulos começam na mesma linha. A capa da entrada é uma miniatura quadrada de 64px, raio 8px, por dentro do cartão (nunca um recorte alto sangrado). Fundo branco a 7%, borda branca a 14%, raio 12px, padding 16px 18px; hover clareia e a borda fica `gold-soft`. Uma coluna abaixo de 560px.

### Inputs / Fields
- **Busca:** pílula no cabeçalho, fundo branco a 8%, borda branca a 20%, texto branco 15px, ícone de lupa SVG 18px à esquerda, caret dourado.
- **Focus:** a borda vira `gold` e o fundo sobe para branco a 12%; sem outline extra.

### Navigation
- **Cabeçalho:** faixa `night` estrelada, uma linha no desktop; selo + wordmark, busca central, entrar. No celular a marca e o entrar dividem a primeira linha e a busca ocupa a segunda, largura total.
- **Rodapé:** régua `line` e um colofão centralizado: o selo dourado com 34px de altura em cima e "Paradise Gate · Wiki" embaixo, em Castoro Titling 14px, 0.08em, `muted`. Menor que isso os traços finos do portal viram mancha; por isso fica em cima do nome, não na mesma linha. Nas páginas fora do bundle (`reset-senha.html`, `cadastro.html`), o mesmo colofão com o selo a 30px.

### Menu da Conta
Logado, o "entrar" vira um avatar circular de 40px (foto do perfil quando existe; senão, a inicial do apelido ou do e-mail em Castoro Titling creme sobre o verso estrelado, fio `gold-soft`). Quando o autor respondeu ou decidiu uma sugestão depois da última visita do leitor ao perfil, um ponto dourado de 11px aparece no canto do avatar. Abre um painel `panel` de 280px, raio 14px, sombra de menu, com cabeçalho (avatar 46px, o apelido — ou "Sua conta" —, e-mail em `muted`) e itens de 44px: Meu perfil, Minhas sugestões (com a marca "1 nova" em ouro claro quando houver novidade), Favoritos, Ver como convidado, separador, Sair. Padrão de divulgação (`aria-controls`/`aria-expanded`): foca o primeiro item ao abrir, fecha com Esc (volta o foco ao avatar), com clique fora e quando o foco sai do menu. No celular vira uma folha fixa de largura total sob o cabeçalho.

### Página de Perfil
`/wiki/_perfil`, mesmo cabeçalho da home, coluna de 820px com título em Castoro Titling, uma fileira de atalhos (pílulas de contorno com âncora) e um painel por seção — feito pra crescer: seções futuras do site da franquia (fichas, campanhas) entram como novos painéis e novos atalhos. Dados em `wikiProfiles/{uid}`.
- **Identidade:** avatar 96px com "Trocar foto" (pílula de contorno; a foto é cortada em quadrado de 256px e reduzida no navegador) e "Remover foto" (texto sublinhado), campo Apelido (até 32 caracteres) com o botão cheio `link` "Salvar", e-mail, e uma linha de estado ("Apelido salvo." / erro em vermelho discreto).
- **Suas sugestões:** página em Castoro `link`, pílula de status — Pendente `link-wash`, Aceita verde `#235f3f` sobre verde a 12%, Não aceita cinza —, pílula dourada "Novidade" quando a resposta/decisão é mais nova que a última visita, texto, e a resposta do autor numa caixa `page`; sem resposta é só uma linha em itálico `muted`. Abrir a página conta como visto e apaga o aviso do avatar.
- **Favoritos:** linhas com miniatura de 44px (ou a inicial dourada sobre o azul estrelado), nome em Castoro e tipo; "Tirar" em texto sublinhado. Marca-se com o botão "Favoritar" (estrela da marca, `aria-pressed`) na fileira de ações de cada página; favoritado, a pílula ganha `link-wash` e a estrela fica dourada.
- **Seus acessos:** trechos restritos liberados pro e-mail do leitor, agrupados por página (nome em Castoro `link`, lista com marcador azul: "Seção “…”", "Versão confidencial de “…”", "Nota “…”"…). Só páginas do Paradise Gate.

### Fichas (perfil e mesa)
As fichas moram no perfil, como a Página de Perfil previa: o painel **Suas fichas** (`/wiki/_perfil#fichas`, com atalho no topo e "Minhas fichas" no menu da conta; `/jogo/fichas` leva pra lá). Quem vê é a API que diz (`features` do `/users/me`): o mestre sempre, os jogadores quando o backend libera; quem não está na mesa não vê nada. A página da mesa, **Fichas da mesa** (`/jogo/mesa`), aparece quando a API diz `features.mesa` (hoje, só o mestre): link na barra de navegação antes de Página aleatória; mesma casca do perfil. Estilos em `src/styles/jogo.css`.
- **Suas fichas:** "Nova ficha" (botão cheio `link`, cria e abre a ficha) e "Importar ficha (.json)" (pílula de contorno) no topo; linha de estado embaixo. Linhas iguais às dos Favoritos: inicial dourada sobre o azul estrelado (44px), nome em Castoro e "atualizada em 25 de set., 14:32" em `muted`; a linha inteira abre a ficha (`<a>` pra `/fichas.html?sheet=<id>`). "Apagar" em texto sublinhado; confirma na própria linha ("Apagar de vez? Não tem volta." + pílula de contorno vermelha discreta, o mesmo vermelho do erro do perfil, + "Cancelar"), sem modal. Ficha achada só neste navegador: caixa `link-wash` de fio `line-strong` com "Trazer pra conta" e "Agora não".
- **Todas as fichas** (página da mesa): todas as fichas da mesa, as do mestre também (ele joga), a mais recente em cima, na mesma linha dos Favoritos com "@jogador · atualizada em…" ou "sua · atualizada em…" (o dono em `ink` 500). As do mestre abrem normais, pra editar; as dos outros, em só leitura: a barra da ficha diz "Ficha de @jogador: só leitura, o que mudar aqui não vai pra conta" em dourado; se o jogador muda enquanto está aberta, "mudou desde que você abriu. Atualizar".
- **Sugestões do mestre:** o mestre escreve na ficha de um jogador (só leitura): botão "Sugestões do mestre · N" na barra da ficha abre uma caixa logo abaixo dela, com a cara da ficha (fio `--gold-dim`, Cinzel no título, EB Garamond no texto), campo de texto (até 2000), "Enviar sugestão" e a lista (data, @autor, "vista"/"ainda não vista", "Apagar"). A dona vê a mesma lista na ficha dela (o botão só aparece se houver sugestão; "· 1 nova") e no perfil, no painel **Sugestões do mestre** (`#mestre`), com o desenho de "Suas sugestões": nome da ficha como link, pílula dourada "Novidade", data e @mestre, texto. Abrir o perfil conta como visto.
- **Convites:** não ficam no site. O mestre convida e tira da mesa pelo editor dele (tela Jogadores), que pergunta à API do jogo.
- **Estados:** sem login (painel com "Entrar", como o perfil), carregando / "Conectando à conta… o servidor pode levar até um minuto pra acordar", erro com "Tentar de novo" (frase simples, nunca o detalhe técnico). Jogador que abre a página da mesa: "Esta página é do mestre da mesa" e o atalho pro perfil. A ficha tem "‹ Minhas fichas" (pro perfil) ou, aberta pelo mestre, "‹ Fichas da mesa".

### Título de Seção
Estrela de quatro pontas 13px em `link`, texto em Castoro Titling 17px, contagem opcional em Hanken 13px `muted` tabular, e uma régua de 1px `line` que preenche o resto da linha.

### Carta do Dia (componente assinatura)
Carta de tarô retrato (componente `src/components/TarotCard.tsx`; até 260px na wiki, 230px e 200px nos breakpoints; 300px na home da marca, 220px abaixo de 760px) com a imagem do Personagem do dia ou, sem imagem, a inicial creme 92px sobre o verso estrelado com constelação. No topo, numa pílula escura, o numeral da carta de tarô que o autor associou ao personagem no painel dele (romano; "0" pro Louco; nos menores, a letra da corte — P Pajem/Valete, N Cavaleiro, Q Rainha, K Rei; o N é o do xadrez, pra não confundir com o K do Rei) ou, sem carta associada, uma estrela dourada. Acima do nome, o símbolo da carta em traço dourado de 24px (`stroke-width 1.4`, mesma linguagem da estrela e da lupa), desenhando um objeto da própria carta, com detalhe por dentro e estrelinhas de acento: a pena do Louco, a pata da Força, a lanterna do Eremita, a foice da Morte, as doze estrelas da Imperatriz, o cálice de Copas (`ARCANA_GLYPHS` em `src/lib/arcana.ts`). Desenhados em path, nunca como caractere de fonte. O nome da carta por extenso ("XVII · A Estrela", "Rainha de Copas") não fica à vista: é detalhe visual, nem todo personagem tem carta no lore. Aparece ao passar o mouse (`title` do link) e é lido pelo leitor de tela (span `.pg-sr`). Aniversariante: um chapeuzinho de festa em traço dourado (40px, 32px no celular), torto 20° no canto superior direito da carta, meio pra fora da borda, com sombra suave — sem pílula nem texto na carta; "Aniversário hoje" vai no `title` e no leitor de tela, e a legenda vira "Aniversariante do dia". nome em Castoro Titling 19px numa placa de degradê escuro embaixo, moldura interna dourada. Ao carregar, vira uma vez do verso para a frente (`rotateY(-180deg → 0)`, 1.2s, `cubic-bezier(0.16, 1, 0.3, 1)`, atraso 0.25s); sem animação em `prefers-reduced-motion`. Na home da marca, além de virar, a carta inclina na direção do ponteiro (até 9° em Y e 7° em X, 0.6s, só com mouse) e volta ao centro quando o ponteiro sai do topo. Hover sobe 4px e a moldura fica ouro pleno. Estado vazio: mostra só o verso, sem virar.

### Páginas Internas (entrada, temporada, linha do tempo, erro)
Mesmo cabeçalho azul-noite da home (a busca leva pra home com `?q=`) e o mesmo rodapé. Em todas as páginas PG, uma **barra de navegação** fina logo abaixo do cabeçalho (fundo azul-noite a 28% mais escuro, links Hanken 14px/500 `on-dark-muted`, 44px de altura; hover e página atual em branco com fio dourado de 2px embaixo): as categorias — os tipos publicados no plural, ordenados por quantidade, até cinco, o resto num "Mais" — levam à home filtrada (`?tipo=`); à direita, Linha do tempo (só se houver eventos) e Página aleatória (`?aleatoria=1`, a home sorteia). No celular a barra rola de lado. O **rodapé** ganha Início · Linha do tempo · Página aleatória em `link` acima da marca. Abaixo do título, o tipo é um link pra categoria e vem seguido de "atualizado em 20 set. 2026". **Relações** agrupa as ligações por tipo — Família, Romance, Vínculos, Amizades, Aliados, Rivalidades, Facções, Lugares, Na história, Outras ligações —, cada grupo com um título em Hanken 14px/600 precedido de um ponto na cor do tipo e os cartões com retrato de 44px (capa ou inicial dourada sobre o azul estrelado); "Mencionado em" só lista quem não está nas ligações de ida, com o nome em cima e a relação escrita do ponto de vista da outra página. Abas (artigo, relações, retratos) seguem o padrão tablist com setas. Tarjas de spoiler são uma barra lisa na cor da tinta; o trecho aparece ao tocar. Nada de emoji marcando spoiler. Página de erro: título centralizado, mensagem e dois botões (Voltar pro início, Página aleatória). O artigo é um painel `panel` de até 1100px, raio 14px, fio `line`, sombra de painel, padding 34px 44px (no celular vira faixa cheia com gutter de 16px). Título em Castoro 30–42px; logo abaixo, o tipo em Hanken `muted` e, à direita, as ações de sugestão em pílulas de contorno ("Sugerir alteração", "Minhas sugestões aqui"), separados do texto por um fio. Seções com o mesmo título de seção da home (estrela `link`, Castoro Titling 17px, fio); seções recolhíveis ganham uma seta fina no fim da linha. Texto corrido em Castoro 17.5px/1.72. Infobox de 290px à direita (Alcunhas logo abaixo do retrato; Nascimento e Nascimento Lunar dentro do cabeçalho "Dados básicos" quando ele existe; tarja de spoiler numa linha só, e alcunha que quebra linha alinha depois do "•") (em cima do texto no celular): faixa de título no azul da faixa do dia com poeira de estrelas e Castoro Titling branco, abas de retrato em Hanken, linhas com fio `line`, rótulos em Hanken 12.5px/600 `muted`, valores em Castoro 15px, cabeçalhos internos em Castoro Titling sobre `link-wash`. Tags e abas de variante usam os chips da home. **Epígrafe** (a citação em destaque, fora da infobox desde 2026-09-24): abre o artigo de cada aba de texto, antes da visão geral, estilo Fandom — aspas de abertura em Castoro 72px `gold` à esquerda, texto em Castoro itálico 20px `ink`, autoria em Hanken 13.5px `muted` alinhada à direita ("— Alucard, sussurrando, para Luke · Ruínas de Vel · Livro I"), um fio `line` embaixo; ela respeita a infobox (flow-root), sem o fio passar por baixo dela. **Diálogos** são roteiro: nome em Hanken 12px/600 caixa-alta à direita de uma coluna estreita, fala em Castoro itálico ao lado, rubrica "(rindo)" reta em `muted`, direção de cena em itálico `muted` atravessando as duas colunas; no celular o nome sobe pra cima da fala. A aba **Citações** agrupa pelo papel da página: Falas, Diálogos, Trechos, Ditas a…, Sobre…; na home, um diálogo curto entra na faixa do dia com os nomes em dourado reto e as falas em Castoro branco. Os componentes antigos (galeria, árvore genealógica, grafo de relações, linha do tempo pessoal, conteúdo restrito) herdam o azul pelo remapeamento dos tokens antigos em `body.pg-site:not(.pg-home)`.

### Home da Marca (`/`)
"O verso da caixa" (`src/pages/HomePage.tsx`, `src/styles/home.css`), com o `PgHeader` e o `PgFooter` de sempre: topo, **O mundo**, **O jogo**, **A mesa**, **Novidades**, nessa ordem, cada parte com conteúdo real (índice da wiki, sorteio do dia, as listas da ficha).
- **Topo (céu):** azul-noite de ponta a ponta com um brilho `band` a 70% em elipse atrás da carta e uma régua dourada a 35% embaixo. As estrelas são um `<canvas>` em três camadas (as do fundo quase paradas; 12% no creme de tarô) e a constelação fica embaixo à direita a 0.28. À esquerda, o Hero Title, a frase da marca, o texto de apoio e os dois convites; à direita, a carta do dia a 300px.
- **Retrato:** o cartão de capa da wiki em pé — raio 12px, fio `line`, sombra de painel, capa 4:5 que cresce 4% no hover, nome em Castoro 17px (vira `link` no hover), metadados em label tabular. Três em O mundo, seis nas Novidades; carregando, blocos `line` a 60%.
- **O mundo:** leitura em Castoro 19px, contagem da wiki em Hanken `muted` tabular com o número em `ink` 600, citação do dia com fio `gold` de 1px à esquerda e autoria em Hanken 13.5px `muted`, e as ações (botão contornado + link de texto `link`).
- **Faixa do jogo:** `night` com `--pg-stars` e réguas douradas a 35% em cima e embaixo; foco dourado dentro dela. **Raças** em lista de duas colunas (Castoro 19px `tarot-cream`, divisórias brancas a 8%); **Classes** em grupos, o nome do grupo em Castoro Titling 15px, 0.08em, `gold` e as classes em Castoro 18px `on-dark`. Contagens em Hanken 13.5px `on-dark-muted` tabular. Fecha com o convite primário "Abrir a ficha".
- **Cartas de impulso:** fileira horizontal com snap e as bordas apagadas por máscara, paginada por dois botões circulares de 44px (fio branco a 24%; hover fio `gold`). Cada carta tem 158px de altura sobre `card-back`, raio 12px, fio dourado inset: estrela `gold` de 14px, nome em Castoro Titling 14.5px branco, linha em Castoro itálico 14.5px `on-dark-muted`. O verso é o `card-back` estrelado.
- **Arcanas:** as 21 arcanas maiores como botões-carta sobre o verso estrelado, com o numeral romano em Castoro Titling 12px `tarot-cream` no canto superior esquerdo e o símbolo `ARCANA_GLYPHS` em traço dourado de 26px no centro (20px no celular). A carta ativa sobe 14px com fio pleno, e o nome aparece embaixo em Castoro itálico 18px `tarot-cream`. Leque no desktop; grade de 7×3 abaixo de 760px.
- **A mesa:** título de seção da casa e um painel `panel` de largura total, texto em Hanken 14.5px com nota `muted` 13.5px à esquerda e as pílulas de contorno (44px) à direita.
- **Novidades:** grade de seis retratos (nome com duas linhas reservadas, metadados numa linha com reticências) e, embaixo, "Escritos recentes" em linhas de 44px com divisória `line`, nome em Castoro 16.5px e hover `link-wash`.

**Movimento da home.** Rico, mas reativo. Easing `cubic-bezier(0.16, 1, 0.3, 1)` em tudo. Sem movimento, tudo aparece parado e visível (o leque já aberto).
- **Céu:** as três camadas andam com o scroll e com o ponteiro em profundidades diferentes (paralaxe); o ponteiro ou o dedo deixa um rastro de faíscas em `gold` que se apaga em ~1s. O desenho só roda enquanto algo se mexe e para fora da tela.
- **Carta do dia:** vira uma vez ao carregar e inclina com o ponteiro.
- **Convites:** o ímã de até 6px.
- **Entradas:** as linhas do topo sobem uma vez ao carregar (80ms entre elas); cada bloco das seções sobe ou aparece uma vez ao entrar na tela, os retratos em cascata de 70ms.
- **Cartas de impulso:** chegam de costas e viram uma vez ao entrar na tela, 75ms entre elas.
- **Arcanas:** o leque abre conforme o scroll traz a seção e fica aberto; rolar pra cima não fecha.

**The Reactive Motion Rule.** Na home da marca, nada se mexe sem a pessoa: o movimento responde a scroll, ponteiro ou toque e para quando ela para; revelações acontecem uma vez; nada fica em loop; e tudo se desliga em `prefers-reduced-motion`. Na wiki e nas páginas internas continua valendo o único movimento de assinatura, a carta virar uma vez.

### Selo da Marca
O portal com estrelas, arquivo `public/selo.svg` (proporção 250:293). Entra como máscara CSS (`.pg-mark`) pintada com `gold`, então o desenho é sempre o arquivo e a cor vem do token. No cabeçalho, 26px de altura (22px no celular) dentro do círculo de 42px com fio `gold-soft`; no rodapé, o colofão descrito em Navigation. O arquivo não se edita, redesenha nem "completa"; trocar o selo é trocar o arquivo, com o autor.

## Do's and Don'ts

### Do:
- **Do** manter a estrutura de portal de wiki (cabeçalho com busca, faixa do dia, corpo em duas colunas com coluna lateral) e deixar a identidade nos detalhes.
- **Do** usar a estrela de quatro pontas em SVG com `currentColor` como marcador de seção.
- **Do** manter o ouro em fios de 1px, no anel de foco (2px, offset 3px) e em estrelas pequenas.
- **Do** dar a toda página sem imagem o bloco `band` estrelado com a inicial, para as grades não quebrarem.
- **Do** trocar tema claro/escuro só pelos valores dos tokens `--pg-*`, nunca por regras paralelas.
- **Do** desligar a virada da carta, os saltos de hover e as transições em `prefers-reduced-motion` — e, na home da marca, também o céu, o rastro, a inclinação da carta, o ímã, as revelações e o leque.
- **Do** manter o movimento da home da marca reativo: responde a scroll, ponteiro ou toque, para quando a pessoa para, e cada revelação acontece uma vez.
- **Do** usar numerais romanos para as cartas e `tabular-nums` para números do mundo (ano, contagens). Números da wiki aparecem exatos ("1.043"), e o que está zerado não aparece.

### Don't:
- **Don't** transformar a home (da wiki ou da marca) em "site de fantasia" performático: nada de ornamentos, texturas pesadas ou animação contínua. Na wiki, o único movimento de assinatura é a carta virar uma vez; na home da marca, o movimento é só reativo e nunca em loop.
- **Don't** voltar ao cartão creme genérico empilhado como estrutura de página.
- **Don't** pôr poeira de estrelas sobre o corpo claro ou em painéis brancos.
- **Don't** usar o ouro como fundo de painel, botão ou faixa.
- **Don't** escrever metadados em Hanken Grotesk com caixa alta espaçada; as maiúsculas são da Castoro Titling.
- **Don't** criar, redesenhar ou "completar" o selo da marca; ele é só o arquivo `public/selo.svg`.
- **Don't** inventar lore, personagens, lugares, nomes ou termos. Conteúdo do mundo vem só do que está publicado na wiki ou do que o autor passar.

## O site além da wiki

A wiki é a primeira parte do site da marca. Toda página nova (home da marca, o jogo, notícias,
sobre a obra, galeria, loja, lançamentos) usa **este mesmo sistema**: é o mesmo mundo, então tem
que parecer o mesmo lugar.

### Como aplicar numa página nova
- **Cores, fontes e raios** pelos tokens de `src/styles/tokens.css`: em CSS com
  `var(--pg-link)`, ou com as classes do Tailwind geradas pelo `@theme` (`bg-pg-night`,
  `text-pg-ink`, `border-pg-line`, `font-pg-title`, `font-pg-serif`, `font-pg-ui`…). Nunca um
  hex solto: o tema escuro só funciona se tudo passar pelos tokens.
- **Cabeçalho e rodapé** são sempre `PgHeader` e `PgFooter` (`src/components/`). Uma seção
  nova do site entra como link no cabeçalho, não como um cabeçalho novo.
- **Estrutura** de portal: contêiner de até 1160px, respiro lateral de 24px (16px no celular),
  44px entre seções, título de seção com a estrela de quatro pontas e a régua de 1px.
- **Superfícies**: o céu (azul-noite com poeira de estrelas) só em faixas escuras, como o
  cabeçalho e um topo de destaque; o corpo é o papel azulado com painéis brancos de fio fino.
- **Não edite `src/styles/wiki.css`** pra estilizar página nova. Ele existe pra wiki ficar
  idêntica ao que era; página nova usa os tokens.

### Por tipo de página
- **Home da marca e página do jogo (convencer):** pode ser a página mais expressiva do site. A
  home da marca já existe (Components › Home da Marca): céu azul-noite no topo com a carta do dia
  e dois convites, depois o verso da caixa — O mundo, O jogo, A mesa, Novidades —, cada parte com
  conteúdo real. Arte só a que o autor fornecer ou as capas já publicadas na wiki. Movimento só
  reativo (scroll, ponteiro, toque), nunca em loop, tudo desligado em `prefers-reduced-motion`;
  sem ornamento, sem textura pesada. A carta de tarô é o gesto de assinatura; use com parcimônia.
- **Notícias, sobre a obra, diário de produção (ler):** coluna de leitura de 680–760px, texto em
  Castoro 17.5px/1.72 como o artigo da wiki, título de seção da casa, data em Hanken `muted`.
- **Galeria e lançamentos (mostrar):** a arte na frente; a interface some. Grade de capas
  retrato como "Novidades" da wiki, com o mesmo hover.
- **Loja ou qualquer coisa com compra/cadastro:** a interface mais sóbria do site, Hanken em
  tudo que é ação, botões claros, nada de brincadeira em cima de dinheiro ou dados pessoais.

### Voz dos textos
Português do Brasil, direto e caloroso, sem jargão de marketing. Nada de "incrível",
"épico", "imersivo" e parecidos: o mundo fala por si. Títulos curtos. Erros e estados vazios
dizem o que aconteceu e o que fazer.

### Imagens
Arte da obra só a que o autor fornecer. Não gerar, desenhar nem "completar" personagens, cenas
ou o selo da marca. Sem imagem, use o bloco azul estrelado com a inicial dourada, como a wiki.
