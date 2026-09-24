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
---

# Design System: Paradise Gate

<!-- Sistema visual do site inteiro. Nasceu na wiki (a primeira parte do site) e vale pra toda página nova. Os valores vivem como tokens --pg-* em src/styles/tokens.css (com classes Tailwind geradas pelo bloco @theme) e, pra wiki, também em body.pg-site dentro de src/styles/wiki.css. Tema escuro por prefers-color-scheme. -->

## Overview

**Creative North Star: "O Portal sob o Céu Noturno"**

Paradise Gate é uma wiki de fandom de verdade — cabeçalho com busca, destaques do dia, coluna lateral, listas densas — e a identidade do mundo entra só pelos detalhes: céu azul-noite com poeira de estrelas estática, a estrela de quatro pontas como marcador, a carta de tarô do dia com numeral romano e douração fina. A estrutura é de portal clássico; a assinatura é pequena, recorrente e sempre a mesma.

O azul domina. Duas faixas escuras no topo (noite e azul-profundo) carregam o céu; o corpo é claro e azulado, com painéis brancos de borda fina e sombra difusa. O ouro velho é luz, não superfície: aparece em fios, no foco e em estrelas pequenas. A densidade é de wiki: muito conteúdo visível, lista compacta com miniatura, sem blocos decorativos vazios.

O sistema recusa o cartão creme genérico empilhado e o "site de fantasia" performático (carro alegórico): nada de texturas pesadas, ornamentos ou animação contínua. O único movimento de assinatura é a carta do dia virar uma vez ao carregar.

**Key Characteristics:**
- Estrutura de portal de wiki (cabeçalho, faixa do dia, corpo em duas colunas com coluna lateral).
- Azul-noite e azul-profundo com poeira de estrelas estática só nas superfícies escuras.
- Estrela de quatro pontas em SVG como marcador único de seção, rodapé e selo provisório.
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
- **Ouro Velho** (`gold`, `gold-soft`): borda interna da carta, anel de foco, caret da busca, estrela do rodapé, hover de borda sobre fundos escuros, sublinhado da atribuição da citação.
- **Creme de Tarô** (`tarot-cream`): numeral romano e inicial da carta; também o ponto de estrela mais quente da poeira.
- **Azul-Constelação** (`constellation`): traço das constelações em SVG, sempre com opacidade entre 0.22 e 0.45.

### Neutral
- **Papel Azulado** (`page`): fundo do corpo. O contrato de direção previa `#f3f5fa`; o build usa `#f2f4f9` e o build vale.
- **Painel** (`panel`): painéis, cartões e lista; branco puro no claro.
- **Fio** (`line`) e **Fio Forte** (`line-strong`): bordas de painel, divisória de lista, régua do título de seção; o forte em botões contornados e chips de filtro.
- **Tinta** (`ink`) e **Tinta Apagada** (`muted`): texto principal e metadados.
- **Sobre o Escuro** (`on-dark`, `on-dark-muted`): texto nas faixas escuras; títulos e nomes nelas usam branco puro.
- **Tema escuro**: os tokens `*-dark` substituem os homônimos em `prefers-color-scheme: dark`; ouro, creme e constelação não mudam.

### Named Rules
**The Gold Is Light Rule.** O ouro é fio de 1px, anel de foco ou estrela pequena. Nunca vira fundo de painel, botão ou faixa. A única área dourada existente é o selo "Aniversário hoje" na carta, um evento raro; não generalize.

**The Stars Stay Dark Rule.** A poeira de estrelas (`--pg-stars`, estática) só aparece sobre azul-noite, azul-profundo ou verso da carta. O corpo claro nunca recebe estrelas.

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

### Named Rules
**The Titling Voice Rule.** Castoro Titling é reservada à marca, títulos de seção, placa da carta, numerais e rodapé. Nomes de página são sempre Castoro, nunca Titling.

**The Quiet Label Rule.** Metadados em Hanken Grotesk ficam em caixa normal, sem espaçamento extra (o build zera `text-transform` e `letter-spacing` herdados). As maiúsculas do sistema vêm só da Castoro Titling.

## Layout

Contêiner central de 1160px com respiro lateral de 24px (16px no celular). Três faixas empilhadas: cabeçalho (uma linha, ~66px, marca à esquerda, busca de até 560px centralizada, entrar à direita), faixa do dia (grade `260px | 1fr`, gap 52px: carta à esquerda; título, data, citação e duas peças à direita) e corpo (grade `1fr | 320px`, gap 44px: feeds à esquerda, coluna lateral com Ano em foco, Explorar e A wiki em números à direita; "Todas as páginas" numa faixa de largura total embaixo das duas colunas). Com busca ou filtro ativo, a faixa do dia (só na busca por texto), os feeds e a coluna lateral saem do caminho e o índice sobe pro topo.

