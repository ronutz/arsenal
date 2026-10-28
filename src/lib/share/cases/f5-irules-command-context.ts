// ============================================================================
// src/lib/share/cases/f5-irules-command-context.ts
// ----------------------------------------------------------------------------
// Share cases of the iRules command/context explainer: the box goes as pasted
// (an iRule, an event name or a keyword); an iRule with a key or credential
// written out gets no link (code "secret"). These cases also pin the iRule
// secrets check rule by rule (src/lib/tcl84/irule-secrets.ts), with the
// examples of F5's own references where they have one (read 2026-10-27): the
// other iRule tools share the check and pin fewer cases.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { IRULES_COMMAND_CONTEXT_SHARE, type IrulesCommandContextShareState } from "../../tools/f5-irules-command-context/share"; // the spec and its state

/** The page's Example (IrulesCommandContextTool's EXAMPLE). */
const EXAMPLE = `when RULE_INIT {
    set ::debug 1
    set static::api_pool "api_pool"
}
when HTTP_REQUEST priority 400 {
    if { [HTTP::uri] starts_with "/api" } {
        pool api_pool
    }
}
when HTTP_REQUEST {
    HTTP::header insert X-Client [IP::client_addr]
    log local0. "req [HTTP::host][HTTP::uri]"
}`;

/** A token by a secret-looking name: the link is offered, and the caution line names line 2. */
const NAMED_TOKEN = `when RULE_INIT {
    set static::api_token "t-0123456789abcdef"
}
when HTTP_REQUEST {
    HTTP::header insert X-Api-Token $static::api_token
}`;

/** Keys made by AES::key and used by reference only: nothing is written out. */
const KEY_BY_REFERENCE = `when RULE_INIT {
    set static::aes_key [AES::key 256]
}
when HTTP_RESPONSE {
    HTTP::cookie value session [AES::encrypt $static::aes_key [HTTP::cookie value session]]
    HTTP::header replace Authorization "Basic [b64encode "$user:$pass"]"
}`;

/** One state per secret rule (each must give "blocked", code "secret"). */
const SECRETS: readonly (readonly [string, string])[] = [
  ["aes-key-literal", `when SERVER_DATA {\n  set key "AES 128 43047ad71173be644498b98de6a32fe3"\n  set encryptedData [AES::encrypt $key [TCP::payload]]\n}`], // AES::encrypt's own example
  ["aes-key-commented-out", `when RULE_INIT {\n    # set static::k "AES 256 b55c4753cba6adaa0e4ea7640504d9b4b55c4753cba6adaa0e4ea7640504d9b4"\n    set static::k [AES::key 256]\n}`], // a commented-out key is still in the link
  ["aes-key-argument", `when HTTP_REQUEST {\n    set enc [AES::encrypt "my pass phrase" [HTTP::uri]]\n}`], // AES::encrypt: otherwise interpreted as a pass phrase
  ["crypto-keyhex-variable", `when SIP_REQUEST {\n    set key "abed1ddc04fbb05856bca4a0ca60f21e"\n    set iv "d78d86d9084eb9239694c9a733904037"\n    set enc_msisdn [CRYPTO::encrypt -alg aes-128-cbc -keyhex $key -ivhex $iv [SIP::header "MSISDN"]]\n}`], // CRYPTO::encrypt's own example
  ["crypto-sign-literal-key", `when HTTP_REQUEST {\n    set sig [CRYPTO::sign -alg hmac-sha256 -key "k3y-for-hmac" [HTTP::uri]]\n}`], // -key written out
  ["cookie-passphrase", `when HTTP_RESPONSE {\n    HTTP::cookie encrypt session "s3cr3t phrase"\n}`], // HTTP::cookie encrypt <name> <pass phrase>
  ["cookie-passphrase-variable", `when RULE_INIT {\n    set static::cookie_phrase "s3cr3t phrase"\n}\nwhen HTTP_REQUEST {\n    HTTP::cookie decrypt session $static::cookie_phrase\n}`], // set, then used as the pass phrase
  ["authorization-literal", `when HTTP_REQUEST {\n    HTTP::header replace Authorization "Basic dXNlcjpwYXNzd29yZA=="\n}`], // RFC 9110 11.6.2: credentials
  ["authorization-b64encode", `when HTTP_REQUEST {\n    HTTP::header insert lws Authorization "Basic [b64encode admin:changeme]"\n}`], // RFC 7617's user-pass, encoded by the iRule
  ["authorization-header-line", `when CLIENT_ACCEPTED {\n    set req "GET / HTTP/1.1\\r\\nAuthorization: Bearer abc.def.ghi\\r\\n\\r\\n"\n}`], // the site's secrets check: a header line
  ["jwt", `when HTTP_REQUEST {\n    set static::jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl\n}`], // RFC 7515 compact serialisation with "alg"
  ["pem-private-key", `when RULE_INIT {\n    set static::pem {-----BEGIN PRIVATE KEY-----\nMIIBVgIBADANBgkqhkiG9w0BAQEFAASCAUAwggE8AgEAAkEA\n-----END PRIVATE KEY-----}\n}`], // RFC 7468 section 10
  ["url-password", `when HTTP_REQUEST {\n    HTTP::redirect "https://admin:hunter2@intranet.example/"\n}`], // RFC 3986 3.2.1
  ["aws-access-key-id", `when HTTP_REQUEST {\n    HTTP::header insert X-Aws-Id AKIAIOSFODNN7EXAMPLE\n}`], // AWS's documented example ID
];

/** The cases. */
export const IRULES_COMMAND_CONTEXT_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<IrulesCommandContextShareState, IrulesCommandContextShareState>>({ // typed, so the cases check as one list
  spec: IRULES_COMMAND_CONTEXT_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the page's Example
    { id: "event-name", state: { input: "HTTP_REQUEST" }, params: { input: "HTTP_REQUEST" }, restored: { input: "HTTP_REQUEST" } }, // a single event name
    { id: "named-token", state: { input: NAMED_TOKEN }, params: { input: NAMED_TOKEN }, restored: { input: NAMED_TOKEN } }, // a maybe-secret: offered, with the caution naming it
    { id: "key-by-reference", state: { input: KEY_BY_REFERENCE }, params: { input: KEY_BY_REFERENCE }, restored: { input: KEY_BY_REFERENCE } }, // keys and credentials by reference only
    { id: "crlf", state: { input: "when HTTP_REQUEST {\r\n    pool web_pool\r\n}\r\n" }, params: { input: "when HTTP_REQUEST {\r\n    pool web_pool\r\n}\r\n" }, restored: { input: "when HTTP_REQUEST {\r\n    pool web_pool\r\n}\r\n" } }, // line endings as pasted
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // an empty box
    { id: "white-space", state: { input: "  \n\t" } }, // only blanks
  ],
  blocked: SECRETS.map(([id, input]) => ({ id, state: { input }, code: "secret" })), // a key or credential written out: no link
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: " \n " } }, // only blanks
  ],
}));
