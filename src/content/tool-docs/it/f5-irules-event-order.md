## Cosa fa

Scegli lo stack di profili di un virtual server BIG-IP Standard (full proxy), cioè se ha un profilo client-SSL, un profilo HTTP, un profilo server-SSL e un pool, e lo strumento mostra l’ordine in cui scattano gli eventi iRule più comuni, da `CLIENT_ACCEPTED` a `CLIENT_CLOSED`, sia come sequenza temporale sia come elenco. È un modello del comportamento documentato di F5, calcolato nel tuo browser; non si collega mai a un dispositivo.

## Perché l’ordine dipende dallo stack

Un’iRule è guidata dagli eventi: il tuo codice Tcl viene eseguito quando scatta un determinato evento, e quali eventi scattano, e in quale ordine, lo decide la configurazione del virtual server, non lo script. Un virtual server full proxy gestisce il lato client e il lato server come due connessioni separate, quindi gli eventi attraversano fasi distinte: la connessione del client viene accettata, l’handshake TLS lato client si completa, la richiesta HTTP viene analizzata, viene selezionato un membro del pool, viene aperta la connessione lato server, l’handshake TLS lato server si completa, la richiesta viene inviata, torna la risposta e infine entrambi i lati si chiudono. Cambia lo stack e con esso cambia l’insieme degli eventi.

## Cosa aggiunge ogni profilo

- **Nessun profilo oltre a un pool** lascia gli eventi a livello di connessione: `CLIENT_ACCEPTED` all’inizio, gli eventi di bilanciamento del carico quando viene scelto un membro, `SERVER_CONNECTED` sul lato server e gli eventi `CLOSED` alla fine.
- **Un profilo client-SSL** aggiunge gli eventi TLS lato client, come `CLIENTSSL_CLIENTHELLO` e `CLIENTSSL_HANDSHAKE`, prima che la richiesta venga elaborata.
- **Un profilo HTTP** aggiunge gli eventi di richiesta e risposta, `HTTP_REQUEST` sul lato client e `HTTP_REQUEST_SEND` e `HTTP_RESPONSE` sul lato server, così puoi intervenire su intestazioni e payload.
- **Un profilo server-SSL** aggiunge gli eventi TLS lato server per la connessione verso il membro del pool.
- **Un profilo JSON o SSE** è fuori da questo modello. BIG-IP 21.0.0 ha introdotto gli eventi JSON ([`JSON_REQUEST`](https://clouddocs.f5.com/api/irules/JSON_REQUEST.html), `JSON_RESPONSE` e le loro varianti di errore e di dato mancante) e [`SSE_RESPONSE`](https://clouddocs.f5.com/api/irules/SSE_RESPONSE.html), che richiedono sul virtual server un profilo JSON o SSE insieme al profilo HTTP ([riferimento dei profili di BIG-IP 21.0](https://techdocs.f5.com/en-us/bigip-21-0-0/big-ip-local-traffic-management-profiles-reference/model-context-protocol.html), consultato il 26/10/2026). Lo strumento li cita nelle note invece di collocarli nella sequenza.

Lo strumento colloca anche, al loro posto nella sequenza, gli eventi condizionali, i percorsi di raccolta dei dati e il percorso di errore del bilanciamento del carico (`LB_FAILED`).

## Una nota su più iRule

Quando due iRule gestiscono lo stesso evento, l’ordine tra loro non è quello in cui sono elencate: lo controlla il comando `priority` all’interno di ogni evento (F5 K12090273), con una priorità predefinita applicata quando non ne viene impostata una. È un asse diverso dall’ordine tra gli eventi che lo strumento mostra.

## Come si usa

Attiva o disattiva i profili del tuo virtual server e leggi la sequenza di eventi risultante come sequenza temporale e come elenco. Riflette il modello di eventi documentato da F5 (la Master List of iRule Events e i riferimenti dei singoli eventi), quindi è un aiuto per la pianificazione e lo studio, non una cattura da un sistema in produzione.

## Condivisione dei risultati

Sopra la sequenza degli eventi, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene i cinque interruttori dei profili per nome, ciascuno come `1` o `0` (`#clientssl=1&http=1&serverssl=1&pool=1&fastl4=0`), e nient’altro; c’è sempre una sequenza, quindi anche uno stack con tutti gli interruttori disattivati riceve un link. Tutto ciò che il link contiene va dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; cinque interruttori sono molto più corti.
- **Apertura di un link.** Gli interruttori assumono i valori del link (un interruttore che il link non contiene è disattivato) e la sequenza viene disegnata, come se li avessi selezionati tu. Un valore diverso da `1` o `0` fa ignorare l’intero link. Accettati o no, i valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.
