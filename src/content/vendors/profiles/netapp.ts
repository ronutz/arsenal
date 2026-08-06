// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - NetApp's own WAFL/snapshot datasheet and the Futurum product review:
//     WAFL does not rewrite existing blocks, it writes to a new block and
//     updates the active pointer; snapshots manipulate pointers only, copying
//     no data; metadata is held in regular files rather than in a fixed inode
//     structure; ONTAP's three components are the OS environment, the file
//     system and the data protection layer
//   - Wikipedia: WAFL designed for quick restarts without lengthy consistency
//     checks, and its author's remark that WAFL is not a file system although
//     it includes one
//   - NetApp FY2025 Q3 8-K: net revenues $1.64B for the quarter, all-flash
//     annualised run rate $3.8B up 10%, first-party and marketplace cloud
//     storage services up more than 40% year over year, GAAP operating margin
//     22%
//   - NetApp FY2026 8-K: IDC placing it among the top three global storage
//     vendors in Q3 2025; Leader and Fast Mover in GigaOm's Primary Storage
//     Radar
//
// THE BODY ALREADY ARGUES the naming, the Auspex origin, the dot-com arc and
// the Malcolm/CacheFlow/Blue Coat loop. This profile adds the technical core -
// which the body does not describe at all - and the cloud transition.
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const netappProfile: VendorProfile = {
  slug: "netapp",
  foundings: [
    {
      company: "Network Appliance",
      year: 1992,
      place: "Sunnyvale, California",
      founders: ["David Hitz", "James Lau", "Michael Malcolm"],
      story:
        "Incorporated in April on the proposition that file storage should be a box that does one job rather than a general-purpose server persuaded into doing it. The stated ambition was to make storage as simple as an appliance, and the company took its name from the category it intended to create.",
    },
  ],
  timeline: [
    { year: 1992, title: "Founded", detail: "In Sunnyvale, by three people, two of whom had come from Auspex." },
    { year: 1993, title: "The first filer", detail: "A dedicated network file server, sold as a finished thing rather than as parts to assemble." },
    { year: 1994, title: "Sequoia funds it", detail: "And Michael Malcolm leaves the chief executive role the same year." },
    { year: 1995, title: "Public", detail: "Three years from founding, on a product line one deep." },
    { year: 2002, title: "The correction", detail: "Fiscal 2002 revenue around $800M, down from above $1B." },
    { year: 2008, title: "Network Appliance becomes NetApp", detail: "The legal name changed." },
    {
      year: 2025,
      title: "The pivot showing in the numbers",
      detail:
        "Quarterly revenue of $1.64B, all-flash on an annualised run rate of $3.8B, and cloud storage services growing more than 40% year over year - the software business outgrowing the hardware one, on a company whose founding thesis was the hardware.",
    },
  ],
  products: [
    { name: "ONTAP", what: "The operating system, and the actual product. It has three parts: the execution environment, the file system, and the data protection layer - and it now runs on NetApp hardware, on commodity servers, and inside all three major clouds." },
    { name: "AFF and FAS", what: "The all-flash and hybrid arrays. The A-series takes the mission-critical workloads, the C-series the general-purpose ones, both speaking file, block and object from the same system." },
    { name: "StorageGRID", what: "Object storage for the data that is kept rather than used - archives, compliance, the material nobody reads until somebody has to." },
    { name: "Cloud Volumes ONTAP", what: "The same operating system running inside AWS, Azure and Google Cloud, so a workload can move without changing how its storage behaves. This is the pivot, expressed as a product." },
    { name: "FabricPool", what: "Automatic tiering of cold blocks out to object storage, which is the unglamorous economics of keeping expensive media for data that is actually being read." },
    { name: "Keystone", what: "Storage sold as a subscription rather than as capital equipment - the same shift every infrastructure vendor has been pushed into by the cloud's pricing model." },
  ],
  innovations: [
    {
      title: "Never overwrite a block",
      detail:
        "WAFL writes changed data to a new block and moves the pointer, rather than rewriting the original. That single decision is the foundation: it makes writes fast because they can go anywhere convenient, and it makes crash recovery quick because the previous consistent state is still intact on disk.",
    },
    {
      title: "Snapshots as pointer arithmetic",
      detail:
        "Because nothing is overwritten, a point-in-time copy is a copy of the pointers rather than of the data. That makes snapshots effectively instant and nearly free in space - and it is why a feature every competitor eventually had to answer was, here, a consequence of the file system rather than a product bolted onto it.",
    },
    {
      title: "Metadata kept in ordinary files",
      detail:
        "Most file systems fix their metadata structures into the on-disk format, which makes changing them a migration. WAFL holds metadata in regular files, so the format can evolve without moving anybody's data. That is a large part of why a design from 1992 is still shipping.",
    },
    {
      title: "Selling the software once the box stopped being the point",
      detail:
        "A company named after an appliance now sells its operating system to run inside other people's clouds, and that line is growing faster than the hardware. It worked because the value was always the file system rather than the sheet metal around it - which was not obvious at the time and is the reason the transition was survivable.",
    },
  ],
  markets: [
    "Enterprise storage across every sector that keeps more data than it can move: financial services, healthcare, media, research computing, and increasingly the data pipelines behind machine learning, where the problem is feeding accelerators fast enough rather than storing cheaply.",
    "Reported around $6.6B of annual revenue, with all-flash and cloud services carrying the growth. Its competitors are the other large array vendors, the hyperscalers' own storage services, and the software-defined entrants that make the same argument NetApp made in 1992 against the incumbents of that decade.",
  ],
  analyst: [
    "Placed among the top three global enterprise storage vendors in IDC's quarterly tracker for the third quarter of 2025, and named a Leader and Fast Mover in GigaOm's primary storage assessment.",
    "The assessment worth noting is not the ranking but the shape: a thirty-year-old hardware company whose fastest-growing line is software running on infrastructure it does not own. Most of its contemporaries from 1992 did not manage that transition, and several of them appear elsewhere on this timeline having ended inside somebody else.",
  ],
};
