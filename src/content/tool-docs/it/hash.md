## Cosa fa

Inserisci un testo e ottieni i suoi digest SHA-1, SHA-256, SHA-384 e SHA-512, ciascuno mostrato in esadecimale e in Base64. Il calcolo dell’hash viene eseguito dall’API Web Crypto nativa del browser (`crypto.subtle.digest`), non da un’implementazione inclusa nella pagina, quindi i valori coincidono con quelli prodotti da qualsiasi piattaforma conforme. I quattro digest vengono calcolati insieme, quindi cambiare quello visualizzato non comporta mai un nuovo calcolo. Tutto avviene nel tuo browser. Puoi anche calcolare l’hash di un file invece che di un testo inserito: vedi File, più sotto.

## Cos’è un hash crittografico

Un hash crittografico trasforma un input di qualsiasi lunghezza in un digest di lunghezza fissa, con alcune proprietà che lo definiscono: è deterministico (lo stesso input dà sempre lo stesso digest), unidirezionale (non puoi ricavare l’input dal digest) e resistente alle collisioni (trovare due input con lo stesso digest è impraticabile). Cambiare un solo bit dell’input cambia circa metà dei bit dell’output, quindi un digest non rivela nulla su quanto due input si somiglino. Qui l’hash viene calcolato sull’input come sequenza di byte UTF-8.

## I quattro algoritmi

Tutti e quattro sono definiti nel FIPS 180-4, con codice di riferimento e vettori di test anche nella RFC 6234. Differiscono per la dimensione del digest:

- **SHA-1** produce 160 bit (40 caratteri esadecimali). È ancora molto diffuso, ma la sua resistenza alle collisioni è compromessa, quindi non va usato dove un attaccante potrebbe costruire gli input; resta adatto ai checksum e alla verifica con sistemi legacy.
- **SHA-256** produce 256 bit (64 caratteri esadecimali) ed è la scelta standard di oggi.
- **SHA-384** produce 384 bit (96 caratteri esadecimali).
- **SHA-512** produce 512 bit (128 caratteri esadecimali).

## Esadecimale e Base64

Il digest è una sequenza di byte; esadecimale e Base64 sono solo due modi di scrivere quegli stessi byte. L’esadecimale usa due caratteri per byte ed è la forma comune nella maggior parte degli strumenti; Base64 è più compatto ed è ciò che compare in contesti come gli attributi di Subresource Integrity.

## File

Scegli un file con il selettore di file, o trascinalo in un punto qualsiasi dello strumento, e i quattro digest vengono calcolati sui byte del file esattamente come sono sul disco. Il tuo browser legge il file sul tuo dispositivo tramite la File API (`Blob.arrayBuffer()`) e passa i byte a Web Crypto. Nulla viene caricato: la vista dei file non fa alcuna richiesta di rete. Anche l’area di rilascio è un pulsante, quindi con la tastiera la raggiungi con Tab e apri il selettore di file con Invio o la Barra spaziatrice.

- **Cosa viene mostrato.** Il nome, la dimensione e il tipo del file compaiono come li riporta il browser. Il browser lascia vuoto il tipo quando non riesce a determinarlo, e il tipo non ha alcun ruolo nei digest: l’hash viene calcolato solo sui byte, quindi rinominare un file non cambia nessuno dei digest.
- **Un file è i suoi byte.** Un file di testo salvato con un byte order mark o con terminatori di riga Windows (CRLF) ha un hash diverso dalle stesse parole inserite nella casella di testo, perché quei byte fanno parte del file. `hi` inserito nella casella di testo e `hi` salvato con un byte order mark UTF-8 e CRLF (i sette byte `EF BB BF 68 69 0D 0A`) danno due digest SHA-256 diversi.
- **Il limite di dimensione: 256 MiB.** Il metodo `digest()` di Web Crypto riceve l’intero messaggio in una sola chiamata e comincia copiandolo; non esiste una forma in streaming. Calcolare così l’hash di un file significa quindi tenere in memoria ogni byte, più una seconda copia mentre viene calcolato ciascun digest. Lo strumento calcola l’hash di file fino a 256 MiB (268.435.456 byte), esegue i quattro algoritmi uno dopo l’altro in modo che esista una sola copia alla volta (un picco di circa il doppio del file) e rifiuta un file più grande con un messaggio prima di leggerne anche solo una parte. Il limite è una scelta prudente, non un numero fissato dalla piattaforma. Mentre lavora, una riga di stato indica l’algoritmo in esecuzione, ad esempio «SHA-384, 2 di 4».
- **File più grandi.** Usa il comando del tuo sistema operativo: `sha256sum` di GNU coreutils su Linux (e anche `sha1sum`, `sha384sum`, `sha512sum`), oppure `Get-FileHash` in PowerShell, il cui algoritmo predefinito è SHA-256.
- **Confronto con un checksum pubblicato.** I digest esadecimali non dipendono da maiuscole e minuscole: `Get-FileHash` stampa in maiuscolo e questo strumento in minuscolo, quindi confronta i caratteri e ignora le maiuscole. Dato un elenco di checksum pubblicati, `sha256sum --check` (`-c`) confronta per te ogni file che vi è indicato.
- **Un file vuoto.** Un file di zero byte ha i ben noti digest dell’input vuoto (SHA-256 `e3b0c442…7852b855`), e lo strumento lo dice. La documentazione di VirusTotal sottolinea che, se un file che sai non essere vuoto mostra questo digest, qualcosa ne ha impedito la lettura.
- **Quando la lettura non riesce.** Se il browser non riesce a leggere il file (perché è stato spostato, eliminato, modificato o bloccato da un altro programma dopo che l’hai scelto, i casi elencati dalla File API), lo strumento mostra il nome dell’errore del browser e ti chiede di scegliere di nuovo il file. Un file la cui dimensione cambia durante la lettura viene segnalato allo stesso modo. Nulla si interrompe in silenzio.

