// ============================================================================
// src/lib/fieldcraft/markdown.ts
// ----------------------------------------------------------------------------
// OPERATIONS & FIELDCRAFT - shared Markdown renderer for ExportArtifact.
// One deliberately boring function: the artifact must paste cleanly into a
// ticket, a bridge chat, or a TAC case (D-86 §2: usable, not decorative).
// Pure and deterministic: same artifact in, same Markdown out.
// ============================================================================

import type { ExportArtifact } from "./schema";

/** Render an ExportArtifact to plain Markdown. */
export function artifactToMarkdown(artifact: ExportArtifact): string {
  const lines: string[] = [`# ${artifact.title}`];
  if (artifact.generated) {
    lines.push("", `_Generated ${artifact.generated} - ronutz.com, local-compute; advisory structure, not a diagnosis._`);
  }
  for (const [heading, body] of artifact.sections) {
    lines.push("", `## ${heading}`, "", body);
  }
  return lines.join("\n") + "\n";
}
