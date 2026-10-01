#!/bin/bash
# The screening grep only proved the year string appears on the page. To write
# an honest label the year must be attached to the RIGHT event, so capture the
# surrounding sentence for each hit and read it. This is the difference between
# "the page contains 1983" and "the page says the GNU announcement was 1983".
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
out="scratchpad/py-context.txt"; : > "$out"
while IFS=$'\t' read -r slug yr field verdict href; do
  [ "$verdict" != "STATES" ] && continue
  {
    echo "##### $slug ($yr) $href"
    curl -sS -L -A "$UA" --max-time 20 "$href" 2>/dev/null \
      | sed 's/<[^>]*>/ /g' | tr -s ' \t\n' ' ' \
      | grep -oE ".{150}$yr.{150}" | head -3
    echo
  } >> "$out"
done < scratchpad/py-page-check.tsv
wc -l "$out"
