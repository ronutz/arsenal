## What it does

Compare two blocks of text and see exactly what changed: a line-by-line view of additions and deletions, with word-level highlighting inside lines that were edited so you can spot the specific change. You can optionally ignore whitespace or case. Everything is computed in your browser; your text is never sent anywhere.

## How a diff is computed

A good diff is not a naive line-by-line comparison; it finds the smallest set of changes that turns the first text into the second. The tool does this by computing the **longest common subsequence** (LCS) of the two texts: the longest sequence of tokens that appears, in order, in both. Whatever is in that common subsequence is unchanged; everything in the first text but not in the LCS is a **deletion**, and everything in the second text but not in the LCS is an **insertion**. This is the idea at the heart of the classic Myers diff algorithm, and it produces a minimal edit script, the fewest additions and deletions that explain the difference.

## Two levels: lines and words

The same LCS operation runs at two granularities. For the main view, the tokens are whole lines, which gives you the familiar added-and-removed line list. For a line that changed rather than being added or removed outright, the tool runs the diff again with words, spaces, and punctuation as the tokens, and highlights just the parts of the line that actually differ. That inline highlighting is what turns "this line changed" into "this word changed".

## Determinism

When two different edit scripts are equally short, a diff has to pick one, and the tool always picks the same way (it prefers a deletion when the two directions are equally good). That fixed tie-break makes the output deterministic: the same two inputs always produce the same diff, with no dependence on timing or anything external.

## Using it

Paste the original text in one side and the changed text in the other, and read the line-by-line differences with inline word highlights. Turn on the ignore-whitespace or ignore-case options when you care about content rather than formatting.
