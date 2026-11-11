## Cosa fa

Un testo può contenere molto più di quanto mostra. Uno spazio a larghezza zero si inserisce tra due lettere senza lasciare traccia, un override da destra a sinistra (right-to-left override) fa apparire una riga di codice in un ordine diverso da quello in cui la legge il compilatore, una «а» cirillica si fa passare per una «a» latina, e un separatore di riga (line separator) inizia una nuova riga nel tuo editor ma non nel tuo parser. L’analizzatore mostra ciò che c’è davvero, un code point alla volta.

Ha quattro modalità:

- **Analizza un testo** conta il testo, dice se c’è qualcosa da controllare, elenca ciò che ha trovato per tipo, segnala i controlli bidirezionali lasciati aperti alla fine di una riga e le parole che mescolano sistemi di scrittura, disegna il testo nell’ordine in cui è memorizzato con ogni carattere nascosto sotto forma di etichetta, elenca ogni code point, offre una copia ripulita e scrive il testo come sequenze di escape in otto linguaggi.
- **Un code point** accetta un code point in qualsiasi notazione (`U+00E9`, `é`, `0xE9`, `&eacute;`, `\u00e9`, `zero width space`, `BOM`) e ne mostra il nome e gli alias, le proprietà, le codifiche, le sequenze di escape e ciò che c’è da sapere.
- **Cerca per nome** elenca i code point il cui nome o alias contiene parole che iniziano con le parole che inserisci.
- **Normalizza** mostra un testo in NFC, NFD, NFKC e NFKD con i code point e i byte UTF-8 di ciascuna forma, e lo confronta con un secondo testo in ogni forma.

## Cosa riporta in un testo

