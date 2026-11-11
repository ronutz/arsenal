## Cosa fa

Prende un livello di logging di un sistema, per nome o con il numero proprio di quel sistema, e lo confronta con altri nove sistemi attraverso un’unica scala comune, il SeverityNumber di OpenTelemetry. La risposta indica il gradino scelto, la sua posizione sulla scala (da 1 a 24, in sei intervalli da quattro), il gradino più vicino in ogni altra gerarchia di livelli, se quel vicino è esatto o a una distanza dichiarata, e i casi di pari distanza, dove la corrispondenza non è biunivoca. Sotto la risposta compare la tabella completa: ogni gerarchia con i suoi numeri, le sue parole e la sua avvertenza, con il gradino scelto evidenziato. Nulla viene inviato da nessuna parte.

## Le gerarchie e la loro posizione

La scala è quella di OpenTelemetry. Il Logs Data Model definisce il SeverityNumber come 24 valori in sei intervalli, TRACE da 1 a 4, DEBUG da 5 a 8, INFO da 9 a 12, WARN da 13 a 16, ERROR da 17 a 20 e FATAL da 21 a 24, dove 0 significa non specificato; ai valori numerici più bassi corrispondono gli eventi meno gravi («smaller numerical values correspond to less severe events») (consultato il 05/10/2026). L’appendice B dello stesso documento fornisce la corrispondenza di esempio che lo strumento segue per i sistemi che elenca:

| Sistema | Verso dei numeri | Dove cadono i suoi gradini (appendice B) |
| --- | --- | --- |
| syslog, RFC 5424 §6.2.1, tabella 2 | 0 è il più grave | Debug 7 → 5, Informational 6 → 9, Notice 5 → 10, Warning 4 → 13, Error 3 → 17, Critical 2 → 18, Alert 1 → 19, Emergency 0 → 21 |
| Windows Event Log (livelli winmeta) | 1 è il più grave | Verbose 5 → 5, Informational 4 → 9, Warning 3 → 13, Error 2 → 17, Critical 1 → 18; LogAlways 0 non è una gravità |
| Log4j 2 | un numero di priorità più basso è più grave | TRACE 600 → 1, DEBUG 500 → 5, INFO 400 → 9, WARN 300 → 13, ERROR 200 → 17, FATAL 100 → 21; OFF 0 e ALL sono filtri |
| java.util.logging | i numeri crescono con la gravità | FINEST 300 → 1, FINER 400 → 5, FINE 500 → 6, CONFIG 700 → 7, INFO 800 → 9, WARNING 900 → 13, SEVERE 1000 → 17; OFF e ALL sono gli estremi interi |
| .NET Microsoft.Extensions.Logging | 0 è il meno grave | Trace 0 → 1, Debug 1 → 5, Information 2 → 9, Warning 3 → 13, Error 4 → 17, Critical 5 → 21; None 6 è un valore di filtro |

Tre gerarchie sono collocate in base alla corrispondenza con le gravità di syslog, di cui riprendono numeri e nomi:

- printk del kernel Linux: da KERN_EMERG «0» a KERN_DEBUG «7», scritti come stringhe nel prefisso del messaggio; KERN_DEFAULT e KERN_CONT non sono livelli (documentazione del kernel, consultata il 05/10/2026).
- Logging di Cisco IOS: da emergencies 0 a debugging 7, ognuno associato alla sua costante LOG_* nella guida di riferimento dei comandi, la cui tabella indica anche che il livello predefinito del logging buffered dipende dalla piattaforma ma di solito è debugging («varies by platform but is generally 7») (consultata il 05/10/2026).
- System syslog di Junos: emergency, alert, critical, error, warning, notice e info, in quest’ordine, con «any» che seleziona tutti i livelli e «none» che disattiva il logging; la pagina di Juniper fornisce i nomi, non i numeri, e non ha un gradino debug (consultata il 05/10/2026).

Il modulo logging di Python è collocato secondo lo stesso SDK (software development kit) di OpenTelemetry per Python, la cui tabella `_STD_TO_OTEL` associa 10 DEBUG a 5, 20 INFO a 9, 30 WARNING a 13, 40 ERROR a 17 e 50 CRITICAL a 21, e gli interi intermedi ai passi successivi dell’intervallo (consultata il 05/10/2026). NOTSET (0) rimanda ai logger antenati («consult the ancestors») e non è un livello di messaggio.

