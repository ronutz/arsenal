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
//
// PAGE LANGUAGE (02/11/2026): every title, line, ledger entry, note and error is
// built as an EngineText (src/lib/tools/engine-text.ts): a stable id, the
// English as before, and its values. runLocalisable() returns them as such for
// the page (pack keys tools.zcc-forwarding-decision-explainer.engine.<id>);
// run() returns plainText() of the same reading, and parseSettings() throws the
// same errors with the same messages (each carrying its sentence), so the API,
// the share spec and the golden vectors are unchanged.
// ============================================================================

import { say, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

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

/** S is string in the API's reading and EngineText in the page's (runLocalisable). */
export interface DecisionStep<S = string> {
  /** Which documented layer this step belongs to. */
  layer: "network" | "zia" | "tunnel" | "zpa";
  title: S; // the step's title
  lines: S[]; // each a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface ExplainerResult<S = string> {
  steps: DecisionStep<S>[]; // the spine
  /** The bypass-layer ledger: each documented mechanism, explained not adjudicated. */
  bypassLedger: S[]; // each a sentence
  /** The why-explainer-not-simulator statement + standing calibrations. */
  honesty: S[]; // each a sentence
  notes: S[]; // each a sentence
}

/** Parse the setting lines; helpful line-anchored errors. */
export function parseSettings(text: string): ExplainerInput {
  const seen = new Map<string, string>();
  const lines = text.split(/\r?\n/);

  lines.forEach((line, i) => {
    const t = line.trim();
    const lineNo = String(i + 1); // the line number, for the messages
    if (t === "" || t.startsWith("#")) return;
    const m = t.match(/^([a-z-]+)\s*=\s*([a-z0-9-]+)$/i);
    if (!m) throw engineError(say("err.shape", `Line ${lineNo}: expected "<key> = <value>", e.g. "network = off-trusted".`, { line: lineNo })); // not key = value
    const key = m[1].toLowerCase();
    const value = m[2].toLowerCase();
    if (!["network", "zia-action", "tunnel", "web-split", "zpa-action"].includes(key))
      throw engineError(say("err.unknownKey", `Line ${lineNo}: unknown key "${m[1]}". Known: network, zia-action, tunnel, web-split, zpa-action.`, { line: lineNo, key: m[1] })); // an unknown key
    if (seen.has(key)) throw engineError(say("err.twice", `Line ${lineNo}: "${key}" appears twice - one line per setting.`, { line: lineNo, key })); // a repeated key
    seen.set(key, value);
  });

  const network = seen.get("network");
  if (!network) throw engineError(say("err.noNetwork", 'Missing required line: "network = trusted | vpn | off-trusted".')); // no network line
  if (!["trusted", "vpn", "off-trusted"].includes(network))
    throw engineError(say("err.badNetwork", `network must be trusted, vpn, or off-trusted (got "${network}").`, { network })); // a bad value

  const ziaAction = seen.get("zia-action");
  if (!ziaAction) throw engineError(say("err.noZia", 'Missing required line: "zia-action = tunnel | twlp | enforce-proxy | none".')); // no zia-action line
  if (!["tunnel", "twlp", "enforce-proxy", "none"].includes(ziaAction))
    throw engineError(say("err.badZia", `zia-action must be tunnel, twlp, enforce-proxy, or none (got "${ziaAction}").`, { ziaAction })); // a bad value

  const tunnelRaw = seen.get("tunnel");
  if (tunnelRaw && !["zt2", "zt1"].includes(tunnelRaw))
    throw engineError(say("err.badTunnel", `tunnel must be zt2 or zt1 (got "${tunnelRaw}").`, { tunnelRaw })); // a bad value
  // -- Documented scope: the tunnel-version choice belongs to the tunneling
  //    actions; Enforce Proxy and None have no Z-Tunnel to version.
  if (tunnelRaw && (ziaAction === "enforce-proxy" || ziaAction === "none"))
    throw engineError(say("err.tunnelNotApplicable", `tunnel = ${tunnelRaw} does not apply when zia-action is ${ziaAction}: the Z-Tunnel version belongs to the Tunnel and Tunnel with Local Proxy actions.`, { tunnelRaw, ziaAction })); // tunnel without a tunnel action

  const webSplitRaw = seen.get("web-split");
  if (webSplitRaw && !["on", "off"].includes(webSplitRaw))
    throw engineError(say("err.badWebSplit", `web-split must be on or off (got "${webSplitRaw}").`, { webSplitRaw })); // a bad value
  const tunnel = tunnelRaw as TunnelVersion | undefined;
  if (webSplitRaw === "on" && tunnel !== "zt2")
    throw engineError(say("err.webSplitNeedsZt2", "web-split = on is the documented Z-Tunnel 2.0 hybrid mode (Redirect Web Traffic to the listening proxy); set tunnel = zt2 to use it.")); // web-split without ZT2

  const zpaRaw = seen.get("zpa-action");
  if (zpaRaw && !["tunnel", "none"].includes(zpaRaw))
    throw engineError(say("err.badZpa", `zpa-action must be tunnel or none (got "${zpaRaw}").`, { zpaRaw })); // a bad value

  return {
    network: network as NetworkState,
    ziaAction: ziaAction as ZiaAction,
    tunnel,
    webSplit: webSplitRaw === "on",
    zpaAction: zpaRaw as "tunnel" | "none" | undefined,
  };
}

const NETWORK_LABEL: Record<NetworkState, EngineText> = {
  trusted: say("state.trusted", "On Trusted Network"), // Zscaler's state name
  vpn: say("state.vpn", "On VPN"), // Zscaler's state name
  "off-trusted": say("state.offTrusted", "Off Trusted Network"), // Zscaler's state name
};

/** Walk the documented spine for the parsed settings. */
// ---- Layer 1: how the network state is determined (documented criteria) --
export function run(text: string): ExplainerResult {
  return plainText(runLocalisable(text)); // the same reading, sentences as their English (the API's and the vectors')
} // run

/** The page's reading: the same as run(), with every sentence an EngineText (id, English, values). */
export function runLocalisable(text: string): ExplainerResult<EngineText> {
  const input = parseSettings(text);
  const steps: DecisionStep<EngineText>[] = []; // the spine, sentences with ids
  const state = NETWORK_LABEL[input.network]; // the state's name
  const netLines: EngineText[] = [
    say("net.state", `State "${state}" is one of the three documented network states a forwarding profile distinguishes; each state carries its own configured action, and the state is re-evaluated on every network change.`, { state }), // the state
    say("net.criteria", "Detection criteria (documented set): DNS Server and DNS Search Domains (both recommended as the most static), Hostname and IP, Network Range, Default Gateway, DHCP Server, Egress IP - matchable on ANY or ALL - plus Pre-Defined Trusted Networks, which cannot be combined with the others and is the only criteria used when configured."), // the criteria
    say("net.failure", "Documented failure mode: Hostname-and-IP is dynamic - if resolution fails during a network transition, the client can misjudge the network as untrusted and apply the wrong state's action."), // the failure mode
  ];
  if (input.network === "vpn")
    netLines.push(say("net.vpn", // VPN coexistence
      "The On VPN state exists for full-tunnel VPN coexistence; the interoperability guidance recommends Tunnel with Local Proxy here and warns against route-based Tunnel, which competes with the VPN client at the IP layer.",
    ));
  steps.push({ layer: "network", title: NETWORK_LABEL[input.network], lines: netLines });

  // ---- Layer 2: the ZIA action's documented meaning ------------------------
  const ziaLines: EngineText[] = []; // the ZIA action's lines
  if (input.ziaAction === "tunnel")
    ziaLines.push(say("zia.tunnel", // Tunnel
      "Tunnel: traffic is captured at the packet level and tunneled to the nearest ZIA Service Edge - the recommended option for most deployments. On Windows, the driver is Route Based or Packet Filter Based, with Packet Filter recommended for compatibility.",
    ));
  else if (input.ziaAction === "twlp")
    ziaLines.push(say("zia.twlp", // Tunnel with Local Proxy
      "Tunnel with Local Proxy: the client sets the device's proxy settings so proxy-aware traffic is sent to Zscaler through the local listening proxy - the application-layer capture that coexists with VPN clients because it does not compete at the IP layer.",
    ));
  else if (input.ziaAction === "enforce-proxy")
    ziaLines.push(say("zia.enforceProxy", // Enforce Proxy
      "Enforce Proxy: a documented legacy action that enforces the device's pre-existing proxy settings rather than establishing a Z-Tunnel.",
    ));
  else
    ziaLines.push(say("zia.none", // None
      "None: ZIA forwarding is disabled in this state - the documented pattern for trusted sites whose egress already reaches ZIA over GRE or IPsec tunnels, where an agent tunnel would be redundant.",
    ));
  steps.push({ layer: "zia", title: say("title.zia", "ZIA forwarding action"), lines: ziaLines }); // the ZIA step

  // ---- Layer 3: tunnel semantics (only when a tunnel exists) ---------------
  if (input.ziaAction === "tunnel" || input.ziaAction === "twlp") {
    const v = input.tunnel ?? "zt2";
    const tLines: EngineText[] = []; // the tunnel's lines
    if (v === "zt2") {
      tLines.push(
        say("tunnel.zt2", "Z-Tunnel 2.0: DTLS or TLS encapsulation carrying ALL ports and protocols to the Service Edge - the recommended version."), // ZT2
        say("tunnel.failover", "Documented failover: if Z-Tunnel 2.0 cannot establish (network or firewall interference), the client automatically attempts a Z-Tunnel 1.0 connection."), // the fallback
      );
      if (input.webSplit)
        tLines.push(say("tunnel.webSplit", // hybrid web-split
          "Hybrid web-split is ON (Redirect Web Traffic to the listening proxy): web applications ride Z-Tunnel 1.0 while everything else stays on Z-Tunnel 2.0 - the documented answer to ISPs that throttle UDP/DTLS.",
        ));
    } else {
      tLines.push(say("tunnel.zt1", // ZT1
        "Z-Tunnel 1.0: a lightweight proxy-based HTTP tunnel limited to TCP web traffic on ports 80 and 443; the tunnel itself does not encrypt - the web application's own TLS does.",
      ));
    }
    steps.push({ layer: "tunnel", title: say("title.tunnel", "Z-Tunnel"), lines: tLines }); // the tunnel step
  }

  // ---- Layer 4: ZPA (when specified) ---------------------------------------
  if (input.zpaAction) {
    steps.push({
      layer: "zpa",
      title: say("title.zpa", "ZPA forwarding action"), // the ZPA step's title
      lines: [
        input.zpaAction === "tunnel"
          ? say("zpa.tunnel", "ZPA Tunnel: the Microtunnel to the ZPA Service Edge is enabled in this state, and access policy decides which applications the user reaches. The recommendation is to tunnel wherever possible, even near local data centres.") // ZPA Tunnel
          : say("zpa.none", "ZPA None: private-application access via ZPA is disabled in this state - the documented choice when this state's users reach private applications another way."), // ZPA None
        say("zpa.two", "ZPA has only these two actions per state - a deliberately smaller decision than ZIA's four."), // two actions
      ],
    });
  }

  // ---- The bypass ledger: explained, not adjudicated -----------------------
  const bypassLedger: EngineText[] = [
    say("bypass.appPac", "App profile Custom PAC URL: the traditional proxy PAC governing the system-proxy path - a DIRECT verdict bypasses; gateway variables select Service Edges."), // the app profile PAC
    say("bypass.forwardingPac", "Forwarding profile PAC: for Z-Tunnel 2.0, the documented bypass macro (PROXY with the tunnel-2 bypass variable) releases a destination from Z-Tunnel 2.0 capture, falling back to the Z-Tunnel 1.0 listener path."), // the forwarding profile PAC
    say("bypass.zt2Lists", "Z-Tunnel 2.0 profile lists: Application Bypass, Destination Exclusions, Domain Exclusions, Domain Inclusions, and Domain Inclusions for DNS Requests - the documented non-PAC way to shape ZT2 capture."), // the ZT2 lists
    say("bypass.vpnGateway", "VPN Gateway Bypass (app profile): hostnames or IPs of a split-tunnel VPN's gateways excluded from capture; documented subtlety - FQDNs resolve at tunnel start, and subdomains are auto-bypassed for Z-Tunnel 1.0 and Tunnel with Local Proxy unless the opt-out is enabled."), // VPN Gateway Bypass
    say("bypass.strict", "Strict Enforcement mode: blocks everything except PAC exclusions - the documented inversion where the bypass list becomes the allow list."), // Strict Enforcement
  ];
  const honesty: EngineText[] = [
    say("honesty.why", "WHY AN EXPLAINER AND NOT A SIMULATOR: the spine above is publicly documented end to end and this tool computes it. The bypass layer is not - each mechanism in the ledger is documented individually, but Zscaler publishes no single precedence order adjudicating conflicts when several mechanisms address the same flow. A simulator would have to invent that order; this tool explains every documented part and declines to invent the rest (verification pass 2026-07-21)."), // the honesty note
  ];
  const notes: EngineText[] = [
    say("note.table", "Reference-architecture recommendation table: On Trusted Network = None, On VPN = Tunnel with Local Proxy, Off Trusted Network = Tunnel, tunnel type Z-Tunnel 2.0, web-split only when needed."), // the recommendation table
    say("note.failOpen", "Fail-open/fail-close overlays sit above every state: captive-portal detection (timed direct access), Service Edge unreachable, and Z-Tunnel setup failure each carry a documented open-or-close choice."), // fail-open/close
  ];

  return { steps, bypassLedger, honesty, notes };
}
