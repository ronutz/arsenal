// ============================================================================
// src/lib/tools/digital-transformation-tracker/milestones.ts
// ----------------------------------------------------------------------------
// THE MILESTONE DATASET.
//
// The organizing principle of this tool is the CERTAINTY TIER, not the date.
// This site's spine is "tools that compute, never guess", and a tracker with a
// "what comes next" section is a forecasting surface. The resolution is that a
// forecast is never allowed to look like a fact: every entry declares what KIND
// of claim it is, and anything that is not a shipped historical fact must carry
// an attributed source.
//
//   shipped   - it happened. Dated, verifiable, uncontroversial.
//   inForce   - a legal or standards obligation already binding today.
//   scheduled - a fixed FUTURE date set by law or a published timetable. High
//               confidence in the date; no claim about the consequences.
//   contested - a date that genuinely exists in law AND is actively being
//               changed. The most honest and least-served category: the tool
//               shows the original date, the proposed date, and the fact that
//               the change is not yet law.
//   forecast  - somebody's projection. ALWAYS attributed by name. Never stated
//               as fact, and paired with a counter-signal where one exists.
//
// Facts live-verified 2026-07-23. Forecast rows carry their forecaster. (D-19.)
// ============================================================================

/** How much weight a reader should put on this row. */
export type Certainty = "shipped" | "inForce" | "scheduled" | "contested" | "forecast";

/** Which part of life the milestone changed. */
export type Domain =
  | "infrastructure"
  | "commerce"
  | "money"
  | "work"
  | "state"
  | "media"
  | "health";

export interface Milestone {
  /** Stable id for vectors and deep links. */
  id: string;
  /** The year the change landed, or the year a future date falls in. */
  year: number;
  domain: Domain;
  certainty: Certainty;
  /** Short label. */
  title: string;
  /** What actually changed for an ordinary person. */
  changed: string;
  /** What became possible that was not possible before. */
  enabled: string;
  /** Required for anything that is not `shipped`: who says so. */
  source?: string;
  /** For `contested`: what the date is being changed to, and its status. */
  contestedNote?: string;
}

