// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/content/certifications/verification.ts
// ----------------------------------------------------------------------------
// WHEN EACH STUDY GUIDE WAS LAST CHECKED AGAINST THE VENDOR'S OFFICIAL SOURCES
// (R1-b1, 2026-10-06; SCOUT's Round 1 adoption audit, row 10: "verified
// against vendor source on [date]").
//
// One entry per guide, keyed by slug. `on` is an ISO calendar day; `basis` is
// the guide record's OWN statement of that check, in short, so the date can be
// audited against src/content/certifications/study-guides.ts (its comments and
// source labels) and the canon session notes. Nothing here was re-read on the
// day this file was written: every date is one the records already stated.
// Where a record names several dates, the latest check of the vendor's
// material wins; where only a structure-level check is recorded (the Fortinet
// and Extreme scaffolds of 2026-07-23), that date stands, which can only make a
// record look OLDER than it is, never fresher.
//
// The guide page renders "Checked against <vendor>'s official sources on
// <date>", and src/lib/certStatus.ts marks a record stale past FRESHNESS_DAYS.
// The re-verification sweep (R1-b3, seven vendor batches) updates these
// entries, one batch per build note, each date the day the vendor's pages were
// read. Guarded by scripts/check-cert-verification.mjs: every guide has
// exactly one entry, every entry names a guide, every date is a real day no
// later than the build day, every basis is non-empty.
// ============================================================================

/** The last check of one guide's record against the vendor's official sources. */
export interface GuideVerification {
  /** The day of the check, YYYY-MM-DD. */
  on: string;
  /** The record's own statement of the check, in short (for audit; not rendered). */
  basis: string;
}

