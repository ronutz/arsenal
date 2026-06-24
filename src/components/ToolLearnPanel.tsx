// ============================================================================
// src/components/ToolLearnPanel.tsx
// ----------------------------------------------------------------------------
// THE IN-TOOL LEARN PANEL — surface (a): contextual learning beside a tool.
//
// Given a tool slug, it shows the articles that relate to that tool (resolved
// through getArticlesForTool — the Tools->Learn bridge, manifest learnLinks[]).
// This is the SAME content the standalone Learn section serves; both read from
// src/lib/learn.ts. A user working in the CIDR tool sees "learn the concept"
// links right there, then can click through to the full article.
//
// Server component (reads content at build time). Renders compact summaries +
// links, not full bodies — the full read lives on the article page.
// ============================================================================

import { getArticlesForTool } from "@/lib/learn";
import { Link } from "@/i18n/navigation";

export default function ToolLearnPanel({
  toolSlug,
  locale,
  heading,
}: {
  toolSlug: string;
  locale: string;
  /** Localized heading (passed in so the panel stays presentation-only). */
  heading: string;
}) {
  const articles = getArticlesForTool(toolSlug, locale);

  // No related articles → render nothing (no empty gaps).
  if (articles.length === 0) return null;

  return (
    <aside className="tool-learn" aria-label={heading}>
      <h3 className="tool-learn-heading">{heading}</h3>
      <ul className="tool-learn-list">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link href={`/learn/${a.slug}`} className="tool-learn-link">
              <span className="tool-learn-link-title">{a.title}</span>
              <span className="tool-learn-link-summary">{a.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
