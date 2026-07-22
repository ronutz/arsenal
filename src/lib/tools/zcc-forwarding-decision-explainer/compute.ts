// ============================================================================
// src/lib/tools/zcc-forwarding-decision-explainer/compute.ts
// ----------------------------------------------------------------------------
// THE ZCC FORWARDING DECISION EXPLAINER ENGINE - built under the ratified
// descope clause (PKG-ZSCALER v1 §3 T4, PRIME 2026-07-21).
//
// VERIFICATION-PASS VERDICT (2026-07-21, live against the Secure Mobile
// Access with ZCC reference architecture and help.zscaler.com): the
// decision SPINE is publicly documented end to end and is computed here -
// trusted-network determination (criteria set, ANY/ALL matching,
// Pre-Defined exclusivity, the dynamic-criteria failure mode), the three
// network states, the four ZIA forwarding actions and two ZPA actions per
// state, Z-Tunnel 1.0 vs 2.0 semantics including the documented automatic
// ZT2->ZT1 failover and the hybrid web-split. The BYPASS layer's conflict
// resolution is NOT published as a single total order - Application
// Bypass, Destination/Domain Exclusions and Inclusions, VPN Gateway
// Bypass, and the two PAC files are each documented as mechanisms and
// recipes, with no matrix adjudicating multi-mechanism conflicts on one
// flow. This engine therefore walks the documented spine deterministically
// and STOPS at the bypass layer with an explained ledger and the stated
// reason - it explains every mechanism and adjudicates none. The
// why-explainer-not-simulator statement is a first-class output, not a
// footnote. (D-19 comments throughout.)
//
// Grammar (one setting per line):  <key> = <value>
//   network    = trusted | vpn | off-trusted        (required)
//   zia-action = tunnel | twlp | enforce-proxy | none  (required)
//   tunnel     = zt2 | zt1     (only with zia-action tunnel or twlp)
//   web-split  = on | off      (only with tunnel = zt2)
//   zpa-action = tunnel | none (optional)
// Lines starting with # are comments.
// ============================================================================

export type NetworkState = "trusted" | "vpn" | "off-trusted";
export type ZiaAction = "tunnel" | "twlp" | "enforce-proxy" | "none";
export type TunnelVersion = "zt2" | "zt1";

export interface ExplainerInput {
  network: NetworkState;
  ziaAction: ZiaAction;
  tunnel?: TunnelVersion;
  webSplit?: boolean;
  zpaAction?: "tunnel" | "none";
}

export interface DecisionStep {
  /** Which documented layer this step belongs to. */
  layer: "network" | "zia" | "tunnel" | "zpa";
  title: string;
  lines: string[];
}

export interface ExplainerResult {
  steps: DecisionStep[];
  /** The bypass-layer ledger: each documented mechanism, explained not adjudicated. */
  bypassLedger: string[];
  /** The why-explainer-not-simulator statement + standing calibrations. */
  honesty: string[];
  notes: string[];
}

