## Cosa fa

Tre campi: una dimensione, una velocità e un tempo. Ognuno viene spiegato da solo; due qualsiasi danno il terzo.

- **Una dimensione** («1,5 GB», «700 MiB», «10K», «8 bit», «2 kilobyte») viene restituita come numero esatto di bit e di byte, come valore in ogni unità di entrambe le convenzioni (bit con prefissi SI e binari, byte con prefissi SI, byte con prefissi IEC) e, quando l’etichetta era un prefisso SI sui byte, come la stessa etichetta letta nei due modi, con la differenza tra le due letture.
- **Una velocità** («100 Mbit/s», «12,5 MB/s», «1 Gbps», «56k») viene restituita in bit e in byte al secondo, in ogni unità di velocità, e come quantità trasferita in un minuto, in un’ora e in un giorno.
- **Un tempo** («90 s», «2h 30min», «1 giorno») viene letto in modo esatto, al millisecondo. Le unità sono ms, s, min, h e d, oppure scritte per esteso in inglese, portoghese, spagnolo, tedesco o francese (seconds, minutes, hours, days; segundos, minutos, horas, dias o días; Sekunden, Minuten, Stunden, Tage; secondes, heures, jours, o j per un giorno).
- **Due delle tre** danno la terza: la dimensione divisa per la velocità è il tempo di trasferimento (con le sue parti), la dimensione divisa per il tempo è la velocità ottenuta, la velocità per il tempo è la quantità trasferita. Con tutte e tre, il tempo viene ricalcolato da dimensione e velocità.
- **L’efficienza** riduce la velocità in proporzione: un preset per TCP su IPv4 su Ethernet, TCP su IPv6, UDP su IPv4, oppure una percentuale qualsiasi.
- **La tabella delle connessioni** risponde alla domanda sul tempo di trasferimento per una serie di link standard in un colpo solo, con l’efficienza scelta.

## I due tipi di kilo

In informatica i prefissi hanno due significati, e il calcolatore li tiene distinti con la grafia, come fanno gli standard:

- **I prefissi SI sono decimali.** k vale 1000, M vale 1.000.000 e così via; un kilobyte (kB) è 1000 byte, un megabit (Mbit) è 1.000.000 di bit. È ciò che i prefissi significano in ogni altro ambito scientifico, ed è ciò che intendono i produttori di dischi e di apparati di rete.
- **I prefissi binari IEC sono potenze di 1024.** La IEC li ha approvati nel dicembre 1998 (IEC 60027-2, emendamento 2, pubblicato nel gennaio 1999; oggi IEC 80000-13): kibi Ki 2^10, mebi Mi 2^20, gibi Gi 2^30, tebi Ti 2^40, pebi Pi 2^50, exbi Ei 2^60. Un kibibyte (KiB) è 1024 byte; un mebibyte (MiB) è 1.048.576 byte. Il NIST precisa che non fanno parte del SI.
- **La vecchia abitudine.** Prima del 1998, e ancora in alcuni software, «KB» e «MB» significavano 1024 e 1.048.576 byte. La differenza cresce con il prefisso: 2,4% per kilo, 4,86% per mega, 7,37% per giga, 10% per tera, 12,6% per peta. Un disco da «1 TB» contiene 1.000.000.000.000 di byte, che un sistema che conta in potenze di 1024 mostra come 931 GiB e può etichettare «931 GB»; non manca nulla. Il calcolatore stampa entrambe le letture per qualsiasi etichetta SI sui byte, così la questione non va mai discussa.

Come viene letto l’input:

