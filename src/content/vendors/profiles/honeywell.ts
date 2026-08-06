// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - multicians.org/security.html: the 1974 Air Force tiger-team report by
//     Karger and Schell mentioned "in a few lines, that one could hide a back
//     door in the binary of the compiler"; no back door was ever discovered in
//     any 6180 Multics; Roger Schell went on to direct the NSA's National
//     Computer Security Center, which produced the Orange Book, and "there is
//     a strong Multics flavor through the whole Orange Book"
//   - multicians.org/b2.html: the Air Force insisted on COMMERCIAL OFF THE
//     SHELF rather than "government special" systems, so every Multics shipped
//     with the AIM access-isolation mechanism included; Project Guardian, a
//     Honeywell/MIT/USAF effort initiated by Roger Schell in 1975 to produce a
//     high-assurance minimised security kernel
//   - Karger and Schell, "Thirty Years Later" (ACSAC 2002): the conclusion that
//     "restructuring is essential" around a verifiable security kernel before
//     using any system in an open environment with professional attackers
//   - en-academic/Wikipedia: Multics certified B2 under TCSEC in 1985, the
//     first operating system evaluated to that level
//
// *** BODY READ AFTER DRAFTING. The body has the thermostat origins, the
// BUNCH, the GE acquisition bringing Multics, rings and segment access
// control, the Unix-named-in-contrast point, Magnetic Peripherals, the Bull
// exit, the AlliedSignal name reversal and the Nozomi investment. It does NOT
// have the SECURITY EVALUATION history, which is the part this site most
// needs. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const honeywellProfile: VendorProfile = {
  slug: "honeywell",
  foundings: [],
  timeline: [
    {
      year: 1974,
      title: "The tiger team report",
      detail:
        "An Air Force team led by Paul Karger and Roger Schell attacked Multics and wrote up what they found. The individual flaws mattered less than the demonstration: they showed the protection mechanism could be subverted by malicious software placed inside it, rather than defeated from outside. Among the observations, in a few lines, was that a back door could be hidden in the binary of a compiler.",
    },
    {
      year: 1975,
      title: "Project Guardian",
      detail:
        "A joint Honeywell, MIT and Air Force effort initiated by Schell to build a minimised, verifiable security kernel in response to his own report. The conclusion the work rested on was that restructuring around such a kernel was essential before any system could be exposed to determined professional attackers - which was written about timesharing and reads as a description of the internet.",
    },
    {
      year: 1985,
      title: "The first B2",
      detail:
        "Multics became the first operating system certified at B2 under the Trusted Computer System Evaluation Criteria - twenty years after the project started, and about a decade after the report that said it was not secure enough.",
    },
  ],
  products: [
    { name: "The Honeywell 6180", what: "The specific machine the security evaluations were run against, and the one whose hardware enforced the protection rings the software depended on. Security work of this kind is always about a particular processor, whatever the papers say afterwards." },
    { name: "Multics", what: "The timesharing system inherited with the GE division, and the one piece of this company's computing history that is still argued about." },
    { name: "The Access Isolation Mechanism", what: "Mandatory access controls shipped in every Multics rather than in a special military edition, because the Air Force wanted commercially available systems rather than government-only ones." },
  ],
  innovations: [
    {
      title: "Rings, which are still in the processor you are reading this on",
      detail:
        "Hardware-enforced protection rings came out of this work, and the vocabulary survives exactly: ring 0 for the kernel and ring 3 for user code are Multics terms describing a Multics idea, implemented in every x86 processor made since. Very little from 1970s operating system research is still present in silicon.",
    },
    {
      title: "Security you cannot buy the cheap version of",
      detail:
        "Because the Air Force insisted on commercial off-the-shelf systems rather than a government special, the mandatory access controls shipped to every customer with everything defaulted to the lowest classification. That is an unusual procurement decision with a lasting consequence: the secure configuration was the ordinary product, not an upgrade.",
    },
    {
      title: "The compiler back door, ten years early",
      detail:
        "The idea that a compiler could be modified to insert a back door into everything it built appears in the 1974 report, a decade before it became famous as a lecture. That the observation was made during a government security evaluation of a commercial operating system, and then largely forgotten until somebody restated it memorably, is its own comment on how security knowledge propagates.",
    },
    {
      title: "The critic who wrote the standard",
      detail:
        "Schell led the team that documented Multics' weaknesses, then directed the agency that produced the Orange Book - the criteria against which secure systems were evaluated for the next decade, and which reads throughout as though written by somebody who had spent years attacking a specific system. The evaluation became the standard because its author was given the chance to generalise it.",
    },
  ],
  markets: [
    "Its computing customers were governments, universities and large enterprises buying timesharing at a moment when a computer was a shared institutional resource rather than a personal one. Five large Multics systems went to the Air Force Data Services Center in the Pentagon alone.",
    "Its market today is industrial and building automation and aerospace - controlling physical processes rather than computing about them.",
  ],
  analyst: [
    "There is no computing position left to assess. What survives is a body of published work: the protection ring paper, the Karger and Schell evaluation, the design principles that came out of the same group, and the criteria that followed from them.",
    "The record here is that a mainframe division sold off and forgotten is nonetheless load-bearing. The vocabulary of operating system protection, the practice of formally evaluating security claims, and the observation that trusted tools can betray you all trace back through this machine - and every one of them arrived because somebody was funded to attack it and write down what worked.",
  ],
};
