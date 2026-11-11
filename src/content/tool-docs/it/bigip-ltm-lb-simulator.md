## Cosa fa

Lo strumento simula come un pool BIG-IP LTM distribuisce il traffico. Configuri i membri del pool (ognuno con un ratio del membro, un nodo e un ratio del nodo, un gruppo di priorità e un numero di record di persistenza esistenti), poi scegli un metodo di bilanciamento del carico e un numero di richieste N, e lo strumento mostra dove finiscono le prossime N connessioni, come distribuzione per membro. Viene eseguito interamente nel tuo browser ed è deterministico: gli stessi dati in ingresso producono sempre la stessa risposta.

## I metodi che simula

Simula i metodi statici e quelli basati sulle connessioni o sulle sessioni, perché il loro risultato dipende dalla configurazione e dal carico che fornisci. Round Robin invia ogni richiesta al membro successivo, a turno. Ratio (member) distribuisce in proporzione al ratio di ogni membro; Ratio (node) fa lo stesso per nodo, ripartendo la quota di un nodo tra i suoi membri. Least Connections (member e node) invia ogni nuova connessione al membro meno carico; Weighted Least Connections pondera questo criterio con il ratio. Least Sessions invia al membro con il minor numero di record di persistenza, che è esattamente il numero di record di persistenza che inserisci per ogni membro.

## Gruppi di priorità

L’attivazione dei gruppi di priorità decide quali membri sono idonei. Ogni membro ha una priorità; il traffico va prima al gruppo con la priorità più alta, e un gruppo inferiore viene attivato solo quando il numero di membri disponibili nell’insieme attivo scende sotto la soglia che imposti (0 disattiva la funzione). Lo strumento applica questa regola e contrassegna ogni membro come attivo o in standby, così puoi vedere un gruppo inferiore restare inutilizzato finché quello superiore non si assottiglia.

## Cosa non simula, e perché

Fastest, Observed, Predictive e Dynamic Ratio sono metodi dinamici che decidono in base a metriche raccolte in tempo reale durante il funzionamento: tempo di risposta, numero di connessioni al secondo, andamento delle prestazioni, dati SNMP. Questi valori non fanno parte della configurazione di un pool e cambiano di continuo, quindi non esiste un modo onesto di calcolare per loro una distribuzione fissa a partire da dati statici. Lo strumento li propone nell’elenco ma, quando li selezioni, spiega perché non può simularli invece di inventare numeri. Altre due note di onestà: Least Connections viene modellato partendo da una tabella delle connessioni vuota, perché lo strumento non chiede il numero di connessioni attuali, quindi all’inizio distribuisce in modo uniforme; e Least Sessions presuppone una persistenza basata sull’indirizzo di origine o sulla sessione, perché con la persistenza basata sui cookie BIG-IP ripiega su Round Robin.

## Condivisione dei risultati

Alla fine della risposta, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` l’intero modulo sotto forma di valori con nome: `members` (una riga per membro, con nome, nodo, ratio, ratio del nodo, gruppo di priorità e record di persistenza separati da tabulazioni), `method`, `threshold` (l’attivazione dei gruppi di priorità) e `requests`. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Nomi e nodi vengono inviati così come li hai inseriti, salvo che una tabulazione incollata in uno di essi diventa uno spazio.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi i valori non vengono inviati al server quando si apre il link; restano nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerli.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** L’intero modulo viene sostituito dai valori del link, compresi i campi che il link non contiene, e la pagina li simula; nulla viene inviato altrove. Un valore che il modulo non accetterebbe (un metodo sconosciuto, un ratio inferiore a 1, una riga a cui manca un campo) rende il link non valido, e viene ignorato per intero. I valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
