// ============================================================================
// src/lib/tools/registry.ts
// ----------------------------------------------------------------------------
// THE API SURFACE - the single source of truth for which tools are exposed over
// the HTTP API, and how to run each one. Both the Cloudflare Worker (worker/
// index.ts, which routes /api/v1/<slug>) and the OpenAPI generator (scripts/
// build-openapi.mts) read this list, so the served endpoints and the documented
// endpoints can never drift from each other or from the toolbox.
//
// DISCIPLINE (D-72): every tool marked "built" in the catalogue MUST appear here.
// scripts/build-openapi.mts fails the build if a built tool is missing, so a new
// tool cannot ship without an API endpoint and a doc entry. Adding a tool =
// build its engine (with run()), then add one line below.
//
// Each entry normalizes the tool to (input: string) => result. Most tools take a
// plain string. The six structured-input tools (bigip-tcpdump-builder, cert-
// renewal-planner, csr-decoder, diff, hmac, totp-hotp) accept a JSON object,
// passed to the API as a JSON string and parsed here; they are marked structured
// so the docs describe a JSON request body. cidr's engine is named cidrAnalyze.
// Async engines (hash, hmac, pkce, totp-hotp) return a Promise; the Worker awaits
// every run() unconditionally, so sync and async are handled identically.
//
// This module has no runtime dependency beyond the engines themselves, so it
// bundles cleanly into the Worker. Nothing in the browser app imports it, so it
// adds nothing to the client bundle.
// ============================================================================

import { run as base64Run } from "./base64";
import { run as bigipPersistenceCookieRun } from "./bigip-persistence-cookie";
import { run as bigipTcpdumpBuilderRun } from "./bigip-tcpdump-builder";
import { run as certRenewalPlannerRun } from "./cert-renewal-planner";
import { cidrAnalyze } from "./cidr/compute";
import { run as cipherRun } from "./cipher";
import { run as csrDecoderRun } from "./csr-decoder";
import { run as cvssVectorDecoderRun } from "./cvss-vector-decoder";
import { run as diffRun } from "./diff";
import { run as digOutputExplainerRun } from "./dig-output-explainer";
import { run as epochRun } from "./epoch";
import { run as f5CipherStringExpanderRun } from "./f5-cipher-string-expander";
import { run as f5SslProfileExplainerRun } from "./f5-ssl-profile-explainer";
import { run as f5xcServicePolicyExplainerRun } from "./f5xc-service-policy-explainer";
import { run as f5ServiceCheckDateRun } from "./f5-service-check-date";
import { run as hashRun } from "./hash";
import { run as hmacRun } from "./hmac";
import { run as httpRequestTranslatorRun } from "./http-request-translator";
import { run as ipv6Run } from "./ipv6";
import { run as irulesEventOrderRun } from "./irules-event-order";
import { run as jsonFormatterRun } from "./json-formatter";
import { run as jsonYamlConvertRun } from "./json-yaml-convert";
import { run as jwksExplainerRun } from "./jwks-explainer";
import { run as jwtRun } from "./jwt";
import { run as nslookupOutputExplainerRun } from "./nslookup-output-explainer";
import { run as oidcRun } from "./oidc";
import { run as persistenceMethodExplainerRun } from "./persistence-method-explainer";
import { run as pkceRun } from "./pkce";
import { run as regexRun } from "./regex";
import { run as samlDecoderRun } from "./saml-decoder";
import { run as secureHeadersRun } from "./secure-headers";
import { run as ssrfUrlClassifierRun } from "./ssrf-url-classifier";
import { run as syslogPriDecoderRun } from "./syslog-pri-decoder";
import { run as tmshConfigExplainerRun } from "./tmsh-config-explainer";
import { run as totpHotpRun } from "./totp-hotp";
import { run as urlInspectorRun } from "./url-inspector";
import { run as uuidRun } from "./uuid";
import { run as x509Run } from "./x509";
import { run as xmlDecoderRun } from "./xml-decoder";

export interface ApiTool {
  /** Tool slug; the API path is /api/v1/<slug>. */
  slug: string;
  /** Normalized entry point: a string in, a JSON-serializable result out (or a Promise of one). */
  run: (input: string) => unknown | Promise<unknown>;
  /** True when the input is a JSON object (sent as a JSON string / request body). */
  structured?: boolean;
}

