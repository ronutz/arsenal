#!/bin/bash
# For every still-unnamed personYear entry, fetch each cited page and report
# whether the page ITSELF states the year. A page that states it means the
# remedy is a label that names what the page says - verifiable, no new source
# needed. A page that does not means the year needs a source or a declaration.
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
out="scratchpad/py-page-check.tsv"; : > "$out"
while IFS=$'\t' read -r slug yr field hrefs; do
  [ -z "$slug" ] && continue
  verdict="NO-HREF"; hit=""
  for h in $hrefs; do
    body=$(curl -sS -L -A "$UA" --max-time 20 "$h" 2>/dev/null)
    code=$?
    if [ $code -ne 0 ] || [ -z "$body" ]; then verdict="FETCH-FAIL"; continue; fi
    if printf '%s' "$body" | sed 's/<[^>]*>/ /g' | grep -q "$yr"; then verdict="STATES"; hit="$h"; break; else verdict="SILENT-PAGE"; hit="$h"; fi
  done
  printf '%s\t%s\t%s\t%s\t%s\n' "$slug" "$yr" "$field" "$verdict" "$hit" >> "$out"
done < <(cat scratchpad/py-prose.txt scratchpad/py-silent.txt)
echo "=== tally ==="; cut -f4 "$out" | sort | uniq -c | sort -rn
