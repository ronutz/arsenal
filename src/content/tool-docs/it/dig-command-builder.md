## Cosa fa

Tu descrivi la query; la pagina scrive la riga di comando `dig`. Cinque gruppi di controlli corrispondono alle cinque cose che un’invocazione di dig dice:

- **Cosa cercare:** un nome e un tipo di record (A per impostazione predefinita, qualsiasi mnemonico del registro IANA, `TYPEnn`, o i tipi di query ANY, AXFR e IXFR con il seriale che possiedi), una classe (IN per impostazione predefinita; CH e HS), oppure un indirizzo per una risoluzione inversa con `-x`, nel qual caso dig ricava da solo il nome PTR e il nome, il tipo e la classe non vengono scritti.
- **A chi chiedere:** il server (`@server`, un nome host o un semplice indirizzo IPv4 o IPv6), una porta non standard (`-p`), il trasporto (UDP, `+tcp`, `+tls`, `+https` con il suo endpoint), una sola famiglia di indirizzi (`-4`, `-6`) e un indirizzo di origine (`-b`).
- **Come chiedere:** `+trace`, `+nssearch`, `+norecurse`, `+dnssec`, `+cd`, `+ignore`; i controlli EDNS `+bufsize`, `+subnet`, `+nsid`, `+nocookie`, `+noedns`; e i timer `+timeout`, `+tries`, `+retry`.
- **Cosa stampare:** il messaggio intero, `+short` (con `+identify`), `+noall +answer` o `+yaml`; più `+multiline`, `+ttlunits` e `+qr`.
- **Sul tuo computer:** `-k keyfile` per una query firmata e `-r` per ignorare `~/.digrc`.

Ottieni tre cose: il comando, in un unico ordine canonico, con un pulsante Copia; i rilievi, dove una combinazione è contraddittoria, ridondante o rischia di sorprendere; e un riepilogo di ciò che la query conterrà, ricavato dai valori predefiniti e dalle interazioni dichiarati nel manuale: la domanda che dig inserirà nel messaggio, quali server vengono interrogati, il trasporto e la porta dopo i valori predefiniti del tipo, se una risposta UDP troncata viene ritentata in TCP, e i bit RD, DO, CD e AD, il record OPT dell’EDNS e la sua dimensione del buffer, il cookie, e se la query è firmata. Ogni token è spiegato più sotto.

## L’ordine del comando

dig legge l’intera riga e non bada molto all’ordine, con due eccezioni indicate dal manuale: le opzioni di query (le parole con `+`) dipendono dall’ordine, e `+short` e `+cmd` sono globali. Il generatore scrive un ordine fisso, così la stessa intenzione produce sempre gli stessi byte: `dig`, `@server`, le opzioni (`-r`, `-4`/`-6`, `-b`, `-p`, `-k`), la domanda (`-x address`, oppure il nome, poi il tipo, poi la classe), poi le opzioni di query raggruppate come trasporto, modalità, bit dell’intestazione, EDNS, timer, output. `+noall` viene scritto sempre prima di `+answer` perché si applicano in sequenza.

I valori predefiniti non vengono scritti: tipo A, classe IN, porta 53 (853 per TLS, 443 per HTTPS), UDP. Un nome che è anche il mnemonico di un tipo o di una classe (il dominio di primo livello `ch`, un host che si chiama proprio `mx`) viene scritto con `-q`, perché dig legge le parole isolate come tipi e classi prima che come nomi; la nota del manuale stesso sui domini di primo livello IN e CH è il motivo per cui l’opzione esiste.

## Cosa verificano i rilievi

Ogni regola rimanda alla frase del manuale o della RFC che la giustifica:

- `+trace` imposta `+dnssec` e `+cookie` e disattiva la ricorsione; `@server` riguarda allora solo la query iniziale per i root server. Chiedere insieme `+dnssec` o `+norecurse` viene segnalato come ridondante, e viene mostrata la nota sul server.
- Anche `+nssearch` disattiva la ricorsione.
- Il tipo ANY e `ixfr=N` usano TCP per impostazione predefinita; AXFR usa sempre TCP, e un trasferimento senza `@server` andrebbe ai resolver di `/etc/resolv.conf` invece che a un server che ospita la zona (RFC 5936). Ad ANY può essere data una risposta minima o con un record HINFO sintetizzato (RFC 8482).
- `+bufsize` va da 0 a 65535; un valore inferiore a 512 viene trattato come 512 da chi lo riceve (RFC 6891, sezione 6.2.3); oltre 4096 supera il punto di partenza suggerito dalla RFC 6891; il DNS Flag Day 2020 indica 1232 come dimensione minima sicura.
- `+bufsize=0` viene segnalato come da verificare: annuncia un buffer UDP EDNS di 0 byte, che chi lo riceve tratta come 512. Non ripristina il valore predefinito; il manuale affida questo compito a `+bufsize` senza valore. Il valore predefinito di dig è 1232 byte (`DEFAULT_EDNS_BUFSIZE` nel sorgente della 9.20.29). Il passaggio da 4096 a 1232 è la voce 5516 dei CHANGES di BIND, rilasciata nella 9.17.6 e quindi presente in ogni release a partire dalla 9.18.0; nel ramo 9.16 la stessa voce è arrivata a `named` ma non a dig, che ha mantenuto 4096 fino alla 9.16.50.
- `+dnssec`, `+trace`, `+bufsize`, `+nsid` e `+subnet` risiedono nel record OPT (RFC 6891; il bit DO è della RFC 3225), quindi `+noedns` non può essere combinato con loro e non viene scritto quando sono presenti.
- `+subnet=0` (o una lunghezza del prefisso pari a 0) chiede al resolver di non usare il tuo indirizzo (RFC 7871).
- `-4` con un server indicato come indirizzo IPv6 letterale, o `-6` con uno IPv4, lascia dig senza un posto dove inviare la query.
- `+timeout` inferiore a 1 e `+tries` pari a 0 vengono portati silenziosamente a 1 da dig.
- `+identify` non fa nulla senza `+short`; `+ignore` non fa nulla senza UDP.
- Per TSIG viene offerto solo `-k`. Il manuale dice di usarlo al posto di `-y`, perché `-y` mette il segreto condiviso sulla riga di comando, dove `ps` e la cronologia della shell possono vederlo.

