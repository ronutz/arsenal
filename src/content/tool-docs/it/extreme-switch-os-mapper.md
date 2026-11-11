## Cosa fa

Indica una serie di modelli o il nome di un sistema operativo e lo strumento ti dice quale denominazione si applica, in quali versioni è arrivato il cambio di nome e che cosa comporta quella particolare serie. Le due coppie di nomi sono mostrate **prima di qualsiasi input**, perché chi arriva dopo che un documento ha detto una parola e il suo switch un’altra ha bisogno della risposta subito.

## Il cambio di nome, una riga per ciascuno

- **ExtremeXOS (EXOS) → Switch Engine**, dalla 31.6
- **VOSS → Fabric Engine**, dalla 8.6

Entrambi valgono **solo per l’hardware Universal**: 4120, 4220, 5320, 5420, 5520, 5720, 7520, 7720. Tutto il resto mantiene i nomi originali, e **anche i nomi dei file immagine e i menu di avvio li usano ancora**, quindi un menu di avvio che su uno switch Fabric Engine propone di cambiare il sistema operativo «to VOSS» non è né un bug né una build vecchia.

## L’avvertenza che dà sempre

**Cambiare persona elimina la configurazione.** Con le parole di Extreme stessa: cambiare il sistema operativo di rete elimina tutti i file di configurazione, le informazioni di debug, i log, gli eventi e le statistiche del sistema precedente. **È una ricostruzione, non una migrazione**, e lo strumento lo dice a ogni ricerca, non solo quando riconosce un modello.

Segnala anche che alla domanda all’avvio Switch Engine si sceglie rispondendo no: alla domanda «Would you like to change the switch OS to VOSS? [y/N/q]» ([note di rilascio di Switch Engine 33.1.100](https://documentation.extremenetworks.com/release_notes/SwitchEngine/33.1.100/GUID-EEE4A4A1-99DC-4691-B6B5-F88A6FA8042F.shtml), consultate il 09/11/2026), **N mantiene Switch Engine, y passa a Fabric Engine**.

## Avvertenze per serie che mette in evidenza

- **7520**: lo stacking funziona con Switch Engine e **non** con Fabric Engine. Se il progetto richiede lo stacking, la scelta della persona è già fatta.
- **5420 e 5520**: l’aggiornamento a Switch Engine 31.6 **cambia il SysObjectID SNMP**, quindi il monitoraggio che identifica il dispositivo da quel valore smette di riconoscerlo, senza che dalla console sembri esserci nulla di sbagliato.
- **I requisiti minimi di Fabric Engine sono diversi**: 8.6 sui 5320, 5420 e 5520; 8.7 sul 5720.

## Cosa non fa

Lavora a livello di serie e non di singolo codice prodotto, di proposito: la questione del nome si risolve per serie, e una tabella di SKU diventerebbe obsoleta prima di essere utile. Non conosce il tuo inventario né le versioni che hai installato.

## Condivisione dei risultati

Sotto la risposta, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la serie di modelli o il nome del sistema operativo così come l’hai inserito (`input`), e nient’altro. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Le due coppie di nomi e l’elenco delle famiglie fanno parte della pagina stessa, quindi non sono nel link.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il nome non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** Il nome riempie la casella come se lo digitassi e la pagina trova la corrispondenza; nulla viene inviato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
