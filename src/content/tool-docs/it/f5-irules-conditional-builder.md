## Cosa fa

Descrivi una decisione come regole ordinate («i percorsi che iniziano con /api vanno ad api_pool, /login va a login_pool, tutto il resto a web_pool») e lo strumento la scrive in tre modi:

- una catena `if` / `elseif`,
- uno `switch` (con `-glob` quando una regola lo richiede, e `--` prima del valore),
- una ricerca `class match` sui data group, con le definizioni `tmsh` dei data group.

Un valore di prova attraversa poi ogni regola generata nell’interprete didattico, e la pagina mostra quale pool ha scelto ciascuna forma.

## Perché le forme possono non concordare

`if` e `switch` prendono la **prima** regola che corrisponde, nell’ordine in cui sono scritte. `class match` con `starts_with` o `ends_with` restituisce la voce corrispondente **più lunga**, qualunque sia l’ordine (lo dice il riferimento di F5 su `class`). Con le regole `/api` e `/api/v2`, il valore di prova `/api/v2/users` va ad `api_pool` tramite `if` e `switch`, ma ad `api_v2_pool` tramite `class match`. Lo strumento segnala anche una regola che non può mai scattare perché una regola precedente corrisponde sempre prima.

## Buono a sapersi

- Convertire il valore in minuscolo (`string tolower`) rende il confronto indipendente da maiuscole e minuscole, ma a quel punto il valore di una regola con lettere maiuscole non può mai corrispondere; lo strumento lo segnala.
- `class match` non ha un confronto glob, quindi una regola glob esclude la forma con i data group.
- Il valore di una regola con una parentesi graffa senza la sua compagna viene scritto preceduto da una barra rovesciata (`\{`). Tcl conta le graffe all’interno di un corpo tra graffe anche tra virgolette doppie (regola 5 della pagina sulla sintassi di Tcl 8.4), quindi una graffa isolata romperebbe la regola; un vero Tcl 8.4.6 si ferma con `missing close-brace`.
- Per `HTTP::path`, un valore di prova viene troncato al primo punto interrogativo: `HTTP::path` non include la query string (riferimento di F5 su `HTTP::path`), quindi le regole confrontano solo la parte che lo precede.
- I nomi dei record con caratteri diversi da lettere, cifre e `_ . / : -` vengono scritti tra virgolette doppie nelle definizioni `tmsh`. Queste virgolette non sono state provate su un BIG-IP: dopo aver creato il data group, elencalo in `tmsh` e controlla i record.
- Il codice generato segue la iRules Style Guide di DevCentral (rientri di 4 spazi, una priorità sull’evento, espressioni tra graffe, nomi delle variabili tra graffe, `--` su `switch` e `class`) e supera il verificatore dello stile di questo sito senza rilievi.

## Condivisione dei risultati

Sotto il verdetto sul valore di prova, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene l’intera decisione per nome: `#subject=` (e `&header=` per un’intestazione), `&lower=1` o `0`, le regole in ordine come un’unica lista Tcl di liste `{comparison value pool}` (`&rules={starts_with /api api_pool} {equals /login login_pool}`, con percent-encoding nel link), e il pool predefinito, il nome del data group e il valore di prova (`&default=`, `&group=`, `&test=`) quando sono impostati. I nomi dei pool, del data group e delle intestazioni sono tuoi; vale per loro l’avvertenza standard del riquadro a comparsa. Tutto ciò che il link contiene va dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; anche 50 regole restano ben al di sotto.
- **Apertura di un link.** La decisione del link sostituisce l’intero modulo, compreso l’Esempio con cui si apre la pagina (un campo che il link non contiene viene svuotato; una decisione su un’intestazione senza nome usa `User-Agent`, quella della pagina), e vengono generate le tre forme. Un valore della richiesta o un confronto sconosciuto, un valore rules che non sia una lista di liste di tre elementi, più di 50 regole o un valore più lungo di quanto la pagina ammetta fa ignorare l’intero link. Accettati o no, i valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.

## Fonti

- [Riferimento iRules di F5: class](https://clouddocs.f5.com/api/irules/class.html) (consultato il 02/10/2026)
- [Riferimento iRules di F5: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (consultato il 02/10/2026)
- [Manuale di Tcl 8.4: switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (consultato il 03/10/2026)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (consultato il 03/10/2026)
- [F5 DevCentral: iRules Style Guide](https://community.f5.com/t/irules-style-guide/71151) (consultata il 03/10/2026)
- [Riferimento iRules di F5: priority](https://clouddocs.f5.com/api/irules/priority.html) (consultato il 03/10/2026)
- [Riferimento iRules di F5: HTTP::path](https://clouddocs.f5.com/api/irules/HTTP__path.html) (consultato il 03/10/2026)
- [Manuale di Tcl 8.4: Tcl (le regole di sostituzione)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (consultato il 03/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
