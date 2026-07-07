// ============================================================================
// src/config/vendors.ts
// ----------------------------------------------------------------------------
// VENDOR FAMILIES - the second, ADDITIVE grouping dimension over the toolbox.
//
// A tool's functional home is still its single `category` (src/config/tools.ts):
// that is unchanged and still drives the /tools index grouping. On top of it, a
// tool may also belong to one or more VENDOR families via the optional
// ToolEntry.vendors[] array. The four vendors are exactly Rodolfo Nutzmann's
// training pillars, and they line up with the public-copy guardrail (only F5,
// Fortinet, Extreme Networks, and Netskope are named publicly).
//
// Multi-membership: an F5 tool sits in its functional category (e.g.
// "networking") AND in the F5 vendor family, so an instructor can find it either
// way. Learn articles carry the same vendors[] tag, so a vendor view surfaces
// tools and articles together.
//
// VISIBILITY: only vendors that actually have tools are surfaced, EXCEPT that a
// vendor with alwaysShow=true is surfaced regardless. As of 2026-07-07 all four
// are populated (F5 holds the bulk; Fortinet/Netskope/Extreme have their first
// tool each). A vendor with neither tools nor alwaysShow stays hidden, so we
// never render an empty vendor shelf.
//
// Labels are i18n (tools.vendors.<key>), never hard-coded here - same rule as
// categories. Colors are SUPPLEMENTARY (a dot + a soft border; the label carries
// the meaning), exactly like categoryColors.ts, so contrast is the theme's on all
// six themes. The hues below are provisional brand-adjacent values and can be
// tuned in one place.
// ============================================================================

import { tools } from "@/config/tools";

export interface VendorFamily {
  /** Stable key: matches ToolEntry.vendors[] and the tools.vendors.<key> label. */
  readonly key: string;
  /** Surface in browse UI even with zero tools (F5 is live; the rest wait). */
  readonly alwaysShow: boolean;
}

/** Declared browse order - the four training-pillar vendors. */
export const VENDOR_FAMILIES: readonly VendorFamily[] = Object.freeze([
  { key: "f5", alwaysShow: true },
  { key: "fortinet", alwaysShow: false },
  { key: "netskope", alwaysShow: false },
  { key: "extreme", alwaysShow: false },
]);

/** vendor key -> supplementary hue (dot + soft border only). Provisional; tune here. */
export const VENDOR_COLORS: Record<string, string> = {
  f5: "#E4002B", // F5 red
  fortinet: "#C8102E", // Fortinet red
  netskope: "#00A9E0", // Netskope blue
  extreme: "#582C83", // Extreme Networks purple
};

/** Neutral fallback so a future vendor is never invisible. */
export const VENDOR_COLOR_FALLBACK = "#94A3B8";

/** The hue for a vendor key, with fallback. */
export function vendorColor(key: string): string {
  return VENDOR_COLORS[key] ?? VENDOR_COLOR_FALLBACK;
}

/** True when a key names a known vendor family. */
export function isVendor(key: string): boolean {
  return VENDOR_FAMILIES.some((v) => v.key === key);
}

/** Vendor keys that have at least one AVAILABLE tool, in declared order. */
export function populatedVendors(): string[] {
  const seen = new Set<string>();
  for (const t of tools) {
    if (!t.available || !t.vendors) continue;
    for (const v of t.vendors) seen.add(v);
  }
  return VENDOR_FAMILIES.filter((v) => seen.has(v.key)).map((v) => v.key);
}

/** Vendor keys to surface in browse UI: populated ones plus any alwaysShow, in order. */
export function browseVendors(): string[] {
  const pop = new Set(populatedVendors());
  return VENDOR_FAMILIES.filter((v) => pop.has(v.key) || v.alwaysShow).map((v) => v.key);
}


