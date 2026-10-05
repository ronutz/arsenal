// ============================================================================
// src/lib/tools/syslog-message-parser/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the syslog message parser
// (set "syslog-message-parser-golden-2026-10-05").
//
// Each vector is one message or frame. The pinned fields are the grammar, the
// framing, the PRI triple, every field (name, value, nil, findings, decoded
// parts), every structured-data element and the message-level findings. The
// first four vectors are RFC 5424 section 6.5's own examples and the sixth is
// RFC 3164 section 5.4's; each must come out as its RFC describes it.
//
// Expected values were captured from compute.run() on 2026-10-05.
// ============================================================================

import { run, type SyslogDecodeResult } from "./compute";

/** The set id: the tool slug and the date the expected values were captured. */
export const GOLDEN_VECTOR_SET_ID = "syslog-message-parser-golden-2026-10-05";

/** The fields a vector pins. */
export type SyslogDecodePinned = ReturnType<typeof pin>;

/** One vector. */
export interface SyslogDecodeVector {
  // A short stable name.
  id: string;
  // The input, exactly as the tool takes it.
  input: { text: string };
  // The pinned fields of the result.
  expect: SyslogDecodePinned;
}

/** Reduce a result to the fields a vector pins. */
export function pin(r: SyslogDecodeResult) {
  // The grammar, the framing, the PRI, the fields, the structured data, the findings, the length.
  return { grammar: r.grammar, framing: [r.framing.kind, r.framing.declared ?? null, r.framing.actual ?? null, r.framing.findings.join("|")], pri: r.pri ? [r.pri.value, r.pri.facility.code, r.pri.severity.code] : null, fields: r.fields.map((f) => [f.name, f.value, f.nil, f.findings.join("|"), f.decoded ? JSON.stringify(f.decoded) : null]), sd: r.structuredData.map((e) => [e.id, e.registry, e.params.map((p) => `${p.name}=${p.value}`).join(";"), e.findings.join("|")]), findings: r.findings.join("|"), length: r.length, truncated: r.truncated };
}

