// ============================================================================
// src/lib/tools/f5-apm-sso-explainer/compute.ts
// ----------------------------------------------------------------------------
// EXPLAINS APM'S SSO METHODS THE WAY THE MANUAL DEFINES THEM. Eight methods,
// one table, and a blast-radius property the SSO Methods chapter states in
// its opening paragraph: misconfiguring an SSO object for HTTP Basic, NTLMv1,
// NTLMv2, Kerberos, OAuth Bearer, or SAML can disable SSO for ALL
// authentication methods for that user's session; Form Based and Forms -
// Client Initiated are the only two methods NOT disabled when another
// method's object is broken. Every card carries that isolation verdict,
// because it is the difference between one app losing SSO and every app
// losing it.
//
// Per-method mechanisms, condensed faithfully from the chapter and the
// method-specific guides:
//   - HTTP Basic sends the Authorization header with the Basic token, the
//     base64 of username, colon, password: the cached password rides to the
//     backend on every request, by design.
//   - NTLM v1/v2 use the challenge-response mechanism where users prove
//     identity without sending a password to the server; v2 is the updated
//     version, and it carries a documented quirk: if a 401 includes more
//     than one WWW-Authenticate: NTLM header, NTLMv2 SSO fails, and the
//     manual calls that expected behavior.
//   - Kerberos provides transparent authentication to Windows web servers
//     joined to AD, via constrained delegation. The prerequisites are
//     specific: a delegation account per server realm, its SPN as the
//     Account Name (HTTP/fqdn form), and, verbatim, APM Kerberos SSO does
//     not need or use a keytab file. Its natural front doors are
//     authentication methods where the password never travels in clear
//     text: client certificates, NTLM.
//   - Form Based constructs and POSTs the application's own logon form
//     using cached credentials; the Start URI decides when it fires, a
//     blank Form Action means the original request URL is used, and the
//     password source defaults to session.sso.token.last.password.
//   - Forms - Client Initiated detects the logon page (URI, header, or
//     cookie match), inserts generated JavaScript that auto-submits it, and
//     assigns the password parameter a password token rather than the
//     actual user password: the token indirection is the design.
//   - OAuth Bearer and SAML ride issued tokens/assertions rather than
//     cached passwords, and both sit on the poisons-session side of the
//     isolation split.
//
// Credentials plumbing: access-policy agents (Logon Page, SSO Credential
// Mapping) populate the session variables SSO consumes; the classic pair is
// session.logon.last.username/.password feeding session.sso.token.last.*.
//
// Sources: the APM Single Sign-On Methods chapter (14.0 and 17.1: the
// method list, the isolation paragraph, per-method mechanisms, the 225-
// character name limit), the Kerberos Single Sign-On Method chapter 15.1
// (delegation account, SPN, no-keytab, front-door pairing), the SSO
// Configuration Guide (Forms - Client Initiated flow and the password
// token), all accessed 2026-07-03.
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SsoMethod {
  id: string;
  name: string;
  aliases: string[];
  mechanism: string;
  credentials: string;
  isolation: "poisons-session-sso" | "isolated";
  prerequisites: string[];
  quirks: string[];
}

export interface ApmSsoResult {
  ok: boolean;
  mode: "method" | "catalog";
  method?: SsoMethod;
  catalog?: SsoMethod[];
  observations: string[];
  notes: string[];
}

export type ToolRunResult = ApmSsoResult;

// ---------------------------------------------------------------------------
// The curated method table
// ---------------------------------------------------------------------------

const ISOLATION_NOTE =
  "The SSO Methods chapter's blast-radius paragraph: a misconfigured SSO object for HTTP Basic, NTLMv1, NTLMv2, Kerberos, OAuth Bearer, or SAML can disable SSO for ALL authentication methods in that user's session; Form Based and Forms - Client Initiated are the only two methods not disabled when another method's object is broken.";