Ritmo: 44px entre seções, 16px entre título de seção e conteúdo, 12–14px entre cartões, 6–8px entre chips. Novidades em grade de capas retrato (`minmax(152px, 1fr)`, capa 4:5); Todas as páginas num único painel com divisórias finas (`minmax(205px, 1fr)`, cinco colunas no desktop) e miniatura 44px; a contagem ao lado do título vira "N de 42" com filtro ativo.

Responsivo: abaixo de 860px o corpo vira uma coluna na ordem feeds → coluna lateral → índice. Abaixo de 760px o índice mostra 12 páginas e um botão "Ver todas as N páginas". Abaixo de 760px a busca desce para a própria linha no cabeçalho e a faixa do dia empilha título, carta (230px), citação e peças. Abaixo de 560px as peças viram uma coluna, a carta cai para 200px, as capas ficam em duas colunas e a lista em uma.

## Elevation & Depth

Híbrido: tonalidade faz a maior parte (faixas escuras sobre corpo claro, painel branco sobre papel azulado), e uma sombra ambiente muito baixa separa painéis e cartões. A carta de tarô é o único objeto realmente elevado.

### Shadow Vocabulary
- **Painel** (`box-shadow: 0 1px 2px rgba(18,26,44,0.05), 0 14px 32px -22px rgba(18,26,44,0.28)`; escuro `0 1px 2px rgba(0,0,0,0.3), 0 16px 34px -22px rgba(0,0,0,0.7)`): painéis, lista e cartões de capa.
- **Carta** (`box-shadow: 0 2px 6px rgba(3,8,24,0.35), 0 30px 60px -26px rgba(3,8,24,0.85)`): só a carta do dia.
- **Selo de estado** (`box-shadow: 0 3px 10px rgba(3,8,24,0.35)`): o selo de aniversário sobre a carta.

### Named Rules
**The One Lifted Object Rule.** Só a carta do dia tem sombra profunda. Todo o resto usa a sombra de painel ou nenhuma.

## Shapes

Cantos suaves e consistentes por escala: 8px em miniaturas e linhas de evento, 10px em botões de ação, 12px em cartões e peças, 14px em painéis e na carta, pílula (999px) em busca, chips, entrar e numeral romano; 10px nos itens do menu da conta. O selo provisório é um círculo de 42px (36px no celular) com fio dourado.

Bordas são sempre de 1px. A carta tem proporção 7:11.4 e uma moldura interna dourada inset 7px com raio 9px. A estrela de quatro pontas (SVG, `viewBox 0 0 24 24`, `currentColor`) é a única forma decorativa do sistema, em 12–18px como marcador e 46px no verso da carta.

## Components

### Buttons
- **Shape:** cantos de 10px nas ações da coluna lateral; pílula no "entrar" do cabeçalho.
- **Contornado (claro):** fundo transparente, borda `line-strong`, texto `link` Hanken 14.5px/600, 12px 16px. Largura total na coluna lateral, inline no "ver mais" dos feeds.
- **Hover / Focus:** hover pinta `link-wash` e a borda vira `link`; transição 0.2s ease-out. Anel de foco de 2px, offset 3px: `link` sobre superfícies claras, `gold` no cabeçalho e na faixa do dia.
- **Entrar:** pílula com ícone de pessoa (SVG 18px) e "Entrar" em Hanken 14px/600, mínimo 44px de altura. Sobre o escuro: borda `gold-soft`, fundo ouro a 10%, texto creme `#f3e6c4`; hover preenche de ouro com texto escuro. Sobre o claro (perfil): mesma pílula em contorno `link`.

### Chips
- **Filtro por tipo:** pílula, fundo `panel`, borda `line-strong`, texto `muted` 13.5px/500, 9px 15px. Hover: texto `ink`, borda `link`. Ativo: fundo `link`, texto `panel`, 600.
- **Tag:** pílula sem borda, fundo `link-wash`, texto `link`, 7px 12px; hover inverte para fundo `link`.

