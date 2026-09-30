# Dados da wiki (contrato com o painel do autor)

O autor publica pelo painel dele; **este site só lê**. Mudança neste contrato se combina com o
autor antes. A configuração do Firebase no código é pública por natureza: quem protege os dados
são as regras do banco, que ficam com o autor. Por isso o site só consegue ler o que é público,
e cada jogador logado só recebe o que foi liberado pro e-mail dele.

## O que o site lê e grava

| Caminho | O que é | Quem lê/grava |
|---|---|---|
| `wikiIndex/lotus` | Índice de todas as páginas publicadas (base, ver abaixo) | qualquer um lê |
| `wikiIndex/lotus/shards/{n}` | Continuação do índice quando ele fica grande | qualquer um lê |
| `wikiPublic/{slug}` | Página completa (entrada, obra, temporada ou escrito) | qualquer um lê |
| `wikiRestrito/{wikiId}/itens/{itemId}` | Trechos liberados por pessoa (`permitidos: [e-mails]`) | jogador logado cujo e-mail está na lista |
| `wikiProfiles/{uid}` | Perfil do leitor: apelido, foto, favoritos, `seenAt`, `progress` (até onde viu cada obra), `username` e `usernameChangedAt` | o próprio leitor lê e grava (o username só pela função `claimUsername`, ver abaixo) |
| `wikiUsernames/{nome}` | `{ uid, at }` + o **cartão público** do membro (`nickname`, `photo`, `bio`, `since`, `showFavorites`, `favorites` só se mostrar, `ordem` e `ocultos`: ids das páginas dos personagens na ordem escolhida e os escondidos do perfil; nunca o e-mail), lido pela página `/@nome`. Um documento por @username tomado (único por conta). Escolher/trocar acontece só na função `claimUsername`, que cria o novo (com o cartão), apaga o antigo e grava no perfil numa transação só; troca no máximo a cada 30 dias (a regra em `functions/username.js`, no repo do autor). O cartão acompanha o perfil a cada gravação | qualquer um lê um nome (não lista); edita o cartão o próprio dono; criar/apagar o documento é só pela função; o autor modera o cartão |
| `wikiSuggestions/{id}` | Sugestões do leitor ao autor | o leitor cria e lê as próprias |

`lotus` é o nome interno do mundo Paradise Gate nos dados (histórico, não aparece pro leitor).
**Nenhuma outra coleção.** O site não cria coleções novas nem grava fora de perfil e sugestões.
Contas de jogador só nascem por convite do autor; o site não tem cadastro aberto.

**Entrar com @username:** o login do Firebase só aceita e-mail, e o e-mail de ninguém fica
legível no banco. Então, com username, o site chama a função `usernameSignIn` do autor (por
`fetch`, em `src/lib/auth.ts`): ela confere a senha no servidor e só então devolve o e-mail, e o
site entra pelo e-mail como sempre. 5 erros seguidos em 15 minutos travam aquele nome (o login
por e-mail continua).

**Esqueci minha senha:** o site chama a função `requestPasswordReset` do autor
(`sendPasswordReset` em `src/lib/auth.ts`), que manda a carta da Academia de
`conta@paradisegate.com.br` com o link pro `public/reset-senha.html` (ou pro `cadastro.html`, se
a pessoa foi convidada e nunca criou a senha). Ela responde "enviado" exista a conta ou não, e
limita os pedidos por e-mail e por endereço de rede.

**Escolher ou trocar o @username:** a regra toda (forma, nomes proibidos, prazo de 30 dias entre
trocas) mora só no servidor, em `functions/username.js` (repo do autor). O site nunca decide isso
sozinho:
- `checkUsername` (`src/lib/api.ts`, `checkUsername`): confere enquanto a pessoa digita, com ou
  sem login (também usada em `public/cadastro.html`, que não tem conta ainda);
- `claimUsername` (`src/lib/api.ts`, `claimUsername`): escolhe ou troca de verdade, numa
  transação no servidor. Devolve o nome como ficou, ou a frase de erro (nome em uso, prazo ainda
  preso, proibido…). O componente `UsernameDialog.tsx` só mostra o que ela responde.
