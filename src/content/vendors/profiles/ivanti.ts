// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-04 against:
//   - Cybersecurity Dive and Dark Reading (April 2024): exploitation beginning
//     December 2023 via CVE-2023-46805 and CVE-2024-21887; a Five Eyes advisory
//     in late February 2024; CEO Jeff Abbott's open letter and video pledging
//     an overhaul; ten flaws disclosed in the remote access line by that point
//   - Ivanti (May 2024): among the first signatories to CISA's Secure by Design
//     pledge, announced 7 May 2024 at RSA - MFA, no default passwords, expanded
//     disclosure, faster patching, progress tracked publicly
//   - Ivanti (October 2025): Connect Secure 25.X rebuilt on an enterprise Linux
//     base with SELinux enforcement and platform hardening
//   - Trade advisories through 2025-26: further critical vulnerabilities
//     including CVE-2025-0282 (unauthenticated RCE) and 2026 Neurons issues
//
// THE BODY ALREADY ARGUES the assembly from acquisitions and that the
// vulnerability history is structural rather than careless. This profile adds
// the lineage as a product map, the dated crisis, and the specific response -
// INCLUDING that the disclosures did not stop.
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const ivantiProfile: VendorProfile = {
  slug: "ivanti",
  foundings: [
    {
      company: "LANSystems, later LANDESK",
      year: 1985,
      place: "United States",
      founders: [],
      story:
        "Acquired by Intel in 1991 and run as its LANDESK division, then spun out. The desktop management lineage that became the endpoint half of the portfolio.",
    },
    {
      company: "Ivanti",
      year: 2017,
      place: "South Jordan, Utah",
      founders: ["Clearlake Capital"],
      story:
        "Created on 23 January when Clearlake Capital bought LANDESK from Thoma Bravo and merged it with HEAT Software - itself assembled two years earlier from FrontRange Solutions and Lumension Security. The company was a holding structure before it was a product line.",
    },
  ],
  timeline: [
    { year: 2017, title: "Formed", detail: "LANDESK and HEAT combined in January." },
    { year: 2020, title: "MobileIron and Pulse Secure", detail: "Both completed 1 December, adding mobile device management and the SSL VPN line." },
    { year: 2021, title: "Cherwell and RiskSense", detail: "Service management and vulnerability prioritisation, bought within months of each other." },
    {
      year: 2023,
      title: "December: the exploitation begins",
      detail:
        "An authentication bypass and a command injection in Connect Secure and Policy Secure, chained by an actor later assessed as nation-state, and exploited widely before disclosure.",
    },
    {
      year: 2024,
      title: "The advisory, the letter, and the pledge",
      detail:
        "A Five Eyes advisory in late February warned of continued exploitation. In April the chief executive published an open letter promising to rebuild engineering, security and vulnerability management. In May the company was among the first signatories to the United States cyber agency's Secure by Design pledge - the vendor having its worst year signing first, which reads as either cynical or exactly right depending on what follows.",
    },
    {
      year: 2025,
      title: "The architectural answer",
      detail:
        "Connect Secure 25.X shipped rebuilt on an enterprise Linux base with mandatory access control enforced and the platform hardened - a replacement of the foundation rather than a patch on top of it. Critical vulnerabilities continued to be disclosed through the same period, including an unauthenticated remote code execution flaw early in the year.",
      sourceNote: "The continuing disclosures are recorded deliberately: a rebuild of this kind takes years, and reporting the pledge without the subsequent CVEs would misrepresent where the company is.",
    },
  ],
  products: [
    { name: "Endpoint Manager", what: "The LANDESK line: software distribution, patching and inventory for desktops - the oldest code in the company and still among the most widely deployed." },
    { name: "Neurons", what: "The platform brand covering patch management, discovery, service management and automation, and the attempt to make one thing out of many acquired ones." },
    { name: "Connect Secure and Policy Secure", what: "The SSL VPN and network access control appliances, arriving via Pulse Secure from Juniper by way of NetScreen. The products at the centre of the 2024 exploitation." },
    { name: "Ivanti Neurons for MDM", what: "The MobileIron line, managing mobile fleets - the other half of the December 2020 double acquisition." },
    { name: "Service Manager and the Cherwell line", what: "IT service management from two separate acquisitions, which is its own consolidation problem." },
    { name: "Security Controls and Patch SDK", what: "Patching components that several other products depend on - which is why a single flaw in the SDK appears in advisories for half the portfolio at once." },
  ],
  innovations: [
    {
      title: "Consolidation as the entire strategy",
      detail:
        "The proposition is that one vendor covering endpoint, mobile, service desk, patching and access is easier to run than six. That is a real argument for an understaffed IT department, and the company is the clearest test of it in this market.",
    },
    {
      title: "The inherited-codebase problem, made visible",
      detail:
        "Buying eight companies means owning eight codebases, eight sets of assumptions and eight security histories, some written before the threats they now face existed. The 2024 disclosures are what that looks like under sustained attack, and no amount of shared branding changes the code underneath.",
    },
    {
      title: "Replacing the foundation rather than patching it",
      detail:
        "Rebuilding an appliance on a hardened enterprise operating system with mandatory access control is an expensive, slow answer that addresses the actual class of problem rather than the individual instances. Most vendors under that pressure ship patches faster instead.",
    },
    {
      title: "Publishing the commitments",
      detail:
        "Signing a public pledge with specific, checkable commitments - multi-factor authentication, no default credentials, expanded disclosure, tracked progress - converts intentions into things a customer can hold you to. It also creates a record against which later failures are measured, which is the point.",
    },
  ],
  markets: [
    "Enterprise and public sector IT operations, with a heavy footprint in organisations that value one vendor across many functions - and, in the case of the access products, in government networks, which is why the 2024 exploitation drew national advisories rather than trade coverage.",
    "It competes with endpoint management specialists, service management platforms, and access vendors separately rather than as one market, which is the cost of the consolidation strategy: every competitor is a specialist in one thing the company does among many.",
  ],
  analyst: [
    "Assessed as a substantial presence in unified endpoint management and IT service management, with breadth as the recognised strength and integration depth across the acquired lines as the recurring criticism.",
    "The security record is now part of every assessment. The honest position is that the response has been more structural than most - a foundation rebuild and public, checkable commitments - and that the disclosures have continued regardless, which is what remediating a decade of inherited code actually looks like from the outside.",
  ],
};
