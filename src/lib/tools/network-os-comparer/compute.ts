// ============================================================================
// src/lib/tools/network-os-comparer/compute.ts
// ----------------------------------------------------------------------------
// NETWORK OPERATING SYSTEM COMPARER - the pure engine and its dataset.
//
// WHAT THIS IS FOR. Every vendor's network operating system answers the same
// small set of questions, and they answer them differently. Laid side by side
// the differences stop being trivia and start being the reason one platform
// behaves as it does under failure and another does not.
//
// *** THE QUESTION THAT ORGANISES ALL OF THEM ***
//
//   What happens when one part of the software fails?
//
// Every architectural choice below is an answer to that. A monolith takes the
// box down with it. A microkernel restarts a process. A state database lets the
// restarted process pick up where it left off. A hardware data plane keeps
// forwarding while the control plane is rebuilt. That is the whole story, told
// eight different ways.
//
// THE AXES, and why each one earns its place:
//
//   base          - what the software actually runs on. Proprietary monolith,
//                   BSD, Linux, microkernel. Determines what tooling exists.
//   stateModel    - how components share what they know. THIS is the axis that
//                   predicts restart behaviour better than any other.
//   planes        - whether control and forwarding are separable, and where the
//                   packets are actually handled.
//   configModel   - immediate versus candidate-and-commit. Decides whether a
//                   mistake is an incident or an abandoned edit.
//   upgrade       - what an upgrade costs in downtime.
//
// HONESTY NOTE. Weaknesses are recorded for every entry including the ones this
// site's author teaches. An entry with no weakness listed would be marketing,
// and the reader would be right to distrust the rest.
//
// SCOPE. Architecture and lineage, sourced from vendor documentation and
// primary references. Not a feature matrix, not a buying guide, and not
// current-version tracking - versions move and architecture does not.
// ============================================================================

export interface NetworkOs {
  id: string;
  name: string;
  vendor: string;
  /** First shipped, where a date is documented. */
  since?: string;
  /** What it descends from. Order is chronological. */
  lineage: string[];
  /** The operating system underneath. */
  base: string;
  /** How components share state - the axis that predicts failure behaviour. */
  stateModel: string;
  /** Control plane and data plane arrangement. */
  planes: string;
  /** Immediate or candidate-and-commit. */
  configModel: string;
  /** What an upgrade costs. */
  upgrade: string;
  /** The one thing that distinguishes it. */
  differentiator: string;
  strengths: string[];
  weaknesses: string[];
}

