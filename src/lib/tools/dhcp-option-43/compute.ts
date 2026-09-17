// ============================================================================
// src/lib/tools/dhcp-option-43/compute.ts
// ----------------------------------------------------------------------------
// DHCP Option 43 vendor-specific encoder for wireless controller discovery.
//
// WHY THIS TOOL EXISTS. Option 43 is RFC 2132's escape hatch: the RFC defines
// the option and then explicitly leaves the CONTENT to each vendor. The result
// is that "the option 43 value for my controller" has at least four mutually
// incompatible answers, and the failure mode when you use the wrong one is an
// access point that boots, gets an address, and silently never joins. Nothing
// logs an error. That is exactly the kind of thing a generator should remove.
//
// ---------------------------------------------------------------------------
// THE FOUR ENCODING FAMILIES, AND WHY A SINGLE "IP TO HEX" BOX IS WRONG
//
//   BINARY TLV   Cisco, UniFi: the IP as four bytes. 192.168.10.5 -> c0a80a05
//   ASCII TLV    Ruckus: the IP as TEXT, each digit and dot as its ASCII byte.
//                192.168.0.200 -> 3139322e3136382e302e323030. Ruckus's own KB
//                warns about this: "if we convert 10 to Hex it will be 0A,
//                however ASCII to Hex would be 31 30."
//   PLAIN STRING Aruba, ExtremeWireless: no hex at all. The DHCP server sends
//                the IP as a string, and a hex value is simply wrong.
//   NOT OPTION 43 FortiAP: uses option 138 (CAPWAP AC). A generator that emits
//                an option 43 value for a FortiAP is confidently answering the
//                wrong question.
//
// Every vendor profile below cites the VENDOR's own documentation. Community
// posts were deliberately not used as a source for any byte: an approximately
// right value pasted into production DHCP is worse than no value.
//
// DELIBERATELY ABSENT: Aerohive. It was acquired by Extreme in 2019 and folded
// into ExtremeCloud IQ; no vendor documentation for a standalone Aerohive
// sub-option could be found, only community claims of 225/226. The only
// DOCUMENTED 226 is EXTREME.cloudiq-ip on Fabric Engine switches, which is a
// different device class. Until a vendor source exists, it stays out.
// ============================================================================

/** How a vendor expects the value to be delivered. */
export type Option43Encoding =
  | "hex" // a hex string for option 43
  | "string" // plain text for option 43; hex would be wrong
  | "other-option"; // this vendor does not use option 43 at all

export interface VendorProfile {
  id: string;
  /** Display name, not translated: these are product names. */
  label: string;
  encoding: Option43Encoding;
  /** Sub-option code, where the vendor defines one. */
  subOption?: number;
  /** How the address is represented inside the value. */
  addressForm?: "binary" | "ascii";
  /** Accepts more than one controller address in a single value. */
  multiple: boolean;
  /** Option 60 / VCI that MUST accompany option 43, where the vendor requires one. */
  vendorClass?: string;
  /** The option number to use instead, when encoding is "other-option". */
  useOption?: number;
  /** Vendor documentation this profile was built from. */
  source: { label: string; url: string };
}

