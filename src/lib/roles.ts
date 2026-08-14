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
  sources?: { label: string; url: string }[];
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
    provenance: { kind: "held", where: "at a vendor, on a carrier account", when: "2009-2010" },
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
    relatedTools: ["network-os-comparer"],
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
      "Evangelising: making the case for a technology to engineers who have a working alternative and a reason to keep it.",
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
    relatedTools: [],
    updated: "2026-08-14",
  },

  // --- DEPLOYS -------------------------------------------------------------
  {
    slug: "network-consulting-engineer",
    title: "Network consulting engineer",
    group: "deploys",
    order: 1,
    provenance: { kind: "held", where: "at integrators", when: "2010-2011, 2013-2014, 2020" },
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
    adjacentRoles: ["systems-engineer", "field-network-engineer", "technical-instructor"],
    practiceRoles: ["field", "design", "second-line"],
    relatedTools: ["fortios-cli-config-explainer", "f5os-tenant-config-explainer"],
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
    relatedTools: ["terminal-stack-explainer"],
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
    adjacentRoles: ["technical-assistance-centre-engineer", "field-network-engineer", "high-touch-operations-manager"],
    practiceRoles: ["second-line"],
    relatedTools: ["f5-eth-trailer-decoder", "fortios-flow-debug-builder"],
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
    relatedTools: [],
    updated: "2026-08-14",
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
    adjacentRoles: ["systems-engineer", "channel-systems-engineer", "product-support-engineer"],
    practiceRoles: ["field", "design", "second-line"],
    relatedTools: ["network-os-comparer", "terminal-stack-explainer"],
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
    adjacentRoles: ["systems-engineer", "channel-systems-engineer"],
    practiceRoles: ["management"],
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
    relatedTools: [],
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
      "The engineer a customer reaches when they contact the vendor. A technical assistance centre runs a queue against a clock, in tiers, around the world, and the role is the first place a fault becomes somebody's named responsibility. It is the largest single population of engineers most vendors employ, and the one that meets the product most often. This is the second line; what it escalates goes to third-line product support, and from there to the developers.",
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
    relatedTools: ["fortios-flow-debug-builder", "f5-eth-trailer-decoder"],
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
    relatedTools: ["sse-architecture-explainer"],
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
    adjacentRoles: ["security-operations-analyst", "technical-assistance-centre-engineer"],
    practiceRoles: ["second-line", "management"],
    relatedTools: [],
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
    adjacentRoles: ["security-operations-analyst", "incident-responder"],
    practiceRoles: ["second-line", "design"],
    relatedTools: [],
    updated: "2026-08-14",
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

/** How many of each provenance kind — used by the section page. */
export function provenanceCounts(): Record<Provenance, number> {
  return ROLES.reduce(
    (acc, r) => ({ ...acc, [r.provenance.kind]: acc[r.provenance.kind] + 1 }),
    { held: 0, alongside: 0, documented: 0 } as Record<Provenance, number>,
  );
}
