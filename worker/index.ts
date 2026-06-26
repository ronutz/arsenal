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
// For the API, this Worker is the PROGRAMMATIC
// counterpart to the in-browser tools: it calls the EXACT SAME @ronutz/netcore
// function the browser calls, so hosted and in-browser output are byte-identical
// (the Seam-1 invariant, proven by netcore's golden vectors).
//
// PRIVACY (deliberate, consistent with the rest of the site): stateless. It
// reads only the input on the request, computes, and returns. It logs no query
// values or request bodies. The in-browser tools remain the zero-egress default;
// this endpoint exists for automation (scripts, pipelines, integrations).
//
// This file lives OUTSIDE src/ and is excluded from the Next tsconfig, so it has
// no effect on `npm run build`; wrangler bundles it at deploy time.
// ============================================================================

import { run as computeCidr } from "@ronutz/netcore/tools/cidr";
// Locale registry is the single source of truth (src/i18n/locales.ts). Imported
// via a relative path because the Worker is outside src/ and the "@/" alias is
// not in scope for wrangler's bundler. locales.ts has no runtime deps, so it
// bundles cleanly into the Worker.
import { LOCALE_CODES, DEFAULT_LOCALE } from "../src/i18n/locales";

interface Env {
  // Static assets binding. Present so future /api routes could serve assets;
  // today, unmatched /api/* paths return a structured JSON 404 instead.
  ASSETS: { fetch(request: Request): Promise<Response> };
}

// Permissive CORS: this is a public, read-only, side-effect-free compute API,
// so it is safe to call from any origin (browser scripts, dashboards, etc.).
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ---- GET /api/v1/cidr?block=<cidr> ------------------------------------
    if (url.pathname === "/api/v1/cidr") {
      if (request.method !== "GET") {
        return json(
          { error: "method_not_allowed", message: "Use GET." },
          405,
          { Allow: "GET, OPTIONS" },
        );
      }

      const block = url.searchParams.get("block");
      if (!block) {
        return json(
          {
            error: "missing_parameter",
            message:
              "Provide a CIDR block in the 'block' query parameter, e.g. ?block=192.168.1.0/24.",
          },
          400,
        );
      }

      try {
        // The single source of truth, shared with the in-browser tool.
        const result = computeCidr(block);
        // Output is a pure function of the input → safe to cache at the edge.
        return json(result, 200, { "Cache-Control": "public, max-age=86400" });
      } catch (err) {
        return json(
          {
            error: "invalid_cidr",
            message:
              err instanceof Error
                ? err.message
                : "Not a valid IPv4 CIDR block. Expected something like 192.168.1.0/24.",
          },
          400,
        );
      }
    }

    // ---- Unknown /api/* route: structured JSON 404 (not the HTML 404 page) --
    if (url.pathname.startsWith("/api/")) {
      return json(
        { error: "not_found", message: `No API route for ${url.pathname}.` },
        404,
      );
    }

    // ---- Non-API path: the LOCALE GATE -------------------------------------
    // run_worker_first now routes non-asset page paths here too. Three cases:
    //   • locale-prefixed page (/en/…, /fr/…)   -> serve from assets
    //   • root-level static file (/favicon.ico) -> serve from assets
    //   • bare, non-localized route (/colophon) or the apex (/) -> redirect to
    //     the default locale, since the static export (localePrefix "always")
    //     has no page there.
    const seg = url.pathname.split("/")[1] ?? "";
    const isLocalePrefixed = LOCALE_CODES.includes(seg);
    const looksLikeFile = /\.[a-z0-9]+$/i.test(url.pathname); // has a file extension
    if (!isLocalePrefixed && !looksLikeFile) {
      // The static export uses trailingSlash:true, so canonical pages end in
      // "/". Add it here so the redirect lands on the canonical URL in a single
      // hop (otherwise the asset layer's auto-trailing-slash adds a 2nd redirect).
      let rest = url.pathname === "/" ? "/" : url.pathname; // preserve the deep path
      if (!rest.endsWith("/")) rest += "/";
      const dest = `/${DEFAULT_LOCALE}${rest}${url.search}`;
      // 302 (temporary), matching public/_redirects: leaves the door open for
      // future Accept-Language detection without browsers hard-caching /en/.
      return Response.redirect(new URL(dest, url.origin).toString(), 302);
    }

    // Locale-prefixed page or root-level asset: hand back to static assets
    // (which applies not_found_handling = 404-page for a genuine miss).
    return env.ASSETS.fetch(request);
  },
};
