// ============================================================================
// src/lib/dev-out/ask.ts
// ----------------------------------------------------------------------------
// THE ONE WAY A RED-ROOM LOOKUP SENDS A QUERY (Round 1 RT02, 2026-10-20).
//
// The RDAP and ASN lookups promised that nothing leaves the browser until the
// reader presses Ask, while Enter in the field called the same fetch directly
// (production audit of 2026-10-19, RT02). Enter stays, as the keyboard
// equivalent of Ask, and the copy now names both; what this module makes true
// is that the two are ONE action:
//   - isSendKey() decides which keystroke counts as Enter-to-send (not while an
//     input method is composing, not a key held down, not with a modifier);
//   - AskGate admits one query at a time (a second Ask or Enter while one is in
//     flight does nothing, even before React re-renders the disabled button)
//     and tells a late answer that its input has since changed, so it is
//     dropped instead of shown against the wrong query;
//   - askRegistry() performs the request and sorts the outcome into the cases
//     the pages explain separately: an answer, not found (404), another HTTP
//     status, a timeout, a network or CORS failure (indistinguishable to page
//     JavaScript, so explained together), and a 200 whose body is not JSON.
//     A failure is never reported as an answer.
// Typing, paste, Example and Clear never reach this module: the pages compute
// their plan locally and call send() only from Ask or Enter, and only for a
// plan of kind "query" (special-purpose ASNs, invalid input and bootstrap gaps
// have no URL, so there is nothing to send).
//
// No React and no window: the scratchpad unit check (check-ask.mts) drives it
// with a mock fetch.
// ============================================================================

/** How long a registry may take before the request is abandoned and reported as a timeout. */
export const ASK_TIMEOUT_MS = 12_000;

/** What a send produced, before the page adds its own summary of an answer. */
export type AskOutcome =
  // A 2xx with a JSON body; finalUrl is the last hop after redirects (who really answered).
  | { kind: "ok"; raw: unknown; finalUrl: string }
  // The registry answered 404: no object by that name.
  | { kind: "notFound" }
  // Any other non-2xx status, relayed verbatim.
  | { kind: "httpError"; status: number }
  // No answer within ASK_TIMEOUT_MS; the request was abandoned.
  | { kind: "timeout" }
  // The request failed before an answer could be read: network failure, a missing CORS header or a CSP block.
  | { kind: "network" }
  // A 2xx whose body is not JSON: an answer arrived but cannot be read as RDAP.
  | { kind: "unreadable"; status: number };

/** The part of a keyboard event isSendKey reads (a React KeyboardEvent satisfies it). */
export interface SendKeyEvent {
  /** The key's name ("Enter"). */
  key: string;
  /** True while the key is held down and auto-repeating. */
  repeat?: boolean;
  /** Modifier keys. */
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  /** The native event, whose isComposing is true while an input method editor is composing text. */
  nativeEvent?: { isComposing?: boolean };
}

/**
 * Whether a keystroke in the lookup field is the Enter that sends, the keyboard twin of Ask.
 * Enter while an input method composes text confirms the composition, not the query; a held-down Enter does not
 * resend; a modified Enter (Ctrl, Alt, Meta, Shift) is left to the browser.
 * @param e the keyboard event
 * @returns true when this keystroke should send the displayed query
 */
export function isSendKey(e: SendKeyEvent): boolean {
  // Only Enter.
  if (e.key !== "Enter") return false;
  // Not while an input method editor is composing (Enter confirms the candidate there).
  if (e.nativeEvent?.isComposing) return false;
  // Not an auto-repeat of a key held down.
  if (e.repeat) return false;
  // Not a modified Enter.
  return !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey);
}

/**
 * One query at a time, and only the latest one's answer is shown.
 * begin() returns a ticket, or null while a query is in flight; isCurrent(ticket) says whether the input is still
 * the one the query was sent for; end(ticket) frees the gate; invalidate() (called on every input change) makes
 * the in-flight ticket stale, aborts its request and frees the gate.
 */
