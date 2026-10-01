#!/bin/bash
# One-off pass over the href URLs the audit never saw. Null-separated input,
# because a URL containing a quote made xargs abort at 323 of 689 on the first
# attempt - and a truncated audit that prints a tally looks exactly like a
# complete one, which is the failure mode this whole session keeps meeting.
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
out="scratchpad/liveness-new.tsv"; : > "$out"
run() {
  local u="$1"
  read code hops final < <(curl -sS -o /dev/null -L -A "$UA" \
    -w "%{http_code} %{num_redirects} %{url_effective}" --max-time 20 "$u" 2>/dev/null || echo "000 0 -")
  printf '%s\t%s\t%s\t%s\n' "$code" "$hops" "$u" "$final" >> "$out"
}
export -f run; export UA out
tr '\n' '\0' < scratchpad/unchecked.txt | xargs -0 -P 16 -I{} bash -c 'run "{}"'
echo "=== checked: $(wc -l < "$out") of $(grep -c . scratchpad/unchecked.txt) ==="
cut -f1 "$out" | sort | uniq -c | sort -rn
