// ============================================================================
// OnlyKrida — Claude API Proxy Edge Function
//
// Deploys to: https://dcixlerneuuyhsftnifm.supabase.co/functions/v1/claude-proxy
//
// WHY THIS EXISTS
// ----------------------------------------------------------------------------
// Until this proxy ships, services/ai.ts reads ANTHROPIC_API_KEY from a
// process.env.EXPO_PUBLIC_* var. EXPO_PUBLIC_* vars are inlined at build
// time into the JS bundle and are extractable from any shipped binary
// (web devtools, IPA/APK unzip + grep). Anyone with a copy of the app
// can drain the Anthropic credit balance.
//
// This proxy moves the key server-side. The client posts the same payload
// it would have posted to Anthropic, plus its Supabase auth JWT. The
// proxy validates the JWT, forwards to Anthropic with the server-side
// key, returns the response.
//
// SECURITY NOTES
// ----------------------------------------------------------------------------
// - ANTHROPIC_API_KEY must be set as a function secret (`supabase secrets
//   set ANTHROPIC_API_KEY=sk-...`), NEVER in the function source.
// - The function REQUIRES a valid Supabase auth JWT. Anonymous calls reject.
// - Rate-limiting is per-user (auth.uid()) via a sliding-window counter
//   stored in a `claude_usage` table (see DEPLOY.md for migration).
// - The proxy validates the request body shape to prevent prompt smuggling:
//   only `model`, `max_tokens`, `system`, `messages`, `thinking` are forwarded.
//   Any extra fields are dropped.
// - Response is streamed back as-is; no content modification.
//
// CUTOVER
// ----------------------------------------------------------------------------
// 1. Deploy this function (see DEPLOY.md)
// 2. Run the claude_usage migration
// 3. Rotate ANTHROPIC_API_KEY in Anthropic dashboard
// 4. Set the new key as a Supabase function secret
// 5. Update services/ai.ts to call this function (PR after deploy succeeds)
// 6. Remove EXPO_PUBLIC_ANTHROPIC_API_KEY from .env and CI secrets
// ============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Allowed Anthropic request fields. Anything else gets dropped.
const ALLOWED_REQUEST_FIELDS = new Set([
  'model',
  'max_tokens',
  'system',
  'messages',
  'thinking',
  'stop_sequences',
  'temperature',
  'top_p',
  'top_k',
]);

// Allowed model IDs. Locked list prevents users from forcing an expensive
// model via prompt manipulation. Update this list when the project moves
// to a new Claude generation.
const ALLOWED_MODELS = new Set([
  'claude-opus-4-6',
  'claude-sonnet-4-6',
  'claude-haiku-4-5',
  'claude-opus-4-7',
  'claude-sonnet-4-7',
]);

// Per-user rate limit. Tunable.
const REQUESTS_PER_HOUR = 30;

// CORS allow-list. Configure via Supabase function secret:
//   supabase secrets set ALLOWED_ORIGINS="https://onlykrida.com,https://app.onlykrida.com"
// Native mobile clients send no Origin header; those are passed through (the
// JWT validation below is the actual gate). When ALLOWED_ORIGINS is unset, we
// allow only localhost dev origins so a stray production deploy without
// configured secrets cannot expose the proxy to arbitrary cross-origin callers.
const DEV_FALLBACK_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:3000',
];

function pickAllowedOrigin(req: Request): string | null {
  const origin = req.headers.get('origin');
  if (!origin) return null; // native mobile — no Origin header
  const envList = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (envList.length === 0) {
    // Loud on purpose: fail-closed is correct, but a production web deploy
    // missing this secret silently CORS-blocks every AI feature otherwise.
    console.error(
      'claude-proxy: ALLOWED_ORIGINS not set — falling back to localhost dev origins; web clients on other origins will be blocked',
    );
  }
  const allowList = envList.length > 0 ? envList : DEV_FALLBACK_ORIGINS;
  return allowList.includes(origin) ? origin : null;
}

function corsHeaders(req: Request): Record<string, string> {
  const allowed = pickAllowedOrigin(req);
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  if (allowed) headers['Access-Control-Allow-Origin'] = allowed;
  return headers;
}

// Short-window in-memory fallback. Used when the DB-backed limiter can't run
// (table missing, PostgREST hiccup). Bites at 5 req/min/user.
const FALLBACK_REQUESTS_PER_WINDOW = 5;
const FALLBACK_WINDOW_MS = 60_000;

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  reason?: 'db' | 'fallback' | 'block';
}

// In-memory bucket per Deno isolate. Edge functions are short-lived, so this
// is a coarse defense, not a precise counter — it survives the lifetime of the
// isolate and resets when the function cold-starts. The DB-backed limit above
// is the real ceiling (30/hr); this just ensures we have *something* if the DB
// path errors. Map<userId, timestamps[]>.
const fallbackBucket = new Map<string, number[]>();

function fallbackRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const cutoff = now - FALLBACK_WINDOW_MS;
  const stamps = (fallbackBucket.get(userId) ?? []).filter((t) => t > cutoff);

  if (stamps.length >= FALLBACK_REQUESTS_PER_WINDOW) {
    fallbackBucket.set(userId, stamps);
    return {
      ok: false,
      remaining: 0,
      resetAt: stamps[0] + FALLBACK_WINDOW_MS,
      reason: 'block',
    };
  }

  stamps.push(now);
  fallbackBucket.set(userId, stamps);
  return {
    ok: true,
    remaining: FALLBACK_REQUESTS_PER_WINDOW - stamps.length,
    resetAt: now + FALLBACK_WINDOW_MS,
    reason: 'fallback',
  };
}

