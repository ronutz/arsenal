## Was das Tool tut

Jede Syslog-Meldung beginnt mit einem Prioritätswert, dem PRI, einer kleinen Zahl in spitzen Klammern wie `<134>` ganz am Anfang der Zeile. Sie packt zwei Informationen in eine Zahl. Das Tool dekodiert einen PRI-Wert in Facility und Schweregrad und kodiert Facility und Schweregrad zurück in einen PRI-Wert und seine Form `<PRI>`, wie sie auf der Leitung steht. Alles läuft in Ihrem Browser.

## Die PRI-Formel

Der PRI-Wert verbindet eine Facility und einen Schweregrad mit der Arithmetik, die RFC 5424 festlegt:

    PRI = Facility * 8 + Severity
    Facility = PRI / 8   (integer division)
    Severity = PRI % 8

Weil der Schweregrad nur die unteren drei Bits belegt, lässt sich ein PRI-Wert auf einen Blick lesen, sobald man die Teile kennt. Der gültige Bereich reicht von 0 bis 191, da die Facility von 0 bis 23 und der Schweregrad von 0 bis 7 reicht.

## Facility und Schweregrad

- Die **Facility** (0 bis 23) benennt das Subsystem, das die Meldung erzeugt hat: den Kernel, das Mailsystem, das Authentifizierungssystem, den Syslog-Daemon selbst und so weiter, bis hin zu den acht Plätzen `local0` bis `local7`, die Netzwerkgeräte und Appliances typischerweise für ihre eigenen Meldungen nutzen.
- Der **Schweregrad** (0 bis 7) bewertet die Dringlichkeit, und zwar in der kontraintuitiven Richtung: 0 ist am schwersten (Emergency) und 7 am leichtesten (Debug), dazwischen Error bei 3 und Informational bei 6.

## Durchgerechnetes Beispiel

- `<134>` ergibt dekodiert Facility 16 (`local0`) und Schweregrad 6 (Informational), denn `134 = 16 * 8 + 6`. Genau dieser Wert ist ein üblicher Standard für Netzwerkgeräte, die Routineereignisse protokollieren.

## Verwendung

Geben Sie einen PRI-Wert ein, um ihn in Facility und Schweregrad zu zerlegen, oder wählen Sie Facility und Schweregrad aus, um den PRI-Wert und die Zeichenfolge `<PRI>` zu erhalten, die Sie auf der Leitung sehen würden. RFC 5424 legt das moderne Syslog-Format fest; das ältere BSD-Format in RFC 3164 verwendet dieselbe PRI-Arithmetik.

## Ergebnisse teilen

Unter dem Ergebnis erzeugt **Ergebnisse teilen** in beiden Modi einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält einen PRI-Wert und sonst nichts: im Dekodiermodus das Feld so, wie eingegeben (`#input=%3C34%3E`); im Kodiermodus den PRI-Wert, den Facility und Schweregrad ergeben, in seiner Form auf der Leitung (`#input=%3C134%3E` für local0 und informational), sodass sich der Link im Dekodiermodus mit derselben Facility und demselben Schweregrad öffnet. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ein PRI-Wert hat höchstens fünf Zeichen.
- **Öffnen eines Links.** Der Link ist dieselbe Adresse, die auch andere Links in dieses Tool verwenden: Der PRI-Wert füllt das Feld des Dekodiermodus wie bei der Eingabe. Wie bei jedem Link in dieses Tool bleibt der Wert nach dem `#`, bis Sie das Feld ändern oder leeren, und verschwindet dann ohne Anfrage aus der Adresse.
