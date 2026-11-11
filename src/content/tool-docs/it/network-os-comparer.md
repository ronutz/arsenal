## Cosa fa

Quattordici sistemi operativi di rete (IOS, IOS XE, IOS XR, NX-OS, Junos, Junos Evolved, EOS, TMOS, F5OS, EXOS, VOSS, FortiOS, PAN-OS e Gaia), ciascuno con la sua discendenza, ciò su cui gira, come i componenti condividono lo stato, dove si dividono controllo e inoltro, come si applicano le modifiche e quanto costa un aggiornamento.

**Scegline uno per un profilo completo. Scegline due per confrontarli asse per asse**, con una nota su ogni asse che spiega perché quell’asse permette di prevedere qualcosa.

## L’asse che conta di più

**Come viene condiviso lo stato** prevede il comportamento in caso di guasto meglio di qualsiasi altra cosa:

- **Memoria condivisa**: un guasto si propaga. Il classico IOS esegue tutto in un unico spazio di indirizzamento, senza protezione della memoria.
- **Scambio di messaggi**: un guasto resta circoscritto. IOS XR riavvia il processo.
- **Un archivio di stato**: un processo riavviato **riprende** invece di ricostruire. SysDB di Arista e il data store distribuito di Junos Evolved funzionano entrambi così, e quello di Evolved sopravvive anche quando il processo riparte su un nodo diverso.

Il secondo asse è **applicazione immediata contro candidate e commit**. Con l’applicazione immediata un errore è subito in produzione. Con il commit un errore è una modifica abbandonata: la differenza tra un incidente e un pomeriggio di lavoro.

## Ogni voce elenca i punti deboli

**Un vettore di test di riferimento (golden vector) verifica che nessuna voce ne abbia meno di due.** Una voce senza costi elencati è una pubblicità, e chi legge avrebbe ragione a diffidare del resto della tabella. Questo vale anche per le piattaforme su cui l’autore di questo sito insegna e per cui è autorizzato.

Lo stesso controllo verifica che ogni voce abbia la discendenza, almeno due punti di forza e un’idea distintiva abbastanza sostanziosa da dire qualcosa; alla prima esecuzione ha individuato un campo troppo scarno.

## Cosa non fa

Non è una matrice delle funzionalità né una guida all’acquisto. Non segue le versioni attuali, di proposito: **le versioni cambiano, l’architettura no**, e una tabella che invecchiasse ogni trimestre sarebbe peggio di nessuna tabella.

Non può nemmeno dirti quale comprare. Può dirti invece cosa farà ciascuno quando qualcosa si guasta, che è una domanda più duratura.

## Condivisione dei risultati

Sotto i dati del profilo, o sotto il titolo del confronto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` i sistemi che hai scelto, con i loro ID: `os` sempre (così il link conserva il suo significato anche se cambia il sistema iniziale) e `with` quando è scelto un secondo sistema. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la scelta non viene inviata al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Apertura di un link.** I due menu a discesa vengono impostati e la pagina mostra il profilo o il confronto, come quando li scegli. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
