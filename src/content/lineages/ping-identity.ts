// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// PING IDENTITY corporate lineage.
//
// The identity market consolidated hard, and Ping is both a buyer and, at one
// point, the bought: Thoma Bravo took it private in 2022 and then used it as
// the vehicle to absorb ForgeRock, its largest competitor, a year later.
//
// For anyone learning the platform that history is the explanation for the
// thing that confuses everyone: there are TWO overlapping stacks. PingFederate
// and PingAccess came from Ping; PingAM and PingGateway came from ForgeRock.
// They do similar jobs because they were built by rivals to compete with each
// other, and unification is still in progress.
// ============================================================================

import type { VendorLineage } from "./f5";

export const pingLineage: VendorLineage = {
  key: "ping",
  name: "Ping Identity",
  tagline:
    "Assembled the identity platform one capability at a time, then merged with the competitor it had spent twenty years fighting.",

  founded: {
    year: 2002,
    dateText: "2002",
    place: "Denver, Colorado",
    asName: "Ping Identity",
    founder: "Andre Durand",
  },

  names: [
    { name: "Ping Identity", from: "2002", note: "Federation-first, in the era when SAML was the new idea." },
    {
      name: "Ping Identity (Thoma Bravo)",
      from: "2022",
      note: "Taken private by Thoma Bravo, which then acquired ForgeRock and merged it in.",
    },
  ],

  origin:
    "PingFederate, and the bet that the hard problem in enterprise identity was not storing credentials but federating trust between organisations. SAML, then OAuth and OIDC, then everything built on top of them.",

  acquisitions: [
    {
      year: 2016,
      name: "UnboundID",
      price: "undisclosed",
      what: "A high-scale directory and data store, built by engineers from the Sun directory lineage.",
      became: "PingDirectory - the datastore under the rest of the platform.",
    },
    {
      year: 2018,
      name: "Elastic Beam",
      price: "undisclosed",
      what: "AI-driven API security, watching API traffic for abuse rather than checking a token at the door.",
      became: "PingIntelligence for APIs.",
    },
    {
      year: 2020,
      name: "Symphonic Software",
      price: "undisclosed",
      what: "Dynamic, fine-grained authorization - externalising the decision about who may do what.",
      became:
        "PingAuthorize. The shift from 'are you who you say' to 'may you do this, right now, with this data'.",
    },
    {
      year: 2021,
      name: "SecuredTouch",
      price: "undisclosed",
      what: "Behavioural biometrics and fraud detection - identifying a user by how they behave rather than what they present.",
      became: "The risk signals inside PingOne Protect.",
    },
    {
      year: 2021,
      name: "Singular Key",
      price: "undisclosed",
      what: "No-code identity orchestration: drag-and-drop user journeys across identity, fraud, risk and verification services, with more than 100 prebuilt connectors.",
      became:
        "PingOne DaVinci - deliberately vendor-agnostic, so it orchestrates competitors' services too.",
      sourceNote: "Announced 27 September 2021. Singular Key was founded in 2019.",
    },
    {
      year: 2023,
      name: "ForgeRock",
      price: "$2.3B",
      what: "Ping's largest competitor in enterprise identity, acquired by Thoma Bravo and merged into Ping. ForgeRock had its own long lineage: it was founded in 2010 around the open-source identity stack Sun Microsystems had built, after Oracle acquired Sun and the community needed a home for OpenSSO and OpenDJ.",
      became:
        "PingAM, PingIDM, PingDS and PingGateway - which is why the platform carries two overlapping stacks. PingFederate and PingAccess do broadly what PingAM and PingGateway do, because rivals built them to compete with each other.",
      sourceNote:
        "All-cash, valued at approximately $2.3B, completed August 2023. The buyer of record was Thoma Bravo, which already owned Ping.",
      subAcquisitions: [
        {
          year: 2010,
          name: "the Sun identity codebase (origin, not a purchase)",
          what: "ForgeRock was founded to continue OpenSSO, OpenDJ and the rest of Sun's identity stack after Oracle's acquisition of Sun left them without a commercial home. Its products descend from code Sun wrote.",
        },
      ],
    },
  ],

  asOf: "July 2026",

  sources: [
    {
      label: "Thoma Bravo: completion of the ForgeRock acquisition and merger into Ping",
      url: "https://www.thomabravo.com/press-releases/thoma-bravo-completes-acquisition-of-forgerock-combines-forgerock-into-ping-identity",
    },
    {
      label: "Ping Identity: Singular Key acquisition announcement",
      url: "https://markets.financialcontent.com/siliconinvestor/article/bizwire-2021-9-27-ping-identity-acquires-singular-key-to-accelerate-no-code-identity-security-integration-and-orchestration",
    },
    {
      label: "Corbado: the two overlapping stacks after the merger, and which product came from which acquisition",
      url: "https://www.corbado.com/blog/ping-identity-passkeys-analysis",
    },
  ],
};