## Limiti

- Il generatore produce una sola ricerca per comando. dig può accettare più query sulla stessa riga, ognuna con le sue opzioni, e un file batch con `-f`; nessuno dei due casi è modellato.
- Non esegue dig, non risolve nulla e non verifica che un server esista. Il riepilogo è ricavato da ciò che afferma il manuale, non osservato.
- Le opzioni non offerte (`+aaonly`, `+besteffort`, `+cmd`, `+comments`, `+crypto`, `+domain`, `+ednsopt`, `+expire`, `+header-only`, `+keepopen`, `+ndots`, `+onesoa`, `+opcode`, `+padding`, `+proxy`, `+qid`, `+search`, `+split`, `+stats`, `+tls-ca` e gli altri file TLS, `+unknownformat`, `+zoneversion`, `-c` come opzione, `-f`, `-F`, `-m`, `-t` come opzione, `-u`, `-y`) sono documentate nel manuale; qui ci sono quelle comuni.
- Dei nomi viene verificata la forma (etichette di lettere, cifre, trattini e underscore, al massimo 63 caratteri ciascuna, al massimo 253 in tutto; un asterisco isolato come etichetta jolly); il generatore non sa se un nome esiste.
- Il manuale di dig letto per questa pagina è la documentazione «latest» di BIND 9 (9.21) e, per `+bufsize`, il manuale stabile della 9.20.29 (consultato il 19/10/2026). Le versioni più vecchie di dig non hanno alcune opzioni di query (`+tls`, `+https`, `+yaml` sono recenti); per una parola che non conosce dig stampa «Invalid option».

## Condivisione dei risultati

Sotto il comando, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene ogni campo che hai impostato, per nome: il nome da cercare come `#input=`, poi ad esempio `&type=MX&server=192.0.2.53&dnssec=1`. Un interruttore viene incluso come `1` solo quando è attivo, e una scelta con il suo valore (`transport=tls`). Prima che tu copi qualsiasi cosa, il riquadro a comparsa aggiunge un’avvertenza: il comando può indicare il tuo server DNS, un indirizzo di origine o il percorso di un file di chiave, quindi controllalo prima di inviare il link. Il modulo non contiene alcuna chiave: il `-k` di dig accetta il percorso di un file di chiave. Tutto ciò che il link contiene sta dopo il `#`, la parte che la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) separa dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): il browser non la invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza massima.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; i campi messi insieme sono molto più corti.
- **Apertura di un link.** Il modulo del link sostituisce l’intero modulo, compreso l’Esempio con cui si apre la pagina (un campo che il link non contiene viene svuotato), e il comando si compone; nulla viene eseguito o inviato. Una scelta che il modulo non offre, un interruttore diverso da `1` o `0`, o un valore più lungo di quanto il suo campo consenta fanno ignorare l’intero link. Accettati o no, i valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.

## API

Lo stesso motore risponde all’operazione `/api/v1/dig-command-builder` dell’API HTTP del sito, descritta campo per campo nel contratto OpenAPI della [pagina API](/api), con esempi tratti dai vettori di test di riferimento (golden vectors). Il contratto indica anche se questo sito espone l’API.

- **Richiesta.** Un oggetto JSON con i campi del modulo: `name`, `type`, `ixfrSerial`, `klass`, `reverse`, `server`, `port`, `ipv`, `source`, `transport`, `httpsEndpoint`, `bufsize`, `subnet`, `timeout`, `tries`, `retry`, `output` e `keyfile` come stringhe, e gli interruttori `trace`, `nssearch`, `norecurse`, `dnssec`, `cd`, `noedns`, `nocookie`, `nsid`, `ignore`, `identify`, `multiline`, `ttlunits`, `qr` e `norc` come booleani.
- **Risposta.** `ok`, `command`, `parts` (`text`, `kind` ed `explain`, l’ID della spiegazione), `findings` (`code`, `severity` e `params`) ed `effective`, ciò che la query contiene.
- **Errori.** Un rilievo di errore non è un errore HTTP: `ok` è `false`, `command` è vuoto ed `effective` è `null`. Un corpo che non è un oggetto JSON riceve HTTP 400.

