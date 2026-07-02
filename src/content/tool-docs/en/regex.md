## What it does

Test, explain, and debug a regular expression. Enter a pattern and some text and the tool shows every match with its capture groups live as you type; enter a pattern on its own and it breaks the pattern into annotated pieces so you can read what each part does; and throughout, it warns when a pattern is at risk of catastrophic backtracking. It uses the JavaScript (ECMAScript) regex engine and runs entirely in your browser.

## Three jobs in one

The tool does the three things you actually want from a regex workbench:

- **Test.** It compiles your pattern and flags, reports any syntax error in plain terms, and runs the pattern against your input, returning every match along with its numbered and named capture groups. The number of matches it collects is capped, so a pattern that matches a huge input cannot lock up the page.
- **Explain.** It parses the pattern into annotated tokens, labeling each quantifier, character class, group, and assertion, so you can understand a regex without running it in your head.
- **Check for ReDoS.** It looks for the structures that cause catastrophic backtracking and warns you about them.

## What ReDoS is, and why it matters here

Regular expression Denial of Service (ReDoS) happens when a pattern can backtrack an exponential number of ways on certain inputs, so a short string makes the engine run effectively forever. The classic shape is a quantifier applied to a group that itself contains a quantifier, like `(a+)+`, matched against input that ultimately fails. This matters directly in the browser: a synchronous regex match cannot be interrupted, so a catastrophic pattern would hang the page. That is why the tool both caps its work and flags risky patterns, and it is a real warning to heed before shipping a pattern that will run on untrusted input.

## The engine and its flavor

Regex syntax varies between languages, and this tool uses the JavaScript flavor defined by the ECMAScript specification, with its flags (global, ignore-case, multiline, dotall, unicode, and sticky) and its support for named groups and lookarounds. If you are writing regex for JavaScript, or for anything that shares its semantics, what you see here is what you will get.

## Using it

Enter a pattern and flags, and optionally some text to match against, and read the live matches, the token-by-token explanation, and any backtracking warning. Everything is computed locally.
