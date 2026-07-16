// ============================================================================
// src/content/vendors/profiles/paessler.ts
// ----------------------------------------------------------------------------
// PAESSLER - PRTG's maker: the German Mittelstand counter-story to VC-built
// networking vendors. Verified 2026-07-15 vs Paessler's own history pages and
// press: origins 1997 (student Dirk Paessler, software for the Fireball
// search engine, then the Webserver Stress Tool); Paessler GmbH founded
// August 22, 2001; AG 2005; PRTG Network Monitor born when PRTG Traffic
// Grapher and IPCheck Server Monitor merge into v7 (2007/2008, name a nod to
// MRTG); Fürth to Nuremberg 2007; Dirk steps down as CEO 2018 (Twardawa,
// then Helmut Binder 2019); 500,000+ users in 190+ countries; Turn/River
// Capital strategic investment May 23, 2024 - the first outside round in 27
// organically grown years; Jason Teichman CEO thereafter.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const paesslerProfile: VendorProfile = {
  slug: "paessler",
  foundings: [
    {
      company: "Paessler",
      year: 1997,
      place: "Nuremberg, Germany",
      founders: ["Dirk Paessler"],
      story:
        "Paessler began the way German engineering companies do: with a student annoyed by a tool. Dirk Paessler, writing software for the Fireball search engine in 1997, built the Webserver Stress Tool when his own code kept crashing servers - then, needing to monitor a growing network and refusing to fight MRTG's seven pages of installation instructions, wrote PRTG Traffic Grapher instead (the name itself a tip of the hat to MRTG). Paessler GmbH followed on August 22, 2001, the AG in 2005 - and the company grew from a dorm project to half a million users in 190 countries with no venture capital at all, the Mittelstand counter-story to every funding-led vendor on these pages.",
    },
  ],
  timeline: [
    { year: 1997, title: "A student, a vision, a garage", detail: "Dirk Paessler's Fireball work spawns the Webserver Stress Tool - the fore-runner - and the frustration with MRTG that will become PRTG." },
    { year: 2001, title: "Paessler GmbH", detail: "Founded August 22, 2001; PRTG Traffic Grapher and IPCheck Server Monitor sell as shareware while the company graduates from living room to office." },
    { year: 2008, title: "PRTG Network Monitor", detail: "Traffic Grapher and IPCheck merge into PRTG Network Monitor 7 - one product, sensors for everything, licensed by sensor count: the shape PRTG keeps to this day. The company had moved to Nuremberg, by the castle, the year before." },
    { year: 2018, title: "The founder steps back", detail: "Dirk Paessler hands the CEO role on (Christian Twardawa, then Helmut Binder in 2019) with the company past 300 people - still family-and-employee owned, still monitoring-only by explicit strategy." },
    { year: 2024, title: "Turn/River: the first outside capital", detail: "May 23, 2024: Turn/River Capital makes a strategic investment - after 27 years of purely organic growth to 500,000+ users, the first institutional money in the company's history, opening the OT and enterprise expansion chapter.", sourceNote: "Paessler/Turn-River joint announcement." },
  ],
  products: [
    { name: "PRTG Network Monitor", what: "The flagship: agentless monitoring by sensors - SNMP, WMI, NetFlow, packet sniffing, HTTP, and hundreds more - with maps, alerting, and reporting in one install." },
    { name: "PRTG Enterprise Monitor", what: "The large-environment edition: multi-server horizontal scale with the ITOps Board on top." },
    { name: "PRTG Hosted Monitor", what: "The same engine as a hosted service - monitoring without owning the monitoring server." },
  ],
  innovations: [
    { title: "Monitoring the admin actually enjoys", detail: "PRTG's bet was usability: auto-discovery, sensible defaults, and an interface a generalist admin could own - network monitoring as a product, not a project." },
    { title: "The organic-growth proof", detail: "Half a million users across 190 countries with no venture funding for 27 years - evidence that disciplined product focus can build a global vendor on revenue alone." },
  ],
  markets: [
    "The SMB-to-midmarket monitoring standard, expanding upward and into OT and industrial environments - against SolarWinds, ManageEngine, and the open-source stacks, with the sensor-based licensing model as its signature.",
  ],
  analyst: [
    "A perennial of the network-monitoring recommendation lists and midmarket evaluations - the category's usability benchmark more than its feature-count leader.",
  ],
};
