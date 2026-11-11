## Cosa fa

Legge un messaggio syslog così come è stato ricevuto, o un frame TCP che trasporta un messaggio, e nomina ogni campo nell’ordine in cui lo nomina la sua RFC. Prova due grammatiche: il messaggio RFC 5424 (PRI, VERSION, TIMESTAMP, HOSTNAME, APP-NAME, PROCID, MSGID, STRUCTURED-DATA, MSG) e la forma BSD descritta dalla RFC 3164 (PRI, TIMESTAMP, HOSTNAME, TAG, CONTENT). Il PRI viene scomposto in facility e gravità con le stesse tabelle usate dal [decodificatore PRI syslog](/tools/syslog-pri-decoder). Tutto ciò che non è conforme viene segnalato con le parole stesse della RFC, e i dati strutturati vengono scomposti elemento per elemento, con la spiegazione dei parametri registrati presso l’IANA. Non viene inviato nulla.

## Cosa verifica, e da dove viene ogni regola

RFC 5424 (marzo 2009), consultata il 05/10/2026:

- Il PRI: `<` PRIVAL `>`, PRIVAL = Facility × 8 + Severity, da tre a cinque caratteri; la RFC ammette uno zero subito dopo il < solo per il valore di priorità zero e vieta gli zeri iniziali in ogni altro caso («The only time a value of 0 follows the < is for the Priority value of 0. Otherwise, leading 0s MUST NOT be used», §6.2.1). Oltre 191 non esiste alcuna facility.
- VERSION: una cifra diversa da zero seguita da al massimo altre due cifre; il documento stesso usa la versione uno («This document uses a VERSION value of 1», §6.2.2).
- TIMESTAMP: un timestamp formalizzato che deriva da un’altra RFC («a formalized timestamp derived from RFC 3339»); i caratteri T e Z devono essere maiuscoli («The T and Z characters in this syntax MUST be upper case»); i secondi intercalari sono vietati («Leap seconds MUST NOT be used»); TIME-SECFRAC è un punto seguito da una a sei cifre; oppure il NILVALUE (§6.2.3 e §6).
- HOSTNAME da 1 a 255, APP-NAME da 1 a 48, PROCID da 1 a 128, MSGID da 1 a 32 caratteri US-ASCII stampabili, oppure il NILVALUE (§6).
- STRUCTURED-DATA: `[` SD-ID *(SP SD-PARAM) `]`, con gli elementi adiacenti; un SD-ID è lungo al massimo 32 caratteri; lo stesso SD-ID non può comparire più di una volta in un messaggio («The same SD-ID MUST NOT exist more than once in a message»); i nomi registrati non contengono la chiocciola, quelli privati ne contengono una seguita da un enterprise number; dentro un PARAM-VALUE i caratteri `"`, `\` e `]` vanno preceduti da un backslash di escape (§6.3). Gli SD-ID IANA definiti al §7 sono timeQuality (tzKnown, isSynced, syncAccuracy), origin (ip, enterpriseId, software, swVersion) e meta (sequenceId, sysUpTime, language); un parametro che non compare in quegli elenchi, sotto uno di quegli ID, viene segnalato.
- MSG: un MSG codificato in UTF-8 deve iniziare con il BOM Unicode («If a syslog application encodes MSG in UTF-8, the string MUST start with the Unicode byte order mask (BOM)», §6.4); un testo non ASCII senza il BOM ha una codifica sconosciuta e viene segnalato.
- Lunghezza: la RFC fissa una soglia che ogni destinatario deve accettare e una più alta che tutte le implementazioni dovrebbero accettare («Any transport receiver MUST be able to accept messages of up to and including 480 octets in length. All transport receiver implementations SHOULD be able to accept messages of up to and including 2048 octets in length», §6.1).

RFC 3164 (agosto 2001), consultata il 05/10/2026:

- Il pacchetto ha un limite di dimensione («MUST be 1024 bytes or less», §4.1).
- TIMESTAMP nella forma «Mmm dd hh:mm:ss» in ora locale, con il mese indicato da una delle dodici abbreviazioni inglesi; un giorno del mese a una sola cifra va scritto come uno spazio seguito dal numero («If the day of the month is less than 10, then it MUST be represented as a space and then the number», §4.1.2).
- HOSTNAME contiene il nome host con cui il dispositivo conosce se stesso o, se non ne ha uno, il suo indirizzo IP («will contain the hostname, as it knows itself. If it does not have a hostname, then it will contain its own IP address», §4.1.2).
- TAG è una stringa di caratteri alfanumerici ABNF di lunghezza limitata, che termina al primo carattere non alfanumerico («is a string of ABNF alphanumeric characters that MUST NOT exceed 32 characters. Any non-alphanumeric character will terminate the TAG field», §4.1.3).
- Un pacchetto il cui HEADER non si riesce a leggere: il destinatario tratta tutto ciò che segue il PRI come messaggio (§4.3).

Trasporti (fonti consultate il 05/10/2026): UDP sulla porta 514 (RFC 5426 §3.1); TCP con il conteggio degli ottetti (octet counting), «SYSLOG-FRAME = MSG-LEN SP SYSLOG-MSG», dove si può presumere questa delimitazione quando il frame inizia con una cifra («It can be assumed that octet-counting framing is used if a syslog frame starts with a digit»), oppure la delimitazione non trasparente (non-transparent framing) con un TRAILER che di solito è un LF ASCII («most often is ASCII LF») (RFC 6587 §3.4.1 e §3.4.2); TLS sulla porta TCP 6514 (RFC 5425 §4.1). Un conteggio iniziale o un newline finale nel testo incollato viene letto come la delimitazione corrispondente, e il conteggio dichiarato viene confrontato con gli ottetti effettivi del messaggio.

## Limiti

- Un messaggio alla volta. Un file di righe è compito della tua pipeline di log; incolla la riga che ti interessa.
- Il parser legge il messaggio, non la rete: non può sapere con quale trasporto è arrivato il messaggio, solo quali byte di delimitazione contiene.
- Il timestamp della forma RFC 3164 non ha né anno né fuso orario; il parser lo dice invece di indovinarli.
- L’input viene troncato a 8192 caratteri.

## Condivisione dei risultati

Sotto il verdetto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene il messaggio così come l’hai incollato (`#input=...`), e nient’altro. Prima che tu copi qualcosa, il riquadro a comparsa aggiunge un’avvertenza: un messaggio di log può nominare host, utenti e indirizzi, quindi rileggilo prima di inviare il link. Tutto ciò che il link contiene si trova dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un messaggio più lungo non ottiene il link e il riquadro a comparsa indica quanto sarebbe lungo.
- **Apertura di un link.** Il testo sostituisce il contenuto della casella (la pagina si apre con l’esempio caricato) come farebbe un incolla, e la pagina lo legge di nuovo. Accettati o no, i valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.

## Fonti

- [RFC 5424, The Syslog Protocol, sezioni da 6 a 7](https://www.rfc-editor.org/rfc/rfc5424.html#section-6) (consultata il 05/10/2026)
- [RFC 3164, The BSD syslog Protocol, sezioni da 4.1 a 4.3](https://www.rfc-editor.org/rfc/rfc3164.html#section-4.1) (consultata il 05/10/2026)
- [RFC 5426, Transmission of Syslog Messages over UDP](https://www.rfc-editor.org/rfc/rfc5426.html#section-3.1) (consultata il 05/10/2026)
- [RFC 5425, TLS Transport Mapping for Syslog, sezione 4.1](https://www.rfc-editor.org/rfc/rfc5425.html#section-4.1) (consultata il 05/10/2026)
- [RFC 6587, Transmission of Syslog Messages over TCP, sezioni 3.4.1 e 3.4.2](https://www.rfc-editor.org/rfc/rfc6587.html#section-3.4.1) (consultata il 05/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
