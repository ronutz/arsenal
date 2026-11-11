## Cosa fa

Analizza un indirizzo o un prefisso IPv6 e guardalo da ogni angolazione: la forma canonica abbreviata e la forma completamente espansa, il tipo di indirizzo, i calcoli del prefisso per un blocco, l’indirizzo MAC hardware se ne è incorporato uno nell’identificatore di interfaccia, i campi di un indirizzo Teredo e il nome DNS inverso che punta all’indirizzo. Tutto viene calcolato nel tuo browser.

## Forma canonica ed espansa

Un indirizzo IPv6 è lungo 128 bit e si scrive come otto gruppi di quattro cifre esadecimali separati da due punti. Lo stesso indirizzo si può scrivere in molti modi, quindi la RFC 5952 definisce un’unica forma canonica: in minuscolo, senza gli zeri iniziali di ogni gruppo e con la sola sequenza più lunga di gruppi tutti a zero compressa in `::`. Lo strumento mostra questa forma canonica e, accanto, la forma completamente espansa con ogni gruppo scritto per intero, la versione che ti serve quando devi vedere tutti i 128 bit o allineare gli indirizzi per colonna. Ad esempio, `2001:0db8:0000:0000:0000:0000:0000:0001` è l’espansione di `2001:db8::1`, e in forma canonica torna a essere quell’indirizzo. Un indirizzo IPv4-mapped mantiene la notazione mista raccomandata dalla RFC 5952, sezione 5 (`::ffff:192.0.2.128`), mentre la forma espansa è sempre di otto gruppi esadecimali.

## Classificazione e calcoli del prefisso

Non tutti gli indirizzi sono normali indirizzi pubblici. Lo strumento classifica gli intervalli per usi speciali, ciascuno verificato rispetto all’IANA IPv6 Special-Purpose Address Registry:

| Blocco | Mostrato come | Definito da |
| --- | --- | --- |
| `::1/128` | Loopback | RFC 4291 |
| `::/128` | Non specificato | RFC 4291 |
| `::ffff:0:0/96` | IPv4-mapped | RFC 4291 |
| `64:ff9b::/96` | Traduzione IPv4/IPv6 | RFC 6052 |
| `64:ff9b:1::/48` | Traduzione IPv4/IPv6 (uso locale) | RFC 8215 |
| `100::/64` | Solo scarto (discard-only) | RFC 6666 |
| `2001::/32` | Teredo | RFC 4380 |
| `2001:db8::/32` | Documentazione | RFC 3849 |
| `2002::/16` | 6to4 | RFC 3056 |
| `3fff::/20` | Documentazione | RFC 9637 |
| `5f00::/16` | SID di Segment Routing (SRv6) | RFC 9602 |
| `fc00::/7` | Unique local | RFC 4193 |
| `fe80::/10` | Unicast link-local | RFC 4291 |
| `ff00::/8` | Multicast | RFC 4291 |

Qualsiasi altro indirizzo in `2000::/3` viene indicato come unicast globale. Il registro ha altre righe (ad esempio `2001:2::/48` per il benchmarking e `2001:20::/28` per ORCHIDv2) che questa tabella non elenca ancora, quindi un indirizzo in una di esse viene mostrato come unicast globale.

Quando gli dai un prefisso, lo strumento calcola l’indirizzo di rete del blocco, il primo e l’ultimo indirizzo e quanti indirizzi comprende: la stessa aritmetica che lo strumento CIDR esegue per IPv4, ma su un campo a 128 bit.

## Multicast: ambito, flag e source-specific multicast

Un indirizzo multicast inizia con `ff`, seguito da un campo di flag di 4 bit e da un ambito (scope) di 4 bit (RFC 4291, sezione 2.7). Lo strumento dà un nome all’ambito in base al registro IANA degli ambiti: interface-local (1), link-local (2), realm-local (3, nominato dalla RFC 7346), admin-local (4), site-local (5), organization-local (8) e global (E). I valori 0 e F sono riservati e vengono mostrati come `riservato (ambito 0)` e `riservato (ambito F)`; i valori 6, 7 e da 9 a D non sono assegnati e vengono mostrati, ad esempio, come `non assegnato (ambito 6)`. Così `ff0f::1` non sembra più avere un ambito valido.

