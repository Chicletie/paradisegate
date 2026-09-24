# Como contribuir

Bem-vinda! Este é o site de **Paradise Gate**. A wiki (`/wiki`) já está pronta; o resto do site
é seu pra construir. Leia antes: `PRODUCT.md` (a marca e o público), `DESIGN.md` (o sistema
visual, com uma parte só pra páginas fora da wiki) e `CLAUDE.md` (as regras, que valem pra
gente e pro Claude).

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes (Vitest)
npm run typecheck  # checagem de tipos
npm run lint       # oxlint
npm run build      # produção, em dist/
```

## Fluxo

1. Crie um ramo a partir do `main` (`site/<assunto>`, ex. `site/home-da-marca`).
2. Commits em português, dizendo o que mudou.
3. Abra um PR com um resumo em português simples e **capturas** (computador e celular, claro e
   escuro) de tudo que muda na tela. O CI roda build, tipos, lint e testes em todo PR e precisa
   passar.
4. O autor revisa e mescla. Ao entrar no `main`, o site é publicado sozinho pelo GitHub Actions
   (e de novo a cada 3 horas, pra pegar o que ele publicou na wiki).

As mudanças do próprio autor podem entrar direto no `main`, com os testes rodados antes; o
histórico de commits mostra o que mudou e por quê.

## O que é livre e o que se combina antes

**Livre:** páginas e componentes novos do site, rotas novas fora de `/wiki`, a home em `/`
(hoje ela só redireciona pra `/wiki`), links novos no cabeçalho, textos e imagens que o autor
fornecer.

**Combine com o autor antes (PR com ele como revisor):**
- qualquer mudança na wiki: `src/pages/`, os componentes da página de entrada, `src/lib/`,
  `src/styles/wiki.css`. Os testes da wiki existem pra ela nunca mudar sem querer;
- mudança nos tokens (`src/styles/tokens.css`), no cabeçalho ou no rodapé;
- dependência nova, analytics ou qualquer script de terceiros;
- qualquer coisa que precise de servidor ou banco. O site lê os dados da wiki do Firestore do
  autor, **só leitura** (`docs/dados-da-wiki.md`), e nada novo vai pra lá. Loja, cadastro de
  fãs, newsletter e afins vão num serviço pronto ou num projeto Firebase separado, da marca;
- o domínio, o GitHub Pages e os workflows de deploy.

## Nunca

- Commitar senha, chave, token ou arquivo `.env` com segredo.
- Inventar lore, personagens, nomes ou termos do mundo. Conteúdo vem da wiki publicada ou do
  autor.
- Gerar ou desenhar arte de personagem ou o selo da marca.
- Publicar o site em outro endereço que não o do repositório.
