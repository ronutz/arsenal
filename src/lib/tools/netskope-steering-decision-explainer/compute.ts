// ============================================================================
// src/lib/tools/netskope-steering-decision-explainer/compute.ts
// ----------------------------------------------------------------------------
// THE NETSKOPE STEERING DECISION EXPLAINER. Paste a compact spec of a
// steering configuration plus one flow, and the engine walks the documented
// decision order and answers: STEERED, BYPASSED, BLOCKED, or DIRECT - with
// the why-ledger. Grounded exclusively in published docs.netskope.com
// behavior (pages pinned in the manifest): the three traffic modes and who
// they are for; the always-on RFC1918 default bypass and the
// Netskope-maintained certificate-pinned bypass list; the exception
// families (certificate-pinned apps with per-profile steer-and-decrypt,
// domains, categories, destination locations with treat-as-local, firewall
// app exceptions in All mode); dynamic steering's per-location modes
// including None (no tunnel, exceptions not processed); Fail Close's
// documented split (domain/IP/cert-pinned exceptions still honored,
// category exceptions blocked); and the non-standard-port-accessed-by-IP
// pitfall (treated as non-web unless both FQDN and IP are configured).
// Where the docs do not publish a cross-family precedence, the ledger says
// so instead of inventing one - the T4/ZCC honesty pattern. Deterministic,
// bounded, local. (D-19 comments.)
//
// PAGE LANGUAGE (02/11/2026): every headline, ledger check and outcome, note and
// error is built as an EngineText (src/lib/tools/engine-text.ts): a stable id,
// the English as before, and its values. runLocalisable() returns them as such
// for the page (pack keys tools.netskope-steering-decision-explainer.engine.<id>);
// run() returns plainText() of the same reading, and parseSpec() throws the same
// errors with the same messages (each carrying its sentence), so the API, the
// share spec and the golden vectors are unchanged.
// ============================================================================

