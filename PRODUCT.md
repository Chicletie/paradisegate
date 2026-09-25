# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Jogadores da mesa** do autor: consultam personagens, facções, lore e o que já aconteceu na
  história. Alguns têm conta (por convite do autor) e veem trechos liberados só pra eles.
- **Público em geral:** qualquer pessoa com o link. Pra essa gente o site é a porta de entrada
  do mundo e da marca.
- **Fãs e futuros jogadores do RPG:** conforme o site cresce (o jogo, lançamentos, loja), é
  quem vem saber o que é Paradise Gate e como jogar.

A leitura é meio a meio entre celular e computador: toda página precisa funcionar de verdade
nos dois.

## Product Purpose

**paradisegate.com.br** é o site da marca e franquia de RPG de mesa **Paradise Gate**. A primeira
parte pronta é a **wiki** (`/wiki`): as páginas são publicadas pelo autor a partir do painel dele
e aparecem aqui sozinhas. O resto do site (home da marca, o jogo, notícias, sobre a obra,
galeria, lançamentos, loja) é construído neste repositório em cima da mesma identidade.

## Positioning

Paradise Gate é fantasia urbana sombria: a magia existe escondida no mundo moderno, milícias
mágicas usam codinomes mitológicos (Hades, Hermes, Apollo, Sekhmet…) e uma igreja domina o mundo
por trás das instituições. O centro é o drama entre personagens presos num sistema corrupto.

Pra qualquer texto do site que fale do mundo: use só o que está publicado na wiki ou o que o
autor passar. Não invente lore, personagens, lugares, nomes nem termos.

## Operating Context

- Site estático (Vite + React + TypeScript + Tailwind), publicado no GitHub Pages.
- Os dados da wiki vêm do Firestore do autor, **só leitura** pelo site (ver
  `docs/dados-da-wiki.md`). O site nunca grava nada além do que a wiki já grava (perfil do
  leitor e sugestões).
- Qualquer coisa nova que precise de servidor ou banco (loja, cadastro de fãs, newsletter) vai
  num serviço pronto ou num projeto Firebase **separado, da marca**, combinado com o autor. Nunca
  no projeto que a wiki lê.

## Capabilities and Constraints

Funções da wiki que precisam continuar existindo (o visual pode evoluir, a função não):
- Destaques do dia com sorteio igual pra todo visitante (reset 00h de Brasília): Personagem do
  dia como carta de tarô (aniversariante com chapeuzinho), Citação, Entrada e Nota do dia, Ano em
  foco. Cada destaque tem um estado vazio digno.
- Busca (nome, tipo, tag, nota, trecho do texto), filtros por tipo e tag, lista completa,
  Novidades e Notas recentes, números da wiki, página aleatória, linha do tempo.
- Página de cada personagem/lugar/facção: infobox, abas, citações e diálogos, relações,
  genealogia, galeria, spoilers que revelam ao toque.
- Login de jogadores (só por convite), perfil com apelido e foto, favoritos, sugestões ao autor
  e trechos liberados por pessoa.

Restrições:
- **Função acima de estética:** um redesenho nunca remove nem piora algo que já funciona.
- O site fala só de Paradise Gate.
- Sem analytics nem scripts de terceiros sem combinar com o autor.

## Brand Commitments

- Nome: **Paradise Gate**. Identidade azul: azul-noite, estrelas, e detalhes de tarô (numerais
  romanos, douração fina) como toques discretos.
- Referência de forma: uma wiki de fandom limpa (tipo Fandom), com identidade própria sutil.
  Nada de "carro alegórico" nem experiência performática.
- **O selo da marca é o portal com estrelas** (`public/selo.svg`), em dourado no cabeçalho e
  no rodapé. É só esse arquivo: não gerar, redesenhar nem "completar" o selo.
- `selo-whitmore.png` (medalhão prateado com "W") é de uma instituição do mundo, usado nos
  e-mails de convite. Não é o selo da marca.

## Evidence on Hand

- Conteúdo real na wiki: dezenas de páginas publicadas (maioria personagens, várias com arte),
  citações e diálogos reais.
- Não inventar citações, eventos, números ou personagens que não estejam publicados.

## Product Principles

1. O mundo vem primeiro: quem chega tem que sentir Paradise Gate, não "mais um site".
2. Achar é rápido: quem veio atrás de uma página específica acha em segundos.
3. Todo dia tem algo novo pra ver.
4. Nada quebra quando falta conteúdo: todo bloco tem um estado vazio digno.
5. Uma identidade só: toda página nova parece o mesmo lugar que a wiki.

## Accessibility & Inclusion

Contraste legível nos temas claro e escuro, respeito a `prefers-reduced-motion`, alvos de toque
de pelo menos 44px no celular, navegação por teclado com foco visível.
