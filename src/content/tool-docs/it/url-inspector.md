## Cosa fa

Scomponi qualsiasi URL nelle sue parti con nome: lo schema, l’host, la porta, il percorso, i singoli parametri della query e il frammento. Lo strumento decodifica le sequenze con codifica percentuale e i nomi host internazionalizzati (punycode), segnala le credenziali incorporate e altri problemi, e mostra la porta predefinita dello schema. Tutto viene eseguito nel tuo browser.

## Le parti di un URL

Un URL ha una grammatica definita, stabilita dalla RFC 3986, e lo strumento lo divide nei suoi componenti di primo livello: lo **schema** (come `https`), l’**authority** (che contiene l’eventuale userinfo, l’**host** e la **porta**), il **percorso**, la **query** e il **frammento**. Poi divide la query string nei singoli parametri e decodifica ciascuno dalla codifica percentuale, così una query lunga diventa un elenco leggibile di coppie nome-valore invece di un’unica stringa opaca. Secondo lo URL Standard del WHATWG, tratta un `+` in una query con codifica da modulo come uno spazio.

## Analizzato così come è scritto, non normalizzato

Una scelta di progetto importante: lo strumento analizza l’URL esattamente come l’hai fornito e non lo normalizza in silenzio. È importante perché le differenze che un browser appianerebbe senza dire nulla sono spesso proprio ciò che stai cercando di vedere: una porta inattesa, una barra raddoppiata, un carattere codificato fuori posto. Mostrare l’URL così come è scritto è ciò che lo rende utile per il debug e per notare qualcosa di sospetto.

## Decodifica e segnalazioni

Lo strumento mette in evidenza in particolare due cose:

- **Nomi host internazionalizzati.** Un’etichetta dell’host in forma punycode (che inizia con `xn--`) viene decodificata nel suo testo Unicode (RFC 3492 e il framework IDNA della RFC 5890), così puoi vedere il nome reale, e questo aiuta anche a scoprire i trucchi con domini dall’aspetto simile.
- **Credenziali incorporate.** Un URL può contenere un nome utente e una password nella forma `user:pass@host`, e lo strumento lo segnala, perché le credenziali in un URL sono un errore comune e un problema di sicurezza.

## Come si usa

Incolla un URL e leggi schema, host, porta, percorso, parametri della query decodificati e frammento, con l’eventuale presenza di credenziali o altri problemi segnalata. L’analisi è deterministica e locale, quindi puoi analizzare qualsiasi URL senza rischi, anche uno che non vuoi visitare.

## Condivisione dei risultati

Sotto la striscia Anatomia, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` l’URL con la password e gli eventuali parametri token sostituiti da `REDACTED`, mai così come l’hai inserito: la striscia Anatomia mostra l’intero URL, password compresa. Il suo riquadro a comparsa indica prima cosa contiene il link e quanti valori sono stati sostituiti, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Cosa viene sostituito:

- **La password nell’userinfo**, il testo dopo i primi due punti: la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1, stabilisce che le applicazioni non dovrebbero mostrare in chiaro nulla di ciò che segue i primi due punti («should not render as clear text any data after the first colon»). Il nome utente resta.
- **I parametri della query e del frammento** con il nome di un segreto: `access_token` in una query ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), sezione 2.3) o in un frammento, dove lo restituisce un implicit grant ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sezione 4.2.2); `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sezione 4.1.2); `X-Amz-Signature` e `X-Amz-Security-Token` per intero, e di `X-Amz-Credential` solo l’ID della chiave di accesso AWS, così l’ambito della credenziale che lo segue (la data, la Regione e il servizio) resta leggibile, ed è di solito lì che si trova la causa di un URL prefirmato che non funziona ([Create a signed AWS API request](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html), consultata il 01/11/2026); `sig` ([Create a service SAS](https://learn.microsoft.com/en-us/rest/api/storageservices/create-service-sas), consultata il 01/11/2026); `key` ([Use API keys to access APIs](https://cloud.google.com/docs/authentication/api-keys-use), consultata il 01/11/2026); e qualsiasi nome che termina con token, secret, password o api key.

L’host, la porta, il percorso e ogni altro parametro restano così come li hai inseriti, e i vettori di condivisione dello strumento verificano che la pagina che apre il link legga le stesse parti. Una nota che riguardava solo un valore sostituito (una sequenza con codifica percentuale o un `+` al suo interno) viene rimossa insieme al valore. Se una chiave o un token resta in un punto che nessun nome contrassegna (un JWT nel percorso), il link non viene creato, e il riquadro a comparsa lo indica.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la copia non viene inviata al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La copia riempie il campo come farebbe un incolla e la pagina la scompone. Come per ogni link `#input=` verso questa pagina, il valore resta nell’indirizzo finché non modifichi il campo.
