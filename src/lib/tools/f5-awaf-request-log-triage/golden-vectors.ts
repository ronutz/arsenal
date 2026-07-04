// ============================================================================
// src/lib/tools/f5-awaf-request-log-triage/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the AWAF request-log parser. The positive cases use REAL
// F5 ASM log samples (the syslog key-value line and the CEF line from F5's
// logging documentation), so the field extraction and violation classification
// are pinned to formats F5 actually emits. The rating cases pin the documented
// verdict (4-5 attack, 3 investigate, 1-2 false positive) and the support-ID
// handling. Checks assert on the derived result, never on internal shape.
// ============================================================================

import { parseAsmLog, classifyViolation } from "./compute";

export const SET_ID = "f5-awaf-request-log-golden-v1";

interface Vector {
  readonly id: string;
  readonly description: string;
  readonly check: () => string | null;
}
function expect(cond: boolean, msg: string): string | null {
  return cond ? null : msg;
}

// F5's syslog key-value sample (ASM sample event messages), no rating field.
const KV_SAMPLE =
  'ASM:unit_hostname="3600.lab.asm.f5net.com",management_ip_address="172.30.0.20",' +
  'web_application_name="web_app",policy_name="web_app_default",policy_apply_date="2009-18-08 11:14:38",' +
  'violations="Illegal URL length,Illegal request length,Illegal query string length,Illegal meta character in parameter value,Illegal file type,Illegal URL,Attack signature detected",' +
  'support_id="5268275531735896872",request_status="blocked",response_code="0",ip_client="192.168.74.169",' +
  'method="GET",protocol="HTTP",uri="/phpauction/search.php"';

// A modern KV line that includes a violation_rating.
const KV_RATED =
  'ASM:policy_name="prod_policy",violations="Attack signature detected,Illegal meta character in parameter name",' +
  'violation_rating="4",support_id="99887766554433",request_status="blocked",ip_client="203.0.113.9",method="POST",uri="/login"';

// F5's CEF sample.
const CEF_SAMPLE =
  'CEF:0|F5|ASM|11.3.0|200021069|Automated client access "wget"|5|dvchost=f5networks.bigipasm.test ' +
  'dvc=192.168.73.34 cs1=topaz4-web4 cs1Label=policy_name cs2=/Common/topaz4-web4 cs2Label=http_class_name ' +
  'externalId=18205860747014045723 act=blocked requestMethod=GET app=HTTP cs4=Non-browser Client cs4Label=attack_type ' +
  'suid=86c4f8bf7349cac9 request=/ src=10.4.1.101';

export const VECTORS: readonly Vector[] = [
  {
    id: "kv-fields",
    description: "the syslog key-value sample yields policy, support ID, status, client IP, method, URI",
    check: () => {
      const r = parseAsmLog(KV_SAMPLE);
      const f = r?.fields;
      return (
        expect(r !== null && r.format === "kv", `format=${r?.format}`) ??
        expect(f?.policyName === "web_app_default", `policy=${f?.policyName}`) ??
        expect(f?.supportId === "5268275531735896872", `supportId=${f?.supportId}`) ??
        expect(f?.status === "blocked", `status=${f?.status}`) ??
        expect(f?.clientIp === "192.168.74.169", `ip=${f?.clientIp}`) ??
        expect(f?.method === "GET" && f?.uri === "/phpauction/search.php", `method/uri wrong`)
      );
    },
  },
  {
    id: "kv-violations-classified",
    description: "the sample's seven violations parse and classify into categories",
    check: () => {
      const r = parseAsmLog(KV_SAMPLE);
      const v = r!.violations;
      const cat = (name: string) => v.find((x) => x.name === name)?.category;
      return (
        expect(v.length === 7, `count=${v.length} want 7`) ??
        expect(cat("Attack signature detected") === "attack-signature", "attack-sig miscategorized") ??
        expect(cat("Illegal meta character in parameter value") === "meta-char", "meta-char miscategorized") ??
        expect(cat("Illegal URL length") === "length", "url-length miscategorized") ??
        expect(cat("Illegal URL") === "url", "url miscategorized") ??
        expect(cat("Illegal file type") === "file-type", "file-type miscategorized")
      );
    },
  },
  {
    id: "kv-no-rating",
    description: "a log without violation_rating yields the no-rating verdict",
    check: () => {
      const r = parseAsmLog(KV_SAMPLE);
      return (
        expect(r!.fields.violationRating === null, "rating should be null") ??
        expect(r!.verdict === "no-rating", `verdict=${r!.verdict}`)
      );
    },
  },
  {
    id: "kv-rated-attack",
    description: "a rated log (rating 4) yields the likely-attack verdict",
    check: () => {
      const r = parseAsmLog(KV_RATED);
      return (
        expect(r!.fields.violationRating === 4, `rating=${r!.fields.violationRating}`) ??
        expect(r!.verdict === "likely-attack", `verdict=${r!.verdict}`) ??
        expect(r!.fields.supportId === "99887766554433", `supportId=${r!.fields.supportId}`)
      );
    },
  },
  {
    id: "cef-fields",
    description: "the CEF sample yields externalId as support ID, act as status, and labelled fields",
    check: () => {
      const r = parseAsmLog(CEF_SAMPLE);
      const f = r?.fields;
      return (
        expect(r !== null && r.format === "cef", `format=${r?.format}`) ??
        expect(f?.supportId === "18205860747014045723", `supportId=${f?.supportId}`) ??
        expect(f?.status === "blocked", `status=${f?.status}`) ??
        expect(f?.policyName === "topaz4-web4", `policy=${f?.policyName}`) ??
        expect(f?.attackType === "Non-browser Client", `attackType=${f?.attackType}`) ??
        expect(f?.method === "GET", `method=${f?.method}`)
      );
    },
  },
  {
    id: "support-id-opaque-note",
    description: "the support-id-opaque note is surfaced when a support ID is present",
    check: () => {
      const r = parseAsmLog(KV_SAMPLE);
      return expect(r!.notes.some((n) => n.kind === "support-id-opaque"), "missing support-id-opaque note");
    },
  },
  {
    id: "bridge-note",
    description: "the bridge-to-triage note appears when violations are present",
    check: () => {
      const r = parseAsmLog(KV_RATED);
      return expect(r!.notes.some((n) => n.kind === "bridge-to-triage"), "missing bridge-to-triage note");
    },
  },
  {
    id: "unknown-format",
    description: "input that is not an ASM log is reported as unknown, not thrown",
    check: () => {
      const r = parseAsmLog("just some random text without asm fields");
      return expect(r !== null && r.format === "unknown" && r.notes.some((n) => n.kind === "unparsed"), "unknown not handled");
    },
  },
  {
    id: "classify-standalone",
    description: "the classifier maps the core violation names",
    check: () =>
      expect(
        classifyViolation("Attack signature detected") === "attack-signature" &&
          classifyViolation("Illegal meta character in URL") === "meta-char" &&
          classifyViolation("Malformed JSON data") === "xml-json-signature" &&
          classifyViolation("Modified ASM cookie") === "cookie" &&
          classifyViolation("HTTP protocol compliance failed") === "http-compliance",
        "a core violation name misclassified",
      ),
  },
];

export function verifyVectors(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const v of VECTORS) {
    let msg: string | null;
    try {
      msg = v.check();
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
    if (msg) failures.push(`${v.id}: ${msg}`);
  }
  return { ok: failures.length === 0, failures };
}
