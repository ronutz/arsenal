// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/nginx-proxy-pass-rewriter/compute.ts
// ----------------------------------------------------------------------------
// THE NGINX proxy_pass URI REWRITER.
//
// Teaches the rule that turns one trailing slash into a 404, and that the
// documentation states in a single sentence people read past:
//
//   * `proxy_pass http://backend;`   - NO URI part. The ORIGINAL request URI
//     is passed through unchanged, location prefix and all.
//   * `proxy_pass http://backend/;`  - HAS a URI part (even just "/"). The
//     part of the request that matched the LOCATION PREFIX is REPLACED by it.
//
// That is the whole rule, and everything people find surprising follows:
//   - adding a slash silently strips the prefix, so /app/page becomes /page;
//   - removing it silently keeps the prefix, so a backend expecting /page
//     receives /app/page and 404s;
//   - `proxy_pass http://backend/v2/;` rewrites /app/page to /v2/page,
//     which is how one line does what people reach for `rewrite` to do;
//   - the two forms are not "roughly the same with a cosmetic difference",
//     they are the two halves of a binary switch.
//
// SPECIAL CASES IMPLEMENTED, because they are where the rule stops applying:
//   - REGEX locations (~ and ~*) cannot use a URI part at all: there is no
//     literal prefix to replace, so NGINX refuses the configuration;
//   - a proxy_pass containing a VARIABLE is resolved at request time, and
//     NGINX does not do the prefix substitution - it uses the URI as written
//     (or the original request URI when none is given);
//   - a named location (@name) has no prefix to strip either.
//
// DELIBERATE LIMITS: no rewrite directives, no try_files, no upstream blocks
// resolved to servers, no query-string handling beyond passing it through.
// This answers "what path does the backend receive", not "what does the whole
// request do".
// ============================================================================

export interface ProxyCase {
  /** The location as written, e.g. "/app/" or "~ ^/api/(.*)$". */
  location: string;
  /** Location kind, which decides whether a URI part is even legal. */
  locationKind: "prefix" | "exact" | "regex" | "named";
  /** The proxy_pass value as written. */
  proxyPass: string;
  /** Scheme+authority portion, e.g. "http://backend". */
  upstream: string;
  /** The URI part of proxy_pass, or null when there is none. */
  uriPart: string | null;
  /** True when proxy_pass contains a $variable. */
  hasVariable: boolean;
}

export interface ProxyResult {
  requestUri: string;
  /** What the backend receives, or null when the config is rejected. */
  backendUri: string | null;
  /** Which branch of the rule applied. */
  rule: "passthrough" | "prefix-replaced" | "variable" | "rejected";
  /** Plain-language explanation - the teaching. */
  explanation: string;
  /** The counterpart result, so the difference is visible side by side. */
  counterpart: { proxyPass: string; backendUri: string | null; note: string } | null;
  findings: string[];
  parsed: ProxyCase;
}

export class ProxyParseError extends Error {
  constructor(message: string, public readonly line: number) {
    super(message);
    this.name = "ProxyParseError";
  }
}

/** Split a proxy_pass value into upstream and URI part. */
function splitProxyPass(value: string): { upstream: string; uriPart: string | null } {
  const m = /^([a-z][a-z0-9+.-]*:\/\/[^/]+)(\/.*)?$/i.exec(value);
  if (!m) return { upstream: value, uriPart: null };
  return { upstream: m[1], uriPart: m[2] ?? null };
}

/**
 * Parse the three inputs.
 * Grammar, one per line, # comments and blanks ignored:
 *   location <modifier?> <pattern>
 *   proxy_pass <value>;
 *   request <uri>
 */
export function parseProxyCase(input: string): { c: ProxyCase; requestUri: string } {
  let location: string | null = null;
  let locationKind: ProxyCase["locationKind"] = "prefix";
  let proxyPass: string | null = null;
  let requestUri: string | null = null;

  const lines = input.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const n = i + 1;
    const raw = lines[i].split("#")[0].trim();
    if (!raw) continue;

    if (/^location\b/.test(raw)) {
      const m = /^location\s+(=|\^~|~\*|~)?\s*(\S+)\s*\{?\s*\}?$/.exec(raw);
      if (!m) throw new ProxyParseError(`expected: location [modifier] <pattern>`, n);
      const [, mod, pattern] = m;
      location = pattern;
      if (mod === "=") locationKind = "exact";
      else if (mod === "~" || mod === "~*") locationKind = "regex";
      else if (pattern.startsWith("@")) locationKind = "named";
      else locationKind = "prefix";
      continue;
    }
    if (/^proxy_pass\b/.test(raw)) {
      const m = /^proxy_pass\s+(\S+?);?$/.exec(raw);
      if (!m) throw new ProxyParseError(`expected: proxy_pass <url>;`, n);
      proxyPass = m[1];
      continue;
    }
    if (/^request\b/.test(raw)) {
      requestUri = raw.slice(7).trim();
      if (!requestUri.startsWith("/")) {
        throw new ProxyParseError(`the request URI must start with "/"`, n);
      }
      continue;
    }
    throw new ProxyParseError(`expected a location, proxy_pass, or request line`, n);
  }

  if (!location) throw new ProxyParseError(`no location line`, 1);
  if (!proxyPass) throw new ProxyParseError(`no proxy_pass line`, 1);
  if (!requestUri) throw new ProxyParseError(`no "request <uri>" line - nothing to rewrite`, 1);

  const { upstream, uriPart } = splitProxyPass(proxyPass);
  return {
    c: {
      location,
      locationKind,
      proxyPass,
      upstream,
      uriPart,
      hasVariable: proxyPass.includes("$"),
    },
    requestUri,
  };
}

