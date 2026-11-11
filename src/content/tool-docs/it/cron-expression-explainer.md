# Analizzatore di espressioni cron

Incolla una pianificazione crontab a cinque campi, o una delle macro `@`, e lo strumento te la rilegge: ogni campo spiegato in linguaggio semplice con l’insieme esatto dei valori a cui corrisponde, le prossime cinque occorrenze e le trappole del dialetto segnalate mentre scrivi.

## I cinque campi

`minute hour day-of-month month day-of-week`, con intervalli `a-b`, elenchi `a,b`, passi `*/n` e `a-b/n`, e nomi (`JAN`–`DEC`, `SUN`–`SAT`). Le macro `@` (`@yearly`, `@monthly`, `@weekly`, `@daily`, `@hourly` e simili) si espandono nelle loro forme a cinque campi; `@reboot` non ha alcuna pianificazione, e lo strumento lo dice invece di inventarne una.

## Le trappole che segnala

La più importante: quando sono limitati sia il giorno del mese **sia** il giorno della settimana, cron esegue il comando quando corrisponde **uno dei due**: un OR, non l’AND che quasi tutti si aspettano. Inoltre: `0` e `7` sono entrambi la domenica; un passo che non divide esattamente il suo intervallo ricomincia in modo irregolare (`*/7` nei minuti si ferma a 56, poi salta a 0); i nomi dentro intervalli con passo sono storicamente poco affidabili tra le diverse implementazioni; e un input a sei campi viene riconosciuto come il dialetto Quartz con i secondi, e indicato come tale.

## Gli orari calcolati

cron valuta le pianificazioni nell’ora **locale** del demone. Le occorrenze mostrate qui sono calcolate sull’ora di orologio dell’istante corrente del tuo browser, senza applicare alcun database dei fusi orari, con lo stesso motore deterministico che i vettori di test di riferimento (golden vectors) verificano rispetto a un momento di riferimento fisso.

Tutto viene eseguito in locale; la pianificazione non lascia mai la pagina. Si basa su `crontab(5)` e sulla specifica POSIX.

## Condivisione dei risultati

Sopra i pannelli dei campi, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la pianificazione così come l’hai inserita, una volta che la pagina l’ha letta. La pagina legge solo una pianificazione, cinque campi orari o una @macro: una riga di crontab con il suo comando viene rifiutata (il numero di campi è sbagliato), quindi un comando, e qualsiasi password o token vi sia scritto, non finisce mai in un link. Le prossime esecuzioni vengono calcolate dall’orologio di chi apre il link. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** La pianificazione compila la casella come farebbe un incolla e la pagina la spiega. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