/** The vectors. */
export const VECTORS: SyslogDecodeVector[] = [
  // RFC 5424 section 6.5, Example 1: no structured data, a UTF-8 MSG with the BOM.
  {
    id: "rfc5424-example-1",
    input: {"text":"<34>1 2003-10-11T22:14:15.003Z mymachine.example.com su - ID47 - ﻿'su root' failed for lonvick on /dev/pts/8"},
    expect: {"grammar":"rfc5424","framing":["none",null,null,""],"pri":[34,4,2],"fields":[["PRI","<34>",false,"","{\"facility\":4,\"facilityKeyword\":\"auth\",\"severity\":2,\"severityKeyword\":\"crit\"}"],["VERSION","1",false,"",null],["TIMESTAMP","2003-10-11T22:14:15.003Z",false,"","{\"date\":\"2003-10-11\",\"time\":\"22:14:15.003\",\"offset\":\"Z (UTC)\",\"utc\":true}"],["HOSTNAME","mymachine.example.com",false,"",null],["APP-NAME","su",false,"",null],["PROCID","-",true,"",null],["MSGID","ID47",false,"",null],["STRUCTURED-DATA","-",true,"",null],["MSG","'su root' failed for lonvick on /dev/pts/8",false,"","{\"utf8Bom\":true}"]],"sd":[],"findings":"","length":{"octets":110,"chars":108},"truncated":false},
  },
  // Example 2: an IPv4 HOSTNAME, a PROCID, a fractional offset timestamp, no BOM.
  {
    id: "rfc5424-example-2",
    input: {"text":"<165>1 2003-08-24T05:14:15.000003-07:00 192.0.2.1 myproc 8710 - - %% It's time to make the do-nuts."},
    expect: {"grammar":"rfc5424","framing":["none",null,null,""],"pri":[165,20,5],"fields":[["PRI","<165>",false,"","{\"facility\":20,\"facilityKeyword\":\"local4\",\"severity\":5,\"severityKeyword\":\"notice\"}"],["VERSION","1",false,"",null],["TIMESTAMP","2003-08-24T05:14:15.000003-07:00",false,"","{\"date\":\"2003-08-24\",\"time\":\"05:14:15.000003\",\"offset\":\"-07:00\",\"utc\":false}"],["HOSTNAME","192.0.2.1",false,"",null],["APP-NAME","myproc",false,"",null],["PROCID","8710",false,"",null],["MSGID","-",true,"",null],["STRUCTURED-DATA","-",true,"",null],["MSG","%% It's time to make the do-nuts.",false,"","{\"utf8Bom\":false}"]],"sd":[],"findings":"","length":{"octets":99,"chars":99},"truncated":false},
  },
  // Example 3: one private structured-data element and a MSG.
  {
    id: "rfc5424-example-3",
    input: {"text":"<165>1 2003-10-11T22:14:15.003Z mymachine.example.com evntslog - ID47 [exampleSDID@32473 iut=\"3\" eventSource=\"Application\" eventID=\"1011\"] ﻿An application event log entry..."},
    expect: {"grammar":"rfc5424","framing":["none",null,null,""],"pri":[165,20,5],"fields":[["PRI","<165>",false,"","{\"facility\":20,\"facilityKeyword\":\"local4\",\"severity\":5,\"severityKeyword\":\"notice\"}"],["VERSION","1",false,"",null],["TIMESTAMP","2003-10-11T22:14:15.003Z",false,"","{\"date\":\"2003-10-11\",\"time\":\"22:14:15.003\",\"offset\":\"Z (UTC)\",\"utc\":true}"],["HOSTNAME","mymachine.example.com",false,"",null],["APP-NAME","evntslog",false,"",null],["PROCID","-",true,"",null],["MSGID","ID47",false,"",null],["STRUCTURED-DATA","[exampleSDID@32473 iut=\"3\" eventSource=\"Application\" eventID=\"1011\"]",false,"",null],["MSG","An application event log entry...",false,"","{\"utf8Bom\":true}"]],"sd":[["exampleSDID@32473","private","iut=3;eventSource=Application;eventID=1011",""]],"findings":"","length":{"octets":175,"chars":173},"truncated":false},
  },
  // Example 4: structured data only, two elements, no MSG.
  {
    id: "rfc5424-example-4",
    input: {"text":"<165>1 2003-10-11T22:14:15.003Z mymachine.example.com evntslog - ID47 [exampleSDID@32473 iut=\"3\" eventSource=\"Application\" eventID=\"1011\"][examplePriority@32473 class=\"high\"]"},
    expect: {"grammar":"rfc5424","framing":["none",null,null,""],"pri":[165,20,5],"fields":[["PRI","<165>",false,"","{\"facility\":20,\"facilityKeyword\":\"local4\",\"severity\":5,\"severityKeyword\":\"notice\"}"],["VERSION","1",false,"",null],["TIMESTAMP","2003-10-11T22:14:15.003Z",false,"","{\"date\":\"2003-10-11\",\"time\":\"22:14:15.003\",\"offset\":\"Z (UTC)\",\"utc\":true}"],["HOSTNAME","mymachine.example.com",false,"",null],["APP-NAME","evntslog",false,"",null],["PROCID","-",true,"",null],["MSGID","ID47",false,"",null],["STRUCTURED-DATA","[exampleSDID@32473 iut=\"3\" eventSource=\"Application\" eventID=\"1011\"][examplePriority@32473 class=\"high\"]",false,"",null]],"sd":[["exampleSDID@32473","private","iut=3;eventSource=Application;eventID=1011",""],["examplePriority@32473","private","class=high",""]],"findings":"","length":{"octets":174,"chars":174},"truncated":false},
  },
  // The IANA elements of section 7: timeQuality and origin, with their parameters.
  {
    id: "iana-sd",
    input: {"text":"<165>1 2003-10-11T22:14:15.003Z mymachine.example.com evntslog - ID47 [timeQuality tzKnown=\"1\" isSynced=\"1\" syncAccuracy=\"60000\"][origin ip=\"192.0.2.1\" enterpriseId=\"32473\" software=\"rsyslogd\" swVersion=\"8.2\"] hello"},
    expect: {"grammar":"rfc5424","framing":["none",null,null,""],"pri":[165,20,5],"fields":[["PRI","<165>",false,"","{\"facility\":20,\"facilityKeyword\":\"local4\",\"severity\":5,\"severityKeyword\":\"notice\"}"],["VERSION","1",false,"",null],["TIMESTAMP","2003-10-11T22:14:15.003Z",false,"","{\"date\":\"2003-10-11\",\"time\":\"22:14:15.003\",\"offset\":\"Z (UTC)\",\"utc\":true}"],["HOSTNAME","mymachine.example.com",false,"",null],["APP-NAME","evntslog",false,"",null],["PROCID","-",true,"",null],["MSGID","ID47",false,"",null],["STRUCTURED-DATA","[timeQuality tzKnown=\"1\" isSynced=\"1\" syncAccuracy=\"60000\"][origin ip=\"192.0.2.1\" enterpriseId=\"32473\" software=\"rsyslogd\" swVersion=\"8.2\"]",false,"",null],["MSG","hello",false,"","{\"utf8Bom\":false}"]],"sd":[["timeQuality","iana","tzKnown=1;isSynced=1;syncAccuracy=60000",""],["origin","iana","ip=192.0.2.1;enterpriseId=32473;software=rsyslogd;swVersion=8.2",""]],"findings":"","length":{"octets":215,"chars":215},"truncated":false},
  },
  // RFC 3164 section 5.4's example: TIMESTAMP, HOSTNAME, TAG and CONTENT.
  {
    id: "bsd-rfc3164",
    input: {"text":"<34>Oct 11 22:14:15 mymachine su: 'su root' failed for lonvick on /dev/pts/8"},
    expect: {"grammar":"bsd","framing":["none",null,null,""],"pri":[34,4,2],"fields":[["PRI","<34>",false,"","{\"facility\":4,\"facilityKeyword\":\"auth\",\"severity\":2,\"severityKeyword\":\"crit\"}"],["TIMESTAMP","Oct 11 22:14:15",false,"","{\"month\":\"Oct\",\"day\":\"11\",\"time\":\"22:14:15\",\"note\":\"local time, no year, no zone\"}"],["HOSTNAME","mymachine",false,"",null],["TAG","su",false,"",null],["CONTENT",": 'su root' failed for lonvick on /dev/pts/8",false,"",null]],"sd":[],"findings":"","length":{"octets":76,"chars":76},"truncated":false},
  },
  // A BSD line with the day under 10 written with the leading space, and an IP as HOSTNAME.
  {
    id: "bsd-space-padded-day",
    input: {"text":"<13>Feb  5 17:32:18 10.0.0.99 Use the BFG!"},
    expect: {"grammar":"bsd","framing":["none",null,null,""],"pri":[13,1,5],"fields":[["PRI","<13>",false,"","{\"facility\":1,\"facilityKeyword\":\"user\",\"severity\":5,\"severityKeyword\":\"notice\"}"],["TIMESTAMP","Feb  5 17:32:18",false,"","{\"month\":\"Feb\",\"day\":\"5\",\"time\":\"17:32:18\",\"note\":\"local time, no year, no zone\"}"],["HOSTNAME","10.0.0.99",false,"",null],["TAG","Use",false,"",null],["CONTENT"," the BFG!",false,"",null]],"sd":[],"findings":"","length":{"octets":42,"chars":42},"truncated":false},
  },
  // RFC 6587 octet counting: the frame's declared length against the message's actual octets.
  {
    id: "octet-counting",
    input: {"text":"73 <165>1 2003-10-11T22:14:15.003Z mymachine.example.com evntslog - ID47 - x"},
    expect: {"grammar":"rfc5424","framing":["octet-counting",73,73,""],"pri":[165,20,5],"fields":[["PRI","<165>",false,"","{\"facility\":20,\"facilityKeyword\":\"local4\",\"severity\":5,\"severityKeyword\":\"notice\"}"],["VERSION","1",false,"",null],["TIMESTAMP","2003-10-11T22:14:15.003Z",false,"","{\"date\":\"2003-10-11\",\"time\":\"22:14:15.003\",\"offset\":\"Z (UTC)\",\"utc\":true}"],["HOSTNAME","mymachine.example.com",false,"",null],["APP-NAME","evntslog",false,"",null],["PROCID","-",true,"",null],["MSGID","ID47",false,"",null],["STRUCTURED-DATA","-",true,"",null],["MSG","x",false,"","{\"utf8Bom\":false}"]],"sd":[],"findings":"","length":{"octets":73,"chars":73},"truncated":false},
  },
  // RFC 6587 non-transparent framing: the trailing LF.
  {
    id: "non-transparent",
    input: {"text":"<165>1 2003-10-11T22:14:15.003Z host app - - - trailer\n"},
    expect: {"grammar":"rfc5424","framing":["non-transparent",null,null,""],"pri":[165,20,5],"fields":[["PRI","<165>",false,"","{\"facility\":20,\"facilityKeyword\":\"local4\",\"severity\":5,\"severityKeyword\":\"notice\"}"],["VERSION","1",false,"",null],["TIMESTAMP","2003-10-11T22:14:15.003Z",false,"","{\"date\":\"2003-10-11\",\"time\":\"22:14:15.003\",\"offset\":\"Z (UTC)\",\"utc\":true}"],["HOSTNAME","host",false,"",null],["APP-NAME","app",false,"",null],["PROCID","-",true,"",null],["MSGID","-",true,"",null],["STRUCTURED-DATA","-",true,"",null],["MSG","trailer",false,"","{\"utf8Bom\":false}"]],"sd":[],"findings":"","length":{"octets":54,"chars":54},"truncated":false},
  },
  // Lower-case t and z, a leap second, a fraction of seven digits: each a finding.
  {
    id: "timestamp-findings",
    input: {"text":"<190>1 2026-10-05t16:00:00z host app 1 - - lower case\n"},
    expect: {"grammar":"rfc5424","framing":["non-transparent",null,null,""],"pri":[190,23,6],"fields":[["PRI","<190>",false,"","{\"facility\":23,\"facilityKeyword\":\"local7\",\"severity\":6,\"severityKeyword\":\"info\"}"],["VERSION","1",false,"",null],["TIMESTAMP","2026-10-05t16:00:00z",false,"timestamp-lowercase-tz","{\"date\":\"2026-10-05\",\"time\":\"16:00:00\",\"offset\":\"Z (UTC)\",\"utc\":true}"],["HOSTNAME","host",false,"",null],["APP-NAME","app",false,"",null],["PROCID","1",false,"",null],["MSGID","-",true,"",null],["STRUCTURED-DATA","-",true,"",null],["MSG","lower case",false,"","{\"utf8Bom\":false}"]],"sd":[],"findings":"","length":{"octets":53,"chars":53},"truncated":false},
  },
  // A 60th second and a seven-digit fraction.
  {
    id: "leap-and-fraction",
    input: {"text":"<190>1 2026-10-05T16:00:60.1234567Z host app 1 - - leap"},
    expect: {"grammar":"rfc5424","framing":["none",null,null,""],"pri":[190,23,6],"fields":[["PRI","<190>",false,"","{\"facility\":23,\"facilityKeyword\":\"local7\",\"severity\":6,\"severityKeyword\":\"info\"}"],["VERSION","1",false,"",null],["TIMESTAMP","2026-10-05T16:00:60.1234567Z",false,"timestamp-fraction-too-long|timestamp-leap-second","{\"date\":\"2026-10-05\",\"time\":\"16:00:60.1234567\",\"offset\":\"Z (UTC)\",\"utc\":true}"],["HOSTNAME","host",false,"",null],["APP-NAME","app",false,"",null],["PROCID","1",false,"",null],["MSGID","-",true,"",null],["STRUCTURED-DATA","-",true,"",null],["MSG","leap",false,"","{\"utf8Bom\":false}"]],"sd":[],"findings":"","length":{"octets":55,"chars":55},"truncated":false},
  },
  // A leading zero in the PRI, and a PRI past 191.
  {
    id: "pri-problems",
    input: {"text":"<034>1 2026-10-05T16:00:00Z host app - - - zero"},
    expect: {"grammar":"rfc5424","framing":["none",null,null,""],"pri":[34,4,2],"fields":[["PRI","<034>",false,"pri-leading-zero","{\"facility\":4,\"facilityKeyword\":\"auth\",\"severity\":2,\"severityKeyword\":\"crit\"}"],["VERSION","1",false,"",null],["TIMESTAMP","2026-10-05T16:00:00Z",false,"","{\"date\":\"2026-10-05\",\"time\":\"16:00:00\",\"offset\":\"Z (UTC)\",\"utc\":true}"],["HOSTNAME","host",false,"",null],["APP-NAME","app",false,"",null],["PROCID","-",true,"",null],["MSGID","-",true,"",null],["STRUCTURED-DATA","-",true,"",null],["MSG","zero",false,"","{\"utf8Bom\":false}"]],"sd":[],"findings":"","length":{"octets":47,"chars":47},"truncated":false},
  },
  // A PRI past 191 has no facility.
  {
    id: "pri-out-of-range",
    input: {"text":"<200>1 2026-10-05T16:00:00Z host app - - - big"},
    expect: {"grammar":"rfc5424","framing":["none",null,null,""],"pri":null,"fields":[["PRI","<200>",false,"pri-out-of-range",null],["VERSION","1",false,"",null],["TIMESTAMP","2026-10-05T16:00:00Z",false,"","{\"date\":\"2026-10-05\",\"time\":\"16:00:00\",\"offset\":\"Z (UTC)\",\"utc\":true}"],["HOSTNAME","host",false,"",null],["APP-NAME","app",false,"",null],["PROCID","-",true,"",null],["MSGID","-",true,"",null],["STRUCTURED-DATA","-",true,"",null],["MSG","big",false,"","{\"utf8Bom\":false}"]],"sd":[],"findings":"","length":{"octets":46,"chars":46},"truncated":false},
  },
  // An unregistered SD-ID without an enterprise number, a duplicate SD-ID, and a parameter unknown to an IANA id.
  {
    id: "sd-problems",
    input: {"text":"<165>1 2003-10-11T22:14:15.003Z host app - ID47 [badid iut=\"3\"][exampleSDID@32473 a=\"1\"][exampleSDID@32473 b=\"2\"][timeQuality tzKnown=\"1\" bogus=\"x\"] dup"},
    expect: {"grammar":"rfc5424","framing":["none",null,null,""],"pri":[165,20,5],"fields":[["PRI","<165>",false,"","{\"facility\":20,\"facilityKeyword\":\"local4\",\"severity\":5,\"severityKeyword\":\"notice\"}"],["VERSION","1",false,"",null],["TIMESTAMP","2003-10-11T22:14:15.003Z",false,"","{\"date\":\"2003-10-11\",\"time\":\"22:14:15.003\",\"offset\":\"Z (UTC)\",\"utc\":true}"],["HOSTNAME","host",false,"",null],["APP-NAME","app",false,"",null],["PROCID","-",true,"",null],["MSGID","ID47",false,"",null],["STRUCTURED-DATA","[badid iut=\"3\"][exampleSDID@32473 a=\"1\"][exampleSDID@32473 b=\"2\"][timeQuality tzKnown=\"1\" bogus=\"x\"]",false,"",null],["MSG","dup",false,"","{\"utf8Bom\":false}"]],"sd":[["badid","non-compliant","iut=3","sd-id-unregistered-no-pen"],["exampleSDID@32473","private","a=1",""],["exampleSDID@32473","private","b=2","sd-id-duplicate"],["timeQuality","iana","tzKnown=1;bogus=x","sd-param-unknown-for-iana-id"]],"findings":"","length":{"octets":152,"chars":152},"truncated":false},
  },
  // An APP-NAME past 48 characters and a MSGID past 32.
  {
    id: "field-lengths",
    input: {"text":"<165>1 2003-10-11T22:14:15.003Z host aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa - mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm - too long"},
    expect: {"grammar":"rfc5424","framing":["none",null,null,""],"pri":[165,20,5],"fields":[["PRI","<165>",false,"","{\"facility\":20,\"facilityKeyword\":\"local4\",\"severity\":5,\"severityKeyword\":\"notice\"}"],["VERSION","1",false,"",null],["TIMESTAMP","2003-10-11T22:14:15.003Z",false,"","{\"date\":\"2003-10-11\",\"time\":\"22:14:15.003\",\"offset\":\"Z (UTC)\",\"utc\":true}"],["HOSTNAME","host",false,"",null],["APP-NAME","aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",false,"field-too-long",null],["PROCID","-",true,"",null],["MSGID","mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm",false,"field-too-long",null],["STRUCTURED-DATA","-",true,"",null],["MSG","too long",false,"","{\"utf8Bom\":false}"]],"sd":[],"findings":"","length":{"octets":133,"chars":133},"truncated":false},
  },
  // No PRI at all: nothing can be named.
  {
    id: "no-pri",
    input: {"text":"Oct 11 22:14:15 mymachine su: no pri"},
    expect: {"grammar":"unknown","framing":["none",null,null,""],"pri":null,"fields":[["PRI",null,false,"pri-missing",null]],"sd":[],"findings":"no-grammar","length":{"octets":36,"chars":36},"truncated":false},
  },
  // A PRI followed by neither header: RFC 3164 treats the rest as the message.
  {
    id: "pri-then-text",
    input: {"text":"<13>just text after the pri"},
    expect: {"grammar":"bsd","framing":["none",null,null,""],"pri":[13,1,5],"fields":[["PRI","<13>",false,"","{\"facility\":1,\"facilityKeyword\":\"user\",\"severity\":5,\"severityKeyword\":\"notice\"}"],["MSG","just text after the pri",false,"bsd-no-header",null]],"sd":[],"findings":"","length":{"octets":27,"chars":27},"truncated":false},
  },
];

