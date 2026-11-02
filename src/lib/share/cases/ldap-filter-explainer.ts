// ============================================================================
// src/lib/share/cases/ldap-filter-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the LDAP filter explainer: the filter as typed, parsed or
// not; a filter asserting a value of userPassword, authPassword or unicodePwd
// (by name or OID, any case, with options) is blocked; a presence test goes.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { LDAP_FILTER_SHARE, type LdapShareState } from "../../tools/ldap-filter-explainer/share"; // the spec

/** The page's Example (golden vector V09's AD idiom inside a user query). */
const EXAMPLE = "(&(objectClass=user)(|(cn=Rod*)(mail=*@ronutz.com))(!(userAccountControl:1.2.840.113556.1.4.803:=2)))"; // verbatim from the component
/** A filter with escapes and a group DN. */
const ESCAPED = "(&(cn=Babs J\\2a Jensen)(memberOf=CN=VPN Users,OU=Groups,DC=corp,DC=example))"; // \2a is "*" (RFC 4515 section 3)
/** A broken filter: its anchored error is the reading. */
const BROKEN = "(&(uid=jdoe)(mail=jdoe@example.com)"; // one parenthesis short

/** The cases. */
const CASES: ShareCases<LdapShareState, LdapShareState> = {
  spec: LDAP_FILTER_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // as typed
    { id: "escaped-dn", state: { input: ESCAPED }, params: { input: ESCAPED }, restored: { input: ESCAPED } }, // backslashes, commas and = kept
    { id: "broken-filter", state: { input: BROKEN }, params: { input: BROKEN }, restored: { input: BROKEN } }, // the error goes too
    { id: "password-presence", state: { input: "(&(objectClass=person)(userPassword=*))" }, params: { input: "(&(objectClass=person)(userPassword=*))" }, restored: { input: "(&(objectClass=person)(userPassword=*))" } }, // a presence test carries no value
  ],
  empty: [
    { id: "blank", state: { input: " \n" } }, // nothing to explain
  ],
  blocked: [
    { id: "user-password", state: { input: "(&(uid=jdoe)(userPassword=s3cret))" }, code: "password" }, // RFC 4519 section 2.41
    { id: "user-password-oid-option", state: { input: "(2.5.4.35;binary=s3cret)" }, code: "password" }, // by OID, with an option
    { id: "unicodepwd-any-case", state: { input: "(|(UNICODEPWD=x)(cn=y))" }, code: "password" }, // descriptions are case-insensitive (RFC 4512 section 2.5)
    { id: "auth-password-substring", state: { input: "(authPassword=SHA256$*)" }, code: "password" }, // part of a value is still a value
    { id: "extensible-match", state: { input: "(userPassword:octetStringMatch:=s3cret)" }, code: "password" }, // an extensible match asserts one too
    { id: "broken-but-password", state: { input: "(&(uid=jdoe)(userPassword=s3cret)" }, code: "password" }, // read in the text, parsed or not
  ],
  reject: [
    { id: "blank", values: { input: "  " } }, // nothing
    { id: "password", values: { input: "(userPassword=s3cret)" } }, // never fills a page
  ],
};

/** The runner. */
export const LDAP_FILTER_EXPLAINER_SHARE_CASES = defineShareCases(CASES); // the central harness runs it