import { say, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

export type Mode = "cloud-apps" | "web" | "all" | "none";
export type Verdict = "STEERED" | "BYPASSED" | "BLOCKED" | "DIRECT";

/** S is string in the API's reading and EngineText in the page's (runLocalisable). */
export interface LedgerStep<S = string> {
  check: S; // what was checked
  outcome: S; // what it decided
}

/** S is string in the API's reading and EngineText in the page's. */
export interface SteeringDecision<S = string> {
  verdict: Verdict;
  /** What the traffic's fate is, one line. */
  headline: S; // the verdict in a sentence
  effectiveMode: Mode;
  ledger: LedgerStep<S>[]; // each check
  notes: S[]; // each a sentence
}

interface Exception {
  kind: "cert-pinned" | "domain" | "category" | "dest-location" | "firewall-app";
  value: string;
  steerDecrypt?: boolean; // cert-pinned only: "Steer and decrypt at Netskope Cloud"
  treatLocal?: boolean; // dest-location only: "Treat it like local IP address"
}

interface Spec {
  dynamic: boolean;
  location: "on-prem" | "off-prem";
  mode: Mode; // static mode, or resolved per-location when dynamic
  modeOnPrem?: Mode;
  modeOffPrem?: Mode;
  tunnel: "up" | "down";
  failClose: boolean;
  flow: { kind: "web" | "app" | "non-web" | "rfc1918" | "loopback"; detail: string; nonStdPort?: "fqdn" | "ip" };
  exceptions: Exception[];
  flowMatches: Set<string>; // which exception kinds the flow matches (declared in the spec)
}

const MODES: Mode[] = ["cloud-apps", "web", "all", "none"];

/** Parse the compact spec grammar; throw position-anchored, teaching errors. */
export function parseSpec(text: string): Spec {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  if (lines.length === 0) throw engineError(say("err.empty", "Paste a steering spec - press Example to see the grammar.")); // nothing pasted
  if (lines.length > 40) throw engineError(say("err.tooMany", `That is ${lines.length} lines - this explainer caps at 40.`, { count: String(lines.length) })); // too long

  const spec: Spec = {
    dynamic: false,
    location: "off-prem",
    mode: "web",
    tunnel: "up",
    failClose: false,
    flow: { kind: "web", detail: "" },
    exceptions: [],
    flowMatches: new Set(),
  };
  let sawMode = false;
  let sawFlow = false;

  lines.forEach((line, idx) => {
    const n = idx + 1;
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) throw engineError(say("err.shape", `Line ${n} ("${line}") is not "key: value".`, { n: String(n), line })); // not key: value
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    const bad = (msg: EngineText) => engineError(say("err.line", `Line ${n} (${key}): ${msg}`, { n: String(n), key, msg })); // a line's error, its message translatable

    switch (key) {
      case "mode":
        if (!MODES.includes(val as Mode) || val === "none") throw bad(say("bad.mode", `expected cloud-apps | web | all (got "${val}"). "none" exists only as a dynamic per-location mode.`, { val })); // a bad mode
        spec.mode = val as Mode; sawMode = true; break;
      case "dynamic":
        if (val !== "on" && val !== "off") throw bad(say("bad.onOff", `expected on | off.`)); // not on/off
        spec.dynamic = val === "on"; break;
      case "location":
        if (val !== "on-prem" && val !== "off-prem") throw bad(say("bad.location", `expected on-prem | off-prem.`)); // a bad location
        spec.location = val; break;
      case "mode-on-prem":
        if (!MODES.includes(val as Mode)) throw bad(say("bad.modeAny", `expected cloud-apps | web | all | none.`)); // a bad per-location mode
        spec.modeOnPrem = val as Mode; break;
      case "mode-off-prem":
        if (!MODES.includes(val as Mode)) throw bad(say("bad.modeAny", `expected cloud-apps | web | all | none.`)); // a bad per-location mode
        spec.modeOffPrem = val as Mode; break;
      case "tunnel":
        if (val !== "up" && val !== "down") throw bad(say("bad.upDown", `expected up | down.`)); // not up/down
        spec.tunnel = val; break;
      case "fail-close":
        if (val !== "on" && val !== "off") throw bad(say("bad.onOff", `expected on | off.`)); // not on/off
        spec.failClose = val === "on"; break;
      case "flow": {
        const fm = val.match(/^(web|app|non-web|rfc1918|loopback)\b\s*(.*)$/);
        if (!fm) throw bad(say("bad.flow", `expected "web <host>" | "app <name>" | "non-web <proto/port>" | "rfc1918 <ip>" | "loopback".`)); // a bad flow
        spec.flow = { kind: fm[1] as Spec["flow"]["kind"], detail: fm[2].trim() };
        sawFlow = true; break;
      }
      case "non-standard-port":
        if (val !== "fqdn" && val !== "ip") throw bad(say("bad.nonStd", `expected fqdn | ip - how the non-standard web port is being accessed.`)); // not fqdn/ip
        spec.flow.nonStdPort = val; break;
      case "exception": {
        const em = val.match(/^(cert-pinned|domain|category|dest-location|firewall-app)\s+(.+)$/);
        if (!em) throw bad(say("bad.exception", `expected "<cert-pinned|domain|category|dest-location|firewall-app> <value> [steer-decrypt|treat-local]".`)); // a bad exception
        const parts = em[2].split(/\s+/);
        const flags = new Set(parts.filter((p) => p === "steer-decrypt" || p === "treat-local"));
        const value = parts.filter((p) => p !== "steer-decrypt" && p !== "treat-local").join(" ");
        if (!value) throw bad(say("bad.noValue", `the exception needs a value.`)); // no value
        spec.exceptions.push({
          kind: em[1] as Exception["kind"],
          value,
          steerDecrypt: flags.has("steer-decrypt") || undefined,
          treatLocal: flags.has("treat-local") || undefined,
        });
        break;
      }
      case "flow-matches": {
        const kinds = val.split(/[\s,]+/).filter(Boolean);
        for (const k of kinds) {
          if (!["cert-pinned", "domain", "category", "dest-location", "firewall-app", "none"].includes(k))
            throw bad(say("bad.match", `unknown match "${k}" - use the exception kinds, or none.`, { k })); // an unknown match
          if (k !== "none") spec.flowMatches.add(k);
        }
        break;
      }
      default:
        throw engineError(say("err.unknownKey", `Line ${n}: unknown key "${key}".`, { n: String(n), key })); // an unknown key
    }
  });

  if (!sawMode && !spec.dynamic) throw engineError(say("err.noMode", `The spec needs "mode:" (or dynamic steering with per-location modes).`)); // no mode
  if (!sawFlow) throw engineError(say("err.noFlow", `The spec needs a "flow:" line - the traffic being decided.`)); // no flow
  if (spec.dynamic && !spec.modeOnPrem && !spec.modeOffPrem)
    throw engineError(say("err.dynamicModes", `dynamic: on needs mode-on-prem: and/or mode-off-prem:.`)); // dynamic without modes
  // A declared match must reference a configured exception kind.
  for (const k of spec.flowMatches) {
    if (!spec.exceptions.some((e) => e.kind === k))
      throw engineError(say("err.matchWithout", `flow-matches names "${k}" but no "exception: ${k} ..." line configures one.`, { k })); // a match with no exception
  }
  return spec;
}

