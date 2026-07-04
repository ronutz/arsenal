// ============================================================================
// src/lib/tools/f5-apm-session-variable-reference/compute.ts
// ----------------------------------------------------------------------------
// THE APM SESSION-VARIABLE REFERENCE, VENDORED FROM THE OFFICIAL CHAPTER.
// An access policy stores what its actions return in session variables,
// hierarchical names separated by periods, and the Visual Policy Editor
// manual's Session Variables chapter is the canonical table. This tool
// vendors that table (a substantial curated core, source-pinned and
// access-dated) and adds the two lookups the chapter cannot do:
//
//   PATTERN-AWARE NAME LOOKUP. The manual writes rows like
//   session.ad.$name.attr.$attr_name, where $name is the agent name or the
//   string "last" and $attr_name is whatever the query retrieved (each
//   retrieved attribute is converted to a separate session variable, the
//   chapter's own sentence). Paste session.ad.last.attr.memberOf and the
//   matcher resolves it to its row, tells you an AD Query action populates
//   it, and explains the $name convention.
//
//   EXPRESSION PARSING. Paste a branch-rule expression or a config
//   embedding and every variable inside is extracted and explained:
//     expr { [mcget {session.ad.last.attr.primaryGroupID}] == 100 }
//     [mcget -secure {session.logon.last.password}]
//     %{session.otp.assigned.val}
//   The secure audit rides along, grounded in F5's own lab wording: a
//   secure variable's value is stored encrypted in the session db, is not
//   displayed in the session report, is not logged, and requires the
//   -secure flag for both mcget and access::session data get/set. So
//   mcget without -secure on session.logon.last.password gets flagged (the
//   classic empty-value trap), and -secure on an ordinary variable gets a
//   note too.
//
// Debug-surface notes ride on every result: the Current Sessions report
// displays all session variables for a session (active sessions), and the
// sessiondump command's allkeys/sid operations are the CLI view.
//
// Sources: the Session Variables manual chapter, BIG-IP APM Visual Policy
// Editor 13.1 (the vendored table, the naming anatomy, sessiondump), the
// Per-Request Policy references (the verbatim mcget branch-rule
// expressions and the populated-by discipline: AD Query, LDAP Query,
// RADIUS Auth/Acct), F5's Agility lab module (the secure-variable
// semantics verbatim), and the APM SSO Configuration Guide (the
// logon/sso.token wiring pinned in this cluster's previous tool). All
// accessed 2026-07-03.
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionVar {
  pattern: string; // dotted, with $name / $attr_name placeholders
  family: string;
  type: string;
  meaning: string;
  populatedBy: string;
  secure?: boolean;
  quirks?: string[];
}

export interface VarMatch {
  input: string;
  row: SessionVar | null;
  bindings: Record<string, string>;
  notes: string[];
}

export interface SvarResult {
  ok: boolean;
  mode: "lookup" | "expression" | "family" | "catalog";
  matches?: VarMatch[];
  familyName?: string;
  rows?: SessionVar[];
  families?: { name: string; count: number; blurb: string }[];
  observations: string[];
  notes: string[];
}

export type ToolRunResult = SvarResult;

// ---------------------------------------------------------------------------
// The vendored table (curated core of the official chapter, plus the
// logon/sso wiring rows pinned from the SSO Configuration Guide)
// ---------------------------------------------------------------------------

const SECURE_NOTE =
  "Secure-variable semantics, F5's own wording: the value is stored encrypted in the session db, is not displayed in the session report UI, is not logged by the logging agent, and requires the -secure flag for both mcget and access::session data get/set.";

