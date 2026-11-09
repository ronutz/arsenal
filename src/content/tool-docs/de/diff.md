## Was das Tool tut

Vergleichen Sie zwei Textblöcke und sehen Sie genau, was sich geändert hat: eine zeilenweise Ansicht der Hinzufügungen und Löschungen, mit Hervorhebung auf Wortebene in bearbeiteten Zeilen, sodass Sie die konkrete Änderung erkennen. Whitespace oder Groß- und Kleinschreibung lassen sich optional ignorieren. Alles wird in Ihrem Browser berechnet; Ihr Text wird nie gesendet.

## Wie ein Diff berechnet wird

Ein guter Diff ist kein naiver Vergleich Zeile für Zeile; er findet die kleinste Menge an Änderungen, die den ersten Text in den zweiten überführt. Dazu berechnet das Tool die **längste gemeinsame Teilfolge** (Longest Common Subsequence, LCS) der beiden Texte: die längste Folge von Token, die in beiden Texten in derselben Reihenfolge vorkommt. Was in dieser gemeinsamen Teilfolge liegt, ist unverändert; alles, was im ersten Text, aber nicht in der LCS steht, ist eine **Löschung**, und alles, was im zweiten Text, aber nicht in der LCS steht, eine **Einfügung**. Diese Idee bildet den Kern des klassischen Diff-Algorithmus von Myers, und sie ergibt ein minimales Edit-Skript: die wenigsten Hinzufügungen und Löschungen, die den Unterschied erklären.

## Zwei Ebenen: Zeilen und Wörter

Dieselbe LCS-Operation läuft in zwei Granularitäten. In der Hauptansicht sind die Token ganze Zeilen; das ergibt die vertraute Liste hinzugefügter und entfernter Zeilen. Für eine Zeile, die sich geändert hat, statt vollständig hinzugefügt oder entfernt zu werden, führt das Tool den Diff erneut aus, diesmal mit Wörtern, Leerzeichen und Satzzeichen als Token, und hebt nur die Teile der Zeile hervor, die sich tatsächlich unterscheiden. Erst diese Hervorhebung innerhalb der Zeile macht aus „diese Zeile hat sich geändert“ ein „dieses Wort hat sich geändert“.

## Determinismus

Sind zwei verschiedene Edit-Skripte gleich kurz, muss ein Diff eines davon wählen, und das Tool wählt immer auf dieselbe Weise (sind beide Richtungen gleich gut, bevorzugt es eine Löschung). Diese feste Regel für Gleichstände macht die Ausgabe deterministisch: Dieselben zwei Eingaben ergeben immer denselben Diff, unabhängig vom Timing oder von irgendetwas außerhalb.

## Verwendung

Fügen Sie den Originaltext auf der einen Seite und den geänderten Text auf der anderen ein, und lesen Sie die zeilenweisen Unterschiede mit den Hervorhebungen auf Wortebene. Schalten Sie „Whitespace ignorieren“ oder „Groß-/Kleinschreibung ignorieren“ ein, wenn es Ihnen um den Inhalt und nicht um die Formatierung geht.

## Ergebnisse teilen

Unter der Überschrift des Ergebnisses (oder unter „Keine Unterschiede gefunden.“, denn auch das ist eine Auswertung) erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` beide Texte so, wie eingefügt, „Original“ und „Geändert“, und die beiden Optionen. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Verglichene Texte können privat sein, daher bittet das Popover Sie, beide zu lesen, bevor Sie den Link senden. Die Texte bleiben so, wie eingefügt: Ein Wert, der in beiden Feldern ersetzt würde, könnte genau die Änderung verdecken, die Sie zeigen wollen. Bevor ein Link angeboten wird, wird der Text nach Zugangsdaten durchsucht, die ein Standard definiert: ein privater Schlüssel im PEM-Format, eine Zeile `Authorization` oder `Proxy-Authorization` mit beliebigem Schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitte 11.6.2 und 11.7.2: Der Wert „consists of credentials“), eine Zeile `Cookie` oder `Set-Cookie` mit einem Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitte 4.1.1 und 4.2.1), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1: Die Form „user:password“ „is deprecated“), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS; alle abgerufen am 01.11.2026. Findet sich eines davon, gibt es keinen Link: Das Popover nennt das Feld und die Zeile, und Sie setzen einen Platzhalter an seine Stelle und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur nach einem Secret aussieht (`db_password = ...`, ein `token=` in einer URL), blockiert den Link nicht; das Popover nennt den ersten solchen Wert, damit Sie ihn prüfen können.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` steht, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Beide Felder und beide Optionen werden so gesetzt, wie Sie sie setzen würden, und die Seite vergleicht. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
