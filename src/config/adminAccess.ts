// ============================================================================
// src/config/adminAccess.ts
// ----------------------------------------------------------------------------
// ADMIN ACCESS — the authorization MODEL for the admin surface.
//
// ////////////////////////////////////////////////////////////////////////////
// CRITICAL HONESTY: this file defines WHO should be allowed and WHAT they may do.
// It does NOT, and on a static export CANNOT, ENFORCE anything. Real enforcement
// requires a server that validates a federated identity token on every request
// and checks it against this model. Any client-side "gate" on a static site is
// not security and must never be treated as such.
//
// Therefore:
//   - The admin page is kept OUT of the public production build by default (see
//     its generateStaticParams), so the surface is not exposed unsecured, and
//     this allowlist is not shipped in the public bundle.
//   - When the closed-service layer exists, it becomes the enforcement point:
//     authenticate via the IdPs below, then call `isAuthorized()` / `roleFor()`
//     server-side. This model is built so that is a wiring step, not a redesign.
// ////////////////////////////////////////////////////////////////////////////
//
// LOCAL-FALLBACK DECISION (SecOps): no local username/password fallback. Casual
// local admin accounts weaken federated controls (shared secrets, weaker MFA,
// poor auditability) and cannot be secured on a static site at all. If emergency
// access is ever required, use a properly-managed break-glass account IN THE IdP
// (hardware-key + MFA, audited, alerting on use), not an in-app password.
// ============================================================================

/** Identity providers used for federated sign-in. */
export type IdP = "google" | "microsoft";

/** RBAC roles. Extend as needed (e.g. add "editor", "viewer"). */
export type Role = "owner";

/** What each role may do. The service layer enforces these. */
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  // Owner: full control of every admin-controllable setting.
  owner: [
    "features:read",
    "features:write",
    "routing:read",
    "routing:write",
    "contact:read",
    "contact:write",
    "tipjar:read",
    "tipjar:write",
  ],
};

export interface AuthorizedIdentity {
  /** The verified email from the IdP. */
  email: string;
  /** Which provider authenticates this identity. */
  idp: IdP;
  /** The role granted to this identity. */
  role: Role;
  /** Optional human label. */
  label?: string;
}

// ----------------------------------------------------------------------------
// THE ALLOWLIST. Only these identities may ever hold admin access. (Enforced by
// the service layer, not here.) Kept out of the public build by gating the admin
// page out of production.
// ----------------------------------------------------------------------------
const AUTHORIZED: AuthorizedIdentity[] = [
  { email: "rnutzman@gmail.com", idp: "google", role: "owner", label: "Rodolfo (Google)" },
  { email: "rodolfo.nutzmann@gmail.com", idp: "google", role: "owner", label: "Rodolfo (Google)" },
  { email: "rodolfo@mindstream.com.br", idp: "microsoft", role: "owner", label: "Rodolfo (Microsoft 365)" },
];

/** Whether the federated IdPs are, by intent, the only sign-in path (no local). */
export const FEDERATED_ONLY = true;

// ----------------------------------------------------------------------------
// The seams the future server-side auth layer calls (case-insensitive email).
// ----------------------------------------------------------------------------

/** Is this verified email allowed any admin access? */
export function isAuthorized(email: string): boolean {
  const e = email.trim().toLowerCase();
  return AUTHORIZED.some((a) => a.email.toLowerCase() === e);
}

/** The role for a verified email, or null if not authorized. */
export function roleFor(email: string): Role | null {
  const e = email.trim().toLowerCase();
  return AUTHORIZED.find((a) => a.email.toLowerCase() === e)?.role ?? null;
}

/** Does the email's role include a given permission? */
export function can(email: string, permission: string): boolean {
  const role = roleFor(email);
  return role ? ROLE_PERMISSIONS[role].includes(permission) : false;
}

/** The allowlist (for an authenticated admin view; never for public display). */
export function authorizedIdentities(): AuthorizedIdentity[] {
  return AUTHORIZED;
}
