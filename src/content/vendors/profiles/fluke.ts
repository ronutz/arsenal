// ============================================================================
// FLUKE - the meters and certifiers in every field bag. Knowledge-based,
// dates well-documented (2026-07-16): John Fluke Sr. founds John Fluke
// Manufacturing 1948 (Everett/Seattle area, WA); precision meters culminate
// in the 87 (1988) - THE multimeter. Danaher acquires Fluke 1998 (~$625M);
// Fluke Networks unit carries cable certification (DSP -> DTX -> DSX
// CableAnalyzer, OptiFiber) and portable network test; AirMagnet (Wi-Fi
// analysis) acquired 2009. THE 2015 SPLIT (keep straight): Danaher's
// communications businesses go to NetScout (~$2.3B) INCLUDING Fluke
// Networks' enterprise visibility lines (OptiView, Visual TruView,
// AirMagnet); the handheld network-test portion is later divested (2018,
// StoneCalibre) and becomes NETALLY (2019: LinkRunner, AirCheck). The
// cable-certification business STAYS Fluke Networks, moving with Fluke to
// FORTIVE in the July 2016 Danaher split - where the DSX still certifies
// the world's structured cabling today.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const flukeProfile: VendorProfile = {
  slug: "fluke",
  foundings: [
    {
      company: "John Fluke Manufacturing Company",
      year: 1948,
      place: "Washington State, United States",
      founders: ["John Fluke Sr."],
      story:
        "John Fluke Sr. - a Navy engineer and MIT graduate who had roomed with David Packard - built precision electrical measurement into a company whose name became the generic term for the instrument itself: to this day, field engineers 'grab the Fluke' regardless of what the label says. The rugged 87 multimeter (1988) is the archetype - drop-proof, trusted, yellow - and the Fluke Networks lineage carried the same DNA into cabling: if a link is certified, somewhere a Fluke tester signed for it.",
    },
  ],
  timeline: [
    { year: 1988, title: "The Fluke 87", detail: "The rugged true-RMS multimeter becomes THE meter - the industrial world's default instrument, still in production decades later, the physical embodiment of 'measurement you can bet on'." },
    { year: 1993, title: "Into the cable plant", detail: "Fluke's DSP-series cable analyzers bring laboratory-grade measurement to structured cabling certification - pass/fail against the TIA/ISO standards, printed proof included; the category Fluke Networks comes to own." },
    { year: 1998, title: "Danaher", detail: "Danaher acquires Fluke (~$625 million) - the instruments house joining the conglomerate whose portfolio moves will later split the Fluke Networks story down the middle.", sourceNote: "Deal figure per the public record." },
    { year: 2009, title: "AirMagnet", detail: "Fluke Networks acquires AirMagnet, the Wi-Fi analysis leader - spectrum and WLAN troubleshooting joining copper and fiber certification in the field bag." },
    { year: 2015, title: "The split - read carefully", detail: "Danaher sells its communications businesses to NetScout (~$2.3 billion): Fluke Networks' ENTERPRISE visibility lines - OptiView, Visual TruView, AirMagnet - go with it. The cable-certification business does NOT: DSX CableAnalyzer, OptiFiber, and the certification franchise remain Fluke Networks. The handheld network-test line (LinkRunner, AirCheck) later leaves NetScout too - divested in 2018 and reborn as NetAlly in 2019.", sourceNote: "Transaction structure per the public record; the NetAlly spin-out completed 2019." },
    { year: 2016, title: "Fortive", detail: "Danaher splits; Fluke and Fluke Networks move to the new Fortive - where the yellow meters and the DSX certifiers continue, the standard instruments of the trades this site serves." },
  ],
  products: [
    { name: "Fluke 87 (and the meter line)", what: "The reference multimeter - the instrument 'Fluke' became the generic word for." },
    { name: "DSX CableAnalyzer / OptiFiber", what: "The structured-cabling and fiber certification standard - the tester whose report closes out installations worldwide." },
    { name: "LinkRunner / AirCheck heritage", what: "The handheld network and Wi-Fi test line born at Fluke Networks - continued today by NetAlly." },
  ],
  innovations: [
    { title: "Certification as a product", detail: "Fluke Networks turned 'does this link meet spec' into an instrument category with legal weight - the printed certification report is the cable plant's birth certificate." },
    { title: "Ruggedness as a specification", detail: "The 87's drop-proof, CAT-rated design made survivability part of accuracy - the field-instrument philosophy every hardened tool since inherits." },
  ],
  markets: [
    "Fluke (Fortive) remains the reference in electrical test; Fluke Networks owns cabling certification; the visibility and handheld branches live on at NetScout and NetAlly - one 1948 company, three present-day homes.",
  ],
  analyst: [
    "The pioneer entry closest to this site's readers' actual hands: the meter on the bench and the certifier in the bag - and the 2015 three-way split is worth knowing cold, because 'which Fluke' is a real procurement question.",
  ],
};
