## Cosa fa

Descrivi la situazione (dispositivo gestito o no, in sede o in mobilità, se il bundle dei certificati può essere installato, se la policy deve nominare l’utente) e lo strumento indica quale metodo di steering è adatto: il client sull’endpoint, un tunnel IPsec o GRE, un proxy esplicito o il chaining a partire da un proxy già presente. **Ogni metodo elenca quanto costa, che sia scelto o no**, perché uno strumento che elencasse solo gli svantaggi delle opzioni scartate sarebbe una pubblicità per quella prescelta.

## L’interazione da cui mette in guardia

**Il client rileva gli altri metodi di steering e per impostazione predefinita si disattiva quando trova IPsec, GRE o un proxy esplicito.** Quindi usarli entrambi non è automaticamente una doppia protezione: ne funziona uno solo, deciso da un’impostazione che la maggior parte delle persone non ha mai aperto.

Lo strumento propone anche la terza soluzione: distribuire il client accanto al tunnel **non per lo steering**, ma per fornire i certificati e l’identità dell’utente. Il tunnel trasporta il traffico; il client dice chi è l’utente.

## Il limite rigido che dichiara

**Senza i certificati radice e intermedi di Netskope sull’endpoint non c’è ispezione TLS né autenticazione SAML.** Il traffico arriva e la policy si basa solo sui metadati. Una regola scritta come se il contenuto fosse visibile sembrerà corretta nella console e non farà ciò che il suo autore crede.

## Differenze rispetto all’analizzatore delle decisioni di steering

Rispondono a domande diverse e sono entrambi su questo sito:

- **Questo strumento risponde a una domanda di progetto**: quale via d’accesso (on-ramp) va distribuita in questa situazione?
- **L’analizzatore delle decisioni di steering risponde a una domanda sul comportamento in esercizio**: data una configurazione di steering già in uso, cosa succede a *questo flusso specifico*: inoltrato, bypass, bloccato o diretto?

Scegli il metodo qui; segui il flusso lì.

## Cosa non fa

Non conosce le tue licenze, il tuo tenant né la tua configurazione esistente. Lo steering DNS, per esempio, richiede licenze specifiche e si applica solo a determinati tipi di configurazione, cosa che lo strumento non può verificare per te.

## Condivisione dei risultati

Sotto il titolo dei metodi, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` le sette risposte, ciascuna come 1 o 0, sempre, così il link conserva il suo significato anche se un valore predefinito cambia. Le risposte descrivono una situazione e non nominano alcun sistema né alcuna persona. La pagina mostra i metodi fin dall’apertura, quindi il pulsante è subito disponibile. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Le caselle vengono spuntate come se le avessi selezionate, e i metodi seguono. Un link a cui manca una risposta viene ignorato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