export const VARS: readonly SessionVar[] = Object.freeze([
  // ---- logon / sso wiring (SSO Configuration Guide; this cluster's previous tool) ----
  { pattern: "session.logon.last.username", family: "logon", type: "string", meaning: "The username the logon flow captured; the classic left side of the SSO credential wiring.", populatedBy: "Logon Page (or another logon agent) in the access policy." },
  { pattern: "session.logon.last.password", family: "logon", type: "string", meaning: "The password the logon flow captured, stored as a secure variable.", populatedBy: "Logon Page in the access policy.", secure: true, quirks: ["Reading it in an expression requires mcget -secure; a bare mcget yields nothing, the classic empty-value trap."] },
  { pattern: "session.logon.last.domain", family: "logon", type: "string", meaning: "The logon domain; the SSO Configuration Guide notes the NTLM Domain setting defaults to this variable.", populatedBy: "Logon Page or domain-aware logon agents." },
  { pattern: "session.logon.last.upn", family: "logon", type: "string", meaning: "The user principal name; F5's own lab example populates it by extracting the UPN from a presented client certificate with a Variable Assign action.", populatedBy: "Variable Assign, certificate attribute extraction, or logon agents." },
  { pattern: "session.sso.token.last.username", family: "sso", type: "string", meaning: "The username SSO methods consume; SSO Credential Mapping feeds it from the logon variables.", populatedBy: "SSO Credential Mapping agent." },
  { pattern: "session.sso.token.last.password", family: "sso", type: "string", meaning: "The password SSO methods consume; the Form Based method's password source defaults to exactly this variable.", populatedBy: "SSO Credential Mapping agent.", secure: true },
  { pattern: "session.logon.captcha.tracking", family: "logon", type: "unsigned integer", meaning: "A bitmask used when CAPTCHA is enabled: bit 0 tracks logon attempts by IP address, bit 1 by user name.", populatedBy: "Logon Page with CAPTCHA challenge.", quirks: ["The chapter's own caution: should not be used by external modules; intended for very specific purposes."] },

  // ---- policy result ----
  { pattern: "session.policy.result", family: "policy", type: "string", meaning: "The access policy's outcome: allowed, access_denied, or redirect, per the ending reached.", populatedBy: "The policy ending (Allowed, Denied, or Redirect)." },
  { pattern: "session.policy.result.redirect.url", family: "policy", type: "string", meaning: "The URL specified in a Redirect ending.", populatedBy: "Redirect ending." },
  { pattern: "session.policy.result.webtop.type", family: "policy", type: "string", meaning: "The assigned webtop's type: network_access or web_application.", populatedBy: "Allowed ending with a webtop." },
  { pattern: "session.policy.result.webtop.network_access.autolaunch", family: "policy", type: "string", meaning: "The resource automatically started for a network access webtop.", populatedBy: "Allowed ending with a network access webtop." },

  // ---- client / ui (session management) ----
  { pattern: "session.ui.mode", family: "client", type: "enum", meaning: "UI mode from HTTP headers: 0 Full Browser, 6 Pocket PC, 7 Standalone (clientless), 8 ActiveSync, 9 Mobile Browser, 10 Citrix Receiver.", populatedBy: "Session establishment.", quirks: ["The chapter's own nuance: UI mode does not map directly to client type; when BIG-IP Edge Client uses a web browser component to establish the session, ui.mode is 0 (Full Browser)."] },
  { pattern: "session.ui.lang", family: "client", type: "string", meaning: "Language in use in the session, for example en.", populatedBy: "Session establishment." },
  { pattern: "session.ui.charset", family: "client", type: "string", meaning: "Character set used in the session.", populatedBy: "Session establishment." },
  { pattern: "session.client.type", family: "client", type: "enum", meaning: "Client type from HTTP headers: portalclient, or Standalone for the Edge Client.", populatedBy: "Session establishment." },
  { pattern: "session.client.platform", family: "client", type: "string", meaning: "Client platform from HTTP headers: Android, ChromeOS, iOS, Linux, MacOS, and the Windows family strings.", populatedBy: "Session establishment." },
  { pattern: "session.client.jailbreak", family: "client", type: "bool", meaning: "Whether a mobile device reports jailbroken or rooted: 0 no, 1 yes.", populatedBy: "Mobile client inspection." },
  { pattern: "session.client.js", family: "client", type: "bool", meaning: "Whether the client can execute JavaScript: 0 no, 1 yes.", populatedBy: "Client capability detection." },
  { pattern: "session.client.activex", family: "client", type: "bool", meaning: "Whether the client can run ActiveX controls: 0 no, 1 yes.", populatedBy: "Client capability detection." },
  { pattern: "session.user.clientip", family: "client", type: "string", meaning: "The client's IP address as APM sees it; F5's lab uses mcget {session.user.clientip} as its message-box example.", populatedBy: "Session establishment." },
  { pattern: "session.user.access_mode", family: "client", type: "string", meaning: "Enables direct access to a Citrix resource from the webtop; example value local.", populatedBy: "Resource configuration." },

  // ---- AAA: Active Directory ----
  { pattern: "session.ad.$name.authresult", family: "ad", type: "bool", meaning: "Active Directory authentication result: 0 failed, 1 passed.", populatedBy: "AD Auth action ($name is the agent name or last)." },
  { pattern: "session.ad.$name.queryresult", family: "ad", type: "bool", meaning: "Active Directory query result: 0 failed, 1 passed.", populatedBy: "AD Query action." },
  { pattern: "session.ad.$name.attr.$attr_name", family: "ad", type: "string", meaning: "A user attribute retrieved during the AD query; the chapter's own sentence, each retrieved attribute is converted to a separate session variable (memberOf, primaryGroupID, lastLogon, and whatever else the query returned).", populatedBy: "AD Query action.", quirks: ["The Per-Request Policy reference's canonical branch rule reads exactly this family: expr { [mcget {session.ad.last.attr.memberOf}] contains \"CN=Administrators\" }."] },
  { pattern: "session.ad.$name.attr.group.$attr_name", family: "ad", type: "string", meaning: "A group attribute retrieved during the AD query, one variable per attribute.", populatedBy: "AD Query action." },

  // ---- AAA: LDAP / RADIUS / local db ----
  { pattern: "session.ldap.$name.authresult", family: "ldap", type: "bool", meaning: "LDAP authentication result: 0 failed, 1 passed.", populatedBy: "LDAP Auth action." },
  { pattern: "session.ldap.$name.queryresult", family: "ldap", type: "bool", meaning: "LDAP query result: 0 failed, 1 passed.", populatedBy: "LDAP Query action." },
  { pattern: "session.ldap.$name.attr.$attr_name", family: "ldap", type: "string", meaning: "A user attribute retrieved during the LDAP query, one variable per attribute; LDAP Group Lookup compares against session.ldap.last.attr.memberOf.", populatedBy: "LDAP Query action (the reference notes it is required to populate this)." },
  { pattern: "session.radius.$name.authresult", family: "radius", type: "bool", meaning: "RADIUS authentication result: 0 failed, 1 passed.", populatedBy: "RADIUS Auth action." },
  { pattern: "session.radius.$name.attr.$attr_name", family: "radius", type: "string", meaning: "A user attribute retrieved during RADIUS authentication, one variable per attribute; RADIUS Class Lookup compares against session.radius.last.attr.class.", populatedBy: "RADIUS Auth or RADIUS Acct action." },
  { pattern: "session.localdb.groups", family: "localdb", type: "string", meaning: "Groups read from a local database instance; the LocalDB Group Lookup default expression reads it, and the name is user-specifiable in the Local Database action.", populatedBy: "Local Database action (the same variable name must be used in the action and the lookup)." },

  // ---- client certificate ----
  { pattern: "session.ssl.cert.exist", family: "ssl", type: "integer", meaning: "Whether a client certificate exists: 0 no, 1 yes.", populatedBy: "Client certificate authentication (On-Demand or profile-level)." },
  { pattern: "session.ssl.cert.valid", family: "ssl", type: "string", meaning: "Certificate validation result: OK or an error string.", populatedBy: "Client certificate authentication." },
  { pattern: "session.ssl.cert.subject", family: "ssl", type: "string", meaning: "The certificate subject field.", populatedBy: "Client certificate authentication." },
  { pattern: "session.ssl.cert.issuer", family: "ssl", type: "string", meaning: "The certificate issuer.", populatedBy: "Client certificate authentication." },
  { pattern: "session.ssl.cert.serial", family: "ssl", type: "string", meaning: "The certificate serial number.", populatedBy: "Client certificate authentication." },
  { pattern: "session.ssl.cert.start", family: "ssl", type: "string", meaning: "Validity start date.", populatedBy: "Client certificate authentication." },
  { pattern: "session.ssl.cert.end", family: "ssl", type: "string", meaning: "Validity end date.", populatedBy: "Client certificate authentication." },
  { pattern: "session.ssl.cert.x509extension", family: "ssl", type: "string", meaning: "X509 extensions.", populatedBy: "Client certificate authentication." },
  { pattern: "session.ssl.cert.whole", family: "ssl", type: "string", meaning: "The whole certificate.", populatedBy: "Client certificate authentication." },

  // ---- endpoint inspection ----
  { pattern: "session.check_machinecert.last.result", family: "endpoint", type: "integer", meaning: "Machine Cert Auth result: 0 neither cert nor key found, 1 both found, 2 cert without key, -2 various errors (nothing received, bad format, missing CA profile, Linux client).", populatedBy: "Machine Cert Auth action.", quirks: ["The chapter's own note: the Machine Cert Auth action is not supported on Linux."] },
  { pattern: "session.windows_check_file.$name.item_0.exist", family: "endpoint", type: "string", meaning: "True if all checked files exist on the client.", populatedBy: "File Check action." },
  { pattern: "session.windows_check_file.$name.item_0.md5", family: "endpoint", type: "string", meaning: "MD5 value of a checked file.", populatedBy: "File Check action." },
  { pattern: "session.windows_check_process.$name.result", family: "endpoint", type: "integer", meaning: "Windows Process check result: 0 failure, 1 success, -1 invalid check expression.", populatedBy: "Windows Process action." },
  { pattern: "session.windows_check_registrys.$name.result", family: "endpoint", type: "integer", meaning: "Windows Registry check result: 0 failure, 1 success, -1 invalid check expression.", populatedBy: "Windows Registry action." },
  { pattern: "session.windows_info_os.$name.platform", family: "endpoint", type: "string", meaning: "The client's Windows platform string (Win7, Win8, WinXP, Win2003, WinLH, and so on).", populatedBy: "Windows Info action." },
  { pattern: "session.check_software.last.hd.item_1.state", family: "endpoint", type: "bool", meaning: "Hard-disk encryption check: 0 not all drives encrypted, 1 all drives encrypted.", populatedBy: "Client hard-disk encryption check.", quirks: ["The chapter's honesty gem sits on this row's sibling: session.check_software.last.hd.state is an unused session variable that always shows 0."] },

  // ---- OTP / decision ----
  { pattern: "session.otp.assigned.val", family: "otp", type: "string", meaning: "The generated one-time password value; the chapter's own message example embeds it as One-Time Passcode: %{session.otp.assigned.val}.", populatedBy: "OTP Generate action." },
  { pattern: "session.otp.assigned.ttl", family: "otp", type: "string", meaning: "OTP time-to-live in seconds, configurable as the OTP timeout.", populatedBy: "OTP Generate action." },
  { pattern: "session.otp.assigned.expire", family: "otp", type: "string", meaning: "Internally used expiration timestamp, seconds since 1970-01-01 00:00:00 UTC.", populatedBy: "OTP Generate action." },
  { pattern: "session.otp.verify.last.authresult", family: "otp", type: "bool", meaning: "OTP verification result: 0 failed, 1 passed.", populatedBy: "OTP Verify action." },
  { pattern: "session.decision_box.last.result", family: "policy", type: "integer", meaning: "Decision box outcome: 1 the user chose option 1, 0 the user chose option 2 (the fallback branch).", populatedBy: "Decision Box action." },

  // ---- assigned resources ----
  { pattern: "session.assigned.webtop", family: "assigned", type: "string", meaning: "Name of the assigned webtop.", populatedBy: "Resource assignment." },
  { pattern: "session.assigned.resources.na", family: "assigned", type: "string", meaning: "Space-delimited names of assigned Network Access resources (siblings: .at app tunnels, .pa portal access, .rd remote desktops, .saml SAML resources).", populatedBy: "Resource assignment." },
  { pattern: "session.assigned.bwc.dynamic", family: "assigned", type: "string", meaning: "Name of the assigned dynamic bandwidth control policy (.static for the static one).", populatedBy: "Advanced Resource Assign." },

  // ---- custom ----
  { pattern: "session.custom.$attr_name", family: "custom", type: "any", meaning: "Your own variables: F5's lab shows Variable Assign creating session.custom.mynewvar, with APM using the word after session as the container.", populatedBy: "Variable Assign action." },
]);

