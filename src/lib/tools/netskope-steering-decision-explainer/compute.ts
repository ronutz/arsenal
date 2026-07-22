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
// ============================================================================

export type Mode = "cloud-apps" | "web" | "all" | "none";
export type Verdict = "STEERED" | "BYPASSED" | "BLOCKED" | "DIRECT";

export interface LedgerStep {
  check: string;
  outcome: string;
}

export interface SteeringDecision {
  verdict: Verdict;
  /** What the traffic's fate is, one line. */
  headline: string;
  effectiveMode: Mode;
  ledger: LedgerStep[];
  notes: string[];
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
  if (lines.length === 0) throw new Error("Paste a steering spec - press Example to see the grammar.");
  if (lines.length > 40) throw new Error(`That is ${lines.length} lines - this explainer caps at 40.`);

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
    if (!m) throw new Error(`Line ${n} ("${line}") is not "key: value".`);
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    const bad = (msg: string) => new Error(`Line ${n} (${key}): ${msg}`);

    switch (key) {
      case "mode":
        if (!MODES.includes(val as Mode) || val === "none") throw bad(`expected cloud-apps | web | all (got "${val}"). "none" exists only as a dynamic per-location mode.`);
        spec.mode = val as Mode; sawMode = true; break;
      case "dynamic":
        if (val !== "on" && val !== "off") throw bad(`expected on | off.`);
        spec.dynamic = val === "on"; break;
      case "location":
        if (val !== "on-prem" && val !== "off-prem") throw bad(`expected on-prem | off-prem.`);
        spec.location = val; break;
      case "mode-on-prem":
        if (!MODES.includes(val as Mode)) throw bad(`expected cloud-apps | web | all | none.`);
        spec.modeOnPrem = val as Mode; break;
      case "mode-off-prem":
        if (!MODES.includes(val as Mode)) throw bad(`expected cloud-apps | web | all | none.`);
        spec.modeOffPrem = val as Mode; break;
      case "tunnel":
        if (val !== "up" && val !== "down") throw bad(`expected up | down.`);
        spec.tunnel = val; break;
      case "fail-close":
        if (val !== "on" && val !== "off") throw bad(`expected on | off.`);
        spec.failClose = val === "on"; break;
      case "flow": {
        const fm = val.match(/^(web|app|non-web|rfc1918|loopback)\b\s*(.*)$/);
        if (!fm) throw bad(`expected "web <host>" | "app <name>" | "non-web <proto/port>" | "rfc1918 <ip>" | "loopback".`);
        spec.flow = { kind: fm[1] as Spec["flow"]["kind"], detail: fm[2].trim() };
        sawFlow = true; break;
      }
      case "non-standard-port":
        if (val !== "fqdn" && val !== "ip") throw bad(`expected fqdn | ip - how the non-standard web port is being accessed.`);
        spec.flow.nonStdPort = val; break;
      case "exception": {
        const em = val.match(/^(cert-pinned|domain|category|dest-location|firewall-app)\s+(.+)$/);
        if (!em) throw bad(`expected "<cert-pinned|domain|category|dest-location|firewall-app> <value> [steer-decrypt|treat-local]".`);
        const parts = em[2].split(/\s+/);
        const flags = new Set(parts.filter((p) => p === "steer-decrypt" || p === "treat-local"));
        const value = parts.filter((p) => p !== "steer-decrypt" && p !== "treat-local").join(" ");
        if (!value) throw bad(`the exception needs a value.`);
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
            throw bad(`unknown match "${k}" - use the exception kinds, or none.`);
          if (k !== "none") spec.flowMatches.add(k);
        }
        break;
      }
      default:
        throw new Error(`Line ${n}: unknown key "${key}".`);
    }
  });

  if (!sawMode && !spec.dynamic) throw new Error(`The spec needs "mode:" (or dynamic steering with per-location modes).`);
  if (!sawFlow) throw new Error(`The spec needs a "flow:" line - the traffic being decided.`);
  if (spec.dynamic && !spec.modeOnPrem && !spec.modeOffPrem)
    throw new Error(`dynamic: on needs mode-on-prem: and/or mode-off-prem:.`);
  // A declared match must reference a configured exception kind.
  for (const k of spec.flowMatches) {
    if (!spec.exceptions.some((e) => e.kind === k))
      throw new Error(`flow-matches names "${k}" but no "exception: ${k} ..." line configures one.`);
  }
  return spec;
}

