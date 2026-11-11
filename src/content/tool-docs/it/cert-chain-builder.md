## Cosa fa

Prende un numero qualsiasi di certificati X.509 in formato PEM, in qualsiasi ordine, e fa ciò che fa il costruttore di percorsi di un client TLS prima di verificare una sola firma: trova l’entità finale, segue ogni certificato fino al suo emittente e riporta la catena che un server dovrebbe inviare, i certificati mancanti, quelli in più e ogni regola strutturale della validazione del percorso della RFC 5280 che la catena viola. Poi la pagina verifica la firma di ogni collegamento nel tuo browser con WebCrypto e lo segnala a parte, perché il risultato strutturale è lo stesso su ogni macchina, mentre la verifica delle firme dipende da ciò che il browser sa fare.

Incolla la foglia, gli intermedi, la radice se ce l’hai, una vecchia firma incrociata di cui non sei sicuro, l’intermedio due volte per sbaglio; la pagina mette ordine e dice che cosa ha fatto con ciascuno.

## Come viene costruita la catena

- **L’entità finale** è il certificato che nessun altro certificato dell’input emette e il cui basicConstraints non dichiara cA. Se ce ne sono diversi viene usato il primo e gli altri vengono segnalati; se non ce n’è nessuno (un bundle di intermedi da solo) viene usata la CA più in alto e la pagina lo segnala.
- **Ogni collegamento** si crea tramite Authority Key Identifier e Subject Key Identifier quando entrambi i certificati ne hanno uno (RFC 5280, sezione 4.2.1.1: l’identificatore di chiave esiste per facilitare la costruzione del percorso di certificazione, «to facilitate certification path construction»), e tramite nome dell’emittente e nome del soggetto quando uno dei due non lo ha. Un certificato con il nome giusto ma una chiave diversa non è un emittente; viene segnalato come una CA che ha cambiato chiave, e il vero emittente come mancante.
- **Più emittenti possibili** (una CA con firma incrociata, o due certificati per la stessa chiave) si risolvono a favore di quello la cui validità copre l’inizio della validità del soggetto, e le alternative vengono elencate come certificati in più.
- **Il percorso termina** a un certificato autofirmato (soggetto uguale all’emittente, con identificatori di chiave che non lo contraddicono) oppure quando l’emittente successivo non è nell’input. Nel secondo caso viene indicato l’emittente mancante, con l’identificatore di chiave che il soggetto si aspetta e l’URL caIssuers contenuto nel certificato, se presente. La pagina non lo scarica.

## Le regole che verifica

Lungo il percorso, dall’alto verso il basso, i controlli della RFC 5280, sezione 6.1.4, che non richiedono crittografia:

- **(k) basicConstraints.** Un emittente versione 3 deve avere l’estensione con cA TRUE. Se il booleano cA non è dichiarato, il bit keyCertSign dell’estensione key usage NON DEVE essere dichiarato («If the cA boolean is not asserted, then the keyCertSign bit in the key usage extension MUST NOT be asserted») e la chiave NON DEVE essere usata per verificare firme di certificati («MUST NOT be used to verify certificate signatures», sezione 4.2.1.9).
- **(n) keyUsage.** Quando l’estensione è presente su un emittente, keyCertSign deve essere impostato.
- **(l) e (m) pathLenConstraint.** Il valore indica il numero massimo di certificati intermedi non autoemessi che possono seguire questo certificato in un percorso di certificazione valido («gives the maximum number of non-self-issued intermediate certificates that may follow this certificate in a valid certification path»); l’entità finale non rientra in questo limite («is not included in this limit»), e zero significa che non può seguire alcun intermedio. La pagina conta dall’alto del percorso verso il basso, saltando i certificati autoemessi, e indica la CA il cui limite è stato esaurito. Una radice autofirmata in cima è il trust anchor, che non fa parte del potenziale percorso di certificazione («not included as part of the prospective certification path», sezione 6.1); il suo vincolo serve solo come limite iniziale.
- **Validità in un istante.** Ogni certificato del percorso viene valutato nell’istante scelto, per impostazione predefinita quello del tuo orologio oppure una data che imposti, e segnalato come scaduto o non ancora valido. Un emittente che scade prima del certificato che ha emesso genera un avviso con la data, perché da quel giorno la catena non supera più la validazione, qualunque cosa dica la foglia.
- **Algoritmi.** Una firma con SHA-1 o MD5 in un punto qualsiasi tranne che su una radice autofirmata (la cui firma nessun validatore verifica) viene segnalata in base ai Baseline Requirements del CA/Browser Forum, che hanno eliminato l’ultimo uso di SHA-1 nei certificati il 15 settembre 2026; una chiave RSA sotto i 2048 bit viene segnalata in base alla sezione 6.1.5 dello stesso documento.
- **L’entità finale.** Un certificato server senza subjectAltName viene segnalato, perché i browser confrontano il nome host solo con quell’estensione.

