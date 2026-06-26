// ============================================================================
// src/lib/tools/hash/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the Hash tool (set id: "hash-golden-v1").
//
// GENERATED via Web Crypto and frozen. The SHA-256("abc"), SHA-256("") and
// SHA-1("abc") values match the published NIST / RFC 6234 test vectors (the
// generator asserts this). run() never throws (any string hashes), so there are
// no reject vectors. Regenerate via /tmp/gen-hash-vectors.mjs if needed.
// ============================================================================

import type { HashResult } from "./compute";

/** The vector-set identifier referenced by the tool manifest. */
export const GOLDEN_VECTOR_SET_ID = "hash-golden-v1";

/** A hash case: `input` must produce `expected`. */
export interface HashGoldenVector {
  name: string;
  input: string;
  expected: HashResult;
}

/** A rejection case shape (run() never throws, so the list stays empty). */
export interface HashRejectVector {
  name: string;
  input: string;
}

export const HASH_GOLDEN_VECTORS: HashGoldenVector[] = [
    {
      "name": "empty",
      "input": "",
      "expected": {
        "input": "",
        "digests": {
          "SHA-256": {
            "hex": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "base64": "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU="
          },
          "SHA-384": {
            "hex": "38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b",
            "base64": "OLBgp1GsljhM2TJ+sbHjaiH9txEUvgdDTAzHv2P24donTt6/529l+9Ua0vFImLlb"
          },
          "SHA-512": {
            "hex": "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
            "base64": "z4PhNX7vuL3xVChQ1m2AB9Yg5AULVxXcg/SpIdNs6c5H0NE8XYXysP+DGNKHfuwvY7kxvUdBeoGlODJ6+SfaPg=="
          },
          "SHA-1": {
            "hex": "da39a3ee5e6b4b0d3255bfef95601890afd80709",
            "base64": "2jmj7l5rSw0yVb/vlWAYkK/YBwk="
          }
        }
      }
    },
    {
      "name": "abc",
      "input": "abc",
      "expected": {
        "input": "abc",
        "digests": {
          "SHA-256": {
            "hex": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
            "base64": "ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0="
          },
          "SHA-384": {
            "hex": "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
            "base64": "ywB1P0WjXou1oD1pmsZQBycsMqsO3tFjGotgWkP/W+2AhgcroefMI1i67KE0yCWn"
          },
          "SHA-512": {
            "hex": "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
            "base64": "3a81oZNherrMQXNJriBBMRLm+k6JqX6iCp7u5ktV05ohkpkqJ0/BqDa6PCOj/uu9RU1EI2Q86A4qmslPpUyknw=="
          },
          "SHA-1": {
            "hex": "a9993e364706816aba3e25717850c26c9cd0d89d",
            "base64": "qZk+NkcGgWq6PiVxeFDCbJzQ2J0="
          }
        }
      }
    },
    {
      "name": "hello-world",
      "input": "Hello, World!",
      "expected": {
        "input": "Hello, World!",
        "digests": {
          "SHA-256": {
            "hex": "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f",
            "base64": "3/1gIbsr1bCvZ2KQgJ7DpTGR3YHH9wpLKGiKNiGCmG8="
          },
          "SHA-384": {
            "hex": "5485cc9b3365b4305dfb4e8337e0a598a574f8242bf17289e0dd6c20a3cd44a089de16ab4ab308f63e44b1170eb5f515",
            "base64": "VIXMmzNltDBd+06DN+ClmKV0+CQr8XKJ4N1sIKPNRKCJ3harSrMI9j5EsRcOtfUV"
          },
          "SHA-512": {
            "hex": "374d794a95cdcfd8b35993185fef9ba368f160d8daf432d08ba9f1ed1e5abe6cc69291e0fa2fe0006a52570ef18c19def4e617c33ce52ef0a6e5fbe318cb0387",
            "base64": "N015SpXNz9izWZMYX++bo2jxYNja9DLQi6nx7R5avmzGkpHg+i/gAGpSVw7xjBne9OYXwzzlLvCm5fvjGMsDhw=="
          },
          "SHA-1": {
            "hex": "0a0a9f2a6772942557ab5355d76af442f8f65e01",
            "base64": "CgqfKmdylCVXq1NV12r0Qvj2XgE="
          }
        }
      }
    },
    {
      "name": "utf8-multibyte",
      "input": "café ☕",
      "expected": {
        "input": "café ☕",
        "digests": {
          "SHA-256": {
            "hex": "a7e46d54289812af2aa5b08c2fbab5d24bccfc6586df55b187272c8a2a31c85f",
            "base64": "p+RtVCiYEq8qpbCML7q10kvM/GWG31WxhycsiioxyF8="
          },
          "SHA-384": {
            "hex": "331abe00c666f290c1d59f91c17577c3caef83995bf78c2b947ada8300b4525f705dfd791de7e72ca7bced16797eba43",
            "base64": "Mxq+AMZm8pDB1Z+RwXV3w8rvg5lb94wrlHragwC0Ul9wXf15HefnLKe87RZ5frpD"
          },
          "SHA-512": {
            "hex": "72d701fa89a33117db8c9f9c226633a67b0d3d5ae87fa43a321ffbe8635c0a91e0be5c3aa1a000bc03702a7da30d2b91ec22b6e1336198d49e0bd302bc7f9469",
            "base64": "ctcB+omjMRfbjJ+cImYzpnsNPVrof6Q6Mh/76GNcCpHgvlw6oaAAvANwKn2jDSuR7CK24TNhmNSeC9MCvH+UaQ=="
          },
          "SHA-1": {
            "hex": "ceb26d538cd94dcf753ed777f3e9134ebd277860",
            "base64": "zrJtU4zZTc91Ptd38+kTTr0neGA="
          }
        }
      }
    }
  ];

export const HASH_REJECT_VECTORS: HashRejectVector[] = [];
