// ============================================================================
// src/content/vendors/partners.ts
// ----------------------------------------------------------------------------
// PARTNER & OTHER-VENDOR DATA - drives the non-career vendor pages linked from
// the Vendors index. Three groups:
//
//   group: "redu"  -> vendors Red Education is an AUTHORIZED training partner
//                     for, but that Rodolfo does NOT personally deliver. These
//                     pages carry a clear disclaimer (he doesn't teach it; Red
//                     Education's award-winning team does) plus verified award
//                     facts.
//   group: "other" -> vendors from Rodolfo's career-era lineage that map onto a
//                     current company via their IP, founders, or key people.
//                     Corporate-history pages, no training claim of any kind.
//
// ACCURACY GUARDRAILS (verified 2026-07-14 against primary sources):
//   - Rodolfo's OWN authorized-instructor vendors are ONLY F5, Fortinet,
//     Netskope, Extreme Networks. NONE of the vendors in this file are ones he
//     delivers training for - the redu pages say so explicitly.
//   - Red Education does NOT deliver HPE / Aruba / Juniper training. Those live
//     in the "other" group as corporate-lineage entries only, with no Red
//     Education association implied.
//   - Every acquisition/ownership fact must be cross-checked before it ships;
//     entries here were verified against company sites, SEC filings, and
//     reputable press. Pages for unverified vendors are omitted until checked.
// ============================================================================

export interface PartnerVendor {
  slug: string;
  group: "redu" | "other" | "contemporary";
  /** Display name (current company for "other", the vendor for "redu"). */
  name: string;
  /** Year the story on this card BEGINS - the founding of the earliest company
   *  it covers. Used to order the lineage timeline (PRIME 2026-07-27), which
   *  replaced a "contemporaries" vs "other vendors" split that did not survive
   *  contact with the facts: several vendors in "other" are demonstrably still
   *  trading. A founding year is a fact rather than a judgement, so ordering by
   *  it removes the need to categorise at all.
   *  On combined-lineage cards this is the EARLIEST company in the story, which
   *  is the one the card opens with. */
  founded?: number;
  /** Set only where the company on this card stopped existing independently -
   *  absorbed, renamed away, or wound up. LEFT UNSET where that has not
   *  happened or is not stated plainly in the profile's own sourced timeline;
   *  an absent marker correctly reads as "still trading".
   *  Deliberately NOT auto-extracted: a first attempt to derive these from the
   *  timelines produced roughly thirty wrong answers out of forty-eight,
   *  because prose cannot be pattern-matched for direction - "IBM acquires Red
   *  Hat" and "Red Hat acquired by IBM" look identical to a regex, and a
   *  divestiture looks like an ending. Populated by review, in batches. */
  ended?: { year: number; note: string };
  /** One-line positioning shown on the card and hero. */
  tagline: string;
  /** Longer intro paragraph on the page. */
  intro: string;
  /** For "redu": what Red Education delivers + award proof. For "other": the lineage story. */
  body: string[];
  /** Optional verified awards/recognitions (redu group). */
  awards?: string[];
  /** Optional external link (vendor training page / company page). */
  externalUrl?: string;
  /** Optional label for the external link. */
  externalLabel?: string;
  /** Source list for provenance. */
  sources?: { label: string; url: string }[];
  /**
   * Acquisitions this company made, with the acquisitions THEIR targets had
   * made nested beneath.
   *
   * Added 2026-07-29 (PRIME). The nested-acquisition rule was established for
   * the vendor LINEAGE pages and has been in use there since - Extreme carries
   * seven sub-entries, Fortinet three, and so on. Profile pages had no
   * acquisitions FIELD at all, so the same facts were being written as prose:
   * true and sourced, but not data, and therefore not renderable as the
   * indented lists the lineage pages use and not checkable by anything.
   *
   * Same shape as `Acquisition` in the lineage files deliberately, so the two
   * page types stay consistent and a reader meets one idea rather than two.
   */
  /**
   * Slug of the career chapter at /about/vendors/<slug>, when PRIME worked
   * with this company directly.
   *
   * Added 2026-07-29 (PRIME step 4). The company history and the career
   * chapter are now separate pages; this is the link BACK from the company to
   * the person, so a reader of the history can find out that somebody here
   * actually ran the thing, without the history itself turning into memoir.
   */
  careerChapter?: { slug: string; years: string };

  acquisitions?: {
    year: number;
    name: string;
    price?: string;
    what: string;
    became?: string;
    founder?: string;
    sourceNote?: string;
    /** What the acquired company had itself acquired. One level, by design. */
    subAcquisitions?: {
      year: number;
      name: string;
      price?: string;
      what: string;
      founder?: string;
    }[];
  }[];
  /** Optional accuracy note rendered as an aside (e.g. training-delivery facts). */
  note?: string;
}

// Verified Red Education award facts, reused across redu pages (2026-07-14).
const REDU_AWARDS_GENERAL = [
  "Cybersecurity Excellence Awards 2025 - Best Cybersecurity Education Provider",
  "Cybersecurity Excellence Awards 2025 - Best Cybersecurity Certification Training",
  "Cybersecurity Excellence Awards 2025 - Cybersecurity Instructor Team of the Year",
  "100,000+ students trained across 132 countries; 4.9-star average from 5,000+ reviews",
];

const REDU_SOURCES = [
  { label: "Red Education - vendor training pages", url: "https://www.rededucation.com/" },
  { label: "Red Education - awards", url: "https://www.rededucation.com/news/" },
];

