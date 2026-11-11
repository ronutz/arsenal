## Cosa fa

Legge l’HTML (un documento intero o un frammento) con lo stesso parser che la specifica impone ai browser e mostra cosa ne è uscito: l’albero (ogni elemento, nodo di testo e commento, rientrato in base alla profondità, con la riga del suo tag), gli elementi che il parser ha creato senza un tag, i tag di chiusura che ha aggiunto, gli elementi di formattazione che ha diviso, il contenuto che ha spostato fuori da una tabella, la modalità del documento (no-quirks, limited-quirks o quirks), il DOCTYPE, il titolo, la lingua e la codifica che il documento dichiara, ogni errore di analisi con il codice dello standard stesso, la sua riga e la sua colonna, la struttura delle intestazioni e un elenco di rilievi sulla struttura e sull’accessibilità, ognuno collegato a una frase dell’HTML Standard o delle WCAG 2.2. Conta anche ciò che sarebbe stato eseguito e non lo è stato: elementi script, gestori di eventi inline, URL javascript:, elementi style, iframe.

Il parser è parse5, il parser HTML conforme alla specifica usato da jsdom, da Cheerio e dal compilatore di Angular, eseguito con le posizioni nel sorgente e la callback degli errori di analisi attive, e con il flag di scripting disattivato (come analizza DOMParser). Nulla viene eseguito, scaricato o visualizzato. L’API ospitata esegue lo stesso codice e restituisce lo stesso albero.

## Lettura dell’albero

