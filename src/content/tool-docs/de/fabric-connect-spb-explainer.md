## Was das Tool tut

Geben Sie eine I-SID, einen SPB-Nickname oder eine Switch-Rolle an, und das Tool ordnet das Vokabular von Shortest Path Bridging für Sie: welches Backbone-VLAN den Dienst überträgt und warum, woran ein L2VSN und ein L3VSN tatsächlich gebunden sind, was ein B-VLAN ist und was nicht, und was sich zwischen einer Backbone Edge Bridge und einer Backbone Core Bridge ändert. Deterministisch und offline: Das Tool erklärt Kennungen, es fragt keine Fabric ab.

## Das Verhalten, das eine Prüfung wert ist

**Gerade I-SIDs laufen über das eine Backbone-VLAN, ungerade über das andere.** Mit den Standardwerten von Extreme, 4051 und 4052, wird I-SID 20010 über 4052 übertragen und 20011 über 4051. Zwei Shortest-Path-Trees, von denen jeder ungefähr die Hälfte der Dienste überträgt.

Das Tool sagt, dass dies **die Standardverteilung ist und keine Regel des Standards**, denn eine Umgebung kann anders zuweisen; und wenn sich ein Dienst anders verhält als seine Nachbarn, ist der Baum, auf dem er liegt, das Erste, was Sie prüfen sollten.

## Die Tatsache, die das Tool bei jedem Ergebnis wiederholt

**Ein B-VLAN ist kein VLAN.** Es flutet weder unbekannten Unicast noch Broadcast noch Multicast. Es leitet nur anhand von Backbone-MAC-Tabellen weiter, die IS-IS aus Shortest-Path-Trees bereitgestellt hat. Kein Spanning Tree, nichts blockiert.

Alles Weitere folgt daraus: Wird die Weiterleitung berechnet, lernt der Core nicht; lernt der Core nicht, muss er nicht wissen, dass es Ihre Dienste gibt. Deshalb **betrifft das Hinzufügen eines Dienstes nur die Edge-Switches, an denen er auftritt.**

## Welche Prüfungen das Tool vornimmt

Eine I-SID muss im 24-Bit-Bereich liegen, und das Tool lehnt Werte außerhalb davon ab, statt eine Zahl zu erklären, die es nicht geben kann. Ein Nickname muss die Form `x.xx.xx` haben, und ein fehlerhafter löst eine Warnung aus, denn **ein doppelter oder fehlerhafter Nickname ist einer der wenigen Fehler hier, die weit entfernt von der Stelle Schaden anrichten, an der er eingegeben wurde.**

## Was das Tool nicht tut

Es kann Ihre Fabric nicht sehen. Es kennt weder Ihre Topologie noch Ihre Nachbarschaften (Adjacencies), noch weiß es, ob IS-IS tatsächlich läuft. Es erklärt, was Ihre Zahlen innerhalb einer Fabric bedeuten, nicht, was Ihre Fabric gerade tut.

## Was das Tool vom Decoder für VOSS-Fabric-Kennungen unterscheidet

Beide nehmen eine I-SID und einen Nickname entgegen und beantworten verschiedene Fragen:

- **Der Decoder für Fabric-Kennungen validiert eine Kennung.** Fügen Sie etwas ein, und er ermittelt, ob es eine 24-Bit-I-SID, ein 20-Bit-Nickname oder eine System-ID ist und ob der Wert im zulässigen Bereich liegt.
- **Dieses Tool erklärt, was die Kennung in einer Fabric bedeutet.** Welches Backbone-VLAN sie überträgt und warum, woran ein L2VSN und ein L3VSN gebunden sind, was ein B-VLAN ist und was nicht, und was sich zwischen einer Edge Bridge und einer Core Bridge ändert.

Dort dekodieren Sie den Wert, hier verstehen Sie die Anordnung.

## Ergebnisse teilen

Unter „Was die Zahlen bedeuten“ erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` jedes Feld des Formulars so, wie eingegeben: `isid`, `primary`, `secondary` und `nickname` (ein leer gelassenes Feld enthält nichts und kommt leer an) sowie die beiden Auswahlfelder anhand ihrer ID, `service` und `role`. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

I-SIDs, B-VLANs, Nicknames und Rollen sind die Werte, die Sie eingeben, um zu sehen, wie die Fabric sie behandelt; nichts davon ist geheim.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird das Formular beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Öffnen eines Links.** Jedes Feld wird gesetzt, und die Seite erklärt es, wie bei der Eingabe; es wird nichts gesendet. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