export const VENDOR_PROFILES: readonly VendorProfile[] = [
  {
    id: "cisco-wlc",
    label: "Cisco Wireless LAN Controller",
    encoding: "hex",
    subOption: 0xf1,
    addressForm: "binary",
    multiple: true,
    source: {
      label: "Cisco: Configure DHCP Option 43 for Lightweight Access Points",
      url: "https://www.cisco.com/c/en/us/support/docs/wireless-mobility/wireless-lan-wlan/97066-dhcp-option-43-00.html",
    },
  },
  {
    id: "ruckus-zonedirector",
    label: "Ruckus ZoneDirector",
    encoding: "hex",
    subOption: 0x03,
    addressForm: "ascii",
    multiple: false,
    source: {
      label: "Ruckus KB 000008703: Understanding DHCP Option 43 Hexadecimal code",
      url: "https://support.ruckuswireless.com/articles/000008703",
    },
  },
  {
    id: "ruckus-smartzone",
    label: "Ruckus SmartZone / vSZ",
    encoding: "hex",
    subOption: 0x06,
    addressForm: "ascii",
    multiple: false,
    source: {
      label: "Ruckus KB 000008703: sub-option 06 is typical for SmartZone (SCG) APs",
      url: "https://support.ruckuswireless.com/articles/000008703",
    },
  },
  {
    id: "unifi-ip",
    label: "Ubiquiti UniFi (controller IP)",
    encoding: "hex",
    subOption: 0x01,
    addressForm: "binary",
    multiple: false,
    source: {
      label: "Ubiquiti: Layer 3 Adoption for Remote UniFi Controllers",
      url: "https://help.ui.com/hc/en-us/articles/204909754-UniFi-Layer-3-Adoption-for-Remote-UniFi-Controllers",
    },
  },
  {
    id: "extreme-wireless",
    label: "ExtremeWireless / ExtremeCloud IQ Controller",
    encoding: "string",
    subOption: 0x01,
    multiple: false,
    vendorClass: "HiPath <AP model> on older APs; the bare model (for example AP410) on newer ones",
    source: {
      label: "Extreme Networks: Configuring DHCP Option 43 (ExtremeCloud IQ Controller Deployment Guide)",
      url: "https://documentation.extremenetworks.com/XIQC/10.06/DG/GUID-A9F28828-9A51-4923-AE62-A252E4745D73.shtml",
    },
  },
  {
    id: "extreme-cloudiq-switch",
    label: "Extreme Fabric Engine switch to ExtremeCloud IQ",
    encoding: "string",
    subOption: 226,
    multiple: false,
    source: {
      label: "Extreme Networks: DHCP Option 43, Fabric Engine User Guide (sub-option 226, EXTREME.cloudiq-ip)",
      url: "https://documentation.extremenetworks.com/Fabric%20Engine%20v9.1%20User%20Guide/GUID-96B8F9A4-D7DF-42A4-A398-2A5C6B644DC1.shtml",
    },
  },
  {
    id: "aruba",
    label: "HPE Aruba mobility controller",
    encoding: "string",
    multiple: false,
    vendorClass: "ArubaAP",
    source: {
      label: "HPE Aruba Networking: standard and vendor-specific DHCP options for access points",
      url: "https://arubanetworking.hpe.com/techdocs/aos/wifi-design-deploy/network-operations/dhcp-for-aps/option-implementation/uap/",
    },
  },
  {
    id: "fortiap",
    label: "Fortinet FortiAP",
    encoding: "other-option",
    useOption: 138,
    multiple: true,
    source: {
      label: "Fortinet: FortiAP acquires the AC address from DHCP option 138 (factory default)",
      url: "https://docs.fortinet.com/document/fortiap/7.2.5/fortiwifi-and-fortiap-configuration-guide/540137",
    },
  },
];

export type Option43ErrorCode =
  | "empty"
  | "unknown-vendor"
  | "bad-address"
  | "too-many"
  | "value-too-long";

export class Option43Error extends Error {
  code: Option43ErrorCode;
  value?: string;
  constructor(code: Option43ErrorCode, message: string, value?: string) {
    super(message);
    this.name = "Option43Error";
    this.code = code;
    this.value = value;
  }
}

export interface Option43Report {
  vendor: VendorProfile;
  addresses: string[];
  /** The option number the value belongs to - 43, or 138 for FortiAP. */
  option: number;
  encoding: Option43Encoding;
  /** The hex value, when the vendor uses one. Lower case, no separators. */
  hex?: string;
  /** The plain value, when the vendor expects a string. */
  text?: string;
  /** Byte-by-byte account of how the hex was built, for the reader who wants it. */
  breakdown?: { bytes: string; meaning: string }[];
  /** Ready-to-paste lines for common DHCP servers. */
  serverSnippets: { server: string; lines: string[] }[];
  /** Notes that change what the reader must do - never decoration. */
  notes: string[];
}

const MAX_OPTION_BYTES = 255; // RFC 2132: a DHCP option's value is length-prefixed by one byte.

/** Strict dotted-quad parse. Rejects leading zeros, which some servers reinterpret as octal. */
function parseIPv4(raw: string): number[] {
  const parts = raw.trim().split(".");
  if (parts.length !== 4) {
    throw new Option43Error("bad-address", `"${raw}" is not a dotted-quad IPv4 address`, raw);
  }
  return parts.map((p) => {
    if (!/^\d{1,3}$/.test(p)) {
      throw new Option43Error("bad-address", `"${raw}" has a non-numeric octet`, raw);
    }
    if (p.length > 1 && p.startsWith("0")) {
      throw new Option43Error(
        "bad-address",
        `"${raw}" has a leading zero in an octet; some DHCP servers read that as octal`,
        raw
      );
    }
    const n = Number(p);
    if (n > 255) {
      throw new Option43Error("bad-address", `"${raw}" has an octet above 255`, raw);
    }
    return n;
  });
}

const hex2 = (n: number) => n.toString(16).padStart(2, "0");

/** The IP as four bytes: 192.168.10.5 -> c0a80a05 */
function binaryHex(ip: string): string {
  return parseIPv4(ip).map(hex2).join("");
}

