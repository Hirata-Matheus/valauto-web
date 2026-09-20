# ValAuto

Plataforma de avaliação e comparação de veículos. Cada veículo recebe notas por
categoria (Desempenho, Conforto, Segurança, Economia, Tecnologia) calculadas a
partir das opiniões dos usuários, além de uma média geral.

Este repositório é o monorepo do projeto: começa pela web (Next.js) e está
organizado para que um app mobile (React Native/Expo) reaproveite tipos, regras
de negócio e client de API sem duplicar lógica.

**Estado atual: Fase 1 concluída.** Catálogo com filtros, página de detalhe,
schema do banco e fluxo de cadastro/verificação de e-mail. O comparador é a
Fase 2 — as funções puras de ranking e recomendação já estão em
`packages/shared` (com testes), mas ainda não há tela.

## Começando

```bash
npm install
cp .env.example .env.local     # opcional na primeira rodada — ver abaixo
npm run dev
```

A aplicação sobe em <http://localhost:3000>.

### Rodando sem Supabase

Sem `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` definidos, a
camada de dados cai automaticamente para um **repositório em memória** com 16
carros e avaliações geradas de forma determinística
(`apps/web/src/lib/data/seed.ts`). Catálogo, filtros, ordenação e detalhe
funcionam de imediato.

O que **não** funciona nesse modo: cadastro, login, verificação de e-mail e
publicação de opinião — tudo isso depende do Supabase Auth. A UI avisa em vez de
quebrar.

### Ligando o Supabase

1. Crie um projeto em <https://supabase.com>.
2. No SQL Editor, rode nesta ordem:
   - `supabase/migrations/0001_init.sql` — tabelas, triggers e políticas de RLS;
   - `supabase/seed.sql` — tipos de veículo, categorias, montadoras e catálogo.
3. Crie o `.env.local` **na raiz do repositório** (o `next.config.mjs` do
   `apps/web` o carrega de lá, para que o futuro app mobile compartilhe o mesmo
   arquivo):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<sb_publishable_...>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   A *anon key* JWT legada também funciona, em `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   Reinicie o servidor depois de editar: o Next embute as variáveis
   `NEXT_PUBLIC_*` na hora de compilar.

4. Em **Authentication → URL Configuration**, adicione
   `http://localhost:3000/auth/callback` às *Redirect URLs*.
5. Em **Authentication → Providers → Email**, mantenha *Confirm email* ativado —
   é ele que sustenta a regra de publicação.
6. (Recomendado) Rode `supabase/tests/smoke_reviews.sql` no SQL Editor. Ele valida
   os triggers de agregação (inserir, editar, denunciar, apagar) e não deixa
   nada gravado: termina com uma exceção proposital que desfaz tudo — a mensagem
   `SMOKE TEST PASSED` significa sucesso.

7. (Opcional) Para popular o catálogo com avaliações de demonstração, rode
   `supabase/seed_demo_reviews.sql`. Cria 30 usuários fictícios (e-mails
   `@demo.valauto.invalid`, sem senha) e 75 avaliações. **São dados fictícios:**
   não os deixe num site público como se fossem opiniões de clientes reais.
   `supabase/cleanup_demo_reviews.sql` remove tudo de uma vez.

Se o app subir mostrando dados de exemplo mesmo com as variáveis definidas, o log
do servidor traz o aviso `[valauto] Supabase não configurado` — é o fallback em
memória entrando em ação.

**Verificado contra um projeto Supabase real:** catálogo (todos os filtros,
ordenações e paginação), detalhe, categorias, montadoras, geração estática das
páginas de veículo e bloqueio de escrita anônima pela RLS. **Ainda não
verificado de ponta a ponta:** cadastro → e-mail → publicar/editar review, e a
ordenação por nota com reviews reais (o banco recém-semeado não tem nenhuma).

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o app web em modo desenvolvimento |
| `npm run build` | Build de produção de todos os pacotes |
| `npm run typecheck` | `tsc --noEmit` em todos os workspaces |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (regras de média, ranking e filtros) |

## Estrutura

```
apps/
  web/                 Next.js 15 (App Router), Tailwind, GSAP
packages/
  shared/              tipos, schemas Zod, cálculo de médias/ranking, client de API
  ui/                  design tokens + preset do Tailwind
supabase/
  migrations/          schema, triggers de agregação e RLS
  seed.sql             dados iniciais
```