/** Every API-exposed tool. Kept in sync with the catalogue by the build (D-72). */
export const API_TOOLS: ApiTool[] = [
  { slug: "base64", run: base64Run },
  { slug: "bigip-persistence-cookie", run: bigipPersistenceCookieRun },
  { slug: "bigip-tcpdump-builder", structured: true, run: (input) => bigipTcpdumpBuilderRun(JSON.parse(input)) },
  { slug: "cert-renewal-planner", structured: true, run: (input) => certRenewalPlannerRun(JSON.parse(input)) },
  { slug: "cidr", run: (input) => cidrAnalyze(input) },
  { slug: "cipher", run: cipherRun },
  { slug: "csr-decoder", structured: true, run: (input) => csrDecoderRun(JSON.parse(input)) },
  { slug: "cvss-vector-decoder", run: cvssVectorDecoderRun },
  { slug: "diff", structured: true, run: (input) => diffRun(JSON.parse(input)) },
  { slug: "dig-output-explainer", run: digOutputExplainerRun },
  { slug: "epoch", run: epochRun },
  { slug: "f5-cipher-string-expander", run: f5CipherStringExpanderRun },
  { slug: "f5-ssl-profile-explainer", run: f5SslProfileExplainerRun },
  { slug: "f5xc-service-policy-explainer", run: f5xcServicePolicyExplainerRun },
  { slug: "f5-service-check-date", run: f5ServiceCheckDateRun },
  { slug: "hash", run: hashRun },
  { slug: "hmac", structured: true, run: (input) => hmacRun(JSON.parse(input)) },
  { slug: "http-request-translator", run: httpRequestTranslatorRun },
  { slug: "ipv6", run: ipv6Run },
  { slug: "irules-event-order", run: irulesEventOrderRun },
  { slug: "json-formatter", run: jsonFormatterRun },
  { slug: "json-yaml-convert", run: jsonYamlConvertRun },
  { slug: "jwks-explainer", run: jwksExplainerRun },
  { slug: "jwt", run: jwtRun },
  { slug: "nslookup-output-explainer", run: nslookupOutputExplainerRun },
  { slug: "oidc", run: oidcRun },
  { slug: "persistence-method-explainer", run: persistenceMethodExplainerRun },
  { slug: "pkce", run: pkceRun },
  { slug: "regex", run: regexRun },
  { slug: "saml-decoder", run: samlDecoderRun },
  { slug: "secure-headers", run: secureHeadersRun },
  { slug: "ssrf-url-classifier", run: ssrfUrlClassifierRun },
  { slug: "syslog-pri-decoder", run: syslogPriDecoderRun },
  { slug: "tmsh-config-explainer", run: tmshConfigExplainerRun },
  { slug: "totp-hotp", structured: true, run: (input) => totpHotpRun(JSON.parse(input)) },
  { slug: "url-inspector", run: urlInspectorRun },
  { slug: "uuid", run: uuidRun },
  { slug: "x509", run: x509Run },
  { slug: "xml-decoder", run: xmlDecoderRun },
];

/** Fast lookup by slug for the Worker's request router. */
export const API_TOOL_MAP: Map<string, ApiTool> = new Map(API_TOOLS.map((t) => [t.slug, t]));

/**
 * Tools that are built and shipped in the browser but intentionally NOT exposed
 * over the HTTP API, each with the reason. Some capabilities do not belong on a
 * shared edge - e.g. a bounded brute-force search is compute-heavy and abusable.
 *
 * DISCIPLINE (D-72): the build requires every tool marked "built" in the
 * catalogue to be EITHER in API_TOOLS above OR listed here. That forces a
 * deliberate expose-or-exclude decision per tool, so a new tool cannot ship
 * without one, and the API and its docs stay in lockstep with the toolbox.
 */
export const API_EXCLUDED: Record<string, string> = {
  "hash-preimage-finder":
    "Bounded brute-force preimage search: compute-heavy and abuse-prone on a shared edge. Browser-only by design.",
};
