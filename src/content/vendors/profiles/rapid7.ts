// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-04 against 2025-26 comparison
// surveys (InsightVM as the cloud successor to Nexpose; Active Risk scoring
// using machine learning and threat intelligence, contrasted with static CVSS;
// 500+ integrations; entry pricing around $1.62 per asset per month, roughly
// $15,000/yr against Tenable's $30,000/yr floor for a comparable product).
//
// THE BODY ALREADY ARGUES the Metasploit acquisition against Tenable's closing
// of Nessus, what owning an exploitation framework lets you claim, and the
// volume problem. This adds structure.
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const rapid7Profile: VendorProfile = {
  slug: "rapid7",
  foundings: [
    {
      company: "Rapid7",
      year: 2000,
      place: "Boston, Massachusetts",
      founders: [],
      story:
        "Founded in 2000, and the decision that gave it a distinct position came nine years later when it acquired the Metasploit Framework and kept it open source. A vulnerability management company owning the industry's best-known exploitation toolkit is an unusual arrangement, and it is the reverse of what its closest competitor did with the scanner it was built on.",
      sourceNote: "Founder names are not consistently reported and are not supplied here.",
    },
  ],
  timeline: [
    { year: 2000, title: "Founded", detail: "In Boston, in the vulnerability assessment market." },
    { year: 2009, title: "Metasploit", detail: "Acquired, and kept open. The framework remained free while the company built commercial products beside it - the opposite direction of travel from Nessus four years earlier." },
    { year: 2015, title: "NASDAQ listing", detail: "Listed as RPD." },
    { year: 2020, title: "Insight platform consolidation", detail: "Vulnerability findings, detection and response, application security and cloud posture assembled onto shared data, on the bet that customers want findings correlated with live telemetry rather than delivered as a separate report." },
  ],
  products: [
    { name: "InsightVM", what: "The cloud successor to Nexpose: live dashboards, risk-based prioritisation, and integration into ticketing and delivery pipelines so findings become work items rather than PDFs." },
    { name: "Metasploit", what: "The exploitation framework, still open source, alongside a commercial Pro edition. It is simultaneously a product, a recruiting tool and the reason a great many practitioners know the company at all." },
    { name: "InsightIDR", what: "Detection and response, drawing on the same platform data - the argument being that a vulnerability matters differently when something is already moving on the network." },
    { name: "InsightAppSec", what: "Dynamic application security testing, probing running applications rather than scanning hosts. A separate product because it answers a different question." },
    { name: "Active Risk", what: "Prioritisation using threat intelligence and machine learning rather than published severity alone, aimed directly at the gap between what is scored critical and what is actually being exploited." },
  ],
  innovations: [
    { title: "Stewardship of a dual-use tool", detail: "Keeping Metasploit open made the company responsible for a framework that attackers use as readily as defenders. Every new module is a capability released to both sides at once, and the justification - that the technique is already known and defenders are the ones who need it packaged - is the same argument the whole disclosure debate turns on." },
    { title: "Validation inside the same platform", detail: "Because the exploitation framework and the scanner share an owner, confirming a finding is a workflow step rather than a separate engagement with a separate vendor - which changes who can do it and how often." },
    { title: "Findings as workflow, not reports", detail: "Native integration with issue trackers reflects the actual failure mode: the report is produced, and nothing happens. Making a finding into an assigned ticket with a service-level target is a product decision about organisational behaviour rather than about scanning." },
    { title: "Correlating exposure with live attack data", detail: "Vulnerability findings and detection telemetry on one platform means the question shifts from which of these fifty thousand findings matters to which of them is being touched right now." },
  ],
  markets: [
    "Mid-market and enterprise, with entry pricing below its main competitor and a reputation for fitting teams that want vulnerability work inside their existing delivery process rather than beside it.",
    "It competes with Tenable and Qualys, both on this timeline, and its detection products put it against a second set of vendors entirely - which is the consolidation trade every security company in this segment has taken.",
  ],
  analyst: [
    "Regularly assessed among the established vulnerability management vendors, with prioritisation and integration breadth cited as strengths and setup complexity as the consistent criticism in practitioner reviews.",
    "The category observation applies here too: the branding has moved to exposure management across all three vendors, and none has finished the move, so evaluations still turn on scan architecture, coverage and scoring.",
  ],
};
