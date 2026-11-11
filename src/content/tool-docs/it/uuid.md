## Cosa fa

Genera UUID, oppure incollane uno esistente per analizzarlo. La generazione produce un UUID versione 4 casuale o un UUID versione 7 ordinato nel tempo, usando la sorgente casuale sicura del browser (`crypto.getRandomValues`). L’analisi accetta qualsiasi UUID e indica se è valido, di quale versione e variante è e, per un valore versione 7, l’istante di creazione incorporato al suo interno. Tutto viene eseguito nel tuo browser.

## Che cos’è un UUID

Un UUID è un identificatore a 128 bit, scritto come 32 cifre esadecimali nel noto raggruppamento 8-4-4-4-12, ad esempio `f47ac10b-58cc-4372-a567-0e02b2c3d479`. Il suo scopo è essere unico senza un’autorità centrale che distribuisca i numeri: chiunque può generarne uno e contare sul fatto che non entri in collisione con quelli di altri. Due campi fissi ne codificano la struttura: un nibble di versione, che indica come è stato creato l’UUID, e un campo variante, che lo contrassegna come UUID RFC 4122/9562.

## Versione 4 e versione 7

- **La versione 4** è quasi interamente casuale: 122 dei suoi 128 bit provengono dalla sorgente casuale, e gli altri 6 sono i bit fissi di versione e variante. È la scelta predefinita giusta quando ti serve solo un ID imprevedibile e resistente alle collisioni e l’ordinamento non ti interessa.
- **La versione 7** è ordinata nel tempo. I suoi 48 bit più significativi sono un timestamp Unix in millisecondi, seguito da 74 bit casuali. Poiché il timestamp è all’inizio, gli UUID versione 7 si ordinano secondo l’ordine di creazione, e questo li rende molto migliori della versione 4 come chiavi primarie di un database: gli inserimenti sequenziali mantengono compatto un indice invece di sparpagliare le scritture al suo interno.

La versione 7 è stata introdotta dalla RFC 9562, la specifica del 2024 che ha aggiornato e reso obsoleta la RFC 4122 originale.

## Analisi di un UUID

Incolla qualsiasi UUID e lo strumento lo analizza senza generare nulla: conferma il formato, legge versione e variante dalle loro posizioni fisse e, per un UUID versione 7, riconverte in una data il timestamp a 48 bit incorporato. Quest’ultima parte è il trucco utile: un ID versione 7 porta con sé, senza darlo a vedere, il momento in cui è stato creato, quindi puoi leggere l’istante di creazione di un record direttamente dalla sua chiave.

## Come si usa

Genera un UUID v4 o v7 con un clic, oppure incolla un UUID esistente per leggerne la versione, la variante e, per v7, il timestamp. La generazione attinge alla sorgente casuale sicura, quindi i valori v4 sono imprevedibili; l’analisi è una pura lettura e rivela solo ciò che l’UUID stesso codifica.

## Condivisione dei risultati

Sotto la lettura della casella di analisi, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il valore della casella di analisi. Gli UUID che hai generato non sono inclusi: ognuno proviene dalla sorgente casuale del tuo browser, e chi apre il link preme Genera per ottenere i propri. Un UUID non riporta nulla di tuo. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** Il valore riempie la casella di analisi come farebbe un incolla e la pagina lo legge (un valore che non è un UUID mostra «UUID non valido», come quando lo digiti). I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
