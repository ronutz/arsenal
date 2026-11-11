## Cosa fa

Questo strumento ti guida nella scelta dell’algoritmo di bilanciamento del carico dell’origin pool di F5 Distributed Cloud (XC). Rispondi a tre domande (se le sessioni devono restare sulla stessa origine, cosa identifica una sessione: l’IP di origine, un cookie, un’intestazione personalizzata o «varia a seconda della route», e se l’origin pool è dinamico) e lo strumento consiglia uno degli algoritmi di XC, indica l’equivalente BIG-IP, elenca le avvertenze che valgono per le tue risposte e ti dice dove impostarlo. Tutto viene eseguito nel tuo browser.

## Il modello di persistenza di XC, per chi viene da BIG-IP

È il punto che lo strumento esiste per chiarire. Su BIG-IP, il metodo di bilanciamento del carico (Round Robin, Least Connections e così via) e il profilo di persistenza (Source Address Affinity, Cookie) sono due impostazioni indipendenti del virtual server. XC le unisce. Gli algoritmi di consistent hashing (Source IP Stickiness, Cookie Based Stickiness e Ring Hash) non sono solo metodi di distribuzione: ciascuno è anche, per definizione, il metodo di persistenza. Sceglierne uno ti dà entrambe le cose insieme. Gli algoritmi senza hash (Round Robin, Least Active Request, Random) non hanno alcuna persistenza. Non esiste un oggetto profilo di persistenza separato da associare.

## I sette algoritmi

Round Robin invia le richieste alle origini a turno. Least Active Request invia ogni richiesta all’origine con meno richieste in corso, il che si adatta a richieste di costo diseguale o a connessioni di lunga durata. Random sceglie un’origine a caso ed è statisticamente uniforme su pool grandi. Source IP Stickiness, Cookie Based Stickiness e Ring Hash formano la famiglia del consistent hashing: calcolano l’hash dell’IP di origine, di un cookie o di una policy di hash che definisci tu (di solito un’intestazione con l’ID di sessione) e mantengono un client sulla stessa origine. Load Balancer Override è la via d’uscita: rimanda la scelta all’HTTP load balancer, così puoi impostare la stickiness per route o per dominio.

## Perché le avvertenze contano

La raccomandazione vale quanto la sua aderenza al caso, quindi lo strumento mette in evidenza le trappole. L’hash sull’IP di origine concentra su una sola origine i client che condividono un IP (dietro un NAT o un proxy), rendendo il carico diseguale. La stickiness basata su cookie richiede nome, TTL e percorso, e regge solo se il client restituisce il cookie. Un hash su un’intestazione personalizzata richiede un valore stabile per tutta la sessione, non per singola richiesta. Infine, per un pool dinamico (pod Kubernetes che aumentano e diminuiscono) il consistent hashing è la famiglia giusta, perché riassegna il minor numero di client quando i membri cambiano.

## Condivisione dei risultati

Sotto il nome dell’algoritmo consigliato, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` le tue risposte, tramite i loro ID: se ti serve la persistenza; la distribuzione o la chiave di sessione, a seconda di quale delle due legge la raccomandazione; e se il pool è dinamico, una volta che hai risposto. Il questionario non ha nulla da digitare, quindi nel link non viaggia nulla di ciò che hai digitato. Il pulsante è disponibile quando la raccomandazione è completa. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Le risposte vengono impostate come se le avessi selezionate, e la raccomandazione segue. Un link con una risposta sconosciuta, o con risposte di entrambi i rami, viene ignorato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
