// ============================================================================
// src/lib/share/cases/nginx-proxy-cache-decision-revealed.ts
// ----------------------------------------------------------------------------
// Share cases of the NGINX proxy_cache decision engine's reveal switch
// (2026-11-01, wave 4B; THE REVEAL SWITCH of 01/11/2026). Ticked in the
// popover, the link carries the box as typed, cookie values and credentials
// included; the arrival is the same paste as the copy's (one decode rule).
// The page offers the switch only beside a copy that replaced something
// (NginxProxyCacheDecisionTool), so these cases pin the spec, not when it is
// offered. A box the page refuses still has nothing to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { PROXY_CACHE_SHARE_REVEALED, type ProxyCacheShareState } from "../../tools/nginx-proxy-cache-decision/share"; // the spec

/** The page's Example, as the component joins it (as in the copy's cases). */
const EXAMPLE = [
  "# Ignoring Set-Cookie while the key ignores cookies: the classic leak.", // a comment
  "proxy_cache zone1;", // caching on
  "proxy_cache_valid 200 10m;", // a lifetime
  "proxy_ignore_headers Set-Cookie;", // the mistake
  "", // a blank line
  "request GET /account", // the request
  "request_header Cookie: session=abc", // its cookie
  "", // a blank line
  "response 200", // the response
  "response_header Set-Cookie: id=1", // its cookie
].join("\n"); // as the component holds it

/** The cases. */
export const NGINX_PROXY_CACHE_REVEALED_SHARE_CASES = defineShareCases<ProxyCacheShareState, ProxyCacheShareState>({
  spec: PROXY_CACHE_SHARE_REVEALED, // the spec
  variant: "revealed", // registers as nginx-proxy-cache-decision:revealed
  accept: [
    { id: "example-as-typed", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the cookie values included, by choice
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing typed
    { id: "refused", state: { input: "request GET /" } }, // the page's error: no switch, no link
  ],
  blocked: [],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
