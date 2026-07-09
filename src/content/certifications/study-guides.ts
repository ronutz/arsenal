// ============================================================================
// src/content/certifications/study-guides.ts
// ----------------------------------------------------------------------------
// CANDIDATE STUDY-AID DATA MODEL (the repurposed /certifications section).
//
// This is the DATA SPINE for the candidate-facing study guides. Each guide maps
// the PUBLISHED objectives of a vendor exam blueprint to legitimate learning
// resources already on this site (Learn/KB articles + tools) plus the official
// vendor manual pages.
//
// HARD ETHICS GUARDRAIL (non-negotiable): these guides map published blueprint
// OBJECTIVES (public vendor information) to learning resources. They must NEVER
// contain, paraphrase, collect, or link to actual exam questions, answers, or
// "brain dumps." Dumps violate every vendor's certification agreement and would
// endanger Rodolfo's standing as an authorized instructor. The guides help
// candidates LEARN the material, never shortcut the exam.
//
// SOURCING: the verbatim objective text and section structure of each exam come
// from the OFFICIAL blueprint (relayed by PRIME from MyF5), never reconstructed
// from memory. Until a blueprint is relayed a guide sits in `status: "preparing"`
// with empty `sections`, and the page renders an honest "in preparation" state.
//
// The exam names and codes below ARE verified from official F5 Education Services
// sources (2026-07-09): the F5 Certified Administrator, BIG-IP (F5-CA) credential
// is earned by passing five exams (F5CAB1-F5CAB5), which replaced the retired 101
// (Application Delivery Fundamentals, retired 2025-04-30) and 201 (TMOS
// Administration) exams. A single renewal exam (F5CABR) refreshes an existing
// F5-CA. See https://support.education.f5.com/hc/en-us/articles/37607208476059
// ============================================================================

/** One official manual page. When an exam targets a known older product version
 *  than the current docs, a guide links BOTH the latest page (`version: null`)
 *  and the version-specific page, with a disclaimer. */
export interface ManualLink {
  label: string;
  url: string;
  /** The product version this page documents, or null for "latest". */
  version: string | null;
}

/** One blueprint objective and its mapped learning resources. */
export interface Objective {
  /** Stable id, unique within its section (e.g. "1.01"). */
  id: string;
  /** Verbatim objective text from the official blueprint (official language). */
  text: string;
  /** Learn/KB article slugs that teach this objective. */
  relatedArticles: string[];
  /** Catalogue tool slugs that exercise this objective. */
  relatedTools: string[];
  /** Official vendor manual page(s). */
  manualLinks: ManualLink[];
  /** True when no internal article covers this objective yet (renders an
   *  honest "article coming" marker and seeds the Learn backlog). */
  gap?: boolean;
}

/** A blueprint section grouping related objectives. */
export interface BlueprintSection {
  /** Stable id (e.g. "section-1"). */
  id: string;
  /** Section title, verbatim from the blueprint. */
  title: string;
  objectives: Objective[];
}

/** A single exam's study guide. */
export interface StudyGuide {
  /** URL slug under /certifications/. */
  slug: string;
  /** Official exam code (e.g. "F5CAB1"). */
  examCode: string;
  /** Official exam name (verbatim, official language). */
  examName: string;
  /** Vendor key (matches the vendor-namespace guard: f5/fortinet/...). */
  vendor: string;
  /** Certification grouping key this exam belongs to (e.g. "f5-ca"). */
  certification: string;
  /** Target product version if the blueprint states one, else null. */
  targetVersion: string | null;
  /** Public link to the official blueprint/source, if any. */
  blueprintSourceUrl: string | null;
  blueprintSourceLabel: string | null;
  /** "preparing" = blueprint not yet transcribed (renders the "in preparation"
   *  state); "published" = objectives mapped and live. */
  status: "preparing" | "published";
  sections: BlueprintSection[];
}

/** A certification (a credential earned by passing one or more exams). */
export interface Certification {
  /** Grouping key (e.g. "f5-ca"). */
  key: string;
  /** Short code shown as a badge (e.g. "F5-CA, BIG-IP"). */
  code: string;
  /** Full name (verbatim, official). */
  name: string;
  /** Vendor key. */
  vendor: string;
  /** The exam guide slugs that make up this certification, in study order. */
  examSlugs: string[];
  /** Optional note about renewal/recertification. */
  renewalNote: string | null;
  /** Public link to the certification's official description. */
  sourceUrl: string | null;
}

// ---------------------------------------------------------------------------
// CERTIFICATIONS
// ---------------------------------------------------------------------------