Il campo dei flag viene letto bit per bit come X, R, P e T (RFC 7371, sezione 4): T=1 indica un indirizzo transitorio, P=1 un indirizzo basato su un prefisso unicast (RFC 3306), R=1 un indirizzo con un rendezvous point incorporato (RFC 3956). `ff02::1` mostra `0000 (X=0, R=0, P=0, T=0)`.

Quando i flag sono `0011` e i 16 bit successivi sono zero, l’indirizzo è in `ff3x::/32`, che la RFC 4607, sezione 1, riserva al source-specific multicast (SSM), fissando i valori di P, T e plen per ogni indirizzo SSM («all SSM addresses must have P=1, T=1, and plen=0»). Lo strumento lo etichetta allora come Source-specific multicast e indica in quale parte dello spazio dei group ID si trova, in base alla RFC 4607 e al registro IANA: gli indirizzi da `ff3x::0:0` a `ff3x::3fff:ffff` non sono validi, quelli da `ff3x::4000:0` a `ff3x::7fff:ffff` sono riservati all’allocazione IANA, quelli da `ff3x::8000:0` a `ff3x::ffff:ffff` sono per l’assegnazione dinamica, e un indirizzo con un campo network-prefix diverso da zero (fuori da `ff3x::/96`) è riservato a usi SSM futuri e attualmente non è valido. Ad esempio, `ff3e::8000:1` è un indirizzo SSM di ambito global nell’intervallo dinamico.

## Teredo

Un indirizzo Teredo racchiude un endpoint di tunnel nei 128 bit (RFC 4380, sezione 4): il prefisso a 32 bit `2001::/32`, l’indirizzo IPv4 del server Teredo in chiaro (bit da 32 a 63), 16 bit di flag, poi la porta UDP esterna e l’indirizzo IPv4 esterno del client, entrambi offuscati invertendo ogni bit dell’indirizzo e del numero di porta («Each bit in the address and port number is reversed»), cioè con un OR esclusivo con `0xFFFF` per la porta e con `0xFFFFFFFF` per l’indirizzo. Lo strumento annulla lo XOR e mostra il server, l’indirizzo del client, la porta del client e i flag. Legge i flag con la disposizione indicata dalla RFC 5991, sezione 3.1 (`|C|z|Random1|U|G|Random2|`), nominando il bit cone C e i bit U e G; i dodici bit casuali restano così come sono.

Esempio svolto con indirizzi di documentazione: `2001:0:c000:22d:3c5a:63bf:34ff:8eeb` si decodifica nel server `192.0.2.45` (`c000:022d`), nei flag `0x3c5a` (C=0, U=0, G=0), nella porta del client `40000` (`63bf` XOR `ffff` = `9c40`) e nel client `203.0.113.20` (`34ff:8eeb` XOR `ffff:ffff` = `cb00:7114`). Il modulo `ipaddress` di Python restituisce lo stesso server e lo stesso client dalla sua proprietà `teredo`. Il decodificatore entra in funzione per un singolo indirizzo (senza lunghezza del prefisso, o con `/128`); per un blocco come `2001::/32` classifica l’intervallo ed esegue solo i calcoli del prefisso.

## EUI-64 e DNS inverso

Dall’indirizzo si ricavano due informazioni in più. Se l’identificatore di interfaccia è stato costruito a partire dal MAC a 48 bit di una scheda di rete con il metodo EUI-64 modificato (RFC 4291, appendice A), lo strumento recupera quel MAC, ed è per questo che esistono le estensioni per la privacy, che evitano di esporlo. Inoltre costruisce il nome DNS inverso `ip6.arpa`: i nibble dell’indirizzo in ordine inverso, separati da punti, che terminano con `.ip6.arpa`, cioè il nome usato da una ricerca PTR per l’indirizzo.

## Come si usa

Incolla un indirizzo IPv6 per vederne la forma canonica ed espansa, la classificazione, gli eventuali flag e ambito multicast, gli eventuali campi Teredo, l’eventuale MAC incorporato e il nome DNS inverso, oppure incolla un prefisso per aggiungere i calcoli del blocco. L’analisi è deterministica e legge solo l’indirizzo che le dai.

## Condivisione dei risultati

Sotto la forma canonica ed espansa, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene il campo dell’indirizzo così come l’hai inserito (`#input=2001%3Adb8%3A0%3A0%3A8%3A800%3A200c%3A417a`), e nient’altro. Tutto ciò che il link contiene sta dopo il `#`, la parte che la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) separa dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non la invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza massima.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un indirizzo o un prefisso è molto più corto.
- **Apertura di un link.** L’indirizzo compila il campo come farebbe la digitazione e la pagina lo decodifica di nuovo; un testo che non è un indirizzo riceve il messaggio della pagina stessa. Accettati o no, i valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.

