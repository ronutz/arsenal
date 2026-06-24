// ============================================================================
// src/config/features.ts
// ----------------------------------------------------------------------------
// FEATURE FLAGS — the administrative on/off switches for optional site
// functionality. This is the single place to enable or disable features.
//
// WHY CONFIG-DRIVEN: this site is a static export with no backend, so there is
// no live admin panel that can flip a switch without a redeploy. These flags
// are the honest equivalent: change a value here, rebuild, and the feature turns
// on or off everywhere that checks it. The structure is deliberately shaped like
// a settings object so that, when the closed-service layer exists, these can be
// sourced from a runtime settings API instead of constants, WITHOUT changing any
// of the component code that reads them (components call `isEnabled(...)`, which
// is the seam).
//
// Each flag is documented with what it controls and its default. Turning a flag
// off removes the corresponding UI entirely (the components render nothing).
// ============================================================================

export interface FeatureFlags {
  /** "Request this training" CTA on course and platform pages. */
  requestTraining: boolean;
  /** The TipJar (creator support links). Off until configured + threshold met. */
  tipJar: boolean;
  /** Per-tool funding / "support this tool" interface. */
  toolFunding: boolean;
  /** Per-tool Credits & Sources (provenance) panel. */
  toolProvenance: boolean;
}

// ----------------------------------------------------------------------------
// Current flag values. EDIT THESE to turn features on/off, then rebuild.
// ----------------------------------------------------------------------------
const FLAGS: FeatureFlags = {
  // ON: lead generation for training is live, routed per leadRouting config.
  requestTraining: true,

  // ON: the TipJar is enabled. It still only renders once at least one provider
  // is configured with a URL in config/tipJar.ts (the second gate), so it cannot
  // appear half-built. The /support page stays noindex until you decide otherwise.
  tipJar: true,

  // OFF for launch: per-tool funding interface is built but not yet surfaced.
  toolFunding: false,

  // ON: showing where a tool's logic and data come from builds trust and costs
  // nothing; this is the provenance panel, not a funding ask.
  toolProvenance: true,
};

/**
 * The single seam every component uses to check a feature.
 *
 * Today it reads the constant above. When the service layer lands, this is the
 * one function to change (e.g. read from a settings payload), and every caller
 * keeps working unchanged.
 */
export function isEnabled(flag: keyof FeatureFlags): boolean {
  return FLAGS[flag];
}

/** Read the whole flag set (e.g. for an internal status view). */
export function allFlags(): Readonly<FeatureFlags> {
  return FLAGS;
}