const FAMILY_BLURBS: Record<string, string> = {
  logon: "What the logon flow captured: username, password (secure), domain, UPN, CAPTCHA tracking.",
  sso: "The SSO-side credential cache that SSO Credential Mapping fills and SSO methods consume.",
  policy: "The policy's own verdict and endings: result, redirect URL, webtop, decision boxes.",
  client: "What APM learned about the client: UI mode, platform, capabilities, IP.",
  ad: "Active Directory auth and query results, plus one variable per retrieved attribute.",
  ldap: "LDAP auth and query results, plus one variable per retrieved attribute.",
  radius: "RADIUS auth results and retrieved attributes.",
  localdb: "Local database reads, group membership for LocalDB lookups.",
  ssl: "The presented client certificate, field by field.",
  endpoint: "Endpoint inspection: files, processes, registry, machine certs, disk encryption, Windows info.",
  otp: "One-time passwords: generated value, TTL, expiry, verification result.",
  assigned: "What the session was granted: webtop, resources by type, bandwidth policies.",
  custom: "Variables you create with Variable Assign.",
};

// ---------------------------------------------------------------------------
// Pattern matching: $name matches one dotted segment; $attr_name matches the
// remainder (attribute names can themselves contain dots in principle, so
// the trailing placeholder is greedy).
// ---------------------------------------------------------------------------

