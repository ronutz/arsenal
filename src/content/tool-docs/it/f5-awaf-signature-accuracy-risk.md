## Cosa fa

Leggi le due proprietà che F5 pubblica per ogni firma di attacco in F5 AWAF (Advanced WAF, in precedenza BIG-IP ASM, Application Security Manager): Accuracy e Risk. Aggiungi se la firma riguarda davvero i tuoi sistemi e se è applicata, e lo strumento ti dice quanto la firma è soggetta a falsi positivi, quanti danni farebbe una corrispondenza reale e quale intervento di tuning ne consegue. È deterministico e viene eseguito interamente nel tuo browser.

## Perché le proprietà e non una ricerca per ID della firma

L’insieme delle firme di F5 è proprietario ed enorme, quindi un database per ID non sarebbe né fattibile né onesto. F5 però documenta che cosa significano Accuracy e Risk per ogni firma, e sono quelle due proprietà a guidare davvero il tuning dei falsi positivi, quindi lo strumento parte da lì. Accuracy, Risk e Systems li leggi direttamente dalla voce della firma nella policy.

## L’accuratezza è la predisposizione ai falsi positivi

F5 definisce l’accuratezza come la capacità di una firma di identificare l’attacco, compresa la sua predisposizione a generare falsi allarmi, e afferma chiaramente che un’accuratezza più alta produce meno falsi positivi. Quindi una firma con accuratezza Low ha un’alta probabilità di falsi positivi, Medium una certa probabilità e High una bassa probabilità. Il rischio è un asse separato: il danno potenziale se l’attacco riesce, dalla ricognizione (Low) all’esposizione di dati sensibili o a danni moderati (Medium) fino alla compromissione completa del sistema o al denial of service (High).

## Il quadrante accuratezza per rischio

Lo strumento colloca la firma in una matrice 2x2. Accuratezza bassa e rischio basso è la candidata ideale all’allentamento: falsi positivi frequenti, poco da perdere allentando. Accuratezza bassa e rischio alto è soggetta a falsi positivi ma pericolosa, quindi esamini la richiesta reale prima di disattivarla, invece di lasciar passare un possibile attacco reale. Accuratezza alta e rischio alto è un blocco affidabile con una posta in gioco alta, che non si allenta. Accuratezza alta e rischio basso è affidabile ma con una posta in gioco bassa. Lo strumento segnala inoltre come puro rumore una firma che prende di mira un sistema che la tua applicazione non usa, e mette in evidenza l’accuratezza come leva: poiché l’accuratezza è un criterio di filtro dei signature set, un insieme orientato verso firme più accurate produce meno falsi positivi.

## Fondamenti

Le definizioni di accuratezza e rischio vengono dalla documentazione Working with Attack Signatures di F5 e dal classico riferimento sulle attack signature di BIG-IP ASM (che spiega la probabilità bassa, media e alta di falsi positivi e la delimitazione dei signature set per sistema e accuratezza), più il K70544352 sulla riduzione dei falsi positivi. Nulla di ciò che selezioni viene inviato o lascia la pagina.

## Condivisione dei risultati

Sotto il verdetto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` le quattro scelte con i loro ID: `accuracy`, `risk`, `system` ed `enforcement`. Tutte e quattro vengono sempre incluse, così il link continua ad aprire la stessa lettura. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** Le quattro scelte vengono impostate e la pagina esegue il calcolo come a ogni modifica. Una scelta che la pagina non offre fa ignorare l’intero link. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
