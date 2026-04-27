# Claude Proxy — Deployment Guide

Closes P0-3 from the 2026-04-26 code review: removes the client-bundled
`EXPO_PUBLIC_ANTHROPIC_API_KEY`, moves Claude calls behind an authenticated
Supabase Edge Function with rate-limiting + usage tracking.

## Prerequisites

- `supabase` CLI installed (`brew install supabase/tap/supabase`)
- Logged in (`supabase login`)
- Project linked (`supabase link --project-ref dcixlerneuuyhsftnifm`)
- Anthropic dashboard access (to rotate the leaked key)

## Step 1 — Apply the usage-tracking migration

Save the SQL below as `supabase-claude-usage.sql` (or paste into Dashboard SQL Editor at
`https://supabase.com/dashboard/project/dcixlerneuuyhsftnifm/sql/new`).

```sql
-- Per-user Claude API usage tracking. Powers rate-limiting + cost monitoring.
CREATE TABLE IF NOT EXISTS public.claude_usage (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  model         text NOT NULL,
  input_tokens  integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  called_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claude_usage_user_called_at
  ON public.claude_usage(user_id, called_at DESC);

ALTER TABLE public.claude_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS claude_usage_self_read   ON public.claude_usage;
CREATE POLICY claude_usage_self_read ON public.claude_usage
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- INSERT path is service-role-only (the edge function), no policy for
-- authenticated/anon. Service role bypasses RLS by default.
```

## Step 2 — Rotate the Anthropic API key

1. Go to <https://console.anthropic.com/settings/keys>
2. Generate a new key (give it a name like `onlykrida-server-2026-04`)
3. Copy the new key (`sk-ant-...`) — you'll set it in Step 3
4. **Do NOT revoke the old key yet.** Wait until Step 5 verifies the new
   path works. If you revoke too early, the existing app stops working
   until users restart.

## Step 3 — Set the function secret

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref dcixlerneuuyhsftnifm
```

The function reads `ANTHROPIC_API_KEY` from `Deno.env.get`. Never commit
the key, never put it in this file or in `index.ts`.

## Step 4 — Deploy the function

```bash
supabase functions deploy claude-proxy --project-ref dcixlerneuuyhsftnifm
```

Verify deploy:

```bash
supabase functions list --project-ref dcixlerneuuyhsftnifm
```

You should see `claude-proxy` with status `ACTIVE`.

## Step 5 — Smoke-test the function

```bash
# Get a JWT for a test user (athlete account)
curl -X POST 'https://dcixlerneuuyhsftnifm.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "content-type: application/json" \
  -d '{"email":"test.athlete@onlykrida.com","password":"test123"}' \
  | jq -r .access_token > /tmp/jwt.txt

# Call the proxy
curl -X POST 'https://dcixlerneuuyhsftnifm.supabase.co/functions/v1/claude-proxy' \
  -H "Authorization: Bearer $(cat /tmp/jwt.txt)" \
  -H "content-type: application/json" \
  -d '{
    "model":"claude-sonnet-4-6",
    "max_tokens":50,
    "system":"You are a test bot. Reply only OK.",
    "messages":[{"role":"user","content":"ping"}]
  }'
```

Expected: `200 OK` with a Claude response containing "OK". If you see
`401 invalid_auth`, the JWT is wrong. If you see `500
function_misconfigured`, the secret isn't set (Step 3). If you see
`429 rate_limited`, you've already used 30 calls in the last hour.

## Step 6 — Update services/ai.ts

After Step 5 succeeds, update the client:

```diff
- const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
- const API_URL = 'https://api.anthropic.com/v1/messages';
+ const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
+ const API_URL = `${SUPABASE_URL}/functions/v1/claude-proxy`;
```

In `callClaude`, replace the auth header:

```diff
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
-     'x-api-key': ANTHROPIC_API_KEY,
-     'anthropic-version': '2023-06-01',
+     'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  });
```

The `session.access_token` is the user's Supabase JWT — get it via
`supabase.auth.getSession()`. The proxy validates it.

Drop the `isAIConfigured()` check on `EXPO_PUBLIC_ANTHROPIC_API_KEY` —
guard on `isSupabaseConfigured` instead (since the proxy lives at the
Supabase URL).

Test locally with `npm start`, log in as an athlete, hit AI features
(profile coach, scout suggestions, ai-assistant chat). Verify all paths
work against the proxy.

## Step 7 — Revoke the old key

In <https://console.anthropic.com/settings/keys>, revoke the original
key (the one that was bundled in the client app). Anyone who extracted
it from a shipped binary now sees `401 unauthorized` instead of credit
drain.

## Step 8 — Drop the env var from CI + .env

```bash
# Local
sed -i '' '/EXPO_PUBLIC_ANTHROPIC_API_KEY/d' .env

# GitHub Actions
gh secret delete EXPO_PUBLIC_ANTHROPIC_API_KEY --repo onlykrida/onlysports-platform
```

The CI workflow file (`.github/workflows/ci.yml`) doesn't currently
reference the Anthropic key (only Supabase URL/anon key for web export),
so no workflow edit is needed.

## Rollback

If anything in Steps 4–6 breaks AI features in production:

1. Re-set the OLD `EXPO_PUBLIC_ANTHROPIC_API_KEY` in `.env`
2. Revert the `services/ai.ts` change
3. Rebuild + redeploy the app
4. Investigate what failed in the proxy (check `supabase functions logs claude-proxy`)
5. Old key still works as long as you didn't run Step 7 yet

The function itself is non-destructive — it only proxies. Reverting the
client to call Anthropic directly is a 2-line code change + rebuild.

## Verification checklist

- [ ] `claude_usage` table exists in live DB
- [ ] `ANTHROPIC_API_KEY` is set as a function secret (not committed)
- [ ] `supabase functions list` shows `claude-proxy` ACTIVE
- [ ] Curl smoke test (Step 5) returns 200 OK
- [ ] `services/ai.ts` updated to call the proxy URL with JWT auth
- [ ] Local app testing: profile coach, scout suggestions, ai-assistant all work
- [ ] Old Anthropic key revoked
- [ ] `EXPO_PUBLIC_ANTHROPIC_API_KEY` removed from `.env` and CI secrets
- [ ] `services/ai.ts` no longer references `EXPO_PUBLIC_ANTHROPIC_API_KEY`
- [ ] No new bundle of the app contains the string `sk-ant-` (`grep -r 'sk-ant-' .expo/` should be empty after a fresh `expo export`)

## Cost monitoring

After 1 week of running, check:

```sql
-- Usage by model in the last 7 days
SELECT model,
       COUNT(*)                 AS calls,
       SUM(input_tokens)        AS total_input,
       SUM(output_tokens)       AS total_output
FROM public.claude_usage
WHERE called_at >= now() - interval '7 days'
GROUP BY model;
```

If a single user is hitting the 30/hour rate limit consistently, raise
it for them or investigate abuse. If aggregate cost per user trends up,
the model selection in `services/ai.ts` is the lever (Opus → Sonnet
saves ~5×).

## Future hardening (not blocking)

- Add a cost ceiling per user (e.g., `block if monthly_input_tokens > 100K`)
- Add structured prompt-injection detection on the `system` + `messages`
  fields before forward
- Add per-model rate limits (Opus calls more expensive → tighter limit)
- Stream Anthropic SSE responses through the proxy for faster TTFB
- Add a cron job to delete `claude_usage` rows older than 90 days (DPDP
  retention compliance)
