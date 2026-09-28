# MaréBots — landing (marebots.com)

Site de marketing da **MaréBots**: um funcionário digital que organiza e-mails, pedidos e reservas — e cobra resposta no prazo — enquanto você cuida do cliente.

Stack: **Astro** (estático) + **Tailwind CSS v4** + **Cloudflare Pages Functions** (`/api/lead`).

## Desenvolvimento local

Requer Node **≥ 22.12**.

```bash
npm i
npm run dev
```

Build de produção:

```bash
npm run build
# saída em dist/
npm run preview
```

A function em `functions/api/lead.ts` só roda no Cloudflare Pages (ou `wrangler pages dev`). Em `astro preview` o POST `/api/lead` não existe — use o deploy CF ou `npx wrangler pages dev dist` com secrets locais.

## Cloudflare Pages

| Setting | Valor |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root | `/` (repo root) |
| Node version | `22` (Compatibility / env `NODE_VERSION=22`) |

Functions: pasta `functions/` na raiz do repo (Pages detecta automaticamente). Não precisa de `@astrojs/cloudflare` — o site é estático; a API é Pages Functions.

### Domínio

Custom domain: **marebots.com** (e `www` se quiser) no painel Pages → Custom domains.

### Secrets / variáveis de ambiente

Em **Settings → Environment variables** (Production; espelhe em Preview se quiser testar):

| Nome | Obrigatório | Descrição |
|---|---|---|
| `RESEND_API_KEY` | sim (prod) | API key Resend; From `MaréBots <contato@marebots.com>` |
| `LEAD_NOTIFY_TO` | não | Default `marebots.com@gmail.com` |
| `LEADS_WEBHOOK_URL` | não | URL do Apps Script que appenda na aba **Leads** |

Ver `.env.example` e `docs/leads-apps-script.md`.

**Não** coloque service account JSON nem chaves no git.

### Fluxo do lead

1. Formulário (`#contato`) faz `POST /api/lead` (JSON).
2. Function valida campos + consentimento LGPD.
3. E-mail interno via Resend + auto-reply curto em PT-BR para o lead.
4. Se `LEADS_WEBHOOK_URL` estiver setado, POST no Apps Script → append na Sheet CRM.

Sheet: `1yPmonk-Wg-iSvBfafTiiFRfZxhF8Cid3vbtXjuvZMW8` · aba `Leads`.

## Marca (resumo)

- Nome visível: **MaréBots** · URLs: marebots.com · contato@marebots.com · @marebots
- Sempre singular: **um funcionário digital** (nunca “equipe de bots” na landing)
- Cores: mangue `#1B5E4B` · mint `#6BCB4A` / `#8FDB6C` · sand `#F4F7F5` · ink `#1a2e28`
- Não é chatbot de WhatsApp; trabalha nos bastidores

## Estrutura

```
src/pages/index.astro     # landing PT-BR
src/components/LeadForm.astro
functions/api/lead.ts     # Pages Function
docs/leads-apps-script.md
public/logo-icon.png
public/logo.png
```

## Licença

Código privado da MaréBots / uso interno do founder. Repo pode ser público (marketing site source).
