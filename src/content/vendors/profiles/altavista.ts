// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - Wikipedia and Grokipedia: launched 15 December 1995 at
//     altavista.digital.com; the first full-text, boolean-searchable index of
//     the web; name from alta + vista, "high view", chosen for the Palo Alto
//     surroundings; Ilene H. Lang the first chief executive; defunct 8 July 2013
//   - History of Domains and EM360: as of 1998 it ran on TWENTY multi-processor
//     DEC Alpha machines with 130 GB of RAM and 500 GB of disk between them;
//     traffic from 300,000 hits on day one to over 80 million a day by 1997;
//     $50M of sponsorship revenue in 1997
//   - Optimus01: around 13 million queries a day at peak, and an index passing
//     140 million pages when competitors were counting in millions
//   - Alfawiki: the February 1998 "Internet Search-Off" finding it preferred by
//     45% of professional researchers against HotBot's 20%; the 2000 web
//     connectivity study run jointly with IBM and Compaq
//
// THE BODY ALREADY ARGUES the origin as a processor benchmark, the people, the
// Yahoo deal, Babel Fish, the four ownership changes, the portal decision and
// the closing verdict. This profile explains WHY the hardware mattered, which
// turns the founding anecdote into an engineering reason.
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const altavistaProfile: VendorProfile = {
  slug: "altavista",
  foundings: [
    {
      company: "AltaVista",
      year: 1995,
      place: "Palo Alto, California",
      founders: ["Paul Flaherty", "Louis Monier", "Michael Burrows"],
      story:
        "The name is Spanish for high view, chosen for the hills above Palo Alto. Ilene Lang, brought in to grow DEC's software business, became its first chief executive - a detail worth noting because the project began as research and acquired a commercial structure around it rather than the other way round.",
    },
  ],
  timeline: [
    { year: 1995, title: "Launch", detail: "Three hundred thousand hits on the first day." },
    {
      year: 1998,
      title: "Twenty machines, and the reason they mattered",
      detail:
        "The back end ran on twenty multi-processor Alpha systems holding 130 GB of memory and 500 GB of disk between them. In the same year a survey of professional researchers put it first at 45%, more than double the runner-up.",
    },
    { year: 1997, title: "Eighty million hits a day", detail: "And around $50M of sponsorship revenue - the first demonstration that search itself was a business rather than a feature." },
    {
      year: 2000,
      title: "Mapping the shape of the web",
      detail:
        "Researchers from AltaVista, IBM and Compaq used the crawl data to publish the first serious analysis of how the web is actually connected. The crawler built to generate a benchmark load ended up producing the reference dataset on the structure of the web itself.",
    },
  ],
  products: [
    { name: "Scooter", what: "The crawler. Multi-threaded when competitors' were not, which is the whole reason its index was larger: it fetched many pages at once rather than one after another." },
    { name: "The full-text index", what: "Every word of every page, held in memory across the cluster so a query could be answered without touching disk - which is the part that made it feel instant." },
    { name: "Babel Fish", what: "Built on Systran's translation engine rather than in-house, and it outlived AltaVista's own search business - still running under Yahoo's name in 2008, years after the index behind it had been switched off." },
    { name: "Image, audio and video search", what: "Added before the rest of the market thought of the web as containing anything other than documents." },
  ],
  innovations: [
    {
      title: "Sixty-four bits was the point, not the marketing",
      detail:
        "A 32-bit machine can address four gigabytes. A web index large enough to answer quickly has to sit in memory, and by 1998 this one occupied 130 GB across the cluster - more than thirty times what a 32-bit architecture could reach. DEC's Alpha was one of very few processors that could address it at all. The search engine did not merely demonstrate the hardware; it could not have existed without it.",
    },
    {
      title: "Crawling in parallel",
      detail:
        "Fetching one page, waiting, then fetching the next is bounded by network latency rather than by anything the machine can do. Running hundreds of fetches at once is obvious in retrospect and was not standard practice, and it is the difference between an index of millions and an index of hundreds of millions.",
    },
    {
      title: "Full text, not curation",
      detail:
        "Indexing every word of every page was a bet that the web would grow past any editorial team's ability to catalogue it. The directories that lost were not badly run - they were structurally unable to keep up, and the company that most needed that answer was buying results from this one within a year.",
    },
    {
      title: "A research artefact that mapped its own subject",
      detail:
        "The crawl produced the data behind the first real study of the web's connectivity structure. That is an unusual afterlife for a benchmark workload, and it is a fair illustration of what corporate research laboratories produced when they were funded to be curious rather than productive.",
    },
  ],
  markets: [
    "General web search, at a moment when the market did not yet know it was a market. It reached roughly thirteen million queries a day at peak and was the eleventh most-visited site on the web in 1998 and again in 2000 - and, revealingly, the clear favourite among professional researchers, who cared about recall rather than about a home page.",
    "Its competitors were the directories, the other crawlers, and eventually a company with a better ranking idea and no interest in being a portal.",
  ],
  analyst: [
    "There is nothing current to assess. What there is instead is one of the clearest cautionary records in this industry, and its clarity comes from the fact that the technology kept working the whole time.",
    "The index was the largest, the hardware was the fastest, the professional users preferred it, and the research it produced is still cited. The reversal of 2002 is the evidence rather than the argument: the same team and the same technology, returned to the same job, three years too late.",
  ],
};
