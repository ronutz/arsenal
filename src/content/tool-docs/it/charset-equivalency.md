## Cosa fa

Un byte non significa nulla finché qualcuno non dice in quale charset è. `E9` è é in windows-1252, Ú in IBM 850 e Z in EBCDIC, e in UTF-8 non è affatto un carattere, ma solo il primo byte di uno. Lo strumento mostra lo stesso testo e gli stessi byte attraverso quattordici charset insieme, decodifica i byte esattamente come li decodifica un browser e ripara il danno quando un testo è stato letto con il charset sbagliato.

Ha tre modalità:

- **Da testo a byte** scrive un testo in un charset, in sei notazioni, carattere per carattere, e indica cosa è successo a ogni carattere che il charset non può contenere. Mostra poi lo stesso testo in ogni charset e come quei byte si rileggono in ogni charset: il mojibake prodotto da ogni ipotesi sbagliata.
- **Da byte a testo** legge byte inseriti in esadecimale o incollati da un dump esadecimale, come sequenze di escape, come %XX o in Base64, li decodifica con il charset che scegli o con quello che rileva ed elenca ogni sequenza che ha dovuto sostituire, con il motivo. Mostra anche cosa ricava ogni charset dagli stessi byte.
- **Correggi mojibake** prende un testo alterato, come `cafÃ©`, trova il charset che l’ha letto male e quello in cui erano davvero i byte, e restituisce l’originale, con i passaggi e la solidità dell’indizio.

## I quattordici charset

| Charset | Byte per carattere | Cosa ne fa un browser |
|---|---|---|
| UTF-8 | da 1 a 4 | Lo decodifica; il WHATWG Encoding Standard lo richiede per i nuovi contenuti |
| UTF-16LE, UTF-16BE | 2 o 4 | Li decodifica entrambi («utf-16» è un’etichetta di UTF-16LE); non li codifica mai |
| UTF-32LE, UTF-32BE | 4 | Non supportati |
| US-ASCII | 1 (sette bit) | Le etichette «ascii» e «us-ascii» indicano windows-1252 |
| ISO-8859-1 (Latin-1) | 1 | Le etichette «iso-8859-1» e «latin1» indicano windows-1252 |
| windows-1252 | 1 | Lo decodifica |
| ISO-8859-15 (Latin-9) | 1 | Lo decodifica |
| Mac OS Roman | 1 | Lo decodifica (etichetta «macintosh») |
| IBM 437 (DOS, Stati Uniti) | 1 | Non supportato |
| IBM 850 (DOS, Europa occidentale) | 1 | Non supportato |
| IBM 037 e IBM 500 (EBCDIC) | 1 | Non supportati |

Le tabelle di windows-1252, ISO-8859-15 e Mac OS Roman sono gli indici del WHATWG Encoding Standard, quindi corrispondono a ciò che decodifica un browser. Le tabelle IBM sono le tabelle di mapping dei vendor archiviate dallo Unicode Consortium, che le conserva solo a scopo storico e d’archivio («only for historical and archival purposes») e senza garantire che corrispondano a una determinata piattaforma. Ogni tabella è stata confrontata byte per byte con i codec di CPython 3.11 e con l’iconv di glibc 2.39 il 3 ottobre 2026. Le differenze:

- **windows-1252, byte 0x81, 0x8D, 0x8F, 0x90 e 0x9D.** Lo standard WHATWG li associa ai caratteri di controllo C1 U+0081, U+008D, U+008F, U+0090 e U+009D; la tabella di Microsoft, CPython e iconv li lasciano non definiti. Lo strumento segue lo standard WHATWG, quindi ogni byte viene decodificato e la decodifica non perde mai informazioni.
- **Mac OS Roman in iconv.** glibc associa 0xC6 a U+0394 e 0xF0 a U+E01E, dove la tabella di Apple e lo standard WHATWG hanno U+2206 e U+F8FF.

## Decodificare come decodifica un browser

