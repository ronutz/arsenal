## Cosa fa

L’ASCII ha 128 codici, da 0 a 127, e di solito ne serve uno alla volta: il codice di un carattere, il carattere dietro un codice o il modo di scriverlo in un file di configurazione, in una stringa JSON o in un’iRule. L’esploratore risponde a queste domande per ogni codice e dice chiaramente quando ciò che hai in mano non è affatto ASCII.

Ha quattro parti:

- **Ricerca** legge un codice in qualsiasi notazione e ne mostra tutto: i numeri, i bit, i nomi, ciò per cui il codice fu definito nel 1968 e ciò che Linux ne fa oggi, come scriverlo in sette contesti e quali linguaggi lo considerano uno spazio bianco.
- **La tabella** dispone i 128 codici come li disegna la RFC 20, otto colonne per sedici righe, oppure come elenco. Scegli un codice qualsiasi per vederlo nella ricerca.
- **Dal testo ai codici** prende un testo incollato e mostra il codice di ogni carattere, elencando per nome tutto ciò che è fuori dall’ASCII, con il motivo per cui può creare problemi.
- **Spazi bianchi a confronto** mette i dieci codici che potrebbero essere spazi bianchi a confronto con sette definizioni che non concordano su di essi.

## Cosa legge la casella di ricerca

| Cosa inserisci | Come viene letto |
|---|---|
| `A` | il carattere stesso (funziona anche tra apici, `'A'`) |
| `65` | decimale |
| `0x41`, `41h`, `x41` | esadecimale |
| `0o101` | ottale |
| `1000001`, `00100101` | sette o otto cifre binarie, lette come bit |
| `0b1000001` | binario con il suo prefisso |
| `4/1` | colonna/riga della RFC 20: colonna 4, riga 1 |
| `U+0041` | notazione Unicode |
| `&#65;`, `&#x41;`, `&excl;` | riferimenti HTML numerici e con nome |
| `%41` | codifica percentuale (percent-encoding) |
| `\x41`, `\101`, `\n`, `A`, `\u{1F600}` | sequenze di escape con barra rovesciata |
| `^A`, `^[`, `^?` | notazione caret |
| `NUL`, `LF`, `line feed`, `Reverse Slant` | abbreviazioni e nomi, dalla RFC 20, da Unicode 1.0 e dall’Unicode attuale |
| `en dash`, `minus sign` | qualsiasi nome o alias Unicode (con corrispondenza tollerante: maiuscole, spazi, underscore e trattini interni vengono ignorati, come prescrive la regola UAX44-LM2 dell’UAX #44) |

Sette o otto cifre binarie da sole vengono lette come bit, perché è quasi sempre questo che è una stringa di 0 e 1 così lunga. Un numero decimale più lungo, come `1000`, viene letto come decimale e cade fuori dall’ASCII.

## Lettura di un codice

- **Numeri.** Decimale, esadecimale, ottale, i sette bit e il byte intero. Il bit più alto del byte è 0: la RFC 20 colloca l’ASCII a 7 bit in un byte di otto bit («in an 8 bit byte whose high order bit is always 0»).
- **Colonna/riga.** La RFC 20 indica ogni posizione con colonna e riga: `K` è `4/11`. La colonna è data dai bit b7 b6 b5 e la riga da b4 b3 b2 b1, quindi 4/11 è 100 1011.
- **Inverti un bit.** Ognuno dei sette bit è un pulsante che lo inverte e salta al risultato. Due di essi spiegano gran parte della tabella: b6 (32) è l’unica differenza tra maiuscole e minuscole, e b7 (64) separa un carattere di controllo dal carattere a cui è abbinato nella notazione caret (`A` e `^A`, `[` e `^[`, che è ESC).
- **Nomi.** Il nome Unicode attuale, il nome Unicode 1.0 quando è diverso (`BACKSLASH`, `SPACING UNDERSCORE`), il nome della RFC 20 (`Reverse Slant`, `Underline`, `Overline`) e le sue alternative. I caratteri di controllo non hanno affatto un nome Unicode: per loro la proprietà Name di Unicode è vuota, e sono indicati con alias formali presi dall’ISO 6429 (`LINE FEED`, `NEW LINE`, `END OF LINE`, abbreviati `LF`, `NL`, `EOL`). La tabella della RFC 20 chiama il codice 25 `EM`; la prima abbreviazione che Unicode gli assegna è `EOM`.
- **Categoria e classe.** La General_Category dell’Unicode Character Database e, per i caratteri di controllo, la classe della RFC 20: controllo della comunicazione (CC, communication control), effettore di formato (FE, format effector) o separatore di informazioni (IS, information separator).
- **Note.** La nota 3 della RFC 20 indica undici posizioni (`#` `@` `[` `\` `]` `^` `` ` `` `{` `|` `}` `~`) che non andrebbero usate negli scambi internazionali senza prima essersi accordati sul loro uso; la nota 4 consente al simbolo della sterlina di prendere il posto di `#`.
- **A cosa serviva e cosa fa oggi.** Per ogni carattere di controllo, una sintesi della definizione della RFC 20 e, dove Linux gli assegna una funzione, quella funzione: Ctrl+C (ETX) interrompe, Ctrl+D (EOT) chiude l’input, Ctrl+S e Ctrl+Q (DC3, DC1) fermano e riprendono l’output, Ctrl+Z (SUB) sospende, ed ESC avvia una sequenza di escape nella console Linux. Queste funzioni vengono dalle pagine del manuale Linux termios(3) e console_codes(4).
- **Come scriverlo.** La forma per un letterale stringa in C, JSON, JavaScript, Python e Tcl (iRules), i riferimenti HTML e la forma URL con la sua classe RFC 3986. Segue una breve nota quando un linguaggio nasconde una trappola (vedi sotto).
- **Spazio bianco?** Sì o no per ciascuna delle sette definizioni.
- **Relazioni.** La notazione caret, la maiuscola o minuscola corrispondente, il valore di una cifra e i caratteri ASCII che l’UTS #39 considera confondibili con il codice (`1`, `I`, `l` e `|` condividono un prototipo; `0` e `O` ne condividono un altro).

