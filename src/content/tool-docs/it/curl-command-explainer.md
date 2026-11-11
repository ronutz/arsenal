## Cosa fa

Incolla un comando `curl` e lo strumento lo spiega opzione per opzione, poi lo traduce in altre quattro forme: una chiamata `fetch` del browser, una richiesta HTTP grezza, un comando HTTPie e codice Python `requests`. Il comando viene suddiviso in token e decodificato nel tuo browser; nulla viene mai inviato e nessuna richiesta viene eseguita.

## Un’analisi, cinque viste

Dietro le quinte c’è un solo passaggio: lo strumento analizza il tuo comando `curl` trasformandolo in un unico modello di richiesta, che raccoglie il metodo, l’URL, le intestazioni, il corpo, l’autenticazione e le altre opzioni. Tutto ciò che vedi deriva da quell’unico modello. Poiché tradurre correttamente un comando richiede già di capire ogni opzione, la spiegazione opzione per opzione è semplicemente quello stesso modello mostrato con delle etichette, ed è per questo che la spiegazione e le traduzioni coincidono sempre.

## Come legge le opzioni

Ogni opzione a cui curl assegna un argomento lo prende anche qui, nel modo in cui lo legge curl, così un valore non viene mai scambiato per l’URL. L’elenco è la tabella delle opzioni di curl stesso ([src/tool_getparam.c](https://raw.githubusercontent.com/curl/curl/master/src/tool_getparam.c), consultato il 01/11/2026), verificata rispetto alla [pagina man di curl](https://curl.se/docs/manpage.html) (consultata il 01/11/2026). Le opzioni che danno forma alla richiesta vengono spiegate una per una; ogni altra viene nominata con il suo argomento. Alcune richiedono più di un nome:

- **`--oauth2-bearer`** è l’autenticazione Bearer ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), sezione 2.1): le traduzioni inviano `Authorization: Bearer` e il token, a meno che non sia scritta un’intestazione `Authorization` con `-H`, che curl invia al suo posto.
- **`-u user:password`** è l’autenticazione Basic, il metodo predefinito di curl ([manuale di curl](https://curl.se/docs/manpage.html), `--basic`, consultato il 01/11/2026): le traduzioni `fetch` e HTTP grezzo inviano `Authorization: Basic` e il Base64 di `user:password` ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), sezione 2, consultata il 01/11/2026), HTTPie riceve il proprio `-a user:password` e Python `requests` il proprio `auth=`. Con `--digest`, HTTPie riceve `-A digest` e `requests` il suo `HTTPDigestAuth` ([documentazione di requests](https://requests.readthedocs.io/en/latest/user/authentication/), consultata il 01/11/2026). Con il solo nome utente, curl chiede la password, quindi `fetch` e HTTP grezzo non contengono alcun campo e anche `-a user` di HTTPie chiede la password. Con `--digest`, `--ntlm`, `--negotiate`, `--anyauth` o `--aws-sigv4` non viene scritto alcun campo Basic, perché quei metodi rispondono a una challenge o firmano la richiesta. Un’intestazione `Authorization` scritta con `-H`, o `--oauth2-bearer`, ha la precedenza.
- **`--json`** è, secondo la pagina man, una scorciatoia per `--data-binary`, `--header "Content-Type: application/json"` e `--header "Accept: application/json"`: il corpo è il JSON così come è scritto, più parti `--json` vengono unite senza nulla in mezzo, e un’intestazione scritta con `-H` sostituisce quella aggiunta da `--json`.
- **`--url-query`** aggiunge il suo argomento alla fine della query dell’URL, codificato come lo codifica `--data-urlencode`, oppure così come è scritto quando inizia con `+`; un argomento letto da un file (`name@file`) viene nominato ma non può essere aggiunto.
- **`-U` / `--proxy-user`, `-E` / `--cert`, `--proxy-cert`, `--pass`, `--proxy-pass`, `--tlspassword`, `--proxy-tlspassword`, `--httpsig-key` e `--ftp-account`** vengono spiegate senza il loro segreto: l’utente, o il file del certificato, viene mostrato; una password, una passphrase, una chiave o i dati dell’account no.

## Le forme che produce

- **curl spiegato.** Ogni opzione viene nominata e descritta, così un’opzione poco nota smette di essere un mistero.
- **fetch.** La chiamata alla Fetch API del browser, secondo la semantica di MDN, pronta da inserire in JavaScript.
- **HTTP grezzo.** La vera riga di richiesta, le intestazioni e il corpo come viaggerebbero in rete, che è il modo più chiaro per vedere esattamente cos’è una richiesta.
- **HTTPie.** Il comando `http` equivalente, per chi preferisce quel client.
- **Python requests.** Il codice equivalente con la libreria Requests.

## Perché tradurre invece di eseguire

Lo strumento, per scelta, non esegue mai la richiesta. È una scelta di privacy e di sicurezza: puoi decodificare e convertire un comando che contiene credenziali o punta a un host interno senza che nulla lasci il tuo browser, e senza innescare ciò che la richiesta farebbe. È un traduttore e un analizzatore, non un client.

## Come si usa

Incolla un comando `curl` e leggi la spiegazione opzione per opzione e le quattro traduzioni. La conversione è deterministica e avviene in locale, quindi lo stesso comando produce sempre lo stesso output.

Lo strumento inverso è il [Traduttore di richieste HTTP](/tools/http-request-translator): incolla una richiesta grezza e ottieni un comando eseguibile. Se sei arrivato qui cercando quello, si è spostato sotto il nome che lo descrive.

## Condivisione dei risultati

Sotto la riga di richiesta, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il comando con ogni credenziale sostituita da `REDACTED`, mai così come l’hai inserita: un comando curl incollato durante il debug di un’API ne contiene spesso una, e questa pagina mostra in chiaro i valori delle intestazioni, i cookie e, nella traduzione Python, una password `-u`. Il suo riquadro a comparsa indica prima cosa contiene il link e quanti valori sono stati sostituiti, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Cosa viene sostituito, ogni valore dove lo definisce la [pagina man di curl](https://curl.se/docs/manpage.html) (consultata il 01/11/2026) o uno standard HTTP:

- **`-u` / `--user` e `-U` / `--proxy-user`**: la password, dato che nome utente e password vengono separati al primo segno di due punti («The username and passwords are split up on the first colon»); l’utente resta.
- **`--oauth2-bearer`, `--pass`, `--proxy-pass`, `--tlspassword`, `--proxy-tlspassword` e `--ftp-account`**: l’intero valore; anche **`--httpsig-key`**, a meno che non indichi un file con `@`. **`-E` / `--cert` e `--proxy-cert`**: la password dopo il primo segno di due punti del certificato non scritto come `\:`.
- **`-H` / `--header` e `--proxy-header`**, in base al nome del campo: `Authorization` e `Proxy-Authorization` mantengono il loro schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezioni 11.6.2 e 11.7.2: il valore è costituito da credenziali, «consists of credentials»); Basic mantiene lo user-id e perde la password ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), sezione 2); un JWT mantiene la sua intestazione protetta e perde i claim e la firma ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1); una credenziale AWS Signature Version 4 (`AWS4-HMAC-SHA256`) mantiene il suo ambito della credenziale e `SignedHeaders` e perde l’ID della chiave di accesso e la firma ([Create a signed AWS API request](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html), consultata il 01/11/2026); `Cookie` mantiene i suoi nomi; un campo con un nome da segreto (`X-API-Key`, `X-Auth-Token`) viene sostituito per intero; un token dentro qualsiasi altro valore viene sostituito.
- **`-b` / `--cookie`**: ogni valore di `NAME1=VALUE1; NAME2=VALUE2` ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezione 4.2.1); un nome di file resta.
- **`-d` e la famiglia `--data`, `--json`, `--url-query` e `-F`**: i membri JSON e i parametri `name=value` il cui nome indica un segreto: `access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), sezioni 2.2 e 2.3), `refresh_token`, `client_secret`, `password` e `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sezioni 2.3.1, 4.1.2, 4.3.2 e 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), sezione 4.5) e qualsiasi nome che termina con token, secret, password o api key. Un `@file` resta.
- **L’URL, `--url`, `-x` / `--proxy` e `-e` / `--referer`**: la password di un `user:password@` ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1) e i parametri segreti della query e del frammento; di `X-Amz-Credential`, solo l’ID della chiave di accesso. L’argomento di qualsiasi altra opzione viene letto allo stesso modo, quindi un `--preproxy` o un host SOCKS scritto con `user:password@` perde la password.

Un valore vuoto, un segnaposto o una variabile di shell (`$TOKEN`) resta. Ogni sostituzione viene scritta sul posto, quindi la copia mantiene le virgolette, la spaziatura e le continuazioni di riga del testo incollato; un valore scritto con sequenze di escape al suo interno viene racchiuso di nuovo tra virgolette per intero. I vettori di condivisione dello strumento verificano che la pagina che apre il link legga la stessa richiesta. Se resta una chiave o un token dove nessun nome lo segnala (un JWT nel percorso di un URL, una chiave privata), il link non viene creato: il riquadro a comparsa indica la sua riga, e tu ci metti un segnaposto e premi di nuovo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la copia non viene inviata al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La copia compila la casella come farebbe un incolla e la pagina la spiega; nulla viene inviato o eseguito. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
