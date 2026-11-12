## Cosa fa

Incolla l’output di un comando `dig` e lo strumento ricostruisce il messaggio DNS che rappresenta, sezione per sezione, spiegandone ogni parte. Legge l’intestazione, la riga dei flag e i conteggi delle sezioni, la pseudo-sezione OPT dell’EDNS, le quattro sezioni di record con ogni resource record scomposto nei suoi campi, e le statistiche della query in fondo. Analizza solo il testo: nulla viene risolto e nulla viene inviato da nessuna parte.

## Perché l’output di dig va decodificato

`dig` stampa una resa fedele ma stringata di un messaggio DNS, e molto significato è concentrato in token brevi. L’**intestazione** riporta l’operazione, un codice di stato e un ID del messaggio; la riga dei **flag** riporta flag di una sola parola la cui presenza o assenza cambia tutto. `aa` significa che la risposta è autoritativa, cioè viene da un server responsabile della zona e non da una cache; `rd` significa che la ricorsione era richiesta e `ra` che è disponibile; `ad` contrassegna dati convalidati con DNSSEC; `tc` significa che la risposta è stata troncata e va ritentata in TCP. Il codice di stato è l’altra cosa da leggere per prima: `NOERROR`, `NXDOMAIN` per un nome che non esiste, oppure `SERVFAIL` per un errore sul server.

## Le sezioni e l’EDNS

Un messaggio DNS ha quattro sezioni, e dig le etichetta: **QUESTION** (cosa è stato chiesto), **ANSWER** (i record che rispondono), **AUTHORITY** (i name server responsabili) e **ADDITIONAL** (record aggiuntivi utili). Lo strumento scompone ogni resource record nelle sue parti: il nome, il TTL in secondi (convertito quando dig ha stampato le unità), la classe (quasi sempre `IN`), il tipo (`A`, `AAAA`, `MX` e così via) e i dati del record. Decodifica anche la **pseudo-sezione OPT**, l’estensione EDNS(0) (RFC 6891) che annuncia cose come la risposta UDP più grande che il resolver accetta e il supporto DNSSEC, e che non è un vero record ma un insieme di metadati sullo scambio.

## Le statistiche

Il piè di pagina che dig stampa è davvero utile per la diagnosi: il tempo della query dice quanto ha impiegato il resolver, la riga del server dice quale resolver ha risposto, e la dimensione del messaggio e il timestamp completano il quadro. Leggerli insieme spesso spiega una risoluzione lenta o sorprendente più in fretta dei record stessi.

## Come si usa

Incolla una risposta completa di `dig` e leggi l’intestazione, i flag, le sezioni e le statistiche decodificati. L’analisi è deterministica e interamente locale; lo strumento non esegue mai una risoluzione per conto suo.

## Formati che legge

Oltre al formato predefinito, il parser legge le forme prodotte dalle opzioni di output di dig, ognuna fissata da un test su output reale di dig 9.20.29:

- `+ttlunits`: i TTL stampati con le unità (`1h30m`, `1d`, `2w`, `4m16s`; il manuale elenca s, m, h, d e w) vengono convertiti in secondi e mostrati in entrambe le forme, ad esempio `1h30m = 5400s`.
- `+nottlid`: i record stampati senza la colonna TTL vengono letti comunque, con il TTL contrassegnato come assente.
- `+multiline`: i record racchiusi tra parentesi su più righe, con commenti `;`, vengono riuniti in una sola riga, così un SOA si scompone comunque nei suoi sette campi.
- Opcode 6 e RCODE 11: dig 9.20 non ha un nome per loro e stampa `RESERVED6` e `RESERVED11`. IANA li ha assegnati a DNS Stateful Operations (DSO) e DSOTYPENI (RFC 8490), e lo strumento mostra entrambi i nomi.

Per una risposta negativa (NXDOMAIN, oppure NOERROR con la sezione answer vuota) che contiene il SOA della zona, lo strumento calcola anche il TTL del caching negativo. La RFC 2308, sezione 5, dice che il server autoritativo imposta il TTL del SOA al minimo tra il TTL del SOA stesso e il suo campo MINIMUM, e una cache lo decrementa a partire da lì.

## Esempi

Il pulsante Carica esempio e i test usano output reale di dig 9.20.29 acquisito il 19 ottobre 2026, in gran parte attraverso un relay locale che inviava ogni query a un resolver pubblico tramite DNS over HTTPS (la riga SERVER mostra il relay, `127.0.0.1`), il resto verso un server di laboratorio locale con una copia di `example.com` e indirizzi per la documentazione, più un responder di laboratorio costruito per restituire RCODE 11. I nomi che non esistono stanno sotto `.invalid`: la RFC 6761, sezione 6.4, consente di dare per scontato che restituiscano sempre NXDOMAIN, mentre `example.com` ora risponde NOERROR senza dati per i nomi che non esistono (la compact denial della RFC 9824).

