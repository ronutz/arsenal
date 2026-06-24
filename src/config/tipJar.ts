// ============================================================================
// src/config/tipJar.ts
// ----------------------------------------------------------------------------
// TIPJAR — optional creator-support links. "Bring your own" provider allowlist.
//
// PRINCIPLES (canon):
//   - BYO provider allowlist: only the providers below are ever offered, and
//     only the ones explicitly enabled with a real URL actually appear.
//   - 0% commission: every link goes DIRECT to the provider. This site is not in
//     the payment path and takes nothing. There is no on-site transaction.
//   - Read-only-first: the TipJar only ever links out; it never processes money.
//   - Off by default: the whole feature is gated by the `tipJar` feature flag
//     (currently off), and stays noindex until a support threshold is decided.
//
// Config-driven and admin-panel-ready: a future admin panel edits these values;
// components read them through the getters at the bottom (the seam).
//
// TODO(Rodolfo): enable the providers you want and paste your real URLs. Until
// then everything is disabled and the TipJar shows nothing even if switched on.
// ============================================================================

export type TipProviderId = "githubSponsors" | "koFi" | "buyMeACoffee" | "stripe";

export interface TipProvider {
  id: TipProviderId;
  /** Display label. */
  label: string;
  /** The direct support URL. Empty = not configured = never shown. */
  url: string;
  /** Whether this provider is offered (and has a URL). */
  enabled: boolean;
}

// ----------------------------------------------------------------------------
// The allowlist. Edit `enabled` and `url`. Providers with no URL never appear,
// regardless of `enabled`, so a half-configured provider can't render a dead link.
// ----------------------------------------------------------------------------
const PROVIDERS: TipProvider[] = [
  { id: "githubSponsors", label: "GitHub Sponsors", url: "", enabled: false },
  { id: "koFi", label: "Ko-fi", url: "", enabled: false },
  { id: "buyMeACoffee", label: "Buy Me a Coffee", url: "", enabled: false },
  { id: "stripe", label: "Stripe", url: "", enabled: false },
];

/** Providers that are both enabled AND have a URL (the only ones ever shown). */
export function activeTipProviders(): TipProvider[] {
  return PROVIDERS.filter((p) => p.enabled && p.url.trim().length > 0);
}

/** All providers in the allowlist (e.g. for the admin panel to display). */
export function allTipProviders(): TipProvider[] {
  return PROVIDERS;
}

/** True if at least one provider is ready to show. */
export function hasActiveTipProviders(): boolean {
  return activeTipProviders().length > 0;
}
