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
// ============================================================================
import { getTranslations } from "next-intl/server";

export default async function EnvOutNotice({ compact = false }: { compact?: boolean }) {
  const t = await getTranslations("devOut.notice");
  return (
    <aside className="envout-notice" role="note">
      <p className="envout-notice-title">{t("title")}</p>
      <p className="envout-notice-text">{t("p1")}</p>
      <p className="envout-notice-text">{t("p2")}</p>
      {!compact && <p className="envout-notice-text">{t("p3")}</p>}
      {!compact && <p className="envout-notice-text">{t("p4")}</p>}
    </aside>
  );
}