## Condivisione dei risultati

In cima alla lettura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene l’output di dig così come l’hai incollato (`#input=...`), e nient’altro. Prima che tu copi qualsiasi cosa, il riquadro a comparsa aggiunge un’avvertenza: l’output di dig può indicare host interni, indirizzi e il resolver interrogato, quindi rileggilo prima di inviare il link. Tutto ciò che il link contiene sta dopo il `#`, la parte che la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) separa dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): il browser non la invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza massima.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un testo più lungo non riceve alcun link, e il riquadro a comparsa indica quanto sarebbe lungo.
- **Apertura di un link.** Il testo riempie la casella come farebbe un incolla e la pagina lo spiega di nuovo; nulla viene risolto o inviato. Un testo che non è output di dig riceve la nota della pagina. Accettati o no, i valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.

## API

Lo stesso motore risponde all’operazione `/api/v1/dig-output-explainer` dell’API HTTP del sito, descritta campo per campo nel contratto OpenAPI della [pagina API](/api), con esempi tratti dai vettori di test di riferimento (golden vectors). Il contratto indica anche se questo sito espone l’API.

- **Richiesta.** L’output di dig come testo, a capo e tabulazioni compresi.
- **Risposta.** `versionLine`, `digVersion`, `queryArgs`, `header` (`opcode`, `status` e `id` così come stampati, più `opcodeName` o `statusName` dove dig stampa RESERVED6 o RESERVED11), `flags` con i quattro conteggi delle sezioni, `opt`, `sections` (ogni record con `name`, `ttl` in secondi o `null`, `ttlText` quando dig ha stampato il TTL con le unità, `class`, `type`, `rdata` e `isQuestion`), `footer`, `negative` (`owner`, `soaTtl`, `minimum` e `ttl`) per una risposta negativa con un SOA in AUTHORITY, `warnings` (codici stabili) e `hadHeader`.
- **Errori.** Un testo che non è output di dig non è un errore HTTP: `hadHeader` è `false`.

`ttlText`, `negative`, `opcodeName`, `statusName` e gli avvisi `ttl-units` e `ttl-absent` sono stati aggiunti il 19 ottobre 2026; un TTL stampato come `1d` ora restituisce `ttl` 86400, mentre prima veniva letto come 1.

## Fonti

- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (consultata il 19/10/2026): il formato del messaggio e i flag dell’intestazione
- [RFC 6891: Extension Mechanisms for DNS (EDNS(0))](https://www.rfc-editor.org/rfc/rfc6891) (consultata il 19/10/2026): la pseudo-sezione OPT
- [RFC 2308: Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308) (consultata il 19/10/2026): sezione 5, il TTL del caching negativo
- [RFC 4034: Resource Records for the DNS Security Extensions](https://www.rfc-editor.org/rfc/rfc4034) (consultata il 19/10/2026): RRSIG, DNSKEY, DS, NSEC
- [RFC 9499: DNS Terminology](https://www.rfc-editor.org/rfc/rfc9499) (marzo 2024, rende obsoleta la RFC 8499; consultata il 19/10/2026)
- [RFC 8490: DNS Stateful Operations](https://www.rfc-editor.org/rfc/rfc8490) (consultata il 19/10/2026): sezioni 10.1 e 10.2, opcode 6 (DSO) e RCODE 11 (DSOTYPENI)
- [RFC 6761: Special-Use Domain Names](https://www.rfc-editor.org/rfc/rfc6761) (consultata il 19/10/2026): sezione 6.4, i nomi sotto `.invalid`
- [RFC 9824: Compact Denial of Existence in DNSSEC](https://www.rfc-editor.org/rfc/rfc9824) (consultata il 19/10/2026): NOERROR senza dati per un nome che non esiste
- [ISC, BIND 9 9.20.29 documentation, Manual Pages: dig](https://bind9.readthedocs.io/en/v9.20.29/manpages.html) (consultata il 19/10/2026): `+ttlunits`, `+ttlid`, `+multiline`, `+opcode`
- [BIND 9 source at tag v9.20.29, bin/dig/dig.c](https://github.com/isc-projects/bind9/blob/v9.20.29/bin/dig/dig.c) (consultato il 19/10/2026): i nomi degli opcode stampati da dig, tra cui `RESERVED6`; `RESERVED11` viene da lib/dns/rcode.c
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link Condividi i risultati
