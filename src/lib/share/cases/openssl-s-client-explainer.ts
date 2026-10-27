// ============================================================================
// src/lib/share/cases/openssl-s-client-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the openssl s_client explainer: both boxes go with every
// secret replaced (the tool's own share vectors pin the copy byte for byte
// and that the receiving page reads the same handshake); the secrets never
// reach a link, in any spelling.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { OPENSSL_S_CLIENT_SHARE, type OpensslSClientShareState } from "../../tools/openssl-s-client-explainer/share"; // the spec
import { shareableSClient } from "../../tools/openssl-s-client-explainer/compute"; // the derived form
import { SHARE_VECTORS } from "../../tools/openssl-s-client-explainer/golden-vectors"; // the tool's own share vectors
import { capture } from "../../tools/openssl-s-client-explainer/captures"; // the real captures

/** The Example (TLS 1.3, two Resumption PSK values). */
const EXAMPLE = capture("missing-intermediate"); // command and output
/** A TLS 1.2 run (one Master-Key). */
const TLS12 = capture("tls12-forced-alpn"); // command and output
/** The command-line secrets vector. */
const CMD = SHARE_VECTORS.find((v) => v.id === "share-command-secrets")!; // pinned there
/** The Example's copy. */
const EXAMPLE_COPY = shareableSClient({ command: EXAMPLE.command, output: EXAMPLE.output }); // pinned by share-example
/** The TLS 1.2 run's copy. */
const TLS12_COPY = shareableSClient({ command: TLS12.command, output: TLS12.output }); // pinned by share-tls12-master-key

/** The cases. */
export const OPENSSL_S_CLIENT_SHARE_CASES = defineShareCases<OpensslSClientShareState, OpensslSClientShareState>({
  spec: OPENSSL_S_CLIENT_SHARE, // the spec
  accept: [
    { // the Example: both boxes, the two PSK values replaced
      id: "example", state: { command: EXAMPLE.command, output: EXAMPLE.output },
      params: { command: EXAMPLE_COPY.command, output: EXAMPLE_COPY.output }, restored: { command: EXAMPLE_COPY.command, output: EXAMPLE_COPY.output },
      mustNotContain: SHARE_VECTORS.find((v) => v.id === "share-example")!.secrets, // the two PSK values
    },
    { // the output alone: the Master-Key replaced, no command value in the link
      id: "output-only-tls12", state: { command: "", output: TLS12.output },
      params: { output: TLS12_COPY.output }, restored: { command: "", output: TLS12_COPY.output },
      mustNotContain: SHARE_VECTORS.find((v) => v.id === "share-tls12-master-key")!.secrets, // the Master-Key
    },
    { // the command alone, with the four command-line secrets
      id: "command-secrets", state: { command: CMD.command ?? "", output: "" },
      params: { command: CMD.expectCommand ?? "" }, restored: { command: CMD.expectCommand ?? "", output: "" },
      mustNotContain: CMD.secrets, // hunter2, "p w", the PSK and the SRP password
    },
  ],
  arrive: [
    { id: "output-only", values: { command: null, output: "CONNECTED(00000003)" }, restored: { command: "", output: "CONNECTED(00000003)" } }, // an absent box is emptied
  ],
  empty: [
    { id: "nothing", state: { command: "", output: "" } }, // no paste
    { id: "white-space", state: { command: "  ", output: "\n" } }, // nothing but white space
  ],
  reject: [
    { id: "nothing", values: { command: null, output: null } }, // neither box
    { id: "blank", values: { command: " ", output: "\n" } }, // only white space
  ],
});
