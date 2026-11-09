## Was das Tool tut

Das Tool nimmt ein Logging-Level eines Systems, über seinen Namen oder über die eigene Nummer dieses Systems, und liest es über eine gemeinsame Skala, die SeverityNumber von OpenTelemetry, gegen neun andere Systeme. Die Antwort nennt die gewählte Stufe, ihren Platz auf der Skala (1 bis 24, in sechs Bereichen zu je vier), die nächstgelegene Stufe in jeder anderen Stufenleiter, ob dieser Nachbar exakt passt oder in einem angegebenen Abstand liegt, und die Gleichstände, wo eine Zuordnung nicht eindeutig ist. Unter der Antwort steht die ganze Tabelle: jede Stufenleiter mit ihren eigenen Nummern, ihren eigenen Bezeichnungen und ihrem eigenen Vorbehalt, die gewählte Stufe hervorgehoben. Es wird nichts gesendet.

## Die Stufenleitern und wo jede liegt

Die Skala stammt von OpenTelemetry. Das Logs Data Model definiert die SeverityNumber als 24 Werte in sechs Bereichen, TRACE 1 bis 4, DEBUG 5 bis 8, INFO 9 bis 12, WARN 13 bis 16, ERROR 17 bis 20 und FATAL 21 bis 24, wobei 0 für nicht angegeben steht; „smaller numerical values correspond to less severe events“, kleinere Zahlen stehen also für weniger schwere Ereignisse (abgerufen am 05.10.2026). Anhang B desselben Dokuments enthält die Beispielzuordnung, der das Tool für die dort aufgeführten Systeme folgt:

| System | Richtung der Nummern | Wo die Stufen landen (Anhang B) |
| --- | --- | --- |
| Syslog, RFC 5424 §6.2.1, Tabelle 2 | 0 ist am schwersten | Debug 7 auf 5, Informational 6 auf 9, Notice 5 auf 10, Warning 4 auf 13, Error 3 auf 17, Critical 2 auf 18, Alert 1 auf 19, Emergency 0 auf 21 |
| Windows Event Log (winmeta-Level) | 1 ist am schwersten | Verbose 5 auf 5, Informational 4 auf 9, Warning 3 auf 13, Error 2 auf 17, Critical 1 auf 18; LogAlways 0 ist kein Schweregrad |
| Log4j 2 | eine niedrigere Prioritätsnummer ist schwerer | TRACE 600 auf 1, DEBUG 500 auf 5, INFO 400 auf 9, WARN 300 auf 13, ERROR 200 auf 17, FATAL 100 auf 21; OFF 0 und ALL sind Filter |
| java.util.logging | die Nummern steigen mit dem Schweregrad | FINEST 300 auf 1, FINER 400 auf 5, FINE 500 auf 6, CONFIG 700 auf 7, INFO 800 auf 9, WARNING 900 auf 13, SEVERE 1000 auf 17; OFF und ALL sind die Extremwerte der Ganzzahlen |
| .NET Microsoft.Extensions.Logging | 0 ist am wenigsten schwer | Trace 0 auf 1, Debug 1 auf 5, Information 2 auf 9, Warning 3 auf 13, Error 4 auf 17, Critical 5 auf 21; None 6 ist ein Filterwert |

Drei Stufenleitern werden über ihre Entsprechung zu den Schweregraden von Syslog platziert, die sie mit Nummer und Namen übernehmen:

- printk des Linux-Kernels: KERN_EMERG "0" bis KERN_DEBUG "7", als Zeichenfolgen im Präfix der Meldung geschrieben; KERN_DEFAULT und KERN_CONT sind keine Level (Kernel-Dokumentation, abgerufen am 05.10.2026).
- Logging in Cisco IOS: emergencies 0 bis debugging 7, jedes in der Befehlsreferenz mit seiner LOG_*-Konstante gepaart; deren Tabelle hält auch fest, dass das standardmäßige Level für den Puffer „varies by platform but is generally 7“ (abgerufen am 05.10.2026).
- System-Syslog in Junos: emergency, alert, critical, error, warning, notice und info, in dieser Reihenfolge, wobei "any" jedes Level auswählt und "none" das Logging deaktiviert; die Seite von Juniper nennt die Namen, keine Nummern, und hat keine Stufe für debug (abgerufen am 05.10.2026).

Das Logging-Modul von Python platziert das OpenTelemetry SDK (Software Development Kit) für Python selbst: Seine Tabelle `_STD_TO_OTEL` bildet 10 DEBUG auf 5, 20 INFO auf 9, 30 WARNING auf 13, 40 ERROR auf 17 und 50 CRITICAL auf 21 ab, die Ganzzahlen dazwischen auf die weiteren Stufen des Bereichs (abgerufen am 05.10.2026). NOTSET (0) bedeutet „consult the ancestors“, also: bei den übergeordneten Loggern nachsehen, und ist kein Meldungslevel.

