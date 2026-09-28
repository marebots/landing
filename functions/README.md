# Deprecated — use `worker/` instead

Cloudflare moved static sites + APIs to **Workers + Assets**.  
Lead API lives in `worker/lead.ts` and is routed by `worker/index.ts`.

Deploy with: `npm run cf:deploy` (requires `wrangler login`).
