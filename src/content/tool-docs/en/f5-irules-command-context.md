# iRules command / context explainer

An iRule is Tcl with a contract: code runs when events fire, commands are valid in some events and not others, and a handful of constructs quietly cost you every CPU core but one. This tool reads the contract back.

Paste an iRule and every `when` block renders as a card. The event's identity comes from the Master List of iRule Events on clouddocs, condensed faithfully, with its module and a link to its reference page; events outside the curated BIG-IP LTM - Local Traffic Manager scope table still parse and are flagged rather than guessed at. The block's commands are inventoried, namespaced and bare alike, each linked directly to its reference page.

When an event appears in more than one block, the evaluation order renders per the priority command's documented rules: values 0 to 1000, default 500, lower runs first, same priority runs in insertion order, and across multiple iRules on one virtual the rule listing order breaks the remaining ties.

The CMP audit is the part that pays rent, and every finding is sourced to the CMP Compatibility page. Global variables are not CMP-compatible; the validator catches the global form as of v10 and the virtual server is demoted, which means every connection it carries lands on a single TMM. The documented alternative for shared statics is the `static::` namespace, and the tool says so on sight. Keys generated in RULE_INIT get one instance per TMM, so cross-TMM decryption fails; statistics profiles count per TMM instance. The audit names each of these where it sees them.

One honesty note, engineered in deliberately: per-command event-validity lists live on each command's own reference page and vary by version, so the tool links every command's page rather than reproducing validity tables it has not verified. A single event name renders its card; the word `events` renders the module-grouped catalogue.

The iRule is parsed and read, never executed. Everything runs locally; nothing you paste leaves the page.
