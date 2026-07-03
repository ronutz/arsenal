// ============================================================================
// src/lib/tools/f5-bigip-tcpdump-builder/compute.ts
// ----------------------------------------------------------------------------
// BIG-IP TCPDUMP COMMAND BUILDER - assemble a valid tcpdump command for an F5
// BIG-IP from a set of options, including the F5-specific interface syntax.
//
// What makes BIG-IP tcpdump different from stock tcpdump is the interface
// argument. Beyond a VLAN name or interface id, BIG-IP accepts:
//   - "0.0"  -> every TMM data interface (not rate-limited; needs a filter)
//   - a ":n / :nn / :nnn" suffix on the interface = TMM detail "noise":
//       :n   low    - virtual server name, interface, direction
//       :nn  medium - adds flow details
//       :nnn high   - adds the IP:port of BOTH sides of the F5 (peer flow)
//   - a trailing "p" (e.g. ":nnnp" or ":p") = capture BOTH sides of the proxy
//     (client-to-F5 AND F5-to-pool-member)
// The ":n" suffix is unrelated to the "-n" flag (which disables name lookup);
// conflating them is the classic mistake, so they are modelled separately here.
// Source: F5 K411 (packet tracing with tcpdump) and K13637 (capturing internal
// TMM information with tcpdump).
//
// DETERMINISM (D-49): a pure function of its options - no clock, no randomness,
// no network, and it executes nothing. It only formats a command string for the
// user to run on their own device, plus advisory warnings. Golden vectors pin it.
// ============================================================================

/** TMM detail level appended to the interface (the ":n" family). */
export type TmmDetail = "" | "n" | "nn" | "nnn";

/** Name-resolution behaviour: stock tcpdump -n / -nn. */
export type NameResolution = "default" | "no-dns" | "no-dns-port";

/** Snapshot length handling. */
export type Snaplen = "default" | "full" | "custom";

/** Verbosity: stock tcpdump -v / -vv / -vvv. */
export type Verbosity = "" | "v" | "vv" | "vvv";

export interface TcpdumpOptions {
  /** Interface or VLAN: "0.0", a VLAN name ("internal"), or an id ("1.1"). */
  iface: string;
  /** TMM detail suffix (low/medium/high). */
  detail: TmmDetail;
  /** Append "p" - capture both client-side and server-side flows. */
  bothSides: boolean;
  /** -n (no DNS) / -nn (no DNS or port names). */
  nameResolution: NameResolution;
  /** -s0 (full) / -s<N> (custom) / omit. */
  snaplen: Snaplen;
  /** Byte count for snaplen === "custom". */
  snaplenValue?: number;
  /** -c <N>: stop after N packets. */
  count?: number;
  /** -v / -vv / -vvv. */
  verbosity: Verbosity;
  /** -e: print the link-level (Ethernet) header. */
  etherHeader: boolean;
  /** -X: print packet payload in hex + ASCII. */
  hexAscii: boolean;
  /** -w <file>: write a binary pcap (required when sending to F5 Support). */
  writeFile: boolean;
  /** Output path for -w. */
  fileName: string;
  /** A BPF filter expression, e.g. "host 10.1.1.1 and port 443". Free-form. */
  filter: string;
}

export interface TcpdumpResult {
  /** The assembled command. */
  command: string;
  /** Non-fatal advisories (e.g. an unfiltered 0.0 capture). */
  warnings: string[];
}

/** Sensible defaults; the UI starts here and overrides per control. */
export const DEFAULT_OPTIONS: TcpdumpOptions = {
  iface: "0.0",
  detail: "nnn",
  bothSides: true,
  nameResolution: "no-dns-port",
  snaplen: "full",
  count: undefined,
  verbosity: "",
  etherHeader: false,
  hexAscii: false,
  writeFile: true,
  fileName: "/var/tmp/capture.pcap",
  filter: "host 10.1.1.1",
};

/** Quote an interface/path token for the shell only when it needs it: a
 *  partition-qualified VLAN ("/Common/internal") or anything with whitespace.
 *  A colon must NOT be quoted away - it is the TMM-detail separator - but a
 *  name that itself contains a colon is invalid on BIG-IP, so we never add one
 *  to a name; the suffix is appended outside the quoting. */
function quoteIfNeeded(token: string): string {
  return /\s/.test(token) ? `'${token}'` : token;
}

/** Build the interface argument: base + optional ":<detail><p>" suffix. The
 *  base name is quoted if needed; the suffix is appended after the quotes so
 *  the colon stays a separator rather than part of the (quoted) name. */
function buildInterfaceArg(opts: TcpdumpOptions): string {
  const base = quoteIfNeeded(opts.iface.trim());
  const suffix = opts.detail + (opts.bothSides ? "p" : "");
  return suffix ? `${base}:${suffix}` : base;
}

/**
 * buildCommand - assemble the tcpdump command and any advisories.
 * Token order follows the form F5 documents: name-resolution flags, -i, then
 * snaplen, count, verbosity, -e, -X, -w, and finally the BPF filter (filters
 * are positional and must come last).
 */
export function buildCommand(opts: TcpdumpOptions): TcpdumpResult {
  const parts: string[] = ["tcpdump"];
  const warnings: string[] = [];

  // -n / -nn (kept as one flag; -nn implies -n)
  if (opts.nameResolution === "no-dns") parts.push("-n");
  else if (opts.nameResolution === "no-dns-port") parts.push("-nn");

  // -i <interface[:detail][p]>
  const ifaceArg = buildInterfaceArg(opts);
  parts.push("-i", ifaceArg);

  // -s snaplen
  if (opts.snaplen === "full") {
    parts.push("-s0");
  } else if (opts.snaplen === "custom") {
    const n = Number.isFinite(opts.snaplenValue) ? Math.max(0, Math.trunc(opts.snaplenValue as number)) : 0;
    parts.push(`-s${n}`);
  }

  // -c count
  if (opts.count !== undefined && Number.isFinite(opts.count) && (opts.count as number) > 0) {
    parts.push("-c", String(Math.trunc(opts.count)));
  }

  // -v / -vv / -vvv
  if (opts.verbosity) parts.push(`-${opts.verbosity}`);

  // -e, -X
  if (opts.etherHeader) parts.push("-e");
  if (opts.hexAscii) parts.push("-X");

  // -w file
  if (opts.writeFile) {
    const f = opts.fileName.trim() || "/var/tmp/capture.pcap";
    parts.push("-w", quoteIfNeeded(f));
  }

  // BPF filter (positional, last)
  const filter = opts.filter.trim();
  if (filter) parts.push(filter);

  // ---- Advisories (BIG-IP operational guidance, not errors) ----
  // We push STABLE CODES, not prose, so the UI can localise each advisory via
  // tools.f5-bigip-tcpdump-builder.warnings.<code>. The golden vectors assert the
  // COUNT of advisories, so the wording can evolve without touching them.
  const isAllIfaces = opts.iface.trim() === "0.0";
  const hasBound = filter.length > 0 || (opts.count !== undefined && (opts.count as number) > 0);
  if (isAllIfaces && !hasBound) {
    warnings.push("unfiltered-all-tmm");
  }
  if (opts.snaplen === "full") {
    warnings.push("snaplen-zero-modern");
  }
  if (opts.writeFile && opts.hexAscii) {
    warnings.push("hex-with-writefile");
  }
  if (/:.*:/.test(ifaceArg)) {
    warnings.push("colon-in-iface-name");
  }

  return { command: parts.join(" "), warnings };
}