/** Walk the documented decision order and produce the verdict + ledger. */
export function run(text: string): SteeringDecision {
  const spec = parseSpec(text);
  const ledger: LedgerStep[] = [];
  const notes: string[] = [];

  // -- 1. Effective mode (dynamic steering resolves per location) -----------
  let mode: Mode = spec.mode;
  if (spec.dynamic) {
    mode = (spec.location === "on-prem" ? spec.modeOnPrem : spec.modeOffPrem) ?? spec.mode;
    ledger.push({
      check: `Dynamic steering: device is ${spec.location}`,
      outcome: `Per-location traffic mode applies: ${mode}. (On-Premises Detection Profiles decide the location; the docs also warn that repeatedly toggling dynamic steering can lose steering exceptions.)`,
    });
  } else {
    ledger.push({ check: "Traffic mode", outcome: `Static steering profile, mode: ${mode}.` });
  }

  if (mode === "none") {
    ledger.push({
      check: "Mode None",
      outcome: "Documented behavior: the Client does not establish a tunnel or steer traffic, and exceptions are not processed - they apply only to steered traffic.",
    });
    return {
      verdict: "DIRECT",
      headline: "Direct to the destination - mode None builds no tunnel and processes no exceptions.",
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
        ledger.push({
          check: "Tunnel down + Fail Close ON",
          outcome: `Fail Close blocks traffic when the tunnel is not established - but the docs state domain-based, IP-based, and cert-pinned exceptions are still applied. This flow matches: ${rescued.map((e) => `${e.kind} "${e.value}"`).join(", ")}.`,
        });
        return {
          verdict: "BYPASSED",
          headline: "Bypassed at the Client - Fail Close is blocking, but this flow matches an exception family the docs say survives it.",
          effectiveMode: mode,
          ledger,
          notes: [...notes, "Category-based exceptions are the documented casualty of Fail Close: with the tunnel down, they are blocked, not bypassed."],
        };
      }
      const catMatch = spec.flowMatches.has("category");
      ledger.push({
        check: "Tunnel down + Fail Close ON",
        outcome: catMatch
          ? "Documented behavior: category-based exceptions are blocked under Fail Close, unlike domain/IP/cert-pinned ones."
          : "Fail Close blocks all traffic when the tunnel to Netskope is not established.",
      });
      return {
        verdict: "BLOCKED",
        headline: "Blocked at the endpoint - Fail Close is on and the tunnel is down.",
        effectiveMode: mode,
        ledger,
        notes,
      };
    }
    ledger.push({
      check: "Tunnel down, Fail Close off",
      outcome: "Fail open: with no tunnel and no Fail Close, traffic goes direct, uninspected.",
    });
    return {
      verdict: "DIRECT",
      headline: "Direct and uninspected - the tunnel is down and the profile fails open.",
      effectiveMode: mode,
      ledger,
      notes: [...notes, "This is the availability-versus-inspection trade Fail Close exists to flip."],
    };
  }
  ledger.push({ check: "Tunnel to NewEdge", outcome: "Established - steering rules now decide." });

  // -- 3. Always-on default bypasses ----------------------------------------
  if (spec.flow.kind === "rfc1918") {
    ledger.push({
      check: `Destination ${spec.flow.detail || "RFC1918"}`,
      outcome: "Documented default: RFC1918 space (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) is always bypassed from Netskope.",
    });
    return { verdict: "BYPASSED", headline: "Bypassed by default - private address space never steers.", effectiveMode: mode, ledger, notes };
  }
  if (spec.flow.kind === "loopback") {
    ledger.push({ check: "Loopback destination", outcome: "Local loopback traffic is not steered to the cloud." });
    return { verdict: "BYPASSED", headline: "Bypassed - loopback stays on the box.", effectiveMode: mode, ledger, notes };
  }

  // -- 4. Scope: does the effective mode even capture this flow? ------------
  if (spec.flow.kind === "non-web" && mode !== "all") {
    ledger.push({
      check: `Non-web flow (${spec.flow.detail || "tcp"}) vs mode ${mode}`,
      outcome: "Out of scope: only All Traffic mode steers non-web traffic (the Cloud Firewall subscription's mode). Web mode captures HTTP/HTTPS; Cloud Apps Only captures selected applications.",
    });
    return { verdict: "DIRECT", headline: "Direct - the profile's mode does not capture non-web traffic.", effectiveMode: mode, ledger, notes };
  }
  if (spec.flow.kind === "web" && spec.flow.nonStdPort === "ip" && mode !== "all") {
    ledger.push({
      check: "Non-standard web port accessed by IP address",
      outcome: "Documented pitfall: with an FQDN configured in Steer Non-Standard Port but the server accessed by IP, the Client treats the request as non-web (it keeps no FQDN-to-IP mapping) - so a Web-mode profile does not steer it. The documented fix is to configure both the FQDN and the IP address.",
    });
    return { verdict: "DIRECT", headline: "Direct - the non-standard-port-by-IP pitfall dropped this out of web scope.", effectiveMode: mode, ledger, notes };
  }
  if (mode === "cloud-apps" && spec.flow.kind === "web") {
    ledger.push({
      check: "Generic web flow vs Cloud Apps Only",
      outcome: "Cloud Apps Only steers just the selected applications (the Cloud Inline / CASB-only posture). A generic web destination that is not a steered app goes direct.",
    });
    return { verdict: "DIRECT", headline: "Direct - Cloud Apps Only steers selected apps, and this is not one.", effectiveMode: mode, ledger, notes };
  }
  ledger.push({
    check: `Flow scope (${spec.flow.kind}${spec.flow.detail ? " " + spec.flow.detail : ""})`,
    outcome: `Captured by mode ${mode}.`,
  });

  // -- 5. Exception families the flow matches --------------------------------
  const matched = spec.exceptions.filter((e) => spec.flowMatches.has(e.kind));
  if (matched.length > 0) {
    // Cert-pinned steer-and-decrypt is the one documented "match that still steers".
    const sd = matched.find((e) => e.kind === "cert-pinned" && e.steerDecrypt);
    if (sd) {
      ledger.push({
        check: `Certificate-pinned app "${sd.value}" with Steer-and-decrypt`,
        outcome: "Documented option: the app is steered through NewEdge and decrypted without additional configuration, so Real-time Protection policies apply - the alternative to bypassing pinned apps.",
      });
      return {
        verdict: "STEERED",
        headline: "Steered and decrypted - the cert-pinned exception is set to Steer and decrypt at Netskope Cloud.",
        effectiveMode: mode,
        ledger,
        notes: [...notes, "The default posture for pinned apps is bypass (the Netskope-maintained list exists because pinning breaks interception); steer-and-decrypt is the per-profile opt-in."],
      };
    }
    for (const e of matched) {
      const extra =
        e.kind === "dest-location" && e.treatLocal
          ? " (with Treat it like local IP address)"
          : e.kind === "category"
            ? " (category exceptions apply in Web and All modes)"
            : e.kind === "firewall-app"
              ? " (firewall app exceptions exist in All mode, with separate On-Prem and Off-Prem rule sets under dynamic steering)"
              : "";
      ledger.push({ check: `Exception match: ${e.kind} "${e.value}"`, outcome: `Bypassed at the Client${extra}.` });
    }
    if (matched.length > 1) {
      notes.push(
        "More than one exception family matched. The public docs define each family's behavior but do not publish a cross-family precedence order; all matched families here agree on bypass, so the verdict is unambiguous - but the ledger reports families, not an invented ranking.",
      );
    }
    return {
      verdict: "BYPASSED",
      headline: "Bypassed at the Client - the flow matches a configured steering exception.",
      effectiveMode: mode,
      ledger,
      notes,
    };
  }

  ledger.push({ check: "Steering exceptions", outcome: spec.exceptions.length === 0 ? "None configured." : "Configured, but this flow matches none of them." });

  // -- 6. Steered -------------------------------------------------------------
  notes.push("Steered is where the next decision begins: whether the session is decrypted for inspection is the TLS-decryption policy's call - the inline-TLS article on this site picks up exactly there.");
  return {
    verdict: "STEERED",
    headline: "Steered to Netskope - captured by the mode, matching no exception.",
    effectiveMode: mode,
    ledger,
    notes,
  };
}