/** Walk the documented decision order and produce the verdict + ledger. */
export function run(text: string): SteeringDecision {
  return plainText(runLocalisable(text)); // the same reading, sentences as their English (the API's and the vectors')
} // run

/** The page's reading: the same as run(), with every sentence an EngineText (id, English, values). */
export function runLocalisable(text: string): SteeringDecision<EngineText> {
  const spec = parseSpec(text);
  const ledger: LedgerStep<EngineText>[] = []; // each check, sentences with ids
  const notes: EngineText[] = []; // each note with its id

  // -- 1. Effective mode (dynamic steering resolves per location) -----------
  let mode: Mode = spec.mode;
  if (spec.dynamic) {
    mode = (spec.location === "on-prem" ? spec.modeOnPrem : spec.modeOffPrem) ?? spec.mode;
    const location = spec.location; // on-prem or off-prem
    ledger.push({
      check: say("check.dynamic", `Dynamic steering: device is ${location}`, { location }), // dynamic steering
      outcome: say("out.dynamic", `Per-location traffic mode applies: ${mode}. (On-Premises Detection Profiles decide the location; the docs also warn that repeatedly toggling dynamic steering can lose steering exceptions.)`, { mode }), // the per-location mode
    });
  } else {
    ledger.push({ check: say("check.mode", "Traffic mode"), outcome: say("out.static", `Static steering profile, mode: ${mode}.`, { mode }) }); // static
  }

  if (mode === "none") {
    ledger.push({
      check: say("check.none", "Mode None"), // mode None
      outcome: say("out.none", "Documented behaviour: the Client does not establish a tunnel or steer traffic, and exceptions are not processed - they apply only to steered traffic."), // no tunnel
    });
    return {
      verdict: "DIRECT",
      headline: say("head.none", "Direct to the destination - mode None builds no tunnel and processes no exceptions."), // direct
      effectiveMode: mode,
      ledger,
      notes,
    };
  }

  // -- 2. Tunnel state and Fail Close ---------------------------------------
  if (spec.tunnel === "down") {
    if (spec.failClose) {
      const rescued = spec.exceptions.filter(
        (e) => spec.flowMatches.has(e.kind) && (e.kind === "domain" || e.kind === "dest-location" || e.kind === "cert-pinned"),
      );
      if (rescued.length > 0) {
        const matches = rescued.map((e) => `${e.kind} "${e.value}"`).join(", "); // the exceptions that survive
        ledger.push({
          check: say("check.failClose", "Tunnel down + Fail Close ON"), // fail close
          outcome: say("out.failCloseRescued", `Fail Close blocks traffic when the tunnel is not established - but the docs state domain-based, IP-based, and cert-pinned exceptions are still applied. This flow matches: ${matches}.`, { matches }), // rescued by an exception
        });
        return {
          verdict: "BYPASSED",
          headline: say("head.failCloseRescued", "Bypassed at the Client - Fail Close is blocking, but this flow matches an exception family the docs say survives it."), // bypassed
          effectiveMode: mode,
          ledger,
          notes: [...notes, say("note.categoryCasualty", "Category-based exceptions are the documented casualty of Fail Close: with the tunnel down, they are blocked, not bypassed.")], // categories blocked
        };
      }
      const catMatch = spec.flowMatches.has("category");
      ledger.push({
        check: say("check.failClose", "Tunnel down + Fail Close ON"), // fail close
        outcome: catMatch
          ? say("out.failCloseCategory", "Documented behaviour: category-based exceptions are blocked under Fail Close, unlike domain/IP/cert-pinned ones.") // a category match
          : say("out.failCloseAll", "Fail Close blocks all traffic when the tunnel to Netskope is not established."), // everything blocked
      });
      return {
        verdict: "BLOCKED",
        headline: say("head.blocked", "Blocked at the endpoint - Fail Close is on and the tunnel is down."), // blocked
        effectiveMode: mode,
        ledger,
        notes,
      };
    }
    ledger.push({
      check: say("check.failOpen", "Tunnel down, Fail Close off"), // fail open
      outcome: say("out.failOpen", "Fail open: with no tunnel and no Fail Close, traffic goes direct, uninspected."), // direct
    });
    return {
      verdict: "DIRECT",
      headline: say("head.failOpen", "Direct and uninspected - the tunnel is down and the profile fails open."), // direct, uninspected
      effectiveMode: mode,
      ledger,
      notes: [...notes, say("note.tradeoff", "This is the availability-versus-inspection trade Fail Close exists to flip.")], // the trade-off
    };
  }
  ledger.push({ check: say("check.tunnel", "Tunnel to NewEdge"), outcome: say("out.tunnel", "Established - steering rules now decide.") }); // the tunnel is up

  // -- 3. Always-on default bypasses ----------------------------------------
  if (spec.flow.kind === "rfc1918") {
    const dest = spec.flow.detail || "RFC1918"; // the destination as typed
    ledger.push({
      check: say("check.rfc1918", `Destination ${dest}`, { dest }), // a private destination
      outcome: say("out.rfc1918", "Documented default: RFC1918 space (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) is always bypassed from Netskope."), // always bypassed
    });
    return { verdict: "BYPASSED", headline: say("head.rfc1918", "Bypassed by default - private address space never steers."), effectiveMode: mode, ledger, notes }; // bypassed
  }
  if (spec.flow.kind === "loopback") {
    ledger.push({ check: say("check.loopback", "Loopback destination"), outcome: say("out.loopback", "Local loopback traffic is not steered to the cloud.") }); // loopback
    return { verdict: "BYPASSED", headline: say("head.loopback", "Bypassed - loopback stays on the box."), effectiveMode: mode, ledger, notes }; // bypassed
  }

  // -- 4. Scope: does the effective mode even capture this flow? ------------
  if (spec.flow.kind === "non-web" && mode !== "all") {
    const flow = spec.flow.detail || "tcp"; // the flow as typed
    ledger.push({
      check: say("check.nonWeb", `Non-web flow (${flow}) vs mode ${mode}`, { flow, mode }), // non-web against the mode
      outcome: say("out.nonWeb", "Out of scope: only All Traffic mode steers non-web traffic (the Cloud Firewall subscription's mode). Web mode captures HTTP/HTTPS; Cloud Apps Only captures selected applications."), // out of scope
    });
    return { verdict: "DIRECT", headline: say("head.nonWeb", "Direct - the profile's mode does not capture non-web traffic."), effectiveMode: mode, ledger, notes }; // direct
  }
  if (spec.flow.kind === "web" && spec.flow.nonStdPort === "ip" && mode !== "all") {
    ledger.push({
      check: say("check.nonStdIp", "Non-standard web port accessed by IP address"), // the pitfall
      outcome: say("out.nonStdIp", "Documented pitfall: with an FQDN configured in Steer Non-Standard Port but the server accessed by IP, the Client treats the request as non-web (it keeps no FQDN-to-IP mapping) - so a Web-mode profile does not steer it. The documented fix is to configure both the FQDN and the IP address."), // treated as non-web
    });
    return { verdict: "DIRECT", headline: say("head.nonStdIp", "Direct - the non-standard-port-by-IP pitfall dropped this out of web scope."), effectiveMode: mode, ledger, notes }; // direct
  }
  if (mode === "cloud-apps" && spec.flow.kind === "web") {
    ledger.push({
      check: say("check.cloudApps", "Generic web flow vs Cloud Apps Only"), // web against Cloud Apps Only
      outcome: say("out.cloudApps", "Cloud Apps Only steers just the selected applications (the Cloud Inline / CASB-only posture). A generic web destination that is not a steered app goes direct."), // not a steered app
    });
    return { verdict: "DIRECT", headline: say("head.cloudApps", "Direct - Cloud Apps Only steers selected apps, and this is not one."), effectiveMode: mode, ledger, notes }; // direct
  }
  const scope = `${spec.flow.kind}${spec.flow.detail ? " " + spec.flow.detail : ""}`; // the flow, kind and detail
  ledger.push({
    check: say("check.scope", `Flow scope (${scope})`, { scope }), // the flow's scope
    outcome: say("out.captured", `Captured by mode ${mode}.`, { mode }), // captured
  });

  // -- 5. Exception families the flow matches --------------------------------
  const matched = spec.exceptions.filter((e) => spec.flowMatches.has(e.kind));
  if (matched.length > 0) {
    // Cert-pinned steer-and-decrypt is the one documented "match that still steers".
    const sd = matched.find((e) => e.kind === "cert-pinned" && e.steerDecrypt);
    if (sd) {
      const app = sd.value; // the pinned app
      ledger.push({
        check: say("check.steerDecrypt", `Certificate-pinned app "${app}" with Steer-and-decrypt`, { app }), // a pinned app, decrypted
        outcome: say("out.steerDecrypt", "Documented option: the app is steered through NewEdge and decrypted without additional configuration, so Real-time Protection policies apply - the alternative to bypassing pinned apps."), // steered and decrypted
      });
      return {
        verdict: "STEERED",
        headline: say("head.steerDecrypt", "Steered and decrypted - the cert-pinned exception is set to Steer and decrypt at Netskope Cloud."), // steered
        effectiveMode: mode,
        ledger,
        notes: [...notes, say("note.pinnedDefault", "The default posture for pinned apps is bypass (the Netskope-maintained list exists because pinning breaks interception); steer-and-decrypt is the per-profile opt-in.")], // the default posture
      };
    }
    for (const e of matched) {
      const outcome =
        e.kind === "dest-location" && e.treatLocal
          ? say("out.bypassLocal", "Bypassed at the Client (with Treat it like local IP address).") // a destination location treated as local
          : e.kind === "category"
            ? say("out.bypassCategory", "Bypassed at the Client (category exceptions apply in Web and All modes).") // a category
            : e.kind === "firewall-app"
              ? say("out.bypassFirewall", "Bypassed at the Client (firewall app exceptions exist in All mode, with separate On-Prem and Off-Prem rule sets under dynamic steering).") // a firewall app
              : say("out.bypass", "Bypassed at the Client."); // any other exception
      const kind = e.kind, value = e.value; // the exception
      ledger.push({ check: say("check.exception", `Exception match: ${kind} "${value}"`, { kind, value }), outcome }); // the match
    }
    if (matched.length > 1) {
      notes.push(say("note.noPrecedence", // no published precedence
        "More than one exception family matched. The public docs define each family's behaviour but do not publish a cross-family precedence order; all matched families here agree on bypass, so the verdict is unambiguous - but the ledger reports families, not an invented ranking.",
      ));
    }
    return {
      verdict: "BYPASSED",
      headline: say("head.exception", "Bypassed at the Client - the flow matches a configured steering exception."), // bypassed
      effectiveMode: mode,
      ledger,
      notes,
    };
  }

  ledger.push({ check: say("check.exceptions", "Steering exceptions"), outcome: spec.exceptions.length === 0 ? say("out.noExceptions", "None configured.") : say("out.noMatch", "Configured, but this flow matches none of them.") }); // no exception matched

  // -- 6. Steered -------------------------------------------------------------
  notes.push(say("note.next", "Steered is where the next decision begins: whether the session is decrypted for inspection is the TLS-decryption policy's call - the inline-TLS article on this site picks up exactly there.")); // what comes next
  return {
    verdict: "STEERED",
    headline: say("head.steered", "Steered to Netskope - captured by the mode, matching no exception."), // steered
    effectiveMode: mode,
    ledger,
    notes,
  };
}
