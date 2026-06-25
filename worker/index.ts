// ============================================================================
// worker/index.ts
// ----------------------------------------------------------------------------
// THE ronutz TOOLS API — Cloudflare Worker (canon C-04 / C-68, "Seam 1").
//
// Serves /api/* only (wrangler `assets.run_worker_first`); every other path is
// served straight from static assets, untouched. This Worker is the PROGRAMMATIC
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

    // Defensive fallback. `run_worker_first` scopes this Worker to /api/*, so a
    // non-API path reaching here is unexpected; hand it back to static assets.
    return env.ASSETS.fetch(request);
  },
};
