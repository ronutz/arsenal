## Cosa fa

Inserisci un valore come appare in un’iRule, ad esempio `010`, `0x1F`, `08`, `1e3` o `" 12 "`, e lo strumento mostra come lo legge Tcl 8.4.6. F5 afferma nel K6091 che il set di comandi iRules è stato sviluppato a partire dalla versione base 8.4.6 di Tcl, quindi queste sono le regole che applica un BIG-IP. Il motore dello strumento è stato verificato con un vero interprete Tcl 8.4.6 compilato dai sorgenti ufficiali.

## Come leggere il risultato

- **La riga principale** indica se il testo è un intero, un double (virgola mobile) o non è un numero, in quale base è scritto un intero e come lo stampa Tcl. `010` è l’intero 8, scritto in ottale.
- **Lo stesso intero in altre notazioni** lo riporta in decimale, esadecimale, ottale e binario, con il modo di scriverlo in un’iRule. Tcl 8.4 non ha una notazione binaria, quindi quella riga non ha una forma Tcl.
- **Dentro il double** mostra cosa nascondono le 12 cifre stampate: Tcl 8.4 stampa i double con 12 cifre significative (il suo `tcl_precision` predefinito è 12), quindi `0.1` viene stampato come `0.1` mentre il valore memorizzato è `0.1000000000000000055511151231257827021181583404541015625`.
- **I due punti in cui Tcl legge i numeri** confronta il valore scritto direttamente in un’espressione (`expr {08}`, un errore prima che venga eseguito qualsiasi cosa) con lo stesso testo contenuto in una variabile (`set x 08; expr {$x + 0}`, un errore solo quando l’aritmetica ha bisogno del numero).
- **Confronto con** esegue `==`, `eq`, `<` e `>` rispetto a un secondo valore che scegli, con il motivo di ogni risultato.

## Buono a sapersi

- Uno 0 iniziale indica l’ottale: `010 == 8` è vero e `010 eq 8` è falso, perché `eq` confronta il testo.
- `08` e `09` non sono affatto numeri. Nell’aritmetica falliscono con «can't use invalid octal number»; in un confronto diventano silenziosamente testo, quindi `"08" == 8` è falso.
- Per Tcl un double non è mai un intero: `3.0 == 3` è vero, ma `3.0` viene stampato con il punto decimale e `%` lo rifiuta.
- I valori da 2 alla 63 fino a 2 alla 64 meno 1 vengono accettati e vanno in overflow diventando numeri negativi; qualsiasi valore più grande viene rifiutato.

## Condivisione dei risultati

Sotto la riga principale e le sue note, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene il valore esattamente come l’hai inserito, spazi compresi (fanno parte del valore che Tcl legge), come `#input=`, e il valore con cui viene confrontato come `&other=` quando quel campo è impostato. Tutto ciò che il link contiene va dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un numero è molto più corto.
- **Apertura di un link.** Entrambi i campi vengono compilati come se li inserissi tu e la pagina legge il valore; un confronto che il link non contiene lascia vuoto quel campo, come lo aveva chi l’ha inviato. Qualsiasi valore viene accettato, come quando lo inserisci: la pagina dice cosa ne ricava Tcl. Accettati o no, i valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.

## Limiti

Gli interi sono modellati a 64 bit. Tcl 8.4 usa il `long` C della piattaforma per cui è stato compilato, quindi una build a 32 bit leggerebbe i valori grandi in modo diverso; lo strumento lo segnala quando un valore non sta in 32 bit.

## Fonti

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consultato il 03/10/2026)
- [Manuale di Tcl 8.4: expr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm) (consultato il 03/10/2026)
- [Riferimento iRules di F5: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (consultato il 02/10/2026)
- [Codice sorgente di Tcl 8.4.6, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (l’interprete di riferimento; `doc/tclvars.n` documenta il valore predefinito 12 di `tcl_precision`)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
