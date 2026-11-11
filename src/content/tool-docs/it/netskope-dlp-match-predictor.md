## Cosa fa lo strumento

Spiega perché una regola DLP (data loss prevention) è scattata, o non è scattata, separando tre cose che di solito vengono confuse in una sola e che falliscono separatamente:

1. **Candidati**: quante stringhe hanno il formato giusto
2. **Corrispondenze**: quante di queste superano il checksum
3. **Soglia**: se quel conteggio raggiunge ciò che la regola richiede

Una regola che non è scattata ha fallito esattamente in uno di questi punti, e sapere quale ti dice cosa cambiare.

## Perché il checksum conta più del pattern

Un identificatore di dati predefinito non è un’espressione regolare. Una stringa di sedici cifre è un *candidato*; se valga come corrispondenza dipende dall’aritmetica.

Questo solo fatto spiega la maggior parte delle discussioni sulla taratura del DLP. **«Ha segnalato il numero di un ordine di acquisto»** di solito è un numero che per caso supera il controllo di Luhn. **«Non ha rilevato una carta vera»** di solito è una carta con due cifre invertite, che non supera Luhn e quindi, per il motore, non è una carta. Nessuna delle due lamentele si risolve discutendo del pattern.

## Gli identificatori

**Carta di pagamento**: l’algoritmo di Luhn, come specificato per i numeri di carta. Nota che le carte valide vanno da tredici a diciannove cifre, quindi le regole scritte attorno a sedici cifre non rilevano le altre.

**CPF e CNPJ**: gli identificatori brasiliani, ciascuno con due cifre di controllo mod 11. Le sequenze di cifre ripetute come `111.111.111-11` soddisfano l’aritmetica ma non vengono mai emesse, quindi vengono rifiutate.

Questi tre sono qui perché la loro convalida è un algoritmo pubblicato e non ambiguo. Un identificatore le cui regole non sono pubbliche non si può riprodurre onestamente.

## Privacy

Tutto resta nel tuo browser. Nulla di ciò che incolli viene trasmesso, memorizzato o registrato, e qui conta più che per la maggior parte degli strumenti, perché lo scopo è proprio incollare contenuti che sospetti siano sensibili.

## Limiti dichiarati

**Questo non è il motore di Netskope.** Riproduce il passaggio del checksum, quello che coglie di sorpresa. Parole chiave di prossimità, dizionari, document fingerprinting, exact data match, OCR e rilevamento del tipo di file sono tutti fuori ambito, e nessuno di essi viene approssimato.

Il rilevamento del formato qui è volutamente semplice, quindi un risultato di zero candidati significa *lo strumento non ne ha trovati*, non *la piattaforma non ne troverebbe*. Inoltre un numero ripetuto viene contato una sola volta; il fatto che una piattaforma conti le occorrenze o i valori distinti cambia il comportamento della soglia, ed è una configurazione che lo strumento non riproduce.

## Condivisione dei risultati

Sotto il verdetto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che non contiene mai il tuo testo. La casella contiene ciò che sospetti sia sensibile: numeri di carte di pagamento (un PAN, «primary account number», è il numero univoco della carta di pagamento che identifica l’emittente e il conto del titolare, «unique payment card number ... that identifies the issuer and the cardholder account», [glossario del PCI SSC](https://www.pcisecuritystandards.org/glossary/), consultato il 01/11/2026), numeri CPF e CNPJ, e le parole che li circondano. Ciò che la pagina diagnostica è strutturale, quindi il link contiene dopo il `#` dei sostituti: una riga per candidato, nell’ordine della pagina, ciascuna con i separatori e la lunghezza del candidato e con cifre generate dalla pagina (zeri, la posizione del candidato nell’elenco e cifre di controllo scelte in modo che il checksum riesca o fallisca esattamente come per il candidato, con la conferma degli stessi controlli di Luhn e mod 11 che la pagina esegue); una sequenza di cifre ripetute, che non è il numero di nessuno, viene inclusa così com’è. Vengono inclusi anche l’identificatore e la soglia. Prima di proporre il link, la pagina rilegge i sostituti e deve arrivare alla stessa diagnosi (gli stessi candidati per formato, risultato e motivo, lo stesso conteggio, lo stesso verdetto e gli stessi rilievi), altrimenti il link non viene creato. Un testo senza candidati non ottiene alcun link, perché la sua diagnosi riguarda il testo stesso. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** I sostituti compilano la casella, l’identificatore e la soglia vengono impostati e la pagina esegue la valutazione; una nota sotto il verdetto indica che i numeri sono sostituti. Un link le cui righe non sono sostituti validi per la loro posizione viene ignorato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
