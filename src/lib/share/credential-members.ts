// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// src/lib/share/credential-members.ts
// ----------------------------------------------------------------------------
// Member and key names a standard defines as holding a credential, for the
// "Share results" checks that read JSON or YAML (01/11/2026). The OIDC decoder
// and the JSON formatter and converter each kept their own copy of these five
// (the JSON copy so its pages would not load the token decoders the OIDC module
// imports); this leaf module imports nothing, so both read it from here.
//   access_token, refresh_token  RFC 6749 sections 1.4 ("Access tokens are
//                                credentials used to access protected
//                                resources"), 1.5 ("Refresh tokens are
//                                credentials used to obtain access tokens")
//                                and 5.1 (the token response's members);
//   id_token                     OpenID Connect Core 1.0, section 3.1.3.3 (the
//                                token response's ID Token);
//   client_secret                RFC 7591 section 3.2.1 ("OAuth 2.0 client
//                                secret string");
//   registration_access_token    RFC 7592 section 3.
// All read 2026-11-01 (by the wave 3C and 4D helpers).
// ============================================================================

/** The five names (sources in the header). */
export const CREDENTIAL_MEMBERS: ReadonlySet<string> = new Set([
  "access_token", // RFC 6749 sections 1.4 and 5.1
  "refresh_token", // RFC 6749 sections 1.5 and 5.1
  "id_token", // OpenID Connect Core 1.0, section 3.1.3.3
  "client_secret", // RFC 7591 section 3.2.1
  "registration_access_token", // RFC 7592 section 3
]);