## I verdetti

- **Catena completa**: il percorso va dall’entità finale a un certificato autofirmato, con ogni collegamento creato e nessuna regola violata. Completa qui significa strutturalmente completa; se la radice sia attendibile è una questione che riguarda il trust store del client.
- **Catena completa, con avvisi**: come sopra, con qualcosa che vale la pena leggere prima.
- **La catena termina con una CA il cui emittente non è presente**: il percorso è corretto fin dove arriva e si ferma a un intermedio il cui emittente non è stato incollato. È la forma normale di una catena TLS, perché un certificato che indica un trust anchor PUÒ essere omesso dalla catena, purché si sappia che i peer supportati possiedono i certificati omessi («a certificate that specifies a trust anchor MAY be omitted from the chain, provided that supported peers are known to possess any omitted certificates», RFC 9846, sezione 4.5.1; sezione 4.4.2 nella RFC 8446, che ha reso obsoleta nel luglio 2026). Se l’emittente mancante è nei trust store dei tuoi client, non manca nulla; se è a sua volta un intermedio, aggiungilo.
- **Catena incompleta**: il percorso si ferma all’entità finale. Nessun client può costruire una catena con ciò che c’è qui; aggiungi gli intermedi.
- **Catena non valida**: una delle regole sopra è violata. Un client conforme rifiuta la catena.

## La catena da configurare

