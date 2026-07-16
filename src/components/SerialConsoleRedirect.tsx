// ============================================================================
// src/components/SerialConsoleRedirect.tsx
// ----------------------------------------------------------------------------
// Client-side redirect for the renamed WebSerial console slug (2026-07-16).
// router.replace keeps the old address out of history; the visible link is the
// no-JS fallback. Locale-aware via the shared navigation wrapper.
// ============================================================================
"use client";

import { useEffect } from "react";
import { Link, useRouter } from "@/i18n/navigation";

export default function SerialConsoleRedirect({ locale }: { locale: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dev/other/web-serial-console", { locale });
  }, [router, locale]);
  return (
    <main id="main" className="container" style={{ padding: "3rem 1rem" }}>
      <p className="tools-note">
        <Link href="/dev/other/web-serial-console" className="devother-door-link">
          /dev/other/web-serial-console →
        </Link>
      </p>
    </main>
  );
}
