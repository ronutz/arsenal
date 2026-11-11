## Cosa fa

Il 6 luglio 2026 F5 ha annunciato il passaggio da una cadenza trimestrale a una cadenza mensile per i rilasci di sicurezza. Lo strumento trasforma questa pianificazione in date concrete su cui organizzarti. Scegli una data di partenza (per impostazione predefinita è oggi): lo strumento elenca le prossime release software hardened di F5 e le notifiche di sicurezza che le seguono, e indica la prossima di ciascun tipo.

Tutta la cadenza si riduce a una regola. Le release hardened escono il **terzo mercoledì di ogni mese**, a partire dal 15 luglio 2026. Per ogni release viene pubblicata una **notifica di sicurezza** un mese dopo e, poiché le date di riferimento indicate da F5 cadono di terzo mercoledì (release il 15 luglio, notifica il 19 agosto), ogni terzo mercoledì riunisce entrambi gli eventi: esce la release hardened del mese e viene pubblicata la notifica di sicurezza del mese precedente. Il mese di distanza è voluto: ti lascia il tempo di aggiornare prima che i dettagli della vulnerabilità diventino pubblici.

Le date vengono calcolate in locale con una semplice aritmetica; nulla lascia il tuo browser. Sono le date pianificate: F5 continua a pubblicare in qualsiasi momento avvisi di sicurezza fuori ciclo (out-of-band) ed engineering hotfix per i problemi urgenti, e si riserva esplicitamente la flessibilità di modificare i tempi o il contenuto di una notifica quando lo richiedono considerazioni legali, di divulgazione, di sfruttamento o di tutela dei clienti.

## Condivisione dei risultati

Sotto le due date principali, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la data di partenza scelta (`from`, a meno che non sia oggi) e il numero di mesi (`months`, a meno che non sia 6). Il pulsante resta disattivato finché non modifichi il modulo. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser lo prevede, il suo menu di condivisione; l’indirizzo della pagina non cambia.

Un link senza data si apre sulla data odierna di chi lo legge, e «tra N giorni» si conta sempre a partire da quella data. Secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) il frammento è separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi i valori non vengono inviati al server quando il link viene aperto; ognuno resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerli.

- **Apertura di un link.** La data e il numero di mesi vengono impostati e la pagina elenca le date. Una data che non corrisponde a un giorno reale del calendario, o un numero di mesi fuori dall’intervallo da 1 a 24, fa ignorare l’intero link. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina non contengono nulla.