/** The report verifyVectors returns. */
export interface VerifyReport {
  // The set id.
  setId: string;
  // Vectors run.
  total: number;
  // Vectors whose pinned fields matched.
  passed: number;
  // The ones that did not, with the first difference.
  failures: { id: string; reason: string }[];
}

/** Run every vector and compare its pinned fields byte for byte. */
export function verifyVectors(): VerifyReport {
  // Failures found.
  const failures: { id: string; reason: string }[] = [];
  // Each vector.
  for (const v of VECTORS) {
    // A throw is a failure too.
    try {
      // Run and reduce (through JSON, as the expected values were captured).
      const got = JSON.stringify(pin(run(v.input)));
      // The expected text.
      const want = JSON.stringify(v.expect);
      // Compare.
      if (got !== want) {
        // The first differing character, for a readable reason.
        let k = 0;
        // Walk to it.
        while (k < got.length && got[k] === want[k]) k++;
        // Record.
        failures.push({ id: v.id, reason: `differs at ${k}: got ...${got.slice(Math.max(0, k - 30), k + 50)}... want ...${want.slice(Math.max(0, k - 30), k + 50)}...` });
      }
    } catch (e) {
      // The error.
      failures.push({ id: v.id, reason: `threw: ${(e as Error).message}` });
    }
  }
  // The report.
  return { setId: GOLDEN_VECTOR_SET_ID, total: VECTORS.length, passed: VECTORS.length - failures.length, failures };
}
