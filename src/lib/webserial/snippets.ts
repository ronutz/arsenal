// ============================================================================
// src/lib/webserial/snippets.ts
// ----------------------------------------------------------------------------
// A small set of common, read-only diagnostic commands per network OS, offered
// in the console's send row when a highlight OS is selected. Picking one drops
// it into the input (ready to edit or send) - it never sends on its own.
// ============================================================================

import type { OsKey } from "./highlight";

export const SNIPPETS: Partial<Record<OsKey, string[]>> = {
  ios: [
    "show running-config",
    "show ip interface brief",
    "show version",
    "show ip route",
    "show interfaces status",
    "show cdp neighbors detail",
  ],
  nxos: [
    "show running-config",
    "show ip interface brief",
    "show version",
    "show ip route",
    "show interface status",
    "show cdp neighbors",
  ],
  junos: [
    "show configuration",
    "show interfaces terse",
    "show version",
    "show route",
    "show chassis hardware",
    "show system alarms",
  ],
  eos: [
    "show running-config",
    "show ip interface brief",
    "show version",
    "show ip route",
    "show interfaces status",
    "show lldp neighbors",
  ],
  fortios: [
    "get system status",
    "show full-configuration",
    "get router info routing-table all",
    "get system interface",
    "diagnose sys top",
  ],
  tmos: [
    "show sys version",
    "list ltm virtual",
    "list ltm pool",
    "show net interface",
    "show sys performance throughput",
  ],
  exos: [
    "show configuration",
    "show ports information",
    "show vlan",
    "show version",
    "show iproute",
  ],
  voss: [
    "show spbm",
    "show isis",
    "show isis spbm i-sid all",
    "show i-sid",
    "show vlan i-sid",
    "show fa elements",
  ],
};

export function snippetsFor(os: OsKey): string[] {
  return SNIPPETS[os] ?? [];
}
