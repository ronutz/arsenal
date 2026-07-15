// ============================================================================
// src/content/vendors/profiles/ironport.ts
// ----------------------------------------------------------------------------
// IRONPORT SYSTEMS - the email-security pioneer Rodolfo engaged with in
// 2004-2005, years before Cisco bought it. The shortest chapter in the career
// section, given its full verified record: the PayPal-and-Hotmail founding
// pedigree, SenderBase (the world's first and largest email traffic monitoring
// network), AsyncOS, the $830M Cisco acquisition, and the lineage that still
// runs through Talos and the iphmx.com domain today.
//
// Verified 2026-07-15: Justapedia/Wikipedia-lineage IronPort article (founded
// Dec 2000 by Banister + Weiss; SpamCop Nov 24, 2003; Cisco announced Jan 4,
// 2007, $830M, completed Jun 25, 2007; SenderBase renamed SensorBase), eWeek
// (408 employees; SenderBase 100,000+ orgs; AsyncOS stack-less threading,
// 10,000+ connections; Cisco a longtime customer), business-software.com
// (SenderBase 110+ parameters, 5B+ queries/day; staff from Hotmail, eGroups,
// ListBot, Yahoo; customers CNN, Microsoft, Nasdaq, PayPal), startupintros
// ($90M raised by 2004; $25M quarterly sales Aug 2006; 3,000 customers; 8 of
// 10 largest ISPs), Grokipedia Banister bio (Idealab bid-for-placement
// auction -> Overture; PayPal founding board; 10B+ emails/day by mid-2000s),
// captaindns.com (Nov 26, 2012 pricelist brand retirement; iphmx.com =
// IronPort Hosted MX; Talos 600B emails/day; 2021 Cisco Secure renames).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const ironportProfile: VendorProfile = {
  slug: "ironport",
  foundings: [
    {
      company: "IronPort Systems",
      year: 2000,
      place: "San Bruno, California",
      founders: ["Scott Banister", "Scott Weiss"],
      story:
        "Founded in December 2000 by two of Internet messaging's original insiders: Banister, the Idealab 'VP of Ideas' who invented the bid-for-placement keyword auction behind Overture and sat on PayPal's founding board; and Weiss, an early Hotmail team member, as CEO. They staffed the company from Hotmail, eGroups, ListBot, and Yahoo, and bet on a then-contrarian idea - that spam would be beaten not by inspecting message content but by scoring the behavior and reputation of the machines sending it, delivered on purpose-built appliances. Roughly $90 million in venture funding had backed the thesis by 2004.",
    },
  ],
  timeline: [
    { year: 2000, title: "Founded in San Bruno", detail: "December 2000: Banister and Weiss start IronPort around sender reputation and the appliance model - white boxes for the email edge, at the moment spam is becoming an economic problem." },
    { year: 2003, title: "SenderBase scales; SpamCop joins", detail: "SenderBase grows into the world's first and largest email traffic monitoring network: data from more than 100,000 ISPs, universities, and corporations, over 110 measured parameters per mail server, more than 5 billion queries a day. On November 24, 2003, IronPort acquires the SpamCop filtering and reporting service and runs it as a stand-alone entity." },
    { year: 2004, title: "Rodolfo's chapter", detail: "Late 2004 into 2005: the brief, independent engagement recorded in the narrative above - while IronPort's C-Series gateways are spreading through the mail edges of large enterprises and the biggest ISPs." },
    { year: 2006, title: "The numbers before the deal", detail: "By August 2006: $25 million in quarterly sales, some 3,000 customers including eight of the ten largest ISPs, 408 employees, and marquee names like CNN, Microsoft, Nasdaq, and PayPal on the customer list. By the mid-2000s the platform is processing over 10 billion emails a day." },
    { year: 2007, title: "Cisco pays $830 million", detail: "Announced January 4, 2007 and completed June 25, 2007: Cisco - itself a longtime IronPort customer - acquires the company for $830 million and folds it into the Security Technology Group. SenderBase is renamed SensorBase as other Cisco devices begin feeding the database.", sourceNote: "Deal dates per the IronPort corporate record; $830M per Cisco's announcement." },
    { year: 2012, title: "The brand retires; the name survives in DNS", detail: "November 26, 2012: IronPort formally moves onto the Cisco price list and the brand is retired. The tell survives to this day - Cisco's cloud email service still answers at iphmx.com: IronPort Hosted MX." },
    { year: 2021, title: "The lineage today", detail: "The appliances became Cisco Secure Email Gateway and the cloud service Cisco Secure Email Cloud Gateway, both still running AsyncOS - and the SenderBase telemetry idea matured into Talos, Cisco's threat-intelligence group, which analyzes some 600 billion emails a day." },
  ],
  products: [
    { name: "C-Series email security gateways", what: "The flagship appliances: multi-layered anti-spam, antivirus, and policy enforcement at the SMTP edge, built to sit in front of the world's largest mail systems." },
    { name: "AsyncOS", what: "The proprietary operating system - a modified FreeBSD kernel with a stack-less threading model that let a single appliance hold more than 10,000 simultaneous connections, built for the asymmetric bursts of SMTP traffic." },
    { name: "SenderBase / SensorBase", what: "The reputation network that made the products work: global email telemetry scoring every sending server on the Internet, licensed even to the open-source community - and the ancestor of Cisco's Talos intelligence." },
    { name: "SpamCop", what: "The community spam-reporting and blocklist service, acquired in 2003 and deliberately kept independent - grassroots signal feeding an enterprise engine." },
    { name: "Web security appliances", what: "The S-Series extension of the model to web traffic - the same reputation-first philosophy applied to HTTP, rounding out the gateway portfolio Cisco bought." },
  ],
  innovations: [
    { title: "Reputation before content", detail: "IronPort's core insight: who is sending predicts spam better than what is said. Sender reputation scoring became the industry's first line of email defense and remains so today." },
    { title: "Telemetry as the product", detail: "SenderBase turned the customer base into a sensor network - every appliance made every other appliance smarter, a network-effect model that Talos still runs at Cisco scale." },
    { title: "The email appliance category", detail: "Purpose-built boxes with a purpose-built OS for one protocol's pathologies - AsyncOS's stack-less design handled connection volumes general-purpose mail servers could not." },
  ],
  markets: [
    "IronPort defined the enterprise email security appliance market of the 2000s, guarding the mail edges of the biggest ISPs and a fifth of the world's largest enterprises before Cisco absorbed it. The category it created later moved to the cloud - where Cisco's successor service still carries IronPort's initials in its DNS.",
    "Rodolfo's engagement, in late 2004 and 2005, belongs to the independent era - recorded here as its own chapter precisely because the acquisition came two years later.",
  ],
  analyst: [
    "SenderBase at the time of the acquisition: telemetry from more than 100,000 organizations, 110+ parameters per mail server, over 5 billion queries a day - the largest email monitoring network in the world, per contemporary coverage.",
    "The $830 million Cisco paid in 2007 bought a company running $25 million quarters with 408 employees - and a reputation network whose descendant, Talos, now analyzes roughly 600 billion emails a day.",
  ],
  careerLink: {
    href: "/about/vendors/cisco",
    label: "IronPort became Cisco's email security lineage in 2007 - the Cisco page",
  },
};
