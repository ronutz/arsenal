// ============================================================================
// src/lib/share/cases/nginx-location-matcher.ts
// ----------------------------------------------------------------------------
// Share cases of the NGINX location matcher (2026-11-01, wave 4B): the box goes
// as typed once the page has a walk; a token argument is only named in a
// popover line; a JWT in a variable's value blocks the link; a box the page
// refuses (no request line, a bad location) has nothing to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { LOCATION_SHARE, type LocationShareState } from "../../tools/nginx-location-matcher/share"; // the spec

/** The page's Example, as the component joins it. */
const EXAMPLE = [
  "# The classic surprise: /images/ loses to the extension regex below it.", // a comment
  "location / {", // the fallback
  "location /images/ {", // a prefix
  "location ^~ /static/ {", // the early exit
  "location = /favicon.ico {", // exact
  "location ~ \\.(gif|jpg|png)$ {", // a regex
  "location ~* \\.php$ {", // a case-insensitive regex
  "", // a blank line
  "request /images/logo.gif", // the request
].join("\n"); // as the component holds it

/** A predicate location tested with a variable, and a request with an argument named token: a maybe-secret. */
const PREDICATE = "location /\nlocation $arg_preview\nvariable $arg_preview 1\nrequest /docs?preview=1&token=abc123"; // nginx 1.31.5 and later

/** RFC 7519 section 3.1's example JWT (read 2026-11-01). */
const JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // never in a link

/** The cases. */
export const NGINX_LOCATION_SHARE_CASES = defineShareCases<LocationShareState, LocationShareState>({
  spec: LOCATION_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as typed
    { id: "predicate-token-named", state: { input: PREDICATE }, params: { input: PREDICATE }, restored: { input: PREDICATE } }, // a maybe-secret does not block
    { id: "crlf", state: { input: "location = /\r\nrequest /" }, params: { input: "location = /\r\nrequest /" }, restored: { input: "location = /\r\nrequest /" } }, // CR LF line ends kept
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing typed
    { id: "no-request", state: { input: "location / {" } }, // the page's error: nothing to match
    { id: "bad-location", state: { input: "server_name example.com;\nrequest /" } }, // the page's error: not a location line
  ],
  blocked: [
    { id: "jwt-in-variable", state: { input: `location $http_authorization\nvariable $http_authorization Bearer ${JWT}\nrequest /` }, code: "secret" }, // a JWS in a value
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "\n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
