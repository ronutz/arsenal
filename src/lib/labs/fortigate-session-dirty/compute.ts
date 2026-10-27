// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/fortigate-session-dirty/compute.ts
// ----------------------------------------------------------------------------
// THE FORTIGATE SESSION-DIRTY LAB'S MODEL (2026-10-26), the interactive
// companion of the article "FortiGate Firewall Policies and NAT". A session is
// established through a FortiGate, accepted by one firewall policy. Then an
// administrator changes the policy set. The reader sets the VDOM's
// firewall-session-dirty (config system settings), the accepting policy's own
// firewall-session-dirty where FortiOS offers it, and the change; the model
// says whether the established session is flagged dirty and re-evaluated at its
// next packet (and dropped when the policies no longer allow it) or keeps
// flowing until it ends.
//
// The rules are Fortinet's, read on 2026-10-26, each named in the article:
//   - FortiOS 7.6.6 CLI Reference, config system settings,
//     firewall-session-dirty: check-all (the default) flushes the sessions a
//     firewall policy change affects and re-evaluates their new packets;
//     check-new lets established sessions continue unaffected and evaluates new
//     sessions against the new policies; check-policy-option manages sessions
//     individually, by firewall policy.
//   - FortiOS 7.6.6 CLI Reference, config firewall policy,
//     firewall-session-dirty: check-all (the default) flushes the sessions this
//     policy accepted, to be re-matched; check-new continues to allow them.
//     Fortinet's Technical Tip "Information about firewall-session-dirty"
//     (97625): the policy-level option is available only when the VDOM-level
//     setting is check-policy-option; with check-all sessions are marked dirty
//     (state "dirty may_dirty") and re-validated, after which the dirty marker
//     is removed; with check-new sessions carry the persistent flag; changing
//     the setting itself triggers no re-validation.
//   - FortiOS 7.6.0 Best Practices, "Policy configuration changes": under
//     check-all a session a policy change affects is flagged dirty and
//     revalidated; one that still conforms is unaffected; one that does not is
//     flagged as blocked and removed, and its traffic dropped. Under check-new
//     sessions are flagged persistent and not revalidated: policy changes
//     apply to new sessions only. Only sessions created after check-new was set
//     are persistent; older ones are revalidated after a later change.
//   - Technical Tip "'Dirty' session" (99259, labelled FortiOS 5.2 to 6.2): any
//     change in the firewall policies marks existing sessions dirty, and the
//     next packet of a dirty session is re-evaluated. Technical Tip
//     "Troubleshooting FortiGate traffic drops caused by dirty session handler
//     and policy 0" (226173): a session can be marked dirty, revalidated and
//     dropped if it no longer matches a valid policy; policy 0 is the implicit
//     deny.
//   - FortiOS 7.6.6 CLI Reference, config system global,
//     strict-dirty-session-check (default enable): the session is checked
//     against the policy that originally allowed it, and deleted when a policy
//     change means it no longer matches that policy.
// Where the documents are silent the model does not decide: with
// check-policy-option, a NEW deny policy above the accepting one is a change to
// another policy, and no document says whose option governs the established
// session, so that outcome is "undocumented".
// What the model leaves out (the lab's scope note): route and other non-policy
// changes, NGFW policy-based mode (the tip: only check-all there),
// strict-dirty-session-check disabled, another policy below that would also
// accept the traffic, hardware offload, how long after the change the next
// packet comes, and how long a blocked session stays in the table.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The VDOM-level firewall-session-dirty values (config system settings). */
export type GlobalSetting = "check-all" | "check-new" | "check-policy-option";
/** Every global value, in the CLI reference's order. */
export const GLOBAL_SETTINGS: readonly GlobalSetting[] = ["check-all", "check-new", "check-policy-option"];
/** The policy-level firewall-session-dirty values (config firewall policy). */
export type PolicySetting = "check-all" | "check-new";
/** Every policy-level value, in the CLI reference's order. */
export const POLICY_SETTINGS: readonly PolicySetting[] = ["check-all", "check-new"];

/** What the administrator does after the session is established. */
export type Change =
  /** Edits the accepting policy's action to deny. */
  | "edit-to-deny"
  /** Changes the accepting policy's addresses or services so the session no longer matches it. */
  | "narrow-match"
  /** Adds a new deny policy above the accepting one, matching the session. */
  | "deny-above"
  /** Edits the accepting policy in a way that still accepts the session (an address added, say). */
  | "still-matches";
/** Every change, in the order the lab offers them. */
export const CHANGES: readonly Change[] = ["edit-to-deny", "narrow-match", "deny-above", "still-matches"];

/** The reader's settings. */
export interface SessionDirtyInput {
  /** config system settings: firewall-session-dirty. */
  global: GlobalSetting;
  /** config firewall policy: firewall-session-dirty on the accepting policy (used only with check-policy-option). */
  policy: PolicySetting;
  /** True when the session opened before check-new was set, under check-all (used only with check-new). */
  openedBeforeCheckNew: boolean;
  /** The change. */
  change: Change;
}

/** Which documented behaviour governs the session. */
export type Governing =
  /** The VDOM's check-all. */
  | "global-check-all"
  /** The VDOM's check-new, the session flagged persistent. */
  | "global-check-new"
  /** The VDOM's check-new, but the session predates it: revalidated. */
  | "global-check-new-older"
  /** The accepting policy's check-all. */
  | "policy-check-all"
  /** The accepting policy's check-new. */
  | "policy-check-new"
  /** No document says. */
  | "undocumented";

