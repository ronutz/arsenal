## Cosa fa

Incolla un URL e lo strumento ti dice dove punta davvero: loopback, un intervallo privato o link-local, un endpoint di metadati cloud, lo spazio condiviso del CGNAT, altro spazio riservato o Internet pubblico. Decodifica i trucchi di offuscamento degli IP usati per mascherare un indirizzo interno, legge l’indirizzo IPv4 che un indirizzo IPv6 può contenere al suo interno (sei formati, Teredo compreso), indica il blocco per usi speciali IANA in cui ricade un indirizzo per ogni riga di entrambi i registri, segnala gli indirizzi di servizio anycast per usi speciali, segnala gli schemi URL pericolosi e le credenziali incorporate, e mostra un livello di rischio SSRF. Non risolve mai il DNS e non invia mai la richiesta: è un classificatore, non una sonda.

## Cos’è l’SSRF e perché la classificazione conta

L’SSRF (Server-Side Request Forgery) è un attacco in cui un server viene indotto a fare una richiesta a un URL scelto dall’attaccante, di solito per raggiungere qualcosa che l’attaccante non può raggiungere direttamente: un servizio su `localhost`, una macchina in un intervallo interno o l’endpoint di metadati di un provider cloud. Difendersi significa in sostanza decidere se un URL si può recuperare in sicurezza, e quella decisione è più difficile di quanto sembri, perché un indirizzo interno si può scrivere in molte forme mascherate. Lo strumento è costruito per quella decisione: serve ad aiutarti a capire un URL e a progettare una lista di elementi consentiti, saldamente dalla parte della difesa.

## Le offuscazioni che decodifica

Un filtro ingenuo che blocca `127.0.0.1` non vede i molti altri modi di scrivere lo stesso indirizzo, ed è proprio questo che sfruttano gli attaccanti. Lo strumento li decodifica, così la destinazione reale diventa visibile:

