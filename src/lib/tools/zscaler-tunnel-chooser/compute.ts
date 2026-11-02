// ============================================================================
// src/lib/tools/zscaler-tunnel-chooser/compute.ts
// ----------------------------------------------------------------------------
// THE ZSCALER LOCATION-TUNNEL CHOOSER ENGINE.
//
// Answers the ZDTA-A.09 shape of question deterministically: given a
// location's bandwidth requirement and constraints (high availability,
// static public IP, encryption mandate, GRE support on the edge device,
// whether the internal tunnel endpoints are source-NATed), which tunnel
// type should forward the location's traffic to the Zscaler cloud, and
// what is the MINIMUM number of tunnels that covers the requirement.
//
// Every capacity figure is Zscaler's own published number, live-verified
// 2026-07-21 (sources pinned in the manifest):
//   * GRE: 1 Gbps per tunnel; 250 Mbps per tunnel when the INTERNAL tunnel
//     endpoint addresses are source-NATed (the service load-balances on the
//     inner addresses, and NAT collapses them).
//   * IPsec: 400 Mbps per public source IP address; beyond that, either
//     additional tunnels from DIFFERENT public source IPs, or multiple
//     tunnels from the SAME IP using NAT-T + source-port randomization
//     under IKEv2.
//   * Scale-out shape from the docs: N primaries + N backups (2 Gbps GRE =
//     2 + 2; 800 Mbps IPsec = 2 + 2; 1200 Mbps IPsec = 3 + 3), each backup
//     to a Public Service Edge in a DIFFERENT data center.
//   * MTU field guidance: min(appliance MTU, path MTU); 1400 when in doubt.
//
// The engine is pure and local: no lookups, no network, nothing evaluated.
// Explanatory text was English by design (the explainer-sibling convention)
// until 02/11/2026; UI chrome strings live in the i18n namespace.
//
// PAGE LANGUAGE (02/11/2026): every step label and text, basis, note,
// prerequisite and error is built as an EngineText (src/lib/tools/engine-text.ts):
// a stable id, the English as before, and its values. chooseLocalisable()
// returns them as such for the page (pack keys
// tools.zscaler-tunnel-chooser.engine.<id>); choose() and run() return
// plainText() of the same reading, so the API, the share spec and the golden
// vectors are unchanged.
// ============================================================================

