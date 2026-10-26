// ============================================================================
// src/lib/dev-out/rdap/special-ip.ts
// ----------------------------------------------------------------------------
// SPECIAL-PURPOSE IP ADDRESSES ARE ANSWERED LOCALLY (Round 2, 2026-10-25;
// PRIME's decision of that day). The RDAP lookup offered a registry query for
// any address inside an RIR bootstrap block, so 192.0.2.1 (TEST-NET-1, inside
// ARIN's 192/8) or 198.18.0.1 (benchmarking) would have been sent to a regional
// registry. Like special-purpose AS numbers since Round 1, such an address is
// now explained here, with no Ask row and no query.
//
// NO NEW LIST. Every row of the IANA IPv4 and IPv6 Special-Purpose Address
// Space registries lives in one shared module, src/lib/iana/special-purpose.ts
// (CSVs re-read 2026-10-26, registries updated 2025-10-09; batch B, item B10),
// read by the CIDR tool and by the SSRF URL classifier
// (src/lib/tools/ssrf-url-classifier/compute.ts), which adds the multicast
// ranges, the cloud metadata endpoints and the IPv4-in-IPv6 embeddings. This
// module calls the classifier's classifyUrl with the bare address and reads
// its verdict, so the RDAP answer cannot drift from the SSRF tool's, and both
// name the same registry rows as the CIDR tool.
//
// THE RULE. An address is answered locally when the classifier gives it any
// category other than "public" (loopback, private, link-local, shared address
// space, cloud metadata, or reserved: documentation, benchmarking, "this
// network", class E, limited broadcast, multicast and the rest), or when it
// falls in any special-purpose registry row at all, including the rows the
// registry marks globally reachable (anycast service addresses, AS112, AMT)
// and the translation prefixes (NAT64, 6to4, Teredo, IPv4-mapped), the same
// way AS112 is a special-purpose AS number in the ASN table. Only an address
// in no special-purpose row and no special range is offered to a registry.
// ============================================================================

import { classifyUrl, type HostCategory, type SpecialBlock } from "@/lib/tools/ssrf-url-classifier/compute";
import type { ClassifiedInput } from "./compute";

/** What the page shows for a special-purpose address. */
export interface SpecialIp {
  /** 4 or 6. */
  version: 4 | 6;
  /** The address as the classifier canonicalised it (RFC 5952 for IPv6). */
  address: string;
  /** The classifier's category: never "public" unless a registry row matched. */
  category: HostCategory;
  /** The IANA registry row the address falls in, or null (multicast has a registry of its own, not a row here). */
  block: SpecialBlock | null;
  /** For an IPv6 address carrying an IPv4 address: that address and its IPv4 registry row, if any. */
  embedded: { ipv4: string; block: SpecialBlock | null } | null;
  /** True for 224.0.0.0/4 and ff00::/8, which the classifier rates reserved without a special-purpose row. */
  multicast: boolean;
}

/**
 * The dotted-quad text in plain decimal octets ("010.0.0.1" becomes "10.0.0.1"). The RDAP classifier accepts
 * leading zeros as decimal, while the SSRF classifier reads them as octal (that is its job: it exposes obfuscated
 * hosts), so the address is rewritten in decimal first and both read the same number.
 */
function decimalDotted(v4: string): string {
  // Each octet as its decimal value, without leading zeros.
  return v4.split(".").map((o) => String(Number(o))).join(".");
}

/** A registry row with its Name column stripped of surrounding literal quotes (anchored, linear: ReDoS-safe). */
function bare(b: SpecialBlock | null): SpecialBlock | null {
  // No row, nothing to strip.
  if (b === null) return null;
  // The same columns, the name unquoted.
  return { ...b, name: b.name.replace(/^"([^"]*)"$/, "$1") };
}

/**
 * Whether an RDAP input is a special-purpose IP address, and if so what to tell the reader.
 * @param input the RDAP tool's classified input
 * @returns the explanation for a special-purpose address, or null (a domain, an AS number, or an ordinary address)
 */
export function specialIpFor(input: ClassifiedInput): SpecialIp | null {
  // Only addresses are judged here (AS numbers have their own table, domains have none).
  if (input.kind !== "ipv4" && input.kind !== "ipv6") return null;
  // The address as a URL host: bracketed for IPv6, plain decimal for IPv4.
  const host = input.kind === "ipv4" ? decimalDotted(input.value) : `[${input.value}]`;
  // The SSRF classifier's verdict; it never resolves names or sends anything.
  let r;
  try {
    r = classifyUrl(`http://${host}/`);
  } catch {
    // Defensive: an input the RDAP classifier accepted but this one refuses is not judged special.
    return null;
  }
  // Not read as an IP literal: nothing to judge.
  if (!r.isIp || r.canonicalIp === null) return null;
  // Multicast: rated reserved by the classifier, with no special-purpose row.
  const canonical = r.canonicalIp;
  const multicast = r.ipVersion === 4 ? Number(canonical.split(".")[0]) >= 224 && Number(canonical.split(".")[0]) <= 239 : /^ff/i.test(canonical);
  // An ordinary public address in no registry row: not special, the registry may be asked.
  if (r.category === "public" && r.specialBlock === null && r.embeddedSpecialBlock === null) return null;
  // Special-purpose: everything the page needs, from the classifier's own columns (names without the literal quotes
  // two IPv4 rows carry, '"This network"', since the page quotes the name itself).
  return {
    version: r.ipVersion === 6 ? 6 : 4,
    address: canonical,
    category: r.category,
    block: bare(r.specialBlock),
    embedded: r.embeddedIpv4 ? { ipv4: r.embeddedIpv4, block: bare(r.embeddedSpecialBlock) } : null,
    multicast,
  };
}
