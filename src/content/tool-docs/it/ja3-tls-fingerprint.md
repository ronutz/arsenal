## Cosa fa

Lo strumento calcola un’impronta (fingerprint) TLS passiva JA3. Incolla una stringa JA3, cioè i cinque campi del ClientHello (versione TLS, suite di cifratura, estensioni, curve ellittiche e formati dei punti delle curve ellittiche), con le virgole tra i campi e i trattini tra i valori, e lo strumento ricalcola l’hash MD5 di JA3, calcola la variante JA3N con le estensioni ordinate, decodifica ogni campo con il relativo conteggio e segnala gli eventuali valori GREASE. Viene eseguito interamente nel tuo browser.

## JA3, e perché l’hash è quello che è

JA3 è stato creato da Salesforce come identificatore compatto e condivisibile di un client TLS. I cinque campi che usa sono compilati per lo più dalla libreria TLS del client più che dall’applicazione, quindi la stessa build di un browser o di uno strumento tende a produrre lo stesso JA3, il che lo rende utile per individuare script, bot e librerie insolite prima che un’applicazione abbia qualsiasi altro contesto. Lo strumento segue esattamente la costruzione originale: toglie i valori GREASE (i segnaposto riservati da 0x0a0a a 0xfafa che la RFC 8701 fa inserire ai browser), ricostruisce la stringa canonica e ne calcola l’hash MD5. Due degli esempi pubblicati da Salesforce stessa sono fissati come test, quindi l’hash che ottieni qui è il JA3 che l’ecosistema si aspetta.

## GREASE e il problema della variabilità

Due fattori rendono un JA3 grezzo meno stabile di quanto sembri, e lo strumento li mette in evidenza entrambi. I valori GREASE sono segnaposto casuali che cambiano a ogni connessione; se non vengono tolti, lo stesso client produce ogni volta un hash diverso, quindi JA3 li esclude, e lo strumento ti dice quali ha trovato e rimosso. Il problema più grande è la permutazione delle estensioni: più o meno dal 2024, Chrome e Firefox rendono casuale l’ordine delle estensioni TLS a ogni connessione, e poiché JA3 calcola l’hash delle estensioni nel loro ordine, un singolo browser oggi produce migliaia di hash JA3 diversi. Lo strumento indica se le tue estensioni erano in ordine e mostra JA3N accanto a JA3.

## JA3N e JA4

JA3N è la correzione semplice: ordina l’elenco delle estensioni prima di calcolare l’hash, e la permutazione non conta più. Lo strumento lo calcola per te, quindi se il tuo input viene da un browser che permuta le estensioni, il JA3N è il valore che resta costante. JA3N però è una soluzione provvisoria. Il successore moderno è JA4, che ordina in modo nativo, usa SHA256, aggiunge un prefisso leggibile e si estende a HTTP, SSH, QUIC e TCP. Se oggi stai scegliendo un’impronta su cui costruire un sistema di rilevamento, JA4 è l’obiettivo migliore; il JA3 di questa pagina serve a leggere e confrontare le impronte che gli strumenti più vecchi e la threat intelligence usano ancora.

## Cosa un’impronta è e cosa non è

Un JA3 identifica un’implementazione TLS, non una persona né un’intenzione. È un segnale forte se combinato con il comportamento delle richieste, con l’intelligence sui proxy e con la cronologia dell’account, e un segnale debole da solo: le collisioni MD5 sono possibili, e due client diversi possono condividere un hash. Consideralo uno degli input di una decisione, un modo per accorgersi che una connessione somiglia a un bot noto o a una libreria inattesa, non una prova di qualcosa di per sé.

## Condivisione dei risultati

Sotto gli hash, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la stringa JA3 così come la legge la pagina, non il testo della casella così come l’hai inserito. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Una stringa JA3 è formata da cinque campi di numeri separati da virgole, presi da un ClientHello TLS, e la pagina legge solo i numeri: in ogni campo salta qualsiasi elemento che non sia un intero. Quindi il link contiene gli elementi interi di ogni campo così come sono scritti (compresi i valori GREASE, dato che la pagina li segnala) e tralascia gli elementi vuoti e tutto ciò che la lettura salta, come il testo incollato insieme alla stringa; la pagina che apre il link calcola gli stessi hash, le stesse segnalazioni e la stessa nota sulla permutazione. Quando la casella non contiene nient’altro, il link la contiene così come l’hai inserita.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la stringa non viene inviata al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Apertura di un link.** La stringa compila la casella come farebbe un incolla e la pagina calcola gli hash; nulla viene inviato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
