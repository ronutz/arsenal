// ============================================================================
// src/content/vendors/profiles/cyberark.ts
// ----------------------------------------------------------------------------
// CYBERARK - the privileged access company, and since February 2026 a pillar
// of Palo Alto Networks. Verified 2026-07-15: PAN 10-K/ARS FY2025 (definitive
// agreement July 30, 2025; $45.00 cash + 2.2005 PANW shares per share, ~$25B
// equity value), press + deal record (shareholders ~99.8% in favor Nov 13,
// 2025; CLOSED February 11, 2026 - the largest transaction in security
// industry history; CyberArk delisted from Nasdaq), company record (founded
// 1999 Israel by Udi Mokady and Alon Cohen around the digital vault; IPO
// Nasdaq 2014 as CYBR; Conjur 2017; Idaptive 2020; Venafi ~$1.54B 2024 for
// machine identity; Matt Cohen CEO 2023). Cross-links: the Palo Alto career
// page carries the buyer's side of this story.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const cyberarkProfile: VendorProfile = {
  slug: "cyberark",
  foundings: [
    {
      company: "CyberArk",
      year: 1999,
      place: "Petah Tikva, Israel",
      founders: ["Udi Mokady", "Alon Cohen"],
      story:
        "CyberArk began with a vault. Alon Cohen's digital-vault technology - an isolated, hardened store for the credentials nobody should ever email around - gave Udi Mokady the foundation for a company built on an unfashionable insight: the most dangerous account on any network is the administrator's. For a decade 'privileged access management' was a niche; then every major breach post-mortem started with a stolen privileged credential, and CyberArk found itself the defining vendor of a category the whole industry suddenly needed.",
    },
  ],
  timeline: [
    { year: 1999, title: "The digital vault", detail: "Founded in Israel around vault technology for secrets and privileged credentials - session isolation, credential rotation, and the audit trail for the accounts that can do anything." },
    { year: 2014, title: "IPO: CYBR", detail: "CyberArk lists on Nasdaq as the privileged access management category's standard-bearer, riding the post-breach era in which stolen admin credentials headline every incident report." },
    { year: 2017, title: "Secrets for machines", detail: "The Conjur acquisition extends the vault to DevOps: secrets management for applications, containers, and CI/CD pipelines - privilege was never only human." },
    { year: 2020, title: "Identity beyond privilege", detail: "Idaptive (~$70 million) adds workforce access management and SSO, beginning the widening from PAM into a full identity security platform." },
    { year: 2024, title: "Venafi: the machine identity bet", detail: "The ~$1.54 billion Venafi acquisition adds certificate and machine-identity management at scale - by now machines outnumber human identities many times over, and CyberArk moves to own both sides.", sourceNote: "Announced May 2024; completed October 2024." },
    { year: 2026, title: "The $25 billion exit", detail: "February 11, 2026: Palo Alto Networks completes its acquisition of CyberArk - $45.00 in cash plus 2.2005 PANW shares per share, roughly $25 billion, the largest deal in security industry history - making identity the third pillar of the Palo Alto platform beside network security and the SOC.", sourceNote: "PAN 10-K FY2025 (terms); close per company announcements, Feb 11, 2026." },
  ],
  products: [
    { name: "Privileged Access Manager", what: "The flagship: vaulting, session isolation and recording, and rotation for the accounts that hold the keys." },
    { name: "Secrets Manager (Conjur)", what: "Machine and application secrets for DevOps pipelines, containers, and cloud workloads." },
    { name: "Venafi machine identity", what: "Certificate lifecycle and machine identity management - the 2024 acquisition's TLS-scale contribution." },
    { name: "Identity Security Platform", what: "The umbrella spanning workforce access, endpoint privilege, and cloud entitlements - now being folded into Palo Alto's Cortex and Strata." },
  ],
  innovations: [
    { title: "Privileged access as a category", detail: "CyberArk did not join the PAM market; it substantially was the PAM market, defining the vault-isolate-rotate-record pattern the analysts later drew the category around." },
    { title: "Every identity, including machines", detail: "The Conjur and Venafi arcs extended 'privilege' from admins to workloads and certificates - the framing Palo Alto paid $25 billion to own as AI agents multiply identities further." },
  ],
  markets: [
    "The reference vendor in privileged access and a leader across identity security - serving most of the world's largest enterprises - now operating inside Palo Alto Networks as its identity pillar since February 2026.",
  ],
  analyst: [
    "A perennial Leader of the privileged access management analyst evaluations from the category's first editions onward - the standing that framed the 2026 acquisition.",
  ],
};
