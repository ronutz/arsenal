# Analizzatore dei codici di stato HTTP

Incolla dei codici di stato, singoli (`404`), diversi alla volta (`301 302 307`) o intere famiglie (`5xx`), e ottieni la decodifica di ciascuno: la famiglia a cui appartiene, il nome registrato, il significato documentato e le note operative che contano quando il codice compare in un log alle 3 di notte.

## Cosa spiega

Il registro alla base dello strumento si fonda sul catalogo dei codici di stato della RFC 9110 più le estensioni registrate (428/429/431/511 della RFC 6585, 451 della RFC 7725, 103 della RFC 8297). Le note riportano le distinzioni che insegna l’[articolo complementare](/learn/http-status-codes-the-five-families) di questo sito: quali reindirizzamenti preservano il metodo (307/308) e quali storicamente non lo facevano (301/302), perché 304 è un handshake di cache e non un reindirizzamento, perché 401 deve arrivare con `WWW-Authenticate` mentre 403 rifiuta in ogni caso, e la lettura del trio dei proxy nel triage degli incidenti: 502 dà la colpa al dialogo con il backend, 503 alla capacità del servizio, 504 all’orologio.

## La regola di fallback, come funzionalità

Incolla un codice valido che il registro non ha mai incontrato, un `599` arrivato da qualche middlebox, e lo strumento non dà errore. Risponde con la regola di compatibilità con le versioni future del protocollo stesso: un client che non riconosce un codice deve trattarlo come lo `x00` della sua famiglia, quindi la sola prima cifra definisce il comportamento richiesto. È grazie a questa regola che il registro dei codici di stato è potuto crescere per trent’anni senza rompere un solo client vecchio, e lo strumento la considera una risposta che merita di essere mostrata, non una lacuna di cui scusarsi.

## Grammatica dell’input

Token separati da spazi, virgole o a capo. Ogni token è o un numero di tre cifre tra 100 e 599 o una famiglia nella forma da `1xx` a `5xx`. I duplicati vengono eliminati mantenendo l’ordine; il limite è di venti token per esecuzione. Tutto viene eseguito in locale nel tuo browser.

## Condivisione dei risultati

In cima alla lettura, sopra le schede, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il testo della casella così come l’hai inserito, e nient’altro: codici di stato e famiglie, che non dicono nulla di te. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. I link del decodificatore di messaggi HTTP che passano un codice di stato a questa pagina usano lo stesso `#input=` e compilano la casella allo stesso modo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il testo non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Il testo compila la casella come farebbe la digitazione e la pagina lo spiega; nulla viene inviato da nessuna parte. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (consultata il 09/11/2026): il catalogo principale, le regole delle famiglie e il fallback x00
- [RFC 6585, Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585) (consultata il 09/11/2026): 428, 429, 431 e 511
- [RFC 7725, An HTTP Status Code to Report Legal Obstacles](https://www.rfc-editor.org/rfc/rfc7725) (consultata il 09/11/2026): 451 Unavailable For Legal Reasons
- [RFC 8297, An HTTP Status Code for Indicating Hints](https://www.rfc-editor.org/rfc/rfc8297) (consultata il 09/11/2026): 103 Early Hints
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 01/11/2026): sezione 3.5, il frammento, che usa un link creato con Condividi i risultati
