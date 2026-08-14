// ============================================================================
// src/lib/tools/extreme-switch-os-mapper/compute.ts
// ----------------------------------------------------------------------------
// EXTREME UNIVERSAL SWITCH OS-NAME MAPPER - the pure engine.
//
// WHAT THIS SOLVES. Extreme renamed two operating systems and only on some
// hardware. ExtremeXOS became SWITCH ENGINE and VOSS became FABRIC ENGINE - but
// only on UNIVERSAL switches. Every older model keeps the old name, the image
// files and the boot menus still say EXOS and VOSS, and documentation from
// either side of the change is still in circulation.
//
// The result is that two engineers can describe the same switch correctly using
// different words, and a third can search for the wrong one and find nothing.
//
// *** THE THING THIS TOOL EXISTS TO SAY LOUDLY ***
//
//   SWITCHING PERSONA DESTROYS THE CONFIGURATION. Extreme's own release notes
//   put it plainly: changing the network operating system deletes all
//   configuration files, debug information, logs, events and statistics
//   belonging to the previous one.
//
// That is not a migration, it is a rebuild, and a tool that reported the naming
// without reporting that would be answering the easy half of the question.
//
// SECOND THING, less dramatic and more likely to bite: upgrading a 5420 or 5520
// from an older ExtremeXOS to Switch Engine 31.6 CHANGES THE SNMP SysObjectID.
// Anything identifying the device by that value stops recognising it, and
// nothing about the switch looks wrong from the console.
//
// SCOPE. A reference table with the facts sourced from Extreme's documentation.
// It knows models, not your inventory.
// ============================================================================

/** A hardware family and what it can run. */
export interface Family {
  /** Model series, e.g. "5520". */
  series: string;
  /** Universal hardware carries the new names; older hardware does not. */
  universal: boolean;
  /** Can it run either persona? */
  dualPersona: boolean;
  /** Notes tied to this family specifically. */
  caveats: string[];
}

export interface OsNaming {
  legacy: string;
  current: string;
  note: string;
}

export interface MapperResult {
  /** The family matched, when the input named one. */
  family?: Family;
  /** The two naming pairs, always returned - they are the point. */
  naming: OsNaming[];
  facts: { label: string; value: string }[];
  notes: string[];
  warnings: string[];
}

export class MapperInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MapperInputError";
  }
}

/**
 * Universal hardware, per Extreme's own list. Kept deliberately as the SERIES
 * rather than every SKU: the naming question is answered at series level, and a
 * table of individual part numbers would rot faster than it helped.
 */
const FAMILIES: readonly Family[] = Object.freeze([
  { series: "4120", universal: true, dualPersona: true, caveats: [] },
  { series: "4220", universal: true, dualPersona: true, caveats: [] },
  { series: "5320", universal: true, dualPersona: true, caveats: ["Fabric Engine support begins at 8.6 on this series."] },
  {
    series: "5420", universal: true, dualPersona: true,
    caveats: [
      "Ran VOSS 8.4 and 8.5 before the rename; Fabric Engine from 8.6.",
      "Upgrading from an older ExtremeXOS to Switch Engine 31.6 CHANGES THE SNMP SysObjectID. Monitoring that identifies the device by that value will stop recognising it, and nothing looks wrong from the console.",
    ],
  },
  {
    series: "5520", universal: true, dualPersona: true,
    caveats: [
      "Ran VOSS 8.2.5 through 8.5 before the rename; Fabric Engine from 8.6.",
      "Same SysObjectID change as the 5420 when upgrading to Switch Engine 31.6.",
    ],
  },
  { series: "5720", universal: true, dualPersona: true, caveats: ["Fabric Engine support begins at 8.7 on this series.", "Uses the GRUB boot menu rather than the space-bar prompt."] },
  {
    series: "7520", universal: true, dualPersona: true,
    caveats: [
      "Stacking is supported when running Switch Engine and NOT when running Fabric Engine. If the design depends on stacking, the persona choice is already made for you.",
      "Uses the GRUB boot menu rather than the space-bar prompt.",
    ],
  },
  { series: "7720", universal: true, dualPersona: true, caveats: ["Uses the GRUB boot menu rather than the space-bar prompt."] },
]);

