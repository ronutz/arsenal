// ============================================================================
// src/lib/tools/log-level-mapper/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the log level mapper (set "log-level-mapper-golden-2026-10-05").
//
// Each vector is one level in one system. The pinned fields are the rung
// chosen, its place on OpenTelemetry's SeverityNumber scale, and for every
// other system the nearest rung, whether exact, the distance and the ties.
// The placements come from each system's documentation and OpenTelemetry's
// example mapping (Data Model Appendix B), cited in compute.ts.
//
// Expected values were captured from compute.run() on 2026-10-05.
// ============================================================================

import { run, type LogLevelResult } from "./compute";

/** The set id: the tool slug and the date the expected values were captured. */
export const GOLDEN_VECTOR_SET_ID = "log-level-mapper-golden-2026-10-05";

/** The fields a vector pins. */
export type LogLevelPinned = ReturnType<typeof pin>;

/** One vector. */
export interface LogLevelVector {
  // A short stable name.
  id: string;
  // The input, exactly as the tool takes it.
  input: { system: string; level: string };
  // The pinned fields of the result.
  expect: LogLevelPinned;
}

/** Reduce a result to the fields a vector pins. */
export function pin(r: LogLevelResult) {
  // The chosen rung, its scale position, each equivalent (system, rung, value, exact, distance, ties), the error.
  return { chosen: r.chosen ? [r.chosen.system, r.chosen.rung.name, r.chosen.rung.value, r.chosen.rung.otel] : null, otel: r.otel, equivalents: r.equivalents.map((e) => [e.system, e.rung.name, e.rung.value, e.exact, e.distance, e.ties.map((t) => t.name).join("|")]), error: r.error };
}

