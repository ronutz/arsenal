## Cosa fa

Questo calcolatore traduce una configurazione di rate limiter di F5 Distributed Cloud (XC) esattamente in ciò che farà. Inserisci i quattro campi che chiede la console di F5 (**Number**, **Per Period**, **Periods** e **Burst Multiplier**) più la **Mitigation Action** (e un lockout se scegli Block), e lo strumento calcola la frequenza effettiva, gli equivalenti al secondo, al minuto e all’ora, il tetto di burst e una descrizione in parole semplici di come viene applicato il limite. Viene eseguito interamente nel tuo browser.

## Il calcolo della frequenza

XC esprime una frequenza come *Number richieste ogni (Periods x Per Period)*. Ecco perché `[1, Seconds, 60]` e `[1, Minutes, 1]` sono lo stesso limite, una richiesta al minuto, cosa che sorprende regolarmente. Il calcolatore normalizza qualsiasi configurazione in un’unica finestra in secondi e mostra le frequenze equivalenti al secondo, al minuto e all’ora, così due configurazioni si possono confrontare direttamente.

## Burst e applicazione del limite

Il **Burst Multiplier** è il burst massimo di richieste consentito, espresso come multiplo della frequenza (predefinito 1); un limite di 15 richieste al secondo con un moltiplicatore 3x consente un burst di 45 richieste. Il limite viene applicato con un leaky bucket: quando il bucket trabocca, il load balancer restituisce **HTTP 429**.

## La trappola della mitigazione

L’impostazione letta male più spesso è la **Mitigation Action**. **Disabled non disattiva la limitazione della frequenza**: il leaky bucket restituisce comunque 429 quando trabocca; Disabled significa solo che non viene applicato alcun timer di lockout aggiuntivo. **Block** aggiunge un lockout: una volta che il bucket trabocca, l’utente resta bloccato per l’intera durata del lockout anche se il bucket si svuota, e può inviare di nuovo solo quando il timer scade (al massimo 48 ore). Il calcolatore indica quale comportamento produce la tua configurazione.

## Le avvertenze che mette in evidenza

Il conteggio è distribuito per Regional Edge e per proxy, quindi per breve tempo potresti vedere più richieste del limite prima che l’applicazione del limite converga. E quando combini regole per Server URL e per endpoint API, vengono valutate secondo la prima corrispondenza, nell’ordine in cui le configuri.

## Condivisione dei risultati

Sotto la frequenza effettiva, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` ogni campo: Number, Per Period, Periods, Burst Multiplier, Mitigation Action e il lockout con la sua unità, ciascuno così come lo legge il calcolo (un Burst Multiplier vuoto vale 1). Ogni campo viene incluso anche quando coincide con il valore predefinito, così un link conserva il suo significato se un valore predefinito cambia, e i numeri non nominano alcun sistema né alcuna persona. La pagina mostra un risultato appena si apre, quindi il pulsante è subito disponibile. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** I campi vengono impostati come se li avessi digitati, e il risultato segue. Un link con un valore che la pagina rifiuterebbe viene ignorato per intero. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