### Cards / Containers
- **Painel:** raio 14px, fundo `panel`, borda `line`, sombra de painel, padding 18px 20px 20px. Abre com título de seção.
- **Cartão de capa:** raio 12px, capa retrato 4:5, nome em Castoro 17px e metadados em label; hover sobe 3px (0.25s, `cubic-bezier(0.16, 1, 0.3, 1)`) e a borda vai para `line-strong`.
- **Sem capa:** bloco `band` com poeira de estrelas e a inicial em Castoro Titling dourada, para a grade não quebrar.
- **Linha de lista:** miniatura 44px raio 8px, nome em Castoro 16.5px (duas linhas no máximo), divisória `line`; hover `link-wash` e nome em `link`.
- **Peça do dia (par simétrico):** Entrada e Nota do dia lado a lado, mesma altura e mesmo esqueleto — título em Castoro 19px no topo (até duas linhas), trecho de duas linhas (o resumo da entrada; o texto da nota), legenda sempre embaixo, então os títulos começam na mesma linha. A capa da entrada é uma miniatura quadrada de 64px, raio 8px, por dentro do cartão (nunca um recorte alto sangrado). Fundo branco a 7%, borda branca a 14%, raio 12px, padding 16px 18px; hover clareia e a borda fica `gold-soft`. Uma coluna abaixo de 560px.

### Inputs / Fields
- **Busca:** pílula no cabeçalho, fundo branco a 8%, borda branca a 20%, texto branco 15px, ícone de lupa SVG 18px à esquerda, caret dourado.
- **Focus:** a borda vira `gold` e o fundo sobe para branco a 12%; sem outline extra.

### Navigation
- **Cabeçalho:** faixa `night` estrelada, uma linha no desktop; selo provisório + wordmark, busca central, entrar. No celular a marca e o entrar dividem a primeira linha e a busca ocupa a segunda, largura total.
- **Rodapé:** régua `line`, estrela dourada 12px e "Paradise Gate · Wiki" em Castoro Titling 14px, 0.08em, `muted`.

### Menu da Conta
Logado, o "entrar" vira um avatar circular de 40px (foto do perfil quando existe; senão, a inicial do apelido ou do e-mail em Castoro Titling creme sobre o verso estrelado, fio `gold-soft`). Quando o autor respondeu ou decidiu uma sugestão depois da última visita do leitor ao perfil, um ponto dourado de 11px aparece no canto do avatar. Abre um painel `panel` de 280px, raio 14px, sombra de menu, com cabeçalho (avatar 46px, o apelido — ou "Sua conta" —, e-mail em `muted`) e itens de 44px: Meu perfil, Minhas sugestões (com a marca "1 nova" em ouro claro quando houver novidade), Favoritos, Ver como convidado, separador, Sair. Padrão de divulgação (`aria-controls`/`aria-expanded`): foca o primeiro item ao abrir, fecha com Esc (volta o foco ao avatar), com clique fora e quando o foco sai do menu. No celular vira uma folha fixa de largura total sob o cabeçalho.

### Página de Perfil
`/wiki/_perfil`, mesmo cabeçalho da home, coluna de 820px com título em Castoro Titling, uma fileira de atalhos (pílulas de contorno com âncora) e um painel por seção — feito pra crescer: seções futuras do site da franquia (fichas, campanhas) entram como novos painéis e novos atalhos. Dados em `wikiProfiles/{uid}`.
- **Identidade:** avatar 96px com "Trocar foto" (pílula de contorno; a foto é cortada em quadrado de 256px e reduzida no navegador) e "Remover foto" (texto sublinhado), campo Apelido (até 32 caracteres) com o botão cheio `link` "Salvar", e-mail, e uma linha de estado ("Apelido salvo." / erro em vermelho discreto).
- **Suas sugestões:** página em Castoro `link`, pílula de status — Pendente `link-wash`, Aceita verde `#235f3f` sobre verde a 12%, Não aceita cinza —, pílula dourada "Novidade" quando a resposta/decisão é mais nova que a última visita, texto, e a resposta do autor numa caixa `page`; sem resposta é só uma linha em itálico `muted`. Abrir a página conta como visto e apaga o aviso do avatar.
- **Favoritos:** linhas com miniatura de 44px (ou a inicial dourada sobre o azul estrelado), nome em Castoro e tipo; "Tirar" em texto sublinhado. Marca-se com o botão "Favoritar" (estrela da marca, `aria-pressed`) na fileira de ações de cada página; favoritado, a pílula ganha `link-wash` e a estrela fica dourada.
- **Seus acessos:** trechos restritos liberados pro e-mail do leitor, agrupados por página (nome em Castoro `link`, lista com marcador azul: "Seção “…”", "Versão confidencial de “…”", "Nota “…”"…). Só páginas do Paradise Gate.

