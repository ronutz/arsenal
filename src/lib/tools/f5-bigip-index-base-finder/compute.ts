// ============================================================================
// src/lib/tools/f5-bigip-index-base-finder/compute.ts
// ----------------------------------------------------------------------------
// ZERO OR ONE? Where BIG-IP starts counting. Two halves:
//
//   1. A LOOK-UP of every place on a BIG-IP where a position, index, field,
//      level, ID or ordinal starts at 0 or at 1 (or counts from the right, or
//      uses 0 as a value with a meaning): the Tcl 8.4.6 commands iRules run on,
//      the commands F5 adds, configuration objects, platform naming, the APIs,
//      logging and packet capture. Each entry carries what is counted, how to
//      reach the first and the last item, what comes back when nothing is
//      there, an example, its sources with access dates, how sure the
//      statement is, and the places where F5's own pages disagree.
//
//   2. A TRANSLATOR: ask for "the 3rd field" or "the 2nd path segment" the way
//      a person counts, and see the number each command needs, the command
//      written out, and what it returns when run in the Tcl 8.4.6 teaching
//      engine (src/lib/tcl84, differential-tested against tclsh 8.4.6), next to
//      the off-by-one version so the trap is visible.
//
// HOW THE FACTS WERE CHECKED (2026-10-03):
//   - Tcl entries: the Tcl 8.4 manual pages, and every example run in a real
//     tclsh 8.4.6 (built from tag core-8-4-6). F5 K6091 names 8.4.6 as the
//     iRules base, and K36322151 confirms none of these commands is disabled.
//   - F5 entries: the exact wording found on the fetched clouddocs, TechDocs and
//     tmsh reference pages; my.f5.com knowledge articles were read in a browser.
//   - "example" confidence means the base is shown only by an F5 example, and
//     "conflict" means two F5 statements disagree; the entry says which.
//
// Every user-facing sentence lives in the i18n messages (tools.<slug>.entry.*),
// so this module holds only structure, code and literal values.
// ============================================================================

import { runScript } from "@/lib/tcl84/interp";
import { irulesCommands, type Action } from "@/lib/tcl84/irules";
import { formatElement } from "@/lib/tcl84/list";
import { TclError, limitInput } from "@/lib/tcl84/value";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Where counting starts. */
export type Base =
  // The first item is 0.
  | "zero"
  // The first item is 1.
  | "one"
  // Counted from the right-hand end (end, end-1, or "the last N").
  | "right"
  // Both bases meet in the same place (a filter or a name with one of each).
  | "mixed"
  // Not a position: 0 (or 1) is a value with a meaning (default, unlimited, success, equal).
  | "value"
  // Not a position: a count that is easy to mistake for one.
  | "count";

/** The part of the system an entry belongs to. */
export type Area = "tcl" | "irules" | "config" | "platform" | "api" | "logs";

/** How sure the statement is. */
export type Confidence =
  // Stated by the documentation and run in tclsh 8.4.6.
  | "verified"
  // Stated in so many words by the source.
  | "stated"
  // Shown only by an example on the source page.
  | "example"
  // Two statements from F5 disagree (the entry says which).
  | "conflict";

/** A source, with the date it was read. */
export interface Source {
  // Stable id (entries refer to it).
  id: string;
  // What it is.
  label: string;
  // Kind of source, as the D-49 manifests name them.
  type: "reference" | "implementation" | "vendor-docs" | "vendor-kb" | "vendor-community";
  // Where it is.
  url: string;
  // When it was read (ISO date).
  access_date: string;
  // What it was used for.
  scope: string;
}

/** One place where BIG-IP counts. */
export interface Entry {
  // Stable id; also the i18n key (entry.<id>.counts / .rule / .trap / .conflict / .result).
  id: string;
  // Which part of the system.
  area: Area;
  // The command, option or object, exactly as written on the box.
  subject: string;
  // Where counting starts.
  base: Base;
  // How to reach the first item (code), when that applies.
  first?: string;
  // How to reach the last item (code), when that applies.
  last?: string;
  // What comes back when nothing is there (code), when the source says.
  missing?: string;
  // One example: the code, and its result (literal) or resultKey for a described result.
  example: { code: string; result?: string; resultKey?: boolean };
  // Source ids (see SOURCES).
  sources: string[];
  // How sure.
  confidence: Confidence;
  // There is a trap sentence (entry.<id>.trap).
  trap?: boolean;
  // There is a conflict sentence (entry.<id>.conflict).
  conflict?: boolean;
  // Extra search words (command names, field names, terms in English and Portuguese).
  keywords: string[];
}

// ---------------------------------------------------------------------------
// Sources (all read on 2026-10-03; the manifest lists the same objects)
// ---------------------------------------------------------------------------

/** The day every source below was read. */
const READ = "2026-10-03";

/** Tcl 8.4 manual page URL. */
const TCL = (n: string) => `https://www.tcl-lang.org/man/tcl8.4/TclCmd/${n}.htm`;

/** F5 iRules reference page URL ("::" written as "__"). */
const API = (n: string) => `https://clouddocs.f5.com/api/irules/${n}.html`;

/** F5 tmsh reference page URL. */
const TMSH = (p: string) => `https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/${p}.html`;

/** F5 knowledge article URL. */
const KB = (k: string) => `https://my.f5.com/manage/s/article/${k}`;

/** Build a source record. */
const src = (id: string, label: string, type: Source["type"], url: string, scope: string): Source => ({ id, label, type, url, access_date: READ, scope });

