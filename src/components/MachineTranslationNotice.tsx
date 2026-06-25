// ============================================================================
// src/components/MachineTranslationNotice.tsx
// ----------------------------------------------------------------------------
// MACHINE-TRANSLATION NOTICE BAR.
//
// An honesty banner shown at the top of every page on a machine-draft locale
// (status "machine-draft" in the registry). English and any future human-
// reviewed locale do NOT show it. It states plainly that the page was machine-
// translated and links to the contribute page where a reader can help fix it.
//
// Presentational only: it receives already-resolved, already-localized strings
// and a locale-correct href as props, so it stays a plain (non-async) component
// and can render outside the i18n client provider. The decision of WHETHER to
// show it (status check) and WHAT language to show it in lives in the layout,
// which has the active locale. React escapes the text; the href is built from
// the trusted locale code, never user input.
// ============================================================================

export default function MachineTranslationNotice({
  message,
  ctaLabel,
  ctaHref,
}: {
  message: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <aside className="mt-notice" role="note">
      <div className="container mt-notice-inner">
        {/* A small "translate" glyph, decorative. */}
        <svg
          className="mt-notice-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden="true"
        >
          <path d="M4 5h7M9 3v2c0 4-2.5 7-5 8M5 9c0 2.5 2.5 4.5 6 5" />
          <path d="M14 19l3.5-8 3.5 8M15.2 16.5h4.6" />
        </svg>
        <span className="mt-notice-text">{message}</span>
        <a className="mt-notice-cta" href={ctaHref}>
          {ctaLabel}
        </a>
      </div>
    </aside>
  );
}
