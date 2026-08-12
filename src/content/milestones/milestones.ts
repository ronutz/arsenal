// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/content/milestones/milestones.ts
// ----------------------------------------------------------------------------
// MILESTONES — the physics and engineering the company timeline sits on top of.
//
// WHY THIS IS SEPARATE FROM `/industry` (PRIME, 2026-08-02).
// The company timeline starts in the 1830s only because one distributor's
// parent traded lumber. Everything else on it is a firm. Faraday is not a firm,
// and putting 1831 on a page whose next card is a networking vendor changes
// what that page is claiming to be. So these live at `/industry/milestones`:
// same idea, its own structure, cross-linked both ways.
//
// WHAT EARNS A PLACE HERE. Not "important events in science" - the test is
// narrower and it is this: **could a network engineer's working day be
// explained without it?** Induction, the transistor, Shannon's channel
// capacity, the first hard disk, Ethernet. Things that are upstream of the job
// rather than adjacent to it.
//
// EVERY ENTRY CARRIES `why` — what it means for the work, not just what
// happened. An entry that only says what happened belongs in an encyclopaedia,
// and there is a good one already.
// ============================================================================

/** Which thread of the story an entry belongs to. */
export type MilestoneStrand =
  /** Making, moving and understanding electrical energy. */
  | "electricity"
  /** Controlling it: valves, transistors, integrated circuits. */
  | "electronics"
  /** Representing information as discrete symbols, and reasoning about it. */
  | "digital"
  /** Keeping it: tape, disk, flash. */
  | "storage"
  /** Moving it: telegraph, telephone, radio, packets, fibre. */
  | "transfer"
  /**
   * MAKING IT (PRIME 2026-08-11). The five strands above record what was
   * invented. None of them records HOW ANY OF IT GETS BUILT - and the answer
   * changed the industry more than several of the inventions did. A networking
   * vendor today designs a product it does not manufacture, on silicon it does
   * not fabricate, using a processor architecture it licenses rather than owns.
   * Every step of that arrangement was invented by somebody, on a date.
   */
  | "making";

export const MILESTONE_STRANDS: readonly MilestoneStrand[] = [
  "electricity",
  "electronics",
  "digital",
  "storage",
  "transfer",
  "making",
] as const;

export interface Milestone {
  slug: string;
  /** The year attributed. Where sources disagree, `dateNote` says so. */
  year: number;
  title: string;
  strand: MilestoneStrand;
  /** Who did it, where a person or team is properly attributable. */
  who?: string;
  /** What happened, in a sentence or two. */
  what: string;
  /** *** Why it matters to the work this site is about. Required. *** */
  why: string;
  /** Recorded disagreement about dating or attribution. */
  dateNote?: string;
  sources: { label: string; url?: string }[];
}

// ============================================================================
// The entries. Chronological within the file for readability; sorted at render.
// ============================================================================

