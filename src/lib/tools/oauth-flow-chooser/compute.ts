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
// ============================================================================

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
export interface Avoided {
  grant: string;
  why: string;
}

/** The full deterministic result. */
export interface ChooserResult {
  ok: true;
  /** The grant to use, by its protocol name. */
  grant: string;
  /** Human name of the flow. */
  name: string;
  /** Client type this implies. */
  clientType: "confidential" | "public";
  /** The governing citations. */
  citations: string[];
  /** Ordered reasons this is the right answer. */
  why: string[];
  /** OIDC layer note (present when identity is requested and possible). */
  oidcNote?: string;
  /** Refresh-token guidance (present when offline access is requested). */
  refreshNote?: string;
  /** Grants deliberately not chosen, each with its reason. */
  avoided: Avoided[];
  /** A caution when the input combination is contradictory. */
  warning?: string;
}

export interface ChooserError {
  ok: false;
  error: string;
}

const RETIRED: Avoided[] = [
  {
    grant: "implicit",
    why: "Retired. Tokens in the URL fragment, no client authentication, no PKCE binding - the OAuth 2.0 Security BCP (RFC 9700) says use authorization code + PKCE instead, and OAuth 2.1 removes implicit entirely.",
  },
  {
    grant: "password (ROPC)",
    why: "Retired. The app handles the user's actual credentials, which breaks MFA, federation, and phishing resistance in one move - RFC 9700 says it must not be used.",
  },
];

/** The pure decision function. Deterministic; no I/O. */
export function choose(input: ChooserInput): ChooserResult | ChooserError {
  const { appType, wantsIdentity, needsOffline } = input;
  const avoided: Avoided[] = [...RETIRED];

  if (appType === "service") {
    const r: ChooserResult = {
      ok: true,
      grant: "client_credentials",
      name: "Client Credentials",
      clientType: "confidential",
      citations: ["RFC 6749 §4.4"],
      why: [
        "No human is present: the client authenticates as ITSELF and acts under its own authority.",
        "The client can hold a secret (or better, a private key / mTLS credential), so it is a confidential client.",
      ],
      avoided: avoided.concat([
        {
          grant: "authorization_code",
          why: "There is no user to redirect and no consent to gather - the interactive flows solve a problem this app does not have.",
        },
      ]),
    };
    if (wantsIdentity) {
      r.warning =
        "You asked for end-user identity, but machine-to-machine flows have no end user. If a human's context is involved, this is not a service integration - pick the app type the human actually uses.";
    }
    if (needsOffline) {
      r.refreshNote =
        "Client credentials needs no refresh token: RFC 6749 §4.4.3 says one SHOULD NOT be issued - the client simply authenticates again when the access token expires.";
    }
    return r;
  }

  if (appType === "device") {
    const r: ChooserResult = {
      ok: true,
      grant: "urn:ietf:params:oauth:grant-type:device_code",
      name: "Device Authorization Grant",
      clientType: "public",
      citations: ["RFC 8628"],
      why: [
        "The device cannot host a browser or take comfortable text input (TV, console, kiosk, headless CLI).",
        "The user authorizes on a SECOND device: the app shows a user_code and verification_uri, then polls the token endpoint until approval.",
      ],
      avoided: avoided.concat([
        {
          grant: "authorization_code (on-device)",
          why: "A redirect-based flow needs a usable browser on the device itself - exactly what this class of device lacks.",
        },
      ]),
    };
    if (wantsIdentity)
      r.oidcNote =
        "Add the openid scope: the device grant composes with OpenID Connect, and the ID Token arrives with the access token once the user approves.";
    if (needsOffline)
      r.refreshNote =
        "Refresh tokens are commonly issued here - a TV app should not make the user re-enter codes weekly. Treat the device as a public client: no static secret.";
    return r;
  }

  // server-web, spa, native: all authorization code; PKCE always.
  const confidential = appType === "server-web";
  const r: ChooserResult = {
    ok: true,
    grant: "authorization_code",
    name: confidential
      ? "Authorization Code (confidential client) + PKCE"
      : "Authorization Code + PKCE (public client)",
    clientType: confidential ? "confidential" : "public",
    citations:
      appType === "native"
        ? ["RFC 6749 §4.1", "RFC 7636", "RFC 8252", "RFC 9700"]
        : ["RFC 6749 §4.1", "RFC 7636", "RFC 9700"],
    why: confidential
      ? [
          "The backend can keep a client secret, so the code is exchanged with client authentication - the strongest common configuration.",
          "PKCE is still added: RFC 9700 recommends it for ALL clients as code-injection protection, not just public ones.",
        ]
      : appType === "spa"
        ? [
            "A browser app cannot keep a secret - it is a public client by nature.",
            "PKCE (RFC 7636) replaces the secret: the code is bound to the code_verifier, so an intercepted code is useless.",
          ]
        : [
            "A native app cannot keep a secret either - installed binaries are inspectable.",
            "RFC 8252 sets the pattern: use the SYSTEM browser (never an embedded webview) with PKCE, returning via a claimed https or custom-scheme redirect.",
          ],
    avoided,
  };
  if (wantsIdentity)
    r.oidcNote =
      "Layer OpenID Connect on top: same authorization-code dance with the openid scope, and the token response adds an ID Token that says WHO signed in. Authentication is OIDC's job; OAuth alone only delegates access.";
  if (needsOffline)
    r.refreshNote = confidential
      ? "Request offline access; the confidential client stores the refresh token server-side."
      : "Refresh tokens for public clients must be sender-bound or ROTATED per RFC 9700: each refresh issues a new refresh token and revokes the old, so a stolen one dies on first reuse.";
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
