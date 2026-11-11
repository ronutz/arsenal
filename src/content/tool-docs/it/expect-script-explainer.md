## Cosa fa

Legge uno script [Expect](/glossary/expect) e lo spiega a partire dal solo testo: cosa avvia con spawn, cosa attende e come, cosa digita e se un ritorno carrello chiude la riga, quando passa la tastiera all’utente. I comandi sono elencati nell’ordine del sorgente con il loro annidamento, quindi vengono letti anche i corpi di `expect`, `if`, `foreach`, `while`, `for`, `switch`, `catch` e `proc`. Dalle coppie `expect` e `send` ricostruisce il dialogo che lo script conduce, e riporta rilievi secondo venti regole, ognuna legata a una riga e ognuna con un rimando al manuale `expect(1)` o al sorgente di Expect 5.45.4. Lo script viene analizzato con il parser [Tcl](/glossary/tcl) del sito (la sintassi di Expect è quella di Tcl): le regole di Tcl 8.4 più l’espansione degli argomenti `{*}` di Tcl 8.5 e successivi. Non viene mai eseguito: nulla viene avviato, nulla viene inviato.

Per andare nella direzione opposta, da un host, un metodo di accesso, un dispositivo e un elenco di comandi a uno script che supera tutte le verifiche qui sotto, usa il [generatore di script Expect](/tools/expect-script-builder). Un file di monitor Scripted di BIG-IP LTM, le cui righe sono solo `send` ed `expect` e non sono Tcl, viene letto dall’[analizzatore di monitor Scripted BIG-IP](/tools/bigip-scripted-monitor-explainer).

## Come legge gli argomenti di expect

Gli argomenti di `expect`, `expect_user`, `expect_before` ed `expect_after` vengono letti come li legge Expect 5.45.4 (`expect.c`), non come appaiono:

- Un singolo argomento tra graffe è un elenco di pattern e corpi solo quando un a capo precede il suo primo carattere non vuoto. Altrimenti l’intero blocco è un solo argomento: un unico pattern glob. La sezione CAVEATS del manuale lo definisce un’euristica e indica `-brace` per forzare l’elenco e `-nobrace` per forzare un solo argomento; entrambi vengono letti come tali.
- Una parola che comincia con `-` è un’opzione (flag), con il nome completo o un’abbreviazione univoca (`-re` per `-regexp`, `-exa` per `-exact`). `-gl`, `-re`, `-ex` e `--` fanno della parola successiva un pattern, qualunque aspetto abbia.
- `eof`, `timeout`, `full_buffer`, `null` e `default` sono parole chiave quando sono scritte esattamente così, tra virgolette o no.
- La parola dopo un pattern è sempre il suo corpo.

## Cosa verifica

