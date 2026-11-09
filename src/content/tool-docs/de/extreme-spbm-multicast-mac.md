## Was das Tool tut

Es arbeitet in beide Richtungen. Geben Sie den Nickname eines Knotens und eine I-SID an, und es bildet die Gruppenadresse, die dieser Knoten für den Dienst verwendet. Fügen Sie eine Adresse aus `show isis spbm multicast-fib` ein, und es sagt Ihnen, zu wessen Baum der Eintrag gehört und welchen Dienst er überträgt.

## Die Regel

Eine SPBM-Gruppenadresse wird weder konfiguriert noch gelernt. Sie wird aus zwei Zahlen zusammengesetzt, die jeder Knoten bereits hat:

- **die ersten drei Bytes**: das feste Präfix `0x30000`, kombiniert mit dem 20-Bit-Nickname
- **die letzten drei Bytes**: die 24-Bit-I-SID

Nickname `0.00.10` mit I-SID 100 ergibt also `03:00:10:00:00:64`. Jeder Knoten im Shortest Path Tree berechnet dieselbe Adresse aus der Link-State-Datenbank, ohne dass man sie ihm mitteilt, und genau deshalb braucht SPBM kein MAC-Lernen im Backbone.

Dieselbe I-SID mit einem anderen Knoten als Wurzel ergibt eine andere Adresse: ein Baum pro Wurzel.

## Die Richtung, die sich lohnt

Das Lesen der Multicast-FIB. Sie ist eine Spalte aus Hexwerten, und die Frage ist immer dieselbe: Wessen Baum ist das, und welcher Dienst? Beide Antworten stecken in der Adresse. `03:00:41:00:04:4d` ist Nickname `0.00.41` mit I-SID 1101. Gleichen Sie den Nickname mit der Spalte SYSID oder HOST-NAME derselben Ausgabe ab, um dem Knoten einen Namen zuzuordnen.

## Eine Mehrdeutigkeit, offen benannt statt versteckt

Die Bits 16 und 17 gehören zum festen Präfix. Ein Nickname, dessen erstes Feld sie setzt, ergibt eine Adresse, die sich nicht eindeutig auf einen einzigen Nickname zurückführen lässt. Jedes dokumentierte Beispiel verwendet im ersten Feld eine 0. Geben Sie etwas anderes ein, bildet das Tool die Adresse und weist darauf hin, dass die Rückrichtung nicht verifiziert ist, statt einen Nickname zu liefern, für den es nicht einstehen kann.

## Ehrliche Grenzen

Das Tool berechnet nur die Gruppenadresse. Die Wahl der B-VID, der Shortest Path Tree selbst, die IS-IS-Nachbarschaft und die Unicast-Backbone-MAC liegen außerhalb des Umfangs; die Unicast-B-MAC ist die Chassis-Adresse und wird aus nichts abgeleitet. Die I-SID wird als Zahl behandelt; ob ein bestimmter Wert ein Layer-2-VSN oder ein Layer-3-VSN ist, ist eine Frage der Konfiguration, die das Tool nicht abbildet.

## Ergebnisse teilen

Unter der Adresse und ihrer Zusammenfassung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Felder der Aufgabe, aus der die Antwort stammt: Nickname und I-SID so, wie eingegeben (`nickname`, `isid`), für eine Adresse, die Sie gebildet haben, oder die Adresse so, wie eingegeben (`input`), für eine, die Sie zerlegt haben; ein Link enthält nie beides. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden die Felder beim Öffnen des Links nicht an den Server gesendet. Sie bleiben in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Öffnen eines Links.** Die Felder der Aufgabe werden gefüllt, und die Seite rechnet, wie bei der Eingabe; es wird nichts nachgeschlagen. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
