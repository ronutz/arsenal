## What it does

Paste a FortiOS configuration block and the tool returns the structure as a tree with every verb explained: what `config`, `edit`, `set`, `unset`, `append`, `next`, `end` and `abort` each do, and where the block sits at each line. Local and offline; it reads structure, not semantics.

## The trap it exists to catch

**`set` on a multi-value field replaces the whole list.** `set srcaddr "internal-net"` on a policy that had four source addresses leaves it with one — successfully, silently, with nothing in the output mentioning it. The command that adds is **`append`**.

The tool warns on every `set` against a known list field, naming the field and the line. That is the single most expensive habit in FortiOS CLI work and it is invisible in a block read casually — which is exactly when blocks get read.

## Two more it always says

- **`edit` creates what it cannot find.** A mistyped policy ID does not produce an error, it produces a policy.
- **`end` is the only line that commits.** `next` closes an entry and stays in the table; `abort` closes and discards. A block using `end` where `next` was meant leaves the table early and every remaining edit lands somewhere else.

It also reports **unclosed blocks**, because an unclosed block has committed nothing and pasting one into a live session leaves you somewhere unexpected.

## What it will not do

It does not know your address objects, your policies or your VDOM layout, and it cannot say whether a value is sensible. It answers whether the command shape does what the person typing it probably expected — which is a different and often more useful question.

It also cannot know what was in a field before. When it warns that a `set` replaces a list, **the question it is asking you to answer is what that list contained.**
