// ============================================================================
// SIEMENS - the 1847 telegraph startup. Knowledge-based, dates
// well-documented (2026-07-16): founded October 1847 in Berlin by Werner von
// Siemens and Johann Georg Halske (Telegraphen-Bauanstalt von Siemens &
// Halske); pointer telegraph; 1866 dynamo-electric principle; Indo-European
// telegraph line completed 1870; 20th-century electrical conglomerate;
// communications lineage: public exchanges (EWSD), mobile phones (sold to
// BenQ 2005), carrier networks into Nokia Siemens Networks JV 2007 (exited
// 2013), enterprise comms as Siemens Enterprise Communications -> Unify ->
// Atos 2016 -> Mitel 2023. Today: industrial automation (and industrial
// networking: SCALANCE/PROFINET), with Energy and Healthineers spun off.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const siemensProfile: VendorProfile = {
  slug: "siemens",
  foundings: [
    {
      company: "Siemens (Telegraphen-Bauanstalt von Siemens & Halske)",
      year: 1847,
      place: "Berlin, Germany",
      founders: ["Werner von Siemens", "Johann Georg Halske"],
      story:
        "The oldest company in this section began as a telegraph startup: Werner von Siemens's pointer telegraph, built with the craftsman Johann Georg Halske in a Berlin backyard workshop in 1847. Within a generation it had strung the Indo-European telegraph line from London to Calcutta and discovered the dynamo-electric principle that made electrical engineering an industry. Siemens spent the twentieth century as Europe's electrical everything-company - and its communications bloodlines thread through half the other pages here before the company chose its modern identity: the automation of industry itself.",
    },
  ],
  timeline: [
    { year: 1847, title: "The pointer telegraph", detail: "Siemens and Halske found their Telegraphen-Bauanstalt in Berlin; the 1870 London-to-Calcutta Indo-European line - messages in minutes instead of weeks - makes the young company a global infrastructure builder." },
    { year: 1866, title: "The dynamo", detail: "Werner von Siemens articulates the dynamo-electric principle - practical electricity generation - and the telegraph company becomes the seed of an electrical empire: power, rail, lighting, medicine." },
    { year: 1980, title: "EWSD wires the world", detail: "The digital public exchange from Munich becomes one of the most widely deployed switching systems ever - Siemens as a first-rank telecom vendor through the fixed-line era." },
    { year: 2005, title: "The communications retreat begins", detail: "The mobile-phone business goes to BenQ; in 2007 the carrier-networks business merges into the Nokia Siemens Networks joint venture, which Siemens exits fully in 2013 - the telecom century wound down deliberately." },
    { year: 2016, title: "Unify departs", detail: "The enterprise-communications lineage - Siemens Enterprise Communications, renamed Unify - is sold to Atos, and passes to Mitel in 2023: the last communications bloodline leaves the house." },
    { year: 2020, title: "The focused giant", detail: "With Siemens Energy spun off (Healthineers already public), the company completes its transformation: industrial automation, smart infrastructure, and rail - including the SCALANCE and PROFINET industrial-networking world where factory floors meet this site's subject matter." },
  ],
  products: [
    { name: "Digital Industries", what: "Factory automation and industrial software: SIMATIC PLCs, TIA Portal, and the Xcelerator platform." },
    { name: "SCALANCE and industrial networking", what: "Switches, wireless, and security for the OT world - PROFINET's home turf, where networking meets the plant floor." },
    { name: "Smart Infrastructure and Mobility", what: "Grid technology, buildings, and rail - the electrical-empire heritage, modernized." },
  ],
  innovations: [
    { title: "Electrical engineering as an industry", detail: "The dynamo-electric principle and the infrastructure ventures built on it - Siemens did not join the electrical age; it is one of the reasons the age happened." },
    { title: "The disciplined exit", detail: "Few giants have left a flagship industry as deliberately as Siemens left telecom - a decade-long unwinding that funded the automation identity it wears today." },
  ],
  markets: [
    "Siemens today leads industrial automation and infrastructure worldwide - and its OT-networking lines make it a neighbor of this site's world wherever a factory network meets an enterprise one.",
  ],
  analyst: [
    "A century-long fixture of the electrical and automation evaluations; in telecom history, the quiet co-author of the fixed-line era whose exits shaped Nokia's rise.",
  ],
};
