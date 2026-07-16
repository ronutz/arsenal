// ============================================================================
// THE ACCESS & HOME FLEET - Netgear, TP-Link, Zyxel, Asus & Askey, Allied
// Telesis, consolidated per the roster (C4): the CPE/SOHO layer everyone
// actually touches. Knowledge-based, dates well-documented (2026-07-17):
// Allied Telesis founded 1987 Tokyo (Takayoshi Oshima; Allied Telesyn until
// 2006). Zyxel founded 1989 Hsinchu (Shun-I Chu); U-1496 modem; DSL-era
// Prestige; Nebula/USG present. ASUS founded 1989 Taipei by four ex-Acer
// engineers (Tung, Hsu, Hsieh, Liao); Askey (1989) an ASUS Group ODM for
// carrier CPE; the RT-series/Merlin community. Netgear founded January 1996
// inside Bay Networks by Patrick Lo; independent, IPO 2003; Orbi 2016;
// Arlo spun off 2018. TP-Link founded 1996 Shenzhen by brothers Zhao
// Jianjun and Zhao Jiaxing ("twisted pair link"); #1 consumer WLAN vendor
// by shipments for over a decade per IDC; Omada/Deco; 2024 US corporate
// split (TP-Link Systems, Irvine CA) amid reported US government scrutiny -
// stated as reported, no determination, with sourceNote.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const accessHomeFleetProfile: VendorProfile = {
  slug: "access-home-fleet",
  foundings: [
    {
      company: "Allied Telesis (founded as Allied Telesyn)",
      year: 1987,
      place: "Tokyo, Japan",
      founders: ["Takayoshi Oshima"],
      story:
        "The quietest company in this entry has been shipping access networks the longest. Takayoshi Oshima's Allied Telesyn (renamed Allied Telesis in 2006) built the unglamorous layer: media converters bridging fiber and copper, reliable access switches, and the kind of gear governments, hospitals, and industrial plants standardize on and then forget about for a decade - which is, in access networking, the highest compliment available.",
    },
    {
      company: "Zyxel Communications",
      year: 1989,
      place: "Hsinchu, Taiwan",
      founders: ["Shun-I Chu"],
      story:
        "Zyxel earned its name in the modem wars - the U-1496 was the connoisseur's 14.4k box of the early nineties BBS era - and then rode the DSL transition harder than almost anyone: Prestige routers sat at the end of phone lines on every continent as the last mile went broadband. The company that began by making dial-up sing now sells cloud-managed networking (Nebula) and security gateways, one of the few CPE names with an unbroken line from the acoustic era to the present.",
    },
    {
      company: "ASUS - and Askey, its carrier-side shadow",
      year: 1989,
      place: "Taipei, Taiwan",
      founders: ["T.H. Tung", "Ted Hsu", "Wayne Hsieh", "M.T. Liao"],
      story:
        "Four former Acer engineers founded ASUS as a motherboard house and built it into a PC-industry pillar; its router line became something rarer - the enthusiast's default, with the RT-series earning a devoted third-party firmware community (the Merlin builds) that treats a home router as a platform. The less visible half of the story is Askey (founded 1989, an ASUS Group company): the ODM whose gateways and set-top CPE ship by the million under carriers' own logos - the same engineering lineage, one badge you chose and one you didn't.",
    },
    {
      company: "Netgear",
      year: 1996,
      place: "San Jose, California (founded inside Bay Networks)",
      founders: ["Patrick Lo"],
      story:
        "Netgear began in January 1996 as Patrick Lo's bet, incubated inside Bay Networks, that the networking giants were ignoring homes and small offices - and the little blue metal unmanaged switches that followed became the most recognizable objects in the category, wired into closets and desks across the planet. Independent of its parent and public by 2003, Netgear kept naming the consumer eras: Nighthawk for the gamer-router age, Orbi (2016) for mesh, and Arlo - spun off in 2018 - for the camera-on-the-porch age it accidentally started.",
    },
    {
      company: "TP-Link",
      year: 1996,
      place: "Shenzhen, China",
      founders: ["Zhao Jianjun (Cliff Chao)", "Zhao Jiaxing"],
      story:
        "Two brothers named their company after the twisted-pair link and then executed the simplest strategy in the industry to the fullest: make the box good enough, make it astonishingly cheap, and make all of them. TP-Link has been the world's number-one consumer Wi-Fi vendor by shipments for over a decade of consecutive quarters - the statistical default router of Earth - while Omada built its business line and Deco carried it into mesh. Scale that large eventually becomes geopolitics: in 2024 the company split its corporate structure, with TP-Link Systems headquartered in Irvine, California, amid reported US government scrutiny of the brand's market position and security posture.",
    },
  ],
  timeline: [
    { year: 1992, title: "The modem connoisseur's choice", detail: "Zyxel's U-1496 becomes the BBS era's aspirational modem - DSP-based, firmware-upgradable, faster in practice than its rating - the first hint that a Taiwanese CPE maker could out-engineer the household names." },
    { year: 1996, title: "Two defaults are founded", detail: "Netgear (inside Bay Networks) and TP-Link (in Shenzhen) start the same year, aimed at the same neglected buyer from opposite ends of the supply chain - and between them will end up on more desks and shelves than every other vendor in this encyclopedia combined." },
    { year: 2003, title: "Netgear stands alone", detail: "Public on NASDAQ and free of its incubator's fate (Bay Networks had vanished into Nortel), Netgear becomes the reference independent consumer-networking company of the broadband decade." },
    { year: 2011, title: "The shipment crown", detail: "TP-Link reaches the top of IDC's consumer WLAN shipment rankings - and then simply stays there, quarter after quarter, for more than a decade: the least contested number-one position in networking.", sourceNote: "IDC consumer WLAN shipment rankings, sustained from the early 2010s onward." },
    { year: 2016, title: "Mesh goes mainstream", detail: "Netgear's Orbi and TP-Link's Deco make whole-home mesh a retail category; the single blinking router in the hallway closet becomes a constellation." },
    { year: 2018, title: "Arlo spins off", detail: "Netgear IPOs its camera business as Arlo - the accidental smart-home division becomes its own public company, a reminder that the home gateway is a beachhead, not an endpoint." },
    { year: 2024, title: "Scale meets geopolitics", detail: "TP-Link restructures - TP-Link Systems, headquartered in Irvine, California, corporately separated from the Shenzhen origin - amid reported US investigations into the brand. As of this writing that scrutiny is reported, not adjudicated; it is recorded here as the open question it is.", sourceNote: "US corporate split and reported Commerce/Justice scrutiny per late-2024 public reporting; no determination as of this writing." },
  ],
  products: [
    { name: "The unmanaged switch and the home router", what: "The blue metal Netgear box, the TP-Link WR841 and its million descendants, the Zyxel DSL gateway - the devices that put 'networking' in ordinary rooms." },
    { name: "The enthusiast platform", what: "ASUS RT-series routers and the Merlin firmware community - proof that home CPE can sustain a real software ecosystem." },
    { name: "The invisible fleet", what: "Askey's carrier gateways and Allied Telesis's access switches and media converters - the gear that ships under other names or no fanfare at all, and quietly outnumbers everything." },
  ],
  innovations: [
    { title: "Good enough, everywhere", detail: "This tier's contribution is not a protocol - it is the discipline of hitting the price point where networking becomes a default household object. Ubiquity is a feature, and these companies engineered it." },
    { title: "The home as a managed network", detail: "Mesh systems, cloud dashboards (Nebula, Omada), and app-first setup imported enterprise ideas - controllers, telemetry, zero-touch provisioning - into apartments, a decade after the enterprise paid ten times more for them." },
  ],
  markets: [
    "The access edge of everything: homes, small offices, carrier CPE, campus access, industrial sites. Statistically, the first hop of most packets on Earth belongs to a company in this entry - and the first router anyone in this profession ever configured probably did too.",
  ],
  analyst: [
    "The SOHO fleet is where the industry's ideas either become universal or stay niche: Wi-Fi generations, mesh, cloud management, and WPA transitions all prove themselves here, at scale, on hardware bought for the price of a dinner.",
    "It is also the industry's largest attack surface - default credentials, abandoned firmware, and botnet recruitment happen at this tier - which is why the hardening and fingerprinting material on this site keeps circling back to the humble home gateway.",
  ],
};
