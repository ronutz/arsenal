## Cosa fa

Il vero CPython 3.14 viene eseguito nel tuo browser. Il motore è Pyodide 314.0.7, la build di CPython per WebAssembly del progetto Pyodide, servita da questa stessa origine e vincolata per versione e per digest SHA-256. Scrivi un programma, gli fornisci se vuoi uno standard input, premi Esegui e leggi stdout, stderr e il valore dell’ultima espressione, come lo mostrerebbe un REPL. Nulla di ciò che inserisci lascia la pagina: l’interprete vive in un Web Worker sul tuo dispositivo, non ha né rete né processi, e la policy della pagina stessa li rifiuterebbe comunque.

È il primo strumento di questo sito che esegue codice non scritto dal sito stesso. Ne derivano tre conseguenze, e la pagina le dichiara apertamente invece di nasconderle:

- **C’è un download, una sola volta, quando lo decidi tu.** Il motore pesa circa 13,5 MB in cinque file. La pagina si apre con l’editor e un esempio, ma senza il motore; un pulsante, che ne indica la dimensione, avvia il download con una barra di avanzamento. Il browser conserva i file nella cache (sono versionati e contrassegnati come immutabili), quindi una seconda visita non costa nulla.
- **Viene eseguito un motore di terze parti.** I controlli del sito coprono l’infrastruttura attorno al motore: il controllo preliminare, i limiti, gli esempi (rieseguiti con il motore reale a ogni build) e i digest dei file vincolati. Il comportamento dell’interprete è quello del progetto Pyodide.
- **È disponibile la libreria standard, e solo quella.** La distribuzione Pyodide offre 357 pacchetti (numpy, pandas, requests e gli altri); in questa versione non ne viene caricato nessuno. Quaranta moduli della libreria standard mancano nella build WebAssembly (tra gli altri tkinter, curses, pwd, grp, readline) e il controllo preliminare li indica se ne importi uno.

## Il controllo preliminare

Prima che qualsiasi cosa venga inviata al motore, il testo del programma viene letto (mai eseguito) e ti viene detto cosa qui non funzionerà e perché, con i termini del motore stesso:

- l’import di un modulo della libreria standard che manca in questa build, con l’errore sollevato dal motore;
- l’import di un pacchetto che la distribuzione Pyodide offre ma che questa versione non carica, indicato con il nome del pacchetto (PIL è Pillow, yaml è pyyaml);
- l’import di qualcosa che qui nessuno può installare, o un import relativo, che non ha alcun pacchetto rispetto a cui essere relativo;
- i moduli di rete (socket, urllib, http, requests…) e i moduli per i processi (subprocess, multiprocessing, os.system), che Emscripten rifiuta;
- zoneinfo, che qui non trova alcun database dei fusi orari e solleva ZoneInfoNotFoundError;
- input() con la casella stdin vuota, che solleva EOFError alla prima lettura;
- un time.sleep più lungo del limite di tempo reale, un while True senza fine, i moduli il cui output cambia da un’esecuzione all’altra (random, time, uuid, datetime.now);
- i file, che vivono nella memoria del motore e spariscono con l’esecuzione; un programma che non stampa nulla (al suo posto viene mostrato il valore dell’ultima espressione); tabulazioni e spazi mescolati nell’indentazione.

Le voci segnalate come errori bloccano l’esecuzione; le altre sono note.

## Limiti

- Programma: 20.000 caratteri. Standard input: 20.000 caratteri.
- Tempo reale: 30 secondi per esecuzione. Al limite il Worker viene terminato e ne viene avviato uno nuovo dai file in cache.
- Output: 200.000 caratteri per flusso, oltre i quali viene troncato e contrassegnato.
- Interrompi termina subito il Worker (l’unico modo per interrompere Python sincrono senza un buffer di interruzione con isolamento cross-origin, che questo sito statico non ha) e ne avvia uno nuovo.
- Ogni esecuzione parte in un namespace globale nuovo con `__name__` impostato a `"__main__"`, quindi le esecuzioni non si trasmettono variabili l’una con l’altra e l’idioma del main guard funziona.

## Standard input

La casella stdin alimenta `input()` e `sys.stdin`, una riga per lettura, poi la fine del file. Un a capo finale non aggiunge una riga vuota. `for line in sys.stdin:` la legge tutta.

## Gli esempi

Tredici programmi scritti per le persone a cui si rivolge questo sito: la divisione di una /24 in /26, l’aggregazione di prefissi, subnet mask e wildcard in binario, un EUI-64 modificato a partire da un MAC, un’intestazione DNS costruita con struct, HMAC-SHA256 in esadecimale e in base64url, statistiche di latenza con p95, jitter e due deviazioni standard, tempi di trasferimento a tre velocità di linea, un conteggio dei syslog per gravità da un testo di log incollato, righe lette dalla casella stdin, campi estratti dalla risposta di un’API, lo shortest path first di Dijkstra su sei router e l’ultima espressione da sola. Il loro output esatto è registrato come vettori di test di riferimento (golden vectors) e rimisurato con il motore reale sotto Node a ogni build; un aggiornamento del motore che ne cambia anche uno solo fa fallire la build e viene esaminato di proposito.

