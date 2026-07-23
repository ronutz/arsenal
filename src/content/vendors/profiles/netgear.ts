// ============================================================================
// NETGEAR - the company that put networking on the retail shelf. Knowledge-
// based, dates well-documented (2026-07-22): founded January 1996 by Patrick
// Lo with Mark Merrill, incubated as a Bay Networks subsidiary; passed
// through Nortel's 1998 acquisition of Bay; independence and NASDAQ IPO in
// 2003 (NTGR); defined the home/SMB retail category (blue metal switches,
// ReadyNAS, Nighthawk, Orbi mesh); Arlo cameras spun off via IPO in 2018.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const netgearProfile: VendorProfile = {
  slug: "netgear",
  foundings: [
    {
      company: "NETGEAR",
      year: 1996,
      place: "San Jose, California",
      founders: ["Patrick Lo", "Mark Merrill"],
      story:
        "Patrick Lo's pitch inside Bay Networks was heretical for 1996: networking should be a retail product - boxed, shelf-stable, installable by someone who has never heard of a subnet. NETGEAR launched as a Bay subsidiary to prove it, and the little blue metal switches became the first networking gear millions of people ever bought with their own money. The company outlived its parent's absorption into Nortel, reached independence and a NASDAQ listing in 2003, and spent the broadband decades as the default answer on the shelf: if a home or small office got connected, odds were a NETGEAR box was involved.",
      sourceNote:
        "Founding as a Bay Networks subsidiary and the 2003 NASDAQ IPO (NTGR) per the standard corporate record; the Nortel interlude follows Bay's 1998 acquisition.",
    },
  ],
  timeline: [
    { year: 1996, title: "Born inside Bay", detail: "NETGEAR launches as a Bay Networks subsidiary with a retail thesis: networking as a consumer product, sold in boxes, supported like an appliance." },
    { year: 1998, title: "The Nortel interlude", detail: "Nortel's acquisition of Bay Networks carries NETGEAR along; the retail brand keeps building its channel while its parent integrates." },
    { year: 2003, title: "Independence and IPO", detail: "NETGEAR lists on NASDAQ as NTGR - a standalone company just as home broadband and Wi-Fi demand explodes." },
    { year: 2009, title: "The SMB ladder", detail: "ProSafe switching, ReadyNAS storage, and small-business wireless make NETGEAR the step-up brand between consumer gear and enterprise pricing." },
    { year: 2013, title: "Nighthawk", detail: "The Nighthawk router line turns performance Wi-Fi into a consumer category with an identity - the router as an object people choose, not just accept." },
    { year: 2016, title: "Orbi and the mesh era", detail: "Orbi rides the whole-home mesh wave, keeping NETGEAR at the front of the consumer Wi-Fi transition it helped create." },
    { year: 2018, title: "Arlo spins off", detail: "The Arlo camera business IPOs as a separate company - NETGEAR returns focus to the networking core." },
  ],
  products: [
    { name: "Blue metal unmanaged switches", what: "The five- and eight-port desktop switches that made 'just add ports' a retail purchase - arguably the most-handled networking product of the 2000s." },
    { name: "Nighthawk / Orbi", what: "Performance routers and whole-home mesh - the consumer Wi-Fi flagships." },
    { name: "ProSafe / ReadyNAS / Insight", what: "The SMB tier: managed switching, network storage, and cloud-managed networking without enterprise pricing." },
  ],
  innovations: [
    { title: "Networking as retail", detail: "NETGEAR's real invention was the category: packaging, channel, warranty, and design language that let networking sell next to printers. Every consumer networking brand since operates in the space it opened." },
  ],
  markets: [
    "Consumer and SMB networking worldwide - routers, mesh, switching, and cloud-managed small networks - competing with TP-Link, ASUS, Ubiquiti, and the ISP-supplied gateway.",
  ],
  analyst: [
    "Placed among the contemporaries as the retail-category creator with pioneer bloodlines: born of Bay Networks, surviving Nortel, and still defining what home networking looks like on a shelf.",
  ],
};
