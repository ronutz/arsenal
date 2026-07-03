// ============================================================================
// src/lib/tools/f5-dos-vector-explainer/compute.ts
// ----------------------------------------------------------------------------
// EXPLAINS AFM DoS VECTORS AND THEIR THRESHOLDS. DEFENSIVE CONFIG ONLY.
//
// Paste a `security dos device-config` stanza and/or `security dos profile`
// stanzas and every vector entry renders with: the vector's identity in F5's
// own one-line description (the tmsh reference's VECTOR TYPES table,
// reproduced here as the curated catalogue, sys-db tunables included), the
// threshold mechanics explained with the reference's exact semantics (the
// pps threshold compares a 1-MINUTE average against an absolute value; the
// percent threshold compares it against a dynamically learned 1-HOUR
// average; the internal rate limit is programmed in hardware where the
// platform has it, and bad packets are always dropped), and deterministic
// observations - the mitigation-below-detection inversion that F5's own
// troubleshooting series warns produces silent rate limiting with no attack
// log, auto-threshold mode making manual numbers inert, simulate outside its
// valid mode, enforce disabled, orphaned bad-actor wiring, and the
// tcp-half-open / LTM SYN cookie interplay notes.
//
// A single vector name renders one card; the word `vectors` renders the full
// catalogue grouped by category. This tool explains defensive configuration;
// it never generates traffic of any kind, and nothing pasted leaves the page.
//
// Sources: the tmsh `security dos device-config` reference (the VECTOR TYPES
// table with per-vector descriptions and db tunables, and the PARAMETERS
// semantics quoted above), the tmsh `security dos profile` reference (the
// per-profile vector attribute set: rate-threshold / rate-increase /
// rate-limit, per-source and per-destination controls, scrubbing), F5's
// DDoS training-lab statement of auto-threshold behavior (detection
// thresholds adjust to observed traffic; mitigation limits are always
// stress-driven; anomalous traffic without stress alerts but does not
// block), and the F5 DevCentral SYN-cookie troubleshooting series (the AFM
// device vector's precedence over the LTM global SYN cookie, and the
// mitigation-below-detection warning).
// ============================================================================

import { parseTmsh, asTopLevel, asKeyValue, type ConfigNode } from "../f5-tmsh-config-explainer/compute";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VectorCategory =
  | "flood"
  | "sweep-flood"
  | "fragmentation"
  | "header-anomaly"
  | "malformed"
  | "ipv6-ext"
  | "dns"
  | "sip"
  | "single-packet"
  | "behavioral";

export interface VectorInfo {
  name: string;
  category: VectorCategory;
  /** F5's own one-line description from the tmsh VECTOR TYPES table. */
  description: string;
  /** The sys db variable the reference names for this vector, if any. */
  dbVar?: string;
  notes?: string[];
}

/** One key/value read from a vector stanza, annotated. */
export interface FieldNote {
  key: string;
  value: string;
  note?: string;
}

export interface VectorReading {
  name: string;
  context: "device" | "profile";
  profileName?: string;
  profileSection?: string; // dos-network | protocol-dns | protocol-sip
  line: number;
  info: VectorInfo | null; // null = outside the curated catalogue
  fields: FieldNote[];
  observations: string[];
}

export interface DosResult {
  ok: boolean;
  mode: "config" | "vector" | "catalog";
  readings?: VectorReading[];
  deviceLevel?: { thresholdSensitivity?: string; dynamicSignatures?: FieldNote[]; logPublisher?: string };
  vector?: VectorInfo;
  catalog?: { category: VectorCategory; label: string; vectors: VectorInfo[] }[];
  notes: string[];
}

export type ToolRunResult = DosResult;

// ---------------------------------------------------------------------------
// THE CURATED VECTOR CATALOGUE.
// Every name and description below reproduces the tmsh `security dos
// device-config` reference's VECTOR TYPES table (v13 man page), including
// the sys-db tunables it names. Grouping into categories is this tool's own
// organization for readability; the words are the vendor's.
// ---------------------------------------------------------------------------

