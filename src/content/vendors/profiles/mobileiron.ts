// ============================================================================
// src/content/vendors/profiles/mobileiron.ts
// ----------------------------------------------------------------------------
// MOBILEIRON - the mobile device management pioneer that became half of
// Ivanti's 2020 double acquisition. Verified 2026-07-15 vs SEC 8-K and press:
// founded 2007, Mountain View, by Ajay Mishra and Suresh Batchu; rode the
// iPhone-in-the-enterprise wave as MDM became EMM became UEM; IPO Nasdaq
// June 2014 (MOBL); zero-trust pivot late 2010s; Ivanti (backed by Clearlake
// Capital + TA Associates) announced the acquisition September 28, 2020 -
// ~$872M, $7.05/share cash, a 27% premium - alongside Pulse Secure, both
// closing December 1, 2020. MobileIron's UEM is the core of Ivanti Neurons
// for UEM today. Cross-link: the Pulse Secure career page carries the
// sibling acquisition's story.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const mobileironProfile: VendorProfile = {
  slug: "mobileiron",
  foundings: [
    {
      company: "MobileIron",
      year: 2007,
      place: "Mountain View, California",
      founders: ["Ajay Mishra", "Suresh Batchu"],
      story:
        "MobileIron was founded in 2007 - the iPhone's year - on the bet that phones were about to become the enterprise endpoint nobody was managing. Ajay Mishra and Suresh Batchu built the platform that gave IT a policy plane for devices it did not own: enrollment, configuration, app catalogs, selective wipe. When the BYOD wave broke over corporate IT, MobileIron was the specialist standing where it landed, and 'mobile device management' grew through enterprise mobility management into unified endpoint management with the company's releases marking each stage.",
    },
  ],
  timeline: [
    { year: 2007, title: "Founded with the iPhone", detail: "Mishra and Batchu start MobileIron as smartphones head for the enterprise - device management as its own discipline, not an afterthought of desktop tooling." },
    { year: 2011, title: "The BYOD standard-bearer", detail: "As bring-your-own-device becomes policy reality, MobileIron's container and selective-wipe model - work data managed, personal data untouched - becomes the reference architecture." },
    { year: 2014, title: "IPO: MOBL", detail: "The June Nasdaq listing crowns the MDM specialist era - straight into the collision with VMware AirWatch and the platform giants entering the category." },
    { year: 2017, title: "MDM to UEM", detail: "The category consolidates desktops, mobiles, and rugged devices under unified endpoint management; MobileIron pivots with it, adding zero-sign-on and mobile threat defense as the perimeter dissolves." },
    { year: 2020, title: "Ivanti's double acquisition", detail: "September 28, 2020: Ivanti, backed by Clearlake Capital and TA Associates, announces the ~$872 million acquisition ($7.05 per share, a 27 percent premium) - alongside Pulse Secure, both closing December 1. MobileIron's platform becomes the UEM core of Ivanti Neurons.", sourceNote: "SEC 8-K, Sept 28, 2020; close per Ivanti/Siris announcements, Dec 1, 2020." },
  ],
  products: [
    { name: "MobileIron UEM (now Ivanti Neurons for UEM)", what: "The unified endpoint management platform: enrollment, policy, apps, and compliance from phones to desktops." },
    { name: "MobileIron Access / zero sign-on", what: "The identity-side pivot: conditional access and passwordless authentication anchored on the managed device." },
    { name: "Mobile Threat Defense", what: "On-device threat detection folded into the management plane - security and management as one agent." },
  ],
  innovations: [
    { title: "The phone as a managed endpoint", detail: "MobileIron helped define MDM itself - the enrollment-policy-wipe lifecycle that made corporate data on personal devices tolerable to security teams." },
    { title: "Device trust as identity signal", detail: "Zero sign-on inverted the model: the managed device becomes the credential - an early, product-shipped form of what the industry now calls device-bound zero trust." },
  ],
  markets: [
    "MobileIron's technology now serves inside Ivanti's UEM and security portfolio, managing endpoint estates for enterprises worldwide - the specialist heritage carried into a consolidated platform vendor against Microsoft Intune and VMware's successor stack.",
  ],
  analyst: [
    "A Leader across the MDM, EMM, and UEM analyst evaluations through the category's whole naming history - the specialist yardstick until consolidation absorbed the field.",
  ],
};
