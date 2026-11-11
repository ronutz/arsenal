## Cosa fa

Prende due colori, scritti in una qualsiasi notazione definita da CSS Color Level 4, e risponde alla domanda che un foglio di stile pone per ogni testo e ogni controllo: questo si legge su quello? Calcola il rapporto di contrasto WCAG tra i due, lo verifica rispetto a ogni livello dei tre criteri sul contrasto, mostra un’anteprima della coppia, converte ogni colore in tutte le notazioni con la sua luminanza relativa e, dove un livello non viene superato, trova il colore di primo piano più vicino che lo supererebbe.

## Cosa legge

- **Colori con nome**: i 148 nomi della sezione 6.1 di CSS Color Level 4 (gray e grey, entrambe le grafie) e `transparent` (nero trasparente).
- **Esadecimale**: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`; maiuscole e minuscole sono indifferenti, e una forma breve viene espansa ripetendo ogni cifra.
- **rgb() / rgba()**: numeri da 0 a 255 o percentuali, con le virgole legacy o con gli spazi moderni e `/ alpha`; le componenti fuori intervallo vengono limitate all’intervallo, come prevede la specifica per il valore analizzato (parsed value).
- **hsl() / hsla()** e **hwb()**: una tonalità come numero o angolo (deg, grad, rad, turn), poi percentuali o numeri da 0 a 100.
- **lab()**, **lch()**, **oklab()**, **oklch()**: con gli intervalli di riferimento delle percentuali previsti dalla specifica (a e b di lab: 100% = 125; C di lch: 100% = 150; a e b di oklab: 100% = 0,4; C di oklch: 100% = 0,4; L: 100% = 100 per Lab, 1 per OKLab).
- **color()**: `srgb`, `srgb-linear`, `display-p3`, `display-p3-linear`, `xyz`, `xyz-d65`, `xyz-d50`.
- `none` come componente vale zero, come indica la specifica.

Accanto a ogni campo, il selettore di colori del browser si apre sul colore contenuto nel campo e vi scrive quello che scegli come `#rrggbb`, così puoi scegliere un colore senza digitarlo.

## Cosa calcola

- **Luminanza relativa** (WCAG 2.2): ogni canale sRGB viene linearizzato (c / 12,92 fino a 0,04045, altrimenti ((c + 0,055) / 1,055) ^ 2,4) e pesato, L = 0,2126 R + 0,7152 G + 0,0722 B. Le WCAG 2.0 e 2.1 indicavano la soglia come 0,03928; per valori di canale a 8 bit le due soglie classificano ogni valore allo stesso modo.
- **Rapporto di contrasto**: (L1 + 0,05) / (L2 + 0,05), il più chiaro sul più scuro, da 1:1 a 21:1.
- **Livelli**: criterio di successo 1.4.3 Contrast (Minimum), livello AA, 4,5:1 per il testo e 3:1 per il testo di grandi dimensioni; 1.4.6 Contrast (Enhanced), livello AAA, 7:1 e 4,5:1; 1.4.11 Non-text Contrast, livello AA, 3:1 per i componenti dell’interfaccia utente e gli oggetti grafici. Il testo di grandi dimensioni è di almeno 18 punti, o 14 punti in grassetto.
- **Alfa**: un colore di primo piano traslucido viene composto sullo sfondo prima della misura (semplice alpha blending in sRGB, come lo dipinge uno schermo), perché le WCAG definiscono il contrasto tra i colori così come appaiono. L’alfa dello sfondo viene ignorato.
- **Gamut**: un colore fuori da sRGB (un giallo display-p3, un oklch() saturo) viene ricondotto al gamut per le notazioni sRGB e per la luminanza, e viene segnalato; le forme Lab, LCH, OKLab, OKLCH e XYZ mantengono il valore non ricondotto.
- **Correzioni**: per ogni livello che la coppia non raggiunge, la luminosità del colore di primo piano viene spostata in OKLCH, verso il più chiaro e verso il più scuro, mantenendo tonalità e croma (la croma viene ridotta solo quando il risultato uscirebbe dal gamut), finché l’obiettivo non viene raggiunto; il risultato viene dato in esadecimale e in oklch() con il rapporto che raggiunge.

## Conversioni

Le conversioni sono il codice di esempio della specifica stessa, trascritto: la funzione di trasferimento sRGB, le matrici razionali da sRGB a XYZ e da display-p3 a XYZ, l’adattamento di Bradford tra D65 e D50, CIE Lab con le sue costanti razionali, le due matrici di OKLab, le forme polari con le loro soglie di tonalità non significativa (powerless hue) e gli algoritmi HSL e HWB. Il motore riproduce gli esempi svolti della specifica: `#7654CD` è `lab(44.36% 36.05 -58.99)` e `color(xyz-d65 0.21661 0.14602 0.59452)`; i colori di esempio di lab() e oklch() coincidono tra loro; `color(display-p3 1 1 0)` corrisponde a `oklch(0.9648 0.245 110.23)`.

## Condivisione dei risultati

Sotto il rapporto e i suoi livelli, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` i due colori così come li hai inseriti, con i nomi che la pagina dà ai campi (`foreground` e `background`), e nient’altro; l’esempio pronto che hai caricato non viene incluso. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la coppia non viene inviata al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Entrambi i campi vengono sostituiti come li compilerebbe la digitazione e la pagina calcola il rapporto; nulla viene inviato altrove. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Limiti

- Il rapporto è la formula delle WCAG, che i criteri richiedono; non è un modello della percezione, e una coppia che supera la verifica può comunque risultare difficile per alcuni lettori (caratteri sottili, dimensioni ridotte, differenze nella visione dei colori). L’anteprima serve proprio a lasciare voce in capitolo anche agli occhi.
- La gestione del colore non è modellata: il profilo dello schermo non viene consultato, e i colori ad ampio gamut vengono giudicati in base alla loro versione ricondotta a sRGB.
- Le correzioni cambiano solo la luminosità. Chi progetta può preferire cambiare la tonalità o la croma; lo strumento mostra cosa ottiene il solo spostamento della luminosità.
- I colori di sistema con nome (`Canvas`, `LinkText`) e `currentcolor` dipendono dalla pagina e non vengono letti.

## Fonti

- [WCAG 2.2, W3C Recommendation 12 December 2024](https://www.w3.org/TR/WCAG22/) (consultate il 05/10/2026): luminanza relativa, rapporto di contrasto, criteri 1.4.3, 1.4.6, 1.4.11, testo di grandi dimensioni
- [CSS Color Module Level 4, W3C Candidate Recommendation Draft 30 September 2026](https://www.w3.org/TR/css-color-4/) (consultato il 05/10/2026): notazioni, intervalli di riferimento delle percentuali, colori con nome
- [Codice di esempio di CSS Color Level 4 nel repository csswg-drafts](https://github.com/w3c/csswg-drafts/tree/main/css-color-4) (consultato il 05/10/2026): conversions.js, utilities.js, rgbToHsl.js, hslToRgb.js, hwbToRgb.js, rgbToHwb.js
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 01/11/2026): sezione 3.5, il frammento, che usa un link creato con Condividi i risultati