- Un **punto** nel margine delle righe indica un nodo senza posizione nel sorgente: lo ha creato il parser. Lo standard precisa che omettere il tag di apertura di un elemento non vuol dire che l’elemento non ci sia: è implicito, ma c’è comunque («Omitting an element's start tag in the situations described below does not mean the element is not present; it is implied, but it is still there»). Di solito sono html, head, body e tbody.
- **chiusura aggiunta** indica un elemento il cui tag di chiusura non è nel sorgente. Per 19 elementi lo standard lo consente (13.1.2.4 Optional tags: html, head, body, li, dt, dd, p, rt, rp, optgroup, option, colgroup, caption, thead, tbody, tfoot, tr, td, th); per qualsiasi altro elemento significa che il tag di chiusura mancava o che un altro tag di chiusura lo ha chiuso prima, e il rilievo D13 indica quale dei due.
- **parte n** indica il risultato dell’adoption agency algorithm: quando un tag di chiusura chiude un elemento di formattazione (a, b, i, em, strong, font, small, s, u, code, nobr, big, tt, strike) che non è l’elemento aperto più interno, il parser lo chiude e ne riapre una copia attorno a ciò che segue, quindi un solo elemento del sorgente diventa più elementi (rilievo D14).
- **spostato** indica il foster parenting: testo o elementi scritti dentro una tabella, in un punto dove possono comparire solo parti di tabella, vengono inseriti prima della tabella (rilievo D15).
- **void** indica i 13 elementi che non hanno mai un tag di chiusura (area, base, br, col, embed, hr, img, input, link, meta, source, track, wbr). Su questi elementi una barra finale non serve e non ha alcun effetto («unnecessary and has no effect of any kind»); su qualsiasi altro elemento HTML è un errore di analisi e l’elemento resta aperto.

## Gli errori di analisi

Lo standard definisce con esattezza la gestione degli errori, quindi anche un documento con errori ha un solo albero esatto: gli errori di analisi sono soltanto errori nella sintassi dell’HTML («Parse errors are only errors with the syntax of HTML»). La sua tabella degli errori con nome (13.2.2) ha 52 codici, ognuno con una descrizione non normativa; la pagina riporta la descrizione accanto a ogni errore. Gli errori della costruzione dell’albero (un tag di chiusura vagante, elementi lasciati aperti alla fine, un secondo body) sono descritti nel testo dello standard senza codici; parse5 assegna loro un nome proprio (missing-doctype, end-tag-without-matching-open-element, open-elements-left-after-eof e altri nove), e la pagina indica quale autorità ha dato il nome a ciascun codice.

## I rilievi

D1 nessun DOCTYPE e D2 un DOCTYPE legacy (modalità quirks); D3 nessun lang sulla radice (WCAG 3.1.1); D4 il titolo mancante, ripetuto o vuoto (modello di contenuto di head, WCAG 2.4.2); D5 la dichiarazione della codifica dei caratteri mancante, oltre i primi 1024 byte o diversa da UTF-8; D6 img senza alt e D7 img con alt vuoto (WCAG 1.1.1 e le regole dello standard sul testo alternativo); D8 un link o un pulsante fatto solo di immagini senza testo alternativo; D9 salti di livello nelle intestazioni e h1 mancante (4.3.11: un livello minore, uguale o maggiore di uno, «less than, equal to, or 1 greater»); D10 id duplicati; D11 e D12 gli elementi e gli attributi obsoleti della sezione 16.2, ognuno con l’indicazione dello standard su cosa usare al suo posto; da D13 a D16 ciò che il parser ha riparato; D17 un controllo etichettabile senza etichetta; D18 ciò che non è stato eseguito; D19 intestazioni vuote (WCAG 2.4.6); D20 gli elementi creati dal parser.

## Condivisione dei risultati

Sotto il verdetto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` l’HTML così come l’hai incollato: l’albero, gli errori di analisi e i rilievi dipendono da ogni suo carattere, quindi nulla può essere sostituito senza cambiare la lettura. Il suo riquadro a comparsa indica prima cosa contiene il link, poi un’avvertenza specifica (l’HTML incollato può nominare host e percorsi interni), poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. L’interruttore Mostra per intero i valori degli attributi non viene incluso.

Una pagina salvata da una sessione con accesso effettuato può comunque contenere una credenziale, quindi prima che venga proposto un link il testo passa per il controllo dei segreti del sito. Se un valore è un segreto per il suo formato, il link non viene creato e il riquadro a comparsa indica la riga: una chiave privata PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sezioni 10 e 11), un JWS o un JWE ([RFC 7515](https://www.rfc-editor.org/rfc/rfc7515), sezione 7.1, la serializzazione usata dai JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), le credenziali di Authorization scritte come riga di intestazione ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1) o un ID della chiave di accesso AWS. Sostituiscilo con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto (un membro JSON come `apiToken`) ottiene comunque un link, e la riga di avvertenza indica la riga, così la controlli prima.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi l’HTML non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** L’HTML sostituisce il contenuto della casella come farebbe un incolla e la pagina lo analizza; nulla viene eseguito, scaricato o visualizzato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Limiti

- parse5 8.0.1 implementa lo standard com’era al momento del suo rilascio. La tokenizzazione delle processing instruction che lo standard ha aggiunto nel 2026 non è inclusa: `<?…>` viene segnalato con il nome precedente unexpected-question-mark-instead-of-tag-name e diventa un commento, che è anche ciò che fa lo standard attuale per un target xml.
- I rilievi leggono la struttura, non il significato: se un testo alternativo è buono, se un’intestazione descrive la sua sezione, se un tag lang è corretto non sono domande a cui un parser possa rispondere. headingoffset e headingreset non vengono applicati alla struttura delle intestazioni.
- L’elenco dell’albero si ferma a 2000 nodi (i conteggi coprono tutto); gli input oltre 200.000 caratteri vengono rifiutati.

## Fonti

- [HTML Living Standard, 13 The HTML syntax: 13.2.2 Parse errors](https://html.spec.whatwg.org/multipage/parsing.html#parse-errors) (consultato il 05/10/2026)
- [HTML Living Standard, 4.3.11 Headings and outlines](https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines) (consultato il 05/10/2026)
- [HTML Living Standard, 16.2 Non-conforming features](https://html.spec.whatwg.org/multipage/obsolete.html#non-conforming-features) (consultato il 05/10/2026)
- [WCAG 2.2, W3C Recommendation 12 December 2024](https://www.w3.org/TR/WCAG22/) (consultate il 05/10/2026)
- [parse5](https://github.com/inikulin/parse5) (consultato il 05/10/2026)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 01/11/2026): sezione 3.5, il frammento, che usa un link creato con Condividi i risultati