/** Parse the setting lines; helpful line-anchored errors. */
export function parseSettings(text: string): ExplainerInput {
  const seen = new Map<string, string>();
  const lines = text.split(/\r?\n/);

  lines.forEach((line, i) => {
    const t = line.trim();
    const where = `Line ${i + 1}`;
    if (t === "" || t.startsWith("#")) return;
    const m = t.match(/^([a-z-]+)\s*=\s*([a-z0-9-]+)$/i);
    if (!m) throw new Error(`${where}: expected "<key> = <value>", e.g. "network = off-trusted".`);
    const key = m[1].toLowerCase();
    const value = m[2].toLowerCase();
    if (!["network", "zia-action", "tunnel", "web-split", "zpa-action"].includes(key))
      throw new Error(`${where}: unknown key "${m[1]}". Known: network, zia-action, tunnel, web-split, zpa-action.`);
    if (seen.has(key)) throw new Error(`${where}: "${key}" appears twice - one line per setting.`);
    seen.set(key, value);
  });

  const network = seen.get("network");
  if (!network) throw new Error('Missing required line: "network = trusted | vpn | off-trusted".');
  if (!["trusted", "vpn", "off-trusted"].includes(network))
    throw new Error(`network must be trusted, vpn, or off-trusted (got "${network}").`);

  const ziaAction = seen.get("zia-action");
  if (!ziaAction) throw new Error('Missing required line: "zia-action = tunnel | twlp | enforce-proxy | none".');
  if (!["tunnel", "twlp", "enforce-proxy", "none"].includes(ziaAction))
    throw new Error(`zia-action must be tunnel, twlp, enforce-proxy, or none (got "${ziaAction}").`);

  const tunnelRaw = seen.get("tunnel");
  if (tunnelRaw && !["zt2", "zt1"].includes(tunnelRaw))
    throw new Error(`tunnel must be zt2 or zt1 (got "${tunnelRaw}").`);
  // -- Documented scope: the tunnel-version choice belongs to the tunneling
  //    actions; Enforce Proxy and None have no Z-Tunnel to version.
  if (tunnelRaw && (ziaAction === "enforce-proxy" || ziaAction === "none"))
    throw new Error(`tunnel = ${tunnelRaw} does not apply when zia-action is ${ziaAction}: the Z-Tunnel version belongs to the Tunnel and Tunnel with Local Proxy actions.`);

  const webSplitRaw = seen.get("web-split");
  if (webSplitRaw && !["on", "off"].includes(webSplitRaw))
    throw new Error(`web-split must be on or off (got "${webSplitRaw}").`);
  const tunnel = tunnelRaw as TunnelVersion | undefined;
  if (webSplitRaw === "on" && tunnel !== "zt2")
    throw new Error("web-split = on is the documented Z-Tunnel 2.0 hybrid mode (Redirect Web Traffic to the listening proxy); set tunnel = zt2 to use it.");

  const zpaRaw = seen.get("zpa-action");
  if (zpaRaw && !["tunnel", "none"].includes(zpaRaw))
    throw new Error(`zpa-action must be tunnel or none (got "${zpaRaw}").`);

  return {
    network: network as NetworkState,
    ziaAction: ziaAction as ZiaAction,
    tunnel,
    webSplit: webSplitRaw === "on",
    zpaAction: zpaRaw as "tunnel" | "none" | undefined,
  };
}

const NETWORK_LABEL: Record<NetworkState, string> = {
  trusted: "On Trusted Network",
  vpn: "On VPN",
  "off-trusted": "Off Trusted Network",
};