## Le trappole che le sequenze di escape evitano

- **In C le sequenze di escape esadecimali non si fermano dopo due cifre.** `"\x1Bfoo"` continua a leggere cifre esadecimali, quindi lo strumento scrive i caratteri di controllo C in ottale (`\033`), che si ferma a tre cifre.
- **Tcl 8.4, e quindi iRules, conserva solo le ultime due cifre esadecimali di `\x`.** `"\x1Bfoo"` legge `\x1Bf` e conserva `Bf`: il risultato è il byte 0xBF seguito da `oo`, non ESC e `foo`. Anche in Tcl lo strumento scrive i caratteri di controllo in ottale. La prova è stata eseguita in Tcl 8.4.6.
- **JSON deve fare l’escape delle virgolette, della barra rovesciata (reverse solidus) e dei caratteri di controllo da 0 a 31**, e può lasciare DEL così com’è (RFC 8259, sezione 7).
- **In JavaScript `\0` significa NUL solo se non è seguito da una cifra.**
- **L’HTML trasforma `&#0;` in U+FFFD**, il carattere sostitutivo, e tratta i riferimenti alla maggior parte dei caratteri di controllo come errori di analisi (il parser WHATWG).

## Quando non è ASCII

Un valore superiore a 127 viene indicato per nome, con il numero di byte UTF-8 che richiede e il tipo di problema che può causare: invisibile, uno spazio che non è lo spazio ASCII, una virgoletta tipografica, un trattino che non è il trattino-meno (hyphen-minus) o un carattere la cui forma di compatibilità è ASCII. Quando l’UTS #39 lo elenca come confondibile con un testo ASCII, lo strumento indica con quale e propone il carattere ASCII che probabilmente intendevi.

Due casi sono abbastanza comuni da essere preimpostati. `&minus;` è U+2212 MINUS SIGN e `&tilde;` è U+02DC SMALL TILDE: nessuno dei due è ASCII, e il trattino-meno ASCII (45) e la tilde ASCII (126) non hanno alcun riferimento con nome. Scrivi `&#45;` e `&#126;`, oppure i caratteri stessi. Alcune tabelle ASCII pubblicate associano `&minus;` e `&tilde;` a 45 e 126; l’elenco WHATWG dei riferimenti con nome no.

Per tutte le proprietà di un code point fuori dall’ASCII, il risultato rimanda all’[analizzatore Unicode](/tools/unicode-inspector).

## La casella di testo

Incolla una riga da una configurazione, da un’iRule o da un’e-mail. Ogni carattere compare come una cella con il suo codice (esadecimale per l’ASCII, il code point per tutto il resto), e tutto ciò che è fuori dall’ASCII viene elencato con la posizione, i byte UTF-8, il nome e il motivo per cui può creare problemi. Vengono letti fino a 2000 caratteri.

## Come è stato verificato

Ogni sequenza di escape, riferimento e risposta sugli spazi bianchi per tutti i 128 codici è stata eseguita nelle implementazioni reali il 3 ottobre 2026, e tutte concordano con lo strumento: i letterali stringa in CPython 3.11, Node 22, GCC (C11) e Tcl 8.4.6; i riferimenti HTML (decimali, esadecimali e con nome) in Chromium; gli spazi bianchi con `isspace()` di C, `str.isspace()` di Python, `\s` e `trim()` di JavaScript, un parser JSON rigoroso, il parser dei comandi di Tcl 8.4.6 e la suddivisione del DOM stesso sugli spazi bianchi ASCII. Ogni cella della tabella dei codici della RFC 20 è stata confrontata con i dati dello strumento. I nomi Unicode sono stati verificati sul file di dati di Unicode 18.0.0 per ognuno dei 1.114.112 code point.

