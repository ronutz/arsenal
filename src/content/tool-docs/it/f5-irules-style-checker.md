## Cosa fa

Legge un’iRule confrontandola con la «iRules Style Guide» di DevCentral (pubblicata da JRahm con Jim_Deucker il 22 dicembre 2022), aggiunge due punti sollevati nei commenti alla guida ed esegue sull’iRule una vera analisi sintattica Tcl 8.4. La regola viene analizzata, mai eseguita. Ogni rilievo indica la regola da cui deriva, la riga e cosa cambiare; le righe segnalate sono evidenziate su una copia numerata della regola.

## Cosa verifica

- **Impostazioni dell’editor (da E1 a E3):** tabulazioni e rientri che non sono multipli di 4 spazi, righe oltre le 100 colonne (un avviso oltre le 120), terminatori di riga Windows, spazi bianchi finali, l’assenza dell’a capo finale e i caratteri non ASCII, ciascuno indicato con il suo code point, il suo nome Unicode ufficiale e la sua colonna.
- **Regole numerate:** caratteri che rompono il codice (R1), il limite di dimensione di F5 (R2), una `{` isolata sulla propria riga o un `else` su una nuova riga (R4), commenti a fine riga, commenti senza spazio e commenti tra i pattern di `switch` (R6), più comandi su una riga (R7), `if` su una sola riga (R8), stati memorizzati come parole, ad esempio `yes` (R9), gli operatori `and` / `or` / `not` di F5 (R10), `}{` senza spazio o una parola chiave attaccata alla sua graffa (R11), espressioni senza graffe (R12), variabili nelle espressioni senza spazi intorno (R13) o senza graffe intorno al nome (R14), `switch` e `table` senza `--` (R15), eventi senza priorità (R16), voci di `table` senza timeout o lifetime (R17; altrimenti il riferimento di F5 su `table` applica un timeout di 180 secondi e un lifetime indefinito), nomi `static::` senza prefisso (R18), flag di debug `static::` (R19) e codice commentato (R20).
- **Dai commenti alla guida (D1, D2):** `==` o `!=` con un testo, dove si intende `eq` o `ne` (D1); `break` o `continue` senza un ciclo intorno, `break` in un ramo di `switch` all’interno di un ciclo e `return` in un ramo di `switch` (D2).
- **Sintassi:** un errore segnalato dal parser di Tcl 8.4, come `}{` senza spazio («extra characters after close-brace»), significa che l’iRule non può essere caricata affatto.

## Caratteri che si nascondono nel codice

La prima regola della guida riguarda le virgolette tipografiche e gli spazi indivisibili che un word processor inserisce di nascosto. Il verificatore classifica ogni carattere non ASCII con la Unicode Character Database 18.0.0, quindi trova l’intera famiglia, non solo quei due:

- **R1, errore:** caratteri invisibili (l’elenco Default_Ignorable_Code_Point di Unicode: spazi e joiner a larghezza zero, il byte order mark, il trattino morbido (soft hyphen), i controlli bidirezionali), spazi diversi dallo spazio ASCII (indivisibile, em, ideografico e altri) e virgolette tipografiche. Provato in tclsh 8.4.6: uno spazio indivisibile unisce due parole in un unico nome di comando, le virgolette curve non raggruppano le parole e uno spazio a larghezza zero dopo una graffa di chiusura ferma la regola con «extra characters after close-brace».
- **E3, avviso:** trattini diversi dall’hyphen-minus ASCII. Tcl non li legge né come trattino di un’opzione né come segno meno: uno `switch` con un en dash (U+2013) digitato al posto di `--` prende il trattino come valore e, senza dire nulla, non trova alcuna corrispondenza.
- **E3, nota:** altri caratteri simili ad ASCII (lettere a larghezza piena, i puntini di sospensione, i numeri romani) e qualsiasi altro carattere non ASCII.

Questo riguarda la guida stessa: così come risultava pubblicata il 3 ottobre 2026, il suo esempio di `RULE_INIT` ha uno spazio a larghezza zero dopo la graffa di chiusura e il suo esempio di debug ha una riga che contiene solo quel carattere, quindi copiare alla lettera l’uno o l’altro rompe l’iRule.

## Il limite di dimensione

F5 K9204 fissa il limite a 65.520 caratteri; BIG-IP si rifiuta di salvare o caricare un’iRule più lunga, con un errore che riporta «Max string size exceeded» e «max:65520». La guida arrotonda questo valore a 64 KB. Il verificatore conta i caratteri e i byte che occupano in UTF-8, e segnala R2 quando uno dei due supera 65.520.

## Dai commenti alla guida

- **D1:** Kai Wilke ha fatto notare che l’esempio della regola 10 della guida confronta del testo con `==`, e gli autori hanno accettato di aggiungere un punto su `eq` / `ne`. `==` confronta come numeri ogni volta che entrambi i lati sembrano numeri: in Tcl 8.4.6, `10 == 012` e `1 == "0x0000001"` sono entrambi veri. La pagina How To Write Fast Rules di F5 chiede di confrontare numeri con numeri e stringhe con stringhe.
- **D2:** Juergen Mang ha osservato che i rami di `switch` non hanno bisogno di `return` o `break` per fermarsi. Un ramo di `switch` non prosegue mai nel successivo, `return` esce dall’intero evento (pagina di F5 su `return`) e `break` senza un ciclo intorno è un errore in Tcl 8.4.6 (verificato nel corpo di una proc). F5 non documenta cosa ne fa il TMM nel corpo di un evento.

