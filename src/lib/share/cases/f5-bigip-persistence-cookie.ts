// ============================================================================
// src/lib/share/cases/f5-bigip-persistence-cookie.ts
// ----------------------------------------------------------------------------
// Share cases of the BIG-IP persistence cookie tool: Decode's link carries
// only the cookie the page decoded (a Set-Cookie line's attributes and a
// session cookie after it never travel); Encode's carries the three fields,
// trimmed, the numbers as the page reads them.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { BIGIP_COOKIE_SHARE, type BigipCookieShareState } from "../../tools/f5-bigip-persistence-cookie/share"; // the spec

/** RFC 6265 section 4.2.1's session identifier, standing in for a live one beside the persistence cookie. */
const SID = "31d4d96e407aad42"; // never in a link

/** The cases. */
export const F5_BIGIP_COOKIE_SHARE_CASES = defineShareCases<BigipCookieShareState, BigipCookieShareState>({
  spec: BIGIP_COOKIE_SHARE, // the spec
  accept: [
    { id: "bare-ipv4", state: { mode: "decode", input: "1677787402.20480.0000" }, params: { input: "1677787402.20480.0000" }, restored: { mode: "decode", input: "1677787402.20480.0000" } }, // the Example: the paste is the copy
    { id: "set-cookie-line", state: { mode: "decode", input: "Set-Cookie: BIGipServerWEB=1677787402.20480.0000; path=/; Httponly; Secure" }, params: { input: "BIGipServerWEB=1677787402.20480.0000" }, restored: { mode: "decode", input: "BIGipServerWEB=1677787402.20480.0000" }, mustNotContain: ["Set-Cookie", "Httponly"] }, // the attributes stay out
    { id: "session-cookie-after", state: { mode: "decode", input: `BIGipServerpool_web=rd5o00000000000000000000ffffc0000201o80; SID=${SID}; lang=en-US` }, params: { input: "BIGipServerpool_web=rd5o00000000000000000000ffffc0000201o80" }, restored: { mode: "decode", input: "BIGipServerpool_web=rd5o00000000000000000000ffffc0000201o80" }, mustNotContain: [SID, "lang=en-US"] }, // a browser's Cookie value: the session never travels
    { id: "ipv6", state: { mode: "decode", input: "  vi20010112000000000000000000000030.20480  " }, params: { input: "vi20010112000000000000000000000030.20480" }, restored: { mode: "decode", input: "vi20010112000000000000000000000030.20480" } }, // blanks around it are not the cookie
    { id: "encrypted", state: { mode: "decode", input: "BIGipServerWEB=!Ah2yNxZr2ZbLmWuJPn6mTA==; path=/" }, params: { input: "BIGipServerWEB=!Ah2yNxZr2ZbLmWuJPn6mTA==" }, restored: { mode: "decode", input: "BIGipServerWEB=!Ah2yNxZr2ZbLmWuJPn6mTA==" } }, // the encrypted form, its padding kept
    { id: "encode", state: { mode: "encode", address: " 10.1.1.100 ", port: "443", rd: "" }, params: { mode: "encode", address: "10.1.1.100", port: "443" }, restored: { mode: "encode", address: "10.1.1.100", port: "443", rd: "" } }, // trimmed; no route domain
    { id: "encode-rd", state: { mode: "encode", address: "2001:db8::30", port: "0080", rd: "3" }, params: { mode: "encode", address: "2001:db8::30", port: "80", rd: "3" }, restored: { mode: "encode", address: "2001:db8::30", port: "80", rd: "3" } }, // the port as the page reads it
  ],
  arrive: [
    { id: "encode-no-rd", values: { mode: "encode", address: "10.0.0.1", port: "8080" }, restored: { mode: "encode", address: "10.0.0.1", port: "8080", rd: "" } }, // an absent route domain is empty
  ],
  empty: [
    { id: "blank", state: { mode: "decode", input: " " } }, // nothing pasted
    { id: "not-a-cookie", state: { mode: "decode", input: "hello" } }, // nothing decoded
    { id: "encode-no-port", state: { mode: "encode", address: "10.0.0.1", port: "", rd: "" } }, // the page waits for the port
    { id: "encode-bad-address", state: { mode: "encode", address: "999.1.1.1", port: "80", rd: "" } }, // the encoder refuses it
    { id: "encode-port-not-number", state: { mode: "encode", address: "10.0.0.1", port: "http", rd: "" } }, // the page says so
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "   " } }, // white space
    { id: "unknown-mode", values: { mode: "decode", input: "1677787402.20480.0000" } }, // only "encode" is a mode value
    { id: "encode-no-port", values: { mode: "encode", address: "10.0.0.1" } }, // the port is required
    { id: "port-out-of-range", values: { mode: "encode", address: "10.0.0.1", port: "70000" } }, // 0 to 65535
    { id: "rd-not-number", values: { mode: "encode", address: "10.0.0.1", port: "80", rd: "x" } }, // a number
    { id: "cookie-in-encoder", values: { mode: "encode", address: "10.0.0.1", port: "80", input: "1677787402.20480.0000" } }, // two modes at once
    { id: "encoder-without-mode", values: { address: "10.0.0.1", port: "80" } }, // fields of Encode without the mode
    { id: "address-with-space", values: { mode: "encode", address: "10.0.0.1 x", port: "80" } }, // one word
  ],
});