/** Every guide's last check, keyed by the guide's slug, grouped by vendor in the data file's order. */
export const GUIDE_VERIFICATION: Readonly<Record<string, GuideVerification>> = {
  // checkpoint
  "checkpoint-ccta-r8120": { on: "2026-07-26", basis: "Check Point's Exam Prep Guides, Certification FAQ and the Pearson VUE programme page, live-verified 2026-07-26" },
  "checkpoint-ccte-r82": { on: "2026-07-26", basis: "Check Point's Exam Prep Guides, Certification FAQ and the Pearson VUE programme page, live-verified 2026-07-26" },
  "checkpoint-ccte-r8120": { on: "2026-07-26", basis: "Check Point's Exam Prep Guides, Certification FAQ and the Pearson VUE programme page, live-verified 2026-07-26" },
  "checkpoint-ccms-r81": { on: "2026-07-26", basis: "Check Point's Exam Prep Guides, Certification FAQ and the Pearson VUE programme page, live-verified 2026-07-26" },
  "checkpoint-ccvs-r81": { on: "2026-07-26", basis: "Check Point's Exam Prep Guides, Certification FAQ and the Pearson VUE programme page, live-verified 2026-07-26" },
  "checkpoint-ccpe-i-exam": { on: "2026-07-27", basis: "HackingPoint roster from Check Point's Certification FAQ, added 2026-07-27" },
  "checkpoint-ccpe-w-exam": { on: "2026-07-27", basis: "HackingPoint roster from Check Point's Certification FAQ, added 2026-07-27" },
  "checkpoint-ccpe-iot-exam": { on: "2026-07-27", basis: "HackingPoint roster from Check Point's Certification FAQ, added 2026-07-27" },
  "checkpoint-ccpe-c-exam": { on: "2026-07-27", basis: "HackingPoint roster from Check Point's Certification FAQ, added 2026-07-27" },
  "checkpoint-ccpe-ai-exam": { on: "2026-07-27", basis: "HackingPoint roster from Check Point's Certification FAQ, added 2026-07-27" },
  "checkpoint-ccas-r8120": { on: "2026-07-26", basis: "Check Point's Exam Prep Guides, Certification FAQ and the Pearson VUE programme page, live-verified 2026-07-26" },
  "checkpoint-ccme-r81": { on: "2026-07-26", basis: "Check Point's Exam Prep Guides, Certification FAQ and the Pearson VUE programme page, live-verified 2026-07-26" },
  "checkpoint-cccs-r8120": { on: "2026-07-26", basis: "Check Point's Exam Prep Guides, Certification FAQ and the Pearson VUE programme page, live-verified 2026-07-26" },
  "checkpoint-cces-r8120": { on: "2026-07-26", basis: "Check Point's Exam Prep Guides, Certification FAQ and the Pearson VUE programme page, live-verified 2026-07-26" },
  "checkpoint-ccta-r82": { on: "2026-07-26", basis: "Check Point's Exam Prep Guides, Certification FAQ and the Pearson VUE programme page, live-verified 2026-07-26" },
  "checkpoint-ctps": { on: "2026-07-26", basis: "Check Point's Exam Prep Guides, Certification FAQ and the Pearson VUE programme page, live-verified 2026-07-26" },
  "checkpoint-ccsa-r82": { on: "2026-07-26", basis: "Check Point's Exam Prep Guides, Certification FAQ and the Pearson VUE programme page, live-verified 2026-07-26" },
  "checkpoint-ccse-r82": { on: "2026-07-26", basis: "Check Point's Exam Prep Guides, Certification FAQ and the Pearson VUE programme page, live-verified 2026-07-26" },
  // f5
  "f5-ca-install-config-upgrade": { on: "2026-07-21", basis: "blueprint F5-CAB.0425, official, relayed by PRIME 2026-07-21" },
  "f5-ca-data-plane-concepts": { on: "2026-07-21", basis: "blueprint F5-CAB.0425, official, relayed by PRIME 2026-07-21" },
  "f5-ca-data-plane-configuration": { on: "2026-07-21", basis: "blueprint F5-CAB.0425, official, relayed by PRIME 2026-07-21" },
  "f5-ca-control-plane-administration": { on: "2026-07-21", basis: "blueprint F5-CAB.0425, official, relayed by PRIME 2026-07-21" },
  "f5-ca-support-and-troubleshoot": { on: "2026-07-21", basis: "blueprint F5-CAB.0425, official, relayed by PRIME 2026-07-21" },
  // ping
  "ping-cp-pingfederate": { on: "2026-07-22", basis: "official exam description, training.pingidentity.com/certification, verified 2026-07-22 (Run B scaffold)" },
  "ping-cp-pingaccess": { on: "2026-07-22", basis: "official exam description, training.pingidentity.com/certification, verified 2026-07-22 (Run B scaffold)" },
  "ping-cp-pingdirectory": { on: "2026-07-22", basis: "official exam description, training.pingidentity.com/certification, verified 2026-07-22 (Run B scaffold)" },
  "ping-cp-pingone": { on: "2026-07-22", basis: "official exam description, training.pingidentity.com/certification, verified 2026-07-22 (Run B scaffold)" },
  "ping-cp-pingone-davinci": { on: "2026-07-22", basis: "official exam description, training.pingidentity.com/certification, verified 2026-07-22 (Run B scaffold)" },
  "ping-cp-pingam": { on: "2026-07-22", basis: "official exam description, training.pingidentity.com/certification, verified 2026-07-22 (Run B scaffold)" },
  "ping-cp-pingone-aic": { on: "2026-07-22", basis: "official exam description, training.pingidentity.com/certification, verified 2026-07-22 (Run B scaffold)" },
  "ping-cp-pingidm": { on: "2026-07-22", basis: "official exam description, training.pingidentity.com/certification, verified 2026-07-22 (Run B scaffold)" },
  "ping-cp-pingone-idg": { on: "2026-07-22", basis: "official exam description, training.pingidentity.com/certification, verified 2026-07-22 (Run B scaffold)" },
  "ping-ce-pingfederate": { on: "2026-07-23", basis: "transcribed from PRIME's relay of the official exam page dated 2026-07-23" },
  "ping-ce-pingaccess": { on: "2026-07-23", basis: "transcribed from PRIME's relay of the official exam page dated 2026-07-23" },
  "ping-ce-pingdirectory": { on: "2026-07-23", basis: "transcribed from PRIME's relay of the official exam page dated 2026-07-23" },
  "ping-ce-pingone": { on: "2026-07-23", basis: "transcribed from PRIME's relay of the official exam page dated 2026-07-23" },
  "ping-ce-pingone-aic": { on: "2026-07-23", basis: "transcribed from PRIME's relay of the official exam page dated 2026-07-23" },
  "ping-ce-pingam": { on: "2026-07-23", basis: "transcribed from PRIME's relay of the official exam page dated 2026-07-23" },
  // f5
  "f5-cts-ltm-base-config-networking": { on: "2026-10-05", basis: "the F5-CTS, LTM certification note, corrected against F5's exam pages read 2026-10-05 (F9, SCOUT Round 1)" },
  "f5-cts-ltm-virtual-servers-config-objects": { on: "2026-10-05", basis: "the F5-CTS, LTM certification note, corrected against F5's exam pages read 2026-10-05 (F9, SCOUT Round 1)" },
  "f5-cts-ltm-irules-analytics-templates": { on: "2026-10-05", basis: "the F5-CTS, LTM certification note, corrected against F5's exam pages read 2026-10-05 (F9, SCOUT Round 1)" },
  "f5-cts-ltm-upgrades-ha-monitoring": { on: "2026-10-05", basis: "the F5-CTS, LTM certification note, corrected against F5's exam pages read 2026-10-05 (F9, SCOUT Round 1)" },
  "f5-cts-ltm-pcap-tcp-udp-app": { on: "2026-10-05", basis: "the F5-CTS, LTM certification note, corrected against F5's exam pages read 2026-10-05 (F9, SCOUT Round 1)" },
  "f5-cts-ltm-pcap-tls-ssl": { on: "2026-10-05", basis: "the F5-CTS, LTM certification note, corrected against F5's exam pages read 2026-10-05 (F9, SCOUT Round 1)" },
  // zscaler
  "zscaler-zdta": { on: "2026-07-21", basis: "official ZDTA Study Guide fetched live 2026-07-21 from zscaler.com" },
  // f5
  "f5-cts-dns-302": { on: "2026-07-21", basis: "official exam blueprint PDF relayed by PRIME 2026-07-21; catalog key info re-verified the same day" },
  "f5-cts-asm-303": { on: "2026-07-21", basis: "official exam blueprint PDF relayed by PRIME 2026-07-21; catalog key info re-verified the same day" },
  "f5-cts-apm-304": { on: "2026-07-21", basis: "official exam blueprint PDF relayed by PRIME 2026-07-21; catalog key info re-verified the same day" },
  "f5-cse-security-401": { on: "2026-07-21", basis: "official exam blueprint PDF relayed by PRIME 2026-07-21; catalog key info re-verified the same day" },
  "f5-cse-cloud-402": { on: "2026-07-21", basis: "official exam blueprint PDF relayed by PRIME 2026-07-21; catalog key info re-verified the same day" },
  "f5-nginx-f5n1": { on: "2026-07-21", basis: "official NGINX certification blueprint relayed by PRIME 2026-07-21; catalog key info fetched the same day" },
  "f5-nginx-f5n2": { on: "2026-07-21", basis: "official NGINX certification blueprint relayed by PRIME 2026-07-21; catalog key info fetched the same day" },
  "f5-nginx-f5n3": { on: "2026-07-21", basis: "official NGINX certification blueprint relayed by PRIME 2026-07-21; catalog key info fetched the same day" },
  "f5-nginx-f5n4": { on: "2026-07-21", basis: "official NGINX certification blueprint relayed by PRIME 2026-07-21; catalog key info fetched the same day" },
  // netskope
  "netskope-administrator-accreditation": { on: "2026-07-21", basis: "official certification description PDF fetched live 2026-07-21 (Run A)" },
  "netskope-integrator-accreditation": { on: "2026-07-21", basis: "official certification description PDF fetched live 2026-07-21 (Run A)" },
  "netskope-nsk101": { on: "2026-07-21", basis: "official certification description PDF fetched live 2026-07-21 (Run A)" },
  "netskope-nsk200": { on: "2026-07-21", basis: "official certification description PDF fetched live 2026-07-21 (Run A)" },
  "netskope-nsk300": { on: "2026-07-21", basis: "official certification description PDF fetched live 2026-07-21 (Run A)" },
  // extreme
  "extreme-ecp-switching": { on: "2026-07-23", basis: "certification structure verified from the Extreme Networks technical-training tracks, scaffold of 2026-07-23" },
  "extreme-ecp-fabric": { on: "2026-07-23", basis: "certification structure verified from the Extreme Networks technical-training tracks, scaffold of 2026-07-23" },
  "extreme-ecp-wireless-cloud": { on: "2026-07-23", basis: "certification structure verified from the Extreme Networks technical-training tracks, scaffold of 2026-07-23" },
  "extreme-ecp-xiq-controller": { on: "2026-07-23", basis: "certification structure verified from the Extreme Networks technical-training tracks, scaffold of 2026-07-23" },
  "extreme-ecp-xiq-site-engine": { on: "2026-07-23", basis: "certification structure verified from the Extreme Networks technical-training tracks, scaffold of 2026-07-23" },
  "extreme-ecp-sdwan": { on: "2026-07-23", basis: "certification structure verified from the Extreme Networks technical-training tracks, scaffold of 2026-07-23" },
  "extreme-ecp-control": { on: "2026-07-23", basis: "certification structure verified from the Extreme Networks technical-training tracks, scaffold of 2026-07-23" },
  "extreme-ecp-universal-ztna": { on: "2026-07-23", basis: "certification structure verified from the Extreme Networks technical-training tracks, scaffold of 2026-07-23" },
  // fortinet
  "fortinet-nse-1-cybersecurity-cloud-fundamentals": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-2-intro-ngfw": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-3-fortigate-operator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-4-fortios-administrator": { on: "2026-07-25", basis: "FortiOS Administrator exam page, objectives transcribed verbatim 2026-07-25" },
  "fortinet-nse-5-fortiswitch-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-5-sdwan-core-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-5-secure-wireless-lan-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-5-sase-sdwan-core-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-5-fortiappsec-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-5-fortiadc-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-5-fortiweb-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-5-fortianalyzer-analyst": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-6-fortianalyzer-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-6-fortimanager-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-6-fortinac-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-6-fortivoice-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-6-forticlient-ems-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-6-fortidlp-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-6-fortiedr-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-6-forticnapp-analyst": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-6-fortiddos-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-6-fortimail-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-6-fortimail-workspace-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-6-fortideceptor-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-6-fortindr-cloud-analyst": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-6-fortirecon-analyst": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-6-fortisiem-analyst": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-6-fortisoar-analyst": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-7-secure-networking-architect": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-7-sase-architect": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-7-public-cloud-security-architect": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-7-security-operations-architect": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-8-core": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-8-secure-networking": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-8-application-security": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-nse-8-security-operations": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-industry-ot-security-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
  "fortinet-industry-mssp-security-administrator": { on: "2026-07-23", basis: "Fortinet NSE 1-8 structure verified from vendor sources 2026-07-23 (scaffold), the programme effective 15 July 2026" },
};

/** The last check of a guide's record, or null when none is recorded (the guard keeps that from shipping). */
export function getGuideVerification(slug: string): GuideVerification | null {
  // Own properties only, so a slug such as "constructor" can never reach the prototype.
  return Object.prototype.hasOwnProperty.call(GUIDE_VERIFICATION, slug) ? GUIDE_VERIFICATION[slug] : null;
}
