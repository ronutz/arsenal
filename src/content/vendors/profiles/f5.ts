// ============================================================================
// src/content/vendors/profiles/f5.ts
// ----------------------------------------------------------------------------
// F5 - the platform Rodolfo teaches most, and the flagship hub of this site.
// The profile covers the company itself: the 1996 Seattle load-balancing
// startup that became the application delivery company, and now the
// Application Delivery and Security Platform (ADSP).
//
// Verified 2026-07-15: F5 10-K FY2025 (CalypsoAI closed September 26, 2025,
// $145.2M cash, "immediately becoming a wholly-owned subsidiary"; ADSP
// integration; announced Sept 11 at $180M consideration per 8-K), F5 press
// (AI Guardrails / AI Red Team introduced Sept 29, 2025; LeakSignal Feb
// 2025), Wikipedia/company record (founded 1996 Seattle; BIG-IP; IPO June
// 1999 NASDAQ FFIV; NGINX May 2019 ~$670M; Shape Security Jan 2020 ~$1B;
// Volterra Jan 2021 ~$500M -> Distributed Cloud Services 2022; Threat Stack
// Sept 2021 $68M; renamed from "F5 Networks" to "F5, Inc." Nov 2021;
// Locoh-Donou CEO April 2017). Founding lore (F5 Labs, the Fujita-scale
// name) is widely reported company history; kept qualitative.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const f5Profile: VendorProfile = {
  slug: "f5",
  foundings: [
    {
      company: "F5 Labs (later F5 Networks, today F5, Inc.)",
      year: 1996,
      place: "Seattle, Washington",
      founders: ["Jeffrey Hussey"],
      story:
        "Founded in Seattle in 1996 as F5 Labs, the company took its name from the top of the Fujita tornado scale - the year the movie Twister filled theaters - a fitting badge for a product built to stand in front of a storm of web traffic. Its bet was that the young web would need machines whose whole job was distributing load across servers, and the BIG/ip load balancer that followed in 1997 turned that bet into a category. Jeffrey Hussey ran the company to its 1999 IPO; John McAdam then led it through the era in which load balancing grew up into application delivery.",
    },
  ],
  timeline: [
    { year: 1996, title: "F5 Labs opens in Seattle", detail: "The company is founded to solve a brand-new problem: web sites falling over under their own popularity. The name comes from the strongest category of tornado - traffic as weather.", sourceNote: "Founding lore widely reported in company histories." },
    { year: 1997, title: "BIG/ip ships", detail: "The first product, the BIG/ip load balancer, distributes traffic across servers and monitors their health. The spelling changes over the years; the franchise never does - BIG-IP remains the heart of F5 three decades on." },
    { year: 1999, title: "IPO in the dot-com window", detail: "June 1999: F5 lists on NASDAQ as FFIV, riding the same wave that floated the era's networking names. John McAdam takes the CEO chair in 2000 and holds it for most of two decades." },
    { year: 2004, title: "TMOS v9: the full-proxy rewrite", detail: "BIG-IP version 9 rebuilds the product on TMOS, a purpose-built traffic operating system that fully terminates both sides of every connection. The full-proxy architecture plus iRules scripting - and the DevCentral community around it - turn a load balancer into a programmable platform, and define how the product is taught to this day." },
    { year: 2017, title: "François Locoh-Donou takes over", detail: "April 2017: the Ciena veteran becomes President and CEO, inheriting a hardware-anchored ADC leader and steering it toward software, SaaS, and security." },
    { year: 2019, title: "NGINX", detail: "F5 acquires NGINX, the company behind the web server and reverse proxy that fronts much of the internet, for roughly $670 million - planting the flag in open source and modern application stacks.", sourceNote: "Announced March 2019, completed May 2019." },
    { year: 2020, title: "Shape Security", detail: "The roughly $1 billion acquisition of Shape Security closes in January 2020, bringing bot defense and anti-fraud built on machine learning - the seed of today's Distributed Cloud Bot Defense." },
    { year: 2021, title: "Volterra, and a new name", detail: "January 2021: F5 buys Volterra for about $500 million as the foundation of its edge and multi-cloud platform; Threat Stack ($68 million) follows in September. In November the company formally renames from F5 Networks to F5, Inc. - the 'Networks' era officially closes." },
    { year: 2022, title: "F5 Distributed Cloud Services", detail: "The Volterra, Shape, and BIG-IP lineages converge into F5 Distributed Cloud Services - SaaS-delivered web application and API protection (WAAP), multi-cloud networking, and edge compute under one console." },
    { year: 2025, title: "The AI security chapter opens", detail: "F5 folds data-in-transit classification (LeakSignal, February) and enterprise AI runtime security (CalypsoAI, closed September 26 for $145.2 million) into the newly named Application Delivery and Security Platform, introducing F5 AI Guardrails and AI Red Team days later.", sourceNote: "F5 10-K FY2025; announced consideration $180M per the Sept 11 8-K." },
  ],
  products: [
    { name: "BIG-IP (LTM, DNS, APM, Advanced WAF)", what: "The flagship application delivery and security family - local and global traffic management, access, and web application firewalling - on hardware, virtual editions, and F5OS platforms (rSeries, VELOS)." },
    { name: "NGINX", what: "The web server, reverse proxy, and Kubernetes ingress that carries a huge share of the world's sites; F5's bridge into open source and modern app teams." },
    { name: "F5 Distributed Cloud Services", what: "SaaS-delivered WAAP, bot defense, API security, multi-cloud networking, and edge compute - the Volterra and Shape lineages unified." },
    { name: "F5 Application Delivery and Security Platform (ADSP)", what: "The 2025-era umbrella converging BIG-IP, NGINX, and Distributed Cloud into one platform for delivering and securing every app and API - now including AI Guardrails and AI Red Team." },
  ],
  innovations: [
    { title: "The full proxy", detail: "TMOS terminates client and server sides independently, letting BIG-IP inspect, transform, and secure traffic in both directions - the architectural idea that separated it from packet-forwarding load balancers." },
    { title: "iRules and DevCentral", detail: "Event-driven Tcl scripting on the data path, and the community that grew around it - programmability as a product feature a decade before 'infrastructure as code' was a slogan." },
    { title: "From ADC to WAAP", detail: "The deliberate migration of an appliance franchise into SaaS-delivered app and API protection without abandoning the installed base - BIG-IP, NGINX, and Distributed Cloud as one continuum." },
  ],
  markets: [
    "F5's home market is application delivery and application security for the enterprise: the traffic in front of banks, carriers, governments, and most of the Fortune 500 crosses a BIG-IP, an NGINX, or both. The company's center of gravity has shifted from hardware ADCs toward software, SaaS security services, and - since 2025 - securing AI applications and inference.",
  ],
  analyst: [
    "For most of two decades F5 defined the application delivery controller category analysts measured everyone else against; as the category itself dissolved into WAAP and multi-cloud application services, F5 is consistently placed among the leaders and major players of those successor markets.",
  ],
};
