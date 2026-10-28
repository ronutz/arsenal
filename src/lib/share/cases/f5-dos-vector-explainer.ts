// ============================================================================
// src/lib/share/cases/f5-dos-vector-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the AFM DoS-vector explainer: the paste goes as typed (posture
// input-caution: the popover adds the tool's caution line), and a paste that
// holds a secret setting gets no link (code "secret", findTmshSecret).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { DOS_VECTOR_SHARE, type DosVectorShareState } from "../../tools/f5-dos-vector-explainer/share"; // the spec
import { DOS_VECTORS } from "../../tools/f5-dos-vector-explainer/golden-vectors"; // the tool's own vectors

/**
 * A golden vector's input, byte for byte.
 * @param id the vector's id
 * @returns its input (empty when the id is missing, which fails the accept case)
 */
const pick = (id: string): string => DOS_VECTORS.find((v) => v.id === id)?.input ?? ""; // pinned there

/** A reading this tool gives (golden vector inversion-device-naming). */
const DEVICE = pick("inversion-device-naming"); // the base of the extra and blocked cases
/** A device config with an auth stanza pasted along whose bind password is none: no secret, so it goes. */
const WITH_EMPTY_BIND = `${DEVICE}\nauth ldap system-auth {\n    bind-pw none\n    servers { 192.0.2.30 }\n}`; // no value set

/** The cases. */
export const DOS_VECTOR_SHARE_CASES = defineShareCases<DosVectorShareState, DosVectorShareState>({
  spec: DOS_VECTOR_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "device-config", state: { input: pick("inversion-device-naming") }, params: { input: pick("inversion-device-naming") }, restored: { input: pick("inversion-device-naming") } }, // golden vector inversion-device-naming, as typed
    { id: "profile", state: { input: pick("inversion-profile-naming") }, params: { input: pick("inversion-profile-naming") }, restored: { input: pick("inversion-profile-naming") } }, // golden vector inversion-profile-naming, as typed
    { id: "vector-name", state: { input: pick("single-vector-halfopen") }, params: { input: pick("single-vector-halfopen") }, restored: { input: pick("single-vector-halfopen") } }, // golden vector single-vector-halfopen, as typed
    { id: "catalogue", state: { input: pick("catalog-shape") }, params: { input: pick("catalog-shape") }, restored: { input: pick("catalog-shape") } }, // golden vector catalog-shape, as typed
    { id: "with-bind-pw-none", state: { input: WITH_EMPTY_BIND }, params: { input: WITH_EMPTY_BIND }, restored: { input: WITH_EMPTY_BIND } }, // more than the tool reads, and no secret
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank box
    { id: "white-space", state: { input: "\n\t " } }, // only white space
  ],
  blocked: [ // a reading exists, but no link may carry the paste
    { id: "ldap-bind-pw", state: { input: `${DEVICE}\nauth ldap system-auth {\n    bind-pw $M$xx$EXAMPLE==\n}` }, code: "secret" }, // an LDAP bind password
    { id: "radius-secret", state: { input: `${DEVICE}\nauth radius-server system_auth_name1 {\n    secret $M$yy$EXAMPLE==\n    server 192.0.2.31\n}` }, code: "secret" }, // a RADIUS shared secret
    { id: "encrypted-password", state: { input: `auth user admin {\n    encrypted-password $6$EXAMPLEHASH\n}\n${DEVICE}` }, code: "secret" }, // a user's password hash
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: " \n" } }, // only white space
  ],
});
