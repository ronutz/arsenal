## What it does

Give it one route, a prefix and the autonomous system (AS) that originates it, and the list of Validated ROA Payloads (VRPs), the data a validator extracts from Route Origin Authorizations (ROAs), that you want to check it against, and it returns the route's validation state as RFC 6811 defines it: Valid, Invalid or NotFound. It shows the reasoning VRP by VRP: which VRPs cover the route's prefix, which of those match it, and why each covering VRP that does not match fails. IPv4 and IPv6 are both handled, and the AS can be written in asplain or asdot.

It fetches nothing. There is no Resource Public Key Infrastructure (RPKI) repository, validator or route collector behind it: the VRPs are the ones you paste, so the answer holds for that list and for no other. To check a live route against the live RPKI, export the VRPs from a validator you trust and paste them, or use a public service such as the RIPEstat RPKI validation call that [the BGP security article](/learn/bgp-and-the-routing-chokepoint) shows.

## The input

The route is one line: a prefix and its origin AS, such as `192.0.2.0/24 AS64496`, `2001:db8::/32 AS1.0` or `192.0.2.0/24 64496`. RFC 6811 takes the origin from the rightmost AS of the AS_PATH when the path ends in an AS_SEQUENCE, uses the router's own AS when the path is empty or ends in a confederation segment, and uses the distinguished value NONE otherwise; write `NONE` for that case ([RFC 6811, section 2](https://www.rfc-editor.org/rfc/rfc6811.txt)). A route whose origin is AS 0 is refused: RFC 7607 says such an UPDATE "MUST be considered as malformed" and that a BGP speaker "MUST NOT originate or propagate a route with an AS number of zero" ([RFC 7607, section 2](https://www.rfc-editor.org/rfc/rfc7607.txt)), so it never reaches validation.

