// ============================================================================
// src/lib/tools/bits-bytes/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for bits, bytes and throughput: byte-exact expectations for
// the figures the page shows, over frozen inputs. Any change to compute.ts
// that moves one of these is a change in behaviour and must be made on
// purpose. The first lineage vector is the 2004 calculator's own worked
// example (a "56k" file over a "56k" modem: about 8.2 seconds, here exactly
// 8.192 s), and the RFC 2544 vector reproduces the 812 frames per second of
// its Appendix C from first principles.
// ============================================================================

import { run, type BitsBytesInput, type BitsBytesResult } from "./compute";

/** Identifies this vector set; bump the date when a vector is deliberately changed. */
export const GOLDEN_VECTOR_SET_ID = "bits-bytes-golden-2026-10-04";

/** The pinned projection of a result: every figure the page shows, two rows of each unit table. */
export function pin(r: BitsBytesResult) {
  const rows = (t: { unit: string; text: string }[] | undefined, units: string[]) => (t ?? []).filter((x) => units.includes(x.unit)).map((x) => `${x.unit}=${x.text}`);
  return {
    ok: r.ok, error: r.error,
    size: r.size ? { unit: r.size.unit, bits: r.size.bits, notes: r.size.notes } : null,
    rate: r.rate ? { unit: r.rate.unit, bits: r.rate.bits, notes: r.rate.notes } : null,
    time: r.time ? r.time.seconds : null,
    sizeView: r.sizeView ? { bits: r.sizeView.bits, bytes: r.sizeView.bytes, rows: rows(r.sizeView.table, ["GiB", "GB", "MiB", "kbit"]), other: r.sizeView.otherReading ? [r.sizeView.otherReading.asBinaryText, r.sizeView.otherReading.gapPercent] : null } : null,
    rateView: r.rateView ? { bps: r.rateView.bitsPerSecond, Bps: r.rateView.bytesPerSecond, per: r.rateView.per, rows: rows(r.rateView.table, ["MiB", "MB"]) } : null,
    transfer: r.transfer ? { derived: r.transfer.derived, time: r.transfer.time?.totalSeconds ?? null, parts: r.transfer.time ? [r.transfer.time.days, r.transfer.time.hours, r.transfer.time.minutes, r.transfer.time.seconds, r.transfer.time.millis] : null, rate: r.transfer.rateBitsPerSecond, size: r.transfer.sizeBits, eff: r.transfer.efficiencyPercent, preset: r.transfer.efficiencyPreset, links: r.transfer.connections.slice(0, 6).map((c) => `${c.id}:${c.time.totalSeconds}`) } : null,
  };
}

export interface BitsBytesGoldenVector {
  id: string;
  why: string;
  input: BitsBytesInput;
  expect: ReturnType<typeof pin>;
}

