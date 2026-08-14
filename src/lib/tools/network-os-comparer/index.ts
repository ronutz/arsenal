// ============================================================================
// The {manifest, run, vectors} triple for the network operating system
// comparer. Architecture and lineage, offline. Not a feature matrix.
// ============================================================================

export { compare, findOs, run, NETWORK_OSES, NetworkOsError } from "./compute";
export type { NetworkOs, ComparisonResult, Difference } from "./compute";
export { verifyVectors, OS_VECTORS, GOLDEN_VECTOR_SET_ID } from "./golden-vectors";
export type { OsVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "network-os-comparer",
  learnLinks: [
    "learn/network-operating-systems",
    "learn/fortios-cli-grammar",
    "learn/f5os-tenant-lifecycle",
  ],
  sources: Object.freeze([
    Object.freeze({ id: "cisco-xr", label: "Cisco - IOS XR software architecture: protected processes, distributed operation and the two-stage commit", url: "https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xr-software/index.html" }),
    Object.freeze({ id: "juniper-evo", label: "Juniper - Junos OS Evolved architecture and the distributed data store", url: "https://www.juniper.net/documentation/us/en/software/junos/junos-evolved-overview/topics/concept/evo-overview.html" }),
    Object.freeze({ id: "arista-eos", label: "Arista - EOS architecture: an unmodified Linux kernel and SysDB state sharing", url: "https://www.arista.com/en/products/eos" }),
    Object.freeze({ id: "f5-tmos", label: "F5 - TMOS architecture and the Traffic Management Microkernel", url: "https://my.f5.com/manage/s/article/K12885" }),
    Object.freeze({ id: "extreme-osnames", label: "Extreme Networks - Switch Engine and Fabric Engine naming on Universal hardware", url: "https://extreme-networks.my.site.com/ExtrArticleDetail?an=000102405" }),
  ]),
});
