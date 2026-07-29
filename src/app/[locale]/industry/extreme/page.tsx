// ============================================================================
// Vendor page: Extreme Networks. The 2013–2014 field deployment of Extreme
// across RNP's RedeComep metropolitan research networks (optical rings running
// EAPS) plus EXOS training and knowledge transfer. Uniquely, Extreme is also a
// platform taught today, and it closes the Enterasys -> Extreme (2013) circle
// seen on the Cabletron/Enterasys page. Content in the "vendors" namespace.
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";
import { extremeProfile } from "@/content/vendors/profiles/extreme";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <VendorPage
      vendorKey="extreme"
      sections={["s1", "s2"]}
      icons={["switch", "router", "metro"]}
      profile={extremeProfile}
      next={{ slug: "fireeye-mcafee-ixia", key: "distribution" }}
    />
  );
}