/** Walk the documented spine for the parsed settings. */
export function run(text: string): ExplainerResult {
  const input = parseSettings(text);
  const steps: DecisionStep[] = [];

  // ---- Layer 1: how the network state is determined (documented criteria) --
  const netLines: string[] = [
    `State "${NETWORK_LABEL[input.network]}" is one of the three documented network states a forwarding profile distinguishes; each state carries its own configured action, and the state is re-evaluated on every network change.`,
    "Detection criteria (documented set): DNS Server and DNS Search Domains (both recommended as the most static), Hostname and IP, Network Range, Default Gateway, DHCP Server, Egress IP - matchable on ANY or ALL - plus Pre-Defined Trusted Networks, which cannot be combined with the others and is the only criteria used when configured.",
    "Documented failure mode: Hostname-and-IP is dynamic - if resolution fails during a network transition, the client can misjudge the network as untrusted and apply the wrong state's action.",
  ];
  if (input.network === "vpn")
    netLines.push(
      "The On VPN state exists for full-tunnel VPN coexistence; the interoperability guidance recommends Tunnel with Local Proxy here and warns against route-based Tunnel, which competes with the VPN client at the IP layer.",
    );
  steps.push({ layer: "network", title: NETWORK_LABEL[input.network], lines: netLines });

  // ---- Layer 2: the ZIA action's documented meaning ------------------------
  const ziaLines: string[] = [];
  if (input.ziaAction === "tunnel")
    ziaLines.push(
      "Tunnel: traffic is captured at the packet level and tunneled to the nearest ZIA Service Edge - the recommended option for most deployments. On Windows, the driver is Route Based or Packet Filter Based, with Packet Filter recommended for compatibility.",
    );
  else if (input.ziaAction === "twlp")
    ziaLines.push(
      "Tunnel with Local Proxy: the client sets the device's proxy settings so proxy-aware traffic is sent to Zscaler through the local listening proxy - the application-layer capture that coexists with VPN clients because it does not compete at the IP layer.",
    );
  else if (input.ziaAction === "enforce-proxy")
    ziaLines.push(
      "Enforce Proxy: a documented legacy action that enforces the device's pre-existing proxy settings rather than establishing a Z-Tunnel.",
    );
  else
    ziaLines.push(
      "None: ZIA forwarding is disabled in this state - the documented pattern for trusted sites whose egress already reaches ZIA over GRE or IPsec tunnels, where an agent tunnel would be redundant.",
    );
  steps.push({ layer: "zia", title: "ZIA forwarding action", lines: ziaLines });

  // ---- Layer 3: tunnel semantics (only when a tunnel exists) ---------------
  if (input.ziaAction === "tunnel" || input.ziaAction === "twlp") {
    const v = input.tunnel ?? "zt2";
    const tLines: string[] = [];
    if (v === "zt2") {
      tLines.push(
        "Z-Tunnel 2.0: DTLS or TLS encapsulation carrying ALL ports and protocols to the Service Edge - the recommended version.",
        "Documented failover: if Z-Tunnel 2.0 cannot establish (network or firewall interference), the client automatically attempts a Z-Tunnel 1.0 connection.",
      );
      if (input.webSplit)
        tLines.push(
          "Hybrid web-split is ON (Redirect Web Traffic to the listening proxy): web applications ride Z-Tunnel 1.0 while everything else stays on Z-Tunnel 2.0 - the documented answer to ISPs that throttle UDP/DTLS.",
        );
    } else {
      tLines.push(
        "Z-Tunnel 1.0: a lightweight proxy-based HTTP tunnel limited to TCP web traffic on ports 80 and 443; the tunnel itself does not encrypt - the web application's own TLS does.",
      );
    }
    steps.push({ layer: "tunnel", title: "Z-Tunnel", lines: tLines });
  }

  // ---- Layer 4: ZPA (when specified) ---------------------------------------
  if (input.zpaAction) {
    steps.push({
      layer: "zpa",
      title: "ZPA forwarding action",
      lines: [
        input.zpaAction === "tunnel"
          ? "ZPA Tunnel: the Microtunnel to the ZPA Service Edge is enabled in this state, and access policy decides which applications the user reaches. The recommendation is to tunnel wherever possible, even near local data centers."
          : "ZPA None: private-application access via ZPA is disabled in this state - the documented choice when this state's users reach private applications another way.",
        "ZPA has only these two actions per state - a deliberately smaller decision than ZIA's four.",
      ],
    });
  }

  // ---- The bypass ledger: explained, not adjudicated -----------------------
  const bypassLedger: string[] = [
    "App profile Custom PAC URL: the traditional proxy PAC governing the system-proxy path - a DIRECT verdict bypasses; gateway variables select Service Edges.",
    "Forwarding profile PAC: for Z-Tunnel 2.0, the documented bypass macro (PROXY with the tunnel-2 bypass variable) releases a destination from Z-Tunnel 2.0 capture, falling back to the Z-Tunnel 1.0 listener path.",
    "Z-Tunnel 2.0 profile lists: Application Bypass, Destination Exclusions, Domain Exclusions, Domain Inclusions, and Domain Inclusions for DNS Requests - the documented non-PAC way to shape ZT2 capture.",
    "VPN Gateway Bypass (app profile): hostnames or IPs of a split-tunnel VPN's gateways excluded from capture; documented subtlety - FQDNs resolve at tunnel start, and subdomains are auto-bypassed for Z-Tunnel 1.0 and Tunnel with Local Proxy unless the opt-out is enabled.",
    "Strict Enforcement mode: blocks everything except PAC exclusions - the documented inversion where the bypass list becomes the allow list.",
  ];

  const honesty: string[] = [
    "WHY AN EXPLAINER AND NOT A SIMULATOR: the spine above is publicly documented end to end and this tool computes it. The bypass layer is not - each mechanism in the ledger is documented individually, but Zscaler publishes no single precedence order adjudicating conflicts when several mechanisms address the same flow. A simulator would have to invent that order; this tool explains every documented part and declines to invent the rest (verification pass 2026-07-21).",
  ];

  const notes: string[] = [
    "Reference-architecture recommendation table: On Trusted Network = None, On VPN = Tunnel with Local Proxy, Off Trusted Network = Tunnel, tunnel type Z-Tunnel 2.0, web-split only when needed.",
    "Fail-open/fail-close overlays sit above every state: captive-portal detection (timed direct access), Service Edge unreachable, and Z-Tunnel setup failure each carry a documented open-or-close choice.",
  ];

  return { steps, bypassLedger, honesty, notes };
}
