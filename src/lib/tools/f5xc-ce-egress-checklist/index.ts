// ============================================================================
// src/lib/tools/f5xc-ce-egress-checklist/index.ts
// ----------------------------------------------------------------------------
// THE F5XC CE EGRESS CHECKLIST - a {manifest, run, vectors} triple. Paste F5's
// published CE IP/domain reference file; get a purpose-organized, site-type-
// filtered allowlist, the static port matrix, optional site-to-site rules, a
// firewall-request text, and a curl-host verification script. Parses what you
// paste - never a hardcoded list that can rot. Pure and offline.
// ============================================================================

import { run } from "./compute";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export {
  parseCeFile,
  buildAllowlist,
  verifierScript,
  run,
  PORT_MATRIX,
  OPTIONAL_RULES,
  PURPOSE_LABELS,
} from "./compute";
export type { SiteType, Scope, EntryKind, Entry, Bucket, ParseResult, AllowlistResult, PortRow, RuleBlock } from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

export { run as default };

export const manifest = Object.freeze({
  toolFamily: "F5 Distributed Cloud (XC)",
  toolSlug: "f5xc-ce-egress-checklist",
  canonicalAliases: ["xc-ce-firewall", "f5xc-ce-allowlist", "ce-egress-rules", "f5xc-firewall-checklist", "xc-ce-proxy-allowlist"],
  inputDetectors: [],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse"],
  shareSafetyDefault: "manual",

  learnLinks: ["learn/f5xc-ce-registration-and-egress"],
  sources: [
    {
      id: "xc-ce-ip-dom-ref",
      label: "F5 Customer Edge IP Address and Domain Reference for Firewall or Proxy Settings",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/multi-cloud-network-connect/reference/ce-ip-dom-ref",
      access_date: "2026-07-11",
      scope: "the downloadable plain-text file this tool parses; the port matrix; SMSv2 vs Legacy split; SMG/DC-CG/Cloud Connect rules",
      status: "active",
    },
    {
      id: "xc-ce-ip-dom-file",
      label: "F5 CE IP addresses and domains plain-text file (for automation)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/downloads/multi-cloud-network-connect/reference/ce-ip-dom-ref/ips-domains.txt",
      access_date: "2026-07-11",
      scope: "the exact file format the parser handles",
      status: "active",
    },
    {
      id: "xc-ce-concept",
      label: "F5 Distributed Cloud Customer Edge (registration flow)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/multi-cloud-network-connect/concepts/f5-xc-customer-edge",
      access_date: "2026-07-11",
      scope: "token call-home; Global Controller picks two REs by GeoIP; IPsec preferred, SSL fallback",
      status: "active",
    },
    {
      id: "xc-ce-troubleshoot",
      label: "F5 Distributed Cloud: Troubleshoot Manual CE Deployment Registration Issues",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/multi-cloud-network-connect/troubleshooting/troubleshoot-manual-ce-deployment-registration-issues",
      access_date: "2026-07-07",
      scope: "the curl-host verification method (outbound TCP 80/443 + UDP 53)",
      status: "active",
    },
  ],
  credits: [
    { handle: "f5-docs", display_name: "F5 Distributed Cloud documentation", role: "reference", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});
