// ============================================================================
// DATACOM - Brazil's networking manufacturer: the hometown entry (roster C7),
// pairing with the Cyclades profile's Brazilian thread. Founding facts
// verified 2026-07-19 against datacom.com.br: founded 1998 in Porto Alegre by
// a group of gaúcho engineers, now situated in Eldorado do Sul, Rio Grande do
// Sul. Brazil's largest domestic networking equipment maker; carrier Ethernet
// (DmSwitch lineage), GPON OLT/ONU lines for the country's vast regional-ISP
// market, its own network OS (DmOS), SDH/optical transport history, national
// broadband and carrier deployments; domestic-industry financing preference
// (BNDES-linked credit lines historically favoring Brazilian-made gear)
// stated as the structural factor it is, neutrally. Founders kept as "a group
// of gaúcho engineers" per the citable source (PRIME 2026-07-19, option a);
// the two specific names PRIME holds first-hand are not in any public source,
// so they are not asserted here.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const datacomProfile: VendorProfile = {
  slug: "datacom",
  foundings: [
    {
      company: "Datacom",
      year: 1998,
      place: "Porto Alegre, Rio Grande do Sul, Brazil",
      founders: ["A group of gaúcho engineers"],
      story:
        "Every other company in this encyclopedia had to be imported into Brazil; Datacom is the one that grew there. Founded in 1998 in Porto Alegre by a group of gaúcho engineers - and today based in nearby Eldorado do Sul - Datacom set out to prove the improbable: that carrier-grade networking equipment - the switches, the optical transport, eventually the GPON access layer - could be designed and manufactured domestically, with its own network operating system, and hold its ground in a market the global giants treated as an export destination. A quarter century on, it is Brazil's largest homegrown networking manufacturer, which makes it something rarer than a vendor: an existence proof.",
      sourceNote: "Founding year, Porto Alegre origin, and \"group of gaúcho engineers\" per datacom.com.br; the company is today situated in Eldorado do Sul, RS.",
    },
  ],
  timeline: [
    { year: 1998, title: "Founded in the south", detail: "Datacom starts in Rio Grande do Sul's technology corridor - part of the same Brazilian engineering tradition that a decade earlier had taken Cyclades from a São Paulo garage to Silicon Valley - aiming at the transport and access gear Brazilian carriers were importing." },
    { year: 2005, title: "The carrier Ethernet years", detail: "The DmSwitch lineage carries Datacom into carrier Ethernet and metro networks: Brazilian-designed switching in Brazilian operators' backbones, the company's first proof that 'national manufacturer' could mean more than assembly." },
    { year: 2012, title: "A national OS", detail: "DmOS consolidates the portfolio on Datacom's own network operating system - the deepest form of independence a networking vendor can claim, and the one that separates manufacturers from integrators." },
    { year: 2016, title: "The GPON wave", detail: "Brazil's fiber boom runs disproportionately through thousands of regional ISPs - the provedores that wired the interior while the giants focused on capitals - and Datacom's OLT and ONU lines become domestic staples of that build-out." },
    { year: 2020, title: "The structural advantage, stated plainly", detail: "Domestic-industry financing - BNDES-linked credit lines that historically favored Brazilian-manufactured equipment - gives national gear a real procurement edge in carrier and public projects. It is industrial policy working as designed, and part of why a domestic networking manufacturer is viable at all.", sourceNote: "BNDES/FINAME domestic-content financing mechanisms per Brazilian public industrial-policy record." },
    { year: 2024, title: "The quarter-century mark", detail: "Datacom continues as Brazil's networking manufacturer of record - access, transport, and switching lines under DmOS, exports across Latin America, and a standing answer to whether the country can build its own network layer." },
  ],
  products: [
    { name: "GPON access (OLT/ONU lines)", what: "The fiber-to-the-home machinery of Brazil's regional-ISP boom - the access layer of the country's interior, domestically designed." },
    { name: "DmSwitch and carrier Ethernet", what: "Metro and carrier switching - the lineage that established Datacom in operator backbones." },
    { name: "DmOS", what: "The company's own network operating system across the portfolio - the sovereignty layer, in software." },
  ],
  innovations: [
    { title: "The existence proof", detail: "Datacom's contribution is the demonstration itself: a domestic manufacturer with its own silicon choices, own OS, and own roadmap, surviving for decades in a market global vendors assume belongs to them." },
    { title: "Built for the provedores", detail: "Designing for Brazil's thousands of small regional ISPs - price points, PT-BR support, financing compatibility - is a product discipline of its own, and Datacom made it a franchise." },
  ],
  markets: [
    "Brazilian carriers, public-sector networks, and above all the regional ISP market that fibered the country's interior - with exports across Latin America. The hometown vendor of this record's hometown.",
  ],
  analyst: [
    "Datacom's global footprint is modest and its national significance is not: it anchors the argument that network sovereignty is buildable - the same argument playing out at continental scale elsewhere in this encyclopedia.",
    "For this record it is also personal geography: the Brazilian engineering tradition that runs through Cyclades' São Paulo founders and through the career told on this site runs through Rio Grande do Sul too.",
  ],
};