## Condivisione dei risultati

Sotto il verdetto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` l’iRule così come l’hai incollata, e nient’altro. Prima che tu copi qualsiasi cosa, il riquadro a comparsa aggiunge un’avvertenza: un’iRule può riportare host, pool e data group interni.

Prima ancora di offrire un link, la pagina cerca nell’iRule chiavi e credenziali scritte in chiaro nei punti in cui le collocano i riferimenti di F5 stessa (tutti consultati il 27/10/2026):

- la passphrase di `HTTP::cookie encrypt` e `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- una chiave nella forma di stringa `AES 128 <hex>`, o la chiave di `AES::encrypt` e `AES::decrypt` scritta in chiaro ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- il valore di `-key` o `-keyhex` in `CRYPTO::encrypt`, `decrypt`, `sign` e `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- un’intestazione `Authorization` o `Proxy-Authorization` scritta con `HTTP::header insert` o `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), il cui valore è definito dalla [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (sezioni 11.6.2 e 11.7.2) come le credenziali;
- un valore letterale assegnato con `set` a una variabile usata in uno di quei punti, come nell’esempio di `CRYPTO::encrypt` stesso;
- e, dal controllo dei segreti del sito, una chiave privata PEM, un JWT, un ID di chiave di accesso AWS o una password in un URL.

Quando la pagina ne trova uno, il link non viene creato: il riquadro a comparsa indica la riga, e tu sostituisci il valore con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto quello di un segreto (`set static::api_token "..."`) non blocca il link; viene invece indicato nella riga di avvertenza. Nessun controllo trova tutti i segreti, quindi rileggi ciò che invii.

Tutto ciò che il link contiene va dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza.** Al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un’iRule più lunga non riceve alcun link, e il riquadro a comparsa indica quanto è lunga. F5 ammette un’iRule fino a 65.520 caratteri (K9204), quindi un’iRule lunga può superare questo verificatore ed essere comunque troppo lunga per un link.
- **Apertura di un link.** Il testo riempie la casella come farebbe un incolla, e la pagina lo legge come legge un testo incollato; l’iRule non viene mai eseguita. Accettati o no, i valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.

## Limiti

- Le variabili array come `$static::pools($key)` sono Tcl valido, ma il motore Tcl del sito non le modella. Il verificatore le legge ciascuna come una variabile semplice, continua a verificare il resto della regola e lo segnala in una nota.
- Alcune regole non si possono valutare dal solo testo. Stabilire se una riga che inizia con `#` sia codice commentato o un commento a cui manca lo spazio è un’ipotesi basata sulla prima parola, quindi quei rilievi sono note.
- La regola R3 (dividere l’iRule in blocchi funzionali) è una scelta di progettazione che il verificatore non giudica. R5 (il rientro di 4 spazi applicato anche ai valori annidati come i rami di `switch`) è coperta dalla verifica dell’indentazione. L’impostazione dell’editor che chiede di evitare le continuazioni di riga non viene verificata.

## Fonti

- [F5 DevCentral: iRules Style Guide, con i suoi commenti](https://community.f5.com/t/irules-style-guide/71151) (consultata il 03/10/2026)
- [F5 K9204: iRules are limited to 65,520 characters](https://my.f5.com/manage/s/article/K9204) (consultato il 03/10/2026)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (consultato il 03/10/2026)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (consultato il 03/10/2026)
- [Riferimento iRules di F5: How To Write Fast Rules](https://clouddocs.f5.com/api/irules/HowToWriteFastRules.html) (consultato il 03/10/2026)
- [Riferimento iRules di F5: return](https://clouddocs.f5.com/api/irules/return.html) (consultato il 03/10/2026)
- [Riferimento iRules di F5: priority](https://clouddocs.f5.com/api/irules/priority.html) (consultato il 03/10/2026)
- [Riferimento iRules di F5: table](https://clouddocs.f5.com/api/irules/table.html) (consultato il 03/10/2026)
- [Manuale di Tcl 8.4: switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (consultato il 03/10/2026)
- [Manuale di Tcl 8.4: break](https://www.tcl-lang.org/man/tcl8.4/TclCmd/break.htm) (consultato il 03/10/2026)
- [Unicode Character Database 18.0.0: PropList.txt](https://www.unicode.org/Public/UCD/latest/ucd/PropList.txt) (consultato il 03/10/2026)
- [Unicode Character Database 18.0.0: DerivedCoreProperties.txt](https://www.unicode.org/Public/UCD/latest/ucd/DerivedCoreProperties.txt) (consultato il 03/10/2026)
- [Unicode Character Database 18.0.0: UnicodeData.txt](https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt) (consultato il 03/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
- [Riferimento iRules di F5: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) e [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (consultati il 27/10/2026): dove un’iRule contiene una passphrase, una chiave o delle credenziali, che bloccano un link di Condividi i risultati
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (consultata il 27/10/2026): sezioni 11.6.2 e 11.7.2, i valori di Authorization e Proxy-Authorization sono credenziali