I decodificatori UTF-8 e UTF-16 seguono passo passo il WHATWG Encoding Standard. Quando una sequenza è malformata, un solo U+FFFD ne sostituisce la parte massimale (maximal subpart): la sequenza di byte più lunga che avrebbe ancora potuto iniziare un carattere ben formato, oppure un singolo byte. Lo Unicode Standard descrive la stessa pratica nella sezione 3.9.6, e le sue tabelle da 3-8 a 3-11 sono tra gli esempi pronti. Ogni sequenza sostituita ha un nome:

| Motivo | Byte UTF-8 | Cosa significa |
|---|---|---|
| Byte di continuazione isolato | da 80 a BF dove inizia un carattere | manca il suo primo byte, oppure i dati non sono UTF-8 |
| C0 o C1 | C0, C1 | potrebbe solo iniziare una forma a due byte di un carattere ASCII |
| Da F5 a FF | da F5 a FF | non compare mai in UTF-8 |
| Forma troppo lunga | E0 80-9F, F0 80-8F | una forma più lunga di un code point che ne ha una più corta |
| Surrogato | ED A0-BF | da U+D800 a U+DFFF, che UTF-8 non può trasportare |
| Oltre U+10FFFF | F4 90-BF | oltre l’ultimo code point |
| Interrotta | un byte iniziale, poi qualcos’altro | i byte letti fino a quel punto diventano un solo U+FFFD |

UTF-16 sostituisce i surrogati spaiati e un byte dispari in avanzo; UTF-32, che i browser non decodificano, segue le definizioni D99 e D100 dello Unicode Standard e sostituisce ogni unità di quattro byte che è un surrogato o va oltre U+10FFFF.

**Byte order mark.** Con «Lascia decidere il charset al byte order mark» attivo (l’impostazione predefinita), i dati che iniziano con EF BB BF, FE FF o FF FE vengono decodificati come UTF-8, UTF-16BE o UTF-16LE qualunque sia il charset scelto, e il marcatore non fa parte del testo: lo standard WHATWG considera il marcatore più autorevole di un’etichetta. Lo strumento riconosce anche i marcatori UTF-32 00 00 FE FF e FF FE 00 00, che un browser non riconosce: il browser prende l’FF FE di FF FE 00 00 per il marcatore di UTF-16LE e decodifica il resto come UTF-16LE (Chromium 141, misurato il 03/10/2026).

**Rileva.** Con il charset impostato su Rileva, lo strumento spiega perché ne ha scelto uno: un byte order mark; tutti i byte ASCII (allora ogni charset compatibile con ASCII legge lo stesso testo); UTF-8 ben formato con caratteri oltre l’ASCII; byte a zero dove li mette il testo ASCII in UTF-16 o UTF-32; oppure lo schema tipico di EBCDIC (0x40 frequente, nessuno spazio ASCII, la maggior parte dei byte sopra 0x80). Altrimenti dice che non c’è un’unica risposta, e la risposta è la tabella delle letture.

## Lettura dei byte dalla casella

| Formato | Esempio |
|---|---|
| Esadecimale, con qualsiasi separatore, con o senza 0x o \x | `C3 A9`, `c3a9`, `0xC3, 0xA9`, `{ 0xC3, 0xA9 }` |
| Un dump esadecimale | l’output di `hexdump -C`, `xxd` o `od -Ax -tx1`: gli offset e la colonna ASCII vengono ignorati |
| Sequenze di escape | `\xC3\xA9`, `b'caf\xc3\xa9'` (Python), `caf\303\251` (è così che git racchiude tra virgolette i nomi dei file) |
| Percent-encoding | `caf%C3%A9`, letto come lo legge il WHATWG URL Standard: un % non seguito da due cifre esadecimali resta un % |
| Base64 | alfabeto standard o URL-safe, padding facoltativo |

Un dump esadecimale viene riconosciuto quando ogni riga inizia con un offset e gli offset avanzano della larghezza della riga, così la colonna ASCII non viene mai letta come byte, anche quando per caso sembra esadecimale.

