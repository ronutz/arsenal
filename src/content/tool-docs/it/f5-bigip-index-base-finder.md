## Cosa fa

Su un BIG-IP, la domanda «si parte da 0 o da 1?» non ha un’unica risposta. Tcl, il linguaggio sotto le iRules, conta ogni posizione da 0. Diversi comandi aggiunti da F5 contano da 1. I contatori restituiscono 1 per il primo elemento. Molti zeri nella configurazione sono valori e non posizioni. Lo strumento raccoglie 76 di questi punti, ognuno con la sua fonte, così puoi verificare quello su cui stai per fare affidamento.

Ha due modalità:

- **Consulta** elenca i punti, raggruppati per parte del sistema: Tcl nelle iRules, i comandi che F5 aggiunge alle iRules, gli oggetti di configurazione, piattaforma e hardware, le API, e logging e cattura dei pacchetti. Cerca per comando o termine, oppure filtra in base a dove inizia il conteggio.
- **Traduci una posizione** prende una posizione contata come la contano le persone, in cui 1 è la prima, la trasforma nel numero che serve a ciascun comando, esegue ogni comando nel motore didattico Tcl 8.4.6 del sito e mostra accanto la versione sbagliata di uno.

## Come leggere una voce

- **Il badge** indica come conta quel punto: `0` parte da 0, `1` parte da 1, `←` conta da destra (`end`, `end-1`, gli ultimi N), `0·1` significa che le due basi si incontrano nello stesso punto, `=0` significa che 0 è un valore con un significato (predefinito, nessun limite, tutti, successo, uguale), e `n` indica un conteggio facile da scambiare per una posizione.
- **Conta**, **Primo**, **Ultimo** e **Se non c’è nulla** indicano cosa viene contato, come raggiungere il primo e l’ultimo elemento e cosa viene restituito quando non c’è nulla (-1, 0 o una stringa vuota).
- **Esempio** mostra il codice e ciò che restituisce. Ogni esempio Tcl è stato eseguito in un vero tclsh 8.4.6.
- **Attenzione** è la trappola per cui quella voce è nota.
- **Le pagine di F5 non concordano** compare quando due affermazioni di F5 non possono essere vere entrambe.
- **Grado di certezza** distingue quattro livelli: affermato dal manuale di Tcl ed eseguito in tclsh 8.4.6; affermato dalla fonte; mostrato solo da un esempio nella pagina della fonte; e due affermazioni di F5 in disaccordo.
- **Fonti** elenca ogni pagina su cui si basa la voce, con la data in cui è stata consultata.

## Regole pratiche

1. In Tcl le posizioni si contano da 0, e `end` è l’ultimo indice, cioè la lunghezza meno uno.
2. I numeri di campo di F5 contano da 1: i campi di `getfield`, le profondità di `URI::path`, gli indici dei segmenti di percorso delle policy LTM, il vecchio `matchclass`.
3. I contatori restituiscono 1 per il primo elemento: `HTTP::request_num`, `table incr`.
4. Molti zeri sono valori, non posizioni: route domain 0, porta 0, `connection-limit 0`, `SSL::verify_result` 0 e lo `0.0` di tcpdump.
5. Quasi ovunque viene prima il valore più basso (priorità degli eventi, ordinali delle policy, ordine di BIG-IP DNS, gravità syslog), tranne nei gruppi di priorità dei pool, dove vince il più alto.
6. In un `if`, 0 è falso e ogni altro numero è vero, -1 compreso: confronta un indice con `>= 0` invece di testarlo direttamente, e memorizza i tuoi flag come 0 o 1, come chiede la iRules Style Guide di DevCentral.

## Il traduttore

Scegli una domanda, indica un valore e N (1 è il primo):

- **L’N-esimo carattere**: `string index` e `string range` con N-1, e il `substr` di F5, accanto a `string index` con N.
- **L’N-esimo campo dopo una divisione**: il `getfield` di F5 con N, e `split` seguito da `lindex` con N-1, accanto a entrambi contati nel modo sbagliato.
- **L’N-esimo segmento di un percorso**: gli stessi due comandi, tenendo conto del pezzo vuoto prima di una barra iniziale, accanto alla versione che lo dimentica.
- **Le ultime N etichette di un nome host**: il `domain` di F5, e `split`, `lrange` dalla fine e `join`, accanto alla versione che prende un’etichetta di troppo.
- **L’N-esimo elemento di una lista Tcl**: `lindex` con N-1, accanto a `lindex` con N.
- **Dove compare per la prima volta un testo**: `string first` e il test `>= 0`, accanto a un `if` sull’indice stesso.

Ogni riga è contrassegnata come **La sua numerazione** (il numero giusto per quel comando), **Sbagliato di uno** o **Una risposta correlata**. La risposta in alto è ciò che ha restituito la prima riga giusta, e compare una nota quando le righe giuste non concordano tra loro. Le note spiegano i casi che cambiano i numeri: un valore che comincia con il separatore, un percorso con una query string (`HTTP::uri` la include, `HTTP::path` no), un separatore di più di un carattere (`split` tratta ogni carattere come un separatore, `getfield` usa l’intera stringa), e una corrispondenza all’indice 0 o un esito negativo a -1.

