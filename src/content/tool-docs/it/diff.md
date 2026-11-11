## Cosa fa

Confronta due blocchi di testo e mostra esattamente cosa è cambiato: una vista riga per riga delle aggiunte e delle eliminazioni, con le parole evidenziate all’interno delle righe modificate, così individui la modifica precisa. Puoi scegliere di ignorare gli spazi bianchi o le maiuscole e minuscole. Tutto viene calcolato nel tuo browser; il tuo testo non viene mai inviato da nessuna parte.

## Come si calcola un diff

Un buon diff non è un ingenuo confronto riga per riga: trova il più piccolo insieme di modifiche che trasforma il primo testo nel secondo. Lo strumento lo fa calcolando la **sottosequenza comune più lunga** (LCS, Longest Common Subsequence) dei due testi, cioè la sequenza più lunga di token che compare, nello stesso ordine, in entrambi. Ciò che sta in quella sottosequenza comune è invariato; tutto ciò che sta nel primo testo ma non nella LCS è un’**eliminazione**, e tutto ciò che sta nel secondo testo ma non nella LCS è un’**inserzione**. È l’idea al centro del classico algoritmo di diff di Myers, e produce uno script di modifica minimo, il numero minimo di aggiunte ed eliminazioni che spiega la differenza.

## Due livelli: righe e parole

La stessa operazione LCS viene eseguita a due livelli di granularità. Per la vista principale i token sono righe intere, e questo dà il consueto elenco di righe aggiunte e rimosse. Per una riga che è cambiata, invece di essere aggiunta o rimossa del tutto, lo strumento esegue di nuovo il diff usando come token le parole, gli spazi e la punteggiatura, ed evidenzia solo le parti della riga che differiscono davvero. Questa evidenziazione nella riga è ciò che trasforma «questa riga è cambiata» in «questa parola è cambiata».

## Determinismo

Quando due script di modifica diversi sono ugualmente brevi, un diff deve sceglierne uno, e lo strumento sceglie sempre allo stesso modo (preferisce un’eliminazione quando le due direzioni si equivalgono). Questo criterio fisso di spareggio rende l’output deterministico: gli stessi due input producono sempre lo stesso diff, senza dipendere dai tempi di esecuzione o da qualcosa di esterno.

## Come si usa

Incolla il testo originale da una parte e quello modificato dall’altra, e leggi le differenze riga per riga con le parole evidenziate nella riga. Attiva le opzioni per ignorare gli spazi bianchi o le maiuscole e minuscole quando ti interessa il contenuto e non la formattazione.

## Condivisione dei risultati

Sotto l’intestazione del risultato (o sotto «nessuna differenza», che è anch’essa una lettura), **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` entrambi i testi così come li hai incollati, Originale e Modificato, e le due opzioni. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. I testi confrontati possono essere privati, quindi il riquadro a comparsa ti chiede di rileggerli entrambi prima di inviare il link. I testi partono così come li hai incollati: un valore sostituito in entrambe le caselle potrebbe nascondere proprio la modifica che stai mostrando. Prima che venga offerto un link, nel testo viene cercata una credenziale definita da uno standard: una chiave privata PEM, una riga `Authorization` o `Proxy-Authorization` con qualsiasi schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezioni 11.6.2 e 11.7.2: il valore è costituito da credenziali, «consists of credentials»), una riga `Cookie` o `Set-Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezioni 4.1.1 e 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1: la forma «user:password» è deprecata, «is deprecated»), un ID della chiave di accesso AWS o un valore `ENC` di FortiOS; tutte consultate il 01/11/2026. Una sola di queste significa niente link: il riquadro a comparsa indica la casella e la riga, e tu la sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto (`db_password = ...`, un `token=` in un URL) non blocca il link; il riquadro a comparsa indica il primo, così puoi controllarlo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Entrambe le caselle ed entrambe le opzioni vengono impostate come le imposteresti tu, e la pagina esegue il confronto. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
