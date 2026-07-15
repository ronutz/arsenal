// ============================================================================
// src/content/vendors/profiles/brocade-broadcom.ts
// ----------------------------------------------------------------------------
// BROCADE & FOUNDRY - THE BROADCOM DIASPORA. Two 1990s pioneers merged in 2008,
// then were taken apart in 2017: the Fibre Channel SAN business stayed with
// Broadcom, the Foundry-derived data-center line went to Extreme Networks, and
// campus switching plus Ruckus Wi-Fi went to ARRIS, then CommScope, with Belden
// announced as the next owner in 2026.
//
// Verified 2026-07-14 against primary sources: Broadcom 10-K FY2018 (close
// Nov 17, 2017: ~$5.3B cash + $701M term-loan retirement), Broadcom/Extreme
// press release (Mar 29, 2017: $55M = $35M close + $20M deferred; SLX, VDX,
// MLX, CES, CER, Workflow Composer), ARRIS SEC 8-K (Feb 22, 2017: $800M,
// closed Dec 1, 2017), Brocade 10-Q FY2008 (Foundry $19.25/share announced),
// Foundry 10-K FY1999 (founded May 1996), Foundry Wikipedia (renegotiation to
// $16.50 all-cash ~$2.6B; completed Dec 18, 2008), InfoWorld/Dell'Oro (Q3 2008
// SAN share), Ruckus Wikipedia (CommScope 2019; Belden announced Apr 30, 2026).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const brocadeBroadcomProfile: VendorProfile = {
  slug: "brocade-broadcom",
  foundings: [
    {
      company: "Brocade Communications Systems",
      year: 1995,
      place: "San Jose, California",
      founders: ["Seth Neiman", "Kumar Malavalli", "Paul R. Bonderson"],
      story:
        "Founded in August 1995 by an unusual trio: Neiman, a venture capitalist, former Sun Microsystems executive, and professional auto racer, who became the first CEO; Malavalli, a co-author of the Fibre Channel specification itself; and Bonderson, a former Intel and Sun executive. The SilkWorm Fibre Channel switch shipped in early 1997 on Brocade's own Stitch ASIC with a VxWorks-based Fabric OS, and the storage area network era had its backbone. Brocade went public on May 25, 1999.",
    },
    {
      company: "Foundry Networks",
      year: 1996,
      place: "Santa Clara, California",
      founders: ["Bobby R. Johnson, Jr.", "H. Earl Ferguson"],
      story:
        "Founded in May 1996 by Johnson, who had already founded LAN-switch maker Centillion Networks, with Ferguson as founding CTO. The company spent its first months as Perennium Networks and StarRidge Networks before becoming Foundry in January 1997. It then moved with startling speed: the first gigabit Ethernet switch and the first Layer 3 switch in 1997, the first Layer 4-7 switch, ServerIron, in 1998. Its dot-com era IPO reached a $9 billion valuation on the first day of trading.",
    },
  ],
  timeline: [
    { year: 1995, title: "Brocade founded", detail: "August 1995, San Jose: a VC and auto racer, a Fibre Channel spec co-author, and an ex-Intel executive set out to build the switched storage fabric." },
    { year: 1996, title: "Foundry founded", detail: "May 1996, Santa Clara: Bobby Johnson's second networking startup, briefly named Perennium and StarRidge before Foundry stuck in January 1997.", sourceNote: "Founding date per Foundry's own SEC 10-K." },
    { year: 1997, title: "SilkWorm ships; Foundry's Ethernet firsts", detail: "Brocade's SilkWorm Fibre Channel switch arrives on the Stitch ASIC with Fabric OS. The same year Foundry ships the first gigabit Ethernet switch and the first Layer 3 switch." },
    { year: 1998, title: "ServerIron: the first Layer 4-7 switch", detail: "Foundry invents application-layer switching - server load balancing before the industry had settled on a name for it." },
    { year: 1999, title: "Both companies IPO in the bubble", detail: "Brocade lists on May 25, 1999 (a split-adjusted $4.75). Foundry's debut reaches a $9 billion valuation on day one - one of the defining IPOs of the dot-com era." },
    { year: 2007, title: "Brocade absorbs McDATA", detail: "Completed January 29, 2007: Brocade acquires its biggest Fibre Channel rival, announced August 8, 2006 at $713 million, consolidating the SAN fabric market." },
    { year: 2008, title: "Brocade acquires Foundry (~$2.6B)", detail: "Announced July 21, 2008 at roughly $3.0 billion ($19.25 per share in cash and stock); the financial crisis forced a renegotiation to $16.50 per share all-cash, about $2.6 billion. Completed December 18, 2008 - Brocade steps from SANs into the full Ethernet and IP market.", sourceNote: "Brocade 10-Q FY2008; renegotiated terms per contemporaneous press." },
    { year: 2016, title: "Brocade adds Ruckus; Broadcom comes calling", detail: "Brocade closes its acquisition of Wi-Fi maker Ruckus Wireless in May 2016. On November 2, Broadcom announces it will acquire Brocade - keeping the Fibre Channel SAN business and divesting everything else to avoid competing with its own chip customers." },
    { year: 2017, title: "The dismemberment", detail: "Extreme Networks closes on Brocade's data-center networking business in October 2017 for $55 million ($35M at close, $20M deferred): the SLX, VDX, MLX, CES and CER lines plus Workflow Composer. Broadcom completes the Brocade acquisition on November 17 (~$5.3B cash plus $701M to retire Brocade's term loan). On December 1, ARRIS closes on Ruckus Wireless and the ICX campus-switch business for $800 million.", sourceNote: "Broadcom 10-K FY2018; Broadcom/Extreme release, Mar 29, 2017; ARRIS 8-K, Feb 22, 2017." },
    { year: 2019, title: "Ruckus and ICX move again", detail: "CommScope completes its $7.4 billion acquisition of ARRIS in April 2019, carrying the Ruckus and ICX portfolios with it." },
    { year: 2026, title: "The diaspora keeps moving", detail: "On April 30, 2026, Belden announces the purchase of Ruckus Networks from CommScope for $1.85 billion - the fourth owner for the campus lineage since Brocade.", sourceNote: "Announced; pending completion as of this page's last verification." },
  ],
  products: [
    { name: "SilkWorm and the Brocade SAN line", what: "From the 1997 SilkWorm to director-class fabrics on Fabric OS - the Fibre Channel backbone that still carries the Brocade name inside Broadcom." },
    { name: "BigIron / FastIron / NetIron", what: "Foundry's Ethernet switching and routing families for enterprises and service providers, with performance leadership in the early 10 Gigabit Ethernet market." },
    { name: "ServerIron", what: "The first Layer 4-7 switch (1998): server load balancing and application delivery before the ADC category existed - an early rival in the market F5 came to define." },
    { name: "SLX / VDX / MLX", what: "The data-center switching and routing lines that went to Extreme Networks in 2017 and live on in its portfolio." },
    { name: "ICX campus switching and Ruckus Wi-Fi", what: "The FastIron-descended campus line and Ruckus wireless, which traveled from Brocade to ARRIS to CommScope - with Belden announced next." },
  ],
  innovations: [
    { title: "The switched Fibre Channel fabric", detail: "Malavalli co-authored the Fibre Channel spec; Brocade turned it into a product category. Zoning and fabric services in Fabric OS made shared storage networks operable at enterprise scale." },
    { title: "Gigabit and Layer 3 switching firsts", detail: "Foundry shipped both in 1997, setting the performance bar for the wire-speed Ethernet era." },
    { title: "Layer 4-7 application switching", detail: "ServerIron (1998) put load balancing into the switch fabric, years before 'application delivery controller' entered the vocabulary." },
    { title: "ASIC-first engineering culture", detail: "Both companies won on custom silicon - Brocade's Stitch and BLOOM generations, Foundry's wire-speed forwarding - proving purpose-built chips beat general-purpose designs in the fabric." },
  ],
  markets: [
    "For two decades Brocade was the dominant Fibre Channel fabric vendor: in the third quarter of 2008, Dell'Oro Group put Brocade above 55% of the modular SAN-switch market, with Cisco around 44% - a two-horse race that defined storage networking. The FC SAN business continues under Broadcom, serving the flash and AI-era storage buildout.",
    "Foundry served enterprises and service providers with wire-speed Ethernet, and its DNA is now distributed: data-center switching and routing at Extreme Networks, campus switching and Ruckus Wi-Fi at CommScope (with Belden announced as the next owner in 2026), and the SAN fabric at Broadcom.",
  ],
  analyst: [
    "Dell'Oro Group, Q3 2008: Brocade held more than 55% of the modular SAN-switch market, with Cisco at roughly 44% - the market structure that made the Foundry deal Brocade's bid to fight Cisco across the whole network.",
    "Brocade's own July 2008 merger materials positioned Foundry as the innovator with performance leadership in the then-emerging 10 Gigabit Ethernet market.",
  ],
  careerLink: {
    href: "/about/vendors/extreme",
    label: "The Foundry data-center line (SLX, VDX, MLX) lives on at Extreme Networks - see Rodolfo's Extreme page",
  },
};
