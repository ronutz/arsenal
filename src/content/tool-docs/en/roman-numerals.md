## What it does

Type a number (1 to 3999) and read its Roman numeral; type a numeral and read its value. The tool always shows the canonical subtractive form and how it is built place by place: 1994 is M + CM + XC + IV. Everything is computed in your browser.

## Honest validation

Historical additive spellings the Romans themselves used - IIII on clock faces, MDCCCCX on building facades - are accepted, valued correctly, and flagged with the canonical form beside them. Truly malformed strings are refused with the specific rule they break: IL is not a legal subtractive pair (only IV, IX, XL, XC, CD, CM subtract), VV repeats a symbol that never repeats, IIX subtracts two symbols where only one may be subtracted.

## Why it stops at 3999

The classical system has seven symbols, no zero, and nothing above M (1000). For larger values the Romans wrote a vinculum - an overline multiplying by 1000 - which has no plain-text form. Rather than invent a convention, the tool states the limit.
