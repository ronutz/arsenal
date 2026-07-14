// ============================================================================
// src/components/EvidenceLinks.tsx
// ----------------------------------------------------------------------------
// CREDENTIAL EVIDENCE — renders the proof affordances for a credential.
//
// Shows only what exists on the credential's `evidence`:
//   - verifyUrl  -> a "Verify" link to the vendor portal, with the verification
//                   code (and any secondary id) shown so a visitor can verify.
//   - credly     -> a "Credly" link to the public badge.
//   - pdf        -> a "Certificate" link to the PDF (served from /public).
//
// If a credential has no evidence, this renders nothing at all, so the page
// stays clean until data is supplied. Server component; all labels are passed in
// (the parent has the i18n context). Small inline SVGs keep it dependency-free.
// ============================================================================

import type { CredentialEvidence } from "@/content/certifications/data";

export interface EvidenceCopy {
  verify: string;
  credly: string;
  certificate: string;
  code: string;
  candidate: string;
}

interface EvidenceLinksProps {
  evidence?: CredentialEvidence;
  copy: EvidenceCopy;
}

// Small inline icons (original, generic).
function IconVerify() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5z" />
      <path d="M9 11l2 2 4-4" />
    </svg>
  );
}
function IconBadge() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="9" r="6" />
      <path d="M9 14.5L8 22l4-2 4 2-1-7.5" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.5-1.5" />
    </svg>
  );
}

export default function EvidenceLinks({ evidence, copy }: EvidenceLinksProps) {
  // Nothing to show -> render nothing.
  if (!evidence) return null;
  const { pdf, credly, verifyUrl, verifyId, candidateId, links } = evidence;
  if (!pdf && !credly && !verifyUrl && !links?.length) return null;

  return (
    <div className="evidence">
      <div className="evidence-links">
        {verifyUrl && (
          <a className="evidence-link" href={verifyUrl} target="_blank" rel="noopener noreferrer">
            <IconVerify />
            {copy.verify}
          </a>
        )}
        {credly && (
          <a className="evidence-link" href={credly} target="_blank" rel="noopener noreferrer">
            <IconBadge />
            {copy.credly}
          </a>
        )}
        {pdf && (
          <a className="evidence-link" href={pdf} target="_blank" rel="noopener noreferrer">
            <IconDoc />
            {copy.certificate}
          </a>
        )}
        {/* Additional public evidence (e.g. yearly award announcements); labels
            are locale-neutral values carried in the data (years, codes). */}
        {links?.map((l) => (
          <a className="evidence-link" href={l.url} key={l.url} target="_blank" rel="noopener noreferrer">
            <IconLink />
            {l.label}
          </a>
        ))}
      </div>

      {/* Codes needed to verify on the portal, shown plainly. */}
      {(verifyId || candidateId) && (
        <div className="evidence-codes mono">
          {candidateId && (
            <span className="evidence-code">
              {copy.candidate}: {candidateId}
            </span>
          )}
          {verifyId && (
            <span className="evidence-code">
              {copy.code}: {verifyId}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
