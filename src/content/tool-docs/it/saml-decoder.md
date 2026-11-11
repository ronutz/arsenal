## Cosa fa

Incolla una SAML Response o un’asserzione, come XML grezzo, in base64 o con codifica URL, e lo strumento la decodifica: l’emittente, lo stato, il soggetto, le condizioni, i destinatari (audience) e gli attributi. Insieme alla decodifica esegue una valutazione di sicurezza basata su regole, e analizza l’XML in un modo protetto contro XXE. Tutto avviene nel tuo browser.

## SAML in breve

SAML (Security Assertion Markup Language) è lo standard basato su XML alla base di gran parte del single sign-on aziendale. Dopo l’autenticazione, un identity provider emette un’**Assertion** firmata, di solito racchiusa in una **Response**, che attesta a un service provider chi sei. Le parti che lo strumento estrae sono quelle che decidono se quell’asserzione merita fiducia: l’**Issuer** (quale IdP), lo **Status** (se l’autenticazione è riuscita), il **Subject** con il suo NameID (chi), le **Conditions** (la finestra di validità e l’**AudienceRestriction**, che nomina il destinatario dell’asserzione) e gli **Attributes** (le attestazioni sull’utente). Poiché SAML viaggia codificato in base64 con il binding HTTP-POST, spesso con la codifica URL dentro un campo di modulo, lo strumento annulla prima queste codifiche; un messaggio compresso con DEFLATE per il binding HTTP-Redirect viene rifiutato, con un errore che chiede l’XML grezzo o il modulo HTTP-POST.

## Il modello di sicurezza: il rifiuto di XXE

La caratteristica principale di questo strumento è il modo in cui analizza l’XML. L’XML non attendibile è pericoloso a causa degli attacchi XXE (XML External Entity) e degli attacchi di espansione delle entità come il billion laughs, ed entrambi richiedono che il documento dichiari una DTD, con una dichiarazione `DOCTYPE` o `<!ENTITY>`, per definire le proprie entità. Un messaggio SAML legittimo non ha mai bisogno di una DTD, quindi il parser rifiuta senza eccezioni qualsiasi documento che ne contenga una. Questa sola regola sconfigge per costruzione l’XXE classico e l’espansione billion laughs, invece di cercare di neutralizzarli a posteriori.

## Cosa verifica la valutazione

Oltre alla decodifica, lo strumento valuta il messaggio rispetto alle indicazioni di sicurezza per SAML: se è firmato, se si affida ad algoritmi di firma o di digest deboli (come SHA-1) e se le sue condizioni e i suoi destinatari sono presenti e coerenti. Se l’asserzione è cifrata, lo strumento rileva l’`EncryptedAssertion` e la segnala invece di tentare di decifrarla. Questi controlli riprendono le domande delle indicazioni OWASP su SAML, quindi l’output indica ciò che causa davvero le vulnerabilità SAML.

## Come si usa

Incolla una SAML Response o un’asserzione in una qualsiasi delle sue forme comuni e leggi l’emittente, lo stato, il soggetto, le condizioni, i destinatari e gli attributi decodificati, insieme alla valutazione di sicurezza. L’analisi è deterministica e locale, e il parser che rifiuta XXE permette di esaminare in sicurezza messaggi non attendibili.

Per leggere un messaggio lungo disposto riga per riga, il [formattatore e validatore XML](/tools/xml-formatter) lo formatta in modo leggibile; la sua documentazione spiega perché un messaggio firmato non va inoltrato dopo essere stato riformattato.

## Condivisione dei risultati

Sotto i badge principali, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il messaggio così come l’hai incollato (XML grezzo, con codifica URL o in base64), non appena la pagina lo ha decodificato. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Un messaggio SAML nomina il tuo identity provider e il tuo service provider, e un soggetto può nominare una persona, quindi il riquadro a comparsa ti chiede di controllarlo prima di inviare il link.

Un messaggio che contiene una credenziale non ottiene alcun link: un’asserzione firmata, un’asserzione dentro una Response firmata o un’`EncryptedAssertion`. [SAML 2.0 Profiles](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf) (OASIS, consultato il 01/11/2026) dice del metodo bearer che il soggetto dell’asserzione è chi la porta («the subject of the assertion is the bearer of the assertion», sezione 3.3), e che le asserzioni consegnate con il binding HTTP POST devono essere firmate («MUST be signed», sezione 4.1.4.5); il service provider ricorda gli ID già usati solo finché l’asserzione è valida. Quindi un’asserzione firmata fa accedere il suo soggetto, e un link la consegnerebbe a chiunque lo riceva, fino alla sua scadenza; un’asserzione cifrata ([SAML 2.0 Core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf), sezione 2.3.4) è un’asserzione che il service provider può aprire. Rimuovere la firma cambierebbe ciò che la pagina mostra, quindi non viene offerta nemmeno una copia del messaggio. Ottengono invece un link un AuthnRequest, un LogoutRequest o un LogoutResponse, i metadati, una Response di errore (che non deve contenere asserzioni, «MUST NOT include any assertions», Profiles, sezione 4.1.4.2) e un’asserzione non firmata.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Il messaggio compila la casella come farebbe un incolla e la pagina lo decodifica, in locale; non verifica, non scarica e non decifra mai nulla. I valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