export const NETWORK_OSES: readonly NetworkOs[] = Object.freeze([
  {
    id: "ios",
    name: "Cisco IOS (classic)",
    vendor: "Cisco",
    since: "1980s",
    lineage: ["IOS classic"],
    base: "No host operating system. IOS is the operating system, running directly on the hardware as a single binary image.",
    stateModel:
      "Shared globals. Every process runs in ONE address space with no memory protection, so any process can corrupt any other's data. The scheduler is run-to-completion and non-preemptive: a running process keeps the CPU until it makes a kernel call.",
    planes:
      "Routing and forwarding are distinct functions in software. Protocols build the RIB, which is processed into the FIB that forwarding consults.",
    configModel: "Immediate. A command takes effect as it is entered; there is no candidate configuration to review.",
    upgrade: "Replace the whole image and reboot. There is no partial upgrade without redundant supervisors.",
    differentiator:
      "The one everybody learned first, and the reason every other vendor's CLI looks vaguely like it. Its architecture is the baseline the others were designed to escape.",
    strengths: [
      "Small, fast and predictable on the hardware it was written for.",
      "The most widely known command set in the industry, which is a genuine operational asset.",
      "Decades of documented behaviour, so almost any symptom has been seen before by somebody.",
    ],
    weaknesses: [
      "No memory protection: a defect in one feature can corrupt another's data and bring the box down.",
      "A non-preemptive scheduler means a badly behaved process can starve everything else, including routing protocols.",
      "Upgrades are all-or-nothing and require a reboot.",
    ],
  },
  {
    id: "ios-xe",
    name: "Cisco IOS XE",
    vendor: "Cisco",
    since: "2008, with the ASR 1000",
    lineage: ["IOS classic", "IOS XE"],
    base: "A Linux kernel, with IOS itself running on top as a single daemon - IOSd.",
    stateModel:
      "IOSd remains a monolith internally, but system functions were lifted out of it into separate Linux processes. A failure in one of those does not take the kernel with it; a failure inside IOSd still takes IOSd.",
    planes: "Control plane in IOSd and platform processes; forwarding in hardware, with the platform layer between them.",
    configModel: "Immediate, preserving the classic IOS operational model deliberately.",
    upgrade: "Sub-packages can be upgraded individually, and later releases add containerised services alongside.",
    differentiator:
      "The familiar CLI kept, the architecture underneath replaced. It is the compatibility answer: existing knowledge and existing scripts continue to work while the failure domain shrinks.",
    strengths: [
      "Existing IOS knowledge transfers almost entirely.",
      "Process isolation for platform functions, and multi-core scheduling.",
      "Containers and on-box applications become possible because there is a real Linux underneath.",
    ],
    weaknesses: [
      "IOSd is still a monolith, so the biggest single failure domain was reduced rather than removed.",
      "Two layers to reason about when something goes wrong - the Linux side and the IOSd side.",
    ],
  },
  {
    id: "ios-xr",
    name: "Cisco IOS XR",
    vendor: "Cisco",
    since: "2004, with the CRS-1",
    lineage: ["Written fresh for carrier platforms", "QNX microkernel", "64-bit Linux from the 6.x era"],
    base: "Originally the QNX real-time microkernel; later releases moved to a 64-bit Linux foundation.",
    stateModel:
      "Fully distributed. Components run as independent protected processes that can be restarted individually, and they communicate by message passing rather than by sharing memory.",
    planes: "Strict separation, and designed for distributed forwarding across many linecards from the outset.",
    configModel:
      "Candidate and commit. Changes are made against a copy, checked, then committed - so a half-finished edit is an abandoned candidate rather than a live outage.",
    upgrade: "Individual packages, and process restart without a reboot for many changes.",
    differentiator:
      "A different code base from IOS, not a rework of it. The CLI resembles IOS and the operational model does not: the two-stage commit changes what a mistake costs.",
    strengths: [
      "Process-level restartability, so a protocol defect is a restarted process rather than a lost router.",
      "Commit model catches errors before they are live, and supports rollback.",
      "Built for scale: many linecards, many routes, many protocol instances.",
    ],
    weaknesses: [
      "The learning curve is real - the CLI's familiarity is partly a trap, because the operational model beneath it is not IOS.",
      "Complexity is the price of the distribution: more moving parts, more to understand when diagnosing.",
    ],
  },
  {
    id: "junos",
    name: "Junos OS",
    vendor: "Juniper",
    since: "7 July 1998",
    lineage: ["FreeBSD 4, 32-bit", "FreeBSD 10, 64-bit from Release 15.1", "ScreenOS security folded in after the NetScreen acquisition", "Junos OS Evolved on Linux"],
    base: "FreeBSD. Because that is a Unix, there is a real Unix shell underneath with the ordinary Unix tools available.",
    stateModel:
      "Routing Engine centric: the RE holds the control plane and the Packet Forwarding Engine does the forwarding, with a defined boundary between them. Daemons are separate processes.",
    planes:
      "The RE/PFE split is the design's organising idea, and it is why the control plane can be rebuilt or fail over while forwarding continues.",
    configModel:
      "Candidate and commit, with rollback and configuration comparison built in. This was Junos's signature from the beginning and much of the industry has since followed.",
    upgrade: "Unified releases across the portfolio; in-service upgrade on supported platforms.",
    differentiator:
      "One operating system, one source tree, across routing, switching and security. The consistency is the product as much as any individual feature.",
    strengths: [
      "The commit model, with rollback and a readable diff before anything is applied.",
      "A single consistent operating system across very different hardware.",
      "A genuine Unix underneath, so ordinary tools and scripting are available.",
    ],
    weaknesses: [
      "The configuration hierarchy is unfamiliar to engineers arriving from an IOS-shaped world, and the transition takes real effort.",
      "Two architectures now coexist - FreeBSD-based Junos and Linux-based Junos Evolved - and knowing which one is in front of you matters.",
    ],
  },
  {
    id: "junos-evolved",
    name: "Junos OS Evolved",
    vendor: "Juniper",
    since: "Release 19.2, 2019",
    lineage: ["Junos OS", "Junos OS Evolved"],
    base: "A Linux kernel natively, with direct access to Linux utilities rather than through an emulation layer.",
    stateModel:
      "A distributed data store. Processes publish state to it rather than to each other, and a restarted process retrieves its state from the store - even when it comes back on a different node. State is eventually consistent at the transport layer, causally consistent at the application layer.",
    planes:
      "Node-based rather than Routing Engine centric. The system means all nodes - routing engines, forwarding complexes and the rest - not just the control processor.",
    configModel: "Candidate and commit, as Junos.",
    upgrade: "Each software version is stored separately, so installing one does not disturb another.",
    differentiator:
      "The state store is the point. In classic Junos a restarted daemon rebuilds; here it retrieves, which is a different guarantee entirely.",
    strengths: [
      "State survives process restart, and survives the process moving to another node.",
      "Native Linux, so containers and modern telemetry are first-class rather than bolted on.",
      "The node-based model matches how large systems are actually built.",
    ],
    weaknesses: [
      "A second platform to know alongside classic Junos, with real behavioural differences.",
      "Eventual consistency is a correct engineering choice and it means the answer to what is the state right now is more nuanced than on a system with one copy of it.",
    ],
  },
  {
    id: "nx-os",
    name: "Cisco NX-OS",
    vendor: "Cisco",
    lineage: ["SAN-OS, written for MDS storage switches", "NX-OS for Nexus"],
    base: "Linux, with networking features as modular processes above it.",
    stateModel: "Modular processes with individual restart, and features started only when configured.",
    planes: "Control plane in software, forwarding in ASICs, with the data centre fabric as the design target.",
    configModel: "Immediate, in the IOS tradition, though the feature-enable model changes what is running.",
    upgrade: "In-service upgrade on supported platforms; individual process restart.",
    differentiator:
      "It came from storage. The SAN heritage shows in its attitude to modularity and to features that are absent until asked for, which is unusual in a switch operating system.",
    strengths: [
      "Features not enabled are not running, which reduces both attack surface and memory use.",
      "Process modularity with restart.",
      "Strong programmability and on-box scripting.",
    ],
    weaknesses: [
      "The feature-enable model surprises engineers who expect a command to exist before it has been switched on.",
      "Similar-looking CLI to IOS with different behaviour in places, which is its own kind of trap.",
    ],
  },
  {
    id: "eos",
    name: "Arista EOS",
    vendor: "Arista",
    lineage: ["Written fresh on Linux"],
    base: "An UNMODIFIED Linux kernel. Not a fork, not a patched tree - the same kernel, so the tooling is the ordinary Linux tooling.",
    stateModel:
      "SysDB: a central in-memory state database with publish and subscribe. Processes do not talk to each other at all - they publish state and subscribe to what they care about. A restarted agent gets the current state from SysDB and continues.",
    planes: "Control plane processes above Linux, forwarding in merchant silicon.",
    configModel: "Immediate, with configuration sessions available for staged changes.",
    upgrade: "Individual agent restart; in-service upgrade on supported hardware.",
    differentiator:
      "State is separated from the processes that produce it. That single decision is why an agent can be restarted, upgraded or replaced without the rest of the system noticing.",
    strengths: [
      "Process restart is genuinely routine rather than an emergency measure.",
      "An unmodified kernel means standard Linux tools work as documented.",
      "One software train across the portfolio.",
    ],
    weaknesses: [
      "The publish-subscribe model is a different mental model to learn, and reasoning about who published what takes practice.",
      "Merchant silicon means hardware capability is bounded by what the chosen chipset does.",
    ],
  },
  {
    id: "tmos",
    name: "F5 TMOS",
    vendor: "F5",
    lineage: ["BIG-IP", "TMOS"],
    base:
      "Linux for management and control, with the Traffic Management Microkernel - TMM - as a separate real-time process handling traffic.",
    stateModel:
      "Two worlds. Linux runs management, and TMM runs the data path with its own memory, its own scheduling and its own network stack.",
    planes:
      "The important detail: TMM BYPASSES the Linux network stack entirely. Traffic does not traverse Linux networking on its way through the device, which is why Linux tools show you the management plane and not the traffic.",
    configModel: "Immediate through tmsh, with declarative layers such as AS3 available above it.",
    upgrade: "Software volumes, allowing a new version to be installed beside the running one and booted into.",
    differentiator:
      "A full proxy, not a router. TMOS terminates connections and creates new ones, which is a different relationship with traffic from anything that forwards it.",
    strengths: [
      "The full-proxy model allows inspection and manipulation that a forwarding device cannot do.",
      "TMM's dedicated stack gives predictable performance independent of the Linux side.",
      "iRules make behaviour programmable at the point of traffic handling.",
    ],
    weaknesses: [
      "Two worlds to understand, and Linux tooling answers questions about the wrong one - a persistent source of confusion.",
      "The device is in the connection path by design, so it is a failure domain rather than a bystander.",
    ],
  },
  {
    id: "f5os",
    name: "F5OS",
    vendor: "F5",
    lineage: ["TMOS as tenant", "F5OS-C for VELOS chassis", "F5OS-A for rSeries appliances"],
    base: "A Linux platform layer with container orchestration, hosting BIG-IP tenants rather than serving traffic itself.",
    stateModel: "Platform and tenant are separate. The platform allocates; the tenant runs its own TMOS.",
    planes: "The platform owns the hardware and presents VLANs and resources to tenants; each tenant has its own data plane.",
    configModel: "Immediate, over a CLI and RESTCONF interface driven by YANG models.",
    upgrade: "Platform and tenants upgrade independently, which is the point of separating them.",
    differentiator:
      "F5OS is not a traffic operating system at all. It is the layer that decides which BIG-IPs exist, and confusing it with the BIG-IP inside is the commonest mistake people make with VELOS and rSeries.",
    strengths: [
      "Tenants are genuinely separated, with their own resources and their own lifecycle.",
      "Model-driven interfaces throughout, so automation is a first-class path.",
      "Platform and tenant versions are decoupled.",
    ],
    weaknesses: [
      "Another layer to learn, with its own CLI, its own API and its own failure modes.",
      "Changing a tenant's resource allocation is not a live operation, which surprises people expecting virtualisation to behave like a hypervisor.",
    ],
  },
  {
    id: "exos",
    name: "ExtremeXOS / Switch Engine",
    vendor: "Extreme Networks",
    lineage: ["ExtremeXOS", "renamed Switch Engine on Universal hardware from 31.6"],
    base: "Linux, with networking functions as modular userspace processes.",
    stateModel: "Independent modules with process-level restart, so a failed protocol does not take the switch.",
    planes: "Control plane in software, forwarding in ASICs.",
    configModel: "Immediate, with scripting and on-box Python available.",
    upgrade: "Process restart for many changes; image upgrade with the usual reboot for the rest.",
    differentiator:
      "Modularity from early on, and an unusual willingness to let the switch run scripts of its own.",
    strengths: [
      "Process restart without taking the switch down.",
      "On-box scripting and automation that predates the fashion for it.",
      "Consistent across a broad hardware range.",
    ],
    weaknesses: [
      "Smaller community than the market leaders, so third-party material is thinner.",
      "The Switch Engine renaming means documentation exists under two names, which complicates searching.",
    ],
  },
  {
    id: "voss",
    name: "VOSS / Fabric Engine",
    vendor: "Extreme Networks",
    lineage: ["Nortel Passport", "Avaya VSP", "Extreme VOSS", "renamed Fabric Engine on Universal hardware from 8.6"],
    base: "Linux, with an ACLI command grammar inherited from the Avaya and Nortel line.",
    stateModel: "Modular processes; the fabric control plane is IS-IS carrying Ethernet reachability.",
    planes:
      "Its distinguishing feature is above the plane split: Shortest Path Bridging means forwarding is computed by IS-IS rather than learned, with no spanning tree and no blocked links.",
    configModel:
      "Immediate, in the ACLI style inherited from the Avaya and Nortel line - which is a genuinely different grammar from EXOS on the same Universal hardware, so a two-persona estate means two command sets to know.",
    upgrade: "Image upgrade; the fabric itself tolerates node loss by design.",
    differentiator:
      "The fabric. Services are provisioned only at the edge and the core is untouched, because the core forwards on backbone MACs and does not know the services exist.",
    strengths: [
      "Adding a service touches only the edge switches it appears on.",
      "No spanning tree, and every link carries traffic.",
      "A mature lineage - this technology has been in production for a long time under three different owners.",
    ],
    weaknesses: [
      "The vocabulary is a barrier: I-SID, B-VLAN, BEB, BCB and L2VSN all arrive at once.",
      "An ACLI grammar distinct from EXOS on the same hardware, so a two-OS estate means two command sets.",
    ],
  },
  {
    id: "fortios",
    name: "FortiOS",
    vendor: "Fortinet",
    lineage: ["FortiOS"],
    base: "A proprietary operating system with a Linux-derived foundation, built around Fortinet's own silicon.",
    stateModel: "Integrated rather than distributed - the security functions share a session table and a policy engine.",
    planes:
      "The silicon is the story: network processors, content processors and system-on-chip units offload flows from the CPU. Traffic offloaded to hardware does not traverse the software path at all, which is why a correct debug can show nothing while traffic flows.",
    configModel: "Immediate, with the config/edit/set/next/end grammar. `end` commits.",
    upgrade: "Image upgrade with reboot; HA pairs upgrade in sequence.",
    differentiator:
      "Custom silicon in the mainstream price range. The offload engine is what allows inspection at throughputs that general-purpose CPUs would not reach at that cost.",
    strengths: [
      "Very strong price to throughput ratio, because the work is done in hardware.",
      "One console for a wide portfolio, from firewalls to switches to access points.",
      "Extremely wide deployment, so the material and the community are deep.",
    ],
    weaknesses: [
      "Offload makes diagnosis harder: the packet you are looking for may never reach the code you are watching.",
      "Feature behaviour can differ between models depending on which silicon is present.",
    ],
  },
  {
    id: "pan-os",
    name: "PAN-OS",
    vendor: "Palo Alto Networks",
    lineage: ["PAN-OS"],
    base: "A Linux-derived operating system with a hard split between control and data plane, frequently on separate processors.",
    stateModel:
      "The planes are genuinely separate, with their own resources. Management load does not compete with traffic handling, which is the point of the arrangement.",
    planes:
      "Single-pass parallel processing: a packet is classified once, and application identification, user identification, content inspection and policy all run against that single pass rather than in a chain of engines each redoing the work.",
    configModel:
      "Candidate and commit. Changes accumulate and are committed as a set, and the commit is a visible operation with its own duration.",
    upgrade: "Image upgrade with reboot; HA pairs upgrade in sequence.",
    differentiator:
      "Application identity as the primary policy object rather than port numbers. The whole design follows from deciding that the question is which application, not which port.",
    strengths: [
      "Policy expressed in terms of applications and users reads closer to intent than port-based rules.",
      "Single-pass avoids the latency of chaining separate inspection engines.",
      "The commit model makes review possible before anything is live.",
    ],
    weaknesses: [
      "Commits take time, and on a large configuration that time is operationally significant.",
      "Application identification requires enough of the flow to classify it, which has implications for very short connections.",
    ],
  },
  {
    id: "gaia",
    name: "Check Point Gaia",
    vendor: "Check Point",
    lineage: ["IPSO, from the Nokia appliance line", "SecurePlatform", "Gaia, unifying both"],
    base: "Linux, unifying two earlier operating systems that Check Point maintained in parallel.",
    stateModel: "Software blades on a shared platform, with state synchronised between cluster members.",
    planes:
      "Acceleration paths sit beside the full inspection path, so an established connection can be handled faster than the first packet was.",
    configModel: "Immediate on the gateway, with policy installed from a separate management server.",
    upgrade: "Image upgrade; cluster members upgrade in sequence.",
    differentiator:
      "Management is a separate product from the gateway. Policy is written centrally and installed, which is a three-tier arrangement rather than a device you configure.",
    strengths: [
      "Central management across many gateways is the design rather than an add-on.",
      "A unified operating system, which was a genuine consolidation of two divergent lines.",
      "Long history in stateful inspection - Check Point largely invented the category.",
    ],
    weaknesses: [
      "The three-tier model means more infrastructure to run before the first rule exists.",
      "Two lineages merged means some inherited inconsistencies persist in places.",
    ],
  },
]);

