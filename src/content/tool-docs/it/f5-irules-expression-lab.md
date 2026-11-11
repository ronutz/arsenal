## Cosa fa

Valuta un’espressione come fanno `expr`, `if` e `while` in un’iRule e mostra l’intera valutazione: il valore e il modo in cui è rappresentato, l’espressione con gli operandi di ogni operatore tra parentesi, così la precedenza è visibile, un albero di ogni passo e, per un confronto, cosa ricavano `==`, `eq`, `<` e `>` dagli stessi due operandi. Le variabili ricevono i valori da normali comandi `set`, quindi il quoting si comporta esattamente come in un’iRule.

Due modalità: **Tcl 8.4** (Tcl 8.4.6 puro, la base indicata da F5 nel K6091) e **iRules**, che aggiunge gli operatori documentati da F5 (`contains`, `starts_with`, `ends_with`, `equals`, `matches_glob`, `matches_regex`, `and`, `or`, `not`) e comandi di richiesta come `[HTTP::uri]`, a cui risponde una richiesta di esempio modificabile.

## Come leggere l’albero

Ogni riquadro è una parte dell’espressione: il suo testo sorgente, una freccia e ciò che ha prodotto. Gli operandi stanno sotto il loro operatore. Le note sotto un riquadro dicono cosa è successo lì, per esempio «Confrontati come interi: 10 e 10» per `$x == $y` con `x` impostato a `012`, oppure «Confrontati come testo perché il lato sinistro non è un numero». Una parte contrassegnata con «mai valutato» è stata saltata da `&&`, `||` o `?:`.

## Buono a sapersi

- `==` e gli altri operatori di confronto confrontano numeri quando entrambi i lati si leggono come numeri, e testo negli altri casi. `eq` e `ne` confrontano sempre il testo.
- In un confronto tra testi decidono i codici dei caratteri, quindi ogni lettera maiuscola viene prima di ogni lettera minuscola: `"bench" < "Chair"` è falso.
- `true == 1` è falso: `true` è una parola booleana, non un numero, quindi il confronto avviene tra testi.
- Tcl 8.4 non ha l’operatore `**`; `2 ** 3` è un errore di sintassi.
- La divisione intera arrotonda verso meno infinito (`7 / -2` dà `-4`) e il resto prende il segno del divisore.
- Un letterale come `08` scritto nell’espressione viene rifiutato quando l’espressione viene compilata, prima che ne venga eseguita qualsiasi parte.
- Racchiudi le espressioni tra graffe. Senza graffe Tcl sostituisce il testo due volte, il che è più lento e permette ai dati di essere eseguiti come codice (F5 K57410758 e K15650046). Lo strumento Script iRules passo passo mostra come avviene.

## Condivisione dei risultati

Sotto il risultato, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene per nome ciò che la valutazione legge: l’espressione come `#input=`, i comandi set come `&setup=`, `&mode=irules` in modalità iRules e, in quella modalità, i valori di esempio di `HTTP::uri` e `HTTP::host` se li hai modificati (`&uri=`, `&host=`). Tcl puro è la modalità predefinita e non viene incluso, né lo è un valore di esempio che Tcl puro non legge. I comandi set sono il punto in cui finiscono i valori copiati da un’iRule, quindi la pagina sottopone ogni campo che il link conterrebbe allo stesso controllo dei segreti degli strumenti di questo sito che leggono le iRule.

Prima ancora di offrire un link, cerca chiavi e credenziali scritte in chiaro nei punti in cui le collocano i riferimenti di F5 stessa (tutti consultati il 27/10/2026):

- la passphrase di `HTTP::cookie encrypt` e `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- una chiave nella forma di stringa `AES 128 <hex>`, o la chiave di `AES::encrypt` e `AES::decrypt` scritta in chiaro ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- il valore di `-key` o `-keyhex` in `CRYPTO::encrypt`, `decrypt`, `sign` e `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- un’intestazione `Authorization` o `Proxy-Authorization` scritta con `HTTP::header insert` o `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), il cui valore è definito dalla [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (sezioni 11.6.2 e 11.7.2) come le credenziali;
- un valore letterale assegnato con `set` a una variabile usata in uno di quei punti, come nell’esempio di `CRYPTO::encrypt` stesso;
- e, dal controllo dei segreti del sito, una chiave privata PEM, un JWT, un ID di chiave di accesso AWS o una password in un URL.

Quando la pagina ne trova uno, il link non viene creato: il riquadro a comparsa indica il campo e la riga, e tu sostituisci il valore con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto quello di un segreto (`set static::api_token "..."`) non blocca il link; viene invece indicato nella riga di avvertenza. Nessun controllo trova tutti i segreti, quindi rileggi ciò che invii.

Tutto ciò che il link contiene va dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un insieme di campi più lungo non riceve alcun link, e il riquadro a comparsa indica quanto è lungo.
- **Apertura di un link.** I campi vengono compilati come se li inserissi tu (una richiesta di esempio modificata dal link viene mostrata aperta), e la pagina li tiene in sospeso: una nota indica che provengono da un link condiviso, e nulla viene valutato finché non premi **Valuta** o modifichi un campo. L’interprete didattico non esegue mai da solo il testo di un link. Una modalità diversa da `tcl` o `irules`, o un valore di esempio in modalità Tcl puro, fa ignorare l’intero link. Accettati o no, i valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.

## Limiti

F5 documenta i suoi operatori a parola ma non la loro precedenza rispetto agli operatori Tcl; lo strumento colloca `contains`, `starts_with` e gli altri allo stesso livello di `==`, e `and` e `or` allo stesso livello di `&&` e `||`. `rand()` e `srand()` vengono rifiutati perché i loro risultati non si possono riprodurre. I comandi eseguiti all’interno di un’espressione (tra parentesi quadre) usano lo stesso piccolo interprete di Script iRules passo passo, limitato a 2000 comandi. Questo strumento non è offerto tramite l’API, perché esegue il Tcl che gli fornisci.

## Fonti

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consultato il 03/10/2026)
- [Manuale di Tcl 8.4: expr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm) (consultato il 03/10/2026)
- [Riferimento iRules di F5: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (consultato il 02/10/2026)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (consultato il 03/10/2026)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (consultato il 03/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
- [Riferimento iRules di F5: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) e [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (consultati il 27/10/2026): dove un’iRule contiene una passphrase, una chiave o delle credenziali, che bloccano un link di Condividi i risultati
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (consultata il 27/10/2026): sezioni 11.6.2 e 11.7.2, i valori di Authorization e Proxy-Authorization sono credenziali
