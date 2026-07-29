// ============================================================================
// Vendor page: Check Point. The chapter that runs backwards - most vendors
// here arrived to challenge an incumbent, and this one IS the incumbent that
// created the category in 1993.
//
// NO authorized-instructor claim (PRIME 2026-07-26): Check Point is covered as
// STUDY MATERIAL, like Ping and Zscaler. The CCSA/CCSE guides are built from
// Check Point's own published blueprints and say nothing about who may deliver
// their training. Content lives in the "vendors" namespace; the corporate
// profile below the career narrative is the same partner profile the industry
// timeline uses, so the facts stay in one place.
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";
import { checkPointProfile } from "@/content/vendors/profiles/check-point";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <VendorPage
      vendorKey="checkpoint"
      sections={["s1", "s2"]}
      icons={["firewall", "gateway", "router"]}
      profile={checkPointProfile}
      next={null}
    />
  );
}
