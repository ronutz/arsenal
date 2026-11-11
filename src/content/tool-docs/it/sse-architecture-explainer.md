## Cosa fa

Descrivi una richiesta (dove è diretta, con quale metodo di steering arriva, se il dispositivo è gestito, se il TLS viene decifrato, se contiene un payload) e lo strumento mostra il passaggio unico: quali servizi entrano in gioco, in quale ordine, quali sono **pilastri** e quali **trasversali**, e cosa avrebbe fatto invece una catena di appliance separate. Deterministico e offline: descrive un’architettura invece di interrogarne una.

## Il punto che vuole dimostrare

**La DLP (Data Loss Prevention, prevenzione della perdita di dati) e la protezione dalle minacce non sono pilastri.** Sono trasversali: vengono eseguite all’interno dello stesso passaggio e ricevono tutto ciò che i pilastri hanno decifrato. Per questo un solo profilo dei dati copre allo stesso modo il web, il software as a service e le applicazioni private, e per questo in un’architettura a catena la stessa regola va scritta quattro volte in quattro dialetti.

I pilastri dipendono da **dove è diretto il traffico**: secure web gateway per il web generico, cloud access security broker per l’attività SaaS, zero trust network access per un’applicazione privata, firewall cloud per le porte che gli altri non coprono. Cambia la destinazione nello strumento e osserva quali pilastri entrano in gioco mentre i motori trasversali restano gli stessi.

## L’affermazione che puoi verificare

Single-pass significa che **il payload viene decifrato una sola volta** e lo stesso flusso viene consegnato a ogni motore. Le appliance in catena decifrano e cifrano di nuovo a ogni hop, e quella ripetizione è gran parte della latenza che di solito si attribuisce all’ispezione.

Lo strumento lo riporta come termine di confronto in ogni risultato, perché «convergente» descrive spesso un’offerta in bundle più che un’architettura. La domanda da fare a un vendor è se il payload viene decifrato una volta sola o una volta per ogni motore.

## Cosa non fa

Non modella alcun tenant specifico e non è un simulatore di policy. Disattiva la decifratura e ti dirà che tutto ciò che viene dopo l’identificazione dell’applicazione lavora sui metadati: è il modo di fallire che più vuole far interiorizzare a chi studia, perché una policy scritta come se il contenuto fosse visibile resta nella console con un aspetto del tutto corretto.

## Ambito dei vendor

I nomi delle fasi seguono la descrizione pubblicata da Netskope del suo Zero Trust Engine, perché è la piattaforma trattata dalla formazione di questo sito. L’argomento strutturale (passaggio unico, ispezione trasversale, piena capacità di calcolo all’edge) vale in generale per SSE ed è presentato come tale.

## Condivisione dei risultati

Sotto il riepilogo, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` sempre tutti i campi del modulo: la destinazione e il metodo di steering con i loro ID, e le quattro caselle di spunta come 1 o 0, così un link conserva il suo significato anche se cambia un valore predefinito. I campi descrivono una richiesta e non nominano alcun sistema né alcuna persona. La pagina mostra un passaggio già all’apertura, quindi il pulsante è subito disponibile. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** I campi vengono impostati come se li avessi scelti tu, e segue il passaggio. Un link con una scelta sconosciuta viene ignorato. I valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