function matchPattern(pattern: string, name: string): Record<string, string> | null {
  const p = pattern.split(".");
  const n = name.split(".");
  const bindings: Record<string, string> = {};
  let i = 0, j = 0;
  while (i < p.length) {
    const seg = p[i];
    if (seg === "$attr_name") {
      if (j >= n.length) return null;
      bindings["$attr_name"] = n.slice(j).join(".");
      return bindings;
    }
    if (j >= n.length) return null;
    if (seg === "$name") {
      bindings["$name"] = n[j];
    } else if (seg !== n[j]) {
      return null;
    }
    i++; j++;
  }
  return j === n.length ? bindings : null;
}

function lookupVar(name: string): VarMatch {
  const clean = name.trim();
  for (const row of VARS) {
    const b = matchPattern(row.pattern, clean);
    if (b) {
      const notes: string[] = [];
      if (b["$name"]) {
        notes.push(`$name resolved to "${b["$name"]}": the agent's configured name, or the string last for the most recent agent of that type.`);
      }
      if (b["$attr_name"]) {
        notes.push(`$attr_name resolved to "${b["$attr_name"]}": per the chapter, each retrieved attribute is converted to a separate session variable, so the tail is whatever the query returned.`);
      }
      return { input: clean, row, bindings: b, notes };
    }
  }
  return { input: clean, row: null, bindings: {}, notes: ["Not in the vendored core. The full reference is the Session Variables chapter of the Visual Policy Editor manual (linked in this tool's sources); custom and agent-created names are unbounded by design."] };
}

