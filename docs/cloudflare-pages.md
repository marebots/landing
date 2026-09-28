# Deploy Cloudflare Pages — checklist

1. Conecte o repo `marebots/landing` no [Cloudflare Pages](https://dash.cloudflare.com/).
2. Build: `npm run build` · Output: `dist` · Node 22.
3. Secrets: `RESEND_API_KEY`, opcional `LEAD_NOTIFY_TO`, `LEADS_WEBHOOK_URL`.
4. Domínio: `marebots.com` (DNS no mesmo account ou CNAME para `*.pages.dev`).
5. Resend: domínio `marebots.com` verificado; From `contato@marebots.com`.
6. Apps Script: siga `leads-apps-script.md` e cole a URL em `LEADS_WEBHOOK_URL`.
7. Teste o formulário em produção; confira e-mail + linha na Sheet.

`wrangler.toml` é opcional — o painel + pasta `functions/` bastam.
