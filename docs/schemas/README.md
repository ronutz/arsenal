# Reference schemas

Vendor API/object schemas kept as ground truth for building decode-only ARSENAL
tools. These are reference material only. ARSENAL is a zero-egress static PWA and
never calls any of these APIs at runtime.

## f5xc-was-public-api.openapi.json

The F5 Distributed Cloud Web App Scanning (WAS) Public API (OpenAPI 3.0.1,
version v1, base `https://app.heyhack.com`). Persisted verbatim from the
vendor-supplied document.

Relevant to the queued `f5xc-was-report-explainer` tool (a decode-only explainer
for WAS findings/report exports). The useful, decode-only shapes are:

- `FindingDto`, `IssueDetailDto` carry `cvssVectorString` and `cvssScore`, which
  the `cvss-vector-decoder` engine scores.
- `VulnerabilityInfoDto` carries `cweId` and the three OWASP taxonomies
  (Top Ten 2021, API 2023, LLM v1.1).
- `GET /api/findings/big-ip` emits a BIG-IP ASM-compatible format, the bridge to
  the queued `f5-adv-waf-scanner-xml-explainer`.

D-53 boundary: the scan/recon orchestration surface (start scans, run recon,
manage assets and schedules, register findings) is out of scope. Driving a
scanner is active security testing, and a zero-egress PWA cannot call it anyway.
Only the decode-only output shapes become tools.
