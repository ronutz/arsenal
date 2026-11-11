## Cosa fa questo strumento

Funziona in entrambe le direzioni. Indica il nickname di un nodo e un I-SID e costruisce l’indirizzo di gruppo che quel nodo userà per quel servizio. Incolla un indirizzo preso da `show isis spbm multicast-fib` e ti dice a quale albero appartiene la voce e quale servizio trasporta.

## La regola

Un indirizzo di gruppo SPBM non si configura e non si apprende. Si compone a partire da due numeri che ogni nodo ha già:

- **primi tre byte**: il prefisso fisso `0x30000` combinato con il nickname di 20 bit
- **ultimi tre byte**: l’I-SID di 24 bit

Quindi il nickname `0.00.10` che trasporta l’I-SID 100 dà `03:00:10:00:00:64`. Ogni nodo dell’albero a percorso minimo calcola lo stesso indirizzo dal database link-state senza che nessuno glielo comunichi, ed è proprio per questo che SPBM non ha bisogno di apprendere i MAC del backbone.

Lo stesso I-SID con radice su un nodo diverso produce un indirizzo diverso: un albero per ogni radice.

## La direzione che ripaga

La lettura della FIB multicast. È una colonna di valori esadecimali, e la domanda è sempre la stessa: di chi è questo albero, e quale servizio. Entrambe le risposte sono nell’indirizzo. `03:00:41:00:04:4d` è il nickname `0.00.41` che trasporta l’I-SID 1101. Confronta il nickname con la colonna SYSID o HOST-NAME dello stesso output per dare un nome al nodo.

## Un’ambiguità, dichiarata invece che nascosta

I bit 16 e 17 appartengono al prefisso fisso. Un nickname il cui primo campo li imposta produce un indirizzo che non si può decodificare risalendo a un solo nickname. Ogni esempio documentato usa 0 come primo campo. Se inserisci un altro valore, lo strumento costruisce l’indirizzo e ti avvisa che la conversione inversa non è verificata, invece di restituire un nickname di cui non può garantire.

## Limiti dichiarati

Lo strumento calcola solo l’indirizzo di gruppo. La selezione della B-VID, l’albero a percorso minimo vero e proprio, l’adiacenza IS-IS e il MAC unicast del backbone sono tutti fuori ambito; il B-MAC unicast è l’indirizzo dello chassis e non deriva da nulla. L’I-SID è trattato come un numero; se un dato valore sia una VSN di livello 2 o di livello 3 è una questione di configurazione che lo strumento non modella.

## Condivisione dei risultati

Sotto l’indirizzo e il suo riepilogo, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` i campi dell’operazione da cui viene la risposta: il nickname e l’I-SID così come li hai inseriti (`nickname`, `isid`) per un indirizzo che hai costruito, oppure l’indirizzo così come l’hai inserito (`input`) per uno che hai scomposto; un link non li contiene mai entrambi. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi i campi non vengono inviati al server quando si apre il link; restano nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerli.

- **Apertura di un link.** I campi dell’operazione vengono compilati e la pagina esegue il calcolo, come quando li digiti; nulla viene cercato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