- **Decimale**: la forma intera, in cui `2130706433` è `127.0.0.1` e `2852039166` è l’indirizzo dei metadati `169.254.169.254` (è quello che carica il pulsante Esempio);
- le forme degli ottetti in **ottale** ed **esadecimale**;
- IPv4 in **forma abbreviata**, in cui `127.1` si espande in `127.0.0.1`;
- **qualsiasi grafia di un indirizzo IPv6**: lo strumento scompone l’indirizzo nei suoi otto blocchi da 16 bit prima di classificare qualsiasi cosa, quindi `[0:0:0:0:0:0:0:1]` e `[0000:0000:0000:0000:0000:0000:0000:0001]` sono il loopback `::1`, esattamente come la RFC 4291 elenca `0:0:0:0:0:0:0:1` e `::1` come due grafie dell’indirizzo di loopback, dove i due punti doppi sostituiscono uno o più gruppi di zeri («The use of “::” indicates one or more groups of 16 bits of zeros», [RFC 4291, sezione 2.2](https://www.rfc-editor.org/rfc/rfc4291.txt)); e
- **indirizzi IPv6 che contengono un indirizzo IPv4**, descritti nella sezione successiva.

Poi classifica il letterale risultante rispetto a ogni riga dei registri IANA per usi speciali e mette in evidenza gli indirizzi dei metadati cloud, bersagli privilegiati dell’SSRF. L’indirizzo decodificato viene mostrato nella forma testuale canonica della [RFC 5952](https://www.rfc-editor.org/rfc/rfc5952.txt): minuscole, zeri iniziali eliminati, la sequenza più lunga di blocchi a zero scritta come `::` (sezione 4) e, per i prefissi che di per sé indicano un indirizzo IPv4 incorporato, la notazione mista con la parte finale in decimale puntato, perché la notazione mista è consigliata quando è soddisfatta una certa condizione («mixed notation is RECOMMENDED if the following condition is met») e la condizione è un prefisso noto (well-known), come quelli definiti dalla RFC 4291 (sezione 5).

## Indirizzi IPv6 che contengono un indirizzo IPv4

Sei formati IPv6 inseriscono un indirizzo IPv4 nei 128 bit. Un filtro che controlla solo il testo IPv6 lascia passare la destinazione IPv4 interna, quindi lo strumento decodifica l’indirizzo IPv4, valuta l’URL in base a quello, indica quale incorporamento ha decodificato e mostra la riga del registro dell’indirizzo contenuto. Un indirizzo pubblico contenuto in un incorporamento viene valutato pubblico, con il nome dell’incorporamento.

| Formato | Prefisso | Dove si trova l’indirizzo IPv4 | Fonte |
|---|---|---|---|
| IPv4-mapped | `::ffff:0:0/96` | i 32 bit meno significativi | [RFC 4291, sezione 2.5.5.2](https://www.rfc-editor.org/rfc/rfc4291.txt) |
| IPv4-compatible (deprecato) | `::/96`, tranne `::` e `::1` | i 32 bit meno significativi | [RFC 4291, sezione 2.5.5.1](https://www.rfc-editor.org/rfc/rfc4291.txt) |
| NAT64 Well-Known Prefix | `64:ff9b::/96` | i 32 bit meno significativi (il formato /96) | [RFC 6052, sezioni 2.1 e 2.2](https://www.rfc-editor.org/rfc/rfc6052.txt) |
| Prefisso NAT64 per uso locale | `64:ff9b:1::/48` | dipende dalla lunghezza del prefisso scelta dall’operatore: il formato /48, /56, /64 o /96 della RFC 6052 | [RFC 8215, sezioni 1 e 5](https://www.rfc-editor.org/rfc/rfc8215.txt) |
| 6to4 | `2002::/16` | i bit da 16 a 47 (il campo V4ADDR) | [RFC 3056, sezione 2](https://www.rfc-editor.org/rfc/rfc3056.txt) |
| Teredo | `2001::/32` | due indirizzi: il server nei bit da 32 a 63, il client invertito nei bit da 96 a 127 | [RFC 4380, sezione 4](https://www.rfc-editor.org/rfc/rfc4380.txt) |

**IPv4-mapped.** `[::ffff:127.0.0.1]` è l’indirizzo di loopback travestito da IPv6. Un browser non lo mostra così: il serializzatore IPv6 del WHATWG URL Standard scrive ogni blocco da 16 bit come il numero esadecimale minuscolo più corto possibile («the shortest possible lowercase hexadecimal number»), quindi lo stesso URL torna come `[::ffff:7f00:1]` ([WHATWG URL Standard, IPv6 serializer](https://url.spec.whatwg.org/)). Entrambe le grafie vengono valutate loopback, rischio alto.

**IPv4-compatible.** La RFC 4291 definisce `::a.b.c.d` con 96 bit a zero davanti all’indirizzo IPv4, e poi lo ritira: il formato è deprecato perché i meccanismi di transizione attuali non usano più questi indirizzi («is now deprecated because the current IPv6 transition mechanisms no longer use these addresses»), e l’indirizzo IPv4 che contiene deve essere unicast e globalmente univoco («must be a globally-unique IPv4 unicast address», [RFC 4291, sezione 2.5.5.1](https://www.rfc-editor.org/rfc/rfc4291.txt)). Il registro non ha una riga per questo formato. Uno stack che accetta ancora il formato raggiunge l’indirizzo contenuto, quindi `[::127.0.0.1]` e il suo gemello esadecimale `[::7f00:1]` vengono valutati loopback, `[::a9fe:a9fe]` metadati cloud e `[::8.8.8.8]` pubblico; in ogni caso il risultato dice che il formato è deprecato. `::` e `::1` hanno righe proprie nel registro e non vengono mai letti come IPv4-compatible.

**NAT64 Well-Known Prefix.** `[64:ff9b::169.254.169.254]` e il suo gemello esadecimale `[64:ff9b::a9fe:a9fe]` contengono l’indirizzo link-local dei metadati, quindi vengono valutati metadati cloud. La RFC 6052 vieta di usare il Well-Known Prefix per rappresentare indirizzi non globali («The Well-Known Prefix MUST NOT be used to represent non-global IPv4 addresses») e dice ai traduttori di scartare questi pacchetti ([RFC 6052, sezione 3.1](https://www.rfc-editor.org/rfc/rfc6052.txt)). L’indirizzo indica comunque quella destinazione interna, ed è per questo che un filtro deve rifiutarlo invece di fidarsi di ogni traduttore lungo il percorso. Un indirizzo con il Well-Known Prefix che contiene un indirizzo IPv4 pubblico, come `64:ff9b::8.8.8.8`, viene valutato pubblico, perché il registro indica `64:ff9b::/96` come globalmente raggiungibile.

**Prefisso NAT64 per uso locale.** La RFC 8215 riserva `64:ff9b:1::/48` alla traduzione all’interno di una sola rete e lascia all’operatore la lunghezza del prefisso di traduzione; i nodi non devono fare ipotesi sulla sintassi o sulle proprietà di questi indirizzi («must not make any assumptions regarding the syntax or properties of those addresses», [RFC 8215, sezione 5](https://www.rfc-editor.org/rfc/rfc8215.txt)). Per questo lo strumento legge l’indirizzo con ogni formato della RFC 6052 che sta in una /48 (/96, /64, /56 e /48), conserva la lettura che punta più all’interno (metadati cloud, poi loopback, link-local, privato) e riporta la lettura /96 quando nessuna lo fa. Ogni formato salta i bit da 64 a 71, e la RFC 6052 impone che siano a zero («These bits MUST be set to zero», [RFC 6052, sezione 2.2](https://www.rfc-editor.org/rfc/rfc6052.txt)); quando non lo sono, non viene decodificato alcun indirizzo IPv4. Poiché il registro IANA indica `64:ff9b:1::/48` come non globalmente raggiungibile, un indirizzo al suo interno non viene mai valutato al di sotto di riservato.

**6to4.** La RFC 3056 costruisce un prefisso di sito dal prefisso `2002` da 16 bit e dall’indirizzo IPv4 da 32 bit del sito, scritto `2002:V4ADDR::/48` ([RFC 3056, sezione 2](https://www.rfc-editor.org/rfc/rfc3056.txt)). Quindi `[2002:7f00:1::]` contiene `127.0.0.1` e viene valutato loopback; `[2002:a9fe:a9fe::1]` contiene l’indirizzo dei metadati.

**Teredo.** Un indirizzo Teredo ha cinque parti: «Prefix», «Server IPv4», «Flags», «Port» e «Client IPv4» ([RFC 4380, sezione 4](https://www.rfc-editor.org/rfc/rfc4380.txt)). Il prefisso è `2001:0000:/32` (sezione 2.6). L’indirizzo del server si trova nei bit da 32 a 63 così com’è. La porta e l’indirizzo mappati del client sono offuscati: ogni bit dell’indirizzo e del numero di porta viene invertito con un OR esclusivo («Each bit in the address and port number is reversed; this can be done by an exclusive OR of the 16-bit port number with the hexadecimal value 0xFFFF, and an exclusive OR of the 32-bit address with the hexadecimal value 0xFFFFFFFF», sezione 4). La RFC 5991 ha poi ridefinito il campo Flags con bit casuali, ma ha lasciato invariati i campi del server e del client ([RFC 5991, sezione 3.1](https://www.rfc-editor.org/rfc/rfc5991.txt)). Lo strumento annulla lo XOR, valuta entrambi gli indirizzi IPv4, lascia decidere quello più interno (a parità prevale il server) e mostra il server, il client, la porta del client e i flag. `[2001:0:808:808:0:feae:80ff:fffe]` ha il server `8.8.8.8` e il client `127.0.0.1` (`0x80fffffe` XOR `0xffffffff`), quindi viene valutato loopback; `[2001:0:808:808:0:feae:fefd:fcfb]` contiene il client `1.2.3.4` sulla porta 337, la stessa coppia che la RFC 4380 usa per il proprio esempio di offuscamento (sezione 5.1.1), e viene valutato pubblico. La RFC 4380 aggiunge che gli identificatori usati negli indirizzi globali devono includere un indirizzo unicast di portata globale («the identifiers used in global addresses MUST include a global scope unicast IPv4 address», sezione 4), quindi un indirizzo Teredo che ne contiene uno interno indica una destinazione che nessun indirizzo Teredo valido dovrebbe contenere.

**Cosa non decodifica: 6a44.** La RFC 6751 costruisce un indirizzo 6a44 a partire da un prefisso di rete assegnato dall’ISP («the 6a44-network IPv6 prefix C (a /48 the ISP has assigned to its 6a44 relays)»), seguito dall’indirizzo IPv4 del sito del cliente, da una porta e dall’indirizzo IPv4 locale del client ([RFC 6751, sezione 5](https://www.rfc-editor.org/rfc/rfc6751.txt)). Poiché la /48 viene scelta da ogni ISP, nessun prefisso fisso identifica un indirizzo 6a44, e senza la configurazione di quell’ISP lo strumento non può distinguerlo da qualsiasi altro indirizzo. Indica però il lato IPv4: `192.88.99.2` è l’indirizzo anycast dei relay 6a44 (sezione 8).

## Ogni blocco per usi speciali, con il nome dei registri IANA

Lo strumento contiene ogni riga dei registri IANA IPv4 e IPv6 Special-Purpose Address Space ([CSV IPv4](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) e [CSV IPv6](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv), entrambi aggiornati l’ultima volta il 09/10/2025, consultati il 26/10/2026): 25 righe IPv4 e 25 righe IPv6. Il calcolatore CIDR legge la stessa copia delle righe IPv4. Un indirizzo viene confrontato con la riga più specifica che lo copre, e il risultato mostra testualmente il blocco, il nome del registro e la RFC. Il registro definisce Globally Reachable come l’indicazione se un datagramma IP con destinazione nel blocco per usi speciali assegnato sia inoltrabile oltre un determinato dominio amministrativo («whether an IP datagram whose destination address is drawn from the allocated special-purpose address block is forwardable beyond a specified administrative domain»), e la valutazione segue questa definizione:

- **Globally Reachable False** dà **riservato** (rischio alto nella scala di questo strumento), a meno che la riga non abbia una categoria più eloquente: loopback, privato, link-local o carrier-grade NAT.
- **Globally Reachable True** dà **pubblico** (rischio basso), e il blocco viene comunque nominato, quindi nulla del registro finisce in un «pubblico» anonimo.
- **Nessun valore** capita in due modi. Per le righe degli incorporamenti (6to4, Teredo) il registro riporta N/A e rimanda alla RFC, quindi decide l’indirizzo IPv4 contenuto. Per le due righe deprecate il registro non contiene alcun valore booleano, e lo strumento le valuta riservate: la RFC 7526 vieta di riassegnare il prefisso ad altri usi se non con una futura IETF Standards Action («The prefix 192.88.99.0/24 MUST NOT be reassigned for other use except by a future IETF Standards Action») e registra la rimozione dei suoi valori booleani («The Boolean values for the address block 192.88.99.0/24 have been removed», [RFC 7526, sezioni 4 e 7](https://www.rfc-editor.org/rfc/rfc7526.txt)), e `2001:10::/28` si trova dentro `2001::/23`, che non è globalmente raggiungibile se non lo consente un’allocazione più specifica («Unless allowed by a more specific allocation», nota [1] del registro).

I blocchi multicast `224.0.0.0/4` e `ff00::/8` non sono righe per usi speciali (hanno registri propri) e vengono comunque valutati riservati, senza una riga con nome.

### IPv4

| Blocco | Nome IANA | RFC | Globally Reachable | Valutazione |
|---|---|---|---|---|
| `0.0.0.0/8` | "This network" | RFC 791, Section 3.2 | False | riservato, alto |
| `0.0.0.0/32` | "This host on this network" | RFC 1122, Section 3.2.1.3 | False | riservato, alto |
| `10.0.0.0/8` | Private-Use | RFC 1918 | False | privato, alto |
| `100.64.0.0/10` | Shared Address Space | RFC 6598 | False | CGNAT, medio |
| `127.0.0.0/8` | Loopback | RFC 1122, Section 3.2.1.3 | False | loopback, alto |
| `169.254.0.0/16` | Link Local | RFC 3927 | False | link-local, alto (`169.254.169.254`: metadati cloud) |
| `172.16.0.0/12` | Private-Use | RFC 1918 | False | privato, alto |
| `192.0.0.0/24` | IETF Protocol Assignments | RFC 6890, Section 2.1 | False | riservato, alto |
| `192.0.0.0/29` | IPv4 Service Continuity Prefix | RFC 7335 | False | riservato, alto |
| `192.0.0.8/32` | IPv4 dummy address | RFC 7600 | False | riservato, alto |
| `192.0.0.9/32` | Port Control Protocol Anycast | RFC 7723 | True | pubblico, basso, servizio anycast |
| `192.0.0.10/32` | Traversal Using Relays around NAT Anycast | RFC 8155 | True | pubblico, basso, servizio anycast |
| `192.0.0.170/32`, `192.0.0.171/32` | NAT64/DNS64 Discovery | RFC 8880; RFC 7050, Section 2.2 | False | riservato, alto |
| `192.0.2.0/24` | Documentation (TEST-NET-1) | RFC 5737 | False | riservato, alto |
| `192.31.196.0/24` | AS112-v4 | RFC 7535 | True | pubblico, basso |
| `192.52.193.0/24` | AMT | RFC 7450 | True | pubblico, basso |
| `192.88.99.0/24` | Deprecated (6to4 Relay Anycast) | RFC 7526 | nessuno | riservato, alto |
| `192.88.99.2/32` | 6a44-relay anycast address | RFC 6751 | False | riservato, alto, servizio anycast |
| `192.168.0.0/16` | Private-Use | RFC 1918 | False | privato, alto |
| `192.175.48.0/24` | Direct Delegation AS112 Service | RFC 7534 | True | pubblico, basso |
| `198.18.0.0/15` | Benchmarking | RFC 2544 | False | riservato, alto |
| `198.51.100.0/24` | Documentation (TEST-NET-2) | RFC 5737 | False | riservato, alto |
| `203.0.113.0/24` | Documentation (TEST-NET-3) | RFC 5737 | False | riservato, alto |
| `240.0.0.0/4` | Reserved | RFC 1112, Section 4 | False | riservato, alto |
| `255.255.255.255/32` | Limited Broadcast | RFC 8190; RFC 919, Section 7 | False | riservato, alto |

Dentro `192.0.0.0/24` decide la nota del registro: la /24 non è utilizzabile se non in virtù di una riserva più specifica («Not useable unless by virtue of a more specific reservation»), quindi prevale la riga più specifica. `100.100.100.200`, un indirizzo di metadati cloud, si trova nello Shared Address Space e viene valutato metadati cloud, con il nome di quella riga.

### IPv6

| Blocco | Nome IANA | RFC | Globally Reachable | Valutazione |
|---|---|---|---|---|
| `::1/128` | Loopback Address | RFC 4291 | False | loopback, alto |
| `::/128` | Unspecified Address | RFC 4291 | False | riservato, alto |
| `::ffff:0:0/96` | IPv4-mapped Address | RFC 4291 | False | in base all’indirizzo IPv4 contenuto |
| `64:ff9b::/96` | IPv4-IPv6 Translat. | RFC 6052 | True | in base all’indirizzo IPv4 contenuto |
| `64:ff9b:1::/48` | IPv4-IPv6 Translat. | RFC 8215 | False | in base all’indirizzo IPv4 contenuto, mai al di sotto di riservato |
| `100::/64` | Discard-Only Address Block | RFC 6666 | False | riservato, alto |
| `100:0:0:1::/64` | Dummy IPv6 Prefix | RFC 9780 | False | riservato, alto |
| `2001::/23` | IETF Protocol Assignments | RFC 2928 | False | riservato, alto |
| `2001::/32` | TEREDO | RFC 4380; RFC 8190 | N/A | in base al più interno dei due indirizzi IPv4 contenuti |
| `2001:1::1/128` | Port Control Protocol Anycast | RFC 7723 | True | pubblico, basso, servizio anycast |
| `2001:1::2/128` | Traversal Using Relays around NAT Anycast | RFC 8155 | True | pubblico, basso, servizio anycast |
| `2001:1::3/128` | DNS-SD Service Registration Protocol Anycast | RFC 9665 | True | pubblico, basso, servizio anycast |
| `2001:2::/48` | Benchmarking | RFC 5180; RFC Errata 1752 | False | riservato, alto |
| `2001:3::/32` | AMT | RFC 7450 | True | pubblico, basso |
| `2001:4:112::/48` | AS112-v6 | RFC 7535 | True | pubblico, basso |
| `2001:10::/28` | Deprecated (previously ORCHID) | RFC 4843 | nessuno | riservato, alto |
| `2001:20::/28` | ORCHIDv2 | RFC 7343 | True | pubblico, basso |
| `2001:30::/28` | Drone Remote ID Protocol Entity Tags (DETs) Prefix | RFC 9374 | True | pubblico, basso |
| `2001:db8::/32` | Documentation | RFC 3849 | False | riservato, alto |
| `2002::/16` | 6to4 | RFC 3056 | N/A | in base all’indirizzo IPv4 contenuto |
| `2620:4f:8000::/48` | Direct Delegation AS112 Service | RFC 7534 | True | pubblico, basso |
| `3fff::/20` | Documentation | RFC 9637 | False | riservato, alto |
| `5f00::/16` | Segment Routing (SRv6) SIDs | RFC 9602 | False | riservato, alto |
| `fc00::/7` | Unique-Local | RFC 4193; RFC 8190 | False | privato, alto (`fd00:ec2::254`: metadati cloud) |
| `fe80::/10` | Link-Local Unicast | RFC 4291 | False | link-local, alto |

Alcune righe meritano un commento. Il prefisso di benchmarking è `2001:2::/48` perché l’erratum 1752 ha corretto la RFC 5180, che aveva stampato `2001:0200::/48`; il testo dell’erratum è «The IANA has assigned 2001:0002::/48 for IPv6 benchmarking» ([RFC Errata 1752](https://www.rfc-editor.org/errata/eid1752)). `5f00::/16` contiene gli identificatori di segmento del Segment Routing over IPv6, e le specifiche SRv6 sono pensate per un SR Domain circoscritto o tra SR Domain che collaborano («are intended to be applicable to a contained SR Domain or between collaborating SR Domains», [RFC 9602, sezione 5](https://www.rfc-editor.org/rfc/rfc9602.txt)). `100:0:0:1::/64` è il prefisso IPv6 fittizio che la RFC 9780 raccomanda al posto di un indirizzo di loopback mappato («an IPv4 loopback address mapped to IPv6», [RFC 9780, abstract](https://www.rfc-editor.org/rfc/rfc9780.txt)). Gli indirizzi ORCHIDv2 e DET sono identificatori più che localizzatori: gli ORCHID sono considerati indirizzi non instradabili dal punto di vista del livello di rete («are considered non-routable addresses from the IPv6-layer perspective», [RFC 7343, abstract](https://www.rfc-editor.org/rfc/rfc7343.txt)) e gli HHIT sono indirizzi validi ma non instradabili («are valid, though non-routable, IPv6 addresses», [RFC 9374, sezione 1](https://www.rfc-editor.org/rfc/rfc9374.txt)). Il registro indica comunque entrambi i blocchi come globalmente raggiungibili, quindi lo strumento segue il registro e li valuta pubblici, con il nome del blocco. Per i prefissi di documentazione, la RFC 3849 esprime chiaramente l’intento: gli operatori dovrebbero aggiungere il prefisso all’elenco dello spazio di indirizzi non instradabile («This assignment implies that IPv6 network operators should add this address prefix to the list of non-routeable IPv6 address space», [RFC 3849, sezione 3](https://www.rfc-editor.org/rfc/rfc3849.txt)).

## Gli indirizzi di servizio anycast, e perché vengono valutati pubblici

Cinque righe sono indirizzi di servizio anycast che il registro indica come globalmente raggiungibili: `192.0.0.9` e `2001:1::1` per il Port Control Protocol, `192.0.0.10` e `2001:1::2` per TURN e `2001:1::3` per il DNS-SD Service Registration Protocol. Un sesto, `192.88.99.2`, è l’indirizzo anycast dei relay 6a44, che il registro indica come non globalmente raggiungibile. Lo strumento mantiene la valutazione che deriva dal registro (pubblico per i primi cinque, riservato per il sesto), ma nomina il blocco e aggiunge una segnalazione che indica che si tratta di un indirizzo di servizio anycast per usi speciali, così chi legge lo vede.

Perché segnalarli? Un indirizzo anycast non è una sola macchina: un pacchetto inviato a un indirizzo anycast viene consegnato all’interfaccia di rete topologicamente più vicina che ha quell’indirizzo («A packet sent to an anycast address is delivered to the 'topologically nearest' network interface with the anycast address», [RFC 8155, sezione 6](https://www.rfc-editor.org/rfc/rfc8155.txt)). Per PCP si tratta, per progetto, di un middlebox vicino: gli indirizzi permettono ai client di inviare messaggi di segnalazione al NAT, al firewall o ad altro middlebox compatibile con PCP più vicino sul percorso («transmit signaling messages to their closest PCP-aware on-path NAT, firewall, or other middlebox», [RFC 7723, abstract](https://www.rfc-editor.org/rfc/rfc7723.txt)). `2001:1::3` è un indirizzo anycast fisso, usabile come destinazione degli SRP Update quando non è configurato esplicitamente alcun registrar SRP («a fixed anycast address that can be commonly used as a destination for SRP Updates when no SRP registrar is explicitly configured», [RFC 9665, sezione 10.5](https://www.rfc-editor.org/rfc/rfc9665.txt)). Un server che recupera uno di questi URL può quindi dialogare con apparati sul proprio percorso di rete, cosa che una valutazione solo pubblica nasconderebbe. La valutazione resta pubblica perché è ciò che dice il registro; la segnalazione serve perché una lista di elementi consentiti nomini esplicitamente questi indirizzi invece di lasciarli passare come normali host di Internet. La segnalazione vale anche per un incorporamento: `[64:ff9b::192.0.0.9]` viene valutato pubblico e segnalato, perché l’indirizzo che contiene è l’indirizzo anycast PCP.

## Esempi svolti

I vettori di test di riferimento (golden vectors) dello strumento fissano ogni esempio qui sotto, insieme a un vettore per ogni riga del registro.

| Input | Valutazione | Perché |
|---|---|---|
| `http://2852039166/latest/meta-data/` | metadati cloud, alto | forma decimale di `169.254.169.254` (il pulsante Esempio) |
| `http://[::ffff:7f00:1]/` | loopback, alto | IPv4-mapped, contiene `127.0.0.1` |
| `http://[0:0:0:0:0:0:0:1]/` | loopback, alto | una grafia estesa di `::1` |
| `http://[::7f00:1]/` | loopback, alto | IPv4-compatible (deprecato), contiene `127.0.0.1` |
| `http://[64:ff9b::169.254.169.254]/` | metadati cloud, alto | NAT64 Well-Known Prefix, contiene `169.254.169.254` |
| `http://[2002:7f00:1::]/` | loopback, alto | 6to4, contiene `127.0.0.1` |
| `http://[2001:0:808:808:0:feae:80ff:fffe]/` | loopback, alto | Teredo, il campo client contiene `127.0.0.1` |
| `http://[2001:0:a9fe:a9fe:8000:feae:fefd:fcfb]/` | metadati cloud, alto | Teredo, il server è `169.254.169.254` |
| `http://[2001:2::1]/` | riservato, alto | Benchmarking, `2001:2::/48` |
| `http://[5f00::1]/` | riservato, alto | Segment Routing (SRv6) SIDs, `5f00::/16` |
| `http://192.88.99.1/` | riservato, alto | Deprecated (6to4 Relay Anycast), nessun valore Globally Reachable |
| `http://192.0.0.10/` | pubblico, basso, segnalato | indirizzo di servizio anycast TURN |
| `http://[2001:1::3]/` | pubblico, basso, segnalato | indirizzo anycast del DNS-SD Service Registration Protocol |
| `http://192.31.196.1/` | pubblico, basso, con nome | AS112-v4 |

## Schemi, credenziali e l’ignoto dichiarato

Oltre all’indirizzo, lo strumento segnala gli schemi URL pericolosi (quelli diversi da `http` e `https` di cui i payload SSRF abusano spesso) e le credenziali incorporate nella forma `user:pass@host`. Su un punto è attento a essere onesto: un semplice nome host che non è un nome speciale noto viene indicato come risolto in fase di esecuzione, senza tentare di indovinare, perché lo strumento non esegue mai la risoluzione DNS. È la risposta veritiera, ed è anche il motivo per cui lo strumento è sicuro: classifica ciò che dice l’URL invece di contattare qualcosa.

## Come si usa

Incolla un URL, oppure premi Esempio, e leggi la sua classificazione, la destinazione decodificata, l’indirizzo IPv4 incorporato con la sua riga del registro, entrambi gli indirizzi Teredo quando sono due, il blocco per usi speciali, eventuali segnalazioni di anycast o di deprecazione, eventuali schemi o credenziali segnalati e il livello di rischio SSRF. Tutto viene calcolato in locale; non viene mai fatta alcuna richiesta.

## Condivisione dei risultati

Dopo la risposta (il verdetto, i dati e le segnalazioni), **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` l’URL con l’eventuale password prima della `@` sostituita da `[redacted]`. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.2.1, consultata il 01/11/2026) depreca `user:password` nella userinfo e dice che le applicazioni non dovrebbero mostrare in chiaro nulla di ciò che segue i primi due punti («should not render as clear text any data after the first colon»). La pagina non mostra mai la userinfo, solo il fatto che c’è, quindi la copia si legge allo stesso modo; viene classificata di nuovo prima che venga proposto il link e, quando non si leggerebbe allo stesso modo (un URL senza `//`, la cui «password» la pagina mostra come parte del percorso), il link non viene creato e il riquadro a comparsa ti chiede di rimuoverla. Un nome utente da solo resta così come l’hai inserito, perché può essere proprio il trucco che si sta studiando (`http://expected-host@internal/`); il riquadro a comparsa lo segnala nel caso si tratti di un token. Un JWT o un ID della chiave di accesso AWS nel percorso o nella query blocca il link, e un nome come `access_token=` nella query viene indicato nel riquadro a comparsa. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** L’URL compila la casella come farebbe un incolla e la pagina lo classifica, in locale: nessuna risoluzione DNS e nessuna richiesta. I valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## API

Lo stesso motore risponde all’operazione `/api/v1/ssrf-url-classifier` dell’API HTTP del sito, descritta campo per campo nel contratto OpenAPI della [pagina dell’API](/api), con esempi presi dai vettori di test di riferimento. Il contratto indica anche se questo sito serve l’API.

- **Richiesta.** L’URL o l’host come testo: `?input=` in GET, oppure come corpo di una POST.
- **Risposta.** Le parti dell’URL (`scheme`, `host`, `port`, `path`, `hasUserinfo`, `schemeFlag`), l’indirizzo (`isIp`, `ipVersion`, `canonicalIp`, `obfuscated`, `obfuscationForm`), la valutazione (`category`, `risk`, `reasons` in inglese) e la decodifica: `embedding` (`ipv4-mapped`, `ipv4-compatible`, `nat64-wkp`, `nat64-local`, `6to4`, `teredo` oppure `null`), `embeddedIpv4` (l’indirizzo che decide), `embeddingLayout`, `specialBlock` e `embeddedSpecialBlock` (ciascuno `{prefix, name, rfc, globallyReachable}` oppure `null`), `teredo` (`serverIpv4`, `clientIpv4`, `clientPort`, `flags` oppure `null`) e `anycastService`. Per `http://[2001:0:808:808:0:feae:80ff:fffe]/` l’API risponde `loopback` / `high`, con server `teredo` `8.8.8.8`, client `127.0.0.1`, porta 337 e flag 0, e `embeddedSpecialBlock` `127.0.0.0/8` «Loopback».
- **Errori.** Viene rifiutato solo un input vuoto: HTTP 400. Un host che lo strumento non sa collocare non è un errore; viene valutato `unresolved` o `internal-name`.

`embedding`, `embeddedIpv4`, `embeddingLayout` e `specialBlock` sono stati aggiunti il 19 ottobre 2026; più tardi, lo stesso giorno, `embedding` ha acquisito `ipv4-compatible` e `teredo`, `specialBlock` è arrivato a coprire ogni riga del registro, sono stati aggiunti `embeddedSpecialBlock`, `teredo` e `anycastService`, e `canonicalIp` per un indirizzo IPv4-compatible è passato alla notazione mista (`::127.0.0.1`).

## Fonti

- [IANA, IPv4 Special-Purpose Address Space, CSV, registro aggiornato l’ultima volta il 09/10/2025](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) (consultato il 26/10/2026): tutte le 25 righe; la nota [2] dall’[edizione XML](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xml)
- [IANA, IPv6 Special-Purpose Address Space, CSV, registro aggiornato l’ultima volta il 09/10/2025](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv) (consultato il 26/10/2026): tutte le 25 righe; le note da [1] a [4] e la definizione di Globally Reachable dall’[edizione XML](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xml)
- [RFC 4291, IP Version 6 Addressing Architecture, febbraio 2006](https://www.rfc-editor.org/rfc/rfc4291.txt) (consultata il 19/10/2026): sezione 2.2 (forme testuali), sezioni 2.5.5.1 e 2.5.5.2 (IPv4-compatible e IPv4-mapped)
- [RFC 5952, A Recommendation for IPv6 Address Text Representation, agosto 2010](https://www.rfc-editor.org/rfc/rfc5952.txt) (consultata il 19/10/2026): sezioni 4 e 5
- [RFC 6052, IPv6 Addressing of IPv4/IPv6 Translators, ottobre 2010](https://www.rfc-editor.org/rfc/rfc6052.txt) (consultata il 19/10/2026): sezioni da 2.1 a 2.4 e 3.1
- [RFC 8215, Local-Use IPv4/IPv6 Translation Prefix, agosto 2017](https://www.rfc-editor.org/rfc/rfc8215.txt) (consultata il 19/10/2026): sezioni 1, 4.1 e 5
- [RFC 3056, Connection of IPv6 Domains via IPv4 Clouds, febbraio 2001](https://www.rfc-editor.org/rfc/rfc3056.txt) (consultata il 19/10/2026): sezione 2
- [RFC 4380, Teredo: Tunneling IPv6 over UDP through Network Address Translations (NATs), febbraio 2006](https://www.rfc-editor.org/rfc/rfc4380.txt) (consultata il 19/10/2026): sezioni 2.6 e 4
- [RFC 5991, Teredo Security Updates, settembre 2010](https://www.rfc-editor.org/rfc/rfc5991.txt) (consultata il 19/10/2026): sezione 3.1
- [RFC 6751, Native IPv6 behind IPv4-to-IPv4 NAT Customer Premises Equipment (6a44), ottobre 2012](https://www.rfc-editor.org/rfc/rfc6751.txt) (consultata il 19/10/2026): sezioni 5 e 8
- [RFC 7526, Deprecating the Anycast Prefix for 6to4 Relay Routers, maggio 2015](https://www.rfc-editor.org/rfc/rfc7526.txt) (consultata il 19/10/2026): sezioni 4 e 7
- [RFC 7723, Port Control Protocol (PCP) Anycast Addresses, gennaio 2016](https://www.rfc-editor.org/rfc/rfc7723.txt) (consultata il 19/10/2026): abstract e sezione 1
- [RFC 8155, Traversal Using Relays around NAT (TURN) Server Auto Discovery, aprile 2017](https://www.rfc-editor.org/rfc/rfc8155.txt) (consultata il 19/10/2026): sezioni 6 e 8
- [RFC 9665, Service Registration Protocol for DNS-Based Service Discovery, giugno 2025](https://www.rfc-editor.org/rfc/rfc9665.txt) (consultata il 19/10/2026): sezione 10.5
- [RFC Errata 1752 per la RFC 5180, IPv6 Benchmarking Methodology for Network Interconnect Devices](https://www.rfc-editor.org/errata/eid1752) (consultato il 19/10/2026): il prefisso di benchmarking corretto
- [RFC 7343, An IPv6 Prefix for Overlay Routable Cryptographic Hash Identifiers Version 2 (ORCHIDv2), settembre 2014](https://www.rfc-editor.org/rfc/rfc7343.txt) (consultata il 19/10/2026): abstract
- [RFC 9374, DRIP Entity Tag (DET) for Unmanned Aircraft System Remote ID (UAS RID), marzo 2023](https://www.rfc-editor.org/rfc/rfc9374.txt) (consultata il 19/10/2026): sezione 1
- [RFC 9602, Segment Routing over IPv6 (SRv6) Segment Identifiers in the IPv6 Addressing Architecture, ottobre 2024](https://www.rfc-editor.org/rfc/rfc9602.txt) (consultata il 19/10/2026): sezioni 5 e 6
- [RFC 9780, Bidirectional Forwarding Detection (BFD) for Multipoint Networks over Point-to-Multipoint MPLS Label Switched Paths (LSPs), maggio 2025](https://www.rfc-editor.org/rfc/rfc9780.txt) (consultata il 19/10/2026; MPLS sta per Multiprotocol Label Switching): abstract
- [RFC 3849, IPv6 Address Prefix Reserved for Documentation, luglio 2004](https://www.rfc-editor.org/rfc/rfc3849.txt) (consultata il 19/10/2026): sezioni 2 e 3
- [RFC 9637, Expanding the IPv6 Documentation Space, agosto 2024](https://www.rfc-editor.org/rfc/rfc9637.txt) (consultata il 19/10/2026): abstract e IANA considerations
- [RFC 6666, A Discard Prefix for IPv6, agosto 2012](https://www.rfc-editor.org/rfc/rfc6666.txt) (consultata il 19/10/2026): sezioni 2 e 4
- [RFC 7050, Discovery of the IPv6 Prefix Used for IPv6 Address Synthesis, novembre 2013](https://www.rfc-editor.org/rfc/rfc7050.txt) (consultata il 19/10/2026): sezione 2.2
- [WHATWG, URL Standard, Living Standard aggiornato l’ultima volta il 19 ottobre 2026](https://url.spec.whatwg.org/) (consultato il 19/10/2026): il serializzatore IPv6
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, gennaio 2005](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 01/11/2026): sezione 3.5, il frammento, e sezione 3.2.1, la password nella userinfo
