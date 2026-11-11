# Analizzatore dei contesti dei comandi iRules

Un’iRule è Tcl con un contratto: il codice viene eseguito quando scattano gli eventi, i comandi sono validi in alcuni eventi e non in altri, e una manciata di costrutti ti fa perdere silenziosamente tutti i core della CPU tranne uno. Lo strumento ti rilegge il contratto.

Incolla un’iRule e ogni blocco `when` viene mostrato come una scheda. L’identità dell’evento viene dalla Master List of iRule Events su clouddocs, condensata fedelmente, con il suo modulo e un link alla sua pagina di riferimento; gli eventi fuori dalla tabella selezionata dell’ambito BIG-IP LTM (Local Traffic Manager) vengono comunque analizzati e segnalati, invece che indovinati. I comandi del blocco vengono inventariati, sia quelli con namespace sia quelli semplici, ciascuno con un link diretto alla sua pagina di riferimento.

Quando un evento compare in più blocchi, l’ordine di valutazione viene mostrato secondo le regole documentate del comando priority: valori da 0 a 1000, predefinito 500, il valore più basso viene eseguito per primo, a parità di priorità vale l’ordine di inserimento, e tra più iRule sullo stesso virtual server l’ordine in cui sono elencate le regole risolve le parità rimanenti.

La verifica CMP è la parte che ripaga lo sforzo, e ogni rilievo rimanda alla pagina CMP Compatibility. Le variabili globali non sono compatibili con CMP; dalla v10 il validatore intercetta la forma global e il virtual server viene declassato (demotion), il che significa che ogni connessione che gestisce finisce su un unico TMM. L’alternativa documentata per le variabili statiche condivise è il namespace `static::`, e lo strumento lo dice appena le vede. Le chiavi generate in RULE_INIT hanno un’istanza per ogni TMM, quindi la decifratura tra TMM diversi fallisce; i profili statistics contano per singola istanza TMM. La verifica indica ciascuno di questi casi dove li trova.

Una nota di onestà, voluta: gli elenchi degli eventi in cui ogni comando è valido si trovano nella pagina di riferimento di ciascun comando e variano con la versione, quindi lo strumento rimanda alla pagina di ogni comando invece di riprodurre tabelle di validità che non ha verificato. Il nome di un singolo evento mostra la sua scheda; la parola `events` mostra il catalogo raggruppato per modulo.

L’iRule viene analizzata e letta, mai eseguita. Tutto viene eseguito in locale; nulla di ciò che incolli lascia la pagina.

## Condivisione dei risultati

In cima alla lettura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il testo della casella (un’iRule, il nome di un evento o `events`) così come l’hai incollato, e nient’altro. Prima che tu copi qualsiasi cosa, il riquadro a comparsa aggiunge un’avvertenza: un’iRule può riportare host, pool e data group interni.

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