## Scrittura dei byte

Le sei notazioni: coppie esadecimali; il formato di `hexdump -C`; un array C; un letterale bytes di Python (esattamente come lo scrive `repr()` di Python); Base64 (RFC 4648, sezione 4); e il percent-encoding, che lascia invariati i caratteri non riservati della RFC 3986. Ognuna è stata confrontata con il proprio riferimento: `hexdump -C` di util-linux, `repr()` di CPython, `base64` e `urllib.parse.quote`.

**I caratteri che un charset non può contenere** vengono scritti come `?` (come fa la maggior parte dei convertitori), come riferimento HTML decimale, ad esempio `&#8364;` (come fa un browser quando un modulo viene inviato in un charset del genere: è la modalità di errore «html» dello standard WHATWG, che il server non riesce a distinguere da una persona che digita quei caratteri), oppure non vengono scritti affatto (modalità rigorosa).

## Correzione del mojibake

Il mojibake è reversibile quando il charset sbagliato non ha perso nulla: ricodifica il testo alterato con il charset che l’ha letto male e decodifica i byte con quello giusto. Lo strumento ci prova su due livelli:

1. **UTF-8 letto come un charset a un byte** (windows-1252, ISO-8859-1, ISO-8859-15, Mac OS Roman, IBM 437, IBM 850). Annullare l’errore deve produrre UTF-8 ben formato, che i byte oltre l’ASCII formano raramente per caso: un indizio forte. Fino a tre passaggi annullano un testo letto male più di una volta (`Ã¢â‚¬â„¢` è ’ letto male due volte).
2. **Un charset a un byte letto come un altro**, ad esempio un file IBM 850 mostrato come windows-1252 (`a‡Æo` per ação), oppure EBCDIC mostrato come Latin-1. In questi charset ogni byte viene decodificato, quindi lo strumento tiene una lettura solo quando ottiene un punteggio migliore su una misura del mojibake (le coppie che UTF-8 lascia dietro di sé, simboli dentro le parole, maiuscole dentro parole minuscole, caratteri di controllo, caratteri per il disegno di riquadri, parole che mescolano sistemi di scrittura) e indica l’indizio come più debole.

Quando un byte è andato perso per strada (spesso l’ultimo byte di ” o ™, che windows-1252 trasforma in un carattere di controllo invisibile), un passaggio tollerante recupera il resto e segna ogni carattere perso con U+FFFD. **Guarda come si altera** passa alla modalità Da testo a byte con il testo corretto, e la tabella delle riletture mostra esattamente come è stato alterato.

Verifica del 3 ottobre 2026: 104 campioni di mojibake su 106, ricavati da quindici testi (UTF-8 letto male come cinque charset, letto male due volte, IBM 850 e windows-1252 letti l’uno come l’altro, EBCDIC letto come Latin-1), sono tornati esattamente all’originale, e i quindici testi stessi sono stati lasciati invariati. I due mancati recuperi riguardano testi brevi: AÇÃO in EBCDIC letto come Latin-1 (`ÁhfÖ`), dove un’altra lettura si classifica prima, e Ça va in windows-1252 letto come IBM 850 (`Ãa va`), che viene lasciato com’è. Su 12.087 testi corretti (paragrafi degli articoli Learn di questo sito in inglese e in portoghese, più sedici frasi in altre lingue, sistemi di scrittura e insiemi di simboli), a nessuno è stata proposta una correzione.

## Condivisione dei risultati

