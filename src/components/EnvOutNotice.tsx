// ============================================================================
// src/components/EnvOutNotice.tsx
// ----------------------------------------------------------------------------
// The visible notice for /dev/out: WHY this room differs from everything
// else on the site, said plainly wherever the environment appears. The four
// paragraphs cover (1) what leaves the browser and where it goes, (2) what
// "no golden-vector guarantee" means for live results, (3) what still holds
// (no accounts, no tracking by us, nothing sent to ronutz.com servers in this
// version), and (4) what the red walls mean. `compact` renders only the
// first two on tool pages; the /dev/out index shows all four.
// LAID OUT AS RULES (2026-10-27, PRIME's UX rule of 11:07 and his review of
// 11:12): the four paragraphs read as one wall of small text, so each is a rule
// with a short lead (lead1..lead4) over its paragraph, two per row from 48rem.
// ============================================================================
import { getTranslations } from "next-intl/server";

export default async function EnvOutNotice({ compact = false }: { compact?: boolean }) {
  const t = await getTranslations("devOut.notice");
  // The rules shown: all four on the room's index, the first two on a tool page.
  const rules = compact ? [1, 2] : [1, 2, 3, 4];
  return (
    <aside className="envout-notice" role="note">
      <p className="envout-notice-title">{t("title")}</p>
      <ul className="envout-rules">
        {rules.map((n) => (
          <li key={n} className="envout-rule">
            {/* The rule's lead: what this paragraph answers. */}
            <p className="envout-rule-lead">{t(`lead${n}`)}</p>
            {/* The paragraph itself, unchanged. */}
            <p className="envout-notice-text">{t(`p${n}`)}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
