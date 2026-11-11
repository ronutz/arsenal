## Cosa fa

Legge un modo dei file scritto in uno qualsiasi dei tre modi in cui lo si scrive e restituisce tutte le altre grafie con la loro lettura. Le tre grafie:

- **Ottale**, da una a cinque cifre: `755`, `0644`, `4755`, `02775`, `00755`. La quarta cifra da destra contiene i bit speciali (4 set-user-ID, 2 set-group-ID, 1 cancellazione limitata o sticky); le tre alla sua destra sono proprietario, gruppo e altri, ciascuna la somma di lettura 4, scrittura 2 ed esecuzione 1.
- **Una stringa ls**, di nove caratteri o di dieci con la lettera del tipo: `rwxr-xr-x`, `-rwsr-xr-x`, `drwxrwxrwt`, `rwSr--r--`. Una `d` iniziale imposta il tipo su directory.
- **Clausole chmod** applicate a un modo di partenza con una umask: `u+x,go-w`, `a=rX`, `g+s,o-rwx`, `=755`. La base è 644 per un file e 755 per una directory, a meno che tu non ne indichi una; la umask è 022, a meno che tu non ne indichi una.

Per il modo che legge, la pagina mostra le quattro cifre ottali e la stringa ls di dieci caratteri, i dodici bit come una griglia in cui puoi selezionare un bit per invertirlo, la lettura in chiaro per classe (cosa possono fare il proprietario, il gruppo e gli altri, formulata per un file o per una directory), i tre bit speciali con il loro significato per questo tipo, le combinazioni da ricontrollare, i comandi chmod che ottengono il modo (assoluto ottale, assoluto simbolico e la modifica minima a partire dalla base), la umask che creerebbe il modo a partire dal valore predefinito di un programma e, per le clausole, una traccia del modo dopo ciascuna.

## Le regole che segue

- **La grammatica simbolica è quella di POSIX.** Classi `u`, `g`, `o` e `a`; operatori `+`, `-`, `=`; permessi `r`, `w`, `x`, `X`, `s`, `t`; oppure una classe da cui copiare, `u`, `g` o `o`. Più azioni possono seguire un elenco di classi (`u+r-w`) e le clausole sono separate da virgole.
- **`X`** imposta l’esecuzione se il file è una directory o se almeno uno dei bit di esecuzione è già impostato («if the file is a directory or if the current file mode bits have at least one of the execute bits set», POSIX chmod). Su un file normale senza bit di esecuzione, `a+X` non cambia nulla, e la traccia lo dice.
- **`=`** prima azzera i bit delle classi indicate (tutti e dodici quando non è indicata alcuna classe), poi imposta i permessi dati. `o=` senza nulla dopo azzera i bit degli altri.
- **Nessuna classe indicata** significa tutte e tre, ma per `+` e `-` i bit impostati nella umask non vengono toccati («but bits that are set in the umask are not affected», chmod(1)); il calcolatore applica la umask che indichi, 022 per impostazione predefinita, e segnala quando ha mascherato qualcosa.
- **`s`** dipende dalla classe: con `u` è set-user-ID, con `g` set-group-ID, con solo `o` non cambia nulla (POSIX). **`t`** è il flag di cancellazione limitata, applicato qualunque sia la classe indicata, come fa il chmod di GNU.
- **Le lettere di ls sono quelle di POSIX.** `s` dove set-user-ID o set-group-ID è impostato e la classe ha il permesso di esecuzione, `S` quando non ce l’ha; `t` dove il flag di cancellazione limitata è impostato e gli altri hanno il permesso di ricerca, `T` quando non ce l’hanno.
- **Regola GNU per le directory.** Quando la base è una directory, un modo numerico fino a quattro cifre mantiene i bit set-user-ID e set-group-ID della base, come indica chmod(1): «For directories chmod preserves set-user-ID and set-group-ID bits unless you explicitly specify otherwise.» Scrivere `00755`, `-6000` o `=755` li azzera, e la traccia nomina la regola quando è stata applicata.
- **I modi numerici con un operatore** (`=755`, `+111`, `-022`) vengono letti come li legge GNU: imposta esattamente, aggiunge, rimuove.

## Lettura dei bit speciali

| Bit | Valore | Su un file | Su una directory |
|---|---|---|---|
| set-user-ID | 4000 | il processo viene eseguito con l’user ID effettivo del proprietario | nessun significato portabile |
| set-group-ID | 2000 | il processo viene eseguito con il gruppo del file | le nuove voci prendono il gruppo della directory (nella maggior parte dei sistemi) |
| cancellazione limitata o sticky | 1000 | oggi nessun significato portabile; alcuni sistemi più vecchi mantenevano il testo del programma nello swap | solo il proprietario della voce, il proprietario della directory o un utente privilegiato possono rimuoverla o rinominarla |

Le lettere maiuscole sono quelle da notare: `S` significa che il bit speciale è impostato ma il bit di esecuzione corrispondente no, quindi il bit non fa nulla finché non viene concessa l’esecuzione; `T` significa che il flag di cancellazione limitata è impostato su una directory in cui gli altri non hanno il permesso di ricerca.

## La riga della umask

Un programma che crea un file richiede 666 e un programma che crea una directory richiede 777; il kernel azzera i bit impostati nella umask del processo. Il calcolatore può quindi dire quale umask crea il modo che hai inserito, e quando nessuna può farlo: un modo di file con un bit di esecuzione non viene mai prodotto dalla sola creazione, e i bit speciali non derivano mai da una umask.

## Limiti

- Il calcolatore conosce i dodici bit del modo, non il file system. Non vede proprietà, liste di controllo degli accessi (ACL), capability, opzioni di mount, attributi immutable o controllo degli accessi obbligatorio, e ognuno di questi può prevalere su ciò che dicono i bit.
- I comportamenti specifici di GNU sono modellati come li descrive chmod(1) di coreutils 9.11. Altre implementazioni possono trattare in modo diverso un modo numerico su una directory, oppure `=755`.
- Se azzerare tutti i bit di esecuzione azzeri anche set-user-ID e set-group-ID dipende dall’implementazione (POSIX chmod); il calcolatore non li azzera di sua iniziativa.
- Ogni campo viene troncato a 64 caratteri.

## Condivisione dei risultati

Sotto le due grafie principali, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il modo così come l’hai inserito (ottale, una stringa `ls` o clausole chmod), se si tratta di un file o di una directory, e il modo di partenza e la umask se li hai compilati; se sono vuoti, valgono i rispettivi valori predefiniti da entrambe le parti. Un modo non rivela nulla di tuo. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** I quattro campi si compilano come li inseriresti tu e la pagina legge il modo. Un modo vuoto, un tipo sconosciuto o un campo più lungo di quanto ammetta la pagina (64 caratteri) fanno ignorare il link. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

- [POSIX.1-2024 (IEEE Std 1003.1-2024): chmod](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/chmod.html) (consultato il 03/10/2026)
- [POSIX.1-2024 (IEEE Std 1003.1-2024): ls](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/ls.html) (consultato il 03/10/2026)
- [GNU coreutils manual: Mode Structure](https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html) (consultato il 03/10/2026)
- [chmod(1), GNU coreutils 9.11, man7.org](https://man7.org/linux/man-pages/man1/chmod.1.html) (consultata il 03/10/2026)
