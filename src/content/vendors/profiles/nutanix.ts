// ============================================================================
// src/content/vendors/profiles/nutanix.ts
// ----------------------------------------------------------------------------
// NUTANIX - the company that made hyperconverged infrastructure a category.
// Knowledge-based, well-documented (2026-07-15): founded 2009 San Jose by
// Dheeraj Pandey, Mohit Aron (ex-Google, GFS engineering; later founded
// Cohesity), and Ajeet Singh; the 2011 launch marketing coined "no SAN";
// IPO Nasdaq September 2016 as NTNX; Bain Capital $750M convertible
// investment August 2020, announced alongside Pandey's retirement; Rajiv
// Ramaswami (ex-VMware COO) CEO December 2020 - VMware sued over his hiring,
// suit later resolved; the subscription transition and AHV hypervisor arc
// are company-documented. The VMware/Broadcom turbulence of 2023+ made
// Nutanix the canonical migration beneficiary discussion.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const nutanixProfile: VendorProfile = {
  slug: "nutanix",
  foundings: [
    {
      company: "Nutanix",
      year: 2009,
      place: "San Jose, California",
      founders: ["Dheeraj Pandey", "Mohit Aron", "Ajeet Singh"],
      story:
        "Nutanix asked why the data center needed a SAN at all. Dheeraj Pandey, Mohit Aron - who had worked on the Google File System, the mother document of distributed storage - and Ajeet Singh founded the company in 2009 to collapse compute and storage into one scale-out tier: commodity servers, a distributed file system across them, virtual machines on top. The industry named it hyperconverged infrastructure and drew a category around what Nutanix was already selling; Aron would later leave to found Cohesity and apply the same distributed-systems DNA to backup.",
    },
  ],
  timeline: [
    { year: 2009, title: "Founded on Google-style storage", detail: "Three founders with distributed-systems pedigree start building a scale-out platform where every node contributes compute and storage - the SAN designed out of the architecture." },
    { year: 2011, title: "'No SAN'", detail: "The first Virtual Computing Platform ships with a marketing line that names the revolution; hyperconverged infrastructure becomes the fastest-drawn category of the decade with Nutanix as its axis." },
    { year: 2015, title: "AHV: the free hypervisor", detail: "Nutanix ships its own KVM-based Acropolis Hypervisor, turning the VMware relationship from symbiosis toward rivalry - own the platform, and the hypervisor becomes a feature." },
    { year: 2016, title: "IPO: NTNX", detail: "The September Nasdaq listing is the year's marquee enterprise-tech IPO - the HCI category leader arriving on the public market mid-transition from appliances to software." },
    { year: 2020, title: "Bain, and the founder departs", detail: "Bain Capital's $750 million convertible investment lands alongside Dheeraj Pandey's retirement announcement; Rajiv Ramaswami, VMware's COO, takes over in December - and VMware sues over the hire, a suit later resolved as the subscription pivot accelerates." },
    { year: 2023, title: "The Broadcom dividend", detail: "As Broadcom's VMware acquisition upends licensing across the industry, Nutanix Cloud Platform with AHV becomes the canonical migration conversation - the alternative platform argument the company had built toward for a decade." },
  ],
  products: [
    { name: "Nutanix Cloud Platform", what: "The HCI core grown up: distributed storage (AOS), the AHV hypervisor, and management under one subscription platform." },
    { name: "AHV", what: "The built-in KVM-based hypervisor - the piece that turned an infrastructure vendor into a virtualization platform." },
    { name: "Nutanix Cloud Clusters (NC2)", what: "The same stack running on AWS and Azure bare metal - hybrid cloud as one operating model." },
  ],
  innovations: [
    { title: "Hyperconvergence itself", detail: "Nutanix turned web-scale distributed storage into an enterprise product and forced the industry - VMware vSAN included - to follow the architecture it proved." },
    { title: "The one-click operating model", detail: "Prism's design standard - upgrades, capacity, and recovery as single actions - reset expectations for how infrastructure software should feel to operate.", },
  ],
  markets: [
    "A leader of the HCI market it created, selling the Cloud Platform across private and public clouds - with the post-Broadcom VMware estate as the defining competitive opportunity of its current chapter.",
  ],
  analyst: [
    "A Leader in the hyperconverged evaluations from their first editions, trading the top position with VMware through the category's whole history.",
  ],
};
