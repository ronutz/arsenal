// ============================================================================
// CIENA - the company that taught fiber to carry colors. Knowledge-based,
// dates well-documented (2026-07-16): founded 1992 by David Huber (as
// HydraLite; renamed Ciena 1994; Patrick Nettles CEO). First commercial
// dense-WDM deployment with Sprint, June 1996 (MultiWave 1600: 16 channels
// x 2.5G on one fiber). IPO Feb 1997, the largest first-day valuation for a
// venture-backed startup to that point. Survives the crash; acquires
// Nortel's optical (Metro Ethernet Networks) business 2010 (~$770M),
// becoming the Nortel optical heir. WaveLogic coherent line from 2008
// onward (40G/100G leadership to today's 800G-class); Blue Planet software.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const cienaProfile: VendorProfile = {
  slug: "ciena",
  foundings: [
    {
      company: "Ciena (founded as HydraLite)",
      year: 1992,
      place: "Maryland, United States",
      founders: ["David Huber (Patrick Nettles, founding CEO)"],
      story:
        "David Huber's insight was that the fiber already in the ground could carry many wavelengths at once - colors, each a full channel - if someone productized dense wavelength-division multiplexing. In June 1996 Sprint lit Ciena's MultiWave 1600 and one strand of glass became sixteen: capacity multiplied without digging. The February 1997 IPO set records, the crash nearly killed the sector, and Ciena emerged as the optical layer's defining pure-play - eventually inheriting Nortel's optical crown.",
    },
  ],
  timeline: [
    { year: 1996, title: "First commercial DWDM", detail: "Sprint deploys the MultiWave 1600: sixteen 2.5 Gb/s channels on one fiber. The economics of long-haul change overnight - bandwidth stops meaning trenches and starts meaning transponders.", sourceNote: "Deployment date per the public record." },
    { year: 1997, title: "The record IPO", detail: "February 1997: Ciena goes public at the largest first-day valuation yet for a venture-backed startup - the market pricing in what multiplied fiber meant for the coming internet build-out." },
    { year: 2002, title: "Surviving the winter", detail: "The telecom crash guts optical spending; Ciena cuts deep, diversifies (ONI Systems and others), and outlasts a field of funded rivals - the discipline that positions it for the decade's biggest prize." },
    { year: 2010, title: "The Nortel optical inheritance", detail: "Ciena acquires Nortel's Metro Ethernet Networks business (~$770 million) out of the bankruptcy - the 40G coherent pioneers and the OME/6500 lines join, making Ciena the heir of the great Canadian optical tradition.", sourceNote: "Deal figure per the public record." },
    { year: 2012, title: "WaveLogic coherent era", detail: "Coherent detection - encoding in phase and polarization, undoing impairments in DSP - becomes Ciena's franchise; each WaveLogic generation roughly doubles what a wavelength carries, from 40G toward today's 800G-class." },
    { year: 2020, title: "The layer under everything", detail: "Submarine builds, metro DCI, Blue Planet automation - Ciena settles into its role: whoever's logo is on the router, the photons underneath very often ride Ciena line systems." },
  ],
  products: [
    { name: "MultiWave 1600", what: "The first commercial dense-WDM system - the 1996 artifact that multiplied installed fiber." },
    { name: "6500 family", what: "The converged packet-optical platform (with the Nortel heritage inside) that anchors carrier and DCI networks." },
    { name: "WaveLogic coherent optics", what: "The DSP-defined modem line that turned wavelength capacity into a software-improved product." },
  ],
  innovations: [
    { title: "DWDM as a product", detail: "Others demonstrated wavelength multiplexing; Ciena SHIPPED it into a live carrier network - the moment fiber capacity decoupled from construction." },
    { title: "Coherent optics leadership", detail: "Betting the company on coherent DSP made distance-times-capacity a semiconductor curve - the optical layer's own Moore's Law." },
  ],
  markets: [
    "Ciena remains the leading independent optical systems vendor - long-haul, submarine, metro, and data-center interconnect - the pure-play that outlived both the bubble and most of its rivals.",
  ],
  analyst: [
    "Every throughput number this site's calculators produce eventually rides a wavelength - and the reason wavelengths are cheap is a 1996 Sprint deployment and the company that kept compounding it.",
  ],
};
