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

import { RED_EDUCATION_ALL_VENDORS } from "@/config/redEducation";
import { revealEmail } from "@/lib/protected-email"; // the protected store of the site's addresses

export interface ContactChannel {
  /**
   * Stable id. The display label + description are resolved from i18n
   * (contact.channels.<id>.label / .description) so they translate with the
   * rest of the page; only the structural routing (where it links, whether it
   * opens externally) lives here in config.
   */
  id: string;
  /** Destination URL (or mailto:). */
  url: string;
  /** Whether the link is external (opens in a new tab). */
  external: boolean;
}

export interface ContactSettings {
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
// Official public contact address. Since 01/11/2026 it is not stored here at all: it comes from
// src/lib/protected-email.ts ("site"), where every protected address is kept as character codes XORed with a key and
// reversed, and is decoded only when contactEmail() is called. The plain character codes kept here before (assembled
// with String.fromCharCode, so no "user@domain" literal reached a bundle) still spelled the address in order for any
// harvester that decodes number lists, and the contact form's script carried them (found 01/11/2026 while answering
// PRIME's "How is my email address being kept from scrapers?"). check-no-plain-email now fails a build on such a list.

const SETTINGS: ContactSettings = {
  // No backend on the static site; form uses the mailto fallback.
  formEndpoint: null,

  channels: [
    // Display label + description for each id live in i18n under
    // contact.channels.<id> (translatable). Brand names (LinkedIn, YouTube,
    // Instagram) are the same in every locale, so only their descriptions are
    // translated in the non-English packs; "training" translates both.
    { id: "linkedin", url: "https://www.linkedin.com/in/nutzmann", external: true },
    { id: "youtube", url: "https://www.youtube.com/@ronutz", external: true },
    { id: "instagram", url: "https://www.instagram.com/ronutz/", external: true },
    // Added 2026-09-11 (PRIME). Both are IDENTITY pages for Rodolfo rather
    // than artefacts, which is why they also serve as schema.org sameAs:
    // Credly is third-party verification of the credentials by their own
    // issuers, and the Red Education team page is his employer confirming
    // him. Individual badge URLs are deliberately NOT here - sameAs is for
    // identities, and the badges already appear on /about/credentials.
    { id: "credly", url: "https://www.credly.com/users/rodolfo-nutzmann/", external: true },
    { id: "redEducationProfile", url: "https://www.rededucation.com/team/rodolfo-nutzmann/", external: true },
    { id: "training", url: RED_EDUCATION_ALL_VENDORS /* attributed at render (standing rule 2026-07-22); the all-vendor course index rather than the homepage, PRIME 2026-08-16 */, external: true },
  ],
};

// ----------------------------------------------------------------------------
// Getters — the seam every component uses (runtime-settings-ready).
// ----------------------------------------------------------------------------

/**
 * The public contact email (the contact form's mailto target, and the address its drafted notice names), decoded from
 * the protected store on each call. Call it on the visitor's action, never while rendering on the server (what the
 * server renders lands in the HTML and the page data); the admin page masks it before rendering.
 */
export function contactEmail(): string {
  return revealEmail("site"); // decoded only now
}

/** The form POST endpoint, or null if the mailto fallback should be used. */
export function contactFormEndpoint(): string | null {
  return SETTINGS.formEndpoint;
}

/** The direct contact channels. */
export function contactChannels(): ContactChannel[] {
  return SETTINGS.channels;
}

/**
 * Kept for the contact page's optional dev reminder. The address is now the
 * official public one, so this is always false; flip the logic back if you ever
 * stage a placeholder again.
 */
export function contactEmailIsPlaceholder(): boolean {
  return false;
}