/** The IP as its TEXT: 192.168.0.200 -> 3139322e3136382e302e323030 */
function asciiHex(ip: string): string {
  parseIPv4(ip); // validate, then encode the ORIGINAL text
  return Array.from(ip.trim())
    .map((c) => hex2(c.charCodeAt(0)))
    .join("");
}

export function run(vendorId: string, input: string): Option43Report {
  const vendor = VENDOR_PROFILES.find((v) => v.id === vendorId);
  if (!vendor) {
    throw new Option43Error("unknown-vendor", `no vendor profile with id "${vendorId}"`, vendorId);
  }
  const addresses = input
    .split(/[\s,;]+/)
    .map((a) => a.trim())
    .filter(Boolean);

  if (addresses.length === 0) {
    throw new Option43Error("empty", "enter at least one controller address");
  }
  if (!vendor.multiple && addresses.length > 1) {
    throw new Option43Error(
      "too-many",
      `${vendor.label} takes a single controller address in this option`
    );
  }
  for (const a of addresses) parseIPv4(a);

  const notes: string[] = [];
  if (vendor.vendorClass) {
    notes.push("vendor-class-required");
  }

  // ---- vendors that do not use option 43 at all ----------------------------
  if (vendor.encoding === "other-option") {
    return {
      vendor,
      addresses,
      option: vendor.useOption!,
      encoding: "other-option",
      text: addresses.join(", "),
      serverSnippets: [
        {
          server: "isc-dhcp",
          lines: [`option capwap-ac-v4 ${addresses.join(", ")};`],
        },
        {
          server: "cisco-ios",
          lines: [`option ${vendor.useOption} ip ${addresses.join(" ")}`],
        },
      ],
      notes: [...notes, "not-option-43"],
    };
  }

  // ---- vendors that want a plain string ------------------------------------
  if (vendor.encoding === "string") {
    const text = addresses[0];
    const snippets: { server: string; lines: string[] }[] = [
      { server: "isc-dhcp", lines: [`option vendor-encapsulated-options "${text}";`] },
      { server: "cisco-ios", lines: [`option 43 ascii "${text}"`] },
    ];
    if (vendor.vendorClass && !vendor.vendorClass.includes("<")) {
      snippets[1].lines.unshift(`option 60 ascii "${vendor.vendorClass}"`);
    }
    return {
      vendor,
      addresses,
      option: 43,
      encoding: "string",
      text,
      serverSnippets: snippets,
      notes: [...notes, "string-not-hex"],
    };
  }

  // ---- hex TLV -------------------------------------------------------------
  const sub = vendor.subOption!;
  const breakdown: { bytes: string; meaning: string }[] = [];
  let value: string;

  if (vendor.addressForm === "binary") {
    value = addresses.map(binaryHex).join("");
    breakdown.push({ bytes: hex2(sub), meaning: "sub-option" });
    breakdown.push({
      bytes: hex2(value.length / 2),
      meaning: "length: four bytes per address",
    });
    for (const a of addresses) breakdown.push({ bytes: binaryHex(a), meaning: a });
  } else {
    const a = addresses[0];
    value = asciiHex(a);
    breakdown.push({ bytes: hex2(sub), meaning: "sub-option" });
    breakdown.push({
      bytes: hex2(a.length),
      meaning: `length: ${a.length} characters, dots included`,
    });
    breakdown.push({ bytes: value, meaning: `${a}, one byte per character` });
  }

  const hex = hex2(sub) + hex2(value.length / 2) + value;
  if (hex.length / 2 > MAX_OPTION_BYTES) {
    throw new Option43Error(
      "value-too-long",
      `the value is ${hex.length / 2} bytes; a DHCP option carries at most ${MAX_OPTION_BYTES}`
    );
  }

  const colon = (hex.match(/../g) ?? []).join(":");
  const snippets: { server: string; lines: string[] }[] = [
    { server: "isc-dhcp", lines: [`option vendor-encapsulated-options ${colon};`] },
    { server: "cisco-ios", lines: [`option 43 hex ${hex}`] },
    { server: "windows", lines: [hex] },
    { server: "mikrotik", lines: [`add code=43 value=0x${hex}`] },
  ];
  if (vendor.vendorClass && !vendor.vendorClass.includes("<")) {
    snippets[1].lines.unshift(`option 60 ascii "${vendor.vendorClass}"`);
  }

  return {
    vendor,
    addresses,
    option: 43,
    encoding: "hex",
    hex,
    breakdown,
    serverSnippets: snippets,
    notes: [
      ...notes,
      ...(vendor.addressForm === "ascii" ? ["ascii-not-binary"] : []),
      ...(addresses.length > 1 ? ["multiple-controllers"] : []),
    ],
  };
}