async function checkRateLimit(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<RateLimitResult> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  try {
    const { count, error } = await supabaseAdmin
      .from('claude_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('called_at', oneHourAgo);

    if (error) {
      // The usage table is missing or PostgREST returned an error. Previously
      // this fail-OPENed (let the request through with REQUESTS_PER_HOUR
      // remaining) which is a wallet-drain hazard if the table gets dropped
      // or hangs. Fall back to an in-memory short-window limiter instead —
      // still degraded, but bounded. The DB error is logged; production should
      // alert on `rate limit check failed`.
      console.warn(
        'claude-proxy: rate limit check failed, using in-memory fallback',
        error.message,
      );
      return fallbackRateLimit(userId);
    }

    const used = count ?? 0;
    return {
      ok: used < REQUESTS_PER_HOUR,
      remaining: Math.max(0, REQUESTS_PER_HOUR - used),
      resetAt: Date.now() + 3600000,
      reason: 'db',
    };
  } catch (err) {
    // Network or thrown-error path — same fallback behavior.
    console.warn('claude-proxy: rate limit check threw, using in-memory fallback', err);
    return fallbackRateLimit(userId);
  }
}

async function logUsage(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
): Promise<void> {
  // Best-effort; failure here doesn't block the response.
  await supabaseAdmin
    .from('claude_usage')
    .insert({
      user_id: userId,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      called_at: new Date().toISOString(),
    })
    .then(({ error }) => {
      if (error) console.warn('claude-proxy: usage log failed', error.message);
    });
}

// JSON response helper that ALWAYS includes CORS headers. Previously the error
// paths (405/401/500/429/400/413/502) omitted corsHeaders(req), so on web the
// browser blocked the body for lack of Access-Control-Allow-Origin and the
// client's structured 401/429 handling became dead code — every failure class
// surfaced as a generic error.
function jsonResponse(
  req: Request,
  obj: unknown,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders(req), 'content-type': 'application/json', ...extraHeaders },
  });
}

// Max combined system+messages payload. The rate limiter counts requests, not
// tokens, so without this a single authenticated caller could send ~200K-token
// prompts to a 1M-context model and run up the Anthropic bill 30×/hr.
const MAX_PROMPT_BYTES = 64 * 1024;

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req),
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'method_not_allowed' }, 405);
  }

  // Validate the auth header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse(req, { error: 'missing_auth' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !anthropicKey) {
    console.error('claude-proxy: missing required env vars');
    return jsonResponse(req, { error: 'function_misconfigured' }, 500);
  }

  // Verify the user's JWT
  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabaseUser.auth.getUser();
  if (authError || !user) {
    return jsonResponse(req, { error: 'invalid_auth' }, 401);
  }

  // Rate-limit + usage logging client (service role)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Check rate limit before forwarding
  const limit = await checkRateLimit(supabaseAdmin, user.id);
  if (!limit.ok) {
    return jsonResponse(
      req,
      { error: 'rate_limited', remaining: limit.remaining, reset_at: limit.resetAt },
      429,
      { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(limit.resetAt) },
    );
  }

  // Parse + validate the request body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: 'invalid_json' }, 400);
  }

  // Drop any field not in the allow-list. Prevents prompt smuggling via
  // exotic Anthropic request fields.
  const cleanedBody: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_REQUEST_FIELDS.has(key)) {
      cleanedBody[key] = value;
    }
  }

  // Validate model is in allow-list
  const model = cleanedBody.model as string | undefined;
  if (!model || !ALLOWED_MODELS.has(model)) {
    return jsonResponse(req, { error: 'invalid_model', allowed: Array.from(ALLOWED_MODELS) }, 400);
  }

  // Reject oversized prompts (token-cost DoS guard — see MAX_PROMPT_BYTES).
  const promptBytes =
    JSON.stringify(cleanedBody.system ?? '').length +
    JSON.stringify(cleanedBody.messages ?? '').length;
  if (promptBytes > MAX_PROMPT_BYTES) {
    return jsonResponse(req, { error: 'prompt_too_large', max_bytes: MAX_PROMPT_BYTES }, 413);
  }

  // Cap max_tokens to prevent runaway costs
  if (typeof cleanedBody.max_tokens === 'number' && cleanedBody.max_tokens > 4096) {
    cleanedBody.max_tokens = 4096;
  }

  // Forward to Anthropic
  let anthropicResponse: Response;
  try {
    anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(cleanedBody),
    });
  } catch (err) {
    console.error('claude-proxy: anthropic fetch failed', err);
    return jsonResponse(req, { error: 'upstream_unreachable' }, 502);
  }

  const responseBody = await anthropicResponse.text();

  // Log usage on success (best-effort, non-blocking via .then)
  if (anthropicResponse.ok) {
    try {
      const parsed = JSON.parse(responseBody) as {
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      const inputTokens = parsed.usage?.input_tokens ?? 0;
      const outputTokens = parsed.usage?.output_tokens ?? 0;
      void logUsage(supabaseAdmin, user.id, model, inputTokens, outputTokens);
    } catch {
      // Response wasn't JSON — usage logging skipped, response forwarded as-is
    }
  }

  return new Response(responseBody, {
    status: anthropicResponse.status,
    headers: {
      ...corsHeaders(req),
      'content-type': anthropicResponse.headers.get('content-type') ?? 'application/json',
      'x-ratelimit-remaining': String(limit.remaining - 1),
    },
  });
});