/** Every source, in the order the manifest lists them. */
export const SOURCES: Source[] = [
  // F5's statement of the Tcl version, and the disabled-command list.
  src("k6091", "F5 K6091: The version of Tcl used to develop iRules", "vendor-kb", KB("K6091"), "the iRules command set was developed from Tcl base version 8.4.6, which is used in all BIG-IP versions"),
  src("k36322151", "F5 K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)", "vendor-kb", KB("K36322151"), "the disabled commands (file, exec, socket, namespace, rename, time and others); every Tcl command in this tool is available"),
  // The Tcl 8.4 manual pages.
  src("tcl84-string", "Tcl 8.4 manual: string", "reference", TCL("string"), "string index, range, first, last, compare, replace, wordstart, wordend and is -failindex: a charIndex of 0 is the first character; end and end-N; -1 when not found; out-of-range index returns an empty string"),
  src("tcl84-lindex", "Tcl 8.4 manual: lindex", "reference", TCL("lindex"), "0 refers to the first element; a negative or too large index returns an empty string; end and end-N"),
  src("tcl84-lrange", "Tcl 8.4 manual: lrange", "reference", TCL("lrange"), "elements first through last, inclusive; lrange {a b c d e} 0 1 selects the first two"),
  src("tcl84-lsearch", "Tcl 8.4 manual: lsearch", "reference", TCL("lsearch"), "returns the index of the first matching element, or -1; -start"),
  src("tcl84-linsert", "Tcl 8.4 manual: linsert", "reference", TCL("linsert"), "index 0 or less inserts at the beginning; end or a larger index appends; end-integer counts back from the last element"),
  src("tcl84-lreplace", "Tcl 8.4 manual: lreplace", "reference", TCL("lreplace"), "first and last are list indexes with the same forms as lindex"),
  src("tcl84-lset", "Tcl 8.4 manual: lset", "reference", TCL("lset"), "replaces the element at an index (Tcl 8.4 and later)"),
  src("tcl84-lsort", "Tcl 8.4 manual: lsort", "reference", TCL("lsort"), "-index extracts the index'th element of each sublist; end and end-index are allowed"),
  src("tcl84-split", "Tcl 8.4 manual: split", "reference", TCL("split"), "empty elements when the first or last character of the string is a separator, or two separators are adjacent"),
  src("tcl84-regexp", "Tcl 8.4 manual: regexp", "reference", TCL("regexp"), "-indices gives the indexes of the first and last characters; -1 -1 for a subexpression that took no part; -start; sub-match variables follow the parentheses left to right"),
  src("tcl84-regsub", "Tcl 8.4 manual: regsub", "reference", TCL("regsub"), "& or \\0 is the whole match; \\n, where n is a digit between 1 and 9, is the n-th parenthesized subexpression"),
  src("tcl84-format", "Tcl 8.4 manual: format", "reference", TCL("format"), "XPG3 position specifiers: 1 corresponds to the first argument"),
  src("tcl84-scan", "Tcl 8.4 manual: scan", "reference", TCL("scan"), "XPG3 position specifiers (1 corresponds to the first varName) and the %n conversion"),
  src("tcl84-clock", "Tcl 8.4 manual: clock", "reference", TCL("clock"), "%w Sunday = 0; %u Monday = 1; %U and %W weeks 00 - 52; %V ISO-8601 week; %j 001 - 366; %m 01 - 12; %d 01 - 31; %H 00 - 23; %I 01 - 12"),
  src("tcl84-binary", "Tcl 8.4 manual: binary", "reference", TCL("binary"), "@ moves to an absolute location; position 0 refers to the first byte"),
  src("tcl84-info", "Tcl 8.4 manual: info", "reference", TCL("info"), "info level: 1 refers to the top-most active procedure; 0 to the current level"),
  src("tcl84-uplevel", "Tcl 8.4 manual: uplevel", "reference", TCL("uplevel"), "# followed by a number is an absolute level; a plain number is relative; the default is 1"),
  src("tcl84-upvar", "Tcl 8.4 manual: upvar", "reference", TCL("upvar"), "level takes the forms uplevel accepts and defaults to 1"),
  src("tcl84-expr", "Tcl 8.4 manual: expr", "reference", TCL("expr"), "rand() returns a pseudo-random floating-point value in the range (0,1)"),
  src("tcl84-if", "Tcl 8.4 manual: if", "reference", TCL("if"), "the condition must be a boolean: a numeric value, where 0 is false and anything else is true, or a string such as true or yes, false or no"),
  src("tcl84-getboolean", "Tcl 8.4 manual: Tcl_GetBoolean", "reference", "https://www.tcl-lang.org/man/tcl8.4/TclLib/GetInt.htm", "0, false, no and off are false; 1, true, yes and on are true; any of them may be abbreviated, in any case"),
  src("tcl846-source", "Tcl 8.4.6 source code, tag core-8-4-6 on GitHub", "implementation", "https://github.com/tcltk/tcl/tree/core-8-4-6", "the reference interpreter every Tcl example here was run in (commit bf3eeadc)"),
  // The F5 iRules reference (API pages).
  src("f5-getfield-api", "F5 iRules reference: getfield", "vendor-docs", API("getfield"), "the field_number parameter is 1 indexed"),
  src("f5-findstr-api", "F5 iRules reference: findstr", "vendor-docs", API("findstr"), "skip_count defaults to zero and is counted from the match; F5's examples"),
  src("f5-substr-api", "F5 iRules reference: substr", "vendor-docs", API("substr"), "skip_count is the index of the first character returned, where 0 indicates the first character; the terminator 0 example and its annotation"),
  src("f5-domain", "F5 iRules reference: domain", "vendor-docs", API("domain"), "returns the last count portions of the domain name; examples 1, 2, 5 and 6"),
  src("f5-uri-path", "F5 iRules reference: URI::path", "vendor-docs", API("URI__path"), "start and end depths with start >= 1; the example and its comments"),
  src("f5-http-request-num", "F5 iRules reference: HTTP::request_num", "vendor-docs", API("HTTP__request_num"), "the number of HTTP transactions on the connection, including the current transaction"),
  src("f5-http2-requests", "F5 iRules reference: HTTP2::requests", "vendor-docs", API("HTTP2__requests"), "the count of requests in the HTTP/2 session, including the current one; 0 when HTTP/2 is not active"),
  src("f5-http-header", "F5 iRules reference: HTTP::header", "vendor-docs", API("HTTP__header"), "at returns the header name at a zero-based index; value operates on the last of repeated headers"),
  src("f5-sip-header", "F5 iRules reference: SIP::header", "vendor-docs", API("SIP__header"), "if index is not provided, the first match is returned"),
  src("f5-http-payload", "F5 iRules reference: HTTP::payload", "vendor-docs", API("HTTP__payload"), "to replace the entire payload, the offset should be 0"),
  src("f5-tcp-payload", "F5 iRules reference: TCP::payload", "vendor-docs", API("TCP__payload"), "replace offset and length; examples starting at offset 0"),
  src("f5-udp-payload", "F5 iRules reference: UDP::payload", "vendor-docs", API("UDP__payload"), "replace offset and length; examples starting at offset 0"),
  src("f5-ssl-payload", "F5 iRules reference: SSL::payload", "vendor-docs", API("SSL__payload"), "optional offset and length; the example reads from offset 0"),
  src("f5-tcp-offset", "F5 iRules reference: TCP::offset", "vendor-docs", API("TCP__offset"), "returns the number of bytes currently held in memory via TCP::collect"),
  src("f5-ssl-cert", "F5 iRules reference: SSL::cert", "vendor-docs", API("SSL__cert"), "a value of zero denotes the first certificate in the chain; count; the example comment"),
  src("f5-ssl-extensions", "F5 iRules reference: SSL::extensions", "vendor-docs", API("SSL__extensions"), "the N-th (zero-indexed) extension; the example loop"),
  src("f5-class", "F5 iRules reference: class", "vendor-docs", API("class"), "-index, class element, class search -all -index (0 1 2), 1 or 0 without an option, indexes not guaranteed to stay the same"),
  src("f5-matchclass", "F5 iRules reference: matchclass", "vendor-docs", API("matchclass"), "matchclass index starts at 1 while lindex uses a 0 based index; 0 if no match is found; the example"),
  src("f5-tmm-cmp-unit", "F5 iRules reference: TMM::cmp_unit", "vendor-docs", API("TMM__cmp_unit"), "the number (0-x) of the CPUs executing the rule"),
  src("f5-tmm-cmp-group", "F5 iRules reference: TMM::cmp_group", "vendor-docs", API("TMM__cmp_group"), "the number (0-x) of the group; always 0 on other platforms"),
  src("f5-sip-route", "F5 iRules reference: SIP::route", "vendor-docs", API("SIP__route"), "a numeric zero-based index, or the keyword top"),
  src("f5-sip-via", "F5 iRules reference: SIP::via", "vendor-docs", API("SIP__via"), "the first Via when no index is given; the example SIP::via 0"),
  src("tmsh-rule-sip-via", "F5 tmsh reference: ltm rule command SIP via", "vendor-docs", TMSH("ltm/ltm_rule_command_SIP_via"), "<index> is a numeric zero-based index (in the page source; a browser hides the placeholder)"),
  src("f5-diameter-avp", "F5 iRules reference: DIAMETER::avp", "vendor-docs", API("DIAMETER__avp"), "the zero-based index; the first AVP when no index is given"),
  src("tmsh-rule-diameter-avp", "F5 tmsh reference: ltm rule command DIAMETER avp", "vendor-docs", TMSH("ltm/ltm_rule_command_DIAMETER_avp"), "no index works exactly the same as index 0; the worked example where index 1 returns mno"),
  src("f5-radius-avp", "F5 iRules reference: RADIUS::avp", "vendor-docs", API("RADIUS__avp"), "the example loops index from 0 and stops at the first empty result"),
  src("f5-message-field", "F5 iRules reference: MESSAGE::field", "vendor-docs", API("MESSAGE__field"), "the value at the 0-based index; an empty string when the field is absent"),
  src("f5-name-response", "F5 iRules reference: NAME::response", "vendor-docs", API("NAME__response"), "valid index values are 0 through 15 inclusive"),
  src("f5-json-array", "F5 iRules reference: JSON::array", "vendor-docs", API("JSON__array"), "insert at an index equal to the size appends; remove slides the values down; introduced in BIG-IP 21.0.0"),
  src("f5-resolv-lookup", "F5 iRules reference: RESOLV::lookup", "vendor-docs", API("RESOLV__lookup"), "multiple values come back as a list; lindex 0 for a single address"),
  src("f5-dnsmsg-record", "F5 iRules reference: DNSMSG::record", "vendor-docs", API("DNSMSG-record"), "the example that names lindex $answer 1 first_rr"),
  src("f5-whereis", "F5 iRules reference: whereis", "vendor-docs", API("whereis"), "returns a list with the continent, country and state in that order; the lindex 0 and 1 example"),
  src("f5-active-members", "F5 iRules reference: active_members", "vendor-docs", API("active_members"), "a Tcl list of lists, each with the IP and port of an active member; no order is stated"),
  src("f5-members", "F5 iRules reference: members", "vendor-docs", API("members"), "counts or lists all members (address and port) of a pool, not just active ones"),
  src("f5-table", "F5 iRules reference: table", "vendor-docs", API("table"), "incr: a missing key starts at 0, the default delta is 1, and the value after the increment is returned"),
  src("f5-stats-incr", "F5 iRules reference: STATS::incr", "vendor-docs", API("STATS__incr"), "fields are numbered from 1 to 32, but you must provide the name"),
  src("f5-priority", "F5 iRules reference: priority", "vendor-docs", API("priority"), "0 to 1000 inclusive, default 500, lower runs first; the sentence that says between 1 and 1000"),
  src("f5-mr-message", "F5 iRules reference: MR::message", "vendor-docs", API("MR__message"), "clone IDs count from (clone_count_before + 1); the clone_count wording"),
  src("f5-mr-connection-instance", "F5 iRules reference: MR::connection_instance", "vendor-docs", API("MR__connection_instance"), "incoming connections return 0 of 1"),
  src("f5-ssl-verify-result", "F5 iRules reference: SSL::verify_result", "vendor-docs", API("SSL__verify_result"), "0 is X509_V_OK, the operation was successful"),
  src("f5-lb-server", "F5 iRules reference: LB::server", "vendor-docs", API("LB__server"), "the default priority value of 1 is returned when none is configured; route_domain is null for route domain 0"),
  src("f5-log", "F5 iRules reference: log", "vendor-docs", API("log"), "log entries go to /var/log/ltm; the examples use the local0 facility"),
  // The F5 tmsh reference (configuration).
  src("tmsh-ltm-policy", "F5 tmsh reference: ltm policy", "vendor-docs", TMSH("ltm/ltm_policy"), "ordinal and the numbered conditions and actions; path-segment and unnamed-query-param indexes start at 1, negative values count from the right"),
  src("tmsh-ltm-policy-strategy", "F5 tmsh reference: ltm policy-strategy", "vendor-docs", TMSH("ltm/ltm_policy-strategy"), "the precedence table starts at 1; a lower value is a higher precedence"),
  src("tmsh-ltm-pool", "F5 tmsh reference: ltm pool", "vendor-docs", TMSH("ltm/ltm_pool"), "priority-group 0 through 65535 (default 0), ratio default 1, min-active-members, connection-limit, reselect-tries and queue-depth-limit defaults"),
  src("tmsh-ltm-virtual", "F5 tmsh reference: ltm virtual", "vendor-docs", TMSH("ltm/ltm_virtual"), "a connection limit of 0 allows an unlimited number; destination any:any"),
  src("tmsh-net-route-domain", "F5 tmsh reference: net route-domain", "vendor-docs", TMSH("net/net_route-domain"), "if no route is found, the system searches route domain 0; connection-limit 0 is unlimited"),
  src("tmsh-net-interface", "F5 tmsh reference: net interface", "vendor-docs", TMSH("net/net_interface"), "interface names such as 3.1 (slot 3, port 1) and mgmt"),
  src("tmsh-net-vlan", "F5 tmsh reference: net vlan", "vendor-docs", TMSH("net/net_vlan"), "a tag of 1 through 4094, or 4096"),
  src("tmsh-sys-software-volume", "F5 tmsh reference: sys software volume", "vendor-docs", TMSH("sys/sys_software_volume"), "volume names HDX.Y, CFX.Y and MDX.Y"),
  src("tmsh-sys-cluster", "F5 tmsh reference: sys cluster", "vendor-docs", TMSH("sys/sys_cluster"), "cluster members 1 to 8, identified by the slot number"),
  src("tmsh-vcmp-guest", "F5 tmsh reference: vcmp guest", "vendor-docs", TMSH("vcmp/vcmp_guest"), "slots is a number greater than zero, default 1"),
  src("tmsh-cm-traffic-group", "F5 tmsh reference: cm traffic-group", "vendor-docs", TMSH("cm/cm_traffic-group"), "the unit ID is between 1 and 15"),
  src("tmsh-sys-local-syslog", "F5 tmsh reference: sys log-config destination local-syslog", "vendor-docs", TMSH("sys/sys_log-config_destination_local-syslog"), "default-facility is local0; the options are local0 to local7"),
  src("tmsh-gtm-pool-a", "F5 tmsh reference: gtm pool a", "vendor-docs", TMSH("gtm/gtm_pool_a"), "member-order specifies the order number of the pool member"),
  src("tmsh-gtm-wideip-a", "F5 tmsh reference: gtm wideip a", "vendor-docs", TMSH("gtm/gtm_wideip_a"), "global-availability selects the first pool in the list for as long as it is available"),
  src("tmsh-apm-acl", "F5 tmsh reference: apm acl", "vendor-docs", TMSH("apm/apm_acl"), "the example where acl-order 3 is the third ACL in the list"),
  // F5 TechDocs manuals.
  src("td-route-domains", "F5 TechDocs: TMOS Routing Administration 14.0, Route Domains", "vendor-docs", "https://techdocs.f5.com/kb/en-us/products/big-ip_ltm/manuals/product/big-ip-tmos-routing-administration-14-0-0/09.html", "the default route domain has an ID of 0; the A.B.C.D%ID notation"),
  src("td-interface-naming", "F5 TechDocs: Interface naming conventions (TMOS Routing Administration)", "vendor-docs", "https://techdocs.f5.com/en-us/bigip-14-1-0/big-ip-tmos-routing-administration-14-1-0/interfaces/interface-properties/interface-naming-conventions.html", "<s>.<p> names such as 1.1, 1.2 and 2.1; the management interface"),
  src("td-vlans", "F5 TechDocs: VLANs, VLAN Groups, and VXLAN (TMOS Routing Administration)", "vendor-docs", "https://techdocs.f5.com/en-us/bigip-14-1-0/big-ip-tmos-routing-administration-14-1-0/vlans-vlan-groups-and-vxlan.html", "a VLAN tag can be between 1 and 4094"),
  src("td-viprion-2400", "F5 TechDocs: Platform Guide: VIPRION 2400 Series", "vendor-docs", "https://techdocs.f5.com/kb/en-us/products/big-ip_ltm/manuals/product/pg_viprion2400/1.html", "interface 1/1.2 is slot 1, interface 1.2"),
  src("td-ltm-pools", "F5 TechDocs: About Pools (Local Traffic Management Basics)", "vendor-docs", "https://techdocs.f5.com/en-us/bigip-21-1-0/big-ip-local-traffic-management-basics/about-pools.html", "higher priority groups get traffic first; priority group 0 is the lowest; 0 disables priority group activation"),
  src("td-ltm-virtuals", "F5 TechDocs: About Virtual Servers (Local Traffic Management Basics)", "vendor-docs", "https://techdocs.f5.com/en-us/bigip-21-1-0/big-ip-local-traffic-management-basics/about-virtual-servers.html", "a wildcard virtual server uses port 0 and handles traffic for all services"),
  src("td-disk-management", "F5 TechDocs: Disk Management (BIG-IP System Essentials 15.1)", "vendor-docs", "https://techdocs.f5.com/en-us/bigip-15-1-0/big-ip-system-essentials/disk-management.html", "volumes named MD1.1, MD1.2, MD1.3 and HD1.1, HD1.2"),
  src("td-dsc-traffic-groups", "F5 TechDocs: Device Service Clustering Administration 13.1, Managing Failover", "vendor-docs", "https://techdocs.f5.com/kb/en-us/products/big-ip_ltm/manuals/product/bigip-system-device-service-clustering-administration-13-1-0/6.html", "the two pre-configured traffic groups, traffic-group-1 and traffic-group-local-only"),
  // F5 knowledge articles (read in a browser).
  src("k411", "F5 K411: Overview of packet tracing with the tcpdump utility", "vendor-kb", KB("K411"), "tcpdump -i 0.0 views the traffic on all TMM interfaces, not the management interface; not rate-limited"),
  src("k11094", "F5 K11094: Clearing the LCD and the Alarm LED remotely", "vendor-kb", KB("K11094"), "slot values 0 to 8; on a VIPRION platform the slot ID is counted from 1"),
  src("k14358", "F5 K14358: Overview of Clustered Multiprocessing (11.3.0 and later)", "vendor-kb", KB("K14358"), "Sys::TMM: 0.0 to 0.7, tmm.0 --tmid 0, TMM0"),
  src("k15003", "F5 K15003: Data and control plane tasks use separate logical cores (Hyper-Threading)", "vendor-kb", KB("K15003"), "with HTSplit, TMMs have only even-numbered IDs; the 10th TMM has the ID of 18"),
  src("k16197", "F5 K16197: Reviewing BIG-IP log files", "vendor-kb", KB("K16197"), "the severity level digit, with 0 being the highest severity level"),
  src("k15934495", "F5 K15934495: Configuring the level of information that syslog-ng sends to log files (12.x - 17.x)", "vendor-kb", KB("K15934495"), "the local0 to local7 facility table; local0 is BIG-IP specific messages in /var/log/ltm"),
  src("k33749970", "F5 K33749970: Managing local traffic policies on the BIG-IP system using tmsh (12.1.0 and later)", "vendor-kb", KB("K33749970"), "the example policy with conditions add { 0 { ... } } and actions add { 0 { ... } }"),
  src("k13637", "F5 K13637: Capturing internal TMM information with tcpdump", "vendor-kb", KB("K13637"), "the Slot and TMM trailer fields; the filter for TMM0 on Slot1; Ingress 0 means TMM is sending"),
  // APIs, schemas and other F5 pages.
  src("rest-ltm-policy-rules", "F5 iControl REST API reference: tm/ltm/policy/rules", "vendor-docs", "https://clouddocs.f5.com/api/icontrol-rest/APIRef_tm_ltm_policy_rules.html", "ordinal is described as a positive integer"),
  src("soap-log-sysloglevel", "F5 iControl SOAP reference: Log::SyslogLevel", "vendor-docs", "https://clouddocs.f5.com/api/icontrol-soap/Log__SyslogLevel.html", "LOG_LEVEL_UNKNOWN 0, LOG_LEVEL_EMERG 1 to LOG_LEVEL_DEBUG 8"),
  src("soap-asm-severityname", "F5 iControl SOAP reference: ASM::SeverityName", "vendor-docs", "https://clouddocs.f5.com/api/icontrol-soap/ASM__SeverityName.html", "SEVERITY_LOG_EMERG 0 to SEVERITY_LOG_DEBUG 7"),
  src("as3-schema", "F5 BIG-IP AS3 3.57.0 schema reference", "vendor-docs", "https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/refguide/schema-reference.html", "priorityGroup default 0, ratio default 1 [0, 100], connectionLimit 0, memberOrder default 0, defaultRouteDomain 0"),
  src("bug-547581", "F5 Bug ID 547581 (iControl REST paging)", "vendor-docs", "https://cdn.f5.com/product/bugtracker/ID547581.html", "the first 100 objects with $skip=0&$top=100"),
  src("dc-icontrol-rest-part3", "F5 DevCentral: Demystifying iControl REST Part 3, query parameters and tmsh options", "vendor-community", "https://community.f5.com/t/demystifying-icontrol-rest-part-3-how-to-pass-query-parameters-and-tmsh-options/68038", "$skip behaves as 0 when omitted; the example response with pageIndex 1 and startIndex 1"),
  src("dc-ltm-policy-strategies", "F5 DevCentral: LTM Policy, Matching Strategies", "vendor-community", "https://community.f5.com/t/ltm-policy-matching-strategies/64116", "the lower ordinal wins; ordinal 0 is the default and not shown"),
  src("dc-irules-style-guide", "F5 DevCentral: iRules Style Guide (JRahm, from Jim Deucker's notes, 2022)", "vendor-community", "https://community.f5.com/t/irules-style-guide/71151", "always express or store state as 0 or 1; always give an event a priority, and use the default of 500 when there is no other starting point"),
  src("agility-dns-lab", "F5 Agility lab: BIG-IP DNS, wide IPs and pools", "vendor-docs", "https://f5-agility-labs-dns.readthedocs.io/en/latest/_sources/class1/module5/module5.rst.txt", "tmsh create gtm wideip a with pools add { ... { order 0 } }"),
  src("ansible-apm-acl", "F5 Ansible module documentation: bigip_apm_acl", "vendor-docs", "https://clouddocs.f5.com/products/orchestration/ansible/devel/modules/bigip_apm_acl_module.html", "the lower the number, the higher the ACL in the order, with the lowest number 0 being the topmost"),
  src("f5os-rseries-networking", "F5 rSeries training: rSeries Networking", "vendor-docs", "https://clouddocs.f5.com/training/community/rseries-training/html/rseries_networking.html", "interfaces are numbered starting with 1.0"),
  src("f5os-velos-networking", "F5 VELOS training: VELOS Networking", "vendor-docs", "https://clouddocs.f5.com/training/community/velos-training/html/velos_networking.html", "<blade#>/<port#> names: 1/1.0 when bundled, 1/1.1 to 1/1.4 when not"),
];

