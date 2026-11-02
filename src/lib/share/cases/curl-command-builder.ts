// ============================================================================
// src/lib/share/cases/curl-command-builder.ts
// ----------------------------------------------------------------------------
// Share cases of the curl command builder: a form, so the link carries named
// values only (ROLLOUT 11.3), of the copy with every credential replaced by
// REDACTED (the tool's own share vectors pin the copy and that it builds the
// same flags and warnings). Defaults are left out; an unknown choice, a bad
// switch or a misshapen row makes the share malformed; a form whose command
// still holds a secret no rule can name gets no link.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { CURL_BUILDER_SHARE, type CurlBuilderShareState } from "../../tools/curl-command-builder/share"; // the spec and its state
import { SHARE_VECTORS } from "../../tools/curl-command-builder/golden-vectors"; // the tool's own share vectors
import type { BuilderState } from "../../tools/curl-command-builder/compute"; // the form

/** A share vector's form, by name. */
const form = (name: string): BuilderState => SHARE_VECTORS.find((v) => v.name === name)!.input; // verbatim

/** The cases. */
export const CURL_BUILDER_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<CurlBuilderShareState, BuilderState>>({ // typed, so the cases check as one list
  spec: CURL_BUILDER_SHARE, // the spec
  accept: [ // round trips: form, link, form again (the copy)
    {
      id: "https-example", // the https Example: nothing to replace
      state: { form: form("share-example"), built: true },
      params: { host: "api.example.com", path: "/v1/users", data: '{"name":"Alice"}', method: "POST", headers: "Content-Type\tapplication/json", compressed: "1" },
      restored: { protocol: "https", host: "api.example.com", path: "/v1/users", data: '{"name":"Alice"}', method: "POST", headers: [{ name: "Content-Type", value: "application/json" }], compressed: true },
    },
    {
      id: "every-credential", // the password field, header credentials, cookies, a proxy password, a query token, a JSON password
      state: { form: form("share-every-credential"), built: true },
      params: { host: "api.example.com", path: "/v1/me?access_token=REDACTED", data: '{"username":"alice","password":"REDACTED"}', user: "alice", pass: "REDACTED", cookie: "session=REDACTED; theme=REDACTED", proxy: "http://proxyuser:REDACTED@proxy.example.com:3128", headers: "Authorization\tBearer REDACTED\nX-API-Key\tREDACTED\nAccept\tapplication/json" },
      restored: { protocol: "https", host: "api.example.com", path: "/v1/me?access_token=REDACTED", data: '{"username":"alice","password":"REDACTED"}', user: "alice", pass: "REDACTED", cookie: "session=REDACTED; theme=REDACTED", proxy: "http://proxyuser:REDACTED@proxy.example.com:3128", headers: [{ name: "Authorization", value: "Bearer REDACTED" }, { name: "X-API-Key", value: "REDACTED" }, { name: "Accept", value: "application/json" }] },
      mustNotContain: SHARE_VECTORS.find((v) => v.name === "share-every-credential")!.secrets,
    },
    {
      id: "form-fields", // a secret-named form field loses its value; a file keeps its path
      state: { form: form("share-form-fields"), built: true },
      params: { host: "auth.example.com", path: "/token", form: "client_id\ts6BhdRkqt3\t0\nclient_secret\tREDACTED\t0\nkey_file\tkey.pem\t1" },
      restored: { protocol: "https", host: "auth.example.com", path: "/token", form: [{ name: "client_id", value: "s6BhdRkqt3" }, { name: "client_secret", value: "REDACTED" }, { name: "key_file", value: "key.pem", isFile: true }] },
      mustNotContain: ["7Fjfp0ZBr1KtDRbnfVdmIw"],
    },
    {
      id: "ftp-host-userinfo", // another protocol, a password before the host, an output choice
      state: { form: form("share-host-userinfo"), built: true },
      params: { protocol: "ftp", host: "alice:REDACTED@ftp.example.com", path: "/pub/report.pdf", output: "remoteName" },
      restored: { protocol: "ftp", host: "alice:REDACTED@ftp.example.com", path: "/pub/report.pdf", output: "remoteName" },
      mustNotContain: ["s3cr3t"],
    },
    {
      id: "head-switches-tab", // HEAD (the -I switch), a version, switches, and a tab in a one-line field
      state: { form: { protocol: "https", host: "x.example", headOnly: true, httpVersion: "http2", verbose: true, insecure: true, userAgent: "my\tagent" }, built: true },
      params: { host: "x.example", method: "HEAD", httpversion: "http2", useragent: "my agent", verbose: "1", insecure: "1" },
      restored: { protocol: "https", host: "x.example", headOnly: true, httpVersion: "http2", userAgent: "my agent", verbose: true, insecure: true },
    },
    {
      id: "smtp-envelope", // the mail envelope: the recipients as the field writes them
      state: { form: { protocol: "smtp", host: "mail.example.com", mailFrom: "alice@example.com", mailRcpt: ["bob@example.com", "carol@example.com"], upload: "message.eml" }, built: true },
      params: { protocol: "smtp", host: "mail.example.com", upload: "message.eml", mailfrom: "alice@example.com", mailrcpt: "bob@example.com, carol@example.com" },
      restored: { protocol: "smtp", host: "mail.example.com", upload: "message.eml", mailFrom: "alice@example.com", mailRcpt: ["bob@example.com", "carol@example.com"] },
    },
  ],
  arrive: [ // decode only: defaults for what a link leaves out
    { id: "host-only", values: { host: "a.example" }, restored: { protocol: "https", host: "a.example" } }, // https, GET, nothing else
    { id: "switch-off", values: { host: "a.example", verbose: "0" }, restored: { protocol: "https", host: "a.example" } }, // 0 is off
  ],
  empty: [ // nothing to share
    { id: "no-host", state: { form: { protocol: "https" }, built: false } }, // the page's starting form: no command yet
  ],
  blocked: [ // a secret no rule can name, found in the command built from the copy
    { id: "token-in-path", state: { form: form("share-refused-token-in-path"), built: true }, code: "secret" }, // a JWT in the path
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "unknown-protocol", values: { protocol: "gopherx", host: "a.example" } }, // not one of the 27
    { id: "unknown-method", values: { host: "a.example", method: "FETCH" } }, // not in the select
    { id: "default-method", values: { host: "a.example", method: "GET" } }, // the default is never written
    { id: "unknown-version", values: { host: "a.example", httpversion: "http9" } }, // not in the select
    { id: "header-one-cell", values: { host: "a.example", headers: "Accept" } }, // a row needs a name and a value
    { id: "form-two-cells", values: { host: "a.example", form: "a\tb" } }, // a row needs three cells
    { id: "form-bad-file", values: { host: "a.example", form: "a\tb\tyes" } }, // the file cell is 1 or 0
    { id: "unknown-output", values: { host: "a.example", output: "stdout" } }, // the default is never written
    { id: "bad-switch", values: { host: "a.example", verbose: "yes" } }, // a switch is 1 or 0
    { id: "bad-urlencode", values: { host: "a.example", urlencode: "0" } }, // written only when on
  ],
}));