export interface Difference {
  axis: string;
  a: string;
  b: string;
  /** Why this axis matters, stated once. */
  whyItMatters: string;
}

export interface ComparisonResult {
  left: NetworkOs;
  right: NetworkOs;
  differences: Difference[];
  shared: string[];
}

export class NetworkOsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkOsError";
  }
}

const AXES: { key: keyof NetworkOs; label: string; why: string }[] = [
  { key: "base", label: "What it runs on", why: "Determines what tooling exists, what can be installed beside it, and how much of the platform an engineer can inspect directly." },
  { key: "stateModel", label: "How state is shared", why: "The best single predictor of what happens when a component fails. Shared memory means a fault spreads; a state store means a restarted process can resume." },
  { key: "planes", label: "Control and forwarding", why: "Decides whether traffic keeps moving while the control plane is rebuilt, and whether the tools you reach for are looking at the path the packets take." },
  { key: "configModel", label: "How changes are applied", why: "Immediate means a mistake is live. Candidate-and-commit means a mistake is an abandoned edit - the difference between an incident and an afternoon." },
  { key: "upgrade", label: "What an upgrade costs", why: "The gap between a maintenance window and a process restart is the gap between planning a change and simply making it." },
  { key: "differentiator", label: "The distinguishing idea", why: "Every one of these was designed to solve something. Naming it explains the rest of the design." },
];

