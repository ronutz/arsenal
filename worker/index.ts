// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// worker/index.ts
// ----------------------------------------------------------------------------
// THE ronutz TOOLS API + LOCALE REDIRECT — Cloudflare Worker (canon C-04 / C-68, "Seam 1").
//
// Two jobs: (1) serve the tools API under /api/*; (2) redirect bare, non-
// localized routes to the default locale (e.g. /colophon -> /en/colophon),
// because the static export (localePrefix "always") emits pages only under
// /<locale>/ and has no file at a bare path. Locale-prefixed pages and the
// heavy asset directories are served straight from assets (wrangler
// `assets.run_worker_first` excludes them), so the Worker only does real work
// for /api/* and for bare-route redirects.
//
// For the API, this Worker is the PROGRAMMATIC counterpart to the in-browser
// tools. It routes /api/v1/<slug> GENERICALLY from the single tool registry
// (src/lib/tools/registry.ts), calling the EXACT SAME arsenal-local engine the
// browser calls, so hosted and in-browser output are byte-identical (the Seam-1
// invariant, proven by each engine's golden vectors). Because the registry is
// also what the OpenAPI generator reads, the served endpoints and the documented
// endpoints cannot drift (D-72). Every run() is awaited, so sync and async
// engines are handled identically. The engines are in-house (src/lib/) and
// imported directly; there is no external engine dependency.
//
// PRIVACY (deliberate, consistent with the rest of the site): stateless. It
// reads only the input on the request, computes, and returns. It logs no query
// values or request bodies. The in-browser tools remain the zero-egress default;
// this endpoint exists for automation (scripts, pipelines, integrations).
//
// This file lives OUTSIDE src/ and is excluded from the Next tsconfig, so it has
// no effect on `npm run build`; wrangler bundles it (and, transitively, every
// engine the registry imports) at deploy time.
// ============================================================================

import { API_TOOL_MAP } from "../src/lib/tools/registry";
import { API_SURFACE, gateForApiFeature } from "../src/config/apiSurface";
import { evaluateGate, type GateContext } from "../src/lib/api-gates";
// Locale registry is the single source of truth (src/i18n/locales.ts). Imported
// via a relative path because the Worker is outside src/ and the "@/" alias is
// not in scope for wrangler's bundler.
import { LOCALE_CODES, LIVE_LOCALE_CODES, DEFAULT_LOCALE } from "../src/i18n/locales";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

// Permissive CORS: this is a public, read-only, side-effect-free compute API,
// so it is safe to call from any origin (browser scripts, dashboards, etc.).
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  // Authorization and X-API-Key are accepted now so browser clients can send
  // them without a preflight rejection, but the server ignores their values
  // until a gate policy is assigned (see src/lib/api-gates). Any value (e.g. a
  // placeholder like "foo" / "bar") is read into the gate context and, with all
  // gates open, has no effect.
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
};

/** Build a JSON response with CORS headers applied. */
function json(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS,
      ...extraHeaders,
    },
  });
}

const API_PREFIX = "/api/v1/";

// Pre-rename API slugs (renamed 2026-07-03 to carry the f5- vendor prefix).
// Requests to the old slugs answer with a permanent redirect to the successor.
// 308 (not 301) so the method and body are preserved: clients may replay a
// 301 as GET, which would break POST callers mid-migration.
const RENAMED_API_SLUGS = new Map<string, string>([
  ["bigip-persistence-cookie", "f5-bigip-persistence-cookie"],
  ["bigip-tcpdump-builder", "f5-bigip-tcpdump-builder"],
  ["irules-event-order", "f5-irules-event-order"],
  ["tmsh-config-explainer", "f5-tmsh-config-explainer"],
  ["persistence-method-explainer", "f5-persistence-method-explainer"],
]);