export class AskGate {
  /** The ticket of the query in flight, or null when idle. */
  private active: number | null = null;
  /** The last ticket handed out; tickets only grow, so a stale one never matches again. */
  private counter = 0;
  /** The abort controller of the query in flight, so an input change can abandon it. */
  private controller: AbortController | null = null;

  /**
   * Start a query, unless one is already in flight.
   * @returns the ticket and the AbortController for its request, or null when the gate is busy
   */
  begin(): { ticket: number; controller: AbortController } | null {
    // A query in flight: a second Ask or Enter is ignored.
    if (this.active !== null) return null;
    // A fresh ticket and controller for this query.
    this.counter += 1;
    this.active = this.counter;
    this.controller = new AbortController();
    return { ticket: this.active, controller: this.controller };
  }

  /** Whether a ticket still belongs to the query on show (its input has not changed since). */
  isCurrent(ticket: number): boolean {
    // Only the active ticket is current.
    return this.active === ticket;
  }

  /** Free the gate after a query finished, if it is still the active one. */
  end(ticket: number): void {
    // A stale ticket has already been released by invalidate().
    if (this.active !== ticket) return;
    this.active = null;
    this.controller = null;
  }

  /** The input changed: abandon the query in flight (its answer would describe another input) and free the gate. */
  invalidate(): void {
    // Abort the request, if one is running; its outcome is then dropped by isCurrent().
    this.controller?.abort();
    this.controller = null;
    this.active = null;
  }

  /** Whether a query is in flight (for tests). */
  get busy(): boolean {
    // Busy while a ticket is active.
    return this.active !== null;
  }
}

/** The fetch signature askRegistry needs, so a test can pass a mock. */
export type FetchLike = (input: string, init: { headers: Record<string, string>; signal: AbortSignal }) => Promise<{
  status: number;
  ok: boolean;
  url: string;
  json: () => Promise<unknown>;
}>;

/**
 * Send one RDAP query from the browser to the registry URL and sort the outcome.
 * @param url the exact URL the page displayed before the reader pressed Ask or Enter
 * @param controller the AbortController from AskGate.begin(), so an input change can abandon the request
 * @param fetchImpl the fetch to use (the browser's by default; a mock in tests)
 * @param timeoutMs how long to wait before abandoning the request as a timeout
 * @returns the outcome; never throws
 */
export async function askRegistry(
  url: string,
  controller: AbortController,
  fetchImpl: FetchLike = (input, init) => fetch(input, init),
  timeoutMs: number = ASK_TIMEOUT_MS,
): Promise<AskOutcome> {
  // Set when the timer, not the reader, aborted the request, so the two are told apart.
  let timedOut = false;
  // The timer that abandons a request taking too long.
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    // The one request: the displayed URL, asking for RDAP JSON.
    const res = await fetchImpl(url, { headers: { Accept: "application/rdap+json" }, signal: controller.signal });
    // 404: the registry's own "no such object".
    if (res.status === 404) return { kind: "notFound" };
    // Any other non-2xx: relayed verbatim.
    if (!res.ok) return { kind: "httpError", status: res.status };
    // A 2xx: read the body as JSON.
    try {
      const raw: unknown = await res.json();
      // res.url is the last hop after redirects; empty in some environments, then the asked URL stands.
      return { kind: "ok", raw, finalUrl: res.url || url };
    } catch {
      // The body ended early because of the timeout, or was not JSON at all.
      return timedOut ? { kind: "timeout" } : { kind: "unreadable", status: res.status };
    }
  } catch {
    // An abort by the timer is a timeout; anything else (network, CORS, CSP, an abort by an input change) is a
    // failure to complete. An input-change abort is dropped by the page through AskGate.isCurrent anyway.
    return timedOut ? { kind: "timeout" } : { kind: "network" };
  } finally {
    // The timer never outlives the request.
    clearTimeout(timer);
  }
}