const V = (name: string, category: VectorCategory, description: string, dbVar?: string, notes?: string[]): VectorInfo => ({
  name,
  category,
  description,
  dbVar,
  notes,
});

export const VECTORS: readonly VectorInfo[] = Object.freeze([
  // ---- floods ---------------------------------------------------------------
  V("arp-flood", "flood", "ARP Flood."),
  V("icmpv4-flood", "flood", "ICMPv4 Flood."),
  V("icmpv6-flood", "flood", "ICMPv6 Flood."),
  V("igmp-flood", "flood", "IGMP Flood."),
  V("udp-flood", "flood",
    "UDP Flood. The UDP flood vector counts any UDP packets that either match the UDP Port Inclusion List or do not match the UDP Port Exclusion List.",
    undefined,
    ["The port lists live in their own object: tmsh modify security dos udp-portlist."]),
  V("tcp-syn-flood", "flood", "TCP header with only the SYN flag set.", undefined, [
    "This is the classic SYN-flood counter. Its close relative tcp-half-open counts embryonic connections instead of raw SYN packets, and is the vector whose mitigation answers with SYN cookies - see the SYN-flood article for the whole LTM/AFM interplay.",
  ]),
  V("tcp-synack-flood", "flood", "TCP header with only the SYN and ACK flags set."),
  V("tcp-rst-flood", "flood", "TCP header with only the RST flag set."),
  V("tcp-psh-flood", "flood", "TCP header with PUSH flag set."),
  V("tcp-ack-flood", "flood", "TCP packets with the ACK flag set (for non-existing flows)."),
  V("tcp-half-open", "flood",
    "Embryonic (half-open) TCP connections: SYN received, handshake not completed.",
    undefined,
    [
      "The device-level vector behind AFM's SYN-cookie response. F5's troubleshooting series states the precedence plainly: AFM Device DoS has preference over the LTM global SYN cookie, so when this vector's rate limit sits at or below the LTM global-syn-challenge-threshold, the AFM vector triggers first.",
      "Incompatible neighbor: per-VLAN hardware-syncookie (net vlan) is documented as not compatible with the DoS device configuration.",
    ]),
  // ---- sweep / flood (packet-type driven) -----------------------------------
  V("sweep", "sweep-flood",
    "A Sweep is an attack where a single endpoint initiates network traffic to a large number of receiving endpoints or subnets.",
    undefined,
    ["The packet-types list selects which packet types this vector classifies; bad-actor per-source detection is its natural companion."]),
  V("flood", "sweep-flood",
    "A Flood is an attack where multiple (typically many) endpoints initiate network traffic to a single subnet or receiving endpoint.",
    undefined,
    ["The packet-types list selects which packet types this vector classifies."]),
  // ---- fragmentation ---------------------------------------------------------
  V("ip-frag-flood", "fragmentation", "IPv4 fragment flood."),
  V("ipv6-frag-flood", "fragmentation", "IPv6 fragment flood."),
  V("icmp-frag-flood", "fragmentation", "ICMP fragments flood."),
  V("igmp-frag-flood", "fragmentation", "IGMP Fragment Flood."),
  V("ip-overlap-frag", "fragmentation", "IPv4 overlapping fragments."),
  V("ipv6-overlap-frag", "fragmentation", "IPv6 overlapping fragments."),
  V("ip-short-frag", "fragmentation", "IPv4 fragments whose payload size is less than the minimum IPv4 fragment size.", "tm.minipfragsize"),
  V("ipv6-short-frag", "fragmentation", "IPv6 fragments whose payload size is less than the minimum IPv6 fragment size.", "tm.minipv6fragsize"),
  V("ip-other-frag", "fragmentation", "The total IPv4 fragments' size has exceeded the reassembly queue or the maximum IP packet size."),
  V("ipv6-other-frag", "fragmentation", "The total IPv6 fragments' size has exceeded the reassembly queue or the maximum IP packet size."),
  V("ipv6-atomic-frag", "fragmentation", "IPv6 frame with a fragment extension header, but the MF and offset fields are both 0."),
  // ---- header anomalies (IPv4/TCP/UDP sanity) --------------------------------
  V("bad-ip-opt", "header-anomaly", "IPv4 option with illegal length."),
  V("bad-ttl-val", "header-anomaly", "Bad IP TTL value (TTL == 0 for IPv4)."),
  V("ttl-leq-one", "header-anomaly", "TTL less than or equal to the tunable minimum, for IPv4 forwarding.", "tm.minipttl"),
  V("hdr-len-gt-l2-len", "header-anomaly", "Header length > L2 length: no room in the L2 packet for the IPv4 header (including options)."),
  V("hdr-len-too-short", "header-anomaly", "Header length too short: IPv4 header length in the IP header is less than 20 bytes."),
  V("ip-len-gt-l2-len", "header-anomaly", "IP length > L2 length: total length in the IPv4 header is greater than the L3 part length in the L2 packet."),
  V("l2-len-ggt-ip-len", "header-anomaly", "L2 length >> IP length: the L2 packet length is much greater than the payload length in IPv4."),
  V("payload-len-ls-l2-len", "header-anomaly", "Payload length < L2 length: payload length in the IPv6 header is less than the L3 part length in the L2 packet."),
  V("ip-err-chksum", "header-anomaly", "IP error checksum: IPv4 header checksum error."),
  V("bad-tcp-chksum", "header-anomaly", "Bad TCP checksum."),
  V("bad-udp-chksum", "header-anomaly", "Bad UDP checksum."),
  V("bad-sctp-chksum", "header-anomaly", "Bad SCTP checksum."),
  V("bad-icmp-chksum", "header-anomaly", "Bad ICMP checksum."),
  V("tcp-hdr-len-gt-l2-len", "header-anomaly", "TCP header length > L2 length: no room in the packet for the TCP header (including options)."),
  V("tcp-hdr-len-too-short", "header-anomaly", "TCP header length too short: the offset field in the TCP header is less than 20 bytes."),
  V("tcp-opt-overruns-tcp-hdr", "header-anomaly", "TCP option overruns the TCP header."),
  V("opt-present-with-illegal-len", "header-anomaly", "TCP option present with illegal length."),
  V("unk-tcp-opt-type", "header-anomaly", "Unknown TCP option type."),
  V("unk-ipopt-type", "header-anomaly", "Unknown IP option type."),
  V("ip-opt-frames", "header-anomaly", "IP option frames: IPv4 packets with options.", "tm.acceptipoptions"),
  V("bad-udp-hdr", "header-anomaly", "Bad UDP header (the reference points at the written documentation for the classification reasons)."),
  V("bad-ver", "header-anomaly", "Bad IP version 4: the IPv4 version in the IP header is not 4."),
  V("ip-unk-prot", "header-anomaly", "IP unknown protocol type."),
  V("ip-bad-src", "header-anomaly", "The IP address is a broadcast or multicast address."),
  V("no-l4", "header-anomaly", "No L4: no L4 payload for IPv4."),
  // ---- malformed frames -------------------------------------------------------
  V("bad-icmp-frame", "malformed", "Bad ICMP frames (the reference points at the written documentation for the classification reasons)."),
  V("bad-igmp-frame", "malformed", "Bad IGMP frames (the reference points at the written documentation for the classification reasons)."),
  V("bad-tcp-flags-all-clr", "malformed", "Bad TCP flags: all TCP header flags cleared."),
  V("bad-tcp-flags-all-set", "malformed", "Bad TCP flags: all flags set."),
  V("icmp-frame-too-large", "malformed", "Packets larger than the maximum ICMP frame size.", "dos.maxicmpframesize"),
  V("ether-brdcst-pkt", "malformed", "Ethernet broadcast packet."),
  V("ether-multicast-pkt", "malformed", "Ethernet multicast packet."),
  V("ether-mac-sa-eq-da", "malformed", "Ethernet MAC source address equals the destination address."),
  V("ipv4-mapped-ipv6", "malformed", "IPv4-mapped IPv6 addresses."),
  V("ipv6-bad-src", "malformed", "IPv6 source address is a multicast address, or the IPv6 source or destination is an IPv4-mapped IPv6 address."),
  V("bad-ipv6-ver", "malformed", "Bad IPv6 version: the IP version in the IPv6 packet is not 6."),
  V("tidcmp", "malformed", "ICMP source quench packets."),
  V("host-unreachable", "malformed", 'ICMP packets of type "Host Unreachable".'),
  // ---- IPv6 extension headers -------------------------------------------------
  V("bad-ext-hdr-order", "ipv6-ext", "IPv6 extension headers in the packet are out of order."),
  V("dup-ext-hdr", "ipv6-ext", "Duplicate IPv6 extension headers."),
  V("ext-hdr-too-large", "ipv6-ext", "IPv6 extension header size too large.", "dos.maxipv6extsize"),
  V("too-many-ext-hdrs", "ipv6-ext", "Too many extended headers: more than 4 by default.", "dos.maxipv6exthdrs"),
  V("l4-ext-hdrs-go-end", "ipv6-ext", "No L4: extended headers go to or past the end of the frame."),
  V("routing-header-type-0", "ipv6-ext", "Routing header type 0 present."),
  V("bad-ipv6-hop-cnt", "ipv6-ext", "Bad IPv6 hop count: terminated packet with count == 0. Dropped when the rate hits the rate limit."),
  V("hop-cnt-leq-one", "ipv6-ext", "IPv6 hop count at or below the tunable minimum when the packet needs to be forwarded.", "tm.minipv6hopcnt"),
  // ---- DNS --------------------------------------------------------------------
  V("dns-a-query", "dns", "DNS A query packet."),
  V("dns-aaaa-query", "dns", "DNS AAAA query packet."),
  V("dns-any-query", "dns", "DNS ANY query packet."),
  V("dns-ptr-query", "dns", "DNS PTR query packet."),
  V("dns-ns-query", "dns", "DNS NS query packet."),
  V("dns-soa-query", "dns", "DNS SOA query packet."),
  V("dns-cname-query", "dns", "DNS CNAME query packet."),
  V("dns-mx-query", "dns", "DNS MX query packet."),
  V("dns-txt-query", "dns", "DNS TXT query packet."),
  V("dns-srv-query", "dns", "DNS SRV query packet."),
  V("dns-axfr-query", "dns", "DNS AXFR query packet."),
  V("dns-ixfr-query", "dns", "DNS IXFR query packet."),
  V("dns-other-query", "dns", "DNS OTHER query packet."),
  V("dns-malformed", "dns", "DNS malformed packet."),
  V("dns-oversize", "dns", "DNS packet larger than the tunable maximum DNS frame size.", "dos.maxdnsframesize"),
  // ---- SIP --------------------------------------------------------------------
  V("sip-malformed", "sip", "SIP malformed packet."),
  V("sip-invite-method", "sip", "SIP INVITE method packet."),
  V("sip-ack-method", "sip", "SIP ACK method packet."),
  V("sip-options-method", "sip", "SIP OPTIONS method packet."),
  V("sip-bye-method", "sip", "SIP BYE method packet."),
  V("sip-cancel-method", "sip", "SIP CANCEL method packet."),
  V("sip-register-method", "sip", "SIP REGISTER method packet."),
  V("sip-publish-method", "sip", "SIP PUBLISH method packet."),
  V("sip-notify-method", "sip", "SIP NOTIFY method packet."),
  V("sip-subscribe-method", "sip", "SIP SUBSCRIBE method packet."),
  V("sip-message-method", "sip", "SIP MESSAGE method packet."),
  V("sip-prack-method", "sip", "SIP PRACK method packet."),
  V("sip-other-method", "sip", "SIP OTHER method packet."),
  V("sip-uri-limit", "sip", "Limits SIP URI length."),
  // ---- single-packet oddities ---------------------------------------------------
  V("land-attack", "single-packet", "Land attack: IP source address equals IP destination address. Both v4 and v6 are counted."),
  V("syn-and-fin-set", "single-packet", "SYN and FIN both set."),
  V("fin-only-set", "single-packet", "TCP header with only the FIN flag set."),
  V("tcp-bad-urg", "single-packet", "TCP packets with the URG flag set but a URG pointer of 0."),
  V("tcp-window-size", "single-packet", "TCP non-RST packet with a window size below the tunable minimum.", "dos.tcplowwindowsize"),
  V("tcp-syn-oversize", "single-packet", "TCP data-SYN with a packet length above the tunable maximum (128 bytes by default).", "dos.maxsynsize"),
]);