import { say, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

/** The five constraint answers plus the bandwidth figure the chooser needs. */
export interface ChooserInput {
  /** Required forwarded bandwidth for the location, in Mbps (> 0). */
  requiredMbps: number;
  /** Does the design require tunnel-level high availability (backup tunnels)? */
  haRequired: boolean;
  /** Does the location egress from a STATIC public IP address? (GRE precondition.) */
  staticPublicIp: boolean;
  /** Must traffic to the cloud be ENCRYPTED in transit? (Forces IPsec.) */
  encryptionRequired: boolean;
  /** Does the edge device support GRE? */
  deviceSupportsGre: boolean;
  /** Are the INTERNAL GRE tunnel endpoint addresses source-NATed? (250 Mbps rule.) */
  internalEndpointsNated: boolean;
}

/** One labeled reasoning step, rendered in order. */
/** S is string in the API's reading and EngineText in the page's (chooseLocalisable). */
export interface Step<S = string> {
  label: S; // the step's label
  text: S; // a sentence
}

/** The deterministic recommendation. */
/** S is string in the API's reading and EngineText in the page's. */
export interface ChooserResult<S = string> {
  /** The chosen tunnel type. */
  choice: "gre" | "ipsec";
  /** The per-tunnel capacity figure the count was computed from, in Mbps. */
  perTunnelMbps: number;
  /** WHY that figure applies (the documented rule it comes from). */
  perTunnelBasis: S; // a sentence
  /** Minimum number of PRIMARY tunnels covering requiredMbps. */
  primaries: number;
  /** Backup tunnels: equals primaries when HA is required, else 0. */
  backups: number;
  /** The reasoning, one step per elimination/derivation, in order. */
  steps: Step<S>[]; // each step
  /** Operational notes that apply to the chosen design. */
  notes: S[]; // each a sentence
  /** Preconditions the operator must have in hand. */
  prereqs: S[]; // each a sentence
}

/** Published per-tunnel figures (Mbps), live-verified 2026-07-21. */
export const GRE_MBPS = 1000;
export const GRE_NATED_MBPS = 250;
export const IPSEC_MBPS_PER_SOURCE_IP = 400;

/** Validate the numeric input; throw the worker-compatible helpful error. */
function requirePositiveMbps(n: number): void {
  if (!Number.isFinite(n) || n <= 0) {
    throw engineError(say("err.positive", // not a positive number
      "Required bandwidth must be a positive number of Mbps - for example 500, 800, or 2000.",
    ));
  }
  if (n > 100000) {
    throw engineError(say("err.tooBig", // out of scope
      "Required bandwidth above 100,000 Mbps is outside this chooser's location-forwarding scope - split the requirement across locations.",
    ));
  }
}

/**
 * The chooser proper: eliminate GRE where its preconditions fail, otherwise
 * prefer it (higher per-tunnel ceiling, hardware-rate forwarding), size the
 * tunnel count from the applicable published figure, and mirror the HA shape
 * the documentation itself uses (equal backups to a different data center).
 */
export function choose(input: ChooserInput): ChooserResult {
  return plainText(chooseLocalisable(input)); // the same reading, as English (the API's, the share spec's, the vectors')
} // choose

/** The page's reading: the same as choose(), with every sentence an EngineText (id, English, values). */
export function chooseLocalisable(input: ChooserInput): ChooserResult<EngineText> {
  requirePositiveMbps(input.requiredMbps);
  const steps: Step<EngineText>[] = []; // each step, sentences with ids
  const notes: EngineText[] = []; // each note with its id
  const prereqs: EngineText[] = []; // each prerequisite with its id

  // -- Step 1: is GRE even on the table? Three documented preconditions. --
  let choice: "gre" | "ipsec";
  if (input.encryptionRequired) {
    choice = "ipsec";
    steps.push({
      label: say("label.encryption", "Encryption mandate"), // the label
      text: say("step.encryption", "GRE carries traffic in the clear; a requirement for encrypted transit to the cloud eliminates it. IPsec (ESP under IKEv2) is the forwarding answer."), // encryption required
    });
  } else if (!input.staticPublicIp) {
    choice = "ipsec";
    steps.push({
      label: say("label.noStaticIp", "No static public IP"), // the label
      text: say("step.noStaticIp", "GRE registration requires a static public source address; with a dynamic egress IP the documented alternative is IPsec, which supports FQDN-identified peers."), // no static IP
    });
  } else if (!input.deviceSupportsGre) {
    choice = "ipsec";
    steps.push({
      label: say("label.device", "Device capability"), // the label
      text: say("step.device", "The edge device does not support GRE, which is the documentation's literal cue to configure IPsec VPN tunnels instead."), // no GRE on the device
    });
  } else {
    choice = "gre";
    steps.push({
      label: say("label.greOk", "GRE preconditions met"), // the label
      text: say("step.greOk", "Static public egress IP, GRE-capable device, and no encryption mandate: GRE is preferred - simpler encapsulation, forwarded at hardware rate, and the higher per-tunnel ceiling."), // GRE preferred
    });
  }

  // -- Step 2: the per-tunnel figure the count is computed from. --
  let perTunnelMbps: number;
  let perTunnelBasis: EngineText; // why that figure
  if (choice === "gre") {
    if (input.internalEndpointsNated) {
      perTunnelMbps = GRE_NATED_MBPS;
      perTunnelBasis =
        say("basis.greNat", "GRE with source-NATed internal tunnel endpoints: 250 Mbps per tunnel (Zscaler load-balances on the inner addresses; NAT collapses them, so per-tunnel throughput drops)."); // GRE behind NAT
      steps.push({
        label: say("label.nat", "The NAT penalty"), // the label
        text: say("step.nat", "Internal tunnel endpoint addresses are source-NATed, so the published per-tunnel figure falls from 1 Gbps to 250 Mbps. Removing that NAT restores the full figure."), // the NAT penalty
      });
      notes.push(say("note.removeNat", // the cheapest upgrade
        "Removing source NAT from the internal tunnel endpoints raises the per-tunnel ceiling from 250 Mbps back to 1 Gbps - usually the cheapest capacity upgrade available.",
      ));
    } else {
      perTunnelMbps = GRE_MBPS;
      perTunnelBasis = say("basis.gre", "GRE without source NAT on the internal tunnel endpoints: 1 Gbps per tunnel (published maximum)."); // GRE
    }
  } else {
    perTunnelMbps = IPSEC_MBPS_PER_SOURCE_IP;
    perTunnelBasis = say("basis.ipsec", "IPsec: 400 Mbps per public source IP address (published limit)."); // IPsec
  }

  // -- Step 3: the minimum primary count. --
  const primaries = Math.max(1, Math.ceil(input.requiredMbps / perTunnelMbps));
  const required = String(input.requiredMbps), per = String(perTunnelMbps), count = String(primaries); // the figures
  steps.push({
    label: say("label.sizing", "Sizing"), // the label
    text: primaries === 1 // one primary, or several
      ? say("step.sizingOne", `ceil(${required} Mbps / ${per} Mbps per tunnel) = ${count} primary tunnel.`, { required, per, count }) // one
      : say("step.sizingMany", `ceil(${required} Mbps / ${per} Mbps per tunnel) = ${count} primary tunnels.`, { required, per, count }), // several
  });
  if (choice === "gre" && primaries > 1) {
    notes.push(say("note.greScale", // GRE scale-out
      "Scaling GRE beyond one tunnel requires a DIFFERENT public source IP address per additional tunnel - the documentation's own example builds 2 primaries + 2 backups for 2 Gbps.",
    ));
    prereqs.push(say("prereq.greIps", `${count} distinct static public source IP addresses (one per primary GRE tunnel).`, { count })); // one IP per tunnel
  }
  if (choice === "ipsec" && primaries > 1) {
    notes.push(say("note.ipsecScale", // IPsec scale-out
      "Scaling IPsec beyond 400 Mbps has two documented shapes: additional tunnels from DIFFERENT public source IPs, or multiple tunnels from the SAME public IP using NAT-T with source-port randomization under IKEv2.",
    ));
  }

  // -- Step 4: the HA shape. --
  const backups = input.haRequired ? primaries : 0;
  if (input.haRequired) {
    // -- Standing operational notes, both tunnel types. --
    const b = String(backups); // how many backups
    steps.push({
      label: say("label.ha", "High availability"), // the label
      text: backups === 1 // one backup, or several
        ? say("step.haOne", `HA required: mirror the primaries with ${b} backup tunnel, each to a Public Service Edge in a DIFFERENT data centre - the documented primary/secondary shape.`, { b }) // one
        : say("step.haMany", `HA required: mirror the primaries with ${b} backup tunnels, each to a Public Service Edge in a DIFFERENT data centre - the documented primary/secondary shape.`, { b }), // several
    });
  } else {
    steps.push({
      label: say("label.minimal", "Minimal build"), // the label
      text: say("step.minimal", "No HA requirement stated, so the minimum covering the requisites is primaries only."), // primaries only
    });
    notes.push(say("note.recommendSecondary", // still recommended
      "Zscaler's guidance still RECOMMENDS a secondary tunnel to a Public Service Edge in another data centre; a no-HA build is the stated minimum, not the recommended posture.",
    ));
  }
  notes.push(say("note.mtu", // MTU
    "Tunnel MTU: set the lower of the appliance MTU and the measured path MTU; the field fallback when trouble appears is 1400. Clamp TCP MSS accordingly.",
  ));
  if (choice === "gre") {
    prereqs.push(say("prereq.gre", "Static public egress IP registered with Zscaler; primary and secondary Public Service Edge targets.")); // GRE prerequisites
    notes.push(say("note.greHealth", "Monitor tunnel health (GRE has none built in): IP SLA or keepalives, so failover is fast and observed.")); // GRE health
  } else {
    prereqs.push(say("prereq.ipsec", "VPN credentials (FQDN or IP + pre-shared key) added on the Zscaler side; IKEv2 configured; Dead Peer Detection enabled.")); // IPsec prerequisites
    notes.push(say("note.natT", "Behind NAT, NAT-T moves ESP inside UDP 4500 - expected, documented, and required for the same-IP scale-out shape.")); // NAT-T
  }

  return { choice, perTunnelMbps, perTunnelBasis, primaries, backups, steps, notes, prereqs };
}

/** The uniform run() wrapper (worker-compatible contract: throws on bad input). */
export function run(input: ChooserInput): ChooserResult {
  return choose(input);
}
