## Cosa fa

`findstr`, `substr` e `getfield` sono comandi che F5 aggiunge alle iRules per estrarre una parte di un valore. Lo strumento esegue quello che scegli sulla tua stringa e segna il risultato su un righello: la stringa cercata trovata, i caratteri saltati, il terminatore, i separatori e il campo restituito. Accanto, il codice Tcl puro che fa lo stesso lavoro viene eseguito nello stesso motore, così puoi vedere se i due concordano davvero.

## I tre comandi

- `findstr string search ?skip? ?terminator?` trova `search`, avanza di `skip` caratteri dall’inizio della corrispondenza, poi restituisce il testo fino al terminatore. L’esempio di F5: `findstr "<sip:+12065551234@sip.example.com>" "@" 1 ">"` restituisce `sip.example.com`.
- `substr string skip ?terminator?` parte dall’indice `skip`, dove 0 è il primo carattere. `substr "abcdefghijklm" 2 "gh"` restituisce `cdef`.
- `getfield string separator field` divide la stringa in corrispondenza di ogni occorrenza del separatore, che può essere un carattere o una stringa, e restituisce quel campo, contando da 1.

Per `findstr` e `substr`, un terminatore numerico è una lunghezza (fino a quel numero di caratteri, meno se la stringa finisce prima); qualsiasi altro terminatore è un testo prima del quale fermarsi. Tutti gli esempi pubblicati da F5 per questi comandi sono riprodotti esattamente dai test dello strumento.

## Cosa F5 non documenta

Dove le pagine di F5 tacciono, lo strumento dichiara l’ipotesi che ha fatto, contrassegnata da «Non documentato da F5»:

- `findstr` quando la stringa cercata è assente. Lo strumento restituisce una stringa vuota. F5 definisce `findstr` equivalente a `string range` con `string first`, ma in questo caso quell’equivalente restituisce l’intera stringa, quindi le due descrizioni non possono essere entrambe giuste.
- Un conteggio pari a 0. La regola di F5 («that many characters») non restituirebbe nulla, ma l’esempio di `substr` con 0 pubblicato da F5 stessa restituisce il resto della stringa; lo strumento segue l’esempio, e una nota di un contributore nella pagina del riferimento API di F5 riporta che 0 non funzionava su 11.5.4 e 11.6.0.
- Un salto oltre la fine, un salto o un conteggio negativi, un terminatore vuoto e un numero di campo di `getfield` che non corrisponde ad alcun campo.

Verifica questi casi su un BIG-IP prima di farci affidamento.

## Condivisione dei risultati

Sotto il risultato, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene il modulo per nome: la stringa come `#input=`, il comando come `&command=` e i campi non vuoti del comando (`&search=`, `&skip=`, `&terminator=`, `&separator=`, `&field=`). Tutto ciò che il link contiene va dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; campi più lunghi non ricevono alcun link, e il riquadro a comparsa indica quanto sono lunghi.
- **Apertura di un link.** Il comando, la stringa e i campi vengono compilati come se li inserissi tu (un campo che il link non contiene resta vuoto; un link senza comando apre `findstr`, il primo della pagina) e il risultato viene calcolato. Un comando sconosciuto o un campo che il comando non prevede fa ignorare l’intero link. Accettati o no, i valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.

## Fonti

- [Riferimento tmsh di F5: findstr](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_findstr.html) (consultato il 03/10/2026)
- [Riferimento tmsh di F5: substr](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_substr.html) (consultato il 03/10/2026)
- [Riferimento tmsh di F5: getfield](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_getfield.html) (consultato il 03/10/2026)
- [Riferimento iRules di F5: substr, con la nota del contributore sul conteggio 0](https://clouddocs.f5.com/api/irules/substr.html) (consultato il 02/10/2026)
- [Manuale di Tcl 8.4: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (consultato il 03/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
