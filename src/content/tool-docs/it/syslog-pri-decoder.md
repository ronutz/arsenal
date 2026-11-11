## Cosa fa

Ogni messaggio syslog inizia con un valore di priorità, il PRI, un piccolo numero tra parentesi angolari come `<134>` proprio all’inizio della riga. Racchiude due informazioni in un solo numero. Lo strumento decodifica un PRI nella sua facility e nella sua gravità, e ricodifica una facility e una gravità in un PRI e nella sua forma `<PRI>` sulla rete. Tutto viene eseguito nel tuo browser.

## La formula del PRI

Il PRI combina una facility e una gravità con l’aritmetica definita nella RFC 5424:

    PRI = Facility * 8 + Severity
    Facility = PRI / 8   (integer division)
    Severity = PRI % 8

Poiché la gravità occupa solo i tre bit meno significativi, una volta noti i pezzi un PRI si legge a colpo d’occhio. L’intervallo valido va da 0 a 191, perché la facility va da 0 a 23 e la gravità da 0 a 7.

## Facility e gravità

- La **facility** (da 0 a 23) indica il sottosistema che ha prodotto il messaggio: il kernel, il sistema di posta, il sistema di autenticazione, il daemon syslog stesso e così via, fino agli otto slot da `local0` a `local7` che i dispositivi di rete e le appliance usano di solito per i propri messaggi.
- La **gravità** (severity, da 0 a 7) misura l’urgenza e va nella direzione controintuitiva: 0 è il livello più grave (Emergency) e 7 il meno grave (Debug), con Error a 3 e Informational a 6 nel mezzo.

## Esempio svolto

- `<134>` si decodifica in facility 16 (`local0`) e gravità 6 (Informational), perché `134 = 16 * 8 + 6`. È un valore predefinito comune per i dispositivi di rete che registrano eventi di routine.

## Come si usa

Inserisci un PRI per scomporlo in facility e gravità, oppure scegli una facility e una gravità per ottenere il PRI e la stringa `<PRI>` che vedresti sulla rete. La RFC 5424 definisce il formato syslog moderno; il formato BSD più vecchio, nella RFC 3164, usa la stessa aritmetica del PRI.

## Condivisione dei risultati

Sotto il risultato, in entrambe le modalità, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene un PRI e nient’altro: nella modalità Decodifica PRI il campo così come l’hai inserito (`#input=%3C34%3E`); nella modalità Codifica PRI il PRI formato dalla facility e dalla gravità, nella sua forma sulla rete (`#input=%3C134%3E` per local0 e informational), così il link si apre nella modalità Decodifica PRI sulla stessa facility e sulla stessa gravità. Tutto ciò che il link contiene si trova dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un PRI è lungo al massimo cinque caratteri.
- **Apertura di un link.** Il link è lo stesso indirizzo usato dagli altri link verso questo strumento: il PRI compila il campo della modalità Decodifica PRI come farebbe la digitazione. Come per ogni link verso questo strumento, il valore resta dopo il `#` finché non modifichi o cancelli il campo, e poi lascia l’indirizzo senza alcuna richiesta.
