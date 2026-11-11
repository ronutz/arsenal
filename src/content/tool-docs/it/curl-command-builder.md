## Cosa fa

Scegli un protocollo, compila i campi che si adattano a esso e guarda il comando `curl` esatto che si compone in tempo reale. Ogni opzione generata viene spiegata sotto il comando, e tutto ciò che ha implicazioni per la sicurezza riceve un avviso: `-k`, i protocolli in chiaro, una password inserita sulla riga di comando o la codifica predefinita da modulo di `-d` di `curl` quando il corpo sembra JSON. Nulla viene eseguito e nulla lascia il browser.

## Tutti i 27 protocolli

Il generatore copre l’elenco completo dei protocolli dello strumento `curl` attuale, come pubblicato su curl.se: DICT, FILE, FTP, FTPS, GOPHER, GOPHERS, HTTP, HTTPS, IMAP, IMAPS, LDAP (Lightweight Directory Access Protocol), LDAPS, MQTT, MQTTS, POP3, POP3S, RTSP, SCP, SFTP, SMB, SMBS, SMTP, SMTPS, TELNET, TFTP, WS e WSS. Selezionare un protocollo apre una breve spiegazione: cos’è, la sua porta predefinita e se funziona in chiaro, dentro TLS o se parte in chiaro con un percorso di passaggio a TLS. Il modulo mostra poi solo ciò che quel protocollo comprende: HTTP ha metodi, intestazioni, corpi e moduli; SMTP ha una busta; MQTT ha un topic; FTP ha elenco e caricamento; `file://` ha solo un percorso.

## Una tabella, una sola verità

I pannelli esplicativi e il compositore del comando leggono la stessa tabella delle capacità dei protocolli. È voluto: il testo che ti insegna cosa può fare un protocollo e il codice che genera il comando non possono divergere, perché sono gli stessi dati.

## Deterministico per costruzione

Input identici producono sempre un comando identico byte per byte: le opzioni vengono generate in un unico ordine canonico, e i valori vengono racchiusi tra virgolette con l’escape POSIX delle virgolette singole solo quando serve. Undici vettori di test di riferimento (golden vectors) fissano questo comportamento, compresa la regola per cui `-d` implica POST (quindi non viene mai generato un `-X POST` ridondante) e la sequenza di escape `'\''`. Le virgolette sono pensate per le shell POSIX; una nota nello strumento lo dice, perché cmd.exe e PowerShell seguono regole diverse.

## L’inverso dell’analizzatore

Questo strumento scrive comandi `curl`; l’[Analizzatore di comandi curl](/tools/curl-command-explainer) li legge. Genera un comando qui, oppure incollane uno là per fartelo spiegare opzione per opzione e tradurre in fetch, HTTP grezzo, HTTPie e Python requests.

## Condivisione dei risultati

Sotto la casella del comando, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il modulo, ogni campo con il proprio nome (un modulo non ha un unico testo da incollare), con la password e ogni credenziale sostituite da `REDACTED`, mai così come le hai inserite. Il pulsante resta visibile, disabilitato, finché il modulo non genera un comando. Il suo riquadro a comparsa indica prima cosa contiene il link e quanti valori sono stati sostituiti, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Cosa viene sostituito:

- **Il campo della password**: il comando riporta comunque `-u user:REDACTED`, e l’avviso sulla password nella riga di comando resta.
- **Le intestazioni**, per nome: `Authorization` e `Proxy-Authorization` mantengono il loro schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezioni 11.6.2 e 11.7.2: il valore è costituito da credenziali, «consists of credentials»); Basic mantiene lo user-id e perde la password ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), sezione 2); un JWT mantiene la sua intestazione protetta e perde i claim e la firma ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1); `Cookie` mantiene i suoi nomi; un’intestazione con un nome da segreto (`X-API-Key`) viene sostituita per intero; un token dentro qualsiasi altro valore viene sostituito.
- **Il campo del cookie**: ogni valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezione 4.2.1). **Un campo del modulo con un nome da segreto** (`client_secret`): il suo valore; un campo file mantiene il suo percorso. **Il corpo**: i membri JSON e i parametri `name=value` con un nome da segreto (`access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), sezioni 2.2 e 2.3), `refresh_token`, `client_secret`, `password` e `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sezioni 2.3.1, 4.1.2, 4.3.2 e 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), sezione 4.5) e qualsiasi nome che termina con token, secret, password o api key).
- **L’host, il proxy e il percorso**: la password di un `user:password@` ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1; curl la legge anche senza schema) e qualsiasi parametro di query segreto.

Ogni altro campo viene incluso così come l’hai inserito; i valori predefiniti (https, GET, output standard, interruttori disattivati) vengono omessi dal link, e una tabulazione inserita in un campo di una riga viaggia come uno spazio. I vettori di condivisione dello strumento verificano che la copia generi le stesse opzioni e gli stessi avvisi. Se il comando generato dalla copia contiene ancora una chiave o un token che nessun nome segnala (un JWT nel percorso), il link non viene creato, e il riquadro a comparsa lo indica.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il modulo non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** L’intero modulo viene sostituito (un campo che il link non contiene viene svuotato) e il comando viene generato; nulla viene eseguito o inviato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
