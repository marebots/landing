var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/lead.ts
var FROM = "Mar\xE9Bots <contato@marebots.com>";
var DEFAULT_TO = "marebots.com@gmail.com";
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept"
    }
  });
}
__name(json, "json");
function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
__name(isEmail, "isEmail");
function clean(v, max = 2e3) {
  return String(v ?? "").trim().slice(0, max);
}
__name(clean, "clean");
async function handleLead(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        Allow: "POST, OPTIONS",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept"
      }
    });
  }
  if (request.method !== "POST") {
    return json({ ok: false, error: "Use POST." }, 405);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "JSON inv\xE1lido." }, 400);
  }
  const nome = clean(body.nome, 120);
  const empresa = clean(body.empresa, 160);
  const cidade = clean(body.cidade, 120);
  const email = clean(body.email, 160).toLowerCase();
  const whatsapp = clean(body.whatsapp, 40);
  const dor = clean(body.dor, 4e3);
  const fonte = clean(body.fonte, 40) || "landing";
  const consent = Boolean(body.consent);
  if (!nome || !empresa || !email || !dor) {
    return json(
      { ok: false, error: "Preencha nome, empresa, e-mail e o que trava hoje." },
      400
    );
  }
  if (!isEmail(email)) {
    return json({ ok: false, error: "E-mail inv\xE1lido." }, 400);
  }
  if (!consent) {
    return json({ ok: false, error: "\xC9 necess\xE1rio o consentimento LGPD." }, 400);
  }
  const notifyTo = clean(env.LEAD_NOTIFY_TO, 160) || DEFAULT_TO;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  if (env.RESEND_API_KEY) {
    const subject = `[Lead Mar\xE9Bots] ${empresa} \u2014 ${nome}`;
    const text = [
      "Novo lead do site marebots.com",
      "",
      `Nome: ${nome}`,
      `Empresa: ${empresa}`,
      `Cidade/UF: ${cidade || "\u2014"}`,
      `E-mail: ${email}`,
      `WhatsApp: ${whatsapp || "\u2014"}`,
      `Fonte: ${fonte}`,
      `Consentimento LGPD: sim`,
      `Quando (UTC): ${nowIso}`,
      "",
      "O que trava hoje:",
      dor
    ].join("\n");
    const notifyRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: FROM,
        to: [notifyTo],
        reply_to: email,
        subject,
        text
      })
    });
    if (!notifyRes.ok) {
      const errText = await notifyRes.text().catch(() => "");
      console.error("Resend notify failed", notifyRes.status, errText);
      return json(
        {
          ok: false,
          error: "N\xE3o foi poss\xEDvel enviar agora. Tente de novo ou escreva para contato@marebots.com."
        },
        502
      );
    }
    const autoText = [
      `Oi, ${nome}!`,
      "",
      "Recebemos seu contato. Em breve algu\xE9m da Mar\xE9Bots responde neste e-mail (hor\xE1rio comercial, Bras\xEDlia).",
      "",
      "Enquanto isso, se preferir, pode escrever direto para contato@marebots.com.",
      "",
      "Abra\xE7o,",
      "Mar\xE9Bots",
      "marebots.com"
    ].join("\n");
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: FROM,
          to: [email],
          subject: "Recebemos sua mensagem \u2014 Mar\xE9Bots",
          text: autoText
        })
      });
    } catch (e) {
      console.error("Resend auto-reply error", e);
    }
  } else {
    console.warn("RESEND_API_KEY missing \u2014 lead validated but e-mail not sent");
  }
  if (env.LEADS_WEBHOOK_URL) {
    try {
      const wh = await fetch(env.LEADS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          empresa,
          cidade,
          email,
          whatsapp,
          dor,
          fonte,
          status: "Novo",
          consent: true,
          criado_em: nowIso
        })
      });
      if (!wh.ok) {
        console.error(
          "LEADS_WEBHOOK_URL failed",
          wh.status,
          await wh.text().catch(() => "")
        );
      }
    } catch (e) {
      console.error("LEADS_WEBHOOK_URL error", e);
    }
  }
  return json({ ok: true });
}
__name(handleLead, "handleLead");

// worker/index.ts
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/lead" || url.pathname === "/api/lead/") {
      return handleLead(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-SSWavY/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-SSWavY/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