/** Look one up by id or by a loose name match. */
export function findOs(query: string): NetworkOs | undefined {
  const q = (query ?? "").trim().toLowerCase();
  if (!q) return undefined;
  return (
    NETWORK_OSES.find((o) => o.id === q) ??
    NETWORK_OSES.find((o) => o.name.toLowerCase() === q) ??
    NETWORK_OSES.find((o) => o.name.toLowerCase().includes(q) || o.id.includes(q))
  );
}

/** Compare two network operating systems along the documented axes. */
export function compare(leftId: string, rightId: string): ComparisonResult {
  const left = findOs(leftId);
  const right = findOs(rightId);
  if (!left) throw new NetworkOsError(`No network operating system matching "${leftId}".`);
  if (!right) throw new NetworkOsError(`No network operating system matching "${rightId}".`);
  if (left.id === right.id) throw new NetworkOsError("Pick two different systems - comparing one with itself says nothing.");

  const differences: Difference[] = AXES.map((a) => ({
    axis: a.label,
    a: String(left[a.key]),
    b: String(right[a.key]),
    whyItMatters: a.why,
  }));

  const shared: string[] = [];
  if (/linux/i.test(left.base) && /linux/i.test(right.base)) {
    shared.push("Both run on Linux, which means the difference between them is what they built ON it rather than what they built on.");
  }
  if (/candidate and commit/i.test(left.configModel) && /candidate and commit/i.test(right.configModel)) {
    shared.push("Both use a candidate-and-commit configuration model, so a half-finished change is an abandoned edit on either.");
  }
  if (left.vendor === right.vendor) {
    shared.push(`Both are ${left.vendor} systems, which usually means shared tooling and a shared support path even where the architectures differ.`);
  }
  return { left, right, differences, shared };
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: { left: string; right: string }): ComparisonResult {
  return compare(input.left, input.right);
}