export const partnerVendors: PartnerVendor[] = [
  // ---- GROUP: Red Education training partners (Rodolfo does NOT teach these) ----
  {
    slug: "nutanix",
    group: "redu",
    name: "Nutanix",
    founded: 2009,
    tagline: "Hybrid multicloud and hyper-converged infrastructure.",
    intro:
      "Nutanix builds the hybrid multicloud platform that runs and manages applications and data across private and public clouds, built on hyper-converged infrastructure.",
    body: [
      "Red Education is a Nutanix Authorised Training Partner, recognised by Nutanix as Highest Quality and Top Performing Authorized Training Partner of the Year, with a 98% customer-satisfaction rating on its Nutanix courses.",
    ],
    awards: [
      "Nutanix Highest Quality and Top Performing Authorized Training Partner of the Year",
      ...REDU_AWARDS_GENERAL,
    ],
    externalUrl: "https://www.rededucation.com/nutanix/",
    externalLabel: "Nutanix training at Red Education",
    sources: [
      { label: "Red Education - Nutanix (ATP, 98% CSAT)", url: "https://www.rededucation.com/nutanix/" },
      ...REDU_SOURCES,
    ],
  },
  {
    // OPENAI - added 2026-07-28 (PRIME: "OpenAI and Anthropic on the
    // timeline"). The anchor for the generative-AI marker: ChatGPT's launch is
    // the moment the technology stopped being a research subject and became
    // something anyone could use.
    // Verified 2026-07-28. Note the founding-date sources differ by three days
    // (8 vs 11 December 2015); the 11th is the public announcement and is used.
    slug: "openai",
    group: "contemporary",
    name: "OpenAI",
    founded: 2015,
    tagline: "Founded as a non-profit hedge against AI being controlled by one company, and now largely owned by one company.",
    intro:
      "OpenAI was announced on 11 December 2015 as a non-profit, with $1B in pledged funding and a stated mission to build artificial general intelligence that benefits all of humanity - and to build it in the open rather than behind a single corporation's walls. The non-profit structure was the point: a deliberate hedge against the technology ending up controlled by Google, Microsoft or anyone else.",
    body: [
      "The founding group included Sam Altman, Greg Brockman, Elon Musk, Ilya Sutskever, Wojciech Zaremba and John Schulman. Schulman led the reinforcement-learning-from-human-feedback work that later made ChatGPT feel like a conversation rather than a text generator.",
      "The structure did not hold. OpenAI restructured as a capped-profit partnership in 2019 and converted to a public benefit corporation in 2025. Microsoft holds roughly 27% of the new entity - about $135B at the March 2026 round - and the non-profit retained 26%. Critics including several former employees argued the conversion reduced the non-profit's practical control over what the company does with what it builds. Whatever one makes of that, it is a striking distance travelled from the founding premise.",
      "ChatGPT launched on 30 November 2022 and was not the original product plan. It reached a million users in five days and a hundred million monthly users in two months, the fastest consumer adoption of anything to that point.",
      "That date is the marker worth having. Large language models existed before it and had been improving for years; what changed was that using one stopped requiring an API key, a research affiliation, or any idea of what a transformer is. The technology did not become capable in November 2022. It became available.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/OpenAI",
    externalLabel: "OpenAI",
    sources: [
      { label: "Grokipedia: OpenAI - founding date and founders", url: "https://grokipedia.com/page/OpenAI" },
      { label: "Who created ChatGPT - the 30 November 2022 launch, adoption figures, Microsoft stake", url: "https://felloai.com/who-created-chatgpt/" },
      { label: "OpenAI and Anthropic funding history - the capped-profit and PBC restructurings", url: "https://pinggy.io/blog/openai_anthropic_funding_history/" },
    ],
  },
  {
    // ANTHROPIC - added 2026-07-28 (PRIME).
    // NOTE FOR ANY FUTURE EDITOR: this site is authored with Claude, which
    // Anthropic makes. That is a reason to hold this entry to a HIGHER
    // standard than the others, not a lower one - so the unflattering facts
    // are here (the Alameda Research money, the founder-count discrepancy in
    // the sources) and the copy states what the company IS rather than
    // advertising it. If this entry ever reads like promotion, it is wrong.
    slug: "anthropic",
    group: "contemporary",
    name: "Anthropic",
    founded: 2021,
    tagline: "Founded by people who left OpenAI over where it was going, and built around the bet that safety research and frontier capability have to happen in the same building.",
    intro:
      "Anthropic was incorporated in January 2021 by senior people who had just left OpenAI, principally the siblings Dario Amodei - OpenAI's VP of Research - and Daniela Amodei, its VP of Safety and Policy. The stated reason for leaving was directional disagreement, specifically over OpenAI's 2019 arrangements with Microsoft.",
      body: [
      "The other founders named in the record are Jared Kaplan, Jack Clark, Chris Olah, Ben Mann, Sam McCandlish and Tom Brown. Sources describe the group as seven former OpenAI employees while listing eight names including the Amodeis; the discrepancy is in the sources and is left visible rather than resolved by picking one.",
      "The premise is a specific technical claim rather than a slogan: that you cannot do useful safety research on systems you are not building, because the problems only appear at the frontier. Dario Amodei had co-authored 'Concrete Problems in AI Safety' in 2016, which set out failure modes - side effects, unsafe exploration - that were theoretical then and are engineering concerns now.",
      "The funding history includes a fact the company would presumably rather not carry: of the $580M Series B in April 2022, roughly $500M came from Alameda Research, the trading firm affiliated with Sam Bankman-Fried, months before its collapse. That is in the public record and belongs in any honest account of how the company was capitalised.",
      "It is structured as a public benefit corporation with a governance trust, and its products are the Claude models. It is included on this timeline because the generative-AI era is not a single company's story, and because a site that teaches people to check their sources should name the one it was built with.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Anthropic",
    externalLabel: "Anthropic",
    sources: [
      { label: "Wikipedia: Anthropic - January 2021 incorporation, founders, structure", url: "https://en.wikipedia.org/wiki/Anthropic" },
      { label: "Contrary Research: Anthropic founding story and the OpenAI roles the founders held", url: "https://research.contrary.com/company/anthropic" },
      { label: "OpenAI and Anthropic funding history - the Series A and Series B figures", url: "https://pinggy.io/blog/openai_anthropic_funding_history/" },
    ],
  },
  {
    // GOOGLE - added 2026-07-28 (PRIME: "mark the beginning of Google Search").
    // Placed here rather than as a general Google entry: the marker asked for
    // is the SEARCH ENGINE's beginning, which is why the founding year is the
    // company's and the story stops at the point search was won.
    // The AltaVista connection is the reason both entries exist: in 1998 Page
    // and Brin tried to SELL PageRank to AltaVista for $1M and were turned
    // down. Verified 2026-07-28.
    slug: "google-search",
    group: "contemporary",
    name: "Google",
    founded: 1998,
    tagline: "Ranked pages by who linked to them rather than how often they said the word - and was nearly sold to AltaVista for a million dollars.",
    intro:
      "Larry Page and Sergey Brin met at Stanford in 1995 and began a research project in January 1996 called BackRub, which analysed which pages linked to which. The insight was that a link is a vote, and that votes from well-linked pages should count for more. They called the resulting algorithm PageRank.",
    body: [
      "Search engines at the time largely ranked results by how often a search term appeared on a page, which is trivially easy to game and was being gamed heavily. PageRank measured something a page's own author does not control: who else thought it was worth linking to.",
      "In 1998 Page and Brin tried to sell PageRank to AltaVista for $1M, intending to go back to their studies. AltaVista did not buy it. They registered google.com on 15 September 1997 - the name a misspelling of googol, the digit one followed by a hundred zeros - and incorporated Google Inc. on 4 September 1998 in a friend's garage in Menlo Park.",
      "The first cheque came from Andy Bechtolsheim, a co-founder of Sun Microsystems, followed by $25M from Kleiner Perkins and Sequoia in 1999. The IPO in 2004 raised $1.67B.",
      "The homepage was deliberately bare while every competitor was becoming a portal. That was partly conviction and partly circumstance - neither founder was much of an HTML author - but it landed at exactly the moment AltaVista and its peers were adding shopping, email and news to the front page of a search engine.",
      "A footnote worth keeping: RankDex, built by Robin Li in 1996, was exploring link-based ranking on a similar timeline. Li patented that work and later founded Baidu. PageRank was not the only idea of its kind; it was the one that got built into a company that wanted to be a search engine.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/History_of_Google",
    externalLabel: "History of Google",
    sources: [
      { label: "EBSCO Research Starters: Google is founded - the AltaVista offer and the PageRank origin", url: "https://www.ebsco.com/research-starters/history/google-founded" },
      { label: "History of Google - domain registration, incorporation date, BackRub, RankDex", url: "https://google.fandom.com/wiki/History_of_Google" },
    ],
  },
  {
    // SIXDEGREES - added 2026-07-28 (PRIME: "mark the beginning of social
    // media"). A company with a real founding year, so it earns a timeline
    // entry where a general "social media begins" marker would not: the
    // timeline orders by founding, and an era has no founding year.
    // It also ENDED, so it uses the `ended` field.
    slug: "sixdegrees",
    group: "other",
    name: "SixDegrees.com",
    founded: 1996,
    ended: {
      year: 2001,
      note: "Sold to YouthStream Media Networks in December 2000 and shut down the following year.",
    },
    tagline: "The first social network, and it failed because not enough people were online yet.",
    intro:
      "SixDegrees.com is widely recognised as the first social networking site: the first to combine a user profile, a visible friends list, and the ability to browse other people's connections. Andrew Weinreich founded it in May 1996 and launched it in 1997, naming it after the six-degrees-of-separation idea.",
    body: [
      "The features are unremarkable now because everything copied them. Users could create a profile, list friends and family, invite people who were not yet members, send messages, and post to people in their first, second and third degrees - and, unusually, see how they were connected to any other member.",
      "Weinreich filed the first patent on social networking, 'Method and apparatus for constructing a networking database and system', which is generally known as the Six Degrees patent.",
      "It reached around 3.5 million users, which sounds like success and was not enough. The problem was structural: a social network is only useful if the people you know are on it, and in the late 1990s most people were not online at all. Millions of users spread across a world that was barely connected produced little engagement.",
      "It was sold to YouthStream Media Networks in December 2000 and shut down in 2001 - three years before Facebook. The idea was correct and the infrastructure had not arrived, which is a different kind of failure from AltaVista's and worth keeping alongside it.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/SixDegrees.com",
    externalLabel: "SixDegrees.com",
    sources: [
      { label: "SixDegrees.com - the first recognised social media platform, founded by Andrew Weinreich", url: "https://medium.com/@emijones/sixdegrees-com-the-start-of-social-media-86e287d46e9e" },
      { label: "Evolution of social media - founding May 1996, launch 1997, 3.5M users, sale to YouthStream", url: "https://www.studocu.com/ph/document/technological-university-of-the-philippines/bachelor-of-science-in-civil-engineering/evolution-of-social-media/5477563" },
    ],
  },
  {
    // GENESYS - added 2026-07-30 (PRIME, who confirmed genesys.com rather than
    // any other "Genesis"). Closes TWO loops on this site:
    //   * Miloslavsky worked for Steve Jobs at PIXAR - and the Apple entry
    //     records Jobs buying Lucasfilm's graphics division and renaming it
    //   * Alcatel-Lucent, which owned Genesys for twelve years, is also where
    //     RIVERSTONE's assets ended up - and Riverstone is a career chapter
    //
    // DATE DISCREPANCY RECORDED: the Alcatel acquisition is given as 1999 by
    // several sources and January 2000 by others; that is almost certainly
    // announcement versus completion, and both are stated.
    slug: "genesys",
    group: "other",
    name: "Genesys",
    founded: 1990,
    tagline: "Two sons of Soviet emigres met at a card game and decided the phone call and the customer record should arrive together.",
    intro:
      "Genesys Telecommunications Laboratories was founded in October 1990 by Gregory Shenkman and Alec Miloslavsky. Their parents had fled the Soviet Union in 1980 and settled in the Russian community in San Francisco; the two men met years later at a card game. The seed capital was $150,000 in loans from their families, and the first office was in Daly City.",
    body: [
      "Miloslavsky had studied civil engineering at Berkeley and worked for Steve Jobs at Pixar - which connects this page to the Apple entry on this timeline, where Jobs's purchase of Lucasfilm's computer graphics division is recorded. Shenkman had been a telecommunications salesman. Neither combination obviously produces a contact centre company.",
      "**The idea was small, precise and turned out to be enormous.** When a call arrived at a business in 1990, the telephone system knew the number and the computer system knew the customer, and the two never spoke to each other. So an agent answered, asked who you were, and typed it in - every time, for every call. Computer telephony integration joined those two systems, and the visible result was the screen pop: the phone rings and the customer's record is already open.",
      "Genesys shipped T-Server in 1991 to do that, and then went further than the pop - routing calls on skills rather than on whoever was free, which means the question stops being *is a person available* and becomes *is the right person available*. That reframing is the whole of modern contact-centre design, and the software sat as middleware between switches the customer already owned.",
      "It listed on NASDAQ in June 1997 as GCTI, raising $45M at $18 a share. **Alcatel then bought it for $1.5B**, announced in 1999 and completed in January 2000 depending on which source you read, and it disappeared into a telecommunications giant for twelve years.",
      "**Alcatel-Lucent is a second connection to this timeline.** Riverstone Networks, a career chapter on this site, had its assets bought by Lucent in 2006 and absorbed into Alcatel-Lucent when the two merged that year. So a metro Ethernet business from a Cabletron spin-off and a call-routing company from a Daly City garage ended up inside the same French-American parent by entirely different routes.",
      "**In February 2012 Permira and TCV bought Genesys out of Alcatel-Lucent for $1.5B** - the same figure Alcatel had paid twelve years earlier. A company can be worth exactly what it cost, a dozen years on, and that fact says more about who owned it than about what it built.",
      "Independence produced the cloud pivot the parent had not. Hellman & Friedman took a $900M stake in 2016 at a $3.8B valuation, Interactive Intelligence was bought the same year for $1.4B, and revenue passed $2B by 2022. The company that started by making a telephone talk to a database now describes itself in terms of orchestration and AI, which is the same problem restated: the interaction and the context about it should not arrive separately.",
    ],
    acquisitions: [
      { year: 2016, name: "Interactive Intelligence", price: "$1.4B", what: "A cloud contact-centre platform, bought the same year Hellman & Friedman took its stake.", became: "The basis of the cloud line that carried the company past $2B in revenue." },
      { year: 2018, name: "AltoCloud", what: "Customer journey analytics - predicting what a customer is trying to do before they say it." },
      { year: 2021, name: "Bold360", what: "Digital engagement, bought from LogMeIn.", became: "Part of the digital and AI-facing product set." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Genesys_(company)",
    externalLabel: "Genesys",
    sources: [
      { label: "Wikipedia: Genesys - founded October 1990 by Gregory Shenkman and Alec Miloslavsky, $150,000 in family loans as seed funding, the June 1997 NASDAQ IPO under GCTI, and the February 2012 Permira and TCV acquisition", url: "https://en.wikipedia.org/wiki/Genesys_(company)" },
      { label: "Martechvibe: the founders' parents leaving the Soviet Union in 1980, the two meeting at a card game, Miloslavsky's civil engineering at Berkeley and his work for Steve Jobs at Pixar, and Shenkman's telecoms sales background", url: "https://martechvibe.com/article/company-closeup-genesys-putting-customer-experience-on-top/" },
      { label: "Preqin: incorporation in October 1990, the June 1997 IPO raising $45M at $18 a share, Alcatel taking the company private in January 2000 for $1.5B, and the February 2012 sale to Permira and TCV for $1.5B", url: "https://www.preqin.com/data/profile/asset/genesys-cloud-services-inc-/66170" },
      { label: "Company history: incorporated 1 October 1990, the Daly City office, T-Server and the screen pop, and the name reflecting the genesis of intelligent communication software", url: "https://businessmodelcanvastemplate.com/blogs/brief-history/genesys-brief-history" },
      { label: "Ownership history: the Hellman & Friedman stake in 2016 at a $3.8B valuation and the ~$1.4B Interactive Intelligence acquisition", url: "https://businessmodelcanvastemplate.com/blogs/owners/genesys-who-owns" },
    ],
  },
  {
    // FREERADIUS - added 2026-07-30 (PRIME). The COUNTER-EXAMPLE to the
    // open-source thread already on this timeline: Tenable closed its project,
    // Rapid7 bought one, Elastic closed and reopened one - and this one simply
    // stayed open for twenty-six years and became infrastructure.
    //
    // DATE NOTE: sources give June 1999 and August 1999. They are describing
    // different events - founding and first public alpha - and both are stated.
    slug: "freeradius",
    group: "other",
    name: "FreeRADIUS",
    founded: 1999,
    tagline: "Authenticates about a third of the people on the internet, and has had the same project leader since 1999.",
    intro:
      "FreeRADIUS was founded in June 1999 by Miquel van Smoorenburg and Alan DeKok, with the first public alpha in August - which is why sources give both months. It was a fork of the Cistron RADIUS server, which van Smoorenburg had written himself and which had been widely adopted for a specific reason: the original RADIUS server had stopped being maintained.",
    body: [
      "**The protocol has a precise origin.** In 1991 Merit Network, a non-profit internet provider, needed to manage dial-in access across points of presence run by different organisations. It did not want to distribute usernames and passwords to every remote access server, so it wanted those servers to ask a central one and receive back a yes or a no. Livingston Enterprises built that, and called it Remote Authentication Dial-In User Service.",
      "Livingston is worth a paragraph of its own. Founded in 1986 by Ronald Willens and his son Steven in Pleasanton, California, financed by its founders and then by its own operating profits rather than venture capital, it made the **PortMaster** access server - which by the mid-1990s held something like two-thirds of the ISP market and served over two thousand providers. It had ninety employees. **Lucent acquired it in 1997**, and the RADIUS server it had given away stopped being maintained.",
      "That is the gap Cistron filled, and then FreeRADIUS forked Cistron. So the software authenticating a large fraction of the internet today descends, by two forks, from a program written to solve one non-profit's dial-up problem in 1991.",
      "**The numbers are the part people do not believe.** A survey in November 2006 with over five hundred respondents put daily usage at around a hundred million people - roughly a third of global internet access at the time. More than fifty thousand sites run it, from installations with ten users to ones with over ten million. It underpins **eduroam**, the roaming authentication network used across universities worldwide. If you have ever connected to campus wireless anywhere in Europe, this is what said yes.",
      "It supports more authentication types than any other open-source RADIUS server, and was for a long time the only open-source one implementing EAP at all - which matters because EAP is what 802.1X wireless authentication runs on. Version 2.0.0 in 2008 added virtual servers, IPv6 and a policy language; 3.0.0 in 2013 added RadSec, carrying RADIUS over TLS, which fixed a protocol whose original transport security was a shared secret and MD5.",
      "**And here is why it belongs beside three other entries on this timeline.** Tenable closed its open-source scanner in 2005 to fund the company, and was forked. Rapid7 bought an open-source project and kept it open as a commercial differentiator. Elastic closed one, was forked, and reopened it three years later. **FreeRADIUS did none of that. It stayed open, and became the thing everyone else builds against.** Commercial support exists through a company built around it, which is a different arrangement from selling the software or restricting it.",
      "Alan DeKok has led the project since 1999 - twenty-six years, with a core team that accumulated slowly: Alexander Clouter in 2009, Arran Cudbard-Bell in 2012, Matthew Newton in 2016. **On a timeline mostly composed of acquisitions, rebrands and strategic exits, a piece of infrastructure quietly maintained by the same person for a quarter of a century is the genuinely unusual entry.**",
    ],
    externalUrl: "https://www.freeradius.org/about/",
    externalLabel: "The FreeRADIUS project",
    sources: [
      { label: "FreeRADIUS project: founded June 1999 by van Smoorenburg and DeKok, first alpha August 1999, 0.1 in May 2001, the November 2006 survey of 500+ respondents putting usage at ~100 million people and about a third of internet users, and 50,000+ sites", url: "https://www.freeradius.org/about/" },
      { label: "FreeRADIUS documentation: the fork from Cistron, which had been adopted after the Livingston server was no longer in service, and the modular design goal", url: "https://www.freeradius.org/documentation/freeradius-server/3.2.9/concepts/freeradius.html" },
      { label: "FreeRADIUS technical guide: RADIUS created by Livingston Enterprises in 1991 for Merit Network, and FreeRADIUS as the only open-source RADIUS server supporting EAP and virtual servers", url: "https://networkradius.com/doc/FreeRADIUS-Technical-Guide.pdf" },
      { label: "Grokipedia: version milestones - 1.0.0 on 17 July 2004, 2.0.0 on 10 January 2008 with virtual servers and IPv6, 3.0.0 on 7 October 2013 with RadSec; eduroam; DeKok leading since inception with Clouter (2009), Cudbard-Bell (2012) and Newton (2016)", url: "https://grokipedia.com/page/FreeRADIUS" },
      { label: "Grokipedia: Livingston Enterprises - founded 1986 by Ronald and Steven Willens in Pleasanton, funded by founders and operating profits rather than venture capital, PortMaster at roughly 67% of the ISP market and 2,200+ ISPs", url: "https://grokipedia.com/page/livingston_enterprises" },
      { label: "Wikipedia: Livingston Enterprises - acquired by Lucent Technologies in 1997; the original author of the RADIUS standard", url: "https://en.wikipedia.org/wiki/Livingston_Enterprises" },
    ],
  },
  {
    // HCL - added 2026-07-30 (PRIME). Completes the Notes chain: Lotus -> IBM
    // (1995) -> HCL (announced Dec 2018, completed 1 July 2019).
    //
    // TWO DISCREPANCIES RECORDED RATHER THAN RESOLVED:
    //   * FOUNDER COUNT: sources say six or eight, and the NAMES disagree -
    //     four are consistent everywhere, the rest are not.
    //   * ACQUISITION YEAR: 2018 and 2019 both appear; that is announcement
    //     versus completion and both are given with their meaning.
    slug: "hcl",
    group: "other",
    name: "HCLTech",
    founded: 1976,
    tagline: "Started because IBM left India, and forty-one years later bought IBM's software.",
    intro:
      "A group of engineers from Delhi Cloth & General Mills, led by Shiv Nadar, incorporated the company on 11 August 1976, renaming it that day from Microcomp Limited to Hindustan Computers Limited. They worked from a barsaati - a Delhi rooftop apartment - with about ₹1.83 lakh of capital, roughly $22,000 at the time, and funded the computers they actually wanted to build by selling teledigital calculators first.",
    body: [
      "**The context is the whole story.** India's foreign exchange regulations required multinationals to dilute equity to local shareholders, and IBM left the country rather than comply. That removed the dominant supplier from a market where there were, by one contemporary count, about 250 computers in the entire country. HCL was one of the companies that formed in the space this created.",
      "In 1978 it shipped an indigenously designed 8-bit microcomputer - the same year as Apple's early machines and three years before the IBM PC. A networking operating system and client-server architecture followed in 1983, and a fine-grained multiprocessor UNIX in 1988, which the company notes was three years ahead of Sun and HP.",
      "**In 1982 Nadar founded NIIT**, a computer training institute, on the reasoning that a domestic technology industry cannot grow faster than the supply of people who can staff it. That is a training business created as infrastructure for an industry rather than as a product, and it is the sort of decision that only looks obvious afterwards.",
      "The software services arm was spun out on 12 November 1991, initially as HCL Overseas Limited, becoming HCL Consulting in 1994 and HCL Technologies in 1999. It listed in January 2000, crossed $10B of revenue in 2021, and renamed itself HCLTech in 2022.",
      "**And then the reversal.** IBM announced the sale of Notes and Domino to HCL on 6 December 2018, and the wider transaction completed on 1 July 2019: seven software products - Notes and Domino, AppScan, BigFix, Commerce, Connections, Digital Experience, and Unica - for $1.8B, the largest acquisition by an Indian IT company at that point. Both years appear in sources because one is the announcement and the other the completion.",
      "So the company that exists partly because IBM withdrew from India in the 1970s now owns and develops software IBM bought Lotus for in 1995. **Lotus Notes has had three owners across four decades, and its current one was founded by people who started out selling calculators to fund a computer nobody else would sell them.**",
      "Two further notes worth recording. Roshni Nadar Malhotra succeeded her father as chair, becoming the first woman to chair a listed Indian IT company. And the founding roster itself is genuinely disputed: sources give six founders or eight, and while Shiv Nadar, Arjun Malhotra, Ajai Chowdhry and Yogesh Vaidya appear consistently, the remaining names differ between accounts. That disagreement is left visible here rather than resolved by picking the version that reads best.",
    ],
    acquisitions: [
      { year: 2019, name: "Seven IBM software products", price: "$1.8B", what: "Notes and Domino, AppScan, BigFix, Commerce, Connections, Digital Experience, and Unica. Announced 6 December 2018 and completed 1 July 2019; the largest acquisition by an Indian IT company at the time.", became: "HCL Software, and the reason Notes is still sold and supported today.",
        subAcquisitions: [ { year: 1995, name: "Lotus Development (already inside IBM)", price: "$3.5B", what: "IBM had bought Lotus in 1995 principally to obtain Notes. So this deal transferred, at roughly half the original price and twenty-four years later, the asset that had justified it.", founder: "Mitch Kapor and Jonathan Sachs, 1982" } ] },
      { year: 2018, name: "Actian", price: "$330M, with Sumeru Equity Partners", what: "Data management and analytics, including the Ingres database lineage. HCL America bought the remaining 19.6% in 2021 for $100.2M.", became: "The data and analytics division of HCL Software." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/HCLTech",
    externalLabel: "HCLTech",
    sources: [
      { label: "Wikipedia: HCLTech - founded 11 August 1976, the 1978 indigenous microcomputer, the 1983 networking OS and client-server work, the 12 November 1991 spin-off, and the product list", url: "https://en.wikipedia.org/wiki/HCLTech" },
      { label: "Companies History: the barsaati rooftop origin, roughly 250 computers in India at the time, the 1988 multiprocessor UNIX three years ahead of Sun and HP, and the $1.8B purchase of seven IBM products", url: "https://www.companieshistory.com/hcl-technologies/" },
      { label: "MatrixBCG: incorporation on 11 August 1976 with ₹1.83 lakh (about $22,000), the founders as DCM engineers, and IBM's exit under FERA creating the opening", url: "https://matrixbcg.com/blogs/brief-history/hcltech" },
      { label: "Bharatpedia: the 1 July 2019 completion and the full list of transferred products, plus an alternative founder roster", url: "https://en.bharatpedia.org/wiki/HCL_Technologies" },
      { label: "Business Today: the calculators sold to fund the computer, NIIT founded in 1982, and Roshni Nadar Malhotra as the first woman to chair a listed Indian IT firm - and an eight-founder account", url: "https://www.businesstoday.in/visualstories/corporates/time-travel-with-hcl-tech-heres-how-a-company-founded-by-shiv-nadar-led-group-of-8-engineers-became-one-of-indias-it-giants-check-hcl-tech-share-price-today-47782-09-07-2023" },
      { label: "Infinity Learn: the Microcomp Limited renaming on 11 August 1976, the Actian purchase, and the 2022 rename to HCLTech", url: "https://infinitylearn.com/surge/full-form/hcl-full-form/" },
    ],
  },
  {
    // LOTUS - added 2026-07-30 (PRIME), who noted that companies still run
    // Notes today. That is the entry's spine: software outliving three owners
    // and four decades.
    //
    // THREE LOOPS INTO EXISTING ENTRIES:
    //   * VisiCalc - named in the APPLE entry as the software that made the
    //     Apple II worth buying. Kapor came from its distributor, and Lotus
    //     later bought the company that WROTE it.
    //   * cc:Mail - the QUALYS entry records Philippe Courtot selling it to
    //     Lotus in 1991.
    //   * HCL - on PRIME's queue - has owned Notes and Domino since 2019.
    slug: "lotus",
    group: "other",
    name: "Lotus Development",
    founded: 1982,
    ended: {
      year: 1995,
      note: "Acquired by IBM for $3.5B, primarily to obtain Notes. The brand persisted for years afterwards, and the Notes and Domino products were sold on to HCL in a deal announced 6 December 2018 for $1.8B.",
    },
    tagline: "Forecast a million dollars in its first year, made fifty-three, and shipped software still running four decades later.",
    intro:
      "Mitch Kapor and Jonathan Sachs founded Lotus in April 1982 with backing from Ben Rosen. Kapor was 32 and had been head of development at VisiCorp, the distributor of VisiCalc, where he wrote VisiPlot and VisiTrend and was bought out of his rights for $1.7M. Sachs then spent ten months writing Lotus 1-2-3 in assembly language for the IBM PC.",
    body: [
      "1-2-3 shipped on 26 January 1983, and the name described three uses - spreadsheet, graphics, database - of which people overwhelmingly used the first. What made it win was less romantic than the name: it was fast, it recalculated quickly, and it was written to exploit machines with 256K of memory rather than the smaller ones its predecessor had targeted.",
      "**The numbers from that first year are worth stating in full.** The business plan forecast $1M of sales. Lotus did **$53M**, and was the world's third largest microcomputer software company by 1983. Very few companies on this timeline missed their own projection by a factor of fifty in the right direction.",
      "**Its predecessor is already on this site.** The Apple entry records VisiCalc as the software that made the Apple II worth buying - the first spreadsheet, and the reason a business would justify a personal computer at all. Kapor came from the company that distributed it and built the product that replaced it. Then in 1985 **Lotus acquired Software Arts, the company that actually wrote VisiCalc, and discontinued it.** The successor bought the predecessor and switched it off.",
      "Jim Manzi arrived in 1982 as a McKinsey consultant, became an employee four months later, president by October 1984, and chief executive in April 1986 when Kapor stepped down. He ran the company until it was sold.",
      "**And then the product that outlived everything else.** Lotus Notes came out of Ray Ozzie's Iris Associates, and it was not a spreadsheet, an email client or a database, but a thing built out of all three: replicated document stores that worked when disconnected, with application logic attached. That is an unusual design and it is exactly why it survived - organisations built their actual business processes inside it, and a business process is far harder to migrate than a file format.",
      "**IBM bought Lotus in 1995 for $3.5B**, primarily for Notes, and specifically to get into client-server computing as its own host-based OfficeVision was being made obsolete. Along the way Lotus had also acquired cc:Mail in 1991 - which appears on this timeline in the Qualys entry, because cc:Mail's founder Philippe Courtot went on to run Qualys for two decades.",
      "**On 6 December 2018 IBM announced the sale of Notes and Domino to HCL for $1.8B.** So the software has now had three owners across more than thirty years, and it is still sold, still supported, and still running the internal processes of organisations that built them in the 1990s and never found a reason expensive enough to justify leaving.",
      "That is the fact worth carrying away, and it contradicts how this industry usually talks about itself. **Most of the companies on this timeline were bought for a technology that was quietly retired within a few years. Lotus was bought for one that outlasted the buyer's interest, the buyer's strategy, and eventually the buyer.**",
      "Two footnotes about the founders, both good. Sachs left in 1985 to write photo-editing software and has been shipping it since 1994. Kapor dropped out of a master's degree at MIT Sloan in 1979 to go and start all this, and finished it in 2025 - forty-six years later.",
    ],
    acquisitions: [
      { year: 1985, name: "Software Arts", what: "The company that wrote VisiCalc, the first spreadsheet and the software that made the Apple II a business purchase.", became: "VisiCalc was discontinued. The product Lotus had beaten in the market was bought and switched off by the company that beat it." },
      { year: 1991, name: "cc:Mail", price: "reported around $50M", what: "The dominant corporate email platform of its era, at roughly 40% market share.", founder: "Philippe Courtot, 1988 - he later ran Qualys for twenty years, and appears on this timeline in his own right.", became: "Lotus's email business, later overtaken by Notes itself.", sourceNote: "The purchase figure is commonly reported rather than confirmed in this session's sources; treat it as approximate." },
      { year: 1994, name: "Iris Associates", what: "Ray Ozzie's company, which had developed Notes under contract to Lotus since the 1980s.", became: "Notes and later Domino - the products that survived two further owners and are still sold today." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Lotus_Software",
    externalLabel: "Lotus Software",
    sources: [
      { label: "Wikipedia: Lotus Software - founded 1982 by Kapor and Sachs with Ben Rosen's backing, Notes from Ray Ozzie's Iris Associates, IBM's $3.5B purchase in 1995 to displace OfficeVision, and the 6 December 2018 sale of Notes and Domino to HCL for $1.8B", url: "https://en.wikipedia.org/wiki/Lotus_Software" },
      { label: "Encyclopedia.com / FundingUniverse company history - Kapor at 32, VisiPlot and VisiTrend, the $1.7M buyout, Sachs's ten months writing 1-2-3 in assembly, and the 256K memory decision", url: "https://www.encyclopedia.com/social-sciences-and-law/economics-business-and-labor/businesses-and-occupations/lotus-development-corp" },
      { label: "HandWiki: $53M in first-year sales against a $1M business plan forecast, third largest microcomputer software company by 1983, and Jim Manzi's rise from McKinsey consultant to CEO in 1986", url: "https://handwiki.org/wiki/Company:Lotus_Software" },
      { label: "Wikipedia: Mitch Kapor - leaving VisiCorp, the 26 January 1983 release of 1-2-3 and what its name meant, and finishing his MIT Sloan master's in 2025 having started in 1979", url: "https://en.wikipedia.org/wiki/Mitch_Kapor" },
      { label: "Wikipedia: Jonathan Sachs - born 1947, MIT, leaving Lotus in 1985 for Digital Light & Color, shipping Picture Window since 1994", url: "https://en.wikipedia.org/wiki/Jonathan_Sachs" },
    ],
  },
  {
    // QUALYS - added 2026-07-30 (PRIME). Completes the vulnerability-management
    // trio with Tenable and Rapid7 on a DIFFERENT axis: not open-source
    // strategy but DELIVERY MODEL - it never shipped software at all.
    //
    // FOUNDER DISCREPANCY RECORDED: most sources say Philippe Langlois and
    // Gilles Samoun founded it and Philippe Courtot invested in 1999 before
    // becoming CEO in March 2001. One reference work states Courtot founded it,
    // and contradicts itself in the same article. The majority account is given
    // and the disagreement noted rather than silently resolved.
    slug: "qualys",
    group: "contemporary",
    name: "Qualys",
    founded: 1999,
    tagline: "Delivered security scanning as a service in 2000, before anybody had a word for that.",
    intro:
      "Qualys was founded in 1999 by Philippe Langlois and Gilles Samoun, incorporated in Delaware at the end of that December, with Langlois as chief technology officer and Samoun as chief executive. Philippe Courtot invested in 1999 and became chief executive and chairman in March 2001, and it is his tenure the company is usually remembered for. Some sources describe Courtot as a founder; the majority record him as the early investor who then ran it for twenty years, and that is the account used here.",
    body: [
      "QualysGuard launched in 2000, and the decision that made it distinctive was not what it scanned but how it arrived. Competitors sold software you installed. Qualys sold a subscription to a service, at a time when software as a service barely existed as a phrase - and the argument for it was specific rather than fashionable: **vulnerability data ages badly.** A scanner is only as good as its knowledge of what to look for, and installed software is exactly as current as its last update, which in most organisations is not very. A service updated centrally is current for everyone at once.",
      "**That is the same argument this timeline shows repeatedly, arriving for a fifth time.** IronPort made it about email sender reputation in 2002, Zscaler about web traffic in 2007, Cloudflare about the web in 2009, CrowdStrike about endpoint behaviour in 2013. Qualys made it about vulnerability knowledge in 2000, which makes it the earliest instance on this page. The idea that a centrally operated platform beats locally installed software because it is never stale was worked out in this segment first.",
      "**And it completes a trio here on a different axis.** Tenable, Rapid7 and Qualys compete in the same market and the other two entries contrast them on open source - one closed a project to fund itself, one bought a project and kept it open. Qualys differs on something else entirely: **it never shipped software to be run by the customer at all.** Three companies, three strategies, three answers to what a security vendor actually sells.",
      "**Philippe Courtot's career before Qualys is worth its own paragraph.** In 1988 he founded cc:Mail, took it to roughly forty per cent of the email platform market, and sold it to Lotus in 1991. In 1993 he became chief executive of Verity, taking it public in 1995. He then led Signio through its acquisition by VeriSign. Qualys was his fifth chief executive role, and he ran it for two decades.",
      "He also spent that time on work with no commercial return attached: helping found the Cloud Security Alliance in 2008, starting the Trustworthy Internet Movement and the CSO Interchange, and serving as a trustee of the Internet Society. He stepped down in March 2021 for health reasons and died on 5 June that year, aged 76.",
      "The company went public in 2012 and reported revenue of $669M for 2025 with around 2,625 staff. The product argument has moved where every vendor in this segment moved, from finding everything to ranking what matters, because the constraint stopped being detection a long time ago and became the fact that nobody can patch it all.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Qualys",
    externalLabel: "Qualys",
    sources: [
      { label: "Wikipedia: Qualys - founders Philippe Langlois and Gilles Samoun, Courtot investing in 1999 and becoming CEO and chair in 2001, QualysGuard in 2000 as one of the first entrants in vulnerability management, and 2025 revenue", url: "https://en.wikipedia.org/wiki/Qualys" },
      { label: "Qualys announcement of Courtot's death - cc:Mail founded 1988 and sold to Lotus in 1991 at ~40% market share, Verity CEO from 1993 with a 1995 IPO, Signio through to the VeriSign acquisition, the Cloud Security Alliance in 2008, the Trustworthy Internet Movement, the CSO Interchange, Internet Society trusteeship, and his death on 5 June 2021 aged 76", url: "https://www.qualys.com/company/newsroom/news-releases/usa/qualys-passing-of-former-ceo-and-industry-visionary-philippe-courtot" },
      { label: "Wikipedia: Philippe Courtot - born 26 August 1944 in France, a five-time chief executive who led two companies to IPO", url: "https://en.wikipedia.org/wiki/Philippe_Courtot" },
      { label: "Company history - Delaware incorporation on 30 December 1999, QualysGuard Vulnerability Management launched 2000, and the SaaS model as unusual for a security vendor at the time", url: "https://swottemplate.com/blogs/brief-history/qualys-brief-history" },
      { label: "Ownership history - $28.4M raised across two rounds including a $20M Series B in April 2001 with Bessemer Venture Partners, and Courtot stepping down in March 2021 for health reasons", url: "https://matrixbcg.com/blogs/owners/qualys" },
    ],
  },
  {
    // ILLUMIO - added 2026-07-30 (PRIME). Closes a Juniper loop: PJ Kirner was
    // a distinguished engineer in Juniper's security CTO office, and Juniper is
    // a career chapter on this site.
    slug: "illumio",
    group: "contemporary",
    name: "Illumio",
    founded: 2013,
    tagline: "Assumed the attacker is already inside, and made the whole product about what happens next.",
    intro:
      "Andrew Rubin and PJ Kirner founded Illumio on 23 January 2013 in Sunnyvale, having both left Cymtec the month before. They had met through a mutual friend's introduction over lunch, which Kirner has described as feeling like a blind date. Rubin took the commercial side, Kirner the technical - he had been a distinguished engineer in the security CTO office at Juniper Networks, which appears on this site as a career chapter of its own.",
    body: [
      "The founding thesis was unfashionable in 2013 and is now close to consensus: **perimeter security alone is not enough, breaches are inevitable, and the useful question is what an attacker can reach once inside.** Most security spending at the time went on keeping people out. Illumio's argument was that the containment problem deserved its own product.",
      "The technical decision that follows is the interesting one. Segmentation had historically been a network problem - VLANs, zones, firewalls between them - which means the policy lives in the topology, and a workload's security depends on where it happens to sit. Illumio put enforcement at the workload instead, with policy computed centrally and pushed to hosts, so **the rule travels with the application rather than with the wiring**. That is why it works in a cloud where you do not own the network, and it is the reason a software-first approach could do what hardware segmentation could not keep up with.",
      "**And then the part everyone underestimates, which the company has been honest about.** You cannot enforce a rule that nothing talks unless it has a reason to until you know what actually talks to what. In a data centre of any age, nobody does. So the first product problem was not enforcement at all but **real-time dependency mapping** - working out the actual conversation graph of a running estate - and the name comes from illuminate for exactly that reason.",
      "That is also why the company spent **twenty-two months in stealth** before showing anything. It raised $12.5M from Andreessen Horowitz and General Catalyst in early 2013, emerged in October 2014 with a $30.2M Series B, and had Morgan Stanley and Plantronics as customers in the first year. A $100M round in 2015 took it past a billion.",
      "Today the framing is zero-trust segmentation and breach containment, and the numbers reported are $557M raised, a $2.75B valuation, revenue past $100M a year, and roughly a fifth of the Fortune 100. Kirner stepped down as chief technology officer in May 2023 after a decade, staying on as an adviser.",
      "**Read next to two other entries here, it completes a picture of how the perimeter dissolved.** Zscaler moved inspection out to where the users went. Netskope tackled what people were doing inside applications nobody had approved. Illumio addressed the inside of the data centre itself, on the assumption that the other two would sometimes fail. Three companies, three different pieces of the same admission: the boundary that security was organised around had stopped describing anything real.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Illumio",
    externalLabel: "Illumio",
    sources: [
      { label: "Wikipedia: Illumio - founded 2013 by Andrew Rubin and P.J. Kirner, Sunnyvale, breach containment and lateral movement", url: "https://en.wikipedia.org/wiki/Illumio" },
      { label: "Verdict CTO Talk with PJ Kirner - his time on Juniper Networks' security team in the CTO office, and the blind-date introduction to Rubin", url: "https://www.verdict.co.uk/illumio-cto-pj-kirner/" },
      { label: "Contrary Research - both founders leaving Cymtec in December 2012, and Kirner stepping down as CTO in May 2023 while remaining an adviser", url: "https://research.contrary.com/company/illumio" },
      { label: "Company history - the 23 January 2013 founding, 22 months in stealth building real-time dependency mapping, the $12.5M Series A from Andreessen Horowitz and General Catalyst, the October 2014 emergence with $30.2M, Morgan Stanley and Plantronics as early customers, and the name deriving from illuminate", url: "https://businessmodelcanvastemplate.com/blogs/brief-history/illumio-brief-history" },
      { label: "Interview with Andrew Rubin - $557M raised, $2.75B valuation, revenue past $100M, roughly 20% of the Fortune 100, and Kirner's Cornell background", url: "https://thesecuritypodcastofsiliconvalley.com/blog/building-a-cybersecurity-startup.-lessons-from-illumio-ceo-andrew-rubin" },
    ],
  },
  {
    // ELASTIC - added 2026-07-30 (PRIME).
    //
    // The THIRD answer to the open-source question already on this timeline:
    // Tenable closed its project to fund the company; Rapid7 bought one and
    // kept it open; Elastic closed one, got forked, and then partly reopened.
    //
    // *** THREE CONFLICTING ACCOUNTS OF MOTIVE ARE ALL RECORDED AND NONE IS
    // ADJUDICATED. *** Elastic's 2021 statement, Banon's different 2024
    // emphasis, and a former AWS executive's contrary version. This is a live
    // dispute between named parties and the page must not pick a winner.
    //
    // The widely repeated "recipe app for his wife" origin story is OMITTED:
    // it was not in this session's verified sources.
    slug: "elastic",
    group: "contemporary",
    name: "Elastic",
    founded: 2012,
    tagline: "Changed its licence to stop a cloud provider, got forked, and changed it back three years later.",
    intro:
      "Shay Banon built Elasticsearch on top of Apache Lucene, having previously written a search library called Compass, and the company around it was founded in 2012. The product did something genuinely useful: it made full-text search over arbitrary JSON documents something a developer could stand up in an afternoon, with a query language that did not require a database administrator.",
    body: [
      "Elasticsearch and Kibana were Apache 2.0, and that licence is permissive by design - anyone may take the code and sell a service built on it, with no obligation to contribute anything back. In 2015 Amazon Web Services began offering exactly that: a managed Elasticsearch service. In 2019, after Elastic released parts of its commercial x-pack features under restrictive licences, AWS launched Open Distro for Elasticsearch as an alternative packaging.",
      "**In January 2021, with release 7.11, Elastic moved Elasticsearch and Kibana off Apache 2.0** to a dual licence: the Server Side Public License, originally written by MongoDB, and the new Elastic License. Neither is approved by the Open Source Initiative. Elastic's stated intent at the time was to prevent companies providing its products as a service without collaborating with it, and AWS was named explicitly.",
      "**Three different accounts of why exist, and all three are recorded here.** Elastic's 2021 position was about resale without collaboration. In 2024 Banon put the emphasis elsewhere, saying the problem was never AWS providing the software - Apache 2.0 permitted that - but calling it Amazon Elasticsearch, which he characterised as clear trademark infringement met with a thousand lawyers. Adrian Cockcroft, formerly of AWS, gave a third version: that AGPL alone would have blocked AWS, and that the real disagreement was AWS wanting to contribute security features to the open project while Elastic wanted to keep security commercial. **These accounts are not compatible, they come from named participants, and this page does not adjudicate between them.**",
      "**In April 2021 AWS forked Elasticsearch and Kibana at version 7.10.2 and created OpenSearch**, under Apache 2.0, later placed with the Linux Foundation. Elastic then made its client libraries incompatible with OpenSearch, and OpenSearch wrote its own.",
      "The community reaction is worth quoting rather than summarising, because it is the part that outlasted the argument. Drew DeVault noted that Elasticsearch belonged to its 1,573 contributors, who had granted Elastic a licence to distribute their work and not to relicense it. Simon Phipps of the Open Source Initiative said Elastic had taken what benefit it could from open source and was now spitting out the bones. Corey Quinn's version was shorter: anyone relying on assurances from Elastic should make other plans.",
      "**In September 2024 Elastic added AGPLv3**, an OSI-approved licence, alongside SSPL and the Elastic License - triple-licensing the core products and making them open source again by any standard definition. Banon's announcement had its sections titled after Kendrick Lamar songs, which is a genuinely unusual document to find in a licensing archive. He said the change had worked: Amazon was fully invested in its fork, the market confusion was mostly resolved, and the partnership with AWS was stronger than ever. **He also explicitly denied that the 2021 change had been a mistake.**",
      "The commercial reasoning is coherent and the outcome is instructive anyway. **The fork did not come back.** Practitioners quoted at the time were direct about why: contributors who had watched their Apache-licensed work become someone else's exclusive asset had no reason to return, and trust takes far longer to rebuild than to lose. OpenSearch continues, and the ecosystem that was one project in 2020 is two.",
      "**Read alongside two other entries on this timeline, a pattern appears.** Tenable closed its open-source scanner in 2005 to fund the company, and the community forked it into OpenVAS. Rapid7 bought an open-source project and kept it open. Elastic closed one, was forked, and reopened it. **Three companies, three strategies, and in two of the three the fork is still running.** Whether a permissive licence is a gift or a liability depends entirely on who else can afford to operate your software at scale - which is a question nobody had to ask before hyperscale cloud existed.",
    ],
    externalUrl: "https://www.elastic.co/pricing/faq/licensing",
    externalLabel: "Elastic: software licensing FAQ",
    sources: [
      { label: "Elastic's own licensing FAQ - the January 2021 move off Apache 2.0 at release 7.11, and the September 2024 addition of AGPLv3 before 8.16", url: "https://www.elastic.co/pricing/faq/licensing" },
      { label: "InfoQ (2021): Elastic's stated intent, the Open Distro dispute, and the community reactions from Drew DeVault and Corey Quinn including the 1,573 contributors point", url: "https://www.infoq.com/news/2021/01/elastic-aws-open-source" },
      { label: "Socket: Banon's 2024 clarification that the issue was trademark rather than resale, Adrian Cockcroft's contrary account about security features, and Simon Phipps's response", url: "https://socket.dev/blog/developers-burned-by-elasticsearch-license-change-arent-going-back" },
      { label: "DevClass: the April 2021 OpenSearch fork from 7.10.2, what SSPL and ELv2 require, and Banon's assessment that the change worked", url: "https://www.devclass.com/databases/2024/09/02/elasticsearch-will-be-open-source-again-as-cto-declares-changed-landscape/1618331" },
      { label: "Simon Willison: the triple-licensing detail and the sequence of events", url: "https://simonwillison.net/2024/Aug/29/elasticsearch-is-open-source-again/" },
      { label: "TechHQ: OpenSearch moving to the Linux Foundation and what the AGPL return does and does not change", url: "https://techhq.com/news/elasticsearch-cloud-news-open-source-license-latest-licensing-situation/" },
    ],
  },
  {
    // APPLE - added 2026-07-30 (PRIME). Completes the 1977 Trinity comparison
    // set up in the Tandy entry, which records that Tandy outsold Apple three
    // to one in 1980. This entry explains why that reversed.
    //
    // The NeXT purchase price is deliberately NOT given: this session's sources
    // did not state it, and the commonly quoted figures vary. Better absent
    // than approximated.
    slug: "apple",
    group: "other",
    name: "Apple",
    founded: 1976,
    tagline: "Lost the first round of the personal computer market badly, and won every round after it.",
    intro:
      "Apple Computer Company was founded on 1 April 1976 by Steve Jobs, Steve Wozniak and Ronald Wayne, in Cupertino, to sell a hand-built computer Wozniak had designed. Jobs and Wozniak each took 45% and Wayne 10%. Eleven days later Wayne sold his share back for $800, later receiving a further $1,500 to settle it - a decision routinely called the most expensive in the history of startups, and one he made because he had a family and could not carry the risk.",
    body: [
      "The funding was a Volkswagen minibus and a programmable calculator. Jobs sold the van, Wozniak sold his HP-65, and the Apple I went out as a bare circuit board at $666.66 - no case, no keyboard, no monitor, because a fully assembled board was itself the innovation when the alternative was a kit. Around two hundred were sold, and the order that mattered came from Paul Terrell of the Byte Shop, who took fifty.",
      "Wozniak had shown the machine at the **Homebrew Computer Club**, and that detail links this entry to another on this timeline. Steve Leininger, the engineer Tandy hired to design the TRS-80, was a Homebrew member too. **Two of the three machines in what Byte magazine called the 1977 Trinity came out of the same hobbyist meeting in Silicon Valley**, which is a reasonable claim for the most productive room in the history of the industry.",
      "Mike Markkula, an Intel veteran, provided $250,000 and the adult supervision, and the company incorporated in January 1977 - by which time Wayne was already gone. The Apple II arrived that April with a case, a keyboard, colour graphics and expansion slots, and it is the machine that made personal computing a market rather than a hobby.",
      "**And then it lost.** The Tandy entry on this timeline records that in 1980 Tandy shipped three times as many computers as Apple, because Tandy had seven thousand shops and Apple had dealers. Apple's advantage was slower and more durable: open expansion slots meant other companies could build cards for it, and VisiCalc - the first spreadsheet - shipped on the Apple II first. A machine that other people can extend and write software for accumulates reasons to buy it. A machine sold off a convenient shelf accumulates only sales.",
      "The 1980 listing raised $110M. The Lisa in 1983 cost $9,995 and failed. The Macintosh in 1984 was the right idea shipped underpowered. Jobs recruited John Sculley from Pepsi with a line that has outlived both products - whether he wanted to sell sugared water for the rest of his life, or come and change the world - and in September 1985 Sculley removed him from the company. Wozniak had already left in February to become a schoolteacher.",
      "**The interesting decade is the bad one.** Apple spent the 1990s demonstrating the limits of a closed system in a market that had standardised on somebody else's, and by 1997 its worldwide share was around three per cent. Jobs, meanwhile, had founded NeXT and bought Lucasfilm's computer graphics division, which became Pixar.",
      "So the return happened through an acquisition, and it is the most consequential one on this page: **Apple bought NeXT, and NeXT's operating system became the foundation of macOS, and NeXT's founder became Apple's chief executive.** A company acquired a supplier and got a new leader, a new kernel and a new decade out of it. Every iPhone runs a descendant of software written by the company Apple's ousted founder built while he was gone.",
      "What follows is well documented elsewhere and does not need retelling here. The part worth keeping on a page about lineage is the shape: **Apple is the only company on this timeline that was overtaken, nearly died, bought the company its exiled founder had built, and came back to become the first American company worth three trillion dollars.** Every other recovery story here ends in an acquisition by somebody else.",
    ],
    acquisitions: [
      { year: 1997, name: "NeXT", what: "Steve Jobs's company, founded after his 1985 removal from Apple. Its object-oriented operating system was the technology Apple needed and could not build in time.", became: "Mac OS X and every descendant of it - macOS, iOS, watchOS, tvOS. The acquisition also returned Jobs, who became chief executive.", founder: "Steve Jobs, 1985", sourceNote: "The purchase price is omitted here because this session's sources did not state it and commonly quoted figures vary." },
      { year: 1986, name: "Lucasfilm's Computer Graphics Division (by Jobs personally, not Apple)", what: "Bought by Jobs while he was outside Apple, and renamed Pixar. Included here because it is part of the same lineage of decisions, not because Apple bought it.", became: "Pixar Animation Studios, later acquired by Disney." },
    ],
    externalUrl: "https://guides.loc.gov/this-month-in-business-history/april/apple-computer-founded",
    externalLabel: "Library of Congress: the founding of Apple Computer",
    sources: [
      { label: "Cult of Mac: the 1 April 1976 founding, the 45/45/10 split, Wayne cashing out for $800 eleven days later plus a further $1,500, and meeting Wayne at Atari", url: "https://www.cultofmac.com/apple-history/apple-computer-founded" },
      { label: "Britannica: Markkula's $250,000 and January 1977 incorporation, the Apple I at $666.66 and 200 units, Jobs's removal by Sculley in September 1985, Wozniak leaving in February 1985, the ~3% share by 1997 and the NeXT technology becoming the basis of macOS", url: "https://www.britannica.com/money/Apple-Inc" },
      { label: "Library of Congress: the founding and the intent to make computers people would have at home", url: "https://guides.loc.gov/this-month-in-business-history/april/apple-computer-founded" },
      { label: "Mac History timeline: Paul Terrell's fifty-unit Byte Shop order, the Homebrew presentation, the Lisa at $9,995 falling to $6,995, and the Sculley recruitment", url: "https://www.mac-history.net/2022/12/16/timeline-the-history-of-apple-since-1976/" },
      { label: "Qorval: the VW minibus and HP-65 calculator funding, the Apple II's open architecture, and the January 2022 three-trillion-dollar market capitalisation", url: "https://qorval.com/blog/apple-inc-from-garage-startup-to-global-icon/" },
    ],
  },
  {
    // KASPERSKY - added 2026-07-29 (PRIME).
    //
    // *** THIS ENTRY IS DELIBERATELY BALANCED AND MUST STAY THAT WAY. ***
    // Two things are simultaneously true and both are documented: the company's
    // researchers are genuinely first-rate and have published on operations
    // attributed to Russia, the United States AND Israel; and several
    // governments have banned its software on national-security grounds the
    // company denies. Public sources do not settle the underlying question, so
    // this page does not either. Allegations are ATTRIBUTED to who made them,
    // the denial is stated, and no verdict is offered.
    //
    // Natalya Kaspersky's role is foregrounded because it is routinely omitted:
    // she launched the company foundation, named it, built the commercial
    // operation from a few hundred dollars a month to over a million a year,
    // and was chief executive for more than a decade.
    slug: "kaspersky",
    group: "other",
    name: "Kaspersky",
    founded: 1997,
    tagline: "World-class malware research and a geopolitical problem, in the same company, both real.",
    intro:
      "Kaspersky Lab was founded in Moscow in 1997 by four people: Eugene Kaspersky, Natalya Kaspersky, Alexey De-Monderik and Vadim Bogdanov, who left a company called KAMI to keep developing the antivirus engine they had been building since 1991. It was called AVP, for AntiViral Toolkit Pro, and was renamed Kaspersky Anti-Virus after an American firm registered the AVP trademark in the United States.",
    body: [
      "Eugene Kaspersky's route into the field is unusual and it is the fact most often cited about him. At sixteen he entered the Technical Faculty of the KGB Higher School, graduating in 1987 with a degree in mathematical engineering, and served as a software engineer in Soviet military intelligence. His interest in security began prosaically: in 1989 his work computer caught the Cascade virus and he wrote a program to remove it.",
      "**Natalya Kaspersky built the business, and that is usually left out.** She took over distribution of the toolkit in September 1994, when it was earning one or two hundred dollars a month. Within a year it was making $130,000, in 1996 over $600,000, and in 1997 more than a million - which is what made founding an independent company possible. She launched the company foundation in June 1997, was central to choosing the name, and served as chief executive for more than ten years. The initial split was Eugene 50%, De-Monderik and Bogdanov 20% each, and Natalya 10%.",
      "The break came in 1998. A Taiwanese student released CIH, a virus that overwrote the BIOS and could leave a machine unable to boot at all, and for the first three weeks of the outbreak Kaspersky's product was the only one that could remove it. That single fact produced licensing deals with antivirus companies in Japan, Finland and Germany, and revenue grew 280% between 1998 and 2000 with most of it coming from outside Russia.",
      "**The research is the part of this company that its critics rarely dispute.** Its teams published on Stuxnet, Flame, Duqu, Red October, Equation Group and ProjectSauron - and the significance is who those operations are attributed to. Stuxnet and Flame are widely attributed to the United States and Israel; Equation Group's toolset was linked to American intelligence. A Russian company built much of its reputation by publishing detailed analysis of Western intelligence operations, while also publishing on Russian-attributed campaigns. Sergey Ulasen, working at a Belarusian firm later acquired into Kaspersky, is generally credited with first identifying Stuxnet.",
      "**And then the other half, stated plainly.** On 13 September 2017 the US Department of Homeland Security prohibited Kaspersky products across federal agencies, alleging the company had worked on projects with Russia's Federal Security Service. In October 2017, press reports alleged that Russian government hackers had obtained classified material from a contractor's home computer running the software. On 20 June 2024 the US Commerce Department went further, prohibiting sale and use of the software in the United States, and the Treasury sanctioned company leadership. Germany's federal security office had warned against it in March 2022, and the United Kingdom and Australia have imposed restrictions of their own.",
      "The company has denied intelligence ties consistently, describing the allegations as speculation without evidence, and has offered third-party source-code audits and transparency centres in an attempt to address them. Those measures have not changed any government's position.",
      "**This page does not resolve that, because the public record does not.** What can be said is narrower and more useful: a security product requires more trust than almost any other software, because it runs with the highest privileges, sees everything on the machine, and updates itself continuously from its vendor. The SolarWinds and CrowdStrike entries on this timeline show what happens when that trust is misplaced by accident and by attack. A government reasoning about a vendor subject to a foreign legal system is reasoning about the same property - and it can reach a restrictive conclusion without any specific wrongdoing having been proven.",
      "That is the genuinely instructive thing here, and it applies well beyond one company. **Jurisdiction is part of a product's threat model.** Where a vendor's engineers can be legally compelled, and by whom, is a security property of the software, and it is not visible in any feature comparison.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Kaspersky_Lab",
    externalLabel: "Kaspersky Lab",
    sources: [
      { label: "Wikipedia: Kaspersky Lab - the four founders, the departure from KAMI, the AVP trademark rename, and the 1998 CIH outbreak in which its product was the only one able to remove the virus", url: "https://en.wikipedia.org/wiki/Kaspersky_Lab" },
      { label: "Wikipedia: Natalya Kaspersky - taking over distribution in September 1994, revenue from $100-200 a month to over $1M in 1997, launching the foundation in June 1997, naming the company, a decade as CEO, and the initial equity split", url: "https://en.wikipedia.org/wiki/Natalya_Kaspersky" },
      { label: "Wikipedia: Eugene Kaspersky - the KGB Higher School cryptology faculty, the 1987 degree, Soviet military service, and the 1989 Cascade virus", url: "https://en.wikipedia.org/wiki/Eugene_Kaspersky" },
      { label: "Wikipedia: Kaspersky bans and allegations of Russian government ties - the 13 September 2017 DHS directive, the October 2017 reports, and the German warning of March 2022, with the company's denials", url: "https://en.wikipedia.org/wiki/Kaspersky_bans_and_allegations_of_Russian_government_ties" },
      { label: "CNN: the 20 June 2024 US prohibition on sale and use, and the recognition of Kaspersky researchers as top-tier analysts of operations attributed to several governments including Russia, the US and Israel", url: "https://www.cnn.com/2024/06/20/politics/biden-administration-bans-kaspersky-software/index.html" },
      { label: "Kaspersky's own account of its research record, including Stuxnet, Flame and Red October", url: "https://www.kaspersky.com/about/team/eugene-kaspersky" },
    ],
  },
  {
    // SOLARWINDS - added 2026-07-29 (PRIME).
    //
    // This is the most instructive entry on the timeline and it is written at
    // length deliberately. It is also the EXACT INVERSE of the CrowdStrike
    // outage already on this site: the same architecture - a trusted agent
    // updated centrally across thousands of organisations - failing once by
    // accident and once by design.
    //
    // The SEC action is presented with BOTH sides and its outcome, because most
    // of it was dismissed in 2024 and writing only the charge would be unfair.
    // The 18,000 figure is given with the caveat the US government itself
    // attached to it, which is almost always dropped in retellings.
    slug: "solarwinds",
    group: "contemporary",
    name: "SolarWinds",
    founded: 1999,
    tagline: "Sold the software that watches everything, which is exactly why somebody wanted it.",
    intro:
      "SolarWinds was founded in 1999 in Tulsa, Oklahoma by two brothers, Donald Yonce - a former Walmart executive - and David Yonce. The business was unglamorous and very good: affordable network monitoring for the people who actually run networks, sold without the enterprise sales apparatus that made competitors expensive. It moved to Austin, and by 2020 its Orion platform sat inside a very large share of the organisations that matter.",
    body: [
      "The commercial insight was that monitoring was overpriced and oversold. A network engineer who needed to know whether a link was saturated did not want a six-month procurement cycle, and SolarWinds built a catalogue of tools that could be downloaded, trialled and bought on a card. That model took it from Tulsa to a public listing in October 2018, and it bought its way into adjacent categories along the way: Pingdom for external uptime checks, Papertrail for log aggregation, Loggly, AppOptics.",
      "**And then the thing that makes this page worth reading.** In October 2019, attackers who had already been inside SolarWinds began testing whether they could inject code into the Orion build. Roughly four months later they succeeded, and from 26 March 2020 SolarWinds itself distributed the result - a backdoor the industry named SUNBURST - inside signed, legitimate updates to Orion versions 2019.4 through 2020.2.1.",
      "It was not discovered until December 2020, and not by SolarWinds. FireEye found it while investigating its own compromise, which is worth noting because FireEye appears on this timeline too: a security company found the largest supply chain attack in history by looking into how it had itself been broken into. In April 2021 the US and UK governments attributed the operation to Russia's foreign intelligence service, the SVR - the group tracked as APT29 or Cozy Bear.",
      "**The number everyone quotes needs its caveat.** Around 18,000 customers received the backdoored update. The US government's own assessment was that a much smaller number were actually compromised by follow-on activity, because the backdoor was a door rather than an occupation - the attackers chose where to walk through it, and they were extremely selective. Repeating 18,000 as a count of victims overstates it, and the distinction between having the malware and being exploited by it is precisely the distinction a security professional is paid to understand.",
      "The response detail that stays with people: SolarWinds could not use its own email to coordinate the investigation, because the attackers were reading it. Staff worked by telephone and outside accounts, during a pandemic, from home. The chief executive later joked that every comma in the initial regulatory filing cost the company $20,000 in legal fees.",
      "**Then the argument about blame, which is not settled and is presented here as unsettled.** In October 2023 the SEC charged SolarWinds and its chief information security officer, Timothy Brown, with fraud - alleging that from the 2018 listing onward the company disclosed only generic risks while internally knowing about specific deficiencies. SolarWinds called the action an attempt to \"revictimise the victim\" and said its disclosures were accurate. In July 2024 a federal judge **dismissed most of the case**, including everything relating to disclosures made after the attack, while allowing the claim based on the company's published security statement to proceed.",
      "That outcome is the part with teeth for anyone who works in this field. A named individual was personally charged over how a breach was described, and while most of the case did not survive, the surviving part concerns a marketing page about security practices. What a company says about its own posture became a matter of securities law, and every CISO reading this now writes differently because of it.",
      "The lesson for practitioners is architectural rather than moral, and this site already carries its twin. CrowdStrike's July 2024 outage broke 8.5 million machines because a trusted agent with deep access is updated centrally and rapidly. SUNBURST compromised thousands of networks for the same structural reason. **One was an accident and one was an intelligence operation, and the property they exploited was identical: we have built an industry on software that updates itself from a single source, and the trust in that channel is load-bearing.**",
    ],
    acquisitions: [
      { year: 2014, name: "Pingdom", what: "External uptime and performance monitoring, checked from outside the network rather than within it.", became: "The SolarWinds cloud monitoring line." },
      { year: 2015, name: "Papertrail", what: "Hosted log aggregation and live tail, popular with small engineering teams for being immediately useful.", became: "Part of the same cloud portfolio, kept under its own name." },
      { year: 2015, name: "Librato and TraceView", what: "Metrics and application tracing, bought from AppNeta.", became: "AppOptics, which merged both into one product." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/SolarWinds",
    externalLabel: "SolarWinds",
    sources: [
      { label: "Wikipedia: SolarWinds - founded 1999 in Tulsa by Donald and David Yonce; Brad Smith's assessment of the attack", url: "https://en.wikipedia.org/wiki/SolarWinds" },
      { label: "MITRE ATT&CK campaign C0024 - the April 2021 US and UK attribution to Russia's SVR, and the government assessment that far fewer than the ~18,000 recipients were actually compromised", url: "https://attack.mitre.org/campaigns/C0024/" },
      { label: "Fortinet: the timeline - testing code injection in October 2019, SUNBURST injected about four months later, distribution beginning 26 March 2020", url: "https://www.fortinet.com/resources/cyberglossary/solarwinds-cyber-attack" },
      { label: "SEC litigation release: the October 2023 charges against SolarWinds and CISO Timothy Brown, and the ~25% and ~35% share price falls after the 14 December 2020 filing", url: "https://www.sec.gov/enforcement-litigation/litigation-releases/lr-25887" },
      { label: "Cybersecurity Dive: the July 2024 ruling dismissing most of the SEC case while sustaining the claim based on the security statement", url: "https://www.cybersecuritydive.com/news/majority-sec-fraud-solarwinds-dismissed/721753/" },
      { label: "The Register: SolarWinds' own characterisation of the SEC action as revictimising the victim", url: "https://www.theregister.com/2024/01/29/solarwinds_sec_lawsuit/" },
      { label: "Zscaler: the affected Orion versions 2019.4 through 2020.2.1 and the breadth of US government customers", url: "https://www.zscaler.com/resources/security-terms-glossary/what-is-the-solarwinds-cyberattack" },
    ],
  },
  {
    // TENABLE - added 2026-07-29 (PRIME). Closes an Enterasys loop: Ron Gula
    // sold his previous company to Enterasys, which is on this timeline as the
    // enterprise remnant of Cabletron.
    // NOTE: founding date is given as 16 September 2002 by most sources and
    // 4 October 2002 by one; both recorded rather than one chosen.
    slug: "tenable",
    group: "contemporary",
    name: "Tenable",
    founded: 2002,
    tagline: "Built on a scanner a seventeen-year-old wrote, and then closed the source to fund the company.",
    intro:
      "In April 1998, aged seventeen, Renaud Deraison released the first version of Nessus. In September 2002 he folded it into a company founded with Ron Gula and Jack Huffard, in Columbia, Maryland. Most sources date the incorporation to 16 September 2002; one gives 4 October, and both are recorded here rather than one being chosen.",
    body: [
      "Ron Gula had worked at the National Security Agency in the 1990s and written the Dragon intrusion detection system, and the company he founded before this one was sold to Enterasys Networks - which appears elsewhere on this timeline as the enterprise remnant of Cabletron. Marcus Ranum, one of the people who built the first commercial firewalls, joined as chief security officer in 2004.",
      "The decision that defines the company came in October 2005. With the release of Nessus 3 the scanner became proprietary, and the stated reasons were both of them honest: to generate income, and to stop giving competitors a free product to resell. The community forked the last open version, and that fork became OpenVAS, which still exists.",
      "That is worth sitting with rather than judging quickly. A free tool written by a teenager became the default vulnerability scanner in the industry, and the only way to fund the engineering it then needed was to stop it being free. Both the closing and the fork were reasonable responses to the same fact.",
      "Tenable was bootstrapped for a decade. Its first institutional money was a $50M Series A from Accel in September 2012 - ten years in, which is not how the funding narrative usually goes. It went public in 2018, and by 2023 was reporting around $799M in revenue and roughly 44,000 customers including a majority of the Fortune 500.",
      "The product argument has since moved from scanning to prioritisation, because the finding that changed the category was that nobody can patch everything. Risk scoring, and CISA's catalogue of vulnerabilities known to be exploited, replaced completeness with triage - and every vendor in this segment made the same move at roughly the same time.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Tenable,_Inc.",
    externalLabel: "Tenable, Inc.",
    sources: [
      { label: "Wikipedia: Tenable - founded September 2002 by Gula, Huffard and Deraison; Nessus written in April 1998 at 17; Gula's NSA background and the sale of his prior company to Enterasys; Nessus 3 closing the source in October 2005 and the OpenVAS fork", url: "https://en.wikipedia.org/wiki/Tenable,_Inc." },
      { label: "Tenable's own profile of Renaud Deraison - first Nessus release at 17, and the CVE editorial board", url: "https://www.tenable.com/profile/renaud-deraison" },
      { label: "Company history: incorporation on 16 September 2002, bootstrapped until the $50M Accel Series A in September 2012", url: "https://dcf-model.com/blogs/history/tenb" },
      { label: "Alternative date of 4 October 2002 for incorporation, recorded as a discrepancy", url: "https://businessmodelcanvastemplate.com/blogs/brief-history/tenable-brief-history" },
    ],
  },
  {
    // RAPID7 - added 2026-07-29 (PRIME). The deliberate mirror of Tenable:
    // Tenable closed an open-source project to fund itself; Rapid7 BOUGHT one.
    slug: "rapid7",
    group: "contemporary",
    name: "Rapid7",
    founded: 2000,
    tagline: "Bought the industry's best-known attack toolkit, which is the opposite of what its main competitor did with open source.",
    intro:
      "Rapid7 was founded in 2000 in Boston, and the decision that gave it a distinct position came nine years later: in 2009 it acquired the Metasploit Framework, the open-source exploitation toolkit HD Moore had created in 2003, and brought Moore with it.",
    body: [
      "The significance is best seen against Tenable, which is on this timeline too. Tenable was built on an open-source scanner and closed it in 2005 to fund the company. Rapid7 went the other way and bought an open-source project outright, kept it open, and used it as the reason to trust the commercial products beside it. Two vendors in one market took opposite positions on the same question about open source, and both are still trading.",
      "Owning Metasploit also changed what Rapid7 could say. A scanner reports that a host is probably vulnerable; an exploitation framework demonstrates that it is. Holding both meant the company could close the gap between a finding and a proof, and that distinction is the whole argument for penetration testing over scanning alone.",
      "The problem the segment has spent two decades on is not detection but volume. A large organisation's scan returns tens of thousands of findings and nobody can act on all of them, so the useful work became ranking - which is why every vendor here, Rapid7 included, ended up shipping a risk score and leaning on the public catalogue of vulnerabilities known to be actively exploited.",
      "Rapid7 went public in 2015 and has expanded into detection and response, cloud posture and managed services, on the same logic every security company on this page eventually follows: once you are the system of record for one kind of risk, the adjacent kinds are the cheapest thing you can sell next.",
    ],
    acquisitions: [
      { year: 2009, name: "Metasploit Framework", what: "The most widely used open-source exploitation toolkit, kept open after the acquisition.", founder: "HD Moore, 2003", became: "Metasploit Pro alongside the community edition, and the reason Rapid7 could prove exploitability rather than only report it." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Rapid7",
    externalLabel: "Rapid7",
    sources: [
      { label: "Origin of vulnerability management: Rapid7's 2009 Metasploit acquisition, Moore's 2003 authorship, and the risk-scoring convergence across Tenable, Qualys and Rapid7 after CISA's KEV catalogue in November 2021", url: "https://artiflexit.com/blog/origin-vulnerability-management" },
    ],
  },
  {
    // LUMEN / CENTURYLINK / LEVEL 3 / GLOBAL CROSSING / IMPSAT - added
    // 2026-07-29 (PRIME), as one chain because that is how it happened.
    //
    // TWO PRICE DISCREPANCIES ARE RECORDED RATHER THAN RESOLVED:
    //   * Embarq 2009: $5.8B stock-for-stock in one source, ~$11.6B in another
    //   * Level 3 2017: $25.6B as announced, ~$34B where debt is included
    // Both are stated with their framing instead of one being chosen, which is
    // the standing rule when sources disagree on a number.
    slug: "lumen-centurylink-level3",
    group: "other",
    name: "Lumen, CenturyLink, Level 3 and Global Crossing",
    founded: 1968,
    tagline: "A rural Louisiana phone company that ended up owning one of the internet's largest backbones.",
    intro:
      "This is one company by succession and four or five by history. It was incorporated in 1968 as Central Telephone and Electronics Corporation, renamed Century Telephone Enterprises in 1971, and spent four decades as CenturyTel - a rural local exchange carrier headquartered in Monroe, Louisiana, growing by buying other rural carriers. It is now Lumen Technologies, and it operates AS3356.",
    body: [
      "The rural-carrier era is the least glamorous and most instructive part. Buying small local exchange carriers one at a time is unfashionable, capital-intensive and slow, and by 2008 it had made CenturyTel one of the largest rural operators in the United States - which is to say, large enough to buy things that were much better known than it was.",
      "Embarq followed in 2009, the former Sprint wireline business, itself descended from United Telephone. Sources differ on the price: $5.8B stock-for-stock in one account, roughly $11.6B in another, and the difference is almost certainly whether debt is counted. The merged company took the name CenturyLink.",
      "Qwest came in 2011 for about $12.2B, and Qwest was itself a Bell company by descent - US West, formerly Mountain Bell, serving fourteen western and midwestern states. That made CenturyLink the third largest wireline operator in the country behind Verizon and AT&T.",
      "Then Level 3, completing on 1 November 2017. Announced at $25.6B, commonly reported at around $34B once debt is included. Level 3 was founded in 1985, based in Broomfield, Colorado, and was the largest competitive local exchange carrier in the United States and one of the largest fibre operators anywhere - the company whose autonomous system number, AS3356, appears in more traceroutes than almost any other.",
      "**And Level 3 had itself been assembling.** WilTel, Broadwing, Looking Glass, Progress Telecom, TelCove, TW Telecom in 2014, and Global Crossing in 2011 - which is the entry inside this entry worth reading.",
      "Global Crossing was founded in March 1997 by Gary Winnick and David L. Lee to lay submarine cable, and during the 1999 bubble it was valued at $47B. **It never had a single profitable year.** In 2002 it filed one of the largest bankruptcies in history, its executives were accused of covering up an accounting scandal, and in 2011 Level 3 bought what remained for $3B including the assumption of $1.1B in debt. Its chief executive at the time was John Legere, who later ran T-Mobile.",
      "Global Crossing had also bought Impsat, the Latin American network operator, which is how fibre built for Argentina, Brazil and the region ended up inside a Louisiana rural carrier by way of a Bermudan bankruptcy.",
      "In 2022 Lumen sold its local exchange operations in twenty states to Brightspeed, keeping a western footprint and the fibre business. So the company spent fifty years acquiring rural telephone lines and then sold most of them, having used them to buy a global backbone.",
    ],
    acquisitions: [
      { year: 2009, name: "Embarq", price: "$5.8B stock-for-stock, or ~$11.6B depending on the source", what: "The former Sprint wireline business, serving eighteen states.", became: "The merged company was renamed CenturyLink.", sourceNote: "Sources disagree on the figure; both are given rather than one chosen. The gap is most likely debt.",
        subAcquisitions: [ { year: 1899, name: "United Telephone (origin, not a purchase)", what: "Embarq descended from United Telephone, which became Sprint's local operations before being spun out - so this deal bought a lineage older than the buyer." } ] },
      { year: 2011, name: "Qwest Communications", price: "~$12.2B", what: "Fourteen western and midwestern states, long-haul fibre and enterprise customers.", became: "The third largest US wireline operator, behind Verizon and AT&T.",
        subAcquisitions: [ { year: 1984, name: "US West / Mountain Bell (by descent)", what: "Qwest was a Bell company by lineage, having merged with US West in 2000 - itself one of the regional operators created when the Bell System was broken up." } ] },
      { year: 2017, name: "Level 3 Communications", price: "$25.6B announced; ~$34B commonly reported with debt", what: "The largest US competitive local exchange carrier and operator of AS3356, one of the internet's principal backbones. Completed 1 November 2017.", became: "The combined company became Lumen Technologies, and the backbone is the reason the name is known outside Louisiana.", sourceNote: "The two figures reflect equity value versus enterprise value; both appear in reputable coverage.",
        subAcquisitions: [
          { year: 2011, name: "Global Crossing", price: "$3B including $1.1B assumed debt", what: "Valued at $47B in 1999, never profitable in any year, bankrupt in 2002 in one of the largest filings in history, and sold for a fraction of its peak twelve years later. It had itself acquired Impsat, the Latin American operator - which is how regional fibre for Brazil and Argentina entered this lineage.", founder: "Gary Winnick and David L. Lee, March 1997" },
          { year: 2014, name: "TW Telecom", what: "Metro fibre and Ethernet across US markets, which is where a large part of Lumen's data centre footprint came from." },
          { year: 2005, name: "WilTel Communications", what: "One of several long-haul networks Level 3 consolidated during the post-bubble years, when capacity built for 1999 demand was selling for a fraction of its cost." },
        ] },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Lumen_Technologies",
    externalLabel: "Lumen Technologies",
    sources: [
      { label: "Grokipedia: Lumen operating companies - 1968 incorporation as Central Telephone and Electronics, 1971 rename, Embarq at $5.8B closing 1 July 2009, Qwest at $12.2B, the 2022 Brightspeed divestiture", url: "https://grokipedia.com/page/List_of_Lumen_Technologies_operating_companies" },
      { label: "Wikipedia: Global Crossing - founded March 1997 by Gary Winnick and David L. Lee, $47B valuation in 1999, never profitable, 2002 bankruptcy, acquired by Level 3 on 3 October 2011 for $3B including $1.1B debt", url: "https://en.wikipedia.org/wiki/Global_Crossing" },
      { label: "Wikipedia: Level 3 Communications - founded 1985, Broomfield, largest US CLEC, AS3356, defunct 1 November 2017", url: "https://en.wikipedia.org/wiki/Level_3_Communications" },
      { label: "MarketScreener: the Level 3 agreement announced at $25.6B on 31 October 2016", url: "https://www.marketscreener.com/quote/stock/LUMEN-TECHNOLOGIES-INC-14056214/news/CenturyLink-Inc-completed-the-acquisition-of-Level-3-Communications-Inc-from-STT-Crossing-Ltd-a-34920279/" },
      { label: "Inside Towers: the CenturyTel rural-carrier origins in Monroe, Louisiana and the succession through Embarq, Qwest and Level 3", url: "https://insidetowers.com/cell-tower-news-lumen-aligns-for-growth/" },
    ],
  },
  {
    // AKAMAI - added 2026-07-29 (PRIME).
    // Danny Lewin's death is recorded because it is a documented fact about a
    // founder, sourced to MIT's own alumni association, and omitting it would
    // be a strange kind of tidiness. It is stated plainly and not dramatised.
    slug: "akamai",
    group: "other",
    name: "Akamai Technologies",
    founded: 1998,
    tagline: "Answered a question Tim Berners-Lee posed about congestion, and the answer became most of how the web is delivered.",
    intro:
      "Akamai was incorporated on 20 August 1998 by Tom Leighton, an MIT professor of applied mathematics, and Danny Lewin, his graduate student, with Jonathan Seelig, Preetish Nijhawan and Randall Kaplan. It began as a response to a challenge Tim Berners-Lee had put to MIT: the web was going to get congested, and somebody should work out what to do about it.",
    body: [
      "The specific problem was the flash crowd. A site becomes briefly famous, traffic arrives faster than the origin server can answer, and the site falls over precisely when the most people are looking at it. Adding capacity does not help, because the capacity is needed for an hour a year.",
      "Leighton and Lewin's answer was mathematical rather than architectural. Consistent hashing lets a large, changing set of caches agree on which of them holds which object without any of them coordinating - crucially, adding or removing a server only remaps a small fraction of the keys, so the network can grow and lose nodes continuously without churning everything. That algorithm is the reason a distributed cache can be operated at all at scale, and it is used far beyond content delivery today.",
      "The business plan reached the finals of MIT's $50K competition, the company licensed the intellectual property from MIT, and most of the early employees were the students who had worked on it. FreeFlow launched commercially in 1999 with Yahoo as an early customer, and the IPO that year was one of the era's most dramatic: shares opened at $26 and closed the first day above $145.",
      "Danny Lewin was killed on 11 September 2001. He was a passenger on American Airlines Flight 11, the first aircraft flown into the World Trade Center, and is credited with attempting to stop the hijackers - he had served as an officer in the Israeli Defense Forces. He was 31. In 2017 he and Leighton were inducted into the National Inventors Hall of Fame for the algorithms behind the company.",
      "Akamai has since moved a majority of its revenue away from pure content delivery into security and cloud, buying Prolexic for DDoS mitigation, SOASTA for performance measurement, and Linode to offer compute at the edge rather than only caching. The network is measured in hundreds of thousands of servers across more than a hundred countries.",
    ],
    externalUrl: "https://www.akamai.com/company/company-history",
    externalLabel: "Akamai: company history",
    sources: [
      { label: "Akamai's own company history - incorporation 20 August 1998, the MIT $50K competition, the founding team and the MIT licence", url: "https://www.akamai.com/company/company-history" },
      { label: "MIT Alumni Association - Leighton and Lewin in the National Inventors Hall of Fame, and Lewin's death on Flight 11", url: "https://alum.mit.edu/node/58" },
      { label: "Business model history: the Berners-Lee challenge, consistent hashing, FreeFlow, and the 1999 IPO from $26 to over $145", url: "https://businessmodelcanvastemplate.com/blogs/brief-history/akamai-technologies-brief-history" },
    ],
  },
  {
    // CLOUDFLARE - added 2026-07-29 (PRIME).
    // A FOURTH instance of the shared-platform argument this timeline already
    // shows at IronPort (2002), Zscaler (2007) and CrowdStrike (2013) - and
    // this one started, like IronPort, from a spam question.
    slug: "cloudflare",
    group: "contemporary",
    name: "Cloudflare",
    founded: 2009,
    tagline: "Began as a project asking where spam came from, and became infrastructure after users asked it to stop the spam instead.",
    intro:
      "In 2004 Matthew Prince and Lee Holloway built Project Honey Pot to answer a narrow question: where does email spam actually come from? Anyone with a website could participate, and thousands in more than 185 countries did. The users kept making the same request - do not just track them, stop them - and five years later that request became a company.",
    body: [
      "Prince met Michelle Zatlyn at Harvard Business School during a sabbatical, described the project, and the two of them plus Holloway founded Cloudflare in July 2009. It won the school's business plan competition that April and closed a $2.1M Series A in November from Venrock and Pelion.",
      "The product was a reverse proxy you joined by changing your DNS, which is a genuinely low barrier: no hardware, no software, no contract, and a free tier from the beginning. That freemium decision was strategic rather than generous. Every free site sends traffic through the network, and every attack against a free site is an attack the network learns to recognise for everyone else.",
      "**That is the same argument this timeline shows three times before.** IronPort made it about email sender reputation in 2002. Zscaler made it about web traffic in 2007. CrowdStrike made it about endpoint behaviour in 2013. Cloudflare made it about the web itself, and got its initial threat data from a spam-tracking project - which is where IronPort had started too.",
      "Public launch was at TechCrunch Disrupt in September 2010, and traffic went from roughly 50 million page views a month to over 5 billion within the first year.",
      "The company has since become something harder to categorise: DDoS mitigation, WAF, DNS, zero-trust access, and a serverless compute platform that runs code in the same points of presence that serve the cache - which turns a content network into somewhere applications actually execute. It went public in 2019, and its network now spans more than 300 cities.",
      "It also occupies an awkward position it did not entirely choose. A company that will serve almost anyone, at scale, for free, ends up making decisions about who may remain online - and has been criticised both for acting and for declining to.",
    ],
    externalUrl: "https://www.cloudflare.com/our-story/",
    externalLabel: "Cloudflare: our story",
    sources: [
      { label: "Cloudflare's own account - Project Honey Pot in 2004, the users asking them to stop the attacks, meeting at HBS, the November 2009 Series A with Venrock and Pelion", url: "https://www.cloudflare.com/our-story/" },
      { label: "Company history: founded July 2009, the April 2009 HBS competition win, TechCrunch Disrupt launch, 50M to 5B page views in the first year", url: "https://portersfiveforce.com/blogs/brief-history/cloudflare" },
    ],
  },
  {
    // F5 - company history (PRIME step 4, 2026-07-29). Hub + lineage page
    // already carry the deal detail; this is the company and the idea.
    slug: "f5",
    group: "other",
    name: "F5",
    founded: 1996,
    careerChapter: { slug: "f5", years: "2015 - present" },
    tagline: "Named after a tornado, and spent thirty years moving up the stack from ports to applications.",
    intro:
      "F5 Labs was founded in Seattle in 1996 by Jeff Hussey and Michael Almquist. The name comes from the Fujita scale: F5 is the most powerful tornado category, which was the sort of thing a networking startup called itself in the nineties.",
    body: [
      "The first product, BIG-IP, was a load balancer, and the founding problem was mundane: a website outgrows one server, and something has to decide which server each request goes to. Doing that well turns out to require understanding the traffic rather than just counting connections, and that is the direction the whole company travelled.",
      "The consequential decision was moving up the stack. A load balancer that terminates the connection can inspect what is inside it, and once you are inspecting you can rewrite, authenticate, offload cryptography, enforce policy and block attacks. BIG-IP became a platform of modules rather than a product - traffic management, DNS, access, application firewalling - because each was another thing you could do once you were already in the path.",
      "iRules, introduced in the early 2000s, let administrators write TCL that ran per connection. That is unusual and it is why so much F5 knowledge is specific rather than general: the box does what the local script says, and two deployments of the same product can behave nothing alike.",
      "The acquisitions since 2019 mark a deliberate change of shape. NGINX brought a software proxy with an enormous open-source installed base and a very different deployment model. Shape Security brought bot and fraud detection. Volterra brought edge and multicloud application delivery, which became Distributed Cloud. The company that sold appliances into data centres has spent a decade trying to be relevant where applications actually run now.",
      "The full deal list, with what each acquired company had itself acquired, is on the vendor lineage page rather than repeated here.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/F5,_Inc.",
    externalLabel: "F5, Inc.",
    sources: [
      { label: "Wikipedia: F5, Inc. - founded 1996 in Seattle, the Fujita-scale name, BIG-IP, and the NGINX, Shape Security and Volterra acquisitions", url: "https://en.wikipedia.org/wiki/F5,_Inc." },
    ],
  },
  {
    // FORTINET - company history (PRIME step 4, 2026-07-29).
    slug: "fortinet",
    group: "other",
    name: "Fortinet",
    founded: 2000,
    careerChapter: { slug: "fortinet", years: "2022 - present" },
    tagline: "Founded by the man who had already built one firewall company, on the same argument taken further.",
    intro:
      "Ken Xie founded Fortinet in 2000 with his brother Michael. He had co-founded NetScreen in 1996 and left it, and NetScreen appears elsewhere on this timeline as the startup whose alumni seeded a remarkable share of the security industry - Fortinet being the first of them.",
    body: [
      "The NetScreen argument had been that firewalling belongs in purpose-built silicon rather than on a general-purpose processor. Fortinet took that further: if you are building custom silicon anyway, build it to do everything the traffic needs in one pass - firewalling, antivirus, intrusion prevention, web filtering - rather than chaining separate boxes that each re-inspect the same packets.",
      "That became unified threat management, and the FortiASIC is the reason the claim was credible rather than marketing. Inspecting content at line rate is genuinely hard on commodity hardware, which is why competitors selling software on servers had to choose between features and throughput.",
      "The commercial consequence mattered more than the technical one. UTM made real security affordable for organisations that could not staff a security team, and Fortinet's growth came substantially from the mid-market and from the channel rather than from displacing incumbents in large enterprises.",
      "The portfolio has since expanded well beyond the firewall into switching, wireless, endpoint, SIEM and SD-WAN, held together by a management fabric - the same one-vendor-for-the-whole-stack proposition that Cisco made for networking, applied to security.",
      "Its acquisitions, and what those companies had themselves bought, are on the vendor lineage page.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Fortinet",
    externalLabel: "Fortinet",
    sources: [
      { label: "Wikipedia: Fortinet - founded 2000 by Ken Xie and Michael Xie, FortiGate, the ASIC approach", url: "https://en.wikipedia.org/wiki/Fortinet" },
      { label: "Wikipedia: NetScreen Technologies - Ken Xie as co-founder before leaving to start Fortinet", url: "https://en.wikipedia.org/wiki/NetScreen_Technologies" },
    ],
  },
  {
    // NETSKOPE - company history (PRIME step 4, 2026-07-29).
    slug: "netskope",
    group: "other",
    name: "Netskope",
    founded: 2012,
    careerChapter: { slug: "netskope", years: "2024 - present" },
    tagline: "Started from the observation that nobody knew which cloud applications their own staff were using.",
    intro:
      "Netskope was founded in 2012 by Sanjay Beri and others, at the point where software as a service had quietly become the way work was done and security teams had no visibility into any of it.",
    body: [
      "The founding observation was specific and easy to verify: ask an organisation how many cloud applications it uses, and the answer is invariably an order of magnitude lower than the truth. Staff adopt tools without procurement, data moves into services nobody approved, and a perimeter firewall sees encrypted traffic to a hosting provider and can say nothing useful about it.",
      "Cloud access security brokers answered the visibility half. The harder half was doing something about it without blocking work, which requires understanding the ACTIVITY inside an application rather than the application itself - the difference between uploading to a corporate tenant and uploading the same file to a personal one, which look nearly identical on the wire.",
      "That distinction is why the product had to understand application semantics rather than just domains, and it is the reason the category could not be served by a proxy that only saw hostnames.",
      "The market has since folded CASB into security service edge, combining it with secure web gateway and zero-trust access, and Netskope built its own global network, NewEdge, rather than renting capacity - a capital decision that only makes sense if you believe inspection has to happen close to the user.",
      "Its acquisitions are on the vendor lineage page.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Netskope",
    externalLabel: "Netskope",
    sources: [
      { label: "Wikipedia: Netskope - founded 2012, CASB origins, the SSE platform and the NewEdge network", url: "https://en.wikipedia.org/wiki/Netskope" },
    ],
  },
  {
    // PING IDENTITY - company history (PRIME step 4, 2026-07-29).
    slug: "ping-identity",
    group: "other",
    name: "Ping Identity",
    founded: 2002,
    careerChapter: { slug: "ping-identity", years: "2025 - present" },
    tagline: "Bet early that identity would have to work between organisations, not just inside one.",
    intro:
      "Andre Durand founded Ping Identity in Denver in 2002, on a bet that looks obvious now and did not then: that the hard identity problem was not authenticating your own staff but letting one organisation's users into another organisation's applications without either side sharing a password database.",
    body: [
      "Federation is the answer, and the standards that make it work - SAML, and later OAuth and OpenID Connect - were being written at roughly the moment the company was founded. Ping built products against them early, and became one of the vendors whose implementations defined what interoperability meant in practice.",
      "The idea underneath is worth stating because it is easy to miss: an assertion signed by a party you trust is better than a credential you have to store. It moves the security problem from protecting secrets to verifying signatures, and every single-sign-on deployment since rests on that trade.",
      "Ownership has changed repeatedly. Vista Equity Partners took it private in 2016, it returned to public markets in 2019, and Thoma Bravo took it private again in 2022 - the same firm that appears elsewhere on this timeline holding Sophos and LANDESK.",
      "In 2023 Thoma Bravo acquired ForgeRock and combined it with Ping, bringing together two of the largest independent identity vendors, and giving the combined portfolio two overlapping product lines to reconcile.",
      "Its acquisitions, and ForgeRock's own, are on the vendor lineage page.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Ping_Identity",
    externalLabel: "Ping Identity",
    sources: [
      { label: "Wikipedia: Ping Identity - founded 2002 by Andre Durand, federation standards, Vista and Thoma Bravo ownership, the ForgeRock combination", url: "https://en.wikipedia.org/wiki/Ping_Identity" },
    ],
  },
  {
    // ZSCALER - company history (PRIME step 4, 2026-07-29).
    slug: "zscaler",
    group: "other",
    name: "Zscaler",
    founded: 2007,
    careerChapter: { slug: "zscaler", years: "2026 - present" },
    tagline: "Argued that if users are not in the office, the security stack should not be either.",
    intro:
      "Jay Chaudhry founded Zscaler in 2007, having already founded and sold several security companies before it. The argument was that backhauling remote users through a corporate data centre to reach the internet was about to stop making sense.",
    body: [
      "The traditional design put inspection where the users were, which was the office, and sent everything else back there over a VPN. That worked while applications lived in the data centre too. Once the applications moved to the cloud and the users moved out of the office, the traffic was travelling to a building neither the user nor the application had any reason to visit.",
      "Zscaler moved the inspection into a distributed set of points of presence, so a user connects to a nearby one, is inspected there, and goes on to wherever the application actually is. That removes the hairpin, and it means capacity is a property of the provider rather than of each office's appliance.",
      "It also changes the economics of scale in a way worth understanding. A shared inspection platform sees traffic from every customer, so a threat identified for one becomes blocked for all - the same structural argument IronPort made about email reputation in 2002 and CrowdStrike made about endpoints in 2013. This timeline shows that argument being rediscovered for each layer of the stack in turn.",
      "The company went public in 2018 and the category it defined became security service edge, in which it competes directly with Netskope, which is also on this site and reached the same place from the visibility problem rather than the routing one.",
      "Its acquisitions are on the vendor lineage page.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Zscaler",
    externalLabel: "Zscaler",
    sources: [
      { label: "Wikipedia: Zscaler - founded 2007 by Jay Chaudhry, the cloud proxy architecture, the 2018 IPO", url: "https://en.wikipedia.org/wiki/Zscaler" },
    ],
  },
  {
    // EXTREME NETWORKS - company history (PRIME step 4, 2026-07-29).
    // Extreme has a vendor hub AND a lineage page with the full deal list, so
    // this entry tells the COMPANY STORY and leaves the acquisition detail
    // where it already lives rather than duplicating it.
    slug: "extreme",
    group: "other",
    name: "Extreme Networks",
    founded: 1996,
    careerChapter: { slug: "extreme", years: "2013 - 2014" },
    tagline: "Grew mostly by buying the enterprise businesses that larger companies had stopped wanting.",
    intro:
      "Extreme Networks was founded in 1996 in Santa Clara by Gordon Stitt, Herb Schneider and Stephen Haddock, all from SynOptics, to build Gigabit Ethernet switches for the enterprise. Its early identity was hardware-led: purpose-built silicon, a single operating system, and a deliberately narrow product line at a time when competitors sold catalogues.",
      body: [
      "The strategy that defines it came later, and it is unusual. Rather than compete for greenfield share against Cisco, Extreme bought the enterprise networking businesses that larger companies were exiting - Enterasys in 2013, Zebra's wireless line in 2016, Avaya's networking business in 2017, Brocade's data centre business in 2017, and Aerohive in 2019.",
      "Each of those was somebody else's strategic retreat. Enterasys was what remained of Cabletron, a company that had once been Cisco's most serious rival. Avaya's networking arm traced to Nortel. Brocade's had come from Foundry. Aerohive had been founded by people out of NetScreen. So Extreme's product line is an accumulation of lineages that this timeline covers separately, and its installed base includes customers who bought from four companies that no longer exist.",
      "That creates a specific engineering problem, and the company has been candid about it: several operating systems inherited at once, and a decade of work convincing an installed base to converge on fewer of them. EXOS and VOSS both persist because both came with customers who had no reason to migrate.",
      "The Fabric Connect work, inherited with the Avaya line and originally from Nortel, is the most technically distinctive thing in the portfolio - shortest path bridging used to make service provisioning an edge-only operation. It is the subject of one of this site's tools, and it arrived through an acquisition of an acquisition.",
      "The full deal list, with what each acquired company had itself acquired, is on the vendor lineage page rather than repeated here.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Extreme_Networks",
    externalLabel: "Extreme Networks",
    sources: [
      { label: "Wikipedia: Extreme Networks - 1996 founding by Gordon Stitt, Herb Schneider and Stephen Haddock from SynOptics, and the acquisition history", url: "https://en.wikipedia.org/wiki/Extreme_Networks" },
      { label: "Wikipedia: Enterasys Networks - the Cabletron successor acquired by Extreme in 2013", url: "https://en.wikipedia.org/wiki/Enterasys_Networks" },
    ],
  },
  {
    // CHECK POINT - company history (PRIME step 4, 2026-07-29).
    // The lineage page carries the deals; this is the company and the idea.
    slug: "check-point",
    group: "other",
    name: "Check Point Software Technologies",
    founded: 1993,
    careerChapter: { slug: "check-point", years: "2026 - present" },
    tagline: "Patented stateful inspection, invented the firewall market, and then watched its own alumni build the competition.",
    intro:
      "Gil Shwed, Marius Nacht and Shlomo Kramer founded Check Point in Tel Aviv in 1993. Shwed had worked on network access separation during military service, and the company's founding product, FireWall-1, introduced stateful inspection to a commercial market that had been making do with packet filters and application proxies.",
    body: [
      "Stateful inspection is the idea worth understanding, because everything since assumes it. A packet filter judges each packet alone, which means it cannot tell a reply from an unsolicited connection and has to leave return ports open. An application proxy understands conversations but terminates them, which is slow and needs code per protocol. Stateful inspection tracked connections in a table and judged packets against that state - the security of understanding the conversation, at close to the speed of filtering.",
      "Check Point patented it, sold it as software on general-purpose hardware, and effectively created the commercial firewall category. Through the late 1990s it held a dominant share of a market it had defined.",
      "What happened next is the more interesting half. Nir Zuk, one of the first employees, left and eventually founded Palo Alto Networks, which overtook Check Point in firewall revenue around 2014. Shlomo Kramer, a co-founder, went on to found Imperva and later Cato Networks. The company's alumni network seeded a substantial part of the Israeli security industry, and several of its competitors.",
      "Check Point itself remained independent, profitable and conservative through decades of consolidation - which on this timeline is genuinely rare. Almost every peer from 1993 has been acquired, split or renamed. It has been criticised for moving slowly on next-generation firewall features and cloud, and it is still here, still under its own name, still run for much of that time by a founder.",
      "The acquisitions it did make, and what those companies had themselves bought, are on the vendor lineage page.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Check_Point",
    externalLabel: "Check Point Software Technologies",
    sources: [
      { label: "Wikipedia: Check Point - founded 1993 by Gil Shwed, Marius Nacht and Shlomo Kramer; FireWall-1 and stateful inspection", url: "https://en.wikipedia.org/wiki/Check_Point" },
      { label: "Wikipedia: Nir Zuk - an early Check Point employee who founded Palo Alto Networks", url: "https://en.wikipedia.org/wiki/Nir_Zuk" },
      { label: "Wikipedia: Shlomo Kramer - Check Point co-founder, later Imperva and Cato Networks", url: "https://en.wikipedia.org/wiki/Shlomo_Kramer" },
    ],
  },
  {
    // PULSE SECURE - company history (PRIME step 4, 2026-07-29).
    // Its ending is already recorded from the Ivanti research: acquired
    // alongside MobileIron, completing 1 December 2020.
    slug: "pulse-secure",
    group: "other",
    name: "Pulse Secure",
    founded: 2014,
    ended: {
      year: 2020,
      note: "Acquired by Ivanti alongside MobileIron, announced September 2020 and completed 1 December.",
    },
    careerChapter: { slug: "pulse-secure", years: "2018 - 2019" },
    tagline: "A company created to hold a product line older than itself.",
    intro:
      "Pulse Secure was formed in 2014 when Juniper sold its Junos Pulse business to Siris Capital. That is an unusual founding: the company existed on day one with a mature product, an installed base and a support obligation, and no history of its own at all.",
    body: [
      "The product was SSL VPN, which Juniper had acquired with NetScreen in 2004 and NetScreen had built on technology from Neoteris. So the code predates the company selling it by more than a decade, and the lineage runs through two acquisitions before the carve-out.",
      "The market it served was the ordinary one: remote users needing access to internal applications without a full network-layer tunnel, authenticated at the edge and given only what policy allowed. Pulse Connect Secure appliances sat at that boundary in a very large number of enterprises and government networks, which is the detail that matters for what happened later.",
      "Being a carve-out shapes a company. Private-equity ownership meant a focus on the installed base and maintenance revenue rather than on reinvention, and the codebase carried a decade of accumulated decisions made inside two previous owners.",
      "Ivanti acquired Pulse Secure in the same announcement as MobileIron, completing on 1 December 2020. Serious vulnerabilities in those VPN appliances were subsequently exploited widely enough to draw emergency directives from national cyber agencies - which is the part of this history that most affected people who never bought anything from the company, since the appliances were sitting in front of networks that mattered.",
      "It is a useful entry precisely because the failure was structural rather than careless. A product line inherited across three owners, each with different priorities and none having written it, is a specific kind of risk, and this timeline shows it happening repeatedly.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Pulse_Secure",
    externalLabel: "Pulse Secure",
    sources: [
      { label: "Wikipedia: Pulse Secure - the 2014 carve-out from Juniper to Siris Capital and the 2020 Ivanti acquisition", url: "https://en.wikipedia.org/wiki/Pulse_Secure" },
      { label: "Redmond Magazine: Ivanti buys MobileIron and Pulse Secure (September 2020)", url: "https://redmondmag.com/articles/2020/09/28/ivanti-buys-mobileiron-and-pulse-secure.aspx" },
    ],
  },
  {
    // FIREEYE / McAFEE / IXIA - company history (PRIME step 4, 2026-07-29).
    // This slug covers the DISTRIBUTION-era portfolio rather than one company,
    // so the history is written as three lineages that happen to share a
    // chapter. McAfee's fuller story lives at mcafee-fireeye-trellix.
    slug: "fireeye-mcafee-ixia",
    group: "other",
    name: "FireEye, McAfee and Ixia",
    founded: 1987,
    careerChapter: { slug: "fireeye-mcafee-ixia", years: "2015 - 2019" },
    tagline: "Three companies that shared a distribution portfolio and almost nothing else.",
    intro:
      "This entry covers three separate lineages carried together through Brazilian value-added distribution: McAfee, founded 1987, the oldest antivirus brand still trading under a version of its name; FireEye, founded 2004, which made its reputation on incident response rather than product; and Ixia, founded 1997, which measured networks rather than defending them.",
    body: [
      "**McAfee** was founded by John McAfee in 1987, sold to Intel in 2011 for around $7.7B, rebranded Intel Security, then spun back out under the McAfee name in 2017 when Intel sold a majority stake to TPG. The enterprise business was later separated and combined with FireEye's products in 2022 to form Trellix, while the consumer business kept the McAfee name.",
      "**FireEye** built its reputation on Mandiant, which it acquired in 2014 for about $1B - a company whose value was its incident responders rather than its software, and which had published the APT1 report in 2013 attributing a large intrusion campaign to a specific unit of the Chinese military. That report changed what security vendors were willing to say publicly about attribution.",
      "In 2021 FireEye sold its products business to Symphony Technology Group and kept the Mandiant name and services, reversing the acquisition in substance: the consultancy shed the product company. Google then acquired Mandiant in 2022 for about $5.4B.",
      "**Ixia** was a test and measurement company - traffic generation, network emulation, and the equipment used to prove that other vendors' equipment does what the datasheet claims. Keysight Technologies acquired it in 2017 for about $1.6B. It belongs beside the other two here because a distribution portfolio does not organise itself by conceptual coherence; it organises by what a channel can sell into the same accounts.",
      "The reason all three appear on one page is that this is what distribution actually looks like from the inside: a portfolio assembled from whatever the market wanted, whose only common factor is the person carrying it.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Trellix",
    externalLabel: "Trellix (the McAfee and FireEye successor)",
    sources: [
      { label: "Wikipedia: McAfee - 1987 founding, the Intel acquisition and the 2017 spin-out", url: "https://en.wikipedia.org/wiki/McAfee" },
      { label: "Wikipedia: FireEye - the Mandiant acquisition, the 2021 products sale to STG, and Trellix", url: "https://en.wikipedia.org/wiki/Trellix" },
      { label: "Wikipedia: Mandiant - the APT1 report and the 2022 Google acquisition at ~$5.4B", url: "https://en.wikipedia.org/wiki/Mandiant" },
      { label: "Wikipedia: Ixia - test and measurement, acquired by Keysight in 2017", url: "https://en.wikipedia.org/wiki/Ixia_(company)" },
    ],
  },
  {
    // CISCO - company history (PRIME step 4, 2026-07-29).
    slug: "cisco",
    group: "other",
    name: "Cisco Systems",
    founded: 1984,
    careerChapter: { slug: "cisco", years: "2003 - 2008" },
    tagline: "Did not invent the router, but was the first to sell one that spoke everybody's protocol at once.",
    intro:
      "Leonard Bosack and Sandy Lerner founded Cisco in December 1984, having worked on connecting incompatible networks at Stanford. The name is the tail of San Francisco and the logo is the Golden Gate Bridge, which tells you the whole company began as a local problem.",
    body: [
      "The problem was that the campus ran several networks that could not talk to each other, each with its own protocol. The multiprotocol router - one box that spoke TCP/IP, AppleTalk, IPX, DECnet and the rest simultaneously - was the answer, and it arrived exactly as organisations everywhere discovered they had the same mess.",
      "That timing is most of the explanation for what followed. Cisco did not have to persuade anyone that internetworking mattered; it had to be the company with a shipping product when they worked it out for themselves. IOS became the language enterprise networking was described in, to the point that competitors shipped IOS-like command lines because that was what operators already knew.",
      "The acquisition machine was the other half. Cisco bought more than two hundred companies, and the strategy was explicit: buy the category rather than build it, integrate the technology into the portfolio, and use the channel to sell it. Crescendo in 1993 became Catalyst. Grand Junction became Fast Ethernet. IronPort, which appears on this timeline in its own right, became the email security line in 2007. Splunk, also here, became the observability and security data business in 2024 at around $28B - the largest purchase in company history.",
      "The certification programme deserves its own mention, because it changed how the industry hires. CCNA, CCNP and CCIE created a vendor-defined competency ladder that employers treated as a proxy for skill, and every vendor on this site with a certification track is working from a template Cisco established.",
      "It has been challenged in every segment it occupies and has lost ground in several, but the shape of enterprise networking - the vocabulary, the certification model, the assumption that one vendor can supply the whole stack - is substantially Cisco's design.",
    ],
    acquisitions: [
      { year: 1993, name: "Crescendo Communications", price: "$95M", what: "Switching technology, and Cisco's first major acquisition.", became: "The Catalyst line, which became the dominant enterprise switch family for two decades." },
      { year: 2007, name: "IronPort Systems", price: "~$830M", what: "Email security built on sender reputation rather than content inspection.", became: "Cisco Email Security Appliance. IronPort has its own entry on this timeline.",
        subAcquisitions: [ { year: 2000, name: "IronPort's SenderBase approach (origin, not a purchase)", what: "Founded on the argument that WHO sends a message predicts spam better than what it contains - an argument cloud security has repeated ever since." } ] },
      { year: 2024, name: "Splunk", price: "~$28B", what: "Machine data search, observability and security analytics. Announced September 2023, completed 18 March 2024.", became: "Cisco's security and observability business, and the largest acquisition it has ever made. Splunk has its own entry here." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Cisco",
    externalLabel: "Cisco Systems",
    sources: [
      { label: "Wikipedia: Cisco - founded December 1984 by Leonard Bosack and Sandy Lerner, the multiprotocol router, the acquisition history", url: "https://en.wikipedia.org/wiki/Cisco" },
      { label: "Wikipedia: Splunk - the ~$28B Cisco acquisition completed 18 March 2024", url: "https://en.wikipedia.org/wiki/Splunk" },
    ],
  },
  {
    // PALO ALTO NETWORKS - company history (PRIME step 4, 2026-07-29).
    slug: "palo-alto",
    group: "other",
    name: "Palo Alto Networks",
    founded: 2005,
    careerChapter: { slug: "palo-alto", years: "2013 - 2015" },
    tagline: "Founded by a Check Point alumnus on the argument that port numbers had stopped meaning anything.",
    intro:
      "Nir Zuk founded Palo Alto Networks in 2005. He had been one of Check Point's first employees, then founded OneSecure, which NetScreen acquired in 2002 and Juniper acquired along with NetScreen in 2004. He left the year after and built the company that would overtake his first employer.",
    body: [
      "The founding observation was that traditional firewalls made decisions on ports and addresses, and applications had stopped respecting either. Everything tunnelled over 80 and 443, so a rule permitting web traffic permitted essentially anything, and the firewall's policy no longer described what was actually allowed.",
      "The answer was App-ID: identify the application from the traffic itself rather than the port it arrived on, and write policy in those terms. That reframing is what the industry ended up calling the next-generation firewall, and every incumbent eventually shipped its own version - which is the clearest evidence the argument was correct.",
      "It went public in 2012 and passed Check Point in firewall revenue around 2014, roughly nine years after being founded by someone who had helped build Check Point's first products.",
      "Since then it has expanded by acquisition into endpoint, cloud security and security operations, and has been notably willing to buy categories rather than wait to build them - a pattern this timeline shows repeating in every generation of security vendor.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Palo_Alto_Networks",
    externalLabel: "Palo Alto Networks",
    sources: [
      { label: "Wikipedia: Palo Alto Networks - founded 2005 by Nir Zuk, App-ID, the 2012 IPO", url: "https://en.wikipedia.org/wiki/Palo_Alto_Networks" },
      { label: "Wikipedia: Nir Zuk - Check Point, OneSecure, NetScreen and Juniper before founding Palo Alto Networks", url: "https://en.wikipedia.org/wiki/Nir_Zuk" },
    ],
  },
  {
    // NETSCREEN / JUNIPER - company history (PRIME step 4, 2026-07-29).
    // The NetScreen founder web was verified earlier this week and is the
    // single most connected fact on this timeline: Ken Xie -> Fortinet,
    // Nir Zuk -> Palo Alto, Changming Liu -> Aerohive -> Extreme.
    slug: "netscreen-juniper",
    group: "other",
    name: "NetScreen and Juniper Networks",
    founded: 1996,
    careerChapter: { slug: "netscreen-juniper", years: "2009 - 2014" },
    tagline: "One firewall company whose alumni went on to found or shape most of the others.",
    intro:
      "NetScreen was founded in 1996 by Yan Ke, Ken Xie and Feng Deng, on the argument that firewalling should be done in silicon rather than on a general-purpose processor. Juniper Networks, founded in 1996 by Pradeep Sindhu out of Xerox PARC, bought it in 2004 for roughly $4B in stock - and the more interesting story is who left.",
    body: [
      "The ASIC argument was the founding one. Software firewalls of the mid-1990s ran on commodity CPUs and slowed down as rules accumulated, so NetScreen built purpose-designed silicon and sold predictable throughput. That is the same argument every hardware security vendor has made since, and NetScreen made it first at scale.",
      "Ken Xie left in 2000 and founded Fortinet with his brother Michael. Fortinet appears on this site as a vendor whose training is delivered by its author.",
      "NetScreen bought OneSecure in 2002, which had been founded by Nir Zuk - one of Check Point's first employees. Zuk stayed through the Juniper acquisition, left in 2005, and founded Palo Alto Networks, which overtook Check Point in firewall revenue by 2014.",
      "Changming Liu, also from NetScreen, co-founded Aerohive, which Extreme Networks acquired in 2019.",
      "So a single 1996 startup seeded Fortinet, Palo Alto Networks and part of Extreme, and absorbed a company founded by an early Check Point employee on the way. Four of the eight vendors this site teaches trace some part of themselves to that one building.",
      "Juniper itself was the other half of this chapter. Founded to build carrier routers that could survive internet-scale traffic, it made JUNOS - one operating system across the line, with a configuration model that committed atomically or not at all - and spent two decades as the credible alternative to Cisco in service provider networks. Its SSL VPN business was later carved out and sold, becoming Pulse Secure, which is a separate chapter here and ended inside Ivanti.",
    ],
    acquisitions: [
      { year: 2002, name: "OneSecure", price: "$40-45M in stock", what: "Intrusion prevention.", founder: "Nir Zuk and Rakesh Loonkar. Zuk was one of Check Point's first employees.", became: "Zuk left in 2005 and founded Palo Alto Networks." },
      { year: 2004, name: "NetScreen acquired BY Juniper", price: "~$4B in stock", what: "The firewall and VPN business, in one of the largest security acquisitions of its era.", became: "Juniper's security line; the SSL VPN part was later sold and became Pulse Secure.",
        subAcquisitions: [ { year: 2002, name: "OneSecure (already inside NetScreen)", what: "So Juniper acquired Nir Zuk's company by acquiring the company that had acquired it - and lost him a year later to the firm that would become its competitor." } ] },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/NetScreen_Technologies",
    externalLabel: "NetScreen Technologies",
    sources: [
      { label: "Wikipedia: NetScreen Technologies - founders Yan Ke, Ken Xie and Feng Deng; the OneSecure purchase; the $4B Juniper acquisition", url: "https://en.wikipedia.org/wiki/NetScreen_Technologies" },
      { label: "Wikipedia: Nir Zuk - Check Point, OneSecure, NetScreen, and founding Palo Alto Networks in 2005", url: "https://en.wikipedia.org/wiki/Nir_Zuk" },
      { label: "Wikipedia: Juniper Networks - founded 1996 by Pradeep Sindhu, JUNOS, and the security line", url: "https://en.wikipedia.org/wiki/Juniper_Networks" },
    ],
  },
  {
    // CABLETRON / ENTERASYS - company history (PRIME step 4, 2026-07-29).
    // Founders verified earlier this week: Robert Levine and Craig Benson,
    // March 1983, in Levine's garage. The four-way split is the reason three
    // other entries on this timeline exist at all.
    slug: "cabletron-enterasys",
    group: "other",
    name: "Cabletron Systems and Enterasys",
    founded: 1983,
    ended: {
      year: 2013,
      note: "Enterasys, the enterprise remnant of Cabletron, was acquired by Extreme Networks in 2013 for $180M.",
    },
    careerChapter: { slug: "cabletron-enterasys", years: "1996 - 2007" },
    tagline: "Sold cable assemblies out of a garage, grew into Cisco's most serious rival, then dismantled itself on purpose.",
    intro:
      "Robert Levine and Craig Benson founded Cabletron Systems in Rochester, New Hampshire in March 1983, working out of Levine's garage and selling cable assemblies. It became one of the largest networking companies in the world, and for a period in the early 1990s it was the credible alternative to Cisco in the enterprise.",
    body: [
      "The product that made it was the MMAC hub, and later the SmartSwitch line, sold with an operating philosophy that was unusual for the era: Cabletron ran its own field service organisation rather than pushing everything through resellers, which is why it had a reputation for showing up.",
      "It bought aggressively through the 1990s, and the acquisitions matter more than the revenue figures, because they are what the company eventually broke apart into.",
      "In 2000 Cabletron announced it would split itself into four independent companies rather than be broken up by anyone else. Enterasys took the enterprise switching business, Riverstone took the carrier and metro routing business built on Yago, Aprisma took network management with the Spectrum platform, and GlobalNetwork Technology Services took professional services. It is one of the few examples of a large networking company choosing dissolution as a strategy.",
      "Enterasys carried the enterprise name for a decade, weathering an accounting scandal that led to executive convictions, before being taken private and then acquired by Extreme Networks in 2013 for $180M. So the enterprise line that began in a New Hampshire garage in 1983 now ships as Extreme.",
      "The through-line worth noticing is that four separate entries on this timeline - Enterasys, Riverstone, Aprisma and eventually Extreme - all trace to the same 1983 garage, and two of them appear here as chapters of a career as well as companies.",
    ],
    acquisitions: [
      { year: 1998, name: "Yago Systems", price: "~$180M", what: "Wire-speed Layer 3 switching, which became the SmartSwitch Router.", became: "Spun out as Riverstone Networks in 2001, and an entry of its own on this timeline." },
      { year: 1998, name: "Digital Equipment's network products business", price: "~$430M", what: "DEC's networking division, bought from Digital shortly before Compaq acquired the rest of it.",
        subAcquisitions: [ { year: 1957, name: "Digital Equipment Corporation (origin, not a purchase)", what: "DEC was founded in 1957 and defined the minicomputer era; its networking arm ended up at Cabletron and the remainder at Compaq in 1998, which HP then acquired in 2002." } ] },
      { year: 1996, name: "Network Express and ZeitNet", what: "ISDN remote access and ATM switching, bought in the same year as the market argued about which technology would carry the enterprise backbone." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Cabletron_Systems",
    externalLabel: "Cabletron Systems",
    sources: [
      { label: "Wikipedia: Cabletron Systems - founded March 1983 by Robert Levine and Craig Benson, the 2000 four-way split into Enterasys, Riverstone, Aprisma and GNTS", url: "https://en.wikipedia.org/wiki/Cabletron_Systems" },
      { label: "Wikipedia: Enterasys Networks - the enterprise successor and the 2013 Extreme acquisition at $180M", url: "https://en.wikipedia.org/wiki/Enterasys_Networks" },
    ],
  },
  {
    // RIVERSTONE NETWORKS - company history (PRIME step 4, 2026-07-29).
    // The autobiography that used to live on this page now sits at
    // /about/vendors/riverstone; what remains is the company itself. The
    // lineage facts were already verified in the Cabletron research earlier
    // this week.
    slug: "riverstone",
    group: "other",
    name: "Riverstone Networks",
    founded: 1996,
    ended: {
      year: 2006,
      note: "Assets acquired by Lucent Technologies in early 2006 following a Chapter 11 filing, and absorbed into Alcatel-Lucent when the two merged later that year.",
    },
    careerChapter: { slug: "riverstone", years: "2000 - 2002" },
    tagline: "Spun out of Cabletron to chase the metro Ethernet boom, and ran out of road when the boom stopped.",
    intro:
      "Riverstone began as Yago Systems, a startup building wire-speed Layer 3 switching, which Cabletron acquired in 1998 and used as the basis of its SmartSwitch Router line. When Cabletron broke itself into four companies at the turn of the millennium, the routing business became Riverstone Networks and was spun out as an independent public company in 2001.",
    body: [
      "Its market was metropolitan Ethernet: carriers replacing SONET and ATM gear with Ethernet in city-scale networks, delivering services to business customers over fibre rings. That was a genuinely new category around 2000, and Riverstone was among the companies that defined what the equipment for it should look like - Gigabit Ethernet, MPLS, and per-subscriber service delivery in boxes designed for a carrier's central office rather than an enterprise wiring closet.",
      "The timing was the problem. The company was spun out precisely as telecom capital spending collapsed. Carriers that had been building metro networks stopped, and a vendor whose entire market was carrier expenditure had nowhere to go.",
      "An accounting investigation into how revenue had been recognised made it worse, delaying filings and forcing restatements. Riverstone filed for Chapter 11 in February 2006 and its assets were bought by Lucent Technologies, which merged with Alcatel later the same year - so the technology ended up inside Alcatel-Lucent, and eventually inside Nokia.",
      "The engineering was not what failed. Yago's wire-speed forwarding was good enough that Cabletron built its next generation on it, and the metro Ethernet thesis turned out to be correct - it simply arrived several years before the market was ready to pay for it, and Riverstone did not have the balance sheet to wait.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Riverstone_Networks",
    externalLabel: "Riverstone Networks",
    sources: [
      { label: "Wikipedia: Riverstone Networks - Yago origins, Cabletron acquisition, 2001 spin-off, Chapter 11 and the Lucent asset purchase", url: "https://en.wikipedia.org/wiki/Riverstone_Networks" },
      { label: "Wikipedia: Cabletron Systems - the four-way split that produced Riverstone, Enterasys, Aprisma and GNTS", url: "https://en.wikipedia.org/wiki/Cabletron_Systems" },
    ],
  },
  {
    // IRONPORT - company history (PRIME step 4, 2026-07-29).
    slug: "ironport",
    group: "other",
    name: "IronPort Systems",
    founded: 2000,
    ended: {
      year: 2007,
      note: "Acquired by Cisco for approximately $830M, announced January 2007, and folded into Cisco's security business.",
    },
    careerChapter: { slug: "ironport", years: "2004 - 2005" },
    tagline: "Worked out that the useful question about an email was not what it contained but who sent it.",
    intro:
      "IronPort was founded in 2000 by Scott Weiss and Scott Banister to build email security appliances at a moment when spam was moving from an annoyance to an operational cost. Its answer was not a better content filter but a different question entirely.",
    body: [
      "Content filtering asks whether a message looks like spam. That is an arms race, because the sender can rewrite the message. IronPort's SenderBase asked instead who was sending it, and how that sender had behaved everywhere else - volume, complaint rates, how long the address had been sending mail at all. A sender with no history and sudden volume is suspicious regardless of what the message says.",
      "That reputation data was aggregated across every customer, which made the network itself the product: the more organisations used it, the better the signal. It is the same structural argument that cloud-delivered security has made ever since, and IronPort was making it about email in 2002.",
      "The appliances ran a purpose-built mail transfer agent designed to hold enormous numbers of simultaneous connections, because a mail gateway under a spam flood fails on connection handling long before it fails on filtering.",
      "Cisco announced the acquisition in January 2007 for around $830M. The technology became Cisco's Email Security Appliance line, and the reputation approach outlived the brand by decades.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/IronPort",
    externalLabel: "IronPort Systems",
    sources: [
      { label: "Wikipedia: IronPort - founded 2000, SenderBase reputation, the 2007 Cisco acquisition at ~$830M", url: "https://en.wikipedia.org/wiki/IronPort" },
    ],
  },
  {
    // TANDY / RADIOSHACK - added 2026-07-29 (PRIME).
    // The deep point here is DISTRIBUTION, not hardware - Tandy outsold Apple
    // three to one in 1980 on a technically inferior machine because it had
    // 7,000 shops. This site has a distribution career chapter (2015-2019), so
    // the lesson is not abstract.
    // Verified against IEEE Spectrum, TIME, Google Arts & Culture and
    // History-Computer. NOTE: sources give both $399 and $600 for the Model I
    // launch price; both are recorded rather than one being chosen.
    slug: "tandy-radioshack",
    group: "other",
    name: "Tandy and RadioShack",
    founded: 1977,
    ended: {
      year: 1993,
      note: "Tandy exited computer manufacturing in May 1993, selling the business to AST. The RadioShack chain continued long after the machines stopped.",
    },
    tagline: "Outsold Apple three to one with a worse computer, because it had seven thousand shops.",
    intro:
      "In 1975 Don French, a RadioShack buyer on the West Coast, bought an MITS Altair to run inventory and became fascinated enough to start designing his own. He spent a year persuading John Roach, then vice president of manufacturing, that a chain of electronics shops should sell a computer. In November 1976 they hired a 24-year-old from National Semiconductor named Steve Leininger - a Homebrew Computer Club member, like Jobs and Wozniak - to design it.",
    body: [
      "The prototype was demonstrated to Charles Tandy in February 1977, running a tax-accounting program. Tandy himself was a Texan who had built the business out of his father's Fort Worth leather company; the electronics chain was an acquisition that outgrew everything else.",
      "Roach committed to building 3,000 units, a number chosen because it matched the number of RadioShack stores - if they never sold one, each shop could use it for accounting. Leininger argued for at least 50,000 and was laughed at. The TRS-80 was announced on 3 August 1977 and sold roughly 50,000 in its first month.",
      "It was, on the merits, the weakest of what Byte magazine christened the 1977 Trinity. The Apple II had colour graphics and expansion slots; the Commodore PET had an integrated design; the TRS-80 had a Zilog Z80 chosen because it cost $25, a cassette recorder from the shop shelf for storage, and quality complaints that were entirely justified. It also cost roughly half what an Apple II did.",
      "And it won, for years. By 1979 it had the largest software library in the microcomputer market. In 1980 Tandy shipped three times as many computers as Apple. RadioShack was the largest retailer of personal computers in the world through 1982, with a claimed 7,000 stores in 40 countries.",
      "The reason is the whole lesson: everyone else sold computers by mail order or through a handful of specialist dealers, and Tandy sold them off a shelf that customers were already walking past. RadioShack did not adopt superstore retailing until 1991, by which time the advantage had inverted - IBM compatibles and the Macintosh were sold everywhere, and being in your own shops was no longer being everywhere. Tandy left computer manufacturing in May 1993.",
      "It is worth sitting with, because the pattern recurs constantly and is usually described the wrong way round. Tandy did not beat Apple on technology; it beat Apple on reach, and then lost when reach became commoditised. Anyone who has worked in distribution recognises both halves of that.",
    ],
    externalUrl: "https://spectrum.ieee.org/the-consumer-electronics-hall-of-fame-tandyradioshack-trs80-model-1",
    externalLabel: "IEEE Spectrum: the TRS-80 Model 1",
    sources: [
      { label: "IEEE Spectrum: Consumer Electronics Hall of Fame - the Z80 at $25, cassette storage, largest PC retailer through 1982", url: "https://spectrum.ieee.org/the-consumer-electronics-hall-of-fame-tandyradioshack-trs80-model-1" },
      { label: "History-Computer: Don French and the Altair, hiring Leininger from National Semiconductor, the February 1977 demo to Charles Tandy, 3x Apple's volume in 1980", url: "https://history-computer.com/trs-80-guide/" },
      { label: "TIME: the 3 August 1977 launch and Tandy's role in the mass-market personal computer", url: "https://time.com/3968790/tandy-trs-80-history/" },
      { label: "CyberNews: the 3,000-unit commitment, Leininger's 50,000 estimate, and the May 1993 exit", url: "https://cybernews.com/editorial/from-hero-to-zero-meteoric-rise-and-fall-of-tandy-computers/" },
      { label: "Google Arts & Culture: the 1977 Trinity and RadioShack's retail advantage", url: "https://artsandculture.google.com/story/booting-up-the-rise-of-the-pc-the-henry-ford/0gWhveNQO9qRKg" },
    ],
  },
  {
    // CROWDSTRIKE - added 2026-07-29 (PRIME). Closes a McAfee loop: Kurtz was
    // McAfee's CTO, and McAfee appears on this site both as a lineage entry and
    // inside a career chapter. The July 2024 outage is included in full,
    // because a page that records what vendors got right and omits the largest
    // IT failure in history would not be worth reading.
    // Verified against Wikipedia, Grokipedia, Forbes and contemporaneous
    // reporting.
    slug: "crowdstrike",
    group: "contemporary",
    name: "CrowdStrike",
    founded: 2011,
    tagline: "Built on the argument that you should hunt the attacker rather than the malware - then proved, in one morning, what a lightweight agent everywhere really means.",
    intro:
      "CrowdStrike was incorporated on 7 November 2011 by George Kurtz, Dmitri Alperovitch and Gregg Marston. Kurtz had been chief technology officer at McAfee, having sold it his previous company, Foundstone, in 2004. He resigned, spent a spell as an entrepreneur in residence at Warburg Pincus, and left with a $26M cheque from them to build the thing he thought McAfee could not.",
    body: [
      "The founding argument was specific rather than promotional. Signature-based antivirus asks 'have I seen this file before', which is answerable only about attacks that have already happened somewhere else, and the scanning it requires is heavy enough that users disable it. Alperovitch had attributed the 2009 Operation Aurora intrusions to Chinese actors while at McAfee, and the lesson both founders took was that the interesting question is not which malware is present but which adversary is operating - and adversaries reuse behaviour even when they change their tools.",
      "So Falcon, shipped in 2013, inverted the model: a deliberately light agent that streams telemetry to a cloud where behaviour is correlated across every customer at once. One organisation seeing something odd becomes every organisation knowing about it. That is a genuinely different product from an on-premises scanner, and it is why the company grew as fast as it did.",
      "The investigations made the name. Sony Pictures in 2014, the Democratic National Committee intrusions in 2015 and 2016 - work that put a private company in the middle of a national political argument, which is a position security vendors had not previously occupied.",
      "It went public in June 2019 at roughly $14B, rose over 70% on the first day, and joined the S&P 500 in 2024.",
      "Then, on 19 July 2024 at 04:09 UTC, a faulty configuration update to the Falcon sensor crashed an estimated 8.5 million Windows machines and left them unable to restart. Airlines, hospitals, banks, broadcasters and payment terminals stopped. It is generally described as the largest IT outage in history, with damage estimated near $10B, and it produced duelling lawsuits between CrowdStrike and Delta Air Lines.",
      "The uncomfortable part is that the outage was not a failure of the architecture so much as its logical conclusion. A lightweight agent with kernel access on millions of machines, updated centrally and rapidly, is exactly what made the detection model work - and exactly what made one bad file global before anyone could intervene. Every property that made the product good made the failure big. That trade is worth understanding before deploying anything shaped the same way, which is most of modern security.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/CrowdStrike",
    externalLabel: "CrowdStrike",
    sources: [
      { label: "Wikipedia: CrowdStrike - founders, 2019 IPO, S&P 500 in 2024, the 19 July 2024 outage and the Delta litigation", url: "https://en.wikipedia.org/wiki/CrowdStrike" },
      { label: "Grokipedia: CrowdStrike - Kurtz as McAfee CTO, Alperovitch and Operation Aurora, Warburg Pincus funding, IPO valuation", url: "https://grokipedia.com/page/CrowdStrike" },
      { label: "TechCrunch: the $26M Series A and Kurtz's move from McAfee via Warburg Pincus", url: "https://techcrunch.com/?p=507029" },
      { label: "Forbes: George Kurtz - Foundstone founded 1999, acquired by McAfee 2004", url: "https://www.forbes.com/profile/george-kurtz/" },
    ],
  },
  {
    // SPLUNK - added 2026-07-29 (PRIME). Closes another loop: it ended inside
    // CISCO, which is a career chapter on this site. Verified against
    // Wikipedia, Grokipedia and contemporaneous coverage of the acquisition.
    slug: "splunk",
    group: "contemporary",
    name: "Splunk",
    founded: 2003,
    ended: {
      year: 2024,
      note: "Acquired by Cisco for approximately $28B, announced 21 September 2023 and completed 18 March 2024. It continues as a Cisco business unit.",
    },
    tagline: "Named after caving, because that is what searching your own logs felt like.",
    intro:
      "Michael Baum, Rob Das and Erik Swan founded Splunk in San Francisco in October 2003, having each spent years on infrastructure software and arrived at the same complaint: finding anything in machine-generated logs meant crawling through them by hand. They named the company after spelunking.",
    body: [
      "The technical decision that made it work was schema-on-read. A relational database demands you decide the shape of your data before you store it, which is impossible when the data is whatever a hundred different systems happen to emit. Splunk indexed the text as it arrived and let structure be applied at search time instead. That inversion is why it could ingest anything, and it is the idea the whole product rests on.",
      "The go-to-market was equally deliberate: a free tier of 500MB a day, adopted by engineers who then brought it into their employers. Bottom-up rather than top-down, years before that was a recognised strategy.",
      "It raised about $40M in total - modest for what it became - was profitable by 2009, and went public in 2012 at roughly $1.6B. Baum had stepped down as chief executive in 2009; he moved to Burgundy in 2014 and bought a winery, which is a more graceful exit than most of this timeline offers.",
      "Cisco announced the acquisition on 21 September 2023 and completed it on 18 March 2024 for approximately $28B, one of the largest software deals ever made. Cisco is a chapter in this site's own career record, so the two ends of that transaction both appear on this page.",
    ],
    acquisitions: [
      { year: 2013, name: "BugSense and Cloudmeter", what: "Mobile analytics and network data capture, bought within months of each other.", became: "Mobile intelligence and wire-data ingestion." },
      { year: 2018, name: "VictorOps", price: "$120M", what: "On-call incident management.", became: "Splunk On-Call." },
      { year: 2019, name: "SignalFx", price: "$1.05B", what: "Real-time cloud monitoring, and the largest purchase Splunk made.", became: "Splunk Observability Cloud - the second half of a story that had been only about logs." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Splunk",
    externalLabel: "Splunk",
    sources: [
      { label: "Wikipedia: Splunk - founded October 2003, the three founders, IPO 2012, Cisco parent", url: "https://en.wikipedia.org/wiki/Splunk" },
      { label: "Grokipedia: Splunk - wholly-owned Cisco subsidiary from 18 March 2024, ~$28B", url: "https://grokipedia.com/page/Splunk" },
      { label: "CNBC: the $28B sale, Baum's tenure to 2009 and his move to Burgundy", url: "https://www.cnbc.com/2023/09/23/splunk-sold-for-28-billion-steve-jobs-inspired-co-founder-in-college.html" },
    ],
  },
  {
    // NETAPP - added 2026-07-29 (PRIME). Another entry that closes loops:
    // co-founder Michael Malcolm had worked at Sun, Tandem and Auspex - the
    // first two now on this timeline with end-years - and went on to found
    // CacheFlow, which became Blue Coat, also already here. NetApp then SOLD a
    // product line to Blue Coat in 2006.
    // Verified against Wikipedia and Grokipedia.
    slug: "netapp",
    group: "contemporary",
    name: "NetApp",
    founded: 1992,
    tagline: "Named itself after exactly what it sold, which turned out to be most of the strategy.",
    intro:
      "Network Appliance was founded in Sunnyvale in 1992 by David Hitz, James Lau and Michael Malcolm, on the observation that building file storage out of general-purpose servers was harder than it needed to be. The product was an appliance: a box that did one job, with an operating system - Data ONTAP - written for that job alone.",
    body: [
      "The name said what it was, which was an advantage in a market where everything else was assembled from parts. The first filer shipped in 1993, Sequoia funded the company in 1994, and it went public in 1995.",
      "Its main competitor at the outset was Auspex Systems, where both Hitz and Malcolm had previously worked - which is the ordinary way storage companies begin, with people leaving one to build the thing it would not.",
      "The dot-com years took NetApp past $1B in annual revenue. When the bubble burst, revenue fell to around $800M in fiscal 2002, and the recovery from there was slow and unglamorous rather than dramatic. It changed its legal name from Network Appliance to NetApp in 2008.",
      "Two threads worth following from here. Michael Malcolm left the chief executive role in 1994 and founded CacheFlow in 1996, which became Blue Coat Systems - and in 2006 NetApp sold its NetCache product line to Blue Coat, so a company sold a business to the firm its own co-founder had built. Malcolm's earlier career had run through Sun Microsystems and Tandem Computers, both of which appear on this timeline having ended inside somebody else.",
      "Hitz and Lau shared the IEEE Reynold B. Johnson Information Storage Systems Award in 2007. Hitz retired in 2019.",
    ],
    acquisitions: [
      { year: 2003, name: "Spinnaker Networks", price: "$300M", what: "Clustered storage technology.", became: "The clustered Data ONTAP architecture." },
      { year: 2008, name: "Onaro", price: "$120M", what: "Storage service management.", became: "SANscreen, later OnCommand Insight." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/NetApp",
    externalLabel: "NetApp",
    sources: [
      { label: "Wikipedia: NetApp - 1992 founding, the three founders, Auspex as first competitor, Sequoia 1994, IPO 1995, name change 2008", url: "https://en.wikipedia.org/wiki/NetApp" },
      { label: "Grokipedia: Michael Malcolm - first CEO 1992-1994, prior roles at Sun, Quantum, Auspex and Tandem, and founding CacheFlow which became Blue Coat", url: "https://grokipedia.com/page/michael_malcolm" },
      { label: "Wikipedia: David Hitz - the 2007 IEEE award and 2019 retirement", url: "https://en.wikipedia.org/wiki/David_Hitz" },
    ],
  },
  {
    // SOPHOS - added 2026-07-29 (PRIME). One of the few security companies old
    // enough to predate the commercial internet, and still trading under its
    // own name forty years on - which on this timeline is genuinely unusual.
    // Verified against Wikipedia.
    slug: "sophos",
    group: "contemporary",
    name: "Sophos",
    founded: 1985,
    tagline: "Started in Oxford the year before the first PC virus spread, and is still here under its own name.",
    intro:
      "Jan Hruska and Peter Lammer founded Sophos at Oxford in September 1985, writing virus detection for the IBM PC before most people had encountered a virus. The name is the Greek for wisdom, chosen to signal a research-led posture rather than a product one.",
    body: [
      "The early business was deliberately narrow: corporate and educational customers in Britain and Europe, largely self-funded, at a time when antivirus was a cottage industry of individual researchers trading samples. By the early 1990s it was protecting thousands of enterprise endpoints.",
      "It expanded into encryption, then into unified threat management, and became one of the few security vendors whose product line spans endpoint and network without either half having been bought in late.",
      "Sophos listed on the London Stock Exchange in 2015 and was taken private by Thoma Bravo in 2020 - the same firm that appears elsewhere on this timeline holding LANDESK before Ivanti, and Ping Identity before ForgeRock. It has since acquired Secureworks.",
      "What makes it notable here is longevity of a specific kind. Almost every company on this page that started in the 1980s has ended inside another one. Sophos is forty years old, privately held, and still trading under the name its founders chose.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Sophos",
    externalLabel: "Sophos",
    sources: [
      { label: "Wikipedia: Sophos - founded 1985 by Jan Hruska and Peter Lammer, Abingdon, LSE 2015-2020, Thoma Bravo, Secureworks", url: "https://en.wikipedia.org/wiki/Sophos" },
    ],
  },
  {
    // IVANTI - added 2026-07-29 (PRIME). It closes THREE loops at once, which
    // is why it earns a longer entry than its age suggests:
    //   * MobileIron - a Red Education partner on this site - ended here
    //   * Pulse Secure - a CAREER chapter on this site - ended here, same day
    //   * Avocent, already present in the cyclades-avocent-vertiv entry, owned
    //     LANDESK before Thoma Bravo did
    // Verified against Ivanti's own history pages, Wikipedia and Grokipedia.
    slug: "ivanti",
    group: "contemporary",
    name: "Ivanti",
    founded: 2017,
    tagline: "A 2017 company assembled from forty years of other people's software, and the place two vendors on this site came to rest.",
    intro:
      "Ivanti was created on 23 January 2017 when Clearlake Capital bought LANDESK from Thoma Bravo and merged it with HEAT Software. Neither half was new: the lineage behind it runs back to 1985, and almost nothing in the portfolio was written by the company whose name is on it.",
    body: [
      "The LANDESK side began as LANSystems in 1985, was acquired by Intel in 1991 and run as its LANDESK division, and was spun out as an independent company in 2002. Avocent bought it in 2006 for $416M - the same Avocent that appears elsewhere on this timeline in the Cyclades lineage - and Thoma Bravo took it in 2010. Along the way LANDESK absorbed Wavelink (2012), Shavlik from VMware (2013), Naurtech (2014), Xtraction (2015) and AppSense (2016).",
      "The HEAT side was itself assembled, formed in 2015 from FrontRange Solutions and Lumension Security. Lumension had started as High Tech Software in 1991 and been renamed PatchLink in 1999.",
      "Ivanti kept buying: Concorde Solutions and RES Software in 2017, then Cherwell and RiskSense. In September 2020 it announced the acquisition of both MobileIron and Pulse Secure, completing on 1 December that year - which is how two companies that appear elsewhere on this site came to end on the same day, in the same place.",
      "MobileIron had been founded in 2007 by Ajay Mishra and Suresh Batchu and taken public on NASDAQ in 2014. Pulse Secure carried Juniper's SSL VPN business, sold to Siris Capital in 2014.",
      "The company became more widely known after serious vulnerabilities in the VPN appliances it sells, which is worth recording rather than omitting: a portfolio assembled from a dozen acquisitions inherits a dozen codebases, and the security posture of the whole is the security posture of the weakest piece.",
    ],
    acquisitions: [
      { year: 2017, name: "Concorde Solutions and RES Software", what: "Software asset management from the UK, and workspace automation and identity from the Netherlands and US.", became: "The service-management and automation layers." },
      { year: 2020, name: "MobileIron", what: "Mobile device management and zero-trust access for endpoints. Announced September 2020, completed 1 December.", became: "Ivanti Neurons for MDM. MobileIron appears on this site in its own right as a Red Education training partner.", founder: "Ajay Mishra and Suresh Batchu, 2007; IPO on NASDAQ 2014" },
      { year: 2020, name: "Pulse Secure", what: "Hybrid secure access, acquired in the same announcement and completed the same day as MobileIron.", became: "Ivanti Connect Secure - the VPN line that later drew serious vulnerability disclosures.",
        subAcquisitions: [ { year: 2014, name: "Juniper's SSL VPN business (by Siris Capital)", what: "Pulse Secure was carved out of Juniper and sold to private equity, which is why a company founded in 2014 carried a product line older than itself. Juniper is a chapter in this site's own career record." } ] },
    ],
    externalUrl: "https://www.ivanti.com/company/history",
    externalLabel: "Ivanti: mergers, acquisitions and milestones",
    sources: [
      { label: "Ivanti: LANDESK history - LANSystems 1985, Intel 1991, spin-off 2002, Thoma Bravo, the acquisition list", url: "https://www.ivanti.com/company/history/landesk" },
      { label: "Wikipedia: Ivanti - formation January 2017, Avocent's $416M purchase, HEAT from FrontRange and Lumension", url: "https://en.wikipedia.org/wiki/Ivanti" },
      { label: "Wikipedia: MobileIron - founded 2007, IPO 2014, acquired by Ivanti", url: "https://en.wikipedia.org/wiki/MobileIron" },
      { label: "Redmond Magazine: Ivanti buys MobileIron and Pulse Secure (September 2020)", url: "https://redmondmag.com/articles/2020/09/28/ivanti-buys-mobileiron-and-pulse-secure.aspx" },
    ],
  },
  {
    // EMC - added 2026-07-28 (PRIME). It closes a loop opened the same day:
    // Data General was marked as ending in 1999 because EMC bought it, and EMC
    // itself then ended inside Dell. The timeline can now show both halves.
    // Verified against EMC's own SEC merger filings and Wikipedia.
    slug: "emc",
    group: "other",
    name: "EMC Corporation",
    founded: 1979,
    ended: {
      year: 2016,
      note: "Acquired by Dell for $67B - the largest technology acquisition ever at the time - forming Dell Technologies. The Dell EMC brand persisted on products until around 2020.",
    },
    tagline: "Made storage a category of its own, then became the largest technology acquisition in history.",
    intro:
      "EMC was incorporated in Massachusetts in August 1979 by Richard Egan and Roger Marino, whose initials are the E and the M. It began selling memory boards and became the company that made enterprise storage a purchase decision in its own right rather than something bundled with a server.",
    body: [
      "The strategy was unusual and deliberate: persuade customers to choose storage independently of who supplied the rest of their infrastructure. That is why EMC ended up selling into IBM, HP and Sun accounts alike, and why 'best of breed' became a phrase storage buyers used.",
      "It bought heavily. Data General in 1999, largely for the CLARiiON array line, which is how one of the first minicomputer companies ended up inside a storage vendor. Documentum and Legato in 2003. RSA Security in 2006, which put a security business inside a storage company. VMware in 2004, for $625M, which turned out to be the most consequential of them all.",
      "Iomega followed in 2008, later rebranded LenovoEMC through a 2013 joint venture that dissolved when Dell arrived.",
      "In 2016 Dell acquired EMC for $67B, the largest technology acquisition ever recorded at the time, forming Dell Technologies. The VMware stake EMC had bought for $625M twelve years earlier was a substantial part of what made the price sensible.",
    ],
    acquisitions: [
      { year: 1999, name: "Data General", what: "One of the first minicomputer companies, bought largely for the CLARiiON storage array line.", became: "The mid-range array business.",
        subAcquisitions: [ { year: 1968, name: "Data General is founded (origin, not a purchase)", what: "Founded by ex-DEC engineers; it defined the minicomputer market before ending inside a storage vendor thirty-one years later." } ] },
      { year: 2003, name: "Documentum and Legato", what: "Content management and backup software, bought in the same year.", became: "The software half of what became the EMC federation." },
      { year: 2004, name: "VMware", price: "$625M", what: "Server virtualisation, bought before virtualisation was a category most buyers had a budget line for.", became: "By 2016 a large part of what made a $67B price for EMC sensible. The most consequential purchase EMC ever made." },
      { year: 2006, name: "RSA Security", price: "$2.1B", what: "Encryption and authentication, which put a security business inside a storage company.", became: "RSA, later divested." },
      { year: 2008, name: "Iomega", what: "Consumer and small-business storage.", became: "Rebranded LenovoEMC through a 2013 joint venture, dissolved when Dell arrived." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/EMC_Corporation",
    externalLabel: "EMC Corporation",
    sources: [
      { label: "EMC SEC merger filing (DEFM14A, 2016): incorporation in Massachusetts in 1979", url: "https://www.sec.gov/Archives/edgar/data/0000790070/000119312516614138/d59207ddefm14a.htm" },
      { label: "Wikipedia: EMC Corporation - founders, defunct September 2016, Dell Technologies", url: "https://en.wikipedia.org/wiki/EMC_Corporation" },
      { label: "World Economic Forum: the $67B Dell-EMC deal as the largest tech acquisition of its time", url: "https://www.weforum.org/stories/2015/10/the-12-biggest-technology-acquisitions-of-all-time/" },
    ],
  },
  {
    // EDS - added 2026-07-28 (PRIME). The company that invented IT outsourcing
    // as a business, and a reminder that services lineages matter as much as
    // product ones. Verified against contemporaneous coverage of the HP deal.
    slug: "eds",
    group: "other",
    name: "Electronic Data Systems (EDS)",
    founded: 1962,
    ended: {
      year: 2008,
      note: "Acquired by Hewlett-Packard for nearly $14B, completed August 2008, and folded into HP Enterprise Services.",
    },
    tagline: "Invented the idea that a company could hand its computing to somebody else entirely.",
    intro:
      "Ross Perot founded Electronic Data Systems in 1962 in Dallas, on a proposition that barely existed as a market: that organisations would rather pay someone else to run their data processing than run it themselves. Every managed service and every outsourcing contract since descends from that bet.",
    body: [
      "EDS built systems that became invisible infrastructure, including the networks that let bank machines accept and dispense money. Its business was never the hardware; it was operating the thing on somebody else's behalf, under contract, at a price agreed in advance.",
      "General Motors bought EDS in 1984 and spun it back out in 1996. Hewlett-Packard acquired it in 2008 for nearly $14B and folded it into HP Enterprise Services.",
      "It belongs on this timeline because the services model it created is the one every vendor on the rest of this page now sells alongside their products - and because an instructor-led training business is itself a descendant of the same idea, that expertise can be contracted rather than hired.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Electronic_Data_Systems",
    externalLabel: "Electronic Data Systems",
    sources: [
      { label: "World Economic Forum: HP completed the EDS purchase for nearly $14B in August 2008", url: "https://www.weforum.org/stories/2015/10/the-12-biggest-technology-acquisitions-of-all-time/" },
    ],
  },
  {
    // GETRONICS - added 2026-07-28 (PRIME). Verified during the Wang research
    // the same day: it is the company Wang Laboratories ended inside.
    slug: "getronics",
    group: "other",
    name: "Getronics",
    founded: 1887,
    tagline: "A Dutch electrical firm from the 1880s that ended up owning what was left of Wang Laboratories.",
    intro:
      "Getronics traces to Groeneveld, van der Poll & Co., a Dutch electrotechnical business of the late nineteenth century. It is on this timeline for one reason: in 1999 it acquired Wang Global, and so became the place a company that had defined word processing came to rest.",
    body: [
      "Wang Laboratories had peaked at around $3B in revenue in the 1980s and employed 33,000 people. By 1999 what Getronics bought was Wang Global, the services business that remained after the hardware era ended.",
      "The pieces continued to move. Getronics North America was sold to KPN in 2007, and on to CompuCom of Dallas in 2008 - so the residue of Wang passed through three more owners after the acquisition that supposedly concluded it.",
      "That trajectory is the ordinary shape of a technology ending. Companies rarely stop; they are absorbed, split, and resold until the original name survives only in a lineage page like this one.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Getronics",
    externalLabel: "Getronics",
    sources: [
      { label: "Wikipedia: Wang Laboratories - acquisition by Getronics in 1999 and the subsequent sales to KPN and CompuCom", url: "https://en.wikipedia.org/wiki/Wang_Laboratories" },
      { label: "Wang Laboratories SEC filing (SC 14D1, 1999) on the Getronics transaction", url: "https://www.sec.gov/Archives/edgar/data/0000104519/000095013099002847/0000950130-99-002847.txt/seq-7" },
    ],
  },
  {
    // ALTAVISTA - added 2026-07-28 (PRIME). The first entry on this site to use
    // the `ended` field, and a good argument for having it: a company that led
    // its category and then stopped existing is a different fact from one that
    // merely got smaller.
    // Verified 2026-07-28 against Wikipedia, Grokipedia, and contemporaneous
    // coverage of the CMGI and Overture transactions.
    slug: "altavista",
    group: "other",
    name: "AltaVista",
    founded: 1995,
    ended: {
      year: 2013,
      note: "Shut down by Yahoo on 8 July 2013; the domain has redirected to Yahoo Search ever since.",
    },
    tagline:
      "Built to stress-test a processor, it became the best search engine on the web - and was then turned into a portal.",
    intro:
      "AltaVista was not conceived as a search engine. DEC's Alpha 64-bit machines were so fast that the standard benchmarks of the day could not stress them, and a researcher on vacation sketched a way to generate a workload chaotic enough to try: point a crawler at the whole World Wide Web.",
    body: [
      "Paul Flaherty had the idea. Louis Monier wrote the crawler - Scooter - and Michael Burrows wrote the indexer, at DEC's Network Systems Laboratory and Western Research Laboratory in Palo Alto. It launched on 15 December 1995 at altavista.digital.com with an index of sixteen million documents, an enormous number at the time, offering full-text search with Boolean operators and natural-language queries when the alternative was a hand-maintained directory.",
      "It worked immediately. By 1996 it was the exclusive search provider to Yahoo, which had itself begun as a directory. AltaVista also shipped Babel Fish, the web's first machine-translation service, named for the fish in Douglas Adams.",
      "Then ownership changed hands four times in five years. Compaq acquired DEC in 1998 for $9.6B, the largest technology takeover to that point, and reportedly some Compaq executives did not know AltaVista existed. Compaq paid a further $3.3M for the altavista.com domain, which someone else had registered in 1994. Under a new chief executive the search engine was rebuilt as a portal - shopping, free email, news - to compete with Yahoo, which meant competing on everything except the thing it was best at.",
      "In June 1999 Compaq sold 83% to CMGI for around $2.3B in stock. The planned IPO was cancelled when the bubble burst in 2000. AltaVista shed the portal features and refocused on search quality by 2002, which was good work arriving late: Google had taken the market. In February 2003 Overture bought it for $140M - roughly six percent of the CMGI valuation three years earlier - and Yahoo acquired Overture five months later.",
      "By 2004 Scooter and the original ranking engine were switched off and AltaVista became a front end for Yahoo's results. It was formally shut down on 8 July 2013. The technology was not what failed; the decision to stop being a search engine was.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/AltaVista",
    externalLabel: "AltaVista",
    sources: [
      { label: "Wikipedia: AltaVista - launch date, ownership chain, shutdown", url: "https://en.wikipedia.org/wiki/AltaVista" },
      { label: "Grokipedia: AltaVista - the DEC labs, the 16-million-document index, the CMGI and Overture figures", url: "https://grokipedia.com/page/AltaVista" },
      { label: "History of Domain Names: the altavista.com purchase and the portal turn", url: "https://historyofdomainnames.com/altavista-the-history-of-domain-names/" },
    ],
  },
  {
    // APACHE - added 2026-07-28 (PRIME). It belongs on this site for a reason
    // more specific than "it is famous": Apache is what NGINX was written
    // against. The concurrency problem NGINX solved was Apache's
    // process-per-connection model meeting the traffic of the 2000s, so the
    // vendor hub for NGINX has no origin story without this entry.
    // Facts verified 2026-07-28 against the ASF's own history pages and the
    // httpd project's ABOUT_APACHE.
    slug: "apache",
    group: "contemporary",
    name: "The Apache Software Foundation",
    founded: 1995,
    tagline: "The web server that ran the web, built by eight people trading patches by email.",
    intro:
      "Apache began in February 1995 as a set of patches to a web server nobody was maintaining any more. Within a year it was the most-used server on the internet, and it held that position for most of two decades - the default answer to 'what serves this site' for a whole generation of the web.",
    body: [
      "The public-domain HTTP daemon written by Rob McCool at the National Center for Supercomputing Applications was the most popular server software on the web in early 1995, and its development had stalled when McCool left NCSA in mid-1994. Webmasters had each written their own fixes and extensions with no common place to put them. Brian Behlendorf - who had been patching the NCSA code so it could handle user registration for HotWired, Wired magazine's site - and Cliff Skolnick set up a mailing list and a shared machine in the Bay Area, with bandwidth donated by HotWired.",
      "By the end of February 1995 eight core contributors had formed the Apache Group: Brian Behlendorf, Roy Fielding, Rob Hartill, David Robinson, Cliff Skolnick, Randy Terbush, Robert Thau and Andrew Wilson. The first public release, 0.6.2, came out in April 1995; version 1.0 followed on 1 December, and within a year Apache had passed NCSA httpd to become the most-used web server on the internet.",
      "The name has two explanations and the project has given both. The original FAQ said the result of combining all those patches was 'a patchy server'. Behlendorf said in 2000 that it was chosen out of respect for the Apache people, then in 2007 said it was the patches after all. The ASF's own position today credits the tribe. Both stories are in the record, which is why both are here.",
      "In June 1999 the Apache Group incorporated as the Apache Software Foundation, a Delaware non-profit, with Behlendorf as its first president - so that the project would outlast any individual volunteer. That structure is why the ASF now hosts hundreds of projects rather than one server.",
      "Roy Fielding, one of the original eight, went on to co-author the HTTP/1.1 specification and to define REST in his doctoral dissertation. The people who wrote the server also wrote much of what the server speaks.",
    ],
    externalUrl: "https://httpd.apache.org/ABOUT_APACHE.html",
    externalLabel: "About the Apache HTTP Server Project",
    sources: [
      { label: "Apache Software Foundation: ASF history and milestones", url: "https://apache.org/history/" },
      { label: "httpd project: About the Apache HTTP Server", url: "https://httpd.apache.org/ABOUT_APACHE.html" },
      { label: "ASF press: 15th anniversary release, with the founding eight named", url: "https://www.prnewswire.com/news-releases/the-apache-software-foundation-announces-the-15th-anniversary-of-the-apache-http-web-server-85036317.html" },
    ],
  },
  {
    slug: "arista",
    group: "redu",
    name: "Arista Networks",
    founded: 2004,
    tagline: "Cloud-scale data-center and campus networking (EOS).",
    intro:
      "Arista Networks builds high-performance, cloud-scale networking - switches and routers running the programmable EOS operating system, widely deployed in data centers.",
    body: [
      "Red Education is an authorised training partner for Arista, delivering the Arista Cloud Engineer (ACE) certification program with a 98% customer-satisfaction rating.",
    ],
    awards: REDU_AWARDS_GENERAL,
    externalUrl: "https://www.rededucation.com/arista/",
    externalLabel: "Arista training at Red Education",
    sources: [
      { label: "Red Education - Arista (authorised training partner)", url: "https://www.rededucation.com/arista/" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "avaya",
    group: "redu",
    name: "Avaya",
    founded: 2000,
    tagline: "Enterprise communications: Aura, IP Office, and contact center.",
    intro:
      "Avaya builds enterprise communications and contact-center platforms - the Aura suite, IP Office, and the Experience Platform - carrying decades of voice-engineering heritage into unified communications and CX.",
    body: [
      "Red Education runs one of the deepest Avaya schedules in its catalogue: Aura core components, System Manager and Communication Manager administration, IP Office integration and support, Meetings Server, Messaging, Experience Portal, and Call Center Elite courses run across all five of its regions, with public dates virtually every week.",
      "Avaya was spun out of Lucent Technologies in 2000, inheriting the enterprise half of a lineage that reaches back through AT&T to Bell Labs. It restructured through Chapter 11 twice, in 2017 and again briefly in 2023, and today concentrates on large-enterprise communications and contact center, increasingly delivered as cloud and hybrid services.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    externalUrl: "https://www.rededucation.com/avaya/",
    externalLabel: "Avaya training at Red Education",
    sources: [
      { label: "Red Education - Avaya training", url: "https://www.rededucation.com/avaya/" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "aws",
    group: "redu",
    name: "Amazon Web Services",
    // Amazon Web Services launched S3 and EC2 in 2006; the brand had existed since 2002 but 2006 is when the cloud business as it is understood began.
    founded: 2006,
    tagline: "The cloud platform that defined the category.",
    intro:
      "Amazon Web Services is the largest public cloud, the platform whose 2006 launch of S3 and EC2 turned computing into a utility and defined what the industry now means by cloud.",
    body: [
      "Red Education names AWS among the leading brands it works with in its award submissions and delivers AWS coursework alongside its security-vendor portfolio, extending the same instructor-led, lab-driven format to cloud fundamentals and architecture.",
      "AWS began inside Amazon as infrastructure plumbing and was opened to the world in 2006; within a decade it was the profit engine of its parent and the default substrate for startups and enterprises alike. Every SASE, SSE, and cloud-security curriculum in the rest of this catalogue ultimately assumes a world AWS created.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    sources: [
      { label: "Red Education - Cybersecurity Excellence Awards profile", url: "https://cybersecurity-excellence-awards.com/candidates/red-education/" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "cyberark",
    group: "redu",
    name: "CyberArk",
    founded: 1999,
    tagline: "Privileged access and identity security.",
    intro:
      "CyberArk defined the privileged-access-management category: vaulting, rotating, and brokering the credentials and secrets that hold the keys to everything else, extended over time into a full identity-security platform.",
    body: [
      "Red Education delivers CyberArk's official training track, with PAM administration courses running publicly across its Australasia, SAARC, and ASEAN schedules and available to the other regions on demand.",
      "Founded in 1999 in Israel by Udi Mokady and Alon Cohen, CyberArk listed on NASDAQ in 2014 and became the reference vendor auditors name when they say privileged access. In February 2026 it became part of Palo Alto Networks in the largest security acquisition on record, a combination this site's Palo Alto Networks history page covers from the acquirer's side.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    externalUrl: "https://www.rededucation.com/cyberark/",
    externalLabel: "CyberArk training at Red Education",
    sources: [
      { label: "Red Education - CyberArk training", url: "https://www.rededucation.com/cyberark/" },
      { label: "Palo Alto Networks 10-Q (CyberArk acquisition completed Feb 2026)", url: "https://investors.paloaltonetworks.com/" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "epi",
    group: "redu",
    name: "EPI",
    // Originally incorporated in the UK in 1987 by Edward van Leent, later in Singapore in 1999, with a separate entity for training and certification from 2001.
    founded: 1987,
    tagline: "Data-centre training and TIA-942 certification.",
    intro:
      "EPI (Enterprise Products Integration Pte Ltd) is the Singapore-headquartered body behind the vendor-neutral data-centre certification ladder - CDCP, CDCS, CDCE, CDFOM and peers - and one of the leading auditors certifying facilities against the ANSI/TIA-942 standard.",
    body: [
      "Red Education delivers EPI's data-centre courses across its regions, bringing facility design, operations, and standards-compliance training into the same catalogue as its network and security tracks; the certifications are examined independently through EXIN.",
      "EPI's framework is taught in more than 50 countries and has become the common language of data-centre operations teams: the CDCP alone is the entry credential facilities engineers worldwide are asked for by name. Its TIA-942 audit practice certifies the buildings the rest of this industry's software runs in.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    externalUrl: "https://www.rededucation.com/epi/",
    externalLabel: "EPI training at Red Education",
    sources: [
      { label: "EPI - training and TIA-942 services", url: "https://www.epi-ap.com/" },
      { label: "Red Education - EPI training", url: "https://www.rededucation.com/epi/" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "microsoft",
    group: "redu",
    name: "Microsoft",
    // Founded 4 April 1975 in Albuquerque by Bill Gates and Paul Allen.
    founded: 1975,
    tagline: "The platform company: Windows, Azure, and Microsoft 365.",
    intro:
      "Microsoft's operating systems, productivity suite, and Azure cloud form the substrate of most enterprise IT estates, which makes its technologies a standing presence in any serious training catalogue.",
    body: [
      "Microsoft appears as a selectable vendor in Red Education's course finder, taught with the same instructor-led model as the rest of the portfolio and often alongside the security platforms that protect Microsoft-centric estates.",
      "Founded in 1975 by Bill Gates and Paul Allen, Microsoft has anchored enterprise computing for five decades, from BASIC and MS-DOS through Windows and Office to Azure and its security business, today one of the industry's largest. Several stories in this site's glossary, from the Homebrew Computer Club's Open Letter to the disputed 640K quote, trace back to it.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    sources: [
      { label: "Red Education - course finder (vendor list)", url: "https://www.rededucation.com/" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "mobileiron",
    group: "redu",
    name: "MobileIron",
    founded: 2007,
    ended: {
      year: 2020,
      note: "Acquired by Ivanti, announced September 2020 and completed 1 December, alongside Pulse Secure.",
    },
    tagline: "Mobile device management pioneer, now part of Ivanti.",
    intro:
      "MobileIron was one of the pioneers of mobile device management, building the platform enterprises first used to enroll, secure, and wipe fleets of smartphones as they flooded into the workplace.",
    body: [
      "MobileIron courseware remains in Red Education's regional catalogues for the installed base that still runs it, taught within the same unified-endpoint-management context its successor products live in.",
      "Founded in 2007 in Mountain View, MobileIron helped define MDM as a category and listed on NASDAQ in 2014. In December 2020 it was acquired by Ivanti, together with Pulse Secure, and its technology continues inside Ivanti's unified endpoint management line - a lineage note this site records the same way it does for its career-era vendors.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    sources: [
      { label: "Ivanti press release - acquisition of MobileIron and Pulse Secure (Dec 2020)", url: "https://www.ivanti.com/company/press-releases/2020/ivanti-acquires-mobileiron-and-pulse-secure" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "paessler",
    group: "redu",
    name: "Paessler",
    founded: 1997,
    tagline: "PRTG: the network monitoring standard of the mid-market.",
    intro:
      "Paessler builds PRTG, the sensor-based monitoring platform that thousands of IT teams use as their single pane for network, server, and infrastructure health.",
    body: [
      "Red Education carries Paessler across all five of its regional schedules, delivering official PRTG training that turns the tool most admins learn by osmosis into a discipline taught properly.",
      "Founded in 1997 by Dirk Paessler in Nuremberg, Germany, the company has stayed focused and independent for nearly three decades, an increasingly rare trajectory in this catalogue of acquisitions. PRTG's sensor model made monitoring approachable for teams without a tooling budget the size of their network.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    externalUrl: "https://www.rededucation.com/paessler/",
    externalLabel: "Paessler training at Red Education",
    sources: [
      { label: "Red Education - Paessler training", url: "https://www.rededucation.com/paessler/" },
      { label: "Paessler - company", url: "https://www.paessler.com/company" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "red-hat",
    group: "redu",
    name: "Red Hat",
    founded: 1994,
    tagline: "Enterprise open source: RHEL, OpenShift, Ansible.",
    intro:
      "Red Hat made open source safe for the enterprise: Red Hat Enterprise Linux, OpenShift, and Ansible are the commercially supported spine of Linux estates, container platforms, and automation worldwide.",
    body: [
      "Red Hat training runs in Red Education's Australasia catalogue and through its course finder, extending the portfolio from network and security appliances to the operating system and automation layer beneath them.",
      "Founded in 1993 and profitable on a business model skeptics said could not exist - selling support for software anyone could copy - Red Hat proved the open-source enterprise thesis, a story this site's glossary tells through The Cathedral and the Bazaar. IBM acquired it in July 2019 for 34 billion dollars, then the largest software acquisition ever, and runs it as a distinct unit.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    sources: [
      { label: "Red Education - course finder (vendor list)", url: "https://www.rededucation.com/" },
      { label: "IBM - Red Hat acquisition (2019)", url: "https://newsroom.ibm.com/2019-07-09-IBM-Closes-Landmark-Acquisition-of-Red-Hat-for-34-Billion-Defines-Open-Hybrid-Cloud-Future" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "riverbed",
    group: "redu",
    name: "Riverbed",
    founded: 2002,
    tagline: "WAN optimization pioneer turned observability company.",
    intro:
      "Riverbed defined WAN optimization: its SteelHead appliances made far-away applications feel local in the era when every branch office lived at the end of a thin, expensive circuit, and the company has since rebuilt itself around observability and acceleration.",
    body: [
      "Red Education has provided Riverbed skills to the market since 2008 and is a Riverbed Authorised Consulting Partner, with courses continuing in its Australasia, SAARC, and ASEAN catalogues.",
      "Founded in 2002 by Jerry Kennelly and Steve McCanne - the latter a co-author of tcpdump and the Berkeley Packet Filter, tools half this site's tutorials assume - Riverbed rode the SteelHead era to an IPO, was taken private in 2015, and went through a court-supervised restructuring in late 2021. Today it competes in unified observability, a long way from the branch-office WAN it was built to shrink.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    sources: [
      { label: "Red Education - Professional Services (Riverbed since 2008)", url: "https://www.rededucation.com/professional-services/" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "symantec",
    group: "redu",
    name: "Symantec",
    founded: 1982,
    tagline: "The security brand of a generation, now Broadcom's enterprise line.",
    intro:
      "Symantec was for decades the biggest name in security software, from Norton on the desktop to the enterprise endpoint, web, and data-protection suites that carried its yellow badge into every large IT estate.",
    body: [
      "Symantec enterprise courseware remains in Red Education's Australasia, SAARC, and ASEAN catalogues, serving the substantial installed base of its endpoint and web-security platforms.",
      "Founded in 1982, Symantec grew by acquisition into a security conglomerate before splitting itself: the enterprise security business was sold to Broadcom in November 2019, which retains the Symantec brand for it, while the consumer side became NortonLifeLock and, after merging with Avast, Gen Digital. It is one more lineage this site's industry pages trace: the name survives, the company that carried it does not.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    sources: [
      { label: "Broadcom - Symantec enterprise security (2019)", url: "https://www.broadcom.com/company/news/financial-releases/broadcom-completes-acquisition-of-symantec-enterprise-security-business" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "hpe-juniper-aruba",
    group: "other",
    name: "HPE Networking - HP, 3Com, Aruba, Juniper",
    founded: 1939,
    tagline: "The great consolidation: from the Addison Avenue garage to the $14B Juniper merger.",
    intro:
      "Four founding stories converged into one company: Hewlett-Packard (1939), 3Com and the commercialization of Ethernet (1979), Juniper Networks and purpose-built routing silicon (1996), and Aruba Networks and the mobile-first enterprise (2002). HP acquired 3Com in 2010 and Aruba in 2015, split into HP Inc and HPE that same year, and closed the acquisition of Juniper Networks on July 2, 2025 - assembling the industry's broadest challenge to Cisco.",
    body: [],
    note:
      "Neither Rodolfo nor Red Education delivers HPE, Aruba, or Juniper training. Those courses are run by HPE Education Services and by HPE / Juniper authorized education partners. This page is corporate history - a lineage record of the pioneers, verified against primary sources.",
    sources: [
      { label: "HPE 10-K FY2025 - Juniper merger closed Jul 2, 2025 (~$13.4B cash)", url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001645590&type=10-K" },
      { label: "HPE / Juniper - DOJ settlement release (SEC 8-K, Jun 28, 2025)", url: "https://www.sec.gov/Archives/edgar/data/1043604/000119312525154400/d912160dex991.htm" },
      { label: "NetScreen SEC Form 425 - Juniper/NetScreen merger (Feb 9, 2004)", url: "https://www.sec.gov/Archives/edgar/data/0001088454/000089161804000509/f96338j2e425.htm" },
      { label: "Aruba SEC 8-K - HP to acquire Aruba (Mar 2, 2015)", url: "https://www.sec.gov/Archives/edgar/data/0001173752/000119312515073722/d884514dex991.htm" },
      { label: "Juniper 10-Q FY2019 - Mist acquisition ($359.2M)", url: "https://www.sec.gov/Archives/edgar/data/1043604/000104360419000094/jnpr-10q20190630.htm" },
      { label: "Juniper.net - Gartner 2025 MQ Enterprise Wired & Wireless LAN (Leader)", url: "https://www.juniper.net/us/en/training/education-centers.html" },
    ],
  },
  {
    slug: "brocade-broadcom",
    group: "other",
    name: "Brocade & Foundry - the Broadcom diaspora",
    founded: 1995,
    tagline: "Two 1990s pioneers, one 2017 dismemberment: SAN to Broadcom, data center to Extreme, campus and Wi-Fi to CommScope.",
    intro:
      "Brocade built the switched Fibre Channel fabric that made storage area networks possible; Foundry shipped the first gigabit Ethernet, Layer 3, and Layer 4-7 switches. They merged in 2008, and in 2017 Broadcom took the combination apart: the SAN business stayed with Broadcom, the Foundry-derived data-center lines went to Extreme Networks, and campus switching plus Ruckus Wi-Fi went to ARRIS, then CommScope - with Belden announced as the next owner in 2026.",
    body: [],
    note:
      "Neither Rodolfo nor Red Education delivers Brocade or Broadcom training. This page is corporate history, verified against SEC filings and primary sources. One accurate connection: Extreme Networks, which absorbed the Foundry-derived data-center portfolio in 2017, is one of the vendors Rodolfo is authorized to teach.",
    sources: [
      { label: "Broadcom 10-K FY2018 - Brocade closed Nov 17, 2017 (~$5.3B + $701M debt)", url: "https://www.sec.gov/Archives/edgar/data/0001730168/000173016818000084/avgo-11042018x10k.htm" },
      { label: "Broadcom / Extreme press release - data-center business, $55M (Mar 29, 2017)", url: "https://investors.broadcom.com/news-releases/news-release-details/extreme-networks-acquire-brocades-data-center-networking" },
      { label: "ARRIS SEC 8-K - Ruckus + ICX, $800M (Feb 22, 2017)", url: "https://www.sec.gov/Archives/edgar/data/0001645494/000119312517053883/d330887dex991.htm" },
      { label: "Brocade 10-Q FY2008 - Foundry agreement ($19.25/share announced)", url: "https://www.sec.gov/Archives/edgar/data/0001009626/000095013408015646/f43239e10vq.htm" },
      { label: "Foundry Networks 10-K FY1999 - founded May 1996", url: "https://www.sec.gov/Archives/edgar/data/0001090071/000101287000001468/0001012870-00-001468.txt" },
      { label: "Foundry Networks - Wikipedia (renegotiation; completed Dec 18, 2008)", url: "https://en.wikipedia.org/wiki/Foundry_Networks" },
      { label: "Ruckus Networks - Wikipedia (CommScope 2019; Belden announced Apr 30, 2026)", url: "https://en.wikipedia.org/wiki/Ruckus_Networks" },
    ],
  },
  {
    slug: "mcafee-fireeye-trellix",
    group: "other",
    name: "McAfee, FireEye & Mandiant - the road to Trellix",
    founded: 1987,
    tagline: "Three security pioneers, one private-equity remix: Trellix and Skyhigh under STG, Mandiant inside Google Cloud, McAfee consumer private.",
    intro:
      "Three founding stories - McAfee and commercial antivirus (1987), FireEye and virtual-machine detonation (2004), Mandiant and incident response as a discipline (2004) - collided in 2021-2022. Symphony Technology Group carved out McAfee Enterprise ($4.0B) and FireEye's products plus the FireEye name ($1.2B), fused them into Trellix, and spun the SSE portfolio out as Skyhigh Security; the remaining company renamed itself Mandiant and joined Google Cloud; McAfee's consumer business went private for over $14 billion.",
    body: [],
    note:
      "Neither Rodolfo nor Red Education delivers McAfee, Trellix, FireEye, or Mandiant training. This page is corporate history, verified against SEC filings and primary sources. Rodolfo's own connection is from the distribution side: he carried the FireEye and McAfee lines in Brazil during his Westcon-Comstor and ScanSource years.",
    sources: [
      { label: "Alphabet 10-K FY2022 - Mandiant closed Sep 12, 2022 ($6.1B total incl. cash and debt)", url: "https://www.sec.gov/Archives/edgar/data/1652044/000165204423000016/goog-20221231.htm" },
      { label: "McAfee SEC 8-K - Advent/Permira take-private completed (>$14B, Mar 1, 2022)", url: "https://www.sec.gov/Archives/edgar/data/1783317/000119312522060146/d319834dex991.htm" },
      { label: "Trellix - Combination of McAfee Enterprise and FireEye complete ($1.2B)", url: "https://www.trellix.com/news/press-releases/combination-of-mcafee-enterprise-and-fireeye-complete/" },
      { label: "Computer Weekly - Skyhigh Security spun out of McAfee Enterprise (Mar 2022)", url: "https://www.computerweekly.com/news/252514998/Private-equity-house-spins-SSE-company-out-of-McAfee-Enterprise" },
      { label: "Mandiant - Wikipedia (Red Cliff 2004; APT1 2013; FireEye $1B Dec 2013)", url: "https://en.wikipedia.org/wiki/Mandiant" },
      { label: "McAfee - Wikipedia (1987; NAI 1997; Intel Feb 2011; TPG Apr 2017; IPO 2020)", url: "https://en.wikipedia.org/wiki/McAfee" },
    ],
  },
  {
    slug: "mikrotik",
    group: "other",
    name: "MikroTik - Latvia's quiet giant",
    founded: 1996,
    tagline: "RouterOS on commodity hardware: the company that made carrier-grade routing affordable everywhere - and stayed independent.",
    intro:
      "Founded in Riga in 1996, MikroTik put carrier-grade routing software on ordinary x86 PCs (RouterOS, 1997), then on its own boards (RouterBOARD, 2002). The price-performance formula made it ubiquitous among ISPs and wireless ISPs worldwide - including Brazil - and in 2022 it became the first private company in Latvia to pass EUR 1 billion in value. Still private, still in Riga, still founder-controlled.",
    body: [],
    note:
      "Neither Rodolfo nor Red Education delivers MikroTik training. This page is corporate history, verified against MikroTik's own company history and public records. Rodolfo's connection is from the field: MikroTik gear is the backbone of countless Brazilian ISP and WISP networks he has worked alongside since the 1990s.",
    sources: [
      { label: "MikroTik - company history (RouterOS 1997; RouterBOARD 2002)", url: "https://mikrotik.com/aboutus" },
      { label: "MikroTik - Wikipedia (founders; 2022 EUR 1.30B; first Latvian private company past EUR 1B)", url: "https://en.wikipedia.org/wiki/MikroTik" },
    ],
  },
  {
    slug: "radware",
    group: "other",
    name: "Radware - the Zisapel lineage",
    founded: 1997,
    tagline: "Born of Israel's RAD Group in 1997; the ADC and DDoS specialist that rescued Alteon from Nortel's wreckage for ~$18M.",
    intro:
      "A father-and-son founding inside Israel's most storied networking family: RAD Group patriarch Yehuda Zisapel and his son Roy, CEO since inception. Radware IPO'd on NASDAQ in 1999, built the DefensePro DDoS line, and in April 2009 bought Nortel's legendary Alteon application-switching assets out of bankruptcy for about $18 million - instantly a top-three ADC vendor. Still independent, still founder-led.",
    body: [],
    note:
      "Neither Rodolfo nor Red Education delivers Radware training. This page is corporate history, verified against SEC filings and primary sources. Radware competes in the application delivery market where Rodolfo teaches F5 daily - knowing the rivals is part of knowing the market.",
    sources: [
      { label: "Radware SEC 6-K FY2009 - founders' biographies (inception dated May 1996)", url: "https://www.sec.gov/Archives/edgar/data/0001094366/000117891309001371/exhibit_1-1.htm" },
      { label: "Network World (Apr 2009) - Radware pays $18M for Nortel's Alteon assets", url: "https://www.networkworld.com/article/2267100/radware-pays--18-million-for-nortel-s-alteon-assets.html" },
      { label: "Radware - Wikipedia (April 1997; stakes; acquisitions)", url: "https://en.wikipedia.org/wiki/Radware" },
    ],
  },
  {
    slug: "imperva-thales",
    group: "other",
    name: "Imperva - from WebCohort to Thales",
    founded: 2002,
    tagline: "The WAF pioneer founded by a Check Point co-founder, now the application-security arm of a French defense giant.",
    intro:
      "Founded in Israel in 2002 as WebCohort by Shlomo Kramer (co-founder of Check Point, later founder of Cato Networks), Amichai Shulman, and Mickey Boodaei, the company shipped SecureSphere in 2003 and helped define the web application firewall category. NYSE IPO in 2011, a $2.1 billion Thoma Bravo take-private in January 2019, and a $3.6 billion acquisition by Thales completed on December 4, 2023.",
    body: [],
    note:
      "Neither Rodolfo nor Red Education delivers Imperva or Thales training. This page is corporate history, verified against primary sources. Imperva pioneered the WAF market Rodolfo teaches through F5 Advanced WAF - the rivals' history is the market's history.",
    sources: [
      { label: "Imperva - Wikipedia (WebCohort 2002; SecureSphere 2003; Thales completed Dec 4, 2023)", url: "https://en.wikipedia.org/wiki/Imperva" },
      { label: "Globes (Jul 25, 2023) - Thales acquires Imperva for $3.6B; Thoma Bravo Jan 2019 $2.1B; founders' later startups", url: "https://en.globes.co.il/en/article-thales-acquires-cybersecurity-co-imperva-for-36b-1001453187" },
      { label: "Times of Israel (Jul 25, 2023) - founder backgrounds", url: "https://www.timesofisrael.com/israeli-founded-imperva-is-snapped-up-by-frances-thales-in-3-6b-cybersecurity-deal/" },
    ],
  },
  {
    slug: "versa",
    group: "other",
    name: "Versa Networks - the SASE independent",
    founded: 2012,
    tagline: "Two ex-Riverstone, ex-Juniper brothers building unified SASE - one of the last large independents in a consolidated market.",
    intro:
      "Founded in 2012 by brothers Kumar and Apurva Mehta after eight years leading Juniper's MX series - and, before that, senior roles at Riverstone Networks, where Rodolfo worked from 2000 to 2002. Versa built networking and security as one multi-tenant software stack years before Gartner named the category SASE, raised roughly $316 million while rivals sold to Cisco, VMware, Aruba, and Palo Alto, and remains independent.",
    body: [],
    note:
      "Neither Rodolfo nor Red Education delivers Versa training. This page is corporate history, verified against Versa's own leadership biographies and primary sources. The lineage connection is real: both founders built at Riverstone Networks - Rodolfo's Santa Clara employer, 2000-2002 - before their Juniper years.",
    sources: [
      { label: "Versa Networks - leadership biographies (Riverstone, Yago, Centillion; Juniper MX)", url: "https://versa-networks.com/about/leadership/" },
      { label: "TechCrunch (Oct 27, 2022) - $120M round; Ahuja CEO since 2016; consolidation context", url: "https://techcrunch.com/2022/10/27/versa-raises-120m-for-its-software-defined-networking-and-security-stack/" },
      { label: "Tracxn - $316M total over 6 rounds; first round Nov 26, 2012", url: "https://tracxn.com/d/companies/versa-networks/__wlcJlkKIuL61D2aM_ev5JQIkme5Hbd0Mne4_z3tmlfY" },
    ],
  },
  {
    slug: "nortel-bay",
    group: "other",
    name: "Nortel & Bay Networks - the giant that vanished",
    founded: 1895,
    tagline: "From 1895 Montreal to a third of Canada's stock index to the largest bankruptcy in Canadian history - and the $4.5B patent auction that ended it.",
    intro:
      "Northern Electric (1895) became Northern Telecom, bet everything on digital switching in 1976, and grew into Nortel - worth C$398 billion at the 2000 peak, more than a third of the entire Toronto Stock Exchange. Along the way it swallowed Bay Networks (the 1994 SynOptics-Wellfleet merger) for $9.1 billion and Alteon WebSystems for $7.8 billion. The collapse erased it all: the January 14, 2009 filing was the largest corporate failure in Canadian history, the pieces scattered to Ericsson, Avaya, Ciena, Radware, and eventually Extreme Networks, and the 2011 Rockstar patent auction - $4.5 billion, against Google's pi-themed bids - was the tombstone.",
    body: [],
    note:
      "Nortel, Bay Networks, SynOptics, and Wellfleet no longer exist as companies, and no training association is implied with them or their successors. This page is corporate history, verified against SEC filings and primary sources. Rodolfo's connection is from the other side of the battlefield: he spent 1996-2000 at Cabletron Systems, Bay Networks' direct rival in the hub-and-switch wars - and the Bay-descended enterprise portfolio now lives at Extreme Networks, one of the vendors he teaches.",
    sources: [
      { label: "Bay Networks SEC 8-K (Jun 15, 1998) - Nortel-Bay US$9.1B announcement", url: "https://www.sec.gov/Archives/edgar/data/0000876516/000089375098000173/0000893750-98-000173.txt" },
      { label: "Alteon WebSystems SEC Form 425 (Jul 28, 2000) - US$7.8B; Orr employee email", url: "https://www.sec.gov/Archives/edgar/data/0001089925/000090342300000344/0001.txt" },
      { label: "Timeline of Nortel - Wikipedia (1895; peak; asset sales; Rockstar and the pi bids)", url: "https://en.wikipedia.org/wiki/Timeline_of_Nortel" },
      { label: "Nortel - Wikipedia (Digital World 1976; bankruptcy; Radware $18M Alteon sale)", url: "https://en.wikipedia.org/wiki/Nortel" },
      { label: "Avaya 10-K FY2010 - Nortel NES closed Dec 18, 2009 ($943M cash, $933M final)", url: "https://www.sec.gov/Archives/edgar/data/0001116521/000119312510275681/d10k.htm" },
      { label: "Extreme Networks 10-Q FY2017 - Avaya Networking closed Jul 14, 2017 ($79.8M net)", url: "https://www.sec.gov/Archives/edgar/data/0001078271/000156459017023316/extr-10q_20170930.htm" },
      { label: "Wellfleet Communications - Wikipedia (1986 founders; $2.7B merger)", url: "https://en.wikipedia.org/wiki/Wellfleet_Communications" },
      { label: "SynOptics - Wikipedia (1985 founders; twisted-pair Ethernet; Jul 6, 1994 merger)", url: "https://en.wikipedia.org/wiki/SynOptics_Communications" },
    ],
  },
  {
    slug: "madge",
    group: "other",
    name: "Madge Networks - Token Ring's standard-bearer",
    founded: 1986,
    tagline: "From a Buckinghamshire farm to beating IBM in court at IBM's own game - and down with the protocol it championed: 'the Betamax of the networking world.'",
    intro:
      "Robert Madge founded the company on his family's farm in 1986 with no new technology at all - just the bet that IBM's Token Ring could be built better and sold harder than IBM did. He won the court fight that made it royalty-free, rode the ring to more than 25 countries and the Sunday Times Rich List, hedged with Israel's Lannet (sold to Lucent for $117 million in 1998), and absorbed rival Olicom's Token Ring business in 1999 - by which point the ring was 81 percent of sales, a market shrinking beneath its last champion. A Dutch court granted the bankruptcy order in 2003; the remains ended up at Ringdale, crowned the world's largest supplier of Token Ring technology after the world had stopped buying it.",
    body: [],
    note:
      "Madge Networks no longer exists as an operating company, and no training association is implied with it or any successor. This page is corporate history, verified against Madge's SEC filings and primary sources. Rodolfo's connection is from the opposite trench of the great protocol war: at Cabletron from 1996 to 2000, he fought for Ethernet in the IBM-shop accounts - common in Brazil - where Madge's Token Ring was the incumbent. Every hub-war page in this section tells Ethernet's side; this one honors the technology that lost.",
    sources: [
      { label: "Madge Networks - Wikipedia (1986 founding; HSTR; Olicom; April 2003 bankruptcy; Ringdale)", url: "https://en.wikipedia.org/wiki/Madge_Networks" },
      { label: "Madge Networks N.V. company history - encyclopedia.com (farm founding; chess games; Lannet to Lucent Jul 1998)", url: "https://www.encyclopedia.com/books/politics-and-business-magazines/madge-networks-nv" },
      { label: "The Register (May 23, 2003) - Dutch administrator Apr 17, 2003; bankruptcy order; 'Betamax of networking'", url: "https://www.theregister.com/2003/05/23/madge_networks_goes_titsup_flips/" },
      { label: "Computerworld - Robert Madge interview (IBM court fight; left 2001; Madge Inc to Network Technology/Ringdale 2006)", url: "https://www.computerworld.com/article/1682392/robert-madge.html" },
      { label: "Madge SEC F-3/F-3A (1999) - Token Ring 65/65/72% of sales 1996-98, 81% 9M 1999; Lannet $117M; restructuring", url: "https://www.sec.gov/" },
    ],
  },
  // ---- The pioneer-giants wave (PRIME directive 2026-07-16): twelve founders
  // of the industry itself, each with a full lineage profile. ----
  {
    slug: "sun-microsystems",
    group: "other",
    name: "Sun Microsystems - the network is the computer",
    founded: 1982,
    ended: {
      year: 2010,
      note: "Acquired by Oracle in 2010. Java, Solaris, ZFS and the identity stack that became ForgeRock all passed with it.",
    },
    tagline: "Four Stanford-orbit founders, SPARC, Solaris, Java - the dot in dot-com, absorbed by Oracle in 2010.",
    intro: "Sun packed more industry-shaping ideas into 28 years than most vendors manage in a century: the workstation, the network-first slogan it took the world decades to catch up with, NFS, SPARC, Solaris, and Java. Its 2010 end inside Oracle scattered a diaspora that still runs the industry - including the ForgeRock and Arista stories elsewhere in this section.",
    body: ["From Andy Bechtolsheim's Stanford University Network workstation to Java running on billions of devices, Sun's arc is the arc of open systems itself - told in full in the profile below, with the bloodlines that lead out of it."],
  },
  {
    slug: "silicon-graphics",
    group: "other",
    name: "Silicon Graphics - the geometry of Hollywood",
    founded: 1982,
    tagline: "Jim Clark's geometry engines rendered Jurassic Park and invented OpenGL; the name ended at HPE in 2016.",
    intro: "SGI built the machines that taught computers to see: geometry pipelines, IRIX on MIPS, and the purple workstations behind a decade of movie magic. Its fall is as instructive as its rise - commodity PCs ate the graphics market SGI created, and OpenGL outlived the company that wrote it.",
    body: ["Founder Jim Clark left in 1994 to co-found Netscape; the company's Cray chapter, its two bankruptcies, and the 2016 HPE acquisition close the loop told in the profile below."],
  },
  {
    slug: "xerox",
    group: "other",
    name: "Xerox - the company that fumbled the future",
    founded: 1906,
    tagline: "Xerography built the empire; PARC invented Ethernet, the GUI, and laser printing - and networking's history runs through that lab.",
    intro: "Xerox matters to this site for one building above all: the Palo Alto Research Center, where Ethernet itself was invented in 1973. The copier giant commercialized almost none of what PARC created - the most productive fumble in technology history - and its own print business marches on, completing the Lexmark acquisition in 2025.",
    body: ["From Chester Carlson's xerography patent to Bob Metcalfe's Ethernet memo, the profile below follows both the empire and the laboratory that gave this industry its wires."],
  },
  {
    slug: "dec",
    group: "other",
    name: "Digital Equipment Corporation - the minicomputer king",
    founded: 1957,
    tagline: "Ken Olsen's PDP and VAX machines defined two decades of computing; DEC co-authored Ethernet and ended inside Compaq in 1998.",
    intro: "DEC took computing out of the glass house: the PDP-8 made computers departmental, the PDP-11 made them ubiquitous, and VAX/VMS made them an architecture empire. DEC also co-signed the DIX Ethernet standard with Intel and Xerox - the reason this industry cables the way it does.",
    body: ["The profile traces Maynard's woolen mill to the $9.6 billion Compaq acquisition - then the largest in computer history - and the VMS-to-Windows-NT bloodline that followed the people out."],
  },
  {
    slug: "nokia",
    group: "other",
    name: "Nokia - from paper mill to network giant",
    founded: 1865,
    tagline: "A 160-year arc: rubber boots to world phone leader to one of the three companies that build the world's mobile networks.",
    intro: "Nokia is the industry's great shapeshifter: an 1865 Finnish paper mill that became the world's largest phone maker, lost that crown in the smartphone wars, and rebuilt itself as a networks powerhouse - absorbing Alcatel-Lucent and Bell Labs in 2016 and optical vendor Infinera in 2025.",
    body: ["The profile follows every act, through the Microsoft phone sale, the Siemens joint venture, and the 2025 leadership change that put a data-center executive at the helm."],
  },
  {
    slug: "ericsson",
    group: "other",
    name: "Ericsson - 150 years of telephony",
    founded: 1876,
    tagline: "From an 1876 Stockholm telegraph workshop to the AXE switch, GSM, Bluetooth, and today's 5G triumvirate.",
    intro: "Ericsson has been building the telephone network since the telephone was new. The AXE digital switch wired the world, its engineers were central to GSM, a 1990s Ericsson project gave the world Bluetooth, and today it stands with Nokia and Huawei as one of three companies that can build a national mobile network end to end.",
    body: ["The profile below runs from Lars Magnus Ericsson's workshop through the Sony Ericsson decade to the modern 5G and enterprise-wireless era."],
  },
  {
    slug: "huawei",
    group: "other",
    name: "Huawei - the Shenzhen ascent",
    founded: 1987,
    tagline: "From a 1987 PBX reseller to the world's largest telecom equipment maker - and the center of the decade's biggest technology-policy storm.",
    intro: "Huawei's rise is the defining industrial story of modern networking: founded in Shenzhen in 1987 with about 21,000 yuan, it out-engineered and out-priced the incumbents until it led the world in telecom equipment. The 2019 United States Entity List placed it at the center of the technology-sovereignty era, and its silicon comeback since is a story still being written.",
    body: ["The profile tells the arc factually - the rural-first strategy, HiSilicon, the sanctions years, and the employee-owned structure - from the public record."],
  },
  {
    slug: "siemens",
    group: "other",
    name: "Siemens - the 1847 telegraph startup",
    founded: 1847,
    tagline: "Werner von Siemens built the Indo-European telegraph line; the conglomerate's communications bloodline runs through EWSD, the Nokia JV, and Unify.",
    intro: "Siemens is the oldest company in this section by decades: an 1847 Berlin workshop whose pointer telegraph grew into a global electrical empire. Its communications lineage - telephone exchanges, the EWSD switch, Nokia Siemens Networks, and the Unify enterprise-communications line - threads through half the industry's history, while today's Siemens leads industrial automation and its networking.",
    body: ["The profile follows the telegraph century, the telecom exits, and where the communications bloodlines ended up."],
  },
  {
    slug: "novell",
    group: "other",
    name: "Novell - the network operating system",
    founded: 1983,
    tagline: "NetWare owned the LAN era and IPX ran the world's offices; the lineage ended at OpenText in 2023.",
    intro: "Before TCP/IP won, the corporate network spoke IPX and logged into NetWare - and an entire profession grew up around Novell certifications. The company that defined the network operating system then spent two decades searching for a second act: UnixWare, WordPerfect, SUSE, the Microsoft pact, and a chain of acquisitions ending at OpenText in 2023.",
    body: ["The profile below is LAN-era history in full: Ray Noorda's coopetition, the Utah empire, and the long unwinding."],
  },
  {
    slug: "oracle",
    group: "other",
    name: "Oracle - the database empire",
    founded: 1977,
    tagline: "The first commercial SQL database, four decades of acquisitions - Sun included - and 2025's handover to co-CEOs for the AI era.",
    intro: "Oracle commercialized the relational database before IBM, its inventor's employer, got around to it - and has compounded that head start for nearly fifty years. Its acquisition machine reshaped the industry map, absorbing PeopleSoft, BEA, Sun Microsystems, NetSuite, and Cerner, and its 2025 leadership handover to co-CEOs marks the pivot to the AI-infrastructure era.",
    body: ["The profile runs from the CIA project that named the company to the September 2025 succession, verified against Oracle's own SEC filings."],
  },
  {
    slug: "ibm",
    group: "other",
    name: "IBM - the century company",
    founded: 1911,
    tagline: "Punched cards to System/360 to the PC to Red Hat: the company the rest of the industry defined itself against.",
    intro: "For most of computing's history, IBM was the industry: the tabulating monopoly, the $5 billion System/360 bet that created the mainframe world, the PC that accidentally crowned Microsoft and Intel, and the services turnaround that saved it. Its networking fingerprints - SNA, Token Ring - run through several other pages in this section, and the 2019 Red Hat acquisition ties it to the open-source lineage told there.",
    body: ["The profile compresses eleven decades into the moments that shaped this industry, Token Ring wars included."],
  },
  {
    slug: "sap",
    group: "other",
    name: "SAP - five engineers against the mainframe",
    founded: 1972,
    tagline: "Ex-IBM founders built the ERP category in 1972; R/3 conquered the client-server world and HANA reinvented the core.",
    intro: "SAP is Europe's greatest software story: five IBM engineers in Mannheim who bet in 1972 that business software could be a standard product, not a custom project. R/3 rode the client-server wave into nearly every large enterprise on earth, and the company reinvented its own foundations twice - in-memory HANA in 2010 and the cloud pivot after it.",
    body: ["The profile follows Walldorf from R/1 to RISE, the ecosystem that employs a small nation of consultants, and the networking-adjacent reality that SAP traffic shaped a generation of QoS designs."],
  },
  // ---- Pioneer wave 2 (PRIME 2026-07-16): six more founders of the industry. ----
  {
    slug: "3com",
    group: "other",
    name: "3Com - Ethernet leaves the lab",
    founded: 1979,
    tagline: "Bob Metcalfe commercialized his own PARC invention; EtherLink wired the PC era, Palm rode along, and the story ended at HP in 2010.",
    intro: "3Com is the second half of the Ethernet story this section starts on the Xerox page: Metcalfe left PARC in 1979 to sell the network he had invented, and the EtherLink card put Ethernet inside the IBM PC itself. Computers, Communication, Compatibility - the three Coms - became the connectivity company of the LAN decade.",
    body: ["From the first PC Ethernet adapters through the US Robotics merger that brought Palm aboard, to the H3C venture in China and the 2010 HP acquisition - the profile below follows the wire out of the lab and into everything."],
  },
  {
    slug: "compaq",
    group: "other",
    name: "Compaq - the clone that became the king",
    founded: 1982,
    ended: {
      year: 2002,
      note: "Acquired by Hewlett-Packard in 2002, and retired as a brand by 2010. It had itself absorbed Tandem in 1997 and DEC in 1998, so three companies ended inside one lineage.",
    },
    tagline: "Three ex-TI engineers sketched a portable on a placemat, clean-roomed the IBM BIOS, and built the fastest company to a billion dollars - then bought DEC and merged into HP.",
    intro: "Compaq legitimized the PC-compatible industry: its 1982 clean-room BIOS made 'IBM compatible' a legal product category, its Deskpro 386 beat IBM to Intel's 386, and by the mid-1990s it was the world's largest PC maker. Its acquisitions of Tandem and DEC made it, briefly, the industry's everything-company - until the 2002 HP merger closed the arc.",
    body: ["The profile runs from the Houston placemat sketch to the proxy-fight merger, with the DEC bloodline this section tells separately flowing through it."],
  },
  {
    slug: "netscape",
    group: "other",
    name: "Netscape - the company that opened the web",
    founded: 1994,
    tagline: "Clark and Andreessen's Navigator took the internet mainstream; SSL, JavaScript, and the cookie were invented here - the browser lost the war, the inventions won everything.",
    intro: "No company on this page matters more to this site's daily subject matter: SSL - the ancestor of every TLS session the tools here decode - was designed at Netscape, as were JavaScript and the HTTP cookie. The Navigator browser took the web from academia to everyone, triggered the browser wars, and left behind Mozilla and the open web itself.",
    body: ["From Jim Clark's post-SGI second act and the 1995 IPO that started the dot-com era, to the AOL acquisition and the Firefox afterlife - the profile follows the fifty-one months that rewired the world."],
  },
  {
    slug: "motorola",
    group: "other",
    name: "Motorola - the radio century",
    founded: 1928,
    tagline: "Car radios to the walkie-talkie to the first handheld cell call and the moon itself; split in 2011 into Solutions and a Mobility arm that passed through Google to Lenovo.",
    intro: "Motorola put radio everywhere: in cars in the 1930s, on soldiers' backs in the 1940s, on the Moon in 1969, and in Martin Cooper's hand for the first handheld cellular call in 1973. The century company split in 2011 - Motorola Solutions carries the mission-critical radio and public-safety network lineage today, while the phone side journeyed through Google to Lenovo.",
    body: ["The profile covers the Galvin brothers' Chicago startup, the DynaTAC and RAZR eras, the Iridium gamble, the 68000 processor family that powered a computing generation, and both halves of the split."],
  },
  {
    slug: "unisys",
    group: "other",
    name: "Unisys - computing's oldest bloodlines",
    founded: 1886,
    tagline: "Burroughs (1886) plus Sperry's UNIVAC - the ENIAC creators' company - merged in 1986: the deepest lineage in this section, still running ClearPath descendants today.",
    intro: "Unisys is where computing's two oldest commercial bloodlines meet: William Seward Burroughs's 1886 adding-machine company, and Sperry's UNIVAC division - built on Eckert and Mauchly, the engineers of ENIAC itself, whose UNIVAC I of 1951 was America's first commercial computer and famously called the 1952 election on CBS. The 1986 merger created Unisys; the mainframe heritage survives in ClearPath.",
    body: ["The profile traces both trunks - the adding machine and ENIAC - through the 1986 merger, the services pivot, and the modern company."],
  },
  {
    slug: "data-general",
    group: "other",
    name: "Data General - the soul of a new machine",
    founded: 1968,
    ended: {
      year: 1999,
      note: "Purchased by EMC in 1999, largely for its CLARiiON storage array line.",
    },
    tagline: "Edson de Castro left DEC to build the Nova; Tracy Kidder's Pulitzer immortalized the Eagle; CLARiiON storage carried the DNA into EMC in 1999.",
    intro: "Data General was born from the industry's most famous walkout: Edson de Castro, designer of DEC's PDP-8, left when Ken Olsen shelved his next design, and the 1969 Nova - elegant, cheap, sixteen bits - forced the entire minicomputer market to respond. Tracy Kidder's The Soul of a New Machine made its Eagle project the most celebrated engineering story ever written.",
    body: ["The profile follows the Nova and Eclipse decades, the AViiON pivot, and the CLARiiON storage line whose 1999 acquisition by EMC seeded the midrange-storage dynasty that lives on at Dell today."],
  },
  // ---- Pioneer wave 3 (PRIME 2026-07-16): the deep bench. ----
  {
    slug: "marconi",
    group: "other",
    name: "Marconi - wireless itself, then the bubble",
    founded: 1897,
    tagline: "Guglielmo Marconi bridged the Atlantic in 1901; a century later the company bearing his name became telecom's starkest dot-com cautionary tale, carved up by Ericsson in 2006.",
    intro: "Marconi is two stories a century apart: the man who made radio a business - transatlantic signals in 1901, the operators aboard Titanic in 1912 - and the GEC conglomerate that took his name in 1999, bet its fortune on telecom equipment at the bubble's exact top, and collapsed within two years. Few lineages contain both the birth of an industry and its most instructive corporate death.",
    body: ["The profile follows the Wireless Telegraph and Signal Company through GEC's electronics empire, the 1999 renaming and acquisition spree, the 2001 collapse, and the 2006 Ericsson carve-up that ended the name in networking."],
  },
  {
    slug: "wang",
    group: "other",
    name: "Wang Laboratories - the office before the PC",
    founded: 1951,
    ended: {
      year: 1999,
      note: "Acquired by Getronics of the Netherlands in 1999. Getronics North America passed to KPN in 2007 and CompuCom in 2008.",
    },
    tagline: "An Wang's core-memory patents funded a word-processing empire that owned the office of the late 1970s - and the PC unmade it inside a decade.",
    intro: "Before the PC, the office ran on Wang: dedicated word-processing systems so dominant that secretaries listed 'Wang' as a skill. Dr. An Wang - who sold his magnetic-core memory patents to IBM and built the Massachusetts Miracle's signature company - saw the minicomputer and the office converge before almost anyone. The general-purpose PC running WordPerfect erased the category he created.",
    body: ["From the 1951 Boston founding through the WPS and VS golden years, the failed succession, and the 1992 Chapter 11, the profile tells the sharpest single-product rise and fall in this section."],
  },
  {
    slug: "tandem",
    group: "other",
    name: "Tandem Computers - the machine that never stops",
    founded: 1974,
    ended: {
      year: 1997,
      note: "Acquired by Compaq in 1997 for $3B, and with Compaq into HP in 2002. The NonStop line survives as an HPE division, so the technology outlived the company by decades.",
    },
    tagline: "Jimmy Treybig's NonStop architecture made fault tolerance a product in 1976; it still runs stock exchanges and card networks today, as HPE NonStop.",
    intro: "Tandem built computers on one premise: no single point of failure - paired processors, mirrored everything, hardware and software designed so the system survives any one fault mid-transaction. ATMs, card networks, stock exchanges, and 911 systems standardized on NonStop, and half a century later the architecture is still sold, by HPE, doing the same jobs.",
    body: ["The profile covers the 1974 founding, the process-pair architecture, the legendary company culture, the ServerNet interconnect whose ideas fed InfiniBand, and the 1997 Compaq acquisition that carried NonStop into HP."],
  },
  {
    slug: "banyan",
    group: "other",
    name: "Banyan Systems - the directory pioneer",
    founded: 1983,
    tagline: "VINES and StreetTalk delivered a true global directory service years before NDS or Active Directory - and lost anyway; the idea won everywhere.",
    intro: "Banyan solved enterprise networking's hardest problem first: StreetTalk, the global naming and directory service inside VINES, let a user log in anywhere on a worldwide network years before Novell's NDS or Microsoft's Active Directory existed. The United States Marine Corps ran on it. Being right early, against NetWare's channel and NT's bundling, was not enough.",
    body: ["The profile pairs naturally with the Novell page: the 1983 founding, the Unix-based VINES architecture, StreetTalk's design lead, the loss of the platform war, and the quiet 2000s dissolution of the company whose core idea now runs every enterprise on earth."],
  },
  {
    slug: "fujitsu",
    group: "other",
    name: "Fujitsu - Japan's computing standard-bearer",
    founded: 1935,
    tagline: "Born from a 1935 Fuji Electric spin-off (itself a Furukawa-Siemens venture), Fujitsu fought IBM with Amdahl, absorbed ICL, and built the K and Fugaku supercomputers.",
    intro: "Fujitsu carries Japan's mainframe century: FACOM computers from the 1950s, the Amdahl partnership that took the IBM-compatible fight to IBM's own customers, the ICL acquisition that made it a European power, and the K and Fugaku machines that twice topped the world's supercomputer rankings. Its optical and network businesses wire a substantial share of the Pacific.",
    body: ["The profile traces the Siemens-adjacent founding lineage, the plug-compatible wars, the services transformation into Japan's largest IT company, and the ARM-based Fugaku era."],
  },
  {
    slug: "nec",
    group: "other",
    name: "NEC - Japan's first joint venture",
    founded: 1899,
    tagline: "Founded 1899 with Western Electric capital; NEAX switched the world's calls, the PC-98 owned Japan's PC market, and the C&C vision named the convergence everyone now lives in.",
    intro: "NEC was Japan's first joint venture with foreign capital - Western Electric, 1899 - and grew into the country's communications backbone: NEAX exchanges, satellites, submarine cable systems, and the SX vector supercomputers behind the Earth Simulator. Its PC-8001 and PC-98 lines dominated Japan's personal-computer market for over a decade, and Koji Kobayashi's 1977 'C&C' - Computers and Communications - named the convergence this whole industry became.",
    body: ["The profile covers the Western Electric founding, the switching and space decades, the PC-98 era, the world-number-one semiconductor years that ended in the Renesas merger, and today's biometrics and submarine-cable strengths."],
  },
  {
    slug: "bell-labs-lucent-alcatel",
    group: "other",
    name: "Bell Labs, Lucent & Alcatel - the transistor's bloodline",
    founded: 1898,
    tagline: "The transistor, information theory, Unix, the laser, cellular - ten Nobel Prizes of foundations, spun into Lucent in 1996, merged with Alcatel in 2006, carried into Nokia in 2016.",
    intro: "No institution shaped this industry more than Bell Telephone Laboratories: the 1947 transistor, Shannon's 1948 information theory, Unix and C, the CCD, the cellular concept. Its corporate afterlife - the record-setting Lucent IPO, the bubble's hardest fall, the Alcatel merger, the Nokia acquisition - is the industry's sharpest lesson that inventing the future and capturing its value are different skills.",
    body: ["The profile covers the 1925 founding, the 1947-1969 invention run, the 1996 trivestiture and Lucent's rise and fall, Alcatel's CGE-to-ITT ascent, the 2006 merger, and the 2016 passage into Nokia - where Bell Labs continues."],
  },
  {
    slug: "intel-amd",
    group: "other",
    name: "Intel & AMD - Fairchild's children: the x86 rivalry",
    founded: 1968,
    tagline: "The 4004, Moore's Law, and the second source that wrote AMD64 - one entry, because neither story parses without the other.",
    intro: "Both companies walked out of Fairchild Semiconductor a year apart - Noyce and Moore in 1968, Jerry Sanders in 1969 - and spent the next half-century pricing computing for everyone. Intel invented the commercial microprocessor and set the industry's cadence; AMD went from licensed second source to the author of the 64-bit x86 instruction set the whole world (Intel included) now runs.",
    body: ["The profile covers the Fairchild exodus, the 4004 and the IBM PC's dual-source mandate, the memory exit, the gigahertz race, the AMD64 irony, Zen's comeback, and the duopoly's diverging bets."],
  },
  {
    slug: "rand",
    group: "other",
    name: "RAND Corporation - where packet switching was imagined",
    founded: 1948,
    tagline: "Paul Baran's 1964 'On Distributed Communications' argued a network with no center could survive anything - AT&T declined to build it; the internet did.",
    intro: "A Santa Monica think tank, not a vendor - included on merit no vendor matches. RAND built the postwar decision sciences (game theory's workshop, linear programming, the Delphi method), ran early AI on its own JOHNNIAC, and employed the engineer whose eleven 1964 reports specified distributed, message-block, store-and-forward networking: the conceptual root of every router on these pages.",
    body: ["The profile covers Project RAND's 1946 origins, the mathematical toolkit years, Baran's survivability argument and its parallel invention by Donald Davies, and the flow of the idea into the ARPANET."],
  },
  {
    slug: "cyclades-network",
    group: "other",
    name: "CYCLADES (IRIA, France)",
    founded: 1971,
    tagline: "Where the datagram was born.",
    intro:
      "Louis Pouzin's 1972-1973 research network at IRIA was the first to make hosts responsible for reliability over an unreliable packet substrate - Pouzin coined the word datagram for it - and Cerf and Kahn's 1974 TCP/IP founding paper cites the work directly.",
    body: [
      "Killed by French PTT politics in favor of Transpac and X.25 (shut down 1977 per INRIA's account, forced off by 1981 per the general record), CYCLADES stands as both the internet's deepest design ancestor and the canonical cautionary tale about monopolies and innovation. Distinct from - and shelved beside - the Brazilian Cyclades of the console-server story: same name, different continent, both honored here.",
    ],
    sources: [
      { label: "INRIA - Between Stanford and Cyclades", url: "https://www.inria.fr/en/between-stanford-and-cyclades-transatlantic-perspective-creation-internet" },
      { label: "History of Computer Communications - CYCLADES and Louis Pouzin", url: "https://historyofcomputercommunications.info/section/8.3/CYCLADES-Network-and-Louis-Pouzin-1971-1972/" },
    ],
  },
  {
    slug: "toshiba",
    group: "other",
    name: "Toshiba - the company that gave the world flash",
    founded: 1875,
    tagline: "Fujio Masuoka invented NOR and then NAND flash at Toshiba in the 1980s - every SSD, phone, and memory card descends from it; the T1100 started the laptop era.",
    intro: "From an 1875 telegraph works founded by a maker of mechanical dolls to the conglomerate that invented flash memory and the mass-market laptop - and then, through the Westinghouse disaster and the accounting scandal, sold the memory crown jewels (today's Kioxia) and left the stock exchange after 74 years. One immortal contribution bracketed by a very mortal corporate story.",
    body: ["The profile covers the Tanaka and Hakunetsusha roots, the 1939 merger, the JW-10 and T1100 firsts, Masuoka's NOR and NAND inventions, the DVD and HD DVD chapters, and the Westinghouse-to-Kioxia unwinding."],
  },
  {
    slug: "hitachi",
    group: "other",
    name: "Hitachi - the industrial giant that stores the world",
    founded: 1910,
    tagline: "From a mine's five-horsepower motor in 1910 to VSP arrays, HGST drives, and Britain's express trains - the conglomerate whose storage lineage runs through every SAN.",
    intro: "Namihei Odaira believed Japan should build its own machines; the repair shop he ran became one of the broadest engineering companies on earth. For this site's purposes the storage line matters most: the plug-compatible mainframe wars (and the 1982 FBI sting), Hitachi Data Systems' enterprise arrays, and the 2003 purchase of IBM's disk-drive business - the company that invented the hard drive, absorbed and carried forward.",
    body: ["The profile covers the 1910 founding, rail from 1924 to the UK fleets, the mainframe era and the IBM case, HDS to Vantara, HGST to Western Digital, and the Lumada-era pivot to data."],
  },
  {
    slug: "bull",
    group: "other",
    name: "Bull - Europe's computing champion",
    founded: 1931,
    tagline: "Punch-card wars against IBM in the 1930s, the prophetic Gamma 60, nationalization and privatization - and a final act building Europe's first exascale supercomputer.",
    intro: "Founded on a Norwegian engineer's tabulator patents, Compagnie des Machines Bull spent ninety years as the definitive national champion: fighting IBM card format against card format, surviving GE and Honeywell ownership, nationalization under Mitterrand, and privatization - to end up, inside Atos/Eviden, building the BullSequana machines that power JUPITER, Europe's first exascale system. The GECOS field in /etc/passwd is its Unix-era fingerprint.",
    body: ["The profile covers Fredrik Rosing Bull's patents, the Gamma 3 and Gamma 60, Plan Calcul and CII-Honeywell-Bull, the Groupe Bull years, the HPC pivot from Tera-10 to BullSequana, and the Atos/Eviden exascale finale."],
  },
  {
    slug: "ncsa",
    group: "other",
    name: "NCSA - the campus lab that made the web visible",
    founded: 1986,
    tagline: "Mosaic gave the web a face in 1993; NCSA httpd's orphaned patches became Apache; NCSA Telnet networked a generation of campuses.",
    intro: "A national supercomputing center whose side projects changed the world: Andreessen and Bina's Mosaic made the internet something you could see (and, via Spyglass, seeded Internet Explorer too), Rob McCool's httpd and CGI defined how the early web served and ran programs, and its patch community became the Apache HTTP Server. The Netscape page on this site is the sequel to this one.",
    body: ["The profile covers the 1983 Black Proposal and 1986 founding, NCSA Telnet, Mosaic's 1993 explosion and its two browser-war descendants, httpd and CGI, and the birth of Apache from the orphaned patches."],
  },
  {
    slug: "ciena",
    group: "other",
    name: "Ciena - the company that taught fiber to carry colors",
    founded: 1992,
    tagline: "The first commercial DWDM deployment (Sprint, 1996) multiplied installed fiber sixteenfold - and Ciena has compounded the optical layer ever since, Nortel inheritance included.",
    intro: "David Huber's dense wavelength-division multiplexing turned one strand of glass into sixteen channels without digging a meter of trench - the 1996 Sprint deployment that changed long-haul economics overnight. Ciena survived the crash that killed its rivals, inherited Nortel's optical crown in 2010, and its WaveLogic coherent optics have made wavelength capacity a semiconductor curve.",
    body: ["The profile covers the 1992 founding, the MultiWave 1600 and the record 1997 IPO, the crash years, the Nortel optical acquisition, and the coherent era from 40G to today's 800G class."],
  },
  {
    slug: "sniffer-lineage",
    group: "other",
    name: "The Sniffer lineage - Network General to NetScout",
    founded: 1984,
    tagline: "The 1986 Sniffer made protocol analysis a profession; through Dolch luggables, Network Associates, and Arbor's DDoS telemetry, the whole bloodline converged on NetScout.",
    intro: "One entry for five companies, because they are one story: Network General's Sniffer named the practice every engineer still uses, Volker Dolch's rugged luggables were its field chassis, the Network Associates merger and un-merger carried the brand through the roll-up era, Arbor Networks scaled packet thinking to internet-wide DDoS telemetry - and NetScout, founded two years before the Sniffer existed, became the house where the whole analyzer tradition came home.",
    body: ["The profile covers the 1986 Sniffer, Sniffer University, the Dolch chassis, the 1997 NAI merger and 2004 rebirth, Arbor's Peakflow and ATLAS, and NetScout's 2007 and 2015 consolidating acquisitions."],
  },
  {
    slug: "dolch",
    group: "other",
    name: "Dolch (Kontron / Azonix lineage)",
    founded: 1987,
    tagline: "The rugged luggable the Sniffer lived in.",
    intro:
      "Dolch Computer Systems built the suitcase-format rugged portables that carried a generation of field engineering - and, above all, Network General's Sniffer analyzer, which shipped on Dolch PACs so routinely the Computer History Museum catalogs them as Sniffer platforms.",
    body: [
      "Founded 1987 in California by Volker Dolch; twice ranked first in rugged portables (VDC, 1999 and 2002); acquired by Kontron AG in February 2005, with the rugged mobile platform passing to Azonix in 2007. The hardware half of the packet-analysis story told in the Sniffer lineage profile.",
    ],
    sources: [
      { label: "Wikipedia - Dolch", url: "https://en.wikipedia.org/wiki/Dolch" },
      { label: "Kontron - acquisition announcement (2005)", url: "https://www.kontron.com/en/news/kontron-ag-completes-acquisition-of-dolch-computer-systems-inc/n128919" },
      { label: "Computer History Museum - Dolch network analyzer materials", url: "https://www.computerhistory.org/collections/catalog/102727516" },
    ],
  },
  {
    slug: "blue-coat-packeteer",
    group: "other",
    name: "Blue Coat & Packeteer - the checkpoint companies",
    founded: 1996,
    tagline: "CacheFlow's pivot made the proxy a security platform; PacketShaper created traffic shaping - together, the prehistory of the SSE category.",
    intro: "Two 1996 companies that answered the same question - what happens at the checkpoint - for content and for bandwidth. Blue Coat (born CacheFlow) made the inline proxy the enterprise web's enforcement point, SSL inspection included; Packeteer's PacketShaper taught the WAN that traffic has identity. Merged in 2008, carried through Symantec into Broadcom, their architecture is what every cloud secure web gateway runs today.",
    body: ["The profile covers the legendary CacheFlow IPO, the 2002 pivot to Blue Coat, PacketShaper's category creation, the 2008 acquisition, the private-equity years, and the Symantec-to-Broadcom passage."],
  },
  {
    slug: "cyclades-avocent-vertiv",
    group: "other",
    name: "Cyclades, Avocent & Vertiv - the physical layer of uptime",
    founded: 1965,
    tagline: "A Brazilian-founded console-server pioneer, the KVM leaders, and Liebert's computer-room weather - consolidated into the company whose product is uptime itself.",
    intro: "Cyclades - founded in 1988 in a São Paulo garage by João Lima and Daniel Dalarossa, an early Linux champion that later moved to California - built the out-of-band discipline: the console path that shares no fate with the network it manages. Through Avocent's KVM heritage and Emerson Network Power (whose other root is Ralph Liebert's 1965 precision cooling), the lineage became Vertiv: access, power, and cooling as one problem, now the constraint the AI build-out plans around. The name also earns an honorable footnote: Pouzin's CYCLADES research network - TCP/IP's credited French ancestor - now has its own profile in this pioneer lineage; same name, different continent, no corporate relation.",
    body: ["The profile covers the 1989 Brazilian founding, the console-server category, the 2006 Avocent acquisition, Emerson Network Power and the Liebert root, the 2016 Vertiv carve-out, and the AI-density era."],
  },
  {
    slug: "dell-force10",
    group: "other",
    name: "Dell & Force10 - the direct model and its fabric",
    founded: 1984,
    tagline: "A dorm-room assembler became the datacenter's broadest supplier - and the 10GbE pioneer it absorbed in 2011 became its switching lineage.",
    intro: "Michael Dell's direct model reset how hardware reaches buyers; the 2013 take-private and the 2016 EMC acquisition - the largest technology deal in history - rebuilt the company around the datacenter. Inside it runs Force10's engineering: the 1999 startup whose purpose-built E-Series delivered line-rate 10 Gigabit Ethernet before anyone else, whose FTOS lineage survives as Dell's switching OS today.",
    body: ["The profile covers the 1984 dorm-room founding and the direct model, Force10's E1200 and HPC fabrics, the 2011 acquisition, the take-private, the EMC megadeal, and the PowerSwitch present."],
  },
  {
    slug: "zte",
    group: "other",
    name: "ZTE - China's other giant",
    founded: 1985,
    tagline: "Shenzhen 1985, top-four in 5G - and the 2018 denial order that made supply-chain dependency the industry's most vivid lesson.",
    intro: "Founded two years before its Shenzhen neighbor Huawei, ZTE grew from digital switching into one of the world's four mobile-equipment majors. In April 2018 a US component ban halted the company within weeks; the $1.4 billion settlement that restarted it - fine, escrow, replaced management, embedded monitors - turned 'where does your silicon come from' into a board-level network-design question everywhere.",
    body: ["The profile covers the 1985 founding, the ZXJ10 era, global scale through CDMA and handsets, the 2017 plea and 2018 denial-order crisis with its settlement, and the bifurcated 5G market ZTE now inhabits."],
  },
  {
    slug: "fluke",
    group: "other",
    name: "Fluke - the meters and certifiers in every field bag",
    founded: 1948,
    tagline: "The 87 multimeter and the DSX CableAnalyzer - and a 2015 three-way split (Fortive, NetScout, NetAlly) worth knowing cold.",
    intro: "John Fluke Sr.'s 1948 instruments company became the generic word for the multimeter itself, and Fluke Networks made cabling certification an instrument category with legal weight. The 2015 Danaher deal split the story: enterprise visibility went to NetScout (the handheld line later reborn as NetAlly), while cable certification stayed Fluke Networks under Fortive - one company, three present-day homes.",
    body: ["The profile covers the 1948 founding, the 87, the DSP-to-DSX certification lineage, AirMagnet, the carefully-told 2015 split, and the Fortive present."],
  },
  {
    slug: "dns-bind",
    group: "other",
    name: "DNS & BIND - the internet's phone book and its reference implementation",
    founded: 1983,
    tagline: "Mockapetris's 1983 design and Berkeley's software that ran it - delegation, caching, and forty years of the same wire format.",
    intro: "Before the DNS, the internet's names lived in a text file everyone downloaded. Paul Mockapetris's 1983 design replaced it with a delegated, cached, planetary database - and four Berkeley grad students wrote BIND, the implementation that made 'running DNS' and 'running BIND' the same sentence for a quarter century.",
    body: ["The profile covers HOSTS.TXT's collapse, RFC 882/883 and 1034/1035, the MX record, Vixie and ISC, BIND 9, the Kaminsky patch, the 2010 root signing, Dyn day, and the DoT/DoH era."],
  },
  {
    slug: "http-gopher",
    group: "other",
    name: "HTTP & Gopher - the web's protocol and the rival it eclipsed",
    founded: 1989,
    tagline: "Two futures shipped in 1991; one spring of licensing decided between them - CERN gave the web away, Minnesota asked for money.",
    intro: "Gopher was the better-organized system and for two years it was winning. Then, weeks apart in 1993, Minnesota announced server fees and CERN declared the web royalty-free forever - the cleanest natural experiment in protocol economics ever run. HTTP went on to replace its own transport twice without breaking a URL.",
    body: ["The profile covers the 1989 CERN proposal and HTTP/0.9, Gopher's rise and Veronica, the spring-1993 licensing fork, Mosaic, the Host header, REST, and the HTTP/2-to-HTTP/3-over-QUIC arc this site's WAF material continues."],
  },
  {
    slug: "nvidia",
    group: "contemporary",
    name: "Nvidia - the GPU company that runs the fabric",
    founded: 1993,
    tagline: "CUDA's decade-early bet, the AlexNet ignition, Mellanox - the network's biggest customer became one of its vendors.",
    intro: "Nvidia named the GPU, made it programmable a decade before the world needed it, and became the platform of the AI era. For this site's readers the 2020 Mellanox acquisition is the hinge: InfiniBand, Spectrum-X Ethernet, and BlueField DPUs make Nvidia simultaneously the most demanding workload networks carry and a top-tier network vendor - both sides of the AI-fabric argument.",
    body: ["The profile covers the 1993 founding, RIVA-to-GeForce survival and naming, CUDA, AlexNet, the Mellanox networking turn, the trillion-dollar ascent, and the NVLink/InfiniBand/Spectrum-X fabric wars."],
  },
  {
    slug: "ubiquiti",
    group: "contemporary",
    name: "Ubiquiti - enterprise features at prosumer prices",
    founded: 2005,
    tagline: "airMAX armed the WISPs, UniFi made the controller model a $200 purchase - and two incidents every security reader should know cold.",
    intro: "Robert Pera's bet was that big-vendor radio performance could ship at a fraction of the price, sold by community instead of a sales force. airMAX connected the places carriers skipped; UniFi became the default answer for small networks and a rising share of serious ones. Kept factual, its 2015 BEC fraud and 2020-21 insider case are canonical security teaching material.",
    body: ["The profile covers the 2005 founding, the WISP world, UniFi and the 2011 IPO, the product-led model, and the two incidents on the public record."],
  },
  {
    slug: "access-home-fleet",
    group: "contemporary",
    name: "The access & home fleet - Netgear, TP-Link, Zyxel, Asus & Askey, Allied Telesis",
    founded: 1987,
    tagline: "The boxes everyone actually owns: the first hop of most packets on Earth, told as one fleet.",
    intro: "Five names, one layer: the CPE and SOHO gear that put networking in ordinary rooms. Netgear's Bay Networks spinoff roots, TP-Link's decade-plus shipment crown, Zyxel's modem-era pedigree, the ASUS/Askey retail-and-ODM pairing, and Allied Telesis holding the access edge since 1987 - plus the 2024 geopolitics that scale eventually attracts.",
    body: ["The profile tells the five foundings, the mesh and cloud-management turns, the enthusiast-firmware culture, the invisible carrier-ODM fleet, and why this tier is both the industry's proving ground and its largest attack surface."],
  },
  {
    slug: "watchguard",
    group: "contemporary",
    name: "WatchGuard - the red box that made the firewall an appliance",
    founded: 1996,
    tagline: "The 1996 Firebox turned security from a project into an object - and the mid-market has run on it since.",
    intro: "WatchGuard's founding bet was packaging: firewall software sealed into a red steel appliance, priced and consoled for the company with one IT person. The category the giants now dominate was proven here first - and the company never abandoned the mid-market and MSP channel it created.",
    body: ["The profile covers the Firebox, the 1999 IPO and 2006 take-private, the UTM years on Fireware, AuthPoint, the Panda Security acquisition, and the MSP-first present."],
  },
  {
    slug: "a10-kemp",
    group: "contemporary",
    name: "A10 & Kemp - the ADC challengers",
    founded: 2000,
    tagline: "The second tier that kept the load-balancing leaders honest: A10 from the throughput flank, Kemp from below.",
    intro: "Application delivery never became a monopoly, and these two are why. Lee Chen's A10 built its franchise where traffic is heaviest - CGNAT, DDoS, the service-provider tier - while Kemp's LoadMaster priced the ADC for the Exchange administrator and went virtual before the market did. Every leader's quote was written knowing they existed.",
    body: ["The profile covers both foundings, the Brocade litigation chapter, the 2014 A10 IPO, the CGNAT decade, Thunder TPS, Kemp's virtual-first bet, and the 2021 Progress acquisition."],
  },
  {
    slug: "datacom",
    group: "contemporary",
    name: "Datacom - Brazil's networking manufacturer",
    founded: 1998,
    tagline: "The hometown entry: carrier gear, GPON, and a national OS, designed and built in Rio Grande do Sul since 1998.",
    intro: "Every other company in this encyclopedia had to be imported into Brazil; Datacom grew there. Its own switching and GPON lines on its own DmOS carried the country's regional-ISP fiber boom - a standing existence proof that network sovereignty is buildable, born of the same Brazilian engineering tradition that a decade earlier produced Cyclades.",
    body: ["The profile covers the 1998 founding, the DmSwitch carrier-Ethernet years, DmOS, the provedores' GPON wave, the domestic-financing structural factor stated plainly, and the quarter-century mark."],
  },
  // ---- Contemporary additions, PRIME roster 2026-07-22, importance-ranked ----
  {
    slug: "asus-askey",
    group: "contemporary",
    name: "ASUS + Askey",
    founded: 1989,
    tagline: "The motherboard empire and its network-communications arm.",
    intro:
      "ASUS grew from four ex-Acer engineers' 1989 motherboard startup into the world's fifth-largest PC vendor; Askey, founded the same year and later an ASUS Group member, is the invisible ODM behind decades of carrier modems, gateways, and 5G CPE - with offices that include Brazil.",
    body: [
      "Consolidated into one profile per the corporate reality: the branded systems giant and the white-label access-hardware machine, one group, both 1989 Taipei foundings.",
    ],
    sources: [
      { label: "Wikipedia - Asus", url: "https://en.wikipedia.org/wiki/Asus" },
      { label: "Askey - about", url: "https://www.askey.com.tw/about/" },
    ],
  },
  {
    slug: "netgear",
    group: "contemporary",
    name: "NETGEAR",
    founded: 1996,
    tagline: "The company that put networking on the retail shelf.",
    intro:
      "Founded inside Bay Networks in 1996 by Patrick Lo and Mark Merrill, NETGEAR invented networking-as-retail: the blue metal switches, then Nighthawk and Orbi - the first networking gear millions of people ever bought themselves.",
    body: [
      "Survived the Nortel absorption of its parent, reached independence and a NASDAQ listing in 2003, spun Arlo off in 2018, and still defines what home and small-business networking looks like on a shelf.",
    ],
    sources: [
      { label: "NETGEAR - company", url: "https://www.netgear.com/about/" },
    ],
  },
  {
    slug: "tp-link",
    group: "contemporary",
    name: "TP-Link",
    founded: 1996,
    tagline: "The volume king of consumer networking.",
    intro:
      "Founded in Shenzhen in 1996 by brothers Zhao Jianjun and Zhao Jiaxing - the name abbreviates twisted pair link - TP-Link rode disciplined cost-performance to the top of global consumer WLAN shipment rankings and stayed there for years.",
    body: [
      "Archer and Deco carry the volume core, Omada takes the controller model to the SMB value tier, Tapo reaches into the smart home - and, kept factual, US-government scrutiny reported since late 2024 remains on the public record, unresolved at verification.",
    ],
    sources: [
      { label: "TP-Link - about", url: "https://www.tp-link.com/about-us/" },
    ],
  },
  {
    slug: "zyxel",
    group: "contemporary",
    name: "Zyxel",
    founded: 1988,
    tagline: "The modem-era first-mover from Hsinchu.",
    intro:
      "Begun in a rented Taoyuan apartment in 1988 and founded at Hsinchu Science Park in 1989 by Dr. Shun-I Chu, Zyxel built the U-1496 modems the BBS generation saved up for - then shipped the world's first integrated data/fax/voice modem (1992) and analog/digital ISDN modem (1995).",
    body: [
      "Listed in Taiwan in 1999 and restructured under the Zyxel Group holding, it still ships carrier CPE and SMB networking-and-security across every access generation since the modem - with the 2025 end-of-life zero-day episode kept honestly in the record.",
    ],
    sources: [
      { label: "Zyxel - company history", url: "https://www.zyxel.com/global/en/company/about-zyxel" },
      { label: "Wikipedia - Zyxel", url: "https://en.wikipedia.org/wiki/Zyxel" },
    ],
  },
  {
    slug: "allied-telesis",
    group: "contemporary",
    name: "Allied Telesis",
    founded: 1987,
    tagline: "Japan's global Ethernet workhorse, from media converters up.",
    intro:
      "Takayoshi Oshima (1940-2022) founded the company in Tokyo in March 1987 - System Plus for six months, Allied Telesis ever after, Allied Telesyn to a generation of international buyers - starting from the humblest product in networking: the media converter.",
    body: [
      "Listed in Tokyo in 2000, dual-hearted between Japan and San Jose, and built on the unglamorous middle of the market: the switches and converters that run schools, factories, and city infrastructure for decades between thoughts.",
    ],
    sources: [
      { label: "Allied Telesis - founder memorial", url: "https://www.alliedtelesis.com/us/en/press/mr-takayoshi-oshima-founder-and-ceo-allied-telesis" },
      { label: "Wikipedia - Allied Telesis", url: "https://en.wikipedia.org/wiki/Allied_Telesis" },
    ],
  },
];

/** Look up a partner vendor by slug. */
export function getPartnerVendor(slug: string): PartnerVendor | undefined {
  return partnerVendors.find((v) => v.slug === slug);
}

/** All slugs, for static generation. */
export const partnerVendorSlugs = partnerVendors.map((v) => v.slug);
