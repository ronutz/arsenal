# Analizzatore dei fattori del punteggio ZDX

Incolla le metriche esposte da Zscaler Digital Experience (il punteggio composito, le metriche Web Probe, le metriche CloudPath) e scopri cosa rappresenta ciascuna secondo la documentazione del vendor stesso: quale famiglia di sonde la misura, cosa significa e come si applica la semantica documentata del punteggio.

## Ambito di trasparenza, dichiarato in apertura

Zscaler documenta i fattori del punteggio ZDX, la frequenza delle sonde, la regola del valore più basso dell’ora, la scala da 0 a 100 e tutte e tre le fasce (Good 66–100, Okay 34–65, Poor 0–33), ma **non** pubblica la formula composita esatta. Questo strumento quindi **non calcola alcun punteggio dalle metriche**. Classifica un punteggio dato rispetto alle tre fasce documentate, spiega il significato documentato di ogni metrica e la famiglia di sonde a cui appartiene, e dichiara chiaramente dove si ferma la documentazione. Per le metriche grezze nessuna soglia pubblicata rende un valore buono o cattivo di per sé (i criteri di avviso di ZDX sono definiti dall’amministratore per ogni regola), quindi lo strumento spiega la metrica e si astiene dal valutarla. È la stessa regola di non inventare nulla che vale per gli altri strumenti di questo sito.

## Grammatica dell’input

Una metrica per riga, `metric = value`. Le righe che iniziano con `#` sono commenti.

- `score`: il punteggio ZDX composito, un numero intero da 0 a 100 (Zscaler arrotonda ogni punteggio all’intero più vicino)
- `pft`, `dns`, `srt`: tempi Web Probe in millisecondi (Page Fetch Time, DNS Time, Server Response Time)
- `availability`: disponibilità Web Probe, in percentuale da 0 a 100
- `path-latency`, `path-loss`: metriche CloudPath (millisecondi, percentuale)

## Cosa ottieni

Ogni metrica viene presentata come una scheda di lettura: il badge della famiglia di sonde (Web Probe / CloudPath / punteggio composito), il significato documentato (Page Fetch Time che richiede solo il documento della pagina di primo livello, Server Response Time come tempo fino al primo byte) e, per il punteggio, la classificazione nella fascia documentata Good, Okay o Poor, con la nota sull’analisi automatica della causa radice per Poor. Quando sono presenti entrambe le famiglie di sonde compare la diagnosi separata: metriche web cattive su un percorso pulito indicano l’applicazione; un percorso cattivo chiama in causa la rete. Le note permanenti riportano la semantica documentata su cui si basa ogni lettura: sonde ogni cinque minuti, il valore più basso dell’ora come valore orario, i punteggi delle applicazioni come media del valore più basso di ogni utente, mentre i punteggi di reparto, sede, città e organizzazione sono la media del valore più basso di ogni intervallo di tempo, i tre tipi di punteggio (Synthetic Probe, RUM e Combined) che possono non coincidere per la stessa applicazione, il ritardo della telemetria di circa venti minuti e il piccolo scarto tra API e dashboard dovuto all’aggregazione approssimata.

Tutto viene eseguito in locale nel tuo browser; nulla di ciò che incolli lascia la pagina.

## Condivisione dei risultati

In cima alla lettura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` le metriche così come le hai incollate. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Le metriche possono descrivere le prestazioni di un’applicazione interna (è il motivo per cui il riquadro a comparsa aggiunge una riga di avvertenza). Prima che venga offerto un link, nella casella viene cercata una credenziale definita da uno standard: una chiave privata PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sezione 10), una riga `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2), una riga `Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezione 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1), un ID della chiave di accesso AWS o un valore `ENC` di FortiOS; tutte consultate il 01/11/2026. La grammatica non prevede alcuno spazio per nessuna di queste, ma una riga di commento è testo libero. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto non blocca il link; il riquadro a comparsa indica il primo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La casella si riempie come farebbe un incolla e la pagina legge ogni metrica. Non viene contattato nulla. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

- [Zscaler Reference Architecture: Zscaler Digital Experience (ZDX)](https://help.zscaler.com/downloads/zdx/reference-architecture/zscaler-digital-experience-zdx/zscaler-digital-experience-zdx-reference-architecture.pdf): le metriche delle sonde, la frequenza e la semantica del valore più basso dell’ora e delle medie di gruppo (consultata il 09/11/2026)
- [Zscaler Help: Evaluating User Details](https://help.zscaler.com/zdx/evaluating-user-details): la fascia documentata Poor (0–33) e la sua analisi automatica della causa radice (consultata il 09/11/2026)
- [Zscaler Help: Understanding the ZDX API](https://help.zscaler.com/legacy-apis/understanding-zdx-api): le calibrazioni del ritardo della telemetria e dello scarto degli aggregati (consultata il 09/11/2026)
- [Zscaler Help: Understanding the ZDX Score](https://help.zscaler.com/zdx/understanding-zdx-score): la scala da 0 a 100, le tre fasce, le regole di aggregazione, l’arrotondamento all’intero e i tipi di punteggio (consultata il 26/10/2026)

La regola del frammento su cui si basa Condividi i risultati è quella della [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.5 (consultata il 01/11/2026), e le credenziali cercate dal suo controllo sono definite nelle RFC 7468, RFC 9110, RFC 6265 e RFC 7519 (consultate lo stesso giorno).
