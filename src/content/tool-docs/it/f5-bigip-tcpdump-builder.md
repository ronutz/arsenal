## Cosa fa

Componi un comando `tcpdump` corretto per F5 BIG-IP a partire da scelte strutturate: l’interfaccia (nella sintassi propria di BIG-IP), quanto dettaglio dei flussi TMM includere, la lunghezza di cattura, se scrivere un file di cattura e un filtro BPF. Lo strumento formatta il comando, che poi copi ed esegui sul dispositivo; non cattura nulla da solo e non contatta alcun dispositivo.

## Perché tcpdump su BIG-IP è diverso

Su un BIG-IP, `tcpdump` lavora sul TMM (Traffic Management Microkernel), ed è nell’argomento dell’interfaccia che si discosta dal tcpdump standard. Contano soprattutto due elementi specifici di BIG-IP:

- **L’interfaccia `0.0`** indica tutte le interfacce dati del TMM contemporaneamente. È molto utile per capire dove il traffico passa (o non passa), ma non ha limiti di frequenza, quindi un filtro è indispensabile per non sovraccaricare la cattura.
- **Il suffisso di dettaglio `:n`** stabilisce quante informazioni interne del TMM riporta ogni riga di pacchetto, ed è la parte che si sbaglia più spesso.

## Il suffisso di dettaglio, e l’errore da evitare

Aggiungere un suffisso all’interfaccia alza il livello di «noise»:

- **`:n`** (basso) aggiunge il nome del virtual server, l’interfaccia e la direzione.
- **`:nn`** (medio) aggiunge i dettagli del flusso.
- **`:nnn`** (alto) aggiunge IP e porta di entrambi i lati del BIG-IP, così puoi seguire una singola connessione attraverso il proxy.

Una **`p`** finale (come in `:nnnp`, o semplicemente `:p`) cattura entrambi i lati del proxy contemporaneamente: il flusso dal client al BIG-IP e quello dal BIG-IP al membro del pool. L’errore classico è confondere questo suffisso d’interfaccia `:n` con l’opzione `-n` della riga di comando, che fa tutt’altro (disattiva la risoluzione dei nomi). Sono due cose distinte, e lo strumento le tratta separatamente perché tu non le confonda.

## Come si usa

Scegli l’interfaccia e il livello di dettaglio, imposta se vuoi una lunghezza di cattura e un file di output, aggiungi un filtro BPF e copia il comando composto. Lo strumento si basa sulle opzioni indicate da F5 stessa per il tracciamento dei pacchetti (K411 e K13637), quindi è il comando che un BIG-IP accetta davvero.

## Condivisione dei risultati

Sotto il comando, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il modulo sotto forma di valori con nome: `iface`, `filter` e `file` così come li hai inseriti (il file solo quando la scrittura su file è attiva), e ogni scelta diversa da quella predefinita del modulo (`detail`, `both`, `names`, `snaplen` con `snapbytes`, `count`, `verbose`, `ether`, `hex`, `write`). Il pulsante resta disattivato finché il modulo conserva i valori predefiniti. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser lo prevede, il suo menu di condivisione; l’indirizzo della pagina non cambia.

Il modulo non contiene segreti (il generatore formatta un comando e non esegue nulla), ma l’interfaccia e il filtro possono indicare indirizzi e VLAN interni, quindi il riquadro a comparsa aggiunge, prima che tu copi qualsiasi cosa, un’avvertenza propria di questo strumento. Secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) il frammento è separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il modulo non viene inviato al server quando il link viene aperto; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non riceve alcun link, e il riquadro a comparsa indica quanto è lunga.
- **Apertura di un link.** I valori del link sostituiscono l’intero modulo: un campo di testo che il link non contiene viene svuotato, una scelta che non contiene assume il valore predefinito, e la pagina compone il comando. Nulla viene catturato, eseguito o inviato. Una scelta che il modulo non offre, un interruttore con un valore diverso da 1 o 0, o un numero fuori intervallo fa ignorare l’intero link. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina non contengono nulla.