- **E1, un segreto in chiaro (errore):** un letterale inviato subito dopo un prompt che chiede una password, o un letterale assegnato a una variabile il cui nome dice password, secret o token. Nell’output il valore è mascherato. Prendi i segreti dalla riga di comando (`lindex $argv N`), dall’ambiente (`$env(NAME)`) o dall’utente (`stty -echo`, `expect_user`).
- **E2, il timeout (avviso o nota):** `set timeout -1` è un timeout infinito; un `expect` eseguito prima di qualsiasi `set timeout` ha usato il valore predefinito. `expect(1)`: «The default timeout period is 10 seconds but may be set, for example to 30, by the command "set timeout 30". An infinite timeout may be designated by the value -1.»
- **E3, un pattern che corrisponde troppo presto (avviso o nota):** `"*"` e `-re ".*"`, che secondo `expect(1)` svuotano il buffer di output senza leggere altro output dal processo («will flush the output buffer without reading any more output from the process»); i prompt di un solo carattere come `">"`, che corrispondono al primo carattere di quel tipo in qualsiasi punto dell’output; e `"$"` da solo, che in un pattern glob è l’ancora di fine: corrisponde subito a un buffer vuoto e non corrisponde mai a testo già in attesa (`exp_glob.c` nella 5.45.4, verificato con il vero `expect`), quindi non attende mai il prompt di una shell. Anche una regexp composta solo da `$` o `^` corrisponde subito. I pattern non sono ancorati; il manuale incoraggia `$` se puoi descrivere esattamente i caratteri alla fine di una stringa («if you can exactly describe the characters at the end of a string»), quindi scrivi il prompt con ciò che lo precede: `-ex "$ "` o `-re {\$ $}`.
- **E4, lo script termina con un send (avviso):** nulla legge la risposta del programma. «Upon exiting, all connections to spawned processes are closed.»
- **E5, manca il ritorno carrello (nota o avviso):** un `send` la cui stringa non termina con `\r` o `\n`; e un `send {...\r}` tra graffe, dove Tcl non sostituisce nulla, quindi il programma riceve un backslash e una r. `expect(1)`: «Characters are sent immediately although programs with line-buffered input will not read the characters until a return character is sent. A return character is denoted "\r".»
- **E6, un newline dove serve un ritorno carrello (nota):** la stringa termina con `\n`.
- **E7, nessun gestore del timeout (nota):** expect su pattern ordinari senza un pattern `timeout` (o `default`). «If no timeout keyword is used, an implicit null action is executed upon timeout», e lo script prosegue come se il pattern avesse trovato corrispondenza.
- **E8, `exp_continue` fuori dal corpo di un expect (errore).**
- **E9, sostituzione dentro un pattern tra virgolette (avviso o nota):** il contenuto tra parentesi quadre (`[brackets]`) viene eseguito come comando e le variabili (`$names`) vengono sostituite prima che Expect legga il pattern, sia nella forma su una riga sia nel blocco tra graffe: «In this one case, the usual Tcl substitutions will occur despite the braces.»
- **E10, la domanda sulla chiave dell’host (nota):** `ssh` avviato senza `StrictHostKeyChecking=no`, `off` o `accept-new`, e nessun pattern che risponda a una domanda `(yes/no)`. Il valore predefinito di OpenSSH è `ask` (ssh_config(5)).
- **E11, `sleep` (nota):** un’attesa fissa dove un `expect` attenderebbe l’evento.
- **E12, `log_user 0` mai seguito da `log_user 1` (nota).**
- **E13, `set timeout` dopo il primo expect (avviso):** quell’expect è stato eseguito con il valore predefinito.
- **E14, nessun processo avviato (nota).**
- **E15, `stty -echo` mai seguito da `stty echo` (avviso):** l’idioma stesso del manuale per leggere una password ripristina l’echo appena la password è stata letta.
- **E16, `close` senza `wait` (nota):** «close does not call wait since there is no guarantee that closing a process connection will cause it to exit.»
- **E17, un send prima del primo expect (avviso):** «It is a good idea to precede the first send to a process by an expect. expect will wait for the process to start, while send cannot.»
- **E18, `set timeout` dentro una procedura senza `global timeout` (nota):** le variabili scritte sono sempre nello scope locale, a meno che non sia stato dato un comando global («variables written are always in the local scope (unless a "global" command has been issued)»), quindi il valore vale solo per gli expect di quella procedura.
- **E19, un blocco tra graffe letto come un unico pattern (avviso):** un `expect {...}` tra graffe il cui primo pattern sta sulla stessa riga della graffa di apertura, che il blocco sia scritto su una riga o prosegua sotto. Expect 5.45.4 lo legge come un unico pattern glob, l’intero testo del blocco, che l’output non contiene quasi mai, quindi nessuno dei rami interni viene eseguito, nemmeno il ramo `timeout`, e segue l’azione nulla implicita. Verificato con il vero `expect`: un blocco su una riga, con il testo presente, è tornato dopo l’intero timeout senza eseguire alcun ramo. Comincia il blocco con un a capo dopo la graffa, oppure scrivi `expect -brace {...}`.
- **E20, un pattern letto come flag (errore):** un pattern che comincia con `-`, come `"--More--"`, tra virgolette o tra graffe o dentro un blocco tra graffe. `expect` legge come flag ogni parola che comincia con `-`, quindi il comando fallisce con `bad flag` (o `ambiguous flag`) e lo script si ferma. `expect(1)`: «Any pattern beginning with a "-" should be protected» con `-gl`; anche `-ex` e `--` lo proteggono.
- **Sintassi:** il punto in cui il parser si ferma (una graffa mancante, una virgoletta non chiusa), con il messaggio di Tcl stesso; i comandi che lo precedono vengono comunque spiegati. L’espansione degli argomenti `{*}` (regola [5] di Tcl(n), Tcl 8.5 e successivi) è accettata, e il riepilogo indica le righe che la usano.

## Come leggere l’output

Il riepilogo dice se Tcl legge l’intero script, conta i rilievi, indica i programmi avviati, riporta il timeout in vigore al primo `expect` (l’opzione `-timeout`, poi un valore impostato nella stessa procedura, poi il `set timeout` dello script, altrimenti il valore predefinito), e dice se lo script termina con `interact`, attende `eof` o non attende mai la fine del programma. La tabella del dialogo abbina ogni `expect` sul processo al `send` che gli risponde; un valore mascherato lì è un segreto che lo script ha digitato in chiaro, e un intero blocco mostrato come un unico pattern è la lettura E19. Sotto ogni `expect` sono elencati i pattern con il loro tipo di corrispondenza (glob per impostazione predefinita, `-re`, `-ex`, `-nocase`) e le parole chiave `eof`, `timeout`, `full_buffer`, `null` e `default` con ciò che ciascuna rappresenta.

## Limiti

