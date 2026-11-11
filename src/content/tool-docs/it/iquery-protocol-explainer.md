## Cosa fa

Incolla l’output del comando F5 `iqdump`, righe di `/var/log/gtm` o il nome di un argomento, e lo strumento spiega il protocollo iQuery di F5 senza toccare un dispositivo. iQuery è il protocollo proprietario basato su XML che BIG-IP DNS (in precedenza GTM) usa per comunicare con l’agente `big3d` su sé stesso e su ogni altro BIG-IP di cui è a conoscenza. Lo strumento decodifica ciò che incolli e spiega l’architettura che c’è dietro. È uno strumento di decodifica e spiegazione che viene eseguito interamente nel tuo browser, basato sulla documentazione stessa di F5 per BIG-IP DNS/GTM.

## Decodifica dell’output di iqdump

`iqdump` trasmette in tempo reale i dati iQuery tra due sistemi, così puoi verificare il percorso e l’autenticazione SSL. Incolla il suo output e lo strumento rilegge le righe di commento dell’intestazione, il nome host locale da cui l’hai eseguito, il peer `big3d` a cui si è connesso e la porta (4353), il gruppo di sincronizzazione a cui si è iscritto e il timestamp, poi i campi del blocco `<xml_connection>`, come `version`, la stringa di build di `big3d` e `connection_id`. Ogni campo viene spiegato, e la presenza di una riga del peer `big3d` viene evidenziata come prova che il percorso TCP e la fiducia SSL verso quell’agente funzionano, perché con un percorso interrotto `iqdump` riporterebbe invece un errore.

## Decodifica delle righe di /var/log/gtm

Il processo `gtmd` registra lo stato di integrità della mesh iQuery in `/var/log/gtm`. Incolla quelle righe e lo strumento decodifica i messaggi di cambio di stato dei sistemi (box), ad esempio una transizione `green --> red`, che indica che un BIG-IP non è più disponibile tramite iQuery, insieme alle voci `SNMP_TRAP` e ai messaggi di connessione `big3d` stabilita o persa. Una transizione `green --> red` viene segnalata con le verifiche da fare subito dopo: il percorso iQuery (TCP 4353, fiducia SSL) verso quel sistema, e se il suo `big3d` è in esecuzione e ha una versione compatibile.

## Spiegazione dell’architettura

Inserisci un argomento o selezionalo e lo strumento lo spiega nei termini di F5: la mesh iQuery di connessioni di lunga durata, la porta TCP 4353, la fiducia basata sui certificati SSL che `bigip_add`, `big3d_install` e `gtm_add` avviano, il comando `iqdump` stesso, cosa trasporta iQuery, cioè la disponibilità degli oggetti più le metriche di bilanciamento del carico che servono al GSLB (global server load balancing) dinamico, gli agenti `gtmd` e `big3d`, e la regola delle VLAN per cui iQuery viene inviato solo sulla VLAN su cui un sistema lo riceve.

## Condivisione dei risultati

In cima alla lettura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il testo della casella così come l’hai inserito, e nient’altro. Il suo riquadro a comparsa indica prima cosa contiene il link, poi un’avvertenza specifica: l’output può nominare i tuoi sistemi BIG-IP, i self IP e le versioni, quindi rileggilo prima di inviare il link. Poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

L’indice degli argomenti non è un risultato: finché è visibile (con la casella vuota, con `list` o con un testo che lo strumento non riconosce) il pulsante è disattivato. Né l’output di `iqdump` né queste righe di log contengono credenziali: la fiducia di iQuery sono i certificati che i sistemi si scambiano.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il testo non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Il testo compila la casella come farebbe un incolla e la pagina lo legge; nulla viene inviato da nessuna parte. Il valore lascia poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Ambito e fondamenti

Lo strumento spiega e decodifica; non apre mai un socket, non esegue `iqdump` e non scarica nulla, e lo stesso input produce sempre lo stesso output. Legge la forma dell’output di `iqdump` e del testo dei log, senza convalidare un intero scambio iQuery. Ogni dato proviene dai manuali di F5 sui concetti e sulle implementazioni di BIG-IP DNS/GTM, dalla guida operativa LTM-DNS e dagli articoli K su fiducia e risoluzione dei problemi di iQuery; l’esempio è un campione reale di `iqdump` pubblicato da F5. Nota che il modulo Link Controller è stato rimosso in BIG-IP 21.0.0. Nulla di ciò che incolli lascia la pagina.
