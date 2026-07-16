// ============================================================================
// TANDEM COMPUTERS - the machine that never stops. Knowledge-based, dates
// well-documented (2026-07-16): founded 1974, Cupertino, by James (Jimmy)
// Treybig (ex-HP) with Mike Green, Jim Katzman, Jack Loustaunou (Kleiner
// Perkins-backed); NonStop I ships 1976 - process pairs, mirrored I/O,
// shared-nothing multiprocessor, Guardian OS; the fault-tolerant category
// leader for ATMs, card networks, exchanges, 911; famed culture (First
// Friday beer busts, TOPS); ServerNet interconnect (1995) - ideas feed the
// InfiniBand lineage; Compaq acquires Tandem June 1997 (~$3B stock),
// carrying NonStop into HP (2002) and HPE, where NonStop is STILL sold and
// developed today on x86 - one of the industry's longest-lived architectures.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const tandemProfile: VendorProfile = {
  slug: "tandem",
  foundings: [
    {
      company: "Tandem Computers",
      year: 1974,
      place: "Cupertino, California",
      founders: ["Jimmy Treybig", "Mike Green", "Jim Katzman", "Jack Loustaunou"],
      story:
        "Jimmy Treybig left HP with a heretical premise: build a computer assuming components WILL fail, and architect so no single failure ever stops a transaction. The 1976 NonStop I delivered it - paired processes shadowing each other across a shared-nothing multiprocessor, mirrored disks, an OS (Guardian) that made takeover invisible. Banks, card networks, and stock exchanges - the places where a minute down is measured in millions - standardized on Tandem, and fifty years later the architecture is still sold, by HPE, doing exactly those jobs.",
    },
  ],
  timeline: [
    { year: 1976, title: "NonStop I", detail: "The first commercial fault-tolerant computer ships: process pairs, no shared memory, every path mirrored - continuous availability as an architecture, not a promise." },
    { year: 1980, title: "The transaction decade", detail: "ATM networks, card authorization, and exchanges adopt NonStop as the category standard; Tandem grows into the Fortune 500 with a culture - Friday beer busts, radical internal transparency - as famous as the machines." },
    { year: 1987, title: "Scaling out before the word", detail: "FOX fiber interconnects link NonStop systems into what the industry later names clusters - Tandem's shared-nothing scaling prefigures the distributed-systems orthodoxy by a decade." },
    { year: 1995, title: "ServerNet", detail: "The system-area interconnect ships - low-latency, switched, RDMA-flavored ideas whose lineage flows into the InfiniBand standardization a few years later; Tandem's plumbing outlives its independence." },
    { year: 1997, title: "Compaq", detail: "June 1997: Compaq acquires Tandem in a ~$3 billion stock deal - the clone king buying enterprise credibility a year before it buys DEC; NonStop rides into HP in 2002.", sourceNote: "Deal per the public record." },
    { year: 2010, title: "Still NonStop, at HPE", detail: "Ported from MIPS to Itanium and then to x86, HPE NonStop keeps its process-pair soul on commodity silicon - among the longest-lived architectures in computing, still clearing the world's card swipes." },
  ],
  products: [
    { name: "NonStop systems", what: "The fault-tolerant line from NonStop I to today's HPE NonStop X - continuous availability for transaction processing." },
    { name: "Guardian / NonStop OS", what: "The operating system built around process pairs and takeover - failure handled beneath the application's notice." },
    { name: "ServerNet", what: "The switched system-area interconnect whose design ideas fed the InfiniBand era." },
  ],
  innovations: [
    { title: "Fault tolerance as architecture", detail: "Tandem moved reliability from redundant boxes to a designed property of the whole system - the availability thinking every modern distributed platform inherits." },
    { title: "Shared-nothing scale-out", detail: "Independent processors cooperating by message passing, mirrored state, transparent takeover - the pattern cloud databases rediscovered, shipped in 1976." },
  ],
  markets: [
    "The NonStop business persists inside HPE, running payment networks, exchanges, and telcos - the rare 1970s architecture still sold new, to customers who cannot be down.",
  ],
  analyst: [
    "The definitive vendor of the fault-tolerant evaluations for two decades - and the architecture the distributed-systems literature keeps rediscovering with new vocabulary.",
  ],
};
