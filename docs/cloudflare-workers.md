# Deploy MaréBots landing — Cloudflare Workers (2026)

## Por que o form falhava

O HTML estático sozinho **não** inclui `/api/lead`.  
A pasta antiga `functions/` era de **Pages Functions**; no modelo novo isso **não sobe sozinho**. O browser recebia 404/HTML e o form mostrava erro.

## O que usar agora

1. Abra o dashboard Cloudflare → **Workers & Pages** (ou só **Workers**).
2. Conecte o repo `marebots/landing` via **Workers Builds**, **ou** faça deploy com CLI:

```bash
cd marebots-landing
npx wrangler login
npm run cf:deploy
```

3. Secrets (Production):

```bash
npx wrangler secret put RESEND_API_KEY
# opcional:
npx wrangler secret put LEAD_NOTIFY_TO
npx wrangler secret put LEADS_WEBHOOK_URL
```

4. Teste: `https://marebots-landing.<seu-subdominio>.workers.dev` → formulário → deve responder sucesso (mesmo sem Resend).
5. Domínio: Custom Domains no Worker **só se** `marebots.com` usar nameservers Cloudflare.

## Checklist rápido

- [ ] `wrangler deploy` OK  
- [ ] `POST /api/lead` devolve JSON `{ ok: true }`  
- [ ] `RESEND_API_KEY` em secrets  
- [ ] Apps Script + `LEADS_WEBHOOK_URL` (Sheet)  
- [ ] Custom domain / DNS  

## Não faça

- Upload só da pasta `dist` sem Worker  
- Procurar menu “Pages Functions” como produto aparte  
- Esperar que `astro preview` sirva `/api/lead`
