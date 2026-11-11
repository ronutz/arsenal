## Cosa fa

Un JA4 è un’impronta (fingerprint) di un client TLS, calcolata dai campi del suo ClientHello: la versione TLS, le suite di cifratura (cipher suite) che offre, le estensioni che invia, gli algoritmi di firma e l’ALPN. Due client che costruiscono il ClientHello allo stesso modo producono lo stesso JA4, ed è così che server, proxy e sensori passivi riconoscono il software client senza decifrare nulla. Lo strumento decodifica un JA4 nelle sue parti, oppure calcola il JA4 con hash a partire dai valori grezzi, non sottoposti a hash. Tutto viene eseguito nel tuo browser.

## Come è costruito un JA4

Un JA4 ha tre sezioni unite da trattini bassi, `JA4_a_JA4_b_JA4_c`, ad esempio `t13d1516h2_8daaf6152771_e5627efa2ab1`.

- **JA4_a** è la parte leggibile, lunga dieci caratteri:
  - trasporto: `t` per TLS su TCP, `q` per QUIC, `d` per DTLS;
  - versione TLS: `13` per TLS 1.3, `12` per 1.2 e così via, letta dall’estensione supported_versions quando è presente;
  - SNI: `d` quando il ClientHello contiene un nome di server (un dominio), `i` quando non lo contiene (un IP nudo);
  - il numero di cipher suite, su due cifre;
  - il numero di estensioni, su due cifre (questo conteggio include SNI e ALPN);
  - l’indicatore ALPN: il primo e l’ultimo carattere del primo valore ALPN, quindi `h2` per HTTP/2, oppure `00` quando non c’è ALPN.
- **JA4_b** sono i primi dodici caratteri esadecimali dello SHA-256 dell’elenco delle cipher suite, ordinato.
- **JA4_c** sono i primi dodici caratteri esadecimali dello SHA-256 dell’elenco delle estensioni (ordinato, senza SNI e ALPN) seguito dall’elenco degli algoritmi di firma nel suo ordine originale.

Poiché JA4_b e JA4_c sono hash troncati, sono unidirezionali: lo strumento può mostrarli ma non può ricavarne gli elenchi delle cipher suite o delle estensioni.

## GREASE

GREASE (i valori riservati di draft-davidben-tls-grease) mantiene TLS estensibile facendo inviare ai client valori casuali non usati che i server devono ignorare. Anche JA4 li ignora, quindi non influiscono mai sui conteggi né sugli hash. Se incolli valori grezzi che includono GREASE, lo strumento li filtra prima di contare, ordinare e calcolare gli hash.

## L’ordinamento è ciò che rende JA4 robusto

Le impronte più vecchie come JA3 calcolavano l’hash degli elenchi delle cipher suite e delle estensioni nell’ordine in cui il client li inviava. I browser moderni oggi rendono volutamente casuale l’ordine delle estensioni TLS a ogni connessione, il che cambia un JA3 ogni volta e lo rende inefficace. JA4 ordina le cipher suite e le estensioni prima di calcolare l’hash, quindi l’impronta resta stabile anche quando il client ne rimescola l’ordine. È questo il motivo principale per cui JA4 ha in gran parte sostituito JA3.

## Esempio svolto

L’impronta `t13d1516h2_8daaf6152771_e5627efa2ab1` si decodifica come TLS su TCP, TLS 1.3, SNI presente, 15 cipher suite, 16 estensioni e ALPN `h2` (HTTP/2). È l’esempio svolto della specifica JA4 ed è uno dei vettori di test di riferimento (golden vectors) dello strumento: lo SHA-256 del suo elenco ordinato di cipher suite dà `8daaf6152771`, e le estensioni ordinate più gli algoritmi di firma danno `e5627efa2ab1`.

## Una nota sulla licenza

JA4 (impronta dei client TLS) è rilasciato da FoxIO con la licenza permissiva BSD 3-Clause, alle stesse condizioni del JA3 originale, quindi si può implementare liberamente, anche in strumenti commerciali. Gli altri membri della famiglia JA4+, come JA4S, JA4H, JA4X e JA4T, sono soggetti alla FoxIO License 1.1, che non ne consente la monetizzazione senza un accordo separato, quindi questo strumento implementa solo JA4.

## JA3, il predecessore

Lo strumento gestisce anche JA3, l’impronta più vecchia che JA4 ha sostituito. Un JA3 è l’MD5 di cinque campi decimali del ClientHello nell’ordine in cui sono stati inviati: `SSLVersion,Ciphers,Extensions,EllipticCurves,EllipticCurvePointFormats`, ad esempio `769,47-53-5-10-49161-49162-49171-49172-50-56-19-4,0-10-11,23-24-25,0`. Incolla una stringa JA3 e lo strumento ne calcola l’MD5 e ne scompone i campi; incolla un MD5 nudo di 32 caratteri e lo riconosce come hash JA3, che, essendo unidirezionale, non può decodificare. JA3 è BSD 3-Clause come JA4. È sensibile all’ordine, quindi un browser che rende casuale l’ordine delle estensioni produce un JA3 diverso a ogni connessione, ed è il motivo per cui JA4 esiste.

## Come si usa

Lo strumento riconosce da solo ciò che incolli: un JA4 contiene trattini bassi, mentre un JA3 è fatto di campi decimali separati da virgole, oppure è un MD5 nudo. Incolla un JA4 con hash per decodificarlo, un JA4_r grezzo (il valore `JA4_a` seguito dagli elenchi non sottoposti a hash delle cipher suite, delle estensioni e degli algoritmi di firma, separati da trattini bassi) per calcolare il JA4 con hash, una stringa JA3 per calcolarne l’MD5 e vederne i campi, oppure un MD5 JA3 per identificarlo. Con il JA4 grezzo lo strumento ordina gli elenchi e ne filtra i valori GREASE al posto tuo, quindi un input ordinato e uno nell’ordine originale producono lo stesso JA4 canonico.

## Condivisione dei risultati

Sotto la lettura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene l’impronta così come l’hai incollata (`#input=t13d1516h2_8daaf6152771_e5627efa2ab1`), e nient’altro. Tutto ciò che il link contiene sta dopo il `#`, la parte che la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) separa dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non la invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza massima.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un’impronta è molto più corta.
- **Apertura di un link.** L’impronta compila la casella come farebbe un incolla e la pagina la legge di nuovo; un’impronta malformata riceve il messaggio della pagina stessa. Accettati o no, i valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.