export const MILESTONES: Milestone[] = [
  // -- ELECTRICITY ----------------------------------------------------------
  {
    slug: "voltaic-pile",
    year: 1800,
    title: "The voltaic pile",
    strand: "electricity",
    who: "Alessandro Volta",
    what: "A stack of alternating zinc and copper discs separated by brine-soaked cloth, producing a steady electric current rather than the momentary discharge of a static machine.",
    why: "Everything downstream needs current that keeps flowing. Static electricity had been known for centuries and was useless for it. This is the first thing on the list because without a continuous source there is nothing to modulate, switch or send.",
    sources: [{ label: "Volta's 1800 letter to the Royal Society describing the pile", url: "https://en.wikipedia.org/wiki/Voltaic_pile" }],
  },
  {
    slug: "oersted-magnetism",
    year: 1820,
    title: "A current deflects a compass needle",
    strand: "electricity",
    who: "Hans Christian Ørsted",
    what: "A wire carrying current was observed to move a nearby compass needle, showing that electricity and magnetism are aspects of one phenomenon rather than two curiosities.",
    why: "Every motor, every transformer, every read head over a disk platter and every signal induced onto the wrong pair in a cable bundle is this observation, applied. Crosstalk is Ørsted's experiment happening when you did not ask for it.",
    sources: [{ label: "Ørsted's 1820 report on the effect of a current on a magnetic needle", url: "https://en.wikipedia.org/wiki/Hans_Christian_%C3%98rsted" }],
  },
  {
    slug: "faraday-induction",
    year: 1831,
    title: "Electromagnetic induction",
    strand: "electricity",
    who: "Michael Faraday",
    what: "A changing magnetic field induces a current in a nearby conductor. The reciprocal of Ørsted: not only does current make magnetism, changing magnetism makes current.",
    why: "This is generation, transformation and every inductive coupling problem in one law. It is also why twisted pair works: twist the conductors and the interference induced into each is roughly equal, so the difference between them - the thing the receiver actually reads - is largely clean.",
    sources: [{ label: "Faraday's Experimental Researches in Electricity, first series, 1831", url: "https://en.wikipedia.org/wiki/Faraday%27s_law_of_induction" }],
  },
  {
    slug: "maxwell-equations",
    year: 1865,
    title: "A dynamical theory of the electromagnetic field",
    strand: "electricity",
    who: "James Clerk Maxwell",
    what: "A set of equations describing electricity, magnetism and light as one field phenomenon, predicting that electromagnetic waves propagate at the speed of light.",
    why: "The prediction came before the demonstration, which is worth noticing: radio existed on paper for two decades before anyone made it. Every wireless standard is an engineering treatment of this result, and propagation, attenuation and antenna design are all applied Maxwell.",
    sources: [{ label: "Maxwell, A Dynamical Theory of the Electromagnetic Field, Philosophical Transactions, 1865", url: "https://en.wikipedia.org/wiki/A_Dynamical_Theory_of_the_Electromagnetic_Field" }],
  },
  {
    slug: "hertz-waves",
    year: 1887,
    title: "Electromagnetic waves demonstrated",
    strand: "electricity",
    who: "Heinrich Hertz",
    what: "A spark-gap transmitter and a loop receiver, showing that the waves Maxwell had predicted existed, could be reflected and refracted, and travelled at the predicted speed.",
    why: "The moment radio became an engineering problem rather than a mathematical one. Hertz reportedly saw no use for it, which is a useful reminder about the distance between a demonstration and an application.",
    sources: [{ label: "Hertz's 1887-88 experiments on electromagnetic waves", url: "https://en.wikipedia.org/wiki/Heinrich_Hertz" }],
  },

  // -- ELECTRONICS ----------------------------------------------------------
  {
    slug: "fleming-valve",
    year: 1904,
    title: "The thermionic valve",
    strand: "electronics",
    who: "John Ambrose Fleming",
    what: "A heated filament in an evacuated tube, allowing current in one direction only - the first electronic diode.",
    why: "Rectification is the first thing you can do to a signal that is not simply carrying it. Detection of radio signals starts here, and so does the idea that a device can act on a signal rather than merely conduct it.",
    sources: [{ label: "Fleming's 1904 patent for the oscillation valve", url: "https://en.wikipedia.org/wiki/Fleming_valve" }],
  },
  {
    slug: "de-forest-triode",
    year: 1906,
    title: "The triode, and amplification",
    strand: "electronics",
    who: "Lee de Forest",
    what: "A third electrode added to the valve, letting a small voltage control a much larger current.",
    why: "Amplification is the property that makes long-distance anything possible. A signal that weakens with distance can now be rebuilt. Every repeater, every line amplifier and eventually every logic gate is a descendant of controlling a large current with a small one.",
    sources: [{ label: "de Forest's audion patents, 1906-1908", url: "https://en.wikipedia.org/wiki/Audion" }],
  },
  {
    slug: "transistor",
    year: 1947,
    title: "The transistor",
    strand: "electronics",
    who: "John Bardeen, Walter Brattain and William Shockley, Bell Labs",
    what: "A solid-state device doing the valve's job - amplifying and switching - without a vacuum, a heater or the fragility of glass.",
    why: "The valve worked but could not scale: it was large, hot, power-hungry and it failed. Everything about modern computing follows from being able to make this device small, cheap and reliable, and then to make a great many of them at once.",
    sources: [{ label: "Bell Labs, December 1947 demonstration of the point-contact transistor", url: "https://en.wikipedia.org/wiki/Point-contact_transistor" }],
  },
  {
    slug: "integrated-circuit",
    year: 1958,
    title: "The integrated circuit",
    strand: "electronics",
    who: "Jack Kilby at Texas Instruments, and Robert Noyce at Fairchild",
    what: "Multiple components fabricated on a single piece of semiconductor rather than wired together as discrete parts.",
    dateNote:
      "Two independent inventions, months apart, with different approaches: Kilby's demonstration was in 1958, Noyce's planar process work in 1959. The planar approach is the one that scaled. Both are credited.",
    why: "The step from 'we can make a transistor' to 'we can make a million of them and they are all connected correctly'. Wiring components by hand has a hard ceiling; photolithography does not have one in the same way, which is the whole of the last sixty years.",
    sources: [{ label: "Kilby's 1958 demonstration at Texas Instruments; Noyce's 1959 planar integrated circuit at Fairchild", url: "https://en.wikipedia.org/wiki/Integrated_circuit" }],
  },

  // -- DIGITAL --------------------------------------------------------------
  {
    slug: "shannon-switching",
    year: 1937,
    title: "Boolean algebra describes switching circuits",
    strand: "digital",
    who: "Claude Shannon",
    what: "A master's thesis showing that relay and switching circuits can be analysed and designed using Boolean algebra.",
    why: "This is the hinge between electrical engineering and logic. Before it, a switching circuit was something you built and tested; after it, it is something you can reason about symbolically and prove correct. Every piece of digital design rests on this equivalence.",
    sources: [{ label: "Shannon, A Symbolic Analysis of Relay and Switching Circuits, MIT, 1937", url: "https://en.wikipedia.org/wiki/A_Symbolic_Analysis_of_Relay_and_Switching_Circuits" }],
  },
  {
    slug: "turing-computable",
    year: 1936,
    title: "On computable numbers",
    strand: "digital",
    who: "Alan Turing",
    what: "A definition of what it means for something to be computable, by way of an abstract machine, together with a proof that some questions cannot be decided by any such machine.",
    why: "It establishes both that a general-purpose computing machine is possible and that there are limits to what it can be asked. The second half matters more often than people expect: a great many practical problems in this field are unsolvable in general and are handled with heuristics that mostly work.",
    sources: [{ label: "Turing, On Computable Numbers, Proceedings of the London Mathematical Society, 1936", url: "https://en.wikipedia.org/wiki/Turing%27s_proof" }],
  },
  {
    slug: "shannon-information",
    year: 1948,
    title: "A mathematical theory of communication",
    strand: "digital",
    who: "Claude Shannon",
    what: "Information given a precise measure in bits, and a proof that every channel has a capacity above which reliable communication is impossible and below which it is achievable however noisy the channel is.",
    why: "This is the most load-bearing single result on this page for anyone who works with networks. It says a noisy link is not simply a worse link - it is a link with a number attached, and that number is not negotiable by engineering effort. Every modulation scheme, every error-correcting code and every argument about how much can be pushed down a given piece of copper is an attempt to approach a bound Shannon proved exists.",
    sources: [{ label: "Shannon, A Mathematical Theory of Communication, Bell System Technical Journal, 1948", url: "https://en.wikipedia.org/wiki/A_Mathematical_Theory_of_Communication" }],
  },

  // -- STORAGE --------------------------------------------------------------
  {
    slug: "magnetic-tape",
    year: 1928,
    title: "Magnetic tape",
    strand: "storage",
    who: "Fritz Pfleumer",
    what: "Iron oxide bonded to a paper, later plastic, strip - a flexible medium that could be magnetised in a pattern and read back.",
    why: "The first storage medium that was cheap per unit of capacity and physically compact. It is also the ancestor of a distinction that still governs backup design: tape is sequential, and sequential media are excellent at throughput and terrible at random access.",
    sources: [{ label: "Pfleumer's 1928 patent for magnetic recording on paper tape", url: "https://en.wikipedia.org/wiki/Fritz_Pfleumer" }],
  },
  {
    slug: "ramac-350",
    year: 1956,
    title: "The first hard disk drive",
    strand: "storage",
    who: "IBM, RAMAC 305 with the 350 disk unit",
    what: "Fifty rotating 24-inch platters storing about five million characters, with a moving head that could reach any record without winding through everything before it.",
    why: "Random access is the point, not capacity. A tape must be traversed; a disk can be addressed. Every database, filesystem and index assumes you can go straight to a location, and that assumption starts here. The capacity was trivial and the idea was not.",
    sources: [{ label: "IBM 350 disk storage unit, shipped with the RAMAC 305, 1956", url: "https://en.wikipedia.org/wiki/IBM_305_RAMAC" }],
  },
  {
    slug: "punched-card-80-column",
    year: 1928,
    title: "The 80-column punched card",
    strand: "storage",
    who: "IBM",
    what: "A rectangular-hole card holding eighty characters, which became the dominant format for machine-readable data for the next four decades.",
    why: "Eighty columns is why terminals are eighty columns wide, and why so much software still assumes an eighty-character line. A physical constraint from a cardboard rectangle propagated into screens, then into style guides, then into linters, long after the last card was punched. Formats outlive their reasons.",
    sources: [{ label: "IBM's 80-column card, introduced 1928", url: "https://en.wikipedia.org/wiki/Punched_card" }],
  },
  {
    slug: "floppy-disk",
    year: 1971,
    title: "The floppy disk",
    strand: "storage",
    who: "IBM",
    what: "A flexible magnetic disk in a protective sleeve, originally shipped to load microcode into mainframes, then adopted as removable storage.",
    why: "It made data portable in a way tape never quite managed for ordinary use, and in doing so created the software industry's distribution model and its first serious piracy problem in the same object. The save icon on software written this decade is still a picture of one.",
    sources: [{ label: "IBM's 8-inch flexible disk, 1971", url: "https://en.wikipedia.org/wiki/Floppy_disk" }],
  },
  {
    slug: "gigabyte-drive",
    year: 1980,
    title: "A gigabyte in one cabinet",
    strand: "storage",
    who: "IBM 3380",
    what: "The first disk product to reach a gigabyte of capacity, in a unit the size of a large refrigerator and priced accordingly.",
    why: "Useful as a yardstick rather than a breakthrough. A capacity that needed a refrigerator-sized cabinet and a six-figure price in 1980 now costs less than lunch and fits on a fingernail - and every architectural assumption made when storage was scarce was made under the earlier conditions.",
    sources: [{ label: "IBM 3380, announced 1980", url: "https://en.wikipedia.org/wiki/IBM_3380" }],
  },
  {
    slug: "compact-disc",
    year: 1982,
    title: "The compact disc",
    strand: "storage",
    who: "Philips and Sony",
    what: "Digital audio on an optical disc, standardised jointly and released in 1982, with the data-carrying CD-ROM specification following.",
    why: "The first mass-market medium that was digital end to end, and the first time consumers encountered error correction as a product feature - a scratched disc still played, which was startling to anyone used to vinyl. It also proved that two competing manufacturers agreeing on one standard beats either of them winning.",
    sources: [{ label: "The Red Book standard, Philips and Sony, with commercial release in 1982", url: "https://en.wikipedia.org/wiki/Compact_Disc_Digital_Audio" }],
  },
  {
    slug: "flash-memory",
    year: 1980,
    title: "Flash memory",
    strand: "storage",
    who: "Fujio Masuoka, Toshiba",
    what: "Non-volatile solid-state memory that can be erased and rewritten in blocks, without moving parts.",
    dateNote:
      "Invention is usually dated to around 1980 with the first public presentation in 1984 and commercialisation later in the decade. The gap between invention and market is the interesting part rather than a discrepancy.",
    why: "It removes the last mechanical component from the storage path. That changes latency by orders of magnitude and changes what a filesystem should optimise for - and it introduces wear as a design constraint, which rotating media never had in the same way.",
    sources: [{ label: "Masuoka's flash memory work at Toshiba, presented 1984", url: "https://en.wikipedia.org/wiki/Flash_memory" }],
  },

  {
    slug: "pearl-street",
    year: 1882,
    title: "Commercial electricity distribution",
    strand: "electricity",
    who: "Thomas Edison's Pearl Street Station, New York",
    what: "A central generating station selling electricity to paying customers over a distribution network, rather than each building generating its own.",
    why: "The first utility, and therefore the first argument about centralised versus local provision - the same argument that later produced timesharing, then the data centre, then cloud. The economics that favour a shared plant over a private one have not changed since 1882; only the plant has.",
    sources: [{ label: "Pearl Street Station, in service September 1882", url: "https://en.wikipedia.org/wiki/Pearl_Street_Station" }],
  },
  {
    slug: "electron-discovered",
    year: 1897,
    title: "The electron",
    strand: "electricity",
    who: "J. J. Thomson",
    what: "Cathode rays shown to consist of particles far lighter than any atom, carrying negative charge.",
    why: "Everything before this treated electricity as a fluid or a field without knowing what was actually moving. Knowing the carrier is what makes the valve, the transistor and semiconductor physics possible - you cannot deliberately control something you have not identified.",
    sources: [{ label: "Thomson's 1897 cathode ray experiments at the Cavendish Laboratory", url: "https://en.wikipedia.org/wiki/J._J._Thomson" }],
  },
  {
    slug: "moores-law",
    year: 1965,
    title: "Moore's law",
    strand: "electronics",
    who: "Gordon Moore",
    what: "An observation, in a trade magazine article, that the number of components on an integrated circuit had been doubling roughly annually and would likely continue.",
    why: "It is an observation that became a plan. The industry organised its roadmaps around it, which made it partly self-fulfilling for half a century. Worth understanding as economics rather than physics: the doubling continued because enormous capital was deployed on the assumption that it would.",
    sources: [{ label: "Moore, Cramming more components onto integrated circuits, Electronics, April 1965", url: "https://en.wikipedia.org/wiki/Moore%27s_law" }],
  },
  {
    slug: "microprocessor",
    year: 1971,
    title: "The microprocessor",
    strand: "electronics",
    who: "Intel 4004, designed by Federico Faggin, Ted Hoff, Stanley Mazor and Masatoshi Shima",
    what: "A complete central processing unit on one chip, originally built for a calculator.",
    why: "The point is not the chip but the change in who could build a computer. Once a processor is a component you buy rather than a system you design, computers stop being capital projects. Everything on the company timeline after 1975 depends on this being true.",
    sources: [{ label: "Intel 4004, announced November 1971", url: "https://en.wikipedia.org/wiki/Intel_4004" }],
  },
  {
    slug: "jacquard-loom",
    year: 1804,
    title: "Punched cards control a machine",
    strand: "digital",
    who: "Joseph Marie Jacquard",
    what: "A loom whose woven pattern is determined by a chain of punched cards, each row of holes selecting which warp threads lift.",
    why: "The first separation of a program from the machine that runs it. The loom does not know what it is weaving; the cards do. That distinction - hardware that is general, instructions that are specific - is the one every computer since has been built on, and it arrived a century and a half early in a textile mill.",
    sources: [{ label: "Jacquard's loom, demonstrated from 1801 and widely adopted after 1804", url: "https://en.wikipedia.org/wiki/Jacquard_machine" }],
  },
  {
    slug: "boole-laws-of-thought",
    year: 1854,
    title: "An investigation of the laws of thought",
    strand: "digital",
    who: "George Boole",
    what: "An algebra in which variables take only two values and logical reasoning becomes calculation.",
    why: "Boole was doing philosophy, not engineering, and there were no electrical circuits to apply it to. Eighty-three years later Shannon noticed the correspondence between his algebra and switching circuits. A result can sit unused for three generations and then turn out to be the foundation of an industry, which is worth remembering about anything currently filed as impractical.",
    sources: [{ label: "Boole, An Investigation of the Laws of Thought, 1854", url: "https://en.wikipedia.org/wiki/The_Laws_of_Thought" }],
  },
  {
    slug: "von-neumann-architecture",
    year: 1945,
    title: "The stored-program computer",
    strand: "digital",
    who: "John von Neumann, drawing on the EDVAC group's work",
    what: "A draft report describing a machine that holds its instructions in the same memory as its data, so a program can be loaded, changed and even modified while running.",
    dateNote:
      "Circulated as the First Draft of a Report on the EDVAC under von Neumann's name alone, which has been contested ever since: the design work involved Eckert, Mauchly and others, and the sole attribution was a consequence of how the draft was distributed rather than a claim about who did what.",
    why: "Before this, changing what a computer did meant rewiring it. Afterwards it meant loading different data. Every idea downstream - operating systems, compilers, malware, virtualisation - depends on instructions and data being the same kind of thing in the same place.",
    sources: [{ label: "First Draft of a Report on the EDVAC, 1945", url: "https://en.wikipedia.org/wiki/First_Draft_of_a_Report_on_the_EDVAC" }],
  },
  {
    slug: "ascii",
    year: 1963,
    title: "ASCII",
    strand: "digital",
    what: "A standard assignment of numbers to characters, so that machines from different manufacturers could exchange text and agree on what it said.",
    why: "Agreement is the product, not the encoding. Any consistent mapping would have worked; what mattered was that everyone used the same one. The same lesson is relearned constantly, and the cost of relearning it is visible in every mojibake bug and every system that still assumes one byte per character.",
    sources: [{ label: "ASA X3.4-1963, the first ASCII standard", url: "https://en.wikipedia.org/wiki/ASCII" }],
  },
  {
    slug: "unicode",
    year: 1991,
    title: "Unicode",
    strand: "digital",
    what: "A single character set intended to cover every writing system, replacing the patchwork of incompatible national encodings.",
    why: "ASCII solved agreement for one language and created a problem for everyone else. Unicode is the admission that text is harder than it looks: normalisation, collation, bidirectional text and the fact that a user-visible character is not a code point. This site's own translation rules exist because of what is in this entry - proper diacritics are cheap now and were not always.",
    sources: [{ label: "The Unicode Standard, version 1.0, 1991", url: "https://en.wikipedia.org/wiki/Unicode" }],
  },
  // -- TRANSFER -------------------------------------------------------------
  {
    slug: "electric-telegraph",
    year: 1837,
    title: "The electric telegraph",
    strand: "transfer",
    who: "Cooke and Wheatstone in Britain; Morse and Vail in the United States",
    what: "Messages encoded as electrical signals and sent along a wire, arriving faster than any physical carrier could travel.",
    why: "The first separation of a message from its messenger, and therefore the beginning of everything this site is about. It also produced the first version of a problem still with us: a shared medium, contention for it, and the need for a code that a receiver can unambiguously decode.",
    sources: [{ label: "Cooke and Wheatstone's 1837 patent; Morse's demonstrations in the same period", url: "https://en.wikipedia.org/wiki/Electrical_telegraph" }],
  },
  {
    slug: "transatlantic-telegraph",
    year: 1866,
    title: "A working transatlantic cable",
    strand: "transfer",
    what: "After failures in 1857 and 1858, a submarine telegraph cable between Ireland and Newfoundland that stayed in service.",
    why: "Intercontinental latency drops from weeks to minutes. It is also the first time the industry learns that a long cable is not a short cable scaled up - dispersion, attenuation and the physics of a very long conductor forced the theory that made later cables possible.",
    sources: [{ label: "The 1866 Atlantic Telegraph cable, following the failures of 1857 and 1858", url: "https://en.wikipedia.org/wiki/Transatlantic_telegraph_cable" }],
  },
  {
    slug: "marconi-transatlantic",
    year: 1901,
    title: "Radio across the Atlantic",
    strand: "transfer",
    who: "Guglielmo Marconi",
    what: "A signal reported received in Newfoundland from Cornwall, over a distance many believed impossible given the curvature of the earth.",
    dateNote:
      "The 1901 reception has been questioned - the evidence was a faint sequence of clicks heard by ear, and later analysis has debated whether it could have been the intended signal. Subsequent transmissions were unambiguous. Recorded as reported, with the doubt noted.",
    why: "It established that radio was not limited to line of sight, which nobody could then explain - the ionosphere had not been described. A working technology outrunning its own theory is a recurring pattern in this industry.",
    sources: [{ label: "Marconi's reported transatlantic reception at Signal Hill, December 1901", url: "https://en.wikipedia.org/wiki/Guglielmo_Marconi" }],
  },
  {
    slug: "arpanet",
    year: 1969,
    title: "The first ARPANET links",
    strand: "transfer",
    what: "Packet-switched links between four university sites in the United States, using Interface Message Processors as the first routers.",
    why: "Packet switching rather than circuit switching: the network stops reserving a path for a conversation and starts forwarding self-describing chunks independently. Everything about congestion, routing and best-effort delivery follows from that single choice.",
    sources: [{ label: "The first four ARPANET nodes, 1969", url: "https://en.wikipedia.org/wiki/ARPANET" }],
  },
  {
    slug: "ethernet-memo",
    year: 1973,
    title: "Ethernet",
    strand: "transfer",
    who: "Robert Metcalfe and David Boggs, Xerox PARC",
    what: "A memo describing a broadcast network over shared coaxial cable, with stations listening before transmitting and backing off after collisions.",
    why: "The design that won, and it won by being tolerant rather than correct. It did not guarantee delivery or fair access; it assumed collisions would happen and made recovery cheap. Modern switched Ethernet has no collisions and keeps the frame format, the addressing and the name - which is a lesson about what actually persists in a standard.",
    sources: [{ label: "Metcalfe's 1973 memo at Xerox PARC describing the Ethernet concept", url: "https://en.wikipedia.org/wiki/Ethernet" }],
  },
  {
    slug: "tcp-paper",
    year: 1974,
    title: "A protocol for packet network intercommunication",
    strand: "transfer",
    who: "Vint Cerf and Robert Kahn",
    what: "A design for connecting different packet networks to each other, with gateways between them and a common protocol above.",
    why: "Internetworking, as distinct from networking. The insight is that the networks themselves need not agree on anything much, provided something above them does. That is why the internet absorbed every physical medium invented since without redesigning itself.",
    sources: [{ label: "Cerf and Kahn, A Protocol for Packet Network Intercommunication, IEEE Transactions on Communications, 1974", url: "https://en.wikipedia.org/wiki/Transmission_Control_Protocol" }],
  },
  {
    slug: "telephone",
    year: 1876,
    title: "The telephone",
    strand: "transfer",
    who: "Alexander Graham Bell, with contested priority",
    what: "Speech transmitted electrically, rather than a code standing in for words.",
    dateNote:
      "Priority is genuinely disputed - Elisha Gray filed a caveat the same day, and Antonio Meucci's earlier work is recognised by some accounts. The dispute is recorded rather than adjudicated here.",
    why: "It introduced the requirement that would dominate networks for a century: a continuous, low-latency, always-available path between two points. Circuit switching exists to provide that, and packet switching exists because it turned out to be a wasteful way to carry anything but speech.",
    sources: [{ label: "Bell's 1876 patent; Gray's same-day caveat; Meucci's earlier demonstrations", url: "https://en.wikipedia.org/wiki/Invention_of_the_telephone" }],
  },
  {
    slug: "first-modem",
    year: 1958,
    title: "The modem",
    strand: "transfer",
    what: "The Bell 101, converting digital data into audible tones so it could travel over telephone lines built for speech.",
    why: "The first time digital data was carried on infrastructure designed for something else, which is the pattern for everything since - DSL, cable, mobile data. It also sets the constraint the whole field then worked against: the telephone channel is about three kilohertz wide, and Shannon's theorem says exactly what that permits.",
    sources: [{ label: "The Bell 101 dataset, 1958", url: "https://en.wikipedia.org/wiki/Bell_101_modem" }],
  },
  {
    slug: "telstar",
    year: 1962,
    title: "Communications by satellite",
    strand: "transfer",
    what: "Telstar 1 relayed the first live transatlantic television pictures and telephone calls.",
    why: "It established a second path between continents that owed nothing to cable, and introduced a latency floor set by the speed of light and the height of the orbit. Every argument about geostationary versus low-earth-orbit constellations is a re-run of the trade this made visible.",
    sources: [{ label: "Telstar 1, launched July 1962", url: "https://en.wikipedia.org/wiki/Telstar" }],
  },
  {
    slug: "low-loss-fibre",
    year: 1970,
    title: "Low-loss optical fibre",
    strand: "transfer",
    who: "Robert Maurer, Donald Keck and Peter Schultz, Corning",
    what: "Glass fibre pure enough to carry light for kilometres rather than metres, crossing the threshold below which optical transmission becomes practical.",
    why: "Fibre had been understood for years and was useless because the glass was too dirty. This is a materials achievement rather than a communications one, and it is the reason bandwidth stopped being scarce. Almost every capacity figure elsewhere on this site rests on it.",
    sources: [{ label: "Corning's 1970 demonstration of fibre with attenuation below 20 decibels per kilometre", url: "https://en.wikipedia.org/wiki/Optical_fiber" }],
  },
  {
    slug: "tcpip-flag-day",
    year: 1983,
    title: "The ARPANET switches to TCP/IP",
    strand: "transfer",
    what: "On 1 January 1983 the network cut over from its older host protocol to TCP/IP, with no gradual transition.",
    why: "A hard cutover on a working network, which nobody would attempt today, and it is the moment the internet's protocol stack becomes the internet's protocol stack. It is also the best available demonstration that migrations succeed when the deadline is real and everyone has the same one.",
    sources: [{ label: "The ARPANET TCP/IP transition, 1 January 1983", url: "https://en.wikipedia.org/wiki/Flag_day_%28computing%29" }],
  },
  {
    slug: "world-wide-web",
    year: 1991,
    title: "The World Wide Web made public",
    strand: "transfer",
    who: "Tim Berners-Lee, CERN",
    what: "Hypertext over the internet, with a naming scheme, a transfer protocol and a markup language - released for anyone to implement.",
    why: "The internet existed for two decades before most people had a reason to touch it. The web is that reason, and the decision to put it in the public domain rather than license it is why there is one web rather than several incompatible ones. Every tool on this site is delivered through it.",
    sources: [{ label: "The World Wide Web project made publicly available in 1991; CERN's public-domain release in 1993", url: "https://en.wikipedia.org/wiki/World_Wide_Web" }],
  },
  {
    slug: "tat-8",
    year: 1988,
    title: "The first transatlantic fibre cable",
    strand: "transfer",
    what: "TAT-8, carrying roughly 40,000 simultaneous telephone circuits across the Atlantic on optical fibre.",
    why: "Capacity per cable jumps by orders of magnitude, and the economics of long-distance traffic change permanently. Almost every argument about where data physically travels, and whose jurisdiction it passes through, dates from the fibre era beginning here.",
    sources: [{ label: "TAT-8, the first transatlantic fibre-optic cable, in service 1988", url: "https://en.wikipedia.org/wiki/TAT-8" }],
  },
  // -- MAKING ---------------------------------------------------------------
  // PRIME 2026-08-11: silicon belongs on the milestones, with the factories.
  // These seven are the arrangement a networking vendor actually depends on and
  // never documents: the process that made chips manufacturable, the machine
  // that prints them, the split between designing and fabricating, the company
  // that fabricates for everyone, the architecture nobody owns outright, the
  // factory that builds everybody's hardware, and the instruction-set argument
  // that decided what the chips look like inside.
  {
    slug: "planar-process",
    year: 1959,
    title: "The planar process",
    strand: "making",
    who: "Jean Hoerni at Fairchild Semiconductor",
    what: "A way of building transistors flat on the surface of a silicon wafer, protected by an oxide layer, so that many can be made and interconnected in one sequence of steps.",
    why: "The integrated circuit is an idea; the planar process is why it could be manufactured. Everything about modern electronics that depends on making millions of identical things reliably descends from this, and it is the reason Noyce's version of the integrated circuit scaled and Kilby's did not.",
    sources: [{ label: "The planar process, developed at Fairchild Semiconductor", url: "https://en.wikipedia.org/wiki/Planar_process" }],
  },
  {
    slug: "photolithography",
    year: 1955,
    title: "Printing circuits with light",
    strand: "making",
    what: "Patterning a wafer by projecting an image onto light-sensitive resist and etching what the light defines, rather than placing or wiring anything by hand.",
    why: "This is the machine that makes Moore's law an economic statement rather than a wish. Shrinking a feature costs a better lens and a shorter wavelength, not more labour - so the cost per transistor falls as the transistor gets smaller. No comparable manufacturing technique exists in any other industry.",
    dateNote: "Photolithography as a printing technique is far older; the date here marks its adoption in semiconductor manufacturing, which is a process rather than an event.",
    sources: [{ label: "Photolithography in semiconductor manufacturing", url: "https://en.wikipedia.org/wiki/Photolithography" }],
  },
  {
    slug: "risc",
    year: 1980,
    title: "Reduced instruction sets",
    strand: "making",
    who: "Work at Berkeley and Stanford, building on IBM research",
    what: "The argument that a processor with fewer, simpler, uniform instructions can be made faster and smaller than one with a large complex instruction set.",
    why: "It settled what the inside of a chip looks like. Almost every processor in networking equipment, in phones and in the machines reading this page is the descendant of that argument, and the ones that are not implement a complex instruction set on top of a simple core - which is the same conclusion arrived at from the other side.",
    sources: [{ label: "Reduced instruction set computer", url: "https://en.wikipedia.org/wiki/Reduced_instruction_set_computer" }],
  },
  {
    slug: "contract-manufacturing",
    year: 1974,
    title: "Somebody else's factory",
    strand: "making",
    what: "Electronics manufacturing services: a company that owns factories and builds other companies' products, at a scale none of them could justify alone.",
    why: "The reason a networking vendor can design a switch without owning a production line, and the reason a small vendor can exist at all. It also means the badge on the front of an enterprise appliance and the building it was assembled in have no necessary relationship - a fact worth knowing before drawing conclusions about where equipment comes from.",
    dateNote: "Dated to the founding of Foxconn, now the largest firm in the category. Contract assembly existed earlier; the industrial scale did not.",
    sources: [
      { label: "Contract manufacturing in electronics", url: "https://en.wikipedia.org/wiki/Contract_manufacturer" },
      { label: "Foxconn, founded 1974", url: "https://en.wikipedia.org/wiki/Foxconn" },
    ],
  },
  {
    slug: "the-foundry",
    year: 1987,
    title: "A factory that designs nothing",
    strand: "making",
    who: "Morris Chang, founding TSMC",
    what: "A semiconductor company that manufactures other companies' designs and competes with none of them.",
    why: "This is the structural change that made the modern industry possible. Before it, designing a chip meant owning a fabrication plant, so only large companies designed chips. After it, anybody with a design and a purchase order could have silicon - which is why the networking equipment on this timeline contains custom chips from companies that have never built a factory.",
    sources: [{ label: "TSMC, the pure-play foundry model", url: "https://en.wikipedia.org/wiki/TSMC" }],
  },
  {
    slug: "fabless",
    year: 1987,
    title: "Designing without building",
    strand: "making",
    what: "The complementary half of the foundry: companies that design and sell semiconductors while owning no manufacturing at all.",
    why: "It separated two things that had been one business and had very different economics. A fabrication plant is a capital problem measured in billions and depreciating from the day it opens; a design team is a payroll. Splitting them let small teams produce competitive silicon, and it is why specialised networking chips exist rather than only general-purpose processors.",
    sources: [{ label: "Fabless manufacturing", url: "https://en.wikipedia.org/wiki/Fabless_manufacturing" }],
  },
  {
    slug: "licensed-architecture",
    year: 1990,
    title: "An architecture nobody sells",
    strand: "making",
    who: "Arm, founded as a joint venture",
    what: "A processor design licensed to other companies to manufacture, rather than sold as a chip by the company that designed it.",
    why: "It completed the separation. Manufacturing was already separable from design; now the instruction set architecture was separable from both. A vendor can license a core, add its own logic, have a foundry fabricate it and a contract manufacturer assemble the product - and own none of those four things. Most networking equipment is built exactly that way.",
    sources: [{ label: "Arm Holdings and the licensing model", url: "https://en.wikipedia.org/wiki/Arm_Holdings" }],
  },
  {
    slug: "silicon-isle",
    year: 1989,
    title: "A country decides to be a factory",
    strand: "making",
    who: "IDA Ireland, and the manufacturers it recruited",
    what: "Ireland\u2019s industrial policy of attracting foreign electronics manufacturing through low manufacturing taxation, grants and an English-speaking engineering workforce, anchored by Intel\u2019s decision to build at Leixlip.",
    why: "It is the clearest case of a small country deciding what part of the industry it would occupy and then occupying it. Analog Devices came to Limerick in 1976, Apple to Cork in 1980, and Intel chose Leixlip in 1989 for its first wafer fabrication plant outside the United States. For two decades a large share of the computing equipment sold in Europe was assembled, configured or duplicated on that island.",
    dateNote: "Dated to Intel\u2019s Leixlip decision, which is the anchor most accounts use. The policy is older: a 10% manufacturing tax rate from 1980, preceded by an IDA tax holiday running from 1965, and by the shift away from protectionism set out in 1958.",
    sources: [
      { label: "Silicon Republic - Ireland\u2019s semiconductor history: Analog Devices in Limerick from 1976, Intel choosing Leixlip in 1989 for its first wafer fab outside the US", url: "https://www.siliconrepublic.com/machines/chips-ireland-semiconductor-industry-europe-ida" },
      { label: "IDA Ireland - the agency\u2019s own account of recruiting technology manufacturers", url: "https://www.idaireland.com/latest-news/insights/ireland-is-home-to-14-of-the-world%E2%80%99s-top-semiconductor-companies" },
    ],
  },
  {
    slug: "localisation",
    year: 1983,
    title: "Localisation gets its name",
    strand: "making",
    who: "Production staff at Apple\u2019s Cork facility",
    what: "Assembling supplementary packs for the Apple IIe containing ROM components that configured a machine for a particular country - its character set, its keyboard layout, its video display format.",
    why: "The word this industry uses for adapting a product to a language and a place began as a name for a procedure on a factory floor in Cork. It described fitting different chips into a box, not translating a menu. When packaged software took the term over, it kept the shape of the original: a set of country-specific parts, assembled late, so that one product can ship everywhere.",
    dateNote: "The Cork plant opened in 1980; the configuration work and the in-house term date from January 1983. In February 1985 Softrans International in Dublin became the first company to define its business as localisation, its founder having encountered the word at Apple.",
    sources: [{ label: "Software localisation in Ireland 1982-2002, a timeline: Apple\u2019s Cork facility, the Apple IIe configuration packs, and the in-house term that became an industry", url: "https://techarchives.irish/software-localisation-in-ireland-1982-2002/" }],
  },
  {
    slug: "xliff",
    year: 2000,
    title: "A file format for translation",
    strand: "digital",
    who: "Ian Dunlop at Novell, Paul Quigley at Oracle and Liz Tierney at Sun, in Dublin",
    what: "XLIFF, the XML Localization Interchange File Format: one representation for the text, glossaries, translation memory and code that pass between a software company and the people translating its product.",
    why: "Before it, every vendor and every translation supplier exchanged work in its own format, so effort spent on one product could not be reused on another. A shared format makes translation memory portable, which is what turns translating a product into an accumulating asset rather than a repeated cost. The first specification was published freely and taken to OASIS as an open standard.",
    sources: [{ label: "Software localisation in Ireland 1982-2002, a timeline: three Dublin-based localisation engineers initiate XLIFF in September 2000; the consortium completed a first specification in April 2001 and asked OASIS to approve it as an open standard", url: "https://techarchives.irish/software-localisation-in-ireland-1982-2002/" }],
  },
  {
    slug: "market-reserve",
    year: 1984,
    title: "A country decides to be a factory for itself",
    strand: "making",
    who: "The Brazilian government, under the Politica Nacional de Informatica",
    what: "A reserve of the domestic market for computing equipment made by Brazilian-owned firms, closing it to foreign manufacturers for a defined class of products.",
    why: "It is the opposite answer to the same question Ireland answered, in the same decade. Ireland offered itself as the place where anybody\u2019s products would be manufactured; Brazil closed its market so that its own products would be. One country ended up assembling much of the equipment sold in Europe, the other ended up with Cobra, Scopus, Itautec and Sisco - and, when the reserve ended, with a generation of engineers who had built machines rather than only installed them.",
    dateNote: "Dated to the informatics law of 1984, which gave the policy its legal form. The reserve was dismantled in the early 1990s.",
    sources: [
      { label: "Politica Nacional de Informatica (Portuguese Wikipedia)", url: "https://pt.wikipedia.org/wiki/Pol%C3%ADtica_Nacional_de_Inform%C3%A1tica" },
      { label: "DIO - the informatics market reserve in Brazil, 1984-1992", url: "https://www.dio.me/articles/direto-ao-ponto-16-a-reserva-de-mercado-da-informatica-no-brasil-1984-1992" },
    ],
  },
];

/** Milestones on one strand, oldest first. */
export function milestonesByStrand(strand: MilestoneStrand): Milestone[] {
  return MILESTONES.filter((m) => m.strand === strand).sort((a, b) => a.year - b.year);
}

/** All milestones, oldest first. */
export function milestonesChronological(): Milestone[] {
  return [...MILESTONES].sort((a, b) => a.year - b.year);
}
