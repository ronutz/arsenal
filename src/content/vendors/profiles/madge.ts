// ============================================================================
// src/content/vendors/profiles/madge.ts
// ----------------------------------------------------------------------------
// MADGE NETWORKS - the Token Ring standard-bearer, and the chapter this
// section was missing: every hub-war page tells Ethernet's side; Madge is the
// pioneer whose technology lost. It resonates directly with Rodolfo's
// Cabletron years - Token Ring versus Ethernet was THE battleground of
// mid-90s enterprise networking, nowhere more than in IBM-shop Brazil.
//
// Verified 2026-07-15 (R6f pre-load + this session): Wikipedia/Alchetron/
// Kiddle Madge Networks (founded 1986 by Robert Madge; Wexham HQ, N.V.
// Netherlands domicile; ISA/PCI/PC Card adapters, switches, stacks; HSTR
// 16->100 Mbit/s; Olicom TR business = only large producer besides IBM; ATM
// zero return; 802.11 attempt; April 2003 bankruptcy; Madge Ltd; Ringdale
// absorption = "world's largest supplier of Token Ring technology"),
// encyclopedia.com company history (horseback-riding instructor; Intelligent
// Software chess games; Buckinghamshire family farm 1986; no new technology
// - exploiting IBM's Token Ring; first TR products 1987; Eatontown NJ + San
// Jose + 25 countries; Lannet sold to Lucent July 1998), The Register May
// 23, 2003 (Dutch administrator appointed April 17, 2003; bankruptcy order
// granted May 2003, akin to Chapter 7; Madge Limited reconstitution; Sunday
// Times Rich List; "the Betamax of the networking world"), Network World/
// Computerworld Tennant interview (fought IBM in court over Token Ring
// royalties and WON; Robert Madge left 2001 after 15 years; net personal
// loss; Madge Inc -> Network Technology PLC 2006, merged into Ringdale; his
// own hindsight: merging or selling would have been the logical course),
// Madge SEC F-3/F-3A 1999 (Token Ring = 65%/65%/72% of net sales 1996/97/98
// and 81% for 9M 1999; Lannet sale to Lucent $117M recorded August 1998;
// headcount cut roughly two-thirds July 1997 - September 1998), R6f canon
// (Lannet acquired Nov 1995; Teleos Feb 1996; Gains International Feb 1999
// -> Madge.web; Red-M spun to associate Apr 2001; Madge.web into UK
// Administration Apr 27, 2001, trader-voice assets to Tullett & Tokyo Jul
// 2001; video business to Initia Sep 2000).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const madgeProfile: VendorProfile = {
  slug: "madge",
  foundings: [
    {
      company: "Madge Networks",
      year: 1986,
      place: "The Madge family farm, Buckinghamshire, England (HQ later Wexham; N.V. domiciled in the Netherlands)",
      founders: ["Robert Madge"],
      story:
        "Robert Madge taught horseback riding before he wrote software - computer chess games at Britain's Intelligent Software, where he also project-managed the Enterprise microcomputer. In 1986 he set up on his family's Buckinghamshire farm with a startup heresy: no new technology at all. While everyone else crowded into Ethernet, Madge bet on the protocol IBM had invented - Token Ring - and set out to sell it better than IBM did. First products shipped by 1987, a second headquarters opened in San Jose, and when IBM came for royalties, Madge fought in court and won the right to build Token Ring without paying them - the victory that put an English farm startup in the catbird's seat of IBM's own market, and its founder on the Sunday Times Rich List.",
    },
  ],
  timeline: [
    { year: 1986, title: "Founded on the farm", detail: "A Buckinghamshire farmhouse startup takes on the networking market's road not taken: Token Ring - deterministic, orderly, technically elegant - against the cheap and chaotic Ethernet everyone else is building." },
    { year: 1994, title: "The peak years", detail: "By the mid-1990s Madge is a global leader in high-speed networking: adapters (ISA, PCI, PC Card), switches, and stacks across offices in more than 25 countries, with main sites in Wexham, Eatontown, and San Jose - the only serious Token Ring house besides IBM itself, and NASDAQ-listed as an N.V." },
    { year: 1995, title: "The Ethernet hedge: Lannet", detail: "November 1995: Madge acquires Israel's Lannet, a leading Ethernet and switching hub maker - the diversification bet - followed by video and ISDN specialist Teleos in February 1996. Token Ring is still 65 percent of sales; the hedge is meant to fix that.", sourceNote: "Acquisition dates per Madge's SEC filings and contemporary coverage." },
    { year: 1998, title: "The retreat - and the Lucent graveyard", detail: "The hedge unwinds: Lannet is sold to Lucent Technologies for $117 million (announced July 1998), joining the same collector that would later gather Riverstone and Alteon. Between July 1997 and September 1998, Madge cuts roughly two-thirds of its headcount and pushes High-Speed Token Ring - 16 to 100 Mbit/s with gigabit ambitions - as the loyalist path forward.", sourceNote: "Sale and restructuring figures per Madge SEC F-3/F-3A (1999); the filing records the sale in August 1998." },
    { year: 1999, title: "Last consolidator of a shrinking world", detail: "August 1999: Madge buys rival Olicom's Token Ring business, becoming the only large producer of the technology besides IBM. Its own SEC filing tells the real story: Token Ring is now 81 percent of sales - concentration by shrinkage, not growth. Gains International (February) becomes Madge.web, a managed-services escape attempt." },
    { year: 2001, title: "The unwind", detail: "The video business goes to Initia (September 2000); wireless venture Red-M is spun to an associate (April 2001); Madge.web enters UK Administration on April 27, 2001, its trader-voice assets sold to Tullett & Tokyo that July. Robert Madge himself leaves in 2001, after fifteen years - by his own account having taken the company up, and taken it down." },
    { year: 2003, title: "The end in a Dutch court", detail: "An administrator is appointed by the Dutch courts on April 17, 2003, and a bankruptcy order - the Dutch analogue of Chapter 7 - is granted that May. The operating business is reconstituted in the UK as Madge Ltd. The Register writes the era's epitaph: Token Ring, though technically superior, had become 'the Betamax of the networking world.'" },
    { year: 2006, title: "The afterlife", detail: "Restructured as Madge Inc. and briefly reinvented around wireless LAN, the remains are absorbed in 2006 by Network Technology PLC and merged into its Ringdale arm under the Madge name - making Ringdale the world's largest supplier of Token Ring technology, a superlative awarded for a market that no longer existed. Robert Madge, for his part, went on to earn acclaim in RFID and tracking." },
  ],
  products: [
    { name: "Token Ring adapters", what: "The ISA, PCI, and PC Card families that put Madge rings into millions of IBM-shop desktops - the core franchise, built royalty-free after the court win." },
    { name: "Token Ring switches and stacks", what: "The workgroup switching, stacking, and ring infrastructure that carried enterprise Token Ring through its peak - and Madge's answer to the Ethernet switch wave." },
    { name: "High-Speed Token Ring (HSTR)", what: "Madge's standards leadership on the 100 Mbit/s successor - backward compatible, gigabit-ambitious, and ultimately the last engineering act of a losing protocol." },
    { name: "Lannet Ethernet (1995-1998)", what: "The Israeli hub and switching line that was Madge's hedge on the winning side - held for three years, then sold to Lucent." },
    { name: "Video, ISDN, and Madge.web", what: "The Teleos-descended conferencing gear, Edge Switching Nodes for ISDN carriers, and the managed-services venture - the diversifications that never replaced the ring." },
  ],
  innovations: [
    { title: "Out-executing the inventor", detail: "Madge brought no new technology - it simply built IBM's protocol better, cheaper, and faster than IBM, and won the court fight that made it royalty-free. A masterclass in fast-follower strategy, until the category itself died." },
    { title: "Deterministic networking's champion", detail: "Token Ring's token-passing gave predictable latency and graceful loading that shared Ethernet could not match - the engineering argument Madge carried, correctly, all the way to irrelevance." },
    { title: "The cautionary canon", detail: "ATM investment with zero return, an abandoned Ethernet hedge, a late wireless pivot - Madge's endgame is the textbook case its own founder later acknowledged: when a technology declines, merging or selling is the logical course. He kept it independent because it carried his name." },
  ],
  markets: [
    "Madge is the missing chapter of this section's hub wars: every other page tells the story from Ethernet's side. In the mid-1990s the outcome was genuinely uncertain - Token Ring owned the IBM-centric enterprise, and nowhere more than in markets like Brazil, where mainframe shops made the ring the incumbent Rodolfo's Cabletron fought against from 1996 to 2000.",
    "The trajectory of its own SEC numbers tells the whole tragedy: Token Ring was 65 percent of sales in 1996 and 81 percent by 1999 - not because the ring grew, but because everything else was sold or shut. The last consolidator of a vanishing market.",
  ],
  analyst: [
    "Per Madge's own SEC F-3 filings: Token Ring represented 65, 65, and 72 percent of net sales in 1996, 1997, and 1998, and 81 percent for the first nine months of 1999 - the concentration curve of a technology in terminal decline.",
    "The Register's 2003 verdict stands as the epitaph for the whole protocol war: Token Ring, though technically superior, became 'the Betamax of the networking world' - and Madge, its greatest independent champion, followed it down.",
  ],
  careerLink: {
    href: "/about/vendors/cabletron-enterasys",
    label: "Rodolfo fought the Token Ring versus Ethernet war from the other side - the Cabletron page",
  },
};