## Cercare un file su VirusTotal

Sotto i digest di un file c’è un link, **Cerca questo SHA-256 su VirusTotal**. Apre, in una nuova scheda, l’indirizzo che VirusTotal documenta per il report più recente su un file, `https://www.virustotal.com/gui/file/<SHA-256>/detection`, con lo SHA-256 del file al posto di `<SHA-256>`; gli altri tre digest non vengono mai inseriti in un link. Seguendo il link invii a VirusTotal l’hash, non il file. Lo strumento in sé non invia nulla; il link è un link normale che solo tu puoi scegliere di seguire, e non trasmette alcun referrer (`rel="noopener noreferrer"`), quindi a VirusTotal non viene detto da quale pagina arrivi. Ciò che VirusTotal mostra, e ciò che fa con la ricerca, è regolato dai suoi termini. VirusTotal documenta che il link porta al report su un file che ha analizzato: se non esiste un report, VirusTotal non ha visto quel file, il che non dice nulla sul fatto che il file sia sicuro.

## Confronto con un hash atteso

Sotto entrambe le viste c’è una casella, **Confronta con un hash atteso**. Incolla l’hash pubblicato in una pagina di download e lo strumento dice se è uguale a uno dei quattro digest che ha calcolato: quelli del file, se è stato calcolato l’hash di un file, altrimenti quelli del testo. Legge le forme usate da chi pubblica gli hash: esadecimale semplice, in maiuscolo o in minuscolo; esadecimale scritto a coppie di byte separate da spazi o da due punti; una riga come la stampa `sha256sum` (il checksum, uno spazio, uno spazio o un asterisco, il nome del file: quello che GNU Coreutils chiama formato untagged); una riga con tag come `SHA256 (file.iso) = …`; un valore con l’etichetta `sha256:` (la forma dei digest delle immagini OCI: l’algoritmo, i due punti, il valore codificato); e Base64, standard o URL-safe, con o senza padding, compreso un valore di Subresource Integrity come `sha384-…` (l’algoritmo, un trattino, il valore Base64). Quando il valore ha un’etichetta di algoritmo, viene confrontato solo quell’algoritmo, quindi un valore etichettato SHA-512 non corrisponde mai per caso a uno SHA-256. Una corrispondenza indica l’algoritmo e la codifica. Se non c’è corrispondenza, lo strumento dice se il valore ha almeno la lunghezza di uno dei quattro digest, il che di solito significa che i byte di cui qui è stato calcolato l’hash non sono quelli per cui l’hash è stato pubblicato, oppure che l’hash è stato copiato male. Un MD5, 32 caratteri esadecimali, non è nessuno dei quattro e non corrisponde mai. Nulla viene ricalcolato e nulla viene inviato: il confronto avviene tra stringhe già presenti nella pagina.

## Esempio svolto

- Lo SHA-256 di `abc` è `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`, il vettore di test standard della specifica SHA.
- Con `abc` inserito, incollare `sha256-ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=` nella casella di confronto dà una corrispondenza: lo SHA-256 del testo, in Base64.

## Come si usa

Inserisci o incolla un testo e leggi i quattro digest, oppure scegli o trascina un file e leggi i digest dei suoi byte. Poiché un hash è unidirezionale, questo strumento non può ritrasformare un digest nel suo input; recuperare un input è possibile solo quando aveva pochissima entropia, come dimostra lo strumento di [ricerca di preimmagini di hash](/tools/hash-preimage-finder).

## Condivisione dei risultati

La pagina ha due risposte, quindi ha due pulsanti **Condividi i risultati**, e un link non le mescola mai. Ciascuno crea un link a questa pagina solo quando lo premi; il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

