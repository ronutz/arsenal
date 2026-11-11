## Cosa fa

Inserisci una suite di cifratura (cipher suite) TLS, con il suo nome IANA, con un nome OpenSSL o GnuTLS o con un code point esadecimale, e lo strumento la scompone nelle sue parti (lo scambio di chiavi, l’autenticazione, il cifrario di massa con la sua modalità e il MAC) e ne dà una valutazione di sicurezza in linguaggio semplice, insieme allo stato di raccomandazione ufficiale IANA della suite. Viene eseguito nel tuo browser su una copia integrata del registro IANA.

## Leggere il nome di una suite di cifratura

Una suite di cifratura è un insieme, con un nome, degli algoritmi che una connessione TLS userà, e il nome ha una struttura. In TLS 1.2 e nelle versioni precedenti, un nome come `TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256` si legge per parti: `ECDHE` è il metodo di scambio di chiavi, `RSA` è il modo in cui viene autenticato il server, `AES_128_GCM` è il cifrario di massa con la dimensione della chiave e la modalità, e `SHA256` è l’hash del MAC e della PRF. TLS 1.3 ha cambiato le cose: una suite 1.3 come `TLS_AES_128_GCM_SHA256` nomina solo il cifrario simmetrico e l’hash, perché lo scambio di chiavi è sempre effimero e viene negoziato separatamente. Lo strumento scompone entrambe le forme nei loro componenti.

## Nomi, code point e registro

La stessa suite ha nomi diversi in strumenti diversi, con un code point numerico sotto a tutti. La fonte autorevole è il registro IANA TLS Cipher Suites, che associa ogni code point di due byte al suo nome e riporta il flag **Recommended** (Y, N oppure D per discouraged, secondo la RFC 8447). Lo strumento riconduce qualsiasi cosa inserisci (un nome IANA, un nome OpenSSL o GnuTLS, o il code point esadecimale grezzo) a quella voce del registro, così puoi passare dalla grafia mostrata da uno strumento a quella che ne aspetta un altro.

## La valutazione di sicurezza

Conoscendo le parti, lo strumento può giudicare la suite, e segnala quelle notoriamente compromesse e quelle deboli in base agli standard, non a un’opinione: le suite RC4 non sono sicure (RFC 7465), le suite 3DES sono deboli a causa dell’attacco Sweet32 (RFC 8429), e riporta le voci che il registro stesso indica come non consigliate. Riconosce anche le scelte moderne, comprese le modalità di cifratura autenticata (GCM e ChaCha20-Poly1305) e i gruppi ibridi post-quantum per lo scambio di chiavi basati su ML-KEM (NIST FIPS 203).

## Come si usa

Inserisci una suite di cifratura in una qualsiasi forma comune e leggi lo scambio di chiavi, l’autenticazione, il cifrario, la modalità e il MAC decodificati, lo stato di raccomandazione IANA e la valutazione di sicurezza. La decodifica è deterministica e avviene interamente in locale.

La suite scelta da un server in esercizio si trova sulla riga `Cipher is` dell’output di `openssl s_client`; l’[Analizzatore di openssl s_client](/tools/openssl-s-client-explainer) legge quella riga con tutto ciò che la circonda, compresa la trappola per cui la versione indicata è quella del cifrario, non sempre la versione negoziata.

## Condivisione dei risultati

Sotto i badge del verdetto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la suite di cifratura così come l’hai inserita: `/tools/cipher#input=TLS_CHACHA20_POLY1305_SHA256`. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il nome non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** Il link ha la forma `#input=` che questa pagina già legge, quindi aprirlo funziona esattamente come hanno sempre funzionato quei link: il valore compila la casella e viene decodificato, e resta nell’indirizzo finché non modifichi o cancelli la casella.