/** The vectors. */
export const VECTORS: LogLevelVector[] = [
  // syslog Warning (4): the one rung every ladder has by name.
  {
    id: "syslog-warning",
    input: {"system":"syslog","level":"warning"},
    expect: {"chosen":["syslog","Warning",4,13],"otel":{"number":13,"range":"WARN","short":"WARN"},"equivalents":[["printk","KERN_WARNING","4",true,0,""],["cisco-ios","warnings",4,true,0,""],["junos","warning",null,true,0,""],["windows","Warning",3,true,0,""],["dotnet","Warning",3,true,0,""],["python","WARNING",30,true,0,""],["jul","WARNING",900,true,0,""],["log4j2","WARN",300,true,0,""],["otel","WARN",13,true,0,""]],"error":null},
  },
  // syslog Notice (5): INFO2 on the scale, one step from everyone's Info.
  {
    id: "syslog-notice",
    input: {"system":"syslog","level":"5"},
    expect: {"chosen":["syslog","Notice",5,10],"otel":{"number":10,"range":"INFO","short":"INFO2"},"equivalents":[["printk","KERN_NOTICE","5",true,0,""],["cisco-ios","notifications",5,true,0,""],["junos","notice",null,true,0,""],["windows","Informational",4,false,1,""],["dotnet","Information",2,false,1,""],["python","INFO",20,false,1,""],["jul","INFO",800,false,1,""],["log4j2","INFO",400,false,1,""],["otel","INFO",9,false,1,""]],"error":null},
  },
  // syslog Emergency (0): FATAL, where Windows has only Critical three steps away.
  {
    id: "syslog-emergency",
    input: {"system":"syslog","level":"emerg"},
    expect: {"chosen":["syslog","Emergency",0,21],"otel":{"number":21,"range":"FATAL","short":"FATAL"},"equivalents":[["printk","KERN_EMERG","0",true,0,""],["cisco-ios","emergencies",0,true,0,""],["junos","emergency",null,true,0,""],["windows","Critical",1,false,3,""],["dotnet","Critical",5,true,0,""],["python","CRITICAL",50,true,0,""],["jul","SEVERE",1000,false,4,""],["log4j2","FATAL",100,true,0,""],["otel","FATAL",21,true,0,""]],"error":null},
  },
  // Python ERROR (40).
  {
    id: "python-error",
    input: {"system":"python","level":"40"},
    expect: {"chosen":["python","ERROR",40,17],"otel":{"number":17,"range":"ERROR","short":"ERROR"},"equivalents":[["syslog","Error",3,true,0,""],["printk","KERN_ERR","3",true,0,""],["cisco-ios","errors",3,true,0,""],["junos","error",null,true,0,""],["windows","Error",2,true,0,""],["dotnet","Error",4,true,0,""],["jul","SEVERE",1000,true,0,""],["log4j2","ERROR",200,true,0,""],["otel","ERROR",17,true,0,""]],"error":null},
  },
  // Python CRITICAL (50) is FATAL, per the OpenTelemetry Python SDK.
  {
    id: "python-critical",
    input: {"system":"python","level":"CRITICAL"},
    expect: {"chosen":["python","CRITICAL",50,21],"otel":{"number":21,"range":"FATAL","short":"FATAL"},"equivalents":[["syslog","Emergency",0,true,0,""],["printk","KERN_EMERG","0",true,0,""],["cisco-ios","emergencies",0,true,0,""],["junos","emergency",null,true,0,""],["windows","Critical",1,false,3,""],["dotnet","Critical",5,true,0,""],["jul","SEVERE",1000,false,4,""],["log4j2","FATAL",100,true,0,""],["otel","FATAL",21,true,0,""]],"error":null},
  },
  // java.util.logging CONFIG (700): DEBUG3, between Info and Debug, a tie in most ladders.
  {
    id: "jul-config",
    input: {"system":"jul","level":"CONFIG"},
    expect: {"chosen":["jul","CONFIG",700,7],"otel":{"number":7,"range":"DEBUG","short":"DEBUG3"},"equivalents":[["syslog","Informational",6,false,2,"Debug"],["printk","KERN_INFO","6",false,2,"KERN_DEBUG"],["cisco-ios","informational",6,false,2,"debugging"],["junos","info",null,false,2,""],["windows","Informational",4,false,2,"Verbose"],["dotnet","Information",2,false,2,"Debug"],["python","INFO",20,false,2,"DEBUG"],["log4j2","INFO",400,false,2,"DEBUG"],["otel","INFO",9,false,2,"DEBUG"]],"error":null},
  },
  // java.util.logging FINE (500): DEBUG2.
  {
    id: "jul-fine",
    input: {"system":"jul","level":"500"},
    expect: {"chosen":["jul","FINE",500,6],"otel":{"number":6,"range":"DEBUG","short":"DEBUG2"},"equivalents":[["syslog","Debug",7,false,1,""],["printk","KERN_DEBUG","7",false,1,""],["cisco-ios","debugging",7,false,1,""],["junos","info",null,false,3,""],["windows","Verbose",5,false,1,""],["dotnet","Debug",1,false,1,""],["python","DEBUG",10,false,1,""],["log4j2","DEBUG",500,false,1,""],["otel","DEBUG",5,false,1,""]],"error":null},
  },
  // Log4j 2 FATAL (100): the lower number is the more severe.
  {
    id: "log4j2-fatal",
    input: {"system":"log4j2","level":"FATAL"},
    expect: {"chosen":["log4j2","FATAL",100,21],"otel":{"number":21,"range":"FATAL","short":"FATAL"},"equivalents":[["syslog","Emergency",0,true,0,""],["printk","KERN_EMERG","0",true,0,""],["cisco-ios","emergencies",0,true,0,""],["junos","emergency",null,true,0,""],["windows","Critical",1,false,3,""],["dotnet","Critical",5,true,0,""],["python","CRITICAL",50,true,0,""],["jul","SEVERE",1000,false,4,""],["otel","FATAL",21,true,0,""]],"error":null},
  },
  // Log4j 2 TRACE (600) and the ladders that stop at Debug.
  {
    id: "log4j2-trace",
    input: {"system":"log4j2","level":"600"},
    expect: {"chosen":["log4j2","TRACE",600,1],"otel":{"number":1,"range":"TRACE","short":"TRACE"},"equivalents":[["syslog","Debug",7,false,4,""],["printk","KERN_DEBUG","7",false,4,""],["cisco-ios","debugging",7,false,4,""],["junos","info",null,false,8,""],["windows","Verbose",5,false,4,""],["dotnet","Trace",0,true,0,""],["python","DEBUG",10,false,4,""],["jul","FINEST",300,true,0,""],["otel","TRACE",1,true,0,""]],"error":null},
  },
  // Windows Critical (1) is ERROR2 in OpenTelemetry's example mapping, not FATAL.
  {
    id: "windows-critical",
    input: {"system":"windows","level":"Critical"},
    expect: {"chosen":["windows","Critical",1,18],"otel":{"number":18,"range":"ERROR","short":"ERROR2"},"equivalents":[["syslog","Critical",2,true,0,""],["printk","KERN_CRIT","2",true,0,""],["cisco-ios","critical",2,true,0,""],["junos","critical",null,true,0,""],["dotnet","Error",4,false,1,""],["python","ERROR",40,false,1,""],["jul","SEVERE",1000,false,1,""],["log4j2","ERROR",200,false,1,""],["otel","ERROR",17,false,1,""]],"error":null},
  },
  // .NET Trace (0): the least severe; syslog has nothing below Debug.
  {
    id: "dotnet-trace",
    input: {"system":"dotnet","level":"Trace"},
    expect: {"chosen":["dotnet","Trace",0,1],"otel":{"number":1,"range":"TRACE","short":"TRACE"},"equivalents":[["syslog","Debug",7,false,4,""],["printk","KERN_DEBUG","7",false,4,""],["cisco-ios","debugging",7,false,4,""],["junos","info",null,false,8,""],["windows","Verbose",5,false,4,""],["python","DEBUG",10,false,4,""],["jul","FINEST",300,true,0,""],["log4j2","TRACE",600,true,0,""],["otel","TRACE",1,true,0,""]],"error":null},
  },
  // A raw SeverityNumber inside a range: 19 is ERROR3, syslog's Alert.
  {
    id: "otel-19",
    input: {"system":"otel","level":"19"},
    expect: {"chosen":["otel","ERROR3",19,19],"otel":{"number":19,"range":"ERROR","short":"ERROR3"},"equivalents":[["syslog","Alert",1,true,0,""],["printk","KERN_ALERT","1",true,0,""],["cisco-ios","alerts",1,true,0,""],["junos","alert",null,true,0,""],["windows","Critical",1,false,1,""],["dotnet","Critical",5,false,2,"Error"],["python","CRITICAL",50,false,2,"ERROR"],["jul","SEVERE",1000,false,2,""],["log4j2","FATAL",100,false,2,"ERROR"]],"error":null},
  },
  // Cisco IOS notifications (5).
  {
    id: "cisco-notifications",
    input: {"system":"cisco-ios","level":"notifications"},
    expect: {"chosen":["cisco-ios","notifications",5,10],"otel":{"number":10,"range":"INFO","short":"INFO2"},"equivalents":[["syslog","Notice",5,true,0,""],["printk","KERN_NOTICE","5",true,0,""],["junos","notice",null,true,0,""],["windows","Informational",4,false,1,""],["dotnet","Information",2,false,1,""],["python","INFO",20,false,1,""],["jul","INFO",800,false,1,""],["log4j2","INFO",400,false,1,""],["otel","INFO",9,false,1,""]],"error":null},
  },
  // KERN_WARNING, by its constant.
  {
    id: "printk-warning",
    input: {"system":"printk","level":"KERN_WARNING"},
    expect: {"chosen":["printk","KERN_WARNING","4",13],"otel":{"number":13,"range":"WARN","short":"WARN"},"equivalents":[["syslog","Warning",4,true,0,""],["cisco-ios","warnings",4,true,0,""],["junos","warning",null,true,0,""],["windows","Warning",3,true,0,""],["dotnet","Warning",3,true,0,""],["python","WARNING",30,true,0,""],["jul","WARNING",900,true,0,""],["log4j2","WARN",300,true,0,""],["otel","WARN",13,true,0,""]],"error":null},
  },
  // Junos notice, names only.
  {
    id: "junos-notice",
    input: {"system":"junos","level":"notice"},
    expect: {"chosen":["junos","notice",null,10],"otel":{"number":10,"range":"INFO","short":"INFO2"},"equivalents":[["syslog","Notice",5,true,0,""],["printk","KERN_NOTICE","5",true,0,""],["cisco-ios","notifications",5,true,0,""],["windows","Informational",4,false,1,""],["dotnet","Information",2,false,1,""],["python","INFO",20,false,1,""],["jul","INFO",800,false,1,""],["log4j2","INFO",400,false,1,""],["otel","INFO",9,false,1,""]],"error":null},
  },
  // A sentinel (Python NOTSET) has no place on the scale.
  {
    id: "sentinel",
    input: {"system":"python","level":"NOTSET"},
    expect: {"chosen":["python","NOTSET",0,0],"otel":{"number":0,"range":"UNSPECIFIED","short":"UNSPECIFIED"},"equivalents":[],"error":null},
  },
  // A level the ladder does not have.
  {
    id: "unknown-level",
    input: {"system":"syslog","level":"verbose"},
    expect: {"chosen":null,"otel":null,"equivalents":[],"error":"unknown-level"},
  },
  // A system not in the table.
  {
    id: "unknown-system",
    input: {"system":"foo","level":"1"},
    expect: {"chosen":null,"otel":null,"equivalents":[],"error":"unknown-system"},
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
