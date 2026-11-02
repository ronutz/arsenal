// ============================================================================
// src/lib/tools/oauth-flow-chooser/compute.ts
// ----------------------------------------------------------------------------
// THE OAUTH FLOW CHOOSER - a deterministic decision engine that maps three
// honest questions (what kind of app, is there a user, do you need offline
// access) to the modern grant: authorization code + PKCE, client credentials,
// or the device grant - and, just as importantly, to the reasoned AVOIDED
// list, where implicit and ROPC are retired by name with the Security BCP
// (RFC 9700) cited. Every recommendation carries its RFC. Second and final
// tool of the Ping run: the choice this encodes is the first question of
// every PingFederate, PingAM, and PingOne integration. (D-19.)
//
// PAGE LANGUAGE (02/11/2026): every sentence and label of the reading (names,
// reasons, notes, the avoided list) is an EngineText (../engine-text.ts): a
// stable id, the English as before. chooseLocalisable() returns them for the
// page (pack keys tools.oauth-flow-chooser.engine.<id>); choose() returns
// plainText() of the same reading, so the API and the golden vectors are
// unchanged. run()'s two input errors are API-only and stay plain strings.
// ============================================================================

import { say, plainText, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

/** The application shape being integrated. */
export type AppType = "server-web" | "spa" | "native" | "service" | "device";

/** The structured input. */
export interface ChooserInput {
  appType: AppType;
  /** Does the app act on behalf of a signed-in human (and need to know who)? */
  wantsIdentity: boolean;
  /** Does the app need access while the user is away (refresh tokens)? */
  needsOffline: boolean;
}

/** One retired-or-excluded grant with its reason. */
export interface Avoided<S = string> {
  grant: S; // the grant, as a label (S: string for the API, EngineText for the page)
  why: S; // why it is avoided
}

/** The full deterministic result. */
export interface ChooserResult<S = string> {
  ok: true;
  /** The grant to use, by its protocol name. */
  grant: string;
  /** Human name of the flow. */
  name: S; // the grant's display name
  /** Client type this implies. */
  clientType: "confidential" | "public";
  /** The governing citations. */
  citations: string[];
  /** Ordered reasons this is the right answer. */
  why: S[]; // the reasons
  /** OIDC layer note (present when identity is requested and possible). */
  oidcNote?: S; // the OIDC layer, when identity is wanted
  /** Refresh-token guidance (present when offline access is requested). */
  refreshNote?: S; // refresh tokens, when offline access is wanted
  /** Grants deliberately not chosen, each with its reason. */
  avoided: Avoided<S>[]; // the grants not to use, and why
  /** A caution when the input combination is contradictory. */
  warning?: S; // a mismatch between the answers
}

export interface ChooserError {
  ok: false;
  error: string;
}

const RETIRED: Avoided<EngineText>[] = [ // the two retired grants, sentences with ids
  {
    grant: say("grant.implicit", "implicit"), // the grant's name, as RFC 6749 writes it
    why: say("avoided.implicit", "Retired. Tokens in the URL fragment, no client authentication, no PKCE binding - the OAuth 2.0 Security BCP (RFC 9700) says use authorization code + PKCE instead, and OAuth 2.1 removes implicit entirely."), // pack key engine.avoided.implicit
  },
  {
    grant: say("grant.ropc", "password (ROPC)"), // pack key engine.grant.ropc
    why: say("avoided.ropc", "Retired. The app handles the user's actual credentials, which breaks MFA, federation, and phishing resistance in one move - RFC 9700 says it must not be used."), // pack key engine.avoided.ropc
  },
];

/** The pure decision function. Deterministic; no I/O. */
export function choose(input: ChooserInput): ChooserResult | ChooserError {
  return plainText(chooseLocalisable(input)); // the page's reading with every sentence as its English
}

/**
 * The same reading with every sentence as an EngineText, for the page (02/11/2026).
 * @param input the three answers
 * @returns the recommendation, sentences with ids
 */
export function chooseLocalisable(input: ChooserInput): ChooserResult<EngineText> | ChooserError {
  const { appType, wantsIdentity, needsOffline } = input;
  const avoided: Avoided<EngineText>[] = [...RETIRED]; // the retired grants first

  if (appType === "service") {
    const r: ChooserResult<EngineText> = { // sentences with ids
      ok: true,
      grant: "client_credentials",
      name: say("name.clientCredentials", "Client Credentials"), // pack key engine.name.clientCredentials
      clientType: "confidential",
      citations: ["RFC 6749 §4.4"],
      why: [
        say("why.service.0", "No human is present: the client authenticates as ITSELF and acts under its own authority."), // pack key engine.why.service.0
        say("why.service.1", "The client can hold a secret (or better, a private key / mTLS credential), so it is a confidential client."), // pack key engine.why.service.1
      ],
      avoided: avoided.concat([
        {
          grant: say("grant.authorizationCode", "authorization_code"), // the grant, as written
          why: say("avoided.service.authCode", "There is no user to redirect and no consent to gather - the interactive flows solve a problem this app does not have."), // pack key engine.avoided.service.authCode
        },
      ]),
    };
    if (wantsIdentity) {
      r.warning =
        say("warning.serviceIdentity", "You asked for end-user identity, but machine-to-machine flows have no end user. If a human's context is involved, this is not a service integration - pick the app type the human actually uses."); // pack key engine.warning.serviceIdentity
    }
    if (needsOffline) {
      r.refreshNote =
        say("refresh.service", "Client credentials needs no refresh token: RFC 6749 §4.4.3 says one SHOULD NOT be issued - the client simply authenticates again when the access token expires."); // pack key engine.refresh.service
    }
    return r;
  }

  if (appType === "device") {
    const r: ChooserResult<EngineText> = { // sentences with ids
      ok: true,
      grant: "urn:ietf:params:oauth:grant-type:device_code",
      name: say("name.device", "Device Authorization Grant"), // pack key engine.name.device
      clientType: "public",
      citations: ["RFC 8628"],
      why: [
        say("why.device.0", "The device cannot host a browser or take comfortable text input (TV, console, kiosk, headless CLI)."), // pack key engine.why.device.0
        say("why.device.1", "The user authorizes on a SECOND device: the app shows a user_code and verification_uri, then polls the token endpoint until approval."), // pack key engine.why.device.1
      ],
      avoided: avoided.concat([
        {
          grant: say("grant.onDevice", "authorization_code (on-device)"), // pack key engine.grant.onDevice
          why: say("avoided.device.authCode", "A redirect-based flow needs a usable browser on the device itself - exactly what this class of device lacks."), // pack key engine.avoided.device.authCode
        },
      ]),
    };
    if (wantsIdentity)
      r.oidcNote =
        say("oidc.device", "Add the openid scope: the device grant composes with OpenID Connect, and the ID Token arrives with the access token once the user approves."); // pack key engine.oidc.device
    if (needsOffline)
      r.refreshNote =
        say("refresh.device", "Refresh tokens are commonly issued here - a TV app should not make the user re-enter codes weekly. Treat the device as a public client: no static secret."); // pack key engine.refresh.device
    return r;
  }

  // server-web, spa, native: all authorization code; PKCE always.
  const confidential = appType === "server-web";
  const r: ChooserResult<EngineText> = { // sentences with ids
    ok: true,
    grant: "authorization_code",
    name: confidential
      ? say("name.authCodeConfidential", "Authorization Code (confidential client) + PKCE") // pack key engine.name.authCodeConfidential
      : say("name.authCodePublic", "Authorization Code + PKCE (public client)"), // pack key engine.name.authCodePublic
    clientType: confidential ? "confidential" : "public",
    citations:
      appType === "native"
        ? ["RFC 6749 §4.1", "RFC 7636", "RFC 8252", "RFC 9700"]
        : ["RFC 6749 §4.1", "RFC 7636", "RFC 9700"],
    why: confidential
      ? [
          say("why.serverWeb.0", "The backend can keep a client secret, so the code is exchanged with client authentication - the strongest common configuration."), // pack key engine.why.serverWeb.0
          say("why.serverWeb.1", "PKCE is still added: RFC 9700 recommends it for ALL clients as code-injection protection, not just public ones."), // pack key engine.why.serverWeb.1
        ]
      : appType === "spa"
        ? [
            say("why.spa.0", "A browser app cannot keep a secret - it is a public client by nature."), // pack key engine.why.spa.0
            say("why.spa.1", "PKCE (RFC 7636) replaces the secret: the code is bound to the code_verifier, so an intercepted code is useless."), // pack key engine.why.spa.1
          ]
        : [
            say("why.native.0", "A native app cannot keep a secret either - installed binaries are inspectable."), // pack key engine.why.native.0
            say("why.native.1", "RFC 8252 sets the pattern: use the SYSTEM browser (never an embedded webview) with PKCE, returning via a claimed https or custom-scheme redirect."), // pack key engine.why.native.1
          ],
    avoided,
  };
  if (wantsIdentity)
    r.oidcNote =
      say("oidc.authCode", "Layer OpenID Connect on top: same authorization-code dance with the openid scope, and the token response adds an ID Token that says WHO signed in. Authentication is OIDC's job; OAuth alone only delegates access."); // pack key engine.oidc.authCode
  if (needsOffline)
    r.refreshNote = confidential
      ? say("refresh.confidential", "Request offline access; the confidential client stores the refresh token server-side.") // pack key engine.refresh.confidential
      : say("refresh.public", "Refresh tokens for public clients must be sender-bound or ROTATED per RFC 9700: each refresh issues a new refresh token and revokes the old, so a stolen one dies on first reuse."); // pack key engine.refresh.public
  return r;
}

/** The structured-run entry point (D-49 registry contract). */
export function run(inputJson: string): ChooserResult | ChooserError {
  let parsed: unknown;
  try {
    parsed = JSON.parse(inputJson);
  } catch {
    return { ok: false, error: 'Input must be JSON: {"appType":"spa","wantsIdentity":true,"needsOffline":false}' };
  }
  const p = parsed as Partial<ChooserInput>;
  const types: AppType[] = ["server-web", "spa", "native", "service", "device"];
  if (!p || !types.includes(p.appType as AppType))
    return { ok: false, error: "appType must be one of: " + types.join(", ") };
  return choose({
    appType: p.appType as AppType,
    wantsIdentity: Boolean(p.wantsIdentity),
    needsOffline: Boolean(p.needsOffline),
  });
}
