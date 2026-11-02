// ============================================================================
// src/lib/share/cases/f5-awaf-request-log-triage.ts
// ----------------------------------------------------------------------------
// Share cases of the AWAF request-log triage: the link carries a copy holding
// only the fields the page reads, in F5's key-value form after the format's
// marker, never the line as pasted (its request with Cookie and Authorization
// headers, its query string, user name, session and host names stay out); a
// credential still in a field the page shows blocks the link; text that is
// not an ASM log line has nothing to copy; a line whose copy would read
// differently (only with hostile values) gets no link either.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { LOG_TRIAGE_SHARE, type LogTriageShareState } from "../../tools/f5-awaf-request-log-triage/share"; // the spec

/** F5's syslog key-value sample (ASM sample event messages; the tool's own vector kv-fields). */
const KV_SAMPLE = 'ASM:unit_hostname="3600.lab.asm.f5net.com",management_ip_address="172.30.0.20",web_application_name="web_app",policy_name="web_app_default",policy_apply_date="2009-18-08 11:14:38",violations="Illegal URL length,Illegal request length,Illegal query string length,Illegal meta character in parameter value,Illegal file type,Illegal URL,Attack signature detected",support_id="5268275531735896872",request_status="blocked",response_code="0",ip_client="192.168.74.169",method="GET",protocol="HTTP",uri="/phpauction/search.php"'; // as F5 prints it
/** Its copy: the fields the page reads, in F5's order. */
const KV_COPY = 'ASM:policy_name="web_app_default",violations="Illegal URL length,Illegal request length,Illegal query string length,Illegal meta character in parameter value,Illegal file type,Illegal URL,Attack signature detected",support_id="5268275531735896872",request_status="blocked",ip_client="192.168.74.169",method="GET",protocol="HTTP",uri="/phpauction/search.php"'; // the host names and the rest left out
/** The page's Example: already only the fields the page reads, so its copy is itself. */
const EXAMPLE = 'ASM:policy_name="web_app_default",violations="Illegal meta character in parameter value,Illegal file type,Attack signature detected",violation_rating="2",support_id="5268275531735896872",request_status="blocked",ip_client="192.168.74.169",method="GET",protocol="HTTP",uri="/phpauction/search.php"'; // verbatim
/** F5's CEF sample (the tool's own vector cef-fields). */
const CEF_SAMPLE = 'CEF:0|F5|ASM|11.3.0|200021069|Automated client access "wget"|5|dvchost=f5networks.bigipasm.test dvc=192.168.73.34 cs1=topaz4-web4 cs1Label=policy_name cs2=/Common/topaz4-web4 cs2Label=http_class_name externalId=18205860747014045723 act=blocked requestMethod=GET app=HTTP cs4=Non-browser Client cs4Label=attack_type suid=86c4f8bf7349cac9 request=/ src=10.4.1.101'; // as F5 prints it
/** Its copy, after a bare CEF header so the page still shows the CEF format. */
const CEF_COPY = 'CEF:0|F5|ASM|||||policy_name="topaz4-web4",support_id="18205860747014045723",request_status="blocked",ip_client="10.4.1.101",method="GET",protocol="HTTP",uri="/",attack_type="Non-browser Client"'; // the device and the session left out
/** RFC 6265 section 4.2.1's session identifier and RFC 7617's Basic credentials ("Aladdin:open sesame"), standing in for live ones. */
const SID = "31d4d96e407aad42"; // never in a link
/** The Basic credentials. */
const BASIC = "QWxhZGRpbjpvcGVuIHNlc2FtZQ=="; // never in a link
/** A rated line whose request field holds the whole request (F5's field reference: "Request string sent by client"). */
const FULL_REQUEST = `ASM:policy_name="shop",violations="Attack signature detected",violation_rating="5",support_id="1820586074701404571",request_status="blocked",ip_client="198.51.100.23",method="POST",protocol="HTTPS",query_string="token=4f3c2b1a9e",username="aladdin",session_id="a9141b68ac7b4958",uri="/login",request="POST /login HTTP/1.1\\r\\nHost: shop.example.com\\r\\nCookie: SID=${SID}\\r\\nAuthorization: Basic ${BASIC}\\r\\n\\r\\nuser=aladdin&pass=open+sesame"`; // the request with its headers and body
/** Its copy. */
const FULL_REQUEST_COPY = 'ASM:policy_name="shop",violations="Attack signature detected",violation_rating="5",support_id="1820586074701404571",request_status="blocked",ip_client="198.51.100.23",method="POST",protocol="HTTPS",uri="/login"'; // the fields the page reads
/** RFC 7519 section 3.1's example JWT (read 2026-10-27), standing in for a live token. */
const RFC7519_JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // three base64url segments

/** The cases. */
export const F5_AWAF_REQUEST_LOG_SHARE_CASES = defineShareCases<LogTriageShareState, LogTriageShareState>({
  spec: LOG_TRIAGE_SHARE, // the spec
  accept: [
    { id: "f5-kv-sample", state: { input: KV_SAMPLE }, params: { input: KV_COPY }, restored: { input: KV_COPY }, mustNotContain: ["3600.lab.asm.f5net.com", "172.30.0.20", "2009-18-08"] }, // the device's names stay out
    { id: "example-is-its-copy", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // only fields the page reads: the copy is the paste
    { id: "f5-cef-sample", state: { input: CEF_SAMPLE }, params: { input: CEF_COPY }, restored: { input: CEF_COPY }, mustNotContain: ["f5networks.bigipasm.test", "192.168.73.34", "86c4f8bf7349cac9", "Automated client access"] }, // the device and the session stay out
    { id: "request-with-credentials", state: { input: FULL_REQUEST }, params: { input: FULL_REQUEST_COPY }, restored: { input: FULL_REQUEST_COPY }, mustNotContain: [SID, BASIC, "open+sesame", "4f3c2b1a9e", "a9141b68ac7b4958", "aladdin", "shop.example.com"] }, // the cookie, the credentials, the body, the query, the user and the session never travel
  ],
  empty: [
    { id: "blank", state: { input: " \n " } }, // nothing pasted
  ],
  blocked: [
    { id: "not-a-log-line", state: { input: "just some random text without asm fields" }, code: "unparsed" }, // nothing to copy
    { id: "jwt-in-uri", state: { input: `ASM:policy_name="api",violations="Illegal URL",support_id="4",request_status="alarmed",ip_client="203.0.113.7",method="GET",uri="/callback/${RFC7519_JWT}"` }, code: "secret" }, // a token in a field the page shows
    { id: "copy-would-read-differently", state: { input: 'ASM:violations="Illegal URL",uri=/a"b,policy_name="see uri=/c"' }, code: "copy" }, // a bare URI holding a quote, and "uri=" inside the policy name: the copy would show another URI, so no link
    { id: "request-read-as-uri", state: { input: `ASM:policy_name="shop",violations="Attack signature detected",support_id="7",request_status="blocked",request="GET /account HTTP/1.1\\r\\nHost: shop.example.com\\r\\nCookie: SID=${SID}\\r\\n\\r\\n"` }, code: "secret" }, // no uri field: the page shows the request as the URI, cookie and all
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "  " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
