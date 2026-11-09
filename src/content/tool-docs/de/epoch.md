## Was das Tool tut

Geben Sie einen Unix-Zeitstempel oder ein Datum nach ISO 8601 ein, und lesen Sie denselben Zeitpunkt in jeder gängigen Form. Geben Sie eine Zahl ein, erkennt das Tool ihre Einheit (Sekunden, Millisekunden, Mikrosekunden oder Nanosekunden) automatisch an ihrer Größenordnung, sodass Sie einen Wert aus fast jedem System einfügen können, ohne die Einheit anzugeben. Anschließend stellt es den Zeitpunkt als Kalenderaufschlüsselung in koordinierter Weltzeit (UTC) dar, als String nach ISO 8601, als Zeitstempel nach RFC 3339, im HTTP-Datumsformat und als Zeitstempel in allen vier Einheiten. Alles wird in Ihrem Browser berechnet.

## Was Unix-Zeit bedeutet

Die Unix-Zeit, definiert in POSIX, ist die Anzahl der Sekunden, die seit der Epoche (1970-01-01 00:00:00 UTC) vergangen sind, ohne Schaltsekunden. Verschiedene Systeme speichern sie mit unterschiedlicher Auflösung: Klassisches Unix und die meisten APIs verwenden Sekunden, JavaScript und viele Datenbanken Millisekunden, manche Tracing- und Kernel-Schnittstellen Mikrosekunden oder Nanosekunden. Da diese Größenordnungen jeweils etwa um den Faktor tausend auseinanderliegen, lässt sich die Einheit an der Anzahl der Ziffern ablesen, und genau das tut die automatische Erkennung.

## Die Formate, die das Tool erzeugt

- **Kalenderaufschlüsselung in UTC**: Jahr, Monat, Tag und Uhrzeit in UTC.
- **ISO 8601 und RFC 3339**: das Zeitstempelformat des Internets, zum Beispiel `2026-07-01T20:00:00Z`.
- **HTTP-Datum**: die Form IMF-fixdate, die in HTTP-Headern verwendet wird (RFC 9110, Abschnitt 5.6.7), zum Beispiel `Wed, 01 Jul 2026 20:00:00 GMT`.
- **Alle vier Einheiten**: derselbe Zeitpunkt in Sekunden, Millisekunden, Mikrosekunden und Nanosekunden.

## Bereich und Determinismus

Daten werden in dem Bereich verarbeitet, den ein Datumswert in JavaScript darstellen kann, also rund 273.000 Jahre vor und nach der Epoche (eine Grenze von 8,64 × 10^15 Millisekunden in jede Richtung). Die Umrechnung ist eine reine Funktion des Eingabewerts und liest nie die aktuelle Uhr, daher wird ein bestimmter Zeitstempel immer gleich dargestellt. Eine Angabe „relativ zu jetzt“ braucht zwangsläufig die Systemuhr, daher steckt sie in der Oberfläche des Tools und nicht in diesem deterministischen Kern.

## Verwendung

Geben Sie einen Unix-Zeitstempel wie `1751400000` ein (ein zehnstelliger Wert, daher als Sekunden gelesen) oder `1751400000000` (dreizehn Stellen, als Millisekunden gelesen) oder ein Datum nach ISO 8601 wie `2026-07-01T20:00:00Z`, und lesen Sie alle gleichwertigen Formen auf einen Blick.

## Ergebnisse teilen

Unter der Überschrift erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Zeitstempel oder das Datum so, wie eingegeben, sobald die Seite den Wert gelesen hat. Die Zeile, die angibt, wie lange der Zeitpunkt zurückliegt oder wie weit er in der Zukunft liegt, stammt von der Uhr dessen, der den Link öffnet, wie beim Einfügen; die Umrechnungen selbst sind überall gleich. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` steht, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Öffnen eines Links.** Der Wert füllt das Feld wie beim Einfügen, und die Seite rechnet ihn um. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