## Dove le pagine di F5 non concordano

Una lettura attenta delle fonti ha fatto emergere punti in cui due affermazioni di F5 non possono essere vere entrambe. Nessuno è stato provato su un BIG-IP per questo strumento, quindi tratta ciascuno come una domanda da verificare sulla tua versione: il conteggio 0 di `substr`, i commenti dell’esempio di `URI::path`, il valore di `matchclass` quando non c’è corrispondenza, l’intervallo nella pagina di `priority`, il nome della variabile nell’esempio di `DNSMSG::record`, la descrizione di un ordinale di policy in iControl REST, l’ordine delle liste di controllo degli accessi (ACL) di APM, e la priorità che `LB::server` riporta per un membro che non ne ha una configurata. Ogni conflitto compare nella sua voce, con entrambe le fonti.

## Condivisione dei risultati

Sotto la prima risposta di ciascuna modalità (il numero di corrispondenze in Consulta, la risposta in Traduci), **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` i campi di quella modalità come valori con nome: in Consulta, `search`, `base` e `area` quando sono impostati (senza parole e senza filtri non c’è nulla da condividere, e il pulsante è disattivato); in Traduci, `mode=translate`, `question`, `value`, e `n`, `sep` o `needle` secondo ciò che usa la domanda. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi i valori non vengono inviati al server quando si apre il link; ciascuno resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerli.

- **Lunghezza massima.** I campi contengono al massimo 2000 caratteri (il valore), molto al di sotto dei 16.384 che il sito consente dopo il `#`.
- **Apertura di un link.** La modalità si apre, i suoi campi vengono impostati e la pagina esegue il calcolo come quando digiti; il motore didattico Tcl 8.4.6 gira nella pagina, e nulla viene scaricato. Un campo dell’altra modalità, una base, un’area o una domanda sconosciute, un valore oltre il limite del suo campo o un N fuori dall’intervallo da 1 a 1000 fanno ignorare l’intero link. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Limiti

- Il traduttore accetta un valore fino a 2000 caratteri, un N da 1 a 1000, un separatore fino a 20 caratteri e un testo da cercare fino a 200 caratteri, e ogni comando si ferma dopo 200 passi.
- I comandi F5 del traduttore si comportano come li descrivono le pagine di F5. Dove una pagina tace, la riga lo dice: la pagina di `getfield` di F5 non ha esempi in cui la stringa comincia con il separatore, quindi la lettura di quel caso da parte dello strumento è indicata come un’ipotesi.
- Le voci su piattaforma, configurazione e API vengono dalla documentazione di F5 e non sono state provate su hardware per questo strumento.
- Tutto viene eseguito nel tuo browser. Nulla viene inviato da nessuna parte, e nulla viene eseguito su un BIG-IP.

## Fonti

Lo strumento elenca ogni fonte con la data in cui è stata consultata, 109 in tutto. Le principali:

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consultato il 03/10/2026)
- [F5 K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (consultato il 03/10/2026)
- [Manuale di Tcl 8.4: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (consultato il 03/10/2026)
- [Manuale di Tcl 8.4: lindex](https://www.tcl-lang.org/man/tcl8.4/TclCmd/lindex.htm) (consultato il 03/10/2026)
- [Manuale di Tcl 8.4: split](https://www.tcl-lang.org/man/tcl8.4/TclCmd/split.htm) (consultato il 03/10/2026)
- [Manuale di Tcl 8.4: if](https://www.tcl-lang.org/man/tcl8.4/TclCmd/if.htm) (consultato il 03/10/2026)
- [Riferimento iRules di F5: getfield](https://clouddocs.f5.com/api/irules/getfield.html) (consultato il 03/10/2026)
- [Riferimento iRules di F5: substr](https://clouddocs.f5.com/api/irules/substr.html) (consultato il 03/10/2026)
- [Riferimento iRules di F5: domain](https://clouddocs.f5.com/api/irules/domain.html) (consultato il 03/10/2026)
- [Riferimento iRules di F5: URI::path](https://clouddocs.f5.com/api/irules/URI__path.html) (consultato il 03/10/2026)
- [Riferimento iRules di F5: priority](https://clouddocs.f5.com/api/irules/priority.html) (consultato il 03/10/2026)
- [Riferimento tmsh di F5: ltm policy](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_policy.html) (consultato il 03/10/2026)
- [Riferimento tmsh di F5: ltm pool](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_pool.html) (consultato il 03/10/2026)
- [F5 K411: Overview of packet tracing with the tcpdump utility](https://my.f5.com/manage/s/article/K411) (consultato il 03/10/2026)
- [F5 DevCentral: iRules Style Guide](https://community.f5.com/t/irules-style-guide/71151) (consultata il 03/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link Condividi i risultati
