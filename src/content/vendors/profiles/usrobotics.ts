// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - Academic Kids encyclopedia: USR sold modems to BBS SYSOPS AT A SIGNIFICANT
//     DISCOUNT, and the Courier Dual Standard's draw was speaking both HST and
//     v.32 so it worked with any caller's modem without dropping to 2400;
//     USR eventually unseated Hayes as market leader
//   - Wikipedia (USRobotics, Paul Collard): founders Casey Cowell, Paul
//     Collard, Stephen Muka, Stan Metcalf and Tom Rossen, several from the
//     University of Chicago; Collard designed the modems until the mid-1980s
//     and left in 1987; the name honours Asimov's U.S. Robots and Mechanical
//     Men because in his fiction it became "the greatest company in the known
//     galaxy"; USR APPEARED IN THE 2004 FILM I, ROBOT AS THE FICTIONAL COMPANY
//   - Chicago Encyclopedia: first commercial modem at 0.3 kbit/s
//   - FundingUniverse: over a quarter of the North American modem market by
//     1996 with earnings up 158%; Megahertz, ISDN Systems and Palm all acquired
//     in 1995
//
// *** BODY READ AFTER DRAFTING. The body has the shared motherboard, the AT
// command unlocking HST, V.Everything as a field-upgradeable DSP, the
// proprietary-then-standard pattern all three times, the explicit contrast with
// this site's neutrality thread, and the CompuServe bug. What it does NOT
// explain is WHY HST spread - the commercial mechanism - which is what this
// adds. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const usroboticsProfile: VendorProfile = {
  slug: "usrobotics",
  foundings: [
    {
      company: "U.S. Robotics",
      year: 1976,
      place: "Chicago, then Skokie, Illinois",
      founders: ["Casey Cowell", "Paul Collard", "Stephen Muka", "Stan Metcalf", "Tom Rossen"],
      story:
        "Several of them came out of the University of Chicago, where Collard had been working at the Computation Center; he had an applied physics degree from Sussex and designed the modems into the mid-eighties. Cowell had finished an economics degree the year before and ran the company for most of its life. The first product communicated at three hundred bits a second.",
      sourceNote:
        "The company was named after Asimov's fictional U.S. Robots and Mechanical Men, on the stated reasoning that in his stories it became the greatest company in the known galaxy. In 2004 the real company appeared in the film of I, Robot playing the fictional one.",
    },
  ],
  timeline: [
    { year: 1979, title: "The first modem", detail: "Three hundred bits per second, which was competitive." },
    { year: 1996, title: "A quarter of the market", detail: "More than a quarter of North American modem sales, with earnings up 158% in a year - and Hayes, which had defined the category and its command language, displaced as the leader." },
  ],
  products: [
    { name: "Courier", what: "The professional line: rugged, remotely diagnosable, and bought by the people whose modems answered calls all day." },
    { name: "Courier Dual Standard", what: "The one that mattered commercially. It spoke both HST and the v.32 standard, so a caller with any manufacturer's modem connected at full speed rather than falling back to 2400 bits per second. It made a proprietary protocol safe to deploy." },
    { name: "Sportster", what: "The consumer line, and the volume business - the modem a very large number of people first connected to the internet with." },
    { name: "Palm", what: "Acquired in 1995 along with Megahertz and ISDN Systems, and by some distance the most valuable thing the company ever bought." },
  ],
  innovations: [
    {
      title: "Subsidising the hub to sell the spokes",
      detail:
        "USR sold modems to bulletin board operators at a substantial discount. That is the mechanism behind everything else: a sysop with a discounted Courier gave every caller a reason to buy a USR modem, because HST speeds were only available if both ends had one. Discounting to one side of a market to create demand on the other is standard practice now and was an unusual thing to understand in the late eighties.",
    },
    {
      title: "Making the proprietary protocol safe to adopt",
      detail:
        "The Dual Standard is the reason the strategy worked rather than backfiring. A modem that only spoke HST would have been a gamble; one that spoke HST and the standard was strictly better than a standards-only modem, so there was no risk in buying it. The proprietary advantage was offered as an addition rather than as a substitution.",
    },
    {
      title: "Displacing the company that wrote the command language",
      detail:
        "Hayes defined the modem category so thoroughly that its command set is still called the Hayes command set and still begins every line with AT. Being overtaken by a competitor whose products speak your own language is an unusual way to lose a market, and it happened because reliability and speed turned out to matter more than authorship.",
    },
    {
      title: "Buying the thing that outlived the business",
      detail:
        "Palm was one of three acquisitions in a single year and the only one anybody remembers. A modem company bought a handheld computer company, and the handheld business went on to define a product category while the modem business was made obsolete by broadband.",
    },
  ],
  markets: [
    "Bulletin board operators first, then consumers in enormous numbers during the years when getting online meant dialling, and businesses buying remote access equipment. Revenue reached roughly $2B before the 3Com acquisition.",
    "The market it dominated no longer exists in that form. What remains of the brand sells connectivity equipment for industrial and remote management use, where a dial-up or cellular link to something in a field is still the practical answer.",
  ],
  analyst: [
    "The company's commercial record is best read as a case of correctly-timed proprietary advantage: three attempts, one clear success, and a willingness to abandon each position the moment a standard made it indefensible.",
    "The organisation outlived the company that acquired it. 3Com was itself absorbed, while the USRobotics name was spun back out, passed through a management buyout, and still trades - which is an unusual afterlife for a brand whose defining product category was eliminated by the technology that replaced it.",
  ],
};
