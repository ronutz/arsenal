// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - Forbes "A Very Short History of EMC" (Gil Press): incorporated 23 August
//     1979 by two former college roommates who had no product idea and began by
//     selling office furniture; Intel representatives in New England from 1980;
//     first product in 1981, Prime-compatible memory at half Prime's price;
//     Symmetrix introduced September 1990 as an Integrated Cached Disk Array;
//     38% of revenue by 1991; the memory lines eliminated in 1991; Marino's 1994
//     remark that he had not understood the decision at the time
//   - Tech Monitor: the C in EMC attributed to Connolly and Curley, who left
//     the venture early
//   - Wikipedia and HandWiki: first 64KB memory boards for Prime in 1981;
//     Hopkinton, Massachusetts; NYSE 1986-2016
//   - M&A Watch and companieshistory: revenues past $5B by 1999; Data Domain
//     $2.1B in 2009 and Isilon $2.25B in 2010; the Dell deal financed largely
//     with about $50B of newly issued debt, giving Dell an 81% VMware stake
//
// *** METHOD NOTE: this profile was RESEARCHED AND DRAFTED BEFORE the existing
// body was read, as a test of whether reading first causes the paraphrasing
// that has recurred in thirteen of nineteen entries. Reconciliation afterwards
// found almost no overlap - and found that THE BODY NEVER MENTIONS SYMMETRIX,
// the product that made the company. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const emcProfile: VendorProfile = {
  slug: "emc",
  foundings: [
    {
      company: "EMC",
      year: 1979,
      place: "Massachusetts",
      founders: ["Richard Egan", "Roger Marino"],
      story:
        "Two former Northeastern roommates, 43 and 40, quit their jobs in August with no product and no plan, and began by selling office furniture to fund whatever came next. They became Intel's New England representatives the following year, and built their first real product in 1981 on a customer's suggestion: memory boards for Prime minicomputers, more reliable than Prime's own and at half the price.",
      sourceNote:
        "The C in EMC is generally attributed to Connolly and Curley, two participants who left early - which is why the name outlasted them and the initials no longer decode.",
    },
  ],
  timeline: [
    { year: 1981, title: "The first product", detail: "64-kilobyte memory boards for Prime Computer, sold on reliability and price against the manufacturer's own. The business for its first decade was extending the life of machines other people had built." },
    {
      year: 1990,
      title: "Symmetrix",
      detail:
        "An Integrated Cached Disk Array: many small disks behind a large cache, presented to a mainframe as storage. Before it, storage was an afterthought that arrived with the computer - a single large expensive disk, chosen by whoever sold you the mainframe. By 1991 this one product was 38% of revenue.",
    },
    {
      year: 1991,
      title: "The memory business is shut down",
      detail:
        "Having built the company on memory boards, Egan discontinued them to concentrate on disk arrays. His co-founder said publicly in 1994 that at the time he could not understand why anyone would kill such a profitable line, and that he had come to see it as superlative timing.",
    },
    { year: 1999, title: "Past five billion", detail: "Annual revenue above $5B, on a product category the company had largely invented as a category." },
    { year: 2009, title: "Data Domain, then Isilon", detail: "$2.1B for deduplication and $2.25B the following year for scale-out storage - buying the two architectures that were displacing the one it had built." },
    { year: 2016, title: "Dell", detail: "$67B, financed with roughly $50B of newly issued debt, and Dell took an 81% stake in VMware with it." },
  ],
  products: [
    { name: "Symmetrix", what: "The high-end array that made the company, and the reason a storage purchase became a separate decision from a server purchase." },
    { name: "CLARiiON", what: "The midrange line, sold where a Symmetrix was more array than the customer needed - which is the segmentation problem every high-end vendor eventually has to solve." },
    { name: "Data Domain and Isilon", what: "Deduplication and scale-out file storage, bought rather than built, addressing two things the monolithic array was structurally bad at." },
    { name: "VMware", what: "Never a storage product, and never integrated into one. It was held rather than absorbed, which is unusual enough to be the reason it kept its value." },
    { name: "RSA", what: "Encryption, tokens and identity - a coherent argument about protecting data and an awkward fit alongside array engineering." },
  ],
  innovations: [
    {
      title: "Making storage a purchase in its own right",
      detail:
        "Before Symmetrix a mainframe buyer took whatever storage the mainframe vendor sold. Building an array that outperformed those options and worked with all of them turned a bundled component into a competitive market - which is the single largest thing this company did, and it created the category every other vendor on this timeline sells into.",
    },
    {
      title: "Many cheap disks behind a large cache",
      detail:
        "The insight was that an array of small commodity drives with enough cache in front could beat a single large expensive one on speed, resilience and footprint at once. It is the same argument that later produced RAID everywhere, arriving as a product rather than as a paper.",
    },
    {
      title: "Killing the profitable business",
      detail:
        "Discontinuing the memory line in 1991 while it was still making money is the decision the company turned on, and the co-founder's admission that he opposed it at the time is worth more than any strategy statement. Most companies on this timeline that failed did so by defending a profitable line one year too long.",
    },
    {
      title: "Buying the thing that ate you",
      detail:
        "Data Domain and Isilon were bought because deduplication and scale-out architectures were undermining the monolithic array. VMware became the most valuable thing the company owned. An incumbent that buys its own disruption early enough gets to keep the customer; the record of this timeline is that most of them buy too late.",
    },
  ],
  markets: [
    "Enterprise data centres, mainframes first and then open systems - the organisations for whom storage is a line item large enough to have its own procurement. Revenue passed $5B by 1999 and the company was the reference against which NetApp, HDS and IBM's storage divisions were measured.",
    "Its position rested on being independent of the server vendors, which is what made 'best of breed' a phrase storage buyers actually used - and which ended when it became part of one.",
  ],
  analyst: [
    "For roughly two decades it was assessed as the leader in enterprise storage without serious argument, and the interesting question was always which competitor was gaining rather than whether EMC was ahead.",
    "The closing verdict is arithmetic. A company built on memory boards for other people's minicomputers became a $67B acquisition, and a substantial part of that price was a virtualisation company it had never made part of its own product line. The best investment a storage company ever made was in software that had nothing to do with storage.",
  ],
};