const VECTOR_BY_NAME: ReadonlyMap<string, VectorInfo> = new Map(VECTORS.map((v) => [v.name, v]));

export const CATEGORY_LABELS: Record<VectorCategory, string> = {
  flood: "Floods",
  "sweep-flood": "Sweep and flood (packet-type driven)",
  fragmentation: "Fragmentation",
  "header-anomaly": "Header anomalies",
  malformed: "Malformed frames",
  "ipv6-ext": "IPv6 extension headers",
  dns: "DNS",
  sip: "SIP",
  "single-packet": "Single-packet oddities",
  behavioral: "Behavioral",
};

/** The documented per-profile vector run-time states. Values outside this
 *  set still parse; they are flagged rather than guessed at. */
const KNOWN_STATES = new Set(["mitigate", "detect-only", "learn-only", "disabled"]);

// ---------------------------------------------------------------------------
// Field annotation: the tmsh reference's parameter semantics, attached to
// the exact keys as they appear in configs (device and profile contexts use
// partly different names for the same ideas).
// ---------------------------------------------------------------------------

const FIELD_NOTES: Record<string, string> = {
  "detection-threshold-pps":
    "absolute detection: attack declared when the current rate (a 1-minute average) reaches this value; infinite disables detection",
  "detection-threshold-percent":
    "relative detection: compares the 1-minute average against a dynamically learned 1-hour average; an increase by this percent declares an attack; infinite disables it",
  "default-internal-rate-limit":
    "the mitigation ceiling: programmed in hardware where the platform has DoS hardware, otherwise enforced in software; bad packets are always dropped regardless; infinite disables the limit",
  "rate-threshold": "detection threshold (pps); infinite disables detection",
  "rate-increase": "relative detection: percent increase over the learned average that declares an attack",
  "rate-limit": "the mitigation ceiling for this vector; traffic above it is dropped",
  "auto-threshold": "automatic mode: detection thresholds adjust to observed traffic; mitigation limits are driven by measured stress",
  "simulate-auto-threshold": "logs what automatic mode would have detected or mitigated; the reference scopes it to manual mode only",
  floor: "the minimum the automatic mode may set for detection-threshold-pps (0 = no floor)",
  ceiling: "the maximum the automatic mode may set for the internal rate limit",
  state: "run-time state of the vector",
  enforce: "the packet-drop action of DoS detection for this attack type",
  "bad-actor": "per-source-IP bad-actor detection",
  "per-source-ip-detection-pps": "bad-actor detection rate for a single source IP",
  "per-source-ip-limit-pps": "bad-actor allowed rate for a single source IP",
  "auto-blacklisting": "automatic blacklisting of offending IPs",
  "blacklist-category": "the IP Intelligence category offenders are added to",
  "blacklist-detection-seconds": "how long an IP must offend before blacklisting",
  "blacklist-duration": "how long the IP stays blocked",
  "per-dst-ip-detection-pps": "attack detection threshold (pps) per destination IP",
  "per-dst-ip-limit-pps": "attack mitigation threshold (pps) per destination IP",
  "auto-scrubbing": "per-destination-IP scrubbing",
  "scrubbing-category": "the scrubbing IP Intelligence category",
  "scrubbing-detection-seconds": "how long the destination must be attacked before scrubbing (default 10)",
  "scrubbing-duration": "how long the destination is scrubbed (default 900)",
  "packet-types": "which packet types this sweep/flood vector classifies",
  "allow-upstream-scrubbing": "advertise the attacked destination for upstream scrubbing",
  "attacked-dst": "attacked-destination handling",
  "threshold-sensitivity": "how much padding automatic and behavioral DoS apply to thresholds (low/medium/high; default medium)",
};

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function numOrInf(v: string): number | "infinite" | null {
  if (v === "infinite") return "infinite";
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

/** Read one vector stanza (device or profile context) into a reading. */
function readVector(node: ConfigNode, context: "device" | "profile", profileName?: string, section?: string): VectorReading {
  const name = node.tokens.join(" ");
  const fields: FieldNote[] = [];
  const raw: Record<string, string> = {};

  for (const child of node.children ?? []) {
    if (child.children !== undefined) {
      if (child.tokens[0] === "packet-types") {
        const kids = (child.children ?? []).map((k) => k.tokens.join(" ")).join(", ");
        raw["packet-types"] = kids;
        fields.push({ key: "packet-types", value: kids, note: FIELD_NOTES["packet-types"] });
      }
      continue;
    }
    const { key, value } = asKeyValue(child);
    raw[key] = value;
    fields.push({ key, value, note: FIELD_NOTES[key] });
  }

  const info = VECTOR_BY_NAME.get(name) ?? null;
  const obs: string[] = [];

  // Identity.
  if (!info) {
    obs.push(
      `"${name}" is outside this tool's curated catalogue (the tmsh reference's vector table as reproduced here). The threshold mechanics below still apply; the identity line does not. Vector sets vary by version and module provisioning.`,
    );
  }

  // ---- mode analysis ---------------------------------------------------------
  const auto = raw["auto-threshold"] === "enabled";
  // Detection pps: device configs say detection-threshold-pps, profiles say
  // rate-threshold; the inversion check needs whichever is present.
  const detPpsKey = raw["detection-threshold-pps"] !== undefined ? "detection-threshold-pps" : "rate-threshold";
  const detPps = raw[detPpsKey] !== undefined ? numOrInf(raw[detPpsKey]) : null;
  const detPct = raw["detection-threshold-percent"] !== undefined ? numOrInf(raw["detection-threshold-percent"]) : null;
  const rateLimit =
    raw["default-internal-rate-limit"] !== undefined
      ? numOrInf(raw["default-internal-rate-limit"])
      : raw["rate-limit"] !== undefined
        ? numOrInf(raw["rate-limit"])
        : null;
  const rateLimitKey = raw["default-internal-rate-limit"] !== undefined ? "default-internal-rate-limit" : "rate-limit";

  if (auto) {
    obs.push(
      "auto-threshold is enabled: per F5's DDoS training material, the system adjusts the DETECTION thresholds to observed traffic patterns, while the MITIGATION rate limits are always dynamic, driven by measured system or protected-object stress. Anomalous traffic without stress raises alerts but does not block.",
    );
    if (detPps !== null || detPct !== null) {
      obs.push(
        "Manual detection thresholds are also present on this vector. Under automatic mode the automatic values govern; the floor and ceiling attributes are the supported way to bound what automatic mode may choose.",
      );
    }
    if (raw["simulate-auto-threshold"] === "enable" || raw["simulate-auto-threshold"] === "enabled") {
      obs.push("simulate-auto-threshold is set while auto-threshold is enabled; the reference scopes the simulation option to manual mode only.");
    }
  } else if (raw["simulate-auto-threshold"] === "enable" || raw["simulate-auto-threshold"] === "enabled") {
    obs.push(
      "simulate-auto-threshold: the system logs what automatic mode would have detected or mitigated, without acting. A dry run for auto-thresholding, valid exactly here, in manual mode.",
    );
  }

  // ---- the inversion: mitigation below detection ------------------------------
  if (typeof rateLimit === "number" && typeof detPps === "number" && rateLimit < detPps) {
    obs.push(
      `${rateLimitKey} (${rateLimit}) sits BELOW ${detPpsKey} (${detPps}). Rate limiting engages before an attack is ever declared: traffic between the two values is silently dropped with no attack log. F5's SYN-cookie troubleshooting series warns about exactly this arrangement - the system does warn at configuration time, and then drops quietly.`,
    );
  }

  // ---- detection disabled while limiting -------------------------------------
  if (detPps === "infinite" && detPct === "infinite" && typeof rateLimit === "number") {
    obs.push(
      "Both detection thresholds are infinite (detection disabled) while a finite rate limit is set: the vector limits traffic without ever raising an attack event. Deliberate for pure policing; surprising if you expected logs.",
    );
  }

  // ---- enforce / state --------------------------------------------------------
  if (raw["enforce"] === "disabled") {
    obs.push("enforce is disabled: detection still counts and reports, but the packet-drop action for this attack type is off. Monitoring, not mitigation.");
  }
  if (raw["state"] !== undefined) {
    if (!KNOWN_STATES.has(raw["state"])) {
      obs.push(`state "${raw["state"]}" is outside the documented set (mitigate, detect-only, learn-only, disabled); shown as written.`);
    } else if (raw["state"] === "detect-only") {
      obs.push("state detect-only: the vector detects and reports but does not drop. Visibility without action.");
    } else if (raw["state"] === "learn-only") {
      obs.push("state learn-only: the vector contributes to baselines without alerting or acting.");
    } else if (raw["state"] === "disabled") {
      obs.push("state disabled: this vector neither detects nor mitigates.");
    }
  }

  // ---- bad-actor wiring --------------------------------------------------------
  if (raw["bad-actor"] === "enabled" && raw["per-source-ip-detection-pps"] === undefined && raw["per-source-ip-limit-pps"] === undefined) {
    obs.push("bad-actor is enabled but neither per-source-ip threshold is set here; per-source detection needs its rates to act on.");
  }
  if ((raw["per-source-ip-detection-pps"] !== undefined || raw["per-source-ip-limit-pps"] !== undefined) && raw["bad-actor"] !== "enabled") {
    obs.push("per-source-ip thresholds are set but bad-actor is not enabled on this vector; the per-source rates ride the bad-actor feature.");
  }
  const psDet = raw["per-source-ip-detection-pps"] !== undefined ? numOrInf(raw["per-source-ip-detection-pps"]) : null;
  const psLim = raw["per-source-ip-limit-pps"] !== undefined ? numOrInf(raw["per-source-ip-limit-pps"]) : null;
  if (typeof psDet === "number" && typeof psLim === "number" && psLim < psDet) {
    obs.push(`per-source-ip-limit-pps (${psLim}) sits below per-source-ip-detection-pps (${psDet}): the same inversion as above, per offending source.`);
  }

  // ---- sweep/flood specifics -----------------------------------------------------
  if ((name === "sweep" || name === "flood") && raw["packet-types"] === undefined) {
    obs.push("No packet-types list on this sweep/flood vector in the paste; the vector classifies the packet types that list selects.");
  }

  // ---- identity extras -----------------------------------------------------------
  if (info?.dbVar) {
    obs.push(`The boundary this vector enforces is tunable: sys db ${info.dbVar}.`);
  }
  for (const n of info?.notes ?? []) obs.push(n);

  return { name, context, profileName, profileSection: section, line: node.line, info, fields, observations: obs };
}

// ---------------------------------------------------------------------------
// run()
// ---------------------------------------------------------------------------

export function run(input: string): DosResult {
  const text = (input ?? "").trim();

  if (!text) {
    throw new Error(
      'Paste a security dos device-config stanza and/or security dos profile stanzas, a single vector name (for example "tcp-half-open"), or the word "vectors" for the catalogue.',
    );
  }

  if (/^(vectors|all|list|catalog)$/i.test(text)) {
    const order: VectorCategory[] = ["flood", "sweep-flood", "fragmentation", "header-anomaly", "malformed", "ipv6-ext", "dns", "sip", "single-packet"];
    return {
      ok: true,
      mode: "catalog",
      catalog: order.map((c) => ({ category: c, label: CATEGORY_LABELS[c], vectors: VECTORS.filter((v) => v.category === c) })),
      notes: [
        "Names and descriptions reproduce the tmsh security dos device-config reference's vector table, sys-db tunables included; the grouping is this tool's organization. Vector sets vary by version and provisioning.",
      ],
    };
  }

  if (!text.includes("{") && !/\n/.test(text) && !/^security\s/i.test(text)) {
    const name = text.toLowerCase();
    const info = VECTOR_BY_NAME.get(name);
    if (info) return { ok: true, mode: "vector", vector: info, notes: [] };
    throw new Error(`"${text}" is not in the curated vector catalogue. Type "vectors" to list it.`);
  }

  const parsed = parseTmsh(text);
  const readings: VectorReading[] = [];
  const deviceLevel: DosResult["deviceLevel"] = {};
  const notes: string[] = [];

  const walkVectorContainer = (container: ConfigNode, context: "device" | "profile", profileName?: string, section?: string) => {
    for (const v of container.children ?? []) {
      if (v.children === undefined) continue;
      readings.push(readVector(v, context, profileName, section));
    }
  };

  for (const node of parsed.nodes) {
    const { type, name } = asTopLevel(node);
    if (type === "security dos device-config") {
      for (const child of node.children ?? []) {
        if (child.children !== undefined) {
          if (child.tokens[0] === "dos-device-vector") walkVectorContainer(child, "device");
          else if (child.tokens[0] === "dynamic-signatures") {
            deviceLevel.dynamicSignatures = (child.children ?? [])
              .filter((k) => k.children === undefined)
              .map((k) => {
                const { key, value } = asKeyValue(k);
                const noteMap: Record<string, string> = {
                  detection: "anomaly detection mode for dynamic-signature generation (learn-only is the default: enabled, but silent, building baselines)",
                  mitigation: "how aggressively dynamic signatures mitigate (none is the default)",
                };
                return { key, value, note: noteMap[key] };
              });
          }
          continue;
        }
        const { key, value } = asKeyValue(child);
        if (key === "threshold-sensitivity") deviceLevel.thresholdSensitivity = value;
        else if (key === "log-publisher") deviceLevel.logPublisher = value;
      }
    } else if (type.startsWith("security dos profile")) {
      for (const child of node.children ?? []) {
        if (child.children === undefined) continue;
        const sec = child.tokens[0];
        if (sec === "dos-network" || sec === "protocol-dns" || sec === "protocol-sip") {
          // Each section holds named blocks whose children include the
          // vector container (network-attack-vector / dns-query-vector /
          // sip-attack-vector) or, in flatter exports, the vectors directly.
          for (const inner of child.children ?? []) {
            if (inner.children === undefined) continue;
            const innerName = inner.tokens[0];
            if (/vector/.test(innerName)) {
              walkVectorContainer(inner, "profile", name, sec);
            } else {
              for (const maybe of inner.children ?? []) {
                if (maybe.children !== undefined && /vector/.test(maybe.tokens[0])) {
                  walkVectorContainer(maybe, "profile", name, sec);
                }
              }
            }
          }
        }
      }
    }
  }

  if (readings.length === 0 && deviceLevel.thresholdSensitivity === undefined && !deviceLevel.dynamicSignatures) {
    const hint = !parsed.ok && parsed.error ? ` (parser: ${parsed.error.message})` : "";
    throw new Error(
      `No security dos device-config or security dos profile vector stanzas found${hint}. Paste them as tmsh lists them, a vector name, or type "vectors".`,
    );
  }
  if (!parsed.ok && parsed.error) {
    notes.push(`parser: ${parsed.error.message}${parsed.error.line ? ` (line ${parsed.error.line})` : ""} - reading what parsed cleanly.`);
  }
  if (deviceLevel.thresholdSensitivity) {
    notes.push(
      `threshold-sensitivity ${deviceLevel.thresholdSensitivity}: how much padding automatic and behavioral DoS apply when adjusting thresholds (default medium).`,
    );
  }

  return { ok: true, mode: "config", readings, deviceLevel, notes };
}
