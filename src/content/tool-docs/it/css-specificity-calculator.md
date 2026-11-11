## Cosa fa

Legge uno o più selettori CSS (uno per riga, separati da virgole, oppure un intero foglio di stile incollato, di cui vengono scartati i blocchi di dichiarazioni e i preludi delle at-rule) e calcola la specificità di ogni selettore come la terna (A, B, C) di Selectors Level 4, indicando ogni selettore semplice e la colonna a cui contribuisce. I selettori vengono ordinati come li ordina la cascata, i pari merito vengono segnalati (lì decide l’ordine di apparizione) e ogni regola speciale su cui il selettore si basa viene spiegata accanto.

## Il conteggio

Da Selectors Level 4, «Calculating a selector's specificity»:

- **A** conta i selettori di ID (`#main`).
- **B** conta i selettori di classe (`.nav`), i selettori di attributo (`[type="text"]`) e le pseudo-classi (`:hover`).
- **C** conta i selettori di tipo (`li`) e gli pseudo-elementi (`::before`).
- Il selettore universale (`*`) viene ignorato; i combinatori non aggiungono nulla.
- Le specificità si confrontano colonna per colonna: vince la A maggiore; a parità di A, la B maggiore; a parità di B, la C maggiore; se tutte sono pari, le specificità sono uguali.
- Le occorrenze ripetute dello stesso selettore semplice sono ammesse e aumentano la specificità («Repeated occurrences of the same simple selector are allowed and do increase specificity»): `.a.a` vale (0,2,0).

I casi speciali che la specifica descrive in dettaglio, e che il calcolatore applica:

- `:is()`, `:not()` e `:has()`: la specificità viene sostituita da quella del selettore complesso più specifico del loro elenco di argomenti («is replaced by the specificity of the most specific complex selector in its selector list argument»). `:not(em, strong#foo)` vale (1,0,1).
- `:nth-child()` e `:nth-last-child()` con una clausola `of`: una pseudo-classe più la specificità del selettore complesso più specifico del loro elenco di argomenti («plus the specificity of the most specific complex selector in its selector list argument»). `:nth-child(even of li, .item)` vale (0,2,0).
- `:where()`: sostituita da zero («replaced by zero»). `.qux:where(em, #foo#bar#baz)` vale (0,1,0).
- Gli pseudo-elementi legacy di CSS2 con un solo segno di due punti (`:before`, `:after`, `:first-line`, `:first-letter`) sono pseudo-elementi e contano in C.
- Da CSS Shadow Module Level 1: `:host` è una pseudo-classe; `:host()` e `:host-context()` sono una pseudo-classe più il loro argomento; `::slotted()` è uno pseudo-elemento più il suo argomento. `::part()` viene contato come uno pseudo-elemento (il modulo rimanda la sua regola esatta a CSS Pseudo-Elements Level 4; l’ipotesi è dichiarata nella pagina).

Il calcolatore riproduce la tabella di esempi della specifica: `*` (0,0,0), `LI` (0,0,1), `UL LI` (0,0,2), `UL OL+LI` (0,0,3), `H1 + *[REL=up]` (0,1,1), `UL OL LI.red` (0,1,3), `LI.red.level` (0,2,1), `#x34y` (1,0,0), `#s12:not(FOO)` (1,0,1), `.foo :is(.bar, #baz)` (1,1,0).

## Prima della specificità

La specificità decide solo quando tutto ciò che la precede nella cascata è uguale. CSS Cascading and Inheritance Level 5 ordina le dichiarazioni, in ordine decrescente di priorità, per: origine e importanza (una dichiarazione `!important` dell’autore prevale su ogni dichiarazione normale, qualunque sia il selettore), contesto (shadow tree), stili associati all’elemento (un attributo `style` prevale su qualsiasi regola della stessa importanza), livelli della cascata (cascade layers: l’ultimo livello vince per le dichiarazioni normali, il primo per quelle important), poi specificità, poi ordine di apparizione (vince l’ultima dichiarazione nell’ordine del documento, con gli attributi style collocati dopo ogni foglio di stile). La pagina elenca questi criteri, così un vincitore inatteso può essere ricondotto al passaggio giusto.

## Condivisione dei risultati

Sotto il riepilogo, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` i selettori così come li hai inseriti, e nient’altro; la classifica viene calcolata solo a partire da questi, quindi la pagina che apre il link mostra la stessa tabella. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il testo non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** I selettori sostituiscono il contenuto della casella come farebbe un incolla e la pagina esegue il calcolo; nulla viene inviato altrove. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Limiti

- Il calcolatore legge la sintassi, non un documento. Non può sapere se un selettore corrisponde a qualcosa e, per un elenco di selettori, la specificità effettiva in una corrispondenza reale è quella del membro più specifico che corrisponde; la pagina ordina i membri singolarmente.
- I prefissi di namespace (`ns|p`) vengono letti ma non risolti.
- Le pseudo-classi e gli pseudo-elementi sconosciuti vengono contati in base alla loro forma (un segno di due punti B, due segni C), che è ciò che dice la grammatica; se un browser li supporti è un’altra questione.
- Le implementazioni possono limitare i conteggi molto grandi; il calcolatore no.

## Fonti

- [Selectors Level 4, W3C Working Draft 22 January 2026: Calculating a selector's specificity](https://www.w3.org/TR/selectors-4/#specificity-rules) (consultato il 05/10/2026)
- [CSS Cascading and Inheritance Level 5, W3C Candidate Recommendation Snapshot 13 January 2022: Cascade Sorting Order](https://www.w3.org/TR/css-cascade-5/#cascade-sort) (consultato il 05/10/2026)
- [CSS Shadow Module Level 1, Editor's Draft 28 April 2026](https://drafts.csswg.org/css-shadow-1/) (consultato il 05/10/2026)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 01/11/2026): sezione 3.5, il frammento, che usa un link creato con Condividi i risultati
