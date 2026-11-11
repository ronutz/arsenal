## Cosa fa

Scrive uno script [Expect](/glossary/expect) completo a partire da poche scelte: come connettersi (ssh, telnet o un altro programma, ad esempio un client per console seriale), l’host e l’utente, come viene autenticato l’accesso, un profilo di dispositivo, i comandi, i timeout e dove va l’output. Lo script esegue l’accesso, eleva i privilegi dove lo chiedi, gestisce la paginazione, esegue i comandi uno alla volta e si disconnette. Per impostazione predefinita non modifica nulla sul dispositivo: dove disattivare la paginazione sarebbe una modifica globale della configurazione, risponde invece al paginatore, e cambiare l’impostazione è una scelta esplicita che arriva insieme al suo ripristino. Nulla viene eseguito e nulla lascia il browser: copi o scarichi lo script e lo esegui tu.

Ogni script che può scrivere supera l’[analizzatore di script Expect](/tools/expect-script-explainer) senza errori né avvisi, e la pagina esegue l’analizzatore sullo script mentre lo costruisci. I vettori di test di riferimento (golden vectors) dello strumento verificano questa promessa per ogni classe di combinazioni di scelte, più di duemila. Le note che l’analizzatore può ancora mostrare sono volute: E5 sullo spazio singolo che risponde a un prompt `--More--`, ed E12 su uno script che scrive solo in un file di log.

## Segreti: mai nello script

- **Una chiave ssh.** ssh viene eseguito con `BatchMode=yes`, che, con le parole di ssh_config(5), disattiva l’interazione con l’utente come le richieste di password e di conferma della chiave host («user interaction such as password prompts and host key confirmation requests»), per gli script e gli altri job batch. La chiave deve funzionare da sola: caricala in `ssh-agent`, oppure indica un file di chiave (`-i`, con `IdentitiesOnly=yes` perché venga offerta solo quella chiave).
- **Una password da una variabile d’ambiente.** Lo script verifica che la variabile sia impostata e non vuota (stato 2 in caso contrario), la copia e la rimuove dall’ambiente con `unset env(NAME)` prima di avviare la connessione, così il programma che avvia non la eredita.
- **Una password richiesta all’esecuzione.** L’idioma di expect(1): `stty -echo`, `send_user`, `expect_user -re "(.*)\n"`, `stty echo`, con due minuti tutti suoi per inserirla (`-timeout 120` dentro il blocco) e l’eco riattivato in ogni esito. Lo script ha quindi bisogno di un terminale.

Nessun segreto finisce nemmeno in un log. L’accesso viene eseguito con `log_user 0`, così un dispositivo che ripete la password in eco non può mostrarla sullo schermo, e il file di trascrizione, quando lo chiedi, viene aperto solo dopo l’accesso e il passaggio di enable. Il log di Expect registra ciò che `expect_user` legge anche con l’eco disattivato, e `exp_internal` stampa ogni `send` per intero, quindi il generatore non apre mai un log prima che i segreti siano stati usati e non attiva mai `exp_internal`. Entrambi i fatti sono stati verificati con il vero `expect` 5.45.4 e sono spiegati in [Secrets in Expect scripts](/learn/expect-secrets-and-safe-scripts).