### Título de Seção
Estrela de quatro pontas 13px em `link`, texto em Castoro Titling 17px, contagem opcional em Hanken 13px `muted` tabular, e uma régua de 1px `line` que preenche o resto da linha.

### Carta do Dia (componente assinatura)
Carta de tarô retrato (até 260px; 230px e 200px nos breakpoints) com a imagem do Personagem do dia ou, sem imagem, a inicial creme 92px sobre o verso estrelado com constelação. No topo, numa pílula escura, o numeral da carta de tarô que o autor associou ao personagem no painel dele (romano; "0" pro Louco; nos menores, a letra da corte — P Pajem/Valete, N Cavaleiro, Q Rainha, K Rei; o N é o do xadrez, pra não confundir com o K do Rei) ou, sem carta associada, uma estrela dourada. Acima do nome, o símbolo da carta em traço dourado de 24px (`stroke-width 1.4`, mesma linguagem da estrela e da lupa), numa língua só: as correspondências da Golden Dawn — o planeta ou signo de cada arcano maior (Mago ☿, Sacerdotisa ☽, Imperatriz ♀, Imperador ♈ … Sol ☉, Mundo ♄; as três cartas elementais usam os planetas modernos: Louco ♅, Enforcado ♆, Julgamento ♇) e o triângulo alquímico do elemento de cada naipe (Copas água, Ouros terra, Espadas ar, Paus fogo). Desenhados em path, nunca como caractere de fonte. O nome da carta por extenso ("XVII · A Estrela", "Rainha de Copas") não fica à vista: é detalhe visual, nem todo personagem tem carta no lore. Aparece ao passar o mouse (`title` do link) e é lido pelo leitor de tela (span `.pg-sr`). Aniversariante: um chapeuzinho de festa em traço dourado (40px, 32px no celular), torto 20° no canto superior direito da carta, meio pra fora da borda, com sombra suave — sem pílula nem texto na carta; "Aniversário hoje" vai no `title` e no leitor de tela, e a legenda vira "Aniversariante do dia". nome em Castoro Titling 19px numa placa de degradê escuro embaixo, moldura interna dourada. Ao carregar, vira uma vez do verso para a frente (`rotateY(-180deg → 0)`, 1.2s, `cubic-bezier(0.16, 1, 0.3, 1)`, atraso 0.25s); sem animação em `prefers-reduced-motion`. Hover sobe 4px e a moldura fica ouro pleno. Estado vazio: mostra só o verso, sem virar.