L’esempio sulla latenza stampa entrambe le deviazioni standard e le etichetta. `statistics.pstdev` restituisce la deviazione standard della popolazione («the population standard deviation»), che è ciò che ping stampa come mdev: la pagina di manuale ping(8) dice «Population standard deviation (mdev)», e iputils la calcola dividendo la somma degli scarti al quadrato per il numero di risposte. `statistics.stdev` restituisce la deviazione standard campionaria («the sample standard deviation»), che per gli stessi campioni è più grande (8,34 contro 7,99 ms nell’esempio). Confronta con il riepilogo `rtt min/avg/max/mdev` di ping la riga di pstdev, non quella di stdev.

L’esempio SPF esegue lo shortest path first (SPF) di Dijkstra a partire dal router R1 sui sei router e sugli otto link dell’[articolo su Dijkstra](/learn/dijkstra-and-the-twenty-minute-algorithm), con un elenco dei candidati gestito con `heapq`, e stampa ogni passo nell’ordine descritto dalla RFC 2328, sezione 16.1: i percorsi verso il vertice candidato più vicino alla radice sono sicuramente i più brevi («the paths to the candidate vertex that is closest to the root are guaranteed to be shortest»), quindi quel router entra nell’albero e i suoi link vengono esaminati; un percorso più breve sostituisce il costo e i next hop di un candidato, un percorso di pari costo aggiunge i suoi next hop a quelli elencati, e l’esecuzione termina quando l’elenco dei candidati è vuoto. Si conclude con il costo, i next hop e i padri di ogni router e con l’ordine in cui i costi sono diventati definitivi (R1 R3 R2 R4 R5 R6), che è l’idea di Dijkstra del 1959, costruire i percorsi minimi in ordine di lunghezza crescente, nelle sue stesse parole: «the minimal paths from P to the other nodes are constructed in order of increasing length». I candidati di pari costo escono dall’heap in ordine di nome del router, una regola che il programma dichiara in un commento, quindi l’output è lo stesso a ogni esecuzione. Cambia un costo (ad esempio quello da R2 a R4, da 1 a 20) ed eseguilo di nuovo per vedere i next hop spostarsi; l’[introduzione a OSPF](/learn/ospf-primer) tratta OSPF (Open Shortest Path First), il protocollo che esegue questo calcolo.

## Cosa non fa l’API

Questo strumento non è esposto nell’API HTTP. Eseguire Python arbitrario su un’infrastruttura condivisa sarebbe esecuzione di codice da remoto; il motore viene eseguito solo nel tuo browser. Il controllo preliminare è un aiuto didattico attorno all’editor, non un contratto stabile.

## Condivisione dei risultati

Sotto la barra di esecuzione, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il programma e lo standard input così come li hai inseriti, mai l’output: chi apre il link esegue il programma da sé, se lo vuole. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Un programma può contenere chiavi, token e nomi interni, quindi il riquadro a comparsa ti chiede di rileggerlo prima di inviare il link. Prima che venga offerto un link, nel testo viene cercata una credenziale definita da uno standard: una chiave privata PEM, una riga `Authorization` o `Proxy-Authorization` con qualsiasi schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezioni 11.6.2 e 11.7.2: il valore è costituito da credenziali, «consists of credentials»), una riga `Cookie` o `Set-Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezioni 4.1.1 e 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1: la forma «user:password» è deprecata, «is deprecated»), un ID della chiave di accesso AWS o un valore `ENC` di FortiOS; tutte consultate il 01/11/2026. Una sola di queste significa niente link: il riquadro a comparsa indica la casella e la riga, e tu la sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto (`api_key = "..."`, un’assegnazione che il controllo legge nella forma propria di Python) non blocca il link; il riquadro a comparsa indica il primo, così puoi controllarlo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Le due caselle vengono compilate, l’eventuale output precedente viene cancellato e la pagina indica che il programma arriva da un link. Non succede nient’altro: il motore (circa 13,5 MB) non viene scaricato e, se è già caricato, il programma non viene eseguito finché non premi **Esegui**. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

La documentazione di Pyodide (le pagine sui web worker e sugli stream standard, versione 314.0.7), i file package.json e pyodide-lock.json e le definizioni dei tipi del pacchetto stesso nel registro npm, la documentazione di CPython 3.14 per i moduli usati dagli esempi, la RFC 1035 (sezione 4.1.1), la RFC 4291 (appendice A) e la RFC 5424 (sezione 6.2.1) per l’aritmetica degli esempi, e MDN per il Worker di tipo module e per l’elenco delle sorgenti della Content Security Policy, consultati il 4 ottobre 2026. La pagina statistics di Python 3.14 (pstdev e stdev), la pagina di manuale ping(8) su man7.org e il sorgente di iputils della riga di riepilogo di ping (ping/ping_output.c) sono stati consultati il 19 ottobre 2026, come la RFC 2328 (sezioni 16.1 e 16.1.1, rfc-editor.org) e la nota di Dijkstra del 1959, A Note on Two Problems in Connexion with Graphs, Numerische Mathematik 1, pagine da 269 a 271 (la scansione nel repository del CWI citata dall’articolo su Dijkstra), per l’esempio SPF. Sono tutti elencati nella pagina dello strumento.
