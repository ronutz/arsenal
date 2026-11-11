## Cosa fa

Incolla una richiesta HTTP/1.1 grezza, come quella che ti dà una cattura, il log di un proxy o l’esempio di una RFC, e lo strumento la trasforma nel comando `curl` equivalente, nella chiamata `fetch` del browser, nel comando HTTPie, nel frammento Python `requests` e nella riga di comando PowerShell. Tutto viene analizzato nel tuo browser; non viene mai inviato nulla e nessuna richiesta viene eseguita.

## L’inverso dell’analizzatore di comandi curl

L’[analizzatore di comandi curl](/tools/curl-command-explainer) va in una direzione: un comando in ingresso, una richiesta grezza tra i suoi output. Questo strumento va nell’altra: una richiesta grezza in ingresso, un comando eseguibile in uscita. Esistono entrambi perché le due direzioni servono in momenti diversi. Una cattura ti consegna un messaggio; un terminale vuole un comando; una segnalazione di bug li vuole tutti e due.

## Come viene composto l’URL

Una normale riga di richiesta contiene solo un percorso, come in `GET /users HTTP/1.1`, perché la connessione conosce già l’host. Per produrre qualcosa che si possa eseguire ovunque, lo strumento unisce quella destinazione all’intestazione `Host`. Le destinazioni in absolute-form, usate dai proxy, sono già complete e vengono prese così come sono. Se in una richiesta in origin-form manca `Host`, lo strumento lo segnala, perché altrimenti l’URL sarebbe un’ipotesi.

## Intestazioni scartate per scelta

`Host`, `Content-Length` e `Connection` non vengono riprodotte. Ogni client le imposta da sé, e passarle provoca intestazioni duplicate o, peggio, una lunghezza dichiarata che non corrisponde più al corpo che il client invierà davvero.

## Cosa segnala

- **Un `Content-Length` in disaccordo con il corpo.** Server e proxy possono allora non essere d’accordo su dove finisce il messaggio, che è la materia prima del request smuggling.
- **Un corpo chunked.** Viene passato così come l’hai incollato, senza decodifica; decodificare le codifiche di trasferimento è il compito di un decodificatore di messaggi, non di un traduttore.
- **`http` in chiaro.** Intestazioni e corpo viaggiano leggibili.
- **Un’intestazione `Authorization` o un `Cookie`.** Una richiesta catturata è di solito una credenziale attiva, ed è l’avviso che in pratica conta di più: il testo che stai per incollare in un ticket potrebbe essere una sessione funzionante.

## Come si usa

Incolla la richiesta, leggi la riga di richiesta e le intestazioni analizzate, poi copia la forma che ti serve. La conversione è deterministica e locale, quindi la stessa richiesta produce sempre lo stesso output.

## Condivisione dei risultati

Sotto la riga di richiesta e i suoi avvisi, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la richiesta con ogni credenziale mascherata, mai così come l’hai inserita: una richiesta catturata contiene di regola un’intestazione Authorization o un cookie di sessione, e questa pagina mostra ogni valore delle intestazioni in chiaro e in cinque traduzioni. Il suo riquadro a comparsa indica prima cosa contiene il link e quanti valori sono stati mascherati, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Cosa viene mascherato:

- **I campi di intestazione**, per nome: `Authorization` e `Proxy-Authorization` mantengono il loro schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezioni 11.6.2 e 11.7.2: il valore è costituito da credenziali, «consists of credentials»); Basic mantiene lo user-id e perde la password ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), sezione 2); un JWT mantiene la sua intestazione protetta e perde i claim e la firma ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1); ogni valore di `Cookie` viene sostituito ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezione 4.2.1); un campo con un nome da segreto (`X-API-Key`) viene sostituito per intero; un token dentro qualsiasi altro valore (un `Referer` con un codice) viene sostituito. Ognuno diventa `REDACTED`.
- **Il request-target**: la password di un `user:password@` ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1) e i parametri segreti della query diventano `REDACTED`.
- **Il corpo**: i membri JSON e i parametri di modulo con un nome da segreto (`access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), sezioni 2.2 e 2.3), `refresh_token`, `client_secret`, `password` e `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sezioni 2.3.1, 4.1.2, 4.3.2 e 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), sezione 4.5), e qualsiasi nome che termina con token, secret, password o api key) vengono riempiti con un `*` per ciascuno dei loro ottetti, così il corpo mantiene la sua lunghezza: un `Content-Length` che corrispondeva continua a corrispondere.

I vettori di condivisione dello strumento verificano che la pagina che apre il link legga la stessa richiesta (gli stessi avvisi, gli stessi campi e la stessa lunghezza del corpo). Se resta una chiave o un token dove nessun nome lo segnala (un JWT incollato come corpo in testo semplice), il link non viene creato: il riquadro a comparsa indica la sua riga.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la copia non viene inviata al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La copia compila la casella come farebbe un incolla e la pagina la traduce; nulla viene inviato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
