## What it does

PingFederate lets you write OGNL expressions in attribute mappings and issuance criteria, for the cases where a plain mapping is not enough. This tool reads one of those expressions and explains it construct by construct, then raises the things that tend to go wrong in production rather than in testing. It runs in your browser and it never evaluates the expression.

## Why the context selector matters

An attribute mapping and an issuance criterion are both expressions, and they are supposed to return different things. A mapping produces the value that gets sent onward in the assertion or token. A criterion produces true or false, and issuance proceeds only when it is true. Choosing the wrong one is a common configuration error, and it does not fail loudly: a criterion that returns a string rather than a boolean will behave in ways that look like an authorisation problem somewhere else entirely. The selector exists so the tool can tell you when what you have written does not match where you are putting it.

## What it explains

The recognised constructs are the ones that appear in real mappings: reading an attribute by name, checking it for null, converting a value to a string, normalising case, the string operations that strip a domain off a username or tidy whitespace a directory has been carrying since 2004, conditionals that supply a default, map literals that translate directory group names into application role names, and the projections and selections that handle multi-valued attributes such as group membership.

## The diagnostics, and why each one is there

**Attributes read without a null check.** This is the single most common cause of an expression that works in testing and fails in production, and the reason is unglamorous: the accounts used for testing are tidier than the directory. An attribute that is always present on your own account is not always present on everyone's, absent is not the same as empty, and both occur. The tool names the attributes it saw being read so you can decide which of them you are actually confident about.

**Static Java method calls.** Constructs like `@java.lang.String@format` are supported and sometimes exactly right. They are also the reason expression authoring is a separate administrative role in the product: the same construct that formats a date can reach a great deal more than a date. Flagging it is not a suggestion to remove it, it is a note that this expression is doing something that only the expression role should be able to do.

**A criterion with nothing that compares.** If an issuance criterion contains no comparison, no membership test and no pattern match, it is unlikely to be returning a boolean, whatever it is returning instead.

**A mapping that just passes an attribute through.** Legitimate, and usually achievable without an expression at all. Worth preferring when you can, because a plain mapping is visible to every administrator while an expression is editable only by the expression role - and the person debugging it at some future date may not have that role.

**Expressions that have grown long.** Long expressions are hard to review, harder to hand over, and invisible to everyone without the expression role, which includes most of the people who will eventually be responsible for them.

## Why it never evaluates

An expression explainer that evaluated expressions would be a code execution service, which is exactly the property that makes expression authoring a gated privilege inside PingFederate itself. The tool parses and describes. If you want to know what an expression returns for a given user, the place to find out is a test connection in a non-production environment, not a web page.
