#!/usr/bin/env tsx
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/gen-glossary-index.mts — THE SMALL INDEX BEHIND THE GLOSSARY'S "FIND A TERM"
// ----------------------------------------------------------------------------
// PRIME 16/11/2026 04:27 (split the glossary page). The hub no longer carries the
// 2,061 entries; its finder looks a term up by name instead, from this file,
// fetched only when the reader starts typing and never inlined in the page.
//
// WHAT IS IN IT: every entry's slug, name, expansion and other names, its kind
// and its domains: the fields a name lookup matches and the result line shows.
// No definitions: they are per language and would multiply the file by six;
// the result links to the entry, which has them. The names are the same in
// every language (a headword stays in its original language), so one file
// serves every locale.
//
// WHERE IT GOES: public/glossary-index.json, gitignored like the home page's
// index (scripts/gen-home-index.mts): CI regenerates it on every build, from
// the same registry the pages render from, so the finder cannot name an entry
// the site does not have.
//
// Shape: { v: 1, kinds: [..], domains: [..], e: [[slug, name, expansion,
// [other names], kind index, [domain indexes]], ..] }, A to Z by name.
// ============================================================================

import fs from "node:fs"; // writing the file
import path from "node:path"; // its place
import { getAllGlossaryEntries, getGlossaryDomains, getGlossaryKinds } from "../src/content/glossary/glossary"; // the registry

const TAG = "[gen-glossary-index]"; // every line of output starts with it
const OUT = path.join(process.cwd(), "public", "glossary-index.json"); // the file
const kinds = getGlossaryKinds(); // the kinds, in precedence order
const domains = getGlossaryDomains(); // the domains in use, in canonical order
const entries = getAllGlossaryEntries(); // every entry, A to Z
const seen = new Set<string>(); // slugs already written, to refuse a duplicate
const e = entries.map((x) => {
  if (seen.has(x.slug)) throw new Error(`${TAG} duplicate slug ${x.slug}`); // the registry must not repeat one
  seen.add(x.slug); // remembered
  const k = kinds.indexOf(x.kind); // the kind's index
  if (k < 0) throw new Error(`${TAG} ${x.slug}: unknown kind ${x.kind}`); // never a silent -1
  const ds = x.domains.map((d) => domains.indexOf(d)); // the domains' indexes
  if (ds.some((i) => i < 0)) throw new Error(`${TAG} ${x.slug}: a domain outside the list`); // never a silent -1
  return [x.slug, x.headword, x.expansion ?? "", x.aliases ?? [], k, ds]; // one compact row
});
const body = JSON.stringify({ v: 1, kinds, domains, e }); // compact: fetched by phones
fs.writeFileSync(OUT, body + "\n", "utf-8"); // written
console.log(`${TAG} OK: ${e.length} entries, ${Math.round(body.length / 1024)} KiB, public/glossary-index.json`); // the record