### Páginas Internas (entrada, temporada, linha do tempo, erro)
Mesmo cabeçalho azul-noite da home (a busca leva pra home com `?q=`) e o mesmo rodapé. Em todas as páginas PG, uma **barra de navegação** fina logo abaixo do cabeçalho (fundo azul-noite a 28% mais escuro, links Hanken 14px/500 `on-dark-muted`, 44px de altura; hover e página atual em branco com fio dourado de 2px embaixo): as categorias — os tipos publicados no plural, ordenados por quantidade, até cinco, o resto num "Mais" — levam à home filtrada (`?tipo=`); à direita, Linha do tempo (só se houver eventos) e Página aleatória (`?aleatoria=1`, a home sorteia). No celular a barra rola de lado. O **rodapé** ganha Início · Linha do tempo · Página aleatória em `link` acima da marca. Abaixo do título, o tipo é um link pra categoria e vem seguido de "atualizado em 20 set. 2026". **Relações** agrupa as ligações por tipo — Família, Romance, Vínculos, Amizades, Aliados, Rivalidades, Facções, Lugares, Na história, Outras ligações —, cada grupo com um título em Hanken 14px/600 precedido de um ponto na cor do tipo e os cartões com retrato de 44px (capa ou inicial dourada sobre o azul estrelado); "Mencionado em" só lista quem não está nas ligações de ida, com o nome em cima e a relação escrita do ponto de vista da outra página. Abas (artigo, relações, retratos) seguem o padrão tablist com setas. Tarjas de spoiler são uma barra lisa na cor da tinta; o trecho aparece ao tocar. Nada de emoji marcando spoiler. Página de erro: título centralizado, mensagem e dois botões (Voltar pro início, Página aleatória). O artigo é um painel `panel` de até 1100px, raio 14px, fio `line`, sombra de painel, padding 34px 44px (no celular vira faixa cheia com gutter de 16px). Título em Castoro 30–42px; logo abaixo, o tipo em Hanken `muted` e, à direita, as ações de sugestão em pílulas de contorno ("Sugerir alteração", "Minhas sugestões aqui"), separados do texto por um fio. Seções com o mesmo título de seção da home (estrela `link`, Castoro Titling 17px, fio); seções recolhíveis ganham uma seta fina no fim da linha. Texto corrido em Castoro 17.5px/1.72. Infobox de 290px à direita (Alcunhas logo abaixo do retrato; Nascimento e Nascimento Lunar dentro do cabeçalho "Dados básicos" quando ele existe; tarja de spoiler numa linha só, e alcunha que quebra linha alinha depois do "•") (em cima do texto no celular): faixa de título no azul da faixa do dia com poeira de estrelas e Castoro Titling branco, abas de retrato em Hanken, linhas com fio `line`, rótulos em Hanken 12.5px/600 `muted`, valores em Castoro 15px, cabeçalhos internos em Castoro Titling sobre `link-wash`. Tags e abas de variante usam os chips da home. **Epígrafe** (a citação em destaque, fora da infobox desde 2026-09-24): abre o artigo de cada aba de texto, antes da visão geral, estilo Fandom — aspas de abertura em Castoro 72px `gold` à esquerda, texto em Castoro itálico 20px `ink`, autoria em Hanken 13.5px `muted` alinhada à direita ("— Alucard, sussurrando, para Luke · Ruínas de Vel · Livro I"), um fio `line` embaixo; ela respeita a infobox (flow-root), sem o fio passar por baixo dela. **Diálogos** são roteiro: nome em Hanken 12px/600 caixa-alta à direita de uma coluna estreita, fala em Castoro itálico ao lado, rubrica "(rindo)" reta em `muted`, direção de cena em itálico `muted` atravessando as duas colunas; no celular o nome sobe pra cima da fala. A aba **Citações** agrupa pelo papel da página: Falas, Diálogos, Trechos, Ditas a…, Sobre…; na home, um diálogo curto entra na faixa do dia com os nomes em dourado reto e as falas em Castoro branco. Os componentes antigos (galeria, árvore genealógica, grafo de relações, linha do tempo pessoal, conteúdo restrito) herdam o azul pelo remapeamento dos tokens antigos em `body.pg-site:not(.pg-home)`.

### Selo da Marca (lugar reservado)
Círculo de 42px com fio `gold-soft` e uma estrela no centro. É um marcador provisório: o autor troca o conteúdo por um `<img>` do selo quando ele existir. Não desenhar, sugerir nem gerar um selo.

## Do's and Don'ts

### Do:
- **Do** manter a estrutura de portal de wiki (cabeçalho com busca, faixa do dia, corpo em duas colunas com coluna lateral) e deixar a identidade nos detalhes.
- **Do** usar a estrela de quatro pontas em SVG com `currentColor` como marcador de seção, rodapé e selo provisório.
- **Do** manter o ouro em fios de 1px, no anel de foco (2px, offset 3px) e em estrelas pequenas.
- **Do** dar a toda página sem imagem o bloco `band` estrelado com a inicial, para as grades não quebrarem.
- **Do** trocar tema claro/escuro só pelos valores dos tokens `--pg-*`, nunca por regras paralelas.
- **Do** desligar a virada da carta, os saltos de hover e as transições em `prefers-reduced-motion`.
- **Do** usar numerais romanos para as cartas e `tabular-nums` para números do mundo (ano, contagens). Números da wiki aparecem exatos ("1.043"), e o que está zerado não aparece.

### Don't:
- **Don't** transformar a home em "site de fantasia" performático: nada de ornamentos, texturas pesadas ou animação contínua; o único movimento de assinatura é a carta virar uma vez.
- **Don't** voltar ao cartão creme genérico empilhado como estrutura de página.
- **Don't** pôr poeira de estrelas sobre o corpo claro ou em painéis brancos.
- **Don't** usar o ouro como fundo de painel, botão ou faixa.
- **Don't** escrever metadados em Hanken Grotesk com caixa alta espaçada; as maiúsculas são da Castoro Titling.
- **Don't** criar, desenhar ou propor um selo para a marca; o círculo com estrela é lugar reservado.
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
- **Home da marca e página do jogo (convencer):** pode ser a página mais expressiva do site. Um
  topo em azul-noite com uma imagem forte da obra (arte que o autor fornecer), uma frase curta e
  um convite claro (ex.: conhecer a wiki, saber do jogo). Mesmo assim: sem ornamento, sem textura
  pesada, sem animação contínua. A carta de tarô é o gesto de assinatura; use com parcimônia.
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