| Rilievo | Che cos’è | Perché conta |
|---|---|---|
| Controllo bidirezionale | Uno dei dodici caratteri Bidi_Control (LRM, RLM, ALM, LRE, RLE, LRO, RLO, PDF, LRI, RLI, FSI, PDI) | Cambia l’ordine in cui viene visualizzato il testo che lo circonda; è la classe di attacchi Trojan Source (CVE-2021-42574) |
| Lasciato aperto a fine riga | Un embedding, un override o un isolate senza PDF o PDI prima della fine della riga | Tutto ciò che lo segue su quella riga può essere visualizzato in un ordine diverso da quello in cui viene letto |
| Invisibile | Default_Ignorable_Code_Point: caratteri a larghezza zero, il BOM, i selettori di variante, i tag | Non viene disegnato, ma i confronti tra stringhe, le lunghezze e gli hash lo vedono |
| Carattere di controllo | Un codice di controllo diverso da TAB, LF e CR | Non è testo; gli strumenti lo scartano, mostrano un riquadro o si fermano |
| Interruzione di riga diversa da LF o CR | VT, FF, NEL (U+0085), LINE SEPARATOR (U+2028), PARAGRAPH SEPARATOR (U+2029) | Un editor e un linguaggio possono non essere d’accordo su dove finisce una riga (UTS #55, spoofing delle interruzioni di riga) |
| Surrogato isolato, non-carattere | Code point che non sono caratteri | Non validi in UTF-8 (i surrogati) o mai destinati all’interscambio (i non-caratteri) |
| Uso privato, non assegnato | Nessun significato pubblico, o ancora nessun carattere | Font e sistemi si comportano in modo diverso, oppure il testo proviene da una versione di Unicode più recente della tua |
| Carattere di sostituzione | U+FFFD | Spesso indica un precedente errore di decodifica |
| Spazio, virgoletta, trattino non ASCII | Lo spazio indivisibile e altri spazi, le virgolette tipografiche, le lineette (en dash ed em dash), il segno meno | Sembrano ASCII; parser e confronti non sono d’accordo |
| Confondibile con ASCII | Un carattere che l’UTS #39 associa a un prototipo ASCII | Caratteri somiglianti: la а cirillica per la a, la ο greca per la o |
| ASCII stilizzato | Un carattere la cui decomposizione di compatibilità è ASCII | Lettere a larghezza piena, legature e simili |
| Parola con sistemi di scrittura misti | Una parola le cui lettere non hanno alcun sistema di scrittura in comune | `pаypal` con una а cirillica; il giapponese che mescola Han, Hiragana e Katakana non viene segnalato |

Il rilevamento dei sistemi di scrittura misti segue l’UTS #39: l’insieme di script esteso (augmented script set) di ogni carattere è il suo Script_Extensions più i sistemi di scrittura che combinano più script (Han aggiunge Hanb, Hntl, Jpan e Kore; Hiragana e Katakana aggiungono Jpan; Hangul aggiunge Kore; Bopomofo aggiunge Hanb; Latin aggiunge Hntl), un carattere Common o Inherited corrisponde a qualsiasi script, e una parola è mista quando l’intersezione di questi insiemi sui suoi caratteri è vuota.

## Il testo, nell’ordine memorizzato

Il riquadro di visualizzazione disegna il testo da sinistra a destra nell’ordine in cui si trova in memoria, con l’override bidirezionale disattivato per il riquadro stesso, quindi nessun controllo presente nel testo può riordinare ciò che vedi. Ogni carattere da controllare diventa un’etichetta con il suo code point; le etichette rosse cambiano significato o ordine, quelle ambra imitano qualcosa. Passa con il puntatore su un’etichetta o portaci il focus per vederne il nome.

## Pulizia

La copia ripulita può rimuovere i caratteri invisibili e bidirezionali, sostituire gli spazi non ASCII con SPACE (e LINE SEPARATOR, PARAGRAPH SEPARATOR e NEL con LF), trasformare virgolette e trattini tipografici in `'`, `"` e `-` e, se lo chiedi, sostituire i caratteri somiglianti con l’ASCII che imitano. Quest’ultima opzione è disattivata per impostazione predefinita, perché modifica anche parole autentiche in cirillico, in greco e in altri sistemi di scrittura.

## Sequenze di escape

L’intero testo può essere scritto in JSON, JavaScript, Python, HTML, CSS, come URL, come stringa C `u8` o come parola tra virgolette Tcl (iRules). Ogni forma trasforma in sequenze di escape i caratteri che il suo linguaggio riserva e tutto ciò che è fuori dall’ASCII stampabile. Quando questo strumento è stato realizzato, ogni forma di 4000 code point distribuiti su tutti e diciassette i piani, e di due testi di prova particolarmente impegnativi, è stata decodificata dal linguaggio stesso (CPython, Node, GCC, Tcl 8.4.6 e Chromium per HTML e CSS), e ognuno è tornato identico.

Alcune forme non possono contenere ogni carattere, e lo strumento lo dice invece di scrivere qualcosa di sbagliato:

- **Tcl 8.4 e iRules** non hanno una sequenza di escape per un carattere oltre U+FFFF: `\u` accetta al massimo quattro cifre esadecimali, e l’interprete Tcl 8.4.6 legge i quattro byte UTF-8 di un carattere del genere come quattro caratteri distinti.
- **HTML** non può contenere un surrogato isolato, e un riferimento da U+0080 a U+009F dà un carattere diverso: 27 di questi 32 riferimenti vengono letti come Windows-1252 (`&#x85;` diventa i puntini di sospensione), quindi lo strumento scrive quei caratteri così come sono.
- **CSS** trasforma uno 0 o un surrogato scritti come sequenza di escape in U+FFFD.
- **C**: gli universal character name non possono indicare un carattere sotto U+00A0 diverso da `$`, `@` e `` ` ``, né un surrogato; per i caratteri da U+0080 a U+009F lo strumento scrive invece in ottale i loro byte UTF-8.
- **Gli URL** codificano in percentuale i byte UTF-8, che un surrogato isolato non ha.

## Un code point

- **Nome.** La proprietà Name; per un carattere di controllo, il suo primo alias formale (i caratteri di controllo non hanno un nome); per qualsiasi altro code point senza nome, la sua etichetta di code point, come `<surrogate-D800>` o `<reserved-0378>`.
- **Alias.** Ogni alias formale con il suo tipo: correzione, nome di controllo, alternativo, fittizio o abbreviazione (`BOM` e `ZWNBSP` per U+FEFF).
- **Proprietà.** General_Category, Block, Script e Script_Extensions, e la versione di Unicode che lo ha aggiunto.
- **Codifiche.** I byte UTF-8, le unità di codice UTF-16 (una coppia di surrogati oltre U+FFFF) e UTF-32.
- **Sequenze di escape e riferimenti.** Le otto forme viste sopra per questo singolo code point, più i riferimenti HTML decimale, esadecimale e con nome, con una nota quando un riferimento non restituisce questo code point.

## Normalizzazione

Lo stesso testo visibile può essere memorizzato come sequenze diverse di code point: é come U+00E9, oppure come e seguita da U+0301 COMBINING ACUTE ACCENT. La modalità **Normalizza** mostra un testo nelle quattro forme di normalizzazione dell’UAX #15, ciascuna con i suoi code point, i suoi byte UTF-8 e l’indicazione se differisce dal testo così come l’hai inserito: NFD (decomposizione canonica), NFC (decomposizione canonica, poi composizione canonica), NFKD (decomposizione di compatibilità) e NFKC (decomposizione di compatibilità, poi composizione canonica).

NFC e NFD mantengono i caratteri di compatibilità come la legatura ﬁ (U+FB01) e le lettere a larghezza piena; NFKC e NFKD li sostituiscono con i loro equivalenti semplici, cosa che secondo l’avvertenza dell’UAX #15 può cancellare distinzioni importanti, quindi le forme K vanno usate dove cancellarle è proprio lo scopo. I singleton come U+212B ANGSTROM SIGN e U+2126 OHM SIGN non sopravvivono in nessuna forma, e i segni combinanti vengono messi in ordine canonico, quindi A, U+030A, U+0323 diventa U+1EA0 U+030A in NFC.

Inserisci un secondo testo in **Confronta con** e lo strumento indica se i due sono uguali così come li hai inseriti e in ciascuna forma: identici, canonicamente equivalenti (uguali in NFC e NFD), uguali solo in NFKC e NFKD, oppure diversi in ogni forma. Il punto è normalizzare entrambi i lati nella stessa forma prima di confrontarli; l’[articolo sulla normalizzazione Unicode](/learn/unicode-normalisation) spiega perché.

Le forme vengono calcolate da `String.prototype.normalize` (ECMA-262, sezione 22.1.3.15) con le tabelle Unicode del motore JavaScript che esegue lo strumento: in questa pagina, il tuo browser. Queste tabelle possono essere più vecchie dei dati 18.0.0 usati dalle altre modalità. La politica di stabilità di Unicode garantisce che un testo composto da caratteri noti a un motore si normalizzi nello stesso risultato in ogni versione successiva, quindi l’unica differenza che un motore più vecchio può introdurre è lasciar passare invariato un carattere più recente delle sue tabelle. Di ogni testo vengono letti al massimo i primi 1000 code point.

## Condivisione dei risultati

Sotto la prima risposta della modalità in uso, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la casella di quella modalità così come l’hai inserita e le scelte proprie della modalità. Il nome della casella indica la modalità: `text` per Analizza un testo, con i quattro interruttori di pulizia (`invisible`, `spaces`, `punct`, `fold`) ed `escape`, il linguaggio in cui viene scritto il testo; `cp` per Un code point; `query` per Cerca per nome; `norm` per Normalizza, con `compare` quando è stato inserito un secondo testo. Una scelta al suo valore predefinito viene omessa. I caratteri nascosti, come i controlli bidirezionali e gli spazi a larghezza zero, viaggiano esattamente come sono. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il testo non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La modalità viene impostata, la sua casella si riempie come farebbe un incolla, le sue scelte vengono impostate e la pagina esegue il calcolo (la tabella dei nomi viene caricata nella pagina, come per un incolla). Due caselle insieme, una scelta che appartiene a un’altra modalità, un valore che la pagina non offre o una casella più lunga del suo campo fanno ignorare l’intero link. In ogni caso i valori lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
- **Link dall’esploratore della tabella ASCII.** Un code point passato come `#input=` apre ancora Un code point esattamente come prima; Condividi i risultati usa nomi propri, quindi i due non si mescolano mai.

## Limiti

- Le colonne si contano in code point, e così le posizioni. Gli editor possono contare invece unità UTF-16 o caratteri percepiti dall’utente.
- Il rilevamento dei sistemi di scrittura misti lavora parola per parola; non controlla interi identificatori attraverso la punteggiatura, e non decide se una mescolanza è legittima.
- I dati sui caratteri confondibili riguardano caratteri che somigliano a testo ASCII. I caratteri confondibili tra due sistemi di scrittura non ASCII sono fuori ambito.
- Lo strumento mostra la visione di Unicode 18.0.0. Un sistema con dati più vecchi potrebbe non conoscere i caratteri aggiunti da allora (con la 18.0 ne sono arrivati 13.007).
- La normalizzazione usa la versione di Unicode del motore JavaScript che la esegue, non la 18.0.0: vedi Normalizzazione più sopra.

## Fonti

- [Unicode Character Database 18.0.0](https://www.unicode.org/Public/18.0.0/ucd/): UnicodeData.txt, DerivedName.txt, NameAliases.txt, PropList.txt, DerivedCoreProperties.txt, Blocks.txt, DerivedAge.txt, Scripts.txt, ScriptExtensions.txt, LineBreak.txt, PropertyValueAliases.txt (consultato il 03/10/2026)
- [UTS #39: Unicode Security Mechanisms (18.0.0) e confusables.txt](https://www.unicode.org/reports/tr39/) (consultati il 03/10/2026)
- [UTS #55: Unicode Source Code Handling](https://www.unicode.org/reports/tr55/) (consultato il 03/10/2026)
- [UAX #9: Unicode Bidirectional Algorithm](https://www.unicode.org/reports/tr9/) (consultato il 03/10/2026)
- [UAX #44: Unicode Character Database](https://www.unicode.org/reports/tr44/) (consultato il 03/10/2026)
- [The Unicode Standard 18.0.0, capitoli 3, 4, 5 e 23](https://www.unicode.org/versions/Unicode18.0.0/) (consultato il 03/10/2026)
- [NVD: CVE-2021-42574](https://nvd.nist.gov/vuln/detail/CVE-2021-42574) (consultata il 03/10/2026)
- [RFC 3629: UTF-8](https://www.rfc-editor.org/rfc/rfc3629) (consultata il 03/10/2026)
- [RFC 2781: UTF-16](https://www.rfc-editor.org/rfc/rfc2781) (consultata il 03/10/2026)
- [RFC 8259: JSON](https://www.rfc-editor.org/rfc/rfc8259) (consultata il 03/10/2026)
- [ECMA-262: ECMAScript Language Specification](https://tc39.es/ecma262/) (consultata il 03/10/2026)
- [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) (consultato il 03/10/2026)
- [ISO/IEC 9899:2011, bozza del comitato N1570 (C11), 6.4.3](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) (consultata il 03/10/2026)
- [Manuale di Tcl 8.4: Tcl](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (consultato il 03/10/2026)
- [WHATWG HTML: parsing (numeric character references)](https://html.spec.whatwg.org/multipage/parsing.html) (consultata il 03/10/2026)
- [WHATWG HTML: named character references](https://html.spec.whatwg.org/entities.json) (consultata il 03/10/2026)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 03/10/2026); sezione 3.5 (consultata il 27/10/2026): il frammento, che contiene i valori di un link creato con Condividi i risultati
- [UAX #15: Unicode Normalization Forms, revisione 58 (Unicode 18.0.0)](https://www.unicode.org/reports/tr15/) (consultato il 26/10/2026)
- [Unicode Character Encoding Stability Policies: Normalization Stability](https://www.unicode.org/policies/stability_policy.html) (consultate il 26/10/2026)
- [ECMA-262: String.prototype.normalize, sezione 22.1.3.15](https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype.normalize) (consultata il 26/10/2026)
