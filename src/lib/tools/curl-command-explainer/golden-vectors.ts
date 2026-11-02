// ============================================================================
// src/lib/tools/curl-command-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Locked cases: each curl command has expected parse facts. verifyVectors()
// checks method inference, URL parsing, header/body handling, and that each
// translation contains the load-bearing substrings.
//
// 2026-10-27: share vectors added (SHARE_VECTORS, the copy a Share results
// link carries, made by shareableCurl), so the set id moved from
// "curl-command-explainer/2026-07-01" (scripts/api-sync.json records it; the
// re-check is in the wave's notes).
//
// 2026-11-01: every option curl gives an argument now takes it (the engine's
// part 2a), so -U, -E, --oauth2-bearer and the rest no longer hand their value
// to the URL; vectors pin that reading (the man page's own examples where it
// has one, read 2026-11-01 at https://curl.se/docs/manpage.html), --json,
// --url-query, and an AWS SigV4 Authorization in a share copy. The set id moved
// from "curl-command-explainer/2026-10-27".
// ============================================================================

import { parseCurl, shareableCurl, type CurlParse } from "./compute";

export const SET_ID = "curl-command-explainer/2026-11-01b"; // b (01/11/2026, evening): -u as Authorization: Basic in the fetch and raw HTTP translations, HTTPie -a

interface Vector {
  name: string;
  input: string;
  check: (p: ReturnType<typeof parseCurl>) => string | null; // null = pass, else message
}

