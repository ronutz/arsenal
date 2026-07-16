// ============================================================================
// src/content/vendors/profiles/netscreen-juniper.ts
// ----------------------------------------------------------------------------
// NETSCREEN & JUNIPER - RODOLFO'S 2009-2010 CHAPTER, with the two founding
// legends beneath it: the Xerox PARC scientist whose vacation idea broke
// Cisco's core-routing monopoly, and the Tsinghua trio whose garage-built
// ASIC firewall seeded half of modern network security (Fortinet, Palo Alto
// Networks - the "NetScreen mafia").
//
// Verified 2026-07-15: Wikipedia Juniper (Feb 1996 Sindhu; PARC vacation
// idea; 1997 round w/ Siemens/Ericsson/Nortel/3Com; $673M 2000; 37% core
// routers 2001; Unisphere 2002; options restatement 2006; Pulse spun off
// 2014 $250M; HPE closed Jul 2, 2025), Wikipedia Sindhu (co-founders Dennis
// Ferguson + Bjorn Liencres; 11 yrs PARC; Fungible), company histories
// (JUNOS Dec 1997 first backbone OS; M40 Sept 1998, 40M pps; IPO Jun 25,
// 1999 $63M raised; IBM ASIC pact Jul 1996; Kriens ex-StrataCom; Rahim
// employee #32), Wikipedia NetScreen (founders Ke/Xie/Deng; OneSecure $45M
// 2002 - Nir Zuk ex-Check Point, Rakesh Loonkar later Trusteer; Dec 2015
// ScreenOS unauthorized code incl. Dual_EC change; NetScreen-1000 first
// gigabit firewall; $4B stock 2004), Ken Xie Wikipedia (first ASIC
// firewall/VPN built 1996 in his Palo Alto garage; left 2000 -> Fortinet w/
// brother Michael; FortiGate May 2002), Fenwick (founding Oct 1997; IPO Dec
// 2001), EE Times (Neoteris ~$245M stock + $20M cash, Oct 2003), Grokipedia
// (revenue $5.9M FY99 -> $245.3M 2003; Japan #1 per IDC; "NetScreen mafia";
// completed Apr 16, 2004; Ke + Deng -> Northern Light VC 2005; Zuk -> Palo
// Alto Networks 2005). R1 canon: Feb 9, 2004 announcement, 1.404 ratio ~$4B
// (SEC 425); Mist closed Apr 1, 2019 ($405M announced, $359.2M per 10-Q);
// HPE $40/share ~$14B announced Jan 9, 2024, DOJ suit Jan 30, 2025,
// settlement Jun 28, 2025, closed Jul 2, 2025 ~$13.4B (HPE 10-K).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const netscreenJuniperProfile: VendorProfile = {
  slug: "netscreen-juniper",
  foundings: [
    {
      company: "Juniper Networks",
      year: 1996,
      place: "Sunnyvale, California",
      founders: ["Pradeep Sindhu", "Dennis Ferguson", "Bjorn Liencres"],
      story:
        "After eleven years at Xerox PARC's Computer Science Lab, Pradeep Sindhu took a 1995 leave, went on vacation, and came back with a company: routers built like computers-for-packets, with custom silicon separating forwarding from control, aimed at the Internet core Cisco held with over 90 percent share. Incorporated February 6, 1996 with Dennis Ferguson (ex-MCI) and Bjorn Liencres (ex-Sun); Kleiner Perkins' Vinod Khosla had spent six months of weekly meetings shaping the idea. Scott Kriens - a StrataCom veteran - became CEO at month seven while Sindhu turned CTO, and the 1997 funding round told the industry everything: four of the five largest telecom equipment makers - Siemens, Ericsson, Nortel, and 3Com - bought in.",
    },
    {
      company: "NetScreen Technologies",
      year: 1997,
      place: "Sunnyvale, California",
      founders: ["Yan Ke", "Ken Xie", "Feng Deng"],
      story:
        "Three Tsinghua University alumni built the security half of this page's story. Ken Xie - Tsinghua and Stanford EE - had already built the first ASIC-based firewall/VPN appliance in his Palo Alto garage in 1996; NetScreen incorporated in October 1997 to turn silicon-speed security into a company, and its NetScreen-1000 became the first gigabit-speed firewall. Robert Thomas arrived from Sun as CEO in 1998; Xie stayed CTO until 2000, when he left to found Fortinet with his brother Michael - FortiGate shipped in May 2002. Revenue ran $5.9 million to $245.3 million in four years, with IDC ranking NetScreen the number-one firewall vendor in Japan. (Incorporated October 1997 per the company's longtime counsel; the garage prototype and some histories date the venture to 1996.)",
    },
  ],
  timeline: [
    { year: 1996, title: "Juniper incorporates; IBM fabs the silicon", detail: "February 6, 1996: Sindhu's clean-sheet core router company forms on $2 million of seed capital. By July, IBM is signed to manufacture Juniper's custom ASICs - the packet-forwarding engines that are the whole bet." },
    { year: 1997, title: "The customers become investors; JUNOS ships", detail: "A $40 million strategic round brings in Siemens, Ericsson, Nortel, and 3Com - four of the five largest telecom equipment makers - plus Qwest and AT&T money. In December, JUNOS ships: the industry's first operating system designed specifically for Internet backbone routing. The same fall, NetScreen incorporates around Xie's garage-built ASIC firewall." },
    { year: 1998, title: "The M40 lands", detail: "September 1998: the M40 ships - 40 million packets per second, control plane separated from a silicon forwarding plane, roughly ten times the throughput of the software-based competition, against Cisco's 90-plus percent core share. First-quarter revenue: $3.8 million." },
    { year: 1999, title: "The IPO of the era", detail: "June 25, 1999: Juniper prices at $34 and closes its first day at $99, raising $63 million. Revenue passes $100 million with the first profitable quarter; fifty carriers run the M40." },
    { year: 2001, title: "37 percent of the core; NetScreen goes public", detail: "Juniper's share of core routing reaches 37 percent - the duopoly is real. In December, NetScreen IPOs on NASDAQ (NSCN) into the narrow post-9/11 window, one of the few security debuts of the downturn." },
    { year: 2002, title: "NetScreen buys its future rivals' founders", detail: "OneSecure, for $45 million in stock, brings in-line intrusion prevention - and its co-founders: Nir Zuk, one of Check Point's earliest employees, becomes NetScreen's CTO; Rakesh Loonkar later co-founds Trusteer. In 2003, Neoteris adds SSL VPN for roughly $245 million in stock plus $20 million cash.", sourceNote: "OneSecure reported at $45M (some accounts $40M); Neoteris terms per EE Times, Oct 2003." },
    { year: 2004, title: "Juniper pays $4 billion for NetScreen", detail: "Announced February 9, 2004 - 1.404 Juniper shares per NetScreen share, about $4 billion in stock - and completed April 16. Juniper gets ScreenOS, the ASIC security franchise, and Japan's top firewall vendor; the lineage becomes the SSG series and then the SRX.", sourceNote: "SEC Form 425 filings; completion per Juniper's April 16, 2004 release." },
    { year: 2005, title: "The NetScreen mafia disperses", detail: "Nir Zuk leaves Juniper to found Palo Alto Networks; Yan Ke and Feng Deng leave to start Northern Light Venture Capital; Ken Xie's Fortinet is already four years old. One Sunnyvale startup has now seeded three of security's defining institutions." },
    { year: 2008, personal: true, title: "The enterprise push - and Rodolfo's on-ramp", detail: "Juniper ships its first Ethernet switch, the EX 4200, and launches the SRX services gateways; Kriens becomes chairman and Microsoft's Kevin Johnson takes the CEO chair. The MX edge routers (2006) - built by a team led by Kumar and Apurva Mehta, later of Versa - anchor the portfolio Rodolfo represents when he joins Juniper in Brazil in 2009, through 2010." },
    { year: 2014, title: "Pulse departs; employee #32 takes over", detail: "The SSL VPN line descended from Neoteris is spun off to private equity for $250 million as Pulse Secure. Rami Rahim - Juniper employee number 32 - becomes CEO." },
    { year: 2015, title: "The ScreenOS disclosure", detail: "December 2015: Juniper announces it found unauthorized code in ScreenOS, present since 2012 - a root-access backdoor and an altered Dual_EC_DRBG constant enabling passive decryption. One of the most studied supply-chain incidents in security history." },
    { year: 2019, title: "Mist: the AI turn", detail: "Closed April 1, 2019 - announced at $405 million ($359.2 million net per the 10-Q) - Mist's AI-driven wireless becomes the center of Juniper's enterprise story and, later, the asset the regulators care most about.", sourceNote: "R1 canon: Juniper 10-Q." },
    { year: 2025, title: "Into HPE", detail: "Announced January 9, 2024 at $40 per share (~$14 billion); sued by the DOJ on January 30, 2025; settled June 28 - HPE divests Instant On and licenses Mist's AIOps source code, with the DOJ noting HPE plus Cisco hold over 70 percent of US enterprise networking - and closed July 2, 2025 at roughly $13.4 billion in cash per HPE's 10-K. Rami Rahim becomes president of HPE Networking; Gartner's 2025 wired-and-wireless Magic Quadrant still lists Juniper as a Leader." },
  ],
  products: [
    { name: "Junos", what: "The industry's first backbone-specific routing OS (December 1997) - and Juniper's one-OS discipline across routing, switching, and security for two decades." },
    { name: "M-series and T-series", what: "The core routers that broke the monopoly: the M40's silicon forwarding plane, then the M160, T-series, and the multichassis core that carried the 2000s Internet." },
    { name: "MX edge routers", what: "The 2006 edge platform - engineering led by Kumar and Apurva Mehta, later founders of Versa - that became Juniper's workhorse franchise." },
    { name: "ScreenOS, SSG, and SRX", what: "The NetScreen lineage: ASIC firewalls and ScreenOS, evolved into the SSG series and then the SRX services gateways - the security line of Rodolfo's Juniper years." },
    { name: "EX switching and Mist AI", what: "The 2008 enterprise switch entry and the 2019 Mist acquisition - the AI-driven wireless and wired portfolio that HPE valued enough to buy the whole company, and the DOJ valued enough to force open." },
  ],
  innovations: [
    { title: "Separating control from forwarding", detail: "The M40's architecture - a silicon data plane under a software control plane - became how every serious router has been built since." },
    { title: "Customers as investors", detail: "The 1997 round made four of the five biggest telecom equipment makers shareholders - distribution, validation, and capital in one move." },
    { title: "Security at wire speed", detail: "Xie's garage ASIC and the NetScreen-1000 - the first gigabit firewall - proved security did not have to be the network's bottleneck." },
    { title: "The NetScreen mafia", detail: "One company's alumni founded Fortinet (Ken and Michael Xie), Palo Alto Networks (Nir Zuk), and Northern Light Venture Capital (Ke and Deng) - arguably the most consequential founder diaspora in network security." },
  ],
  markets: [
    "Juniper turned core routing from a monopoly into a duopoly - 37 percent share by 2001 - then spent two decades expanding into edge, security, switching, and AI-driven enterprise networking, ending as the $13.4 billion centerpiece of HPE's networking ambitions in 2025.",
    "Rodolfo's chapter was Brazil, 2009-2010: the EX and SRX enterprise wave, Junos as the one-OS pitch, and the NetScreen-descended security line - the same years the MX franchise built by Riverstone alumni carried the carrier business.",
  ],
  analyst: [
    "The duopoly, by the numbers: Cisco above 90 percent of core routing in 1998; Juniper at 37 percent by 2001 - the fastest share shift the router market has seen.",
    "IDC ranked NetScreen the number-one firewall vendor in Japan before the 2004 acquisition; Gartner's 2025 Magic Quadrant for Enterprise Wired and Wireless LAN still lists Juniper as a Leader inside HPE - and the DOJ's 2025 settlement pegged HPE plus Cisco at over 70 percent of US enterprise networking.",
  ],
  careerLink: {
    href: "/fortinet",
    label: "NetScreen co-founder Ken Xie went on to found Fortinet - Rodolfo's Fortinet hub",
  },
};
