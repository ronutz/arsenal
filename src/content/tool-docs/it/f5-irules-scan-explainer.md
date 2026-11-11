## Cosa fa

`scan` è il modo economico per scomporre un valore in un’iRule; il riferimento di F5 su `matches_regex` osserva che un comando sulle stringhe è più efficiente di un’espressione regolare e che la maggior parte dei casi si può gestire con `string match` o `scan`. Indica allo strumento un valore, un formato e i nomi delle variabili: lo strumento affianca ogni direttiva del formato ai caratteri che ha consumato, al valore che ha prodotto e alla variabile che lo ha ricevuto, poi indica esattamente perché la scansione si è fermata. Il valore viene disegnato su un righello, con i caratteri di ogni conversione in un colore proprio.

## Come leggere il risultato

- **scan ha restituito** è il risultato del comando: con i nomi delle variabili, il numero di variabili che hanno ricevuto un valore; senza nomi, una lista dei valori convertiti.
- **Direttiva per direttiva** ha una riga per ogni direttiva: un testo letterale che doveva corrispondere, uno spazio bianco che salta qualsiasi quantità di spazi o una conversione come `%d`, `%s` o `%[^&]`.
- **Variabili dopo lo scan** mostra cosa contiene ogni variabile indicata. Una variabile che segue il punto in cui la scansione si è fermata non viene impostata da questo scan.

## Buono a sapersi

- `-1` significa che l’input è finito prima della prima conversione; `0` significa che una conversione è stata tentata e non ha trovato corrispondenza. Verifica entrambi i casi quando un valore può essere vuoto.
- `%d` salta gli spazi bianchi iniziali e legge in decimale; `%i` ricava la base da un prefisso, quindi `08` letto con `%i` dà 0 e si ferma all’8. Usa `%d` per orari e codici con zeri iniziali.
- `%s` si ferma a uno spazio bianco; `%[^&]` legge tutto fino a una e commerciale.
- Tcl 8.4.6 memorizza le conversioni intere tramite un `int` C: `3000000000` letto con `%d` torna come `-1294967296`, e in 8.4.6 il modificatore `l` non cambia le cose. Per mantenere intatto un numero grande, leggilo come testo con `%[0-9]` e lascia che sia `expr` a interpretarlo.
- `%n` memorizza la quantità di input consumata fino a quel punto. Il manuale parla di caratteri, ma Tcl 8.4.6 conta i byte del suo UTF-8 interno, quindi ogni carattere non ASCII conta 2 o 3.

## Condivisione dei risultati

Sotto il risultato, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene i tre campi così come li hai inseriti: il valore da scomporre come `#input=`, il formato come `&format=` e i nomi delle variabili come `&vars=`, ognuno omesso quando è vuoto. Tutto ciò che il link contiene va dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; campi più lunghi non ricevono alcun link, e il riquadro a comparsa indica quanto sono lunghi.
- **Apertura di un link.** I campi vengono compilati come se li inserissi tu (un campo che il link non contiene resta vuoto, come lo aveva chi l’ha inviato) e lo scan viene spiegato. Qualsiasi testo viene accettato, come quando lo inserisci: un formato errato riceve l’errore di Tcl stesso. Accettati o no, i valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.

## Limiti

Il motore segue `Tcl_ScanObjCmd` di Tcl 8.4.6 ed è stato verificato con un vero interprete Tcl 8.4.6 su migliaia di casi generati. I risultati interi che dipendono dalla libreria C della piattaforma sono segnalati.

## Fonti

- [Manuale di Tcl 8.4: scan](https://www.tcl-lang.org/man/tcl8.4/TclCmd/scan.htm) (consultato il 03/10/2026)
- [Riferimento iRules di F5: matches_regex](https://clouddocs.f5.com/api/irules/matches_regex.html) (consultato il 02/10/2026)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consultato il 03/10/2026)
- [Codice sorgente di Tcl 8.4.6, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (l’interprete di riferimento)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
