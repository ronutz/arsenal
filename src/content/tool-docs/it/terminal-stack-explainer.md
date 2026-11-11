## Cosa fa

Esegui `tty` in una shell, incolla ciò che ha stampato, e lo strumento ti dice quale livello dello stack del terminale stai davvero guardando: il lato slave di uno pseudoterminale, una console virtuale, una vera linea seriale, il sinonimo del terminale di controllo o la console di sistema. Gestisce anche **«not a tty»**, che è un rilievo e non un errore.

Le quattro definizioni di una riga compaiono **prima** che tu incolli qualcosa, perché chi arriva con le idee confuse su queste parole non dovrebbe dover fornire un input prima che la pagina gli dica qualcosa.

## Cosa ti dà ogni risposta

- **`/dev/pts/N`**: il lato slave di uno pseudoterminale. Qualcosa nello spazio utente tiene il lato master: il tuo emulatore, `sshd` o `tmux`. **Il numero viene assegnato, non ha significato**: due shell con numeri consecutivi non hanno alcun legame. È anche il motivo per cui chiudere una finestra termina ciò che vi era in esecuzione: il master sparisce, il kernel chiude la linea (hang-up) e il leader di sessione riceve SIGHUP.
- **`/dev/ttyN`**: una console virtuale, il kernel che gestisce la tastiera e lo schermo della macchina stessa. Sopravvive a ciò che fa cadere uno pseudoterminale, ed è per questo che ci finisci quando il display server è morto.
- **`/dev/ttyS0`, `/dev/ttyUSB0`**: una vera linea seriale, il caso originario, immutato. Lo strumento avverte che **i parametri seriali non vengono negoziati**: una discordanza produce caratteri senza senso dall’aria convincente invece del silenzio, quindi una console che mostra caratteri illeggibili di solito dipende da un’impostazione di velocità più che da un cavo guasto.
- **`/dev/tty`**: non un dispositivo ma un **sinonimo** del terminale che controlla il processo chiamante, qualunque esso sia. Spiega perché una richiesta di password ti raggiunge anche quando l’output è rediretto.
- **`/dev/console`**: dove parla il kernel, e su un server spesso è la porta seriale più che lo schermo.

## Cosa non fa

Legge un percorso, non un sistema. Non può dirti chi tiene il master del tuo specifico `/dev/pts/3`, e non tira a indovinare sui nomi di dispositivo che non conosce: un percorso non riconosciuto viene riportato come tale, perché un dispositivo specifico di una piattaforma non va dedotto dal modo in cui si scrive il suo nome.

## Condivisione dei risultati

Sotto la descrizione del dispositivo, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il percorso del dispositivo o l’output di tty così come l’hai inserito (`input`), e nient’altro. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Le quattro definizioni in alto fanno parte della pagina stessa, quindi non sono nel link.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il percorso non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** Il percorso riempie la casella come se lo avessi digitato e la pagina lo spiega; nulla viene inviato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