- `b` è un bit e `B` un byte; sono accettati `bit`, `bits`, `byte`, `bytes` e `octet`, e i prefissi scritti per esteso (kilobyte, mebibit).
- `k`, `K`, `M`, `G`, `T`, `P`, `E`, `Z` sono decimali; `Ki`, `Mi`, `Gi`, `Ti`, `Pi`, `Ei`, `Zi` sono binari.
- Un prefisso da solo, senza unità (`10K`, `1.5M`), viene letto come potenza di 1024 di byte, che è il modo in cui `ls -h` e `du -h` stampano le dimensioni (la pagina di GNU ls: K, M, G, T, P, E, Z, Y, R, Q sono potenze di 1024, KB, MB e così via potenze di 1000, e KiB equivale a K); il risultato lo segnala.
- `Kb`, `Mb`, `Gb` (un prefisso maiuscolo con una b minuscola) vengono letti come bit, che è ciò che indica il simbolo, e segnalati, perché alcune schede prodotto scrivono così i byte.
- Una velocità è una dimensione seguita da `/s` o `ps`: `Mbit/s`, `MB/s`, `Mbps`, `kbps`. Un `56k` da solo, come velocità, vale 56.000 bit/s.
- In input sia la virgola sia il punto valgono come separatore decimale (`1,5 GB` e `1.5 GB` sono la stessa dimensione); i risultati vengono stampati con il separatore della lingua della pagina.

## Preset di efficienza

La velocità nominale di un link conta ogni bit trasmesso. Il payload viaggia più lentamente, perché ogni frame porta intestazioni, un preambolo e un intervallo. Per frame pieni da 1500 byte:

| Preset | Payload per frame | Trasmessi per frame | Efficienza |
|---|---|---|---|
| TCP su IPv4 su Ethernet | 1500 - 20 (IPv4) - 20 (TCP) = 1460 | 1500 + 14 + 4 + 8 + 12 = 1538 | 94,93% |
| TCP su IPv6 su Ethernet | 1500 - 40 (IPv6) - 20 (TCP) = 1440 | 1538 | 93,63% |
| UDP su IPv4 su Ethernet | 1500 - 20 (IPv4) - 8 (UDP) = 1472 | 1538 | 95,71% |

Le dimensioni minime delle intestazioni vengono dalla RFC 791 (IPv4, 20 ottetti), dalla RFC 8200 (IPv6, 40 ottetti, indicata nella sua sezione 8.3 come 20 ottetti più lunga dell’intestazione IPv4 minima), dalla RFC 9293 (TCP, 20 ottetti) e dalla RFC 768 (UDP, 8 ottetti). L’overhead del frame è quello dell’appendice B della RFC 2544, «Maximum frame rates reference»: «Preamble 64 bits, Frame 8 x N bits, Gap 96 bits», dove N è il frame comprensivo dell’intestazione da 14 byte e dell’FCS da 4 byte; gli 812 frame al secondo da 1518 byte a 10 Mb/s della stessa appendice corrispondono a 10.000.000 / (1538 × 8), e il vettore di test di riferimento `rfc2544-frame-time` lo riproduce. Questi preset sono limiti massimi: un trasferimento TCP reale consuma capacità anche per gli acknowledgement, lo slow start e le ritrasmissioni.

## La tabella delle connessioni

| Link | Velocità nominale | Fonte |
|---|---|---|
| Modem 56k | 56.000 bit/s in downstream | ITU-T V.90 (09/98) |
| ISDN, un canale B | 64 kbit/s | la tabella del calcolatore del 2004 |
| T1 | 1544 kbit/s | ITU-T G.704 (10/98) |
| E1 | 2048 kbit/s | ITU-T G.704 (10/98) |
| Ethernet da 10 Mb/s a 400 Gb/s | 10, 100, 1000 Mb/s; 2,5, 5, 10, 25, 40, 100, 400 Gb/s | IEEE 802.3-2022 |

Le righe indicate con 2004 si trovavano nella tabella delle connessioni del calcolatore di bit e byte su nutzmann.net nel 2004 e su ntz.com.br nel 2013, il più antico antenato degli strumenti di questo sito. Il suo esempio svolto è quello del pulsante Esempio: un file da «56k» su un modem da «56k» richiede circa 8,2 secondi, non uno, perché il file è di 56 KiB (57.344 byte, 458.752 bit) e il modem trasferisce 56.000 bit al secondo: esattamente 8,192 s.

## Esattezza

