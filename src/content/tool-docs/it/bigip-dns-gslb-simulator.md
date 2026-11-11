## Cosa fa

Modella il bilanciamento globale del carico tra server (GSLB, global server load balancing) di BIG-IP DNS (in passato GTM), che lavora su due livelli: prima un wide IP sceglie un pool, poi il pool sceglie un virtual server. Configura i pool (ognuno con un ratio, un’etichetta di regione, uno stato attivo o inattivo e un metodo di selezione dei membri) e i loro membri, poi imposta il metodo dei pool del wide IP, una regione del client e un numero di richieste N. Lo strumento calcola come si risolvono le N richieste di risoluzione dei nomi DNS successive: prima la distribuzione per pool, poi la distribuzione per membro all’interno di ogni pool.

## Cosa simula e cosa no

Metodi deterministici su entrambi i livelli: Round Robin (circolare e uniforme), Ratio (ponderato, con il metodo del resto più grande), Global Availability (tutte le richieste alla prima risorsa disponibile nell’ordine dell’elenco, le altre come riserva) e Topology (vince la risorsa la cui regione corrisponde a quella del client, con il punteggio più alto; in caso di parità nel punteggio vincente si procede in round robin). Un pool o un membro inattivo non riceve nulla e il traffico si ridistribuisce tra quelli attivi.

I metodi dinamici (Quality of Service, Completion Rate, Round Trip Time, Fewest Hops, Kilobytes/Second, Packet Rate, Virtual Server Score, Least Connections, CPU) dipendono da metriche di prestazione in tempo reale che gli agenti big3d raccolgono in ogni data center. Non si possono riprodurre offline, quindi lo strumento lo dice chiaramente invece di inventare una distribuzione. È la stessa regola di onestà che il simulatore LTM segue per i suoi metodi dinamici.

## Perché contano i due livelli

L’equivoco più comune sul GSLB è trattare la selezione del pool e quella del membro come un’unica decisione. Sono separate, e ognuna può usare un metodo diverso: un wide IP può scegliere i pool con Topology (inviare i client europei al pool UE) mentre ogni pool sceglie un virtual server con Ratio (dare più peso al sito più grande). Lo strumento rende visibile questa separazione (vedi quale pool ha risposto, poi quale virtual server al suo interno è stato restituito), così l’interazione tra i due livelli diventa concreta invece che astratta.

## Condivisione dei risultati

Sotto il livello dei pool (o sotto la spiegazione, per un metodo dinamico del wide IP), **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` l’intero modulo sotto forma di valori con nome: `method`, `region` (omesso se vuoto), `requests`, `pools` (una riga per pool: nome, ratio, regione, stato e metodo dei membri, separati da tabulazioni) e `members` (una riga per membro: numero del suo pool, nome, ratio, regione e stato). Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Nomi e regioni vengono inviati così come li hai inseriti, salvo che una tabulazione incollata in uno di essi diventa uno spazio.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi i valori non vengono inviati al server quando si apre il link; restano nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerli.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** L’intero modulo viene sostituito dai valori del link, compresi i campi che il link non contiene, e la pagina li simula; nulla viene inviato altrove. Un valore che il modulo non accetterebbe (un metodo sconosciuto, un ratio inferiore a 1, una riga a cui manca un campo) rende il link non valido, e viene ignorato per intero. I valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
