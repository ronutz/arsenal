## Cosa fa

Incolla una risposta di statistiche iControl REST e lo strumento la appiattisce in una riga per statistica. Toglie gli involucri `entries`, `nestedStats`, `value` e `description`, riduce le chiavi URL agli oggetti che indicano e raggruppa il risultato per oggetto. È una pura trasformazione locale: non viene scaricato nulla e nulla lascia il browser.

## Perché la risposta va appiattita

Un payload di statistiche BIG-IP avvolge ogni foglia in `value` o `description`, ogni livello in `entries` e `nestedStats`, e usa come chiave dell’oggetto esterno un URL completo. Tre involucri attorno a un solo numero. La forma è autodescrittiva più che perversa, ma non si legge a colpo d’occhio, e un pool con i suoi membri può annidarsi su quattro livelli.

## La divisione a 64 bit, cioè la parte che conta

F5 divide i contatori grandi nelle metà `.high` e `.low` perché i numeri JSON non possono contenere in modo sicuro un intero a 64 bit. `serverside.bitsIn.high = 3` e `serverside.bitsIn.low = 1000000` **non sono due statistiche**: sono un solo contatore il cui valore è `(high << 32) + low`, cioè 12.885.901.888.

**Lo strumento le ricompone e segnala i valori ricomposti**, così puoi controllare il calcolo invece di fidarti. Un appiattitore che riporta le due metà separatamente sottostima senza avvisarti proprio i tuoi contatori più trafficati.

## Totali, non frequenze

Ogni contatore è un totale dall’ultimo azzeramento, e il payload non contiene alcun intervallo. **Un solo campione non può produrre una frequenza.** Lo strumento lo dice a ogni decodifica, perché tracciare il grafico di un contatore invece della sua derivata è un modo comune di costruire una dashboard che sale per sempre.

## Cosa non fa

Non interpreta le statistiche e non conosce il tuo intervallo di polling. Rifiuta una risposta di configurazione con un messaggio chiaro invece di produrre un output vuoto, dato che l’assenza di un oggetto `entries` è l’indizio affidabile.

## Condivisione dei risultati

Sotto il testo appiattito, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la risposta delle statistiche così come l’hai incollata. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Una risposta di statistiche contiene contatori e gli oggetti a cui appartengono, non una credenziale: iControl REST trasporta il token nell’intestazione `X-F5-Auth-Token` della richiesta ([guida AS3 di F5, Authentication and Authorization](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/userguide/authentication.html), consultata il 27/10/2026). La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la risposta non viene inviata al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; le statistiche di una collezione possono superarlo, e allora il riquadro a comparsa indica la lunghezza della condivisione invece di offrire un link.
- **Apertura di un link.** Il JSON compila la casella come farebbe un incolla e la pagina lo appiattisce. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
