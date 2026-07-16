// ============================================================================
// src/content/vendors/profiles/ping-identity.ts
// ----------------------------------------------------------------------------
// PING IDENTITY - the identity chapter. AUTHORIZATION UPDATE (PRIME
// 2026-07-15): Rodolfo is cleared as an authorized Ping Identity instructor;
// the i18n career narrative now states the authorization (the earlier
// disclaimer is retired). Fifth vendor in the teaching portfolio.
//
// Verified 2026-07-15: Thoma Bravo press releases (Ping take-private
// completed October 18, 2022, ~$2.8B all cash, $28.50/share, delisted from
// NYSE; ForgeRock acquisition completed August 23, 2023, ~$2.3B,
// $23.25/share, and "combined ForgeRock into its portfolio company Ping
// Identity"; Durand leads the combined company), Wikipedia (founded 2002 in
// Denver by Andre Durand and Bryan Field-Elliot; Durand previously founded
// Jabber, acquired by Cisco in 2008; Vista Equity majority buyout ~$600M
// June 2016; public on NYSE as PING from September 2019 until the 2022
// take-private), Gartner via press (both Ping and ForgeRock named Leaders
// in the 2023 Access Management Magic Quadrant).
//
// ForgeRock lineage verified 2026-07-15: ForgeRock's own AM deployment docs
// (Sun ONE Identity Server -> Sun Java System Access Manager -> OpenSSO
// open-sourced 2005; Oracle acquires Sun January 2010 and suspends OpenSSO;
// February 2010 a small group of former Sun employees founds ForgeRock and
// renames OpenSSO to OpenAM), Wikipedia/HandWiki (founded in Norway,
// February 2010; U.S. HQ San Francisco; Identity Platform = AM/IDM/DS/IG on
// the OpenAM/OpenIDM/OpenDJ/OpenIG projects), Grokipedia (incorporated as
// ForgeRock AS in Norway in October 2009 - the founding-date nuance kept in
// a sourceNote; co-founders Lasse Andresen, Jonathan Scudder, Hermann
// Svoron, Steve Ferris, Victor Ake, all ex-Sun), TechCrunch + Strategy of
// Security (S-1 filed Aug 23, 2021; IPO September 16, 2021, NYSE FORG,
// ~$233.7M lifetime funding, ~44% first-day pop, ~$2B valuation).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const pingIdentityProfile: VendorProfile = {
  slug: "ping-identity",
  foundings: [
    {
      company: "Ping Identity",
      year: 2002,
      place: "Denver, Colorado",
      founders: ["Andre Durand", "Bryan Field-Elliot"],
      story:
        "Andre Durand had already given the internet an open messaging protocol - he founded Jabber, whose XMPP lineage Cisco acquired in 2008 - when he turned to a harder federation problem: identity. Ping Identity, founded in Denver in 2002 with Bryan Field-Elliot, bet that businesses would need to trust each other's logins across organizational lines, and became a standard-bearer for SAML and the federation protocols that followed. Two decades later the company Durand still leads anchors identity for more than half of the Fortune 100.",
    },
    {
      company: "ForgeRock",
      year: 2010,
      place: "Oslo, Norway (U.S. headquarters later in San Francisco)",
      founders: ["Lasse Andresen", "Jonathan Scudder", "Hermann Svoron", "Steve Ferris", "Victor Ake"],
      story:
        "When Oracle closed its acquisition of Sun Microsystems in January 2010 and suspended Sun's open-source identity work, five of the engineers who had built it refused to let it die. In February 2010 they founded ForgeRock in Norway - on famously little seed money - and forked the stack they knew line by line: OpenSSO became OpenAM, the directory lineage became OpenDJ, and OpenIDM and OpenIG grew alongside, maturing into the ForgeRock Identity Platform. It is one of open source's great lifeboat stories: a corporate roadmap decision undone by the people who had written the code, who then took the rescued product all the way to the New York Stock Exchange.",
    },
  ],
  timeline: [
    { year: 2002, title: "Founded on federation", detail: "Ping starts in Denver with a thesis years ahead of its market: single sign-on should cross company boundaries, carried by open standards rather than shared passwords." },
    { year: 2003, title: "PingFederate", detail: "The flagship federation server ships and grows up alongside the standards it implements - SAML, then OAuth and OpenID Connect - becoming the enterprise workhorse for connecting workforces and partners to applications." },
    { year: 2005, title: "Sun Microsystems open-sources OpenSSO", detail: "The other bloodline begins: Sun releases its Java System Access Manager heritage as the OpenSSO open-source project - iPlanet and Sun ONE DNA, now developed in the open. The Sun directory lineage travels with it.", sourceNote: "ForgeRock's own AM deployment-planning history." },
    { year: 2010, title: "ForgeRock: the fork that saved Sun's identity stack", detail: "Oracle completes the Sun acquisition in January 2010 and suspends OpenSSO. In February, five former Sun engineers found ForgeRock in Norway to carry the code forward: OpenSSO is reborn as OpenAM, the directory as OpenDJ, with OpenIDM and OpenIG joining - the seeds of the ForgeRock Identity Platform.", sourceNote: "Company records give February 2010; the Norwegian entity ForgeRock AS was incorporated in October 2009." },
    { year: 2021, title: "ForgeRock IPO: FORG", detail: "September 16, 2021: eleven years and about $233.7 million in funding after the fork, ForgeRock lists on the New York Stock Exchange, popping roughly 44 percent on day one at a valuation around $2 billion - the rescued open-source stack, ringing the bell." },
    { year: 2016, title: "Vista takes the company private", detail: "June 2016: Vista Equity Partners acquires majority ownership for roughly $600 million, funding the expansion from federation into a full identity platform - MFA, access management, directory, and the PingOne cloud." },
    { year: 2019, title: "IPO on the NYSE", detail: "September 2019: Ping lists on the New York Stock Exchange as PING - three years as a public company that end the way much of the identity market's decade did, in private equity hands." },
    { year: 2022, title: "Thoma Bravo, $2.8 billion", detail: "October 18, 2022: Thoma Bravo completes its all-cash take-private of Ping at $28.50 per share - one piece of the firm's identity buying spree alongside SailPoint and, days earlier in agreement, ForgeRock.", sourceNote: "Thoma Bravo press release." },
    { year: 2023, title: "ForgeRock folds in", detail: "August 23, 2023: Thoma Bravo closes the ~$2.3 billion ForgeRock acquisition and combines it into Ping the same day, uniting two Access Management Magic Quadrant Leaders under Durand - a merger of direct rivals executed in about a hundred days.", sourceNote: "Thoma Bravo press release; both firms Leaders in Gartner's 2023 Access Management MQ." },
    { year: 2024, title: "One platform, both heritages", detail: "The combined company rationalizes overlapping portfolios without forced migrations: PingOne and the ForgeRock lineage continue side by side, with orchestration (DaVinci) as the connective tissue across workforce and customer identity." },
    { year: 2026, personal: true, title: "Rodolfo's chapter", detail: "PingFederate Practitioner in 2025 through Ping Identity Training, and the authorized-instructor clearance in 2026 - the fifth vendor in the teaching portfolio, delivered through Red Education." },
  ],
  products: [
    { name: "PingFederate", what: "The enterprise federation server - SAML, OAuth, and OpenID Connect brokering for workforce and partner single sign-on; the product this site's identity tooling most often speaks to." },
    { name: "PingOne", what: "The cloud identity platform: SSO, MFA (PingID), risk, and identity verification delivered as SaaS." },
    { name: "PingOne DaVinci", what: "No-code identity orchestration - the visual journey builder (from the Singular Key acquisition) that stitches authentication, risk, and fraud signals into flows." },
    { name: "PingAccess and PingDirectory", what: "Web/API access enforcement and the high-scale directory underpinning large deployments." },
    { name: "ForgeRock Identity Platform (Advanced Identity Cloud)", what: "The ForgeRock heritage carried forward post-merger: Access Management, Identity Management, Directory Services, and Identity Gateway - the OpenAM, OpenIDM, OpenDJ, and OpenIG lineages, with journey Trees for orchestration." },
  ],
  innovations: [
    { title: "Federation as a product", detail: "Turning SAML from a specification into dependable enterprise software - Ping's founding contribution, and why 'PingFederate' became close to a common noun in identity work." },
    { title: "Identity orchestration", detail: "DaVinci's journey-time orchestration - assembling authentication and fraud checks visually - one of the capabilities analysts singled out across both Ping and ForgeRock." },
    { title: "Open source as a lifeboat", detail: "ForgeRock's founding move - forking OpenSSO and OpenDS the month Oracle shelved them - remains a canonical proof that open licensing lets a community outlive a corporate roadmap." },
    { title: "The identity roll-up", detail: "The Ping-ForgeRock combination: proof that even head-to-head IAM rivals could be merged into one platform company without forcing customer migrations." },
  ],
  markets: [
    "Ping competes at the top of workforce and customer identity and access management against Microsoft and Okta, concentrated in large, complex enterprises - banks, carriers, governments - where hybrid deployment, standards depth, and orchestration decide the deal.",
  ],
  analyst: [
    "Ping Identity and ForgeRock were each named Leaders in Gartner's 2023 Access Management Magic Quadrant - the year Thoma Bravo combined them into a single company.",
  ],
};