export const VECTORS: Vector[] = [
  {
    name: "simple-get",
    input: "curl https://api.example.com/users",
    check: (p) =>
      !p.ok ? "should parse"
      : p.method !== "GET" ? "method should be GET"
      : !p.methodInferred ? "GET should be inferred"
      : p.urlParts?.host !== "api.example.com" ? "host wrong"
      : p.urlParts?.path !== "/users" ? "path wrong"
      : null,
  },
  {
    name: "post-json-d",
    input: `curl -X POST https://api.example.com/users -H "Content-Type: application/json" -d '{"name":"Alice"}'`,
    check: (p) =>
      p.method !== "POST" ? "method POST"
      : p.methodInferred ? "method explicit, not inferred"
      : !p.body?.looksJson ? "should detect JSON body"
      : p.body?.contentTypeImplicit ? "content-type was explicit"
      : !p.translations.fetch.includes(`method: 'POST'`) ? "fetch missing method"
      : !p.translations.fetch.includes("name") ? "fetch missing body"
      : !p.translations.python.includes("requests.post(") ? "python missing post"
      : null,
  },
  {
    name: "infer-post-from-data",
    input: `curl https://x.test/api -d 'a=1&b=2'`,
    check: (p) =>
      p.method !== "POST" ? "should infer POST from -d"
      : !p.methodInferred ? "should be inferred"
      : p.body?.contentType !== "application/x-www-form-urlencoded" ? "default CT wrong"
      : !p.body?.contentTypeImplicit ? "CT should be implicit"
      : null,
  },
  {
    name: "bearer-auth-header",
    input: `curl https://api.test/me -H "Authorization: Bearer abc123"`,
    check: (p) =>
      p.auth?.kind !== "bearer" ? "should detect bearer"
      : p.auth?.token !== "abc123" ? "token wrong"
      : null,
  },
  {
    name: "basic-auth-u",
    input: `curl -u alice:secret https://api.test/private`,
    check: (p) =>
      p.auth?.kind !== "basic" ? "should detect basic"
      : p.auth?.user !== "alice" ? "user wrong"
      : p.auth?.token !== "secret" ? "pass wrong"
      : !p.translations.python.includes(`auth=("alice", "secret")`) ? "python auth missing"
      : null,
  },
  // -u in the other translations (01/11/2026): Basic is curl's default method (curl manual, --basic, read 2026-11-01),
  // so the request carries "Authorization: Basic" and the Base64 of "alice:secret" (RFC 7617 section 2), computed
  // independently: YWxpY2U6c2VjcmV0. HTTPie writes it with its own -a; requests with its own auth= (unchanged).
  {
    name: "basic-auth-u-translations",
    input: `curl -u alice:secret https://api.test/private`,
    check: (p) =>
      !p.translations.fetch.includes("'Authorization': 'Basic YWxpY2U6c2VjcmV0'") ? "fetch Basic header missing"
      : !p.translations.http.includes("Authorization: Basic YWxpY2U6c2VjcmV0") ? "raw HTTP Basic header missing"
      : !p.translations.httpie.startsWith("http -a alice:secret GET https://api.test/private") ? `httpie -a missing: ${p.translations.httpie}`
      : p.translations.python.includes("Authorization") ? "python must use auth=, not a header"
      : null,
  },
  // UTF-8 user-pass (RFC 7617 section 2.1 allows UTF-8; curl takes the bytes as given): "josé:pá ss" is
  // am9zw6k6cMOhIHNz (computed independently with Python's base64 over the UTF-8 bytes).
  {
    name: "basic-auth-u-utf8",
    input: `curl -u "josé:pá ss" https://api.test/`,
    check: (p) => (!p.translations.http.includes("Authorization: Basic am9zw6k6cMOhIHNz") ? `UTF-8 Base64 wrong: ${p.translations.http}` : null),
  },
  // Username only: curl prompts for the password, so no Basic field can be written; HTTPie's -a with the user prompts too.
  {
    name: "basic-auth-u-prompt",
    input: `curl -u alice https://api.test/`,
    check: (p) =>
      p.translations.fetch.includes("Authorization") || p.translations.http.includes("Authorization") ? "no field without a password"
      : !p.translations.httpie.startsWith("http -a alice GET") ? `httpie -a alice missing: ${p.translations.httpie}`
      : null,
  },
  // Another method chosen: --digest answers a challenge and sends no Basic field up front (curl manual, --digest);
  // HTTPie has its own Digest ("http -A digest -a username:password", httpie.io/docs/cli, read 2026-11-01).
  {
    name: "basic-auth-u-digest",
    input: `curl --digest -u alice:secret https://api.test/`,
    check: (p) =>
      p.translations.http.includes("Authorization") ? "digest must not send Basic"
      : !p.translations.httpie.startsWith("http -A digest -a alice:secret GET") ? `httpie digest wrong: ${p.translations.httpie}`
      : !p.translations.python.includes(`auth=HTTPDigestAuth("alice", "secret")`) ? "python HTTPDigestAuth missing"
      : !p.translations.python.includes("from requests.auth import HTTPDigestAuth") ? "python import missing"
      : null,
  },
  // NTLM: no Basic field, and no HTTPie flag (HTTPie's core has Basic, Digest and Bearer only).
  {
    name: "basic-auth-u-ntlm",
    input: `curl --ntlm -u alice:secret https://api.test/`,
    check: (p) =>
      p.translations.http.includes("Authorization") ? "ntlm must not send Basic"
      : p.translations.httpie.includes(" -a ") ? "no -a for ntlm"
      : p.translations.python.includes("auth=") ? "no Basic tuple for ntlm in requests"
      : null,
  },
  // An Authorization written with -H wins: one field, the one written.
  {
    name: "basic-auth-u-header-wins",
    input: `curl -u alice:secret -H "Authorization: Token abc" https://api.test/`,
    check: (p) =>
      (p.translations.http.match(/Authorization:/g) ?? []).length !== 1 ? "exactly one Authorization"
      : !p.translations.http.includes("Authorization: Token abc") ? "the -H field must stay"
      : null,
  },
  {
    name: "clustered-short-flags-and-attached",
    input: `curl -sSL -XDELETE https://api.test/item/5`,
    check: (p) =>
      p.method !== "DELETE" ? "-XDELETE attached value"
      : !p.options.some((o) => o.id === "location") ? "-L in cluster missing"
      : !p.options.some((o) => o.id === "silent") ? "-s in cluster missing"
      : null,
  },
  {
    name: "insecure-and-plaintext-warnings",
    input: `curl -k http://10.0.0.1/status`,
    check: (p) =>
      !p.warnings.includes("insecureTls") ? "missing insecureTls warning"
      : !p.warnings.includes("plaintextHttp") ? "missing plaintextHttp warning"
      : null,
  },
  {
    name: "multipart-form",
    input: `curl -F name=Alice -F avatar=@pic.png https://api.test/upload`,
    check: (p) =>
      p.method !== "POST" ? "form should infer POST"
      : p.body?.kind !== "form" ? "body should be form"
      : (p.body?.fields?.length ?? 0) !== 2 ? "two fields"
      : !p.body?.fields?.some((f) => f.isFile && f.name === "avatar") ? "file field not flagged"
      : !p.translations.fetch.includes("FormData") ? "fetch missing FormData"
      : null,
  },
  {
    name: "query-string-parsed",
    input: `curl "https://api.test/search?q=hello world&page=2"`,
    check: (p) =>
      (p.urlParts?.query.length ?? 0) !== 2 ? "should parse 2 query params"
      : p.urlParts?.query[0].value !== "hello world" ? "should decode query value"
      : null,
  },
  // 2026-11-01: options that take an argument, read as curl reads them.
  {
    name: "proxy-user-takes-its-value",
    input: `curl -U smith:secret -x http://proxy.example.com:3128 https://example.com/`,
    check: (p) =>
      !p.ok ? "should parse"
      : p.urlParts?.host !== "example.com" ? "-U's value read as the URL"
      : !p.options.some((o) => o.id === "proxy-user" && o.raw === "-U" && o.value === "smith") ? "-U should show its user"
      : p.options.some((o) => (o.value ?? "").includes("secret")) ? "-U's password shown"
      : p.options.some((o) => o.id === "unknown") ? "nothing unknown"
      : null,
  },
  {
    name: "proxy-user-long-before-url",
    input: `curl --proxy-user smith:secret https://example.com/`,
    check: (p) =>
      p.urlParts?.host !== "example.com" ? "--proxy-user's value read as the URL"
      : !p.options.some((o) => o.id === "proxy-user" && o.value === "smith") ? "--proxy-user should show its user"
      : null,
  },
  {
    name: "oauth2-bearer-is-bearer-auth",
    input: `curl --oauth2-bearer "mF_9.B5f-4.1JqM" https://example.com`,
    check: (p) =>
      p.urlParts?.host !== "example.com" ? "--oauth2-bearer's token read as the URL"
      : p.auth?.kind !== "bearer" || p.auth.token !== "mF_9.B5f-4.1JqM" ? "should be Bearer authentication"
      : !p.options.some((o) => o.id === "oauth2-bearer" && o.value === undefined) ? "--oauth2-bearer explained without its token"
      : p.headers.length !== 0 ? "no header was written"
      : !p.translations.fetch.includes(`'Authorization': 'Bearer mF_9.B5f-4.1JqM'`) ? "fetch should send the Bearer field"
      : !p.translations.http.includes("Authorization: Bearer mF_9.B5f-4.1JqM") ? "raw HTTP should send the Bearer field"
      : !p.translations.python.includes(`"Authorization": "Bearer mF_9.B5f-4.1JqM"`) ? "python should send the Bearer field"
      : null,
  },
  {
    name: "oauth2-bearer-gives-way-to-header",
    input: `curl --oauth2-bearer tokA -H "Authorization: Bearer tokB" https://api.test/me`,
    check: (p) =>
      p.auth?.token !== "tokB" ? "the -H field wins"
      : p.translations.fetch.includes("tokA") || p.translations.http.includes("tokA") ? "curl's own field gives way"
      : null,
  },
  {
    name: "cert-pass-and-key",
    input: `curl -E client.pem:s3cret --pass keyphrase --key client.key https://example.com/`,
    check: (p) =>
      p.urlParts?.host !== "example.com" ? "a value read as the URL"
      : !p.options.some((o) => o.id === "cert" && o.raw === "-E" && o.value === "client.pem") ? "-E should show its certificate only"
      : !p.options.some((o) => o.id === "pass" && o.value === undefined) ? "--pass explained without its passphrase"
      : !p.options.some((o) => o.id === "other" && o.raw === "--key" && o.value === "client.key") ? "--key should be named with its file"
      : p.options.some((o) => /s3cret|keyphrase/.test(o.value ?? "")) ? "a secret shown"
      : null,
  },
  {
    name: "cert-escaped-colon",
    input: `curl --cert 'my\\:cert.pem:pw' https://example.com/`, // the string holds my\:cert.pem:pw
    check: (p) =>
      !p.options.some((o) => o.id === "cert" && o.value === "my\\:cert.pem") ? "the escaped colon belongs to the certificate"
      : null,
  },
  {
    name: "json-body-and-headers",
    input: `curl --json '{ "drink": "coffee" }' https://example.com`,
    check: (p) =>
      p.urlParts?.host !== "example.com" ? "--json's data read as the URL"
      : p.method !== "POST" || !p.methodInferred ? "--json implies POST"
      : p.body?.kind !== "json" || p.body.text !== `{ "drink": "coffee" }` ? "the JSON body"
      : p.body.contentType !== "application/json" || p.body.contentTypeImplicit ? "Content-Type from --json"
      : p.headers.map((h) => h.name + ": " + h.value).join("|") !== "Content-Type: application/json|Accept: application/json" ? "the two headers"
      : !p.translations.fetch.includes(`'Accept': 'application/json'`) ? "fetch should send Accept"
      : null,
  },
  {
    name: "json-pieces-concatenated",
    input: `curl --json '{ "drink":' --json ' "coffee" }' https://example.com`,
    check: (p) =>
      p.body?.text !== `{ "drink": "coffee" }` ? "the pieces are concatenated, no &"
      : !p.body.looksJson ? "the whole is JSON"
      : null,
  },
  {
    name: "json-header-overridden",
    input: `curl --json '{"a":1}' -H "Content-Type: application/vnd.api+json" https://example.com`,
    check: (p) =>
      p.body?.contentType !== "application/vnd.api+json" ? "-H overrides the Content-Type"
      : p.headers.filter((h) => h.name.toLowerCase() === "content-type").length !== 1 ? "one Content-Type"
      : findAccept(p) !== "application/json" ? "Accept still added"
      : null,
  },
  {
    name: "url-query-appended",
    input: `curl --url-query name=val --url-query "+name=%20foo" --url-query "=hello world" --url-query name@file "https://example.com/search?q=1"`,
    check: (p) =>
      p.url !== "https://example.com/search?q=1&name=val&name=%20foo&hello+world" ? "the query, as curl builds it: " + p.url
      : (p.urlParts?.query ?? []).map((q) => q.name + "=" + q.value).join("|") !== "q=1|name=val|name= foo|hello world=" ? "the parameters, decoded"
      : p.options.filter((o) => o.id === "url-query").length !== 4 ? "each --url-query named, the file one included"
      : null,
  },
  {
    name: "other-options-take-their-value",
    input: `curl --cacert ca.pem -w '%{http_code}' -o /dev/null --proxy-header "X-First-Name: Joe" --variable name=value https://example.com/`,
    check: (p) =>
      p.urlParts?.host !== "example.com" ? "a value read as the URL"
      : !p.options.some((o) => o.id === "other" && o.raw === "--cacert" && o.value === "ca.pem") ? "--cacert with its file"
      : !p.options.some((o) => o.id === "other" && o.raw === "-w" && o.value === "%{http_code}") ? "-w with its format"
      : !p.options.some((o) => o.id === "proxy-header" && o.value === "X-First-Name: Joe") ? "--proxy-header with its field"
      : !p.options.some((o) => o.id === "variable" && o.value === "name=value") ? "--variable with its text"
      : p.options.some((o) => o.id === "unknown") ? "nothing unknown"
      : null,
  },
  {
    name: "switch-takes-nothing",
    input: `curl --no-progress-meter https://example.com/`,
    check: (p) =>
      p.urlParts?.host !== "example.com" ? "a switch took the URL"
      : !p.options.some((o) => o.id === "unknown" && o.raw === "--no-progress-meter") ? "a switch this page does not explain stays unknown"
      : null,
  },
  {
    name: "not-a-curl-command",
    input: `wget https://example.com/file.zip`,
    check: (p) =>
      p.ok ? "should not parse wget as curl"
      : p.errorId !== "notCurl" ? "should flag notCurl"
      : null,
  },
];

