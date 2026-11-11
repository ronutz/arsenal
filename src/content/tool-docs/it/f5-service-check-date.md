## Cosa fa

Indica allo strumento una versione di BIG-IP e restituisce la service check date minima che deve avere la licenza per quella versione; indicagli una service check date e restituisce la versione più recente a cui puoi aggiornare, insieme ai rami più recenti che non puoi ancora raggiungere e alla data che ciascuno richiede. È una consultazione nei due sensi su una copia, inclusa nello strumento, della tabella License Check Date pubblicata da F5, e viene eseguito interamente nel tuo browser.

## Le due date su cui lavora

Ogni versione di BIG-IP ha una **License Check Date** fissa: la service check date minima che una licenza deve avere perché quella versione possa avviarsi. Ogni licenza ha una **Service Check Date**: la meno recente tra la data dell’ultima attivazione e la data di scadenza del contratto di assistenza. Quando aggiorni a una nuova versione major o minor, il sistema confronta le due date e, se la Service Check Date della licenza è precedente alla License Check Date della versione, il sistema aggiornato si avvia ma non carica la configurazione finché la licenza non viene riattivata. Lo strumento codifica la tabella License Check Date di F5 (da K7727) ed esegue per te quel confronto, in entrambe le direzioni.

Le date vengono gestite esattamente nella forma che BIG-IP scrive in `bigip.license`, il formato a otto cifre `yyyymmdd` (quindi `20230208` è l’8 febbraio 2023), e mostrate anche in forma ISO. Il confronto è pura aritmetica sulle date, senza alcun orologio: sia la data della versione sia la service check date sono dati in ingresso, quindi gli stessi dati danno sempre la stessa risposta.

## Esempi svolti

Inserisci una versione e ottieni la sua soglia minima. `17.1.3` corrisponde al ramo `17.1.x` e riporta una service check date minima di `2023-02-08` (`20230208`); `21.1` riporta `2026-04-15`; `16.1.x` riporta `2021-06-11`.

Inserisci una service check date e ottieni il tuo limite massimo. Una service check date `2023-06-15` arriva fino a `17.1.x` come ramo più recente e riporta i rami che non puoi ancora raggiungere: `17.5.x` (richiede `2025-02-12`), `21.0.x` (richiede `2025-10-29`) e `21.1.x` (richiede `2026-04-15`). Una data recente come `2026-05-01` raggiunge il ramo più recente senza alcun blocco; una data anteriore all’intera tabella non raggiunge nulla, il segnale che la licenza va riattivata prima di qualsiasi aggiornamento.

## Solo gli upgrade major e minor sono soggetti al controllo

Il controllo si applica a un upgrade, che F5 definisce come un cambiamento del primo o del secondo numero di versione. Il passaggio tra release di manutenzione o point release dello stesso ramo è un update, e non attiva alcuna verifica della service check date. Ecco perché lo strumento lavora alla granularità major.minor: una volta che la tua service check date è abbastanza recente da raggiungere `17.1.x`, lo è per ogni release di manutenzione e point release di quel ramo. Quindi la risposta per `17.1.0`, `17.1.3` e `17.1.x` è la stessa, un’unica data.

## Come si usa

Inserisci una versione di BIG-IP (`17.1.3`, `21.1`, `16.1.x`) o una service check date (`20230611`, `2023-06-11` o `2023/06/11`); lo strumento riconosce quale delle due hai indicato e risponde di conseguenza. Senza tastiera, usa i due controlli sotto il campo: il selettore di data lo compila con una service check date nella forma `yyyy-mm-dd`, e l’elenco delle versioni contiene ogni riga della tabella K7727 inclusa nello strumento, con l’etichetta di F5 stessa, e compila il campo con una versione coperta da quella riga (`17.1.x` per un ramo, la prima versione di un intervallo come `10.2.2 - 10.2.4`). Entrambi compilano il campo esattamente come se lo inserissi tu. Poiché lo strumento codifica documentazione del vendor e non uno standard fisso, e F5 aggiunge una riga a ogni release, verifica qualsiasi valore con F5 K7727 o con il file `/etc/version_date` del sistema di destinazione prima di un upgrade in produzione.

## Incollare una licenza o l’output di tmsh

Puoi incollare l’intero contenuto di `/config/bigip.license`, un suo qualsiasi frammento o l’output di `tmsh show sys license`; lo strumento trova la riga della service check date e risponde alla stessa domanda sull’idoneità all’upgrade. Vengono riconosciute entrambe le forme di riga pubblicate: la forma del file `Service check date : 20151008` (con spaziatura variabile intorno ai due punti) e la forma di tmsh `Service Check Date 2016/08/18`. Una licenza contiene esattamente una riga di questo tipo, quindi vale la prima corrispondenza, e la riga trovata viene mostrata di nuovo, così puoi confermare che è stato preso il valore giusto. Tutto il resto del testo incollato viene ignorato e, come sempre, nulla lascia il tuo browser.

## Condivisione dei risultati

Sotto la risposta, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la versione o la data così come l’hai inserita oppure, se hai incollato una licenza o l’output di `tmsh show sys license`, solo la riga della service check date che la pagina ne ha estratto (la riga che ti mostra, come `Service check date : 20230611`), mai la licenza. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser lo prevede, il suo menu di condivisione; l’indirizzo della pagina non cambia.

Una licenza contiene la registration key, e il riferimento tmsh di F5 ([sys license](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_license.html), consultato il 27/10/2026) afferma che dopo una revoca «the registration key may subsequently be re-used to relicense this or another VE instance». Basta quella riga: la pagina che riceve il link ne ricava la stessa data e mostra la stessa riga. Secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) il frammento è separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il valore non viene inviato al server quando il link viene aperto; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza.** Una riga, ben al di sotto dei 16.384 caratteri che il sito ammette dopo il `#`.
- **Apertura di un link.** Il valore compila il campo come se lo inserissi tu e la pagina risponde. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina non contengono nulla.