export const certifications: Certification[] = [
  {
    key: "f5-ca",
    code: "F5-CA, BIG-IP",
    name: "F5 Certified Administrator, BIG-IP",
    vendor: "f5",
    examSlugs: [
      "f5-ca-install-config-upgrade",
      "f5-ca-data-plane-concepts",
      "f5-ca-data-plane-configuration",
      "f5-ca-control-plane-administration",
      "f5-ca-support-and-troubleshoot",
    ],
    renewalNote:
      "An existing F5-CA, BIG-IP can be renewed by passing the recertification exam (F5CABR), or by passing all five exams again.",
    sourceUrl:
      "https://support.education.f5.com/hc/en-us/articles/37607208476059-What-is-the-F5-Certified-Administrator-BIG-IP-F5-CA-BIG-IP-certification",
  },
];

// ---------------------------------------------------------------------------
// STUDY GUIDES (F5-CA's five exams, blueprints pending PRIME relay)
//
// Names/codes are verified official F5 titles. `sections` stay empty and
// `status` stays "preparing" until the official blueprint objectives are
// relayed; the guide page renders an honest "in preparation" state meanwhile.
// ---------------------------------------------------------------------------

const F5CA_SOURCE =
  "https://support.education.f5.com/hc/en-us/articles/37607208476059-What-is-the-F5-Certified-Administrator-BIG-IP-F5-CA-BIG-IP-certification";

export const studyGuides: StudyGuide[] = [
  {
    slug: "f5-ca-install-config-upgrade",
    examCode: "F5CAB1",
    examName: "BIG-IP Administration Install, Initial Configuration, and Upgrade",
    vendor: "f5",
    certification: "f5-ca",
    targetVersion: null,
    blueprintSourceUrl: F5CA_SOURCE,
    blueprintSourceLabel: "F5 Education Services",
    status: "preparing",
    sections: [],
  },
  {
    slug: "f5-ca-data-plane-concepts",
    examCode: "F5CAB2",
    examName: "BIG-IP Administration Data Plane Concepts",
    vendor: "f5",
    certification: "f5-ca",
    targetVersion: null,
    blueprintSourceUrl: F5CA_SOURCE,
    blueprintSourceLabel: "F5 Education Services",
    status: "preparing",
    sections: [],
  },
  {
    slug: "f5-ca-data-plane-configuration",
    examCode: "F5CAB3",
    examName: "BIG-IP Administration Data Plane Configuration",
    vendor: "f5",
    certification: "f5-ca",
    targetVersion: null,
    blueprintSourceUrl: F5CA_SOURCE,
    blueprintSourceLabel: "F5 Education Services",
    status: "preparing",
    sections: [],
  },
  {
    slug: "f5-ca-control-plane-administration",
    examCode: "F5CAB4",
    examName: "BIG-IP Administration Control Plane Administration",
    vendor: "f5",
    certification: "f5-ca",
    targetVersion: null,
    blueprintSourceUrl: F5CA_SOURCE,
    blueprintSourceLabel: "F5 Education Services",
    status: "preparing",
    sections: [],
  },
  {
    slug: "f5-ca-support-and-troubleshoot",
    examCode: "F5CAB5",
    examName: "BIG-IP Administration Support and Troubleshoot",
    vendor: "f5",
    certification: "f5-ca",
    targetVersion: null,
    blueprintSourceUrl: F5CA_SOURCE,
    blueprintSourceLabel: "F5 Education Services",
    status: "preparing",
    sections: [],
  },
];

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** All study guides. */
export function getAllStudyGuides(): StudyGuide[] {
  return studyGuides;
}

/** One study guide by slug, or undefined. */
export function getStudyGuide(slug: string): StudyGuide | undefined {
  return studyGuides.find((g) => g.slug === slug);
}

/** Every study-guide slug (for generateStaticParams + the namespace guard). */
export function getAllStudyGuideSlugs(): string[] {
  return studyGuides.map((g) => g.slug);
}

/** All certifications. */
export function getCertifications(): Certification[] {
  return certifications;
}

/** Certifications offered by a given vendor (for vendor-hub cross-links). */
export function getCertificationsForVendor(vendor: string): Certification[] {
  return certifications.filter((c) => c.vendor === vendor);
}

/** The guides that make up a certification, in the certification's study order. */
export function getGuidesForCertification(key: string): StudyGuide[] {
  const cert = certifications.find((c) => c.key === key);
  if (!cert) return [];
  return cert.examSlugs
    .map((slug) => getStudyGuide(slug))
    .filter((g): g is StudyGuide => g !== undefined);
}

/** Count of objectives across a guide's sections (0 while preparing). */
export function objectiveCount(guide: StudyGuide): number {
  return guide.sections.reduce((n, s) => n + s.objectives.length, 0);
}