Ogni quantità è conservata come mantissa intera e potenza di dieci, e ogni velocità e ogni tempo come rapporto tra due numeri di questo tipo, quindi nulla viene arrotondato finché non viene stampato. I valori stampati mantengono fino a sei decimali; un valore la cui forma esatta non è un decimale finito (un terzo di secondo) viene segnalato come arrotondato. Le durate vengono suddivise in giorni, ore, minuti, secondi e millisecondi, arrotondate al millisecondo più vicino (le metà per eccesso), e il totale viene indicato anche in secondi con sei decimali. Uno zettabyte in bit viene scritto per intero.

## Condivisione dei risultati

Sotto la prima risposta, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` i campi che hai compilato, così come li hai inseriti: `size`, `rate`, `time` ed `eff` (l’efficienza, un preset o una percentuale): `/tools/bits-bytes#size=56+KiB&rate=56+kbit%2Fs`. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi i valori non vengono inviati al server quando si apre il link; restano nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerli.

- **Apertura di un link.** I quattro campi vengono impostati insieme, e quelli assenti vengono svuotati, così il risultato è quello di chi ha condiviso il link; la pagina esegue il calcolo. Un valore più lungo di quanto il suo campo possa contenere fa ignorare l’intero link. In ogni caso i valori lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
- **Link da altre pagine.** Una dimensione passata come `#input=` compila ancora il campo della dimensione esattamente come prima; Condividi i risultati usa nomi propri, quindi le due forme non si mescolano mai.

## Limiti

- Non vengono modellati: le finestre TCP e il tempo di andata e ritorno, le perdite, la compressione e la differenza tra la velocità nominale di un link e ciò che un fornitore offre davvero. I preset di efficienza sono limiti massimi per frame.
- Il calcolatore indica che cosa significa un’etichetta in ciascuna convenzione. Quale convenzione usi un determinato sistema operativo per mostrare le dimensioni deve dirlo la documentazione di quel sistema; il calcolatore non lo afferma.
- Ogni campo viene troncato a 64 caratteri e letto da un’unica espressione ancorata; l’aritmetica usa BigInt, quindi nessun valore va in overflow.

## Fonti

- [NIST: Prefixes for binary multiples](https://physics.nist.gov/cuu/Units/binary.html) (consultata il 04/10/2026)
- [ls(1), GNU coreutils (man7.org)](https://man7.org/linux/man-pages/man1/ls.1.html) (consultata il 04/10/2026): -h, --si e l’argomento SIZE
- [RFC 2544, Appendix B, Maximum frame rates reference](https://www.rfc-editor.org/rfc/rfc2544.html#page-22) (consultata il 26/10/2026)
- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791) (consultata il 04/10/2026)
- [RFC 8200: IPv6, section 8.3](https://www.rfc-editor.org/rfc/rfc8200.html#section-8.3) (consultata il 04/10/2026)
- [RFC 9293: TCP](https://www.rfc-editor.org/rfc/rfc9293) (consultata il 04/10/2026)
- [RFC 768: UDP](https://www.rfc-editor.org/rfc/rfc768) (consultata il 04/10/2026)
- [ITU-T V.90 (09/98)](https://www.itu.int/rec/T-REC-V.90/en) (consultata il 04/10/2026)
- [ITU-T G.704 (10/98)](https://www.itu.int/rec/T-REC-G.704/en) (consultata il 04/10/2026)
- [IEEE 802.3-2022](https://standards.ieee.org/ieee/802.3/10422/) (consultato il 04/10/2026)
- [nutzmann.net, Calculadora de bits e bytes (2004), Internet Archive](https://web.archive.org/web/20041009131549/http://nutzmann.net:80/bitsandbytes.htm) (consultato il 04/10/2026): l’esempio svolto del calcolatore del 2004, la sua nota sulla IEC e la sua tabella delle connessioni
- [ntz.com.br, Calculadora e conversão de bits e bytes (2013), Internet Archive](https://web.archive.org/web/2013/http://ntz.com.br/bitsandbytes.html) (consultato il 04/10/2026): lo stesso calcolatore sul sito del 2013, con la sua tabella dei prefissi IEC
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