La pagina ricodifica i certificati del percorso a partire dai loro byte, in base64 a 64 colonne, nell’ordine richiesto dalla RFC 9846, sezione 4.5.1: prima il certificato del mittente, poi ogni certificato che certifica direttamente quello che lo precede («The sender's certificate MUST come in the first CertificateEntry in the list. Each following certificate SHOULD directly certify the one immediately preceding it.»). La radice si può includere o escludere; di solito i server la escludono. Dove va il file dipende dal server:

- **nginx**: un solo file, in cui il certificato del server deve precedere i certificati della catena («the server certificate must appear before the chained certificates in the combined file»); l’ordine sbagliato fa fallire l’avvio con un errore key values mismatch, perché nginx prova la chiave privata con il primo certificato che trova.
- **Apache httpd 2.4.8 e successivi**: `SSLCertificateFile` può contenere anche i certificati delle CA intermedie, ordinati dalla foglia alla radice («may also include intermediate CA certificates, sorted from leaf to root»), il che rende obsoleto SSLCertificateChainFile («obsoletes SSLCertificateChainFile»).
- **F5 BIG-IP**: gli intermedi vengono importati come oggetto certificato a sé (incollati uno dopo l’altro senza spazi in mezzo, «in sequence with no space between») e selezionati come Chain del certificato e della chiave nel profilo Client SSL o Server SSL; la foglia resta nel proprio oggetto. L’articolo di F5 aggiunge che inserire il certificato della CA radice nel bundle è facoltativo e non porterà mai il client a considerare attendibile la CA radice («putting the root CA certificate in the certificate bundle is optional, and will never cause the client to trust the root CA»).

## Cosa verifica la pagina con la crittografia, e cosa no

La firma di ogni collegamento viene verificata nel browser con la chiave pubblica dell’emittente mostrata nella tabella: RSASSA-PKCS1-v1_5 e RSASSA-PSS con SHA-1, SHA-256, SHA-384 o SHA-512, ECDSA su P-256, P-384 e P-521, ed Ed25519 dove il browser lo supporta. Una radice autofirmata viene verificata con la propria chiave, il che dimostra che il certificato è coerente, non che qualcuno lo consideri attendibile. Tutto ciò che il browser non sa fare risulta non verificato, mai fallito.

Non viene fatto, e lo fa un validatore: consultare un trust store, confrontare il nome host con subjectAltName, valutare lungo il percorso i name constraints, i policy constraints e l’extended key usage, e verificare la revoca. I riferimenti CRL (certificate revocation list, lista di revoca dei certificati) e OCSP (Online Certificate Status Protocol) presenti nel percorso vengono elencati; nessuno viene contattato.

Per vedere che cosa ha concluso un validatore sulla catena che un server invia davvero, esegui `openssl s_client -showcerts` verso il server e incollane l’output nell’[analizzatore di openssl s_client](/tools/openssl-s-client-explainer): i blocchi PEM sono la catena così come è stata inviata, che questa pagina può poi ordinare, e il Verify return code è il verdetto di OpenSSL su di essa.

## Condivisione dei risultati

Sotto il verdetto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` i certificati così come li hai incollati e, se ne hai impostata una, la data di Valuta la validità alla data del: `/tools/cert-chain-builder#certs=...&asof=2026-10-04`. Senza data la pagina valuta in base al proprio orologio, quindi un link aperto più tardi valuta in base all’orologio di chi lo apre. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi i certificati non vengono inviati al server quando si apre il link; restano nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerli.

- **Una chiave privata non viene mai inclusa.** Un file PEM combinato (la catena completa e la sua chiave, come lo caricano alcuni server) contiene una chiave che il generatore ignora. Quando la casella contiene un blocco `-----BEGIN ... PRIVATE KEY-----`, il link non viene offerto e il riquadro a comparsa chiede di rimuovere prima la chiave.
- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** I certificati compilano la casella come farebbe un testo incollato e la data viene impostata; la pagina costruisce il percorso e verifica le firme nel browser, come per un testo incollato. Una data che non è un giorno reale nel formato AAAA-MM-GG fa ignorare l’intero link. In ogni caso i valori lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
- **Link da altre pagine.** Un valore passato come `#input=` compila ancora la casella esattamente come prima; Condividi i risultati usa nomi propri (`certs`, `asof`), quindi le due forme non si mescolano mai.

## Limiti

- Fino a 32 blocchi di certificati e 262.144 caratteri di input; solo PEM (un file DER si converte con `openssl x509 -inform der -outform pem`).
- I nomi vengono confrontati come i distinguished name su una riga stampati dal decodificatore, un confronto più rigido di quello della RFC 5280, sezione 7.1, in alcuni casi limite di tipo di stringa e di maiuscole e minuscole; una catena che si collega solo secondo quelle regole viene segnalata come non collegata.
- L’istante è una data alle 00:00 UTC quando ne imposti una, e il tuo orologio al secondo quando non lo fai.
- I browser si comportano diversamente con un intermedio mancante: alcuni lo scaricano al momento dall’URL caIssuers, mentre Firefox precarica gli intermedi dal database delle CA di Mozilla (da Firefox 75) e non scarica nulla. Una catena che funziona in un browser e non in un altro di solito si spiega così.

## Fonti

- [RFC 5280: Internet X.509 Public Key Infrastructure Certificate and CRL Profile](https://www.rfc-editor.org/rfc/rfc5280) (consultata il 04/10/2026): sezioni 4.2.1.1, 4.2.1.2, 4.2.1.3, 4.2.1.9, 6.1 e 6.1.4
- [RFC 9846: The Transport Layer Security (TLS) Protocol Version 1.3, luglio 2026, sezione 4.5.1, lo stesso testo della sezione 4.4.2 della RFC 8446, che rende obsoleta](https://www.rfc-editor.org/rfc/rfc9846.html#section-4.5.1) (consultata il 26/10/2026)
- [CA/Browser Forum: Baseline Requirements for TLS Server Certificates, version 2.3.1](https://github.com/cabforum/servercert/blob/main/docs/BR.md) (consultato il 04/10/2026): sezione 6.1.5 e registro delle modifiche
- [RFC 9155: Deprecating MD5 and SHA-1 Signature Hashes in TLS 1.2 and DTLS 1.2](https://www.rfc-editor.org/rfc/rfc9155) (consultata il 04/10/2026)
- [nginx: Configuring HTTPS servers, SSL certificate chains](https://nginx.org/en/docs/http/configuring_https_servers.html) (consultato il 04/10/2026)
- [Apache HTTP Server 2.4: mod_ssl, SSLCertificateFile and SSLCertificateChainFile](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html) (consultato il 04/10/2026)
- [F5 K13302: Configure the BIG-IP system to use an SSL chain certificate](https://my.f5.com/manage/s/article/K13302) (aggiornato il 26/11/2025, consultato il 04/10/2026)
- [Mozilla: Intermediate CA Preloading](https://wiki.mozilla.org/Security/CryptoEngineering/Intermediate_Preloading) (consultato il 04/10/2026)
- [Let's Encrypt: Chains of Trust](https://letsencrypt.org/certificates/) (consultato il 04/10/2026): la gerarchia a cui appartiene la catena di esempio
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
