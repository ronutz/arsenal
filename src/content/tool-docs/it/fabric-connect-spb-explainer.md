## Cosa fa

Indica un I-SID, un nickname SPB o un ruolo dello switch, e lo strumento mette ordine nel lessico dello Shortest Path Bridging: quale VLAN di backbone trasporta il servizio e perché, a cosa si lega davvero una L2VSN e una L3VSN, cosa è e cosa non è una B-VLAN, e cosa cambia tra un backbone edge bridge e un backbone core bridge. Deterministico e offline: spiega gli identificatori, non interroga una fabric.

## Il comportamento da verificare

**Gli I-SID pari viaggiano su una VLAN di backbone e quelli dispari sull’altra.** Con i valori predefiniti di Extreme, 4051 e 4052, l’I-SID 20010 viene trasportato sulla 4052 e il 20011 sulla 4051. Due alberi a percorso minimo, ciascuno con circa metà dei servizi.

Lo strumento dice che questa è **la distribuzione predefinita e non una regola dello standard**, perché un deployment può assegnarli diversamente, e quando un servizio si comporta in modo diverso dai suoi vicini, l’albero su cui si trova è la prima cosa da controllare.

## Il fatto che lo strumento ripete in ogni risultato

**Una B-VLAN non è una VLAN.** Non esegue il flooding dell’unicast sconosciuto, del broadcast o del multicast. Inoltra solo in base alle tabelle MAC di backbone che IS-IS ha predisposto a partire dagli alberi a percorso minimo. Niente spanning tree, niente di bloccato.

Tutto il resto ne consegue: se l’inoltro è calcolato, il core non apprende; se il core non apprende, non ha bisogno di sapere che i tuoi servizi esistono. Ecco perché **aggiungere un servizio tocca solo gli switch di edge in cui compare.**

## La convalida che esegue

Un I-SID deve rientrare nell’intervallo di 24 bit, e lo strumento rifiuta i valori al di fuori invece di spiegare un numero che non può esistere. Un nickname deve essere nella forma `x.xx.xx`, e uno malformato produce un avviso, perché **un nickname duplicato o malformato è uno dei pochi errori, in questo ambito, che rompono qualcosa lontano dal punto in cui è stato digitato.**

## Cosa non fa

Non può vedere la tua fabric. Non conosce la topologia, le adiacenze né se IS-IS è davvero attivo. Spiega cosa significano i tuoi numeri all’interno di una fabric, non cosa sta facendo la tua fabric.

## In cosa differisce dal decodificatore di identificatori fabric VOSS

Entrambi accettano un I-SID e un nickname, ma rispondono a domande diverse:

- **Il decodificatore di identificatori fabric convalida un identificatore.** Incolli qualcosa e stabilisce se è un I-SID di 24 bit, un nickname di 20 bit o un system-id, e se rientra nell’intervallo.
- **Questo strumento spiega cosa significa l’identificatore in una fabric.** Quale VLAN di backbone lo trasporta e perché, a cosa si legano una L2VSN e una L3VSN, cosa è e cosa non è una B-VLAN, e cosa cambia tra un edge bridge e un core bridge.

Il valore si decodifica là; la disposizione si capisce qui.

## Condivisione dei risultati

Sotto i fatti, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` ogni campo del modulo così come l’hai inserito: `isid`, `primary`, `secondary` e `nickname` (un campo lasciato vuoto non porta nulla e arriva vuoto), e i due elenchi a discesa tramite il loro ID, `service` e `role`. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Gli I-SID, le B-VLAN, i nickname e i ruoli sono i valori che inserisci per vedere come li tratta la fabric; nulla in essi è segreto.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il modulo non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** Ogni campo viene impostato e la pagina lo spiega, come quando digiti; nulla viene inviato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
