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
| `wikiPublic/{slug}` | Página completa (entrada, temporada ou escrito) | qualquer um lê |
| `wikiRestrito/{wikiId}/itens/{itemId}` | Trechos liberados por pessoa (`permitidos: [e-mails]`) | jogador logado cujo e-mail está na lista |
| `wikiProfiles/{uid}` | Perfil do leitor: apelido, foto, favoritos, `seenAt`, `progress` (até onde viu cada obra), `username` e `usernameChangedAt` | o próprio leitor lê e grava (o username só pela função `claimUsername`, ver abaixo) |
| `wikiUsernames/{nome}` | `{ uid, at }` + o **cartão público** do membro (`nickname`, `photo`, `bio`, `since`, `showFavorites`, `favorites` só se mostrar; nunca o e-mail), lido pela página `/@nome`. Um documento por @username tomado (único por conta). Escolher/trocar acontece só na função `claimUsername`, que cria o novo (com o cartão), apaga o antigo e grava no perfil numa transação só; troca no máximo a cada 30 dias (a regra em `functions/username.js`, no repo do autor). O cartão acompanha o perfil a cada gravação | qualquer um lê um nome (não lista); edita o cartão o próprio dono; criar/apagar o documento é só pela função; o autor modera o cartão |
| `wikiSuggestions/{id}` | Sugestões do leitor ao autor | o leitor cria e lê as próprias |

`lotus` é o nome interno do mundo Paradise Gate nos dados (histórico, não aparece pro leitor).
**Nenhuma outra coleção.** O site não cria coleções novas nem grava fora de perfil e sugestões.
Contas de jogador só nascem por convite do autor; o site não tem cadastro aberto.

**Entrar com @username:** o login do Firebase só aceita e-mail, e o e-mail de ninguém fica
legível no banco. Então, com username, o site chama a função `usernameSignIn` do autor (por
`fetch`, em `src/lib/auth.ts`): ela confere a senha no servidor e só então devolve o e-mail, e o
site entra pelo e-mail como sempre. 5 erros seguidos em 15 minutos travam aquele nome (o login
por e-mail continua).

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
| `search` | string | texto corrido pra busca (sem spoilers) |
| `updatedAt` | `AAAA-MM-DD` | "atualizado em" e desempate de partes |
| `firstPublishedAt` | `AAAA-MM-DD` | fora dos sorteios do dia até o reset seguinte (00h de Brasília) |
| `cover`, `coverFocus` | URL/null, `{x,y}`/null | miniatura |
| `wordCount`, `linkCount`, `postsCount` | number | números da home |
| `membros` | string[] | usernames citados com `[@nome](membro:nome)` fora de spoiler ("Personagens que interpreta" no perfil `/@nome`) |
| `birthdayMD` | `MM-DD`/null | aniversariante do dia |
| `arcana` | objeto/null | carta de tarô do Personagem do dia |
| `excerpt` | string | trecho curto da "Entrada do dia" |
| `posts` | `{id,title,date,excerpt}[]` | escritos no formato antigo (página publicada antes dos Escritos) |
| `escritos` | `{id,page,title,date,tipo,canone,origem,tags,autor,vis,excerpt?,at?,noDaily?}[]` | escritos ligados a esta página (ver "Escritos") |
| `events` | `{familyId,label,y,m,d,note,major}[]` | linha do tempo e "Ano em foco" |
| `citacoes` | lista | "Citação do dia" |

Temporadas aparecem no índice com `type: "Temporada"`. Os tipos da página completa
(`wikiPublic/{slug}`) estão em `src/types.ts`.

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
- **Na página do personagem**: `escritos` (cartões, na mesma ordem de `posts`, que ainda traz o
  texto inteiro). Restrito continua como `post` em `wikiRestrito`, na área `posts`.
- **Spoiler** vem no índice sem trecho e com `at`: a lista mostra fechado ("Escrito com spoiler"),
  e a home nunca sorteia um.

## Texto dentro da página (markdown da casa)

Lido por `src/lib/markdown.tsx`:

| Escrito | Aparece como |
|---|---|
| `**negrito**`, `*itálico*`, `~~riscado~~`, `` `código` `` | o de sempre |
| `\|\|trecho\|\|` | spoiler só naquele trecho: tarja lisa que revela no toque. Lido como markdown por dentro; escondido, o 1º toque só revela, nunca segue um link |
| `\|\|@{<id da temporada>} trecho\|\|` | spoiler por temporada: igual, mas abre sozinho pra quem marcou que já viu até essa temporada (obras e temporadas em `spoilerObras` da página). A marca `@{…}` nunca aparece |
| `[texto](https://…)` | link externo, em outra aba |
| `[texto](wiki:<wikiId>)` | link pra outra página da wiki, na mesma aba |
| `[@nome](membro:<nome>)` | link pro perfil público do membro (`/@nome`), na mesma aba |
| `[[Nome]]` / `[[Nome\|texto]]` | nome em negrito sem link (página não publicada) |

Campo curto da infobox com várias linhas (`\n`): uma por linha, com "•" na frente, sem itálico.
Campo inteiro marcado spoiler fica coberto por inteiro, sem marca no rótulo.