ssh riceve sempre `-o StrictHostKeyChecking=accept-new`: ssh_config(5) dice che con questa opzione ssh aggiunge automaticamente le nuove chiavi host al file known_hosts dell’utente, ma non consente connessioni verso host con chiavi cambiate («ssh will automatically add new host keys to the user's known_hosts file, but will not permit connections to hosts with changed host keys»). Il generatore non scrive mai `no`, che accetta una chiave cambiata.

## Profili di dispositivo

I profili vengono dal modulo dati della suite, ogni valore letto nei documenti del vendor il 27 ottobre 2026 e spiegato in [Expect against network devices](/learn/expect-against-network-devices):

- **Cisco IOS XE:** `terminal length 0` per la sessione, `--More--` a cui si risponde con uno spazio, `enable` con la sua domanda `Password:`.
- **F5 BIG-IP (tmsh):** `modify /cli preference pager disabled display-threshold 0`, una preferenza dell’utente la cui durata il riferimento non indica, senza un valore documentato da ripristinare.
- **Fortinet FortiOS:** per impostazione predefinita lo script risponde a ogni `--More--` con uno spazio ed `exp_continue`, e la configurazione del dispositivo resta com’era. Disattivare la paginazione è una scelta esplicita: `config system console`, `set output standard`, `end`, una modifica globale della configurazione che vede la sessione di ogni amministratore, quindi il generatore avvisa e aggiunge il ripristino documentato (`set output more`), che puoi rifiutare.
- **Extreme Switch Engine:** `disable cli paging session`, per la sessione.
- **Extreme Fabric Engine:** `terminal more disable`, il cui ambito il riferimento non indica, con `terminal more enable` per ripristinarlo; `enable` può porre domande che i documenti non riportano, quindi il generatore lo offre solo senza password.
- **Generico:** la tua regexp del prompt, e un comando di paginazione se ne hai uno.

Ogni regexp del prompt viene scritta letteralmente tra parentesi graffe, `-re {...}`, così Tcl non vi sostituisce nulla.

## Come viene composto lo script

- Il timeout viene impostato prima del primo `expect`, così nulla attende con il valore predefinito di 10 secondi.
- Un solo `expect` gestisce l’intero accesso: a ogni domanda (nome utente, password) si risponde una volta, una seconda domanda significa che l’accesso è stato rifiutato e ferma lo script con stato 1, il prompt conclude l’accesso, e i rami `timeout` ed `eof` fermano lo script con un messaggio.
- Ogni blocco tra parentesi graffe comincia con un a capo dopo la parentesi. Expect 5.45.4 legge un singolo argomento tra graffe come pattern e corpi solo in quel caso; scritto su una riga, il blocco sarebbe un unico pattern (la regola E19 dell’analizzatore).
- `run_command` invia una riga che termina con `\r` e attende il prompt. Un pattern che corrisponde a qualsiasi fine riga, con `exp_continue`, fa ripartire il timer a ogni riga, così il timeout del comando conta il silenzio e non l’intero comando, e un output lungo non va in timeout mentre sta ancora arrivando.
- Quando si risponde alla paginazione, il pattern viene scritto `-ex "--More--"`, perché `expect` legge come opzione ogni parola che comincia con `-` (la regola E20 dell’analizzatore).
- La fine è il comando di disconnessione seguito da `expect eof`, oppure un `close` quando non indichi alcun comando di disconnessione, poi `wait`, così il processo viene raccolto.

Stati di uscita: 0 completato; 1 accesso non riuscito; 2 input mancante o errato; 3 un comando non è terminato; 4 la sessione si è chiusa in anticipo.

## Cosa verifica nel tuo input

- Solo nomi host e indirizzi (nessun trattino iniziale, così un valore non può mai arrivare a ssh come opzione); con l’host preso dalla riga di comando, lo script verifica l’argomento allo stesso modo quando viene eseguito.
- Una porta solo per ssh (`-p`); per telnet su un’altra porta, usa Un altro programma.
- File di chiave e file di log come percorsi semplici, senza spazi, `~` o caratteri che Tcl sostituirebbe; la riga di comando di un programma come parole separate da spazi, nessuna contenente `~` o un carattere di quel tipo, e il nome del programma che non comincia con un trattino.
- Comandi come testo semplice, fino a 40, di 300 caratteri ciascuno; ogni `\`, `"`, `$`, `[`, `]`, `{` e `}` viene protetto con una barra rovesciata, così il dispositivo riceve il comando così come l’hai inserito.
- Timeout da 1 a 3600 secondi, mai `-1`.
- Una regexp del prompt generica con parentesi graffe bilanciate, e mai una che corrisponde subito (`.*`, `^`, `$`).

A un comando che pone una domanda non viene data risposta: lo script si ferma con stato 3 quando scade il timeout del comando. Quando un comando comincia come una delle conferme documentate del profilo (`reload`, `save configuration`, `reboot`, `reset`, `execute restore`), il generatore lo segnala.

## Limiti

- Il generatore scrive lo script; non lo esegue mai. Eseguilo prima su un dispositivo di laboratorio.
- Attende il pattern del prompt del profilo. Una riga di banner o una riga di comando che a sua volta termina con `>` o `#` e arriva in un pezzo separato può essere scambiata per il prompt; [l’articolo sui dispositivi di rete](/learn/expect-against-network-devices) tratta i pattern dei prompt.
- I commenti e i messaggi nello script sono in inglese, come i comandi stessi.
- Non risponde alle conferme, non gestisce più dispositivi in un solo script e non tiene separato l’output di ciascun comando; per questo modifica lo script, poi verificalo di nuovo con l’[analizzatore](/tools/expect-script-explainer).

## Strumenti correlati e letture

- **Cosa raccoglie lo script.** Quando si tratta di configurazione, la legge l’analizzatore della piattaforma: l’[analizzatore della configurazione tmsh](/tools/f5-tmsh-config-explainer), l’[analizzatore della configurazione CLI FortiOS](/tools/fortios-cli-config-explainer) e l’[analizzatore di configurazioni ExtremeXOS](/tools/exos-config-explainer).
- **Perché lo script è scritto così.** Il quoting di Tcl, che decide cosa arriva al dispositivo, è in [Tcl for Expect writers](/learn/tcl-for-expect-writers); il timer che `exp_continue` fa ripartire in `run_command`, in [Expect's timeouts, eof and loops](/learn/expect-timeouts-eof-and-loops); e ciò che Expect scrive in un log, in [Debugging Expect](/learn/expect-debugging-and-logging).

## Condivisione dei risultati

Sotto lo script, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il modulo, mai lo script: ogni scelta (trasporto, accesso, profilo del dispositivo, enable, paginazione, output, gli interruttori e i due timeout) e ogni campo di testo che il modulo mostra per quelle scelte. La pagina scrive lo stesso script dallo stesso modulo, byte per byte. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Il generatore non accetta mai una password: la legge da una variabile d’ambiente, il cui nome è l’unico campo, oppure la chiede all’esecuzione. Il modulo indica comunque il tuo host, il tuo utente e i tuoi comandi, quindi il riquadro a comparsa ti chiede di rileggerli prima di inviare il link. Prima che venga offerto un link, nel testo viene cercata una credenziale definita da uno standard: una chiave privata PEM, una riga `Authorization` o `Proxy-Authorization` con qualsiasi schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezioni 11.6.2 e 11.7.2: il valore è costituito da credenziali, «consists of credentials»), una riga `Cookie` o `Set-Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezioni 4.1.1 e 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1: la forma «user:password» è deprecata, «is deprecated»), un ID della chiave di accesso AWS o un valore `ENC` di FortiOS; tutte consultate il 01/11/2026. Una sola di queste significa niente link: il riquadro a comparsa indica il campo, e tu lo sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto (`username admin secret ...` in un comando, `set password ...`) non blocca il link; il riquadro a comparsa indica il primo, così puoi controllarlo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** Il modulo viene impostato come lo imposteresti tu, con i campi che il link non contiene ai loro valori predefiniti, e la pagina costruisce lo script. Ogni scelta deve essere una di quelle offerte dalla pagina e non deve essere presente alcun campo nascosto, altrimenti il link viene ignorato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

- [expect(1), sorgente del manuale di Expect 5.45.4, core.tcl-lang.org](https://core.tcl-lang.org/expect/raw?name=expect.man&ci=expect-5-45-4) (consultato il 27/10/2026)
- [expect.c, Expect 5.45.4: come expect legge i suoi argomenti](https://core.tcl-lang.org/expect/raw?name=expect.c&ci=expect-5-45-4) (consultato il 27/10/2026)
- [OpenSSH ssh(1)](https://man.openbsd.org/ssh.1) (consultato il 27/10/2026)
- [OpenSSH ssh_config(5): StrictHostKeyChecking, BatchMode, IdentitiesOnly](https://man.openbsd.org/ssh_config.5) (consultato il 27/10/2026)
- [RFC 854, Telnet Protocol Specification](https://www.rfc-editor.org/rfc/rfc854) (consultata il 27/10/2026)
- I documenti dei vendor dei profili di dispositivo, elencati con le loro date in [Expect against network devices](/learn/expect-against-network-devices) (consultati il 27/10/2026)
