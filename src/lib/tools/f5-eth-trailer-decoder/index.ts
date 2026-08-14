// ============================================================================
// The {manifest, run, vectors} triple for the F5 Ethernet trailer decoder.
// Offline, and it stops at the TLS provider section by design.
// ============================================================================

export { decodeTrailer, run, TrailerError } from "./compute";
export type { TrailerDecode, TrailerField, NoiseLevel } from "./compute";
export { verifyVectors, TRAILER_VECTORS, GOLDEN_VECTOR_SET_ID } from "./golden-vectors";
export type { TrailerVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "f5-eth-trailer-decoder",
  learnLinks: [
    "learn/f5-ethernet-trailer",
  ],
  sources: Object.freeze([
    Object.freeze({ id: "f5-k14812111", label: "F5 - Configure Wireshark to read F5 Ethernet Trailers (K14812111)", url: "https://my.f5.com/manage/s/article/K14812111" }),
    Object.freeze({ id: "devcentral-plugin", label: "F5 DevCentral - Getting started with the F5 Wireshark plugin", url: "https://community.f5.com/kb/technicalarticles/getting-started-with-the-f5-wireshark-plugin-on-windows/285686" }),
    Object.freeze({ id: "wireshark-dissector", label: "Wireshark - packet-f5ethtrailer dissector source", url: "https://github.com/wireshark/wireshark/blob/master/epan/dissectors/packet-f5ethtrailer.c" }),
  ]),
});
