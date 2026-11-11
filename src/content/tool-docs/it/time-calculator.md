## Cosa fa

Due modalità di aritmetica esatta del tempo. Tra due istanti: l’intervallo con segno, scomposto a partire dall’unità più grande (settimane, giorni, ore, minuti, secondi) e totalizzato per intero in ciascuna unità, con la durata ISO 8601 canonica. Istante più o meno una durata: il timestamp risultante. Le durate si leggono in ISO 8601 (P1DT2H30M, PT90M, P1W) o in forma abbreviata semplice (1d 2h 30m; 90min). Tutto viene calcolato sulla linea temporale UTC nel tuo browser.

## Cosa rifiuta, e perché

Aggiungere «un mese» è aritmetica di calendario: un mese dura da 28 a 31 giorni e un anno 365 o 366, quindi P1M non ha un’unica durata esatta. Lo strumento rifiuta mesi e anni con questa spiegazione invece di scegliere in silenzio una convenzione. Qui i giorni durano esattamente 24 ore e le settimane esattamente 7 giorni: tempo esatto, dichiarato.

## Offset

Un timestamp senza offset viene letto come UTC, e il presupposto viene segnalato. Aggiungi Z o un offset esplicito (ad esempio -03:00) e la risposta non dipende mai dalla macchina su cui lo strumento si trova a girare.

Sotto ogni istante, un selettore di data e ora lo imposta senza doverlo digitare. Una scelta mantiene i secondi e l’offset che il campo aveva già, e scrive Z (UTC) quando non ne aveva; un offset diverso da Z, o una data da sola, va comunque digitato.

## Condivisione dei risultati

Sotto il risultato, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la modalità e i suoi campi, una volta che la pagina ha un risultato: i due istanti per l’intervallo tra di essi, oppure l’istante iniziale, la durata e l’operazione (aggiungere o sottrarre). I campi dell’altra modalità non sono inclusi. Istanti e durate non riportano nulla di tuo. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** La modalità viene selezionata e i suoi campi vengono compilati come se li digitassi, e la pagina esegue il calcolo; i campi dell’altra modalità conservano ciò che avevi inserito. Una modalità o un’operazione sconosciuta, un campo mancante o un campo dell’altra modalità fanno sì che il link venga ignorato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
