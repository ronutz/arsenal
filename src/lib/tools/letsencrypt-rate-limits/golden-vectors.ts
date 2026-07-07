// ============================================================================
// src/lib/tools/letsencrypt-rate-limits/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the Let's Encrypt rate-limit planner
// (set id: "letsencrypt-rate-limits/golden@1").
//
// These exercise: multi-label registered-domain grouping (example.com vs
// example.co.uk, which requires the PSL, not the last two labels), wildcard-
// candidate detection, an apex name with no wildcard candidate, and mixed IP /
// bare-public-suffix inputs. Expected values mirror exactly what compute.run()
// returns; the limits object is the shared LE_LIMITS snapshot.
// ============================================================================

import type { LeRateLimitResult } from "./compute";
import { LE_LIMITS } from "./compute";

/** The vector-set identifier referenced by the tool manifest. */
export const GOLDEN_VECTOR_SET_ID = "letsencrypt-rate-limits/golden@1";

export interface LeGoldenVector {
  name: string;
  input: { names: string };
  expected: LeRateLimitResult;
}

export const LETSENCRYPT_RATE_LIMITS_GOLDEN_VECTORS: LeGoldenVector[] = [
  {
    name: "two-registered-domains-with-wildcards",
    input: { names: "www.example.com\napi.example.com\nblog.example.com\nshop.example.co.uk\nwww.example.co.uk" },
    expected: {
      groups: [
        {
          registeredDomain: "example.com",
          names: ["api.example.com", "blog.example.com", "www.example.com"],
          count: 3,
          minCertificates: 1,
          exceedsWeeklyIfOneCertPerName: false,
          wildcardCandidates: ["*.example.com"],
        },
        {
          registeredDomain: "example.co.uk",
          names: ["shop.example.co.uk", "www.example.co.uk"],
          count: 2,
          minCertificates: 1,
          exceedsWeeklyIfOneCertPerName: false,
          wildcardCandidates: ["*.example.co.uk"],
        },
      ],
      ipAddresses: { ipv4: [], ipv6: [] },
      invalid: [],
      totalNames: 5,
      registeredDomainCount: 2,
      minCertificatesTotal: 2,
      anyDomainExceedsWeekly: false,
      limits: LE_LIMITS,
    },
  },
  {
    name: "apex-only-no-wildcard",
    input: { names: "example.com" },
    expected: {
      groups: [
        {
          registeredDomain: "example.com",
          names: ["example.com"],
          count: 1,
          minCertificates: 1,
          exceedsWeeklyIfOneCertPerName: false,
          wildcardCandidates: [],
        },
      ],
      ipAddresses: { ipv4: [], ipv6: [] },
      invalid: [],
      totalNames: 1,
      registeredDomainCount: 1,
      minCertificatesTotal: 1,
      anyDomainExceedsWeekly: false,
      limits: LE_LIMITS,
    },
  },
  {
    name: "mixed-ip-and-bare-suffix",
    input: { names: "192.0.2.1, co.uk, www.test.org" },
    expected: {
      groups: [
        {
          registeredDomain: "test.org",
          names: ["www.test.org"],
          count: 1,
          minCertificates: 1,
          exceedsWeeklyIfOneCertPerName: false,
          wildcardCandidates: [],
        },
      ],
      ipAddresses: { ipv4: ["192.0.2.1"], ipv6: [] },
      invalid: ["co.uk"],
      totalNames: 1,
      registeredDomainCount: 1,
      minCertificatesTotal: 1,
      anyDomainExceedsWeekly: false,
      limits: LE_LIMITS,
    },
  },
];
