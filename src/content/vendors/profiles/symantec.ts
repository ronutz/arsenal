// ============================================================================
// src/content/vendors/profiles/symantec.ts
// ----------------------------------------------------------------------------
// SYMANTEC - four decades of security history in one name: Norton, the great
// Veritas merger and unwinding, Blue Coat, and the Broadcom era. Verified/
// knowledge 2026-07-15: company record (founded 1982 by Gary Hendrix with an
// NSF grant, natural-language roots; Peter Norton Computing acquired 1990;
// Veritas merger ~$13.5B closed 2005, Veritas sold to Carlyle 2016; Blue Coat
// ~$4.65B 2016, Greg Clark becomes CEO; enterprise security business sold to
// Broadcom ~$10.7B completed November 2019 - the Symantec brand goes with
// it; the consumer business becomes NortonLifeLock, merges with Avast 2022,
// renamed Gen Digital). The Red Education partner catalog covers the
// Broadcom-era Symantec enterprise portfolio.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const symantecProfile: VendorProfile = {
  slug: "symantec",
  foundings: [
    {
      company: "Symantec",
      year: 1982,
      place: "Sunnyvale, California",
      founders: ["Gary Hendrix"],
      story:
        "Symantec is older than the PC security industry it came to symbolize. Gary Hendrix founded it in 1982 on a National Science Foundation grant to do natural-language processing - the name fuses syntax, semantics, and technology - and its first hit, Q&A, was a database with an English-language front end. The security identity arrived by acquisition: buying Peter Norton Computing in 1990 gave Symantec the most trusted name in PC utilities, and Norton AntiVirus became the yellow box through which a generation met computer security. Everything after - Veritas, Blue Coat, Broadcom - is the story of that franchise scaling to enterprise size and then dividing.",
    },
  ],
  timeline: [
    { year: 1982, title: "Founded for natural language", detail: "Hendrix starts Symantec out of AI research; the Q&A product's English-language database queries are the company's first success - security is nowhere in the plan yet." },
    { year: 1990, title: "Norton", detail: "Symantec acquires Peter Norton Computing; Norton Utilities and Norton AntiVirus make the brand synonymous with keeping PCs alive, and the consumer security franchise funds three decades of enterprise ambition." },
    { year: 2005, title: "The Veritas merger", detail: "The ~$13.5 billion merger with Veritas marries security to storage management - one of software's largest deals, and one of its most second-guessed; the combination never gels and Veritas is sold to Carlyle in 2016." },
    { year: 2016, title: "Blue Coat", detail: "Symantec pays ~$4.65 billion for Blue Coat, taking its web-gateway and cloud-security stack and its CEO, Greg Clark - the enterprise portfolio that later anchors the Broadcom deal." },
    { year: 2019, title: "Broadcom buys the name", detail: "Broadcom acquires Symantec's enterprise security business for ~$10.7 billion, completed November 2019 - the Symantec brand itself goes to Broadcom, sold to the largest accounts under its software group. The consumer half continues as NortonLifeLock." },
    { year: 2022, title: "Gen Digital", detail: "NortonLifeLock completes its merger with Avast and renames to Gen Digital - the Norton lineage and its old European rival under one roof, while Broadcom's Symantec carries the enterprise flag." },
  ],
  products: [
    { name: "Symantec Endpoint Security", what: "The enterprise endpoint protection lineage - descended from the corporate editions of the AntiVirus franchise, now under Broadcom." },
    { name: "Symantec Web Protection", what: "The Blue Coat heritage: secure web gateway (ProxySG lineage) and cloud-delivered web security." },
    { name: "Symantec DLP", what: "The data loss prevention suite (the Vontu acquisition's descendants) - long a reference product of the DLP category." },
  ],
  innovations: [
    { title: "Consumer security as a mass market", detail: "Norton AntiVirus made security a retail product bought by ordinary people - the revenue engine that built one of software's largest companies." },
    { title: "The conglomerate lesson", detail: "Symantec's merge-and-unwind arc - Veritas in, Veritas out; enterprise to Broadcom, consumer to Gen - became the industry's case study in how security portfolios combine and divide." },
  ],
  markets: [
    "Under Broadcom since 2019, Symantec sells endpoint, web, and data protection to the largest global enterprises - a focused, install-base-driven business - while the Norton consumer lineage lives on separately inside Gen Digital.",
  ],
  analyst: [
    "For two decades the default Leader of the endpoint protection evaluations, with the DLP and secure web gateway lines equally canonical in their categories - standing the Broadcom era inherits.",
  ],
};
