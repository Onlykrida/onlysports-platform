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

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

async function checkRateLimit(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<RateLimitResult> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count, error } = await supabaseAdmin
    .from('claude_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('called_at', oneHourAgo);

  if (error) {
    // If the usage table is missing or unreachable, fail open with a warning
    // (better to keep AI features working than to hard-block all users on a
    // logging table issue). Production should monitor this path.
    console.warn('claude-proxy: rate limit check failed', error.message);
    return { ok: true, remaining: REQUESTS_PER_HOUR, resetAt: Date.now() + 3600000 };
  }

  const used = count ?? 0;
  return {
    ok: used < REQUESTS_PER_HOUR,
    remaining: Math.max(0, REQUESTS_PER_HOUR - used),
    resetAt: Date.now() + 3600000,
  };
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

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Validate the auth header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'missing_auth' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !anthropicKey) {
    console.error('claude-proxy: missing required env vars');
    return new Response(JSON.stringify({ error: 'function_misconfigured' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
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
    return new Response(JSON.stringify({ error: 'invalid_auth' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Rate-limit + usage logging client (service role)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Check rate limit before forwarding
  const limit = await checkRateLimit(supabaseAdmin, user.id);
  if (!limit.ok) {
    return new Response(
      JSON.stringify({
        error: 'rate_limited',
        remaining: limit.remaining,
        reset_at: limit.resetAt,
      }),
      {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': String(limit.resetAt),
        },
      },
    );
  }

  // Parse + validate the request body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
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
    return new Response(
      JSON.stringify({ error: 'invalid_model', allowed: Array.from(ALLOWED_MODELS) }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
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
    return new Response(JSON.stringify({ error: 'upstream_unreachable' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
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
      'content-type': anthropicResponse.headers.get('content-type') ?? 'application/json',
      'access-control-allow-origin': '*',
      'x-ratelimit-remaining': String(limit.remaining - 1),
    },
  });
});
