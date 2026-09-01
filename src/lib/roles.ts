// ============================================================================
// src/lib/roles.ts
// ----------------------------------------------------------------------------
// THE ROLES — the corpus about the positions the industry is made of.
//
// Ratified by PRIME 2026-08-14. Name: "The Roles". Lives at /roles/, a sibling
// of /practice/, with its card in /learn/ immediately after The Practice.
//
// WHAT SEPARATES THIS FROM THE PRACTICE. The Practice is VERBS: how the work is
// done — triage, escalation, evidence, handover. This is NOUNS: what a position
// IS. Who it receives from, who it serves, what it answers for, what it is
// measured on. A reader arrives at The Practice holding a question about an
// activity, and arrives here holding a question about a job.
//
// The two are wired together: every role here lists the practice articles
// already tagged with its role, so this corpus is a door into work already
// published.
//
// *** THE SPINE IS THE PATH A PRODUCT TAKES ***
//
//   made -> moved -> sold -> deployed -> run -> supported -> defended -> taught
//
// The order is a fact about the industry rather than a preference, which is the
// property that makes a taxonomy maintainable: a new role arrives and the path
// says where it belongs. The Practice earned the same property by following the
// life of a system, and the reasoning is recorded there.
//
// A title that appears at several points on the path earns several entries,
// because a solutions architect at a vendor sells, at an integrator delivers,
// and at an end customer decides. Same words, three jobs.
//
// *** PROVENANCE IS A CITATION, NOT A BADGE (PRIME 2026-08-14) ***
//
// A badge says trust me. A citation says check me. So `held` and `alongside`
// both REQUIRE where and when, and `documented` REQUIRES sources. The guard
// rejects a bare marker.
//
//   "Held this role" is a claim.
//   "Held this role — in distribution, 2015-2019" is a fact a reader can weigh.
//
// The mechanism matches the one the vendor entries use for sourceNote: state
// the provenance in the artefact and let the reader judge it.
//
// EDITORIAL. R-2 applies with force here: every field states what the role IS.
// The section that would traditionally be called "misconceptions" is called
// "What the job turns on", and it says the true thing directly.
// ============================================================================

/** The eight groups, in the order a product passes through them. */
export type RoleGroup =
  | "makes"
  | "moves"
  | "sells"
  | "deploys"
  | "runs"
  | "supports"
  | "defends"
  | "teaches";

export const ROLE_GROUPS: readonly RoleGroup[] = [
  "makes",
  "moves",
  "sells",
  "deploys",
  "runs",
  "supports",
  "defends",
  "teaches",
] as const;

/** Where the account of a role comes from. */
export type Provenance = "held" | "alongside" | "documented";

export interface RoleProvenance {
  kind: Provenance;
  /** Required for held and alongside: the rung, in plain words. */
  where?: string;
  /** Required for held and alongside: the years. */
  when?: string;
  /** Required for documented: where the description comes from. */
  /**
   * Where the description comes from. `sourceNote` carries what the citation
   * alone leaves out — most usefully, that a role HAS no professional body and
   * the sources are therefore industry rather than institutional. That absence
   * is informative about the role, so the page renders it rather than keeping
   * it in the data where only a maintainer would see it.
   */
  sources?: { label: string; url: string; sourceNote?: string }[];
}

export interface Role {
  slug: string;
  title: string;
  group: RoleGroup;
  /** Order within the group. */
  order: number;
  provenance: RoleProvenance;
  /** One paragraph, plain words. */
  whatItIs: string;
  /** The tasks, concretely. */
  theDay: string[];
  /** What the role answers for. */
  accountableFor: string[];
  /**
   * What the role is measured on. Kept separate from accountability on
   * purpose: the two lists differ, and the distance between them is where the
   * difficulty of a job lives.
   */
  measuredOn: string[];
  /** Who hands work to this role. */
  receivesFrom: { who: string; what: string }[];
  /** Who this role hands work to. */
  serves: { who: string; what: string }[];
  /** Everyone else with an interest in the outcome. */
  stakeholders: string[];
  /** What the job asks of a person, including the parts rarely advertised. */
  requirements: string[];
  /** The one argument the page makes. */
  turnsOn: string;
  /** Roles it commonly leads to, and arrives from. */
  adjacentRoles: string[];
  /** Practice role tags whose articles belong to this job. */
  practiceRoles: string[];
  /**
   * CHOSEN practice articles, by slug.
   *
   * *** PART I OF THE ENRICHMENT ROUND (2026-08-15) ***
   *
   * The tags above are five coarse values, and `second-line` alone matches most
   * of a 64-article corpus — so deriving the list from tags gave two very
   * different roles nearly the same reading. Selection replaces filtering:
   * these are the articles that belong to THIS job. Where the field is absent
   * the page falls back to the tag filter, so a new role is useful before it is
   * curated. check-role-links verifies every slug exists.
   */
  practiceArticles?: string[];
  /** Tool slugs this role genuinely uses. */
  relatedTools: string[];
  updated: string;
}

