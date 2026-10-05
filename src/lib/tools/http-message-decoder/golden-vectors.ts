// ============================================================================
// src/lib/tools/http-message-decoder/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the HTTP message decoder
// (set "http-message-decoder-golden-2026-10-05").
//
// Each vector is a raw HTTP/1.1 message. The pinned fields are the kind, the
// decoded start line, every field with its group and registry status, the
// framing decision (rule, lengths, codings, the chunked decode), the masked
// credentials and cookies, the hand-offs, every finding (rule, severity, line,
// parameters), the counts and the facts of the paste.
//
// Expected values were captured from compute.run() on 2026-10-05. The messages
// were written for the vectors against RFC 9112 and RFC 9110 (read 2026-10-05);
// the chunked example is the one every textbook uses (Wiki / pedia / in chunks).
// ============================================================================

import { run, type HttpMessageResult } from "./compute";

/** The set id: the tool slug and the date the expected values were captured. */
export const GOLDEN_VECTOR_SET_ID = "http-message-decoder-golden-2026-10-05";

/** The fields a vector pins (the shape pin() returns). */
export type HttpPinned = ReturnType<typeof pin>;

/** One vector: a name, an input, and the pinned fields of its result. */
export interface HttpVector {
  // A short stable name.
  id: string;
  // The input, exactly as the tool takes it.
  input: { message: string };
  // The pinned fields of the result.
  expect: HttpPinned;
}

/** Reduce a result to the fields a vector pins. */
export function pin(r: HttpMessageResult) {
  // Each finding as a compact row: rule, severity, line, parameters.
  const findings = r.findings.map((f) => [f.rule, f.severity, f.line, f.params ? JSON.stringify(f.params) : ""] as (string | number)[]);
  // The pinned fields.
  return {
    kind: r.kind,
    request: r.request ? { method: r.request.method, known: r.request.known?.id ?? null, targetForm: r.request.targetForm, versionNumber: r.request.versionNumber, url: r.request.url } : null,
    response: r.response ? { code: r.response.code, klass: r.response.klass, reason: r.response.reason, registryReason: r.response.registryReason } : null,
    fields: r.fields.map((f) => [f.canonical, f.group, f.status] as string[]),
    framing: { rule: r.framing.rule, contentLength: r.framing.contentLength, transferCodings: r.framing.transferCodings, chunkedFinal: r.framing.chunkedFinal, bodyOctets: r.framing.bodyOctets, delimiter: r.framing.delimiter, chunked: r.framing.chunked ? { sizes: r.framing.chunked.chunks.map((c) => c.size), lastChunk: r.framing.chunked.lastChunk, decodedLength: r.framing.chunked.decodedLength, trailers: r.framing.chunked.trailers, error: r.framing.chunked.error, leftover: r.framing.chunked.leftover, contentPreview: r.framing.chunked.contentPreview } : null },
    credentials: r.credentials.map((c) => [c.field, c.scheme, c.userId, c.masked, c.jwtShaped] as (string | boolean | null)[]),
    cookies: r.cookies.map((c) => [c.name, c.masked, c.length] as (string | number)[]),
    setCookies: r.setCookies.map((c) => [c.name, c.secure, c.httpOnly, c.sameSite, c.prefix, c.prefixOk, c.bothAges] as (string | boolean | null)[]),
    handoffs: r.handoffs,
    findings,
    counts: r.counts,
    facts: r.facts,
  };
}

