# Contribuire a una traduzione

ronutz.com è costruito in modo che aggiungere o migliorare una lingua richieda pochissimo lavoro, e i contributi sono benvenuti. Una lingua è fatta di due cose: una voce nel registro delle lingue e un pacchetto di messaggi JSON. Non serve modificare il codice dell’applicazione.

## Come funziona il sistema

- **I pacchetti.** Il testo di ogni lingua si trova in un unico file JSON di frasi etichettate, `src/i18n/messages/<codice>.json`. La pagina dei contributi offre in download ogni pacchetto attivo, e i file scaricabili vengono copiati dai pacchetti sorgente a ogni build, quindi sono sempre aggiornati. `en.json` è il riferimento completo; ogni altro pacchetto deve contenere solo le frasi che traduce.
- **Ripiego sull’inglese.** Ogni frase che manca in un pacchetto viene mostrata in inglese. Una traduzione parziale è quindi utile da subito: viene pubblicata, e le frasi mancanti restano leggibili in inglese finché qualcuno non le completa.
- **Il registro.** `src/i18n/locales.ts` elenca ogni lingua con il nome nativo, la direzione del testo e lo stato della traduzione. Il selettore della lingua, gli indirizzi e i metadati di ricerca seguono questo elenco.

## Stato della traduzione

Ogni lingua ha uno `status`:

| Stato | Significato |
|---|---|
| `reviewed` | Una persona madrelingua ha letto e approvato il pacchetto. |
| `machine-draft` | Una prima stesura fatta con l’IA o con la traduzione automatica, non ancora rivista da una persona madrelingua. |
| `stub` | Nessun pacchetto per ora; la lingua mostra l’inglese. |

Un testo scritto con l’IA non viene mai presentato come testo nativo rifinito. Un `machine-draft` è un punto di partenza che una persona madrelingua promuove a `reviewed`. Il portoghese brasiliano è scritto con l’IA e rivisto man mano, quindi mantiene lo stato `machine-draft` e il suo avviso finché una revisione umana non attesta il contrario. Lo stesso vale per l’italiano.

## Migliorare una lingua in quattro passaggi

1. **Scarica il pacchetto** che vuoi migliorare dalla pagina dei contributi (per una lingua nuova, scarica `en.json`, il riferimento).
2. **Traduci il testo dopo ogni etichetta.** Cambia solo i valori. Non cambiare mai un’etichetta (la chiave a sinistra) e lascia esattamente com’è tutto ciò che sta tra parentesi graffe: `{count}`, `{name}` e simili vengono compilati dal sito, e una graffa modificata rompe la pagina. Lascia invariati i nomi di prodotti e tecnologie (BIG-IP, CIDR, F5, Fortinet e così via) e scrivi il gergo tecnico come lo usano davvero i professionisti nella tua lingua. In italiano usa sempre l’apostrofo tipografico ’ (U+2019): quello dritto ' è un carattere di escape nel formato dei messaggi e, accanto a una graffa, cambia il messaggio.
3. **Imposta lo stato** in `_meta.status` del pacchetto: `machine-draft` per una stesura fatta con l’IA o con la traduzione automatica, `reviewed` se sei una persona madrelingua e l’hai controllato.
4. **Rimandalo indietro.** Invia il file modificato per email dalla pagina dei contributi indicando la lingua, oppure apri una pull request nel repository pubblico. Ogni contributo viene rivisto a mano.

## Punteggiatura

- **L’inglese** si scrive senza lineetta lunga (em dash). Al suo posto si usano una virgola, i due punti, le parentesi o una nuova frase; la lineetta breve (en dash) compare solo tra i numeri di un intervallo (10–20).
- **Ogni altra lingua mantiene la propria punteggiatura naturale.** Non importare la regola dell’inglese: le lingue romanze e slave usano la loro lineetta (il travessão portoghese, la raya spagnola, il тире russo) dove la loro tipografia la richiede; il tedesco e le lingue scandinave usano la lineetta breve tra spazi; il cinese usa i suoi segni nativi a larghezza piena (，。：；) e la sua lineetta a doppia larghezza. Il francese mantiene lo spazio prima di ; : ! e ?. L’italiano usa le virgolette basse « » per le citazioni, la lineetta breve tra spazi ( – ) per gli incisi e nessuno spazio prima di : ; ! e ?.

## Note

- **Le lingue che si scrivono da destra a sinistra** (l’arabo, per esempio) sono gestite dall’impaginazione; la direzione viene dal registro, quindi devi solo tradurre il testo.
- **I pacchetti parziali sono benvenuti.** Tradurre solo la navigazione e la home page è già un primo contributo prezioso.
- **Una lingua non ancora nel registro?** Aggiungi una riga a `LOCALES` in `src/i18n/locales.ts` con il codice, il nome nativo, il nome inglese, la direzione e `status: "stub"`, poi aggiungi il tuo pacchetto, oppure chiedilo per email e verrà aggiunta per te.
