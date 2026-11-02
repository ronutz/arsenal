// ============================================================================
// src/lib/share/cases/user-agent-entropy-analyzer.ts
// ----------------------------------------------------------------------------
// Share cases of the User-Agent entropy analyser (wave 4C, 2026-11-01): the
// link carries the box as typed; a pasted request whose Cookie line or
// Authorization header is a credential by its format gets none. Strings are the
// tool's golden vectors and published credentials (RFC 6265's SID, RFC 7617).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { UA_SHARE, type UaShareState } from "../../tools/user-agent-entropy-analyzer/share"; // the spec

/** The page's Example (golden vector v1). */
const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"; // verbatim
/** Golden vector v6. */
const FIREFOX = "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0"; // verbatim

/** The cases. */
export const UA_SHARE_CASES = defineShareCases<UaShareState, UaShareState>({
  spec: UA_SHARE, // the spec
  accept: [
    { id: "example", state: { input: CHROME }, params: { input: CHROME }, restored: { input: CHROME } }, // as typed
    { id: "firefox-with-a-newline", state: { input: FIREFOX + "\n" }, params: { input: FIREFOX + "\n" }, restored: { input: FIREFOX + "\n" } }, // a trailing line break, as typed
    { id: "maybe-secret-name", state: { input: "MyApp/2.1 (build 77; api_key=placeholder)" }, params: { input: "MyApp/2.1 (build 77; api_key=placeholder)" }, restored: { input: "MyApp/2.1 (build 77; api_key=placeholder)" } }, // a secret-looking name: the link goes, the caution line names it
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing typed
    { id: "not-a-ua", state: { input: "just some random text" } }, // the engine refuses it (golden vector e1)
  ],
  blocked: [
    { id: "pasted-request-with-cookie", state: { input: "GET / HTTP/1.1\nUser-Agent: " + FIREFOX + "\nCookie: SID=31d4d96e407aad42; lang=en-US" }, code: "secret" }, // RFC 6265's session cookie
    { id: "pasted-request-with-basic", state: { input: "User-Agent: curl/8.5.0\nAuthorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==" }, code: "secret" }, // RFC 7617's credentials
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "with-a-credential", values: { input: "User-Agent: curl/8.5.0\nCookie: SID=31d4d96e407aad42" } }, // the encoder never builds one
  ],
});