The VRPs are one per line: a prefix, an optional maxLength, then the AS, separated by spaces, tabs or commas, as in `192.0.2.0/24 24 AS64496`. The maxLength can also follow the prefix after a hyphen, `203.0.113.0/24-26`, the way RFC 9319 writes a ROA ([RFC 9319, section 3](https://www.rfc-editor.org/rfc/rfc9319.txt)), and `AS 64496` with a space is read as one AS. When the AS carries its `AS` prefix it may stand anywhere on the line, so `AS64496,192.0.2.0/24,24` works too. A `#` starts a comment and blank lines are skipped. A line without a maxLength authorises the exact prefix only: "When the maxLength element is not present, the AS is only authorized to advertise the exact prefix" ([RFC 9582, section 4.3.2.2](https://www.rfc-editor.org/rfc/rfc9582.txt)). A maxLength shorter than the prefix, or longer than 32 for IPv4 or 128 for IPv6, is refused, because the same section says it "MUST be" within that range. Prefixes with bits set beyond their length (`192.0.2.1/24`) are refused with the network address they probably meant. Identical VRPs are counted once.

You can paste a Simplified Local Internet Number Resource Management with the RPKI (SLURM) file instead: a whole file, an object holding `prefixAssertions`, or the array itself. Each assertion carries `prefix` and `asn` and may carry `maxPrefixLength` and `comment` ([RFC 8416, section 3.4.1](https://www.rfc-editor.org/rfc/rfc8416.txt)); any other member is refused, since "JSON members that are not defined here MUST NOT be used in SLURM files" (section 3.1). A file's `prefixFilters` are counted and not applied: they remove VRPs that came from RPKI validation, and "Locally Added Assertions MUST NOT be removed by output filtering" (section 3.2).

## How the state is decided

The tool applies RFC 6811's definitions word for word. A VRP covers a route when "the VRP prefix length is less than or equal to the Route prefix length, and the VRP prefix address and the Route prefix address are identical for all bits specified by the VRP prefix length". It matches when "the Route Prefix is Covered by that VRP, the Route prefix length is less than or equal to the VRP maximum length, and the Route Origin ASN is equal to the VRP ASN". Then: "NotFound: No VRP Covers the Route Prefix.", "Valid: At least one VRP Matches the Route Prefix." and "Invalid: At least one VRP Covers the Route Prefix, but no VRP Matches it." ([RFC 6811, section 2](https://www.rfc-editor.org/rfc/rfc6811.txt)). One match is enough, whatever the other VRPs say, and the order of the list does not matter.

Each VRP in the table gets one of these results: Match; Another AS (it covers, and names a different AS); Too specific (it covers, and the route is longer than its maxLength); both of those at once; AS 0; Origin NONE; Does not cover; and Other family, for an IPv4 VRP against an IPv6 route or the reverse. A match whose VRP prefix is shorter than the route is marked as made through the maxLength range.

## AS 0

A VRP with AS 0 covers like any other but can never match: "no Route can be Matched by a VRP whose ASN is zero" ([RFC 6811, section 2](https://www.rfc-editor.org/rfc/rfc6811.txt)). That is how a holder disavows a block: an AS 0 ROA says "the prefix described in the ROA, and any more specific prefix, should not be used in a routing context" ([RFC 6483, section 4](https://www.rfc-editor.org/rfc/rfc6483.txt)). When only AS 0 VRPs cover the route, the tool says so. When another VRP also matches, the route is Valid, because an AS 0 ROA "has a lower relative preference than any other ROA that has a routable AS as its subject" (same section). The maxLength of an AS 0 VRP makes no difference to the outcome, as RFC 6483 notes, so the tool leaves AS 0 VRPs out of the maxLength notes.

## maxLength and RFC 9319

Every VRP whose maxLength is longer than its prefix gets a note with the number of prefixes it authorises, which is 2 to the power (maxLength minus length plus 1), minus 1: a /24 with maxLength 26 authorises 7, the /24, two /25s and four /26s, which is RFC 9582's own example ([RFC 9582, section 4.3.2.2](https://www.rfc-editor.org/rfc/rfc9582.txt)). RFC 9319 asks operators to publish minimal ROAs and says they "SHOULD avoid using the maxLength attribute in their ROAs, since its inclusion will usually make the ROA non-minimal" ([RFC 9319, section 5](https://www.rfc-editor.org/rfc/rfc9319.txt)); it explains that prefixes a ROA authorises but its AS does not announce are vulnerable to what it calls a forged-origin sub-prefix hijack (Abstract and section 3). The note reports the range. Whether every prefix in it is really announced is something only the operator can say.

## What it does not do

It does not validate ROAs or certificates: VRPs are, by definition, what a validator produced after that work ([RFC 6811, section 2](https://www.rfc-editor.org/rfc/rfc6811.txt)). It does not apply policy: what a router does with Invalid is the operator's configuration, and "An implementation MUST NOT exclude a route from the Adj-RIB-In or from consideration in the decision process as a side effect of its validation state, unless explicitly configured to do so" (same section). And it checks only the origin: "the complete path attestation against the AS_PATH attribute of a route is outside the scope" of origin validation (section 1).

## Worked examples

With the one VRP `192.0.2.0/24 24 AS64496`: `192.0.2.0/24 AS64496` is Valid; `192.0.2.0/24 AS64497` is Invalid (another AS); `192.0.2.128/25 AS64496` is Invalid (too specific); `198.51.100.0/24 AS64497` is NotFound; `192.0.2.0/24 NONE` is Invalid. With `192.0.2.0/24 AS64496` and `192.0.2.0/24 AS64497` both in the list, `192.0.2.0/24 AS64497` is Valid. With `203.0.113.0/24 32 AS0` alone, `203.0.113.0/24 AS64496` is Invalid; add `203.0.113.128/25 AS64497` and the route `203.0.113.128/25 AS64497` is Valid. With RFC 9582's `203.0.113.0/24 26 AS64496`, the /24, `203.0.113.128/25` and `203.0.113.192/26` are Valid and `203.0.113.0/27` is Invalid. RFC 9582's Appendix A ROA, AS 65536 for `2001:db8::/32`, makes `2001:db8::/32 AS65536` (asdot `AS1.0`) Valid and `2001:db8:1::/48 AS65536` Invalid. Every one of these is a golden vector.

## API

The same engine answers the `/api/v1/rpki-origin-validation` operation of the site's HTTP API, written out field by field in the OpenAPI contract on the [API page](/api), with examples taken from the golden vectors. The contract also says whether this site serves the API.

- **Request.** A JSON object with `route` (the route line) and `vrps` (the VRP list as text, one per line, or SLURM JSON as text or as a JSON value), such as `{"route":"192.0.2.0/24 AS64497","vrps":"192.0.2.0/24 AS64496\n192.0.2.0/24 AS64497"}`.
- **Response.** `route` (`prefix`, `family`, `length`, `origin` and `originAsdot`), `state`, `vrpFormat`, `vrpCount`, `covering`, `matching`, `vrps` (each with `index`, `line`, `prefix`, `length`, `maxLength`, `maxLengthGiven`, `asn`, `covers`, `relation` and, on a match, `viaMaxLength`), `maxLengthNotes` (each with `authorisedPrefixes` as a decimal string), `notes`, `duplicatesRemoved` and `slurmFiltersIgnored`. For the request above the API answers `state` `Valid`, `covering` 2 and `matching` 1, with relations `wrong-as` and `match`.
- **Errors.** HTTP 400, `invalid_input`, with the engine's message, for example `maxLength 23 must be between the prefix length /24 and 32 (RFC 9582 section 4.3.2.2)` for the VRP `192.0.2.0/24 23 AS64496`.

## Sources

- [RFC 6811, BGP Prefix Origin Validation, January 2013](https://www.rfc-editor.org/rfc/rfc6811.txt) (read 2026-10-19): sections 1 and 2
- [RFC 9582, A Profile for Route Origin Authorizations (ROAs), May 2024](https://www.rfc-editor.org/rfc/rfc9582.txt) (read 2026-10-19): section 4.3.2.2 and Appendix A; it obsoletes RFC 6482
- [RFC 6483, Validation of Route Origination Using the Resource Certificate Public Key Infrastructure (PKI) and Route Origin Authorizations (ROAs), February 2012](https://www.rfc-editor.org/rfc/rfc6483.txt) (read 2026-10-19): section 4
- [RFC 7607, Codification of AS 0 Processing, August 2015](https://www.rfc-editor.org/rfc/rfc7607.txt) (read 2026-10-19): section 2
- [RFC 9319, The Use of maxLength in the Resource Public Key Infrastructure (RPKI), October 2022](https://www.rfc-editor.org/rfc/rfc9319.txt) (read 2026-10-19): Abstract and sections 3 and 5
- [RFC 8416, Simplified Local Internet Number Resource Management with the RPKI (SLURM), August 2018](https://www.rfc-editor.org/rfc/rfc8416.txt) (read 2026-10-19): sections 3.1, 3.2 and 3.4.1
- [RFC 5396, Textual Representation of Autonomous System (AS) Numbers, December 2008](https://www.rfc-editor.org/rfc/rfc5396.txt) (read 2026-10-19): section 2
- [RFC 5398, Autonomous System (AS) Number Reservation for Documentation Use, December 2008](https://www.rfc-editor.org/rfc/rfc5398.txt) (read 2026-10-19): section 4, with RFC 5737 section 3 and RFC 3849 for the documentation addresses
