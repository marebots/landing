/**
 * Cloudflare Pages Function: POST /api/lead
 *
 * Secrets / env (CF Pages → Settings → Environment variables):
 *   RESEND_API_KEY     — required in production (notify + auto-reply)
 *   LEAD_NOTIFY_TO     — optional, default marebots.com@gmail.com
 *   LEADS_WEBHOOK_URL  — optional Apps Script web app URL (append to Sheet)
 *
 * Do NOT put Google service-account keys in the repo.
 */

type LeadBody = {
  nome?: string;
  empresa?: string;
  cidade?: string;
  email?: string;
  whatsapp?: string;
  dor?: string;
  fonte?: string;
  consent?: boolean;
};

type Env = {
  RESEND_API_KEY?: string;
  LEAD_NOTIFY_TO?: string;
  LEADS_WEBHOOK_URL?: string;
};

const FROM = 'MaréBots <contato@marebots.com>';
const DEFAULT_TO = 'marebots.com@gmail.com';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function clean(v: unknown, max = 2000): string {
  return String(v ?? '')
    .trim()
    .slice(0, max);
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { Allow: 'POST, OPTIONS' } });
  }
  if (request.method !== 'POST') {
    return json({ ok: false, error: 'Use POST.' }, 405);
  }

  let body: LeadBody;
  try {
    body = (await request.json()) as LeadBody;
  } catch {
    return json({ ok: false, error: 'JSON inválido.' }, 400);
  }

  const nome = clean(body.nome, 120);
  const empresa = clean(body.empresa, 160);
  const cidade = clean(body.cidade, 120);
  const email = clean(body.email, 160).toLowerCase();
  const whatsapp = clean(body.whatsapp, 40);
  const dor = clean(body.dor, 4000);
  const fonte = clean(body.fonte, 40) || 'landing';
  const consent = Boolean(body.consent);

  if (!nome || !empresa || !email || !dor) {
    return json(
      { ok: false, error: 'Preencha nome, empresa, e-mail e o que trava hoje.' },
      400,
    );
  }
  if (!isEmail(email)) {
    return json({ ok: false, error: 'E-mail inválido.' }, 400);
  }
  if (!consent) {
    return json({ ok: false, error: 'É necessário o consentimento LGPD.' }, 400);
  }

  const notifyTo = clean(env.LEAD_NOTIFY_TO, 160) || DEFAULT_TO;
  const nowIso = new Date().toISOString();

  if (env.RESEND_API_KEY) {
    const subject = `[Lead MaréBots] ${empresa} — ${nome}`;
    const text = [
      'Novo lead do site marebots.com',
      '',
      `Nome: ${nome}`,
      `Empresa: ${empresa}`,
      `Cidade/UF: ${cidade || '—'}`,
      `E-mail: ${email}`,
      `WhatsApp: ${whatsapp || '—'}`,
      `Fonte: ${fonte}`,
      `Consentimento LGPD: sim`,
      `Quando (UTC): ${nowIso}`,
      '',
      'O que trava hoje:',
      dor,
    ].join('\n');

    const notifyRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [notifyTo],
        reply_to: email,
        subject,
        text,
      }),
    });

    if (!notifyRes.ok) {
      const errText = await notifyRes.text().catch(() => '');
      console.error('Resend notify failed', notifyRes.status, errText);
      return json(
        {
          ok: false,
          error:
            'Não foi possível enviar agora. Tente de novo ou escreva para contato@marebots.com.',
        },
        502,
      );
    }

    const autoText = [
      `Oi, ${nome}!`,
      '',
      'Recebemos seu contato. Em breve alguém da MaréBots responde neste e-mail (horário comercial, Brasília).',
      '',
      'Enquanto isso, se preferir, pode escrever direto para contato@marebots.com.',
      '',
      'Abraço,',
      'MaréBots',
      'marebots.com',
    ].join('\n');

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,
          to: [email],
          subject: 'Recebemos sua mensagem — MaréBots',
          text: autoText,
        }),
      });
    } catch (e) {
      console.error('Resend auto-reply error', e);
    }
  } else {
    console.warn('RESEND_API_KEY missing — lead validated but e-mail not sent');
  }

  if (env.LEADS_WEBHOOK_URL) {
    try {
      const wh = await fetch(env.LEADS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          empresa,
          cidade,
          email,
          whatsapp,
          dor,
          fonte,
          status: 'Novo',
          consent: true,
          criado_em: nowIso,
        }),
      });
      if (!wh.ok) {
        console.error(
          'LEADS_WEBHOOK_URL failed',
          wh.status,
          await wh.text().catch(() => ''),
        );
      }
    } catch (e) {
      console.error('LEADS_WEBHOOK_URL error', e);
    }
  }

  return json({ ok: true });
};