`apps/mobile` entra na Fase 5 e consumirá `packages/shared` e o mesmo preset de
tokens via NativeWind.

## Decisões de arquitetura

### Tipos de veículo e categorias são dados, não enums

`vehicle_types` e `rating_categories` são tabelas. Adicionar motos, caminhões ou
uma categoria "Capacidade off-road" é um `INSERT`, não uma migração com
`ALTER TYPE`. As specs técnicas ficam em `jsonb` porque variam por tipo, e
`specFieldsForType()` decide o que renderizar — a tela de detalhe não muda.

### A média geral é a média das médias por categoria

Não é a média crua de todas as notas. Se uma categoria recebeu 20 notas e outra
recebeu 2, a média crua deixaria a primeira dominar o resultado. A regra está em
`summarizeVehicleReviews()` (`packages/shared/src/rating.ts`) e é replicada em
SQL por `recompute_vehicle_summary()`, mantida por trigger — o catálogo precisa
ordenar e filtrar por nota no banco, o que exige a coluna materializada.

Categoria sem nenhuma nota vale `null`, nunca zero: "ainda não avaliado" é
diferente de "avaliado com nota mínima".

### Duas camadas de repositório: pública e de sessão

`getPublicRepository()` usa um client Supabase **sem cookies** e serve tudo que é
leitura pública (catálogo, detalhe, notas, opiniões publicadas). Ler `cookies()`
torna a página dinâmica e quebra `generateStaticParams` — o build falha com
*"cookies was called outside a request scope"* —, então o ISR depende dessa
separação. É seguro porque a RLS já garante que anônimo só enxerga o que é
público.

`getSessionRepository()` usa o client com cookies e só é chamado em Route
Handlers (publicar, editar, denunciar, "minha opinião"), que são sempre
dinâmicos.

### Ordenar pelo relacionado: `order('summary(overall_average)')`

Para ordenar veículos pela nota (tabela relacionada), o supabase-js precisa da
sintaxe `relacao(coluna)`. A opção `referencedTable` parece equivalente mas só
ordena as linhas *embutidas* e deixa os veículos na ordem original — a
ordenação "Melhor avaliados" ficaria arbitrária sem nenhum erro visível.

### Autenticação em ilhas client

O header e o bloco de publicar opinião leem a sessão no browser
(`lib/use-session.ts`), não no servidor. Ler cookie em Server Component tornaria
**dinâmica** toda rota que usa o layout, e o catálogo e a página de detalhe
perderiam o ISR que sustenta o SEO. Com essa separação, `/veiculos/[slug]` é
gerada estaticamente (revalidação de 10 min) e o conteúdo indexável chega pronto
ao crawler; só o estado de login hidrata depois.

O trade-off é um esqueleto de meio segundo no canto do header. A alternativa
futura é PPR (Partial Prerendering), que dispensa a separação.

### Três camadas na regra "só publica quem verificou o e-mail"

1. UI: mostra CTA de confirmação em vez do formulário;
2. rota de API: 403 se `email_verified_at` for nulo;
3. RLS no Postgres: a policy de `INSERT` em `reviews` exige
   `has_verified_email()`.

A terceira é a que vale — mesmo que alguém fale direto com a API do Supabase, o
banco recusa.

### Filtros vivem na URL

`parseVehicleFilters` / `serializeVehicleFilters` são a fronteira. A mesma função
lê os `searchParams` do servidor e o `useSearchParams` do client, então voltar no
navegador, recarregar ou compartilhar o link preserva o estado. Valores default
não são serializados, o que mantém a URL limpa.

## Testes

```bash
npm run test
```

34 testes cobrindo o que quebra silenciosamente: arredondamento de meia estrela,
média das médias, agregado que ignora reviews não publicadas, ordenação com
veículos sem nota, round-trip dos filtros pela URL e paginação fora do intervalo.

Playwright (E2E de filtros, comparador e publicação de review) entra junto com a
Fase 2.

## Roadmap

1. ~~MVP web — catálogo, filtros, detalhe, avaliação com conta verificada~~ ✅
2. Comparador de até 3 veículos com destaque por categoria e recomendação
3. Admin e sugestões — CRUD, moderação de reviews e sugestões
4. Expansão de tipos — motos, caminhões, novas specs e categorias
5. App mobile React Native reaproveitando o monorepo
