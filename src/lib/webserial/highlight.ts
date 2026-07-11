// ============================================================================
// src/lib/webserial/highlight.ts
// ----------------------------------------------------------------------------
// VENDOR-OS SYNTAX HIGHLIGHTING for the WebSerial console (Tier 3). Pure and
// deterministic: given an OS and a line of console text, return a list of tokens
// tagged with a highlight class. This is a pragmatic highlighter, not a parser -
// it tags comments, quoted strings, IP addresses, interface names, a curated
// keyword set per OS, and bare numbers. Everything else stays plain.
//
// The console memoizes per line, so a completed line is tokenized once. When the
// OS is "none" the console renders plain text and never calls this.
// ============================================================================

export type OsKey = "none" | "ios" | "nxos" | "junos" | "eos" | "fortios" | "tmos" | "exos" | "voss";
export const OS_KEYS: OsKey[] = ["none", "ios", "nxos", "junos", "eos", "fortios", "tmos", "exos", "voss"];

export interface HlToken {
  text: string;
  cls: string | null;
}

interface OsSpec {
  comment: string; // literal line-comment starter
  keywords: Set<string>;
  iface: RegExp | null; // sticky (y) interface-name matcher
}

// Shared sticky matchers (reset lastIndex before each use).
const STRING = /"[^"]*"/y;
const IPV6 = /(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}/y;
const IPV4 = /(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?/y;
const WORD = /[A-Za-z][A-Za-z0-9_-]*/y;
const NUMBER = /\d+/y;

function kw(list: string): Set<string> {
  return new Set(
    list
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.toLowerCase()),
  );
}

// Interface-name matchers per vendor family (sticky).
const CISCO_IFACE =
  /(?:(?:Ten|Twenty|Forty|Hundred)?Gigabit|Fast|Ten)?Ethernet[0-9/.:]+|(?:Gi|Te|Fa|Fo|Hu|Eth|Po|Vlan|Vl|Lo|Tu|Se|Mgmt|Nu)[0-9/.:]+/y;
const JUNOS_IFACE = /(?:ge|xe|et|fe|ae|lo|irb|em|fxp|me|reth|gr|ip|vlan)-?\d+(?:\/\d+){0,2}(?:\.\d+)?/y;
const FORTI_IFACE = /(?:port|wan|internal|dmz|mgmt|lan|ha)\d*/y;
const TMOS_IFACE = /\d+\.\d+/y;
// VOSS ports: 1/1, 1/19-1/20, 1/1,1/2 (slash form; IPs are matched earlier).
const VOSS_IFACE = /\d+\/\d+(?:[-,]\d+(?:\/\d+)?)*/y;

const SPECS: Record<Exclude<OsKey, "none">, OsSpec> = {
  ios: {
    comment: "!",
    iface: CISCO_IFACE,
    keywords: kw(
      "interface ip address no shutdown router ospf bgp eigrp rip network neighbor description switchport mode access trunk vlan spanning-tree hostname enable configure terminal permit deny access-list route-map redistribute area passive-interface encapsulation duplex speed standby service logging ntp snmp-server line login password username crypto show version boot vrf forwarding",
    ),
  },
  nxos: {
    comment: "!",
    iface: CISCO_IFACE,
    keywords: kw(
      "interface ip address no shutdown router ospf bgp eigrp network neighbor description switchport mode access trunk vlan hostname feature vpc vrf context vrrp hsrp evpn nve fabricpath spanning-tree configure permit deny route-map redistribute area logging ntp show version copy",
    ),
  },
  junos: {
    comment: "#",
    iface: JUNOS_IFACE,
    keywords: kw(
      "set delete edit show configure commit rollback interfaces unit family inet inet6 address routing-options protocols ospf bgp isis policy-options policy-statement firewall filter security zones apply-groups description vlan vlan-id ethernet-switching term then from route static",
    ),
  },
  eos: {
    comment: "!",
    iface: CISCO_IFACE,
    keywords: kw(
      "interface ip address no shutdown router ospf bgp network neighbor description switchport mode access trunk vlan hostname spanning-tree configure permit deny route-map redistribute area logging ntp vrf mlag management show version",
    ),
  },
  fortios: {
    comment: "#",
    iface: FORTI_IFACE,
    keywords: kw(
      "config edit set next end get show unset system interface firewall policy address addrgrp service vip route static router zone vdom user local schedule profile ips av webfilter",
    ),
  },
  tmos: {
    comment: "#",
    iface: TMOS_IFACE,
    keywords: kw(
      "ltm gtm dns net sys security create modify list show delete edit virtual pool node monitor profile rule snat snatpool self vlan route persistence tcp http clientssl serverssl irule data-group auth",
    ),
  },
  exos: {
    comment: "#",
    iface: null,
    keywords: kw(
      "configure create enable disable show delete unconfigure vlan ports ipaddress add port tagged untagged stp ospf bgp sharing lacp vr policy access-list snmp sntp save fdb",
    ),
  },
  voss: {
    comment: "!",
    iface: VOSS_IFACE,
    keywords: kw(
      "spbm isis router i-sid nick-name b-vid primary vlan create members add remove type spbm-bvlan port-mstprstp portmember interface gigabitethernet loopback mlt encapsulation dot1q enable disable configure terminal no shutdown save config show manual-area sys-name system-id is-type ip-source-address ip cfm multicast fa smlt vrf ethertype vlan-id igmp snooping vrrp",
    ),
  },
};

