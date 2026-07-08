// ============================================================================
// src/components/EnvOtherNotice.tsx
// ----------------------------------------------------------------------------
// The visible notice for /dev/other: WHY this room differs from everything
// else on the site, said plainly wherever the environment appears. The four
// paragraphs cover (1) what leaves the browser and where it goes, (2) what
// "no golden-vector guarantee" means for live results, (3) what still holds
// (no accounts, no tracking by us, nothing sent to ronutz.com servers in this
// version), and (4) what the green walls mean. `compact` renders only the
// first two on tool pages; the /dev/other index shows all four.
// ============================================================================
import { getTranslations } from "next-intl/server";

export default async function EnvOtherNotice({ compact = false }: { compact?: boolean }) {
  const t = await getTranslations("devOther.notice");
  return (
    <aside className="envother-notice" role="note">
      <p className="envother-notice-title">{t("title")}</p>
      <p className="envother-notice-text">{t("p1")}</p>
      <p className="envother-notice-text">{t("p2")}</p>
      {!compact && <p className="envother-notice-text">{t("p3")}</p>}
      {!compact && <p className="envother-notice-text">{t("p4")}</p>}
    </aside>
  );
}