/** Apply the rule for one proxy_pass value against a request URI. */
function applyRule(c: ProxyCase, requestUri: string, uriPart: string | null): string | null {
  // A variable stops the prefix substitution entirely.
  if (c.hasVariable) return uriPart ?? requestUri;
  // No URI part: the original request URI goes through untouched.
  if (uriPart === null) return requestUri;
  // URI part present: replace the matched location prefix with it.
  const prefix = c.locationKind === "prefix" || c.locationKind === "exact" ? c.location : "";
  const remainder = requestUri.startsWith(prefix) ? requestUri.slice(prefix.length) : requestUri;
  // LITERAL concatenation, deliberately. A first version tidied the join by
  // collapsing a doubled slash and inserting a missing one - which produced a
  // prettier answer than NGINX gives and hid the exact defect this tool exists
  // to reveal. `location /app` (no trailing slash) with `proxy_pass
  // http://backend/` really does send `//page` upstream, and that doubled
  // slash is the symptom people are looking at when they come here.
  return uriPart + remainder;
}

export function rewriteProxyPass(input: string): ProxyResult {
  const { c, requestUri } = parseProxyCase(input);
  const findings: string[] = [];

  // Regex and named locations cannot carry a URI part - NGINX refuses this.
  if ((c.locationKind === "regex" || c.locationKind === "named") && c.uriPart !== null && !c.hasVariable) {
    return {
      requestUri,
      backendUri: null,
      rule: "rejected",
      explanation:
        `NGINX refuses this configuration. A ${c.locationKind === "regex" ? "regular-expression" : "named"} location has no literal prefix to replace, so proxy_pass may not carry a URI part here. Drop everything after the host, or use a rewrite to build the path you want.`,
      counterpart: {
        proxyPass: c.upstream,
        backendUri: requestUri,
        note: `Without the URI part it is legal, and the original request URI is passed through unchanged.`,
      },
      findings,
      parsed: c,
    };
  }

  const backendUri = applyRule(c, requestUri, c.uriPart);

  let rule: ProxyResult["rule"];
  let explanation: string;
  if (c.hasVariable) {
    rule = "variable";
    explanation =
      `The proxy_pass value contains a variable, so it is resolved per request and NGINX does NOT perform the prefix substitution. The path is used as written${c.uriPart === null ? `, which here means the original request URI` : ``}. This is the exception people trip over when they add a variable to an otherwise working proxy_pass and the path silently changes.`;
  } else if (c.uriPart === null) {
    rule = "passthrough";
    explanation =
      `proxy_pass has NO URI part - nothing after the host - so the ORIGINAL request URI is passed through unchanged, location prefix included. The backend sees ${backendUri}.`;
  } else {
    rule = "prefix-replaced";
    const stripped = c.locationKind === "prefix" || c.locationKind === "exact" ? c.location : "";
    explanation =
      `proxy_pass HAS a URI part ("${c.uriPart}"), so the part of the request that matched the location prefix ("${stripped}") is REPLACED by it. ${requestUri} becomes ${backendUri}.`;
  }

  // The counterpart: the same config with the switch flipped.
  const flippedValue = c.uriPart === null ? `${c.upstream}/` : c.upstream;
  const flippedUri = c.uriPart === null ? "/" : null;
  const counterpart = c.hasVariable
    ? null
    : {
        proxyPass: flippedValue,
        backendUri: applyRule(c, requestUri, flippedUri),
        note:
          c.uriPart === null
            ? `Add a single trailing slash and the location prefix is stripped instead.`
            : `Remove the URI part and the location prefix is kept instead.`,
      };

  // Findings worth raising regardless of the outcome.
  if (c.locationKind === "prefix" && !c.location.endsWith("/") && c.uriPart !== null) {
    findings.push(
      `The location "${c.location}" does not end in a slash while proxy_pass carries a URI part. The replacement is literal, so the leftover slash from the request is kept and the backend receives a DOUBLED slash. Matching trailing slashes on both sides is the usual fix.`,
    );
  }
  if (c.uriPart !== null && c.uriPart !== "/" && !c.uriPart.endsWith("/") && c.location.endsWith("/")) {
    findings.push(
      `The location ends in a slash but the proxy_pass URI part does not, so the two are joined with one inserted. Matching the slashes on both sides removes the ambiguity.`,
    );
  }
  if (c.hasVariable) {
    findings.push(
      `Because the value contains a variable, NGINX also resolves the upstream name at request time rather than at startup, which means a resolver directive is usually required and a name that fails to resolve becomes a runtime error rather than a config error.`,
    );
  }

  return { requestUri, backendUri, rule, explanation, counterpart, findings, parsed: c };
}