## API

Lo stesso motore risponde all’operazione `/api/v1/ipv6` dell’API HTTP del sito, descritta campo per campo nel contratto OpenAPI della [pagina dell’API](/api), con esempi presi dai vettori di test di riferimento (golden vectors). Il contratto indica anche se questo sito serve l’API.

- **Richiesta.** L’indirizzo o il prefisso come testo: `?input=` in GET, oppure il corpo di una POST.
- **Risposta.** `input`, `bytes` (16 numeri), `compressed`, `expanded`, `prefixLength`, `classification` (`type`, `detail` e `isMulticast`; per ogni indirizzo multicast anche `scope`, `scopeStatus` e `flags`; `ssmRange` per ff3x::/32; `embeddedIpv4` per le forme IPv4-mapped e IPv4-compatible), `prefix` (l’aritmetica del prefisso, o `null`), `eui64Mac`, `teredo` (`server`, `flags`, `cone`, `port` e `client`, o `null`) e `reverseDns`. Per `2001:0:c000:22d:3c5a:63bf:34ff:8eeb` l’API risponde con `teredo.server` `192.0.2.45`, `teredo.port` 40000 e `teredo.client` `203.0.113.20`.
- **Errori.** HTTP 400, `invalid_input`, con il messaggio `empty`, `format` o `prefix`.

`scopeStatus`, `flags`, `ssmRange` e `teredo` sono stati aggiunti il 19 ottobre 2026.

## Fonti

- [IANA IPv6 Special-Purpose Address Registry, CSV (registro aggiornato il 09/10/2025)](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv) (consultato il 19/10/2026)
- [IANA IPv6 Multicast Address Space Registry: ambiti e group ID SSM (aggiornato il 07/04/2026)](https://www.iana.org/assignments/ipv6-multicast-addresses/ipv6-multicast-addresses.txt) (consultato il 19/10/2026)
- [RFC 4291: IP Version 6 Addressing Architecture, sezione 2.7 e appendice A](https://www.rfc-editor.org/rfc/rfc4291) (consultata il 19/10/2026)
- [RFC 5952: A Recommendation for IPv6 Address Text Representation](https://www.rfc-editor.org/rfc/rfc5952) (consultata il 19/10/2026)
- [RFC 7346: IPv6 Multicast Address Scopes](https://www.rfc-editor.org/rfc/rfc7346) (consultata il 19/10/2026)
- [RFC 7371: Updates to the IPv6 Multicast Addressing Architecture, sezione 4](https://www.rfc-editor.org/rfc/rfc7371) (consultata il 19/10/2026)
- [RFC 3306: Unicast-Prefix-based IPv6 Multicast Addresses, sezione 6](https://www.rfc-editor.org/rfc/rfc3306) (consultata il 19/10/2026)
- [RFC 3956: Embedding the Rendezvous Point (RP) Address in an IPv6 Multicast Address](https://www.rfc-editor.org/rfc/rfc3956) (consultata il 19/10/2026)
- [RFC 4607: Source-Specific Multicast for IP, sezione 1](https://www.rfc-editor.org/rfc/rfc4607) (consultata il 19/10/2026)
- [RFC 4380: Teredo: Tunneling IPv6 over UDP through Network Address Translations (NATs), sezione 4](https://www.rfc-editor.org/rfc/rfc4380) (consultata il 19/10/2026)
- [RFC 5991: Teredo Security Updates, sezione 3.1](https://www.rfc-editor.org/rfc/rfc5991) (consultata il 19/10/2026)
- [RFC 9637: Expanding the IPv6 Documentation Space](https://www.rfc-editor.org/rfc/rfc9637) (consultata il 19/10/2026)
- [RFC 9602: Segment Routing over IPv6 (SRv6) Segment Identifiers in the IPv6 Addressing Architecture](https://www.rfc-editor.org/rfc/rfc9602) (consultata il 19/10/2026)
- [RFC 8215: Local-Use IPv4/IPv6 Translation Prefix](https://www.rfc-editor.org/rfc/rfc8215) (consultata il 19/10/2026)
- [RFC 3849: IPv6 Address Prefix Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc3849) (consultata il 19/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
