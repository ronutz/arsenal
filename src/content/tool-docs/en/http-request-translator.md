## What it does

Paste a `curl` command and the tool explains it flag by flag, then translates it into four other forms: a browser `fetch` call, a raw HTTP request, an HTTPie command, and Python `requests` code. The command is tokenized and decoded in your browser; nothing is ever sent, and no request is run.

## One parse, five views

Under the hood there is a single step: the tool parses your `curl` command into one request model, capturing the method, the URL, the headers, the body, authentication, and the other options. Everything you see is derived from that one model. Because translating a command correctly already requires understanding every flag, the flag-by-flag explanation is just that same model shown with labels, which is why the explanation and the translations always agree.

## The forms it produces

- **curl explained.** Each option is named and described, so an unfamiliar flag stops being a mystery.
- **fetch.** The browser Fetch API call, following the MDN semantics, ready to drop into JavaScript.
- **Raw HTTP.** The actual request line, headers, and body as they would go on the wire, which is the clearest way to see exactly what a request is.
- **HTTPie.** The equivalent `http` command, for those who prefer that client.
- **Python requests.** The equivalent code using the Requests library.

## Why translate rather than run

The tool deliberately never executes the request. That is a privacy and safety choice: you can decode and convert a command that carries credentials or points at an internal host without any of it leaving your browser, and without triggering whatever the request would do. It is a translator and an explainer, not a client.

## Using it

Paste a `curl` command and read the flag-by-flag explanation and the four translations. The conversion is deterministic and local, so the same command always produces the same output.