export const METHODS: readonly SsoMethod[] = Object.freeze([
  {
    id: "http-basic",
    name: "HTTP Basic",
    aliases: ["basic", "http-basic", "httpbasic"],
    mechanism:
      "The SSO plug-in uses the cached user identity and sends each request with an Authorization header carrying the Basic token: the base64 encoding of username, colon, password.",
    credentials: "Cached username + password (the password travels to the backend, base64-encoded, on every request; that is the method's nature, not a defect).",
    isolation: "poisons-session-sso",
    prerequisites: ["Cached credentials populated by the access policy (Logon Page or equivalent, then SSO Credential Mapping)."],
    quirks: ["Base64 is encoding, not encryption: the transport to the backend must be trusted or TLS-protected, because the credential is fully recoverable from the header."],
  },
  {
    id: "ntlmv1",
    name: "NTLMv1",
    aliases: ["ntlm", "ntlmv1", "ntlm1"],
    mechanism:
      "The chapter's own description: NTLM employs a challenge-response mechanism for authentication, where users can prove their identities without sending a password to a server.",
    credentials: "Cached username + password used to answer the server's challenge; the password itself does not cross the wire to the backend.",
    isolation: "poisons-session-sso",
    prerequisites: ["Cached credentials; the NTLM Domain setting defaults to the session.logon.last.domain variable."],
    quirks: ["Superseded by NTLMv2 in most estates; present for backends that still negotiate v1."],
  },
  {
    id: "ntlmv2",
    name: "NTLMv2",
    aliases: ["ntlmv2", "ntlm2"],
    mechanism: "The same challenge-response mechanism, in the protocol's updated version.",
    credentials: "Cached username + password answering the challenge; no password on the wire to the backend.",
    isolation: "poisons-session-sso",
    prerequisites: ["Cached credentials; domain defaults from session.logon.last.domain."],
    quirks: [
      "Documented and worth memorizing: if an HTTP 401 response from the server includes more than one WWW-Authenticate: NTLM header, NTLMv2 SSO fails, and the manual calls this expected behavior. A 401 should carry exactly one such header.",
    ],
  },
  {
    id: "kerberos",
    name: "Kerberos (constrained delegation)",
    aliases: ["kerberos", "kcd", "kerberos-sso"],
    mechanism:
      "Transparent authentication of users to Windows web application servers (IIS) joined to an Active Directory domain: APM obtains service tickets on the user's behalf via constrained delegation.",
    credentials:
      "A user identity (UPN or username + realm), not a password: which is exactly why its natural front doors are methods where the password never travels in clear text, client certificates and NTLM among the chapter's own examples.",
    isolation: "poisons-session-sso",
    prerequisites: [
      "A delegation account in Active Directory, one per server realm, dedicated to delegation with a non-expiring password.",
      "The delegation account's SPN, entered as the Account Name in SPN format (for example HTTP/apm4.my.host.lab.mynet.com).",
      "Kerberos Realm in uppercase.",
      "The manual's own words: APM Kerberos SSO does not need or use a keytab file. If a keytab appears in a Kerberos SSO design, something else is being configured.",
      "Servers in multiple realms: one delegation account in the primary realm with Resource-Based Constrained Delegation granted on the trusted realms, per the 17.1 guidance.",
    ],
    quirks: ["The delegation account is the identity doing the asking; its health and its SPN registration are where Kerberos SSO troubleshooting starts."],
  },
  {
    id: "form-based",
    name: "Form Based",
    aliases: ["forms", "form", "form-based", "fba"],
    mechanism:
      "APM constructs and sends the application's own logon form POST on the user's behalf, using cached credentials. The Start URI decides when it fires: a request URI matching it triggers the SSO; a blank Form Action means the original request URL is used for the POST.",
    credentials: "Cached username + the password source, which defaults to session.sso.token.last.password.",
    isolation: "isolated",
    prerequisites: ["The application form's field names (username and password parameters), discoverable with browser dev tools.", "The Start URI of the application's logon page."],
    quirks: ["One of only two methods the chapter exempts from the session-wide SSO disable when another method's object is misconfigured."],
  },
  {
    id: "forms-client-initiated",
    name: "Forms - Client Initiated",
    aliases: ["forms-client-initiated", "fbci", "client-initiated", "forms-ci"],
    mechanism:
      "APM detects the request for the logon page (a URI, header, or cookie configured for matching), lets the application serve its own form, then inserts generated JavaScript into that page; the script assigns the form values and auto-submits.",
    credentials:
      "The Configuration Guide's own detail: the password parameter is assigned a password token rather than the actual user password; APM redeems the token server-side when the submission arrives. The real password never sits in the page.",
    isolation: "isolated",
    prerequisites: ["Detection criteria for the logon page (URI, header, or cookie).", "The form's parameter names for the script to fill."],
    quirks: ["The second of the two exempt methods; the token indirection is the design, not an implementation accident."],
  },
  {
    id: "oauth-bearer",
    name: "OAuth Bearer",
    aliases: ["oauth", "bearer", "oauth-bearer"],
    mechanism: "SSO by presenting an OAuth bearer token to the backend rather than replaying cached passwords.",
    credentials: "An issued token; the access policy's OAuth machinery obtains and refreshes it.",
    isolation: "poisons-session-sso",
    prerequisites: ["An OAuth configuration issuing the token the backend accepts."],
    quirks: ["Listed by the chapter among the methods whose misconfigured object disables session-wide SSO."],
  },
  {
    id: "saml",
    name: "SAML",
    aliases: ["saml", "saml-sso"],
    mechanism: "SSO by SAML assertion: APM as IdP (or broker) issues the assertion the backend service provider consumes.",
    credentials: "An assertion about the authenticated identity; no password replay.",
    isolation: "poisons-session-sso",
    prerequisites: ["The SAML federation objects (IdP/SP services) the assertion flow requires."],
    quirks: ["Also on the chapter's session-wide-disable list; the two form methods remain the only exempt ones."],
  },
]);