As regras do Firestore recusam qualquer gravação de `username`/`usernameChangedAt` em
`wikiProfiles` ou qualquer criação/remoção em `wikiUsernames` que não venha da função (que usa o
Admin SDK, sem passar pelas regras).

## Índice em partes

Um documento do Firestore tem teto de 1 MiB, então o índice pode ter continuações:

```
wikiIndex/lotus                 { entries: { [wikiId]: IndexEntry }, shardCount?: number, ... }
wikiIndex/lotus/shards/{1..k}   { entries: { [wikiId]: IndexEntry } }
```

Como ler (já feito em `src/lib/wikiIndex.tsx`):
1. Ler `wikiIndex/lotus`.
2. Se `shardCount` for maior que 0, ler `shards/1` até `shards/{shardCount}` em paralelo.
3. Juntar todos os `entries`. Se um `wikiId` aparecer em duas partes, vale o `updatedAt` mais
   recente.

## `IndexEntry` (cada item de `entries`)

| Campo | Tipo | Uso |
|---|---|---|
| `title`, `type` | string | nome e tipo da página |
| `franchiseIds` | string[] | obras |
| `tags` | string[] | só as públicas |
| `grupos` | string[] | nomes dos grupos (relação em grupo) de que a página faz parte: só os com nome, públicos e que não são de família. Desde 2026-09-29: o pé da página mostra uma caixa de navegação recolhida por grupo e por tag pública, com as outras páginas do mesmo universo com o mesmo grupo ou tag (sem diferença de maiúscula ou acento), uma linha por tipo; só com mais de uma página (`src/lib/navbox.ts`) |
| `search` | string | texto corrido pra busca (sem spoilers) |
| `updatedAt` | `AAAA-MM-DD` | "atualizado em" e desempate de partes |
| `firstPublishedAt` | `AAAA-MM-DD` | fora dos sorteios do dia até o reset seguinte (00h de Brasília) |
| `cover`, `coverFocus` | URL/null, `{x,y}`/null | miniatura |
| `wordCount`, `linkCount`, `postsCount` | number | números da home (`postsCount` só em página publicada antes dos Escritos) |
| `membros` | string[] | usernames citados com `[@nome](membro:nome)` fora de spoiler |
| `interpretes` | `{ membro, em: [{ titulo, id, sessao? }], texto? }[]` | quem interpreta (campo Intérprete) e onde. `texto` (desde 2026-09-28): onde interpretou, escrito pelo autor em markdown da casa ("em [Temporada](wiki:<id>)", sessão com `wiki:<id>#sessao-<id>`); quando tem, o perfil mostra ele no lugar de `em`. `em`, o formato anterior: `titulo` "Campanha: Temporada", `id` a página da temporada (ou `null`), `sessao` `{ titulo, id }` quando foi só uma sessão (link `/wiki/<id>#sessao-<id da sessão>`). "Personagens que interpreta" no perfil `/@nome` vem daqui; página sem o campo (publicada antes de 2026-09-27) vale pela menção em `membros` |
| `birthdayMD` | `MM-DD`/null | aniversariante do dia |
| `arcana` | objeto/null | carta de tarô do Personagem do dia |
| `excerpt` | string | trecho curto da "Entrada do dia" |
| `posts` | `{id,title,date,excerpt}[]` | escritos no formato antigo (página publicada antes dos Escritos) |
| `escritos` | `{id,page,title,date,tipo,canone,origem,tags,autor,vis,excerpt?,at?,noDaily?}[]` | escritos ligados a esta página (ver "Escritos") |
| `events` | `{familyId,label,y,m,d,note,major}[]` | linha do tempo e "Ano em foco" |
| `citacoes` | lista | "Citação do dia" |

Temporadas aparecem no índice com `type: "Temporada"`. Cada sessão da temporada publicada tem `id` (âncora `#sessao-<id>` na página; as antigas, sem `id`, ficam em `#s<n>`). Os tipos da página completa
(`wikiPublic/{slug}`) estão em `src/types.ts`.

## Obras e Aparições (desde 2026-09-30)

No editor, campanha de RPG, livro, série, conto… são uma coisa só: a **obra**, com temporadas e,
dentro delas, capítulos (numa campanha, a sessão). Na wiki:

