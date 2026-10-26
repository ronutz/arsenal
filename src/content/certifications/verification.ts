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
// R1-b3 (2026-10-26): every entry dated before October was re-read against the vendor's own pages, the Ping
// Certifications page and the F5-CA article in a real browser (both refuse automated reads). 88 entries moved to
// 2026-10-26 and one was added (FortiOS 8.0); each basis names the document read. The nine F5 Specialist, Expert and
// NGINX entries keep their July dates on purpose: their blueprint PDFs open only in a document viewer and have not
// been compared yet. The batch record, sources and decisions live outside the repository with the batch notes.
// F5 blueprint PDFs (2026-10-26): the nine F5 Specialist, Expert and NGINX entries and the five F5-CA entries now
// rest on the official blueprint PDFs, downloaded from F5's document viewer in a real browser (the viewer dates
// them 20 November 2025) and compared section by section and objective by objective. Every objective and example
// matched; all 14 entries moved to 2026-10-26. Comparison record: the batch notes outside the repository.
export const GUIDE_VERIFICATION: Readonly<Record<string, GuideVerification>> = {
  // checkpoint
  "checkpoint-ccta-r8120": { on: "2026-10-26", basis: "Pearson VUE Check Point programme page (last updated 2026-10-13) and Check Point Certification FAQ PDF (3/2026) read 2026-10-26: code 156-582, name and the CCSA or CCSE prerequisite match; no objective blueprint is published" },
  "checkpoint-ccte-r82": { on: "2026-10-26", basis: "Pearson VUE Check Point programme page (last updated 2026-10-13) and Check Point Certification FAQ PDF (3/2026) read 2026-10-26: the R82 CCTE release (156-588) and name match; no objective blueprint is published" },
  "checkpoint-ccte-r8120": { on: "2026-10-26", basis: "Pearson VUE Check Point programme page (last updated 2026-10-13) and Check Point Certification FAQ PDF (3/2026) read 2026-10-26: code 156-587, name, prerequisite and the September 30, 2026 retirement in favour of 156-588 match" },
  "checkpoint-ccms-r81": { on: "2026-10-26", basis: "Pearson VUE Check Point programme page (last updated 2026-10-13) and Check Point Certification FAQ PDF (3/2026) read 2026-10-26: code 156-541, name and the September 30, 2026 retirement match" },
  "checkpoint-ccvs-r81": { on: "2026-10-26", basis: "Pearson VUE Check Point programme page (last updated 2026-10-13) and Check Point Certification FAQ PDF (3/2026) read 2026-10-26: code 156-551, name and the September 30, 2026 retirement match" },
  "checkpoint-ccpe-i-exam": { on: "2026-10-26", basis: "HackingPoint Infrastructure Hacking course synopsis PDF and Check Point Certification FAQ PDF (3/2026) read 2026-10-26: code 156-402 and the 14 class-content headings with their topics match" },
  "checkpoint-ccpe-w-exam": { on: "2026-10-26", basis: "Check Point Certification FAQ PDF (3/2026) read 2026-10-26: code 156-403 and name match; no per-objective blueprint is published" },
  "checkpoint-ccpe-iot-exam": { on: "2026-10-26", basis: "Check Point Certification FAQ PDF (3/2026) read 2026-10-26: code 156-404 and name match; no per-objective blueprint is published" },
  "checkpoint-ccpe-c-exam": { on: "2026-10-26", basis: "Check Point Certification FAQ PDF (3/2026) read 2026-10-26: code 156-406 and name match; no per-objective blueprint is published" },
  "checkpoint-ccpe-ai-exam": { on: "2026-10-26", basis: "Check Point Certification FAQ PDF (3/2026) read 2026-10-26: code 156-409 and name match; no per-objective blueprint is published" },
  "checkpoint-ccas-r8120": { on: "2026-10-26", basis: "Check Point Certification FAQ PDF (3/2026) read 2026-10-26: code 156-521 and name match; no per-objective blueprint is published" },
  "checkpoint-ccme-r81": { on: "2026-10-26", basis: "Check Point Certification FAQ PDF (3/2026) read 2026-10-26: code 156-836 and name match; no per-objective blueprint is published" },
  "checkpoint-cccs-r8120": { on: "2026-10-26", basis: "Check Point Certification FAQ PDF (3/2026) read 2026-10-26: code 156-561 and name match; no per-objective blueprint is published" },
  "checkpoint-cces-r8120": { on: "2026-10-26", basis: "Check Point Certification FAQ PDF (3/2026) read 2026-10-26: code 156-536 and name match; no per-objective blueprint is published" },
  "checkpoint-ccta-r82": { on: "2026-10-26", basis: "Check Point Certification FAQ PDF (3/2026) read 2026-10-26: code 156-583 and name match; no per-objective blueprint is published" },
  "checkpoint-ctps": { on: "2026-10-26", basis: "Check Point Certification FAQ PDF (3/2026) read 2026-10-26: code 156-590 and name match; no per-objective blueprint is published" },
  "checkpoint-ccsa-r82": { on: "2026-10-26", basis: "CCSA Exam Prep Guide PDF (modified 2025-08-07) read 2026-10-26: code 156-215.82, 100 questions, 90 minutes, 70%, USD 300, delivery and the 31 objectives in 10 modules match" },
  "checkpoint-ccse-r82": { on: "2026-10-26", basis: "CCSE Exam Prep Guide PDF (modified 2025-10-14) read 2026-10-26: code 156-315.82, 100 questions, 90 minutes, 70%, USD 300, delivery and the 21 objectives in 7 modules match" },
  // f5
  "f5-ca-install-config-upgrade": { on: "2026-10-26", basis: "official F5 blueprint PDF (dated 20 November 2025), obtained from F5's document viewer in a real browser on 2026-10-26; blueprint F5-CAB.0425, F5CAB1 part: 5 topics and their examples match word for word; the exam facts rest on the F5-CA article read in a real browser and the F5CAB exam page, both 2026-10-26" },
  "f5-ca-data-plane-concepts": { on: "2026-10-26", basis: "official F5 blueprint PDF (dated 20 November 2025), obtained from F5's document viewer in a real browser on 2026-10-26; blueprint F5-CAB.0425, F5CAB2 part: 5 topics and their examples match word for word; the exam facts rest on the F5-CA article read in a real browser and the F5CAB exam page, both 2026-10-26" },
  "f5-ca-data-plane-configuration": { on: "2026-10-26", basis: "official F5 blueprint PDF (dated 20 November 2025), obtained from F5's document viewer in a real browser on 2026-10-26; blueprint F5-CAB.0425, F5CAB3 part: 2 topics and their examples match word for word; the exam facts rest on the F5-CA article read in a real browser and the F5CAB exam page, both 2026-10-26" },
  "f5-ca-control-plane-administration": { on: "2026-10-26", basis: "official F5 blueprint PDF (dated 20 November 2025), obtained from F5's document viewer in a real browser on 2026-10-26; blueprint F5-CAB.0425, F5CAB4 part: 10 topics and their examples match word for word (one example prints var/log/secure, kept as /var/log/secure); the exam facts rest on the F5-CA article read in a real browser and the F5CAB exam page, both 2026-10-26" },
  "f5-ca-support-and-troubleshoot": { on: "2026-10-26", basis: "official F5 blueprint PDF (dated 20 November 2025), obtained from F5's document viewer in a real browser on 2026-10-26; blueprint F5-CAB.0425, F5CAB5 part: 7 topics and their examples match word for word; the exam facts rest on the F5-CA article read in a real browser and the F5CAB exam page, both 2026-10-26" },
  // ping
  "ping-cp-pingfederate": { on: "2026-10-26", basis: "Ping Identity, Certifications page (training.pingidentity.com/certification), read in a real browser 2026-10-26" },
  "ping-cp-pingaccess": { on: "2026-10-26", basis: "Ping Identity, Certifications page (training.pingidentity.com/certification), read in a real browser 2026-10-26" },
  "ping-cp-pingdirectory": { on: "2026-10-26", basis: "Ping Identity, Certifications page (training.pingidentity.com/certification), read in a real browser 2026-10-26" },
  "ping-cp-pingone": { on: "2026-10-26", basis: "Ping Identity, Certifications page (training.pingidentity.com/certification), read in a real browser 2026-10-26" },
  "ping-cp-pingone-davinci": { on: "2026-10-26", basis: "Ping Identity, Certifications page (training.pingidentity.com/certification), read in a real browser 2026-10-26" },
  "ping-cp-pingam": { on: "2026-10-26", basis: "Ping Identity, Certifications page (training.pingidentity.com/certification), read in a real browser 2026-10-26" },
  "ping-cp-pingone-aic": { on: "2026-10-26", basis: "Ping Identity, Certifications page (training.pingidentity.com/certification), read in a real browser 2026-10-26" },
  "ping-cp-pingidm": { on: "2026-10-26", basis: "Ping Identity, Certifications page (training.pingidentity.com/certification), read in a real browser 2026-10-26" },
  "ping-cp-pingone-idg": { on: "2026-10-26", basis: "Ping Identity, Certifications page (training.pingidentity.com/certification), read in a real browser 2026-10-26" },
  "ping-ce-pingfederate": { on: "2026-10-26", basis: "Ping Identity, Certifications page (training.pingidentity.com/certification), read in a real browser 2026-10-26" },
  "ping-ce-pingaccess": { on: "2026-10-26", basis: "Ping Identity, Certifications page (training.pingidentity.com/certification), read in a real browser 2026-10-26" },
  "ping-ce-pingdirectory": { on: "2026-10-26", basis: "Ping Identity, Certifications page (training.pingidentity.com/certification), read in a real browser 2026-10-26" },
  "ping-ce-pingone": { on: "2026-10-26", basis: "Ping Identity, Certifications page (training.pingidentity.com/certification), read in a real browser 2026-10-26" },
  "ping-ce-pingone-aic": { on: "2026-10-26", basis: "Ping Identity, Certifications page (training.pingidentity.com/certification), read in a real browser 2026-10-26" },
  "ping-ce-pingam": { on: "2026-10-26", basis: "Ping Identity, Certifications page (training.pingidentity.com/certification), read in a real browser 2026-10-26" },
  // f5
  "f5-cts-ltm-base-config-networking": { on: "2026-10-05", basis: "the F5-CTS, LTM certification note, corrected against F5's exam pages read 2026-10-05 (F9, SCOUT Round 1)" },
  "f5-cts-ltm-virtual-servers-config-objects": { on: "2026-10-05", basis: "the F5-CTS, LTM certification note, corrected against F5's exam pages read 2026-10-05 (F9, SCOUT Round 1)" },
  "f5-cts-ltm-irules-analytics-templates": { on: "2026-10-05", basis: "the F5-CTS, LTM certification note, corrected against F5's exam pages read 2026-10-05 (F9, SCOUT Round 1)" },
  "f5-cts-ltm-upgrades-ha-monitoring": { on: "2026-10-05", basis: "the F5-CTS, LTM certification note, corrected against F5's exam pages read 2026-10-05 (F9, SCOUT Round 1)" },
  "f5-cts-ltm-pcap-tcp-udp-app": { on: "2026-10-05", basis: "the F5-CTS, LTM certification note, corrected against F5's exam pages read 2026-10-05 (F9, SCOUT Round 1)" },
  "f5-cts-ltm-pcap-tls-ssl": { on: "2026-10-05", basis: "the F5-CTS, LTM certification note, corrected against F5's exam pages read 2026-10-05 (F9, SCOUT Round 1)" },
  // zscaler
  "zscaler-zdta": { on: "2026-10-26", basis: "ZDTA Study Guide PDF (modified 2026-06-11) read 2026-10-26: exam blueprint of 60 questions, 90 minutes, Professional level, six weighted domains and the 44 objectives match" },
  // f5
  "f5-cts-dns-302": { on: "2026-10-26", basis: "official F5 blueprint PDF (dated 20 November 2025), obtained from F5's document viewer in a real browser on 2026-10-26; blueprint 302.72017: four sections and 16 objectives match word for word with their examples; 80 questions (70 scored, 10 pilot/beta), 90 minutes, passing score 245 (100-350) and US$180 match; the exam page read with curl 2026-10-26 links this blueprint" },
  "f5-cts-asm-303": { on: "2026-10-26", basis: "official F5 blueprint PDF (dated 20 November 2025), obtained from F5's document viewer in a real browser on 2026-10-26; blueprint 303.72017: four sections and 25 objectives match word for word with their examples; 80 questions (70 scored, 10 pilot/beta), 90 minutes, passing score 245 (100-350) and US$180 match; the exam page read with curl 2026-10-26 links this blueprint" },
  "f5-cts-apm-304": { on: "2026-10-26", basis: "official F5 blueprint PDF (dated 20 November 2025), obtained from F5's document viewer in a real browser on 2026-10-26; blueprint 304.92018: six sections and 30 objectives match word for word with their examples; 80 questions (70 scored, 10 pilot/beta), 90 minutes, passing score 245 (100-350) and US$180 match; the exam page read with curl 2026-10-26 links this blueprint" },
  "f5-cse-security-401": { on: "2026-10-26", basis: "official F5 blueprint PDF (dated 20 November 2025), obtained from F5's document viewer in a real browser on 2026-10-26; blueprint 401.102019: four sections and 17 objectives match word for word; 70 questions (65 scored, 5 pilot/beta), 105 minutes, passing score 245 (100-350) and US$180 match; the exam page read with curl 2026-10-26 links this blueprint" },
  "f5-cse-cloud-402": { on: "2026-10-26", basis: "official F5 blueprint PDF (dated 20 November 2025), obtained from F5's document viewer in a real browser on 2026-10-26; blueprint 402.42019: five sections and 29 objectives match word for word; 70 questions (65 scored, 5 pilot/beta), 105 minutes, passing score 245 (100-350) and US$180 match; the exam page read with curl 2026-10-26 links this blueprint" },
  "f5-nginx-f5n1": { on: "2026-10-26", basis: "official F5 blueprint PDF (dated 20 November 2025), obtained from F5's document viewer in a real browser on 2026-10-26; F5 Certified Administrator, NGINX certification blueprint (no document id printed), Management part: 4 objectives and their examples match word for word; the exam page read with curl 2026-10-26 links this blueprint" },
  "f5-nginx-f5n2": { on: "2026-10-26", basis: "official F5 blueprint PDF (dated 20 November 2025), obtained from F5's document viewer in a real browser on 2026-10-26; F5 Certified Administrator, NGINX certification blueprint (no document id printed), Configuration: Knowledge part: 4 objectives and their examples match word for word; the exam page read with curl 2026-10-26 links this blueprint" },
  "f5-nginx-f5n3": { on: "2026-10-26", basis: "official F5 blueprint PDF (dated 20 November 2025), obtained from F5's document viewer in a real browser on 2026-10-26; F5 Certified Administrator, NGINX certification blueprint (no document id printed), Configuration: Demonstrate part: 5 objectives and their examples match word for word; the exam page read with curl 2026-10-26 links this blueprint" },
  "f5-nginx-f5n4": { on: "2026-10-26", basis: "official F5 blueprint PDF (dated 20 November 2025), obtained from F5's document viewer in a real browser on 2026-10-26; F5 Certified Administrator, NGINX certification blueprint (no document id printed), Troubleshooting part: 3 objectives and their examples match word for word; the exam page read with curl 2026-10-26 links this blueprint" },
  // netskope
  // Round 1 (CC01, 2026-10-25): TR-772-1 and TR-773-1 read in full on 2026-10-20 and 2026-10-25; each topic list matches its guide's objectives word for word.
  "netskope-administrator-accreditation": { on: "2026-10-25", basis: "TR-772-1 (09/24) read in full 2026-10-20 and 2026-10-25; objectives, facts and the NSK101 replacement statement match the record" },
  "netskope-integrator-accreditation": { on: "2026-10-25", basis: "TR-773-1 (09/24) read in full 2026-10-20 and 2026-10-25; objectives, facts and the NSK200 replacement statement match the record" },
  "netskope-nsk101": { on: "2026-10-26", basis: "NCCSA NSK101 Certification Description PDF and TR-772-1 read 2026-10-26, byte-identical to the previous reads: the 20 objectives, 90-minute Pearson VUE exam and the replacement statement match" },
  "netskope-nsk200": { on: "2026-10-26", basis: "NCCSI NSK200 Certification Description PDF and TR-773-1 read 2026-10-26, byte-identical to the previous reads: the 21 objectives, 90-minute Pearson VUE exam and the replacement statement match" },
  "netskope-nsk300": { on: "2026-10-26", basis: "Netskope Cloud Security Certification Program PDF read 2026-10-26, byte-identical to the previous read: the 17 Architect objectives and the 90-minute Pearson VUE exam match; no successor is named" },
  // extreme
  "extreme-ecp-switching": { on: "2026-10-26", basis: "Extreme Networks technical-training courses page read 2026-10-26: the track lists the four Knowledge Credentials and the Extreme Certified Professional one-day lab assessment; no objective blueprint is published" },
  "extreme-ecp-fabric": { on: "2026-10-26", basis: "Extreme Networks technical-training courses page read 2026-10-26: the track lists the four Knowledge Credentials and the Extreme Certified Professional one-day lab assessment; no objective blueprint is published" },
  "extreme-ecp-wireless-cloud": { on: "2026-10-26", basis: "Extreme Networks technical-training courses page read 2026-10-26: the track lists the four Knowledge Credentials and the Extreme Certified Professional one-day lab assessment; no objective blueprint is published" },
  "extreme-ecp-xiq-controller": { on: "2026-10-26", basis: "Extreme Networks technical-training courses page read 2026-10-26: the track lists the four Knowledge Credentials and the Extreme Certified Professional one-day lab assessment; no objective blueprint is published" },
  "extreme-ecp-xiq-site-engine": { on: "2026-10-26", basis: "Extreme Networks technical-training courses page read 2026-10-26: the track lists the four Knowledge Credentials and the Extreme Certified Professional one-day lab assessment; no objective blueprint is published" },
  "extreme-ecp-sdwan": { on: "2026-10-26", basis: "Extreme Networks technical-training courses page read 2026-10-26: the track lists the four Knowledge Credentials and the Extreme Certified Professional one-day lab assessment; no objective blueprint is published" },
  "extreme-ecp-control": { on: "2026-10-26", basis: "Extreme Networks technical-training courses page read 2026-10-26: the track lists the four Knowledge Credentials and the Extreme Certified Professional one-day lab assessment; no objective blueprint is published" },
  "extreme-ecp-universal-ztna": { on: "2026-10-26", basis: "Extreme Networks technical-training courses page read 2026-10-26: the ExtremeCloud Universal ZTNA track lists two training courses and no credential or assessment, recorded as not settled" },
  // fortinet
  "fortinet-nse-1-cybersecurity-cloud-fundamentals": { on: "2026-10-26", basis: "Cybersecurity and Cloud Fundamentals course page and NSE 1 in Cybersecurity page (Fortinet Training Institute) read 2026-10-26: name and the 5 course objectives match; the exam is the online exam at the end of the course" },
  "fortinet-nse-2-intro-ngfw": { on: "2026-10-26", basis: "Introduction to Next Generation Firewall course page and NSE 2 in Cybersecurity page (Fortinet Training Institute) read 2026-10-26: name and the 3 course objectives match; the exam is the online exam at the end of the course" },
  "fortinet-nse-3-fortigate-operator": { on: "2026-10-26", basis: "FortiGate Operator course page and NSE 3 in Cybersecurity page (Fortinet Training Institute) read 2026-10-26: name and the 5 course objectives match; the exam is the online exam at the end of the course" },
  "fortinet-nse-4-fortios-administrator": { on: "2026-10-26", basis: "FortiOS Administrator Exam page (Fortinet Training Institute) read 2026-10-26: the 7.6 exam is Available; time corrected to 100 minutes, weighting labels to the page's wording; questions, languages, product version and the 18 tasks match" },
  // Added 2026-10-26: the announced successor version of the NSE 4 exam (its own guide).
  "fortinet-nse-4-fortios-80-administrator": { on: "2026-10-26", basis: "FortiOS Administrator Exam page (Fortinet Training Institute) read 2026-10-26: the 8.0 exam is listed as Coming Soon with 100 minutes, 50-60 questions, English, FortiOS 8.0.0 and 18 tasks in 5 weighted sections, all transcribed" },
  "fortinet-nse-5-fortiswitch-administrator": { on: "2026-10-26", basis: "FortiSwitch Administrator page (Fortinet Training Institute) read 2026-10-26: time corrected to 70 minutes; questions, languages, product version and the 15 tasks match" },
  "fortinet-nse-5-sdwan-core-administrator": { on: "2026-10-26", basis: "SD-WAN Core Administrator Exam page (Fortinet Training Institute) read 2026-10-26: objectives remapped verbatim to the 9 published tasks in 3 weighted sections of the SD-WAN Core 7.6 exam, with its facts" },
  "fortinet-nse-5-secure-wireless-lan-administrator": { on: "2026-10-26", basis: "Secure Wireless LAN Administrator page (Fortinet Training Institute) read 2026-10-26: the 7.6 exam is Available; time, questions, language, product version and the 12 tasks match" },
  // Round 1 (CC05, 2026-10-25): the exam page read on 2026-10-20 and 2026-10-25 carries both versions; each guide matches its own version word for word.
  "fortinet-nse-5-sase-sdwan-core-administrator": { on: "2026-10-25", basis: "FortiSASE and SD-WAN Core Administrator Exam page read 2026-10-20 and 2026-10-25: 7.6 objectives, facts and the November 14, 2026 last sitting day match the record" },
  "fortinet-nse-5-sase-sdwan-26-core-administrator": { on: "2026-10-25", basis: "FortiSASE and SD-WAN Core Administrator Exam page read 2026-10-20 and 2026-10-25: 26 tasks, details, weightings and facts transcribed" },
  "fortinet-nse-5-fortiappsec-administrator": { on: "2026-10-26", basis: "FortiAppSec Cloud Administrator page (Fortinet Training Institute) read 2026-10-26: objectives remapped verbatim to the 12 published tasks in 4 weighted sections of the FortiAppSec Cloud 26 exam, with its facts" },
  "fortinet-nse-5-fortiadc-administrator": { on: "2026-10-26", basis: "FortiADC Administrator course page and FortiADC Administrator Exam page (Fortinet Training Institute) read 2026-10-26: the 33 course objectives match; the exam page reads Coming soon and publishes no topics" },
  "fortinet-nse-5-fortiweb-administrator": { on: "2026-10-26", basis: "FortiWeb Administrator page (Fortinet Training Institute) read 2026-10-26: the 8.0 exam is Available; time, questions, languages, product version and the 10 tasks match" },
  "fortinet-nse-5-fortianalyzer-analyst": { on: "2026-10-26", basis: "FortiAnalyzer Analyst page (Fortinet Training Institute) read 2026-10-26: the 7.6 exam is Available; time, questions, languages, product version and the 13 tasks match" },
  "fortinet-nse-6-fortianalyzer-administrator": { on: "2026-10-26", basis: "FortiAnalyzer Administrator course page and FortiAnalyzer Administrator Exam page (Fortinet Training Institute) read 2026-10-26: the 22 course objectives match; the exam page reads Coming soon and publishes no topics" },
  "fortinet-nse-6-fortimanager-administrator": { on: "2026-10-26", basis: "FortiManager Administrator page (Fortinet Training Institute) read 2026-10-26: the 7.6 exam is Available; weighting labels corrected to the page's wording; time, questions, languages, product version and the 17 tasks match" },
  "fortinet-nse-6-fortinac-administrator": { on: "2026-10-26", basis: "FortiNAC Administrator page (Fortinet Training Institute) read 2026-10-26: the FortiNAC-F 7.6 exam is Available; time corrected to 60 minutes, weighting labels to the page's wording; questions, language, product version and the 13 tasks match" },
  "fortinet-nse-6-fortivoice-administrator": { on: "2026-10-26", basis: "FortiVoice Administrator Exam page (Fortinet Training Institute) read 2026-10-26: the page reads Coming soon and publishes no exam topics, as the record states" },
  "fortinet-nse-6-forticlient-ems-administrator": { on: "2026-10-26", basis: "FortiClient EMS Administrator page (Fortinet Training Institute) read 2026-10-26: the 7.4 exam is Available; time corrected to 65 minutes; questions, languages, product version and the 10 tasks match" },
  "fortinet-nse-6-fortidlp-administrator": { on: "2026-10-26", basis: "FortiDLP Administrator page (Fortinet Training Institute) read 2026-10-26: the 26 exam is Available; time corrected to 65 minutes, weighting labels to the page's wording; questions, language, product version and the 10 tasks match" },
  "fortinet-nse-6-fortiedr-administrator": { on: "2026-10-26", basis: "FortiEDR Administrator page (Fortinet Training Institute) read 2026-10-26: the 7.0 exam is Available; time corrected to 70 minutes; questions, language, product version and the 17 tasks match" },
  "fortinet-nse-6-forticnapp-analyst": { on: "2026-10-26", basis: "FortiCNAPP Analyst page (Fortinet Training Institute) read 2026-10-26: the 26 exam is Available; time corrected to 75 minutes, weighting labels to the page's wording; questions, language, product version and the 11 tasks match" },
  "fortinet-nse-6-fortiddos-administrator": { on: "2026-10-26", basis: "FortiDDoS Administrator page (Fortinet Training Institute) read 2026-10-26: objectives remapped verbatim to the 11 published tasks in 4 weighted sections of the FortiDDoS 7.2 exam, with its facts" },
  "fortinet-nse-6-fortimail-administrator": { on: "2026-10-26", basis: "FortiMail Administrator page (Fortinet Training Institute) read 2026-10-26: the 7.4 exam is Available; time, questions, languages, product version and the 15 tasks match" },
  "fortinet-nse-6-fortimail-workspace-administrator": { on: "2026-10-26", basis: "FortiMail Workspace Security Administrator course page and FortiMail Workspace Administrator exam page (Fortinet Training Institute) read 2026-10-26: the 31 course objectives match; the exam is listed as Coming Soon with no topics" },
  "fortinet-nse-6-fortideceptor-administrator": { on: "2026-10-26", basis: "FortiDeceptor Administrator page (Fortinet Training Institute) read 2026-10-26: objectives remapped verbatim to the 8 published tasks in 2 weighted sections of the FortiDeceptor 6.2 exam, with its facts" },
  "fortinet-nse-6-fortindr-cloud-analyst": { on: "2026-10-26", basis: "FortiNDR Cloud Analyst page (Fortinet Training Institute) read 2026-10-26: the 26 exam is Available; time corrected to 65 minutes, weighting labels to the page's wording; questions, language, product version and the 9 tasks match" },
  "fortinet-nse-6-fortirecon-analyst": { on: "2026-10-26", basis: "FortiRecon Analyst page (Fortinet Training Institute) read 2026-10-26: objectives remapped verbatim to the 10 published tasks in 4 weighted sections of the FortiRecon 26 exam, with its facts" },
  "fortinet-nse-6-fortisiem-analyst": { on: "2026-10-26", basis: "FortiSIEM Analyst page (Fortinet Training Institute) read 2026-10-26: the 7.4 exam is Available; time, questions, language, product version and the 17 tasks match" },
  "fortinet-nse-6-fortisoar-analyst": { on: "2026-10-26", basis: "FortiSOAR Analyst page (Fortinet Training Institute) read 2026-10-26: the 7.6 exam is Available; time corrected to 75 minutes, weighting labels to the page's wording; questions, language, product version and the 17 tasks match" },
  "fortinet-nse-7-secure-networking-architect": { on: "2026-10-26", basis: "Secure Networking Architect page (Fortinet Training Institute) read 2026-10-26: the 7.6 exam is Available; time corrected to 75 minutes and languages to English and Japanese; questions, product version and the 15 tasks match" },
  "fortinet-nse-7-sase-architect": { on: "2026-10-26", basis: "FortiSASE Architect page (Fortinet Training Institute) read 2026-10-26: the SASE 26 exam is Available; time corrected to 75 minutes and languages to English and Japanese; questions, product version and the 15 tasks match" },
  "fortinet-nse-7-public-cloud-security-architect": { on: "2026-10-26", basis: "Public Cloud Security Architect Exam page (Fortinet Training Institute) read 2026-10-26: the 7.6.4 exam is Available; time, questions, language, product version and the 12 tasks match" },
  "fortinet-nse-7-security-operations-architect": { on: "2026-10-26", basis: "Security Operations Architect Exam page (Fortinet Training Institute) read 2026-10-26: the 7.6 exam is Available; time, questions, language, product version and the 14 tasks match" },
  "fortinet-nse-8-core": { on: "2026-10-26", basis: "880 - Core page (Fortinet Training Institute) read 2026-10-26: the 108 Details entries and the four section weightings match; the Tasks column is now published, so the truncation caveat was removed" },
  "fortinet-nse-8-secure-networking": { on: "2026-10-26", basis: "881 - Secure Networking page (Fortinet Training Institute) read 2026-10-26: the 96 Details entries and the four section weightings match; the Tasks column is now published, so the truncation caveat was removed" },
  "fortinet-nse-8-application-security": { on: "2026-10-26", basis: "882 - Application Security page (Fortinet Training Institute) read 2026-10-26: the 67 Details entries and the four section weightings match; the Tasks column is now published, so the truncation caveat was removed" },
  "fortinet-nse-8-security-operations": { on: "2026-10-26", basis: "883 - Security Operations page (Fortinet Training Institute) read 2026-10-26: the 68 Details entries and the four section weightings match; the Tasks column is now published, so the truncation caveat was removed" },
  "fortinet-industry-ot-security-administrator": { on: "2026-10-26", basis: "OT Security Architect page (Fortinet Training Institute) read 2026-10-26: mapped verbatim from the 12 published tasks in 4 weighted sections of the OT Security 7.6 Architect exam, with its facts" },
  "fortinet-industry-mssp-security-administrator": { on: "2026-10-26", basis: "NSE Industry - MSSP Security page (Fortinet Training Institute) read 2026-10-26: the page reads Coming soon and publishes no exam, as the record states; link corrected to this page" },
};

/** The last check of a guide's record, or null when none is recorded (the guard keeps that from shipping). */
export function getGuideVerification(slug: string): GuideVerification | null {
  // Own properties only, so a slug such as "constructor" can never reach the prototype.
  return Object.prototype.hasOwnProperty.call(GUIDE_VERIFICATION, slug) ? GUIDE_VERIFICATION[slug] : null;
}
