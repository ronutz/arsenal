// ============================================================================
// The {manifest, run, vectors} triple for the Extreme Universal switch OS-name
// mapper. A reference table, offline.
// ============================================================================

export { mapOsName, universalFamilies, run, MapperInputError } from "./compute";
export type { MapperResult, Family, OsNaming } from "./compute";
export { verifyVectors, MAPPER_VECTORS, GOLDEN_VECTOR_SET_ID } from "./golden-vectors";
export type { MapperVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "extreme-switch-os-mapper",
  learnLinks: [
    "learn/extreme-universal-os-names",
    "learn/spb-fabric-vocabulary",
  ],
  sources: Object.freeze([
    Object.freeze({ id: "exos-31-6-rn", label: "Extreme Networks - ExtremeXOS and Switch Engine 31.6 release notes, recording the rename", url: "https://documentation.extremenetworks.com/release_notes/ExtremeXOS_SwitchEngine/31.6/GUID-063FF7DF-34E8-494C-AFAB-848B1A0068B3.shtml" }),
    Object.freeze({ id: "extreme-qa", label: "Extreme Portal - What is Switch Engine (EXOS) and Fabric Engine (VOSS)?", url: "https://extreme-networks.my.site.com/ExtrArticleDetail?an=000102405" }),
    Object.freeze({ id: "se-33-rn", label: "Extreme Networks - Switch Engine release notes: persona change deletes configuration, and the boot-menu sequence", url: "https://documentation.extremenetworks.com/release_notes/SwitchEngine/33.1.100/GUID-EEE4A4A1-99DC-4691-B6B5-F88A6FA8042F.shtml" }),
  ]),
});