Dal 19 ottobre 2026, `{"name": "example.com", "bufsize": "0"}` restituisce il rilievo `bufsize-default` con gravità `warning`; prima era un `info` secondo cui 0 ripristina il valore predefinito.

## Fonti

- [BIND 9 Administrator Reference Manual, Manual Pages: dig](https://bind9.readthedocs.io/en/latest/manpages.html#man-dig) (consultato il 04/10/2026): ogni opzione e opzione di query, i valori predefiniti e le interazioni citati sopra
- [BIND 9 source, bin/dig/dig.c](https://github.com/isc-projects/bind9/blob/main/bin/dig/dig.c) (consultato il 04/10/2026): l’ordine in cui viene provata una parola isolata (ixfr=, tipo, classe, nome) e il TCP predefinito per ANY e ixfr
- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (consultata il 04/10/2026): i valori di TYPE e CLASS, la porta 53, il limite UDP di 512 byte, IN-ADDR.ARPA, le lunghezze delle etichette e dei nomi, il bit RD
- [RFC 3596: DNS Extensions to Support IP Version 6](https://www.rfc-editor.org/rfc/rfc3596) (consultata il 04/10/2026): AAAA e la forma a nibble di IP6.ARPA
- [RFC 6891: Extension Mechanisms for DNS (EDNS(0))](https://www.rfc-editor.org/rfc/rfc6891) (consultata il 04/10/2026): il record OPT, le regole sulla dimensione del payload, 4096 come punto di partenza
- [RFC 3225: Indicating Resolver Support of DNSSEC](https://www.rfc-editor.org/rfc/rfc3225) (consultata il 04/10/2026): il bit DO
- [RFC 4034](https://www.rfc-editor.org/rfc/rfc4034) e [RFC 4035](https://www.rfc-editor.org/rfc/rfc4035) (consultate il 04/10/2026): i tipi di record DNSSEC; i bit CD e AD
- [RFC 5936: DNS Zone Transfer Protocol (AXFR)](https://www.rfc-editor.org/rfc/rfc5936) e [RFC 1995: Incremental Zone Transfer in DNS](https://www.rfc-editor.org/rfc/rfc1995) (consultate il 04/10/2026)
- [RFC 8482: Providing Minimal-Sized Responses to DNS Queries That Have QTYPE=ANY](https://www.rfc-editor.org/rfc/rfc8482) (consultata il 04/10/2026)
- [RFC 7858: DNS over TLS](https://www.rfc-editor.org/rfc/rfc7858) e [RFC 8484: DNS Queries over HTTPS](https://www.rfc-editor.org/rfc/rfc8484) (consultate il 04/10/2026)
- [RFC 5001: NSID](https://www.rfc-editor.org/rfc/rfc5001), [RFC 7871: Client Subnet in DNS Queries](https://www.rfc-editor.org/rfc/rfc7871), [RFC 7873: DNS Cookies](https://www.rfc-editor.org/rfc/rfc7873) (consultate il 04/10/2026)
- [IANA: Domain Name System (DNS) Parameters](https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml) (consultata il 04/10/2026): il registro RR TYPE accettato dal campo del tipo, e i codici delle opzioni EDNS
- [ISC, BIND 9 9.20.29 documentation, Manual Pages: dig](https://bind9.readthedocs.io/en/v9.20.29/manpages.html) (consultata il 19/10/2026): `+bufsize[=B]` imposta la dimensione annunciata a B byte, da 0 a 65535; `+bufsize` senza valore ripristina il valore predefinito
- [BIND 9 source at tag v9.20.29, bin/dig/dighost.h](https://github.com/isc-projects/bind9/blob/v9.20.29/bin/dig/dighost.h) (consultato il 19/10/2026): `DEFAULT_EDNS_BUFSIZE 1232`
- [ISC, BIND 9.18.0 CHANGES](https://downloads.isc.org/isc/bind9/9.18.0/CHANGES) (consultato il 19/10/2026): la voce 5516 sotto la 9.17.6, la dimensione predefinita del buffer EDNS cambiata da 4096 a 1232 byte
- [BIND 9 source at tag v9.16.50, bin/dig/include/dig/dig.h](https://github.com/isc-projects/bind9/blob/v9.16.50/bin/dig/include/dig/dig.h) (consultato il 19/10/2026): `DEFAULT_EDNS_BUFSIZE 4096`, il valore predefinito di dig nel ramo 9.16
- [DNS Flag Day 2020](https://www.dnsflagday.net/2020/) (consultato il 04/10/2026): 1232 byte come dimensione minima sicura del buffer EDNS
- [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737) e [RFC 3849](https://www.rfc-editor.org/rfc/rfc3849) (consultate il 04/10/2026): gli intervalli di indirizzi per la documentazione usati negli esempi (192.0.2.0/24, 2001:db8::/32)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link Condividi i risultati
