// ============================================================================
// DELL & FORCE10 - the direct model that ate the datacenter, and the 10GbE
// pioneer inside it. Knowledge-based, dates well-documented (2026-07-16):
// Dell founded 1984 (Michael Dell, UT Austin dorm, as PC's Limited); direct
// model; #1 PC maker early 2000s; take-private 2013 (~$24.9B with Silver
// Lake); EMC acquisition completed Sept 2016 (~$67B, the largest tech deal);
// VMware majority spun off Nov 2021; public again Dec 2018. Force10
// Networks founded 1999, San Jose; E-Series (2002) delivers line-rate 10GbE
// switching at scale (E1200), big in HPC fabrics; merges with Turin
// Networks 2009; Dell acquires Force10 in 2011 (~$700M reported) -> Dell
// Networking (FTOS -> OS9 -> OS10 lineage; PowerSwitch today).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const dellForce10Profile: VendorProfile = {
  slug: "dell-force10",
  foundings: [
    {
      company: "Dell (PC's Limited)",
      year: 1984,
      place: "Austin, Texas",
      founders: ["Michael Dell"],
      story:
        "Michael Dell assembled PCs in a University of Texas dorm room on a premise the industry thought was a niche: sell direct, build to order, let inventory approach zero. The direct model made Dell the world's largest PC maker within two decades - and its second act was bigger: the 2013 take-private, the 2016 EMC acquisition (the largest technology deal in history), and the transformation into the datacenter's broadest supplier: servers, storage, and - through one 2011 acquisition - the network fabric between them.",
    },
    {
      company: "Force10 Networks",
      year: 1999,
      place: "San Jose, California",
      founders: ["Som Sikdar and co-founders"],
      story:
        "Force10 bet early that 10 Gigabit Ethernet would need switches built for it from silicon up - not gigabit boxes with fast uplinks. The 2002 E-Series delivered line-rate 10GbE density nobody else shipped, and the HPC and web-scale worlds noticed: Force10 fabrics carried some of the era's largest clusters. FTOS - its BSD-derived, CLI-familiar operating system - earned the engineering respect that made the company worth buying whole.",
    },
  ],
  timeline: [
    { year: 1988, title: "Dell goes public", detail: "PC's Limited becomes Dell Computer Corporation - the direct model heading for the Fortune 500, one built-to-order box at a time." },
    { year: 2002, title: "The E1200", detail: "Force10's chassis delivers line-rate 10 Gigabit Ethernet at densities the incumbents cannot match - the switch of choice where clusters are measured in thousands of nodes." },
    { year: 2011, title: "Dell buys the fabric", detail: "Dell acquires Force10 (~$700 million reported) - the direct-model giant taking networking in-house; FTOS becomes Dell Networking OS9, later OS10, on the S and Z series.", sourceNote: "Reported deal value per contemporary coverage; terms were not formally disclosed." },
    { year: 2013, title: "The take-private", detail: "Michael Dell and Silver Lake take the company private (~$24.9 billion) to rebuild outside the quarterly glare - the prelude to the biggest bet." },
    { year: 2016, title: "EMC", detail: "September 2016: the ~$67 billion EMC acquisition closes - the largest technology deal in history - creating Dell Technologies: servers, EMC storage, VMware (majority, spun off in 2021), and the Force10-heritage switching tying it together.", sourceNote: "Deal figures per the public record." },
    { year: 2018, title: "Public again, datacenter-first", detail: "Dell returns to the markets; PowerEdge, PowerStore, and PowerSwitch frame the portfolio - the dorm-room assembler now the incumbent across the racks its switches interconnect." },
  ],
  products: [
    { name: "PowerEdge servers", what: "The volume server line under a vast share of the world's workloads - the direct model's datacenter descendant." },
    { name: "Force10 E/S/Z series (PowerSwitch)", what: "The 10GbE-pioneer switching lineage, FTOS to OS10 - Dell's network fabric heritage." },
    { name: "EMC storage lines", what: "The 2016 inheritance - PowerMax, PowerStore, Data Domain - that made Dell the datacenter's broadest shelf." },
  ],
  innovations: [
    { title: "The direct model", detail: "Build-to-order, negative-working-capital manufacturing - Dell's founding innovation was logistics, and it reset how hardware reaches buyers." },
    { title: "Purpose-built 10GbE", detail: "Force10 proved the generational-Ethernet lesson: each speed jump rewards silicon designed for it - the pattern every merchant-silicon debate since replays." },
  ],
  markets: [
    "Dell Technologies today leads or contends in servers, enterprise storage, and campus-to-datacenter switching - with the AI-server wave the newest chapter of the direct model's reach.",
  ],
  analyst: [
    "A consolidated entry by design: Force10's engineering story only resolves inside Dell's scale story - the pioneer absorbed, its OS lineage intact, its 10GbE bet vindicated by every subsequent speed transition.",
  ],
};
