// ============================================================================
// src/config/contact.ts
// ----------------------------------------------------------------------------
// CONTACT SETTINGS — the admin-controllable configuration for the Contact page.
//
// Part of the config-driven, admin-panel-ready pattern (see features.ts): these
// are the values a future admin panel would edit. Components read them through
// the getters at the bottom, which are the seam a runtime settings service can
// later feed without changing any page code.
//
// FORM SUBMISSION: this is a static site with no backend, so there is nowhere to
// POST a form today. `formEndpoint` is therefore null, and the contact form
// falls back to composing a message in the visitor's own mail client (a working,
// privacy-preserving path, nothing transits a third party). When the closed-
// service layer exists, set `formEndpoint` to its URL and the same form will
// POST to it instead, no component changes required.
// ============================================================================

export interface ContactChannel {
  /** Channel label, e.g. "LinkedIn". */
  label: string;
  /** Short descriptor of what it's for. */
  description: string;
  /** Destination URL (or mailto:). */
  url: string;
  /** Whether the link is external (opens in a new tab). */
  external: boolean;
}

export interface ContactSettings {
  /**
   * The address contact-form messages are composed to (mailto fallback) and
   * shown as the direct email channel.
   *
   * TODO(Rodolfo): set this to the real public ronutz.com contact address.
   * Placeholder until then.
   */
  email: string;
  /**
   * Optional server endpoint to POST the contact form to. Null on the static
   * site (mailto fallback is used). Set this when the service layer exists.
   */
  formEndpoint: string | null;
  /** Direct contact channels shown alongside the form. */
  channels: ContactChannel[];
}

// ----------------------------------------------------------------------------
// Current settings. EDIT THESE (or, later, drive from the admin panel).
// ----------------------------------------------------------------------------
const SETTINGS: ContactSettings = {
  // PLACEHOLDER: replace with the real public contact address.
  email: "hello@ronutz.com",

  // No backend on the static site; form uses the mailto fallback.
  formEndpoint: null,

  channels: [
    {
      label: "LinkedIn",
      description: "Connect professionally",
      url: "https://www.linkedin.com/in/nutzmann",
      external: true,
    },
    {
      label: "Official training",
      description: "Book a course through Red Education",
      url: "https://www.rededucation.com/",
      external: true,
    },
  ],
};

// ----------------------------------------------------------------------------
// Getters — the seam every component uses (runtime-settings-ready).
// ----------------------------------------------------------------------------

/** The public contact email (also the mailto fallback target). */
export function contactEmail(): string {
  return SETTINGS.email;
}

/** The form POST endpoint, or null if the mailto fallback should be used. */
export function contactFormEndpoint(): string | null {
  return SETTINGS.formEndpoint;
}

/** The direct contact channels. */
export function contactChannels(): ContactChannel[] {
  return SETTINGS.channels;
}

/** True if the placeholder email is still in place (drives a dev-only reminder). */
export function contactEmailIsPlaceholder(): boolean {
  return SETTINGS.email === "hello@ronutz.com";
}
