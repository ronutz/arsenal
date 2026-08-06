// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - freeradius.org documentation: each authentication method (PAP, CHAP,
//     MS-CHAP, TOTP, EAP) is an individual module, as is each database
//     connector (SQL, Redis, LDAP), and "in many cases, no code changes to the
//     server core have to be made" to add functionality; a single server scales
//     from one request every few seconds to thousands per second by adjusting
//     defaults; vendor-specific attributes for over a hundred vendors including
//     Cisco, Juniper, Lucent/Ascend, HP ProCurve, Microsoft and USR/3Com
//   - freeradius.org/about: Alan DeKok has co-authored numerous AAA and RADIUS
//     RFCs and is chief executive of NetworkRADIUS SARL; the project also
//     produces freeradius-client, mod_auth_radius and pam_radius_auth
//   - Wikipedia: GPLv2; written in C; 3.2.8 released August 2025
//
// *** BODY READ AFTER DRAFTING. The body is unusually complete: the Merit
// origin, Livingston's own history, the two-fork lineage, the 2006 survey,
// eduroam, EAP and 802.1X, RadSec fixing shared-secret-and-MD5, the four-way
// open-source comparison, and DeKok's twenty-six years. What it does NOT have
// is HOW the modularity works, which is the reason for the capability it
// describes. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const freeradiusProfile: VendorProfile = {
  slug: "freeradius",
  foundings: [
    {
      company: "The FreeRADIUS project",
      year: 1999,
      place: "distributed, no headquarters",
      founders: [],
      story:
        "A rewrite rather than a continuation. The stated purpose was a modular design that would let other people contribute without understanding the whole server - which is a decision about the shape of a community expressed as a decision about the shape of a codebase.",
    },
  ],
  timeline: [
    { year: 2001, title: "Version 0.1", detail: "Nearly two years after the first alpha. Infrastructure software of this kind is slow to call itself finished, and the first stable release did not arrive until 2004." },
    { year: 2025, title: "Still shipping", detail: "Version 3.2.8 in August, twenty-six years after the project began, from the same project leader." },
  ],
  products: [
    { name: "The server", what: "Written in C, under version 2 of the GPL, and the reference implementation in practice if not in name - the thing other RADIUS implementations are tested against." },
    { name: "The module set", what: "Every authentication method is a module and every database connector is a module. Adding a new one usually requires no change to the server core at all, which is why it supports more authentication types than anything else in its category." },
    { name: "Vendor dictionaries", what: "Vendor-specific attributes for more than a hundred manufacturers - Cisco, Juniper, Microsoft, HP, Lucent and the rest. That library is unglamorous, enormous and the reason the server works with equipment nobody involved has ever seen." },
    { name: "The client libraries", what: "A BSD-licensed client library, an Apache module and a PAM module, so applications can speak RADIUS without implementing it." },
  ],
  innovations: [
    {
      title: "Modularity as a recruitment strategy",
      detail:
        "Splitting every authentication method and every storage backend into its own module means a contributor can add support for one thing while understanding only that thing. The design decision is technical; the reason for it was social, and it is why a project with a small core team supports more mechanisms than commercial products with large ones.",
    },
    {
      title: "One codebase from ten users to ten million",
      detail:
        "The same server handles a small office and a national carrier by changing defaults rather than by being a different product. Very little software spans four orders of magnitude of load without forking into editions, and the ones that do tend to end up as infrastructure.",
    },
    {
      title: "The maintainer who writes the standard",
      detail:
        "The project leader has co-authored several of the RFCs defining the protocols the server implements. That closes an unusual loop - the person maintaining the most-deployed implementation is also among those specifying what it should do - and it is the arrangement that keeps a thirty-year-old protocol usable.",
    },
    {
      title: "The same shape as Apache",
      detail:
        "A widely-used reference implementation stopped being maintained, a stopgap filled the gap, and a modular rewrite became the default for the next quarter century. This timeline records the same sequence at Apache, from the same years, in a different protocol. Abandonment by the original author is a more common origin for durable infrastructure than invention is.",
    },
  ],
  markets: [
    "Internet providers, universities, enterprises and carriers - anywhere a network has to decide whether to let something on. It sits underneath wireless authentication, VPN access, broadband subscriber management and the roaming federations that let a visitor authenticate against their home institution from another continent.",
    "Its competitors are the commercial policy servers sold by network equipment vendors, which typically integrate more closely with one manufacturer's hardware. The trade is the usual one, and this timeline records it under several other names: depth of integration against independence from any single supplier.",
  ],
  analyst: [
    "There is no vendor position to assess. The measure that matters is deployment, and by the project's own survey the figure is around a hundred million daily users - a number worth attributing rather than asserting, since it comes from the project and dates from 2006.",
    "The durable observation is about maintenance rather than innovation. Most software on this timeline changed hands, changed direction or stopped. This one has been maintained continuously by the same person since 1999, and the internet's authentication layer rests on that arrangement more than most people using it realise.",
  ],
};
