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

Vale igual pro autor e pra colaboradora — os dois têm o mesmo privilégio no repositório.

1. Atualize o `main` (`git pull`) e crie um ramo a partir dele (`site/<assunto>`, ex.
   `site/home-da-marca`). Um assunto por ramo.
2. Commits semânticos em português: `feat:`, `fix:`, `docs:`, `refactor:`, `test:` ou `chore:`
   e o que mudou (ex. `fix: menu do celular fecha ao tocar fora`).
3. Antes de abrir o PR, traga o `main` mais recente pro ramo (`git pull origin main`), resolva
   conflitos e rode os testes de novo. Confira o checklist de segurança do `CLAUDE.md`.
4. Abra um PR com um resumo em português simples e **capturas** (computador e celular, claro e
   escuro) de tudo que muda na tela. O CI roda build, tipos, lint e testes em todo PR e precisa
   passar.
5. A outra pessoa revisa e mescla. Nada entra direto no `main`. Ao entrar no `main`, o site é
   publicado sozinho pelo GitHub Actions (e de novo a cada 3 horas, pra pegar o que foi
   publicado na wiki).

## O que é livre e o que se combina antes

**Livre:** páginas e componentes novos do site, rotas novas fora de `/wiki`, a home em `/`
(hoje ela só redireciona pra `/wiki`), links novos no cabeçalho, textos e imagens que o autor
fornecer.

**Combine antes com a outra pessoa (converse, e o PR dela revisa com atenção redobrada):**
- qualquer mudança na wiki: `src/pages/`, os componentes da página de entrada, `src/lib/`,
  `src/styles/wiki.css`. Os testes da wiki existem pra ela nunca mudar sem querer;
- mudança nos tokens (`src/styles/tokens.css`), no cabeçalho ou no rodapé;
- dependência nova, analytics ou qualquer script de terceiros;
- qualquer coisa que precise de servidor ou banco. O site lê os dados da wiki do Firestore do
  autor, **só leitura** (`docs/dados-da-wiki.md`), e nada novo vai pra lá. Fichas, loja e
  catálogo do jogo ficam no backend do jogo (API no Render); o login é o mesmo Firebase Auth
  da wiki;
- mudança nos provedores de login ou nas regras do Firebase (ficam no console do autor);
- o domínio, o GitHub Pages e os workflows de deploy.

## Nunca

- Commitar senha, chave, token ou arquivo `.env` com segredo.
- Commitar direto no `main`, ou mesclar sem trazer o `main` mais recente pro ramo antes.
- Inventar lore, personagens, nomes ou termos do mundo. Conteúdo vem da wiki publicada ou do
  autor.
- Gerar ou desenhar arte de personagem ou o selo da marca.
- Publicar o site em outro endereço que não o do repositório.