export const VECTORS: BitsBytesGoldenVector[] = [
  // 1.5 GB: decimal, 12 000 000 000 bits, 1.396984 GiB; the same label read the 1024 way is 7.37 % more.
  { id: "size-1-5-gb", why: "1.5 GB: decimal, 12 000 000 000 bits, 1.396984 GiB; the same label read the 1024 way is 7.37 % more.", input: {"size":"1.5 GB"}, expect: {"ok":true,"error":null,"size":{"unit":"GB","bits":"12 000 000 000","notes":["si-on-bytes"]},"rate":null,"time":null,"sizeView":{"bits":"12 000 000 000","bytes":"1 500 000 000","rows":["kbit=12 000 000","MiB=1 430.511475","GiB=1.396984","GB=1.5"],"other":["1.5 GiB = 1 610 612 736 B","7.37"]},"rateView":null,"transfer":{"derived":"time","time":null,"parts":null,"rate":null,"size":null,"eff":"100","preset":null,"links":["v90-56k:214 285.714286","isdn-b-64k:187 500","t1:7 772.020725","e1:5 859.375","eth-10m:1 200","eth-100m:120"]}} },
  // 700 MiB: binary and unambiguous, 734 003 200 bytes.
  { id: "size-700-mib", why: "700 MiB: binary and unambiguous, 734 003 200 bytes.", input: {"size":"700 MiB"}, expect: {"ok":true,"error":null,"size":{"unit":"MiB","bits":"5 872 025 600","notes":["iec-binary"]},"rate":null,"time":null,"sizeView":{"bits":"5 872 025 600","bytes":"734 003 200","rows":["kbit=5 872 025.6","MiB=700","GiB=0.683594","GB=0.734003"],"other":["700 MiB = 734 003 200 B","4.86"]},"rateView":null,"transfer":{"derived":"time","time":null,"parts":null,"rate":null,"size":null,"eff":"100","preset":null,"links":["v90-56k:104 857.6","isdn-b-64k:91 750.4","t1:3 803.125389","e1:2 867.2","eth-10m:587.20256","eth-100m:58.720256"]}} },
  // The 2004 calculator's worked example: 56 KiB (57 344 bytes, 458 752 bits) over a 56 kbit/s modem takes 8.192 s, not one second.
  { id: "lineage-56k-modem", why: "The 2004 calculator's worked example: 56 KiB (57 344 bytes, 458 752 bits) over a 56 kbit/s modem takes 8.192 s, not one second.", input: {"size":"56 KiB","rate":"56 kbit/s"}, expect: {"ok":true,"error":null,"size":{"unit":"KiB","bits":"458 752","notes":["iec-binary"]},"rate":{"unit":"kbit","bits":"56 000","notes":["bits-per-second"]},"time":null,"sizeView":{"bits":"458 752","bytes":"57 344","rows":["kbit=458.752","MiB=0.054688","GiB=0.000053","GB=0.000057"],"other":["56 KiB = 57 344 B","2.4"]},"rateView":{"bps":"56 000","Bps":"7 000","per":{"minute":"420 kB","hour":"25.2 MB","day":"604.8 MB"},"rows":["MB=0.007","MiB=0.006676"]},"transfer":{"derived":"time","time":"8.192","parts":[0,0,0,8,192],"rate":null,"size":null,"eff":"100","preset":null,"links":["v90-56k:8.192","isdn-b-64k:7.168","t1:0.297119","e1:0.224","eth-10m:0.045875","eth-100m:0.004588"]}} },
  // The same figure written 56 KB is decimal: 56 000 bytes, exactly 8 s at 56 kbit/s.
  { id: "size-56-kb-decimal", why: "The same figure written 56 KB is decimal: 56 000 bytes, exactly 8 s at 56 kbit/s.", input: {"size":"56 KB","rate":"56kbps"}, expect: {"ok":true,"error":null,"size":{"unit":"kB","bits":"448 000","notes":["si-on-bytes"]},"rate":{"unit":"kbit","bits":"56 000","notes":["bits-per-second"]},"time":null,"sizeView":{"bits":"448 000","bytes":"56 000","rows":["kbit=448","MiB=0.053406","GiB=0.000052","GB=0.000056"],"other":["56 KiB = 57 344 B","2.4"]},"rateView":{"bps":"56 000","Bps":"7 000","per":{"minute":"420 kB","hour":"25.2 MB","day":"604.8 MB"},"rows":["MB=0.007","MiB=0.006676"]},"transfer":{"derived":"time","time":"8","parts":[0,0,0,8,0],"rate":null,"size":null,"eff":"100","preset":null,"links":["v90-56k:8","isdn-b-64k:7","t1:0.290155","e1:0.21875","eth-10m:0.0448","eth-100m:0.00448"]}} },
  // 10K with no unit reads as 10 x 1024 bytes, as ls(1) reads a bare K, and says so.
  { id: "bare-k-is-1024", why: "10K with no unit reads as 10 x 1024 bytes, as ls(1) reads a bare K, and says so.", input: {"size":"10K"}, expect: {"ok":true,"error":null,"size":{"unit":"KiB","bits":"81 920","notes":["bare-k-is-1024","iec-binary"]},"rate":null,"time":null,"sizeView":{"bits":"81 920","bytes":"10 240","rows":["kbit=81.92","MiB=0.009766","GiB=0.00001","GB=0.00001"],"other":["10 KiB = 10 240 B","2.4"]},"rateView":null,"transfer":{"derived":"time","time":null,"parts":null,"rate":null,"size":null,"eff":"100","preset":null,"links":["v90-56k:1.462857","isdn-b-64k:1.28","t1:0.053057","e1:0.04","eth-10m:0.008192","eth-100m:0.000819"]}} },
  // 8 Mb: read as megabits and flagged ambiguous, because a capital prefix with a lower-case b is written both ways in the wild.
  { id: "ambiguous-mb", why: "8 Mb: read as megabits and flagged ambiguous, because a capital prefix with a lower-case b is written both ways in the wild.", input: {"size":"8 Mb"}, expect: {"ok":true,"error":null,"size":{"unit":"Mbit","bits":"8 000 000","notes":["ambiguous-kb"]},"rate":null,"time":null,"sizeView":{"bits":"8 000 000","bytes":"1 000 000","rows":["kbit=8 000","MiB=0.953674","GiB=0.000931","GB=0.001"],"other":null},"rateView":null,"transfer":{"derived":"time","time":null,"parts":null,"rate":null,"size":null,"eff":"100","preset":null,"links":["v90-56k:142.857143","isdn-b-64k:125","t1:5.181347","e1:3.90625","eth-10m:0.8","eth-100m:0.08"]}} },
  // 100 Mbit/s: 12 500 000 bytes per second, 750 MB a minute, 45 GB an hour, 1.08 TB a day.
  { id: "rate-100-mbit", why: "100 Mbit/s: 12 500 000 bytes per second, 750 MB a minute, 45 GB an hour, 1.08 TB a day.", input: {"rate":"100 Mbit/s"}, expect: {"ok":true,"error":null,"size":null,"rate":{"unit":"Mbit","bits":"100 000 000","notes":["bits-per-second"]},"time":null,"sizeView":null,"rateView":{"bps":"100 000 000","Bps":"12 500 000","per":{"minute":"750 MB","hour":"45 GB","day":"1.08 TB"},"rows":["MB=12.5","MiB=11.920929"]},"transfer":null} },
  // 12.5 MB/s is the same rate written in bytes.
  { id: "rate-12-5-mb-s", why: "12.5 MB/s is the same rate written in bytes.", input: {"rate":"12.5 MB/s"}, expect: {"ok":true,"error":null,"size":null,"rate":{"unit":"MB","bits":"100 000 000","notes":["si-on-bytes","bytes-per-second"]},"time":null,"sizeView":null,"rateView":{"bps":"100 000 000","Bps":"12 500 000","per":{"minute":"750 MB","hour":"45 GB","day":"1.08 TB"},"rows":["MB=12.5","MiB=11.920929"]},"transfer":null} },
  // 1 Gbps: the bps suffix means bits per second.
  { id: "rate-1-gbps", why: "1 Gbps: the bps suffix means bits per second.", input: {"rate":"1 Gbps"}, expect: {"ok":true,"error":null,"size":null,"rate":{"unit":"Gbit","bits":"1 000 000 000","notes":["bits-per-second"]},"time":null,"sizeView":null,"rateView":{"bps":"1 000 000 000","Bps":"125 000 000","per":{"minute":"7.5 GB","hour":"450 GB","day":"10.8 TB"},"rows":["MB=125","MiB=119.20929"]},"transfer":null} },
  // 4.7 GB at 1 Gbit/s with the TCP over IPv4 over Ethernet preset: 1460 payload octets per 1538 on the wire, 94.93 %, 39.609 s.
  { id: "transfer-tcp-ipv4-ethernet", why: "4.7 GB at 1 Gbit/s with the TCP over IPv4 over Ethernet preset: 1460 payload octets per 1538 on the wire, 94.93 %, 39.609 s.", input: {"size":"4.7 GB","rate":"1 Gbit/s","efficiency":"tcp-ipv4-ethernet-1500"}, expect: {"ok":true,"error":null,"size":{"unit":"GB","bits":"37 600 000 000","notes":["si-on-bytes"]},"rate":{"unit":"Gbit","bits":"1 000 000 000","notes":["bits-per-second"]},"time":null,"sizeView":{"bits":"37 600 000 000","bytes":"4 700 000 000","rows":["kbit=37 600 000","MiB=4 482.269287","GiB=4.377216","GB=4.7"],"other":["4.7 GiB = 5 046 586 573 B","7.37"]},"rateView":{"bps":"1 000 000 000","Bps":"125 000 000","per":{"minute":"7.5 GB","hour":"450 GB","day":"10.8 TB"},"rows":["MB=125","MiB=119.20929"]},"transfer":{"derived":"time","time":"39.608767","parts":[0,0,0,39,609],"rate":null,"size":null,"eff":"94.93","preset":"tcp-ipv4-ethernet-1500","links":["v90-56k:707 299.412916","isdn-b-64k:618 886.986301","t1:25 653.346582","e1:19 340.218322","eth-10m:3 960.876712","eth-100m:396.087671"]}} },
  // 10 GiB in 2 h 30 min: the rate that achieved it, 9 544 371.769 bit/s.
  { id: "derive-rate", why: "10 GiB in 2 h 30 min: the rate that achieved it, 9 544 371.769 bit/s.", input: {"size":"10 GiB","time":"2h 30min"}, expect: {"ok":true,"error":null,"size":{"unit":"GiB","bits":"85 899 345 920","notes":["iec-binary"]},"rate":null,"time":"9 000","sizeView":{"bits":"85 899 345 920","bytes":"10 737 418 240","rows":["kbit=85 899 345.92","MiB=10 240","GiB=10","GB=10.737418"],"other":["10 GiB = 10 737 418 240 B","7.37"]},"rateView":null,"transfer":{"derived":"rate","time":null,"parts":null,"rate":"9 544 371.769","size":null,"eff":"100","preset":null,"links":["v90-56k:1 533 916.891429","isdn-b-64k:1 342 177.28","t1:55 634.291399","e1:41 943.04","eth-10m:8 589.934592","eth-100m:858.993459"]}} },
  // 100 Mbit/s for a day: 8.64 Tbit, 1.08 TB.
  { id: "derive-size", why: "100 Mbit/s for a day: 8.64 Tbit, 1.08 TB.", input: {"rate":"100 Mbit/s","time":"1 day"}, expect: {"ok":true,"error":null,"size":null,"rate":{"unit":"Mbit","bits":"100 000 000","notes":["bits-per-second"]},"time":"86 400","sizeView":null,"rateView":{"bps":"100 000 000","Bps":"12 500 000","per":{"minute":"750 MB","hour":"45 GB","day":"1.08 TB"},"rows":["MB=12.5","MiB=11.920929"]},"transfer":{"derived":"size","time":null,"parts":null,"rate":null,"size":"8 640 000 000 000","eff":"100","preset":null,"links":["v90-56k:154 285 714.285714","isdn-b-64k:135 000 000","t1:5 595 854.92228","e1:4 218 750","eth-10m:864 000","eth-100m:86 400"]}} },
  // 1 ZB: the bit count written out in full; the binary reading is 18.06 % more.
  { id: "zettabyte", why: "1 ZB: the bit count written out in full; the binary reading is 18.06 % more.", input: {"size":"1 ZB"}, expect: {"ok":true,"error":null,"size":{"unit":"ZB","bits":"8 000 000 000 000 000 000 000","notes":["si-on-bytes"]},"rate":null,"time":null,"sizeView":{"bits":"8 000 000 000 000 000 000 000","bytes":"1 000 000 000 000 000 000 000","rows":["kbit=8 000 000 000 000 000 000","MiB=953 674 316 406 250","GiB=931 322 574 615.478516","GB=1 000 000 000 000"],"other":["1 ZiB = 1 180 591 620 717 411 303 424 B","18.06"]},"rateView":null,"transfer":{"derived":"time","time":null,"parts":null,"rate":null,"size":null,"eff":"100","preset":null,"links":["v90-56k:142 857 142 857 142 857.142857","isdn-b-64k:125 000 000 000 000 000","t1:5 181 347 150 259 067.357513","e1:3 906 250 000 000 000","eth-10m:800 000 000 000 000","eth-100m:80 000 000 000 000"]}} },
  // Spelled-out units: 2 kilobytes.
  { id: "words-kilobytes", why: "Spelled-out units: 2 kilobytes.", input: {"size":"2 kilobytes"}, expect: {"ok":true,"error":null,"size":{"unit":"kB","bits":"16 000","notes":["si-on-bytes"]},"rate":null,"time":null,"sizeView":{"bits":"16 000","bytes":"2 000","rows":["kbit=16","MiB=0.001907","GiB=0.000002","GB=0.000002"],"other":["2 KiB = 2 048 B","2.4"]},"rateView":null,"transfer":{"derived":"time","time":null,"parts":null,"rate":null,"size":null,"eff":"100","preset":null,"links":["v90-56k:0.285714","isdn-b-64k:0.25","t1:0.010363","e1:0.007813","eth-10m:0.0016","eth-100m:0.00016"]}} },
  // Spelled-out binary prefix on bits: 3 mebibits.
  { id: "words-mebibits", why: "Spelled-out binary prefix on bits: 3 mebibits.", input: {"size":"3 mebibits"}, expect: {"ok":true,"error":null,"size":{"unit":"Mibit","bits":"3 145 728","notes":["iec-binary"]},"rate":null,"time":null,"sizeView":{"bits":"3 145 728","bytes":"393 216","rows":["kbit=3 145.728","MiB=0.375","GiB=0.000366","GB=0.000393"],"other":null},"rateView":null,"transfer":{"derived":"time","time":null,"parts":null,"rate":null,"size":null,"eff":"100","preset":null,"links":["v90-56k:56.173714","isdn-b-64k:49.152","t1:2.037389","e1:1.536","eth-10m:0.314573","eth-100m:0.031457"]}} },
  // An efficiency typed as a percentage: 1 GB at 100 Mbit/s at 80 % takes 100 s.
  { id: "efficiency-percent", why: "An efficiency typed as a percentage: 1 GB at 100 Mbit/s at 80 % takes 100 s.", input: {"size":"1 GB","rate":"100 Mbit/s","efficiency":"80%"}, expect: {"ok":true,"error":null,"size":{"unit":"GB","bits":"8 000 000 000","notes":["si-on-bytes"]},"rate":{"unit":"Mbit","bits":"100 000 000","notes":["bits-per-second"]},"time":null,"sizeView":{"bits":"8 000 000 000","bytes":"1 000 000 000","rows":["kbit=8 000 000","MiB=953.674316","GiB=0.931323","GB=1"],"other":["1 GiB = 1 073 741 824 B","7.37"]},"rateView":{"bps":"100 000 000","Bps":"12 500 000","per":{"minute":"750 MB","hour":"45 GB","day":"1.08 TB"},"rows":["MB=12.5","MiB=11.920929"]},"transfer":{"derived":"time","time":"100","parts":[0,0,1,40,0],"rate":null,"size":null,"eff":"80","preset":null,"links":["v90-56k:178 571.428571","isdn-b-64k:156 250","t1:6 476.683938","e1:4 882.8125","eth-10m:1 000","eth-100m:100"]}} },
  // One 1518-byte frame plus preamble and gap, 1538 bytes, at 10 Mbit/s: 1.2304 ms, the 812 frames per second of RFC 2544 Appendix C.
  { id: "rfc2544-frame-time", why: "One 1518-byte frame plus preamble and gap, 1538 bytes, at 10 Mbit/s: 1.2304 ms, the 812 frames per second of RFC 2544 Appendix C.", input: {"size":"1538 B","rate":"10 Mbit/s"}, expect: {"ok":true,"error":null,"size":{"unit":"B","bits":"12 304","notes":[]},"rate":{"unit":"Mbit","bits":"10 000 000","notes":["bits-per-second"]},"time":null,"sizeView":{"bits":"12 304","bytes":"1 538","rows":["kbit=12.304","MiB=0.001467","GiB=0.000001","GB=0.000002"],"other":null},"rateView":{"bps":"10 000 000","Bps":"1 250 000","per":{"minute":"75 MB","hour":"4.5 GB","day":"108 GB"},"rows":["MB=1.25","MiB=1.192093"]},"transfer":{"derived":"time","time":"0.00123","parts":[0,0,0,0,1],"rate":null,"size":null,"eff":"100","preset":null,"links":["v90-56k:0.219714","isdn-b-64k:0.19225","t1:0.007969","e1:0.006008","eth-10m:0.00123","eth-100m:0.000123"]}} },
  // A time alone is read and echoed in seconds.
  { id: "time-only", why: "A time alone is read and echoed in seconds.", input: {"time":"1h 1min 1s"}, expect: {"ok":true,"error":null,"size":null,"rate":null,"time":"3 661","sizeView":null,"rateView":null,"transfer":null} },
  // An efficiency above 100 % is refused.
  { id: "error-efficiency-range", why: "An efficiency above 100 % is refused.", input: {"size":"1 GB","rate":"100 Mbit/s","efficiency":"120"}, expect: {"ok":false,"error":"efficiency-range","size":null,"rate":null,"time":null,"sizeView":null,"rateView":null,"transfer":null} },
  // A zero rate has no transfer time.
  { id: "error-zero-rate", why: "A zero rate has no transfer time.", input: {"size":"1 GB","rate":"0 Mbit/s"}, expect: {"ok":false,"error":"zero-rate","size":null,"rate":null,"time":null,"sizeView":null,"rateView":null,"transfer":null} },
  // Text that is not a quantity.
  { id: "error-unreadable-size", why: "Text that is not a quantity.", input: {"size":"hello"}, expect: {"ok":false,"error":"unreadable-size","size":null,"rate":null,"time":null,"sizeView":null,"rateView":null,"transfer":null} },
  // Nothing given.
  { id: "error-empty", why: "Nothing given.", input: {}, expect: {"ok":false,"error":"empty","size":null,"rate":null,"time":null,"sizeView":null,"rateView":null,"transfer":null} },
];

/** Verifies every vector; the build's run-golden-vectors reads this shape. */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: { id: string; expected: string; actual: string }[] } {
  const failures: { id: string; expected: string; actual: string }[] = [];
  for (const v of VECTORS) {
    const expected = JSON.stringify(v.expect);
    const actual = JSON.stringify(pin(run(v.input)));
    if (expected !== actual) failures.push({ id: v.id, expected, actual });
  }
  return { setId: GOLDEN_VECTOR_SET_ID, total: VECTORS.length, passed: VECTORS.length - failures.length, failures };
}
