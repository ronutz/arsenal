// ============================================================================
// src/lib/share/cases/exos-config-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the ExtremeXOS (Switch Engine) config explainer (wave 4C,
// 2026-11-01): the link carries a copy with every secret value Extreme's
// Switch Engine v33.7.1 Command References define replaced by [redacted]. The
// values are Extreme's own examples where the reference gives one ("purplegreen"
// for a TACACS+ secret, "oklahoma" for an NTP key, the default communities
// "public" and "private", the account "John2") or plainly made up.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { EXOS_SHARE, type ExosShareState } from "../../tools/exos-config-explainer/share"; // the spec

/** The page's Example (drawn from the golden vectors): no secret, so the copy is the configuration. */
const EXAMPLE = "# core switch\ncreate vlan engineering tag 100\nconfigure vlan engineering add ports 1:1, 1:2, 1:3 tagged\nconfigure vlan engineering ipaddress 10.1.1.1/24\ncreate vlan voice tag 200\nconfigure vlan voice add ports 2:1 untagged\nenable ipforwarding\nconfigure iproute add default 10.1.1.254\nenable sharing 1:1 grouping 1:1, 1:2 algorithm address-based lacp\ncreate account admin netops\nconfigure ports 1:10 display-string uplink\ndisable ports 1:24"; // verbatim
/** A saved configuration's secrets, in show configuration's own forms. */
const SAVED = [
  "create account admin John2 encrypted \"#$TdxBTPMBQrMdKH1sZhC4tQ==\"", // an account, its hashed password (re-usable, per the reference)
  "configure snmp add community readwrite private", // the default read/write community
  "configure snmp delete community readonly public", // the default read-only community
  "configure snmpv3 add community public name public user v1v2c_ro", // an SNMPv3 community entry (index and name)
  "configure tacacs primary shared-secret purplegreen", // the reference's own example secret
  "create ntp key 1 md5 oklahoma", // the reference's own example key
  "configure vlan engineering ipaddress 10.1.1.1/24", // no secret: stays
].join("\n"); // one per line
/** Its copy. */
const SAVED_COPY = [
  "create account admin John2 encrypted \"[redacted]\"",
  "configure snmp add community readwrite [redacted]",
  "configure snmp delete community readonly [redacted]",
  "configure snmpv3 add community [redacted] name [redacted] user v1v2c_ro",
  "configure tacacs primary shared-secret [redacted]",
  "create ntp key 1 md5 [redacted]",
  "configure vlan engineering ipaddress 10.1.1.1/24",
].join("\n"); // the same lines
/** Routing and fabric keys, with CR LF line ends and a commented-out command. */
const ROUTING = "configure bgp neighbor 10.1.1.2 password encrypted \"#$bgpHash\"\r\nconfigure bgp neighbor 10.1.1.3 password none\r\nconfigure ospf vlan v1 authentication md5 1 md5keyval\r\nconfigure mlag peer p2 authentication md5 key mlagkey\r\n#configure radius primary shared-secret oldsecret\r\n# the password is rotated monthly"; // as copied from a Windows host
/** Its copy: "none" and the prose comment stay. */
const ROUTING_COPY = "configure bgp neighbor 10.1.1.2 password encrypted \"[redacted]\"\r\nconfigure bgp neighbor 10.1.1.3 password none\r\nconfigure ospf vlan v1 authentication md5 1 [redacted]\r\nconfigure mlag peer p2 authentication md5 key [redacted]\r\n#configure radius primary shared-secret [redacted]\r\n# the password is rotated monthly"; // CR LF kept
/** A pregenerated SSH2 host key, pasted as colon-hex after the command (the reference: "2d:2d:2d:2d:20:42:45:47:"). */
const SSH_KEY = "configure ssh2 key pregenerated\n2d:2d:2d:2d:2d:42:45:47:49:4e:20:52:53:41:20:50:52:49:56:41:54:45:20:4b:45:59:2d:2d:2d:2d:2d\n4d:49:49:45:6f:77:49:42:41:41:4b:43:41:51:45:41\nenable ssh2"; // a key's first two lines (made up after its start)

/** The cases. */
export const EXOS_SHARE_CASES = defineShareCases<ExosShareState, ExosShareState>({
  spec: EXOS_SHARE, // the spec
  accept: [
    { id: "example-nothing-to-replace", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the copy is the configuration
    { id: "saved-configuration", state: { input: SAVED }, params: { input: SAVED_COPY }, restored: { input: SAVED_COPY }, mustNotContain: ["TdxBTPMBQrMdKH1sZhC4tQ", "purplegreen", "oklahoma", "readwrite private", "readonly public", "name public"] }, // every secret value goes
    { id: "routing-keys-crlf", state: { input: ROUTING }, params: { input: ROUTING_COPY }, restored: { input: ROUTING_COPY }, mustNotContain: ["bgpHash", "md5keyval", "mlagkey", "oldsecret"] }, // TCP MD5, OSPF, MLAG, a commented-out RADIUS secret
    { id: "ssh2-host-key", state: { input: SSH_KEY }, params: { input: "configure ssh2 key pregenerated\n[redacted]\n[redacted]\nenable ssh2" }, restored: { input: "configure ssh2 key pregenerated\n[redacted]\n[redacted]\nenable ssh2" }, mustNotContain: ["2d:2d:2d:2d:2d:42:45:47", "4d:49:49:45"] }, // the private host key's hex lines go
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // the verb reference: nothing to share
    { id: "white-space", state: { input: "  \n " } }, // the same
  ],
  blocked: [
    { id: "pem-key-in-a-banner", state: { input: "configure banner before-login\n-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQ\n-----END PRIVATE KEY-----" }, code: "secret" }, // a PEM private key (RFC 7468) no command rule names: the site's check finds it
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " \n " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
