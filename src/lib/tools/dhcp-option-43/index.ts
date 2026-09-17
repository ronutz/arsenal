// ============================================================================
// src/lib/tools/dhcp-option-43/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING DHCP OPTION 43 MODULE - a {manifest, run, vectors} triple.
//
// Give it a wireless controller address and a vendor, and it returns the value
// that vendor actually expects: a hex TLV for Cisco, Ruckus and UniFi, a plain
// string for Aruba and ExtremeWireless, and for FortiAP the correction that the
// option is 138 rather than 43.
//
// Pure and offline. It converts a string and contacts nothing - which matters
// here more than usual, because a controller address is infrastructure detail
// that has no business leaving the browser.
//
// shareSafetyDefault: "fragment" - a management-interface address is internal
// topology. It stays out of the query string and out of server logs.
// ============================================================================

import { run, Option43Error, VENDOR_PROFILES } from "./compute";
import type {
  Option43Report,
  Option43Encoding,
  Option43ErrorCode,
  VendorProfile,
} from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  OPTION43_GOLDEN_VECTORS,
  OPTION43_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";

export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking",
  toolSlug: "dhcp-option-43",
  canonicalAliases: [
    "option-43",
    "dhcp-43",
    "wlc-option-43",
    "capwap-discovery",
    "ap-controller-discovery",
    "vendor-specific-information",
  ],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "^\\s*(\\d{1,3}\\.){3}\\d{1,3}\\s*$",
      priority: 3,
      example: "192.168.10.5",
    },
  ],

  // -- Execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-input"],
  shareSafetyDefault: "fragment",

  learnLinks: ["learn/dhcp-option-43-discovery"],

  // Every vendor profile carries its own source; these are the documents the
  // encoding rules came from. No community post is a source for any byte.
  // `id` is required by the tool page's source rail. Vendor profile ids double
  // as source ids, so a reader can tie a citation to the profile it governs.
  sources: [
    {
      id: "rfc2132",
      label: "RFC 2132 section 8.4: Vendor Specific Information (option 43)",
      url: "https://www.rfc-editor.org/rfc/rfc2132#section-8.4",
    },
    ...VENDOR_PROFILES.map((v) => ({ id: v.id, ...v.source })),
  ],
});

export {
  run,
  Option43Error,
  VENDOR_PROFILES,
  GOLDEN_VECTOR_SET_ID,
  OPTION43_GOLDEN_VECTORS,
  OPTION43_REJECT_VECTORS,
  verifyVectors,
};
export type { Option43Report, Option43Encoding, Option43ErrorCode, VendorProfile };
