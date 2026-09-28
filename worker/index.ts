import { handleLead, type LeadEnv } from './lead';

export interface Env extends LeadEnv {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/lead' || url.pathname === '/api/lead/') {
      return handleLead(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
