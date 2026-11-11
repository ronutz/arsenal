## Cosa fa

Incolla un blocco ltm pool e lo strumento spiega il suo metodo di bilanciamento del carico con i termini di F5 stessa: cosa valuta il metodo, come si comporta, quando il vendor consiglia di sceglierlo e i punti critici a cui fare attenzione. Poi confronta il metodo con il resto del pool e segnala le combinazioni che si comportano male senza dare nell’occhio, come pesi ratio sotto una modalità che li ignora o una modalità pesata a cui mancano i limiti di connessioni di cui ha bisogno. Puoi anche inserire il nome di un singolo metodo per la sua spiegazione completa, la parola «methods» per l’intero catalogo, oppure rispondere a due domande nel riquadro di scelta per ottenere una raccomandazione con le fonti. Tutto viene eseguito nel tuo browser e non contatta alcun dispositivo.

## Statici e dinamici, a livello di membro e di nodo

Le 19 modalità documentate si dividono lungo due assi. Le modalità statiche, Round Robin e Ratio, decidono solo in base alla configurazione e non si accorgono mai dello stato reale dei server. Le modalità dinamiche reagiscono a qualcosa di misurato: connessioni aperte, sessioni, velocità di risposta o metriche dei server alimentate dai monitor. Il secondo asse è il suffisso dell’ambito. Una modalità a livello di membro conta il lavoro di un server solo all’interno di questo pool; una modalità a livello di nodo lo conta su tutti i pool a cui il server appartiene, ed è il conteggio corretto quando le stesse macchine servono più pool.

## Cosa valuta ogni famiglia

Round Robin non valuta nient’altro che a chi tocca, ed è il metodo predefinito. Ratio segue una proporzione che dichiari tu. Least Connections sceglie chi ha meno connessioni aperte in quel preciso istante, il che assorbe le differenze di durata delle connessioni. Observed smussa quel conteggio istantaneo in un rapporto al secondo, e Predictive vi aggiunge la tendenza, preferendo i membri che stanno migliorando. Weighted Least Connections legge il connection-limit di ogni membro come la sua capacità e bilancia in base alla percentuale utilizzata. Ratio Least Connections combina il ratio che hai dichiarato con il conteggio in tempo reale. Dynamic Ratio ti toglie del tutto di mano la proporzione e continua a ricalcolarla dalle misurazioni dei server. Least Sessions e Ratio (session) contano le sessioni di persistenza invece delle connessioni, e Fastest segue la velocità di risposta, misurata come richieste di livello 7 in sospeso.

## Le verifiche incrociate

Le osservazioni sono letture deterministiche della configurazione incollata rispetto alle regole documentate. I ratio dei membri sotto una modalità non ratio vengono segnalati perché, secondo K6406, i ratio si applicano solo con un metodo ratio. Weighted Least Connections (member) con un membro lasciato al connection-limit predefinito di 0 viene segnalato perché il riferimento richiede un limite su ogni membro. Un pool least-connections riceve la nota sullo slow ramp, perché il riferimento cita espressamente questo abbinamento e il ramp predefinito è di 10 secondi. Least Sessions mette in evidenza il suo prerequisito sul virtual server, un profilo di persistenza che tenga traccia delle sessioni. ignore-persisted-weight viene spiegato quando si applica e segnalato quando la modalità è fuori dal suo ambito documentato. I priority group vengono letti insieme a min-active-members, l’impostazione che rende davvero operativa l’attivazione basata sulla priorità.

## La scelta guidata

Due domande guidano una tabella decisionale fissa: quanto differiscono le capacità dei membri (uguali, dichiarate come ratio, quantificate come limiti di connessioni o misurate per te) e a che cosa deve reagire il metodo (a niente, alle connessioni in tempo reale, alla tendenza, alle sessioni o alla velocità di risposta). Stesse risposte, stessa raccomandazione, sempre, con il ragionamento e i prerequisiti esplicitati. La tabella codifica le indicazioni del vendor stesso tratte da K42275060, non opinioni.

## Condivisione dei risultati

La pagina ha due punti di ingresso, quindi **Condividi i risultati** ha due pulsanti, ognuno dei quali crea un link a questa pagina, solo quando lo premi, che contiene una parte dopo il `#`. Ogni riquadro a comparsa indica prima cosa contiene il suo link, poi offre Copia link e, se il browser lo prevede, il suo menu di condivisione; l’indirizzo della pagina non cambia.

- **In cima alla risposta della casella**: il testo della casella così come l’hai inserito (`#input=`), cioè un pool, il nome di un metodo, `methods` o una riga `choose`. I nomi del pool e dei membri possono identificare i tuoi server, quindi il riquadro a comparsa aggiunge una riga di avvertenza prima che tu copi qualsiasi cosa. Un pool non contiene impostazioni segrete ([riferimento tmsh di F5, ltm pool](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_pool.html), consultato il 27/10/2026).
- **Sotto la raccomandazione di Aiutami a scegliere**: le tue due risposte con i loro ID, `capacity` (`equal`, `ratio`, `connlimit`, `measured`) e `react` (`none`, `connections`, `trend`, `sessions`, `response`), solo quando sono state scelte entrambe.

Secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) il frammento è separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che il link contiene non viene inviato al server quando il link viene aperto; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non riceve alcun link, e il riquadro a comparsa indica quanto è lunga.
- **Apertura di un link.** Ciò che il link contiene viene compilato: la casella come farebbe un incolla, i due menu come se li avessi scelti tu; ciò che non contiene mantiene il suo valore. Una risposta che i menu non offrono, o una risposta senza l’altra, fa ignorare l’intero link. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina non contengono nulla.

## Fonti

I 19 token, le loro descrizioni e le opzioni del pool vengono dal riferimento tmsh di ltm pool. Le indicazioni su quando usare ogni metodo e il prerequisito di least-sessions vengono da K42275060. I meccanismi delle modalità dinamiche, l’esclusione di OneConnect e la regola per cui i ratio richiedono un metodo ratio vengono da K6406.

- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