- **Sotto i digest del testo.** Il link contiene dopo il `#` il testo così come l’hai inserito, l’algoritmo visualizzato quando non è SHA-256, e il contenuto della casella di confronto quando confronta con il testo. Il testo potrebbe essere una password, e un digest non la protegge: un hash veloce e senza salt di una password debole cede in pochi secondi, come mostra la [ricerca di preimmagini di hash](/tools/hash-preimage-finder). Per questo il riquadro a comparsa ti avverte di non inviare una password, una chiave o un token, e un testo in cui il controllo dei segreti del sito trova una credenziale non ottiene alcun link: una chiave privata, un’intestazione Authorization, un ID della chiave di accesso AWS, un JWT, una password in un URL, un valore `ENC` di FortiOS, o un valore assegnato a un nome che sembra un segreto. Il riquadro a comparsa indica cosa ha trovato e su quale riga; copia invece il digest.
- **Sotto i digest di un file.** Nessun byte del file, e nemmeno il suo nome, finisce mai in un link. Il link contiene il digest del file per l’algoritmo visualizzato, come valore della casella di confronto, così chi lo riceve sceglie lo stesso file e la casella dice se corrisponde, che è proprio lo scopo di un hash pubblicato.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi i valori non vengono inviati al server quando si apre il link; restano nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerli.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; un testo più lungo non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Un link di testo riempie la casella di testo e la pagina ne calcola l’hash; un link di file riempie la casella di confronto, con una nota che chiede il file, e attende: nulla viene letto dal disco finché non scegli un file. L’algoritmo e la casella di confronto assumono i valori del link. Un algoritmo che la pagina non offre, un valore di confronto su più di una riga, un link di file il cui valore non è un digest della lunghezza dell’algoritmo, o un testo che contiene una credenziale, fa ignorare l’intero link. In entrambi i casi i valori lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

- [W3C File API (Working Draft, 12 settembre 2026)](https://www.w3.org/TR/FileAPI/): [dimensione e tipo del Blob](https://www.w3.org/TR/FileAPI/#attributes-blob), [arrayBuffer()](https://www.w3.org/TR/FileAPI/#arraybuffer-method-algo), [l’interfaccia File](https://www.w3.org/TR/FileAPI/#file-section) ed [Errors and Exceptions](https://www.w3.org/TR/FileAPI/#ErrorAndException) (consultata il 27/10/2026)
- [W3C Web Cryptography Level 2, 14.3.5 The digest method](https://www.w3.org/TR/webcrypto/#SubtleCrypto-method-digest) e [32 SHA](https://www.w3.org/TR/webcrypto/#sha) (la bozza pubblicata; l’Editor’s Draft del 22 ottobre 2026 ha gli stessi passaggi) (consultata il 27/10/2026)
- [WHATWG HTML: lo stato File Upload (input type=file)](https://html.spec.whatwg.org/multipage/input.html#file-upload-state-(type=file)), [l’interfaccia DataTransfer](https://html.spec.whatwg.org/multipage/dnd.html#the-datatransfer-interface) e i tipi di link [noopener](https://html.spec.whatwg.org/multipage/links.html#link-type-noopener) e [noreferrer](https://html.spec.whatwg.org/multipage/links.html#link-type-noreferrer) (consultato il 27/10/2026)
- [VirusTotal: How can I link to the most recent report on a given file or URL?](https://docs.virustotal.com/docs/most-recent-report) e [Empty file and VirusTotal uploads](https://docs.virustotal.com/docs/empty-file) (consultate il 27/10/2026)
- [Manuale di GNU Coreutils: sha2 utilities](https://www.gnu.org/software/coreutils/manual/html_node/sha2-utilities.html) e [cksum common options (--check)](https://www.gnu.org/software/coreutils/manual/html_node/cksum-common-options.html) (il manuale di Coreutils 9.12, la release attuale; consultato il 27/10/2026)
- [Microsoft Learn: Get-FileHash](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash?view=powershell-7.6) (il riferimento per PowerShell 7.6, l’attuale release con assistenza a lungo termine; consultato il 27/10/2026)
- [W3C Subresource Integrity](https://www.w3.org/TR/sri/), 3.5 The integrity attribute (la grammatica `hash-expression = hash-algorithm "-" base64-value`) (consultata il 27/10/2026)
- [Manuale di GNU Coreutils: cksum output modes](https://www.gnu.org/software/coreutils/manual/html_node/cksum-output-modes.html) (i formati tagged e untagged; Coreutils 9.12; consultato il 27/10/2026)
- [OCI Image Format Specification: Descriptor](https://github.com/opencontainers/image-spec/blob/main/descriptor.md), sezione Digests (`digest ::= algorithm ":" encoded`) (consultata il 27/10/2026)
- [RFC 6234: US Secure Hash Algorithms](https://www.rfc-editor.org/rfc/rfc6234) (i suoi messaggi di test sono tra i vettori sui file dello strumento; consultata il 27/10/2026)
- [RFC 3986: Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.5 Fragment (consultata il 01/11/2026)