export const ROLES: readonly Role[] = Object.freeze([
  // --- SELLS ---------------------------------------------------------------
  {
    slug: "systems-engineer",
    title: "Systems engineer",
    group: "sells",
    order: 1,
    provenance: { kind: "held", where: "at two vendors, the second on a carrier account", when: "2004-2005, 2009-2010" },
    whatItIs:
      "The technical half of a vendor sales team. A systems engineer owns whether the proposed thing will work, while the account manager owns whether it will be bought. The pairing is deliberate and the split is clean: one person carries the commercial relationship and the other carries the technical truth, and both answer for the same deal.",
    theDay: [
      "Qualifying an opportunity technically: what the customer runs today, what they are trying to reach, and whether the product genuinely gets them there.",
      "Designing the proposed solution and writing it down in a form the customer's engineers will accept and the customer's finance will approve.",
      "Running a proof of concept in the customer's environment, against the customer's traffic, with the customer's people watching.",
      "Answering a request for proposal, which is a written examination with a commercial consequence.",
      "Briefing the account manager on what the technology will and will genuinely do, so that the commercial promise matches the engineering one.",
    ],
    accountableFor: [
      "The technical accuracy of everything proposed under the account manager's name.",
      "The design surviving contact with the customer's environment.",
      "The proof of concept demonstrating the thing it claimed to demonstrate.",
    ],
    measuredOn: [
      "Revenue on the account, shared with the account manager.",
      "Opportunities advanced through the technical stages of the pipeline.",
      "Proof-of-concept outcomes, and increasingly customer satisfaction after the sale.",
    ],
    receivesFrom: [
      { who: "The account manager", what: "The opportunity, the commercial shape, and the deadline." },
      { who: "Product management", what: "Roadmap, positioning, and the honest limits of the current release." },
      { who: "The customer's engineers", what: "The environment as it actually is, which frequently differs from the environment as documented." },
    ],
    serves: [
      { who: "The customer's technical staff", what: "A design they can operate, and answers they can verify." },
      { who: "The account manager", what: "Technical confidence the commercial position can stand on." },
      { who: "Professional services", what: "A design that survives implementation, and a handover that says what was promised." },
    ],
    stakeholders: [
      "The customer's procurement and finance functions, whose questions are commercial and whose answers depend on technical facts.",
      "The channel partner, when the deal transacts through one.",
      "The vendor's support organisation, which inherits whatever the design turns out to be.",
    ],
    requirements: [
      "Depth in the product, and enough breadth in everything around it to be credible about the whole system.",
      "Writing that a stranger can act on, because the design outlives the conversation that produced it.",
      "The judgement to say when the product fits the problem, which protects the account far more than an eager answer does.",
      "Comfort presenting to a room where some people want the project and some people want it to fail.",
    ],
    turnsOn:
      "The role answers for accuracy and is measured on revenue, and those two lists point the same way only while the truth is favourable. The systems engineers who last are the ones who say early and plainly when the product fits the problem partially, because a deal won on an overstated fit becomes a support case, then a renewal risk, then a reference the vendor stops offering. The honest answer is the commercially durable one, and it is worth having that clear before the pressure arrives rather than during it.",
    adjacentRoles: ["network-consulting-engineer", "channel-systems-engineer", "technical-instructor"],
    practiceRoles: ["design", "field"],
    practiceArticles: ["what-vendor-support-can-and-cannot-do", "assumptions-a-design-never-states", "reading-a-design-you-did-not-write"],
    relatedTools: ["network-os-comparer", "f5-lb-method-chooser", "oauth-flow-chooser", "zscaler-tunnel-chooser"],
    updated: "2026-08-14",
  },

  // --- MOVES ---------------------------------------------------------------
  {
    slug: "channel-systems-engineer",
    title: "Channel systems engineer",
    group: "moves",
    order: 1,
    provenance: { kind: "held", where: "in distribution, at two distributors", when: "2015-2019" },
    whatItIs:
      "A systems engineer whose customers are other engineers. Distribution sits between the vendor and the reseller, and the channel systems engineer is the technical face of that layer: enabling the partner's engineers, sizing and configuring what the partner will sell, and holding the first line of technical help for a whole population of resellers rather than for one end customer. The role is also the technical arm a reseller borrows — running the proof of concept and the proof of value on the partner's behalf — and the channel through which a partner's technical questions reach the vendor and come back answered.",
    theDay: [
      "Sizing and configuring a bill of materials for a partner's opportunity, frequently for an end customer nobody in the room has met.",
      "Enabling partner engineers: workshops, demonstrations, and the answering of the same foundational question for a dozen different companies.",
      "Enabling partner SALESPEOPLE, which is separate work with a separate vocabulary: what the product is for, which conversation opens the door, and which technical detail belongs in a first meeting.",
      "Running the proof of concept — PoC, showing the thing works — and the proof of value — PoV, showing the thing is worth what it costs — as the partner's technical arm, in front of the partner's customer.",
      "Making the technical case for a product to engineers who already run something that works and have reasons to keep it, which is persuasion resting on evidence rather than on enthusiasm.",
      "Brokering between the partner and the vendor on technical matters, so that a question asked in one company's vocabulary arrives in the other's and returns in a form the asker can use.",
      "Standing in for the vendor's systems engineer where the deal is too small for the vendor to staff, which is most deals.",
      "Building the demonstration and lab environments a partner borrows rather than buys.",
      "Carrying vendor programme requirements into partners: certifications to hold, thresholds to reach, accreditations to renew.",
    ],
    accountableFor: [
      "Configurations that are correct, licensable and orderable as quoted.",
      "The technical capability of the partner base, which is a slower thing to move than a quarter.",
      "Escalating cleanly to the vendor when a question genuinely exceeds distribution's remit.",
      "Proofs of concept and value that demonstrate what they claim, carrying the partner's name as well as distribution's.",
    ],
    measuredOn: [
      "Revenue through the partner base, and its growth against the same period last year.",
      "Partner certifications and accreditations achieved.",
      "Attach rates on services and renewals, which are distribution's margin rather than the vendor's.",
    ],
    receivesFrom: [
      { who: "The vendor", what: "Product knowledge, programme rules, pricing structures and the current campaign." },
      { who: "Partner sales", what: "Opportunities described at whatever level of detail the partner happens to have." },
      { who: "Distribution's own sales team", what: "Commercial priorities, stock positions and the accounts that matter this quarter." },
    ],
    serves: [
      { who: "Partner engineers", what: "Capability: the ability to design and support the product themselves." },
      { who: "Partner sales", what: "A quotable, buildable configuration, the technical confidence to propose it, and enablement pitched at a seller rather than at an engineer." },
      { who: "The partner's customer", what: "A proof of concept and a proof of value, delivered under the partner's name." },
      { who: "The vendor", what: "Reach into a market too fragmented to serve directly." },
    ],
    stakeholders: [
      "The end customer, who is served by the partner and rarely learns that distribution was involved.",
      "The vendor's channel account managers, whose programme targets depend on partner capability.",
      "Distribution's credit and logistics functions, for whom a technical error becomes a returned shipment.",
    ],
    requirements: [
      "Breadth across a portfolio rather than depth in one product, because the partner base sells everything on the line card.",
      "Teaching as a daily skill, since capability transfer is the actual output.",
      "Patience with repetition, and the discipline to answer the tenth identical question as carefully as the first.",
      "Commercial literacy: part numbers, licensing metrics, programme tiers and the arithmetic of margin.",
      "Two registers, held separately: the one that persuades an engineer and the one that equips a salesperson.",
      "Standing in front of a partner's customer under the partner's name, with the partner's reputation attached to the answer.",
    ],
    turnsOn:
      "The output is capability in other companies, and capability is slow, cumulative and hard to attribute. A partner engineer who becomes self-sufficient stops calling, which reads in the numbers as reduced engagement and reads in reality as the job done. The same shape governs the brokering: a question carried accurately between a partner and a vendor leaves both sides believing they simply understood each other. Holding that line — investing in partners who will need less help next year — is the whole discipline of the role, and it asks for a manager who understands the same thing.",
    adjacentRoles: ["systems-engineer", "technical-instructor", "network-consulting-engineer"],
    practiceRoles: ["field", "design"],
    practiceArticles: ["what-vendor-support-can-and-cannot-do", "opening-a-vendor-case", "handover-project-to-operation"],
    relatedTools: ["network-os-comparer", "f5-lb-method-chooser", "zscaler-tunnel-chooser", "voss-exos-translator"],
    updated: "2026-08-14",
  },

  // --- DEPLOYS -------------------------------------------------------------
  {
    slug: "network-consulting-engineer",
    title: "Network consulting engineer",
    group: "deploys",
    order: 1,
    provenance: { kind: "held", where: "at integrators, and in 2008 and 2012 through my own company", when: "2008, 2010-2011, 2012, 2013-2014, 2020" },
    whatItIs:
      "The engineer who turns a design into a working thing inside somebody else's network. Consulting engineers arrive after the sale and before the operations team, and they carry the technical responsibility for the transition: planning it, doing it, proving it, and handing over an environment the customer's own staff can run.",
    theDay: [
      "Auditing the environment as it stands, which is the work that makes every later step honest.",
      "Reading an environment that is documented partially and understanding it fully enough to change it safely.",
      "Migrating services off equipment that is leaving, with the business running throughout.",
      "Improving what the audit surfaced, separately from what the project was sold to do, and saying which is which.",
      "Documenting the result to a standard the customer's own staff can maintain.",
      "Training the customer's operations team and the reseller's engineers on what was built.",
      "Writing the method of procedure: the ordered steps, the verification after each, and the way back.",
      "Executing a change inside a maintenance window that ends whether or not the work does.",
      "Proving the outcome with evidence the customer accepts, rather than with an assurance.",
      "Handing over: documentation, a walkthrough, and the knowledge transfer that decides whether the customer calls again next month.",
    ],
    accountableFor: [
      "The change working, and the environment being restorable when it does otherwise.",
      "The evidence that the work met what was sold.",
      "A handover that leaves the customer's team able to operate what was built.",
      "The written record of the environment, before and after, being true.",
    ],
    measuredOn: [
      "Utilisation: the proportion of time booked to a paying project.",
      "Delivery against the statement of work, in scope and in hours.",
      "Customer satisfaction, and the follow-on work that satisfaction produces.",
    ],
    receivesFrom: [
      { who: "Pre-sales", what: "The design, the statement of work, and whatever was promised in the room." },
      { who: "The customer's team", what: "Access, change windows, and the environment's real history." },
      { who: "The vendor", what: "Support cases, escalation and firmware when the product misbehaves." },
    ],
    serves: [
      { who: "The customer's operations team", what: "A working environment and the ability to run it." },
      { who: "The project manager", what: "Progress that is true, including the parts that are behind." },
      { who: "The account team", what: "A delivery good enough to sell the next one." },
    ],
    stakeholders: [
      "The customer's business, which experiences the change as availability rather than as engineering.",
      "The customer's security and compliance functions, whose approval the change frequently requires.",
      "The vendor, whose product is judged by how this deployment behaves.",
    ],
    requirements: [
      "Technical depth combined with the discipline to work inside someone else's rules.",
      "Writing under time pressure, because the method of procedure is written before the window and read during it.",
      "Composure at three in the morning, when the window is closing and the verification step has failed.",
      "The social skill to be the outsider in a room of people who built the thing you are changing.",
    ],
    turnsOn:
      "The statement of work says deployment, and the job is an audit, a migration, an improvement, a document and a training course delivered around it. Utilisation measures hours booked, and the work that decides whether a project succeeds happens in the hours that are hard to book: reading the environment properly, writing the rollback, sitting with the customer's engineer until they can do it themselves. Consulting engineers who protect that time deliver projects that stay delivered, and the conversation with whoever owns the utilisation target is part of the job rather than an interruption to it.",
    adjacentRoles: ["systems-engineer", "field-network-engineer", "technical-instructor", "network-operations-specialist"],
    practiceRoles: ["field", "design", "second-line"],
    practiceArticles: ["change-windows-and-rollback-arithmetic", "handover-project-to-operation", "reading-a-design-you-did-not-write", "the-runbook-nobody-can-follow", "documenting-for-the-inheritor", "designing-for-three-in-the-morning"],
    relatedTools: ["change-window-runbook-builder", "change-blast-radius-mapper", "fortios-cli-config-explainer", "f5os-tenant-config-explainer", "cidr"],
    updated: "2026-08-14",
  },

  // --- SUPPORTS ------------------------------------------------------------
  {
    slug: "field-network-engineer",
    title: "Field network engineer",
    group: "supports",
    order: 1,
    provenance: { kind: "held", where: "at vendors, in the field", when: "1996-2000, 2005-2007" },
    whatItIs:
      "The vendor engineer who goes to where the equipment is. Field engineers install, commission, troubleshoot and repair in the customer's building, on the customer's schedule, with whatever the site turns out to contain. The role sits between support and services: it carries the vendor's name into the room and answers for the product in front of the people who bought it.",
    theDay: [
      "Installing and commissioning equipment, which begins with discovering how the site differs from the plan.",
      "Diagnosing a fault with the customer watching, using the evidence available on site.",
      "Replacing hardware and proving the replacement resolved the thing it was sent for.",
      "Auditing what is already installed, because the site is frequently the only accurate record of itself.",
      "Migrating a customer from equipment that works to equipment that works better, inside a window that ends on time.",
      "Improving what was found: the configuration that predates the current design, the thing everyone has learned to live with.",
      "Writing the environment down, so the next engineer arrives informed rather than exploring.",
      "Training the customer's operations staff on what was built, in the room, on their own equipment.",
      "Capturing what happened in a form the support organisation can act on later.",
      "Explaining to the customer's staff what occurred, in terms they can repeat to their own management.",
    ],
    accountableFor: [
      "The equipment working when the visit ends.",
      "The evidence trail: what was found, what was changed, and what remains open.",
      "Representing the vendor accurately, including about the parts still under investigation.",
      "Leaving the customer's own engineers able to operate and troubleshoot what was installed.",
    ],
    measuredOn: [
      "Time to restore, and visits closed on the first attempt.",
      "Customer satisfaction recorded after the visit.",
      "Utilisation and travel efficiency, which are a scheduling function rather than an engineering one.",
    ],
    receivesFrom: [
      { who: "The support organisation", what: "The case, its history, and the reason a person is being sent." },
      { who: "Logistics", what: "Parts, which arrive on their own schedule." },
      { who: "The customer", what: "Access, escort, and the account of what happened that they were able to observe." },
    ],
    serves: [
      { who: "The customer's engineers", what: "A working system and an explanation they can use." },
      { who: "The support organisation", what: "Ground truth that a remote case cannot produce." },
      { who: "Engineering", what: "Field evidence of how the product behaves outside a laboratory." },
    ],
    stakeholders: [
      "The account team, for whom every visit is a reference in progress.",
      "The customer's management, who experience the fault as downtime.",
      "Product engineering, for whom recurring field findings are a defect signal.",
    ],
    requirements: [
      "Hands and head together: the role is diagnostic and physical in the same hour.",
      "Working alone with authority, since the decision on site is made on site.",
      "Tolerance for travel, and for the schedule that travel imposes on a life.",
      "The composure to be the visible face of a product that is currently failing.",
      "Teaching as a routine part of the visit, because the people who will live with the system learn it from whoever installed it.",
    ],
    turnsOn:
      "The dispatch is written as an installation or a fault, and the visit is an audit, a migration, an improvement, a piece of documentation and a training session wrapped around it. The measurement is time to restore, and the lasting value is the record left behind. A visit that fixes the symptom and captures the evidence turns one customer's fault into a defect the vendor can address for everybody; a visit that fixes the symptom alone leaves the same engineer travelling to the same problem at a different address next quarter. The engineers who understand this write their notes as though a stranger will read them, because one will.",
    adjacentRoles: ["product-support-engineer", "network-consulting-engineer", "high-touch-operations-manager"],
    practiceRoles: ["field", "second-line", "first-line", "design"],
    practiceArticles: ["field-work", "capture-before-you-change", "rma-and-the-dead-box", "documenting-for-the-inheritor", "cannot-touch-it"],
    relatedTools: ["terminal-stack-explainer", "cable-run-planner", "oui-lookup", "packet-capture-plan-builder"],
    updated: "2026-08-14",
  },
  {
    slug: "product-support-engineer",
    title: "Product support engineer",
    group: "supports",
    order: 2,
    provenance: { kind: "held", where: "at a vendor, in California", when: "2000-2002" },
    whatItIs:
      "Third-line support: the escalation layer between the technical assistance centre and the people who write the firmware. A case reaches this role once the second line has taken it as far as the product's documented behaviour allows, and it leaves either resolved or as a defect with a reproduction attached. The role is the boundary between the organisation that runs a product and the organisation that makes it.",
    theDay: [
      "Taking an escalation from the second line, which arrives with a history and a customer who has already waited.",
      "Reproducing the fault in a laboratory, which is the hardest part of the day and the most persuasive thing the role produces.",
      "Reading code, or reading close enough to it — release notes, defect records, debug output — to form a hypothesis a developer will recognise.",
      "Deciding what genuinely belongs to engineering, which is the gate this role exists to hold.",
      "Building the case file that a developer can act on without repeating the investigation.",
      "Feeding the resolution back down as a workaround, a knowledge article and an explanation the second line can use next time.",
    ],
    accountableFor: [
      "A reproduction, or a decisive elimination, rather than a plausible narrative.",
      "The defect report standing on its own once it reaches a developer.",
      "The second line becoming able to resolve the next occurrence without escalating it.",
    ],
    measuredOn: [
      "Escalations resolved within third line, against those passed to engineering.",
      "Time to resolution on cases that reached this tier, where the clock has already been running.",
      "Defect reports accepted by engineering rather than returned for more evidence.",
    ],
    receivesFrom: [
      { who: "The technical assistance centre", what: "The escalated case, its history, and everything already tried." },
      { who: "The customer", what: "Captures, configurations, core files and access to reproduce." },
      { who: "Engineering", what: "Defect status, source-level explanations and the release that will carry a fix." },
    ],
    serves: [
      { who: "The second line", what: "Resolutions, workarounds and the reasoning that reduces the next escalation." },
      { who: "Engineering", what: "A reproducible defect rather than a customer report, which is the difference between a fix and a conversation." },
      { who: "The customer's engineers", what: "An answer with enough mechanism attached to be trusted." },
    ],
    stakeholders: [
      "Every customer running the release, since a defect confirmed here becomes a fix for all of them.",
      "The account team, for whom a critical case at this tier is a commercial fact.",
      "Product management, for whom escalation patterns are roadmap evidence.",
    ],
    requirements: [
      "Reading evidence closely while holding a hypothesis loosely.",
      "Enough fluency in how the product is built to talk to a developer in their own terms.",
      "The discipline to reproduce rather than to assume, especially when the assumption is probably right.",
      "The judgement to hold the gate: deciding what deserves a developer's attention, and defending both answers.",
      "Written English precise enough to survive a handover across time zones and job functions.",
    ],
    turnsOn:
      "This tier is a gate, and holding it well runs in two directions at once. A case passed upward that a careful hour would have resolved spends developer time the whole customer base is waiting on; a genuine defect held down here becomes a customer living with a workaround for a release cycle. The engineers who thrive here are the ones who make that call quickly and then write the case up so completely that whichever way it went, nobody has to relitigate it.",
    adjacentRoles: ["technical-assistance-centre-engineer", "network-software-engineer", "field-network-engineer", "high-touch-operations-manager"],
    practiceRoles: ["second-line"],
    practiceArticles: ["reproducing-the-irreproducible", "escalation-as-a-skill", "building-an-evidence-pack", "proving-the-vendor-wrong", "feeding-the-fix-back", "two-problems", "workaround-and-fix"],
    relatedTools: ["f5-eth-trailer-decoder", "fortios-flow-debug-builder", "tac-escalation-packet-builder", "incident-timeline-rca-builder"],
    updated: "2026-08-14",
  },
  {
    slug: "high-touch-operations-manager",
    title: "High-touch operations manager",
    group: "supports",
    order: 3,
    provenance: { kind: "held", where: "at a vendor, on national infrastructure accounts", when: "2003-2004" },
    whatItIs:
      "A named vendor engineer assigned to one large customer, holding their support relationship end to end. Where standard support answers whoever calls, a high-touch role knows the customer's environment, their change calendar and their people, and carries their cases through the vendor's organisation personally. The arrangement exists for customers whose outage is a public event.",
    theDay: [
      "Holding the customer's open cases and knowing each one's actual state rather than its recorded state.",
      "Convening the vendor's specialists on a fault that crosses several product areas.",
      "Reviewing planned changes before they happen, which prevents more cases than any diagnostic skill.",
      "Reporting to the customer's management in terms that connect engineering activity to service outcomes.",
      "Carrying the customer's defect and feature positions into the vendor, with the weight the account justifies.",
    ],
    accountableFor: [
      "The customer's support experience as a whole, across every case and every product line.",
      "Escalations reaching the right people at the right severity, early.",
      "The accuracy of what the customer's management is told.",
    ],
    measuredOn: [
      "Availability and incident outcomes on the account.",
      "Case ageing and escalation counts.",
      "Renewal of the support contract, and the account's willingness to act as a reference.",
    ],
    receivesFrom: [
      { who: "Support and engineering", what: "Case progress, defect status and release plans." },
      { who: "The customer", what: "Change calendars, architecture decisions and early warning of pressure." },
      { who: "The account team", what: "Commercial context that shapes what is possible." },
    ],
    serves: [
      { who: "The customer's operations and management", what: "One person who knows the whole picture." },
      { who: "The vendor's support organisation", what: "Context that turns a generic case into a specific one." },
      { who: "Product management", what: "A large customer's requirements, evidenced." },
    ],
    stakeholders: [
      "The public, when the customer operates national infrastructure and the outage is felt outside the building.",
      "The vendor's executive sponsors of the account.",
      "Every engineer inside the vendor whose queue this role reaches into.",
    ],
    requirements: [
      "Technical credibility across a portfolio, sufficient to convene specialists and follow them.",
      "Organisational navigation: knowing who inside the vendor can actually move a thing.",
      "Communication calibrated to the audience, from packet detail to a board summary in the same day.",
      "The steadiness to hold a relationship through an incident and remain trusted afterwards.",
    ],
    turnsOn:
      "The visible work is incident response and the durable work is prevention, which produces quiet. A high-touch engagement that succeeds shows fewer escalations, calmer reviews and a customer who stops needing to phone — and every one of those reads as reduced activity. Making the prevented incident visible, in the reporting and in the review, is what keeps the arrangement funded and is as much part of the role as the diagnosis.",
    adjacentRoles: ["product-support-engineer", "field-network-engineer", "systems-engineer"],
    practiceRoles: ["second-line", "management", "field"],
    practiceArticles: ["communicating-upward-while-live", "running-a-war-room", "prevention-that-survives-the-budget", "the-customer-who-is-furious-and-correct", "judgment-at-hour-eleven"],
    relatedTools: ["health-snapshot-comparator", "incident-timeline-rca-builder", "change-blast-radius-mapper"],
    updated: "2026-08-14",
  },


  {
    slug: "security-architect",
    title: "Security architect",
    group: "defends",
    order: 10,
    provenance: {
      kind: "documented",
      sources: [
        { label: "NICCS, CISA - the NICE Workforce Framework for Cybersecurity, which defines the work roles, tasks and skills used across public, private and academic sectors", url: "https://niccs.cisa.gov/workforce-development/nice-framework" },
        { label: "NIST SP 800-53 Rev. 5 - the control catalogue that security architecture and policy work is written against in practice", url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final" },
      ],
    },
    whatItIs:
      "The person who decides how a system will be defended before it exists. An architect works in drawings and decisions rather than in configuration: which trust boundaries the design has, what each one is enforced by, what happens when a component is compromised, and which controls are load-bearing rather than decorative. The output is a design somebody else builds, and a set of arguments for why it is shaped that way.",
    theDay: [
      "Reading a proposed design and finding the boundary that is assumed rather than enforced.",
      "Choosing between controls that overlap, and saying which one the design depends on when both are present.",
      "Writing the pattern down so that ten teams solve the problem the same way rather than ten ways.",
      "Sitting in a review where the honest answer is that the risk is acceptable, and recording why.",
      "Revisiting a decision made two years ago against a threat that did not exist then.",
    ],
    accountableFor: [
      "A design whose failure modes were considered before it was built.",
      "Control choices that are justified against a stated threat rather than a product feature.",
      "Patterns that the teams building them can actually implement.",
    ],
    measuredOn: [
      "Designs that survive their first real incident without a redesign.",
      "Adoption of the patterns, which is the only proof they were usable.",
      "Exceptions requested, which measures whether the architecture fits the organisation it serves.",
    ],
    receivesFrom: [
      { who: "The business", what: "What is being built, and the deadline it is being built against." },
      { who: "Risk and compliance", what: "The obligations the design has to satisfy, and their real deadlines." },
      { who: "Engineering", what: "What is actually deployable here, as distinct from what is theoretically correct." },
    ],
    serves: [
      { who: "Security engineers", what: "A design specific enough to build without guessing." },
      { who: "Network and platform teams", what: "Boundaries and requirements they can implement in their own systems." },
      { who: "Auditors", what: "A written rationale that answers why, not only what." },
    ],
    stakeholders: [
      "The teams who will operate the result long after the architect has moved to the next design.",
      "Procurement, whose purchase is constrained by an architectural decision they did not attend.",
      "Whoever inherits the exception register, which is the true record of where the architecture bent.",
    ],
    requirements: [
      "Enough depth in networks, identity and platforms to be wrong in front of specialists and recover.",
      "The judgement to accept a risk deliberately rather than escalating everything.",
      "Writing. An architecture that exists only in conversation is not an architecture.",
      "Tolerance for being overruled commercially, and the discipline to record the decision anyway.",
    ],
    turnsOn:
      "The architect is accountable for decisions made before anyone can prove them wrong. That is the whole difficulty: the work is judged years later, by an incident, against a threat model written when the budget was set.",
    adjacentRoles: ["security-engineer", "network-security-engineer", "security-leader", "network-consulting-engineer"],
    practiceRoles: ["second-line"],
    relatedTools: [],
    updated: "2026-08-31",
  },
  {
    slug: "security-engineer",
    title: "Security engineer",
    group: "defends",
    order: 11,
    provenance: {
      kind: "documented",
      sources: [
        { label: "NICCS, CISA - the NICE Workforce Framework for Cybersecurity, which defines the work roles, tasks and skills used across public, private and academic sectors", url: "https://niccs.cisa.gov/workforce-development/nice-framework" },
        { label: "NIST Cybersecurity Framework - the Govern, Identify, Protect, Detect, Respond and Recover functions that most security programmes are organised against", url: "https://www.nist.gov/cyberframework" },
      ],
    },
    whatItIs:
      "The person who builds and runs the controls. Where the architect decides that traffic between two zones must be authenticated and inspected, the engineer is the one who makes that true in a specific product, on a specific night, without breaking the applications that were already working. This is the role that turns a security decision into a running system, and then owns it.",
    theDay: [
      "Implementing a control in the platform that actually exists, rather than the one the design assumed.",
      "Tuning it afterwards, because the first configuration is always either too permissive or in the way.",
      "Automating the deployment so the twentieth instance matches the first.",
      "Being the person the application team argues with when the control blocks something legitimate.",
      "Patching, upgrading and certificate renewal - the unglamorous work that decides whether the control is still real.",
    ],
    accountableFor: [
      "Controls that are deployed, functioning and monitored rather than merely purchased.",
      "Changes that do not take production down in the name of securing it.",
      "Knowing which controls are currently degraded, before someone else finds out.",
    ],
    measuredOn: [
      "Coverage: how much of the estate the control actually reaches.",
      "False positives, which is the number that decides whether the control survives its first month.",
      "Time to deploy a change, since a control nobody can modify safely becomes a control nobody modifies.",
    ],
    receivesFrom: [
      { who: "Security architecture", what: "The design and the requirement it satisfies." },
      { who: "The security operations centre", what: "What is not being detected, and what is drowning them." },
      { who: "Vendors", what: "Products, and roadmaps that arrive later than promised." },
    ],
    serves: [
      { who: "The security operations centre", what: "Telemetry that is complete enough to detect with." },
      { who: "Application and infrastructure teams", what: "Controls that let them ship, rather than a queue." },
      { who: "Incident responders", what: "The ability to contain, which depends on what was built beforehand." },
    ],
    stakeholders: [
      "Every team whose traffic passes through something this role configured.",
      "The service desk, whose ticket volume moves with each tuning decision.",
      "Finance, since licence consumption is a consequence of engineering choices.",
    ],
    requirements: [
      "Real depth in at least one platform, and enough in the neighbouring ones to integrate them.",
      "Change discipline, because this role breaks production in a uniquely embarrassing way.",
      "The patience to tune rather than to disable.",
      "Scripting, since consistency at scale is not achieved by hand.",
    ],
    turnsOn:
      "A control that is deployed but untuned is worse than no control: it produces noise that trains everyone to ignore it, and it is counted as coverage by whoever reports upward.",
    adjacentRoles: ["security-architect", "network-security-engineer", "security-operations-analyst", "network-operations-specialist"],
    practiceRoles: ["second-line"],
    relatedTools: [],
    updated: "2026-08-31",
  },
  {
    slug: "network-security-engineer",
    title: "Network security engineer",
    group: "defends",
    order: 12,
    provenance: {
      kind: "documented",
      sources: [
        { label: "NICCS, CISA - the NICE Workforce Framework for Cybersecurity, which defines the work roles, tasks and skills used across public, private and academic sectors", url: "https://niccs.cisa.gov/workforce-development/nice-framework" },
        { label: "NIST Cybersecurity Framework - the Govern, Identify, Protect, Detect, Respond and Recover functions that most security programmes are organised against", url: "https://www.nist.gov/cyberframework" },
      ],
    },
    whatItIs:
      "The role where the two disciplines on this site meet. A network security engineer owns the controls that live in the traffic path - firewalls, segmentation, remote access, inspection, and increasingly the provider edge - and is accountable to two constituencies whose definitions of success differ: the network must stay up and the boundary must hold. Most organisations discover they need this role when a security decision takes an application down.",
    theDay: [
      "Writing and pruning policy on the devices that stand between one part of the estate and another.",
      "Proving whether a reported problem is the network, the control, or the application, which is three teams and one packet capture.",
      "Segmenting something that was flat, one segment at a time, without an outage.",
      "Maintaining remote access for people whose work stops when it fails.",
      "Deciding what inspection is worth its cost, now that most traffic is encrypted.",
    ],
    accountableFor: [
      "Policy that expresses the intended boundary rather than an accumulation of exceptions.",
      "Availability of the controls in the path, which is a network responsibility whatever the org chart says.",
      "Knowing what would actually be blocked, as distinct from what the policy document claims.",
    ],
    measuredOn: [
      "Outages attributable to the security path, which is the number this role is judged by unfairly and permanently.",
      "Rule-base hygiene: exceptions with owners and dates rather than accumulated permits.",
      "Time to implement a change safely, since a slow path drives teams around the control.",
    ],
    receivesFrom: [
      { who: "Security architecture", what: "The boundary to enforce and the reason for it." },
      { who: "Network engineering", what: "The topology, and the change window." },
      { who: "Application teams", what: "Requests that describe a symptom rather than a flow." },
    ],
    serves: [
      { who: "The whole estate", what: "A path that is both open enough to work and closed enough to matter." },
      { who: "Incident responders", what: "The ability to isolate a segment on demand." },
      { who: "Auditors", what: "Evidence that the boundary is what the design says it is." },
    ],
    stakeholders: [
      "Every application owner whose traffic crosses a boundary this role controls.",
      "The network team, whose availability numbers absorb this role's mistakes.",
      "The provider, once part of the boundary moved into their edge.",
    ],
    requirements: [
      "Genuine networking depth: routing, translation, encryption and the ability to read a capture.",
      "The discipline to keep a rule base clean when nobody is asking for that.",
      "Enough diplomacy to be the person who says no, repeatedly, to colleagues.",
      "Comfort with the fact that success here is invisible and failure is a conference call.",
    ],
    turnsOn:
      "This role is accountable to two teams that measure it oppositely. The network measures uptime and the security function measures containment, and every interesting decision trades one against the other.",
    adjacentRoles: ["security-engineer", "network-operations-specialist", "security-architect", "network-consulting-engineer"],
    practiceRoles: ["second-line"],
    relatedTools: [],
    updated: "2026-08-31",
  },
  {
    slug: "grc-analyst",
    title: "Governance, risk and compliance analyst",
    group: "defends",
    order: 13,
    provenance: {
      kind: "documented",
      sources: [
        { label: "ISACA - COBIT, the governance framework that separates governance from management and is the common reference for GRC work", url: "https://www.isaca.org/resources/cobit" },
        { label: "NIST SP 800-53 Rev. 5 - the control catalogue that security architecture and policy work is written against in practice", url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final" },
        { label: "ISO/IEC 27001:2022 - Information security, cybersecurity and privacy protection: information security management systems, requirements. Third edition, published October 2022 by ISO/IEC JTC 1/SC 27, and the certification most GRC programmes are audited against", url: "https://www.iso.org/standard/27001" },
      ],
    },
    whatItIs:
      "The role that writes down what the organisation has decided to require of itself, and then finds out whether it is true. Governance is the deciding, risk is the accounting for what could go wrong, and compliance is the evidence that the decisions are being followed. The framework literature separates governance from management for a reason: this role serves the people who set direction, not the people who implement it.",
    theDay: [
      "Turning an obligation written in legal language into a control somebody can actually operate.",
      "Maintaining the risk register, which means chasing owners who did not ask to own anything.",
      "Collecting evidence, and discovering that a control everyone believed in has no record of running.",
      "Answering a customer security questionnaire, honestly, without losing the deal.",
      "Preparing for an audit, which is mostly finding out what will not survive one.",
    ],
    accountableFor: [
      "Policy that is specific enough to follow and general enough to survive a product change.",
      "A risk register that reflects the organisation rather than a template.",
      "Evidence that exists before it is asked for.",
    ],
    measuredOn: [
      "Audit findings, and whether last year's were genuinely closed.",
      "Certification maintained without a crisis in the month before assessment.",
      "Exceptions with owners and expiry dates rather than an unbounded list.",
    ],
    receivesFrom: [
      { who: "Legal and regulators", what: "Obligations, with deadlines that do not negotiate." },
      { who: "Security architecture and engineering", what: "What is actually implemented, which is the input compliance most often lacks." },
      { who: "The business", what: "Appetite for risk, usually stated only after an incident." },
    ],
    serves: [
      { who: "Executives and the board", what: "An account of exposure they can act on." },
      { who: "Sales", what: "The answers that unblock an enterprise customer's review." },
      { who: "Engineering teams", what: "Requirements stated once, rather than rediscovered per project." },
    ],
    stakeholders: [
      "Customers, whose contracts increasingly specify controls this role has to evidence.",
      "Insurers, who now ask the same questions with money attached.",
      "Every team that inherits a requirement written here.",
    ],
    requirements: [
      "Enough technical literacy to know when an implementation claim is not true.",
      "Writing that survives being read by a lawyer, an engineer and an auditor.",
      "The stubbornness to keep asking for evidence after being told it exists.",
      "Judgement about proportion, since a control programme that ignores cost is ignored in turn.",
    ],
    turnsOn:
      "Compliance measures whether a control is documented and operating. Whether it works is a separate question with a separate answer, and a programme that treats the two as one produces certificates and incidents at the same time.",
    adjacentRoles: ["it-auditor", "security-leader", "security-architect", "security-manager"],
    practiceRoles: ["second-line"],
    relatedTools: [],
    updated: "2026-08-31",
  },

  // --- TEACHES -------------------------------------------------------------
  {
    slug: "technical-instructor",
    title: "Technical instructor",
    group: "teaches",
    order: 1,
    provenance: { kind: "held", where: "delivering vendor-authorised training", when: "2020-present" },
    whatItIs:
      "The engineer who teaches the product to the people who will run it. Authorised instruction is delivered against a vendor's own curriculum to a room of practising engineers, which makes the role a teaching job resting on a practitioner's foundation: the questions arrive from real environments and expect answers that hold up in them. The work is also continuous with what came before it — field, consulting and support roles all end with training the customer's staff, and instruction is that final hour of the visit made into the whole job.",
    theDay: [
      "Delivering a class, live, to engineers in several countries and time zones at once.",
      "Repairing a laboratory environment during a break, so the exercise runs for everybody.",
      "Answering the question that begins with the curriculum and ends somewhere in the student's own network.",
      "Calibrating pace to a room whose experience ranges from a first week to twenty years.",
      "Feeding back into the courseware what the room revealed about it.",
    ],
    accountableFor: [
      "Every student leaving able to do the thing the course promised.",
      "Technical accuracy, including where the curriculum and the current release have diverged.",
      "The learning environment functioning for the whole class.",
    ],
    measuredOn: [
      "Student evaluation scores and the vendor's own quality thresholds.",
      "Classes delivered, and utilisation across the calendar.",
      "Certification pass rates where the course leads to an examination.",
    ],
    receivesFrom: [
      { who: "The vendor", what: "Curriculum, laboratory environments and certification objectives." },
      { who: "The training organisation", what: "Schedule, students and the commercial arrangement." },
      { who: "The students", what: "The environments they came from, which are the source of every interesting question." },
    ],
    serves: [
      { who: "The students", what: "Capability that outlasts the week." },
      { who: "Their employers", what: "Engineers who can operate what the organisation bought." },
      { who: "The vendor", what: "A trained population, which is what makes a product adoptable." },
    ],
    stakeholders: [
      "The students' own customers, who experience the training as fewer incidents.",
      "The vendor's certification programme and its integrity.",
      "The courseware authors, for whom classroom feedback is field data.",
    ],
    requirements: [
      "Deep product knowledge combined with the patience to teach its foundations again.",
      "Presence over video for a full working day, which is a physical skill as much as a rhetorical one.",
      "Preparing thoroughly enough to depart from the plan safely when the room needs it.",
      "Comfort saying that a question exceeds the material, and returning with the answer.",
    ],
    turnsOn:
      "Evaluation scores measure the week and the value shows up months later, in the engineer who diagnoses something alone. The instructor's real leverage is choosing which questions to follow: a class steered toward the mechanisms underneath transfers to problems well beyond the curriculum, and one steered toward the interface teaches this release. Both score well on the day; only one of them is still working a year later.",
    adjacentRoles: ["systems-engineer", "channel-systems-engineer", "product-support-engineer", "talent-development-manager"],
    practiceRoles: ["field", "design", "second-line"],
    practiceArticles: ["careers-into-support-and-out-of-it", "field-work", "the-runbook-nobody-can-follow"],
    relatedTools: ["network-os-comparer", "terminal-stack-explainer", "cidr", "flow-path-reasoner"],
    updated: "2026-08-14",
  },

  // --- SELLS ---------------------------------------------------------------
  {
    slug: "account-manager",
    title: "Account manager",
    group: "sells",
    order: 2,
    provenance: {
      kind: "documented",
      sources: [
        { label: "PartnerPortal - the types of channel partner, grouped by what each does in the deal", url: "https://www.partnerportal.io/types-of-channel-partners" },
        { label: "TD SYNNEX - VAR, MSP, ISV, SI: the types of IT channel partner and how a deal moves between them", url: "https://news.tdsynnex.com/stories/var-msp-isv-si-oh-my-types-of-it-channel-partners/" },
      ],
    },
    whatItIs:
      "The commercial half of a vendor sales team, and the person a customer's management calls. An account manager owns the relationship, the forecast and the negotiation, and pairs with a systems engineer who owns the technical truth. The two answer for the same deal from different directions, which is the arrangement's whole design.",
    theDay: [
      "Maintaining a forecast that survives contact with the quarter, which means knowing which deals are real.",
      "Building the relationships that give early warning: a budget moving, a competitor invited, a champion leaving.",
      "Negotiating price, terms and the shape of a contract inside whatever discount authority applies.",
      "Coordinating everyone the account touches: pre-sales, professional services, support, channel partners and the vendor's own management.",
      "Carrying the customer's position back into the vendor when the roadmap and the requirement diverge.",
    ],
    accountableFor: [
      "The forecast being accurate, including the parts that make the number look worse.",
      "The commercial relationship, through renewals and through incidents.",
      "Everything promised under their name, including the technical parts somebody else wrote.",
    ],
    measuredOn: [
      "Quota attainment, quarter by quarter.",
      "Pipeline coverage and its progression through the stages.",
      "Renewal rate and account growth, which arrive later than the quota does.",
    ],
    receivesFrom: [
      { who: "Marketing and business development", what: "Leads, campaigns and the reason a customer took the call." },
      { who: "The systems engineer", what: "What the technology will do, in terms that can be promised." },
      { who: "Sales management", what: "Quota, territory, discount authority and the current priority." },
    ],
    serves: [
      { who: "The customer's decision makers", what: "One accountable point of contact across everything the vendor sells." },
      { who: "The vendor", what: "Revenue, and an accurate picture of what will close." },
      { who: "The channel partner", what: "Alignment, so that one deal is worked once rather than twice." },
    ],
    stakeholders: [
      "The customer's procurement and finance functions, whose process governs the timeline.",
      "Professional services and support, who inherit the commitments.",
      "The vendor's finance organisation, for whom the forecast is a planning input.",
    ],
    requirements: [
      "Enough technical literacy to know which questions need the systems engineer in the room.",
      "The discipline to forecast honestly when an optimistic number would be easier this week.",
      "Patience with sales cycles measured in quarters and relationships measured in years.",
      "Composure through the incident that arrives the month before the renewal.",
    ],
    turnsOn:
      "The forecast is the product. An account manager who calls a deal accurately, including calling it lost early, lets an entire organisation plan around the truth; one whose optimism outruns the evidence spends the quarter's final week explaining. The relationships are how the accuracy is obtained, which is why the role looks social and is arithmetical underneath.",
    adjacentRoles: ["systems-engineer", "channel-systems-engineer", "procurement-specialist", "sales-development-representative"],
    practiceRoles: ["management"],
    practiceArticles: ["communicating-upward-while-live", "the-customer-who-is-furious-and-correct"],
    relatedTools: [],
    updated: "2026-08-14",
  },

  // --- RUNS ----------------------------------------------------------------
  {
    slug: "managed-service-provider-engineer",
    title: "Managed service provider engineer",
    group: "runs",
    order: 1,
    provenance: {
      kind: "documented",
      sources: [
        { label: "Channel Insider - managed service providers, security providers and resellers compared on services and customer relationships", url: "https://www.channelinsider.com/security/managed-services/msp-versus-mssp-versus-var-differences/" },
        { label: "TD SYNNEX - what a managed service provider delivers and how it differs from a reseller", url: "https://news.tdsynnex.com/stories/var-msp-isv-si-oh-my-types-of-it-channel-partners/" },
      ],
    },
    whatItIs:
      "The engineer who runs other companies' infrastructure for a living. A managed service provider takes on the day-to-day operation under a subscription, mostly remotely, and the engineering is shaped by that arrangement: many customers, one set of hands, and a contract that defines what counts as done. The security variant carries the same shape with an adversary added.",
    theDay: [
      "Working a queue that spans several customers, each believing they are the only one.",
      "Responding to monitoring alerts against thresholds the provider chose and the customer accepted.",
      "Applying the same change across many estates, which rewards standardisation and punishes exceptions.",
      "Reporting against the service levels the contract names, monthly and in writing.",
      "Onboarding a new customer, which begins with an assessment of an environment nobody documented.",
    ],
    accountableFor: [
      "The service levels in the contract, per customer.",
      "The estate staying current: patches, firmware, certificates and the things that expire quietly.",
      "Keeping one customer's incident away from another customer's service.",
    ],
    measuredOn: [
      "Service level attainment and ticket throughput.",
      "Margin per customer, which is where standardisation shows up commercially.",
      "Retention, since the business model is recurring rather than transactional.",
    ],
    receivesFrom: [
      { who: "The customer", what: "Their environment, their change requests, and their definition of urgent." },
      { who: "Vendors and distribution", what: "Product, support paths and the escalation route when a defect is involved." },
      { who: "The provider's own tooling", what: "Alerts, inventory and the automation that makes many estates tractable." },
    ],
    serves: [
      { who: "The customer's business", what: "Infrastructure that runs, without the customer employing the people who run it." },
      { who: "The customer's own IT staff, where they exist", what: "Capacity for the work only they can do." },
      { who: "The provider's account management", what: "The service record a renewal conversation rests on." },
    ],
    stakeholders: [
      "The customer's auditors and insurers, for whom the provider's practice is part of the customer's posture.",
      "Every other customer sharing the provider's tooling and attention.",
      "The vendors whose products the provider standardised on.",
    ],
    requirements: [
      "Breadth, because the queue contains whatever the customer base runs.",
      "Discipline with process, since the same change applied many times is safe only when it is applied the same way.",
      "Writing that serves a monthly report as well as a ticket.",
      "The judgement to hold a standard when a customer asks for an exception that would be simpler to grant.",
    ],
    turnsOn:
      "Standardisation is the margin. Every customer arrives with an environment shaped by their own history and asks, reasonably, to keep it — and each accommodation granted is a permanent tax on every future change. Providers that thrive negotiate the estate toward a pattern they can operate at scale, and the engineer who explains that trade to a customer in terms of their own resilience is doing the commercial work as well as the technical.",
    adjacentRoles: ["network-consulting-engineer", "technical-assistance-centre-engineer", "security-operations-analyst"],
    practiceRoles: ["first-line", "second-line", "field"],
    practiceArticles: ["on-call-honestly", "the-queue-as-a-psychological-object", "baselines-knowing-what-normal-looks-like", "handover-project-to-operation"],
    relatedTools: ["health-snapshot-comparator", "change-window-runbook-builder", "cert-renewal-planner", "fault-hypothesis-builder"],
    updated: "2026-08-14",
  },

  // --- SUPPORTS ------------------------------------------------------------
  {
    slug: "technical-assistance-centre-engineer",
    title: "Technical assistance centre engineer",
    group: "supports",
    order: 4,
    provenance: {
      kind: "documented",
      sources: [
        { label: "NIST - occupations, jobs and work roles: a work role is a grouping of work for which someone is responsible or accountable, which differs from a job title", url: "https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center/resources/occupations-jobs-and-work" },
      ],
    },
    whatItIs:
      "The engineer a customer reaches when they contact the vendor. A technical assistance centre runs a queue against a clock, in tiers, around the world, and the role is the first place a fault becomes somebody's named responsibility. It is the largest single population of engineers most vendors employ, and the one that meets the product most often. This is the second line inside the VENDOR; what it escalates goes to third-line product support, and from there to the developers. The customer has tiers of its own, beginning at their service desk, and a case crosses between the two ladders at the point where the organisation running the product asks the organisation that made it.",
    theDay: [
      "Taking ownership of a case, which begins by establishing what actually happened rather than what was reported.",
      "Gathering the evidence that distinguishes between the plausible explanations.",
      "Resolving within the tier where possible, since each escalation costs the customer time.",
      "Handing over across time zones so that a case moves while its owner sleeps.",
      "Feeding recurring findings back as knowledge, so a pattern resolves faster next time.",
    ],
    accountableFor: [
      "The case: its progress, its record and its accuracy.",
      "The severity being right, since severity governs who else becomes involved.",
      "A handover that lets the next engineer continue rather than restart.",
    ],
    measuredOn: [
      "Time to first response and time to resolution against the service level.",
      "Backlog age and cases resolved within the tier.",
      "Customer satisfaction recorded per case.",
    ],
    receivesFrom: [
      { who: "The customer", what: "The report, the evidence they gathered, and the urgency as they experience it." },
      { who: "Engineering", what: "Defect status, workarounds and the release carrying the fix." },
      { who: "The previous shift", what: "A case in progress and the notes that make it continuable." },
    ],
    serves: [
      { who: "The customer's engineers", what: "A resolution, and reasoning they can carry to their own management." },
      { who: "Third-line product support", what: "A case file complete enough to act on, with everything already tried recorded rather than repeated." },
      { who: "The knowledge base", what: "The article that resolves the next occurrence without a person." },
    ],
    stakeholders: [
      "The account team, for whom an open critical case is a commercial fact.",
      "Product management, for whom case volume is roadmap evidence.",
      "Every customer running the release that produced the case.",
    ],
    requirements: [
      "Reading evidence closely while a clock runs.",
      "Written English clear enough to survive a handover to another continent.",
      "Steadiness with a caller whose night this also is.",
      "The habit of recording what was tried, since the record is what makes the next shift useful.",
    ],
    turnsOn:
      "The clock measures the case and the handover decides the outcome. A case that moves between three engineers and three time zones resolves at the speed of its notes, which makes writing the most load-bearing skill in the room and the one least represented in how the role is hired for. Engineers who write their case notes for a stranger arriving at three in the morning are the reason a follow-the-sun model works at all.",
    adjacentRoles: ["product-support-engineer", "field-network-engineer", "high-touch-operations-manager"],
    practiceRoles: ["first-line", "second-line"],
    practiceArticles: ["problem-report-intake", "triage-and-severity", "handing-over-mid-problem", "opening-a-vendor-case", "the-queue-as-a-psychological-object", "bisection", "two-problems", "stops-before-you-find-it"],
    relatedTools: ["fault-hypothesis-builder", "tac-escalation-packet-builder", "packet-capture-plan-builder", "fortios-flow-debug-builder", "f5-eth-trailer-decoder"],
    updated: "2026-08-14",
  },

  // --- DEFENDS -------------------------------------------------------------
  {
    slug: "security-operations-analyst",
    title: "Security operations analyst",
    group: "defends",
    order: 1,
    provenance: {
      kind: "documented",
      sources: [
        { label: "NICCS, CISA - Defensive Cybersecurity work role: analysing data collected from cybersecurity defence tools to mitigate risks (NICE Framework, NIST SP 800-181r1)", url: "https://niccs.cisa.gov/tools/nice-framework/work-role/defensive-cybersecurity" },
        { label: "NICCS, CISA - Incident Response work role: investigating, analysing and responding to network cybersecurity incidents", url: "https://niccs.cisa.gov/tools/nice-framework/work-role/incident-response" },
        { label: "NIST - the NICE Workforce Framework for Cybersecurity, which establishes a common lexicon for cybersecurity work roles", url: "https://niccs.cisa.gov/tools/nice-framework" },
      ],
    },
    whatItIs:
      "The analyst who watches an environment for the signs of an adversary. The national framework describes the work as analysing data collected from a range of defensive tools to mitigate risks, and the day is built from that: alerts, logs, traffic records and the judgement that turns them into a decision. The role runs in tiers, with triage at the front and investigation and hunting behind it.",
    theDay: [
      "Triaging alerts, where the volume means the first skill is deciding what deserves attention.",
      "Investigating what survives triage, across whatever telemetry the organisation happens to keep.",
      "Containing an incident and preserving what an investigation will later need.",
      "Hunting: looking for the activity that generated no alert at all.",
      "Tuning the detections, since every false alert spends attention that a real one will need.",
    ],
    accountableFor: [
      "The alert being handled and the handling being recorded.",
      "Evidence preserved in a state that survives scrutiny.",
      "Escalation happening at the right moment, which is earlier than it feels.",
    ],
    measuredOn: [
      "Time to detect and time to respond.",
      "Alert volume handled, and the proportion escalated.",
      "Detection coverage against a recognised adversary framework.",
    ],
    receivesFrom: [
      { who: "The estate", what: "Telemetry, at whatever fidelity somebody chose to collect it." },
      { who: "Threat intelligence", what: "What adversaries are doing elsewhere, and the indicators that follow." },
      { who: "Engineering and operations", what: "Context: the change that explains the anomaly." },
    ],
    serves: [
      { who: "The organisation", what: "The difference between an incident found early and one found by somebody else." },
      { who: "Incident response and management", what: "A characterised event with evidence attached." },
      { who: "Detection engineering", what: "The feedback that turns a noisy rule into a useful one." },
    ],
    stakeholders: [
      "Legal, regulatory and communications functions, whose obligations begin the moment an incident is confirmed.",
      "Customers and the public, when the organisation holds their data.",
      "The insurers and auditors who will read the record afterwards.",
    ],
    requirements: [
      "Sustained attention across a shift, which is the physical fact of the job.",
      "Enough breadth to recognise ordinary behaviour in systems the analyst has never operated.",
      "Writing that holds up when read later by a lawyer or a regulator.",
      "The judgement to escalate on partial information, which is the only kind available early.",
    ],
    turnsOn:
      "Attention is the finite resource, and it is spent by every alert whether the alert earned it or otherwise. A queue tuned so that arriving alerts deserve a look keeps analysts sharp for the one that matters; a queue that floods trains people to close things quickly, and that training holds on the night it should break. Tuning is therefore the defensive work rather than a chore beside it.",
    adjacentRoles: ["managed-service-provider-engineer", "technical-assistance-centre-engineer"],
    practiceRoles: ["first-line", "second-line"],
    practiceArticles: ["triage-and-severity", "baselines-knowing-what-normal-looks-like", "what-a-baseline-cannot-tell-you", "when-the-instruments-agree"],
    relatedTools: ["sse-architecture-explainer", "cvss-vector-decoder", "ja3-tls-fingerprint", "syslog-pri-decoder", "fault-hypothesis-builder"],
    updated: "2026-08-14",
  },

  // --- MOVES ---------------------------------------------------------------
  {
    slug: "channel-account-manager",
    title: "Channel account manager",
    group: "moves",
    order: 2,
    provenance: {
      kind: "documented",
      sources: [
        { label: "PartnerPortal - channel partner types grouped by what each does in the deal, and what each needs from a programme", url: "https://www.partnerportal.io/types-of-channel-partners" },
        { label: "TD SYNNEX - the types of IT channel partner, and a worked example of how distribution, a reseller and an end customer divide one deal", url: "https://news.tdsynnex.com/stories/var-msp-isv-si-oh-my-types-of-it-channel-partners/" },
      ],
    },
    whatItIs:
      "The commercial counterpart to the channel systems engineer, and the person a partner's management deals with. A channel account manager owns a set of partner companies rather than a set of end customers, which changes the work fundamentally: the revenue arrives through somebody else's sales team, so the job is to make that team choose this line card over the others they carry.",
    theDay: [
      "Recruiting and onboarding partners, then working out which of them will actually transact.",
      "Running the programme: tiers, targets, rebates, accreditations and the renewals that keep a partner in benefit.",
      "Building joint business plans with a partner's management, and revisiting them when a quarter disagrees.",
      "Resolving channel conflict, where two partners or a partner and a direct team pursue one customer.",
      "Arranging the marketing funds, campaigns and incentives that turn a partner's attention toward one vendor.",
    ],
    accountableFor: [
      "Revenue through the assigned partner base.",
      "The partners understanding the programme they are being measured against.",
      "Conflict resolved in a way that leaves both partners still selling.",
    ],
    measuredOn: [
      "Partner-sourced and partner-influenced revenue.",
      "Partner recruitment, activation and the count still transacting a year later.",
      "Programme compliance: certifications held, thresholds met, plans in place.",
    ],
    receivesFrom: [
      { who: "The vendor or distributor", what: "Programme rules, margin structures, funds and the current campaign." },
      { who: "The channel systems engineer", what: "An accurate read of which partners are technically ready." },
      { who: "Partner management", what: "Their own plans, their other vendors, and their commercial reality." },
    ],
    serves: [
      { who: "Partner principals and sales leaders", what: "A reason to invest their capacity in this line rather than another." },
      { who: "The vendor", what: "Reach, through companies that already hold the customer relationships." },
      { who: "Partner sales teams", what: "Programmes, incentives and support that make a deal worth working." },
    ],
    stakeholders: [
      "The end customer, who buys from the partner and is served by a chain they rarely see.",
      "The vendor's direct sales team, whose territory the channel overlaps.",
      "Distribution's credit and logistics functions, which carry the transaction.",
    ],
    requirements: [
      "Commercial fluency in margin, rebate and programme mechanics.",
      "Influence without authority, since a partner is another company with its own priorities.",
      "The judgement to invest in the partners who will grow, which is a slower signal than this quarter.",
      "Even handling of conflict, because a partner who feels displaced remembers it for years.",
    ],
    turnsOn:
      "Partner attention is the scarce thing. A partner carries several vendors and allocates its engineers and sellers to whichever combination of margin, demand and ease returns most — so the account manager competes with the other logos on that partner's wall rather than with the vendor's own competitors. Making the line easy to sell, easy to configure and easy to support wins more capacity than a richer rebate does, which is why this role and the channel systems engineer succeed together or separately.",
    adjacentRoles: ["channel-systems-engineer", "account-manager"],
    practiceRoles: ["management"],
    relatedTools: [],
    updated: "2026-08-14",
  },

  // --- DEFENDS -------------------------------------------------------------
  {
    slug: "incident-responder",
    title: "Incident responder",
    group: "defends",
    order: 2,
    provenance: {
      kind: "documented",
      sources: [
        { label: "NIST Special Publication 800-61 Revision 2, Computer Security Incident Handling Guide: the preparation, detection and analysis, containment eradication and recovery, and post-incident phases", url: "https://csrc.nist.gov/pubs/sp/800/61/r2/final" },
        { label: "NIST Special Publication 800-61 Revision 3, which reframes incident response as part of cybersecurity risk management and maps the earlier lifecycle phases onto the Cybersecurity Framework functions", url: "https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-61r3.pdf" },
        { label: "NICCS, CISA - the Incident Response work role: investigating, analysing and responding to network cybersecurity incidents", url: "https://niccs.cisa.gov/tools/nice-framework/work-role/incident-response" },
      ],
    },
    whatItIs:
      "The person who takes charge once an event is confirmed as an incident. Where the operations analyst watches and triages, the responder investigates, contains, eradicates and recovers, and then writes what happened. The national guidance frames the work as a lifecycle beginning long before the incident, in preparation, and ending after it, in the lessons the organisation keeps.",
    theDay: [
      "Establishing scope: which systems, which accounts, which data, and since when.",
      "Containing, which trades evidence against spread and is a judgement made with partial information.",
      "Eradicating the foothold and recovering service, in an order the business agrees.",
      "Preserving evidence to a standard that survives a regulator, an insurer or a court.",
      "Writing the post-incident account, which is the phase most often abandoned and the one that changes anything.",
    ],
    accountableFor: [
      "The scope being right, since an underscoped incident recurs the following week.",
      "Evidence integrity throughout the response.",
      "The written record: timeline, decisions and reasoning.",
    ],
    measuredOn: [
      "Time to contain and time to recover.",
      "Recurrence, which is the honest measure of eradication.",
      "Post-incident actions completed rather than merely recommended.",
    ],
    receivesFrom: [
      { who: "Security operations", what: "The characterised event and the evidence gathered so far." },
      { who: "Infrastructure and application teams", what: "Access, architecture and the changes that explain what is seen." },
      { who: "Threat intelligence", what: "The adversary's known behaviour, which shapes where to look next." },
    ],
    serves: [
      { who: "The organisation's leadership", what: "A clear account of what happened and what it means, while it is still happening." },
      { who: "Legal, regulatory and communications", what: "Facts firm enough to disclose." },
      { who: "The teams who will rebuild", what: "A boundary they can trust between clean and compromised." },
    ],
    stakeholders: [
      "Customers and the public, whose data the incident may concern.",
      "Regulators and insurers, who read the record afterwards.",
      "Every engineer whose system is inside the containment boundary.",
    ],
    requirements: [
      "Decision-making on partial information under time pressure, repeatedly.",
      "Forensic care, since the containment step decides what evidence remains.",
      "Writing that a lawyer, an auditor and an engineer can each use.",
      "The composure to lead a room of people who are frightened and senior.",
    ],
    turnsOn:
      "Preparation is the phase that decides the outcome, and it happens on ordinary days. Whether logs exist, whether the asset inventory is current, whether the escalation list has the right mobile numbers on it — all of that is settled months before an incident and determines how well it goes. The responder's most valuable hours are therefore the quiet ones spent making the next response possible, and those hours compete with everything more visible.",
    adjacentRoles: ["security-operations-analyst", "technical-assistance-centre-engineer", "digital-forensics-analyst"],
    practiceRoles: ["second-line", "management"],
    practiceArticles: ["containment-before-cure", "running-a-war-room", "timelines-reconstructing-what-happened", "deciding-with-incomplete-information", "communicating-upward-while-live", "judgment-at-hour-eleven"],
    relatedTools: ["incident-timeline-rca-builder", "packet-capture-plan-builder", "cvss-vector-decoder"],
    updated: "2026-08-14",
  },

  {
    slug: "vulnerability-analyst",
    title: "Vulnerability analyst",
    group: "defends",
    order: 3,
    provenance: {
      kind: "documented",
      sources: [
        { label: "NIST - NICE Framework work roles, including the vulnerability specialist responsible for assessing systems and networks to identify deviations from acceptable configurations and measuring the effectiveness of defence in depth against known vulnerabilities", url: "https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-work-role-videos" },
        { label: "NICCS, CISA - the NICE Workforce Framework for Cybersecurity, which establishes a common lexicon for work roles across public, private and academic sectors", url: "https://niccs.cisa.gov/tools/nice-framework" },
      ],
    },
    whatItIs:
      "The analyst who looks for the weaknesses before an adversary does. The national framework describes the work as assessing systems and networks to identify deviations from acceptable configurations, and measuring how well a defence-in-depth architecture holds against known vulnerabilities. The output is a prioritised account of exposure, which somebody else then has to act on.",
    theDay: [
      "Running assessments across an estate whose inventory is a moving target.",
      "Separating the findings that matter from the volume that arrives with them, using exposure rather than score alone.",
      "Verifying that a reported weakness is reachable in this environment, since context decides severity.",
      "Retesting after remediation, which is the step that turns a ticket into a fact.",
      "Reporting to the teams who own the systems, in terms that make the fix ownable.",
    ],
    accountableFor: [
      "Findings that are true, reachable and reproducible.",
      "Prioritisation that reflects this organisation rather than a generic score.",
      "The record of what was tested, when, and with what coverage.",
    ],
    measuredOn: [
      "Coverage of the estate, and the age of the last assessment.",
      "Time to remediate, which belongs to other teams and lands on this report.",
      "Findings verified as closed rather than marked as closed.",
    ],
    receivesFrom: [
      { who: "Asset management", what: "The inventory, at whatever accuracy the organisation maintains." },
      { who: "Threat intelligence", what: "Which weaknesses are being used, which changes what matters first." },
      { who: "Vendors", what: "Advisories, fixed releases and the details that make a finding actionable." },
    ],
    serves: [
      { who: "The teams who own the systems", what: "A short, ordered list they can act on." },
      { who: "Security leadership", what: "Exposure expressed as a trend rather than a snapshot." },
      { who: "Audit and compliance", what: "Evidence that assessment happens and that findings close." },
    ],
    stakeholders: [
      "Every team whose maintenance window a remediation will occupy.",
      "The organisation's insurers and regulators.",
      "Customers relying on the systems being assessed.",
    ],
    requirements: [
      "Breadth across operating systems, networks and applications, since the estate contains all of them.",
      "The judgement to rank by reachable exposure rather than by the number a scanner printed.",
      "Diplomacy, because the deliverable is a list of other people's outstanding work.",
      "Persistence through the retest, which is where the value is realised.",
    ],
    turnsOn:
      "The report is easy to produce and the remediation belongs to somebody else, which makes influence the actual skill. An analyst who arrives with two hundred findings ordered by scanner severity hands over a document; one who arrives with the six that are reachable from the internet, with the fixed version named and the window suggested, hands over a plan. The second gets fixed, and the difference is entirely in the preparation.",
    adjacentRoles: ["penetration-tester", "security-operations-analyst", "incident-responder"],
    practiceRoles: ["second-line", "design"],
    practiceArticles: ["evidence-that-convinces-next-quarter", "prevention-that-survives-the-budget", "root-cause-is-a-choice", "the-fix-you-cannot-prove-worked"],
    relatedTools: ["cvss-vector-decoder", "secure-headers", "x509", "ssrf-url-classifier"],
    updated: "2026-08-15",
  },

  // --- MAKES ---------------------------------------------------------------
  {
    slug: "network-software-engineer",
    title: "Network software engineer",
    group: "makes",
    order: 1,
    provenance: {
      kind: "documented",
      sources: [
        { label: "Cisco - IOS XR software architecture: independent protected processes, message passing between components, and the two-stage commit that constrains how configuration changes are written", url: "https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xr-software/index.html" },
        { label: "Juniper - Junos OS Evolved architecture: a distributed state store from which a restarted process retrieves its state, including on a different node", url: "https://www.juniper.net/documentation/us/en/software/junos/junos-evolved-overview/topics/concept/evo-overview.html" },
        { label: "Arista - EOS architecture: an unmodified Linux kernel with a central state database, where processes publish and subscribe rather than communicating directly", url: "https://www.arista.com/en/products/eos" },
      ],
    },
    whatItIs:
      "The engineer who writes the operating system a network runs on. It is software engineering shaped by an unusual set of constraints: the code runs unattended for years on equipment nobody can reach, an upgrade is a maintenance window somebody negotiated weeks earlier, and a defect is discovered by a stranger at three in the morning. The architecture of the platform decides how much of that pressure reaches any individual change.",
    theDay: [
      "Writing and reviewing code against a protocol specification that other implementations also read, and read differently.",
      "Working within the platform's architecture, which sets the terms: a shared address space makes one defect everybody's outage, and a state store makes a process restartable.",
      "Testing against hardware, against scale, and against the interoperability cases that only appear when another vendor is on the far end.",
      "Taking a reproduced defect from third-line support and finding what in the code produced it.",
      "Deciding which release carries a fix, which is a conversation about risk rather than about code.",
    ],
    accountableFor: [
      "Code that behaves correctly at scale and under the failure conditions the platform promises to survive.",
      "Interoperability with implementations written by other people from the same specification.",
      "The fix arriving in a release, on a schedule support and customers were told about.",
    ],
    measuredOn: [
      "Defect escape rate, which is what customers experience as quality.",
      "Delivery against the release train, which moves for the whole portfolio rather than for one feature.",
      "Test coverage and the results of the regression suite.",
    ],
    receivesFrom: [
      { who: "Third-line product support", what: "Reproduced defects with the evidence attached, which is the difference between a fix and an investigation." },
      { who: "Product management", what: "Requirements, priorities, and the customers behind them." },
      { who: "Standards bodies and specifications", what: "The behaviour the code has to agree with." },
    ],
    serves: [
      { who: "Every engineer running the release", what: "Software that behaves as documented, including when something fails." },
      { who: "Support, at every tier", what: "Fixes, workarounds and the source-level explanation behind them." },
      { who: "The platform's own architecture", what: "Changes that respect the constraints the design was built to give." },
    ],
    stakeholders: [
      "The customers whose networks carry the release, most of whom will never report anything.",
      "Support organisations worldwide, whose case volume is downstream of this code.",
      "Other vendors, whose implementations have to interoperate with this one.",
    ],
    requirements: [
      "Systems programming, and the discipline that comes from code running where nobody can attach a debugger.",
      "Reading specifications closely, since interoperability is agreement about ambiguity.",
      "Comfort with a release cadence measured in months and a support lifetime measured in years.",
      "The judgement to weigh a fix against the risk of shipping it, which is a decision about other people's networks.",
    ],
    turnsOn:
      "The architecture decides how expensive a mistake is, and the architecture was chosen long before the current engineer arrived. On a platform where every process shares one address space, a defect in one feature reaches everything, so caution is the only available safety mechanism. On a platform where a process can be restarted from a state store, the same defect is contained, and engineering effort moves from avoiding faults to recovering from them. Understanding which platform you are writing for is therefore the first thing to learn about the job.",
    adjacentRoles: ["product-support-engineer", "technical-assistance-centre-engineer"],
    practiceRoles: ["design"],
    practiceArticles: ["not-a-bug", "reproducing-the-irreproducible", "feeding-the-fix-back", "proving-the-vendor-wrong", "designing-for-three-in-the-morning"],
    relatedTools: ["network-os-comparer", "terminal-stack-explainer", "diff"],
    updated: "2026-08-14",
  },

  {
    slug: "service-desk-analyst",
    title: "Service desk analyst",
    group: "runs",
    order: 2,
    provenance: {
      kind: "documented",
      sources: [
        { label: "PeopleCert - ITIL 4 Practitioner: Service Desk, covering the practice as the central point of contact between the service provider and its users, its success factors and its key metrics", url: "https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1/itil4-practices-service-desk-3706" },
        { label: "ITIL 4 service desk practice: capturing demand for incident resolution and service requests, and acting as the entry point and single point of contact for all users", url: "https://itsm.tools/itil-4-service-desk-practice-guide/" },
        { label: "A survey of the practice, including the distinction between a help desk oriented to break-fix and a service desk that owns intake, routing and accountability through to resolution", url: "https://www.siit.io/blog/service-desks-guide" },
      ],
    },
    whatItIs:
      "The single point of contact between an organisation and the people who use its technology. The framework defines the service desk as the practice that captures demand for incident resolution and service requests, and the phrase that matters in that definition is single point of contact: a user reports a problem to one place, and the desk works out who owns it.",
    theDay: [
      "Logging, categorising and prioritising whatever arrives, across every channel the organisation offers.",
      "Investigating and diagnosing far enough to resolve at first contact, which is where the value concentrates.",
      "Routing what remains to whichever specialist team owns it, which requires knowing the whole organisation.",
      "Keeping ownership of the ticket through the routing, so the user has one thread rather than several.",
      "Communicating status, which is most of what a waiting user actually wants.",
    ],
    accountableFor: [
      "Every contact being recorded, categorised and visible.",
      "Ownership through to resolution, including while somebody else does the work.",
      "The user knowing where their request stands.",
    ],
    measuredOn: [
      "First-contact resolution rate.",
      "Time to respond and time to resolve against the service level.",
      "User satisfaction, and the volume handled per analyst.",
    ],
    receivesFrom: [
      { who: "Users", what: "The problem as they experience it, described in their own vocabulary." },
      { who: "Specialist teams", what: "Resolutions, workarounds and the knowledge that raises first-contact resolution." },
      { who: "Change and release management", what: "What is about to happen, which explains tomorrow's call volume." },
    ],
    serves: [
      { who: "Everyone in the organisation", what: "One door, so that nobody needs to know which team owns their problem." },
      { who: "Specialist teams", what: "A filtered queue, with the routine handled before it reaches them." },
      { who: "IT management", what: "The clearest available picture of what the organisation is struggling with." },
    ],
    stakeholders: [
      "Department heads whose people are waiting.",
      "The teams downstream, whose day is shaped by what the desk routes to them.",
      "Vendors and managed providers, where a ticket eventually crosses out of the organisation.",
    ],
    requirements: [
      "Breadth across everything the organisation runs, at the depth first contact requires.",
      "Questioning that gets from a described symptom to a usable description.",
      "Written clarity, since the ticket is what every later person reads.",
      "Steadiness with people who are frustrated and whose day this has interrupted.",
    ],
    turnsOn:
      "The desk exists so that the routing knowledge lives in one place rather than in every head in the organisation. That makes first-contact resolution the honest measure and volume a misleading one: an analyst who resolves fewer tickets while raising what the team can handle alone has improved the service, and the numbers show it slowly. It also explains the ceiling — a desk kept purely at intake stays a switchboard, and one given time to learn becomes the reason specialists are left alone.",
    adjacentRoles: ["managed-service-provider-engineer", "technical-assistance-centre-engineer", "network-operations-specialist"],
    practiceRoles: ["first-line"],
    practiceArticles: ["problem-report-intake", "triage-and-severity", "the-queue-as-a-psychological-object", "not-your-problem"],
    relatedTools: ["fault-hypothesis-builder"],
    updated: "2026-08-14",
  },

  {
    slug: "systems-analyst",
    title: "Systems analyst",
    group: "runs",
    order: 3,
    provenance: {
      kind: "documented",
      sources: [
        { label: "NICE Framework systems analysis: studying an organisation's current systems and procedures and designing solutions, bringing business and information technology together by understanding the needs and limitations of both", url: "https://niccs.cisa.gov/tools/nice-framework" },
        { label: "NIST - occupations, jobs and work roles: a work role is a grouping of work for which someone is responsible or accountable, and is distinct from a job title", url: "https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center/resources/occupations-jobs-and-work" },
      ],
    },
    whatItIs:
      "The role that faces two directions at once. The prefix names the subject — network analyst, security analyst, data analyst — and the word analyst names the stance: studying what an organisation currently runs and what it currently needs, and describing each to the other. The framework puts it plainly as bringing business and technology together by understanding the needs and limitations of both.",
    theDay: [
      "Studying the systems and procedures as they actually operate, which differs from how they were designed and from how they are described.",
      "Gathering requirements from people whose expertise is their own work rather than technology.",
      "Translating those requirements into something an engineer can build, and translating the constraints back into something a business can decide with.",
      "Measuring: usage, capacity, incidents, cost, and whatever else turns an opinion about the estate into a number.",
      "Documenting the current state, which is frequently the only accurate record the organisation holds.",
    ],
    accountableFor: [
      "The description of the current state being true.",
      "Requirements that survive contact with the people who have to build against them.",
      "Analysis that leads to a decision rather than to a further meeting.",
    ],
    measuredOn: [
      "Recommendations adopted, and the outcomes they produced.",
      "Reporting delivered on the cadence the organisation runs on.",
      "Requirements accepted without rework by the teams who implement them.",
    ],
    receivesFrom: [
      { who: "The business", what: "What they need, expressed in the vocabulary of their own work." },
      { who: "Engineering and operations", what: "What the estate can do, and at what cost." },
      { who: "Monitoring and inventory", what: "The measurements, at whatever quality the organisation maintains them." },
    ],
    serves: [
      { who: "Decision makers", what: "A picture of the current state accurate enough to act on." },
      { who: "Engineers", what: "Requirements with the reasoning attached, so a trade-off can be made rather than guessed." },
      { who: "The organisation's memory", what: "Written knowledge of how the estate reached its present shape." },
    ],
    stakeholders: [
      "Every team whose work the recommendation changes.",
      "Finance, since analysis frequently arrives attached to a budget request.",
      "Audit and compliance, for whom the documented current state is evidence.",
    ],
    requirements: [
      "Fluency in two vocabularies, and the patience to move between them all day.",
      "Enough technical depth to be corrected by an engineer and to notice when the correction is wrong.",
      "Writing, since the analysis outlives the meeting that produced it.",
      "Comfort delivering a finding that somebody in the room would prefer stayed unmeasured.",
    ],
    turnsOn:
      "The analyst holds the only complete picture in the room, and holds it without authority to act on it. That combination is the role: the business knows what it wants, engineering knows what is possible, and the person who knows both is the one who has to make each legible to the other. Influence comes from the description being trusted, which is why accuracy about the current state matters more here than elegance about the future one.",
    adjacentRoles: ["service-desk-analyst", "security-operations-analyst", "network-consulting-engineer"],
    practiceRoles: ["design", "second-line"],
    practiceArticles: ["reading-a-design-you-did-not-write", "assumptions-a-design-never-states", "what-a-baseline-cannot-tell-you", "naming-and-addressing"],
    relatedTools: ["network-os-comparer", "health-snapshot-comparator", "digital-transformation-tracker"],
    updated: "2026-08-15",
  },

  {
    slug: "security-leader",
    title: "Security leader",
    group: "defends",
    order: 4,
    provenance: {
      kind: "documented",
      sources: [
        { label: "NICCS, CISA - the Executive Cybersecurity Leadership work role: establishing vision and direction for an organisation's cybersecurity operations and resources, with authority to make and execute decisions that impact the organisation broadly, including policy approval and stakeholder engagement", url: "https://niccs.cisa.gov/tools/nice-framework/work-role/executive-cybersecurity-leadership" },
        { label: "NICCS, CISA - the NICE Framework's Oversight and Governance category, which groups the roles providing leadership, management, direction and advocacy so that an organisation can manage cybersecurity risk", url: "https://niccs.cisa.gov/tools/nice-framework" },
      ],
    },
    whatItIs:
      "The top of the management arm, in security. The framework describes the work as establishing vision and direction for an organisation's cybersecurity operations and resources, with the authority to make decisions that reach the whole organisation, approve policy and engage stakeholders. The ladder below it runs manager, then director, then this — and each rung trades proximity to the work for reach across it.",
    theDay: [
      "Setting direction, and holding it while the quarter argues with it.",
      "Acquiring resources: budget, headcount, and the authority to require things of teams elsewhere.",
      "Approving policy, and owning the consequences when it is applied to a business the policy inconveniences.",
      "Advising senior management and the board, in terms of risk to the organisation rather than in terms of technology.",
      "Communicating the value of the programme to stakeholders, which is the task the framework names and the one most easily deferred.",
    ],
    accountableFor: [
      "The organisation's security posture, including the parts owned by teams elsewhere.",
      "The programme having a strategy that connects to the organisation's actual risks.",
      "What the board is told, and whether it was accurate at the time.",
    ],
    measuredOn: [
      "Risk reduction, which resists measurement and is measured anyway.",
      "Incidents and their consequences, which are visible and partly outside the role's control.",
      "Audit and regulatory outcomes, and programme delivery against plan.",
    ],
    receivesFrom: [
      { who: "The operations and response teams", what: "What is happening, at the fidelity the tooling allows." },
      { who: "The business", what: "Where it is going, which decides what has to be protected next." },
      { who: "Regulators, auditors and insurers", what: "Obligations that arrive with dates attached." },
    ],
    serves: [
      { who: "The board and executive", what: "Risk expressed in terms they can decide with." },
      { who: "The security teams", what: "Direction, resources, and cover when a decision proves unpopular." },
      { who: "The rest of the organisation", what: "Policy that can be followed by people whose job is something else." },
    ],
    stakeholders: [
      "Customers and the public, whose data the organisation holds.",
      "Every team whose work the policy constrains.",
      "Insurers, regulators and, after an incident, the courts.",
    ],
    requirements: [
      "Technical credibility sufficient to be told the truth by the people who have it.",
      "Fluency in risk, budget and the language a board makes decisions in.",
      "The composure to be accountable for outcomes produced by systems and people beyond direct control.",
      "The judgement to say what the organisation is choosing to accept, and to have it recorded as a choice.",
    ],
    turnsOn:
      "The role is accountable for an outcome it produces through other people's budgets and other people's priorities. Authority over policy is real and authority over the engineering that implements it usually belongs to somebody else, so the work is persuasion carried out with a mandate. Leaders who last make the risk legible to the people who hold the budget, and record what the organisation decided to accept — because the record is what turns a later incident from a failure of the programme into a consequence of a decision somebody made knowingly.",
    adjacentRoles: ["security-manager", "security-operations-analyst", "incident-responder", "vulnerability-analyst", "it-auditor"],
    practiceRoles: ["management"],
    practiceArticles: ["communicating-upward-while-live", "prevention-that-survives-the-budget", "hindsight-makes-it-look-inevitable", "rca-without-a-scapegoat"],
    relatedTools: ["sse-architecture-explainer"],
    updated: "2026-08-15",
  },

  {
    slug: "project-manager",
    title: "Project manager",
    group: "deploys",
    order: 2,
    provenance: {
      kind: "documented",
      sources: [
        { label: "NICE Framework - the secure project management work role, which oversees technology projects, ensures security is integrated, tracks status and communicates value; and the programme management role that coordinates programme success and alignment with priorities", url: "https://niccs.cisa.gov/tools/nice-framework" },
        { label: "PartnerPortal - channel partner types, including the delivery and integration partners whose projects a manager coordinates", url: "https://www.partnerportal.io/types-of-channel-partners" },
      ],
    },
    whatItIs:
      "The person accountable for a piece of work arriving: on the agreed scope, inside the agreed time, at the agreed cost. On a technology delivery the role sits between the customer who bought an outcome and the engineers producing it, and its material is dependencies, sequence and the truth about progress.",
    theDay: [
      "Holding the plan, and revising it the moment reality disagrees rather than at the next reporting date.",
      "Chasing dependencies, most of which belong to people outside the project and inside somebody else's priorities.",
      "Running the governance: status, risk log, change control, and the decisions that need a name attached.",
      "Escalating early, which is the difference between a recoverable slip and a lost project.",
      "Protecting the engineers from the meetings that produce nothing, and attending those meetings instead.",
    ],
    accountableFor: [
      "Scope, schedule and cost, and the trade between them being made deliberately.",
      "Status reporting that reflects the project rather than the audience.",
      "Risks named while there is still time to act on them.",
    ],
    measuredOn: [
      "Delivery against the baseline, and margin on the engagement.",
      "Change requests handled without the project losing its shape.",
      "Customer satisfaction at handover.",
    ],
    receivesFrom: [
      { who: "Pre-sales and the account team", what: "The statement of work, and whatever was promised in the room." },
      { who: "The delivery engineers", what: "What is actually happening, at whatever candour the culture allows." },
      { who: "The customer", what: "Access, windows, decisions, and the changes they have decided they also want." },
    ],
    serves: [
      { who: "The customer", what: "One person accountable for the whole, so that they deal with a project rather than with a set of engineers." },
      { who: "The engineers", what: "A sequence that makes sense, and cover when the plan needs to change." },
      { who: "The delivering organisation", what: "A project whose margin survives its own scope." },
    ],
    stakeholders: [
      "The customer's own project office, whose governance the engagement has to satisfy.",
      "Finance on both sides, since schedule and cost are the same conversation.",
      "The operations team who will inherit whatever is delivered.",
    ],
    requirements: [
      "Enough technical understanding to know when an estimate is optimistic.",
      "The nerve to report a slip on the day it becomes visible.",
      "Organisation held lightly, since a plan defended past its usefulness becomes the problem.",
      "Diplomacy across two organisations with different incentives and one shared deadline.",
    ],
    turnsOn:
      "Status reporting is where this role is decided. A project manager who reports the schedule the customer wants to hear buys three comfortable weeks and pays for them at the end, in a conversation nobody can prepare for; one who reports a slip the day it appears spends an uncomfortable hour and keeps the options open. Everything else in the role is technique, and this is the part that decides whether the technique matters.",
    adjacentRoles: ["network-consulting-engineer", "account-manager", "systems-analyst"],
    practiceRoles: ["management", "field"],
    practiceArticles: ["communicating-upward-while-live", "handover-project-to-operation", "deciding-with-incomplete-information"],
    relatedTools: ["change-window-runbook-builder", "change-blast-radius-mapper"],
    updated: "2026-08-15",
  },

  {
    slug: "security-manager",
    title: "Security manager",
    group: "defends",
    order: 5,
    provenance: {
      kind: "documented",
      sources: [
        { label: "NICCS, CISA - the NICE Framework's Oversight and Governance category, which groups the roles providing leadership, management, direction and advocacy so that an organisation may manage cybersecurity risk and conduct cybersecurity work", url: "https://niccs.cisa.gov/tools/nice-framework" },
        { label: "NICCS, CISA - the Executive Cybersecurity Leadership work role, the rung above this one on the same ladder", url: "https://niccs.cisa.gov/tools/nice-framework/work-role/executive-cybersecurity-leadership" },
      ],
    },
    whatItIs:
      "The first rung of the management arm, in security. A security manager runs the people who do the analysis, the response and the assessment: hiring them, developing them, staffing the rota, and turning a leader's direction into work that fits in a week. It is the rung where a career stops being about your own output and starts being about somebody else's.",
    theDay: [
      "Staffing: the rota, the on-call, and the arithmetic of covering a queue that runs at all hours.",
      "Developing people, which is the part that compounds and the part most easily postponed.",
      "Turning strategy into a backlog somebody can actually work through.",
      "Standing between the team and the interruptions, so that the analysis has room to happen.",
      "Reporting upward in the terms the tier above uses, and downward in the terms the team uses.",
    ],
    accountableFor: [
      "The team producing the outcome, with the people in it still there next year.",
      "Coverage: the rota being genuinely staffed rather than nominally filled.",
      "The accuracy of what is reported upward, including the parts that reflect on the management.",
    ],
    measuredOn: [
      "Team outcomes: detection, response, assessment coverage.",
      "Retention and time to fill a vacancy.",
      "Delivery against the programme the tier above set.",
    ],
    receivesFrom: [
      { who: "The security leader", what: "Direction, budget and the risks the organisation has decided to prioritise." },
      { who: "The team", what: "What is actually happening in the queue, which arrives filtered by how safe it feels to say." },
      { who: "Human resources and recruitment", what: "The market reality behind every hiring plan." },
    ],
    serves: [
      { who: "The analysts and responders", what: "Room to do the work, and a career with somewhere to go." },
      { who: "The security leader", what: "Execution, and an accurate picture of capacity." },
      { who: "The organisation", what: "A function that runs at three in the morning as well as at ten." },
    ],
    stakeholders: [
      "The families of everybody on a rota, which is a real stakeholder in a role built on shift work.",
      "The teams whose incidents this one handles.",
      "Finance, for whom headcount is the largest line in the programme.",
    ],
    requirements: [
      "Technical credibility, because a team that has to explain its work upward twice starts editing it.",
      "Care taken deliberately, since burnout in this function is an operational risk and shows up as attrition.",
      "The willingness to hold a boundary against work the team has no capacity for.",
      "Honesty upward about capacity, which is the same skill the project manager needs and costs the same to use.",
    ],
    turnsOn:
      "This is the rung the Y moment leads to, and the trade is immediate: the day fills with other people's work and the technical depth that earned the promotion begins to age from the first week. Managers who thrive decide early what they are keeping current and what they are letting go, and say so — because the alternative is a slow drift in which the team stops asking and the manager stops being able to answer.",
    adjacentRoles: ["security-leader", "security-operations-analyst", "incident-responder"],
    practiceRoles: ["management"],
    practiceArticles: ["burnout-in-operations", "on-call-honestly", "the-queue-as-a-psychological-object", "working-with-people-who-are-frightened"],
    relatedTools: ["cvss-vector-decoder"],
    updated: "2026-08-15",
  },

  {
    slug: "systems-administrator",
    title: "Systems administrator",
    group: "runs",
    order: 4,
    provenance: {
      kind: "documented",
      sources: [
        { label: "NICE Framework - the systems administrator work role: setting up and maintaining a system or its components, including installing, configuring and updating hardware and software, establishing and managing user accounts, overseeing backup and recovery, and implementing operational and technical security controls", url: "https://niccs.cisa.gov/tools/nice-framework" },
        { label: "NIST - occupations, jobs and work roles, on the distinction between a work role and the job title an organisation advertises", url: "https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center/resources/occupations-jobs-and-work" },
      ],
    },
    whatItIs:
      "The person who keeps the systems running. The framework lists the work plainly: installing, configuring and updating hardware and software, managing accounts, overseeing backup and recovery, and implementing the controls that policy requires. It is the most widely held technical role in any organisation of size, and the one whose output is measured almost entirely by the absence of events.",
    theDay: [
      "Patching, updating and renewing the things that expire: certificates, licences, agents, firmware.",
      "Managing accounts and access, which is a security control performed as an administrative task.",
      "Backup and, far more rarely and far more importantly, restore.",
      "Responding to whatever the monitoring or the service desk sends, in among the planned work.",
      "Automating the parts that repeat, in whatever time the unplanned work leaves.",
    ],
    accountableFor: [
      "The systems being available, current and recoverable.",
      "Access being what the policy says it is.",
      "Restores actually working, which is knowable only by testing them.",
    ],
    measuredOn: [
      "Availability and incident count.",
      "Patch currency and audit findings.",
      "Tickets closed, which measures the interruptions rather than the engineering.",
    ],
    receivesFrom: [
      { who: "The service desk", what: "What users are experiencing, filtered through first-line triage." },
      { who: "Vendors", what: "Patches, advisories and end-of-support dates." },
      { who: "Security and audit", what: "Controls to implement and findings to close." },
    ],
    serves: [
      { who: "Everyone in the organisation", what: "Systems that work, which is noticed mainly in its absence." },
      { who: "The security function", what: "The controls, actually applied to actual machines." },
      { who: "The business", what: "The ability to recover, which is worth precisely what the last restore test proved." },
    ],
    stakeholders: [
      "Auditors and insurers, whose questions are about this role's routine.",
      "Every team whose application sits on these systems.",
      "Whoever inherits the estate, and whatever documentation exists by then.",
    ],
    requirements: [
      "Breadth, because the estate contains whatever the organisation bought over fifteen years.",
      "Discipline with routine work whose value shows up only when it was skipped.",
      "Automation as a habit, since the alternative is a career of the same afternoon.",
      "Writing things down, which is the difference between expertise and a dependency.",
    ],
    turnsOn:
      "The role accumulates knowledge that lives nowhere else. Fifteen years of small decisions — why that service runs on that host, which job has to finish before that one starts — become the reason the estate works and the reason it cannot be handed over. Administrators who write it down convert personal indispensability into organisational capability, and the trade is real: the documented administrator is easier to replace and far easier to promote.",
    adjacentRoles: ["service-desk-analyst", "managed-service-provider-engineer", "systems-analyst", "network-operations-specialist"],
    practiceRoles: ["second-line", "first-line", "field"],
    practiceArticles: ["documenting-for-the-inheritor", "what-to-automate-and-what-never-to", "configuration-diffing-and-version-control", "log-discipline", "the-scripts-worth-keeping"],
    relatedTools: ["terminal-stack-explainer", "cert-renewal-planner", "x509", "syslog-pri-decoder"],
    updated: "2026-08-15",
  },

  {
    slug: "threat-intelligence-analyst",
    title: "Threat intelligence analyst",
    group: "defends",
    order: 6,
    provenance: {
      kind: "documented",
      sources: [
        { label: "NIST - NICE Framework work roles, including the threat analysis role responsible for collecting, processing, analysing and disseminating cybersecurity threat assessments", url: "https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-work-role-videos" },
        { label: "NICCS, CISA - the NICE Workforce Framework for Cybersecurity, which establishes the common lexicon these work roles are defined in", url: "https://niccs.cisa.gov/tools/nice-framework" },
      ],
    },
    whatItIs:
      "The analyst who studies adversaries rather than systems. The framework describes the work as collecting, processing, analysing and disseminating threat assessments, and the last of those verbs carries the role: intelligence that reaches nobody in a form they can act on has been research rather than intelligence.",
    theDay: [
      "Collecting from sources of varying reliability, and recording which was which.",
      "Assessing what an adversary can do and what they appear to intend, which are separate judgements.",
      "Translating that into something concrete for the people who defend: a detection, a priority, a hunt.",
      "Writing assessments with confidence stated, so that a reader can weigh them.",
      "Tracking whether the assessment held, which is how the sources are calibrated over time.",
    ],
    accountableFor: [
      "Sourcing that is recorded and weighted, rather than aggregated into a single confident voice.",
      "Assessments that state their confidence and what would change it.",
      "Relevance: intelligence about this organisation's actual exposure.",
    ],
    measuredOn: [
      "Detections and hunts that originated with the intelligence.",
      "Timeliness against events that later mattered.",
      "Assessments used in decisions, which is the honest measure and the hardest to count.",
    ],
    receivesFrom: [
      { who: "External feeds, vendors and sharing communities", what: "Indicators, reporting and the occasional thing that arrives before it is public." },
      { who: "The organisation's own telemetry", what: "What is being attempted here, which outranks anything external for relevance." },
      { who: "Incident response", what: "What an adversary actually did once inside, which is the highest-quality source available." },
    ],
    serves: [
      { who: "Security operations", what: "Priorities, and the detections worth building." },
      { who: "Incident response", what: "Context about who this appears to be and what they usually do next." },
      { who: "Security leadership", what: "The threat picture that shapes where the programme spends." },
    ],
    stakeholders: [
      "The sharing communities the organisation both draws from and owes to.",
      "Legal, since attribution carries consequences beyond the technical.",
      "Every defender whose attention this work directs.",
    ],
    requirements: [
      "Source discipline, and the habit of recording provenance and confidence together.",
      "Analytic writing: a judgement, its basis, and its uncertainty, in that order.",
      "Enough operational grounding to know which findings a defender can use.",
      "Resistance to the compelling narrative, since a good story is the commonest way an assessment goes wrong.",
    ],
    turnsOn:
      "Intelligence earns its name by changing a decision. A report that arrives, is read, and leaves the defence exactly as it was has cost the organisation an analyst's week and delivered news. The analysts who matter work backwards from the decision — which detection, which priority, which hunt — and write toward it, which also makes the work measurable in a way that generic reporting leaves out of reach.",
    adjacentRoles: ["security-operations-analyst", "incident-responder", "vulnerability-analyst"],
    practiceRoles: ["second-line", "design"],
    practiceArticles: ["when-the-evidence-disagrees", "deciding-with-incomplete-information", "the-assumption-you-cannot-see"],
    relatedTools: ["ja3-tls-fingerprint", "ja4-fingerprint-decoder", "p0f-signature-explainer", "user-agent-entropy-analyzer"],
    updated: "2026-08-15",
  },

  {
    slug: "knowledge-base-manager",
    title: "Knowledge base manager",
    group: "supports",
    order: 5,
    provenance: { kind: "held", where: "at a vendor, for its support centre and engineering", when: "2000-2002" },
    whatItIs:
      "The person who turns what the organisation learned into something the next person can use. Every resolved case contains knowledge that exists in one engineer's head and one ticket nobody will read again; this role converts that into articles, keeps them current, and measures whether they are answering anything. It sits across support and engineering because the raw material comes from both.",
    theDay: [
      "Reading closed cases for the ones that will recur, which is a judgement made from pattern rather than from volume.",
      "Turning a resolution into an article somebody can follow without the engineer who wrote it.",
      "Retiring and correcting: an article describing a release nobody runs is worse than an absent one.",
      "Working the taxonomy, since an article that cannot be found has the same value as an article that was never written.",
      "Measuring deflection — which articles answered a question before it became a case — and feeding that back into what gets written next.",
    ],
    accountableFor: [
      "Articles being accurate at the version they claim to cover.",
      "The corpus being findable by somebody using the words they actually have.",
      "Currency: the review cycle happening rather than being intended.",
    ],
    measuredOn: [
      "Case deflection, and self-service resolution rates.",
      "Articles published, reviewed and retired.",
      "Search success, and the questions that returned nothing.",
    ],
    receivesFrom: [
      { who: "Support engineers at every tier", what: "Resolutions, and the reasoning behind them while it is still fresh." },
      { who: "Engineering", what: "Defect explanations, workarounds and the release a fix landed in." },
      { who: "The search logs", what: "What people asked for, including everything the corpus failed to answer." },
    ],
    serves: [
      { who: "Customers", what: "An answer at the hour they have the question rather than at the hour a queue reaches them." },
      { who: "Support, at every tier", what: "The same answer given consistently, and time returned by the cases that stopped arriving." },
      { who: "New engineers", what: "The fastest route into how the product behaves in the field." },
    ],
    stakeholders: [
      "Every customer running the product, most of whom will meet the vendor only through these pages.",
      "Product management, for whom the questions people search are demand signal.",
      "The engineers whose expertise the corpus either preserves or loses.",
    ],
    requirements: [
      "Technical depth sufficient to read a case and know what generalises.",
      "Writing for a stranger under pressure, in their vocabulary rather than the product's.",
      "The persistence to ask busy engineers for the write-up, repeatedly and pleasantly.",
      "Comfort with an output whose success is a case that never opened.",
    ],
    turnsOn:
      "The knowledge exists at the moment the case closes and decays from that moment. An engineer asked a week later remembers the fix; asked a month later remembers that there was one. Capturing it inside that window is the whole discipline, and it competes directly with the next case in the queue — which is why the role has to belong to somebody rather than to everybody's good intentions.",
    adjacentRoles: ["product-support-engineer", "technical-assistance-centre-engineer", "technical-instructor"],
    practiceRoles: ["second-line", "design"],
    practiceArticles: ["knowledge-capture-that-gets-found", "the-write-up", "feeding-the-fix-back", "documenting-for-the-inheritor"],
    relatedTools: [],
    updated: "2026-08-15",
  },

  {
    slug: "procurement-specialist",
    title: "Procurement specialist",
    group: "sells",
    order: 3,
    provenance: {
      kind: "documented",
      sources: [
        { label: "CIPS - what procurement is: market analysis, sourcing, negotiation, contracting and supplier relationship management, and the distinction from purchasing, which fulfils the transaction only", url: "https://www.cips.org/intelligence-hub/procurement/what-is-procurement" },
        { label: "CIPS - procurement job profiles, from assistant buyer through senior buyer, manager and director to chief procurement officer", url: "https://www.cips.org/careers/job-profiles" },
        { label: "CIPS - the procurement manager profile: engaging stakeholders, supporting complex negotiations to optimise the commercial position, and delivering competitive advantage through cost savings and lifecycle value", url: "https://www.cips.org/careers/job-profiles/procurement-manager" },
      ],
    },
    whatItIs:
      "The person on the other side of every sale described in this corpus. Procurement runs the cycle — market analysis, sourcing, negotiation, contracting and supplier management — with the object of acquiring at the right price, quality, quantity and time. The professional body draws a line worth keeping: procurement covers that whole cycle, while purchasing fulfils the transaction.",
    theDay: [
      "Running a tender or a request for proposal, and keeping it defensible while the business argues for the supplier it already chose.",
      "Negotiating price, terms, service levels and the renewal clauses that decide the next three years.",
      "Building the category strategy: what this organisation buys, from whom, and what leverage exists.",
      "Managing suppliers after signature, which is where most of the value either arrives or evaporates.",
      "Recording the saving, in a form finance will accept.",
    ],
    accountableFor: [
      "A process that stands up to audit, including the parts where a preferred supplier lost.",
      "Contracts whose obligations are the ones the organisation actually needs.",
      "The commercial position: price, terms and the exits.",
    ],
    measuredOn: [
      "Savings delivered against a baseline, and cost avoided against an increase that was proposed.",
      "Contract cycle time, and spend brought under managed agreements.",
      "Supplier performance against the terms that were signed.",
    ],
    receivesFrom: [
      { who: "The technical teams", what: "A requirement, sometimes written around a product already chosen." },
      { who: "Finance", what: "Budget, and the definition of a saving they will recognise." },
      { who: "Suppliers", what: "Proposals, and the pricing behaviour that reveals where the flexibility is." },
    ],
    serves: [
      { who: "The organisation", what: "Value obtained, and risk removed from agreements before it becomes a dispute." },
      { who: "The technical teams", what: "The thing they asked for, on terms that survive the next renewal." },
      { who: "Finance and audit", what: "A defensible record of how the decision was reached." },
    ],
    stakeholders: [
      "The suppliers on the other side, whose account managers are measured on the same transaction.",
      "The legal function, which owns what the contract says.",
      "Whoever operates the thing afterwards, and lives with the support terms that were negotiated.",
    ],
    requirements: [
      "Negotiation held over long horizons, since the renewal is part of the first conversation.",
      "Enough technical literacy to tell a requirement from a preference written as one.",
      "Rigour with process, because the defensibility of a decision is part of its value.",
      "The independence to say that the chosen supplier lost on the criteria the organisation set.",
    ],
    turnsOn:
      "The seller is measured on revenue captured and the buyer on discount obtained, which makes one number the target of two careers pulling opposite ways. The subtlety is in how a saving is counted: a reduction from a known baseline is auditable, while cost avoided is measured against an increase that was proposed and then prevented — a comparison with something that stayed hypothetical. Buyers who explain that distinction to their own finance function get credit for both kinds; those who leave it implicit find the second kind quietly discounted.",
    adjacentRoles: ["account-manager", "channel-account-manager", "systems-engineer"],
    practiceRoles: ["management"],
    practiceArticles: ["what-vendor-support-can-and-cannot-do", "evidence-that-convinces-next-quarter"],
    relatedTools: [],
    updated: "2026-08-15",
  },

  {
    slug: "digital-forensics-analyst",
    title: "Digital forensics analyst",
    group: "defends",
    order: 7,
    provenance: {
      kind: "documented",
      sources: [
        { label: "NIST - NICE Framework work roles, including the digital forensics role responsible for analysing digital evidence from computer security incidents to derive information supporting system and network vulnerability mitigation", url: "https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-work-role-videos" },
        { label: "NICCS, CISA - the NICE Workforce Framework for Cybersecurity, which defines these work roles in a common lexicon", url: "https://niccs.cisa.gov/tools/nice-framework" },
      ],
    },
    whatItIs:
      "The analyst who reconstructs what happened from what remains. Where the responder is deciding what to do next, forensics is establishing what already occurred: from disk images, memory, logs and network records, in an order and to a standard that keeps the findings usable afterwards. The framework frames the output as information that supports mitigation, and in practice it also supports the lawyers.",
    theDay: [
      "Acquiring evidence in a way that preserves it, which decides everything that follows.",
      "Building a timeline: what ran, what was written, what was sent, and in which order.",
      "Recovering what somebody attempted to remove, which is frequently where the intent becomes visible.",
      "Separating what the evidence shows from what it suggests, and writing the two differently.",
      "Documenting handling continuously, so that a finding stays admissible as well as true.",
    ],
    accountableFor: [
      "Evidence integrity from acquisition onward, and the record proving it.",
      "Findings that follow from the artefacts, with the inference stated as inference.",
      "A timeline that another examiner could reproduce from the same material.",
    ],
    measuredOn: [
      "Cases completed, and findings that survive review.",
      "Time to a defensible answer, since an investigation runs beside a business waiting to restart.",
      "Reports accepted by the audiences that requested them, including outside the organisation.",
    ],
    receivesFrom: [
      { who: "Incident response", what: "Scope, priority, and the systems believed to be involved." },
      { who: "Infrastructure teams", what: "Images, logs and access to the machines still holding evidence." },
      { who: "Legal", what: "The standard the work has to meet, which is set before the acquisition rather than after." },
    ],
    serves: [
      { who: "Incident response", what: "What actually happened, which bounds the containment." },
      { who: "Legal, regulatory and insurance functions", what: "Findings that hold up under examination by people paid to test them." },
      { who: "Engineering and operations", what: "The specific weakness that was used, which is the thing worth fixing." },
    ],
    stakeholders: [
      "The individuals whose activity appears in the evidence, whose interests deserve care.",
      "Courts, regulators and insurers, for whom the handling record is part of the finding.",
      "The organisation, whose account of the incident rests on this work.",
    ],
    requirements: [
      "Method held under pressure, since the shortcuts available early destroy the options available later.",
      "Depth across file systems, memory, operating systems and network records.",
      "Writing that distinguishes observation from inference in every sentence that needs it.",
      "Discretion, because the material routinely includes things unrelated to the investigation.",
    ],
    turnsOn:
      "The first hour decides the case. Acquisition made in the right order preserves the volatile evidence that answers the interesting questions; the same hour spent restoring service first leaves an investigation working from what survived by luck. Forensics teams earn their standing before an incident, by agreeing with the business in advance which comes first and in which circumstances, because that conversation held during an incident is decided by whoever is most senior in the room.",
    adjacentRoles: ["incident-responder", "security-operations-analyst", "threat-intelligence-analyst"],
    practiceRoles: ["second-line"],
    practiceArticles: ["capture-before-you-change", "timelines-reconstructing-what-happened", "what-to-capture-before-you-know", "verifying-without-trusting"],
    relatedTools: ["f5-eth-trailer-decoder", "p0f-signature-explainer", "ja3-tls-fingerprint", "ja4-fingerprint-decoder", "http-header-order-fingerprint"],
    updated: "2026-08-15",
  },

  {
    slug: "product-manager",
    title: "Product manager",
    group: "makes",
    order: 2,
    provenance: {
      kind: "documented",
      sources: [
        { label: "AIPMM - the Guide to the Product Management and Marketing Body of Knowledge (ProdBOK), which sets out the strategies, methodologies, concepts and activities of the product management and marketing domains across the product lifecycle", url: "https://aipmm.com/prodbok" },
        { label: "A survey of the established product management frameworks, including ProdBOK, the PDMA body of knowledge and the ISPMA software product management framework, and what each is useful for", url: "https://productstride.substack.com/p/product-management-frameworks" },
      ],
    },
    whatItIs:
      "The person who decides what the product is. The body of knowledge frames the work across a lifecycle — conceive, plan, develop, qualify, launch, deliver, retire — with a decision point between each phase. A product manager owns those decisions and the reasoning behind them, and owns them without commanding any of the teams whose work depends on them.",
    theDay: [
      "Talking to customers, and to the people who talk to customers, which is a different and larger population.",
      "Deciding what enters the roadmap, and revisiting it when the evidence moves.",
      "Writing the requirement precisely enough that engineering can build it and loosely enough that they can build it well.",
      "Holding the gate between lifecycle phases, including the decision to stop.",
      "Preparing the launch with marketing, support and training, all of whom need the product before it exists.",
    ],
    accountableFor: [
      "The product solving a problem somebody has, evidenced rather than assumed.",
      "The decisions and their reasoning, in a form that survives the person who made them.",
      "Everything the organisation promised about the product being true when it ships.",
    ],
    measuredOn: [
      "Adoption and revenue, which arrive long after the decisions that caused them.",
      "Delivery against the roadmap that was committed.",
      "Retention and the outcomes customers report.",
    ],
    receivesFrom: [
      { who: "Customers and the field", what: "Problems, described as requests for features." },
      { who: "Engineering", what: "What is possible, at what cost, and what the architecture will resist." },
      { who: "Support and the case volume", what: "Evidence of where the product is failing people, which outranks most opinions." },
    ],
    serves: [
      { who: "Engineering", what: "A clear problem and the reasoning behind its priority." },
      { who: "Sales, marketing and training", what: "Something they can describe accurately." },
      { who: "Customers", what: "A product that changes in the direction of their actual difficulty." },
    ],
    stakeholders: [
      "Every team whose plan depends on the roadmap being roughly true.",
      "Executives whose commitments were made from an earlier version of it.",
      "Customers who bought partly on what was said about the future.",
    ],
    requirements: [
      "Reading evidence about people, which is harder and less exact than reading evidence about systems.",
      "Enough technical depth to be told the truth by engineers and to know when an estimate is a negotiation.",
      "Writing that leaves engineering room to solve the problem rather than to implement a solution.",
      "The nerve to hold a gate closed.",
    ],
    turnsOn:
      "A roadmap is a list of refusals. Every item on it represents many that were declined, and the declining is where the role is actually exercised — most of all at the gate, where stopping something the organisation is already committed to costs more socially than continuing it costs commercially. Product managers who can close a gate produce focused products; those who cannot produce long roadmaps and thin releases, and both look like activity from outside.",
    adjacentRoles: ["network-software-engineer", "product-support-engineer", "systems-engineer", "product-marketing-manager"],
    practiceRoles: ["design", "management"],
    practiceArticles: ["root-cause-is-a-choice", "feeding-the-fix-back", "prevention-that-survives-the-budget"],
    relatedTools: ["digital-transformation-tracker", "network-os-comparer"],
    updated: "2026-08-15",
  },

  {
    slug: "instructional-designer",
    title: "Instructional designer",
    group: "teaches",
    order: 2,
    provenance: {
      kind: "documented",
      sources: [
        { label: "Association for Talent Development - the Talent Development Capability Model, built from research with more than three thousand professionals and setting out twenty-three capabilities across personal, professional and organisational domains", url: "https://www.td.org/capability-model" },
        { label: "TechTrends, Springer - a systematic review applying the ATD Capability Model to one hundred instructional design job postings, finding instructional design, talent delivery and facilitation, technology application, communication, and collaboration and leadership the capabilities named most frequently", url: "https://link.springer.com/article/10.1007/s11528-021-00636-2" },
      ],
    },
    whatItIs:
      "The person who builds the course rather than the person who delivers it. An instructional designer starts from what a learner has to be able to do afterwards and works backwards to the material, the exercises and the assessment. The published study of the field finds design, delivery, technology, communication and collaboration named most often in the job itself, which describes a role that builds and frequently also teaches.",
    theDay: [
      "Writing objectives first: what somebody will be able to do, stated so that it can be assessed.",
      "Designing backwards from those objectives to the exercises that produce the ability.",
      "Building the laboratory environments the exercises assume, which is engineering work inside a teaching job.",
      "Writing assessment that measures the objective rather than the memory of the slide.",
      "Revising from delivery feedback, since a room finds every ambiguity within an hour.",
    ],
    accountableFor: [
      "Objectives that describe a capability rather than a topic.",
      "Material an instructor other than the author can deliver.",
      "Exercises that work in the environment the students actually receive.",
    ],
    measuredOn: [
      "Assessment results against the stated objectives.",
      "Instructor and student evaluation of the material.",
      "Courseware delivered on schedule, and revision cycles completed.",
    ],
    receivesFrom: [
      { who: "Subject matter experts", what: "The technical content, in the form an expert holds it rather than the form a beginner needs." },
      { who: "Instructors", what: "What the room struggled with, which is the highest-value feedback available." },
      { who: "The certification programme", what: "Objectives the course has to cover, where an examination follows." },
    ],
    serves: [
      { who: "Instructors", what: "Material they can teach from, including the parts they would have written differently." },
      { who: "Learners", what: "A route from where they are to what they need to do." },
      { who: "The organisation", what: "Capability that scales past the availability of any one expert." },
    ],
    stakeholders: [
      "The employers paying for the training, who are buying an outcome rather than a week.",
      "The certification body, where a course leads to an examination.",
      "Every future instructor who inherits the material.",
    ],
    requirements: [
      "Enough subject depth to interrogate an expert and notice what they left out.",
      "Writing for a reader who lacks the context the author has.",
      "Patience with revision, since a course is finished by its third delivery rather than its first.",
      "Comfort designing for a room you will never meet.",
    ],
    turnsOn:
      "The objective is written before the content, and everything follows from that order. A course built outward from the material teaches what the author knows; one built backward from an objective teaches what the learner has to be able to do, and the two produce identical-looking slide decks with entirely different results in the room. The discipline is holding the order under time pressure, because the fastest way to produce a course is to write down what you know and call the last slide a summary.",
    adjacentRoles: ["technical-instructor", "knowledge-base-manager", "product-manager"],
    practiceRoles: ["design"],
    practiceArticles: ["documenting-for-the-inheritor", "the-runbook-nobody-can-follow", "knowledge-capture-that-gets-found"],
    relatedTools: ["terminal-stack-explainer", "network-os-comparer"],
    updated: "2026-08-15",
  },

  {
    slug: "product-marketing-manager",
    title: "Product marketing manager",
    group: "makes",
    order: 3,
    provenance: {
      kind: "documented",
      sources: [
        { label: "AIPMM - the Guide to the Product Management and Marketing Body of Knowledge (ProdBOK), whose scope covers the marketing domain alongside the management one, across every phase of the product lifecycle", url: "https://aipmm.com/prodbok" },
        { label: "A survey of the established product frameworks and what each covers, including where product management and product marketing divide", url: "https://productstride.substack.com/p/product-management-frameworks" },
      ],
    },
    whatItIs:
      "The counterpart to product management, facing the other way. Where a product manager decides what gets built, product marketing decides how it is understood: who it is for, which problem it is against, and which alternatives a buyer will weigh it beside. The body of knowledge treats the two as one domain with two halves, which is the most accurate description of how they actually work.",
    theDay: [
      "Positioning: choosing the comparison a buyer will make, which is a decision rather than a description.",
      "Writing the messages, and then the artefacts everybody else repeats them from.",
      "Preparing launches, where the product, the sellers, the partners and the support organisation have to arrive on the same day saying the same thing.",
      "Equipping the field: the material a seller uses in a room where the product manager is absent.",
      "Studying competitors closely enough to describe them fairly, since a caricature loses the deal it was written for.",
    ],
    accountableFor: [
      "Positioning that survives contact with a buyer who has alternatives.",
      "Claims that the product can support, since support inherits everything overstated.",
      "The organisation describing the product consistently across every channel it uses.",
    ],
    measuredOn: [
      "Pipeline influenced, and win rates against named competitors.",
      "Launch execution and the adoption that follows.",
      "Sales enablement: material produced, and material actually used.",
    ],
    receivesFrom: [
      { who: "Product management", what: "What is being built and why, early enough to prepare." },
      { who: "The field and the channel", what: "What buyers actually ask, and where deals are lost." },
      { who: "Customers", what: "The words they use, which outrank the words the company prefers." },
    ],
    serves: [
      { who: "Sales and the channel", what: "A story that holds up under questioning, and the material to tell it with." },
      { who: "Buyers", what: "An accurate account of what the product is for." },
      { who: "Product management", what: "Market evidence, which is the input a roadmap decision is made against." },
    ],
    stakeholders: [
      "Support, who meet every promise afterwards.",
      "The training organisation, whose material carries the same claims into a classroom.",
      "Partners, who repeat the positioning in markets the vendor never enters.",
    ],
    requirements: [
      "Writing plainly about a technical thing for a reader who has ten minutes.",
      "Enough depth to be corrected by an engineer and to argue back where the correction is cosmetic.",
      "Judgement about claims, since the cost of an overstated one lands on somebody else.",
      "Comfort with attribution that stays partial, because influence resists measurement.",
    ],
    turnsOn:
      "Positioning is choosing the competitor set, and that choice decides the argument before it starts. A product placed against the wrong alternative competes on features a buyer has already stopped caring about; placed against the right one, the same product reads as obvious. The work is therefore an act of judgement about the market rather than an act of writing about the product, and it is the part where a good writer with market sense outperforms a better writer without it.",
    adjacentRoles: ["product-manager", "systems-engineer", "account-manager"],
    practiceRoles: ["design", "management"],
    relatedTools: [],
    updated: "2026-08-15",
  },

  {
    slug: "change-manager",
    title: "Change manager",
    group: "runs",
    order: 5,
    provenance: {
      kind: "documented",
      sources: [
        { label: "PeopleCert - ITIL 4 Practitioner: Change Enablement, whose stated purpose is to maximise the number of successful service and product changes by ensuring risks are properly assessed, authorising changes to proceed, and managing the change schedule", url: "https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1/itil-4-practitioner-change-enablement-3794" },
        { label: "An account of the ITIL 4 change enablement practice, including its guidance that in product-focused organisations job titles are not typically adopted for it, because the practice is integrated into the daily activity of product teams and automated wherever possible", url: "https://www.beyond20.com/blog/understanding-change-enablement-practice-itil-4/" },
      ],
    },
    whatItIs:
      "The person who decides what may be done to production, and when. The framework states the purpose exactly: maximise the number of successful changes by assessing risk properly, authorising changes to proceed, and managing the schedule. The word in that sentence carrying the most weight is maximise — the practice exists to let changes happen, with the assessment as the means rather than the object.",
    theDay: [
      "Assessing what is proposed: blast radius, dependencies, the plan to return, and whether the plan has been tried.",
      "Authorising, at whatever level the risk justifies, which for routine work should be automatic.",
      "Holding the schedule, so that two safe changes stop being one unsafe evening.",
      "Reviewing what happened afterwards, especially the changes that succeeded in ways nobody expected.",
      "Adjusting the standard changes list, which is where most of the value is realised.",
    ],
    accountableFor: [
      "Risk assessed at a depth proportionate to the change.",
      "The schedule reflecting what is genuinely happening.",
      "Failed changes being reviewed for their cause rather than for their author.",
    ],
    measuredOn: [
      "Change success rate, and the impact of the ones that failed.",
      "Lead time from request to implementation.",
      "The proportion of changes flowing as standard rather than requiring a meeting.",
    ],
    receivesFrom: [
      { who: "Engineering and operations", what: "The proposal, and the honesty of its risk assessment." },
      { who: "The business", what: "When the service can be disturbed, and when it certainly cannot." },
      { who: "Incident and problem work", what: "The consequences of previous changes, which is the calibration." },
    ],
    serves: [
      { who: "Engineers", what: "A path to production that is predictable and quick for ordinary work." },
      { who: "The business", what: "Change happening at the pace it needs, with the stability it assumes." },
      { who: "Operations", what: "A schedule that keeps unrelated changes out of one another's evening." },
    ],
    stakeholders: [
      "Every user of every service inside the change window.",
      "Auditors, for whom authorisation records are evidence.",
      "The on-call engineer who will meet whatever goes wrong.",
    ],
    requirements: [
      "Technical breadth sufficient to assess risk in systems somebody else built.",
      "The judgement to route routine work through automatically, which requires trusting a category rather than a request.",
      "Nerve to refuse, and the willingness to explain the refusal in terms of the risk rather than of the process.",
      "A blameless instinct in review, since the alternative is accurate proposals becoming optimistic ones.",
    ],
    turnsOn:
      "Two numbers pull opposite ways: change success rate and lead time. A practice tuned only for success reviews everything, and the queue becomes the reason teams stop proposing improvements; one tuned only for speed accumulates the incidents that produce the next review board. The resolution is categorical rather than case by case — deciding which classes of change are standard and letting those flow — and the framework is unusually candid that in product-focused organisations this may be daily practice and automation rather than a job at all.",
    adjacentRoles: ["systems-administrator", "service-desk-analyst", "project-manager"],
    practiceRoles: ["management", "second-line"],
    practiceArticles: ["change-windows-and-rollback-arithmetic", "capture-before-you-change", "what-acceptance-testing-is-for"],
    relatedTools: ["change-blast-radius-mapper", "change-window-runbook-builder", "health-snapshot-comparator"],
    updated: "2026-08-15",
  },

  {
    slug: "management-consultant",
    title: "Management consultant",
    group: "deploys",
    order: 3,
    provenance: {
      kind: "documented",
      sources: [
        { label: "ICMCI - the CMC Competence Framework, the global standard behind the Certified Management Consultant qualification, developed through international professional standards committees since the late 1990s", url: "https://www.imcusa.org/certified-management-consultant/cmc-competence-framework-landing-page/" },
        { label: "IMC USA - the ICMCI competency framework as adopted for the Certified Management Consultant qualification, setting out the knowledge, skills and behaviours across three levels of progression: Early, Advanced and Professional Leader", url: "https://imcusa.org/wp-content/uploads/2023/04/Final_IMCUSA_-_ICMCI_Core_Co.pdf" },
      ],
    },
    whatItIs:
      "The adviser who is paid for judgement rather than for hands. Where a consulting engineer implements a design, a management consultant is engaged to work out what should be done and to make the case for it. The profession has a competence framework and a certification behind it, structured across three levels of progression, which is a useful reminder that advisory work has a standard even where a client is buying a person.",
    theDay: [
      "Establishing the actual question, which is frequently adjacent to the one in the brief.",
      "Gathering evidence inside an organisation whose people have their own view of what the answer should be.",
      "Analysis, and the discipline of following it where it goes.",
      "Presenting to a room where somebody sponsored the engagement and somebody else is implicated by the finding.",
      "Handing over in a way that leaves the client able to act without the consultant present.",
    ],
    accountableFor: [
      "Recommendations that follow from the evidence gathered rather than from the engagement that was sold.",
      "Independence, which is the entire product.",
      "A client left more capable, rather than more dependent.",
    ],
    measuredOn: [
      "Utilisation and fee income.",
      "Recommendations adopted, and the outcomes attributed to them.",
      "Repeat engagements and referrals, which is where the tension sits.",
    ],
    receivesFrom: [
      { who: "The sponsor", what: "The brief, the budget and the political shape of the problem." },
      { who: "The client's staff", what: "How things actually work, offered at whatever candour the situation permits." },
      { who: "The firm", what: "Method, precedent and the people to staff the work." },
    ],
    serves: [
      { who: "The sponsoring executive", what: "A defensible basis for a decision they own." },
      { who: "The client organisation", what: "A view assembled by somebody with no stake in the current arrangement." },
      { who: "The teams who implement", what: "Reasoning clear enough to act on after the consultant leaves." },
    ],
    stakeholders: [
      "The staff whose work the recommendation changes, who were interviewed and rarely decide.",
      "The firm's reputation, which is carried by every engagement.",
      "Whoever inherits the recommendation after the sponsor moves on.",
    ],
    requirements: [
      "Analysis that survives being checked by people who know the domain better.",
      "Writing that separates the finding, the inference and the recommendation.",
      "Composure in a room where the finding is unwelcome to somebody senior.",
      "The independence to say the engagement should end, which is the profession's defining behaviour.",
    ],
    turnsOn:
      "The most valuable advice frequently ends the engagement, and the measurement rewards the engagement continuing. A consultant who finds that the client already has the capability and needs a decision rather than a programme has done the best available work and produced the smallest available invoice. Firms that survive on reputation make room for that outcome and say so at the outset; the profession's own competence framework puts professional behaviour underneath every technical competence for exactly this reason.",
    adjacentRoles: ["network-consulting-engineer", "systems-analyst", "project-manager"],
    practiceRoles: ["design", "management"],
    practiceArticles: ["reading-a-design-you-did-not-write", "assumptions-a-design-never-states", "evidence-that-convinces-next-quarter"],
    relatedTools: ["digital-transformation-tracker", "network-os-comparer"],
    updated: "2026-08-15",
  },

  {
    slug: "problem-manager",
    title: "Problem manager",
    group: "runs",
    order: 6,
    provenance: {
      kind: "documented",
      sources: [
        { label: "PeopleCert - ITIL 4 Practitioner: Problem Management, whose purpose is to reduce the likelihood and impact of incidents by identifying actual and potential causes and managing workarounds and known errors", url: "https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1/itil4-practices-problem-management-3688" },
        { label: "An account of the ITIL 4 problem management practice and its three phases — problem identification, problem control and error control — and how it differs from incident management, which addresses the symptom to restore service", url: "https://www.beyond20.com/blog/an-overview-of-the-itil-4-problem-management-practice/" },
      ],
    },
    whatItIs:
      "The person who asks why the same incident keeps happening. Incident management restores the service; problem management identifies the cause and manages what follows from it. The framework gives the vocabulary precisely: a problem is a cause, or potential cause, of one or more incidents; a known error is a problem whose cause is understood while a permanent fix is outstanding; a workaround is what people use meanwhile.",
    theDay: [
      "Reading incident records for the pattern, which is the identification phase and the one most easily skipped.",
      "Investigating causes across systems owned by teams who each see one part.",
      "Documenting a known error, which delivers value even where the fix is far away or uneconomic.",
      "Managing workarounds so the same one is applied the same way by everybody.",
      "Working proactively: looking for the causes of incidents that have yet to occur.",
    ],
    accountableFor: [
      "Recurring incidents having a record that explains them.",
      "Known errors documented with their workarounds, and reachable by the people who need them.",
      "Causes pursued to a decision, including the decision to accept one.",
    ],
    measuredOn: [
      "Recurrence: the same incident arriving fewer times.",
      "Known errors documented, and workarounds in use.",
      "Problems closed with a permanent fix rather than with a workaround.",
    ],
    receivesFrom: [
      { who: "Incident management and the service desk", what: "The record, and the pattern hiding inside it." },
      { who: "Engineering and vendors", what: "The explanation of a defect, and the release that resolves it." },
      { who: "Change enablement", what: "What was altered, which is where a proportion of causes live." },
    ],
    serves: [
      { who: "Everybody handling incidents", what: "Fewer of them, and a documented answer for the ones that remain." },
      { who: "Users", what: "The interruption that stops arriving every Monday." },
      { who: "Management", what: "Evidence of which underlying faults are costing the most." },
    ],
    stakeholders: [
      "The teams whose systems a cause turns out to sit in.",
      "Vendors, whose defect this frequently becomes.",
      "Finance, since a permanent fix competes for budget with new work.",
    ],
    requirements: [
      "Analysis across boundaries, since a cause rarely respects a team's edges.",
      "Patience with an investigation whose value arrives after it closes.",
      "Writing a known error clearly enough to be usable by somebody under time pressure.",
      "Diplomacy, because the finding usually names a team rather than a machine.",
    ],
    turnsOn:
      "The people best at this work are the people incident management needs most, and only one of those two has a clock on it. That is a structural fact rather than a cultural failing: an incident has a customer waiting and a problem has a spreadsheet, so the resource moves toward the incident every time it is asked to choose. Organisations that get value here protect the time explicitly, and treat a documented known error as a delivered outcome rather than as an investigation that stalled.",
    adjacentRoles: ["change-manager", "service-desk-analyst", "technical-assistance-centre-engineer"],
    practiceRoles: ["second-line", "management"],
    practiceArticles: ["root-cause-is-a-choice", "the-recurrence", "rca-without-a-scapegoat", "symptom-and-cause", "stops-before-you-find-it", "the-fix-you-cannot-prove-worked", "workaround-and-fix"],
    relatedTools: ["incident-timeline-rca-builder", "fault-hypothesis-builder", "health-snapshot-comparator"],
    updated: "2026-08-15",
  },

  {
    slug: "network-operations-specialist",
    title: "Network operations specialist",
    group: "runs",
    order: 7,
    provenance: {
      kind: "documented",
      sources: [
        { label: "CISA - the Network Operations Specialist work role: planning, implementing and operating network services and systems including hardware and virtual environments, with the note that personnel performing it may alternatively be called network administrator, network analyst, network designer, network engineer, network systems engineer or telecommunications specialist", url: "https://www.cisa.gov/careers/work-rolesnetwork-operations-specialist" },
        { label: "Department of Defense - the Network Operations Specialist career pathway, listing the knowledge, skills and abilities in detail, from routing schemas and traffic analysis to contingency and recovery planning", url: "https://dl.dod.cyber.mil/wp-content/uploads/ccp/pdf/441-Network-Operations-Specialist-Career-Pathway.pdf" },
        { label: "SANS - the same work role summarised: deploying and managing network infrastructure, diagnosing connectivity, optimising performance and implementing defences", url: "https://www.sans.org/job-roles/network-operations" },
      ],
    },
    whatItIs:
      "The engineer who runs the network an organisation depends on. The federal work role puts it as planning, implementing and operating network services and systems, and then does something unusually useful: it lists the titles the same work is advertised under — network administrator, network analyst, network designer, network engineer, network systems engineer, telecommunications specialist. One body of work, seven names, which is worth holding on to before comparing two job descriptions.",
    theDay: [
      "Configuring and optimising the switches, routers and the protocols running across them.",
      "Diagnosing connectivity, which begins by establishing whether the network is involved at all.",
      "Monitoring capacity and performance, and planning the growth before it arrives as an incident.",
      "Building and testing the contingency and recovery procedures, which are worth exactly what the last test proved.",
      "Implementing the security practices the network is expected to enforce, since the boundary is made of this equipment.",
    ],
    accountableFor: [
      "The network being available, and being demonstrably available.",
      "Changes to it being deliberate, documented and reversible.",
      "The design keeping pace with what the organisation is asking of it.",
    ],
    measuredOn: [
      "Availability and incident count, which are the visible numbers.",
      "Time to restore, and time to establish where a fault actually sits.",
      "Capacity headroom and change success, which are the numbers that prevent the first two.",
    ],
    receivesFrom: [
      { who: "The service desk and monitoring", what: "Symptoms, described by people whose vocabulary is their own work." },
      { who: "Application and server teams", what: "Requirements, and the conviction that the network is the cause." },
      { who: "Vendors and integrators", what: "Designs, firmware and the support path when the equipment misbehaves." },
    ],
    serves: [
      { who: "Every other technical team", what: "A foundation they can assume, and evidence when they cannot." },
      { who: "The business", what: "Connectivity, which is noticed only in its absence." },
      { who: "Security", what: "Enforcement points, and the visibility that makes detection possible." },
    ],
    stakeholders: [
      "Everyone in the organisation, without exception.",
      "The application owners whose service levels rest on this one.",
      "Auditors, for whom network segmentation is a control rather than a design.",
    ],
    requirements: [
      "Depth in the protocols, since the network is the layer where guesses are expensive.",
      "Method under pressure, because the pressure is highest when the fault is least understood.",
      "Evidence-gathering as a habit: captures, counters and timings kept rather than described.",
      "Patience with being the first suspect, repeatedly.",
    ],
    turnsOn:
      "Every problem in an organisation arrives as a network problem until somebody proves otherwise, which makes proving a negative a large part of the job. That proof is the actual craft: a capture, a counter, a timing that shows the request left and the answer came back, offered quickly enough that the investigation moves on to where the fault really is. Engineers who build the habit of producing that evidence in minutes become the person other teams want in the bridge call; those who assert it instead spend the same hours being doubted.",
    adjacentRoles: ["systems-administrator", "network-consulting-engineer", "service-desk-analyst", "problem-manager"],
    practiceRoles: ["second-line", "field", "design"],
    practiceArticles: ["layer-by-layer", "packet-capture-discipline", "baselines-knowing-what-normal-looks-like", "not-your-problem", "verifying-without-trusting", "bisection", "naming-and-addressing"],
    relatedTools: ["cidr", "mtu-mss", "flow-path-reasoner", "packet-capture-plan-builder", "fault-hypothesis-builder", "network-os-comparer"],
    updated: "2026-08-15",
  },

  {
    slug: "talent-development-manager",
    title: "Talent development manager",
    group: "teaches",
    order: 3,
    provenance: {
      kind: "documented",
      sources: [
        { label: "Association for Talent Development - the Talent Development Capability Model, whose three domains run from personal capability through professional capability to organisational capability, the last covering the work of building capability across an organisation rather than in a room", url: "https://www.td.org/capability-model" },
        { label: "TechTrends, Springer - a systematic review applying the ATD Capability Model to job postings in the field, finding collaboration and leadership among the capabilities named most frequently alongside design and delivery", url: "https://link.springer.com/article/10.1007/s11528-021-00636-2" },
      ],
    },
    whatItIs:
      "The person who decides what an organisation needs to be able to do, and builds the programme that gets it there. The capability model places this in its organisational domain, above the personal and professional ones: designers build courses and instructors deliver them, while this role works out which capability is missing, what it is worth, and how the answer will be recognised when it arrives.",
    theDay: [
      "Assessing capability against what the organisation is trying to do next, which requires knowing both.",
      "Deciding what to build, what to buy, and what to leave alone.",
      "Running the budget, the calendar and the vendors, since most programmes are assembled rather than authored.",
      "Measuring, and defending the measurement, because the useful numbers arrive later than the reporting cycle.",
      "Persuading managers to release people, which is where most programmes actually succeed or stall.",
    ],
    accountableFor: [
      "A programme aimed at capability the organisation genuinely lacks.",
      "Spend that produces something demonstrable.",
      "Learning that reaches the people whose work it changes.",
    ],
    measuredOn: [
      "Completion and attendance, which are easy and shallow.",
      "Assessment and certification outcomes.",
      "Capability and performance change, which is the point and the hardest number to obtain.",
    ],
    receivesFrom: [
      { who: "Business leaders", what: "Where the organisation is going, and what it will need people to do there." },
      { who: "Instructional design and delivery", what: "What is possible to build, and what a room can absorb." },
      { who: "Managers", what: "Where their teams are struggling, described as requests for training." },
    ],
    serves: [
      { who: "Employees", what: "A route to capability they can actually take, inside a working week." },
      { who: "Managers", what: "Teams that can do more without additional headcount." },
      { who: "The organisation", what: "Capability that outlasts the individuals who happen to hold it now." },
    ],
    stakeholders: [
      "Finance, for whom training is a discretionary line and therefore an early candidate for reduction.",
      "The instructors and designers whose work the programme commissions.",
      "The customers served by whoever was trained.",
    ],
    requirements: [
      "Reading an organisation: what it claims to need against what its incidents suggest.",
      "Commercial argument, since the budget is defended annually against work with faster returns.",
      "Judgement about buy against build, which is mostly a judgement about how specific the need is.",
      "Comfort with evidence that arrives after the decision it justifies.",
    ],
    turnsOn:
      "Training is measured on completion and valued for capability, and those are different numbers arriving at different times. A programme optimised for the first fills rooms and reports well; one optimised for the second sends fewer people to longer things and looks quieter for two quarters. Managers who hold that line get asked to justify it, so the durable move is to agree the capability measure with the business in advance and report against it from the beginning.",
    adjacentRoles: ["instructional-designer", "technical-instructor", "security-manager"],
    practiceRoles: ["management", "design"],
    practiceArticles: ["careers-into-support-and-out-of-it", "burnout-in-operations"],
    relatedTools: [],
    updated: "2026-08-15",
  },

  {
    slug: "customer-success-manager",
    title: "Customer success manager",
    group: "sells",
    order: 4,
    provenance: {
      kind: "documented",
      sources: [
        { label: "A revenue-role lexicon defining the customer success manager as the post-sale relationship owner, measured on net revenue retention, logo retention and expansion, and distinct from the account executive who owns new business", url: "https://www.startups.com/lexicon/customer-success-manager" },
        { label: "A business-to-business sales glossary on the role's metrics — gross and net revenue retention, logo churn, health score and time to value — and on its frequently non-closing, light-commercial position", url: "https://www.getchief.com/sales-glossary-terms/customer-success-manager-csm" },
        { label: "An account of how the role has shifted, from a satisfaction function to one carrying retention and expansion targets alongside traditional measures", url: "https://www.csinsider.co/email/customer-success-manager-role", sourceNote: "Unlike most roles in this corpus, customer success has no professional body and no framework definition. That absence is informative rather than a gap: the role is roughly as old as subscription software, and it grew from a commercial change rather than from a discipline. The sources here are industry rather than institutional, and they agree with one another closely enough to be reported." },
      ],
    },
    whatItIs:
      "The person who owns the relationship after the sale closes. Customer success grew out of subscription business, where the revenue arrives in instalments and every one of them is a decision the customer makes again. The role guides onboarding, adoption and expansion, and it is separated deliberately from support, which is reactive, and from the account executive, who owns new business.",
    theDay: [
      "Onboarding: getting a customer to their first real outcome, since the time that takes predicts everything afterwards.",
      "Watching adoption across a portfolio, which runs from a handful of strategic accounts to several hundred at the lighter end.",
      "Reading health signals early enough to act, rather than at the renewal conversation.",
      "Connecting product capability to what the customer is actually trying to achieve this year.",
      "Preparing the renewal long before it arrives, so it becomes a formality rather than a negotiation.",
    ],
    accountableFor: [
      "Customers reaching the outcome they bought the product for.",
      "Risk surfaced while there is still time to change it.",
      "The account's story being accurate internally, including where it is going badly.",
    ],
    measuredOn: [
      "Net revenue retention, which combines renewal, expansion, contraction and churn into one number.",
      "Gross retention and logo churn.",
      "Adoption depth, health score and time to value.",
    ],
    receivesFrom: [
      { who: "Sales", what: "The account, and whatever expectations were set to win it." },
      { who: "The product's telemetry", what: "What the customer actually uses, which is frequently different from what they say." },
      { who: "Support", what: "The friction, arriving as tickets before it arrives as sentiment." },
    ],
    serves: [
      { who: "The customer's sponsor", what: "Progress toward the outcome they are accountable for internally." },
      { who: "The vendor", what: "Retention, which in subscription business is most of the revenue." },
      { who: "Product management", what: "Evidence of where adoption stalls, which is a roadmap input with numbers attached." },
    ],
    stakeholders: [
      "The customer's end users, whose experience decides adoption regardless of the sponsor's enthusiasm.",
      "Finance on both sides, for whom the renewal is a forecast line.",
      "Support and professional services, whose work shapes the health this role reports.",
    ],
    requirements: [
      "Reading an account: usage, sentiment and the organisational change nobody mentioned.",
      "Enough product depth to advise rather than to schedule a call with somebody who can.",
      "Commercial literacy, since the conversation ends in a renewal whether or not the role closes it.",
      "The candour to record an account as at risk while the relationship still feels warm.",
    ],
    turnsOn:
      "Satisfaction and retention are different measurements, and the distance between them is the job. A customer can be entirely happy and still leave, because their priorities moved and nobody on the vendor side noticed — which makes the useful question whether the customer is achieving outcomes that justify continued investment, rather than whether they are pleased. Managers who ask the second question find the risk in time; those who ask the first find it at the renewal.",
    adjacentRoles: ["account-manager", "technical-assistance-centre-engineer", "product-manager"],
    practiceRoles: ["management"],
    practiceArticles: ["the-customer-who-is-furious-and-correct", "prevention-that-survives-the-budget"],
    relatedTools: [],
    updated: "2026-08-15",
  },

  {
    slug: "sales-development-representative",
    title: "Sales development representative",
    group: "sells",
    order: 5,
    provenance: {
      kind: "documented",
      sources: [
        { label: "A revenue-role lexicon distinguishing the top-of-funnel development role from the account executive who closes new business and the customer success manager who owns the account afterwards", url: "https://www.startups.com/lexicon/customer-success-manager" },
        { label: "A business-to-business sales glossary describing how the revenue organisation divides between prospecting, closing and retention roles", url: "https://www.getchief.com/sales-glossary-terms/customer-success-manager-csm", sourceNote: "As with customer success, this role is defined by industry practice rather than by a professional body. The division of the revenue organisation into prospecting, closing and retention is recent and commercial in origin, which is why the sources are trade rather than institutional." },
      ],
    },
    whatItIs:
      "The first human contact between a company and a prospective customer. Sales development sits at the top of the funnel: researching accounts, reaching out, qualifying interest, and handing over a conversation that somebody else will close. The role exists because prospecting and closing reward different temperaments and different hours, and separating them lets each be done properly.",
    theDay: [
      "Researching accounts well enough that the first message is about them rather than about the product.",
      "Outreach at volume, across whichever channels currently reach people.",
      "Qualifying: establishing whether there is a problem, a budget and a reason to act now.",
      "Handing over to the closing seller with enough context that the prospect avoids repeating themselves.",
      "Recording what happened, since the pattern across hundreds of attempts is the useful output.",
    ],
    accountableFor: [
      "Meetings that are genuinely qualified, rather than meetings that fill a calendar.",
      "The record being accurate, since the next person works from it.",
      "Representing the company in the first impression it makes.",
    ],
    measuredOn: [
      "Qualified meetings booked, and the proportion that progress.",
      "Activity: attempts, connections, conversations.",
      "Pipeline generated, and eventually the revenue attributed to it.",
    ],
    receivesFrom: [
      { who: "Marketing", what: "Leads, campaigns and the reason somebody might already be interested." },
      { who: "Sales leadership", what: "The territory, the target accounts and the current priority." },
      { who: "The closing sellers", what: "What a good meeting looks like, which is learned rather than briefed." },
    ],
    serves: [
      { who: "Account executives", what: "Conversations with people who have a reason to have them." },
      { who: "The company", what: "Pipeline, which is the input everything downstream depends on." },
      { who: "Prospects", what: "A route to somebody who can answer, at the moment the question is live." },
    ],
    stakeholders: [
      "Everybody who receives the outreach, most of whom did not ask for it.",
      "The brand, which is shaped by how the first contact reads.",
      "The forecast, which begins here.",
    ],
    requirements: [
      "Resilience, since the role is built on a low response rate by design.",
      "Research, because relevance is the whole difference between contact and noise.",
      "Brevity in writing, held under pressure to say more.",
      "Discipline with the record, since the value compounds across attempts rather than within one.",
    ],
    turnsOn:
      "Activity and qualification pull against each other. A representative measured purely on meetings books meetings, and the closing seller spends the following month discovering which ones were real; one measured on meetings that progress works slower and hands over conversations worth having. The organisations that get this right define qualification jointly with the sellers who receive the work, which turns a handover into an agreement rather than a transfer.",
    adjacentRoles: ["account-manager", "customer-success-manager", "channel-account-manager"],
    practiceRoles: ["management"],
    relatedTools: [],
    updated: "2026-08-15",
  },

  {
    slug: "developer-advocate",
    title: "Developer advocate",
    group: "teaches",
    order: 4,
    provenance: {
      kind: "documented",
      sources: [
        { label: "A survey of developer relations roles, placing the advocate at the intersection of customer success and product: writing sample code and reference integrations, running office hours, answering in community channels, filing detailed bug reports, and turning recurring developer pain into product proposals", url: "https://www.moesif.com/blog/developer-relations/definition/What-is-Developer-Relations-and-What-are-Common-Roles/" },
        { label: "An account of developer relations as the umbrella term for the team building a community online and offline, covering advocacy, developer experience, events, community management and content", url: "https://www.marythengvall.com/blog/2019/5/22/what-is-developer-relations-and-why-should-you-care" },
        { label: "A practitioner guide to developer relations, including internal advocacy — representing the developer's voice inside the company — as a core function alongside content, speaking and community engagement", url: "https://www.jonobacon.com/2023/04/02/what-is-developer-relations-devrel-a-complete-guide/", sourceNote: "Developer relations has no professional body and no framework definition; its literature is written by practitioners. The titles vary across companies — developer advocate, developer evangelist, developer programs manager, developer experience engineer — for work that overlaps heavily, which is the same pattern the federal work-role material records for network operations." },
      ],
    },
    whatItIs:
      "The engineer employed by a vendor whose work serves the people who use its technology. Advocacy sits inside developer relations, the broader function covering community, events, experience and content, and the advocate is its technical face: writing sample code, building reference integrations, answering in public channels, and carrying what the community says back into product and engineering.",
    theDay: [
      "Writing sample code and reference integrations that show the product doing something real.",
      "Answering in public — forums, chat, issues — where the answer stays available to everybody who arrives later.",
      "Speaking and running workshops, which is teaching to a room that chose to attend.",
      "Filing the detailed bug report that a frustrated user would have abandoned.",
      "Internal advocacy: carrying the community's difficulty into the company, in terms product and engineering can act on.",
    ],
    accountableFor: [
      "Technical accuracy in public, under a company name.",
      "The community's difficulties reaching the people who can resolve them.",
      "Material that continues to work after the release it was written against.",
    ],
    measuredOn: [
      "Adoption signals: sign-ups, integrations built, documentation and sample usage.",
      "Community activity and sentiment.",
      "Product changes traceable to feedback the role carried, which is the honest measure and the hardest to attribute.",
    ],
    receivesFrom: [
      { who: "The developer community", what: "Questions, complaints and the workarounds they invented without being asked." },
      { who: "Product and engineering", what: "What is coming, and the reasoning behind what is already there." },
      { who: "Support", what: "The recurring case, which is community difficulty already quantified." },
    ],
    serves: [
      { who: "External developers", what: "A route to making the product work, and somebody who answers." },
      { who: "Product management", what: "Field evidence with the vocabulary of the people who hit the problem." },
      { who: "The company", what: "Adoption built on capability rather than on persuasion." },
    ],
    stakeholders: [
      "The wider community, including the people who never post and read everything.",
      "Marketing, whose messages the advocate's credibility either supports or contradicts.",
      "Engineering, whose backlog receives what the advocate carries.",
    ],
    requirements: [
      "Engineering ability, since credibility comes from building the thing rather than describing it.",
      "Writing and speaking for an audience that will check the claims.",
      "The willingness to say a product does something partially, in public, on the company's account.",
      "Comfort with a contribution that is visible everywhere and attributable almost nowhere.",
    ],
    turnsOn:
      "The role is paid by one side and useful to the other, and the value depends entirely on the community believing the second part. That belief is built by the unglamorous half: filing the bug, saying plainly where the product falls short, and returning later with what changed. Advocates who do that are trusted and their companies benefit; the internal half of the job is what makes the external half true, which is why measuring only outbound activity produces a function that gradually stops working.",
    adjacentRoles: ["technical-instructor", "product-manager", "instructional-designer", "community-manager"],
    practiceRoles: ["field", "design"],
    practiceArticles: ["feeding-the-fix-back", "problem-report-intake", "knowledge-capture-that-gets-found"],
    relatedTools: ["curl-command-builder", "http-request-translator", "jwt"],
    updated: "2026-08-15",
  },

  {
    slug: "community-manager",
    title: "Community manager",
    group: "teaches",
    order: 5,
    provenance: {
      kind: "documented",
      sources: [
        { label: "A guide to developer relations describing the community manager as responsible for fostering the community around a company's products: organising meetups, managing online forums and running events", url: "https://dev.to/george_udonte/decoding-developer-relations-a-comprehensive-guide-to-devrel-4dfp" },
        { label: "An account of developer relations as an umbrella covering advocacy, developer experience, events, community management and content, with community building as the team's primary responsibility", url: "https://www.marythengvall.com/blog/2019/5/22/what-is-developer-relations-and-why-should-you-care", sourceNote: "As with developer advocacy, community management in technology has no professional body; the practice is documented by practitioners rather than certified by an institution. The role also exists well outside technology, and the sources here describe its technical form." },
      ],
    },
    whatItIs:
      "The person who tends the space where users of a technology meet each other. Where an advocate teaches and carries feedback, a community manager builds the conditions in which people help one another: the forum, the meetups, the events, the norms, and the recognition that keeps contributors contributing. The output is a group of people who would continue without the company, which is both the goal and the risk.",
    theDay: [
      "Moderating, which is mostly invisible and entirely load-bearing.",
      "Recognising contributors, since attention is the currency a volunteer community actually runs on.",
      "Running events and meetups, online and in person.",
      "Connecting people who have a question to people who solved it, rather than answering everything centrally.",
      "Reporting sentiment inward, including the parts the company finds unwelcome.",
    ],
    accountableFor: [
      "The space staying usable: on topic, civil and worth returning to.",
      "Norms that are applied evenly, including to people the company values commercially.",
      "An accurate account of what the community thinks, rather than a comfortable one.",
    ],
    measuredOn: [
      "Active participation, and the proportion of questions answered by members rather than by staff.",
      "Retention of contributors, and new ones arriving.",
      "Event attendance and the activity that follows it.",
    ],
    receivesFrom: [
      { who: "The community", what: "Everything, including the parts posted at two in the morning." },
      { who: "Advocacy and support", what: "Technical answers, and the recurring questions worth addressing structurally." },
      { who: "The company", what: "Programmes, budget and whatever it hopes the community will do." },
    ],
    serves: [
      { who: "Community members", what: "A place where their question gets a real answer and their contribution is noticed." },
      { who: "The company", what: "A relationship with its users that survives individual staff and individual releases." },
      { who: "New arrivals", what: "A path from lurking to contributing." },
    ],
    stakeholders: [
      "Long-standing contributors, whose goodwill is the community's actual capital.",
      "Marketing, which frequently wants to use the space for messages.",
      "Legal and trust functions, where moderation meets conduct.",
    ],
    requirements: [
      "Even handling of people, sustained over years rather than campaigns.",
      "Judgement about when to intervene and when to let a thread resolve itself.",
      "Enough technical grounding to tell a substantive disagreement from a personal one.",
      "The standing to tell the company that a plan would damage the trust it depends on.",
    ],
    turnsOn:
      "A community succeeds when members answer each other, and that success looks like the company doing less. Every intervention that resolves a question centrally is a question the community stopped needing to answer, so the discipline is restraint: connecting people, recognising the ones who help, and leaving room for an answer to arrive from somebody with no badge. Managers who hold that line build something that outlasts them, and have to explain the quieter numbers meanwhile.",
    adjacentRoles: ["developer-advocate", "technical-instructor", "knowledge-base-manager"],
    practiceRoles: ["field"],
    practiceArticles: ["the-queue-as-a-psychological-object", "working-with-people-who-are-frightened"],
    relatedTools: [],
    updated: "2026-08-15",
  },

  {
    slug: "penetration-tester",
    title: "Penetration tester",
    group: "defends",
    order: 8,
    provenance: {
      kind: "documented",
      sources: [
        { label: "ISACA - the penetration tester profile: testing the effectiveness of security defences by mimicking the actions of real attackers, typically within the bounds of agreed rules of engagement", url: "https://www.isaca.org/career-center/career-journey/vulnerability-discovery-and-assessment/penetration-tester" },
        { label: "Canadian Centre for Cyber Security - the penetration tester profile in the national cyber security skills framework, describing it as a tier two or three position normally preceded by three to five years in security operations, and naming the consequence of poor judgement: vulnerabilities mis-identified or missed", url: "https://www.cyber.gc.ca/en/education-community/academic-outreach-cyber-skills-development/canadian-cyber-security-skills-framework/penetration-tester" },
        { label: "CISA - the Vulnerability Assessment Analyst work role, whose skills include conducting vulnerability scans, using penetration testing tools and techniques, and conducting application vulnerability assessments", url: "https://www.cisa.gov/careers/work-rolesvulnerability-assessment-analyst" },
      ],
    },
    whatItIs:
      "The specialist who tests defences by behaving like an attacker, inside an agreement that says exactly what is permitted. The national skills framework places it at the second or third tier, normally reached after several years in security operations, which is worth stating because the role is frequently imagined as an entry point and is in practice an advanced one.",
    theDay: [
      "Reading the scope and the rules of engagement until both are unambiguous, since everything afterwards depends on them.",
      "Reconnaissance, scanning and enumeration, which is most of the time and produces most of the findings.",
      "Exploiting what was found, to establish impact rather than to demonstrate cleverness.",
      "Documenting as it happens, because a finding reproduced two weeks later from memory is a finding somebody will dispute.",
      "Writing the report, which is the deliverable the client actually buys.",
    ],
    accountableFor: [
      "Staying inside the authorised scope, at every moment.",
      "Findings that are real, reproducible and ranked by what they would cost this organisation.",
      "A report that the people who have to fix things can act on.",
    ],
    measuredOn: [
      "Findings of genuine severity, rather than volume.",
      "Engagements delivered to the statement of work.",
      "Remediation that follows, which belongs to somebody else and reflects the report's quality.",
    ],
    receivesFrom: [
      { who: "The client", what: "Scope, rules of engagement, and the authorisation that makes the work lawful." },
      { who: "Threat intelligence and research", what: "Techniques currently in use, which is what makes the simulation realistic." },
      { who: "Previous reports", what: "What was found last time, and what happened to it." },
    ],
    serves: [
      { who: "The defenders", what: "Evidence of what an adversary could reach, obtained safely." },
      { who: "Leadership", what: "A view of exposure grounded in demonstration rather than in inventory." },
      { who: "The vulnerability management function", what: "The starting list, which they then carry over time." },
    ],
    stakeholders: [
      "Everybody whose systems are in scope, most of whom learn about it afterwards.",
      "Legal, since authorisation is what separates this work from the offence it resembles.",
      "The teams whose weekend a critical finding will occupy.",
    ],
    requirements: [
      "Depth across systems, networks and applications, and the patience for the unglamorous enumeration that precedes anything interesting.",
      "Precision with scope, held under the temptation of an interesting path leading outside it.",
      "Writing that an engineer can act on and an executive can weigh, in the same document.",
      "Judgement about impact, since a technically real finding with no consequence spends attention a serious one needed.",
    ],
    turnsOn:
      "The technical work is shared with the adversary; the authorisation is what makes it a profession. Scope, rules of engagement and the discipline to stay inside them are the whole distinction, and they are also what makes the findings usable — a test conducted where somebody agreed it would be produces a report the organisation can act on, while anything obtained outside that boundary creates a problem rather than a finding. The good ones treat the scope document as the first deliverable rather than as paperwork preceding the real work.",
    adjacentRoles: ["vulnerability-analyst", "incident-responder", "security-operations-analyst"],
    practiceRoles: ["second-line", "design"],
    practiceArticles: ["building-an-evidence-pack", "evidence-that-convinces-next-quarter", "what-to-capture-before-you-know"],
    relatedTools: ["ssrf-url-classifier", "ognl-injection-decoder", "user-agent-entropy-analyzer", "xml-decoder", "secure-headers"],
    updated: "2026-08-15",
  },

  {
    slug: "it-auditor",
    title: "IT auditor",
    group: "defends",
    order: 9,
    provenance: {
      kind: "documented",
      sources: [
        { label: "ISACA - the IT audit management career area, and the Certified Information Systems Auditor credential established in 1978 as the standard for those who audit and assess an organisation's information technology", url: "https://www.isaca.org/career-center/career-journey/it-audit-management" },
        { label: "ISACA - the IT audit manager profile, covering the pre-planning, planning, fieldwork and reporting phases of an engagement, and the documentation of control strengths, weaknesses and gaps", url: "https://www.isaca.org/career-center/career-journey/it-audit-management/it-audit-manager" },
        { label: "ISACA - ITAF, the framework establishing standards for audit and assurance practitioners' roles, ethics, expected professional behaviour and required knowledge, alongside COBIT for the governance of enterprise technology", url: "https://www.isaca.org/career-center/career-journey/it-audit-management/it-audit-director" },
      ],
    },
    whatItIs:
      "The person who establishes whether the controls an organisation believes it has are actually there and actually working. Audit runs as an engagement — planning, fieldwork, reporting — and produces evidence rather than opinion. The profession has its own framework of standards covering not only method but ethics and expected behaviour, which exists because the value of the finding rests entirely on the independence of whoever produced it.",
    theDay: [
      "Planning an engagement against objectives that connect to what the organisation is actually exposed to.",
      "Fieldwork: sampling, testing, and asking for the evidence rather than the assurance.",
      "Documenting control strengths, weaknesses and gaps, in workpapers another auditor could follow.",
      "Discussing findings with the people they concern, before the report reaches anybody above them.",
      "Reporting, and then following up on what was agreed and what actually changed.",
    ],
    accountableFor: [
      "Findings supported by evidence that survives being disputed.",
      "Workpapers complete enough for a reviewer to reach the same conclusion.",
      "Independence, maintained visibly as well as actually.",
    ],
    measuredOn: [
      "The audit plan delivered, and coverage across the estate.",
      "Findings accepted, and remediation completed rather than agreed.",
      "Regulatory and external audit outcomes, where internal work is examined by someone else.",
    ],
    receivesFrom: [
      { who: "The teams under review", what: "Evidence, at whatever completeness their day allows." },
      { who: "The audit committee or board", what: "The mandate, and the plan's priorities." },
      { who: "Risk and compliance functions", what: "The obligations the organisation is being measured against." },
    ],
    serves: [
      { who: "The board", what: "An independent view of whether the controls described in the reporting exist." },
      { who: "Management", what: "Findings early enough to fix before somebody external arrives." },
      { who: "The teams audited", what: "A written basis for the investment they have been requesting." },
    ],
    stakeholders: [
      "Regulators and external auditors, who read the same estate afterwards.",
      "Customers, whose data the controls exist to protect.",
      "Every engineer whose weekend a finding turns into remediation.",
    ],
    requirements: [
      "Method: sampling, evidence and the discipline to test rather than to accept.",
      "Technical literacy across the estate, sufficient to know what evidence would look like.",
      "Writing that states a finding, its basis and its consequence separately.",
      "The independence to record a finding about a team whose cooperation the next engagement needs.",
    ],
    turnsOn:
      "Independence is the product, and it is spent by helpfulness. An auditor who begins designing the fix becomes an adviser to the thing they will later examine, and the next report carries their own recommendation as its subject — which is why the profession puts ethics and expected behaviour into the same framework as method. The useful position is close enough to understand the estate and separate enough that the finding still means something, and holding it takes deliberate effort in every friendly conversation.",
    adjacentRoles: ["security-leader", "vulnerability-analyst", "systems-analyst", "management-consultant"],
    practiceRoles: ["management", "design"],
    practiceArticles: ["evidence-that-convinces-next-quarter", "verifying-without-trusting", "documenting-for-the-inheritor"],
    relatedTools: ["cvss-vector-decoder", "x509", "cert-renewal-planner", "secure-headers"],
    updated: "2026-08-15",
  },
]);

/** Roles in a group, ordered. */
export function rolesInGroup(group: RoleGroup): Role[] {
  return ROLES.filter((r) => r.group === group).sort((a, b) => a.order - b.order);
}

/** Look one up. */
export function findRole(slug: string): Role | undefined {
  return ROLES.find((r) => r.slug === slug);
}

/**
 * Roles that name this one as somewhere their holders go, computed rather than
 * maintained.
 *
 * *** PART II OF THE ENRICHMENT ROUND, SOLVED MECHANICALLY (2026-08-15) ***
 *
 * The link guard found 115 adjacency claims and only 13 mutual pairs. The
 * obvious repair — making every claim symmetric — is the wrong one: the
 * technical assistance centre is named by eight roles and would end up with
 * eleven links, which helps nobody.
 *
 * ADJACENCY IS DIRECTIONAL. "Where it leads" is a claim about movement from
 * here, and a hub being named by many is correct rather than an omission. So
 * the reverse view is DERIVED at render time: every page shows where it leads
 * AND who leads here, without either list being maintained by hand.
 *
 * That is the whole of the reverse-link problem for this corpus: forward links
 * are written by whoever writes the page, and nobody writes the backward ones,
 * so the backward ones are computed instead.
 */
export function rolesLeadingHere(slug: string): Role[] {
  return ROLES.filter((r) => r.adjacentRoles.includes(slug)).sort((a, b) =>
    a.title.localeCompare(b.title),
  );
}

/**
 * Roles that name a given practice article, and roles that name a given tool.
 *
 * *** THE CROSS-CORPUS REVERSE LINKS, DERIVED (2026-08-15) ***
 *
 * The Practice and the tool catalogue hold no role field, and adding one to
 * each would mean maintaining the same relation in two places and watching them
 * disagree. They do not need to: a role already states which articles and tools
 * belong to it, so the reverse view is a filter over that.
 *
 * The same move as rolesLeadingHere(), applied across corpora rather than
 * within one: THE FORWARD CLAIM IS WRITTEN ONCE AND EVERY DIRECTION IS READ
 * FROM IT.
 */
export function rolesUsingPracticeArticle(articleSlug: string): Role[] {
  return ROLES.filter((r) => (r.practiceArticles ?? []).includes(articleSlug)).sort(
    (a, b) => a.title.localeCompare(b.title),
  );
}

export function rolesUsingTool(toolSlug: string): Role[] {
  return ROLES.filter((r) => r.relatedTools.includes(toolSlug)).sort((a, b) =>
    a.title.localeCompare(b.title),
  );
}

/** How many of each provenance kind — used by the section page. */
export function provenanceCounts(): Record<Provenance, number> {
  return ROLES.reduce(
    (acc, r) => ({ ...acc, [r.provenance.kind]: acc[r.provenance.kind] + 1 }),
    { held: 0, alongside: 0, documented: 0 } as Record<Provenance, number>,
  );
}

// ============================================================================
// LEVELS — the axis that runs across every role in this corpus.
//
// A grade is orthogonal to a role. The same title exists at four grades, and
// the same grade exists across every group on the path, so levels are modelled
// separately rather than multiplied into the roster.
//
// *** WHAT ACTUALLY CHANGES BETWEEN GRADES ***
//
//   The size of the question you are handed.
//
// The volume of work is roughly constant across a career. What moves is how
// much of the problem arrives already decided: a defined task, a known problem,
// an undefined problem, or a problem the organisation has yet to name.
//
// *** AND THE NAMING ASYMMETRY WORTH RECORDING ***
//
// Brazilian practice names all three grades: junior, PLENO, senior. Many
// English-speaking markets name the first and the third, leaving the middle
// grade to be described by what a person has stopped being. `pleno` is the more
// useful word because it states the thing directly: full, complete, working
// unsupervised on known problems.
// ============================================================================

export interface Grade {
  id: string;
  /** What it is commonly called, across markets. */
  names: string[];
  /** The size of question handed to somebody at this grade. */
  question: string;
  /** What supervision looks like here. */
  supervision: string;
  /** What the grade is trusted with beyond its own output. */
  beyondOwnWork: string;
}

export const GRADES: readonly Grade[] = Object.freeze([
  {
    id: "junior",
    names: ["junior", "associate", "I", "júnior"],
    question: "A defined task, with the approach already chosen and the outcome already described.",
    supervision: "Work is reviewed before it reaches anything that matters, and the review is part of the design rather than a comment on the person.",
    beyondOwnWork: "Learning the environment, and asking the questions whose answers everyone else has stopped noticing they know.",
  },
  {
    id: "pleno",
    names: ["pleno", "mid-level", "II", "intermediate"],
    question: "A known problem, handed over whole. The approach is chosen by whoever solves it.",
    supervision: "Work lands without review. Help is requested rather than scheduled.",
    beyondOwnWork: "Carrying a piece of the estate, and being the person a junior asks first.",
  },
  {
    id: "senior",
    names: ["senior", "III", "sênior"],
    question: "An undefined problem, frequently one where the first job is establishing what the problem is.",
    supervision: "Judgement is trusted in situations the organisation has no procedure for.",
    beyondOwnWork: "Other people's work landing: reviewing designs, unblocking, and the mentoring that is rarely written into the job description and always expected.",
  },
  {
    id: "staff",
    names: ["staff", "principal", "distinguished", "fellow", "specialist"],
    question: "A problem the organisation has yet to name, or one that spans more teams than any single manager owns.",
    supervision: "The work sets direction that others then follow.",
    beyondOwnWork: "Standards, architecture and the technical decisions whose consequences arrive years later.",
  },
]);

/**
 * THE Y MOMENT — the fork. Below it, everyone advances the same way; at it, the
 * ladder splits into a management arm and a technical arm.
 *
 * Recorded here because it is the single most consequential career decision in
 * this industry and it is usually made under pressure, at short notice, from a
 * position of flattery.
 */
export const Y_MOMENT = Object.freeze({
  whatItIs:
    "The point where one ladder becomes two. Up to senior, advancement looks the same for everybody: larger questions, more trust. At the fork, the organisation offers a choice between growing through other people and growing through the craft, and the two arms lead to different lives.",
  managementArm: Object.freeze([
    "The work becomes other people's work: hiring, developing, protecting, deciding, and carrying accountability for outcomes produced by hands other than yours.",
    "Technical depth becomes a foundation rather than a daily practice, and it ages.",
    "The satisfaction moves from solving the thing to watching somebody else solve it.",
  ]),
  technicalArm: Object.freeze([
    "The work stays technical and the scope widens: architecture, standards, and the problems that span teams.",
    "Influence is exercised through designs and decisions rather than through reporting lines.",
    "The arm's length depends entirely on the organisation, which is the part worth checking before choosing it.",
  ]),
  theHonestPart:
    "The two arms are equal in principle and unequal in many organisations. Where the technical arm stops at senior while the management arm continues to director, the choice has already been made for anyone who wants to be paid more — and capable engineers become reluctant managers, which costs the organisation twice. Asking how long the technical arm is, and who is currently at the top of it, tells you more than any statement of values.",
});

/**
 * WHERE THESE ROLES ARE FOUND. The corpus is organised by the path a product
 * takes, and that path runs through every sector rather than through a
 * technology industry sitting beside the others.
 */
export const PERVASIVENESS = Object.freeze({
  claim:
    "Every organisation of any size now runs infrastructure, and therefore contains these roles. A bank employs network engineers, a hospital employs security analysts, a supermarket chain employs a service desk, a farm employs somebody who owns the connectivity between the silos and the office.",
  consequence:
    "That has two effects worth naming. The first is that the same job title carries different weight in different sectors: a network engineer in a hospital works under constraints a retailer never meets. The second is that the technology industry is no longer where most technology workers are employed — the vendors, distributors and integrators on this path are a minority of the people doing the work described here.",
});
