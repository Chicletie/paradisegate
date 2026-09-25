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
| `wikiPublic/{slug}` | Página completa (entrada ou temporada) | qualquer um lê |
| `wikiRestrito/{wikiId}/itens/{itemId}` | Trechos liberados por pessoa (`permitidos: [e-mails]`) | jogador logado cujo e-mail está na lista |
| `wikiProfiles/{uid}` | Perfil do leitor: apelido, foto, favoritos, `seenAt`, `progress` (até onde viu cada obra), `username` e `usernameChangedAt` | o próprio leitor lê e grava |
| `wikiUsernames/{nome}` | `{ uid, at }`: um documento por @username tomado (único por conta). Escolher/trocar = criar o novo, apagar o antigo e gravar no perfil numa gravação só; troca no máximo a cada 30 dias (a regra confere) | qualquer um confere um nome; só o dono cria/apaga o dele |
| `wikiSuggestions/{id}` | Sugestões do leitor ao autor | o leitor cria e lê as próprias |

`lotus` é o nome interno do mundo Paradise Gate nos dados (histórico, não aparece pro leitor).
**Nenhuma outra coleção.** O site não cria coleções novas nem grava fora de perfil e sugestões.
Contas de jogador só nascem por convite do autor; o site não tem cadastro aberto.

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
| `birthdayMD` | `MM-DD`/null | aniversariante do dia |
| `arcana` | objeto/null | carta de tarô do Personagem do dia |
| `excerpt` | string | trecho curto da "Entrada do dia" |
| `posts` | `{id,title,date,excerpt}[]` | notas públicas |
| `events` | `{familyId,label,y,m,d,note,major}[]` | linha do tempo e "Ano em foco" |
| `citacoes` | lista | "Citação do dia" |

Temporadas aparecem no índice com `type: "Temporada"`. Os tipos da página completa
(`wikiPublic/{slug}`) estão em `src/types.ts`.

## Texto dentro da página (markdown da casa)

Lido por `src/lib/markdown.tsx`:

| Escrito | Aparece como |
|---|---|
| `**negrito**`, `*itálico*`, `~~riscado~~`, `` `código` `` | o de sempre |
| `\|\|trecho\|\|` | spoiler só naquele trecho: tarja lisa que revela no toque. Lido como markdown por dentro; escondido, o 1º toque só revela, nunca segue um link |
| `\|\|@{<id da temporada>} trecho\|\|` | spoiler por temporada: igual, mas abre sozinho pra quem marcou que já viu até essa temporada (obras e temporadas em `spoilerObras` da página). A marca `@{…}` nunca aparece |
| `[texto](https://…)` | link externo, em outra aba |
| `[texto](wiki:<wikiId>)` | link pra outra página da wiki, na mesma aba |
| `[[Nome]]` / `[[Nome\|texto]]` | nome em negrito sem link (página não publicada) |

Campo curto da infobox com várias linhas (`\n`): uma por linha, com "•" na frente, sem itálico.
Campo inteiro marcado spoiler fica coberto por inteiro, sem marca no rótulo.
