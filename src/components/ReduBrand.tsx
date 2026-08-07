// ============================================================================
// src/components/ReduBrand.tsx
// ----------------------------------------------------------------------------
// Renders a string with every occurrence of "Red Education" wrapped in the
// brand style the footer credit uses.
//
// WHY A RENDER-TIME WRAPPER RATHER THAN MARKUP IN THE STRINGS.
//
// PRIME asked (2026-08-06) for the name to carry its brand colour "anywhere in
// text where Red Education is mentioned". Thirty-two message keys mention it,
// across sixteen locales - **five hundred and twelve strings**. Inserting a
// <b> marker into each and converting every call site to t.rich() would be a
// large mechanical edit with a real chance of breaking an ICU message, and it
// would have to be repeated by hand every time somebody writes a new sentence
// containing the name.
//
// This does it once. The component splits on the literal name and wraps each
// hit, so:
//   - it works in EVERY locale without touching a single translation, because
//     the brand name is not translated in any of them;
//   - a NEW string containing the name is styled the moment it is rendered
//     through this component, with no follow-up edit;
//   - the message files stay free of presentation markup, which is where the
//     i18n guards want them.
//
// THE LIMIT, STATED: this only applies where a call site opts in. It is not a
// global text transform, because one does not exist in React without walking
// the rendered tree, and a component that rewrote arbitrary descendants would
// be far more dangerous than a missed colour.
// ============================================================================

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

const NAME = "Red Education";

/**
 * Wrap "Red Education" in the brand style wherever it appears in `children`,
 * and link it to /red-education.
 *
 * `linked={false}` suppresses the link. Two situations need it:
 *   - THE /red-education PAGE ITSELF, where every mention would otherwise be a
 *     link to the page you are already reading;
 *   - anywhere the text already sits inside an anchor, since nesting one <a>
 *     inside another is invalid HTML and browsers recover from it in
 *     inconsistent and ugly ways.
 *
 * Non-string children pass through untouched, so this is safe to wrap around
 * anything - it simply does nothing where there is no text to match.
 */
export default function ReduBrand({
  children,
  linked = true,
}: {
  children: ReactNode;
  linked?: boolean;
}) {
  if (typeof children !== "string" || !children.includes(NAME)) {
    return <>{children}</>;
  }

  const mark = linked ? (
    <Link href="/red-education" className="redu-brand redu-brand-link">
      {NAME}
    </Link>
  ) : (
    <span className="redu-brand">{NAME}</span>
  );

  // split() with no capture group drops the separator, so the name is
  // re-inserted between the parts rather than recovered from the split.
  const parts = children.split(NAME);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && mark}
        </span>
      ))}
    </>
  );
}
