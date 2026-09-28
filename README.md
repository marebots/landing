# MaréBots — landing (marebots.com)

Site de marketing da **MaréBots**: um funcionário digital que organiza e-mails, pedidos e reservas — e cobra resposta no prazo — enquanto você cuida do cliente.

Stack: **Astro** (estático) + **Tailwind CSS v4** + **Cloudflare Worker + Assets** (`/api/lead`).

> **2026:** Cloudflare unificou o produto. Não procure mais “Pages Functions” como produto separado — o caminho suportado é **Workers** com `assets` (HTML) + `main` (API). Ver `docs/cloudflare-workers.md`.

## Desenvolvimento local

Requer Node **≥ 22** (ideal). Na máquina de build do bot pode rodar 20 com aviso.

```bash
npm i
npm run dev          # só o Astro (form /api/lead NÃO existe aqui)
npm run build
npm run cf:dev       # Astro build + Worker local (form funciona)
```

## Deploy (Cloudflare Workers)

```bash
npx wrangler login   # uma vez, no browser
npm run cf:deploy    # build + wrangler deploy
```

No dashboard: **Workers & Pages** → worker `marebots-landing` (não “só upload estático”).

| Setting | Valor |
|---|---|
| Config | `wrangler.jsonc` |
| Assets | `./dist` |
| Worker entry | `./worker/index.ts` |
| Secrets | `RESEND_API_KEY` (prod), opcional `LEAD_NOTIFY_TO`, `LEADS_WEBHOOK_URL` |

```bash
npx wrangler secret put RESEND_API_KEY
```

### Domínio marebots.com

- Se o DNS do domínio estiver **na Cloudflare** (nameservers CF): Custom Domain no Worker.
- Se o DNS **não** estiver na Cloudflare: Workers **não** aceita custom domain externo como o Pages antigo. Opções: (1) migrar zona DNS para Cloudflare, ou (2) CNAME/`workers.dev` enquanto tanto, ou (3) proxy.

### Fluxo do lead

1. Formulário → `POST /api/lead`
2. Worker valida + Resend (notify + auto-reply) se houver `RESEND_API_KEY`
3. Opcional: `LEADS_WEBHOOK_URL` → Apps Script → Sheet CRM (`docs/leads-apps-script.md`)

Sem secret Resend, o lead ainda retorna `ok: true` (útil para testar a API), mas **não** manda e-mail.

## Marca

- **MaréBots** · marebots.com · contato@marebots.com · @marebots
- Singular: **um funcionário digital**
- Capitalização: minúsculo no meio da frase (`funcionário digital`); maiúsculo só no início (`Funcionário digital…`). Nunca “Funcionário Digital” em title case.
- Cores (ColorHunt): `#FED24F` · `#FFF449` · `#B2D959` · `#7EC151` (+ ink `#1F2A14` / sand `#FFFCEB`)
- Logo: bot mark (`public/logo-bot.svg`) — mais memorável que o monograma M
