## Cosa fa

BIG-IP 21.1 ha ricostruito bigd, il daemon dei monitor di integrità, come un’unica istanza multithread in grado di servire fino a 15.000 monitor del control plane, e ha documentato esattamente come il numero automatico di thread si ricava dal numero di vCPU. Questo strumento codifica testualmente quelle due formule: inserisci un numero di vCPU più il tipo di sistema e restituisce il numero di thread che il sistema ricaverebbe, il limite dell’override manuale bigd.numprocs e il tetto di monitor. Un numero da solo calcola entrambe le formule affiancate.

## Le due formule

Per i sistemi con hyperthreading, le note di rilascio di F5 indicano `Number of BigD Threads = (Number of vCPUs × 6) ÷ 10`, con la motivazione che i core HT rendono circa il 60% delle prestazioni di un core reale. Per i sistemi normali (senza HT) la formula è `Number of BigD Threads = (Number of vCPUs ÷ 2) − 1`. Dove una formula dà una frazione (8 vCPU con hyperthreading danno 4,8), le note di rilascio non indicano alcuna regola di arrotondamento, quindi lo strumento mostra sia il valore esatto sia la sua parte intera in thread, e lo dice chiaramente. Con 2 vCPU il risultato onesto della formula normale è 0; bigd viene comunque eseguito, quindi leggi quel caso limite come threading minimo, non come assenza.

## L’override e il tetto

La variabile db `bigd.numprocs` imposta a mano il numero di thread, ma è limitata al numero di vCPU disponibili; il suo valore predefinito 0 significa calcolo automatico con le formule qui sopra. Il daemon multithread supporta fino a 15.000 monitor del control plane. Per il dimensionamento, le note della 21.0 di F5 raccomandano di tenere bigd entro le 5000 istanze di monitor e, oltre quella soglia, di passare ai monitor In-TMM, che arrivano a 25.000 con un’allocazione extramb di 8 GB.

## Quali piattaforme usano l’hyperthreading

La scelta della formula è un dato della piattaforma, e la documentazione delle piattaforme di F5 stessa lo stabilisce. Nella serie rSeries, la famiglia si divide a metà: le appliance di fascia media e alta (r5000, r10000 e la famiglia r12000 nelle tabelle di dimensionamento di F5) usano l’hyperthreading, con ogni core Intel che appare come due vCPU, mentre r2000 e r4000 usano una classe di CPU senza hyperthreading e si contano solo in core fisici. VELOS usa l’hyperthreading su entrambi i tipi di blade: le vCPU di un tenant sono hyperthread, due per core fisico, e i tenant BIG-IP usano la disposizione HT-Split (K15003) in cui TMM occupa un hyperthread di ciascun core. Anche iSeries e VIPRION contano le vCPU come hyperthread nel linguaggio di dimensionamento di F5, ma nessuna delle due esegue BIG-IP 21.x, quindi per loro lo strumento mostra la corrispondenza solo come contesto. Virtual Edition eredita ciò che l’hypervisor espone: verifica all’interno del guest (`lscpu`, Thread(s) per core) e scegli la formula corrispondente.

Inserisci la piattaforma direttamente nell’input: `8 r10900` seleziona la formula con hyperthreading, `16 r4800` quella normale, `22 velos` quella con hyperthreading, `8 ve` le mostra entrambe con la nota che invita a verificare l’host. Una parola esplicita `ht` o `normal` prevale sempre sul valore predefinito della piattaforma, per il caso in cui l’hyperthreading sia stato disattivato nel firmware.

## Esempi svolti

`8 ht` dà 4,8 esatti, 4 thread interi. `10 ht` arriva a un intero, 6. `16 normal` dà 7. `40 ht` dà 24. `6` da solo le mostra entrambe: 3,6 (parte intera 3) con hyperthreading, 2 normale.

## Condivisione dei risultati

Sotto le due formule, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la riga così come l’hai inserita: `/tools/f5-bigd-thread-calculator#input=8%20r10900`. Un numero di vCPU e una piattaforma non dicono nulla della tua rete. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la riga non viene inviata al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza massima.** Una riga di poche parole, molto al di sotto dei 16.384 caratteri che il sito consente dopo il `#`.
- **Apertura di un link.** La riga riempie il campo come se la digitassi e la pagina esegue il calcolo. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Provenienza

Le formule, il comportamento del limite e il tetto di 15.000 sono ripresi testualmente dalle note di rilascio «New Features in BIG-IP Version 21.1.0» di F5 (BigD enhancements for large-scale configurations), scaricate il 08/07/2026; l’indicazione delle 5000 istanze e i valori In-TMM vengono dalle note corrispondenti della 21.0.0. Il numero effettivo di thread del sistema in esecuzione fa sempre fede.
