## Cosa fa

Inserisci un testo e una passphrase, premi Cifra e ottieni un’unica stringa che inizia con `aesgcm1.`. Incolla di nuovo quella stringa in modalità Decifra, inserisci la stessa passphrase e ritrovi il testo, esattamente com’era. Tutto avviene nel tuo browser tramite la sua Web Cryptography API: il testo e la passphrase non vengono mai inviati, mai memorizzati e mai inseriti nell’indirizzo.

Serve per il tuo testo e la tua passphrase: una nota che vuoi conservare in un file o in una conversazione senza lasciarla leggibile, o un segreto che vuoi consegnare in due parti (la stringa per una via, la passphrase per un’altra). Apre solo ciò che è stato sigillato con una passphrase che possiedi. Non indovina, non forza e non recupera nient’altro, e una passphrase sbagliata non restituisce nulla.

## Come funziona

Ogni passaggio è una primitiva della [Web Cryptography API](https://www.w3.org/TR/WebCryptoAPI/), l’implementazione del browser stesso; nella pagina non è scritto alcun codice crittografico.

1. **La passphrase viene preparata.** Ogni spazio non ASCII (categoria Unicode Zs, come lo spazio indivisibile) diventa uno spazio normale, poi viene applicata la Unicode Normalization Form C: sono le due regole di conversione (mapping rules) del profilo OpaqueString della [RFC 8265](https://www.rfc-editor.org/rfc/rfc8265) (sezione 4.2.2, regole 2 e 4). Una «ç» inserita come un solo carattere e una «ç» incollata come «c» più una cediglia combinante danno così la stessa chiave. Nient’altro viene modificato: maiuscole e minuscole restano, e nessun carattere viene rifiutato tranne un surrogato non accoppiato, che UTF-8 non può rappresentare. Il risultato viene codificato in UTF-8 ([RFC 3629](https://www.rfc-editor.org/rfc/rfc3629)).
2. **Viene derivata una chiave.** PBKDF2 (Password-Based Key Derivation Function 2, [RFC 8018](https://www.rfc-editor.org/rfc/rfc8018), sezione 5.2), con HMAC-SHA-256 come funzione pseudocasuale, trasforma la passphrase, un salt casuale di 16 byte e 600.000 iterazioni in una chiave a 256 bit per AES (Advanced Encryption Standard).
3. **Il testo viene sigillato.** AES in modalità GCM (Galois/Counter Mode, [NIST SP 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)) cifra il testo, in UTF-8, con quella chiave e con un vettore di inizializzazione (IV) casuale di 12 byte, e produce un tag di autenticazione a 128 bit. I primi quattro campi della stringa vengono passati a GCM come dati autenticati aggiuntivi (additional authenticated data), quindi il tag copre anche quelli.
4. **Viene scritta un’unica stringa.** Il tag di versione, il numero di iterazioni, il salt, l’IV e il testo cifrato con il suo tag, uniti da punti.

La decifratura inverte il processo: legge i campi, prepara la passphrase allo stesso modo, deriva la stessa chiave dal salt e dal numero di iterazioni contenuti nella stringa e lascia che AES-GCM verifichi il tag prima di restituire qualsiasi cosa. È la forma che la RFC 8018 chiama PBES2 (sezione 6.2): una chiave da PBKDF2, poi uno schema di cifratura. Il formato della stringa che la racchiude è proprio di questo strumento, ed è descritto più sotto perché chiunque possa reimplementarlo.

Il salt e l’IV vengono generati dalla pagina con `crypto.getRandomValues`, che secondo la definizione della Web Cryptography API riempie un array di byte casuali crittograficamente sicuri («cryptographically secure random bytes», sezione 10.1.1). Il motore, invece, li riceve come input e non genera nulla, ed è per questo che può essere verificato byte per byte con un salt e un IV fissi. È anche il motivo per cui cifrare due volte lo stesso testo con la stessa passphrase produce due stringhe diverse, ed entrambe si decifrano.

## La stringa

```
aesgcm1.600000.AAECAwQFBgcICQoLDA0ODw.EBESExQVFhcYGRob.3lWZqiea5CBm...
```

| Campo | Contenuto | Codifica |
|---|---|---|
| 1 | `aesgcm1`: questa costruzione, versione 1 del formato | ASCII |
| 2 | Il numero di iterazioni PBKDF2 | Decimale, senza segno, senza zero iniziale, da 1000 a 10.000.000 |
| 3 | Il salt, 16 byte | base64url senza padding, 22 caratteri |
| 4 | L’IV, 12 byte | base64url senza padding, 16 caratteri |
| 5 | Il testo cifrato seguito dal tag di 16 byte | base64url senza padding |

- **base64url** è l’alfabeto sicuro per URL e nomi di file della [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648) (sezione 5): da A a Z, da a a z, da 0 a 9, `-` e `_`. Il padding `=` viene omesso, cosa che la sezione 3.2 consente quando la specifica lo prevede: qui il campo termina al punto successivo. La decodifica è rigorosa: qualsiasi altro carattere, una lunghezza che non può codificare byte interi o un ultimo carattere i cui bit inutilizzati non sono zero vengono rifiutati (la sezione 3.5 consente a un decodificatore di rifiutare una codifica non canonica). Il punto non fa parte di quell’alfabeto, quindi un campo non può mai contenerne uno.
- **I dati autenticati aggiuntivi** sono il testo dei campi da 1 a 4 con i loro tre punti, esattamente come sono scritti. Se cambi la versione, il numero di iterazioni, il salt o l’IV, il tag non viene più verificato, anche quando il resto della stringa è intatto.
- **Spazi bianchi** (spazi, tabulazioni, a capo) in qualsiasi punto di una stringa incollata vengono rimossi prima della lettura, perché i client di posta spezzano le righe lunghe; il risultato indica quando è successo.
- **Lunghezza.** Il testo cifrato è lungo quanto il testo in UTF-8, più il tag di 16 byte. La lunghezza della stringa mostra quindi all’incirca quanto è lungo il testo.

## Perché questi numeri

- **600.000 iterazioni.** Il [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) di OWASP indica «PBKDF2-HMAC-SHA256: 600,000 iterations (recommended)» (consultato il 27/10/2026). Ogni iterazione è un calcolo HMAC in più per chiunque provi passphrase contro la tua stringa, e per te una volta per ogni cifratura o decifratura: aspettati che il pulsante impieghi un momento.
- **Da 1000 a 10.000.000 in decifratura.** Il numero di iterazioni è nella stringa, quindi la decifratura lo segue, entro l’intervallo che il [NIST SP 800-132](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) stabilisce (sezione 5.2): «A minimum iteration count of 1,000 is recommended» e, per le chiavi particolarmente critiche, «an iteration count of 10,000,000 may be appropriate». La RFC 8018 riporta lo stesso testo (sezione 4.2). Il tetto impedisce anche che una stringa costruita ad arte costringa la pagina a derivare una chiave per minuti.
- **Un salt di 16 byte.** SP 800-132, sezione 5.1: «The length of the randomly-generated portion of the salt shall be at least 128 bits.» La RFC 8018 (sezione 3) osserva che il salt e il numero di iterazioni non devono essere tenuti segreti («need not be kept secret»); viaggiano nella stringa.
- **Un IV di 12 byte, generato a caso.** Lo SP 800-38D raccomanda di limitare gli IV a 96 bit «to promote interoperability, efficiency, and simplicity of design» (sezione 5.2.1.1). La sua regola centrale è che lo stesso IV non deve essere usato due volte con la stessa chiave (sezione 8, con una probabilità «no greater than 2^-32»), e quando gli IV sono casuali limita a 2^32 il numero di cifrature con una stessa chiave (sezione 8.3). Qui ogni cifratura ha un nuovo salt casuale, quindi una nuova chiave, oltre a un nuovo IV casuale.
- **Un tag a 128 bit**, il più lungo che GCM consente (sezione 5.2.1.2) e il valore predefinito della Web Cryptography API.
- **AES-256.** PBKDF2 deriva 32 byte, importati come chiave AES-GCM che non può essere esportata dall’oggetto chiave del browser.

## Cosa protegge e cosa no

**Protegge** il contenuto del testo finché si trova nella stringa, da chiunque abbia la stringa ma non la passphrase, e rileva qualsiasi modifica alla stringa: AES-GCM restituisce o il testo intero o l’unica risposta FAIL (SP 800-38D, sezione 7.2), e la pagina mostra FAIL come «Passphrase sbagliata o testo alterato», senza nient’altro. Non c’è un risultato parziale da leggere.

**Non protegge:**

- **Una passphrase debole.** Chiunque abbia la stringa può provare passphrase sul proprio hardware, tutte le volte e alla velocità che vuole; la pagina non è coinvolta e non può rallentarlo. La RFC 8018 lo dice chiaramente: la crittografia basata su password «is generally limited in the security that it can provide», in particolare «where offline password search is possible» (sezione 8). Il numero di iterazioni moltiplica il costo di ogni tentativo; non impedisce a chi tenta di arrivare a una passphrase che si trova all’inizio della sua lista. Lo SP 800-132 (appendice A.1) aggiunge che queste ricerche sono parallelizzabili e possono girare su un sistema «much more powerful» del tuo.
- **Da chi conosce la passphrase.** Chi ha sia la stringa sia la passphrase legge il testo. Inviale separatamente, e mai nello stesso messaggio.
- **Su un dispositivo di cui non puoi fidarti.** Un malware o un keylogger vede ciò che digiti prima che qualsiasi cosa venga cifrata; il NIST osserva che la registrazione dei tasti premuti è «equally effective on lengthy and complex passwords as they are on simple ones» ([SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), appendice A). Le considerazioni di sicurezza della Web Cryptography API stessa dicono che uno script iniettato in una pagina «may allow for the exfiltration of keys or data» e che i browser non sono tenuti a cancellare il materiale delle chiavi dalla memoria o dallo storage (sezione 6.2).
- **La lunghezza.** La stringa mostra all’incirca quanto è lungo il testo.
- **Ciò che accade dopo la decifratura.** Il testo viene mostrato nella pagina. Copiarlo lo mette negli appunti di sistema, dove altri programmi possono leggerlo.

## La nota sulla passphrase

Mentre inserisci una passphrase in modalità Cifra, la pagina ne mostra la lunghezza in caratteri e in byte UTF-8 e quali tipi di carattere contiene (lettere minuscole e maiuscole, lettere senza maiuscole e minuscole, cifre, spazi, punteggiatura o simboli). Indica anche quando la passphrase inizia o termina con spazi bianchi, e quando la preparazione la modifica. Non calcola **alcun punteggio di robustezza**, di proposito:

- Chi tenta di indovinare non prova passphrase a caso; prova prima quelle probabili (parole, nomi, date, citazioni, password di fughe di dati precedenti). La pagina non può sapere dove si trova la tua in una lista del genere, quindi un numero sarebbe inventato.
- Il NIST considera la lunghezza «a primary factor in characterizing password strength» e rileva che le regole di composizione (obbligo di cifre, maiuscole e simboli) aggiungono meno del previsto, perché le persone le soddisfano in modo prevedibile: «password» diventa «Password1!» (SP 800-63B-4, appendice A). Dice anche che resistere agli attacchi offline richiede password «orders of magnitude more complex» rispetto a resistere ai tentativi online.
- Lo SP 800-132 (appendice A.1) dice che le password più corte di 10 caratteri sono di solito considerate deboli, e così le passphrase più corte di 20 caratteri. La stessa appendice sconsiglia sequenze di numeri o di lettere e informazioni personali come un nome, un numero di telefono o una data di nascita.

La modalità Cifra chiede la passphrase due volte e resta disattivata finché le due non coincidono: un testo cifrato con una passphrase digitata male non può essere recuperato da nessuno.

## Nulla lascia la pagina

- **Nessuna richiesta.** Cifratura e decifratura sono chiamate alla Web Cryptography API del browser. Nulla viene inviato a questo sito né altrove.
- **Nessuna memorizzazione.** Il testo, la passphrase e i risultati esistono solo nella memoria della pagina finché è aperta; Cancella svuota ogni campo. Nulla viene scritto nel local storage, nei cookie o in qualsiasi altro archivio.
- **Nulla nell’indirizzo.** La pagina non scrive nulla nel proprio indirizzo. Un link viene creato solo quando premi Condividi i risultati, e contiene soltanto la stringa cifrata (sezione successiva).
- **Il controllo ortografico è disattivato** nei campi (l’attributo HTML `spellcheck="false"`). Il [Controllo ortografico avanzato](https://support.google.com/chrome/answer/12027911?hl=en) di Chrome invia a Google il testo che inserisci nel browser («sends the text you enter in your browser to Google»); l’[HTML Standard](https://html.spec.whatwg.org/multipage/interaction.html) (sezione 6.8.5) consente a un’impostazione dell’utente di prevalere sull’attributo, quindi se hai forzato il controllo ortografico ovunque, disattivalo prima di digitare dei segreti. I campi della passphrase sono campi password, che non rientrano tra quelli che secondo lo Standard i browser dovrebbero controllare (gli input di testo, ricerca, URL ed e-mail e le aree di testo), finché non scegli Mostra.
- **Nessun modulo.** I campi non si trovano all’interno di un modulo e non hanno un nome, quindi nulla può inviarli.
- **La Web Cryptography API richiede un contesto sicuro.** La sua interfaccia `subtle` esiste solo nelle pagine servite in modo sicuro (la specifica la contrassegna con `[SecureContext]`); senza di essa la pagina lo dice e non fa nulla.

## Condivisione dei risultati

Sotto la stringa cifrata (e, in modalità Decifra, sotto il pulsante Decifra) un pulsante **Condividi i risultati** crea un link a questa pagina che contiene la stringa cifrata e nient’altro: mai la passphrase, mai il testo. Crea il link solo quando lo premi, indica prima cosa contiene il link e poi offre Copia link e, se il browser ne ha uno, il menu di condivisione. L’indirizzo della pagina non cambia.

- **Dove finisce la stringa.** Dopo il `#`: `/tools/text-encryption#input=aesgcm1...`. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi un browser non lo invia al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link ha la stringa. Per questo la passphrase deve viaggiare per un’altra via.
- **Lunghezza massima.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`. A 600.000 iterazioni corrisponde a un testo fino a 12.230 byte in UTF-8; una stringa più lunga non ottiene il link, e il riquadro a comparsa lo indica: in quel caso copia la stringa.
- **Apertura di un link.** La pagina si apre in modalità Decifra con la stringa già inserita, indica che proviene da un link e cancella qualsiasi passphrase avessi inserito. Decifra solo quando inserisci la passphrase e premi Decifra. Un valore che non è una stringa ben formata in questo formato viene ignorato. In entrambi i casi la pagina rimuove subito il valore dal proprio indirizzo (senza alcuna richiesta), quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla.
- **Prova.** Per ogni vettore di test di riferimento di andata e ritorno e per l’Esempio, i controlli di condivisione del sito creano il link e confermano che né la passphrase né il testo vi compaiono, né così come sono stati inseriti, né con codifica percentuale, né con codifica da modulo, né decodificati.

## Codici di errore

| Codice | Significato |
|---|---|
| `empty-text` | Cifra: non c’è testo |
| `text-too-large` | Il testo supera 1.048.576 byte (1 MiB) in UTF-8, il limite della pagina (GCM di per sé consente fino a 2^39 - 256 bit) |
| `lone-surrogate` | Il testo o la passphrase contengono un surrogato non accoppiato, che UTF-8 non può rappresentare |
| `empty-passphrase` | Nessuna passphrase |
| `passphrase-too-long` | Più di 1024 caratteri dopo la preparazione |
| `bad-salt-length` | Un salt che non è di 16 byte |
| `bad-iv-length` | Un IV che non è di 12 byte |
| `iterations-out-of-range` | Un numero di iterazioni fuori dall’intervallo da 1000 a 10.000.000 |
| `empty-input` | Decifra: solo spazi bianchi |
| `input-too-large` | Decifra: più di 2.000.000 caratteri |
| `bad-format` | Non sono cinque campi separati da punti |
| `unknown-version` | Un primo campo diverso da `aesgcm1` (il tag distingue maiuscole e minuscole) |
| `bad-iterations` | Un secondo campo che non è un intero decimale senza zero iniziale |
| `bad-encoding` | Un campo salt, IV o testo cifrato che non è base64url canonico senza padding |
| `too-short` | Un campo del testo cifrato più corto del tag di 16 byte |
| `auth-failed` | Il tag non è stato verificato: passphrase sbagliata, o stringa alterata dopo essere stata creata |
| `not-utf8` | Il tag è stato verificato ma il contenuto non è testo UTF-8 (questo strumento non scrive mai una stringa del genere) |
| `no-crypto` | La pagina non dispone della Web Cryptography API |
| `crypto-error` | La Web Cryptography API ha rifiutato per un altro motivo |

La pagina legge una stringa incollata nel momento in cui la incolli e ne mostra il formato, il numero di iterazioni e le dimensioni, o il motivo per cui non può essere letta, prima che tu inserisca la passphrase.

## Esempi svolti

- **Il pulsante Esempio, in modalità Cifra**, inserisce il testo «Lab notes: the core switch maintenance window moves to Saturday 02:00 (São Paulo).» e la passphrase `Password` in entrambi i campi. `Password` è la password di prova della RFC 7914, sezione 11, che chiunque può leggere; la pagina la segnala come passphrase dell’Esempio ogni volta che si trova nel campo. Non usarla mai per un testo reale. Premi Cifra e ottieni una stringa di 187 caratteri (83 byte di testo, 99 byte una volta sigillato), diversa ogni volta.
- **Il pulsante Esempio, in modalità Decifra**, inserisce la stringa fissata dal vettore di test di riferimento «example»: `aesgcm1.600000.AAECAwQFBgcICQoLDA0ODw.EBESExQVFhcYGRob.3lWZ...` (la stringa completa è nella pagina). È stata creata con un salt fisso (byte da 00 a 0f) e un IV fisso (byte da 10 a 1b), che la pagina stessa non usa mai. Con `Password` si decifra nel testo indicato sopra; con `password` dà `auth-failed`.
- **Modifica di un carattere.** Modifica un carattere qualsiasi del testo cifrato, del salt, dell’IV o del numero di iterazioni di una stringa valida e la decifratura dà `auth-failed`, mai un testo alterato.
- **La stessa passphrase, digitata in modo diverso.** «coração de exemplo» digitata con caratteri composti, con caratteri scomposti o con uno spazio indivisibile tra le parole deriva la stessa chiave, quindi tutte e tre le varianti decifrano la stessa stringa.

## Provenienza

Il motore è un insieme di funzioni pure attorno alla Web Cryptography API: dati lo stesso testo, la stessa passphrase, lo stesso salt, lo stesso IV e lo stesso numero di iterazioni, scrive sempre la stessa stringa. Include vettori di test di riferimento (golden vectors, insieme `text-encryption-golden-2026-10-27`, 207 controlli):

- **Risposte note per le primitive**: i due vettori PBKDF2-HMAC-SHA-256 della [RFC 7914](https://www.rfc-editor.org/rfc/rfc7914), sezione 11; sette vettori di cifratura AES-GCM dal file `gcmEncryptExtIV256.rsp` del Cryptographic Algorithm Validation Program del NIST (AES-256, IV a 96 bit, tag a 128 bit; testi in chiaro da 0 a 408 bit, dati aggiuntivi da 0 a 720 bit), ciascuno anche decifrato di nuovo; e due vettori di decifratura da `gcmDecrypt256.rsp`, uno dei quali il file contrassegna come FAIL e il motore rifiuta.
- **La codifica**: le stringhe della RFC 4648, sezione 10, e sette stringhe che il decodificatore rigoroso deve rifiutare.
- **Andata e ritorno** con salt e IV fissi (l’Esempio a 600.000 iterazioni; ASCII, portoghese con a capo e una tabulazione, caratteri fuori dal Basic Multilingual Plane, un byte order mark iniziale; tre grafie di una stessa passphrase), ciascuno verificato in entrambe le direzioni. Ogni stringa attesa è stata prima calcolata da uno script Python separato (hashlib e il pacchetto cryptography) a partire dal formato così come è descritto qui, non dal motore.
- **Rifiuti**: 35 rifiuti in decifratura (ogni errore di formato, i limiti delle iterazioni, passphrase sbagliate, un testo cifrato, un tag, un IV, un salt e un numero di iterazioni modificati, il testo cifrato di un’altra stringa e byte autentici che non sono UTF-8) e 11 rifiuti in cifratura, ciascuno con il suo codice, e un controllo che nessun rifiuto contenga alcun testo.
- **Condividi i risultati**: 5 stringhe che un link può contenere (compatte, con gli spazi bianchi rimossi) e 9 testi che non può contenere (un testo in chiaro, una passphrase, stringhe troncate, un’altra versione, numeri di iterazioni fuori intervallo, codifiche errate, una passphrase aggiunta come sesto campo).

## API

Nessuna, di proposito. L’API HTTP del sito esegue gli strumenti su un server; questo strumento dovrebbe ricevere lì una passphrase o un testo in chiaro, che è esattamente ciò che esiste per non fare. È elencato tra gli strumenti esclusi dall’API, con questa motivazione.

## Fonti

- [NIST SP 800-38D, Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC, novembre 2007](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf) (consultata il 27/10/2026): sezioni 5.2.1, 7.1, 7.2, 8, 8.2.2 e 8.3. La sua [pagina CSRC](https://csrc.nist.gov/pubs/sp/800/38/d/final) (consultata il 27/10/2026) riporta una nota di pianificazione del 6 marzo 2024: il NIST ha deciso di rivederla.
- [NIST CAVP, GCM test vectors (gcmtestvectors.zip)](https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/documents/mac/gcmtestvectors.zip) (consultati il 27/10/2026): `gcmEncryptExtIV256.rsp` e `gcmDecrypt256.rsp`, CAVS 14.0
- [RFC 8018, PKCS #5: Password-Based Cryptography Specification Version 2.1](https://www.rfc-editor.org/rfc/rfc8018) (consultata il 27/10/2026): sezioni 3, 4.1, 4.2, 5.2, 6.2 e 8; i suoi quattro errata verificati riguardano solo le appendici ASN.1, e la RFC 9579 e la RFC 9879 la aggiornano solo per PKCS #12
- [RFC 7914, The scrypt Password-Based Key Derivation Function](https://www.rfc-editor.org/rfc/rfc7914) (consultata il 27/10/2026): sezione 11, i vettori di test PBKDF2-HMAC-SHA-256
- [OWASP Cheat Sheet Series, Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) (consultato il 27/10/2026): PBKDF2, 600.000 iterazioni per PBKDF2-HMAC-SHA256
- [NIST SP 800-132, Recommendation for Password-Based Key Derivation, Part 1: Storage Applications, dicembre 2010](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) (consultata il 27/10/2026): sezioni 5.1 e 5.2, appendice A. La sua [pagina CSRC](https://csrc.nist.gov/pubs/sp/800/132/final) riporta una nota di pianificazione dell’11 maggio 2023: il NIST prevede di rivederla.
- [W3C, Web Cryptography API, Recommendation del 26 gennaio 2017](https://www.w3.org/TR/2017/REC-WebCryptoAPI-20170126/), e [Web Cryptography Level 2, First Public Working Draft del 22 aprile 2025](https://www.w3.org/TR/WebCryptoAPI/), ora pubblicata all’indirizzo dell’API (entrambe consultate il 27/10/2026): getRandomValues, AES-GCM, PBKDF2, la regola del contesto sicuro e le considerazioni di sicurezza
- [RFC 4648, The Base16, Base32, and Base64 Data Encodings](https://www.rfc-editor.org/rfc/rfc4648) (consultata il 27/10/2026): sezioni 3.2, 3.5, 5 e 10
- [RFC 8265, Preparation, Enforcement, and Comparison of Internationalized Strings Representing Usernames and Passwords](https://www.rfc-editor.org/rfc/rfc8265) (consultata il 27/10/2026): sezione 4.2.2
- [RFC 3629, UTF-8, a transformation format of ISO 10646](https://www.rfc-editor.org/rfc/rfc3629) (consultata il 27/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento
- [NIST SP 800-63B-4, Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html) (consultata il 27/10/2026): appendice A, Strength of Passwords
- [Guida di Google Chrome, Turn Chrome spell check on and off](https://support.google.com/chrome/answer/12027911?hl=en) (consultata il 27/10/2026), e l’[HTML Standard, sezione 6.8.5, Spelling and grammar checking](https://html.spec.whatwg.org/multipage/interaction.html) (consultato il 27/10/2026)
