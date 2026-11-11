## Cosa fa

Descrivi un suggerimento di Traffic Learning di F5 AWAF (Advanced WAF, in precedenza BIG-IP ASM, Application Security Manager): la sua azione, il suo learning score, il violation rating medio, la modalità di apprendimento e se il traffico che lo ha generato è attendibile. Lo strumento ti dice se accettare il suggerimento allenta o restringe la policy, se un allentamento è la correzione di un vero falso positivo o un indebolimento della sicurezza, e se l’apprendimento Automatic sta per applicarlo al posto tuo. È il ponte tra lo stimatore di avvelenamento e il triage dei falsi positivi, e viene eseguito interamente nel tuo browser.

## Allentamento e restringimento

F5 divide i suggerimenti in due direzioni. I suggerimenti di restringimento rendono la policy più specifica: rimuovere un carattere jolly e aggiungere entità esplicite, applicare un’entità in staging, rendere un attributo più specifico. Accettarli in genere migliora la sicurezza. I suggerimenti di allentamento rilassano la policy: aggiungere un’entità consentita, consentire un metacarattere, allentare un attributo, disattivare una violazione o una firma. Aggiungere un’entità legittima che la policy semplicemente non aveva appreso è a basso rischio, ma un allentamento che riduce l’applicazione richiede giudizio, e lo strumento lo giudica in base al violation rating: 1 o 2 è probabilmente la correzione di un falso positivo, 3 richiede un’indagine, 4 o 5 significa che stai allentando la policy davanti a un attacco reale.

## Il learning score e il vettore di avvelenamento

Ogni suggerimento ha un learning score che indica quanto il sistema è vicino ad accettarlo, e il punteggio sale quando il violation rating scende. Quindi i suggerimenti con il rating più basso, quelli che più probabilmente sono falsi positivi, arrivano per primi all’accettazione automatica. È voluto, ma è anche esattamente ciò che fa salire un attaccante che alimenta molte violazioni con rating basso. Quando la modalità è Automatic, l’allentamento riduce l’applicazione, il traffico non è attendibile e il punteggio sta salendo, lo strumento segnala il vettore di avvelenamento e ti rimanda allo stimatore di avvelenamento per vedere quanto manca alla soglia di accettazione automatica. Con l’apprendimento Manual una persona deve accettare ogni suggerimento, quindi nulla viene applicato senza revisione.

## La disciplina

Per ogni allentamento che riduce l’applicazione, lo strumento ribadisce la regola di F5: allenta la policy solo dove si è verificato un falso positivo, mai dove la violazione è stata causata da un attacco reale. Il violation rating è ciò che permette di distinguere i due casi, ed è per questo che guida la valutazione.

## Fondamenti

Le categorie di allentamento e restringimento vengono dal K03513854 di F5, mentre il comportamento del learning score, l’applicazione automatica al 100% in modalità Automatic e la disciplina sui falsi positivi vengono dalla documentazione sull’apprendimento di ASM e dal K70544352. Lo strumento modella il comportamento documentato e non dipende dall’esatto JSON REST del suggerimento (che varia con la versione); il suggerimento lo descrivi tu a partire dalla schermata Traffic Learning. Nulla di ciò che selezioni lascia la pagina.

## Condivisione dei risultati

Sotto la valutazione, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` le cinque scelte con i loro ID: `action`, `score` (da 0 a 100), `rating` (da 1 a 5, oppure `na`), `mode` e `trust`. Tutte e cinque vengono sempre incluse, così il link continua ad aprire la stessa lettura. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** Le cinque scelte vengono impostate e la pagina esegue il calcolo come a ogni modifica. Una scelta che la pagina non offre fa ignorare l’intero link. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
