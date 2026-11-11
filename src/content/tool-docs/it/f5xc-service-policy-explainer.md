## Cosa fa

Incolla una `service_policy` di F5XC (F5 Distributed Cloud) in formato JSON e lo strumento spiega esattamente come trova le corrispondenze: l’ambito dei server a cui si applica, l’ordine in cui vengono valutate le sue regole e, per ogni regola, l’azione e le condizioni che devono essere soddisfatte. Legge la definizione della policy interamente nel tuo browser e non valuta nulla su traffico reale.

## Cos’è una service policy

Sulla piattaforma F5 Distributed Cloud, una service policy decide quali richieste raggiungono un load balancer e quali vengono respinte: è l’equivalente, sulla piattaforma, della logica di corrispondenza delle richieste che su un BIG-IP classico scriveresti come iRule. Una policy ha un **ambito dei server** (server scope) che indica quali server governa, un **esito** (disposition) che stabilisce il comportamento predefinito e un **elenco di regole** ordinato. L’ordine conta: le regole vengono valutate in sequenza e la prima che corrisponde decide il risultato, quindi leggerle dall’alto verso il basso è il modo per capire cosa fa davvero la policy.

## Come corrisponde una regola

Ogni regola abbina un’**azione**, come allow o deny, a un insieme di condizioni che devono essere tutte soddisfatte perché la regola si applichi. Lo strumento presenta ogni condizione come la definisce lo schema:

- il **matcher** e ciò che ispeziona (un’origine, un’intestazione, un percorso e così via);
- i suoi **criteri**, cioè se la corrispondenza avviene per valore esatto, per espressione regolare o per prefisso;
- la **logica AND/OR** che combina più valori;
- l’eventuale **inversione**, quando la corrispondenza è negata; e
- la **distinzione tra maiuscole e minuscole** nel confronto.

Il valore sta nel presentarle in modo chiaro: una service policy in JSON grezzo è difficile da leggere, e un solo matcher letto male o una condizione invertita sono esattamente il genere di cose che consentono o bloccano il traffico sbagliato.

## Basato sullo schema

I nomi e le forme dei campi che lo strumento comprende seguono lo schema OpenAPI ufficiale di F5 Distributed Cloud per la service policy e le sue regole, quindi la decodifica riflette l’oggetto reale e non un’ipotesi. Lo strumento è locale e non genera traffico in uscita: analizza e spiega il JSON che incolli, e non contatta mai la piattaforma né prova la policy su richieste reali. Un input malformato viene segnalato invece di causare un errore.

## Come si usa

Incolla la spec JSON di una `service_policy` e leggi l’ambito dei server, le regole in ordine, e l’azione e le condizioni di ogni regola. La decodifica è deterministica e locale.

## Condivisione dei risultati

Sotto la panoramica, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la policy così come l’hai incollata, non appena la pagina la riconosce. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Una policy può nominare host interni, intervalli di indirizzi, ASN e nomi di intestazioni e cookie: il riquadro a comparsa ti chiede di controllarli. La pagina mostra ogni matcher con i suoi valori, quindi nulla può essere tolto senza cambiare la lettura; è invece una credenziale a bloccare il link. Prima che venga offerto un link, nella policy viene cercata una credenziale definita da uno standard: una chiave privata PEM, una riga `Authorization` o `Proxy-Authorization` con qualsiasi schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezioni 11.6.2 e 11.7.2: il valore è costituito da credenziali, «consists of credentials»), una riga `Cookie` o `Set-Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezione 8.4: i server di solito conservano nel cookie un nonce, cioè un identificatore di sessione, «commonly store a nonce (or “session identifier”) in a cookie»), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1), un ID della chiave di accesso AWS o un valore `ENC` di FortiOS, e due elementi definiti dallo schema stesso di F5 Distributed Cloud: un segreto SecretType, cioè un URL `clear_secret_info` o una posizione `blindfold_secret_info` (il [riferimento dell’API XC](https://docs.cloud.f5.com/docs-v2/api/views-http-loadbalancer): «SecretType is used in an object to indicate a sensitive/confidential field»), e un matcher dell’intestazione `Authorization` con un valore letterale; tutte le fonti sono state consultate il 01/11/2026. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto (un membro JSON `token`, un `token=` in una query string, un matcher `X-Api-Key` o di cookie) non blocca il link; il riquadro a comparsa indica il primo, così puoi controllarlo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La policy riempie la casella come farebbe un incolla, e la pagina la legge (decodificata, mai valutata). I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