Die Tabelle der Entsprechungen nennt eine exakte Entsprechung, wenn eine andere Stufenleiter eine Stufe auf derselben SeverityNumber hat, und sonst die nächstgelegene Stufe mit ihrem Abstand auf der Skala. Liegen zwei Stufen gleich nah, werden beide angezeigt, und die Zeile wird als Gleichstand markiert. Sentinel-Werte (OFF, ALL, NOTSET, None, LogAlways, any, none) erscheinen in ihrer Stufenleiter, werden aber nie als Entsprechung angeboten: Sie sind Filterwerte, nicht der Schweregrad einer Meldung.

## Ergebnisse teilen

Unter der Bewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Level so, wie eingegeben (`input`), und das System über seinen Schlüssel (`system`). Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Die hervorgehobene Vorlage ist nicht enthalten: Sie markiert nur, welcher Chip gewählt wurde.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird das Level beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Öffnen eines Links.** System und Level werden gesetzt, und die Seite ordnet sie zu, wie beim Auswählen und Eingeben. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Grenzen

- Die Platzierungen sind die Beispiele der Quellen, kein Standard: Anhang B heißt „example mappings“, und ein Collector oder ein Agent kann anders zuordnen. Das Tool zeigt die verwendete Tabelle, damit man einer bestimmten Zeile widersprechen kann.
- Die eigenen Bezeichnungen eines Systems zählen trotzdem. „Critical“ von Windows landet bei 18 (ERROR2), „Critical“ von .NET dagegen bei 21 (FATAL): Die Namen stimmen überein, die Plätze nicht, und die Tabelle weist das aus, statt es zu glätten.
- Nicht aufgeführte Stufenleitern (Zap, Ruby, Go slog, Serilog und die übrigen) bleiben außen vor, bis eine Quelle für ihre Platzierung gelesen ist.
- Benutzerdefinierte Level (beliebige Ganzzahlen in Python, 16 bis 255 in Windows, benutzerdefinierte Level in Log4j) werden nicht zugeordnet; sie haben keinen standardisierten Schweregrad.

## Quellen

- [OpenTelemetry-Spezifikation, Logs Data Model: Feld SeverityNumber und Anhang B, SeverityNumber example mappings](https://opentelemetry.io/docs/specs/otel/logs/data-model/) (abgerufen am 05.10.2026)
- [RFC 5424, The Syslog Protocol, Abschnitt 6.2.1, Tabelle 2, die Schweregrade](https://www.rfc-editor.org/rfc/rfc5424.html#section-6.2.1) (abgerufen am 05.10.2026)
- [The Linux Kernel documentation, Message logging with printk](https://www.kernel.org/doc/html/latest/core-api/printk-basics.html) (abgerufen am 05.10.2026)
- [Cisco IOS Configuration Fundamentals Command Reference, logging buffered, die Tabelle der Schweregrade](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/command/cf_command_ref/L_through_mode.html) (abgerufen am 05.10.2026)
- [Juniper Networks, Junos OS, Syslog-Facilities und Schweregrade](https://juniper.net/documentation/en_US/junos13.1/topics/reference/general/syslog-facilities-severity-levels.html) (veröffentlicht am 08.07.2013, abgerufen am 05.10.2026)
- [Microsoft Learn, Windows Event Log, LevelType complex type, die vordefinierten Level](https://learn.microsoft.com/en-us/windows/win32/wes/eventmanifestschema-leveltype-complextype) (abgerufen am 05.10.2026)
- [Microsoft Learn, Microsoft.Extensions.Logging.LogLevel enum](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.logging.loglevel) (abgerufen am 05.10.2026)
- [Python-Dokumentation, logging, Logging Levels](https://docs.python.org/3/library/logging.html#logging-levels) (abgerufen am 05.10.2026)
- [OpenTelemetry Python SDK, die Tabelle _STD_TO_OTEL im Logs-SDK](https://github.com/open-telemetry/opentelemetry-python/blob/main/opentelemetry-sdk/src/opentelemetry/sdk/_logs/_internal/__init__.py) (abgerufen am 05.10.2026)
- [Java SE 21 API, java.util.logging.Level](https://docs.oracle.com/en/java/javase/21/docs/api/java.logging/java/util/logging/Level.html) (abgerufen am 05.10.2026)
- [Apache Log4j 2.x, Handbuch, Levels](https://logging.apache.org/log4j/2.x/manual/customloglevels.html) (abgerufen am 05.10.2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, Abschnitt 3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5) (abgerufen am 01.11.2026): Das Fragment ist „separated from the rest of the URI prior to a dereference“; darauf beruht „Ergebnisse teilen“
