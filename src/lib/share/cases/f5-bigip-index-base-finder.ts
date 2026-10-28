// ============================================================================
// src/lib/share/cases/f5-bigip-index-base-finder.ts
// ----------------------------------------------------------------------------
// Share cases of the BIG-IP zero-or-one finder: a look-up goes as its words
// and filters, a translation as mode=translate and its question's inputs; a
// field of the other mode, an unknown choice or a value over its limit makes
// the share malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { INDEX_BASE_SHARE, type IndexShareState } from "../../tools/f5-bigip-index-base-finder/share"; // the spec

/** The cases. */
export const F5_INDEX_BASE_SHARE_CASES = defineShareCases<IndexShareState, IndexShareState>({
  spec: INDEX_BASE_SHARE, // the spec
  accept: [
    { id: "lookup-path", state: { mode: "lookup", query: "path", base: "all", area: "all" }, params: { search: "path" }, restored: { mode: "lookup", query: "path", base: "all", area: "all" } }, // the look-up's Example
    { id: "lookup-filters", state: { mode: "lookup", query: "", base: "value", area: "config" }, params: { base: "value", area: "config" }, restored: { mode: "lookup", query: "", base: "value", area: "config" } }, // two filters, no words
    { id: "segment-2", state: { mode: "translate", question: "segment", value: "/api/v2/users", n: "2", separator: ".", needle: "x" }, params: { mode: "translate", question: "segment", value: "/api/v2/users", n: "2" }, restored: { mode: "translate", question: "segment", value: "/api/v2/users", n: "2", separator: ".", needle: "" } }, // the translator's Example
    { id: "field-multichar", state: { mode: "translate", question: "field", value: "one--two--three", n: "3", separator: "--", needle: "x" }, params: { mode: "translate", question: "field", value: "one--two--three", n: "3", sep: "--" }, restored: { mode: "translate", question: "field", value: "one--two--three", n: "3", separator: "--", needle: "" } }, // a separator goes with a field question
    { id: "search", state: { mode: "translate", question: "search", value: "xyz", n: "7", separator: ".", needle: "q" }, params: { mode: "translate", question: "search", value: "xyz", needle: "q" }, restored: { mode: "translate", question: "search", value: "xyz", n: "1", separator: ".", needle: "q" } }, // a search takes no N
    { id: "n-as-read", state: { mode: "translate", question: "char", value: "abcdef", n: "3.9", separator: ".", needle: "" }, params: { mode: "translate", question: "char", value: "abcdef", n: "3" }, restored: { mode: "translate", question: "char", value: "abcdef", n: "3", separator: ".", needle: "" } }, // N as the engine reads it
  ],
  empty: [
    { id: "whole-catalogue", state: { mode: "lookup", query: " ", base: "all", area: "all" } }, // no words, no filter
  ],
  reject: [
    { id: "unknown-mode", values: { mode: "browse", question: "char", value: "a", n: "1" } }, // not a mode
    { id: "unknown-base", values: { base: "two" } }, // not a base
    { id: "unknown-area", values: { area: "gtm" } }, // not an area
    { id: "search-too-long", values: { search: "x".repeat(201) } }, // the field holds 200
    { id: "mixed", values: { search: "path", question: "char" } }, // a translator field in a look-up
    { id: "lookup-in-translate", values: { mode: "translate", question: "char", value: "a", n: "1", base: "zero" } }, // a look-up field in a translation
    { id: "unknown-question", values: { mode: "translate", question: "word", value: "a", n: "1" } }, // not a question
    { id: "n-zero", values: { mode: "translate", question: "char", value: "a", n: "0" } }, // from 1
    { id: "n-over", values: { mode: "translate", question: "char", value: "a", n: "1001" } }, // to 1,000
    { id: "n-for-search", values: { mode: "translate", question: "search", value: "a", n: "1", needle: "a" } }, // a search takes no N
    { id: "sep-for-segment", values: { mode: "translate", question: "segment", value: "/a/b", n: "1", sep: "/" } }, // a separator only for a field
    { id: "field-without-sep", values: { mode: "translate", question: "field", value: "a.b", n: "1" } }, // a field needs one
    { id: "value-too-long", values: { mode: "translate", question: "char", value: "x".repeat(2001), n: "1" } }, // the field holds 2,000
    { id: "needle-for-char", values: { mode: "translate", question: "char", value: "a", n: "1", needle: "a" } }, // a needle only for a search
  ],
});
