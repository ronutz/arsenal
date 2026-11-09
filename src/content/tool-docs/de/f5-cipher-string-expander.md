## Was das Tool tut

Fügen Sie einen Cipher-String von F5 BIG-IP ein, und das Tool erklärt jedes Schlüsselwort und jeden Operator darin und markiert schwache oder veraltete Entscheidungen. Es liest den String, also den Wert des Felds `cipher` einer Cipher-Regel oder eines SSL-Profils, und macht aus seiner kompakten Syntax eine verständliche Beschreibung dessen, was er auswählt und in welcher Reihenfolge. Es läuft vollständig in Ihrem Browser.

## Wie ein F5-Cipher-String aufgebaut ist

Ein Cipher-String von BIG-IP ist eine geordnete Liste von Cipher-Sets, getrennt durch Doppelpunkt, Komma oder Whitespace, und die Reihenfolge zählt, weil sie die Präferenz des Servers ausdrückt. Innerhalb eines Sets werden Schlüsselwörter mit `+` verknüpft; `ECDHE+AES-GCM` steht also für die Cipher-Suiten, die sowohl ECDHE als auch AES-GCM sind. Die Schlüsselwörter benennen die Bestandteile einer Suite: die Protokollversion, den Schlüsselaustausch, die Authentifizierung, das Verschlüsselungsverfahren für die Nutzdaten und den MAC. `DEFAULT` steht für das eingebaute Standard-Set von F5, einen üblichen Ausgangspunkt.

## Die Operatoren, der knifflige Teil

Ein Set kann mit einem Operator beginnen, und der Unterschied zwischen ihnen ist wichtig:

- **`!`** schließt passende Cipher-Suiten dauerhaft aus; was auf diese Weise ausgeschlossen ist, kann kein späterer Ausdruck wieder hinzufügen.
- **`-`** löscht passende Cipher-Suiten, aber anders als bei `!` kann ein späterer Ausdruck sie wieder hinzufügen.
- **`+`** fügt nichts hinzu; es verschiebt passende Cipher-Suiten ans Ende und senkt so ihre Priorität.

Dazu sortiert `@STRENGTH` die ganze Liste nach Schlüssellänge um. Wer `!` mit `-` verwechselt oder vergisst, dass `+` umsortiert statt hinzuzufügen, erhält häufig einen Cipher-String, der nicht tut, was sein Autor wollte, und genau das macht das Tool sichtbar.

## Die Sicherheitsbewertung und eine ehrliche Grenze

Das Tool markiert schwache und veraltete Elemente, etwa Cipher-Suiten in Exportstärke, RC4 oder 3DES und überholte Protokollversionen, sodass ein riskanter String auffällt. Eines tut es bewusst nicht: Es gibt nicht die exakte, fertig sortierte Liste der Cipher-Suiten wieder, die ein bestimmtes BIG-IP erzeugen würde, denn die hängt von der Cipher-Tabelle der jeweiligen Softwareversion auf dem Gerät ab. Das Tool erklärt den String; es ersetzt nicht das Gerät.

## Verwendung

Fügen Sie einen Cipher-String aus einer Cipher-Regel oder einem SSL-Profil ein und lesen Sie die Erklärung jedes Schlüsselworts und jedes Operators, mit markierten schwachen Entscheidungen. Die Analyse ist deterministisch und lokal.

## Ergebnisse teilen

Unter der Sicherheitsbewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Cipher-String oder Regelnamen so, wie eingegeben: `/tools/f5-cipher-string-expander#input=ECDHE%3ARSA%3A!SSLv3...`. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der String beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Öffnen eines Links.** Der String füllt das Feld wie beim Einfügen, und die Seite erklärt ihn. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
