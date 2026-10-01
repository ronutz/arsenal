#!/bin/bash
# The first screen matched the year as a bare substring, which has two false
# positives I found by reading the captured sentences rather than trusting the
# count: "1980s" contains "1980", and a blog's archive sidebar or a post date
# contains years that assert nothing about the person. This screen requires the
# year NOT be followed by "s" (excluding a decade) and reports the strongest
# match found, so a year in running prose beats a year in a sidebar.
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
out="scratchpad/py-rescreen.tsv"; : > "$out"
while IFS=$'\t' read -r slug yr field verdict href; do
  [ "$verdict" != "STATES" ] && { printf '%s\t%s\t%s\t%s\t%s\n' "$slug" "$yr" "$field" "$verdict" "$href" >> "$out"; continue; }
  txt=$(curl -sS -L -A "$UA" --max-time 20 "$href" 2>/dev/null | sed 's/<[^>]*>/ /g' | tr -s ' \t\n' ' ')
  # A year NOT followed by "s": excludes the decade form.
  if printf '%s' "$txt" | grep -qE "$yr[^0-9s]"; then v="STATES-YEAR"; else v="DECADE-OR-NOISE"; fi
  printf '%s\t%s\t%s\t%s\t%s\n' "$slug" "$yr" "$field" "$v" "$href" >> "$out"
done < scratchpad/py-page-check.tsv
echo "=== tally ==="; cut -f4 "$out" | sort | uniq -c | sort -rn
echo "=== demoted from STATES ==="; awk -F'\t' '$4=="DECADE-OR-NOISE"{print "  "$1" ("$2")"}' "$out"