/** The vectors. */
export const VECTORS: HttpVector[] = [
  // A plain GET with a query: origin-form, HTTP/1.1, Host first, no body (rule 7).
  {
    id: "get-request",
    input: { message: "GET /pub/WWW/TheProject.html?lang=en HTTP/1.1\r\nHost: www.example.org\r\nUser-Agent: curl/8.6.0\r\nAccept: */*\r\nAccept-Encoding: gzip, br\r\nConnection: keep-alive\r\n\r\n" },
    expect: {"kind":"request","request":{"method":"GET","known":"GET","targetForm":"origin","versionNumber":"1.1","url":"http://www.example.org/pub/WWW/TheProject.html?lang=en"},"response":null,"fields":[["Host","routing","permanent"],["User-Agent","request-context","permanent"],["Accept","negotiation","permanent"],["Accept-Encoding","negotiation","permanent"],["Connection","routing","permanent"]],"framing":{"rule":7,"contentLength":null,"transferCodings":[],"chunkedFinal":false,"bodyOctets":0,"delimiter":"none","chunked":null},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"method","tool":"http-methods-comparison","input":"GET"},{"kind":"url","tool":"url-inspector","input":null},{"kind":"replay","tool":"http-request-translator","input":null}],"findings":[["H27","info",6,"{\"what\":\"keep-alive\",\"options\":\"keep-alive\"}"]],"counts":{"error":0,"warning":0,"info":1},"facts":{"lineEnding":"crlf","bareCr":0,"lines":8,"headerLines":5,"leadingEmptyLines":0,"bodyPresent":false}},
  },
  // A 200 with a Content-Length that matches its body (rule 6); the fields file under message, context, representation, negotiation and range.
  {
    id: "ok-response-content-length",
    input: { message: "HTTP/1.1 200 OK\r\nDate: Sun, 06 Nov 1994 08:49:37 GMT\r\nServer: Apache\r\nLast-Modified: Wed, 01 Sep 2004 13:24:52 GMT\r\nETag: \"34aa387-d-1568eb00\"\r\nAccept-Ranges: bytes\r\nContent-Length: 51\r\nVary: Accept-Encoding\r\nContent-Type: text/plain\r\n\r\nHello World! My content includes a trailing CRLF.\r\n" },
    expect: {"kind":"response","request":null,"response":{"code":200,"klass":2,"reason":"OK","registryReason":"OK"},"fields":[["Date","message","permanent"],["Server","response-context","permanent"],["Last-Modified","representation","permanent"],["ETag","representation","permanent"],["Accept-Ranges","range","permanent"],["Content-Length","representation","permanent"],["Vary","negotiation","permanent"],["Content-Type","representation","permanent"]],"framing":{"rule":6,"contentLength":51,"transferCodings":[],"chunkedFinal":false,"bodyOctets":51,"delimiter":"content-length","chunked":null},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"status","tool":"http-status-code-explainer","input":"200"}],"findings":[],"counts":{"error":0,"warning":0,"info":0},"facts":{"lineEnding":"crlf","bareCr":0,"lines":12,"headerLines":8,"leadingEmptyLines":0,"bodyPresent":true}},
  },
  // The classic chunked example: three chunks, a trailer, 23 octets decoded (rule 4).
  {
    id: "chunked-response",
    input: { message: "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nTransfer-Encoding: chunked\r\nTrailer: Expires\r\n\r\n4\r\nWiki\r\n5\r\npedia\r\nE\r\n in\r\n\r\nchunks.\r\n0\r\nExpires: Wed, 21 Oct 2015 07:28:00 GMT\r\n\r\n" },
    expect: {"kind":"response","request":null,"response":{"code":200,"klass":2,"reason":"OK","registryReason":"OK"},"fields":[["Content-Type","representation","permanent"],["Transfer-Encoding","framing","permanent"],["Trailer","message","permanent"]],"framing":{"rule":4,"contentLength":null,"transferCodings":["chunked"],"chunkedFinal":true,"bodyOctets":83,"delimiter":"chunked","chunked":{"sizes":[4,5,14],"lastChunk":true,"decodedLength":23,"trailers":[{"name":"Expires","value":"Wed, 21 Oct 2015 07:28:00 GMT"}],"error":null,"leftover":0,"contentPreview":"Wikipedia in\\r\\n\\r\\nchunks."}},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"status","tool":"http-status-code-explainer","input":"200"}],"findings":[],"counts":{"error":0,"warning":0,"info":0},"facts":{"lineEnding":"crlf","bareCr":0,"lines":17,"headerLines":3,"leadingEmptyLines":0,"bodyPresent":true}},
  },
  // Content-Length and Transfer-Encoding together (rule 3), and octets after the last chunk: the request-smuggling shape.
  {
    id: "smuggling-shape",
    input: { message: "POST /search HTTP/1.1\r\nHost: vulnerable-website.com\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: 13\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nSMUGGLED" },
    expect: {"kind":"request","request":{"method":"POST","known":"POST","targetForm":"origin","versionNumber":"1.1","url":"http://vulnerable-website.com/search"},"response":null,"fields":[["Host","routing","permanent"],["Content-Type","representation","permanent"],["Content-Length","representation","permanent"],["Transfer-Encoding","framing","permanent"]],"framing":{"rule":3,"contentLength":13,"transferCodings":["chunked"],"chunkedFinal":true,"bodyOctets":13,"delimiter":"chunked","chunked":{"sizes":[],"lastChunk":true,"decodedLength":0,"trailers":[],"error":null,"leftover":8,"contentPreview":""}},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"method","tool":"http-methods-comparison","input":"POST"},{"kind":"url","tool":"url-inspector","input":"http://vulnerable-website.com/search"},{"kind":"replay","tool":"http-request-translator","input":null}],"findings":[["H6","error",5,"{\"codings\":\"chunked\",\"length\":\"13\"}"],["H10","warning",7,"{\"what\":\"leftover\",\"octets\":8}"]],"counts":{"error":1,"warning":1,"info":0},"facts":{"lineEnding":"crlf","bareCr":0,"lines":9,"headerLines":4,"leadingEmptyLines":0,"bodyPresent":true}},
  },
  // Basic credentials (user-id decoded, password never shown), two cookies masked, a body that matches its length.
  {
    id: "post-form-basic",
    input: { message: "POST /login HTTP/1.1\r\nHost: api.example.net\r\nAuthorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: 26\r\nCookie: session=abc123def456; theme=dark\r\n\r\nuser=aladdin&remember=true" },
    expect: {"kind":"request","request":{"method":"POST","known":"POST","targetForm":"origin","versionNumber":"1.1","url":"http://api.example.net/login"},"response":null,"fields":[["Host","routing","permanent"],["Authorization","authentication","permanent"],["Content-Type","representation","permanent"],["Content-Length","representation","permanent"],["Cookie","cookies","permanent"]],"framing":{"rule":6,"contentLength":26,"transferCodings":[],"chunkedFinal":false,"bodyOctets":26,"delimiter":"content-length","chunked":null},"credentials":[["Authorization","Basic","Aladdin","QWxh••••••••••••ZQ==",false]],"cookies":[["session","ab••••••••56",12],["theme","••••",4]],"setCookies":[],"handoffs":[{"kind":"method","tool":"http-methods-comparison","input":"POST"},{"kind":"url","tool":"url-inspector","input":"http://api.example.net/login"},{"kind":"replay","tool":"http-request-translator","input":null}],"findings":[["H14","warning",3,"{\"what\":\"basic\",\"scheme\":\"Basic\",\"userId\":\"Aladdin\"}"],["H15","info",6,"{\"what\":\"sent\",\"count\":2,\"names\":\"session, theme\"}"]],"counts":{"error":0,"warning":1,"info":1},"facts":{"lineEnding":"crlf","bareCr":0,"lines":8,"headerLines":5,"leadingEmptyLines":0,"bodyPresent":true}},
  },
  // A Bearer token shaped like a JWT: masked, with a hand-off to the JWT decoder.
  {
    id: "bearer-jwt",
    input: { message: "GET /api/v1/me HTTP/1.1\r\nHost: api.example.net\r\nAuthorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c\r\nAccept: application/json\r\n\r\n" },
    expect: {"kind":"request","request":{"method":"GET","known":"GET","targetForm":"origin","versionNumber":"1.1","url":"http://api.example.net/api/v1/me"},"response":null,"fields":[["Host","routing","permanent"],["Authorization","authentication","permanent"],["Accept","negotiation","permanent"]],"framing":{"rule":7,"contentLength":null,"transferCodings":[],"chunkedFinal":false,"bodyOctets":0,"delimiter":"none","chunked":null},"credentials":[["Authorization","Bearer",null,"eyJh••••••••••••sw5c",true]],"cookies":[],"setCookies":[],"handoffs":[{"kind":"method","tool":"http-methods-comparison","input":"GET"},{"kind":"url","tool":"url-inspector","input":"http://api.example.net/api/v1/me"},{"kind":"jwt","tool":"jwt","input":null},{"kind":"replay","tool":"http-request-translator","input":null}],"findings":[["H14","warning",3,"{\"what\":\"bearer-jwt\",\"scheme\":\"Bearer\",\"userId\":\"\"}"]],"counts":{"error":0,"warning":1,"info":0},"facts":{"lineEnding":"crlf","bareCr":0,"lines":6,"headerLines":3,"leadingEmptyLines":0,"bodyPresent":false}},
  },
  // Four Set-Cookie lines: a sound one, a valid __Host- prefix, a broken __Host- prefix, SameSite=None without Secure and both ages.
  {
    id: "set-cookie-response",
    input: { message: "HTTP/1.1 302 Found\r\nLocation: https://www.example.com/home\r\nSet-Cookie: sid=31d4d96e407aad42; Path=/; Secure; HttpOnly; SameSite=Lax\r\nSet-Cookie: __Host-pref=blue; Path=/; Secure\r\nSet-Cookie: __Host-bad=1; Path=/; Secure; Domain=example.com\r\nSet-Cookie: track=xyz; Expires=Wed, 09 Jun 2021 10:18:14 GMT; Max-Age=3600; SameSite=None\r\nContent-Length: 0\r\n\r\n" },
    expect: {"kind":"response","request":null,"response":{"code":302,"klass":3,"reason":"Found","registryReason":"Found"},"fields":[["Location","response-context","permanent"],["Set-Cookie","cookies","permanent"],["Set-Cookie","cookies","permanent"],["Set-Cookie","cookies","permanent"],["Set-Cookie","cookies","permanent"],["Content-Length","representation","permanent"]],"framing":{"rule":6,"contentLength":0,"transferCodings":[],"chunkedFinal":false,"bodyOctets":0,"delimiter":"content-length","chunked":null},"credentials":[],"cookies":[],"setCookies":[["sid",true,true,"Lax",null,null,false],["__Host-pref",true,false,null,"__Host-",true,false],["__Host-bad",true,false,null,"__Host-",false,false],["track",false,false,"None",null,null,true]],"handoffs":[{"kind":"status","tool":"http-status-code-explainer","input":"302"}],"findings":[["H15","info",4,"{\"what\":\"no-httponly\",\"name\":\"__Host-pref\"}"],["H15","info",4,"{\"what\":\"no-samesite\",\"name\":\"__Host-pref\"}"],["H15","error",5,"{\"what\":\"prefix\",\"name\":\"__Host-bad\",\"prefix\":\"__Host-\"}"],["H15","info",5,"{\"what\":\"no-httponly\",\"name\":\"__Host-bad\"}"],["H15","info",5,"{\"what\":\"no-samesite\",\"name\":\"__Host-bad\"}"],["H15","warning",6,"{\"what\":\"no-secure\",\"name\":\"track\"}"],["H15","info",6,"{\"what\":\"no-httponly\",\"name\":\"track\"}"],["H15","warning",6,"{\"what\":\"none-without-secure\",\"name\":\"track\"}"],["H15","info",6,"{\"what\":\"both-ages\",\"name\":\"track\"}"]],"counts":{"error":1,"warning":2,"info":6},"facts":{"lineEnding":"crlf","bareCr":0,"lines":9,"headerLines":6,"leadingEmptyLines":0,"bodyPresent":false}},
  },
  // An HTTP/1.1 request without Host: a 400 by RFC 9112 Section 3.2.
  {
    id: "no-host-http11",
    input: { message: "GET /index.html HTTP/1.1\r\nAccept: text/html\r\n\r\n" },
    expect: {"kind":"request","request":{"method":"GET","known":"GET","targetForm":"origin","versionNumber":"1.1","url":null},"response":null,"fields":[["Accept","negotiation","permanent"]],"framing":{"rule":7,"contentLength":null,"transferCodings":[],"chunkedFinal":false,"bodyOctets":0,"delimiter":"none","chunked":null},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"method","tool":"http-methods-comparison","input":"GET"},{"kind":"replay","tool":"http-request-translator","input":null}],"findings":[["H2","error",1,"{\"what\":\"missing\"}"]],"counts":{"error":1,"warning":0,"info":0},"facts":{"lineEnding":"crlf","bareCr":0,"lines":4,"headerLines":1,"leadingEmptyLines":0,"bodyPresent":false}},
  },
  // Two Host lines, whitespace before a colon, two X- fields, a repeated singleton field.
  {
    id: "duplicate-host-space-colon",
    input: { message: "GET / HTTP/1.1\r\nHost: a.example\r\nHost: b.example\r\nX-Forwarded-For : 203.0.113.9\r\nX-Request-ID: 7f3b\r\nContent-Type: text/plain\r\nContent-Type: text/html\r\n\r\n" },
    expect: {"kind":"request","request":{"method":"GET","known":"GET","targetForm":"origin","versionNumber":"1.1","url":"http://a.example/"},"response":null,"fields":[["Host","routing","permanent"],["Host","routing","permanent"],["X-Forwarded-For","unregistered","unregistered"],["X-Request-ID","unregistered","unregistered"],["Content-Type","representation","permanent"],["Content-Type","representation","permanent"]],"framing":{"rule":7,"contentLength":null,"transferCodings":[],"chunkedFinal":false,"bodyOctets":0,"delimiter":"none","chunked":null},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"method","tool":"http-methods-comparison","input":"GET"},{"kind":"url","tool":"url-inspector","input":"http://a.example/"},{"kind":"replay","tool":"http-request-translator","input":null}],"findings":[["H2","error",3,"{\"what\":\"duplicate\",\"count\":2}"],["H3","error",4,"{\"what\":\"space-before-colon\",\"name\":\"X-Forwarded-For\"}"],["H22","info",4,"{\"count\":2,\"names\":\"X-Forwarded-For, X-Request-ID\"}"],["H20","warning",7,"{\"name\":\"Content-Type\",\"count\":2}"]],"counts":{"error":2,"warning":1,"info":1},"facts":{"lineEnding":"crlf","bareCr":0,"lines":9,"headerLines":6,"leadingEmptyLines":0,"bodyPresent":false}},
  },
  // A 304 with a body pasted after it: rule 1 ends the message at the empty line.
  {
    id: "no-content-304",
    input: { message: "HTTP/1.1 304 Not Modified\r\nDate: Sun, 06 Nov 1994 08:49:37 GMT\r\nETag: \"xyzzy\"\r\nCache-Control: max-age=3600\r\n\r\nstale body that should not be here" },
    expect: {"kind":"response","request":null,"response":{"code":304,"klass":3,"reason":"Not Modified","registryReason":"Not Modified"},"fields":[["Date","message","permanent"],["ETag","representation","permanent"],["Cache-Control","caching","permanent"]],"framing":{"rule":1,"contentLength":null,"transferCodings":[],"chunkedFinal":false,"bodyOctets":34,"delimiter":"none","chunked":null},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"status","tool":"http-status-code-explainer","input":"304"}],"findings":[["H13","warning",6,"{\"code\":304,\"octets\":34}"]],"counts":{"error":0,"warning":1,"info":0},"facts":{"lineEnding":"crlf","bareCr":0,"lines":6,"headerLines":3,"leadingEmptyLines":0,"bodyPresent":true}},
  },
  // Transfer-Encoding in an HTTP/1.0 message: the framing is faulty.
  {
    id: "http10-transfer-encoding",
    input: { message: "HTTP/1.0 200 OK\r\nTransfer-Encoding: chunked\r\nContent-Type: text/html\r\n\r\n5\r\nhello\r\n0\r\n\r\n" },
    expect: {"kind":"response","request":null,"response":{"code":200,"klass":2,"reason":"OK","registryReason":"OK"},"fields":[["Transfer-Encoding","framing","permanent"],["Content-Type","representation","permanent"]],"framing":{"rule":4,"contentLength":null,"transferCodings":["chunked"],"chunkedFinal":true,"bodyOctets":15,"delimiter":"chunked","chunked":{"sizes":[5],"lastChunk":true,"decodedLength":5,"trailers":[],"error":null,"leftover":0,"contentPreview":"hello"}},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"status","tool":"http-status-code-explainer","input":"200"}],"findings":[["H11","warning",2,"{}"]],"counts":{"error":0,"warning":1,"info":0},"facts":{"lineEnding":"crlf","bareCr":0,"lines":9,"headerLines":2,"leadingEmptyLines":0,"bodyPresent":true}},
  },
  // Content-Length: 12, 15: differing values, an unrecoverable error (rule 5).
  {
    id: "bad-content-length",
    input: { message: "POST /upload HTTP/1.1\r\nHost: files.example\r\nContent-Length: 12, 15\r\nContent-Type: application/octet-stream\r\n\r\ntwelve bytes" },
    expect: {"kind":"request","request":{"method":"POST","known":"POST","targetForm":"origin","versionNumber":"1.1","url":"http://files.example/upload"},"response":null,"fields":[["Host","routing","permanent"],["Content-Length","representation","permanent"],["Content-Type","representation","permanent"]],"framing":{"rule":5,"contentLength":null,"transferCodings":[],"chunkedFinal":false,"bodyOctets":12,"delimiter":"unknown","chunked":null},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"method","tool":"http-methods-comparison","input":"POST"},{"kind":"url","tool":"url-inspector","input":"http://files.example/upload"},{"kind":"replay","tool":"http-request-translator","input":null}],"findings":[["H7","error",3,"{\"what\":\"differ\",\"values\":\"12, 15\"}"]],"counts":{"error":1,"warning":0,"info":0},"facts":{"lineEnding":"crlf","bareCr":0,"lines":6,"headerLines":3,"leadingEmptyLines":0,"bodyPresent":true}},
  },
  // CONNECT with an authority-form target and Proxy-Authorization Basic.
  {
    id: "connect-authority",
    input: { message: "CONNECT server.example.com:443 HTTP/1.1\r\nHost: server.example.com:443\r\nProxy-Authorization: Basic dXNlcjpwYXNz\r\n\r\n" },
    expect: {"kind":"request","request":{"method":"CONNECT","known":"CONNECT","targetForm":"authority","versionNumber":"1.1","url":null},"response":null,"fields":[["Host","routing","permanent"],["Proxy-Authorization","authentication","permanent"]],"framing":{"rule":7,"contentLength":null,"transferCodings":[],"chunkedFinal":false,"bodyOctets":0,"delimiter":"none","chunked":null},"credentials":[["Proxy-Authorization","Basic","user","dXNl••••YXNz",false]],"cookies":[],"setCookies":[],"handoffs":[{"kind":"method","tool":"http-methods-comparison","input":"CONNECT"},{"kind":"replay","tool":"http-request-translator","input":null}],"findings":[["H14","warning",3,"{\"what\":\"basic\",\"scheme\":\"Basic\",\"userId\":\"user\"}"]],"counts":{"error":0,"warning":1,"info":0},"facts":{"lineEnding":"crlf","bareCr":0,"lines":5,"headerLines":2,"leadingEmptyLines":0,"bodyPresent":false}},
  },
  // OPTIONS * and an obs-fold continuation line.
  {
    id: "options-asterisk-obsfold",
    input: { message: "OPTIONS * HTTP/1.1\r\nHost: www.example.org\r\nX-Long: first part\r\n continued on the next line\r\nMax-Forwards: 0\r\n\r\n" },
    expect: {"kind":"request","request":{"method":"OPTIONS","known":"OPTIONS","targetForm":"asterisk","versionNumber":"1.1","url":null},"response":null,"fields":[["Host","routing","permanent"],["X-Long","unregistered","unregistered"],["Max-Forwards","routing","permanent"]],"framing":{"rule":7,"contentLength":null,"transferCodings":[],"chunkedFinal":false,"bodyOctets":0,"delimiter":"none","chunked":null},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"method","tool":"http-methods-comparison","input":"OPTIONS"},{"kind":"replay","tool":"http-request-translator","input":null}],"findings":[["H4","warning",3,"{\"name\":\"X-Long\"}"],["H22","info",3,"{\"count\":1,\"names\":\"X-Long\"}"]],"counts":{"error":0,"warning":1,"info":1},"facts":{"lineEnding":"crlf","bareCr":0,"lines":7,"headerLines":3,"leadingEmptyLines":0,"bodyPresent":false}},
  },
  // An unassigned code, 599, read as its class.
  {
    id: "unknown-status-reason",
    input: { message: "HTTP/1.1 599 Network Connect Timeout\r\nServer: proxy\r\nContent-Length: 0\r\n\r\n" },
    expect: {"kind":"response","request":null,"response":{"code":599,"klass":5,"reason":"Network Connect Timeout","registryReason":null},"fields":[["Server","response-context","permanent"],["Content-Length","representation","permanent"]],"framing":{"rule":6,"contentLength":0,"transferCodings":[],"chunkedFinal":false,"bodyOctets":0,"delimiter":"content-length","chunked":null},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"status","tool":"http-status-code-explainer","input":"599"}],"findings":[["H18","warning",1,"{\"what\":\"unassigned\",\"code\":599,\"klass\":5}"]],"counts":{"error":0,"warning":1,"info":0},"facts":{"lineEnding":"crlf","bareCr":0,"lines":5,"headerLines":2,"leadingEmptyLines":0,"bodyPresent":false}},
  },
  // The two obsolete HTTP-date formats, an invalid date, and two deprecated or obsoleted fields.
  {
    id: "old-date-formats",
    input: { message: "HTTP/1.1 200 OK\r\nDate: Sunday, 06-Nov-94 08:49:37 GMT\r\nExpires: Sun Nov  6 08:49:37 1994\r\nLast-Modified: yesterday\r\nPragma: no-cache\r\nWarning: 110 - \"Response is Stale\"\r\nContent-Length: 0\r\n\r\n" },
    expect: {"kind":"response","request":null,"response":{"code":200,"klass":2,"reason":"OK","registryReason":"OK"},"fields":[["Date","message","permanent"],["Expires","caching","permanent"],["Last-Modified","representation","permanent"],["Pragma","caching","deprecated"],["Warning","caching","obsoleted"],["Content-Length","representation","permanent"]],"framing":{"rule":6,"contentLength":0,"transferCodings":[],"chunkedFinal":false,"bodyOctets":0,"delimiter":"content-length","chunked":null},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"status","tool":"http-status-code-explainer","input":"200"}],"findings":[["H19","info",2,"{\"what\":\"obsolete\",\"name\":\"Date\",\"format\":\"RFC 850\"}"],["H19","info",3,"{\"what\":\"obsolete\",\"name\":\"Expires\",\"format\":\"asctime\"}"],["H19","warning",4,"{\"what\":\"invalid\",\"name\":\"Last-Modified\",\"value\":\"yesterday\"}"],["H23","info",5,"{\"name\":\"Pragma\",\"status\":\"deprecated\",\"reference\":\"RFC 9111, Section 5.4: HTTP Caching\"}"],["H23","info",6,"{\"name\":\"Warning\",\"status\":\"obsoleted\",\"reference\":\"RFC 9111, Section 5.5: HTTP Caching\"}"]],"counts":{"error":0,"warning":1,"info":4},"facts":{"lineEnding":"crlf","bareCr":0,"lines":9,"headerLines":6,"leadingEmptyLines":0,"bodyPresent":false}},
  },
  // A chunk whose data ends before its size says.
  {
    id: "truncated-chunk",
    input: { message: "HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\nA\r\nhello\r\n" },
    expect: {"kind":"response","request":null,"response":{"code":200,"klass":2,"reason":"OK","registryReason":"OK"},"fields":[["Transfer-Encoding","framing","permanent"]],"framing":{"rule":4,"contentLength":null,"transferCodings":["chunked"],"chunkedFinal":true,"bodyOctets":10,"delimiter":"chunked","chunked":{"sizes":[10],"lastChunk":false,"decodedLength":7,"trailers":[],"error":{"what":"truncated","line":4},"leftover":0,"contentPreview":"hello\\r\\n"}},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"status","tool":"http-status-code-explainer","input":"200"}],"findings":[["H10","error",4,"{\"what\":\"truncated\"}"]],"counts":{"error":1,"warning":0,"info":0},"facts":{"lineEnding":"crlf","bareCr":0,"lines":6,"headerLines":1,"leadingEmptyLines":0,"bodyPresent":true}},
  },
  // A POST body with neither Content-Length nor Transfer-Encoding: length zero to a server (rule 7).
  {
    id: "body-without-framing",
    input: { message: "POST /api HTTP/1.1\r\nHost: api.example\r\n\r\n{\"a\":1}" },
    expect: {"kind":"request","request":{"method":"POST","known":"POST","targetForm":"origin","versionNumber":"1.1","url":"http://api.example/api"},"response":null,"fields":[["Host","routing","permanent"]],"framing":{"rule":7,"contentLength":null,"transferCodings":[],"chunkedFinal":false,"bodyOctets":7,"delimiter":"none","chunked":null},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"method","tool":"http-methods-comparison","input":"POST"},{"kind":"url","tool":"url-inspector","input":"http://api.example/api"},{"kind":"replay","tool":"http-request-translator","input":null}],"findings":[["H12","warning",4,"{\"octets\":7}"]],"counts":{"error":0,"warning":1,"info":0},"facts":{"lineEnding":"crlf","bareCr":0,"lines":4,"headerLines":1,"leadingEmptyLines":0,"bodyPresent":true}},
  },
  // LF-only line endings, which a recipient may accept.
  {
    id: "lf-only-request",
    input: { message: "GET /lf HTTP/1.1\nHost: lf.example\nAccept: text/plain\n\n" },
    expect: {"kind":"request","request":{"method":"GET","known":"GET","targetForm":"origin","versionNumber":"1.1","url":"http://lf.example/lf"},"response":null,"fields":[["Host","routing","permanent"],["Accept","negotiation","permanent"]],"framing":{"rule":7,"contentLength":null,"transferCodings":[],"chunkedFinal":false,"bodyOctets":0,"delimiter":"none","chunked":null},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"method","tool":"http-methods-comparison","input":"GET"},{"kind":"url","tool":"url-inspector","input":"http://lf.example/lf"},{"kind":"replay","tool":"http-request-translator","input":null}],"findings":[["H28","info",1,"{\"what\":\"lf\"}"]],"counts":{"error":0,"warning":0,"info":1},"facts":{"lineEnding":"lf","bareCr":0,"lines":5,"headerLines":2,"leadingEmptyLines":0,"bodyPresent":false}},
  },
  // Not an HTTP message at all.
  {
    id: "not-http",
    input: { message: "hello there\nthis is not an http message\n" },
    expect: {"kind":"unknown","request":null,"response":null,"fields":[],"framing":{"rule":0,"contentLength":null,"transferCodings":[],"chunkedFinal":false,"bodyOctets":0,"delimiter":"unknown","chunked":null},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[],"findings":[["H1","error",1,"{\"what\":\"unrecognised\"}"],["H28","info",1,"{\"what\":\"lf\"}"]],"counts":{"error":1,"warning":0,"info":1},"facts":{"lineEnding":"lf","bareCr":0,"lines":3,"headerLines":0,"leadingEmptyLines":0,"bodyPresent":false}},
  },
  // A body shorter than its Content-Length: an incomplete message.
  {
    id: "content-length-mismatch",
    input: { message: "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 100\r\n\r\n{\"short\":true}" },
    expect: {"kind":"response","request":null,"response":{"code":200,"klass":2,"reason":"OK","registryReason":"OK"},"fields":[["Content-Type","representation","permanent"],["Content-Length","representation","permanent"]],"framing":{"rule":6,"contentLength":100,"transferCodings":[],"chunkedFinal":false,"bodyOctets":14,"delimiter":"content-length","chunked":null},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"status","tool":"http-status-code-explainer","input":"200"}],"findings":[["H8","warning",3,"{\"what\":\"shorter\",\"declared\":100,\"actual\":14}"]],"counts":{"error":0,"warning":1,"info":0},"facts":{"lineEnding":"crlf","bareCr":0,"lines":5,"headerLines":2,"leadingEmptyLines":0,"bodyPresent":true}},
  },
  // Security, CORS and fetch-metadata fields grouped, with a hand-off to the secure-headers grader.
  {
    id: "security-headers-response",
    input: { message: "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nStrict-Transport-Security: max-age=31536000; includeSubDomains\r\nContent-Security-Policy: default-src 'self'\r\nX-Frame-Options: DENY\r\nX-Content-Type-Options: nosniff\r\nReferrer-Policy: strict-origin-when-cross-origin\r\nAccess-Control-Allow-Origin: https://app.example\r\nSec-Fetch-Mode: navigate\r\nContent-Length: 0\r\n\r\n" },
    expect: {"kind":"response","request":null,"response":{"code":200,"klass":2,"reason":"OK","registryReason":"OK"},"fields":[["Content-Type","representation","permanent"],["Strict-Transport-Security","security-policy","permanent"],["Content-Security-Policy","security-policy","permanent"],["X-Frame-Options","security-policy","permanent"],["X-Content-Type-Options","security-policy","permanent"],["Referrer-Policy","security-policy","permanent"],["Access-Control-Allow-Origin","cors","permanent"],["Sec-Fetch-Mode","fetch-metadata","permanent"],["Content-Length","representation","permanent"]],"framing":{"rule":6,"contentLength":0,"transferCodings":[],"chunkedFinal":false,"bodyOctets":0,"delimiter":"content-length","chunked":null},"credentials":[],"cookies":[],"setCookies":[],"handoffs":[{"kind":"status","tool":"http-status-code-explainer","input":"200"},{"kind":"security-headers","tool":"secure-headers","input":null}],"findings":[],"counts":{"error":0,"warning":0,"info":0},"facts":{"lineEnding":"crlf","bareCr":0,"lines":12,"headerLines":9,"leadingEmptyLines":0,"bodyPresent":false}},
  },
];

/** What verifyVectors reports (the shape scripts/run-golden-vectors.mts reads). */
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