/** Sources by id. */
const SOURCE_BY_ID = new Map(SOURCES.map((s) => [s.id, s]));

// ---------------------------------------------------------------------------
// The look-up: every entry
// ---------------------------------------------------------------------------

/** The entries, grouped by area in reading order. */
export const ENTRIES: Entry[] = [
  // ===== Tcl inside iRules (Tcl 8.4.6; every example run in tclsh 8.4.6) =====
  // string index: 0 is the first character.
  { id: "tcl-string-index", area: "tcl", subject: "string index", base: "zero", first: "0", last: "end", missing: '""', example: { code: "string index abcd end-1", result: "c" }, sources: ["tcl84-string", "k36322151"], confidence: "verified", keywords: ["character", "char", "caractere", "posição"] },
  // string range: both ends inclusive.
  { id: "tcl-string-range", area: "tcl", subject: "string range", base: "zero", first: "0", last: "end", missing: '""', example: { code: "string range abcdef 2 3", result: "cd" }, sources: ["tcl84-string"], confidence: "verified", trap: true, keywords: ["substring", "slice", "inclusive", "inclusivo", "trecho"] },
  // string first / last: an index, or -1.
  { id: "tcl-string-first", area: "tcl", subject: "string first, string last", base: "zero", first: "0", missing: "-1", example: { code: "string first q xyz", result: "-1" }, sources: ["tcl84-string"], confidence: "verified", trap: true, keywords: ["search", "find", "busca", "procurar", "not found", "-1", "if"] },
  // string compare: 0 means equal.
  { id: "tcl-string-compare", area: "tcl", subject: "string compare", base: "value", example: { code: "string compare a b", result: "-1" }, sources: ["tcl84-string"], confidence: "verified", trap: true, keywords: ["equal", "igual", "comparison", "comparação", "if"] },
  // True and false: 0 is false and every other number is true, -1 included (the style guide's 0-or-1 rule).
  { id: "tcl-truth", area: "tcl", subject: "true and false in if and expr", base: "value", example: { code: "expr {-1 ? \"taken\" : \"skipped\"}", result: "taken" }, sources: ["tcl84-if", "tcl84-expr", "tcl84-getboolean", "tcl84-string", "dc-irules-style-guide"], confidence: "verified", trap: true, keywords: ["true", "false", "verdadeiro", "falso", "boolean", "booleano", "yes", "no", "on", "off", "state", "estado", "flag", "style guide", "guia de estilo"] },
  // The other string commands that take or return an index.
  { id: "tcl-string-other", area: "tcl", subject: "string replace, wordstart, wordend, is -failindex", base: "zero", first: "0", last: "end", example: { code: "string replace abcdef 1 2 XY", result: "aXYdef" }, sources: ["tcl84-string"], confidence: "verified", keywords: ["replace", "word", "palavra", "failindex"] },
  // end and end-N.
  { id: "tcl-end-keyword", area: "tcl", subject: "end, end-N", base: "right", last: "end", example: { code: "lindex {a b c} end-1", result: "b" }, sources: ["tcl84-string", "tcl84-lindex", "tcl84-linsert"], confidence: "verified", trap: true, keywords: ["end", "last", "último", "fim"] },
  // lindex: 0 is the first element.
  { id: "tcl-lindex", area: "tcl", subject: "lindex", base: "zero", first: "0", last: "end", missing: '""', example: { code: "lindex {a b c} 0", result: "a" }, sources: ["tcl84-lindex"], confidence: "verified", keywords: ["list", "lista", "element", "elemento"] },
  // lrange: inclusive.
  { id: "tcl-lrange", area: "tcl", subject: "lrange", base: "zero", first: "0", last: "end", missing: '""', example: { code: "lrange {a b c d e} 0 1", result: "a b" }, sources: ["tcl84-lrange"], confidence: "verified", keywords: ["list", "lista", "range", "inclusive"] },
  // lsearch: index or -1.
  { id: "tcl-lsearch", area: "tcl", subject: "lsearch", base: "zero", first: "0", missing: "-1", example: { code: "lsearch {a b c} z", result: "-1" }, sources: ["tcl84-lsearch"], confidence: "verified", trap: true, keywords: ["list", "lista", "search", "busca", "-start"] },
  // linsert, lreplace, lset.
  { id: "tcl-list-edit", area: "tcl", subject: "linsert, lreplace, lset", base: "zero", first: "0", last: "end", example: { code: "linsert {a b c} 0 X", result: "X a b c" }, sources: ["tcl84-linsert", "tcl84-lreplace", "tcl84-lset"], confidence: "verified", keywords: ["insert", "inserir", "replace", "substituir"] },
  // lsort -index.
  { id: "tcl-lsort-index", area: "tcl", subject: "lsort -index", base: "zero", first: "0", last: "end", example: { code: "lsort -index 1 {{a 2} {b 1}}", result: "{b 1} {a 2}" }, sources: ["tcl84-lsort"], confidence: "verified", keywords: ["sort", "ordenar", "sublist", "sublista"] },
  // split + lindex: the empty element before a leading separator.
  { id: "tcl-split", area: "tcl", subject: "split, then lindex", base: "zero", first: "0", missing: '""', example: { code: "lindex [split /api/v2/users /] 1", result: "api" }, sources: ["tcl84-split", "tcl84-lindex"], confidence: "verified", trap: true, keywords: ["path", "caminho", "segment", "segmento", "uri", "separator", "separador"] },
  // regexp -indices and -start.
  { id: "tcl-regexp-indices", area: "tcl", subject: "regexp -indices, -start", base: "zero", first: "0", missing: "-1 -1", example: { code: "regexp -indices {(b+)} abbbc m; set m", result: "1 3" }, sources: ["tcl84-regexp"], confidence: "verified", keywords: ["regex", "regular expression", "expressão regular", "match"] },
  // Capture groups: 1 is the first parenthesis.
  { id: "tcl-regexp-groups", area: "tcl", subject: "regexp sub-matches, regsub \\1 to \\9", base: "one", first: "\\1", example: { code: "regsub {(a)(b)} ab {\\2\\1}", result: "ba" }, sources: ["tcl84-regexp", "tcl84-regsub"], confidence: "verified", trap: true, keywords: ["regex", "group", "grupo", "capture", "captura", "backreference"] },
  // format / scan positional specifiers.
  { id: "tcl-positional", area: "tcl", subject: "format and scan %n$", base: "one", first: "%1$", example: { code: "format {%2$s %1$s} a b", result: "b a" }, sources: ["tcl84-format", "tcl84-scan"], confidence: "verified", keywords: ["format", "scan", "positional", "posicional", "XPG3"] },
  // scan %n: a count, which is also where the rest starts.
  { id: "tcl-scan-count", area: "tcl", subject: "scan %n", base: "count", example: { code: "scan \"ab cd\" {%s%n} w n; set n", result: "2" }, sources: ["tcl84-scan", "tcl846-source"], confidence: "verified", trap: true, keywords: ["scan", "%n", "bytes", "consumed", "consumido"] },
  // clock fields that start at 0.
  { id: "tcl-clock-zero", area: "tcl", subject: "clock format %w %H %M %S %U %W", base: "zero", first: "0 / 00", example: { code: "clock format 0 -format {%w %H %U %W} -gmt 1", result: "4 00 00 00" }, sources: ["tcl84-clock"], confidence: "verified", keywords: ["clock", "date", "data", "weekday", "dia da semana", "week", "semana", "hour", "hora"] },
  // clock fields that start at 1.
  { id: "tcl-clock-one", area: "tcl", subject: "clock format %u %d %e %j %m %V %I", base: "one", first: "1 / 01 / 001", example: { code: "clock format 0 -format {%u %d %j %m %V} -gmt 1", result: "4 01 001 01 01" }, sources: ["tcl84-clock"], confidence: "verified", trap: true, keywords: ["clock", "date", "data", "month", "mês", "day", "dia", "week", "semana", "ISO"] },
  // binary scan @.
  { id: "tcl-binary-at", area: "tcl", subject: "binary scan @", base: "zero", first: "@0", example: { code: "binary scan ABC @1a1 x; set x", result: "B" }, sources: ["tcl84-binary"], confidence: "verified", keywords: ["binary", "binário", "byte", "offset"] },
  // info level, uplevel.
  { id: "tcl-levels", area: "tcl", subject: "info level, uplevel, upvar", base: "zero", first: "#0", example: { code: "proc lv {} { info level }; lv", result: "1" }, sources: ["tcl84-info", "tcl84-uplevel", "tcl84-upvar"], confidence: "verified", keywords: ["proc", "level", "nível", "stack", "pilha", "global"] },
  // rand(): an index from 0.
  { id: "tcl-rand", area: "tcl", subject: "expr {int(rand()*N)}", base: "zero", first: "0", last: "N-1", example: { code: "expr {int(rand()*3)}", result: "0, 1, 2" }, sources: ["tcl84-expr"], confidence: "verified", keywords: ["random", "aleatório", "rand"] },

  // ===== Commands F5 adds to iRules =====
  // getfield: 1-based fields.
  { id: "f5-getfield", area: "irules", subject: "getfield", base: "one", first: "1", example: { code: 'getfield "www.example.com:8080" ":" 1', result: "www.example.com" }, sources: ["f5-getfield-api"], confidence: "stated", trap: true, keywords: ["field", "campo", "split", "separator", "separador", "path", "host"] },
  // substr: 0-based skip.
  { id: "f5-substr", area: "irules", subject: "substr", base: "zero", first: "0", example: { code: 'substr "abcdefghijklm" 2 4', result: "cdef" }, sources: ["f5-substr-api"], confidence: "conflict", conflict: true, keywords: ["substring", "skip", "terminator", "terminador"] },
  // findstr: skip counted from the match.
  { id: "f5-findstr", area: "irules", subject: "findstr", base: "zero", first: "0", example: { code: 'findstr "aaa123456xxyz" "aaa" 3 "xyz"', result: "123456x" }, sources: ["f5-findstr-api"], confidence: "stated", trap: true, keywords: ["find", "skip", "terminator", "terminador", "query"] },
  // domain: counted from the right.
  { id: "f5-domain", area: "irules", subject: "domain", base: "right", last: "1", example: { code: "domain www.sub.my.domain.com 2", result: "domain.com" }, sources: ["f5-domain"], confidence: "stated", trap: true, keywords: ["host", "hostname", "label", "rótulo", "tld", "dns"] },
  // URI::path: depth from 1.
  { id: "f5-uri-path", area: "irules", subject: "URI::path", base: "one", first: "1", example: { code: 'URI::path "/path/to/file.ext?param=value" 2', result: "/to/" }, sources: ["f5-uri-path"], confidence: "conflict", conflict: true, keywords: ["path", "caminho", "depth", "profundidade", "directory", "diretório", "uri"] },
  // HTTP::request_num: the first request is 1.
  { id: "f5-request-num", area: "irules", subject: "HTTP::request_num, HTTP2::requests", base: "one", first: "1", example: { code: "HTTP::request_num", result: "1" }, sources: ["f5-http-request-num", "f5-http2-requests"], confidence: "stated", keywords: ["request", "requisição", "keep-alive", "http2", "counter", "contador"] },
  // HTTP::header at: 0-based; value takes the LAST.
  { id: "f5-http-header", area: "irules", subject: "HTTP::header at, HTTP::header value", base: "zero", first: "0", missing: '""', example: { code: "HTTP::header value header_1", result: "value_3" }, sources: ["f5-http-header", "f5-sip-header"], confidence: "stated", trap: true, keywords: ["header", "cabeçalho", "repeated", "repetido", "last", "último", "sip"] },
  // Payload offsets.
  { id: "f5-payload", area: "irules", subject: "HTTP::payload, TCP::payload, UDP::payload, SSL::payload", base: "zero", first: "0", example: { code: 'TCP::payload replace 0 [TCP::payload length] ""', resultKey: true }, sources: ["f5-http-payload", "f5-tcp-payload", "f5-udp-payload", "f5-ssl-payload"], confidence: "stated", keywords: ["payload", "offset", "byte", "collect"] },
  // TCP::offset: a count.
  { id: "f5-tcp-offset", area: "irules", subject: "TCP::offset", base: "count", example: { code: "TCP::offset", resultKey: true }, sources: ["f5-tcp-offset"], confidence: "stated", trap: true, keywords: ["offset", "collect", "bytes", "count", "contagem"] },
  // SSL::cert: 0 is the first certificate.
  { id: "f5-ssl-cert", area: "irules", subject: "SSL::cert, SSL::cert issuer", base: "zero", first: "0", last: "[SSL::cert count] - 1", example: { code: "SSL::cert 0", resultKey: true }, sources: ["f5-ssl-cert"], confidence: "conflict", conflict: true, keywords: ["certificate", "certificado", "chain", "cadeia", "x509", "client", "cliente"] },
  // SSL::extensions -index.
  { id: "f5-ssl-extensions", area: "irules", subject: "SSL::extensions -index", base: "zero", first: "0", last: "[SSL::extensions count] - 1", example: { code: "SSL::extensions -index 0", resultKey: true }, sources: ["f5-ssl-extensions"], confidence: "stated", trap: true, keywords: ["tls", "extension", "extensão", "clienthello"] },
  // class element and -index.
  { id: "f5-class-index", area: "irules", subject: "class element, class match/search -index", base: "zero", first: "0", example: { code: 'class search -all -index string_dg starts_with "abc"', result: "0 1 2" }, sources: ["f5-class"], confidence: "conflict", trap: true, conflict: true, keywords: ["data group", "datagroup", "class", "index", "índice"] },
  // matchclass: 1-based, 0 = no match.
  { id: "f5-matchclass", area: "irules", subject: "matchclass (legacy)", base: "one", first: "1", missing: "0", example: { code: "lindex $::color [expr {$idx - 1}]", resultKey: true }, sources: ["f5-matchclass"], confidence: "conflict", conflict: true, keywords: ["data group", "datagroup", "class", "legacy", "legado"] },
  // TMM::cmp_unit / cmp_group.
  { id: "f5-tmm-cmp", area: "irules", subject: "TMM::cmp_unit, TMM::cmp_group", base: "zero", first: "0", last: "[TMM::cmp_count] - 1", example: { code: "TMM::cmp_unit", resultKey: true }, sources: ["f5-tmm-cmp-unit", "f5-tmm-cmp-group"], confidence: "stated", keywords: ["tmm", "cmp", "cpu", "core", "núcleo"] },
  // SIP indexes.
  { id: "f5-sip-index", area: "irules", subject: "SIP::route, SIP::record-route, SIP::via", base: "zero", first: "0", example: { code: "SIP::via 0", resultKey: true }, sources: ["f5-sip-route", "f5-sip-via", "tmsh-rule-sip-via"], confidence: "stated", keywords: ["sip", "via", "route", "top"] },
  // DIAMETER::avp index.
  { id: "f5-diameter-avp", area: "irules", subject: "DIAMETER::avp ... index", base: "zero", first: "0", example: { code: "DIAMETER::avp data get 8 octetstring index 1 vendor-id 3375", result: "mno" }, sources: ["f5-diameter-avp", "tmsh-rule-diameter-avp"], confidence: "stated", keywords: ["diameter", "avp"] },
  // RADIUS::avp index.
  { id: "f5-radius-avp", area: "irules", subject: "RADIUS::avp ... index", base: "zero", first: "0", missing: '""', example: { code: 'RADIUS::avp 26 "string" index 0 vendor-id 10415 vendor-type 13', resultKey: true }, sources: ["f5-radius-avp"], confidence: "example", keywords: ["radius", "avp", "vsa"] },
  // MESSAGE::field value index.
  { id: "f5-message-field", area: "irules", subject: "MESSAGE::field value", base: "zero", first: "0", missing: '""', example: { code: "MESSAGE::field value Via 0", resultKey: true }, sources: ["f5-message-field"], confidence: "stated", keywords: ["message", "mensagem", "field", "campo", "sip", "mqtt"] },
  // NAME::response address.
  { id: "f5-name-response", area: "irules", subject: "NAME::response address", base: "zero", first: "0", last: "15", missing: "null", example: { code: "NAME::response address 0", resultKey: true }, sources: ["f5-name-response"], confidence: "stated", keywords: ["dns", "lookup", "address", "endereço"] },
  // JSON::array.
  { id: "f5-json-array", area: "irules", subject: "JSON::array (BIG-IP 21.0)", base: "zero", first: "0", last: "[JSON::array size $ary] - 1", example: { code: "JSON::array get $ary 0", resultKey: true }, sources: ["f5-json-array"], confidence: "example", keywords: ["json", "array", "vetor"] },
  // RESOLV::lookup and DNSMSG::section lists.
  { id: "f5-dns-lists", area: "irules", subject: "RESOLV::lookup, DNSMSG::section", base: "zero", first: "0", last: "end", missing: '""', example: { code: "lindex [RESOLV::lookup $hostname] 0", resultKey: true }, sources: ["f5-resolv-lookup", "f5-dnsmsg-record"], confidence: "conflict", conflict: true, keywords: ["dns", "resolver", "lookup", "answer", "resposta"] },
  // whereis list positions.
  { id: "f5-whereis", area: "irules", subject: "whereis", base: "zero", first: "0", example: { code: "lindex [whereis [IP::client_addr]] 1", resultKey: true }, sources: ["f5-whereis"], confidence: "example", keywords: ["geolocation", "geolocalização", "country", "país", "continent", "continente"] },
  // active_members -list.
  { id: "f5-member-lists", area: "irules", subject: "active_members -list, members -list", base: "zero", first: "0", example: { code: "lindex [active_members -list my_pool] 0", result: "192.168.1.1 80" }, sources: ["f5-active-members", "f5-members"], confidence: "example", trap: true, keywords: ["pool", "member", "membro", "order", "ordem"] },
  // table incr: the first call returns 1.
  { id: "f5-table-incr", area: "irules", subject: "table incr", base: "one", first: "1", example: { code: "table incr hits", result: "1" }, sources: ["f5-table"], confidence: "stated", keywords: ["table", "tabela", "counter", "contador", "session"] },
  // STATS fields 1 to 32.
  { id: "f5-stats-fields", area: "irules", subject: "STATS::incr fields", base: "one", first: "1", last: "32", example: { code: "STATS::incr my_stats hits", resultKey: true }, sources: ["f5-stats-incr"], confidence: "stated", keywords: ["stats", "statistics", "estatísticas", "profile", "perfil"] },
  // Event priority 0 to 1000.
  { id: "f5-priority", area: "irules", subject: "when ... priority", base: "zero", first: "0", last: "1000", example: { code: "when HTTP_REQUEST priority 0 { ... }", resultKey: true }, sources: ["f5-priority", "dc-irules-style-guide"], confidence: "conflict", conflict: true, keywords: ["event", "evento", "priority", "prioridade", "order", "ordem", "500"] },
  // MR clone IDs from 1.
  { id: "f5-mr-clone-id", area: "irules", subject: "MR::message clone IDs", base: "one", first: "clone_count_before + 1", example: { code: "MR::message clone -count 2", resultKey: true }, sources: ["f5-mr-message"], confidence: "conflict", conflict: true, keywords: ["message routing", "mrf", "clone"] },
  // MR::connection_instance from 0.
  { id: "f5-mr-instance", area: "irules", subject: "MR::connection_instance", base: "zero", first: "0", example: { code: "MR::connection_instance", result: "0 of 1" }, sources: ["f5-mr-connection-instance"], confidence: "example", keywords: ["message routing", "mrf", "connection", "conexão"] },
  // SSL::verify_result: 0 is success.
  { id: "f5-ssl-verify-result", area: "irules", subject: "SSL::verify_result", base: "value", example: { code: "SSL::verify_result", result: "0" }, sources: ["f5-ssl-verify-result"], confidence: "stated", trap: true, keywords: ["certificate", "certificado", "verify", "verificação", "X509_V_OK"] },
  // LB::server priority 1 and route domain 0.
  { id: "f5-lb-server", area: "irules", subject: "LB::server priority, LB::server route_domain", base: "value", example: { code: "LB::server priority", result: "1" }, sources: ["f5-lb-server", "tmsh-ltm-pool"], confidence: "conflict", conflict: true, keywords: ["priority group", "grupo de prioridade", "route domain", "pool member"] },

  // ===== Configuration objects =====
  // Route domain 0 is the default.
  { id: "cfg-route-domain", area: "config", subject: "route domain ID (%ID)", base: "zero", first: "0", example: { code: "10.10.10.30%2:80", resultKey: true }, sources: ["td-route-domains", "tmsh-net-route-domain", "as3-schema"], confidence: "stated", keywords: ["route domain", "domínio de roteamento", "%", "rd", "vrf"] },
  // Priority group 0 is the lowest.
  { id: "cfg-priority-group", area: "config", subject: "pool member priority-group, min-active-members", base: "zero", first: "0", last: "65535", example: { code: "priority-group 0", resultKey: true }, sources: ["tmsh-ltm-pool", "td-ltm-pools", "as3-schema"], confidence: "stated", trap: true, keywords: ["priority group", "grupo de prioridade", "activation", "ativação", "pool"] },
  // Ratio defaults to 1.
  { id: "cfg-ratio", area: "config", subject: "ratio (pool member, wide IP pool, GTM member)", base: "one", first: "1", example: { code: "ratio 1", resultKey: true }, sources: ["tmsh-ltm-pool", "as3-schema"], confidence: "stated", keywords: ["ratio", "weight", "peso", "load balancing", "balanceamento"] },
  // 0 means no limit.
  { id: "cfg-zero-limits", area: "config", subject: "connection-limit, queue-depth-limit, reselect-tries", base: "value", example: { code: "connection-limit 0", resultKey: true }, sources: ["tmsh-ltm-virtual", "tmsh-ltm-pool", "tmsh-net-route-domain", "td-ltm-pools"], confidence: "stated", keywords: ["limit", "limite", "unlimited", "ilimitado", "connections", "conexões"] },
  // Port 0 = all ports.
  { id: "cfg-port-zero", area: "config", subject: "virtual server port 0 (any)", base: "value", example: { code: "destination 11.11.11.12:any", resultKey: true }, sources: ["td-ltm-virtuals", "tmsh-ltm-virtual"], confidence: "stated", keywords: ["wildcard", "curinga", "port", "porta", "any", "virtual server"] },
  // LTM policy numbering.
  { id: "cfg-policy-numbers", area: "config", subject: "ltm policy rule ordinal, conditions and actions", base: "zero", first: "0", example: { code: "conditions add { 0 { http-host host not values { askf5.com } request } }", resultKey: true }, sources: ["k33749970", "tmsh-ltm-policy", "dc-ltm-policy-strategies", "rest-ltm-policy-rules"], confidence: "conflict", conflict: true, keywords: ["ltm policy", "política", "ordinal", "condition", "condição", "action", "ação"] },
  // LTM policy indexes from 1.
  { id: "cfg-policy-index", area: "config", subject: "ltm policy path-segment index, unnamed-query-param index", base: "one", first: "1", last: "-1", example: { code: "http-referer path-segment index 2 values { to }", resultKey: true }, sources: ["tmsh-ltm-policy"], confidence: "stated", trap: true, keywords: ["ltm policy", "política", "path segment", "segmento", "query", "parameter", "parâmetro"] },
  // Policy strategy precedence from 1.
  { id: "cfg-policy-precedence", area: "config", subject: "ltm policy-strategy precedence ordinal", base: "one", first: "1", example: { code: "1 request tcp port", resultKey: true }, sources: ["tmsh-ltm-policy-strategy"], confidence: "stated", keywords: ["ltm policy", "best-match", "precedence", "precedência", "strategy", "estratégia"] },
  // GTM order and member-order from 0.
  { id: "cfg-gtm-order", area: "config", subject: "GTM wide IP pool order, pool member-order", base: "zero", first: "0", example: { code: "pools add { www.example.com_pool { order 0 } }", resultKey: true }, sources: ["agility-dns-lab", "tmsh-gtm-wideip-a", "tmsh-gtm-pool-a", "as3-schema"], confidence: "example", keywords: ["gtm", "big-ip dns", "wide ip", "global availability", "order", "ordem"] },
  // VLAN tags 1 to 4094.
  { id: "cfg-vlan-tag", area: "config", subject: "VLAN tag", base: "one", first: "1", last: "4094", example: { code: "tag 4094", resultKey: true }, sources: ["tmsh-net-vlan", "td-vlans"], confidence: "stated", keywords: ["vlan", "tag", "802.1q", "4096"] },
  // traffic-group-1, unit IDs 1 to 15.
  { id: "cfg-traffic-group", area: "config", subject: "traffic-group-1, traffic group unit ID", base: "one", first: "1", last: "15", example: { code: "traffic-group-1", resultKey: true }, sources: ["td-dsc-traffic-groups", "tmsh-cm-traffic-group"], confidence: "stated", keywords: ["ha", "failover", "traffic group", "grupo de tráfego", "unit"] },
  // APM acl-order: the two F5 statements disagree.
  { id: "cfg-apm-acl-order", area: "config", subject: "APM acl-order", base: "zero", first: "0", example: { code: "create acl MyACL { acl-order 3 ... }", resultKey: true }, sources: ["tmsh-apm-acl", "ansible-apm-acl"], confidence: "conflict", conflict: true, keywords: ["apm", "acl", "order", "ordem"] },

  // ===== Platform and hardware =====
  // Interfaces from 1.1.
  { id: "plat-interfaces", area: "platform", subject: "interface names (1.1, 1/1.1, mgmt)", base: "one", first: "1.1", example: { code: "create vlan my_vlan interfaces add { 1.2 1.3 1.4 }", resultKey: true }, sources: ["td-interface-naming", "tmsh-net-interface", "td-viprion-2400"], confidence: "example", keywords: ["interface", "port", "porta", "viprion", "mgmt"] },
  // F5OS ports .0.
  { id: "plat-f5os-ports", area: "platform", subject: "F5OS ports (rSeries 1.0, VELOS 1/1.0)", base: "one", first: "1.0", example: { code: "interfaces interface 1.0", resultKey: true }, sources: ["f5os-rseries-networking", "f5os-velos-networking"], confidence: "stated", trap: true, keywords: ["f5os", "rseries", "velos", "port", "porta", "breakout"] },
  // Slots from 1 (VIPRION), 0 on appliances.
  { id: "plat-slots", area: "platform", subject: "VIPRION slots, LCD slot 0, vCMP guest slots", base: "one", first: "1", last: "8", example: { code: "lcdwarn -c 0 0", resultKey: true }, sources: ["k11094", "tmsh-sys-cluster", "tmsh-vcmp-guest"], confidence: "stated", trap: true, keywords: ["viprion", "blade", "slot", "chassis", "vcmp", "lcd"] },
  // Volumes from HD1.1.
  { id: "plat-volumes", area: "platform", subject: "software volumes (HD1.1, MD1.1)", base: "one", first: "HD1.1", example: { code: "reboot volume HD1.1", resultKey: true }, sources: ["tmsh-sys-software-volume", "td-disk-management"], confidence: "example", keywords: ["volume", "boot", "inicialização", "upgrade", "disk", "disco"] },
  // TMM and CPU IDs from 0.
  { id: "plat-tmm-ids", area: "platform", subject: "TMM and CPU IDs (tmm0, Sys::TMM 0.0)", base: "zero", first: "0", example: { code: "tmsh show sys tmm-info | grep Sys::TMM", result: "Sys::TMM: 0.0 ... Sys::TMM: 0.7" }, sources: ["k14358", "k15003"], confidence: "stated", keywords: ["tmm", "cpu", "core", "núcleo", "htsplit", "hyper-threading"] },

  // ===== APIs and declarations =====
  // iControl REST $skip.
  { id: "api-rest-skip", area: "api", subject: "iControl REST $skip, $top", base: "zero", first: "$skip=0", example: { code: "GET /mgmt/tm/ltm/pool?$skip=0&$top=100", resultKey: true }, sources: ["bug-547581", "dc-icontrol-rest-part3"], confidence: "example", keywords: ["icontrol", "rest", "api", "paging", "paginação", "odata"] },
  // iControl REST pageIndex / startIndex.
  { id: "api-rest-page-index", area: "api", subject: "iControl REST pageIndex, startIndex", base: "one", first: "1", example: { code: "GET /mgmt/tm/ltm/pool?$top=2", result: "pageIndex: 1, startIndex: 1" }, sources: ["dc-icontrol-rest-part3"], confidence: "example", trap: true, keywords: ["icontrol", "rest", "api", "paging", "paginação"] },
  // iControl SOAP Log::SyslogLevel shifted by one.
  { id: "api-soap-sysloglevel", area: "api", subject: "iControl SOAP Log::SyslogLevel", base: "one", first: "LOG_LEVEL_EMERG = 1", example: { code: "LOG_LEVEL_EMERG", result: "1" }, sources: ["soap-log-sysloglevel", "soap-asm-severityname"], confidence: "stated", trap: true, keywords: ["soap", "icontrol", "syslog", "severity", "severidade", "level", "nível"] },

  // ===== Logging and packet capture =====
  // Syslog severity 0 = emergency.
  { id: "log-severity", area: "logs", subject: "syslog severity (0 to 7)", base: "zero", first: "0 = emerg", last: "7 = debug", example: { code: "01220001:3:", resultKey: true }, sources: ["k16197", "soap-asm-severityname"], confidence: "stated", trap: true, keywords: ["log", "syslog", "severity", "severidade", "emerg", "debug"] },
  // Facilities local0 to local7.
  { id: "log-facility", area: "logs", subject: "syslog facility local0 to local7", base: "zero", first: "local0", last: "local7", example: { code: 'log local0. "hello"', resultKey: true }, sources: ["k15934495", "tmsh-sys-local-syslog", "f5-log"], confidence: "stated", keywords: ["log", "syslog", "facility", "local0", "/var/log/ltm"] },
  // tcpdump -i 0.0.
  { id: "cap-tcpdump-00", area: "logs", subject: "tcpdump -i 0.0", base: "value", example: { code: "tcpdump -i 0.0", resultKey: true }, sources: ["k411"], confidence: "stated", keywords: ["tcpdump", "capture", "captura", "interface", "0.0"] },
  // The F5 Ethernet trailer: slot from 1, TMM from 0.
  { id: "cap-ethtrailer", area: "logs", subject: "F5 Ethernet trailer: slot and tmm", base: "mixed", example: { code: "f5ethtrailer.slot == 1 and f5ethtrailer.tmm == 0", resultKey: true }, sources: ["k13637"], confidence: "stated", keywords: ["wireshark", "trailer", "noise", ":nnn", "tmm", "slot"] },
];

