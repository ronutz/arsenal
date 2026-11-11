## Cosa fa

Indica un istante della riunione, con Z o con un offset esplicito, perché un orario di riunione senza offset è ambiguo, e un elenco di fusi orari IANA, uno per riga. Lo strumento legge quell’unico istante in ogni fuso: data e ora locali, giorno della settimana, l’offset da UTC che tzdata riporta per quella data, il cambio di data rispetto al primo fuso e un’indicazione dell’orario lavorativo. I dati sui fusi orari sono il database IANA del tuo browser, lo stesso che il sistema operativo tiene aggiornato.

## Le indicazioni, dichiarate

L’orario lavorativo viene segnalato dalle 09:00 alle 17:59 locali, dal lunedì al venerdì: la fascia convenzionale, dichiarata invece che nascosta. Una colonna del cambio di data mette in evidenza i partecipanti che si trovano in un’altra data di calendario, la classica sorpresa del collega di Tokyo che si collega già nel giorno dopo, da dire chiaramente nell’invito.

## Perché la data conta

L’ora legale è ciò che le regole del fuso stabiliscono per quella data specifica: Berlino è UTC+2 a luglio e UTC+1 a gennaio; San Paolo è UTC-3 tutto l’anno da quando, nel 2019, il Brasile ha abolito l’ora legale. Pianificare con una data reale è il senso di tutto.

Sotto l’istante, un selettore di data e ora lo imposta senza doverlo digitare: una scelta mantiene i secondi e l’offset del campo, e scrive Z (UTC) quando non ne aveva. Sotto i fusi orari, un elenco di tutti i fusi IANA che il browser conosce aggiunge quello scelto come nuova riga.

## Condivisione dei risultati

Sotto la tabella, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` l’istante della riunione e i fusi orari, uno per riga, così come li hai inseriti, una volta che la pagina ha una pianificazione. Le letture locali vengono calcolate con i dati sui fusi orari del browser che apre il link, cioè quelli che la pagina usa sempre. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** L’istante e i fusi orari vengono compilati come se li digitassi, e la pagina esegue la pianificazione. Devono esserci entrambi, altrimenti il link viene ignorato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