// ---------------------------------------------------------------------------
// Expression parsing: mcget calls and %{...} embeddings
// ---------------------------------------------------------------------------

const MCGET_RE = /\[\s*mcget\s+(-secure\s+)?\{\s*([a-zA-Z0-9_.$-]+)\s*\}\s*\]/g;
const PCT_RE = /%\{\s*([a-zA-Z0-9_.$-]+)\s*\}/g;

export function run(input: string): SvarResult {
  const text = (input ?? "").trim();
  if (!text) {
    throw new Error('Paste a session variable (session.ad.last.attr.memberOf), a branch-rule expression with mcget, a %{session.x} embedding, a family name (ssl, ad, logon...), or "variables" for the catalogue.');
  }

  // catalogue
  if (/^(variables|catalog|families|list|all)$/i.test(text)) {
    const fams = Object.entries(FAMILY_BLURBS).map(([name, blurb]) => ({ name, count: VARS.filter((v) => v.family === name).length, blurb }));
    return {
      ok: true, mode: "catalog", families: fams,
      observations: [
        "Naming anatomy, per the chapter: hierarchical nodes separated by periods, session, then a type, then the agent name or the string last, then agent-specific nodes like attr or result, then the attribute name.",
        SECURE_NOTE,
      ],
      notes: ["Vendored core of the official Session Variables chapter (Visual Policy Editor manual), source-pinned and access-dated; the chapter itself is the exhaustive list.",
        "Debug surfaces: the Current Sessions report displays all session variables for a session, and sessiondump allkeys (or sessiondump sid for one session) is the CLI view."],
    };
  }

  // family lookup
  const famKey = text.toLowerCase().replace(/^session\./, "").split(".")[0];
  if (FAMILY_BLURBS[text.toLowerCase()] || (text.split(".").length <= 2 && FAMILY_BLURBS[famKey] && !text.includes("{"))) {
    const fam = FAMILY_BLURBS[text.toLowerCase()] ? text.toLowerCase() : famKey;
    const rows = VARS.filter((v) => v.family === fam);
    if (rows.length) {
      return { ok: true, mode: "family", familyName: fam, rows, observations: [FAMILY_BLURBS[fam]], notes: [] };
    }
  }

  // expression mode: any mcget or %{} present
  const matches: VarMatch[] = [];
  const observations: string[] = [];
  let sawSecureFlag = false;
  let m: RegExpExecArray | null;
  MCGET_RE.lastIndex = 0;
  while ((m = MCGET_RE.exec(text)) !== null) {
    const secureFlag = Boolean(m[1]);
    sawSecureFlag = sawSecureFlag || secureFlag;
    const vm = lookupVar(m[2]);
    if (vm.row?.secure && !secureFlag) {
      vm.notes.push("SECURE MISMATCH: this is a secure variable read WITHOUT -secure. " + SECURE_NOTE + " A bare mcget here yields nothing, the classic empty-value trap.");
    }
    if (!vm.row?.secure && secureFlag && vm.row) {
      vm.notes.push("-secure used on a variable the reference does not mark secure; harmless if the variable was stored secure by a custom action, otherwise unnecessary.");
    }
    matches.push(vm);
  }
  PCT_RE.lastIndex = 0;
  while ((m = PCT_RE.exec(text)) !== null) {
    const vm = lookupVar(m[1]);
    vm.notes.push("%{...} embedding: the syntax that expands a session variable inside configuration text, message boxes, and agent fields; the chapter's own OTP message example uses %{session.otp.assigned.val}.");
    matches.push(vm);
  }
  if (matches.length > 0) {
    observations.push("Populated-by discipline: a variable is only as real as the action that fills it; the Per-Request references repeat it per family, an AD Query for session.ad.*, an LDAP Query for session.ldap.last.attr.memberOf, RADIUS Auth or Acct for the class attribute.");
    return { ok: true, mode: "expression", matches, observations, notes: ["Expressions parsed for variable references only; Tcl evaluation is out of scope by design."] };
  }

  // plain name lookup
  if (/^session\./.test(text)) {
    const vm = lookupVar(text);
    if (vm.row?.secure) vm.notes.push(SECURE_NOTE);
    return {
      ok: true, mode: "lookup", matches: [vm],
      observations: vm.row ? [`Populated by: ${vm.row.populatedBy}`] : [],
      notes: ["Live-session view: the Current Sessions report shows every variable APM collected; sessiondump sid <id> is the CLI equivalent."],
    };
  }

  throw new Error(`"${text}" is not a session variable, expression, or family. Try session.logon.last.username, a family like ssl, or "variables".`);
}
