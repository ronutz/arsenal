// ============================================================================
// src/lib/tools/code-to-image/example.ts
// ----------------------------------------------------------------------------
// The Example (D-83), in a module of its own so the page imports it without
// pulling the golden vectors into its bundle. golden-vectors.ts imports the
// same constants and pins the SVG and alt text they produce, so the Example is
// verbatim a golden vector's input.
// ============================================================================

import type { CodeImageOptions } from "./compute"; // the options' shape
import type { LanguageId } from "./languages"; // the language ids

/** A FortiOS IPsec phase 1 with its pre-shared key in the encrypted ENC form; the value is base64 of "for-demo-only-not-a-real-key" and 203.0.113.10 is an RFC 5737 documentation address. */
export const EXAMPLE_FORTIOS = [
  "config vpn ipsec phase1-interface", // the configuration table
  "    edit \"to-branch-01\"", // the tunnel's entry
  "        set interface \"port1\"", // the outgoing interface
  "        set peertype any", // accept any peer ID
  "        set proposal aes256-sha256", // the proposal
  "        set remote-gw 203.0.113.10", // the peer (TEST-NET-3)
  "        set psksecret ENC Zm9yLWRlbW8tb25seS1ub3QtYS1yZWFsLWtleQ==", // the pre-shared key, encrypted: masked
  "    next", // close the entry
  "end", // close the table
].join("\n"); // EXAMPLE_FORTIOS, nine lines

/** The options the Example button sets with it. */
export const EXAMPLE_OPTIONS: Readonly<Partial<CodeImageOptions>> = Object.freeze({ language: "fortios" as LanguageId, title: "VPN to branch 01", highlight: "7" }); // FortiOS, a title, the masked line highlighted
