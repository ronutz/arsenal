## Cosa fa

Inserisci da uno a quattro nomi di metodi HTTP (Hypertext Transfer Protocol) e lo strumento restituisce per ciascuno i dati a livello di protocollo: se è sicuro, idempotente e memorizzabile in cache, qual è la semantica del corpo della richiesta, se CORS (Cross-Origin Resource Sharing) permette ai browser di inviarlo senza un preflight (la richiesta OPTIONS con cui un browser chiede il permesso prima di qualsiasi richiesta cross-origin non semplice), se i moduli HTML possono produrlo in modo dichiarativo e quale RFC lo definisce. Se ne chiedi due o più («get vs query»), indica anche esattamente le proprietà in cui differiscono. La tabella copre i nove metodi fondamentali della RFC 9110, PATCH (RFC 5789), il trio WebDAV PROPFIND, REPORT e SEARCH e la riga di punta: QUERY, registrato dalla RFC 10008 nel giugno 2026, il primo nuovo metodo HTTP dopo PATCH, che è del 2010.

Sotto il campo, un pulsante per ogni metodo della tabella aggiunge quel metodo alla riga o lo toglie, così un confronto si costruisce senza digitare; con quattro metodi indicati, gli altri restano in attesa.

## Il vocabolario, con precisione

Sicuro significa che il client non chiede alcun cambiamento di stato; idempotente significa che ripetere la stessa identica richiesta lascia il server nello stesso stato, ed è questo che rende legittimi i nuovi tentativi automatici. Entrambi sono impegni sull’intenzione registrati presso l’IANA: una cache, un proxy o un livello di nuovi tentativi generici possono basarsi su di essi senza sapere nulla della tua API. Nessuno dei due dice qualcosa sul payload: il corpo di una richiesta QUERY può contenere lo stesso tentativo di injection del corpo di una POST, ed è per questo che la nota finale dello strumento insiste su un’ispezione al livello di POST per QUERY.

La memorizzabilità in cache ha tre valori onesti nella tabella: GET e HEAD sono la coppia memorizzabile; le risposte a POST e PATCH sono memorizzabili solo quando sono presenti informazioni esplicite di freschezza (in pratica, quasi mai); QUERY è memorizzabile per progettazione, con il requisito della RFC 10008 che la chiave della cache includa il contenuto della richiesta: è il meccanismo che rende memorizzabile una richiesta con un corpo, ed è il punto esatto in cui un’implementazione approssimativa della cache si trasforma in avvelenamento della cache (cache poisoning).

La semantica del corpo della richiesta distingue quattro casi che l’ecosistema confonde di continuo: corpi che sono lo scopo del metodo (POST, PUT, PATCH, QUERY, il trio WebDAV), corpi senza semantica definita che i server possono rifiutare senza appello (GET, HEAD, DELETE: la RFC 9110 lo dice esplicitamente), corpi ammessi ma privi di significato (OPTIONS) e corpi vietati (CONNECT, TRACE).

## Perché QUERY è la riga interessante

QUERY è l’anello mancante che la tabella rende visibile: sicuro + idempotente + memorizzabile in cache come GET, con un corpo come POST. Esiste perché GET costringe le query nell’URL (limiti di lunghezza, complicazioni di codifica, fughe di dati nei log e nel Referer), mentre POST /search mente all’infrastruttura: nulla nel protocollo lo segna come di sola lettura, quindi nulla di ciò che sta nel mezzo può memorizzarlo in cache o ripeterlo. Il confronto «post vs query» mostra cinque proprietà che si invertono insieme; «get vs query» mostra le tre che contano per l’adozione: il corpo, il preflight CORS (QUERY non è nella safelist) e i moduli HTML (oggi un modulo con method="query" ricade su GET e perde il corpo).

## Esempi svolti

`query` da solo restituisce la riga completa della RFC 10008. `get vs query` risponde alla domanda canonica con tre differenze. `post,query` racconta la migrazione: cinque inversioni. `put delete` mostra la coppia idempotente ma non sicura. `trace` e `connect` mostrano i due metodi a cui è vietato un corpo. `search` racconta la storia del nome: le prime bozze di QUERY si chiamavano SEARCH fino al cambio di nome del 2021.

## Condivisione dei risultati

Sotto i pannelli, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la riga così come l’hai inserita, e nient’altro: da uno a quattro nomi di metodi, che non dicono nulla di te. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. I link del decodificatore di messaggi HTTP che passano un metodo a questa pagina usano lo stesso `#input=` e compilano il campo allo stesso modo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la riga non viene inviata al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La riga compila il campo come farebbe la digitazione e la pagina confronta i metodi; nulla viene inviato da nessuna parte. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Provenienza

Ogni valore di sicurezza e idempotenza è la colonna stessa dell’IANA HTTP Method Registry, verificata rispetto alla RFC 9110 §9.3, alla RFC 10008, alla RFC 5789 e alle specifiche WebDAV (RFC 4918, 3253, 5323); la safelist CORS segue la specifica WHATWG Fetch, e lo stato dei moduli la discussione aperta sull’HTML del WHATWG. Tutte le fonti sono state consultate il 20/07/2026. Lo strumento include 19 vettori di test di riferimento (golden vectors) che fissano ogni riga, quindi qualsiasi deriva della tabella fa fallire la build.
