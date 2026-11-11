## Cosa fa

Incolla una stringa di cifratura (cipher string) di F5 BIG-IP: lo strumento spiega ogni parola chiave e ogni operatore che contiene e segnala le scelte deboli o deprecate. Legge la stringa, cioè il valore del campo `cipher` di una cipher rule o di un profilo SSL, e traduce la sua sintassi compatta in una descrizione in linguaggio semplice di ciò che seleziona e in quale ordine. Viene eseguito interamente nel tuo browser.

## Come è fatta una stringa di cifratura F5

Una stringa di cifratura BIG-IP è un elenco ordinato di set di cifrari, separati da due punti, da una virgola o da spazi bianchi, e l’ordine conta perché esprime la preferenza del server. All’interno di un set le parole chiave si combinano con `+`, quindi `ECDHE+AES-GCM` indica i cifrari che sono sia ECDHE sia AES-GCM. Le parole chiave indicano i componenti di una suite: la versione del protocollo, lo scambio di chiavi, l’autenticazione, il cifrario dei dati (bulk cipher) e il MAC. `DEFAULT` rappresenta il set predefinito integrato di F5, un punto di partenza comune.

## Gli operatori, la parte più sottile

Un set può iniziare con un operatore, e la differenza tra gli operatori conta:

- **`!`** esclude in modo permanente i cifrari corrispondenti; una volta esclusi così, nessun termine successivo può aggiungerli di nuovo.
- **`-`** elimina i cifrari corrispondenti ma, a differenza di `!`, un termine successivo può aggiungerli di nuovo.
- **`+`** non aggiunge: sposta i cifrari corrispondenti in fondo all’elenco, abbassandone la priorità.

E `@STRENGTH` riordina l’intero elenco per lunghezza della chiave. Confondere `!` con `-`, o dimenticare che `+` riordina invece di aggiungere, è una causa frequente di stringhe di cifratura che non fanno ciò che l’autore intendeva, ed è proprio ciò che lo strumento rende visibile.

## La valutazione della sicurezza, e un limite dichiarato

Lo strumento segnala gli elementi deboli e deprecati, come i cifrari export-grade, RC4 o 3DES e le versioni di protocollo obsolete, così una stringa rischiosa salta all’occhio. C’è una cosa che volutamente non fa: non riproduce l’esatto elenco finale e ordinato di cipher suite che un determinato BIG-IP produrrebbe, perché dipende dalla tabella dei cifrari della specifica versione software installata sull’apparato. Spiega la stringa; non sostituisce il dispositivo.

## Come si usa

Incolla una stringa di cifratura presa da una cipher rule o da un profilo SSL e leggi la spiegazione di ogni parola chiave e di ogni operatore, con le scelte deboli segnalate. L’analisi è deterministica e locale.

## Condivisione dei risultati

Sotto la valutazione della sicurezza, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la stringa di cifratura o il nome della regola così come l’hai inserito: `/tools/f5-cipher-string-expander#input=ECDHE%3ARSA%3A!SSLv3...`. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser lo prevede, il suo menu di condivisione; l’indirizzo della pagina non cambia.

Secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) il frammento è separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la stringa non viene inviata al server quando il link viene aperto; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Apertura di un link.** La stringa riempie la casella come farebbe un incolla e la pagina la spiega. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina non contengono nulla.