La tabella degli equivalenti indica una corrispondenza esatta quando un’altra gerarchia ha un gradino sullo stesso SeverityNumber, altrimenti il gradino più vicino con la sua distanza sulla scala. Quando due gradini sono alla stessa distanza, vengono mostrati entrambi e la riga è segnata come pari distanza. I valori sentinella (OFF, ALL, NOTSET, None, LogAlways, any, none) compaiono nella loro gerarchia ma non vengono mai proposti come equivalenti: sono valori di filtro, non la gravità di un messaggio.

## Condivisione dei risultati

Sotto il verdetto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il livello così come l’hai inserito (`input`) e il sistema con la sua chiave (`system`). Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Il preset evidenziato non è incluso: indica soltanto quale pulsante è stato premuto.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il livello non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** Il sistema e il livello vengono impostati e la pagina ne trova le corrispondenze, come quando li scegli e li inserisci. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Limiti

- Le collocazioni sono gli esempi delle fonti, non uno standard: l’appendice B si intitola «example mappings», e un collector o un agente possono scegliere diversamente. Lo strumento mostra la tabella che ha usato, così chi legge può contestarne una riga precisa.
- Le parole proprie di un sistema contano comunque. «Critical» di Windows cade su 18 (ERROR2), mentre «Critical» di .NET cade su 21 (FATAL): i nomi coincidono, le posizioni no, e la tabella lo dice invece di appianare la differenza.
- Le gerarchie non elencate (Zap, Ruby, Go slog, Serilog e le altre) restano fuori ambito finché non viene letta una fonte per la loro collocazione.
- I livelli personalizzati (gli interi arbitrari di Python, i livelli da 16 a 255 di Windows, i livelli personalizzati di Log4j) non vengono collocati; non hanno una gravità standardizzata.

## Fonti

- [Specifica OpenTelemetry, Logs Data Model: il campo SeverityNumber e l’appendice B, SeverityNumber example mappings](https://opentelemetry.io/docs/specs/otel/logs/data-model/) (consultata il 05/10/2026)
- [RFC 5424, The Syslog Protocol, sezione 6.2.1, tabella 2: le gravità](https://www.rfc-editor.org/rfc/rfc5424.html#section-6.2.1) (consultata il 05/10/2026)
- [Documentazione del kernel Linux, Message logging with printk](https://www.kernel.org/doc/html/latest/core-api/printk-basics.html) (consultata il 05/10/2026)
- [Cisco IOS Configuration Fundamentals Command Reference, logging buffered: la tabella dei livelli di gravità](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/command/cf_command_ref/L_through_mode.html) (consultata il 05/10/2026)
- [Juniper Networks, Junos OS, syslog facilities and severity levels](https://juniper.net/documentation/en_US/junos13.1/topics/reference/general/syslog-facilities-severity-levels.html) (pubblicata l’8 luglio 2013, consultata il 05/10/2026)
- [Microsoft Learn, Windows Event Log, LevelType complex type: i livelli predefiniti](https://learn.microsoft.com/en-us/windows/win32/wes/eventmanifestschema-leveltype-complextype) (consultato il 05/10/2026)
- [Microsoft Learn, enumerazione Microsoft.Extensions.Logging.LogLevel](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.logging.loglevel) (consultata il 05/10/2026)
- [Documentazione di Python, logging, Logging Levels](https://docs.python.org/3/library/logging.html#logging-levels) (consultata il 05/10/2026)
- [OpenTelemetry Python SDK, la tabella _STD_TO_OTEL nell’SDK dei log](https://github.com/open-telemetry/opentelemetry-python/blob/main/opentelemetry-sdk/src/opentelemetry/sdk/_logs/_internal/__init__.py) (consultata il 05/10/2026)
- [Java SE 21 API, java.util.logging.Level](https://docs.oracle.com/en/java/javase/21/docs/api/java.logging/java/util/logging/Level.html) (consultata il 05/10/2026)
- [Manuale di Apache Log4j 2.x, Levels](https://logging.apache.org/log4j/2.x/manual/customloglevels.html) (consultato il 05/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, sezione 3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5) (consultata il 01/11/2026): il frammento è separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), ed è su questo che si basa Condividi i risultati
