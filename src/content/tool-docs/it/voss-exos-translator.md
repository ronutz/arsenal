## Cosa fa

È una tabella di corrispondenza di riferimento tra **VOSS** (Fabric Connect / SPBM di Extreme) ed **EXOS**. Affianca le attività comuni per mostrarti come le esprime ciascuna riga di comando, e dice esplicitamente dove EXOS non ha un equivalente, perché EXOS non esegue affatto SPBM. È un riferimento, non un generatore di configurazioni: ogni comando si basa sulla documentazione di Extreme, ma devi adattare nomi, porte e numeri alla tua rete e verificare prima di applicare qualsiasi cosa.

## La differenza chiave

EXOS e VOSS sono sistemi operativi diversi che girano sull’hardware universale di Extreme. VOSS è nativo per la fabric: costruisce una fabric SPBM con IS-IS, nickname, B-VLAN e I-SID. EXOS non supporta SPBM. Si unisce a una rete Fabric Connect come edge **Fabric Attach** (un FA Proxy o Client), e l’FA Server VOSS esegue per suo conto il provisioning dell’I-SID. Quindi per le attività del core della fabric (l’istanza SPBM, il nickname, le B-VLAN, una L3 VSN) semplicemente non esiste un comando EXOS, e lo strumento lo dice chiaramente.

## Come si usa

Inserisci un’attività o un frammento di comando (ad esempio `i-sid`, `nickname`, `vlan` o `fabric attach`) e la tabella si filtra sulle righe corrispondenti. Ogni riga mostra il concetto, il comando o i comandi VOSS, il comando o i comandi EXOS oppure una nota che indica l’assenza di un equivalente, e una breve spiegazione. Svuota la casella per vedere l’intera tabella.

## Cosa non è

Non genera una configurazione pronta da applicare, e non traduce riga per riga un file di configurazione qualsiasi. La configurazione della fabric ha un forte impatto ed è specifica della piattaforma; questo strumento serve ad aiutarti a imparare e a confrontare le due CLI, non a produrre una configurazione da incollare senza verifiche in uno switch in produzione.

## Condivisione dei risultati

Sotto le corrispondenze, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene la ricerca così come l’hai inserita (`#input=i-sid`), e nient’altro; chi lo apre vede le stesse corrispondenze. Con la ricerca vuota vengono elencate tutte le corrispondenze, e il pulsante resta disattivato. Tutto ciò che il link contiene va dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; una ricerca è molto più corta.
- **Apertura di un link.** Il link è lo stesso indirizzo usato dagli altri link verso questo strumento: le parole compilano il campo di ricerca come se le digitassi. Come per ogni link verso questo strumento, il valore resta dopo il `#` finché non modifichi o cancelli il campo, e poi lascia l’indirizzo senza alcuna richiesta.
