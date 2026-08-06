// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - Illumio's own engineering blog: the VEN hands enforcement to the
//     operating system ("enforcement-for-hire") via iptables on Linux and the
//     Windows Filtering Platform on Windows; if the VEN stops, the OS keeps
//     enforcing the last policy; iptables shipped 1998 and WFP began around
//     2007
//   - SecureNation and SMS technical write-ups: the PCE computes policy and the
//     VEN programs native host firewalls, plus ACLs on F5 and Arista, container
//     hosts and cloud security groups; four-dimensional labels (Role,
//     Application, Environment, Location) rather than VLANs, subnets or IPs;
//     the four enforcement modes - Idle, Visibility Only, Selective, Full
//   - ColorTokens' 2026 competitive comparison: Illumio configures existing OS
//     firewalls where Akamai-Guardicore installs a proprietary one, and NIST
//     SP 800-207 discourages overly proprietary components
//   - Illumio news, 26 Feb 2026: agentless visibility ingesting Check Point and
//     Fortinet firewall telemetry; Leader in the Forrester Wave for
//     Microsegmentation; Customers' Choice in 2026 Gartner Peer Insights
//
// THE BODY ALREADY ARGUES the founding thesis, enforcement-at-the-workload
// versus network topology, dependency mapping as the real first problem, the
// stealth period and funding, and the three-company tie to Zscaler and
// Netskope. This profile adds HOW the enforcement actually works, which is the
// most interesting thing about the product and is not on the page at all.
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const illumioProfile: VendorProfile = {
  slug: "illumio",
  foundings: [
    {
      company: "Illumio",
      year: 2013,
      place: "Sunnyvale, California",
      founders: ["Andrew Rubin", "PJ Kirner"],
      story:
        "Founded on 23 January by a commercial founder and a distinguished engineer from Juniper's security office, a month after both left Cymtec. The name comes from illuminate, which describes the first problem rather than the product: before anything can be contained, somebody has to know what talks to what.",
    },
  ],
  timeline: [
    { year: 2013, title: "Founded, and immediately quiet", detail: "January, then nearly two years of building before anything was shown - because the first problem was mapping, and a map of nothing demonstrates nothing." },
    { year: 2014, title: "Out of stealth", detail: "October, with enterprise references already in place - unusual for a company nobody had heard of a year earlier." },
    {
      year: 2026,
      title: "Agentless, using somebody else's telemetry",
      detail:
        "In February the company shipped visibility built from Check Point and Fortinet firewall telemetry rather than from its own agent - reading the traffic map out of infrastructure the customer already has. For a company whose entire architecture was agent-based, that is a notable admission that the agent is a means rather than the point.",
    },
  ],
  products: [
    { name: "The PCE and the VEN", what: "A Policy Compute Engine that calculates what every workload should be allowed to do, and a Virtual Enforcement Node on each host that receives the result. The split matters: the thinking is central, the enforcement is local." },
    { name: "Illumination", what: "The live dependency map - the visual answer to what actually talks to what, which is the artefact customers usually buy before they enforce anything." },
    { name: "Illumio Core", what: "Segmentation for servers and data centre workloads, the original product and still the centre of the business." },
    { name: "CloudSecure and Endpoint", what: "The same policy model extended to cloud-native workloads and to laptops, where the containment question is what a compromised endpoint can reach rather than what reaches it." },
    { name: "Illumio Insights", what: "Observability and detection over the traffic graph, and from 2026 able to build that graph from third-party firewall telemetry with no agent deployed at all." },
  ],
  innovations: [
    {
      title: "Enforcement handed to the operating system",
      detail:
        "The agent does not sit in the traffic path. It programs the firewall the operating system already has - iptables on Linux, the Windows Filtering Platform on Windows - and then gets out of the way. The company calls it enforcement-for-hire, and the code doing the work has been in production since 1998 on one side and around 2007 on the other.",
    },
    {
      title: "What happens when the agent dies",
      detail:
        "This is the consequence worth understanding, because every security agent has to answer it. An inline agent that fails either opens the host or blocks it, and both are outages. Here the operating system keeps enforcing the last policy it was given, so a dead agent means policy stops updating rather than stops applying. Competitors that install their own firewall accept a heavier failure mode and an operating system upgrade problem in exchange for more control.",
    },
    {
      title: "Labels instead of addresses",
      detail:
        "Policy is written against four dimensions - role, application, environment, location - and never against a VLAN, subnet or IP. A workload that moves, or is rebuilt at a new address, keeps its rules because the rules were never about where it was. This is the whole argument against topology-based segmentation, expressed as a data model.",
    },
    {
      title: "Four enforcement modes, deployed in order",
      detail:
        "Idle, then visibility-only, then selective, then full. That progression exists because the honest failure mode of segmentation is not being bypassed - it is breaking a production application nobody documented. Being able to run in production seeing exactly what would have been blocked, before blocking anything, is what makes the project survivable.",
    },
  ],
  markets: [
    "Large enterprises with data centres old enough that nobody has a current map of them: financial services, healthcare, government, and the operators of estates where an application's dependencies are folklore rather than documentation.",
    "It competes with the other microsegmentation specialists, with the platform vendors adding segmentation to broader suites, and with the argument that cloud-native security groups are already good enough - which is true for estates built after 2015 and not for the ones that were not.",
  ],
  analyst: [
    "A Leader in Forrester's microsegmentation assessment and a Customers' Choice in Gartner's 2026 peer review for network security microsegmentation, which is a different signal: it reflects the people who deployed it rather than the analysts who evaluated it.",
    "The category's own difficulty is worth stating. Microsegmentation has been three years from mainstream for about a decade, because the technology has rarely been the obstacle - mapping an undocumented estate and getting permission to enforce anything in it are organisational problems, and no product solves those. The agentless direction of 2026 reads as an answer to the first half of that.",
  ],
};
