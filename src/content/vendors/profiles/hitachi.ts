// ============================================================================
// HITACHI - the industrial giant that stores the world. Knowledge-based,
// dates well-documented (2026-07-16): founded 1910 by Namihei Odaira as the
// repair shop of Kuhara Mining in Hitachi, Ibaraki; first product a 5-HP
// induction motor. Rail from the 1920s; mainframes in the plug-compatible
// era (and the 1982 FBI/IBM sting, guilty pleas 1983); IBM's HDD business
// acquired 2003 (~$2B) -> HGST -> sold to Western Digital 2012 (~$4.8B);
// Hitachi Data Systems formed 1989 (National Advanced Systems) -> Hitachi
// Vantara 2017; Class 800 UK trains, Shinkansen heritage; Lumada 2016;
// GlobalLogic 2021 (~$9.6B); ABB's power grids -> Hitachi Energy 2020-22.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const hitachiProfile: VendorProfile = {
  slug: "hitachi",
  foundings: [
    {
      company: "Hitachi",
      year: 1910,
      place: "Hitachi, Ibaraki, Japan",
      founders: ["Namihei Odaira"],
      story:
        "Namihei Odaira ran the electrical repair shop of a copper mine and believed Japan should build its own machines rather than import them - his first product, a five-horsepower induction motor, is still the company's origin icon. From that motor grew one of the broadest industrial companies on earth: locomotives and turbines, mainframes and disk drives, storage arrays and proton-beam therapy - a conglomerate whose storage lineage in particular runs straight through this site's subject matter.",
    },
  ],
  timeline: [
    { year: 1924, title: "Rail begins", detail: "Hitachi delivers Japan's first large domestically built DC electric locomotive - the start of a rail lineage that later contributes Shinkansen trainsets and, from 2015, builds Britain's intercity fleet in County Durham." },
    { year: 1974, title: "The plug-compatible era", detail: "Hitachi's M-series mainframes compete head-on with IBM as plug-compatibles - Japanese engineering matching Armonk's architecture at better price-performance, one of the era's defining industrial contests." },
    { year: 1982, title: "The IBM sting", detail: "An FBI operation catches Hitachi employees buying IBM design documents; guilty pleas follow in 1983. The affair is a landmark of industrial-espionage history - and a measure of how high the mainframe stakes ran.", sourceNote: "Per the extensive contemporary public record of the case." },
    { year: 1989, title: "Hitachi Data Systems", detail: "Hitachi and EDS acquire National Advanced Systems, creating HDS - the channel through which Hitachi's mainframes and, decisively, its enterprise storage arrays (later the USP and VSP lines) reach the world's data centers." },
    { year: 2003, title: "Buying IBM's disk drives", detail: "Hitachi acquires the business that invented the hard drive (~$2 billion), forming HGST - Deskstar, Travelstar, the Microdrive. Nine years later HGST sells to Western Digital for ~$4.8 billion, its engineering still inside much of the world's spinning storage.", sourceNote: "Deal figures per the public record." },
    { year: 2017, title: "Vantara and the pivot", detail: "HDS becomes Hitachi Vantara (storage plus Pentaho analytics); Lumada (2016) frames the IoT-and-data strategy; GlobalLogic (~$9.6B, 2021) and ABB's power grids (Hitachi Energy) complete the transformation into a 'social innovation' giant - industry plus data." },
  ],
  products: [
    { name: "VSP storage arrays", what: "The enterprise storage line (via HDS/Vantara) long synonymous with mainframe-class reliability in open-systems SANs." },
    { name: "HGST drives", what: "The 2003-2012 chapter that put Hitachi engineering inside the world's hard drives - Deskstar to Ultrastar." },
    { name: "Rail systems", what: "From that 1924 locomotive to Shinkansen components and the UK's Class 800 fleet - the other network Hitachi builds." },
  ],
  innovations: [
    { title: "Storage as an enterprise discipline", detail: "Hitachi's arrays made five-nines storage a product category of its own - the reliability culture SAN administrators inherited." },
    { title: "The conglomerate that kept its engineering", detail: "Where peers financialized, Hitachi's breadth - motors to mainframes to medical - stayed anchored in manufacturing; the pivot to data (Lumada, Vantara) is engineering-led too." },
  ],
  markets: [
    "Hitachi today spans IT (Vantara, GlobalLogic), energy (Hitachi Energy), and mobility - one of Japan's largest companies, its storage lineage still racked in enterprise data centers worldwide.",
  ],
  analyst: [
    "The quiet giant of these pages: less famous per logo than its peers, but touch a SAN, a hard drive of a certain vintage, or a British express train and the odds are good the engineering traces to Odaira's motor shop.",
  ],
};