/** The Accept field of a parse, if any. */
function findAccept(p: CurlParse): string | undefined {
  return p.headers.find((h) => h.name.toLowerCase() === "accept")?.value; // the first Accept
} // findAccept

/** A share vector: a command, the copy a link carries, how many values it replaces, and what must not be in it. */
export interface CurlShareVector {
  /** The vector's name. */
  name: string;
  /** What it shows. */
  note: string;
  /** The command as pasted. */
  input: string;
  /** The copy, byte for byte (null for a refusal). */
  expect: string | null;
  /** How many values are replaced. */
  redacted: number;
  /** Strings the copy must not hold. */
  secrets: string[];
  /** For a refusal: the rule of the secret left in the copy. */
  residual?: "pem-private-key" | "jwt" | "url-password";
}

/** A JWS whose protected header is {"alg":"HS256"} (RFC 7515 section 7.1's compact form). */
const JWS = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.c2lnbmF0dXJl"; // header.payload.signature

/** The share vectors (2026-10-27; two more 2026-11-01). */
export const SHARE_VECTORS: readonly CurlShareVector[] = Object.freeze([
  {
    name: "share-example-bearer",
    note: "The page's Example: the Bearer credentials go, the scheme and the JSON body stay (RFC 9110 11.6.2)",
    input: `curl -X POST https://api.example.com/v1/users \\\n  -H "Authorization: Bearer tok_abc123" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Alice","role":"admin"}'`,
    expect: `curl -X POST https://api.example.com/v1/users \\\n  -H "Authorization: Bearer REDACTED" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Alice","role":"admin"}'`,
    redacted: 1,
    secrets: ["tok_abc123"],
  },
  {
    name: "share-user-cookies-query",
    note: "-u keeps the user (split on the first colon), -b loses every cookie value, access_token leaves the query (RFC 6750 2.3)",
    input: `curl -u alice:s3cr3t -b "session=38afes7a8; theme=dark" "https://api.example.com/v1/me?access_token=mF_9.B5f-4.1JqM&fields=name"`,
    expect: `curl -u alice:REDACTED -b "session=REDACTED; theme=REDACTED" "https://api.example.com/v1/me?access_token=REDACTED&fields=name"`,
    redacted: 4,
    secrets: ["s3cr3t", "38afes7a8", "mF_9.B5f-4.1JqM"],
  },
  {
    name: "share-bearer-proxy-and-proxy-user",
    note: "--oauth2-bearer, a proxy URL's password and -U's password (the curl man page), read as curl reads them (named share-options-this-page-does-not-read until 2026-11-01, when the explanation came to read them too)",
    input: `curl https://example.com/ --oauth2-bearer "mF_9.B5f-4.1JqM" -x http://proxyuser:proxypass@proxy.example.com:3128 -U smith:secret`,
    expect: `curl https://example.com/ --oauth2-bearer "REDACTED" -x http://proxyuser:REDACTED@proxy.example.com:3128 -U smith:REDACTED`,
    redacted: 3,
    secrets: ["mF_9.B5f-4.1JqM", "proxypass", "smith:secret"],
  },
  {
    name: "share-aws-sigv4-header",
    note: "AWS SigV4 (the IAM guide's Authorization, read 2026-11-01): the access key ID and the signature go, the credential scope and SignedHeaders stay (2026-11-01)",
    input: `curl -H "Authorization: AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20220830/us-east-1/ec2/aws4_request, SignedHeaders=host;x-amz-date, Signature=calculated-signature" -H "X-Amz-Date: 20220830T123600Z" "https://ec2.amazonaws.com/?Action=DescribeInstances&Version=2016-11-15"`,
    expect: `curl -H "Authorization: AWS4-HMAC-SHA256 Credential=REDACTED/20220830/us-east-1/ec2/aws4_request, SignedHeaders=host;x-amz-date, Signature=REDACTED" -H "X-Amz-Date: 20220830T123600Z" "https://ec2.amazonaws.com/?Action=DescribeInstances&Version=2016-11-15"`,
    redacted: 2,
    secrets: ["AKIAIOSFODNN7EXAMPLE", "calculated-signature"],
  },
  {
    name: "share-key-account-and-preproxy",
    note: "--httpsig-key and --ftp-account go whole; any other option's value is read as a URL, so a pre-proxy's password goes (2026-11-01)",
    input: `curl --httpsig-key 9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60 --ftp-account mr.robot --preproxy socks5://alice:wonderland@socks.example:1080 https://example.com/`,
    expect: `curl --httpsig-key REDACTED --ftp-account REDACTED --preproxy socks5://alice:REDACTED@socks.example:1080 https://example.com/`,
    redacted: 3,
    secrets: ["9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60", "mr.robot", "wonderland"],
  },
  {
    name: "share-token-request",
    note: "A token request: code (RFC 6749 4.1.3), code_verifier (RFC 7636 4.5) and client_secret (RFC 6749 2.3.1) go; grant_type and client_id stay",
    input: "curl -X POST https://server.example.com/token -d grant_type=authorization_code -d code=SplxlOBeZQQYbYS6WxSbIA -d code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk -d client_id=s6BhdRkqt3 -d client_secret=7Fjfp0ZBr1KtDRbnfVdmIw",
    expect: "curl -X POST https://server.example.com/token -d grant_type=authorization_code -d code=REDACTED -d code_verifier=REDACTED -d client_id=s6BhdRkqt3 -d client_secret=REDACTED",
    redacted: 3,
    secrets: ["SplxlOBeZQQYbYS6WxSbIA", "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk", "7Fjfp0ZBr1KtDRbnfVdmIw"],
  },
  {
    name: "share-json-password",
    note: "A JSON body: the password member's value goes, the JSON stays valid",
    input: `curl https://api.example.com/login -H "Content-Type: application/json" -d '{"username":"alice","password":"hunter2"}'`,
    expect: `curl https://api.example.com/login -H "Content-Type: application/json" -d '{"username":"alice","password":"REDACTED"}'`,
    redacted: 1,
    secrets: ["hunter2"],
  },
  {
    name: "share-escaped-password",
    note: "A password written with an escape cannot be replaced in place: the word is re-quoted whole",
    input: `curl -u "alice:pa\\"ss" https://x.example/`,
    expect: "curl -u alice:REDACTED https://x.example/",
    redacted: 1,
    secrets: ['pa"ss', 'pa\\"ss'],
  },
  {
    name: "share-basic-keeps-user",
    note: "Basic credentials: base64 of user-id \":\" password (RFC 7617 section 2); the user-id stays",
    input: `curl -H "Authorization: Basic YWxpY2U6czNjcjN0" https://api.example.com/`,
    expect: `curl -H "Authorization: Basic YWxpY2U6UkVEQUNURUQ=" https://api.example.com/`,
    redacted: 1,
    secrets: ["YWxpY2U6czNjcjN0", "s3cr3t"],
  },
  {
    name: "share-jwt-keeps-header",
    note: "A JWT in Authorization keeps its protected header; the claims and the signature go",
    input: `curl -H "Authorization: Bearer ${JWS}" https://api.example.com/`,
    expect: `curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.REDACTED.REDACTED" https://api.example.com/`,
    redacted: 1,
    secrets: ["eyJzdWIiOiIxMjM0In0", "c2lnbmF0dXJl"],
  },
  {
    name: "share-nothing-to-replace",
    note: "A command with no credential: the copy is the command",
    input: "curl -sSL https://example.com/",
    expect: "curl -sSL https://example.com/",
    redacted: 0,
    secrets: [],
  },
  {
    name: "share-refused-token-in-path",
    note: "A JWT in a URL path has no name to be found by: the net finds it, and no link is offered",
    input: `curl https://api.example.com/v1/sessions/${JWS}`,
    expect: null,
    redacted: 0,
    secrets: [],
    residual: "jwt",
  },
]);