// Vanity short paths -> their canonical destination. Resolved in the locale-
// gate section below, BEFORE the default-locale redirect that would otherwise
// send /mb -> /en/mb/ (which has no page and 404s). Keys are matched with any
// trailing slash stripped, so /mb and /mb/ both resolve. /mb is the Mega Brain
// (/dev/fun), which ships only under pt-BR. /bingo is Meeting Bingo; the page
// exists in every locale, and the shortcut targets the EN page per PRIME's spec.
const VANITY_REDIRECTS = new Map<string, string>([
  ["/mb", "/pt-BR/dev-fun/mega-brain/"],
  ["/bingo", "/en/dev-fun/meeting-bingo/"],
]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ---- /api/v1/<slug> : generic tool dispatch ----------------------------
    if (url.pathname.startsWith(API_PREFIX)) {
      const slug = url.pathname.slice(API_PREFIX.length);

      // ---- Master processing switch -----------------------------------------
      // The single API_PROCESSING switch (src/config/apiSurface.ts) governs
      // whether the API is SERVED at all. While it is off (the default), the
      // endpoints are documented but not served, so every /api/v1/* request
      // gets an honest 404 that points at the reference. Flipping the switch to
      // 1 (and deploying) is what turns local processing on. This gate is first,
      // before slug lookup, so the whole surface is dark as one unit.
      if (!API_SURFACE.global.enabled) {
        return json(
          {
            error: "api_not_served",
            message:
              "The API is documented but not served from this site. See https://ronutz.com/en/api for the specification and why processing is off.",
          },
          404,
        );
      }

      // Renamed slug? Permanent redirect to the successor, query preserved.
      const renamedTo = RENAMED_API_SLUGS.get(slug);
      if (renamedTo) {
        const to = new URL(url);
        to.pathname = API_PREFIX + renamedTo;
        return new Response(null, {
          status: 308,
          headers: { Location: to.toString(), "Cache-Control": "public, max-age=86400" },
        });
      }

      const tool = API_TOOL_MAP.get(slug);

      if (!tool) {
        return json(
          {
            error: "not_found",
            message: `No API tool named '${slug}'. See https://ronutz.com/en/api for the list of operations.`,
          },
          404,
        );
      }

      if (request.method !== "GET" && request.method !== "POST") {
        return json(
          {
            error: "method_not_allowed",
            message: "Use GET with ?input=<value>, or POST with the value in the request body.",
          },
          405,
          { Allow: "GET, POST, OPTIONS" },
        );
      }

      // ---- Authorization gate ------------------------------------------------
      // Optional, model-agnostic gate resolved from the API surface config and
      // evaluated by the gate engine. Every tool's gate id is currently null, so
      // this resolves to "open" and changes nothing; assigning a policy id in the
      // config (and defining it in the engine registry) turns enforcement on.
      // API AVAILABILITY is governed by the tool registry, not here, so this only
      // ever adds optional authorization. The request body is not read here (only
      // headers and the URL), leaving the POST body intact for input parsing.
      {
        const authz = request.headers.get("authorization") ?? "";
        const bearer =
          authz.slice(0, 7).toLowerCase() === "bearer " ? authz.slice(7).trim() : undefined;
        const rawToken =
          bearer ?? request.headers.get("x-api-key") ?? url.searchParams.get("key");
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
          headers[key.toLowerCase()] = value;
        });
        const ctx: GateContext = {
          tool: slug,
          feature: "endpoint",
          token: rawToken ? rawToken : undefined,
          headers,
          ip: request.headers.get("cf-connecting-ip") ?? undefined,
        };
        const decision = await evaluateGate(
          gateForApiFeature(API_SURFACE, slug, "endpoint"),
          ctx,
        );
        if (!decision.allow) {
          const status = decision.status ?? 403;
          const errorCode =
            status === 401 ? "unauthorized" : status === 429 ? "rate_limited" : "forbidden";
          const extra: Record<string, string> = { "X-Gate-Reason": decision.reason };
          if (status === 401) extra["WWW-Authenticate"] = "Bearer";
          return json({ error: errorCode, message: decision.reason }, status, extra);
        }
      }

      // The input string: a query parameter on GET, the raw body on POST.
      // (For the six structured tools the input is a JSON object, passed as a
      // JSON string.) The legacy /api/v1/cidr?block= alias is still honored.
      let input: string | null = null;
      if (request.method === "GET") {
        input = url.searchParams.get("input");
        if (input === null && slug === "cidr") input = url.searchParams.get("block");
      } else {
        input = (await request.text()) || null;
      }

      if (input === null || input === "") {
        return json(
          {
            error: "missing_input",
            message:
              "Provide input: GET with ?input=<value>, or POST the value in the request body." +
              (tool.structured ? " This tool expects a JSON object." : ""),
          },
          400,
        );
      }

      try {
        // The single source of truth, shared with the in-browser tool. Awaited
        // unconditionally so sync and async engines behave the same. Output is a
        // pure function of the input -> safe to cache at the edge.
        const result = await tool.run(input);
        return json(result, 200, { "Cache-Control": "public, max-age=86400" });
      } catch (err) {
        // Engines signal bad input DELIBERATELY by throwing plain Error or one
        // of their custom subclasses (CidrInputError, JwtDecodeError, ...) with
        // a message written for humans - those pass through verbatim. NATIVE
        // error types (TypeError from a missing field, SyntaxError from a body
        // that is not valid JSON, RangeError, ...) are runtime accidents whose
        // messages leak internals ("Cannot read properties of undefined ...",
        // observed live 03/07/2026), so they map to one stable, useful hint
        // pointing at the machine-readable schema instead.
        const native =
          err instanceof TypeError ||
          err instanceof SyntaxError ||
          err instanceof RangeError ||
          err instanceof ReferenceError ||
          err instanceof URIError;
        const message =
          err instanceof Error && !native
            ? err.message
            : `The request body is missing required fields or is not valid JSON for this tool. See the request schema for /api/v1/${slug} at https://ronutz.com/openapi.json.`;
        return json({ error: "invalid_input", message }, 400);
      }
    }

    // ---- Unknown /api/* route: structured JSON 404 (not the HTML 404 page) --
    if (url.pathname.startsWith("/api/")) {
      return json(
        { error: "not_found", message: `No API route for ${url.pathname}.` },
        404,
      );
    }

    // ---- Vanity short paths (BEFORE the locale gate) -----------------------
    // Bare shortcuts that map to one canonical page. Handled before the locale
    // gate below, which would otherwise prepend the default locale (/mb ->
    // /en/mb/) and 404. 302 (not 301): a playful shortcut that may be repointed
    // later, so browsers must not cache it permanently.
    {
      const vanityKey = url.pathname.replace(/\/+$/, "") || "/";
      const vanityDest = VANITY_REDIRECTS.get(vanityKey);
      if (vanityDest) {
        // 302 + no-store: a playful shortcut that may be repointed later, so the
        // browser must never cache it (avoids the stale-redirect trap that a
        // cached 301 would create).
        return new Response(null, {
          status: 302,
          headers: {
            Location: new URL(`${vanityDest}${url.search}`, url.origin).toString(),
            "Cache-Control": "no-store",
          },
        });
      }
    }

    // ---- Non-API path: the LOCALE GATE -------------------------------------
    const seg = url.pathname.split("/")[1] ?? "";
    const isLiveLocale = LIVE_LOCALE_CODES.includes(seg);
    const isStubLocale = !isLiveLocale && LOCALE_CODES.includes(seg);
    const looksLikeFile = /\.[a-z0-9]+$/i.test(url.pathname);

    if (isStubLocale) {
      const rest = url.pathname.slice(seg.length + 1) || "/";
      let dest = `/${DEFAULT_LOCALE}${rest}`;
      if (!looksLikeFile && !dest.endsWith("/")) dest += "/";
      return Response.redirect(new URL(`${dest}${url.search}`, url.origin).toString(), 301);
    }

    if (!isLiveLocale && !looksLikeFile) {
      let rest = url.pathname === "/" ? "/" : url.pathname;
      if (!rest.endsWith("/")) rest += "/";
      const dest = `/${DEFAULT_LOCALE}${rest}${url.search}`;
      // 301 (not 302): production performs no Accept-Language negotiation -
      // the static export ships English as the de-facto default and this gate
      // always targets DEFAULT_LOCALE - so the redirect is permanent by
      // construction. Ratified by PRIME in-chat 03/07/2026 after live
      // verification that the header is ignored (/f5 + pt-BR still -> /en/f5/).
      return Response.redirect(new URL(dest, url.origin).toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
};