// ============================================================================
// VENDOR SUB-CATEGORIES (PRIME directive, 2026-07-03)
// ----------------------------------------------------------------------------
// Vendor hubs group their tools and articles by these ordered sub-categories.
// Labels are i18n: tools.subs.<vendor>.<id>. Generic /tools and /learn
// categories are vendor-agnostic ONLY; vendor-tagged items live on their hub.
//
// F5 taxonomy: PRIME-specified verbatim (10 sub-categories).
// Fortinet / Netskope / Extreme taxonomies: source-grounded 2026-07-03 from
// fortinet.com/products (the A-Z catalogue), netskope.com product and
// Netskope One platform pages, and extremenetworks.com product/solution
// pages. Their hubs render the moment their first tool ships
// (populatedVendors gating unchanged); the structure is canon-ready now.
//
// FORTINET PRODUCT -> SUB-CATEGORY ASSIGNMENT (the A-Z catalogue, assigned
// per PRIME's instruction; seed subs first):
//   fortigate:    FortiGate NGFW, FortiGate VM, FortiGate Cloud, FortiGate
//                 CNF, FortiGate Rugged / Rugged products, FortiOS,
//                 FortiOS-Carrier, FortiConverter, FortiGate-as-a-Service,
//                 FortiDDoS
//   fortianalyzer: FortiAnalyzer, FortiAnalyzer Cloud
//   fortimanager: FortiManager, FortiManager Cloud, FortiPortal,
//                 FortiEdge Cloud, FortiAIOps, FortiFlex, FortiPoints
//   fortiswitch:  FortiSwitch, FortiSwitch chassis
//   fortiap:      FortiAP, FortiAP high-density
//   fortinac:     FortiNAC
//   sase:         FortiSASE, FortiSASE Sovereign, Secure SD-WAN, FortiProxy
//                 (SWG), Universal ZTNA, FortiClient (VPN & ZTNA agent),
//                 FortiMonitor (DEM), FortiExtender (5G/LTE WAN edge)
//   secops:       FortiSIEM, FortiSOAR, FortiSOC / SOCaaS, FortiEDR/XDR,
//                 FortiEndpoint, FortiNDR, FortiSandbox, FortiDeceptor,
//                 FortiRecon (CTEM), FortiDLP, FortiMail / Workspace
//                 Security, FortiDevice CAASM
//   identity:     FortiAuthenticator, FortiAuthenticator Cloud /
//                 FortiIdentity Cloud, FortiToken, FortiPAM
//   appsec:       FortiWeb, FortiAppSec, FortiADC, FortiCNAPP, FortiDAST,
//                 FortiDevSec, FortiAIGate (AI runtime), FortiGuard
//                 Advanced Bot Protection, FortiAI-SecureAI
//   fortiguard:   FortiGuard AI-Powered Security Services (IPS, AV, URL and
//                 DNS filtering, CASB, inline malware, attack-surface
//                 rating, OT security service), FortiAI-Protect,
//                 FortiAI-Assist
//   uc-video:     FortiVoice / FortiFone, FortiCam / FortiRecorder
//
// NETSKOPE (Netskope One components, per the platform pages): the SSE core
// (NG-SWG converging SWG+CASB), then the named services and platform layer.
//
// EXTREME (product families, per extremenetworks.com): Platform ONE, the
// ExtremeCloud IQ management continuum, the wired/wireless/fabric/WAN
// families, access security (ExtremeControl NAC, Universal ZTNA,
// AirDefense, Defender for IoT), and analytics/AIOps.
// ============================================================================

export interface VendorSub {
  readonly id: string;
}

export const VENDOR_SUBS: Record<string, readonly VendorSub[]> = Object.freeze({
  f5: [
    { id: "ltm" },        // LTM - Local Traffic Manager
    { id: "irules" },     // iRules - Tcl event scripting (dedicated per PRIME)
    { id: "tmos" },       // TMOS / F5OS / Platforms
    { id: "dns-gtm" },    // DNS / GTM - Global Traffic Manager
    { id: "asm-awaf" },   // ASM / Advanced WAF
    { id: "afm" },        // AFM - Advanced Firewall Manager
    { id: "zta-apm" },    // ZTA / APM - Access Policy Manager
    { id: "sslo" },       // SSL Orchestrator
    { id: "automation" }, // Automation & Integration
    { id: "cloud" },      // Public Cloud
    { id: "f5xc" },       // F5 Distributed Cloud
  ],
  fortinet: [
    { id: "fortigate" },
    { id: "fortianalyzer" },
    { id: "fortimanager" },
    { id: "fortiswitch" },
    { id: "fortiap" },
    { id: "fortinac" },
    { id: "sase" },
    { id: "secops" },
    { id: "identity" },
    { id: "appsec" },
    { id: "fortiguard" },
    { id: "uc-video" },
  ],
  netskope: [
    { id: "swg" },            // Next Gen Secure Web Gateway (+ RBI, enterprise browser, DNS)
    { id: "casb" },
    { id: "ztna" },           // Private Access / Universal ZTNA
    { id: "fwaas" },          // Cloud Firewall
    { id: "data-protection" }, // unified DLP, endpoint DLP, DSPM
    { id: "posture" },        // CSPM, SSPM
    { id: "sdwan" },          // Borderless / Endpoint SD-WAN, Converged Access
    { id: "analytics-dem" },  // Advanced Analytics + Proactive DEM
    { id: "ai-security" },    // AI gateway, agentic broker, guardrails, red teaming
    { id: "platform" },       // Zero Trust Engine, One Client, Orchestrator, NewEdge, Cloud Exchange, Device Intelligence
  ],
  extreme: [
    { id: "platform-one" },   // Extreme Platform ONE
    { id: "cloud-iq" },       // ExtremeCloud IQ, IQ Controller, Site Engine, Cloud Edge / UCP
    { id: "switching" },      // ExtremeSwitching, Switch Engine / EXOS
    { id: "wireless" },       // ExtremeWireless access points
    { id: "fabric" },         // Extreme Fabric / Fabric Engine / Fabric Connect
    { id: "sdwan" },          // ExtremeCloud SD-WAN
    { id: "access-security" }, // ExtremeControl NAC, Universal ZTNA, AirDefense, Defender for IoT
    { id: "analytics" },      // ExtremeAnalytics, AIOps
  ],
});

/** Ordered sub-categories for a vendor ([] for unknown). */
export function subsOf(vendor: string): readonly VendorSub[] {
  return VENDOR_SUBS[vendor] ?? [];
}