/** What the receiving page reads, without the values the copy replaces: the request's parts, names, kinds and warnings. */
function readingShape(p: CurlParse): string {
  return JSON.stringify([p.ok, p.errorId ?? null, p.method, p.methodInferred, p.urlParts?.scheme, p.urlParts?.host, p.urlParts?.port, p.urlParts?.path, p.urlParts?.query.map((q) => q.name), !!p.urlParts?.userinfo, p.headers.map((h) => h.name), p.auth?.kind ?? null, p.auth?.user ?? null, p.body?.kind ?? null, p.body?.contentType ?? null, p.body?.contentTypeImplicit ?? null, p.body?.looksJson ?? null, (p.body?.fields ?? []).map((f) => [f.name, f.isFile]), p.cookies !== undefined, p.options.map((o) => [o.id, o.raw]), p.warnings]); // compact
} // readingShape

export function verifyVectors(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const v of VECTORS) {
    try {
      const msg = v.check(parseCurl(v.input));
      if (msg) failures.push(`${v.name}: ${msg}`);
    } catch (e) {
      failures.push(`${v.name}: threw ${(e as Error).message}`);
    }
  }
  // The share vectors: the copy, the count, no secret in it, the same reading on the receiving page, a stable copy.
  for (const v of SHARE_VECTORS) {
    try {
      const out = shareableCurl(v.input); // the copy
      if (v.residual) { if (out.residual?.rule !== v.residual) failures.push(`${v.name}: residual ${out.residual?.rule ?? "none"} != ${v.residual}`); continue; } // a refusal
      if (out.residual) failures.push(`${v.name}: unexpected residual ${out.residual.rule}`); // nothing may be left
      if (out.text !== v.expect) failures.push(`${v.name}: copy ${JSON.stringify(out.text)}`); // byte for byte
      if (out.redacted !== v.redacted) failures.push(`${v.name}: redacted ${out.redacted} != ${v.redacted}`); // the count
      for (const secret of v.secrets) if (out.text.includes(secret)) failures.push(`${v.name}: the copy contains ${JSON.stringify(secret)}`); // never travels
      if (readingShape(parseCurl(v.input)) !== readingShape(parseCurl(out.text))) failures.push(`${v.name}: the copy reads differently`); // the same parts
      const again = shareableCurl(out.text); // the copy of the copy
      if (again.text !== out.text || again.redacted !== 0) failures.push(`${v.name}: the copy of the copy differs`); // stable
    } catch (e) {
      failures.push(`${v.name}: threw ${(e as Error).message}`);
    }
  }
  return { ok: failures.length === 0, failures };
}