Sotto la prima risposta della modalità in uso, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la casella di quella modalità così come l’hai compilata e le scelte proprie della modalità. Il nome della casella indica la modalità, quindi il link apre esattamente la modalità in cui ti trovavi: `text` per Da testo a byte, con `charset`, `policy`, `bom` e `style` (la notazione dei byte); `bytes` per Da byte a testo, con `format`, `charset` e `sniff` (se decide il byte order mark); `garbled` per Correggi mojibake. Una scelta lasciata al valore predefinito viene omessa. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il testo non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La modalità viene impostata, la sua casella si riempie come farebbe un incolla, le sue scelte vengono impostate e la pagina esegue il calcolo. Due caselle insieme, una scelta che appartiene a un’altra modalità o un valore che la pagina non propone fanno ignorare l’intero link. In ogni caso i valori lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
- **Perché non `#input=`.** Un valore passato come `#input=` apre ancora la modalità a cui somiglia, esattamente come prima. Una condivisione non usa quella forma, perché l’aspetto può ingannare: un testo come `cafe` si legge anche come due byte esadecimali.

## Limiti

- La correzione lavora sull’intero testo. Un testo che mescola caratteri corretti e caratteri alterati viene lasciato invariato: incolla da sola la parte alterata.
- I byte sostituiti con `?` o U+FFFD, o eliminati, non si possono recuperare; la correzione indica quanti caratteri sono andati persi.
- Il rilevamento e il secondo livello di correzione sono euristici. Un indizio forte viene dai byte order mark e dall’UTF-8 ben formato; tutto il resto è indicato come più debole.
- Solo i quattordici charset elencati sopra. I charset multibyte dell’Asia orientale (Shift_JIS, GBK, Big5, EUC-KR) non sono inclusi.
- Vengono decodificati fino a 64 KiB di byte e codificati 20.000 caratteri alla volta; le tabelle elencano le prime 2000 righe; la correzione esamina i primi 2000 caratteri.

## Fonti

- [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/): i decodificatori UTF-8 e UTF-16, il rilevamento del BOM, il decodificatore e il codificatore a un byte, le etichette, le modalità di errore; living standard aggiornato l’ultima volta il 21 maggio 2026 (consultato il 03/10/2026)
- [Indici WHATWG: windows-1252](https://encoding.spec.whatwg.org/index-windows-1252.txt), [ISO-8859-15](https://encoding.spec.whatwg.org/index-iso-8859-15.txt), [macintosh](https://encoding.spec.whatwg.org/index-macintosh.txt) (consultati il 03/10/2026)
- [The Unicode Standard 18.0.0, chapter 3: Conformance](https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-3/): tabella 3-7, sezione 3.9.6 e tabelle da 3-8 a 3-11, definizioni da D95 a D100 (consultato il 03/10/2026)
- [Unicode FAQ: UTF-8, UTF-16, UTF-32 & BOM](https://www.unicode.org/faq/utf_bom.html) (consultate il 03/10/2026)
- [Tabelle di mapping Unicode](https://www.unicode.org/Public/MAPPINGS/): [ReadMe](https://www.unicode.org/Public/MAPPINGS/ReadMe.txt), [CP437](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/PC/CP437.TXT), [CP850](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/PC/CP850.TXT), [CP037](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/EBCDIC/CP037.TXT), [CP500](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/EBCDIC/CP500.TXT), [CP1252](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP1252.TXT), [8859-1](https://www.unicode.org/Public/MAPPINGS/ISO8859/8859-1.TXT), [Apple ROMAN](https://www.unicode.org/Public/MAPPINGS/VENDORS/APPLE/ROMAN.TXT) (consultate il 03/10/2026)
- [RFC 3629: UTF-8](https://www.rfc-editor.org/rfc/rfc3629) (consultata il 03/10/2026)
- [RFC 2781: UTF-16](https://www.rfc-editor.org/rfc/rfc2781) (consultata il 03/10/2026)
- [RFC 4648: Base16, Base32 and Base64](https://www.rfc-editor.org/rfc/rfc4648) (consultata il 03/10/2026)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 03/10/2026); sezione 3.5 (consultata il 27/10/2026): il frammento, che contiene i valori di un link creato con Condividi i risultati
- [WHATWG URL Standard: percent-decode](https://url.spec.whatwg.org/) (consultato il 03/10/2026)
