## Cosa fa

Esegue un breve frammento un comando alla volta e mostra ogni comando in tre modi: come è scritto, come le parole che ha effettivamente ricevuto dopo che Tcl ha sostituito variabili, comandi e barre rovesciate, e ciò che ha restituito. Sotto ogni comando vedi le variabili che ha modificato, il ramo preso da `if` o `switch` e ogni espressione valutata, sotto forma di albero. Le righe di log vengono raccolte, e azioni come `pool`, `HTTP::redirect`, `drop` o `reject` vengono annotate invece che eseguite.

In modalità **iRules** i comandi di richiesta (`HTTP::uri`, `HTTP::host`, `HTTP::method`, `HTTP::header`, `IP::client_addr` e altri) rispondono in base a una richiesta di esempio modificabile, e un blocco `when` esegue il suo corpo una volta, come se l’evento fosse scattato.

## Come leggere i passi

I comandi sono elencati nell’ordine in cui sono iniziati. Un comando rientrato è stato eseguito all’interno di quello sopra: nel suo corpo, oppure tra parentesi quadre mentre venivano costruite le parole del comando esterno, il che significa che è terminato prima che il comando esterno venisse eseguito. «ha ricevuto» mostra le parole così come il comando le ha ricevute; il contorno tratteggiato segna dove inizia e finisce ogni parola, ed è ciò che decide il quoting.

## Buono a sapersi

- `"$a$b"` unisce due valori senza nulla in mezzo; `"$a $b"` mantiene lo spazio.
- `append` aggiunge il testo esattamente come è dato; `concat` elimina gli spazi bianchi alle due estremità di ogni argomento, scarta quelli vuoti e unisce il resto con spazi singoli; `lappend` aggiunge elementi di lista.
- Per `foreach` una stringa con spazi è una lista: `foreach item "red green blue"` viene eseguito tre volte.
- `incr` legge `010` come 8 ottale, quindi il risultato è 9.
- `switch` legge come opzione qualsiasi parola che inizi con un trattino. Metti `--` prima del valore (F5 K15650046), altrimenti un valore come `-foo` rompe il comando.
- Un `expr` senza graffe esegue la sostituzione due volte: se una variabile contiene `[log local0. "x"]`, quel comando viene eseguito (F5 K57410758). Lo mostra l’esempio «Doppia sostituzione».

## Condivisione dei risultati

Sotto l’esito dell’esecuzione, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene per nome ciò che l’esecuzione legge: lo script come `#input=`, `&mode=irules` in modalità iRules e, in quella modalità, ogni campo della richiesta di esempio che hai modificato (`&uri=`, `&host=`, `&method=`, `&agent=` per lo User-Agent). Tcl puro è la modalità predefinita e non viene incluso, né lo è un valore di esempio che Tcl puro non legge. Uno script è di solito un pezzo di un’iRule reale, quindi prima che tu copi qualsiasi cosa il riquadro a comparsa aggiunge un’avvertenza (uno script può riportare host, pool e data group interni), e la pagina sottopone ogni campo che il link conterrebbe allo stesso controllo dei segreti degli strumenti di questo sito che leggono le iRule.

Prima ancora di offrire un link, cerca chiavi e credenziali scritte in chiaro nei punti in cui le collocano i riferimenti di F5 stessa (tutti consultati il 27/10/2026):

- la passphrase di `HTTP::cookie encrypt` e `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- una chiave nella forma di stringa `AES 128 <hex>`, o la chiave di `AES::encrypt` e `AES::decrypt` scritta in chiaro ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- il valore di `-key` o `-keyhex` in `CRYPTO::encrypt`, `decrypt`, `sign` e `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- un’intestazione `Authorization` o `Proxy-Authorization` scritta con `HTTP::header insert` o `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), il cui valore è definito dalla [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (sezioni 11.6.2 e 11.7.2) come le credenziali;
- un valore letterale assegnato con `set` a una variabile usata in uno di quei punti, come nell’esempio di `CRYPTO::encrypt` stesso;
- e, dal controllo dei segreti del sito, una chiave privata PEM, un JWT, un ID di chiave di accesso AWS o una password in un URL.

Quando la pagina ne trova uno, il link non viene creato: il riquadro a comparsa indica il campo e la riga, e tu sostituisci il valore con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto quello di un segreto (`set static::api_token "..."`) non blocca il link; viene invece indicato nella riga di avvertenza. Nessun controllo trova tutti i segreti, quindi rileggi ciò che invii.

Tutto ciò che il link contiene va dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; uno script più lungo non riceve alcun link, e il riquadro a comparsa indica quanto è lungo.
- **Apertura di un link.** I campi vengono compilati come se li inserissi tu (una richiesta di esempio modificata dal link viene mostrata aperta), e la pagina tiene in sospeso lo script: una nota indica che proviene da un link condiviso, e nulla viene eseguito finché non premi **Esegui** o modifichi un campo. L’interprete didattico non esegue mai da solo il testo di un link. Una modalità diversa da `tcl` o `irules`, o un valore di esempio in modalità Tcl puro, fa ignorare l’intero link. Accettati o no, i valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.

## Limiti

È un interprete didattico, non il TMM. Modella i comandi elencati nel codice di questa pagina e si ferma dopo 2000 comandi, con valori oltre 1.000.000 di caratteri e a 200 livelli di annidamento. Array, `proc`, `regexp`, `table`, `after` e il file system non sono modellati; non sono disponibili nemmeno i comandi che F5 disattiva nelle iRules (K36322151). La temporizzazione degli eventi, lo stato delle connessioni e gli altri eventi sono fuori ambito. Lo strumento non è offerto tramite l’API, perché esegue il Tcl che gli fornisci.

## Fonti

- [Manuale di Tcl 8.4: Tcl (le regole di sostituzione)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (consultato il 03/10/2026)
- [Manuale di Tcl 8.4: append](https://www.tcl-lang.org/man/tcl8.4/TclCmd/append.htm), [concat](https://www.tcl-lang.org/man/tcl8.4/TclCmd/concat.htm), [lappend](https://www.tcl-lang.org/man/tcl8.4/TclCmd/lappend.htm), [incr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/incr.htm) e [switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (consultati il 03/10/2026)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consultato il 03/10/2026)
- [F5 K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (consultato il 03/10/2026)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (consultato il 03/10/2026)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (consultato il 03/10/2026)
- [Riferimento iRules di F5: log](https://clouddocs.f5.com/api/irules/log.html) (consultato il 02/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
- [Riferimento iRules di F5: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) e [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (consultati il 27/10/2026): dove un’iRule contiene una passphrase, una chiave o delle credenziali, che bloccano un link di Condividi i risultati
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (consultata il 27/10/2026): sezioni 11.6.2 e 11.7.2, i valori di Authorization e Proxy-Authorization sono credenziali
