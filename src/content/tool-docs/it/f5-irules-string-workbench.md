## Cosa fa

Esegue un sottocomando `string` di Tcl 8.4.6 e disegna il risultato su un righello di caratteri: ogni carattere della stringa con il suo indice, colorato in base a ciò che il comando ne ha fatto (cercato, corrispondente, restituito, sostituito, rimosso, o la prima differenza in un confronto). Sono coperti diciassette sottocomandi: `length`, `bytelength`, `tolower`, `toupper`, `range`, `index`, `first`, `last`, `map`, `match`, `compare`, `equal`, `trim`, `trimleft`, `trimright`, `replace` e `repeat`.

## Come leggere il risultato

- **Il comando** è la riga esatta da incollare in un’iRule, con il quoting che serve a Tcl.
- **Il righello** numera i caratteri da 0, come contano tutti gli argomenti di indice.
- **Come sono stati letti gli argomenti di indice** mostra la lettura di ogni indice: `end-1` indica il penultimo carattere, e un indice scritto `010` è ottale, quindi significa 8.
- **L’unico passaggio di string map** elenca ogni posizione: mantenuta, oppure sostituita, e da quale chiave e valore.

## Buono a sapersi

- `length` conta i caratteri; `bytelength` conta i byte dell’UTF-8 interno di Tcl, quindi `héllo` è lungo 5 caratteri e 6 byte.
- `string map` fa un solo passaggio da sinistra a destra. In ogni posizione vince la prima chiave dell’elenco che corrisponde, e il testo sostituito non viene più esaminato: `string map {a 1 ab 2} abab` dà `1b1b`, mentre `{ab 2 a 1}` dà `22`.
- `compare` ordina per codice del carattere, quindi `string compare bench Chair` dà 1.
- `string index` e `string range` restituiscono una stringa vuota, non un errore, quando l’indice è fuori dalla stringa.
- `trim` rimuove un **insieme** di caratteri, in qualsiasi ordine, non una parola.
- Tcl 8.4.6 accetta `e` o `en` da soli come `end`, ma `e-1` è un errore.
- La conversione tra maiuscole e minuscole usa le tabelle Unicode proprie di Tcl 8.4.6, che differiscono da quelle di un browser moderno per circa mille caratteri (per esempio, Tcl 8.4.6 non ha una forma maiuscola per `µ`).

## Condivisione dei risultati

Sotto il risultato, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene il modulo per nome: il sottocomando come `#op=`, poi ogni campo di argomento non vuoto con il proprio nome (`&string=`, `&first=`, `&needle=`, `&haystack=`, `&mapping=` e così via), e `&nocase=1` quando **-nocase** è selezionato per un sottocomando che lo accetta. Non esiste un unico `#input=`: il campo che contiene il testo su cui si lavora cambia con il sottocomando. Tutto ciò che il link contiene va dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; campi più lunghi non ricevono alcun link, e il riquadro a comparsa indica quanto sono lunghi.
- **Apertura di un link.** Il sottocomando e i suoi campi vengono compilati come se li inserissi tu (un campo che il link non contiene resta vuoto) e il risultato viene calcolato. Un sottocomando sconosciuto, un campo che il sottocomando non prevede o `-nocase` dove non si applica fa ignorare l’intero link; il testo dei campi viene accettato così come è stato inserito, e un indice errato riceve l’errore di Tcl stesso, come quando lo inserisci. Accettati o no, i valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.

## Limiti

I caratteri oltre il Basic Multilingual Plane vengono rifiutati, perché Tcl 8.4 non può contenerli come un unico carattere. `string is`, `totitle`, `wordstart` e `wordend` non sono modellati. Per `repeat` i risultati sono limitati a 100.000 caratteri.

## Fonti

- [Manuale di Tcl 8.4: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (consultato il 03/10/2026)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consultato il 03/10/2026)
- [Codice sorgente di Tcl 8.4.6, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (l’interprete di riferimento con cui viene verificato il motore)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
