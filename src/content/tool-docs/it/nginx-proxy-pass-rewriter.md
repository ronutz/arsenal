## Cosa fa lo strumento

Incolla una `location`, il suo `proxy_pass` e un URI di richiesta. Lo strumento calcola cosa riceve davvero il backend e mostra **la stessa configurazione con la barra finale invertita**, così la differenza si vede invece di essere descritta.

## La regola

`proxy_pass http://backend;` **non ha una parte URI**, quindi l’URI della richiesta originale passa invariato, prefisso della location compreso. `proxy_pass http://backend/;` **ha** una parte URI, e conta anche quella sola barra, quindi la parte della richiesta che corrisponde al prefisso della location viene **sostituita** da essa.

Con `location /app/` e una richiesta di `/app/page`, la prima forma invia `/app/page`, la seconda invia `/page` e `proxy_pass http://backend/v2/;` invia `/v2/page`.

Quale ti serva dipende dal backend. Un’applicazione montata sullo stesso percorso ha bisogno che il prefisso resti; una che non sa di trovarsi dietro un prefisso ha bisogno che venga tolto. Una scelta sbagliata produce un 404 dal backend per una richiesta che il proxy ha gestito perfettamente.

## La doppia barra è reale

Una location senza barra finale più una parte URI invia all’upstream una doppia barra vera e propria: `location /app` con `proxy_pass http://backend/` trasforma `/app/page` in `//page`. Lo strumento lo riproduce invece di correggerlo, perché una risposta più pulita di quella di NGINX nasconderebbe esattamente il difetto che sei venuto a cercare.

## Cosa rifiuta

Le location con espressione regolare e quelle con nome non possono avere una parte URI: non c’è un prefisso letterale da sostituire, quindi NGINX rifiuta la configurazione all’avvio. Lo strumento lo segnala invece di inventare un risultato.

## L’eccezione delle variabili

Una variabile in qualsiasi punto del valore sospende del tutto la sostituzione del prefisso e sposta la risoluzione dell’upstream al momento della richiesta, il che di solito richiede un `resolver` e trasforma un errore sul nome in un errore in esecuzione invece che in uno che `nginx -t` intercetterebbe.

## Limiti dichiarati

Nessun `rewrite`, `try_files` o reindirizzamento interno: lo strumento dice quale percorso riceve il backend, non cosa fa l’intera richiesta. I blocchi upstream non vengono risolti nei rispettivi server, e le query string passano senza essere rappresentate.

## Condivisione dei risultati

Sotto il risultato, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il testo della casella così come l’hai inserito, una volta che la pagina ha un risultato. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Il valore di proxy_pass nomina un backend, un nome host o un indirizzo di solito interno, e la pagina lo ripropone nella versione opposta, quindi nulla viene tolto: il riquadro a comparsa ti chiede di controllarlo. Prima che venga proposto un link, nella casella viene cercata una credenziale definita da uno standard: una chiave privata PEM, una riga `Authorization` o `Proxy-Authorization` con qualsiasi schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezioni 11.6.2 e 11.7.2: il valore è costituito da credenziali, «consists of credentials»), una riga `Cookie` o `Set-Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezione 8.4: i server di solito conservano nel cookie un nonce, cioè un identificatore di sessione, «commonly store a nonce (or “session identifier”) in a cookie»), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1), un ID della chiave di accesso AWS o un valore FortiOS `ENC`; tutte consultate il 01/11/2026. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto (un membro JSON `token`, un `token=` in una query string) non blocca il link; il riquadro a comparsa indica il primo, così puoi controllarlo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La casella si compila come farebbe un incolla e la pagina calcola il percorso (l’upstream non viene mai risolto né contattato). I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