// ---------------------------------------------------------------------------
// The look-up
// ---------------------------------------------------------------------------

/** What the look-up takes. */
export interface LookupInput {
  // Free text matched against subjects, ids and keywords (case-insensitive).
  query?: string;
  // Only one base, or all.
  base?: Base | "all";
  // Only one area, or all.
  area?: Area | "all";
}

/** What the look-up returns. */
export interface LookupResult {
  // The matching entries, in catalogue order.
  entries: Entry[];
  // How many of the matches have each base.
  counts: Record<Base, number>;
  // How many entries exist in total.
  total: number;
}

/** Every base, in display order. */
export const BASES: Base[] = ["zero", "one", "right", "mixed", "value", "count"];

/** Every area, in display order. */
export const AREAS: Area[] = ["tcl", "irules", "config", "platform", "api", "logs"];

/** Normalize text for matching (lower case, no accents). */
function norm(s: string): string {
  // NFD splits accents off; the combining marks are then removed.
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Filter the catalogue. */
export function lookup(input: LookupInput): LookupResult {
  // The query, bounded.
  limitInput("The search text", input.query ?? "", 200);
  // Normalized for matching.
  const q = norm((input.query ?? "").trim());
  // The words of the query; every word must match somewhere.
  const words = q.split(/\s+/).filter(Boolean);
  // Apply the three filters.
  const entries = ENTRIES.filter((e) => {
    // Base filter.
    if (input.base && input.base !== "all" && e.base !== input.base) return false;
    // Area filter.
    if (input.area && input.area !== "all" && e.area !== input.area) return false;
    // No text: everything that passed.
    if (!words.length) return true;
    // The searchable text of the entry.
    const hay = norm([e.id, e.subject, e.example.code, ...e.keywords].join(" "));
    // Every word must appear.
    return words.every((w) => hay.includes(w));
  });
  // Count the matches per base.
  const counts = Object.fromEntries(BASES.map((b) => [b, entries.filter((e) => e.base === b).length])) as Record<Base, number>;
  // The answer.
  return { entries, counts, total: ENTRIES.length };
}

// ---------------------------------------------------------------------------
// The translator
// ---------------------------------------------------------------------------

/** The questions the translator answers. */
export type Question =
  // The Nth character of a value.
  | "char"
  // The Nth field when the value is split on a separator.
  | "field"
  // The Nth segment of a path.
  | "segment"
  // The last N labels of a host name.
  | "label"
  // The Nth element of a Tcl list.
  | "element"
  // Where a piece of text first appears.
  | "search";

/** Every question, in display order. */
export const QUESTIONS: Question[] = ["char", "field", "segment", "label", "element", "search"];

/** What the translator takes. */
export interface TranslateInput {
  // Which question.
  question: Question;
  // The value to work on (a string, a path, a host name or a Tcl list).
  value: string;
  // N, counted the way people count: 1 is the first (ignored by "search").
  n: number;
  // The separator for "field".
  separator?: string;
  // The text to look for in "search".
  needle?: string;
}

/** A note from the translator or the engine (rendered from the messages). */
export interface Note {
  // The message code.
  code: string;
  // Values for the message.
  params?: Record<string, string | number | boolean>;
}

/** One way of asking the question. */
export interface Row {
  // Which command form (message: form.<form>).
  form: string;
  // How that command counts.
  base: Base;
  // The command as written, with $v standing for the value.
  code: string;
  // What it returned (the error message when it failed).
  result: string;
  // True when Tcl raised an error.
  error: boolean;
  // "right": the command's own numbering; "trap": the same command, off by one; "other": a related answer.
  kind: "right" | "trap" | "other";
  // True when the result equals the answer.
  agrees: boolean;
  // Notes the engine raised (cases F5's pages do not cover).
  notes: Note[];
}

/** What the translator returns. */
export interface TranslateResult {
  // The question asked.
  question: Question;
  // The value.
  value: string;
  // N.
  n: number;
  // The answer (the first "right" row's result), or null when the commands disagree among themselves.
  answer: string | null;
  // The rows, in display order.
  rows: Row[];
  // Notes about the question as a whole.
  notes: Note[];
}

/** The longest value the translator takes. */
const MAX_VALUE = 2000;

/** The largest N the translator takes. */
const MAX_N = 1000;

/** Run one command against the value in the teaching engine (iRules mode). */
function runOne(code: string, value: string): { result: string; error: boolean; notes: Note[] } {
  // Actions are not expected; the table is required by the command set.
  const actions: Action[] = [];
  // The engine, with $v holding the value and the iRules commands available.
  const r = runScript(code, { mode: "irules", maxSteps: 200, vars: { v: value }, commands: irulesCommands({ uri: "/", host: "", method: "GET", headers: {}, clientAddr: "" }, {}, actions) });
  // Undocumented cases noted by the F5 commands.
  const notes = r.events.flatMap((e) => e.notes).filter((n) => n.code.startsWith("undocumented-")).map((n) => ({ code: n.code, params: n.params }));
  // The outcome.
  return { result: r.result, error: r.code === "error", notes };
}

/** One row: run it and record how it went. */
function row(form: string, base: Base, kind: Row["kind"], code: string, value: string): Row {
  // Run.
  const out = runOne(code, value);
  // The row (agreement is decided once the answer is known).
  return { form, base, code, result: out.result, error: out.error, kind, agrees: false, notes: out.notes };
}

/** A separator written as a Tcl word. */
const word = (s: string) => formatElement(s);

/** Answer one question every way iRules can ask it. */
export function translate(input: TranslateInput): TranslateResult {
  // The value, bounded.
  const value = input.value ?? "";
  // Too long is refused with a message.
  limitInput("The value", value, MAX_VALUE);
  // N must be a whole number from 1.
  const n = Math.trunc(Number(input.n));
  // Searches ignore N.
  if (input.question !== "search" && (!Number.isFinite(n) || n < 1 || n > MAX_N)) throw new TclError(`N must be a whole number from 1 to ${MAX_N}`);
  // Notes about the question.
  const notes: Note[] = [];
  // The rows.
  const rows: Row[] = [];
  // By question.
  switch (input.question) {
    // The Nth character.
    case "char": {
      // 0-based index of the Nth character.
      const i = n - 1;
      // Tcl's own commands, then F5's substr, then the off-by-one version.
      rows.push(row("string-index", "zero", "right", `string index $v ${i}`, value));
      rows.push(row("string-range", "zero", "right", `string range $v ${i} ${i}`, value));
      rows.push(row("substr", "zero", "right", `substr $v ${i} 1`, value));
      rows.push(row("string-index-n", "zero", "trap", `string index $v ${n}`, value));
      break;
    }
    // The Nth field.
    case "field": {
      // The separator.
      const sep = input.separator ?? "";
      // Bounded.
      limitInput("The separator", sep, 20);
      // An empty separator does not split.
      if (sep === "") throw new TclError("the separator is empty");
      // F5's getfield (1-based), then split + lindex (0-based), then both off by one.
      rows.push(row("getfield", "one", "right", `getfield $v ${word(sep)} ${n}`, value));
      rows.push(row("split-lindex", "zero", "right", `lindex [split $v ${word(sep)}] ${n - 1}`, value));
      rows.push(row("getfield-n-1", "one", "trap", `getfield $v ${word(sep)} ${n - 1}`, value));
      rows.push(row("split-lindex-n", "zero", "trap", `lindex [split $v ${word(sep)}] ${n}`, value));
      // split treats each character as a separator.
      if ([...sep].length > 1) notes.push({ code: "split-multichar", params: { sep } });
      // A leading separator makes an empty first field.
      if (value.startsWith(sep)) notes.push({ code: "leading-separator", params: { sep } });
      break;
    }
    // The Nth path segment.
    case "segment": {
      // A leading slash puts an empty element (field) before the first segment.
      const lead = value.startsWith("/") ? 1 : 0;
      // split + lindex, then getfield, then the version that forgets the empty element.
      rows.push(row("split-lindex", "zero", "right", `lindex [split $v /] ${n - 1 + lead}`, value));
      rows.push(row("getfield", "one", "right", `getfield $v / ${n + lead}`, value));
      // Only a path with a leading slash has the trap.
      if (lead) rows.push(row("split-lindex-forgot", "zero", "trap", `lindex [split $v /] ${n - 1}`, value));
      // Explain the leading slash, and getfield's undocumented leading separator.
      if (lead) notes.push({ code: "leading-slash" }, { code: "getfield-leading-assumed" });
      // A query string belongs to HTTP::uri, not to the path.
      if (value.includes("?")) notes.push({ code: "query-in-path" });
      break;
    }
    // The last N labels of a host name.
    case "label": {
      // F5's domain (from the right), then the same with Tcl lists, then one label only, then off by one.
      rows.push(row("domain", "right", "right", `domain $v ${n}`, value));
      rows.push(row("lrange-end", "right", "right", `join [lrange [split $v .] end-${n - 1} end] .`, value));
      rows.push(row("lindex-end", "right", "other", `lindex [split $v .] end-${n - 1}`, value));
      rows.push(row("lrange-end-n", "right", "trap", `join [lrange [split $v .] end-${n} end] .`, value));
      break;
    }
    // The Nth element of a Tcl list.
    case "element": {
      // lindex, then lrange (a one-element LIST, a related answer), then off by one.
      rows.push(row("lindex", "zero", "right", `lindex $v ${n - 1}`, value));
      rows.push(row("lrange", "zero", "other", `lrange $v ${n - 1} ${n - 1}`, value));
      rows.push(row("lindex-n", "zero", "trap", `lindex $v ${n}`, value));
      // lrange returns a list: an element with spaces or braces comes back quoted (the lrange manual says so).
      if (rows[1].result !== rows[0].result) notes.push({ code: "lrange-list" });
      break;
    }
    // Where a piece of text first appears.
    case "search": {
      // The text to find.
      const needle = input.needle ?? "";
      // Bounded.
      limitInput("The search text", needle, 200);
      // string first gives the index (or -1).
      rows.push(row("string-first", "zero", "right", `string first ${word(needle)} $v`, value));
      // The right test for "is it there".
      rows.push(row("first-test", "value", "right", `expr {[string first ${word(needle)} $v] >= 0}`, value));
      // The trap: using the index as the condition.
      rows.push(row("first-if", "value", "trap", `if {[string first ${word(needle)} $v]} { set r yes } else { set r no }`, value));
      break;
    }
    // Anything else.
    default:
      throw new TclError("unknown question");
  }
  // The answer: what the first "right" row returned.
  const firstRight = rows.find((r) => r.kind === "right");
  // Searches answer with the index itself; the truth test is checked separately below.
  const answer = firstRight && !firstRight.error ? firstRight.result : null;
  // Mark agreement row by row.
  for (const r of rows) r.agrees = answer !== null && !r.error && r.result === answer;
  // The search's own checks: the >= 0 test is right, the if version follows the index's truth.
  if (input.question === "search" && answer !== null) {
    // Found or not.
    const found = Number(answer) >= 0;
    // The >= 0 test agrees when it says 1 exactly when the text was found.
    rows[1].agrees = rows[1].result === (found ? "1" : "0");
    // The if version says yes exactly when the index is non-zero: found at 0, or not found at all, gives the wrong answer.
    rows[2].agrees = rows[2].result === (found ? "yes" : "no");
    // Say what happened.
    notes.push({ code: found ? (answer === "0" ? "found-at-zero" : "found") : "not-found", params: { index: answer, position: Number(answer) + 1 } });
  }
  // A "right" row that disagrees with the answer gets a note (split on a multi-character separator, an empty field).
  if (answer !== null && rows.some((r) => r.kind === "right" && !r.agrees && input.question !== "search")) notes.push({ code: "right-rows-disagree" });
  // The result.
  return { question: input.question, value, n, answer, rows, notes };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/** What run() takes: a look-up or a translation. */
export type IndexBaseInput = ({ mode: "lookup" } & LookupInput) | ({ mode: "translate" } & TranslateInput);

/** What run() returns. */
export type IndexBaseResult = ({ mode: "lookup" } & LookupResult) | ({ mode: "translate" } & TranslateResult);

/** Run the tool. */
export function run(input: IndexBaseInput): IndexBaseResult {
  // A translation.
  if (input.mode === "translate") return { mode: "translate", ...translate(input) };
  // A look-up (the default).
  return { mode: "lookup", ...lookup(input) };
}

/** The source record for an id (the component shows each entry's sources). */
export function sourceOf(id: string): Source | undefined {
  // From the table.
  return SOURCE_BY_ID.get(id);
}

/** Every source id used by an entry exists, and every source is used (checked by the vectors). */
export function sourceIntegrity(): { missing: string[]; unused: string[] } {
  // Ids used by entries.
  const used = new Set(ENTRIES.flatMap((e) => e.sources));
  // Used but not defined.
  const missing = [...used].filter((id) => !SOURCE_BY_ID.has(id));
  // Defined but never used (the two context sources are cited by the tool as a whole).
  const unused = SOURCES.map((s) => s.id).filter((id) => !used.has(id) && id !== "k6091");
  // Both lists.
  return { missing, unused };
}