const BY_ALIAS = new Map<string, SsoMethod>();
for (const m of METHODS) for (const a of m.aliases) BY_ALIAS.set(a, m);

// ---------------------------------------------------------------------------
// run()
// ---------------------------------------------------------------------------

export function run(input: string): ApmSsoResult {
  const text = (input ?? "").trim().toLowerCase();
  if (!text) {
    throw new Error('Name an SSO method (for example "kerberos", "ntlmv2", "forms", "fbci", "basic", "saml", "oauth"), or type "methods" for the full catalogue.');
  }

  if (/^(methods|catalog|list|all)$/.test(text)) {
    return {
      ok: true,
      mode: "catalog",
      catalog: [...METHODS],
      observations: [ISOLATION_NOTE],
      notes: [
        "Mechanisms condensed faithfully from the APM Single Sign-On Methods chapter and the method-specific guides; every card carries its isolation verdict because the blast radius is the operational headline.",
        "One small documented bound for completeness: an SSO configuration name is limited to 225 characters including the partition name.",
      ],
    };
  }

  const m = BY_ALIAS.get(text.replace(/\s+/g, "-"));
  if (!m) {
    throw new Error(`"${input.trim()}" is not in the curated method table. Type "methods" to see the eight the chapter defines.`);
  }
  const observations = [ISOLATION_NOTE];
  if (m.isolation === "isolated") {
    observations.push(`${m.name} is one of the two exempt methods: a broken SSO object elsewhere in the session does not disable it.`);
  } else {
    observations.push(`${m.name} sits on the poisons side of the split: misconfigure its object and every method's SSO in that user's session can go dark, the two form methods excepted.`);
  }
  observations.push(
    "Credentials plumbing, common to all methods: access-policy agents populate the session variables SSO consumes; the classic wiring is a Logon Page (or a password-less front door) followed by SSO Credential Mapping, feeding session.logon.last.* into session.sso.token.last.*.",
  );
  return { ok: true, mode: "method", method: m, observations, notes: [] };
}