- **Página da obra** (`kind: "obra"`, no índice com `type: "Obra"`): `tipo` ("Campanha de RPG",
  "Romance"…), `status`, `system` (só campanha), `synopsis` (markdown da casa), `palavra`
  ("sessão" ou "capítulo"), `temporadas` (`{ name, id, status, synopsis, total }`, `id` = página da
  temporada ou `null` se não está no ar), `elenco` (`{ name, id, at? }`: quem só entra depois da
  primeira temporada vem com `at`) e `spoilerObras`.
- **Página da temporada** ganhou (páginas antigas não têm, e continuam como eram): `obra`
  (`{ name, id }`, `id` = página da obra ou `null`), `tipo`, `palavra` (sem ela, "sessão"), e em cada
  capítulo `escrito` (`{ titulo, id }`): o texto inteiro está no escrito `/wiki/_escritos/<id>`. Numa
  obra de texto, cada capítulo publica só o resumo (`recap`).
- **Aparições** na página da entrada (`aparicoes`, só quando há alguma), por obra › temporada, na
  ordem das obras: `{ obra, obraId, tipo, palavra, temporada?, temporadaId?, estreia?, total?, nota?, at? }`.
  Sem `temporada` = a obra toda (aparição à mão). `estreia` = `{ titulo, n, ancora? }`: `n` é o número
  do capítulo na página da temporada e `ancora` o `sessao-<id>` (só quando a temporada está no ar).
  O editor monta: automáticas pelos capítulos que a wiki mostra (e pelo elenco da temporada), mais
  as acrescentadas à mão, menos as escondidas. Aparição numa temporada depois da primeira vem com
  `at` (spoiler dessa temporada).

## Escritos

Contos, crônicas, narrações de sessão, causos de mesa, cartas, bastidores… Um escrito pode estar
ligado a várias páginas: vem no `escritos` do índice de cada uma, e o site junta pelo `id`
(`src/lib/escritos.ts`).

- **Tipo** (`tipo`): `conto`, `cronica`, `narracao`, `causo`, `documento`, `carta`, `poema`,
  `lenda`, `sonho`, `entrevista`, `bastidores`, `ese` ("E se…") ou vazio. O destaque da home
  se chama "<Tipo> do dia" (Conto do dia, Causo do dia…); bastidores, "e se" e sem tipo usam
  "Escrito do dia".
- **Marcas**: `canone` (`canonico`, `provavel`, `fora`), `origem` (`mundo`, `mesa`,
  `bastidores`) e `tags` livres de tom. `autor` é o @username de quem escreveu (vazio = o autor
  da wiki).
- **Página própria**: `wikiPublic/escrito-<id>`, com `kind: "escrito"` (tipo `WikiWritingDoc`),
  aberta em `/wiki/_escritos/<id>`. Só escrito público ou spoiler tem. Lista geral:
  `/wiki/_escritos` (filtros `?tipo=&canone=&origem=&tag=&pagina=`).
- **Na página do personagem**: `escritos` (cartões). O texto inteiro fica só na página própria
  do escrito; `posts` (texto inteiro) só existe em página publicada antes de 2026-09-27.
- **Restrito**: `kind: "escrito"` em `wikiRestrito`, na área `escritos` dos `restritoSlots`
  (página publicada antes de 2026-09-27: `kind: "post"`, área `posts`). O site aceita os dois.
- **Spoiler** vem no índice sem trecho e com `at`: a lista mostra fechado ("Escrito com spoiler"),
  e a home nunca sorteia um.

## Árvore genealógica (desde 2026-09-27)

Desenhada na notação de genealogia pela conta em `src/lib/familyLayout.js` (o mesmo arquivo no editor e na
wiki). Cada ligação de família publicada (pais, avós, irmãos, meio-irmãos, cônjuges, filhos,
netos) traz `fam`:

