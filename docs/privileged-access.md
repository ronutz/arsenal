# Privileged Access — how to enable and enforce it

This guide explains how privileged access works on ronutz.com, then walks you
through turning it on. There are two independent layers, and it matters that you
know which one you are using:

- **Layer 1 — Privileged preview.** Lets you *see* interface that is switched off
  in config (for example the "Also available as an API" panel). It affects only
  what your browser renders. It is not a security boundary.
- **Layer 2 — API authorization gate.** Controls who may *call* the API, enforced
  server-side in the Cloudflare Worker. This is real access control.

You can use either on its own. Preview never opens the API; the gate never
changes what the UI renders.

---

## Part 1 — How it works

### Layer 1: Privileged preview (render-only)

Purpose: reveal work-in-progress surfaces in place so you can review them before
they go public, while they stay hidden from everyone else.

How it works:

1. You add `?priv=<token>` to any URL.
2. The page hashes that value (SHA-256) in your browser and compares it to a
   hash embedded at build time in `NEXT_PUBLIC_PRIV_PREVIEW_HASH`.
3. If they match, preview turns on for the rest of your browser session (it
   persists as you navigate). `?priv=off` turns it back off.

What it does and does not do:

- It only changes what is **rendered in your browser**. It reveals hidden UI such
  as the API affordance (which then shows a small "preview" badge).
- It does **not** open the API, change what the edge serves, or grant any real
  permission. Anyone with browser devtools can flip a render flag regardless.
- Its two jobs are to prevent *accidental* exposure and to keep the raw token out
  of the shipped code: only the SHA-256 hash is embedded, and reversing it is
  infeasible.

So: treat preview as a convenience for you, never as protection.

### Layer 2: API authorization gate (server-side, enforced)

Purpose: decide who may call the tools API, checked in the Worker before a tool
runs.

How it works:

- A model-agnostic gate engine lives in `src/lib/api-gates`. A **policy** composes
  one or more **providers**:
  - `local-static` — accepts a configured token (usable today),
  - `rbac` — checks the caller's roles (shapes ready today),
  - `dynamic` and `federated` — placeholders that fail closed until built.
- The API surface config (`src/config/apiSurface.ts`) assigns a policy **id** to a
  tool (or globally, or per feature). Most-specific assignment wins.
- On each request the Worker extracts your token (from `Authorization: Bearer …`
  or the `X-API-Key` header, or `?key=`), builds a context, evaluates the policy,
  and either returns `401`/`403` (with an `X-Gate-Reason` header) or lets the tool
  run.

Current state:

- **No policy is assigned. Every gate resolves to "open," so the API is currently
  reachable by anyone.** The enforcement path is wired and inert.
- The `Authorization` and `X-API-Key` headers are already accepted and read, but
  ignored. A placeholder value like `foo` or `bar` passes straight through with
  no effect until a policy treats it.

### The difference, in one line

Preview = *what you can see* (browser, not secure). Gate = *what you can call*
(server, enforced). Turning on preview does not gate the API; gating the API does
not reveal hidden UI.

---

## Part 2 — Step by step

### A. Turn on privileged preview (see hidden UI)

1. **Generate a token.** Any strong random string, for example:
   ```
   openssl rand -hex 24
   ```
2. **Hash it** (embed the hash, never the token):
   ```
   printf '%s' 'YOUR_TOKEN' | sha256sum      # Linux
   printf '%s' 'YOUR_TOKEN' | shasum -a 256  # macOS
   ```
   Copy the 64-character hex value.
3. **Set the build variable.** In the Cloudflare project for the Worker, add an
   environment variable `NEXT_PUBLIC_PRIV_PREVIEW_HASH` = that hex. It is a
   `NEXT_PUBLIC_` variable, inlined at build; only the hash is stored, never the
   token.
4. **Redeploy** (push to the repo; Cloudflare builds and deploys).
5. **Use it.** Visit any page with your token, for example:
   ```
   https://ronutz.com/en/tools/cidr?priv=YOUR_TOKEN
   ```
   Preview turns on and follows you across pages for the session. Exit with
   `?priv=off`.
6. **Verify.** The "Also available as an API" panel appears on tool pages with a
   "preview" badge. In another browser or incognito (no token) it stays hidden.

Rotate by choosing a new token, updating the hash, and redeploying.

### B. Enforce privileged API access (gate the API behind your token)

This is the real, server-side control. Do it when you want the API, or specific
tools, reachable only with your token.

Recommended secure pattern (token as a Worker secret, never committed):

1. **Generate an API token:**
   ```
   openssl rand -hex 32
   ```
2. **Store it as a Worker secret** (not a plaintext variable, not in git):
   ```
   npx wrangler secret put API_PRIVATE_TOKEN
   ```
   (This needs a small one-time code change so the policy can read the secret;
   see "Wiring env-backed tokens" below.)
3. **Define a policy** in `src/lib/api-gates/index.ts` `POLICIES`, using the
   local-static provider bound to that token, for example a policy id
   `"private"` with `mode: "allOf"` and `localStaticProvider({ tokens: [<secret>] })`.
4. **Assign the policy** to the tool(s) or globally in `src/config/apiSurface.ts`
   by setting the `gate` to `"private"` (most-specific assignment wins).
5. **CORS is ready.** `Authorization` and `X-API-Key` are already in the Worker's
   allowed request headers, so browser clients can send them.
6. **Deploy.**
7. **Call the API with your token:**
   ```
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://ronutz.com/api/v1/cidr?input=10.0.0.0/24"
   # or
   curl -H "X-API-Key: YOUR_TOKEN" \
     "https://ronutz.com/api/v1/cidr?input=10.0.0.0/24"
   ```
8. **Verify.** Without the token you get `401 unauthorized` (and an
   `X-Gate-Reason` header explaining why); with the correct token you get `200`.

Quick, less secure alternative (internal testing only): put the token literally
in the `POLICIES` definition. Do not use this for anything real — the token would
live in source and git history. Prefer the secret pattern.

#### Wiring env-backed tokens (the small code change)

Today `POLICIES` is a static object, so it cannot read the Worker secret (Workers
expose secrets through an `env` binding, not `process.env`). To use a secret, the
policy set needs to be built with access to `env` — turn the static `POLICIES`
into a `policiesFor(env)` factory that the Worker calls (the Worker already
receives `env`). It is roughly a 15-line change. Tell me when you want to enable
a real gate and I will wire it as part of that step.

---

## Recap and good practice

- **Preview** (Layer 1) is UI visibility only, and not security. **The gate**
  (Layer 2) is real API enforcement. Keep them straight.
- **Never commit raw tokens.** Preview ships only a hash; the API gate should use
  a Worker secret.
- **Rotate** by regenerating the token and updating the hash/secret, then
  redeploying.
- Enabling a gate is what gives the `Authorization` / `X-API-Key` headers meaning;
  until then they are accepted and ignored.
- When you enable authorization, the OpenAPI spec and docs gain the matching
  security definitions, so the API's documented surface stays honest (governance
  D-75).
