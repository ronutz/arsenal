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

/**
 * WHAT A COMPANY IS, for filtering. Ratified by PRIME on 2026-08-01.
 *
 * A company may hold SEVERAL of these and most large ones do: NTT is a carrier,
 * a services firm and a data centre operator at once. That is the point of tags
 * rather than a single category - the existing `group` field could only ever
 * say one thing, and said very little.
 *
 * These also make `/industry/distributors` and `/industry/resellers` derived
 * views rather than hand-maintained lists, which is how PRIME originally asked
 * for them. A list somebody maintains by hand drifts; a filter cannot.
 *
 * The vocabulary is CLOSED. A guard fails the build on anything not in it, so
 * adding a tag is a deliberate act rather than a typo that quietly creates a
 * ninth category.
 */
export type VendorTag =
  /** Makes the product. F5, Cisco, Fortinet, Nozomi, Elastic. */
  | "vendor"
  /** Two-tier distribution: sells to resellers, not to end users. */
  | "distributor"
  /** Value-added reseller or integrator: sells and implements for end users. */
  | "reseller"
  /** Consulting, outsourcing, managed services, BPO. */
  | "services"
  /** Telecommunications operator carrying somebody else's traffic. */
  | "carrier"
  /** Colocation, hosting, interconnection. */
  | "datacentre"
  /** Certification, education and training. */
  | "training"
  /** Standards bodies and industry associations. */
  | "standards";

/** The closed vocabulary, for the guard and for filter UIs. */
export const VENDOR_TAGS: readonly VendorTag[] = [
  "vendor",
  "distributor",
  "reseller",
  "services",
  "carrier",
  "datacentre",
  "training",
  "standards",
] as const;

/**
 * PRIME'S RELATIONSHIP TO A COMPANY. A SECOND AXIS, kept separate from `tags`
 * on purpose (PRIME 2026-08-02).
 *
 * `tags` say what a company IS - vendor, distributor, carrier. These say what
 * the relationship to it is. Filtering "show me distributors" and filtering
 * "show me what I am authorised to teach" are different questions, and folding
 * them into one closed vocabulary would make both filters incoherent: a list
 * containing `distributor`, `carrier` and `authorized-instructor` is not a
 * classification, it is two classifications in a trenchcoat.
 *
 * *** THESE ARE PUBLIC CLAIMS ABOUT AUTHORISATION AND MUST BE EXACT. ***
 * `authorized-instructor` is asserted for FOUR vendors only, on PRIME's
 * explicit instruction of 2026-08-02. It must never be inferred from a
 * partnership, a certification or a delivered course.
 */
export type VendorRelationship =
  /** Red Education is a partner of this vendor. */
  | "red-education-partner"
  /** PRIME is an authorised instructor for this vendor. Four only. */
  | "authorized-instructor"
  /**
   * PRIME was employed by this company.
   *
   * ADDED 2026-08-05 (PRIME). The card pill was previously derived from
   * whether a vendor had a careerChapter, which made every company in the
   * career record read as an employer. Most were not: several were vendors he
   * worked WITH from a partner, reseller or distributor position. That is a
   * different claim, and the kind that matters on a public page about
   * somebody's working life.
   *
   * The distinction is now data rather than inference.
   */
  | "worked-inside"
  /**
   * PRIME worked with this vendor directly from a partner, reseller or
   * distributor position - not as an employee. Rendered as "Worked with
   * directly", which is the phrase the career pages already use.
   */
  | "worked-with-directly"
  /**
   * PRIME works here NOW. Present tense, and it is the only one of these
   * relationships that is.
   *
   * ADDED 2026-08-11 (PRIME: the pill "should read WORKS INSIDE"). Every other
   * relationship on this list is a completed fact; this one is a continuing
   * one, and rendering it in the past tense alongside companies he left a
   * decade ago said something untrue about a job he currently holds.
   *
   * Modelled as data rather than as a hardcoded slug in the component, because
   * "which company does he work at" is a fact about the record, not about the
   * page - and it will change again one day.
   */
  | "works-inside"
  /**
   * PRIME has an ACTIVE working relationship with this vendor now. Present
   * tense, like `works-inside`, and distinct from it: he works WITH these
   * companies rather than inside them.
   *
   * ADDED 2026-08-11 (PRIME). Seven vendors carry it, and the important part
   * is what it is NOT:
   *
   *   WORKS WITH  - an active relationship exists today. Seven vendors.
   *   TEACHES     - `authorized-instructor`, and there are FOUR of those.
   *
   * The two overlap without being the same claim. Ping Identity, Zscaler and
   * Check Point are worked with and NOT taught; conflating the two would put
   * an instructor claim on three vendors where none exists, which is the exact
   * failure the `worked-inside` split of 2026-08-05 was created to prevent.
   *
   * Also distinct from `worked-with-directly`, which is the PAST tense of this
   * and stays on the companies whose relationship has ended.
   */
  | "works-with";

export const VENDOR_RELATIONSHIPS: readonly VendorRelationship[] = [
  "red-education-partner",
  "authorized-instructor",
  "worked-inside",
  "worked-with-directly",
  "works-inside",
  "works-with",
] as const;

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
  /**
   * What this company IS. Several may apply. See VendorTag.
   * Optional in the type so the field can be rolled out without breaking the
   * build; the guard requires at least one on every entry.
   */
  tags?: VendorTag[];
  /**
   * Relationship to this company. Separate axis from `tags`. See
   * VendorRelationship - and note that `authorized-instructor` is a public
   * claim about authorisation, not a description of experience.
   */
  relationships?: VendorRelationship[];
  /**
   * THE COMPANY'S OWN PLACE ON THE WEB (golden content standard, PRIME
   * 2026-08-06: "vendor profiles should have a link section to the vendor's
   * main page and resources").
   *
   * Deliberately separate from `sources`. A source is something this site cites
   * as evidence for a claim; a homepage is where a reader goes next to read the
   * company's own account of itself. Conflating them would let marketing copy
   * masquerade as corroboration.
   *
   * `defunct` is not an oversight - it is the honest answer for a company that
   * no longer exists. Silicon Graphics has no homepage; a link labelled
   * "Silicon Graphics" that lands on an acquirer's product page tells the
   * reader something false about who is still trading. Where a successor is
   * worth pointing at, `successor` names it explicitly so the reader knows
   * whose site they are being sent to.
   */
  official?: {
    /** The company's own site. Omit entirely if the company is gone. */
    url?: string;
    /** Documentation, developer portal, knowledge base - the useful part. */
    resources?: { label: string; url: string }[];
    /** True where the company no longer trades under this name. */
    defunct?: boolean;
    /** Who to read instead, named so the reader is not misled about whose site it is. */
    successor?: { label: string; url: string };
  };
  sources?: {
    label: string;
    url: string;
    /**
     * Optional qualification of the source itself - what it is good for and
     * what it is not. Added 2026-08-01 for the Brazilian entries, where the
     * available material is often a business directory or an aggregator
     * carrying a company's own copy. Being able to say "this page is used for
     * the self-description and NOT for the revenue figure printed beside it"
     * is the difference between citing a source and hiding behind one.
     */
    sourceNote?: string;
  }[];
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
   * Slug of the career chapter at /industry/chapters/<slug>, when PRIME worked
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
  // ---- GROUP: Red Education training partners ----
  // Instructor authorisation is declared per company in `relationships` and
  // NOWHERE ELSE. Do not restate it here, and do not state its absence: this
  // file describes companies, and a comment asserting who does or does not
  // teach a vendor goes stale the moment an authorisation changes - which is
  // exactly what happened to the sentence that used to sit on this line.
  {
    slug: "nutanix",
    official: {
      url: "https://www.nutanix.com",
      resources: [
        { label: "Nutanix Support Portal", url: "https://portal.nutanix.com/page/documents/list" },
      ],
    },
    // Red Education partner (Courses by Vendor nav + every regional menu). Verified against
    // rededucation.com 2026-08-06.
    relationships: ["red-education-partner"],
    tags: ["vendor"],
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
    official: {
      url: "https://openai.com",
      resources: [
        { label: "OpenAI Platform docs", url: "https://platform.openai.com/docs" },
      ],
    },
    tags: ["vendor"],
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
    official: {
      url: "https://www.anthropic.com",
      resources: [
        { label: "Claude Docs", url: "https://docs.claude.com" },
      ],
    },
    tags: ["vendor"],
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
    tags: ["vendor"],
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
    // (A comment here previously said the founding year was not in the public
    // record. A `founded` value now sits below it, so the comment contradicted
    // the code and was removed 2026-08-10 - a comment asserting the opposite of
    // the code is read as evidence.)
    slug: "sixdegrees",
    official: {
      defunct: true,
    },
    tags: ["vendor"],
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
    tags: ["vendor"],
    group: "other",
    name: "Genesys",
    founded: 1990,
    tagline: "Two sons of Soviet emigres met at a card game and decided the phone call and the customer record should arrive together.",
    intro:
      "Genesys Telecommunications Laboratories was founded in October 1990 by Gregory Shenkman and Alec Miloslavsky. Their parents had fled the Soviet Union in 1980 and settled in the Russian community in San Francisco; the two men met years later at a card game. The seed capital was $150,000 in loans from their families, and the first office was in Daly City.",
    body: [
      "Miloslavsky had studied civil engineering at Berkeley and worked for Steve Jobs at Pixar - which connects this page to the Apple entry on this timeline, where Jobs's purchase of Lucasfilm's computer graphics division is recorded. Shenkman had been a telecommunications salesman. Neither combination obviously produces a contact centre company.",
      "The idea was small, precise and turned out to be enormous. When a call arrived at a business in 1990, the telephone system knew the number and the computer system knew the customer, and the two never spoke to each other. So an agent answered, asked who you were, and typed it in - every time, for every call. Computer telephony integration joined those two systems, and the visible result was the screen pop: the phone rings and the customer's record is already open.",
      "Genesys shipped T-Server in 1991 to do that, and then went further than the pop - routing calls on skills rather than on whoever was free, which means the question stops being *is a person available* and becomes *is the right person available*. That reframing is the whole of modern contact-centre design, and the software sat as middleware between switches the customer already owned.",
      "It listed on NASDAQ in June 1997 as GCTI, raising $45M at $18 a share. Alcatel then bought it for $1.5B, announced in 1999 and completed in January 2000 depending on which source you read, and it disappeared into a telecommunications giant for twelve years.",
      "Alcatel-Lucent is a second connection to this timeline. Riverstone Networks, a career chapter on this site, had its assets bought by Lucent in 2006 and absorbed into Alcatel-Lucent when the two merged that year. So a metro Ethernet business from a Cabletron spin-off and a call-routing company from a Daly City garage ended up inside the same French-American parent by entirely different routes.",
      "In February 2012 Permira and TCV bought Genesys out of Alcatel-Lucent for $1.5B - the same figure Alcatel had paid twelve years earlier. A company can be worth exactly what it cost, a dozen years on, and that fact says more about who owned it than about what it built.",
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
    // ARCSIGHT - added 2026-07-31 (PRIME). Pairs with SPLUNK, already here: two
    // answers to the same problem, and two different fates.
    //
    // *** FOUNDER DISCREPANCY, SUBSTANTIAL. *** Sources name different people.
    // Hugh Njemanze appears in every account; Alex Daly is the founding CEO per
    // Wikipedia; one source adds Pravin Kothari; another names Tom Reilly, who
    // was a LATER chief executive rather than a founder. Only the consistent
    // names are stated and the disagreement is recorded.
    slug: "arcsight",
    official: {
      defunct: true,
      successor: { label: "OpenText, which holds the ArcSight portfolio", url: "https://www.opentext.com" },
    },
    tags: ["vendor"],
    group: "other",
    name: "ArcSight",
    founded: 2000,
    ended: {
      year: 2010,
      note: "Acquired by HP for about $1.5B, completing 22 October 2010. The product line then passed to HPE in the 2015 split, to Micro Focus on 1 September 2017, and to OpenText in 2023 - four owners in thirteen years.",
    },
    tagline: "Decided in advance what mattered, which is the opposite of what its main rival decided.",
    intro:
      "ArcSight was incorporated in Delaware on 3 May 2000 under the name Wahoo Technologies, and renamed before it shipped anything. Hugh Njemanze was its founding chief technology officer and is the one name every account agrees on - he has been described as the initial architect of security information and event management, and holds more than twenty patents in the field. Alex Daly is recorded as founding chief executive. Other sources name other founders, and they do not reconcile, so only the consistent names appear here.",
    body: [
      "The problem it existed to solve is worth stating in plain terms. A large network produces millions of log lines a day from firewalls, servers, applications and intrusion sensors, each in its own format, none of which means anything alone. A failed login is noise. Four hundred failed logins from one address, followed by one success, followed by an outbound transfer, is an incident. Somebody has to notice the difference at three in the morning.",
      "ArcSight's answer was ESM, and the architecture is the interesting part. It normalised every event into a common schema first, so a Cisco denial and a Windows audit failure became comparable objects, and then ran correlation rules over that stream. The rules encode what you already know matters. That is a real commitment: you decide in advance what an incident looks like, and the system watches for it continuously.",
      "Set that against Splunk, which is also on this timeline, and you have two opposite bets. Splunk indexed the raw data and let you search it afterwards, deciding what mattered once you had a reason to ask. ArcSight decided first and watched. Rules catch what you anticipated, at the moment it happens; search finds what you did not anticipate, after you know to look. Neither is wrong, and most mature security teams eventually run something of each - but the two designs pulled the market in different directions for a decade.",
      "The company's backing is a detail worth noticing: alongside Kleiner Perkins, its early investors included In-Q-Tel, the venture arm of the CIA. It went public in 2008, and by its 2010 fiscal year was reporting $181.4M of revenue from over a thousand customers with 512 employees, having grown at roughly forty per cent a year.",
      "HP acquired it in 2010 at $43.50 a share, all cash, about $1.5B, completing on 22 October. Then the ownership chain that this timeline keeps producing: the 2015 HP split sent it to Hewlett Packard Enterprise; HPE merged its software business into Micro Focus, finalised 1 September 2017; and OpenText acquired Micro Focus in 2023. Four owners in thirteen years, none of whom wrote it.",
      "And that is the contrast that makes the pair worth reading together. Splunk stayed independent for two decades and was bought by Cisco in 2024 for around $28B as a strategic centrepiece. ArcSight was bought early, then carried along through three further transactions as one line item in somebody else's portfolio. Same market, same era, comparable technical achievement - and the difference in outcome had far more to do with when each sold than with which architecture was better.",
      "Njemanze went on to run engineering and research for HP's enterprise security group, and later became chief executive of ThreatStream, which became Anomali.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/ArcSight",
    externalLabel: "ArcSight",
    sources: [
      { label: "Wikipedia: ArcSight - incorporated May 2000 in Cupertino, Alex Daly as founding CEO and Hugh Njemanze as founding CTO, the HP acquisition in 2010, transfer to HPE in the split, sale to Micro Focus, and OpenText acquiring Micro Focus in 2023", url: "https://en.wikipedia.org/wiki/ArcSight" },
      { label: "OpenText community: incorporated in Delaware on 3 May 2000 as Wahoo Technologies before the rename; HP's acquisition completing 22 October 2010; the Micro Focus merger finalised 1 September 2017", url: "https://community.opentext.com/cybersec/b/cybersecurity-blog/posts/celebrating-20-years-of-arcsight-and-the-evolution-of-siem" },
      { label: "SEC filing (HP tender offer, 2010): $43.50 per share all cash, 512 employees, 1,000+ customers, FY10 revenue of $181.4M and roughly 40% CAGR over three years", url: "https://www.sec.gov/Archives/edgar/data/0001368582/000110465910048334/a10-17787_2ex99d1.htm" },
      { label: "Channel Futures: Njemanze described as the initial architect of SIEM, with more than twenty issued patents, leading HP enterprise security engineering after the acquisition and later becoming CEO of ThreatStream", url: "https://www.channelfutures.com/channel-business/threatstream-appoints-arcsight-co-founder-hugh-njemanze-as-ceo" },
      { label: "Startup profile: Kleiner Perkins and In-Q-Tel among early investors, the 2008 IPO, and an alternative founder attribution naming Pravin Kothari - recorded here as a discrepancy", url: "https://startupintros.com/orgs/arcsight-inc" },
    ],
  },
  {
    // ACCENTURE - added 2026-08-01 (PRIME).
    //
    // The entry is built on one irony, and it is a documented one rather than a
    // rhetorical one: they fought for years to keep a name, LOST that argument,
    // were forced to abandon it at great cost - and eighteen months later the
    // name was radioactive.
    //
    // TWO DISCREPANCIES RECORDED: the settlement is reported at ~$1B and
    // ~$1.2B; and the employee who proposed the name is described as based in
    // Oslo by most sources and as Danish by one.
    slug: "accenture",
    official: {
      url: "https://www.accenture.com",
    },
    tags: ["services"],
    group: "other",
    name: "Accenture",
    founded: 1989,
    tagline: "Spent years fighting to keep a name, lost, and it was the luckiest defeat in consulting.",
    intro:
      "The consulting practice grew inside Arthur Andersen, the accounting firm founded in 1913. It was formally constituted as Andersen Consulting in 1989 under a Swiss holding entity, with an arrangement that would cause everything that followed: the consultants generated most of the revenue and shared a portion of it with the accountants.",
    body: [
      "One early engagement belongs on this timeline for its own sake. In 1953 the practice ran a feasibility study for General Electric that led to the installation of a UNIVAC I - among the first uses of a computer for ordinary business administration rather than for science or defence. UNIVAC appears elsewhere here as one of the BUNCH, the five manufacturers that spent the 1960s competing with IBM.",
      "The relationship soured over exactly what you would expect. By the 1980s the consultants were producing the larger share of income while paying it upward, and in 1995 Arthur Andersen established a consulting arm of its own - which the consultants regarded as a breach of the spirit of the agreement, whatever the letter said. In December 1997 the Andersen Consulting partners voted unanimously to dissolve the partnership, citing serious breaches of contract and irreconcilable differences, and took it to arbitration at the International Chamber of Commerce.",
      "The ruling, on 7 August 2000, went against them on the question they had asked. The arbitrator, Guillermo Gamba, found that Arthur Andersen had not technically breached the 1989 agreement. He granted full separation anyway - but required the consultancy to pay a settlement, reported at around $1B and in some accounts $1.2B, and to give up the Andersen name entirely by 1 January 2001.",
      "So they had four months to rename a global firm. An internal competition produced Accenture, submitted by an employee named Kim Petersen working in Oslo, from *accent on the future*. It was widely mocked as management-consultant nonsense, and the change cost somewhere between $100M and $175M to execute and promote. The firm listed on the New York Stock Exchange in July 2001, raising about $1.7B at $14.50 a share.",
      "And then Enron. In 2002 Arthur Andersen was convicted on an obstruction charge connected to the Enron audits, and the firm collapsed. The name Andersen went from an eighty-year-old mark of professional respectability to a synonym for shredded documents in a matter of months.",
      "Which makes this the luckiest defeat in the history of consulting. They had fought for years to escape a parent while keeping the brand. They lost that argument, paid a billion dollars, and were ordered to abandon the name at enormous expense. Eighteen months later the thing they had been forced to give up would have destroyed them. Forbes put it best at the time: after Enron, any name was better than Andersen.",
      "It is worth being precise about what the arbitration actually did, because that is the part with a lesson in it. The ruling did not merely rename them - it established them as a legally separate entity, which is why Arthur Andersen's criminal conviction did not reach across and take the consultancy with it. The firewall was a condition they resented and it turned out to be the thing that saved them.",
      "What followed is the ordinary arc at extraordinary scale: offshore delivery hubs in India and the Philippines, expansion into outsourcing and business process work, and growth from around $9B of revenue in 1998 to roughly $64B by 2024, with a headcount now approaching 800,000 across more than 120 countries.",
    ],
    externalUrl: "https://www.britannica.com/money/Accenture",
    externalLabel: "Accenture (Britannica)",
    sources: [
      { label: "Britannica: formal establishment as Andersen Consulting in 1989, the 2000 arbitration allowing separation while forfeiting the Andersen name, the 1 January 2001 rename and Bermuda incorporation, the July 2001 IPO, and the timing relative to the SEC sanctions and the Enron obstruction case that ended Arthur Andersen", url: "https://www.britannica.com/money/Accenture" },
      { label: "Grokipedia: the 1989 fee arrangement, Arthur Andersen establishing its own consulting unit in 1995, the unanimous December 1997 vote to dissolve, and arbitrator Guillermo Gamba's 7 August 2000 finding that there had been no technical breach while granting separation for a settlement estimated at $1B", url: "https://grokipedia.com/page/Accenture" },
      { label: "TIME: the internal competition, the Oslo employee's submission of Accenture from 'accent on the future', the reception it got, and an execution cost estimated at $100M", url: "https://content.time.com/time/specials/packages/article/0,28804,1914815_1914808_1914804,00.html" },
      { label: "Forbes (March 2002): $175M spent promoting the new name, and the observation that after Enron any tag was better than Andersen", url: "https://www.forbes.com/global/2002/0304/060.html" },
      { label: "Company history: the 1953 General Electric feasibility study leading to a UNIVAC I installation, and the naming attributed to Kim Petersen", url: "https://swottemplate.com/blogs/brief-history/accenture-brief-history", sourceNote: "This source describes Petersen as Danish; others place him in Oslo. The submission itself is consistently attributed." },
      { label: "Arbitration detail: the ICC ruling granting independence for a payment reported at $1.2B and requiring the name change by 1 January 2001, and the point that separate-entity status meant no spin-off liability when Arthur Andersen collapsed", url: "https://www.useluminix.com/reports/company-overviews/accenture-company-overview-business-segments-financials-and-global-market-position-2026/source/0", sourceNote: "Reports the settlement at $1.2B where others say ~$1B; both figures are given in the text above." },
    ],
  },
  {
    // HONEYWELL - added 2026-08-01 (PRIME), prompted by its appearance as a
    // Nozomi investor.
    //
    // The reason this belongs on a networking and systems timeline is MULTICS:
    // Honeywell inherited the project with GE's computer division in 1970, and
    // Multics is what Unix was named against. Everything else here is context
    // for that.
    slug: "honeywell",
    official: {
      url: "https://www.honeywell.com",
    },
    tags: ["vendor"],
    group: "other",
    name: "Honeywell",
    founded: 1906,
    tagline: "A thermostat company that became a mainframe company and then went back to controlling physical things.",
    intro:
      "Mark Honeywell founded the Honeywell Heating Specialty Company in Wabash, Indiana in 1906. The other half of the lineage is older still: Albert Butz had formed the Butz Thermo-Electric Regulator Company in 1886 to commercialise a device that opened and closed a furnace damper on its own, and that business became the Minneapolis Heat Regulator Company. The two merged in 1927 as Minneapolis-Honeywell, and for its first fifty years the company's business was regulating temperature.",
    body: [
      "Then it became a computer company, which most people have forgotten. It entered through a 1955 joint venture with Raytheon, bought out its partner, acquired Computer Control Corporation in 1966, and through the 1960s was one of the manufacturers collectively nicknamed Snow White and the Seven Dwarfs - IBM being Snow White. As the field thinned to five the survivors were renamed after their initials: Burroughs, UNIVAC, NCR, Control Data and Honeywell. The BUNCH.",
      "In 1970 it bought General Electric's computer division, and that is the transaction that matters here. It rebranded the GE-600 mainframes as the Honeywell 6000 series - and it inherited GE's ongoing operating system project, Multics.",
      "Multics matters here because of what it established. It was an enormously ambitious timesharing system, and it set the standard for what such a system should do about security in particular - rings of protection, access control on segments, the idea that a machine shared by mutually distrustful users needs the operating system to enforce that distrust. Its influence on Unix is not a matter of vague inheritance: the name Unix was coined in deliberate contrast to it. Every Unix-derived system in use today, including the ones this site's tools run on, is downstream of an argument about Multics.",
      "Honeywell also became a serious force in storage. Its joint venture with Bull and Control Data, Magnetic Peripherals, was the world leader in fourteen-inch disk drives through the 1970s and early 1980s.",
      "And then it left. It merged its computer operations with Bull and NEC in 1986, sold the division outright to Groupe Bull, and by 1991 was out of the computer business entirely. In 1986 it had bought Sperry Aerospace - a piece of a fellow BUNCH member - and turned back toward avionics and control systems.",
      "The 1999 transaction is worth stating precisely, because it is usually said backwards. AlliedSignal acquired Honeywell, and then took the Honeywell name for itself, because the name was worth more than its own. The acquired company's brand survived the acquirer's.",
      "What it does now closes a circle. Honeywell builds industrial automation, building control and aerospace systems - which is to say it is once again in the business of controlling physical things, having spent thirty-five years in the business of computing them. And it is an investor in Nozomi Networks, which appears on this timeline for monitoring the security of industrial control systems. A company that spent the 1970s running the operating system that taught the industry about protection domains now funds the people watching its own controllers for intrusions.",
    ],
    acquisitions: [
      { year: 1970, name: "General Electric's computer division", what: "GE's mainframe business, rebranded as the Honeywell 6000 series.", became: "Honeywell Information Systems - and custody of the Multics project, whose design shaped Unix and therefore most of what came after.", sourceNote: "GE's process control business followed separately in 1974." },
      { year: 1975, name: "Xerox Data Systems", what: "The Sigma line, which had a small but committed customer base.", became: "Absorbed into Honeywell's range; the CP-6 operating system descended from this side of the house." },
      { year: 1986, name: "Sperry Aerospace Group", price: "~$1.03B", what: "Bought from Unisys - which is to say, from the merged remains of two other BUNCH members.", became: "The foundation of Honeywell's modern avionics business." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Honeywell",
    externalLabel: "Honeywell",
    sources: [
      { label: "Britannica: the lineage back to Albert Butz's 1886 thermostat company, Mark Honeywell's 1906 founding, the 1927 merger, and the 1934 acquisition of Brown Instrument", url: "https://www.britannica.com/money/Honeywell-International-Inc" },
      { label: "Computer History Museum: entering computing via the 1955 Raytheon joint venture, buying Computer Control Corporation, acquiring GE's computer division in 1970 and with it Multics - which set the standard for timesharing systems, particularly on security - then Honeywell-Bull in 1986 and exit by 1991", url: "https://www.computerhistory.org/brochures/g-i/honeywell-information-systems-inc/" },
      { label: "Kiddle/Wikipedia summary: Snow White and the Seven Dwarfs, the BUNCH, the GE-600 rebrand as the Honeywell 6000 series running GCOS, Multics and CP-6, Multics' influence on Unix, and Magnetic Peripherals leading fourteen-inch disk drives", url: "https://kids.kiddle.co/Honeywell" },
      { label: "Wikipedia: Honeywell 6000 series - manufactured 1970 to 1989, sold to Groupe Bull in 1989", url: "https://en.wikipedia.org/wiki/Honeywell_6000_series" },
      { label: "Honeywell's own history: AlliedSignal acquiring Honeywell in 1999 and electing to retain the Honeywell name for its brand recognition, with the headquarters moving to Morristown", url: "https://www.honeywell.com/us/en/company/history" },
      { label: "HRAC Arizona timeline: the 1974 purchase of GE's process control business which became the Process Solutions division, the 1986 Sperry Aerospace acquisition at $1.029B, and the 1991 sale of Honeywell Information Systems to Bull", url: "https://hracaz.org/honeywell" },
    ],
  },
  {
    // NOTE (2026-08-01): a SECOND entry for this company was created in error
    // under the slug `nozomi` and removed the same session. Before adding any
    // company, check whether it is already present BY NAME - checking the slug
    // is not enough, because the slug is exactly the thing that can differ.

    // NOZOMI NETWORKS - added 2026-08-01 (PRIME). First OT/ICS security entry
    // on the timeline.
    //
    // SIXTH entry on the neutrality thread, and the only one where the question
    // is CURRENTLY OPEN: an industrial automation vendor now owns the company
    // that monitors industrial automation equipment, and the company says its
    // vendor-neutrality is unaffected. That is precisely the CompTIA question,
    // live.
    //
    // One source carried an aside about an Anthropic programme. It is
    // tangential to the company's history, oddly phrased, and concerns the
    // maker of the model writing this entry. DELIBERATELY OMITTED.
    slug: "nozomi-networks",
    official: {
      url: "https://www.nozominetworks.com",
    },
    tags: ["vendor"],
    group: "contemporary",
    name: "Nozomi Networks",
    founded: 2013,
    tagline: "Built on the constraint that you cannot scan an industrial network without risking the plant.",
    intro:
      "Andrea Carcano and Moreno Carullo founded Nozomi Networks in Switzerland in 2013, with European operations in Mendrisio and a later headquarters in San Francisco. Carcano had done security engineering at Eni, the Italian energy company, and research for the European Commission, and had published academic work including a description of early malware targeting SCADA systems. Carullo holds a doctorate in artificial intelligence and has served on IEC TC57 WG15, the subcommittee that writes security standards for power system communications,. Between them that is the exact pair of backgrounds the problem needed.",
    body: [
      "The constraint that defines this whole category is worth stating first, because it explains the product. In ordinary IT security you find out what is on a network by scanning it: you send traffic to a device and read what comes back. On an industrial control network you cannot do that. A programmable logic controller running a production line may be twenty years old, may have a network stack that predates the idea of hostile input, and can be knocked over by an unexpected packet. The scan that inventories your office safely can stop a plant.",
      "So OT security had to be built the other way round: passively. You watch the traffic that is already flowing, infer from it what devices exist, what they are, what they normally say to each other, and then notice when that changes. The flagship product was named SCADAguardian, and the technique is network behavioural analytics applied to a place where behaviour is unusually predictable - which is the one advantage of industrial networks. An office network is chaos; a bottling line does roughly the same thing every day, so an anomaly actually means something.",
      "The founders ran it themselves until about 2016, when they recruited Edgard Capdevielle to build a commercial organisation while they concentrated on the product. That arrangement lasted a decade, during which the company passed $100M in annual recurring revenue and, by its own account, became the first privately held OT security company to reach sustained cash-flow break-even. Its platform reportedly runs at five of the ten largest oil and gas companies, seven of the top ten pharmaceutical manufacturers and seven of the top ten utilities.",
      "Then the ownership question. Mitsubishi Electric acquired the company for about $1B, completing in 2026, and on 28 July 2026 Carcano returned as chief executive with Capdevielle moving to an advisory role. The company states that it continues to operate independently and that its vendor-neutral approach is unaffected.",
      "That claim deserves attention rather than acceptance, and this timeline is the right place to say why. Mitsubishi Electric manufactures industrial automation equipment. Nozomi's product monitors industrial automation equipment - including, necessarily, its new owner's. The strategic investors on the cap table before the acquisition were already the same shape: Honeywell, Schneider Electric and Johnson Controls, all of them vendors of the very equipment being watched.",
      "The same question runs through several companies of this kind. CompTIA's certifications are valuable because they belong to no vendor, and whether that survives private equity is unresolved. Kyndryl's advice became worth more the moment IBM stopped owning it, because a services arm of a cloud vendor cannot credibly recommend a competitor's cloud. Equinix built an entire business on being a landlord with no network of its own. Nozomi is the live case: a monitoring company owned by a manufacturer of the things it monitors, asserting that this changes nothing. It may well be right. The point is that the assertion is the thing to watch, and the answer arrives over years in whether its findings about one vendor's equipment read the same as its findings about another's.",
    ],
    externalUrl: "https://www.nozominetworks.com/company/leadership",
    externalLabel: "Nozomi Networks: leadership",
    sources: [
      { label: "Nozomi Networks leadership page: Carcano's academic work including a description of early SCADA-targeting malware, and Carullo's doctorate in artificial intelligence", url: "https://www.nozominetworks.com/company/leadership" },
      { label: "PR Newswire, 28 July 2026: Carcano resuming the chief executive role, Capdevielle's decade as CEO and move to executive advisor, passing $100M in annual recurring revenue, and the ~$1B Mitsubishi Electric acquisition", url: "https://www.prnewswire.com/news-releases/nozomi-networks-appoints-co-founder-andrea-carcano-as-ceo-to-accelerate-ai-driven-innovation-in-its-next-phase-of-growth-302836025.html" },
      { label: "citybiz: the customer figures across oil and gas, pharmaceuticals and utilities, and the company's statement that the acquisition allows it to continue operating independently and maintain its vendor-neutral approach", url: "https://www.citybiz.co/article/880246/nozomi-networks-names-co-founder-andrea-carcano-ceo-following-mitsubishi-electric-acquisition/" },
      { label: "SDxCentral: Carcano's prior security engineering at Eni and research for the European Commission, the 2013-2016 CEO period, and the wider OT consolidation including ServiceNow's purchase of Armis", url: "https://www.sdxcentral.com/news/nozomi-networks-crowns-co-founder-andrea-carcano-as-ceo/", sourceNote: "Used for the founder background and market context. An aside in the same article about an unrelated programme is not used." },
      { label: "StarLink vendor profile: SCADAguardian applying network behavioural analytics to ICS environments for real-time visibility into process network communications", url: "https://www.starlinkme.net/vendors/nozomi-networks/56", sourceNote: "Distributor marketing page. Used only for the product description, which matches the company's own." },
      { label: "Ownership analysis: the strategic investor group of Honeywell Ventures, Mitsubishi Electric, Schneider Electric and Johnson Controls acting as customer-owners alongside GGV and Lux Capital", url: "https://businessmodelcanvastemplate.com/blogs/owners/nozomi-networks-who-owns" },
    ],
  },
  {
    // COMPUGRAF / CG ONE - added 2026-08-01 (PRIME). First of the Brazilian
    // integrators.
    //
    // *** SOURCING IS THINNER THAN FOR THE INTERNATIONAL ENTRIES AND THIS
    // ENTRY IS DELIBERATELY SHORTER BECAUSE OF IT. *** The founding date comes
    // from the company registry, which is authoritative for that and for very
    // little else. The narrative of the pivot is the company's own account as
    // repeated by business directories, and is labelled as such. Employee and
    // client figures are the company's own. NO REVENUE FIGURE IS GIVEN: the
    // only one available came from a contact-data aggregator, which is not a
    // source this site should treat as reliable.
    //
    // An entry should be as long as its evidence, not as long as its
    // neighbours.
    slug: "compugraf",
    tags: ["reseller"],
    group: "other",
    name: "Compugraf (now CG One)",
    founded: 1982,
    tagline: "A computer graphics company that became a security company, and kept the name for forty years.",
    intro:
      "The name is the story. Compugraf was registered in São Paulo in April 1982, and it did what it said: computação gráfica, computer graphics. Somewhere in the 1990s it moved into information security, and then stayed there for three decades under a name that had stopped describing it.",
    body: [
      "That is a more common pattern in this industry than the tidy histories suggest, and this timeline has several instances of it. Companies rarely rename themselves when their business changes, because the name is the thing customers already trust - so the trading name becomes a fossil of what the company used to do. Anyone meeting Compugraf as a security integrator in 2010 had no particular reason to know it had once sold graphics systems.",
      "The security business settled into the shape most Brazilian integrators of its generation took: network and information security for large domestic customers across industry, financial services and energy, sold and supported locally rather than through a multinational's channel. The company describes itself as one hundred per cent Brazilian, with over 150 staff and more than five hundred client companies served across two decades.",
      "In 2024 it finally renamed, to CG One - which keeps the initials of the graphics business while abandoning the word. Forty-two years is a long time to carry a name you have outgrown, and shortening it to two letters is the usual compromise between continuity and accuracy.",
      ],
    externalUrl: "https://www.cgone.com.br/",
    externalLabel: "CG One",
    sources: [
      { label: "Econodata company register: Compugraf Serviços Ltda, CNPJ 49.916.513/0001-36, registered 06/04/1982, Avenida Angélica, São Paulo; the description of a 1982 founding in computer graphics, the 1990s move into cybersecurity, and the 2024 change to CG One", url: "https://www.econodata.com.br/consulta-empresa/49916513000136-compugraf-servicos-ltda" },
      { label: "Serasa Experian register: Compugraf Segurança da Informação Ltda, CNPJ 41.896.287/0001-67, active, São Paulo - one of several entities under the group", url: "https://empresas.serasaexperian.com.br/consulta-gratis/COMPUGRAF-SEGURANCA-DA-INFORMACAO-LTDA-41896287000167" },
      { label: "Company self-description: four decades in the market, one hundred per cent Brazilian, focused on information security, data privacy and governance, with more than 150 staff and over 500 client companies in twenty years", url: "https://rocketreach.co/compugraf-profile_b4b9ff3afb07e0a5", sourceNote: "Aggregator page carrying the company's own copy. Used only for the company's self-description; the revenue figure on the same page is not used." },
    ],
  },
  {
    // THE BRAZILIAN MARKET RESERVE - added 2026-08-02 (PRIME).
    //
    // *** PRIME'S BRIEF: "always from the perspective tied to our theme." ***
    // So this is NOT a history of Brazilian computing. It is about what the
    // period did to the SUPPLY OF ENGINEERS, and where those people went - both
    // of which are documented and both of which are still visible.
    //
    // *** POLITICALLY LOADED. Handled by putting the strongest evidence on BOTH
    // sides in the entry and declining to score it. *** The pro case has real
    // numbers (employment, growth, market share). So does the case against
    // (clones, a copied operating system, US trade retaliation, every
    // semiconductor plant leaving). Both are here.
    slug: "brazilian-market-reserve",
    group: "other",
    name: "The Brazilian market reserve (Cobra, Scopus, Itautec)",
    founded: 1974,
    tags: ["vendor", "standards", "training"],
    ended: {
      year: 1992,
      note: "The Informatics Law had a fixed eight-year term written into it from the start and expired in 1992. The companies survived by changing what they made.",
    },
    tagline: "A policy that failed at its stated goal and succeeded at one nobody wrote down.",
    intro:
      "Cobra - Computadores e Sistemas Brasileiros - was founded in 1974 and was the first Brazilian company to design, build and sell computers, reaching commercial production in 1976. Ten years later, Law 7.232 of 29 October 1984 made that a national policy: the domestic market for computing equipment was reserved for Brazilian-owned companies, with a term of eight years written into the law from the outset. It passed Congress unanimously.",
    body: [
      "The reasoning was explicit and it was not stupid. Brazil had a balance-of-payments crisis and an import-substitution strategy. The argument was that protected for a decade, domestic firms would build genuine capability and could then compete openly - and Japan and the United States were both cited as precedents for protectionism that had worked. Academics, industry, the press, the government and the opposition all supported it.",
      "The case against it is substantial and should be stated first, because it is the one usually left out of nostalgic accounts. Freed of foreign competition, several manufacturers did not pioneer; they cloned. Machines closely modelled on Apple, Tandy, Atari and Commodore products appeared under Brazilian names. Scopus copied Microsoft's MS-DOS and shipped it as SISNE, drawing a piracy threat from Microsoft. In 1985 the United States formally accused Brazil of unfair trade practices and applied retaliation. And between 1989 and 1992 every semiconductor plant in the country closed or left. Smuggling was widespread enough that a police operation seizing contraband machines produced public anger rather than approval.",
      "And the case for it also has numbers, which is why the argument has never been settled. Between 1984 and 1987 the Brazilian microcomputer market grew at about 7.4 per cent a year, the highest rate in the capitalist world at the time. Domestic firms went from 23 per cent of the market in 1979 to 40 per cent by 1982. Installed computers went from 1,200 units in 1974 to 23,200 by 1982.",
      "The figure that matters most for this site is a different one. Employment in informatics and automation went from about 42,000 people in 1984 to about 74,000 by 1989. Whatever those companies were building, they were hiring, training and pulling technology through the economy - and a generation of Brazilian engineers learned the trade inside them.",
      "That is the part that outlasted the policy. The law expired in 1992 as scheduled and most of the manufacturers did not survive contact with open competition. But the people did, and they went into the distributors, integrators, carriers and banks that appear elsewhere on this timeline. A protectionist industrial policy failed at building a computer industry and succeeded at building a workforce, which was not its stated aim.",
      "Where the companies went is the second finding, and it is not a coincidence. Cobra was acquired by Banco do Brasil. Scopus was bought by Bradesco, and later passed to IBM Brasil. Itautec became a division of Itaú. Microsiga renamed itself Totvs and went into enterprise software. Three of the largest surviving names were absorbed by banks and turned to banking automation - which is a substantial part of why Brazilian banking technology became unusually advanced. A protected computer industry, unable to compete on hardware, was reabsorbed by its largest customers and became very good at exactly one thing.",
      "Read against the rest of this timeline, the pattern is familiar and uncomfortable. Every argument about domestic technology capability - who builds it, who is allowed to buy it, what happens to the people trained under it - is a re-run of this one, with different vocabulary. The honest summary is that the policy achieved something real and did not achieve the thing it was for, and that both halves are usually reported separately by people who prefer one of them.",
    ],
    externalUrl: "https://pt.wikipedia.org/wiki/Pol%C3%ADtica_Nacional_de_Inform%C3%A1tica",
    externalLabel: "Política Nacional de Informática",
    sources: [
      { label: "Wikipédia (pt): Law 7.232 approved 29 October 1984 with an eight-year term written in; the idea forming in the early 1970s under the military government", url: "https://pt.wikipedia.org/wiki/Pol%C3%ADtica_Nacional_de_Inform%C3%A1tica" },
      { label: "IT Forum, citing Schmitz and Hewitt's 1992 assessment: microcomputer market growth averaging 7.4% a year between 1984 and 1987, the highest in the capitalist world; informatics and automation employment rising from 42,000 in 1984 to 74,000 by 1989; Cobra founded 1974 as the first Brazilian company to develop, manufacture and sell computers", url: "https://itforum.com.br/noticias/6-empresas-historia-informatica-brasil/" },
      { label: "ISTOÉ Dinheiro: commercial-scale production beginning with Cobra in 1976; more than 50 companies with microcomputer projects; domestic market share rising from 23% in 1979 to 40% in 1982; installed base from 1,200 units in 1974 to 23,200 in 1982", url: "https://istoedinheiro.com.br/os-efeitos-colaterais-da-lei-de-informatica" },
      { label: "DIO (Fernando Araujo): the cloning of foreign designs rather than original development; the acquisition outcomes - Cobra to Banco do Brasil, Scopus to Bradesco and later IBM Brasil, Itautec as an Itaú division focused on banking infrastructure, Microsiga becoming Totvs; every semiconductor plant leaving between 1989 and 1992", url: "https://www.dio.me/articles/direto-ao-ponto-16-a-reserva-de-mercado-da-informatica-no-brasil-1984-1992" },
      { label: "Revista de Administração de Empresas (SciELO, 1988): the contemporary debate, including Scopus shipping a copy of MS-DOS as SISNE and Microsoft's piracy threat, and public anger at operations seizing smuggled machines", url: "https://www.scielo.br/scielo.php?script=sci_arttext&pid=S0034-75901988000300012", sourceNote: "A contemporary survey of the argument as it was being had, which is why it is cited for the criticisms rather than for outcomes - it was published four years before the policy ended." },
      { label: "Metrópoles (Luiz Paulo Vellozo Lucas): the unanimous congressional approval and the breadth of support across academia, business, press, government and opposition; the balance-of-payments and import-substitution context", url: "https://www.metropoles.com/blog-do-noblat/artigos/a-lei-de-informatica-por-luiz-paulo-vellozo-lucas", sourceNote: "An opinion column by a former mayor and federal deputy. Used for the political context and the fact of unanimity, not for its evaluation of the policy." },
      { label: "Blog Cidadania & Cultura: Itautec as the last survivor in computers, with Scopus and Cobra Tecnologia having moved to banking automation; the policy ending in 1992", url: "https://fernandonogueiracosta.wordpress.com/2013/05/29/fim-da-era-da-reserva-de-mercado/" },
    ],
  },
  {
    // CPqD - added 2026-08-02 (PRIME: "CPqD and Brasil Telecom are worth adding
    // into the story").
    //
    // He is right, and CPqD is the more interesting of the two: it is the ONLY
    // institution in the Telebrás story that outlived the system, and it is on
    // this timeline as a research organisation rather than a company - which is
    // why it carries `standards` alongside `services`.
    slug: "cpqd",
    official: {
      url: "https://www.cpqd.com.br",
    },
    group: "other",
    name: "CPqD",
    founded: 1976,
    tags: ["standards", "services", "training"],
    tagline: "The state research centre that survived the privatisation of the state.",
    intro:
      "Telebrás created the Centro de Pesquisa e Desenvolvimento em Telecomunicações in 1976, in Campinas, with a brief that was explicitly industrial rather than academic: develop domestic telecommunications technology so that Brazil bought less of it from abroad. When the Telebrás system was broken up and sold in 1998, CPqD did not go with it. It became an independent foundation and is still operating.",
    body: [
      "The brief is what makes it unusual. A great many countries have run state telecommunications monopolies. Rather fewer built a research institute inside one and told it to produce technology rather than papers. CPqD worked on switching systems, transmission, network management and digital telephony, at a time when every one of those was imported, and it did so on behalf of an operator that could guarantee it a customer - which is a structural advantage no independent laboratory has.",
      "Then the customer was dismantled. The 1998 privatisation split the Telebrás system into twelve holdings sold to different owners, and an in-house research centre serving a monopoly has no obvious place in that arrangement. CPqD was converted into an independent private foundation, and had to find work from operators that were now competitors of one another, and from government.",
      "That transition is the part worth studying. An institution built to serve one guaranteed customer had to learn to sell, and most such institutions do not survive the lesson. This one has been going for close to five decades in total and around three of them without the parent that created it.",
      "It remains a research and development organisation rather than a vendor: telecommunications, energy, digital government, and the certification and testing work that a country needs somebody neutral to do. Neutrality is what makes it useful. CPqD is useful to competing operators for the same reason a carrier-neutral exchange is useful to competing carriers, and for the same reason a vendor-neutral certification is worth more than a vendor's own - because it belongs to none of them.",
      "It also trains, which is why it carries that tag here: a research institute in a country that imports most of its technology is one of the few places domestic expertise is deliberately manufactured rather than hired.",
    ],
    externalUrl: "https://www.cpqd.com.br/",
    externalLabel: "CPqD",
    sources: [
      { label: "Telebrás 50th anniversary account: CPqD created in 1976 for research and development of products, networks, switching systems and digital systems with a focus on developing national technology, and continuing independently since 1998", url: "https://www.telebras.com.br/50anos/" },
      { label: "Wikipédia (pt) on the Telebrás system: CPqD listed among the system's components from 1976 to 1998, operating since then as an independent organisation", url: "https://pt.wikipedia.org/wiki/Telecomunica%C3%A7%C3%B5es_Brasileiras_S.A." },
      { label: "CPqD (own site): current activity across telecommunications, energy and digital government, including testing and certification work", url: "https://www.cpqd.com.br/" },
    ],
  },
  {
    // BRASIL TELECOM - added 2026-08-02 (PRIME). One of the three fixed-line
    // holdings created by the 1998 split, and the one whose subsequent path
    // shows what the split actually produced: reconsolidation.
    slug: "brasil-telecom",
    group: "other",
    name: "Brasil Telecom",
    founded: 1998,
    tags: ["carrier"],
    ended: {
      year: 2009,
      note: "Acquired by Oi (then Telemar), reuniting two of the three fixed-line holdings the 1998 privatisation had separated.",
    },
    tagline: "One of the twelve pieces, which spent a decade becoming part of a larger piece again.",
    intro:
      "Brasil Telecom was one of the three fixed-line holding companies created when the Telebrás system was auctioned on 29 July 1998, covering the south, centre-west and part of the north of the country. It lasted about eleven years as an independent company.",
    body: [
      "Its history is the argument about the privatisation, in miniature. The system was split in order to create competition, on the reasoning that several operators would serve customers better than one. What happened over the following decade is that the pieces began buying each other: Brasil Telecom was acquired by Oi, the group built on Telemar, another of the three fixed-line holdings, in a deal completed in 2009.",
      "So two of the three parts the state had deliberately separated were back together inside eleven years, and the third - the São Paulo operator, Telesp - had become the Brazilian business of a Spanish multinational. Nine hundred companies had become one, then twelve, and were now heading back toward a handful.",
      "Whether that is a failure of the design or simply what telecommunications does is a fair question, and it remains open. Networks have strong economies of scale and interconnection costs that reward consolidation; regulators know this and try to hold the line against it. The pattern is not particular to Brazil, and any argument that it proves something about privatisation has to explain why the same consolidation happened in countries that privatised differently, and in some that did not privatise at all.",
      "The company's later years were also marked by a long and public shareholder dispute, and the group that emerged from the merger has had a difficult financial history of its own. Its current position is best checked against recent filings.",
    ],
    externalUrl: "https://pt.wikipedia.org/wiki/Brasil_Telecom",
    externalLabel: "Brasil Telecom",
    sources: [
      { label: "Correio Braziliense: the 29 July 1998 auction creating three fixed-line holdings, one long-distance carrier and eight mobile holdings from the Telebrás system", url: "https://www.correiobraziliense.com.br/app/noticia/economia/2008/07/29/internas_economia,22069/saiba-como-foi-a-privatizacao-da-telebras.shtml" },
      { label: "Museu Capixaba do Computador: the twelve regional companies produced by the split, giving rise to Telemar, Brasil Telecom and Telefônica among others", url: "https://museucapixaba.com.br/hoje/fundacao-da-empresa-telebras-de-1972/" },
      { label: "Wikipédia (pt) on the Telebrás privatisation: the successor companies and their consolidation into Oi and Vivo", url: "https://pt.wikipedia.org/wiki/Privatiza%C3%A7%C3%A3o_da_Telebr%C3%A1s", sourceNote: "Used for the consolidation chronology. Corporate and financial developments after the merger are not detailed here; check current sources." },
    ],
  },
  {
    // TELEBRÁS SYSTEM - added 2026-08-02 (PRIME). Telebrás, Telesp and Embratel
    // written as ONE entry, because they are one system: a holding company, its
    // state operators and its long-distance carrier.
    //
    // *** POLITICALLY CONTESTED TERRITORY, HANDLED CAREFULLY. *** The 1998
    // privatisation is still argued about in Brazil and one of the sources
    // consulted calls it a crime in its headline. The entry states the figures
    // and the outcomes, notes that the judgement remains contested, and takes
    // no side. Numbers, dates and ownership chains are verifiable; whether it
    // was a good idea is not this site's call.
    slug: "telebras-system",
    group: "other",
    name: "The Telebrás System (Telebrás, Telesp, Embratel)",
    founded: 1972,
    tags: ["carrier", "standards"],
    ended: {
      year: 1998,
      note: "The system was privatised on 29 July 1998 and split into twelve regional holdings. Telebrás itself was reactivated in 2010 with a different mandate.",
    },
    tagline: "Nine hundred telephone companies became one, then twelve, then a handful owned elsewhere.",
    intro:
      "Before 1972 there were more than nine hundred telecommunications companies operating in Brazil. Law 5.792 of 11 July 1972 authorised a single state holding company, and Telecomunicações Brasileiras S.A. was installed on 9 November that year, during the military government. Within a few years it had absorbed nearly all of them: twenty-seven state operators plus Embratel, the long-distance carrier, together known as the Sistema Telebrás.",
    body: [
      "The problem it was built to solve was real. Nine hundred operators meant nine hundred technical standards, numbering plans and interconnection arrangements, in a country of continental scale where a call between two states might cross several incompatible networks. Centralising it produced a national network with satellites, submarine cables and a dense terrestrial mesh, and telephony reached essentially the whole territory.",
      "One figure captures both the achievement and the argument. Installing a telephone line cost about five thousand US dollars in the 1970s. By 1998 it cost about twenty. The heavy infrastructure had been built, and the technology had changed underneath it - which is precisely why private capital, uninterested for decades, became interested.",
      "In 1976 Telebrás created CPqD, its research and development centre, which worked on switching systems, networks and digital telephony with an explicit brief to develop domestic technology. It is one of the few institutions here that outlived the system that created it: CPqD has operated independently since 1998 and still exists.",
      "The system was privatised on 29 July 1998, at the Rio de Janeiro stock exchange, following the 1995 constitutional amendment and the General Telecommunications Law. Twenty per cent of the shares - the controlling blocks - were sold, splitting the system into twelve holdings: three fixed-line, one long-distance, and eight mobile. It raised R$22.058B, a premium of 63.7% over the minimum price, and remains the largest privatisation in the country's history. In its final year the system had reported around R$2B of net profit.",
      "What happened to Embratel afterwards is the part worth following. The long-distance carrier was bought by MCI WorldCom of the United States. WorldCom filed for bankruptcy in 2002 in what was then the largest corporate failure in American history. In 2004 a New York court approved Embratel's sale to Telmex of Mexico, and in 2015 it was absorbed into Claro, part of América Móvil. A Brazilian state carrier passed to an American company, through a bankruptcy court, to a Mexican group, in seventeen years.",
      "The fixed-line holdings became Telemar, Brasil Telecom and Telefônica - Telesp, the São Paulo operator, being the piece that became Telefônica's Brazilian business - and the successors eventually consolidated into Oi and Vivo. Nine hundred companies became one, then twelve, then a handful, most of them controlled from outside the country. Whether that arc is a success or a loss is still argued about in Brazil, and it is not settled here: the figures above are verifiable, and the judgement is not a technical question.",
      "Telebrás itself was reactivated in 2010, as a mixed-economy company with a narrower brief - connectivity for federal public administration and the national broadband plan, including schools and health and security facilities. The name survived the system it named.",
    ],
    externalUrl: "https://pt.wikipedia.org/wiki/Telecomunica%C3%A7%C3%B5es_Brasileiras_S.A.",
    externalLabel: "Telecomunicações Brasileiras S.A.",
    sources: [
      { label: "Wikipédia (pt): creation under Law 5.792 of 11 July 1972, installed 9 November 1972; the monopoly from 1972 to 1998; the twelve regional holdings; Embratel's route from MCI WorldCom through the 2002 bankruptcy and the 2004 New York court approval to Telmex, and absorption into Claro in 2015; reactivation in 2010", url: "https://pt.wikipedia.org/wiki/Telecomunica%C3%A7%C3%B5es_Brasileiras_S.A." },
      { label: "Telebrás 50th anniversary (own account): installation on 9 November 1972; twenty-seven state operators plus Embratel forming the Sistema Telebrás; CPqD created in 1976 and independent since 1998; the 2010 reactivation for the national broadband plan", url: "https://www.telebras.com.br/50anos/" },
      { label: "Correio Braziliense: the auction of 29 July 1998 at the Rio de Janeiro exchange; twenty per cent of shares carrying control; three fixed-line holdings, one long-distance and eight mobile; R$22.058B raised at a 63.7% premium; the largest privatisation in the country's history", url: "https://www.correiobraziliense.com.br/app/noticia/economia/2008/07/29/internas_economia,22069/saiba-como-foi-a-privatizacao-da-telebras.shtml" },
      { label: "Zambon: more than 900 telecommunications companies operating before the 1972 consolidation; near-total monopoly achieved within three years", url: "https://zambonpericia.com.br/o-que-aconteceu-com-a-telebras/" },
      { label: "Diário Causa Operária: the founding companies (Embratel, CTB, CTMG, CTES, Cotelb); the fall in the cost of installing a line from about US$5,000 in the 1970s to about US$20 by 1998; net profit of around R$2B in 1998", url: "https://causaoperaria.org.br/2019/29-de-julho-de-1998-o-crime-da-privatizacao-da-telebras/", sourceNote: "An openly partisan source - its headline calls the privatisation a crime. Used ONLY for the factual details listed, each of which is consistent with the other sources here. Its judgement of the privatisation is not adopted; the entry deliberately takes no side." },
      { label: "Museu Capixaba do Computador: the subdivision into twelve regional companies at privatisation, and the successor companies Telemar, Brasil Telecom and Telefônica", url: "https://museucapixaba.com.br/hoje/fundacao-da-empresa-telebras-de-1972/" },
    ],
  },
  {
    // PROMON + LOGICALIS - added 2026-08-02 (PRIME).
    //
    // *** THIS CLOSES A LOOP THE SITE ALREADY OPENED. *** The Westcon-Comstor
    // entry names Logicalis as its sibling division under Datatec. This is that
    // sibling, and the Brazilian half of it turns out to have an ownership
    // model that is the opposite of everything else on this timeline.
    //
    // LAVA JATO IS RECORDED. Promon Engenharia was investigated from 2014 and
    // barred by Petrobras from new contracts. Omitting it would be dishonest;
    // it is stated factually, with its status, and without editorialising.
    slug: "promon-logicalis",
    official: {
      url: "https://www.la.logicalis.com",
    },
    group: "other",
    name: "Promon and Logicalis",
    founded: 1960,
    tags: ["services", "reseller"],
    tagline: "An engineering firm owned entirely by the people who work there, in a joint venture with a South African holding company's British subsidiary.",
    intro:
      "Promon was founded in São Paulo in December 1960 as a joint venture between the American company Procon and the Brazilian Montreal Montagem e Representação Industrial, formed to deliver four new units at Petrobras' Presidente Bernardes refinery in Cubatão - a project of a kind not previously done in Brazil. Both original partners eventually left. What remained became something unusual.",
    body: [
      "Promon's only shareholders are the professionals who work there, or who used to. Not a founding family, not a fund, not a listed float - the people doing the work own the firm, and they join the shareholding voluntarily. That model has survived since the 1970s, when Procon wound up its Brazilian operations and the company separated from Montreal, and it is reinforced by a pension foundation established in 1975 exclusively for people who work or have worked in the group.",
      "The cultural document that goes with it is called the Campos do Jordão Charter, written in the same period and still described by the company as a defining symbol. A firm that is owned by its staff has to write down what it is for, because there is no proprietor to decide.",
      "The engineering record is substantial: refinery work for Petrobras from 1961, a fertiliser plant at Cubatão in 1962, then expansion through the 1970s into electrical energy, mining and metals, and infrastructure including the São Paulo Metro. Clients over the decades include Vale, CESP, Light, Ford, General Motors, Volkswagen, Renault and Suzano.",
      "In 2008 the group's technology arm merged with Logicalis' Latin American operations, creating what was then described as the largest independent ICT integrator in Latin America. Logicalis had been founded in the United Kingdom in 1997 and internationalised under Datatec; the joint venture trades as Logicalis across the region, with roughly 3,000 staff in eleven or twelve Latin American countries.",
      "And that is where a thread on this timeline closes. Datatec ran three divisions: technology distribution as Westcon-Comstor, integration and managed services as Logicalis, and consulting as Analysys Mason. So the distributor and the integrator were siblings under one holding company - and the integrator's Latin American arm is half-owned by a Brazilian firm whose shareholders are its own employees. Two opposite theories of who should own a company, operating as one business.",
      "Promon Engenharia was drawn into Operação Lava Jato from 2014, and Petrobras barred it from new contracts; a federal police inquiry followed in January 2015. The engineering business and the technology joint venture are separate companies under the same holding, and the investigation belongs in any account of the group's history. The current legal status is best checked against recent court records.",
      "The holding today describes itself as an investment company with two businesses: Promon Engenharia, wholly owned, and Logicalis Latin America, the joint venture. Sixty-five years, two original partners both gone, one ownership idea that outlasted them.",
    ],
    externalUrl: "https://www.promon.com.br/",
    externalLabel: "Promon",
    sources: [
      { label: "Promon Engenharia (own account, English): founded December 1960 as an alliance between Procon of North America and Montreal Montagem e Representação Industrial, having won an international tender for four units at the Presidente Bernardes refinery; Procon later winding up its Brazilian business; the 1970s expansion into infrastructure including the São Paulo Metro; the Campos do Jordão Charter", url: "https://promonengenharia.com.br/en/who-we-are/" },
      { label: "Holding Promon S.A.: the shareholder model in which the only shareholders are professionals linked to the organisation; the Fundação Promon de Previdência created in 1975; PromonLogicalis Latin America as a joint venture with Logicalis Group Limited trading as Logicalis across Latin America", url: "https://www.promon.com.br/" },
      { label: "Promon annual report 2022s: the holding's two businesses - Promon Engenharia wholly owned, and Logicalis Latin America from the 2008 joint venture with Logicalis Group Limited; shareholders being current and former employees of the group companies", url: "https://www.promon.com.br/relatorioanual/2022s/" },
      { label: "Wikipédia (pt) Logicalis: founded 1997 in the United Kingdom, internationalised to 2002 under Datatec; Logicalis Latin America formed in 2008 from the merger of Promon Tecnologia with Logicalis' Latin American operations; around 3,000 staff across eleven countries; group revenue of about US$1.5B", url: "https://pt.wikipedia.org/wiki/Logicalis" },
      { label: "Wikipédia (pt) Promon Engenharia: founding in 1960; the 1961 Presidente Bernardes contract, the 1962 Cubatão fertiliser plant and the 1963 Betim contract; 2010 revenue of US$536M on 36% growth; the 2014 Lava Jato investigation and the Petrobras contracting ban; the January 2015 federal police inquiry", url: "https://pt.wikipedia.org/wiki/Promon_Engenharia", sourceNote: "Used for the contract chronology, the revenue figure and the fact and dating of the investigation. Legal outcomes are not stated here; readers should check current status." },
      { label: "BNamericas: PromonLogicalis formed in 2008 as a joint venture between the UK-based Logicalis group and Brazil's Promon, based in São Paulo", url: "https://www.bnamericas.com/en/company-profile/promonlogicalis" },
    ],
  },
  {
    // DATADOG - added 2026-08-03 (PRIME). Completes an observability trio with
    // Dynatrace and Kentik, and the entry's job is to say what makes the three
    // different rather than describing a third monitoring product.
    //
    // *** THE PRICING OBSERVATION IS STRUCTURAL, NOT AN ACCUSATION. *** It
    // follows from the usage-based model itself, which is sourced. No specific
    // billing controversy is asserted, because none was verified here.
    slug: "datadog",
    official: {
      url: "https://www.datadoghq.com",
      resources: [
        { label: "Datadog Docs", url: "https://docs.datadoghq.com" },
      ],
    },
    group: "contemporary",
    name: "Datadog",
    founded: 2010,
    tags: ["vendor"],
    tagline: "The founding problem was two teams looking at different data during the same outage.",
    intro:
      "Olivier Pomel and Alexis Lê-Quôc met as students at École Centrale Paris and later spent nine years working together at Wireless Generation, an educational software company. When News Corp acquired it in 2010 they left and founded Datadog in New York. By 2025 it was turning $3.43B with around 8,100 staff.",
    body: [
      "The problem they set out to solve was organisational rather than technical, and that is the whole entry. At Wireless Generation they watched developers and operations staff work from different, incompatible data during incidents - each convinced the fault lay with the other, each holding evidence the other could not see. The finger-pointing was not a failure of goodwill. It was the predictable result of two teams looking at different instruments and describing the same event in incompatible terms.",
      "So the product's founding insight is not a monitoring feature. It is that an argument about what is happening cannot be settled while the parties hold different data, and that a shared view ends the argument not by resolving it but by removing the ambiguity that fed it. Everything about the platform follows from that: one pane covering infrastructure, applications, logs, network and user experience, because the moment any of those lives in a separate tool with a separate login, the old argument becomes available again.",
      "Read against the two other observability companies on this timeline, the three approached the same destination from three different directions, and the difference in starting point still shows in what each is best at. Dynatrace came from inside the application, tracing a transaction through code. Kentik came from the network, reading flow records and routing. Datadog came from the infrastructure, monitoring hosts and then everything attached to them. Three origins, one convergence - and the reason they converged is that an outage does not respect the boundary between an application, a host and a network, so any tool that does will eventually be asked to stop.",
      "One founder detail is worth keeping. Pomel is an original author of the VLC media player - the open-source thing on almost every computer of a certain era, which played the file nothing else would. There is a straight line from writing software that copes with malformed input from the whole world to building a platform that ingests telemetry from every system a company runs, and it is not a coincidence that both jobs are mostly about handling what you were not expecting.",
      "The commercial model is usage-based across more than twenty products, sold by landing in one team and expanding across others. That model has a structural tension worth naming, because it applies to every observability vendor and not only this one: when the bill scales with how much you instrument, the customer's incentive is to observe less. Nobody designs that deliberately, and it is the honest cost of metered infrastructure - you are asking a customer to pay in proportion to how carefully they watch, at exactly the moments when watching carefully matters most.",
      "It launched infrastructure monitoring in 2012, which put it in position as containers arrived and made the number of things worth monitoring jump by an order of magnitude overnight, and listed on NASDAQ in September 2019. It was also built in New York rather than California, which its own commentators note - and which is a smaller point than it sounds, except that the customers who needed it first were banks and media companies rather than startups.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Datadog",
    externalLabel: "Datadog",
    sources: [
      { label: "Wikipedia: founded in New York City in 2010 by Olivier Pomel and Alexis Lê-Quôc, who met as undergraduates at École Centrale Paris and later worked together for nine years at Wireless Generation; the company formed after News Corp's acquisition, to reduce the friction between developer and systems administration teams working at cross-purposes; 2025 revenue of $3.43B and around 8,100 employees", url: "https://en.wikipedia.org/wiki/Datadog" },
      { label: "Datadog's S-1 shareholder letter (2019), summarised: Pomel previously VP of Technology at Wireless Generation and before that a software engineer at Silicongo, Neomeo and IBM Research, and an original author of the VLC media player; Lê-Quôc previously Director of Live Operations at Wireless Generation and an engineer at IBM Research, France Télécom, Neomeo and Orange", url: "https://aletteraday.substack.com/p/letter-252-olivier-pomel-and-alexis" },
      { label: "Market analysis: the founding motivated by the silo between systems administrators and developers looking at different data sets and finger-pointing during outages; infrastructure monitoring launched 2012, positioning the company for containerisation; NASDAQ listing September 2019; usage-based pricing across more than twenty integrated products with a land-and-expand model", url: "https://markets.financialcontent.com/observerreporter/article/finterra-2026-1-27-datadog-ddog-and-the-2026-observability-frontier-navigating-the-ai-re-architecting-phase", sourceNote: "Financial-market commentary rather than a reference work. Used for the product chronology and the pricing model, both corroborated elsewhere. The observation this entry draws about metered observability pricing is ANVIL's own reasoning from that model, not a reported controversy, and no specific billing dispute is asserted." },
      { label: "SaaStr interview with Pomel: the founders not initially understanding how large cloud adoption would become, and recognising that bringing development and operations together was not a feature of the new environment but one of the reasons organisations were moving to it", url: "https://www.saastr.com/how-to-build-and-sell-a-product-that-customers-love-video-transcript/" },
    ],
  },
  {
    // OLITEL - added 2026-08-03 (PRIME).
    //
    // *** DATE RULING: PRIME said "go by the site." *** The company's own
    // figure (43-44 years as of 2024-25) puts founding around 1981-82; its
    // LinkedIn says 36 years, implying 1989-90. The site is followed, the
    // conflict is stated in the entry, and 1981 is written as approximate.
    //
    // The angle: a founding date around 1981 means this company predates the
    // market reserve law, the Telebrás privatisation and IP telephony. It has
    // lived through the entire arc this timeline documents.
    slug: "olitel",
    group: "other",
    name: "Olitel",
    founded: 1981,
    tags: ["reseller", "services"],
    tagline: "Has been making other people's telephones work for forty years, through four incompatible technologies.",
    intro:
      "Grupo Olitel - Olitel Brasil S/A and Olibras Telecomunicações - is a São Paulo integrator of communications technology, wholly Brazilian-owned, around seventy staff. The company puts its own age at 43 to 44 years as of 2024-25, which places its founding around 1981; its LinkedIn profile says 36 years, which would put it at 1989-90. This entry follows the company's own figure and records the discrepancy rather than hiding it.",
    body: [
      "If the earlier date is right, the span is the story. A company founded around 1981 in Brazilian communications began work before the informatics market reserve became law in 1984, well before the Telebrás system was privatised in 1998, and roughly fifteen years before anybody sold voice over IP to an enterprise. Every one of those upheavals has its own entry on this timeline. This company worked through all of them.",
      "And the through-line is a single unglamorous function performed four incompatible ways. Making an organisation's telephones work meant, in sequence: private branch exchanges with proprietary handsets and physical extension wiring; digital PABX with computer-telephony integration bolted on; IP telephony, where the phone became an endpoint on the data network and the telephony team lost their private empire to the networking team; and now unified communications delivered as a service, where the platform is somebody else's and the integrator's job is connecting to it. The customer's requirement never changed. The skill required to satisfy it changed completely, four times.",
      "That is the actual career risk in this industry and it is worth stating plainly. Nobody in 1981 was made redundant by the arrival of IP telephony. They were made redundant by not learning it - and the interval between a technology becoming visible and becoming mandatory has generally been about a decade, which is long enough to ignore comfortably and short enough to be caught by. A company that survives four of those transitions has re-skilled its people four times, which is a harder achievement than any product it sells.",
      "The present portfolio reflects the fourth transition: unified communications and contact centre delivered as a service, desk and SIP phones, headsets, videoconferencing, call recording, workforce management, billing and tariffing, structured cabling, and integration with generative-AI customer service platforms. Partners include Twilio and Yealink.",
      "One detail is a trust mechanism of a familiar kind. The company holds a TRACE certification - a third-party anti-bribery due-diligence credential. For a business selling communications infrastructure to large Brazilian enterprises, that is a deliberate signal, and it works exactly like the neutral certifications and standards elsewhere on this timeline: an assertion that would be worthless from the company itself becomes worth something when an outside body makes it. The subject differs; the mechanism is identical.",
    ],
    externalUrl: "https://www.olitel.com.br/",
    externalLabel: "Olitel",
    sources: [
      { label: "Olitel: Grupo Olitel comprising Olitel Brasil S/A and Olibras Telecomunicações; wholly Brazilian-owned; integration of unified communications, IP telephony, contact centre, recording, workforce management, videoconferencing, security and tariffing; competencies in structured cabling, cloud, mobility, networking and performance; TRACE certification; partnerships including Twilio and Yealink", url: "https://www.olitel.com.br/empresa/", sourceNote: "The company's own materials give its age as 43 years on the site and 44 in a 2025 anniversary post, implying a founding around 1981-82, while its LinkedIn page says 36 years, implying 1989-90. PRIME ruled on 2026-08-03 that the site governs. The founding year here is therefore approximate and follows the company's own account." },
      { label: "RocketReach: São Paulo headquarters, approximately 70 employees and around $18.3M of revenue; described as an integrator building IT projects for small, medium and large companies across converged voice and data networks, contact centre, IVR, CTI, VPN, VoIP, videoconferencing, access routers and network security", url: "https://rocketreach.co/olitel-telecom-profile_b44758affae69990", sourceNote: "A business-contact database. Used for scale figures, which such databases estimate rather than report; treat as an order of magnitude." },
      { label: "Grupo Olitel on LinkedIn: national presence, describing itself as one of Brazil's larger providers of services and distribution of technology equipment with wholly national capital", url: "https://br.linkedin.com/company/olitelbrasil", sourceNote: "Also the source of the conflicting 36-year figure noted above." },
    ],
  },
  {
    // NV7 - added 2026-08-04 (PRIME), from nv7.com.br. Split out of the Niva
    // entry at his instruction.
    slug: "nv7",
    // Founded 2018, per the company's own LinkedIn profile (PRIME 2026-08-06). The entry
    // (A comment here previously said the founding year was not in the public
    // record. A `founded` value now sits below it, so the comment contradicted
    // the code and was removed 2026-08-10 - a comment asserting the opposite of
    // the code is read as evidence.)
    founded: 2018,
    group: "other",
    name: "NV7 Soluções Tecnológicas",
    tags: ["reseller", "services"],
    tagline: "Publishes its own security policies, which is rarer among security companies than it should be.",
    intro:
      "NV7 Soluções Tecnológicas is a São Paulo information-security integrator, working from the Torre Norte of the Centro Empresarial Nações Unidas on Avenida das Nações Unidas. Its practice is organised into four lines - data security, cloud security, endpoint and application security - built on a partner roster of Palo Alto Networks, F5, CrowdStrike, Forescout, Tenable, Fortinet, Netskope, Claroty and Tuvis.",
    body: [
      "The client roster reads as a cross-section of the Brazilian economy rather than a single sector: the B3 exchange, WEG, Honda, Eurofarma, Hypera, Unipar, Tramontina, Assaí, Iguatemi and Unimed alongside the digital businesses - OLX, Locaweb, Loggi, Movida, Neon, Pismo, Catho and Tembici. A security integrator serving both a motor manufacturer and a payments startup is solving the same problems with very different constraints on either side.",
      "One practice sets it apart from most companies in its category. NV7 publishes its own information-security management documentation openly: an information classification standard, a malicious-code standard, a technical vulnerability management standard, operational procedures and responsibilities, a secure-areas standard, and its incident response policy. Most security firms describe what they would do for a client and say nothing about what they do for themselves.",
      "That is a harder position to hold than it looks. Publishing your own controls invites the obvious question at every sales meeting - whether you meet them - and removes the option of a vague answer. It is also the only version of the argument that carries weight, because a security supplier asking a customer to accept a standard it will not describe for itself is asking for trust it has not offered.",
      "The Claroty partnership marks a specific competence: operational technology and industrial control systems, which is a different discipline from enterprise security rather than an extension of it. The failure modes are physical, the equipment predates IP networking by decades, and the maintenance windows are measured in years. Its presence beside Forescout on the same roster points at asset visibility across an estate where nobody has a complete inventory.",
      "The company also runs a Stock Car sponsorship and a podcast, and its commercial director Cássia Tavares has spoken at Gartner's security and risk conference on trust fatigue among security leaders - the argument being that constant verification and permanent suspicion are themselves a source of burnout in a profession that treats both as virtues.",
    ],
    externalUrl: "https://www.nv7.com.br/",
    externalLabel: "NV7 Soluções Tecnológicas",
    sources: [
      { label: "NV7: four solution lines across data, cloud, endpoint and application security; partner roster including Palo Alto Networks, F5, CrowdStrike, Forescout, Tenable, Fortinet, Netskope, Claroty and Tuvis; offices in the Torre Norte, Centro Empresarial Nações Unidas, Avenida das Nações Unidas, São Paulo", url: "https://www.nv7.com.br/" },
      { label: "NV7 published governance documents: information classification standard, malicious code standard, technical vulnerability management standard, operational procedures and responsibilities, secure areas standard, information and communication security policy, and incident response policy", url: "https://www.nv7.com.br/home/quem-somos/" },
      { label: "NV7 client logos as displayed on its own site, including B3, WEG, Honda, Eurofarma, Hypera, Unipar, Tramontina, Assaí, Iguatemi, Unimed, OLX, Locaweb, Loggi, Movida, Neon, Pismo, Catho and Tembici", url: "https://www.nv7.com.br/", sourceNote: "Client logos on a supplier's own marketing site indicate a commercial relationship of unstated scope, and are reported on that basis." },
      { label: "NV7 social channels: the Stock Car sponsorship, the Bit a Byte podcast, and commercial director Cássia Tavares speaking on trust fatigue at Gartner's security and risk conference", url: "https://www.instagram.com/nv7.tecnologia/" },
    ],
  },
  {
    // NIVA + NV7 - added 2026-08-03. ONE ENTRY per PRIME's ruling that NV7 is a
    // branch or spin-off of Niva IT - the same shape as the Nava/Unicom/
    // FlexVision ruling.
    //
    // *** DELIBERATELY SHORT. *** The public record is a company page and a
    // partner list. Under the standing reconciliation an entry is as long as
    // its evidence; padding this to match its neighbours would be inventing.
    slug: "niva",
    // Founded 2007, per Serasa Experian company register, CNPJ 09.053.350/0001-90 (PRIME 2026-08-06). The entry
    // previously carried no founding year at all.
    founded: 2007,
    group: "other",
    name: "Niva",
    // (The comment that used to sit here said there was NO `founded` field,
    // because the year was not in the public record. That stopped being true on
    // 2026-08-06 when PRIME supplied the register entry above, and the stale
    // comment survived beside the value that contradicted it. Removed 2026-08-10.
    // A comment asserting the opposite of the code is worse than no comment: it
    // is read as evidence.)
    tags: ["reseller", "services"],
    tagline: "An integrator whose partner list is a map of this timeline.",
    intro:
      "Niva Tecnologia da Informação is a São Paulo integrator working across three lines: information security, electronic security and data centre.",
    body: [
      "The partner list is the most informative thing in the public record, and it is worth reading as a document rather than a roster: F5, Palo Alto Networks, NetApp, CrowdStrike, Forescout, Netskope, Citrix, Avigilon, Furukawa and Lenel. Six of those are network and security vendors; two are physical security; one is structured cabling; one is storage.",
      "That combination describes a specific kind of company, and one this timeline has documented from every side except this one. An integrator carrying both information security and electronic security is selling into a building rather than into a network - firewalls and door controllers, network access control and cameras, on the same project, for the same customer, who has one budget and one set of contractors. The distinction between the two disciplines is much sharper in the vendor catalogues than it is on a construction site.",
      "The Furukawa entry in that list is the tell. Structured cabling sits underneath both the security camera and the firewall, and the company that pulls the cable is well placed to sell what hangs off it - which is the same observation the Anixter entry makes from the distribution side, arriving here from the installation side.",
      ],
    externalUrl: "https://br.linkedin.com/company/nivati",
    externalLabel: "Niva Tecnologia da Informação",
    sources: [
      { label: "Niva Tecnologia da Informação: an integrator of complex IT solutions across information security, electronic security and data centre, working with F5 Networks, Palo Alto Networks, NetApp, CrowdStrike, Forescout, Netskope, Citrix, Avigilon, Furukawa and Lenel; services spanning project design, configuration, installation, maintenance and performance management", url: "https://br.linkedin.com/company/nivati", sourceNote: "A company page is the whole of the public record found for this business; no founding date, founder or ownership history could be established." },
    ],
  },
  {
    // PARXTECH - added 2026-08-03. PRIME confirmed the spelling: parxtech.com.br
    // is the company, not "ParXtec".
    //
    // Short by the same rule as Niva: a founding year, a service line and a
    // positioning statement is what exists.
    slug: "parxtech",
    group: "other",
    name: "Parxtech",
    founded: 1992,
    tags: ["reseller", "services"],
    tagline: "Sells the layer nobody photographs: cable, containment, power and the survey that decides where they go.",
    intro:
      "Parxtech was founded in São Paulo in 1992 to provide connectivity and information technology services, and describes itself as wholly Brazilian-owned with national delivery capability. Its lines are networking, structured cabling, CCTV, wireless intrusion prevention, electrical work and outsourcing.",
    body: [
      "That combination is worth pausing on, because it is a physical-layer business with a security product bolted on, and the two halves are more related than they look. Networking, cabling, CCTV and electrical are all site work - somebody measures a building, decides where things go, pulls cable through it and terminates both ends. Wireless intrusion prevention is the odd one out on paper and not in practice: detecting a rogue access point is a survey problem before it is a software problem, and the company already owns the ladder.",
      "The electrical line is the detail that identifies the business type. A great many integrators stop at the patch panel. A company that will also do the power is selling to the person who has to make the room work, not to the person who has to make the network work - and those are frequently different people with different budgets, which is why most vendors' channel programmes have no idea how to categorise a company like this.",
      ],
    externalUrl: "https://parxtech.com.br/",
    externalLabel: "Parxtech",
    sources: [
      { label: "Parxtech: founded 1992 to provide connectivity and information technology solutions, wholly Brazilian-owned, headquartered in São Paulo with national delivery capability; services across networking, cabling, CCTV, WIPS, electrical and outsourcing", url: "https://parxtech.com.br/", sourceNote: "The company's own site is the entire public record found. Spelling confirmed by PRIME on 2026-08-03 as Parxtech." },
    ],
  },
  {
    // KA SOLUTION - added 2026-08-03 (PRIME).
    //
    // *** THE SIXTH TRAINING MODEL ON THIS TIMELINE, and the one closest to
    // where most people actually get certified. *** Red Education is authorised
    // delivery seen from the vendor-partner side; this is the same function
    // seen from a city-centre classroom that carries fifteen vendors at once.
    slug: "ka-solution",
    group: "other",
    name: "Ka Solution",
    founded: 1993,
    tags: ["training", "services"],
    tagline: "Carries fifteen vendors' official curricula at once, which is a different business from carrying one.",
    intro:
      "Ka Solution has been running technology training and consultancy in São Paulo since 1993. It describes itself as the largest official SAP training centre in Latin America and the largest official Microsoft and Oracle centre in Brazil, and reports training over 15,000 students a year across two São Paulo locations.",
    body: [
      "The vendor list is the entry, because of what carrying that many at once actually requires. SAP, Microsoft, AWS, Oracle, Java, VMware, Citrix, Dell EMC, Cisco, CompTIA, EC-Council, EXIN, (ISC)² and Dynatrace - four of which have their own entries on this timeline. Each of those authorisations is a separate agreement, a separate instructor certification path, a separate courseware licence, a separate audit, and a separate set of lab requirements that rarely resemble each other.",
      "So the difficulty is administrative before it is pedagogical, and that is the part outsiders consistently underestimate. An instructor certified for one vendor is not certified for another; a classroom configured for one vendor's labs is not configured for another's; a schedule that fills a SAP academy does not fill a security course. A multi-vendor school is running a dozen small businesses that happen to share a reception desk.",
      "Which makes it the sixth distinct training model recorded here, and worth placing against the others. CompTIA is certification owned by nobody. EPI is a specialist body for one domain. The market reserve trained a workforce inside protected manufacturers. Microcamp taught the general public. Red Education delivers authorised curricula as a vendor partner, internationally. This is the same authorised-delivery function as Red Education, arranged differently: one city, many vendors, walk-in enrolment, and a business model closer to a language school than to a consultancy.",
      "The market it serves is the one this site rarely describes. Most certification discussion assumes a corporate employer paying for training as part of a project. A commercial school in a city centre serves a different customer: the individual paying their own money, at night, to change what they are qualified to do. Those two customers want different things from the same course - the first wants their team productive on a product they have already bought, the second wants a credential an employer will recognise - and a school carrying fifteen vendors is structurally serving the second.",
      "The offer around the training reflects that: instalment payment plans, evening and remote live-instructor classes, and career placement arrangements with consultancies. The credential is the product, and everything else is arranged to get people through it - which is the honest description of a large part of this industry, and one the industry does not often use about itself.",
    ],
    externalUrl: "https://www.kasolution.com.br/",
    externalLabel: "Ka Solution",
    sources: [
      { label: "Ka Solution's own site and LinkedIn: operating since 1993; described as the largest official SAP training centre in Latin America and the largest official Microsoft and Oracle training centre in Brazil; official academies and courses across SAP, Microsoft, AWS, Oracle, Java, (ISC)², Dell EMC, Citrix, VMware, Dynatrace and Mastersaf; more than 15,000 students trained annually across units near Shopping Morumbi and in central São Paulo", url: "https://br.linkedin.com/company/ka-solution", sourceNote: "Company self-description. The superlative claims - largest in Latin America, largest in Brazil - are the company's own and are reported as such rather than independently verified." },
      { label: "Ka Solution course listings: official courses spanning AWS, CompTIA, Citrix, Cisco, EC-Council, EXIN, (ISC)², Java, Microsoft and SAP, with instalment payment and live-instructor remote delivery", url: "https://www.kasolution.com.br/Home" },
      { label: "Educaedu profile: trading since 1993, structured across five business lines - official Microsoft training, e-learning, IT consulting, outsourcing and mobile solutions", url: "https://www.educaedu-brasil.com/centros/ka-solution-uni1692", sourceNote: "A course-directory listing, and the business-line description it quotes is roughly fifteen years old. Used for the founding year and the historical shape of the business, not for its current structure." },
    ],
  },
  {
    // AUDIOCODES - added 2026-08-03 (PRIME).
    //
    // *** SECOND CONSECUTIVE ENTRY WHERE A COMPANY'S OWN SPECIFICATION BECAME
    // AN INTERNATIONAL STANDARD. *** Anixter's Levels became TIA Categories;
    // AudioCodes' work on G.723.1 became an ITU codec. Two different decades,
    // two different industries, same mechanism - and the thread is named here.
    slug: "audiocodes",
    official: {
      url: "https://www.audiocodes.com",
    },
    group: "other",
    name: "AudioCodes",
    founded: 1993,
    tags: ["vendor"],
    tagline: "Made the codec, then the board, then the gateway, then the software - and kept the same chief executive for thirty-three years.",
    intro:
      "AudioCodes was founded in Israel in 1993 - sources give both 9 May and 1 July - by Shabtai Adlersberg and Leon Bialik, with some accounts naming additional founders. Both came out of DSP Group, the Israeli semiconductor company Adlersberg had co-founded in 1987. It started by licensing voice compression algorithms and selling signal-processing boards to telecoms manufacturers, listed on NASDAQ in May 1999, and now turns around $242M.",
    body: [
      "The founding problem was arithmetic. A telephone call digitised the standard way consumes 64 kbps, and a packet network of the early 1990s could not carry many of those. Everything that became voice over IP depended on compressing speech hard enough to fit, without the result sounding like a machine. That is a signal-processing problem before it is a networking problem, which is exactly why the founders were chip people rather than network people.",
      "And their codec work went into an international standard. AudioCodes' speech coding contributed to G.723.1, adopted by the ITU - the low-bit-rate coder that a great deal of early VoIP ran on. A company's own specification becoming the standard everybody implements is the second instance of that pattern in as many entries on this timeline: Anixter's Levels programme became the TIA's Categories, and this became an ITU recommendation.",
      "Which is worth naming as a mechanism rather than treating as two coincidences. Standards bodies rarely invent; they ratify. What they ratify is usually the thing already built by whoever needed it badly enough to build it, and the reward for that company is not the licence income - it is that the industry's default now has your fingerprints on it, and every competitor implements a thing you understand better than they do. The moat is not the patent. It is the head start.",
      "The product line climbed one layer at a time and the sequence is unusually clean: codec, then the board carrying the codec, then the media gateway carrying the boards, then the session border controller carrying the gateway's function in software, then the management and analytics around it. Most component companies get commoditised as their layer becomes a feature of the layer above. This one kept moving up before that happened, which is a strategy easy to describe and hard to execute, because it means competing with your own customers.",
      "Then a structural fact worth noting. Adlersberg has been chief executive since 1993 - a thirty-three-year run, among the longest of any founder still leading a listed company. Its peers in enterprise voice cycled through leadership repeatedly and, as one analysis puts it, oscillated between growth mandates and restructuring mandates. A company that changes chief executive every four years cannot run a strategy that takes ten, and the enterprise-voice graveyard is full of businesses that were three years into a transition when the person who started it left.",
      "The Israeli lineage is the other half of the context. Adlersberg co-founded DSP Group in 1987, built a digital cellular research team there that was spun out as DSP Communications in 1992, and founded AudioCodes the following year. Three companies from one engineering group inside a decade - which is what a functioning technical ecosystem looks like from the inside, and is the same shape the Kentik entry describes for network operations in California.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/AudioCodes",
    externalLabel: "AudioCodes",
    sources: [
      { label: "AudioCodes executive team page: Adlersberg co-founding the company in 1993 and serving as president and chief executive since inception; co-founding DSP Group in 1987, serving as VP of Engineering and then VP of Advanced Technology, and establishing the digital cellular research team spun off in 1992 as DSP Communications", url: "https://www.audiocodes.com/corporate/executive-team" },
      { label: "Wikipedia: Israeli company headquartered in Or Yehuda; products spanning session border controllers, media gateways, IP phones, multi-service business routers and voice network management; revenue of $242.2M in 2024; dual listed on NASDAQ and the Tel Aviv exchange", url: "https://en.wikipedia.org/wiki/AudioCodes" },
      { label: "Secondary company histories: founding in 1993 with the initial business licensing voice compression algorithms and selling DSP-based boards to telecom manufacturers; early products targeting the G.723.1 and G.729 codecs for voice over IP and ATM; the NASDAQ IPO in May 1999; the later move from components into software and services", url: "https://portersfiveforce.com/blogs/brief-history/audiocodes", sourceNote: "Business-analysis blogs of the kind that proliferate around listed companies. They disagree on the founding date (9 May versus 1 July 1993) and on the founder list (some naming Moshe Zion or Stanley Cohen alongside Adlersberg and Bialik), and both variations are noted in the entry. Used for the product chronology, which is consistent across all of them and with the company's own materials." },
      { label: "Independent analysis of the company's platform cycles: both founders coming out of DSP Group; the progression from VoIP infrastructure through unified communications to conversational AI; the thirty-three-year founder-chief-executive tenure contrasted with peers that cycled through leadership and alternated growth and restructuring mandates", url: "https://olam.business/audiocodes", sourceNote: "An independent analysis rather than a reference work. Its characterisation of competitors' leadership churn is an interpretation, and is attributed here rather than asserted." },
      { label: "DCFmodeling: the company beginning in Lod before moving to Or Yehuda, and the deliberate shift from component supplier to software and services vendor described as its most transformative move", url: "https://www.dcfmodeling.com/blogs/history/audc-history-mission-ownership" },
    ],
  },
  {
    // VEEAM - added 2026-08-03 (PRIME).
    //
    // *** THE PATTERN WORTH NAMING: the side project ate the main business. ***
    // The e-commerce store was the company; the NT admin tools were a sideline;
    // the sideline out-earned the store, so they built a company around it.
    // That is a shape this timeline has not yet named and should.
    slug: "veeam",
    official: {
      url: "https://www.veeam.com",
      resources: [
        { label: "Veeam Documentation", url: "https://helpcenter.veeam.com" },
      ],
    },
    group: "contemporary",
    name: "Veeam",
    founded: 2006,
    tags: ["vendor"],
    tagline: "The side project ate the main business, twice - and a previous exit was the only funding round for a decade.",
    intro:
      "Ratmir Timashev and Andrei Baronov were roommates at Ohio State. In 1995, while Timashev was still a graduate student in chemical physics, they started an online shop selling computer parts. In 1996 they built some tools for Windows NT administrators on the side. The tools out-earned the shop, so they founded a company around them: Aelita Software, sold to Quest in 2004 for about $115M. Veeam followed in 2006.",
    body: [
      "That sequence is a pattern this timeline has not yet named, and it recurs constantly. The thing built to support the business becomes the business, because the supporting thing solves a problem the builder actually had, while the main business was a guess about a problem somebody else might have. Anyone who has written an internal tool that colleagues in other departments started asking for has seen the beginning of it. The usual mistake is treating the sideline as a distraction from the plan, rather than as evidence that the plan was aimed at the wrong problem.",
      "Veeam was funded by the Aelita exit and by nothing else for well over a decade. The founders held close to all the equity, took no institutional money until Insight Partners put in $500M in January 2019, and reinvested profits instead. That is a second route this site has now recorded twice - CloudShare's founder bought his company back from investors for four dollars and grew it on revenue. The venture path is not the only one that reaches a billion dollars; it is the one that gets written about, because the people who write about it are participants in it.",
      "The technical timing was the whole opportunity, and it is worth being precise about why. VMware was consolidating many physical servers onto few physical hosts. Backup software of the period ran an agent inside each machine and read the filesystem, which had been fine when each machine had its own disks and its own spare capacity - and became untenable when thirty agents woke up on one host and competed for the same spindles and the same network card. The old method did not stop working; it stopped being affordable, which is a distinction most product histories blur. Veeam's answer was to back up at the hypervisor level - copy the virtual disk, ignore the guest - which is only possible because the hypervisor exists.",
      "And the first products were not backup at all. Veeam Monitor and Veeam Reporter did monitoring, reporting and documentation of virtual infrastructure. The backup business began with FastSCP in 2007, released free - a tool for copying VM files - which became the foundation for the data protection products that followed. Free tool first, paid product after, is the same shape as the Kali entry elsewhere on this site: the giveaway is not marketing spend, it is how you find out which problem people actually have.",
      "Insight Partners bought the company for $5B in January 2020, the founders stepped back, and the business completed a shift from perpetual licences to subscription - which is what that kind of owner is for, and is a harder transition than it sounds, because it converts a large payment today into a small one repeated, and the years in between look like decline on every chart.",
      "One consequence of the acquisition is structural and deserves recording. Veeam was registered in Baar, Switzerland; the acquisition moved the corporate domicile to Columbus, Ohio - where Timashev had studied and built Aelita. A United States domicile makes a company eligible to bid for federal contracts. That is a plain fact about how procurement works, and it belongs beside the sovereignty entries elsewhere here: those record countries building their own infrastructure so that ownership cannot be used against them, and this records a company changing its own nationality so that ownership could be used for it. The same mechanism, pointed in opposite directions.",
    ],
    acquisitions: [
      { year: 2018, name: "N2WS", what: "Cloud-native backup and disaster recovery for Amazon Web Services.", became: "Veeam's route into backing up what runs in a public cloud rather than on a hypervisor it can see." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Veeam",
    externalLabel: "Veeam",
    sources: [
      { label: "Wikipedia on Ratmir Timashev: meeting Baronov as a college roommate at Ohio State; the 1995 online computer-parts store started while a graduate student; building Windows NT administrator tools in 1996 whose sales soon exceeded the parts revenue, leading to Aelita Software; Object First founded in 2022 after the Veeam sale", url: "https://en.wikipedia.org/wiki/Ratmir_Timashev" },
      { label: "Wikipedia and HandWiki on Veeam: founded 2006 by Timashev and Baronov after selling Aelita to Quest in 2004; first office in Saint Petersburg as the main R&D facility; first products Veeam Monitor and Veeam Reporter for virtual infrastructure monitoring; the free FastSCP VM backup copy tool in 2007 becoming the basis of the data protection software; Quest passing to Dell in 2012 and then to Francisco Partners and Elliott in 2016", url: "https://en.wikipedia.org/wiki/Veeam" },
      { label: "Blocks & Files (January 2020): Insight Partners acquiring Veeam for $5B; the founders taking no outside funding until Insight's $500M injection in January 2019; the N2WS acquisition in 2018", url: "https://www.blocksandfiles.com/data-management/2020/01/09/insight-partners-buys-veeam-for-5bn/1600270" },
      { label: "LegalClarity: the Aelita sale at approximately $115M in 2004; Veeam originally registered in Baar, Switzerland with the Insight acquisition triggering a move to Columbus, Ohio; a US domicile making the company eligible to bid on federal government contracts", url: "https://legalclarity.org/who-owns-veeam-ownership-founders-and-leadership/", sourceNote: "A secondary explainer rather than a primary source. Used for the domicile change and its procurement consequence, which is consistent with how US federal contracting eligibility is generally described; the underlying acquisition facts are corroborated above." },
      { label: "Trade coverage of the post-acquisition period: the founders stepping down from operating roles, William Largent returning as chief executive and Anand Eswaran appointed in December 2021; the completed transition to subscription revenue and reported annual recurring revenue above $1.5B", url: "https://everything-pr.com/veeam-data-resilience-standard", sourceNote: "A public-relations industry publication. Used for the leadership sequence and the subscription transition; its valuation and customer-count figures are the company's own and are not asserted here." },
    ],
  },
  {
    // ANIXTER - added 2026-08-03 (PRIME, who wrote "Anixster"; standard
    // spelling used). The seventh distributor.
    //
    // *** THE FIND: Anixter's 1989 "Levels" programme was the first written
    // performance specification for data cabling, and the TIA renamed Levels to
    // CATEGORIES. *** Every engineer who says "Cat 6" is using a vocabulary a
    // DISTRIBUTOR invented. That is the entry.
    slug: "anixter",
    group: "other",
    name: "Anixter",
    founded: 1957,
    tags: ["distributor"],
    tagline: "A distributor wrote the specification that became Cat 5 and Cat 6.",
    intro:
      "Alan and Bill Anixter started a wire and cable distribution business outside Chicago in 1957 - Wikipedia dates the start to 1956 - on a family loan the company puts at $10,000 and Wikipedia at $20,000 from their mother. Within a decade it was turning $10M. When WESCO bought it in 2020 for about $4.5B it had roughly 130,000 customers, 600,000 products and 316 warehouses across some fifty countries.",
    body: [
      "Here is the thing worth knowing, and almost nobody does. In 1989 Anixter published the Levels programme - the first written performance specification for data cabling systems. It was a distributor's document, produced so that customers could compare cable on measured performance rather than on the manufacturer's assurances. The TIA standards body adopted it and renamed Levels to Categories.",
      "Which means every network engineer alive who says Cat 5, Cat 5e or Cat 6 is using a vocabulary invented by a cable distributor, for commercial reasons, and subsequently promoted into an international standard. That is a genuinely unusual route for a specification to travel, and it says something specific about where useful standards come from: not always from the manufacturers, who have an interest in incomparability, nor from committees, who need something to standardise, but sometimes from whoever is stuck explaining the difference to a buyer.",
      "The 1995 laboratory follows the same logic and is the other half of the argument. Anixter opened an interoperability lab in Illinois with UL-verified test processes, and described itself as the only distributor with one. A distributor testing what it sells is doing something structurally odd - it is not the manufacturer, so it has no product to defend, and it is not the customer, so it has the volume to justify equipment nobody buying a single reel could afford. That is the same neutrality argument this timeline makes about carrier-neutral exchanges and vendor-neutral certification, arriving in the least likely place: the middle of a supply chain.",
      "The growth mechanism was acquisition and it was explicit. Alan Anixter told the Chicago Tribune he carried a list of acquisition targets in his pocket, and the company bought nineteen businesses by the end of the 1960s. It listed on the American exchange in 1967 and the New York exchange in 1975, was acquired by the Itel holding company and later took the Anixter International name, passed $1B of sales in 1991 and $3B by 1999.",
      "The ending is one of the better-documented bidding wars in distribution. Clayton, Dubilier & Rice bid $3.8B in October 2019, with a forty-day window allowing Anixter to seek better offers. WESCO appeared, and the price climbed through $3.9B, $4.0B, $4.3B and finally $4.5B in January 2020, at which point CD&R waived its matching rights. The combined business had pro-forma revenues around $17B, and the announcement projected $200M of annual cost savings by year three - which in distribution means branches and distribution centres, because that is where the duplication is.",
      "Read beside the other six distributors here, Anixter is the one that shaped what it sold rather than only moving it. Ingram and Tech Data built logistics and credit; ScanSource picked a product thesis; Westcon and Arrow consolidated. This one wrote a specification the entire industry still speaks. A distributor is usually described as a layer that adds cost between manufacturer and customer, and the strongest counterargument is that somebody in that layer had to define what the products even were before they could be compared.",
    ],
    acquisitions: [
      { year: 1998, name: "Pacer Electronics", what: "Electronic wire, cable and connector distribution.", became: "Part of Anixter's expansion into OEM supply." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Anixter",
    externalLabel: "Anixter",
    sources: [
      { label: "Anixter's own company history: the 1989 Levels programme as the first written performance specification for data cabling systems, and the TIA renaming Levels to Categories; the 1995 Interoperability Lab in Mt. Prospect with UL-verified structured cabling test processes, described as the only such distributor lab; The Blue Book in 1968 at $10M of sales and 700 employees; $1B of sales in 1991; the Itel acquisition and rename to Anixter International", url: "https://www.anixter.com/en_gb/about-us/company-overview/company-history.html", sourceNote: "The company's own history, and the Levels-to-Categories claim is its own. It is consistent with the TIA category system's documented origins and with independent accounts of Anixter's cabling standards work, but readers wanting the standards-body side should consult TIA's own record." },
      { label: "Wikipedia: started in 1956 by brothers Alan and Bill Anixter with a $20,000 loan from their mother; headquarters moved to Skokie in 1969; Alan Anixter's account of carrying a list of acquisitions, with nineteen companies bought by the end of the 1960s; public on the American Stock Exchange in 1967 and expansion to the UK in 1972", url: "https://en.wikipedia.org/wiki/Anixter", sourceNote: "Dates the founding to 1956 and the family loan at $20,000, where the company's own history says 1957 and $10,000. Both readings are stated in the entry rather than one being chosen." },
      { label: "WESCO/Anixter merger news release (SEC Form 425, 13 January 2020): the transaction valued at approximately $4.5B; Anixter's roughly 130,000 customers, nearly 600,000 products, over $1.0B of inventory and 316 warehouse and branch locations across about fifty countries; pro-forma combined 2019 revenues of approximately $17B and over $200M of expected annual run-rate cost synergies by end of year three; the termination of the prior CD&R agreement following its waiver of matching rights", url: "https://www.sec.gov/Archives/edgar/data/52795/000114036120000665/nc10007564x2_ex99-1.htm" },
      { label: "ChannelE2E: the bidding war beginning with CD&R's $3.8B offer in October 2019 and a forty-day go-shop period, climbing through $3.9B, $4.0B and $4.3B to the final $4.5B", url: "https://www.channele2e.com/news/wesco-anixter-deal" },
      { label: "Encyclopedia.com: incorporation in 1957 as Anixter Brothers Inc.; over 350,000 items from more than 5,000 suppliers to around 95,000 customers as of the mid-2000s; competitors listed as Consolidated Electrical Distributors, Graybar and WESCO - the eventual acquirer", url: "https://www.encyclopedia.com/books/politics-and-business-magazines/anixter-international-inc" },
    ],
  },
  {
    // MICROCAMP - added 2026-08-03 (PRIME). The education half of cluster 8,
    // and the one PRIME's brief pointed at most directly: private technical
    // training at scale.
    //
    // *** IT CLOSES THE TWO HALVES OF THE CLUSTER IN ONE FACT: *** the school
    // equipped itself with CP 500 and TK 85 machines - the domestically built
    // clones the market reserve produced. The reserve made the hardware; this
    // made the users.
    slug: "microcamp",
    group: "other",
    name: "Microcamp",
    founded: 1977,
    tags: ["training"],
    tagline: "The pioneering was the audience, not the technology - and it taught on the machines the market reserve built.",
    intro:
      "Eloy Tuffi opened Flama Microinformática in Vila Mariana, São Paulo, in 1977, and it became Microcamp after he moved to Campinas in 1981. It is generally described as Brazil's first computer school. Over four decades it reports having taught more than two million students in Brazil, Portugal, Spain and Argentina.",
    body: [
      "The founder was not a technologist. He already owned four English-language schools, having started selling books and English courses at eighteen, and he came to computing as somebody who understood how to sell instruction to ordinary people. That matters more than it sounds, and it explains the shape of everything that followed.",
      "Because the pioneering thing was the audience, not the technology. Courses in computing already existed in Brazil in 1977. They were for programmers, attached to the mainframes that were the only computers most organisations had, and they were expensive and restricted. Tuffi's proposition was that ordinary people - not future programmers, just people - would pay for computer instruction if it were affordable. That is the founding insight of essentially every technical training business since, and it was not obvious at the time.",
      "The pedagogy came from language teaching, and it fits better than anyone expected. A language school runs on monthly fees, graded levels, small classes and the assumption that competence is built by repeated practice over months rather than transferred in a week. Apply that structure to computing and it works, for exactly the same reason: both are skills, not bodies of knowledge, and a skill acquired in a five-day intensive decays at a rate that surprises the person who paid for it. The group later ran schools combining English with computing, which is the same recognition from the other direction.",
      "And here the two halves of this timeline's market-reserve story meet in one detail. Tuffi equipped his first school with twelve microcomputers: CP 500 and TK 85 machines - domestically built, the products of exactly the protected industry written up elsewhere on this site. The reserve manufactured the hardware; schools like this manufactured the users. Neither half works without the other, and the policy documents of the period discuss the first at length and the second barely at all.",
      "The commercial history is a franchising history: first branch in Ribeirão Preto in 1986, Portugal in 1989, a franchise system launched in 1994 and taken abroad the following year, a training institute for its own staff and franchisees in 1995. Franchising is what let a teaching method scale beyond the reach of the person who invented it, and the institute exists because a franchised school is only as good as its worst instructor - which is the same problem the authorised-training entries on this site describe from the vendor's side.",
      "The number worth carrying away is the denominator. The market reserve entry records employment in informatics and automation rising from about 42,000 to about 74,000 people across the 1980s - that is the industry. Two million people passed through these classrooms. Most of them did not become engineers, and that is the point: a country does not become able to use computers by training its computer industry, it does so by training everybody else. The reserve gets the policy histories; this got the students.",
    ],
    externalUrl: "https://pt.wikipedia.org/wiki/Microcamp",
    externalLabel: "Microcamp",
    sources: [
      { label: "Wikipédia (pt): founded 1977 as Flama Microinformática and described as Brazil's first computer school; Eloy Tuffi equipping it with twelve CP 500 and TK 85 microcomputers at a time when Brazil had only large computers and courses for programmers; the Instituto Microcamp in March 1995 and the holding company in Campinas in April 1996", url: "https://pt.wikipedia.org/wiki/Microcamp" },
      { label: "Sua Franquia interview with the founder: already owning four English-language schools and identifying a market in affordable computing courses for lay users; moving to Campinas in 1981 after leaving the business to a partner; franchising from 1994 as the fastest and safest route to expansion", url: "https://www.suafranquia.com/noticias/educacao-e-treinamento/2014/07/fundador-apresenta-informacoes-sobre-a-microcamp-/", sourceNote: "The founder's own account of his motives, in a franchising trade publication. Used for the sequence and the stated reasoning, which is corroborated on dates by the encyclopedic sources." },
      { label: "Educaedu and the founder's own site: founding in Vila Mariana, headquarters moving to Campinas in 1981, first branch in Ribeirão Preto in 1986, Portugal from 1989, franchising in Brazil from August 1994 and abroad from 1995; the group later including the ABC schools combining English with computing and Spanish", url: "https://www.educaedu-brasil.com/centros/microcamp-tecnologia-uni3154" },
      { label: "Microcamp corporate materials: more than two million students taught across Brazil, Portugal, Spain and Argentina in over forty years; student and school counts that vary between sources and dates", url: "https://br.linkedin.com/company/microcamp", sourceNote: "Company self-description. School and student counts differ substantially across sources and years - 150 schools and 110,000 students in one account, 65 units and 120,000 in another - so the entry cites the cumulative figure the company reports and does not assert a current network size." },
      { label: "Unicamp's Centro de Memória researched the company and its founder over two years, publishing Do BASIC ao TI on its first thirty years", url: "https://www.eloytuffi.com.br/microcamp.php", sourceNote: "The founder's own website, cited only for the existence of the Unicamp research project and the resulting book." },
    ],
  },
  {
    // CLOUDSHARE - added 2026-08-03 (PRIME). Closes cluster 9.
    //
    // *** THE $4 BUYBACK IS FROM CLOUDSHARE'S OWN TEAM PAGE. *** Extraordinary
    // enough to want corroboration, and the corroboration is that they publish
    // it themselves - a company does not invent a story in which its investors
    // valued it at four dollars.
    //
    // Also connects to the channel SE article written from PRIME's own account:
    // the demo/PoC distinction.
    slug: "cloudshare",
    official: {
      url: "https://www.cloudshare.com",
    },
    group: "contemporary",
    name: "CloudShare",
    founded: 2007,
    tags: ["training", "services"],
    tagline: "Its founder bought it back from the investors for four dollars, then ran it profitably for a decade.",
    intro:
      "CloudShare was founded in Tel Aviv in January 2007 as IT Structures - Wikipedia names Avner Rosenan, Ophir Kra-Oz and Zvi Guterman, other sources two of the three - and moved to California in 2009. It builds virtual laboratory environments: replicas of complex on-premises systems, running in the cloud, for training, demonstrations and proofs of concept.",
    body: [
      "The company's own team page contains a sentence most companies would not print. Guterman, it says, purchased CloudShare from its investors for four dollars, and then built it into the market leader in laboratory environments. The company had raised around $26M across three rounds. A business does not invent a story in which its own investors valued it at four dollars, which is the best reason to believe it - and the ending is that it was sold to a Denver asset manager at a reported $60M to $80M after roughly a decade of bootstrapped, profitable growth.",
      "That sequence is worth sitting with, because it inverts the standard narrative this timeline records over and over. Raise money, grow fast, sell. Here: raise money, have the investors write it off entirely, buy it back for a nominal sum, and then grow slowly on your own revenue until it is worth tens of millions. The venture route is the one that gets written about, and it is not the only one that works.",
      "The technical problem is specific and is one this site's readers will recognise instantly. Enterprise software assumes a data centre: several machines, particular network topology, licences, an installed state that takes a day to reach. Anyone who has taught such a product knows the real constraint is not the material - it is that thirty students each need a working copy of an environment that takes hours to build and that they will inevitably break. CloudShare's answer is to snapshot a fully configured environment and hand every user an independent replica in about a minute.",
      "The insight in the business model is that a training lab and a sales demonstration are the same artifact. Both are a working replica of a system the audience does not yet have, in a state that shows it doing something useful. The difference is what the audience is asked to do afterwards, and that difference is entirely in the framing rather than the infrastructure - which is why one platform serves training, presales demos and proofs of concept.",
      "Which is where this entry meets an argument already on this site. A proof of concept is supposed to be a test that can fail; a demonstration is supposed to succeed. When both run on identical infrastructure, prepared by the same people, the line between them is a matter of intent rather than of setup - and a proof of concept designed so it cannot fail is a demonstration wearing a different name. Good lab platforms make honest testing easier and dishonest testing easier by exactly the same amount.",
      "Customers include Palo Alto Networks, Atlassian, HP, Microsoft, RSA, Salesforce and ForgeRock - several of which appear elsewhere on this timeline, which is the ordinary condition of the layer this cluster documents: the companies you have heard of run on companies you have not.",
      "And it closes the cluster where it began. Kryterion partners with CloudShare to add proctoring to hands-on labs, which is the industry converging on the hybrid: the realism of a practical assessment, in a reproducible environment, with the identity verification of a supervised exam. Every piece of that sentence is a different company, and none of them writes the questions.",
    ],
    externalUrl: "https://www.cloudshare.com/",
    externalLabel: "CloudShare",
    sources: [
      { label: "CloudShare's own executive team page: Guterman purchasing CloudShare from investors for four dollars and building it into the market leader in IT lab environments; clients including Atlassian, Microsoft and Palo Alto Networks", url: "https://www.cloudshare.com/meet-the-team/", sourceNote: "The four-dollar purchase is an extraordinary claim and it is the company's own published statement about its own founder. Recorded on that basis - a company is unlikely to invent a story in which its investors valued it at nothing." },
      { label: "Wikipedia: founded in Tel Aviv in January 2007 as IT Structures by Avner Rosenan, Ophir Kra-Oz and Zvi Guterman; headquarters moved to California in 2009; environments saved, replicated and shared as independent snapshots", url: "https://en.wikipedia.org/wiki/CloudShare" },
      { label: "Tracxn: founded 2007, $26M raised across three rounds, around 92 employees; virtual IT labs for training, demos and proofs of concept", url: "https://tracxn.com/d/companies/cloudshare/__jRltKQoL6hJ_41DC3Xc_PHf7ISlQ5gw1sqhoG_lCAdA", sourceNote: "Funding database, which names two founders where Wikipedia names three. Both counts are noted in the entry rather than one being chosen." },
      { label: "Startup Nation Central: the acquisition by a Denver-based alternative asset manager at an estimated $60-80M, described as an exit after a decade of bootstrapped growth and profitability", url: "https://finder.startupnationcentral.org/company_page/cloudshare", sourceNote: "The price is reported as an estimate and is stated as such here; the parties did not disclose it." },
      { label: "Forbes Technology Council profile: Guterman previously co-founder and CTO of Safend and chief architect in the IP infrastructure group of ECTEL, with a PhD in computer science from Hebrew University; more than 500 customers in over 100 countries", url: "https://councils.forbes.com/profile/Zvi-Guterman-CEO-founder-CloudShare/398349ac-c990-47bc-8c4e-14571d5818c5" },
    ],
  },
  {
    // KRYTERION - added 2026-08-03 (PRIME). Cluster 9.
    //
    // *** THE FIND: Drake International founded Prometric in 1990, sold it to
    // Sylvan in 1995, and then started Kryterion. *** The same parent, twice,
    // in the same industry - which the Prometric entry did not know when it was
    // written two turns ago.
    slug: "kryterion",
    group: "other",
    name: "Kryterion",
    founded: 2001,
    tags: ["training", "services"],
    tagline: "The same parent that founded Prometric, doing it a second time - and proctoring online fourteen years before everyone had to.",
    intro:
      "Kryterion began as a division of Drake International around 2000 or 2001, depending on which source is followed. Drake had founded Drake Prometric in 1990 and sold it to Sylvan Learning in 1995. So the company that created one of the two dominant test-delivery networks sold it, and then built another one. Kryterion runs from Phoenix, Arizona, with offices in the United Kingdom, South Africa and Asia.",
    body: [
      "Its first genuine claim to precedence is worth checking against the rest of this cluster. Kryterion says it introduced online proctoring in 2005 - fourteen years before Pearson VUE launched OnVUE, and fifteen before the pandemic made remote delivery the only option. The claim comes from the company's own history page and should be read as such, but the direction is clear enough: the capability existed, was commercially available, and was not widely adopted until circumstances removed the alternative. That is the ordinary pattern for infrastructure, and worth remembering next time something is described as unprecedented.",
      "The business model is the real difference from the two larger networks, and it is a genuine architectural choice rather than a marketing distinction. Pearson VUE and Prometric are full-service: the client hands over an exam and the network delivers it. Kryterion sells Webassessor, a platform on which clients build, modify and publish their own examinations - with the explicit selling point that changing an item does not incur a publishing fee. One model treats the exam as something you outsource; the other treats it as something you operate. Which suits an organisation depends entirely on whether its examinations change often, and organisations reliably underestimate how often theirs will.",
      "The centre network is around a thousand locations against several thousand for the larger networks, which is a real limitation and an honest one. A smaller network is a smaller reach, and the answer to it is the online and event-based delivery the company leaned on early.",
      "And then the strategic difference that makes this entry worth reading beside Credly's. Kryterion assembles its stack by partnership: CloudShare for virtual lab environments, TrueAbility for performance-based assessment, and Credly for digital credentials - the same Credly that Pearson bought outright in 2022. The identical functional stack, assembled by acquisition on one side and by partnership on the other.",
      "Neither is obviously correct. Acquisition guarantees the capability is there and can be integrated deeply; it also concentrates the trust chain in one owner, which is the observation this site made about Pearson and repeated about ETS's ownership of Prometric. Partnership keeps the pieces independent, so a customer's credential provider is not their exam provider's subsidiary; it also means the pieces can change hands, be discontinued, or start competing with you. The question is not which structure is better but which failure you would rather have, and that is a question most buyers never realise they are answering.",
      "Kryterion also supports third-party performance-based examinations inside a proctored browser, which is the hybrid the whole cluster has been converging on: the realism of a practical assessment with the identity verification of a supervised one. Whether that combination inherits the strengths of both models or the weaknesses is not yet answerable from the public record - the approach is too new, and the failure modes of assessment take years to surface.",
    ],
    externalUrl: "https://www.kryterion.com/",
    externalLabel: "Kryterion",
    sources: [
      { label: "Kryterion's own about page: Drake International's Kryterion division pioneering online global assessment in 2001, and the introduction of online proctoring in 2005; the Webassessor self-service platform allowing clients to modify and publish exams without additional publishing fees; offices in Phoenix, the United Kingdom, Cape Town and Asia", url: "https://www.kryterion.com/about-kryterion/", sourceNote: "Company history in the company's own words. The 2005 online-proctoring precedence is Kryterion's own claim and is presented as such rather than as an established fact." },
      { label: "Kryterion partner page: CloudShare for virtual lab environments, TrueAbility for performance-based assessment, and Credly for digital credentials", url: "https://www.kryterion.com/strategic-partners/" },
      { label: "Kryterion test delivery page: over 1,000 test centres alongside live remote proctoring, event-based testing and client-controlled proctoring options", url: "https://www.kryterion.com/test-delivery/" },
      { label: "Kryterion performance-based testing page: third-party performance-based exams delivered with live online proctoring inside a secure browser environment, bundled with or separate from Webassessor qualifying exams", url: "https://www.kryterion.com/performance-based-testing/" },
      { label: "ZoomInfo and LeadIQ: founding dated 2000 in one and 2001 in the other; Phoenix headquarters; 201-500 employees", url: "https://www.zoominfo.com/c/kryterion-inc/105498064", sourceNote: "Business databases, which disagree with each other on the founding year. Both readings are stated in the entry rather than one being chosen." },
    ],
  },
  {
    // EC-COUNCIL - added 2026-08-03 (PRIME). Cluster 9.
    //
    // *** THE CRITICISM IS SUBSTANTIAL AND MUST BE HANDLED FAIRLY, WHICH MEANS
    // NEITHER GLOSSING IT NOR JOINING IN. *** The approach taken: lead with the
    // criticism that is verifiable from EC-Council's OWN published words (the
    // CNDA/CEH identical-exam FAQ), state the accreditations honestly, and then
    // offer the structural explanation that accounts for BOTH the recognition
    // and the hostility without endorsing either camp.
    slug: "ec-council",
    official: {
      url: "https://www.eccouncil.org",
    },
    group: "other",
    name: "EC-Council",
    founded: 2001,
    tags: ["training", "standards"],
    tagline: "The most required certification in its field, and the most argued about, which are the same fact seen twice.",
    intro:
      "The International Council of E-Commerce Consultants was founded in 2001, in response to the September 11 attacks and the question of whether the security community was equipped for an equivalent attack on commercial infrastructure. It launched the Certified Ethical Hacker in 2003, and CEH became the most widely required security certification in the world - and the most persistently criticised. Those two facts are connected.",
    body: [
      "Start with the criticism that does not depend on anybody's opinion, because EC-Council published it themselves. The Certified Network Defence Architect was marketed as a defensive credential. EC-Council's own frequently-asked-questions page stated that apart from the title, the content of the exam was the same as CEH. One examination, two names, sold to two audiences as different qualifications. Whatever one concludes about the rest, that is documented in the organisation's own words and is difficult to defend.",
      "The wider criticism is long-running and easily found: the security researchers at attrition.org maintain a page arguing the case, allegations of comment-spam marketing that the organisation's president dismissed as a fictional theory, published advice in 2015 that women should wear a trouser suit with heels to be credible on a penetration test, and website security incidents at an organisation selling website security. A site that records the criticism of CompTIA, of web filtering and of practical exams should record this too, and does.",
      "And the accreditation is real, which is the other half of an honest account. EC-Council holds ISO/IEC 17024 accreditation for personnel certification bodies, and CEH is recognised under United States Department of Defense Directive 8140 - previously 8570 - which means it satisfies a mandatory requirement for certain defence roles. That recognition is not marketing. It is why the certification appears in job requirements written by people who have never heard the criticism.",
      "The structural explanation is more useful than a verdict. A certification that becomes mandatory acquires enormous volume, because people take it who would not otherwise have chosen it. Volume produces variance: among hundreds of thousands of holders there will be excellent practitioners and people who memorised a question bank, and both hold the same credential. Variance produces the anecdote - everybody in this industry has met a certificate holder who could not do the thing - and the anecdote travels much further than the median. Being required is what makes a certification valuable and what degrades what holding it signals, and there is no version of mandating a credential that avoids this.",
      "Which lands exactly where the rest of this cluster does. Standardised exams are scalable and memorisable. Practical exams are unfakeable and leakable. Mandated exams are universally recognised and universally diluted. Every mechanism that makes a credential useful attacks the thing that made it worth having, and the honest position for anyone hiring is that no certification is evidence of capability - it is evidence that somebody passed a specific test on a specific day, which is a smaller and more useful claim.",
      "EQT Private Equity invested in September 2021. That is the second EQT holding on this timeline, after Prometric - a reminder that the certification industry's ownership is concentrated in a smaller number of hands than its variety of brands suggests. Reported certification totals vary widely between EC-Council's own materials and its press releases, from fifty thousand to over four hundred thousand, and this entry asserts neither.",
    ],
    externalUrl: "https://www.eccouncil.org/",
    externalLabel: "EC-Council",
    sources: [
      { label: "Wikipedia and HandWiki: founded 2001 as the International Council of E-Commerce Consultants in response to the September 11 attacks; CEH launched 2003; EQT Private Equity investing September 2021; the recorded criticisms including comment-spam allegations dismissed by the president as a fictional theory and the 2015 published advice about women's dress on penetration tests", url: "https://en.wikipedia.org/wiki/EC-Council" },
      { label: "attrition.org: the long-running criticism page, including EC-Council's own FAQ stating that apart from the title, the CNDA exam content is the same as the CEH exam", url: "https://attrition.org/errata/charlatan/ec-council/history_and_criticism.html", sourceNote: "An openly critical source maintained by security researchers, and it says so. Cited here for the CNDA/CEH identical-exam point specifically, which rests on EC-Council's own published FAQ rather than on the site's opinion - and that is why this entry leads with that point rather than the rest." },
      { label: "EC-Council press materials: ISO/IEC 17024 accreditation, recognition under US Department of Defense Directive 8140/8570, operation across 145 to 170 countries, and certification totals that differ between documents", url: "https://www.businesswire.com/news/home/20230216005048/en/5390372/100-Elite-Ethical-Hackers-Inducted-into-EC-Councils-2023-Certified-Ethical-Hacker-CEH-Hall-of-Fame", sourceNote: "Company press release. Used for the accreditation facts, which are verifiable independently; its certification counts conflict with the company's own About page (50,000 versus over 400,000) and neither figure is asserted here." },
      { label: "EC-Council's own About page: the founding account following the 9/11 attacks and the question posed by Jay Bavisi", url: "https://www.eccouncil.org/about/" },
      { label: "Secondary accounts differing on the founding: Haja Mohideen credited as creator of the CEH, CHFI and ECSA/LPT programmes, and one account stating Bavisi bought the company in 2015", url: "https://en.everybodywiki.com/EC-Council", sourceNote: "A user-editable wiki whose account of the founding conflicts with EC-Council's own and with Wikipedia. Recorded because the discrepancy exists, not because it is resolved." },
    ],
  },
  {
    // OFFSEC - added 2026-08-03 (PRIME). Completes the cluster's argument by
    // being the OPPOSITE model: the exam is the work, not a proxy for it.
    //
    // *** THE 2019 BRAIN-DUMP CONTROVERSY IS RECORDED, because it is the exact
    // failure mode of this model *** - and putting it beside the MCQ failure
    // mode is the point of having both entries.
    slug: "offsec",
    official: {
      url: "https://www.offsec.com",
    },
    group: "contemporary",
    name: "OffSec (Offensive Security)",
    founded: 2007,
    tags: ["training", "vendor"],
    tagline: "Gives the tool away and charges for the proof that you can use it.",
    intro:
      "Mati Aharoni started what became Offensive Security around 2007 - the company was incorporated in 2008 - working from his living room with his wife Iris, and Wikipedia names Devon Kearns as co-founder. It makes Kali Linux, maintains ExploitDB, and issues the OSCP, whose 24-hour practical examination has a reputation that most certifications would trade a great deal for.",
    body: [
      "The lineage of the tool runs backwards through two mergers. BackTrack first appeared in May 2006, formed by combining WHAX - Aharoni's own Slax-based distribution, earlier called Whoppix and based on Knoppix - with the Auditor Security Collection. It ran on Slackware for three versions, moved to Ubuntu for two more, and ended at 5 R3 in August 2012. In March 2013 the team rebuilt it on Debian and released it as Kali Linux, which is a harder decision than it sounds: throwing away a distribution with an established name and a large user base, in favour of a foundation that made packaging and long-term maintenance tractable. They chose the maintainable base over the familiar name, which is the correct call and almost never the popular one.",
      "The business model is worth stating plainly because it inverts the usual one. The tool is free and the proof is expensive. Kali costs nothing, is open source, and is used by people who will never buy anything. What OffSec sells is training and certification - and the free tool is what builds the audience for it. Compare that with the vendors elsewhere on this timeline who sell the product and give away the training; both models work, and they select for entirely different kinds of customer.",
      "And then the assessment, which is the reason this entry sits beside Pearson VUE and Prometric rather than apart from them. Those companies exist to run controlled examinations in supervised rooms, where the question is whether the right person answered. The OSCP does the opposite: twenty-four hours, real machines on a test network, compromise them, then write the report. The exam is the work rather than a proxy for it. You cannot bluff a shell you did not get.",
      "That inverts the trust problem rather than solving it, and the inversion has a documented cost. A multiple-choice examination can be memorised, which is why the delivery companies invest so heavily in verifying that the person in the chair is the candidate. A practical examination cannot be bluffed - but the target machines are reusable, so knowing them in advance is the cheat. In 2019 a critic published a walkthrough of one exam machine and threatened more, alleging that cheating was widespread and that the certification's value was being eroded from inside.",
      "Put the two failure modes side by side and the general principle falls out. Every assessment model is vulnerable in exactly the place its strength comes from. Standardisation makes an exam scalable and memorisable. Realism makes an exam unfakeable and leakable. There is no design that is strong in both directions, which is why the serious question about any certification is not whether it can be gamed but which way it can be gamed, and whether the people relying on it know.",
      "Aharoni left in 2019 after more than two decades in security. Jim O'Gorman took over as Kali project lead, with Raphaël Hertzog - a Debian developer - as a third technical pillar. The founder leaving without the project faltering is worth noting, because the timeline elsewhere records several tools that did not survive their author's departure.",
      "The distribution also carries a cultural footprint disproportionate to its user count, having appeared repeatedly in *Mr. Robot* - which is the rare case of screen technology being accurate enough that practitioners were not embarrassed by it.",
    ],
    externalUrl: "https://www.offsec.com/",
    externalLabel: "OffSec",
    sources: [
      { label: "Wikipedia: Offensive Security from around 2007, founders Mati Aharoni and Devon Kearns; products including Kali Linux, Kali NetHunter, the defunct BackTrack, and the OSCP; ExploitDB", url: "https://en.wikipedia.org/wiki/Offensive_Security" },
      { label: "Wikipedia: BackTrack's first release on 26 May 2006 from the merger of WHAX (Aharoni's Slax-based distribution, earlier Whoppix and Knoppix-based) and the Auditor Security Collection; final release 5 R3 in August 2012; rebuilt on Debian and released as Kali Linux in March 2013", url: "https://en.wikipedia.org/wiki/BackTrack" },
      { label: "Wikipedia: Kali Linux initial release 13 March 2013, based on the Debian testing branch, rolling release, GPLv3; developed by Aharoni and Kearns as a rewrite of BackTrack; featured in Mr. Robot", url: "https://en.wikipedia.org/wiki/Kali_Linux" },
      { label: "CSO Online (2019): the OSCP's 24-hour examination requiring students to hack machines on a test network; the controversy when a critic published a walkthrough of an exam machine and threatened more, alleging widespread cheating and raising questions about the certification's integrity", url: "https://www.csoonline.com/article/566815/oscp-cheating-allegations-a-reminder-to-verify-hacking-skills-when-hiring.html" },
      { label: "Korben: the company beginning in 2006-2007 from Aharoni's living room with his wife Iris and incorporating in 2008; the Try Harder philosophy of no multiple-choice questions and no abstract theory; Aharoni's departure in 2019, Jim O'Gorman taking over as Kali project lead and Raphaël Hertzog as a third technical pillar", url: "https://korben.info/en/kali-linux-underground-tool-global-reference.html", sourceNote: "A retrospective feature rather than a reference work. Used for the founding circumstances, the philosophy and the succession, each corroborated in outline by the encyclopedic sources above." },
    ],
  },
  {
    // PROMETRIC - added 2026-08-03 (PRIME). The other half of the test-delivery
    // duopoly, and the entry that supplies the parallel the Credly entry raised
    // in the abstract: an exam AUTHOR owning an exam DELIVERER, for eleven
    // years, and then separating.
    slug: "prometric",
    group: "other",
    name: "Prometric",
    founded: 1990,
    tags: ["training", "services"],
    tagline: "Six owners in thirty-five years, and the layer that deliberately does not write the questions it delivers.",
    intro:
      "Drake International started Drake Prometric in 1990 to run computerised testing centres - and, having sold it, went on to start Kryterion, which appears separately on this timeline. Sylvan Learning bought it in 1995 for about $44.5M in cash and stock, Thomson Corporation bought it in 2000 for roughly $775M, Educational Testing Service bought it in 2007 for $435M, Baring Private Equity Asia bought it in 2018, and EQT holds it now. Six owners in thirty-five years, for a business whose entire product is being trusted.",
    body: [
      "The structural fact is the one most people get wrong, and it is worth stating first: Prometric does not write the exams. Its clients develop the content, write the questions and set the passing standards. Prometric supplies secure delivery, identity verification, proctoring and score reporting. That separation is deliberate and it is the source of the industry's credibility - the organisation that decides what competence means is not the organisation that decides whether you demonstrated it, and neither can quietly adjust the other's work.",
      "Which makes one period of its history genuinely interesting. From 2007 to 2018 Prometric was owned by Educational Testing Service - the author of the SAT and GRE. For eleven years a major writer of examinations owned a major deliverer of examinations. Nothing improper has been alleged, and ETS's own tests were not the bulk of what Prometric delivered. But the arrangement is precisely the one the industry's separation of powers is designed to avoid, and it ended: ETS sold in 2018. The same question sits, unresolved, over the exam and credential businesses that share an owner today, and the parallel is worth stating, because scepticism applied selectively is not scepticism.",
      "The price arc is the cleanest illustration of a bubble on this timeline. Sylvan paid about $44.5M in 1995. Thomson paid roughly $775M in 2000, at the height of the dot-com boom. ETS paid $435M in 2007 - little more than half what Thomson had paid seven years earlier. The business had not shrunk. The market's opinion of what a testing network was worth had.",
      "A smaller detail worth keeping: ETS had sold a testing business called CapStar to Thomson for about $200M in 2004, and received it back three years later as part of the Prometric purchase. Selling something and buying it back inside a larger deal is more common in this industry than anyone likes to admit.",
      "The client list explains why the stakes are higher than technology certification alone: the United States Medical Licensing Examination, the nursing boards, financial regulatory licensing, the architecture registration examination. These are not credentials that improve a curriculum vitae - they are the ones that decide whether somebody may practise. A delivery failure in that context is not an inconvenience.",
      "And delivery does fail. The August 2023 administration of the Law School Admission Test drew widespread complaints from candidates, particularly those testing remotely. An infrastructure company's failures are the only part of its work that becomes visible, and pretending they do not happen would be a strange way to describe a business whose product is reliability.",
      "Read beside Pearson VUE the pair defines the market. Both run global centre networks, both added remote proctoring, both deliver for hundreds of credentialing bodies, and neither writes what it delivers. The interesting difference is ownership history rather than capability: one has been inside a single education group for a quarter of a century, the other has passed through a staffing company, a tutoring chain, a media conglomerate, a test author and two private equity firms. Whether stability or circulation produces the better custodian of other people's examinations is not a question the record settles.",
    ],
    acquisitions: [
      { year: 1995, name: "Drake Prometric (by Sylvan Learning)", price: "~$44.5M in cash and stock", what: "The computerised testing business started by Drake International in 1990.", became: "Sylvan Prometric." },
      { year: 2000, name: "Sylvan Prometric (by Thomson)", price: "~$775M", what: "Bought at the height of the dot-com boom.", became: "Thomson Prometric - and a valuation the next sale would not match." },
      { year: 2007, name: "Prometric (by ETS)", price: "$435M", what: "Sold by Thomson as it exited education; ETS also recovered CapStar, which it had sold to Thomson for about $200M in 2004.", became: "Eleven years under the ownership of a major exam author.", sourceNote: "The price is little more than half what Thomson paid seven years earlier - the clearest single illustration of the 2000 valuation peak on this timeline." },
      { year: 2018, name: "Prometric (by Baring Private Equity Asia)", what: "ETS divested; BPEA later became part of EQT.", became: "Private-equity ownership, and the end of the author-owns-deliverer arrangement." },
    ],
    externalUrl: "https://www.prometric.com/",
    externalLabel: "Prometric",
    sources: [
      { label: "Wikipedia and HandWiki: founded by Drake International in 1990 as Drake Prometric; sold to Sylvan Learning in 1995 for approximately $44.5M in cash and stock; renamed Sylvan Prometric and sold to Thomson in 2000; ETS closing its acquisition on 15 October 2007; Baring Private Equity Asia in 2018", url: "https://en.wikipedia.org/wiki/Prometric" },
      { label: "Baltimore Sun (July 2007): ETS buying Prometric for $435M, more than half of what Thomson paid Sylvan in 2000 at the height of the dot-com boom (about $775M); ETS also receiving CapStar, which it had sold to Thomson for about $200M in 2004", url: "https://www.baltimoresun.com/2007/07/03/ets-buys-prometric/" },
      { label: "Altss company profile: Prometric does not write or own exam questions - client organisations develop the content and set passing standards, while Prometric provides secure delivery infrastructure, proctoring and score reporting; clients including the USMLE programme, the National Council of State Boards of Nursing, FINRA and the Architect Registration Examination; EQT acquiring from Baring in 2023", url: "https://altss.com/profile/prometric-llc", sourceNote: "An OSINT-compiled profile rather than a primary source. Used for the content-versus-delivery separation and the client list, both consistent with Prometric's own published descriptions; the 2023 EQT transfer is described elsewhere as BPEA becoming part of EQT rather than a separate sale, and the entry does not assert which framing is correct." },
      { label: "Grokipedia: the ownership chain through Drake, Sylvan, Thomson and ETS to EQT via the BPEA fund; headquarters in Maryland; the August 2023 LSAT administration drawing complaints, particularly from remote test takers", url: "https://grokipedia.com/page/Prometric" },
    ],
  },
  {
    // CREDLY - added 2026-08-03 (PRIME). Written immediately after Pearson VUE
    // because it completes the same chain: VUE verifies THE PERSON, Credly
    // verifies THE CREDENTIAL - and both are now owned by Pearson.
    //
    // *** THE PATENT TENSION IS RECORDED, INCLUDING THE UNRESOLVED PART. ***
    // An open standard with patents held over it by the market leader is a
    // genuine issue, the promise not to assert is a promise rather than a
    // property of the standard, and the reporting notes nobody had taken up the
    // offered licence. All of that is stated; none of it is adjudicated.
    slug: "credly",
    official: {
      url: "https://info.credly.com",
    },
    group: "contemporary",
    name: "Credly",
    founded: 2012,
    tags: ["training", "vendor"],
    tagline: "Verifies the credential, as its owner verifies the person - and the small company bought the big one's product before the big one bought it.",
    intro:
      "Jonathan Finkelstein founded Credly in New York in 2012 to issue digital credentials - badges carrying machine-readable metadata about what was earned, who issued it, when, and what it required - built on Open Badges, the open specification Mozilla launched in 2011 and later handed to a standards body. He had previously founded LearningTimes and co-founded HorizonLive, which Blackboard acquired.",
    body: [
      "The problem it addresses is the half of certification that the exam does not solve. A test centre establishes that the right person sat the exam. It says nothing afterwards: a PDF certificate can be edited, a line on a CV cannot be checked without contacting the issuer, and neither carries an expiry that anyone can see. A digital credential is a verifiable object - click it and the issuer's own record answers, including whether it has since lapsed or been revoked. The chain is only as strong as its weakest link, and for years the weakest link was not the exam, it was the claim about the exam.",
      "The ownership matters. Verification of the person and verification of the credential are now under one owner: Pearson operates the test centres and, since 2022, owns Credly. That is not an accusation, since the pieces genuinely work better joined and nobody has alleged otherwise. It is simply worth stating: when the same organisation attests that you sat the exam and that your certificate is real, the independence between those two attestations is organisational rather than structural.",
      "The corporate sequence is a neat reversal. Pearson launched a badging platform called Acclaim in 2014. In 2018 Credly - much the smaller company - acquired it, with Pearson taking a minority stake of around twenty per cent and a board seat. Pearson then invested again in the 2019 funding round. In January 2022 Pearson acquired Credly outright. The small company absorbed the large company's product, and four years later the large company absorbed the small one. The badging product is now marketed under both names.",
      "And then the part that deserves careful handling, because it is genuinely unresolved. Credly holds United States patents covering the creation, management and tracking of digital credentials. That alarmed the Open Badges community, whose whole premise is an open specification anyone may implement, and whose platform predated the patents. The company said it had no intention of asserting against that community and offered a reasonable-and-non-discriminatory licence, later broadening it to cover both mandatory and optional elements of the standard.",
      "The objection that remains is structural rather than about intent. A promise not to assert is a promise, and promises survive at the discretion of whoever owns the patent next - which, as of 2022, is a different company from the one that made it. Reporting at the time also noted that nobody had actually requested one of the offered licences, which can be read as the community being reassured or as the licence being beside the point. That is not settled here. An open standard with patents held over it by the market leader is the kind of arrangement worth knowing about before building on it.",
      "Read beside two other entries here, the shape is familiar. USRobotics defended proprietary protocols until standards took the advantage away. Dynatrace held a patent and then helped build the open standard that generalised it. Credly is a third position: implement the open standard, become its largest implementer, and hold patents beside it. Whether that is a moat, insurance, or simply what a company's lawyers do without anyone deciding anything is not something the public record settles.",
    ],
    acquisitions: [
      { year: 2018, name: "Acclaim (from Pearson)", what: "Pearson's Open Badge platform, launched 2014, used by Microsoft, IBM and the American Council on Education among others.", became: "Merged into Credly, with Pearson taking a minority stake of about 20% and a board seat - which set up the reverse acquisition four years later." },
    ],
    externalUrl: "https://www.credly.com/",
    externalLabel: "Credly",
    sources: [
      { label: "Credly's own announcement of the Pearson acquisition, from founder Jonathan Finkelstein, and the company's description of its Open Badge platform", url: "https://learn.credly.com/blog/announcing-credly-acquisition-by-pearson" },
      { label: "VentureBeat (April 2019): the $11.1M Series A led by Zoma Capital and Strada Education Network with Pearson among the existing investors, bringing total funding to $18.2M; Credly's 2018 acquisition of Pearson's Acclaim; Open Badges as a Mozilla-architected specification; Mozilla retiring its Backpack in 2018", url: "https://venturebeat.com/business/credly-raises-11-1-million-to-issue-and-manage-digital-badges" },
      { label: "Tracxn: founded 2012 in New York by Jonathan Finkelstein; acquired by Pearson on 30 January 2022; $18.2M raised across its funding history", url: "https://tracxn.com/d/companies/credly/__qgAPaazcGcqhY_5o1bJ5Cfw5zL3Wl3OOD9fUDXyOrEY", sourceNote: "Funding database. Used for dates and totals, which such databases track reliably; the acquisition price is not disclosed there and is not stated in this entry." },
      { label: "EdSurge: the two US patents granted for creating, managing and tracking digital credentials and the reaction from the Open Badges community; Finkelstein's statement that Credly would not assert against that community, the RAND licence honoured from Pearson's arrangement with IMS, its later broadening to mandatory and optional elements, and the observation that nobody had requested one", url: "https://www.edsurge.com/news/2019-03-12-who-owns-digital-badges-a-company-s-patent-on-credentials-raises-questions" },
      { label: "Forbes: Acclaim launched by Pearson in 2014 with Peter Janzow, acquired by Credly in 2018; customers including Dell, IBM and Oracle", url: "https://www.forbes.com/sites/tomvanderark/2019/06/12/leading-the-show-what-you-know-revolution-digital-credentials-from-credly/" },
      { label: "Secondary account of the 2022 transaction describing Pearson's pre-existing stake of nearly 20% and the acquisition as a reverse of the 2018 deal", url: "https://blog.certopus.com/what-is-credly-and-how-to-use-it", sourceNote: "A competitor's blog, and it editorialises about Credly elsewhere on the same page. Used ONLY for the stake figure and the characterisation of the deal as a reversal, both corroborated by the funding and acquisition records cited above." },
    ],
  },
  {
    // PEARSON VUE - added 2026-08-03 (PRIME: "One rich entry for Pearson and
    // VUE"). First of cluster 9, the exam and lab delivery layer.
    //
    // THE ANGLE: a certification is worth exactly what its verification is
    // worth, and this is the company that manufactures the verification. That
    // makes it directly relevant to a site built by an instructor.
    //
    // TWO DISCREPANCIES RECORDED: the acquisition year (2000 in most sources,
    // 2006 in one) and the test-centre count, which is quoted as 4,600, 5,500
    // and nearly 20,000 in different places - almost certainly counting
    // different things.
    slug: "pearson-vue",
    official: {
      url: "https://home.pearsonvue.com",
    },
    group: "other",
    name: "Pearson VUE",
    founded: 1994,
    tags: ["training", "services"],
    tagline: "A certification is worth exactly what its verification is worth, and this is where the verification happens.",
    intro:
      "Virtual University Enterprises was founded in 1994 - the company's own account names Clarke Porter, Steve Nordberg and Kirk Lundeen; some sources credit E. Clarke Porter alone. It expanded to the Netherlands and Australia the following year, was acquired by NCS and then by Pearson in 2000, and became Pearson VUE. It now delivers something like 21 million exams a year across more than 180 countries.",
    body: [
      "The reason this belongs on a site about teaching is a chain of trust that almost nobody examines. A vendor defines what competence means and issues a credential. A training company teaches toward it. And somewhere in the middle a stranger has to establish that the person sitting at the keyboard is the person named on the certificate, that they had no help, and that they did not see the questions in advance. A credential is worth exactly what that verification is worth, and no more. Every argument about whether certifications mean anything is really an argument about this layer.",
      "So the security apparatus is the product: identity documents checked against the booking, signature capture, palm-vein scanning in some centres, surveillance, a proctor who watches, and a room stripped of everything a candidate might otherwise consult. The Pearson Professional Centers, introduced in 2002, exist to standardise exactly that - because a certification delivered inconsistently across five thousand sites is a certification whose value varies by postcode.",
      "One piece of timing deserves noting without over-reading. OnVUE, the online-proctored delivery platform, launched in 2019. The following year, test centres worldwide closed and remote proctoring became the only way most certifications could be earned at all. The capability existed a year before it became indispensable, which is luck rather than foresight - but the alternative, an industry that had to invent remote proctoring under lockdown conditions, would have gone considerably worse.",
      "Remote proctoring also moved the trust problem rather than solving it. In a test centre the environment is controlled by the examiner; at a kitchen table it is controlled by the candidate, and the verification becomes a camera, a room scan and behavioural monitoring. That is a weaker guarantee honestly described, and the industry has been arguing about the trade ever since - alongside a second argument about surveillance of people in their own homes, which is a different objection and a fair one.",
      "The parent company is the other half of the story. Pearson dates to 1844 and began as a construction firm - S. Pearson & Son, contractors - before becoming a publisher and then an education company. That is the second business on this timeline that spent its first century moving physical things and its second moving information, after Ingram Industries, which was in lumber and shipping from the 1830s before it ended up distributing computers. Two of the oldest names here arrived from heavy industry, which is not a coincidence so much as a reminder that the durable thing about a company is rarely its product.",
      "The exam-delivery portfolio was assembled by purchase - Goal Designs in 2001, Promissor in 2006, Integral7 in 2010, Exam Design in 2013 - and the business now delivers well beyond technology certification: academic admissions tests, healthcare and finance licensing, and government programmes including driving theory examinations. Most people who have sat a Pearson VUE exam have never heard the name, which is the ordinary condition of infrastructure.",
    ],
    acquisitions: [
      { year: 2000, name: "Virtual University Enterprises", what: "The 1994 computer-based testing company, acquired by NCS and then by Pearson.", became: "Pearson VUE.", sourceNote: "Most sources date the Pearson acquisition to 2000; one secondary source says 2006 and is not followed here." },
      { year: 2001, name: "Goal Designs", what: "Certification programme management consulting.", became: "Part of the exam development portfolio." },
      { year: 2006, name: "Promissor", what: "Licensing and certification testing.", became: "Expansion beyond IT into regulated professions." },
      { year: 2013, name: "Exam Design", what: "Exam authoring and psychometrics tooling.", became: "Support for performance-based testing and simulation items." },
    ],
    externalUrl: "https://www.pearsonvue.com/",
    externalLabel: "Pearson VUE",
    sources: [
      { label: "Pearson VUE's own vision page: VUE launched in 1994 by Clarke Porter, Steve Nordberg and Kirk Lundeen; acquired by NCS and then Pearson in 2000; Goal Designs 2001, Promissor 2006, Integral7 2010, Exam Design 2013; Pearson Professional Centers introduced 2002; OnVUE launched 2019", url: "https://www.pearsonvue.com/us/en/about/vision.html" },
      { label: "Wikipedia: Pearson acquiring Virtual University Enterprises in 2000 and renaming it Pearson VUE; Pearson plc headquartered in London", url: "https://en.wikipedia.org/wiki/Pearson_VUE" },
      { label: "Learn & Work Ecosystem Library: Pearson founded 1844; Pearson VUE delivering nearly 21 million exams annually through test centres and OnVUE", url: "https://learnworkecosystemlibrary.com/organizations/pearson-and-pearson-vue/" },
      { label: "Pearson VUE regional release: nearly 20,000 test centres and around 500 client programmes; testing across more than 180 countries", url: "https://www.pearsonvue.com/gb/en/about/news/highlights/pearson-vues-innovative-solutions-revolutionize-t.html", sourceNote: "Company communications. Centre counts vary widely across sources - 4,600, 5,500 and nearly 20,000 all appear - almost certainly counting different things (wholly operated centres, authorised centres, and total seats). No single figure is asserted in this entry." },
      { label: "Test-centre procedure descriptions: identity verification including physical identification checks, signature and in some centres palm-vein scanning, surveillance and trained proctors", url: "https://bitts.ca/pearson-vue-testing-centres/", sourceNote: "A test-centre operator's page rather than a primary source. Used only for the description of standard centre procedure, which is consistent with Pearson VUE's own published candidate rules." },
    ],
  },
  {
    // DYNATRACE - added 2026-08-03 (PRIME). Pairs with Kentik: both
    // observability, approached from opposite ends of the stack.
    //
    // *** INVERTS THE USROBOTICS PATTERN. *** That company defended proprietary
    // protocols until standards arrived and took the advantage away. This one
    // held a patented tracing method and then helped build the open standard
    // that generalised it. Same situation, opposite response.
    //
    // FOUNDING-DATE AND FOUNDER-LIST DISCREPANCIES RECORDED.
    slug: "dynatrace",
    official: {
      url: "https://www.dynatrace.com",
      resources: [
        { label: "Dynatrace Docs", url: "https://docs.dynatrace.com" },
      ],
    },
    group: "contemporary",
    name: "Dynatrace",
    founded: 2005,
    tags: ["vendor"],
    tagline: "Rewrote its entire platform from scratch under private-equity ownership, which is not how that story usually goes.",
    intro:
      "dynaTrace Software GmbH was founded in Linz, Austria in 2005 by Bernd Greifeneder with Sok-Kheng Taing and Hubert Gerstmayr; some accounts add Alois Reitbauer, and the founding date appears as both 2 February and 1 July. The problem it set out to solve was specific: applications had become distributed enough that nobody could say which component was slow.",
    body: [
      "PurePath, patented in 2006, is the technical contribution. It traced a single transaction end to end - browser to database - across every service it touched, at code level, with overhead low enough to leave running in production. That last clause is the hard part. Tracing that is only safe in a test environment tells you about a test environment, and the interesting failures do not happen there.",
      "Bain Capital Ventures invested a year after founding and Bay Partners three years later, together taking around two-thirds of the company. In 2011 Compuware bought it for $256M, by which point it had roughly 180 staff and over 500 customers. Two of the founders took the exit; Greifeneder stayed, and by his own account the point had never been the money.",
      "Then 2014, and the part worth the entry. Thoma Bravo bought Compuware for around $2.4B and carved out the monitoring business as a standalone company. Greifeneder's own recollection is blunt about the culture clash: the new owner specialised in businesses with a good product and ineffective leadership, and was unaccustomed to waiting between investment and output. His startup habits were not what they had bought.",
      "What happened next is the opposite of what private-equity ownership is usually accused of producing. He took three months with his best product people and came back with a recommendation to start again - a separate team, an entirely new platform, written from scratch, on the argument that the disruption of cloud was an opening to leap ahead rather than a problem to survive. They agreed to it. A company under debt-funded ownership, expected to produce returns, rebuilt its product from nothing. It listed on the New York Stock Exchange in August 2019 at $16 a share and rose 49% on debut.",
      "And here it inverts a pattern this timeline records elsewhere. USRobotics won three times with proprietary protocols and lost the advantage each time a standard arrived. Dynatrace held a patent on distributed tracing from 2006 - and then contributed to OpenTelemetry, W3C Trace Context, Keptn and OpenFeature, the open standards that generalise exactly what PurePath did privately. Faced with the same situation, one company defended the moat and the other helped dig the canal. Which is right depends on whether your advantage is the mechanism or the thing you build on top of it.",
      "Thoma Bravo sold down its holding between 2019 and 2024, leaving a widely held public company reporting around $1.6B of revenue for its 2024 financial year. That is the fifth appearance of Thoma Bravo on this timeline, after Sophos, LANDESK, Ping and CompTIA - a reminder that a handful of firms have shaped more of this industry's ownership than any of the vendors have.",
      "The headquarters moved to Massachusetts, but engineering stayed in Linz - a university town in upper Austria that is not on anyone's list of places software platforms come from, which is rather the point.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Dynatrace",
    externalLabel: "Dynatrace",
    sources: [
      { label: "Grokipedia: founded 2005 in Linz as dynaTrace Software GmbH by Bernd Greifeneder, Sok-kheng Tang and Hubert Gerstmeyr; PurePath patented in 2006 enabling end-to-end transaction tracing from browser to database at code level; approximately 180 employees and over 500 customers by 2011; the NYSE listing in 2019", url: "https://grokipedia.com/page/Dynatrace" },
      { label: "Forbes (August 2019): the 49% climb on market debut; the 2011 Compuware purchase for $256M; Thoma Bravo acquiring Compuware three years later for $2.4B and spinning Dynatrace out; the dinner in Linz and Greifeneder returning after three months with a team of his best product people to recommend building an entirely new platform from scratch", url: "https://www.forbes.com/sites/kenrickcai/2019/08/01/dynatrace-software-ipo-trading-debut/" },
      { label: "Dynatrace Engineering (Medium), translating an Austrian profile: Bain Capital Ventures investing a year after founding and Bay Partners three years later, together holding two-thirds after a second round of about $13M; co-founders Sok-Kheng Taing and Hubert Gerstmayr exiting at the Compuware acquisition while Greifeneder stayed; his characterisation of the new owner as specialising in companies with a good product and ineffective leadership", url: "https://medium.com/dynatrace-engineering/doping-for-the-internet-c170393b35e0", sourceNote: "Published by the company's own engineering blog as a translation of an external profile. Used for the funding sequence and for Greifeneder's characterisation of the ownership change, which is his account of it rather than a neutral one." },
      { label: "Wikipedia: acquired by Compuware in 2011, taken private by Thoma Bravo in 2014 and renamed Dynatrace; contributions to CNCF and related projects including Keptn, W3C Trace Context, OpenTelemetry and OpenFeature", url: "https://en.wikipedia.org/wiki/Dynatrace" },
      { label: "MatrixBCG: the 2019 IPO priced at $16 per share; Thoma Bravo's gradual sell-down from 2019 to 2024; annual recurring revenue reaching an estimated $1.6B by fiscal 2025", url: "https://matrixbcg.com/blogs/owners/dynatrace" },
      { label: "SWOTTemplate and PortersFiveForce: the founding date given as 2 February 2005 in one account and 1 July 2005 in another, and Alois Reitbauer named among the founders alongside Greifeneder", url: "https://swottemplate.com/blogs/brief-history/dynatrace-brief-history", sourceNote: "Secondary business summaries that disagree with each other on the founding date and the founder list. Cited precisely because they disagree; both readings are stated in the entry rather than one being chosen." },
    ],
  },
  {
    // KENTIK - added 2026-08-03 (PRIME).
    //
    // Worth the entry because its founding team is where several companies
    // ALREADY on this timeline converge: Akamai, Cloudflare, Netflix, YouTube.
    // It is the operators building the tool the vendors had not.
    //
    // FOUNDER-LIST DISCREPANCY RECORDED: sources give four or five names.
    // Both counts stated rather than one chosen.
    slug: "kentik",
    group: "contemporary",
    name: "Kentik",
    founded: 2014,
    tags: ["vendor"],
    tagline: "The people who ran the networks built the tool they could not buy.",
    intro:
      "Kentik was founded in San Francisco in 2014 as CloudHelix, taking its current name in 2015. The founding list is given as four names in most accounts - Avi Freedman, Ian Applegate, Ian Pye and Justin Biegel - and as five in others, adding Dan Ellis; both are recorded here. What is not in dispute is where they came from.",
    body: [
      "Avi Freedman started Philadelphia's first internet service provider, netaxs, in 1992. He went on to run network operations at Akamai for over a decade, as vice-president of network infrastructure and then chief network scientist, and also ran the network at AboveNet and served as chief technology officer of ServerCentral. Ian Pye is described as Cloudflare's first employee; Ian Applegate came from Cloudflare too. Dan Ellis came from Netflix. Biegel came from Internap.",
      "So the founding team is a convergence of companies already on this timeline - Akamai and Cloudflare both have their own entries here, and both were built on the same insight about where traffic actually goes. The people who had operated those networks left to build something for the people still operating them.",
      "The reason they gave is the entry. In Freedman's account, large web companies, enterprises and service providers kept telling them that the analytics available inside cloud-scale companies were simply not available in the commercial market - particularly for internet visibility and for architectures that had stopped looking like a data centre. So they built what they had wanted and could not buy. That is a specific and recurring shape: a category exists because the people who needed it were senior enough to build it instead of waiting.",
      "The product ingests what a network actually emits rather than what a monitoring tool wishes it emitted: NetFlow, IPFIX and sFlow records, SNMP, streaming telemetry, cloud flow logs, host agents, synthetic tests and BGP routing. Flow records are the interesting part for anyone who has tried this at scale, because they arrive in enormous volume, they are lossy by design, and the analytical question is almost never about one record - which is why the problem is a data problem wearing a networking costume.",
      "Traction was unusually quick: seed funding of $3.1M in September 2014, a $12.1M Series A in June 2015, deployments within months and more than twenty large paying customers inside a year, including Yelp and Box. Later rounds brought total funding to somewhere between $102M and $118M depending on which tally is used.",
      "One public contribution deserves recording, because it is the kind of thing this class of tooling makes possible: Kentik was among those that identified a substantial IP address hijacking in the period before the 2021 United States presidential inauguration. Routing hijacks are visible only to somebody watching the global routing table closely enough to notice that an address block has started being announced from the wrong place. The company also employs Doug Madory, whose internet-routing analysis is widely cited.",
      "It was acquired by Infoblox in 2026. The arc is a familiar one on this timeline - an independent tool built by practitioners is eventually bought by a platform vendor who wants the capability inside their own product - and whether that improves the tool or merely absorbs it is not yet answerable.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Kentik",
    externalLabel: "Kentik",
    sources: [
      { label: "Wikipedia: founded 2014 in San Francisco as CloudHelix by Avi Freedman, Ian Applegate, Ian Pye and Justin Biegel; renamed Kentik in 2015; the role in uncovering an IP hijacking before the 2021 presidential inauguration; Doug Madory among key people", url: "https://en.wikipedia.org/wiki/Kentik" },
      { label: "451 Research reprint (July 2015): originally CloudHelix; $3.1M seed in September 2014 from First Round Capital, Data Collective and Webb Investment Network; a $12.1M Series A in June 2015 led by August Capital; deployments within months and 20-plus large paying customers within a year including Yelp and Box; the founding team's origins at Akamai, CloudFlare, Netflix and Internap", url: "https://info.kentik.com/rs/869-PAD-887/images/451-ResearchReprint_Kentik_07Jul151.pdf" },
      { label: "Forbes Technology Council profile: Freedman starting Philadelphia's first ISP, netaxs, in 1992; over a decade at Akamai as VP of network infrastructure then chief network scientist; running the network at AboveNet and serving as CTO of ServerCentral", url: "https://councils.forbes.com/profile/Avi-Freedman-CEO-Co-Founder-Kentik/938f959c-a4e0-4cc0-a266-a96f61a66b3f" },
      { label: "VentureBeat (October 2021): the five-name founder list including Dan Ellis; Freedman's account that analytics available to cloud-scale companies were lacking in the commercial market, particularly around internet visibility and cloud-native architectures; the $40M Series C", url: "https://venturebeat.com/2021/10/07/network-observability-startup-kentik-lands-40m" },
      { label: "Grokipedia: the telemetry sources ingested - SNMP, streaming telemetry, NetFlow, IPFIX and sFlow, cloud flow logs, host agents and synthetic testing; founders described as network operators from Akamai, Netflix, YouTube and Cloudflare", url: "https://grokipedia.com/page/Kentik" },
      { label: "SDxCentral: the Infoblox acquisition; Ian Pye described as Cloudflare's first-ever employee and serving as Kentik's chief scientist and CTO; the 2021 Series C bringing total funding to approximately $102M", url: "https://www.sdxcentral.com/news/infoblox-collects-kentik-for-network-observability-out-of-the-box/", sourceNote: "Trade coverage. Used for the acquisition and the funding total; note that Tracxn gives $118M across five rounds, and both figures are stated in the entry rather than reconciled." },
    ],
  },
  {
    // BRIGHTCLOUD - added 2026-08-03 (PRIME). Written immediately after
    // Websense/Forcepoint because it is the layer BELOW it, and the two
    // explain each other.
    //
    // The founder loop is real and worth the space: BrightCloud's founder was
    // Websense's director of product management.
    slug: "brightcloud",
    group: "other",
    name: "BrightCloud",
    founded: 2005,
    tags: ["vendor"],
    tagline: "The classification layer underneath other people's security products, including its founder's former employer's competitors.",
    intro:
      "Quinn Curtis founded BrightCloud in San Diego in 2005. He had been director of product management at Websense, and before that spent nearly nine years at Microsoft, on the team that built and shipped the first version of Exchange. The company did one thing: classify the web - reputation and content categories across, by the time Webroot bought it in July 2010, more than 200 million URLs and IP addresses.",
    body: [
      "What makes this worth an entry is the business model rather than the product. BrightCloud did not sell filtering to enterprises. It sold classification to the companies that sell filtering to enterprises. The data was licensed to partners who built it into their own gateways, firewalls and proxies, and the customer never saw the name.",
      "Which produces a fact most engineers have never considered: two competing security products can be making the same judgement, because they buy it from the same place. When a firewall from one vendor and a web gateway from another agree that a site is malicious, that agreement may be evidence, or it may be one supplier's opinion arriving twice. The categories elsewhere on this timeline are described as judgements made at scale by people the affected user will never meet - and this is where those people work.",
      "The founder loop is the other half. Curtis had run product management at Websense, whose entire product was acting on classifications. He left to build the classification itself, one layer down, and sell it to everyone - including, necessarily, companies competing with his former employer. The layer below a market is often a better business than the market, because it has fewer customers, they are stickier, and they compete with each other rather than with you.",
      "Webroot acquired the company on 7 July 2010, terms undisclosed, and folded the team into its cloud engineering group. Webroot itself had been founded in 1997 in Broomfield, Colorado, and by its 2018 financial year was turning about $215M with more than 14,000 managed-service partners. Carbonite bought Webroot in 2019; OpenText bought Carbonite later the same year. The classification service is still sold under the BrightCloud name to other security vendors, three owners later - which tells you something about how durable an infrastructure position is compared with a product one.",
      "One caution belongs here rather than in a footnote. A shared classification source means a shared blind spot. If the database miscategorises something, every product consuming it miscategorises the same thing, at the same moment, and the diversity that customers believe they bought by choosing different vendors is not there. That is the same argument this timeline makes about shared platforms and trusted update channels, arriving from a direction most people do not look.",
    ],
    externalUrl: "https://www.brightcloud.com/",
    externalLabel: "BrightCloud",
    sources: [
      { label: "TechCrunch, 7 July 2010: the acquisition announced, terms undisclosed; BrightCloud founded 2005 in San Diego; founder and chief executive Quinn Curtis previously director of product management at Websense and before that almost nine years at Microsoft on the team that built and launched the first version of Exchange", url: "https://techcrunch.com/2010/07/07/webroot-brightcloud/" },
      { label: "Dark Reading: BrightCloud maintaining information on more than 200 million URLs and IP addresses, and the technology being used by partners to add a layer of security and policy management for their own customers", url: "https://www.darkreading.com/cyber-risk/webroot-acquires-brightcloud" },
      { label: "SecurityWeek: the BrightCloud team joining Webroot's cloud engineering group with an expanded focus on hosted security services", url: "https://www.securityweek.com/webroot-acquires-web-site-classification-and-reputation-services-provider-brightcloud/" },
      { label: "Carbonite SEC filings (2019): Webroot founded 1997 with executive offices in Broomfield, Colorado; approximately $215M of revenue in the financial year ended June 2018; more than 14,000 managed service provider partners and over 600 employees", url: "https://www.sec.gov/Archives/edgar/data/1340127/000134012719000019/finalcarboniteinvestorsl.htm" },
      { label: "Carbonite SEC filing (2019): the agreement under which OpenText would acquire Carbonite, with the threat intelligence business named among the reasons", url: "https://www.sec.gov/Archives/edgar/data/1340127/000119312519292403/d810668dex991.htm" },
      { label: "BrightCloud threat intelligence datasheet (OpenText): the service sold to other technology providers, and the 2019 OpenText acquisition", url: "https://www-cdn.webroot.com/7616/4554/8137/BrightCloud_Threat_Intelligence_Services_DS_AMER_EN.pdf", sourceNote: "Vendor marketing material. Used for the ownership fact and the fact that the service is licensed to other providers, not for its performance claims." },
    ],
  },
  {
    // WEBSENSE -> FORCEPOINT - added 2026-08-03 (PRIME). One entry, because it
    // is one company under four names and five owners.
    //
    // The "censorware" criticism is RECORDED rather than omitted: a filtering
    // product's failure mode is over-blocking, and a site that teaches web
    // security should say so plainly instead of describing only the mechanism.
    slug: "websense-forcepoint",
    group: "other",
    name: "Websense and Forcepoint",
    founded: 1994,
    tags: ["vendor"],
    tagline: "A reseller that became a filter, then a bubble IPO, then a defence contractor's cyber arm, then private equity again.",
    intro:
      "Phil Trubey founded NetPartners in Sorrento Valley, San Diego in 1994, reselling other people's network security products. What made the company was the thing it built rather than resold: software for controlling what employees could reach on the internet. It was renamed Websense in June 1999, and in March 2000 - the actual peak of the dot-com bubble - it raised $72M in an IPO whose share price doubled on the first day.",
    body: [
      "The founder was not there for it. In 1998, with $6M of venture funding raised and $6M of annual revenue, the investors removed Trubey from the chief executive's job and appointed John Carrington. The renaming, the IPO and everything after happened without the person who started it - which is common enough to be unremarkable in aggregate and worth naming in the particular.",
      "What the product actually did is worth stating precisely, because the mechanism explains the criticism. A category database classifies sites; a policy decides which categories a given user may reach; the enforcement point sits between the user and the web. That is the same architecture as the proxies elsewhere on this timeline, and it has the same unavoidable weakness: a classification is a judgement, made at scale, by people the affected user will never meet.",
      "So the product was called censorware, and the complaint was not baseless. Over-blocking caught sexual health information, political material and plenty of ordinary sites that fell on the wrong side of a category boundary. That is not a bug that gets fixed; it is the failure mode of the entire approach, and any honest account of web filtering has to say so. The defence is that an employer restricting its own network is a different question from a state restricting a population - but the same product served both, and it usually does.",
      "The company grew by buying capability: PortAuthority in 2006 for data fingerprinting, SurfControl in 2007 for email security, Defensio in 2009 for social spam. By 2011 Facebook was using it to scan every link posted on the platform, which is a striking measure of how far a corporate filtering product had travelled from the corporate network.",
      "Then the ownership carousel, which is the other half of the story. Vista Equity Partners took it private in 2013 for $906M at $24.75 a share, and moved it from San Diego to Austin. In April 2015 Raytheon - a defence contractor - bought 80% for $1.9B net of cash, contributing its own Raytheon Cyber Products valued around $400M and creating a joint venture worth roughly $2.3B, with Vista keeping the rest. That October it bought Stonesoft and Sidewinder from Intel for $389M, Stonesoft having been McAfee's next-generation firewall. On 14 January 2016 the whole thing was renamed Forcepoint. Raytheon took the remaining 20% in 2019, and in January 2021 sold the company to Francisco Partners.",
      "Four names, five owners, thirty years. NetPartners, Websense, Raytheon|Websense, Forcepoint. What the defence-contractor period bought was not technology so much as clearance: government work needs a supplier who can hold it, and a commercial filtering company could not. The product went where the ownership could take it, which is a more honest description of most security-industry consolidation than the strategy language used at the time.",
    ],
    acquisitions: [
      { year: 2006, name: "PortAuthority Technologies", what: "Data fingerprinting - identifying sensitive content by its shape rather than by rule.", became: "The beginning of the data-loss prevention line that eventually mattered more than the filtering." },
      { year: 2007, name: "SurfControl", what: "A web and email filtering competitor.", became: "Consolidation of the filtering market into fewer hands." },
      { year: 2015, name: "Stonesoft and Sidewinder", price: "$389M", what: "Bought from Intel. Stonesoft had been sold as McAfee Next-Generation Firewall.", became: "Forcepoint's firewall line - and another piece of McAfee's estate changing hands, which this timeline records repeatedly." },
      { year: 2015, name: "Foreground Security", price: "$62M", what: "Security operations and managed detection.", became: "Services capability alongside the products." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Forcepoint",
    externalLabel: "Forcepoint",
    sources: [
      { label: "Wikipedia: founded 1994 as NetPartners in Sorrento Valley, San Diego by Phil Trubey; a reseller before building employee internet-use software; $6M of venture funding and $6M revenue in 1998, when investors replaced Trubey with John Carrington; renamed Websense June 1999; $72M IPO March 2000 with the price doubling on the first day; the ownership chain through Vista, Raytheon and Francisco Partners", url: "https://en.wikipedia.org/wiki/Forcepoint" },
      { label: "HandWiki: Vista's $906M acquisition in 2013 and the move to Austin in 2014; Raytheon's 80% purchase for ~$1.9B forming Raytheon|Websense; Foreground Security for $62M and Stonesoft with Sidewinder for $389M in October 2015; the 2016 rename", url: "https://handwiki.org/wiki/Company:Forcepoint" },
      { label: "Grokipedia: the deal closing May 2015 at roughly $2.3B enterprise value with Vista retaining 20%; the rebrand to Forcepoint on 14 January 2016; Francisco Partners ownership from 2021", url: "https://grokipedia.com/page/Forcepoint" },
      { label: "SafeLogic: Raytheon's $1.9B net of cash, of which $600M was an intercompany loan to the joint venture, plus Raytheon Cyber Products assets valued at $400M", url: "https://www.safelogic.com/our-customers/forcepoint" },
      { label: "Definitions.net summary of the Wikipedia article: the classification-engine and category mechanism, and the censorware criticism - blocking innocent sites and protected speech, whether deliberately as censorship or accidentally through over-reaching categories", url: "https://www.definitions.net/definition/Websense", sourceNote: "A mirror of encyclopedic text rather than a primary source. Used for the criticism as it is commonly stated; the substance is corroborated by the product's own documented category mechanism." },
      { label: "Forcepoint history summary: PortAuthority in 2006, SurfControl in 2007, Defensio in 2009, and Facebook using the product from 2011 to examine links posted on the platform", url: "https://www.yourtechstory.com/2022/09/06/forcepoint-a-leading-provider-of-cybersecurity-services/" },
    ],
  },
  {
    // USROBOTICS - added 2026-08-02 (PRIME). He owned the Sportster line
    // through every speed step and was given Couriers by a client, which is
    // exactly the segmentation this entry is about.
    //
    // Pairs with the `first-modem` milestone: that entry explains what a modem
    // is FOR, this one explains what happened when everybody wanted one.
    slug: "usrobotics",
    official: {
      defunct: true,
    },
    group: "other",
    name: "USRobotics",
    founded: 1976,
    tags: ["vendor"],
    tagline: "Won three times with proprietary protocols, and gave up all three the moment a standard arrived.",
    intro:
      "Casey Cowell and four partners founded U.S. Robotics in a garage in Skokie, Illinois in 1976, naming it after the fictional company in Asimov's robot stories. The first modem shipped in 1979, and the business only opened to the general public after the AT&T breakup in 1984 made it legal for anyone to attach equipment to the telephone network.",
    body: [
      "The two product lines are the story, and the relationship between them is better than either. The Courier was built for bulletin board operators and businesses: rugged, remote-diagnosable, and using an upgradeable digital signal processor, so a Courier bought in 1994 as V.34 Ready shipped speaking V.FC because V.34 had not been finished yet, and was upgraded in the field when it was. That is why the line was eventually called V.Everything. The Sportster, launched in 1991, was the consumer line, and by the mid-1990s a 28.8 model sold for around $149.",
      "They shared a motherboard. On certain 14.4 Sportsters, a sequence of AT commands would enable the faster 16.8 HST mode the Couriers were sold for. The hardware was the same; the difference between the consumer modem and the professional one was firmware and price. Segmentation by software rather than silicon is now so normal it has a name, and this is one of the places it was learned.",
      "The company's actual pattern is proprietary-then-standard, three times over. HST was USR's own high-speed protocol, and it worked: if the board you dialled had a Courier, transfers ran faster than anyone else could manage, which is why HST spread through the bulletin board world and made FidoNet mail runs bearable. Then V.32bis arrived and HST stopped mattering. Years later the same play ran again with x2 against a rival consortium's K56flex, and neither won, because everybody could see V.90 coming. USR dropped x2 when it arrived.",
      "That is worth stating plainly, because it cuts against a thread this site returns to often. Elsewhere the timeline records neutrality and openness paying off - carrier-neutral exchanges, vendor-neutral certification, protocols that stayed open and became infrastructure. USRobotics did the opposite and it worked repeatedly: a proprietary protocol bought real advantage for real years. What it did not buy was permanence. Every time a standard arrived, the advantage evaporated, and the company was sensible enough to stop defending it.",
      "Scale followed the Sportster. Revenue was $889M in 1995 and $1.98B in the year to September 1996, a 122 per cent increase. The company bought Palm in 1995, acquiring the PalmPilot, and was itself acquired by 3Com in June 1997. It was later spun back out, moved to Schaumburg, Illinois, and now belongs to UNICOM Global.",
      "One detail from the operators' side deserves recording: the first large-scale Courier deployment on CompuServe's network uncovered a bug that crashed the modems and stopped them answering calls under heavy call volume. The most reliable modem on the market found its limit the way everything does - at a scale nobody had tested.",
    ],
    acquisitions: [
      { year: 1995, name: "Palm, Inc.", what: "The company behind the PalmPilot handheld.", became: "Part of USRobotics, then of 3Com, and later independent again - a corporate path more eventful than the product's." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/USRobotics",
    externalLabel: "USRobotics",
    sources: [
      { label: "Wikipedia: HST making FidoNet transfers faster; the Sportster line in the 1990s; the V.Everything line released 1996; the shared motherboard and the AT command sequence enabling 16.8 HST on certain 14.4 Sportsters; the CompuServe deployment bug under high call volume; x2 against K56flex and the switch to V.90", url: "https://en.wikipedia.org/wiki/USRobotics" },
      { label: "Grokipedia: founded 1976 in a garage in Skokie, Illinois by Casey Cowell and four partners; the name taken from Asimov's U.S. Robots and Mechanical Men; first modem in 1979; the Courier's rugged design and remote diagnostics; the Sportster launched 1991 with a low-cost DSP, around $149 for 28.8 by the mid-1990s", url: "https://grokipedia.com/page/USRobotics" },
      { label: "HandWiki: the Courier V.Everything shipping in 1994 as V.34 Ready with only V.FC support because V.34 had not been released, and the upgradeable DSP design that allowed it to be brought up to standard later", url: "https://handwiki.org/wiki/Company:USRobotics" },
      { label: "Encyclopedia.com: revenue of $1.98B for the fiscal year ended September 1996, up 122% on $889M in 1995; the Courier, Megahertz, Sportster, Total Control and PalmPilot product lines; 3Com attributing $2.5B of its FY1997 sales to USR", url: "https://www.encyclopedia.com/economics/economics-magazines/us-robotics" },
      { label: "Medium (Richard Baguley): founded 1976, first modem 1979, and modems sold to the public following the 1984 AT&T breakup; HST reaching 16.8 kbps against slower competitors", url: "https://medium.com/people-gadgets/the-gadget-we-miss-the-us-robotics-courier-modem-3d43eac5f1de", sourceNote: "A retrospective feature rather than a reference work. Used for the founding and first-product dates, both corroborated elsewhere here." },
    ],
  },
  {
    // RED EDUCATION - added 2026-08-02 (PRIME: "Add Red Education to the
    // timeline").
    //
    // *** WRITTEN AS A COMPANY HISTORY, NOT AS AUTOBIOGRAPHY. *** PRIME works
    // here, and §9.4 permits naming Red Education in ordinary public copy - but
    // the entry earns its place because the company is a genuine instance of a
    // pattern this timeline already documents, not because of who works there.
    // No statement is made here about which vendors any individual is
    // authorised to teach; that lives in `relationships` and nowhere else.
    slug: "red-education",
    official: {
      url: "https://www.rededucation.com",
    },
    group: "other",
    name: "Red Education",
    founded: 2005,
    relationships: ["works-inside"],
    tags: ["training", "services"],
    tagline: "Training is distributed the same way products are, and this is what that looks like.",
    intro:
      "Daniel Storey was working at F5 Networks when they offered him a training role. He took it, spent a period delivering technical training across Asia Pacific, and concluded there was a business in doing it properly. Red Education was founded in Sydney in 2005. By its own account F5 was its first vendor and, at the start, its only one. Twenty years later it delivers vendor-accredited training across Asia Pacific, the Americas, Europe, India and the Middle East, and reports having passed 100,000 training seats.",
    body: [
      "The structural point is the one worth taking, and this timeline has been circling it for weeks. A vendor does not want to run a training operation in every country it sells into. Certifying instructors, maintaining lab equipment, scheduling classes in the right timezone and language, and doing it at a quality that reflects on the brand is a business in itself - and it is not the business of building the product. So vendors authorise partners to do it, on much the same logic that leads them to authorise distributors to hold stock and extend credit.",
      "Training is distributed. Once you see that, the shape of the industry makes more sense: an authorised training company is to a vendor's courseware roughly what a distributor is to its hardware, and the vendors it carries appear on its line card in the same way.",
      "The early years are described by the founder as a few boxes of hardware and a heavy flight schedule - the classrooms travelled on planes with the instructor. Growth came as more vendors decided they wanted a partner they could trust to represent them, which is the same trust problem a distributor solves and the same answer.",
      "The instructor sourcing is the detail that determines whether any of this works. The company describes its trainers as seasoned practitioners, many of them former vendor or large-customer technical staff. That is not incidental: a course taught by someone who has only ever taught it is a different course from one taught by someone who has run the product in production and been called at three in the morning when it failed. The second kind can answer the question that is not in the material.",
      "The vendor list has grown well beyond F5 - Palo Alto Networks, Cisco, Check Point, Fortinet, Nutanix, AWS, Arista, Red Hat, VMware, AlgoSec, Paessler, EPI and others - and the company has collected the kind of recognition that follows: Check Point named it Authorised Training Company of the Year at CPX 2024 in Bangkok and a Platinum Elite ATC partner, and in 2025 the partnership took a Gold Stevie Award for Global Partnership of the Year.",
      "Read beside the other training entries here, it completes a set. CompTIA is certification owned by nobody, defining what competence means across vendors. EPI is a specialist body for one domain. The market-reserve entry shows a whole country's engineering workforce being trained inside protected manufacturers. And this is the fourth model: independent delivery of somebody else's curriculum, under their authorisation - which is how most vendor training in most countries actually reaches the person sitting in the room.",
    ],
    externalUrl: "https://www.rededucation.com/",
    externalLabel: "Red Education",
    sources: [
      { label: "Red Education's own twentieth-anniversary interview with founder Daniel Storey: working at F5 Networks when offered a training role, delivering across Asia Pacific, F5 as the first and only vendor at the start, the early years of boxes of hardware and flight schedules, and growth as more vendors sought a partner to represent them", url: "https://www.rededucation.com/red-education-is-20-daniel-storey-reflects-on-two-decades-of-building-a-global-business/" },
      { label: "Red Education: vendor-accredited training delivered in classrooms, virtually or on site; over 100,000 training seats since 2005; regions across the Americas, Australasia, SAARC, ASEAN and EMEA", url: "https://www.rededucation.com/" },
      { label: "Red Education about page: trainers described as seasoned IT professionals, many former vendor and large-customer technical staff, certified to high levels; lab equipment and materials provided", url: "https://www.rededucation.com/about-us/" },
      { label: "CB Insights: founded 2005, headquartered in Sydney, New South Wales; the 2025 Gold Stevie Award for Global Partnership of the Year with Check Point, and a second Gold Stevie for achievement in certification programs", url: "https://www.cbinsights.com/company/red-education/" },
      { label: "Red Education on LinkedIn: the vendor list including Palo Alto Networks, F5, Check Point, Nutanix, AWS, AlgoSec, EPI, Paessler, Arista, Fortinet, VMware, Red Hat, ForgeRock and Cisco; Check Point naming it Authorised Training Company of the Year at CPX 2024 in Bangkok", url: "https://au.linkedin.com/company/red-education" },
      { label: "M&T Resources (2021) and Crunchbase: earlier seat figures of 75,000 and 85,000, which together with the current 100,000+ give the trajectory rather than a single snapshot", url: "https://www.crunchbase.com/organization/red-education", sourceNote: "Three seat figures from three dates are cited deliberately: a single number would read as a claim, while the sequence shows growth and dates itself." },
    ],
  },
  {
    // IXIA + KEYSIGHT - added 2026-08-02 (PRIME: "Ixia and Keysight deserve a
    // card"). Replaces the dissolved fireeye-mcafee-ixia entry, whose own
    // tagline conceded the problem: three companies that shared a distribution
    // portfolio and almost nothing else.
    //
    // The lineage is why it deserves a card: Keysight IS Hewlett-Packard's
    // original test and measurement business, spun out twice.
    slug: "ixia-keysight",
    relationships: ["worked-with-directly"],
    // The distribution-years chapter covers Ixia among others; it
    // lost its original home when the combined entry was dissolved, and both
    // surviving lineages point at it so neither reader path misses it.
    // PER-VENDOR SPANS, established by PRIME across two messages on 2026-08-05:
    //   FireEye        2015 - 2018   (the Westcon-Comstor half)
    //   McAfee, Ixia   2018 - 2019   (the ScanSource half)
    //
    // The chapter therefore spans 2015 - 2019, which is what it said before -
    // but for a reason that was not written down. It is now.
    careerChapter: { slug: "fireeye-mcafee-ixia", years: "2015 - 2019" },
    group: "other",
    name: "Ixia and Keysight",
    founded: 1997,
    tags: ["vendor"],
    tagline: "Network test, bought by the part of Hewlett-Packard that Hewlett and Packard actually started.",
    intro:
      "Ixia was founded on 1 January 1997 in Calabasas, California, to test IP networks: generate traffic at line rate, break things deliberately, and measure what happened. When Keysight completed its acquisition in April 2017 for about $1.6B, Ixia served the top fifteen network equipment manufacturers, forty-seven of the top fifty carriers and seventy-seven of the Fortune 100, with more than 400 patents issued and pending.",
    body: [
      "The category is worth explaining, because most engineers never buy from it and everything they do buy passed through it. Before a switch, firewall or load balancer ships, somebody establishes what it actually does at line rate, under attack, with malformed input, and at the exact point it falls over. Datasheets quote numbers; test equipment is where those numbers come from, and where a competitor checks them.",
      "Ixia grew by acquisition, and the direction is the interesting part: Anue Systems in June 2012, BreakingPoint Systems that August, Net Optics in October 2013. Anue and Net Optics were visibility and tap aggregation; BreakingPoint was security testing. It moved from testing networks in a lab to seeing inside them in production - the same instrument that proves a device works becoming the instrument that watches it working.",
      "Then the acquirer, which is where the lineage repays attention. Keysight was spun out of Agilent in 2014. Agilent had been spun out of Hewlett-Packard in 1999, in an IPO that raised $2.1B and was the largest in Silicon Valley history at the time. Keysight is HP's original test and measurement business - the line of work that began with the 200A audio oscillator Bill Hewlett and Dave Packard built in a garage in 1939, which was the company's first product.",
      "So the oldest thing HP ever did was spun off twice and now trades under its own name, while the businesses that kept the letters make printers, PCs and enterprise infrastructure. The part everyone remembers from the garage story is the part that left.",
      "The deal closed on 18 April 2017 at $19.65 a share in cash, Keysight's largest since becoming independent - bigger than Anite at $606M in 2015. Ixia became the Ixia Solutions Group. Its chief executive at the time, Bethany Mayer, had come from HP, which makes it a smaller reunion than it appears.",
      ],
    acquisitions: [
      { year: 2012, name: "Anue Systems", price: "~$145-155M", what: "Network visibility software and tap aggregation, founded by Kevin Przybocki, Hemi Thaker and Chip Webb.", became: "Ixia's move from lab testing into production visibility.", sourceNote: "Reported at $145M at announcement and around $155M afterwards; both figures circulate." },
      { year: 2012, name: "BreakingPoint Systems", price: "~$160M", what: "Network security testing - generating realistic attack traffic against devices under test.", became: "The security half of the test portfolio." },
      { year: 2013, name: "Net Optics", price: "~$190M", what: "Network taps and monitoring access.", became: "Completed the visibility line Keysight later cited as a reason for buying the company." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Ixia_(company)",
    externalLabel: "Ixia",
    sources: [
      { label: "Keysight SEC Form 8-K, 18 April 2017: acquisition completed at approximately $1.6B, $19.65 per share in cash; Ixia serving the top 15 network equipment manufacturers, 47 of the top 50 carriers and 77 of the Fortune 100; over 400 patents and more than 1,800 staff; reported as the Ixia Solutions Group", url: "https://www.sec.gov/Archives/edgar/data/0001601046/000090342317000272/keysight8kex991_0417.htm" },
      { label: "Keysight Form 10-Q: merger agreement entered 30 January 2017, all-cash and approximately $1.6B net of cash acquired", url: "https://www.sec.gov/Archives/edgar/data/0001601046/000160104617000009/keys-01312017x10q.htm" },
      { label: "Wikipedia: Ixia founded 1 January 1997 in Calabasas, traded as Nasdaq XXIA, revenue $464M in 2014; the Anue, BreakingPoint and Net Optics acquisitions with dates", url: "https://en.wikipedia.org/wiki/Ixia_(company)" },
      { label: "Keysight's own history: the business dating to Hewlett and Packard's 1939 garage and the 200A audio oscillator; Agilent spun off from HP in 1999 with a $2.1B IPO, the largest in Silicon Valley history at the time; Keysight spun off from Agilent in 2014", url: "https://www.keysight.com/us/en/about/keysight-technologies-history.html/1000" },
      { label: "RCR Wireless: Keysight as HP's original test and measurement business; Ixia the largest acquisition since independence, after Anite at $606M in 2015; Bethany Mayer having come to Ixia from HP", url: "https://www.rcrwireless.com/20170612/telecom-software/20170609softwarekeysight-ixia-tag6" },
      { label: "TheStreet: Net Optics at $190M in 2013, Anue at $155M and BreakingPoint at $160M in 2012", url: "https://www.thestreet.com/technology/keysight-technologies-to-grab-ixia-for-1-6-billion-13971115" },
    ],
  },
  {
    // ARROW ELECTRONICS - added 2026-08-02 (PRIME). Completes the distributor
    // set on this timeline.
    //
    // *** THE 1980 FIRE IS HANDLED PLAINLY, NOT DRAMATICALLY. *** Thirteen
    // people died. The facts are corroborated across seven independent sources
    // and they are stated once, in order, without adjectives doing work the
    // facts already do. Lynn Glenn's remark to the staff is PARAPHRASED rather
    // than quoted - it runs past this site's quotation limit, and paraphrase
    // also avoids turning a widow's sentence into a pull quote.
    slug: "arrow-electronics",
    official: {
      url: "https://www.arrow.com",
    },
    group: "other",
    name: "Arrow Electronics",
    founded: 1935,
    tags: ["distributor"],
    tagline: "Started on Radio Row selling used radios; lost thirteen of its leaders in one afternoon and rebuilt.",
    intro:
      "Arrow Radio opened in 1935 on Cortlandt Street, in the part of lower Manhattan known as Radio Row, selling second-hand radios and parts. Its founder was Maurice Goldberg. Two of his neighbours on that street were Charles Avnet and Seymour Schweber, and all three names ended up on distribution businesses - which is why Radio Row has a reasonable claim to being where electronics distribution started.",
    body: [
      "The company as it exists dates from 1968, when three recent Harvard Business School graduates working at a New York investment bank - B. Duke Glenn Jr., Roger E. Green and John C. Waddell - led an investor group that bought control for about $1M of borrowed money. They also bought a business that reclaimed lead from old car batteries, which tells you something about the state of the opportunity as they found it.",
      "They were right about electronic parts distribution. By 1979 Arrow had acquired Cramer Electronics, then the second largest distributor of electronic parts in the United States at around $150M of annual sales, and was a serious national business.",
      "On 4 December 1980 the senior management team gathered at a hotel conference centre in Harrison, New York for the annual budget meetings. A fire in the building killed thirteen of them. The dead included Glenn, by then chairman, Green, then an executive vice-president, and every department head of the electronics distribution division. Waddell survived because he was not there: he had stayed at headquarters to field questions about a two-for-one stock split announced earlier that day.",
      "The day after the fire, Lynn Glenn - the chief executive's widow - came to the company's headquarters and spoke to the staff. She told them she did not know their faces but would know their names, because her husband had talked about them.",
      "Waddell took over a company that had lost most of the people who knew how it worked. He recruited Stephen Kaufman from McKinsey in 1982; Kaufman became chief executive in 1986 and chairman in 1994, and led the consolidation of American electronics distribution and the expansion into Europe and Asia. Arrow recovered within about three years, and the episode produced changes in succession planning that a company only makes after it has needed them.",
      "The 1988 acquisition of Kierulff Electronics shows the method: Arrow closed all four of Kierulff's warehouses, and the combined business went from a $16M loss in 1987 to $10M of operating profit within a year. That is distribution economics in one sentence - the value is in the network and the working capital, not in the buildings.",
      "Read beside the other distributors here, Arrow is the oldest and the one whose history is least about strategy. Ingram Micro was founded by teachers, ScanSource by a thesis about transitional products, Westcon by acquisition and Network1 by being bought. Arrow's defining moment was an afternoon nobody planned for, and what it demonstrates is something no strategy document covers: that an organisation is not only its people, because this one lost thirteen of the most senior at once and still existed three years later - and also that it is nothing but its people, because rebuilding took three years and a stranger from a consulting firm.",
    ],
    acquisitions: [
      { year: 1979, name: "Cramer Electronics", what: "Then the second largest distributor of electronic parts in the United States, at around $150M of annual sales, strong on the west coast.", became: "Arrow's first major industry acquisition and its route into western US markets." },
      { year: 1988, name: "Kierulff Electronics", what: "A competitor acquired as part of an explicit growth-by-consolidation strategy under Stephen Kaufman.", became: "Absorbed - all four Kierulff warehouses were closed, and the combined business swung from a $16M loss in 1987 to $10M of operating profit within a year." },
    ],
    externalUrl: "https://www.arrow.com/company/overview/history",
    externalLabel: "Arrow Electronics history",
    sources: [
      { label: "Arrow Electronics' own history: founded 1935 as Arrow Radio on Cortlandt Street in Radio Row by Maurice Goldberg; Charles Avnet and Seymour Schweber as neighbouring pioneers; the 1968 purchase by Glenn, Green and Waddell; the 1980 fire; Kaufman's recruitment in 1982 and succession in 1986 and 1994", url: "https://www.arrow.com/company/overview/history" },
      { label: "FundingUniverse: the $1M of borrowed capital and the lead-reclamation business bought alongside; the December 1980 fire at Harrison during the annual budget meetings, killing thirteen including all the electronics distribution department heads; Waddell surviving because he had stayed at headquarters over the two-for-one stock split; Lynn Glenn addressing employees the following day", url: "https://www.fundinguniverse.com/company-histories/arrow-electronics-inc-history/" },
      { label: "Wikipedia: the fire dated 4 December 1980 at Stouffer's Inn; the 1979 Cramer Electronics acquisition as the first major one; the 1988 Kierulff acquisition", url: "https://en.wikipedia.org/wiki/Arrow_Electronics" },
      { label: "HandWiki: Forbes' account of the Kierulff integration - all four warehouses closed, and a swing from a $16M loss in 1987 to $10M of operating profit within a year", url: "https://handwiki.org/wiki/Company:Arrow_Electronics" },
      { label: "Encyclopedia.com and Company Histories: independent accounts of the same sequence, corroborating the thirteen deaths, the roles of those killed, and Waddell's absence", url: "https://www.encyclopedia.com/social-sciences-and-law/economics-business-and-labor/businesses-and-occupations/arrow-electronics-inc" },
      { label: "Reference.org: headquarters in Centennial, Colorado, and a 2025 Fortune 500 ranking of 154", url: "https://reference.org/facts/Arrow_Electronics/cEjuRaYk" },
    ],
  },
  {
    // TECH DATA + SYNNEX = TD SYNNEX - added 2026-08-02 (PRIME).
    //
    // Written as ONE entry because they are one company now, the same way the
    // Lumen chain is written. PRIME's queue listed Tech Data, SYNNEX and
    // TD SYNNEX separately; they merged in 2021 and separate entries would
    // imply three companies where there is one lineage.
    //
    // *** THIS CLOSES THE DISTRIBUTOR LOOP ON THIS TIMELINE: *** SYNNEX bought
    // Westcon-Comstor's Americas business in 2017, then merged with Tech Data
    // in 2021 - so the Westcon Americas operation ended up inside TD SYNNEX,
    // and ScanSource competes with the result.
    slug: "tech-data-synnex",
    group: "other",
    name: "Tech Data and SYNNEX (now TD SYNNEX)",
    founded: 1974,
    // Independent training contractor delivering Extreme courses through TD SYNNEX
    // Brasil, 2021-2023. `worked-with-directly` rather than `worked-inside`: a
    // contractor is not an employee, and the career filter reads BOTH, so the entry
    // appears under "My chapters" without the entry claiming employment.
    relationships: ["worked-with-directly"],
    tags: ["distributor"],
    tagline: "A father sold it to his son for ten thousand dollars; it is now the largest technology distributor in the world.",
    intro:
      "Edward C. Raymund incorporated Tech Data in Clearwater, Florida on 19 November 1974, selling tapes and disks - data processing supplies for mini and mainframe computers. Around 1984 he sold the business to his son Steven for $10,000. That company merged with SYNNEX in 2021 to create TD SYNNEX, which reported $58.5B of revenue for its 2024 financial year.",
    body: [
      "The ten thousand dollars is not a rounding error in a larger deal - it is the whole transaction, and it is the sort of detail that gets lost when a company becomes large enough for its history to be written by its communications department. Steven Raymund then did the thing that mattered: from 1983 he turned a reseller of mainframe supplies into a full-line national distributor of personal computer products, which is a different business wearing the same name. He became chief executive in 1986, the year the company listed on NASDAQ.",
      "SYNNEX is the other half and started somewhere unrecognisable. Robert T. Huang founded it in Fremont, California in 1980 as Compac Microelectronics, doing contract assembly and sourcing components from Asia. MiTAC International took majority control in 1992, and the company listed on the New York Stock Exchange in 2003 with Huang still its largest individual shareholder. It spent the intervening decades acquiring: game distribution, business process outsourcing, and in 2013 IBM's worldwide customer care operation - which it eventually spun out as Concentrix in 2020.",
      "Then the two came together, and the sequence matters. Apollo Global Management took Tech Data private in 2020 for about $6B. The following year Apollo merged it with SYNNEX in a transaction valued around $7.2B, completing on 1 September 2021. Former SYNNEX shareholders held 55% of the result and Apollo 45%, and Apollo has since exited in stages. The combined company trades in Fremont and Clearwater both, which is what happens when two headquarters merge and neither loses.",
      "And here the distributor entries on this timeline close a circle. SYNNEX bought Westcon-Comstor's Americas business in 2017 for $600M. Four years later SYNNEX merged with Tech Data. So the Westcon Americas operation - the one that had been Datatec's, in the same group as Logicalis - now sits inside TD SYNNEX, alongside what used to be Tech Data. Four of the distributors written up here are connected by ownership, and the fifth, ScanSource, competes with the result while having assembled its own Latin American business the same way.",
      "The scale is worth stating because it is the argument for broadline distribution. TD SYNNEX turns over more than Ingram Micro. Neither is a technology company in any useful sense: they are logistics and credit businesses that happen to move technology, holding inventory on their own balance sheets so that a reseller does not have to. That is unglamorous, capital-intensive and almost invisible from inside an engineering team - and nothing an engineer buys arrives without passing through one of them.",
    ],
    acquisitions: [
      { year: 2017, name: "Westcon-Comstor Americas (by SYNNEX)", price: "$600M cash, plus $30M for 10% of the international business", what: "The North and Latin American distribution business of Westcon-Comstor, then owned by Datatec.", became: "Part of SYNNEX, and therefore part of TD SYNNEX after 2021 - which is how a Datatec business ended up inside the largest technology distributor in the world." },
      { year: 2020, name: "Tech Data (by Apollo Global Management)", price: "~$6B", what: "The take-private that set up the merger. Founder-family stakes were largely cashed out.", became: "Apollo-owned, then 45% of TD SYNNEX a year later." },
      { year: 2021, name: "The merger itself", price: "~$7.2B", what: "Tech Data and SYNNEX combined, completing 1 September 2021.", became: "TD SYNNEX - over 100 countries, and revenue larger than any other technology distributor.", sourceNote: "Combined revenue is reported variously around $57-60B depending on the period counted; the 2024 financial-year figure of $58.5B is the one used above." },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Tech_Data",
    externalLabel: "Tech Data",
    sources: [
      { label: "Wikipedia: Tech Data founded in Clearwater by Edward C. Raymund in November 1974 marketing data processing supplies for mini and mainframe computers; the 1983 transition to full-line PC distribution led by Steven A. Raymund; Steven succeeding as chief executive in 1986, the year of the NASDAQ listing", url: "https://en.wikipedia.org/wiki/Tech_Data" },
      { label: "Grokipedia: incorporation on 19 November 1974; Edward Raymund selling the business to his son Steven for $10,000 around 1984; at merger, operations in more than 100 countries, around 15,000 employees and revenue exceeding $30B", url: "https://grokipedia.com/page/Tech_Data" },
      { label: "MatrixBCG: SYNNEX founded 1980 in Fremont as Compac Microelectronics by Robert T. Huang with backing from MiTAC's Matthew Miau; Apollo's 2020 acquisition of Tech Data at $6B; the 2021 merger at $7.2B", url: "https://matrixbcg.com/blogs/brief-history/tdsynnex" },
      { label: "Pestel-analysis: MiTAC International taking majority control of SYNNEX in 1992; the 2003 NYSE listing; post-merger ownership of 55% former SYNNEX shareholders and 45% Apollo; $58.5B revenue for financial year 2024", url: "https://pestel-analysis.com/blogs/owners/tdsynnex" },
      { label: "PortersFiveForce: the merger completing 1 September 2021; Huang as largest individual shareholder at the 2003 IPO; the 2020 Concentrix spin-off; Apollo's staged exits", url: "https://portersfiveforce.com/blogs/owners/tdsynnex", sourceNote: "Secondary analysis. Used for dates and ownership percentages that are corroborated by the other sources here, not for interpretation." },
      { label: "BusinessABC: TD SYNNEX across more than 100 countries with 22,000 staff, and SYNNEX's earlier acquisitions including Jack of All Games in 2009 and IBM's worldwide customer care business process outsourcing in 2013", url: "https://businessabc.net/wiki/td-synnex" },
    ],
  },
  {
    // INGRAM MICRO - added 2026-08-02 (PRIME). The BROADLINE distributor that
    // ScanSource's entry defines itself against, which makes that contrast
    // readable rather than asserted.
    //
    // And a THIRD teaching origin on this timeline: founded by two
    // schoolteachers, after Stefanini (a teacher whose training business became
    // the company) and NIIT inside the HCL entry (training built as
    // infrastructure for an industry).
    slug: "ingram-micro",
    official: {
      url: "https://www.ingrammicro.com",
    },
    group: "other",
    name: "Ingram Micro",
    founded: 1979,
    tags: ["distributor"],
    tagline: "Two schoolteachers started it, and it now moves fifty billion dollars of other people's products a year.",
    intro:
      "Micro D, Inc. was founded in July 1979 in Southern California by Geza Czige and Lorraine Mecca, a husband and wife who were both schoolteachers. Their own company's history says they brought an academic approach to logistics. First-year sales were around $3.5M; by 1988 they were $553M, and the business that grew out of it reported $52.6B of revenue in 2025.",
    body: [
      "The teaching origin is the third on this timeline and worth noting as a pattern rather than a coincidence. Stefanini was founded by a man already giving classes, whose training business became a technology company. HCL's founder started a training institute in 1982 because a domestic industry cannot grow faster than the supply of people who can staff it. And the largest technology distributor in the world was started by two teachers. Distribution and instruction turn out to share a discipline: both are about getting something complicated from the people who made it to the people who need it, in a form they can use.",
      "The company as it exists is a merger of two competitors, and the logic is the instructive part. In 1982 Ronald Schreiber, Irwin Schreiber, Gerald Lippes and Paul Willax founded Software Distribution Services in Buffalo, New York. Ingram Industries bought it in 1985, renamed it Ingram Software and then Ingram Computer. Ingram had also been buying Micro D - a majority in February 1986, the rest in March 1989 at $14.75 a share, about $44M for the remaining 41 per cent - and then merged the two.",
      "They fitted because they sold to different people: Micro D specialised in the large retail computer chains, while Ingram served value-added resellers and smaller retailers. The combination became Ingram Micro D, the microcomputer industry's first billion-dollar wholesale distributor, headquartered in Santa Ana with the East Coast operation kept in Buffalo. The D was dropped in January 1991, and the company listed on the New York Stock Exchange in 1996.",
      "Set against ScanSource, this is the other kind of distributor and the contrast is the point. ScanSource's founding thesis was to catch products on their way to commodity - specialist, deep in a few categories, arriving before the broadline houses turned up to sell on price. Ingram Micro *is* the broadline house. Its business is described in its own filings as inventory-intensive and capital-intensive rather than asset-light: it buys hardware, software and cloud services and holds them on its balance sheet. The specialist sells expertise; the broadline distributor sells scale, and the two are not competing for the same thing until a category has finished transitioning.",
      "The ownership since has been eventful. China's HNA Group took it private in 2016 for around $6B. Platinum Equity bought it from HNA affiliates for approximately $7.2B, closing on 2 July 2021, with up to $325M more contingent on adjusted EBITDA through 2023 - a payment earned in full and made in April 2022. It returned to the New York Stock Exchange in 2024.",
      "One footnote with a long reach: Ingram Industries, the family business that assembled all this, traces to the 1830s and made its money in lumber and shipping before moving through petroleum refining, river barges and book distribution. Computer products were a 1980s diversification for a company that had been moving other people's goods for a century and a half - which is a reasonable description of what distribution is.",
    ],
    acquisitions: [
      { year: 1985, name: "Software Distribution Services", what: "Founded in Buffalo, New York in 1982 by Ronald Schreiber, Irwin Schreiber, Gerald Lippes and Paul Willax. Bought by Ingram Distribution Group in the spring of 1985.", became: "Ingram Software, then Ingram Computer in February 1988, then half of Ingram Micro D." },
      { year: 1989, name: "Micro D", price: "$14.75 a share for the remaining 41%, about $44M, after taking a majority in February 1986", what: "The Southern California distributor founded by Czige and Mecca in 1979, strong in the large retail computer chains.", became: "Merged with Ingram Computer to create Ingram Micro D - the microcomputer industry's first billion-dollar wholesale distributor.", founder: "Geza Czige and Lorraine Mecca, July 1979" },
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Ingram_Micro",
    externalLabel: "Ingram Micro",
    sources: [
      { label: "Ingram Micro investor relations, 40th anniversary release: Micro D founded July 1979 by Geza Czige and Lorraine Mecca, public in 1983; Software Distribution Services founded 1982 in Buffalo and acquired in spring 1985, renamed Ingram Software then Ingram Computer in February 1988", url: "https://ir.ingrammicro.com/press-releases/detail/87/ingram-micro-celebrates-40th-birthday" },
      { label: "HandWiki: both founders were teachers; the company started in Southern California with roughly $3.5M of first-year sales", url: "https://www.handwiki.org/wiki/Company:Ingram_Micro" },
      { label: "FundingUniverse: the March 1989 tender at $14.75 a share for the remaining 41% (about $44M); the complementary fit - Micro D in large retail chains, Ingram serving VARs and smaller retailers; the first billion-dollar wholesale distributor; Micro D's $553M of 1988 sales", url: "https://www.fundinguniverse.com/company-histories/ingram-micro-inc-history/" },
      { label: "Justapedia: Ingram Industries taking a majority in February 1986 and the remainder in March 1989; headquarters in Santa Ana with the Buffalo East Coast operation retained; the D dropped in January 1991; the 1996 NYSE listing", url: "https://justapedia.org/wiki/Ingram_Micro" },
      { label: "Ingram Micro SEC filing (Form DRS/A): Platinum Equity's acquisition from HNA affiliates for approximately $7.2B, closing 2 July 2021, with up to $325M contingent on adjusted EBITDA through 2023, earned in full and paid 11 April 2022", url: "https://www.sec.gov/Archives/edgar/data/1897762/000095012324006167/filename1.htm" },
      { label: "Orange County Business Journal: HNA Group taking the company private in 2016 for $6B; Ingram Industries' roots in the 1830s in lumber and shipping, later petroleum, barges and book distribution", url: "https://www.ocbj.com/technology/ingram-micro-set-for-return-to-wall-street/" },
      { label: "Wikipedia: 2025 revenue of $52.6B, 23,500 employees, Irvine headquarters, and the description of wholesale distribution as inventory- and capital-intensive rather than asset-light", url: "https://en.wikipedia.org/wiki/Ingram_Micro" },
    ],
  },
  {
    // NETWORK1 - added 2026-08-02 (PRIME: "Network1 lineage is worth adding").
    //
    // He was right, and the lineage is better than expected: ScanSource bought
    // Network1 THROUGH CDC BRASIL, the Brazilian distributor it had itself
    // bought in 2011. One acquisition was the vehicle for the next.
    //
    // *** CORRECTION, SAME SESSION: the first draft of this entry carried
    // `founded: 2003`, which I had invented - no source stated it. ScanSource's
    // own release says 2004. The date is now sourced. ***
    //
    // REVENUE DISCREPANCY RECORDED: 2014 net sales appear as ~R$720M
    // (~US$306M) on a US-GAAP-adjusted basis and as ~R$850M (~US$374M)
    // unadjusted. Both given, with the reason for the gap.
    slug: "network1",
    group: "other",
    name: "Network1",
    founded: 2004,
    relationships: ["worked-inside"],
    tags: ["distributor"],
    ended: {
      year: 2015,
      note: "Acquired by ScanSource - announced 15 August 2014 and completed in January 2015. Traded as Network1-ScanSource for years afterwards and became ScanSource's Latin American communications business.",
    },
    tagline: "Bought by the company its own buyer had bought four years earlier.",
    intro:
      "Network1 - legally Intersmart Comércio Importação Exportação de Equipamentos Eletrônicos - was founded in 2004 and headquartered in São Paulo. By 2014 it was one of Brazil's leading value-added distributors of communications equipment, with operations in Brazil, Mexico, Colombia, Chile and Peru, more than 60 vendors, 8,000 customers and close to 400 staff.",
    body: [
      "The line card is worth reading as a document in itself, because it is a snapshot of what a Latin American enterprise buyer could actually get in the mid-2010s: Avaya, Axis, Check Point, Dell, Extreme, F5, HP, Juniper, Polycom, Microsoft, Riverbed, Schneider Electric. Several of those have their own entries on this timeline, and several no longer trade under those names - which is what any distributor's catalogue looks like a decade on.",
      "It also ran an authorised training centre, which is the part of value-added distribution most explanations skip. A distributor carrying sixty vendors has resellers who need certifying on products they began selling last quarter, and the vendors' own courses are neither frequent enough nor local enough to cover it.",
      "The acquisition has a detail worth the whole entry. ScanSource announced the purchase on 15 August 2014 and completed it in January 2015, for R$156,928,000 plus payments tied to EBITA over the following four years - and it bought Network1 through CDC Brasil, the Brazilian distributor ScanSource had itself acquired in 2011. One acquisition was the vehicle for the next. The American company's Latin American business was not built; it was bought twice, and the second purchase was made by the first.",
      "It was the largest acquisition ScanSource had made to that point. Reported 2014 net sales differ depending on the basis: about R$720M (US$306M) on a US-GAAP-adjusted footing in the legal advisers' account, and about R$850M (US$374M) in the Portuguese-language release. Both are recorded here; the gap is the adjustment, not a disagreement about the business.",
      "The geography is the practical part. The deal added units in Goiás, Pernambuco and Espírito Santo to ScanSource's existing Brazilian presence in São Paulo and Paraná - which is how a distributor actually grows, since serving a reseller in Recife from São Paulo is a different proposition from serving one down the road. Rafael Paloni, Network1's chief executive, went on to run ScanSource's Latin American communications business.",
      "So the loop closes. ScanSource appears on this timeline as a specialist distributor from Greenville, South Carolina, whose founding thesis was catching products on their way to becoming commodities. Anyone working for ScanSource in Brazil after 2015 was working inside what had been Network1, under a brand that read Network1-ScanSource for years.",
    ],
    externalUrl: "https://www.businesswire.com/news/home/20140815005219/en/ScanSource-Announces-Agreement-to-Acquire-Brazil%E2%80%99s-Leading-Communications-Distributor-Network1",
    externalLabel: "ScanSource announcement, 15 August 2014",
    sources: [
      { label: "ScanSource investor release (Portuguese): founded 2004, headquartered in São Paulo, around 400 staff across Latin America; 2014 net sales estimated at approximately R$850M (US$374M); Mike Baur on entering Brazil in 2011 via CDC Brasil", url: "https://www.scansource.com/~/media/C768332F1FB04580B05DBF15380B788F.pdf" },
      { label: "Demarest / Latin Counsel (legal advisers to ScanSource): acquisition of 100% of Intersmart for BRL 156,928,000 plus EBITA-linked earn-outs over four years, made THROUGH CDC Brasil Distribuidora de Tecnologias Especiais; 2014 net sales of approximately R$720M (US$306M) on a US-GAAP-adjusted basis; over 60 vendors, 8,000 customers, nearly 400 employees", url: "https://www.latincounsel.com/?Noticias=Acquisition_of_Intersmart_Comercio_Importaiio_e_Exportaiio_de_Equipamentos_Eletrinicos_SA_Network1" },
      { label: "Business Wire, 15 August 2014: the agreement announced, and Rafael Paloni going on to lead ScanSource's communications business in Latin America", url: "https://www.businesswire.com/news/home/20140815005219/en/ScanSource-Announces-Agreement-to-Acquire-Brazil%E2%80%99s-Leading-Communications-Distributor-Network1" },
      { label: "Fusões & Aquisições: completion at R$157 million, and the added Brazilian units in Goiás, Pernambuco and Espírito Santo alongside the existing São Paulo and Paraná operations", url: "https://fusoesaquisicoes.com/acontece-no-setor/scansource-conclui-compra-da-network1/" },
      { label: "Datacenter Dynamics Brasil: the full vendor line card and the authorised training centre", url: "https://www.datacenterdynamics.com/br/not%C3%ADcias/scansource-assina-acordo-definitivo-para-adquirir-a-network1/" },
    ],
  },
  {
    // SCANSOURCE - added 2026-08-02 (PRIME). Second `distributor`.
    //
    // Worth more than a company sketch because its founding thesis is
    // genuinely distinctive and still legible: distribute products that are
    // TRANSITIONING, and catch them on the way to commodity.
    //
    // FOUNDER COUNT DISCREPANCY RECORDED: most sources name Mike Baur and Steve
    // Owings; one says six founders led by Baur. Both stated.
    slug: "scansource",
    official: {
      url: "https://www.scansource.com",
    },
    group: "other",
    name: "ScanSource",
    founded: 1992,
    relationships: ["worked-inside"],
    tags: ["distributor"],
    tagline: "Distributed products that were on their way to becoming commodities, and tried to arrive first.",
    intro:
      "Mike Baur and Steve Owings founded ScanSource in Greenville, South Carolina in December 1992, to distribute barcode and point-of-sale equipment. Most accounts name the two of them; one describes six founders with Baur as the architect, and both are recorded here. It listed in 1994, raising $5.5M.",
    body: [
      "Its Latin American communications business came from Network1, the S\u00e3o Paulo value-added distributor it agreed to buy in August 2014 and completed in January 2015. The combined operation traded as Network1-ScanSource for years, which means people who joined one company found themselves working for the other without changing desks - a rename rather than a move, and the reason both names appear in the same stretch of a single career.",
      "The founding thesis is the part worth keeping, because it is a real strategy rather than a description. Baur's stated aim was to be a distributor of *transitional* products, and he named the two transitions he was hunting: proprietary moving to open, and high-cost moving to low-cost. The idea was to find products heading for commodity status and get there early - while a specialist channel still needed explaining to, and before the broadline distributors arrived to sell them on price.",
      "And the arbitrage underneath it is the clearest illustration of what a distributor sells. The number of barcode-focused resellers was in the hundreds. The number of computer-focused resellers was in the hundreds of thousands. What ScanSource offered the barcode manufacturers was not warehousing; it was access to a channel three orders of magnitude larger than the one they already knew about. That is the distributor's product, stated as plainly as it ever gets.",
      "The channel-only policy followed from the same logic: no direct sales to end customers, ever. A distributor that sells directly is competing with the resellers it depends on, and resellers can count. Holding that line is what makes the rest of the arrangement work.",
      "The portfolio widened the way these businesses do - Catalyst Telecom for business telephony, later communications, physical security, and eventually cloud and payments through acquisitions including Imago, POS Portal and intY. It is a Fortune 1000 company today, around $3B, with roughly 2,100 staff in North America and Brazil - Brazil being unusual enough in a US distributor's footprint to be worth noticing.",
      "Set beside Westcon-Comstor, the two make a useful pair. Both are specialist distributors rather than broadline ones, and both grew by being the people who could explain a category. But they specialised in different directions: Westcon went deep on networking and security, Comstor specifically on Cisco, while ScanSource went deep on the things that read and print - scanners, terminals, printers - and then followed its resellers outward into telephony and security. Neither tried to carry everything, which is precisely what distinguishes them from Ingram Micro and Tech Data, the broadline houses whose arrival in a category is the signal that it has finished transitioning.",
    ],
    acquisitions: [
      { year: 1993, name: "Alpha Data Systems", what: "A ten-year-old company in Marietta, Georgia, bought in May 1993 - months after ScanSource itself was founded.", became: "Early scale in the AIDC business, and the first of a long line of tuck-in acquisitions." },
      { year: 2011, name: "CDC Brasil", what: "Then the largest value-added distributor of commercial automation in the region. ScanSource's entry into Brazil.", became: "The first half of a Latin American business assembled by purchase rather than built." },
      { year: 2015, name: "Network1 (Intersmart)", price: "R$156,928,000 plus EBITA-linked earn-outs over four years", what: "A leading Brazilian value-added distributor founded in 2004, operating across Brazil, Mexico, Colombia, Chile and Peru with ~400 staff, 8,000 customers and 60+ vendors. Announced 15 August 2014, completed January 2015 - the largest acquisition ScanSource had made to that point.", became: "Network1-ScanSource, and ScanSource's Latin American communications business.", sourceNote: "Bought THROUGH CDC Brasil, the subsidiary acquired in 2011 - so one acquisition was the vehicle for the next." },
    ],
    externalUrl: "https://www.scansource.com/",
    externalLabel: "ScanSource",
    sources: [
      { label: "Network1 acquisition - announced 15 August 2014, completed January 2015; traded as Network1-ScanSource", url: "https://www.scansource.com/" },
      { label: "Channel Futures interview with Mike Baur: the transitional-products thesis - proprietary to open, high-cost to low-cost, 'catch them early' - the 1994 IPO raising $5.5M, and the arbitrage between hundreds of barcode VARs and hundreds of thousands of computer-focused VARs", url: "https://www.channelfutures.com/distribution/scansource-ceo-mike-baur-science-seeing-future" },
      { label: "Company Histories: formed at the end of 1992 to serve POS and AutoID resellers; the May 1993 purchase of Alpha Data Systems of Marietta, Georgia; Catalyst Telecom and the move into telephony", url: "https://www.company-histories.com/ScanSource-Inc-Company-History.html" },
      { label: "Encyclopedia.com: the AutoID and POS product range, and Ingram Micro and Tech Data moving into the POS arena as broadline competitors", url: "https://www.encyclopedia.com/social-sciences-and-law/economics-business-and-labor/businesses-and-occupations/scansource-inc" },
      { label: "Greenville Business Magazine: Baur as co-founder in 1992, president from inception to 2000 then chief executive, and the company at roughly $3B with 2,100 employees in North America and Brazil", url: "https://www.greenvillebusinessmag.com/stories/mike_baur_biography,24035" },
      { label: "PortersFiveForce: founding on 18 December 1992 in Greenville by Baur and Owings, the channel-only policy with no direct sales to end customers, and the Imago, POS Portal and intY acquisitions between 2014 and 2019", url: "https://portersfiveforce.com/blogs/brief-history/scansource", sourceNote: "Secondary summary. Used for the specific founding date, the channel-only policy and the acquisition list; the founder count here agrees with the majority account." },
      { label: "MatrixBCG: an alternative account describing six founders led by Baur, and the value-added distribution model built on technical services, training and financing rather than competing with resellers", url: "https://matrixbcg.com/blogs/brief-history/scansource", sourceNote: "Minority account on the founder count, recorded because it differs from the majority rather than because it is preferred." },
    ],
  },
  {
    // WESTCON-COMSTOR - added 2026-08-02 (PRIME). THE FIRST `distributor`
    // ENTRY, which finally populates a tag that has been legitimately empty
    // since the tagging pass.
    //
    // It also earns a paragraph explaining what two-tier distribution IS,
    // because it is the layer most engineers never see and cannot picture -
    // and this timeline has been carrying a `distributor` tag with nothing
    // behind it to explain the word.
    slug: "westcon-comstor",
    official: {
      url: "https://www.westconcomstor.com",
    },
    group: "other",
    name: "Westcon-Comstor",
    founded: 1985,
    relationships: ["worked-inside"],
    tags: ["distributor"],
    tagline: "The layer between the vendor and the reseller, which decides what is practical to buy in your country.",
    intro:
      "Westcon was founded in 1985 and Comstor in 1986 in Chantilly, Virginia. They became one company in August 1999, when Westcon bought Comstor for $95M, and the combined business has spent the decades since doing something most engineers have never had to think about: standing between the companies that make networking and security equipment and the companies that install it.",
    body: [
      "In June 2017 Synnex acquired the North and Latin American operations of Westcon-Comstor from Datatec, together with a tenth of the remaining international business, for a reported $800 million - so the Brazilian operation changed owner without changing what it did. Synnex itself merged with Tech Data on 1 September 2021 to form TD Synnex, by which time the employment recorded on this site had ended. The name reappears later for a different reason: TD SYNNEX Brasil runs an authorised training academy, and the instructor years include Extreme Networks courses delivered for it on demand between 2021 and 2023. Same company, two unrelated relationships, a decade apart.",
      "What a distributor actually does, since this is the first one on this timeline. A vendor like Cisco or F5 does not want a commercial relationship with every reseller in every country - the credit checks alone would be a business. A reseller does not want a separate contract, currency, logistics arrangement and support escalation with each of the forty vendors in its portfolio. The distributor sits between them and absorbs that: it holds stock, extends credit, handles import and customs, aggregates the paperwork, and trains the resellers on products they have just started carrying.",
      "That last part is the reason distribution appears on a site about teaching at all. A vendor's certified training is expensive and aimed at the vendor's own priorities; a distributor's enablement is aimed at whatever its resellers are failing to sell. The two are not the same curriculum, and the second one tells you more about what the market is actually struggling with.",
      "The strategic consequence is the interesting bit: a distributor decides what is practical to buy in a country. A product with no distribution in Brazil is not unavailable exactly, but every reseller quoting it must import it themselves, carry the currency risk, and explain a longer lead time to the customer - which in practice means they quote something else. Market share in a region often reflects distribution agreements more than it reflects the product.",
      "The corporate history is a chain of ownership rather than a chain of invention. Datatec, a South African group, acquired Westcon in 1998. Westcon added RBR Group in the UK in September 1998 and then Comstor in August 1999 - Comstor having been founded in 1986, sold to GE Capital IT Solutions around 1996, and doing some $500M a year by the time it changed hands. Cisco distribution began in 1999 and Avaya in 2000. The combined company was doing about $1.5B, and $1.85B by 2004.",
      "In 2017 SYNNEX bought the Americas business for $600M in cash, plus $30M for a tenth of the international operations, assuming around $190M of debt with up to $200M more contingent on targets. The Americas business had been turning about $2.2B of revenue. Westcon-Comstor's EMEA and Asia-Pacific operations stayed with Datatec, which is why the same brand can be a SYNNEX subsidiary in one hemisphere and a Datatec business in another.",
      "And a connection worth following. Datatec ran three divisions: technology distribution as Westcon-Comstor, integration and managed services as Logicalis, and consulting as Analysys Mason. So the distributor and the integrator were siblings under one holding company - two layers of the same supply chain, owned by the same people, which is an arrangement worth noticing when you are trying to work out why a particular product kept appearing in a particular market.",
    ],
    acquisitions: [
      { year: 1999, name: "Comstor", price: "$95M", what: "A Cisco specialist distributor founded in Chantilly, Virginia in 1986, sold to GE Capital IT Solutions around 1996, and turning roughly $500M a year by 1999.", became: "The Comstor division, which is why the combined company carries both names to this day.", founder: "founded 1986, Chantilly, Virginia" },
      { year: 1998, name: "RBR Group Limited", what: "A Cisco distributor in the United Kingdom, acquired in September 1998.", became: "The beginning of the Cisco specialisation that Comstor completed a year later." },
    ],
    externalUrl: "https://www.westconcomstor.com/",
    externalLabel: "Westcon-Comstor",
    sources: [
      { label: "Synnex - June 2017 acquisition of Westcon-Comstor\u2019s North and Latin American operations from Datatec, and the 1 September 2021 Tech Data merger forming TD Synnex", url: "https://en.wikipedia.org/wiki/Synnex" },
      { label: "Company Histories: founded 1985, Datatec's 1998 acquisition, RBR Group in September 1998, Comstor for $95M in August 1999, Cisco distribution from 1999 and Avaya from 2000, and $1.85B of sales in 2004", url: "https://www.company-histories.com/Westcon-Group-Inc-Company-History.html" },
      { label: "Encyclopedia.com: Comstor founded in Chantilly, Virginia in 1986, acquired by GE Capital IT Solutions about ten years later, doing $500M annually; the combined company at $1.5B across two divisions", url: "https://www.encyclopedia.com/books/politics-and-business-magazines/westcon-group-inc" },
      { label: "SYNNEX SEC filing (5 June 2017): the Americas business at approximately $2.2B revenue and $89M EBITDA for the year to February 2017; Datatec's three divisions named as Westcon-Comstor, Logicalis and Analysys Mason", url: "https://www.sec.gov/Archives/edgar/data/1177394/000117739417000026/exh9916-5x2017.htm" },
      { label: "ChannelPro: final terms - $600M cash for the Americas, $30M for a 10% stake in the overseas businesses, roughly $190M of assumed debt and up to $200M of earn-out", url: "https://www.channelpronetwork.com/2017/09/01/synnex-closes-acquisition-of-westcon-comstors-north-and-latin-american-units/" },
    ],
  },
  {
    // EQUINIX - added 2026-08-01 (PRIME).
    //
    // FIFTH entry on the neutrality thread, and the purest: here neutrality is
    // not an asset that might survive an acquisition (CompTIA), nor one that
    // arrived when ownership ended (Kyndryl), nor a licence choice (FreeRADIUS).
    // It is THE ENTIRE PRODUCT, and it is in the company's name.
    //
    // Also loops to DEC, already on this timeline: both founders came from
    // there, PAIX was DEC's, and Equinix later bought PAIX back.
    slug: "equinix",
    official: {
      url: "https://www.equinix.com",
    },
    tags: ["datacentre"],
    group: "other",
    name: "Equinix",
    founded: 1998,
    tagline: "Two facilities managers left DEC because the telcos were refereeing a game they were playing in.",
    intro:
      "Equinix was incorporated on 22 June 1998 by Al Avery and Jay Adelson, two facilities managers from Digital Equipment Corporation who had built and run PAIX, the Palo Alto Internet Exchange, which DEC owned. It was briefly called Quark Communications. The name it settled on is an argument compressed into eight letters: EQUality, Neutrality, Internet eXchange.",
    body: [
      "The problem they left to solve is specific and still worth understanding. Networks have to meet somewhere to exchange traffic. In the 1990s the places they met were largely owned by telecommunications carriers, who were also participants - and a referee who is playing in the game will favour his own traffic, whether by design or by the ordinary gravity of self-interest. Congestion at those exchange points was not only a capacity problem; it was a governance problem.",
      "The answer was a building owned by somebody with no network of their own. If the landlord sells no transit, has no traffic to prioritise and competes with none of the tenants, then rival carriers can meet inside without either of them conceding anything. Neutrality here is not a virtue the company advertises. It is the product.",
      "PAIX itself deserves a line, because it is where the idea was proven. It began operating in 1996 under DEC, and in its earliest days the interconnection fabric was a DELNI - Digital's own Ethernet concentrator, a box designed for office networks, pressed into service as the meeting point for the commercial internet. Adelson worked there alongside Stephen Stuart and Paul Vixie, whose name is on BIND and therefore on most of the DNS this site's tools take apart.",
      "The funding tells you who agreed with the thesis: a $12M round led by Benchmark Capital, with Cisco and Microsoft as strategic investors - a network vendor and a software company, neither of which sells transit, both of which benefit from an internet that interconnects cleanly.",
      "The business model insight came slightly later and is the more valuable one. They began by selling floor space, power and cooling. What they discovered was that the money and the durability were in the cross-connect - the physical cable between two tenants. A customer chooses a building because of who is already inside it, and every new tenant makes the building more valuable to the next. That is a network effect expressed in concrete and copper, and it is why colocation consolidated into a handful of operators rather than staying a commodity property business.",
      "And then a loop. Equinix acquired Switch and Data in 2010, and Switch and Data owned PAIX. The founders had left DEC to build a neutral exchange because the one they ran was not theirs; twelve years later their company bought it.",
      "Read beside four other entries here, the pattern is hard to miss. CompTIA's value rests on belonging to no vendor, and whether that survives private equity is unresolved. Kyndryl's advice became worth more the moment IBM stopped owning it. FreeRADIUS stayed open and became the thing everyone builds against. Equinix went furthest: it did not merely benefit from neutrality, it discovered that neutrality could be sold by the square foot.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Equinix",
    externalLabel: "Equinix",
    sources: [
      { label: "Wikipedia: Equinix - founded 1998 by Al Avery and Jay Adelson, two facilities managers at Digital Equipment Corporation; REIT conversion in January 2015; ~260 data centres in 33 countries and $9.22B revenue in 2025", url: "https://en.wikipedia.org/wiki/Equinix" },
      { label: "Wikipedia: Jay Adelson - building and operating PAIX at DEC alongside Stephen Stuart and Paul Vixie, leaving DEC in June 1998, the company briefly named Quark Communications, and PAIX arriving at Equinix through the Switch and Data acquisition", url: "https://en.wikipedia.org/wiki/Jay_Adelson" },
      { label: "Wikipedia: PAIX - operating from 1996 under Digital Equipment Corporation, using a DELNI as its early interconnection infrastructure", url: "https://en.wikipedia.org/wiki/PAIX" },
      { label: "Business model history: incorporation on 22 June 1998; early peering points dominated by telcos favouring their own traffic; the $12M Benchmark round with Cisco and Microsoft; the name as Equality, Neutrality and Internet Exchange", url: "https://businessmodelcanvastemplate.com/blogs/brief-history/equinix-brief-history" },
      { label: "MatrixBCG: the shift from selling colocation floor space to monetising interconnection through paid cross-connects, which proved higher margin and stickier", url: "https://matrixbcg.com/blogs/brief-history/equinix" },
      { label: "Companies History: the vendor-neutral multitenant model where competing networks could connect, and the i-STT, IXEurope and Switch and Data acquisitions", url: "https://www.companieshistory.com/equinix-incorporated/" },
    ],
  },
  {
    // TIVIT - added 2026-08-01 (PRIME). Second of the Brazilian services
    // cluster, and the deliberate CONTRAST with Stefanini: one grew organically
    // from a spare room, the other was assembled by a holding company out of
    // parts it already owned.
    //
    // DATE DISCREPANCY RECORDED: the company's own timeline dates the brand to
    // 2004; Wikipedia, TI INSIDE (reporting the merger contemporaneously on
    // 15 August 2005) and Exame all say 2005. Both given.
    slug: "tivit",
    official: {
      url: "https://tivit.com",
    },
    tags: ["services", "datacentre"],
    group: "other",
    name: "TIVIT",
    founded: 2005,
    tagline: "A professional tennis player, a nightclub, and a company built by merging two others somebody already owned.",
    intro:
      "TIVIT did not start in a garage. It was assembled. In 2005 Votorantim Novos Negócios merged two companies from its own portfolio - Optiglobe, bought in 2002, and Proceda, bought about eight months earlier - and named the result TIVIT. It arrived with roughly two thousand staff and over two hundred clients including Petrobras, Xerox and White Martins. The company's own timeline dates the brand to 2004; contemporaneous press coverage of the merger is dated August 2005, and both are recorded here.",
    body: [
      "The person behind it had an unusual previous career. Luiz Mattar spent ten years as a professional tennis player before going into business. His first venture as an investor was a combined brewery and nightclub. Shortly after, with four partners and R$150,000, he started Telefutura - a call centre and business process outsourcing company - which sold 20% to Votorantim Novos Negócios in 2001, a transaction that mattered less for the money than for the credibility it bought with financial-sector clients.",
      "The idea Mattar kept pressing was a one stop shop: a customer able to buy every kind of IT service from a single supplier rather than assembling one from many. Votorantim eventually concluded it owned the pieces to build that, and did - which is why TIVIT exists as a merger rather than a founding. Telefutura itself was folded in during 2007.",
      "The listing is a detail worth keeping. TIVIT went public on BM&FBovespa's Novo Mercado in September 2009 at R$15 a share, raising over R$660M, after two earlier attempts had been abandoned because of market conditions. At the time it was the only IT services company listed on the Brazilian exchange - the other technology listings were hardware makers like Positivo, Itautec and Bematech, or software, like Totvs. A services business is harder to explain to public markets than a factory, and for a while nobody else tried.",
      "It did not stay listed long. In 2010 Apax Partners bought control, paying a premium of twenty to thirty per cent over a market capitalisation of about R$1.47B, and it was Apax's first investment in Brazil. Under that ownership the company expanded across the region, acquiring Synapsis in 2014 and reaching ten Latin American countries.",
      "What followed is the ordinary arc of a services business in this period: a cloud platform in 2016, a digital solutions arm, an innovation unit, a cybersecurity practice that reported around ninety per cent growth in 2023, a separation of the data centre business under the Takoda name, and an acquisition by the Italian group Almaviva.",
      "Read against the Stefanini entry, the two are opposite constructions of the same thing. Stefanini began with one man teaching classes in a spare room and grew outward for decades. TIVIT began fully formed, with two thousand employees and a client list, because a holding company decided the market wanted something and merged its way to it. Both are large Brazilian technology services firms; neither could have been built the other's way. One needed patience and one needed capital, and the interesting question is which model travels better - Stefanini went abroad on its own account, while TIVIT's regional expansion arrived with private equity attached.",
    ],
    externalUrl: "https://pt.wikipedia.org/wiki/TIVIT",
    externalLabel: "TIVIT (Wikipédia)",
    sources: [
      { label: "Wikipédia (pt): the 2001 sale of 20% of Telefutura to Votorantim Novos Negócios, the one-stop-shop idea, and the 2005 merger of Optiglobe and Proceda into TIVIT", url: "https://pt.wikipedia.org/wiki/TIVIT" },
      { label: "Exame: Luiz Mattar's ten years as a professional tennis player, the brewery and nightclub venture, and Telefutura started with four partners and R$150,000", url: "https://exame.com/negocios/qual-e-o-novo-foco-da-bilionaria-brasileira-de-tecnologia-tivit-e-o-que-o-pix-tem-a-ver-com-isso/" },
      { label: "TI INSIDE, 15 August 2005: the merger officialised that day, the one-stop-shop rationale, and the new company's client list including White Martins, Xerox, Petrobras and BankBoston", url: "https://tiinside.com.br/15/08/2005/votorantim-cria-a-tivit-para-disputar-mercado-de-outsourcing/" },
      { label: "InvestSP: the September 2009 IPO at R$15 after two abandoned attempts, TIVIT as the only IT services company listed on BM&FBovespa, and Apax buying control in 2010 at a 20-30% premium to a ~R$1.47B market capitalisation", url: "https://investsp.org.br/fundo-apax-compra-controle-da-tivit/" },
      { label: "TIVIT's own timeline: two data centres inaugurated in 2000, the brand created after the Proceda acquisition, the R$660M IPO, Apax's first Latin American investment, Synapsis in 2014 and TIVIT Cloud in 2016", url: "https://tivit.com/en/a-tivit/" },
      { label: "BTW Media: the company's own chronology dating the brand to 2004, the Takoda data centre separation, and the argument that its data centre heritage is what distinguishes it from a smaller hyperscaler", url: "https://btw.media/en/tivit-hosting-services-sells-brazilian-enterprise-trust-not-a-smaller-hyperscaler" },
    ],
  },
  {
    // STEFANINI - added 2026-07-31 (PRIME). First of the Brazilian services
    // cluster, and the one with the most direct bearing on this site: it began
    // as a TRAINING company, and teaching was the skill that won its first
    // work.
    //
    // Mirrors NIIT in the HCL entry, but inverted. NIIT was founded BY a
    // technology company's founder as infrastructure for an industry.
    // Stefanini was a training company that BECAME the technology company.
    slug: "stefanini",
    official: {
      url: "https://stefanini.com",
    },
    tags: ["services", "training"],
    group: "other",
    name: "Stefanini",
    founded: 1987,
    tagline: "A teacher started it in a spare room, and teaching is what won the first work.",
    intro:
      "Marco Stefanini founded the company in 1987 in a bedroom of his own house in São Paulo, aged 26. It was not a consultancy. It began as a training business, running programming and technology courses for the staff of large companies, and only pivoted to IT consulting about two years later.",
    body: [
      "The route in is worth telling, because almost none of it was planned. He read geology at the University of São Paulo, spent a month at a cassiterite mine in the interior of Goiás and concluded the profession was not for him. Struggling to find work in São Paulo, he moved into technology at his sister's encouragement - she was already at Serpro, the federal data processing service - took a systems analysis course, and joined the IT department at Bradesco. He also worked at Engesa, the military vehicle manufacturer, and at IBM.",
      "And he was teaching at the time, which is the detail that matters. In his own account, because he was already giving classes, moving into training was straightforward, and that skill is what won the company its first projects. A teacher's business became a technology business rather than the other way round.",
      "The first office was thirty-eight square metres. The timing was good: Brazil's large banks and industrial groups were computerising, and a firm that could both train people and supply them found no shortage of work. Systems development and IT outsourcing followed, and for its first years the company was entirely domestic.",
      "Then it went abroad, which Brazilian technology companies mostly did not. Expansion into other markets became the central growth strategy rather than an afterthought, and the result is a genuinely unusual company: a Brazilian multinational in a sector where the multinationals almost always arrive from somewhere else. By 2025 it reported operations in 41 countries and more than 35,000 staff speaking 45 languages, with revenue around $1.4B for 2024. A Fundação Dom Cabral study once ranked it the fifth most internationalised Brazilian company of any kind.",
      "Growth has been substantially by acquisition and the company says so plainly, with a stated target of R$2B of purchases by 2027, and it makes a point of being unleveraged - which in a high interest rate environment is less a boast than an explanation of why it can keep buying when others cannot.",
      "Read beside the HCL entry, the two make a matched pair, inverted. There, the founder of a technology company started a training institute in 1982 because a domestic industry cannot grow faster than the supply of people who can staff it - training built as infrastructure for a business. Here, the training came first and the business grew out of it. Both companies concluded that teaching and technology services are the same trade approached from different ends, which is a conclusion this site has some sympathy with.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Stefanini_IT_Solutions",
    externalLabel: "Stefanini IT Solutions",
    sources: [
      { label: "Wikipedia: Stefanini IT Solutions - founded 1987 by Marco Stefanini, headquarters in São Paulo and Jaguariúna, revenue of about US$1.4B for 2024", url: "https://en.wikipedia.org/wiki/Stefanini_IT_Solutions" },
      { label: "Brazil Journal: the company was born in Marco's house and began as a training business running programming and technology courses for large companies' staff, pivoting to IT consulting two years later; the R$2B acquisition target to 2027 and the unleveraged position", url: "https://braziljournal.com/stefanini-compra-empresa-de-servicos-na-nuvem-e-cresce-receita-em-us-100-mi/" },
      { label: "iHUB Lounge interview with Marco Stefanini - geology at USP, a month at a cassiterite mine in Goiás, his sister at Serpro encouraging the move, the systems analysis course, Bradesco, founding at 26, and teaching being the skill that won the first projects", url: "https://ihublounge.com.br/por-dentro-das-empresas/por-dentro-das-empresas-stefanini/" },
      { label: "ISTOÉ Dinheiro: the 38-square-metre first office, work at Engesa and IBM, teaching at Objetivo, and the Fundação Dom Cabral ranking as the fifth most internationalised Brazilian company", url: "https://istoedinheiro.com.br/stefanini-metade-dos-nossos-24-mol-funcionarios-trabalha-no-exterior/" },
      { label: "Grokipedia: 41 countries, over 35,000 professionals speaking 45 languages as of 2025, 97% client retention and an average client relationship of 11.9 years", url: "https://grokipedia.com/page/Stefanini_IT_Solutions" },
      { label: "Lumnis case study: beginning as a technology training company, migrating to systems development and IT outsourcing on the wave of computerisation at Brazil's large banks and industries, with the first years entirely domestic", url: "https://lumnis.com.br/estudostefanini/" },
    ],
  },
  {
    // KYNDRYL - added 2026-07-31 (PRIME). Third IBM-divestment entry on this
    // timeline, after Lotus (bought 1995) and HCL (bought Notes from IBM 2019).
    //
    // The interesting claim is NOT that it was spun off. It is WHY independence
    // was the product: a services business owned by a cloud vendor cannot
    // credibly recommend a competitor's cloud.
    slug: "kyndryl",
    official: {
      url: "https://www.kyndryl.com",
    },
    tags: ["services"],
    group: "contemporary",
    name: "Kyndryl",
    founded: 2021,
    tagline: "The largest technology spin-off by headcount, and independence was the point rather than the price.",
    intro:
      "IBM announced in October 2020 that it would separate its managed infrastructure business. The unit was named Kyndryl in April 2021 - kyn from kinship, dryl from tendril, a construction that drew a certain amount of press amusement - and the separation completed on 4 November 2021, when it began trading on the New York Stock Exchange with about 90,000 employees. It was, and remains, the largest technology spin-off by headcount.",
    body: [
      "The scale is easier to grasp from the other side. The Financial Times described it as IBM shedding a quarter of its business, and the unit taking with it the bulk of what had been IBM Global Technology Services: roughly 4,400 customers including around three quarters of the Fortune 100, operations in sixty-three countries, and some four hundred data centres.",
      "The reason usually given is decline, and it is true but incomplete. Inside IBM the business had struggled through the cloud era, because customers were moving workloads to hyperscalers and few had any appetite left for the long, large outsourcing contracts the unit was built around. Shedding a shrinking business to concentrate on hybrid cloud is a legible strategy and it is what the coverage led with.",
      "The more interesting reason is structural, and it is the one worth taking away. A managed services business owned by a cloud vendor cannot credibly recommend a competitor's cloud. Whatever the engineers actually think, the advice arrives from a company whose parent sells the alternative, and the customer discounts it accordingly. Independence was not the consolation prize for being unwanted - it was the thing that made the business sellable again.",
      "The evidence is in the calendar. Kyndryl announced a partnership with Microsoft in November 2021, the same month it separated, and with Google Cloud in December. Neither was available on those terms to a division of IBM.",
      "That is the same argument this timeline records elsewhere, in a different setting. CompTIA's certifications are valuable precisely because they belong to no vendor, and the open question there is whether that survives private-equity ownership. Kyndryl is the mirror image: a business whose advice was worth less while it was owned, and worth more once it was not. In both cases the asset is neutrality, and neutrality is a property of who owns you rather than of what you know.",
      "Martin Schroeter, who had been IBM's chief financial officer and later a senior vice president, left the company in June 2020 and returned in January 2021 to lead the new one. The market's first verdict was cool: the shares closed their opening day at $26.38, down about seven per cent, and slipped further after hours.",
      "And it is the third time IBM appears on this timeline handing something over. It bought Lotus in 1995 for the Notes technology, sold Notes and Domino to HCL in a deal announced in 2018, and separated this business in 2021. A company that spent decades acquiring is now most visible here for what it has let go.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Kyndryl",
    externalLabel: "Kyndryl",
    sources: [
      { label: "Kyndryl SEC Form 8-K (4 November 2021): separation completed, NYSE ticker KD, about 90,000 employees, Martin Schroeter as chairman and chief executive", url: "https://www.sec.gov/Archives/edgar/data/1867072/000110465921134456/tm2131654d1_ex99-1.htm" },
      { label: "HandWiki: formed from the bulk of IBM Global Technology Services; ~4,400 customers including 75% of the Fortune 100; 63 countries and around 400 data centres; the Microsoft partnership in November 2021 and Google Cloud in December", url: "https://handwiki.org/wiki/Company:Kyndryl" },
      { label: "SDxCentral: the name announced April 2021, kyn from kinship and dryl from tendril, following Arvind Krishna's October 2020 announcement", url: "https://www.sdxcentral.com/news/ibms-infrastructure-spinoff-gets-a-name/" },
      { label: "The Register: the business had struggled inside IBM as customers moved to hyperscalers and lost appetite for large multi-year outsourcing; first-day close at $26.38, down 6.7%", url: "https://www.theregister.com/2021/11/04/kyndryl_ibm_spinoff/" },
      { label: "MatrixBCG: the 80.1% pro-rata distribution to IBM shareholders with 19.9% retained for later sale, and the work of disentangling thousands of contracts while maintaining continuous operations", url: "https://matrixbcg.com/blogs/brief-history/kyndryl" },
      { label: "Futurum Research: Schroeter leaving IBM in June 2020 and returning in January 2021, and the business model of serving organisations that do not treat IT delivery as core", url: "https://futurumresearch.com/wp-content/uploads/2021/10/Futurum.The-IBM-Spinoff-of-Kyndryl.pdf" },
    ],
  },
  {
    // COMPTIA - added 2026-07-31 (PRIME). The COUNTERPOINT to the certification
    // thread in the Cisco entry: Cisco built the vendor-defined competency
    // ladder every vendor here copies; CompTIA is the vendor-NEUTRAL answer,
    // created by dealers who sold everybody's products.
    //
    // *** THE 2024 SALE IS A LIVE, UNRESOLVED QUESTION AND IS WRITTEN THAT
    // WAY. *** The company's assurance and the practitioners' doubt are both
    // recorded; no verdict is offered.
    //
    // NO PRICE IS GIVEN: this session's sources did not state one.
    slug: "comptia",
    official: {
      url: "https://www.comptia.org",
    },
    tags: ["training", "standards"],
    group: "other",
    name: "CompTIA",
    founded: 1982,
    tagline: "Its entire value was being owned by nobody, and in 2024 it was bought.",
    intro:
      "CompTIA began in 1982 as the Association of Better Computer Dealers - ABCD - a trade group for computer resellers. That origin explains everything about it. Dealers sold hardware and software from many manufacturers at once, and what they needed was not another manufacturer's badge but a standard that belonged to none of them: common benchmarks for compatibility, for sales practice, and for whether a technician actually knew the job.",
    body: [
      "Vendor neutrality was not a marketing position adopted later. It was the founding condition, and it distinguished the association from proprietary vendor programmes from day one. The name changed to the Computing Technology Industry Association by the late 1980s as the scope widened past dealerships into education and workforce development.",
      "The A+ certification arrived in the early 1990s, and the idea behind it is worth stating because it is easy to take for granted now: a credential that says you can do the work, rather than that you can operate one company's products. Network+, Security+ and the rest followed the same logic. More than 3.5 million certifications have been awarded.",
      "Read that against the Cisco entry on this timeline and the two halves of an argument appear. Cisco's CCNA, CCNP and CCIE created the vendor-defined competency ladder, and every vendor on this site with a certification track is working from that template - including the four whose official training this site's author delivers. CompTIA is the other answer to the same question: that a technician's competence is a property of the technician, not of a supplier relationship. Both models are still standing, and most working engineers hold credentials of both kinds.",
      "There is a detail here that matters to anyone who teaches. CTT+, the Certified Technical Trainer credential, was vendor-neutral certification for the act of instruction itself - acquired from the Chauncey Institute and built with the IT Training Association and the Computer Education Management Association. It was retired on 31 October 2023. Existing holders remain certified. There is no direct replacement, which means the one widely recognised credential for teaching technology, independent of what was being taught, no longer exists.",
      "And then the part that is not settled. In November 2024, H.I.G. Capital and Thoma Bravo agreed to acquire the CompTIA brand and its certification and training business. The transaction closed in early 2025 and split the organisation in two: the certification business now operates for profit under private-equity ownership, while the membership-based 501(c)(6) nonprofit association separates and continues. Forty-two years of operating as a non-profit ended.",
      "The company's position is that nothing material changes - the certifications remain ANSI accredited and vendor-neutral, and the ownership brings resources to expand. Practitioners in its own instructor community were less certain, and their objection is specific rather than sentimental: the asset being bought is neutrality, and neutrality is the one thing that cannot be bought without raising the question of whether it survived the purchase. One put it as having more faith in a certification body run as a non-profit, because non-profits answer to a mission and companies answer to a number.",
      "This page does not resolve that, because it is not yet resolvable. The assurance is on record and so is the doubt, and the only honest thing to say is that the answer arrives over years, in whether the exam objectives keep describing the job or start describing somebody's product.",
      "Worth noting who the buyer is: Thoma Bravo now appears in four entries on this timeline - holding Sophos, holding LANDESK before it became Ivanti, taking Ping Identity private twice and combining it with ForgeRock, and now this. On a page about lineage, the recurring name is not a vendor at all.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/CompTIA",
    externalLabel: "CompTIA",
    sources: [
      { label: "Wikipedia: CompTIA - founded 1 January 1982, vendor-neutral certifications, three-year expiry requiring retesting, CTT+ acquired from the Chauncey Institute and retired 31 October 2023, and H.I.G. Capital and Thoma Bravo as owners", url: "https://en.wikipedia.org/wiki/CompTIA" },
      { label: "Grokipedia: founded as the Association of Better Computer Dealers, a trade group for resellers seeking benchmarks that did not favour specific manufacturers - vendor neutrality as a founding principle, not a later position", url: "https://grokipedia.com/page/CompTIA" },
      { label: "H.I.G. Capital and Thoma Bravo announcement (4 November 2024): acquisition of the brand and the certification and training business; the business becomes for-profit while the 501(c)(6) association separates and continues; over 3.5 million certifications awarded", url: "https://www.thomabravo.com/press-releases/h.i.g.-capital-and-thoma-bravo-to-acquire-comptia-brand-and-products" },
      { label: "ChannelE2E: forty-two years as a non-profit ending, and the split into a for-profit unit and a separate non-profit association from 2025", url: "https://www.channele2e.com/feature/comptia-acquired-by-investment-firms-h-i-g-capital-and-thoma-bravo" },
      { label: "CompTIA Instructors Network discussion: the neutrality objection stated by practitioners, and the company's assurance that certifications remain ANSI accredited and vendor-neutral", url: "https://cin.comptia.org/threads/h-i-g-capital-and-thoma-bravo-to-acquire-comptia-brand-and-products.1992/" },
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
    official: {
      url: "https://www.freeradius.org",
      resources: [
        { label: "FreeRADIUS documentation", url: "https://www.freeradius.org/documentation/" },
      ],
    },
    tags: ["standards", "vendor"],
    group: "other",
    name: "FreeRADIUS",
    founded: 1999,
    tagline: "Authenticates about a third of the people on the internet, and has had the same project leader since 1999.",
    intro:
      "FreeRADIUS was founded in June 1999 by Miquel van Smoorenburg and Alan DeKok, with the first public alpha in August - which is why sources give both months. It was a fork of the Cistron RADIUS server, which van Smoorenburg had written himself and which had been widely adopted for a specific reason: the original RADIUS server had stopped being maintained.",
    body: [
      "The protocol has a precise origin. In 1991 Merit Network, a non-profit internet provider, needed to manage dial-in access across points of presence run by different organisations. It did not want to distribute usernames and passwords to every remote access server, so it wanted those servers to ask a central one and receive back a yes or a no. Livingston Enterprises built that, and called it Remote Authentication Dial-In User Service.",
      "Livingston is worth a paragraph of its own. Founded in 1986 by Ronald Willens and his son Steven in Pleasanton, California, financed by its founders and then by its own operating profits rather than venture capital, it made the PortMaster access server - which by the mid-1990s held something like two-thirds of the ISP market and served over two thousand providers. It had ninety employees. Lucent acquired it in 1997, and the RADIUS server it had given away stopped being maintained.",
      "That is the gap Cistron filled, and then FreeRADIUS forked Cistron. So the software authenticating a large fraction of the internet today descends, by two forks, from a program written to solve one non-profit's dial-up problem in 1991.",
      "The numbers are the part people do not believe. A survey in November 2006 with over five hundred respondents put daily usage at around a hundred million people - roughly a third of global internet access at the time. More than fifty thousand sites run it, from installations with ten users to ones with over ten million. It underpins eduroam, the roaming authentication network used across universities worldwide. If you have ever connected to campus wireless anywhere in Europe, this is what said yes.",
      "It supports more authentication types than any other open-source RADIUS server, and was for a long time the only open-source one implementing EAP at all - which matters because EAP is what 802.1X wireless authentication runs on. Version 2.0.0 in 2008 added virtual servers, IPv6 and a policy language; 3.0.0 in 2013 added RadSec, carrying RADIUS over TLS, which fixed a protocol whose original transport security was a shared secret and MD5.",
      "And here is why it belongs beside three other entries on this timeline. Tenable closed its open-source scanner in 2005 to fund the company, and was forked. Rapid7 bought an open-source project and kept it open as a commercial differentiator. Elastic closed one, was forked, and reopened it three years later. FreeRADIUS did none of that. It stayed open, and became the thing everyone else builds against. Commercial support exists through a company built around it, which is a different arrangement from selling the software or restricting it.",
      "Alan DeKok has led the project since 1999 - twenty-six years, with a core team that accumulated slowly: Alexander Clouter in 2009, Arran Cudbard-Bell in 2012, Matthew Newton in 2016. On a timeline mostly composed of acquisitions, rebrands and strategic exits, a piece of infrastructure quietly maintained by the same person for a quarter of a century is the genuinely unusual entry.",
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
    tags: ["services", "vendor", "training"],
    group: "other",
    name: "HCLTech",
    founded: 1976,
    tagline: "Started because IBM left India, and forty-one years later bought IBM's software.",
    intro:
      "A group of engineers from Delhi Cloth & General Mills, led by Shiv Nadar, incorporated the company on 11 August 1976, renaming it that day from Microcomp Limited to Hindustan Computers Limited. They worked from a barsaati - a Delhi rooftop apartment - with about ₹1.83 lakh of capital, roughly $22,000 at the time, and funded the computers they actually wanted to build by selling teledigital calculators first.",
    body: [
      "The context is the whole story. India's foreign exchange regulations required multinationals to dilute equity to local shareholders, and IBM left the country rather than comply. That removed the dominant supplier from a market where there were, by one contemporary count, about 250 computers in the entire country. HCL was one of the companies that formed in the space this created.",
      "In 1978 it shipped an indigenously designed 8-bit microcomputer - the same year as Apple's early machines and three years before the IBM PC. A networking operating system and client-server architecture followed in 1983, and a fine-grained multiprocessor UNIX in 1988, which the company notes was three years ahead of Sun and HP.",
      "In 1982 Nadar founded NIIT, a computer training institute, on the reasoning that a domestic technology industry cannot grow faster than the supply of people who can staff it. That is a training business created as infrastructure for an industry rather than as a product, and it is the sort of decision that only looks obvious afterwards.",
      "The software services arm was spun out on 12 November 1991, initially as HCL Overseas Limited, becoming HCL Consulting in 1994 and HCL Technologies in 1999. It listed in January 2000, crossed $10B of revenue in 2021, and renamed itself HCLTech in 2022.",
      "And then the reversal. IBM announced the sale of Notes and Domino to HCL on 6 December 2018, and the wider transaction completed on 1 July 2019: seven software products - Notes and Domino, AppScan, BigFix, Commerce, Connections, Digital Experience, and Unica - for $1.8B, the largest acquisition by an Indian IT company at that point. Both years appear in sources because one is the announcement and the other the completion.",
      "So the company that exists partly because IBM withdrew from India in the 1970s now owns and develops software IBM bought Lotus for in 1995. Lotus Notes has had three owners across four decades, and its current one was founded by people who started out selling calculators to fund a computer nobody else would sell them.",
      "Two further points. Roshni Nadar Malhotra succeeded her father as chair, becoming the first woman to chair a listed Indian IT company. And the founding roster itself is genuinely disputed: sources give six founders or eight, and while Shiv Nadar, Arjun Malhotra, Ajai Chowdhry and Yogesh Vaidya appear consistently, the remaining names differ between accounts. That disagreement is left visible here rather than resolved by picking the version that reads best.",
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
    official: {
      defunct: true,
      successor: { label: "HCLTech, which acquired the Notes and Domino portfolio", url: "https://www.hcltech.com" },
    },
    tags: ["vendor"],
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
      "The numbers from that first year are worth stating in full. The business plan forecast $1M of sales. Lotus did $53M, and was the world's third largest microcomputer software company by 1983. Very few companies on this timeline missed their own projection by a factor of fifty in the right direction.",
      "Its predecessor is already on this site. The Apple entry records VisiCalc as the software that made the Apple II worth buying - the first spreadsheet, and the reason a business would justify a personal computer at all. Kapor came from the company that distributed it and built the product that replaced it. Then in 1985 Lotus acquired Software Arts, the company that actually wrote VisiCalc, and discontinued it. The successor bought the predecessor and switched it off.",
      "Jim Manzi arrived in 1982 as a McKinsey consultant, became an employee four months later, president by October 1984, and chief executive in April 1986 when Kapor stepped down. He ran the company until it was sold.",
      "And then the product that outlived everything else. Lotus Notes came out of Ray Ozzie's Iris Associates, and it was not a spreadsheet, an email client or a database, but a thing built out of all three: replicated document stores that worked when disconnected, with application logic attached. That is an unusual design and it is exactly why it survived - organisations built their actual business processes inside it, and a business process is far harder to migrate than a file format.",
      "IBM bought Lotus in 1995 for $3.5B, primarily for Notes, and specifically to get into client-server computing as its own host-based OfficeVision was being made obsolete. Along the way Lotus had also acquired cc:Mail in 1991 - which appears on this timeline in the Qualys entry, because cc:Mail's founder Philippe Courtot went on to run Qualys for two decades.",
      "On 6 December 2018 IBM announced the sale of Notes and Domino to HCL for $1.8B. So the software has now had three owners across more than thirty years, and it is still sold, still supported, and still running the internal processes of organisations that built them in the 1990s and never found a reason expensive enough to justify leaving.",
      "That is the fact worth carrying away, and it contradicts how this industry usually talks about itself. Most of the companies on this timeline were bought for a technology that was quietly retired within a few years. Lotus was bought for one that outlasted the buyer's interest, the buyer's strategy, and eventually the buyer.",
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
    official: {
      url: "https://www.qualys.com",
      resources: [
        { label: "Qualys Documentation", url: "https://docs.qualys.com" },
      ],
    },
    tags: ["vendor"],
    group: "contemporary",
    name: "Qualys",
    founded: 1999,
    tagline: "Delivered security scanning as a service in 2000, before anybody had a word for that.",
    intro:
      "Qualys was founded in 1999 by Philippe Langlois and Gilles Samoun, incorporated in Delaware at the end of that December, with Langlois as chief technology officer and Samoun as chief executive. Philippe Courtot invested in 1999 and became chief executive and chairman in March 2001, and it is his tenure the company is usually remembered for. Some sources describe Courtot as a founder; the majority record him as the early investor who then ran it for twenty years, and that is the account used here.",
    body: [
      "QualysGuard launched in 2000, and the decision that made it distinctive was not what it scanned but how it arrived. Competitors sold software you installed. Qualys sold a subscription to a service, at a time when software as a service barely existed as a phrase - and the argument for it was specific rather than fashionable: vulnerability data ages badly. A scanner is only as good as its knowledge of what to look for, and installed software is exactly as current as its last update, which in most organisations is not very. A service updated centrally is current for everyone at once.",
      "That is the same argument this timeline shows repeatedly, arriving for a fifth time. IronPort made it about email sender reputation in 2002, Zscaler about web traffic in 2007, Cloudflare about the web in 2009, CrowdStrike about endpoint behaviour in 2013. Qualys made it about vulnerability knowledge in 2000, which makes it the earliest instance on this page. The idea that a centrally operated platform beats locally installed software because it is never stale was worked out in this segment first.",
      "And it completes a trio here on a different axis. Tenable, Rapid7 and Qualys compete in the same market and the other two entries contrast them on open source - one closed a project to fund itself, one bought a project and kept it open. Qualys differs on something else entirely: it never shipped software to be run by the customer at all. Three companies, three strategies, three answers to what a security vendor actually sells.",
      "Philippe Courtot's career before Qualys is worth its own paragraph. In 1988 he founded cc:Mail, took it to roughly forty per cent of the email platform market, and sold it to Lotus in 1991. In 1993 he became chief executive of Verity, taking it public in 1995. He then led Signio through its acquisition by VeriSign. Qualys was his fifth chief executive role, and he ran it for two decades.",
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
    official: {
      url: "https://www.illumio.com",
      resources: [
        { label: "Illumio Docs", url: "https://docs.illumio.com" },
      ],
    },
    tags: ["vendor"],
    group: "contemporary",
    name: "Illumio",
    founded: 2013,
    tagline: "Assumed the attacker is already inside, and made the whole product about what happens next.",
    intro:
      "Andrew Rubin and PJ Kirner founded Illumio on 23 January 2013 in Sunnyvale, having both left Cymtec the month before. They had met through a mutual friend's introduction over lunch, which Kirner has described as feeling like a blind date. Rubin took the commercial side, Kirner the technical - he had been a distinguished engineer in the security CTO office at Juniper Networks, which appears on this site as a career chapter of its own.",
    body: [
      "The founding thesis was unfashionable in 2013 and is now close to consensus: perimeter security alone is not enough, breaches are inevitable, and the useful question is what an attacker can reach once inside. Most security spending at the time went on keeping people out. Illumio's argument was that the containment problem deserved its own product.",
      "The technical decision that follows is the interesting one. Segmentation had historically been a network problem - VLANs, zones, firewalls between them - which means the policy lives in the topology, and a workload's security depends on where it happens to sit. Illumio put enforcement at the workload instead, with policy computed centrally and pushed to hosts, so the rule travels with the application rather than with the wiring. That is why it works in a cloud where you do not own the network, and it is the reason a software-first approach could do what hardware segmentation could not keep up with.",
      "And then the part everyone underestimates, which the company has been honest about. You cannot enforce a rule that nothing talks unless it has a reason to until you know what actually talks to what. In a data centre of any age, nobody does. So the first product problem was not enforcement at all but real-time dependency mapping - working out the actual conversation graph of a running estate - and the name comes from illuminate for exactly that reason.",
      "That is also why the company spent twenty-two months in stealth before showing anything. It raised $12.5M from Andreessen Horowitz and General Catalyst in early 2013, emerged in October 2014 with a $30.2M Series B, and had Morgan Stanley and Plantronics as customers in the first year. A $100M round in 2015 took it past a billion.",
      "Today the framing is zero-trust segmentation and breach containment, and the numbers reported are $557M raised, a $2.75B valuation, revenue past $100M a year, and roughly a fifth of the Fortune 100. Kirner stepped down as chief technology officer in May 2023 after a decade, staying on as an adviser.",
      "Read next to two other entries here, it completes a picture of how the perimeter dissolved. Zscaler moved inspection out to where the users went. Netskope tackled what people were doing inside applications nobody had approved. Illumio addressed the inside of the data centre itself, on the assumption that the other two would sometimes fail. Three companies, three different pieces of the same admission: the boundary that security was organised around had stopped describing anything real.",
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
    official: {
      url: "https://www.elastic.co",
      resources: [
        { label: "Elastic Documentation", url: "https://www.elastic.co/guide" },
      ],
    },
    tags: ["vendor"],
    group: "contemporary",
    name: "Elastic",
    founded: 2012,
    tagline: "Changed its licence to stop a cloud provider, got forked, and changed it back three years later.",
    intro:
      "Shay Banon built Elasticsearch on top of Apache Lucene, having previously written a search library called Compass, and the company around it was founded in 2012. The product did something genuinely useful: it made full-text search over arbitrary JSON documents something a developer could stand up in an afternoon, with a query language that did not require a database administrator.",
    body: [
      "Elasticsearch and Kibana were Apache 2.0, and that licence is permissive by design - anyone may take the code and sell a service built on it, with no obligation to contribute anything back. In 2015 Amazon Web Services began offering exactly that: a managed Elasticsearch service. In 2019, after Elastic released parts of its commercial x-pack features under restrictive licences, AWS launched Open Distro for Elasticsearch as an alternative packaging.",
      "In January 2021, with release 7.11, Elastic moved Elasticsearch and Kibana off Apache 2.0 to a dual licence: the Server Side Public License, originally written by MongoDB, and the new Elastic License. Neither is approved by the Open Source Initiative. Elastic's stated intent at the time was to prevent companies providing its products as a service without collaborating with it, and AWS was named explicitly.",
      "Three different accounts of why exist, and all three are recorded here. Elastic's 2021 position was about resale without collaboration. In 2024 Banon put the emphasis elsewhere, saying the problem was never AWS providing the software - Apache 2.0 permitted that - but calling it Amazon Elasticsearch, which he characterised as clear trademark infringement met with a thousand lawyers. Adrian Cockcroft, formerly of AWS, gave a third version: that AGPL alone would have blocked AWS, and that the real disagreement was AWS wanting to contribute security features to the open project while Elastic wanted to keep security commercial. These accounts are not compatible, they come from named participants, and this page does not adjudicate between them.",
      "In April 2021 AWS forked Elasticsearch and Kibana at version 7.10.2 and created OpenSearch, under Apache 2.0, later placed with the Linux Foundation. Elastic then made its client libraries incompatible with OpenSearch, and OpenSearch wrote its own.",
      "The community reaction is worth quoting rather than summarising, because it is the part that outlasted the argument. Drew DeVault noted that Elasticsearch belonged to its 1,573 contributors, who had granted Elastic a licence to distribute their work and not to relicense it. Simon Phipps of the Open Source Initiative said Elastic had taken what benefit it could from open source and was now spitting out the bones. Corey Quinn's version was shorter: anyone relying on assurances from Elastic should make other plans.",
      "In September 2024 Elastic added AGPLv3, an OSI-approved licence, alongside SSPL and the Elastic License - triple-licensing the core products and making them open source again by any standard definition. Banon's announcement had its sections titled after Kendrick Lamar songs, which is a genuinely unusual document to find in a licensing archive. He said the change had worked: Amazon was fully invested in its fork, the market confusion was mostly resolved, and the partnership with AWS was stronger than ever. He also explicitly denied that the 2021 change had been a mistake.",
      "The commercial reasoning is coherent and the outcome is instructive anyway. The fork did not come back. Practitioners quoted at the time were direct about why: contributors who had watched their Apache-licensed work become someone else's exclusive asset had no reason to return, and trust takes far longer to rebuild than to lose. OpenSearch continues, and the ecosystem that was one project in 2020 is two.",
      "Read alongside two other entries on this timeline, a pattern appears. Tenable closed its open-source scanner in 2005 to fund the company, and the community forked it into OpenVAS. Rapid7 bought an open-source project and kept it open. Elastic closed one, was forked, and reopened it. Three companies, three strategies, and in two of the three the fork is still running. Whether a permissive licence is a gift or a liability depends entirely on who else can afford to operate your software at scale - which is a question nobody had to ask before hyperscale cloud existed.",
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
    tags: ["vendor"],
    group: "other",
    name: "Apple",
    founded: 1976,
    tagline: "Lost the first round of the personal computer market badly, and won every round after it.",
    intro:
      "Apple Computer Company was founded on 1 April 1976 by Steve Jobs, Steve Wozniak and Ronald Wayne, in Cupertino, to sell a hand-built computer Wozniak had designed. Jobs and Wozniak each took 45% and Wayne 10%. Eleven days later Wayne sold his share back for $800, later receiving a further $1,500 to settle it - a decision routinely called the most expensive in the history of startups, and one he made because he had a family and could not carry the risk.",
    body: [
      "The funding was a Volkswagen minibus and a programmable calculator. Jobs sold the van, Wozniak sold his HP-65, and the Apple I went out as a bare circuit board at $666.66 - no case, no keyboard, no monitor, because a fully assembled board was itself the innovation when the alternative was a kit. Around two hundred were sold, and the order that mattered came from Paul Terrell of the Byte Shop, who took fifty.",
      "Wozniak had shown the machine at the Homebrew Computer Club, and that detail links this entry to another on this timeline. Steve Leininger, the engineer Tandy hired to design the TRS-80, was a Homebrew member too. Two of the three machines in what Byte magazine called the 1977 Trinity came out of the same hobbyist meeting in Silicon Valley, which is a reasonable claim for the most productive room in the history of the industry.",
      "Mike Markkula, an Intel veteran, provided $250,000 and the adult supervision, and the company incorporated in January 1977 - by which time Wayne was already gone. The Apple II arrived that April with a case, a keyboard, colour graphics and expansion slots, and it is the machine that made personal computing a market rather than a hobby.",
      "And then it lost. The Tandy entry on this timeline records that in 1980 Tandy shipped three times as many computers as Apple, because Tandy had seven thousand shops and Apple had dealers. Apple's advantage was slower and more durable: open expansion slots meant other companies could build cards for it, and VisiCalc - the first spreadsheet - shipped on the Apple II first. A machine that other people can extend and write software for accumulates reasons to buy it. A machine sold off a convenient shelf accumulates only sales.",
      "The 1980 listing raised $110M. The Lisa in 1983 cost $9,995 and failed. The Macintosh in 1984 was the right idea shipped underpowered. Jobs recruited John Sculley from Pepsi with a line that has outlived both products - whether he wanted to sell sugared water for the rest of his life, or come and change the world - and in September 1985 Sculley removed him from the company. Wozniak had already left in February to become a schoolteacher.",
      "The interesting decade is the bad one. Apple spent the 1990s demonstrating the limits of a closed system in a market that had standardised on somebody else's, and by 1997 its worldwide share was around three per cent. Jobs, meanwhile, had founded NeXT and bought Lucasfilm's computer graphics division, which became Pixar.",
      "So the return happened through an acquisition, and it is the most consequential one on this page: Apple bought NeXT, and NeXT's operating system became the foundation of macOS, and NeXT's founder became Apple's chief executive. A company acquired a supplier and got a new leader, a new kernel and a new decade out of it. Every iPhone runs a descendant of software written by the company Apple's ousted founder built while he was gone.",
      "What follows is well documented elsewhere and does not need retelling here. The part worth keeping on a page about lineage is the shape: Apple is the only company on this timeline that was overtaken, nearly died, bought the company its exiled founder had built, and came back to become the first American company worth three trillion dollars. Every other recovery story here ends in an acquisition by somebody else.",
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
    official: {
      url: "https://www.kaspersky.com",
      resources: [
        { label: "Kaspersky Knowledge Base", url: "https://support.kaspersky.com" },
      ],
    },
    tags: ["vendor"],
    group: "other",
    name: "Kaspersky",
    founded: 1997,
    tagline: "World-class malware research and a geopolitical problem, in the same company, both real.",
    intro:
      "Kaspersky Lab was founded in Moscow in 1997 by four people: Eugene Kaspersky, Natalya Kaspersky, Alexey De-Monderik and Vadim Bogdanov, who left a company called KAMI to keep developing the antivirus engine they had been building since 1991. It was called AVP, for AntiViral Toolkit Pro, and was renamed Kaspersky Anti-Virus after an American firm registered the AVP trademark in the United States.",
    body: [
      "Eugene Kaspersky's route into the field is unusual and it is the fact most often cited about him. At sixteen he entered the Technical Faculty of the KGB Higher School, graduating in 1987 with a degree in mathematical engineering, and served as a software engineer in Soviet military intelligence. His interest in security began prosaically: in 1989 his work computer caught the Cascade virus and he wrote a program to remove it.",
      "Natalya Kaspersky built the business, and that is usually left out. She took over distribution of the toolkit in September 1994, when it was earning one or two hundred dollars a month. Within a year it was making $130,000, in 1996 over $600,000, and in 1997 more than a million - which is what made founding an independent company possible. She launched the company foundation in June 1997, was central to choosing the name, and served as chief executive for more than ten years. The initial split was Eugene 50%, De-Monderik and Bogdanov 20% each, and Natalya 10%.",
      "The break came in 1998. A Taiwanese student released CIH, a virus that overwrote the BIOS and could leave a machine unable to boot at all, and for the first three weeks of the outbreak Kaspersky's product was the only one that could remove it. That single fact produced licensing deals with antivirus companies in Japan, Finland and Germany, and revenue grew 280% between 1998 and 2000 with most of it coming from outside Russia.",
      "The research is the part of this company that its critics rarely dispute. Its teams published on Stuxnet, Flame, Duqu, Red October, Equation Group and ProjectSauron - and the significance is who those operations are attributed to. Stuxnet and Flame are widely attributed to the United States and Israel; Equation Group's toolset was linked to American intelligence. A Russian company built much of its reputation by publishing detailed analysis of Western intelligence operations, while also publishing on Russian-attributed campaigns. Sergey Ulasen, working at a Belarusian firm later acquired into Kaspersky, is generally credited with first identifying Stuxnet.",
      "And then the other half, stated plainly. On 13 September 2017 the US Department of Homeland Security prohibited Kaspersky products across federal agencies, alleging the company had worked on projects with Russia's Federal Security Service. In October 2017, press reports alleged that Russian government hackers had obtained classified material from a contractor's home computer running the software. On 20 June 2024 the US Commerce Department went further, prohibiting sale and use of the software in the United States, and the Treasury sanctioned company leadership. Germany's federal security office had warned against it in March 2022, and the United Kingdom and Australia have imposed restrictions of their own.",
      "The company has denied intelligence ties consistently, describing the allegations as speculation without evidence, and has offered third-party source-code audits and transparency centres in an attempt to address them. Those measures have not changed any government's position.",
      "This page does not resolve that, because the public record does not. What can be said is narrower and more useful: a security product requires more trust than almost any other software, because it runs with the highest privileges, sees everything on the machine, and updates itself continuously from its vendor. The SolarWinds and CrowdStrike entries on this timeline show what happens when that trust is misplaced by accident and by attack. A government reasoning about a vendor subject to a foreign legal system is reasoning about the same property - and it can reach a restrictive conclusion without any specific wrongdoing having been proven.",
      "That is the genuinely instructive thing here, and it applies well beyond one company. Jurisdiction is part of a product's threat model. Where a vendor's engineers can be legally compelled, and by whom, is a security property of the software, and it is not visible in any feature comparison.",
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
    official: {
      url: "https://www.solarwinds.com",
      resources: [
        { label: "SolarWinds Documentation", url: "https://documentation.solarwinds.com" },
      ],
    },
    tags: ["vendor"],
    group: "contemporary",
    name: "SolarWinds",
    founded: 1999,
    tagline: "Sold the software that watches everything, which is exactly why somebody wanted it.",
    intro:
      "SolarWinds was founded in 1999 in Tulsa, Oklahoma by two brothers, Donald Yonce - a former Walmart executive - and David Yonce. The business was unglamorous and very good: affordable network monitoring for the people who actually run networks, sold without the enterprise sales apparatus that made competitors expensive. It moved to Austin, and by 2020 its Orion platform sat inside a very large share of the organisations that matter.",
    body: [
      "The commercial insight was that monitoring was overpriced and oversold. A network engineer who needed to know whether a link was saturated did not want a six-month procurement cycle, and SolarWinds built a catalogue of tools that could be downloaded, trialled and bought on a card. That model took it from Tulsa to a public listing in October 2018, and it bought its way into adjacent categories along the way: Pingdom for external uptime checks, Papertrail for log aggregation, Loggly, AppOptics.",
      "And then the thing that makes this page worth reading. In October 2019, attackers who had already been inside SolarWinds began testing whether they could inject code into the Orion build. Roughly four months later they succeeded, and from 26 March 2020 SolarWinds itself distributed the result - a backdoor the industry named SUNBURST - inside signed, legitimate updates to Orion versions 2019.4 through 2020.2.1.",
      "It was not discovered until December 2020, and not by SolarWinds. FireEye found it while investigating its own compromise, which is worth noting because FireEye appears on this timeline too: a security company found the largest supply chain attack in history by looking into how it had itself been broken into. In April 2021 the US and UK governments attributed the operation to Russia's foreign intelligence service, the SVR - the group tracked as APT29 or Cozy Bear.",
      "The number everyone quotes needs its caveat. Around 18,000 customers received the backdoored update. The US government's own assessment was that a much smaller number were actually compromised by follow-on activity, because the backdoor was a door rather than an occupation - the attackers chose where to walk through it, and they were extremely selective. Repeating 18,000 as a count of victims overstates it, and the distinction between having the malware and being exploited by it is precisely the distinction a security professional is paid to understand.",
      "The response detail that stays with people: SolarWinds could not use its own email to coordinate the investigation, because the attackers were reading it. Staff worked by telephone and outside accounts, during a pandemic, from home. The chief executive later joked that every comma in the initial regulatory filing cost the company $20,000 in legal fees.",
      "Then the argument about blame, which is not settled and is presented here as unsettled. In October 2023 the SEC charged SolarWinds and its chief information security officer, Timothy Brown, with fraud - alleging that from the 2018 listing onward the company disclosed only generic risks while internally knowing about specific deficiencies. SolarWinds called the action an attempt to \"revictimise the victim\" and said its disclosures were accurate. In July 2024 a federal judge dismissed most of the case, including everything relating to disclosures made after the attack, while allowing the claim based on the company's published security statement to proceed.",
      "That outcome is the part with teeth for anyone who works in this field. A named individual was personally charged over how a breach was described, and while most of the case did not survive, the surviving part concerns a marketing page about security practices. What a company says about its own posture became a matter of securities law, and every CISO reading this now writes differently because of it.",
      "The lesson for practitioners is architectural rather than moral, and this site already carries its twin. CrowdStrike's July 2024 outage broke 8.5 million machines because a trusted agent with deep access is updated centrally and rapidly. SUNBURST compromised thousands of networks for the same structural reason. One was an accident and one was an intelligence operation, and the property they exploited was identical: we have built an industry on software that updates itself from a single source, and the trust in that channel is load-bearing.",
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
    official: {
      url: "https://www.tenable.com",
      resources: [
        { label: "Tenable Docs", url: "https://docs.tenable.com" },
      ],
    },
    tags: ["vendor"],
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
    official: {
      url: "https://www.rapid7.com",
      resources: [
        { label: "Rapid7 Docs", url: "https://docs.rapid7.com" },
      ],
    },
    tags: ["vendor"],
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
    tags: ["carrier"],
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
      "And Level 3 had itself been assembling. WilTel, Broadwing, Looking Glass, Progress Telecom, TelCove, TW Telecom in 2014, and Global Crossing in 2011 - which is the entry inside this entry worth reading.",
      "Global Crossing was founded in March 1997 by Gary Winnick and David L. Lee to lay submarine cable, and during the 1999 bubble it was valued at $47B. It never had a single profitable year. In 2002 it filed one of the largest bankruptcies in history, its executives were accused of covering up an accounting scandal, and in 2011 Level 3 bought what remained for $3B including the assumption of $1.1B in debt. Its chief executive at the time was John Legere, who later ran T-Mobile.",
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
    official: {
      url: "https://www.akamai.com",
      resources: [
        { label: "Akamai TechDocs", url: "https://techdocs.akamai.com" },
      ],
    },
    tags: ["vendor", "services"],
    group: "other",
    name: "Akamai Technologies",
    founded: 1998,
    tagline: "Answered a question Tim Berners-Lee posed about congestion, and the answer became most of how the web is delivered.",
    intro:
      "Akamai was incorporated on 20 August 1998 by Tom Leighton, an MIT professor of applied mathematics, and Danny Lewin, his graduate student, with Jonathan Seelig, Preetish Nijhawan and Randall Kaplan. It began as a response to a challenge Tim Berners-Lee had put to MIT: the web was going to get congested, and somebody should work out what to do about it.",
    body: [
      // BODY REDUCED 2026-08-04, when the profile below was written. The prose
      // covered the flash crowd, consistent hashing, the $50K competition and
      // 11 September, all of which the profile now carries with sources.
      //
      // Kept: the MIT licensing arrangement and the Prolexic line, neither of
      // which the profile states.
      "The profile below covers the founding, consistent hashing, the 1999 listing, 11 September 2001, and the move from delivery into security and compute.",
      "Two details sit outside that account. The intellectual property was licensed from MIT rather than owned outright at the start, which is the ordinary arrangement for a university spin-out and a real constraint on an early company. And the security business was assembled as much by purchase as by extension - Prolexic for denial-of-service scrubbing in 2014, later Guardicore for segmentation - on top of capacity that already existed for delivery.",
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
    official: {
      url: "https://www.cloudflare.com",
      resources: [
        { label: "Cloudflare Docs", url: "https://developers.cloudflare.com" },
      ],
    },
    tags: ["vendor", "services"],
    group: "contemporary",
    name: "Cloudflare",
    founded: 2009,
    tagline: "Began as a project asking where spam came from, and became infrastructure after users asked it to stop the spam instead.",
    intro:
      "In 2004 Matthew Prince and Lee Holloway built Project Honey Pot to answer a narrow question: where does email spam actually come from? Anyone with a website could participate, and thousands in more than 185 countries did. The users kept making the same request - do not just track them, stop them - and five years later that request became a company.",
    body: [
      "Prince met Michelle Zatlyn at Harvard Business School during a sabbatical, described the project, and the two of them plus Holloway founded Cloudflare in July 2009. It won the school's business plan competition that April and closed a $2.1M Series A in November from Venrock and Pelion.",
      "The product was a reverse proxy you joined by changing your DNS, which is a genuinely low barrier: no hardware, no software, no contract, and a free tier from the beginning. That freemium decision was strategic rather than generous. Every free site sends traffic through the network, and every attack against a free site is an attack the network learns to recognise for everyone else.",
      "That is the same argument this timeline shows three times before. IronPort made it about email sender reputation in 2002. Zscaler made it about web traffic in 2007. CrowdStrike made it about endpoint behaviour in 2013. Cloudflare made it about the web itself, and got its initial threat data from a spam-tracking project - which is where IronPort had started too.",
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
    official: {
      url: "https://www.f5.com",
      resources: [
        { label: "Product documentation", url: "https://my.f5.com/manage/s/documentation" },
        { label: "DevCentral community", url: "https://community.f5.com" },
      ],
    },
    relationships: ["red-education-partner", "authorized-instructor", "worked-with-directly", "works-with"],
    tags: ["vendor"],
    group: "other",
    name: "F5",
    founded: 1996,
    careerChapter: { slug: "f5", years: "2015 - present" },
    tagline: "Named after a tornado, and spent thirty years moving up the stack from ports to applications.",
    intro:
      "F5 Labs was founded in Seattle in 1996 by Jeff Hussey and Michael Almquist. The name comes from the Fujita scale: F5 is the most powerful tornado category, which was the sort of thing a networking startup called itself in the nineties.",
    body: [
      // BODY REDUCED 2026-08-04. The profile below now carries the founding,
      // the timeline, the products and the innovations, and this prose was
      // telling the same story alongside it - NGINX appeared eight times on the
      // rendered page, Shape six. Ubiquiti is the model: intro carries the
      // thesis, body is a short signpost, the profile does the work.
      //
      // What survives is the one thing the profile does not say: what the
      // architecture means for somebody learning the platform.
      "The profile below covers the 1996 founding, the BIG-IP franchise, the TMOS full-proxy rewrite, the acquisitions from NGINX onward, and the shift into application security.",
      "One consequence is worth stating for anyone learning the platform. Because iRules run TCL per connection on the data path, a great deal of F5 knowledge is specific rather than general: the concepts transfer, but the fluency does not. That is why the certification track is long, and why practitioners tend to be deep in F5 rather than broadly across delivery controllers.",
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
    official: {
      url: "https://www.fortinet.com",
      resources: [
        { label: "Fortinet Document Library", url: "https://docs.fortinet.com" },
      ],
    },
    relationships: ["red-education-partner", "authorized-instructor", "works-with"],
    tags: ["vendor"],
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
    official: {
      url: "https://www.netskope.com",
      resources: [
        { label: "Netskope Knowledge Portal", url: "https://docs.netskope.com" },
      ],
    },
    relationships: ["red-education-partner", "authorized-instructor", "works-with"],
    tags: ["vendor"],
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
    official: {
      url: "https://www.pingidentity.com",
      resources: [
        { label: "Ping Identity Documentation", url: "https://docs.pingidentity.com" },
      ],
    },
    relationships: ["red-education-partner", "works-with"],
    tags: ["vendor"],
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
    official: {
      url: "https://www.zscaler.com",
      resources: [
        { label: "Zscaler Help Portal", url: "https://help.zscaler.com" },
      ],
    },
    relationships: ["red-education-partner", "works-with"],
    tags: ["vendor"],
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
    official: {
      url: "https://www.extremenetworks.com",
      resources: [
        { label: "Extreme Documentation", url: "https://supportdocs.extremenetworks.com" },
      ],
    },
    relationships: ["red-education-partner", "authorized-instructor", "worked-with-directly", "works-with"],
    tags: ["vendor"],
    group: "other",
    name: "Extreme Networks",
    founded: 1996,
    careerChapter: { slug: "extreme", years: "2013 - 2014" },
    tagline: "Networking manufacturer of enterprise switching, wireless and cloud-managed network software.",
    intro:
      "Extreme Networks was founded in 1996 in Santa Clara by Gordon Stitt, Herb Schneider and Stephen Haddock, all from SynOptics, to build Gigabit Ethernet switches for the enterprise. Its early identity was hardware-led: purpose-built silicon, a single operating system, and a deliberately narrow product line at a time when competitors sold catalogues.",
      body: [
      "The strategy that defines it came later, and it is unusual. Rather than compete for greenfield share against Cisco, Extreme bought the enterprise networking businesses that larger companies were exiting - Enterasys in 2013, Zebra's wireless line in 2016, Avaya's networking business in 2017, Brocade's data centre business in 2017, and Aerohive in 2019.",
      "Each of those was somebody else's strategic retreat. Enterasys was what remained of Cabletron, a company that had once been Cisco's most serious rival. Avaya's networking arm traced to Nortel. Brocade's had come from Foundry. Aerohive had been founded by people out of NetScreen. So Extreme's product line is an accumulation of lineages that this timeline covers separately, and its installed base includes customers who bought from four companies that no longer exist.",
      "That creates a specific engineering problem, and the company has been candid about it: several operating systems inherited at once, and a decade of work convincing an installed base to converge on fewer of them. EXOS and VOSS both persist because both came with customers who had no reason to migrate.",
      "The Fabric Connect work, inherited with the Avaya line and originally from Nortel, is the most technically distinctive thing in the portfolio - shortest path bridging used to make service provisioning an edge-only operation. It is the subject of one of this site's tools, and it arrived through an acquisition of an acquisition.",
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
    official: {
      url: "https://www.checkpoint.com",
      resources: [
        { label: "Check Point Support Center", url: "https://support.checkpoint.com" },
      ],
    },
    relationships: ["red-education-partner", "works-with"],
    tags: ["vendor"],
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
    relationships: ["worked-with-directly"],
    tags: ["vendor"],
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
    // CISCO - company history (PRIME step 4, 2026-07-29).
    slug: "cisco",
    official: {
      url: "https://www.cisco.com",
      resources: [
        { label: "Cisco Documentation", url: "https://www.cisco.com/c/en/us/support/index.html" },
      ],
    },
    relationships: ["red-education-partner", "worked-inside"],
    tags: ["vendor"],
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
    official: {
      url: "https://www.paloaltonetworks.com",
      resources: [
        { label: "Palo Alto Networks TechDocs", url: "https://docs.paloaltonetworks.com" },
      ],
    },
    relationships: ["red-education-partner", "worked-with-directly"],
    tags: ["vendor"],
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
    relationships: ["worked-inside"],
    tags: ["vendor"],
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
    relationships: ["worked-inside"],
    tags: ["vendor"],
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
    // /industry/chapters/riverstone; what remains is the company itself. The
    // lineage facts were already verified in the Cabletron research earlier
    // this week.
    slug: "riverstone",
    relationships: ["worked-inside"],
    tags: ["vendor"],
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
    relationships: ["worked-inside"],
    tags: ["vendor"],
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
    official: {
      defunct: true,
    },
    tags: ["vendor", "reseller"],
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
    official: {
      url: "https://www.crowdstrike.com",
    },
    tags: ["vendor"],
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
    official: {
      url: "https://www.splunk.com",
      resources: [
        { label: "Splunk Docs", url: "https://docs.splunk.com" },
      ],
    },
    tags: ["vendor"],
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
    official: {
      url: "https://www.netapp.com",
      resources: [
        { label: "NetApp Documentation", url: "https://docs.netapp.com" },
      ],
    },
    tags: ["vendor"],
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
    official: {
      url: "https://www.sophos.com",
      resources: [
        { label: "Sophos Documentation", url: "https://docs.sophos.com" },
      ],
    },
    tags: ["vendor"],
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
    official: {
      url: "https://www.ivanti.com",
    },
    tags: ["vendor"],
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
      "The company became more widely known after serious vulnerabilities in the VPN appliances it sells, and the reason is structural: a portfolio assembled from a dozen acquisitions inherits a dozen codebases, and the security posture of the whole is the security posture of the weakest piece.",
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
    official: {
      defunct: true,
      successor: { label: "Dell Technologies", url: "https://www.dell.com" },
    },
    tags: ["vendor"],
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
    official: {
      defunct: true,
      successor: { label: "DXC Technology", url: "https://dxc.com" },
    },
    tags: ["services"],
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
    tags: ["services", "vendor"],
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
    official: {
      defunct: true,
    },
    tags: ["vendor"],
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
    official: {
      url: "https://www.apache.org",
      resources: [
        { label: "Apache HTTP Server docs", url: "https://httpd.apache.org/docs/" },
      ],
    },
    tags: ["standards", "vendor"],
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
    official: {
      url: "https://www.arista.com",
      resources: [
        { label: "Arista Documentation", url: "https://www.arista.com/en/support/product-documentation" },
      ],
    },
    // Red Education partner (every regional menu; professional-services page states Red Education delivers Arista training). Verified against
    // rededucation.com 2026-08-06.
    relationships: ["red-education-partner"],
    tags: ["vendor"],
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
    official: {
      url: "https://www.avaya.com",
      resources: [
        { label: "Avaya Support", url: "https://support.avaya.com" },
      ],
    },
    // Red Education partner (Courses by Vendor nav + every regional menu + course catalogue). Verified against
    // rededucation.com 2026-08-06.
    relationships: ["red-education-partner"],
    tags: ["vendor"],
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
    official: {
      url: "https://aws.amazon.com",
      resources: [
        { label: "AWS Documentation", url: "https://docs.aws.amazon.com" },
      ],
    },
    // Red Education partner (course-finder vendor selector only; footer link is an unpublished page_id - WEAKEST EVIDENCE, flagged for PRIME). Verified against
    // rededucation.com 2026-08-06.
    relationships: ["red-education-partner"],
    tags: ["vendor", "datacentre", "services"],
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
    official: {
      url: "https://www.cyberark.com",
      resources: [
        { label: "CyberArk Docs", url: "https://docs.cyberark.com" },
      ],
    },
    // Red Education partner (Courses by Vendor nav + Australasia/SAARC/ASEAN menus). Verified against
    // rededucation.com 2026-08-06.
    relationships: ["red-education-partner"],
    tags: ["vendor"],
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
    official: {
      url: "https://www.epi-ap.com",
    },
    // Red Education partner (Courses by Vendor nav + Americas/Australasia/SAARC/EMEA menus). Verified against
    // rededucation.com 2026-08-06.
    relationships: ["red-education-partner"],
    tags: ["training"],
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
    official: {
      url: "https://www.microsoft.com",
      resources: [
        { label: "Microsoft Learn", url: "https://learn.microsoft.com" },
      ],
    },
    // Red Education partner (course-finder vendor selector). Verified against
    // rededucation.com 2026-08-06.
    relationships: ["red-education-partner"],
    tags: ["vendor"],
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
    official: {
      defunct: true,
      successor: { label: "Ivanti, which acquired MobileIron in 2020", url: "https://www.ivanti.com" },
    },
    // Red Education partner (Australasia/SAARC/ASEAN regional menus). Verified against
    // rededucation.com 2026-08-06.
    relationships: ["red-education-partner"],
    tags: ["vendor"],
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
      "Founded in 2007 in Mountain View, MobileIron helped define MDM as a category and listed on NASDAQ in 2014. In December 2020 it was acquired by Ivanti, together with Pulse Secure, and its technology continues inside Ivanti's unified endpoint management line - the same lineage that runs through the career-era vendors here.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    sources: [
      { label: "Ivanti press release - acquisition of MobileIron and Pulse Secure (Dec 2020)", url: "https://www.ivanti.com/company/press-releases/2020/ivanti-acquires-mobileiron-and-pulse-secure" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "paessler",
    official: {
      url: "https://www.paessler.com",
      resources: [
        { label: "PRTG Manual", url: "https://www.paessler.com/manuals/prtg" },
      ],
    },
    // Red Education partner (Courses by Vendor nav + every regional menu). Verified against
    // rededucation.com 2026-08-06.
    relationships: ["red-education-partner"],
    tags: ["vendor"],
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
    official: {
      url: "https://www.redhat.com",
      resources: [
        { label: "Red Hat Documentation", url: "https://docs.redhat.com" },
      ],
    },
    // Red Education partner (Australasia menu + dedicated rededucation.com/red-hat/ page). Verified against
    // rededucation.com 2026-08-06.
    relationships: ["red-education-partner"],
    tags: ["vendor"],
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
    official: {
      url: "https://www.riverbed.com",
    },
    // Red Education partner (Australasia/SAARC/ASEAN menus; professional-services page states Riverbed Authorised Consulting Partner since 2008). Verified against
    // rededucation.com 2026-08-06.
    relationships: ["red-education-partner"],
    tags: ["vendor"],
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
    // Red Education partner (Australasia/SAARC/ASEAN regional menus). Verified against
    // rededucation.com 2026-08-06.
    relationships: ["red-education-partner"],
    tags: ["vendor"],
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
    tags: ["vendor"],
    group: "other",
    name: "HPE Networking - HP, 3Com, Aruba, Juniper",
    founded: 1939,
    tagline: "The great consolidation: from the Addison Avenue garage to the $14B Juniper merger.",
    intro:
      "Four founding stories converged into one company: Hewlett-Packard (1939), 3Com and the commercialization of Ethernet (1979), Juniper Networks and purpose-built routing silicon (1996), and Aruba Networks and the mobile-first enterprise (2002). HP acquired 3Com in 2010 and Aruba in 2015, split into HP Inc and HPE that same year, and closed the acquisition of Juniper Networks on July 2, 2025 - assembling the industry's broadest challenge to Cisco.",
    body: [],
    note:
      "Neither I nor Red Education delivers HPE, Aruba, or Juniper training. Those courses are run by HPE Education Services and by HPE / Juniper authorized education partners. This page is corporate history - a lineage record of the pioneers, verified against primary sources.",
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
    official: {
      defunct: true,
      successor: { label: "Broadcom", url: "https://www.broadcom.com" },
    },
    tags: ["vendor"],
    group: "other",
    name: "Brocade & Foundry - the Broadcom diaspora",
    founded: 1995,
    tagline: "Two 1990s pioneers, one 2017 dismemberment: SAN to Broadcom, data center to Extreme, campus and Wi-Fi to CommScope.",
    intro:
      "Brocade built the switched Fibre Channel fabric that made storage area networks possible; Foundry shipped the first gigabit Ethernet, Layer 3, and Layer 4-7 switches. They merged in 2008, and in 2017 Broadcom took the combination apart: the SAN business stayed with Broadcom, the Foundry-derived data-center lines went to Extreme Networks, and campus switching plus Ruckus Wi-Fi went to ARRIS, then CommScope - with Belden announced as the next owner in 2026.",
    body: [],
    note:
      "Neither I nor Red Education delivers Brocade or Broadcom training. This page is corporate history, verified against SEC filings and primary sources. One accurate connection: Extreme Networks, which absorbed the Foundry-derived data-center portfolio in 2017, is one of the vendors I am authorized to teach.",
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
    relationships: ["worked-with-directly"],
    // The distribution-years chapter covers FireEye and McAfee among others; it
    // lost its original home when the combined entry was dissolved, and both
    // surviving lineages point at it so neither reader path misses it.
    // PER-VENDOR SPANS, established by PRIME across two messages on 2026-08-05:
    //   FireEye        2015 - 2018   (the Westcon-Comstor half)
    //   McAfee, Ixia   2018 - 2019   (the ScanSource half)
    //
    // The chapter therefore spans 2015 - 2019, which is what it said before -
    // but for a reason that was not written down. It is now.
    careerChapter: { slug: "fireeye-mcafee-ixia", years: "2015 - 2019" },
    tags: ["vendor"],
    group: "other",
    name: "McAfee, FireEye & Mandiant - the road to Trellix",
    founded: 1987,
    tagline: "Three security pioneers, one private-equity remix: Trellix and Skyhigh under STG, Mandiant inside Google Cloud, McAfee consumer private.",
    intro:
      "Three founding stories - McAfee and commercial antivirus (1987), FireEye and virtual-machine detonation (2004), Mandiant and incident response as a discipline (2004) - collided in 2021-2022. Symphony Technology Group carved out McAfee Enterprise ($4.0B) and FireEye's products plus the FireEye name ($1.2B), fused them into Trellix, and spun the SSE portfolio out as Skyhigh Security; the remaining company renamed itself Mandiant and joined Google Cloud; McAfee's consumer business went private for over $14 billion.",
    body: [],
    note:
      "Neither I nor Red Education delivers McAfee, Trellix, FireEye, or Mandiant training. This page is corporate history, verified against SEC filings and primary sources. My own connection is from the distribution side: he carried the FireEye and McAfee lines in Brazil during his Westcon-Comstor and ScanSource years.",
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
    official: {
      url: "https://mikrotik.com",
      resources: [
        { label: "MikroTik Documentation", url: "https://help.mikrotik.com" },
      ],
    },
    tags: ["vendor"],
    group: "other",
    name: "MikroTik - Latvia's quiet giant",
    founded: 1996,
    tagline: "RouterOS on commodity hardware: the company that made carrier-grade routing affordable everywhere - and stayed independent.",
    intro:
      "Founded in Riga in 1996, MikroTik put carrier-grade routing software on ordinary x86 PCs (RouterOS, 1997), then on its own boards (RouterBOARD, 2002). The price-performance formula made it ubiquitous among ISPs and wireless ISPs worldwide - including Brazil - and in 2022 it became the first private company in Latvia to pass EUR 1 billion in value. Still private, still in Riga, still founder-controlled.",
    body: [],
    note:
      "Neither I nor Red Education delivers MikroTik training. This page is corporate history, verified against MikroTik's own company history and public records. My connection is from the field: MikroTik gear is the backbone of countless Brazilian ISP and WISP networks he has worked alongside since the 1990s.",
    sources: [
      { label: "MikroTik - company history (RouterOS 1997; RouterBOARD 2002)", url: "https://mikrotik.com/aboutus" },
      { label: "MikroTik - Wikipedia (founders; 2022 EUR 1.30B; first Latvian private company past EUR 1B)", url: "https://en.wikipedia.org/wiki/MikroTik" },
    ],
  },
  {
    slug: "radware",
    official: {
      url: "https://www.radware.com",
    },
    tags: ["vendor"],
    group: "other",
    name: "Radware - the Zisapel lineage",
    founded: 1997,
    tagline: "Born of Israel's RAD Group in 1997; the ADC and DDoS specialist that rescued Alteon from Nortel's wreckage for ~$18M.",
    intro:
      "A father-and-son founding inside Israel's most storied networking family: RAD Group patriarch Yehuda Zisapel and his son Roy, CEO since inception. Radware IPO'd on NASDAQ in 1999, built the DefensePro DDoS line, and in April 2009 bought Nortel's legendary Alteon application-switching assets out of bankruptcy for about $18 million - instantly a top-three ADC vendor. Still independent, still founder-led.",
    body: [],
    note:
      "Neither I nor Red Education delivers Radware training. This page is corporate history, verified against SEC filings and primary sources. Radware competes in the application delivery market where I teach F5 daily - knowing the rivals is part of knowing the market.",
    sources: [
      { label: "Radware SEC 6-K FY2009 - founders' biographies (inception dated May 1996)", url: "https://www.sec.gov/Archives/edgar/data/0001094366/000117891309001371/exhibit_1-1.htm" },
      { label: "Network World (Apr 2009) - Radware pays $18M for Nortel's Alteon assets", url: "https://www.networkworld.com/article/2267100/radware-pays--18-million-for-nortel-s-alteon-assets.html" },
      { label: "Radware - Wikipedia (April 1997; stakes; acquisitions)", url: "https://en.wikipedia.org/wiki/Radware" },
    ],
  },
  {
    slug: "imperva-thales",
    official: {
      url: "https://www.imperva.com",
      resources: [
        { label: "Imperva Documentation", url: "https://docs.imperva.com" },
      ],
    },
    tags: ["vendor"],
    group: "other",
    name: "Imperva - from WebCohort to Thales",
    founded: 2002,
    tagline: "The WAF pioneer founded by a Check Point co-founder, now the application-security arm of a French defense giant.",
    intro:
      "Founded in Israel in 2002 as WebCohort by Shlomo Kramer (co-founder of Check Point, later founder of Cato Networks), Amichai Shulman, and Mickey Boodaei, the company shipped SecureSphere in 2003 and helped define the web application firewall category. NYSE IPO in 2011, a $2.1 billion Thoma Bravo take-private in January 2019, and a $3.6 billion acquisition by Thales completed on December 4, 2023.",
    body: [],
    note:
      "Neither I nor Red Education delivers Imperva or Thales training. This page is corporate history, verified against primary sources. Imperva pioneered the WAF market I teach through F5 Advanced WAF - the rivals' history is the market's history.",
    sources: [
      { label: "Imperva - Wikipedia (WebCohort 2002; SecureSphere 2003; Thales completed Dec 4, 2023)", url: "https://en.wikipedia.org/wiki/Imperva" },
      { label: "Globes (Jul 25, 2023) - Thales acquires Imperva for $3.6B; Thoma Bravo Jan 2019 $2.1B; founders' later startups", url: "https://en.globes.co.il/en/article-thales-acquires-cybersecurity-co-imperva-for-36b-1001453187" },
      { label: "Times of Israel (Jul 25, 2023) - founder backgrounds", url: "https://www.timesofisrael.com/israeli-founded-imperva-is-snapped-up-by-frances-thales-in-3-6b-cybersecurity-deal/" },
    ],
  },
  {
    slug: "versa",
    official: {
      url: "https://versa-networks.com",
    },
    tags: ["vendor"],
    group: "other",
    name: "Versa Networks - the SASE independent",
    founded: 2012,
    tagline: "Two ex-Riverstone, ex-Juniper brothers building unified SASE - one of the last large independents in a consolidated market.",
    intro:
      "Founded in 2012 by brothers Kumar and Apurva Mehta after eight years leading Juniper's MX series - and, before that, senior roles at Riverstone Networks, where I worked from 2000 to 2002. Versa built networking and security as one multi-tenant software stack years before Gartner named the category SASE, raised roughly $316 million while rivals sold to Cisco, VMware, Aruba, and Palo Alto, and remains independent.",
    body: [],
    note:
      "Neither I nor Red Education delivers Versa training. This page is corporate history, verified against Versa's own leadership biographies and primary sources. The lineage connection is real: both founders built at Riverstone Networks - my Santa Clara employer, 2000-2002 - before their Juniper years.",
    sources: [
      { label: "Versa Networks - leadership biographies (Riverstone, Yago, Centillion; Juniper MX)", url: "https://versa-networks.com/about/leadership/" },
      { label: "TechCrunch (Oct 27, 2022) - $120M round; Ahuja CEO since 2016; consolidation context", url: "https://techcrunch.com/2022/10/27/versa-raises-120m-for-its-software-defined-networking-and-security-stack/" },
      { label: "Tracxn - $316M total over 6 rounds; first round Nov 26, 2012", url: "https://tracxn.com/d/companies/versa-networks/__wlcJlkKIuL61D2aM_ev5JQIkme5Hbd0Mne4_z3tmlfY" },
    ],
  },
  {
    slug: "nortel-bay",
    tags: ["vendor"],
    group: "other",
    name: "Nortel & Bay Networks - the giant that vanished",
    founded: 1895,
    tagline: "From 1895 Montreal to a third of Canada's stock index to the largest bankruptcy in Canadian history - and the $4.5B patent auction that ended it.",
    intro:
      "Northern Electric (1895) became Northern Telecom, bet everything on digital switching in 1976, and grew into Nortel - worth C$398 billion at the 2000 peak, more than a third of the entire Toronto Stock Exchange. Along the way it swallowed Bay Networks (the 1994 SynOptics-Wellfleet merger) for $9.1 billion and Alteon WebSystems for $7.8 billion. The collapse erased it all: the January 14, 2009 filing was the largest corporate failure in Canadian history, the pieces scattered to Ericsson, Avaya, Ciena, Radware, and eventually Extreme Networks, and the 2011 Rockstar patent auction - $4.5 billion, against Google's pi-themed bids - was the tombstone.",
    body: [
      "Both halves of the 1994 merger now have their own entries here: Wellfleet built the multiprotocol routers and SynOptics built the twisted-pair wiring hubs. Reading them together is the point - a router company and a hub company each held one half of what an enterprise network needed and neither had the other\u2019s channel, which is why the merger made sense on paper and why the combined firm struggled to become one company rather than two under a new name.",
    ],
    note:
      "Nortel, Bay Networks, SynOptics, and Wellfleet no longer exist as companies, and no training association is implied with them or their successors. This page is corporate history, verified against SEC filings and primary sources. My connection is from the other side of the battlefield: he spent 1996-2000 at Cabletron Systems, Bay Networks' direct rival in the hub-and-switch wars - and the Bay-descended enterprise portfolio now lives at Extreme Networks, one of the vendors I teach.",
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
    official: {
      defunct: true,
    },
    tags: ["vendor"],
    group: "other",
    name: "Madge Networks - Token Ring's standard-bearer",
    founded: 1986,
    tagline: "From a Buckinghamshire farm to beating IBM in court at IBM's own game - and down with the protocol it championed: 'the Betamax of the networking world.'",
    intro:
      "Robert Madge founded the company on his family's farm in 1986 with no new technology at all - just the bet that IBM's Token Ring could be built better and sold harder than IBM did. He won the court fight that made it royalty-free, rode the ring to more than 25 countries and the Sunday Times Rich List, hedged with Israel's Lannet (sold to Lucent for $117 million in 1998), and absorbed rival Olicom's Token Ring business in 1999 - by which point the ring was 81 percent of sales, a market shrinking beneath its last champion. A Dutch court granted the bankruptcy order in 2003; the remains ended up at Ringdale, crowned the world's largest supplier of Token Ring technology after the world had stopped buying it.",
    body: [],
    note:
      "Madge Networks no longer exists as an operating company, and no training association is implied with it or any successor. This page is corporate history, verified against Madge's SEC filings and primary sources. My connection is from the opposite trench of the great protocol war: at Cabletron from 1996 to 2000, he fought for Ethernet in the IBM-shop accounts - common in Brazil - where Madge's Token Ring was the incumbent. Every hub-war page in this section tells Ethernet's side; this one honors the technology that lost.",
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
    official: {
      defunct: true,
      successor: { label: "Oracle, which acquired Sun in 2010", url: "https://www.oracle.com" },
    },
    sources: [
      { label: "Sun Microsystems", url: "https://en.wikipedia.org/wiki/Sun_Microsystems" },
    ],
    tags: ["vendor"],
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
    official: {
      defunct: true,
      successor: { label: "Hewlett Packard Enterprise, which acquired SGI in 2016", url: "https://www.hpe.com" },
    },
    sources: [
      { label: "Silicon Graphics", url: "https://en.wikipedia.org/wiki/Silicon_Graphics" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Silicon Graphics - the geometry of Hollywood",
    founded: 1982,
    tagline: "Jim Clark's geometry engines rendered Jurassic Park and invented OpenGL; the name ended at HPE in 2016.",
    intro: "SGI built the machines that taught computers to see: geometry pipelines, IRIX on MIPS, and the purple workstations behind a decade of movie magic. Its fall is as instructive as its rise - commodity PCs ate the graphics market SGI created, and OpenGL outlived the company that wrote it.",
    body: ["Founder Jim Clark left in 1994 to co-found Netscape; the company's Cray chapter, its two bankruptcies, and the 2016 HPE acquisition close the loop told in the profile below."],
  },
  {
    slug: "xerox",
    sources: [
      { label: "Xerox", url: "https://en.wikipedia.org/wiki/Xerox" },
    ],
    tags: ["vendor", "standards"],
    group: "other",
    name: "Xerox - the company that fumbled the future",
    founded: 1906,
    tagline: "Xerography built the empire; PARC invented Ethernet, the GUI, and laser printing - and networking's history runs through that lab.",
    intro: "Xerox matters to this site for one building above all: the Palo Alto Research Center, where Ethernet itself was invented in 1973. The copier giant commercialized almost none of what PARC created - the most productive fumble in technology history - and its own print business marches on, completing the Lexmark acquisition in 2025.",
    body: ["From Chester Carlson's xerography patent to Bob Metcalfe's Ethernet memo, the profile below follows both the empire and the laboratory that gave this industry its wires."],
  },
  {
    slug: "dec",
    official: {
      defunct: true,
      successor: { label: "HP, via Compaq, which acquired Digital in 1998", url: "https://www.hp.com" },
    },
    sources: [
      { label: "Digital Equipment Corporation", url: "https://en.wikipedia.org/wiki/Digital_Equipment_Corporation" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Digital Equipment Corporation - the minicomputer king",
    founded: 1957,
    tagline: "Ken Olsen's PDP and VAX machines defined two decades of computing; DEC co-authored Ethernet and ended inside Compaq in 1998.",
    intro: "DEC took computing out of the glass house: the PDP-8 made computers departmental, the PDP-11 made them ubiquitous, and VAX/VMS made them an architecture empire. DEC also co-signed the DIX Ethernet standard with Intel and Xerox - the reason this industry cables the way it does.",
    body: ["The profile traces Maynard's woolen mill to the $9.6 billion Compaq acquisition - then the largest in computer history - and the VMS-to-Windows-NT bloodline that followed the people out."],
  },
  {
    slug: "nokia",
    official: {
      url: "https://www.nokia.com",
      resources: [
        { label: "Nokia Documentation", url: "https://documentation.nokia.com" },
      ],
    },
    sources: [
      { label: "Nokia", url: "https://en.wikipedia.org/wiki/Nokia" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Nokia - from paper mill to network giant",
    founded: 1865,
    tagline: "A 160-year arc: rubber boots to world phone leader to one of the three companies that build the world's mobile networks.",
    intro: "Nokia is the industry's great shapeshifter: an 1865 Finnish paper mill that became the world's largest phone maker, lost that crown in the smartphone wars, and rebuilt itself as a networks powerhouse - absorbing Alcatel-Lucent and Bell Labs in 2016 and optical vendor Infinera in 2025.",
    body: ["The profile follows every act, through the Microsoft phone sale, the Siemens joint venture, and the 2025 leadership change that put a data-center executive at the helm."],
  },
  {
    slug: "ericsson",
    official: {
      url: "https://www.ericsson.com",
    },
    sources: [
      { label: "Ericsson", url: "https://en.wikipedia.org/wiki/Ericsson" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Ericsson - 150 years of telephony",
    founded: 1876,
    tagline: "From an 1876 Stockholm telegraph workshop to the AXE switch, GSM, Bluetooth, and today's 5G triumvirate.",
    intro: "Ericsson has been building the telephone network since the telephone was new. The AXE digital switch wired the world, its engineers were central to GSM, a 1990s Ericsson project gave the world Bluetooth, and today it stands with Nokia and Huawei as one of three companies that can build a national mobile network end to end.",
    body: ["The profile below runs from Lars Magnus Ericsson's workshop through the Sony Ericsson decade to the modern 5G and enterprise-wireless era."],
  },
  {
    slug: "huawei",
    official: {
      url: "https://www.huawei.com",
      resources: [
        { label: "Huawei Support", url: "https://support.huawei.com/enterprise" },
      ],
    },
    sources: [
      { label: "Huawei", url: "https://en.wikipedia.org/wiki/Huawei" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Huawei - the Shenzhen ascent",
    founded: 1987,
    tagline: "From a 1987 PBX reseller to the world's largest telecom equipment maker - and the center of the decade's biggest technology-policy storm.",
    intro: "Huawei's rise is the defining industrial story of modern networking: founded in Shenzhen in 1987 with about 21,000 yuan, it out-engineered and out-priced the incumbents until it led the world in telecom equipment. The 2019 United States Entity List placed it at the center of the technology-sovereignty era, and its silicon comeback since is a story still being written.",
    body: ["The profile tells the arc factually - the rural-first strategy, HiSilicon, the sanctions years, and the employee-owned structure - from the public record."],
  },
  {
    slug: "siemens",
    official: {
      url: "https://www.siemens.com",
    },
    sources: [
      { label: "Siemens", url: "https://en.wikipedia.org/wiki/Siemens" },
    ],
    tags: ["vendor", "services"],
    group: "other",
    name: "Siemens - the 1847 telegraph startup",
    founded: 1847,
    tagline: "Werner von Siemens built the Indo-European telegraph line; the conglomerate's communications bloodline runs through EWSD, the Nokia JV, and Unify.",
    intro: "Siemens is the oldest company in this section by decades: an 1847 Berlin workshop whose pointer telegraph grew into a global electrical empire. Its communications lineage - telephone exchanges, the EWSD switch, Nokia Siemens Networks, and the Unify enterprise-communications line - threads through half the industry's history, while today's Siemens leads industrial automation and its networking.",
    body: ["The profile follows the telegraph century, the telecom exits, and where the communications bloodlines ended up."],
  },
  {
    slug: "novell",
    official: {
      defunct: true,
      successor: { label: "OpenText, which holds the Novell portfolio", url: "https://www.opentext.com" },
    },
    sources: [
      { label: "Novell", url: "https://en.wikipedia.org/wiki/Novell" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Novell - the network operating system",
    founded: 1983,
    tagline: "NetWare owned the LAN era and IPX ran the world's offices; the lineage ended at OpenText in 2023.",
    intro: "Before TCP/IP won, the corporate network spoke IPX and logged into NetWare - and an entire profession grew up around Novell certifications. The company that defined the network operating system then spent two decades searching for a second act: UnixWare, WordPerfect, SUSE, the Microsoft pact, and a chain of acquisitions ending at OpenText in 2023.",
    body: ["The profile below is LAN-era history in full: Ray Noorda's coopetition, the Utah empire, and the long unwinding."],
  },
  {
    slug: "oracle",
    official: {
      url: "https://www.oracle.com",
      resources: [
        { label: "Oracle Help Center", url: "https://docs.oracle.com" },
      ],
    },
    sources: [
      { label: "Oracle Corporation", url: "https://en.wikipedia.org/wiki/Oracle_Corporation" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Oracle - the database empire",
    founded: 1977,
    tagline: "The first commercial SQL database, four decades of acquisitions - Sun included - and 2025's handover to co-CEOs for the AI era.",
    intro: "Oracle commercialized the relational database before IBM, its inventor's employer, got around to it - and has compounded that head start for nearly fifty years. Its acquisition machine reshaped the industry map, absorbing PeopleSoft, BEA, Sun Microsystems, NetSuite, and Cerner, and its 2025 leadership handover to co-CEOs marks the pivot to the AI-infrastructure era.",
    body: ["The profile runs from the CIA project that named the company to the September 2025 succession, verified against Oracle's own SEC filings."],
  },
  {
    slug: "ibm",
    official: {
      url: "https://www.ibm.com",
      resources: [
        { label: "IBM Documentation", url: "https://www.ibm.com/docs" },
      ],
    },
    sources: [
      { label: "IBM", url: "https://en.wikipedia.org/wiki/IBM" },
    ],
    tags: ["vendor", "services"],
    group: "other",
    name: "IBM - the century company",
    founded: 1911,
    tagline: "Punched cards to System/360 to the PC to Red Hat: the company the rest of the industry defined itself against.",
    intro: "For most of computing's history, IBM was the industry: the tabulating monopoly, the $5 billion System/360 bet that created the mainframe world, the PC that accidentally crowned Microsoft and Intel, and the services turnaround that saved it. Its networking fingerprints - SNA, Token Ring - run through several other pages in this section, and the 2019 Red Hat acquisition ties it to the open-source lineage told there.",
    body: ["The profile compresses eleven decades into the moments that shaped this industry, Token Ring wars included."],
  },
  {
    slug: "sap",
    official: {
      url: "https://www.sap.com",
      resources: [
        { label: "SAP Help Portal", url: "https://help.sap.com" },
      ],
    },
    sources: [
      { label: "SAP", url: "https://en.wikipedia.org/wiki/SAP" },
    ],
    tags: ["vendor"],
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
    official: {
      defunct: true,
      successor: { label: "Hewlett Packard Enterprise, which acquired 3Com in 2010", url: "https://www.hpe.com" },
    },
    sources: [
      { label: "3Com", url: "https://en.wikipedia.org/wiki/3Com" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "3Com - Ethernet leaves the lab",
    founded: 1979,
    tagline: "Bob Metcalfe commercialized his own PARC invention; EtherLink wired the PC era, Palm rode along, and the story ended at HP in 2010.",
    intro: "3Com is the second half of the Ethernet story this section starts on the Xerox page: Metcalfe left PARC in 1979 to sell the network he had invented, and the EtherLink card put Ethernet inside the IBM PC itself. Computers, Communication, Compatibility - the three Coms - became the connectivity company of the LAN decade.",
    body: ["From the first PC Ethernet adapters through the US Robotics merger that brought Palm aboard, to the H3C venture in China and the 2010 HP acquisition - the profile below follows the wire out of the lab and into everything."],
  },
  {
    slug: "compaq",
    official: {
      defunct: true,
      successor: { label: "HP, which merged with Compaq in 2002", url: "https://www.hp.com" },
    },
    sources: [
      { label: "Compaq", url: "https://en.wikipedia.org/wiki/Compaq" },
    ],
    tags: ["vendor"],
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
    official: {
      defunct: true,
      successor: { label: "the Mozilla project, which grew from the Netscape source release", url: "https://www.mozilla.org" },
    },
    sources: [
      { label: "Netscape", url: "https://en.wikipedia.org/wiki/Netscape" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Netscape - the company that opened the web",
    founded: 1994,
    tagline: "Clark and Andreessen's Navigator took the internet mainstream; SSL, JavaScript, and the cookie were invented here - the browser lost the war, the inventions won everything.",
    intro: "No company on this page matters more to this site's daily subject matter: SSL - the ancestor of every TLS session the tools here decode - was designed at Netscape, as were JavaScript and the HTTP cookie. The Navigator browser took the web from academia to everyone, triggered the browser wars, and left behind Mozilla and the open web itself.",
    body: ["From Jim Clark's post-SGI second act and the 1995 IPO that started the dot-com era, to the AOL acquisition and the Firefox afterlife - the profile follows the fifty-one months that rewired the world."],
  },
  {
    slug: "motorola",
    sources: [
      { label: "Motorola", url: "https://en.wikipedia.org/wiki/Motorola" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Motorola - the radio century",
    founded: 1928,
    tagline: "Car radios to the walkie-talkie to the first handheld cell call and the moon itself; split in 2011 into Solutions and a Mobility arm that passed through Google to Lenovo.",
    intro: "Motorola put radio everywhere: in cars in the 1930s, on soldiers' backs in the 1940s, on the Moon in 1969, and in Martin Cooper's hand for the first handheld cellular call in 1973. The century company split in 2011 - Motorola Solutions carries the mission-critical radio and public-safety network lineage today, while the phone side journeyed through Google to Lenovo.",
    body: ["The profile covers the Galvin brothers' Chicago startup, the DynaTAC and RAZR eras, the Iridium gamble, the 68000 processor family that powered a computing generation, and both halves of the split."],
  },
  {
    slug: "unisys",
    sources: [
      { label: "Unisys", url: "https://en.wikipedia.org/wiki/Unisys" },
    ],
    tags: ["vendor", "services"],
    group: "other",
    name: "Unisys - computing's oldest bloodlines",
    founded: 1886,
    tagline: "Burroughs (1886) plus Sperry's UNIVAC - the ENIAC creators' company - merged in 1986: the deepest lineage in this section, still running ClearPath descendants today.",
    intro: "Unisys is where computing's two oldest commercial bloodlines meet: William Seward Burroughs's 1886 adding-machine company, and Sperry's UNIVAC division - built on Eckert and Mauchly, the engineers of ENIAC itself, whose UNIVAC I of 1951 was America's first commercial computer and famously called the 1952 election on CBS. The 1986 merger created Unisys; the mainframe heritage survives in ClearPath.",
    body: ["The profile traces both trunks - the adding machine and ENIAC - through the 1986 merger, the services pivot, and the modern company."],
  },
  {
    slug: "data-general",
    official: {
      defunct: true,
      successor: { label: "Dell, via EMC", url: "https://www.dell.com" },
    },
    sources: [
      { label: "Data General", url: "https://en.wikipedia.org/wiki/Data_General" },
    ],
    tags: ["vendor"],
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
    sources: [
      { label: "Marconi Company", url: "https://en.wikipedia.org/wiki/Marconi_Company" },
      { label: "Marconi Communications", url: "https://en.wikipedia.org/wiki/Marconi_plc" },
    ],
    tags: ["vendor", "carrier"],
    group: "other",
    name: "Marconi - wireless itself, then the bubble",
    founded: 1897,
    tagline: "Guglielmo Marconi bridged the Atlantic in 1901; a century later the company bearing his name became telecom's starkest dot-com cautionary tale, carved up by Ericsson in 2006.",
    intro: "Marconi is two stories a century apart: the man who made radio a business - transatlantic signals in 1901, the operators aboard Titanic in 1912 - and the GEC conglomerate that took his name in 1999, bet its fortune on telecom equipment at the bubble's exact top, and collapsed within two years. Few lineages contain both the birth of an industry and its most instructive corporate death.",
    body: ["The profile follows the Wireless Telegraph and Signal Company through GEC's electronics empire, the 1999 renaming and acquisition spree, the 2001 collapse, and the 2006 Ericsson carve-up that ended the name in networking."],
  },
  {
    slug: "wang",
    official: {
      defunct: true,
    },
    sources: [
      { label: "Wang Laboratories", url: "https://en.wikipedia.org/wiki/Wang_Laboratories" },
    ],
    tags: ["vendor"],
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
    official: {
      defunct: true,
      successor: { label: "Hewlett Packard Enterprise, via Compaq", url: "https://www.hpe.com" },
    },
    sources: [
      { label: "Tandem Computers", url: "https://en.wikipedia.org/wiki/Tandem_Computers" },
    ],
    tags: ["vendor"],
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
    official: {
      defunct: true,
    },
    sources: [
      { label: "Banyan Systems", url: "https://en.wikipedia.org/wiki/Banyan_Systems" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Banyan Systems - the directory pioneer",
    founded: 1983,
    tagline: "VINES and StreetTalk delivered a true global directory service years before NDS or Active Directory - and lost anyway; the idea won everywhere.",
    intro: "Banyan solved enterprise networking's hardest problem first: StreetTalk, the global naming and directory service inside VINES, let a user log in anywhere on a worldwide network years before Novell's NDS or Microsoft's Active Directory existed. The United States Marine Corps ran on it. Being right early, against NetWare's channel and NT's bundling, was not enough.",
    body: ["The profile pairs naturally with the Novell page: the 1983 founding, the Unix-based VINES architecture, StreetTalk's design lead, the loss of the platform war, and the quiet 2000s dissolution of the company whose core idea now runs every enterprise on earth."],
  },
  {
    slug: "fujitsu",
    sources: [
      { label: "Fujitsu", url: "https://en.wikipedia.org/wiki/Fujitsu" },
    ],
    tags: ["vendor", "services"],
    group: "other",
    name: "Fujitsu - Japan's computing standard-bearer",
    founded: 1935,
    tagline: "Born from a 1935 Fuji Electric spin-off (itself a Furukawa-Siemens venture), Fujitsu fought IBM with Amdahl, absorbed ICL, and built the K and Fugaku supercomputers.",
    intro: "Fujitsu carries Japan's mainframe century: FACOM computers from the 1950s, the Amdahl partnership that took the IBM-compatible fight to IBM's own customers, the ICL acquisition that made it a European power, and the K and Fugaku machines that twice topped the world's supercomputer rankings. Its optical and network businesses wire a substantial share of the Pacific.",
    body: ["The profile traces the Siemens-adjacent founding lineage, the plug-compatible wars, the services transformation into Japan's largest IT company, and the ARM-based Fugaku era."],
  },
  {
    slug: "nec",
    sources: [
      { label: "NEC", url: "https://en.wikipedia.org/wiki/NEC" },
    ],
    tags: ["vendor", "services"],
    group: "other",
    name: "NEC - Japan's first joint venture",
    founded: 1899,
    tagline: "Founded 1899 with Western Electric capital; NEAX switched the world's calls, the PC-98 owned Japan's PC market, and the C&C vision named the convergence everyone now lives in.",
    intro: "NEC was Japan's first joint venture with foreign capital - Western Electric, 1899 - and grew into the country's communications backbone: NEAX exchanges, satellites, submarine cable systems, and the SX vector supercomputers behind the Earth Simulator. Its PC-8001 and PC-98 lines dominated Japan's personal-computer market for over a decade, and Koji Kobayashi's 1977 'C&C' - Computers and Communications - named the convergence this whole industry became.",
    body: ["The profile covers the Western Electric founding, the switching and space decades, the PC-98 era, the world-number-one semiconductor years that ended in the Renesas merger, and today's biometrics and submarine-cable strengths."],
  },
  {
    slug: "bell-labs-lucent-alcatel",
    sources: [
      { label: "Bell Labs", url: "https://en.wikipedia.org/wiki/Bell_Labs" },
      { label: "Lucent Technologies", url: "https://en.wikipedia.org/wiki/Lucent_Technologies" },
      { label: "Alcatel-Lucent", url: "https://en.wikipedia.org/wiki/Alcatel-Lucent" },
    ],
    tags: ["vendor", "standards"],
    group: "other",
    name: "Bell Labs, Lucent & Alcatel - the transistor's bloodline",
    founded: 1898,
    tagline: "The transistor, information theory, Unix, the laser, cellular - ten Nobel Prizes of foundations, spun into Lucent in 1996, merged with Alcatel in 2006, carried into Nokia in 2016.",
    intro: "No institution shaped this industry more than Bell Telephone Laboratories: the 1947 transistor, Shannon's 1948 information theory, Unix and C, the CCD, the cellular concept. Its corporate afterlife - the record-setting Lucent IPO, the bubble's hardest fall, the Alcatel merger, the Nokia acquisition - is the industry's sharpest lesson that inventing the future and capturing its value are different skills.",
    body: ["The profile covers the 1925 founding, the 1947-1969 invention run, the 1996 trivestiture and Lucent's rise and fall, Alcatel's CGE-to-ITT ascent, the 2006 merger, and the 2016 passage into Nokia - where Bell Labs continues."],
  },
  {
    slug: "intel-amd",
    sources: [
      { label: "Intel", url: "https://en.wikipedia.org/wiki/Intel" },
      { label: "AMD", url: "https://en.wikipedia.org/wiki/Advanced_Micro_Devices" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Intel & AMD - Fairchild's children: the x86 rivalry",
    founded: 1968,
    tagline: "The 4004, Moore's Law, and the second source that wrote AMD64 - one entry, because neither story parses without the other.",
    intro: "Both companies walked out of Fairchild Semiconductor a year apart - Noyce and Moore in 1968, Jerry Sanders in 1969 - and spent the next half-century pricing computing for everyone. Intel invented the commercial microprocessor and set the industry's cadence; AMD went from licensed second source to the author of the 64-bit x86 instruction set the whole world (Intel included) now runs.",
    body: ["The profile covers the Fairchild exodus, the 4004 and the IBM PC's dual-source mandate, the memory exit, the gigahertz race, the AMD64 irony, Zen's comeback, and the duopoly's diverging bets."],
  },
  {
    slug: "rand",
    official: {
      defunct: true,
      successor: { label: "the RAND Corporation, which continues as a research institution", url: "https://www.rand.org" },
    },
    sources: [
      { label: "RAND Corporation", url: "https://en.wikipedia.org/wiki/RAND_Corporation" },
    ],
    tags: ["standards"],
    group: "other",
    name: "RAND Corporation - where packet switching was imagined",
    founded: 1948,
    tagline: "Paul Baran's 1964 'On Distributed Communications' argued a network with no center could survive anything - AT&T declined to build it; the internet did.",
    intro: "A Santa Monica think tank, not a vendor - included on merit no vendor matches. RAND built the postwar decision sciences (game theory's workshop, linear programming, the Delphi method), ran early AI on its own JOHNNIAC, and employed the engineer whose eleven 1964 reports specified distributed, message-block, store-and-forward networking: the conceptual root of every router on these pages.",
    body: ["The profile covers Project RAND's 1946 origins, the mathematical toolkit years, Baran's survivability argument and its parallel invention by Donald Davies, and the flow of the idea into the ARPANET."],
  },
  {
    slug: "cyclades-network",
    tags: ["standards"],
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
    sources: [
      { label: "Toshiba", url: "https://en.wikipedia.org/wiki/Toshiba" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Toshiba - the company that gave the world flash",
    founded: 1875,
    tagline: "Fujio Masuoka invented NOR and then NAND flash at Toshiba in the 1980s - every SSD, phone, and memory card descends from it; the T1100 started the laptop era.",
    intro: "From an 1875 telegraph works founded by a maker of mechanical dolls to the conglomerate that invented flash memory and the mass-market laptop - and then, through the Westinghouse disaster and the accounting scandal, sold the memory crown jewels (today's Kioxia) and left the stock exchange after 74 years. One immortal contribution bracketed by a very mortal corporate story.",
    body: ["The profile covers the Tanaka and Hakunetsusha roots, the 1939 merger, the JW-10 and T1100 firsts, Masuoka's NOR and NAND inventions, the DVD and HD DVD chapters, and the Westinghouse-to-Kioxia unwinding."],
  },
  {
    slug: "hitachi",
    sources: [
      { label: "Hitachi", url: "https://en.wikipedia.org/wiki/Hitachi" },
    ],
    tags: ["vendor", "services"],
    group: "other",
    name: "Hitachi - the industrial giant that stores the world",
    founded: 1910,
    tagline: "From a mine's five-horsepower motor in 1910 to VSP arrays, HGST drives, and Britain's express trains - the conglomerate whose storage lineage runs through every SAN.",
    intro: "Namihei Odaira believed Japan should build its own machines; the repair shop he ran became one of the broadest engineering companies on earth. For this site's purposes the storage line matters most: the plug-compatible mainframe wars (and the 1982 FBI sting), Hitachi Data Systems' enterprise arrays, and the 2003 purchase of IBM's disk-drive business - the company that invented the hard drive, absorbed and carried forward.",
    body: ["The profile covers the 1910 founding, rail from 1924 to the UK fleets, the mainframe era and the IBM case, HDS to Vantara, HGST to Western Digital, and the Lumada-era pivot to data."],
  },
  {
    slug: "bull",
    sources: [
      { label: "Groupe Bull", url: "https://en.wikipedia.org/wiki/Groupe_Bull" },
    ],
    tags: ["vendor", "services"],
    group: "other",
    name: "Bull - Europe's computing champion",
    founded: 1931,
    tagline: "Punch-card wars against IBM in the 1930s, the prophetic Gamma 60, nationalization and privatization - and a final act building Europe's first exascale supercomputer.",
    intro: "Founded on a Norwegian engineer's tabulator patents, Compagnie des Machines Bull spent ninety years as the definitive national champion: fighting IBM card format against card format, surviving GE and Honeywell ownership, nationalization under Mitterrand, and privatization - to end up, inside Atos/Eviden, building the BullSequana machines that power JUPITER, Europe's first exascale system. The GECOS field in /etc/passwd is its Unix-era fingerprint.",
    body: ["The profile covers Fredrik Rosing Bull's patents, the Gamma 3 and Gamma 60, Plan Calcul and CII-Honeywell-Bull, the Groupe Bull years, the HPC pivot from Tera-10 to BullSequana, and the Atos/Eviden exascale finale."],
  },
  {
    slug: "ncsa",
    sources: [
      { label: "National Center for Supercomputing Applications", url: "https://en.wikipedia.org/wiki/National_Center_for_Supercomputing_Applications" },
    ],
    tags: ["standards"],
    group: "other",
    name: "NCSA - the campus lab that made the web visible",
    founded: 1986,
    tagline: "Mosaic gave the web a face in 1993; NCSA httpd's orphaned patches became Apache; NCSA Telnet networked a generation of campuses.",
    intro: "A national supercomputing center whose side projects changed the world: Andreessen and Bina's Mosaic made the internet something you could see (and, via Spyglass, seeded Internet Explorer too), Rob McCool's httpd and CGI defined how the early web served and ran programs, and its patch community became the Apache HTTP Server. The Netscape page on this site is the sequel to this one.",
    body: ["The profile covers the 1983 Black Proposal and 1986 founding, NCSA Telnet, Mosaic's 1993 explosion and its two browser-war descendants, httpd and CGI, and the birth of Apache from the orphaned patches."],
  },
  {
    slug: "ciena",
    official: {
      url: "https://www.ciena.com",
    },
    sources: [
      { label: "Ciena", url: "https://en.wikipedia.org/wiki/Ciena" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Ciena - the company that taught fiber to carry colors",
    founded: 1992,
    tagline: "The first commercial DWDM deployment (Sprint, 1996) multiplied installed fiber sixteenfold - and Ciena has compounded the optical layer ever since, Nortel inheritance included.",
    intro: "David Huber's dense wavelength-division multiplexing turned one strand of glass into sixteen channels without digging a meter of trench - the 1996 Sprint deployment that changed long-haul economics overnight. Ciena survived the crash that killed its rivals, inherited Nortel's optical crown in 2010, and its WaveLogic coherent optics have made wavelength capacity a semiconductor curve.",
    body: ["The profile covers the 1992 founding, the MultiWave 1600 and the record 1997 IPO, the crash years, the Nortel optical acquisition, and the coherent era from 40G to today's 800G class."],
  },
  {
    slug: "sniffer-lineage",
    sources: [
      { label: "Network General", url: "https://en.wikipedia.org/wiki/Network_General" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "The Sniffer lineage - Network General to NetScout",
    founded: 1984,
    tagline: "The 1986 Sniffer made protocol analysis a profession; through Dolch luggables, Network Associates, and Arbor's DDoS telemetry, the whole bloodline converged on NetScout.",
    intro: "One entry for five companies, because they are one story: Network General's Sniffer named the practice every engineer still uses, Volker Dolch's rugged luggables were its field chassis, the Network Associates merger and un-merger carried the brand through the roll-up era, Arbor Networks scaled packet thinking to internet-wide DDoS telemetry - and NetScout, founded two years before the Sniffer existed, became the house where the whole analyzer tradition came home.",
    body: ["The profile covers the 1986 Sniffer, Sniffer University, the Dolch chassis, the 1997 NAI merger and 2004 rebirth, Arbor's Peakflow and ATLAS, and NetScout's 2007 and 2015 consolidating acquisitions."],
  },
  {
    slug: "dolch",
    official: {
      defunct: true,
    },
    tags: ["vendor"],
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
    sources: [
      { label: "Blue Coat Systems", url: "https://en.wikipedia.org/wiki/Blue_Coat_Systems" },
      { label: "Packeteer", url: "https://en.wikipedia.org/wiki/Packeteer" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Blue Coat & Packeteer - the chokepoint companies",
    founded: 1996,
    tagline: "CacheFlow's pivot made the proxy a security platform; PacketShaper created traffic shaping - together, the prehistory of the SSE category.",
    intro: "Two 1996 companies that answered the same question - what happens at the chokepoint, the point all traffic must pass through - for content and for bandwidth. Blue Coat (born CacheFlow) made the inline proxy the enterprise web's enforcement point, SSL inspection included; Packeteer's PacketShaper taught the WAN that traffic has identity. Merged in 2008, carried through Symantec into Broadcom, their architecture is what every cloud secure web gateway runs today.",
    body: ["The profile covers the legendary CacheFlow IPO, the 2002 pivot to Blue Coat, PacketShaper's category creation, the 2008 acquisition, the private-equity years, and the Symantec-to-Broadcom passage."],
  },
  {
    slug: "cyclades-avocent-vertiv",
    sources: [
      { label: "Avocent (Cyclades Corporation)", url: "https://en.wikipedia.org/wiki/Avocent" },
      { label: "Vertiv", url: "https://en.wikipedia.org/wiki/Vertiv" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Cyclades, Avocent & Vertiv - the physical layer of uptime",
    founded: 1965,
    tagline: "A Brazilian-founded console-server pioneer, the KVM leaders, and Liebert's computer-room weather - consolidated into the company whose product is uptime itself.",
    intro: "Cyclades - founded in 1988 in a São Paulo garage by João Lima and Daniel Dalarossa, an early Linux champion that later moved to California - built the out-of-band discipline: the console path that shares no fate with the network it manages. Through Avocent's KVM heritage and Emerson Network Power (whose other root is Ralph Liebert's 1965 precision cooling), the lineage became Vertiv: access, power, and cooling as one problem, now the constraint the AI build-out plans around. The name also earns an honorable footnote: Pouzin's CYCLADES research network - TCP/IP's credited French ancestor - now has its own profile in this pioneer lineage; same name, different continent, no corporate relation.",
    body: ["The profile covers the 1989 Brazilian founding, the console-server category, the 2006 Avocent acquisition, Emerson Network Power and the Liebert root, the 2016 Vertiv carve-out, and the AI-density era."],
  },
  {
    slug: "dell-force10",
    sources: [
      { label: "Force10", url: "https://en.wikipedia.org/wiki/Force10_Networks" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Dell & Force10 - the direct model and its fabric",
    founded: 1984,
    tagline: "A dorm-room assembler became the datacenter's broadest supplier - and the 10GbE pioneer it absorbed in 2011 became its switching lineage.",
    intro: "Michael Dell's direct model reset how hardware reaches buyers; the 2013 take-private and the 2016 EMC acquisition - the largest technology deal in history - rebuilt the company around the datacenter. Inside it runs Force10's engineering: the 1999 startup whose purpose-built E-Series delivered line-rate 10 Gigabit Ethernet before anyone else, whose FTOS lineage survives as Dell's switching OS today.",
    body: ["The profile covers the 1984 dorm-room founding and the direct model, Force10's E1200 and HPC fabrics, the 2011 acquisition, the take-private, the EMC megadeal, and the PowerSwitch present."],
  },
  {
    slug: "zte",
    official: {
      url: "https://www.zte.com.cn",
    },
    sources: [
      { label: "ZTE", url: "https://en.wikipedia.org/wiki/ZTE" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "ZTE - China's other giant",
    founded: 1985,
    tagline: "Shenzhen 1985, top-four in 5G - and the 2018 denial order that made supply-chain dependency the industry's most vivid lesson.",
    intro: "Founded two years before its Shenzhen neighbor Huawei, ZTE grew from digital switching into one of the world's four mobile-equipment majors. In April 2018 a US component ban halted the company within weeks; the $1.4 billion settlement that restarted it - fine, escrow, replaced management, embedded monitors - turned 'where does your silicon come from' into a board-level network-design question everywhere.",
    body: ["The profile covers the 1985 founding, the ZXJ10 era, global scale through CDMA and handsets, the 2017 plea and 2018 denial-order crisis with its settlement, and the bifurcated 5G market ZTE now inhabits."],
  },
  {
    slug: "fluke",
    official: {
      url: "https://www.flukenetworks.com",
    },
    sources: [
      { label: "Fluke Corporation", url: "https://en.wikipedia.org/wiki/Fluke_Corporation" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Fluke - the meters and certifiers in every field bag",
    founded: 1948,
    tagline: "The 87 multimeter and the DSX CableAnalyzer - and a 2015 three-way split (Fortive, NetScout, NetAlly) worth knowing cold.",
    intro: "John Fluke Sr.'s 1948 instruments company became the generic word for the multimeter itself, and Fluke Networks made cabling certification an instrument category with legal weight. The 2015 Danaher deal split the story: enterprise visibility went to NetScout (the handheld line later reborn as NetAlly), while cable certification stayed Fluke Networks under Fortive - one company, three present-day homes.",
    body: ["The profile covers the 1948 founding, the 87, the DSP-to-DSX certification lineage, AirMagnet, the carefully-told 2015 split, and the Fortive present."],
  },
  {
    slug: "dns-bind",
    sources: [
      { label: "Domain Name System", url: "https://en.wikipedia.org/wiki/Domain_Name_System" },
      { label: "BIND", url: "https://en.wikipedia.org/wiki/BIND" },
    ],
    tags: ["standards"],
    group: "other",
    name: "DNS & BIND - the internet's phone book and its reference implementation",
    founded: 1983,
    tagline: "Mockapetris's 1983 design and Berkeley's software that ran it - delegation, caching, and forty years of the same wire format.",
    intro: "Before the DNS, the internet's names lived in a text file everyone downloaded. Paul Mockapetris's 1983 design replaced it with a delegated, cached, planetary database - and four Berkeley grad students wrote BIND, the implementation that made 'running DNS' and 'running BIND' the same sentence for a quarter century.",
    body: ["The profile covers HOSTS.TXT's collapse, RFC 882/883 and 1034/1035, the MX record, Vixie and ISC, BIND 9, the Kaminsky patch, the 2010 root signing, Dyn day, and the DoT/DoH era."],
  },
  {
    slug: "http-gopher",
    sources: [
      { label: "Gopher (protocol)", url: "https://en.wikipedia.org/wiki/Gopher_(protocol)" },
    ],
    tags: ["standards"],
    group: "other",
    name: "HTTP & Gopher - the web's protocol and the rival it eclipsed",
    founded: 1989,
    tagline: "Two futures shipped in 1991; one spring of licensing decided between them - CERN gave the web away, Minnesota asked for money.",
    intro: "Gopher was the better-organized system and for two years it was winning. Then, weeks apart in 1993, Minnesota announced server fees and CERN declared the web royalty-free forever - the cleanest natural experiment in protocol economics ever run. HTTP went on to replace its own transport twice without breaking a URL.",
    body: ["The profile covers the 1989 CERN proposal and HTTP/0.9, Gopher's rise and Veronica, the spring-1993 licensing fork, Mosaic, the Host header, REST, and the HTTP/2-to-HTTP/3-over-QUIC arc this site's WAF material continues."],
  },
  {
    slug: "nvidia",
    official: {
      url: "https://www.nvidia.com",
      resources: [
        { label: "NVIDIA Developer", url: "https://developer.nvidia.com" },
      ],
    },
    sources: [
      { label: "Nvidia", url: "https://en.wikipedia.org/wiki/Nvidia" },
    ],
    tags: ["vendor"],
    group: "contemporary",
    name: "Nvidia - the GPU company that runs the fabric",
    founded: 1993,
    tagline: "CUDA's decade-early bet, the AlexNet ignition, Mellanox - the network's biggest customer became one of its vendors.",
    intro: "Nvidia named the GPU, made it programmable a decade before the world needed it, and became the platform of the AI era. For this site's readers the 2020 Mellanox acquisition is the hinge: InfiniBand, Spectrum-X Ethernet, and BlueField DPUs make Nvidia simultaneously the most demanding workload networks carry and a top-tier network vendor - both sides of the AI-fabric argument.",
    body: ["The profile covers the 1993 founding, RIVA-to-GeForce survival and naming, CUDA, AlexNet, the Mellanox networking turn, the trillion-dollar ascent, and the NVLink/InfiniBand/Spectrum-X fabric wars."],
  },
  {
    slug: "ubiquiti",
    official: {
      url: "https://www.ui.com",
      resources: [
        { label: "Ubiquiti Help Center", url: "https://help.ui.com" },
      ],
    },
    sources: [
      { label: "Ubiquiti", url: "https://en.wikipedia.org/wiki/Ubiquiti" },
    ],
    tags: ["vendor"],
    group: "contemporary",
    name: "Ubiquiti - enterprise features at prosumer prices",
    founded: 2005,
    tagline: "airMAX armed the WISPs, UniFi made the controller model a $200 purchase - and two incidents every security reader should know cold.",
    intro: "Robert Pera's bet was that big-vendor radio performance could ship at a fraction of the price, sold by community instead of a sales force. airMAX connected the places carriers skipped; UniFi became the default answer for small networks and a rising share of serious ones. Kept factual, its 2015 BEC fraud and 2020-21 insider case are canonical security teaching material.",
    body: ["The profile covers the 2005 founding, the WISP world, UniFi and the 2011 IPO, the product-led model, and the two incidents on the public record."],
  },
  {
    slug: "access-home-fleet",
    sources: [
      { label: "Netgear", url: "https://en.wikipedia.org/wiki/Netgear" },
      { label: "TP-Link", url: "https://en.wikipedia.org/wiki/TP-Link" },
    ],
    tags: ["vendor"],
    group: "contemporary",
    name: "The access & home fleet - Netgear, TP-Link, Zyxel, Asus & Askey, Allied Telesis",
    founded: 1987,
    tagline: "The boxes everyone actually owns: the first hop of most packets on Earth, told as one fleet.",
    intro: "Five names, one layer: the CPE and SOHO gear that put networking in ordinary rooms. Netgear's Bay Networks spinoff roots, TP-Link's decade-plus shipment crown, Zyxel's modem-era pedigree, the ASUS/Askey retail-and-ODM pairing, and Allied Telesis holding the access edge since 1987 - plus the 2024 geopolitics that scale eventually attracts.",
    body: ["The profile tells the five foundings, the mesh and cloud-management turns, the enthusiast-firmware culture, the invisible carrier-ODM fleet, and why this tier is both the industry's proving ground and its largest attack surface."],
  },
  {
    slug: "watchguard",
    sources: [
      { label: "WatchGuard", url: "https://en.wikipedia.org/wiki/WatchGuard" },
    ],
    tags: ["vendor"],
    group: "contemporary",
    name: "WatchGuard - the red box that made the firewall an appliance",
    founded: 1996,
    tagline: "The 1996 Firebox turned security from a project into an object - and the mid-market has run on it since.",
    intro: "WatchGuard's founding bet was packaging: firewall software sealed into a red steel appliance, priced and consoled for the company with one IT person. The category the giants now dominate was proven here first - and the company never abandoned the mid-market and MSP channel it created.",
    body: ["The profile covers the Firebox, the 1999 IPO and 2006 take-private, the UTM years on Fireware, AuthPoint, the Panda Security acquisition, and the MSP-first present."],
  },
  {
    // SPLIT 2026-08-05 (PRIME): "split A10 and Kemp into two separate entries,
    // they may reference each other, but each company with its own entry."
    // Previously one combined entry at slug a10-kemp, which is now redirected.
    slug: "a10",
    official: {
      url: "https://www.a10networks.com",
      resources: [
        { label: "A10 Documentation", url: "https://documentation.a10networks.com" },
      ],
    },
    group: "other",
    name: "A10 Networks",
    founded: 2004,
    sources: [
      { label: "A10 Networks", url: "https://en.wikipedia.org/wiki/A10_Networks" },
    ],
    tags: ["vendor"],
    tagline: "Attacked application delivery from the throughput flank, where the traffic is heaviest.",
    intro:
      "Lee Chen founded A10 in San Jose in 2004, having already co-founded Centillion Networks and Foundry Networks. Rather than contest the enterprise data centre feature for feature, it went where volume decides: carrier-grade NAT, DDoS absorption and the service-provider tier measured in millions of concurrent sessions.",
    body: [
      "The profile below covers the founding, the Brocade litigation, the 2014 listing, the CGNAT decade and the move into DDoS and 5G infrastructure.",
      "It is worth reading beside Kemp, which appears separately here and attacked the same category from the opposite direction - down on price rather than up on throughput. Between them they are the reason application delivery never became a single vendor's market.",
    ],
    externalUrl: "https://www.a10networks.com/",
    externalLabel: "A10 Networks",
  },
  {
    // SPLIT 2026-08-05 (PRIME). The Kemp half of the former a10-kemp entry.
    slug: "kemp",
    group: "other",
    name: "Kemp Technologies",
    founded: 2000,
    sources: [
      { label: "Kemp Technologies", url: "https://en.wikipedia.org/wiki/KEMP_Technologies" },
    ],
    tags: ["vendor"],
    tagline: "Priced the load balancer for the administrator rather than the committee, and went virtual before the market did.",
    intro:
      "Kemp was founded in New York in 2000, into a market where an application delivery controller meant a six-figure chassis and a procurement cycle. LoadMaster sold for the price of a server, to the person who simply needed a workload to stay up. Progress Software acquired the company in 2021.",
    body: [
      "The profile below covers the founding, the early move to virtual appliances, and the 2021 acquisition.",
      "It is worth reading beside A10, which appears separately here and attacked the same category from above on throughput. The two escape routes from a dominant incumbent's pricing are down and sideways, and these are the companies that took them.",
    ],
    externalUrl: "https://kemptechnologies.com/",
    externalLabel: "Kemp Technologies",
  },
  {
    slug: "datacom",
    sources: [
      { label: "Datacom - About (Teracom Telematica S.A., Eldorado do Sul, RS)", url: "https://datacom.com.br/en/institucional" },
    ],
    tags: ["vendor"],
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
    tags: ["vendor"],
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
    official: {
      url: "https://www.netgear.com",
    },
    tags: ["vendor"],
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
    official: {
      url: "https://www.tp-link.com",
    },
    tags: ["vendor"],
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
    official: {
      url: "https://www.zyxel.com",
    },
    tags: ["vendor"],
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
    official: {
      url: "https://www.alliedtelesis.com",
    },
    tags: ["vendor"],
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

  // ---- Brazilian integrators of the 2011-2014 years (wrap 109 flagged these
  // as missing; PRIME 2026-08-10). Founding years are NOT stated on either
  // company site and are omitted rather than inferred. ----
  {
    slug: "cylk",
    sources: [
      { label: "Baguete - \u201cFundada em junho de 2010, a CYLK, membro do Grupo IHC\u201d (March 2015)", url: "https://www.baguete.com.br/noticias/cylk-recebe-certificacao-da-juniper" },
      { label: "Resinfo - same founding statement, ISO/IEC 20000 certification, March 2015", url: "https://www.resinfo.com.br/noticias/518-2015-03-11-11-37-18.html" },
      { label: "Baguete - CYLK, HighCast and InLearn form Grupo IHC, founded 2003", url: "https://www.baguete.com.br/noticias/cylk-tem-novo-diretor-de-operacoes" },
      { label: "CYLK - company site (information security and cybersecurity; GRC, privacy, awareness, pentest, assessments)", url: "https://www.cylk.com.br/" },
    ],
    // Employed here 2010-2011 and again in 2020. The entry carried NO relationship
    // at all, so it never appeared under "My chapters" (PRIME 2026-08-11).
    relationships: ["worked-inside"],
    tags: ["reseller", "services"],
    group: "contemporary",
    name: "CYLK - security integration, Sao Paulo",
    founded: 2010,
    tagline: "A Brazilian security integrator: the practice of making other people's products work together in somebody else's estate.",
    intro: "CYLK was founded in June 2010 as a systems-integration and managed-services company for networks, data centre and security, and belongs to Grupo IHC. It does not make products; it makes them work - today specialising in cybersecurity, governance, risk and compliance, privacy, awareness, penetration testing and assessments for Brazilian enterprises.",
    body: ["The integrator's job is the one this site's Practice corpus is largely about: arriving at an estate somebody else designed, with vendors who each assume they are the only one present. CYLK also sits in the same group as InLearn - Grupo IHC, founded 2003, whose third company is HighCast - so the integration business and the training business grew up under one roof."],
    externalUrl: "https://www.cylk.com.br/",
    externalLabel: "CYLK",
  },
  {
    slug: "tdec",
    sources: [
      { label: "TDec Network Group - company site (\u201cmore than 30 years\u201d in cybersecurity, corporate networks and global IT; Brazil, United States and Portugal)", url: "https://www.tdec.com.br/" },
    ],
    // Employed here 2013-2014. Same omission as CYLK - these entries were written as
    // COMPANY HISTORY and nobody attached the career fact (PRIME 2026-08-11).
    relationships: ["worked-inside"],
    tags: ["reseller", "services"],
    group: "contemporary",
    name: "TDec Network Group - networks and security, three countries",
    founded: 1992,
    tagline: "A Brazilian network and security house that grew outward: Brazil, the United States, Portugal.",
    intro: "TDec Network Group works out of S\u00e3o Paulo and traces to TDEC Inform\u00e1tica Ltda., a company registered in Cotia on 6 March 1992 and later trading as The Network Group. Its own site brands itself \u201cest. 1993\u201d while describing more than thirty years in the business - a one-year discrepancy the company has never reconciled, and one worth leaving visible rather than picking a side on. It operates across Brazil, the United States and Portugal in cybersecurity, corporate networking and global IT.",
    body: ["The founding entity is TDEC Inform\u00e1tica Ltda. (CNPJ 67.521.195/0001-96), registered in Cotia in March 1992 - a registration address rather than a place of work, which is a distinction worth keeping in a Brazilian corporate record; a later company, TDec Redes de Computadores Ltda. (CNPJ 06.093.568/0001-80), was opened in January 2004 and is the active legal person associated with the group today. A 2004 registration is not a 2004 founding, and the two are kept apart here. The founder is Jos\u00e9 Valter \u201cJunior\u201d T\u00e1vora de Castro."],
    externalUrl: "https://www.tdec.com.br/",
    externalLabel: "TDec Network Group",
  },

  // ---- Training organisations of the instructor years (PRIME 2026-08-10).
  // Founding years are not published by either company and are omitted. ----
  {
    slug: "inlearn",
    sources: [
      { label: "Monitor CNPJ - INLEARN EDUCACAO LTDA, CNPJ 05.042.433/0001-23, Barueri/SP, constituted 14 April 2002", url: "https://monitorcnpj.com.br/cnpj/05042433000123/" },
      { label: "InLearn - company site (official Fortinet and F5 Networks training partner; courses and certifications in cybersecurity, networking and infrastructure)", url: "https://www.inlearn.com.br/" },
    ],
    tags: ["training"],
    group: "other",
    relationships: ["worked-with-directly"],
    name: "InLearn - official training, Brazil",
    founded: 2002,
    tagline: "Brazilian authorised training centre for F5 and Fortinet courses.",
    intro: "InLearn Educa\u00e7\u00e3o Ltda was constituted on 14 April 2002, registered in Barueri in Greater S\u00e3o Paulo, and is an official training partner of Fortinet and F5, delivering the vendors' own courses and certification paths. Like TDec, it dates itself two different ways: the register says 2002, while the company presents itself as training professionals \u201csince 2008\u201d - the year its current leadership arrived. Both are recorded here.",
    body: ["An authorised training centre is the layer most vendor documentation never mentions: the vendor writes the courseware, and somebody local has to schedule it, staff it with certified instructors and put working labs in front of people. That matters more in a market like Brazil than the org chart suggests - a certification that exists only in English, only across a currency barrier and only in another time zone is one most local engineers will not get.", "InLearn belongs to Grupo IHC, founded in 2003, alongside HighCast and CYLK - which means two companies in this encyclopedia are sister businesses in the same group."],
    externalUrl: "https://www.inlearn.com.br/",
    externalLabel: "InLearn",
  },
  {
    slug: "versim",
    sources: [
      { label: "Versim - About us (on the Polish market since 2005; one of the largest network-solution distributors by turnover)", url: "https://www.versim.pl/en/en-o-nas/" },
      { label: "Versim ATP - About us (Authorized Training Center since 2016 for Extreme Networks, Techstep and Gigaset Pro)", url: "https://versimatp.com/about-us/" },
      { label: "Versim - company site (Pozna\u0144; distributor of advanced networking and IT security solutions, wired and wireless)", url: "https://versim.pl/" },
    ],
    tags: ["distributor", "training"],
    group: "other",
    relationships: ["worked-with-directly"],
    name: "Versim - distribution and training, Poland",
    founded: 2005,
    tagline: "Polish distributor and authorised training centre for Extreme Networks.",
    intro: "Versim has been on the Polish market since 2005 and is, by turnover, one of the largest distributors of network solutions there. It distributes advanced networking and IT security technologies, wired and wireless, from Pozna\u0144 - and since 2016 has also run an Authorized Training Center, certified for Extreme Networks, Techstep and Gigaset Pro.",
    body: ["A distributor with a training arm has an incentive most training organisations lack: it has to live with whether the engineers it certified can actually deploy what it sold them. The feedback loop between the classroom and the support queue is short, which tends to show in the courseware."],
    externalUrl: "https://versim.pl/",
    externalLabel: "Versim",
  },

  // ---- Pelkey Wave 3, institutions first (plan: everything else references
  // them). BBN, NBS/NIST and MITRE are not vendors and are here because the
  // field's shape was set partly in rooms where nobody was selling. ----
  {
    slug: "bbn",
    sources: [
      { label: "RTX BBN Technologies - American research and development company", url: "https://en.wikipedia.org/wiki/BBN_Technologies" },
    ],
    tags: ["services", "standards"],
    group: "other",
    name: "BBN - the contractor that built the first network",
    founded: 1948,
    tagline: "A research firm won the ARPANET contract, and the packet switch became a product because somebody had to manufacture it.",
    intro: "Bolt Beranek and Newman began in acoustics - the firm was hired to make auditoriums sound right - and ended up building the machine that made packet switching real. Winning the ARPANET Interface Message Processor contract in 1968 turned a funded idea into hardware somebody had to deliver, support and repair, which is a different problem from proving the idea works.",
    body: [
      "The IMP is the reason a network device is a separate box rather than a function of a host computer. Hosts differed too much to each implement the network directly; putting the logic in its own machine let one interface absorb the difference. Every router since inherits that decision.",
      "BBN also demonstrates something the timeline otherwise lacks: a contractor whose product existed because a customer specified it. Most companies here started with a technology looking for a market. This one started with a market of exactly one, and the technology came out of the requirement.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/BBN_Technologies",
    externalLabel: "BBN",
  },
  {
    slug: "nbs-nist",
    sources: [
      { label: "National Institute of Standards and Technology - measurement standards laboratory of the United States", url: "https://en.wikipedia.org/wiki/National_Institute_of_Standards_and_Technology" },
    ],
    tags: ["standards"],
    group: "other",
    name: "NBS / NIST - the measurement laboratory that tested the standards",
    founded: 1901,
    tagline: "Somebody has to decide whether two implementations of a specification actually interoperate, and it is not usually the people who wrote it.",
    intro: "The National Bureau of Standards, renamed the National Institute of Standards and Technology in 1988, is a measurement laboratory rather than a networking company - and it appears in this history because the OSI period made testing a central question. Conformance to a document and interoperation with another vendor's product are different properties, and the gap between them needed a referee nobody had a commercial interest in.",
    body: [
      "That role is easy to underrate. A specification large enough that no two implementations agree needs somebody to say which ones count, and a laboratory funded by neither the vendors nor their customers is an unusual and valuable thing to have. The OSI interoperability testbeds were built on that premise.",
      "It is also the counterexample to the idea that standards are settled by committees alone. The committee produces the document; the laboratory finds out whether the document was enough. In this period it repeatedly was not.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/National_Institute_of_Standards_and_Technology",
    externalLabel: "NIST",
  },
  {
    slug: "mitre",
    sources: [
      { label: "Mitre Corporation - American not-for-profit corporation operating federally funded research and development centers", url: "https://en.wikipedia.org/wiki/Mitre_Corporation" },
    ],
    tags: ["services", "standards"],
    group: "other",
    name: "MITRE - the not-for-profit that sits between buyer and vendor",
    founded: 1958,
    tagline: "An organisation with no product to sell, advising the customer who is buying everybody else's.",
    intro: "MITRE operates federally funded research and development centres, which is an unusual commercial shape: it advises government on technical procurement without competing for the work it evaluates. In a period when the largest single buyer of computer communications was the United States government, that position made it structurally important to how the field developed.",
    body: [
      "The value of a body with no product is that its advice can be wrong without being self-serving. A vendor's architecture recommendation is inseparable from its catalogue; an integrator's is inseparable from what it can staff. Somebody has to be able to say a requirement is badly specified.",
      "It belongs in this timeline for the same reason the standards laboratories do: several of the decisions that shaped what could be bought were made in rooms where no vendor was selling anything.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Mitre_Corporation",
    externalLabel: "MITRE",
  },

  // ---- Wave 3, networking and internetworking. Wellfleet and SynOptics are
  // here specifically to repair `nortel-bay`, which named a merger whose two
  // halves were both absent. Vitalink and Retix are NOT added: the first
  // redirects to another company's article and the second has none, so neither
  // could be verified to this corpus's standard. ----
  {
    slug: "ungermann-bass",
    sources: [
      { label: "Ungermann-Bass - computer networking company", url: "https://en.wikipedia.org/wiki/Ungermann-Bass" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Ungermann-Bass - the first company that only did networks",
    founded: 1979,
    tagline: "Ralph Ungermann left Zilog to build networks and nothing else, which nobody had done as a business before.",
    intro: "Founded in 1979, Ungermann-Bass is usually described as the first company whose entire business was computer networking rather than computers that happened to network. That is a real distinction: until then, networking was a feature sold by whoever made the machines, and a customer's options were bounded by their computer vendor.",
    body: [
      "It also opens the pattern this period is full of - founders who leave one company to start another and appear repeatedly across a decade. Ungermann came from Zilog, which he had co-founded after Intel. Reading the era as a sequence of firms misses that it is substantially the same population of people, recombining.",
      "The company was eventually acquired by Tandem, which is the usual ending here and worth stating plainly rather than treating as failure: being bought is what success looked like for most of these firms.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Ungermann-Bass",
    externalLabel: "Ungermann-Bass",
  },
  {
    slug: "proteon",
    sources: [
      { label: "Proteon - Westborough, Massachusetts computer network equipment vendor", url: "https://en.wikipedia.org/wiki/Proteon" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Proteon - token ring, and the road not taken",
    founded: 1972,
    tagline: "A serious alternative to Ethernet, built by people who thought deterministic access mattered more than simplicity.",
    intro: "Proteon, of Westborough, Massachusetts, built token-ring networking equipment and routers through the period when the local-area contest was still genuinely open. Token passing gives a network a property Ethernet does not: a bounded worst-case wait, because a station transmits only when it holds the token.",
    body: [
      "That property was not a marketing invention. On a heavily loaded shared Ethernet of the era, collisions and back-off made latency unpredictable in exactly the way a factory floor or a trading desk cannot tolerate. The token approach traded throughput and simplicity for determinism, and reasonable engineers chose it.",
      "It lost anyway, and the reason is instructive: Ethernet got cheaper faster than token ring got better, and the cost curve beat the technical argument. That is the same shape as several other entries here, and it is why this timeline is not a ranking of merit.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Proteon",
    externalLabel: "Proteon",
  },
  {
    slug: "excelan",
    sources: [
      { label: "Excelan - American computer networking company, 1982-1989", url: "https://en.wikipedia.org/wiki/Excelan" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Excelan - TCP/IP on a card, before it was obvious",
    founded: 1982,
    tagline: "Selling TCP/IP to corporations in 1982, which required believing a research network's protocol had a commercial future.",
    intro: "Excelan built network interface cards that ran the TCP/IP stack on the card itself, offloading it from a host processor that in the early 1980s could ill afford the work. Founded in 1982 and merged into Novell in 1989, its whole existence sits inside the window when it was not yet obvious which protocol suite enterprises would standardise on.",
    body: [
      "The bet is the interesting part. In 1982, TCP/IP was what the ARPANET ran; OSI was what the standards bodies and several governments said the future would be. A company selling TCP/IP hardware to corporate buyers was taking a commercial position on an argument that would not be settled for six more years.",
      "Offloading the stack onto the adapter is also a recurring idea rather than a period curiosity - it returns every time host processors fall behind link speeds, which they periodically do.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Excelan",
    externalLabel: "Excelan",
  },
  {
    slug: "wellfleet",
    sources: [
      { label: "Wellfleet Communications - American networking equipment manufacturer", url: "https://en.wikipedia.org/wiki/Wellfleet_Communications" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Wellfleet - one half of Bay Networks",
    founded: 1986,
    tagline: "The router company that merged with a hub company, producing a business that was briefly the credible alternative to Cisco.",
    intro: "Wellfleet Communications built multiprotocol routers during the internetworking window, competing directly with Cisco at a time when it was not settled who would win. Its 1994 merger with SynOptics produced Bay Networks, which for a few years was the most credible alternative to Cisco that the enterprise market had.",
    body: [
      "A merger of equals between a router company and a hub company was strategically sound on paper: routers and wiring concentrators were the two halves of an enterprise network, and neither firm alone had the other's channel. What followed is the standard warning about mergers of equals, which is that two head offices, two cultures and two product roadmaps do not become one by agreement.",
      "Reading Wellfleet and SynOptics together explains a name that otherwise appears from nowhere in the mid-1990s and disappears into Nortel in 1998.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Wellfleet_Communications",
    externalLabel: "Wellfleet",
  },
  {
    slug: "synoptics",
    sources: [
      { label: "SynOptics - American networking equipment manufacturer", url: "https://en.wikipedia.org/wiki/SynOptics" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "SynOptics - the other half of Bay Networks",
    founded: 1985,
    tagline: "Ethernet over telephone wiring, which turned a coaxial bus into something a building could actually be wired for.",
    intro: "SynOptics built structured wiring hubs that ran Ethernet over twisted pair, a Xerox PARC-derived idea that changed how buildings were cabled. Its 1994 merger with Wellfleet produced Bay Networks, joining the wiring business to the routing one.",
    body: [
      "The contribution is easy to undervalue now that twisted pair is simply what Ethernet runs on. Original Ethernet was a shared coaxial bus - one cable through a building, with every station tapped into it, and a single fault affecting everyone on the segment. Star wiring to a hub made the network diagnosable and the building wirable by electricians rather than specialists.",
      "That is a recurring shape in this history: the technically interesting invention is the protocol, and the thing that makes it deployable is the wiring.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/SynOptics",
    externalLabel: "SynOptics",
  },

  // ---- Wave 3, data communications and networking (2026-08-10).
  // NOT ADDED, each for a stated reason: Milgo (en.wikipedia redirects to Racal,
  // a British conglomerate that mentions Milgo three times - the parent, not the
  // subject); Timeplex and General DataComm (404, no article); Interlan (the
  // article of that name is an INTERNET EXCHANGE POINT IN ROMANIA, a completely
  // different organisation - the Cyclades trap, caught by reading the short
  // description rather than trusting the title). ----
  {
    slug: "codex",
    sources: [
      { label: "Vanguard Managed Solutions (redirected from Codex Corporation) - former American data network company", url: "https://en.wikipedia.org/wiki/Codex_Corporation" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Codex - modems, and the mathematics underneath them",
    founded: 1962,
    tagline: "A company whose product was signal processing sold as a box, in the window a regulator had just opened.",
    intro: "Codex built high-speed modems in the years after the interconnect decisions made it lawful for somebody other than the telephone company to attach equipment to a line. Its work sat on the mathematical side of data communications - getting more bits through a voice-grade circuit than the circuit looked capable of carrying - which is a different discipline from the switching and multiplexing most of this timeline is about.",
    body: [
      "The modem is the product this period is most associated with and the one most often taken for granted. A voice line was engineered to carry speech, and everything above about 2,400 bits per second on one was won by signal processing rather than by better wire.",
      "The company was later absorbed and the name eventually became Vanguard, which is why searching for it lands on a successor. That is the usual ending in this part of the timeline and it is recorded rather than smoothed over.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Codex_Corporation",
    externalLabel: "Codex",
  },
  {
    slug: "micom",
    sources: [
      { label: "Pelkey, \u00a75.11 \u2014 ADS Falls on Hard Times 1971-1972", url: "https://historyofcomputercommunications.info/section/5.11/ADS-Falls-on-Hard-Times-1971-1972/" },
      { label: "Pelkey, \u00a77.6 \u2014 ADS Rebirth as Micom 1973-1976", url: "https://historyofcomputercommunications.info/section/7.6/ADS-Rebirth-as-Micom-1973-1976/" },
      { label: "Micom - telecommunications equipment manufacturer known for concentrators; founded by Stephen Bernard Dorsey in 1975, sold to Philips NV in 1984, acquired Spectrum Digital in 1987", url: "https://en.wikipedia.org/wiki/Micom" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Micom - concentrators, and what they were really selling",
    founded: 1975,
    tagline: "Fewer leased lines for the same number of terminals, which is an argument a finance director understands.",
    intro: "Micom was founded in 1975 by Stephen Bernard Dorsey and built its business on data concentrators - equipment that let many terminals share one circuit instead of each needing its own. It was sold to Philips in 1984 and acquired Spectrum Digital in 1987.",
    body: [
      "James L. Pelkey's history of computer communications records an earlier chapter than the corporate register does: American Data Systems came apart between 1970 and 1972 and the enterprise re-emerged as Micom, which went on to be one of the era's larger successes. That is the rarer shape in this timeline - most entries here were acquired and absorbed, and a company that failed and came back under another name is a different story. The account is Pelkey's, and his history gives it two numbered sections - the collapse at \u00a75.11 and the rebirth at \u00a77.6 - which is a more precise citation than the corporate register offers, since no register reachable here carries the connection at all.",
      "The concentrator is the clearest case in this period of a product sold on arithmetic rather than on capability. A leased line was a recurring cost and terminals were idle most of the time; a box that let eight terminals share one line paid for itself against the line rental, and the technical argument barely had to be made.",
      "That shape recurs constantly in networking and is worth recognising: the products that spread fastest are usually the ones whose benefit can be written as a subtraction on somebody's monthly bill.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Micom",
    externalLabel: "Micom",
  },
  {
    slug: "paradyne",
    sources: [
      { label: "Paradyne - US telecommunications company", url: "https://en.wikipedia.org/wiki/Paradyne_Corporation" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Paradyne - the last miles of the analogue era",
    founded: 1969,
    tagline: "Squeezing usable data rates out of the copper that was already in the ground.",
    intro: "Paradyne built modems and data transmission equipment through the period when the access line was the constraint on everything. Its problem was the one the whole industry shared and few companies specialised in: the wire between a building and the network was already installed, could not be replaced economically, and was never designed for data.",
    body: [
      "That constraint outlived the analogue era entirely. Every subsequent generation of access technology - the DSL family most obviously - is the same engineering problem restated: extract more from existing copper because replacing it costs more than the service is worth.",
      "It is a useful corrective to a timeline otherwise full of companies inventing new media. Most of the world's bandwidth problems have been solved on cable that was already there.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Paradyne_Corporation",
    externalLabel: "Paradyne",
  },
  {
    slug: "sytek",
    sources: [
      { label: "Sytek - American local area networking company", url: "https://en.wikipedia.org/wiki/Sytek" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Sytek - broadband LANs, and NetBIOS",
    founded: 1979,
    tagline: "Ran local networks over cable television plant, and left behind an interface that outlived the company by decades.",
    intro: "Sytek built local area networks on broadband coaxial cable - the same medium cable television used - which let a network cover a campus rather than a floor and carry several channels at once. It is better remembered for something smaller: the NetBIOS interface it developed with IBM, which became the foundation of PC networking for a generation.",
    body: [
      "Broadband LANs lost to baseband Ethernet for the reasons most things in this period lost: cost, simplicity and the pace at which the winning option got cheaper. Running a network over CATV plant required radio-frequency engineering that an ordinary site could not staff.",
      "NetBIOS is the more interesting legacy and a recurring lesson: the durable artefact of a company is often not its product but an interface it defined, which then long outlives the hardware, the company and eventually the sense of what the acronym meant.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Sytek",
    externalLabel: "Sytek",
  },
  {
    slug: "bridge-communications",
    sources: [
      { label: "Bridge Communications - American computer networking company, merged with 3Com in 1987", url: "https://en.wikipedia.org/wiki/Bridge_Communications" },
    ],
    tags: ["vendor"],
    group: "other",
    name: "Bridge Communications - the box between the networks",
    founded: 1981,
    tagline: "Built the equipment that joined incompatible networks, then merged with 3Com in 1987.",
    intro: "Bridge Communications made internetworking equipment - the devices that connected local networks to each other and to hosts - in the years when a building could easily contain several networks that had no way to reach one another. It merged with 3Com in 1987, which is what a successful company in this window usually became.",
    body: [
      "The company's existence is itself evidence for how the internetworking window opened. Nobody needed a product like this until local area networks had succeeded well enough to proliferate, and the proliferation happened department by department rather than by plan.",
      "The 3Com merger also shows the consolidation pattern that followed: the firms that defined the window mostly did not survive it as independent companies, and the ones that bought them are the names still on price lists.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Bridge_Communications",
    externalLabel: "Bridge Communications",
  },

  // ---- Backlog batch 1 (PRIME 2026-08-11): the firewall-policy cluster plus
  // DDI and mail. Every source fetched this turn; AlgoSec, FireMon and Skybox
  // have no Wikipedia article and are cited to their own sites. Skybox's own
  // domain now serves a Tufin page, which is how the absorption is visible. ----
  {
    slug: "tufin",
    sources: [
      { label: "Tufin - software company (Wikipedia)", url: "https://en.wikipedia.org/wiki/Tufin" },
      { label: "skyboxsecurity.com now serves a Tufin page welcoming Skybox customers", url: "https://www.skyboxsecurity.com/", sourceNote: "Fetched 2026-08-11: the domain resolves to a Tufin transition page, which is how the absorption is visible from outside." },
    ],
    tags: ["vendor"],
    group: "contemporary",
    name: "Tufin - firewall policy, read back to you",
    tagline: "A company whose product is understanding the rules you already wrote.",
    intro: "Tufin builds software that analyses, visualises and changes firewall policy across a mixed estate. The market it sits in exists for one reason: past a few hundred rules, written by several people over several years, nobody can say with confidence what a firewall permits - and the device itself will not tell you, because it answers the question it was asked rather than the question you meant.",
    body: [
      "The category's honest description is unflattering to everyone in it. These are products sold because a control an organisation already owns has become unreadable, and the alternative to buying one is an engineer with a spreadsheet and a change window. That is not a failure of firewalls; it is what happens to any ruleset that outlives the people who wrote it.",
      "In 2026 the Skybox domain resolves to a Tufin page welcoming Skybox customers, which is the usual ending in this segment: four companies competing to explain the same estates, consolidating into fewer.",
    ],
    externalUrl: "https://www.tufin.com/",
    externalLabel: "Tufin",
  },
  {
    slug: "algosec",
    sources: [
      { label: "AlgoSec - company site (AlgoSec Horizon Platform; automating application connectivity and security policy)", url: "https://www.algosec.com/" },
    ],
    tags: ["vendor"],
    group: "contemporary",
    name: "AlgoSec - policy from the application's point of view",
    tagline: "Asks which application a rule serves, which is the question the rule does not record.",
    intro: "AlgoSec works the same estates as the rest of this cluster and frames the problem differently: rather than starting from the rule, it starts from the application and asks what connectivity that application needs. Its own material describes automating application connectivity alongside security policy.",
    body: [
      "The framing matters more than it sounds. A firewall rule records addresses, ports and an action; it does not record why it exists or which service breaks if it is removed. That missing field is the reason nobody deletes rules - the risk of removing a rule that turns out to matter is concrete, and the benefit of a shorter list is abstract.",
      "Anything that reattaches rules to the applications behind them is attacking that asymmetry, which is the only thing that makes cleanup possible at all.",
    ],
    externalUrl: "https://www.algosec.com/",
    externalLabel: "AlgoSec",
  },
  {
    slug: "firemon",
    sources: [
      { label: "FireMon - company site (firewall policy management platform, real-time visibility)", url: "https://www.firemon.com/" },
    ],
    tags: ["vendor"],
    group: "contemporary",
    name: "FireMon - watching the policy change",
    tagline: "The value is not the audit; it is noticing the day after the audit.",
    intro: "FireMon's platform manages firewall policy with an emphasis on real-time visibility, which is the axis that separates the products in this cluster: not what the ruleset looks like today, but what changed and who changed it.",
    body: [
      "A point-in-time audit describes an estate that stops being accurate the moment somebody makes an emergency change at two in the morning. The rules that cause incidents are rarely the ones reviewed; they are the ones added under pressure and never revisited, and they are invisible to any process that samples quarterly.",
      "That is the operational argument for continuous policy monitoring, and it is the same argument as change tracking anywhere else: the dangerous state is not the one you inspected, it is the one that arrived afterwards.",
    ],
    externalUrl: "https://www.firemon.com/",
    externalLabel: "FireMon",
  },
  {
    slug: "skybox",
    sources: [
      { label: "skyboxsecurity.com - now a Tufin page welcoming Skybox customers", url: "https://www.skyboxsecurity.com/", sourceNote: "Fetched 2026-08-11. The company's own domain is the evidence of its absorption, which is a common and underused primary source for this kind of ending." },
    ],
    tags: ["vendor"],
    group: "contemporary",
    name: "Skybox Security - attack paths, and an ending",
    tagline: "Modelled how an attacker would traverse the network you documented, and was absorbed by a competitor.",
    intro: "Skybox Security built network modelling and vulnerability-management software whose distinguishing idea was the attack path: rather than listing vulnerabilities by severity, it asked which of them an attacker could actually reach given the network's own topology and rules.",
    body: [
      "That question is the right one and it is why severity alone is a poor prioritiser - a critical vulnerability on a host nothing can route to is a different problem from a moderate one on a host exposed to the internet. Modelling the path between them requires knowing the topology, the rules and the addresses at the same time, which is why this company sat in the same market as the policy-management vendors.",
      "As of 2026 its domain serves a Tufin page directed at Skybox customers. The entry is kept because the idea outlived the company, and because a vendor's own website is often the first place an acquisition becomes visible to the people who depended on it.",
    ],
    externalUrl: "https://www.skyboxsecurity.com/",
    externalLabel: "Skybox Security",
  },
  {
    slug: "infoblox",
    sources: [
      { label: "Infoblox - American technology company (Wikipedia)", url: "https://en.wikipedia.org/wiki/Infoblox" },
    ],
    tags: ["vendor"],
    group: "contemporary",
    name: "Infoblox - DDI, and why it is one product",
    tagline: "DNS, DHCP and address management are three protocols and one source of truth.",
    intro: "Infoblox builds DDI - the industry's contraction for DNS, DHCP and IP address management sold as one system. The contraction exists because the three cannot honestly be operated apart: an address is allocated by DHCP, recorded in address management, and made findable by DNS, and any of them disagreeing with the others produces a fault that appears somewhere else entirely.",
    body: [
      "The failure this addresses is mundane and constant. A spreadsheet of subnets, a DHCP scope edited by hand and a DNS zone maintained separately will diverge, and the divergence surfaces as a duplicate address, an unresolvable host, or a lease handed out for a network that was decommissioned last year.",
      "It is also the reason DDI appliances end up holding an unglamorous kind of authority: once the three are unified, the system that allocates addresses becomes the record of what exists on the network, which is a heavier responsibility than the product category suggests.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Infoblox",
    externalLabel: "Infoblox",
  },
  {
    slug: "proofpoint",
    sources: [
      { label: "Proofpoint - American cybersecurity company (Wikipedia)", url: "https://en.wikipedia.org/wiki/Proofpoint" },
    ],
    tags: ["vendor"],
    group: "contemporary",
    name: "Proofpoint - the mail gateway, still",
    tagline: "Email remained the way in long after the industry stopped finding it interesting.",
    intro: "Proofpoint built its business on email security at a time when the attention of the field was moving elsewhere. That timing turned out to be the point: email stayed the most common initial access vector through two decades of newer and more interesting attack surfaces.",
    body: [
      "The category is unfashionable in a specific way worth noting. A mail gateway is judged on what it silently prevented, and prevention produces no event anybody celebrates - while a false positive produces an angry executive whose invoice was quarantined. The incentive gradient runs against the control, and estates loosen mail filtering in response to complaints far more often than they tighten it after an incident.",
      "That asymmetry, rather than any technical development, is why the same attack shape keeps working.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Proofpoint",
    externalLabel: "Proofpoint",
  },

  // ---- Backlog batch 2 (2026-08-11). SailPoint has no Wikipedia article (404)
  // and is cited to its own site with a sourceNote saying so. Flipside is cited
  // through ROADSEC's site, which names its CEO, because flipside.org returned
  // 503 - the connection is sourced, the company's own domain is not. ----
  {
    slug: "italtel",
    sources: [
      { label: "Italtel - Italian telecommunications equipment and ICT company founded in 1921, originally a branch of Siemens AG; Milan", url: "https://en.wikipedia.org/wiki/Italtel" },
      { label: "Italtel - company site", url: "https://www.italtel.com/" },
    ],
    tags: ["vendor", "services"],
    group: "other",
    name: "Italtel - a century of somebody else's telephone network",
    founded: 1921,
    tagline: "Founded as a Siemens branch in 1921, and still building networks a hundred years later under different owners.",
    intro: "Italtel began in 1921 as an Italian branch of Siemens and became one of the national champions that built Italy's telephone infrastructure - the pattern almost every European country repeated with a domestic manufacturer tied to its state operator. It is still trading, now an ICT and network integration business, and its shareholder list has been rewritten repeatedly.",
    body: [
      "The European national-champion model is worth understanding because it produced a different industry from the American one this timeline mostly documents. A manufacturer whose principal customer is the state telephone monopoly optimises for that relationship: long product cycles, deep integration with one operator's practices, and engineering aimed at a specification rather than at a market.",
      "What happens to such firms when the monopoly ends is the interesting part, and Italtel is a hundred-year worked example of it - surviving by becoming an integrator of other people's equipment rather than remaining a manufacturer of its own.",
    ],
    externalUrl: "https://www.italtel.com/",
    externalLabel: "Italtel",
  },
  {
    slug: "barracuda",
    sources: [
      { label: "Barracuda Networks - American software company (Wikipedia)", url: "https://en.wikipedia.org/wiki/Barracuda_Networks" },
    ],
    tags: ["vendor"],
    group: "contemporary",
    name: "Barracuda Networks - security for the estates nobody writes about",
    tagline: "Built a business where the budget is small, the staff is one person, and the threat is identical.",
    intro: "Barracuda sells email, network and application security into the mid-market: organisations with the same attackers as a bank and a fraction of the staff. That positioning is a genuine engineering constraint rather than a marketing segment, because a product for an estate with no dedicated security team has to work correctly on its defaults.",
    body: [
      "Most security tooling assumes somebody will tune it. The mid-market's defining condition is that nobody will - the person responsible also runs the servers, the backups and the helpdesk - so a control that requires attention to be effective will drift into being decorative.",
      "That is the part of the market where the gap between a product working and a product being operated is widest, and it is under-documented precisely because the people living it do not write conference talks.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Barracuda_Networks",
    externalLabel: "Barracuda Networks",
  },
  {
    slug: "logrhythm",
    sources: [
      { label: "LogRhythm - American security intelligence company (Wikipedia)", url: "https://en.wikipedia.org/wiki/LogRhythm" },
    ],
    tags: ["vendor"],
    group: "contemporary",
    name: "LogRhythm - the SIEM problem, stated honestly",
    tagline: "Collecting everything is easy; the cost is that somebody has to read it.",
    intro: "LogRhythm builds security information and event management - the category that centralises logs from an estate and tries to turn them into detections. The technology is well understood and the failure mode is organisational: a SIEM is only as good as the attention it receives, and attention is the scarcest resource in any security team.",
    body: [
      "The economics are the part worth knowing. Ingesting more data improves detection and increases both cost and noise, so every SIEM deployment converges on the same argument about what not to collect - an argument that is usually settled by licensing rather than by threat modelling.",
      "And the failure is quiet: an alert nobody triages is indistinguishable from an alert that never fired, which is why SIEM maturity is measured in closed cases rather than in sources connected.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/LogRhythm",
    externalLabel: "LogRhythm",
  },
  {
    slug: "sailpoint",
    sources: [
      { label: "SailPoint - company site (identity security for humans, machines and agents)", url: "https://www.sailpoint.com/", sourceNote: "Cited to the company's own site: en.wikipedia.org/wiki/SailPoint returns 404, so no third-party article was available to check this against." },
    ],
    tags: ["vendor"],
    group: "contemporary",
    name: "SailPoint - governance, which is the unglamorous half of identity",
    tagline: "Authentication asks who you are. Governance asks why you still have that access.",
    intro: "SailPoint works on identity governance - not the login, but the far larger question of who holds which entitlements, who approved them, and whether any of it is still justified. Its current material extends that to machine and agent identities, which is where the count grows fastest.",
    body: [
      "The problem governance addresses is cumulative rather than dramatic. Access is granted for a project, a cover, a migration, and almost never withdrawn, so an employee of ten years accumulates the union of every role they have held. Nothing fails as a result, which is exactly why it persists.",
      "The security consequence only appears when an account is compromised, and at that moment the question is not how the attacker got in but how far the account could reach - a question decided years earlier by a series of individually reasonable approvals.",
    ],
    externalUrl: "https://www.sailpoint.com/",
    externalLabel: "SailPoint",
  },
  {
    slug: "supermicro",
    sources: [
      { label: "Supermicro - American supplier of servers and information technology equipment (Wikipedia)", url: "https://en.wikipedia.org/wiki/Supermicro" },
    ],
    tags: ["vendor"],
    group: "contemporary",
    name: "Supermicro - the hardware underneath somebody else's brand",
    tagline: "A great deal of infrastructure is built on boards whose maker is not on the bezel.",
    intro: "Supermicro supplies servers, motherboards and systems, frequently as the physical substrate for products sold under other names. That position - the manufacturer behind the appliance - is common in networking and security and almost never visible to the people operating the result.",
    body: [
      "It matters operationally more often than it should. Firmware, baseboard management controllers and hardware errata belong to the underlying platform rather than to the badge on the front, so an advisory that concerns your appliance may be published by a company you have no relationship with.",
      "Knowing what a device actually is - rather than what it is sold as - is the difference between reading the right security bulletin and reading none.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Supermicro",
    externalLabel: "Supermicro",
  },
  {
    slug: "conviso",
    sources: [
      { label: "Conviso AppSec - Brazilian application-security specialist (company site)", url: "https://www.conviso.com.br/" },
    ],
    tags: ["services"],
    group: "contemporary",
    name: "Conviso - application security, from Brazil",
    tagline: "The part of security that has to be argued with developers rather than configured on a device.",
    intro: "Conviso is a Brazilian application-security company, working the discipline that sits furthest from the network devices most of this timeline is about: reviewing code, testing applications, and building secure development practice inside teams that ship software.",
    body: [
      "Application security is structurally harder to sell than perimeter security because it cannot be installed. A firewall is bought, racked and pointed at a problem; secure development is a change in how people work, negotiated with engineers who already have deadlines, and its success is measured in defects that never reached production.",
      "That measurement problem - proving the value of something that did not happen - is the same one the mail-gateway and policy-management entries in this timeline describe, and it is the reason the whole preventive half of security argues for its budget from a weaker position than the responsive half.",
    ],
    externalUrl: "https://www.conviso.com.br/",
    externalLabel: "Conviso",
  },
  {
    slug: "flipside",
    sources: [
      { label: "Roadsec - the festival's own site, listing Anderson Ramos as CEO of Flipside", url: "https://www.roadsec.com.br/", sourceNote: "Fetched 2026-08-11. The Flipside connection is stated on Roadsec's own speaker listing; the flipside.org domain returned 503 and was not used." },
    ],
    tags: ["services", "training"],
    group: "contemporary",
    name: "Flipside - the organisation behind Roadsec",
    tagline: "Ran the security event that reached the people conferences usually price out.",
    intro: "Flipside is the Brazilian organisation behind Roadsec, described on its own site as the largest hacker festival in Latin America. The site's glossary already carries Roadsec as lore; this entry names the organisation that produced it, which is how a community event acquires the continuity to happen every year.",
    body: [
      "Roadsec's distinguishing choice was reach rather than prestige: it toured Brazilian cities rather than concentrating in Sao Paulo, and priced itself for students. That combination decides who is in the room, and therefore who ends up in the field a decade later - which is the same argument this site's entries on training centres and the market-reserve period make from other directions.",
      "The event's public record is uneven - its own site was last dated to a past edition when this entry was written - and that is recorded here rather than smoothed, because a community organisation's archive is usually thinner than its influence.",
    ],
    externalUrl: "https://www.roadsec.com.br/",
    externalLabel: "Roadsec",
  },

  // ---- Backlog batch 3 (2026-08-11): global services, carriers and the two
  // satellite entries, which are written as a PAIR - Hughes states the
  // geostationary latency floor and SpaceX is what happened when the orbit
  // changed rather than the equipment. ----
  {
    slug: "atos",
    sources: [
      { label: "Atos - French IT corporation (Wikipedia)", url: "https://en.wikipedia.org/wiki/Atos" },
    ],
    tags: ["services"],
    group: "contemporary",
    name: "Atos - the estate somebody else runs",
    tagline: "Large-scale IT outsourcing, where the contract decides the architecture.",
    intro: "Atos is a French IT services corporation operating at the scale where an organisation hands over the running of its infrastructure entirely. That arrangement changes engineering in a way rarely discussed: the shape of a system stops being decided by architects and starts being decided by what the service agreement priced.",
    body: [
      "An outsourced estate accumulates a specific kind of technical debt. Changes cost money per change, so small improvements that would be free in-house are deferred until they can be bundled, and the bundle becomes a project, and the project becomes a negotiation. The result is estates that move in large infrequent steps rather than continuously.",
      "None of that is a criticism of the model, which exists because running infrastructure well is genuinely hard and genuinely unglamorous. It is a statement about where the decisions actually live, which is the thing an engineer joining such an estate needs to understand first.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Atos",
    externalLabel: "Atos",
  },
  {
    slug: "dxc",
    sources: [
      { label: "DXC Technology - American multinational IT services company (Wikipedia)", url: "https://en.wikipedia.org/wiki/DXC_Technology" },
    ],
    tags: ["services"],
    group: "contemporary",
    name: "DXC Technology - what a merger of service businesses inherits",
    tagline: "Formed from two large IT services organisations, and therefore from their contracts.",
    intro: "DXC Technology is a multinational IT services company formed from the combination of large existing services businesses. Merging service organisations is unlike merging product companies: what is acquired is not a catalogue but a book of long-running contracts, each with its own inherited estate, staffing model and set of promises made years earlier.",
    body: [
      "That is why integration in this sector is measured in years rather than quarters. Two service businesses can be legally one company and operationally two for a long time, because the contracts underneath them cannot be renegotiated on the merger's schedule - they expire on their own.",
      "For an engineer, the practical consequence is that the badge on the pass says less than usual about which practices, tooling and escalation paths apply. The contract does.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/DXC_Technology",
    externalLabel: "DXC Technology",
  },
  {
    slug: "orange",
    sources: [
      { label: "Orange Group - French multinational telecommunications corporation (Wikipedia)", url: "https://en.wikipedia.org/wiki/Orange_S.A." },
    ],
    tags: ["carrier"],
    group: "contemporary",
    name: "Orange - a former state monopoly with a global enterprise arm",
    tagline: "The other side of the European story: the operator the national champions were built to supply.",
    intro: "Orange is a French multinational telecommunications operator, descended from the state monopoly, and it sits on this timeline as the counterpart to entries like Italtel: where the national champion manufactured, the national operator bought, and the relationship between them shaped both.",
    body: [
      "Its enterprise arm matters to anybody running an international network, because a multinational estate is not assembled from one carrier. It is stitched together from whichever operator holds the local licence in each country, and the party that does the stitching absorbs the incompatibilities - different SLAs, different provisioning times, different definitions of what an outage is.",
      "That integration role is invisible on a network diagram and is often the reason a change takes six weeks in one country and six months in another.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Orange_S.A.",
    externalLabel: "Orange",
  },
  {
    slug: "dimension-data",
    sources: [
      { label: "Dimension Data - technology company (Wikipedia)", url: "https://en.wikipedia.org/wiki/Dimension_Data" },
    ],
    tags: ["reseller", "services"],
    group: "contemporary",
    name: "Dimension Data - integration at continental scale",
    tagline: "A systems integrator that grew out of one region and was absorbed into a Japanese carrier.",
    intro: "Dimension Data built a large network integration and managed services business, and its arc is the one this timeline keeps recording from different starting points: an integrator grows past the region that produced it, becomes attractive to a carrier that wants delivery capability, and is acquired.",
    body: [
      "The pattern is worth naming because it explains why so few large independent integrators exist. Integration is a people business with thin margins and deep customer relationships, which is exactly what a carrier or a manufacturer wants to own - and the integrator's value to an acquirer is highest at the moment its independence is most useful to its customers.",
      "This is the same shape as Network1 into ScanSource and Westcon into Synnex elsewhere on this timeline, at a different scale and on a different continent.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Dimension_Data",
    externalLabel: "Dimension Data",
  },
  {
    slug: "hughes",
    sources: [
      { label: "Hughes Network Systems - satellite internet service provider (Wikipedia)", url: "https://en.wikipedia.org/wiki/Hughes_Network_Systems" },
    ],
    tags: ["carrier", "vendor"],
    group: "contemporary",
    name: "Hughes - the network where latency is a law of physics",
    tagline: "Geostationary satellite: about a quarter of a second each way, and nothing will fix it.",
    intro: "Hughes Network Systems builds satellite networking, historically over geostationary satellites - and geostationary orbit imposes a constraint no engineering can remove. The orbit sits roughly 36,000 kilometres up, so a signal travels 72,000 kilometres for a round trip before anything is processed.",
    body: [
      "That produces a latency floor of around half a second, and it changes which protocols work. TCP's throughput depends on the round-trip time, so a connection with satellite latency and an ordinary window size cannot fill the link no matter how much bandwidth is provisioned - which is why satellite deployments have always needed acceleration, protocol spoofing, and application designs that tolerate delay.",
      "It is the clearest case in networking of a limit that is not an engineering trade-off. Bandwidth can be bought and hardware can be upgraded; the speed of light and the height of the orbit are fixed, and every design decision above them is a response to that fact.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Hughes_Network_Systems",
    externalLabel: "Hughes Network Systems",
  },
  {
    slug: "spacex",
    sources: [
      { label: "SpaceX - American spaceflight company (Wikipedia)", url: "https://en.wikipedia.org/wiki/SpaceX" },
    ],
    tags: ["carrier"],
    group: "contemporary",
    name: "SpaceX - low orbit, and what it does to the latency floor",
    tagline: "The constraint that could not be engineered away was engineered around, by moving the satellites.",
    intro: "SpaceX operates a low-Earth-orbit satellite constellation, and its relevance to this timeline is a single number. Where geostationary orbit sits around 36,000 kilometres up, low orbit is a few hundred - which collapses the round-trip latency from roughly half a second to a range that ordinary protocols and interactive applications can work with.",
    body: [
      "The trade is not free and it is the reason nobody did this earlier. A satellite at that altitude is only overhead for minutes, so continuous coverage needs thousands of them, constant handover between them, and a launch economics that makes replacing the constellation routine rather than catastrophic.",
      "Read beside the Hughes entry it makes a general point about limits: the geostationary latency floor was never a technology problem to be solved by better modems. It was a consequence of a choice of orbit, and it moved only when the choice did.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/SpaceX",
    externalLabel: "SpaceX",
  },

  // ---- Backlog batch 4 (2026-08-11), researched under PRIME's protocol:
  // cache-bypassed fetch of each company site, plus Brazilian specialist media.
  // Baguete carried the Tempest ownership history AND, inside the same article,
  // the Prosegur/Cipher transaction - which is why Cipher is written here too.
  // Cipher has NO externalUrl: no company site was verified this turn. ----
  {
    slug: "tempest",
    sources: [
      { label: "Baguete, 1 July 2020 - Embraer takes control of Tempest; Embraer held 37% indirectly after a R$28.2m investment in 2016 via FIP Aeroespacial (Embraer and BNDES principal holders); revenue R$20m to R$120m; 300 staff in Recife, Sao Paulo and London; CEO and co-founder Cristiano Lincoln Mattos", url: "https://www.baguete.com.br/noticias/01/07/2020/embraer-compra-controle-da-tempest" },
      { label: "Tempest - company site", url: "https://www.tempest.com.br/" },
    ],
    tags: ["services"],
    group: "contemporary",
    name: "Tempest - cybersecurity out of Recife",
    tagline: "Brazil's largest specialist security firm, built outside the Sao Paulo axis and bought by an aircraft manufacturer.",
    intro: "Tempest is a Brazilian cybersecurity company founded and headquartered in Recife, with offices in Sao Paulo and London. Its portfolio spans consulting, managed security services, security software integration and identity protection, and roughly half its client base sits in the financial sector - the industry that funds security work first and most consistently.",
    body: [
      "Two things make the trajectory worth recording. It grew from about R$20m to R$120m in revenue across four years, and it did so from Recife rather than Sao Paulo - a genuine counterexample to the assumption that Brazilian technology is a Sao Paulo story, and one that matters to anybody deciding where a career can be built.",
      "The ownership is the other half. Embraer took a 37% indirect stake in 2016 through FIP Aeroespacial, a venture fund whose principal holders are Embraer and the BNDES, and later acquired control. That an aircraft manufacturer and a state development bank ended up owning the country's largest security specialist says more about how Brazilian technology is capitalised than any number of funding rounds would.",
      "Tempest acquired EZ-Security in 2018, which is the transaction that made it the largest specialist in the country by consolidation rather than by growth alone.",
    ],
    externalUrl: "https://www.tempest.com.br/",
    externalLabel: "Tempest",
  },
  {
    slug: "cipher",
    sources: [
      { label: "Baguete, 1 July 2020 - notes that in 2018 Prosegur, a private-security company with more than 175,000 staff in 25 countries, signed an agreement to acquire a majority stake in Cipher", url: "https://www.baguete.com.br/noticias/01/07/2020/embraer-compra-controle-da-tempest", sourceNote: "Cipher appears here as reported context inside an article about Tempest, which is how the two Brazilian security acquisitions of that period are usually recorded together." },
    ],
    tags: ["services"],
    group: "contemporary",
    name: "Cipher - the other one that was bought",
    tagline: "A large Brazilian security firm acquired by a physical-security multinational, two years before the same thing happened to its rival.",
    intro: "Cipher was one of Brazil's larger cybersecurity companies until 2018, when Prosegur - a private-security multinational with more than 175,000 employees across 25 countries - signed an agreement for a majority stake.",
    body: [
      "Read beside the Tempest entry it makes a point neither makes alone. Within roughly two years, the two largest Brazilian specialist security firms were both bought by companies from outside the technology industry: one by an aircraft manufacturer, the other by a physical-security operator.",
      "Both acquirers were buying the same thing - a digital capability they could not build at the speed their existing customers were asking for it. That is a specific market condition rather than a coincidence, and it is why the period saw so little Brazilian security consolidation between Brazilian technology companies.",
    ],
  },
  {
    slug: "clm",
    sources: [
      { label: "CLM - institutional page: a Value Added Distributor operating across Latin America with branches in Brazil, Colombia, Peru, Ecuador and the United States; Sao Paulo, Bogota, Lima, Santiago, Miami", url: "https://clm.tech/en-institutional/" },
      { label: "Baguete - CLM as exclusive Drobo distributor in Brazil (2011), and as distributor for A10 Networks and Allot; described as a Sao Paulo distributor specialising in information security", url: "https://www.baguete.com.br/noticias/software/12/04/2011/clm-distribuidor-exclusivo-da-drobo-no-br" },
    ],
    tags: ["distributor"],
    group: "contemporary",
    name: "CLM - value-added distribution across Latin America",
    tagline: "The layer that decides which security products a Latin American reseller can actually sell.",
    intro: "CLM is a value-added distributor operating across Latin America - Brazil, Colombia, Peru, Ecuador and the United States - specialising in information security, infrastructure and data protection. Its line card over the years has carried Cisco Security, Sophos, Barracuda, A10 Networks, Arista, Huawei and others.",
    body: [
      "A distributor's catalogue is a useful historical document, and CLM's is a compact map of this timeline: several of the vendors it has represented have their own entries here, and the ones that no longer appear on its list mostly stopped existing under those names.",
      "The regional scope is the part worth noting. Distribution is normally organised country by country because import rules, currency and channel relationships are national - so a distributor operating across five countries is absorbing five sets of those problems on behalf of resellers who could not each solve them alone.",
    ],
    externalUrl: "https://clm.tech/",
    externalLabel: "CLM",
  },
  {
    slug: "yssy",
    sources: [
      { label: "YSSY - company site: infrastructure, cloud, data, AI, observability and cybersecurity; certifications listed as ISO 9001, 14001, 20000-1, 27001, 27701 and 37001; sectors named as energy, industry, health, financial, government and technology", url: "https://yssy.com.br/" },
    ],
    tags: ["services", "reseller"],
    group: "contemporary",
    name: "YSSY - integration with the certificates to prove it",
    tagline: "A Brazilian integrator whose public face is a list of standards it holds.",
    intro: "YSSY is a Brazilian technology company covering infrastructure, cloud, data, observability and cybersecurity, working sectors where continuity is regulated rather than merely desirable - energy, health, financial services and government.",
    body: [
      "What distinguishes its public presentation is the certification list: ISO 9001, 14001, 20000-1, 27001, 27701 and 37001 - quality, environment, IT service management, information security, privacy and anti-bribery. That combination is not a marketing choice so much as an entry requirement, because the buyers in those sectors cannot contract with a supplier who lacks them.",
      "It is a useful illustration of how the Brazilian enterprise market actually gates suppliers. In segments where an auditor reviews the supply chain, a certificate is not evidence of quality to an engineer - it is permission to bid, and firms organise around obtaining it.",
    ],
    externalUrl: "https://yssy.com.br/",
    externalLabel: "YSSY",
  },

  // ---- Backlog batch 5 (2026-08-11). SERPRO had NO ENTRY despite being named
  // in PRIME's own Cisco chapter as a customer he served - found by checking,
  // not by the backlog. Dataprev surfaced inside a search for something else.
  // Binario is deliberately SHORT: no third-party source exists, and the entry
  // says so rather than padding. ----
  {
    slug: "serpro",
    sources: [
      { label: "Servico Federal de Processamento de Dados (Serpro) - Brazilian IT services public company", url: "https://en.wikipedia.org/wiki/Serpro" },
      { label: "Serpro - official site", url: "https://www.serpro.gov.br/" },
    ],
    tags: ["services", "datacentre"],
    group: "other",
    relationships: ["worked-with-directly"],
    name: "Serpro - the federal government's data processing",
    founded: 1964,
    tagline: "Runs the systems a Brazilian citizen cannot opt out of.",
    intro: "Serpro is the Brazilian federal government's data processing service, and it operates the category of system that has no competitor and no acceptable downtime: tax collection, foreign trade, federal registries. When a system like that is unavailable, the alternative is not a different supplier - it is that the function of government stops for the day.",
    body: [
      "That constraint produces a different engineering culture from the commercial estates most of this timeline documents. Change is slow because a failed change has no commercial consequence and a constitutional one; systems live for decades because replacing them requires the country to keep operating during the replacement; and the platform choices of the 1970s and 1980s are still present because nothing forced them out.",
      "It also sits at the centre of Brazil's national computing story. The market-reserve period was justified partly by the argument that a country should not depend on foreign suppliers for exactly these systems, and Serpro is what that argument was built around.",
    ],
    externalUrl: "https://www.serpro.gov.br/",
    externalLabel: "Serpro",
  },
  {
    slug: "dataprev",
    sources: [
      { label: "Dataprev - Brazilian public company; founded 4 November 1974; Brasilia; operates CNIS, Caged, SINE, CTPS and other social-security systems", url: "https://en.wikipedia.org/wiki/Dataprev" },
    ],
    tags: ["services", "datacentre"],
    group: "other",
    name: "Dataprev - social security as a computing problem",
    founded: 1974,
    tagline: "Formed from the merged data centres of the social security institutes, and still holding the record of who is owed what.",
    intro: "Dataprev was created in 1974 from the merger of the data processing centres of Brazil's social security institutes, and it runs the systems that decide whether a pension is paid. Its records are the national employment and contribution history, which makes it one of the few systems whose correctness is directly a person's income.",
    body: [
      "The scale is easy to state and hard to appreciate: a benefit calculation depends on a contribution history that may span fifty years, recorded by institutions that no longer exist, on formats that changed repeatedly. Every migration in that estate carries the risk of losing somebody's working life.",
      "It belongs on this timeline beside Serpro because the two together are what Brazilian state computing actually is - not a policy, but two organisations holding records that predate most of the technology used to hold them.",
    ],
    externalUrl: "https://en.wikipedia.org/wiki/Dataprev",
    externalLabel: "Dataprev",
  },
  {
    slug: "nava",
    sources: [
      { label: "Nava - company site: formed from the merger of business units, founded originally as Unicom (infrastructure, data centres, connectivity), with FlexVision created for IT platform development and infrastructure operations", url: "https://nava.com.br/en/who-we-are/" },
      { label: "Company listing describing Nava as the result of the merger of FlexVision and Unicom, with sector expertise in payments, telecommunications, financial services and industry", url: "https://programathor.com.br/companies/5632" },
    ],
    tags: ["services", "reseller"],
    group: "contemporary",
    name: "Nava - three companies that became one name",
    tagline: "Unicom built the infrastructure, FlexVision built the software, and the merged company had to be both.",
    intro: "Nava is the result of merging business units that started as separate companies: Unicom, working in infrastructure, data centres and connectivity, and FlexVision, created for the development and support of IT platforms and infrastructure operations. Its sector expertise sits in payments, telecommunications, financial services and industry.",
    body: [
      "The combination describes a real change in what Brazilian enterprise buyers wanted. An organisation that once bought infrastructure from one supplier and software from another increasingly wanted one accountable party for a system that spans both - and the merger of an infrastructure company with a software one is the supply side answering that.",
      "It also explains why the corporate record for firms like this is confusing: the legal entities persist under their original names in registries and court filings long after the brand has been unified, which is exactly what makes them hard to research and easy to leave out of a timeline.",
    ],
    externalUrl: "https://nava.com.br/",
    externalLabel: "Nava",
  },
  {
    slug: "binario",
    // CORRECTED 2026-08-11. The first version of this entry was written from
    // binario.com.br - a custom software house - and described the wrong
    // company. PRIME supplied binario.net. THE LESSON: a .com.br and a .net can
    // be different companies sharing a common Portuguese word, and the site
    // fetch that "confirms" a name confirms only that A company holds it.
    sources: [
      { label: "Binario.net - company site (network integration: routing and switching, application and content delivery, data centre, security, wireless)", url: "https://www.binario.net/quem-somos/" },
      { label: "Binario.net - Juniper Networks partnership: Juniper chosen at the start of Binario's activities, when it began as a network integrator for the IP world; described in 2015 as the largest Juniper integrator in the country with the most certifications; QoS also operates as a Juniper training centre for Latin America; 160 staff and five branches", url: "https://www.binario.net/blog/servicos-profissionais/juniper-uma-parceria-de-resultados/" },
      { label: "Inforchannel, April 2018 - Grupo Binario named Juniper Networks Services Partner of the Year 2017 for the Americas; operating with Juniper since the start of its activities in Brazil in 2005, implementing networks for the main telecommunications operators; Elite partner level", url: "https://inforchannel.com.br/2018/04/26/grupo-binario-e-premiado-parceiro-de-servicos-2017-na-regiao-cala-pela-juniper-networks/" },
    ],
    tags: ["reseller", "services", "training"],
    group: "contemporary",
    relationships: ["worked-with-directly"],
    founded: 2005,
    name: "Grupo Binario - the Juniper integrator, and its training arm",
    tagline: "Chose one vendor at founding and built a certification pipeline around it.",
    intro: "Grupo Binario was created in Sao Paulo in 2005 as a network integrator for the IP world, and it chose Juniper Networks at the start rather than assembling a multi-vendor catalogue. That decision defined everything after it: implementing networks for the major Brazilian telecommunications operators, and by 2015 being described as the largest Juniper integrator in the country with the highest number of certified engineers.",
    body: [
      "The group organised into divisions - Binario for integration and QoS for professional services, with a mobility division alongside them for a period - and reached around 160 staff across five branches, serving service providers, enterprises, government and education.",
      "The single-vendor commitment is the part worth understanding. An integrator that spreads across vendors hedges its risk and dilutes its depth; one that commits gets the certifications, the escalation path and the awards, and accepts that its fortunes are tied to a manufacturer's. The awards followed - Services Partner of the Year 2017 for the Americas, and the partner tiers that only open above a certification threshold - and so did the exposure, when Juniper was later acquired.",
    ],
    externalUrl: "https://www.binario.net/",
    externalLabel: "Binario.net",
  },

  // ---- QoS, added 2026-08-11 from the sources PRIME supplied. It belongs with
  // the training cluster: a vendor-authorised training centre run from inside an
  // integrator, teaching since 2006. No externalUrl - QoS has no separate site
  // that was verified this turn; it is reached through Grupo Binario. ----
  {
    slug: "qos-training",
    sources: [
      { label: "Portal Information Management, November 2016 - QoS, a Grupo Binario company, offering Juniper certification on the same date and site as the training; teaching the manufacturer's certification courses since 2006, with 3,208 students by then; quotes Bruno Carvalho, senior systems engineer", url: "https://docmanagement.com.br/05/11/2016/qos-empresa-do-grupo-binario-oferece-certificacao-juniper/" },
      { label: "OverBR, November 2013 - QoS as the Grupo Binario services division and the first partner in Latin America to migrate to Juniper Partner Support Services; around 200 Juniper certifications across the group; services span IP routing architecture, multicast, MPLS and VPN, end-to-end network security and assisted operation", url: "https://overbr.com.br/midia-corporativa/qos-e-primeiro-parceiro-da-america-latina-a-migrar-para-o-juniper-partner-support-services" },
    ],
    tags: ["training", "services"],
    group: "contemporary",
    relationships: ["worked-with-directly"],
    name: "QoS - a Juniper training centre for Latin America",
    tagline: "Teaching the manufacturer's certification courses since 2006, from inside an integrator.",
    intro: "QoS is the professional-services division of Grupo Binario, and it has operated as a Juniper training centre for Latin America - delivering the manufacturer's certification courses since 2006, with more than three thousand students by 2016.",
    body: [
      "A training centre run from inside an integrator is a specific arrangement with a specific advantage: the instructors are the engineers who implement the networks, so the course material is tested against deployments rather than only against a curriculum. It has a matching risk, which is that teaching capacity competes with billable project work for the same people.",
      "One detail from its 2016 announcement is worth keeping because it describes a real friction in certification: students previously finished a course and then travelled elsewhere to sit the exam, adding cost and delay. Offering the exam at the same place and on the same date removed a gap that had nothing to do with learning and everything to do with logistics - which is the kind of problem that decides how many engineers a country actually certifies.",
    ],
  },
];

/** Look up a partner vendor by slug. */
export function getPartnerVendor(slug: string): PartnerVendor | undefined {
  return partnerVendors.find((v) => v.slug === slug);
}

/** All slugs, for static generation. */
export const partnerVendorSlugs = partnerVendors.map((v) => v.slug);


/**
 * TAG ROUTE SLUGS. `/industry/<this>` renders a filtered timeline.
 *
 * Plural where English is plural, which is why the map exists at all rather
 * than just appending an "s": `services`, `training` and `standards` are
 * already plural or uncountable, and "trainings" is not a word anyone should
 * have to read.
 *
 * *** THESE MUST NEVER COLLIDE WITH A COMPANY SLUG OR A CAREER SLUG. *** They
 * share the `/industry/[slug]` route, so a company called "vendors" would be
 * unreachable and nobody would notice until somebody went looking for it. A
 * guard checks this.
 */
export const TAG_ROUTES: Record<string, VendorTag> = {
  vendors: "vendor",
  distributors: "distributor",
  resellers: "reseller",
  services: "services",
  carriers: "carrier",
  datacentres: "datacentre",
  training: "training",
  standards: "standards",
};

/** Reverse lookup: tag -> the URL segment that lists it. */
export const TAG_ROUTE_FOR: Record<VendorTag, string> = Object.fromEntries(
  Object.entries(TAG_ROUTES).map(([route, tag]) => [tag, route]),
) as Record<VendorTag, string>;

/** Every company carrying a given tag, in the timeline's chronological order. */
export function vendorsByTag(tag: VendorTag): PartnerVendor[] {
  return partnerVendors
    .filter((v) => v.tags?.includes(tag))
    .sort((a, b) => (a.founded ?? 0) - (b.founded ?? 0));
}