const NAMING: readonly OsNaming[] = Object.freeze([
  {
    legacy: "ExtremeXOS (EXOS)",
    current: "Switch Engine",
    note: "Same operating system, renamed on Universal hardware. The rename landed at Switch Engine 31.6, and there are no feature or functional differences arising from it.",
  },
  {
    legacy: "VOSS (VSP Operating System Software)",
    current: "Fabric Engine",
    note: "Same operating system, renamed on Universal hardware, from Fabric Engine 8.6. The Avaya-lineage ACLI grammar is unchanged.",
  },
]);

/** Look up a model, an OS name, or nothing at all. */
export function mapOsName(input: string): MapperResult {
  const raw = (input ?? "").trim();
  if (!raw) throw new MapperInputError("Give a model series such as 5520, or an OS name such as VOSS.");

  const notes: string[] = [];
  const warnings: string[] = [];
  const facts: { label: string; value: string }[] = [];
  const lower = raw.toLowerCase();

  // Series match: the first three-or-four digit run that names a known family.
  const digits = raw.match(/\b(\d{4})\b/);
  const family = digits ? FAMILIES.find((f) => f.series === digits[1]) : undefined;

  if (family) {
    facts.push({ label: "Series", value: family.series });
    facts.push({ label: "Universal hardware", value: family.universal ? "yes" : "no" });
    facts.push({ label: "Dual persona", value: family.dualPersona ? "yes - either OS can run on it" : "no" });
    notes.push(
      "This is Universal hardware, so it carries the new names: what used to be called EXOS is Switch Engine here, and what used to be called VOSS is Fabric Engine.",
    );
    for (const c of family.caveats) {
      if (/sysobjectid|not when running/i.test(c)) warnings.push(c);
      else notes.push(c);
    }
  } else if (digits || /\b[xX]\d{3}[a-zA-Z0-9-]*\b|summit|\bvsp\s*\d/i.test(raw)) {
    const named = digits ? digits[1] : raw.trim();
    facts.push({ label: "Series", value: named });
    notes.push(
      `The ${digits ? digits[1] : raw.trim()} is not in this tool's Universal list. Non-Universal models keep the ORIGINAL names - EXOS and VOSS - and the rename does not apply to them. That is the commonest reason a search for "Switch Engine" plus a model number returns nothing useful.`,
    );
  }

  // OS-name match, so somebody can arrive from either direction.
  if (/exos|extremexos|switch\s*engine/.test(lower)) {
    notes.push(
      "ExtremeXOS and Switch Engine are the same operating system. If a document, an image filename or a boot menu says EXOS, it is not out of date in any way that matters - the file names and the boot menus still use the old names.",
    );
  }
  if (/voss|fabric\s*engine|vsp/.test(lower)) {
    notes.push(
      "VOSS and Fabric Engine are the same operating system. The ACLI grammar, the Fabric Connect behaviour and the Avaya lineage are all unchanged by the renaming.",
    );
  }

  // THE WARNING THAT MATTERS MOST, ALWAYS.
  warnings.push(
    "Changing persona is destructive. Extreme's own release notes state that changing the network operating system DELETES all configuration files, debug information, logs, events and statistics belonging to the previous one. Treat it as a rebuild with a fresh configuration, not as a migration.",
  );

  notes.push(
    "The boot-menu question is worth memorising because it is asked in the negative: when the switch asks whether you would like to change the OS to VOSS, answering N keeps Switch Engine and Y moves to Fabric Engine.",
  );
  notes.push(
    "Persona can also be pre-provisioned centrally, so a switch collects its intended OS on first boot rather than being chosen at the console. That is the difference between a site visit and a delivery.",
  );

  return { family, naming: [...NAMING], facts, notes, warnings };
}

/** Every Universal family, for the reference panel. */
export function universalFamilies(): readonly Family[] {
  return FAMILIES;
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: string): MapperResult {
  return mapOsName(input);
}
