## What it does

You are looking at a WAF event, or an application log line, and it contains something like `%{(#_memberAccess["allowStaticMethodAccess"]=true)...}`. This tool reads that string and tells you what it was trying to do: which constructs are in it, whether they amount to disabling the expression sandbox, running a command, both, or neither, and which published advisory family the shape is consistent with. It runs entirely in your browser and it never evaluates any part of what you paste.

## What it is not

It is a decoder. It reads payloads that have already arrived somewhere and explains them. It does not construct payloads, it does not suggest variations on the one you pasted, and it holds no template library to draw from - everything it recognises is public syntax documented in Apache's own security bulletins and visible in the logs of anyone running a web server on the public internet. Explaining a captured artefact is the defensive half of the job. Producing new ones is not what this site is for, and the tool is built so that reading its source gives you nothing you could not get from the advisory.

## OGNL, in one paragraph

Object-Graph Navigation Language is an expression language for reading and writing the properties of Java objects. It exists so that a framework can let configuration reach into a running application - fetch this property, call that method, format the result. That is genuinely useful, and it is also the entire problem: an expression that can call methods on live objects is only safe while the expressions being evaluated were written by someone you trust. Apache Struts spent several years patching a family of flaws that all shared one shape, in which attacker-supplied input reached an evaluator that treated it as configuration.

## The two halves the tool looks for

A working attempt against the Struts family needed two things, and the tool reports them separately because the difference tells you what you are dealing with. The first is a sandbox escape: OGNL restricts what an expression may touch, through an object called `_memberAccess`, and the escape works by reaching that object and switching its restrictions off. The second is an execution primitive, usually a call to the JVM's `Runtime` object followed by `exec`, which starts an operating system process.

A payload with both is a genuine exploitation attempt and deserves the full treatment: establish whether the request was blocked, what the application did with it, and whether the runtime was patched. A payload with only the execution call is far more common and far less alarming, because on a patched runtime that call is simply refused - it usually means a scanner is working through a list rather than that anyone has looked at your application. A payload with expression syntax and nothing else is most often a probe, checking whether input gets evaluated at all before anything expensive is sent. That answer matters more than it sounds, because if the answer is no, nothing else in the list will work either.

## Advisory families

Where the shape is characteristic, the tool names the advisory family: the 2017 multipart parser flaw where the `Content-Type` header itself was evaluated when parsing failed, the wider member-access family whose fixes repeatedly tightened what an expression could reach, and the 2018 issue where namespace and result values were evaluated, making a URL path an execution vector. These are reported as consistent with the payload rather than as identification, because several families share a shape and a payload proves what was attempted rather than what was present.

## What it deliberately does not tell you

Three things, and they are shown every time rather than hidden behind a toggle, because the most dangerous way to read this page is to see no findings and conclude that everything is fine.

It cannot tell you whether the request was blocked. That is in the WAF event, not in the payload. It cannot tell you whether the application evaluated the expression, which depends on the framework version and configuration rather than on the string. And absence of a recognised construct is not absence of risk: payloads are routinely URL-encoded, double-encoded, or split across several parameters, so decode first and read afterwards. A clean result on an encoded payload means the tool read the encoding, not the attack.