export const MILESTONES: Milestone[] = [
  // -- Infrastructure ------------------------------------------------------
  {
    id: "arpanet",
    year: 1969,
    domain: "infrastructure",
    certainty: "shipped",
    title: "ARPANET carries its first packets",
    changed: "Nothing, for almost everyone. Four university nodes could exchange data over leased lines.",
    enabled: "A network built to survive the loss of any node, which is why no one can switch the internet off today.",
  },
  {
    id: "personal-computer",
    year: 1981,
    domain: "infrastructure",
    certainty: "shipped",
    title: "The personal computer reaches the desk",
    changed: "Computing stopped being something you requested from a department and became something on your own desk.",
    enabled: "Individual authorship of documents, models, and software, without asking permission from a mainframe operator.",
  },
  {
    id: "web-public",
    year: 1993,
    domain: "infrastructure",
    certainty: "shipped",
    title: "The web becomes public",
    changed: "Finding information stopped requiring you to know where it lived, or to own the right reference book.",
    enabled: "Publishing to a global audience with no printing press, no distributor, and no permission.",
  },
  {
    id: "broadband",
    year: 2000,
    domain: "infrastructure",
    certainty: "shipped",
    title: "Broadband replaces dial-up",
    changed: "The internet stopped being a place you went to and started being a thing that was simply on.",
    enabled: "Media, software delivery, and real-time services that a metered, occupied phone line could never carry.",
  },
  {
    id: "smartphone",
    year: 2007,
    domain: "infrastructure",
    certainty: "shipped",
    title: "The smartphone puts the internet in a pocket",
    changed: "The phone stopped being a phone. Access became continuous rather than a thing you sat down for.",
    enabled: "Location-aware, always-available services, and the first computing most of the world ever owned.",
  },
  {
    id: "cloud",
    year: 2010,
    domain: "infrastructure",
    certainty: "shipped",
    title: "Cloud turns infrastructure into a purchase",
    changed: "Starting something no longer required buying servers or waiting months for a data centre.",
    enabled: "A two-person company renting the same class of infrastructure as a bank, and paying by the hour.",
  },
  {
    id: "llm-assistants",
    year: 2023,
    domain: "infrastructure",
    certainty: "shipped",
    title: "Language models become everyday tools",
    changed: "Drafting, summarizing, translating, and explaining became things you could ask for in ordinary words.",
    enabled: "Software that responds to intent rather than to syntax, for people who never learned the syntax.",
  },

  // -- Commerce ------------------------------------------------------------
  {
    id: "ecommerce",
    year: 1995,
    domain: "commerce",
    certainty: "shipped",
    title: "Buying online becomes possible",
    changed: "A shop stopped needing to be somewhere you could walk to during opening hours.",
    enabled: "Selection beyond what a local shelf could hold, and sellers reaching customers with no shopfront at all.",
  },
  {
    id: "marketplaces",
    year: 2005,
    domain: "commerce",
    certainty: "shipped",
    title: "Marketplaces absorb the long tail",
    changed: "Small sellers reached national customers without building distribution of their own.",
    enabled: "A one-person business with global reach, and a new dependence on the platform that grants it.",
  },
  {
    id: "delivery-platforms",
    year: 2015,
    domain: "commerce",
    certainty: "shipped",
    title: "On-demand delivery becomes ordinary",
    changed: "Meals, rides, and groceries arrived by app, and waiting became a tracked progress bar.",
    enabled: "Convenience at scale, alongside a labour model whose employment status is still being litigated worldwide.",
  },

  // -- Money ---------------------------------------------------------------
  {
    id: "online-banking",
    year: 1999,
    domain: "money",
    certainty: "shipped",
    title: "Banking leaves the branch",
    changed: "Checking a balance or moving money stopped requiring a queue and a counter.",
    enabled: "Financial admin at any hour, and the slow decline of the branch network that had defined retail banking.",
  },
  {
    id: "mobile-payments",
    year: 2014,
    domain: "money",
    certainty: "shipped",
    title: "The phone becomes the wallet",
    changed: "Paying stopped requiring a card, and eventually stopped requiring a wallet at all.",
    enabled: "Payments for people a card network never reached, and merchants with no terminal.",
  },
  {
    id: "pix",
    year: 2020,
    domain: "money",
    certainty: "shipped",
    title: "Brazil launches PIX instant payments",
    changed: "Transfers between any two people or businesses settled in seconds, free for individuals, at any hour.",
    enabled: "A national instant-payment rail built by the central bank rather than by card networks, adopted at a speed that surprised nearly everyone and became a reference case internationally.",
  },

  // -- Work ----------------------------------------------------------------
  {
    id: "remote-capable",
    year: 2005,
    domain: "work",
    certainty: "shipped",
    title: "Work becomes technically portable",
    changed: "Laptops and VPNs made it possible to work away from the office, for those permitted to.",
    enabled: "The technical precondition for remote work, sitting unused for fifteen years because the culture said no.",
  },
  {
    id: "forced-remote",
    year: 2020,
    domain: "work",
    certainty: "shipped",
    title: "Remote work stops being a request",
    changed: "Offices closed and knowledge work moved home in weeks, using capability that had existed for years.",
    enabled: "Hiring detached from geography, and a permanent renegotiation of what an office is actually for. The clearest example that transformation is usually blocked by assumption rather than by technology.",
  },

  // -- Services and the state ---------------------------------------------
  {
    id: "egov",
    year: 2010,
    domain: "state",
    certainty: "shipped",
    title: "Government services move online",
    changed: "Taxes, licences, and records became forms you submit rather than queues you join.",
    enabled: "Service at population scale without proportional staff, and a new class of exclusion for those without access.",
  },
  {
    id: "gdpr",
    year: 2018,
    domain: "state",
    certainty: "inForce",
    title: "GDPR makes data protection enforceable",
    changed: "Consent, access, and erasure became rights with penalties attached rather than policies you hoped for.",
    enabled: "A template copied worldwide, and the first credible answer to 'what happens if they misuse my data'.",
    source: "Regulation (EU) 2016/679, applicable since 25 May 2018.",
  },
  {
    id: "lgpd",
    year: 2020,
    domain: "state",
    certainty: "inForce",
    title: "Brazil's LGPD takes effect",
    changed: "Brazilian residents gained enforceable rights over their personal data, with a national authority behind them.",
    enabled: "Data protection anchored in Brazilian law rather than borrowed from abroad, alongside the Marco Civil's earlier guarantees.",
    source: "Lei 13.709/2018 (LGPD), in force from 2020; ANPD as supervisory authority.",
  },
  {
    id: "ai-act-prohibitions",
    year: 2025,
    domain: "state",
    certainty: "inForce",
    title: "EU AI Act prohibitions apply",
    changed: "Certain AI uses became illegal in the EU outright, with penalties up to 35 million euro or 7% of global turnover.",
    enabled: "The first binding line between AI that may be built and AI that may not, anywhere in the world.",
    source: "Regulation (EU) 2024/1689, prohibitions and AI-literacy obligations applicable 2 February 2025.",
  },
  {
    id: "ai-act-gpai",
    year: 2025,
    domain: "state",
    certainty: "inForce",
    title: "EU obligations for general-purpose AI models begin",
    changed: "Providers of large general-purpose models took on documentation and transparency duties in the EU.",
    enabled: "Regulatory attention on the model itself, not only on the application built from it.",
    source: "Regulation (EU) 2024/1689, GPAI obligations applicable 2 August 2025.",
  },
  {
    id: "ai-act-high-risk",
    year: 2026,
    domain: "state",
    certainty: "contested",
    title: "EU AI Act high-risk obligations",
    changed: "Systems used for recruitment, credit scoring, education, law enforcement and similar face conformity assessment, registration, and human-oversight duties.",
    enabled: "The most operationally demanding tier of AI regulation, and the clearest test of whether the framework is workable.",
    source: "Regulation (EU) 2024/1689, Annex III high-risk obligations scheduled for 2 August 2026.",
    contestedNote:
      "Actively moving. The Digital Omnibus on AI reached provisional trilogue agreement on 7 May 2026 to defer Annex III obligations to 2 December 2027, and product-embedded Annex I obligations to 2 August 2028. That agreement is NOT yet law: until it is formally adopted and published in the Official Journal, 2 August 2026 remains the operative legal date and should be planned for.",
  },

  // -- Media ---------------------------------------------------------------
  {
    id: "streaming",
    year: 2012,
    domain: "media",
    certainty: "shipped",
    title: "Streaming replaces the schedule",
    changed: "Watching stopped being something that happened at a time somebody else chose.",
    enabled: "On-demand everything, the collapse of the broadcast schedule, and eventually the fragmentation of the audience.",
  },
  {
    id: "creator-platforms",
    year: 2018,
    domain: "media",
    certainty: "shipped",
    title: "Distribution stops being the barrier",
    changed: "Anyone could publish to a potential audience of millions with a phone and no gatekeeper.",
    enabled: "New livelihoods and new reach, plus a recommendation layer that now decides what most people see.",
  },

  // -- Health --------------------------------------------------------------
  {
    id: "ehr",
    year: 2014,
    domain: "health",
    certainty: "shipped",
    title: "Medical records go digital",
    changed: "Your history stopped living in a folder in one building.",
    enabled: "Care that follows the patient between providers, and a permanent argument about who may read it.",
  },
  {
    id: "telemedicine",
    year: 2020,
    domain: "health",
    certainty: "shipped",
    title: "Telemedicine becomes normal practice",
    changed: "A consultation stopped requiring travel, a waiting room, and a day off work.",
    enabled: "Access for remote and immobile patients, following regulatory change that had been debated for a decade and moved in weeks.",
  },

  // -- Forecast tier: ALWAYS attributed, never stated as fact ---------------
  {
    id: "agents-in-apps",
    year: 2026,
    domain: "work",
    certainty: "forecast",
    title: "Task-specific AI agents inside enterprise applications",
    changed: "Projected: software that carries out multi-step work rather than waiting to be operated step by step.",
    enabled: "If it holds, routine process work shifts from being performed to being supervised.",
    source:
      "Gartner projects 40% of enterprise applications will integrate task-specific AI agents by the end of 2026, up from under 5% in 2025. Gartner also projects that over 40% of agentic AI projects could be abandoned by 2027 on governance and return-on-investment failures. Field surveys in 2026 report high adoption but only around one in ten deployments running in production.",
  },
  {
    id: "agents-in-ops",
    year: 2029,
    domain: "infrastructure",
    certainty: "forecast",
    title: "Agentic operations in IT infrastructure",
    changed: "Projected: infrastructure changes proposed and executed by software under human policy rather than human hands.",
    enabled: "If it holds, operations work moves toward defining guardrails and reviewing decisions instead of making changes.",
    source:
      "Gartner (Predicts 2026: AI Agents Will Transform IT Infrastructure and Operations, published 4 December 2025) projects adoption rising from under 5% in 2025 toward a majority by 2029, and human-in-the-loop involvement in IT operations workflows falling from 95% in 2025 to 40% by 2028.",
  },
  {
    id: "agent-mediated-buying",
    year: 2028,
    domain: "commerce",
    certainty: "forecast",
    title: "Agent-intermediated business purchasing",
    changed: "Projected: software evaluating vendors, comparing terms, and transacting on a company's behalf.",
    enabled: "If it holds, procurement cycles compress from weeks to hours, and vendor discovery stops being a human activity.",
    source:
      "Gartner projects that by 2028, 90% of business-to-business buying will be intermediated by AI agents, routing over 15 trillion US dollars of spend through agent exchanges.",
  },
  {
    id: "physical-agent-data",
    year: 2029,
    domain: "infrastructure",
    certainty: "forecast",
    title: "Agents generating more data from the physical world than from the digital one",
    changed: "Projected: robots, vehicles, and sensors producing trajectory data at a scale that dwarfs today's digital telemetry.",
    enabled: "If it holds, the data-protection and networking problems of the next decade are physical rather than web-shaped.",
    source:
      "Gartner data and analytics predictions (announced 11 March 2026) project that by 2029, AI agents will generate ten times more data from physical environments than all digital AI applications combined.",
  },
  {
    id: "ai-act-annex1",
    year: 2027,
    domain: "state",
    certainty: "scheduled",
    title: "EU rules for AI embedded in regulated products",
    changed: "AI inside medical devices, machinery, vehicles and similar regulated products comes under the AI Act's high-risk regime.",
    enabled: "Regulatory coverage of AI that arrives inside a physical product rather than as software you choose to install.",
    source:
      "Regulation (EU) 2024/1689, Annex I obligations scheduled for 2 August 2027; the provisionally-agreed Digital Omnibus would move this to 2 August 2028 if adopted.",
  },
];

/** Every domain, in the order the UI should present them. */
export const DOMAINS: Domain[] = [
  "infrastructure",
  "commerce",
  "money",
  "work",
  "state",
  "media",
  "health",
];

/** Every certainty tier, ordered from most to least certain. */
export const CERTAINTIES: Certainty[] = [
  "shipped",
  "inForce",
  "scheduled",
  "contested",
  "forecast",
];
