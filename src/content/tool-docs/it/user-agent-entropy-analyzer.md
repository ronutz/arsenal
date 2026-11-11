## Cosa fa

Incolla una stringa User-Agent e lo strumento ne estrae i token identificativi (browser e versione, motore di rendering, sistema operativo e versione, classe di dispositivo e architettura della CPU), stima i bit distintivi che ciascuno aggiunge e indica se la stringa è nella forma ridotta e congelata che i browser moderni inviano oggi.

## Il punto che dimostra

Uno User-Agent è un piccolo cumulo di entropia. Nessun token da solo ti identifica, ma insieme restringono il campo, e più la stringa è dettagliata, più è distintiva. Lo strumento mostra questa superficie con onestà. I valori in bit sono indicativi, tratti dalla ricerca pubblicata sul fingerprinting, e non sono una misura in tempo reale su una popolazione: lo scopo è rendere visibile la forma della superficie, non darti un punteggio.

## Dove sono finiti i dettagli

I browser moderni congelano lo User-Agent: Chromium fissa la versione minore a 0.0.0 e limita i dettagli sulla piattaforma, e Safari ha bloccato da tempo buona parte della sua stringa. I dettagli non sono spariti: si sono spostati negli User-Agent Client Hints (Sec-CH-UA e simili), che un sito deve richiedere esplicitamente tramite l’intestazione Accept-CH. La conseguenza è che la raccolta di dati ad alta entropia ora è visibile nelle intestazioni invece di essere implicita in un’unica stringa. Solo decodifica e spiegazione: l’input è una stringa che incolli, non viene letto nulla dal tuo browser e non viene inviato nulla.

## Condivisione dei risultati

Sotto il riepilogo, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` lo User-Agent così come l’hai inserito (`input`). Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Una stringa User-Agent indica un browser, un motore e un sistema operativo, e ogni server con cui un browser comunica la riceve già. Ma la casella accetta più righe, e anche un’intera richiesta copiata dagli strumenti per sviluppatori viene letta come User-Agent, quindi prima che venga proposto un link il testo passa per il controllo dei segreti del sito: un valore che è una credenziale per il suo formato (una riga `Cookie`, [RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezione 4.2.1; le credenziali di un’intestazione Authorization, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2; un JWS o un JWE; una password in un URL; una chiave privata PEM; un ID della chiave di accesso AWS) impedisce il link, e il riquadro a comparsa ne indica la riga. Incolla solo lo User-Agent e premi di nuovo. Un valore il cui nome sembra soltanto un segreto ottiene comunque un link, con una riga che lo indica.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il testo non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Il testo riempie la casella come farebbe un incolla e la pagina lo analizza; nulla viene inviato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
