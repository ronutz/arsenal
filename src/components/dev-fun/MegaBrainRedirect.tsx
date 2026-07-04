"use client";

// ============================================================================
// src/components/dev-fun/MegaBrainRedirect.tsx
// ----------------------------------------------------------------------------
// The Console do Mega Brain is pt-BR only (PRIME decision). Every other locale
// lands here and is bounced to the pt-BR page. Client-side because the site is
// a static export (no request-time middleware to redirect).
// ============================================================================

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

export default function MegaBrainRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dev-fun/mega-brain", { locale: "pt-BR" });
  }, [router]);

  return (
    <p style={{ textAlign: "center", padding: "3rem 1rem", opacity: 0.8 }}>
      Redirecting to the pt-BR Console do Mega Brain…{" "}
      <a href="/pt-BR/dev-fun/mega-brain">click here if it does not happen automatically</a>.
    </p>
  );
}
