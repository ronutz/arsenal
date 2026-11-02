// ============================================================================
// src/lib/share/cases/pingfederate-ognl-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the PingFederate OGNL expression explainer: the expression
// as typed and its context (left out for an attribute mapping); an expression
// holding a credential written in a format the site's secrets check knows by
// shape is blocked.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { OGNL_SHARE, type OgnlShareState } from "../../tools/pingfederate-ognl-explainer/share"; // the spec

/** The page's mapping Example. */
const MAPPING = '#this.get("mail") == null ? "" : #this.get("mail").toString().toLowerCase()'; // verbatim from the component
/** The page's criterion Example. */
const CRITERION = '#this.get("department").toString().contains("engineering")'; // verbatim from the component
/** A group check written over two lines, with the characters a link must keep. */
const MULTILINE = '#this.get("memberOf") != null &&\n  #this.get("memberOf").toString().contains("CN=VPN Users,OU=Groups,DC=corp,DC=example")'; // a DN with = and ,

/** The cases. */
const CASES: ShareCases<OgnlShareState, OgnlShareState> = {
  spec: OGNL_SHARE, // the spec
  accept: [
    { id: "mapping-example", state: { input: MAPPING, context: "attribute-mapping" }, params: { input: MAPPING }, restored: { input: MAPPING, context: "attribute-mapping" } }, // the default context is left out
    { id: "criterion-example", state: { input: CRITERION, context: "issuance-criterion" }, params: { input: CRITERION, context: "issuance-criterion" }, restored: { input: CRITERION, context: "issuance-criterion" } }, // the other context
    { id: "multiline-dn", state: { input: MULTILINE, context: "issuance-criterion" }, params: { input: MULTILINE, context: "issuance-criterion" }, restored: { input: MULTILINE, context: "issuance-criterion" } }, // as typed, line break and all
  ],
  arrive: [
    { id: "context-absent", values: { input: CRITERION, context: null }, restored: { input: CRITERION, context: "attribute-mapping" } }, // absent: the default
  ],
  empty: [
    { id: "blank", state: { input: "  \n", context: "attribute-mapping" } }, // nothing to explain
  ],
  blocked: [
    { id: "bearer-token", state: { input: '#this.get("h") == "Authorization: Bearer mF_9.B5f-4.1JqM"', context: "issuance-criterion" }, code: "secret" }, // RFC 6750's example token in a header line
    { id: "url-password", state: { input: '@java.net.URI@create("https://svc:Pa55w0rd@ldap.example.com/")', context: "attribute-mapping" }, code: "secret" }, // a password in a URL (RFC 3986 section 3.2.1)
  ],
  reject: [
    { id: "unknown-context", values: { input: MAPPING, context: "authentication-policy" } }, // not offered
    { id: "blank", values: { input: "   ", context: null } }, // nothing to explain
    { id: "secret", values: { input: '@java.net.URI@create("https://svc:Pa55w0rd@ldap.example.com/")', context: null } }, // never fills a page
  ],
};

/** The runner. */
export const PINGFEDERATE_OGNL_EXPLAINER_SHARE_CASES = defineShareCases(CASES); // the central harness runs it
