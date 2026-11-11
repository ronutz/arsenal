## Cosa fa

Descrivi un cluster FGCP (per ogni unità i guasti delle interfacce monitorate, l’anzianità, la priorità e il numero di serie, più l’impostazione override) e questo strumento esegue l’elezione dell’unità primaria, indica il criterio che l’ha decisa e ti dice chi sarebbe primaria se l’override fosse impostato al contrario. Viene eseguito interamente nel tuo browser.

## La domanda a cui risponde

«Perché l’unità con la priorità più alta non è la primaria?»

È una domanda che ricorre di continuo, e la risposta è quasi sempre la stessa. Con l’override **disabilitato**, che è il valore predefinito, FGCP confronta **l’anzianità prima della priorità**. Un’unità che si è riavviata ha un’anzianità bassa, quindi resta secondaria per quanto alta sia la sua priorità.

Non è un bug né un errore di configurazione. Il comportamento predefinito esiste perché un’unità instabile non possa prendere e perdere ripetutamente il ruolo di primaria, dato che ogni cambio di ruolo interrompe il traffico. Fortinet ha preferito la stabilità alla preferenza, e l’impostazione per cambiarlo è lì, a portata di mano.

## L’ordine di confronto

| Ordine | Criterio | Vince |
|---|---|---|
| 1 | Interfacce monitorate guaste | Il valore minore |
| 2 | Anzianità (override disabilitato) | Il valore più alto |
| 3 | Priorità | Il valore più alto |
| 4 | Numero di serie | Spareggio deterministico |

Abilitare l’override porta **la priorità sopra l’anzianità**, quindi le posizioni 2 e 3 si scambiano. Le interfacce monitorate restano al primo posto in entrambe le modalità, e il numero di serie resta all’ultimo.

Lo strumento mostra l’ordine effettivamente in vigore per il tuo input invece di quello generico, perché è la parte che si ricorda male.

## Il controfattuale è l’output utile

Oltre all’unità vincente, lo strumento calcola chi sarebbe primaria con l’override impostato al contrario. Quando il risultato è diverso, lo dice esplicitamente.

Conta perché «FGT-B è primaria» è un fatto, mentre «con l’override abilitato sarebbe primaria FGT-A, ed è questa sola impostazione a decidere questo cluster» è una decisione. La seconda è ciò che serve davvero a chi sta guardando un cluster che si comporta in modo inatteso.

Quando cambiare l’override non cambierebbe nulla, lo dice ugualmente, e in una riga esclude un’intera linea di indagine.

## Come leggere gli altri esiti

**Decisa dalle interfacce monitorate** significa che lo stato delle interfacce ha deciso prima che venisse consultato qualsiasi altro criterio. Ripristina l’interfaccia inattiva e il confronto passa oltre.

**Decisa dal numero di serie** significa che tutto il resto era in parità. È deterministico ma arbitrario: se vuoi che sia preferita un’unità specifica, imposta una priorità invece di affidarti a quale numero di serie viene prima nell’ordinamento.

## Cosa non modella

Solo l’elezione. Non modella la sopravvivenza delle sessioni durante il failover, che dipende dal session pickup e dal fatto che l’ispezione fosse basata su proxy, e non modella lo split brain, che è un guasto del percorso di heartbeat e non un esito dell’elezione. Questi temi sono trattati nell’articolo sull’alta disponibilità FGCP.

## Condivisione dei risultati

Sotto l’unità primaria e i suoi rilievi, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il testo della casella così come l’hai incollato. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Le righe di direttiva nominano le tue unità e i loro numeri di serie (è il motivo per cui il riquadro a comparsa aggiunge una riga di avvertenza), e la pagina legge solo le righe `member:` e `override:`, quindi anche un blocco `config system ha` incollato accanto a esse finirebbe nel link, con la password del cluster. Prima che venga offerto un link, nella casella viene cercata una credenziale definita da FortiOS o da uno standard: una riga `set` di un’impostazione che il [riferimento CLI di FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) classifica come password (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` e le altre; consultato il 01/11/2026) o il `name` di una community SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sezione 3.2.5), qualsiasi valore `ENC` (secondo l’advisory di Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), consultato il 01/11/2026, dati di questo tipo pubblicati dove altri possono leggerli vanno considerati facili da decifrare: «should currently be considered “easy to decrypt”»), una coppia `psksecret=` o `password=` con gli stessi nomi su una riga di direttiva, una chiave privata PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), una riga `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2), una password in un URL o un ID della chiave di accesso AWS. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo, così ciò che condividi è esattamente ciò che hai scelto (un valore non viene mai sostituito all’interno di una casella incollata, perché cambierebbe ciò che viene inviato). Un valore il cui nome sembra soltanto un segreto non blocca il link; il riquadro a comparsa indica il primo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La casella si riempie come farebbe un incolla e la pagina esegue l’elezione, controfattuale compreso. Non viene contattato nulla. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Dove si colloca

Si abbina all’articolo sull’alta disponibilità FGCP di FortiGate, che spiega perché esiste l’ordine predefinito e cos’altro cambia al failover. Per chi prepara l’NSE 4 copre l’obiettivo 1.03.
