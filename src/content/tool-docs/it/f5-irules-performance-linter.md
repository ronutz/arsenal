## Cosa fa

Incolla un’iRule: il linter segnala, riga per riga, un piccolo insieme di anti-pattern di prestazioni e di correttezza documentati da F5 e individuati con alta affidabilità, ciascuno con una gravità, il token incriminato, il motivo per cui conta e la correzione. È uno scanner statico (nessun parser Tcl, nessuna esecuzione), quindi copre volutamente solo i pattern che una scansione riga per riga può individuare in modo affidabile e con pochi falsi positivi. Non sostituisce la misurazione: per il costo reale di una regola, abbinalo al calcolatore del tempo di esecuzione delle iRule, che legge le statistiche di timing reali. Tutto viene eseguito in locale.

## Cosa segnala

Le **variabili nel namespace globale** (`$::x`, `set ::x`, la parola chiave `global`) vengono segnalate con gravità ALTA. Dalla v10 il validatore di F5 intercetta la parola chiave `global` e vincola il virtual server a una sola istanza TMM (CMP demotion), quindi un unico processore gestisce tutte le connessioni di quel virtual server; le variabili globali sono deprecate dalla v10. La forma obsoleta `$::datagroup` è ancora peggio: dalla versione 11 in poi, accedere a un data group in quel modo genera un errore di runtime Tcl e invia un reset al client. La correzione è il namespace `static::`, sicuro per CMP, per le costanti condivise, le normali variabili locali per i dati di ogni connessione, o il comando `class` per i data group.

**`expr` senza parentesi graffe** è un AVVISO. Tcl esegue la sostituzione e analizza di nuovo la forma senza graffe, e può sostituire due volte; racchiudere l’espressione tra graffe permette al compilatore di bytecode di ottimizzarla. La correzione è `expr { ... }`.

**`matchclass` / `findclass`** sono INFO. Entrambi sono stati deprecati nella v10 a favore del comando `class`, che secondo F5 offre funzionalità e prestazioni migliori. La correzione è `class match` / `class search`.

**`regexp` / `regsub`** sono INFO. Le espressioni regolari costano sensibilmente di più delle operazioni su stringhe fisse; quando la corrispondenza è un prefisso, un suffisso, un valore esatto o un glob semplice, `string`, `scan`, `switch -glob` o `class` sono più economici. Quando un’espressione regolare resta, la vista sulla portabilità degli [Strumenti per regex](/tools/regex) elenca i costrutti che si leggono diversamente nelle Advanced Regular Expressions di Tcl, la variante che quello strumento chiama BIG-IP iRules, rispetto a JavaScript o PCRE2.

## Cosa volutamente non segnala

Le variabili `static::` (sicure per CMP), `class match` / `class search` ed `expr` tra graffe sono corretti e passano senza rilievi. La persistenza, le tabelle e il comando `session` sono compatibili con CMP nelle versioni moderne, quindi non vengono trattati come problemi CMP. I commenti su riga intera vengono saltati.

## Condivisione dei risultati

Sotto il riepilogo dei rilievi, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` l’iRule così come l’hai incollata, e nient’altro. Prima che tu copi qualsiasi cosa, il riquadro a comparsa aggiunge un’avvertenza: un’iRule può riportare host, pool e data group interni.

Prima ancora di offrire un link, la pagina cerca nell’iRule chiavi e credenziali scritte in chiaro nei punti in cui le collocano i riferimenti di F5 stessa (tutti consultati il 27/10/2026):

- la passphrase di `HTTP::cookie encrypt` e `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- una chiave nella forma di stringa `AES 128 <hex>`, o la chiave di `AES::encrypt` e `AES::decrypt` scritta in chiaro ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- il valore di `-key` o `-keyhex` in `CRYPTO::encrypt`, `decrypt`, `sign` e `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- un’intestazione `Authorization` o `Proxy-Authorization` scritta con `HTTP::header insert` o `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), il cui valore è definito dalla [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (sezioni 11.6.2 e 11.7.2) come le credenziali;
- un valore letterale assegnato con `set` a una variabile usata in uno di quei punti, come nell’esempio di `CRYPTO::encrypt` stesso;
- e, dal controllo dei segreti del sito, una chiave privata PEM, un JWT, un ID di chiave di accesso AWS o una password in un URL.

Quando la pagina ne trova uno, il link non viene creato: il riquadro a comparsa indica la riga, e tu sostituisci il valore con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto quello di un segreto (`set static::api_token "..."`) non blocca il link; viene invece indicato nella riga di avvertenza. Nessun controllo trova tutti i segreti, quindi rileggi ciò che invii.

Tutto ciò che il link contiene va dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza.** Al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un’iRule più lunga non riceve alcun link, e il riquadro a comparsa indica quanto è lunga.
- **Apertura di un link.** Il testo riempie la casella come farebbe un incolla, e la pagina lo legge come legge un testo incollato; l’iRule non viene mai eseguita. Accettati o no, i valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.