function tokenize(line: string, spec: OsSpec): HlToken[] {
  const out: HlToken[] = [];
  let plain = "";
  const flush = () => {
    if (plain) {
      out.push({ text: plain, cls: null });
      plain = "";
    }
  };

  // Split off a trailing comment (only when the comment char begins a token).
  let body = line;
  let comment: string | null = null;
  const ci = line.indexOf(spec.comment);
  if (ci >= 0 && (ci === 0 || /\s/.test(line[ci - 1]))) {
    body = line.slice(0, ci);
    comment = line.slice(ci);
  }

  const rules: Array<[RegExp, string]> = [
    [STRING, "hl-string"],
    [IPV6, "hl-ip"],
    [IPV4, "hl-ip"],
  ];
  if (spec.iface) rules.push([spec.iface, "hl-iface"]);

  let i = 0;
  while (i < body.length) {
    let matched = false;
    for (const [re, cls] of rules) {
      re.lastIndex = i;
      const m = re.exec(body);
      if (m && m.index === i && m[0]) {
        flush();
        out.push({ text: m[0], cls });
        i += m[0].length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    WORD.lastIndex = i;
    const w = WORD.exec(body);
    if (w && w.index === i && w[0]) {
      flush();
      out.push({ text: w[0], cls: spec.keywords.has(w[0].toLowerCase()) ? "hl-keyword" : null });
      i += w[0].length;
      continue;
    }

    NUMBER.lastIndex = i;
    const n = NUMBER.exec(body);
    if (n && n.index === i && n[0]) {
      flush();
      out.push({ text: n[0], cls: "hl-number" });
      i += n[0].length;
      continue;
    }

    plain += body[i];
    i++;
  }
  flush();
  if (comment !== null) out.push({ text: comment, cls: "hl-comment" });
  return out;
}

/** Tokenize a line for the given OS. Returns a single plain token for "none". */
export function highlight(line: string, os: OsKey): HlToken[] {
  if (os === "none") return [{ text: line, cls: null }];
  return tokenize(line, SPECS[os]);
}

// -- golden vectors ---------------------------------------------------------

interface HVec {
  id: string;
  os: OsKey;
  line: string;
  expect: Array<[string, string | null]>; // [text, cls]
}

const HVECTORS: HVec[] = [
  {
    id: "ios-ip-iface",
    os: "ios",
    line: "ip address 10.0.0.1 GigabitEthernet0/0",
    expect: [
      ["ip", "hl-keyword"],
      [" ", null],
      ["address", "hl-keyword"],
      [" ", null],
      ["10.0.0.1", "hl-ip"],
      [" ", null],
      ["GigabitEthernet0/0", "hl-iface"],
    ],
  },
  {
    id: "ios-comment",
    os: "ios",
    line: "hostname R1 ! edge router",
    expect: [
      ["hostname", "hl-keyword"],
      [" ", null],
      ["R1", null],
      [" ", null],
      ["! edge router", "hl-comment"],
    ],
  },
  {
    id: "junos-set",
    os: "junos",
    line: "set interfaces ge-0/0/0 unit 0",
    expect: [
      ["set", "hl-keyword"],
      [" ", null],
      ["interfaces", "hl-keyword"],
      [" ", null],
      ["ge-0/0/0", "hl-iface"],
      [" ", null],
      ["unit", "hl-keyword"],
      [" ", null],
      ["0", "hl-number"],
    ],
  },
  {
    id: "tmos-virtual",
    os: "tmos",
    line: "create ltm virtual vs1",
    expect: [
      ["create", "hl-keyword"],
      [" ", null],
      ["ltm", "hl-keyword"],
      [" ", null],
      ["virtual", "hl-keyword"],
      [" ", null],
      ["vs1", null],
    ],
  },
  {
    id: "voss-l2vsn",
    os: "voss",
    line: "vlan i-sid 78 780001",
    expect: [
      ["vlan", "hl-keyword"],
      [" ", null],
      ["i-sid", "hl-keyword"],
      [" ", null],
      ["78", "hl-number"],
      [" ", null],
      ["780001", "hl-number"],
    ],
  },
  {
    id: "voss-iface",
    os: "voss",
    line: "interface GigabitEthernet 1/1",
    expect: [
      ["interface", "hl-keyword"],
      [" ", null],
      ["GigabitEthernet", "hl-keyword"],
      [" ", null],
      ["1/1", "hl-iface"],
    ],
  },
  {
    id: "none-passthrough",
    os: "none",
    line: "anything at all 1.2.3.4",
    expect: [["anything at all 1.2.3.4", null]],
  },
];

export function verifyHighlight(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  for (const v of HVECTORS) {
    const got = highlight(v.line, v.os).map((t) => [t.text, t.cls]);
    const want = v.expect;
    if (JSON.stringify(got) === JSON.stringify(want)) passed++;
    else failures.push(`[${v.id}] got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
  }
  return { passed, failed: failures.length, failures };
}

export const highlightVectors = HVECTORS.map((v) => v.id);