| Campo | Tipo | Uso |
|---|---|---|
| `k` | string | apelido da pessoa nesta árvore (`f1`, `f2`…; nunca o id interno) |
| `via` | string (avô, neto) ou string[] (irmão, meio-irmão) | de qual pai é o avô; quais pais o irmão divide com a pessoa (desde 2026-09-29: irmão adotivo de quem também tem pais biológicos pendura no casal certo); qual pai/mãe o meio-irmão divide; de qual filho é o neto |
| `with` | string | com quem o filho foi tido (o `k` do outro pai/mãe; conta pais adotivos e de criação); no padrasto/madrasta, com qual dos pais ele(a) é casado(a); no enteado, qual cônjuge é o pai/mãe dele |
| `wl`, `wid` | string | nome e página do outro pai/mãe, quando não é cônjuge desta página (a árvore o põe ao lado, com linha traço-ponto) |
| `bk` | number | ordem de nascimento (AAAAMMDD), só quando o ano aparece na página |

A página traz também `birthKey` (a mesma ordem, da própria pessoa). Desde 2026-09-29, o
parentesco em spoiler ou disfarce também ganha `fam` (calculado com todo mundo, com os mesmos
apelidos), e a árvore só o usa quando o leitor já pode ver: viu a temporada de `at` (ou "vi
tudo") ou abriu a tarja dele na ficha de Família. O parentesco público nunca aponta (`via`/`with`)
pra alguém em spoiler, nem pro pai/mãe cuja ligação está em spoiler na página do filho. Ponte pra
alguém que não está publicado não vai: a árvore desenha essa ligação pontilhada ("não dá pra
situar"). Página publicada antes de 2026-09-27 não traz `fam` e cai nesse desenho até ser
republicada.

Casamentos: `casado(a) com` (atual), `ex-cônjuge de` (desfeito: duas barrinhas // na linha do
casal) e `viúvo(a) de`/`cônjuge falecido(a) de` (viuvez: uma cruz † na linha do casal). Os
cônjuges ficam de um lado da pessoa e os irmãos do outro; os casamentos sem filhos mais perto, os
com filhos mais longe, cada um com a sua faixa embaixo das caixas, e onde duas linhas só se cruzam
a de cima ganha uma ponte. Três ou mais pais do mesmo filho (trisal) descem juntos por uma barra.

Tipos de pai/mãe e filho (do lado de quem guarda a ligação):

| Ligação | Na árvore |
|---|---|
| `é filho(a) de` / `é pai/mãe de` | linha cheia |
| `é filho(a) adotivo(a) de`, `é filho(a) de criação de` (e os inversos) | tracejado; com pais biológicos também, os dois casais aparecem lado a lado, cada um com os seus avós |
| `enteado(a) de` / `padrasto/madrasta de` | padrasto casado com o pai/mãe (`with`), sem linha até a pessoa; enteado desce do cônjuge que é pai/mãe dele |
| `sob a guarda de` / `responsável legal de` | tracejado, com o termo na caixa (guarda sem adoção) |
| `foi gestado(a) por` / `gestou` | linha dupla (gestação por substituição), com o termo; a gestante não vira casal de ninguém nem entra na árvore dos pais |
| `concebido(a) com doação de` / `doador(a) de` | linha dupla, com o termo |

A caixa pode trazer uma segunda linha pequena com o termo (padrasto, gestante, gêmea, parente
distante…); quem aparece na árvore e também numa ligação de "outros parentes" (cônjuge que também é
prima) aparece uma vez só, com esse termo na caixa. A árvore leva uma legenda ao lado com uma
amostra de cada traço que usa (`legend` na saída da conta). Outros parentes com `style: "family"`
que não cabem nas 5 gerações (primos, tios, bisavós, cunhados…, menos `alma-irmã de`) vão numa
faixa embaixo, com o `term` da ligação (ex.: "prima distante") e pontilhado: parentesco sem
caminho na árvore. Famílias de teste (comuns e diversas) em `src/lib/familyCenarios.js` do site.


Parente distante: ligação com `distant: true` (caixa "parente distante" no editor; vale pra avô/neto,
bisavô/bisneto, tio/sobrinho e primo). O `term` já vem pronto: "prima distante", "tio distante", e
nos avós/bisavós "ancestral distante" (do outro lado, "descendente distante"). Sempre vai pra faixa
de outros parentes, nunca pro lugar de avô/neto na árvore.

## Abas e relações em disfarce

- **Abas da página**: `variants[]` (cada uma com `label`) são abas que o autor nomeia. Quando há
  abas, `mainTab` é o nome da aba principal (ex. "Paradise Gate") e não existe "Geral"; sem
  `mainTab` (página antiga) a principal se chama "Geral". Sem abas próprias, "Geral" só aparece
  quando há Galeria, Citações ou Taxonomia, pra voltar à descrição. As pílulas ficam centradas
  acima da ficha; o seletor de retratos da ficha é separado das abas.
- **Disfarce** (`spoiler: "disfarce"`): o cartão mostra só a relação de fachada (`cover`, com o
  termo `coverTerm`, ex. "amiga"), sem tarja. A verdadeira aparece se o leitor já viu a
  temporada `at`, ou, em relação de família, depois que ele abre na ficha Família a tarja da linha
  dessa pessoa.

## Texto dentro da página (markdown da casa)

Lido por `src/lib/markdown.tsx`:

| Escrito | Aparece como |
|---|---|
| `**negrito**`, `*itálico*`, `~~riscado~~`, `` `código` `` | o de sempre |
| `## Título`, `### Subtítulo` | título; dentro de uma seção ou nota, entra no índice da página como subitem numerado (1.1, 1.1.1) e ganha âncora. `### Título {-}` fica fora do índice (a marca `{-}` não aparece) — desde 2026-09-29 |
| `> fala` + `> — quem disse` | citação (desde 2026-09-29): linhas `>` seguidas são um bloco só; a última começando com — (ou ― – --) vira a linha de quem disse, embaixo. Uma linha só, sem autor, sai como antes |
| `::principal <links>` / `::ver <links>` | linha sozinha: "Artigo principal: …" / "Ver também: …", discreta, no topo da parte (desde 2026-09-29) |
| `((texto da nota))` | nota de rodapé (desde 2026-09-29): vira [1] no texto e a nota vai pra lista "Notas" no fim da aba, numerada por aba, com link de volta. Pode ter link dentro (ex.: a sessão de onde veio). Dentro de um spoiler, fica na tarja também na lista. Fora de um texto de artigo (ficha, cartão) aparece ali mesmo, entre parênteses |
| `![legenda](https://…)` sozinha na linha | figura (desde 2026-09-29): imagem pequena à direita do texto (largura cheia no celular), legenda embaixo; clicar amplia. Sem legenda, ou no meio de uma frase, a imagem sai como antes |
| `::aba Nome` … `::fim-abas` | abas dentro de uma seção ou nota (desde 2026-09-29): cada `::aba` começa uma aba; `::fim-abas` fecha (sem ele, a última vai até o fim do texto). Título dentro de aba entra no índice, e o índice abre a aba certa |
| `\|\|trecho\|\|` | spoiler só naquele trecho: tarja lisa que revela no toque. Lido como markdown por dentro; escondido, o 1º toque só revela, nunca segue um link |
| `\|\|@{<id da temporada>} trecho\|\|` | spoiler por temporada: igual, mas abre sozinho pra quem marcou que já viu até essa temporada (obras e temporadas em `spoilerObras` da página). A marca `@{…}` nunca aparece |
| `[texto](https://…)` | link externo, em outra aba |
| `[texto](wiki:<wikiId>)` | link pra outra página da wiki, na mesma aba; `wiki:<wikiId>#<âncora>` vai direto a um ponto dela (ex.: `#sessao-<id>`) |
| `[@nome](membro:<nome>)` | link pro perfil público do membro (`/@nome`), na mesma aba |
| `[[Nome]]` / `[[Nome\|texto]]` | nome em negrito sem link (página não publicada) |

Campo curto da infobox com várias linhas (`\n`): uma por linha, com "•" na frente, sem itálico.
Campo inteiro marcado spoiler fica coberto por inteiro, sem marca no rótulo. A tarja de um
trecho tem o tamanho do texto, exceto no campo `Status`, onde é sempre do mesmo tamanho (vivo e
morto não se denunciam pelo comprimento). Na ficha Família gerada pelo editor, as linhas com
spoiler vêm depois das reveladas.