/** How the session ends up. */
export type Outcome =
  /** Re-evaluated at its next packet and blocked: its traffic is dropped. */
  | "dropped"
  /** Re-evaluated at its next packet and still allowed: it carries on. */
  | "revalidated-continues"
  /** Not re-evaluated: it keeps flowing until it ends. */
  | "unchecked-continues"
  /** The documents do not decide. */
  | "undocumented";

/** The model's answer. */
export interface SessionDirtyResult {
  /** Which documented behaviour governs. */
  governing: Governing;
  /** True when the policy-level option is in force (the global setting is check-policy-option). */
  policyOptionApplies: boolean;
  /** The documented flag the session carries before the change: may_dirty, persistent, or null when no document names it. */
  flagBefore: "may_dirty" | "persistent" | null;
  /** True when the change marks it dirty, false when it does not, null when undocumented. */
  flaggedDirty: boolean | null;
  /** True when its next packet is re-evaluated, false when not, null when undocumented. */
  revalidated: boolean | null;
  /** True when the policy set after the change allows this traffic (what a new session would get). */
  allowedAfterChange: boolean;
  /** The outcome. */
  outcome: Outcome;
}

/** The stable codes an invalid input is refused with. */
export type SessionDirtyErrorCode = "bad-global" | "bad-policy" | "bad-opened" | "bad-change";

/** An invalid input, refused with a stable code. */
export class SessionDirtyError extends Error {
  /** The stable code. */
  readonly code: SessionDirtyErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: SessionDirtyErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** Say what happens to the established session after the change, and on which document's authority. */
export function compute(input: SessionDirtyInput): SessionDirtyResult {
  // The global setting must be one of the CLI reference's three.
  if (!GLOBAL_SETTINGS.includes(input.global)) throw new SessionDirtyError("bad-global", `not a firewall-session-dirty value: ${String(input.global)}`);
  // The policy setting must be one of its two (checked even when unused, so a stray value is never carried).
  if (!POLICY_SETTINGS.includes(input.policy)) throw new SessionDirtyError("bad-policy", `not a policy firewall-session-dirty value: ${String(input.policy)}`);
  // The opened-before flag is a boolean.
  if (typeof input.openedBeforeCheckNew !== "boolean") throw new SessionDirtyError("bad-opened", "openedBeforeCheckNew must be true or false");
  // The change must be one the lab offers.
  if (!CHANGES.includes(input.change)) throw new SessionDirtyError("bad-change", `not a change the lab offers: ${String(input.change)}`);

  // After the change, only the harmless edit still allows this traffic; the others meet a deny or the implicit deny (226173).
  const allowedAfterChange = input.change === "still-matches";
  // The policy-level option exists only under check-policy-option (97625).
  const policyOptionApplies = input.global === "check-policy-option";

  // Which documented behaviour governs.
  let governing: Governing;
  // The VDOM's check-all: the default.
  if (input.global === "check-all") governing = "global-check-all";
  // The VDOM's check-new: persistent, unless the session predates the setting (7.6.0 Best Practices).
  else if (input.global === "check-new") governing = input.openedBeforeCheckNew ? "global-check-new-older" : "global-check-new";
  // check-policy-option and a new policy above: a change to ANOTHER policy, and no document says whose option governs.
  else if (input.change === "deny-above") governing = "undocumented";
  // check-policy-option and a change to the accepting policy itself: that policy's option decides (7.6.6 config firewall policy).
  else governing = input.policy === "check-all" ? "policy-check-all" : "policy-check-new";

  // The flag a document names for the session before the change: may_dirty under check-all (97625), persistent under check-new (97625; Best Practices).
  const flagBefore: "may_dirty" | "persistent" | null =
    governing === "global-check-all" || governing === "global-check-new-older" ? "may_dirty" : governing === "global-check-new" ? "persistent" : null;
  // Re-evaluated: under every check-all path, never under check-new, unknown when undocumented.
  const revalidated: boolean | null =
    governing === "undocumented" ? null : governing === "global-check-new" || governing === "policy-check-new" ? false : true;
  // Flagged dirty: the global check-all paths name the flag (97625, Best Practices); a persistent session is not; the policy-level paths name no flag.
  const flaggedDirty: boolean | null =
    governing === "global-check-all" || governing === "global-check-new-older" ? true : governing === "global-check-new" ? false : null;
  // The outcome: re-evaluated sessions live or die by the policies as they now stand; the others keep flowing.
  const outcome: Outcome = revalidated === null ? "undocumented" : revalidated ? (allowedAfterChange ? "revalidated-continues" : "dropped") : "unchecked-continues";

  // The full answer.
  return { governing, policyOptionApplies, flagBefore, flaggedDirty, revalidated, allowedAfterChange, outcome };
}

/** The opening state: the default check-all, and the accepting policy edited to deny. */
export const DEFAULT_INPUT: SessionDirtyInput = { global: "check-all", policy: "check-all", openedBeforeCheckNew: false, change: "edit-to-deny" };

/** The Example: check-new, the policy edited to deny, and the old session still flowing. */
export const EXAMPLE_INPUT: SessionDirtyInput = { global: "check-new", policy: "check-all", openedBeforeCheckNew: false, change: "edit-to-deny" };