- I corpi vengono letti nell’ordine del sorgente. L’analizzatore non può sapere quale ramo prende un’esecuzione, quante volte gira un ciclo o se una procedura viene mai chiamata; un `set timeout` dentro una procedura che dichiara `global timeout` viene letto nel punto in cui la procedura è definita.
- Le stringhe e i pattern che dipendono da una variabile sono mostrati come scritti (`$env(PW)\r`), non con il loro valore. Una parola espansa con `{*}` viene letta come una sola parola, perché il numero di parole in cui si trasforma dipende dal suo valore.
- Il rilevamento dei segreti è un’euristica: un letterale di una sola parola inviato subito dopo un prompt di password, o memorizzato in una variabile con un nome da password. Una password inviata dopo un prompt che lo script non nomina come tale non viene individuata.
- `expect_before`, `expect_after` ed `expect_user` vengono spiegati ma non aggiunti al dialogo, perché da soli non attendono il processo. `interact`, `expect_tty` ed `expect_background` leggono un singolo argomento tra graffe con lo stesso test di `expect`, ma l’analizzatore non ne legge i rami.
- Dopo un E20 l’analizzatore legge la parola come il pattern che l’autore intendeva; il vero `expect` si ferma lì.
- Le sequenze di escape con backslash mantengono la lettura di Tcl 8.4: `\x` prende tutte le cifre esadecimali che seguono e `\U` non è una sequenza di escape. In Tcl 8.6 e 9.0, `\x` prende una o due cifre e `\U` fino a otto.
- I riferimenti ad array come `$env(HOME)` sono accettati; l’indice viene mantenuto come testo.

## Strumenti correlati e letture

- **Pattern `-re`.** expect(1): «Regexp-style patterns follow the syntax defined by Tcl's regexp» command. La vista sulla portabilità degli [Strumenti per regex](/tools/regex) elenca i costrutti che le Advanced Regular Expressions di Tcl leggono diversamente da JavaScript o PCRE2.
- **Laboratori.** Tre delle regole si possono provare nei laboratori degli articoli della sezione Imparare: la sostituzione dentro un pattern tra virgolette (E9) nel [laboratorio sulla sostituzione Tcl](/learn/tcl-for-expect-writers#lab-tcl-substitution), quale pattern vince e quando (E3) nel [laboratorio sulla corrispondenza nel buffer](/learn/expect-patterns-and-the-buffer#lab-expect-buffer-matching), e il timeout con il ramo che viene eseguito quando scade (E2, E7) nel [laboratorio sul timeout](/learn/expect-timeouts-eof-and-loops#lab-expect-timeout-timeline).
- **La serie.** [Expect against network devices](/learn/expect-against-network-devices) tratta prompt, paginatori e privilegi su cinque piattaforme, e [Debugging Expect](/learn/expect-debugging-and-logging) ciò che `exp_internal` e un file di log mostrano quando uno script si comporta male.

## Condivisione dei risultati

Sotto il riepilogo, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` una copia dello script in cui ogni segreto segnalato dalla regola E1 (un letterale digitato subito dopo una domanda di password, o assegnato a una variabile con un nome da password) è sostituito dai pallini che questa pagina mostra al suo posto, uno per carattere. La copia si legge allo stesso modo: E1 segnala ancora la stessa riga con la stessa anteprima mascherata, e il dialogo, gli altri rilievi e i fatti non cambiano. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Indica anche quante password la copia ha sostituito. Una password scritta con sequenze di escape non può essere sostituita carattere per carattere, quindi non riceve alcun link: scrivila in chiaro o, meglio, leggila dall’ambiente, come consiglia la stessa E1. Uno script nomina host, utenti e comandi, quindi il riquadro a comparsa ti chiede di rileggerlo prima di inviare il link. Poi nella copia viene cercata qualsiasi altra credenziale definita da uno standard (una chiave privata PEM, una riga `Authorization` in un send, una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1), un ID della chiave di accesso AWS, un valore `ENC` di FortiOS): una sola significa niente link, e il riquadro a comparsa ne indica la riga.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La copia riempie la casella come farebbe un incolla e la pagina la legge, in modo statico: nulla viene avviato, eseguito o inviato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

- [expect(1), la pagina di manuale di Expect (Don Libes, NIST; Expect versione 5)](https://www.tcl-lang.org/man/expect5.31/expect.1.html) (consultata il 05/10/2026)
- [expect(1), sorgente del manuale di Expect 5.45.4, core.tcl-lang.org](https://core.tcl-lang.org/expect/raw?name=expect.man&ci=expect-5-45-4) (consultato il 27/10/2026)
- [expect.c, Expect 5.45.4: exp_one_arg_braced e parse_expect_args](https://core.tcl-lang.org/expect/raw?name=expect.c&ci=expect-5-45-4) (consultato il 27/10/2026)
- [exp_glob.c, Expect 5.45.4: il motore di corrispondenza glob](https://core.tcl-lang.org/expect/raw?name=exp_glob.c&ci=expect-5-45-4) (consultato il 27/10/2026)
- [Expect su core.tcl-lang.org: descrizione, versione 5.45.4, avviso di manutenzione](https://core.tcl-lang.org/expect/index) (consultata il 27/10/2026)
- [Manuale di Tcl 8.4: Tcl, le regole del linguaggio](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (consultato il 27/10/2026)
- [Manuale di Tcl 9.0: Tcl, regola [5], espansione degli argomenti](https://www.tcl-lang.org/man/tcl9.0/TclCmd/Tcl.html) (consultato il 27/10/2026)
- [Manuale di Tcl 8.4: string match, le regole dei pattern glob](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (consultato il 05/10/2026)
- [OpenSSH ssh_config(5): StrictHostKeyChecking](https://man.openbsd.org/ssh_config.5) (consultato il 27/10/2026)
