## Cosa fa

È uno strumento didattico. Esegue nel tuo browser una ricerca a forza bruta, entro un limite, che cerca un input il cui hash corrisponda al digest da invertire. Contro un input debole, un PIN corto o poche lettere minuscole, ci riesce in pochi secondi; contro qualsiasi cosa abbia un’entropia reale esaurisce il suo spazio delle chiavi limitato e si ferma senza una risposta. Il punto è proprio questo contrasto: fa vedere con mano perché un hash veloce senza salt è un pessimo modo per proteggere una password, e perché un segreto ad alta entropia è al sicuro anche da una ricerca diretta.

## Cos’è una preimmagine e come funziona la ricerca

Un hash è unidirezionale, quindi non esiste una formula che riporti un digest al suo input. L’unico modo generico per invertirlo è tirare a indovinare: scegli un candidato, ne calcoli l’hash e verifichi se il digest corrisponde. Lo strumento fa esattamente questo. Enumera i candidati su un alfabeto e una lunghezza che scegli tu (cifre, lettere minuscole e così via) e calcola in locale l’hash di ciascuno finché non trova una corrispondenza o non esaurisce i candidati. Non usa nessun dizionario, nessun elenco di parole e nessuna tabella precalcolata, quindi è soltanto una dimostrazione di ricerca esaustiva, non un kit per il cracking delle password.

## Perché gli input deboli cedono e quelli robusti no

Il numero di candidati è la dimensione dell’alfabeto elevata alla lunghezza. Un PIN di 4 cifre è solo 10^4, cioè 10.000 possibilità, banali da esplorare; sei lettere minuscole sono 26^6, circa 300 milioni, ancora poche per un computer; ma ogni carattere in più moltiplica lo spazio, quindi un segreto davvero casuale porta il conteggio ben oltre ciò che qualsiasi ricerca locale limitata può coprire. È esattamente per questo che gli hash veloci come MD5 o SHA-256, che si possono calcolare miliardi di volte al secondo, non sono adatti alle password, e per questo i sistemi reali aggiungono un salt e usano una funzione di derivazione della chiave volutamente lenta, come raccomandano la guida Password Storage di OWASP e la NIST SP 800-63B.

## Cosa non può fare

Poiché lo spazio delle chiavi è limitato e non c’è un elenco di parole, lo strumento recupera soltanto input che si sapeva già essere deboli. Non può attaccare un hash con salt, né un hash prodotto da una funzione di derivazione della chiave lenta come bcrypt, scrypt, Argon2 o PBKDF2, progettate per rendere costoso ogni tentativo.

Non ha nemmeno un elenco di password violate. Per verificare se una determinata password è già comparsa in una violazione dei dati, senza inviarla, usa la [Verifica Pwned Passwords](/dev/out/pwned-passwords) nella stanza rossa: invia solo i primi cinque caratteri dell’hash SHA-1 della password, e solo quando premi Interroga o Invio.

## Come si usa

Incolla il digest da invertire, oppure creane uno calcolando l’hash di un input di prova nel [generatore di hash](/tools/hash) (SHA-1 o SHA-256), scegli l’alfabeto e la lunghezza massima della ricerca e guarda la ricerca procedere. Prova un input numerico breve per vederla riuscire in fretta, poi aumenta la lunghezza o amplia l’alfabeto per vedere lo spazio delle chiavi superare la ricerca.

## Condivisione dei risultati

Sotto la ricerca e l’eventuale risultato, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la ricerca così come l’hai impostata: l’hash, l’alfabeto e la lunghezza massima. Non contiene mai ciò che una ricerca ha trovato, e aprirlo non ne avvia mai una. Il suo riquadro a comparsa indica prima cosa contiene il link, poi un’avvertenza specifica, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

L’avvertenza conta qui più che altrove: questa pagina esiste per mostrare che un hash veloce e senza salt di un input debole equivale all’input stesso. Chi apre il link può premere Avvia la ricerca e ottenere la risposta che hai ottenuto tu, quindi invia hash di valori di prova, mai di una password reale.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi i valori non vengono inviati al server quando si apre il link; restano nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerli.

- **Apertura di un link.** I tre campi vengono compilati, l’eventuale ricerca in corso si ferma e una nota ti chiede di premere Avvia la ricerca: la ricerca parte solo quando lo decidi tu, nel tuo browser. Un hash di cui la pagina non riesce a dedurre l’algoritmo dalla lunghezza, un alfabeto che la pagina non offre o una lunghezza fuori dall’intervallo che va da 1 al limite di quell’alfabeto fanno ignorare l’intero link. In ogni caso i valori lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
