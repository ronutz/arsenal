## Cosa fa

Incolla un XML e lo strumento lo analizza trasformandolo in una struttura leggibile: la dichiarazione XML, il DOCTYPE e le eventuali entità che dichiara, e l’albero completo degli elementi con i suoi namespace e attributi, insieme a CDATA, commenti e istruzioni di elaborazione. Verifica che il documento sia ben formato ed esegue un’analisi di sicurezza della superficie di attacco XML. Non recupera nulla e non risolve nulla.

## Cosa mostra

Un XML racchiude diversi tipi di nodo in un unico documento, e lo strumento li separa: la **dichiarazione** con la sua versione e la sua codifica; il **DOCTYPE** e le eventuali **entità** che definisce; l’**albero degli elementi**, con i **namespace** (le associazioni `xmlns`) e gli **attributi** mostrati per ogni elemento; e le sezioni **CDATA**, i **commenti** e le **istruzioni di elaborazione**. Verifica anche la buona formazione nel senso XML: che ogni tag abbia il suo corrispondente e che il documento abbia esattamente un elemento radice.

## La superficie di attacco XML

L’XML è potente in un modo che lo rende pericoloso quando arriva da una fonte non attendibile, e l’analisi di sicurezza dello strumento segnala esattamente dove si trova quel pericolo:

- **La presenza stessa di un DOCTYPE**, perché la definizione del tipo di documento è ciò che rende possibile tutto il resto;
- **Le entità esterne**, che possono incorporare un file locale o un URL e sono il meccanismo degli attacchi XXE (XML External Entity);
- **Le entità parametrica**, una forma usata per far passare un attacco XXE oltre le difese più ingenue; e
- **L’espansione delle entità**, l’annidamento alla base dell’attacco denial of service noto come billion laughs.

Vederli segnalati è proprio lo scopo: ti dice se un certo documento sta cercando di fare qualcosa che un semplice documento di dati non farebbe mai.

## Sicuro per costruzione

Lo strumento è un tokenizzatore di testo, non un processore XML. Legge il documento come testo e ne descrive la struttura, e non risolve mai un’entità, non apre mai un riferimento esterno e non espande mai nulla. È questo che gli permette di analizzare in sicurezza un XML ostile: le funzionalità stesse da cui ti mette in guardia vengono descritte, non eseguite. È la controparte generica del decodificatore SAML, che rifiuta del tutto una DTD perché un messaggio SAML legittimo non ne ha mai una.

## Come si usa

Incolla un documento XML e leggine la dichiarazione, il DOCTYPE e le entità, l’albero degli elementi e le segnalazioni di sicurezza. L’analisi è deterministica e avviene in locale, quindi esaminare XML di qualsiasi provenienza è sicuro.

Per tutte le regole di buona formazione di XML 1.0, con la riga e la colonna del primo errore, e per formattare un documento in modo leggibile o compattarlo, usa il [formattatore e validatore XML](/tools/xml-formatter).

## Condivisione dei risultati

Sotto il verdetto sulla buona formazione, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il documento così come l’hai incollato, una volta che la pagina lo ha letto come XML. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Un XML può nominare host e persone interni, quindi il riquadro a comparsa ti chiede di rileggerlo prima di inviare il link. Prima che venga offerto un link, nel testo viene cercata una credenziale definita da uno standard: una chiave privata PEM, una riga `Authorization` o `Proxy-Authorization` con qualsiasi schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezioni 11.6.2 e 11.7.2: il valore è costituito da credenziali, «consists of credentials»), una riga `Cookie` o `Set-Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezioni 4.1.1, 4.2.1 e 8.4, dove un cookie contiene di solito un identificatore di sessione), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1), un ID della chiave di accesso AWS o un valore `ENC` di FortiOS; tutte consultate il 01/11/2026. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto (un membro JSON `token`, un `password=` nella query di un URL) non blocca il link; il riquadro a comparsa indica il primo, così puoi controllarlo. Qui contano come credenziali altri due punti: la `Password` di un `UsernameToken` WS-Security ([OASIS UsernameToken Profile 1.1.1](https://docs.oasis-open.org/wss-m/wss/v1.1.1/os/wss-UsernameTokenProfile-v1.1.1-os.html), consultato il 01/11/2026: fornisce informazioni sulla password o un equivalente come un hash, «provides password information (or equivalent such as a hash)») e un’asserzione SAML firmata o cifrata, come nel decodificatore SAML. Un elemento o un attributo il cui nome sembra un segreto (`password`, `apiKey`, `client_secret`) viene invece indicato nel riquadro a comparsa.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Il documento compila la casella come farebbe un incolla e la pagina lo legge, in locale: nessuna entità viene risolta e nulla viene recuperato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
