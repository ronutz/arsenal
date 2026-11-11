## Cosa fa

Incolla la sezione F5 Ethernet Trailer così come la mostra Wireshark, oppure i byte grezzi del trailer in esadecimale, e lo strumento spiega ogni campo: direzione, slot e TMM, il virtual server, gli identificatori del flusso e del peer, e la causa di RST indicata dal dispositivo stesso. Locale e offline: analizza il testo che incolli e non contatta nulla.

## Perché vale la pena leggere il trailer

Esegui tcpdump **su** un BIG-IP con le opzioni di noise (`:n` basso, `:nn` medio, `:nnn` alto, con `-s0`) e ogni frame riporta il resoconto del dispositivo stesso su quel pacchetto. La **causa di RST** è il campo che giustifica l’esercizio: senza di essa una cattura mostra che una connessione è morta; con essa, il dispositivo ti dice che è stato lui a chiudere la connessione e perché.

## Di cosa ti avverte

**I flow ID sono univoci solo all’interno di una combinazione di slot e TMM, e vengono riutilizzati.** Lo stesso ID può comparire su pacchetti non correlati, prima o dopo, nella stessa cattura. Lo strumento lo ricorda a ogni decodifica, perché un flow ID considerato univoco a livello globale porta a una conclusione sbagliata, tratta con sicurezza.

Indica anche `f5ethtrailer.anyflowid`, che trova l’ID sia come flusso sia come peer e quindi restituisce **entrambi i lati** della connessione; filtrare solo su `flowid` restituisce metà di ciò che volevi.

## *** La sezione che si rifiuta di decodificare ***

Da **BIG-IP v15** il trailer può contenere una **sezione TLS provider con i segreti di sessione**. Wireshark li trasforma in voci di keylog e decifra la cattura.

**Lo strumento rileva quella sezione, ti dice che c’è e non ne decodifica nulla.** Un vettore di test di riferimento (golden vector) verifica che nessun segreto compaia mai in alcun punto dell’output.

Il motivo è ciò che vale la pena sapere: **una cattura fatta con noise alto su un dispositivo v15 o successivo può contenere le chiavi delle sue stesse sessioni TLS.** F5 documenta che il trailer non lascia mai il dispositivo in rete, il che è vero, e riguarda la rete. Il file è un’altra questione: allegarlo a un ticket o inviarlo a un collega significa inviare anche le chiavi.

## Cosa non fa

Non legge file pcap e non può vedere la tua cattura. Quando una causa di RST non è nella sua tabella lo dice, invece di inventarne una spiegazione.

## Condivisione dei risultati

Sotto la panoramica, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il testo del trailer così come l’hai incollato, ma mai ciò che questa pagina si rifiuta di decodificare. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser lo prevede, il suo menu di condivisione; l’indirizzo della pagina non cambia.

- **Segreti TLS: nessun link.** Quando la pagina trova una sezione TLS provider, o il testo riporta un segreto o una riga di keylog, il link non viene creato affatto, e il riquadro a comparsa spiega perché. L’elenco dei campi del trailer di Wireshark stesso ([riferimento dei filtri di visualizzazione f5ethtrailer](https://www.wireshark.org/docs/dfref/f/f5ethtrailer.html), consultato il 27/10/2026) include `f5ethtrailer.tls.master_secret`, i traffic secret del client e del server e `f5ethtrailer.tls.keylog`: le chiavi delle sessioni TLS della cattura stessa. Escluderli cambierebbe ciò che questa pagina dice del trailer, quindi al loro posto non viene inviato nulla.
- **Byte: solo l’intestazione.** I byte incollati vengono inclusi solo quando sono la sola intestazione del trailer (magic, lunghezza e versione, 8 byte nell’elenco dei campi di Wireshark). Qualsiasi altra cosa, prima o dopo, può essere costituita dai dati del pacchetto stesso o dalle sezioni provider del trailer, segreti TLS compresi, che questa pagina non legge mai: nessun link, e il riquadro a comparsa suggerisce invece di condividere la vista testuale di Wireshark.

Secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) il frammento è separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il testo non viene inviato al server quando il link viene aperto; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non riceve alcun link, e il riquadro a comparsa indica quanto è lunga.
- **Apertura di un link.** Il testo riempie la casella come farebbe un incolla e la pagina lo decodifica. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina non contengono nulla.
