// ============================================================================
// src/lib/tools/base64/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the Base64 unified codec (set id: "base64-codec-golden-v1").
//
// GENERATED from the reference algorithm (analyzeCodec) and frozen, so they
// match it exactly across all five codecs. Each golden vector stores the full
// CodecResult for one input: every codec encoded, and a decode attempt under
// every codec. Because run() never throws, decode failures live inside the
// golden vectors' decoded[codec].ok === false; the explicit reject vectors below
// additionally pin (input, codec) -> reason. Regenerate via /tmp/b64test/gen.cjs
// if the algorithm changes; do not hand-edit expected values.
// ============================================================================

import type { CodecResult, CodecDecodeReason } from "./compute";

/** The vector-set identifier referenced by the tool manifest. */
export const GOLDEN_VECTOR_SET_ID = "base64-codec-golden-v1";

/** An analyze case: `input` must produce `expected` (full CodecResult). */
export interface Base64GoldenVector {
  name: string;
  input: string;
  expected: CodecResult;
}

export const BASE64_GOLDEN_VECTORS: Base64GoldenVector[] = [
  {
    "name": "empty",
    "input": "",
    "expected": {
      "input": "",
      "encoded": {
        "base64": "",
        "base64url": "",
        "base32": "",
        "base16": "",
        "percent": ""
      },
      "decoded": {
        "base64": {
          "ok": true,
          "text": "",
          "byteLength": 0,
          "isUtf8": true
        },
        "base64url": {
          "ok": true,
          "text": "",
          "byteLength": 0,
          "isUtf8": true
        },
        "base32": {
          "ok": true,
          "text": "",
          "byteLength": 0,
          "isUtf8": true
        },
        "base16": {
          "ok": true,
          "text": "",
          "byteLength": 0,
          "isUtf8": true
        },
        "percent": {
          "ok": true,
          "text": "",
          "byteLength": 0,
          "isUtf8": true
        }
      }
    }
  },
  {
    "name": "foobar",
    "input": "foobar",
    "expected": {
      "input": "foobar",
      "encoded": {
        "base64": "Zm9vYmFy",
        "base64url": "Zm9vYmFy",
        "base32": "MZXW6YTBOI======",
        "base16": "666F6F626172",
        "percent": "foobar"
      },
      "decoded": {
        "base64": {
          "ok": true,
          "text": "~�\u001bj",
          "byteLength": 4,
          "isUtf8": false
        },
        "base64url": {
          "ok": true,
          "text": "~�\u001bj",
          "byteLength": 4,
          "isUtf8": false
        },
        "base32": {
          "ok": false,
          "reason": "invalid-length"
        },
        "base16": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "percent": {
          "ok": true,
          "text": "foobar",
          "byteLength": 6,
          "isUtf8": true
        }
      }
    }
  },
  {
    "name": "single-byte-f",
    "input": "f",
    "expected": {
      "input": "f",
      "encoded": {
        "base64": "Zg==",
        "base64url": "Zg",
        "base32": "MY======",
        "base16": "66",
        "percent": "f"
      },
      "decoded": {
        "base64": {
          "ok": false,
          "reason": "invalid-length"
        },
        "base64url": {
          "ok": false,
          "reason": "invalid-length"
        },
        "base32": {
          "ok": false,
          "reason": "invalid-length"
        },
        "base16": {
          "ok": false,
          "reason": "invalid-length"
        },
        "percent": {
          "ok": true,
          "text": "f",
          "byteLength": 1,
          "isUtf8": true
        }
      }
    }
  },
  {
    "name": "two-bytes-fo",
    "input": "fo",
    "expected": {
      "input": "fo",
      "encoded": {
        "base64": "Zm8=",
        "base64url": "Zm8",
        "base32": "MZXQ====",
        "base16": "666F",
        "percent": "fo"
      },
      "decoded": {
        "base64": {
          "ok": true,
          "text": "~",
          "byteLength": 1,
          "isUtf8": true
        },
        "base64url": {
          "ok": true,
          "text": "~",
          "byteLength": 1,
          "isUtf8": true
        },
        "base32": {
          "ok": true,
          "text": "+",
          "byteLength": 1,
          "isUtf8": true
        },
        "base16": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "percent": {
          "ok": true,
          "text": "fo",
          "byteLength": 2,
          "isUtf8": true
        }
      }
    }
  },
  {
    "name": "four-bytes-foob",
    "input": "foob",
    "expected": {
      "input": "foob",
      "encoded": {
        "base64": "Zm9vYg==",
        "base64url": "Zm9vYg",
        "base32": "MZXW6YQ=",
        "base16": "666F6F62",
        "percent": "foob"
      },
      "decoded": {
        "base64": {
          "ok": true,
          "text": "~�\u001b",
          "byteLength": 3,
          "isUtf8": false
        },
        "base64url": {
          "ok": true,
          "text": "~�\u001b",
          "byteLength": 3,
          "isUtf8": false
        },
        "base32": {
          "ok": true,
          "text": "+�",
          "byteLength": 2,
          "isUtf8": false
        },
        "base16": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "percent": {
          "ok": true,
          "text": "foob",
          "byteLength": 4,
          "isUtf8": true
        }
      }
    }
  },
  {
    "name": "text-punctuation",
    "input": "Hello, World!",
    "expected": {
      "input": "Hello, World!",
      "encoded": {
        "base64": "SGVsbG8sIFdvcmxkIQ==",
        "base64url": "SGVsbG8sIFdvcmxkIQ",
        "base32": "JBSWY3DPFQQFO33SNRSCC===",
        "base16": "48656C6C6F2C20576F726C6421",
        "percent": "Hello%2C%20World%21"
      },
      "decoded": {
        "base64": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "base64url": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "base32": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "base16": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "percent": {
          "ok": true,
          "text": "Hello, World!",
          "byteLength": 13,
          "isUtf8": true
        }
      }
    }
  },
  {
    "name": "utf8-multibyte",
    "input": "café ☕",
    "expected": {
      "input": "café ☕",
      "encoded": {
        "base64": "Y2Fmw6kg4piV",
        "base64url": "Y2Fmw6kg4piV",
        "base32": "MNQWNQ5JEDRJRFI=",
        "base16": "636166C3A920E29895",
        "percent": "caf%C3%A9%20%E2%98%95"
      },
      "decoded": {
        "base64": {
          "ok": false,
          "reason": "invalid-length"
        },
        "base64url": {
          "ok": false,
          "reason": "invalid-length"
        },
        "base32": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "base16": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "percent": {
          "ok": true,
          "text": "café ☕",
          "byteLength": 9,
          "isUtf8": true
        }
      }
    }
  },
  {
    "name": "http-basic-auth",
    "input": "Aladdin:open sesame",
    "expected": {
      "input": "Aladdin:open sesame",
      "encoded": {
        "base64": "QWxhZGRpbjpvcGVuIHNlc2FtZQ==",
        "base64url": "QWxhZGRpbjpvcGVuIHNlc2FtZQ",
        "base32": "IFWGCZDENFXDU33QMVXCA43FONQW2ZI=",
        "base16": "416C616464696E3A6F70656E20736573616D65",
        "percent": "Aladdin%3Aopen%20sesame"
      },
      "decoded": {
        "base64": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "base64url": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "base32": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "base16": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "percent": {
          "ok": true,
          "text": "Aladdin:open sesame",
          "byteLength": 19,
          "isUtf8": true
        }
      }
    }
  },
  {
    "name": "decode-base64-hello",
    "input": "SGVsbG8gV29ybGQ=",
    "expected": {
      "input": "SGVsbG8gV29ybGQ=",
      "encoded": {
        "base64": "U0dWc2JHOGdWMjl5YkdRPQ==",
        "base64url": "U0dWc2JHOGdWMjl5YkdRPQ",
        "base32": "KNDVM43CI44GOVRSHF4WER2RHU======",
        "base16": "5347567362473867563239796247513D",
        "percent": "SGVsbG8gV29ybGQ%3D"
      },
      "decoded": {
        "base64": {
          "ok": true,
          "text": "Hello World",
          "byteLength": 11,
          "isUtf8": true
        },
        "base64url": {
          "ok": true,
          "text": "Hello World",
          "byteLength": 11,
          "isUtf8": true
        },
        "base32": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "base16": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "percent": {
          "ok": true,
          "text": "SGVsbG8gV29ybGQ=",
          "byteLength": 16,
          "isUtf8": true
        }
      }
    }
  },
  {
    "name": "decode-base32-foobar",
    "input": "MZXW6YTBOI======",
    "expected": {
      "input": "MZXW6YTBOI======",
      "encoded": {
        "base64": "TVpYVzZZVEJPST09PT09PQ==",
        "base64url": "TVpYVzZZVEJPST09PT09PQ",
        "base32": "JVNFQVZWLFKEET2JHU6T2PJ5HU======",
        "base16": "4D5A5857365954424F493D3D3D3D3D3D",
        "percent": "MZXW6YTBOI%3D%3D%3D%3D%3D%3D"
      },
      "decoded": {
        "base64": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "base64url": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "base32": {
          "ok": true,
          "text": "foobar",
          "byteLength": 6,
          "isUtf8": true
        },
        "base16": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "percent": {
          "ok": true,
          "text": "MZXW6YTBOI======",
          "byteLength": 16,
          "isUtf8": true
        }
      }
    }
  },
  {
    "name": "decode-hex-foobar",
    "input": "666F6F626172",
    "expected": {
      "input": "666F6F626172",
      "encoded": {
        "base64": "NjY2RjZGNjI2MTcy",
        "base64url": "NjY2RjZGNjI2MTcy",
        "base32": "GY3DMRRWIY3DENRRG4ZA====",
        "base16": "363636463646363236313732",
        "percent": "666F6F626172"
      },
      "decoded": {
        "base64": {
          "ok": true,
          "text": "뮅�^��^�",
          "byteLength": 9,
          "isUtf8": false
        },
        "base64url": {
          "ok": true,
          "text": "뮅�^��^�",
          "byteLength": 9,
          "isUtf8": false
        },
        "base32": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "base16": {
          "ok": true,
          "text": "foobar",
          "byteLength": 6,
          "isUtf8": true
        },
        "percent": {
          "ok": true,
          "text": "666F6F626172",
          "byteLength": 12,
          "isUtf8": true
        }
      }
    }
  },
  {
    "name": "decode-percent",
    "input": "Hello%20World%21",
    "expected": {
      "input": "Hello%20World%21",
      "encoded": {
        "base64": "SGVsbG8lMjBXb3JsZCUyMQ==",
        "base64url": "SGVsbG8lMjBXb3JsZCUyMQ",
        "base32": "JBSWY3DPEUZDAV3POJWGIJJSGE======",
        "base16": "48656C6C6F253230576F726C64253231",
        "percent": "Hello%2520World%2521"
      },
      "decoded": {
        "base64": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "base64url": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "base32": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "base16": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "percent": {
          "ok": true,
          "text": "Hello World!",
          "byteLength": 12,
          "isUtf8": true
        }
      }
    }
  },
  {
    "name": "binary-not-utf8",
    "input": "//79",
    "expected": {
      "input": "//79",
      "encoded": {
        "base64": "Ly83OQ==",
        "base64url": "Ly83OQ",
        "base32": "F4XTOOI=",
        "base16": "2F2F3739",
        "percent": "%2F%2F79"
      },
      "decoded": {
        "base64": {
          "ok": true,
          "text": "���",
          "byteLength": 3,
          "isUtf8": false
        },
        "base64url": {
          "ok": true,
          "text": "���",
          "byteLength": 3,
          "isUtf8": false
        },
        "base32": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "base16": {
          "ok": false,
          "reason": "invalid-characters"
        },
        "percent": {
          "ok": true,
          "text": "//79",
          "byteLength": 4,
          "isUtf8": true
        }
      }
    }
  }
];

/** A per-codec rejection case: decoding `input` under `codec` fails with `reason`. */
export interface Base64RejectVector {
  name: string;
  input: string;
  codec: string;
  reason: CodecDecodeReason;
}

export const BASE64_REJECT_VECTORS: Base64RejectVector[] = [
  {
    "name": "b64-len-4n1",
    "input": "QQQQQ",
    "codec": "base64",
    "reason": "invalid-length"
  },
  {
    "name": "b64-bad-char",
    "input": "@@@@",
    "codec": "base64",
    "reason": "invalid-characters"
  },
  {
    "name": "b32-len-mod1",
    "input": "A",
    "codec": "base32",
    "reason": "invalid-length"
  },
  {
    "name": "b32-bad-char",
    "input": "0189",
    "codec": "base32",
    "reason": "invalid-characters"
  },
  {
    "name": "hex-odd-length",
    "input": "ABC",
    "codec": "base16",
    "reason": "invalid-length"
  },
  {
    "name": "hex-bad-char",
    "input": "GG",
    "codec": "base16",
    "reason": "invalid-characters"
  },
  {
    "name": "percent-bad-escape",
    "input": "%2G",
    "codec": "percent",
    "reason": "invalid-escape"
  }
];