## Condivisione dei risultati

Sotto la risposta della ricerca, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il valore della casella di ricerca così come l’hai inserito: `/tools/ascii-table#input=%26tilde%3B`. La casella di Dal testo ai codici è una parte separata della pagina e non viene inclusa. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il valore non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** La casella di ricerca contiene 200 caratteri, ben al di sotto dei 16.384 che il sito ammette dopo il `#`.
- **Apertura di un link.** Il link ha la forma `#input=` che i link dell’analizzatore Unicode usano già per aprire un codice in questo strumento, quindi aprirlo funziona esattamente come quei link hanno sempre fatto: il valore compila la casella e la pagina lo legge, e resta nell’indirizzo finché non modifichi o cancelli la casella.

## Limiti

- Qui ASCII è il codice a 7 bit. I codici da 128 a 255 appartengono al set di caratteri a 8 bit che un sistema usa (Latin-1, Windows-1252, una code page DOS); l’esploratore non prova a indovinare quale.
- Il comportamento del terminale è quello di Linux, tratto dalle sue pagine del manuale. Altri sistemi possono assegnare i tasti di controllo in modo diverso.
- La casella di ricerca legge un valore alla volta. Per un testo, usa la casella di testo o l’[analizzatore Unicode](/tools/unicode-inspector).

## Fonti

- [RFC 20: ASCII format for Network Interchange (1969), reproducing USAS X3.4-1968](https://www.rfc-editor.org/rfc/rfc20) (consultata il 03/10/2026)
- [Unicode Character Database 18.0.0: UnicodeData.txt](https://www.unicode.org/Public/18.0.0/ucd/UnicodeData.txt) (consultato il 03/10/2026)
- [Unicode Character Database 18.0.0: NameAliases.txt](https://www.unicode.org/Public/18.0.0/ucd/NameAliases.txt) (consultato il 03/10/2026)
- [Unicode Character Database 18.0.0: DerivedName.txt](https://www.unicode.org/Public/18.0.0/ucd/extracted/DerivedName.txt) (consultato il 03/10/2026)
- [The Unicode Standard 18.0.0, chapter 4: Character Properties (the Name property)](https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-4/) (consultato il 03/10/2026)
- [UAX #44: Unicode Character Database (UAX44-LM2, General_Category values)](https://www.unicode.org/reports/tr44/) (consultato il 03/10/2026)
- [UTS #39: Unicode Security Mechanisms, confusables.txt 18.0.0](https://www.unicode.org/Public/18.0.0/security/confusables.txt) (consultato il 03/10/2026)
- [WHATWG HTML: named character references (entities.json)](https://html.spec.whatwg.org/entities.json) (consultato il 03/10/2026)
- [WHATWG HTML: parsing (numeric character reference end state)](https://html.spec.whatwg.org/multipage/parsing.html) (consultato il 03/10/2026)
- [WHATWG Infra: ASCII whitespace](https://infra.spec.whatwg.org/) (consultato il 03/10/2026)
- [ISO/IEC 9899:2011 committee draft N1570 (C11)](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) (consultato il 03/10/2026)
- [RFC 8259: JSON](https://www.rfc-editor.org/rfc/rfc8259) (consultata il 03/10/2026)
- [ECMA-262: ECMAScript Language Specification](https://tc39.es/ecma262/) (consultato il 03/10/2026)
- [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) (consultato il 03/10/2026)
- [Tcl 8.4 manual: Tcl (backslash substitution)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (consultato il 03/10/2026)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 03/10/2026); sezione 3.5 (consultata il 27/10/2026): il frammento, che contiene i valori di un link creato con Condividi i risultati
- [RFC 5234: ABNF (core rules)](https://www.rfc-editor.org/rfc/rfc5234) (consultata il 03/10/2026)
- [RFC 5321: SMTP (lines end with CR LF)](https://www.rfc-editor.org/rfc/rfc5321) (consultata il 03/10/2026)
- [RFC 9112: HTTP/1.1 (message format)](https://www.rfc-editor.org/rfc/rfc9112) (consultata il 03/10/2026)
- [POSIX.1-2024: Definitions (line, newline)](https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap03.html) (consultato il 03/10/2026)
- [Linux manual page termios(3)](https://man7.org/linux/man-pages/man3/termios.3.html) (consultato il 03/10/2026)
- [Linux manual page console_codes(4)](https://man7.org/linux/man-pages/man4/console_codes.4.html) (consultato il 03/10/2026)
